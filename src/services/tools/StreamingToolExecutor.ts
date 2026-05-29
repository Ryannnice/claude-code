// 类型依赖 { ToolUseBlock } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolUseBlock } from '@anthropic-ai/sdk/resources/index.mjs'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  REJECT_MESSAGE,
  withMemoryCorrectionHint,
} from 'src/utils/messages.js'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准工具调用的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 引入 findToolByName、Tools、ToolUseContext，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName, type Tools, type ToolUseContext } from '../../Tool.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
// 类型依赖 { AssistantMessage, Message } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { AssistantMessage, Message } from '../../types/message.js'
// 复用 createChildAbortController 工具函数，把通用处理留在 ../../utils/abortController.js 中维护。
import { createChildAbortController } from '../../utils/abortController.js'
// 引入 runToolUse，将 ./toolExecution.js 中已经封装好的能力接到本文件流程里。
import { runToolUse } from './toolExecution.js'

// MessageUpdate 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type MessageUpdate = {
  message?: Message
  newContext?: ToolUseContext
}

// ToolStatus 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolStatus = 'queued' | 'executing' | 'completed' | 'yielded'

// TrackedTool 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type TrackedTool = {
  id: string
  block: ToolUseBlock
  assistantMessage: AssistantMessage
  status: ToolStatus
  isConcurrencySafe: boolean
  promise?: Promise<void>
  results?: Message[]
  // Progress messages are stored separately and yielded immediately
  pendingProgress: Message[]
  // 这个回调绑定到 contextModifiers?: Array<(context: ToolUseContext) => ToolUseContext>，负责工具调用在该局部场景下的响应。
  contextModifiers?: Array<(context: ToolUseContext) => ToolUseContext>
}

/**
 * Executes tools as they stream in with concurrency control.
 * - Concurrent-safe tools can execute in parallel with other concurrent-safe tools
 * - Non-concurrent tools must execute alone (exclusive access)
 * - Results are buffered and emitted in the order tools were received
 */
// StreamingToolExecutor 聚合工具调用相关状态与操作，把同一职责的行为收束到类实例中。
export class StreamingToolExecutor {
  private tools: TrackedTool[] = []
  private toolUseContext: ToolUseContext
  private hasErrored = false
  private erroredToolDescription = ''
  // Child of toolUseContext.abortController. Fires when a Bash tool errors
  // so sibling subprocesses die immediately instead of running to completion.
  // Aborting this does NOT abort the parent — query.ts won't end the turn.
  private siblingAbortController: AbortController
  private discarded = false
  // Signal to wake up getRemainingResults when progress is available
  // 这个回调绑定到 private progressAvailableResolve?: () => void，负责工具调用在该局部场景下的响应。
  private progressAvailableResolve?: () => void

  // 构造函数初始化实例状态，确保工具调用后续方法读取到完整配置。
  constructor(
    private readonly toolDefinitions: Tools,
    private readonly canUseTool: CanUseToolFn,
    toolUseContext: ToolUseContext,
  ) {
    // 更新实例字段 toolUseContext 为 toolUseContext，同步工具调用的内部状态。
    this.toolUseContext = toolUseContext
    // 更新实例字段 siblingAbortController 为 createChildAbortController(，同步工具调用的内部状态。
    this.siblingAbortController = createChildAbortController(
      toolUseContext.abortController,
    )
  }

  /**
   * Discards all pending and in-progress tools. Called when streaming fallback
   * occurs and results from the failed attempt should be abandoned.
   * Queued tools won't start, and in-progress tools will receive synthetic errors.
   */
  // discard 使用 无 完成工具调用里的对应操作。
  discard(): void {
    // 更新实例字段 discarded 为 true，同步工具调用的内部状态。
    this.discarded = true
  }

  /**
   * Add a tool to the execution queue. Will start executing immediately if conditions allow.
   */
  // addTool 使用 block: ToolUseBlock, assistantMessage: AssistantM… 完成工具调用里的对应操作。
  addTool(block: ToolUseBlock, assistantMessage: AssistantMessage): void {
    // toolDefinition筛选`findToolByName`，供工具调用后续处理使用。
    const toolDefinition = findToolByName(this.toolDefinitions, block.name)
    // toolDefinition缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!toolDefinition) {
      // tools 集合追加新条目，保持收集顺序与输入顺序一致。
      this.tools.push({
        id: block.id,
        block,
        assistantMessage,
        status: 'completed',
        isConcurrencySafe: true,
        pendingProgress: [],
        results: [
          createUserMessage({
            content: [
              {
                type: 'tool_result',
                content: `<tool_use_error>Error: No such tool available: ${block.name}</tool_use_error>`,
                is_error: true,
                tool_use_id: block.id,
              },
            ],
            toolUseResult: `Error: No such tool available: ${block.name}`,
            sourceToolAssistantUUID: assistantMessage.uuid,
          }),
        ],
      })
      // 工具实现 Streaming Tool Executor在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // parsedInput保存`inputSchema.safeParse`，供工具调用后续处理使用。
    const parsedInput = toolDefinition.inputSchema.safeParse(block.input)
    // isConcurrencySafe标记工具实现 Streaming Tool Executor是否启用对应路径。
    const isConcurrencySafe = parsedInput?.success
      // 这个回调绑定到 ? (() => {，负责工具调用在该局部场景下的响应。
      ? (() => {
          // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
          try {
            // 返回 `Boolean(toolDefinition.isConcurrencySafe(parsedInput.data))`，作为工具调用这次计算的结果。
            return Boolean(toolDefinition.isConcurrencySafe(parsedInput.data))
          } catch {
            // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
            return false
          }
        })()
      : false
    // tools 集合追加新条目，保持收集顺序与输入顺序一致。
    this.tools.push({
      id: block.id,
      block,
      assistantMessage,
      status: 'queued',
      isConcurrencySafe,
      pendingProgress: [],
    })

    // 显式忽略 `this.processQueue()` 的返回值，只保留它触发的副作用。
    void this.processQueue()
  }

  /**
   * Check if a tool can execute based on current concurrency state
   */
  // 工具实现 Streaming Tool Executor在这里处理 `private canExecuteTool(isConcurrencySafe: boolean): boolean {`，完成这一小步状态转换。
  private canExecuteTool(isConcurrencySafe: boolean): boolean {
    // executingTools 集合筛选`tools.filter`，供工具调用后续处理使用。
    const executingTools = this.tools.filter(t => t.status === 'executing')
    // 返回 `(`，作为工具调用这次计算的结果。
    return (
      executingTools.length === 0 ||
      (isConcurrencySafe && executingTools.every(t => t.isConcurrencySafe))
    )
  }

  /**
   * Process the queue, starting tools when concurrency conditions allow
   */
  // 工具实现 Streaming Tool Executor在这里处理 `private async processQueue(): Promise<void> {`，完成这一小步状态转换。
  private async processQueue(): Promise<void> {
    // 按顺序遍历 `this.tools` 中的工具，逐个交给工具调用处理。
    for (const tool of this.tools) {
      // `tool.status` 与 `'queued'` 不一致时刷新派生状态，避免使用过期结果。
      if (tool.status !== 'queued') continue

      // 满足 `this.canExecuteTool(tool.isConcurrencySafe)` 时，工具调用执行该分支。
      if (this.canExecuteTool(tool.isConcurrencySafe)) {
        // 等待 `this.executeTool(tool)` 完成，再继续工具实现 Streaming Tool Executor的异步流程。
        await this.executeTool(tool)
      } else {
        // Can't execute this tool yet, and since we need to maintain order for non-concurrent tools, stop here
        // tool.isConcurrencySafe缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!tool.isConcurrencySafe) break
      }
    }
  }

  // 工具实现 Streaming Tool Executor在这里处理 `private createSyntheticErrorMessage(`，完成这一小步状态转换。
  private createSyntheticErrorMessage(
    toolUseId: string,
    reason: 'sibling_error' | 'user_interrupted' | 'streaming_fallback',
    assistantMessage: AssistantMessage,
  ): Message {
    // For user interruptions (ESC to reject), use REJECT_MESSAGE so the UI shows
    // "User rejected edit" instead of "Error editing file"
    // 当 `reason` 匹配 `'user_interrupted'` 时，工具调用执行对应分支。
    if (reason === 'user_interrupted') {
      // 返回 `createUserMessage({`，作为工具调用这次计算的结果。
      return createUserMessage({
        content: [
          {
            type: 'tool_result',
            content: withMemoryCorrectionHint(REJECT_MESSAGE),
            is_error: true,
            tool_use_id: toolUseId,
          },
        ],
        toolUseResult: 'User rejected tool use',
        sourceToolAssistantUUID: assistantMessage.uuid,
      })
    }
    // 当 `reason` 匹配 `'streaming_fallback'` 时，工具调用执行对应分支。
    if (reason === 'streaming_fallback') {
      // 返回 `createUserMessage({`，作为工具调用这次计算的结果。
      return createUserMessage({
        content: [
          {
            type: 'tool_result',
            content:
              '<tool_use_error>Error: Streaming fallback - tool execution discarded</tool_use_error>',
            is_error: true,
            tool_use_id: toolUseId,
          },
        ],
        toolUseResult: 'Streaming fallback - tool execution discarded',
        sourceToolAssistantUUID: assistantMessage.uuid,
      })
    }
    // desc 命名 `this.erroredToolDescription`，让后续代码直接表达这个值的用途。
    const desc = this.erroredToolDescription
    // 消息保存`desc`，供工具实现 Streaming Tool Executor后续判断或输出使用。
    const msg = desc
      ? `Cancelled: parallel tool call ${desc} errored`
      : 'Cancelled: parallel tool call errored'
    // 返回 `createUserMessage({`，作为工具调用这次计算的结果。
    return createUserMessage({
      content: [
        {
          type: 'tool_result',
          content: `<tool_use_error>${msg}</tool_use_error>`,
          is_error: true,
          tool_use_id: toolUseId,
        },
      ],
      toolUseResult: msg,
      sourceToolAssistantUUID: assistantMessage.uuid,
    })
  }

  /**
   * Determine why a tool should be cancelled.
   */
  // 工具实现 Streaming Tool Executor在这里处理 `private getAbortReason(`，完成这一小步状态转换。
  private getAbortReason(
    tool: TrackedTool,
  ): 'sibling_error' | 'user_interrupted' | 'streaming_fallback' | null {
    // 满足 `this.discarded` 时，工具调用执行该分支。
    if (this.discarded) {
      // 返回 `'streaming_fallback'`，作为工具调用这次计算的结果。
      return 'streaming_fallback'
    }
    // 满足 `this.hasErrored` 时，工具调用执行该分支。
    if (this.hasErrored) {
      // 返回 `'sibling_error'`，作为工具调用这次计算的结果。
      return 'sibling_error'
    }
    // 满足 `this.toolUseContext.abortController.signal.aborted` 时，工具调用执行该分支。
    if (this.toolUseContext.abortController.signal.aborted) {
      // 'interrupt' means the user typed a new message while tools were
      // running. Only cancel tools whose interruptBehavior is 'cancel';
      // 'block' tools shouldn't reach here (abort isn't fired).
      // 满足 `this.toolUseContext.abortController.signal.reason` 时，工具调用执行该分支。
      if (this.toolUseContext.abortController.signal.reason === 'interrupt') {
        // 返回 `this.getToolInterruptBehavior(tool) === 'cancel'`，作为工具调用这次计算的结果。
        return this.getToolInterruptBehavior(tool) === 'cancel'
          ? 'user_interrupted'
          : null
      }
      // 返回 `'user_interrupted'`，作为工具调用这次计算的结果。
      return 'user_interrupted'
    }
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }

  // 工具实现 Streaming Tool Executor在这里处理 `private getToolInterruptBehavior(tool: TrackedTool): 'cancel' | 'block'...`，完成这一小步状态转换。
  private getToolInterruptBehavior(tool: TrackedTool): 'cancel' | 'block' {
    // definition筛选`findToolByName`，供工具调用后续处理使用。
    const definition = findToolByName(this.toolDefinitions, tool.block.name)
    // 满足 `!definition?.interruptBehavior` 时，工具调用执行该分支。
    if (!definition?.interruptBehavior) return 'block'
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 返回 `definition.interruptBehavior()`，作为工具调用这次计算的结果。
      return definition.interruptBehavior()
    } catch {
      // 返回 `'block'`，作为工具调用这次计算的结果。
      return 'block'
    }
  }

  // 工具实现 Streaming Tool Executor在这里处理 `private getToolDescription(tool: TrackedTool): string {`，完成这一小步状态转换。
  private getToolDescription(tool: TrackedTool): string {
    // 用户输入保存`tool.block.input as Record<string, unknown> | undefined`，供工具实现 Streaming Tool Executor后续判断或输出使用。
    const input = tool.block.input as Record<string, unknown> | undefined
    // summary 命名 `input?.command ?? input?.file_path ?? input?.pattern ?? ''`，让后续代码直接表达这个值的用途。
    const summary = input?.command ?? input?.file_path ?? input?.pattern ?? ''
    // 只有 `typeof summary === 'string' && summary.length > 0` 满足时，工具调用才执行该分支。
    if (typeof summary === 'string' && summary.length > 0) {
      // truncated 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const truncated =
        summary.length > 40 ? summary.slice(0, 40) + '\u2026' : summary
      // 返回 ``${tool.block.name}(${truncated})``，作为工具调用这次计算的结果。
      return `${tool.block.name}(${truncated})`
    }
    // 返回 `tool.block.name`，作为工具调用这次计算的结果。
    return tool.block.name
  }

  // 工具实现 Streaming Tool Executor在这里处理 `private updateInterruptibleState(): void {`，完成这一小步状态转换。
  private updateInterruptibleState(): void {
    // executing筛选`tools.filter`，供工具调用后续处理使用。
    const executing = this.tools.filter(t => t.status === 'executing')
    // 工具实现 Streaming Tool Executor在这里处理 `this.toolUseContext.setHasInterruptibleToolInProgress?.(`，完成这一小步状态转换。
    this.toolUseContext.setHasInterruptibleToolInProgress?.(
      executing.length > 0 &&
        executing.every(t => this.getToolInterruptBehavior(t) === 'cancel'),
    )
  }

  /**
   * Execute a tool and collect its results
   */
  // 工具实现 Streaming Tool Executor在这里处理 `private async executeTool(tool: TrackedTool): Promise<void> {`，完成这一小步状态转换。
  private async executeTool(tool: TrackedTool): Promise<void> {
    // status 集合更新为 `'executing'`，确保工具调用后续读取最新状态。
    tool.status = 'executing'
    // this.toolUseContext.setInProgressToolUseIDs 写入新的状态值，使工具调用后续读取保持一致。
    this.toolUseContext.setInProgressToolUseIDs(prev =>
      new Set(prev).add(tool.id),
    )
    // 调用 this.updateInterruptibleState，触发工具调用此处需要的副作用。
    this.updateInterruptibleState()

    // 对话消息 从空数组开始收集，后续循环会按处理顺序追加条目。
    const messages: Message[] = []
    // 这个回调绑定到 const contextModifiers: Array<(context: ToolUseContext) => ToolUseContext> =，负责工具调用在该局部场景下的响应。
    const contextModifiers: Array<(context: ToolUseContext) => ToolUseContext> =
      []

    // collectResults 集合保存`async`，供工具调用后续处理使用。
    const collectResults = async () => {
      // If already aborted (by error or user), generate synthetic error block instead of running the tool
      // initialAbortReason读取`this.getAbortReason`，供工具调用后续处理使用。
      const initialAbortReason = this.getAbortReason(tool)
      // 满足 `initialAbortReason` 时，工具调用执行该分支。
      if (initialAbortReason) {
        // 对话消息追加新条目，保持收集顺序与输入顺序一致。
        messages.push(
          this.createSyntheticErrorMessage(
            tool.id,
            initialAbortReason,
            tool.assistantMessage,
          ),
        )
        // 结果列表更新为 `messages`，确保工具调用后续读取最新状态。
        tool.results = messages
        // contextModifiers 集合更新为 `contextModifiers`，确保工具调用后续读取最新状态。
        tool.contextModifiers = contextModifiers
        // status 集合更新为 `'completed'`，确保工具调用后续读取最新状态。
        tool.status = 'completed'
        // 调用 this.updateInterruptibleState，触发工具调用此处需要的副作用。
        this.updateInterruptibleState()
        // 工具实现 Streaming Tool Executor在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Per-tool child controller. Lets siblingAbortController kill running
      // subprocesses (Bash spawns listen to this signal) when a Bash error
      // cascades. Permission-dialog rejection also aborts this controller
      // (PermissionContext.ts cancelAndAbort) — that abort must bubble up to
      // the query controller so the query loop's post-tool abort check ends
      // the turn. Without bubble-up, ExitPlanMode "clear context + auto"
      // sends REJECT_MESSAGE to the model instead of aborting (#21056 regression).
      // toolAbortController构建`createChildAbortController`，供工具调用后续处理使用。
      const toolAbortController = createChildAbortController(
        this.siblingAbortController,
      )
      // 触发取消信号，通知工具调用中仍在等待的异步任务尽快停止。
      toolAbortController.signal.addEventListener(
        'abort',
        // 这个回调绑定到 () => {，负责工具调用在该局部场景下的响应。
        () => {
          // 工具调用在这里按实际状态进入对应分支。
          if (
            toolAbortController.signal.reason !== 'sibling_error' &&
            !this.toolUseContext.abortController.signal.aborted &&
            !this.discarded
          ) {
            // 触发取消信号，通知工具调用中仍在等待的异步任务尽快停止。
            this.toolUseContext.abortController.abort(
              toolAbortController.signal.reason,
            )
          }
        },
        { once: true },
      )

      // generator保存`runToolUse`，供工具调用后续处理使用。
      const generator = runToolUse(
        tool.block,
        tool.assistantMessage,
        this.canUseTool,
        { ...this.toolUseContext, abortController: toolAbortController },
      )

      // Track if this specific tool has produced an error result.
      // This prevents the tool from receiving a duplicate "sibling error"
      // message when it is the one that caused the error.
      // thisToolErrored 错误信息标记工具实现 Streaming Tool Executor是否启用对应路径。
      let thisToolErrored = false

      // 逐项读取 `generator` 中的update，按输入顺序推进工具调用。
      for await (const update of generator) {
        // Check if we were aborted by a sibling tool error or user interruption.
        // Only add the synthetic error if THIS tool didn't produce the error.
        // abortReason读取`this.getAbortReason`，供工具调用后续处理使用。
        const abortReason = this.getAbortReason(tool)
        // 只有 `abortReason && !thisToolErrored` 满足时，工具调用才执行该分支。
        if (abortReason && !thisToolErrored) {
          // 对话消息追加新条目，保持收集顺序与输入顺序一致。
          messages.push(
            this.createSyntheticErrorMessage(
              tool.id,
              abortReason,
              tool.assistantMessage,
            ),
          )
          // 结束这个分支或循环，避免工具调用继续落入后续路径。
          break
        }

        // isErrorResult 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isErrorResult =
          update.message.type === 'user' &&
          Array.isArray(update.message.message.content) &&
          update.message.message.content.some(
            // _更新为 `> _.type === 'tool_result' && _.is_error === true`，确保工具调用后续读取最新状态。
            _ => _.type === 'tool_result' && _.is_error === true,
          )

        // 满足 `isErrorResult` 时，工具调用执行该分支。
        if (isErrorResult) {
          // thisToolErrored 错误信息更新为 `true`，确保工具调用后续读取最新状态。
          thisToolErrored = true
          // Only Bash errors cancel siblings. Bash commands often have implicit
          // dependency chains (e.g. mkdir fails → subsequent commands pointless).
          // Read/WebFetch/etc are independent — one failure shouldn't nuke the rest.
          // 满足 `tool.block.name === BASH_TOOL_NAME` 时，工具调用执行该分支。
          if (tool.block.name === BASH_TOOL_NAME) {
            // 更新实例字段 hasErrored 为 true，同步工具调用的内部状态。
            this.hasErrored = true
            // 更新实例字段 erroredToolDescription 为 this.getToolDescription(tool)，同步工具调用的内部状态。
            this.erroredToolDescription = this.getToolDescription(tool)
            // 触发取消信号，通知工具调用中仍在等待的异步任务尽快停止。
            this.siblingAbortController.abort('sibling_error')
          }
        }

        // 满足 `update.message` 时，工具调用执行该分支。
        if (update.message) {
          // Progress messages go to pendingProgress for immediate yielding
          // 当 `update.message.type` 匹配 `'progress'` 时，工具调用执行对应分支。
          if (update.message.type === 'progress') {
            // pendingProgress 集合追加新条目，保持收集顺序与输入顺序一致。
            tool.pendingProgress.push(update.message)
            // Signal that progress is available
            // 满足 `this.progressAvailableResolve` 时，工具调用执行该分支。
            if (this.progressAvailableResolve) {
              // 调用 this.progressAvailableResolve，触发工具调用此处需要的副作用。
              this.progressAvailableResolve()
              // 更新实例字段 progressAvailableResolve 为 undefined，同步工具调用的内部状态。
              this.progressAvailableResolve = undefined
            }
          } else {
            // 对话消息追加新条目，保持收集顺序与输入顺序一致。
            messages.push(update.message)
          }
        }
        // 满足 `update.contextModifier` 时，工具调用执行该分支。
        if (update.contextModifier) {
          // contextModifiers 集合追加新条目，保持收集顺序与输入顺序一致。
          contextModifiers.push(update.contextModifier.modifyContext)
        }
      }
      // 结果列表更新为 `messages`，确保工具调用后续读取最新状态。
      tool.results = messages
      // contextModifiers 集合更新为 `contextModifiers`，确保工具调用后续读取最新状态。
      tool.contextModifiers = contextModifiers
      // status 集合更新为 `'completed'`，确保工具调用后续读取最新状态。
      tool.status = 'completed'
      // 调用 this.updateInterruptibleState，触发工具调用此处需要的副作用。
      this.updateInterruptibleState()

      // NOTE: we currently don't support context modifiers for concurrent
      //       tools. None are actively being used, but if we want to use
      //       them in concurrent tools, we need to support that here.
      // 只有 `!tool.isConcurrencySafe && contextModifiers.lengt` 满足时，工具调用才执行该分支。
      if (!tool.isConcurrencySafe && contextModifiers.length > 0) {
        // 按顺序遍历 `contextModifiers` 中的modifier，逐个交给工具调用处理。
        for (const modifier of contextModifiers) {
          // 更新实例字段 toolUseContext 为 modifier(this.toolUseContext)，同步工具调用的内部状态。
          this.toolUseContext = modifier(this.toolUseContext)
        }
      }
    }

    // promise 异步任务保存`collectResults`，供工具调用后续处理使用。
    const promise = collectResults()
    // promise 异步任务更新为 `promise`，确保工具调用后续读取最新状态。
    tool.promise = promise

    // Process more queue when done
    // 这个回调绑定到 void promise.finally(() => {，负责工具调用在该局部场景下的响应。
    void promise.finally(() => {
      // 显式忽略 `this.processQueue()` 的返回值，只保留它触发的副作用。
      void this.processQueue()
    })
  }

  /**
   * Get any completed results that haven't been yielded yet (non-blocking)
   * Maintains order where necessary
   * Also yields any pending progress messages immediately
   */
  // 满足 `this.discarded` 时，工具调用执行该分支。
  *getCompletedResults(): Generator<MessageUpdate, void> {
    // 满足 `this.discarded` 时，工具调用执行该分支。
    if (this.discarded) {
      // 工具实现 Streaming Tool Executor在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 按顺序遍历 `this.tools` 中的工具，逐个交给工具调用处理。
    for (const tool of this.tools) {
      // Always yield pending progress messages immediately, regardless of tool status
      // while 使用 tool.pendingProgress.length > 0 完成工具调用里的对应操作。
      while (tool.pendingProgress.length > 0) {
        // progressMessage 消息数据保存`pendingProgress.shift`，供工具调用后续处理使用。
        const progressMessage = tool.pendingProgress.shift()!
        // 生成器产出 `{ message: progressMessage, newContext: this.toolUseContext }`，把阶段性结果交给上层消费。
        yield { message: progressMessage, newContext: this.toolUseContext }
      }

      // 当 `tool.status` 匹配 `'yielded'` 时，工具调用执行对应分支。
      if (tool.status === 'yielded') {
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // 只有 `tool.status === 'completed' && tool.results` 满足时，工具调用才执行该分支。
      if (tool.status === 'completed' && tool.results) {
        // status 集合更新为 `'yielded'`，确保工具调用后续读取最新状态。
        tool.status = 'yielded'

        // 按顺序遍历 `tool.results` 中的消息，逐个交给工具调用处理。
        for (const message of tool.results) {
          // 生成器产出 `{ message, newContext: this.toolUseContext }`，把阶段性结果交给上层消费。
          yield { message, newContext: this.toolUseContext }
        }

        // 调用 markToolUseAsComplete，触发工具调用此处需要的副作用。
        markToolUseAsComplete(this.toolUseContext, tool.id)
      // 工具实现 Streaming Tool Executor在这里处理 `} else if (tool.status === 'executing' && !tool.isConcurrencySafe) {`，完成这一小步状态转换。
      } else if (tool.status === 'executing' && !tool.isConcurrencySafe) {
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      }
    }
  }

  /**
   * Check if any tool has pending progress messages
   */
  // 工具实现 Streaming Tool Executor在这里处理 `private hasPendingProgress(): boolean {`，完成这一小步状态转换。
  private hasPendingProgress(): boolean {
    // 返回 `this.tools.some(t => t.pendingProgress.length > 0)`，作为工具调用这次计算的结果。
    return this.tools.some(t => t.pendingProgress.length > 0)
  }

  /**
   * Wait for remaining tools and yield their results as they complete
   * Also yields progress messages as they become available
   */
  // 工具实现 Streaming Tool Executor在这里处理 `async *getRemainingResults(): AsyncGenerator<MessageUpdate, void> {`，完成这一小步状态转换。
  async *getRemainingResults(): AsyncGenerator<MessageUpdate, void> {
    // 满足 `this.discarded` 时，工具调用执行该分支。
    if (this.discarded) {
      // 工具实现 Streaming Tool Executor在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 只要 this.hasUnfinishedTools() 成立，就持续推进工具调用中的循环处理。
    while (this.hasUnfinishedTools()) {
      // 等待 `this.processQueue()` 完成，再继续工具实现 Streaming Tool Executor的异步流程。
      await this.processQueue()

      // 逐项读取 `this.getCompletedResults()` 中的结果，按输入顺序推进工具调用。
      for (const result of this.getCompletedResults()) {
        // 生成器产出 `result`，把阶段性结果交给上层消费。
        yield result
      }

      // If we still have executing tools but nothing completed, wait for any to complete
      // OR for progress to become available
      // 工具调用在这里按实际状态进入对应分支。
      if (
        this.hasExecutingTools() &&
        !this.hasCompletedResults() &&
        !this.hasPendingProgress()
      ) {
        // executingPromises 集合保存`this.tools`，供后续判断或组装使用。
        const executingPromises = this.tools
          // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
          .filter(t => t.status === 'executing' && t.promise)
          // 链式调用 map，继续加工上一行在工具调用中产生的数据。
          .map(t => t.promise!)

        // Also wait for progress to become available
        // progressPromise 异步任务封装成回调，供工具实现 Streaming Tool Executor在事件触发或异步步骤中调用。
        const progressPromise = new Promise<void>(resolve => {
          // 更新实例字段 progressAvailableResolve 为 resolve，同步工具调用的内部状态。
          this.progressAvailableResolve = resolve
        })

        // 满足 `executingPromises.length > 0` 时，工具调用执行该分支。
        if (executingPromises.length > 0) {
          // 等待 `Promise.race([...executingPromises, progressPromise])` 完成，再继续工具实现 Streaming Tool Executor的异步流程。
          await Promise.race([...executingPromises, progressPromise])
        }
      }
    }

    // 逐项读取 `this.getCompletedResults()` 中的结果，按输入顺序推进工具调用。
    for (const result of this.getCompletedResults()) {
      // 生成器产出 `result`，把阶段性结果交给上层消费。
      yield result
    }
  }

  /**
   * Check if there are any completed results ready to yield
   */
  // 工具实现 Streaming Tool Executor在这里处理 `private hasCompletedResults(): boolean {`，完成这一小步状态转换。
  private hasCompletedResults(): boolean {
    // 返回 `this.tools.some(t => t.status === 'completed')`，作为工具调用这次计算的结果。
    return this.tools.some(t => t.status === 'completed')
  }

  /**
   * Check if there are any tools still executing
   */
  // 工具实现 Streaming Tool Executor在这里处理 `private hasExecutingTools(): boolean {`，完成这一小步状态转换。
  private hasExecutingTools(): boolean {
    // 返回 `this.tools.some(t => t.status === 'executing')`，作为工具调用这次计算的结果。
    return this.tools.some(t => t.status === 'executing')
  }

  /**
   * Check if there are any unfinished tools
   */
  // 工具实现 Streaming Tool Executor在这里处理 `private hasUnfinishedTools(): boolean {`，完成这一小步状态转换。
  private hasUnfinishedTools(): boolean {
    // 返回 `this.tools.some(t => t.status !== 'yielded')`，作为工具调用这次计算的结果。
    return this.tools.some(t => t.status !== 'yielded')
  }

  /**
   * Get the current tool use context (may have been modified by context modifiers)
   */
  // getUpdatedContext不依赖额外参数，直接计算工具调用需要的结果。
  getUpdatedContext(): ToolUseContext {
    // 返回 `this.toolUseContext`，作为工具调用这次计算的结果。
    return this.toolUseContext
  }
}

// markToolUseAsComplete 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function markToolUseAsComplete(
  toolUseContext: ToolUseContext,
  toolUseID: string,
) {
  // toolUseContext.setInProgressToolUseIDs 写入新的状态值，使工具调用后续读取保持一致。
  toolUseContext.setInProgressToolUseIDs(prev => {
    // next保存`Set`，供工具调用后续处理使用。
    const next = new Set(prev)
    // 调用 next.delete，触发工具调用此处需要的副作用。
    next.delete(toolUseID)
    // 返回 `next`，作为工具调用这次计算的结果。
    return next
  })
}

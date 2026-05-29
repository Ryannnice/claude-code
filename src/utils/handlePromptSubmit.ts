// 类型依赖 { UUID } 来自 crypto，用于校准共享工具的数据契约。
import type { UUID } from 'crypto'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 src/services/analytics/metadata.js，用于校准共享工具的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from 'src/services/analytics/metadata.js'
// 引入 Command、getCommandName、isCommandEnabled，将 ../commands.js 中已经封装好的能力接到本文件流程里。
import { type Command, getCommandName, isCommandEnabled } from '../commands.js'
// 复用 selectableUserMessagesFilter 终端界面组件，避免在这里重复拼装显示逻辑。
import { selectableUserMessagesFilter } from '../components/MessageSelector.js'
// 类型依赖 { SpinnerMode } 来自 ../components/Spinner/types.js，用于校准共享工具的数据契约。
import type { SpinnerMode } from '../components/Spinner/types.js'
// 类型依赖 { QuerySource } 来自 ../constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from '../constants/querySource.js'
// 引入 expandPastedTextRefs、parseReferences，将 ../history.js 中已经封装好的能力接到本文件流程里。
import { expandPastedTextRefs, parseReferences } from '../history.js'
// 类型依赖 { CanUseToolFn } 来自 ../hooks/useCanUseTool.js，用于校准共享工具的数据契约。
import type { CanUseToolFn } from '../hooks/useCanUseTool.js'
// 类型依赖 { IDESelection } 来自 ../hooks/useIdeSelection.js，用于校准共享工具的数据契约。
import type { IDESelection } from '../hooks/useIdeSelection.js'
// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 类型依赖 { SetToolJSXFn } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { SetToolJSXFn } from '../Tool.js'
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../types/command.js，用于校准共享工具的数据契约。
import type { LocalJSXCommandOnDone } from '../types/command.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isValidImagePaste,
  type PromptInputMode,
  type QueuedCommand,
} from '../types/textInputTypes.js'
// 引入 createAbortController，将 ./abortController.js 中已经封装好的能力接到本文件流程里。
import { createAbortController } from './abortController.js'
// 类型依赖 { PastedContent } 来自 ./config.js，用于校准共享工具的数据契约。
import type { PastedContent } from './config.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 类型依赖 { EffortValue } 来自 ./effort.js，用于校准共享工具的数据契约。
import type { EffortValue } from './effort.js'
// 类型依赖 { FileHistoryState } 来自 ./fileHistory.js，用于校准共享工具的数据契约。
import type { FileHistoryState } from './fileHistory.js'
// 引入 fileHistoryEnabled、fileHistoryMakeSnapshot，将 ./fileHistory.js 中已经封装好的能力接到本文件流程里。
import { fileHistoryEnabled, fileHistoryMakeSnapshot } from './fileHistory.js'
// 引入 gracefulShutdownSync，将 ./gracefulShutdown.js 中已经封装好的能力接到本文件流程里。
import { gracefulShutdownSync } from './gracefulShutdown.js'
// 引入 enqueue，将 ./messageQueueManager.js 中已经封装好的能力接到本文件流程里。
import { enqueue } from './messageQueueManager.js'
// 引入 resolveSkillModelOverride，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { resolveSkillModelOverride } from './model/model.js'
// 类型依赖 { ProcessUserInputContext } 来自 ./processUserInput/processUserInput.js，用于校准共享工具的数据契约。
import type { ProcessUserInputContext } from './processUserInput/processUserInput.js'
// 引入 processUserInput，将 ./processUserInput/processUserInput.js 中已经封装好的能力接到本文件流程里。
import { processUserInput } from './processUserInput/processUserInput.js'
// 类型依赖 { QueryGuard } 来自 ./QueryGuard.js，用于校准共享工具的数据契约。
import type { QueryGuard } from './QueryGuard.js'
// 引入 queryCheckpoint、startQueryProfile，将 ./queryProfiler.js 中已经封装好的能力接到本文件流程里。
import { queryCheckpoint, startQueryProfile } from './queryProfiler.js'
// 引入 runWithWorkload，将 ./workloadContext.js 中已经封装好的能力接到本文件流程里。
import { runWithWorkload } from './workloadContext.js'

// exit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function exit(): void {
  // 调用 gracefulShutdownSync，触发共享工具此处需要的副作用。
  gracefulShutdownSync(0)
}

// BaseExecutionParams 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BaseExecutionParams = {
  queuedCommands?: QueuedCommand[]
  messages: Message[]
  mainLoopModel: string
  ideSelection: IDESelection | undefined
  querySource: QuerySource
  commands: Command[]
  queryGuard: QueryGuard
  /**
   * True when external loading (remote session, foregrounded background task)
   * is active. These don't route through queryGuard, so the queue check must
   * account for them separately. Omit (defaults to false) for the dequeue path
   * (executeQueuedInput) — dequeued items were already queued past this check.
   */
  isExternalLoading?: boolean
  setToolJSX: SetToolJSXFn
  // 共享工具 handle Prompt Submit在这里处理 `getToolUseContext: (`，完成这一小步状态转换。
  getToolUseContext: (
    messages: Message[],
    newMessages: Message[],
    abortController: AbortController,
    mainLoopModel: string,
  ) => ProcessUserInputContext
  // 这个回调绑定到 setUserInputOnProcessing: (prompt?: string) => void，负责共享工具在该局部场景下的响应。
  setUserInputOnProcessing: (prompt?: string) => void
  // 这个回调绑定到 setAbortController: (abortController: AbortController | null) => void，负责共享工具在该局部场景下的响应。
  setAbortController: (abortController: AbortController | null) => void
  // 共享工具 handle Prompt Submit在这里处理 `onQuery: (`，完成这一小步状态转换。
  onQuery: (
    newMessages: Message[],
    abortController: AbortController,
    shouldQuery: boolean,
    additionalAllowedTools: string[],
    mainLoopModel: string,
    // 这个回调绑定到 onBeforeQuery?: (input: string, newMessages: Message[]) => Promise<boolean>,，负责共享工具在该局部场景下的响应。
    onBeforeQuery?: (input: string, newMessages: Message[]) => Promise<boolean>,
    input?: string,
    effort?: EffortValue,
  ) => Promise<void>
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void
  onBeforeQuery?: (input: string, newMessages: Message[]) => Promise<boolean>
  canUseTool?: CanUseToolFn
}

/**
 * Parameters for core execution logic (no UI concerns).
 */
// ExecuteUserInputParams 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ExecuteUserInputParams = BaseExecutionParams & {
  // 这个回调绑定到 resetHistory: () => void，负责共享工具在该局部场景下的响应。
  resetHistory: () => void
  // 这个回调绑定到 onInputChange: (value: string) => void，负责共享工具在该局部场景下的响应。
  onInputChange: (value: string) => void
}

// PromptInputHelpers 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PromptInputHelpers = {
  // 这个回调绑定到 setCursorOffset: (offset: number) => void，负责共享工具在该局部场景下的响应。
  setCursorOffset: (offset: number) => void
  // 这个回调绑定到 clearBuffer: () => void，负责共享工具在该局部场景下的响应。
  clearBuffer: () => void
  // 这个回调绑定到 resetHistory: () => void，负责共享工具在该局部场景下的响应。
  resetHistory: () => void
}

// HandlePromptSubmitParams 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HandlePromptSubmitParams = BaseExecutionParams & {
  // Direct user input path (set when called from onSubmit, absent for queue processor)
  input?: string
  mode?: PromptInputMode
  pastedContents?: Record<number, PastedContent>
  helpers: PromptInputHelpers
  // 这个回调绑定到 onInputChange: (value: string) => void，负责共享工具在该局部场景下的响应。
  onInputChange: (value: string) => void
  setPastedContents: React.Dispatch<
    React.SetStateAction<Record<number, PastedContent>>
  >
  abortController?: AbortController | null
  // 共享工具 handle Prompt Submit在这里处理 `addNotification?: (notification: {`，完成这一小步状态转换。
  addNotification?: (notification: {
    key: string
    text: string
    priority: 'low' | 'medium' | 'high' | 'immediate'
  }) => void
  // 这个回调绑定到 setMessages?: (updater: (prev: Message[]) => Message[]) => void，负责共享工具在该局部场景下的响应。
  setMessages?: (updater: (prev: Message[]) => Message[]) => void
  streamMode?: SpinnerMode
  hasInterruptibleToolInProgress?: boolean
  uuid?: UUID
  /**
   * When true, input starting with `/` is treated as plain text.
   * Used for remotely-received messages (bridge/CCR) that should not
   * trigger local slash commands or skills.
   */
  skipSlashCommands?: boolean
}

// handlePromptSubmit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function handlePromptSubmit(
  params: HandlePromptSubmitParams,
): Promise<void> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    helpers,
    queryGuard,
    isExternalLoading = false,
    commands,
    onInputChange,
    setPastedContents,
    setToolJSX,
    getToolUseContext,
    messages,
    mainLoopModel,
    ideSelection,
    setUserInputOnProcessing,
    setAbortController,
    onQuery,
    setAppState,
    onBeforeQuery,
    canUseTool,
    queuedCommands,
    uuid,
    skipSlashCommands,
  } = params

  // 从 `helpers` 解构 setCursorOffset、clearBuffer、resetHistory，减少共享工具 handle Prompt Submit对同一对象的重复访问。
  const { setCursorOffset, clearBuffer, resetHistory } = helpers

  // Queue processor path: commands are pre-validated and ready to execute.
  // Skip all input validation, reference parsing, and queuing logic.
  // 满足 `queuedCommands?.length` 时，共享工具执行该分支。
  if (queuedCommands?.length) {
    // 调用 startQueryProfile，触发共享工具此处需要的副作用。
    startQueryProfile()
    // 等待 `executeUserInput({` 完成，再继续共享工具 handle Prompt Submit的异步流程。
    await executeUserInput({
      queuedCommands,
      messages,
      mainLoopModel,
      ideSelection,
      querySource: params.querySource,
      commands,
      queryGuard,
      setToolJSX,
      getToolUseContext,
      setUserInputOnProcessing,
      setAbortController,
      onQuery,
      setAppState,
      onBeforeQuery,
      resetHistory,
      canUseTool,
      onInputChange,
    })
    // 共享工具 handle Prompt Submit在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 用户输入保存`params.input ?? ''`，供后续判断或组装使用。
  const input = params.input ?? ''
  // mode 命名 `params.mode ?? 'prompt'`，让后续代码直接表达这个值的用途。
  const mode = params.mode ?? 'prompt'
  // rawPastedContents 集合 命名 `params.pastedContents ?? {}`，让后续代码直接表达这个值的用途。
  const rawPastedContents = params.pastedContents ?? {}

  // Images are only sent if their [Image #N] placeholder is still in the text.
  // Deleting the inline pill drops the image; orphaned entries are filtered here.
  // referencedIds 集合保存`Set`，供共享工具后续处理使用。
  const referencedIds = new Set(parseReferences(input).map(r => r.id))
  // pastedContents 集合保存`Object.fromEntries`，供共享工具后续处理使用。
  const pastedContents = Object.fromEntries(
    Object.entries(rawPastedContents).filter(
      // 这个回调绑定到 ([, c]) => c.type !== 'image' || referencedIds.has(c.id),，负责共享工具在该局部场景下的响应。
      ([, c]) => c.type !== 'image' || referencedIds.has(c.id),
    ),
  )

  // hasImages 集合记录 `Object.values` 是否成立，共享工具随后按该结果分支。
  const hasImages = Object.values(pastedContents).some(isValidImagePaste)
  // 满足 `input.trim() === ''` 时，共享工具执行该分支。
  if (input.trim() === '') {
    // 共享工具 handle Prompt Submit在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Handle exit commands by triggering the exit command instead of direct process.exit
  // Skip for remote bridge messages — "exit" typed on iOS shouldn't kill the local session
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !skipSlashCommands &&
    ['exit', 'quit', ':q', ':q!', ':wq', ':wq!'].includes(input.trim())
  ) {
    // Trigger the exit command which will show the feedback dialog
    // exitCommand 命令数据筛选`commands.find`，供共享工具后续处理使用。
    const exitCommand = commands.find(cmd => cmd.name === 'exit')
    // 满足 `exitCommand` 时，共享工具执行该分支。
    if (exitCommand) {
      // Submit the /exit command instead - recursive call needs to be handled
      // 显式忽略 `handlePromptSubmit({` 的返回值，只保留它触发的副作用。
      void handlePromptSubmit({
        ...params,
        input: '/exit',
      })
    } else {
      // Fallback to direct exit if exit command not found
      // 调用 exit，触发共享工具此处需要的副作用。
      exit()
    }
    // 共享工具 handle Prompt Submit在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Parse references and replace with actual content early, before queueing
  // or immediate-command dispatch, so queued commands and immediate commands
  // both receive the expanded text from when it was submitted.
  // finalInput保存`expandPastedTextRefs`，供共享工具后续处理使用。
  const finalInput = expandPastedTextRefs(input, pastedContents)
  // pastedTextRefs 集合解析`parseReferences`，供共享工具后续处理使用。
  const pastedTextRefs = parseReferences(input).filter(
    // r更新为 `> pastedContents[r.id]?.type === 'text'`，确保共享工具后续读取最新状态。
    r => pastedContents[r.id]?.type === 'text',
  )
  // pastedTextCount 数量 命名 `pastedTextRefs.length`，让后续代码直接表达这个值的用途。
  const pastedTextCount = pastedTextRefs.length
  // pastedTextBytes 集合派生`pastedTextRefs.reduce`，供共享工具后续处理使用。
  const pastedTextBytes = pastedTextRefs.reduce(
    // 这个回调绑定到 (sum, r) => sum + (pastedContents[r.id]?.content.length ?? 0),，负责共享工具在该局部场景下的响应。
    (sum, r) => sum + (pastedContents[r.id]?.content.length ?? 0),
    0,
  )
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_paste_text', { pastedTextCount, pastedTextBytes })

  // Handle local-jsx immediate commands (e.g., /config, /doctor)
  // Skip for remote bridge messages — slash commands from CCR clients are plain text
  // 只有 `!skipSlashCommands && finalInput.trim().startsWith('/')` 满足时，共享工具才执行该分支。
  if (!skipSlashCommands && finalInput.trim().startsWith('/')) {
    // trimmedInput格式化`finalInput.trim`，供共享工具后续处理使用。
    const trimmedInput = finalInput.trim()
    // spaceIndex 索引格式化`trimmedInput.indexOf`，供共享工具后续处理使用。
    const spaceIndex = trimmedInput.indexOf(' ')
    // commandName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const commandName =
      spaceIndex === -1
        ? trimmedInput.slice(1)
        : trimmedInput.slice(1, spaceIndex)
    // commandArgs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const commandArgs =
      spaceIndex === -1 ? '' : trimmedInput.slice(spaceIndex + 1).trim()

    // immediateCommand 命令数据筛选`commands.find`，供共享工具后续处理使用。
    const immediateCommand = commands.find(
      // cmd 命令数据更新为 `>`，确保共享工具后续读取最新状态。
      cmd =>
        cmd.immediate &&
        isCommandEnabled(cmd) &&
        (cmd.name === commandName ||
          cmd.aliases?.includes(commandName) ||
          getCommandName(cmd) === commandName),
    )

    // 共享工具在这里按实际状态进入对应分支。
    if (
      immediateCommand &&
      immediateCommand.type === 'local-jsx' &&
      (queryGuard.isActive || isExternalLoading)
    ) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_immediate_command_executed', {
        commandName:
          immediateCommand.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      // Clear input
      // 调用 onInputChange，触发共享工具此处需要的副作用。
      onInputChange('')
      // setCursorOffset 写入新的状态值，使共享工具后续读取保持一致。
      setCursorOffset(0)
      // setPastedContents 写入新的状态值，使共享工具后续读取保持一致。
      setPastedContents({})
      // 调用 clearBuffer，触发共享工具此处需要的副作用。
      clearBuffer()

      // 上下文读取`getToolUseContext`，供共享工具后续处理使用。
      const context = getToolUseContext(
        messages,
        [],
        createAbortController(),
        mainLoopModel,
      )

      // doneWasCalled标记共享工具 handle Prompt Submit是否启用对应路径。
      let doneWasCalled = false
      // 这个回调绑定到 const onDone: LocalJSXCommandOnDone = (result, options) => {，负责共享工具在该局部场景下的响应。
      const onDone: LocalJSXCommandOnDone = (result, options) => {
        // doneWasCalled更新为 `true`，确保共享工具后续读取最新状态。
        doneWasCalled = true
        // Use clearLocalJSX to explicitly clear the local JSX command
        // setToolJSX 写入新的状态值，使共享工具后续读取保持一致。
        setToolJSX({
          jsx: null,
          shouldHidePromptInput: false,
          clearLocalJSX: true,
        })
        // `result && options?.display` 与 `'skip' && params.a` 不一致时刷新派生状态，避免使用过期结果。
        if (result && options?.display !== 'skip' && params.addNotification) {
          // 调用 params.addNotification，触发共享工具此处需要的副作用。
          params.addNotification({
            key: `immediate-${immediateCommand.name}`,
            text: result,
            priority: 'immediate',
          })
        }
        // 满足 `options?.nextInput` 时，共享工具执行该分支。
        if (options?.nextInput) {
          // 满足 `options.submitNextInput` 时，共享工具执行该分支。
          if (options.submitNextInput) {
            // 调用 enqueue，触发共享工具此处需要的副作用。
            enqueue({ value: options.nextInput, mode: 'prompt' })
          } else {
            // 调用 onInputChange，触发共享工具此处需要的副作用。
            onInputChange(options.nextInput)
          }
        }
      }

      // impl读取`immediateCommand.load`，供共享工具后续处理使用。
      const impl = await immediateCommand.load()
      // jsx保存`impl.call`，供共享工具后续处理使用。
      const jsx = await impl.call(onDone, context, commandArgs)

      // Skip if onDone already fired — prevents stuck isLocalJSXCommand
      // (see processSlashCommand.tsx local-jsx case for full mechanism).
      // 只有 `jsx && !doneWasCalled` 满足时，共享工具才执行该分支。
      if (jsx && !doneWasCalled) {
        // setToolJSX 写入新的状态值，使共享工具后续读取保持一致。
        setToolJSX({
          jsx,
          shouldHidePromptInput: false,
          isLocalJSXCommand: true,
          isImmediate: true,
        })
      }
      // 共享工具 handle Prompt Submit在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }

  // 只有 `queryGuard.isActive || isExternalLoading` 满足时，共享工具才执行该分支。
  if (queryGuard.isActive || isExternalLoading) {
    // Only allow prompt and bash mode commands to be queued
    // `mode` 与 `'prompt' && mode !== 'bash'` 不一致时刷新派生状态，避免使用过期结果。
    if (mode !== 'prompt' && mode !== 'bash') {
      // 共享工具 handle Prompt Submit在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Interrupt the current turn when all executing tools have
    // interruptBehavior 'cancel' (e.g. SleepTool).
    // 满足 `params.hasInterruptibleToolInProgress` 时，共享工具执行该分支。
    if (params.hasInterruptibleToolInProgress) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[interrupt] Aborting current turn: streamMode=${params.streamMode}`,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_cancel', {
        source:
          'interrupt_on_submit' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        streamMode:
          params.streamMode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 调用 params.abortController?.abort('interrupt')，完成这一处局部操作。
      params.abortController?.abort('interrupt')
    }

    // Enqueue with string value + raw pastedContents. Images will be resized
    // at execution time when processUserInput runs (not baked in here).
    // 调用 enqueue，触发共享工具此处需要的副作用。
    enqueue({
      value: finalInput.trim(),
      preExpansionValue: input.trim(),
      mode,
      pastedContents: hasImages ? pastedContents : undefined,
      skipSlashCommands,
      uuid,
    })

    // 调用 onInputChange，触发共享工具此处需要的副作用。
    onInputChange('')
    // setCursorOffset 写入新的状态值，使共享工具后续读取保持一致。
    setCursorOffset(0)
    // setPastedContents 写入新的状态值，使共享工具后续读取保持一致。
    setPastedContents({})
    // 调用 resetHistory，触发共享工具此处需要的副作用。
    resetHistory()
    // 调用 clearBuffer，触发共享工具此处需要的副作用。
    clearBuffer()
    // 共享工具 handle Prompt Submit在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Start query profiling for this query
  // 调用 startQueryProfile，触发共享工具此处需要的副作用。
  startQueryProfile()

  // Construct a QueuedCommand from the direct user input so both paths
  // go through the same executeUserInput loop. This ensures images get
  // resized via processUserInput regardless of how the command arrives.
  // cmd 命令数据 集中保存共享工具 handle Prompt Submit要一起传递的字段。
  const cmd: QueuedCommand = {
    value: finalInput,
    preExpansionValue: input,
    mode,
    pastedContents: hasImages ? pastedContents : undefined,
    skipSlashCommands,
    uuid,
  }

  // 等待 `executeUserInput({` 完成，再继续共享工具 handle Prompt Submit的异步流程。
  await executeUserInput({
    queuedCommands: [cmd],
    messages,
    mainLoopModel,
    ideSelection,
    querySource: params.querySource,
    commands,
    queryGuard,
    setToolJSX,
    getToolUseContext,
    setUserInputOnProcessing,
    setAbortController,
    onQuery,
    setAppState,
    onBeforeQuery,
    resetHistory,
    canUseTool,
    onInputChange,
  })
}

/**
 * Core logic for executing user input without UI side effects.
 *
 * All commands arrive as `queuedCommands`. First command gets full treatment
 * (attachments, ideSelection, pastedContents with image resizing). Commands 2-N
 * get `skipAttachments` to avoid duplicating turn-level context.
 */
// executeUserInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function executeUserInput(params: ExecuteUserInputParams): Promise<void> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    messages,
    mainLoopModel,
    ideSelection,
    querySource,
    queryGuard,
    setToolJSX,
    getToolUseContext,
    setUserInputOnProcessing,
    setAbortController,
    onQuery,
    setAppState,
    onBeforeQuery,
    resetHistory,
    canUseTool,
    queuedCommands,
  } = params

  // Note: paste references are already processed before calling this function
  // (either in handlePromptSubmit before queuing, or before initial execution).
  // Always create a fresh abort controller — queryGuard guarantees no concurrent
  // executeUserInput call, so there's no prior controller to inherit.
  // abortController构建`createAbortController`，供共享工具后续处理使用。
  const abortController = createAbortController()
  // setAbortController 写入新的状态值，使共享工具后续读取保持一致。
  setAbortController(abortController)

  // makeContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function makeContext(): ProcessUserInputContext {
    // 返回 `getToolUseContext(messages, [], abortController, mainLoopModel)`，作为共享工具这次计算的结果。
    return getToolUseContext(messages, [], abortController, mainLoopModel)
  }

  // Wrap in try-finally so the guard is released even if processUserInput
  // throws or onQuery is skipped. onQuery's finally calls queryGuard.end(),
  // which transitions running→idle; cancelReservation() below is a no-op in
  // that case (only acts on dispatching state).
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Reserve the guard BEFORE processUserInput — processBashCommand awaits
    // BashTool.call() and processSlashCommand awaits getMessagesForSlashCommand,
    // so the guard must be active during those awaits to ensure concurrent
    // handlePromptSubmit calls queue (via the isActive check above) instead
    // of starting a second executeUserInput. This call is a no-op if the
    // guard is already in dispatching (legacy queue-processor path).
    // 调用 queryGuard.reserve，触发共享工具此处需要的副作用。
    queryGuard.reserve()
    // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
    queryCheckpoint('query_process_user_input_start')

    // newMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const newMessages: Message[] = []
    // shouldQuery标记共享工具 handle Prompt Submit是否启用对应路径。
    let shouldQuery = false
    // allowedTools 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let allowedTools: string[] | undefined
    // 模型名称 先占位，稍后的条件分支会根据实际输入补齐它。
    let model: string | undefined
    // effort 先占位，稍后的条件分支会根据实际输入补齐它。
    let effort: EffortValue | undefined
    // nextInput 先占位，稍后的条件分支会根据实际输入补齐它。
    let nextInput: string | undefined
    // submitNextInput 先占位，稍后的条件分支会根据实际输入补齐它。
    let submitNextInput: boolean | undefined

    // Iterate all commands uniformly. First command gets attachments +
    // ideSelection + pastedContents, rest skip attachments to avoid
    // duplicating turn-level context (IDE selection, todos, diffs).
    // commands 命令数据 命名 `queuedCommands ?? []`，让后续代码直接表达这个值的用途。
    const commands = queuedCommands ?? []

    // Compute the workload tag for this turn. queueProcessor can batch a
    // cron prompt with a same-tick human prompt; only tag when EVERY
    // command agrees on the same non-undefined workload — a human in the
    // mix is actively waiting.
    // firstWorkload读取`commands[0]?.workload` 整理出中间结果，供共享工具 handle Prompt Submit后续步骤使用。
    const firstWorkload = commands[0]?.workload
    // turnWorkload 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const turnWorkload =
      firstWorkload !== undefined &&
      // 调用 commands.every，触发共享工具此处需要的副作用。
      commands.every(c => c.workload === firstWorkload)
        ? firstWorkload
        : undefined

    // Wrap the entire turn (processUserInput loop + onQuery) in an
    // AsyncLocalStorage context. This is the ONLY way to correctly
    // propagate workload across await boundaries: void-detached bg agents
    // (executeForkedSlashCommand, AgentTool) capture the ALS context at
    // invocation time, and every await inside them resumes in that
    // context — isolated from the parent's continuation. A process-global
    // mutable slot would be clobbered at the detached closure's first
    // await by this function's synchronous return path. See state.ts.
    // 这个回调绑定到 await runWithWorkload(turnWorkload, async () => {，负责共享工具在该局部场景下的响应。
    await runWithWorkload(turnWorkload, async () => {
      // 按索引扫描 `commands.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < commands.length; i++) {
        // cmd 命令数据读取 `commands[i]!` 对应条目，后续围绕该成员继续处理。
        const cmd = commands[i]!
        // isFirst标记共享工具 handle Prompt Submit是否启用对应路径。
        const isFirst = i === 0
        // 结果保存`processUserInput`，供共享工具后续处理使用。
        const result = await processUserInput({
          input: cmd.value,
          preExpansionInput: cmd.preExpansionValue,
          mode: cmd.mode,
          setToolJSX,
          context: makeContext(),
          pastedContents: isFirst ? cmd.pastedContents : undefined,
          messages,
          setUserInputOnProcessing: isFirst
            ? setUserInputOnProcessing
            : undefined,
          isAlreadyProcessing: !isFirst,
          querySource,
          canUseTool,
          uuid: cmd.uuid,
          ideSelection: isFirst ? ideSelection : undefined,
          skipSlashCommands: cmd.skipSlashCommands,
          bridgeOrigin: cmd.bridgeOrigin,
          isMeta: cmd.isMeta,
          skipAttachments: !isFirst,
        })
        // Stamp origin here rather than threading another arg through
        // processUserInput → processUserInputBase → processTextPrompt → createUserMessage.
        // Derive origin from mode for task-notifications — mirrors the origin
        // derivation at messages.ts (case 'queued_command'); intentionally
        // does NOT mirror its isMeta:true so idle-dequeued notifications stay
        // visible in the transcript via UserAgentNotificationMessage.
        // origin 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const origin =
          cmd.origin ??
          (cmd.mode === 'task-notification'
            ? ({ kind: 'task-notification' } as const)
            : undefined)
        // 满足 `origin` 时，共享工具执行该分支。
        if (origin) {
          // 按顺序遍历 `result.messages` 中的m，逐个交给共享工具处理。
          for (const m of result.messages) {
            // 当 `m.type` 匹配 `'user'` 时，共享工具执行对应分支。
            if (m.type === 'user') m.origin = origin
          }
        }
        // newMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        newMessages.push(...result.messages)
        // 满足 `isFirst` 时，共享工具执行该分支。
        if (isFirst) {
          // shouldQuery更新为 `result.shouldQuery`，确保共享工具后续读取最新状态。
          shouldQuery = result.shouldQuery
          // allowedTools 集合更新为 `result.allowedTools`，确保共享工具后续读取最新状态。
          allowedTools = result.allowedTools
          // 模型名称更新为 `result.model`，确保共享工具后续读取最新状态。
          model = result.model
          // effort更新为 `result.effort`，确保共享工具后续读取最新状态。
          effort = result.effort
          // nextInput更新为 `result.nextInput`，确保共享工具后续读取最新状态。
          nextInput = result.nextInput
          // submitNextInput更新为 `result.submitNextInput`，确保共享工具后续读取最新状态。
          submitNextInput = result.submitNextInput
        }
      }

      // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
      queryCheckpoint('query_process_user_input_end')
      // 满足 `fileHistoryEnabled()` 时，共享工具执行该分支。
      if (fileHistoryEnabled()) {
        // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
        queryCheckpoint('query_file_history_snapshot_start')
        // 调用 newMessages.filter，触发共享工具此处需要的副作用。
        newMessages.filter(selectableUserMessagesFilter).forEach(message => {
          // 显式忽略 `fileHistoryMakeSnapshot(` 的返回值，只保留它触发的副作用。
          void fileHistoryMakeSnapshot(
            // 这个回调绑定到 (updater: (prev: FileHistoryState) => FileHistoryState) => {，负责共享工具在该局部场景下的响应。
            (updater: (prev: FileHistoryState) => FileHistoryState) => {
              // setAppState 写入新的状态值，使共享工具后续读取保持一致。
              setAppState(prev => ({
                ...prev,
                fileHistory: updater(prev.fileHistory),
              }))
            },
            message.uuid,
          )
        })
        // 调用 queryCheckpoint，触发共享工具此处需要的副作用。
        queryCheckpoint('query_file_history_snapshot_end')
      }

      // 满足 `newMessages.length` 时，共享工具执行该分支。
      if (newMessages.length) {
        // History is now added in the caller (onSubmit) for direct user submissions.
        // This ensures queued command processing (notifications, already-queued user input)
        // doesn't add to history, since those either shouldn't be in history or were
        // already added when originally queued.
        // 调用 resetHistory，触发共享工具此处需要的副作用。
        resetHistory()
        // setToolJSX 写入新的状态值，使共享工具后续读取保持一致。
        setToolJSX({
          jsx: null,
          shouldHidePromptInput: false,
          clearLocalJSX: true,
        })

        // primaryCmd 命令数据 命名 `commands[0]`，让后续代码直接表达这个值的用途。
        const primaryCmd = commands[0]
        // primaryMode保存`primaryCmd?.mode ?? 'prompt'`，供后续判断或组装使用。
        const primaryMode = primaryCmd?.mode ?? 'prompt'
        // primaryInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const primaryInput =
          primaryCmd && typeof primaryCmd.value === 'string'
            ? primaryCmd.value
            : undefined
        // shouldCallBeforeQuery标记共享工具 handle Prompt Submit是否启用对应路径。
        const shouldCallBeforeQuery = primaryMode === 'prompt'
        // 等待 `onQuery(` 完成，再继续共享工具 handle Prompt Submit的异步流程。
        await onQuery(
          newMessages,
          abortController,
          shouldQuery,
          allowedTools ?? [],
          model
            ? resolveSkillModelOverride(model, mainLoopModel)
            : mainLoopModel,
          shouldCallBeforeQuery ? onBeforeQuery : undefined,
          primaryInput,
          effort,
        )
      } else {
        // Local slash commands that skip messages (e.g., /model, /theme).
        // Release the guard BEFORE clearing toolJSX to prevent spinner flash —
        // the spinner formula checks: (!toolJSX || showSpinner) && isLoading.
        // If we clear toolJSX while the guard is still reserved, spinner briefly
        // shows. The finally below also calls cancelReservation (no-op if idle).
        // 调用 queryGuard.cancelReservation，触发共享工具此处需要的副作用。
        queryGuard.cancelReservation()
        // setToolJSX 写入新的状态值，使共享工具后续读取保持一致。
        setToolJSX({
          jsx: null,
          shouldHidePromptInput: false,
          clearLocalJSX: true,
        })
        // 调用 resetHistory，触发共享工具此处需要的副作用。
        resetHistory()
        // setAbortController 写入新的状态值，使共享工具后续读取保持一致。
        setAbortController(null)
      }

      // Handle nextInput from commands that want to chain (e.g., /discover activation)
      // 满足 `nextInput` 时，共享工具执行该分支。
      if (nextInput) {
        // 满足 `submitNextInput` 时，共享工具执行该分支。
        if (submitNextInput) {
          // 调用 enqueue，触发共享工具此处需要的副作用。
          enqueue({ value: nextInput, mode: 'prompt' })
        } else {
          // 调用 params.onInputChange，触发共享工具此处需要的副作用。
          params.onInputChange(nextInput)
        }
      }
    }) // end runWithWorkload — ALS context naturally scoped, no finally needed
  } finally {
    // Safety net: release the guard reservation if processUserInput threw
    // or onQuery was skipped. No-op if onQuery already ran (guard is idle
    // via end(), or running — cancelReservation only acts on dispatching).
    // This is the single source of truth for releasing the reservation;
    // useQueueProcessor no longer needs its own .finally().
    // 调用 queryGuard.cancelReservation，触发共享工具此处需要的副作用。
    queryGuard.cancelReservation()
    // Safety net: clear the placeholder if processUserInput produced no
    // messages or threw — otherwise it would stay visible until the next
    // turn's resetLoadingState. Harmless when onQuery ran: setMessages grew
    // displayedMessages past the baseline, so REPL.tsx already hid it.
    // setUserInputOnProcessing 写入新的状态值，使共享工具后续读取保持一致。
    setUserInputOnProcessing(undefined)
  }
}

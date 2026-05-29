// 类型依赖 { ToolUseBlock } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolUseBlock } from '@anthropic-ai/sdk/resources/index.mjs'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准工具调用的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 引入 findToolByName、ToolUseContext，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName, type ToolUseContext } from '../../Tool.js'
// 类型依赖 { AssistantMessage, Message } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { AssistantMessage, Message } from '../../types/message.js'
// 复用 all 工具函数，把通用处理留在 ../../utils/generators.js 中维护。
import { all } from '../../utils/generators.js'
// 引入 MessageUpdateLazy、runToolUse，将 ./toolExecution.js 中已经封装好的能力接到本文件流程里。
import { type MessageUpdateLazy, runToolUse } from './toolExecution.js'

// getMaxToolUseConcurrency 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMaxToolUseConcurrency(): number {
  // 返回 `(`，作为工具调用这次计算的结果。
  return (
    parseInt(process.env.CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY || '', 10) || 10
  )
}

// MessageUpdate 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type MessageUpdate = {
  message?: Message
  newContext: ToolUseContext
}

// 工具实现 tool Orchestration在这里处理 `export async function* runTools(`，完成这一小步状态转换。
export async function* runTools(
  toolUseMessages: ToolUseBlock[],
  assistantMessages: AssistantMessage[],
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext,
): AsyncGenerator<MessageUpdate, void> {
  // currentContext 命名 `toolUseContext`，让后续代码直接表达这个值的用途。
  let currentContext = toolUseContext
  // 调用 for，触发工具调用此处需要的副作用。
  for (const { isConcurrencySafe, blocks } of partitionToolCalls(
    toolUseMessages,
    currentContext,
  )) {
    // 满足 `isConcurrencySafe` 时，工具调用执行该分支。
    if (isConcurrencySafe) {
      // queuedContextModifiers 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      const queuedContextModifiers: Record<
        string,
        // 这个回调绑定到 ((context: ToolUseContext) => ToolUseContext)[]，负责工具调用在该局部场景下的响应。
        ((context: ToolUseContext) => ToolUseContext)[]
      > = {}
      // Run read-only batch concurrently
      // 逐项读取 `runToolsConcurrently(` 中的update，按输入顺序推进工具实现 tool Orchestration。
      for await (const update of runToolsConcurrently(
        blocks,
        assistantMessages,
        canUseTool,
        currentContext,
      )) {
        // 满足 `update.contextModifier` 时，工具调用执行该分支。
        if (update.contextModifier) {
          // 从 `update.contextModifier` 解构 toolUseID、modifyContext，减少工具实现 tool Orchestration对同一对象的重复访问。
          const { toolUseID, modifyContext } = update.contextModifier
          // 满足 `!queuedContextModifiers[toolUseID]` 时，工具调用执行该分支。
          if (!queuedContextModifiers[toolUseID]) {
            // queuedContextModifiers[toolUseID更新为 `[]`，确保工具实现 tool Orchestration后续读取最新状态。
            queuedContextModifiers[toolUseID] = []
          }
          // 工具实现 tool Orchestration在这里处理 `queuedContextModifiers[toolUseID].push(modifyContext)`，完成这一小步状态转换。
          queuedContextModifiers[toolUseID].push(modifyContext)
        }
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: update.message,
          newContext: currentContext,
        }
      }
      // 按顺序遍历 `blocks` 中的block，逐个交给工具调用处理。
      for (const block of blocks) {
        // modifiers 集合读取 `queuedContextModifiers[block.id]` 对应条目，后续围绕该成员继续处理。
        const modifiers = queuedContextModifiers[block.id]
        // modifiers 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!modifiers) {
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }
        // 按顺序遍历 `modifiers` 中的modifier，逐个交给工具调用处理。
        for (const modifier of modifiers) {
          // currentContext更新为 `modifier(currentContext)`，确保工具调用后续读取最新状态。
          currentContext = modifier(currentContext)
        }
      }
      // 生成器产出 `{ newContext: currentContext }`，把阶段性结果交给上层消费。
      yield { newContext: currentContext }
    } else {
      // Run non-read-only batch serially
      // 逐项读取 `runToolsSerially(` 中的update，按输入顺序推进工具实现 tool Orchestration。
      for await (const update of runToolsSerially(
        blocks,
        assistantMessages,
        canUseTool,
        currentContext,
      )) {
        // 满足 `update.newContext` 时，工具调用执行该分支。
        if (update.newContext) {
          // currentContext更新为 `update.newContext`，确保工具调用后续读取最新状态。
          currentContext = update.newContext
        }
        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          message: update.message,
          newContext: currentContext,
        }
      }
    }
  }
}

// Batch 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type Batch = { isConcurrencySafe: boolean; blocks: ToolUseBlock[] }

/**
 * Partition tool calls into batches where each batch is either:
 * 1. A single non-read-only tool, or
 * 2. Multiple consecutive read-only tools
 */
// partitionToolCalls 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function partitionToolCalls(
  toolUseMessages: ToolUseBlock[],
  toolUseContext: ToolUseContext,
): Batch[] {
  // 返回 `toolUseMessages.reduce((acc: Batch[], toolUse) => {`，作为工具调用这次计算的结果。
  return toolUseMessages.reduce((acc: Batch[], toolUse) => {
    // 工具筛选`findToolByName`，供工具调用后续处理使用。
    const tool = findToolByName(toolUseContext.options.tools, toolUse.name)
    // parsedInput保存`inputSchema.safeParse`，供工具调用后续处理使用。
    const parsedInput = tool?.inputSchema.safeParse(toolUse.input)
    // isConcurrencySafe标记工具实现 tool Orchestration是否启用对应路径。
    const isConcurrencySafe = parsedInput?.success
      // 这个回调绑定到 ? (() => {，负责工具调用在该局部场景下的响应。
      ? (() => {
          // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
          try {
            // 返回 `Boolean(tool?.isConcurrencySafe(parsedInput.data))`，作为工具调用这次计算的结果。
            return Boolean(tool?.isConcurrencySafe(parsedInput.data))
          } catch {
            // If isConcurrencySafe throws (e.g., due to shell-quote parse failure),
            // treat as not concurrency-safe to be conservative
            // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
            return false
          }
        })()
      : false
    // 只有 `isConcurrencySafe && acc[acc.length - 1]?.isConcu` 满足时，工具调用才执行该分支。
    if (isConcurrencySafe && acc[acc.length - 1]?.isConcurrencySafe) {
      // 工具实现 tool Orchestration在这里处理 `acc[acc.length - 1]!.blocks.push(toolUse)`，完成这一小步状态转换。
      acc[acc.length - 1]!.blocks.push(toolUse)
    } else {
      // acc追加新条目，保持收集顺序与输入顺序一致。
      acc.push({ isConcurrencySafe, blocks: [toolUse] })
    }
    // 返回 `acc`，作为工具调用这次计算的结果。
    return acc
  }, [])
}

// 工具实现 tool Orchestration在这里处理 `async function* runToolsSerially(`，完成这一小步状态转换。
async function* runToolsSerially(
  toolUseMessages: ToolUseBlock[],
  assistantMessages: AssistantMessage[],
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext,
): AsyncGenerator<MessageUpdate, void> {
  // currentContext 命名 `toolUseContext`，让后续代码直接表达这个值的用途。
  let currentContext = toolUseContext

  // 按顺序遍历 `toolUseMessages` 中的toolUse，逐个交给工具调用处理。
  for (const toolUse of toolUseMessages) {
    // toolUseContext.setInProgressToolUseIDs 写入新的状态值，使工具调用后续读取保持一致。
    toolUseContext.setInProgressToolUseIDs(prev =>
      new Set(prev).add(toolUse.id),
    )
    // 逐项读取 `runToolUse(` 中的update，按输入顺序推进工具实现 tool Orchestration。
    for await (const update of runToolUse(
      toolUse,
      // 调用 assistantMessages.find，触发工具调用此处需要的副作用。
      assistantMessages.find(_ =>
        _.message.content.some(
          // _更新为 `> _.type === 'tool_use' && _.id === toolUse.id`，确保工具调用后续读取最新状态。
          _ => _.type === 'tool_use' && _.id === toolUse.id,
        ),
      )!,
      canUseTool,
      currentContext,
    )) {
      // 满足 `update.contextModifier` 时，工具调用执行该分支。
      if (update.contextModifier) {
        // currentContext更新为 `update.contextModifier.modifyContext(currentContext)`，确保工具调用后续读取最新状态。
        currentContext = update.contextModifier.modifyContext(currentContext)
      }
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        message: update.message,
        newContext: currentContext,
      }
    }
    // 调用 markToolUseAsComplete，触发工具调用此处需要的副作用。
    markToolUseAsComplete(toolUseContext, toolUse.id)
  }
}

// 工具实现 tool Orchestration在这里处理 `async function* runToolsConcurrently(`，完成这一小步状态转换。
async function* runToolsConcurrently(
  toolUseMessages: ToolUseBlock[],
  assistantMessages: AssistantMessage[],
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext,
): AsyncGenerator<MessageUpdateLazy, void> {
  // 生成器产出 `yield* all(`，把阶段性结果交给上层消费。
  yield* all(
    // 调用 toolUseMessages.map，触发工具调用此处需要的副作用。
    toolUseMessages.map(async function* (toolUse) {
      // toolUseContext.setInProgressToolUseIDs 写入新的状态值，使工具调用后续读取保持一致。
      toolUseContext.setInProgressToolUseIDs(prev =>
        new Set(prev).add(toolUse.id),
      )
      // 生成器产出 `yield* runToolUse(`，把阶段性结果交给上层消费。
      yield* runToolUse(
        toolUse,
        // 调用 assistantMessages.find，触发工具调用此处需要的副作用。
        assistantMessages.find(_ =>
          _.message.content.some(
            // _更新为 `> _.type === 'tool_use' && _.id === toolUse.id`，确保工具调用后续读取最新状态。
            _ => _.type === 'tool_use' && _.id === toolUse.id,
          ),
        )!,
        canUseTool,
        toolUseContext,
      )
      // 调用 markToolUseAsComplete，触发工具调用此处需要的副作用。
      markToolUseAsComplete(toolUseContext, toolUse.id)
    }),
    getMaxToolUseConcurrency(),
  )
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

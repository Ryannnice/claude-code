// 类型依赖 { UUID } 来自 crypto，用于校准命令处理的数据契约。
import type { UUID } from 'crypto'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  AGENT_COLORS,
  type AgentColorName,
} from '../../tools/AgentTool/agentColorManager.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getTranscriptPath,
  saveAgentColor,
} from '../../utils/sessionStorage.js'
// 复用 isTeammate 工具函数，把通用处理留在 ../../utils/teammate.js 中维护。
import { isTeammate } from '../../utils/teammate.js'

// RESET_ALIASES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const RESET_ALIASES = ['default', 'reset', 'none', 'gray', 'grey'] as const

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(
  onDone: LocalJSXCommandOnDone,
  context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<null> {
  // Teammates cannot set their own color
  // 满足 `isTeammate()` 时，命令处理执行该分支。
  if (isTeammate()) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(
      'Cannot set color: This session is a swarm teammate. Teammate colors are assigned by the team leader.',
      { display: 'system' },
    )
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // 只有 `!args || args.trim() === ''` 满足时，命令处理才执行该分支。
  if (!args || args.trim() === '') {
    // colorList 集合格式化`AGENT_COLORS.join`，供命令处理后续处理使用。
    const colorList = AGENT_COLORS.join(', ')
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(`Please provide a color. Available colors: ${colorList}, default`, {
      display: 'system',
    })
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // colorArg格式化`args.trim`，供命令处理后续处理使用。
  const colorArg = args.trim().toLowerCase()

  // Handle reset to default (gray)
  // 满足 `RESET_ALIASES.includes(colorArg as (typeof RESET_ALIASES)[number])` 时，命令处理执行该分支。
  if (RESET_ALIASES.includes(colorArg as (typeof RESET_ALIASES)[number])) {
    // sessionId 会话数据读取`getSessionId`，供命令处理后续处理使用。
    const sessionId = getSessionId() as UUID
    // fullPath 路径数据读取`getTranscriptPath`，供命令处理后续处理使用。
    const fullPath = getTranscriptPath()

    // Use "default" sentinel (not empty string) so truthiness guards
    // in sessionStorage.ts persist the reset across session restarts
    // 等待 `saveAgentColor(sessionId, 'default', fullPath)` 完成，再继续斜杠命令 color的异步流程。
    await saveAgentColor(sessionId, 'default', fullPath)

    // context.setAppState 写入新的状态值，使命令处理后续读取保持一致。
    context.setAppState(prev => ({
      ...prev,
      standaloneAgentContext: {
        ...prev.standaloneAgentContext,
        name: prev.standaloneAgentContext?.name ?? '',
        color: undefined,
      },
    }))

    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Session color reset to default', { display: 'system' })
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // 满足 `!AGENT_COLORS.includes(colorArg as AgentColorName)` 时，命令处理执行该分支。
  if (!AGENT_COLORS.includes(colorArg as AgentColorName)) {
    // colorList 集合格式化`AGENT_COLORS.join`，供命令处理后续处理使用。
    const colorList = AGENT_COLORS.join(', ')
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(
      `Invalid color "${colorArg}". Available colors: ${colorList}, default`,
      { display: 'system' },
    )
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // sessionId 会话数据读取`getSessionId`，供命令处理后续处理使用。
  const sessionId = getSessionId() as UUID
  // fullPath 路径数据读取`getTranscriptPath`，供命令处理后续处理使用。
  const fullPath = getTranscriptPath()

  // Save to transcript for persistence across sessions
  // 等待 `saveAgentColor(sessionId, colorArg, fullPath)` 完成，再继续斜杠命令 color的异步流程。
  await saveAgentColor(sessionId, colorArg, fullPath)

  // Update AppState for immediate effect
  // context.setAppState 写入新的状态值，使命令处理后续读取保持一致。
  context.setAppState(prev => ({
    ...prev,
    standaloneAgentContext: {
      ...prev.standaloneAgentContext,
      name: prev.standaloneAgentContext?.name ?? '',
      color: colorArg as AgentColorName,
    },
  }))

  // 调用 onDone，触发命令处理此处需要的副作用。
  onDone(`Session color set to: ${colorArg}`, { display: 'system' })
  // 返回 `null`，作为命令处理这次计算的结果。
  return null
}

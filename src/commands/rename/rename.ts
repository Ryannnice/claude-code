// 类型依赖 { UUID } 来自 crypto，用于校准命令处理的数据契约。
import type { UUID } from 'crypto'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getBridgeBaseUrlOverride,
  getBridgeTokenOverride,
} from '../../bridge/bridgeConfig.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
// 复用 getMessagesAfterCompactBoundary 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { getMessagesAfterCompactBoundary } from '../../utils/messages.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getTranscriptPath,
  saveAgentName,
  saveCustomTitle,
} from '../../utils/sessionStorage.js'
// 复用 isTeammate 工具函数，把通用处理留在 ../../utils/teammate.js 中维护。
import { isTeammate } from '../../utils/teammate.js'
// 引入 generateSessionName，将 ./generateSessionName.js 中已经封装好的能力接到本文件流程里。
import { generateSessionName } from './generateSessionName.js'

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(
  onDone: LocalJSXCommandOnDone,
  context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<null> {
  // Prevent teammates from renaming - their names are set by team leader
  // 满足 `isTeammate()` 时，命令处理执行该分支。
  if (isTeammate()) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(
      'Cannot rename: This session is a swarm teammate. Teammate names are set by the team leader.',
      { display: 'system' },
    )
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // newName 先占位，稍后的条件分支会根据实际输入补齐它。
  let newName: string
  // 只有 `!args || args.trim() === ''` 满足时，命令处理才执行该分支。
  if (!args || args.trim() === '') {
    // generated保存`generateSessionName`，供命令处理后续处理使用。
    const generated = await generateSessionName(
      getMessagesAfterCompactBoundary(context.messages),
      context.abortController.signal,
    )
    // generated缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!generated) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(
        'Could not generate a name: no conversation context yet. Usage: /rename <name>',
        { display: 'system' },
      )
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }
    // newName更新为 `generated`，确保斜杠命令后续读取最新状态。
    newName = generated
  } else {
    // newName更新为 `args.trim()`，确保斜杠命令后续读取最新状态。
    newName = args.trim()
  }

  // sessionId 会话数据读取`getSessionId`，供命令处理后续处理使用。
  const sessionId = getSessionId() as UUID
  // fullPath 路径数据读取`getTranscriptPath`，供命令处理后续处理使用。
  const fullPath = getTranscriptPath()

  // Always save the custom title (session name)
  // 等待 `saveCustomTitle(sessionId, newName, fullPath)` 完成，再继续斜杠命令 rename的异步流程。
  await saveCustomTitle(sessionId, newName, fullPath)

  // Sync title to bridge session on claude.ai/code (best-effort, non-blocking).
  // v2 env-less bridge stores cse_* in replBridgeSessionId —
  // updateBridgeSessionTitle retags internally for the compat endpoint.
  // appState 状态读取`context.getAppState`，供命令处理后续处理使用。
  const appState = context.getAppState()
  // bridgeSessionId 会话数据保存`appState.replBridgeSessionId`，供后续判断或组装使用。
  const bridgeSessionId = appState.replBridgeSessionId
  // 满足 `bridgeSessionId` 时，命令处理执行该分支。
  if (bridgeSessionId) {
    // tokenOverride读取`getBridgeTokenOverride`，供命令处理后续处理使用。
    const tokenOverride = getBridgeTokenOverride()
    // 显式忽略 `import('../../bridge/createSession.js').then(` 的返回值，只保留它触发的副作用。
    void import('../../bridge/createSession.js').then(
      // 这个回调绑定到 ({ updateBridgeSessionTitle }) =>，负责命令处理在该局部场景下的响应。
      ({ updateBridgeSessionTitle }) =>
        updateBridgeSessionTitle(bridgeSessionId, newName, {
          baseUrl: getBridgeBaseUrlOverride(),
          // 这个回调绑定到 getAccessToken: tokenOverride ? () => tokenOverride : undefined,，负责命令处理在该局部场景下的响应。
          getAccessToken: tokenOverride ? () => tokenOverride : undefined,
        // 这个回调绑定到 }).catch(() => {}),，负责命令处理在该局部场景下的响应。
        }).catch(() => {}),
    )
  }

  // Also persist as the session's agent name for prompt-bar display
  // 等待 `saveAgentName(sessionId, newName, fullPath)` 完成，再继续斜杠命令 rename的异步流程。
  await saveAgentName(sessionId, newName, fullPath)
  // context.setAppState 写入新的状态值，使命令处理后续读取保持一致。
  context.setAppState(prev => ({
    ...prev,
    standaloneAgentContext: {
      ...prev.standaloneAgentContext,
      name: newName,
    },
  }))

  // 调用 onDone，触发命令处理此处需要的副作用。
  onDone(`Session renamed to: ${newName}`, { display: 'system' })
  // 返回 `null`，作为命令处理这次计算的结果。
  return null
}

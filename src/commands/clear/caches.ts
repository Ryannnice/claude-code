/**
 * Session cache clearing utilities.
 * This module is imported at startup by main.tsx, so keep imports minimal.
 */
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  clearInvokedSkills,
  setLastEmittedDate,
} from '../../bootstrap/state.js'
// 引入 clearCommandsCache，将 ../../commands.js 中已经封装好的能力接到本文件流程里。
import { clearCommandsCache } from '../../commands.js'
// 引入 getSessionStartDate，将 ../../constants/common.js 中已经封装好的能力接到本文件流程里。
import { getSessionStartDate } from '../../constants/common.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getGitStatus,
  getSystemContext,
  getUserContext,
  setSystemPromptInjection,
} from '../../context.js'
// 引入 clearFileSuggestionCaches，将 ../../hooks/fileSuggestions.js 中已经封装好的能力接到本文件流程里。
import { clearFileSuggestionCaches } from '../../hooks/fileSuggestions.js'
// 引入 clearAllPendingCallbacks，将 ../../hooks/useSwarmPermissionPoller.js 中已经封装好的能力接到本文件流程里。
import { clearAllPendingCallbacks } from '../../hooks/useSwarmPermissionPoller.js'
// 接入 clearAllDumpState 服务层能力，把外部通信或共享状态交给 ../../services/api/dumpPrompts.js 处理。
import { clearAllDumpState } from '../../services/api/dumpPrompts.js'
// 接入 resetPromptCacheBreakDetection 服务层能力，把外部通信或共享状态交给 ../../services/api/promptCacheBreakDetection.js 处理。
import { resetPromptCacheBreakDetection } from '../../services/api/promptCacheBreakDetection.js'
// 接入 clearAllSessions 服务层能力，把外部通信或共享状态交给 ../../services/api/sessionIngress.js 处理。
import { clearAllSessions } from '../../services/api/sessionIngress.js'
// 接入 runPostCompactCleanup 服务层能力，把外部通信或共享状态交给 ../../services/compact/postCompactCleanup.js 处理。
import { runPostCompactCleanup } from '../../services/compact/postCompactCleanup.js'
// 接入 resetAllLSPDiagnosticState 服务层能力，把外部通信或共享状态交给 ../../services/lsp/LSPDiagnosticRegistry.js 处理。
import { resetAllLSPDiagnosticState } from '../../services/lsp/LSPDiagnosticRegistry.js'
// 接入 clearTrackedMagicDocs 服务层能力，把外部通信或共享状态交给 ../../services/MagicDocs/magicDocs.js 处理。
import { clearTrackedMagicDocs } from '../../services/MagicDocs/magicDocs.js'
// 引入 clearDynamicSkills，将 ../../skills/loadSkillsDir.js 中已经封装好的能力接到本文件流程里。
import { clearDynamicSkills } from '../../skills/loadSkillsDir.js'
// 复用 resetSentSkillNames 工具函数，把通用处理留在 ../../utils/attachments.js 中维护。
import { resetSentSkillNames } from '../../utils/attachments.js'
// 复用 clearCommandPrefixCaches 工具函数，把通用处理留在 ../../utils/bash/commands.js 中维护。
import { clearCommandPrefixCaches } from '../../utils/bash/commands.js'
// 复用 resetGetMemoryFilesCache 工具函数，把通用处理留在 ../../utils/claudemd.js 中维护。
import { resetGetMemoryFilesCache } from '../../utils/claudemd.js'
// 复用 clearRepositoryCaches 工具函数，把通用处理留在 ../../utils/detectRepository.js 中维护。
import { clearRepositoryCaches } from '../../utils/detectRepository.js'
// 复用 clearResolveGitDirCache 工具函数，把通用处理留在 ../../utils/git/gitFilesystem.js 中维护。
import { clearResolveGitDirCache } from '../../utils/git/gitFilesystem.js'
// 复用 clearStoredImagePaths 工具函数，把通用处理留在 ../../utils/imageStore.js 中维护。
import { clearStoredImagePaths } from '../../utils/imageStore.js'
// 复用 clearSessionEnvVars 工具函数，把通用处理留在 ../../utils/sessionEnvVars.js 中维护。
import { clearSessionEnvVars } from '../../utils/sessionEnvVars.js'

/**
 * Clear all session-related caches.
 * Call this when resuming a session to ensure fresh file/skill discovery.
 * This is a subset of what clearConversation does - it only clears caches
 * without affecting messages, session ID, or triggering hooks.
 *
 * @param preservedAgentIds - Agent IDs whose per-agent state should survive
 *   the clear (e.g., background tasks preserved across /clear). When non-empty,
 *   agentId-keyed state (invoked skills) is selectively cleared and requestId-keyed
 *   state (pending permission callbacks, dump state, cache-break tracking) is left
 *   intact since it cannot be safely scoped to the main session.
 */
// clearSessionCaches 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSessionCaches(
  preservedAgentIds: ReadonlySet<string> = new Set(),
): void {
  // hasPreserved标记命令处理斜杠命令 caches是否启用对应路径。
  const hasPreserved = preservedAgentIds.size > 0
  // Clear context caches
  // 调用 getUserContext.cache.clear?.()，完成这一处局部操作。
  getUserContext.cache.clear?.()
  // 调用 getSystemContext.cache.clear?.()，完成这一处局部操作。
  getSystemContext.cache.clear?.()
  // 调用 getGitStatus.cache.clear?.()，完成这一处局部操作。
  getGitStatus.cache.clear?.()
  // 调用 getSessionStartDate.cache.clear?.()，完成这一处局部操作。
  getSessionStartDate.cache.clear?.()
  // Clear file suggestion caches (for @ mentions)
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearFileSuggestionCaches()

  // Clear commands/skills cache
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearCommandsCache()

  // Clear prompt cache break detection state
  // 满足 `!hasPreserved) resetPromptCacheBreakDetection(` 时，命令处理执行该分支。
  if (!hasPreserved) resetPromptCacheBreakDetection()

  // Clear system prompt injection (cache breaker)
  // setSystemPromptInjection 写入新的状态值，使命令处理后续读取保持一致。
  setSystemPromptInjection(null)

  // Clear last emitted date so it's re-detected on next turn
  // setLastEmittedDate 写入新的状态值，使命令处理后续读取保持一致。
  setLastEmittedDate(null)

  // Run post-compaction cleanup (clears system prompt sections, microcompact tracking,
  // classifier approvals, speculative checks, and — for main-thread compacts — memory
  // files cache with load_reason 'compact').
  // 调用 runPostCompactCleanup，触发命令处理此处需要的副作用。
  runPostCompactCleanup()
  // Reset sent skill names so the skill listing is re-sent after /clear.
  // runPostCompactCleanup intentionally does NOT reset this (post-compact
  // re-injection costs ~4K tokens), but /clear wipes messages entirely so
  // the model needs the full listing again.
  // 调用 resetSentSkillNames，触发命令处理此处需要的副作用。
  resetSentSkillNames()
  // Override the memory cache reset with 'session_start': clearSessionCaches is called
  // from /clear and --resume/--continue, which are NOT compaction events. Without this,
  // the InstructionsLoaded hook would fire with load_reason 'compact' instead of
  // 'session_start' on the next getMemoryFiles() call.
  // 调用 resetGetMemoryFilesCache，触发命令处理此处需要的副作用。
  resetGetMemoryFilesCache('session_start')

  // Clear stored image paths cache
  // 调用 clearStoredImagePaths，触发命令处理此处需要的副作用。
  clearStoredImagePaths()

  // Clear all session ingress caches (lastUuidMap, sequentialAppendBySession)
  // 调用 clearAllSessions，触发命令处理此处需要的副作用。
  clearAllSessions()
  // Clear swarm permission pending callbacks
  // 满足 `!hasPreserved) clearAllPendingCallbacks(` 时，命令处理执行该分支。
  if (!hasPreserved) clearAllPendingCallbacks()

  // Clear tungsten session usage tracking
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，命令处理执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 显式忽略 `import('../../tools/TungstenTool/TungstenTool.js').then(` 的返回值，只保留它触发的副作用。
    void import('../../tools/TungstenTool/TungstenTool.js').then(
      // 这个回调绑定到 ({ clearSessionsWithTungstenUsage, resetInitializationState }) => {，负责命令处理在该局部场景下的响应。
      ({ clearSessionsWithTungstenUsage, resetInitializationState }) => {
        // 调用 clearSessionsWithTungstenUsage，触发命令处理此处需要的副作用。
        clearSessionsWithTungstenUsage()
        // 调用 resetInitializationState，触发命令处理此处需要的副作用。
        resetInitializationState()
      },
    )
  }
  // Clear attribution caches (file content cache, pending bash states)
  // Dynamic import to preserve dead code elimination for COMMIT_ATTRIBUTION feature flag
  // 满足 `feature('COMMIT_ATTRIBUTION')` 时，命令处理执行该分支。
  if (feature('COMMIT_ATTRIBUTION')) {
    // 显式忽略 `import('../../utils/attributionHooks.js').then(` 的返回值，只保留它触发的副作用。
    void import('../../utils/attributionHooks.js').then(
      // 这个回调绑定到 ({ clearAttributionCaches }) => clearAttributionCaches(),，负责命令处理在该局部场景下的响应。
      ({ clearAttributionCaches }) => clearAttributionCaches(),
    )
  }
  // Clear repository detection caches
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearRepositoryCaches()
  // Clear bash command prefix caches (Haiku-extracted prefixes)
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearCommandPrefixCaches()
  // Clear dump prompts state
  // 满足 `!hasPreserved) clearAllDumpState(` 时，命令处理执行该分支。
  if (!hasPreserved) clearAllDumpState()
  // Clear invoked skills cache (each entry holds full skill file content)
  // 调用 clearInvokedSkills，触发命令处理此处需要的副作用。
  clearInvokedSkills(preservedAgentIds)
  // Clear git dir resolution cache
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearResolveGitDirCache()
  // Clear dynamic skills (loaded from skill directories)
  // 调用 clearDynamicSkills，触发命令处理此处需要的副作用。
  clearDynamicSkills()
  // Clear LSP diagnostic tracking state
  // 调用 resetAllLSPDiagnosticState，触发命令处理此处需要的副作用。
  resetAllLSPDiagnosticState()
  // Clear tracked magic docs
  // 调用 clearTrackedMagicDocs，触发命令处理此处需要的副作用。
  clearTrackedMagicDocs()
  // Clear session environment variables
  // 调用 clearSessionEnvVars，触发命令处理此处需要的副作用。
  clearSessionEnvVars()
  // Clear WebFetch URL cache (up to 50MB of cached page content)
  // 显式忽略 `import('../../tools/WebFetchTool/utils.js').then(` 的返回值，只保留它触发的副作用。
  void import('../../tools/WebFetchTool/utils.js').then(
    // 这个回调绑定到 ({ clearWebFetchCache }) => clearWebFetchCache(),，负责命令处理在该局部场景下的响应。
    ({ clearWebFetchCache }) => clearWebFetchCache(),
  )
  // Clear ToolSearch description cache (full tool prompts, ~500KB for 50 MCP tools)
  // 显式忽略 `import('../../tools/ToolSearchTool/ToolSearchTool.js').then(` 的返回值，只保留它触发的副作用。
  void import('../../tools/ToolSearchTool/ToolSearchTool.js').then(
    // 这个回调绑定到 ({ clearToolSearchDescriptionCache }) => clearToolSearchDescriptionCache(),，负责命令处理在该局部场景下的响应。
    ({ clearToolSearchDescriptionCache }) => clearToolSearchDescriptionCache(),
  )
  // Clear agent definitions cache (accumulates per-cwd via EnterWorktreeTool)
  // 显式忽略 `import('../../tools/AgentTool/loadAgentsDir.js').then(` 的返回值，只保留它触发的副作用。
  void import('../../tools/AgentTool/loadAgentsDir.js').then(
    // 这个回调绑定到 ({ clearAgentDefinitionsCache }) => clearAgentDefinitionsCache(),，负责命令处理在该局部场景下的响应。
    ({ clearAgentDefinitionsCache }) => clearAgentDefinitionsCache(),
  )
  // Clear SkillTool prompt cache (accumulates per project root)
  // 这个回调绑定到 void import('../../tools/SkillTool/prompt.js').then(({ clearPromptCache }) =>，负责命令处理在该局部场景下的响应。
  void import('../../tools/SkillTool/prompt.js').then(({ clearPromptCache }) =>
    clearPromptCache(),
  )
}

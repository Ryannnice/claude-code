// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { QuerySource } 来自 ../../constants/querySource.js，用于校准服务层 post Compact Cleanup的数据契约。
import type { QuerySource } from '../../constants/querySource.js'
// 引入 clearSystemPromptSections，将 ../../constants/systemPromptSections.js 中已经封装好的能力接到本文件流程里。
import { clearSystemPromptSections } from '../../constants/systemPromptSections.js'
// 引入 getUserContext，将 ../../context.js 中已经封装好的能力接到本文件流程里。
import { getUserContext } from '../../context.js'
// 接入 clearSpeculativeChecks 工具实现，后续工具池会按权限和开关决定是否暴露。
import { clearSpeculativeChecks } from '../../tools/BashTool/bashPermissions.js'
// 复用 clearClassifierApprovals 工具函数，把通用处理留在 ../../utils/classifierApprovals.js 中维护。
import { clearClassifierApprovals } from '../../utils/classifierApprovals.js'
// 复用 resetGetMemoryFilesCache 工具函数，把通用处理留在 ../../utils/claudemd.js 中维护。
import { resetGetMemoryFilesCache } from '../../utils/claudemd.js'
// 复用 clearSessionMessagesCache 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { clearSessionMessagesCache } from '../../utils/sessionStorage.js'
// 复用 clearBetaTracingState 工具函数，把通用处理留在 ../../utils/telemetry/betaSessionTracing.js 中维护。
import { clearBetaTracingState } from '../../utils/telemetry/betaSessionTracing.js'
// 引入 resetMicrocompactState，将 ./microCompact.js 中已经封装好的能力接到本文件流程里。
import { resetMicrocompactState } from './microCompact.js'

/**
 * Run cleanup of caches and tracking state after compaction.
 * Call this after both auto-compact and manual /compact to free memory
 * held by tracking structures that are invalidated by compaction.
 *
 * Note: We intentionally do NOT clear invoked skill content here.
 * Skill content must survive across multiple compactions so that
 * createSkillAttachmentIfNeeded() can include the full skill text
 * in subsequent compaction attachments.
 *
 * querySource: pass the compacting query's source so we can skip
 * resets that would clobber main-thread module-level state. Subagents
 * (agent:*) run in the same process and share module-level state
 * (context-collapse store, getMemoryFiles one-shot hook flag,
 * getUserContext cache); resetting those when a SUBAGENT compacts
 * would corrupt the MAIN thread's state. All compaction callers should
 * pass querySource — undefined is only safe for callers that are
 * genuinely main-thread-only (/compact, /clear).
 */
// runPostCompactCleanup 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function runPostCompactCleanup(querySource?: QuerySource): void {
  // Subagents (agent:*) run in the same process and share module-level
  // state with the main thread. Only reset main-thread module-level state
  // (context-collapse, memory file cache) for main-thread compacts.
  // Same startsWith pattern as isMainThread (index.ts:188).
  // isMainThreadCompact 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isMainThreadCompact =
    querySource === undefined ||
    querySource.startsWith('repl_main_thread') ||
    querySource === 'sdk'

  // 调用 resetMicrocompactState，触发服务层 post Compact Cleanup此处需要的副作用。
  resetMicrocompactState()
  // 满足 `feature('CONTEXT_COLLAPSE')` 时，服务层 post Compact Cleanup执行该分支。
  if (feature('CONTEXT_COLLAPSE')) {
    // 满足 `isMainThreadCompact` 时，服务层 post Compact Cleanup执行该分支。
    if (isMainThreadCompact) {
      /* eslint-disable @typescript-eslint/no-require-imports */
      // 服务层 post Compact Cleanup在这里处理 `;(`，完成这一小步状态转换。
      ;(
        require('../contextCollapse/index.js') as typeof import('../contextCollapse/index.js')
      ).resetContextCollapse()
      /* eslint-enable @typescript-eslint/no-require-imports */
    }
  }
  // 满足 `isMainThreadCompact` 时，服务层 post Compact Cleanup执行该分支。
  if (isMainThreadCompact) {
    // getUserContext is a memoized outer layer wrapping getClaudeMds() →
    // getMemoryFiles(). If only the inner getMemoryFiles cache is cleared,
    // the next turn hits the getUserContext cache and never reaches
    // getMemoryFiles(), so the armed InstructionsLoaded hook never fires.
    // Manual /compact already clears this explicitly at its call sites;
    // auto-compact and reactive-compact did not — this centralizes the
    // clear so all compaction paths behave consistently.
    // 调用 getUserContext.cache.clear?.()，完成这一处局部操作。
    getUserContext.cache.clear?.()
    // 调用 resetGetMemoryFilesCache，触发服务层 post Compact Cleanup此处需要的副作用。
    resetGetMemoryFilesCache('compact')
  }
  // 调用 clearSystemPromptSections，触发服务层 post Compact Cleanup此处需要的副作用。
  clearSystemPromptSections()
  // 调用 clearClassifierApprovals，触发服务层 post Compact Cleanup此处需要的副作用。
  clearClassifierApprovals()
  // 调用 clearSpeculativeChecks，触发服务层 post Compact Cleanup此处需要的副作用。
  clearSpeculativeChecks()
  // Intentionally NOT calling resetSentSkillNames(): re-injecting the full
  // skill_listing (~4K tokens) post-compact is pure cache_creation. The
  // model still has SkillTool in schema, invoked_skills preserves used
  // skills, and dynamic additions are handled by skillChangeDetector /
  // cacheUtils resets. See compactConversation() for full rationale.
  // 调用 clearBetaTracingState，触发服务层 post Compact Cleanup此处需要的副作用。
  clearBetaTracingState()
  // 满足 `feature('COMMIT_ATTRIBUTION')` 时，服务层 post Compact Cleanup执行该分支。
  if (feature('COMMIT_ATTRIBUTION')) {
    // 这个回调绑定到 void import('../../utils/attributionHooks.js').then(m =>，负责服务层 post Compact Cleanup在该局部场景下的响应。
    void import('../../utils/attributionHooks.js').then(m =>
      m.sweepFileContentCache(),
    )
  }
  // 清理相关缓存，确保服务层 post Compact Cleanup下一次读取时重新加载最新数据。
  clearSessionMessagesCache()
}

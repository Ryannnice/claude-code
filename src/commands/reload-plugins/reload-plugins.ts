// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js'
// 接入 redownloadUserSettings 服务层能力，把外部通信或共享状态交给 ../../services/settingsSync/index.js 处理。
import { redownloadUserSettings } from '../../services/settingsSync/index.js'
// 类型依赖 { LocalCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandCall } from '../../types/command.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 refreshActivePlugins 工具函数，把通用处理留在 ../../utils/plugins/refresh.js 中维护。
import { refreshActivePlugins } from '../../utils/plugins/refresh.js'
// 复用 settingsChangeDetector 工具函数，把通用处理留在 ../../utils/settings/changeDetector.js 中维护。
import { settingsChangeDetector } from '../../utils/settings/changeDetector.js'
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js'

// 这个回调绑定到 export const call: LocalCommandCall = async (_args, context) => {，负责命令处理在该局部场景下的响应。
export const call: LocalCommandCall = async (_args, context) => {
  // CCR: re-pull user settings before the cache sweep so enabledPlugins /
  // extraKnownMarketplaces pushed from the user's local CLI (settingsSync)
  // take effect. Non-CCR headless (e.g. vscode SDK subprocess) shares disk
  // with whoever writes settings — the file watcher delivers changes, no
  // re-pull needed there.
  //
  // Managed settings intentionally NOT re-fetched: it already polls hourly
  // (POLLING_INTERVAL_MS), and policy enforcement is eventually-consistent
  // by design (stale-cache fallback on fetch failure). Interactive
  // /reload-plugins has never re-fetched it either.
  //
  // No retries: user-initiated command, one attempt + fail-open. The user
  // can re-run /reload-plugins to retry. Startup path keeps its retries.
  // 命令处理在这里按实际状态进入对应分支。
  if (
    feature('DOWNLOAD_USER_SETTINGS') &&
    (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) || getIsRemoteMode())
  ) {
    // applied读取`redownloadUserSettings`，供命令处理后续处理使用。
    const applied = await redownloadUserSettings()
    // applyRemoteEntriesToLocal uses markInternalWrite to suppress the
    // file watcher (correct for startup, nothing listening yet); fire
    // notifyChange here so mid-session applySettingsChange runs.
    // 满足 `applied` 时，命令处理执行该分支。
    if (applied) {
      // 调用 settingsChangeDetector.notifyChange，触发命令处理此处需要的副作用。
      settingsChangeDetector.notifyChange('userSettings')
    }
  }

  // r保存`refreshActivePlugins`，供命令处理后续处理使用。
  const r = await refreshActivePlugins(context.setAppState)

  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts = [
    n(r.enabled_count, 'plugin'),
    n(r.command_count, 'skill'),
    n(r.agent_count, 'agent'),
    n(r.hook_count, 'hook'),
    // "plugin MCP/LSP" disambiguates from user-config/built-in servers,
    // which /reload-plugins doesn't touch. Commands/hooks are plugin-only;
    // agent_count is total agents (incl. built-ins). (gh-31321)
    n(r.mcp_count, 'plugin MCP server'),
    n(r.lsp_count, 'plugin LSP server'),
  ]
  // 消息格式化`parts.join`，供命令处理后续处理使用。
  let msg = `Reloaded: ${parts.join(' · ')}`

  // 满足 `r.error_count > 0` 时，命令处理执行该分支。
  if (r.error_count > 0) {
    // 斜杠命令 reload plugins在这里处理 `msg += `\n${n(r.error_count, 'error')} during load. Run /doctor for det...`，完成这一小步状态转换。
    msg += `\n${n(r.error_count, 'error')} during load. Run /doctor for details.`
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return { type: 'text', value: msg }
}

// n 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function n(count: number, noun: string): string {
  // 返回 ``${count} ${plural(count, noun)}``，作为命令处理这次计算的结果。
  return `${count} ${plural(count, noun)}`
}

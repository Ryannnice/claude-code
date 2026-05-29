/**
 * Shared utilities for spawning teammates across different backends.
 */

// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getChromeFlagOverride,
  getFlagSettingsPath,
  getInlinePlugins,
  getMainLoopModelOverride,
  getSessionBypassPermissionsMode,
} from '../../bootstrap/state.js'
// 引入 quote，将 ../bash/shellQuote.js 中已经封装好的能力接到本文件流程里。
import { quote } from '../bash/shellQuote.js'
// 引入 isInBundledMode，将 ../bundledMode.js 中已经封装好的能力接到本文件流程里。
import { isInBundledMode } from '../bundledMode.js'
// 类型依赖 { PermissionMode } 来自 ../permissions/PermissionMode.js，用于校准共享工具的数据契约。
import type { PermissionMode } from '../permissions/PermissionMode.js'
// 引入 getTeammateModeFromSnapshot，将 ./backends/teammateModeSnapshot.js 中已经封装好的能力接到本文件流程里。
import { getTeammateModeFromSnapshot } from './backends/teammateModeSnapshot.js'
// 引入 TEAMMATE_COMMAND_ENV_VAR，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TEAMMATE_COMMAND_ENV_VAR } from './constants.js'

/**
 * Gets the command to use for spawning teammate processes.
 * Uses TEAMMATE_COMMAND_ENV_VAR if set, otherwise falls back to the
 * current process executable path.
 */
// getTeammateCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeammateCommand(): string {
  // 满足 `process.env[TEAMMATE_COMMAND_ENV_VAR]` 时，共享工具执行该分支。
  if (process.env[TEAMMATE_COMMAND_ENV_VAR]) {
    // 返回 `process.env[TEAMMATE_COMMAND_ENV_VAR]`，作为共享工具这次计算的结果。
    return process.env[TEAMMATE_COMMAND_ENV_VAR]
  }
  // 返回 `isInBundledMode() ? process.execPath : process.argv[1]!`，作为共享工具这次计算的结果。
  return isInBundledMode() ? process.execPath : process.argv[1]!
}

/**
 * Builds CLI flags to propagate from the current session to spawned teammates.
 * This ensures teammates inherit important settings like permission mode,
 * model selection, and plugin configuration from their parent.
 *
 * @param options.planModeRequired - If true, don't inherit bypass permissions (plan mode takes precedence)
 * @param options.permissionMode - Permission mode to propagate
 */
// buildInheritedCliFlags 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildInheritedCliFlags(options?: {
  planModeRequired?: boolean
  permissionMode?: PermissionMode
}): string {
  // flags 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const flags: string[] = []
  // 从 `options || {}` 解构 planModeRequired、permissionMode，减少共享工具 spawn Utils对同一对象的重复访问。
  const { planModeRequired, permissionMode } = options || {}

  // Propagate permission mode to teammates, but NOT if plan mode is required
  // Plan mode takes precedence over bypass permissions for safety
  // 满足 `planModeRequired` 时，共享工具执行该分支。
  if (planModeRequired) {
    // Don't inherit bypass permissions when plan mode is required
  // 共享工具 spawn Utils在这里处理 `} else if (`，完成这一小步状态转换。
  } else if (
    permissionMode === 'bypassPermissions' ||
    getSessionBypassPermissionsMode()
  ) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--dangerously-skip-permissions')
  // 共享工具 spawn Utils在这里处理 `} else if (permissionMode === 'acceptEdits') {`，完成这一小步状态转换。
  } else if (permissionMode === 'acceptEdits') {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--permission-mode acceptEdits')
  }

  // Propagate --model if explicitly set via CLI
  // modelOverride读取`getMainLoopModelOverride`，供共享工具后续处理使用。
  const modelOverride = getMainLoopModelOverride()
  // 满足 `modelOverride` 时，共享工具执行该分支。
  if (modelOverride) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push(`--model ${quote([modelOverride])}`)
  }

  // Propagate --settings if set via CLI
  // settingsPath 路径数据读取`getFlagSettingsPath`，供共享工具后续处理使用。
  const settingsPath = getFlagSettingsPath()
  // 满足 `settingsPath` 时，共享工具执行该分支。
  if (settingsPath) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push(`--settings ${quote([settingsPath])}`)
  }

  // Propagate --plugin-dir for each inline plugin
  // inlinePlugins 插件数据读取`getInlinePlugins`，供共享工具后续处理使用。
  const inlinePlugins = getInlinePlugins()
  // 按顺序遍历 `inlinePlugins` 中的pluginDir 插件数据，逐个交给共享工具处理。
  for (const pluginDir of inlinePlugins) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push(`--plugin-dir ${quote([pluginDir])}`)
  }

  // Propagate --teammate-mode so tmux teammates use the same mode as leader
  // sessionMode 会话数据读取`getTeammateModeFromSnapshot`，供共享工具后续处理使用。
  const sessionMode = getTeammateModeFromSnapshot()
  // flags 集合追加新条目，保持收集顺序与输入顺序一致。
  flags.push(`--teammate-mode ${sessionMode}`)

  // Propagate --chrome / --no-chrome if explicitly set on the CLI
  // chromeFlagOverride读取`getChromeFlagOverride`，供共享工具后续处理使用。
  const chromeFlagOverride = getChromeFlagOverride()
  // 满足 `chromeFlagOverride === true` 时，共享工具执行该分支。
  if (chromeFlagOverride === true) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--chrome')
  // 共享工具 spawn Utils在这里处理 `} else if (chromeFlagOverride === false) {`，完成这一小步状态转换。
  } else if (chromeFlagOverride === false) {
    // flags 集合追加新条目，保持收集顺序与输入顺序一致。
    flags.push('--no-chrome')
  }

  // 返回 `flags.join(' ')`，作为共享工具这次计算的结果。
  return flags.join(' ')
}

/**
 * Environment variables that must be explicitly forwarded to tmux-spawned
 * teammates. Tmux may start a new login shell that doesn't inherit the
 * parent's env, so we forward any that are set in the current process.
 */
// TEAMMATE_ENV_VARS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TEAMMATE_ENV_VARS = [
  // API provider selection — without these, teammates default to firstParty
  // and send requests to the wrong endpoint (GitHub issue #23561)
  'CLAUDE_CODE_USE_BEDROCK',
  'CLAUDE_CODE_USE_VERTEX',
  'CLAUDE_CODE_USE_FOUNDRY',
  // Custom API endpoint
  'ANTHROPIC_BASE_URL',
  // Config directory override
  'CLAUDE_CONFIG_DIR',
  // CCR marker — teammates need this for CCR-aware code paths. Auth finds
  // its own way via /home/claude/.claude/remote/.oauth_token regardless;
  // the FD env var wouldn't help (pipe FDs don't cross tmux).
  'CLAUDE_CODE_REMOTE',
  // Auto-memory gate (memdir/paths.ts) checks REMOTE && !MEMORY_DIR to
  // disable memory on ephemeral CCR filesystems. Forwarding REMOTE alone
  // would flip teammates to memory-off when the parent has it on.
  'CLAUDE_CODE_REMOTE_MEMORY_DIR',
  // Upstream proxy — the parent's MITM relay is reachable from teammates
  // (same container network). Forward the proxy vars so teammates route
  // customer-configured upstream traffic through the relay for credential
  // injection. Without these, teammates bypass the proxy entirely.
  'HTTPS_PROXY',
  'https_proxy',
  'HTTP_PROXY',
  'http_proxy',
  'NO_PROXY',
  'no_proxy',
  'SSL_CERT_FILE',
  'NODE_EXTRA_CA_CERTS',
  'REQUESTS_CA_BUNDLE',
  'CURL_CA_BUNDLE',
] as const

/**
 * Builds the `env KEY=VALUE ...` string for teammate spawn commands.
 * Always includes CLAUDECODE=1 and CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1,
 * plus any provider/config env vars that are set in the current process.
 */
// buildInheritedEnvVars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildInheritedEnvVars(): string {
  // envVars 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const envVars = ['CLAUDECODE=1', 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1']

  // 按顺序遍历 `TEAMMATE_ENV_VARS` 中的key，逐个交给共享工具处理。
  for (const key of TEAMMATE_ENV_VARS) {
    // 取值保存`process.env[key]`，供共享工具 spawn Utils后续判断或输出使用。
    const value = process.env[key]
    // `value` 与 `undefined && value !== ''` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== undefined && value !== '') {
      // envVars 集合追加新条目，保持收集顺序与输入顺序一致。
      envVars.push(`${key}=${quote([value])}`)
    }
  }

  // 返回 `envVars.join(' ')`，作为共享工具这次计算的结果。
  return envVars.join(' ')
}

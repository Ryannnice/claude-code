// Critical system constants extracted to break circular dependencies

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 isEnvDefinedFalsy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvDefinedFalsy } from '../utils/envUtils.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 ../utils/model/providers.js 中维护。
import { getAPIProvider } from '../utils/model/providers.js'
// 复用 getWorkload 工具函数，把通用处理留在 ../utils/workloadContext.js 中维护。
import { getWorkload } from '../utils/workloadContext.js'

// DEFAULT_PREFIX保存``You are Claude Code, Anthropic's official CLI for Claude...`，作为后续固定文本处理的输入。
const DEFAULT_PREFIX = `You are Claude Code, Anthropic's official CLI for Claude.`
// AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX 命名 ``You are Claude Code, Anthropic's official CLI for Claude...`，让后续代码直接表达这个值的用途。
const AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX = `You are Claude Code, Anthropic's official CLI for Claude, running within the Claude Agent SDK.`
// AGENT_SDK_PREFIX 命名 ``You are a Claude agent, built on Anthropic's Claude Agen...`，让后续代码直接表达这个值的用途。
const AGENT_SDK_PREFIX = `You are a Claude agent, built on Anthropic's Claude Agent SDK.`

// CLI_SYSPROMPT_PREFIX_VALUES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const CLI_SYSPROMPT_PREFIX_VALUES = [
  DEFAULT_PREFIX,
  AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX,
  AGENT_SDK_PREFIX,
] as const

// CLISyspromptPrefix 固化system里传递的数据形状，帮助调用方按同一结构读写字段。
export type CLISyspromptPrefix = (typeof CLI_SYSPROMPT_PREFIX_VALUES)[number]

/**
 * All possible CLI sysprompt prefix values, used by splitSysPromptPrefix
 * to identify prefix blocks by content rather than position.
 */
// CLI_SYSPROMPT_PREFIXES 集合 用 Set 去重，后续只需判断成员是否存在。
export const CLI_SYSPROMPT_PREFIXES: ReadonlySet<string> = new Set(
  CLI_SYSPROMPT_PREFIX_VALUES,
)

// getCLISyspromptPrefix 封装system的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCLISyspromptPrefix(options?: {
  isNonInteractive: boolean
  hasAppendSystemPrompt: boolean
}): CLISyspromptPrefix {
  // apiProvider读取`getAPIProvider`，供system后续处理使用。
  const apiProvider = getAPIProvider()
  // 当 `apiProvider` 匹配 `'vertex'` 时，system执行对应分支。
  if (apiProvider === 'vertex') {
    // 返回 `DEFAULT_PREFIX`，作为system这次计算的结果。
    return DEFAULT_PREFIX
  }

  // 满足 `options?.isNonInteractive` 时，system执行该分支。
  if (options?.isNonInteractive) {
    // 满足 `options.hasAppendSystemPrompt` 时，system执行该分支。
    if (options.hasAppendSystemPrompt) {
      // 返回 `AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX`，作为system这次计算的结果。
      return AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX
    }
    // 返回 `AGENT_SDK_PREFIX`，作为system这次计算的结果。
    return AGENT_SDK_PREFIX
  }
  // 返回 `DEFAULT_PREFIX`，作为system这次计算的结果。
  return DEFAULT_PREFIX
}

/**
 * Check if attribution header is enabled.
 * Enabled by default, can be disabled via env var or GrowthBook killswitch.
 */
// isAttributionHeaderEnabled 封装system的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAttributionHeaderEnabled(): boolean {
  // 满足 `isEnvDefinedFalsy(process.env.CLAUDE_CODE_ATTRIBUTION_HEADER)` 时，system执行该分支。
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_ATTRIBUTION_HEADER)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_attribution_header', true)`，作为system这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_attribution_header', true)
}

/**
 * Get attribution header for API requests.
 * Returns a header string with cc_version (including fingerprint) and cc_entrypoint.
 * Enabled by default, can be disabled via env var or GrowthBook killswitch.
 *
 * When NATIVE_CLIENT_ATTESTATION is enabled, includes a `cch=00000` placeholder.
 * Before the request is sent, Bun's native HTTP stack finds this placeholder
 * in the request body and overwrites the zeros with a computed hash. The
 * server verifies this token to confirm the request came from a real Claude
 * Code client. See bun-anthropic/src/http/Attestation.zig for implementation.
 *
 * We use a placeholder (instead of injecting from Zig) because same-length
 * replacement avoids Content-Length changes and buffer reallocation.
 */
// getAttributionHeader 封装system的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAttributionHeader(fingerprint: string): string {
  // 满足 `!isAttributionHeaderEnabled()` 时，system执行该分支。
  if (!isAttributionHeaderEnabled()) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // version保存``${MACRO.VERSION}.${fingerprint}``，作为后续固定文本处理的输入。
  const version = `${MACRO.VERSION}.${fingerprint}`
  // entrypoint 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const entrypoint = process.env.CLAUDE_CODE_ENTRYPOINT ?? 'unknown'

  // cch=00000 placeholder is overwritten by Bun's HTTP stack with attestation token
  // cch保存`feature`，供system后续处理使用。
  const cch = feature('NATIVE_CLIENT_ATTESTATION') ? ' cch=00000;' : ''
  // cc_workload: turn-scoped hint so the API can route e.g. cron-initiated
  // requests to a lower QoS pool. Absent = interactive default. Safe re:
  // fingerprint (computed from msg chars + version only, line 78 above) and
  // cch attestation (placeholder overwritten in serialized body bytes after
  // this string is built). Server _parse_cc_header tolerates unknown extra
  // fields so old API deploys silently ignore this.
  // workload读取`getWorkload`，供system后续处理使用。
  const workload = getWorkload()
  // workloadPair读取`workload ? ` cc_workload=${workload};` : ''`，供后续判断或组装使用。
  const workloadPair = workload ? ` cc_workload=${workload};` : ''
  // header保存``x-anthropic-billing-header: cc_version=${version}; cc_en...`，作为后续固定文本处理的输入。
  const header = `x-anthropic-billing-header: cc_version=${version}; cc_entrypoint=${entrypoint};${cch}${workloadPair}`

  // 记录system运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`attribution header ${header}`)
  // 返回 `header`，作为system这次计算的结果。
  return header
}

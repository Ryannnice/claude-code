// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'

// Memoized: 150+ callers, many on hot paths. Keyed off CLAUDE_CONFIG_DIR so
// tests that change the env var get a fresh value without explicit cache.clear.
// getClaudeConfigHomeDir 配置保存`memoize`，供共享工具后续处理使用。
export const getClaudeConfigHomeDir = memoize(
  (): string => {
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')
    ).normalize('NFC')
  },
  // 这个回调绑定到 () => process.env.CLAUDE_CONFIG_DIR,，负责共享工具在该局部场景下的响应。
  () => process.env.CLAUDE_CONFIG_DIR,
)

// getTeamsDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeamsDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'teams')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'teams')
}

/**
 * Check if NODE_OPTIONS contains a specific flag.
 * Splits on whitespace and checks for exact match to avoid false positives.
 */
// hasNodeOption 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasNodeOption(flag: string): boolean {
  // nodeOptions 集合 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const nodeOptions = process.env.NODE_OPTIONS
  // nodeOptions 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!nodeOptions) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `nodeOptions.split(/\s+/).includes(flag)`，作为共享工具这次计算的结果。
  return nodeOptions.split(/\s+/).includes(flag)
}

// isEnvTruthy 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEnvTruthy(envVar: string | boolean | undefined): boolean {
  // envVar缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!envVar) return false
  // 当 `typeof envVar` 匹配 `'boolean'` 时，共享工具执行对应分支。
  if (typeof envVar === 'boolean') return envVar
  // normalizedValue保存`envVar.toLowerCase`，供共享工具后续处理使用。
  const normalizedValue = envVar.toLowerCase().trim()
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return ['1', 'true', 'yes', 'on'].includes(normalizedValue)
}

// isEnvDefinedFalsy 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEnvDefinedFalsy(
  envVar: string | boolean | undefined,
): boolean {
  // 满足 `envVar === undefined` 时，共享工具执行该分支。
  if (envVar === undefined) return false
  // 当 `typeof envVar` 匹配 `'boolean'` 时，共享工具执行对应分支。
  if (typeof envVar === 'boolean') return !envVar
  // envVar缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!envVar) return false
  // normalizedValue保存`envVar.toLowerCase`，供共享工具后续处理使用。
  const normalizedValue = envVar.toLowerCase().trim()
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return ['0', 'false', 'no', 'off'].includes(normalizedValue)
}

/**
 * --bare / CLAUDE_CODE_SIMPLE — skip hooks, LSP, plugin sync, skill dir-walk,
 * attribution, background prefetches, and ALL keychain/credential reads.
 * Auth is strictly ANTHROPIC_API_KEY env or apiKeyHelper from --settings.
 * Explicit CLI flags (--plugin-dir, --add-dir, --mcp-config) still honored.
 * ~30 gates across the codebase.
 *
 * Checks argv directly (in addition to the env var) because several gates
 * run before main.tsx's action handler sets CLAUDE_CODE_SIMPLE=1 from --bare
 * — notably startKeychainPrefetch() at main.tsx top-level.
 */
// isBareMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBareMode(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE) ||
    process.argv.includes('--bare')
  )
}

/**
 * Parses an array of environment variable strings into a key-value object
 * @param envVars Array of strings in KEY=VALUE format
 * @returns Object with key-value pairs
 */
// parseEnvVars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseEnvVars(
  rawEnvArgs: string[] | undefined,
): Record<string, string> {
  // parsedEnv 从空对象开始收集键值，后续按名称补齐内容。
  const parsedEnv: Record<string, string> = {}

  // Parse individual env vars
  // 满足 `rawEnvArgs` 时，共享工具执行该分支。
  if (rawEnvArgs) {
    // 按顺序遍历 `rawEnvArgs` 中的envStr，逐个交给共享工具处理。
    for (const envStr of rawEnvArgs) {
      // 从 `envStr.split('=')` 按位置拆出 key、其余 valueParts，让共享工具 env Utils分别处理这些返回值。
      const [key, ...valueParts] = envStr.split('=')
      // !key || valueParts 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (!key || valueParts.length === 0) {
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Invalid environment variable format: ${envStr}, environment variables should be added as: -e KEY1=value1 -e KEY2=value2`,
        )
      }
      // parsedEnv[key更新为 `valueParts.join('=')`，确保共享工具 env Utils后续读取最新状态。
      parsedEnv[key] = valueParts.join('=')
    }
  }
  // 返回 `parsedEnv`，作为共享工具这次计算的结果。
  return parsedEnv
}

/**
 * Get the AWS region with fallback to default
 * Matches the Anthropic Bedrock SDK's region behavior
 */
// getAWSRegion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAWSRegion(): string {
  // 返回 `process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'`，作为共享工具这次计算的结果。
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
}

/**
 * Get the default Vertex AI region
 */
// getDefaultVertexRegion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultVertexRegion(): string {
  // 返回 `process.env.CLOUD_ML_REGION || 'us-east5'`，作为共享工具这次计算的结果。
  return process.env.CLOUD_ML_REGION || 'us-east5'
}

/**
 * Check if bash commands should maintain project working directory (reset to original after each command)
 * @returns true if CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR is set to a truthy value
 */
// shouldMaintainProjectWorkingDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldMaintainProjectWorkingDir(): boolean {
  // 返回 `isEnvTruthy(process.env.CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR)`，作为共享工具这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR)
}

/**
 * Check if running on Homespace (ant-internal cloud environment)
 */
// isRunningOnHomespace 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRunningOnHomespace(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    process.env.USER_TYPE === 'ant' &&
    isEnvTruthy(process.env.COO_RUNNING_ON_HOMESPACE)
  )
}

/**
 * Conservative check for whether Claude Code is running inside a protected
 * (privileged or ASL3+) COO namespace or cluster.
 *
 * Conservative means: when signals are ambiguous, assume protected. We would
 * rather over-report protected usage than miss it. Unprotected environments
 * are homespace, namespaces on the open allowlist, and no k8s/COO signals
 * at all (laptop/local dev).
 *
 * Used for telemetry to measure auto-mode usage in sensitive environments.
 */
// isInProtectedNamespace 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInProtectedNamespace(): boolean {
  // USER_TYPE is build-time --define'd; in external builds this block is
  // DCE'd so the require() and namespace allowlist never appear in the bundle.
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      require('./protectedNamespace.js') as typeof import('./protectedNamespace.js')
    ).checkProtectedNamespace()
    /* eslint-enable @typescript-eslint/no-require-imports */
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// @[MODEL LAUNCH]: Add a Vertex region override env var for the new model.
/**
 * Model prefix → env var for Vertex region overrides.
 * Order matters: more specific prefixes must come before less specific ones
 * (e.g., 'claude-opus-4-1' before 'claude-opus-4').
 */
// VERTEX_REGION_OVERRIDES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const VERTEX_REGION_OVERRIDES: ReadonlyArray<[string, string]> = [
  ['claude-haiku-4-5', 'VERTEX_REGION_CLAUDE_HAIKU_4_5'],
  ['claude-3-5-haiku', 'VERTEX_REGION_CLAUDE_3_5_HAIKU'],
  ['claude-3-5-sonnet', 'VERTEX_REGION_CLAUDE_3_5_SONNET'],
  ['claude-3-7-sonnet', 'VERTEX_REGION_CLAUDE_3_7_SONNET'],
  ['claude-opus-4-1', 'VERTEX_REGION_CLAUDE_4_1_OPUS'],
  ['claude-opus-4', 'VERTEX_REGION_CLAUDE_4_0_OPUS'],
  ['claude-sonnet-4-6', 'VERTEX_REGION_CLAUDE_4_6_SONNET'],
  ['claude-sonnet-4-5', 'VERTEX_REGION_CLAUDE_4_5_SONNET'],
  ['claude-sonnet-4', 'VERTEX_REGION_CLAUDE_4_0_SONNET'],
]

/**
 * Get the Vertex AI region for a specific model.
 * Different models may be available in different regions.
 */
// getVertexRegionForModel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getVertexRegionForModel(
  model: string | undefined,
): string | undefined {
  // 满足 `model` 时，共享工具执行该分支。
  if (model) {
    // match筛选`VERTEX_REGION_OVERRIDES.find`，供共享工具后续处理使用。
    const match = VERTEX_REGION_OVERRIDES.find(([prefix]) =>
      model.startsWith(prefix),
    )
    // 满足 `match` 时，共享工具执行该分支。
    if (match) {
      // 返回 `process.env[match[1]] || getDefaultVertexRegion()`，作为共享工具这次计算的结果。
      return process.env[match[1]] || getDefaultVertexRegion()
    }
  }
  // 返回 `getDefaultVertexRegion()`，作为共享工具这次计算的结果。
  return getDefaultVertexRegion()
}

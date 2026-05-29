// 类型依赖 { BetaUsage } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准共享工具的数据契约。
import type { BetaUsage } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 引入 shouldIncludeFirstPartyOnlyBetas，将 ./betas.js 中已经封装好的能力接到本文件流程里。
import { shouldIncludeFirstPartyOnlyBetas } from './betas.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'

// The SDK does not yet have types for advisor blocks.
// TODO(hackyon): Migrate to the real anthropic SDK types when this feature ships publicly
// AdvisorServerToolUseBlock 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdvisorServerToolUseBlock = {
  type: 'server_tool_use'
  id: string
  name: 'advisor'
  input: { [key: string]: unknown }
}

// AdvisorToolResultBlock 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdvisorToolResultBlock = {
  type: 'advisor_tool_result'
  tool_use_id: string
  content:
    | {
        type: 'advisor_result'
        text: string
      }
    | {
        type: 'advisor_redacted_result'
        encrypted_content: string
      }
    | {
        type: 'advisor_tool_result_error'
        error_code: string
      }
}

// AdvisorBlock 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdvisorBlock = AdvisorServerToolUseBlock | AdvisorToolResultBlock

// isAdvisorBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAdvisorBlock(param: {
  type: string
  name?: string
}): param is AdvisorBlock {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    param.type === 'advisor_tool_result' ||
    (param.type === 'server_tool_use' && param.name === 'advisor')
  )
}

// AdvisorConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type AdvisorConfig = {
  enabled?: boolean
  canUserConfigure?: boolean
  baseModel?: string
  advisorModel?: string
}

// getAdvisorConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAdvisorConfig(): AdvisorConfig {
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE<AdvisorConfig>(`，作为共享工具这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE<AdvisorConfig>(
    'tengu_sage_compass',
    {},
  )
}

// isAdvisorEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAdvisorEnabled(): boolean {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_ADVISOR_TOOL)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_ADVISOR_TOOL)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // The advisor beta header is first-party only (Bedrock/Vertex 400 on it).
  // 满足 `!shouldIncludeFirstPartyOnlyBetas()` 时，共享工具执行该分支。
  if (!shouldIncludeFirstPartyOnlyBetas()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `getAdvisorConfig().enabled ?? false`，作为共享工具这次计算的结果。
  return getAdvisorConfig().enabled ?? false
}

// canUserConfigureAdvisor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function canUserConfigureAdvisor(): boolean {
  // 返回 `isAdvisorEnabled() && (getAdvisorConfig().canUserConfigure ?? false)`，作为共享工具这次计算的结果。
  return isAdvisorEnabled() && (getAdvisorConfig().canUserConfigure ?? false)
}

// getExperimentAdvisorModels 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getExperimentAdvisorModels():
  | { baseModel: string; advisorModel: string }
  | undefined {
  // 配置读取`getAdvisorConfig`，供共享工具后续处理使用。
  const config = getAdvisorConfig()
  // 返回 `isAdvisorEnabled() &&`，作为共享工具这次计算的结果。
  return isAdvisorEnabled() &&
    !canUserConfigureAdvisor() &&
    config.baseModel &&
    config.advisorModel
    ? { baseModel: config.baseModel, advisorModel: config.advisorModel }
    : undefined
}

// @[MODEL LAUNCH]: Add the new model if it supports the advisor tool.
// Checks whether the main loop model supports calling the advisor tool.
// modelSupportsAdvisor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function modelSupportsAdvisor(model: string): boolean {
  // m保存`model.toLowerCase`，供共享工具后续处理使用。
  const m = model.toLowerCase()
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    m.includes('opus-4-6') ||
    m.includes('sonnet-4-6') ||
    process.env.USER_TYPE === 'ant'
  )
}

// @[MODEL LAUNCH]: Add the new model if it can serve as an advisor model.
// isValidAdvisorModel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isValidAdvisorModel(model: string): boolean {
  // m保存`model.toLowerCase`，供共享工具后续处理使用。
  const m = model.toLowerCase()
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    m.includes('opus-4-6') ||
    m.includes('sonnet-4-6') ||
    process.env.USER_TYPE === 'ant'
  )
}

// getInitialAdvisorSetting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInitialAdvisorSetting(): string | undefined {
  // 满足 `!isAdvisorEnabled()` 时，共享工具执行该分支。
  if (!isAdvisorEnabled()) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 返回 `getInitialSettings().advisorModel`，作为共享工具这次计算的结果。
  return getInitialSettings().advisorModel
}

// getAdvisorUsage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAdvisorUsage(
  usage: BetaUsage,
): Array<BetaUsage & { model: string }> {
  // iterations 集合 命名 `usage.iterations as`，让后续代码直接表达这个值的用途。
  const iterations = usage.iterations as
    | Array<{ type: string }>
    | null
    | undefined
  // iterations 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!iterations) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `iterations.filter(`，作为共享工具这次计算的结果。
  return iterations.filter(
    // it更新为 `> it.type === 'advisor_message'`，确保共享工具后续读取最新状态。
    it => it.type === 'advisor_message',
  ) as unknown as Array<BetaUsage & { model: string }>
}

// ADVISOR_TOOL_INSTRUCTIONS 集合 命名 ``# Advisor Tool`，让后续代码直接表达这个值的用途。
export const ADVISOR_TOOL_INSTRUCTIONS = `# Advisor Tool

You have access to an \`advisor\` tool backed by a stronger reviewer model. It takes NO parameters -- when you call it, your entire conversation history is automatically forwarded. The advisor sees the task, every tool call you've made, every result you've seen.

Call advisor BEFORE substantive work -- before writing code, before committing to an interpretation, before building on an assumption. If the task requires orientation first (finding files, reading code, seeing what's there), do that, then call advisor. Orientation is not substantive work. Writing, editing, and declaring an answer are.

Also call advisor:
- When you believe the task is complete. BEFORE this call, make your deliverable durable: write the file, stage the change, save the result. The advisor call takes time; if the session ends during it, a durable result persists and an unwritten one doesn't.
- When stuck -- errors recurring, approach not converging, results that don't fit.
- When considering a change of approach.

On tasks longer than a few steps, call advisor at least once before committing to an approach and once before declaring done. On short reactive tasks where the next action is dictated by tool output you just read, you don't need to keep calling -- the advisor adds most of its value on the first call, before the approach crystallizes.

Give the advice serious weight. If you follow a step and it fails empirically, or you have primary-source evidence that contradicts a specific claim (the file says X, the code does Y), adapt. A passing self-test is not evidence the advice is wrong -- it's evidence your test doesn't check what the advice is checking.

If you've already retrieved data pointing one way and the advisor points another: don't silently switch. Surface the conflict in one more advisor call -- "I found X, you suggest Y, which constraint breaks the tie?" The advisor saw your evidence but may have underweighted it; a reconcile call is cheaper than committing to the wrong branch.`

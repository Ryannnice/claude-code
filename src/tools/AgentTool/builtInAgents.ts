// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 引入 CLAUDE_CODE_GUIDE_AGENT，将 ./built-in/claudeCodeGuideAgent.js 中已经封装好的能力接到本文件流程里。
import { CLAUDE_CODE_GUIDE_AGENT } from './built-in/claudeCodeGuideAgent.js'
// 引入 EXPLORE_AGENT，将 ./built-in/exploreAgent.js 中已经封装好的能力接到本文件流程里。
import { EXPLORE_AGENT } from './built-in/exploreAgent.js'
// 引入 GENERAL_PURPOSE_AGENT，将 ./built-in/generalPurposeAgent.js 中已经封装好的能力接到本文件流程里。
import { GENERAL_PURPOSE_AGENT } from './built-in/generalPurposeAgent.js'
// 引入 PLAN_AGENT，将 ./built-in/planAgent.js 中已经封装好的能力接到本文件流程里。
import { PLAN_AGENT } from './built-in/planAgent.js'
// 引入 STATUSLINE_SETUP_AGENT，将 ./built-in/statuslineSetup.js 中已经封装好的能力接到本文件流程里。
import { STATUSLINE_SETUP_AGENT } from './built-in/statuslineSetup.js'
// 引入 VERIFICATION_AGENT，将 ./built-in/verificationAgent.js 中已经封装好的能力接到本文件流程里。
import { VERIFICATION_AGENT } from './built-in/verificationAgent.js'
// 类型依赖 { AgentDefinition } 来自 ./loadAgentsDir.js，用于校准工具调用的数据契约。
import type { AgentDefinition } from './loadAgentsDir.js'

// areExplorePlanAgentsEnabled 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function areExplorePlanAgentsEnabled(): boolean {
  // 满足 `feature('BUILTIN_EXPLORE_PLAN_AGENTS')` 时，工具调用执行该分支。
  if (feature('BUILTIN_EXPLORE_PLAN_AGENTS')) {
    // 3P default: true — Bedrock/Vertex keep agents enabled (matches pre-experiment
    // external behavior). A/B test treatment sets false to measure impact of removal.
    // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_amber_stoat', true)`，作为工具调用这次计算的结果。
    return getFeatureValue_CACHED_MAY_BE_STALE('tengu_amber_stoat', true)
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// getBuiltInAgents 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBuiltInAgents(): AgentDefinition[] {
  // Allow disabling all built-in agents via env var (useful for SDK users who want a blank slate)
  // Only applies in noninteractive mode (SDK/API usage)
  // 工具调用在这里按实际状态进入对应分支。
  if (
    isEnvTruthy(process.env.CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS) &&
    getIsNonInteractiveSession()
  ) {
    // 返回列表结果，保留工具调用已经排好的条目顺序。
    return []
  }

  // Use lazy require inside the function body to avoid circular dependency
  // issues at module init time. The coordinatorMode module depends on tools
  // which depend on AgentTool which imports this file.
  // 满足 `feature('COORDINATOR_MODE')` 时，工具调用执行该分支。
  if (feature('COORDINATOR_MODE')) {
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)` 时，工具调用执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)) {
      /* eslint-disable @typescript-eslint/no-require-imports */
      // Agent 工具 built In Agents先整理这一处局部数据，后续分支可以直接读取。
      const { getCoordinatorAgents } =
        require('../../coordinator/workerAgent.js') as typeof import('../../coordinator/workerAgent.js')
      /* eslint-enable @typescript-eslint/no-require-imports */
      // 返回 `getCoordinatorAgents()`，作为工具调用这次计算的结果。
      return getCoordinatorAgents()
    }
  }

  // agents 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const agents: AgentDefinition[] = [
    GENERAL_PURPOSE_AGENT,
    STATUSLINE_SETUP_AGENT,
  ]

  // 满足 `areExplorePlanAgentsEnabled()` 时，工具调用执行该分支。
  if (areExplorePlanAgentsEnabled()) {
    // agents 集合追加新条目，保持收集顺序与输入顺序一致。
    agents.push(EXPLORE_AGENT, PLAN_AGENT)
  }

  // Include Code Guide agent for non-SDK entrypoints
  // isNonSdkEntrypoint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isNonSdkEntrypoint =
    process.env.CLAUDE_CODE_ENTRYPOINT !== 'sdk-ts' &&
    process.env.CLAUDE_CODE_ENTRYPOINT !== 'sdk-py' &&
    process.env.CLAUDE_CODE_ENTRYPOINT !== 'sdk-cli'

  // 满足 `isNonSdkEntrypoint` 时，工具调用执行该分支。
  if (isNonSdkEntrypoint) {
    // agents 集合追加新条目，保持收集顺序与输入顺序一致。
    agents.push(CLAUDE_CODE_GUIDE_AGENT)
  }

  // 工具调用在这里按实际状态进入对应分支。
  if (
    feature('VERIFICATION_AGENT') &&
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_hive_evidence', false)
  ) {
    // agents 集合追加新条目，保持收集顺序与输入顺序一致。
    agents.push(VERIFICATION_AGENT)
  }

  // 返回 `agents`，作为工具调用这次计算的结果。
  return agents
}

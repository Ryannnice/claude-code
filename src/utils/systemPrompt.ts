// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 类型依赖 { ToolUseContext } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { ToolUseContext } from '../Tool.js'
// 类型依赖 { AgentDefinition } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
// 接入 isBuiltInAgent 工具实现，后续工具池会按权限和开关决定是否暴露。
import { isBuiltInAgent } from '../tools/AgentTool/loadAgentsDir.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 asSystemPrompt、SystemPrompt，将 ./systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt, type SystemPrompt } from './systemPromptType.js'

// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { asSystemPrompt, type SystemPrompt } from './systemPromptType.js'

// Dead code elimination: conditional import for proactive mode.
// Same pattern as prompts.ts — lazy require to avoid pulling the module
// into non-proactive builds.
/* eslint-disable @typescript-eslint/no-require-imports */
// proactiveModule 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const proactiveModule =
  feature('PROACTIVE') || feature('KAIROS')
    ? (require('../proactive/index.js') as typeof import('../proactive/index.js'))
    : null
/* eslint-enable @typescript-eslint/no-require-imports */

// isProactiveActive_SAFE_TO_CALL_ANYWHERE 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isProactiveActive_SAFE_TO_CALL_ANYWHERE(): boolean {
  // 返回 `proactiveModule?.isProactiveActive() ?? false`，作为共享工具这次计算的结果。
  return proactiveModule?.isProactiveActive() ?? false
}

/**
 * Builds the effective system prompt array based on priority:
 * 0. Override system prompt (if set, e.g., via loop mode - REPLACES all other prompts)
 * 1. Coordinator system prompt (if coordinator mode is active)
 * 2. Agent system prompt (if mainThreadAgentDefinition is set)
 *    - In proactive mode: agent prompt is APPENDED to default (agent adds domain
 *      instructions on top of the autonomous agent prompt, like teammates do)
 *    - Otherwise: agent prompt REPLACES default
 * 3. Custom system prompt (if specified via --system-prompt)
 * 4. Default system prompt (the standard Claude Code prompt)
 *
 * Plus appendSystemPrompt is always added at the end if specified (except when override is set).
 */
// buildEffectiveSystemPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildEffectiveSystemPrompt({
  mainThreadAgentDefinition,
  toolUseContext,
  customSystemPrompt,
  defaultSystemPrompt,
  appendSystemPrompt,
  overrideSystemPrompt,
}: {
  mainThreadAgentDefinition: AgentDefinition | undefined
  toolUseContext: Pick<ToolUseContext, 'options'>
  customSystemPrompt: string | undefined
  defaultSystemPrompt: string[]
  appendSystemPrompt: string | undefined
  overrideSystemPrompt?: string | null
}): SystemPrompt {
  // 满足 `overrideSystemPrompt` 时，共享工具执行该分支。
  if (overrideSystemPrompt) {
    // 返回 `asSystemPrompt([overrideSystemPrompt])`，作为共享工具这次计算的结果。
    return asSystemPrompt([overrideSystemPrompt])
  }
  // Coordinator mode: use coordinator prompt instead of default
  // Use inline env check instead of coordinatorModule to avoid circular
  // dependency issues during test module loading.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('COORDINATOR_MODE') &&
    isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE) &&
    !mainThreadAgentDefinition
  ) {
    // Lazy require to avoid circular dependency at module load time
    // 共享工具 system Prompt先整理这一处局部数据，后续分支可以直接读取。
    const { getCoordinatorSystemPrompt } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../coordinator/coordinatorMode.js') as typeof import('../coordinator/coordinatorMode.js')
    // 返回 `asSystemPrompt([`，作为共享工具这次计算的结果。
    return asSystemPrompt([
      getCoordinatorSystemPrompt(),
      ...(appendSystemPrompt ? [appendSystemPrompt] : []),
    ])
  }

  // agentSystemPrompt读取`mainThreadAgentDefinition`，供后续判断或组装使用。
  const agentSystemPrompt = mainThreadAgentDefinition
    ? isBuiltInAgent(mainThreadAgentDefinition)
      ? mainThreadAgentDefinition.getSystemPrompt({
          toolUseContext: { options: toolUseContext.options },
        })
      : mainThreadAgentDefinition.getSystemPrompt()
    : undefined

  // Log agent memory loaded event for main loop agents
  // 满足 `mainThreadAgentDefinition?.memory` 时，共享工具执行该分支。
  if (mainThreadAgentDefinition?.memory) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_agent_memory_loaded', {
      ...(process.env.USER_TYPE === 'ant' && {
        agent_type:
          mainThreadAgentDefinition.agentType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
      scope:
        mainThreadAgentDefinition.memory as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      source:
        'main-thread' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }

  // In proactive mode, agent instructions are appended to the default prompt
  // rather than replacing it. The proactive default prompt is already lean
  // (autonomous agent identity + memory + env + proactive section), and agents
  // add domain-specific behavior on top — same pattern as teammates.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    agentSystemPrompt &&
    (feature('PROACTIVE') || feature('KAIROS')) &&
    isProactiveActive_SAFE_TO_CALL_ANYWHERE()
  ) {
    // 返回 `asSystemPrompt([`，作为共享工具这次计算的结果。
    return asSystemPrompt([
      ...defaultSystemPrompt,
      `\n# Custom Agent Instructions\n${agentSystemPrompt}`,
      ...(appendSystemPrompt ? [appendSystemPrompt] : []),
    ])
  }

  // 返回 `asSystemPrompt([`，作为共享工具这次计算的结果。
  return asSystemPrompt([
    ...(agentSystemPrompt
      ? [agentSystemPrompt]
      : customSystemPrompt
        ? [customSystemPrompt]
        : defaultSystemPrompt),
    ...(appendSystemPrompt ? [appendSystemPrompt] : []),
  ])
}

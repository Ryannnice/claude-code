// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react'
// 引入 useAppState、useAppStateStore，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useAppStateStore } from '../../state/AppState.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  getActiveAgentForInput,
  getViewedTeammateTask,
} from '../../state/selectors.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  AGENT_COLOR_TO_THEME_COLOR,
  AGENT_COLORS,
  type AgentColorName,
  getAgentColor,
} from '../../tools/AgentTool/agentColorManager.js'
// 复用 getStandaloneAgentName 工具函数，把通用处理留在 ../../utils/standaloneAgent.js 中维护。
import { getStandaloneAgentName } from '../../utils/standaloneAgent.js'
// 复用 isInsideTmux 工具函数，把通用处理留在 ../../utils/swarm/backends/detection.js 中维护。
import { isInsideTmux } from '../../utils/swarm/backends/detection.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  getCachedDetectionResult,
  isInProcessEnabled,
} from '../../utils/swarm/backends/registry.js'
// 复用 getSwarmSocketName 工具函数，把通用处理留在 ../../utils/swarm/constants.js 中维护。
import { getSwarmSocketName } from '../../utils/swarm/constants.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  getAgentName,
  getTeammateColor,
  getTeamName,
  isTeammate,
} from '../../utils/teammate.js'
// 复用 isInProcessTeammate 工具函数，把通用处理留在 ../../utils/teammateContext.js 中维护。
import { isInProcessTeammate } from '../../utils/teammateContext.js'
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js'

// SwarmBannerInfo 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type SwarmBannerInfo = {
  text: string
  bgColor: keyof Theme
} | null

/**
 * Hook that returns banner information for swarm, standalone agent, or --agent CLI context.
 * - Leader (not in tmux): Returns "tmux -L ... attach" command with cyan background
 * - Leader (in tmux / in-process): Falls through to standalone-agent check — shows
 *   /rename name + /color background if set, else null
 * - Teammate: Returns "teammate@team" format with their assigned color background
 * - Viewing a background agent (CoordinatorTaskPanel): Returns agent name with its color
 * - Standalone agent: Returns agent name with their color background (no @team)
 * - --agent CLI flag: Returns "@agentName" with cyan background
 */
// useSwarmBanner 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSwarmBanner(): SwarmBannerInfo {
  // teamContext保存`useAppState`，供终端渲染后续处理使用。
  const teamContext = useAppState(s => s.teamContext)
  // standaloneAgentContext保存`useAppState`，供终端渲染后续处理使用。
  const standaloneAgentContext = useAppState(s => s.standaloneAgentContext)
  // agent保存`useAppState`，供终端渲染后续处理使用。
  const agent = useAppState(s => s.agent)
  // Subscribe so the banner updates on enter/exit teammate view even though
  // getActiveAgentForInput reads it from store.getState().
  // 调用 useAppState，触发终端渲染此处需要的副作用。
  useAppState(s => s.viewingAgentTaskId)
  // store保存`useAppStateStore`，供终端渲染后续处理使用。
  const store = useAppStateStore()
  // 从 `React.useState<boolean | null>(null)` 按位置拆出 insideTmux、setInsideTmux，让提示输入组件 use Swarm Banner分别处理这些返回值。
  const [insideTmux, setInsideTmux] = React.useState<boolean | null>(null)

  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(() => {
    // 显式忽略 `isInsideTmux().then(setInsideTmux)` 的返回值，只保留它触发的副作用。
    void isInsideTmux().then(setInsideTmux)
  }, [])

  // 状态读取`store.getState`，供终端渲染后续处理使用。
  const state = store.getState()

  // Teammate process: show @agentName with assigned color.
  // In-process teammates run headless — their banner shows in the leader UI instead.
  // 只有 `isTeammate() && !isInProcessTeammate()` 满足时，终端渲染才执行该分支。
  if (isTeammate() && !isInProcessTeammate()) {
    // agentName读取`getAgentName`，供终端渲染后续处理使用。
    const agentName = getAgentName()
    // 只有 `agentName && getTeamName()` 满足时，终端渲染才执行该分支。
    if (agentName && getTeamName()) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        text: `@${agentName}`,
        bgColor: toThemeColor(
          teamContext?.selfAgentColor ?? getTeammateColor(),
        ),
      }
    }
  }

  // Leader with spawned teammates: tmux-attach hint when external, else show
  // the viewed teammate's name when inside tmux / native panes / in-process.
  // hasTeammates 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasTeammates =
    teamContext?.teamName &&
    teamContext.teammates &&
    Object.keys(teamContext.teammates).length > 0
  // 满足 `hasTeammates` 时，终端渲染执行该分支。
  if (hasTeammates) {
    // viewedTeammate读取`getViewedTeammateTask`，供终端渲染后续处理使用。
    const viewedTeammate = getViewedTeammateTask(state)
    // viewedColor保存`toThemeColor`，供终端渲染后续处理使用。
    const viewedColor = toThemeColor(viewedTeammate?.identity.color)
    // inProcessMode保存`isInProcessEnabled`，供终端渲染后续处理使用。
    const inProcessMode = isInProcessEnabled()
    // nativePanes 集合读取`getCachedDetectionResult`，供终端渲染后续处理使用。
    const nativePanes = getCachedDetectionResult()?.isNative ?? false

    // 只有 `insideTmux === false && !inProcessMode && !native` 满足时，终端渲染才执行该分支。
    if (insideTmux === false && !inProcessMode && !nativePanes) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        text: `View teammates: \`tmux -L ${getSwarmSocketName()} a\``,
        bgColor: viewedColor,
      }
    }
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      (insideTmux === true || inProcessMode || nativePanes) &&
      viewedTeammate
    ) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        text: `@${viewedTeammate.identity.agentName}`,
        bgColor: viewedColor,
      }
    }
    // insideTmux === null: still loading — fall through.
    // Not viewing a teammate: fall through so /rename and /color are honored.
  }

  // Viewing a background agent (CoordinatorTaskPanel): local_agent tasks aren't
  // InProcessTeammates, so getViewedTeammateTask misses them. Reverse-lookup the
  // name from agentNameRegistry the same way CoordinatorAgentStatus does.
  // active读取`getActiveAgentForInput`，供终端渲染后续处理使用。
  const active = getActiveAgentForInput(state)
  // 当 `active.type` 匹配 `'named_agent'` 时，终端渲染执行对应分支。
  if (active.type === 'named_agent') {
    // task 命名 `active.task`，让后续代码直接表达这个值的用途。
    const task = active.task
    // 名称 先占位，稍后的条件分支会根据实际输入补齐它。
    let name: string | undefined
    // 循环处理 `const [n, id] of state.agentNameRegistry`，让终端渲染逐项把同类条目按顺序走完。
    for (const [n, id] of state.agentNameRegistry) {
      // 满足 `id === task.id` 时，终端渲染执行该分支。
      if (id === task.id) {
        // 名称更新为 `n`，确保提示输入组件后续读取最新状态。
        name = n
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      }
    }
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      text: name ? `@${name}` : task.description,
      bgColor: getAgentColor(task.agentType) ?? 'cyan_FOR_SUBAGENTS_ONLY',
    }
  }

  // Standalone agent (/rename, /color): name and/or custom color, no @team.
  // standaloneName读取`getStandaloneAgentName`，供终端渲染后续处理使用。
  const standaloneName = getStandaloneAgentName(state)
  // standaloneColor 命名 `standaloneAgentContext?.color`，让后续代码直接表达这个值的用途。
  const standaloneColor = standaloneAgentContext?.color
  // 只有 `standaloneName || standaloneColor` 满足时，终端渲染才执行该分支。
  if (standaloneName || standaloneColor) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      text: standaloneName ?? '',
      bgColor: toThemeColor(standaloneColor),
    }
  }

  // --agent CLI flag (when not handled above).
  // 满足 `agent` 时，终端渲染执行该分支。
  if (agent) {
    // agentDef筛选`activeAgents.find`，供终端渲染后续处理使用。
    const agentDef = state.agentDefinitions.activeAgents.find(
      // a更新为 `> a.agentType === agent`，确保提示输入组件后续读取最新状态。
      a => a.agentType === agent,
    )
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      text: agent,
      bgColor: toThemeColor(agentDef?.color, 'promptBorder'),
    }
  }

  // 返回 `null`，作为终端渲染这次计算的结果。
  return null
}

// toThemeColor 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toThemeColor(
  colorName: string | undefined,
  fallback: keyof Theme = 'cyan_FOR_SUBAGENTS_ONLY',
): keyof Theme {
  // 返回 `colorName && AGENT_COLORS.includes(colorName as AgentColorName)`，作为终端渲染这次计算的结果。
  return colorName && AGENT_COLORS.includes(colorName as AgentColorName)
    ? AGENT_COLOR_TO_THEME_COLOR[colorName as AgentColorName]
    : fallback
}

// 引入 HOOK_EVENTS、HookEvent，将 src/entrypoints/agentSdkTypes.js 中已经封装好的能力接到本文件流程里。
import { HOOK_EVENTS, type HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { AppState } 来自 src/state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from 'src/state/AppState.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 类型依赖 { HooksSettings } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { HooksSettings } from '../settings/types.js'
// 引入 addSessionHook，将 ./sessionHooks.js 中已经封装好的能力接到本文件流程里。
import { addSessionHook } from './sessionHooks.js'

/**
 * Register hooks from frontmatter (agent or skill) into session-scoped hooks.
 * These hooks will be active for the duration of the session/agent and cleaned up
 * when the session/agent ends.
 *
 * @param setAppState Function to update app state
 * @param sessionId Session ID to scope the hooks (agent ID for agents, session ID for skills)
 * @param hooks The hooks settings from frontmatter
 * @param sourceName Human-readable source name for logging (e.g., "agent 'my-agent'")
 * @param isAgent If true, converts Stop hooks to SubagentStop (since subagents trigger SubagentStop, not Stop)
 */
// registerFrontmatterHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerFrontmatterHooks(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  hooks: HooksSettings,
  sourceName: string,
  isAgent: boolean = false,
): void {
  // !hooks || Object.keys(hooks)为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!hooks || Object.keys(hooks).length === 0) {
    // React hook register Frontmatter Hoo...在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // hookCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let hookCount = 0

  // 按顺序遍历 `HOOK_EVENTS` 中的event，逐个交给共享工具处理。
  for (const event of HOOK_EVENTS) {
    // matchers 集合保存`hooks[event]`，供共享工具React hook register Frontmatt...后续判断或输出使用。
    const matchers = hooks[event]
    // !matchers || matchers 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (!matchers || matchers.length === 0) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // For agents, convert Stop hooks to SubagentStop since that's what fires when an agent completes
    // (executeStopHooks uses SubagentStop when called with an agentId)
    // targetEvent 命名 `event`，让后续代码直接表达这个值的用途。
    let targetEvent: HookEvent = event
    // 当 `isAgent && event` 匹配 `'Stop'` 时，共享工具执行对应分支。
    if (isAgent && event === 'Stop') {
      // targetEvent更新为 `'SubagentStop'`，确保共享工具后续读取最新状态。
      targetEvent = 'SubagentStop'
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Converting Stop hook to SubagentStop for ${sourceName} (subagents trigger SubagentStop)`,
      )
    }

    // 按顺序遍历 `matchers` 中的matcherConfig 配置，逐个交给共享工具处理。
    for (const matcherConfig of matchers) {
      // matcher保存`matcherConfig.matcher ?? ''`，供后续判断或组装使用。
      const matcher = matcherConfig.matcher ?? ''
      // hooksArray保存`matcherConfig.hooks`，供共享工具React hook register Frontmatt...后续判断或输出使用。
      const hooksArray = matcherConfig.hooks

      // !hooksArray || hooksArray为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
      if (!hooksArray || hooksArray.length === 0) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 按顺序遍历 `hooksArray` 中的hook，逐个交给共享工具处理。
      for (const hook of hooksArray) {
        // 调用 addSessionHook，触发共享工具此处需要的副作用。
        addSessionHook(setAppState, sessionId, targetEvent, matcher, hook)
        // React hook register Frontmatter Hoo...在这里处理 `hookCount++`，完成这一小步状态转换。
        hookCount++
      }
    }
  }

  // 满足 `hookCount > 0` 时，共享工具执行该分支。
  if (hookCount > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Registered ${hookCount} frontmatter hook(s) from ${sourceName} for session ${sessionId}`,
    )
  }
}

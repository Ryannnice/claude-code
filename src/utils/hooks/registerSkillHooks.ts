// 引入 HOOK_EVENTS，将 src/entrypoints/agentSdkTypes.js 中已经封装好的能力接到本文件流程里。
import { HOOK_EVENTS } from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { AppState } 来自 src/state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from 'src/state/AppState.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 类型依赖 { HooksSettings } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { HooksSettings } from '../settings/types.js'
// 引入 addSessionHook、removeSessionHook，将 ./sessionHooks.js 中已经封装好的能力接到本文件流程里。
import { addSessionHook, removeSessionHook } from './sessionHooks.js'

/**
 * Registers hooks from a skill's frontmatter as session hooks.
 *
 * Hooks are registered as session-scoped hooks that persist for the duration
 * of the session. If a hook has `once: true`, it will be automatically removed
 * after its first successful execution.
 *
 * @param setAppState - Function to update the app state
 * @param sessionId - The current session ID
 * @param hooks - The hooks settings from the skill's frontmatter
 * @param skillName - The name of the skill (for logging)
 * @param skillRoot - The base directory of the skill (for CLAUDE_PLUGIN_ROOT env var)
 */
// registerSkillHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerSkillHooks(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  hooks: HooksSettings,
  skillName: string,
  skillRoot?: string,
): void {
  // registeredCount 数量保存`0`，供共享工具React hook register Skill Hoo...后续判断或输出使用。
  let registeredCount = 0

  // 按顺序遍历 `HOOK_EVENTS` 中的eventName，逐个交给共享工具处理。
  for (const eventName of HOOK_EVENTS) {
    // matchers 集合保存`hooks[eventName]`，供共享工具React hook register Skill Hoo...后续判断或输出使用。
    const matchers = hooks[eventName]
    // matchers 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!matchers) continue

    // 按顺序遍历 `matchers` 中的matcher，逐个交给共享工具处理。
    for (const matcher of matchers) {
      // 按顺序遍历 `matcher.hooks` 中的hook，逐个交给共享工具处理。
      for (const hook of matcher.hooks) {
        // For once: true hooks, use onHookSuccess callback to remove after execution
        // onHookSuccess 集合保存`hook.once`，供后续判断或组装使用。
        const onHookSuccess = hook.once
          // 这个回调绑定到 ? () => {，负责共享工具在该局部场景下的响应。
          ? () => {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Removing one-shot hook for event ${eventName} in skill '${skillName}'`,
              )
              // 调用 removeSessionHook，触发共享工具此处需要的副作用。
              removeSessionHook(setAppState, sessionId, eventName, hook)
            }
          : undefined

        // 调用 addSessionHook，触发共享工具此处需要的副作用。
        addSessionHook(
          setAppState,
          sessionId,
          eventName,
          matcher.matcher || '',
          hook,
          onHookSuccess,
          skillRoot,
        )
        // React hook register Skill Hooks在这里处理 `registeredCount++`，完成这一小步状态转换。
        registeredCount++
      }
    }
  }

  // 满足 `registeredCount > 0` 时，共享工具执行该分支。
  if (registeredCount > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Registered ${registeredCount} hooks from skill '${skillName}'`,
    )
  }
}

// 引入 HOOK_EVENTS、HookEvent，将 src/entrypoints/agentSdkTypes.js 中已经封装好的能力接到本文件流程里。
import { HOOK_EVENTS, type HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { AppState } 来自 src/state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from 'src/state/AppState.js'
// 类型依赖 { Message } 来自 src/types/message.js，用于校准共享工具的数据契约。
import type { Message } from 'src/types/message.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 类型依赖 { AggregatedHookResult } 来自 ../hooks.js，用于校准共享工具的数据契约。
import type { AggregatedHookResult } from '../hooks.js'
// 类型依赖 { HookCommand } 来自 ../settings/types.js，用于校准共享工具的数据契约。
import type { HookCommand } from '../settings/types.js'
// 引入 isHookEqual，将 ./hooksSettings.js 中已经封装好的能力接到本文件流程里。
import { isHookEqual } from './hooksSettings.js'

// OnHookSuccess 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type OnHookSuccess = (
  hook: HookCommand | FunctionHook,
  result: AggregatedHookResult,
) => void

/** Function hook callback - returns true if check passes, false to block */
// FunctionHookCallback 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FunctionHookCallback = (
  messages: Message[],
  signal?: AbortSignal,
) => boolean | Promise<boolean>

/**
 * Function hook type with callback embedded.
 * Session-scoped only, cannot be persisted to settings.json.
 */
// FunctionHook 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FunctionHook = {
  type: 'function'
  id?: string // Optional unique ID for removal
  timeout?: number
  callback: FunctionHookCallback
  errorMessage: string
  statusMessage?: string
}

// SessionHookMatcher 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionHookMatcher = {
  matcher: string
  skillRoot?: string
  hooks: Array<{
    hook: HookCommand | FunctionHook
    onHookSuccess?: OnHookSuccess
  }>
}

// SessionStore 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionStore = {
  hooks: {
    [event in HookEvent]?: SessionHookMatcher[]
  }
}

/**
 * Map (not Record) so .set/.delete don't change the container's identity.
 * Mutator functions mutate the Map and return prev unchanged, letting
 * store.ts's Object.is(next, prev) check short-circuit and skip listener
 * notification. Session hooks are ephemeral per-agent runtime callbacks,
 * never reactively read (only getAppState() snapshots in the query loop).
 * Same pattern as agentControllers on LocalWorkflowTaskState.
 *
 * This matters under high-concurrency workflows: parallel() with N
 * schema-mode agents fires N addFunctionHook calls in one synchronous
 * tick. With a Record + spread, each call cost O(N) to copy the growing
 * map (O(N²) total) plus fired all ~30 store listeners. With Map: .set()
 * is O(1), return prev means zero listener fires.
 */
// SessionHooksState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionHooksState = Map<string, SessionStore>

/**
 * Add a command or prompt hook to the session.
 * Session hooks are temporary, in-memory only, and cleared when session ends.
 */
// addSessionHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addSessionHook(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  event: HookEvent,
  matcher: string,
  hook: HookCommand,
  onHookSuccess?: OnHookSuccess,
  skillRoot?: string,
): void {
  // 调用 addHookToSession，触发共享工具此处需要的副作用。
  addHookToSession(
    setAppState,
    sessionId,
    event,
    matcher,
    hook,
    onHookSuccess,
    skillRoot,
  )
}

/**
 * Add a function hook to the session.
 * Function hooks execute TypeScript callbacks in-memory for validation.
 * @returns The hook ID (for removal)
 */
// addFunctionHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addFunctionHook(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  event: HookEvent,
  matcher: string,
  callback: FunctionHookCallback,
  errorMessage: string,
  options?: {
    timeout?: number
    id?: string
  },
): string {
  // 标识符记录时间`Date.now`，供共享工具后续处理使用。
  const id = options?.id || `function-hook-${Date.now()}-${Math.random()}`
  // hook 集中保存React hook session Hooks要一起传递的字段。
  const hook: FunctionHook = {
    type: 'function',
    id,
    timeout: options?.timeout || 5000,
    callback,
    errorMessage,
  }
  // 调用 addHookToSession，触发共享工具此处需要的副作用。
  addHookToSession(setAppState, sessionId, event, matcher, hook)
  // 返回 `id`，作为共享工具这次计算的结果。
  return id
}

/**
 * Remove a function hook by ID from the session.
 */
// removeFunctionHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeFunctionHook(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  event: HookEvent,
  hookId: string,
): void {
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // store读取`sessionHooks.get`，供共享工具后续处理使用。
    const store = prev.sessionHooks.get(sessionId)
    // store缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!store) {
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }

    // eventMatchers 集合标记共享工具React hook session Hooks是否启用对应路径。
    const eventMatchers = store.hooks[event] || []

    // Remove the hook with matching ID from all matchers
    // updatedMatchers 集合保存`eventMatchers`，供共享工具React hook session Hooks后续判断或输出使用。
    const updatedMatchers = eventMatchers
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(matcher => {
        // updatedHooks 集合筛选`hooks.filter`，供共享工具后续处理使用。
        const updatedHooks = matcher.hooks.filter(h => {
          // `h.hook.type` 与 `'function'` 不一致时刷新派生状态，避免使用过期结果。
          if (h.hook.type !== 'function') return true
          // 返回 `h.hook.id !== hookId`，作为共享工具这次计算的结果。
          return h.hook.id !== hookId
        })

        // 返回 `updatedHooks.length > 0`，作为共享工具这次计算的结果。
        return updatedHooks.length > 0
          ? { ...matcher, hooks: updatedHooks }
          : null
      })
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((m): m is SessionHookMatcher => m !== null)

    // newHooks 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const newHooks =
      updatedMatchers.length > 0
        ? { ...store.hooks, [event]: updatedMatchers }
        : Object.fromEntries(
            // 调用 Object.entries，触发共享工具此处需要的副作用。
            Object.entries(store.hooks).filter(([e]) => e !== event),
          )

    // prev.sessionHooks.set 写入新的状态值，使共享工具后续读取保持一致。
    prev.sessionHooks.set(sessionId, { hooks: newHooks })
    // 返回 `prev`，作为共享工具这次计算的结果。
    return prev
  })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Removed function hook ${hookId} for event ${event} in session ${sessionId}`,
  )
}

/**
 * Internal helper to add a hook to session state
 */
// addHookToSession 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addHookToSession(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  event: HookEvent,
  matcher: string,
  hook: HookCommand | FunctionHook,
  onHookSuccess?: OnHookSuccess,
  skillRoot?: string,
): void {
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // store读取`sessionHooks.get`，供共享工具后续处理使用。
    const store = prev.sessionHooks.get(sessionId) ?? { hooks: {} }
    // eventMatchers 集合标记共享工具React hook session Hooks是否启用对应路径。
    const eventMatchers = store.hooks[event] || []

    // Find existing matcher or create new one
    // existingMatcherIndex 索引筛选`eventMatchers.findIndex`，供共享工具后续处理使用。
    const existingMatcherIndex = eventMatchers.findIndex(
      // m更新为 `> m.matcher === matcher && m.skillRoot === skillRoot`，确保共享工具后续读取最新状态。
      m => m.matcher === matcher && m.skillRoot === skillRoot,
    )

    // updatedMatchers 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let updatedMatchers: SessionHookMatcher[]
    // 满足 `existingMatcherIndex >= 0` 时，共享工具执行该分支。
    if (existingMatcherIndex >= 0) {
      // Add to existing matcher
      // updatedMatchers 集合更新为 `[...eventMatchers]`，确保共享工具后续读取最新状态。
      updatedMatchers = [...eventMatchers]
      // existingMatcher 命名 `updatedMatchers[existingMatcherIndex]!`，让后续代码直接表达这个值的用途。
      const existingMatcher = updatedMatchers[existingMatcherIndex]!
      // updatedMatchers[existingMatcherIndex 索引更新为 `{`，确保React hook session Hooks后续读取最新状态。
      updatedMatchers[existingMatcherIndex] = {
        matcher: existingMatcher.matcher,
        skillRoot: existingMatcher.skillRoot,
        hooks: [...existingMatcher.hooks, { hook, onHookSuccess }],
      }
    } else {
      // Create new matcher
      // updatedMatchers 集合更新为 `[`，确保共享工具后续读取最新状态。
      updatedMatchers = [
        ...eventMatchers,
        {
          matcher,
          skillRoot,
          hooks: [{ hook, onHookSuccess }],
        },
      ]
    }

    // newHooks 集合 集中保存共享工具React hook session Hooks要一起传递的字段。
    const newHooks = { ...store.hooks, [event]: updatedMatchers }

    // prev.sessionHooks.set 写入新的状态值，使共享工具后续读取保持一致。
    prev.sessionHooks.set(sessionId, { hooks: newHooks })
    // 返回 `prev`，作为共享工具这次计算的结果。
    return prev
  })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Added session hook for event ${event} in session ${sessionId}`,
  )
}

/**
 * Remove a specific hook from the session
 * @param setAppState The function to update the app state
 * @param sessionId The session ID
 * @param event The hook event
 * @param hook The hook command to remove
 */
// removeSessionHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeSessionHook(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  event: HookEvent,
  hook: HookCommand,
): void {
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // store读取`sessionHooks.get`，供共享工具后续处理使用。
    const store = prev.sessionHooks.get(sessionId)
    // store缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!store) {
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }

    // eventMatchers 集合标记共享工具React hook session Hooks是否启用对应路径。
    const eventMatchers = store.hooks[event] || []

    // Remove the hook from all matchers
    // updatedMatchers 集合保存`eventMatchers`，供共享工具React hook session Hooks后续判断或输出使用。
    const updatedMatchers = eventMatchers
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(matcher => {
        // updatedHooks 集合筛选`hooks.filter`，供共享工具后续处理使用。
        const updatedHooks = matcher.hooks.filter(
          // h更新为 `> !isHookEqual(h.hook, hook)`，确保共享工具后续读取最新状态。
          h => !isHookEqual(h.hook, hook),
        )

        // 返回 `updatedHooks.length > 0`，作为共享工具这次计算的结果。
        return updatedHooks.length > 0
          ? { ...matcher, hooks: updatedHooks }
          : null
      })
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((m): m is SessionHookMatcher => m !== null)

    // newHooks 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const newHooks =
      updatedMatchers.length > 0
        ? { ...store.hooks, [event]: updatedMatchers }
        : { ...store.hooks }

    // updatedMatchers 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (updatedMatchers.length === 0) {
      // React hook session Hooks在这里处理 `delete newHooks[event]`，完成这一小步状态转换。
      delete newHooks[event]
    }

    // prev.sessionHooks.set 写入新的状态值，使共享工具后续读取保持一致。
    prev.sessionHooks.set(sessionId, { ...store, hooks: newHooks })
    // 返回 `prev`，作为共享工具这次计算的结果。
    return prev
  })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Removed session hook for event ${event} in session ${sessionId}`,
  )
}

// Extended hook matcher that includes optional skillRoot for skill-scoped hooks
// SessionDerivedHookMatcher 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionDerivedHookMatcher = {
  matcher: string
  hooks: HookCommand[]
  skillRoot?: string
}

/**
 * Convert session hook matchers to regular hook matchers
 * @param sessionMatchers The session hook matchers to convert
 * @returns Regular hook matchers (with optional skillRoot preserved)
 */
// convertToHookMatchers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertToHookMatchers(
  sessionMatchers: SessionHookMatcher[],
): SessionDerivedHookMatcher[] {
  // 返回 `sessionMatchers.map(sm => ({`，作为共享工具这次计算的结果。
  return sessionMatchers.map(sm => ({
    matcher: sm.matcher,
    skillRoot: sm.skillRoot,
    // Filter out function hooks - they can't be persisted to HookMatcher format
    hooks: sm.hooks
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(h => h.hook)
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter((h): h is HookCommand => h.type !== 'function'),
  }))
}

/**
 * Get all session hooks for a specific event (excluding function hooks)
 * @param appState The app state
 * @param sessionId The session ID
 * @param event Optional event to filter by
 * @returns Hook matchers for the event, or all hooks if no event specified
 */
// getSessionHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionHooks(
  appState: AppState,
  sessionId: string,
  event?: HookEvent,
): Map<HookEvent, SessionDerivedHookMatcher[]> {
  // store读取`sessionHooks.get`，供共享工具后续处理使用。
  const store = appState.sessionHooks.get(sessionId)
  // store缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!store) {
    // 返回 `new Map()`，作为共享工具这次计算的结果。
    return new Map()
  }

  // 结果构建`new Map<HookEvent, SessionDerivedHookMatcher[]>()`，供后续判断或组装使用。
  const result = new Map<HookEvent, SessionDerivedHookMatcher[]>()

  // 满足 `event` 时，共享工具执行该分支。
  if (event) {
    // sessionMatchers 会话数据读取 `store.hooks[event]` 对应条目，后续围绕该成员继续处理。
    const sessionMatchers = store.hooks[event]
    // 满足 `sessionMatchers` 时，共享工具执行该分支。
    if (sessionMatchers) {
      // result.set 写入新的状态值，使共享工具后续读取保持一致。
      result.set(event, convertToHookMatchers(sessionMatchers))
    }
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 按顺序遍历 `HOOK_EVENTS` 中的evt，逐个交给共享工具处理。
  for (const evt of HOOK_EVENTS) {
    // sessionMatchers 会话数据 命名 `store.hooks[evt]`，让后续代码直接表达这个值的用途。
    const sessionMatchers = store.hooks[evt]
    // 满足 `sessionMatchers` 时，共享工具执行该分支。
    if (sessionMatchers) {
      // result.set 写入新的状态值，使共享工具后续读取保持一致。
      result.set(evt, convertToHookMatchers(sessionMatchers))
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// FunctionHookMatcher 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type FunctionHookMatcher = {
  matcher: string
  hooks: FunctionHook[]
}

/**
 * Get all session function hooks for a specific event
 * Function hooks are kept separate because they can't be persisted to HookMatcher format.
 * @param appState The app state
 * @param sessionId The session ID
 * @param event Optional event to filter by
 * @returns Function hook matchers for the event
 */
// getSessionFunctionHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionFunctionHooks(
  appState: AppState,
  sessionId: string,
  event?: HookEvent,
): Map<HookEvent, FunctionHookMatcher[]> {
  // store读取`sessionHooks.get`，供共享工具后续处理使用。
  const store = appState.sessionHooks.get(sessionId)
  // store缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!store) {
    // 返回 `new Map()`，作为共享工具这次计算的结果。
    return new Map()
  }

  // 结果构建`new Map<HookEvent, FunctionHookMatcher[]>()`，供后续判断或组装使用。
  const result = new Map<HookEvent, FunctionHookMatcher[]>()

  // extractFunctionHooks 集合 命名 `(`，让后续代码直接表达这个值的用途。
  const extractFunctionHooks = (
    sessionMatchers: SessionHookMatcher[],
  ): FunctionHookMatcher[] => {
    // 返回 `sessionMatchers`，作为共享工具这次计算的结果。
    return sessionMatchers
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(sm => ({
        matcher: sm.matcher,
        hooks: sm.hooks
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(h => h.hook)
          // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
          .filter((h): h is FunctionHook => h.type === 'function'),
      }))
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(m => m.hooks.length > 0)
  }

  // 满足 `event` 时，共享工具执行该分支。
  if (event) {
    // sessionMatchers 会话数据读取 `store.hooks[event]` 对应条目，后续围绕该成员继续处理。
    const sessionMatchers = store.hooks[event]
    // 满足 `sessionMatchers` 时，共享工具执行该分支。
    if (sessionMatchers) {
      // functionMatchers 集合保存`extractFunctionHooks`，供共享工具后续处理使用。
      const functionMatchers = extractFunctionHooks(sessionMatchers)
      // 满足 `functionMatchers.length > 0` 时，共享工具执行该分支。
      if (functionMatchers.length > 0) {
        // result.set 写入新的状态值，使共享工具后续读取保持一致。
        result.set(event, functionMatchers)
      }
    }
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 按顺序遍历 `HOOK_EVENTS` 中的evt，逐个交给共享工具处理。
  for (const evt of HOOK_EVENTS) {
    // sessionMatchers 会话数据 命名 `store.hooks[evt]`，让后续代码直接表达这个值的用途。
    const sessionMatchers = store.hooks[evt]
    // 满足 `sessionMatchers` 时，共享工具执行该分支。
    if (sessionMatchers) {
      // functionMatchers 集合保存`extractFunctionHooks`，供共享工具后续处理使用。
      const functionMatchers = extractFunctionHooks(sessionMatchers)
      // 满足 `functionMatchers.length > 0` 时，共享工具执行该分支。
      if (functionMatchers.length > 0) {
        // result.set 写入新的状态值，使共享工具后续读取保持一致。
        result.set(evt, functionMatchers)
      }
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Get the full hook entry (including callbacks) for a specific session hook
 */
// getSessionHookCallback 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionHookCallback(
  appState: AppState,
  sessionId: string,
  event: HookEvent,
  matcher: string,
  hook: HookCommand | FunctionHook,
):
  | {
      hook: HookCommand | FunctionHook
      onHookSuccess?: OnHookSuccess
    }
  | undefined {
  // store读取`sessionHooks.get`，供共享工具后续处理使用。
  const store = appState.sessionHooks.get(sessionId)
  // store缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!store) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // eventMatchers 集合 命名 `store.hooks[event]`，让后续代码直接表达这个值的用途。
  const eventMatchers = store.hooks[event]
  // eventMatchers 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!eventMatchers) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Find the hook in the matchers
  // 按顺序遍历 `eventMatchers` 中的matcherEntry，逐个交给共享工具处理。
  for (const matcherEntry of eventMatchers) {
    // 只有 `matcherEntry.matcher === matcher || matcher === ''` 满足时，共享工具才执行该分支。
    if (matcherEntry.matcher === matcher || matcher === '') {
      // hookEntry筛选`hooks.find`，供共享工具后续处理使用。
      const hookEntry = matcherEntry.hooks.find(h => isHookEqual(h.hook, hook))
      // 满足 `hookEntry` 时，共享工具执行该分支。
      if (hookEntry) {
        // 返回 `hookEntry`，作为共享工具这次计算的结果。
        return hookEntry
      }
    }
  }

  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Clear all session hooks for a specific session
 * @param setAppState The function to update the app state
 * @param sessionId The session ID
 */
// clearSessionHooks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSessionHooks(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
): void {
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // 调用 prev.sessionHooks.delete，触发共享工具此处需要的副作用。
    prev.sessionHooks.delete(sessionId)
    // 返回 `prev`，作为共享工具这次计算的结果。
    return prev
  })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Cleared all session hooks for session ${sessionId}`)
}

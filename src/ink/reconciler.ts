/* eslint-disable custom-rules/no-top-level-side-effects */

// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { appendFileSync } from 'fs'
// 引入 createReconciler，将 react-reconciler 中已经封装好的能力接到本文件流程里。
import createReconciler from 'react-reconciler'
// 引入 getYogaCounters，将 src/native-ts/yoga-layout/index.js 中已经封装好的能力接到本文件流程里。
import { getYogaCounters } from 'src/native-ts/yoga-layout/index.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../utils/envUtils.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  appendChildNode,
  clearYogaNodeReferences,
  createNode,
  createTextNode,
  type DOMElement,
  type DOMNodeAttribute,
  type ElementNames,
  insertBeforeNode,
  markDirty,
  removeChildNode,
  setAttribute,
  setStyle,
  setTextNodeValue,
  setTextStyles,
  type TextNode,
} from './dom.js'
// 引入 Dispatcher，将 ./events/dispatcher.js 中已经封装好的能力接到本文件流程里。
import { Dispatcher } from './events/dispatcher.js'
// 引入 EVENT_HANDLER_PROPS，将 ./events/event-handlers.js 中已经封装好的能力接到本文件流程里。
import { EVENT_HANDLER_PROPS } from './events/event-handlers.js'
// 引入 getFocusManager、getRootNode，将 ./focus.js 中已经封装好的能力接到本文件流程里。
import { getFocusManager, getRootNode } from './focus.js'
// 引入 LayoutDisplay，将 ./layout/node.js 中已经封装好的能力接到本文件流程里。
import { LayoutDisplay } from './layout/node.js'
// 引入 applyStyles、Styles、TextStyles，将 ./styles.js 中已经封装好的能力接到本文件流程里。
import applyStyles, { type Styles, type TextStyles } from './styles.js'

// We need to conditionally perform devtools connection to avoid
// accidentally breaking other third-party code.
// See https://github.com/vadimdemedes/ink/issues/384
// 当 `process.env.NODE_ENV` 匹配 `'development'` 时，终端渲染执行对应分支。
if (process.env.NODE_ENV === 'development') {
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-top-level-dynamic-import -- dev-only; NODE_ENV check is DCE'd in production
    // 显式忽略 `import('./devtools.js')` 的返回值，只保留它触发的副作用。
    void import('./devtools.js')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // 当 `error.code` 匹配 `'ERR_MODULE_NOT_FOUND'` 时，终端渲染执行对应分支。
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      // biome-ignore lint/suspicious/noConsole: intentional warning
      // 调用 console.warn，触发终端渲染此处需要的副作用。
      console.warn(
        `
The environment variable DEV is set to true, so Ink tried to import \`react-devtools-core\`,
but this failed as it was not installed. Debugging with React Devtools requires it.

To install use this command:

$ npm install --save-dev react-devtools-core
				`.trim() + '\n',
      )
    } else {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      // 抛出 error，阻止终端渲染在无效状态下继续运行。
      throw error
    }
  }
}

// --

// AnyObject 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type AnyObject = Record<string, unknown>

// diff封装成回调，供Ink 渲染层 reconciler在事件触发或异步步骤中调用。
const diff = (before: AnyObject, after: AnyObject): AnyObject | undefined => {
  // 满足 `before === after` 时，终端渲染执行该分支。
  if (before === after) {
    // Ink 渲染层 reconciler在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // before缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!before) {
    // 返回 `after`，作为终端渲染这次计算的结果。
    return after
  }

  // changed 从空对象开始收集键值，后续按名称补齐内容。
  const changed: AnyObject = {}
  // isChanged标记Ink 渲染层 reconciler是否启用对应路径。
  let isChanged = false

  // 逐项读取 `Object.keys(before)` 中的key，按输入顺序推进终端渲染。
  for (const key of Object.keys(before)) {
    // isDeleted记录 `Object.hasOwn` 是否成立，终端渲染随后按该结果分支。
    const isDeleted = after ? !Object.hasOwn(after, key) : true

    // 满足 `isDeleted` 时，终端渲染执行该分支。
    if (isDeleted) {
      // changed[key更新为 `undefined`，确保Ink 渲染层 reconciler后续读取最新状态。
      changed[key] = undefined
      // isChanged更新为 `true`，确保Ink 渲染层后续读取最新状态。
      isChanged = true
    }
  }

  // 满足 `after` 时，终端渲染执行该分支。
  if (after) {
    // 逐项读取 `Object.keys(after)` 中的key，按输入顺序推进终端渲染。
    for (const key of Object.keys(after)) {
      // `after[key]` 与 `before[key]` 不一致时刷新派生状态，避免使用过期结果。
      if (after[key] !== before[key]) {
        // changed[key更新为 `after[key]`，确保Ink 渲染层 reconciler后续读取最新状态。
        changed[key] = after[key]
        // isChanged更新为 `true`，确保Ink 渲染层后续读取最新状态。
        isChanged = true
      }
    }
  }

  // 返回 `isChanged ? changed : undefined`，作为终端渲染这次计算的结果。
  return isChanged ? changed : undefined
}

// cleanupYogaNode封装成回调，供Ink 渲染层 reconciler在事件触发或异步步骤中调用。
const cleanupYogaNode = (node: DOMElement | TextNode): void => {
  // yogaNode保存`node.yogaNode`，供Ink 渲染层 reconciler后续判断或输出使用。
  const yogaNode = node.yogaNode
  // 满足 `yogaNode` 时，终端渲染执行该分支。
  if (yogaNode) {
    // 调用 yogaNode.unsetMeasureFunc，触发终端渲染此处需要的副作用。
    yogaNode.unsetMeasureFunc()
    // Clear all references BEFORE freeing to prevent other code from
    // accessing freed WASM memory during concurrent operations
    // 调用 clearYogaNodeReferences，触发终端渲染此处需要的副作用。
    clearYogaNodeReferences(node)
    // 调用 yogaNode.freeRecursive，触发终端渲染此处需要的副作用。
    yogaNode.freeRecursive()
  }
}

// --

// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = Record<string, unknown>

// HostContext 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type HostContext = {
  isInsideText: boolean
}

// setEventHandler 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function setEventHandler(node: DOMElement, key: string, value: unknown): void {
  // node._eventHandlers 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!node._eventHandlers) {
    // _eventHandlers 集合更新为 `{}`，确保Ink 渲染层后续读取最新状态。
    node._eventHandlers = {}
  }
  // _eventHandlers[key更新为 `value`，确保Ink 渲染层 reconciler后续读取最新状态。
  node._eventHandlers[key] = value
}

// applyProp 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyProp(node: DOMElement, key: string, value: unknown): void {
  // 当 `key` 匹配 `'children'` 时，终端渲染执行对应分支。
  if (key === 'children') return

  // 当 `key` 匹配 `'style'` 时，终端渲染执行对应分支。
  if (key === 'style') {
    // setStyle 写入新的状态值，使终端渲染后续读取保持一致。
    setStyle(node, value as Styles)
    // 满足 `node.yogaNode` 时，终端渲染执行该分支。
    if (node.yogaNode) {
      // 调用 applyStyles，触发终端渲染此处需要的副作用。
      applyStyles(node.yogaNode, value as Styles)
    }
    // Ink 渲染层 reconciler在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 当 `key` 匹配 `'textStyles'` 时，终端渲染执行对应分支。
  if (key === 'textStyles') {
    // textStyles 集合更新为 `value as TextStyles`，确保Ink 渲染层后续读取最新状态。
    node.textStyles = value as TextStyles
    // Ink 渲染层 reconciler在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `EVENT_HANDLER_PROPS.has(key)` 时，终端渲染执行该分支。
  if (EVENT_HANDLER_PROPS.has(key)) {
    // setEventHandler 写入新的状态值，使终端渲染后续读取保持一致。
    setEventHandler(node, key, value)
    // Ink 渲染层 reconciler在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // setAttribute 写入新的状态值，使终端渲染后续读取保持一致。
  setAttribute(node, key, value as DOMNodeAttribute)
}

// --

// react-reconciler's Fiber shape — only the fields we walk. The 5th arg to
// createInstance is the Fiber (`workInProgress` in react-reconciler.dev.js).
// _debugOwner is the component that rendered this element (dev builds only);
// return is the parent fiber (always present). We prefer _debugOwner since it
// skips past Box/Text wrappers to the actual named component.
// FiberLike 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FiberLike = {
  elementType?: { displayName?: string; name?: string } | string | null
  _debugOwner?: FiberLike | null
  return?: FiberLike | null
}

// getOwnerChain 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOwnerChain(fiber: unknown): string[] {
  // chain 从空数组开始收集，后续循环会按处理顺序追加条目。
  const chain: string[] = []
  // seen 命名 `new Set<unknown>()`，让后续代码直接表达这个值的用途。
  const seen = new Set<unknown>()
  // cur保存`fiber as FiberLike | null | undefined`，供后续判断或组装使用。
  let cur = fiber as FiberLike | null | undefined
  // 循环处理 `let i = 0; cur && i < 50; i++`，让终端渲染逐项把同类条目按顺序走完。
  for (let i = 0; cur && i < 50; i++) {
    // 满足 `seen.has(cur)` 时，终端渲染执行该分支。
    if (seen.has(cur)) break
    // 调用 seen.add，触发终端渲染此处需要的副作用。
    seen.add(cur)
    // t保存`cur.elementType`，供后续判断或组装使用。
    const t = cur.elementType
    // name 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const name =
      typeof t === 'function'
        ? (t as { displayName?: string; name?: string }).displayName ||
          (t as { displayName?: string; name?: string }).name
        : typeof t === 'string'
          ? undefined // host element (ink-box etc) — skip
          : t?.displayName || t?.name
    // `name && name` 与 `chain[chain.length - 1]) chain....` 不一致时刷新派生状态，避免使用过期结果。
    if (name && name !== chain[chain.length - 1]) chain.push(name)
    // cur更新为 `cur._debugOwner ?? cur.return`，确保Ink 渲染层后续读取最新状态。
    cur = cur._debugOwner ?? cur.return
  }
  // 返回 `chain`，作为终端渲染这次计算的结果。
  return chain
}

// debugRepaints 集合 先占位，稍后的条件分支会根据实际输入补齐它。
let debugRepaints: boolean | undefined
// isDebugRepaintsEnabled 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDebugRepaintsEnabled(): boolean {
  // 满足 `debugRepaints === undefined` 时，终端渲染执行该分支。
  if (debugRepaints === undefined) {
    // debugRepaints 集合更新为 `isEnvTruthy(process.env.CLAUDE_CODE_DEBUG_REPAINTS)`，确保Ink 渲染层后续读取最新状态。
    debugRepaints = isEnvTruthy(process.env.CLAUDE_CODE_DEBUG_REPAINTS)
  }
  // 返回 `debugRepaints`，作为终端渲染这次计算的结果。
  return debugRepaints
}

// dispatcher保存`Dispatcher`，供终端渲染后续处理使用。
export const dispatcher = new Dispatcher()

// --- COMMIT INSTRUMENTATION (temp debugging) ---
// eslint-disable-next-line custom-rules/no-process-env-top-level -- debug instrumentation, read-once is fine
// COMMIT_LOG 来自环境变量默认值，运行参数仍可在入口处覆盖。
const COMMIT_LOG = process.env.CLAUDE_CODE_COMMIT_LOG
// _commits 集合 命名 `0`，让后续代码直接表达这个值的用途。
let _commits = 0
// _lastLog保存`0`，供Ink 渲染层 reconciler后续判断或输出使用。
let _lastLog = 0
// _lastCommitAt 命名 `0`，让后续代码直接表达这个值的用途。
let _lastCommitAt = 0
// _maxGapMs 集合 命名 `0`，让后续代码直接表达这个值的用途。
let _maxGapMs = 0
// _createCount 数量保存`0`，供后续判断或组装使用。
let _createCount = 0
// _prepareAt保存`0`，供Ink 渲染层 reconciler后续判断或输出使用。
let _prepareAt = 0
// --- END ---

// --- SCROLL PROFILING (bench/scroll-e2e.sh reads via getLastYogaMs) ---
// Set by onComputeLayout wrapper in ink.tsx; read by onRender for phases.
// _lastYogaMs 集合保存`0`，供后续判断或组装使用。
let _lastYogaMs = 0
// _lastCommitMs 集合保存`0`，供后续判断或组装使用。
let _lastCommitMs = 0
// _commitStart保存`0`，供后续判断或组装使用。
let _commitStart = 0
// recordYogaMs 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordYogaMs(ms: number): void {
  // _lastYogaMs 集合更新为 `ms`，确保Ink 渲染层后续读取最新状态。
  _lastYogaMs = ms
}
// getLastYogaMs 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastYogaMs(): number {
  // 返回 `_lastYogaMs`，作为终端渲染这次计算的结果。
  return _lastYogaMs
}
// markCommitStart 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markCommitStart(): void {
  // _commitStart更新为 `performance.now()`，确保Ink 渲染层后续读取最新状态。
  _commitStart = performance.now()
}
// getLastCommitMs 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastCommitMs(): number {
  // 返回 `_lastCommitMs`，作为终端渲染这次计算的结果。
  return _lastCommitMs
}
// resetProfileCounters 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetProfileCounters(): void {
  // _lastYogaMs 集合更新为 `0`，确保Ink 渲染层后续读取最新状态。
  _lastYogaMs = 0
  // _lastCommitMs 集合更新为 `0`，确保Ink 渲染层后续读取最新状态。
  _lastCommitMs = 0
  // _commitStart更新为 `0`，确保Ink 渲染层后续读取最新状态。
  _commitStart = 0
}
// --- END ---

// reconciler 命名 `createReconciler<`，让后续代码直接表达这个值的用途。
const reconciler = createReconciler<
  ElementNames,
  Props,
  DOMElement,
  DOMElement,
  TextNode,
  DOMElement,
  unknown,
  unknown,
  DOMElement,
  HostContext,
  null, // UpdatePayload - not used in React 19
  NodeJS.Timeout,
  -1,
  null
>({
  // 这个回调绑定到 getRootHostContext: () => ({ isInsideText: false }),，负责终端渲染在该局部场景下的响应。
  getRootHostContext: () => ({ isInsideText: false }),
  // 这个回调绑定到 prepareForCommit: () => {，负责终端渲染在该局部场景下的响应。
  prepareForCommit: () => {
    // 满足 `COMMIT_LOG) _prepareAt = performance.now(` 时，终端渲染执行该分支。
    if (COMMIT_LOG) _prepareAt = performance.now()
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null
  },
  // 这个回调绑定到 preparePortalMount: () => null,，负责终端渲染在该局部场景下的响应。
  preparePortalMount: () => null,
  // 这个回调绑定到 clearContainer: () => false,，负责终端渲染在该局部场景下的响应。
  clearContainer: () => false,
  // resetAfterCommit 使用 rootNode 完成终端渲染里的对应操作。
  resetAfterCommit(rootNode) {
    // _lastCommitMs 集合更新为 `_commitStart > 0 ? performance.now() - _commitStart : 0`，确保Ink 渲染层后续读取最新状态。
    _lastCommitMs = _commitStart > 0 ? performance.now() - _commitStart : 0
    // _commitStart更新为 `0`，确保Ink 渲染层后续读取最新状态。
    _commitStart = 0
    // 满足 `COMMIT_LOG` 时，终端渲染执行该分支。
    if (COMMIT_LOG) {
      // now记录时间`performance.now`，供终端渲染后续处理使用。
      const now = performance.now()
      // Ink 渲染层 reconciler在这里处理 `_commits++`，完成这一小步状态转换。
      _commits++
      // gap保存`_lastCommitAt > 0 ? now - _lastCommitAt : 0`，供Ink 渲染层 reconciler后续判断或输出使用。
      const gap = _lastCommitAt > 0 ? now - _lastCommitAt : 0
      // 满足 `gap > _maxGapMs` 时，终端渲染执行该分支。
      if (gap > _maxGapMs) _maxGapMs = gap
      // _lastCommitAt更新为 `now`，确保Ink 渲染层后续读取最新状态。
      _lastCommitAt = now
      // reconcileMs 集合保存`_prepareAt > 0 ? now - _prepareAt : 0`，供Ink 渲染层 reconciler后续判断或输出使用。
      const reconcileMs = _prepareAt > 0 ? now - _prepareAt : 0
      // 只有 `gap > 30 || reconcileMs > 20 || _createCount > 50` 满足时，终端渲染才执行该分支。
      if (gap > 30 || reconcileMs > 20 || _createCount > 50) {
        // eslint-disable-next-line custom-rules/no-sync-fs -- debug instrumentation
        // 调用 appendFileSync，触发终端渲染此处需要的副作用。
        appendFileSync(
          COMMIT_LOG,
          `${now.toFixed(1)} gap=${gap.toFixed(1)}ms reconcile=${reconcileMs.toFixed(1)}ms creates=${_createCount}\n`,
        )
      }
      // _createCount 数量更新为 `0`，确保Ink 渲染层后续读取最新状态。
      _createCount = 0
      // 满足 `now - _lastLog > 1000` 时，终端渲染执行该分支。
      if (now - _lastLog > 1000) {
        // eslint-disable-next-line custom-rules/no-sync-fs -- debug instrumentation
        // 调用 appendFileSync，触发终端渲染此处需要的副作用。
        appendFileSync(
          COMMIT_LOG,
          `${now.toFixed(1)} commits=${_commits}/s maxGap=${_maxGapMs.toFixed(1)}ms\n`,
        )
        // _commits 集合更新为 `0`，确保Ink 渲染层后续读取最新状态。
        _commits = 0
        // _maxGapMs 集合更新为 `0`，确保Ink 渲染层后续读取最新状态。
        _maxGapMs = 0
        // _lastLog更新为 `now`，确保Ink 渲染层后续读取最新状态。
        _lastLog = now
      }
    }
    // _t0记录时间`performance.now`，供终端渲染后续处理使用。
    const _t0 = COMMIT_LOG ? performance.now() : 0
    // 当 `typeof rootNode.onComputeLayout` 匹配 `'function'` 时，终端渲染执行对应分支。
    if (typeof rootNode.onComputeLayout === 'function') {
      // 调用 rootNode.onComputeLayout，触发终端渲染此处需要的副作用。
      rootNode.onComputeLayout()
    }
    // 满足 `COMMIT_LOG` 时，终端渲染执行该分支。
    if (COMMIT_LOG) {
      // layoutMs 集合记录时间`performance.now`，供终端渲染后续处理使用。
      const layoutMs = performance.now() - _t0
      // 满足 `layoutMs > 20` 时，终端渲染执行该分支。
      if (layoutMs > 20) {
        // c读取`getYogaCounters`，供终端渲染后续处理使用。
        const c = getYogaCounters()
        // eslint-disable-next-line custom-rules/no-sync-fs -- debug instrumentation
        // 调用 appendFileSync，触发终端渲染此处需要的副作用。
        appendFileSync(
          COMMIT_LOG,
          `${_t0.toFixed(1)} SLOW_YOGA ${layoutMs.toFixed(1)}ms visited=${c.visited} measured=${c.measured} hits=${c.cacheHits} live=${c.live}\n`,
        )
      }
    }

    // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，终端渲染执行对应分支。
    if (process.env.NODE_ENV === 'test') {
      // 只有 `rootNode.childNodes.length === 0 && rootNode.hasR` 满足时，终端渲染才执行该分支。
      if (rootNode.childNodes.length === 0 && rootNode.hasRenderedContent) {
        // Ink 渲染层 reconciler在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 满足 `rootNode.childNodes.length > 0` 时，终端渲染执行该分支。
      if (rootNode.childNodes.length > 0) {
        // hasRenderedContent更新为 `true`，确保Ink 渲染层后续读取最新状态。
        rootNode.hasRenderedContent = true
      }
      // 调用 rootNode.onImmediateRender?.()，完成这一处局部操作。
      rootNode.onImmediateRender?.()
      // Ink 渲染层 reconciler在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // _tr记录时间`performance.now`，供终端渲染后续处理使用。
    const _tr = COMMIT_LOG ? performance.now() : 0
    // 调用 rootNode.onRender?.()，完成这一处局部操作。
    rootNode.onRender?.()
    // 满足 `COMMIT_LOG` 时，终端渲染执行该分支。
    if (COMMIT_LOG) {
      // renderMs 集合记录时间`performance.now`，供终端渲染后续处理使用。
      const renderMs = performance.now() - _tr
      // 满足 `renderMs > 10` 时，终端渲染执行该分支。
      if (renderMs > 10) {
        // eslint-disable-next-line custom-rules/no-sync-fs -- debug instrumentation
        // 调用 appendFileSync，触发终端渲染此处需要的副作用。
        appendFileSync(
          COMMIT_LOG,
          `${_tr.toFixed(1)} SLOW_PAINT ${renderMs.toFixed(1)}ms\n`,
        )
      }
    }
  },
  // 调用 getChildHostContext，触发终端渲染此处需要的副作用。
  getChildHostContext(
    parentHostContext: HostContext,
    type: ElementNames,
  ): HostContext {
    // previousIsInsideText保存`parentHostContext.isInsideText`，供后续判断或组装使用。
    const previousIsInsideText = parentHostContext.isInsideText
    // isInsideText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isInsideText =
      type === 'ink-text' || type === 'ink-virtual-text' || type === 'ink-link'

    // 满足 `previousIsInsideText === isInsideText` 时，终端渲染执行该分支。
    if (previousIsInsideText === isInsideText) {
      // 返回 `parentHostContext`，作为终端渲染这次计算的结果。
      return parentHostContext
    }

    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { isInsideText }
  },
  // 这个回调绑定到 shouldSetTextContent: () => false,，负责终端渲染在该局部场景下的响应。
  shouldSetTextContent: () => false,
  createInstance(
    originalType: ElementNames,
    newProps: Props,
    _root: DOMElement,
    hostContext: HostContext,
    internalHandle?: unknown,
  ): DOMElement {
    // 只有 `hostContext.isInsideText && originalType === 'ink` 满足时，终端渲染才执行该分支。
    if (hostContext.isInsideText && originalType === 'ink-box') {
      // 抛出 new Error(`<Box> can't be nested inside <Text> component`)，阻止终端渲染在无效状态下继续运行。
      throw new Error(`<Box> can't be nested inside <Text> component`)
    }

    // type 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const type =
      originalType === 'ink-text' && hostContext.isInsideText
        ? 'ink-virtual-text'
        : originalType

    // node构建`createNode`，供终端渲染后续处理使用。
    const node = createNode(type)
    // 满足 `COMMIT_LOG` 时，终端渲染执行该分支。
    if (COMMIT_LOG) _createCount++

    // 循环处理 `const [key, value] of Object.entries(newProps)`，让终端渲染把同类条目按顺序走完。
    for (const [key, value] of Object.entries(newProps)) {
      // 调用 applyProp，触发终端渲染此处需要的副作用。
      applyProp(node, key, value)
    }

    // 满足 `isDebugRepaintsEnabled()` 时，终端渲染执行该分支。
    if (isDebugRepaintsEnabled()) {
      // debugOwnerChain更新为 `getOwnerChain(internalHandle)`，确保Ink 渲染层后续读取最新状态。
      node.debugOwnerChain = getOwnerChain(internalHandle)
    }

    // 返回 `node`，作为终端渲染这次计算的结果。
    return node
  },
  // 调用 createTextInstance，触发终端渲染此处需要的副作用。
  createTextInstance(
    text: string,
    _root: DOMElement,
    hostContext: HostContext,
  ): TextNode {
    // hostContext.isInsideText缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!hostContext.isInsideText) {
      // 抛出 new Error(，阻止终端渲染在无效状态下继续运行。
      throw new Error(
        `Text string "${text}" must be rendered inside <Text> component`,
      )
    }

    // 返回 `createTextNode(text)`，作为终端渲染这次计算的结果。
    return createTextNode(text)
  },
  // resetTextContent 使用 无 完成终端渲染里的对应操作。
  resetTextContent() {},
  // hideTextInstance 使用 node 完成终端渲染里的对应操作。
  hideTextInstance(node) {
    // setTextNodeValue 写入新的状态值，使终端渲染后续读取保持一致。
    setTextNodeValue(node, '')
  },
  // unhideTextInstance 使用 node, text 完成终端渲染里的对应操作。
  unhideTextInstance(node, text) {
    // setTextNodeValue 写入新的状态值，使终端渲染后续读取保持一致。
    setTextNodeValue(node, text)
  },
  getPublicInstance: (instance): DOMElement => instance as DOMElement,
  // hideInstance 使用 node 完成终端渲染里的对应操作。
  hideInstance(node) {
    // isHidden更新为 `true`，确保Ink 渲染层后续读取最新状态。
    node.isHidden = true
    // 调用 node.yogaNode?.setDisplay(LayoutDisplay.None)，完成这一处局部操作。
    node.yogaNode?.setDisplay(LayoutDisplay.None)
    // 调用 markDirty，触发终端渲染此处需要的副作用。
    markDirty(node)
  },
  // unhideInstance 使用 node 完成终端渲染里的对应操作。
  unhideInstance(node) {
    // isHidden更新为 `false`，确保Ink 渲染层后续读取最新状态。
    node.isHidden = false
    // 调用 node.yogaNode?.setDisplay(LayoutDisplay.Flex)，完成这一处局部操作。
    node.yogaNode?.setDisplay(LayoutDisplay.Flex)
    // 调用 markDirty，触发终端渲染此处需要的副作用。
    markDirty(node)
  },
  appendInitialChild: appendChildNode,
  appendChild: appendChildNode,
  insertBefore: insertBeforeNode,
  // 调用 finalizeInitialChildren，触发终端渲染此处需要的副作用。
  finalizeInitialChildren(
    _node: DOMElement,
    _type: ElementNames,
    props: Props,
  ): boolean {
    // 返回 `props['autoFocus'] === true`，作为终端渲染这次计算的结果。
    return props['autoFocus'] === true
  },
  // commitMount 使用 node: DOMElement 完成终端渲染里的对应操作。
  commitMount(node: DOMElement): void {
    // 调用 getFocusManager，触发终端渲染此处需要的副作用。
    getFocusManager(node).handleAutoFocus(node)
  },
  isPrimaryRenderer: true,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  // 这个回调绑定到 getCurrentUpdatePriority: () => dispatcher.currentUpdatePriority,，负责终端渲染在该局部场景下的响应。
  getCurrentUpdatePriority: () => dispatcher.currentUpdatePriority,
  // beforeActiveInstanceBlur 使用 无 完成终端渲染里的对应操作。
  beforeActiveInstanceBlur() {},
  // afterActiveInstanceBlur 使用 无 完成终端渲染里的对应操作。
  afterActiveInstanceBlur() {},
  // detachDeletedInstance 使用 无 完成终端渲染里的对应操作。
  detachDeletedInstance() {},
  // 这个回调绑定到 getInstanceFromNode: () => null,，负责终端渲染在该局部场景下的响应。
  getInstanceFromNode: () => null,
  // prepareScopeUpdate 使用 无 完成终端渲染里的对应操作。
  prepareScopeUpdate() {},
  // 这个回调绑定到 getInstanceFromScope: () => null,，负责终端渲染在该局部场景下的响应。
  getInstanceFromScope: () => null,
  appendChildToContainer: appendChildNode,
  insertInContainerBefore: insertBeforeNode,
  // removeChildFromContainer 使用 node: DOMElement, removeNode: DOMElement 完成终端渲染里的对应操作。
  removeChildFromContainer(node: DOMElement, removeNode: DOMElement): void {
    // 调用 removeChildNode，触发终端渲染此处需要的副作用。
    removeChildNode(node, removeNode)
    // 调用 cleanupYogaNode，触发终端渲染此处需要的副作用。
    cleanupYogaNode(removeNode)
    // 调用 getFocusManager，触发终端渲染此处需要的副作用。
    getFocusManager(node).handleNodeRemoved(removeNode, node)
  },
  // React 19 commitUpdate receives old and new props directly instead of an updatePayload
  // 调用 commitUpdate，触发终端渲染此处需要的副作用。
  commitUpdate(
    node: DOMElement,
    _type: ElementNames,
    oldProps: Props,
    newProps: Props,
  ): void {
    // 组件属性保存`diff`，供终端渲染后续处理使用。
    const props = diff(oldProps, newProps)
    // style保存`diff`，供终端渲染后续处理使用。
    const style = diff(oldProps['style'] as Styles, newProps['style'] as Styles)

    // 满足 `props` 时，终端渲染执行该分支。
    if (props) {
      // 循环处理 `const [key, value] of Object.entries(props)`，让终端渲染把同类条目按顺序走完。
      for (const [key, value] of Object.entries(props)) {
        // 当 `key` 匹配 `'style'` 时，终端渲染执行对应分支。
        if (key === 'style') {
          // setStyle 写入新的状态值，使终端渲染后续读取保持一致。
          setStyle(node, value as Styles)
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue
        }

        // 当 `key` 匹配 `'textStyles'` 时，终端渲染执行对应分支。
        if (key === 'textStyles') {
          // setTextStyles 写入新的状态值，使终端渲染后续读取保持一致。
          setTextStyles(node, value as TextStyles)
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue
        }

        // 满足 `EVENT_HANDLER_PROPS.has(key)` 时，终端渲染执行该分支。
        if (EVENT_HANDLER_PROPS.has(key)) {
          // setEventHandler 写入新的状态值，使终端渲染后续读取保持一致。
          setEventHandler(node, key, value)
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue
        }

        // setAttribute 写入新的状态值，使终端渲染后续读取保持一致。
        setAttribute(node, key, value as DOMNodeAttribute)
      }
    }

    // 只有 `style && node.yogaNode` 满足时，终端渲染才执行该分支。
    if (style && node.yogaNode) {
      // 调用 applyStyles，触发终端渲染此处需要的副作用。
      applyStyles(node.yogaNode, style, newProps['style'] as Styles)
    }
  },
  // commitTextUpdate 使用 node: TextNode, _oldText: string, newText: string 完成终端渲染里的对应操作。
  commitTextUpdate(node: TextNode, _oldText: string, newText: string): void {
    // setTextNodeValue 写入新的状态值，使终端渲染后续读取保持一致。
    setTextNodeValue(node, newText)
  },
  // removeChild 使用 node, removeNode 完成终端渲染里的对应操作。
  removeChild(node, removeNode) {
    // 调用 removeChildNode，触发终端渲染此处需要的副作用。
    removeChildNode(node, removeNode)
    // 调用 cleanupYogaNode，触发终端渲染此处需要的副作用。
    cleanupYogaNode(removeNode)
    // `removeNode.nodeName` 与 `'#text'` 不一致时刷新派生状态，避免使用过期结果。
    if (removeNode.nodeName !== '#text') {
      // root读取`getRootNode`，供终端渲染后续处理使用。
      const root = getRootNode(node)
      // Ink 渲染层 reconciler在这里处理 `root.focusManager!.handleNodeRemoved(removeNode, root)`，完成这一小步状态转换。
      root.focusManager!.handleNodeRemoved(removeNode, root)
    }
  },
  // React 19 required methods
  // maySuspendCommit 使用 无 完成终端渲染里的对应操作。
  maySuspendCommit(): boolean {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  },
  // preloadInstance 使用 无 完成终端渲染里的对应操作。
  preloadInstance(): boolean {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // startSuspendingCommit 使用 无 完成终端渲染里的对应操作。
  startSuspendingCommit(): void {},
  // suspendInstance 使用 无 完成终端渲染里的对应操作。
  suspendInstance(): void {},
  // waitForCommitToBeReady 使用 无 完成终端渲染里的对应操作。
  waitForCommitToBeReady(): null {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null
  },
  NotPendingTransition: null,
  HostTransitionContext: {
    $$typeof: Symbol.for('react.context'),
    _currentValue: null,
  } as never,
  // setCurrentUpdatePriority 根据 newPriority: number 更新终端渲染的状态。
  setCurrentUpdatePriority(newPriority: number): void {
    // currentUpdatePriority更新为 `newPriority`，确保Ink 渲染层后续读取最新状态。
    dispatcher.currentUpdatePriority = newPriority
  },
  // resolveUpdatePriority 使用 无 完成终端渲染里的对应操作。
  resolveUpdatePriority(): number {
    // 返回 `dispatcher.resolveEventPriority()`，作为终端渲染这次计算的结果。
    return dispatcher.resolveEventPriority()
  },
  // resetFormInstance 使用 无 完成终端渲染里的对应操作。
  resetFormInstance(): void {},
  // requestPostPaintCallback 使用 无 完成终端渲染里的对应操作。
  requestPostPaintCallback(): void {},
  // shouldAttemptEagerTransition 用 无 判断终端渲染是否满足条件。
  shouldAttemptEagerTransition(): boolean {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  },
  // trackSchedulerEvent 使用 无 完成终端渲染里的对应操作。
  trackSchedulerEvent(): void {},
  // resolveEventType 使用 无 完成终端渲染里的对应操作。
  resolveEventType(): string | null {
    // 返回 `dispatcher.currentEvent?.type ?? null`，作为终端渲染这次计算的结果。
    return dispatcher.currentEvent?.type ?? null
  },
  // resolveEventTimeStamp 使用 无 完成终端渲染里的对应操作。
  resolveEventTimeStamp(): number {
    // 返回 `dispatcher.currentEvent?.timeStamp ?? -1.1`，作为终端渲染这次计算的结果。
    return dispatcher.currentEvent?.timeStamp ?? -1.1
  },
})

// Wire the reconciler's discreteUpdates into the dispatcher.
// This breaks the import cycle: dispatcher.ts doesn't import reconciler.ts.
// discreteUpdates 集合更新为 `reconciler.discreteUpdates.bind(reconciler)`，确保Ink 渲染层后续读取最新状态。
dispatcher.discreteUpdates = reconciler.discreteUpdates.bind(reconciler)

export default reconciler

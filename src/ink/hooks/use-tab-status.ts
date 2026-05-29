// 引入 useContext、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useContext, useEffect, useRef } from 'react'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  CLEAR_TAB_STATUS,
  supportsTabStatus,
  tabStatus,
  wrapForMultiplexer,
} from '../termio/osc.js'
// 类型依赖 { Color } 来自 ../termio/types.js，用于校准终端渲染的数据契约。
import type { Color } from '../termio/types.js'
// 引入 TerminalWriteContext，将 ../useTerminalNotification.js 中已经封装好的能力接到本文件流程里。
import { TerminalWriteContext } from '../useTerminalNotification.js'

// TabStatusKind 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TabStatusKind = 'idle' | 'busy' | 'waiting'

// rgb封装成回调，供Ink 渲染层 use tab status在事件触发或异步步骤中调用。
const rgb = (r: number, g: number, b: number): Color => ({
  type: 'rgb',
  r,
  g,
  b,
})

// Per the OSC 21337 usage guide's suggested mapping.
// TAB_STATUS_PRESETS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const TAB_STATUS_PRESETS: Record<
  TabStatusKind,
  { indicator: Color; status: string; statusColor: Color }
> = {
  idle: {
    indicator: rgb(0, 215, 95),
    status: 'Idle',
    statusColor: rgb(136, 136, 136),
  },
  busy: {
    indicator: rgb(255, 149, 0),
    status: 'Working…',
    statusColor: rgb(255, 149, 0),
  },
  waiting: {
    indicator: rgb(95, 135, 255),
    status: 'Waiting',
    statusColor: rgb(95, 135, 255),
  },
}

/**
 * Declaratively set the tab-status indicator (OSC 21337).
 *
 * Emits a colored dot + short status text to the tab sidebar. Terminals
 * that don't support OSC 21337 discard the sequence silently, so this is
 * safe to call unconditionally. Wrapped for tmux/screen passthrough.
 *
 * Pass `null` to opt out. If a status was previously set, transitioning to
 * `null` emits CLEAR_TAB_STATUS so toggling off mid-session doesn't leave
 * a stale dot. Process-exit cleanup is handled by ink.tsx's unmount path.
 */
// useTabStatus 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTabStatus(kind: TabStatusKind | null): void {
  // writeRaw保存`useContext`，供终端渲染后续处理使用。
  const writeRaw = useContext(TerminalWriteContext)
  // prevKindRef 引用保存 hook 状态，让Ink 渲染层 use tab status跨渲染复用同一个容器。
  const prevKindRef = useRef<TabStatusKind | null>(null)

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // When kind transitions from non-null to null (e.g. user toggles off
    // showStatusInTerminalTab mid-session), clear the stale dot.
    // 满足 `kind === null` 时，终端渲染执行该分支。
    if (kind === null) {
      // `prevKindRef.current` 与 `null && writeRaw && supportsTab...` 不一致时刷新派生状态，避免使用过期结果。
      if (prevKindRef.current !== null && writeRaw && supportsTabStatus()) {
        // 调用 writeRaw，触发终端渲染此处需要的副作用。
        writeRaw(wrapForMultiplexer(CLEAR_TAB_STATUS))
      }
      // current更新为 `null`，确保Ink 渲染层后续读取最新状态。
      prevKindRef.current = null
      // Ink 渲染层 use tab status在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // current更新为 `kind`，确保Ink 渲染层后续读取最新状态。
    prevKindRef.current = kind
    // 只有 `!writeRaw || !supportsTabStatus()` 满足时，终端渲染才执行该分支。
    if (!writeRaw || !supportsTabStatus()) return
    // 调用 writeRaw，触发终端渲染此处需要的副作用。
    writeRaw(wrapForMultiplexer(tabStatus(TAB_STATUS_PRESETS[kind])))
  }, [kind, writeRaw])
}

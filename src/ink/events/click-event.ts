// 引入 Event，将 ./event.js 中已经封装好的能力接到本文件流程里。
import { Event } from './event.js'

/**
 * Mouse click event. Fired on left-button release without drag, only when
 * mouse tracking is enabled (i.e. inside <AlternateScreen>).
 *
 * Bubbles from the deepest hit node up through parentNode. Call
 * stopImmediatePropagation() to prevent ancestors' onClick from firing.
 */
// ClickEvent 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class ClickEvent extends Event {
  /** 0-indexed screen column of the click */
  readonly col: number
  /** 0-indexed screen row of the click */
  readonly row: number
  /**
   * Click column relative to the current handler's Box (col - box.x).
   * Recomputed by dispatchClick before each handler fires, so an onClick
   * on a container sees coords relative to that container, not to any
   * child the click landed on.
   */
  localCol = 0
  /** Click row relative to the current handler's Box (row - box.y). */
  localRow = 0
  /**
   * True if the clicked cell has no visible content (unwritten in the
   * screen buffer — both packed words are 0). Handlers can check this to
   * ignore clicks on blank space to the right of text, so accidental
   * clicks on empty terminal space don't toggle state.
   */
  readonly cellIsBlank: boolean

  // 构造函数接收 col: number, row: number, cellIsBlank: boolean，把外部输入整理成实例可复用的内部状态。
  constructor(col: number, row: number, cellIsBlank: boolean) {
    // 调用 super，触发终端渲染此处需要的副作用。
    super()
    // 更新实例字段 col 为 col，同步终端渲染的内部状态。
    this.col = col
    // 更新实例字段 row 为 row，同步终端渲染的内部状态。
    this.row = row
    // 更新实例字段 cellIsBlank 为 cellIsBlank，同步终端渲染的内部状态。
    this.cellIsBlank = cellIsBlank
  }
}

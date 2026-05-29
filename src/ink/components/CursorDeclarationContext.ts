// 引入 createContext，将 react 中已经封装好的能力接到本文件流程里。
import { createContext } from 'react'
// 类型依赖 { DOMElement } 来自 ../dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from '../dom.js'

// CursorDeclaration 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type CursorDeclaration = {
  /** Display column (terminal cell width) within the declared node */
  readonly relativeX: number
  /** Line number within the declared node */
  readonly relativeY: number
  /** The ink-box DOMElement whose yoga layout provides the absolute origin */
  readonly node: DOMElement
}

/**
 * Setter for the declared cursor position.
 *
 * The optional second argument makes `null` a conditional clear: the
 * declaration is only cleared if the currently-declared node matches
 * `clearIfNode`. This makes the hook safe for sibling components
 * (e.g. list items) that transfer focus among themselves — without the
 * node check, a newly-unfocused item's clear could clobber a
 * newly-focused sibling's set depending on layout-effect order.
 */
// CursorDeclarationSetter 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type CursorDeclarationSetter = (
  declaration: CursorDeclaration | null,
  clearIfNode?: DOMElement | null,
) => void

// CursorDeclarationContext构建`createContext<CursorDeclarationSetter>(` 整理出中间结果，供终端 UI Cursor Declaration C...后续步骤使用。
const CursorDeclarationContext = createContext<CursorDeclarationSetter>(
  // 这个回调绑定到 () => {},，负责终端渲染在该局部场景下的响应。
  () => {},
)

export default CursorDeclarationContext

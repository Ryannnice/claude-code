/**
 * Pure-TypeScript port of yoga-layout (Meta's flexbox engine).
 *
 * This matches the `yoga-layout/load` API surface used by src/ink/layout/yoga.ts.
 * The upstream C++ source is ~2500 lines in CalculateLayout.cpp alone; this port
 * is a simplified single-pass flexbox implementation that covers the subset of
 * features Ink actually uses:
 *   - flex-direction (row/column + reverse)
 *   - flex-grow / flex-shrink / flex-basis
 *   - align-items / align-self (stretch, flex-start, center, flex-end)
 *   - justify-content (all six values)
 *   - margin / padding / border / gap
 *   - width / height / min / max (point, percent, auto)
 *   - position: relative / absolute
 *   - display: flex / none
 *   - measure functions (for text nodes)
 *
 * Also implemented for spec parity (not used by Ink):
 *   - margin: auto (main + cross axis, overrides justify/align)
 *   - multi-pass flex clamping when children hit min/max constraints
 *   - flex-grow/shrink against container min/max when size is indefinite
 *
 * Also implemented for spec parity (not used by Ink):
 *   - flex-wrap: wrap / wrap-reverse (multi-line flex)
 *   - align-content (positions wrapped lines on cross axis)
 *
 * Also implemented for spec parity (not used by Ink):
 *   - display: contents (children lifted to grandparent, box removed)
 *
 * Also implemented for spec parity (not used by Ink):
 *   - baseline alignment (align-items/align-self: baseline)
 *
 * Not implemented (not used by Ink):
 *   - aspect-ratio
 *   - box-sizing: content-box
 *   - RTL direction (Ink always passes Direction.LTR)
 *
 * Upstream: https://github.com/facebook/yoga
 */

// 整理这一组导入，让index后续逻辑可以直接复用这些外部能力。
import {
  Align,
  BoxSizing,
  Dimension,
  Direction,
  Display,
  Edge,
  Errata,
  ExperimentalFeature,
  FlexDirection,
  Gutter,
  Justify,
  MeasureMode,
  Overflow,
  PositionType,
  Unit,
  Wrap,
} from './enums.js'

// 重新导出这一组成员，让index的公共 API 保持集中入口。
export {
  Align,
  BoxSizing,
  Dimension,
  Direction,
  Display,
  Edge,
  Errata,
  ExperimentalFeature,
  FlexDirection,
  Gutter,
  Justify,
  MeasureMode,
  Overflow,
  PositionType,
  Unit,
  Wrap,
}

// --
// Value types

// Value 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type Value = {
  unit: Unit
  value: number
}

// UNDEFINED_VALUE 集中保存index要一起传递的字段。
const UNDEFINED_VALUE: Value = { unit: Unit.Undefined, value: NaN }
// AUTO_VALUE 集中保存index要一起传递的字段。
const AUTO_VALUE: Value = { unit: Unit.Auto, value: NaN }

// pointValue 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pointValue(v: number): Value {
  // 返回结构化结果，集中表达index已经整理出的状态。
  return { unit: Unit.Point, value: v }
}
// percentValue 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function percentValue(v: number): Value {
  // 返回结构化结果，集中表达index已经整理出的状态。
  return { unit: Unit.Percent, value: v }
}

// resolveValue 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveValue(v: Value, ownerSize: number): number {
  // 按照 v.unit 的取值选择index的具体处理分支。
  switch (v.unit) {
    case Unit.Point:
      // 返回 `v.value`，作为index这次计算的结果。
      return v.value
    case Unit.Percent:
      // 返回 `isNaN(ownerSize) ? NaN : (v.value * ownerSize) / 100`，作为index这次计算的结果。
      return isNaN(ownerSize) ? NaN : (v.value * ownerSize) / 100
    default:
      // 返回 `NaN`，作为index这次计算的结果。
      return NaN
  }
}

// isDefined 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isDefined(n: number): boolean {
  // 返回 `!isNaN(n)`，作为index这次计算的结果。
  return !isNaN(n)
}

// NaN-safe equality for layout-cache input comparison
// sameFloat 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sameFloat(a: number, b: number): boolean {
  // 返回 `a === b || (a !== a && b !== b)`，作为index这次计算的结果。
  return a === b || (a !== a && b !== b)
}

// --
// Layout result (computed values)

// Layout 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Layout = {
  left: number
  top: number
  width: number
  height: number
  // Computed per-edge values (resolved to physical edges)
  border: [number, number, number, number] // left, top, right, bottom
  padding: [number, number, number, number]
  margin: [number, number, number, number]
}

// --
// Style (input values)

// Style 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
type Style = {
  direction: Direction
  flexDirection: FlexDirection
  justifyContent: Justify
  alignItems: Align
  alignSelf: Align
  alignContent: Align
  flexWrap: Wrap
  overflow: Overflow
  display: Display
  positionType: PositionType

  flexGrow: number
  flexShrink: number
  flexBasis: Value

  // 9-edge arrays indexed by Edge enum
  margin: Value[]
  padding: Value[]
  border: Value[]
  position: Value[]

  // 3-gutter array indexed by Gutter enum
  gap: Value[]

  width: Value
  height: Value
  minWidth: Value
  minHeight: Value
  maxWidth: Value
  maxHeight: Value
}

// defaultStyle 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function defaultStyle(): Style {
  // 返回结构化结果，集中表达index已经整理出的状态。
  return {
    direction: Direction.Inherit,
    flexDirection: FlexDirection.Column,
    justifyContent: Justify.FlexStart,
    alignItems: Align.Stretch,
    alignSelf: Align.Auto,
    alignContent: Align.FlexStart,
    flexWrap: Wrap.NoWrap,
    overflow: Overflow.Visible,
    display: Display.Flex,
    positionType: PositionType.Relative,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: AUTO_VALUE,
    margin: new Array(9).fill(UNDEFINED_VALUE),
    padding: new Array(9).fill(UNDEFINED_VALUE),
    border: new Array(9).fill(UNDEFINED_VALUE),
    position: new Array(9).fill(UNDEFINED_VALUE),
    gap: new Array(3).fill(UNDEFINED_VALUE),
    width: AUTO_VALUE,
    height: AUTO_VALUE,
    minWidth: UNDEFINED_VALUE,
    minHeight: UNDEFINED_VALUE,
    maxWidth: UNDEFINED_VALUE,
    maxHeight: UNDEFINED_VALUE,
  }
}

// --
// Edge resolution — yoga's 9-edge model collapsed to 4 physical edges

// EDGE_LEFT保存`0`，供index后续判断或输出使用。
const EDGE_LEFT = 0
// EDGE_TOP保存`1`，供后续判断或组装使用。
const EDGE_TOP = 1
// EDGE_RIGHT保存`2`，供后续判断或组装使用。
const EDGE_RIGHT = 2
// EDGE_BOTTOM保存`3`，供后续判断或组装使用。
const EDGE_BOTTOM = 3

// resolveEdge 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveEdge(
  edges: Value[],
  physicalEdge: number,
  ownerSize: number,
  // For margin/position we allow auto; for padding/border auto resolves to 0
  allowAuto = false,
): number {
  // Precedence: specific edge > horizontal/vertical > all
  // v保存`edges[physicalEdge]!`，供index后续判断或输出使用。
  let v = edges[physicalEdge]!
  // 满足 `v.unit === Unit.Undefined` 时，index执行该分支。
  if (v.unit === Unit.Undefined) {
    // 组合条件 `physicalEdge === EDGE_LEFT || physicalEdge === ED` 成立时，index才启用这条专门路径。
    if (physicalEdge === EDGE_LEFT || physicalEdge === EDGE_RIGHT) {
      // v更新为 `edges[Edge.Horizontal]!`，确保index后续读取最新状态。
      v = edges[Edge.Horizontal]!
    } else {
      // v更新为 `edges[Edge.Vertical]!`，确保index后续读取最新状态。
      v = edges[Edge.Vertical]!
    }
  }
  // 满足 `v.unit === Unit.Undefined` 时，index执行该分支。
  if (v.unit === Unit.Undefined) {
    // v更新为 `edges[Edge.All]!`，确保index后续读取最新状态。
    v = edges[Edge.All]!
  }
  // Start/End map to Left/Right for LTR (Ink is always LTR)
  // 满足 `v.unit === Unit.Undefined` 时，index执行该分支。
  if (v.unit === Unit.Undefined) {
    // 满足 `physicalEdge === EDGE_LEFT` 时，index执行该分支。
    if (physicalEdge === EDGE_LEFT) v = edges[Edge.Start]!
    // 满足 `physicalEdge === EDGE_RIGHT` 时，index执行该分支。
    if (physicalEdge === EDGE_RIGHT) v = edges[Edge.End]!
  }
  // 满足 `v.unit === Unit.Undefined` 时，index执行该分支。
  if (v.unit === Unit.Undefined) return 0
  // 满足 `v.unit === Unit.Auto` 时，index执行该分支。
  if (v.unit === Unit.Auto) return allowAuto ? NaN : 0
  // 返回 `resolveValue(v, ownerSize)`，作为index这次计算的结果。
  return resolveValue(v, ownerSize)
}

// resolveEdgeRaw 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveEdgeRaw(edges: Value[], physicalEdge: number): Value {
  // v保存`edges[physicalEdge]!`，供index后续判断或输出使用。
  let v = edges[physicalEdge]!
  // 满足 `v.unit === Unit.Undefined` 时，index执行该分支。
  if (v.unit === Unit.Undefined) {
    // 组合条件 `physicalEdge === EDGE_LEFT || physicalEdge === ED` 成立时，index才启用这条专门路径。
    if (physicalEdge === EDGE_LEFT || physicalEdge === EDGE_RIGHT) {
      // v更新为 `edges[Edge.Horizontal]!`，确保index后续读取最新状态。
      v = edges[Edge.Horizontal]!
    } else {
      // v更新为 `edges[Edge.Vertical]!`，确保index后续读取最新状态。
      v = edges[Edge.Vertical]!
    }
  }
  // 满足 `v.unit === Unit.Undefined` 时，index执行该分支。
  if (v.unit === Unit.Undefined) v = edges[Edge.All]!
  // 满足 `v.unit === Unit.Undefined` 时，index执行该分支。
  if (v.unit === Unit.Undefined) {
    // 满足 `physicalEdge === EDGE_LEFT` 时，index执行该分支。
    if (physicalEdge === EDGE_LEFT) v = edges[Edge.Start]!
    // 满足 `physicalEdge === EDGE_RIGHT` 时，index执行该分支。
    if (physicalEdge === EDGE_RIGHT) v = edges[Edge.End]!
  }
  // 返回 `v`，作为index这次计算的结果。
  return v
}

// isMarginAuto 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMarginAuto(edges: Value[], physicalEdge: number): boolean {
  // 返回 `resolveEdgeRaw(edges, physicalEdge).unit === Unit.Auto`，作为index这次计算的结果。
  return resolveEdgeRaw(edges, physicalEdge).unit === Unit.Auto
}

// Setter helpers for the _hasAutoMargin / _hasPosition fast-path flags.
// Unit.Undefined = 0, Unit.Auto = 3.
// hasAnyAutoEdge 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasAnyAutoEdge(edges: Value[]): boolean {
  // 按索引扫描 `9`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < 9; i++) if (edges[i]!.unit === 3) return true
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
// hasAnyDefinedEdge 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasAnyDefinedEdge(edges: Value[]): boolean {
  // 按索引扫描 `9`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < 9; i++) if (edges[i]!.unit !== 0) return true
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// Hot path: resolve all 4 physical edges in one pass, writing into `out`.
// Equivalent to calling resolveEdge() 4× with allowAuto=false, but hoists the
// shared fallback lookups (Horizontal/Vertical/All/Start/End) and avoids
// allocating a fresh 4-array on every layoutNode() call.
// resolveEdges4Into 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveEdges4Into(
  edges: Value[],
  ownerSize: number,
  out: [number, number, number, number],
): void {
  // Hoist fallbacks once — the 4 per-edge chains share these reads.
  // eH 命名 `edges[6]! // Edge.Horizontal`，让后续代码直接表达这个值的用途。
  const eH = edges[6]! // Edge.Horizontal
  // eV 命名 `edges[7]! // Edge.Vertical`，让后续代码直接表达这个值的用途。
  const eV = edges[7]! // Edge.Vertical
  // eA保存`edges[8]! // Edge.All`，供index后续判断或输出使用。
  const eA = edges[8]! // Edge.All
  // eS 集合 命名 `edges[4]! // Edge.Start`，让后续代码直接表达这个值的用途。
  const eS = edges[4]! // Edge.Start
  // eE 命名 `edges[5]! // Edge.End`，让后续代码直接表达这个值的用途。
  const eE = edges[5]! // Edge.End
  // pctDenom保存`isNaN`，供index后续处理使用。
  const pctDenom = isNaN(ownerSize) ? NaN : ownerSize / 100

  // Left: edges[0] → Horizontal → All → Start
  // v读取 `edges[0]!` 对应条目，后续围绕该成员继续处理。
  let v = edges[0]!
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eH
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eA
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eS
  // out[0更新为 `v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDeno...`，确保index后续读取最新状态。
  out[0] = v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDenom : 0

  // Top: edges[1] → Vertical → All
  // v更新为 `edges[1]!`，确保index后续读取最新状态。
  v = edges[1]!
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eV
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eA
  // out[1更新为 `v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDeno...`，确保index后续读取最新状态。
  out[1] = v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDenom : 0

  // Right: edges[2] → Horizontal → All → End
  // v更新为 `edges[2]!`，确保index后续读取最新状态。
  v = edges[2]!
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eH
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eA
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eE
  // out[2更新为 `v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDeno...`，确保index后续读取最新状态。
  out[2] = v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDenom : 0

  // Bottom: edges[3] → Vertical → All
  // v更新为 `edges[3]!`，确保index后续读取最新状态。
  v = edges[3]!
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eV
  // 满足 `v.unit === 0` 时，index执行该分支。
  if (v.unit === 0) v = eA
  // out[3更新为 `v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDeno...`，确保index后续读取最新状态。
  out[3] = v.unit === 1 ? v.value : v.unit === 2 ? v.value * pctDenom : 0
}

// --
// Axis helpers

// isRow 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isRow(dir: FlexDirection): boolean {
  // 返回 `dir === FlexDirection.Row || dir === FlexDirection.RowReverse`，作为index这次计算的结果。
  return dir === FlexDirection.Row || dir === FlexDirection.RowReverse
}
// isReverse 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isReverse(dir: FlexDirection): boolean {
  // 返回 `dir === FlexDirection.RowReverse || dir === FlexDirection.ColumnReverse`，作为index这次计算的结果。
  return dir === FlexDirection.RowReverse || dir === FlexDirection.ColumnReverse
}
// crossAxis 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function crossAxis(dir: FlexDirection): FlexDirection {
  // 返回 `isRow(dir) ? FlexDirection.Column : FlexDirection.Row`，作为index这次计算的结果。
  return isRow(dir) ? FlexDirection.Column : FlexDirection.Row
}
// leadingEdge 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function leadingEdge(dir: FlexDirection): number {
  // 按照 dir 的取值选择index的具体处理分支。
  switch (dir) {
    case FlexDirection.Row:
      // 返回 `EDGE_LEFT`，作为index这次计算的结果。
      return EDGE_LEFT
    case FlexDirection.RowReverse:
      // 返回 `EDGE_RIGHT`，作为index这次计算的结果。
      return EDGE_RIGHT
    case FlexDirection.Column:
      // 返回 `EDGE_TOP`，作为index这次计算的结果。
      return EDGE_TOP
    case FlexDirection.ColumnReverse:
      // 返回 `EDGE_BOTTOM`，作为index这次计算的结果。
      return EDGE_BOTTOM
  }
}
// trailingEdge 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function trailingEdge(dir: FlexDirection): number {
  // 按照 dir 的取值选择index的具体处理分支。
  switch (dir) {
    case FlexDirection.Row:
      // 返回 `EDGE_RIGHT`，作为index这次计算的结果。
      return EDGE_RIGHT
    case FlexDirection.RowReverse:
      // 返回 `EDGE_LEFT`，作为index这次计算的结果。
      return EDGE_LEFT
    case FlexDirection.Column:
      // 返回 `EDGE_BOTTOM`，作为index这次计算的结果。
      return EDGE_BOTTOM
    case FlexDirection.ColumnReverse:
      // 返回 `EDGE_TOP`，作为index这次计算的结果。
      return EDGE_TOP
  }
}

// --
// Public types

// MeasureFunction 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type MeasureFunction = (
  width: number,
  widthMode: MeasureMode,
  height: number,
  heightMode: MeasureMode,
) => { width: number; height: number }

// Size 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type Size = { width: number; height: number }

// --
// Config

// Config 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type Config = {
  pointScaleFactor: number
  errata: Errata
  useWebDefaults: boolean
  free(): void
  // isExperimentalFeatureEnabled 用 _: ExperimentalFeature 判断index是否满足条件。
  isExperimentalFeatureEnabled(_: ExperimentalFeature): boolean
  // setExperimentalFeatureEnabled 根据 _: ExperimentalFeature, __: boolean 更新index的状态。
  setExperimentalFeatureEnabled(_: ExperimentalFeature, __: boolean): void
  // setPointScaleFactor 根据 factor: number 更新index的状态。
  setPointScaleFactor(factor: number): void
  // getErrata不依赖额外参数，直接计算index需要的结果。
  getErrata(): Errata
  // setErrata 根据 errata: Errata 更新index的状态。
  setErrata(errata: Errata): void
  // setUseWebDefaults 根据 v: boolean 更新index的状态。
  setUseWebDefaults(v: boolean): void
}

// createConfig 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createConfig(): Config {
  // 配置 集中保存index要一起传递的字段。
  const config: Config = {
    pointScaleFactor: 1,
    errata: Errata.None,
    useWebDefaults: false,
    // free 使用 无 完成index里的对应操作。
    free() {},
    // isExperimentalFeatureEnabled 用 无 判断index是否满足条件。
    isExperimentalFeatureEnabled() {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    },
    // setExperimentalFeatureEnabled 根据 无 更新index的状态。
    setExperimentalFeatureEnabled() {},
    // setPointScaleFactor 根据 f 更新index的状态。
    setPointScaleFactor(f) {
      // pointScaleFactor更新为 `f`，确保index后续读取最新状态。
      config.pointScaleFactor = f
    },
    // getErrata不依赖额外参数，直接计算index需要的结果。
    getErrata() {
      // 返回 `config.errata`，作为index这次计算的结果。
      return config.errata
    },
    // setErrata 根据 e 更新index的状态。
    setErrata(e) {
      // errata更新为 `e`，确保index后续读取最新状态。
      config.errata = e
    },
    // setUseWebDefaults 根据 v 更新index的状态。
    setUseWebDefaults(v) {
      // useWebDefaults 集合更新为 `v`，确保index后续读取最新状态。
      config.useWebDefaults = v
    },
  }
  // 返回 `config`，作为index这次计算的结果。
  return config
}

// --
// Node implementation

// Node 聚合index相关状态与操作，把同一职责的行为收束到类实例中。
export class Node {
  style: Style
  layout: Layout
  parent: Node | null
  children: Node[]
  measureFunc: MeasureFunction | null
  config: Config
  isDirty_: boolean
  isReferenceBaseline_: boolean

  // Per-layout scratch (not public API)
  _flexBasis = 0
  _mainSize = 0
  _crossSize = 0
  _lineIndex = 0
  // Fast-path flags maintained by style setters. Per CPU profile, the
  // positioning loop calls isMarginAuto 6× and resolveEdgeRaw(position) 4×
  // per child per layout pass — ~11k calls for the 1000-node bench, nearly
  // all of which return false/undefined since most nodes have no auto
  // margins and no position insets. These flags let us skip straight to
  // the common case with a single branch.
  _hasAutoMargin = false
  _hasPosition = false
  // Same pattern for the 3× resolveEdges4Into calls at the top of every
  // layoutNode(). In the 1000-node bench ~67% of those calls operate on
  // all-undefined edge arrays (most nodes have no border; only cols have
  // padding; only leaf cells have margin) — a single-branch skip beats
  // ~20 property reads + ~15 compares + 4 writes of zeros.
  _hasPadding = false
  _hasBorder = false
  _hasMargin = false
  // -- Dirty-flag layout cache. Mirrors upstream CalculateLayout.cpp's
  // layoutNodeInternal: skip a subtree entirely when it's clean and we're
  // asking the same question we cached the answer to. Two slots since
  // each node typically sees a measure call (performLayout=false, from
  // computeFlexBasis) followed by a layout call (performLayout=true) with
  // different inputs per parent pass — a single slot thrashes. Re-layout
  // bench (dirty one leaf, recompute root) went 2.7x→1.1x with this:
  // clean siblings skip straight through, only the dirty chain recomputes.
  _lW = NaN
  _lH = NaN
  _lWM: MeasureMode = 0
  _lHM: MeasureMode = 0
  _lOW = NaN
  _lOH = NaN
  _lFW = false
  _lFH = false
  // _hasL stores INPUTS early (before compute) but layout.width/height are
  // mutated by the multi-entry cache and by subsequent compute calls with
  // different inputs. Without storing OUTPUTS, a _hasL hit returns whatever
  // layout.width/height happened to be left by the last call — the scrollbox
  // vpH=33→2624 bug. Store + restore outputs like the multi-entry cache does.
  _lOutW = NaN
  _lOutH = NaN
  _hasL = false
  _mW = NaN
  _mH = NaN
  _mWM: MeasureMode = 0
  _mHM: MeasureMode = 0
  _mOW = NaN
  _mOH = NaN
  _mOutW = NaN
  _mOutH = NaN
  _hasM = false
  // Cached computeFlexBasis result. For clean children, basis only depends
  // on the container's inner dimensions — if those haven't changed, skip the
  // layoutNode(performLayout=false) recursion entirely. This is the hot path
  // for scroll: 500-message content container is dirty, its 499 clean
  // children each get measured ~20× as the dirty chain's measure/layout
  // passes cascade. Basis cache short-circuits at the child boundary.
  _fbBasis = NaN
  _fbOwnerW = NaN
  _fbOwnerH = NaN
  _fbAvailMain = NaN
  _fbAvailCross = NaN
  _fbCrossMode: MeasureMode = 0
  // Generation at which _fbBasis was written. Dirty nodes from a PREVIOUS
  // generation have stale cache (subtree changed), but within the SAME
  // generation the cache is fresh — the dirty chain's measure→layout
  // cascade invokes computeFlexBasis ≥2^depth times per calculateLayout on
  // fresh-mounted items, and the subtree doesn't change between calls.
  // Gating on generation instead of isDirty_ lets fresh mounts (virtual
  // scroll) cache-hit after first compute: 105k visits → ~10k.
  _fbGen = -1
  // Multi-entry layout cache — stores (inputs → computed w,h) so hits with
  // different inputs than _hasL can restore the right dimensions. Upstream
  // yoga uses 16; 4 covers Ink's dirty-chain depth. Packed as flat arrays
  // to avoid per-entry object allocs. Slot i uses indices [i*8, i*8+8) in
  // _cIn (aW,aH,wM,hM,oW,oH,fW,fH) and [i*2, i*2+2) in _cOut (w,h).
  _cIn: Float64Array | null = null
  _cOut: Float64Array | null = null
  _cGen = -1
  _cN = 0
  _cWr = 0

  // 构造函数接收 config?: Config，把外部输入整理成实例可复用的内部状态。
  constructor(config?: Config) {
    // 更新实例字段 style 为 defaultStyle()，同步index的内部状态。
    this.style = defaultStyle()
    // 更新实例字段 layout 为 {，同步index的内部状态。
    this.layout = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      border: [0, 0, 0, 0],
      padding: [0, 0, 0, 0],
      margin: [0, 0, 0, 0],
    }
    // 更新实例字段 parent 为 null，同步index的内部状态。
    this.parent = null
    // 更新实例字段 children 为 []，同步index的内部状态。
    this.children = []
    // 更新实例字段 measureFunc 为 null，同步index的内部状态。
    this.measureFunc = null
    // 更新实例字段 config 为 config ?? DEFAULT_CONFIG，同步index的内部状态。
    this.config = config ?? DEFAULT_CONFIG
    // 更新实例字段 isDirty_ 为 true，同步index的内部状态。
    this.isDirty_ = true
    // 更新实例字段 isReferenceBaseline_ 为 false，同步index的内部状态。
    this.isReferenceBaseline_ = false
    // index在这里处理 `_yogaLiveNodes++`，完成这一小步状态转换。
    _yogaLiveNodes++
  }

  // -- Tree

  // insertChild 使用 child: Node, index: number 完成index里的对应操作。
  insertChild(child: Node, index: number): void {
    // parent更新为 `this`，确保index后续读取最新状态。
    child.parent = this
    // 调用 this.children.splice，触发index此处需要的副作用。
    this.children.splice(index, 0, child)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // removeChild 使用 child: Node 完成index里的对应操作。
  removeChild(child: Node): void {
    // idx保存`children.indexOf`，供index后续处理使用。
    const idx = this.children.indexOf(child)
    // 满足 `idx >= 0` 时，index执行该分支。
    if (idx >= 0) {
      // 调用 this.children.splice，触发index此处需要的副作用。
      this.children.splice(idx, 1)
      // parent更新为 `null`，确保index后续读取最新状态。
      child.parent = null
      // 调用 this.markDirty，触发index此处需要的副作用。
      this.markDirty()
    }
  }
  // getChild 根据 index: number 读取或计算index需要的结果。
  getChild(index: number): Node {
    // 返回 `this.children[index]!`，作为index这次计算的结果。
    return this.children[index]!
  }
  // getChildCount不依赖额外参数，直接计算index需要的结果。
  getChildCount(): number {
    // 返回 `this.children.length`，作为index这次计算的结果。
    return this.children.length
  }
  // getParent不依赖额外参数，直接计算index需要的结果。
  getParent(): Node | null {
    // 返回 `this.parent`，作为index这次计算的结果。
    return this.parent
  }

  // -- Lifecycle

  // free 使用 无 完成index里的对应操作。
  free(): void {
    // 更新实例字段 parent 为 null，同步index的内部状态。
    this.parent = null
    // 更新实例字段 children 为 []，同步index的内部状态。
    this.children = []
    // 更新实例字段 measureFunc 为 null，同步index的内部状态。
    this.measureFunc = null
    // 更新实例字段 _cIn 为 null，同步index的内部状态。
    this._cIn = null
    // 更新实例字段 _cOut 为 null，同步index的内部状态。
    this._cOut = null
    // index在这里处理 `_yogaLiveNodes--`，完成这一小步状态转换。
    _yogaLiveNodes--
  }
  // freeRecursive 使用 无 完成index里的对应操作。
  freeRecursive(): void {
    // 逐项读取 `this.children) c.freeRecursive(` 中的c，按输入顺序推进index。
    for (const c of this.children) c.freeRecursive()
    // 调用 this.free，触发index此处需要的副作用。
    this.free()
  }
  // reset 使用 无 完成index里的对应操作。
  reset(): void {
    // 更新实例字段 style 为 defaultStyle()，同步index的内部状态。
    this.style = defaultStyle()
    // 更新实例字段 children 为 []，同步index的内部状态。
    this.children = []
    // 更新实例字段 parent 为 null，同步index的内部状态。
    this.parent = null
    // 更新实例字段 measureFunc 为 null，同步index的内部状态。
    this.measureFunc = null
    // 更新实例字段 isDirty_ 为 true，同步index的内部状态。
    this.isDirty_ = true
    // 更新实例字段 _hasAutoMargin 为 false，同步index的内部状态。
    this._hasAutoMargin = false
    // 更新实例字段 _hasPosition 为 false，同步index的内部状态。
    this._hasPosition = false
    // 更新实例字段 _hasPadding 为 false，同步index的内部状态。
    this._hasPadding = false
    // 更新实例字段 _hasBorder 为 false，同步index的内部状态。
    this._hasBorder = false
    // 更新实例字段 _hasMargin 为 false，同步index的内部状态。
    this._hasMargin = false
    // 更新实例字段 _hasL 为 false，同步index的内部状态。
    this._hasL = false
    // 更新实例字段 _hasM 为 false，同步index的内部状态。
    this._hasM = false
    // 更新实例字段 _cN 为 0，同步index的内部状态。
    this._cN = 0
    // 更新实例字段 _cWr 为 0，同步index的内部状态。
    this._cWr = 0
    // 更新实例字段 _fbBasis 为 NaN，同步index的内部状态。
    this._fbBasis = NaN
  }

  // -- Dirty tracking

  // markDirty 使用 无 完成index里的对应操作。
  markDirty(): void {
    // 更新实例字段 isDirty_ 为 true，同步index的内部状态。
    this.isDirty_ = true
    // 组合条件 `this.parent && !this.parent.isDirty_) this.parent.markDirty(` 成立时，index才启用这条专门路径。
    if (this.parent && !this.parent.isDirty_) this.parent.markDirty()
  }
  // isDirty 用 无 判断index是否满足条件。
  isDirty(): boolean {
    // 返回 `this.isDirty_`，作为index这次计算的结果。
    return this.isDirty_
  }
  // hasNewLayout 用 无 判断index是否满足条件。
  hasNewLayout(): boolean {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // markLayoutSeen 使用 无 完成index里的对应操作。
  markLayoutSeen(): void {}

  // -- Measure function

  // setMeasureFunc 根据 fn: MeasureFunction | null 更新index的状态。
  setMeasureFunc(fn: MeasureFunction | null): void {
    // 更新实例字段 measureFunc 为 fn，同步index的内部状态。
    this.measureFunc = fn
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // unsetMeasureFunc 使用 无 完成index里的对应操作。
  unsetMeasureFunc(): void {
    // 更新实例字段 measureFunc 为 null，同步index的内部状态。
    this.measureFunc = null
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }

  // -- Computed layout getters

  // getComputedLeft不依赖额外参数，直接计算index需要的结果。
  getComputedLeft(): number {
    // 返回 `this.layout.left`，作为index这次计算的结果。
    return this.layout.left
  }
  // getComputedTop不依赖额外参数，直接计算index需要的结果。
  getComputedTop(): number {
    // 返回 `this.layout.top`，作为index这次计算的结果。
    return this.layout.top
  }
  // getComputedWidth不依赖额外参数，直接计算index需要的结果。
  getComputedWidth(): number {
    // 返回 `this.layout.width`，作为index这次计算的结果。
    return this.layout.width
  }
  // getComputedHeight不依赖额外参数，直接计算index需要的结果。
  getComputedHeight(): number {
    // 返回 `this.layout.height`，作为index这次计算的结果。
    return this.layout.height
  }
  // getComputedRight不依赖额外参数，直接计算index需要的结果。
  getComputedRight(): number {
    // p 命名 `this.parent`，让后续代码直接表达这个值的用途。
    const p = this.parent
    // 返回 `p ? p.layout.width - this.layout.left - this.layout.width : 0`，作为index这次计算的结果。
    return p ? p.layout.width - this.layout.left - this.layout.width : 0
  }
  // getComputedBottom不依赖额外参数，直接计算index需要的结果。
  getComputedBottom(): number {
    // p 命名 `this.parent`，让后续代码直接表达这个值的用途。
    const p = this.parent
    // 返回 `p ? p.layout.height - this.layout.top - this.layout.height : 0`，作为index这次计算的结果。
    return p ? p.layout.height - this.layout.top - this.layout.height : 0
  }
  // getComputedLayout不依赖额外参数，直接计算index需要的结果。
  getComputedLayout(): {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  } {
    // 返回结构化结果，集中表达index已经整理出的状态。
    return {
      left: this.layout.left,
      top: this.layout.top,
      right: this.getComputedRight(),
      bottom: this.getComputedBottom(),
      width: this.layout.width,
      height: this.layout.height,
    }
  }
  // getComputedBorder 根据 edge: Edge 读取或计算index需要的结果。
  getComputedBorder(edge: Edge): number {
    // 返回 `this.layout.border[physicalEdge(edge)]!`，作为index这次计算的结果。
    return this.layout.border[physicalEdge(edge)]!
  }
  // getComputedPadding 根据 edge: Edge 读取或计算index需要的结果。
  getComputedPadding(edge: Edge): number {
    // 返回 `this.layout.padding[physicalEdge(edge)]!`，作为index这次计算的结果。
    return this.layout.padding[physicalEdge(edge)]!
  }
  // getComputedMargin 根据 edge: Edge 读取或计算index需要的结果。
  getComputedMargin(edge: Edge): number {
    // 返回 `this.layout.margin[physicalEdge(edge)]!`，作为index这次计算的结果。
    return this.layout.margin[physicalEdge(edge)]!
  }

  // -- Style setters: dimensions

  // setWidth 根据 v: number | 'auto' | string | undefined 更新index的状态。
  setWidth(v: number | 'auto' | string | undefined): void {
    // width更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.width = parseDimension(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setWidthPercent 根据 v: number 更新index的状态。
  setWidthPercent(v: number): void {
    // width更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.width = percentValue(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setWidthAuto 根据 无 更新index的状态。
  setWidthAuto(): void {
    // width更新为 `AUTO_VALUE`，确保index后续读取最新状态。
    this.style.width = AUTO_VALUE
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setHeight 根据 v: number | 'auto' | string | undefined 更新index的状态。
  setHeight(v: number | 'auto' | string | undefined): void {
    // height更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.height = parseDimension(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setHeightPercent 根据 v: number 更新index的状态。
  setHeightPercent(v: number): void {
    // height更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.height = percentValue(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setHeightAuto 根据 无 更新index的状态。
  setHeightAuto(): void {
    // height更新为 `AUTO_VALUE`，确保index后续读取最新状态。
    this.style.height = AUTO_VALUE
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMinWidth 根据 v: number | string | undefined 更新index的状态。
  setMinWidth(v: number | string | undefined): void {
    // minWidth更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.minWidth = parseDimension(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMinWidthPercent 根据 v: number 更新index的状态。
  setMinWidthPercent(v: number): void {
    // minWidth更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.minWidth = percentValue(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMinHeight 根据 v: number | string | undefined 更新index的状态。
  setMinHeight(v: number | string | undefined): void {
    // minHeight更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.minHeight = parseDimension(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMinHeightPercent 根据 v: number 更新index的状态。
  setMinHeightPercent(v: number): void {
    // minHeight更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.minHeight = percentValue(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMaxWidth 根据 v: number | string | undefined 更新index的状态。
  setMaxWidth(v: number | string | undefined): void {
    // maxWidth更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.maxWidth = parseDimension(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMaxWidthPercent 根据 v: number 更新index的状态。
  setMaxWidthPercent(v: number): void {
    // maxWidth更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.maxWidth = percentValue(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMaxHeight 根据 v: number | string | undefined 更新index的状态。
  setMaxHeight(v: number | string | undefined): void {
    // maxHeight更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.maxHeight = parseDimension(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMaxHeightPercent 根据 v: number 更新index的状态。
  setMaxHeightPercent(v: number): void {
    // maxHeight更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.maxHeight = percentValue(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }

  // -- Style setters: flex

  // setFlexDirection 根据 dir: FlexDirection 更新index的状态。
  setFlexDirection(dir: FlexDirection): void {
    // flexDirection更新为 `dir`，确保index后续读取最新状态。
    this.style.flexDirection = dir
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setFlexGrow 根据 v: number | undefined 更新index的状态。
  setFlexGrow(v: number | undefined): void {
    // flexGrow更新为 `v ?? 0`，确保index后续读取最新状态。
    this.style.flexGrow = v ?? 0
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setFlexShrink 根据 v: number | undefined 更新index的状态。
  setFlexShrink(v: number | undefined): void {
    // flexShrink更新为 `v ?? 0`，确保index后续读取最新状态。
    this.style.flexShrink = v ?? 0
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setFlex 根据 v: number | undefined 更新index的状态。
  setFlex(v: number | undefined): void {
    // 组合条件 `v === undefined || isNaN(v)` 成立时，index才启用这条专门路径。
    if (v === undefined || isNaN(v)) {
      // flexGrow更新为 `0`，确保index后续读取最新状态。
      this.style.flexGrow = 0
      // flexShrink更新为 `0`，确保index后续读取最新状态。
      this.style.flexShrink = 0
    // index在这里处理 `} else if (v > 0) {`，完成这一小步状态转换。
    } else if (v > 0) {
      // flexGrow更新为 `v`，确保index后续读取最新状态。
      this.style.flexGrow = v
      // flexShrink更新为 `1`，确保index后续读取最新状态。
      this.style.flexShrink = 1
      // flexBasis 集合更新为 `pointValue(0)`，确保index后续读取最新状态。
      this.style.flexBasis = pointValue(0)
    // index在这里处理 `} else if (v < 0) {`，完成这一小步状态转换。
    } else if (v < 0) {
      // flexGrow更新为 `0`，确保index后续读取最新状态。
      this.style.flexGrow = 0
      // flexShrink更新为 `-v`，确保index后续读取最新状态。
      this.style.flexShrink = -v
    } else {
      // flexGrow更新为 `0`，确保index后续读取最新状态。
      this.style.flexGrow = 0
      // flexShrink更新为 `0`，确保index后续读取最新状态。
      this.style.flexShrink = 0
    }
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setFlexBasis 根据 v: number | 'auto' | string | undefined 更新index的状态。
  setFlexBasis(v: number | 'auto' | string | undefined): void {
    // flexBasis 集合更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.flexBasis = parseDimension(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setFlexBasisPercent 根据 v: number 更新index的状态。
  setFlexBasisPercent(v: number): void {
    // flexBasis 集合更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.flexBasis = percentValue(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setFlexBasisAuto 根据 无 更新index的状态。
  setFlexBasisAuto(): void {
    // flexBasis 集合更新为 `AUTO_VALUE`，确保index后续读取最新状态。
    this.style.flexBasis = AUTO_VALUE
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setFlexWrap 根据 wrap: Wrap 更新index的状态。
  setFlexWrap(wrap: Wrap): void {
    // flexWrap更新为 `wrap`，确保index后续读取最新状态。
    this.style.flexWrap = wrap
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }

  // -- Style setters: alignment

  // setAlignItems 根据 a: Align 更新index的状态。
  setAlignItems(a: Align): void {
    // alignItems 集合更新为 `a`，确保index后续读取最新状态。
    this.style.alignItems = a
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setAlignSelf 根据 a: Align 更新index的状态。
  setAlignSelf(a: Align): void {
    // alignSelf更新为 `a`，确保index后续读取最新状态。
    this.style.alignSelf = a
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setAlignContent 根据 a: Align 更新index的状态。
  setAlignContent(a: Align): void {
    // alignContent更新为 `a`，确保index后续读取最新状态。
    this.style.alignContent = a
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setJustifyContent 根据 j: Justify 更新index的状态。
  setJustifyContent(j: Justify): void {
    // justifyContent更新为 `j`，确保index后续读取最新状态。
    this.style.justifyContent = j
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }

  // -- Style setters: display / position / overflow

  // setDisplay 根据 d: Display 更新index的状态。
  setDisplay(d: Display): void {
    // display更新为 `d`，确保index后续读取最新状态。
    this.style.display = d
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // getDisplay不依赖额外参数，直接计算index需要的结果。
  getDisplay(): Display {
    // 返回 `this.style.display`，作为index这次计算的结果。
    return this.style.display
  }
  // setPositionType 根据 t: PositionType 更新index的状态。
  setPositionType(t: PositionType): void {
    // positionType更新为 `t`，确保index后续读取最新状态。
    this.style.positionType = t
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setPosition 根据 edge: Edge, v: number | string | undefined 更新index的状态。
  setPosition(edge: Edge, v: number | string | undefined): void {
    // position[edge更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.position[edge] = parseDimension(v)
    // 更新实例字段 _hasPosition 为 hasAnyDefinedEdge(this.style.position)，同步index的内部状态。
    this._hasPosition = hasAnyDefinedEdge(this.style.position)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setPositionPercent 根据 edge: Edge, v: number 更新index的状态。
  setPositionPercent(edge: Edge, v: number): void {
    // position[edge更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.position[edge] = percentValue(v)
    // 更新实例字段 _hasPosition 为 true，同步index的内部状态。
    this._hasPosition = true
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setPositionAuto 根据 edge: Edge 更新index的状态。
  setPositionAuto(edge: Edge): void {
    // position[edge更新为 `AUTO_VALUE`，确保index后续读取最新状态。
    this.style.position[edge] = AUTO_VALUE
    // 更新实例字段 _hasPosition 为 true，同步index的内部状态。
    this._hasPosition = true
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setOverflow 根据 o: Overflow 更新index的状态。
  setOverflow(o: Overflow): void {
    // overflow更新为 `o`，确保index后续读取最新状态。
    this.style.overflow = o
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setDirection 根据 d: Direction 更新index的状态。
  setDirection(d: Direction): void {
    // direction更新为 `d`，确保index后续读取最新状态。
    this.style.direction = d
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setBoxSizing 根据 _: BoxSizing 更新index的状态。
  setBoxSizing(_: BoxSizing): void {
    // Not implemented — Ink doesn't use content-box
  }

  // -- Style setters: spacing

  // setMargin 根据 edge: Edge, v: number | 'auto' | string | undefin… 更新index的状态。
  setMargin(edge: Edge, v: number | 'auto' | string | undefined): void {
    // val解析`parseDimension`，供index后续处理使用。
    const val = parseDimension(v)
    // margin[edge更新为 `val`，确保index后续读取最新状态。
    this.style.margin[edge] = val
    // 满足 `val.unit === Unit.Auto` 时，index执行该分支。
    if (val.unit === Unit.Auto) this._hasAutoMargin = true
    else this._hasAutoMargin = hasAnyAutoEdge(this.style.margin)
    // index在这里处理 `this._hasMargin =`，完成这一小步状态转换。
    this._hasMargin =
      this._hasAutoMargin || hasAnyDefinedEdge(this.style.margin)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMarginPercent 根据 edge: Edge, v: number 更新index的状态。
  setMarginPercent(edge: Edge, v: number): void {
    // margin[edge更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.margin[edge] = percentValue(v)
    // 更新实例字段 _hasAutoMargin 为 hasAnyAutoEdge(this.style.margin)，同步index的内部状态。
    this._hasAutoMargin = hasAnyAutoEdge(this.style.margin)
    // 更新实例字段 _hasMargin 为 true，同步index的内部状态。
    this._hasMargin = true
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setMarginAuto 根据 edge: Edge 更新index的状态。
  setMarginAuto(edge: Edge): void {
    // margin[edge更新为 `AUTO_VALUE`，确保index后续读取最新状态。
    this.style.margin[edge] = AUTO_VALUE
    // 更新实例字段 _hasAutoMargin 为 true，同步index的内部状态。
    this._hasAutoMargin = true
    // 更新实例字段 _hasMargin 为 true，同步index的内部状态。
    this._hasMargin = true
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setPadding 根据 edge: Edge, v: number | string | undefined 更新index的状态。
  setPadding(edge: Edge, v: number | string | undefined): void {
    // padding[edge更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.padding[edge] = parseDimension(v)
    // 更新实例字段 _hasPadding 为 hasAnyDefinedEdge(this.style.padding)，同步index的内部状态。
    this._hasPadding = hasAnyDefinedEdge(this.style.padding)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setPaddingPercent 根据 edge: Edge, v: number 更新index的状态。
  setPaddingPercent(edge: Edge, v: number): void {
    // padding[edge更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.padding[edge] = percentValue(v)
    // 更新实例字段 _hasPadding 为 true，同步index的内部状态。
    this._hasPadding = true
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setBorder 根据 edge: Edge, v: number | undefined 更新index的状态。
  setBorder(edge: Edge, v: number | undefined): void {
    // border[edge更新为 `v === undefined ? UNDEFINED_VALUE : pointValue(v)`，确保index后续读取最新状态。
    this.style.border[edge] = v === undefined ? UNDEFINED_VALUE : pointValue(v)
    // 更新实例字段 _hasBorder 为 hasAnyDefinedEdge(this.style.border)，同步index的内部状态。
    this._hasBorder = hasAnyDefinedEdge(this.style.border)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setGap 根据 gutter: Gutter, v: number | string | undefined 更新index的状态。
  setGap(gutter: Gutter, v: number | string | undefined): void {
    // gap[gutter更新为 `parseDimension(v)`，确保index后续读取最新状态。
    this.style.gap[gutter] = parseDimension(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // setGapPercent 根据 gutter: Gutter, v: number 更新index的状态。
  setGapPercent(gutter: Gutter, v: number): void {
    // gap[gutter更新为 `percentValue(v)`，确保index后续读取最新状态。
    this.style.gap[gutter] = percentValue(v)
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }

  // -- Style getters (partial — only what tests need)

  // getFlexDirection不依赖额外参数，直接计算index需要的结果。
  getFlexDirection(): FlexDirection {
    // 返回 `this.style.flexDirection`，作为index这次计算的结果。
    return this.style.flexDirection
  }
  // getJustifyContent不依赖额外参数，直接计算index需要的结果。
  getJustifyContent(): Justify {
    // 返回 `this.style.justifyContent`，作为index这次计算的结果。
    return this.style.justifyContent
  }
  // getAlignItems不依赖额外参数，直接计算index需要的结果。
  getAlignItems(): Align {
    // 返回 `this.style.alignItems`，作为index这次计算的结果。
    return this.style.alignItems
  }
  // getAlignSelf不依赖额外参数，直接计算index需要的结果。
  getAlignSelf(): Align {
    // 返回 `this.style.alignSelf`，作为index这次计算的结果。
    return this.style.alignSelf
  }
  // getAlignContent不依赖额外参数，直接计算index需要的结果。
  getAlignContent(): Align {
    // 返回 `this.style.alignContent`，作为index这次计算的结果。
    return this.style.alignContent
  }
  // getFlexGrow不依赖额外参数，直接计算index需要的结果。
  getFlexGrow(): number {
    // 返回 `this.style.flexGrow`，作为index这次计算的结果。
    return this.style.flexGrow
  }
  // getFlexShrink不依赖额外参数，直接计算index需要的结果。
  getFlexShrink(): number {
    // 返回 `this.style.flexShrink`，作为index这次计算的结果。
    return this.style.flexShrink
  }
  // getFlexBasis不依赖额外参数，直接计算index需要的结果。
  getFlexBasis(): Value {
    // 返回 `this.style.flexBasis`，作为index这次计算的结果。
    return this.style.flexBasis
  }
  // getFlexWrap不依赖额外参数，直接计算index需要的结果。
  getFlexWrap(): Wrap {
    // 返回 `this.style.flexWrap`，作为index这次计算的结果。
    return this.style.flexWrap
  }
  // getWidth不依赖额外参数，直接计算index需要的结果。
  getWidth(): Value {
    // 返回 `this.style.width`，作为index这次计算的结果。
    return this.style.width
  }
  // getHeight不依赖额外参数，直接计算index需要的结果。
  getHeight(): Value {
    // 返回 `this.style.height`，作为index这次计算的结果。
    return this.style.height
  }
  // getOverflow不依赖额外参数，直接计算index需要的结果。
  getOverflow(): Overflow {
    // 返回 `this.style.overflow`，作为index这次计算的结果。
    return this.style.overflow
  }
  // getPositionType不依赖额外参数，直接计算index需要的结果。
  getPositionType(): PositionType {
    // 返回 `this.style.positionType`，作为index这次计算的结果。
    return this.style.positionType
  }
  // getDirection不依赖额外参数，直接计算index需要的结果。
  getDirection(): Direction {
    // 返回 `this.style.direction`，作为index这次计算的结果。
    return this.style.direction
  }

  // -- Unused API stubs (present for API parity)

  // copyStyle 使用 _: Node 完成index里的对应操作。
  copyStyle(_: Node): void {}
  // setDirtiedFunc 根据 _: unknown 更新index的状态。
  setDirtiedFunc(_: unknown): void {}
  // unsetDirtiedFunc 使用 无 完成index里的对应操作。
  unsetDirtiedFunc(): void {}
  // setIsReferenceBaseline 根据 v: boolean 更新index的状态。
  setIsReferenceBaseline(v: boolean): void {
    // 更新实例字段 isReferenceBaseline_ 为 v，同步index的内部状态。
    this.isReferenceBaseline_ = v
    // 调用 this.markDirty，触发index此处需要的副作用。
    this.markDirty()
  }
  // isReferenceBaseline 用 无 判断index是否满足条件。
  isReferenceBaseline(): boolean {
    // 返回 `this.isReferenceBaseline_`，作为index这次计算的结果。
    return this.isReferenceBaseline_
  }
  // setAspectRatio 根据 _: number | undefined 更新index的状态。
  setAspectRatio(_: number | undefined): void {}
  // getAspectRatio不依赖额外参数，直接计算index需要的结果。
  getAspectRatio(): number {
    // 返回 `NaN`，作为index这次计算的结果。
    return NaN
  }
  // setAlwaysFormsContainingBlock 根据 _: boolean 更新index的状态。
  setAlwaysFormsContainingBlock(_: boolean): void {}

  // -- Layout entry point

  calculateLayout(
    ownerWidth: number | undefined,
    ownerHeight: number | undefined,
    _direction?: Direction,
  ): void {
    // _yogaNodesVisited更新为 `0`，确保index后续读取最新状态。
    _yogaNodesVisited = 0
    // _yogaMeasureCalls 集合更新为 `0`，确保index后续读取最新状态。
    _yogaMeasureCalls = 0
    // _yogaCacheHits 缓存更新为 `0`，确保index后续读取最新状态。
    _yogaCacheHits = 0
    // index在这里处理 `_generation++`，完成这一小步状态转换。
    _generation++
    // w标记index是否启用对应路径。
    const w = ownerWidth === undefined ? NaN : ownerWidth
    // h标记index是否启用对应路径。
    const h = ownerHeight === undefined ? NaN : ownerHeight
    // 调用 layoutNode，触发index此处需要的副作用。
    layoutNode(
      this,
      w,
      h,
      isDefined(w) ? MeasureMode.Exactly : MeasureMode.Undefined,
      isDefined(h) ? MeasureMode.Exactly : MeasureMode.Undefined,
      w,
      h,
      true,
    )
    // Root's own position = margin + position insets (yoga applies position
    // to the root even without a parent container; this matters for rounding
    // since the root's abs top/left seeds the pixel-grid walk).
    // mar保存`this.layout.margin`，供index后续判断或输出使用。
    const mar = this.layout.margin
    // posL读取`resolveValue`，供index后续处理使用。
    const posL = resolveValue(
      resolveEdgeRaw(this.style.position, EDGE_LEFT),
      isDefined(w) ? w : 0,
    )
    // posT读取`resolveValue`，供index后续处理使用。
    const posT = resolveValue(
      resolveEdgeRaw(this.style.position, EDGE_TOP),
      isDefined(w) ? w : 0,
    )
    // left更新为 `mar[EDGE_LEFT] + (isDefined(posL) ? posL : 0)`，确保index后续读取最新状态。
    this.layout.left = mar[EDGE_LEFT] + (isDefined(posL) ? posL : 0)
    // top更新为 `mar[EDGE_TOP] + (isDefined(posT) ? posT : 0)`，确保index后续读取最新状态。
    this.layout.top = mar[EDGE_TOP] + (isDefined(posT) ? posT : 0)
    // 调用 roundLayout，触发index此处需要的副作用。
    roundLayout(this, this.config.pointScaleFactor, 0, 0)
  }
}

// DEFAULT_CONFIG 配置构建`createConfig`，供index后续处理使用。
const DEFAULT_CONFIG = createConfig()

// CACHE_SLOTS 缓存 命名 `4`，让后续代码直接表达这个值的用途。
const CACHE_SLOTS = 4
// cacheWrite 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cacheWrite(
  node: Node,
  aW: number,
  aH: number,
  wM: MeasureMode,
  hM: MeasureMode,
  oW: number,
  oH: number,
  fW: boolean,
  fH: boolean,
  wasDirty: boolean,
): void {
  // node._cIn缺失时提前走兜底路径，避免index继续依赖无效输入。
  if (!node._cIn) {
    // _cIn更新为 `new Float64Array(CACHE_SLOTS * 8)`，确保index后续读取最新状态。
    node._cIn = new Float64Array(CACHE_SLOTS * 8)
    // _cOut更新为 `new Float64Array(CACHE_SLOTS * 2)`，确保index后续读取最新状态。
    node._cOut = new Float64Array(CACHE_SLOTS * 2)
  }
  // First write after a dirty clears stale entries from before the dirty.
  // _cGen < _generation means entries are from a previous calculateLayout;
  // if wasDirty, the subtree changed since then → old dimensions invalid.
  // Clean nodes' old entries stay — same subtree → same result for same
  // inputs, so cross-generation caching works (the scroll hot path where
  // 499 clean messages cache-hit while one dirty leaf recomputes).
  // `wasDirty && node._cGen` 与 `_generation` 不一致时刷新派生状态，避免使用过期结果。
  if (wasDirty && node._cGen !== _generation) {
    // _cN更新为 `0`，确保index后续读取最新状态。
    node._cN = 0
    // _cWr更新为 `0`，确保index后续读取最新状态。
    node._cWr = 0
  }
  // LRU write index wraps; _cN stays at CACHE_SLOTS so the read scan always
  // checks all populated slots (not just those since last wrap).
  // i 命名 `node._cWr++ % CACHE_SLOTS`，让后续代码直接表达这个值的用途。
  const i = node._cWr++ % CACHE_SLOTS
  // 满足 `node._cN < CACHE_SLOTS` 时，index执行该分支。
  if (node._cN < CACHE_SLOTS) node._cN = node._cWr
  // o 命名 `i * 8`，让后续代码直接表达这个值的用途。
  const o = i * 8
  // cIn保存`node._cIn`，供index后续判断或输出使用。
  const cIn = node._cIn
  // cIn[o更新为 `aW`，确保index后续读取最新状态。
  cIn[o] = aW
  // cIn[o + 1更新为 `aH`，确保index后续读取最新状态。
  cIn[o + 1] = aH
  // cIn[o + 2更新为 `wM`，确保index后续读取最新状态。
  cIn[o + 2] = wM
  // cIn[o + 3更新为 `hM`，确保index后续读取最新状态。
  cIn[o + 3] = hM
  // cIn[o + 4更新为 `oW`，确保index后续读取最新状态。
  cIn[o + 4] = oW
  // cIn[o + 5更新为 `oH`，确保index后续读取最新状态。
  cIn[o + 5] = oH
  // cIn[o + 6更新为 `fW ? 1 : 0`，确保index后续读取最新状态。
  cIn[o + 6] = fW ? 1 : 0
  // cIn[o + 7更新为 `fH ? 1 : 0`，确保index后续读取最新状态。
  cIn[o + 7] = fH ? 1 : 0
  // index在这里处理 `node._cOut![i * 2] = node.layout.width`，完成这一小步状态转换。
  node._cOut![i * 2] = node.layout.width
  // index在这里处理 `node._cOut![i * 2 + 1] = node.layout.height`，完成这一小步状态转换。
  node._cOut![i * 2 + 1] = node.layout.height
  // _cGen更新为 `_generation`，确保index后续读取最新状态。
  node._cGen = _generation
}

// Store computed layout.width/height into the single-slot cache output fields.
// _hasL/_hasM inputs are committed at the TOP of layoutNode (before compute);
// outputs must be committed HERE (after compute) so a cache hit can restore
// the correct dimensions. Without this, a _hasL hit returns whatever
// layout.width/height was left by the last call — which may be the intrinsic
// content height from a heightMode=Undefined measure pass rather than the
// constrained viewport height from the layout pass. That's the scrollbox
// vpH=33→2624 bug: scrollTop clamps to 0, viewport goes blank.
// commitCacheOutputs 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function commitCacheOutputs(node: Node, performLayout: boolean): void {
  // 满足 `performLayout` 时，index执行该分支。
  if (performLayout) {
    // _lOutW更新为 `node.layout.width`，确保index后续读取最新状态。
    node._lOutW = node.layout.width
    // _lOutH更新为 `node.layout.height`，确保index后续读取最新状态。
    node._lOutH = node.layout.height
  } else {
    // _mOutW更新为 `node.layout.width`，确保index后续读取最新状态。
    node._mOutW = node.layout.width
    // _mOutH更新为 `node.layout.height`，确保index后续读取最新状态。
    node._mOutH = node.layout.height
  }
}

// --
// Core flexbox algorithm

// Profiling counters — reset per calculateLayout, read via getYogaCounters.
// Incremented on each calculateLayout(). Nodes stamp _fbGen/_cGen when
// their cache is written; a cache entry with gen === _generation was
// computed THIS pass and is fresh regardless of isDirty_ state.
// _generation保存`0`，供index后续判断或输出使用。
let _generation = 0
// _yogaNodesVisited保存`0`，供index后续判断或输出使用。
let _yogaNodesVisited = 0
// _yogaMeasureCalls 集合保存`0`，供index后续判断或输出使用。
let _yogaMeasureCalls = 0
// _yogaCacheHits 缓存保存`0`，供index后续判断或输出使用。
let _yogaCacheHits = 0
// _yogaLiveNodes 集合保存`0`，供后续判断或组装使用。
let _yogaLiveNodes = 0
// getYogaCounters 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getYogaCounters(): {
  visited: number
  measured: number
  cacheHits: number
  live: number
} {
  // 返回结构化结果，集中表达index已经整理出的状态。
  return {
    visited: _yogaNodesVisited,
    measured: _yogaMeasureCalls,
    cacheHits: _yogaCacheHits,
    live: _yogaLiveNodes,
  }
}

// layoutNode 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function layoutNode(
  node: Node,
  availableWidth: number,
  availableHeight: number,
  widthMode: MeasureMode,
  heightMode: MeasureMode,
  ownerWidth: number,
  ownerHeight: number,
  performLayout: boolean,
  // When true, ignore style dimension on this axis — the flex container
  // has already determined the main size (flex-basis + grow/shrink result).
  forceWidth = false,
  forceHeight = false,
): void {
  // index在这里处理 `_yogaNodesVisited++`，完成这一小步状态转换。
  _yogaNodesVisited++
  // style保存`node.style`，供index后续判断或输出使用。
  const style = node.style
  // layout保存`node.layout`，供后续判断或组装使用。
  const layout = node.layout

  // Dirty-flag skip: clean subtree + matching inputs → layout object already
  // holds the answer. A cached layout result also satisfies a measure request
  // (positions are a superset of dimensions); the reverse does not hold.
  // Same-generation entries are fresh regardless of isDirty_ — they were
  // computed THIS calculateLayout, the subtree hasn't changed since.
  // Previous-generation entries need !isDirty_ (a dirty node's cache from
  // before the dirty is stale).
  // sameGen bypass only for MEASURE calls — a layout-pass cache hit would
  // skip the child-positioning recursion (STEP 5), leaving children at
  // stale positions. Measure calls only need w/h which the cache stores.
  // sameGen标记index是否启用对应路径。
  const sameGen = node._cGen === _generation && !performLayout
  // 组合条件 `!node.isDirty_ || sameGen` 成立时，index才启用这条专门路径。
  if (!node.isDirty_ || sameGen) {
    // index在这里进入条件判断，后续代码按实际状态分流。
    if (
      !node.isDirty_ &&
      node._hasL &&
      node._lWM === widthMode &&
      node._lHM === heightMode &&
      node._lFW === forceWidth &&
      node._lFH === forceHeight &&
      sameFloat(node._lW, availableWidth) &&
      sameFloat(node._lH, availableHeight) &&
      sameFloat(node._lOW, ownerWidth) &&
      sameFloat(node._lOH, ownerHeight)
    ) {
      // index在这里处理 `_yogaCacheHits++`，完成这一小步状态转换。
      _yogaCacheHits++
      // width更新为 `node._lOutW`，确保index后续读取最新状态。
      layout.width = node._lOutW
      // height更新为 `node._lOutH`，确保index后续读取最新状态。
      layout.height = node._lOutH
      // index在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Multi-entry cache: scan for matching inputs, restore cached w/h on hit.
    // Covers the scroll case where a dirty ancestor's measure→layout cascade
    // produces N>1 distinct input combos per clean child — the single _hasL
    // slot thrashed, forcing full subtree recursion. With 500-message
    // scrollbox and one dirty leaf, this took dirty-leaf relayout from
    // 76k layoutNode calls (21.7×nodes) to 4k (1.2×nodes), 6.86ms → 550µs.
    // Same-generation check covers fresh-mounted (dirty) nodes during
    // virtual scroll — the dirty chain invokes them ≥2^depth times, first
    // call writes cache, rest hit: 105k visits → ~10k for 1593-node tree.
    // 组合条件 `node._cN > 0 && (sameGen || !node.isDirty_)` 成立时，index才启用这条专门路径。
    if (node._cN > 0 && (sameGen || !node.isDirty_)) {
      // cIn保存`node._cIn!`，供后续判断或组装使用。
      const cIn = node._cIn!
      // 按索引扫描 `node._cN`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < node._cN; i++) {
        // o 命名 `i * 8`，让后续代码直接表达这个值的用途。
        const o = i * 8
        // index在这里进入条件判断，后续代码按实际状态分流。
        if (
          cIn[o + 2] === widthMode &&
          cIn[o + 3] === heightMode &&
          cIn[o + 6] === (forceWidth ? 1 : 0) &&
          cIn[o + 7] === (forceHeight ? 1 : 0) &&
          sameFloat(cIn[o]!, availableWidth) &&
          sameFloat(cIn[o + 1]!, availableHeight) &&
          sameFloat(cIn[o + 4]!, ownerWidth) &&
          sameFloat(cIn[o + 5]!, ownerHeight)
        ) {
          // width更新为 `node._cOut![i * 2]!`，确保index后续读取最新状态。
          layout.width = node._cOut![i * 2]!
          // height更新为 `node._cOut![i * 2 + 1]!`，确保index后续读取最新状态。
          layout.height = node._cOut![i * 2 + 1]!
          // index在这里处理 `_yogaCacheHits++`，完成这一小步状态转换。
          _yogaCacheHits++
          // index在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      }
    }
    // index在这里进入条件判断，后续代码按实际状态分流。
    if (
      !node.isDirty_ &&
      !performLayout &&
      node._hasM &&
      node._mWM === widthMode &&
      node._mHM === heightMode &&
      sameFloat(node._mW, availableWidth) &&
      sameFloat(node._mH, availableHeight) &&
      sameFloat(node._mOW, ownerWidth) &&
      sameFloat(node._mOH, ownerHeight)
    ) {
      // width更新为 `node._mOutW`，确保index后续读取最新状态。
      layout.width = node._mOutW
      // height更新为 `node._mOutH`，确保index后续读取最新状态。
      layout.height = node._mOutH
      // index在这里处理 `_yogaCacheHits++`，完成这一小步状态转换。
      _yogaCacheHits++
      // index在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }
  // Commit cache inputs up front so every return path leaves a valid entry.
  // Only clear isDirty_ on the LAYOUT pass — the measure pass (computeFlexBasis
  // → layoutNode(performLayout=false)) runs before the layout pass in the same
  // calculateLayout call. Clearing dirty during measure lets the subsequent
  // layout pass hit the STALE _hasL cache from the previous calculateLayout
  // (before children were inserted), so ScrollBox content height never grows
  // and sticky-scroll never follows new content. A dirty node's _hasL entry is
  // stale by definition — invalidate it so the layout pass recomputes.
  // wasDirty保存`node.isDirty_`，供后续判断或组装使用。
  const wasDirty = node.isDirty_
  // 满足 `performLayout` 时，index执行该分支。
  if (performLayout) {
    // _lW更新为 `availableWidth`，确保index后续读取最新状态。
    node._lW = availableWidth
    // _lH更新为 `availableHeight`，确保index后续读取最新状态。
    node._lH = availableHeight
    // _lWM更新为 `widthMode`，确保index后续读取最新状态。
    node._lWM = widthMode
    // _lHM更新为 `heightMode`，确保index后续读取最新状态。
    node._lHM = heightMode
    // _lOW更新为 `ownerWidth`，确保index后续读取最新状态。
    node._lOW = ownerWidth
    // _lOH更新为 `ownerHeight`，确保index后续读取最新状态。
    node._lOH = ownerHeight
    // _lFW更新为 `forceWidth`，确保index后续读取最新状态。
    node._lFW = forceWidth
    // _lFH更新为 `forceHeight`，确保index后续读取最新状态。
    node._lFH = forceHeight
    // _hasL更新为 `true`，确保index后续读取最新状态。
    node._hasL = true
    // isDirty_更新为 `false`，确保index后续读取最新状态。
    node.isDirty_ = false
    // Previous approach cleared _cN here to prevent stale pre-dirty entries
    // from hitting (long-continuous blank-screen bug). Now replaced by
    // generation stamping: the cache check requires sameGen || !isDirty_, so
    // previous-generation entries from a dirty node can't hit. Clearing here
    // would wipe fresh same-generation entries from an earlier measure call,
    // forcing recompute on the layout call.
    // 满足 `wasDirty` 时，index执行该分支。
    if (wasDirty) node._hasM = false
  } else {
    // _mW更新为 `availableWidth`，确保index后续读取最新状态。
    node._mW = availableWidth
    // _mH更新为 `availableHeight`，确保index后续读取最新状态。
    node._mH = availableHeight
    // _mWM更新为 `widthMode`，确保index后续读取最新状态。
    node._mWM = widthMode
    // _mHM更新为 `heightMode`，确保index后续读取最新状态。
    node._mHM = heightMode
    // _mOW更新为 `ownerWidth`，确保index后续读取最新状态。
    node._mOW = ownerWidth
    // _mOH更新为 `ownerHeight`，确保index后续读取最新状态。
    node._mOH = ownerHeight
    // _hasM更新为 `true`，确保index后续读取最新状态。
    node._hasM = true
    // Don't clear isDirty_. For DIRTY nodes, invalidate _hasL so the upcoming
    // performLayout=true call recomputes with the new child set (otherwise
    // sticky-scroll never follows new content — the bug from 4557bc9f9c).
    // Clean nodes keep _hasL: their layout from the previous generation is
    // still valid, they're only here because an ancestor is dirty and called
    // with different inputs than cached.
    // 满足 `wasDirty` 时，index执行该分支。
    if (wasDirty) node._hasL = false
  }

  // Resolve padding/border/margin against ownerWidth (yoga uses ownerWidth for %)
  // Write directly into the pre-allocated layout arrays — avoids 3 allocs per
  // layoutNode call and 12 resolveEdge calls (was the #1 hotspot per CPU profile).
  // Skip entirely when no edges are set — the 4-write zero is cheaper than
  // the ~20 reads + ~15 compares resolveEdges4Into does to produce zeros.
  // pad 命名 `layout.padding`，让后续代码直接表达这个值的用途。
  const pad = layout.padding
  // bor保存`layout.border`，供后续判断或组装使用。
  const bor = layout.border
  // mar保存`layout.margin`，供后续判断或组装使用。
  const mar = layout.margin
  // 满足 `node._hasPadding) resolveEdges4Into(style.padding, ownerWidth, pad` 时，index执行该分支。
  if (node._hasPadding) resolveEdges4Into(style.padding, ownerWidth, pad)
  else pad[0] = pad[1] = pad[2] = pad[3] = 0
  // 满足 `node._hasBorder) resolveEdges4Into(style.border, ownerWidth, bor` 时，index执行该分支。
  if (node._hasBorder) resolveEdges4Into(style.border, ownerWidth, bor)
  else bor[0] = bor[1] = bor[2] = bor[3] = 0
  // 满足 `node._hasMargin) resolveEdges4Into(style.margin, ownerWidth, mar` 时，index执行该分支。
  if (node._hasMargin) resolveEdges4Into(style.margin, ownerWidth, mar)
  else mar[0] = mar[1] = mar[2] = mar[3] = 0

  // paddingBorderWidth 命名 `pad[0] + pad[2] + bor[0] + bor[2]`，让后续代码直接表达这个值的用途。
  const paddingBorderWidth = pad[0] + pad[2] + bor[0] + bor[2]
  // paddingBorderHeight读取 `pad[1] + pad[3] + bor[1] + bor[3]` 对应条目，后续围绕该成员继续处理。
  const paddingBorderHeight = pad[1] + pad[3] + bor[1] + bor[3]

  // Resolve style dimensions
  // styleWidth读取`resolveValue`，供index后续处理使用。
  const styleWidth = forceWidth ? NaN : resolveValue(style.width, ownerWidth)
  // styleHeight 命名 `forceHeight`，让后续代码直接表达这个值的用途。
  const styleHeight = forceHeight
    ? NaN
    : resolveValue(style.height, ownerHeight)

  // If style dimension is defined, it overrides the available size
  // width保存`availableWidth`，供index后续判断或输出使用。
  let width = availableWidth
  // height保存`availableHeight`，供index后续判断或输出使用。
  let height = availableHeight
  // wMode保存`widthMode`，供index后续判断或输出使用。
  let wMode = widthMode
  // hMode保存`heightMode`，供后续判断或组装使用。
  let hMode = heightMode
  // 满足 `isDefined(styleWidth)` 时，index执行该分支。
  if (isDefined(styleWidth)) {
    // width更新为 `styleWidth`，确保index后续读取最新状态。
    width = styleWidth
    // wMode更新为 `MeasureMode.Exactly`，确保index后续读取最新状态。
    wMode = MeasureMode.Exactly
  }
  // 满足 `isDefined(styleHeight)` 时，index执行该分支。
  if (isDefined(styleHeight)) {
    // height更新为 `styleHeight`，确保index后续读取最新状态。
    height = styleHeight
    // hMode更新为 `MeasureMode.Exactly`，确保index后续读取最新状态。
    hMode = MeasureMode.Exactly
  }

  // Apply min/max constraints to the node's own dimensions
  // width更新为 `boundAxis(style, true, width, ownerWidth, ownerHeight)`，确保index后续读取最新状态。
  width = boundAxis(style, true, width, ownerWidth, ownerHeight)
  // height更新为 `boundAxis(style, false, height, ownerWidth, ownerHeight)`，确保index后续读取最新状态。
  height = boundAxis(style, false, height, ownerWidth, ownerHeight)

  // Measure-func leaf node
  // node.measureFunc && node.childr...为空时立即返回或跳过，避免index把空集合当成可处理内容。
  if (node.measureFunc && node.children.length === 0) {
    // innerW 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const innerW =
      wMode === MeasureMode.Undefined
        ? NaN
        : Math.max(0, width - paddingBorderWidth)
    // innerH 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const innerH =
      hMode === MeasureMode.Undefined
        ? NaN
        : Math.max(0, height - paddingBorderHeight)
    // index在这里处理 `_yogaMeasureCalls++`，完成这一小步状态转换。
    _yogaMeasureCalls++
    // measured保存`node.measureFunc`，供index后续处理使用。
    const measured = node.measureFunc(innerW, wMode, innerH, hMode)
    // index在这里处理 `node.layout.width =`，完成这一小步状态转换。
    node.layout.width =
      wMode === MeasureMode.Exactly
        ? width
        : boundAxis(
            style,
            true,
            (measured.width ?? 0) + paddingBorderWidth,
            ownerWidth,
            ownerHeight,
          )
    // index在这里处理 `node.layout.height =`，完成这一小步状态转换。
    node.layout.height =
      hMode === MeasureMode.Exactly
        ? height
        : boundAxis(
            style,
            false,
            (measured.height ?? 0) + paddingBorderHeight,
            ownerWidth,
            ownerHeight,
          )
    // 调用 commitCacheOutputs，触发index此处需要的副作用。
    commitCacheOutputs(node, performLayout)
    // Write cache even for dirty nodes — fresh-mounted items during virtual
    // scroll are dirty on first layout, but the dirty chain's measure→layout
    // cascade invokes them ≥2^depth times per calculateLayout. Writing here
    // lets the 2nd+ calls hit cache (isDirty_ was cleared in the layout pass
    // above). Measured: 105k visits → 10k for a 1593-node fresh-mount tree.
    // 调用 cacheWrite，触发index此处需要的副作用。
    cacheWrite(
      node,
      availableWidth,
      availableHeight,
      widthMode,
      heightMode,
      ownerWidth,
      ownerHeight,
      forceWidth,
      forceHeight,
      wasDirty,
    )
    // index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Leaf node with no children and no measure func
  // node.children为空时立即返回或跳过，避免index把空集合当成可处理内容。
  if (node.children.length === 0) {
    // index在这里处理 `node.layout.width =`，完成这一小步状态转换。
    node.layout.width =
      wMode === MeasureMode.Exactly
        ? width
        : boundAxis(style, true, paddingBorderWidth, ownerWidth, ownerHeight)
    // index在这里处理 `node.layout.height =`，完成这一小步状态转换。
    node.layout.height =
      hMode === MeasureMode.Exactly
        ? height
        : boundAxis(style, false, paddingBorderHeight, ownerWidth, ownerHeight)
    // 调用 commitCacheOutputs，触发index此处需要的副作用。
    commitCacheOutputs(node, performLayout)
    // Write cache even for dirty nodes — fresh-mounted items during virtual
    // scroll are dirty on first layout, but the dirty chain's measure→layout
    // cascade invokes them ≥2^depth times per calculateLayout. Writing here
    // lets the 2nd+ calls hit cache (isDirty_ was cleared in the layout pass
    // above). Measured: 105k visits → 10k for a 1593-node fresh-mount tree.
    // 调用 cacheWrite，触发index此处需要的副作用。
    cacheWrite(
      node,
      availableWidth,
      availableHeight,
      widthMode,
      heightMode,
      ownerWidth,
      ownerHeight,
      forceWidth,
      forceHeight,
      wasDirty,
    )
    // index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Container with children — run flexbox algorithm
  // mainAxis 集合保存`style.flexDirection`，供后续判断或组装使用。
  const mainAxis = style.flexDirection
  // crossAx保存`crossAxis`，供index后续处理使用。
  const crossAx = crossAxis(mainAxis)
  // isMainRow记录 `isRow` 是否成立，index随后按该结果分支。
  const isMainRow = isRow(mainAxis)

  // mainSize保存`isMainRow ? width : height`，供index后续判断或输出使用。
  const mainSize = isMainRow ? width : height
  // crossSize 命名 `isMainRow ? height : width`，让后续代码直接表达这个值的用途。
  const crossSize = isMainRow ? height : width
  // mainMode 命名 `isMainRow ? wMode : hMode`，让后续代码直接表达这个值的用途。
  const mainMode = isMainRow ? wMode : hMode
  // crossMode保存`isMainRow ? hMode : wMode`，供后续判断或组装使用。
  const crossMode = isMainRow ? hMode : wMode
  // mainPadBorder 命名 `isMainRow ? paddingBorderWidth : paddingBorderHeight`，让后续代码直接表达这个值的用途。
  const mainPadBorder = isMainRow ? paddingBorderWidth : paddingBorderHeight
  // crossPadBorder保存`isMainRow ? paddingBorderHeight : paddingBorderWidth`，供index后续判断或输出使用。
  const crossPadBorder = isMainRow ? paddingBorderHeight : paddingBorderWidth

  // innerMainSize保存`isDefined`，供index后续处理使用。
  const innerMainSize = isDefined(mainSize)
    ? Math.max(0, mainSize - mainPadBorder)
    : NaN
  // innerCrossSize保存`isDefined`，供index后续处理使用。
  const innerCrossSize = isDefined(crossSize)
    ? Math.max(0, crossSize - crossPadBorder)
    : NaN

  // Resolve gap
  // gapMain读取`resolveGap`，供index后续处理使用。
  const gapMain = resolveGap(
    style,
    isMainRow ? Gutter.Column : Gutter.Row,
    innerMainSize,
  )

  // Partition children into flow vs absolute. display:contents nodes are
  // transparent — their children are lifted into the grandparent's child list
  // (recursively), and the contents node itself gets zero layout.
  // flowChildren 从空数组开始收集，后续循环会按处理顺序追加条目。
  const flowChildren: Node[] = []
  // absChildren 从空数组开始收集，后续循环会按处理顺序追加条目。
  const absChildren: Node[] = []
  // 调用 collectLayoutChildren，触发index此处需要的副作用。
  collectLayoutChildren(node, flowChildren, absChildren)

  // ownerW/H are the reference sizes for resolving children's percentage
  // values. Per CSS, a % width resolves against the parent's content-box
  // width. If this node's width is indefinite, children's % widths are also
  // indefinite — do NOT fall through to the grandparent's size.
  // ownerW保存`isDefined`，供index后续处理使用。
  const ownerW = isDefined(width) ? width : NaN
  // ownerH保存`isDefined`，供index后续处理使用。
  const ownerH = isDefined(height) ? height : NaN
  // isWrap标记index是否启用对应路径。
  const isWrap = style.flexWrap !== Wrap.NoWrap
  // gapCross 集合读取`resolveGap`，供index后续处理使用。
  const gapCross = resolveGap(
    style,
    isMainRow ? Gutter.Row : Gutter.Column,
    innerCrossSize,
  )

  // STEP 1: Compute flex-basis for each flow child and break into lines.
  // Single-line (NoWrap) containers always get one line; multi-line containers
  // break when accumulated basis+margin+gap exceeds innerMainSize.
  // 按顺序遍历 `flowChildren` 中的c，逐个交给index处理。
  for (const c of flowChildren) {
    // _flexBasis 集合更新为 `computeFlexBasis(`，确保index后续读取最新状态。
    c._flexBasis = computeFlexBasis(
      c,
      mainAxis,
      innerMainSize,
      innerCrossSize,
      crossMode,
      ownerW,
      ownerH,
    )
  }
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: Node[][] = []
  // !isWrap || !isDefined(innerMain...为空时立即返回或跳过，避免index把空集合当成可处理内容。
  if (!isWrap || !isDefined(innerMainSize) || flowChildren.length === 0) {
    // 逐项读取 `flowChildren` 中的c，按输入顺序推进index。
    for (const c of flowChildren) c._lineIndex = 0
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(flowChildren)
  } else {
    // Line-break decisions use the min/max-clamped basis (flexbox spec §9.3.5:
    // "hypothetical main size"), not the raw flex-basis.
    // lineStart保存`0`，供index后续判断或输出使用。
    let lineStart = 0
    // lineLen保存`0`，供后续判断或组装使用。
    let lineLen = 0
    // 按索引扫描 `flowChildren.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < flowChildren.length; i++) {
      // c 命名 `flowChildren[i]!`，让后续代码直接表达这个值的用途。
      const c = flowChildren[i]!
      // hypo保存`boundAxis`，供index后续处理使用。
      const hypo = boundAxis(c.style, isMainRow, c._flexBasis, ownerW, ownerH)
      // outer保存`Math.max`，供index后续处理使用。
      const outer = Math.max(0, hypo) + childMarginForAxis(c, mainAxis, ownerW)
      // withGap保存`i > lineStart ? gapMain : 0`，供index后续判断或输出使用。
      const withGap = i > lineStart ? gapMain : 0
      // 组合条件 `i > lineStart && lineLen + withGap + outer > inne` 成立时，index才启用这条专门路径。
      if (i > lineStart && lineLen + withGap + outer > innerMainSize) {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(flowChildren.slice(lineStart, i))
        // lineStart更新为 `i`，确保index后续读取最新状态。
        lineStart = i
        // lineLen更新为 `outer`，确保index后续读取最新状态。
        lineLen = outer
      } else {
        // index在这里处理 `lineLen += withGap + outer`，完成这一小步状态转换。
        lineLen += withGap + outer
      }
      // _lineIndex 索引更新为 `lines.length`，确保index后续读取最新状态。
      c._lineIndex = lines.length
    }
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(flowChildren.slice(lineStart))
  }
  // lineCount 数量记录 `lines.length` 是否成立，下一步按该结果分支。
  const lineCount = lines.length
  // isBaseline记录 `isBaselineLayout` 是否成立，index随后按该结果分支。
  const isBaseline = isBaselineLayout(node, flowChildren)

  // STEP 2+3: For each line, resolve flexible lengths and lay out children to
  // measure cross sizes. Track per-line consumed main and max cross.
  // lineConsumedMain 命名 `new Array(lineCount)`，让后续代码直接表达这个值的用途。
  const lineConsumedMain: number[] = new Array(lineCount)
  // lineCrossSizes 集合 命名 `new Array(lineCount)`，让后续代码直接表达这个值的用途。
  const lineCrossSizes: number[] = new Array(lineCount)
  // Baseline layout tracks max ascent (baseline + leading margin) per line so
  // baseline-aligned items can be positioned at maxAscent - childBaseline.
  // lineMaxAscent构建`isBaseline ? new Array(lineCount).fill(0) : []` 整理出中间结果，供index后续步骤使用。
  const lineMaxAscent: number[] = isBaseline ? new Array(lineCount).fill(0) : []
  // maxLineMain保存`0`，供index后续判断或输出使用。
  let maxLineMain = 0
  // totalLinesCross 集合保存`0`，供index后续判断或输出使用。
  let totalLinesCross = 0
  // 按索引扫描 `lineCount`，需要消费相邻参数时可以精确移动游标。
  for (let li = 0; li < lineCount; li++) {
    // line保存`lines[li]!`，供index后续判断或输出使用。
    const line = lines[li]!
    // lineGap记录 `line.length > 1 ? gapMain * (line.length - 1) : 0` 是否成立，下一步按该结果分支。
    const lineGap = line.length > 1 ? gapMain * (line.length - 1) : 0
    // lineBasis 集合保存`lineGap`，供后续判断或组装使用。
    let lineBasis = lineGap
    // 按顺序遍历 `line` 中的c，逐个交给index处理。
    for (const c of line) {
      // index在这里处理 `lineBasis += c._flexBasis + childMarginForAxis(c, mainAxis, ownerW)`，完成这一小步状态转换。
      lineBasis += c._flexBasis + childMarginForAxis(c, mainAxis, ownerW)
    }
    // Resolve flexible lengths against available inner main. For indefinite
    // containers with min/max, flex against the clamped size.
    // availMain保存`innerMainSize`，供index后续判断或输出使用。
    let availMain = innerMainSize
    // 满足 `!isDefined(availMain)` 时，index执行该分支。
    if (!isDefined(availMain)) {
      // mainOwner 命名 `isMainRow ? ownerWidth : ownerHeight`，让后续代码直接表达这个值的用途。
      const mainOwner = isMainRow ? ownerWidth : ownerHeight
      // minM读取`resolveValue`，供index后续处理使用。
      const minM = resolveValue(
        isMainRow ? style.minWidth : style.minHeight,
        mainOwner,
      )
      // maxM读取`resolveValue`，供index后续处理使用。
      const maxM = resolveValue(
        isMainRow ? style.maxWidth : style.maxHeight,
        mainOwner,
      )
      // 组合条件 `isDefined(maxM) && lineBasis > maxM - mainPadBorder` 成立时，index才启用这条专门路径。
      if (isDefined(maxM) && lineBasis > maxM - mainPadBorder) {
        // availMain更新为 `Math.max(0, maxM - mainPadBorder)`，确保index后续读取最新状态。
        availMain = Math.max(0, maxM - mainPadBorder)
      // index在这里处理 `} else if (isDefined(minM) && lineBasis < minM - mainPadBorder) {`，完成这一小步状态转换。
      } else if (isDefined(minM) && lineBasis < minM - mainPadBorder) {
        // availMain更新为 `Math.max(0, minM - mainPadBorder)`，确保index后续读取最新状态。
        availMain = Math.max(0, minM - mainPadBorder)
      }
    }
    // resolveFlexibleLengths 结算当前 Promise，唤醒等待这个异步结果的调用方。
    resolveFlexibleLengths(
      line,
      availMain,
      lineBasis,
      isMainRow,
      ownerW,
      ownerH,
    )

    // Lay out each child in this line to measure cross
    // lineCross 集合保存`0`，供index后续判断或输出使用。
    let lineCross = 0
    // 按顺序遍历 `line` 中的c，逐个交给index处理。
    for (const c of line) {
      // cStyle保存`c.style`，供index后续判断或输出使用。
      const cStyle = c.style
      // childAlign 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const childAlign =
        cStyle.alignSelf === Align.Auto ? style.alignItems : cStyle.alignSelf
      // cMarginCross 集合保存`childMarginForAxis`，供index后续处理使用。
      const cMarginCross = childMarginForAxis(c, crossAx, ownerW)
      // childCrossSize保存`NaN`，供后续判断或组装使用。
      let childCrossSize = NaN
      // childCrossMode 命名 `MeasureMode.Undefined`，让后续代码直接表达这个值的用途。
      let childCrossMode: MeasureMode = MeasureMode.Undefined
      // resolvedCrossStyle读取`resolveValue`，供index后续处理使用。
      const resolvedCrossStyle = resolveValue(
        isMainRow ? cStyle.height : cStyle.width,
        isMainRow ? ownerH : ownerW,
      )
      // crossLeadE保存`isMainRow ? EDGE_TOP : EDGE_LEFT`，供后续判断或组装使用。
      const crossLeadE = isMainRow ? EDGE_TOP : EDGE_LEFT
      // crossTrailE保存`isMainRow ? EDGE_BOTTOM : EDGE_RIGHT`，供后续判断或组装使用。
      const crossTrailE = isMainRow ? EDGE_BOTTOM : EDGE_RIGHT
      // hasCrossAutoMargin 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const hasCrossAutoMargin =
        c._hasAutoMargin &&
        (isMarginAuto(cStyle.margin, crossLeadE) ||
          isMarginAuto(cStyle.margin, crossTrailE))
      // Single-line stretch goes directly to the container cross size.
      // Multi-line wrap measures intrinsic cross (Undefined mode) so
      // flex-grow grandchildren don't expand to the container — the line
      // cross size is determined first, then items are re-stretched.
      // 满足 `isDefined(resolvedCrossStyle)` 时，index执行该分支。
      if (isDefined(resolvedCrossStyle)) {
        // childCrossSize更新为 `resolvedCrossStyle`，确保index后续读取最新状态。
        childCrossSize = resolvedCrossStyle
        // childCrossMode更新为 `MeasureMode.Exactly`，确保index后续读取最新状态。
        childCrossMode = MeasureMode.Exactly
      // index在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        childAlign === Align.Stretch &&
        !hasCrossAutoMargin &&
        !isWrap &&
        isDefined(innerCrossSize) &&
        crossMode === MeasureMode.Exactly
      ) {
        // childCrossSize更新为 `Math.max(0, innerCrossSize - cMarginCross)`，确保index后续读取最新状态。
        childCrossSize = Math.max(0, innerCrossSize - cMarginCross)
        // childCrossMode更新为 `MeasureMode.Exactly`，确保index后续读取最新状态。
        childCrossMode = MeasureMode.Exactly
      // index在这里处理 `} else if (!isWrap && isDefined(innerCrossSize)) {`，完成这一小步状态转换。
      } else if (!isWrap && isDefined(innerCrossSize)) {
        // childCrossSize更新为 `Math.max(0, innerCrossSize - cMarginCross)`，确保index后续读取最新状态。
        childCrossSize = Math.max(0, innerCrossSize - cMarginCross)
        // childCrossMode更新为 `MeasureMode.AtMost`，确保index后续读取最新状态。
        childCrossMode = MeasureMode.AtMost
      }
      // cw 命名 `isMainRow ? c._mainSize : childCrossSize`，让后续代码直接表达这个值的用途。
      const cw = isMainRow ? c._mainSize : childCrossSize
      // ch保存`isMainRow ? childCrossSize : c._mainSize`，供index后续判断或输出使用。
      const ch = isMainRow ? childCrossSize : c._mainSize
      // 调用 layoutNode，触发index此处需要的副作用。
      layoutNode(
        c,
        cw,
        ch,
        isMainRow ? MeasureMode.Exactly : childCrossMode,
        isMainRow ? childCrossMode : MeasureMode.Exactly,
        ownerW,
        ownerH,
        performLayout,
        isMainRow,
        !isMainRow,
      )
      // _crossSize更新为 `isMainRow ? c.layout.height : c.layout.width`，确保index后续读取最新状态。
      c._crossSize = isMainRow ? c.layout.height : c.layout.width
      // lineCross 集合更新为 `Math.max(lineCross, c._crossSize + cMarginCross)`，确保index后续读取最新状态。
      lineCross = Math.max(lineCross, c._crossSize + cMarginCross)
    }
    // Baseline layout: line cross size must fit maxAscent + maxDescent of
    // baseline-aligned children (yoga STEP 8). Only applies to row direction.
    // 满足 `isBaseline` 时，index执行该分支。
    if (isBaseline) {
      // maxAscent保存`0`，供后续判断或组装使用。
      let maxAscent = 0
      // maxDescent 命名 `0`，让后续代码直接表达这个值的用途。
      let maxDescent = 0
      // 按顺序遍历 `line` 中的c，逐个交给index处理。
      for (const c of line) {
        // `resolveChildAlign(node, c)` 与 `Align.Baseline` 不一致时刷新派生状态，避免使用过期结果。
        if (resolveChildAlign(node, c) !== Align.Baseline) continue
        // mTop读取`resolveEdge`，供index后续处理使用。
        const mTop = resolveEdge(c.style.margin, EDGE_TOP, ownerW)
        // mBot读取`resolveEdge`，供index后续处理使用。
        const mBot = resolveEdge(c.style.margin, EDGE_BOTTOM, ownerW)
        // ascent保存`calculateBaseline`，供index后续处理使用。
        const ascent = calculateBaseline(c) + mTop
        // descent 命名 `c.layout.height + mTop + mBot - ascent`，让后续代码直接表达这个值的用途。
        const descent = c.layout.height + mTop + mBot - ascent
        // 满足 `ascent > maxAscent` 时，index执行该分支。
        if (ascent > maxAscent) maxAscent = ascent
        // 满足 `descent > maxDescent` 时，index执行该分支。
        if (descent > maxDescent) maxDescent = descent
      }
      // lineMaxAscent[li更新为 `maxAscent`，确保index后续读取最新状态。
      lineMaxAscent[li] = maxAscent
      // 满足 `maxAscent + maxDescent > lineCross` 时，index执行该分支。
      if (maxAscent + maxDescent > lineCross) {
        // lineCross 集合更新为 `maxAscent + maxDescent`，确保index后续读取最新状态。
        lineCross = maxAscent + maxDescent
      }
    }
    // layoutNode(c) at line ~1117 above already resolved c.layout.margin[] via
    // resolveEdges4Into with the same ownerW — read directly instead of
    // re-resolving through childMarginForAxis → 2× resolveEdge.
    // mainLead保存`leadingEdge`，供index后续处理使用。
    const mainLead = leadingEdge(mainAxis)
    // mainTrail保存`trailingEdge`，供index后续处理使用。
    const mainTrail = trailingEdge(mainAxis)
    // consumed 命名 `lineGap`，让后续代码直接表达这个值的用途。
    let consumed = lineGap
    // 按顺序遍历 `line` 中的c，逐个交给index处理。
    for (const c of line) {
      // cm保存`c.layout.margin`，供index后续判断或输出使用。
      const cm = c.layout.margin
      // index在这里处理 `consumed += c._mainSize + cm[mainLead]! + cm[mainTrail]!`，完成这一小步状态转换。
      consumed += c._mainSize + cm[mainLead]! + cm[mainTrail]!
    }
    // lineConsumedMain[li更新为 `consumed`，确保index后续读取最新状态。
    lineConsumedMain[li] = consumed
    // lineCrossSizes[li更新为 `lineCross`，确保index后续读取最新状态。
    lineCrossSizes[li] = lineCross
    // maxLineMain更新为 `Math.max(maxLineMain, consumed)`，确保index后续读取最新状态。
    maxLineMain = Math.max(maxLineMain, consumed)
    // index在这里处理 `totalLinesCross += lineCross`，完成这一小步状态转换。
    totalLinesCross += lineCross
  }
  // totalCrossGap 命名 `lineCount > 1 ? gapCross * (lineCount - 1) : 0`，让后续代码直接表达这个值的用途。
  const totalCrossGap = lineCount > 1 ? gapCross * (lineCount - 1) : 0
  // index在这里处理 `totalLinesCross += totalCrossGap`，完成这一小步状态转换。
  totalLinesCross += totalCrossGap

  // STEP 4: Determine container dimensions. Per yoga's STEP 9, for both
  // AtMost (FitContent) and Undefined (MaxContent) the node sizes to its
  // content — AtMost is NOT a hard clamp, items may overflow the available
  // space (CSS "fit-content" behavior). Only Scroll overflow clamps to the
  // available size. Wrap containers that broke into multiple lines under
  // AtMost fill the available main size since they wrapped at that boundary.
  // isScroll标记index是否启用对应路径。
  const isScroll = style.overflow === Overflow.Scroll
  // contentMain保存`maxLineMain + mainPadBorder`，供index后续判断或输出使用。
  const contentMain = maxLineMain + mainPadBorder
  // finalMainSize 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const finalMainSize =
    mainMode === MeasureMode.Exactly
      ? mainSize
      : mainMode === MeasureMode.AtMost && isScroll
        ? Math.max(Math.min(mainSize, contentMain), mainPadBorder)
        : isWrap && lineCount > 1 && mainMode === MeasureMode.AtMost
          ? mainSize
          : contentMain
  // contentCross 集合保存`totalLinesCross + crossPadBorder`，供index后续判断或输出使用。
  const contentCross = totalLinesCross + crossPadBorder
  // finalCrossSize 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const finalCrossSize =
    crossMode === MeasureMode.Exactly
      ? crossSize
      : crossMode === MeasureMode.AtMost && isScroll
        ? Math.max(Math.min(crossSize, contentCross), crossPadBorder)
        : contentCross
  // width更新为 `boundAxis(`，确保index后续读取最新状态。
  node.layout.width = boundAxis(
    style,
    true,
    isMainRow ? finalMainSize : finalCrossSize,
    ownerWidth,
    ownerHeight,
  )
  // height更新为 `boundAxis(`，确保index后续读取最新状态。
  node.layout.height = boundAxis(
    style,
    false,
    isMainRow ? finalCrossSize : finalMainSize,
    ownerWidth,
    ownerHeight,
  )
  // 调用 commitCacheOutputs，触发index此处需要的副作用。
  commitCacheOutputs(node, performLayout)
  // Write cache even for dirty nodes — fresh-mounted items during virtual scroll
  // 调用 cacheWrite，触发index此处需要的副作用。
  cacheWrite(
    node,
    availableWidth,
    availableHeight,
    widthMode,
    heightMode,
    ownerWidth,
    ownerHeight,
    forceWidth,
    forceHeight,
    wasDirty,
  )

  // performLayout缺失时提前走兜底路径，避免index继续依赖无效输入。
  if (!performLayout) return

  // STEP 5: Position lines (align-content) and children (justify-content +
  // align-items + auto margins).
  // actualInnerMain 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const actualInnerMain =
    (isMainRow ? node.layout.width : node.layout.height) - mainPadBorder
  // actualInnerCross 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const actualInnerCross =
    (isMainRow ? node.layout.height : node.layout.width) - crossPadBorder
  // mainLeadEdgePhys 集合保存`leadingEdge`，供index后续处理使用。
  const mainLeadEdgePhys = leadingEdge(mainAxis)
  // mainTrailEdgePhys 集合保存`trailingEdge`，供index后续处理使用。
  const mainTrailEdgePhys = trailingEdge(mainAxis)
  // crossLeadEdgePhys 集合 命名 `isMainRow ? EDGE_TOP : EDGE_LEFT`，让后续代码直接表达这个值的用途。
  const crossLeadEdgePhys = isMainRow ? EDGE_TOP : EDGE_LEFT
  // crossTrailEdgePhys 集合保存`isMainRow ? EDGE_BOTTOM : EDGE_RIGHT`，供index后续判断或输出使用。
  const crossTrailEdgePhys = isMainRow ? EDGE_BOTTOM : EDGE_RIGHT
  // reversed保存`isReverse`，供index后续处理使用。
  const reversed = isReverse(mainAxis)
  // mainContainerSize保存`isMainRow ? node.layout.width : node.layout.height`，供index后续判断或输出使用。
  const mainContainerSize = isMainRow ? node.layout.width : node.layout.height
  // crossLead保存`pad[crossLeadEdgePhys]! + bor[crossLeadEdgePhys]!`，供index后续判断或输出使用。
  const crossLead = pad[crossLeadEdgePhys]! + bor[crossLeadEdgePhys]!

  // Align-content: distribute free cross space among lines. Single-line
  // containers use the full cross size for the one line (align-items handles
  // positioning within it).
  // lineCrossOffset保存`crossLead`，供后续判断或组装使用。
  let lineCrossOffset = crossLead
  // betweenLines 集合 命名 `gapCross`，让后续代码直接表达这个值的用途。
  let betweenLines = gapCross
  // freeCross 集合保存`actualInnerCross - totalLinesCross`，供index后续判断或输出使用。
  const freeCross = actualInnerCross - totalLinesCross
  // 组合条件 `lineCount === 1 && !isWrap && !isBaseline` 成立时，index才启用这条专门路径。
  if (lineCount === 1 && !isWrap && !isBaseline) {
    // lineCrossSizes[0更新为 `actualInnerCross`，确保index后续读取最新状态。
    lineCrossSizes[0] = actualInnerCross
  } else {
    // remCross 集合保存`Math.max`，供index后续处理使用。
    const remCross = Math.max(0, freeCross)
    // 按照 style.alignContent 的取值选择index的具体处理分支。
    switch (style.alignContent) {
      case Align.FlexStart:
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
      case Align.Center:
        // index在这里处理 `lineCrossOffset += freeCross / 2`，完成这一小步状态转换。
        lineCrossOffset += freeCross / 2
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
      case Align.FlexEnd:
        // index在这里处理 `lineCrossOffset += freeCross`，完成这一小步状态转换。
        lineCrossOffset += freeCross
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
      case Align.Stretch:
        // 组合条件 `lineCount > 0 && remCross > 0` 成立时，index才启用这条专门路径。
        if (lineCount > 0 && remCross > 0) {
          // add 命名 `remCross / lineCount`，让后续代码直接表达这个值的用途。
          const add = remCross / lineCount
          // 按索引扫描 `lineCount`，需要消费相邻参数时可以精确移动游标。
          for (let i = 0; i < lineCount; i++) lineCrossSizes[i]! += add
        }
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
      case Align.SpaceBetween:
        // 满足 `lineCount > 1) betweenLines += remCross / (lineCount - 1` 时，index执行该分支。
        if (lineCount > 1) betweenLines += remCross / (lineCount - 1)
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
      case Align.SpaceAround:
        // 满足 `lineCount > 0` 时，index执行该分支。
        if (lineCount > 0) {
          // index在这里处理 `betweenLines += remCross / lineCount`，完成这一小步状态转换。
          betweenLines += remCross / lineCount
          // index在这里处理 `lineCrossOffset += remCross / lineCount / 2`，完成这一小步状态转换。
          lineCrossOffset += remCross / lineCount / 2
        }
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
      case Align.SpaceEvenly:
        // 满足 `lineCount > 0` 时，index执行该分支。
        if (lineCount > 0) {
          // index在这里处理 `betweenLines += remCross / (lineCount + 1)`，完成这一小步状态转换。
          betweenLines += remCross / (lineCount + 1)
          // index在这里处理 `lineCrossOffset += remCross / (lineCount + 1)`，完成这一小步状态转换。
          lineCrossOffset += remCross / (lineCount + 1)
        }
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
      default:
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
    }
  }

  // For wrap-reverse, lines stack from the trailing cross edge. Walk lines in
  // order but flip the cross position within the container.
  // wrapReverse标记index是否启用对应路径。
  const wrapReverse = style.flexWrap === Wrap.WrapReverse
  // crossContainerSize保存`isMainRow ? node.layout.height : node.layout.width`，供后续判断或组装使用。
  const crossContainerSize = isMainRow ? node.layout.height : node.layout.width
  // lineCrossPos 集合保存`lineCrossOffset`，供后续判断或组装使用。
  let lineCrossPos = lineCrossOffset
  // 按索引扫描 `lineCount`，需要消费相邻参数时可以精确移动游标。
  for (let li = 0; li < lineCount; li++) {
    // line保存`lines[li]!`，供index后续判断或输出使用。
    const line = lines[li]!
    // lineCross 集合读取 `lineCrossSizes[li]!` 对应条目，后续围绕该成员继续处理。
    const lineCross = lineCrossSizes[li]!
    // consumedMain保存`lineConsumedMain[li]!`，供index后续判断或输出使用。
    const consumedMain = lineConsumedMain[li]!
    // n 命名 `line.length`，让后续代码直接表达这个值的用途。
    const n = line.length

    // Re-stretch children whose cross is auto and align is stretch, now that
    // the line cross size is known. Needed for multi-line wrap (line cross
    // wasn't known during initial measure) AND single-line when the container
    // cross was not Exactly (initial stretch at ~line 1250 was skipped because
    // innerCrossSize wasn't defined — the container sized to max child cross).
    // `isWrap || crossMode` 与 `MeasureMode.Exactly` 不一致时刷新派生状态，避免使用过期结果。
    if (isWrap || crossMode !== MeasureMode.Exactly) {
      // 按顺序遍历 `line` 中的c，逐个交给index处理。
      for (const c of line) {
        // cStyle保存`c.style`，供index后续判断或输出使用。
        const cStyle = c.style
        // childAlign 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const childAlign =
          cStyle.alignSelf === Align.Auto ? style.alignItems : cStyle.alignSelf
        // crossStyleDef保存`isDefined`，供index后续处理使用。
        const crossStyleDef = isDefined(
          resolveValue(
            isMainRow ? cStyle.height : cStyle.width,
            isMainRow ? ownerH : ownerW,
          ),
        )
        // hasCrossAutoMargin 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const hasCrossAutoMargin =
          c._hasAutoMargin &&
          (isMarginAuto(cStyle.margin, crossLeadEdgePhys) ||
            isMarginAuto(cStyle.margin, crossTrailEdgePhys))
        // index在这里进入条件判断，后续代码按实际状态分流。
        if (
          childAlign === Align.Stretch &&
          !crossStyleDef &&
          !hasCrossAutoMargin
        ) {
          // cMarginCross 集合保存`childMarginForAxis`，供index后续处理使用。
          const cMarginCross = childMarginForAxis(c, crossAx, ownerW)
          // target保存`Math.max`，供index后续处理使用。
          const target = Math.max(0, lineCross - cMarginCross)
          // `c._crossSize` 与 `target` 不一致时刷新派生状态，避免使用过期结果。
          if (c._crossSize !== target) {
            // cw 命名 `isMainRow ? c._mainSize : target`，让后续代码直接表达这个值的用途。
            const cw = isMainRow ? c._mainSize : target
            // ch读取`isMainRow ? target : c._mainSize` 整理出中间结果，供index后续步骤使用。
            const ch = isMainRow ? target : c._mainSize
            // 调用 layoutNode，触发index此处需要的副作用。
            layoutNode(
              c,
              cw,
              ch,
              MeasureMode.Exactly,
              MeasureMode.Exactly,
              ownerW,
              ownerH,
              performLayout,
              isMainRow,
              !isMainRow,
            )
            // _crossSize更新为 `target`，确保index后续读取最新状态。
            c._crossSize = target
          }
        }
      }
    }

    // Justify-content + auto margins for this line
    // mainOffset 命名 `pad[mainLeadEdgePhys]! + bor[mainLeadEdgePhys]!`，让后续代码直接表达这个值的用途。
    let mainOffset = pad[mainLeadEdgePhys]! + bor[mainLeadEdgePhys]!
    // betweenMain保存`gapMain`，供index后续判断或输出使用。
    let betweenMain = gapMain
    // numAutoMarginsMain保存`0`，供后续判断或组装使用。
    let numAutoMarginsMain = 0
    // 按顺序遍历 `line` 中的c，逐个交给index处理。
    for (const c of line) {
      // c._hasAutoMargin缺失时提前走兜底路径，避免index继续依赖无效输入。
      if (!c._hasAutoMargin) continue
      // 满足 `isMarginAuto(c.style.margin, mainLeadEdgePhys)` 时，index执行该分支。
      if (isMarginAuto(c.style.margin, mainLeadEdgePhys)) numAutoMarginsMain++
      // 满足 `isMarginAuto(c.style.margin, mainTrailEdgePhys)` 时，index执行该分支。
      if (isMarginAuto(c.style.margin, mainTrailEdgePhys)) numAutoMarginsMain++
    }
    // freeMain保存`actualInnerMain - consumedMain`，供index后续判断或输出使用。
    const freeMain = actualInnerMain - consumedMain
    // remainingMain保存`Math.max`，供index后续处理使用。
    const remainingMain = Math.max(0, freeMain)
    // autoMarginMainSize 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const autoMarginMainSize =
      numAutoMarginsMain > 0 && remainingMain > 0
        ? remainingMain / numAutoMarginsMain
        : 0
    // 满足 `numAutoMarginsMain === 0` 时，index执行该分支。
    if (numAutoMarginsMain === 0) {
      // 按照 style.justifyContent 的取值选择index的具体处理分支。
      switch (style.justifyContent) {
        case Justify.FlexStart:
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
        case Justify.Center:
          // index在这里处理 `mainOffset += freeMain / 2`，完成这一小步状态转换。
          mainOffset += freeMain / 2
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
        case Justify.FlexEnd:
          // index在这里处理 `mainOffset += freeMain`，完成这一小步状态转换。
          mainOffset += freeMain
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
        case Justify.SpaceBetween:
          // 满足 `n > 1) betweenMain += remainingMain / (n - 1` 时，index执行该分支。
          if (n > 1) betweenMain += remainingMain / (n - 1)
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
        case Justify.SpaceAround:
          // 满足 `n > 0` 时，index执行该分支。
          if (n > 0) {
            // index在这里处理 `betweenMain += remainingMain / n`，完成这一小步状态转换。
            betweenMain += remainingMain / n
            // index在这里处理 `mainOffset += remainingMain / n / 2`，完成这一小步状态转换。
            mainOffset += remainingMain / n / 2
          }
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
        case Justify.SpaceEvenly:
          // 满足 `n > 0` 时，index执行该分支。
          if (n > 0) {
            // index在这里处理 `betweenMain += remainingMain / (n + 1)`，完成这一小步状态转换。
            betweenMain += remainingMain / (n + 1)
            // index在这里处理 `mainOffset += remainingMain / (n + 1)`，完成这一小步状态转换。
            mainOffset += remainingMain / (n + 1)
          }
          // 结束这个分支或循环，避免index继续落入后续路径。
          break
      }
    }

    // effectiveLineCrossPos 集合保存`wrapReverse`，供后续判断或组装使用。
    const effectiveLineCrossPos = wrapReverse
      ? crossContainerSize - lineCrossPos - lineCross
      : lineCrossPos

    // pos 集合保存`mainOffset`，供后续判断或组装使用。
    let pos = mainOffset
    // 按顺序遍历 `line` 中的c，逐个交给index处理。
    for (const c of line) {
      // cMargin保存`c.style.margin`，供后续判断或组装使用。
      const cMargin = c.style.margin
      // c.layout.margin[] was populated by resolveEdges4Into inside the
      // layoutNode(c) call above (same ownerW). Read resolved values directly
      // instead of re-running the edge fallback chain 4× via resolveEdge.
      // Auto margins resolve to 0 in layout.margin, so autoMarginMainSize
      // substitution still uses the isMarginAuto check against style.
      // cLayoutMargin保存`c.layout.margin`，供后续判断或组装使用。
      const cLayoutMargin = c.layout.margin
      // autoMainLead标记index是否启用对应路径。
      let autoMainLead = false
      // autoMainTrail标记index是否启用对应路径。
      let autoMainTrail = false
      // autoCrossLead标记index是否启用对应路径。
      let autoCrossLead = false
      // autoCrossTrail标记index是否启用对应路径。
      let autoCrossTrail = false
      // mMainLead 先占位，稍后的条件分支会根据实际输入补齐它。
      let mMainLead: number
      // mMainTrail 先占位，稍后的条件分支会根据实际输入补齐它。
      let mMainTrail: number
      // mCrossLead 先占位，稍后的条件分支会根据实际输入补齐它。
      let mCrossLead: number
      // mCrossTrail 先占位，稍后的条件分支会根据实际输入补齐它。
      let mCrossTrail: number
      // 满足 `c._hasAutoMargin` 时，index执行该分支。
      if (c._hasAutoMargin) {
        // autoMainLead更新为 `isMarginAuto(cMargin, mainLeadEdgePhys)`，确保index后续读取最新状态。
        autoMainLead = isMarginAuto(cMargin, mainLeadEdgePhys)
        // autoMainTrail更新为 `isMarginAuto(cMargin, mainTrailEdgePhys)`，确保index后续读取最新状态。
        autoMainTrail = isMarginAuto(cMargin, mainTrailEdgePhys)
        // autoCrossLead更新为 `isMarginAuto(cMargin, crossLeadEdgePhys)`，确保index后续读取最新状态。
        autoCrossLead = isMarginAuto(cMargin, crossLeadEdgePhys)
        // autoCrossTrail更新为 `isMarginAuto(cMargin, crossTrailEdgePhys)`，确保index后续读取最新状态。
        autoCrossTrail = isMarginAuto(cMargin, crossTrailEdgePhys)
        // mMainLead更新为 `autoMainLead`，确保index后续读取最新状态。
        mMainLead = autoMainLead
          ? autoMarginMainSize
          : cLayoutMargin[mainLeadEdgePhys]!
        // mMainTrail更新为 `autoMainTrail`，确保index后续读取最新状态。
        mMainTrail = autoMainTrail
          ? autoMarginMainSize
          : cLayoutMargin[mainTrailEdgePhys]!
        // mCrossLead更新为 `autoCrossLead ? 0 : cLayoutMargin[crossLeadEdgePhys]!`，确保index后续读取最新状态。
        mCrossLead = autoCrossLead ? 0 : cLayoutMargin[crossLeadEdgePhys]!
        // mCrossTrail更新为 `autoCrossTrail ? 0 : cLayoutMargin[crossTrailEdgePhys]!`，确保index后续读取最新状态。
        mCrossTrail = autoCrossTrail ? 0 : cLayoutMargin[crossTrailEdgePhys]!
      } else {
        // Fast path: no auto margins — read resolved values directly.
        // mMainLead更新为 `cLayoutMargin[mainLeadEdgePhys]!`，确保index后续读取最新状态。
        mMainLead = cLayoutMargin[mainLeadEdgePhys]!
        // mMainTrail更新为 `cLayoutMargin[mainTrailEdgePhys]!`，确保index后续读取最新状态。
        mMainTrail = cLayoutMargin[mainTrailEdgePhys]!
        // mCrossLead更新为 `cLayoutMargin[crossLeadEdgePhys]!`，确保index后续读取最新状态。
        mCrossLead = cLayoutMargin[crossLeadEdgePhys]!
        // mCrossTrail更新为 `cLayoutMargin[crossTrailEdgePhys]!`，确保index后续读取最新状态。
        mCrossTrail = cLayoutMargin[crossTrailEdgePhys]!
      }

      // mainPos 集合保存`reversed`，供index后续判断或输出使用。
      const mainPos = reversed
        ? mainContainerSize - (pos + mMainLead) - c._mainSize
        : pos + mMainLead

      // childAlign 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const childAlign =
        c.style.alignSelf === Align.Auto ? style.alignItems : c.style.alignSelf
      // crossPos 集合保存`effectiveLineCrossPos + mCrossLead`，供后续判断或组装使用。
      let crossPos = effectiveLineCrossPos + mCrossLead
      // crossFree 命名 `lineCross - c._crossSize - mCrossLead - mCrossTrail`，让后续代码直接表达这个值的用途。
      const crossFree = lineCross - c._crossSize - mCrossLead - mCrossTrail
      // 组合条件 `autoCrossLead && autoCrossTrail` 成立时，index才启用这条专门路径。
      if (autoCrossLead && autoCrossTrail) {
        // index在这里处理 `crossPos += Math.max(0, crossFree) / 2`，完成这一小步状态转换。
        crossPos += Math.max(0, crossFree) / 2
      // index在这里处理 `} else if (autoCrossLead) {`，完成这一小步状态转换。
      } else if (autoCrossLead) {
        // index在这里处理 `crossPos += Math.max(0, crossFree)`，完成这一小步状态转换。
        crossPos += Math.max(0, crossFree)
      // index在这里处理 `} else if (autoCrossTrail) {`，完成这一小步状态转换。
      } else if (autoCrossTrail) {
        // stays at leading
      } else {
        // 按照 childAlign 的取值选择index的具体处理分支。
        switch (childAlign) {
          case Align.FlexStart:
          case Align.Stretch:
            // 满足 `wrapReverse` 时，index执行该分支。
            if (wrapReverse) crossPos += crossFree
            // 结束这个分支或循环，避免index继续落入后续路径。
            break
          case Align.Center:
            // index在这里处理 `crossPos += crossFree / 2`，完成这一小步状态转换。
            crossPos += crossFree / 2
            // 结束这个分支或循环，避免index继续落入后续路径。
            break
          case Align.FlexEnd:
            // wrapReverse缺失时提前走兜底路径，避免index继续依赖无效输入。
            if (!wrapReverse) crossPos += crossFree
            // 结束这个分支或循环，避免index继续落入后续路径。
            break
          case Align.Baseline:
            // Row direction only (isBaselineLayout checked this). Position so
            // the child's baseline aligns with the line's max ascent. Per
            // yoga: top = currentLead + maxAscent - childBaseline + leadingPosition.
            // 满足 `isBaseline` 时，index执行该分支。
            if (isBaseline) {
              // index在这里处理 `crossPos =`，完成这一小步状态转换。
              crossPos =
                effectiveLineCrossPos +
                lineMaxAscent[li]! -
                calculateBaseline(c)
            }
            // 结束这个分支或循环，避免index继续落入后续路径。
            break
          default:
            // 结束这个分支或循环，避免index继续落入后续路径。
            break
        }
      }

      // Relative position offsets. Fast path: no position insets set →
      // skip 4× resolveEdgeRaw + 4× resolveValue + 4× isDefined.
      // relX保存`0`，供index后续判断或输出使用。
      let relX = 0
      // relY保存`0`，供后续判断或组装使用。
      let relY = 0
      // 满足 `c._hasPosition` 时，index执行该分支。
      if (c._hasPosition) {
        // relLeft读取`resolveValue`，供index后续处理使用。
        const relLeft = resolveValue(
          resolveEdgeRaw(c.style.position, EDGE_LEFT),
          ownerW,
        )
        // relRight读取`resolveValue`，供index后续处理使用。
        const relRight = resolveValue(
          resolveEdgeRaw(c.style.position, EDGE_RIGHT),
          ownerW,
        )
        // relTop读取`resolveValue`，供index后续处理使用。
        const relTop = resolveValue(
          resolveEdgeRaw(c.style.position, EDGE_TOP),
          ownerW,
        )
        // relBottom读取`resolveValue`，供index后续处理使用。
        const relBottom = resolveValue(
          resolveEdgeRaw(c.style.position, EDGE_BOTTOM),
          ownerW,
        )
        // relX更新为 `isDefined(relLeft)`，确保index后续读取最新状态。
        relX = isDefined(relLeft)
          ? relLeft
          : isDefined(relRight)
            ? -relRight
            : 0
        // relY更新为 `isDefined(relTop)`，确保index后续读取最新状态。
        relY = isDefined(relTop)
          ? relTop
          : isDefined(relBottom)
            ? -relBottom
            : 0
      }

      // 满足 `isMainRow` 时，index执行该分支。
      if (isMainRow) {
        // left更新为 `mainPos + relX`，确保index后续读取最新状态。
        c.layout.left = mainPos + relX
        // top更新为 `crossPos + relY`，确保index后续读取最新状态。
        c.layout.top = crossPos + relY
      } else {
        // left更新为 `crossPos + relX`，确保index后续读取最新状态。
        c.layout.left = crossPos + relX
        // top更新为 `mainPos + relY`，确保index后续读取最新状态。
        c.layout.top = mainPos + relY
      }
      // index在这里处理 `pos += c._mainSize + mMainLead + mMainTrail + betweenMain`，完成这一小步状态转换。
      pos += c._mainSize + mMainLead + mMainTrail + betweenMain
    }
    // index在这里处理 `lineCrossPos += lineCross + betweenLines`，完成这一小步状态转换。
    lineCrossPos += lineCross + betweenLines
  }

  // STEP 6: Absolute-positioned children
  // 按顺序遍历 `absChildren` 中的c，逐个交给index处理。
  for (const c of absChildren) {
    // 调用 layoutAbsoluteChild，触发index此处需要的副作用。
    layoutAbsoluteChild(
      node,
      c,
      node.layout.width,
      node.layout.height,
      pad,
      bor,
    )
  }
}

// layoutAbsoluteChild 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function layoutAbsoluteChild(
  parent: Node,
  child: Node,
  parentWidth: number,
  parentHeight: number,
  pad: [number, number, number, number],
  bor: [number, number, number, number],
): void {
  // cs 集合保存`child.style`，供后续判断或组装使用。
  const cs = child.style
  // posLeft读取`resolveEdgeRaw`，供index后续处理使用。
  const posLeft = resolveEdgeRaw(cs.position, EDGE_LEFT)
  // posRight读取`resolveEdgeRaw`，供index后续处理使用。
  const posRight = resolveEdgeRaw(cs.position, EDGE_RIGHT)
  // posTop读取`resolveEdgeRaw`，供index后续处理使用。
  const posTop = resolveEdgeRaw(cs.position, EDGE_TOP)
  // posBottom读取`resolveEdgeRaw`，供index后续处理使用。
  const posBottom = resolveEdgeRaw(cs.position, EDGE_BOTTOM)

  // rLeft读取`resolveValue`，供index后续处理使用。
  const rLeft = resolveValue(posLeft, parentWidth)
  // rRight读取`resolveValue`，供index后续处理使用。
  const rRight = resolveValue(posRight, parentWidth)
  // rTop读取`resolveValue`，供index后续处理使用。
  const rTop = resolveValue(posTop, parentHeight)
  // rBottom读取`resolveValue`，供index后续处理使用。
  const rBottom = resolveValue(posBottom, parentHeight)

  // Absolute children's percentage dimensions resolve against the containing
  // block's padding-box (parent size minus border), per CSS §10.1.
  // paddingBoxW读取 `parentWidth - bor[0] - bor[2]` 对应条目，后续围绕该成员继续处理。
  const paddingBoxW = parentWidth - bor[0] - bor[2]
  // paddingBoxH读取 `parentHeight - bor[1] - bor[3]` 对应条目，后续围绕该成员继续处理。
  const paddingBoxH = parentHeight - bor[1] - bor[3]
  // cw读取`resolveValue`，供index后续处理使用。
  let cw = resolveValue(cs.width, paddingBoxW)
  // ch读取`resolveValue`，供index后续处理使用。
  let ch = resolveValue(cs.height, paddingBoxH)

  // If both left+right defined and width not, derive width
  // 组合条件 `!isDefined(cw) && isDefined(rLeft) && isDefined(rRight)` 成立时，index才启用这条专门路径。
  if (!isDefined(cw) && isDefined(rLeft) && isDefined(rRight)) {
    // cw更新为 `paddingBoxW - rLeft - rRight`，确保index后续读取最新状态。
    cw = paddingBoxW - rLeft - rRight
  }
  // 组合条件 `!isDefined(ch) && isDefined(rTop) && isDefined(rBottom)` 成立时，index才启用这条专门路径。
  if (!isDefined(ch) && isDefined(rTop) && isDefined(rBottom)) {
    // ch更新为 `paddingBoxH - rTop - rBottom`，确保index后续读取最新状态。
    ch = paddingBoxH - rTop - rBottom
  }

  // 调用 layoutNode，触发index此处需要的副作用。
  layoutNode(
    child,
    cw,
    ch,
    isDefined(cw) ? MeasureMode.Exactly : MeasureMode.Undefined,
    isDefined(ch) ? MeasureMode.Exactly : MeasureMode.Undefined,
    paddingBoxW,
    paddingBoxH,
    true,
  )

  // Margin of absolute child (applied in addition to insets)
  // mL读取`resolveEdge`，供index后续处理使用。
  const mL = resolveEdge(cs.margin, EDGE_LEFT, parentWidth)
  // mT读取`resolveEdge`，供index后续处理使用。
  const mT = resolveEdge(cs.margin, EDGE_TOP, parentWidth)
  // mR读取`resolveEdge`，供index后续处理使用。
  const mR = resolveEdge(cs.margin, EDGE_RIGHT, parentWidth)
  // mB读取`resolveEdge`，供index后续处理使用。
  const mB = resolveEdge(cs.margin, EDGE_BOTTOM, parentWidth)

  // mainAxis 集合保存`parent.style.flexDirection`，供后续判断或组装使用。
  const mainAxis = parent.style.flexDirection
  // reversed保存`isReverse`，供index后续处理使用。
  const reversed = isReverse(mainAxis)
  // mainRow保存`isRow`，供index后续处理使用。
  const mainRow = isRow(mainAxis)
  // wrapReverse标记index是否启用对应路径。
  const wrapReverse = parent.style.flexWrap === Wrap.WrapReverse
  // alignSelf overrides alignItems for absolute children (same as flow items)
  // alignment 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const alignment =
    cs.alignSelf === Align.Auto ? parent.style.alignItems : cs.alignSelf

  // Position
  // left 先占位，稍后的条件分支会根据实际输入补齐它。
  let left: number
  // 满足 `isDefined(rLeft)` 时，index执行该分支。
  if (isDefined(rLeft)) {
    // left更新为 `bor[0] + rLeft + mL`，确保index后续读取最新状态。
    left = bor[0] + rLeft + mL
  // index在这里处理 `} else if (isDefined(rRight)) {`，完成这一小步状态转换。
  } else if (isDefined(rRight)) {
    // left更新为 `parentWidth - bor[2] - rRight - child.layout.width - mR`，确保index后续读取最新状态。
    left = parentWidth - bor[2] - rRight - child.layout.width - mR
  // index在这里处理 `} else if (mainRow) {`，完成这一小步状态转换。
  } else if (mainRow) {
    // Main axis — justify-content, flipped for reversed
    // lead保存`pad[0] + bor[0]`，供index后续判断或输出使用。
    const lead = pad[0] + bor[0]
    // trail保存`parentWidth - pad[2] - bor[2]`，供index后续判断或输出使用。
    const trail = parentWidth - pad[2] - bor[2]
    // left更新为 `reversed`，确保index后续读取最新状态。
    left = reversed
      ? trail - child.layout.width - mR
      : justifyAbsolute(
          parent.style.justifyContent,
          lead,
          trail,
          child.layout.width,
        ) + mL
  } else {
    // index在这里处理 `left =`，完成这一小步状态转换。
    left =
      alignAbsolute(
        alignment,
        pad[0] + bor[0],
        parentWidth - pad[2] - bor[2],
        child.layout.width,
        wrapReverse,
      ) + mL
  }

  // top 先占位，稍后的条件分支会根据实际输入补齐它。
  let top: number
  // 满足 `isDefined(rTop)` 时，index执行该分支。
  if (isDefined(rTop)) {
    // top更新为 `bor[1] + rTop + mT`，确保index后续读取最新状态。
    top = bor[1] + rTop + mT
  // index在这里处理 `} else if (isDefined(rBottom)) {`，完成这一小步状态转换。
  } else if (isDefined(rBottom)) {
    // top更新为 `parentHeight - bor[3] - rBottom - child.layout.height - mB`，确保index后续读取最新状态。
    top = parentHeight - bor[3] - rBottom - child.layout.height - mB
  // index在这里处理 `} else if (mainRow) {`，完成这一小步状态转换。
  } else if (mainRow) {
    // index在这里处理 `top =`，完成这一小步状态转换。
    top =
      alignAbsolute(
        alignment,
        pad[1] + bor[1],
        parentHeight - pad[3] - bor[3],
        child.layout.height,
        wrapReverse,
      ) + mT
  } else {
    // lead保存`pad[1] + bor[1]`，供index后续判断或输出使用。
    const lead = pad[1] + bor[1]
    // trail保存`parentHeight - pad[3] - bor[3]`，供index后续判断或输出使用。
    const trail = parentHeight - pad[3] - bor[3]
    // top更新为 `reversed`，确保index后续读取最新状态。
    top = reversed
      ? trail - child.layout.height - mB
      : justifyAbsolute(
          parent.style.justifyContent,
          lead,
          trail,
          child.layout.height,
        ) + mT
  }

  // left更新为 `left`，确保index后续读取最新状态。
  child.layout.left = left
  // top更新为 `top`，确保index后续读取最新状态。
  child.layout.top = top
}

// justifyAbsolute 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function justifyAbsolute(
  justify: Justify,
  leadEdge: number,
  trailEdge: number,
  childSize: number,
): number {
  // 按照 justify 的取值选择index的具体处理分支。
  switch (justify) {
    case Justify.Center:
      // 返回 `leadEdge + (trailEdge - leadEdge - childSize) / 2`，作为index这次计算的结果。
      return leadEdge + (trailEdge - leadEdge - childSize) / 2
    case Justify.FlexEnd:
      // 返回 `trailEdge - childSize`，作为index这次计算的结果。
      return trailEdge - childSize
    default:
      // 返回 `leadEdge`，作为index这次计算的结果。
      return leadEdge
  }
}

// alignAbsolute 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function alignAbsolute(
  align: Align,
  leadEdge: number,
  trailEdge: number,
  childSize: number,
  wrapReverse: boolean,
): number {
  // Wrap-reverse flips the cross axis: flex-start/stretch go to trailing,
  // flex-end goes to leading (yoga's absoluteLayoutChild flips the align value
  // when the containing block has wrap-reverse).
  // 按照 align 的取值选择index的具体处理分支。
  switch (align) {
    case Align.Center:
      // 返回 `leadEdge + (trailEdge - leadEdge - childSize) / 2`，作为index这次计算的结果。
      return leadEdge + (trailEdge - leadEdge - childSize) / 2
    case Align.FlexEnd:
      // 返回 `wrapReverse ? leadEdge : trailEdge - childSize`，作为index这次计算的结果。
      return wrapReverse ? leadEdge : trailEdge - childSize
    default:
      // 返回 `wrapReverse ? trailEdge - childSize : leadEdge`，作为index这次计算的结果。
      return wrapReverse ? trailEdge - childSize : leadEdge
  }
}

// computeFlexBasis 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeFlexBasis(
  child: Node,
  mainAxis: FlexDirection,
  availableMain: number,
  availableCross: number,
  crossMode: MeasureMode,
  ownerWidth: number,
  ownerHeight: number,
): number {
  // Same-generation cache hit: basis was computed THIS calculateLayout, so
  // it's fresh regardless of isDirty_. Covers both clean children (scrolling
  // past unchanged messages) AND fresh-mounted dirty children (virtual
  // scroll mounts new items — the dirty chain's measure→layout cascade
  // invokes this ≥2^depth times, but the child's subtree doesn't change
  // between calls within one calculateLayout). For clean children with
  // cache from a PREVIOUS generation, also hit if inputs match — isDirty_
  // gates since a dirty child's previous-gen cache is stale.
  // sameGen标记index是否启用对应路径。
  const sameGen = child._fbGen === _generation
  // index在这里进入条件判断，后续代码按实际状态分流。
  if (
    (sameGen || !child.isDirty_) &&
    child._fbCrossMode === crossMode &&
    sameFloat(child._fbOwnerW, ownerWidth) &&
    sameFloat(child._fbOwnerH, ownerHeight) &&
    sameFloat(child._fbAvailMain, availableMain) &&
    sameFloat(child._fbAvailCross, availableCross)
  ) {
    // 返回 `child._fbBasis`，作为index这次计算的结果。
    return child._fbBasis
  }
  // cs 集合保存`child.style`，供后续判断或组装使用。
  const cs = child.style
  // isMainRow记录 `isRow` 是否成立，index随后按该结果分支。
  const isMainRow = isRow(mainAxis)

  // Explicit flex-basis
  // basis 集合读取`resolveValue`，供index后续处理使用。
  const basis = resolveValue(cs.flexBasis, availableMain)
  // 满足 `isDefined(basis)` 时，index执行该分支。
  if (isDefined(basis)) {
    // b保存`Math.max`，供index后续处理使用。
    const b = Math.max(0, basis)
    // _fbBasis 集合更新为 `b`，确保index后续读取最新状态。
    child._fbBasis = b
    // _fbOwnerW更新为 `ownerWidth`，确保index后续读取最新状态。
    child._fbOwnerW = ownerWidth
    // _fbOwnerH更新为 `ownerHeight`，确保index后续读取最新状态。
    child._fbOwnerH = ownerHeight
    // _fbAvailMain更新为 `availableMain`，确保index后续读取最新状态。
    child._fbAvailMain = availableMain
    // _fbAvailCross 集合更新为 `availableCross`，确保index后续读取最新状态。
    child._fbAvailCross = availableCross
    // _fbCrossMode更新为 `crossMode`，确保index后续读取最新状态。
    child._fbCrossMode = crossMode
    // _fbGen更新为 `_generation`，确保index后续读取最新状态。
    child._fbGen = _generation
    // 返回 `b`，作为index这次计算的结果。
    return b
  }

  // Style dimension on main axis
  // mainStyleDim保存`isMainRow ? cs.width : cs.height`，供index后续判断或输出使用。
  const mainStyleDim = isMainRow ? cs.width : cs.height
  // mainOwner 命名 `isMainRow ? ownerWidth : ownerHeight`，让后续代码直接表达这个值的用途。
  const mainOwner = isMainRow ? ownerWidth : ownerHeight
  // resolved读取`resolveValue`，供index后续处理使用。
  const resolved = resolveValue(mainStyleDim, mainOwner)
  // 满足 `isDefined(resolved)` 时，index执行该分支。
  if (isDefined(resolved)) {
    // b保存`Math.max`，供index后续处理使用。
    const b = Math.max(0, resolved)
    // _fbBasis 集合更新为 `b`，确保index后续读取最新状态。
    child._fbBasis = b
    // _fbOwnerW更新为 `ownerWidth`，确保index后续读取最新状态。
    child._fbOwnerW = ownerWidth
    // _fbOwnerH更新为 `ownerHeight`，确保index后续读取最新状态。
    child._fbOwnerH = ownerHeight
    // _fbAvailMain更新为 `availableMain`，确保index后续读取最新状态。
    child._fbAvailMain = availableMain
    // _fbAvailCross 集合更新为 `availableCross`，确保index后续读取最新状态。
    child._fbAvailCross = availableCross
    // _fbCrossMode更新为 `crossMode`，确保index后续读取最新状态。
    child._fbCrossMode = crossMode
    // _fbGen更新为 `_generation`，确保index后续读取最新状态。
    child._fbGen = _generation
    // 返回 `b`，作为index这次计算的结果。
    return b
  }

  // Need to measure the child to get its natural size
  // crossStyleDim 命名 `isMainRow ? cs.height : cs.width`，让后续代码直接表达这个值的用途。
  const crossStyleDim = isMainRow ? cs.height : cs.width
  // crossOwner 命名 `isMainRow ? ownerHeight : ownerWidth`，让后续代码直接表达这个值的用途。
  const crossOwner = isMainRow ? ownerHeight : ownerWidth
  // crossConstraint读取`resolveValue`，供index后续处理使用。
  let crossConstraint = resolveValue(crossStyleDim, crossOwner)
  // crossConstraintMode保存`isDefined(crossConstraint)`，供index后续判断或输出使用。
  let crossConstraintMode: MeasureMode = isDefined(crossConstraint)
    ? MeasureMode.Exactly
    : MeasureMode.Undefined
  // 组合条件 `!isDefined(crossConstraint) && isDefined(availableCross)` 成立时，index才启用这条专门路径。
  if (!isDefined(crossConstraint) && isDefined(availableCross)) {
    // crossConstraint更新为 `availableCross`，确保index后续读取最新状态。
    crossConstraint = availableCross
    // index在这里处理 `crossConstraintMode =`，完成这一小步状态转换。
    crossConstraintMode =
      crossMode === MeasureMode.Exactly && isStretchAlign(child)
        ? MeasureMode.Exactly
        : MeasureMode.AtMost
  }

  // Upstream yoga (YGNodeComputeFlexBasisForChild) passes the available inner
  // width with mode AtMost when the subtree will call a measure-func — so text
  // nodes don't report unconstrained intrinsic width as flex-basis, which
  // would force siblings to shrink and the text to wrap at the wrong width.
  // Passing Undefined here made Ink's <Text> inside <Box flexGrow={1}> get
  // width = intrinsic instead of available, dropping chars at wrap boundaries.
  //
  // Two constraints on when this applies:
  //   - Width only. Height is never constrained during basis measurement —
  //     column containers must measure children at natural height so
  //     scrollable content can overflow (constraining height clips ScrollBox).
  //   - Subtree has a measure-func. Pure layout subtrees (no measure-func)
  //     with flex-grow children would grow into the AtMost constraint,
  //     inflating the basis (breaks YGMinMaxDimensionTest flex_grow_in_at_most
  //     where a flexGrow:1 child should stay at basis 0, not grow to 100).
  // mainConstraint保存`NaN`，供index后续判断或输出使用。
  let mainConstraint = NaN
  // mainConstraintMode保存`MeasureMode.Undefined`，供后续判断或组装使用。
  let mainConstraintMode: MeasureMode = MeasureMode.Undefined
  // 组合条件 `isMainRow && isDefined(availableMain) && hasMeasureFuncInSubtree(child)` 成立时，index才启用这条专门路径。
  if (isMainRow && isDefined(availableMain) && hasMeasureFuncInSubtree(child)) {
    // mainConstraint更新为 `availableMain`，确保index后续读取最新状态。
    mainConstraint = availableMain
    // mainConstraintMode更新为 `MeasureMode.AtMost`，确保index后续读取最新状态。
    mainConstraintMode = MeasureMode.AtMost
  }

  // mw保存`isMainRow ? mainConstraint : crossConstraint`，供后续判断或组装使用。
  const mw = isMainRow ? mainConstraint : crossConstraint
  // mh保存`isMainRow ? crossConstraint : mainConstraint`，供后续判断或组装使用。
  const mh = isMainRow ? crossConstraint : mainConstraint
  // mwMode保存`isMainRow ? mainConstraintMode : crossConstraintMode`，供index后续判断或输出使用。
  const mwMode = isMainRow ? mainConstraintMode : crossConstraintMode
  // mhMode 命名 `isMainRow ? crossConstraintMode : mainConstraintMode`，让后续代码直接表达这个值的用途。
  const mhMode = isMainRow ? crossConstraintMode : mainConstraintMode

  // 调用 layoutNode，触发index此处需要的副作用。
  layoutNode(child, mw, mh, mwMode, mhMode, ownerWidth, ownerHeight, false)
  // b保存`isMainRow ? child.layout.width : child.layout.height`，供index后续判断或输出使用。
  const b = isMainRow ? child.layout.width : child.layout.height
  // _fbBasis 集合更新为 `b`，确保index后续读取最新状态。
  child._fbBasis = b
  // _fbOwnerW更新为 `ownerWidth`，确保index后续读取最新状态。
  child._fbOwnerW = ownerWidth
  // _fbOwnerH更新为 `ownerHeight`，确保index后续读取最新状态。
  child._fbOwnerH = ownerHeight
  // _fbAvailMain更新为 `availableMain`，确保index后续读取最新状态。
  child._fbAvailMain = availableMain
  // _fbAvailCross 集合更新为 `availableCross`，确保index后续读取最新状态。
  child._fbAvailCross = availableCross
  // _fbCrossMode更新为 `crossMode`，确保index后续读取最新状态。
  child._fbCrossMode = crossMode
  // _fbGen更新为 `_generation`，确保index后续读取最新状态。
  child._fbGen = _generation
  // 返回 `b`，作为index这次计算的结果。
  return b
}

// hasMeasureFuncInSubtree 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasMeasureFuncInSubtree(node: Node): boolean {
  // 满足 `node.measureFunc` 时，index执行该分支。
  if (node.measureFunc) return true
  // 按顺序遍历 `node.children` 中的c，逐个交给index处理。
  for (const c of node.children) {
    // 满足 `hasMeasureFuncInSubtree(c)` 时，index执行该分支。
    if (hasMeasureFuncInSubtree(c)) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// resolveFlexibleLengths 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveFlexibleLengths(
  children: Node[],
  availableInnerMain: number,
  totalFlexBasis: number,
  isMainRow: boolean,
  ownerW: number,
  ownerH: number,
): void {
  // Multi-pass flex distribution per CSS flexbox spec §9.7 "Resolving Flexible
  // Lengths": distribute free space, detect min/max violations, freeze all
  // violators, redistribute among unfrozen children. Repeat until stable.
  // n保存 `children.length` 的判断结果，供index后续分支直接复用。
  const n = children.length
  // frozen 命名 `new Array(n).fill(false)`，让后续代码直接表达这个值的用途。
  const frozen: boolean[] = new Array(n).fill(false)
  // initialFree保存`isDefined`，供index后续处理使用。
  const initialFree = isDefined(availableInnerMain)
    ? availableInnerMain - totalFlexBasis
    : 0
  // Freeze inflexible items at their clamped basis
  // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < n; i++) {
    // c 命名 `children[i]!`，让后续代码直接表达这个值的用途。
    const c = children[i]!
    // clamped保存`boundAxis`，供index后续处理使用。
    const clamped = boundAxis(c.style, isMainRow, c._flexBasis, ownerW, ownerH)
    // inflexible 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const inflexible =
      !isDefined(availableInnerMain) ||
      (initialFree >= 0 ? c.style.flexGrow === 0 : c.style.flexShrink === 0)
    // 满足 `inflexible` 时，index执行该分支。
    if (inflexible) {
      // _mainSize更新为 `Math.max(0, clamped)`，确保index后续读取最新状态。
      c._mainSize = Math.max(0, clamped)
      // frozen[i更新为 `true`，确保index后续读取最新状态。
      frozen[i] = true
    } else {
      // _mainSize更新为 `c._flexBasis`，确保index后续读取最新状态。
      c._mainSize = c._flexBasis
    }
  }
  // Iteratively distribute until no violations. Free space is recomputed each
  // pass: initial free space minus the delta frozen children consumed beyond
  // (or below) their basis.
  // unclamped 命名 `new Array(n)`，让后续代码直接表达这个值的用途。
  const unclamped: number[] = new Array(n)
  // 按索引扫描 `= n`，需要消费相邻参数时可以精确移动游标。
  for (let iter = 0; iter <= n; iter++) {
    // frozenDelta保存`0`，供index后续判断或输出使用。
    let frozenDelta = 0
    // totalGrow保存`0`，供后续判断或组装使用。
    let totalGrow = 0
    // totalShrinkScaled保存`0`，供后续判断或组装使用。
    let totalShrinkScaled = 0
    // unfrozenCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let unfrozenCount = 0
    // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < n; i++) {
      // c 命名 `children[i]!`，让后续代码直接表达这个值的用途。
      const c = children[i]!
      // 满足 `frozen[i]` 时，index执行该分支。
      if (frozen[i]) {
        // index在这里处理 `frozenDelta += c._mainSize - c._flexBasis`，完成这一小步状态转换。
        frozenDelta += c._mainSize - c._flexBasis
      } else {
        // index在这里处理 `totalGrow += c.style.flexGrow`，完成这一小步状态转换。
        totalGrow += c.style.flexGrow
        // index在这里处理 `totalShrinkScaled += c.style.flexShrink * c._flexBasis`，完成这一小步状态转换。
        totalShrinkScaled += c.style.flexShrink * c._flexBasis
        // index在这里处理 `unfrozenCount++`，完成这一小步状态转换。
        unfrozenCount++
      }
    }
    // 满足 `unfrozenCount === 0` 时，index执行该分支。
    if (unfrozenCount === 0) break
    // remaining保存`initialFree - frozenDelta`，供index后续判断或输出使用。
    let remaining = initialFree - frozenDelta
    // Spec §9.7 step 4c: if sum of flex factors < 1, only distribute
    // initialFree × sum, not the full remaining space (partial flex).
    // 组合条件 `remaining > 0 && totalGrow > 0 && totalGrow < 1` 成立时，index才启用这条专门路径。
    if (remaining > 0 && totalGrow > 0 && totalGrow < 1) {
      // scaled保存`initialFree * totalGrow`，供后续判断或组装使用。
      const scaled = initialFree * totalGrow
      // 满足 `scaled < remaining` 时，index执行该分支。
      if (scaled < remaining) remaining = scaled
    // index在这里处理 `} else if (remaining < 0 && totalShrinkScaled > 0) {`，完成这一小步状态转换。
    } else if (remaining < 0 && totalShrinkScaled > 0) {
      // totalShrink保存`0`，供后续判断或组装使用。
      let totalShrink = 0
      // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < n; i++) {
        // 满足 `!frozen[i]` 时，index执行该分支。
        if (!frozen[i]) totalShrink += children[i]!.style.flexShrink
      }
      // 满足 `totalShrink < 1` 时，index执行该分支。
      if (totalShrink < 1) {
        // scaled保存`initialFree * totalShrink`，供index后续判断或输出使用。
        const scaled = initialFree * totalShrink
        // 满足 `scaled > remaining` 时，index执行该分支。
        if (scaled > remaining) remaining = scaled
      }
    }
    // Compute targets + violations for all unfrozen children
    // totalViolation保存`0`，供后续判断或组装使用。
    let totalViolation = 0
    // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < n; i++) {
      // 满足 `frozen[i]` 时，index执行该分支。
      if (frozen[i]) continue
      // c 命名 `children[i]!`，让后续代码直接表达这个值的用途。
      const c = children[i]!
      // t 命名 `c._flexBasis`，让后续代码直接表达这个值的用途。
      let t = c._flexBasis
      // 组合条件 `remaining > 0 && totalGrow > 0` 成立时，index才启用这条专门路径。
      if (remaining > 0 && totalGrow > 0) {
        // index在这里处理 `t += (remaining * c.style.flexGrow) / totalGrow`，完成这一小步状态转换。
        t += (remaining * c.style.flexGrow) / totalGrow
      // index在这里处理 `} else if (remaining < 0 && totalShrinkScaled > 0) {`，完成这一小步状态转换。
      } else if (remaining < 0 && totalShrinkScaled > 0) {
        // index在这里处理 `t +=`，完成这一小步状态转换。
        t +=
          (remaining * (c.style.flexShrink * c._flexBasis)) / totalShrinkScaled
      }
      // unclamped[i更新为 `t`，确保index后续读取最新状态。
      unclamped[i] = t
      // clamped保存`Math.max`，供index后续处理使用。
      const clamped = Math.max(
        0,
        boundAxis(c.style, isMainRow, t, ownerW, ownerH),
      )
      // _mainSize更新为 `clamped`，确保index后续读取最新状态。
      c._mainSize = clamped
      // index在这里处理 `totalViolation += clamped - t`，完成这一小步状态转换。
      totalViolation += clamped - t
    }
    // Freeze per spec §9.7 step 5: if totalViolation is zero freeze all; if
    // positive freeze min-violators; if negative freeze max-violators.
    // 满足 `totalViolation === 0` 时，index执行该分支。
    if (totalViolation === 0) break
    // anyFrozen标记index是否启用对应路径。
    let anyFrozen = false
    // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < n; i++) {
      // 满足 `frozen[i]` 时，index执行该分支。
      if (frozen[i]) continue
      // v 命名 `children[i]!._mainSize - unclamped[i]!`，让后续代码直接表达这个值的用途。
      const v = children[i]!._mainSize - unclamped[i]!
      // 组合条件 `(totalViolation > 0 && v > 0) || (totalViolation < 0 && v < 0)` 成立时，index才启用这条专门路径。
      if ((totalViolation > 0 && v > 0) || (totalViolation < 0 && v < 0)) {
        // frozen[i更新为 `true`，确保index后续读取最新状态。
        frozen[i] = true
        // anyFrozen更新为 `true`，确保index后续读取最新状态。
        anyFrozen = true
      }
    }
    // anyFrozen缺失时提前走兜底路径，避免index继续依赖无效输入。
    if (!anyFrozen) break
  }
}

// isStretchAlign 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isStretchAlign(child: Node): boolean {
  // p 命名 `child.parent`，让后续代码直接表达这个值的用途。
  const p = child.parent
  // p缺失时提前走兜底路径，避免index继续依赖无效输入。
  if (!p) return false
  // align 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const align =
    child.style.alignSelf === Align.Auto
      ? p.style.alignItems
      : child.style.alignSelf
  // 返回 `align === Align.Stretch`，作为index这次计算的结果。
  return align === Align.Stretch
}

// resolveChildAlign 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveChildAlign(parent: Node, child: Node): Align {
  // 返回 `child.style.alignSelf === Align.Auto`，作为index这次计算的结果。
  return child.style.alignSelf === Align.Auto
    ? parent.style.alignItems
    : child.style.alignSelf
}

// Baseline of a node per CSS Flexbox §8.5 / yoga's YGBaseline. Leaf nodes
// (no children) use their own height. Containers recurse into the first
// baseline-aligned child on the first line (or the first flow child if none
// are baseline-aligned), returning that child's baseline + its top offset.
// calculateBaseline 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function calculateBaseline(node: Node): number {
  // baselineChild初始化为空值，后续分支会在有数据时补齐。
  let baselineChild: Node | null = null
  // 按顺序遍历 `node.children` 中的c，逐个交给index处理。
  for (const c of node.children) {
    // 满足 `c._lineIndex > 0` 时，index执行该分支。
    if (c._lineIndex > 0) break
    // 满足 `c.style.positionType === PositionType.Absolute` 时，index执行该分支。
    if (c.style.positionType === PositionType.Absolute) continue
    // 满足 `c.style.display === Display.None` 时，index执行该分支。
    if (c.style.display === Display.None) continue
    // index在这里进入条件判断，后续代码按实际状态分流。
    if (
      resolveChildAlign(node, c) === Align.Baseline ||
      c.isReferenceBaseline_
    ) {
      // baselineChild更新为 `c`，确保index后续读取最新状态。
      baselineChild = c
      // 结束这个分支或循环，避免index继续落入后续路径。
      break
    }
    // 满足 `baselineChild === null` 时，index执行该分支。
    if (baselineChild === null) baselineChild = c
  }
  // 满足 `baselineChild === null` 时，index执行该分支。
  if (baselineChild === null) return node.layout.height
  // 返回 `calculateBaseline(baselineChild) + baselineChild.layout.top`，作为index这次计算的结果。
  return calculateBaseline(baselineChild) + baselineChild.layout.top
}

// A container uses baseline layout only for row direction, when either
// align-items is baseline or any flow child has align-self: baseline.
// isBaselineLayout 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBaselineLayout(node: Node, flowChildren: Node[]): boolean {
  // 满足 `!isRow(node.style.flexDirection)` 时，index执行该分支。
  if (!isRow(node.style.flexDirection)) return false
  // 满足 `node.style.alignItems === Align.Baseline` 时，index执行该分支。
  if (node.style.alignItems === Align.Baseline) return true
  // 按顺序遍历 `flowChildren` 中的c，逐个交给index处理。
  for (const c of flowChildren) {
    // 满足 `c.style.alignSelf === Align.Baseline` 时，index执行该分支。
    if (c.style.alignSelf === Align.Baseline) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// childMarginForAxis 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function childMarginForAxis(
  child: Node,
  axis: FlexDirection,
  ownerWidth: number,
): number {
  // child._hasMargin缺失时提前走兜底路径，避免index继续依赖无效输入。
  if (!child._hasMargin) return 0
  // lead读取`resolveEdge`，供index后续处理使用。
  const lead = resolveEdge(child.style.margin, leadingEdge(axis), ownerWidth)
  // trail读取`resolveEdge`，供index后续处理使用。
  const trail = resolveEdge(child.style.margin, trailingEdge(axis), ownerWidth)
  // 返回 `lead + trail`，作为index这次计算的结果。
  return lead + trail
}

// resolveGap 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveGap(style: Style, gutter: Gutter, ownerSize: number): number {
  // v保存`style.gap[gutter]!`，供index后续判断或输出使用。
  let v = style.gap[gutter]!
  // 满足 `v.unit === Unit.Undefined` 时，index执行该分支。
  if (v.unit === Unit.Undefined) v = style.gap[Gutter.All]!
  // r读取`resolveValue`，供index后续处理使用。
  const r = resolveValue(v, ownerSize)
  // 返回 `isDefined(r) ? Math.max(0, r) : 0`，作为index这次计算的结果。
  return isDefined(r) ? Math.max(0, r) : 0
}

// boundAxis 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function boundAxis(
  style: Style,
  isWidth: boolean,
  value: number,
  ownerWidth: number,
  ownerHeight: number,
): number {
  // minV保存`isWidth ? style.minWidth : style.minHeight`，供index后续判断或输出使用。
  const minV = isWidth ? style.minWidth : style.minHeight
  // maxV保存`isWidth ? style.maxWidth : style.maxHeight`，供后续判断或组装使用。
  const maxV = isWidth ? style.maxWidth : style.maxHeight
  // minU保存`minV.unit`，供index后续判断或输出使用。
  const minU = minV.unit
  // maxU保存`maxV.unit`，供index后续判断或输出使用。
  const maxU = maxV.unit
  // Fast path: no min/max constraints set. Per CPU profile this is the
  // overwhelmingly common case (~32k calls/layout on the 1000-node bench,
  // nearly all with undefined min/max) — skipping 2× resolveValue + 2× isNaN
  // that always no-op. Unit.Undefined = 0.
  // 组合条件 `minU === 0 && maxU === 0` 成立时，index才启用这条专门路径。
  if (minU === 0 && maxU === 0) return value
  // owner保存`isWidth ? ownerWidth : ownerHeight`，供后续判断或组装使用。
  const owner = isWidth ? ownerWidth : ownerHeight
  // v 命名 `value`，让后续代码直接表达这个值的用途。
  let v = value
  // Inlined resolveValue: Unit.Point=1, Unit.Percent=2. `m === m` is !isNaN.
  // 满足 `maxU === 1` 时，index执行该分支。
  if (maxU === 1) {
    // 满足 `v > maxV.value` 时，index执行该分支。
    if (v > maxV.value) v = maxV.value
  // index在这里处理 `} else if (maxU === 2) {`，完成这一小步状态转换。
  } else if (maxU === 2) {
    // m保存`(maxV.value * owner) / 100`，供后续判断或组装使用。
    const m = (maxV.value * owner) / 100
    // 组合条件 `m === m && v > m` 成立时，index才启用这条专门路径。
    if (m === m && v > m) v = m
  }
  // 满足 `minU === 1` 时，index执行该分支。
  if (minU === 1) {
    // 满足 `v < minV.value` 时，index执行该分支。
    if (v < minV.value) v = minV.value
  // index在这里处理 `} else if (minU === 2) {`，完成这一小步状态转换。
  } else if (minU === 2) {
    // m保存`(minV.value * owner) / 100`，供index后续判断或输出使用。
    const m = (minV.value * owner) / 100
    // 组合条件 `m === m && v < m` 成立时，index才启用这条专门路径。
    if (m === m && v < m) v = m
  }
  // 返回 `v`，作为index这次计算的结果。
  return v
}

// zeroLayoutRecursive 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function zeroLayoutRecursive(node: Node): void {
  // 按顺序遍历 `node.children` 中的c，逐个交给index处理。
  for (const c of node.children) {
    // left更新为 `0`，确保index后续读取最新状态。
    c.layout.left = 0
    // top更新为 `0`，确保index后续读取最新状态。
    c.layout.top = 0
    // width更新为 `0`，确保index后续读取最新状态。
    c.layout.width = 0
    // height更新为 `0`，确保index后续读取最新状态。
    c.layout.height = 0
    // Invalidate layout cache — without this, unhide → calculateLayout finds
    // the child clean (!isDirty_) with _hasL intact, hits the cache at line
    // ~1086, restores stale _lOutW/_lOutH, and returns early — skipping the
    // child-positioning recursion. Grandchildren stay at (0,0,0,0) from the
    // zeroing above and render invisible. isDirty_=true also gates _cN and
    // _fbBasis via their (sameGen || !isDirty_) checks — _cGen/_fbGen freeze
    // during hide so sameGen is false on unhide.
    // isDirty_更新为 `true`，确保index后续读取最新状态。
    c.isDirty_ = true
    // _hasL更新为 `false`，确保index后续读取最新状态。
    c._hasL = false
    // _hasM更新为 `false`，确保index后续读取最新状态。
    c._hasM = false
    // 调用 zeroLayoutRecursive，触发index此处需要的副作用。
    zeroLayoutRecursive(c)
  }
}

// collectLayoutChildren 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function collectLayoutChildren(node: Node, flow: Node[], abs: Node[]): void {
  // Partition a node's children into flow and absolute lists, flattening
  // display:contents subtrees so their children are laid out as direct
  // children of this node (per CSS display:contents spec — the box is removed
  // from the layout tree but its children remain, lifted to the grandparent).
  // 按顺序遍历 `node.children` 中的c，逐个交给index处理。
  for (const c of node.children) {
    // disp保存`c.style.display`，供index后续判断或输出使用。
    const disp = c.style.display
    // 满足 `disp === Display.None` 时，index执行该分支。
    if (disp === Display.None) {
      // left更新为 `0`，确保index后续读取最新状态。
      c.layout.left = 0
      // top更新为 `0`，确保index后续读取最新状态。
      c.layout.top = 0
      // width更新为 `0`，确保index后续读取最新状态。
      c.layout.width = 0
      // height更新为 `0`，确保index后续读取最新状态。
      c.layout.height = 0
      // 调用 zeroLayoutRecursive，触发index此处需要的副作用。
      zeroLayoutRecursive(c)
    // index在这里处理 `} else if (disp === Display.Contents) {`，完成这一小步状态转换。
    } else if (disp === Display.Contents) {
      // left更新为 `0`，确保index后续读取最新状态。
      c.layout.left = 0
      // top更新为 `0`，确保index后续读取最新状态。
      c.layout.top = 0
      // width更新为 `0`，确保index后续读取最新状态。
      c.layout.width = 0
      // height更新为 `0`，确保index后续读取最新状态。
      c.layout.height = 0
      // Recurse — nested display:contents lifts all the way up. The contents
      // node's own margin/padding/position/dimensions are ignored.
      // 调用 collectLayoutChildren，触发index此处需要的副作用。
      collectLayoutChildren(c, flow, abs)
    // index在这里处理 `} else if (c.style.positionType === PositionType.Absolute) {`，完成这一小步状态转换。
    } else if (c.style.positionType === PositionType.Absolute) {
      // abs 集合追加新条目，保持收集顺序与输入顺序一致。
      abs.push(c)
    } else {
      // flow追加新条目，保持收集顺序与输入顺序一致。
      flow.push(c)
    }
  }
}

// roundLayout 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function roundLayout(
  node: Node,
  scale: number,
  absLeft: number,
  absTop: number,
): void {
  // 满足 `scale === 0` 时，index执行该分支。
  if (scale === 0) return
  // l保存`node.layout`，供后续判断或组装使用。
  const l = node.layout
  // nodeLeft保存`l.left`，供后续判断或组装使用。
  const nodeLeft = l.left
  // nodeTop保存`l.top`，供后续判断或组装使用。
  const nodeTop = l.top
  // nodeWidth 命名 `l.width`，让后续代码直接表达这个值的用途。
  const nodeWidth = l.width
  // nodeHeight保存`l.height`，供后续判断或组装使用。
  const nodeHeight = l.height

  // absNodeLeft 命名 `absLeft + nodeLeft`，让后续代码直接表达这个值的用途。
  const absNodeLeft = absLeft + nodeLeft
  // absNodeTop保存`absTop + nodeTop`，供后续判断或组装使用。
  const absNodeTop = absTop + nodeTop

  // Upstream YGRoundValueToPixelGrid: text nodes (has measureFunc) floor their
  // positions so wrapped text never starts past its allocated column. Width
  // uses ceil-if-fractional to avoid clipping the last glyph. Non-text nodes
  // use standard round. Matches yoga's PixelGrid.cpp — without this, justify
  // center/space-evenly positions are off-by-one vs WASM and flex-shrink
  // overflow places siblings at the wrong column.
  // isText标记index是否启用对应路径。
  const isText = node.measureFunc !== null
  // left更新为 `roundValue(nodeLeft, scale, false, isText)`，确保index后续读取最新状态。
  l.left = roundValue(nodeLeft, scale, false, isText)
  // top更新为 `roundValue(nodeTop, scale, false, isText)`，确保index后续读取最新状态。
  l.top = roundValue(nodeTop, scale, false, isText)

  // Width/height rounded via absolute edges to avoid cumulative drift
  // absRight保存`absNodeLeft + nodeWidth`，供index后续判断或输出使用。
  const absRight = absNodeLeft + nodeWidth
  // absBottom保存`absNodeTop + nodeHeight`，供index后续判断或输出使用。
  const absBottom = absNodeTop + nodeHeight
  // hasFracW记录 `isWholeNumber` 是否成立，index随后按该结果分支。
  const hasFracW = !isWholeNumber(nodeWidth * scale)
  // hasFracH记录 `isWholeNumber` 是否成立，index随后按该结果分支。
  const hasFracH = !isWholeNumber(nodeHeight * scale)
  // index在这里处理 `l.width =`，完成这一小步状态转换。
  l.width =
    roundValue(absRight, scale, isText && hasFracW, isText && !hasFracW) -
    roundValue(absNodeLeft, scale, false, isText)
  // index在这里处理 `l.height =`，完成这一小步状态转换。
  l.height =
    roundValue(absBottom, scale, isText && hasFracH, isText && !hasFracH) -
    roundValue(absNodeTop, scale, false, isText)

  // 按顺序遍历 `node.children` 中的c，逐个交给index处理。
  for (const c of node.children) {
    // 调用 roundLayout，触发index此处需要的副作用。
    roundLayout(c, scale, absNodeLeft, absNodeTop)
  }
}

// isWholeNumber 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isWholeNumber(v: number): boolean {
  // frac保存`Math.floor`，供index后续处理使用。
  const frac = v - Math.floor(v)
  // 返回 `frac < 0.0001 || frac > 0.9999`，作为index这次计算的结果。
  return frac < 0.0001 || frac > 0.9999
}

// roundValue 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function roundValue(
  v: number,
  scale: number,
  forceCeil: boolean,
  forceFloor: boolean,
): number {
  // scaled保存`v * scale`，供后续判断或组装使用。
  let scaled = v * scale
  // frac保存`Math.floor`，供index后续处理使用。
  let frac = scaled - Math.floor(scaled)
  // 满足 `frac < 0` 时，index执行该分支。
  if (frac < 0) frac += 1
  // Float-epsilon tolerance matches upstream YGDoubleEqual (1e-4)
  // 满足 `frac < 0.0001` 时，index执行该分支。
  if (frac < 0.0001) {
    // scaled更新为 `Math.floor(scaled)`，确保index后续读取最新状态。
    scaled = Math.floor(scaled)
  // index在这里处理 `} else if (frac > 0.9999) {`，完成这一小步状态转换。
  } else if (frac > 0.9999) {
    // scaled更新为 `Math.ceil(scaled)`，确保index后续读取最新状态。
    scaled = Math.ceil(scaled)
  // index在这里处理 `} else if (forceCeil) {`，完成这一小步状态转换。
  } else if (forceCeil) {
    // scaled更新为 `Math.ceil(scaled)`，确保index后续读取最新状态。
    scaled = Math.ceil(scaled)
  // index在这里处理 `} else if (forceFloor) {`，完成这一小步状态转换。
  } else if (forceFloor) {
    // scaled更新为 `Math.floor(scaled)`，确保index后续读取最新状态。
    scaled = Math.floor(scaled)
  } else {
    // Round half-up (>= 0.5 goes up), per upstream
    // scaled更新为 `Math.floor(scaled) + (frac >= 0.4999 ? 1 : 0)`，确保index后续读取最新状态。
    scaled = Math.floor(scaled) + (frac >= 0.4999 ? 1 : 0)
  }
  // 返回 `scaled / scale`，作为index这次计算的结果。
  return scaled / scale
}

// --
// Helpers

// parseDimension 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseDimension(v: number | string | undefined): Value {
  // 满足 `v === undefined` 时，index执行该分支。
  if (v === undefined) return UNDEFINED_VALUE
  // 当 `v` 匹配 `'auto'` 时，index执行对应分支。
  if (v === 'auto') return AUTO_VALUE
  // 当 `typeof v` 匹配 `'number'` 时，index执行对应分支。
  if (typeof v === 'number') {
    // WASM yoga's YGFloatIsUndefined treats NaN and ±Infinity as undefined.
    // Ink passes height={Infinity} (e.g. LogSelector maxHeight default) and
    // expects it to mean "unconstrained" — storing it as a literal point value
    // makes the node height Infinity and breaks all downstream layout.
    // 返回 `Number.isFinite(v) ? pointValue(v) : UNDEFINED_VALUE`，作为index这次计算的结果。
    return Number.isFinite(v) ? pointValue(v) : UNDEFINED_VALUE
  }
  // 组合条件 `typeof v === 'string' && v.endsWith('%')` 成立时，index才启用这条专门路径。
  if (typeof v === 'string' && v.endsWith('%')) {
    // 返回 `percentValue(parseFloat(v))`，作为index这次计算的结果。
    return percentValue(parseFloat(v))
  }
  // n解析`parseFloat`，供index后续处理使用。
  const n = parseFloat(v)
  // 返回 `isNaN(n) ? UNDEFINED_VALUE : pointValue(n)`，作为index这次计算的结果。
  return isNaN(n) ? UNDEFINED_VALUE : pointValue(n)
}

// physicalEdge 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function physicalEdge(edge: Edge): number {
  // 按照 edge 的取值选择index的具体处理分支。
  switch (edge) {
    case Edge.Left:
    case Edge.Start:
      // 返回 `EDGE_LEFT`，作为index这次计算的结果。
      return EDGE_LEFT
    case Edge.Top:
      // 返回 `EDGE_TOP`，作为index这次计算的结果。
      return EDGE_TOP
    case Edge.Right:
    case Edge.End:
      // 返回 `EDGE_RIGHT`，作为index这次计算的结果。
      return EDGE_RIGHT
    case Edge.Bottom:
      // 返回 `EDGE_BOTTOM`，作为index这次计算的结果。
      return EDGE_BOTTOM
    default:
      // 返回 `EDGE_LEFT`，作为index这次计算的结果。
      return EDGE_LEFT
  }
}

// --
// Module API matching yoga-layout/load

// Yoga 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type Yoga = {
  Config: {
    create(): Config
    destroy(config: Config): void
  }
  Node: {
    // create 使用 config?: Config 完成index里的对应操作。
    create(config?: Config): Node
    // createDefault 使用 无 完成index里的对应操作。
    createDefault(): Node
    // createWithConfig 使用 config: Config 完成index里的对应操作。
    createWithConfig(config: Config): Node
    // destroy 使用 node: Node 完成index里的对应操作。
    destroy(node: Node): void
  }
}

// YOGA_INSTANCE 集中保存index要一起传递的字段。
const YOGA_INSTANCE: Yoga = {
  Config: {
    create: createConfig,
    // destroy 使用 无 完成index里的对应操作。
    destroy() {},
  },
  Node: {
    // 这个回调绑定到 create: (config?: Config) => new Node(config),，负责index在该局部场景下的响应。
    create: (config?: Config) => new Node(config),
    // 这个回调绑定到 createDefault: () => new Node(),，负责index在该局部场景下的响应。
    createDefault: () => new Node(),
    // 这个回调绑定到 createWithConfig: (config: Config) => new Node(config),，负责index在该局部场景下的响应。
    createWithConfig: (config: Config) => new Node(config),
    // destroy 使用 无 完成index里的对应操作。
    destroy() {},
  },
}

// loadYoga 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadYoga(): Promise<Yoga> {
  // 返回 `Promise.resolve(YOGA_INSTANCE)`，作为index这次计算的结果。
  return Promise.resolve(YOGA_INSTANCE)
}

export default YOGA_INSTANCE

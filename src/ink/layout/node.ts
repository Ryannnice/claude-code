// --
// Adapter interface for the layout engine (Yoga)

// LayoutEdge 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutEdge = {
  All: 'all',
  Horizontal: 'horizontal',
  Vertical: 'vertical',
  Left: 'left',
  Right: 'right',
  Top: 'top',
  Bottom: 'bottom',
  Start: 'start',
  End: 'end',
} as const
// LayoutEdge 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutEdge = (typeof LayoutEdge)[keyof typeof LayoutEdge]

// LayoutGutter 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutGutter = {
  All: 'all',
  Column: 'column',
  Row: 'row',
} as const
// LayoutGutter 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutGutter = (typeof LayoutGutter)[keyof typeof LayoutGutter]

// LayoutDisplay 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutDisplay = {
  Flex: 'flex',
  None: 'none',
} as const
// LayoutDisplay 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutDisplay = (typeof LayoutDisplay)[keyof typeof LayoutDisplay]

// LayoutFlexDirection 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutFlexDirection = {
  Row: 'row',
  RowReverse: 'row-reverse',
  Column: 'column',
  ColumnReverse: 'column-reverse',
} as const
// LayoutFlexDirection 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutFlexDirection =
  (typeof LayoutFlexDirection)[keyof typeof LayoutFlexDirection]

// LayoutAlign 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutAlign = {
  Auto: 'auto',
  Stretch: 'stretch',
  FlexStart: 'flex-start',
  Center: 'center',
  FlexEnd: 'flex-end',
} as const
// LayoutAlign 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutAlign = (typeof LayoutAlign)[keyof typeof LayoutAlign]

// LayoutJustify 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutJustify = {
  FlexStart: 'flex-start',
  Center: 'center',
  FlexEnd: 'flex-end',
  SpaceBetween: 'space-between',
  SpaceAround: 'space-around',
  SpaceEvenly: 'space-evenly',
} as const
// LayoutJustify 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutJustify = (typeof LayoutJustify)[keyof typeof LayoutJustify]

// LayoutWrap 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutWrap = {
  NoWrap: 'nowrap',
  Wrap: 'wrap',
  WrapReverse: 'wrap-reverse',
} as const
// LayoutWrap 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutWrap = (typeof LayoutWrap)[keyof typeof LayoutWrap]

// LayoutPositionType 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutPositionType = {
  Relative: 'relative',
  Absolute: 'absolute',
} as const
// LayoutPositionType 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutPositionType =
  (typeof LayoutPositionType)[keyof typeof LayoutPositionType]

// LayoutOverflow 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutOverflow = {
  Visible: 'visible',
  Hidden: 'hidden',
  Scroll: 'scroll',
} as const
// LayoutOverflow 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutOverflow =
  (typeof LayoutOverflow)[keyof typeof LayoutOverflow]

// LayoutMeasureFunc 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutMeasureFunc = (
  width: number,
  widthMode: LayoutMeasureMode,
) => { width: number; height: number }

// LayoutMeasureMode 集中保存Ink 渲染层 node要一起传递的字段。
export const LayoutMeasureMode = {
  Undefined: 'undefined',
  Exactly: 'exactly',
  AtMost: 'at-most',
} as const
// LayoutMeasureMode 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutMeasureMode =
  (typeof LayoutMeasureMode)[keyof typeof LayoutMeasureMode]

// LayoutNode 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type LayoutNode = {
  // Tree
  insertChild(child: LayoutNode, index: number): void
  removeChild(child: LayoutNode): void
  getChildCount(): number
  // getParent不依赖额外参数，直接计算终端渲染需要的结果。
  getParent(): LayoutNode | null

  // Layout computation
  // calculateLayout 使用 width?: number, height?: number 完成终端渲染里的对应操作。
  calculateLayout(width?: number, height?: number): void
  // setMeasureFunc 根据 fn: LayoutMeasureFunc 更新终端渲染的状态。
  setMeasureFunc(fn: LayoutMeasureFunc): void
  // unsetMeasureFunc 使用 无 完成终端渲染里的对应操作。
  unsetMeasureFunc(): void
  // markDirty 使用 无 完成终端渲染里的对应操作。
  markDirty(): void

  // Layout reading (post-layout)
  // getComputedLeft不依赖额外参数，直接计算终端渲染需要的结果。
  getComputedLeft(): number
  // getComputedTop不依赖额外参数，直接计算终端渲染需要的结果。
  getComputedTop(): number
  // getComputedWidth不依赖额外参数，直接计算终端渲染需要的结果。
  getComputedWidth(): number
  // getComputedHeight不依赖额外参数，直接计算终端渲染需要的结果。
  getComputedHeight(): number
  // getComputedBorder 根据 edge: LayoutEdge 读取或计算终端渲染需要的结果。
  getComputedBorder(edge: LayoutEdge): number
  // getComputedPadding 根据 edge: LayoutEdge 读取或计算终端渲染需要的结果。
  getComputedPadding(edge: LayoutEdge): number

  // Style setters
  // setWidth 根据 value: number 更新终端渲染的状态。
  setWidth(value: number): void
  // setWidthPercent 根据 value: number 更新终端渲染的状态。
  setWidthPercent(value: number): void
  // setWidthAuto 根据 无 更新终端渲染的状态。
  setWidthAuto(): void
  // setHeight 根据 value: number 更新终端渲染的状态。
  setHeight(value: number): void
  // setHeightPercent 根据 value: number 更新终端渲染的状态。
  setHeightPercent(value: number): void
  // setHeightAuto 根据 无 更新终端渲染的状态。
  setHeightAuto(): void
  // setMinWidth 根据 value: number 更新终端渲染的状态。
  setMinWidth(value: number): void
  // setMinWidthPercent 根据 value: number 更新终端渲染的状态。
  setMinWidthPercent(value: number): void
  // setMinHeight 根据 value: number 更新终端渲染的状态。
  setMinHeight(value: number): void
  // setMinHeightPercent 根据 value: number 更新终端渲染的状态。
  setMinHeightPercent(value: number): void
  // setMaxWidth 根据 value: number 更新终端渲染的状态。
  setMaxWidth(value: number): void
  // setMaxWidthPercent 根据 value: number 更新终端渲染的状态。
  setMaxWidthPercent(value: number): void
  // setMaxHeight 根据 value: number 更新终端渲染的状态。
  setMaxHeight(value: number): void
  // setMaxHeightPercent 根据 value: number 更新终端渲染的状态。
  setMaxHeightPercent(value: number): void
  // setFlexDirection 根据 dir: LayoutFlexDirection 更新终端渲染的状态。
  setFlexDirection(dir: LayoutFlexDirection): void
  // setFlexGrow 根据 value: number 更新终端渲染的状态。
  setFlexGrow(value: number): void
  // setFlexShrink 根据 value: number 更新终端渲染的状态。
  setFlexShrink(value: number): void
  // setFlexBasis 根据 value: number 更新终端渲染的状态。
  setFlexBasis(value: number): void
  // setFlexBasisPercent 根据 value: number 更新终端渲染的状态。
  setFlexBasisPercent(value: number): void
  // setFlexWrap 根据 wrap: LayoutWrap 更新终端渲染的状态。
  setFlexWrap(wrap: LayoutWrap): void
  // setAlignItems 根据 align: LayoutAlign 更新终端渲染的状态。
  setAlignItems(align: LayoutAlign): void
  // setAlignSelf 根据 align: LayoutAlign 更新终端渲染的状态。
  setAlignSelf(align: LayoutAlign): void
  // setJustifyContent 根据 justify: LayoutJustify 更新终端渲染的状态。
  setJustifyContent(justify: LayoutJustify): void
  // setDisplay 根据 display: LayoutDisplay 更新终端渲染的状态。
  setDisplay(display: LayoutDisplay): void
  // getDisplay不依赖额外参数，直接计算终端渲染需要的结果。
  getDisplay(): LayoutDisplay
  // setPositionType 根据 type: LayoutPositionType 更新终端渲染的状态。
  setPositionType(type: LayoutPositionType): void
  // setPosition 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setPosition(edge: LayoutEdge, value: number): void
  // setPositionPercent 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setPositionPercent(edge: LayoutEdge, value: number): void
  // setOverflow 根据 overflow: LayoutOverflow 更新终端渲染的状态。
  setOverflow(overflow: LayoutOverflow): void
  // setMargin 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setMargin(edge: LayoutEdge, value: number): void
  // setPadding 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setPadding(edge: LayoutEdge, value: number): void
  // setBorder 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setBorder(edge: LayoutEdge, value: number): void
  // setGap 根据 gutter: LayoutGutter, value: number 更新终端渲染的状态。
  setGap(gutter: LayoutGutter, value: number): void

  // Lifecycle
  // free 使用 无 完成终端渲染里的对应操作。
  free(): void
  // freeRecursive 使用 无 完成终端渲染里的对应操作。
  freeRecursive(): void
}

// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import Yoga, {
  Align,
  Direction,
  Display,
  Edge,
  FlexDirection,
  Gutter,
  Justify,
  MeasureMode,
  Overflow,
  PositionType,
  Wrap,
  // Node 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
  type Node as YogaNode,
} from 'src/native-ts/yoga-layout/index.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type LayoutAlign,
  LayoutDisplay,
  type LayoutEdge,
  type LayoutFlexDirection,
  type LayoutGutter,
  type LayoutJustify,
  type LayoutMeasureFunc,
  LayoutMeasureMode,
  type LayoutNode,
  type LayoutOverflow,
  type LayoutPositionType,
  type LayoutWrap,
} from './node.js'

// --
// Edge/Gutter mapping

// EDGE_MAP 集中保存Ink 渲染层 yoga要一起传递的字段。
const EDGE_MAP: Record<LayoutEdge, Edge> = {
  all: Edge.All,
  horizontal: Edge.Horizontal,
  vertical: Edge.Vertical,
  left: Edge.Left,
  right: Edge.Right,
  top: Edge.Top,
  bottom: Edge.Bottom,
  start: Edge.Start,
  end: Edge.End,
}

// GUTTER_MAP 集中保存Ink 渲染层 yoga要一起传递的字段。
const GUTTER_MAP: Record<LayoutGutter, Gutter> = {
  all: Gutter.All,
  column: Gutter.Column,
  row: Gutter.Row,
}

// --
// Yoga adapter

// YogaLayoutNode 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class YogaLayoutNode implements LayoutNode {
  readonly yoga: YogaNode

  // 构造函数接收 yoga: YogaNode，把外部输入整理成实例可复用的内部状态。
  constructor(yoga: YogaNode) {
    // 更新实例字段 yoga 为 yoga，同步终端渲染的内部状态。
    this.yoga = yoga
  }

  // Tree

  // insertChild 使用 child: LayoutNode, index: number 完成终端渲染里的对应操作。
  insertChild(child: LayoutNode, index: number): void {
    // 调用 this.yoga.insertChild，触发终端渲染此处需要的副作用。
    this.yoga.insertChild((child as YogaLayoutNode).yoga, index)
  }

  // removeChild 使用 child: LayoutNode 完成终端渲染里的对应操作。
  removeChild(child: LayoutNode): void {
    // 调用 this.yoga.removeChild，触发终端渲染此处需要的副作用。
    this.yoga.removeChild((child as YogaLayoutNode).yoga)
  }

  // getChildCount不依赖额外参数，直接计算终端渲染需要的结果。
  getChildCount(): number {
    // 返回 `this.yoga.getChildCount()`，作为终端渲染这次计算的结果。
    return this.yoga.getChildCount()
  }

  // getParent不依赖额外参数，直接计算终端渲染需要的结果。
  getParent(): LayoutNode | null {
    // p读取`yoga.getParent`，供终端渲染后续处理使用。
    const p = this.yoga.getParent()
    // 返回 `p ? new YogaLayoutNode(p) : null`，作为终端渲染这次计算的结果。
    return p ? new YogaLayoutNode(p) : null
  }

  // Layout

  // calculateLayout 使用 width?: number, _height?: number 完成终端渲染里的对应操作。
  calculateLayout(width?: number, _height?: number): void {
    // 调用 this.yoga.calculateLayout，触发终端渲染此处需要的副作用。
    this.yoga.calculateLayout(width, undefined, Direction.LTR)
  }

  // setMeasureFunc 根据 fn: LayoutMeasureFunc 更新终端渲染的状态。
  setMeasureFunc(fn: LayoutMeasureFunc): void {
    // this.yoga.setMeasureFunc 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMeasureFunc((w, wMode) => {
      // mode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const mode =
        wMode === MeasureMode.Exactly
          ? LayoutMeasureMode.Exactly
          : wMode === MeasureMode.AtMost
            ? LayoutMeasureMode.AtMost
            : LayoutMeasureMode.Undefined
      // 返回 `fn(w, mode)`，作为终端渲染这次计算的结果。
      return fn(w, mode)
    })
  }

  // unsetMeasureFunc 使用 无 完成终端渲染里的对应操作。
  unsetMeasureFunc(): void {
    // 调用 this.yoga.unsetMeasureFunc，触发终端渲染此处需要的副作用。
    this.yoga.unsetMeasureFunc()
  }

  // markDirty 使用 无 完成终端渲染里的对应操作。
  markDirty(): void {
    // 调用 this.yoga.markDirty，触发终端渲染此处需要的副作用。
    this.yoga.markDirty()
  }

  // Computed layout

  // getComputedLeft不依赖额外参数，直接计算终端渲染需要的结果。
  getComputedLeft(): number {
    // 返回 `this.yoga.getComputedLeft()`，作为终端渲染这次计算的结果。
    return this.yoga.getComputedLeft()
  }

  // getComputedTop不依赖额外参数，直接计算终端渲染需要的结果。
  getComputedTop(): number {
    // 返回 `this.yoga.getComputedTop()`，作为终端渲染这次计算的结果。
    return this.yoga.getComputedTop()
  }

  // getComputedWidth不依赖额外参数，直接计算终端渲染需要的结果。
  getComputedWidth(): number {
    // 返回 `this.yoga.getComputedWidth()`，作为终端渲染这次计算的结果。
    return this.yoga.getComputedWidth()
  }

  // getComputedHeight不依赖额外参数，直接计算终端渲染需要的结果。
  getComputedHeight(): number {
    // 返回 `this.yoga.getComputedHeight()`，作为终端渲染这次计算的结果。
    return this.yoga.getComputedHeight()
  }

  // getComputedBorder 根据 edge: LayoutEdge 读取或计算终端渲染需要的结果。
  getComputedBorder(edge: LayoutEdge): number {
    // 返回 `this.yoga.getComputedBorder(EDGE_MAP[edge]!)`，作为终端渲染这次计算的结果。
    return this.yoga.getComputedBorder(EDGE_MAP[edge]!)
  }

  // getComputedPadding 根据 edge: LayoutEdge 读取或计算终端渲染需要的结果。
  getComputedPadding(edge: LayoutEdge): number {
    // 返回 `this.yoga.getComputedPadding(EDGE_MAP[edge]!)`，作为终端渲染这次计算的结果。
    return this.yoga.getComputedPadding(EDGE_MAP[edge]!)
  }

  // Style setters

  // setWidth 根据 value: number 更新终端渲染的状态。
  setWidth(value: number): void {
    // this.yoga.setWidth 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setWidth(value)
  }
  // setWidthPercent 根据 value: number 更新终端渲染的状态。
  setWidthPercent(value: number): void {
    // this.yoga.setWidthPercent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setWidthPercent(value)
  }
  // setWidthAuto 根据 无 更新终端渲染的状态。
  setWidthAuto(): void {
    // this.yoga.setWidthAuto 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setWidthAuto()
  }
  // setHeight 根据 value: number 更新终端渲染的状态。
  setHeight(value: number): void {
    // this.yoga.setHeight 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setHeight(value)
  }
  // setHeightPercent 根据 value: number 更新终端渲染的状态。
  setHeightPercent(value: number): void {
    // this.yoga.setHeightPercent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setHeightPercent(value)
  }
  // setHeightAuto 根据 无 更新终端渲染的状态。
  setHeightAuto(): void {
    // this.yoga.setHeightAuto 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setHeightAuto()
  }
  // setMinWidth 根据 value: number 更新终端渲染的状态。
  setMinWidth(value: number): void {
    // this.yoga.setMinWidth 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMinWidth(value)
  }
  // setMinWidthPercent 根据 value: number 更新终端渲染的状态。
  setMinWidthPercent(value: number): void {
    // this.yoga.setMinWidthPercent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMinWidthPercent(value)
  }
  // setMinHeight 根据 value: number 更新终端渲染的状态。
  setMinHeight(value: number): void {
    // this.yoga.setMinHeight 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMinHeight(value)
  }
  // setMinHeightPercent 根据 value: number 更新终端渲染的状态。
  setMinHeightPercent(value: number): void {
    // this.yoga.setMinHeightPercent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMinHeightPercent(value)
  }
  // setMaxWidth 根据 value: number 更新终端渲染的状态。
  setMaxWidth(value: number): void {
    // this.yoga.setMaxWidth 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMaxWidth(value)
  }
  // setMaxWidthPercent 根据 value: number 更新终端渲染的状态。
  setMaxWidthPercent(value: number): void {
    // this.yoga.setMaxWidthPercent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMaxWidthPercent(value)
  }
  // setMaxHeight 根据 value: number 更新终端渲染的状态。
  setMaxHeight(value: number): void {
    // this.yoga.setMaxHeight 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMaxHeight(value)
  }
  // setMaxHeightPercent 根据 value: number 更新终端渲染的状态。
  setMaxHeightPercent(value: number): void {
    // this.yoga.setMaxHeightPercent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMaxHeightPercent(value)
  }

  // setFlexDirection 根据 dir: LayoutFlexDirection 更新终端渲染的状态。
  setFlexDirection(dir: LayoutFlexDirection): void {
    // map 集中保存Ink 渲染层 yoga要一起传递的字段。
    const map: Record<LayoutFlexDirection, FlexDirection> = {
      row: FlexDirection.Row,
      'row-reverse': FlexDirection.RowReverse,
      column: FlexDirection.Column,
      'column-reverse': FlexDirection.ColumnReverse,
    }
    // this.yoga.setFlexDirection 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setFlexDirection(map[dir]!)
  }

  // setFlexGrow 根据 value: number 更新终端渲染的状态。
  setFlexGrow(value: number): void {
    // this.yoga.setFlexGrow 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setFlexGrow(value)
  }
  // setFlexShrink 根据 value: number 更新终端渲染的状态。
  setFlexShrink(value: number): void {
    // this.yoga.setFlexShrink 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setFlexShrink(value)
  }
  // setFlexBasis 根据 value: number 更新终端渲染的状态。
  setFlexBasis(value: number): void {
    // this.yoga.setFlexBasis 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setFlexBasis(value)
  }
  // setFlexBasisPercent 根据 value: number 更新终端渲染的状态。
  setFlexBasisPercent(value: number): void {
    // this.yoga.setFlexBasisPercent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setFlexBasisPercent(value)
  }

  // setFlexWrap 根据 wrap: LayoutWrap 更新终端渲染的状态。
  setFlexWrap(wrap: LayoutWrap): void {
    // map 集中保存Ink 渲染层 yoga要一起传递的字段。
    const map: Record<LayoutWrap, Wrap> = {
      nowrap: Wrap.NoWrap,
      wrap: Wrap.Wrap,
      'wrap-reverse': Wrap.WrapReverse,
    }
    // this.yoga.setFlexWrap 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setFlexWrap(map[wrap]!)
  }

  // setAlignItems 根据 align: LayoutAlign 更新终端渲染的状态。
  setAlignItems(align: LayoutAlign): void {
    // map 集中保存Ink 渲染层 yoga要一起传递的字段。
    const map: Record<LayoutAlign, Align> = {
      auto: Align.Auto,
      stretch: Align.Stretch,
      'flex-start': Align.FlexStart,
      center: Align.Center,
      'flex-end': Align.FlexEnd,
    }
    // this.yoga.setAlignItems 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setAlignItems(map[align]!)
  }

  // setAlignSelf 根据 align: LayoutAlign 更新终端渲染的状态。
  setAlignSelf(align: LayoutAlign): void {
    // map 集中保存Ink 渲染层 yoga要一起传递的字段。
    const map: Record<LayoutAlign, Align> = {
      auto: Align.Auto,
      stretch: Align.Stretch,
      'flex-start': Align.FlexStart,
      center: Align.Center,
      'flex-end': Align.FlexEnd,
    }
    // this.yoga.setAlignSelf 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setAlignSelf(map[align]!)
  }

  // setJustifyContent 根据 justify: LayoutJustify 更新终端渲染的状态。
  setJustifyContent(justify: LayoutJustify): void {
    // map 集中保存Ink 渲染层 yoga要一起传递的字段。
    const map: Record<LayoutJustify, Justify> = {
      'flex-start': Justify.FlexStart,
      center: Justify.Center,
      'flex-end': Justify.FlexEnd,
      'space-between': Justify.SpaceBetween,
      'space-around': Justify.SpaceAround,
      'space-evenly': Justify.SpaceEvenly,
    }
    // this.yoga.setJustifyContent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setJustifyContent(map[justify]!)
  }

  // setDisplay 根据 display: LayoutDisplay 更新终端渲染的状态。
  setDisplay(display: LayoutDisplay): void {
    // this.yoga.setDisplay 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setDisplay(display === 'flex' ? Display.Flex : Display.None)
  }

  // getDisplay不依赖额外参数，直接计算终端渲染需要的结果。
  getDisplay(): LayoutDisplay {
    // 返回 `this.yoga.getDisplay() === Display.None`，作为终端渲染这次计算的结果。
    return this.yoga.getDisplay() === Display.None
      ? LayoutDisplay.None
      : LayoutDisplay.Flex
  }

  // setPositionType 根据 type: LayoutPositionType 更新终端渲染的状态。
  setPositionType(type: LayoutPositionType): void {
    // this.yoga.setPositionType 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setPositionType(
      type === 'absolute' ? PositionType.Absolute : PositionType.Relative,
    )
  }

  // setPosition 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setPosition(edge: LayoutEdge, value: number): void {
    // this.yoga.setPosition 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setPosition(EDGE_MAP[edge]!, value)
  }

  // setPositionPercent 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setPositionPercent(edge: LayoutEdge, value: number): void {
    // this.yoga.setPositionPercent 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setPositionPercent(EDGE_MAP[edge]!, value)
  }

  // setOverflow 根据 overflow: LayoutOverflow 更新终端渲染的状态。
  setOverflow(overflow: LayoutOverflow): void {
    // map 集中保存Ink 渲染层 yoga要一起传递的字段。
    const map: Record<LayoutOverflow, Overflow> = {
      visible: Overflow.Visible,
      hidden: Overflow.Hidden,
      scroll: Overflow.Scroll,
    }
    // this.yoga.setOverflow 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setOverflow(map[overflow]!)
  }

  // setMargin 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setMargin(edge: LayoutEdge, value: number): void {
    // this.yoga.setMargin 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setMargin(EDGE_MAP[edge]!, value)
  }
  // setPadding 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setPadding(edge: LayoutEdge, value: number): void {
    // this.yoga.setPadding 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setPadding(EDGE_MAP[edge]!, value)
  }
  // setBorder 根据 edge: LayoutEdge, value: number 更新终端渲染的状态。
  setBorder(edge: LayoutEdge, value: number): void {
    // this.yoga.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setBorder(EDGE_MAP[edge]!, value)
  }
  // setGap 根据 gutter: LayoutGutter, value: number 更新终端渲染的状态。
  setGap(gutter: LayoutGutter, value: number): void {
    // this.yoga.setGap 写入新的状态值，使终端渲染后续读取保持一致。
    this.yoga.setGap(GUTTER_MAP[gutter]!, value)
  }

  // Lifecycle

  // free 使用 无 完成终端渲染里的对应操作。
  free(): void {
    // 调用 this.yoga.free，触发终端渲染此处需要的副作用。
    this.yoga.free()
  }
  // freeRecursive 使用 无 完成终端渲染里的对应操作。
  freeRecursive(): void {
    // 调用 this.yoga.freeRecursive，触发终端渲染此处需要的副作用。
    this.yoga.freeRecursive()
  }
}

// --
// Instance management
//
// The TS yoga-layout port is synchronous — no WASM loading, no linear memory
// growth, so no preload/swap/reset machinery is needed. The Yoga instance is
// just a plain JS object available at import time.

// createYogaLayoutNode 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createYogaLayoutNode(): LayoutNode {
  // 返回 `new YogaLayoutNode(Yoga.Node.create())`，作为终端渲染这次计算的结果。
  return new YogaLayoutNode(Yoga.Node.create())
}

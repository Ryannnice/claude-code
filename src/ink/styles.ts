// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  LayoutAlign,
  LayoutDisplay,
  LayoutEdge,
  LayoutFlexDirection,
  LayoutGutter,
  LayoutJustify,
  type LayoutNode,
  LayoutOverflow,
  LayoutPositionType,
  LayoutWrap,
} from './layout/node.js'
// 类型依赖 { BorderStyle, BorderTextOptions } 来自 ./render-border.js，用于校准终端渲染的数据契约。
import type { BorderStyle, BorderTextOptions } from './render-border.js'

// RGBColor 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type RGBColor = `rgb(${number},${number},${number})`
// HexColor 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type HexColor = `#${string}`
// Ansi256Color 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Ansi256Color = `ansi256(${number})`
// AnsiColor 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnsiColor =
  | 'ansi:black'
  | 'ansi:red'
  | 'ansi:green'
  | 'ansi:yellow'
  | 'ansi:blue'
  | 'ansi:magenta'
  | 'ansi:cyan'
  | 'ansi:white'
  | 'ansi:blackBright'
  | 'ansi:redBright'
  | 'ansi:greenBright'
  | 'ansi:yellowBright'
  | 'ansi:blueBright'
  | 'ansi:magentaBright'
  | 'ansi:cyanBright'
  | 'ansi:whiteBright'

/** Raw color value - not a theme key */
// Color 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Color = RGBColor | HexColor | Ansi256Color | AnsiColor

/**
 * Structured text styling properties.
 * Used to style text without relying on ANSI string transforms.
 * Colors are raw values - theme resolution happens at the component layer.
 */
// TextStyles 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextStyles = {
  readonly color?: Color
  readonly backgroundColor?: Color
  readonly dim?: boolean
  readonly bold?: boolean
  readonly italic?: boolean
  readonly underline?: boolean
  readonly strikethrough?: boolean
  readonly inverse?: boolean
}

// Styles 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Styles = {
  readonly textWrap?:
    | 'wrap'
    | 'wrap-trim'
    | 'end'
    | 'middle'
    | 'truncate-end'
    | 'truncate'
    | 'truncate-middle'
    | 'truncate-start'

  readonly position?: 'absolute' | 'relative'
  readonly top?: number | `${number}%`
  readonly bottom?: number | `${number}%`
  readonly left?: number | `${number}%`
  readonly right?: number | `${number}%`

  /**
   * Size of the gap between an element's columns.
   */
  readonly columnGap?: number

  /**
   * Size of the gap between element's rows.
   */
  readonly rowGap?: number

  /**
   * Size of the gap between an element's columns and rows. Shorthand for `columnGap` and `rowGap`.
   */
  readonly gap?: number

  /**
   * Margin on all sides. Equivalent to setting `marginTop`, `marginBottom`, `marginLeft` and `marginRight`.
   */
  readonly margin?: number

  /**
   * Horizontal margin. Equivalent to setting `marginLeft` and `marginRight`.
   */
  readonly marginX?: number

  /**
   * Vertical margin. Equivalent to setting `marginTop` and `marginBottom`.
   */
  readonly marginY?: number

  /**
   * Top margin.
   */
  readonly marginTop?: number

  /**
   * Bottom margin.
   */
  readonly marginBottom?: number

  /**
   * Left margin.
   */
  readonly marginLeft?: number

  /**
   * Right margin.
   */
  readonly marginRight?: number

  /**
   * Padding on all sides. Equivalent to setting `paddingTop`, `paddingBottom`, `paddingLeft` and `paddingRight`.
   */
  readonly padding?: number

  /**
   * Horizontal padding. Equivalent to setting `paddingLeft` and `paddingRight`.
   */
  readonly paddingX?: number

  /**
   * Vertical padding. Equivalent to setting `paddingTop` and `paddingBottom`.
   */
  readonly paddingY?: number

  /**
   * Top padding.
   */
  readonly paddingTop?: number

  /**
   * Bottom padding.
   */
  readonly paddingBottom?: number

  /**
   * Left padding.
   */
  readonly paddingLeft?: number

  /**
   * Right padding.
   */
  readonly paddingRight?: number

  /**
   * This property defines the ability for a flex item to grow if necessary.
   * See [flex-grow](https://css-tricks.com/almanac/properties/f/flex-grow/).
   */
  readonly flexGrow?: number

  /**
   * It specifies the “flex shrink factor”, which determines how much the flex item will shrink relative to the rest of the flex items in the flex container when there isn’t enough space on the row.
   * See [flex-shrink](https://css-tricks.com/almanac/properties/f/flex-shrink/).
   */
  readonly flexShrink?: number

  /**
   * It establishes the main-axis, thus defining the direction flex items are placed in the flex container.
   * See [flex-direction](https://css-tricks.com/almanac/properties/f/flex-direction/).
   */
  readonly flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'

  /**
   * It specifies the initial size of the flex item, before any available space is distributed according to the flex factors.
   * See [flex-basis](https://css-tricks.com/almanac/properties/f/flex-basis/).
   */
  readonly flexBasis?: number | string

  /**
   * It defines whether the flex items are forced in a single line or can be flowed into multiple lines. If set to multiple lines, it also defines the cross-axis which determines the direction new lines are stacked in.
   * See [flex-wrap](https://css-tricks.com/almanac/properties/f/flex-wrap/).
   */
  readonly flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'

  /**
   * The align-items property defines the default behavior for how items are laid out along the cross axis (perpendicular to the main axis).
   * See [align-items](https://css-tricks.com/almanac/properties/a/align-items/).
   */
  readonly alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'

  /**
   * It makes possible to override the align-items value for specific flex items.
   * See [align-self](https://css-tricks.com/almanac/properties/a/align-self/).
   */
  readonly alignSelf?: 'flex-start' | 'center' | 'flex-end' | 'auto'

  /**
   * It defines the alignment along the main axis.
   * See [justify-content](https://css-tricks.com/almanac/properties/j/justify-content/).
   */
  readonly justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'center'

  /**
   * Width of the element in spaces.
   * You can also set it in percent, which will calculate the width based on the width of parent element.
   */
  readonly width?: number | string

  /**
   * Height of the element in lines (rows).
   * You can also set it in percent, which will calculate the height based on the height of parent element.
   */
  readonly height?: number | string

  /**
   * Sets a minimum width of the element.
   */
  readonly minWidth?: number | string

  /**
   * Sets a minimum height of the element.
   */
  readonly minHeight?: number | string

  /**
   * Sets a maximum width of the element.
   */
  readonly maxWidth?: number | string

  /**
   * Sets a maximum height of the element.
   */
  readonly maxHeight?: number | string

  /**
   * Set this property to `none` to hide the element.
   */
  readonly display?: 'flex' | 'none'

  /**
   * Add a border with a specified style.
   * If `borderStyle` is `undefined` (which it is by default), no border will be added.
   */
  readonly borderStyle?: BorderStyle

  /**
   * Determines whether top border is visible.
   *
   * @default true
   */
  readonly borderTop?: boolean

  /**
   * Determines whether bottom border is visible.
   *
   * @default true
   */
  readonly borderBottom?: boolean

  /**
   * Determines whether left border is visible.
   *
   * @default true
   */
  readonly borderLeft?: boolean

  /**
   * Determines whether right border is visible.
   *
   * @default true
   */
  readonly borderRight?: boolean

  /**
   * Change border color.
   * Shorthand for setting `borderTopColor`, `borderRightColor`, `borderBottomColor` and `borderLeftColor`.
   */
  readonly borderColor?: Color

  /**
   * Change top border color.
   * Accepts raw color values (rgb, hex, ansi).
   */
  readonly borderTopColor?: Color

  /**
   * Change bottom border color.
   * Accepts raw color values (rgb, hex, ansi).
   */
  readonly borderBottomColor?: Color

  /**
   * Change left border color.
   * Accepts raw color values (rgb, hex, ansi).
   */
  readonly borderLeftColor?: Color

  /**
   * Change right border color.
   * Accepts raw color values (rgb, hex, ansi).
   */
  readonly borderRightColor?: Color

  /**
   * Dim the border color.
   * Shorthand for setting `borderTopDimColor`, `borderBottomDimColor`, `borderLeftDimColor` and `borderRightDimColor`.
   *
   * @default false
   */
  readonly borderDimColor?: boolean

  /**
   * Dim the top border color.
   *
   * @default false
   */
  readonly borderTopDimColor?: boolean

  /**
   * Dim the bottom border color.
   *
   * @default false
   */
  readonly borderBottomDimColor?: boolean

  /**
   * Dim the left border color.
   *
   * @default false
   */
  readonly borderLeftDimColor?: boolean

  /**
   * Dim the right border color.
   *
   * @default false
   */
  readonly borderRightDimColor?: boolean

  /**
   * Add text within the border. Only applies to top or bottom borders.
   */
  readonly borderText?: BorderTextOptions

  /**
   * Background color for the box. Fills the interior with background-colored
   * spaces and is inherited by child text nodes as their default background.
   */
  readonly backgroundColor?: Color

  /**
   * Fill the box's interior (padding included) with spaces before
   * rendering children, so nothing behind it shows through. Like
   * `backgroundColor` but without emitting any SGR — the terminal's
   * default background is used. Useful for absolute-positioned overlays
   * where Box padding/gaps would otherwise be transparent.
   */
  readonly opaque?: boolean

  /**
   * Behavior for an element's overflow in both directions.
   * 'scroll' constrains the container's size (children do not expand it)
   * and enables scrollTop-based virtualized scrolling at render time.
   *
   * @default 'visible'
   */
  readonly overflow?: 'visible' | 'hidden' | 'scroll'

  /**
   * Behavior for an element's overflow in horizontal direction.
   *
   * @default 'visible'
   */
  readonly overflowX?: 'visible' | 'hidden' | 'scroll'

  /**
   * Behavior for an element's overflow in vertical direction.
   *
   * @default 'visible'
   */
  readonly overflowY?: 'visible' | 'hidden' | 'scroll'

  /**
   * Exclude this box's cells from text selection in fullscreen mode.
   * Cells inside this region are skipped by both the selection highlight
   * and the copied text — useful for fencing off gutters (line numbers,
   * diff sigils) so click-drag over a diff yields clean copyable code.
   * Only affects alt-screen text selection; no-op otherwise.
   *
   * `'from-left-edge'` extends the exclusion from column 0 to the box's
   * right edge for every row it occupies — this covers any upstream
   * indentation (tool message prefix, tree lines) so a multi-row drag
   * doesn't pick up leading whitespace from middle rows.
   */
  readonly noSelect?: boolean | 'from-left-edge'
}

// applyPositionStyles 集合封装成回调，供Ink 渲染层 styles在事件触发或异步步骤中调用。
const applyPositionStyles = (node: LayoutNode, style: Styles): void => {
  // 满足 `'position' in style` 时，终端渲染执行该分支。
  if ('position' in style) {
    // node.setPositionType 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPositionType(
      style.position === 'absolute'
        ? LayoutPositionType.Absolute
        : LayoutPositionType.Relative,
    )
  }
  // 满足 `'top' in style) applyPositionEdge(node, 'top', style.top` 时，终端渲染执行该分支。
  if ('top' in style) applyPositionEdge(node, 'top', style.top)
  // 满足 `'bottom' in style) applyPositionEdge(node, 'bottom', style.bottom` 时，终端渲染执行该分支。
  if ('bottom' in style) applyPositionEdge(node, 'bottom', style.bottom)
  // 满足 `'left' in style) applyPositionEdge(node, 'left', style.left` 时，终端渲染执行该分支。
  if ('left' in style) applyPositionEdge(node, 'left', style.left)
  // 满足 `'right' in style) applyPositionEdge(node, 'right', style.right` 时，终端渲染执行该分支。
  if ('right' in style) applyPositionEdge(node, 'right', style.right)
}

// applyPositionEdge 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyPositionEdge(
  node: LayoutNode,
  edge: 'top' | 'bottom' | 'left' | 'right',
  v: number | `${number}%` | undefined,
): void {
  // 当 `typeof v` 匹配 `'string'` 时，终端渲染执行对应分支。
  if (typeof v === 'string') {
    // node.setPositionPercent 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPositionPercent(edge, Number.parseInt(v, 10))
  // Ink 渲染层 styles在这里处理 `} else if (typeof v === 'number') {`，完成这一小步状态转换。
  } else if (typeof v === 'number') {
    // node.setPosition 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPosition(edge, v)
  } else {
    // node.setPosition 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPosition(edge, Number.NaN)
  }
}

// applyOverflowStyles 集合封装成回调，供Ink 渲染层 styles在事件触发或异步步骤中调用。
const applyOverflowStyles = (node: LayoutNode, style: Styles): void => {
  // Yoga's Overflow controls whether children expand the container.
  // 'hidden' and 'scroll' both prevent expansion; 'scroll' additionally
  // signals that the renderer should apply scrollTop translation.
  // overflowX/Y are render-time concerns; for layout we use the union.
  // y 命名 `style.overflowY ?? style.overflow`，让后续代码直接表达这个值的用途。
  const y = style.overflowY ?? style.overflow
  // x保存`style.overflowX ?? style.overflow`，供后续判断或组装使用。
  const x = style.overflowX ?? style.overflow
  // 当 `y` 匹配 `'scroll' || x === 'scroll'` 时，终端渲染执行对应分支。
  if (y === 'scroll' || x === 'scroll') {
    // node.setOverflow 写入新的状态值，使终端渲染后续读取保持一致。
    node.setOverflow(LayoutOverflow.Scroll)
  // Ink 渲染层 styles在这里处理 `} else if (y === 'hidden' || x === 'hidden') {`，完成这一小步状态转换。
  } else if (y === 'hidden' || x === 'hidden') {
    // node.setOverflow 写入新的状态值，使终端渲染后续读取保持一致。
    node.setOverflow(LayoutOverflow.Hidden)
  // Ink 渲染层 styles在这里处理 `} else if (`，完成这一小步状态转换。
  } else if (
    'overflow' in style ||
    'overflowX' in style ||
    'overflowY' in style
  ) {
    // node.setOverflow 写入新的状态值，使终端渲染后续读取保持一致。
    node.setOverflow(LayoutOverflow.Visible)
  }
}

// applyMarginStyles 集合封装成回调，供Ink 渲染层 styles在事件触发或异步步骤中调用。
const applyMarginStyles = (node: LayoutNode, style: Styles): void => {
  // 满足 `'margin' in style` 时，终端渲染执行该分支。
  if ('margin' in style) {
    // node.setMargin 写入新的状态值，使终端渲染后续读取保持一致。
    node.setMargin(LayoutEdge.All, style.margin ?? 0)
  }

  // 满足 `'marginX' in style` 时，终端渲染执行该分支。
  if ('marginX' in style) {
    // node.setMargin 写入新的状态值，使终端渲染后续读取保持一致。
    node.setMargin(LayoutEdge.Horizontal, style.marginX ?? 0)
  }

  // 满足 `'marginY' in style` 时，终端渲染执行该分支。
  if ('marginY' in style) {
    // node.setMargin 写入新的状态值，使终端渲染后续读取保持一致。
    node.setMargin(LayoutEdge.Vertical, style.marginY ?? 0)
  }

  // 满足 `'marginLeft' in style` 时，终端渲染执行该分支。
  if ('marginLeft' in style) {
    // node.setMargin 写入新的状态值，使终端渲染后续读取保持一致。
    node.setMargin(LayoutEdge.Start, style.marginLeft || 0)
  }

  // 满足 `'marginRight' in style` 时，终端渲染执行该分支。
  if ('marginRight' in style) {
    // node.setMargin 写入新的状态值，使终端渲染后续读取保持一致。
    node.setMargin(LayoutEdge.End, style.marginRight || 0)
  }

  // 满足 `'marginTop' in style` 时，终端渲染执行该分支。
  if ('marginTop' in style) {
    // node.setMargin 写入新的状态值，使终端渲染后续读取保持一致。
    node.setMargin(LayoutEdge.Top, style.marginTop || 0)
  }

  // 满足 `'marginBottom' in style` 时，终端渲染执行该分支。
  if ('marginBottom' in style) {
    // node.setMargin 写入新的状态值，使终端渲染后续读取保持一致。
    node.setMargin(LayoutEdge.Bottom, style.marginBottom || 0)
  }
}

// applyPaddingStyles 集合封装成回调，供Ink 渲染层 styles在事件触发或异步步骤中调用。
const applyPaddingStyles = (node: LayoutNode, style: Styles): void => {
  // 满足 `'padding' in style` 时，终端渲染执行该分支。
  if ('padding' in style) {
    // node.setPadding 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPadding(LayoutEdge.All, style.padding ?? 0)
  }

  // 满足 `'paddingX' in style` 时，终端渲染执行该分支。
  if ('paddingX' in style) {
    // node.setPadding 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPadding(LayoutEdge.Horizontal, style.paddingX ?? 0)
  }

  // 满足 `'paddingY' in style` 时，终端渲染执行该分支。
  if ('paddingY' in style) {
    // node.setPadding 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPadding(LayoutEdge.Vertical, style.paddingY ?? 0)
  }

  // 满足 `'paddingLeft' in style` 时，终端渲染执行该分支。
  if ('paddingLeft' in style) {
    // node.setPadding 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPadding(LayoutEdge.Left, style.paddingLeft || 0)
  }

  // 满足 `'paddingRight' in style` 时，终端渲染执行该分支。
  if ('paddingRight' in style) {
    // node.setPadding 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPadding(LayoutEdge.Right, style.paddingRight || 0)
  }

  // 满足 `'paddingTop' in style` 时，终端渲染执行该分支。
  if ('paddingTop' in style) {
    // node.setPadding 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPadding(LayoutEdge.Top, style.paddingTop || 0)
  }

  // 满足 `'paddingBottom' in style` 时，终端渲染执行该分支。
  if ('paddingBottom' in style) {
    // node.setPadding 写入新的状态值，使终端渲染后续读取保持一致。
    node.setPadding(LayoutEdge.Bottom, style.paddingBottom || 0)
  }
}

// applyFlexStyles 集合封装成回调，供Ink 渲染层 styles在事件触发或异步步骤中调用。
const applyFlexStyles = (node: LayoutNode, style: Styles): void => {
  // 满足 `'flexGrow' in style` 时，终端渲染执行该分支。
  if ('flexGrow' in style) {
    // node.setFlexGrow 写入新的状态值，使终端渲染后续读取保持一致。
    node.setFlexGrow(style.flexGrow ?? 0)
  }

  // 满足 `'flexShrink' in style` 时，终端渲染执行该分支。
  if ('flexShrink' in style) {
    // node.setFlexShrink 写入新的状态值，使终端渲染后续读取保持一致。
    node.setFlexShrink(
      typeof style.flexShrink === 'number' ? style.flexShrink : 1,
    )
  }

  // 满足 `'flexWrap' in style` 时，终端渲染执行该分支。
  if ('flexWrap' in style) {
    // 当 `style.flexWrap` 匹配 `'nowrap'` 时，终端渲染执行对应分支。
    if (style.flexWrap === 'nowrap') {
      // node.setFlexWrap 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexWrap(LayoutWrap.NoWrap)
    }

    // 当 `style.flexWrap` 匹配 `'wrap'` 时，终端渲染执行对应分支。
    if (style.flexWrap === 'wrap') {
      // node.setFlexWrap 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexWrap(LayoutWrap.Wrap)
    }

    // 当 `style.flexWrap` 匹配 `'wrap-reverse'` 时，终端渲染执行对应分支。
    if (style.flexWrap === 'wrap-reverse') {
      // node.setFlexWrap 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexWrap(LayoutWrap.WrapReverse)
    }
  }

  // 满足 `'flexDirection' in style` 时，终端渲染执行该分支。
  if ('flexDirection' in style) {
    // 当 `style.flexDirection` 匹配 `'row'` 时，终端渲染执行对应分支。
    if (style.flexDirection === 'row') {
      // node.setFlexDirection 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexDirection(LayoutFlexDirection.Row)
    }

    // 当 `style.flexDirection` 匹配 `'row-reverse'` 时，终端渲染执行对应分支。
    if (style.flexDirection === 'row-reverse') {
      // node.setFlexDirection 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexDirection(LayoutFlexDirection.RowReverse)
    }

    // 当 `style.flexDirection` 匹配 `'column'` 时，终端渲染执行对应分支。
    if (style.flexDirection === 'column') {
      // node.setFlexDirection 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexDirection(LayoutFlexDirection.Column)
    }

    // 当 `style.flexDirection` 匹配 `'column-reverse'` 时，终端渲染执行对应分支。
    if (style.flexDirection === 'column-reverse') {
      // node.setFlexDirection 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexDirection(LayoutFlexDirection.ColumnReverse)
    }
  }

  // 满足 `'flexBasis' in style` 时，终端渲染执行该分支。
  if ('flexBasis' in style) {
    // 当 `typeof style.flexBasis` 匹配 `'number'` 时，终端渲染执行对应分支。
    if (typeof style.flexBasis === 'number') {
      // node.setFlexBasis 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexBasis(style.flexBasis)
    // Ink 渲染层 styles在这里处理 `} else if (typeof style.flexBasis === 'string') {`，完成这一小步状态转换。
    } else if (typeof style.flexBasis === 'string') {
      // node.setFlexBasisPercent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexBasisPercent(Number.parseInt(style.flexBasis, 10))
    } else {
      // node.setFlexBasis 写入新的状态值，使终端渲染后续读取保持一致。
      node.setFlexBasis(Number.NaN)
    }
  }

  // 满足 `'alignItems' in style` 时，终端渲染执行该分支。
  if ('alignItems' in style) {
    // 只有 `style.alignItems === 'stretch' || !style.alignIte` 满足时，终端渲染才执行该分支。
    if (style.alignItems === 'stretch' || !style.alignItems) {
      // node.setAlignItems 写入新的状态值，使终端渲染后续读取保持一致。
      node.setAlignItems(LayoutAlign.Stretch)
    }

    // 当 `style.alignItems` 匹配 `'flex-start'` 时，终端渲染执行对应分支。
    if (style.alignItems === 'flex-start') {
      // node.setAlignItems 写入新的状态值，使终端渲染后续读取保持一致。
      node.setAlignItems(LayoutAlign.FlexStart)
    }

    // 当 `style.alignItems` 匹配 `'center'` 时，终端渲染执行对应分支。
    if (style.alignItems === 'center') {
      // node.setAlignItems 写入新的状态值，使终端渲染后续读取保持一致。
      node.setAlignItems(LayoutAlign.Center)
    }

    // 当 `style.alignItems` 匹配 `'flex-end'` 时，终端渲染执行对应分支。
    if (style.alignItems === 'flex-end') {
      // node.setAlignItems 写入新的状态值，使终端渲染后续读取保持一致。
      node.setAlignItems(LayoutAlign.FlexEnd)
    }
  }

  // 满足 `'alignSelf' in style` 时，终端渲染执行该分支。
  if ('alignSelf' in style) {
    // 只有 `style.alignSelf === 'auto' || !style.alignSelf` 满足时，终端渲染才执行该分支。
    if (style.alignSelf === 'auto' || !style.alignSelf) {
      // node.setAlignSelf 写入新的状态值，使终端渲染后续读取保持一致。
      node.setAlignSelf(LayoutAlign.Auto)
    }

    // 当 `style.alignSelf` 匹配 `'flex-start'` 时，终端渲染执行对应分支。
    if (style.alignSelf === 'flex-start') {
      // node.setAlignSelf 写入新的状态值，使终端渲染后续读取保持一致。
      node.setAlignSelf(LayoutAlign.FlexStart)
    }

    // 当 `style.alignSelf` 匹配 `'center'` 时，终端渲染执行对应分支。
    if (style.alignSelf === 'center') {
      // node.setAlignSelf 写入新的状态值，使终端渲染后续读取保持一致。
      node.setAlignSelf(LayoutAlign.Center)
    }

    // 当 `style.alignSelf` 匹配 `'flex-end'` 时，终端渲染执行对应分支。
    if (style.alignSelf === 'flex-end') {
      // node.setAlignSelf 写入新的状态值，使终端渲染后续读取保持一致。
      node.setAlignSelf(LayoutAlign.FlexEnd)
    }
  }

  // 满足 `'justifyContent' in style` 时，终端渲染执行该分支。
  if ('justifyContent' in style) {
    // 只有 `style.justifyContent === 'flex-start' || !style.j` 满足时，终端渲染才执行该分支。
    if (style.justifyContent === 'flex-start' || !style.justifyContent) {
      // node.setJustifyContent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setJustifyContent(LayoutJustify.FlexStart)
    }

    // 当 `style.justifyContent` 匹配 `'center'` 时，终端渲染执行对应分支。
    if (style.justifyContent === 'center') {
      // node.setJustifyContent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setJustifyContent(LayoutJustify.Center)
    }

    // 当 `style.justifyContent` 匹配 `'flex-end'` 时，终端渲染执行对应分支。
    if (style.justifyContent === 'flex-end') {
      // node.setJustifyContent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setJustifyContent(LayoutJustify.FlexEnd)
    }

    // 当 `style.justifyContent` 匹配 `'space-between'` 时，终端渲染执行对应分支。
    if (style.justifyContent === 'space-between') {
      // node.setJustifyContent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setJustifyContent(LayoutJustify.SpaceBetween)
    }

    // 当 `style.justifyContent` 匹配 `'space-around'` 时，终端渲染执行对应分支。
    if (style.justifyContent === 'space-around') {
      // node.setJustifyContent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setJustifyContent(LayoutJustify.SpaceAround)
    }

    // 当 `style.justifyContent` 匹配 `'space-evenly'` 时，终端渲染执行对应分支。
    if (style.justifyContent === 'space-evenly') {
      // node.setJustifyContent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setJustifyContent(LayoutJustify.SpaceEvenly)
    }
  }
}

// applyDimensionStyles 集合封装成回调，供Ink 渲染层 styles在事件触发或异步步骤中调用。
const applyDimensionStyles = (node: LayoutNode, style: Styles): void => {
  // 满足 `'width' in style` 时，终端渲染执行该分支。
  if ('width' in style) {
    // 当 `typeof style.width` 匹配 `'number'` 时，终端渲染执行对应分支。
    if (typeof style.width === 'number') {
      // node.setWidth 写入新的状态值，使终端渲染后续读取保持一致。
      node.setWidth(style.width)
    // Ink 渲染层 styles在这里处理 `} else if (typeof style.width === 'string') {`，完成这一小步状态转换。
    } else if (typeof style.width === 'string') {
      // node.setWidthPercent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setWidthPercent(Number.parseInt(style.width, 10))
    } else {
      // node.setWidthAuto 写入新的状态值，使终端渲染后续读取保持一致。
      node.setWidthAuto()
    }
  }

  // 满足 `'height' in style` 时，终端渲染执行该分支。
  if ('height' in style) {
    // 当 `typeof style.height` 匹配 `'number'` 时，终端渲染执行对应分支。
    if (typeof style.height === 'number') {
      // node.setHeight 写入新的状态值，使终端渲染后续读取保持一致。
      node.setHeight(style.height)
    // Ink 渲染层 styles在这里处理 `} else if (typeof style.height === 'string') {`，完成这一小步状态转换。
    } else if (typeof style.height === 'string') {
      // node.setHeightPercent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setHeightPercent(Number.parseInt(style.height, 10))
    } else {
      // node.setHeightAuto 写入新的状态值，使终端渲染后续读取保持一致。
      node.setHeightAuto()
    }
  }

  // 满足 `'minWidth' in style` 时，终端渲染执行该分支。
  if ('minWidth' in style) {
    // 当 `typeof style.minWidth` 匹配 `'string'` 时，终端渲染执行对应分支。
    if (typeof style.minWidth === 'string') {
      // node.setMinWidthPercent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setMinWidthPercent(Number.parseInt(style.minWidth, 10))
    } else {
      // node.setMinWidth 写入新的状态值，使终端渲染后续读取保持一致。
      node.setMinWidth(style.minWidth ?? 0)
    }
  }

  // 满足 `'minHeight' in style` 时，终端渲染执行该分支。
  if ('minHeight' in style) {
    // 当 `typeof style.minHeight` 匹配 `'string'` 时，终端渲染执行对应分支。
    if (typeof style.minHeight === 'string') {
      // node.setMinHeightPercent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setMinHeightPercent(Number.parseInt(style.minHeight, 10))
    } else {
      // node.setMinHeight 写入新的状态值，使终端渲染后续读取保持一致。
      node.setMinHeight(style.minHeight ?? 0)
    }
  }

  // 满足 `'maxWidth' in style` 时，终端渲染执行该分支。
  if ('maxWidth' in style) {
    // 当 `typeof style.maxWidth` 匹配 `'string'` 时，终端渲染执行对应分支。
    if (typeof style.maxWidth === 'string') {
      // node.setMaxWidthPercent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setMaxWidthPercent(Number.parseInt(style.maxWidth, 10))
    } else {
      // node.setMaxWidth 写入新的状态值，使终端渲染后续读取保持一致。
      node.setMaxWidth(style.maxWidth ?? 0)
    }
  }

  // 满足 `'maxHeight' in style` 时，终端渲染执行该分支。
  if ('maxHeight' in style) {
    // 当 `typeof style.maxHeight` 匹配 `'string'` 时，终端渲染执行对应分支。
    if (typeof style.maxHeight === 'string') {
      // node.setMaxHeightPercent 写入新的状态值，使终端渲染后续读取保持一致。
      node.setMaxHeightPercent(Number.parseInt(style.maxHeight, 10))
    } else {
      // node.setMaxHeight 写入新的状态值，使终端渲染后续读取保持一致。
      node.setMaxHeight(style.maxHeight ?? 0)
    }
  }
}

// applyDisplayStyles 集合封装成回调，供Ink 渲染层 styles在事件触发或异步步骤中调用。
const applyDisplayStyles = (node: LayoutNode, style: Styles): void => {
  // 满足 `'display' in style` 时，终端渲染执行该分支。
  if ('display' in style) {
    // node.setDisplay 写入新的状态值，使终端渲染后续读取保持一致。
    node.setDisplay(
      style.display === 'flex' ? LayoutDisplay.Flex : LayoutDisplay.None,
    )
  }
}

// applyBorderStyles 集合保存`(`，供Ink 渲染层 styles后续判断或输出使用。
const applyBorderStyles = (
  node: LayoutNode,
  style: Styles,
  resolvedStyle?: Styles,
): void => {
  // resolvedStyle is the full current style (already set on the DOM node).
  // style may be a diff with only changed properties. For border side props,
  // we need the resolved value because `borderStyle` in a diff may not include
  // unchanged border side values (e.g. borderTop stays false but isn't in the diff).
  // resolved读取`resolvedStyle ?? style`，供后续判断或组装使用。
  const resolved = resolvedStyle ?? style

  // 满足 `'borderStyle' in style` 时，终端渲染执行该分支。
  if ('borderStyle' in style) {
    // borderWidth保存`style.borderStyle ? 1 : 0`，供Ink 渲染层 styles后续判断或输出使用。
    const borderWidth = style.borderStyle ? 1 : 0

    // node.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
    node.setBorder(
      LayoutEdge.Top,
      resolved.borderTop !== false ? borderWidth : 0,
    )
    // node.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
    node.setBorder(
      LayoutEdge.Bottom,
      resolved.borderBottom !== false ? borderWidth : 0,
    )
    // node.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
    node.setBorder(
      LayoutEdge.Left,
      resolved.borderLeft !== false ? borderWidth : 0,
    )
    // node.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
    node.setBorder(
      LayoutEdge.Right,
      resolved.borderRight !== false ? borderWidth : 0,
    )
  } else {
    // Handle individual border property changes (when only borderX changes without borderStyle).
    // Skip undefined values — they mean the prop was removed or never set,
    // not that a border should be enabled.
    // `'borderTop' in style && style.borderTop` 与 `undef` 不一致时刷新派生状态，避免使用过期结果。
    if ('borderTop' in style && style.borderTop !== undefined) {
      // node.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
      node.setBorder(LayoutEdge.Top, style.borderTop === false ? 0 : 1)
    }
    // 只有 `'borderBottom' in style && style.borderBottom !==` 满足时，终端渲染才执行该分支。
    if ('borderBottom' in style && style.borderBottom !== undefined) {
      // node.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
      node.setBorder(LayoutEdge.Bottom, style.borderBottom === false ? 0 : 1)
    }
    // `'borderLeft' in style && style.borderLeft` 与 `und` 不一致时刷新派生状态，避免使用过期结果。
    if ('borderLeft' in style && style.borderLeft !== undefined) {
      // node.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
      node.setBorder(LayoutEdge.Left, style.borderLeft === false ? 0 : 1)
    }
    // `'borderRight' in style && style.borderRight` 与 `u` 不一致时刷新派生状态，避免使用过期结果。
    if ('borderRight' in style && style.borderRight !== undefined) {
      // node.setBorder 写入新的状态值，使终端渲染后续读取保持一致。
      node.setBorder(LayoutEdge.Right, style.borderRight === false ? 0 : 1)
    }
  }
}

// applyGapStyles 集合封装成回调，供Ink 渲染层 styles在事件触发或异步步骤中调用。
const applyGapStyles = (node: LayoutNode, style: Styles): void => {
  // 满足 `'gap' in style` 时，终端渲染执行该分支。
  if ('gap' in style) {
    // node.setGap 写入新的状态值，使终端渲染后续读取保持一致。
    node.setGap(LayoutGutter.All, style.gap ?? 0)
  }

  // 满足 `'columnGap' in style` 时，终端渲染执行该分支。
  if ('columnGap' in style) {
    // node.setGap 写入新的状态值，使终端渲染后续读取保持一致。
    node.setGap(LayoutGutter.Column, style.columnGap ?? 0)
  }

  // 满足 `'rowGap' in style` 时，终端渲染执行该分支。
  if ('rowGap' in style) {
    // node.setGap 写入新的状态值，使终端渲染后续读取保持一致。
    node.setGap(LayoutGutter.Row, style.rowGap ?? 0)
  }
}

// styles 集合 命名 `(`，让后续代码直接表达这个值的用途。
const styles = (
  node: LayoutNode,
  style: Styles = {},
  resolvedStyle?: Styles,
): void => {
  // 调用 applyPositionStyles，触发终端渲染此处需要的副作用。
  applyPositionStyles(node, style)
  // 调用 applyOverflowStyles，触发终端渲染此处需要的副作用。
  applyOverflowStyles(node, style)
  // 调用 applyMarginStyles，触发终端渲染此处需要的副作用。
  applyMarginStyles(node, style)
  // 调用 applyPaddingStyles，触发终端渲染此处需要的副作用。
  applyPaddingStyles(node, style)
  // 调用 applyFlexStyles，触发终端渲染此处需要的副作用。
  applyFlexStyles(node, style)
  // 调用 applyDimensionStyles，触发终端渲染此处需要的副作用。
  applyDimensionStyles(node, style)
  // 调用 applyDisplayStyles，触发终端渲染此处需要的副作用。
  applyDisplayStyles(node, style)
  // 调用 applyBorderStyles，触发终端渲染此处需要的副作用。
  applyBorderStyles(node, style, resolvedStyle)
  // 调用 applyGapStyles，触发终端渲染此处需要的副作用。
  applyGapStyles(node, style)
}

export default styles

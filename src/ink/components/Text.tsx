// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ReactNode } 来自 react，用于校准终端渲染的数据契约。
import type { ReactNode } from 'react';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 类型依赖 { Color, Styles, TextStyles } 来自 ../styles.js，用于校准终端渲染的数据契约。
import type { Color, Styles, TextStyles } from '../styles.js';
// BaseProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type BaseProps = {
  /**
   * Change text color. Accepts a raw color value (rgb, hex, ansi).
   */
  readonly color?: Color;

  /**
   * Same as `color`, but for background.
   */
  readonly backgroundColor?: Color;

  /**
   * Make the text italic.
   */
  readonly italic?: boolean;

  /**
   * Make the text underlined.
   */
  readonly underline?: boolean;

  /**
   * Make the text crossed with a line.
   */
  readonly strikethrough?: boolean;

  /**
   * Inverse background and foreground colors.
   */
  readonly inverse?: boolean;

  /**
   * This property tells Ink to wrap or truncate text if its width is larger than container.
   * If `wrap` is passed (by default), Ink will wrap text and split it into multiple lines.
   * If `truncate-*` is passed, Ink will truncate text instead, which will result in one line of text with the rest cut off.
   */
  readonly wrap?: Styles['textWrap'];
  readonly children?: ReactNode;
};

/**
 * Bold and dim are mutually exclusive in terminals.
 * This type ensures you can use one or the other, but not both.
 */
// WeightProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type WeightProps = {
  bold?: never;
  dim?: never;
} | {
  bold: boolean;
  dim?: never;
} | {
  dim: boolean;
  bold?: never;
};
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = BaseProps & WeightProps;
// memoizedStylesForWrap 集中保存终端 UI 组件 Text要一起传递的字段。
const memoizedStylesForWrap: Record<NonNullable<Styles['textWrap']>, Styles> = {
  wrap: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    textWrap: 'wrap'
  },
  'wrap-trim': {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    textWrap: 'wrap-trim'
  },
  end: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    textWrap: 'end'
  },
  middle: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    textWrap: 'middle'
  },
  'truncate-end': {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    textWrap: 'truncate-end'
  },
  truncate: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    textWrap: 'truncate'
  },
  'truncate-middle': {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    textWrap: 'truncate-middle'
  },
  'truncate-start': {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    textWrap: 'truncate-start'
  }
} as const;

/**
 * This component can display text, and change its style to make it colorful, bold, underline, italic or strikethrough.
 */
// 终端 UI 组件 Text在这里处理 `export default function Text(t0) {`，完成这一小步状态转换。
export default function Text(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(29);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    color,
    backgroundColor,
    bold,
    dim,
    italic: t1,
    underline: t2,
    strikethrough: t3,
    inverse: t4,
    wrap: t5,
    children
  } = t0;
  // italic标记终端 UI Text是否启用对应路径。
  const italic = t1 === undefined ? false : t1;
  // underline标记终端 UI Text是否启用对应路径。
  const underline = t2 === undefined ? false : t2;
  // strikethrough标记终端 UI Text是否启用对应路径。
  const strikethrough = t3 === undefined ? false : t3;
  // inverse标记终端 UI Text是否启用对应路径。
  const inverse = t4 === undefined ? false : t4;
  // wrap标记终端 UI Text是否启用对应路径。
  const wrap = t5 === undefined ? "wrap" : t5;
  // 只有 `children === undefined || children === null` 满足时，终端渲染才执行该分支。
  if (children === undefined || children === null) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t6 暂存 `color && {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== color) {
    // t6 暂存 `color && {` 生成的渲染片段，后续返回路径直接复用。
    t6 = color && {
      color
    };
    // $[0] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = color;
    // $[1] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[1];
  }
  // t7 暂存 `backgroundColor && {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== backgroundColor) {
    // t7 暂存 `backgroundColor && {` 生成的渲染片段，后续返回路径直接复用。
    t7 = backgroundColor && {
      backgroundColor
    };
    // $[2] 缓存 `backgroundColor`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = backgroundColor;
    // $[3] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[3];
  }
  // t8 暂存 `dim && {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== dim) {
    // t8 暂存 `dim && {` 生成的渲染片段，后续返回路径直接复用。
    t8 = dim && {
      dim
    };
    // $[4] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = dim;
    // $[5] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[5];
  }
  // t9 暂存 `bold && {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== bold) {
    // t9 暂存 `bold && {` 生成的渲染片段，后续返回路径直接复用。
    t9 = bold && {
      bold
    };
    // $[6] 缓存 `bold`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = bold;
    // $[7] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[7];
  }
  // t10 暂存 `italic && {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== italic) {
    // t10 暂存 `italic && {` 生成的渲染片段，后续返回路径直接复用。
    t10 = italic && {
      italic
    };
    // $[8] 缓存 `italic`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = italic;
    // $[9] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[9];
  }
  // t11 暂存 `underline && {` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== underline) {
    // t11 暂存 `underline && {` 生成的渲染片段，后续返回路径直接复用。
    t11 = underline && {
      underline
    };
    // $[10] 缓存 `underline`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = underline;
    // $[11] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[11];
  }
  // t12 暂存 `strikethrough && {` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== strikethrough) {
    // t12 暂存 `strikethrough && {` 生成的渲染片段，后续返回路径直接复用。
    t12 = strikethrough && {
      strikethrough
    };
    // $[12] 缓存 `strikethrough`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = strikethrough;
    // $[13] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[13];
  }
  // t13 暂存 `inverse && {` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== inverse) {
    // t13 暂存 `inverse && {` 生成的渲染片段，后续返回路径直接复用。
    t13 = inverse && {
      inverse
    };
    // $[14] 缓存 `inverse`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = inverse;
    // $[15] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[15];
  }
  // t14 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t10 || $[17] !== t11 || $[18] !== t12 || $[19] !== t13 || $[20] !== t6 || $[21] !== t7 || $[22] !== t8 || $[23] !== t9) {
    // t14 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t14 = {
      ...t6,
      ...t7,
      ...t8,
      ...t9,
      ...t10,
      ...t11,
      ...t12,
      ...t13
    };
    // $[16] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t10;
    // $[17] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t11;
    // $[18] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t12;
    // $[19] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t13;
    // $[20] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t6;
    // $[21] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t7;
    // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t8;
    // $[23] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t9;
    // $[24] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[24];
  }
  // textStyles 集合沿用 `t14` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const textStyles = t14;
  // t15读取 `memoizedStylesForWrap[wrap]` 对应条目，后续围绕该成员继续处理。
  const t15 = memoizedStylesForWrap[wrap];
  // t16 暂存 `<ink-text style={t15} textStyles={textStyles}>{children}<...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== children || $[26] !== t15 || $[27] !== textStyles) {
    // t16 暂存 `<ink-text style={t15} textStyles={textStyles}>{children}<...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <ink-text style={t15} textStyles={textStyles}>{children}</ink-text>;
    // $[25] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = children;
    // $[26] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t15;
    // $[27] 缓存 `textStyles`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = textStyles;
    // $[28] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[28];
  }
  // 返回 `t16`，作为终端渲染这次计算的结果。
  return t16;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdE5vZGUiLCJSZWFjdCIsIkNvbG9yIiwiU3R5bGVzIiwiVGV4dFN0eWxlcyIsIkJhc2VQcm9wcyIsImNvbG9yIiwiYmFja2dyb3VuZENvbG9yIiwiaXRhbGljIiwidW5kZXJsaW5lIiwic3RyaWtldGhyb3VnaCIsImludmVyc2UiLCJ3cmFwIiwiY2hpbGRyZW4iLCJXZWlnaHRQcm9wcyIsImJvbGQiLCJkaW0iLCJQcm9wcyIsIm1lbW9pemVkU3R5bGVzRm9yV3JhcCIsIlJlY29yZCIsIk5vbk51bGxhYmxlIiwiZmxleEdyb3ciLCJmbGV4U2hyaW5rIiwiZmxleERpcmVjdGlvbiIsInRleHRXcmFwIiwiZW5kIiwibWlkZGxlIiwidHJ1bmNhdGUiLCJjb25zdCIsIlRleHQiLCJ0MCIsIiQiLCJfYyIsInQxIiwidDIiLCJ0MyIsInQ0IiwidDUiLCJ1bmRlZmluZWQiLCJ0NiIsInQ3IiwidDgiLCJ0OSIsInQxMCIsInQxMSIsInQxMiIsInQxMyIsInQxNCIsInRleHRTdHlsZXMiLCJ0MTUiLCJ0MTYiXSwic291cmNlcyI6WyJUZXh0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFJlYWN0Tm9kZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBDb2xvciwgU3R5bGVzLCBUZXh0U3R5bGVzIH0gZnJvbSAnLi4vc3R5bGVzLmpzJ1xuXG50eXBlIEJhc2VQcm9wcyA9IHtcbiAgLyoqXG4gICAqIENoYW5nZSB0ZXh0IGNvbG9yLiBBY2NlcHRzIGEgcmF3IGNvbG9yIHZhbHVlIChyZ2IsIGhleCwgYW5zaSkuXG4gICAqL1xuICByZWFkb25seSBjb2xvcj86IENvbG9yXG5cbiAgLyoqXG4gICAqIFNhbWUgYXMgYGNvbG9yYCwgYnV0IGZvciBiYWNrZ3JvdW5kLlxuICAgKi9cbiAgcmVhZG9ubHkgYmFja2dyb3VuZENvbG9yPzogQ29sb3JcblxuICAvKipcbiAgICogTWFrZSB0aGUgdGV4dCBpdGFsaWMuXG4gICAqL1xuICByZWFkb25seSBpdGFsaWM/OiBib29sZWFuXG5cbiAgLyoqXG4gICAqIE1ha2UgdGhlIHRleHQgdW5kZXJsaW5lZC5cbiAgICovXG4gIHJlYWRvbmx5IHVuZGVybGluZT86IGJvb2xlYW5cblxuICAvKipcbiAgICogTWFrZSB0aGUgdGV4dCBjcm9zc2VkIHdpdGggYSBsaW5lLlxuICAgKi9cbiAgcmVhZG9ubHkgc3RyaWtldGhyb3VnaD86IGJvb2xlYW5cblxuICAvKipcbiAgICogSW52ZXJzZSBiYWNrZ3JvdW5kIGFuZCBmb3JlZ3JvdW5kIGNvbG9ycy5cbiAgICovXG4gIHJlYWRvbmx5IGludmVyc2U/OiBib29sZWFuXG5cbiAgLyoqXG4gICAqIFRoaXMgcHJvcGVydHkgdGVsbHMgSW5rIHRvIHdyYXAgb3IgdHJ1bmNhdGUgdGV4dCBpZiBpdHMgd2lkdGggaXMgbGFyZ2VyIHRoYW4gY29udGFpbmVyLlxuICAgKiBJZiBgd3JhcGAgaXMgcGFzc2VkIChieSBkZWZhdWx0KSwgSW5rIHdpbGwgd3JhcCB0ZXh0IGFuZCBzcGxpdCBpdCBpbnRvIG11bHRpcGxlIGxpbmVzLlxuICAgKiBJZiBgdHJ1bmNhdGUtKmAgaXMgcGFzc2VkLCBJbmsgd2lsbCB0cnVuY2F0ZSB0ZXh0IGluc3RlYWQsIHdoaWNoIHdpbGwgcmVzdWx0IGluIG9uZSBsaW5lIG9mIHRleHQgd2l0aCB0aGUgcmVzdCBjdXQgb2ZmLlxuICAgKi9cbiAgcmVhZG9ubHkgd3JhcD86IFN0eWxlc1sndGV4dFdyYXAnXVxuXG4gIHJlYWRvbmx5IGNoaWxkcmVuPzogUmVhY3ROb2RlXG59XG5cbi8qKlxuICogQm9sZCBhbmQgZGltIGFyZSBtdXR1YWxseSBleGNsdXNpdmUgaW4gdGVybWluYWxzLlxuICogVGhpcyB0eXBlIGVuc3VyZXMgeW91IGNhbiB1c2Ugb25lIG9yIHRoZSBvdGhlciwgYnV0IG5vdCBib3RoLlxuICovXG50eXBlIFdlaWdodFByb3BzID1cbiAgfCB7IGJvbGQ/OiBuZXZlcjsgZGltPzogbmV2ZXIgfVxuICB8IHsgYm9sZDogYm9vbGVhbjsgZGltPzogbmV2ZXIgfVxuICB8IHsgZGltOiBib29sZWFuOyBib2xkPzogbmV2ZXIgfVxuXG5leHBvcnQgdHlwZSBQcm9wcyA9IEJhc2VQcm9wcyAmIFdlaWdodFByb3BzXG5cbmNvbnN0IG1lbW9pemVkU3R5bGVzRm9yV3JhcDogUmVjb3JkPE5vbk51bGxhYmxlPFN0eWxlc1sndGV4dFdyYXAnXT4sIFN0eWxlcz4gPSB7XG4gIHdyYXA6IHtcbiAgICBmbGV4R3JvdzogMCxcbiAgICBmbGV4U2hyaW5rOiAxLFxuICAgIGZsZXhEaXJlY3Rpb246ICdyb3cnLFxuICAgIHRleHRXcmFwOiAnd3JhcCcsXG4gIH0sXG4gICd3cmFwLXRyaW0nOiB7XG4gICAgZmxleEdyb3c6IDAsXG4gICAgZmxleFNocmluazogMSxcbiAgICBmbGV4RGlyZWN0aW9uOiAncm93JyxcbiAgICB0ZXh0V3JhcDogJ3dyYXAtdHJpbScsXG4gIH0sXG4gIGVuZDoge1xuICAgIGZsZXhHcm93OiAwLFxuICAgIGZsZXhTaHJpbms6IDEsXG4gICAgZmxleERpcmVjdGlvbjogJ3JvdycsXG4gICAgdGV4dFdyYXA6ICdlbmQnLFxuICB9LFxuICBtaWRkbGU6IHtcbiAgICBmbGV4R3JvdzogMCxcbiAgICBmbGV4U2hyaW5rOiAxLFxuICAgIGZsZXhEaXJlY3Rpb246ICdyb3cnLFxuICAgIHRleHRXcmFwOiAnbWlkZGxlJyxcbiAgfSxcbiAgJ3RydW5jYXRlLWVuZCc6IHtcbiAgICBmbGV4R3JvdzogMCxcbiAgICBmbGV4U2hyaW5rOiAxLFxuICAgIGZsZXhEaXJlY3Rpb246ICdyb3cnLFxuICAgIHRleHRXcmFwOiAndHJ1bmNhdGUtZW5kJyxcbiAgfSxcbiAgdHJ1bmNhdGU6IHtcbiAgICBmbGV4R3JvdzogMCxcbiAgICBmbGV4U2hyaW5rOiAxLFxuICAgIGZsZXhEaXJlY3Rpb246ICdyb3cnLFxuICAgIHRleHRXcmFwOiAndHJ1bmNhdGUnLFxuICB9LFxuICAndHJ1bmNhdGUtbWlkZGxlJzoge1xuICAgIGZsZXhHcm93OiAwLFxuICAgIGZsZXhTaHJpbms6IDEsXG4gICAgZmxleERpcmVjdGlvbjogJ3JvdycsXG4gICAgdGV4dFdyYXA6ICd0cnVuY2F0ZS1taWRkbGUnLFxuICB9LFxuICAndHJ1bmNhdGUtc3RhcnQnOiB7XG4gICAgZmxleEdyb3c6IDAsXG4gICAgZmxleFNocmluazogMSxcbiAgICBmbGV4RGlyZWN0aW9uOiAncm93JyxcbiAgICB0ZXh0V3JhcDogJ3RydW5jYXRlLXN0YXJ0JyxcbiAgfSxcbn0gYXMgY29uc3RcblxuLyoqXG4gKiBUaGlzIGNvbXBvbmVudCBjYW4gZGlzcGxheSB0ZXh0LCBhbmQgY2hhbmdlIGl0cyBzdHlsZSB0byBtYWtlIGl0IGNvbG9yZnVsLCBib2xkLCB1bmRlcmxpbmUsIGl0YWxpYyBvciBzdHJpa2V0aHJvdWdoLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBUZXh0KHtcbiAgY29sb3IsXG4gIGJhY2tncm91bmRDb2xvcixcbiAgYm9sZCxcbiAgZGltLFxuICBpdGFsaWMgPSBmYWxzZSxcbiAgdW5kZXJsaW5lID0gZmFsc2UsXG4gIHN0cmlrZXRocm91Z2ggPSBmYWxzZSxcbiAgaW52ZXJzZSA9IGZhbHNlLFxuICB3cmFwID0gJ3dyYXAnLFxuICBjaGlsZHJlbixcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKGNoaWxkcmVuID09PSB1bmRlZmluZWQgfHwgY2hpbGRyZW4gPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gQnVpbGQgdGV4dFN0eWxlcyBvYmplY3Qgd2l0aCBvbmx5IHRoZSBwcm9wZXJ0aWVzIHRoYXQgYXJlIHNldFxuICBjb25zdCB0ZXh0U3R5bGVzOiBUZXh0U3R5bGVzID0ge1xuICAgIC4uLihjb2xvciAmJiB7IGNvbG9yIH0pLFxuICAgIC4uLihiYWNrZ3JvdW5kQ29sb3IgJiYgeyBiYWNrZ3JvdW5kQ29sb3IgfSksXG4gICAgLi4uKGRpbSAmJiB7IGRpbSB9KSxcbiAgICAuLi4oYm9sZCAmJiB7IGJvbGQgfSksXG4gICAgLi4uKGl0YWxpYyAmJiB7IGl0YWxpYyB9KSxcbiAgICAuLi4odW5kZXJsaW5lICYmIHsgdW5kZXJsaW5lIH0pLFxuICAgIC4uLihzdHJpa2V0aHJvdWdoICYmIHsgc3RyaWtldGhyb3VnaCB9KSxcbiAgICAuLi4oaW52ZXJzZSAmJiB7IGludmVyc2UgfSksXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxpbmstdGV4dCBzdHlsZT17bWVtb2l6ZWRTdHlsZXNGb3JXcmFwW3dyYXBdfSB0ZXh0U3R5bGVzPXt0ZXh0U3R5bGVzfT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L2luay10ZXh0PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxTQUFTLFFBQVEsT0FBTztBQUN0QyxPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixjQUFjQyxLQUFLLEVBQUVDLE1BQU0sRUFBRUMsVUFBVSxRQUFRLGNBQWM7QUFFN0QsS0FBS0MsU0FBUyxHQUFHO0VBQ2Y7QUFDRjtBQUNBO0VBQ0UsU0FBU0MsS0FBSyxDQUFDLEVBQUVKLEtBQUs7O0VBRXRCO0FBQ0Y7QUFDQTtFQUNFLFNBQVNLLGVBQWUsQ0FBQyxFQUFFTCxLQUFLOztFQUVoQztBQUNGO0FBQ0E7RUFDRSxTQUFTTSxNQUFNLENBQUMsRUFBRSxPQUFPOztFQUV6QjtBQUNGO0FBQ0E7RUFDRSxTQUFTQyxTQUFTLENBQUMsRUFBRSxPQUFPOztFQUU1QjtBQUNGO0FBQ0E7RUFDRSxTQUFTQyxhQUFhLENBQUMsRUFBRSxPQUFPOztFQUVoQztBQUNGO0FBQ0E7RUFDRSxTQUFTQyxPQUFPLENBQUMsRUFBRSxPQUFPOztFQUUxQjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsU0FBU0MsSUFBSSxDQUFDLEVBQUVULE1BQU0sQ0FBQyxVQUFVLENBQUM7RUFFbEMsU0FBU1UsUUFBUSxDQUFDLEVBQUViLFNBQVM7QUFDL0IsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUtjLFdBQVcsR0FDWjtF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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、PropsWithChildren、Ref，将 react 中已经封装好的能力接到本文件流程里。
import React, { type PropsWithChildren, type Ref } from 'react';
// 复用 Box 终端界面组件，避免在这里重复拼装显示逻辑。
import Box from '../../ink/components/Box.js';
// 类型依赖 { DOMElement } 来自 ../../ink/dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from '../../ink/dom.js';
// 类型依赖 { ClickEvent } 来自 ../../ink/events/click-event.js，用于校准终端渲染的数据契约。
import type { ClickEvent } from '../../ink/events/click-event.js';
// 类型依赖 { FocusEvent } 来自 ../../ink/events/focus-event.js，用于校准终端渲染的数据契约。
import type { FocusEvent } from '../../ink/events/focus-event.js';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 类型依赖 { Color, Styles } 来自 ../../ink/styles.js，用于校准终端渲染的数据契约。
import type { Color, Styles } from '../../ink/styles.js';
// 复用 getTheme、Theme 工具函数，把通用处理留在 ../../utils/theme.js 中维护。
import { getTheme, type Theme } from '../../utils/theme.js';
// 引入 useTheme，将 ./ThemeProvider.js 中已经封装好的能力接到本文件流程里。
import { useTheme } from './ThemeProvider.js';

// Color props that accept theme keys
// ThemedColorProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ThemedColorProps = {
  readonly borderColor?: keyof Theme | Color;
  readonly borderTopColor?: keyof Theme | Color;
  readonly borderBottomColor?: keyof Theme | Color;
  readonly borderLeftColor?: keyof Theme | Color;
  readonly borderRightColor?: keyof Theme | Color;
  readonly backgroundColor?: keyof Theme | Color;
};

// Base Styles without color props (they'll be overridden)
// BaseStylesWithoutColors 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type BaseStylesWithoutColors = Omit<Styles, 'textWrap' | 'borderColor' | 'borderTopColor' | 'borderBottomColor' | 'borderLeftColor' | 'borderRightColor' | 'backgroundColor'>;
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = BaseStylesWithoutColors & ThemedColorProps & {
  ref?: Ref<DOMElement>;
  tabIndex?: number;
  autoFocus?: boolean;
  onClick?: (event: ClickEvent) => void;
  // 这个回调绑定到 onFocus?: (event: FocusEvent) => void;，负责终端渲染在该局部场景下的响应。
  onFocus?: (event: FocusEvent) => void;
  // 这个回调绑定到 onFocusCapture?: (event: FocusEvent) => void;，负责终端渲染在该局部场景下的响应。
  onFocusCapture?: (event: FocusEvent) => void;
  // 这个回调绑定到 onBlur?: (event: FocusEvent) => void;，负责终端渲染在该局部场景下的响应。
  onBlur?: (event: FocusEvent) => void;
  // 这个回调绑定到 onBlurCapture?: (event: FocusEvent) => void;，负责终端渲染在该局部场景下的响应。
  onBlurCapture?: (event: FocusEvent) => void;
  // 这个回调绑定到 onKeyDown?: (event: KeyboardEvent) => void;，负责终端渲染在该局部场景下的响应。
  onKeyDown?: (event: KeyboardEvent) => void;
  // 这个回调绑定到 onKeyDownCapture?: (event: KeyboardEvent) => void;，负责终端渲染在该局部场景下的响应。
  onKeyDownCapture?: (event: KeyboardEvent) => void;
  // 这个回调绑定到 onMouseEnter?: () => void;，负责终端渲染在该局部场景下的响应。
  onMouseEnter?: () => void;
  // 这个回调绑定到 onMouseLeave?: () => void;，负责终端渲染在该局部场景下的响应。
  onMouseLeave?: () => void;
};

/**
 * Resolves a color value that may be a theme key to a raw Color.
 */
// resolveColor 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveColor(color: keyof Theme | Color | undefined, theme: Theme): Color | undefined {
  // color缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!color) return undefined;
  // Check if it's a raw color (starts with rgb(, #, ansi256(, or ansi:)
  // 只有 `color.startsWith('rgb(') || color.startsWith('#') || color.startsWith('ansi...` 满足时，终端渲染才执行该分支。
  if (color.startsWith('rgb(') || color.startsWith('#') || color.startsWith('ansi256(') || color.startsWith('ansi:')) {
    // 返回 `color as Color`，作为终端渲染这次计算的结果。
    return color as Color;
  }
  // It's a theme key - resolve it
  // 返回 `theme[color as keyof Theme] as Color`，作为终端渲染这次计算的结果。
  return theme[color as keyof Theme] as Color;
}

/**
 * Theme-aware Box component that resolves theme color keys to raw colors.
 * This wraps the base Box component with theme resolution for border colors.
 */
// ThemedBox 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ThemedBox(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(33);
  // backgroundColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let backgroundColor;
  // borderBottomColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let borderBottomColor;
  // borderColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let borderColor;
  // borderLeftColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let borderLeftColor;
  // borderRightColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let borderRightColor;
  // borderTopColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let borderTopColor;
  // 子节点 先占位，稍后的条件分支会根据实际输入补齐它。
  let children;
  // ref 引用 先占位，稍后的条件分支会根据实际输入补齐它。
  let ref;
  // rest 先占位，稍后的条件分支会根据实际输入补齐它。
  let rest;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // 重新解构输入对象，把终端 UI 组件 Themed Box需要的字段同步到本地变量。
    ({
      borderColor,
      borderTopColor,
      borderBottomColor,
      borderLeftColor,
      borderRightColor,
      backgroundColor,
      children,
      ref,
      ...rest
    } = t0);
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `backgroundColor`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = backgroundColor;
    // $[2] 缓存 `borderBottomColor`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = borderBottomColor;
    // $[3] 缓存 `borderColor`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = borderColor;
    // $[4] 缓存 `borderLeftColor`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = borderLeftColor;
    // $[5] 缓存 `borderRightColor`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = borderRightColor;
    // $[6] 缓存 `borderTopColor`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = borderTopColor;
    // $[7] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = children;
    // $[8] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = ref;
    // $[9] 缓存 `rest`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = rest;
  } else {
    // backgroundColor更新为 `$[1]`，确保终端 UI后续读取最新状态。
    backgroundColor = $[1];
    // borderBottomColor更新为 `$[2]`，确保终端 UI后续读取最新状态。
    borderBottomColor = $[2];
    // borderColor更新为 `$[3]`，确保终端 UI后续读取最新状态。
    borderColor = $[3];
    // borderLeftColor更新为 `$[4]`，确保终端 UI后续读取最新状态。
    borderLeftColor = $[4];
    // borderRightColor更新为 `$[5]`，确保终端 UI后续读取最新状态。
    borderRightColor = $[5];
    // borderTopColor更新为 `$[6]`，确保终端 UI后续读取最新状态。
    borderTopColor = $[6];
    // 子节点更新为 `$[7]`，确保终端 UI后续读取最新状态。
    children = $[7];
    // ref 引用更新为 `$[8]`，确保终端 UI后续读取最新状态。
    ref = $[8];
    // rest更新为 `$[9]`，确保终端 UI后续读取最新状态。
    rest = $[9];
  }
  // 从 `useTheme()` 按位置拆出 themeName，让终端 UI 组件 Themed Box分别处理这些返回值。
  const [themeName] = useTheme();
  // resolvedBorderBottomColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let resolvedBorderBottomColor;
  // resolvedBorderColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let resolvedBorderColor;
  // resolvedBorderLeftColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let resolvedBorderLeftColor;
  // resolvedBorderRightColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let resolvedBorderRightColor;
  // resolvedBorderTopColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let resolvedBorderTopColor;
  // t1 暂存 `resolveColor(backgroundColor, theme)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== backgroundColor || $[11] !== borderBottomColor || $[12] !== borderColor || $[13] !== borderLeftColor || $[14] !== borderRightColor || $[15] !== borderTopColor || $[16] !== themeName) {
    // 主题读取`getTheme`，供终端渲染后续处理使用。
    const theme = getTheme(themeName);
    // resolvedBorderColor更新为 `resolveColor(borderColor, theme)`，确保终端 UI后续读取最新状态。
    resolvedBorderColor = resolveColor(borderColor, theme);
    // resolvedBorderTopColor更新为 `resolveColor(borderTopColor, theme)`，确保终端 UI后续读取最新状态。
    resolvedBorderTopColor = resolveColor(borderTopColor, theme);
    // resolvedBorderBottomColor更新为 `resolveColor(borderBottomColor, theme)`，确保终端 UI后续读取最新状态。
    resolvedBorderBottomColor = resolveColor(borderBottomColor, theme);
    // resolvedBorderLeftColor更新为 `resolveColor(borderLeftColor, theme)`，确保终端 UI后续读取最新状态。
    resolvedBorderLeftColor = resolveColor(borderLeftColor, theme);
    // resolvedBorderRightColor更新为 `resolveColor(borderRightColor, theme)`，确保终端 UI后续读取最新状态。
    resolvedBorderRightColor = resolveColor(borderRightColor, theme);
    // t1 暂存 `resolveColor(backgroundColor, theme)` 生成的渲染片段，后续返回路径直接复用。
    t1 = resolveColor(backgroundColor, theme);
    // $[10] 缓存 `backgroundColor`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = backgroundColor;
    // $[11] 缓存 `borderBottomColor`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = borderBottomColor;
    // $[12] 缓存 `borderColor`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = borderColor;
    // $[13] 缓存 `borderLeftColor`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = borderLeftColor;
    // $[14] 缓存 `borderRightColor`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = borderRightColor;
    // $[15] 缓存 `borderTopColor`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = borderTopColor;
    // $[16] 缓存 `themeName`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = themeName;
    // $[17] 缓存 `resolvedBorderBottomColor`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = resolvedBorderBottomColor;
    // $[18] 缓存 `resolvedBorderColor`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = resolvedBorderColor;
    // $[19] 缓存 `resolvedBorderLeftColor`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = resolvedBorderLeftColor;
    // $[20] 缓存 `resolvedBorderRightColor`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = resolvedBorderRightColor;
    // $[21] 缓存 `resolvedBorderTopColor`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = resolvedBorderTopColor;
    // $[22] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t1;
  } else {
    // resolvedBorderBottomColor更新为 `$[17]`，确保终端 UI后续读取最新状态。
    resolvedBorderBottomColor = $[17];
    // resolvedBorderColor更新为 `$[18]`，确保终端 UI后续读取最新状态。
    resolvedBorderColor = $[18];
    // resolvedBorderLeftColor更新为 `$[19]`，确保终端 UI后续读取最新状态。
    resolvedBorderLeftColor = $[19];
    // resolvedBorderRightColor更新为 `$[20]`，确保终端 UI后续读取最新状态。
    resolvedBorderRightColor = $[20];
    // resolvedBorderTopColor更新为 `$[21]`，确保终端 UI后续读取最新状态。
    resolvedBorderTopColor = $[21];
    // t1 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[22];
  }
  // resolvedBackgroundColor沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const resolvedBackgroundColor = t1;
  // t2 暂存 `<Box ref={ref} borderColor={resolvedBorderColor} borderTo...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== children || $[24] !== ref || $[25] !== resolvedBackgroundColor || $[26] !== resolvedBorderBottomColor || $[27] !== resolvedBorderColor || $[28] !== resolvedBorderLeftColor || $[29] !== resolvedBorderRightColor || $[30] !== resolvedBorderTopColor || $[31] !== rest) {
    // t2 暂存 `<Box ref={ref} borderColor={resolvedBorderColor} borderTo...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box ref={ref} borderColor={resolvedBorderColor} borderTopColor={resolvedBorderTopColor} borderBottomColor={resolvedBorderBottomColor} borderLeftColor={resolvedBorderLeftColor} borderRightColor={resolvedBorderRightColor} backgroundColor={resolvedBackgroundColor} {...rest}>{children}</Box>;
    // $[23] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = children;
    // $[24] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = ref;
    // $[25] 缓存 `resolvedBackgroundColor`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = resolvedBackgroundColor;
    // $[26] 缓存 `resolvedBorderBottomColor`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = resolvedBorderBottomColor;
    // $[27] 缓存 `resolvedBorderColor`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = resolvedBorderColor;
    // $[28] 缓存 `resolvedBorderLeftColor`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = resolvedBorderLeftColor;
    // $[29] 缓存 `resolvedBorderRightColor`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = resolvedBorderRightColor;
    // $[30] 缓存 `resolvedBorderTopColor`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = resolvedBorderTopColor;
    // $[31] 缓存 `rest`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = rest;
    // $[32] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[32];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
export default ThemedBox;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlByb3BzV2l0aENoaWxkcmVuIiwiUmVmIiwiQm94IiwiRE9NRWxlbWVudCIsIkNsaWNrRXZlbnQiLCJGb2N1c0V2ZW50IiwiS2V5Ym9hcmRFdmVudCIsIkNvbG9yIiwiU3R5bGVzIiwiZ2V0VGhlbWUiLCJUaGVtZSIsInVzZVRoZW1lIiwiVGhlbWVkQ29sb3JQcm9wcyIsImJvcmRlckNvbG9yIiwiYm9yZGVyVG9wQ29sb3IiLCJib3JkZXJCb3R0b21Db2xvciIsImJvcmRlckxlZnRDb2xvciIsImJvcmRlclJpZ2h0Q29sb3IiLCJiYWNrZ3JvdW5kQ29sb3IiLCJCYXNlU3R5bGVzV2l0aG91dENvbG9ycyIsIk9taXQiLCJQcm9wcyIsInJlZiIsInRhYkluZGV4IiwiYXV0b0ZvY3VzIiwib25DbGljayIsImV2ZW50Iiwib25Gb2N1cyIsIm9uRm9jdXNDYXB0dXJlIiwib25CbHVyIiwib25CbHVyQ2FwdHVyZSIsIm9uS2V5RG93biIsIm9uS2V5RG93bkNhcHR1cmUiLCJvbk1vdXNlRW50ZXIiLCJvbk1vdXNlTGVhdmUiLCJyZXNvbHZlQ29sb3IiLCJjb2xvciIsInRoZW1lIiwidW5kZWZpbmVkIiwic3RhcnRzV2l0aCIsIlRoZW1lZEJveCIsInQwIiwiJCIsIl9jIiwiY2hpbGRyZW4iLCJyZXN0IiwidGhlbWVOYW1lIiwicmVzb2x2ZWRCb3JkZXJCb3R0b21Db2xvciIsInJlc29sdmVkQm9yZGVyQ29sb3IiLCJyZXNvbHZlZEJvcmRlckxlZnRDb2xvciIsInJlc29sdmVkQm9yZGVyUmlnaHRDb2xvciIsInJlc29sdmVkQm9yZGVyVG9wQ29sb3IiLCJ0MSIsInJlc29sdmVkQmFja2dyb3VuZENvbG9yIiwidDIiXSwic291cmNlcyI6WyJUaGVtZWRCb3gudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB0eXBlIFByb3BzV2l0aENoaWxkcmVuLCB0eXBlIFJlZiB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IEJveCBmcm9tICcuLi8uLi9pbmsvY29tcG9uZW50cy9Cb3guanMnXG5pbXBvcnQgdHlwZSB7IERPTUVsZW1lbnQgfSBmcm9tICcuLi8uLi9pbmsvZG9tLmpzJ1xuaW1wb3J0IHR5cGUgeyBDbGlja0V2ZW50IH0gZnJvbSAnLi4vLi4vaW5rL2V2ZW50cy9jbGljay1ldmVudC5qcydcbmltcG9ydCB0eXBlIHsgRm9jdXNFdmVudCB9IGZyb20gJy4uLy4uL2luay9ldmVudHMvZm9jdXMtZXZlbnQuanMnXG5pbXBvcnQgdHlwZSB7IEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi8uLi9pbmsvZXZlbnRzL2tleWJvYXJkLWV2ZW50LmpzJ1xuaW1wb3J0IHR5cGUgeyBDb2xvciwgU3R5bGVzIH0gZnJvbSAnLi4vLi4vaW5rL3N0eWxlcy5qcydcbmltcG9ydCB7IGdldFRoZW1lLCB0eXBlIFRoZW1lIH0gZnJvbSAnLi4vLi4vdXRpbHMvdGhlbWUuanMnXG5pbXBvcnQgeyB1c2VUaGVtZSB9IGZyb20gJy4vVGhlbWVQcm92aWRlci5qcydcblxuLy8gQ29sb3IgcHJvcHMgdGhhdCBhY2NlcHQgdGhlbWUga2V5c1xudHlwZSBUaGVtZWRDb2xvclByb3BzID0ge1xuICByZWFkb25seSBib3JkZXJDb2xvcj86IGtleW9mIFRoZW1lIHwgQ29sb3JcbiAgcmVhZG9ubHkgYm9yZGVyVG9wQ29sb3I/OiBrZXlvZiBUaGVtZSB8IENvbG9yXG4gIHJlYWRvbmx5IGJvcmRlckJvdHRvbUNvbG9yPzoga2V5b2YgVGhlbWUgfCBDb2xvclxuICByZWFkb25seSBib3JkZXJMZWZ0Q29sb3I/OiBrZXlvZiBUaGVtZSB8IENvbG9yXG4gIHJlYWRvbmx5IGJvcmRlclJpZ2h0Q29sb3I/OiBrZXlvZiBUaGVtZSB8IENvbG9yXG4gIHJlYWRvbmx5IGJhY2tncm91bmRDb2xvcj86IGtleW9mIFRoZW1lIHwgQ29sb3Jcbn1cblxuLy8gQmFzZSBTdHlsZXMgd2l0aG91dCBjb2xvciBwcm9wcyAodGhleSdsbCBiZSBvdmVycmlkZGVuKVxudHlwZSBCYXNlU3R5bGVzV2l0aG91dENvbG9ycyA9IE9taXQ8XG4gIFN0eWxlcyxcbiAgfCAndGV4dFdyYXAnXG4gIHwgJ2JvcmRlckNvbG9yJ1xuICB8ICdib3JkZXJUb3BDb2xvcidcbiAgfCAnYm9yZGVyQm90dG9tQ29sb3InXG4gIHwgJ2JvcmRlckxlZnRDb2xvcidcbiAgfCAnYm9yZGVyUmlnaHRDb2xvcidcbiAgfCAnYmFja2dyb3VuZENvbG9yJ1xuPlxuXG5leHBvcnQgdHlwZSBQcm9wcyA9IEJhc2VTdHlsZXNXaXRob3V0Q29sb3JzICZcbiAgVGhlbWVkQ29sb3JQcm9wcyAmIHtcbiAgICByZWY/OiBSZWY8RE9NRWxlbWVudD5cbiAgICB0YWJJbmRleD86IG51bWJlclxuICAgIGF1dG9Gb2N1cz86IGJvb2xlYW5cbiAgICBvbkNsaWNrPzogKGV2ZW50OiBDbGlja0V2ZW50KSA9PiB2b2lkXG4gICAgb25Gb2N1cz86IChldmVudDogRm9jdXNFdmVudCkgPT4gdm9pZFxuICAgIG9uRm9jdXNDYXB0dXJlPzogKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB2b2lkXG4gICAgb25CbHVyPzogKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB2b2lkXG4gICAgb25CbHVyQ2FwdHVyZT86IChldmVudDogRm9jdXNFdmVudCkgPT4gdm9pZFxuICAgIG9uS2V5RG93bj86IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4gdm9pZFxuICAgIG9uS2V5RG93bkNhcHR1cmU/OiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHZvaWRcbiAgICBvbk1vdXNlRW50ZXI/OiAoKSA9PiB2b2lkXG4gICAgb25Nb3VzZUxlYXZlPzogKCkgPT4gdm9pZFxuICB9XG5cbi8qKlxuICogUmVzb2x2ZXMgYSBjb2xvciB2YWx1ZSB0aGF0IG1heSBiZSBhIHRoZW1lIGtleSB0byBhIHJhdyBDb2xvci5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUNvbG9yKFxuICBjb2xvcjoga2V5b2YgVGhlbWUgfCBDb2xvciB8IHVuZGVmaW5lZCxcbiAgdGhlbWU6IFRoZW1lLFxuKTogQ29sb3IgfCB1bmRlZmluZWQge1xuICBpZiAoIWNvbG9yKSByZXR1cm4gdW5kZWZpbmVkXG4gIC8vIENoZWNrIGlmIGl0J3MgYSByYXcgY29sb3IgKHN0YXJ0cyB3aXRoIHJnYigsICMsIGFuc2kyNTYoLCBvciBhbnNpOilcbiAgaWYgKFxuICAgIGNvbG9yLnN0YXJ0c1dpdGgoJ3JnYignKSB8fFxuICAgIGNvbG9yLnN0YXJ0c1dpdGgoJyMnKSB8fFxuICAgIGNvbG9yLnN0YXJ0c1dpdGgoJ2Fuc2kyNTYoJykgfHxcbiAgICBjb2xvci5zdGFydHNXaXRoKCdhbnNpOicpXG4gICkge1xuICAgIHJldHVybiBjb2xvciBhcyBDb2xvclxuICB9XG4gIC8vIEl0J3MgYSB0aGVtZSBrZXkgLSByZXNvbHZlIGl0XG4gIHJldHVybiB0aGVtZVtjb2xvciBhcyBrZXlvZiBUaGVtZV0gYXMgQ29sb3Jcbn1cblxuLyoqXG4gKiBUaGVtZS1hd2FyZSBCb3ggY29tcG9uZW50IHRoYXQgcmVzb2x2ZXMgdGhlbWUgY29sb3Iga2V5cyB0byByYXcgY29sb3JzLlxuICogVGhpcyB3cmFwcyB0aGUgYmFzZSBCb3ggY29tcG9uZW50IHdpdGggdGhlbWUgcmVzb2x1dGlvbiBmb3IgYm9yZGVyIGNvbG9ycy5cbiAqL1xuZnVuY3Rpb24gVGhlbWVkQm94KHtcbiAgYm9yZGVyQ29sb3IsXG4gIGJvcmRlclRvcENvbG9yLFxuICBib3JkZXJCb3R0b21Db2xvcixcbiAgYm9yZGVyTGVmdENvbG9yLFxuICBib3JkZXJSaWdodENvbG9yLFxuICBiYWNrZ3JvdW5kQ29sb3IsXG4gIGNoaWxkcmVuLFxuICByZWYsXG4gIC4uLnJlc3Rcbn06IFByb3BzV2l0aENoaWxkcmVuPFByb3BzPik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZU5hbWVdID0gdXNlVGhlbWUoKVxuICBjb25zdCB0aGVtZSA9IGdldFRoZW1lKHRoZW1lTmFtZSlcblxuICAvLyBSZXNvbHZlIHRoZW1lIGtleXMgdG8gcmF3IGNvbG9yc1xuICBjb25zdCByZXNvbHZlZEJvcmRlckNvbG9yID0gcmVzb2x2ZUNvbG9yKGJvcmRlckNvbG9yLCB0aGVtZSlcbiAgY29uc3QgcmVzb2x2ZWRCb3JkZXJUb3BDb2xvciA9IHJlc29sdmVDb2xvcihib3JkZXJUb3BDb2xvciwgdGhlbWUpXG4gIGNvbnN0IHJlc29sdmVkQm9yZGVyQm90dG9tQ29sb3IgPSByZXNvbHZlQ29sb3IoYm9yZGVyQm90dG9tQ29sb3IsIHRoZW1lKVxuICBjb25zdCByZXNvbHZlZEJvcmRlckxlZnRDb2xvciA9IHJlc29sdmVDb2xvcihib3JkZXJMZWZ0Q29sb3IsIHRoZW1lKVxuICBjb25zdCByZXNvbHZlZEJvcmRlclJpZ2h0Q29sb3IgPSByZXNvbHZlQ29sb3IoYm9yZGVyUmlnaHRDb2xvciwgdGhlbWUpXG4gIGNvbnN0IHJlc29sdmVkQmFja2dyb3VuZENvbG9yID0gcmVzb2x2ZUNvbG9yKGJhY2tncm91bmRDb2xvciwgdGhlbWUpXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICByZWY9e3JlZn1cbiAgICAgIGJvcmRlckNvbG9yPXtyZXNvbHZlZEJvcmRlckNvbG9yfVxuICAgICAgYm9yZGVyVG9wQ29sb3I9e3Jlc29sdmVkQm9yZGVyVG9wQ29sb3J9XG4gICAgICBib3JkZXJCb3R0b21Db2xvcj17cmVzb2x2ZWRCb3JkZXJCb3R0b21Db2xvcn1cbiAgICAgIGJvcmRlckxlZnRDb2xvcj17cmVzb2x2ZWRCb3JkZXJMZWZ0Q29sb3J9XG4gICAgICBib3JkZXJSaWdodENvbG9yPXtyZXNvbHZlZEJvcmRlclJpZ2h0Q29sb3J9XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I9e3Jlc29sdmVkQmFja2dyb3VuZENvbG9yfVxuICAgICAgey4uLnJlc3R9XG4gICAgPlxuICAgICAge2NoaWxkcmVufVxuICAgIDwvQm94PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IFRoZW1lZEJveFxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJLEtBQUtDLGlCQUFpQixFQUFFLEtBQUtDLEdBQUcsUUFBUSxPQUFPO0FBQy9ELE9BQU9DLEdBQUcsTUFBTSw2QkFBNkI7QUFDN0MsY0FBY0MsVUFBVSxRQUFRLGtCQUFrQjtBQUNsRCxjQUFjQyxVQUFVLFFBQVEsaUNBQWlDO0FBQ2pFLGNBQWNDLFVBQVUsUUFBUSxpQ0FBaUM7QUFDakUsY0FBY0MsYUFBYSxRQUFRLG9DQUFvQztBQUN2RSxjQUFjQyxLQUFLLEVBQUVDLE1BQU0sUUFBUSxxQkFBcUI7QUFDeEQsU0FBU0MsUUFBUSxFQUFFLEtBQUtDLEtBQUssUUFBUSxzQkFBc0I7QUFDM0QsU0FBU0MsUUFBUSxRQUFRLG9CQUFvQjs7QUFFN0M7QUFDQSxLQUFLQyxnQkFBZ0IsR0FBRztFQUN0QixTQUFTQyxXQUFXLENBQUMsRUFBRSxNQUFNSCxLQUFLLEdBQUdILEtBQUs7RUFDMUMsU0FBU08sY0FBYyxDQUFDLEVBQUUsTUFBTUosS0FBSyxHQUFHSCxLQUFLO0VBQzdDLFNBQVNRLGlCQUFpQixDQUFDLEVBQUUsTUFBTUwsS0FBSyxHQUFHSCxLQUFLO0VBQ2hELFNBQVNTLGVBQWUsQ0FBQyxFQUFFLE1BQU1OLEtBQUssR0FBR0gsS0FBSztFQUM5QyxTQUFTVSxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU1QLEtBQUssR0FBR0gsS0FBSztFQUMvQyxTQUFTVyxlQUFlLENBQUMsRUFBRSxNQUFNUixLQUFLLEdBQUdILEtBQUs7QUFDaEQsQ0FBQzs7QUFFRDtBQUNBLEtBQUtZLHVCQUF1QixHQUFHQyxJQUFJLENBQ2pDWixNQUFNLEVBQ0osVUFBVSxHQUNWLGFBQWEsR0FDYixnQkFBZ0IsR0FDaEIsbUJBQW1CLEdBQ25CLGlCQUFpQixHQUNqQixrQkFBa0IsR0FDbEIsaUJBQWlCLENBQ3BCO0FBRUQsT0FBTyxLQUFLYSxLQUFLLEdBQUdGLHVCQUF1QixHQUN6Q1AsZ0JBQWdCLEdBQUc7RUFDakJVLEdBQUcsQ0FBQyxFQUFFckIsR0FBRyxDQUFDRSxVQUFVLENBQUM7RUFDckJvQixRQUFRLENBQUMsRUFBRSxNQUFNO0VBQ2pCQyxTQUFTLENBQUMsRUFBRSxPQUFPO0VBQ25CQyxPQUFPLENBQUMsRUFBRSxDQUFDQyxLQUFLLEVBQUV0QixVQUFVLEVBQUUsR0FBRyxJQUFJO0VBQ3JDdUIsT0FBTyxDQUFDLEVBQUUsQ0FBQ0QsS0FBSyxFQUFFckIsVUFBVSxFQUFFLEdBQUcsSUFBSTtFQUNyQ3VCLGNBQWMsQ0FBQyxFQUFFLENBQUNGLEtBQUssRUFBRXJCLFVBQVUsRUFBRSxHQUFHLElBQUk7RUFDNUN3QixNQUFNLENBQUMsRUFBRSxDQUFDSCxLQUFLLEVBQUVyQixVQUFVLEVBQUUsR0FBRyxJQUFJO0VBQ3BDeUIsYUFBYSxDQUFDLEVBQUUsQ0FBQ0osS0FBSyxFQUFFckIsVUFBVSxFQUFFLEdBQUcsSUFBSTtFQUMzQzBCLFNBQVMsQ0FBQyxFQUFFLENBQUNMLEtBQUssRUFBRXBCLGFBQWEsRUFBRSxHQUFHLElBQUk7RUFDMUMwQixnQkFBZ0IsQ0FBQyxFQUFFLENBQUNOLEtBQUssRUFBRXBCLGFBQWEsRUFBRSxHQUFHLElBQUk7RUFDakQyQixZQUFZLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSTtFQUN6QkMsWUFBWSxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUk7QUFDM0IsQ0FBQzs7QUFFSDtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxZQUFZQSxDQUNuQkMsS0FBSyxFQUFFLE1BQU0xQixLQUFLLEdBQUdILEtBQUssR0FBRyxTQUFTLEVBQ3RDOEIsS0FBSyxFQUFFM0IsS0FBSyxDQUNiLEVBQUVILEtBQUssR0FBRyxTQUFTLENBQUM7RUFDbkIsSUFBSSxDQUFDNkIsS0FBSyxFQUFFLE9BQU9FLFNBQVM7RUFDNUI7RUFDQSxJQUNFRixLQUFLLENBQUNHLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFDeEJILEtBQUssQ0FBQ0csVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUNyQkgsS0FBSyxDQUFDRyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQzVCSCxLQUFLLENBQUNHLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFDekI7SUFDQSxPQUFPSCxLQUFLLElBQUk3QixLQUFLO0VBQ3ZCO0VBQ0E7RUFDQSxPQUFPOEIsS0FBSyxDQUFDRCxLQUFLLElBQUksTUFBTTFCLEtBQUssQ0FBQyxJQUFJSCxLQUFLO0FBQzdDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBQWlDLFVBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBQSxJQUFBekIsZUFBQTtFQUFBLElBQUFILGlCQUFBO0VBQUEsSUFBQUYsV0FBQTtFQUFBLElBQUFHLGVBQUE7RUFBQSxJQUFBQyxnQkFBQTtFQUFBLElBQUFILGNBQUE7RUFBQSxJQUFBOEIsUUFBQTtFQUFBLElBQUF0QixHQUFBO0VBQUEsSUFBQXVCLElBQUE7RUFBQSxJQUFBSCxDQUFBLFFBQUFELEVBQUE7SUFBbUI7TUFBQTVCLFdBQUE7TUFBQUMsY0FBQTtNQUFBQyxpQkFBQTtNQUFBQyxlQUFBO01BQUFDLGdCQUFBO01BQUFDLGVBQUE7TUFBQTBCLFFBQUE7TUFBQXRCLEdBQUE7TUFBQSxHQUFBdUI7SUFBQSxJQUFBSixFQVVRO0lBQUFDLENBQUEsTUFBQUQsRUFBQTtJQUFBQyxDQUFBLE1BQUF4QixlQUFBO0lBQUF3QixDQUFBLE1BQUEzQixpQkFBQTtJQUFBMkIsQ0FBQSxNQUFBN0IsV0FBQTtJQUFBNkIsQ0FBQSxNQUFBMUIsZUFBQTtJQUFBMEIsQ0FBQSxNQUFBekIsZ0JBQUE7SUFBQXlCLENBQUEsTUFBQTVCLGNBQUE7SUFBQTRCLENBQUEsTUFBQUUsUUFBQTtJQUFBRixDQUFBLE1BQUFwQixHQUFBO0lBQUFvQixDQUFBLE1BQUFHLElBQUE7RUFBQTtJQUFBM0IsZUFBQSxHQUFBd0IsQ0FBQTtJQUFBM0IsaUJBQUEsR0FBQTJCLENBQUE7SUFBQTdCLFdBQUEsR0FBQTZCLENBQUE7SUFBQTFCLGVBQUEsR0FBQTBCLENBQUE7SUFBQXpCLGdCQUFBLEdBQUF5QixDQUFBO0lBQUE1QixjQUFBLEdBQUE0QixDQUFBO0lBQUFFLFFBQUEsR0FBQUYsQ0FBQTtJQUFBcEIsR0FBQSxHQUFBb0IsQ0FBQTtJQUFBRyxJQUFBLEdBQUFILENBQUE7RUFBQTtFQUN6QixPQUFBSSxTQUFBLElBQW9CbkMsUUFBUSxDQUFDLENBQUM7RUFBQSxJQUFBb0MseUJBQUE7RUFBQSxJQUFBQyxtQkFBQTtFQUFBLElBQUFDLHVCQUFBO0VBQUEsSUFBQUMsd0JBQUE7RUFBQSxJQUFBQyxzQkFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBVixDQUFBLFNBQUF4QixlQUFBLElBQUF3QixDQUFBLFNBQUEzQixpQkFBQSxJQUFBMkIsQ0FBQSxTQUFBN0IsV0FBQSxJQUFBNkIsQ0FBQSxTQUFBMUIsZUFBQSxJQUFBMEIsQ0FBQSxTQUFBekIsZ0JBQUEsSUFBQXlCLENBQUEsU0FBQTVCLGNBQUEsSUFBQTRCLENBQUEsU0FBQUksU0FBQTtJQUM5QixNQUFBVCxLQUFBLEdBQWM1QixRQUFRLENBQUNxQyxTQUFTLENBQUM7SUFHakNFLG1CQUFBLEdBQTRCYixZQUFZLENBQUN0QixXQUFXLEVBQUV3QixLQUFLLENBQUM7SUFDNURjLHNCQUFBLEdBQStCaEIsWUFBWSxDQUFDckIsY0FBYyxFQUFFdUIsS0FBSyxDQUFDO0lBQ2xFVSx5QkFBQSxHQUFrQ1osWUFBWSxDQUFDcEIsaUJBQWlCLEVBQUVzQixLQUFLLENBQUM7SUFDeEVZLHVCQUFBLEdBQWdDZCxZQUFZLENBQUNuQixlQUFlLEVBQUVxQixLQUFLLENBQUM7SUFDcEVhLHdCQUFBLEdBQWlDZixZQUFZLENBQUNsQixnQkFBZ0IsRUFBRW9CLEtBQUssQ0FBQztJQUN0Q2UsRUFBQSxHQUFBakIsWUFBWSxDQUFDakIsZUFBZSxFQUFFbUIsS0FBSyxDQUFDO0lBQUFLLENBQUEsT0FBQXhCLGVBQUE7SUFBQXdCLENBQUEsT0FBQTNCLGlCQUFBO0lBQUEyQixDQUFBLE9BQUE3QixXQUFBO0lBQUE2QixDQUFBLE9BQUExQixlQUFBO0lBQUEwQixDQUFBLE9BQUF6QixnQkFBQTtJQUFBeUIsQ0FBQSxPQUFBNUIsY0FBQTtJQUFBNEIsQ0FBQSxPQUFBSSxTQUFBO0lBQUFKLENBQUEsT0FBQUsseUJBQUE7SUFBQUwsQ0FBQSxPQUFBTSxtQkFBQTtJQUFBTixDQUFBLE9BQUFPLHVCQUFBO0lBQUFQLENBQUEsT0FBQVEsd0JBQUE7SUFBQVIsQ0FBQSxPQUFBUyxzQkFBQTtJQUFBVCxDQUFBLE9BQUFVLEVBQUE7RUFBQTtJQUFBTCx5QkFBQSxHQUFBTCxDQUFBO0lBQUFNLG1CQUFBLEdBQUFOLENBQUE7SUFBQU8sdUJBQUEsR0FBQVAsQ0FBQTtJQUFBUSx3QkFBQSxHQUFBUixDQUFBO0lBQUFTLHNCQUFBLEdBQUFULENBQUE7SUFBQVUsRUFBQSxHQUFBVixDQUFBO0VBQUE7RUFBcEUsTUFBQVcsdUJBQUEsR0FBZ0NELEVBQW9DO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFaLENBQUEsU0FBQUUsUUFBQSxJQUFBRixDQUFBLFNBQUFwQixHQUFBLElBQUFvQixDQUFBLFNBQUFXLHVCQUFBLElBQUFYLENBQUEsU0FBQUsseUJBQUEsSUFBQUwsQ0FBQSxTQUFBTSxtQkFBQSxJQUFBTixDQUFBLFNBQUFPLHVCQUFBLElBQUFQLENBQUEsU0FBQVEsd0JBQUEsSUFBQVIsQ0FBQSxTQUFBUyxzQkFBQSxJQUFBVCxDQUFBLFNBQUFHLElBQUE7SUFHbEVTLEVBQUEsSUFBQyxHQUFHLENBQ0doQyxHQUFHLENBQUhBLElBQUUsQ0FBQyxDQUNLMEIsV0FBbUIsQ0FBbkJBLG9CQUFrQixDQUFDLENBQ2hCRyxjQUFzQixDQUF0QkEsdUJBQXFCLENBQUMsQ0FDbkJKLGlCQUF5QixDQUF6QkEsMEJBQXdCLENBQUMsQ0FDM0JFLGVBQXVCLENBQXZCQSx3QkFBc0IsQ0FBQyxDQUN0QkMsZ0JBQXdCLENBQXhCQSx5QkFBdUIsQ0FBQyxDQUN6QkcsZUFBdUIsQ0FBdkJBLHdCQUFzQixDQUFDLEtBQ3BDUixJQUFJLEVBRVBELFNBQU8sQ0FDVixFQVhDLEdBQUcsQ0FXRTtJQUFBRixDQUFBLE9BQUFFLFFBQUE7SUFBQUYsQ0FBQSxPQUFBcEIsR0FBQTtJQUFBb0IsQ0FBQSxPQUFBVyx1QkFBQTtJQUFBWCxDQUFBLE9BQUFLLHlCQUFBO0lBQUFMLENBQUEsT0FBQU0sbUJBQUE7SUFBQU4sQ0FBQSxPQUFBTyx1QkFBQTtJQUFBUCxDQUFBLE9BQUFRLHdCQUFBO0lBQUFSLENBQUEsT0FBQVMsc0JBQUE7SUFBQVQsQ0FBQSxPQUFBRyxJQUFBO0lBQUFILENBQUEsT0FBQVksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVosQ0FBQTtFQUFBO0VBQUEsT0FYTlksRUFXTTtBQUFBO0FBSVYsZUFBZWQsU0FBUyIsImlnbm9yZUxpc3QiOltdfQ==
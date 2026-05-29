// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、Ref、useCallback、useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { type Ref, useCallback, useEffect, useRef, useState } from 'react';
// 类型依赖 { Except } 来自 type-fest，用于校准终端渲染的数据契约。
import type { Except } from 'type-fest';
// 类型依赖 { DOMElement } 来自 ../dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from '../dom.js';
// 类型依赖 { ClickEvent } 来自 ../events/click-event.js，用于校准终端渲染的数据契约。
import type { ClickEvent } from '../events/click-event.js';
// 类型依赖 { FocusEvent } 来自 ../events/focus-event.js，用于校准终端渲染的数据契约。
import type { FocusEvent } from '../events/focus-event.js';
// 类型依赖 { KeyboardEvent } 来自 ../events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../events/keyboard-event.js';
// 类型依赖 { Styles } 来自 ../styles.js，用于校准终端渲染的数据契约。
import type { Styles } from '../styles.js';
// 引入 Box，将 ./Box.js 中已经封装好的能力接到本文件流程里。
import Box from './Box.js';
// ButtonState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ButtonState = {
  focused: boolean;
  hovered: boolean;
  active: boolean;
};
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = Except<Styles, 'textWrap'> & {
  ref?: Ref<DOMElement>;
  /**
   * Called when the button is activated via Enter, Space, or click.
   */
  // 这个回调绑定到 onAction: () => void;，负责终端渲染在该局部场景下的响应。
  onAction: () => void;
  /**
   * Tab order index. Defaults to 0 (in tab order).
   * Set to -1 for programmatically focusable only.
   */
  tabIndex?: number;
  /**
   * Focus this button when it mounts.
   */
  autoFocus?: boolean;
  /**
   * Render prop receiving the interactive state. Use this to
   * style children based on focus/hover/active — Button itself
   * is intentionally unstyled.
   *
   * If not provided, children render as-is (no state-dependent styling).
   */
  // 这个回调绑定到 children: ((state: ButtonState) => React.ReactNode) | React.ReactNode;，负责终端渲染在该局部场景下的响应。
  children: ((state: ButtonState) => React.ReactNode) | React.ReactNode;
};
// Button 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function Button(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(30);
  // autoFocus 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let autoFocus;
  // 子节点 先占位，稍后的条件分支会根据实际输入补齐它。
  let children;
  // onAction 先占位，稍后的条件分支会根据实际输入补齐它。
  let onAction;
  // ref 引用 先占位，稍后的条件分支会根据实际输入补齐它。
  let ref;
  // style 先占位，稍后的条件分支会根据实际输入补齐它。
  let style;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // 重新解构输入对象，把终端 UI 组件 Button需要的字段同步到本地变量。
    ({
      onAction,
      tabIndex: t1,
      autoFocus,
      children,
      ref,
      ...style
    } = t0);
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `autoFocus`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = autoFocus;
    // $[2] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = children;
    // $[3] 缓存 `onAction`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onAction;
    // $[4] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = ref;
    // $[5] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = style;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
  } else {
    // autoFocus 集合更新为 `$[1]`，确保终端 UI后续读取最新状态。
    autoFocus = $[1];
    // 子节点更新为 `$[2]`，确保终端 UI后续读取最新状态。
    children = $[2];
    // onAction更新为 `$[3]`，确保终端 UI后续读取最新状态。
    onAction = $[3];
    // ref 引用更新为 `$[4]`，确保终端 UI后续读取最新状态。
    ref = $[4];
    // style更新为 `$[5]`，确保终端 UI后续读取最新状态。
    style = $[5];
    // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[6];
  }
  // tabIndex 索引标记终端 UI Button是否启用对应路径。
  const tabIndex = t1 === undefined ? 0 : t1;
  // isFocused 由 React state 持有，setIsFocused 会在用户操作或异步结果返回时触发刷新。
  const [isFocused, setIsFocused] = useState(false);
  // isHovered 由 React state 持有，setIsHovered 会在用户操作或异步结果返回时触发刷新。
  const [isHovered, setIsHovered] = useState(false);
  // isActive 由 React state 持有，setIsActive 会在用户操作或异步结果返回时触发刷新。
  const [isActive, setIsActive] = useState(false);
  // activeTimer保存`useRef`，供终端渲染后续处理使用。
  const activeTimer = useRef(null);
  // t2 暂存 `() => () => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => () => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => () => {
      // 满足 `activeTimer.current` 时，终端渲染执行该分支。
      if (activeTimer.current) {
        // 调用 clearTimeout，触发终端渲染此处需要的副作用。
        clearTimeout(activeTimer.current);
      }
    };
    // t3 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [];
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== onAction) {
    // t4 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = e => {
      // 当 `e.key` 匹配 `"return" || e.key === " "` 时，终端渲染执行对应分支。
      if (e.key === "return" || e.key === " ") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // setIsActive 写入新的状态值，使终端渲染后续读取保持一致。
        setIsActive(true);
        // 调用 onAction，触发终端渲染此处需要的副作用。
        onAction();
        // 满足 `activeTimer.current` 时，终端渲染执行该分支。
        if (activeTimer.current) {
          // 调用 clearTimeout，触发终端渲染此处需要的副作用。
          clearTimeout(activeTimer.current);
        }
        // current更新为 `setTimeout(_temp, 100, setIsActive)`，确保终端 UI后续读取最新状态。
        activeTimer.current = setTimeout(_temp, 100, setIsActive);
      }
    };
    // $[9] 缓存 `onAction`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = onAction;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[10];
  }
  // handleKeyDown沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleKeyDown = t4;
  // t5 暂存 `_e => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onAction) {
    // t5 暂存 `_e => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = _e => {
      // 调用 onAction，触发终端渲染此处需要的副作用。
      onAction();
    };
    // $[11] 缓存 `onAction`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onAction;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // handleClick沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleClick = t5;
  // t6 暂存 `_e_0 => setIsFocused(true)` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `_e_0 => setIsFocused(true)` 生成的渲染片段，后续返回路径直接复用。
    t6 = _e_0 => setIsFocused(true);
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // handleFocus 集合保存`t6`，作为后续临时缓存值处理的输入。
  const handleFocus = t6;
  // t7 暂存 `_e_1 => setIsFocused(false)` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `_e_1 => setIsFocused(false)` 生成的渲染片段，后续返回路径直接复用。
    t7 = _e_1 => setIsFocused(false);
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[14];
  }
  // handleBlur沿用 `t7` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleBlur = t7;
  // t8 暂存 `() => setIsHovered(true)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `() => setIsHovered(true)` 生成的渲染片段，后续返回路径直接复用。
    t8 = () => setIsHovered(true);
    // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[15];
  }
  // handleMouseEnter 命名 `t8`，让后续代码直接表达这个值的用途。
  const handleMouseEnter = t8;
  // t9 暂存 `() => setIsHovered(false)` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `() => setIsHovered(false)` 生成的渲染片段，后续返回路径直接复用。
    t9 = () => setIsHovered(false);
    // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[16];
  }
  // handleMouseLeave沿用 `t9` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleMouseLeave = t9;
  // t10 暂存 `typeof children === "function" ? children(state) : childr...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== children || $[18] !== isActive || $[19] !== isFocused || $[20] !== isHovered) {
    // 状态集中保存终端 UI Button要一起传递的字段。
    const state = {
      focused: isFocused,
      hovered: isHovered,
      active: isActive
    };
    // t10 暂存 `typeof children === "function" ? children(state) : childr...` 生成的渲染片段，后续返回路径直接复用。
    t10 = typeof children === "function" ? children(state) : children;
    // $[17] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = children;
    // $[18] 缓存 `isActive`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = isActive;
    // $[19] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = isFocused;
    // $[20] 缓存 `isHovered`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = isHovered;
    // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[21];
  }
  // 文本内容沿用 `t10` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const content = t10;
  // t11 暂存 `<Box ref={ref} tabIndex={tabIndex} autoFocus={autoFocus} ...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== autoFocus || $[23] !== content || $[24] !== handleClick || $[25] !== handleKeyDown || $[26] !== ref || $[27] !== style || $[28] !== tabIndex) {
    // t11 暂存 `<Box ref={ref} tabIndex={tabIndex} autoFocus={autoFocus} ...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box ref={ref} tabIndex={tabIndex} autoFocus={autoFocus} onKeyDown={handleKeyDown} onClick={handleClick} onFocus={handleFocus} onBlur={handleBlur} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...style}>{content}</Box>;
    // $[22] 缓存 `autoFocus`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = autoFocus;
    // $[23] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = content;
    // $[24] 缓存 `handleClick`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = handleClick;
    // $[25] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = handleKeyDown;
    // $[26] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = ref;
    // $[27] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = style;
    // $[28] 缓存 `tabIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = tabIndex;
    // $[29] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[29];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(setter) {
  // 返回 `setter(false)`，作为终端渲染这次计算的结果。
  return setter(false);
}
export default Button;
// 导出类型定义，让其他模块沿用终端 UI 组件 Button的数据契约。
export type { ButtonState };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlZiIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlUmVmIiwidXNlU3RhdGUiLCJFeGNlcHQiLCJET01FbGVtZW50IiwiQ2xpY2tFdmVudCIsIkZvY3VzRXZlbnQiLCJLZXlib2FyZEV2ZW50IiwiU3R5bGVzIiwiQm94IiwiQnV0dG9uU3RhdGUiLCJmb2N1c2VkIiwiaG92ZXJlZCIsImFjdGl2ZSIsIlByb3BzIiwicmVmIiwib25BY3Rpb24iLCJ0YWJJbmRleCIsImF1dG9Gb2N1cyIsImNoaWxkcmVuIiwic3RhdGUiLCJSZWFjdE5vZGUiLCJCdXR0b24iLCJ0MCIsIiQiLCJfYyIsInN0eWxlIiwidDEiLCJ1bmRlZmluZWQiLCJpc0ZvY3VzZWQiLCJzZXRJc0ZvY3VzZWQiLCJpc0hvdmVyZWQiLCJzZXRJc0hvdmVyZWQiLCJpc0FjdGl2ZSIsInNldElzQWN0aXZlIiwiYWN0aXZlVGltZXIiLCJ0MiIsInQzIiwiU3ltYm9sIiwiZm9yIiwiY3VycmVudCIsImNsZWFyVGltZW91dCIsInQ0IiwiZSIsImtleSIsInByZXZlbnREZWZhdWx0Iiwic2V0VGltZW91dCIsIl90ZW1wIiwiaGFuZGxlS2V5RG93biIsInQ1IiwiX2UiLCJoYW5kbGVDbGljayIsInQ2IiwiX2VfMCIsImhhbmRsZUZvY3VzIiwidDciLCJfZV8xIiwiaGFuZGxlQmx1ciIsInQ4IiwiaGFuZGxlTW91c2VFbnRlciIsInQ5IiwiaGFuZGxlTW91c2VMZWF2ZSIsInQxMCIsImNvbnRlbnQiLCJ0MTEiLCJzZXR0ZXIiXSwic291cmNlcyI6WyJCdXR0b24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwge1xuICB0eXBlIFJlZixcbiAgdXNlQ2FsbGJhY2ssXG4gIHVzZUVmZmVjdCxcbiAgdXNlUmVmLFxuICB1c2VTdGF0ZSxcbn0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IEV4Y2VwdCB9IGZyb20gJ3R5cGUtZmVzdCdcbmltcG9ydCB0eXBlIHsgRE9NRWxlbWVudCB9IGZyb20gJy4uL2RvbS5qcydcbmltcG9ydCB0eXBlIHsgQ2xpY2tFdmVudCB9IGZyb20gJy4uL2V2ZW50cy9jbGljay1ldmVudC5qcydcbmltcG9ydCB0eXBlIHsgRm9jdXNFdmVudCB9IGZyb20gJy4uL2V2ZW50cy9mb2N1cy1ldmVudC5qcydcbmltcG9ydCB0eXBlIHsgS2V5Ym9hcmRFdmVudCB9IGZyb20gJy4uL2V2ZW50cy9rZXlib2FyZC1ldmVudC5qcydcbmltcG9ydCB0eXBlIHsgU3R5bGVzIH0gZnJvbSAnLi4vc3R5bGVzLmpzJ1xuaW1wb3J0IEJveCBmcm9tICcuL0JveC5qcydcblxudHlwZSBCdXR0b25TdGF0ZSA9IHtcbiAgZm9jdXNlZDogYm9vbGVhblxuICBob3ZlcmVkOiBib29sZWFuXG4gIGFjdGl2ZTogYm9vbGVhblxufVxuXG5leHBvcnQgdHlwZSBQcm9wcyA9IEV4Y2VwdDxTdHlsZXMsICd0ZXh0V3JhcCc+ICYge1xuICByZWY/OiBSZWY8RE9NRWxlbWVudD5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIHRoZSBidXR0b24gaXMgYWN0aXZhdGVkIHZpYSBFbnRlciwgU3BhY2UsIG9yIGNsaWNrLlxuICAgKi9cbiAgb25BY3Rpb246ICgpID0+IHZvaWRcbiAgLyoqXG4gICAqIFRhYiBvcmRlciBpbmRleC4gRGVmYXVsdHMgdG8gMCAoaW4gdGFiIG9yZGVyKS5cbiAgICogU2V0IHRvIC0xIGZvciBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzYWJsZSBvbmx5LlxuICAgKi9cbiAgdGFiSW5kZXg/OiBudW1iZXJcbiAgLyoqXG4gICAqIEZvY3VzIHRoaXMgYnV0dG9uIHdoZW4gaXQgbW91bnRzLlxuICAgKi9cbiAgYXV0b0ZvY3VzPzogYm9vbGVhblxuICAvKipcbiAgICogUmVuZGVyIHByb3AgcmVjZWl2aW5nIHRoZSBpbnRlcmFjdGl2ZSBzdGF0ZS4gVXNlIHRoaXMgdG9cbiAgICogc3R5bGUgY2hpbGRyZW4gYmFzZWQgb24gZm9jdXMvaG92ZXIvYWN0aXZlIOKAlCBCdXR0b24gaXRzZWxmXG4gICAqIGlzIGludGVudGlvbmFsbHkgdW5zdHlsZWQuXG4gICAqXG4gICAqIElmIG5vdCBwcm92aWRlZCwgY2hpbGRyZW4gcmVuZGVyIGFzLWlzIChubyBzdGF0ZS1kZXBlbmRlbnQgc3R5bGluZykuXG4gICAqL1xuICBjaGlsZHJlbjogKChzdGF0ZTogQnV0dG9uU3RhdGUpID0+IFJlYWN0LlJlYWN0Tm9kZSkgfCBSZWFjdC5SZWFjdE5vZGVcbn1cblxuZnVuY3Rpb24gQnV0dG9uKHtcbiAgb25BY3Rpb24sXG4gIHRhYkluZGV4ID0gMCxcbiAgYXV0b0ZvY3VzLFxuICBjaGlsZHJlbixcbiAgcmVmLFxuICAuLi5zdHlsZVxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbaXNGb2N1c2VkLCBzZXRJc0ZvY3VzZWRdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtpc0hvdmVyZWQsIHNldElzSG92ZXJlZF0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW2lzQWN0aXZlLCBzZXRJc0FjdGl2ZV0gPSB1c2VTdGF0ZShmYWxzZSlcblxuICBjb25zdCBhY3RpdmVUaW1lciA9IHVzZVJlZjxSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGw+KG51bGwpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgaWYgKGFjdGl2ZVRpbWVyLmN1cnJlbnQpIGNsZWFyVGltZW91dChhY3RpdmVUaW1lci5jdXJyZW50KVxuICAgIH1cbiAgfSwgW10pXG5cbiAgY29uc3QgaGFuZGxlS2V5RG93biA9IHVzZUNhbGxiYWNrKFxuICAgIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09ICdyZXR1cm4nIHx8IGUua2V5ID09PSAnICcpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIHNldElzQWN0aXZlKHRydWUpXG4gICAgICAgIG9uQWN0aW9uKClcbiAgICAgICAgaWYgKGFjdGl2ZVRpbWVyLmN1cnJlbnQpIGNsZWFyVGltZW91dChhY3RpdmVUaW1lci5jdXJyZW50KVxuICAgICAgICBhY3RpdmVUaW1lci5jdXJyZW50ID0gc2V0VGltZW91dChcbiAgICAgICAgICBzZXR0ZXIgPT4gc2V0dGVyKGZhbHNlKSxcbiAgICAgICAgICAxMDAsXG4gICAgICAgICAgc2V0SXNBY3RpdmUsXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9LFxuICAgIFtvbkFjdGlvbl0sXG4gIClcblxuICBjb25zdCBoYW5kbGVDbGljayA9IHVzZUNhbGxiYWNrKFxuICAgIChfZTogQ2xpY2tFdmVudCkgPT4ge1xuICAgICAgb25BY3Rpb24oKVxuICAgIH0sXG4gICAgW29uQWN0aW9uXSxcbiAgKVxuXG4gIGNvbnN0IGhhbmRsZUZvY3VzID0gdXNlQ2FsbGJhY2soKF9lOiBGb2N1c0V2ZW50KSA9PiBzZXRJc0ZvY3VzZWQodHJ1ZSksIFtdKVxuICBjb25zdCBoYW5kbGVCbHVyID0gdXNlQ2FsbGJhY2soKF9lOiBGb2N1c0V2ZW50KSA9PiBzZXRJc0ZvY3VzZWQoZmFsc2UpLCBbXSlcbiAgY29uc3QgaGFuZGxlTW91c2VFbnRlciA9IHVzZUNhbGxiYWNrKCgpID0+IHNldElzSG92ZXJlZCh0cnVlKSwgW10pXG4gIGNvbnN0IGhhbmRsZU1vdXNlTGVhdmUgPSB1c2VDYWxsYmFjaygoKSA9PiBzZXRJc0hvdmVyZWQoZmFsc2UpLCBbXSlcblxuICBjb25zdCBzdGF0ZTogQnV0dG9uU3RhdGUgPSB7XG4gICAgZm9jdXNlZDogaXNGb2N1c2VkLFxuICAgIGhvdmVyZWQ6IGlzSG92ZXJlZCxcbiAgICBhY3RpdmU6IGlzQWN0aXZlLFxuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSB0eXBlb2YgY2hpbGRyZW4gPT09ICdmdW5jdGlvbicgPyBjaGlsZHJlbihzdGF0ZSkgOiBjaGlsZHJlblxuXG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgICAgcmVmPXtyZWZ9XG4gICAgICB0YWJJbmRleD17dGFiSW5kZXh9XG4gICAgICBhdXRvRm9jdXM9e2F1dG9Gb2N1c31cbiAgICAgIG9uS2V5RG93bj17aGFuZGxlS2V5RG93bn1cbiAgICAgIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfVxuICAgICAgb25Gb2N1cz17aGFuZGxlRm9jdXN9XG4gICAgICBvbkJsdXI9e2hhbmRsZUJsdXJ9XG4gICAgICBvbk1vdXNlRW50ZXI9e2hhbmRsZU1vdXNlRW50ZXJ9XG4gICAgICBvbk1vdXNlTGVhdmU9e2hhbmRsZU1vdXNlTGVhdmV9XG4gICAgICB7Li4uc3R5bGV9XG4gICAgPlxuICAgICAge2NvbnRlbnR9XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgQnV0dG9uXG5leHBvcnQgdHlwZSB7IEJ1dHRvblN0YXRlIH1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFDVixLQUFLQyxHQUFHLEVBQ1JDLFdBQVcsRUFDWEMsU0FBUyxFQUNUQyxNQUFNLEVBQ05DLFFBQVEsUUFDSCxPQUFPO0FBQ2QsY0FBY0MsTUFBTSxRQUFRLFdBQVc7QUFDdkMsY0FBY0MsVUFBVSxRQUFRLFdBQVc7QUFDM0MsY0FBY0MsVUFBVSxRQUFRLDBCQUEwQjtBQUMxRCxjQUFjQyxVQUFVLFFBQVEsMEJBQTBCO0FBQzFELGNBQWNDLGFBQWEsUUFBUSw2QkFBNkI7QUFDaEUsY0FBY0MsTUFBTSxRQUFRLGNBQWM7QUFDMUMsT0FBT0MsR0FBRyxNQUFNLFVBQVU7QUFFMUIsS0FBS0MsV0FBVyxHQUFHO0VBQ2pCQyxPQUFPLEVBQUUsT0FBTztFQUNoQkMsT0FBTyxFQUFFLE9BQU87RUFDaEJDLE1BQU0sRUFBRSxPQUFPO0FBQ2pCLENBQUM7QUFFRCxPQUFPLEtBQUtDLEtBQUssR0FBR1gsTUFBTSxDQUFDSyxNQUFNLEVBQUUsVUFBVSxDQUFDLEdBQUc7RUFDL0NPLEdBQUcsQ0FBQyxFQUFFakIsR0FBRyxDQUFDTSxVQUFVLENBQUM7RUFDckI7QUFDRjtBQUNBO0VBQ0VZLFFBQVEsRUFBRSxHQUFHLEdBQUcsSUFBSTtFQUNwQjtB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
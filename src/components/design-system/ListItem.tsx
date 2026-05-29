// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 类型依赖 { ReactNode } 来自 react，用于校准终端渲染的数据契约。
import type { ReactNode } from 'react';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 useDeclaredCursor 终端界面组件，避免在这里重复拼装显示逻辑。
import { useDeclaredCursor } from '../../ink/hooks/use-declared-cursor.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// ListItemProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ListItemProps = {
  /**
   * Whether this item is currently focused (keyboard selection).
   * Shows the pointer indicator (❯) when true.
   */
  isFocused: boolean;

  /**
   * Whether this item is selected (chosen/checked).
   * Shows the checkmark indicator (✓) when true.
   * @default false
   */
  isSelected?: boolean;

  /**
   * The content to display for this item.
   */
  children: ReactNode;

  /**
   * Optional description text displayed below the main content.
   */
  description?: string;

  /**
   * Show a down arrow indicator instead of pointer (for scroll hints).
   * Only applies when not focused.
   */
  showScrollDown?: boolean;

  /**
   * Show an up arrow indicator instead of pointer (for scroll hints).
   * Only applies when not focused.
   */
  showScrollUp?: boolean;

  /**
   * Whether to apply automatic styling to the children based on focus/selection state.
   * - When true (default): children are wrapped in Text with state-based colors
   * - When false: children are rendered as-is, allowing custom styling
   * @default true
   */
  styled?: boolean;

  /**
   * Whether this item is disabled. Disabled items show dimmed text and no indicators.
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether this ListItem should declare the terminal cursor position.
   * Set false when a child (e.g. BaseTextInput) declares its own cursor.
   * @default true
   */
  declareCursor?: boolean;
};

/**
 * A list item component for selection UIs (dropdowns, multi-selects, menus).
 *
 * Handles the common pattern of:
 * - Pointer indicator (❯) for focused items
 * - Checkmark indicator (✓) for selected items
 * - Scroll indicators (↓↑) for truncated lists
 * - Color states for focus/selection
 *
 * @example
 * // Basic usage in a selection list
 * {options.map((option, i) => (
 *   <ListItem
 *     key={option.id}
 *     isFocused={focusIndex === i}
 *     isSelected={selectedId === option.id}
 *   >
 *     {option.label}
 *   </ListItem>
 * ))}
 *
 * @example
 * // With scroll indicators
 * <ListItem isFocused={false} showScrollUp>First visible item</ListItem>
 * ...
 * <ListItem isFocused={false} showScrollDown>Last visible item</ListItem>
 *
 * @example
 * // With description
 * <ListItem isFocused isSelected={false} description="Secondary text here">
 *   Primary text
 * </ListItem>
 *
 * @example
 * // Custom children styling (styled=false)
 * <ListItem isFocused styled={false}>
 *   <Text color="claude">Custom styled content</Text>
 * </ListItem>
 */
// ListItem 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ListItem(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(32);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    isFocused,
    isSelected: t1,
    children,
    description,
    showScrollDown,
    showScrollUp,
    styled: t2,
    disabled: t3,
    declareCursor
  } = t0;
  // isSelected标记终端 UI List Item是否启用对应路径。
  const isSelected = t1 === undefined ? false : t1;
  // styled标记终端 UI List Item是否启用对应路径。
  const styled = t2 === undefined ? true : t2;
  // disabled标记终端 UI List Item是否启用对应路径。
  const disabled = t3 === undefined ? false : t3;
  // t4 暂存 `function renderIndicator() {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== disabled || $[1] !== isFocused || $[2] !== showScrollDown || $[3] !== showScrollUp) {
    // t4 暂存 `function renderIndicator() {` 生成的渲染片段，后续返回路径直接复用。
    t4 = function renderIndicator() {
      // 满足 `disabled` 时，终端渲染执行该分支。
      if (disabled) {
        // 返回 `<Text> </Text>`，作为终端渲染这次计算的结果。
        return <Text> </Text>;
      }
      // 满足 `isFocused` 时，终端渲染执行该分支。
      if (isFocused) {
        // 返回 `<Text color="suggestion">{figures.pointer}</Text>`，作为终端渲染这次计算的结果。
        return <Text color="suggestion">{figures.pointer}</Text>;
      }
      // 满足 `showScrollDown` 时，终端渲染执行该分支。
      if (showScrollDown) {
        // 返回 `<Text dimColor={true}>{figures.arrowDown}</Text>`，作为终端渲染这次计算的结果。
        return <Text dimColor={true}>{figures.arrowDown}</Text>;
      }
      // 满足 `showScrollUp` 时，终端渲染执行该分支。
      if (showScrollUp) {
        // 返回 `<Text dimColor={true}>{figures.arrowUp}</Text>`，作为终端渲染这次计算的结果。
        return <Text dimColor={true}>{figures.arrowUp}</Text>;
      }
      // 返回 `<Text> </Text>`，作为终端渲染这次计算的结果。
      return <Text> </Text>;
    };
    // $[0] 缓存 `disabled`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = disabled;
    // $[1] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = isFocused;
    // $[2] 缓存 `showScrollDown`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = showScrollDown;
    // $[3] 缓存 `showScrollUp`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = showScrollUp;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // renderIndicator 命名 `t4`，让后续代码直接表达这个值的用途。
  const renderIndicator = t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== disabled || $[6] !== isFocused || $[7] !== isSelected || $[8] !== styled) {
    // getTextColor读取`getTextColor`，供终端渲染后续处理使用。
    const getTextColor = function getTextColor() {
      // 满足 `disabled` 时，终端渲染执行该分支。
      if (disabled) {
        // 返回 `"inactive"`，作为终端渲染这次计算的结果。
        return "inactive";
      }
      // styled缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!styled) {
        // 终端 UI 组件 List Item在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `isSelected` 时，终端渲染执行该分支。
      if (isSelected) {
        // 返回 `"success"`，作为终端渲染这次计算的结果。
        return "success";
      }
      // 满足 `isFocused` 时，终端渲染执行该分支。
      if (isFocused) {
        // 返回 `"suggestion"`，作为终端渲染这次计算的结果。
        return "suggestion";
      }
    };
    // t5 暂存 `getTextColor()` 生成的渲染片段，后续返回路径直接复用。
    t5 = getTextColor();
    // $[5] 缓存 `disabled`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = disabled;
    // $[6] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = isFocused;
    // $[7] 缓存 `isSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = isSelected;
    // $[8] 缓存 `styled`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = styled;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // textColor 命名 `t5`，让后续代码直接表达这个值的用途。
  const textColor = t5;
  // t6标记终端 UI List Item是否启用对应路径。
  const t6 = isFocused && !disabled && declareCursor !== false;
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t6) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      line: 0,
      column: 0,
      active: t6
    };
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // cursorRef 引用保存`useDeclaredCursor`，供终端渲染后续处理使用。
  const cursorRef = useDeclaredCursor(t7);
  // t8 暂存 `renderIndicator()` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== renderIndicator) {
    // t8 暂存 `renderIndicator()` 生成的渲染片段，后续返回路径直接复用。
    t8 = renderIndicator();
    // $[12] 缓存 `renderIndicator`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = renderIndicator;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // t9 暂存 `styled ? <Text color={textColor} dimColor={disabled}>{chi...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== children || $[15] !== disabled || $[16] !== styled || $[17] !== textColor) {
    // t9 暂存 `styled ? <Text color={textColor} dimColor={disabled}>{chi...` 生成的渲染片段，后续返回路径直接复用。
    t9 = styled ? <Text color={textColor} dimColor={disabled}>{children}</Text> : children;
    // $[14] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = children;
    // $[15] 缓存 `disabled`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = disabled;
    // $[16] 缓存 `styled`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = styled;
    // $[17] 缓存 `textColor`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = textColor;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // t10 暂存 `isSelected && !disabled && <Text color="success">{figures...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== disabled || $[20] !== isSelected) {
    // t10 暂存 `isSelected && !disabled && <Text color="success">{figures...` 生成的渲染片段，后续返回路径直接复用。
    t10 = isSelected && !disabled && <Text color="success">{figures.tick}</Text>;
    // $[19] 缓存 `disabled`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = disabled;
    // $[20] 缓存 `isSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = isSelected;
    // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[21];
  }
  // t11 暂存 `<Box flexDirection="row" gap={1}>{t8}{t9}{t10}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== t10 || $[23] !== t8 || $[24] !== t9) {
    // t11 暂存 `<Box flexDirection="row" gap={1}>{t8}{t9}{t10}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box flexDirection="row" gap={1}>{t8}{t9}{t10}</Box>;
    // $[22] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t10;
    // $[23] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t8;
    // $[24] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t9;
    // $[25] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[25];
  }
  // t12 暂存 `description && <Box paddingLeft={2}><Text color="inactive...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== description) {
    // t12 暂存 `description && <Box paddingLeft={2}><Text color="inactive...` 生成的渲染片段，后续返回路径直接复用。
    t12 = description && <Box paddingLeft={2}><Text color="inactive">{description}</Text></Box>;
    // $[26] 缓存 `description`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = description;
    // $[27] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[27];
  }
  // t13 暂存 `<Box ref={cursorRef} flexDirection="column">{t11}{t12}</B...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== cursorRef || $[29] !== t11 || $[30] !== t12) {
    // t13 暂存 `<Box ref={cursorRef} flexDirection="column">{t11}{t12}</B...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Box ref={cursorRef} flexDirection="column">{t11}{t12}</Box>;
    // $[28] 缓存 `cursorRef`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = cursorRef;
    // $[29] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t11;
    // $[30] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t12;
    // $[31] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[31];
  }
  // 返回 `t13`，作为终端渲染这次计算的结果。
  return t13;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3ROb2RlIiwiUmVhY3QiLCJ1c2VEZWNsYXJlZEN1cnNvciIsIkJveCIsIlRleHQiLCJMaXN0SXRlbVByb3BzIiwiaXNGb2N1c2VkIiwiaXNTZWxlY3RlZCIsImNoaWxkcmVuIiwiZGVzY3JpcHRpb24iLCJzaG93U2Nyb2xsRG93biIsInNob3dTY3JvbGxVcCIsInN0eWxlZCIsImRpc2FibGVkIiwiZGVjbGFyZUN1cnNvciIsIkxpc3RJdGVtIiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwidDMiLCJ1bmRlZmluZWQiLCJ0NCIsInJlbmRlckluZGljYXRvciIsInBvaW50ZXIiLCJhcnJvd0Rvd24iLCJhcnJvd1VwIiwidDUiLCJnZXRUZXh0Q29sb3IiLCJ0ZXh0Q29sb3IiLCJ0NiIsInQ3IiwibGluZSIsImNvbHVtbiIsImFjdGl2ZSIsImN1cnNvclJlZiIsInQ4IiwidDkiLCJ0MTAiLCJ0aWNrIiwidDExIiwidDEyIiwidDEzIl0sInNvdXJjZXMiOlsiTGlzdEl0ZW0udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgdHlwZSB7IFJlYWN0Tm9kZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRGVjbGFyZWRDdXJzb3IgfSBmcm9tICcuLi8uLi9pbmsvaG9va3MvdXNlLWRlY2xhcmVkLWN1cnNvci5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcblxudHlwZSBMaXN0SXRlbVByb3BzID0ge1xuICAvKipcbiAgICogV2hldGhlciB0aGlzIGl0ZW0gaXMgY3VycmVudGx5IGZvY3VzZWQgKGtleWJvYXJkIHNlbGVjdGlvbikuXG4gICAqIFNob3dzIHRoZSBwb2ludGVyIGluZGljYXRvciAo4p2vKSB3aGVuIHRydWUuXG4gICAqL1xuICBpc0ZvY3VzZWQ6IGJvb2xlYW5cblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGl0ZW0gaXMgc2VsZWN0ZWQgKGNob3Nlbi9jaGVja2VkKS5cbiAgICogU2hvd3MgdGhlIGNoZWNrbWFyayBpbmRpY2F0b3IgKOKckykgd2hlbiB0cnVlLlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgaXNTZWxlY3RlZD86IGJvb2xlYW5cblxuICAvKipcbiAgICogVGhlIGNvbnRlbnQgdG8gZGlzcGxheSBmb3IgdGhpcyBpdGVtLlxuICAgKi9cbiAgY2hpbGRyZW46IFJlYWN0Tm9kZVxuXG4gIC8qKlxuICAgKiBPcHRpb25hbCBkZXNjcmlwdGlvbiB0ZXh0IGRpc3BsYXllZCBiZWxvdyB0aGUgbWFpbiBjb250ZW50LlxuICAgKi9cbiAgZGVzY3JpcHRpb24/OiBzdHJpbmdcblxuICAvKipcbiAgICogU2hvdyBhIGRvd24gYXJyb3cgaW5kaWNhdG9yIGluc3RlYWQgb2YgcG9pbnRlciAoZm9yIHNjcm9sbCBoaW50cykuXG4gICAqIE9ubHkgYXBwbGllcyB3aGVuIG5vdCBmb2N1c2VkLlxuICAgKi9cbiAgc2hvd1Njcm9sbERvd24/OiBib29sZWFuXG5cbiAgLyoqXG4gICAqIFNob3cgYW4gdXAgYXJyb3cgaW5kaWNhdG9yIGluc3RlYWQgb2YgcG9pbnRlciAoZm9yIHNjcm9sbCBoaW50cykuXG4gICAqIE9ubHkgYXBwbGllcyB3aGVuIG5vdCBmb2N1c2VkLlxuICAgKi9cbiAgc2hvd1Njcm9sbFVwPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGFwcGx5IGF1dG9tYXRpYyBzdHlsaW5nIHRvIHRoZSBjaGlsZHJlbiBiYXNlZCBvbiBmb2N1cy9zZWxlY3Rpb24gc3RhdGUuXG4gICAqIC0gV2hlbiB0cnVlIChkZWZhdWx0KTogY2hpbGRyZW4gYXJlIHdyYXBwZWQgaW4gVGV4dCB3aXRoIHN0YXRlLWJhc2VkIGNvbG9yc1xuICAgKiAtIFdoZW4gZmFsc2U6IGNoaWxkcmVuIGFyZSByZW5kZXJlZCBhcy1pcywgYWxsb3dpbmcgY3VzdG9tIHN0eWxpbmdcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgc3R5bGVkPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgaXRlbSBpcyBkaXNhYmxlZC4gRGlzYWJsZWQgaXRlbXMgc2hvdyBkaW1tZWQgdGV4dCBhbmQgbm8gaW5kaWNhdG9ycy5cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGRpc2FibGVkPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgTGlzdEl0ZW0gc2hvdWxkIGRlY2xhcmUgdGhlIHRlcm1pbmFsIGN1cnNvciBwb3NpdGlvbi5cbiAgICogU2V0IGZhbHNlIHdoZW4gYSBjaGlsZCAoZS5nLiBCYXNlVGV4dElucHV0KSBkZWNsYXJlcyBpdHMgb3duIGN1cnNvci5cbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgZGVjbGFyZUN1cnNvcj86IGJvb2xlYW5cbn1cblxuLyoqXG4gKiBBIGxpc3QgaXRlbSBjb21wb25lbnQgZm9yIHNlbGVjdGlvbiBVSXMgKGRyb3Bkb3ducywgbXVsdGktc2VsZWN0cywgbWVudXMpLlxuICpcbiAqIEhhbmRsZXMgdGhlIGNvbW1vbiBwYXR0ZXJuIG9mOlxuICogLSBQb2ludGVyIGluZGljYXRvciAo4p2vKSBmb3IgZm9jdXNlZCBpdGVtc1xuICogLSBDaGVja21hcmsgaW5kaWNhdG9yICjinJMpIGZvciBzZWxlY3RlZCBpdGVtc1xuICogLSBTY3JvbGwgaW5kaWNhdG9ycyAo4oaT4oaRKSBmb3IgdHJ1bmNhdGVkIGxpc3RzXG4gKiAtIENvbG9yIHN0YXRlcyBmb3IgZm9jdXMvc2VsZWN0aW9uXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIEJhc2ljIHVzYWdlIGluIGEgc2VsZWN0aW9uIGxpc3RcbiAqIHtvcHRpb25zLm1hcCgob3B0aW9uLCBpKSA9PiAoXG4gKiAgIDxMaXN0SXRlbVxuICogICAgIGtleT17b3B0aW9uLmlkfVxuICogICAgIGlzRm9jdXNlZD17Zm9jdXNJbmRleCA9PT0gaX1cbiAqICAgICBpc1NlbGVjdGVkPXtzZWxlY3RlZElkID09PSBvcHRpb24uaWR9XG4gKiAgID5cbiAqICAgICB7b3B0aW9uLmxhYmVsfVxuICogICA8L0xpc3RJdGVtPlxuICogKSl9XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIFdpdGggc2Nyb2xsIGluZGljYXRvcnNcbiAqIDxMaXN0SXRlbSBpc0ZvY3VzZWQ9e2ZhbHNlfSBzaG93U2Nyb2xsVXA+Rmlyc3QgdmlzaWJsZSBpdGVtPC9MaXN0SXRlbT5cbiAqIC4uLlxuICogPExpc3RJdGVtIGlzRm9jdXNlZD17ZmFsc2V9IHNob3dTY3JvbGxEb3duPkxhc3QgdmlzaWJsZSBpdGVtPC9MaXN0SXRlbT5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gV2l0aCBkZXNjcmlwdGlvblxuICogPExpc3RJdGVtIGlzRm9jdXNlZCBpc1NlbGVjdGVkPXtmYWxzZX0gZGVzY3JpcHRpb249XCJTZWNvbmRhcnkgdGV4dCBoZXJlXCI+XG4gKiAgIFByaW1hcnkgdGV4dFxuICogPC9MaXN0SXRlbT5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQ3VzdG9tIGNoaWxkcmVuIHN0eWxpbmcgKHN0eWxlZD1mYWxzZSlcbiAqIDxMaXN0SXRlbSBpc0ZvY3VzZWQgc3R5bGVkPXtmYWxzZX0+XG4gKiAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+Q3VzdG9tIHN0eWxlZCBjb250ZW50PC9UZXh0PlxuICogPC9MaXN0SXRlbT5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIExpc3RJdGVtKHtcbiAgaXNGb2N1c2VkLFxuICBpc1NlbGVjdGVkID0gZmFsc2UsXG4gIGNoaWxkcmVuLFxuICBkZXNjcmlwdGlvbixcbiAgc2hvd1Njcm9sbERvd24sXG4gIHNob3dTY3JvbGxVcCxcbiAgc3R5bGVkID0gdHJ1ZSxcbiAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgZGVjbGFyZUN1cnNvcixcbn06IExpc3RJdGVtUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBEZXRlcm1pbmUgd2hpY2ggaW5kaWNhdG9yIHRvIHNob3dcbiAgZnVuY3Rpb24gcmVuZGVySW5kaWNhdG9yKCk6IFJlYWN0Tm9kZSB7XG4gICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gPFRleHQ+IDwvVGV4dD5cbiAgICB9XG5cbiAgICBpZiAoaXNGb2N1c2VkKSB7XG4gICAgICByZXR1cm4gPFRleHQgY29sb3I9XCJzdWdnZXN0aW9uXCI+e2ZpZ3VyZXMucG9pbnRlcn08L1RleHQ+XG4gICAgfVxuXG4gICAgaWYgKHNob3dTY3JvbGxEb3duKSB7XG4gICAgICByZXR1cm4gPFRleHQgZGltQ29sb3I+e2ZpZ3VyZXMuYXJyb3dEb3dufTwvVGV4dD5cbiAgICB9XG5cbiAgICBpZiAoc2hvd1Njcm9sbFVwKSB7XG4gICAgICByZXR1cm4gPFRleHQgZGltQ29sb3I+e2ZpZ3VyZXMuYXJyb3dVcH08L1RleHQ+XG4gICAgfVxuXG4gICAgcmV0dXJuIDxUZXh0PiA8L1RleHQ+XG4gIH1cblxuICAvLyBEZXRlcm1pbmUgdGV4dCBjb2xvciBiYXNlZCBvbiBzdGF0ZVxuICBmdW5jdGlvbiBnZXRUZXh0Q29sb3IoKTogJ3N1Y2Nlc3MnIHwgJ3N1Z2dlc3Rpb24nIHwgJ2luYWN0aXZlJyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gJ2luYWN0aXZlJ1xuICAgIH1cblxuICAgIGlmICghc3R5bGVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcbiAgICAgIHJldHVybiAnc3VjY2VzcydcbiAgICB9XG5cbiAgICBpZiAoaXNGb2N1c2VkKSB7XG4gICAgICByZXR1cm4gJ3N1Z2dlc3Rpb24nXG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgY29uc3QgdGV4dENvbG9yID0gZ2V0VGV4dENvbG9yKClcblxuICAvLyBQYXJrIHRoZSBuYXRpdmUgdGVybWluYWwgY3Vyc29yIG9uIHRoZSBwb2ludGVyIGluZGljYXRvciBzbyBzY3JlZW5cbiAgLy8gcmVhZGVycyAvIG1hZ25pZmllcnMgdHJhY2sgdGhlIGZvY3VzZWQgaXRlbS4gKDAsMCkgaXMgdGhlIHRvcC1sZWZ0IG9mXG4gIC8vIHRoaXMgQm94LCB3aGVyZSB0aGUgcG9pbnRlciByZW5kZXJzLlxuICBjb25zdCBjdXJzb3JSZWYgPSB1c2VEZWNsYXJlZEN1cnNvcih7XG4gICAgbGluZTogMCxcbiAgICBjb2x1bW46IDAsXG4gICAgYWN0aXZlOiBpc0ZvY3VzZWQgJiYgIWRpc2FibGVkICYmIGRlY2xhcmVDdXJzb3IgIT09IGZhbHNlLFxuICB9KVxuXG4gIHJldHVybiAoXG4gICAgPEJveCByZWY9e2N1cnNvclJlZn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsxfT5cbiAgICAgICAge3JlbmRlckluZGljYXRvcigpfVxuICAgICAgICB7c3R5bGVkID8gKFxuICAgICAgICAgIDxUZXh0IGNvbG9yPXt0ZXh0Q29sb3J9IGRpbUNvbG9yPXtkaXNhYmxlZH0+XG4gICAgICAgICAgICB7Y2hpbGRyZW59XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApIDogKFxuICAgICAgICAgIGNoaWxkcmVuXG4gICAgICAgICl9XG4gICAgICAgIHtpc1NlbGVjdGVkICYmICFkaXNhYmxlZCAmJiA8VGV4dCBjb2xvcj1cInN1Y2Nlc3NcIj57ZmlndXJlcy50aWNrfTwvVGV4dD59XG4gICAgICA8L0JveD5cbiAgICAgIHtkZXNjcmlwdGlvbiAmJiAoXG4gICAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiaW5hY3RpdmVcIj57ZGVzY3JpcHRpb259PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLGNBQWNDLFNBQVMsUUFBUSxPQUFPO0FBQ3RD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
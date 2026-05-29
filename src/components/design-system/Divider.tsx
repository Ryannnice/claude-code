// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 引入 Ansi、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Text } from '../../ink.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// DividerProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DividerProps = {
  /**
   * Width of the divider in characters.
   * Defaults to terminal width.
   */
  width?: number;

  /**
   * Theme color for the divider.
   * If not provided, dimColor is used.
   */
  color?: keyof Theme;

  /**
   * Character to use for the divider line.
   * @default '─'
   */
  char?: string;

  /**
   * Padding to subtract from the width (e.g., for indentation).
   * @default 0
   */
  padding?: number;

  /**
   * Title shown in the middle of the divider.
   * May contain ANSI codes (e.g., chalk-styled text).
   *
   * @example
   * // ─────────── Title ───────────
   * <Divider title="Title" />
   */
  title?: string;
};

/**
 * A horizontal divider line.
 *
 * @example
 * // Full-width dimmed divider
 * <Divider />
 *
 * @example
 * // Colored divider
 * <Divider color="suggestion" />
 *
 * @example
 * // Fixed width
 * <Divider width={40} />
 *
 * @example
 * // Full width minus padding (for indented content)
 * <Divider padding={4} />
 *
 * @example
 * // With centered title
 * <Divider title="3 new messages" />
 */
// Divider 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Divider(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(21);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    width,
    color,
    char: t1,
    padding: t2,
    title
  } = t0;
  // char标记终端 UI Divider是否启用对应路径。
  const char = t1 === undefined ? "\u2500" : t1;
  // padding标记终端 UI Divider是否启用对应路径。
  const padding = t2 === undefined ? 0 : t2;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns: terminalWidth
  } = useTerminalSize();
  // effectiveWidth保存`Math.max`，供终端渲染后续处理使用。
  const effectiveWidth = Math.max(0, (width ?? terminalWidth) - padding);
  // 满足 `title` 时，终端渲染执行该分支。
  if (title) {
    // titleWidth 标题保存`stringWidth`，供终端渲染后续处理使用。
    const titleWidth = stringWidth(title) + 2;
    // sideWidth保存`Math.max`，供终端渲染后续处理使用。
    const sideWidth = Math.max(0, effectiveWidth - titleWidth);
    // leftWidth保存`Math.floor`，供终端渲染后续处理使用。
    const leftWidth = Math.floor(sideWidth / 2);
    // rightWidth保存`sideWidth - leftWidth`，供终端 UI Divider后续判断或输出使用。
    const rightWidth = sideWidth - leftWidth;
    // t3标记终端 UI Divider是否启用对应路径。
    const t3 = !color;
    // t4 暂存 `char.repeat(leftWidth)` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== char || $[1] !== leftWidth) {
      // t4 暂存 `char.repeat(leftWidth)` 生成的渲染片段，后续返回路径直接复用。
      t4 = char.repeat(leftWidth);
      // $[0] 缓存 `char`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = char;
      // $[1] 缓存 `leftWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = leftWidth;
      // $[2] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[2];
    }
    // t5 暂存 `<Text dimColor={true}><Ansi>{title}</Ansi></Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== title) {
      // t5 暂存 `<Text dimColor={true}><Ansi>{title}</Ansi></Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text dimColor={true}><Ansi>{title}</Ansi></Text>;
      // $[3] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = title;
      // $[4] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[4];
    }
    // t6 暂存 `char.repeat(rightWidth)` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== char || $[6] !== rightWidth) {
      // t6 暂存 `char.repeat(rightWidth)` 生成的渲染片段，后续返回路径直接复用。
      t6 = char.repeat(rightWidth);
      // $[5] 缓存 `char`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = char;
      // $[6] 缓存 `rightWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = rightWidth;
      // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[7];
    }
    // t7 暂存 `<Text color={color} dimColor={t3}>{t4}{" "}{t5}{" "}{t6}<...` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[8] !== color || $[9] !== t3 || $[10] !== t4 || $[11] !== t5 || $[12] !== t6) {
      // t7 暂存 `<Text color={color} dimColor={t3}>{t4}{" "}{t5}{" "}{t6}<...` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text color={color} dimColor={t3}>{t4}{" "}{t5}{" "}{t6}</Text>;
      // $[8] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = color;
      // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t3;
      // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t4;
      // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t5;
      // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t6;
      // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[13];
    }
    // 返回 `t7`，作为终端渲染这次计算的结果。
    return t7;
  }
  // t3标记终端 UI Divider是否启用对应路径。
  const t3 = !color;
  // t4 暂存 `char.repeat(effectiveWidth)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== char || $[15] !== effectiveWidth) {
    // t4 暂存 `char.repeat(effectiveWidth)` 生成的渲染片段，后续返回路径直接复用。
    t4 = char.repeat(effectiveWidth);
    // $[14] 缓存 `char`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = char;
    // $[15] 缓存 `effectiveWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = effectiveWidth;
    // $[16] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[16];
  }
  // t5 暂存 `<Text color={color} dimColor={t3}>{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== color || $[18] !== t3 || $[19] !== t4) {
    // t5 暂存 `<Text color={color} dimColor={t3}>{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color={color} dimColor={t3}>{t4}</Text>;
    // $[17] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = color;
    // $[18] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t3;
    // $[19] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t4;
    // $[20] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[20];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVRlcm1pbmFsU2l6ZSIsInN0cmluZ1dpZHRoIiwiQW5zaSIsIlRleHQiLCJUaGVtZSIsIkRpdmlkZXJQcm9wcyIsIndpZHRoIiwiY29sb3IiLCJjaGFyIiwicGFkZGluZyIsInRpdGxlIiwiRGl2aWRlciIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsInVuZGVmaW5lZCIsImNvbHVtbnMiLCJ0ZXJtaW5hbFdpZHRoIiwiZWZmZWN0aXZlV2lkdGgiLCJNYXRoIiwibWF4IiwidGl0bGVXaWR0aCIsInNpZGVXaWR0aCIsImxlZnRXaWR0aCIsImZsb29yIiwicmlnaHRXaWR0aCIsInQzIiwidDQiLCJyZXBlYXQiLCJ0NSIsInQ2IiwidDciXSwic291cmNlcyI6WyJEaXZpZGVyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi8uLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyBzdHJpbmdXaWR0aCB9IGZyb20gJy4uLy4uL2luay9zdHJpbmdXaWR0aC5qcydcbmltcG9ydCB7IEFuc2ksIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lIH0gZnJvbSAnLi4vLi4vdXRpbHMvdGhlbWUuanMnXG5cbnR5cGUgRGl2aWRlclByb3BzID0ge1xuICAvKipcbiAgICogV2lkdGggb2YgdGhlIGRpdmlkZXIgaW4gY2hhcmFjdGVycy5cbiAgICogRGVmYXVsdHMgdG8gdGVybWluYWwgd2lkdGguXG4gICAqL1xuICB3aWR0aD86IG51bWJlclxuXG4gIC8qKlxuICAgKiBUaGVtZSBjb2xvciBmb3IgdGhlIGRpdmlkZXIuXG4gICAqIElmIG5vdCBwcm92aWRlZCwgZGltQ29sb3IgaXMgdXNlZC5cbiAgICovXG4gIGNvbG9yPzoga2V5b2YgVGhlbWVcblxuICAvKipcbiAgICogQ2hhcmFjdGVyIHRvIHVzZSBmb3IgdGhlIGRpdmlkZXIgbGluZS5cbiAgICogQGRlZmF1bHQgJ+KUgCdcbiAgICovXG4gIGNoYXI/OiBzdHJpbmdcblxuICAvKipcbiAgICogUGFkZGluZyB0byBzdWJ0cmFjdCBmcm9tIHRoZSB3aWR0aCAoZS5nLiwgZm9yIGluZGVudGF0aW9uKS5cbiAgICogQGRlZmF1bHQgMFxuICAgKi9cbiAgcGFkZGluZz86IG51bWJlclxuXG4gIC8qKlxuICAgKiBUaXRsZSBzaG93biBpbiB0aGUgbWlkZGxlIG9mIHRoZSBkaXZpZGVyLlxuICAgKiBNYXkgY29udGFpbiBBTlNJIGNvZGVzIChlLmcuLCBjaGFsay1zdHlsZWQgdGV4dCkuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCBUaXRsZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICogPERpdmlkZXIgdGl0bGU9XCJUaXRsZVwiIC8+XG4gICAqL1xuICB0aXRsZT86IHN0cmluZ1xufVxuXG4vKipcbiAqIEEgaG9yaXpvbnRhbCBkaXZpZGVyIGxpbmUuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIEZ1bGwtd2lkdGggZGltbWVkIGRpdmlkZXJcbiAqIDxEaXZpZGVyIC8+XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIENvbG9yZWQgZGl2aWRlclxuICogPERpdmlkZXIgY29sb3I9XCJzdWdnZXN0aW9uXCIgLz5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gRml4ZWQgd2lkdGhcbiAqIDxEaXZpZGVyIHdpZHRoPXs0MH0gLz5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gRnVsbCB3aWR0aCBtaW51cyBwYWRkaW5nIChmb3IgaW5kZW50ZWQgY29udGVudClcbiAqIDxEaXZpZGVyIHBhZGRpbmc9ezR9IC8+XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIFdpdGggY2VudGVyZWQgdGl0bGVcbiAqIDxEaXZpZGVyIHRpdGxlPVwiMyBuZXcgbWVzc2FnZXNcIiAvPlxuICovXG5leHBvcnQgZnVuY3Rpb24gRGl2aWRlcih7XG4gIHdpZHRoLFxuICBjb2xvcixcbiAgY2hhciA9ICfilIAnLFxuICBwYWRkaW5nID0gMCxcbiAgdGl0bGUsXG59OiBEaXZpZGVyUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IGNvbHVtbnM6IHRlcm1pbmFsV2lkdGggfSA9IHVzZVRlcm1pbmFsU2l6ZSgpXG4gIGNvbnN0IGVmZmVjdGl2ZVdpZHRoID0gTWF0aC5tYXgoMCwgKHdpZHRoID8/IHRlcm1pbmFsV2lkdGgpIC0gcGFkZGluZylcblxuICBpZiAodGl0bGUpIHtcbiAgICBjb25zdCB0aXRsZVdpZHRoID0gc3RyaW5nV2lkdGgodGl0bGUpICsgMiAvLyArMiBmb3Igc3BhY2VzIGFyb3VuZCB0aXRsZVxuICAgIGNvbnN0IHNpZGVXaWR0aCA9IE1hdGgubWF4KDAsIGVmZmVjdGl2ZVdpZHRoIC0gdGl0bGVXaWR0aClcbiAgICBjb25zdCBsZWZ0V2lkdGggPSBNYXRoLmZsb29yKHNpZGVXaWR0aCAvIDIpXG4gICAgY29uc3QgcmlnaHRXaWR0aCA9IHNpZGVXaWR0aCAtIGxlZnRXaWR0aFxuICAgIHJldHVybiAoXG4gICAgICA8VGV4dCBjb2xvcj17Y29sb3J9IGRpbUNvbG9yPXshY29sb3J9PlxuICAgICAgICB7Y2hhci5yZXBlYXQobGVmdFdpZHRoKX17JyAnfVxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICA8QW5zaT57dGl0bGV9PC9BbnNpPlxuICAgICAgICA8L1RleHQ+eycgJ31cbiAgICAgICAge2NoYXIucmVwZWF0KHJpZ2h0V2lkdGgpfVxuICAgICAgPC9UZXh0PlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFRleHQgY29sb3I9e2NvbG9yfSBkaW1Db2xvcj17IWNvbG9yfT5cbiAgICAgIHtjaGFyLnJlcGVhdChlZmZlY3RpdmVXaWR0aCl9XG4gICAgPC9UZXh0PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxlQUFlLFFBQVEsZ0NBQWdDO0FBQ2hFLFNBQVNDLFdBQVcsUUFBUSwwQkFBMEI7QUFDdEQsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN6QyxjQUFjQyxLQUFLLFFBQVEsc0JBQXNCO0FBRWpELEtBQUtDLFlBQVksR0FBRztFQUNsQjtBQUNGO0FBQ0E7QUFDQTtFQUNFQyxLQUFLLENBQUMsRUFBRSxNQUFNOztFQUVkO0FBQ0Y7QUFDQTtBQUNBO0VBQ0VDLEtBQUssQ0FBQyxFQUFFLE1BQU1ILEtBQUs7O0VBRW5CO0FBQ0Y7QUFDQTtBQUNBO0VBQ0VJLElBQUksQ0FBQyxFQUFFLE1BQU07O0VBRWI7QUFDRjtBQUNBO0FBQ0E7RUFDRUMsT0FBTyxDQUFDLEVBQUUsTUFBTTs7RUFFaEI7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxLQUFLLENBQUMsRUFBRSxNQUFNO0FBQ2hCLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBQUMsUUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFpQjtJQUFBUixLQUFBO0lBQUFDLEtBQUE7SUFBQUMsSUFBQSxFQUFBTyxFQUFBO0lBQUFOLE9BQUEsRUFBQU8sRUFBQTtJQUFBTjtFQUFBLElBQUFFLEVBTVQ7RUFIYixNQUFBSixJQUFBLEdBQUFPLEVBQVUsS0FBVkUsU0FBVSxHQUFWLFFBQVUsR0FBVkYsRUFBVTtFQUNWLE1BQUFOLE9BQUEsR0FBQU8sRUFBVyxLQUFYQyxTQUFXLEdBQVgsQ0FBVyxHQUFYRCxFQUFXO0VBR1g7SUFBQUUsT0FBQSxFQUFBQztFQUFBLElBQW1DbkIsZUFBZSxDQUFDLENBQUM7RUFDcEQsTUFBQW9CLGNBQUEsR0FBdUJDLElBQUksQ0FBQUMsR0FBSSxDQUFDLENBQUMsRUFBRSxDQUFDaEIsS0FBc0IsSUFBdEJhLGFBQXNCLElBQUlWLE9BQU8sQ0FBQztFQUV0RSxJQUFJQyxLQUFLO0lBQ1AsTUFBQWEsVUFBQSxHQUFtQnRCLFdBQVcsQ0FBQ1MsS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUN6QyxNQUFBYyxTQUFBLEdBQWtCSCxJQUFJLENBQUFDLEdBQUksQ0FBQyxDQUFDLEVBQUVGLGNBQWMsR0FBR0csVUFBVSxDQUFDO0lBQzFELE1BQUFFLFNBQUEsR0FBa0JKLElBQUksQ0FBQUssS0FBTSxDQUFDRixTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQzNDLE1BQUFHLFVBQUEsR0FBbUJILFNBQVMsR0FBR0MsU0FBUztJQUVSLE1BQUFHLEVBQUEsSUFBQ3JCLEtBQUs7SUFBQSxJQUFBc0IsRUFBQTtJQUFBLElBQUFoQixDQUFBLFFBQUFMLElBQUEsSUFBQUssQ0FBQSxRQUFBWSxTQUFBO01BQ2pDSSxFQUFBLEdBQUFyQixJQUFJLENBQUFzQixNQUFPLENBQUNMLFNBQVMsQ0FBQztNQUFBWixDQUFBLE1BQUFMLElBQUE7TUFBQUssQ0FBQSxNQUFBWSxTQUFBO01BQUFaLENBQUEsTUFBQWdCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFoQixDQUFBO0lBQUE7SUFBQSxJQUFBa0IsRUFBQTtJQUFBLElBQUFsQixDQUFBLFFBQUFILEtBQUE7TUFDdkJxQixFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWixDQUFDLElBQUksQ0FBRXJCLE1BQUksQ0FBRSxFQUFaLElBQUksQ0FDUCxFQUZDLElBQUksQ0FFRTtNQUFBRyxDQUFBLE1BQUFILEtBQUE7TUFBQUcsQ0FBQSxNQUFBa0IsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQWxCLENBQUE7SUFBQTtJQUFBLElBQUFtQixFQUFBO0lBQUEsSUFBQW5CLENBQUEsUUFBQUwsSUFBQSxJQUFBSyxDQUFBLFFBQUFjLFVBQUE7TUFDTkssRUFBQSxHQUFBeEIsSUFBSSxDQUFBc0IsTUFBTyxDQUFDSCxVQUFVLENBQUM7TUFBQWQsQ0FBQSxNQUFBTCxJQUFBO01BQUFLLENBQUEsTUFBQWMsVUFBQTtNQUFBZCxDQUFBLE1BQUFtQixFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBbkIsQ0FBQTtJQUFBO0lBQUEsSUFBQW9CLEVBQUE7SUFBQSxJQUFBcEIsQ0FBQSxRQUFBTixLQUFBLElBQUFNLENBQUEsUUFBQWUsRUFBQSxJQUFBZixDQUFBLFNBQUFnQixFQUFBLElBQUFoQixDQUFBLFNBQUFrQixFQUFBLElBQUFsQixDQUFBLFNBQUFtQixFQUFBO01BTDFCQyxFQUFBLElBQUMsSUFBSSxDQUFRMUIsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FBWSxRQUFNLENBQU4sQ0FBQXFCLEVBQUssQ0FBQyxDQUNqQyxDQUFBQyxFQUFxQixDQUFHLElBQUUsQ0FDM0IsQ0FBQUUsRUFFTSxDQUFFLElBQUUsQ0FDVCxDQUFBQyxFQUFzQixDQUN6QixFQU5DLElBQUksQ0FNRTtNQUFBbkIsQ0FBQSxNQUFBTixLQUFBO01BQUFNLENBQUEsTUFBQWUsRUFBQTtNQUFBZixDQUFBLE9BQUFnQixFQUFBO01BQUFoQixDQUFBLE9BQUFrQixFQUFBO01BQUFsQixDQUFBLE9BQUFtQixFQUFBO01BQUFuQixDQUFBLE9BQUFvQixFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBcEIsQ0FBQTtJQUFBO0lBQUEsT0FOUG9CLEVBTU87RUFBQTtFQUtxQixNQUFBTCxFQUFBLElBQUNyQixLQUFLO0VBQUEsSUFBQXNCLEVBQUE7RUFBQSxJQUFBaEIsQ0FBQSxTQUFBTCxJQUFBLElBQUFLLENBQUEsU0FBQU8sY0FBQTtJQUNqQ1MsRUFBQSxHQUFBckIsSUFBSSxDQUFBc0IsTUFBTyxDQUFDVixjQUFjLENBQUM7SUFBQVAsQ0FBQSxPQUFBTCxJQUFBO0lBQUFLLENBQUEsT0FBQU8sY0FBQTtJQUFBUCxDQUFBLE9BQUFnQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBaEIsQ0FBQTtFQUFBO0VBQUEsSUFBQWtCLEVBQUE7RUFBQSxJQUFBbEIsQ0FBQSxTQUFBTixLQUFBLElBQUFNLENBQUEsU0FBQWUsRUFBQSxJQUFBZixDQUFBLFNBQUFnQixFQUFBO0lBRDlCRSxFQUFBLElBQUMsSUFBSSxDQUFReEIsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FBWSxRQUFNLENBQU4sQ0FBQXFCLEVBQUssQ0FBQyxDQUNqQyxDQUFBQyxFQUEwQixDQUM3QixFQUZDLElBQUksQ0FFRTtJQUFBaEIsQ0FBQSxPQUFBTixLQUFBO0lBQUFNLENBQUEsT0FBQWUsRUFBQTtJQUFBZixDQUFBLE9BQUFnQixFQUFBO0lBQUFoQixDQUFBLE9BQUFrQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBbEIsQ0FBQTtFQUFBO0VBQUEsT0FGUGtCLEVBRU87QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
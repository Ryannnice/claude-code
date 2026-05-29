// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = {
  /**
   * Number of newlines to insert.
   *
   * @default 1
   */
  readonly count?: number;
};

/**
 * Adds one or more newline (\n) characters. Must be used within <Text> components.
 */
// 终端 UI 组件 Newline在这里处理 `export default function Newline(t0) {`，完成这一小步状态转换。
export default function Newline(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    count: t1
  } = t0;
  // count 数量标记终端 UI Newline是否启用对应路径。
  const count = t1 === undefined ? 1 : t1;
  // t2 暂存 `"\n".repeat(count)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== count) {
    // t2 暂存 `"\n".repeat(count)` 生成的渲染片段，后续返回路径直接复用。
    t2 = "\n".repeat(count);
    // $[0] 缓存 `count`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = count;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3 暂存 `<ink-text>{t2}</ink-text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t2) {
    // t3 暂存 `<ink-text>{t2}</ink-text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <ink-text>{t2}</ink-text>;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlByb3BzIiwiY291bnQiLCJOZXdsaW5lIiwidDAiLCIkIiwiX2MiLCJ0MSIsInVuZGVmaW5lZCIsInQyIiwicmVwZWF0IiwidDMiXSwic291cmNlcyI6WyJOZXdsaW5lLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5cbmV4cG9ydCB0eXBlIFByb3BzID0ge1xuICAvKipcbiAgICogTnVtYmVyIG9mIG5ld2xpbmVzIHRvIGluc2VydC5cbiAgICpcbiAgICogQGRlZmF1bHQgMVxuICAgKi9cbiAgcmVhZG9ubHkgY291bnQ/OiBudW1iZXJcbn1cblxuLyoqXG4gKiBBZGRzIG9uZSBvciBtb3JlIG5ld2xpbmUgKFxcbikgY2hhcmFjdGVycy4gTXVzdCBiZSB1c2VkIHdpdGhpbiA8VGV4dD4gY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gTmV3bGluZSh7IGNvdW50ID0gMSB9OiBQcm9wcykge1xuICByZXR1cm4gPGluay10ZXh0PnsnXFxuJy5yZXBlYXQoY291bnQpfTwvaW5rLXRleHQ+XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUV6QixPQUFPLEtBQUtDLEtBQUssR0FBRztFQUNsQjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsU0FBU0MsS0FBSyxDQUFDLEVBQUUsTUFBTTtBQUN6QixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBLGVBQWUsU0FBQUMsUUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFpQjtJQUFBSixLQUFBLEVBQUFLO0VBQUEsSUFBQUgsRUFBb0I7RUFBbEIsTUFBQUYsS0FBQSxHQUFBSyxFQUFTLEtBQVRDLFNBQVMsR0FBVCxDQUFTLEdBQVRELEVBQVM7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBSCxLQUFBO0lBQ3ZCTyxFQUFBLE9BQUksQ0FBQUMsTUFBTyxDQUFDUixLQUFLLENBQUM7SUFBQUcsQ0FBQSxNQUFBSCxLQUFBO0lBQUFHLENBQUEsTUFBQUksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUosQ0FBQTtFQUFBO0VBQUEsSUFBQU0sRUFBQTtFQUFBLElBQUFOLENBQUEsUUFBQUksRUFBQTtJQUE3QkUsRUFBQSxZQUF5QyxDQUE5QixDQUFBRixFQUFpQixDQUFFLEVBQTlCLFFBQXlDO0lBQUFKLENBQUEsTUFBQUksRUFBQTtJQUFBSixDQUFBLE1BQUFNLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFOLENBQUE7RUFBQTtFQUFBLE9BQXpDTSxFQUF5QztBQUFBIiwiaWdub3JlTGlzdCI6W119
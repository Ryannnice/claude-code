// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 复用 formatDuration 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatDuration } from '../../utils/format.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  elapsedTimeSeconds?: number;
  timeoutMs?: number;
};
// ShellTimeDisplay 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ShellTimeDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    elapsedTimeSeconds,
    timeoutMs
  } = t0;
  // 只有 `elapsedTimeSeconds === undefined && !timeoutMs` 满足时，终端渲染才执行该分支。
  if (elapsedTimeSeconds === undefined && !timeoutMs) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `timeoutMs ? formatDuration(timeoutMs, {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== timeoutMs) {
    // t1 暂存 `timeoutMs ? formatDuration(timeoutMs, {` 生成的渲染片段，后续返回路径直接复用。
    t1 = timeoutMs ? formatDuration(timeoutMs, {
      hideTrailingZeros: true
    }) : undefined;
    // $[0] 缓存 `timeoutMs`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = timeoutMs;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // timeout保存`t1`，作为后续临时缓存值处理的输入。
  const timeout = t1;
  // 满足 `elapsedTimeSeconds === undefined` 时，终端渲染执行该分支。
  if (elapsedTimeSeconds === undefined) {
    // 临时值 t2 命名 ``(timeout ${timeout})``，让后续代码直接表达这个值的用途。
    const t2 = `(timeout ${timeout})`;
    // t3 暂存 `<Text dimColor={true}>{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[2] !== t2) {
      // t3 暂存 `<Text dimColor={true}>{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text dimColor={true}>{t2}</Text>;
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
  // t2保存`elapsedTimeSeconds * 1000`，供终端 UI Shell Time Display后续判断或输出使用。
  const t2 = elapsedTimeSeconds * 1000;
  // t3 暂存 `formatDuration(t2)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== t2) {
    // t3 暂存 `formatDuration(t2)` 生成的渲染片段，后续返回路径直接复用。
    t3 = formatDuration(t2);
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // elapsed沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const elapsed = t3;
  // 满足 `timeout` 时，终端渲染执行该分支。
  if (timeout) {
    // t4保存``(${elapsed} · timeout ${timeout})``，作为后续固定文本处理的输入。
    const t4 = `(${elapsed} · timeout ${timeout})`;
    // t5 暂存 `<Text dimColor={true}>{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[6] !== t4) {
      // t5 暂存 `<Text dimColor={true}>{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text dimColor={true}>{t4}</Text>;
      // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t4;
      // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[7];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // t4保存``(${elapsed})``，作为后续固定文本处理的输入。
  const t4 = `(${elapsed})`;
  // t5 暂存 `<Text dimColor={true}>{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t4) {
    // t5 暂存 `<Text dimColor={true}>{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text dimColor={true}>{t4}</Text>;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJmb3JtYXREdXJhdGlvbiIsIlByb3BzIiwiZWxhcHNlZFRpbWVTZWNvbmRzIiwidGltZW91dE1zIiwiU2hlbGxUaW1lRGlzcGxheSIsInQwIiwiJCIsIl9jIiwidW5kZWZpbmVkIiwidDEiLCJoaWRlVHJhaWxpbmdaZXJvcyIsInRpbWVvdXQiLCJ0MiIsInQzIiwiZWxhcHNlZCIsInQ0IiwidDUiXSwic291cmNlcyI6WyJTaGVsbFRpbWVEaXNwbGF5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZm9ybWF0RHVyYXRpb24gfSBmcm9tICcuLi8uLi91dGlscy9mb3JtYXQuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGVsYXBzZWRUaW1lU2Vjb25kcz86IG51bWJlclxuICB0aW1lb3V0TXM/OiBudW1iZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNoZWxsVGltZURpc3BsYXkoe1xuICBlbGFwc2VkVGltZVNlY29uZHMsXG4gIHRpbWVvdXRNcyxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKGVsYXBzZWRUaW1lU2Vjb25kcyA9PT0gdW5kZWZpbmVkICYmICF0aW1lb3V0TXMpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGNvbnN0IHRpbWVvdXQgPSB0aW1lb3V0TXNcbiAgICA/IGZvcm1hdER1cmF0aW9uKHRpbWVvdXRNcywgeyBoaWRlVHJhaWxpbmdaZXJvczogdHJ1ZSB9KVxuICAgIDogdW5kZWZpbmVkXG4gIGlmIChlbGFwc2VkVGltZVNlY29uZHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiA8VGV4dCBkaW1Db2xvcj57YCh0aW1lb3V0ICR7dGltZW91dH0pYH08L1RleHQ+XG4gIH1cbiAgY29uc3QgZWxhcHNlZCA9IGZvcm1hdER1cmF0aW9uKGVsYXBzZWRUaW1lU2Vjb25kcyAqIDEwMDApXG4gIGlmICh0aW1lb3V0KSB7XG4gICAgcmV0dXJuIDxUZXh0IGRpbUNvbG9yPntgKCR7ZWxhcHNlZH0gwrcgdGltZW91dCAke3RpbWVvdXR9KWB9PC9UZXh0PlxuICB9XG4gIHJldHVybiA8VGV4dCBkaW1Db2xvcj57YCgke2VsYXBzZWR9KWB9PC9UZXh0PlxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsSUFBSSxRQUFRLGNBQWM7QUFDbkMsU0FBU0MsY0FBYyxRQUFRLHVCQUF1QjtBQUV0RCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsa0JBQWtCLENBQUMsRUFBRSxNQUFNO0VBQzNCQyxTQUFTLENBQUMsRUFBRSxNQUFNO0FBQ3BCLENBQUM7QUFFRCxPQUFPLFNBQUFDLGlCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQTBCO0lBQUFMLGtCQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFHekI7RUFDTixJQUFJSCxrQkFBa0IsS0FBS00sU0FBdUIsSUFBOUMsQ0FBcUNMLFNBQVM7SUFBQSxPQUN6QyxJQUFJO0VBQUE7RUFDWixJQUFBTSxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBSCxTQUFBO0lBQ2VNLEVBQUEsR0FBQU4sU0FBUyxHQUNyQkgsY0FBYyxDQUFDRyxTQUFTLEVBQUU7TUFBQU8saUJBQUEsRUFBcUI7SUFBSyxDQUM1QyxDQUFDLEdBRkdGLFNBRUg7SUFBQUYsQ0FBQSxNQUFBSCxTQUFBO0lBQUFHLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBRmIsTUFBQUssT0FBQSxHQUFnQkYsRUFFSDtFQUNiLElBQUlQLGtCQUFrQixLQUFLTSxTQUFTO0lBQ1gsTUFBQUksRUFBQSxlQUFZRCxPQUFPLEdBQUc7SUFBQSxJQUFBRSxFQUFBO0lBQUEsSUFBQVAsQ0FBQSxRQUFBTSxFQUFBO01BQXRDQyxFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBRSxDQUFBRCxFQUFxQixDQUFFLEVBQXRDLElBQUksQ0FBeUM7TUFBQU4sQ0FBQSxNQUFBTSxFQUFBO01BQUFOLENBQUEsTUFBQU8sRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQVAsQ0FBQTtJQUFBO0lBQUEsT0FBOUNPLEVBQThDO0VBQUE7RUFFeEIsTUFBQUQsRUFBQSxHQUFBVixrQkFBa0IsR0FBRyxJQUFJO0VBQUEsSUFBQVcsRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQU0sRUFBQTtJQUF4Q0MsRUFBQSxHQUFBYixjQUFjLENBQUNZLEVBQXlCLENBQUM7SUFBQU4sQ0FBQSxNQUFBTSxFQUFBO0lBQUFOLENBQUEsTUFBQU8sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVAsQ0FBQTtFQUFBO0VBQXpELE1BQUFRLE9BQUEsR0FBZ0JELEVBQXlDO0VBQ3pELElBQUlGLE9BQU87SUFDYyxNQUFBSSxFQUFBLE9BQUlELE9BQU8sY0FBY0gsT0FBTyxHQUFHO0lBQUEsSUFBQUssRUFBQTtJQUFBLElBQUFWLENBQUEsUUFBQVMsRUFBQTtNQUFuREMsRUFBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUUsQ0FBQUQsRUFBa0MsQ0FBRSxFQUFuRCxJQUFJLENBQXNEO01BQUFULENBQUEsTUFBQVMsRUFBQTtNQUFBVCxDQUFBLE1BQUFVLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFWLENBQUE7SUFBQTtJQUFBLE9BQTNEVSxFQUEyRDtFQUFBO0VBRTdDLE1BQUFELEVBQUEsT0FBSUQsT0FBTyxHQUFHO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFWLENBQUEsUUFBQVMsRUFBQTtJQUE5QkMsRUFBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUUsQ0FBQUQsRUFBYSxDQUFFLEVBQTlCLElBQUksQ0FBaUM7SUFBQVQsQ0FBQSxNQUFBUyxFQUFBO0lBQUFULENBQUEsTUFBQVUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVYsQ0FBQTtFQUFBO0VBQUEsT0FBdENVLEVBQXNDO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
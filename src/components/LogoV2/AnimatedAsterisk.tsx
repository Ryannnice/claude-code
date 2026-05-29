// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef, useState } from 'react';
// 引入 TEARDROP_ASTERISK，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { TEARDROP_ASTERISK } from '../../constants/figures.js';
// 引入 Box、Text、useAnimationFrame，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useAnimationFrame } from '../../ink.js';
// 复用 getInitialSettings 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../../utils/settings/settings.js';
// 引入 hueToRgb、toRGBColor，将 ../Spinner/utils.js 中已经封装好的能力接到本文件流程里。
import { hueToRgb, toRGBColor } from '../Spinner/utils.js';
// SWEEP_DURATION_MS 集合保存`1500`，供终端 UI Animated Asterisk后续判断或输出使用。
const SWEEP_DURATION_MS = 1500;
// SWEEP_COUNT 数量 命名 `2`，让后续代码直接表达这个值的用途。
const SWEEP_COUNT = 2;
// TOTAL_ANIMATION_MS 集合保存`SWEEP_DURATION_MS * SWEEP_COUNT`，供后续判断或组装使用。
const TOTAL_ANIMATION_MS = SWEEP_DURATION_MS * SWEEP_COUNT;
// SETTLED_GREY保存`toRGBColor`，供终端渲染后续处理使用。
const SETTLED_GREY = toRGBColor({
  r: 153,
  g: 153,
  b: 153
});
// AnimatedAsterisk 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AnimatedAsterisk({
  char = TEARDROP_ASTERISK
}: {
  char?: string;
}): React.ReactNode {
  // Read prefersReducedMotion once at mount — no useSettings() subscription,
  // since that would re-render whenever settings change.
  // 这个回调绑定到 const [reducedMotion] = useState(() => getInitialSettings().prefersReducedMotion ?? …，负责终端渲染在该局部场景下的响应。
  const [reducedMotion] = useState(() => getInitialSettings().prefersReducedMotion ?? false);
  // done 由 React state 持有，setDone 会在用户操作或异步结果返回时触发刷新。
  const [done, setDone] = useState(reducedMotion);
  // useAnimationFrame's clock is shared — capture our start offset so the
  // sweep always begins at hue 0 regardless of when we mount.
  // startTimeRef 引用保存 hook 状态，让终端 UI Animated Asterisk跨渲染复用同一个容器。
  const startTimeRef = useRef<number | null>(null);
  // Wire the ref so useAnimationFrame's viewport-pause kicks in: if the
  // user submits a message before the sweep finishes, the clock stops
  // automatically once this row enters scrollback (prevents flicker).
  // 从 `useAnimationFrame(done ? null : 50)` 按位置拆出 ref、time，让终端 UI 组件 Animated Asterisk分别处理这些返回值。
  const [ref, time] = useAnimationFrame(done ? null : 50);
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 满足 `done` 时，终端渲染执行该分支。
    if (done) return;
    // t保存`setTimeout`，供终端渲染后续处理使用。
    const t = setTimeout(setDone, TOTAL_ANIMATION_MS, true);
    // 返回 `() => clearTimeout(t)`，作为终端渲染这次计算的结果。
    return () => clearTimeout(t);
  }, [done]);
  // 满足 `done` 时，终端渲染执行该分支。
  if (done) {
    // 返回 `<Box ref={ref}>`，作为终端渲染这次计算的结果。
    return <Box ref={ref}>
        <Text color={SETTLED_GREY}>{char}</Text>
      </Box>;
  }
  // 满足 `startTimeRef.current === null` 时，终端渲染执行该分支。
  if (startTimeRef.current === null) {
    // current更新为 `time`，确保终端 UI后续读取最新状态。
    startTimeRef.current = time;
  }
  // elapsed 命名 `time - startTimeRef.current`，让后续代码直接表达这个值的用途。
  const elapsed = time - startTimeRef.current;
  // hue保存`elapsed / SWEEP_DURATION_MS * 360 % 360`，供终端 UI Animated Asterisk后续判断或输出使用。
  const hue = elapsed / SWEEP_DURATION_MS * 360 % 360;
  // 返回 `<Box ref={ref}>`，作为终端渲染这次计算的结果。
  return <Box ref={ref}>
      <Text color={toRGBColor(hueToRgb(hue))}>{char}</Text>
    </Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwiVEVBUkRST1BfQVNURVJJU0siLCJCb3giLCJUZXh0IiwidXNlQW5pbWF0aW9uRnJhbWUiLCJnZXRJbml0aWFsU2V0dGluZ3MiLCJodWVUb1JnYiIsInRvUkdCQ29sb3IiLCJTV0VFUF9EVVJBVElPTl9NUyIsIlNXRUVQX0NPVU5UIiwiVE9UQUxfQU5JTUFUSU9OX01TIiwiU0VUVExFRF9HUkVZIiwiciIsImciLCJiIiwiQW5pbWF0ZWRBc3RlcmlzayIsImNoYXIiLCJSZWFjdE5vZGUiLCJyZWR1Y2VkTW90aW9uIiwicHJlZmVyc1JlZHVjZWRNb3Rpb24iLCJkb25lIiwic2V0RG9uZSIsInN0YXJ0VGltZVJlZiIsInJlZiIsInRpbWUiLCJ0Iiwic2V0VGltZW91dCIsImNsZWFyVGltZW91dCIsImN1cnJlbnQiLCJlbGFwc2VkIiwiaHVlIl0sInNvdXJjZXMiOlsiQW5pbWF0ZWRBc3Rlcmlzay50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRFQVJEUk9QX0FTVEVSSVNLIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL2ZpZ3VyZXMuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQsIHVzZUFuaW1hdGlvbkZyYW1lIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0SW5pdGlhbFNldHRpbmdzIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2V0dGluZ3Mvc2V0dGluZ3MuanMnXG5pbXBvcnQgeyBodWVUb1JnYiwgdG9SR0JDb2xvciB9IGZyb20gJy4uL1NwaW5uZXIvdXRpbHMuanMnXG5cbmNvbnN0IFNXRUVQX0RVUkFUSU9OX01TID0gMTUwMFxuY29uc3QgU1dFRVBfQ09VTlQgPSAyXG5jb25zdCBUT1RBTF9BTklNQVRJT05fTVMgPSBTV0VFUF9EVVJBVElPTl9NUyAqIFNXRUVQX0NPVU5UXG5jb25zdCBTRVRUTEVEX0dSRVkgPSB0b1JHQkNvbG9yKHsgcjogMTUzLCBnOiAxNTMsIGI6IDE1MyB9KVxuXG5leHBvcnQgZnVuY3Rpb24gQW5pbWF0ZWRBc3Rlcmlzayh7XG4gIGNoYXIgPSBURUFSRFJPUF9BU1RFUklTSyxcbn06IHtcbiAgY2hhcj86IHN0cmluZ1xufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIFJlYWQgcHJlZmVyc1JlZHVjZWRNb3Rpb24gb25jZSBhdCBtb3VudCDigJQgbm8gdXNlU2V0dGluZ3MoKSBzdWJzY3JpcHRpb24sXG4gIC8vIHNpbmNlIHRoYXQgd291bGQgcmUtcmVuZGVyIHdoZW5ldmVyIHNldHRpbmdzIGNoYW5nZS5cbiAgY29uc3QgW3JlZHVjZWRNb3Rpb25dID0gdXNlU3RhdGUoXG4gICAgKCkgPT4gZ2V0SW5pdGlhbFNldHRpbmdzKCkucHJlZmVyc1JlZHVjZWRNb3Rpb24gPz8gZmFsc2UsXG4gIClcbiAgY29uc3QgW2RvbmUsIHNldERvbmVdID0gdXNlU3RhdGUocmVkdWNlZE1vdGlvbilcbiAgLy8gdXNlQW5pbWF0aW9uRnJhbWUncyBjbG9jayBpcyBzaGFyZWQg4oCUIGNhcHR1cmUgb3VyIHN0YXJ0IG9mZnNldCBzbyB0aGVcbiAgLy8gc3dlZXAgYWx3YXlzIGJlZ2lucyBhdCBodWUgMCByZWdhcmRsZXNzIG9mIHdoZW4gd2UgbW91bnQuXG4gIGNvbnN0IHN0YXJ0VGltZVJlZiA9IHVzZVJlZjxudW1iZXIgfCBudWxsPihudWxsKVxuICAvLyBXaXJlIHRoZSByZWYgc28gdXNlQW5pbWF0aW9uRnJhbWUncyB2aWV3cG9ydC1wYXVzZSBraWNrcyBpbjogaWYgdGhlXG4gIC8vIHVzZXIgc3VibWl0cyBhIG1lc3NhZ2UgYmVmb3JlIHRoZSBzd2VlcCBmaW5pc2hlcywgdGhlIGNsb2NrIHN0b3BzXG4gIC8vIGF1dG9tYXRpY2FsbHkgb25jZSB0aGlzIHJvdyBlbnRlcnMgc2Nyb2xsYmFjayAocHJldmVudHMgZmxpY2tlcikuXG4gIGNvbnN0IFtyZWYsIHRpbWVdID0gdXNlQW5pbWF0aW9uRnJhbWUoZG9uZSA/IG51bGwgOiA1MClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkb25lKSByZXR1cm5cbiAgICBjb25zdCB0ID0gc2V0VGltZW91dChzZXREb25lLCBUT1RBTF9BTklNQVRJT05fTVMsIHRydWUpXG4gICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0KVxuICB9LCBbZG9uZV0pXG5cbiAgaWYgKGRvbmUpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCByZWY9e3JlZn0+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtTRVRUTEVEX0dSRVl9PntjaGFyfTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydFRpbWVSZWYuY3VycmVudCA9PT0gbnVsbCkge1xuICAgIHN0YXJ0VGltZVJlZi5jdXJyZW50ID0gdGltZVxuICB9XG4gIGNvbnN0IGVsYXBzZWQgPSB0aW1lIC0gc3RhcnRUaW1lUmVmLmN1cnJlbnRcbiAgY29uc3QgaHVlID0gKChlbGFwc2VkIC8gU1dFRVBfRFVSQVRJT05fTVMpICogMzYwKSAlIDM2MFxuXG4gIHJldHVybiAoXG4gICAgPEJveCByZWY9e3JlZn0+XG4gICAgICA8VGV4dCBjb2xvcj17dG9SR0JDb2xvcihodWVUb1JnYihodWUpKX0+e2NoYXJ9PC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsU0FBUyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ25ELFNBQVNDLGlCQUFpQixRQUFRLDRCQUE0QjtBQUM5RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsaUJBQWlCLFFBQVEsY0FBYztBQUMzRCxTQUFTQyxrQkFBa0IsUUFBUSxrQ0FBa0M7QUFDckUsU0FBU0MsUUFBUSxFQUFFQyxVQUFVLFFBQVEscUJBQXFCO0FBRTFELE1BQU1DLGlCQUFpQixHQUFHLElBQUk7QUFDOUIsTUFBTUMsV0FBVyxHQUFHLENBQUM7QUFDckIsTUFBTUMsa0JBQWtCLEdBQUdGLGlCQUFpQixHQUFHQyxXQUFXO0FBQzFELE1BQU1FLFlBQVksR0FBR0osVUFBVSxDQUFDO0VBQUVLLENBQUMsRUFBRSxHQUFHO0VBQUVDLENBQUMsRUFBRSxHQUFHO0VBQUVDLENBQUMsRUFBRTtBQUFJLENBQUMsQ0FBQztBQUUzRCxPQUFPLFNBQVNDLGdCQUFnQkEsQ0FBQztFQUMvQkMsSUFBSSxHQUFHZjtBQUdULENBRkMsRUFBRTtFQUNEZSxJQUFJLENBQUMsRUFBRSxNQUFNO0FBQ2YsQ0FBQyxDQUFDLEVBQUVuQixLQUFLLENBQUNvQixTQUFTLENBQUM7RUFDbEI7RUFDQTtFQUNBLE1BQU0sQ0FBQ0MsYUFBYSxDQUFDLEdBQUdsQixRQUFRLENBQzlCLE1BQU1LLGtCQUFrQixDQUFDLENBQUMsQ0FBQ2Msb0JBQW9CLElBQUksS0FDckQsQ0FBQztFQUNELE1BQU0sQ0FBQ0MsSUFBSSxFQUFFQyxPQUFPLENBQUMsR0FBR3JCLFFBQVEsQ0FBQ2tCLGFBQWEsQ0FBQztFQUMvQztFQUNBO0VBQ0EsTUFBTUksWUFBWSxHQUFHdkIsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDaEQ7RUFDQTtFQUNBO0VBQ0EsTUFBTSxDQUFDd0IsR0FBRyxFQUFFQyxJQUFJLENBQUMsR0FBR3BCLGlCQUFpQixDQUFDZ0IsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7RUFFdkR0QixTQUFTLENBQUMsTUFBTTtJQUNkLElBQUlzQixJQUFJLEVBQUU7SUFDVixNQUFNSyxDQUFDLEdBQUdDLFVBQVUsQ0FBQ0wsT0FBTyxFQUFFWCxrQkFBa0IsRUFBRSxJQUFJLENBQUM7SUFDdkQsT0FBTyxNQUFNaUIsWUFBWSxDQUFDRixDQUFDLENBQUM7RUFDOUIsQ0FBQyxFQUFFLENBQUNMLElBQUksQ0FBQyxDQUFDO0VBRVYsSUFBSUEsSUFBSSxFQUFFO0lBQ1IsT0FDRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQ0csR0FBRyxDQUFDO0FBQ3BCLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUNaLFlBQVksQ0FBQyxDQUFDLENBQUNLLElBQUksQ0FBQyxFQUFFLElBQUk7QUFDL0MsTUFBTSxFQUFFLEdBQUcsQ0FBQztFQUVWO0VBRUEsSUFBSU0sWUFBWSxDQUFDTSxPQUFPLEtBQUssSUFBSSxFQUFFO0lBQ2pDTixZQUFZLENBQUNNLE9BQU8sR0FBR0osSUFBSTtFQUM3QjtFQUNBLE1BQU1LLE9BQU8sR0FBR0wsSUFBSSxHQUFHRixZQUFZLENBQUNNLE9BQU87RUFDM0MsTUFBTUUsR0FBRyxHQUFLRCxPQUFPLEdBQUdyQixpQkFBaUIsR0FBSSxHQUFHLEdBQUksR0FBRztFQUV2RCxPQUNFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDZSxHQUFHLENBQUM7QUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQ2hCLFVBQVUsQ0FBQ0QsUUFBUSxDQUFDd0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNkLElBQUksQ0FBQyxFQUFFLElBQUk7QUFDMUQsSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUVWIiwiaWdub3JlTGlzdCI6W119
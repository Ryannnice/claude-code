// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useSettings，将 ../../hooks/useSettings.js 中已经封装好的能力接到本文件流程里。
import { useSettings } from '../../hooks/useSettings.js';
// 引入 Box、Text、useAnimationFrame，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useAnimationFrame } from '../../ink.js';
// 引入 interpolateColor、toRGBColor，将 ../Spinner/utils.js 中已经封装好的能力接到本文件流程里。
import { interpolateColor, toRGBColor } from '../Spinner/utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  voiceState: 'idle' | 'recording' | 'processing';
};

// Processing shimmer colors: dim gray to lighter gray (matches ThinkingShimmerText)
// PROCESSING_DIM 集中保存终端渲染提示输入组件 Voice Indicator要一起传递的字段。
const PROCESSING_DIM = {
  r: 153,
  g: 153,
  b: 153
};
// PROCESSING_BRIGHT 集中保存终端渲染提示输入组件 Voice Indicator要一起传递的字段。
const PROCESSING_BRIGHT = {
  r: 185,
  g: 185,
  b: 185
};
// PULSE_PERIOD_S 集合 命名 `2; // 2 second period for all pulsing animations`，让后续代码直接表达这个值的用途。
const PULSE_PERIOD_S = 2; // 2 second period for all pulsing animations

// VoiceIndicator 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function VoiceIndicator(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 满足 `!feature("VOICE_MODE")` 时，终端渲染执行该分支。
  if (!feature("VOICE_MODE")) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t0 暂存 `<VoiceIndicatorImpl {...props} />` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== props) {
    // t0 暂存 `<VoiceIndicatorImpl {...props} />` 生成的渲染片段，后续返回路径直接复用。
    t0 = <VoiceIndicatorImpl {...props} />;
    // $[0] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = props;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// VoiceIndicatorImpl 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function VoiceIndicatorImpl(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    voiceState
  } = t0;
  // 按照 voiceState 的取值选择终端渲染的具体处理分支。
  switch (voiceState) {
    case "recording":
      {
        // t1 暂存 `<Text dimColor={true}>listening…</Text>` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
          // t1 暂存 `<Text dimColor={true}>listening…</Text>` 生成的渲染片段，后续返回路径直接复用。
          t1 = <Text dimColor={true}>listening…</Text>;
          // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[0] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[0];
        }
        // 返回 `t1`，作为终端渲染这次计算的结果。
        return t1;
      }
    case "processing":
      {
        // t1 暂存 `<ProcessingShimmer />` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
          // t1 暂存 `<ProcessingShimmer />` 生成的渲染片段，后续返回路径直接复用。
          t1 = <ProcessingShimmer />;
          // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[1] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[1];
        }
        // 返回 `t1`，作为终端渲染这次计算的结果。
        return t1;
      }
    case "idle":
      {
        // 返回 `null`，作为终端渲染这次计算的结果。
        return null;
      }
  }
}

// Static — the warmup window (~120ms between space #2 and activation)
// is too brief for a 1s-period shimmer to register, and a 50ms animation
// timer here runs concurrently with auto-repeat spaces arriving every
// 30-80ms, compounding re-renders during an already-busy window.
// VoiceWarmupHint 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function VoiceWarmupHint() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // 满足 `!feature("VOICE_MODE")` 时，终端渲染执行该分支。
  if (!feature("VOICE_MODE")) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t0 暂存 `<Text dimColor={true}>keep holding…</Text>` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<Text dimColor={true}>keep holding…</Text>` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Text dimColor={true}>keep holding…</Text>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// ProcessingShimmer 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ProcessingShimmer() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // settings 集合保存`useSettings`，供终端渲染后续处理使用。
  const settings = useSettings();
  // reducedMotion 命名 `settings.prefersReducedMotion ?? false`，让后续代码直接表达这个值的用途。
  const reducedMotion = settings.prefersReducedMotion ?? false;
  // 从 `useAnimationFrame(reducedMotion ? null : 50)` 按位置拆出 ref、time，让提示输入组件 Voice Indicator分别处理这些返回值。
  const [ref, time] = useAnimationFrame(reducedMotion ? null : 50);
  // 满足 `reducedMotion` 时，终端渲染执行该分支。
  if (reducedMotion) {
    // t0 暂存 `<Text color="warning">Voice: processing…</Text>` 的派生结果，便于缓存命中时直接复用。
    let t0;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t0 暂存 `<Text color="warning">Voice: processing…</Text>` 生成的渲染片段，后续返回路径直接复用。
      t0 = <Text color="warning">Voice: processing…</Text>;
      // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t0;
    } else {
      // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t0 = $[0];
    }
    // 返回 `t0`，作为终端渲染这次计算的结果。
    return t0;
  }
  // elapsedSec保存`time / 1000`，供后续判断或组装使用。
  const elapsedSec = time / 1000;
  // opacity保存`Math.sin`，供终端渲染后续处理使用。
  const opacity = (Math.sin(elapsedSec * Math.PI * 2 / PULSE_PERIOD_S) + 1) / 2;
  // t0 暂存 `toRGBColor(interpolateColor(PROCESSING_DIM, PROCESSING_BR...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== opacity) {
    // t0 暂存 `toRGBColor(interpolateColor(PROCESSING_DIM, PROCESSING_BR...` 生成的渲染片段，后续返回路径直接复用。
    t0 = toRGBColor(interpolateColor(PROCESSING_DIM, PROCESSING_BRIGHT, opacity));
    // $[1] 缓存 `opacity`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = opacity;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // color保存`t0`，作为后续临时缓存值处理的输入。
  const color = t0;
  // t1 暂存 `<Text color={color}>Voice: processing…</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== color) {
    // t1 暂存 `<Text color={color}>Voice: processing…</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color={color}>Voice: processing…</Text>;
    // $[3] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = color;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // t2 暂存 `<Box ref={ref}>{t1}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== ref || $[6] !== t1) {
    // t2 暂存 `<Box ref={ref}>{t1}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box ref={ref}>{t1}</Box>;
    // $[5] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = ref;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiUmVhY3QiLCJ1c2VTZXR0aW5ncyIsIkJveCIsIlRleHQiLCJ1c2VBbmltYXRpb25GcmFtZSIsImludGVycG9sYXRlQ29sb3IiLCJ0b1JHQkNvbG9yIiwiUHJvcHMiLCJ2b2ljZVN0YXRlIiwiUFJPQ0VTU0lOR19ESU0iLCJyIiwiZyIsImIiLCJQUk9DRVNTSU5HX0JSSUdIVCIsIlBVTFNFX1BFUklPRF9TIiwiVm9pY2VJbmRpY2F0b3IiLCJwcm9wcyIsIiQiLCJfYyIsInQwIiwiVm9pY2VJbmRpY2F0b3JJbXBsIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJWb2ljZVdhcm11cEhpbnQiLCJQcm9jZXNzaW5nU2hpbW1lciIsInNldHRpbmdzIiwicmVkdWNlZE1vdGlvbiIsInByZWZlcnNSZWR1Y2VkTW90aW9uIiwicmVmIiwidGltZSIsImVsYXBzZWRTZWMiLCJvcGFjaXR5IiwiTWF0aCIsInNpbiIsIlBJIiwiY29sb3IiLCJ0MiJdLCJzb3VyY2VzIjpbIlZvaWNlSW5kaWNhdG9yLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmZWF0dXJlIH0gZnJvbSAnYnVuOmJ1bmRsZSdcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlU2V0dGluZ3MgfSBmcm9tICcuLi8uLi9ob29rcy91c2VTZXR0aW5ncy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCwgdXNlQW5pbWF0aW9uRnJhbWUgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBpbnRlcnBvbGF0ZUNvbG9yLCB0b1JHQkNvbG9yIH0gZnJvbSAnLi4vU3Bpbm5lci91dGlscy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgdm9pY2VTdGF0ZTogJ2lkbGUnIHwgJ3JlY29yZGluZycgfCAncHJvY2Vzc2luZydcbn1cblxuLy8gUHJvY2Vzc2luZyBzaGltbWVyIGNvbG9yczogZGltIGdyYXkgdG8gbGlnaHRlciBncmF5IChtYXRjaGVzIFRoaW5raW5nU2hpbW1lclRleHQpXG5jb25zdCBQUk9DRVNTSU5HX0RJTSA9IHsgcjogMTUzLCBnOiAxNTMsIGI6IDE1MyB9XG5jb25zdCBQUk9DRVNTSU5HX0JSSUdIVCA9IHsgcjogMTg1LCBnOiAxODUsIGI6IDE4NSB9XG5cbmNvbnN0IFBVTFNFX1BFUklPRF9TID0gMiAvLyAyIHNlY29uZCBwZXJpb2QgZm9yIGFsbCBwdWxzaW5nIGFuaW1hdGlvbnNcblxuZXhwb3J0IGZ1bmN0aW9uIFZvaWNlSW5kaWNhdG9yKHByb3BzOiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmICghZmVhdHVyZSgnVk9JQ0VfTU9ERScpKSByZXR1cm4gbnVsbFxuICByZXR1cm4gPFZvaWNlSW5kaWNhdG9ySW1wbCB7Li4ucHJvcHN9IC8+XG59XG5cbmZ1bmN0aW9uIFZvaWNlSW5kaWNhdG9ySW1wbCh7IHZvaWNlU3RhdGUgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBzd2l0Y2ggKHZvaWNlU3RhdGUpIHtcbiAgICBjYXNlICdyZWNvcmRpbmcnOlxuICAgICAgcmV0dXJuIDxUZXh0IGRpbUNvbG9yPmxpc3RlbmluZ+KApjwvVGV4dD5cbiAgICBjYXNlICdwcm9jZXNzaW5nJzpcbiAgICAgIHJldHVybiA8UHJvY2Vzc2luZ1NoaW1tZXIgLz5cbiAgICBjYXNlICdpZGxlJzpcbiAgICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuLy8gU3RhdGljIOKAlCB0aGUgd2FybXVwIHdpbmRvdyAofjEyMG1zIGJldHdlZW4gc3BhY2UgIzIgYW5kIGFjdGl2YXRpb24pXG4vLyBpcyB0b28gYnJpZWYgZm9yIGEgMXMtcGVyaW9kIHNoaW1tZXIgdG8gcmVnaXN0ZXIsIGFuZCBhIDUwbXMgYW5pbWF0aW9uXG4vLyB0aW1lciBoZXJlIHJ1bnMgY29uY3VycmVudGx5IHdpdGggYXV0by1yZXBlYXQgc3BhY2VzIGFycml2aW5nIGV2ZXJ5XG4vLyAzMC04MG1zLCBjb21wb3VuZGluZyByZS1yZW5kZXJzIGR1cmluZyBhbiBhbHJlYWR5LWJ1c3kgd2luZG93LlxuZXhwb3J0IGZ1bmN0aW9uIFZvaWNlV2FybXVwSGludCgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoIWZlYXR1cmUoJ1ZPSUNFX01PREUnKSkgcmV0dXJuIG51bGxcbiAgcmV0dXJuIDxUZXh0IGRpbUNvbG9yPmtlZXAgaG9sZGluZ+KApjwvVGV4dD5cbn1cblxuZnVuY3Rpb24gUHJvY2Vzc2luZ1NoaW1tZXIoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc2V0dGluZ3MgPSB1c2VTZXR0aW5ncygpXG4gIGNvbnN0IHJlZHVjZWRNb3Rpb24gPSBzZXR0aW5ncy5wcmVmZXJzUmVkdWNlZE1vdGlvbiA/PyBmYWxzZVxuICBjb25zdCBbcmVmLCB0aW1lXSA9IHVzZUFuaW1hdGlvbkZyYW1lKHJlZHVjZWRNb3Rpb24gPyBudWxsIDogNTApXG5cbiAgaWYgKHJlZHVjZWRNb3Rpb24pIHtcbiAgICByZXR1cm4gPFRleHQgY29sb3I9XCJ3YXJuaW5nXCI+Vm9pY2U6IHByb2Nlc3NpbmfigKY8L1RleHQ+XG4gIH1cblxuICBjb25zdCBlbGFwc2VkU2VjID0gdGltZSAvIDEwMDBcbiAgY29uc3Qgb3BhY2l0eSA9XG4gICAgKE1hdGguc2luKChlbGFwc2VkU2VjICogTWF0aC5QSSAqIDIpIC8gUFVMU0VfUEVSSU9EX1MpICsgMSkgLyAyXG4gIGNvbnN0IGNvbG9yID0gdG9SR0JDb2xvcihcbiAgICBpbnRlcnBvbGF0ZUNvbG9yKFBST0NFU1NJTkdfRElNLCBQUk9DRVNTSU5HX0JSSUdIVCwgb3BhY2l0eSksXG4gIClcblxuICByZXR1cm4gKFxuICAgIDxCb3ggcmVmPXtyZWZ9PlxuICAgICAgPFRleHQgY29sb3I9e2NvbG9yfT5Wb2ljZTogcHJvY2Vzc2luZ+KApjwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsT0FBTyxRQUFRLFlBQVk7QUFDcEMsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLFFB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QUVoRSxJQUFJQSxhQUFhO0lBQUEsSUFBQVIsRUFBQTtJQUFBLElBQUFGLENBQUEsUUFBQUssTUFBQSxDQUFBQyxHQUFBO01BQ1JKLEVBQUEsSUFBQyxJQUFJLENBQU8sS0FBUyxDQUFULFNBQVMsQ0FBQyxrQkFBa0IsRUFBdkMsSUFBSSxDQUEwQztNQUFBRixDQUFBLE1BQUFFLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFGLENBQUE7SUFBQTtJQUFBLE9BQS9DRSxFQUErQztFQUFBO0VBR3hELE1BQUFZLFVBQUEsR0FBbUJELElBQUksR0FBRyxJQUFJO0VBQzlCLE1BQUFFLE9BQUEsR0FDRSxDQUFDQyxJQUFJLENBQUFDLEdBQUksQ0FBRUgsVUFBVSxHQUFHRSxJQUFJLENBQUFFLEVBQUcsR0FBRyxDQUFDLEdBQUlyQixjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztFQUFBLElBQUFLLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFlLE9BQUE7SUFDbkRiLEVBQUEsR0FBQWIsVUFBVSxDQUN0QkQsZ0JBQWdCLENBQUNJLGNBQWMsRUFBRUksaUJBQWlCLEVBQUVtQixPQUFPLENBQzdELENBQUM7SUFBQWYsQ0FBQSxNQUFBZSxPQUFBO0lBQUFmLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBRkQsTUFBQW1CLEtBQUEsR0FBY2pCLEVBRWI7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBbUIsS0FBQTtJQUlHZixFQUFBLElBQUMsSUFBSSxDQUFRZSxLQUFLLENBQUxBLE1BQUksQ0FBQyxDQUFFLGtCQUFrQixFQUFyQyxJQUFJLENBQXdDO0lBQUFuQixDQUFBLE1BQUFtQixLQUFBO0lBQUFuQixDQUFBLE1BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUFBLElBQUFvQixFQUFBO0VBQUEsSUFBQXBCLENBQUEsUUFBQVksR0FBQSxJQUFBWixDQUFBLFFBQUFJLEVBQUE7SUFEL0NnQixFQUFBLElBQUMsR0FBRyxDQUFNUixHQUFHLENBQUhBLElBQUUsQ0FBQyxDQUNYLENBQUFSLEVBQTRDLENBQzlDLEVBRkMsR0FBRyxDQUVFO0lBQUFKLENBQUEsTUFBQVksR0FBQTtJQUFBWixDQUFBLE1BQUFJLEVBQUE7SUFBQUosQ0FBQSxNQUFBb0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXBCLENBQUE7RUFBQTtFQUFBLE9BRk5vQixFQUVNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
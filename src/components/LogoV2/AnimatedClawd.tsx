// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef, useState } from 'react';
// 引入 Box，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../ink.js';
// 复用 getInitialSettings 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../../utils/settings/settings.js';
// 引入 Clawd、ClawdPose，将 ./Clawd.js 中已经封装好的能力接到本文件流程里。
import { Clawd, type ClawdPose } from './Clawd.js';
// Frame 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Frame = {
  pose: ClawdPose;
  offset: number;
};

/** Hold a pose for n frames (60ms each). */
// hold 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hold(pose: ClawdPose, offset: number, frames: number): Frame[] {
  // 返回 `Array.from({`，作为终端渲染这次计算的结果。
  return Array.from({
    length: frames
  }, () => ({
    pose,
    offset
  }));
}

// Offset semantics: marginTop in a fixed-height-3 container. 0 = normal,
// 1 = crouched. Container height stays 3 so the layout never shifts; during
// a crouch (offset=1) Clawd's feet row dips below the container and gets
// clipped — reads as "ducking below the frame" before springing back up.

// Click animation: crouch, then spring up with both arms raised. Twice.
// JUMP_WAVE 聚合成有序列表，保持后续遍历顺序稳定。
const JUMP_WAVE: readonly Frame[] = [...hold('default', 1, 2),
// crouch
...hold('arms-up', 0, 3),
// spring!
...hold('default', 0, 1), ...hold('default', 1, 2),
// crouch again
...hold('arms-up', 0, 3),
// spring!
...hold('default', 0, 1)];

// Click animation: glance right, then left, then back.
// LOOK_AROUND 聚合成有序列表，保持后续遍历顺序稳定。
const LOOK_AROUND: readonly Frame[] = [...hold('look-right', 0, 5), ...hold('look-left', 0, 5), ...hold('default', 0, 1)];
// CLICK_ANIMATIONS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const CLICK_ANIMATIONS: readonly (readonly Frame[])[] = [JUMP_WAVE, LOOK_AROUND];
// IDLE 集中保存终端 UI 组件 Animated Clawd要一起传递的字段。
const IDLE: Frame = {
  pose: 'default',
  offset: 0
};
// FRAME_MS 集合 命名 `60`，让后续代码直接表达这个值的用途。
const FRAME_MS = 60;
// incrementFrame封装成回调，供终端 UI Animated Clawd在事件触发或异步步骤中调用。
const incrementFrame = (i: number) => i + 1;
// CLAWD_HEIGHT保存`3`，供终端 UI Animated Clawd后续判断或输出使用。
const CLAWD_HEIGHT = 3;

/**
 * Clawd with click-triggered animations (crouch-jump with arms up, or
 * look-around). Container height is fixed at CLAWD_HEIGHT — same footprint
 * as a bare `<Clawd />` — so the surrounding layout never shifts. During a
 * crouch only the feet row clips (see comment above). Click only fires when
 * mouse tracking is enabled (i.e. inside `<AlternateScreen>` / fullscreen);
 * elsewhere this renders and behaves identically to plain `<Clawd />`.
 */
// AnimatedClawd 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AnimatedClawd() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    pose,
    bounceOffset,
    onClick
  } = useClawdAnimation();
  // t0 暂存 `<Clawd pose={pose} />` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== pose) {
    // t0 暂存 `<Clawd pose={pose} />` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Clawd pose={pose} />;
    // $[0] 缓存 `pose`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = pose;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // t1 暂存 `<Box marginTop={bounceOffset} flexShrink={0}>{t0}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== bounceOffset || $[3] !== t0) {
    // t1 暂存 `<Box marginTop={bounceOffset} flexShrink={0}>{t0}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box marginTop={bounceOffset} flexShrink={0}>{t0}</Box>;
    // $[2] 缓存 `bounceOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = bounceOffset;
    // $[3] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t0;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // t2 暂存 `<Box height={CLAWD_HEIGHT} flexDirection="column" onClick...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== onClick || $[6] !== t1) {
    // t2 暂存 `<Box height={CLAWD_HEIGHT} flexDirection="column" onClick...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box height={CLAWD_HEIGHT} flexDirection="column" onClick={onClick}>{t1}</Box>;
    // $[5] 缓存 `onClick`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onClick;
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
// useClawdAnimation 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function useClawdAnimation(): {
  pose: ClawdPose;
  bounceOffset: number;
  // 这个回调绑定到 onClick: () => void;，负责终端渲染在该局部场景下的响应。
  onClick: () => void;
} {
  // Read once at mount — no useSettings() subscription, since that would
  // re-render on any settings change.
  // 这个回调绑定到 const [reducedMotion] = useState(() => getInitialSettings().prefersReducedMotion ?? …，负责终端渲染在该局部场景下的响应。
  const [reducedMotion] = useState(() => getInitialSettings().prefersReducedMotion ?? false);
  // frameIndex 索引 由 React state 持有，setFrameIndex 会在用户操作或异步结果返回时触发刷新。
  const [frameIndex, setFrameIndex] = useState(-1);
  // sequenceRef 引用保存 hook 状态，让终端 UI Animated Clawd跨渲染复用同一个容器。
  const sequenceRef = useRef<readonly Frame[]>(JUMP_WAVE);
  // onClick封装成回调，供终端 UI Animated Clawd在事件触发或异步步骤中调用。
  const onClick = () => {
    // `reducedMotion || frameIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
    if (reducedMotion || frameIndex !== -1) return;
    // current更新为 `CLICK_ANIMATIONS[Math.floor(Math.random() * CLICK_ANIMATI...`，确保终端 UI后续读取最新状态。
    sequenceRef.current = CLICK_ANIMATIONS[Math.floor(Math.random() * CLICK_ANIMATIONS.length)]!;
    // setFrameIndex 写入新的状态值，使终端渲染后续读取保持一致。
    setFrameIndex(0);
  };
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 满足 `frameIndex === -1` 时，终端渲染执行该分支。
    if (frameIndex === -1) return;
    // 满足 `frameIndex >= sequenceRef.current.length` 时，终端渲染执行该分支。
    if (frameIndex >= sequenceRef.current.length) {
      // setFrameIndex 写入新的状态值，使终端渲染后续读取保持一致。
      setFrameIndex(-1);
      // 终端 UI 组件 Animated Clawd在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // timer保存`setTimeout`，供终端渲染后续处理使用。
    const timer = setTimeout(setFrameIndex, FRAME_MS, incrementFrame);
    // 返回 `() => clearTimeout(timer)`，作为终端渲染这次计算的结果。
    return () => clearTimeout(timer);
  }, [frameIndex]);
  // seq保存`sequenceRef.current`，供后续判断或组装使用。
  const seq = sequenceRef.current;
  // current标记终端 UI Animated Clawd是否启用对应路径。
  const current = frameIndex >= 0 && frameIndex < seq.length ? seq[frameIndex]! : IDLE;
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    pose: current.pose,
    bounceOffset: current.offset,
    onClick
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwiQm94IiwiZ2V0SW5pdGlhbFNldHRpbmdzIiwiQ2xhd2QiLCJDbGF3ZFBvc2UiLCJGcmFtZSIsInBvc2UiLCJvZmZzZXQiLCJob2xkIiwiZnJhbWVzIiwiQXJyYXkiLCJmcm9tIiwibGVuZ3RoIiwiSlVNUF9XQVZFIiwiTE9PS19BUk9VTkQiLCJDTElDS19BTklNQVRJT05TIiwiSURMRSIsIkZSQU1FX01TIiwiaW5jcmVtZW50RnJhbWUiLCJpIiwiQ0xBV0RfSEVJR0hUIiwiQW5pbWF0ZWRDbGF3ZCIsIiQiLCJfYyIsImJvdW5jZU9mZnNldCIsIm9uQ2xpY2siLCJ1c2VDbGF3ZEFuaW1hdGlvbiIsInQwIiwidDEiLCJ0MiIsInJlZHVjZWRNb3Rpb24iLCJwcmVmZXJzUmVkdWNlZE1vdGlvbiIsImZyYW1lSW5kZXgiLCJzZXRGcmFtZUluZGV4Iiwic2VxdWVuY2VSZWYiLCJjdXJyZW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwidGltZXIiLCJzZXRUaW1lb3V0IiwiY2xlYXJUaW1lb3V0Iiwic2VxIl0sInNvdXJjZXMiOlsiQW5pbWF0ZWRDbGF3ZC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGdldEluaXRpYWxTZXR0aW5ncyB9IGZyb20gJy4uLy4uL3V0aWxzL3NldHRpbmdzL3NldHRpbmdzLmpzJ1xuaW1wb3J0IHsgQ2xhd2QsIHR5cGUgQ2xhd2RQb3NlIH0gZnJvbSAnLi9DbGF3ZC5qcydcblxudHlwZSBGcmFtZSA9IHsgcG9zZTogQ2xhd2RQb3NlOyBvZmZzZXQ6IG51bWJlciB9XG5cbi8qKiBIb2xkIGEgcG9zZSBmb3IgbiBmcmFtZXMgKDYwbXMgZWFjaCkuICovXG5mdW5jdGlvbiBob2xkKHBvc2U6IENsYXdkUG9zZSwgb2Zmc2V0OiBudW1iZXIsIGZyYW1lczogbnVtYmVyKTogRnJhbWVbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKHsgbGVuZ3RoOiBmcmFtZXMgfSwgKCkgPT4gKHsgcG9zZSwgb2Zmc2V0IH0pKVxufVxuXG4vLyBPZmZzZXQgc2VtYW50aWNzOiBtYXJnaW5Ub3AgaW4gYSBmaXhlZC1oZWlnaHQtMyBjb250YWluZXIuIDAgPSBub3JtYWwsXG4vLyAxID0gY3JvdWNoZWQuIENvbnRhaW5lciBoZWlnaHQgc3RheXMgMyBzbyB0aGUgbGF5b3V0IG5ldmVyIHNoaWZ0czsgZHVyaW5nXG4vLyBhIGNyb3VjaCAob2Zmc2V0PTEpIENsYXdkJ3MgZmVldCByb3cgZGlwcyBiZWxvdyB0aGUgY29udGFpbmVyIGFuZCBnZXRzXG4vLyBjbGlwcGVkIOKAlCByZWFkcyBhcyBcImR1Y2tpbmcgYmVsb3cgdGhlIGZyYW1lXCIgYmVmb3JlIHNwcmluZ2luZyBiYWNrIHVwLlxuXG4vLyBDbGljayBhbmltYXRpb246IGNyb3VjaCwgdGhlbiBzcHJpbmcgdXAgd2l0aCBib3RoIGFybXMgcmFpc2VkLiBUd2ljZS5cbmNvbnN0IEpVTVBfV0FWRTogcmVhZG9ubHkgRnJhbWVbXSA9IFtcbiAgLi4uaG9sZCgnZGVmYXVsdCcsIDEsIDIpLCAvLyBjcm91Y2hcbiAgLi4uaG9sZCgnYXJtcy11cCcsIDAsIDMpLCAvLyBzcHJpbmchXG4gIC4uLmhvbGQoJ2RlZmF1bHQnLCAwLCAxKSxcbiAgLi4uaG9sZCgnZGVmYXVsdCcsIDEsIDIpLCAvLyBjcm91Y2ggYWdhaW5cbiAgLi4uaG9sZCgnYXJtcy11cCcsIDAsIDMpLCAvLyBzcHJpbmchXG4gIC4uLmhvbGQoJ2RlZmF1bHQnLCAwLCAxKSxcbl1cblxuLy8gQ2xpY2sgYW5pbWF0aW9uOiBnbGFuY2UgcmlnaHQsIHRoZW4gbGVmdCwgdGhlbiBiYWNrLlxuY29uc3QgTE9PS19BUk9VTkQ6IHJlYWRvbmx5IEZyYW1lW10gPSBbXG4gIC4uLmhvbGQoJ2xvb2stcmlnaHQnLCAwLCA1KSxcbiAgLi4uaG9sZCgnbG9vay1sZWZ0JywgMCwgNSksXG4gIC4uLmhvbGQoJ2RlZmF1bHQnLCAwLCAxKSxcbl1cblxuY29uc3QgQ0xJQ0tfQU5JTUFUSU9OUzogcmVhZG9ubHkgKHJlYWRvbmx5IEZyYW1lW10pW10gPSBbSlVNUF9XQVZFLCBMT09LX0FST1VORF1cblxuY29uc3QgSURMRTogRnJhbWUgPSB7IHBvc2U6ICdkZWZhdWx0Jywgb2Zmc2V0OiAwIH1cbmNvbnN0IEZSQU1FX01TID0gNjBcbmNvbnN0IGluY3JlbWVudEZyYW1lID0gKGk6IG51bWJlcikgPT4gaSArIDFcbmNvbnN0IENMQVdEX0hFSUdIVCA9IDNcblxuLyoqXG4gKiBDbGF3ZCB3aXRoIGNsaWNrLXRyaWdnZXJlZCBhbmltYXRpb25zIChjcm91Y2gtanVtcCB3aXRoIGFybXMgdXAsIG9yXG4gKiBsb29rLWFyb3VuZCkuIENvbnRhaW5lciBoZWlnaHQgaXMgZml4ZWQgYXQgQ0xBV0RfSEVJR0hUIOKAlCBzYW1lIGZvb3RwcmludFxuICogYXMgYSBiYXJlIGA8Q2xhd2QgLz5gIOKAlCBzbyB0aGUgc3Vycm91bmRpbmcgbGF5b3V0IG5ldmVyIHNoaWZ0cy4gRHVyaW5nIGFcbiAqIGNyb3VjaCBvbmx5IHRoZSBmZWV0IHJvdyBjbGlwcyAoc2VlIGNvbW1lbnQgYWJvdmUpLiBDbGljayBvbmx5IGZpcmVzIHdoZW5cbiAqIG1vdXNlIHRyYWNraW5nIGlzIGVuYWJsZWQgKGkuZS4gaW5zaWRlIGA8QWx0ZXJuYXRlU2NyZWVuPmAgLyBmdWxsc2NyZWVuKTtcbiAqIGVsc2V3aGVyZSB0aGlzIHJlbmRlcnMgYW5kIGJlaGF2ZXMgaWRlbnRpY2FsbHkgdG8gcGxhaW4gYDxDbGF3ZCAvPmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBBbmltYXRlZENsYXdkKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgcG9zZSwgYm91bmNlT2Zmc2V0LCBvbkNsaWNrIH0gPSB1c2VDbGF3ZEFuaW1hdGlvbigpXG4gIHJldHVybiAoXG4gICAgPEJveCBoZWlnaHQ9e0NMQVdEX0hFSUdIVH0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG9uQ2xpY2s9e29uQ2xpY2t9PlxuICAgICAgPEJveCBtYXJnaW5Ub3A9e2JvdW5jZU9mZnNldH0gZmxleFNocmluaz17MH0+XG4gICAgICAgIDxDbGF3ZCBwb3NlPXtwb3NlfSAvPlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZnVuY3Rpb24gdXNlQ2xhd2RBbmltYXRpb24oKToge1xuICBwb3NlOiBDbGF3ZFBvc2VcbiAgYm91bmNlT2Zmc2V0OiBudW1iZXJcbiAgb25DbGljazogKCkgPT4gdm9pZFxufSB7XG4gIC8vIFJlYWQgb25jZSBhdCBtb3VudCDigJQgbm8gdXNlU2V0dGluZ3MoKSBzdWJzY3JpcHRpb24sIHNpbmNlIHRoYXQgd291bGRcbiAgLy8gcmUtcmVuZGVyIG9uIGFueSBzZXR0aW5ncyBjaGFuZ2UuXG4gIGNvbnN0IFtyZWR1Y2VkTW90aW9uXSA9IHVzZVN0YXRlKFxuICAgICgpID0+IGdldEluaXRpYWxTZXR0aW5ncygpLnByZWZlcnNSZWR1Y2VkTW90aW9uID8/IGZhbHNlLFxuICApXG4gIGNvbnN0IFtmcmFtZUluZGV4LCBzZXRGcmFtZUluZGV4XSA9IHVzZVN0YXRlKC0xKVxuICBjb25zdCBzZXF1ZW5jZVJlZiA9IHVzZVJlZjxyZWFkb25seSBGcmFtZVtdPihKVU1QX1dBVkUpXG5cbiAgY29uc3Qgb25DbGljayA9ICgpID0+IHtcbiAgICBpZiAocmVkdWNlZE1vdGlvbiB8fCBmcmFtZUluZGV4ICE9PSAtMSkgcmV0dXJuXG4gICAgc2VxdWVuY2VSZWYuY3VycmVudCA9XG4gICAgICBDTElDS19BTklNQVRJT05TW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIENMSUNLX0FOSU1BVElPTlMubGVuZ3RoKV0hXG4gICAgc2V0RnJhbWVJbmRleCgwKVxuICB9XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZnJhbWVJbmRleCA9PT0gLTEpIHJldHVyblxuICAgIGlmIChmcmFtZUluZGV4ID49IHNlcXVlbmNlUmVmLmN1cnJlbnQubGVuZ3RoKSB7XG4gICAgICBzZXRGcmFtZUluZGV4KC0xKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dChzZXRGcmFtZUluZGV4LCBGUkFNRV9NUywgaW5jcmVtZW50RnJhbWUpXG4gICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0aW1lcilcbiAgfSwgW2ZyYW1lSW5kZXhdKVxuXG4gIGNvbnN0IHNlcSA9IHNlcXVlbmNlUmVmLmN1cnJlbnRcbiAgY29uc3QgY3VycmVudCA9XG4gICAgZnJhbWVJbmRleCA+PSAwICYmIGZyYW1lSW5kZXggPCBzZXEubGVuZ3RoID8gc2VxW2ZyYW1lSW5kZXhdISA6IElETEVcbiAgcmV0dXJuIHsgcG9zZTogY3VycmVudC5wb3NlLCBib3VuY2VPZmZzZXQ6IGN1cnJlbnQub2Zmc2V0LCBvbkNsaWNrIH1cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsU0FBUyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ25ELFNBQVNDLEdBQUcsUUFBUSxjQUFjO0FBQ2xDLFNBQVNDLGtCQUFrQixRQUFRLGtDQUFrQztBQUNyRSxTQUFTQyxLQUFLLEVBQUUsS0FBS0MsU0FBUyxRQUFRLFlBQVk7QUFFbEQsS0FBS0MsS0FBSyxHQUFHO0VBQUVDLElBQUksRUFBRUYsU0FBUztFQUFFRyxNQUFNLEVBQUUsTUFBTTtBQUFDLENBQUM7O0FBRWhEO0FBQ0EsU0FBU0MsSUFBSUEsQ0FBQ0YsSUFBSSxFQUFFRixTQUFTLEVBQUVHLE1BQU0sRUFBRSxNQUFNLEVBQUVFLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRUosS0FBSyxFQUFFLENBQUM7RUFDdEUsT0FBT0ssS0FBSyxDQUFDQyxJQUFJLENBQUM7SUFBRUMsTUFBTSxFQUFFSDtF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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 formatTokens 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatTokens } from '../utils/format.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// IdleReturnAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type IdleReturnAction = 'continue' | 'clear' | 'dismiss' | 'never';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  idleMinutes: number;
  totalInputTokens: number;
  // 这个回调绑定到 onDone: (action: IdleReturnAction) => void;，负责终端渲染在该局部场景下的响应。
  onDone: (action: IdleReturnAction) => void;
};
// IdleReturnDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function IdleReturnDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(16);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    idleMinutes,
    totalInputTokens,
    onDone
  } = t0;
  // t1 暂存 `formatIdleDuration(idleMinutes)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== idleMinutes) {
    // t1 暂存 `formatIdleDuration(idleMinutes)` 生成的渲染片段，后续返回路径直接复用。
    t1 = formatIdleDuration(idleMinutes);
    // $[0] 缓存 `idleMinutes`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = idleMinutes;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // formattedIdle 命名 `t1`，让后续代码直接表达这个值的用途。
  const formattedIdle = t1;
  // t2 暂存 `formatTokens(totalInputTokens)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== totalInputTokens) {
    // t2 暂存 `formatTokens(totalInputTokens)` 生成的渲染片段，后续返回路径直接复用。
    t2 = formatTokens(totalInputTokens);
    // $[2] 缓存 `totalInputTokens`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = totalInputTokens;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // formattedTokens 集合 命名 `t2`，让后续代码直接表达这个值的用途。
  const formattedTokens = t2;
  // 临时值 t3 命名 ``You've been away ${formattedIdle} and this conversation ...`，让后续代码直接表达这个值的用途。
  const t3 = `You've been away ${formattedIdle} and this conversation is ${formattedTokens} tokens.`;
  // t4 暂存 `() => onDone("dismiss")` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== onDone) {
    // t4 暂存 `() => onDone("dismiss")` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => onDone("dismiss");
    // $[4] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onDone;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `<Box flexDirection="column"><Text>If this is a new task, ...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Box flexDirection="column"><Text>If this is a new task, ...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column"><Text>If this is a new task, clearing context will save usage and be faster.</Text></Box>;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t6 = {
      value: "continue" as const,
      label: "Continue this conversation"
    };
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[7];
  }
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      value: "clear" as const,
      label: "Send message as a new conversation"
    };
    // $[8] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[8];
  }
  // t8 暂存 `[t6, t7, {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `[t6, t7, {` 生成的渲染片段，后续返回路径直接复用。
    t8 = [t6, t7, {
      value: "never" as const,
      label: "Don't ask me again"
    }];
    // $[9] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[9];
  }
  // t9 暂存 `<Select options={t8} onChange={value => onDone(value)} />` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== onDone) {
    // t9 暂存 `<Select options={t8} onChange={value => onDone(value)} />` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Select options={t8} onChange={value => onDone(value)} />;
    // $[10] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onDone;
    // $[11] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[11];
  }
  // t10 暂存 `<Dialog title={t3} onCancel={t4}>{t5}{t9}</Dialog>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== t3 || $[13] !== t4 || $[14] !== t9) {
    // t10 暂存 `<Dialog title={t3} onCancel={t4}>{t5}{t9}</Dialog>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Dialog title={t3} onCancel={t4}>{t5}{t9}</Dialog>;
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
    // $[14] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t9;
    // $[15] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[15];
  }
  // 返回 `t10`，作为终端渲染这次计算的结果。
  return t10;
}
// formatIdleDuration 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatIdleDuration(minutes: number): string {
  // 满足 `minutes < 1` 时，终端渲染执行该分支。
  if (minutes < 1) {
    // 返回 `'< 1m'`，作为终端渲染这次计算的结果。
    return '< 1m';
  }
  // 满足 `minutes < 60` 时，终端渲染执行该分支。
  if (minutes < 60) {
    // 返回 ``${Math.floor(minutes)}m``，作为终端渲染这次计算的结果。
    return `${Math.floor(minutes)}m`;
  }
  // hours 集合保存`Math.floor`，供终端渲染后续处理使用。
  const hours = Math.floor(minutes / 60);
  // remainingMinutes 集合保存`Math.floor`，供终端渲染后续处理使用。
  const remainingMinutes = Math.floor(minutes % 60);
  // 满足 `remainingMinutes === 0` 时，终端渲染执行该分支。
  if (remainingMinutes === 0) {
    // 返回 ``${hours}h``，作为终端渲染这次计算的结果。
    return `${hours}h`;
  }
  // 返回 ``${hours}h ${remainingMinutes}m``，作为终端渲染这次计算的结果。
  return `${hours}h ${remainingMinutes}m`;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJmb3JtYXRUb2tlbnMiLCJTZWxlY3QiLCJEaWFsb2ciLCJJZGxlUmV0dXJuQWN0aW9uIiwiUHJvcHMiLCJpZGxlTWludXRlcyIsInRvdGFsSW5wdXRUb2tlbnMiLCJvbkRvbmUiLCJhY3Rpb24iLCJJZGxlUmV0dXJuRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsImZvcm1hdElkbGVEdXJhdGlvbiIsImZvcm1hdHRlZElkbGUiLCJ0MiIsImZvcm1hdHRlZFRva2VucyIsInQzIiwidDQiLCJ0NSIsIlN5bWJvbCIsImZvciIsInQ2IiwidmFsdWUiLCJjb25zdCIsImxhYmVsIiwidDciLCJ0OCIsInQ5IiwidDEwIiwibWludXRlcyIsIk1hdGgiLCJmbG9vciIsImhvdXJzIiwicmVtYWluaW5nTWludXRlcyJdLCJzb3VyY2VzIjpbIklkbGVSZXR1cm5EaWFsb2cudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGZvcm1hdFRva2VucyB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L2luZGV4LmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcblxudHlwZSBJZGxlUmV0dXJuQWN0aW9uID0gJ2NvbnRpbnVlJyB8ICdjbGVhcicgfCAnZGlzbWlzcycgfCAnbmV2ZXInXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGlkbGVNaW51dGVzOiBudW1iZXJcbiAgdG90YWxJbnB1dFRva2VuczogbnVtYmVyXG4gIG9uRG9uZTogKGFjdGlvbjogSWRsZVJldHVybkFjdGlvbikgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gSWRsZVJldHVybkRpYWxvZyh7XG4gIGlkbGVNaW51dGVzLFxuICB0b3RhbElucHV0VG9rZW5zLFxuICBvbkRvbmUsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGZvcm1hdHRlZElkbGUgPSBmb3JtYXRJZGxlRHVyYXRpb24oaWRsZU1pbnV0ZXMpXG4gIGNvbnN0IGZvcm1hdHRlZFRva2VucyA9IGZvcm1hdFRva2Vucyh0b3RhbElucHV0VG9rZW5zKVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9e2BZb3UndmUgYmVlbiBhd2F5ICR7Zm9ybWF0dGVkSWRsZX0gYW5kIHRoaXMgY29udmVyc2F0aW9uIGlzICR7Zm9ybWF0dGVkVG9rZW5zfSB0b2tlbnMuYH1cbiAgICAgIG9uQ2FuY2VsPXsoKSA9PiBvbkRvbmUoJ2Rpc21pc3MnKX1cbiAgICA+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgSWYgdGhpcyBpcyBhIG5ldyB0YXNrLCBjbGVhcmluZyBjb250ZXh0IHdpbGwgc2F2ZSB1c2FnZSBhbmQgYmUgZmFzdGVyLlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIDxTZWxlY3RcbiAgICAgICAgb3B0aW9ucz17W1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhbHVlOiAnY29udGludWUnIGFzIGNvbnN0LFxuICAgICAgICAgICAgbGFiZWw6ICdDb250aW51ZSB0aGlzIGNvbnZlcnNhdGlvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YWx1ZTogJ2NsZWFyJyBhcyBjb25zdCxcbiAgICAgICAgICAgIGxhYmVsOiAnU2VuZCBtZXNzYWdlIGFzIGEgbmV3IGNvbnZlcnNhdGlvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YWx1ZTogJ25ldmVyJyBhcyBjb25zdCxcbiAgICAgICAgICAgIGxhYmVsOiBcIkRvbid0IGFzayBtZSBhZ2FpblwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF19XG4gICAgICAgIG9uQ2hhbmdlPXsodmFsdWU6IElkbGVSZXR1cm5BY3Rpb24pID0+IG9uRG9uZSh2YWx1ZSl9XG4gICAgICAvPlxuICAgIDwvRGlhbG9nPlxuICApXG59XG5cbmZ1bmN0aW9uIGZvcm1hdElkbGVEdXJhdGlvbihtaW51dGVzOiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAobWludXRlcyA8IDEpIHtcbiAgICByZXR1cm4gJzwgMW0nXG4gIH1cbiAgaWYgKG1pbnV0ZXMgPCA2MCkge1xuICAgIHJldHVybiBgJHtNYXRoLmZsb29yKG1pbnV0ZXMpfW1gXG4gIH1cbiAgY29uc3QgaG91cnMgPSBNYXRoLmZsb29yKG1pbnV0ZXMgLyA2MClcbiAgY29uc3QgcmVtYWluaW5nTWludXRlcyA9IE1hdGguZmxvb3IobWludXRlcyAlIDYwKVxuICBpZiAocmVtYWluaW5nTWludXRlcyA9PT0gMCkge1xuICAgIHJldHVybiBgJHtob3Vyc31oYFxuICB9XG4gIHJldHVybiBgJHtob3Vyc31oICR7cmVtYWluaW5nTWludXRlc31tYFxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUNyQyxTQUFTQyxZQUFZLFFBQVEsb0JBQW9CO0FBQ2pELFNBQVNDLE1BQU0sUUFBUSx5QkFBeUI7QUFDaEQsU0FBU0MsTUFBTSxRQUFRLDJCQUEyQjtBQUVsRCxLQUFLQyxnQkFBZ0IsR0FBRyxVQUFVLEdBQUcsT0FBTyxHQUFHLFNBQVMsR0FBRyxPQUFPO0FBRWxFLEtBQUtDLEtBQUssR0FBRztFQUNYQyxXQUFXLEVBQUUsTUFBTTtFQUNuQkMsZ0JBQWdCLEVBQUUsTUFBTTtFQUN4QkMsTUFBTSxFQUFFLENBQUNDLE1BQU0sRUFBRUwsZ0JBQWdCLEVBQUUsR0FBRyxJQUFJO0FBQzVDLENBQUM7QUFFRCxPQUFPLFNBQUFNLGlCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxF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
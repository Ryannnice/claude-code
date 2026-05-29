// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 GITHUB_ACTION_SETUP_DOCS_URL，将 ../../constants/github-app.js 中已经封装好的能力接到本文件流程里。
import { GITHUB_ACTION_SETUP_DOCS_URL } from '../../constants/github-app.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 类型依赖 { Warning } 来自 ./types.js，用于校准命令处理的数据契约。
import type { Warning } from './types.js';
// WarningsStepProps 描述命令处理需要实现的字段和回调，避免跨模块交互时契约漂移。
interface WarningsStepProps {
  warnings: Warning[];
  // 这个回调绑定到 onContinue: () => void;，负责命令处理在该局部场景下的响应。
  onContinue: () => void;
}
// WarningsStep 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WarningsStep(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    warnings,
    onContinue
  } = t0;
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      context: "Confirmation"
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 useKeybinding，触发命令处理此处需要的副作用。
  useKeybinding("confirm:yes", onContinue, t1);
  // t2 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexDirection="column" marginBottom={1}><Text bold={true}>{figures.warning} Setup Warnings</Text><Text dimColor={true}>We found some potential issues, but you can continue anyway</Text></Box>;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3 暂存 `warnings.map(_temp2)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== warnings) {
    // t3 暂存 `warnings.map(_temp2)` 生成的渲染片段，后续返回路径直接复用。
    t3 = warnings.map(_temp2);
    // $[2] 缓存 `warnings`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = warnings;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // t4 暂存 `<Box marginTop={1}><Text bold={true} color="permission">P...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Box marginTop={1}><Text bold={true} color="permission">P...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box marginTop={1}><Text bold={true} color="permission">Press Enter to continue anyway, or Ctrl+C to exit and fix issues</Text></Box>;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `<Box marginTop={1}><Text dimColor={true}>You can also try...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Box marginTop={1}><Text dimColor={true}>You can also try...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box marginTop={1}><Text dimColor={true}>You can also try the manual setup steps if needed:{" "}<Text color="claude">{GITHUB_ACTION_SETUP_DOCS_URL}</Text></Text></Box>;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // t6 暂存 `<><Box flexDirection="column" borderStyle="round" padding...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t3) {
    // t6 暂存 `<><Box flexDirection="column" borderStyle="round" padding...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <><Box flexDirection="column" borderStyle="round" paddingX={1}>{t2}{t3}{t4}{t5}</Box></>;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[7];
  }
  // 返回 `t6`，作为命令处理这次计算的结果。
  return t6;
}
// _temp2 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(warning, index) {
  // 返回 `<Box key={index} flexDirection="column" marginBottom={1}><Text color="w...`，作为命令处理这次计算的结果。
  return <Box key={index} flexDirection="column" marginBottom={1}><Text color="warning" bold={true}>{warning.title}</Text><Text>{warning.message}</Text>{warning.instructions.length > 0 && <Box flexDirection="column" marginLeft={2} marginTop={1}>{warning.instructions.map(_temp)}</Box>}</Box>;
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(instruction, i) {
  // 返回 `<Text key={i} dimColor={true}>• {instruction}</Text>`，作为命令处理这次计算的结果。
  return <Text key={i} dimColor={true}>• {instruction}</Text>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJHSVRIVUJfQUNUSU9OX1NFVFVQX0RPQ1NfVVJMIiwiQm94IiwiVGV4dCIsInVzZUtleWJpbmRpbmciLCJXYXJuaW5nIiwiV2FybmluZ3NTdGVwUHJvcHMiLCJ3YXJuaW5ncyIsIm9uQ29udGludWUiLCJXYXJuaW5nc1N0ZXAiLCJ0MCIsIiQiLCJfYyIsInQxIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQyIiwid2FybmluZyIsInQzIiwibWFwIiwiX3RlbXAyIiwidDQiLCJ0NSIsInQ2IiwiaW5kZXgiLCJ0aXRsZSIsIm1lc3NhZ2UiLCJpbnN0cnVjdGlvbnMiLCJsZW5ndGgiLCJfdGVtcCIsImluc3RydWN0aW9uIiwiaSJdLCJzb3VyY2VzIjpbIldhcm5pbmdzU3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEdJVEhVQl9BQ1RJT05fU0VUVVBfRE9DU19VUkwgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvZ2l0aHViLWFwcC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHR5cGUgeyBXYXJuaW5nIH0gZnJvbSAnLi90eXBlcy5qcydcblxuaW50ZXJmYWNlIFdhcm5pbmdzU3RlcFByb3BzIHtcbiAgd2FybmluZ3M6IFdhcm5pbmdbXVxuICBvbkNvbnRpbnVlOiAoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBXYXJuaW5nc1N0ZXAoeyB3YXJuaW5ncywgb25Db250aW51ZSB9OiBXYXJuaW5nc1N0ZXBQcm9wcykge1xuICAvLyBFbnRlciB0byBjb250aW51ZVxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOnllcycsIG9uQ29udGludWUsIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSlcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBib3JkZXJTdHlsZT1cInJvdW5kXCIgcGFkZGluZ1g9ezF9PlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgIDxUZXh0IGJvbGQ+e2ZpZ3VyZXMud2FybmluZ30gU2V0dXAgV2FybmluZ3M8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICBXZSBmb3VuZCBzb21lIHBvdGVudGlhbCBpc3N1ZXMsIGJ1dCB5b3UgY2FuIGNvbnRpbnVlIGFueXdheVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAge3dhcm5pbmdzLm1hcCgod2FybmluZywgaW5kZXgpID0+IChcbiAgICAgICAgICA8Qm94IGtleT17aW5kZXh9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCIgYm9sZD5cbiAgICAgICAgICAgICAge3dhcm5pbmcudGl0bGV9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dD57d2FybmluZy5tZXNzYWdlfTwvVGV4dD5cbiAgICAgICAgICAgIHt3YXJuaW5nLmluc3RydWN0aW9ucy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luTGVmdD17Mn0gbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICAgICAgICB7d2FybmluZy5pbnN0cnVjdGlvbnMubWFwKChpbnN0cnVjdGlvbiwgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgPFRleHQga2V5PXtpfSBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgICAg4oCiIHtpbnN0cnVjdGlvbn1cbiAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApKX1cblxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFRleHQgYm9sZCBjb2xvcj1cInBlcm1pc3Npb25cIj5cbiAgICAgICAgICAgIFByZXNzIEVudGVyIHRvIGNvbnRpbnVlIGFueXdheSwgb3IgQ3RybCtDIHRvIGV4aXQgYW5kIGZpeCBpc3N1ZXNcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICBZb3UgY2FuIGFsc28gdHJ5IHRoZSBtYW51YWwgc2V0dXAgc3RlcHMgaWYgbmVlZGVkOnsnICd9XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXVkZVwiPntHSVRIVUJfQUNUSU9OX1NFVFVQX0RPQ1NfVVJMfTwvVGV4dD5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLDRCQUE0QixRQUFRLCtCQUErQjtBQUM1RSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFDbEUsY0FBY0MsT0FBTyxRQUFRLFlBQVk7QUFFekMsVUFBVUMsaUJBQWlCLENBQUM7RUFDMUJDLFFBQVEsRUFBRUYsT0FBTyxFQUFFO0VBQ25CRyxVQUFVLEVBQUUsR0FBRyxHQUFHLElBQUk7QUFDeEI7QUFFQSxPQUFPLFNBQUFDLGFBQUFDLEVBQUE7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
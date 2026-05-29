// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback } from 'react';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js';
// 引入 Box、Link、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../ink.js';
// 类型依赖 { ExternalClaudeMdInclude } 来自 ../utils/claudemd.js，用于校准终端渲染的数据契约。
import type { ExternalClaudeMdInclude } from '../utils/claudemd.js';
// 复用 saveCurrentProjectConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { saveCurrentProjectConfig } from '../utils/config.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onDone(): void;
  isStandaloneDialog?: boolean;
  externalIncludes?: ExternalClaudeMdInclude[];
};
// ClaudeMdExternalIncludesDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ClaudeMdExternalIncludesDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    isStandaloneDialog,
    externalIncludes
  } = t0;
  // t1 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(_temp, t1);
  // t2 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onDone) {
    // t2 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = value => {
      // 当 `value` 匹配 `"no"` 时，终端渲染执行对应分支。
      if (value === "no") {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_claude_md_external_includes_dialog_declined", {});
        // 调用 saveCurrentProjectConfig，触发终端渲染此处需要的副作用。
        saveCurrentProjectConfig(_temp2);
      } else {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_claude_md_external_includes_dialog_accepted", {});
        // 调用 saveCurrentProjectConfig，触发终端渲染此处需要的副作用。
        saveCurrentProjectConfig(_temp3);
      }
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[1] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onDone;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // handleSelection保存`t2`，作为后续临时缓存值处理的输入。
  const handleSelection = t2;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== handleSelection) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 调用 handleSelection，触发终端渲染此处需要的副作用。
      handleSelection("no");
    };
    // $[3] 缓存 `handleSelection`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = handleSelection;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // handleEscape保存`t3`，作为后续临时缓存值处理的输入。
  const handleEscape = t3;
  // t4标记终端 UI Claude Md External I...是否启用对应路径。
  const t4 = !isStandaloneDialog;
  // t5标记终端 UI Claude Md External I...是否启用对应路径。
  const t5 = !isStandaloneDialog;
  // t6 暂存 `<Text>This project's CLAUDE.md imports files outside the ...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Text>This project's CLAUDE.md imports files outside the ...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text>This project's CLAUDE.md imports files outside the current working directory. Never allow this for third-party repositories.</Text>;
    // $[5] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t6;
  } else {
    // t6从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[5];
  }
  // t7暂存 `externalIncludes && externalIncludes.length > 0 && <Box f...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== externalIncludes) {
    // t7暂存 `externalIncludes && externalIncludes.length > 0 && <Box f...` 生成的渲染片段，后续返回路径直接复用。
    t7 = externalIncludes && externalIncludes.length > 0 && <Box flexDirection="column"><Text dimColor={true}>External imports:</Text>{externalIncludes.map(_temp4)}</Box>;
    // $[6] 缓存 `externalIncludes`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = externalIncludes;
    // $[7] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t7;
  } else {
    // t7从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[7];
  }
  // t8暂存 `<Text dimColor={true}>Important: Only use Claude Code wit...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // 判断 $[8] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t8暂存 `<Text dimColor={true}>Important: Only use Claude Code wit...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text dimColor={true}>Important: Only use Claude Code with files you trust. Accessing untrusted files may pose security risks{" "}<Link url="https://code.claude.com/docs/en/security" />{" "}</Text>;
    // $[8] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t8;
  } else {
    // t8从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[8];
  }
  // t9暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // 判断 $[9] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t9暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t9 = [{
      label: "Yes, allow external imports",
      value: "yes"
    }, {
      label: "No, disable external imports",
      value: "no"
    }];
    // $[9] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t9;
  } else {
    // t9从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[9];
  }
  // t10暂存 `<Select options={t9} onChange={value_0 => handleSelection...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== handleSelection) {
    // t10暂存 `<Select options={t9} onChange={value_0 => handleSelection...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Select options={t9} onChange={value_0 => handleSelection(value_0 as 'yes' | 'no')} />;
    // $[10] 缓存 `handleSelection`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = handleSelection;
    // $[11] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t10;
  } else {
    // t10从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[11];
  }
  // t11暂存 `<Dialog title="Allow external CLAUDE.md file imports?" co...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== handleEscape || $[13] !== t10 || $[14] !== t4 || $[15] !== t5 || $[16] !== t7) {
    // t11暂存 `<Dialog title="Allow external CLAUDE.md file imports?" co...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Dialog title="Allow external CLAUDE.md file imports?" color="warning" onCancel={handleEscape} hideBorder={t4} hideInputGuide={t5}>{t6}{t7}{t8}{t10}</Dialog>;
    // $[12] 缓存 `handleEscape`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = handleEscape;
    // $[13] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t10;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
    // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t5;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
    // $[17] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t11;
  } else {
    // t11从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[17];
  }
  // 返回 t11，把终端渲染这个分支的结果交还调用方。
  return t11;
}
// _temp4 承担终端渲染中的独立步骤，串起终端 UI 组件 Claude Md External Includes Dialog需要的输入整理、状态更新和结果输出。
function _temp4(include, i) {
  // 返回 <Text key={i} dimColor={true}>{" "}{include.path}</Text>，把终端渲染这个分支的结果交还调用方。
  return <Text key={i} dimColor={true}>{"  "}{include.path}</Text>;
}
// _temp3 承担终端渲染中的独立步骤，串起终端 UI 组件 Claude Md External Includes Dialog需要的输入整理、状态更新和结果输出。
function _temp3(current_0) {
  // 返回 {，把终端渲染这个分支的结果交还调用方。
  return {
    ...current_0,
    hasClaudeMdExternalIncludesApproved: true,
    hasClaudeMdExternalIncludesWarningShown: true
  };
}
// _temp2 承担终端渲染中的独立步骤，串起终端 UI 组件 Claude Md External Includes Dialog需要的输入整理、状态更新和结果输出。
function _temp2(current) {
  // 返回 {，把终端渲染这个分支的结果交还调用方。
  return {
    ...current,
    hasClaudeMdExternalIncludesApproved: false,
    hasClaudeMdExternalIncludesWarningShown: true
  };
}
// _temp 承担终端渲染中的独立步骤，串起终端 UI 组件 Claude Md External Includes Dialog需要的输入整理、状态更新和结果输出。
function _temp() {
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent("tengu_claude_md_includes_dialog_shown", {});
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwibG9nRXZlbnQiLCJCb3giLCJMaW5rIiwiVGV4dCIsIkV4dGVybmFsQ2xhdWRlTWRJbmNsdWRlIiwic2F2ZUN1cnJlbnRQcm9qZWN0Q29uZmlnIiwiU2VsZWN0IiwiRGlhbG9nIiwiUHJvcHMiLCJvbkRvbmUiLCJpc1N0YW5kYWxvbmVEaWFsb2ciLCJleHRlcm5hbEluY2x1ZGVzIiwiQ2xhdWRlTWRFeHRlcm5hbEluY2x1ZGVzRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsInVzZUVmZmVjdCIsIl90ZW1wIiwidDIiLCJ2YWx1ZSIsIl90ZW1wMiIsIl90ZW1wMyIsImhhbmRsZVNlbGVjdGlvbiIsInQzIiwiaGFuZGxlRXNjYXBlIiwidDQiLCJ0NSIsInQ2IiwidDciLCJsZW5ndGgiLCJtYXAiLCJfdGVtcDQiLCJ0OCIsInQ5IiwibGFiZWwiLCJ0MTAiLCJ2YWx1ZV8wIiwidDExIiwiaW5jbHVkZSIsImkiLCJwYXRoIiwiY3VycmVudF8wIiwiY3VycmVudCIsImhhc0NsYXVkZU1kRXh0ZXJuYWxJbmNsdWRlc0FwcHJvdmVkIiwiaGFzQ2xhdWRlTWRFeHRlcm5hbEluY2x1ZGVzV2FybmluZ1Nob3duIl0sInNvdXJjZXMiOlsiQ2xhdWRlTWRFeHRlcm5hbEluY2x1ZGVzRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGxvZ0V2ZW50IH0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IEJveCwgTGluaywgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgRXh0ZXJuYWxDbGF1ZGVNZEluY2x1ZGUgfSBmcm9tICcuLi91dGlscy9jbGF1ZGVtZC5qcydcbmltcG9ydCB7IHNhdmVDdXJyZW50UHJvamVjdENvbmZpZyB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L2luZGV4LmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25Eb25lKCk6IHZvaWRcbiAgaXNTdGFuZGFsb25lRGlhbG9nPzogYm9vbGVhblxuICBleHRlcm5hbEluY2x1ZGVzPzogRXh0ZXJuYWxDbGF1ZGVNZEluY2x1ZGVbXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gQ2xhdWRlTWRFeHRlcm5hbEluY2x1ZGVzRGlhbG9nKHtcbiAgb25Eb25lLFxuICBpc1N0YW5kYWxvbmVEaWFsb2csXG4gIGV4dGVybmFsSW5jbHVkZXMsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8gTG9nIHdoZW4gZGlhbG9nIGlzIHNob3duXG4gICAgbG9nRXZlbnQoJ3Rlbmd1X2NsYXVkZV9tZF9pbmNsdWRlc19kaWFsb2dfc2hvd24nLCB7fSlcbiAgfSwgW10pXG5cbiAgY29uc3QgaGFuZGxlU2VsZWN0aW9uID0gdXNlQ2FsbGJhY2soXG4gICAgKHZhbHVlOiAneWVzJyB8ICdubycpID0+IHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gJ25vJykge1xuICAgICAgICBsb2dFdmVudCgndGVuZ3VfY2xhdWRlX21kX2V4dGVybmFsX2luY2x1ZGVzX2RpYWxvZ19kZWNsaW5lZCcsIHt9KVxuICAgICAgICAvLyBNYXJrIHRoYXQgd2UndmUgc2hvd24gdGhlIGRpYWxvZyBidXQgaXQgd2FzIGRlY2xpbmVkXG4gICAgICAgIHNhdmVDdXJyZW50UHJvamVjdENvbmZpZyhjdXJyZW50ID0+ICh7XG4gICAgICAgICAgLi4uY3VycmVudCxcbiAgICAgICAgICBoYXNDbGF1ZGVNZEV4dGVybmFsSW5jbHVkZXNBcHByb3ZlZDogZmFsc2UsXG4gICAgICAgICAgaGFzQ2xhdWRlTWRFeHRlcm5hbEluY2x1ZGVzV2FybmluZ1Nob3duOiB0cnVlLFxuICAgICAgICB9KSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9jbGF1ZGVfbWRfZXh0ZXJuYWxfaW5jbHVkZXNfZGlhbG9nX2FjY2VwdGVkJywge30pXG4gICAgICAgIHNhdmVDdXJyZW50UHJvamVjdENvbmZpZyhjdXJyZW50ID0+ICh7XG4gICAgICAgICAgLi4uY3VycmVudCxcbiAgICAgICAgICBoYXNDbGF1ZGVNZEV4dGVybmFsSW5jbHVkZXNBcHByb3ZlZDogdHJ1ZSxcbiAgICAgICAgICBoYXNDbGF1ZGVNZEV4dGVybmFsSW5jbHVkZXNXYXJuaW5nU2hvd246IHRydWUsXG4gICAgICAgIH0pKVxuICAgICAgfVxuXG4gICAgICBvbkRvbmUoKVxuICAgIH0sXG4gICAgW29uRG9uZV0sXG4gIClcblxuICBjb25zdCBoYW5kbGVFc2NhcGUgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaGFuZGxlU2VsZWN0aW9uKCdubycpXG4gIH0sIFtoYW5kbGVTZWxlY3Rpb25dKVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9XCJBbGxvdyBleHRlcm5hbCBDTEFVREUubWQgZmlsZSBpbXBvcnRzP1wiXG4gICAgICBjb2xvcj1cIndhcm5pbmdcIlxuICAgICAgb25DYW5jZWw9e2hhbmRsZUVzY2FwZX1cbiAgICAgIGhpZGVCb3JkZXI9eyFpc1N0YW5kYWxvbmVEaWFsb2d9XG4gICAgICBoaWRlSW5wdXRHdWlkZT17IWlzU3RhbmRhbG9uZURpYWxvZ31cbiAgICA+XG4gICAgICA8VGV4dD5cbiAgICAgICAgVGhpcyBwcm9qZWN0JmFwb3M7cyBDTEFVREUubWQgaW1wb3J0cyBmaWxlcyBvdXRzaWRlIHRoZSBjdXJyZW50IHdvcmtpbmdcbiAgICAgICAgZGlyZWN0b3J5LiBOZXZlciBhbGxvdyB0aGlzIGZvciB0aGlyZC1wYXJ0eSByZXBvc2l0b3JpZXMuXG4gICAgICA8L1RleHQ+XG5cbiAgICAgIHtleHRlcm5hbEluY2x1ZGVzICYmIGV4dGVybmFsSW5jbHVkZXMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPkV4dGVybmFsIGltcG9ydHM6PC9UZXh0PlxuICAgICAgICAgIHtleHRlcm5hbEluY2x1ZGVzLm1hcCgoaW5jbHVkZSwgaSkgPT4gKFxuICAgICAgICAgICAgPFRleHQga2V5PXtpfSBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgeycgICd9XG4gICAgICAgICAgICAgIHtpbmNsdWRlLnBhdGh9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cblxuICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgIEltcG9ydGFudDogT25seSB1c2UgQ2xhdWRlIENvZGUgd2l0aCBmaWxlcyB5b3UgdHJ1c3QuIEFjY2Vzc2luZ1xuICAgICAgICB1bnRydXN0ZWQgZmlsZXMgbWF5IHBvc2Ugc2VjdXJpdHkgcmlza3N7JyAnfVxuICAgICAgICA8TGluayB1cmw9XCJodHRwczovL2NvZGUuY2xhdWRlLmNvbS9kb2NzL2VuL3NlY3VyaXR5XCIgLz57JyAnfVxuICAgICAgPC9UZXh0PlxuXG4gICAgICA8U2VsZWN0XG4gICAgICAgIG9wdGlvbnM9e1tcbiAgICAgICAgICB7IGxhYmVsOiAnWWVzLCBhbGxvdyBleHRlcm5hbCBpbXBvcnRzJywgdmFsdWU6ICd5ZXMnIH0sXG4gICAgICAgICAgeyBsYWJlbDogJ05vLCBkaXNhYmxlIGV4dGVybmFsIGltcG9ydHMnLCB2YWx1ZTogJ25vJyB9LFxuICAgICAgICBdfVxuICAgICAgICBvbkNoYW5nZT17dmFsdWUgPT4gaGFuZGxlU2VsZWN0aW9uKHZhbHVlIGFzICd5ZXMnIHwgJ25vJyl9XG4gICAgICAvPlxuICAgIDwvRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFL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
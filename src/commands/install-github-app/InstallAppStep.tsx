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
// InstallAppStepProps 描述命令处理需要实现的字段和回调，避免跨模块交互时契约漂移。
interface InstallAppStepProps {
  repoUrl: string;
  // 这个回调绑定到 onSubmit: () => void;，负责命令处理在该局部场景下的响应。
  onSubmit: () => void;
}
// InstallAppStep 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function InstallAppStep(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(12);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    repoUrl,
    onSubmit
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
  useKeybinding("confirm:yes", onSubmit, t1);
  // t2 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexDirection="column" marginBottom={1}><Text bold={true}>Install the Claude GitHub App</Text></Box>;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3 暂存 `<Box marginBottom={1}><Text>Opening browser to install th...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box marginBottom={1}><Text>Opening browser to install th...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box marginBottom={1}><Text>Opening browser to install the Claude GitHub App…</Text></Box>;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // t4 暂存 `<Box marginBottom={1}><Text>If your browser doesn't open ...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Box marginBottom={1}><Text>If your browser doesn't open ...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box marginBottom={1}><Text>If your browser doesn't open automatically, visit:</Text></Box>;
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // t5暂存 `<Box marginBottom={1}><Text underline={true}>https://gith...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // 判断 $[4] === Symbol.for("react.memo_cache_sentinel")，将命令处理分流到只适用于该条件的处理路径。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t5暂存 `<Box marginBottom={1}><Text underline={true}>https://gith...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box marginBottom={1}><Text underline={true}>https://github.com/apps/claude</Text></Box>;
    // $[4] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t5;
  } else {
    // t5从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[4];
  }
  // t6暂存 `<Box marginBottom={1}><Text>Please install the app for re...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== repoUrl) {
    // t6暂存 `<Box marginBottom={1}><Text>Please install the app for re...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box marginBottom={1}><Text>Please install the app for repository: <Text bold={true}>{repoUrl}</Text></Text></Box>;
    // $[5] 缓存 `repoUrl`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = repoUrl;
    // $[6] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t6;
  } else {
    // t6从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[6];
  }
  // t7暂存 `<Box marginBottom={1}><Text dimColor={true}>Important: Ma...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // 判断 $[7] === Symbol.for("react.memo_cache_sentinel")，将命令处理分流到只适用于该条件的处理路径。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t7暂存 `<Box marginBottom={1}><Text dimColor={true}>Important: Ma...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginBottom={1}><Text dimColor={true}>Important: Make sure to grant access to this specific repository</Text></Box>;
    // $[7] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t7;
  } else {
    // t7从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[7];
  }
  // t8暂存 `<Box><Text bold={true} color="permission">Press Enter onc...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // 判断 $[8] === Symbol.for("react.memo_cache_sentinel")，将命令处理分流到只适用于该条件的处理路径。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t8暂存 `<Box><Text bold={true} color="permission">Press Enter onc...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box><Text bold={true} color="permission">Press Enter once you've installed the app{figures.ellipsis}</Text></Box>;
    // $[8] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t8;
  } else {
    // t8从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[8];
  }
  // t9暂存 `<Box marginTop={1}><Text dimColor={true}>Having trouble? ...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // 判断 $[9] === Symbol.for("react.memo_cache_sentinel")，将命令处理分流到只适用于该条件的处理路径。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t9暂存 `<Box marginTop={1}><Text dimColor={true}>Having trouble? ...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box marginTop={1}><Text dimColor={true}>Having trouble? See manual setup instructions at:{" "}<Text color="claude">{GITHUB_ACTION_SETUP_DOCS_URL}</Text></Text></Box>;
    // $[9] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t9;
  } else {
    // t9从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[9];
  }
  // t10暂存 `<Box flexDirection="column" borderStyle="round" borderDim...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t6) {
    // t10暂存 `<Box flexDirection="column" borderStyle="round" borderDim...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box flexDirection="column" borderStyle="round" borderDimColor={true} paddingX={1}>{t2}{t3}{t4}{t5}{t6}{t7}{t8}{t9}</Box>;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
    // $[11] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t10;
  } else {
    // t10从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[11];
  }
  // 返回 t10，把命令处理这个分支的结果交还调用方。
  return t10;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJHSVRIVUJfQUNUSU9OX1NFVFVQX0RPQ1NfVVJMIiwiQm94IiwiVGV4dCIsInVzZUtleWJpbmRpbmciLCJJbnN0YWxsQXBwU3RlcFByb3BzIiwicmVwb1VybCIsIm9uU3VibWl0IiwiSW5zdGFsbEFwcFN0ZXAiLCJ0MCIsIiQiLCJfYyIsInQxIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQyIiwidDMiLCJ0NCIsInQ1IiwidDYiLCJ0NyIsInQ4IiwiZWxsaXBzaXMiLCJ0OSIsInQxMCJdLCJzb3VyY2VzIjpbIkluc3RhbGxBcHBTdGVwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgR0lUSFVCX0FDVElPTl9TRVRVUF9ET0NTX1VSTCB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy9naXRodWItYXBwLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5cbmludGVyZmFjZSBJbnN0YWxsQXBwU3RlcFByb3BzIHtcbiAgcmVwb1VybDogc3RyaW5nXG4gIG9uU3VibWl0OiAoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBJbnN0YWxsQXBwU3RlcCh7IHJlcG9VcmwsIG9uU3VibWl0IH06IEluc3RhbGxBcHBTdGVwUHJvcHMpIHtcbiAgLy8gRW50ZXIgdG8gc3VibWl0XG4gIHVzZUtleWJpbmRpbmcoJ2NvbmZpcm06eWVzJywgb25TdWJtaXQsIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSlcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGJvcmRlclN0eWxlPVwicm91bmRcIiBib3JkZXJEaW1Db2xvciBwYWRkaW5nWD17MX0+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICA8VGV4dCBib2xkPkluc3RhbGwgdGhlIENsYXVkZSBHaXRIdWIgQXBwPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgIDxUZXh0Pk9wZW5pbmcgYnJvd3NlciB0byBpbnN0YWxsIHRoZSBDbGF1ZGUgR2l0SHViIEFwcOKApjwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICA8VGV4dD5JZiB5b3VyIGJyb3dzZXIgZG9lc24mYXBvczt0IG9wZW4gYXV0b21hdGljYWxseSwgdmlzaXQ6PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgIDxUZXh0IHVuZGVybGluZT5odHRwczovL2dpdGh1Yi5jb20vYXBwcy9jbGF1ZGU8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIDxCb3ggbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgUGxlYXNlIGluc3RhbGwgdGhlIGFwcCBmb3IgcmVwb3NpdG9yeTogPFRleHQgYm9sZD57cmVwb1VybH08L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBJbXBvcnRhbnQ6IE1ha2Ugc3VyZSB0byBncmFudCBhY2Nlc3MgdG8gdGhpcyBzcGVjaWZpYyByZXBvc2l0b3J5XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgYm9sZCBjb2xvcj1cInBlcm1pc3Npb25cIj5cbiAgICAgICAgICBQcmVzcyBFbnRlciBvbmNlIHlvdSZhcG9zO3ZlIGluc3RhbGxlZCB0aGUgYXBwe2ZpZ3VyZXMuZWxsaXBzaXN9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBIYXZpbmcgdHJvdWJsZT8gU2VlIG1hbnVhbCBzZXR1cCBpbnN0cnVjdGlvbnMgYXQ6eycgJ31cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXVkZVwiPntHSVRIVUJfQUNUSU9OX1NFVFVQX0RPQ1NfVVJMfTwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLDRCQUE0QixRQUFRLCtCQUErQjtBQUM1RSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFFbEUsVUFBVUMsbUJBQW1CLENBQUM7RUFDNUJDLE9BQU8sRUFBRSxNQUFNO0VBQ2ZDLFFBQVEsRUFBRSxHQUFHLEdBQUcsSUFBSTtBQUN0QjtBQUVBLE9BQU8sU0FBQUMsZUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUF3QjtJQUFBTCxPQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFBMEM7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFFaENGLEVBQUE7TUFBQUcsT0FBQSxFQUFXO0lBQWUsQ0FBQztJQUFBTCxDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQUFsRU4sYUFBYSxDQUFDLGFBQWEsRUFBRUcsUUFBUSxFQUFFSyxFQUEyQixDQUFDO0VBQUEsSUFBQUksRUFBQTtFQUFBLElBQUFOLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFB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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js';
// 类型依赖 { SandboxDependencyCheck } 来自 ../../utils/sandbox/sandbox-adapter.js，用于校准终端渲染的数据契约。
import type { SandboxDependencyCheck } from '../../utils/sandbox/sandbox-adapter.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  depCheck: SandboxDependencyCheck;
};
// SandboxDependenciesTab 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SandboxDependenciesTab(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(24);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    depCheck
  } = t0;
  // t1 暂存 `getPlatform()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getPlatform()` 生成的渲染片段，后续返回路径直接复用。
    t1 = getPlatform();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // platform保存`t1`，作为后续临时缓存值处理的输入。
  const platform = t1;
  // isMac标记终端 UI Sandbox Dependencies...是否启用对应路径。
  const isMac = platform === "macos";
  // t2 暂存 `depCheck.errors.some(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== depCheck.errors) {
    // t2 暂存 `depCheck.errors.some(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t2 = depCheck.errors.some(_temp);
    // $[1] 缓存 `depCheck.errors`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = depCheck.errors;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // rgMissing保存`t2`，作为后续临时缓存值处理的输入。
  const rgMissing = t2;
  // t3 暂存 `depCheck.errors.some(_temp2)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== depCheck.errors) {
    // t3 暂存 `depCheck.errors.some(_temp2)` 生成的渲染片段，后续返回路径直接复用。
    t3 = depCheck.errors.some(_temp2);
    // $[3] 缓存 `depCheck.errors`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = depCheck.errors;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // bwrapMissing保存`t3`，作为后续临时缓存值处理的输入。
  const bwrapMissing = t3;
  // t4 暂存 `depCheck.errors.some(_temp3)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== depCheck.errors) {
    // t4 暂存 `depCheck.errors.some(_temp3)` 生成的渲染片段，后续返回路径直接复用。
    t4 = depCheck.errors.some(_temp3);
    // $[5] 缓存 `depCheck.errors`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = depCheck.errors;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // socatMissing 命名 `t4`，让后续代码直接表达这个值的用途。
  const socatMissing = t4;
  // seccompMissing保存 `depCheck.warnings.length > 0` 的判断结果，供终端 UI Sandbox Dependencies...后续分支直接复用。
  const seccompMissing = depCheck.warnings.length > 0;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== bwrapMissing || $[8] !== depCheck.errors || $[9] !== rgMissing || $[10] !== seccompMissing || $[11] !== socatMissing) {
    // otherErrors 错误信息筛选`errors.filter`，供终端渲染后续处理使用。
    const otherErrors = depCheck.errors.filter(_temp4);
    // rgInstallHint保存`isMac ? "brew install ripgrep" : "apt install ripgrep"`，供后续判断或组装使用。
    const rgInstallHint = isMac ? "brew install ripgrep" : "apt install ripgrep";
    // t6 暂存 `isMac && <Box flexDirection="column"><Text>seatbelt: <Tex...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      // t6 暂存 `isMac && <Box flexDirection="column"><Text>seatbelt: <Tex...` 生成的渲染片段，后续返回路径直接复用。
      t6 = isMac && <Box flexDirection="column"><Text>seatbelt: <Text color="success">built-in (macOS)</Text></Text></Box>;
      // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[13];
    }
    // t7 暂存 `<Text>ripgrep (rg):{" "}{rgMissing ? <Text color="error">...` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // t8 暂存 `rgMissing && <Text dimColor={true}>{" "}· {rgInstallHint}...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[14] !== rgMissing) {
      // t7 暂存 `<Text>ripgrep (rg):{" "}{rgMissing ? <Text color="error">...` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text>ripgrep (rg):{" "}{rgMissing ? <Text color="error">not found</Text> : <Text color="success">found</Text>}</Text>;
      // t8 暂存 `rgMissing && <Text dimColor={true}>{" "}· {rgInstallHint}...` 生成的渲染片段，后续返回路径直接复用。
      t8 = rgMissing && <Text dimColor={true}>{"  "}· {rgInstallHint}</Text>;
      // $[14] 缓存 `rgMissing`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = rgMissing;
      // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t7;
      // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t8;
    } else {
      // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[15];
      // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[16];
    }
    // t9 暂存 `<Box flexDirection="column">{t7}{t8}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== t7 || $[18] !== t8) {
      // t9 暂存 `<Box flexDirection="column">{t7}{t8}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Box flexDirection="column">{t7}{t8}</Box>;
      // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t7;
      // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t8;
      // $[19] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[19];
    }
    // t10 暂存 `!isMac && <><Box flexDirection="column"><Text>bubblewrap ...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[20] !== bwrapMissing || $[21] !== seccompMissing || $[22] !== socatMissing) {
      // t10 暂存 `!isMac && <><Box flexDirection="column"><Text>bubblewrap ...` 生成的渲染片段，后续返回路径直接复用。
      t10 = !isMac && <><Box flexDirection="column"><Text>bubblewrap (bwrap):{" "}{bwrapMissing ? <Text color="error">not installed</Text> : <Text color="success">installed</Text>}</Text>{bwrapMissing && <Text dimColor={true}>{"  "}· apt install bubblewrap</Text>}</Box><Box flexDirection="column"><Text>socat:{" "}{socatMissing ? <Text color="error">not installed</Text> : <Text color="success">installed</Text>}</Text>{socatMissing && <Text dimColor={true}>{"  "}· apt install socat</Text>}</Box><Box flexDirection="column"><Text>seccomp filter:{" "}{seccompMissing ? <Text color="warning">not installed</Text> : <Text color="success">installed</Text>}{seccompMissing && <Text dimColor={true}> (required to block unix domain sockets)</Text>}</Text>{seccompMissing && <Box flexDirection="column"><Text dimColor={true}>{"  "}· npm install -g @anthropic-ai/sandbox-runtime</Text><Text dimColor={true}>{"  "}· or copy vendor/seccomp/* from sandbox-runtime and set</Text><Text dimColor={true}>{"    "}sandbox.seccomp.bpfPath and applyPath in settings.json</Text></Box>}</Box></>;
      // $[20] 缓存 `bwrapMissing`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = bwrapMissing;
      // $[21] 缓存 `seccompMissing`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = seccompMissing;
      // $[22] 缓存 `socatMissing`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = socatMissing;
      // $[23] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = t10;
    } else {
      // t10从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[23];
    }
    // t5暂存 `<Box flexDirection="column" paddingY={1} gap={1}>{t6}{t9}...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" paddingY={1} gap={1}>{t6}{t9}{t10}{otherErrors.map(_temp5)}</Box>;
    // $[7] 缓存 `bwrapMissing`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = bwrapMissing;
    // $[8] 缓存 `depCheck.errors`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = depCheck.errors;
    // $[9] 缓存 `rgMissing`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = rgMissing;
    // $[10] 缓存 `seccompMissing`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = seccompMissing;
    // $[11] 缓存 `socatMissing`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = socatMissing;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t5从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // 返回 t5，把终端渲染这个分支的结果交还调用方。
  return t5;
}
// _temp5 承担终端渲染中的独立步骤，串起终端 UI 组件 Sandbox Dependencies Tab需要的输入整理、状态更新和结果输出。
function _temp5(err) {
  // 返回 <Text key={err} color="error">{err}</Text>，把终端渲染这个分支的结果交还调用方。
  return <Text key={err} color="error">{err}</Text>;
}
// _temp4 承担终端渲染中的独立步骤，串起终端 UI 组件 Sandbox Dependencies Tab需要的输入整理、状态更新和结果输出。
function _temp4(e_2) {
  // 返回 !e_2.includes("ripgrep") && !e_2.includes("bwrap") && !e_2.includes("socat")，把终端渲染这个分支的结果交还调用方。
  return !e_2.includes("ripgrep") && !e_2.includes("bwrap") && !e_2.includes("socat");
}
// _temp3 承担终端渲染中的独立步骤，串起终端 UI 组件 Sandbox Dependencies Tab需要的输入整理、状态更新和结果输出。
function _temp3(e_1) {
  // 返回 e_1.includes("socat")，把终端渲染这个分支的结果交还调用方。
  return e_1.includes("socat");
}
// _temp2 承担终端渲染中的独立步骤，串起终端 UI 组件 Sandbox Dependencies Tab需要的输入整理、状态更新和结果输出。
function _temp2(e_0) {
  // 返回 e_0.includes("bwrap")，把终端渲染这个分支的结果交还调用方。
  return e_0.includes("bwrap");
}
// _temp 承担终端渲染中的独立步骤，串起终端 UI 组件 Sandbox Dependencies Tab需要的输入整理、状态更新和结果输出。
function _temp(e) {
  // 返回 e.includes("ripgrep")，把终端渲染这个分支的结果交还调用方。
  return e.includes("ripgrep");
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJnZXRQbGF0Zm9ybSIsIlNhbmRib3hEZXBlbmRlbmN5Q2hlY2siLCJQcm9wcyIsImRlcENoZWNrIiwiU2FuZGJveERlcGVuZGVuY2llc1RhYiIsInQwIiwiJCIsIl9jIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJwbGF0Zm9ybSIsImlzTWFjIiwidDIiLCJlcnJvcnMiLCJzb21lIiwiX3RlbXAiLCJyZ01pc3NpbmciLCJ0MyIsIl90ZW1wMiIsImJ3cmFwTWlzc2luZyIsInQ0IiwiX3RlbXAzIiwic29jYXRNaXNzaW5nIiwic2VjY29tcE1pc3NpbmciLCJ3YXJuaW5ncyIsImxlbmd0aCIsInQ1Iiwib3RoZXJFcnJvcnMiLCJmaWx0ZXIiLCJfdGVtcDQiLCJyZ0luc3RhbGxIaW50IiwidDYiLCJ0NyIsInQ4IiwidDkiLCJ0MTAiLCJtYXAiLCJfdGVtcDUiLCJlcnIiLCJlXzIiLCJlIiwiaW5jbHVkZXMiLCJlXzEiLCJlXzAiXSwic291cmNlcyI6WyJTYW5kYm94RGVwZW5kZW5jaWVzVGFiLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBnZXRQbGF0Zm9ybSB9IGZyb20gJy4uLy4uL3V0aWxzL3BsYXRmb3JtLmpzJ1xuaW1wb3J0IHR5cGUgeyBTYW5kYm94RGVwZW5kZW5jeUNoZWNrIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2FuZGJveC9zYW5kYm94LWFkYXB0ZXIuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGRlcENoZWNrOiBTYW5kYm94RGVwZW5kZW5jeUNoZWNrXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTYW5kYm94RGVwZW5kZW5jaWVzVGFiKHsgZGVwQ2hlY2sgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBwbGF0Zm9ybSA9IGdldFBsYXRmb3JtKClcbiAgY29uc3QgaXNNYWMgPSBwbGF0Zm9ybSA9PT0gJ21hY29zJ1xuXG4gIC8vIHJpcGdyZXAgaXMgcmVxdWlyZWQgb24gYWxsIHBsYXRmb3JtcyAodXNlZCB0byBzY2FuIGZvciBkYW5nZXJvdXMgZGlycykuXG4gIC8vIE9uIG1hY09TLCBzZWF0YmVsdCBpcyBidWlsdCBpbnRvIHRoZSBPUyDigJQgcmlwZ3JlcCBpcyB0aGUgb25seSBydW50aW1lIGRlcC5cbiAgLy8gT24gTGludXgvV1NMLCBid3JhcCArIHNvY2F0IGFyZSByZXF1aXJlZCwgc2VjY29tcCBpcyBvcHRpb25hbC5cbiAgLy9cbiAgLy8gIzMxODA0OiBwcmV2aW91c2x5IHRoaXMgdGFiIHVuY29uZGl0aW9uYWxseSByZW5kZXJlZCBMaW51eCBkZXBzIChid3JhcCxcbiAgLy8gc29jYXQsIHNlY2NvbXApLiBXaGVuIHJpcGdyZXAgd2FzIG1pc3Npbmcgb24gbWFjT1MsIHVzZXJzIHNhdyBjb25mdXNpbmdcbiAgLy8gTGludXggaW5zdGFsbCBpbnN0cnVjdGlvbnMgYW5kIG5vIG1lbnRpb24gb2YgdGhlIGFjdHVhbCBwcm9ibGVtLlxuICBjb25zdCByZ01pc3NpbmcgPSBkZXBDaGVjay5lcnJvcnMuc29tZShlID0+IGUuaW5jbHVkZXMoJ3JpcGdyZXAnKSlcbiAgY29uc3QgYndyYXBNaXNzaW5nID0gZGVwQ2hlY2suZXJyb3JzLnNvbWUoZSA9PiBlLmluY2x1ZGVzKCdid3JhcCcpKVxuICBjb25zdCBzb2NhdE1pc3NpbmcgPSBkZXBDaGVjay5lcnJvcnMuc29tZShlID0+IGUuaW5jbHVkZXMoJ3NvY2F0JykpXG4gIGNvbnN0IHNlY2NvbXBNaXNzaW5nID0gZGVwQ2hlY2sud2FybmluZ3MubGVuZ3RoID4gMFxuXG4gIC8vIEFueSBlcnJvcnMgd2UgZG9uJ3QgaGF2ZSBhIGRlZGljYXRlZCByb3cgZm9yIOKAlCByZW5kZXIgdmVyYmF0aW0gc28gdGhleVxuICAvLyBhcmVuJ3Qgc2lsZW50bHkgc3dhbGxvd2VkIChlLmcuIFwiVW5zdXBwb3J0ZWQgcGxhdGZvcm1cIiBvciBmdXR1cmUgZGVwcykuXG4gIGNvbnN0IG90aGVyRXJyb3JzID0gZGVwQ2hlY2suZXJyb3JzLmZpbHRlcihcbiAgICBlID0+ICFlLmluY2x1ZGVzKCdyaXBncmVwJykgJiYgIWUuaW5jbHVkZXMoJ2J3cmFwJykgJiYgIWUuaW5jbHVkZXMoJ3NvY2F0JyksXG4gIClcblxuICBjb25zdCByZ0luc3RhbGxIaW50ID0gaXNNYWMgPyAnYnJldyBpbnN0YWxsIHJpcGdyZXAnIDogJ2FwdCBpbnN0YWxsIHJpcGdyZXAnXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBwYWRkaW5nWT17MX0gZ2FwPXsxfT5cbiAgICAgIHtpc01hYyAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgc2VhdGJlbHQ6IDxUZXh0IGNvbG9yPVwic3VjY2Vzc1wiPmJ1aWx0LWluIChtYWNPUyk8L1RleHQ+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICByaXBncmVwIChyZyk6eycgJ31cbiAgICAgICAgICB7cmdNaXNzaW5nID8gKFxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPm5vdCBmb3VuZDwvVGV4dD5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJzdWNjZXNzXCI+Zm91bmQ8L1RleHQ+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICB7cmdNaXNzaW5nICYmIChcbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIHsnICAnfcK3IHtyZ0luc3RhbGxIaW50fVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuXG4gICAgICB7IWlzTWFjICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICBidWJibGV3cmFwIChid3JhcCk6eycgJ31cbiAgICAgICAgICAgICAge2J3cmFwTWlzc2luZyA/IChcbiAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+bm90IGluc3RhbGxlZDwvVGV4dD5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1Y2Nlc3NcIj5pbnN0YWxsZWQ8L1RleHQ+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICB7YndyYXBNaXNzaW5nICYmIChcbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+eycgICd9wrcgYXB0IGluc3RhbGwgYnViYmxld3JhcDwvVGV4dD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICBzb2NhdDp7JyAnfVxuICAgICAgICAgICAgICB7c29jYXRNaXNzaW5nID8gKFxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5ub3QgaW5zdGFsbGVkPC9UZXh0PlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VjY2Vzc1wiPmluc3RhbGxlZDwvVGV4dD5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIHtzb2NhdE1pc3NpbmcgJiYgPFRleHQgZGltQ29sb3I+eycgICd9wrcgYXB0IGluc3RhbGwgc29jYXQ8L1RleHQ+fVxuICAgICAgICAgIDwvQm94PlxuXG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgc2VjY29tcCBmaWx0ZXI6eycgJ31cbiAgICAgICAgICAgICAge3NlY2NvbXBNaXNzaW5nID8gKFxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPm5vdCBpbnN0YWxsZWQ8L1RleHQ+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJzdWNjZXNzXCI+aW5zdGFsbGVkPC9UZXh0PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7c2VjY29tcE1pc3NpbmcgJiYgKFxuICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiAocmVxdWlyZWQgdG8gYmxvY2sgdW5peCBkb21haW4gc29ja2V0cyk8L1RleHQ+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICB7c2VjY29tcE1pc3NpbmcgJiYgKFxuICAgICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgIHsnICAnfcK3IG5wbSBpbnN0YWxsIC1nIEBhbnRocm9waWMtYWkvc2FuZGJveC1ydW50aW1lXG4gICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgICAgeycgICd9wrcgb3IgY29weSB2ZW5kb3Ivc2VjY29tcC8qIGZyb20gc2FuZGJveC1ydW50aW1lIGFuZCBzZXRcbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgICAgICB7JyAgICAnfXNhbmRib3guc2VjY29tcC5icGZQYXRoIGFuZCBhcHBseVBhdGggaW4gc2V0dGluZ3MuanNvblxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtvdGhlckVycm9ycy5tYXAoZXJyID0+IChcbiAgICAgICAgPFRleHQga2V5PXtlcnJ9IGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICB7ZXJyfVxuICAgICAgICA8L1RleHQ+XG4gICAgICApKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxXQUFXLFFBQVEseUJBQXlCO0FBQ3JELGNBQWNDLHNCQUFzQixRQUFRLHdDQUF3QztBQUVwRixLQUFLQyxLQUFLLEdBQUc7RUFDWEMsUUFBUSxFQUFFRixzQkFBc0I7QUFDbEMsQ0FBQztBQUVELE9BQU8sU0FBQUcsdUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBZ0M7SUFBQUo7RUFBQSxJQUFBRSxFQUFtQjtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUN2Q0YsRUFBQSxHQUFBUixXQUFXLENBQUMsQ0FBQztJQUFBTSxDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQUE5QixNQUFBSyxRQUFBLEdBQWlCSCxFQUFhO0VBQzlCLE1BQUFJLEtBQUEsR0FBY0QsUUFBUSxLQUFLLE9BQU87RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQVAsQ0FBQSxRQUFBSCxRQUFBLENBQUFXLE1BQUE7SUFTaEJELEVBQUEsR0FBQVYsUUFBUSxDQUFBVyxNQUFPLENBQUFDLElBQUssQ0FBQ0MsS0FBMEIsQ0FBQztJQUFBVixDQUFBLE1BQUFILFFBQUEsQ0FBQVcsTUFBQTtJQUFBUixDQUFBLE1BQUFPLEVB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
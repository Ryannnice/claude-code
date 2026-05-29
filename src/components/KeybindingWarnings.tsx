// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 getCachedKeybindingWarnings、getKeybindingsPath、isKeybindingCustomizationEnabled，将 ../keybindings/loadUserBindings.js 中已经封装好的能力接到本文件流程里。
import { getCachedKeybindingWarnings, getKeybindingsPath, isKeybindingCustomizationEnabled } from '../keybindings/loadUserBindings.js';

/**
 * Displays keybinding validation warnings in the UI.
 * Similar to McpParsingWarnings, this provides persistent visibility
 * of configuration issues.
 *
 * Only shown when keybinding customization is enabled (ant users + feature gate).
 */
// KeybindingWarnings 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function KeybindingWarnings() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 满足 `!isKeybindingCustomizationEnabled()` 时，终端渲染执行该分支。
  if (!isKeybindingCustomizationEnabled()) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t0;
  // t1 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t1 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 Keybinding Warnings在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // 警告列表读取`getCachedKeybindingWarnings`，供终端渲染后续处理使用。
      const warnings = getCachedKeybindingWarnings();
      // 警告列表为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
      if (warnings.length === 0) {
        // t1 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t1 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 错误列表筛选`warnings.filter`，供终端渲染后续处理使用。
      const errors = warnings.filter(_temp);
      // warns 集合筛选`warnings.filter`，供终端渲染后续处理使用。
      const warns = warnings.filter(_temp2);
      // t0 暂存 `<Box flexDirection="column" marginTop={1} marginBottom={1...` 生成的渲染片段，后续返回路径直接复用。
      t0 = <Box flexDirection="column" marginTop={1} marginBottom={1}><Text bold={true} color={errors.length > 0 ? "error" : "warning"}>Keybinding Configuration Issues</Text><Box><Text dimColor={true}>Location: </Text><Text dimColor={true}>{getKeybindingsPath()}</Text></Box><Box marginLeft={1} flexDirection="column" marginTop={1}>{errors.map(_temp3)}{warns.map(_temp4)}</Box></Box>;
    }
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // `t1` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(warning, i_0) {
  // 返回 `<Box key={`warning-${i_0}`} flexDirection="column"><Box><Text dimColor=...`，作为终端渲染这次计算的结果。
  return <Box key={`warning-${i_0}`} flexDirection="column"><Box><Text dimColor={true}>└ </Text><Text color="warning">[Warning]</Text><Text dimColor={true}> {warning.message}</Text></Box>{warning.suggestion && <Box marginLeft={3}><Text dimColor={true}>→ {warning.suggestion}</Text></Box>}</Box>;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(error, i) {
  // 返回 `<Box key={`error-${i}`} flexDirection="column"><Box><Text dimColor={tru...`，作为终端渲染这次计算的结果。
  return <Box key={`error-${i}`} flexDirection="column"><Box><Text dimColor={true}>└ </Text><Text color="error">[Error]</Text><Text dimColor={true}> {error.message}</Text></Box>{error.suggestion && <Box marginLeft={3}><Text dimColor={true}>→ {error.suggestion}</Text></Box>}</Box>;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(w_0) {
  // 返回 `w_0.severity === "warning"`，作为终端渲染这次计算的结果。
  return w_0.severity === "warning";
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(w) {
  // 返回 `w.severity === "error"`，作为终端渲染这次计算的结果。
  return w.severity === "error";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJnZXRDYWNoZWRLZXliaW5kaW5nV2FybmluZ3MiLCJnZXRLZXliaW5kaW5nc1BhdGgiLCJpc0tleWJpbmRpbmdDdXN0b21pemF0aW9uRW5hYmxlZCIsIktleWJpbmRpbmdXYXJuaW5ncyIsIiQiLCJfYyIsInQwIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJiYjAiLCJ3YXJuaW5ncyIsImxlbmd0aCIsImVycm9ycyIsImZpbHRlciIsIl90ZW1wIiwid2FybnMiLCJfdGVtcDIiLCJtYXAiLCJfdGVtcDMiLCJfdGVtcDQiLCJ3YXJuaW5nIiwiaV8wIiwiaSIsIm1lc3NhZ2UiLCJzdWdnZXN0aW9uIiwiZXJyb3IiLCJ3XzAiLCJ3Iiwic2V2ZXJpdHkiXSwic291cmNlcyI6WyJLZXliaW5kaW5nV2FybmluZ3MudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7XG4gIGdldENhY2hlZEtleWJpbmRpbmdXYXJuaW5ncyxcbiAgZ2V0S2V5YmluZGluZ3NQYXRoLFxuICBpc0tleWJpbmRpbmdDdXN0b21pemF0aW9uRW5hYmxlZCxcbn0gZnJvbSAnLi4va2V5YmluZGluZ3MvbG9hZFVzZXJCaW5kaW5ncy5qcydcblxuLyoqXG4gKiBEaXNwbGF5cyBrZXliaW5kaW5nIHZhbGlkYXRpb24gd2FybmluZ3MgaW4gdGhlIFVJLlxuICogU2ltaWxhciB0byBNY3BQYXJzaW5nV2FybmluZ3MsIHRoaXMgcHJvdmlkZXMgcGVyc2lzdGVudCB2aXNpYmlsaXR5XG4gKiBvZiBjb25maWd1cmF0aW9uIGlzc3Vlcy5cbiAqXG4gKiBPbmx5IHNob3duIHdoZW4ga2V5YmluZGluZyBjdXN0b21pemF0aW9uIGlzIGVuYWJsZWQgKGFudCB1c2VycyArIGZlYXR1cmUgZ2F0ZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBLZXliaW5kaW5nV2FybmluZ3MoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gT25seSBzaG93IHdhcm5pbmdzIHdoZW4ga2V5YmluZGluZyBjdXN0b21pemF0aW9uIGlzIGVuYWJsZWRcbiAgaWYgKCFpc0tleWJpbmRpbmdDdXN0b21pemF0aW9uRW5hYmxlZCgpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IHdhcm5pbmdzID0gZ2V0Q2FjaGVkS2V5YmluZGluZ1dhcm5pbmdzKClcblxuICBpZiAod2FybmluZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IGVycm9ycyA9IHdhcm5pbmdzLmZpbHRlcih3ID0+IHcuc2V2ZXJpdHkgPT09ICdlcnJvcicpXG4gIGNvbnN0IHdhcm5zID0gd2FybmluZ3MuZmlsdGVyKHcgPT4gdy5zZXZlcml0eSA9PT0gJ3dhcm5pbmcnKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfSBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgPFRleHQgYm9sZCBjb2xvcj17ZXJyb3JzLmxlbmd0aCA+IDAgPyAnZXJyb3InIDogJ3dhcm5pbmcnfT5cbiAgICAgICAgS2V5YmluZGluZyBDb25maWd1cmF0aW9uIElzc3Vlc1xuICAgICAgPC9UZXh0PlxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+TG9jYXRpb246IDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+e2dldEtleWJpbmRpbmdzUGF0aCgpfTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveCBtYXJnaW5MZWZ0PXsxfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgICAge2Vycm9ycy5tYXAoKGVycm9yLCBpKSA9PiAoXG4gICAgICAgICAgPEJveCBrZXk9e2BlcnJvci0ke2l9YH0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgPEJveD5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+4pSUIDwvVGV4dD5cbiAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPltFcnJvcl08L1RleHQ+XG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiB7ZXJyb3IubWVzc2FnZX08L1RleHQ+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgIHtlcnJvci5zdWdnZXN0aW9uICYmIChcbiAgICAgICAgICAgICAgPEJveCBtYXJnaW5MZWZ0PXszfT5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj7ihpIge2Vycm9yLnN1Z2dlc3Rpb259PC9UZXh0PlxuICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICkpfVxuICAgICAgICB7d2FybnMubWFwKCh3YXJuaW5nLCBpKSA9PiAoXG4gICAgICAgICAgPEJveCBrZXk9e2B3YXJuaW5nLSR7aX1gfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj7ilJQgPC9UZXh0PlxuICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5bV2FybmluZ108L1RleHQ+XG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiB7d2FybmluZy5tZXNzYWdlfTwvVGV4dD5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAge3dhcm5pbmcuc3VnZ2VzdGlvbiAmJiAoXG4gICAgICAgICAgICAgIDxCb3ggbWFyZ2luTGVmdD17M30+XG4gICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+4oaSIHt3YXJuaW5nLnN1Z2dlc3Rpb259PC9UZXh0PlxuICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICkpfVxuICAgICAgPC9Cb3g+XG4g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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js';
// 引入 Box、Link、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../ink.js';
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../utils/settings/settings.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';

// NOTE: This copy is legally reviewed — do not modify without Legal team approval.
// AUTO_MODE_DESCRIPTION 命名 `"Auto mode lets Claude handle permission prompts automati...`，让后续代码直接表达这个值的用途。
export const AUTO_MODE_DESCRIPTION = "Auto mode lets Claude handle permission prompts automatically — Claude checks each tool call for risky actions and prompt injection before executing. Actions Claude identifies as safe are executed, while actions Claude identifies as risky are blocked and Claude may try a different approach. Ideal for long-running tasks. Sessions are slightly more expensive. Claude can make mistakes that allow harmful commands to run, it's recommended to only use in isolated environments. Shift+Tab to change mode.";
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onAccept(): void;
  onDecline(): void;
  // Startup gate: decline exits the process, so relabel accordingly.
  declineExits?: boolean;
};
// AutoModeOptInDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AutoModeOptInDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onAccept,
    onDecline,
    declineExits
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
  // t2 暂存 `function onChange(value) {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onAccept || $[2] !== onDecline) {
    // t2 暂存 `function onChange(value) {` 生成的渲染片段，后续返回路径直接复用。
    t2 = function onChange(value) {
      // 终端 UI 组件 Auto Mode Opt In Dialog在这里处理 `bb3: switch (value) {`，完成这一小步状态转换。
      bb3: switch (value) {
        case "accept":
          {
            // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
            logEvent("tengu_auto_mode_opt_in_dialog_accept", {});
            // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
            updateSettingsForSource("userSettings", {
              skipAutoPermissionPrompt: true
            });
            // 调用 onAccept，触发终端渲染此处需要的副作用。
            onAccept();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb3;
          }
        case "accept-default":
          {
            // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
            logEvent("tengu_auto_mode_opt_in_dialog_accept_default", {});
            // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
            updateSettingsForSource("userSettings", {
              skipAutoPermissionPrompt: true,
              permissions: {
                defaultMode: "auto"
              }
            });
            // 调用 onAccept，触发终端渲染此处需要的副作用。
            onAccept();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb3;
          }
        case "decline":
          {
            // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
            logEvent("tengu_auto_mode_opt_in_dialog_decline", {});
            // 调用 onDecline，触发终端渲染此处需要的副作用。
            onDecline();
          }
      }
    };
    // $[1] 缓存 `onAccept`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onAccept;
    // $[2] 缓存 `onDecline`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onDecline;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // onChange沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const onChange = t2;
  // t3 暂存 `<Box flexDirection="column" gap={1}><Text>{AUTO_MODE_DESC...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box flexDirection="column" gap={1}><Text>{AUTO_MODE_DESC...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column" gap={1}><Text>{AUTO_MODE_DESCRIPTION}</Text><Link url="https://code.claude.com/docs/en/security" /></Box>;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `true ? [{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `true ? [{` 生成的渲染片段，后续返回路径直接复用。
    t4 = true ? [{
      label: "Yes, and make it my default mode",
      value: "accept-default" as const
    }] : [];
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      label: "Yes, enable auto mode",
      value: "accept" as const
    };
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // t6保存`declineExits ? "No, exit" : "No, go back"`，供后续判断或组装使用。
  const t6 = declineExits ? "No, exit" : "No, go back";
  // t7 暂存 `[...t4, t5, {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t6) {
    // t7 暂存 `[...t4, t5, {` 生成的渲染片段，后续返回路径直接复用。
    t7 = [...t4, t5, {
      label: t6,
      value: "decline" as const
    }];
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
    // $[8] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[8];
  }
  // t8 暂存 `value_0 => onChange(value_0 as 'accept' | 'accept-default...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== onChange) {
    // t8 暂存 `value_0 => onChange(value_0 as 'accept' | 'accept-default...` 生成的渲染片段，后续返回路径直接复用。
    t8 = value_0 => onChange(value_0 as 'accept' | 'accept-default' | 'decline');
    // $[9] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = onChange;
    // $[10] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[10];
  }
  // t9 暂存 `<Select options={t7} onChange={t8} onCancel={onDecline} />` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onDecline || $[12] !== t7 || $[13] !== t8) {
    // t9 暂存 `<Select options={t7} onChange={t8} onCancel={onDecline} />` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Select options={t7} onChange={t8} onCancel={onDecline} />;
    // $[11] 缓存 `onDecline`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onDecline;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
    // $[14] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[14];
  }
  // t10 暂存 `<Dialog title="Enable auto mode?" color="warning" onCance...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== onDecline || $[16] !== t9) {
    // t10 暂存 `<Dialog title="Enable auto mode?" color="warning" onCance...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Dialog title="Enable auto mode?" color="warning" onCancel={onDecline}>{t3}{t9}</Dialog>;
    // $[15] 缓存 `onDecline`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = onDecline;
    // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t9;
    // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[17];
  }
  // 返回 `t10`，作为终端渲染这次计算的结果。
  return t10;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent("tengu_auto_mode_opt_in_dialog_shown", {});
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImxvZ0V2ZW50IiwiQm94IiwiTGluayIsIlRleHQiLCJ1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSIsIlNlbGVjdCIsIkRpYWxvZyIsIkFVVE9fTU9ERV9ERVNDUklQVElPTiIsIlByb3BzIiwib25BY2NlcHQiLCJvbkRlY2xpbmUiLCJkZWNsaW5lRXhpdHMiLCJBdXRvTW9kZU9wdEluRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsInVzZUVmZmVjdCIsIl90ZW1wIiwidDIiLCJvbkNoYW5nZSIsInZhbHVlIiwiYmIzIiwic2tpcEF1dG9QZXJtaXNzaW9uUHJvbXB0IiwicGVybWlzc2lvbnMiLCJkZWZhdWx0TW9kZSIsInQzIiwidDQiLCJsYWJlbCIsImNvbnN0IiwidDUiLCJ0NiIsInQ3IiwidDgiLCJ2YWx1ZV8wIiwidDkiLCJ0MTAiXSwic291cmNlcyI6WyJBdXRvTW9kZU9wdEluRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBsb2dFdmVudCB9IGZyb20gJ3NyYy9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQgeyBCb3gsIExpbmssIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSB9IGZyb20gJy4uL3V0aWxzL3NldHRpbmdzL3NldHRpbmdzLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuXG4vLyBOT1RFOiBUaGlzIGNvcHkgaXMgbGVnYWxseSByZXZpZXdlZCDigJQgZG8gbm90IG1vZGlmeSB3aXRob3V0IExlZ2FsIHRlYW0gYXBwcm92YWwuXG5leHBvcnQgY29uc3QgQVVUT19NT0RFX0RFU0NSSVBUSU9OID1cbiAgXCJBdXRvIG1vZGUgbGV0cyBDbGF1ZGUgaGFuZGxlIHBlcm1pc3Npb24gcHJvbXB0cyBhdXRvbWF0aWNhbGx5IOKAlCBDbGF1ZGUgY2hlY2tzIGVhY2ggdG9vbCBjYWxsIGZvciByaXNreSBhY3Rpb25zIGFuZCBwcm9tcHQgaW5qZWN0aW9uIGJlZm9yZSBleGVjdXRpbmcuIEFjdGlvbnMgQ2xhdWRlIGlkZW50aWZpZXMgYXMgc2FmZSBhcmUgZXhlY3V0ZWQsIHdoaWxlIGFjdGlvbnMgQ2xhdWRlIGlkZW50aWZpZXMgYXMgcmlza3kgYXJlIGJsb2NrZWQgYW5kIENsYXVkZSBtYXkgdHJ5IGEgZGlmZmVyZW50IGFwcHJvYWNoLiBJZGVhbCBmb3IgbG9uZy1ydW5uaW5nIHRhc2tzLiBTZXNzaW9ucyBhcmUgc2xpZ2h0bHkgbW9yZSBleHBlbnNpdmUuIENsYXVkZSBjYW4gbWFrZSBtaXN0YWtlcyB0aGF0IGFsbG93IGhhcm1mdWwgY29tbWFuZHMgdG8gcnVuLCBpdCdzIHJlY29tbWVuZGVkIHRvIG9ubHkgdXNlIGluIGlzb2xhdGVkIGVudmlyb25tZW50cy4gU2hpZnQrVGFiIHRvIGNoYW5nZSBtb2RlLlwiXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uQWNjZXB0KCk6IHZvaWRcbiAgb25EZWNsaW5lKCk6IHZvaWRcbiAgLy8gU3RhcnR1cCBnYXRlOiBkZWNsaW5lIGV4aXRzIHRoZSBwcm9jZXNzLCBzbyByZWxhYmVsIGFjY29yZGluZ2x5LlxuICBkZWNsaW5lRXhpdHM/OiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBBdXRvTW9kZU9wdEluRGlhbG9nKHtcbiAgb25BY2NlcHQsXG4gIG9uRGVjbGluZSxcbiAgZGVjbGluZUV4aXRzLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxvZ0V2ZW50KCd0ZW5ndV9hdXRvX21vZGVfb3B0X2luX2RpYWxvZ19zaG93bicsIHt9KVxuICB9LCBbXSlcblxuICBmdW5jdGlvbiBvbkNoYW5nZSh2YWx1ZTogJ2FjY2VwdCcgfCAnYWNjZXB0LWRlZmF1bHQnIHwgJ2RlY2xpbmUnKSB7XG4gICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgY2FzZSAnYWNjZXB0Jzoge1xuICAgICAgICBsb2dFdmVudCgndGVuZ3VfYXV0b19tb2RlX29wdF9pbl9kaWFsb2dfYWNjZXB0Jywge30pXG4gICAgICAgIHVwZGF0ZVNldHRpbmdzRm9yU291cmNlKCd1c2VyU2V0dGluZ3MnLCB7XG4gICAgICAgICAgc2tpcEF1dG9QZXJtaXNzaW9uUHJvbXB0OiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgICBvbkFjY2VwdCgpXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlICdhY2NlcHQtZGVmYXVsdCc6IHtcbiAgICAgICAgbG9nRXZlbnQoJ3Rlbmd1X2F1dG9fbW9kZV9vcHRfaW5fZGlhbG9nX2FjY2VwdF9kZWZhdWx0Jywge30pXG4gICAgICAgIHVwZGF0ZVNldHRpbmdzRm9yU291cmNlKCd1c2VyU2V0dGluZ3MnLCB7XG4gICAgICAgICAgc2tpcEF1dG9QZXJtaXNzaW9uUHJvbXB0OiB0cnVlLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiB7IGRlZmF1bHRNb2RlOiAnYXV0bycgfSxcbiAgICAgICAgfSlcbiAgICAgICAgb25BY2NlcHQoKVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgY2FzZSAnZGVjbGluZSc6IHtcbiAgICAgICAgbG9nRXZlbnQoJ3Rlbmd1X2F1dG9fbW9kZV9vcHRfaW5fZGlhbG9nX2RlY2xpbmUnLCB7fSlcbiAgICAgICAgb25EZWNsaW5lKClcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2cgdGl0bGU9XCJFbmFibGUgYXV0byBtb2RlP1wiIGNvbG9yPVwid2FybmluZ1wiIG9uQ2FuY2VsPXtvbkRlY2xpbmV9PlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgPFRleHQ+e0FVVE9fTU9ERV9ERVNDUklQVElPTn08L1RleHQ+XG5cbiAgICAgICAgPExpbmsgdXJsPVwiaHR0cHM6Ly9jb2RlLmNsYXVkZS5jb20vZG9jcy9lbi9zZWN1cml0eVwiIC8+XG4gICAgICA8L0JveD5cblxuICAgICAgPFNlbGVjdFxuICAgICAgICBvcHRpb25zPXtbXG4gICAgICAgICAgLi4uKFwiZXh0ZXJuYWxcIiAhPT0gJ2FudCdcbiAgICAgICAgICAgID8gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnWWVzLCBhbmQgbWFrZSBpdCBteSBkZWZhdWx0IG1vZGUnLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6ICdhY2NlcHQtZGVmYXVsdCcgYXMgY29uc3QsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgOiBbXSksXG4gICAgICAgICAgeyBsYWJlbDogJ1llcywgZW5hYmxlIGF1dG8gbW9kZScsIHZhbHVlOiAnYWNjZXB0JyBhcyBjb25zdCB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiBkZWNsaW5lRXhpdHMgPyAnTm8sIGV4aXQnIDogJ05vLCBnbyBiYWNrJyxcbiAgICAgICAgICAgIHZhbHVlOiAnZGVjbGluZScgYXMgY29uc3QsXG4gICAgICAgICAgfSxcbiAgICAgICAgXX1cbiAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+XG4gICAgICAgICAgb25DaGFuZ2UodmFsdWUgYXMgJ2FjY2VwdCcgfCAnYWNjZXB0LWRlZmF1bHQnIHwgJ2RlY2xpbmUnKVxuICAgICAgICB9XG4gICAgICAgIG9uQ2FuY2VsPXtvbkRlY2xpbmV9XG4gICAgICAvPlxuICAgIDwvRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxRQUFRLFFBQVEsaUNBQWlDO0FBQzFELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUMzQyxTQUFTQyx1QkFBdUIsUUFBUSwrQkFBK0I7QUFDdkUsU0FBU0MsTUFBTSxRQUFRLHlCQUF5QjtBQUNoRCxTQUFTQyxNQUFNLFFBQVEsMkJBQTJCOztBQUVsRDtBQUNBLE9BQU8sTUFBTUMscUJBQXFCLEdBQ2hDLHVmQUF1ZjtBQUV6ZixLQUFLQyxLQUFLLEdBQUc7RUFDWEMsUUFBUSxFQUFFLEVBQUUsSUFBSTtFQUNoQkMsU0FBUyxFQUFFLEVBQUUsSUFBSTtFQUNqQjtFQUNBQyxZQUFZLENBQUMsRUFBRSxPQUFPO0FBQ3hCLENBQUM7QUFFRCxPQUFPLFNBQUFDLG9CQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQTZCO0lBQUFOLFFBQUE7SUFBQUMsU0FBQTtJQUFBQztFQUFBLElBQUFFLEVBSTVCO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBR0hGLEVBQUEsS0FBRTtJQUFBRixDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQUZMZixLQUFLLENBQUFvQixTQUFVLENBQUNDLEtBRWYsRUFBRUosRUFBRSxDQUFDO0VBQUEsSUFBQUssRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQUwsUUFBQSxJQUFBSyxDQUFBLFFBQUFKLFNBQUE7SUFFTlcsRUFBQSxZQUFBQyxTQUFBQyxLQUFBO01BQUFDLEdBQUEsRUFDRSxRQUFRRCxLQUFLO1FBQUEsS0FDTixRQUFRO1VBQUE7WUFDWHZCLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwREksdUJBQXVCLENBQUMsY0FBYyxFQUFFO2NBQUFxQix3QkFBQSxFQUNaO1lBQzVCLENBQUMsQ0FBQztZQUNGaEIsUUFBUSxDQUFDLENBQUM7WUFDVixNQUFBZSxHQUFBO1VBQUs7UUFBQSxLQUVGLGdCQUFnQjtVQUFBO1lBQ25CeEIsUUFBUSxDQUFDLDhDQUE4QyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVESSx1QkFBdUIsQ0FBQyxjQUFjLEVBQUU7Y0FBQXFCLHdCQUFBLEVBQ1osSUFBSTtjQUFBQyxXQUFBLEVBQ2pCO2dCQUFBQyxXQUFBLEVBQWU7Y0FBTztZQUNyQyxDQUFDLENBQUM7WUFDRmxCLFFBQVEsQ0FBQyxDQUFDO1lBQ1YsTUFBQWUsR0FBQTtVQUFLO1FBQUEsS0FFRixTQUFTO1VBQUE7WUFDWnhCLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRFUsU0FBUyxDQUFDLENBQUM7VUFBQTtNQUdmO0lBQUMsQ0FDRjtJQUFBSSxDQUFBLE1BQUFMLFFBQUE7SUFBQUssQ0FBQSxNQUFBSixTQUFBO0lBQUFJLENBQUEsTUFBQU8sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVAsQ0FBQTtFQUFBO0VBekJELE1BQUFRLFFBQUEsR0FBQUQsRUF5QkM7RUFBQSxJQUFBTyxFQUFBO0VBQUEsSUFBQWQsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFJR1UsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFNLEdBQUMsQ0FBRCxHQUFDLENBQ2hDLENBQUMsSUFBSSxDQUFFckIsc0JBQW9CLENBQUUsRUFBNUIsSUFBSSxDQUVMLENBQUMsSUFBSSxDQUFLLEdBQTBDLENBQTFDLDBDQUEwQyxHQUN0RCxFQUpDLEdBQUcsQ0FJRTtJQUFBTyxDQUFBLE1BQUFjLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFkLENBQUE7RUFBQTtFQUFBLElBQUFlLEVBQUE7RUFBQSxJQUFBZixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUlFVyxFQUFBLE9BQW9CLEdBQXBCLENBRUU7TUFBQUMsS0FBQSxFQUNTLGtDQUFrQztNQUFBUCxLQUFBLEVBQ2xDLGdCQUFnQixJQUFJUTtJQUM3QixDQUFDLENBRUQsR0FQRixFQU9FO0lBQUFqQixDQUFBLE1BQUFlLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFmLENBQUE7RUFBQTtFQUFBLElBQUFrQixFQUFBO0VBQUEsSUFBQWxCLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBQ05jLEVBQUE7TUFBQUYsS0FBQSxFQUFTLHVCQUF1QjtNQUFBUCxLQUFBLEVBQVMsUUFBUSxJQUFJUTtJQUFNLENBQUM7SUFBQWpCLENBQUEsTUFBQWtCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFsQixDQUFBO0VBQUE7RUFFbkQsTUFBQW1CLEVBQUEsR0FBQXRCLFlBQVksR0FBWixVQUF5QyxHQUF6QyxhQUF5QztFQUFBLElBQUF1QixFQUFBO0VBQUEsSUFBQXBCLENBQUEsUUFBQW1CLEVBQUE7SUFYM0NDLEVBQUEsT0FDSEwsRUFPRSxFQUNORyxFQUE0RCxFQUM1RDtNQUFBRixLQUFBLEVBQ1NHLEVBQXlDO01BQUFWLEtBQUEsRUFDekMsU0FBUyxJQUFJUTtJQUN0QixDQUFDLENBQ0Y7SUFBQWpCLENBQUEsTUFBQW1CLEVBQUE7SUFBQW5CLENBQUEsTUFBQW9CLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFwQixDQUFBO0VBQUE7RUFBQSxJQUFBcUIsRUFBQTtFQUFBLElBQUFyQixDQUFBLFFBQUFRLFFBQUE7SUFDU2EsRUFBQSxHQUFBQyxPQUFBLElBQ1JkLFFBQVEsQ0FBQ0MsT0FBSyxJQUFJLFFBQVEsR0FBRyxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7SUFBQVQsQ0FBQSxNQUFBUSxRQUFBO0lBQUFSLENBQUEsT0FBQXFCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFyQixDQUFBO0VBQUE7RUFBQSxJQUFBdUIsRUFBQTtFQUFBLElBQUF2QixDQUFBLFNBQUFKLFNBQUEsSUFBQUksQ0FBQSxTQUFBb0IsRUFBQSxJQUFBcEIsQ0FBQSxTQUFBcUIsRUFBQTtJQWpCOURFLEVBQUEsSUFBQyxNQUFNLENBQ0ksT0FjUixDQWRRLENBQUFILEVBY1QsQ0FBQyxDQUNTLFFBQ2tELENBRGxELENBQUFDLEVBQ2lELENBQUMsQ0FFbER6QixRQUFTLENBQVRBLFVBQVEsQ0FBQyxHQUNuQjtJQUFBSSxDQUFBLE9BQUFKLFNBQUE7SUFBQUksQ0FBQSxPQUFBb0IsRUFBQTtJQUFBcEIsQ0FBQSxPQUFBcUIsRUFBQTtJQUFBckIsQ0FBQSxPQUFBdUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXZCLENBQUE7RUFBQTtFQUFBLElBQUF3QixHQUFBO0VBQUEsSUFBQXhCLENBQUEsU0FBQUosU0FBQSxJQUFBSSxDQUFBLFNBQUF1QixFQUFBO0lBM0JKQyxHQUFBLElBQUMsTUFBTSxDQUFPLEtBQW1CLENBQW5CLG1CQUFtQixDQUFPLEtBQVMsQ0FBVCxTQUFTLENBQVc1QixRQUFTLENBQVRBLFVBQVEsQ0FBQyxDQUNuRSxDQUFBa0IsRUFJSyxDQUVMLENBQUFTLEVBb0JDLENBQ0gsRUE1QkMsTUFBTSxDQTRCRTtJQUFBdkIsQ0FBQSxPQUFBSixTQUFBO0lBQUFJLENBQUEsT0FBQXVCLEVBQUE7SUFBQXZCLENBQUEsT0FBQXdCLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUF4QixDQUFBO0VBQUE7RUFBQSxPQTVCVHdCLEdBNEJTO0FBQUE7QUFqRU4sU0FBQWxCLE1BQUE7RUFNSHBCLFFBQVEsQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUFBIiwiaWdub3JlTGlzdCI6W119
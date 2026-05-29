// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 getSentinelCategory，将 @ant/computer-use-mcp/sentinelApps 中已经封装好的能力接到本文件流程里。
import { getSentinelCategory } from '@ant/computer-use-mcp/sentinelApps';
// 类型依赖 { CuPermissionRequest, CuPermissionResponse } 来自 @ant/computer-use-mcp/types，用于校准终端渲染的数据契约。
import type { CuPermissionRequest, CuPermissionResponse } from '@ant/computer-use-mcp/types';
// 引入 DEFAULT_GRANT_FLAGS，将 @ant/computer-use-mcp/types 中已经封装好的能力接到本文件流程里。
import { DEFAULT_GRANT_FLAGS } from '@ant/computer-use-mcp/types';
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo, useState } from 'react';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../../utils/execFileNoThrow.js';
// 复用 plural 工具函数，把通用处理留在 ../../../utils/stringUtils.js 中维护。
import { plural } from '../../../utils/stringUtils.js';
// 类型依赖 { OptionWithDescription } 来自 ../../CustomSelect/select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from '../../CustomSelect/select.js';
// 引入 Select，将 ../../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../../CustomSelect/select.js';
// 引入 Dialog，将 ../../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../../design-system/Dialog.js';
// ComputerUseApprovalProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ComputerUseApprovalProps = {
  request: CuPermissionRequest;
  // 这个回调绑定到 onDone: (response: CuPermissionResponse) => void;，负责终端渲染在该局部场景下的响应。
  onDone: (response: CuPermissionResponse) => void;
};
// DENY_ALL_RESPONSE 响应数据 集中保存权限确认界面 Computer Use Approval要一起传递的字段。
const DENY_ALL_RESPONSE: CuPermissionResponse = {
  granted: [],
  denied: [],
  flags: DEFAULT_GRANT_FLAGS
};

/**
 * Two-panel dispatcher. When `request.tccState` is present, macOS permissions
 * (Accessibility / Screen Recording) are missing and the app list is
 * irrelevant — show a TCC panel that opens System Settings. Otherwise show the
 * app allowlist + grant-flags panel.
 */
// ComputerUseApproval 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ComputerUseApproval(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    request,
    onDone
  } = t0;
  // t1 暂存 `request.tccState ? <ComputerUseTccPanel tccState={request...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone || $[1] !== request) {
    // t1 暂存 `request.tccState ? <ComputerUseTccPanel tccState={request...` 生成的渲染片段，后续返回路径直接复用。
    t1 = request.tccState ? <ComputerUseTccPanel tccState={request.tccState} onDone={() => onDone(DENY_ALL_RESPONSE)} /> : <ComputerUseAppListPanel request={request} onDone={onDone} />;
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `request`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = request;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}

// ── TCC panel ─────────────────────────────────────────────────────────────

// TccOption 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TccOption = 'open_accessibility' | 'open_screen_recording' | 'retry';
// ComputerUseTccPanel 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ComputerUseTccPanel(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tccState,
    onDone
  } = t0;
  // opts 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let opts;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== tccState.accessibility || $[1] !== tccState.screenRecording) {
    // opts 集合更新为 `[]`，确保权限确认界面后续读取最新状态。
    opts = [];
    // tccState.accessibility 状态缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!tccState.accessibility) {
      // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t1 = {
          label: "Open System Settings \u2192 Accessibility",
          value: "open_accessibility"
        };
        // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[3] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[3];
      }
      // opts 集合追加新条目，保持收集顺序与输入顺序一致。
      opts.push(t1);
    }
    // tccState.screenRecording 状态缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!tccState.screenRecording) {
      // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t1 = {
          label: "Open System Settings \u2192 Screen Recording",
          value: "open_screen_recording"
        };
        // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[4] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[4];
      }
      // opts 集合追加新条目，保持收集顺序与输入顺序一致。
      opts.push(t1);
    }
    // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t1 = {
        label: "Try again",
        value: "retry"
      };
      // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[5];
    }
    // opts 集合追加新条目，保持收集顺序与输入顺序一致。
    opts.push(t1);
    // $[0] 缓存 `tccState.accessibility`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = tccState.accessibility;
    // $[1] 缓存 `tccState.screenRecording`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = tccState.screenRecording;
    // $[2] 缓存 `opts`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = opts;
  } else {
    // opts 集合更新为 `$[2]`，确保权限确认界面后续读取最新状态。
    opts = $[2];
  }
  // 选项保存`opts`，供终端渲染权限确认界面 Computer Use Approval后续判断或输出使用。
  const options = opts;
  // t1 暂存 `function onChange(value) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== onDone) {
    // t1 暂存 `function onChange(value) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function onChange(value) {
      // 按照 value 的取值选择终端渲染的具体处理分支。
      switch (value) {
        case "open_accessibility":
          {
            // 调用 execFileNoThrow，触发终端渲染此处需要的副作用。
            execFileNoThrow("open", ["x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"], {
              useCwd: false
            });
            // 权限确认界面 Computer Use Approval在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
        case "open_screen_recording":
          {
            // 调用 execFileNoThrow，触发终端渲染此处需要的副作用。
            execFileNoThrow("open", ["x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"], {
              useCwd: false
            });
            // 权限确认界面 Computer Use Approval在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
        case "retry":
          {
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
            // 权限确认界面 Computer Use Approval在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
      }
    };
    // $[6] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onDone;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[7];
  }
  // onChange保存`t1`，作为后续临时缓存值处理的输入。
  const onChange = t1;
  // t2保存`tccState.accessibility ? `${figures.tick} granted` : `${f...`，供终端渲染权限确认界面 Computer Use Approval后续判断或输出使用。
  const t2 = tccState.accessibility ? `${figures.tick} granted` : `${figures.cross} not granted`;
  // t3 暂存 `<Text>Accessibility:{" "}{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t2) {
    // t3 暂存 `<Text>Accessibility:{" "}{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>Accessibility:{" "}{t2}</Text>;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // t4保存`tccState.screenRecording ? `${figures.tick} granted` : `$...`，供终端渲染权限确认界面 Computer Use Approval后续判断或输出使用。
  const t4 = tccState.screenRecording ? `${figures.tick} granted` : `${figures.cross} not granted`;
  // t5 暂存 `<Text>Screen Recording:{" "}{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t4) {
    // t5 暂存 `<Text>Screen Recording:{" "}{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>Screen Recording:{" "}{t4}</Text>;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // t6 暂存 `<Box flexDirection="column">{t3}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== t3 || $[13] !== t5) {
    // t6 暂存 `<Box flexDirection="column">{t3}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column">{t3}{t5}</Box>;
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // t7 暂存 `<Text dimColor={true}>Grant the missing permissions in Sy...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Text dimColor={true}>Grant the missing permissions in Sy...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text dimColor={true}>Grant the missing permissions in System Settings, then select "Try again". macOS may require you to restart Claude Code after granting Screen Recording.</Text>;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // t8 暂存 `<Select options={options} onChange={onChange} onCancel={o...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== onChange || $[17] !== onDone || $[18] !== options) {
    // t8 暂存 `<Select options={options} onChange={onChange} onCancel={o...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Select options={options} onChange={onChange} onCancel={onDone} />;
    // $[16] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onChange;
    // $[17] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = onDone;
    // $[18] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = options;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[19];
  }
  // t9 暂存 `<Box flexDirection="column" paddingX={1} paddingY={1} gap...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== t6 || $[21] !== t8) {
    // t9 暂存 `<Box flexDirection="column" paddingX={1} paddingY={1} gap...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>{t6}{t7}{t8}</Box>;
    // $[20] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t6;
    // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t8;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[22];
  }
  // t10 暂存 `<Dialog title="Computer Use needs macOS permissions" onCa...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== onDone || $[24] !== t9) {
    // t10 暂存 `<Dialog title="Computer Use needs macOS permissions" onCa...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Dialog title="Computer Use needs macOS permissions" onCancel={onDone}>{t9}</Dialog>;
    // $[23] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = onDone;
    // $[24] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t9;
    // $[25] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[25];
  }
  // 返回 `t10`，作为终端渲染这次计算的结果。
  return t10;
}

// ── App allowlist panel ───────────────────────────────────────────────────

// AppListOption 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type AppListOption = 'allow_all' | 'deny';
// SENTINEL_WARNING 警告信息 集中保存权限确认界面 Computer Use Approval要一起传递的字段。
const SENTINEL_WARNING: Record<NonNullable<ReturnType<typeof getSentinelCategory>>, string> = {
  shell: 'equivalent to shell access',
  filesystem: 'can read/write any file',
  system_settings: 'can change system settings'
};
// ComputerUseAppListPanel 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ComputerUseAppListPanel(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(48);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    request,
    onDone
  } = t0;
  // t1 暂存 `() => new Set(request.apps.flatMap(_temp))` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== request.apps) {
    // t1 暂存 `() => new Set(request.apps.flatMap(_temp))` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => new Set(request.apps.flatMap(_temp));
    // $[0] 缓存 `request.apps`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = request.apps;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // checked 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [checked] = useState(t1);
  // t2 暂存 `["clipboardRead", "clipboardWrite", "systemKeyCombos"]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `["clipboardRead", "clipboardWrite", "systemKeyCombos"]` 生成的渲染片段，后续返回路径直接复用。
    t2 = ["clipboardRead", "clipboardWrite", "systemKeyCombos"];
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // ALL_FLAG_KEYS 集合沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const ALL_FLAG_KEYS = t2;
  // t3 暂存 `ALL_FLAG_KEYS.filter(k => request.requestedFlags[k])` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== request.requestedFlags) {
    // t3 暂存 `ALL_FLAG_KEYS.filter(k => request.requestedFlags[k])` 生成的渲染片段，后续返回路径直接复用。
    t3 = ALL_FLAG_KEYS.filter(k => request.requestedFlags[k]);
    // $[3] 缓存 `request.requestedFlags`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = request.requestedFlags;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // requestedFlagKeys 请求数据保存`t3`，作为后续临时缓存值处理的输入。
  const requestedFlagKeys = t3;
  // t4读取`checked.size` 整理出中间结果，供终端渲染权限确认界面 Computer Use Approval后续步骤使用。
  const t4 = checked.size;
  // t5 暂存 `plural(checked.size, "app")` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== checked.size) {
    // t5 暂存 `plural(checked.size, "app")` 生成的渲染片段，后续返回路径直接复用。
    t5 = plural(checked.size, "app");
    // $[5] 缓存 `checked.size`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = checked.size;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // 临时值 t6保存`session`，供终端渲染后续处理使用。
  const t6 = `Allow for this session (${t4} ${t5})`;
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t6) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      label: t6,
      value: "allow_all"
    };
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
    // $[8] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[8];
  }
  // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t8 = {
      label: <Text>Deny, and tell Claude what to do differently <Text bold={true}>(esc)</Text></Text>,
      value: "deny"
    };
    // $[9] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[9];
  }
  // t9 暂存 `[t7, t8]` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t7) {
    // t9 暂存 `[t7, t8]` 生成的渲染片段，后续返回路径直接复用。
    t9 = [t7, t8];
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
    // $[11] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[11];
  }
  // 选项沿用 `t9` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const options = t9;
  // t10 暂存 `function respond(allow) {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== checked || $[13] !== onDone || $[14] !== request.apps || $[15] !== requestedFlagKeys) {
    // t10 暂存 `function respond(allow) {` 生成的渲染片段，后续返回路径直接复用。
    t10 = function respond(allow) {
      // allow缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!allow) {
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone(DENY_ALL_RESPONSE);
        // 权限确认界面 Computer Use Approval在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // now记录时间`Date.now`，供终端渲染后续处理使用。
      const now = Date.now();
      // granted派生`apps.flatMap`，供终端渲染后续处理使用。
      const granted = request.apps.flatMap(a_0 => a_0.resolved && checked.has(a_0.resolved.bundleId) ? [{
        bundleId: a_0.resolved.bundleId,
        displayName: a_0.resolved.displayName,
        grantedAt: now
      }] : []);
      // denied筛选`apps.filter`，供终端渲染后续处理使用。
      const denied = request.apps.filter(a_1 => !a_1.resolved || !checked.has(a_1.resolved.bundleId)).map(_temp2);
      // flags 集合 集中保存终端渲染权限确认界面 Computer Use Approval要一起传递的字段。
      const flags = {
        ...DEFAULT_GRANT_FLAGS,
        ...Object.fromEntries(requestedFlagKeys.map(_temp3))
      };
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone({
        granted,
        denied,
        flags
      });
    };
    // $[12] 缓存 `checked`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = checked;
    // $[13] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = onDone;
    // $[14] 缓存 `request.apps`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = request.apps;
    // $[15] 缓存 `requestedFlagKeys`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = requestedFlagKeys;
    // $[16] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[16];
  }
  // respond沿用 `t10` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const respond = t10;
  // t11 暂存 `() => respond(false)` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== respond) {
    // t11 暂存 `() => respond(false)` 生成的渲染片段，后续返回路径直接复用。
    t11 = () => respond(false);
    // $[17] 缓存 `respond`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = respond;
    // $[18] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[18];
  }
  // t12 暂存 `request.reason ? <Text dimColor={true}>{request.reason}</...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== request.reason) {
    // t12 暂存 `request.reason ? <Text dimColor={true}>{request.reason}</...` 生成的渲染片段，后续返回路径直接复用。
    t12 = request.reason ? <Text dimColor={true}>{request.reason}</Text> : null;
    // $[19] 缓存 `request.reason`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = request.reason;
    // $[20] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[20];
  }
  // t13 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== checked || $[22] !== request.apps) {
    // t14 暂存 `a_3 => {` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[24] !== checked) {
      // t14 暂存 `a_3 => {` 生成的渲染片段，后续返回路径直接复用。
      t14 = a_3 => {
        // resolved读取`a_3.resolved` 整理出中间结果，供终端渲染权限确认界面 Computer Use Approval后续步骤使用。
        const resolved = a_3.resolved;
        // resolved缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!resolved) {
          // 返回 `<Text key={a_3.requestedName} dimColor={true}>{" "}{figures.circle} {a_...`，作为终端渲染这次计算的结果。
          return <Text key={a_3.requestedName} dimColor={true}>{"  "}{figures.circle} {a_3.requestedName}{" "}<Text dimColor={true}>(not installed)</Text></Text>;
        }
        // 满足 `a_3.alreadyGranted` 时，终端渲染执行该分支。
        if (a_3.alreadyGranted) {
          // 返回 `<Text key={resolved.bundleId} dimColor={true}>{" "}{figures.tick} {reso...`，作为终端渲染这次计算的结果。
          return <Text key={resolved.bundleId} dimColor={true}>{"  "}{figures.tick} {resolved.displayName}{" "}<Text dimColor={true}>(already granted)</Text></Text>;
        }
        // sentinel读取`getSentinelCategory`，供终端渲染后续处理使用。
        const sentinel = getSentinelCategory(resolved.bundleId);
        // isChecked记录 `checked.has` 是否成立，终端渲染随后按该结果分支。
        const isChecked = checked.has(resolved.bundleId);
        // 返回 `<Box key={resolved.bundleId} flexDirection="column"><Text>{" "}{isCheck...`，作为终端渲染这次计算的结果。
        return <Box key={resolved.bundleId} flexDirection="column"><Text>{"  "}{isChecked ? figures.circleFilled : figures.circle}{" "}{resolved.displayName}</Text>{sentinel ? <Text bold={true}>{"    "}{figures.warning} {SENTINEL_WARNING[sentinel]}</Text> : null}</Box>;
      };
      // $[24] 缓存 `checked`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = checked;
      // $[25] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = t14;
    } else {
      // t14 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[25];
    }
    // t13 暂存 `request.apps.map(t14)` 生成的渲染片段，后续返回路径直接复用。
    t13 = request.apps.map(t14);
    // $[21] 缓存 `checked`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = checked;
    // $[22] 缓存 `request.apps`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = request.apps;
    // $[23] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[23];
  }
  // t14 暂存 `<Box flexDirection="column">{t13}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== t13) {
    // t14 暂存 `<Box flexDirection="column">{t13}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Box flexDirection="column">{t13}</Box>;
    // $[26] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t13;
    // $[27] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[27];
  }
  // t15 暂存 `requestedFlagKeys.length > 0 ? <Box flexDirection="column...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== requestedFlagKeys) {
    // t15 暂存 `requestedFlagKeys.length > 0 ? <Box flexDirection="column...` 生成的渲染片段，后续返回路径直接复用。
    t15 = requestedFlagKeys.length > 0 ? <Box flexDirection="column"><Text dimColor={true}>Also requested:</Text>{requestedFlagKeys.map(_temp4)}</Box> : null;
    // $[28] 缓存 `requestedFlagKeys`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = requestedFlagKeys;
    // $[29] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[29];
  }
  // t16 暂存 `request.willHide && request.willHide.length > 0 ? <Text d...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== request.willHide) {
    // t16 暂存 `request.willHide && request.willHide.length > 0 ? <Text d...` 生成的渲染片段，后续返回路径直接复用。
    t16 = request.willHide && request.willHide.length > 0 ? <Text dimColor={true}>{request.willHide.length} other{" "}{plural(request.willHide.length, "app")} will be hidden while Claude works.</Text> : null;
    // $[30] 缓存 `request.willHide`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = request.willHide;
    // $[31] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[31];
  }
  // t17 暂存 `v => respond(v === "allow_all")` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // t18 暂存 `() => respond(false)` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== respond) {
    // t17 暂存 `v => respond(v === "allow_all")` 生成的渲染片段，后续返回路径直接复用。
    t17 = v => respond(v === "allow_all");
    // t18 暂存 `() => respond(false)` 生成的渲染片段，后续返回路径直接复用。
    t18 = () => respond(false);
    // $[32] 缓存 `respond`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = respond;
    // $[33] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t17;
    // $[34] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t18;
  } else {
    // t17 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[33];
    // t18 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[34];
  }
  // t19 暂存 `<Select options={options} onChange={t17} onCancel={t18} />` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== options || $[36] !== t17 || $[37] !== t18) {
    // t19 暂存 `<Select options={options} onChange={t17} onCancel={t18} />` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Select options={options} onChange={t17} onCancel={t18} />;
    // $[35] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = options;
    // $[36] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t17;
    // $[37] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t18;
    // $[38] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[38];
  }
  // t20 暂存 `<Box flexDirection="column" paddingX={1} paddingY={1} gap...` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[39] !== t12 || $[40] !== t14 || $[41] !== t15 || $[42] !== t16 || $[43] !== t19) {
    // t20 暂存 `<Box flexDirection="column" paddingX={1} paddingY={1} gap...` 生成的渲染片段，后续返回路径直接复用。
    t20 = <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>{t12}{t14}{t15}{t16}{t19}</Box>;
    // $[39] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t12;
    // $[40] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t14;
    // $[41] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t15;
    // $[42] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t16;
    // $[43] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t19;
    // $[44] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[44];
  }
  // t21 暂存 `<Dialog title="Computer Use wants to control these apps" ...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== t11 || $[46] !== t20) {
    // t21 暂存 `<Dialog title="Computer Use wants to control these apps" ...` 生成的渲染片段，后续返回路径直接复用。
    t21 = <Dialog title="Computer Use wants to control these apps" onCancel={t11}>{t20}</Dialog>;
    // $[45] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t11;
    // $[46] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t20;
    // $[47] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[47];
  }
  // 返回 `t21`，作为终端渲染这次计算的结果。
  return t21;
}
// _temp4 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(flag) {
  // 返回 `<Text key={flag} dimColor={true}>{" "}· {flag}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={flag} dimColor={true}>{"  "}· {flag}</Text>;
}
// _temp3 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(k_0) {
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [k_0, true] as const;
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(a_2) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    bundleId: a_2.resolved?.bundleId ?? a_2.requestedName,
    reason: a_2.resolved ? "user_denied" as const : "not_installed" as const
  };
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(a) {
  // 返回 `a.resolved && !a.alreadyGranted ? [a.resolved.bundleId] : []`，作为终端渲染这次计算的结果。
  return a.resolved && !a.alreadyGranted ? [a.resolved.bundleId] : [];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRTZW50aW5lbENhdGVnb3J5IiwiQ3VQZXJtaXNzaW9uUmVxdWVzdCIsIkN1UGVybWlzc2lvblJlc3BvbnNlIiwiREVGQVVMVF9HUkFOVF9GTEFHUyIsImZpZ3VyZXMiLCJSZWFjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsIkJveCIsIlRleHQiLCJleGVjRmlsZU5vVGhyb3ciLCJwbHVyYWwiLCJPcHRpb25XaXRoRGVzY3JpcHRpb24iLCJTZWxlY3QiLCJEaWFsb2ciLCJDb21wdXRlclVzZUFwcHJvdmFsUHJvcHMiLCJyZXF1ZXN0Iiwib25Eb25lIiwicmVzcG9uc2UiLCJERU5ZX0FMTF9SRVNQT05TRSIsImdyYW50ZWQiLCJkZW5pZWQiLCJmbGFncyIsIkNvbXB1dGVyVXNlQXBwcm92YWwiLCJ0MCIsIiQiLCJfYyIsInQxIiwidGNjU3RhdGUiLCJUY2NPcHRpb24iLCJDb21wdXRlclVzZVRjY1BhbmVsIiwib3B0cyIsImFjY2Vzc2liaWxpdHkiLCJzY3JlZW5SZWNvcmRpbmciLCJTeW1ib2wiLCJmb3IiLCJsYWJlbCIsInZhbHVlIiwicHVzaCIsIm9wdGlvbnMiLCJvbkNoYW5nZSIsInVzZUN3ZCIsInQyIiwidGljayIsImNyb3NzIiwidDMiLCJ0NCIsInQ1IiwidDYiLCJ0NyIsInQ4IiwidDkiLCJ0MTAiLCJBcHBMaXN0T3B0aW9uIiwiU0VOVElORUxfV0FSTklORyIsIlJlY29yZCIsIk5vbk51bGxhYmxlIiwiUmV0dXJuVHlwZSIsInNoZWxsIiwiZmlsZXN5c3RlbSIsInN5c3RlbV9zZXR0aW5ncyIsIkNvbXB1dGVyVXNlQXBwTGlzdFBhbmVsIiwiYXBwcyIsIlNldCIsImZsYXRNYXAiLCJfdGVtcCIsImNoZWNrZWQiLCJBTExfRkxBR19LRVlTIiwicmVxdWVzdGVkRmxhZ3MiLCJmaWx0ZXIiLCJrIiwicmVxdWVzdGVkRmxhZ0tleXMiLCJzaXplIiwicmVzcG9uZCIsImFsbG93Iiwibm93IiwiRGF0ZSIsImFfMCIsImEiLCJyZXNvbHZlZCIsImhhcyIsImJ1bmRsZUlkIiwiZGlzcGxheU5hbWUiLCJncmFudGVkQXQiLCJhXzEiLCJtYXAiLCJfdGVtcDIiLCJPYmplY3QiLCJmcm9tRW50cmllcyIsIl90ZW1wMyIsInQxMSIsInQxMiIsInJlYXNvbiIsInQxMyIsInQxNCIsImFfMyIsInJlcXVlc3RlZE5hbWUiLCJjaXJjbGUiLCJhbHJlYWR5R3JhbnRlZCIsInNlbnRpbmVsIiwiaXNDaGVja2VkIiwiY2lyY2xlRmlsbGVkIiwid2FybmluZyIsInQxNSIsImxlbmd0aCIsIl90ZW1wNCIsInQxNiIsIndpbGxIaWRlIiwidDE3IiwidDE4IiwidiIsInQxOSIsInQyMCIsInQyMSIsImZsYWciLCJrXzAiLCJjb25zdCIsImFfMiJdLCJzb3VyY2VzIjpbIkNvbXB1dGVyVXNlQXBwcm92YWwudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldFNlbnRpbmVsQ2F0ZWdvcnkgfSBmcm9tICdAYW50L2NvbXB1dGVyLXVzZS1tY3Avc2VudGluZWxBcHBzJ1xuaW1wb3J0IHR5cGUge1xuICBDdVBlcm1pc3Npb25SZXF1ZXN0LFxuICBDdVBlcm1pc3Npb25SZXNwb25zZSxcbn0gZnJvbSAnQGFudC9jb21wdXRlci11c2UtbWNwL3R5cGVzJ1xuaW1wb3J0IHsgREVGQVVMVF9HUkFOVF9GTEFHUyB9IGZyb20gJ0BhbnQvY29tcHV0ZXItdXNlLW1jcC90eXBlcydcbmltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZU1lbW8sIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBleGVjRmlsZU5vVGhyb3cgfSBmcm9tICcuLi8uLi8uLi91dGlscy9leGVjRmlsZU5vVGhyb3cuanMnXG5pbXBvcnQgeyBwbHVyYWwgfSBmcm9tICcuLi8uLi8uLi91dGlscy9zdHJpbmdVdGlscy5qcydcbmltcG9ydCB0eXBlIHsgT3B0aW9uV2l0aERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4uLy4uL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuLi8uLi9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcblxudHlwZSBDb21wdXRlclVzZUFwcHJvdmFsUHJvcHMgPSB7XG4gIHJlcXVlc3Q6IEN1UGVybWlzc2lvblJlcXVlc3RcbiAgb25Eb25lOiAocmVzcG9uc2U6IEN1UGVybWlzc2lvblJlc3BvbnNlKSA9PiB2b2lkXG59XG5cbmNvbnN0IERFTllfQUxMX1JFU1BPTlNFOiBDdVBlcm1pc3Npb25SZXNwb25zZSA9IHtcbiAgZ3JhbnRlZDogW10sXG4gIGRlbmllZDogW10sXG4gIGZsYWdzOiBERUZBVUxUX0dSQU5UX0ZMQUdTLFxufVxuXG4vKipcbiAqIFR3by1wYW5lbCBkaXNwYXRjaGVyLiBXaGVuIGByZXF1ZXN0LnRjY1N0YXRlYCBpcyBwcmVzZW50LCBtYWNPUyBwZXJtaXNzaW9uc1xuICogKEFjY2Vzc2liaWxpdHkgLyBTY3JlZW4gUmVjb3JkaW5nKSBhcmUgbWlzc2luZyBhbmQgdGhlIGFwcCBsaXN0IGlzXG4gKiBpcnJlbGV2YW50IOKAlCBzaG93IGEgVENDIHBhbmVsIHRoYXQgb3BlbnMgU3lzdGVtIFNldHRpbmdzLiBPdGhlcndpc2Ugc2hvdyB0aGVcbiAqIGFwcCBhbGxvd2xpc3QgKyBncmFudC1mbGFncyBwYW5lbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIENvbXB1dGVyVXNlQXBwcm92YWwoe1xuICByZXF1ZXN0LFxuICBvbkRvbmUsXG59OiBDb21wdXRlclVzZUFwcHJvdmFsUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gcmVxdWVzdC50Y2NTdGF0ZSA/IChcbiAgICA8Q29tcHV0ZXJVc2VUY2NQYW5lbFxuICAgICAgdGNjU3RhdGU9e3JlcXVlc3QudGNjU3RhdGV9XG4gICAgICBvbkRvbmU9eygpID0+IG9uRG9uZShERU5ZX0FMTF9SRVNQT05TRSl9XG4gICAgLz5cbiAgKSA6IChcbiAgICA8Q29tcHV0ZXJVc2VBcHBMaXN0UGFuZWwgcmVxdWVzdD17cmVxdWVzdH0gb25Eb25lPXtvbkRvbmV9IC8+XG4gIClcbn1cblxuLy8g4pSA4pSAIFRDQyBwYW5lbCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxudHlwZSBUY2NPcHRpb24gPSAnb3Blbl9hY2Nlc3NpYmlsaXR5JyB8ICdvcGVuX3NjcmVlbl9yZWNvcmRpbmcnIHwgJ3JldHJ5J1xuXG5mdW5jdGlvbiBDb21wdXRlclVzZVRjY1BhbmVsKHtcbiAgdGNjU3RhdGUsXG4gIG9uRG9uZSxcbn06IHtcbiAgdGNjU3RhdGU6IE5vbk51bGxhYmxlPEN1UGVybWlzc2lvblJlcXVlc3RbJ3RjY1N0YXRlJ10+XG4gIG9uRG9uZTogKCkgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IG9wdGlvbnMgPSB1c2VNZW1vPE9wdGlvbldpdGhEZXNjcmlwdGlvbjxUY2NPcHRpb24+W10+KCgpID0+IHtcbiAgICBjb25zdCBvcHRzOiBPcHRpb25XaXRoRGVzY3JpcHRpb248VGNjT3B0aW9uPltdID0gW11cbiAgICBpZiAoIXRjY1N0YXRlLmFjY2Vzc2liaWxpdHkpIHtcbiAgICAgIG9wdHMucHVzaCh7XG4gICAgICAgIGxhYmVsOiAnT3BlbiBTeXN0ZW0gU2V0dGluZ3Mg4oaSIEFjY2Vzc2liaWxpdHknLFxuICAgICAgICB2YWx1ZTogJ29wZW5fYWNjZXNzaWJpbGl0eScsXG4gICAgICB9KVxuICAgIH1cbiAgICBpZiAoIXRjY1N0YXRlLnNjcmVlblJlY29yZGluZykge1xuICAgICAgb3B0cy5wdXNoKHtcbiAgICAgICAgbGFiZWw6ICdPcGVuIFN5c3RlbSBTZXR0aW5ncyDihpIgU2NyZWVuIFJlY29yZGluZycsXG4gICAgICAgIHZhbHVlOiAnb3Blbl9zY3JlZW5fcmVjb3JkaW5nJyxcbiAgICAgIH0pXG4gICAgfVxuICAgIG9wdHMucHVzaCh7IGxhYmVsOiAnVHJ5IGFnYWluJywgdmFsdWU6ICdyZXRyeScgfSlcbiAgICByZXR1cm4gb3B0c1xuICB9LCBbdGNjU3RhdGUuYWNjZXNzaWJpbGl0eSwgdGNjU3RhdGUuc2NyZWVuUmVjb3JkaW5nXSlcblxuICBmdW5jdGlvbiBvbkNoYW5nZSh2YWx1ZTogVGNjT3B0aW9uKTogdm9pZCB7XG4gICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgY2FzZSAnb3Blbl9hY2Nlc3NpYmlsaXR5JzpcbiAgICAgICAgdm9pZCBleGVjRmlsZU5vVGhyb3coXG4gICAgICAgICAgJ29wZW4nLFxuICAgICAgICAgIFtcbiAgICAgICAgICAgICd4LWFwcGxlLnN5c3RlbXByZWZlcmVuY2VzOmNvbS5hcHBsZS5wcmVmZXJlbmNlLnNlY3VyaXR5P1ByaXZhY3lfQWNjZXNzaWJpbGl0eScsXG4gICAgICAgICAgXSxcbiAgICAgICAgICB7IHVzZUN3ZDogZmFsc2UgfSxcbiAgICAgICAgKVxuICAgICAgICByZXR1cm5cbiAgICAgIGNhc2UgJ29wZW5fc2NyZWVuX3JlY29yZGluZyc6XG4gICAgICAgIHZvaWQgZXhlY0ZpbGVOb1Rocm93KFxuICAgICAgICAgICdvcGVuJyxcbiAgICAgICAgICBbXG4gICAgICAgICAgICAneC1hcHBsZS5zeXN0ZW1wcmVmZXJlbmNlczpjb20uYXBwbGUucHJlZmVyZW5jZS5zZWN1cml0eT9Qcml2YWN5X1NjcmVlbkNhcHR1cmUnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgeyB1c2VDd2Q6IGZhbHNlIH0sXG4gICAgICAgIClcbiAgICAgICAgcmV0dXJuXG4gICAgICBjYXNlICdyZXRyeSc6XG4gICAgICAgIC8vIFJlc29sdmUgd2l0aCBkZW55LWFsbCDigJQgdGhlIG1vZGVsIHJlLWNhbGxzIHJlcXVlc3RfYWNjZXNzLCB3aGljaFxuICAgICAgICAvLyByZS1jaGVja3MgVENDIGFuZCByZW5kZXJzIHRoZSBhcHAgbGlzdCBpZiBub3cgZ3JhbnRlZC5cbiAgICAgICAgb25Eb25lKClcbiAgICAgICAgcmV0dXJuXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nIHRpdGxlPVwiQ29tcHV0ZXIgVXNlIG5lZWRzIG1hY09TIHBlcm1pc3Npb25zXCIgb25DYW5jZWw9e29uRG9uZX0+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBwYWRkaW5nWD17MX0gcGFkZGluZ1k9ezF9IGdhcD17MX0+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgQWNjZXNzaWJpbGl0eTp7JyAnfVxuICAgICAgICAgICAge3RjY1N0YXRlLmFjY2Vzc2liaWxpdHlcbiAgICAgICAgICAgICAgPyBgJHtmaWd1cmVzLnRpY2t9IGdyYW50ZWRgXG4gICAgICAgICAgICAgIDogYCR7ZmlndXJlcy5jcm9zc30gbm90IGdyYW50ZWRgfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIFNjcmVlbiBSZWNvcmRpbmc6eycgJ31cbiAgICAgICAgICAgIHt0Y2NTdGF0ZS5zY3JlZW5SZWNvcmRpbmdcbiAgICAgICAgICAgICAgPyBgJHtmaWd1cmVzLnRpY2t9IGdyYW50ZWRgXG4gICAgICAgICAgICAgIDogYCR7ZmlndXJlcy5jcm9zc30gbm90IGdyYW50ZWRgfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIEdyYW50IHRoZSBtaXNzaW5nIHBlcm1pc3Npb25zIGluIFN5c3RlbSBTZXR0aW5ncywgdGhlbiBzZWxlY3RcbiAgICAgICAgICAmcXVvdDtUcnkgYWdhaW4mcXVvdDsuIG1hY09TIG1heSByZXF1aXJlIHlvdSB0byByZXN0YXJ0IENsYXVkZSBDb2RlXG4gICAgICAgICAgYWZ0ZXIgZ3JhbnRpbmcgU2NyZWVuIFJlY29yZGluZy5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8U2VsZWN0IG9wdGlvbnM9e29wdGlvbnN9IG9uQ2hhbmdlPXtvbkNoYW5nZX0gb25DYW5jZWw9e29uRG9uZX0gLz5cbiAgICAgIDwvQm94PlxuICAgIDwvRGlhbG9nPlxuICApXG59XG5cbi8vIOKUgOKUgCBBcHAgYWxsb3dsaXN0IHBhbmVsIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG50eXBlIEFwcExpc3RPcHRpb24gPSAnYWxsb3dfYWxsJyB8ICdkZW55J1xuXG5jb25zdCBTRU5USU5FTF9XQVJOSU5HOiBSZWNvcmQ8XG4gIE5vbk51bGxhYmxlPFJldHVyblR5cGU8dHlwZW9mIGdldFNlbnRpbmVsQ2F0ZWdvcnk+PixcbiAgc3RyaW5nXG4+ID0ge1xuICBzaGVsbDogJ2VxdWl2YWxlbnQgdG8gc2hlbGwgYWNjZXNzJyxcbiAgZmlsZXN5c3RlbTogJ2NhbiByZWFkL3dyaXRlIGFueSBmaWxlJyxcbiAgc3lzdGVtX3NldHRpbmdzOiAnY2FuIGNoYW5nZSBzeXN0ZW0gc2V0dGluZ3MnLFxufVxuXG5mdW5jdGlvbiBDb21wdXRlclVzZUFwcExpc3RQYW5lbCh7XG4gIHJlcXVlc3QsXG4gIG9uRG9uZSxcbn06IENvbXB1dGVyVXNlQXBwcm92YWxQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIFByZS1jaGVjayBldmVyeSByZXNvbHZlZCwgbm90LXlldC1ncmFudGVkIGFwcC4gU2VudGluZWxzIHN0YXkgY2hlY2tlZFxuICAvLyB0b28g4oCUIHRoZSB3YXJuaW5nIHRleHQgaXMgdGhlIHNpZ25hbCwgbm90IGFuIHVuY2hlY2tlZCBib3guXG4gIC8vIFBlci1pdGVtIHRvZ2dsZXMgYXJlIGEgZm9sbG93LXVwOyBmb3Igbm93IGV2ZXJ5IHJlc29sdmVkIGFwcCBpcyBncmFudGVkXG4gIC8vIHdoZW4gdGhlIHVzZXIgYWNjZXB0cy4gYHNldENoZWNrZWRgIGlzIHVudXNlZCB1bnRpbCB0aGVuLlxuICBjb25zdCBbY2hlY2tlZF0gPSB1c2VTdGF0ZTxSZWFkb25seVNldDxzdHJpbmc+PihcbiAgICAoKSA9PlxuICAgICAgbmV3IFNldChcbiAgICAgICAgcmVxdWVzdC5hcHBzLmZsYXRNYXAoYSA9PlxuICAgICAgICAgIGEucmVzb2x2ZWQgJiYgIWEuYWxyZWFkeUdyYW50ZWQgPyBbYS5yZXNvbHZlZC5idW5kbGVJZF0gOiBbXSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gIClcblxuICB0eXBlIEZsYWdLZXkgPSBrZXlvZiB0eXBlb2YgREVGQVVMVF9HUkFOVF9GTEFHU1xuICBjb25zdCBBTExfRkxBR19LRVlTOiBGbGFnS2V5W10gPSBbXG4gICAgJ2NsaXBib2FyZFJlYWQnLFxuICAgICdjbGlwYm9hcmRXcml0ZScsXG4gICAgJ3N5c3RlbUtleUNvbWJvcycsXG4gIF1cbiAgY29uc3QgcmVxdWVzdGVkRmxhZ0tleXMgPSB1c2VNZW1vKFxuICAgICgpOiBGbGFnS2V5W10gPT4gQUxMX0ZMQUdfS0VZUy5maWx0ZXIoayA9PiByZXF1ZXN0LnJlcXVlc3RlZEZsYWdzW2tdKSxcbiAgICBbcmVxdWVzdC5yZXF1ZXN0ZWRGbGFnc10sXG4gIClcblxuICBjb25zdCBvcHRpb25zID0gdXNlTWVtbzxPcHRpb25XaXRoRGVzY3JpcHRpb248QXBwTGlzdE9wdGlvbj5bXT4oXG4gICAgKCkgPT4gW1xuICAgICAge1xuICAgICAgICBsYWJlbDogYEFsbG93IGZvciB0aGlzIHNlc3Npb24gKCR7Y2hlY2tlZC5zaXplfSAke3BsdXJhbChjaGVja2VkLnNpemUsICdhcHAnKX0pYCxcbiAgICAgICAgdmFsdWU6ICdhbGxvd19hbGwnLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IChcbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIERlbnksIGFuZCB0ZWxsIENsYXVkZSB3aGF0IHRvIGRvIGRpZmZlcmVudGx5IDxUZXh0IGJvbGQ+KGVzYyk8L1RleHQ+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApLFxuICAgICAgICB2YWx1ZTogJ2RlbnknLFxuICAgICAgfSxcbiAgICBdLFxuICAgIFtjaGVja2VkLnNpemVdLFxuICApXG5cbiAgZnVuY3Rpb24gcmVzcG9uZChhbGxvdzogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICghYWxsb3cpIHtcbiAgICAgIG9uRG9uZShERU5ZX0FMTF9SRVNQT05TRSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gICAgY29uc3QgZ3JhbnRlZCA9IHJlcXVlc3QuYXBwcy5mbGF0TWFwKGEgPT5cbiAgICAgIGEucmVzb2x2ZWQgJiYgY2hlY2tlZC5oYXMoYS5yZXNvbHZlZC5idW5kbGVJZClcbiAgICAgICAgPyBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGJ1bmRsZUlkOiBhLnJlc29sdmVkLmJ1bmRsZUlkLFxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogYS5yZXNvbHZlZC5kaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgZ3JhbnRlZEF0OiBub3csXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF1cbiAgICAgICAgOiBbXSxcbiAgICApXG4gICAgY29uc3QgZGVuaWVkID0gcmVxdWVzdC5hcHBzXG4gICAgICAuZmlsdGVyKGEgPT4gIWEucmVzb2x2ZWQgfHwgIWNoZWNrZWQuaGFzKGEucmVzb2x2ZWQuYnVuZGxlSWQpKVxuICAgICAgLm1hcChhID0+ICh7XG4gICAgICAgIGJ1bmRsZUlkOiBhLnJlc29sdmVkPy5idW5kbGVJZCA/PyBhLnJlcXVlc3RlZE5hbWUsXG4gICAgICAgIHJlYXNvbjogYS5yZXNvbHZlZFxuICAgICAgICAgID8gKCd1c2VyX2RlbmllZCcgYXMgY29uc3QpXG4gICAgICAgICAgOiAoJ25vdF9pbnN0YWxsZWQnIGFzIGNvbnN0KSxcbiAgICAgIH0pKVxuICAgIC8vIEdyYW50IGFsbCByZXF1ZXN0ZWQgZmxhZ3Mgb24gYWxsb3cg4oCUIHBlci1mbGFnIHRvZ2dsZXMgYXJlIGEgZm9sbG93LXVwLlxuICAgIGNvbnN0IGZsYWdzID0ge1xuICAgICAgLi4uREVGQVVMVF9HUkFOVF9GTEFHUyxcbiAgICAgIC4uLk9iamVjdC5mcm9tRW50cmllcyhyZXF1ZXN0ZWRGbGFnS2V5cy5tYXAoayA9PiBbaywgdHJ1ZV0gYXMgY29uc3QpKSxcbiAgICB9XG4gICAgb25Eb25lKHsgZ3JhbnRlZCwgZGVuaWVkLCBmbGFncyB9KVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT1cIkNvbXB1dGVyIFVzZSB3YW50cyB0byBjb250cm9sIHRoZXNlIGFwcHNcIlxuICAgICAgb25DYW5jZWw9eygpID0+IHJlc3BvbmQoZmFsc2UpfVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsxfSBwYWRkaW5nWT17MX0gZ2FwPXsxfT5cbiAgICAgICAge3JlcXVlc3QucmVhc29uID8gPFRleHQgZGltQ29sb3I+e3JlcXVlc3QucmVhc29ufTwvVGV4dD4gOiBudWxsfVxuXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIHtyZXF1ZXN0LmFwcHMubWFwKGEgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSBhLnJlc29sdmVkXG4gICAgICAgICAgICBpZiAoIXJlc29sdmVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPFRleHQga2V5PXthLnJlcXVlc3RlZE5hbWV9IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgICAgeycgICd9XG4gICAgICAgICAgICAgICAgICB7ZmlndXJlcy5jaXJjbGV9IHthLnJlcXVlc3RlZE5hbWV9eycgJ31cbiAgICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPihub3QgaW5zdGFsbGVkKTwvVGV4dD5cbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhLmFscmVhZHlHcmFudGVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPFRleHQga2V5PXtyZXNvbHZlZC5idW5kbGVJZH0gZGltQ29sb3I+XG4gICAgICAgICAgICAgICAgICB7JyAgJ31cbiAgICAgICAgICAgICAgICAgIHtmaWd1cmVzLnRpY2t9IHtyZXNvbHZlZC5kaXNwbGF5TmFtZX17JyAnfVxuICAgICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+KGFscmVhZHkgZ3JhbnRlZCk8L1RleHQ+XG4gICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzZW50aW5lbCA9IGdldFNlbnRpbmVsQ2F0ZWdvcnkocmVzb2x2ZWQuYnVuZGxlSWQpXG4gICAgICAgICAgICBjb25zdCBpc0NoZWNrZWQgPSBjaGVja2VkLmhhcyhyZXNvbHZlZC5idW5kbGVJZClcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxCb3gga2V5PXtyZXNvbHZlZC5idW5kbGVJZH0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAgeycgICd9XG4gICAgICAgICAgICAgICAgICB7aXNDaGVja2VkID8gZmlndXJlcy5jaXJjbGVGaWxsZWQgOiBmaWd1cmVzLmNpcmNsZX17JyAnfVxuICAgICAgICAgICAgICAgICAge3Jlc29sdmVkLmRpc3BsYXlOYW1lfVxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICB7c2VudGluZWwgPyAoXG4gICAgICAgICAgICAgICAgICA8VGV4dCBib2xkPlxuICAgICAgICAgICAgICAgICAgICB7JyAgICAnfVxuICAgICAgICAgICAgICAgICAgICB7ZmlndXJlcy53YXJuaW5nfSB7U0VOVElORUxfV0FSTklOR1tzZW50aW5lbF19XG4gICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKVxuICAgICAgICAgIH0pfVxuICAgICAgICA8L0JveD5cblxuICAgICAgICB7cmVxdWVzdGVkRmxhZ0tleXMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPkFsc28gcmVxdWVzdGVkOjwvVGV4dD5cbiAgICAgICAgICAgIHtyZXF1ZXN0ZWRGbGFnS2V5cy5tYXAoZmxhZyA9PiAoXG4gICAgICAgICAgICAgIDxUZXh0IGtleT17ZmxhZ30gZGltQ29sb3I+XG4gICAgICAgICAgICAgICAgeycgICd9wrcge2ZsYWd9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApIDogbnVsbH1cblxuICAgICAgICB7cmVxdWVzdC53aWxsSGlkZSAmJiByZXF1ZXN0LndpbGxIaWRlLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7cmVxdWVzdC53aWxsSGlkZS5sZW5ndGh9IG90aGVyeycgJ31cbiAgICAgICAgICAgIHtwbHVyYWwocmVxdWVzdC53aWxsSGlkZS5sZW5ndGgsICdhcHAnKX0gd2lsbCBiZSBoaWRkZW4gd2hpbGUgQ2xhdWRlXG4gICAgICAgICAgICB3b3Jrcy5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgIG9uQ2hhbmdlPXt2ID0+IHJlc3BvbmQodiA9PT0gJ2FsbG93X2FsbCcpfVxuICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiByZXNwb25kKGZhbHNlKX1cbiAgICAgICAgLz5cbiAgICAgIDwvQm94PlxuICAgIDwvRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxtQkFBbUIsUUFBUSxvQ0FBb0M7QUFDeEUsY0FDRUMsbUJBQW1CLEVBQ25CQyxvQkFBb0IsUUFDZiw2QkFBNkI7QUFDcEMsU0FBU0MsbUJBQW1CLFFBQVEsNkJBQTZCO0FBQ2pFLE9BQU9DLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsT0FBTyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUN6QyxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxpQkFBaUI7QUFDM0MsU0FBU0MsZUFBZSxRQUFRLG1DQUFtQztBQUNuRSxTQUFTQyxNQUFNLFFBQVEsK0JBQStCO0FBQ3RELGNBQWNDLHFCQUFxQixRQUFRLDhCQUE4QjtBQUN6RSxTQUFTQyxNQUFNLFFBQVEsOEJBQThCO0FBQ3JELFNBQVNDLE1BQU0sUUFBUSwrQkFBK0I7QUFFdEQsS0FBS0Msd0JBQXdCLEdBQUc7RUFDOUJDLE9BQU8sRUFBRWYsbUJBQW1CO0VBQzVCZ0IsTUFBTSxFQUFFLENBQUNDLFFBQVEsRUFBRWhCLG9CQUFvQixFQUFFLEdBQUcsSUFBSTtBQUNsRCxDQUFDO0FBRUQsTUFBTWlCLGlCQUFpQixFQUFFakIsb0JBQW9CLEdBQUc7RUFDOUNrQixPQUFPLEVBQUUsRUFBRTtFQUNYQyxNQUFNLEVBQUUsRUFB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
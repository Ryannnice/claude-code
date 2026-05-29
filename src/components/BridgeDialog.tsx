// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path';
// 引入 toString as qrToString，将 qrcode 中已经封装好的能力接到本文件流程里。
import { toString as qrToString } from 'qrcode';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react';
// 引入 getOriginalCwd，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../bootstrap/state.js';
// 引入 buildActiveFooterText、buildIdleFooterText、FAILED_FOOTER_TEXT、getBridgeStatus，将 ../bridge/bridgeStatusUtil.js 中已经封装好的能力接到本文件流程里。
import { buildActiveFooterText, buildIdleFooterText, FAILED_FOOTER_TEXT, getBridgeStatus } from '../bridge/bridgeStatusUtil.js';
// 引入 BRIDGE_FAILED_INDICATOR、BRIDGE_READY_INDICATOR，将 ../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BRIDGE_FAILED_INDICATOR, BRIDGE_READY_INDICATOR } from '../constants/figures.js';
// 引入 useRegisterOverlay，将 ../context/overlayContext.js 中已经封装好的能力接到本文件流程里。
import { useRegisterOverlay } from '../context/overlayContext.js';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- raw 'd' key for disconnect, not a configurable keybinding action
// 引入 Box、Text、useInput，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useInput } from '../ink.js';
// 引入 useKeybindings，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../keybindings/useKeybinding.js';
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js';
// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { saveGlobalConfig } from '../utils/config.js';
// 复用 getBranch 工具函数，把通用处理留在 ../utils/git.js 中维护。
import { getBranch } from '../utils/git.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: () => void;，负责终端渲染在该局部场景下的响应。
  onDone: () => void;
};
// BridgeDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function BridgeDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(87);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // 调用 useRegisterOverlay，触发终端渲染此处需要的副作用。
  useRegisterOverlay("bridge-dialog");
  // connected保存`useAppState`，供终端渲染后续处理使用。
  const connected = useAppState(_temp);
  // sessionActive 会话数据保存`useAppState`，供终端渲染后续处理使用。
  const sessionActive = useAppState(_temp2);
  // reconnecting保存`useAppState`，供终端渲染后续处理使用。
  const reconnecting = useAppState(_temp3);
  // connectUrl保存`useAppState`，供终端渲染后续处理使用。
  const connectUrl = useAppState(_temp4);
  // sessionUrl 会话数据保存`useAppState`，供终端渲染后续处理使用。
  const sessionUrl = useAppState(_temp5);
  // 错误保存`useAppState`，供终端渲染后续处理使用。
  const error = useAppState(_temp6);
  // explicit保存`useAppState`，供终端渲染后续处理使用。
  const explicit = useAppState(_temp7);
  // environmentId保存`useAppState`，供终端渲染后续处理使用。
  const environmentId = useAppState(_temp8);
  // sessionId 会话数据保存`useAppState`，供终端渲染后续处理使用。
  const sessionId = useAppState(_temp9);
  // verbose保存`useAppState`，供终端渲染后续处理使用。
  const verbose = useAppState(_temp0);
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // showQR 由 React state 持有，setShowQR 会在用户操作或异步结果返回时触发刷新。
  const [showQR, setShowQR] = useState(false);
  // qrText 由 React state 持有，setQrText 会在用户操作或异步结果返回时触发刷新。
  const [qrText, setQrText] = useState("");
  // branchName 由 React state 持有，setBranchName 会在用户操作或异步结果返回时触发刷新。
  const [branchName, setBranchName] = useState("");
  // t1 暂存 `basename(getOriginalCwd())` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `basename(getOriginalCwd())` 生成的渲染片段，后续返回路径直接复用。
    t1 = basename(getOriginalCwd());
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // repoName沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const repoName = t1;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 调用 getBranch，触发终端渲染此处需要的副作用。
      getBranch().then(setBranchName).catch(_temp1);
    };
    // t3 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // displayUrl保存`sessionActive ? sessionUrl : connectUrl`，供后续判断或组装使用。
  const displayUrl = sessionActive ? sessionUrl : connectUrl;
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== displayUrl || $[4] !== showQR) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // 只有 `!showQR || !displayUrl` 满足时，终端渲染才执行该分支。
      if (!showQR || !displayUrl) {
        // setQrText 写入新的状态值，使终端渲染后续读取保持一致。
        setQrText("");
        // 终端 UI 组件 Bridge Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 qrToString，触发终端渲染此处需要的副作用。
      qrToString(displayUrl, {
        type: "utf8",
        errorCorrectionLevel: "L",
        small: true
      // 这个回调绑定到 }).then(setQrText).catch(() => setQrText(""));，负责终端渲染在该局部场景下的响应。
      }).then(setQrText).catch(() => setQrText(""));
    };
    // t5 暂存 `[showQR, displayUrl]` 生成的渲染片段，后续返回路径直接复用。
    t5 = [showQR, displayUrl];
    // $[3] 缓存 `displayUrl`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = displayUrl;
    // $[4] 缓存 `showQR`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = showQR;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t4, t5);
  // t6 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = () => {
      // setShowQR 写入新的状态值，使终端渲染后续读取保持一致。
      setShowQR(_temp10);
    };
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[7];
  }
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== onDone) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      "confirm:yes": onDone,
      "confirm:toggle": t6
    };
    // $[8] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onDone;
    // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[9];
  }
  // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t8 = {
      context: "Confirmation"
    };
    // $[10] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[10];
  }
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(t7, t8);
  // t9 暂存 `input => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== explicit || $[12] !== onDone || $[13] !== setAppState) {
    // t9 暂存 `input => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = input => {
      // 当 `input` 匹配 `"d"` 时，终端渲染执行对应分支。
      if (input === "d") {
        // 满足 `explicit` 时，终端渲染执行该分支。
        if (explicit) {
          // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
          saveGlobalConfig(_temp11);
        }
        // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
        setAppState(_temp12);
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone();
      }
    };
    // $[11] 缓存 `explicit`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = explicit;
    // $[12] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onDone;
    // $[13] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = setAppState;
    // $[14] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[14];
  }
  // 调用 useInput，触发终端渲染此处需要的副作用。
  useInput(t9);
  // t10 暂存 `getBridgeStatus({` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== connected || $[16] !== error || $[17] !== reconnecting || $[18] !== sessionActive) {
    // t10 暂存 `getBridgeStatus({` 生成的渲染片段，后续返回路径直接复用。
    t10 = getBridgeStatus({
      error,
      connected,
      sessionActive,
      reconnecting
    });
    // $[15] 缓存 `connected`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = connected;
    // $[16] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = error;
    // $[17] 缓存 `reconnecting`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = reconnecting;
    // $[18] 缓存 `sessionActive`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = sessionActive;
    // $[19] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[19];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    label: statusLabel,
    color: statusColor
  } = t10;
  // indicator保存`error ? BRIDGE_FAILED_INDICATOR : BRIDGE_READY_INDICATOR`，供终端 UI Bridge Dialog后续判断或输出使用。
  const indicator = error ? BRIDGE_FAILED_INDICATOR : BRIDGE_READY_INDICATOR;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // footerText 先占位，稍后的条件分支会根据实际输入补齐它。
  let footerText;
  // t11 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t11;
  // t12 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t12;
  // t13 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t13;
  // t14 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t14;
  // t15 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t15;
  // t16 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t16;
  // t17 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== branchName || $[21] !== displayUrl || $[22] !== environmentId || $[23] !== error || $[24] !== indicator || $[25] !== onDone || $[26] !== qrText || $[27] !== sessionActive || $[28] !== sessionId || $[29] !== showQR || $[30] !== statusColor || $[31] !== statusLabel || $[32] !== verbose) {
    // qrLines 集合格式化`qrText.split`，供终端渲染后续处理使用。
    const qrLines = qrText ? qrText.split("\n").filter(_temp13) : [];
    // contextParts 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let contextParts;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[43] !== branchName) {
      // contextParts 集合更新为 `[]`，确保终端 UI后续读取最新状态。
      contextParts = [];
      // 满足 `repoName` 时，终端渲染执行该分支。
      if (repoName) {
        // contextParts 集合追加新条目，保持收集顺序与输入顺序一致。
        contextParts.push(repoName);
      }
      // 满足 `branchName` 时，终端渲染执行该分支。
      if (branchName) {
        // contextParts 集合追加新条目，保持收集顺序与输入顺序一致。
        contextParts.push(branchName);
      }
      // $[43] 缓存 `branchName`，下次依赖未变时 React 编译产物可直接复用。
      $[43] = branchName;
      // $[44] 缓存 `contextParts`，下次依赖未变时 React 编译产物可直接复用。
      $[44] = contextParts;
    } else {
      // contextParts 集合更新为 `$[44]`，确保终端 UI后续读取最新状态。
      contextParts = $[44];
    }
    // contextSuffix格式化`contextParts.join`，供终端渲染后续处理使用。
    const contextSuffix = contextParts.length > 0 ? " \xB7 " + contextParts.join(" \xB7 ") : "";
    // t18 暂存 `error ? FAILED_FOOTER_TEXT : displayUrl ? sessionActive ?...` 的派生结果，便于缓存命中时直接复用。
    let t18;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[45] !== displayUrl || $[46] !== error || $[47] !== sessionActive) {
      // t18 暂存 `error ? FAILED_FOOTER_TEXT : displayUrl ? sessionActive ?...` 生成的渲染片段，后续返回路径直接复用。
      t18 = error ? FAILED_FOOTER_TEXT : displayUrl ? sessionActive ? buildActiveFooterText(displayUrl) : buildIdleFooterText(displayUrl) : undefined;
      // $[45] 缓存 `displayUrl`，下次依赖未变时 React 编译产物可直接复用。
      $[45] = displayUrl;
      // $[46] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
      $[46] = error;
      // $[47] 缓存 `sessionActive`，下次依赖未变时 React 编译产物可直接复用。
      $[47] = sessionActive;
      // $[48] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
      $[48] = t18;
    } else {
      // t18 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
      t18 = $[48];
    }
    // footerText更新为 `t18`，确保终端 UI后续读取最新状态。
    footerText = t18;
    // T1 暂存 `Dialog` 生成的渲染片段，后续返回路径直接复用。
    T1 = Dialog;
    // t15 暂存 `"Remote Control"` 生成的渲染片段，后续返回路径直接复用。
    t15 = "Remote Control";
    // t16 暂存 `onDone` 生成的渲染片段，后续返回路径直接复用。
    t16 = onDone;
    // t17 暂存 `true` 生成的渲染片段，后续返回路径直接复用。
    t17 = true;
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t11 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t11 = "column";
    // t12 暂存 `1` 生成的渲染片段，后续返回路径直接复用。
    t12 = 1;
    // t19 暂存 `<Text color={statusColor}>{indicator} {statusLabel}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t19;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[49] !== indicator || $[50] !== statusColor || $[51] !== statusLabel) {
      // t19 暂存 `<Text color={statusColor}>{indicator} {statusLabel}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t19 = <Text color={statusColor}>{indicator} {statusLabel}</Text>;
      // $[49] 缓存 `indicator`，下次依赖未变时 React 编译产物可直接复用。
      $[49] = indicator;
      // $[50] 缓存 `statusColor`，下次依赖未变时 React 编译产物可直接复用。
      $[50] = statusColor;
      // $[51] 缓存 `statusLabel`，下次依赖未变时 React 编译产物可直接复用。
      $[51] = statusLabel;
      // $[52] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
      $[52] = t19;
    } else {
      // t19 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
      t19 = $[52];
    }
    // t20 暂存 `<Text dimColor={true}>{contextSuffix}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t20;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[53] !== contextSuffix) {
      // t20 暂存 `<Text dimColor={true}>{contextSuffix}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t20 = <Text dimColor={true}>{contextSuffix}</Text>;
      // $[53] 缓存 `contextSuffix`，下次依赖未变时 React 编译产物可直接复用。
      $[53] = contextSuffix;
      // $[54] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
      $[54] = t20;
    } else {
      // t20 从 React 编译缓存槽 $[54] 取回渲染片段，避免依赖未变时重建 JSX。
      t20 = $[54];
    }
    // t21 暂存 `<Text>{t19}{t20}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t21;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[55] !== t19 || $[56] !== t20) {
      // t21 暂存 `<Text>{t19}{t20}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t21 = <Text>{t19}{t20}</Text>;
      // $[55] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
      $[55] = t19;
      // $[56] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
      $[56] = t20;
      // $[57] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
      $[57] = t21;
    } else {
      // t21 从 React 编译缓存槽 $[57] 取回渲染片段，避免依赖未变时重建 JSX。
      t21 = $[57];
    }
    // t22 暂存 `error && <Text color="error">{error}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t22;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[58] !== error) {
      // t22 暂存 `error && <Text color="error">{error}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t22 = error && <Text color="error">{error}</Text>;
      // $[58] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
      $[58] = error;
      // $[59] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[59] = t22;
    } else {
      // t22 从 React 编译缓存槽 $[59] 取回渲染片段，避免依赖未变时重建 JSX。
      t22 = $[59];
    }
    // t23 暂存 `verbose && environmentId && <Text dimColor={true}>Environ...` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[60] !== environmentId || $[61] !== verbose) {
      // t23 暂存 `verbose && environmentId && <Text dimColor={true}>Environ...` 生成的渲染片段，后续返回路径直接复用。
      t23 = verbose && environmentId && <Text dimColor={true}>Environment: {environmentId}</Text>;
      // $[60] 缓存 `environmentId`，下次依赖未变时 React 编译产物可直接复用。
      $[60] = environmentId;
      // $[61] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[61] = verbose;
      // $[62] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[62] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[62];
    }
    // t24 暂存 `verbose && sessionId && <Text dimColor={true}>Session: {s...` 的派生结果，便于缓存命中时直接复用。
    let t24;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[63] !== sessionId || $[64] !== verbose) {
      // t24 暂存 `verbose && sessionId && <Text dimColor={true}>Session: {s...` 生成的渲染片段，后续返回路径直接复用。
      t24 = verbose && sessionId && <Text dimColor={true}>Session: {sessionId}</Text>;
      // $[63] 缓存 `sessionId`，下次依赖未变时 React 编译产物可直接复用。
      $[63] = sessionId;
      // $[64] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[64] = verbose;
      // $[65] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[65] = t24;
    } else {
      // t24 从 React 编译缓存槽 $[65] 取回渲染片段，避免依赖未变时重建 JSX。
      t24 = $[65];
    }
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[66] !== t21 || $[67] !== t22 || $[68] !== t23 || $[69] !== t24) {
      // t13 暂存 `<Box flexDirection="column">{t21}{t22}{t23}{t24}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t13 = <Box flexDirection="column">{t21}{t22}{t23}{t24}</Box>;
      // $[66] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
      $[66] = t21;
      // $[67] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[67] = t22;
      // $[68] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[68] = t23;
      // $[69] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[69] = t24;
      // $[70] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[70] = t13;
    } else {
      // t13 从 React 编译缓存槽 $[70] 取回渲染片段，避免依赖未变时重建 JSX。
      t13 = $[70];
    }
    // t14 暂存 `showQR && qrLines.length > 0 && <Box flexDirection="colum...` 生成的渲染片段，后续返回路径直接复用。
    t14 = showQR && qrLines.length > 0 && <Box flexDirection="column">{qrLines.map(_temp14)}</Box>;
    // $[20] 缓存 `branchName`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = branchName;
    // $[21] 缓存 `displayUrl`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = displayUrl;
    // $[22] 缓存 `environmentId`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = environmentId;
    // $[23] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = error;
    // $[24] 缓存 `indicator`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = indicator;
    // $[25] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = onDone;
    // $[26] 缓存 `qrText`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = qrText;
    // $[27] 缓存 `sessionActive`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = sessionActive;
    // $[28] 缓存 `sessionId`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = sessionId;
    // $[29] 缓存 `showQR`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = showQR;
    // $[30] 缓存 `statusColor`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = statusColor;
    // $[31] 缓存 `statusLabel`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = statusLabel;
    // $[32] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = verbose;
    // $[33] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = T0;
    // $[34] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = T1;
    // $[35] 缓存 `footerText`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = footerText;
    // $[36] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t11;
    // $[37] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t12;
    // $[38] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t13;
    // $[39] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t14;
    // $[40] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t15;
    // $[41] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t16;
    // $[42] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t17;
  } else {
    // T0 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[33];
    // T1 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[34];
    // footerText更新为 `$[35]`，确保终端 UI后续读取最新状态。
    footerText = $[35];
    // t11 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[36];
    // t12 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[37];
    // t13 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[38];
    // t14 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[39];
    // t15 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[40];
    // t16 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[41];
    // t17 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[42];
  }
  // t18 暂存 `footerText && <Text dimColor={true}>{footerText}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[71] !== footerText) {
    // t18 暂存 `footerText && <Text dimColor={true}>{footerText}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t18 = footerText && <Text dimColor={true}>{footerText}</Text>;
    // $[71] 缓存 `footerText`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = footerText;
    // $[72] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[72];
  }
  // t19 暂存 `<Text dimColor={true}>d to disconnect · space for QR code...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[73] === Symbol.for("react.memo_cache_sentinel")) {
    // t19 暂存 `<Text dimColor={true}>d to disconnect · space for QR code...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Text dimColor={true}>d to disconnect · space for QR code · Enter/Esc to close</Text>;
    // $[73] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[73] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[73];
  }
  // t20 暂存 `<T0 flexDirection={t11} gap={t12}>{t13}{t14}{t18}{t19}</T...` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[74] !== T0 || $[75] !== t11 || $[76] !== t12 || $[77] !== t13 || $[78] !== t14 || $[79] !== t18) {
    // t20 暂存 `<T0 flexDirection={t11} gap={t12}>{t13}{t14}{t18}{t19}</T...` 生成的渲染片段，后续返回路径直接复用。
    t20 = <T0 flexDirection={t11} gap={t12}>{t13}{t14}{t18}{t19}</T0>;
    // $[74] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = T0;
    // $[75] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = t11;
    // $[76] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = t12;
    // $[77] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = t13;
    // $[78] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[78] = t14;
    // $[79] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[79] = t18;
    // $[80] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[80] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[80];
  }
  // t21 暂存 `<T1 title={t15} onCancel={t16} hideInputGuide={t17}>{t20}...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[81] !== T1 || $[82] !== t15 || $[83] !== t16 || $[84] !== t17 || $[85] !== t20) {
    // t21 暂存 `<T1 title={t15} onCancel={t16} hideInputGuide={t17}>{t20}...` 生成的渲染片段，后续返回路径直接复用。
    t21 = <T1 title={t15} onCancel={t16} hideInputGuide={t17}>{t20}</T1>;
    // $[81] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[81] = T1;
    // $[82] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[82] = t15;
    // $[83] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[83] = t16;
    // $[84] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[84] = t17;
    // $[85] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[85] = t20;
    // $[86] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[86] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[86] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[86];
  }
  // 返回 `t21`，作为终端渲染这次计算的结果。
  return t21;
}
// _temp14 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp14(line, i) {
  // 返回 `<Text key={i}>{line}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i}>{line}</Text>;
}
// _temp13 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp13(l) {
  // 返回 `l.length > 0`，作为终端渲染这次计算的结果。
  return l.length > 0;
}
// _temp12 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp12(prev_0) {
  // prev_0.replBridgeEnabled缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!prev_0.replBridgeEnabled) {
    // 返回 `prev_0`，作为终端渲染这次计算的结果。
    return prev_0;
  }
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...prev_0,
    replBridgeEnabled: false
  };
}
// _temp11 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp11(current) {
  // 满足 `current.remoteControlAtStartup === false` 时，终端渲染执行该分支。
  if (current.remoteControlAtStartup === false) {
    // 返回 `current`，作为终端渲染这次计算的结果。
    return current;
  }
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...current,
    remoteControlAtStartup: false
  };
}
// _temp10 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp10(prev) {
  // 返回 `!prev`，作为终端渲染这次计算的结果。
  return !prev;
}
// _temp1 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp1() {}
// _temp0 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp0(s_8) {
  // 返回 `s_8.verbose`，作为终端渲染这次计算的结果。
  return s_8.verbose;
}
// _temp9 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp9(s_7) {
  // 返回 `s_7.replBridgeSessionId`，作为终端渲染这次计算的结果。
  return s_7.replBridgeSessionId;
}
// _temp8 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp8(s_6) {
  // 返回 `s_6.replBridgeEnvironmentId`，作为终端渲染这次计算的结果。
  return s_6.replBridgeEnvironmentId;
}
// _temp7 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp7(s_5) {
  // 返回 `s_5.replBridgeExplicit`，作为终端渲染这次计算的结果。
  return s_5.replBridgeExplicit;
}
// _temp6 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(s_4) {
  // 返回 `s_4.replBridgeError`，作为终端渲染这次计算的结果。
  return s_4.replBridgeError;
}
// _temp5 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(s_3) {
  // 返回 `s_3.replBridgeSessionUrl`，作为终端渲染这次计算的结果。
  return s_3.replBridgeSessionUrl;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(s_2) {
  // 返回 `s_2.replBridgeConnectUrl`，作为终端渲染这次计算的结果。
  return s_2.replBridgeConnectUrl;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(s_1) {
  // 返回 `s_1.replBridgeReconnecting`，作为终端渲染这次计算的结果。
  return s_1.replBridgeReconnecting;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回 `s_0.replBridgeSessionActive`，作为终端渲染这次计算的结果。
  return s_0.replBridgeSessionActive;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.replBridgeConnected`，作为终端渲染这次计算的结果。
  return s.replBridgeConnected;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJiYXNlbmFtZSIsInRvU3RyaW5nIiwicXJUb1N0cmluZyIsIlJlYWN0IiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJnZXRPcmlnaW5hbEN3ZCIsImJ1aWxkQWN0aXZlRm9vdGVyVGV4dCIsImJ1aWxkSWRsZUZvb3RlclRleHQiLCJGQUlMRURfRk9PVEVSX1RFWFQiLCJnZXRCcmlkZ2VTdGF0dXMiLCJCUklER0VfRkFJTEVEX0lORElDQVRPUiIsIkJSSURHRV9SRUFEWV9JTkRJQ0FUT1IiLCJ1c2VSZWdpc3Rlck92ZXJsYXkiLCJCb3giLCJUZXh0IiwidXNlSW5wdXQiLCJ1c2VLZXliaW5kaW5ncyIsInVzZUFwcFN0YXRlIiwidXNlU2V0QXBwU3RhdGUiLCJzYXZlR2xvYmFsQ29uZmlnIiwiZ2V0QnJhbmNoIiwiRGlhbG9nIiwiUHJvcHMiLCJvbkRvbmUiLCJCcmlkZ2VEaWFsb2ciLCJ0MCIsIiQiLCJfYyIsImNvbm5lY3RlZCIsIl90ZW1wIiwic2Vzc2lvbkFjdGl2ZSIsIl90ZW1wMiIsInJlY29ubmVjdGluZyIsIl90ZW1wMyIsImNvbm5lY3RVcmwiLCJfdGVtcDQiLCJzZXNzaW9uVXJsIiwiX3RlbXA1IiwiZXJyb3IiLCJfdGVtcDYiLCJleHBsaWNpdCIsIl90ZW1wNyIsImVudmlyb25tZW50SWQiLCJfdGVtcDgiLCJzZXNzaW9uSWQiLCJfdGVtcDkiLCJ2ZXJib3NlIiwiX3RlbXAwIiwic2V0QXBwU3RhdGUiLCJzaG93UVIiLCJzZXRTaG93UVIiLCJxclRleHQiLCJzZXRRclRleHQiLCJicmFuY2hOYW1lIiwic2V0QnJhbmNoTmFtZSIsInQxIiwiU3ltYm9sIiwiZm9yIiwicmVwb05hbWUiLCJ0MiIsInQzIiwidGhlbiIsImNhdGNoIiwiX3RlbXAxIiwiZGlzcGxheVVybCIsInQ0IiwidDUiLCJ0eXBlIiwiZXJyb3JDb3JyZWN0aW9uTGV2ZWwiLCJzbWFsbCIsInQ2IiwiX3RlbXAxMCIsInQ3IiwidDgiLCJjb250ZXh0IiwidDkiLCJpbnB1dCIsIl90ZW1wMTEiLCJfdGVtcDEyIiwidDEwIiwibGFiZWwiLCJzdGF0dXNMYWJlbCIsImNvbG9yIiwic3RhdHVzQ29sb3IiLCJpbmRpY2F0b3IiLCJUMCIsIlQxIiwiZm9vdGVyVGV4dCIsInQxMSIsInQxMiIsInQxMyIsInQxNCIsInQxNSIsInQxNiIsInQxNyIsInFyTGluZXMiLCJzcGxpdCIsImZpbHRlciIsIl90ZW1wMTMiLCJjb250ZXh0UGFydHMiLCJwdXNoIiwiY29udGV4dFN1ZmZpeCIsImxlbmd0aCIsImpvaW4iLCJ0MTgiLCJ1bmRlZmluZWQiLCJ0MTkiLCJ0MjAiLCJ0MjEiLCJ0MjIiLCJ0MjMiLCJ0MjQiLCJtYXAiLCJfdGVtcDE0IiwibGluZSIsImkiLCJsIiwicHJldl8wIiwicHJldiIsInJlcGxCcmlkZ2VFbmFibGVkIiwiY3VycmVudCIsInJlbW90ZUNvbnRyb2xBdFN0YXJ0dXAiLCJzXzgiLCJzIiwic183IiwicmVwbEJyaWRnZVNlc3Npb25JZCIsInNfNiIsInJlcGxCcmlkZ2VFbnZpcm9ubWVudElkIiwic181IiwicmVwbEJyaWRnZUV4cGxpY2l0Iiwic180IiwicmVwbEJyaWRnZUVycm9yIiwic18zIiwicmVwbEJyaWRnZVNlc3Npb25VcmwiLCJzXzIiLCJyZXBsQnJpZGdlQ29ubmVjdFVybCIsInNfMSIsInJlcGxCcmlkZ2VSZWNvbm5lY3RpbmciLCJzXzAiLCJyZXBsQnJpZGdlU2Vzc2lvbkFjdGl2ZSIsInJlcGxCcmlkZ2VDb25uZWN0ZWQiXSwic291cmNlcyI6WyJCcmlkZ2VEaWFsb2cudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJhc2VuYW1lIH0gZnJvbSAncGF0aCdcbmltcG9ydCB7IHRvU3RyaW5nIGFzIHFyVG9TdHJpbmcgfSBmcm9tICdxcmNvZGUnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGdldE9yaWdpbmFsQ3dkIH0gZnJvbSAnLi4vYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHtcbiAgYnVpbGRBY3RpdmVGb290ZXJUZXh0LFxuICBidWlsZElkbGVGb290ZXJUZXh0LFxuICBGQUlMRURfRk9PVEVSX1RFWFQsXG4gIGdldEJyaWRnZVN0YXR1cyxcbn0gZnJvbSAnLi4vYnJpZGdlL2JyaWRnZVN0YXR1c1V0aWwuanMnXG5pbXBvcnQge1xuICBCUklER0VfRkFJTEVEX0lORElDQVRPUixcbiAgQlJJREdFX1JFQURZX0lORElDQVRPUixcbn0gZnJvbSAnLi4vY29uc3RhbnRzL2ZpZ3VyZXMuanMnXG5pbXBvcnQgeyB1c2VSZWdpc3Rlck92ZXJsYXkgfSBmcm9tICcuLi9jb250ZXh0L292ZXJsYXlDb250ZXh0LmpzJ1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGN1c3RvbS1ydWxlcy9wcmVmZXItdXNlLWtleWJpbmRpbmdzIC0tIHJhdyAnZCcga2V5IGZvciBkaXNjb25uZWN0LCBub3QgYSBjb25maWd1cmFibGUga2V5YmluZGluZyBhY3Rpb25cbmltcG9ydCB7IEJveCwgVGV4dCwgdXNlSW5wdXQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5ncyB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSwgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IHNhdmVHbG9iYWxDb25maWcgfSBmcm9tICcuLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgeyBnZXRCcmFuY2ggfSBmcm9tICcuLi91dGlscy9naXQuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBvbkRvbmU6ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEJyaWRnZURpYWxvZyh7IG9uRG9uZSB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHVzZVJlZ2lzdGVyT3ZlcmxheSgnYnJpZGdlLWRpYWxvZycpXG5cbiAgY29uc3QgY29ubmVjdGVkID0gdXNlQXBwU3RhdGUocyA9PiBzLnJlcGxCcmlkZ2VDb25uZWN0ZWQpXG4gIGNvbnN0IHNlc3Npb25BY3RpdmUgPSB1c2VBcHBTdGF0ZShzID0+IHMucmVwbEJyaWRnZVNlc3Npb25BY3RpdmUpXG4gIGNvbnN0IHJlY29ubmVjdGluZyA9IHVzZUFwcFN0YXRlKHMgPT4gcy5yZXBsQnJpZGdlUmVjb25uZWN0aW5nKVxuICBjb25zdCBjb25uZWN0VXJsID0gdXNlQXBwU3RhdGUocyA9PiBzLnJlcGxCcmlkZ2VDb25uZWN0VXJsKVxuICBjb25zdCBzZXNzaW9uVXJsID0gdXNlQXBwU3RhdGUocyA9PiBzLnJlcGxCcmlkZ2VTZXNzaW9uVXJsKVxuICBjb25zdCBlcnJvciA9IHVzZUFwcFN0YXRlKHMgPT4gcy5yZXBsQnJpZGdlRXJyb3IpXG4gIGNvbnN0IGV4cGxpY2l0ID0gdXNlQXBwU3RhdGUocyA9PiBzLnJlcGxCcmlkZ2VFeHBsaWNpdClcbiAgY29uc3QgZW52aXJvbm1lbnRJZCA9IHVzZUFwcFN0YXRlKHMgPT4gcy5yZXBsQnJpZGdlRW52aXJvbm1lbnRJZClcbiAgY29uc3Qgc2Vzc2lvbklkID0gdXNlQXBwU3RhdGUocyA9PiBzLnJlcGxCcmlkZ2VTZXNzaW9uSWQpXG4gIGNvbnN0IHZlcmJvc2UgPSB1c2VBcHBTdGF0ZShzID0+IHMudmVyYm9zZSlcbiAgY29uc3Qgc2V0QXBwU3RhdGUgPSB1c2VTZXRBcHBTdGF0ZSgpXG5cbiAgY29uc3QgW3Nob3dRUiwgc2V0U2hvd1FSXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbcXJUZXh0LCBzZXRRclRleHRdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFticmFuY2hOYW1lLCBzZXRCcmFuY2hOYW1lXSA9IHVzZVN0YXRlKCcnKVxuXG4gIGNvbnN0IHJlcG9OYW1lID0gYmFzZW5hbWUoZ2V0T3JpZ2luYWxDd2QoKSlcblxuICAvLyBGZXRjaCBicmFuY2ggbmFtZSBvbiBtb3VudFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGdldEJyYW5jaCgpXG4gICAgICAudGhlbihzZXRCcmFuY2hOYW1lKVxuICAgICAgLmNhdGNoKCgpID0+IHt9KVxuICB9LCBbXSlcblxuICAvLyBUaGUgVVJMIHRvIGRpc3BsYXkvUVI6IHNlc3Npb24gVVJMIHdoZW4gY29ubmVjdGVkLCBjb25uZWN0IFVSTCB3aGVuIHJlYWR5XG4gIGNvbnN0IGRpc3BsYXlVcmwgPSBzZXNzaW9uQWN0aXZlID8gc2Vzc2lvblVybCA6IGNvbm5lY3RVcmxcblxuICAvLyBHZW5lcmF0ZSBRUiBjb2RlIHdoZW4gVVJMIGNoYW5nZXMgb3IgUVIgaXMgdG9nZ2xlZCBvblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghc2hvd1FSIHx8ICFkaXNwbGF5VXJsKSB7XG4gICAgICBzZXRRclRleHQoJycpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgcXJUb1N0cmluZyhkaXNwbGF5VXJsLCB7XG4gICAgICB0eXBlOiAndXRmOCcsXG4gICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbDogJ0wnLFxuICAgICAgc21hbGw6IHRydWUsXG4gICAgfSlcbiAgICAgIC50aGVuKHNldFFyVGV4dClcbiAgICAgIC5jYXRjaCgoKSA9PiBzZXRRclRleHQoJycpKVxuICB9LCBbc2hvd1FSLCBkaXNwbGF5VXJsXSlcblxuICB1c2VLZXliaW5kaW5ncyhcbiAgICB7XG4gICAgICAnY29uZmlybTp5ZXMnOiBvbkRvbmUsXG4gICAgICAnY29uZmlybTp0b2dnbGUnOiAoKSA9PiB7XG4gICAgICAgIHNldFNob3dRUihwcmV2ID0+ICFwcmV2KVxuICAgICAgfSxcbiAgICB9LFxuICAgIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSxcbiAgKVxuXG4gIHVzZUlucHV0KGlucHV0ID0+IHtcbiAgICBpZiAoaW5wdXQgPT09ICdkJykge1xuICAgICAgLy8gUGVyc2lzdCBvcHQtb3V0IG9ubHkgZm9yIENMSS1mbGFnL2NvbW1hbmQtYWN0aXZhdGVkIGJyaWRnZS5cbiAgICAgIC8vIENvbmZpZy1kcml2ZW4gYW5kIEdCLWF1dG8tY29ubmVjdCB1c2VycyBnZXQgc2Vzc2lvbi1vbmx5IGRpc2Nvbm5lY3RcbiAgICAgIC8vIOKAlCB3cml0aW5nIGZhbHNlIHdvdWxkIHNpbGVudGx5IHVuZG8gYSBTZXR0aW5ncyBjaG9pY2Ugb3Igb3B0IGFcbiAgICAgIC8vIEdCLXJvbGxvdXQgdXNlciBvdXQgcGVybWFuZW50bHkuXG4gICAgICBpZiAoZXhwbGljaXQpIHtcbiAgICAgICAgc2F2ZUdsb2JhbENvbmZpZyhjdXJyZW50ID0+IHtcbiAgICAgICAgICBpZiAoY3VycmVudC5yZW1vdGVDb250cm9sQXRTdGFydHVwID09PSBmYWxzZSkgcmV0dXJuIGN1cnJlbnRcbiAgICAgICAgICByZXR1cm4geyAuLi5jdXJyZW50LCByZW1vdGVDb250cm9sQXRTdGFydHVwOiBmYWxzZSB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBzZXRBcHBTdGF0ZShwcmV2ID0+IHtcbiAgICAgICAgaWYgKCFwcmV2LnJlcGxCcmlkZ2VFbmFibGVkKSByZXR1cm4gcHJldlxuICAgICAgICByZXR1cm4geyAuLi5wcmV2LCByZXBsQnJpZGdlRW5hYmxlZDogZmFsc2UgfVxuICAgICAgfSlcbiAgICAgIG9uRG9uZSgpXG4gICAgfVxuICB9KVxuXG4gIGNvbnN0IHsgbGFiZWw6IHN0YXR1c0xhYmVsLCBjb2xvcjogc3RhdHVzQ29sb3IgfSA9IGdldEJyaWRnZVN0YXR1cyh7XG4gICAgZXJyb3IsXG4gICAgY29ubmVjdGVkLFxuICAgIHNlc3Npb25BY3RpdmUsXG4gICAgcmVjb25uZWN0aW5nLFxuICB9KVxuICBjb25zdCBpbmRpY2F0b3IgPSBlcnJvciA/IEJSSURHRV9GQUlMRURfSU5ESUNBVE9SIDogQlJJREdFX1JFQURZX0lORElDQVRPUlxuICBjb25zdCBxckxpbmVzID0gcXJUZXh0ID8gcXJUZXh0LnNwbGl0KCdcXG4nKS5maWx0ZXIobCA9PiBsLmxlbmd0aCA+IDApIDogW11cblxuICAvLyBCdWlsZCBzdWZmaXggd2l0aCByZXBvIGFuZCBicmFuY2ggKG1hdGNoZXMgc3RhbmRhbG9uZSBicmlkZ2UgZm9ybWF0KVxuICBjb25zdCBjb250ZXh0UGFydHM6IHN0cmluZ1tdID0gW11cbiAgaWYgKHJlcG9OYW1lKSBjb250ZXh0UGFydHMucHVzaChyZXBvTmFtZSlcbiAgaWYgKGJyYW5jaE5hbWUpIGNvbnRleHRQYXJ0cy5wdXNoKGJyYW5jaE5hbWUpXG4gIGNvbnN0IGNvbnRleHRTdWZmaXggPVxuICAgIGNvbnRleHRQYXJ0cy5sZW5ndGggPiAwID8gJyBcXHUwMGI3ICcgKyBjb250ZXh0UGFydHMuam9pbignIFxcdTAwYjcgJykgOiAnJ1xuXG4gIC8vIEZvb3RlciB0ZXh0IG1hdGNoZXMgc3RhbmRhbG9uZSBicmlkZ2VcbiAgY29uc3QgZm9vdGVyVGV4dCA9IGVycm9yXG4gICAgPyBGQUlMRURfRk9PVEVSX1RFWFRcbiAgICA6IGRpc3BsYXlVcmxcbiAgICAgID8gc2Vzc2lvbkFjdGl2ZVxuICAgICAgICA/IGJ1aWxkQWN0aXZlRm9vdGVyVGV4dChkaXNwbGF5VXJsKVxuICAgICAgICA6IGJ1aWxkSWRsZUZvb3RlclRleHQoZGlzcGxheVVybClcbiAgICAgIDogdW5kZWZpbmVkXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nIHRpdGxlPVwiUmVtb3RlIENvbnRyb2xcIiBvbkNhbmNlbD17b25Eb25lfSBoaWRlSW5wdXRHdWlkZT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9e3N0YXR1c0NvbG9yfT5cbiAgICAgICAgICAgICAge2luZGljYXRvcn0ge3N0YXR1c0xhYmVsfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e2NvbnRleHRTdWZmaXh9PC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICB7ZXJyb3IgJiYgPFRleHQgY29sb3I9XCJlcnJvclwiPntlcnJvcn08L1RleHQ+fVxuICAgICAgICAgIHt2ZXJib3NlICYmIGVudmlyb25tZW50SWQgJiYgKFxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+RW52aXJvbm1lbnQ6IHtlbnZpcm9ubWVudElkfTwvVGV4dD5cbiAgICAgICAgICApfVxuICAgICAgICAgIHt2ZXJib3NlICYmIHNlc3Npb25JZCAmJiA8VGV4dCBkaW1Db2xvcj5TZXNzaW9uOiB7c2Vzc2lvbklkfTwvVGV4dD59XG4gICAgICAgIDwvQm94PlxuICAgICAgICB7c2hvd1FSICYmIHFyTGluZXMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICB7cXJMaW5lcy5tYXAoKGxpbmUsIGkpID0+IChcbiAgICAgICAgICAgICAgPFRleHQga2V5PXtpfT57bGluZX08L1RleHQ+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgICAge2Zvb3RlclRleHQgJiYgPFRleHQgZGltQ29sb3I+e2Zvb3RlclRleHR9PC9UZXh0Pn1cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgZCB0byBkaXNjb25uZWN0IMK3IHNwYWNlIGZvciBRUiBjb2RlIMK3IEVudGVyL0VzYyB0byBjbG9zZVxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsUUFBUSxRQUFRLE1BQU07QUFDL0IsU0FBU0MsUUFBUSxJQUFJQyxVQUFVLFFBQVEsUUFBUTtBQUMvQyxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9B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
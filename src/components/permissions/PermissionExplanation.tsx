// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、Suspense、use、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { Suspense, use, useState } from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { Message } from '../../types/message.js';
// 复用 generatePermissionExplanation、isPermissionExplainerEnabled、PermissionExplanation as PermissionExplanationType、RiskLevel 工具函数，把通用处理留在 ../../utils/permissions/permissionExplainer.js 中维护。
import { generatePermissionExplanation, isPermissionExplainerEnabled, type PermissionExplanation as PermissionExplanationType, type RiskLevel } from '../../utils/permissions/permissionExplainer.js';
// 引入 ShimmerChar，将 ../Spinner/ShimmerChar.js 中已经封装好的能力接到本文件流程里。
import { ShimmerChar } from '../Spinner/ShimmerChar.js';
// 引入 useShimmerAnimation，将 ../Spinner/useShimmerAnimation.js 中已经封装好的能力接到本文件流程里。
import { useShimmerAnimation } from '../Spinner/useShimmerAnimation.js';
// LOADING_MESSAGE 消息数据 命名 `'Loading explanation…'`，让后续代码直接表达这个值的用途。
const LOADING_MESSAGE = 'Loading explanation…';
// ShimmerLoadingText 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ShimmerLoadingText() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 从 `useShimmerAnimation("responding", LOADING_MESSAGE, fals...` 按位置拆出 ref、glimmerIndex，让权限确认界面 Permission Explanation分别处理这些返回值。
  const [ref, glimmerIndex] = useShimmerAnimation("responding", LOADING_MESSAGE, false);
  // t0 暂存 `LOADING_MESSAGE.split("").map((char, index) => <ShimmerCh...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== glimmerIndex) {
    // t0 暂存 `LOADING_MESSAGE.split("").map((char, index) => <ShimmerCh...` 生成的渲染片段，后续返回路径直接复用。
    t0 = LOADING_MESSAGE.split("").map((char, index) => <ShimmerChar key={index} char={char} index={index} glimmerIndex={glimmerIndex} messageColor="inactive" shimmerColor="text" />);
    // $[0] 缓存 `glimmerIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = glimmerIndex;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // t1 暂存 `<Text>{t0}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t0) {
    // t1 暂存 `<Text>{t0}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text>{t0}</Text>;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // t2 暂存 `<Box ref={ref}>{t1}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== ref || $[5] !== t1) {
    // t2 暂存 `<Box ref={ref}>{t1}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box ref={ref}>{t1}</Box>;
    // $[4] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = ref;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
// getRiskColor 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRiskColor(riskLevel: RiskLevel): 'success' | 'warning' | 'error' {
  // 按照 riskLevel 的取值选择终端渲染的具体处理分支。
  switch (riskLevel) {
    case 'LOW':
      // 返回 `'success'`，作为终端渲染这次计算的结果。
      return 'success';
    case 'MEDIUM':
      // 返回 `'warning'`，作为终端渲染这次计算的结果。
      return 'warning';
    case 'HIGH':
      // 返回 `'error'`，作为终端渲染这次计算的结果。
      return 'error';
  }
}
// getRiskLabel 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRiskLabel(riskLevel: RiskLevel): string {
  // 按照 riskLevel 的取值选择终端渲染的具体处理分支。
  switch (riskLevel) {
    case 'LOW':
      // 返回 `'Low risk'`，作为终端渲染这次计算的结果。
      return 'Low risk';
    case 'MEDIUM':
      // 返回 `'Med risk'`，作为终端渲染这次计算的结果。
      return 'Med risk';
    case 'HIGH':
      // 返回 `'High risk'`，作为终端渲染这次计算的结果。
      return 'High risk';
  }
}
// PermissionExplanationProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionExplanationProps = {
  toolName: string;
  toolInput: unknown;
  toolDescription?: string;
  messages?: Message[];
};
// ExplainerState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ExplainerState = {
  visible: boolean;
  enabled: boolean;
  promise: Promise<PermissionExplanationType | null> | null;
};

/**
 * Creates an explanation promise that never rejects.
 * Errors are caught and returned as null.
 */
// createExplanationPromise 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createExplanationPromise(props: PermissionExplanationProps): Promise<PermissionExplanationType | null> {
  // 返回 `generatePermissionExplanation({`，作为终端渲染这次计算的结果。
  return generatePermissionExplanation({
    toolName: props.toolName,
    toolInput: props.toolInput,
    toolDescription: props.toolDescription,
    messages: props.messages,
    signal: new AbortController().signal // Won't abort - request is fast enough
  // 这个回调绑定到 }).catch(() => null);，负责终端渲染在该局部场景下的响应。
  }).catch(() => null);
}

/**
 * Hook that manages the permission explainer state.
 * Creates the fetch promise lazily (only when user hits Ctrl+E)
 * to avoid consuming tokens for explanations users never view.
 */
// usePermissionExplainerUI 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePermissionExplainerUI(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // t0 暂存 `isPermissionExplainerEnabled()` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `isPermissionExplainerEnabled()` 生成的渲染片段，后续返回路径直接复用。
    t0 = isPermissionExplainerEnabled();
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // enabled 命名 `t0`，让后续代码直接表达这个值的用途。
  const enabled = t0;
  // visible 由 React state 持有，setVisible 会在用户操作或异步结果返回时触发刷新。
  const [visible, setVisible] = useState(false);
  // promise 异步任务 由 React state 持有，setPromise 会在用户操作或异步结果返回时触发刷新。
  const [promise, setPromise] = useState(null);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== promise || $[2] !== props || $[3] !== visible) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // visible缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!visible) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_permission_explainer_shortcut_used", {});
        // promise 异步任务缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!promise) {
          // setPromise 写入新的状态值，使终端渲染后续读取保持一致。
          setPromise(createExplanationPromise(props));
        }
      }
      // setVisible 写入新的状态值，使终端渲染后续读取保持一致。
      setVisible(_temp);
    };
    // $[1] 缓存 `promise`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = promise;
    // $[2] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = props;
    // $[3] 缓存 `visible`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = visible;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      context: "Confirmation",
      isActive: enabled
    };
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:toggleExplanation", t1, t2);
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== promise || $[7] !== visible) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      visible,
      enabled,
      promise
    };
    // $[6] 缓存 `promise`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = promise;
    // $[7] 缓存 `visible`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = visible;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}

/**
 * Inner component that uses React 19's use() to read the promise.
 * Suspends while loading, returns null on error.
 */
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(v) {
  // 返回 `!v`，作为终端渲染这次计算的结果。
  return !v;
}
// ExplanationResult 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ExplanationResult(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(21);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    promise
  } = t0;
  // explanation保存`use`，供终端渲染后续处理使用。
  const explanation = use(promise);
  // explanation缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!explanation) {
    // t1 暂存 `<Box marginTop={1}><Text dimColor={true}>Explanation unav...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Box marginTop={1}><Text dimColor={true}>Explanation unav...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Box marginTop={1}><Text dimColor={true}>Explanation unavailable</Text></Box>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `<Text>{explanation.explanation}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== explanation.explanation) {
    // t1 暂存 `<Text>{explanation.explanation}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text>{explanation.explanation}</Text>;
    // $[1] 缓存 `explanation.explanation`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = explanation.explanation;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `<Box marginTop={1}><Text>{explanation.reasoning}</Text></...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== explanation.reasoning) {
    // t2 暂存 `<Box marginTop={1}><Text>{explanation.reasoning}</Text></...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box marginTop={1}><Text>{explanation.reasoning}</Text></Box>;
    // $[3] 缓存 `explanation.reasoning`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = explanation.reasoning;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `getRiskColor(explanation.riskLevel)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== explanation.riskLevel) {
    // t3 暂存 `getRiskColor(explanation.riskLevel)` 生成的渲染片段，后续返回路径直接复用。
    t3 = getRiskColor(explanation.riskLevel);
    // $[5] 缓存 `explanation.riskLevel`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = explanation.riskLevel;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `getRiskLabel(explanation.riskLevel)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== explanation.riskLevel) {
    // t4 暂存 `getRiskLabel(explanation.riskLevel)` 生成的渲染片段，后续返回路径直接复用。
    t4 = getRiskLabel(explanation.riskLevel);
    // $[7] 缓存 `explanation.riskLevel`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = explanation.riskLevel;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // t5 暂存 `<Text color={t3}>{t4}:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== t3 || $[10] !== t4) {
    // t5 暂存 `<Text color={t3}>{t4}:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color={t3}>{t4}:</Text>;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // t6 暂存 `<Text> {explanation.risk}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== explanation.risk) {
    // t6 暂存 `<Text> {explanation.risk}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text> {explanation.risk}</Text>;
    // $[12] 缓存 `explanation.risk`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = explanation.risk;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // t7 暂存 `<Box marginTop={1}><Text>{t5}{t6}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t5 || $[15] !== t6) {
    // t7 暂存 `<Box marginTop={1}><Text>{t5}{t6}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginTop={1}><Text>{t5}{t6}</Text></Box>;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // t8 暂存 `<Box flexDirection="column" marginTop={1}>{t1}{t2}{t7}</B...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== t1 || $[18] !== t2 || $[19] !== t7) {
    // t8 暂存 `<Box flexDirection="column" marginTop={1}>{t1}{t2}{t7}</B...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" marginTop={1}>{t1}{t2}{t7}</Box>;
    // $[17] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t1;
    // $[18] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t2;
    // $[19] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t7;
    // $[20] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[20];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}

/**
 * Content component - shows loading (via Suspense) or explanation when visible
 */
// PermissionExplainerContent 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionExplainerContent(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    visible,
    promise
  } = t0;
  // 只有 `!visible || !promise` 满足时，终端渲染才执行该分支。
  if (!visible || !promise) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `<Box marginTop={1}><ShimmerLoadingText /></Box>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Box marginTop={1}><ShimmerLoadingText /></Box>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box marginTop={1}><ShimmerLoadingText /></Box>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `<Suspense fallback={t1}><ExplanationResult promise={promi...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== promise) {
    // t2 暂存 `<Suspense fallback={t1}><ExplanationResult promise={promi...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Suspense fallback={t1}><ExplanationResult promise={promise} /></Suspense>;
    // $[1] 缓存 `promise`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = promise;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlN1c3BlbnNlIiwidXNlIiwidXNlU3RhdGUiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZyIsImxvZ0V2ZW50IiwiTWVzc2FnZSIsImdlbmVyYXRlUGVybWlzc2lvbkV4cGxhbmF0aW9uIiwiaXNQZXJtaXNzaW9uRXhwbGFpbmVyRW5hYmxlZCIsIlBlcm1pc3Npb25FeHBsYW5hdGlvbiIsIlBlcm1pc3Npb25FeHBsYW5hdGlvblR5cGUiLCJSaXNrTGV2ZWwiLCJTaGltbWVyQ2hhciIsInVzZVNoaW1tZXJBbmltYXRpb24iLCJMT0FESU5HX01FU1NBR0UiLCJTaGltbWVyTG9hZGluZ1RleHQiLCIkIiwiX2MiLCJyZWYiLCJnbGltbWVySW5kZXgiLCJ0MCIsInNwbGl0IiwibWFwIiwiY2hhciIsImluZGV4IiwidDEiLCJ0MiIsImdldFJpc2tDb2xvciIsInJpc2tMZXZlbCIsImdldFJpc2tMYWJlbCIsIlBlcm1pc3Npb25FeHBsYW5hdGlvblByb3BzIiwidG9vbE5hbWUiLCJ0b29sSW5wdXQiLCJ0b29sRGVzY3JpcHRpb24iLCJtZXNzYWdlcyIsIkV4cGxhaW5lclN0YXRlIiwidmlzaWJsZSIsImVuYWJsZWQiLCJwcm9taXNlIiwiUHJvbWlzZSIsImNyZWF0ZUV4cGxhbmF0aW9uUHJvbWlzZSIsInByb3BzIiwic2lnbmFsIiwiQWJvcnRDb250cm9sbGVyIiwiY2F0Y2giLCJ1c2VQZXJtaXNzaW9uRXhwbGFpbmVyVUkiLCJTeW1ib2wiLCJmb3IiLCJzZXRWaXNpYmxlIiwic2V0UHJvbWlzZSIsIl90ZW1wIiwiY29udGV4dCIsImlzQWN0aXZlIiwidDMiLCJ2IiwiRXhwbGFuYXRpb25SZXN1bHQiLCJleHBsYW5hdGlvbiIsInJlYXNvbmluZyIsInQ0IiwidDUiLCJ0NiIsInJpc2siLCJ0NyIsInQ4IiwiUGVybWlzc2lvbkV4cGxhaW5lckNvbnRlbnQiXSwic291cmNlcyI6WyJQZXJtaXNzaW9uRXhwbGFuYXRpb24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyBTdXNwZW5zZSwgdXNlLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyBsb2dFdmVudCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB0eXBlIHsgTWVzc2FnZSB9IGZyb20gJy4uLy4uL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQge1xuICBnZW5lcmF0ZVBlcm1pc3Npb25FeHBsYW5hdGlvbixcbiAgaXNQZXJtaXNzaW9uRXhwbGFpbmVyRW5hYmxlZCxcbiAgdHlwZSBQZXJtaXNzaW9uRXhwbGFuYXRpb24gYXMgUGVybWlzc2lvbkV4cGxhbmF0aW9uVHlwZSxcbiAgdHlwZSBSaXNrTGV2ZWwsXG59IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL3Blcm1pc3Npb25FeHBsYWluZXIuanMnXG5pbXBvcnQgeyBTaGltbWVyQ2hhciB9IGZyb20gJy4uL1NwaW5uZXIvU2hpbW1lckNoYXIuanMnXG5pbXBvcnQgeyB1c2VTaGltbWVyQW5pbWF0aW9uIH0gZnJvbSAnLi4vU3Bpbm5lci91c2VTaGltbWVyQW5pbWF0aW9uLmpzJ1xuXG5jb25zdCBMT0FESU5HX01FU1NBR0UgPSAnTG9hZGluZyBleHBsYW5hdGlvbuKApidcblxuZnVuY3Rpb24gU2hpbW1lckxvYWRpbmdUZXh0KCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtyZWYsIGdsaW1tZXJJbmRleF0gPSB1c2VTaGltbWVyQW5pbWF0aW9uKFxuICAgICdyZXNwb25kaW5nJyxcbiAgICBMT0FESU5HX01FU1NBR0UsXG4gICAgZmFsc2UsXG4gIClcblxuICByZXR1cm4gKFxuICAgIDxCb3ggcmVmPXtyZWZ9PlxuICAgICAgPFRleHQ+XG4gICAgICAgIHtMT0FESU5HX01FU1NBR0Uuc3BsaXQoJycpLm1hcCgoY2hhciwgaW5kZXgpID0+IChcbiAgICAgICAgICA8U2hpbW1lckNoYXJcbiAgICAgICAgICAgIGtleT17aW5kZXh9XG4gICAgICAgICAgICBjaGFyPXtjaGFyfVxuICAgICAgICAgICAgaW5kZXg9e2luZGV4fVxuICAgICAgICAgICAgZ2xpbW1lckluZGV4PXtnbGltbWVySW5kZXh9XG4gICAgICAgICAgICBtZXNzYWdlQ29sb3I9XCJpbmFjdGl2ZVwiXG4gICAgICAgICAgICBzaGltbWVyQ29sb3I9XCJ0ZXh0XCJcbiAgICAgICAgICAvPlxuICAgICAgICApKX1cbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuXG5mdW5jdGlvbiBnZXRSaXNrQ29sb3Iocmlza0xldmVsOiBSaXNrTGV2ZWwpOiAnc3VjY2VzcycgfCAnd2FybmluZycgfCAnZXJyb3InIHtcbiAgc3dpdGNoIChyaXNrTGV2ZWwpIHtcbiAgICBjYXNlICdMT1cnOlxuICAgICAgcmV0dXJuICdzdWNjZXNzJ1xuICAgIGNhc2UgJ01FRElVTSc6XG4gICAgICByZXR1cm4gJ3dhcm5pbmcnXG4gICAgY2FzZSAnSElHSCc6XG4gICAgICByZXR1cm4gJ2Vycm9yJ1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFJpc2tMYWJlbChyaXNrTGV2ZWw6IFJpc2tMZXZlbCk6IHN0cmluZyB7XG4gIHN3aXRjaCAocmlza0xldmVsKSB7XG4gICAgY2FzZSAnTE9XJzpcbiAgICAgIHJldHVybiAnTG93IHJpc2snXG4gICAgY2FzZSAnTUVESVVNJzpcbiAgICAgIHJldHVybiAnTWVkIHJpc2snXG4gICAgY2FzZSAnSElHSCc6XG4gICAgICByZXR1cm4gJ0hpZ2ggcmlzaydcbiAgfVxufVxuXG50eXBlIFBlcm1pc3Npb25FeHBsYW5hdGlvblByb3BzID0ge1xuICB0b29sTmFtZTogc3RyaW5nXG4gIHRvb2xJbnB1dDogdW5rbm93blxuICB0b29sRGVzY3JpcHRpb24/OiBzdHJpbmdcbiAgbWVzc2FnZXM/OiBNZXNzYWdlW11cbn1cblxudHlwZSBFeHBsYWluZXJTdGF0ZSA9IHtcbiAgdmlzaWJsZTogYm9vbGVhblxuICBlbmFibGVkOiBib29sZWFuXG4gIHByb21pc2U6IFByb21pc2U8UGVybWlzc2lvbkV4cGxhbmF0aW9uVHlwZSB8IG51bGw+IHwgbnVsbFxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZXhwbGFuYXRpb24gcHJvbWlzZSB0aGF0IG5ldmVyIHJlamVjdHMuXG4gKiBFcnJvcnMgYXJlIGNhdWdodCBhbmQgcmV0dXJuZWQgYXMgbnVsbC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRXhwbGFuYXRpb25Qcm9taXNlKFxuICBwcm9wczogUGVybWlzc2lvbkV4cGxhbmF0aW9uUHJvcHMsXG4pOiBQcm9taXNlPFBlcm1pc3Npb25FeHBsYW5hdGlvblR5cGUgfCBudWxsPiB7XG4gIHJldHVybiBnZW5lcmF0ZVBlcm1pc3Npb25FeHBsYW5hdGlvbih7XG4gICAgdG9vbE5hbWU6IHByb3BzLnRvb2xOYW1lLFxuICAgIHRvb2xJbnB1dDogcHJvcHMudG9vbElucHV0LFxuICAgIHRvb2xEZXNjcmlwdGlvbjogcHJvcHMudG9vbERlc2NyaXB0aW9uLFxuICAgIG1lc3NhZ2VzOiBwcm9wcy5tZXNzYWdlcyxcbiAgICBzaWduYWw6IG5ldyBBYm9ydENvbnRyb2xsZXIoKS5zaWduYWwsIC8vIFdvbid0IGFib3J0IC0gcmVxdWVzdCBpcyBmYXN0IGVub3VnaFxuICB9KS5jYXRjaCgoKSA9PiBudWxsKVxufVxuXG4vKipcbiAqIEhvb2sgdGhhdCBtYW5hZ2VzIHRoZSBwZXJtaXNzaW9uIGV4cGxhaW5lciBzdGF0ZS5cbiAqIENyZWF0ZXMgdGhlIGZldGNoIHByb21pc2UgbGF6aWx5IChvbmx5IHdoZW4gdXNlciBoaXRzIEN0cmwrRSlcbiAqIHRvIGF2b2lkIGNvbnN1bWluZyB0b2tlbnMgZm9yIGV4cGxhbmF0aW9ucyB1c2VycyBuZXZlciB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlUGVybWlzc2lvbkV4cGxhaW5lclVJKFxuICBwcm9wczogUGVybWlzc2lvbkV4cGxhbmF0aW9uUHJvcHMsXG4pOiBFeHBsYWluZXJTdGF0ZSB7XG4gIGNvbnN0IGVuYWJsZWQgPSBpc1Blcm1pc3Npb25FeHBsYWluZXJFbmFibGVkKClcbiAgY29uc3QgW3Zpc2libGUsIHNldFZpc2libGVdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtwcm9taXNlLCBzZXRQcm9taXNlXSA9XG4gICAgdXNlU3RhdGU8UHJvbWlzZTxQZXJtaXNzaW9uRXhwbGFuYXRpb25UeXBlIHwgbnVsbD4gfCBudWxsPihudWxsKVxuXG4gIC8vIFVzZSBrZXliaW5kaW5nIGZvciBjdHJsK2UgdG9nZ2xlIChjb25maWd1cmFibGUgdmlhIGtleWJpbmRpbmdzLmpzb24pXG4gIHVzZUtleWJpbmRpbmcoXG4gICAgJ2NvbmZpcm06dG9nZ2xlRXhwbGFuYXRpb24nLFxuICAgICgpID0+IHtcbiAgICAgIGlmICghdmlzaWJsZSkge1xuICAgICAgICBsb2dFdmVudCgndGVuZ3VfcGVybWlzc2lvbl9leHBsYWluZXJfc2hvcnRjdXRfdXNlZCcsIHt9KVxuICAgICAgICAvLyBPbmx5IGNyZWF0ZSB0aGUgcHJvbWlzZSBvbiBmaXJzdCB0b2dnbGUgKGxhenkgbG9hZGluZylcbiAgICAgICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICAgICAgc2V0UHJvbWlzZShjcmVhdGVFeHBsYW5hdGlvblByb21pc2UocHJvcHMpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZXRWaXNpYmxlKHYgPT4gIXYpXG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nLCBpc0FjdGl2ZTogZW5hYmxlZCB9LFxuICApXG5cbiAgcmV0dXJuIHsgdmlzaWJsZSwgZW5hYmxlZCwgcHJvbWlzZSB9XG59XG5cbi8qKlxuICogSW5uZXIgY29tcG9uZW50IHRoYXQgdXNlcyBSZWFjdCAxOSdzIHVzZSgpIHRvIHJlYWQgdGhlIHByb21pc2UuXG4gKiBTdXNwZW5kcyB3aGlsZSBsb2FkaW5nLCByZXR1cm5zIG51bGwgb24gZXJyb3IuXG4gKi9cbmZ1bmN0aW9uIEV4cGxhbmF0aW9uUmVzdWx0KHtcbiAgcHJvbWlzZSxcbn06IHtcbiAgcHJvbWlzZTogUHJvbWlzZTxQZXJtaXNzaW9uRXhwbGFuYXRpb25UeXBlIHwgbnVsbD5cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBleHBsYW5hdGlvbiA9IHVzZShwcm9taXNlKVxuXG4gIGlmICghZXhwbGFuYXRpb24pIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5FeHBsYW5hdGlvbiB1bmF2YWlsYWJsZTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgIDxUZXh0PntleHBsYW5hdGlvbi5leHBsYW5hdGlvbn08L1RleHQ+XG4gICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgIDxUZXh0PntleHBsYW5hdGlvbi5yZWFzb25pbmd9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPXtnZXRSaXNrQ29sb3IoZXhwbGFuYXRpb24ucmlza0xldmVsKX0+XG4gICAgICAgICAgICB7Z2V0Umlza0xhYmVsKGV4cGxhbmF0aW9uLnJpc2tMZXZlbCl9OlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD4ge2V4cGxhbmF0aW9uLnJpc2t9PC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKVxufVxuXG4vKipcbiAqIENvbnRlbnQgY29tcG9uZW50IC0gc2hvd3MgbG9hZGluZyAodmlhIFN1c3BlbnNlKSBvciBleHBsYW5hdGlvbiB3aGVuIHZpc2libGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFBlcm1pc3Npb25FeHBsYWluZXJDb250ZW50KHtcbiAgdmlzaWJsZSxcbiAgcHJvbWlzZSxcbn06IHtcbiAgdmlzaWJsZTogYm9vbGVhblxuICBwcm9taXNlOiBQcm9taXNlPFBlcm1pc3Npb25FeHBsYW5hdGlvblR5cGUgfCBudWxsPiB8IG51bGxcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoIXZpc2libGUgfHwgIXByb21pc2UpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8U3VzcGVuc2VcbiAgICAgIGZhbGxiYWNrPXtcbiAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgIDxTaGltbWVyTG9hZGluZ1RleHQgLz5cbiAgICAgICAgPC9Cb3g+XG4gICAgICB9XG4gICAgPlxuICAgICAgPEV4cGxhbmF0aW9uUmVzdWx0IHByb21pc2U9e3Byb21pc2V9IC8+XG4gICAgPC9TdXNwZW5zZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxRQUFRLEVBQUVDLEdBQUcsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDdEQsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxhQUFhLFFBQVEsb0NBQW9DO0FBQ2xFLFNBQVNDLFFBQVEsUUFBUSxtQ0FBbUM7QUFDNUQsY0FBY0MsT0FBTyxRQUFRLHdCQUF3QjtBQUNyRCxTQUNFQyw2QkFBNkIsRUFDN0JDLDRCQUE0QixFQUM1QixLQUFLQyxxQkFBcUIsSUFBSUMseUJBQXlCLEVBQ3ZELEtBQUtDLFNBQVMsUUFDVCxnREFBZ0Q7QUFDdkQsU0FBU0MsV0FBVyxRQUFRLDJCQUEyQjtBQUN2RCxTQUFTQyxtQkFBbUIsUUFBUSxtQ0FBbUM7QUFFdkUsTUFBTUMsZUFBZSxHQUFHLHNCQUFzQjtBQUU5QyxTQUFBQyxtQkFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUNFLE9BQUFDLEdBQUEsRUFBQUMsWUFBQSxJQUE0Qk4sbUJBQW1CLENBQzdDLFlBQVksRUFDWkMsZUFBZSxFQUNmLEtBQ0YsQ0FBQztFQUFBLElBQUFNLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFHLFlBQUE7SUFLTUMsRUFBQSxHQUFBTixlQUFlLENBQUFPLEtBQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQUMsR0FBSSxDQUFDLENBQUFDLElBQUEsRUFBQUMsS0FBQSxLQUM3QixDQUFDLFdBQVcsQ0FDTEEsR0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDSkQsSUFBSSxDQUFKQSxLQUFHLENBQUMsQ0FDSEMsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDRUwsWUFBWSxDQUFaQSxhQUFXLENBQUMsQ0FDYixZQUFVLENBQVYsVUFBVSxDQUNWLFlBQU0sQ0FBTixNQUFNLEdBRXRCLENBQUM7SUFBQUgsQ0FBQSxNQUFBRyxZQUFBO0lBQUFILENBQUEsTUFBQUksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUosQ0FBQTtFQUFBO0VBQUEsSUFBQVMsRUFBQTtFQUFBLElBQUFULENBQUEsUUFBQUksRUFBQTtJQVZKSyxFQUFBLElBQUMsSUFBSSxDQUNGLENBQUFMLEVBU0EsQ0FDSCxFQVhDLElBQUksQ0FXRTtJQUFBSixDQUFBLE1BQUFJLEVBQUE7SUFBQUosQ0FBQSxNQUFBUyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBVCxDQUFBO0VBQUE7RUFBQSxJQUFBVSxFQUFBO0VBQUEsSUFBQVYsQ0FBQSxRQUFBRSxHQUFBLElBQUFGLENBQUEsUUFBQVMsRUFBQTtJQVpUQyxFQUFBLElBQUMsR0FBRyxDQUFNUixHQUFHLENBQUhBLElBQUUsQ0FBQyxDQUNYLENBQUFPLEVBV00sQ0FDUixFQWJDLEdBQUcsQ0FhRTtJQUFBVCxDQUFBLE1BQUFFLEdBQUE7SUFBQUYsQ0FBQSxNQUFBUyxFQUFBO0lBQUFULENBQUEsTUFBQVUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVYsQ0FBQTtFQUFBO0VBQUEsT0FiTlUsRUFhTTtBQUFBO0FBSVYsU0FBU0MsWUFBWUEsQ0FBQ0MsU0FBUyxFQUFFakIsU0FBUyxDQUFDLEVBQUUsU0FBUyxHQUFHLFNBQVMsR0FBRyxPQUFPLENBQUM7RUFDM0UsUUFBUWlCLFNBQVM7SUFDZixLQUFLLEtBQUs7TUFDUixPQUFPLFNBQVM7SUFDbEIsS0FBSyxRQUFRO01BQ1gsT0FBTyxTQUFTO0lBQ2xCLEtBQUssTUFBTTtNQUNULE9BQU8sT0FBTztFQUNsQjtBQUNGO0FBRUEsU0FBU0MsWUFBWUEsQ0FBQ0QsU0FBUyxFQUFFakIsU0FBUyxDQUFDLEVBQUUsTUFBTSxDQUFDO0VBQ2xELFFBQVFpQixTQUFTO0lBQ2YsS0FBSyxLQUFLO01BQ1IsT0FBTyxVQUFVO0lBQ25CLEtBQUssUUFBUTtNQUNYLE9BQU8sVUFBVTtJQUNuQixLQUFLLE1BQU07TUFDVCxPQUFPLFdBQVc7RUFDdEI7QUFDRjtBQUVBLEtBQUtFLDBCQUEwQixHQUFHO0VBQ2hDQyxRQUFRLEVBQUUsTUFBTTtFQUNoQkMsU0FBUyxFQUFFLE9BQU87RUFDbEJDLGVBQWUsQ0FBQyxFQUFFLE1BQU07RUFDeEJDLFFBQVEsQ0FBQyxFQUFFNUIsT0FBTyxFQUFFO0FBQ3RCLENBQUM7QUFFRCxLQUFLNkIsY0FBYyxHQUFHO0VBQ3BCQyxPQUFPLEVBQUUsT0FBTztFQUNoQkMsT0FBTyxFQUFFLE9BQU87RUFDaEJDLE9BQU8sRUFBRUMsT0FBTyxDQUFDN0IseUJBQXlCLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSTtBQUMzRCxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzhCLHdCQUF3QkEsQ0FDL0JDLEtBQUssRUFBRVgsMEJBQTBCLENBQ2xDLEVBQUVTLE9BQU8sQ0FBQzdCLHlCQUF5QixHQUFHLElBQUksQ0FBQyxDQUFDO0VBQzNDLE9BQU9ILDZCQUE2QixDQUFDO0lBQ25Dd0IsUUFBUSxFQUFFVSxLQUFLLENBQUNWLFFBQVE7SUFDeEJDLFNBQVMsRUFBRVMsS0FBSyxDQUFDVCxTQUFTO0lBQzFCQyxlQUFlLEVBQUVRLEtBQUssQ0FBQ1IsZUFBZTtJQUN0Q0MsUUFBUSxFQUFFTyxLQUFLLENBQUNQLFFBQVE7SUFDeEJRLE1BQU0sRUFBRSxJQUFJQyxlQUFlLENBQUMsQ0FBQyxDQUFDRCxNQUFNLENBQUU7RUFDeEMsQ0FBQyxDQUFDLENBQUNFLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQztBQUN0Qjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyx5QkFBQUosS0FBQTtFQUFBLE1BQUF6QixDQUFBLEdBQUFDLEVBQUE7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBOEIsTUFBQSxDQUFBQyxHQUFBO0lBR1czQixFQUFBLEdBQUFaLDRCQUE0QixDQUFDLENBQUM7SUFBQVEsQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBOUMsTUFBQXFCLE9BQUEsR0FBZ0JqQixFQUE4QjtFQUM5QyxPQUFBZ0IsT0FBQSxFQUFBWSxVQUFBLElBQThCL0MsUUFBUSxDQUFDLEtBQUssQ0FBQztFQUM3QyxPQUFBcUMsT0FBQSxFQUFBVyxVQUFBLElBQ0VoRCxRQUFRLENBQW1ELElBQUksQ0FBQztFQUFBLElBQUF3QixFQUFBO0VBQUEsSUFBQVQsQ0FBQSxRQUFBc0IsT0FBQSxJQUFBdEIsQ0FBQSxRQUFBeUIsS0FBQSxJQUFBekIsQ0FBQSxRQUFBb0IsT0FBQTtJQUtoRVgsRUFBQSxHQUFBQSxDQUFBO01BQ0UsSUFBSSxDQUFDVyxPQUFPO1FBQ1YvQixRQUFRLENBQUMsMENBQTBDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFeEQsSUFBSSxDQUFDaUMsT0FBTztVQUNWVyxVQUFVLENBQUNULHdCQUF3QixDQUFDQyxLQUFLLENBQUMsQ0FBQztRQUFBO01BQzVDO01BRUhPLFVBQVUsQ0FBQ0UsS0FBTyxDQUFDO0lBQUEsQ0FDcEI7SUFBQWxDLENBQUEsTUFBQXNCLE9BQUE7SUFBQXRCLENBQUEsTUFBQXlCLEtBQUE7SUFBQXpCLENBQUEsTUFBQW9CLE9BQUE7SUFBQXBCLENBQUEsTUFBQVMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVQsQ0FBQTtFQUFBO0VBQUEsSUFBQVUsRUFBQTtFQUFBLElBQUFWLENBQUEsUUFBQThCLE1BQUEsQ0FBQUMsR0FBQTtJQUNEckIsRUFBQTtNQUFBeUIsT0FBQSxFQUFXLGNBQWM7TUFBQUMsUUFBQSxFQUFZZjtJQUFRLENBQUM7SUFBQXJCLENBQUEsTUFBQVUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVYsQ0FBQTtFQUFBO0VBWmhEWixhQUFhLENBQ1gsMkJBQTJCLEVBQzNCcUIsRUFTQyxFQUNEQyxFQUNGLENBQUM7RUFBQSxJQUFBMkIsRUFBQTtFQUFBLElBQUFyQyxDQUFBLFFBQUFzQixPQUFBLElBQUF0QixDQUFBLFFBQUFvQixPQUFBO0lBRU1pQixFQUFBO01BQUFqQixPQUFBO01BQUFDLE9BQUE7TUFBQUM7SUFBNEIsQ0FBQztJQUFBdEIsQ0FBQSxNQUFBc0IsT0FBQTtJQUFBdEIsQ0FBQSxNQUFBb0IsT0FBQTtJQUFBcEIsQ0FBQSxNQUFBcUMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXJDLENBQUE7RUFBQTtFQUFBLE9BQTdCcUMsRUFBNkI7QUFBQTs7QUFHdEM7QUFDQTtBQUNBO0FBQ0E7QUE5Qk8sU0FBQUgsTUFBQUksQ0FBQTtFQUFBLE9BbUJlLENBQUNBLENBQUM7QUFBQTtBQVl4QixTQUFBQyxrQkFBQW5DLEVBQUE7RUFBQSxNQUFBSixDQUFBLEdBQUFDLEVBQUE7RUFBMkI7SUFBQXFCO0VBQUEsSUFBQWxCLEVBSTFCO0VBQ0MsTUFBQW9DLFdBQUEsR0FBb0J4RCxHQUFHLENBQUNzQyxPQUFPLENBQUM7RUFFaEMsSUFBSSxDQUFDa0IsV0FBVztJQUFBLElBQUEvQixFQUFBO0lBQUEsSUFBQVQsQ0FBQSxRQUFBOEIsTUFBQSxDQUFBQyxHQUFBO01BRVp0QixFQUFBLElBQUMsR0FBRyxDQUFZLFNBQUMsQ0FBRCxHQUFDLENBQ2YsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLHVCQUF1QixFQUFyQyxJQUFJLENBQ1AsRUFGQyxHQUFHLENBRUU7TUFBQVQsQ0FBQSxNQUFBUyxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBVCxDQUFBO0lBQUE7SUFBQSxPQUZOUyxFQUVNO0VBQUE7RUFFVCxJQUFBQSxFQUFBO0VBQUEsSUFBQVQsQ0FBQSxRQUFBd0MsV0FBQSxDQUFBQSxXQUFBO0lBSUcvQixFQUFBLElBQUMsSUFBSSxDQUFFLENBQUErQixXQUFXLENBQUFBLFdBQVcsQ0FBRSxFQUE5QixJQUFJLENBQWlDO0lBQUF4QyxDQUFBLE1BQUF3QyxXQUFBLENBQUFBLFdBQUE7SUFBQXhDLENBQUEsTUFBQVMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVQsQ0FBQTtFQUFBO0VBQUEsSUFBQVUsRUFBQTtFQUFBLElBQUFWLENBQUEsUUFBQXdDLFdBQUEsQ0FBQUMsU0FBQTtJQUN0Qy9CLEVBQUEsSUFBQyxHQUFHLENBQVksU0FBQyxDQUFELEdBQUMsQ0FDZixDQUFDLElBQUksQ0FBRSxDQUFBOEIsV0FBVyxDQUFBQyxTQUFTLENBQUUsRUFBNUIsSUFBSSxDQUNQLEVBRkMsR0FBRyxDQUVFO0lBQUF6QyxDQUFBLE1BQUF3QyxXQUFBLENBQUFDLFNBQUE7SUFBQXpDLENBQUEsTUFBQVUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVYsQ0FBQTtFQUFBO0VBQUEsSUFBQXFDLEVBQUE7RUFBQSxJQUFBckMsQ0FBQSxRQUFBd0MsV0FBQSxDQUFBNUIsU0FBQTtJQUdXeUIsRUFBQSxHQUFBMUIsWUFBWSxDQUFDNkIsV0FBVyxDQUFBNUIsU0FBVSxDQUFDO0lBQUFaLENBQUEsTUFBQXdDLFdBQUEsQ0FBQTVCLFNBQUE7SUFBQVosQ0FBQSxNQUFBcUMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXJDLENBQUE7RUFBQTtFQUFBLElBQUEwQyxFQUFBO0VBQUEsSUFBQTFDLENBQUEsUUFBQXdDLFdBQUEsQ0FBQTVCLFNBQUE7SUFDN0M4QixFQUFBLEdBQUE3QixZQUFZLENBQUMyQixXQUFXLENBQUE1QixTQUFVLENBQUM7SUFBQVosQ0FBQSxNQUFBd0MsV0FBQSxDQUFBNUIsU0FBQTtJQUFBWixDQUFBLE1BQUEwQyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBMUMsQ0FBQTtFQUFBO0VBQUEsSUFBQTJDLEVBQUE7RUFBQSxJQUFBM0MsQ0FBQSxRQUFBcUMsRUFBQSxJQUFBckMsQ0FBQSxTQUFBMEMsRUFBQTtJQUR0Q0MsRUFBQSxJQUFDLElBQUksQ0FBUSxLQUFtQyxDQUFuQyxDQUFBTixFQUFrQyxDQUFDLENBQzdDLENBQUFLLEVBQWtDLENBQUUsQ0FDdkMsRUFGQyxJQUFJLENBRUU7SUFBQTFDLENBQUEsTUFBQXFDLEVBQUE7SUFBQXJDLENBQUEsT0FBQTBDLEVBQUE7SUFBQTFDLENBQUEsT0FBQTJDLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUEzQyxDQUFBO0VBQUE7RUFBQSxJQUFBNEMsRUFBQTtFQUFBLElBQUE1QyxDQUFBLFNBQUF3QyxXQUFBLENBQUFLLElBQUE7SUFDUEQsRUFBQSxJQUFDLElBQUksQ0FBQyxDQUFFLENBQUFKLFdBQVcsQ0FBQUssSUFBSSxDQUFFLEVBQXhCLElBQUksQ0FBMkI7SUFBQTdDLENBQUEsT0FBQXdDLFdBQUEsQ0FBQUssSUFBQTtJQUFBN0MsQ0FBQSxPQUFBNEMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQTVDLENBQUE7RUFBQTtFQUFBLElBQUE4QyxFQUFBO0VBQUEsSUFBQTlDLENBQUEsU0FBQTJDLEVBQUEsSUFBQTNDLENBQUEsU0FBQTRDLEVBQUE7SUFMcENFLEVBQUEsSUFBQyxHQUFHLENBQVksU0FBQyxDQUFELEdBQUMsQ0FDZixDQUFDLElBQUksQ0FDSCxDQUFBSCxFQUVNLENBQ04sQ0FBQUMsRUFBK0IsQ0FDakMsRUFMQyxJQUFJLENBTVAsRUFQQyxHQUFHLENBT0U7SUFBQTVDLENBQUEsT0FBQTJDLEVBQUE7SUFBQTNDLENBQUEsT0FBQTRDLEVBQUE7SUFBQTVDLENBQUEsT0FBQThDLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUE5QyxDQUFBO0VBQUE7RUFBQSxJQUFBK0MsRUFBQTtFQUFBLElBQUEvQyxDQUFBLFNBQUFTLEVBQUEsSUFBQVQsQ0FBQSxTQUFBVSxFQUFBLElBQUFWLENBQUEsU0FBQThDLEVBQUE7SUFaUkMsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFZLFNBQUMsQ0FBRCxHQUFDLENBQ3RDLENBQUF0QyxFQUFxQyxDQUNyQyxDQUFBQyxFQUVLLENBQ0wsQ0FBQW9DLEVBT0ssQ0FDUCxFQWJDLEdBQUcsQ0FhRTtJQUFBOUMsQ0FBQSxPQUFBUyxFQUFBO0lBQUFULENBQUEsT0FBQVUsRUFBQTtJQUFBVixDQUFBLE9BQUE4QyxFQUFBO0lBQUE5QyxDQUFBLE9BQUErQyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBL0MsQ0FBQTtFQUFBO0VBQUEsT0FiTitDLEVBYU07QUFBQTs7QUFJVjtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFDLDJCQUFBNUMsRUFBQTtFQUFBLE1BQUFKLENBQUEsR0FBQUMsRUFBQTtFQUFvQztJQUFBbUIsT0FBQTtJQUFBRTtFQUFBLElBQUFsQixFQU0xQztFQUNDLElBQUksQ0FBQ2dCLE9BQW1CLElBQXBCLENBQWFFLE9BQU87SUFBQSxPQUNmLElBQUk7RUFBQTtFQUNaLElBQUFiLEVBQUE7RUFBQSxJQUFBVCxDQUFBLFFBQUE4QixNQUFBLENBQUFDLEdBQUE7SUFLS3RCLEVBQUEsSUFBQyxHQUFHLENBQVksU0FBQyxDQUFELEdBQUMsQ0FDZixDQUFDLGtCQUFrQixHQUNyQixFQUZDLEdBQUcsQ0FFRTtJQUFBVCxDQUFBLE1BQUFTLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFULENBQUE7RUFBQTtFQUFBLElBQUFVLEVBQUE7RUFBQSxJQUFBVixDQUFBLFFBQUFzQixPQUFBO0lBSlZaLEVBQUEsSUFBQyxRQUFRLENBRUwsUUFFTSxDQUZOLENBQUFELEVBRUssQ0FBQyxDQUdSLENBQUMsaUJBQWlCLENBQVVhLE9BQU8sQ0FBUEEsUUFBTSxDQUFDLEdBQ3JDLEVBUkMsUUFBUSxDQVFFO0lBQUF0QixDQUFBLE1BQUFzQixPQUFBO0lBQUF0QixDQUFBLE1BQUFVLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFWLENBQUE7RUFBQTtFQUFBLE9BUlhVLEVBUVc7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 类型依赖 { Root } 来自 ../ink.js，用于校准终端渲染的数据契约。
import type { Root } from '../ink.js';
// 引入 Box、Text、useAnimationFrame，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useAnimationFrame } from '../ink.js';
// 引入 AppStateProvider，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { AppStateProvider } from '../state/AppState.js';
// 复用 checkOutTeleportedSessionBranch、processMessagesForTeleportResume、TeleportProgressStep、TeleportResult、teleportResumeCodeSession 工具函数，把通用处理留在 ../utils/teleport.js 中维护。
import { checkOutTeleportedSessionBranch, processMessagesForTeleportResume, type TeleportProgressStep, type TeleportResult, teleportResumeCodeSession } from '../utils/teleport.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  currentStep: TeleportProgressStep;
  sessionId?: string;
};
// SPINNER_FRAMES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SPINNER_FRAMES = ['◐', '◓', '◑', '◒'];
// STEPS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const STEPS: {
  key: TeleportProgressStep;
  label: string;
}[] = [{
  key: 'validating',
  label: 'Validating session'
}, {
  key: 'fetching_logs',
  label: 'Fetching session logs'
}, {
  key: 'fetching_branch',
  label: 'Getting branch info'
}, {
  key: 'checking_out',
  label: 'Checking out branch'
}];
// TeleportProgress 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TeleportProgress(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(16);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    currentStep,
    sessionId
  } = t0;
  // 从 `useAnimationFrame(100)` 按位置拆出 ref、time，让终端 UI 组件 Teleport Progress分别处理这些返回值。
  const [ref, time] = useAnimationFrame(100);
  // frame保存`Math.floor`，供终端渲染后续处理使用。
  const frame = Math.floor(time / 100) % SPINNER_FRAMES.length;
  // t1 暂存 `s => s.key === currentStep` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== currentStep) {
    // t1 暂存 `s => s.key === currentStep` 生成的渲染片段，后续返回路径直接复用。
    t1 = s => s.key === currentStep;
    // $[0] 缓存 `currentStep`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = currentStep;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // currentStepIndex 索引筛选`STEPS.findIndex`，供终端渲染后续处理使用。
  const currentStepIndex = STEPS.findIndex(t1);
  // t2保存`SPINNER_FRAMES[frame]`，供终端 UI Teleport Progress后续判断或输出使用。
  const t2 = SPINNER_FRAMES[frame];
  // t3 暂存 `<Box marginBottom={1}><Text bold={true} color="claude">{t...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t2) {
    // t3 暂存 `<Box marginBottom={1}><Text bold={true} color="claude">{t...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box marginBottom={1}><Text bold={true} color="claude">{t2} Teleporting session…</Text></Box>;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // t4 暂存 `sessionId && <Box marginBottom={1}><Text dimColor={true}>...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== sessionId) {
    // t4 暂存 `sessionId && <Box marginBottom={1}><Text dimColor={true}>...` 生成的渲染片段，后续返回路径直接复用。
    t4 = sessionId && <Box marginBottom={1}><Text dimColor={true}>{sessionId}</Text></Box>;
    // $[4] 缓存 `sessionId`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = sessionId;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `STEPS.map((step, index) => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== currentStepIndex || $[7] !== frame) {
    // t5 暂存 `STEPS.map((step, index) => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = STEPS.map((step, index) => {
      // isComplete标记终端 UI Teleport Progress是否启用对应路径。
      const isComplete = index < currentStepIndex;
      // isCurrent标记终端 UI Teleport Progress是否启用对应路径。
      const isCurrent = index === currentStepIndex;
      // isPending标记终端 UI Teleport Progress是否启用对应路径。
      const isPending = index > currentStepIndex;
      // icon 先占位，稍后的条件分支会根据实际输入补齐它。
      let icon;
      // color 先占位，稍后的条件分支会根据实际输入补齐它。
      let color;
      // 满足 `isComplete` 时，终端渲染执行该分支。
      if (isComplete) {
        // icon更新为 `figures.tick`，确保终端 UI后续读取最新状态。
        icon = figures.tick;
        // color更新为 `"green"`，确保终端 UI后续读取最新状态。
        color = "green";
      } else {
        // 满足 `isCurrent` 时，终端渲染执行该分支。
        if (isCurrent) {
          // icon更新为 `SPINNER_FRAMES[frame]`，确保终端 UI后续读取最新状态。
          icon = SPINNER_FRAMES[frame];
          // color更新为 `"claude"`，确保终端 UI后续读取最新状态。
          color = "claude";
        } else {
          // icon更新为 `figures.circle`，确保终端 UI后续读取最新状态。
          icon = figures.circle;
          // color更新为 `undefined`，确保终端 UI后续读取最新状态。
          color = undefined;
        }
      }
      // 返回 `<Box key={step.key} flexDirection="row"><Box width={2}><Text color={col...`，作为终端渲染这次计算的结果。
      return <Box key={step.key} flexDirection="row"><Box width={2}><Text color={color as never} dimColor={isPending}>{icon}</Text></Box><Text dimColor={isPending} bold={isCurrent}>{step.label}</Text></Box>;
    });
    // $[6] 缓存 `currentStepIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = currentStepIndex;
    // $[7] 缓存 `frame`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = frame;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<Box flexDirection="column" marginLeft={2}>{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== t5) {
    // t6 暂存 `<Box flexDirection="column" marginLeft={2}>{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" marginLeft={2}>{t5}</Box>;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[10];
  }
  // t7 暂存 `<Box ref={ref} flexDirection="column" paddingX={1} paddin...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== ref || $[12] !== t3 || $[13] !== t4 || $[14] !== t6) {
    // t7 暂存 `<Box ref={ref} flexDirection="column" paddingX={1} paddin...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box ref={ref} flexDirection="column" paddingX={1} paddingY={1}>{t3}{t4}{t6}</Box>;
    // $[11] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = ref;
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}

/**
 * Teleports to a remote session with progress UI rendered into the existing root.
 * Fetches the session, checks out the branch, and returns the result.
 */
// teleportWithProgress 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function teleportWithProgress(root: Root, sessionId: string): Promise<TeleportResult> {
  // Capture the setState function from the rendered component
  // 这个回调绑定到 let setStep: (step: TeleportProgressStep) => void = () => {};，负责终端渲染在该局部场景下的响应。
  let setStep: (step: TeleportProgressStep) => void = () => {};
  // TeleportProgressWrapper 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function TeleportProgressWrapper(): React.ReactNode {
    // step 由 React state 持有，_setStep 会在用户操作或异步结果返回时触发刷新。
    const [step, _setStep] = useState<TeleportProgressStep>('validating');
    // setStep更新为 `_setStep`，确保终端 UI后续读取最新状态。
    setStep = _setStep;
    // 返回 `<TeleportProgress currentStep={step} sessionId={sessionId} />`，作为终端渲染这次计算的结果。
    return <TeleportProgress currentStep={step} sessionId={sessionId} />;
  }
  // 调用 root.render，触发终端渲染此处需要的副作用。
  root.render(<AppStateProvider>
      <TeleportProgressWrapper />
    </AppStateProvider>);
  // 结果保存`teleportResumeCodeSession`，供终端渲染后续处理使用。
  const result = await teleportResumeCodeSession(sessionId, setStep);
  // setStep 写入新的状态值，使终端渲染后续读取保持一致。
  setStep('checking_out');
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    branchName,
    branchError
  } = await checkOutTeleportedSessionBranch(result.branch);
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    messages: processMessagesForTeleportResume(result.log, branchError),
    branchName
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VTdGF0ZSIsIlJvb3QiLCJCb3giLCJUZXh0IiwidXNlQW5pbWF0aW9uRnJhbWUiLCJBcHBTdGF0ZVByb3ZpZGVyIiwiY2hlY2tPdXRUZWxlcG9ydGVkU2Vzc2lvbkJyYW5jaCIsInByb2Nlc3NNZXNzYWdlc0ZvclRlbGVwb3J0UmVzdW1lIiwiVGVsZXBvcnRQcm9ncmVzc1N0ZXAiLCJUZWxlcG9ydFJlc3VsdCIsInRlbGVwb3J0UmVzdW1lQ29kZVNlc3Npb24iLCJQcm9wcyIsImN1cnJlbnRTdGVwIiwic2Vzc2lvbklkIiwiU1BJTk5FUl9GUkFNRVMiLCJTVEVQUyIsImtleSIsImxhYmVsIiwiVGVsZXBvcnRQcm9ncmVzcyIsInQwIiwiJCIsIl9jIiwicmVmIiwidGltZSIsImZyYW1lIiwiTWF0aCIsImZsb29yIiwibGVuZ3RoIiwidDEiLCJzIiwiY3VycmVudFN0ZXBJbmRleCIsImZpbmRJbmRleCIsInQyIiwidDMiLCJ0NCIsInQ1IiwibWFwIiwic3RlcCIsImluZGV4IiwiaXNDb21wbGV0ZSIsImlzQ3VycmVudCIsImlzUGVuZGluZyIsImljb24iLCJjb2xvciIsInRpY2siLCJjaXJjbGUiLCJ1bmRlZmluZWQiLCJ0NiIsInQ3IiwidGVsZXBvcnRXaXRoUHJvZ3Jlc3MiLCJyb290IiwiUHJvbWlzZSIsInNldFN0ZXAiLCJUZWxlcG9ydFByb2dyZXNzV3JhcHBlciIsIlJlYWN0Tm9kZSIsIl9zZXRTdGVwIiwicmVuZGVyIiwicmVzdWx0IiwiYnJhbmNoTmFtZSIsImJyYW5jaEVycm9yIiwiYnJhbmNoIiwibWVzc2FnZXMiLCJsb2ciXSwic291cmNlcyI6WyJUZWxlcG9ydFByb2dyZXNzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBSb290IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0LCB1c2VBbmltYXRpb25GcmFtZSB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IEFwcFN0YXRlUHJvdmlkZXIgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7XG4gIGNoZWNrT3V0VGVsZXBvcnRlZFNlc3Npb25CcmFuY2gsXG4gIHByb2Nlc3NNZXNzYWdlc0ZvclRlbGVwb3J0UmVzdW1lLFxuICB0eXBlIFRlbGVwb3J0UHJvZ3Jlc3NTdGVwLFxuICB0eXBlIFRlbGVwb3J0UmVzdWx0LFxuICB0ZWxlcG9ydFJlc3VtZUNvZGVTZXNzaW9uLFxufSBmcm9tICcuLi91dGlscy90ZWxlcG9ydC5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgY3VycmVudFN0ZXA6IFRlbGVwb3J0UHJvZ3Jlc3NTdGVwXG4gIHNlc3Npb25JZD86IHN0cmluZ1xufVxuXG5jb25zdCBTUElOTkVSX0ZSQU1FUyA9IFsn4peQJywgJ+KXkycsICfil5EnLCAn4peSJ11cblxuY29uc3QgU1RFUFM6IHsga2V5OiBUZWxlcG9ydFByb2dyZXNzU3RlcDsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gIHsga2V5OiAndmFsaWRhdGluZycsIGxhYmVsOiAnVmFsaWRhdGluZyBzZXNzaW9uJyB9LFxuICB7IGtleTogJ2ZldGNoaW5nX2xvZ3MnLCBsYWJlbDogJ0ZldGNoaW5nIHNlc3Npb24gbG9ncycgfSxcbiAgeyBrZXk6ICdmZXRjaGluZ19icmFuY2gnLCBsYWJlbDogJ0dldHRpbmcgYnJhbmNoIGluZm8nIH0sXG4gIHsga2V5OiAnY2hlY2tpbmdfb3V0JywgbGFiZWw6ICdDaGVja2luZyBvdXQgYnJhbmNoJyB9LFxuXVxuXG5leHBvcnQgZnVuY3Rpb24gVGVsZXBvcnRQcm9ncmVzcyh7XG4gIGN1cnJlbnRTdGVwLFxuICBzZXNzaW9uSWQsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtyZWYsIHRpbWVdID0gdXNlQW5pbWF0aW9uRnJhbWUoMTAwKVxuICBjb25zdCBmcmFtZSA9IE1hdGguZmxvb3IodGltZSAvIDEwMCkgJSBTUElOTkVSX0ZSQU1FUy5sZW5ndGhcblxuICBjb25zdCBjdXJyZW50U3RlcEluZGV4ID0gU1RFUFMuZmluZEluZGV4KHMgPT4gcy5rZXkgPT09IGN1cnJlbnRTdGVwKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCByZWY9e3JlZn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsxfSBwYWRkaW5nWT17MX0+XG4gICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgIDxUZXh0IGJvbGQgY29sb3I9XCJjbGF1ZGVcIj5cbiAgICAgICAgICB7U1BJTk5FUl9GUkFNRVNbZnJhbWVdfSBUZWxlcG9ydGluZyBzZXNzaW9u4oCmXG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuXG4gICAgICB7c2Vzc2lvbklkICYmIChcbiAgICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPntzZXNzaW9uSWR9PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpbkxlZnQ9ezJ9PlxuICAgICAgICB7U1RFUFMubWFwKChzdGVwLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzQ29tcGxldGUgPSBpbmRleCA8IGN1cnJlbnRTdGVwSW5kZXhcbiAgICAgICAgICBjb25zdCBpc0N1cnJlbnQgPSBpbmRleCA9PT0gY3VycmVudFN0ZXBJbmRleFxuICAgICAgICAgIGNvbnN0IGlzUGVuZGluZyA9IGluZGV4ID4gY3VycmVudFN0ZXBJbmRleFxuXG4gICAgICAgICAgbGV0IGljb246IHN0cmluZ1xuICAgICAgICAgIGxldCBjb2xvcjogc3RyaW5nIHwgdW5kZWZpbmVkXG5cbiAgICAgICAgICBpZiAoaXNDb21wbGV0ZSkge1xuICAgICAgICAgICAgaWNvbiA9IGZpZ3VyZXMudGlja1xuICAgICAgICAgICAgY29sb3IgPSAnZ3JlZW4nXG4gICAgICAgICAgfSBlbHNlIGlmIChpc0N1cnJlbnQpIHtcbiAgICAgICAgICAgIGljb24gPSBTUElOTkVSX0ZSQU1FU1tmcmFtZV0hXG4gICAgICAgICAgICBjb2xvciA9ICdjbGF1ZGUnXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGljb24gPSBmaWd1cmVzLmNpcmNsZVxuICAgICAgICAgICAgY29sb3IgPSB1bmRlZmluZWRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJveCBrZXk9e3N0ZXAua2V5fSBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgICAgICAgIDxCb3ggd2lkdGg9ezJ9PlxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPXtjb2xvciBhcyBuZXZlcn0gZGltQ29sb3I9e2lzUGVuZGluZ30+XG4gICAgICAgICAgICAgICAgICB7aWNvbn1cbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj17aXNQZW5kaW5nfSBib2xkPXtpc0N1cnJlbnR9PlxuICAgICAgICAgICAgICAgIHtzdGVwLmxhYmVsfVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICApXG4gICAgICAgIH0pfVxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuLyoqXG4gKiBUZWxlcG9ydHMgdG8gYSByZW1vdGUgc2Vzc2lvbiB3aXRoIHByb2dyZXNzIFVJIHJlbmRlcmVkIGludG8gdGhlIGV4aXN0aW5nIHJvb3QuXG4gKiBGZXRjaGVzIHRoZSBzZXNzaW9uLCBjaGVja3Mgb3V0IHRoZSBicmFuY2gsIGFuZCByZXR1cm5zIHRoZSByZXN1bHQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZWxlcG9ydFdpdGhQcm9ncmVzcyhcbiAgcm9vdDogUm9vdCxcbiAgc2Vzc2lvbklkOiBzdHJpbmcsXG4pOiBQcm9taXNlPFRlbGVwb3J0UmVzdWx0PiB7XG4gIC8vIENhcHR1cmUgdGhlIHNldFN0YXRlIGZ1bmN0aW9uIGZyb20gdGhlIHJlbmRlcmVkIGNvbXBvbmVudFxuICBsZXQgc2V0U3RlcDogKHN0ZXA6IFRlbGVwb3J0UHJvZ3Jlc3NTdGVwKSA9PiB2b2lkID0gKCkgPT4ge31cblxuICBmdW5jdGlvbiBUZWxlcG9ydFByb2dyZXNzV3JhcHBlcigpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAgIGNvbnN0IFtzdGVwLCBfc2V0U3RlcF0gPSB1c2VTdGF0ZTxUZWxlcG9ydFByb2dyZXNzU3RlcD4oJ3ZhbGlkYXRpbmcnKVxuICAgIHNldFN0ZXAgPSBfc2V0U3RlcFxuICAgIHJldHVybiA8VGVsZXBvcnRQcm9ncmVzcyBjdXJyZW50U3RlcD17c3RlcH0gc2Vzc2lvbklkPXtzZXNzaW9uSWR9IC8+XG4gIH1cblxuICByb290LnJlbmRlcihcbiAgICA8QXBwU3RhdGVQcm92aWRlcj5cbiAgICAgIDxUZWxlcG9ydFByb2dyZXNzV3JhcHBlciAvPlxuICAgIDwvQXBwU3RhdGVQcm92aWRlcj4sXG4gIClcblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCB0ZWxlcG9ydFJlc3VtZUNvZGVTZXNzaW9uKHNlc3Npb25JZCwgc2V0U3RlcClcbiAgc2V0U3RlcCgnY2hlY2tpbmdfb3V0JylcbiAgY29uc3QgeyBicmFuY2hOYW1lLCBicmFuY2hFcnJvciB9ID0gYXdhaXQgY2hlY2tPdXRUZWxlcG9ydGVkU2Vzc2lvbkJyYW5jaChcbiAgICByZXN1bHQuYnJhbmNoLFxuICApXG4gIHJldHVybiB7XG4gICAgbWVzc2FnZXM6IHByb2Nlc3NNZXNzYWdlc0ZvclRlbGVwb3J0UmVzdW1lKHJlc3VsdC5sb2csIGJyYW5jaEVycm9yKSxcbiAgICBicmFuY2hOYW1lLFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFP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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、ReactNode、useCallback、useEffect、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 类型依赖 { WizardContextValue, WizardProviderProps } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { WizardContextValue, WizardProviderProps } from './types.js';

// Use any here for the context since it will be cast properly when used
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// WizardContext 命名 `createContext<WizardContextValue<any> | null>(null)`，让后续代码直接表达这个值的用途。
export const WizardContext = createContext<WizardContextValue<any> | null>(null);
// WizardProvider 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WizardProvider(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(38);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    steps,
    initialData: t1,
    onComplete,
    onCancel,
    children,
    title,
    showStepCounter: t2
  } = t0;
  // t3 暂存 `t1 === undefined ? {} as T : t1` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t1) {
    // t3 暂存 `t1 === undefined ? {} as T : t1` 生成的渲染片段，后续返回路径直接复用。
    t3 = t1 === undefined ? {} as T : t1;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
    // $[1] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[1];
  }
  // initialData沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const initialData = t3;
  // showStepCounter 数量标记终端 UI Wizard Provider是否启用对应路径。
  const showStepCounter = t2 === undefined ? true : t2;
  // currentStepIndex 索引 由 React state 持有，setCurrentStepIndex 会在用户操作或异步结果返回时触发刷新。
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // wizardData 由 React state 持有，setWizardData 会在用户操作或异步结果返回时触发刷新。
  const [wizardData, setWizardData] = useState(initialData);
  // isCompleted 由 React state 持有，setIsCompleted 会在用户操作或异步结果返回时触发刷新。
  const [isCompleted, setIsCompleted] = useState(false);
  // t4 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [];
    // $[2] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[2];
  }
  // navigationHistory 由 React state 持有，setNavigationHistory 会在用户操作或异步结果返回时触发刷新。
  const [navigationHistory, setNavigationHistory] = useState(t4);
  // 调用 useExitOnCtrlCDWithKeybindings，触发终端渲染此处需要的副作用。
  useExitOnCtrlCDWithKeybindings();
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `[isCompleted, wizardData, onComplete]` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== isCompleted || $[4] !== onComplete || $[5] !== wizardData) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // 满足 `isCompleted` 时，终端渲染执行该分支。
      if (isCompleted) {
        // setNavigationHistory 写入新的状态值，使终端渲染后续读取保持一致。
        setNavigationHistory([]);
        // 调用 onComplete，触发终端渲染此处需要的副作用。
        onComplete(wizardData);
      }
    };
    // t6 暂存 `[isCompleted, wizardData, onComplete]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [isCompleted, wizardData, onComplete];
    // $[3] 缓存 `isCompleted`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = isCompleted;
    // $[4] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onComplete;
    // $[5] 缓存 `wizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = wizardData;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
    // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[7];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t5, t6);
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== currentStepIndex || $[9] !== navigationHistory || $[10] !== steps.length) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // 满足 `currentStepIndex < steps.length - 1` 时，终端渲染执行该分支。
      if (currentStepIndex < steps.length - 1) {
        // 满足 `navigationHistory.length > 0` 时，终端渲染执行该分支。
        if (navigationHistory.length > 0) {
          // setNavigationHistory 写入新的状态值，使终端渲染后续读取保持一致。
          setNavigationHistory(prev => [...prev, currentStepIndex]);
        }
        // setCurrentStepIndex 写入新的状态值，使终端渲染后续读取保持一致。
        setCurrentStepIndex(_temp);
      } else {
        // setIsCompleted 写入新的状态值，使终端渲染后续读取保持一致。
        setIsCompleted(true);
      }
    };
    // $[8] 缓存 `currentStepIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = currentStepIndex;
    // $[9] 缓存 `navigationHistory`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = navigationHistory;
    // $[10] 缓存 `steps.length`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = steps.length;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // goNext 命名 `t7`，让后续代码直接表达这个值的用途。
  const goNext = t7;
  // t8 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== currentStepIndex || $[13] !== navigationHistory || $[14] !== onCancel) {
    // t8 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = () => {
      // 满足 `navigationHistory.length > 0` 时，终端渲染执行该分支。
      if (navigationHistory.length > 0) {
        // previousStep保存 `navigationHistory[navigationHistory.length - 1]` 的判断结果，供终端 UI Wizard Provider后续分支直接复用。
        const previousStep = navigationHistory[navigationHistory.length - 1];
        // `previousStep` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (previousStep !== undefined) {
          // setNavigationHistory 写入新的状态值，使终端渲染后续读取保持一致。
          setNavigationHistory(_temp2);
          // setCurrentStepIndex 写入新的状态值，使终端渲染后续读取保持一致。
          setCurrentStepIndex(previousStep);
        }
      } else {
        // 满足 `currentStepIndex > 0` 时，终端渲染执行该分支。
        if (currentStepIndex > 0) {
          // setCurrentStepIndex 写入新的状态值，使终端渲染后续读取保持一致。
          setCurrentStepIndex(_temp3);
        } else {
          // 满足 `onCancel` 时，终端渲染执行该分支。
          if (onCancel) {
            // 调用 onCancel，触发终端渲染此处需要的副作用。
            onCancel();
          }
        }
      }
    };
    // $[12] 缓存 `currentStepIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = currentStepIndex;
    // $[13] 缓存 `navigationHistory`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = navigationHistory;
    // $[14] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = onCancel;
    // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[15];
  }
  // goBack保存`t8`，作为后续临时缓存值处理的输入。
  const goBack = t8;
  // t9 暂存 `index => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== currentStepIndex || $[17] !== steps.length) {
    // t9 暂存 `index => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = index => {
      // 只有 `index >= 0 && index < steps.length` 满足时，终端渲染才执行该分支。
      if (index >= 0 && index < steps.length) {
        // setNavigationHistory 写入新的状态值，使终端渲染后续读取保持一致。
        setNavigationHistory(prev_3 => [...prev_3, currentStepIndex]);
        // setCurrentStepIndex 写入新的状态值，使终端渲染后续读取保持一致。
        setCurrentStepIndex(index);
      }
    };
    // $[16] 缓存 `currentStepIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = currentStepIndex;
    // $[17] 缓存 `steps.length`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = steps.length;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // goToStep保存`t9`，作为后续临时缓存值处理的输入。
  const goToStep = t9;
  // t10 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== onCancel) {
    // t10 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = () => {
      // setNavigationHistory 写入新的状态值，使终端渲染后续读取保持一致。
      setNavigationHistory([]);
      // 满足 `onCancel` 时，终端渲染执行该分支。
      if (onCancel) {
        // 调用 onCancel，触发终端渲染此处需要的副作用。
        onCancel();
      }
    };
    // $[19] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = onCancel;
    // $[20] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[20];
  }
  // cancel沿用 `t10` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const cancel = t10;
  // t11 暂存 `updates => {` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `updates => {` 生成的渲染片段，后续返回路径直接复用。
    t11 = updates => {
      // setWizardData 写入新的状态值，使终端渲染后续读取保持一致。
      setWizardData(prev_4 => ({
        ...prev_4,
        ...updates
      }));
    };
    // $[21] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[21];
  }
  // updateWizardData 命名 `t11`，让后续代码直接表达这个值的用途。
  const updateWizardData = t11;
  // t12 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== cancel || $[23] !== currentStepIndex || $[24] !== goBack || $[25] !== goNext || $[26] !== goToStep || $[27] !== showStepCounter || $[28] !== steps.length || $[29] !== title || $[30] !== wizardData) {
    // t12 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t12 = {
      currentStepIndex,
      totalSteps: steps.length,
      wizardData,
      setWizardData,
      updateWizardData,
      goNext,
      goBack,
      goToStep,
      cancel,
      title,
      showStepCounter
    };
    // $[22] 缓存 `cancel`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = cancel;
    // $[23] 缓存 `currentStepIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = currentStepIndex;
    // $[24] 缓存 `goBack`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = goBack;
    // $[25] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = goNext;
    // $[26] 缓存 `goToStep`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = goToStep;
    // $[27] 缓存 `showStepCounter`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = showStepCounter;
    // $[28] 缓存 `steps.length`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = steps.length;
    // $[29] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = title;
    // $[30] 缓存 `wizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = wizardData;
    // $[31] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[31];
  }
  // contextValue沿用 `t12` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const contextValue = t12;
  // CurrentStepComponent读取 `steps[currentStepIndex]` 对应条目，后续围绕该成员继续处理。
  const CurrentStepComponent = steps[currentStepIndex];
  // 只有 `!CurrentStepComponent || isCompleted` 满足时，终端渲染才执行该分支。
  if (!CurrentStepComponent || isCompleted) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t13 暂存 `children || <CurrentStepComponent />` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== CurrentStepComponent || $[33] !== children) {
    // t13 暂存 `children || <CurrentStepComponent />` 生成的渲染片段，后续返回路径直接复用。
    t13 = children || <CurrentStepComponent />;
    // $[32] 缓存 `CurrentStepComponent`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = CurrentStepComponent;
    // $[33] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = children;
    // $[34] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[34];
  }
  // t14 暂存 `<WizardContext.Provider value={contextValue}>{t13}</Wizar...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== contextValue || $[36] !== t13) {
    // t14 暂存 `<WizardContext.Provider value={contextValue}>{t13}</Wizar...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <WizardContext.Provider value={contextValue}>{t13}</WizardContext.Provider>;
    // $[35] 缓存 `contextValue`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = contextValue;
    // $[36] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t13;
    // $[37] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[37];
  }
  // 返回 `t14`，作为终端渲染这次计算的结果。
  return t14;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(prev_2) {
  // 返回 `prev_2 - 1`，作为终端渲染这次计算的结果。
  return prev_2 - 1;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(prev_1) {
  // 返回 `prev_1.slice(0, -1)`，作为终端渲染这次计算的结果。
  return prev_1.slice(0, -1);
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(prev_0) {
  // 返回 `prev_0 + 1`，作为终端渲染这次计算的结果。
  return prev_0 + 1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJSZWFjdE5vZGUiLCJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsInVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyIsIldpemFyZENvbnRleHRWYWx1ZSIsIldpemFyZFByb3ZpZGVyUHJvcHMiLCJXaXphcmRDb250ZXh0IiwiV2l6YXJkUHJvdmlkZXIiLCJ0MCIsIiQiLCJfYyIsInN0ZXBzIiwiaW5pdGlhbERhdGEiLCJ0MSIsIm9uQ29tcGxldGUiLCJvbkNhbmNlbCIsImNoaWxkcmVuIiwidGl0bGUiLCJzaG93U3RlcENvdW50ZXIiLCJ0MiIsInQzIiwidW5kZWZpbmVkIiwiVCIsImN1cnJlbnRTdGVwSW5kZXgiLCJzZXRDdXJyZW50U3RlcEluZGV4Iiwid2l6YXJkRGF0YSIsInNldFdpemFyZERhdGEiLCJpc0NvbXBsZXRlZCIsInNldElzQ29tcGxldGVkIiwidDQiLCJTeW1ib2wiLCJmb3IiLCJuYXZpZ2F0aW9uSGlzdG9yeSIsInNldE5hdmlnYXRpb25IaXN0b3J5IiwidDUiLCJ0NiIsInQ3IiwibGVuZ3RoIiwicHJldiIsIl90ZW1wIiwiZ29OZXh0IiwidDgiLCJwcmV2aW91c1N0ZXAiLCJfdGVtcDIiLCJfdGVtcDMiLCJnb0JhY2siLCJ0OSIsImluZGV4IiwicHJldl8zIiwiZ29Ub1N0ZXAiLCJ0MTAiLCJjYW5jZWwiLCJ0MTEiLCJ1cGRhdGVzIiwicHJldl80IiwidXBkYXRlV2l6YXJkRGF0YSIsInQxMiIsInRvdGFsU3RlcHMiLCJjb250ZXh0VmFsdWUiLCJDdXJyZW50U3RlcENvbXBvbmVudCIsInQxMyIsInQxNCIsInByZXZfMiIsInByZXZfMSIsInNsaWNlIiwicHJldl8wIl0sInNvdXJjZXMiOlsiV2l6YXJkUHJvdmlkZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwge1xuICBjcmVhdGVDb250ZXh0LFxuICB0eXBlIFJlYWN0Tm9kZSxcbiAgdXNlQ2FsbGJhY2ssXG4gIHVzZUVmZmVjdCxcbiAgdXNlTWVtbyxcbiAgdXNlU3RhdGUsXG59IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzLmpzJ1xuaW1wb3J0IHR5cGUgeyBXaXphcmRDb250ZXh0VmFsdWUsIFdpemFyZFByb3ZpZGVyUHJvcHMgfSBmcm9tICcuL3R5cGVzLmpzJ1xuXG4vLyBVc2UgYW55IGhlcmUgZm9yIHRoZSBjb250ZXh0IHNpbmNlIGl0IHdpbGwgYmUgY2FzdCBwcm9wZXJseSB3aGVuIHVzZWRcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgY29uc3QgV2l6YXJkQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8V2l6YXJkQ29udGV4dFZhbHVlPGFueT4gfCBudWxsPihudWxsKVxuXG5leHBvcnQgZnVuY3Rpb24gV2l6YXJkUHJvdmlkZXI8VCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+Pih7XG4gIHN0ZXBzLFxuICBpbml0aWFsRGF0YSA9IHt9IGFzIFQsXG4gIG9uQ29tcGxldGUsXG4gIG9uQ2FuY2VsLFxuICBjaGlsZHJlbixcbiAgdGl0bGUsXG4gIHNob3dTdGVwQ291bnRlciA9IHRydWUsXG59OiBXaXphcmRQcm92aWRlclByb3BzPFQ+KTogUmVhY3ROb2RlIHtcbiAgY29uc3QgW2N1cnJlbnRTdGVwSW5kZXgsIHNldEN1cnJlbnRTdGVwSW5kZXhdID0gdXNlU3RhdGUoMClcbiAgY29uc3QgW3dpemFyZERhdGEsIHNldFdpemFyZERhdGFdID0gdXNlU3RhdGU8VD4oaW5pdGlhbERhdGEpXG4gIGNvbnN0IFtpc0NvbXBsZXRlZCwgc2V0SXNDb21wbGV0ZWRdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtuYXZpZ2F0aW9uSGlzdG9yeSwgc2V0TmF2aWdhdGlvbkhpc3RvcnldID0gdXNlU3RhdGU8bnVtYmVyW10+KFtdKVxuXG4gIHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncygpXG5cbiAgLy8gSGFuZGxlIGNvbXBsZXRpb24gaW4gdXNlRWZmZWN0IHRvIGF2b2lkIHVwZGF0aW5nIHBhcmVudCBkdXJpbmcgcmVuZGVyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGlzQ29tcGxldGVkKSB7XG4gICAgICBzZXROYXZpZ2F0aW9uSGlzdG9yeShbXSlcbiAgICAgIHZvaWQgb25Db21wbGV0ZSh3aXphcmREYXRhKVxuICAgIH1cbiAgfSwgW2lzQ29tcGxldGVkLCB3aXphcmREYXRhLCBvbkNvbXBsZXRlXSlcblxuICBjb25zdCBnb05leHQgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGN1cnJlbnRTdGVwSW5kZXggPCBzdGVwcy5sZW5ndGggLSAxKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIGhpc3RvcnkgKG5vbi1saW5lYXIgZmxvdyksIGFkZCBjdXJyZW50IHN0ZXAgdG8gaXRcbiAgICAgIGlmIChuYXZpZ2F0aW9uSGlzdG9yeS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNldE5hdmlnYXRpb25IaXN0b3J5KHByZXYgPT4gWy4uLnByZXYsIGN1cnJlbnRTdGVwSW5kZXhdKVxuICAgICAgfVxuXG4gICAgICBzZXRDdXJyZW50U3RlcEluZGV4KHByZXYgPT4gcHJldiArIDEpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1hcmsgYXMgY29tcGxldGVkLCB3aGljaCB3aWxsIHRyaWdnZXIgdXNlRWZmZWN0XG4gICAgICBzZXRJc0NvbXBsZXRlZCh0cnVlKVxuICAgIH1cbiAgfSwgW2N1cnJlbnRTdGVwSW5kZXgsIHN0ZXBzLmxlbmd0aCwgbmF2aWdhdGlvbkhpc3RvcnldKVxuXG4gIGNvbnN0IGdvQmFjayA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICAvLyBDaGVjayBpZiB3ZSBoYXZlIG5hdmlnYXRpb24gaGlzdG9yeSB0byB1c2VcbiAgICBpZiAobmF2aWdhdGlvbkhpc3RvcnkubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcHJldmlvdXNTdGVwID0gbmF2aWdhdGlvbkhpc3RvcnlbbmF2aWdhdGlvbkhpc3RvcnkubGVuZ3RoIC0gMV1cbiAgICAgIGlmIChwcmV2aW91c1N0ZXAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzZXROYXZpZ2F0aW9uSGlzdG9yeShwcmV2ID0+IHByZXYuc2xpY2UoMCwgLTEpKVxuICAgICAgICBzZXRDdXJyZW50U3RlcEluZGV4KHByZXZpb3VzU3RlcClcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGN1cnJlbnRTdGVwSW5kZXggPiAwKSB7XG4gICAgICAvLyBGYWxsYmFjayB0byBzaW1wbGUgZGVjcmVtZW50IGlmIG5vIGhpc3RvcnlcbiAgICAgIHNldEN1cnJlbnRTdGVwSW5kZXgocHJldiA9PiBwcmV2IC0gMSlcbiAgICB9IGVsc2UgaWYgKG9uQ2FuY2VsKSB7XG4gICAgICBvbkNhbmNlbCgpXG4gICAgfVxuICB9LCBbY3VycmVudFN0ZXBJbmRleCwgbmF2aWdhdGlvbkhpc3RvcnksIG9uQ2FuY2VsXSlcblxuICBjb25zdCBnb1RvU3RlcCA9IHVzZUNhbGxiYWNrKFxuICAgIChpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8IHN0ZXBzLmxlbmd0aCkge1xuICAgICAgICAvLyBQdXNoIGN1cnJlbnQgc3RlcCB0byBoaXN0b3J5IGJlZm9yZSBqdW1waW5nXG4gICAgICAgIHNldE5hdmlnYXRpb25IaXN0b3J5KHByZXYgPT4gWy4uLnByZXYsIGN1cnJlbnRTdGVwSW5kZXhdKVxuICAgICAgICBzZXRDdXJyZW50U3RlcEluZGV4KGluZGV4KVxuICAgICAgfVxuICAgIH0sXG4gICAgW2N1cnJlbnRTdGVwSW5kZXgsIHN0ZXBzLmxlbmd0aF0sXG4gIClcblxuICBjb25zdCBjYW5jZWwgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgc2V0TmF2aWdhdGlvbkhpc3RvcnkoW10pXG4gICAgaWYgKG9uQ2FuY2VsKSB7XG4gICAgICBvbkNhbmNlbCgpXG4gICAgfVxuICB9LCBbb25DYW5jZWxdKVxuXG4gIGNvbnN0IHVwZGF0ZVdpemFyZERhdGEgPSB1c2VDYWxsYmFjaygodXBkYXRlczogUGFydGlhbDxUPikgPT4ge1xuICAgIHNldFdpemFyZERhdGEocHJldiA9PiAoeyAuLi5wcmV2LCAuLi51cGRhdGVzIH0pKVxuICB9LCBbXSlcblxuICBjb25zdCBjb250ZXh0VmFsdWUgPSB1c2VNZW1vPFdpemFyZENvbnRleHRWYWx1ZTxUPj4oXG4gICAgKCkgPT4gKHtcbiAgICAgIGN1cnJlbnRTdGVwSW5kZXgsXG4gICAgICB0b3RhbFN0ZXBzOiBzdGVwcy5sZW5ndGgsXG4gICAgICB3aXphcmREYXRhLFxuICAgICAgc2V0V2l6YXJkRGF0YSxcbiAgICAgIHVwZGF0ZVdpemFyZERhdGEsXG4gICAgICBnb05leHQsXG4gICAgICBnb0JhY2ssXG4gICAgICBnb1RvU3RlcCxcbiAgICAgIGNhbmNlbCxcbiAgICAgIHRpdGxlLFxuICAgICAgc2hvd1N0ZXBDb3VudGVyLFxuICAgIH0pLFxuICAgIFtcbiAgICAgIGN1cnJlbnRTdGVwSW5kZXgsXG4gICAgICBzdGVwcy5sZW5ndGgsXG4gICAgICB3aXphcmREYXRhLFxuICAgICAgdXBkYXRlV2l6YXJkRGF0YSxcbiAgICAgIGdvTmV4dCxcbiAgICAgIGdvQmFjayxcbiAgICAgIGdvVG9TdGVwLFxuICAgICAgY2FuY2VsLFxuICAgICAgdGl0bGUsXG4gICAgICBzaG93U3RlcENvdW50ZXIsXG4gICAgXSxcbiAgKVxuXG4gIGNvbnN0IEN1cnJlbnRTdGVwQ29tcG9uZW50ID0gc3RlcHNbY3VycmVudFN0ZXBJbmRleF1cblxuICBpZiAoIUN1cnJlbnRTdGVwQ29tcG9uZW50IHx8IGlzQ29tcGxldGVkKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFdpemFyZENvbnRleHQuUHJvdmlkZXIgdmFsdWU9e2NvbnRleHRWYWx1ZX0+XG4gICAgICB7Y2hpbGRyZW4gfHwgPEN1cnJlbnRTdGVwQ29tcG9uZW50IC8+fVxuICAgIDwvV2l6YXJkQ29udGV4dC5Qcm92aWRlcj5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUNWQyxhQUFhLEVBQ2IsS0FBS0MsU0FBUyxFQUNkQyxXQUFXLEVBQ1hDLFNBQVMsRUFDVEMsT0FBTyxFQUNQQyxRQUFRLFFBQ0gsT0FBTztBQUNkLFNBQVNDLDhCQUE4QixRQUFRLCtDQUErQztBQUM5RixjQUFjQyxrQkFBa0IsRUFBRUMsbUJBQW1CLFFBQVEsWUFBWTs7QUFFekU7QUFDQTtBQUNBLE9BQU8sTUFBTUMsYUFBYSxHQUFHVCxhQUFhLENBQUNPLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQztBQUVoRixPQUFPLFNBQUFHLGVBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBMkQ7SUFBQUMsS0FBQTtJQUFBQyxXQUFBLEVBQUFDLEVBQUE7SUFBQUMsVUFBQTtJQUFBQyxRQUFBO0lBQUFDLFFBQUE7SUFBQUMsS0FBQTtJQUFBQyxlQUFBLEVBQUFDO0VBQUEsSUFBQVgsRUFRekM7RUFBQSxJQUFBWSxFQUFBO0VBQUEsSUFBQVgsQ0FBQSxRQUFBSSxFQUFBO0lBTnZCTyxFQUFBLEdBQUFQLEVBQXFCLEtBQXJCUSxTQUFxQixHQUFQLENBQUMsQ0FBQyxJQUFJQyxDQUFDLEdBQXJCVCxFQUFxQjtJQUFBSixDQUFBLE1BQUFJLEVBQUE7SUFBQUosQ0FBQSxNQUFBVyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWCxDQUFBO0VBQUE7RUFBckIsTUFBQUcsV0FBQSxHQUFBUSxFQUFxQjtFQUtyQixNQUFBRixlQUFBLEdBQUFDLEVBQXNCLEtBQXRCRSxTQUFzQixHQUF0QixJQUFzQixHQUF0QkYsRUFBc0I7RUFFdEIsT0FBQUksZ0JBQUEsRUFBQUMsbUJBQUEs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
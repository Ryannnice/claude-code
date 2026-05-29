// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js';
// 复用 toError 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { toError } from '../utils/errors.js';
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js';
// 复用 getSettingSourceName、SettingSource 工具函数，把通用处理留在 ../utils/settings/constants.js 中维护。
import { getSettingSourceName, type SettingSource } from '../utils/settings/constants.js';
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../utils/settings/settings.js';
// 复用 getEnvironmentSelectionInfo 工具函数，把通用处理留在 ../utils/teleport/environmentSelection.js 中维护。
import { getEnvironmentSelectionInfo } from '../utils/teleport/environmentSelection.js';
// 类型依赖 { EnvironmentResource } 来自 ../utils/teleport/environments.js，用于校准终端渲染的数据契约。
import type { EnvironmentResource } from '../utils/teleport/environments.js';
// 引入 ConfigurableShortcutHint，将 ./ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
// 引入 Select，将 ./CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/select.js';
// 引入 Byline，将 ./design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from './design-system/Byline.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// 引入 LoadingState，将 ./design-system/LoadingState.js 中已经封装好的能力接到本文件流程里。
import { LoadingState } from './design-system/LoadingState.js';
// DIALOG_TITLE 标题固定为 `'Select Remote Environment'`，作为终端 UI Remote Environment D...后续展示或比较的基准。
const DIALOG_TITLE = 'Select Remote Environment';
// SETUP_HINT固定为 ``Configure environments at: https://claude.ai/code``，作为终端 UI Remote Environment D...后续展示或比较的基准。
const SETUP_HINT = `Configure environments at: https://claude.ai/code`;
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: (message?: string) => void;，负责终端渲染在该局部场景下的响应。
  onDone: (message?: string) => void;
};
// LoadingState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type LoadingState = 'loading' | 'updating' | null;
// RemoteEnvironmentDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function RemoteEnvironmentDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(27);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // loadingState 状态 由 React state 持有，setLoadingState 会在用户操作或异步结果返回时触发刷新。
  const [loadingState, setLoadingState] = useState("loading");
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
  // environments 集合 由 React state 持有，setEnvironments 会在用户操作或异步结果返回时触发刷新。
  const [environments, setEnvironments] = useState(t1);
  // selectedEnvironment 由 React state 持有，setSelectedEnvironment 会在用户操作或异步结果返回时触发刷新。
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  // selectedEnvironmentSource 由 React state 持有，setSelectedEnvironmentSource 会在用户操作或异步结果返回时触发刷新。
  const [selectedEnvironmentSource, setSelectedEnvironmentSource] = useState(null);
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // cancelled标记终端 UI Remote Environment D...是否启用对应路径。
      let cancelled = false;
      // fetchInfo读取`fetchInfo`，供终端渲染后续处理使用。
      const fetchInfo = async function fetchInfo() {
        // 终端 UI 组件 Remote Environment Dialog在这里处理 ``，完成这一小步状态转换。
        ;
        // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
        try {
          // 结果读取`getEnvironmentSelectionInfo`，供终端渲染后续处理使用。
          const result = await getEnvironmentSelectionInfo();
          // 满足 `cancelled` 时，终端渲染执行该分支。
          if (cancelled) {
            // 终端 UI 组件 Remote Environment Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
          // setEnvironments 写入新的状态值，使终端渲染后续读取保持一致。
          setEnvironments(result.availableEnvironments);
          // setSelectedEnvironment 写入新的状态值，使终端渲染后续读取保持一致。
          setSelectedEnvironment(result.selectedEnvironment);
          // setSelectedEnvironmentSource 写入新的状态值，使终端渲染后续读取保持一致。
          setSelectedEnvironmentSource(result.selectedEnvironmentSource);
          // setLoadingState 写入新的状态值，使终端渲染后续读取保持一致。
          setLoadingState(null);
        } catch (t4) {
          // err 命名 `t4`，让后续代码直接表达这个值的用途。
          const err = t4;
          // 满足 `cancelled` 时，终端渲染执行该分支。
          if (cancelled) {
            // 终端 UI 组件 Remote Environment Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
          // fetchError 错误信息保存`toError`，供终端渲染后续处理使用。
          const fetchError = toError(err);
          // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
          logError(fetchError);
          // setError 写入新的状态值，使终端渲染后续读取保持一致。
          setError(fetchError.message);
          // setLoadingState 写入新的状态值，使终端渲染后续读取保持一致。
          setLoadingState(null);
        }
      };
      // 调用 fetchInfo，触发终端渲染此处需要的副作用。
      fetchInfo();
      // 返回 `() => {`，作为终端渲染这次计算的结果。
      return () => {
        // cancelled更新为 `true`，确保终端 UI后续读取最新状态。
        cancelled = true;
      };
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
  // t4 暂存 `function handleSelect(value) {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== environments || $[4] !== onDone) {
    // t4 暂存 `function handleSelect(value) {` 生成的渲染片段，后续返回路径直接复用。
    t4 = function handleSelect(value) {
      // 当 `value` 匹配 `"cancel"` 时，终端渲染执行对应分支。
      if (value === "cancel") {
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone();
        // 终端 UI 组件 Remote Environment Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setLoadingState 写入新的状态值，使终端渲染后续读取保持一致。
      setLoadingState("updating");
      // selectedEnv筛选`environments.find`，供终端渲染后续处理使用。
      const selectedEnv = environments.find(env => env.environment_id === value);
      // selectedEnv缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!selectedEnv) {
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone("Error: Selected environment not found");
        // 终端 UI 组件 Remote Environment Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
      updateSettingsForSource("localSettings", {
        remote: {
          defaultEnvironmentId: selectedEnv.environment_id
        }
      });
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone(`Set default remote environment to ${chalk.bold(selectedEnv.name)} (${selectedEnv.environment_id})`);
    };
    // $[3] 缓存 `environments`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = environments;
    // $[4] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onDone;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // handleSelect沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t4;
  // 当 `loadingState` 匹配 `"loading"` 时，终端渲染执行对应分支。
  if (loadingState === "loading") {
    // t5 暂存 `<LoadingState message={"Loading environments\u2026"} />` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<LoadingState message={"Loading environments\u2026"} />` 生成的渲染片段，后续返回路径直接复用。
      t5 = <LoadingState message={"Loading environments\u2026"} />;
      // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[6];
    }
    // t6 暂存 `<Dialog title={DIALOG_TITLE} onCancel={onDone} hideInputG...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== onDone) {
      // t6 暂存 `<Dialog title={DIALOG_TITLE} onCancel={onDone} hideInputG...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Dialog title={DIALOG_TITLE} onCancel={onDone} hideInputGuide={true}>{t5}</Dialog>;
      // $[7] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = onDone;
      // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[8];
    }
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
  // 满足 `error` 时，终端渲染执行该分支。
  if (error) {
    // t5 暂存 `<Text color="error">Error: {error}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[9] !== error) {
      // t5 暂存 `<Text color="error">Error: {error}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text color="error">Error: {error}</Text>;
      // $[9] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = error;
      // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[10];
    }
    // t6 暂存 `<Dialog title={DIALOG_TITLE} onCancel={onDone}>{t5}</Dial...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[11] !== onDone || $[12] !== t5) {
      // t6 暂存 `<Dialog title={DIALOG_TITLE} onCancel={onDone}>{t5}</Dial...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Dialog title={DIALOG_TITLE} onCancel={onDone}>{t5}</Dialog>;
      // $[11] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = onDone;
      // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t5;
      // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[13];
    }
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
  // selectedEnvironment缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!selectedEnvironment) {
    // t5 暂存 `<Text>No remote environments available.</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<Text>No remote environments available.</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text>No remote environments available.</Text>;
      // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[14];
    }
    // t6 暂存 `<Dialog title={DIALOG_TITLE} subtitle={SETUP_HINT} onCanc...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[15] !== onDone) {
      // t6 暂存 `<Dialog title={DIALOG_TITLE} subtitle={SETUP_HINT} onCanc...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Dialog title={DIALOG_TITLE} subtitle={SETUP_HINT} onCancel={onDone}>{t5}</Dialog>;
      // $[15] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = onDone;
      // $[16] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[16];
    }
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
  // 满足 `environments.length === 1` 时，终端渲染执行该分支。
  if (environments.length === 1) {
    // t5 暂存 `<SingleEnvironmentContent environment={selectedEnvironmen...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== onDone || $[18] !== selectedEnvironment) {
      // t5 暂存 `<SingleEnvironmentContent environment={selectedEnvironmen...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <SingleEnvironmentContent environment={selectedEnvironment} onDone={onDone} />;
      // $[17] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = onDone;
      // $[18] 缓存 `selectedEnvironment`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = selectedEnvironment;
      // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[19];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // t5 暂存 `<MultipleEnvironmentsContent environments={environments} ...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== environments || $[21] !== handleSelect || $[22] !== loadingState || $[23] !== onDone || $[24] !== selectedEnvironment || $[25] !== selectedEnvironmentSource) {
    // t5 暂存 `<MultipleEnvironmentsContent environments={environments} ...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <MultipleEnvironmentsContent environments={environments} selectedEnvironment={selectedEnvironment} selectedEnvironmentSource={selectedEnvironmentSource} loadingState={loadingState} onSelect={handleSelect} onCancel={onDone} />;
    // $[20] 缓存 `environments`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = environments;
    // $[21] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = handleSelect;
    // $[22] 缓存 `loadingState`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = loadingState;
    // $[23] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = onDone;
    // $[24] 缓存 `selectedEnvironment`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = selectedEnvironment;
    // $[25] 缓存 `selectedEnvironmentSource`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = selectedEnvironmentSource;
    // $[26] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[26];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// EnvironmentLabel 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function EnvironmentLabel(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    environment
  } = t0;
  // t1 暂存 `<Text bold={true}>{environment.name}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== environment.name) {
    // t1 暂存 `<Text bold={true}>{environment.name}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text bold={true}>{environment.name}</Text>;
    // $[0] 缓存 `environment.name`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = environment.name;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `<Text dimColor={true}>({environment.environment_id})</Tex...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== environment.environment_id) {
    // t2 暂存 `<Text dimColor={true}>({environment.environment_id})</Tex...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>({environment.environment_id})</Text>;
    // $[2] 缓存 `environment.environment_id`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = environment.environment_id;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Text>{figures.tick} Using {t1}{" "}{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== t1 || $[5] !== t2) {
    // t3 暂存 `<Text>{figures.tick} Using {t1}{" "}{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>{figures.tick} Using {t1}{" "}{t2}</Text>;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// SingleEnvironmentContent 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SingleEnvironmentContent(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    environment,
    onDone
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
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:yes", onDone, t1);
  // t2 暂存 `<EnvironmentLabel environment={environment} />` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== environment) {
    // t2 暂存 `<EnvironmentLabel environment={environment} />` 生成的渲染片段，后续返回路径直接复用。
    t2 = <EnvironmentLabel environment={environment} />;
    // $[1] 缓存 `environment`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = environment;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `<Dialog title={DIALOG_TITLE} subtitle={SETUP_HINT} onCanc...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onDone || $[4] !== t2) {
    // t3 暂存 `<Dialog title={DIALOG_TITLE} subtitle={SETUP_HINT} onCanc...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Dialog title={DIALOG_TITLE} subtitle={SETUP_HINT} onCancel={onDone}>{t2}</Dialog>;
    // $[3] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onDone;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// MultipleEnvironmentsContent 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function MultipleEnvironmentsContent(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    environments,
    selectedEnvironment,
    selectedEnvironmentSource,
    loadingState,
    onSelect,
    onCancel
  } = t0;
  // t1 暂存 `selectedEnvironmentSource && selectedEnvironmentSource !=...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== selectedEnvironmentSource) {
    // t1 暂存 `selectedEnvironmentSource && selectedEnvironmentSource !=...` 生成的渲染片段，后续返回路径直接复用。
    t1 = selectedEnvironmentSource && selectedEnvironmentSource !== "localSettings" ? ` (from ${getSettingSourceName(selectedEnvironmentSource)} settings)` : "";
    // $[0] 缓存 `selectedEnvironmentSource`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = selectedEnvironmentSource;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // sourceSuffix沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const sourceSuffix = t1;
  // t2 暂存 `<Text bold={true}>{selectedEnvironment.name}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== selectedEnvironment.name) {
    // t2 暂存 `<Text bold={true}>{selectedEnvironment.name}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text bold={true}>{selectedEnvironment.name}</Text>;
    // $[2] 缓存 `selectedEnvironment.name`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = selectedEnvironment.name;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Text>Currently using: {t2}{sourceSuffix}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== sourceSuffix || $[5] !== t2) {
    // t3 暂存 `<Text>Currently using: {t2}{sourceSuffix}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>Currently using: {t2}{sourceSuffix}</Text>;
    // $[4] 缓存 `sourceSuffix`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = sourceSuffix;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // subtitle 标题 命名 `t3`，让后续代码直接表达这个值的用途。
  const subtitle = t3;
  // t4 暂存 `<Text dimColor={true}>{SETUP_HINT}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text dimColor={true}>{SETUP_HINT}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text dimColor={true}>{SETUP_HINT}</Text>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `loadingState === "updating" ? <LoadingState message={"Upd...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== environments || $[9] !== loadingState || $[10] !== onSelect || $[11] !== selectedEnvironment.environment_id) {
    // t5 暂存 `loadingState === "updating" ? <LoadingState message={"Upd...` 生成的渲染片段，后续返回路径直接复用。
    t5 = loadingState === "updating" ? <LoadingState message={"Updating\u2026"} /> : <Select options={environments.map(_temp)} defaultValue={selectedEnvironment.environment_id} onChange={onSelect} onCancel={() => onSelect("cancel")} layout="compact-vertical" />;
    // $[8] 缓存 `environments`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = environments;
    // $[9] 缓存 `loadingState`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = loadingState;
    // $[10] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onSelect;
    // $[11] 缓存 `selectedEnvironment.environment_id`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = selectedEnvironment.environment_id;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // t6 暂存 `<Text dimColor={true}><Byline><KeyboardShortcutHint short...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Text dimColor={true}><Byline><KeyboardShortcutHint short...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text dimColor={true}><Byline><KeyboardShortcutHint shortcut="Enter" action="select" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="cancel" /></Byline></Text>;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // t7 暂存 `<Dialog title={DIALOG_TITLE} subtitle={subtitle} onCancel...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== onCancel || $[15] !== subtitle || $[16] !== t5) {
    // t7 暂存 `<Dialog title={DIALOG_TITLE} subtitle={subtitle} onCancel...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Dialog title={DIALOG_TITLE} subtitle={subtitle} onCancel={onCancel} hideInputGuide={true}>{t4}{t5}{t6}</Dialog>;
    // $[14] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = onCancel;
    // $[15] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = subtitle;
    // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t5;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[17];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(env) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    label: <Text>{env.name} <Text dimColor={true}>({env.environment_id})</Text></Text>,
    value: env.environment_id
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsImZpZ3VyZXMiLCJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiVGV4dCIsInVzZUtleWJpbmRpbmciLCJ0b0Vycm9yIiwibG9nRXJyb3IiLCJnZXRTZXR0aW5nU291cmNlTmFtZSIsIlNldHRpbmdTb3VyY2UiLCJ1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSIsImdldEVudmlyb25tZW50U2VsZWN0aW9uSW5mbyIsIkVudmlyb25tZW50UmVzb3VyY2UiLCJDb25maWd1cmFibGVTaG9ydGN1dEhpbnQiLCJTZWxlY3QiLCJCeWxpbmUiLCJEaWFsb2ciLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIkxvYWRpbmdTdGF0ZSIsIkRJQUxPR19USVRMRSIsIlNFVFVQX0hJTlQiLCJQcm9wcyIsIm9uRG9uZSIsIm1lc3NhZ2UiLCJSZW1vdGVFbnZpcm9ubWVudERpYWxvZyIsInQwIiwiJCIsIl9jIiwibG9hZGluZ1N0YXRlIiwic2V0TG9hZGluZ1N0YXRlIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJlbnZpcm9ubWVudHMiLCJzZXRFbnZpcm9ubWVudHMiLCJzZWxlY3RlZEVudmlyb25tZW50Iiwic2V0U2VsZWN0ZWRFbnZpcm9ubWVudCIsInNlbGVjdGVkRW52aXJvbm1lbnRTb3VyY2UiLCJzZXRTZWxlY3RlZEVudmlyb25tZW50U291cmNlIiwiZXJyb3IiLCJzZXRFcnJvciIsInQyIiwidDMiLCJjYW5jZWxsZWQiLCJmZXRjaEluZm8iLCJyZXN1bHQiLCJhdmFpbGFibGVFbnZpcm9ubWVudHMiLCJ0NCIsImVyciIsImZldGNoRXJyb3IiLCJoYW5kbGVTZWxlY3QiLCJ2YWx1ZSIsInNlbGVjdGVkRW52IiwiZmluZCIsImVudiIsImVudmlyb25tZW50X2lkIiwicmVtb3RlIiwiZGVmYXVsdEVudmlyb25tZW50SWQiLCJib2xkIiwibmFtZSIsInQ1IiwidDYiLCJsZW5ndGgiLCJFbnZpcm9ubWVudExhYmVsIiwiZW52aXJvbm1lbnQiLCJ0aWNrIiwiU2luZ2xlRW52aXJvbm1lbnRDb250ZW50IiwiY29udGV4dCIsIk11bHRpcGxlRW52aXJvbm1lbnRzQ29udGVudCIsIm9uU2VsZWN0Iiwib25DYW5jZWwiLCJzb3VyY2VTdWZmaXgiLCJzdWJ0aXRsZSIsIm1hcCIsIl90ZW1wIiwidDciLCJsYWJlbCJdLCJzb3VyY2VzIjpbIlJlbW90ZUVudmlyb25tZW50RGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyB0b0Vycm9yIH0gZnJvbSAnLi4vdXRpbHMvZXJyb3JzLmpzJ1xuaW1wb3J0IHsgbG9nRXJyb3IgfSBmcm9tICcuLi91dGlscy9sb2cuanMnXG5pbXBvcnQge1xuICBnZXRTZXR0aW5nU291cmNlTmFtZSxcbiAgdHlwZSBTZXR0aW5nU291cmNlLFxufSBmcm9tICcuLi91dGlscy9zZXR0aW5ncy9jb25zdGFudHMuanMnXG5pbXBvcnQgeyB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSB9IGZyb20gJy4uL3V0aWxzL3NldHRpbmdzL3NldHRpbmdzLmpzJ1xuaW1wb3J0IHsgZ2V0RW52aXJvbm1lbnRTZWxlY3Rpb25JbmZvIH0gZnJvbSAnLi4vdXRpbHMvdGVsZXBvcnQvZW52aXJvbm1lbnRTZWxlY3Rpb24uanMnXG5pbXBvcnQgdHlwZSB7IEVudmlyb25tZW50UmVzb3VyY2UgfSBmcm9tICcuLi91dGlscy90ZWxlcG9ydC9lbnZpcm9ubWVudHMuanMnXG5pbXBvcnQgeyBDb25maWd1cmFibGVTaG9ydGN1dEhpbnQgfSBmcm9tICcuL0NvbmZpZ3VyYWJsZVNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBMb2FkaW5nU3RhdGUgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vTG9hZGluZ1N0YXRlLmpzJ1xuXG5jb25zdCBESUFMT0dfVElUTEUgPSAnU2VsZWN0IFJlbW90ZSBFbnZpcm9ubWVudCdcbmNvbnN0IFNFVFVQX0hJTlQgPSBgQ29uZmlndXJlIGVudmlyb25tZW50cyBhdDogaHR0cHM6Ly9jbGF1ZGUuYWkvY29kZWBcblxudHlwZSBQcm9wcyA9IHtcbiAgb25Eb25lOiAobWVzc2FnZT86IHN0cmluZykgPT4gdm9pZFxufVxuXG50eXBlIExvYWRpbmdTdGF0ZSA9ICdsb2FkaW5nJyB8ICd1cGRhdGluZycgfCBudWxsXG5cbmV4cG9ydCBmdW5jdGlvbiBSZW1vdGVFbnZpcm9ubWVudERpYWxvZyh7IG9uRG9uZSB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtsb2FkaW5nU3RhdGUsIHNldExvYWRpbmdTdGF0ZV0gPSB1c2VTdGF0ZTxMb2FkaW5nU3RhdGU+KCdsb2FkaW5nJylcbiAgY29uc3QgW2Vudmlyb25tZW50cywgc2V0RW52aXJvbm1lbnRzXSA9IHVzZVN0YXRlPEVudmlyb25tZW50UmVzb3VyY2VbXT4oW10pXG4gIGNvbnN0IFtzZWxlY3RlZEVudmlyb25tZW50LCBzZXRTZWxlY3RlZEVudmlyb25tZW50XSA9XG4gICAgdXNlU3RhdGU8RW52aXJvbm1lbnRSZXNvdXJjZSB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtzZWxlY3RlZEVudmlyb25tZW50U291cmNlLCBzZXRTZWxlY3RlZEVudmlyb25tZW50U291cmNlXSA9XG4gICAgdXNlU3RhdGU8U2V0dGluZ1NvdXJjZSB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtlcnJvciwgc2V0RXJyb3JdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxldCBjYW5jZWxsZWQgPSBmYWxzZVxuICAgIGFzeW5jIGZ1bmN0aW9uIGZldGNoSW5mbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdldEVudmlyb25tZW50U2VsZWN0aW9uSW5mbygpXG4gICAgICAgIGlmIChjYW5jZWxsZWQpIHJldHVyblxuICAgICAgICBzZXRFbnZpcm9ubWVudHMocmVzdWx0LmF2YWlsYWJsZUVudmlyb25tZW50cylcbiAgICAgICAgc2V0U2VsZWN0ZWRFbnZpcm9ubWVudChyZXN1bHQuc2VsZWN0ZWRFbnZpcm9ubWVudClcbiAgICAgICAgc2V0U2VsZWN0ZWRFbnZpcm9ubWVudFNvdXJjZShyZXN1bHQuc2VsZWN0ZWRFbnZpcm9ubWVudFNvdXJjZSlcbiAgICAgICAgc2V0TG9hZGluZ1N0YXRlKG51bGwpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKGNhbmNlbGxlZCkgcmV0dXJuXG4gICAgICAgIGNvbnN0IGZldGNoRXJyb3IgPSB0b0Vycm9yKGVycilcbiAgICAgICAgbG9nRXJyb3IoZmV0Y2hFcnJvcilcbiAgICAgICAgc2V0RXJyb3IoZmV0Y2hFcnJvci5tZXNzYWdlKVxuICAgICAgICBzZXRMb2FkaW5nU3RhdGUobnVsbClcbiAgICAgIH1cbiAgICB9XG4gICAgdm9pZCBmZXRjaEluZm8oKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjYW5jZWxsZWQgPSB0cnVlXG4gICAgfVxuICB9LCBbXSlcblxuICBmdW5jdGlvbiBoYW5kbGVTZWxlY3QodmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh2YWx1ZSA9PT0gJ2NhbmNlbCcpIHtcbiAgICAgIG9uRG9uZSgpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBzZXRMb2FkaW5nU3RhdGUoJ3VwZGF0aW5nJylcblxuICAgIGNvbnN0IHNlbGVjdGVkRW52ID0gZW52aXJvbm1lbnRzLmZpbmQoZW52ID0+IGVudi5lbnZpcm9ubWVudF9pZCA9PT0gdmFsdWUpXG5cbiAgICBpZiAoIXNlbGVjdGVkRW52KSB7XG4gICAgICBvbkRvbmUoJ0Vycm9yOiBTZWxlY3RlZCBlbnZpcm9ubWVudCBub3QgZm91bmQnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UoJ2xvY2FsU2V0dGluZ3MnLCB7XG4gICAgICByZW1vdGU6IHtcbiAgICAgICAgZGVmYXVsdEVudmlyb25tZW50SWQ6IHNlbGVjdGVkRW52LmVudmlyb25tZW50X2lkLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgb25Eb25lKFxuICAgICAgYFNldCBkZWZhdWx0IHJlbW90ZSBlbnZpcm9ubWVudCB0byAke2NoYWxrLmJvbGQoc2VsZWN0ZWRFbnYubmFtZSl9ICgke3NlbGVjdGVkRW52LmVudmlyb25tZW50X2lkfSlgLFxuICAgIClcbiAgfVxuXG4gIC8vIExvYWRpbmcgc3RhdGVcbiAgaWYgKGxvYWRpbmdTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxEaWFsb2cgdGl0bGU9e0RJQUxPR19USVRMRX0gb25DYW5jZWw9e29uRG9uZX0gaGlkZUlucHV0R3VpZGU+XG4gICAgICAgIDxMb2FkaW5nU3RhdGUgbWVzc2FnZT1cIkxvYWRpbmcgZW52aXJvbm1lbnRz4oCmXCIgLz5cbiAgICAgIDwvRGlhbG9nPlxuICAgIClcbiAgfVxuXG4gIC8vIEVycm9yIHN0YXRlXG4gIGlmIChlcnJvcikge1xuICAgIHJldHVybiAoXG4gICAgICA8RGlhbG9nIHRpdGxlPXtESUFMT0dfVElUTEV9IG9uQ2FuY2VsPXtvbkRvbmV9PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+RXJyb3I6IHtlcnJvcn08L1RleHQ+XG4gICAgICA8L0RpYWxvZz5cbiAgICApXG4gIH1cblxuICAvLyBObyBlbnZpcm9ubWVudHMgYXZhaWxhYmxlXG4gIGlmICghc2VsZWN0ZWRFbnZpcm9ubWVudCkge1xuICAgIHJldHVybiAoXG4gICAgICA8RGlhbG9nIHRpdGxlPXtESUFMT0dfVElUTEV9IHN1YnRpdGxlPXtTRVRVUF9ISU5UfSBvbkNhbmNlbD17b25Eb25lfT5cbiAgICAgICAgPFRleHQ+Tm8gcmVtb3RlIGVudmlyb25tZW50cyBhdmFpbGFibGUuPC9UZXh0PlxuICAgICAgPC9EaWFsb2c+XG4gICAgKVxuICB9XG5cbiAgLy8gU2luZ2xlIGVudmlyb25tZW50IC0ganVzdCBzaG93IGluZm9cbiAgaWYgKGVudmlyb25tZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFNpbmdsZUVudmlyb25tZW50Q29udGVudFxuICAgICAgICBlbnZpcm9ubWVudD17c2VsZWN0ZWRFbnZpcm9ubWVudH1cbiAgICAgICAgb25Eb25lPXtvbkRvbmV9XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIC8vIE11bHRpcGxlIGVudmlyb25tZW50cyAtIHNob3cgc2VsZWN0aW9uIFVJXG4gIHJldHVybiAoXG4gICAgPE11bHRpcGxlRW52aXJvbm1lbnRzQ29udGVudFxuICAgICAgZW52aXJvbm1lbnRzPXtlbnZpcm9ubWVudHN9XG4gICAgICBzZWxlY3RlZEVudmlyb25tZW50PXtzZWxlY3RlZEVudmlyb25tZW50fVxuICAgICAgc2VsZWN0ZWRFbnZpcm9ubWVudFNvdXJjZT17c2VsZWN0ZWRFbnZpcm9ubWVudFNvdXJjZX1cbiAgICAgIGxvYWRpbmdTdGF0ZT17bG9hZGluZ1N0YXRlfVxuICAgICAgb25TZWxlY3Q9e2hhbmRsZVNlbGVjdH1cbiAgICAgIG9uQ2FuY2VsPXtvbkRvbmV9XG4gICAgLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBFbnZpcm9ubWVudExhYmVsKHtcbiAgZW52aXJvbm1lbnQsXG59OiB7XG4gIGVudmlyb25tZW50OiBFbnZpcm9ubWVudFJlc291cmNlXG59KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8VGV4dD5cbiAgICAgIHtmaWd1cmVzLnRpY2t9IFVzaW5nIDxUZXh0IGJvbGQ+e2Vudmlyb25tZW50Lm5hbWV9PC9UZXh0PnsnICd9XG4gICAgICA8VGV4dCBkaW1Db2xvcj4oe2Vudmlyb25tZW50LmVudmlyb25tZW50X2lkfSk8L1RleHQ+XG4gICAgPC9UZXh0PlxuICApXG59XG5cbmZ1bmN0aW9uIFNpbmdsZUVudmlyb25tZW50Q29udGVudCh7XG4gIGVudmlyb25tZW50LFxuICBvbkRvbmUsXG59OiB7XG4gIGVudmlyb25tZW50OiBFbnZpcm9ubWVudFJlc291cmNlXG4gIG9uRG9uZTogKCkgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIEhhbmRsZSBFbnRlciB0byBjb250aW51ZVxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOnllcycsIG9uRG9uZSwgeyBjb250ZXh0OiAnQ29uZmlybWF0aW9uJyB9KVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZyB0aXRsZT17RElBTE9HX1RJVExFfSBzdWJ0aXRsZT17U0VUVVBfSElOVH0gb25DYW5jZWw9e29uRG9uZX0+XG4gICAgICA8RW52aXJvbm1lbnRMYWJlbCBlbnZpcm9ubWVudD17ZW52aXJvbm1lbnR9IC8+XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cblxuZnVuY3Rpb24gTXVsdGlwbGVFbnZpcm9ubWVudHNDb250ZW50KHtcbiAgZW52aXJvbm1lbnRzLFxuICBzZWxlY3RlZEVudmlyb25tZW50LFxuICBzZWxlY3RlZEVudmlyb25tZW50U291cmNlLFxuICBsb2FkaW5nU3RhdGUsXG4gIG9uU2VsZWN0LFxuICBvbkNhbmNlbCxcbn06IHtcbiAgZW52aXJvbm1lbnRzOiBFbnZpcm9ubWVudFJlc291cmNlW11cbiAgc2VsZWN0ZWRFbnZpcm9ubWVudDogRW52aXJvbm1lbnRSZXNvdXJjZVxuICBzZWxlY3RlZEVudmlyb25tZW50U291cmNlOiBTZXR0aW5nU291cmNlIHwgbnVsbFxuICBsb2FkaW5nU3RhdGU6IExvYWRpbmdTdGF0ZVxuICBvblNlbGVjdDogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBzb3VyY2VTdWZmaXggPVxuICAgIHNlbGVjdGVkRW52aXJvbm1lbnRTb3VyY2UgJiYgc2VsZWN0ZWRFbnZpcm9ubWVudFNvdXJjZSAhPT0gJ2xvY2FsU2V0dGluZ3MnXG4gICAgICA/IGAgKGZyb20gJHtnZXRTZXR0aW5nU291cmNlTmFtZShzZWxlY3RlZEVudmlyb25tZW50U291cmNlKX0gc2V0dGluZ3MpYFxuICAgICAgOiAnJ1xuXG4gIGNvbnN0IHN1YnRpdGxlID0gKFxuICAgIDxUZXh0PlxuICAgICAgQ3VycmVudGx5IHVzaW5nOiA8VGV4dCBib2xkPntzZWxlY3RlZEVudmlyb25tZW50Lm5hbWV9PC9UZXh0PlxuICAgICAge3NvdXJjZVN1ZmZpeH1cbiAgICA8L1RleHQ+XG4gIClcblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2dcbiAgICAgIHRpdGxlPXtESUFMT0dfVElUTEV9XG4gICAgICBzdWJ0aXRsZT17c3VidGl0bGV9XG4gICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICBoaWRlSW5wdXRHdWlkZVxuICAgID5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPntTRVRVUF9ISU5UfTwvVGV4dD5cbiAgICAgIHtsb2FkaW5nU3RhdGUgPT09ICd1cGRhdGluZycgPyAoXG4gICAgICAgIDxMb2FkaW5nU3RhdGUgbWVzc2FnZT1cIlVwZGF0aW5n4oCmXCIgLz5cbiAgICAgICkgOiAoXG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBvcHRpb25zPXtlbnZpcm9ubWVudHMubWFwKGVudiA9PiAoe1xuICAgICAgICAgICAgbGFiZWw6IChcbiAgICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgICAge2Vudi5uYW1lfSA8VGV4dCBkaW1Db2xvcj4oe2Vudi5lbnZpcm9ubWVudF9pZH0pPC9UZXh0PlxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgdmFsdWU6IGVudi5lbnZpcm9ubWVudF9pZCxcbiAgICAgICAgICB9KSl9XG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtzZWxlY3RlZEVudmlyb25tZW50LmVudmlyb25tZW50X2lkfVxuICAgICAgICAgIG9uQ2hhbmdlPXtvblNlbGVjdH1cbiAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gb25TZWxlY3QoJ2NhbmNlbCcpfVxuICAgICAgICAgIGxheW91dD1cImNvbXBhY3QtdmVydGljYWxcIlxuICAgICAgICAvPlxuICAgICAgKX1cbiAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICA8QnlsaW5lPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwic2VsZWN0XCIgLz5cbiAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICAgIGNvbnRleHQ9XCJDb25maXJtYXRpb25cIlxuICAgICAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb249XCJjYW5jZWxcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQnlsaW5lPlxuICAgICAgPC9UZXh0PlxuICAgIDwvRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixPQUFPQyxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPLEtBQUtD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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useState } from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 getDisplayPath 工具函数，把通用处理留在 ../utils/file.js 中维护。
import { getDisplayPath } from '../utils/file.js';
// 复用 removePathFromRepo、validateRepoAtPath 工具函数，把通用处理留在 ../utils/githubRepoPathMapping.js 中维护。
import { removePathFromRepo, validateRepoAtPath } from '../utils/githubRepoPathMapping.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// 引入 Spinner，将 ./Spinner.js 中已经封装好的能力接到本文件流程里。
import { Spinner } from './Spinner.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  targetRepo: string;
  initialPaths: string[];
  // 这个回调绑定到 onSelectPath: (path: string) => void;，负责终端渲染在该局部场景下的响应。
  onSelectPath: (path: string) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
};
// TeleportRepoMismatchDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TeleportRepoMismatchDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    targetRepo,
    initialPaths,
    onSelectPath,
    onCancel
  } = t0;
  // availablePaths 路径数据 由 React state 持有，setAvailablePaths 会在用户操作或异步结果返回时触发刷新。
  const [availablePaths, setAvailablePaths] = useState(initialPaths);
  // errorMessage 消息数据 由 React state 持有，setErrorMessage 会在用户操作或异步结果返回时触发刷新。
  const [errorMessage, setErrorMessage] = useState(null);
  // validating 由 React state 持有，setValidating 会在用户操作或异步结果返回时触发刷新。
  const [validating, setValidating] = useState(false);
  // t1 暂存 `async value => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== availablePaths || $[1] !== onCancel || $[2] !== onSelectPath || $[3] !== targetRepo) {
    // t1 暂存 `async value => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = async value => {
      // 当 `value` 匹配 `"cancel"` 时，终端渲染执行对应分支。
      if (value === "cancel") {
        // 调用 onCancel，触发终端渲染此处需要的副作用。
        onCancel();
        // 终端 UI 组件 Teleport Repo Mismatch Dia...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setValidating 写入新的状态值，使终端渲染后续读取保持一致。
      setValidating(true);
      // setErrorMessage 写入新的状态值，使终端渲染后续读取保持一致。
      setErrorMessage(null);
      // isValid记录 `validateRepoAtPath` 是否成立，终端渲染随后按该结果分支。
      const isValid = await validateRepoAtPath(value, targetRepo);
      // 满足 `isValid` 时，终端渲染执行该分支。
      if (isValid) {
        // 调用 onSelectPath，触发终端渲染此处需要的副作用。
        onSelectPath(value);
        // 终端 UI 组件 Teleport Repo Mismatch Dia...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 removePathFromRepo，触发终端渲染此处需要的副作用。
      removePathFromRepo(targetRepo, value);
      // updatedPaths 路径数据筛选`availablePaths.filter`，供终端渲染后续处理使用。
      const updatedPaths = availablePaths.filter(p => p !== value);
      // setAvailablePaths 写入新的状态值，使终端渲染后续读取保持一致。
      setAvailablePaths(updatedPaths);
      // setValidating 写入新的状态值，使终端渲染后续读取保持一致。
      setValidating(false);
      // setErrorMessage 写入新的状态值，使终端渲染后续读取保持一致。
      setErrorMessage(`${getDisplayPath(value)} no longer contains the correct repository. Select another path.`);
    };
    // $[0] 缓存 `availablePaths`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = availablePaths;
    // $[1] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onCancel;
    // $[2] 缓存 `onSelectPath`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onSelectPath;
    // $[3] 缓存 `targetRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = targetRepo;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // handleChange 命名 `t1`，让后续代码直接表达这个值的用途。
  const handleChange = t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== availablePaths) {
    // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t3 = {
        label: "Cancel",
        value: "cancel"
      };
      // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[7];
    }
    // t2 暂存 `[...availablePaths.map(_temp), t3]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [...availablePaths.map(_temp), t3];
    // $[5] 缓存 `availablePaths`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = availablePaths;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // 选项沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const options = t2;
  // t3 暂存 `availablePaths.length > 0 ? <><Box flexDirection="column"...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== availablePaths.length || $[9] !== errorMessage || $[10] !== handleChange || $[11] !== options || $[12] !== targetRepo || $[13] !== validating) {
    // t3 暂存 `availablePaths.length > 0 ? <><Box flexDirection="column"...` 生成的渲染片段，后续返回路径直接复用。
    t3 = availablePaths.length > 0 ? <><Box flexDirection="column" gap={1}>{errorMessage && <Text color="error">{errorMessage}</Text>}<Text>Open Claude Code in <Text bold={true}>{targetRepo}</Text>:</Text></Box>{validating ? <Box><Spinner /><Text> Validating repository…</Text></Box> : <Select options={options} onChange={value_0 => void handleChange(value_0)} />}</> : <Box flexDirection="column" gap={1}>{errorMessage && <Text color="error">{errorMessage}</Text>}<Text dimColor={true}>Run claude --teleport from a checkout of {targetRepo}</Text></Box>;
    // $[8] 缓存 `availablePaths.length`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = availablePaths.length;
    // $[9] 缓存 `errorMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = errorMessage;
    // $[10] 缓存 `handleChange`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = handleChange;
    // $[11] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = options;
    // $[12] 缓存 `targetRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = targetRepo;
    // $[13] 缓存 `validating`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = validating;
    // $[14] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[14];
  }
  // t4 暂存 `<Dialog title="Teleport to Repo" onCancel={onCancel} colo...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== onCancel || $[16] !== t3) {
    // t4 暂存 `<Dialog title="Teleport to Repo" onCancel={onCancel} colo...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Dialog title="Teleport to Repo" onCancel={onCancel} color="background">{t3}</Dialog>;
    // $[15] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = onCancel;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
    // $[17] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[17];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(path) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    label: <Text>Use <Text bold={true}>{getDisplayPath(path)}</Text></Text>,
    value: path
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlU3RhdGUiLCJCb3giLCJUZXh0IiwiZ2V0RGlzcGxheVBhdGgiLCJyZW1vdmVQYXRoRnJvbVJlcG8iLCJ2YWxpZGF0ZVJlcG9BdFBhdGgiLCJTZWxlY3QiLCJEaWFsb2ciLCJTcGlubmVyIiwiUHJvcHMiLCJ0YXJnZXRSZXBvIiwiaW5pdGlhbFBhdGhzIiwib25TZWxlY3RQYXRoIiwicGF0aCIsIm9uQ2FuY2VsIiwiVGVsZXBvcnRSZXBvTWlzbWF0Y2hEaWFsb2ciLCJ0MCIsIiQiLCJfYyIsImF2YWlsYWJsZVBhdGhzIiwic2V0QXZhaWxhYmxlUGF0aHMiLCJlcnJvck1lc3NhZ2UiLCJzZXRFcnJvck1lc3NhZ2UiLCJ2YWxpZGF0aW5nIiwic2V0VmFsaWRhdGluZyIsInQxIiwidmFsdWUiLCJpc1ZhbGlkIiwidXBkYXRlZFBhdGhzIiwiZmlsdGVyIiwicCIsImhhbmRsZUNoYW5nZSIsInQyIiwidDMiLCJTeW1ib2wiLCJmb3IiLCJsYWJlbCIsIm1hcCIsIl90ZW1wIiwib3B0aW9ucyIsImxlbmd0aCIsInZhbHVlXzAiLCJ0NCJdLCJzb3VyY2VzIjpbIlRlbGVwb3J0UmVwb01pc21hdGNoRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBnZXREaXNwbGF5UGF0aCB9IGZyb20gJy4uL3V0aWxzL2ZpbGUuanMnXG5pbXBvcnQge1xuICByZW1vdmVQYXRoRnJvbVJlcG8sXG4gIHZhbGlkYXRlUmVwb0F0UGF0aCxcbn0gZnJvbSAnLi4vdXRpbHMvZ2l0aHViUmVwb1BhdGhNYXBwaW5nLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gJy4vU3Bpbm5lci5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgdGFyZ2V0UmVwbzogc3RyaW5nXG4gIGluaXRpYWxQYXRoczogc3RyaW5nW11cbiAgb25TZWxlY3RQYXRoOiAocGF0aDogc3RyaW5nKSA9PiB2b2lkXG4gIG9uQ2FuY2VsOiAoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBUZWxlcG9ydFJlcG9NaXNtYXRjaERpYWxvZyh7XG4gIHRhcmdldFJlcG8sXG4gIGluaXRpYWxQYXRocyxcbiAgb25TZWxlY3RQYXRoLFxuICBvbkNhbmNlbCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW2F2YWlsYWJsZVBhdGhzLCBzZXRBdmFpbGFibGVQYXRoc10gPSB1c2VTdGF0ZTxzdHJpbmdbXT4oaW5pdGlhbFBhdGhzKVxuICBjb25zdCBbZXJyb3JNZXNzYWdlLCBzZXRFcnJvck1lc3NhZ2VdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW3ZhbGlkYXRpbmcsIHNldFZhbGlkYXRpbmddID0gdXNlU3RhdGUoZmFsc2UpXG5cbiAgY29uc3QgaGFuZGxlQ2hhbmdlID0gdXNlQ2FsbGJhY2soXG4gICAgYXN5bmMgKHZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gJ2NhbmNlbCcpIHtcbiAgICAgICAgb25DYW5jZWwoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgc2V0VmFsaWRhdGluZyh0cnVlKVxuICAgICAgc2V0RXJyb3JNZXNzYWdlKG51bGwpXG5cbiAgICAgIGNvbnN0IGlzVmFsaWQgPSBhd2FpdCB2YWxpZGF0ZVJlcG9BdFBhdGgodmFsdWUsIHRhcmdldFJlcG8pXG5cbiAgICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAgIG9uU2VsZWN0UGF0aCh2YWx1ZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIC8vIFBhdGggaXMgaW52YWxpZCAtIHJlbW92ZSBpdCBmcm9tIGNvbmZpZyBhbmQgdXBkYXRlIHN0YXRlXG4gICAgICByZW1vdmVQYXRoRnJvbVJlcG8odGFyZ2V0UmVwbywgdmFsdWUpXG4gICAgICBjb25zdCB1cGRhdGVkUGF0aHMgPSBhdmFpbGFibGVQYXRocy5maWx0ZXIocCA9PiBwICE9PSB2YWx1ZSlcbiAgICAgIHNldEF2YWlsYWJsZVBhdGhzKHVwZGF0ZWRQYXRocylcbiAgICAgIHNldFZhbGlkYXRpbmcoZmFsc2UpXG5cbiAgICAgIHNldEVycm9yTWVzc2FnZShcbiAgICAgICAgYCR7Z2V0RGlzcGxheVBhdGgodmFsdWUpfSBubyBsb25nZXIgY29udGFpbnMgdGhlIGNvcnJlY3QgcmVwb3NpdG9yeS4gU2VsZWN0IGFub3RoZXIgcGF0aC5gLFxuICAgICAgKVxuICAgIH0sXG4gICAgW3RhcmdldFJlcG8sIGF2YWlsYWJsZVBhdGhzLCBvblNlbGVjdFBhdGgsIG9uQ2FuY2VsXSxcbiAgKVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBbXG4gICAgLi4uYXZhaWxhYmxlUGF0aHMubWFwKHBhdGggPT4gKHtcbiAgICAgIGxhYmVsOiAoXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIFVzZSA8VGV4dCBib2xkPntnZXREaXNwbGF5UGF0aChwYXRoKX08L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICksXG4gICAgICB2YWx1ZTogcGF0aCxcbiAgICB9KSksXG4gICAgeyBsYWJlbDogJ0NhbmNlbCcsIHZhbHVlOiAnY2FuY2VsJyB9LFxuICBdXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nIHRpdGxlPVwiVGVsZXBvcnQgdG8gUmVwb1wiIG9uQ2FuY2VsPXtvbkNhbmNlbH0gY29sb3I9XCJiYWNrZ3JvdW5kXCI+XG4gICAgICB7YXZhaWxhYmxlUGF0aHMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICAgICAge2Vycm9yTWVzc2FnZSAmJiA8VGV4dCBjb2xvcj1cImVycm9yXCI+e2Vycm9yTWVzc2FnZX08L1RleHQ+fVxuICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgIE9wZW4gQ2xhdWRlIENvZGUgaW4gPFRleHQgYm9sZD57dGFyZ2V0UmVwb308L1RleHQ+OlxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuXG4gICAgICAgICAge3ZhbGlkYXRpbmcgPyAoXG4gICAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgICA8U3Bpbm5lciAvPlxuICAgICAgICAgICAgICA8VGV4dD4gVmFsaWRhdGluZyByZXBvc2l0b3J54oCmPC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxTZWxlY3RcbiAgICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IHZvaWQgaGFuZGxlQ2hhbmdlKHZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC8+XG4gICAgICApIDogKFxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICAgIHtlcnJvck1lc3NhZ2UgJiYgPFRleHQgY29sb3I9XCJlcnJvclwiPntlcnJvck1lc3NhZ2V9PC9UZXh0Pn1cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIFJ1biBjbGF1ZGUgLS10ZWxlcG9ydCBmcm9tIGEgY2hlY2tvdXQgb2Yge3RhcmdldFJlcG99XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsV0FBVyxFQUFFQyxRQUFRLFFBQVEs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
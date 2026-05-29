// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback } from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js';
// 复用 isSupportedTerminal 工具函数，把通用处理留在 ../utils/ide.js 中维护。
import { isSupportedTerminal } from '../utils/ide.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// IdeAutoConnectDialogProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type IdeAutoConnectDialogProps = {
  // 这个回调绑定到 onComplete: () => void;，负责终端渲染在该局部场景下的响应。
  onComplete: () => void;
};
// IdeAutoConnectDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function IdeAutoConnectDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onComplete
  } = t0;
  // t1 暂存 `async value => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onComplete) {
    // t1 暂存 `async value => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = async value => {
      // autoConnect标记终端 UI Ide Auto Connect Dia...是否启用对应路径。
      const autoConnect = value === "yes";
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        autoConnectIde: autoConnect,
        hasIdeAutoConnectDialogBeenShown: true
      }));
      // 调用 onComplete，触发终端渲染此处需要的副作用。
      onComplete();
    };
    // $[0] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onComplete;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // handleSelect 命名 `t1`，让后续代码直接表达这个值的用途。
  const handleSelect = t1;
  // t2 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t2 = [{
      label: "Yes",
      value: "yes"
    }, {
      label: "No",
      value: "no"
    }];
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 选项沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const options = t2;
  // t3 暂存 `<Select options={options} onChange={handleSelect} default...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== handleSelect) {
    // t3 暂存 `<Select options={options} onChange={handleSelect} default...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Select options={options} onChange={handleSelect} defaultValue="yes" />;
    // $[3] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = handleSelect;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<Text dimColor={true}>You can also configure this in /con...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text dimColor={true}>You can also configure this in /con...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text dimColor={true}>You can also configure this in /config or with the --ide flag</Text>;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `<Dialog title="Do you wish to enable auto-connect to IDE?...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== onComplete || $[7] !== t3) {
    // t5 暂存 `<Dialog title="Do you wish to enable auto-connect to IDE?...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Dialog title="Do you wish to enable auto-connect to IDE?" color="ide" onCancel={onComplete}>{t3}{t4}</Dialog>;
    // $[6] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onComplete;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// shouldShowAutoConnectDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowAutoConnectDialog(): boolean {
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // 返回 `!isSupportedTerminal() && config.autoConnectIde !== true && config.hasI...`，作为终端渲染这次计算的结果。
  return !isSupportedTerminal() && config.autoConnectIde !== true && config.hasIdeAutoConnectDialogBeenShown !== true;
}
// IdeDisableAutoConnectDialogProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type IdeDisableAutoConnectDialogProps = {
  // 这个回调绑定到 onComplete: (disableAutoConnect: boolean) => void;，负责终端渲染在该局部场景下的响应。
  onComplete: (disableAutoConnect: boolean) => void;
};
// IdeDisableAutoConnectDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function IdeDisableAutoConnectDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onComplete
  } = t0;
  // t1 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onComplete) {
    // t1 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = value => {
      // disableAutoConnect标记终端 UI Ide Auto Connect Dia...是否启用对应路径。
      const disableAutoConnect = value === "yes";
      // 满足 `disableAutoConnect` 时，终端渲染执行该分支。
      if (disableAutoConnect) {
        // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
        saveGlobalConfig(_temp);
      }
      // 调用 onComplete，触发终端渲染此处需要的副作用。
      onComplete(disableAutoConnect);
    };
    // $[0] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onComplete;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // handleSelect 命名 `t1`，让后续代码直接表达这个值的用途。
  const handleSelect = t1;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onComplete) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 调用 onComplete，触发终端渲染此处需要的副作用。
      onComplete(false);
    };
    // $[2] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onComplete;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // handleCancel 命名 `t2`，让后续代码直接表达这个值的用途。
  const handleCancel = t2;
  // t3 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t3 = [{
      label: "No",
      value: "no"
    }, {
      label: "Yes",
      value: "yes"
    }];
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 选项沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const options = t3;
  // t4 暂存 `<Select options={options} onChange={handleSelect} default...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== handleSelect) {
    // t4 暂存 `<Select options={options} onChange={handleSelect} default...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Select options={options} onChange={handleSelect} defaultValue="no" />;
    // $[5] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = handleSelect;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Dialog title="Do you wish to disable auto-connect to IDE...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== handleCancel || $[8] !== t4) {
    // t5 暂存 `<Dialog title="Do you wish to disable auto-connect to IDE...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Dialog title="Do you wish to disable auto-connect to IDE?" subtitle="You can also configure this in /config" onCancel={handleCancel} color="ide">{t4}</Dialog>;
    // $[7] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = handleCancel;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(current) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...current,
    autoConnectIde: false
  };
}
// shouldShowDisableAutoConnectDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowDisableAutoConnectDialog(): boolean {
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // 返回 `!isSupportedTerminal() && config.autoConnectIde === true`，作为终端渲染这次计算的结果。
  return !isSupportedTerminal() && config.autoConnectIde === true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwiVGV4dCIsImdldEdsb2JhbENvbmZpZyIsInNhdmVHbG9iYWxDb25maWciLCJpc1N1cHBvcnRlZFRlcm1pbmFsIiwiU2VsZWN0IiwiRGlhbG9nIiwiSWRlQXV0b0Nvbm5lY3REaWFsb2dQcm9wcyIsIm9uQ29tcGxldGUiLCJJZGVBdXRvQ29ubmVjdERpYWxvZyIsInQwIiwiJCIsIl9jIiwidDEiLCJ2YWx1ZSIsImF1dG9Db25uZWN0IiwiY3VycmVudCIsImF1dG9Db25uZWN0SWRlIiwiaGFzSWRlQXV0b0Nvbm5lY3REaWFsb2dCZWVuU2hvd24iLCJoYW5kbGVTZWxlY3QiLCJ0MiIsIlN5bWJvbCIsImZvciIsImxhYmVsIiwib3B0aW9ucyIsInQzIiwidDQiLCJ0NSIsInNob3VsZFNob3dBdXRvQ29ubmVjdERpYWxvZyIsImNvbmZpZyIsIklkZURpc2FibGVBdXRvQ29ubmVjdERpYWxvZ1Byb3BzIiwiZGlzYWJsZUF1dG9Db25uZWN0IiwiSWRlRGlzYWJsZUF1dG9Db25uZWN0RGlhbG9nIiwiX3RlbXAiLCJoYW5kbGVDYW5jZWwiLCJzaG91bGRTaG93RGlzYWJsZUF1dG9Db25uZWN0RGlhbG9nIl0sInNvdXJjZXMiOlsiSWRlQXV0b0Nvbm5lY3REaWFsb2cudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjayB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGdldEdsb2JhbENvbmZpZywgc2F2ZUdsb2JhbENvbmZpZyB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGlzU3VwcG9ydGVkVGVybWluYWwgfSBmcm9tICcuLi91dGlscy9pZGUuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5cbnR5cGUgSWRlQXV0b0Nvbm5lY3REaWFsb2dQcm9wcyA9IHtcbiAgb25Db21wbGV0ZTogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gSWRlQXV0b0Nvbm5lY3REaWFsb2coe1xuICBvbkNvbXBsZXRlLFxufTogSWRlQXV0b0Nvbm5lY3REaWFsb2dQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGhhbmRsZVNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgIGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBhdXRvQ29ubmVjdCA9IHZhbHVlID09PSAneWVzJ1xuXG4gICAgICAvLyBTYXZlIHRoZSBwcmVmZXJlbmNlIGFuZCBtYXJrIGRpYWxvZyBhcyBzaG93blxuICAgICAgc2F2ZUdsb2JhbENvbmZpZyhjdXJyZW50ID0+ICh7XG4gICAgICAgIC4uLmN1cnJlbnQsXG4gICAgICAgIGF1dG9Db25uZWN0SWRlOiBhdXRvQ29ubmVjdCxcbiAgICAgICAgaGFzSWRlQXV0b0Nvbm5lY3REaWFsb2dCZWVuU2hvd246IHRydWUsXG4gICAgICB9KSlcblxuICAgICAgb25Db21wbGV0ZSgpXG4gICAgfSxcbiAgICBbb25Db21wbGV0ZV0sXG4gIClcblxuICBjb25zdCBvcHRpb25zID0gW1xuICAgIHsgbGFiZWw6ICdZZXMnLCB2YWx1ZTogJ3llcycgfSxcbiAgICB7IGxhYmVsOiAnTm8nLCB2YWx1ZTogJ25vJyB9LFxuICBdXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT1cIkRvIHlvdSB3aXNoIHRvIGVuYWJsZSBhdXRvLWNvbm5lY3QgdG8gSURFP1wiXG4gICAgICBjb2xvcj1cImlkZVwiXG4gICAgICBvbkNhbmNlbD17b25Db21wbGV0ZX1cbiAgICA+XG4gICAgICA8U2VsZWN0IG9wdGlvbnM9e29wdGlvbnN9IG9uQ2hhbmdlPXtoYW5kbGVTZWxlY3R9IGRlZmF1bHRWYWx1ZT17J3llcyd9IC8+XG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgWW91IGNhbiBhbHNvIGNvbmZpZ3VyZSB0aGlzIGluIC9jb25maWcgb3Igd2l0aCB0aGUgLS1pZGUgZmxhZ1xuICAgICAgPC9UZXh0PlxuICAgIDwvRGlhbG9nPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRTaG93QXV0b0Nvbm5lY3REaWFsb2coKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG4gIHJldHVybiAoXG4gICAgIWlzU3VwcG9ydGVkVGVybWluYWwoKSAmJlxuICAgIGNvbmZpZy5hdXRvQ29ubmVjdElkZSAhPT0gdHJ1ZSAmJlxuICAgIGNvbmZpZy5oYXNJZGVBdXRvQ29ubmVjdERpYWxvZ0JlZW5TaG93biAhPT0gdHJ1ZVxuICApXG59XG5cbnR5cGUgSWRlRGlzYWJsZUF1dG9Db25uZWN0RGlhbG9nUHJvcHMgPSB7XG4gIG9uQ29tcGxldGU6IChkaXNhYmxlQXV0b0Nvbm5lY3Q6IGJvb2xlYW4pID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIElkZURpc2FibGVBdXRvQ29ubmVjdERpYWxvZyh7XG4gIG9uQ29tcGxldGUsXG59OiBJZGVEaXNhYmxlQXV0b0Nvbm5lY3REaWFsb2dQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGhhbmRsZVNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBkaXNhYmxlQXV0b0Nvbm5lY3QgPSB2YWx1ZSA9PT0gJ3llcydcblxuICAgICAgaWYgKGRpc2FibGVBdXRvQ29ubmVjdCkge1xuICAgICAgICBzYXZlR2xvYmFsQ29uZmlnKGN1cnJlbnQgPT4gKHtcbiAgICAgICAgICAuLi5jdXJyZW50LFxuICAgICAgICAgIGF1dG9Db25uZWN0SWRlOiBmYWxzZSxcbiAgICAgICAgfSkpXG4gICAgICB9XG5cbiAgICAgIG9uQ29tcGxldGUoZGlzYWJsZUF1dG9Db25uZWN0KVxuICAgIH0sXG4gICAgW29uQ29tcGxldGVdLFxuICApXG5cbiAgY29uc3QgaGFuZGxlQ2FuY2VsID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIG9uQ29tcGxldGUoZmFsc2UpXG4gIH0sIFtvbkNvbXBsZXRlXSlcblxuICBjb25zdCBvcHRpb25zID0gW1xuICAgIHsgbGFiZWw6ICdObycsIHZhbHVlOiAnbm8nIH0sXG4gICAgeyBsYWJlbDogJ1llcycsIHZhbHVlOiAneWVzJyB9LFxuICBdXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT1cIkRvIHlvdSB3aXNoIHRvIGRpc2FibGUgYXV0by1jb25uZWN0IHRvIElERT9cIlxuICAgICAgc3VidGl0bGU9XCJZb3UgY2FuIGFsc28gY29uZmlndXJlIHRoaXMgaW4gL2NvbmZpZ1wiXG4gICAgICBvbkNhbmNlbD17aGFuZGxlQ2FuY2VsfVxuICAgICAgY29sb3I9XCJpZGVcIlxuICAgID5cbiAgICAgIDxTZWxlY3Qgb3B0aW9ucz17b3B0aW9uc30gb25DaGFuZ2U9e2hhbmRsZVNlbGVjdH0gZGVmYXVsdFZhbHVlPXsnbm8nfSAvPlxuICAgIDwvRGlhbG9nPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRTaG93RGlzYWJsZUF1dG9Db25uZWN0RGlhbG9nKCk6IGJvb2xlYW4ge1xuICBjb25zdCBjb25maWcgPSBnZXRHbG9iYWxDb25maWcoKVxuICByZXR1cm4gIWlzU3VwcG9ydGVkVGVybWluYWwoKSAmJiBjb25maWcuYXV0b0Nvbm5lY3RJZGUgPT09IHRydWVcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsV0FBVyxRQUFRLE9BQU87QUFDMUMsU0FBU0MsSUFBSSxRQUFRLFdBQVc7QUFDaEMsU0FBU0MsZUFBZSxFQUFFQyxnQkFBZ0IsUUFBUSxvQkFBb0I7QUFDdEUsU0FBU0MsbUJBQW1CLFFBQVEsaUJBQWlCO0FBQ3JELFNBQVNDLE1BQU0sUUFBUSx5QkFBeUI7QUFDaEQsU0FBU0MsTUFBTSxRQUFR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
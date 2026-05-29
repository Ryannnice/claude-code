// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect } from 'react';
// 引入 getOriginalCwd，将 ../../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../../../bootstrap/state.js';
// 类型依赖 { CommandResultDisplay } 来自 ../../../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../../../commands.js';
// 复用 Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { Select } from '../../../components/CustomSelect/select.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 类型依赖 { ToolPermissionContext } 来自 ../../../Tool.js，用于校准终端渲染的数据契约。
import type { ToolPermissionContext } from '../../../Tool.js';
// 引入 useTabHeaderFocus，将 ../../design-system/Tabs.js 中已经封装好的能力接到本文件流程里。
import { useTabHeaderFocus } from '../../design-system/Tabs.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onExit: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
  toolPermissionContext: ToolPermissionContext;
  // 这个回调绑定到 onRequestAddDirectory: () => void;，负责终端渲染在该局部场景下的响应。
  onRequestAddDirectory: () => void;
  // 这个回调绑定到 onRequestRemoveDirectory: (path: string) => void;，负责终端渲染在该局部场景下的响应。
  onRequestRemoveDirectory: (path: string) => void;
  onHeaderFocusChange?: (focused: boolean) => void;
};
// DirectoryItem 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DirectoryItem = {
  path: string;
  isCurrent: boolean;
  isDeletable: boolean;
};
// WorkspaceTab 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WorkspaceTab(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(23);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onExit,
    toolPermissionContext,
    onRequestAddDirectory,
    onRequestRemoveDirectory,
    onHeaderFocusChange
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    headerFocused,
    focusHeader
  } = useTabHeaderFocus();
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[headerFocused, onHeaderFocusChange]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== headerFocused || $[1] !== onHeaderFocusChange) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 调用 onHeaderFocusChange?.(headerFocused);，完成这一处局部操作。
      onHeaderFocusChange?.(headerFocused);
    };
    // t2 暂存 `[headerFocused, onHeaderFocusChange]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [headerFocused, onHeaderFocusChange];
    // $[0] 缓存 `headerFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = headerFocused;
    // $[1] 缓存 `onHeaderFocusChange`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onHeaderFocusChange;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t1, t2);
  // t3 暂存 `Array.from(toolPermissionContext.additionalWorkingDirecto...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== toolPermissionContext.additionalWorkingDirectories) {
    // t3 暂存 `Array.from(toolPermissionContext.additionalWorkingDirecto...` 生成的渲染片段，后续返回路径直接复用。
    t3 = Array.from(toolPermissionContext.additionalWorkingDirectories.keys()).map(_temp);
    // $[4] 缓存 `toolPermissionContext.additionalWorkingDirectories`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = toolPermissionContext.additionalWorkingDirectories;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // additionalDirectories 集合保存`t3`，作为后续临时缓存值处理的输入。
  const additionalDirectories = t3;
  // t4 暂存 `selectedValue => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== additionalDirectories || $[7] !== onRequestAddDirectory || $[8] !== onRequestRemoveDirectory) {
    // t4 暂存 `selectedValue => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = selectedValue => {
      // 当 `selectedValue` 匹配 `"add-directory"` 时，终端渲染执行对应分支。
      if (selectedValue === "add-directory") {
        // 调用 onRequestAddDirectory，触发终端渲染此处需要的副作用。
        onRequestAddDirectory();
        // 权限确认界面 Workspace Tab在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // directory筛选`additionalDirectories.find`，供终端渲染后续处理使用。
      const directory = additionalDirectories.find(d => d.path === selectedValue);
      // 只有 `directory && directory.isDeletable` 满足时，终端渲染才执行该分支。
      if (directory && directory.isDeletable) {
        // 调用 onRequestRemoveDirectory，触发终端渲染此处需要的副作用。
        onRequestRemoveDirectory(directory.path);
      }
    };
    // $[6] 缓存 `additionalDirectories`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = additionalDirectories;
    // $[7] 缓存 `onRequestAddDirectory`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onRequestAddDirectory;
    // $[8] 缓存 `onRequestRemoveDirectory`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onRequestRemoveDirectory;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // handleDirectorySelect沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleDirectorySelect = t4;
  // t5 暂存 `() => onExit("Workspace dialog dismissed", {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== onExit) {
    // t5 暂存 `() => onExit("Workspace dialog dismissed", {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => onExit("Workspace dialog dismissed", {
      display: "system"
    });
    // $[10] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onExit;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // handleCancel保存`t5`，作为后续临时缓存值处理的输入。
  const handleCancel = t5;
  // opts 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let opts;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== additionalDirectories) {
    // opts 集合更新为 `additionalDirectories.map(_temp2)`，确保权限确认界面后续读取最新状态。
    opts = additionalDirectories.map(_temp2);
    // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t6 = {
        label: `Add directory${figures.ellipsis}`,
        value: "add-directory"
      };
      // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[14];
    }
    // opts 集合追加新条目，保持收集顺序与输入顺序一致。
    opts.push(t6);
    // $[12] 缓存 `additionalDirectories`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = additionalDirectories;
    // $[13] 缓存 `opts`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = opts;
  } else {
    // opts 集合更新为 `$[13]`，确保权限确认界面后续读取最新状态。
    opts = $[13];
  }
  // 选项 命名 `opts`，让后续代码直接表达这个值的用途。
  const options = opts;
  // t6 暂存 `<Box flexDirection="row" marginTop={1} marginLeft={2} gap...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Box flexDirection="row" marginTop={1} marginLeft={2} gap...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="row" marginTop={1} marginLeft={2} gap={1}><Text>{`-  ${getOriginalCwd()}`}</Text><Text dimColor={true}>(Original working directory)</Text></Box>;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[15];
  }
  // 临时值 t7保存`Math.min`，供终端渲染后续处理使用。
  const t7 = Math.min(10, options.length);
  // t8 暂存 `<Box flexDirection="column" marginBottom={1}>{t6}<Select ...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== focusHeader || $[17] !== handleCancel || $[18] !== handleDirectorySelect || $[19] !== headerFocused || $[20] !== options || $[21] !== t7) {
    // t8 暂存 `<Box flexDirection="column" marginBottom={1}>{t6}<Select ...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" marginBottom={1}>{t6}<Select options={options} onChange={handleDirectorySelect} onCancel={handleCancel} visibleOptionCount={t7} onUpFromFirstItem={focusHeader} isDisabled={headerFocused} /></Box>;
    // $[16] 缓存 `focusHeader`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = focusHeader;
    // $[17] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = handleCancel;
    // $[18] 缓存 `handleDirectorySelect`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = handleDirectorySelect;
    // $[19] 缓存 `headerFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = headerFocused;
    // $[20] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = options;
    // $[21] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t7;
    // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[22];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(dir) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    label: dir.path,
    value: dir.path
  };
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(path) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    path,
    isCurrent: false,
    isDeletable: true
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsImdldE9yaWdpbmFsQ3dkIiwiQ29tbWFuZFJlc3VsdERpc3BsYXkiLCJTZWxlY3QiLCJCb3giLCJUZXh0IiwiVG9vbFBlcm1pc3Npb25Db250ZXh0IiwidXNlVGFiSGVhZGVyRm9jdXMiLCJQcm9wcyIsIm9uRXhpdCIsInJlc3VsdCIsIm9wdGlvbnMiLCJkaXNwbGF5IiwidG9vbFBlcm1pc3Npb25Db250ZXh0Iiwib25SZXF1ZXN0QWRkRGlyZWN0b3J5Iiwib25SZXF1ZXN0UmVtb3ZlRGlyZWN0b3J5IiwicGF0aCIsIm9uSGVhZGVyRm9jdXNDaGFuZ2UiLCJmb2N1c2VkIiwiRGlyZWN0b3J5SXRlbSIsImlzQ3VycmVudCIsImlzRGVsZXRhYmxlIiwiV29ya3NwYWNlVGFiIiwidDAiLCIkIiwiX2MiLCJoZWFkZXJGb2N1c2VkIiwiZm9jdXNIZWFkZXIiLCJ0MSIsInQyIiwidDMiLCJhZGRpdGlvbmFsV29ya2luZ0RpcmVjdG9yaWVzIiwiQXJyYXkiLCJmcm9tIiwia2V5cyIsIm1hcCIsIl90ZW1wIiwiYWRkaXRpb25hbERpcmVjdG9yaWVzIiwidDQiLCJzZWxlY3RlZFZhbHVlIiwiZGlyZWN0b3J5IiwiZmluZCIsImQiLCJoYW5kbGVEaXJlY3RvcnlTZWxlY3QiLCJ0NSIsImhhbmRsZUNhbmNlbCIsIm9wdHMiLCJfdGVtcDIiLCJ0NiIsIlN5bWJvbCIsImZvciIsImxhYmVsIiwiZWxsaXBzaXMiLCJ2YWx1ZSIsInB1c2giLCJ0NyIsIk1hdGgiLCJtaW4iLCJsZW5ndGgiLCJ0OCIsImRpciJdLCJzb3VyY2VzIjpbIldvcmtzcGFjZVRhYi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgZ2V0T3JpZ2luYWxDd2QgfSBmcm9tICcuLi8uLi8uLi9ib290c3RyYXAvc3RhdGUuanMnXG5pbXBvcnQgdHlwZSB7IENvbW1hbmRSZXN1bHREaXNwbGF5IH0gZnJvbSAnLi4vLi4vLi4vY29tbWFuZHMuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi8uLi8uLi9jb21wb25lbnRzL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IFRvb2xQZXJtaXNzaW9uQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgeyB1c2VUYWJIZWFkZXJGb2N1cyB9IGZyb20gJy4uLy4uL2Rlc2lnbi1zeXN0ZW0vVGFicy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25FeGl0OiAoXG4gICAgcmVzdWx0Pzogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7IGRpc3BsYXk/OiBDb21tYW5kUmVzdWx0RGlzcGxheSB9LFxuICApID0+IHZvaWRcbiAgdG9vbFBlcm1pc3Npb25Db250ZXh0OiBUb29sUGVybWlzc2lvbkNvbnRleHRcbiAgb25SZXF1ZXN0QWRkRGlyZWN0b3J5OiAoKSA9PiB2b2lkXG4gIG9uUmVxdWVzdFJlbW92ZURpcmVjdG9yeTogKHBhdGg6IHN0cmluZykgPT4gdm9pZFxuICBvbkhlYWRlckZvY3VzQ2hhbmdlPzogKGZvY3VzZWQ6IGJvb2xlYW4pID0+IHZvaWRcbn1cblxudHlwZSBEaXJlY3RvcnlJdGVtID0ge1xuICBwYXRoOiBzdHJpbmdcbiAgaXNDdXJyZW50OiBib29sZWFuXG4gIGlzRGVsZXRhYmxlOiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBXb3Jrc3BhY2VUYWIoe1xuICBvbkV4aXQsXG4gIHRvb2xQZXJtaXNzaW9uQ29udGV4dCxcbiAgb25SZXF1ZXN0QWRkRGlyZWN0b3J5LFxuICBvblJlcXVlc3RSZW1vdmVEaXJlY3RvcnksXG4gIG9uSGVhZGVyRm9jdXNDaGFuZ2UsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgaGVhZGVyRm9jdXNlZCwgZm9jdXNIZWFkZXIgfSA9IHVzZVRhYkhlYWRlckZvY3VzKClcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBvbkhlYWRlckZvY3VzQ2hhbmdlPy4oaGVhZGVyRm9jdXNlZClcbiAgfSwgW2hlYWRlckZvY3VzZWQsIG9uSGVhZGVyRm9jdXNDaGFuZ2VdKVxuICAvLyBHZXQgb25seSBhZGRpdGlvbmFsIHdvcmtzcGFjZSBkaXJlY3RvcmllcyAobm90IHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5KVxuICBjb25zdCBhZGRpdGlvbmFsRGlyZWN0b3JpZXMgPSBSZWFjdC51c2VNZW1vKCgpOiBEaXJlY3RvcnlJdGVtW10gPT4ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKFxuICAgICAgdG9vbFBlcm1pc3Npb25Db250ZXh0LmFkZGl0aW9uYWxXb3JraW5nRGlyZWN0b3JpZXMua2V5cygpLFxuICAgICkubWFwKHBhdGggPT4gKHtcbiAgICAgIHBhdGgsXG4gICAgICBpc0N1cnJlbnQ6IGZhbHNlLFxuICAgICAgaXNEZWxldGFibGU6IHRydWUsXG4gICAgfSkpXG4gIH0sIFt0b29sUGVybWlzc2lvbkNvbnRleHQuYWRkaXRpb25hbFdvcmtpbmdEaXJlY3Rvcmllc10pXG5cbiAgY29uc3QgaGFuZGxlRGlyZWN0b3J5U2VsZWN0ID0gdXNlQ2FsbGJhY2soXG4gICAgKHNlbGVjdGVkVmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKHNlbGVjdGVkVmFsdWUgPT09ICdhZGQtZGlyZWN0b3J5Jykge1xuICAgICAgICBvblJlcXVlc3RBZGREaXJlY3RvcnkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3QgZGlyZWN0b3J5ID0gYWRkaXRpb25hbERpcmVjdG9yaWVzLmZpbmQoXG4gICAgICAgIGQgPT4gZC5wYXRoID09PSBzZWxlY3RlZFZhbHVlLFxuICAgICAgKVxuICAgICAgaWYgKGRpcmVjdG9yeSAmJiBkaXJlY3RvcnkuaXNEZWxldGFibGUpIHtcbiAgICAgICAgb25SZXF1ZXN0UmVtb3ZlRGlyZWN0b3J5KGRpcmVjdG9yeS5wYXRoKVxuICAgICAgfVxuICAgIH0sXG4gICAgW2FkZGl0aW9uYWxEaXJlY3Rvcmllcywgb25SZXF1ZXN0QWRkRGlyZWN0b3J5LCBvblJlcXVlc3RSZW1vdmVEaXJlY3RvcnldLFxuICApXG5cbiAgY29uc3QgaGFuZGxlQ2FuY2VsID0gdXNlQ2FsbGJhY2soXG4gICAgKCkgPT4gb25FeGl0KCdXb3Jrc3BhY2UgZGlhbG9nIGRpc21pc3NlZCcsIHsgZGlzcGxheTogJ3N5c3RlbScgfSksXG4gICAgW29uRXhpdF0sXG4gIClcblxuICAvLyBNYWluIGxpc3QgdmlldyBvcHRpb25zXG4gIGNvbnN0IG9wdGlvbnMgPSBSZWFjdC51c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBvcHRzID0gYWRkaXRpb25hbERpcmVjdG9yaWVzLm1hcChkaXIgPT4gKHtcbiAgICAgIGxhYmVsOiBkaXIucGF0aCxcbiAgICAgIHZhbHVlOiBkaXIucGF0aCxcbiAgICB9KSlcblxuICAgIG9wdHMucHVzaCh7XG4gICAgICBsYWJlbDogYEFkZCBkaXJlY3Rvcnkke2ZpZ3VyZXMuZWxsaXBzaXN9YCxcbiAgICAgIHZhbHVlOiAnYWRkLWRpcmVjdG9yeScsXG4gICAgfSlcblxuICAgIHJldHVybiBvcHRzXG4gIH0sIFthZGRpdGlvbmFsRGlyZWN0b3JpZXNdKVxuXG4gIC8vIE1haW4gbGlzdCB2aWV3XG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgIHsvKiBDdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5IHNlY3Rpb24gKi99XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIiBtYXJnaW5Ub3A9ezF9IG1hcmdpbkxlZnQ9ezJ9IGdhcD17MX0+XG4gICAgICAgIDxUZXh0PntgLSAgJHtnZXRPcmlnaW5hbEN3ZCgpfWB9PC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj4oT3JpZ2luYWwgd29ya2luZyBkaXJlY3RvcnkpPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8U2VsZWN0XG4gICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XG4gICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVEaXJlY3RvcnlTZWxlY3R9XG4gICAgICAgIG9uQ2FuY2VsPXtoYW5kbGVDYW5jZWx9XG4gICAgICAgIHZpc2libGVPcHRpb25Db3VudD17TWF0aC5taW4oMTAsIG9wdGlvbnMubGVuZ3RoKX1cbiAgICAgICAgb25VcEZyb21GaXJzdEl0ZW09e2ZvY3VzSGVhZGVyfVxuICAgICAgICBpc0Rpc2FibGVkPXtoZWFkZXJGb2N1c2VkfVxuICAgICAgLz5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLEVBQUVDLFNBQVMsUUFBUSxPQUFPO0FBQzlDLFNBQVNDLGNBQWMsUUFBUSw2QkFBNkI7QUFDNUQsY0FBY0Msb0JBQW9CLFFBQVEsc0JBQXNCO0FBQ2hFLFNBQVNDLE1BQU0sUUFBUSw0Q0FBNEM7QUFDbkUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsaUJBQWlCO0FBQzNDLGNBQWNDLHFCQUFxQixRQUFRLGtCQUFrQjtBQUM3RCxTQUFTQyxpQkFBaUIsUUFBUSw2QkFBNkI7QUFFL0QsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLE1BQU0sRUFBRSxDQUNOQyxNQUFlLENBQVIsRUFBRSxNQUFNLEVBQ2ZDLE9BQTRDLENBQXBDLEVBQUU7SUFBRUMsT0FBTyxDQUFDLEVBQUVWLG9CQUFvQjtFQUFDLENBQUMsRUFDNUMsR0FBRyxJQUFJO0VBQ1RXLHFCQUFxQixFQUFFUCxxQkFBcUI7RUFDNUNRLHFCQUFxQixFQUFFLEdBQUcsR0FBRyxJQUFJ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
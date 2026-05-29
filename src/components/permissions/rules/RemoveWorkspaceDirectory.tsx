// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback } from 'react';
// 复用 Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { Select } from '../../../components/CustomSelect/select.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 类型依赖 { ToolPermissionContext } 来自 ../../../Tool.js，用于校准终端渲染的数据契约。
import type { ToolPermissionContext } from '../../../Tool.js';
// 复用 applyPermissionUpdate 工具函数，把通用处理留在 ../../../utils/permissions/PermissionUpdate.js 中维护。
import { applyPermissionUpdate } from '../../../utils/permissions/PermissionUpdate.js';
// 引入 Dialog，将 ../../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../../design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  directoryPath: string;
  // 这个回调绑定到 onRemove: () => void;，负责终端渲染在该局部场景下的响应。
  onRemove: () => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  permissionContext: ToolPermissionContext;
  // 这个回调绑定到 setPermissionContext: (context: ToolPermissionContext) => void;，负责终端渲染在该局部场景下的响应。
  setPermissionContext: (context: ToolPermissionContext) => void;
};
// RemoveWorkspaceDirectory 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function RemoveWorkspaceDirectory(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(19);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    directoryPath,
    onRemove,
    onCancel,
    permissionContext,
    setPermissionContext
  } = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== directoryPath || $[1] !== onRemove || $[2] !== permissionContext || $[3] !== setPermissionContext) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // updatedContext保存`applyPermissionUpdate`，供终端渲染后续处理使用。
      const updatedContext = applyPermissionUpdate(permissionContext, {
        type: "removeDirectories",
        directories: [directoryPath],
        destination: "session"
      });
      // setPermissionContext 写入新的状态值，使终端渲染后续读取保持一致。
      setPermissionContext(updatedContext);
      // 调用 onRemove，触发终端渲染此处需要的副作用。
      onRemove();
    };
    // $[0] 缓存 `directoryPath`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = directoryPath;
    // $[1] 缓存 `onRemove`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onRemove;
    // $[2] 缓存 `permissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = permissionContext;
    // $[3] 缓存 `setPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = setPermissionContext;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // handleRemove保存`t1`，作为后续临时缓存值处理的输入。
  const handleRemove = t1;
  // t2 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== handleRemove || $[6] !== onCancel) {
    // t2 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = value => {
      // 当 `value` 匹配 `"yes"` 时，终端渲染执行对应分支。
      if (value === "yes") {
        // 调用 handleRemove，触发终端渲染此处需要的副作用。
        handleRemove();
      } else {
        // 调用 onCancel，触发终端渲染此处需要的副作用。
        onCancel();
      }
    };
    // $[5] 缓存 `handleRemove`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = handleRemove;
    // $[6] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onCancel;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // handleSelect保存`t2`，作为后续临时缓存值处理的输入。
  const handleSelect = t2;
  // t3 暂存 `<Box marginX={2} flexDirection="column"><Text bold={true}...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== directoryPath) {
    // t3 暂存 `<Box marginX={2} flexDirection="column"><Text bold={true}...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box marginX={2} flexDirection="column"><Text bold={true}>{directoryPath}</Text></Box>;
    // $[8] 缓存 `directoryPath`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = directoryPath;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // t4 暂存 `<Text>Claude Code will no longer have access to files in ...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text>Claude Code will no longer have access to files in ...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text>Claude Code will no longer have access to files in this directory.</Text>;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[10];
  }
  // t5 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t5 = [{
      label: "Yes",
      value: "yes"
    }, {
      label: "No",
      value: "no"
    }];
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // t6 暂存 `<Select onChange={handleSelect} onCancel={onCancel} optio...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== handleSelect || $[13] !== onCancel) {
    // t6 暂存 `<Select onChange={handleSelect} onCancel={onCancel} optio...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Select onChange={handleSelect} onCancel={onCancel} options={t5} />;
    // $[12] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = handleSelect;
    // $[13] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = onCancel;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // t7 暂存 `<Dialog title="Remove directory from workspace?" onCancel...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== onCancel || $[16] !== t3 || $[17] !== t6) {
    // t7 暂存 `<Dialog title="Remove directory from workspace?" onCancel...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Dialog title="Remove directory from workspace?" onCancel={onCancel} color="error">{t3}{t4}{t6}</Dialog>;
    // $[15] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = onCancel;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[18];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwiU2VsZWN0IiwiQm94IiwiVGV4dCIsIlRvb2xQZXJtaXNzaW9uQ29udGV4dCIsImFwcGx5UGVybWlzc2lvblVwZGF0ZSIsIkRpYWxvZyIsIlByb3BzIiwiZGlyZWN0b3J5UGF0aCIsIm9uUmVtb3ZlIiwib25DYW5jZWwiLCJwZXJtaXNzaW9uQ29udGV4dCIsInNldFBlcm1pc3Npb25Db250ZXh0IiwiY29udGV4dCIsIlJlbW92ZVdvcmtzcGFjZURpcmVjdG9yeSIsInQwIiwiJCIsIl9jIiwidDEiLCJ1cGRhdGVkQ29udGV4dCIsInR5cGUiLCJkaXJlY3RvcmllcyIsImRlc3RpbmF0aW9uIiwiaGFuZGxlUmVtb3ZlIiwidDIiLCJ2YWx1ZSIsImhhbmRsZVNlbGVjdCIsInQzIiwidDQiLCJTeW1ib2wiLCJmb3IiLCJ0NSIsImxhYmVsIiwidDYiLCJ0NyJdLCJzb3VyY2VzIjpbIlJlbW92ZVdvcmtzcGFjZURpcmVjdG9yeS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VDYWxsYmFjayB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vLi4vLi4vY29tcG9uZW50cy9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBUb29sUGVybWlzc2lvbkNvbnRleHQgfSBmcm9tICcuLi8uLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHsgYXBwbHlQZXJtaXNzaW9uVXBkYXRlIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvUGVybWlzc2lvblVwZGF0ZS5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uLy4uL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBkaXJlY3RvcnlQYXRoOiBzdHJpbmdcbiAgb25SZW1vdmU6ICgpID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbiAgcGVybWlzc2lvbkNvbnRleHQ6IFRvb2xQZXJtaXNzaW9uQ29udGV4dFxuICBzZXRQZXJtaXNzaW9uQ29udGV4dDogKGNvbnRleHQ6IFRvb2xQZXJtaXNzaW9uQ29udGV4dCkgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gUmVtb3ZlV29ya3NwYWNlRGlyZWN0b3J5KHtcbiAgZGlyZWN0b3J5UGF0aCxcbiAgb25SZW1vdmUsXG4gIG9uQ2FuY2VsLFxuICBwZXJtaXNzaW9uQ29udGV4dCxcbiAgc2V0UGVybWlzc2lvbkNvbnRleHQsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGhhbmRsZVJlbW92ZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBjb25zdCB1cGRhdGVkQ29udGV4dCA9IGFwcGx5UGVybWlzc2lvblVwZGF0ZShwZXJtaXNzaW9uQ29udGV4dCwge1xuICAgICAgdHlwZTogJ3JlbW92ZURpcmVjdG9yaWVzJyxcbiAgICAgIGRpcmVjdG9yaWVzOiBbZGlyZWN0b3J5UGF0aF0sXG4gICAgICBkZXN0aW5hdGlvbjogJ3Nlc3Npb24nLFxuICAgIH0pXG5cbiAgICBzZXRQZXJtaXNzaW9uQ29udGV4dCh1cGRhdGVkQ29udGV4dClcbiAgICBvblJlbW92ZSgpXG4gIH0sIFtkaXJlY3RvcnlQYXRoLCBwZXJtaXNzaW9uQ29udGV4dCwgc2V0UGVybWlzc2lvbkNvbnRleHQsIG9uUmVtb3ZlXSlcblxuICBjb25zdCBoYW5kbGVTZWxlY3QgPSB1c2VDYWxsYmFjayhcbiAgICAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKHZhbHVlID09PSAneWVzJykge1xuICAgICAgICBoYW5kbGVSZW1vdmUoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb25DYW5jZWwoKVxuICAgICAgfVxuICAgIH0sXG4gICAgW2hhbmRsZVJlbW92ZSwgb25DYW5jZWxdLFxuICApXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT1cIlJlbW92ZSBkaXJlY3RvcnkgZnJvbSB3b3Jrc3BhY2U/XCJcbiAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbH1cbiAgICAgIGNvbG9yPVwiZXJyb3JcIlxuICAgID5cbiAgICAgIDxCb3ggbWFyZ2luWD17Mn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dCBib2xkPntkaXJlY3RvcnlQYXRofTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAgPFRleHQ+XG4gICAgICAgIENsYXVkZSBDb2RlIHdpbGwgbm8gbG9uZ2VyIGhhdmUgYWNjZXNzIHRvIGZpbGVzIGluIHRoaXMgZGlyZWN0b3J5LlxuICAgICAgPC9UZXh0PlxuICAgICAgPFNlbGVjdFxuICAgICAgICBvbkNoYW5nZT17aGFuZGxlU2VsZWN0fVxuICAgICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICAgIG9wdGlvbnM9e1tcbiAgICAgICAgICB7IGxhYmVsOiAnWWVzJywgdmFsdWU6ICd5ZXMnIH0sXG4gICAgICAgICAgeyBsYWJlbDogJ05vJywgdmFsdWU6ICdubycgfSxcbiAgICAgICAgXX1cbiAgICAgIC8+XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsV0FBVyxRQUFRLE9BQU87QUFDbkMsU0FBU0MsTUFBTSxRQUFRLDRDQUE0QztBQUNuRSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxpQkFBaUI7QUFDM0MsY0FBY0MscUJBQXFCLFFBQVEsa0JBQWtCO0FBQzdELFNBQVNDLHFCQUFxQixRQUFRLGdEQUFnRDtBQUN0RixTQUFTQyxNQUFNLFFBQVEsK0JBQStCO0FBRXRELEtBQUtDLEtBQUssR0FBRztFQUNYQyxhQUFhLEVBQUUsTUFBTTtFQUNyQkMsUUFBUSxFQUFFLEdBQUcsR0FBRyxJQUFJO0VBQ3BCQyxRQUFRLEVBQUUs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
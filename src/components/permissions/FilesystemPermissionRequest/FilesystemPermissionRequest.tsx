// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text、useTheme，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTheme } from '../../../ink.js';
// 引入 FallbackPermissionRequest，将 ../FallbackPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { FallbackPermissionRequest } from '../FallbackPermissionRequest.js';
// 引入 FilePermissionDialog，将 ../FilePermissionDialog/FilePermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { FilePermissionDialog } from '../FilePermissionDialog/FilePermissionDialog.js';
// 类型依赖 { ToolInput } 来自 ../FilePermissionDialog/useFilePermissionDialog.js，用于校准终端渲染的数据契约。
import type { ToolInput } from '../FilePermissionDialog/useFilePermissionDialog.js';
// 类型依赖 { PermissionRequestProps, ToolUseConfirm } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps, ToolUseConfirm } from '../PermissionRequest.js';
// pathFromToolUse 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pathFromToolUse(toolUseConfirm: ToolUseConfirm): string | null {
  // 工具 命名 `toolUseConfirm.tool`，让后续代码直接表达这个值的用途。
  const tool = toolUseConfirm.tool;
  // 只有 `'getPath' in tool && typeof tool.getPath === 'fun` 满足时，终端渲染才执行该分支。
  if ('getPath' in tool && typeof tool.getPath === 'function') {
    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // 返回 `tool.getPath(toolUseConfirm.input)`，作为终端渲染这次计算的结果。
      return tool.getPath(toolUseConfirm.input);
    } catch {
      // 返回 `null`，作为终端渲染这次计算的结果。
      return null;
    }
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}
// FilesystemPermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FilesystemPermissionRequest(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(30);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    toolUseConfirm,
    onDone,
    onReject,
    verbose,
    toolUseContext,
    workerBadge
  } = t0;
  // 从 `useTheme()` 按位置拆出 theme，让权限确认界面 Filesystem Permission Request分别处理这些返回值。
  const [theme] = useTheme();
  // t1 暂存 `pathFromToolUse(toolUseConfirm)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== toolUseConfirm) {
    // t1 暂存 `pathFromToolUse(toolUseConfirm)` 生成的渲染片段，后续返回路径直接复用。
    t1 = pathFromToolUse(toolUseConfirm);
    // $[0] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = toolUseConfirm;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 路径 命名 `t1`，让后续代码直接表达这个值的用途。
  const path = t1;
  // t2 暂存 `toolUseConfirm.tool.userFacingName(toolUseConfirm.input a...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== toolUseConfirm.input || $[3] !== toolUseConfirm.tool) {
    // t2 暂存 `toolUseConfirm.tool.userFacingName(toolUseConfirm.input a...` 生成的渲染片段，后续返回路径直接复用。
    t2 = toolUseConfirm.tool.userFacingName(toolUseConfirm.input as never);
    // $[2] 缓存 `toolUseConfirm.input`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = toolUseConfirm.input;
    // $[3] 缓存 `toolUseConfirm.tool`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = toolUseConfirm.tool;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // userFacingName保存`t2`，作为后续临时缓存值处理的输入。
  const userFacingName = t2;
  // isReadOnly记录 `tool.isReadOnly` 是否成立，终端渲染随后按该结果分支。
  const isReadOnly = toolUseConfirm.tool.isReadOnly(toolUseConfirm.input);
  // userFacingReadOrEdit 命名 `isReadOnly ? "Read" : "Edit"`，让后续代码直接表达这个值的用途。
  const userFacingReadOrEdit = isReadOnly ? "Read" : "Edit";
  // title 标题保存``${userFacingReadOrEdit} file``，作为后续固定文本处理的输入。
  const title = `${userFacingReadOrEdit} file`;
  // parseInput保存`_temp`，供后续判断或组装使用。
  const parseInput = _temp;
  // 路径缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!path) {
    // t3 暂存 `<FallbackPermissionRequest toolUseConfirm={toolUseConfirm...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== onDone || $[6] !== onReject || $[7] !== toolUseConfirm || $[8] !== toolUseContext || $[9] !== verbose || $[10] !== workerBadge) {
      // t3 暂存 `<FallbackPermissionRequest toolUseConfirm={toolUseConfirm...` 生成的渲染片段，后续返回路径直接复用。
      t3 = <FallbackPermissionRequest toolUseConfirm={toolUseConfirm} toolUseContext={toolUseContext} onDone={onDone} onReject={onReject} verbose={verbose} workerBadge={workerBadge} />;
      // $[5] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = onDone;
      // $[6] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = onReject;
      // $[7] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = toolUseConfirm;
      // $[8] 缓存 `toolUseContext`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = toolUseContext;
      // $[9] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = verbose;
      // $[10] 缓存 `workerBadge`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = workerBadge;
      // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[11];
    }
    // 返回 `t3`，作为终端渲染这次计算的结果。
    return t3;
  }
  // t3 暂存 `toolUseConfirm.tool.renderToolUseMessage(toolUseConfirm.i...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== theme || $[13] !== toolUseConfirm.input || $[14] !== toolUseConfirm.tool || $[15] !== verbose) {
    // t3 暂存 `toolUseConfirm.tool.renderToolUseMessage(toolUseConfirm.i...` 生成的渲染片段，后续返回路径直接复用。
    t3 = toolUseConfirm.tool.renderToolUseMessage(toolUseConfirm.input as never, {
      theme,
      verbose
    });
    // $[12] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = theme;
    // $[13] 缓存 `toolUseConfirm.input`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = toolUseConfirm.input;
    // $[14] 缓存 `toolUseConfirm.tool`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = toolUseConfirm.tool;
    // $[15] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = verbose;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[16];
  }
  // t4 暂存 `<Box flexDirection="column" paddingX={2} paddingY={1}><Te...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== t3 || $[18] !== userFacingName) {
    // t4 暂存 `<Box flexDirection="column" paddingX={2} paddingY={1}><Te...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column" paddingX={2} paddingY={1}><Text>{userFacingName}({t3})</Text></Box>;
    // $[17] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t3;
    // $[18] 缓存 `userFacingName`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = userFacingName;
    // $[19] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[19];
  }
  // 文本内容保存`t4`，作为后续临时缓存值处理的输入。
  const content = t4;
  // t5读取`isReadOnly ? "read" : "write"` 整理出中间结果，供终端渲染权限确认界面 Filesystem Permission ...后续步骤使用。
  const t5 = isReadOnly ? "read" : "write";
  // t6 暂存 `<FilePermissionDialog toolUseConfirm={toolUseConfirm} too...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== content || $[21] !== onDone || $[22] !== onReject || $[23] !== path || $[24] !== t5 || $[25] !== title || $[26] !== toolUseConfirm || $[27] !== toolUseContext || $[28] !== workerBadge) {
    // t6 暂存 `<FilePermissionDialog toolUseConfirm={toolUseConfirm} too...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <FilePermissionDialog toolUseConfirm={toolUseConfirm} toolUseContext={toolUseContext} onDone={onDone} onReject={onReject} workerBadge={workerBadge} title={title} content={content} path={path} parseInput={parseInput} operationType={t5} completionType="tool_use_single" />;
    // $[20] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = content;
    // $[21] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = onDone;
    // $[22] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = onReject;
    // $[23] 缓存 `path`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = path;
    // $[24] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t5;
    // $[25] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = title;
    // $[26] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = toolUseConfirm;
    // $[27] 缓存 `toolUseContext`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = toolUseContext;
    // $[28] 缓存 `workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = workerBadge;
    // $[29] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[29];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(input) {
  // 返回 `input as ToolInput`，作为终端渲染这次计算的结果。
  return input as ToolInput;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJ1c2VUaGVtZSIsIkZhbGxiYWNrUGVybWlzc2lvblJlcXVlc3QiLCJGaWxlUGVybWlzc2lvbkRpYWxvZyIsIlRvb2xJbnB1dCIsIlBlcm1pc3Npb25SZXF1ZXN0UHJvcHMiLCJUb29sVXNlQ29uZmlybSIsInBhdGhGcm9tVG9vbFVzZSIsInRvb2xVc2VDb25maXJtIiwidG9vbCIsImdldFBhdGgiLCJpbnB1dCIsIkZpbGVzeXN0ZW1QZXJtaXNzaW9uUmVxdWVzdCIsInQwIiwiJCIsIl9jIiwib25Eb25lIiwib25SZWplY3QiLCJ2ZXJib3NlIiwidG9vbFVzZUNvbnRleHQiLCJ3b3JrZXJCYWRnZSIsInRoZW1lIiwidDEiLCJwYXRoIiwidDIiLCJ1c2VyRmFjaW5nTmFtZSIsImlzUmVhZE9ubHkiLCJ1c2VyRmFjaW5nUmVhZE9yRWRpdCIsInRpdGxlIiwicGFyc2VJbnB1dCIsIl90ZW1wIiwidDMiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsInQ0IiwiY29udGVudCIsInQ1IiwidDYiXSwic291cmNlcyI6WyJGaWxlc3lzdGVtUGVybWlzc2lvblJlcXVlc3QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCwgdXNlVGhlbWUgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBGYWxsYmFja1Blcm1pc3Npb25SZXF1ZXN0IH0gZnJvbSAnLi4vRmFsbGJhY2tQZXJtaXNzaW9uUmVxdWVzdC5qcydcbmltcG9ydCB7IEZpbGVQZXJtaXNzaW9uRGlhbG9nIH0gZnJvbSAnLi4vRmlsZVBlcm1pc3Npb25EaWFsb2cvRmlsZVBlcm1pc3Npb25EaWFsb2cuanMnXG5pbXBvcnQgdHlwZSB7IFRvb2xJbnB1dCB9IGZyb20gJy4uL0ZpbGVQZXJtaXNzaW9uRGlhbG9nL3VzZUZpbGVQZXJtaXNzaW9uRGlhbG9nLmpzJ1xuaW1wb3J0IHR5cGUge1xuICBQZXJtaXNzaW9uUmVxdWVzdFByb3BzLFxuICBUb29sVXNlQ29uZmlybSxcbn0gZnJvbSAnLi4vUGVybWlzc2lvblJlcXVlc3QuanMnXG5cbmZ1bmN0aW9uIHBhdGhGcm9tVG9vbFVzZSh0b29sVXNlQ29uZmlybTogVG9vbFVzZUNvbmZpcm0pOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgdG9vbCA9IHRvb2xVc2VDb25maXJtLnRvb2xcbiAgaWYgKCdnZXRQYXRoJyBpbiB0b29sICYmIHR5cGVvZiB0b29sLmdldFBhdGggPT09ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRvb2wuZ2V0UGF0aCh0b29sVXNlQ29uZmlybS5pbnB1dClcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBGaWxlc3lzdGVtUGVybWlzc2lvblJlcXVlc3Qoe1xuICB0b29sVXNlQ29uZmlybSxcbiAgb25Eb25lLFxuICBvblJlamVjdCxcbiAgdmVyYm9zZSxcbiAgdG9vbFVzZUNvbnRleHQsXG4gIHdvcmtlckJhZGdlLFxufTogUGVybWlzc2lvblJlcXVlc3RQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG4gIGNvbnN0IHBhdGggPSBwYXRoRnJvbVRvb2xVc2UodG9vbFVzZUNvbmZpcm0pXG4gIGNvbnN0IHVzZXJGYWNpbmdOYW1lID0gdG9vbFVzZUNvbmZpcm0udG9vbC51c2VyRmFjaW5nTmFtZShcbiAgICB0b29sVXNlQ29uZmlybS5pbnB1dCBhcyBuZXZlcixcbiAgKVxuXG4gIGNvbnN0IGlzUmVhZE9ubHkgPSB0b29sVXNlQ29uZmlybS50b29sLmlzUmVhZE9ubHkodG9vbFVzZUNvbmZpcm0uaW5wdXQpXG4gIGNvbnN0IHVzZXJGYWNpbmdSZWFkT3JFZGl0ID0gaXNSZWFkT25seSA/ICdSZWFkJyA6ICdFZGl0J1xuXG4gIC8vIFVzZSBzaW1wbGUgc2luZ3VsYXIgZm9ybSAtIHRoZSBhY3R1YWwgb3BlcmF0aW9uIGRldGFpbHMgYXJlIHNob3duIGluIGNvbnRlbnRcbiAgY29uc3QgdGl0bGUgPSBgJHt1c2VyRmFjaW5nUmVhZE9yRWRpdH0gZmlsZWBcblxuICAvLyBTaW1wbGUgcGFzcy10aHJvdWdoIHBhcnNlciBzaW5jZSB3ZSBkb24ndCBuZWVkIHRvIHRyYW5zZm9ybSB0aGUgaW5wdXRcbiAgY29uc3QgcGFyc2VJbnB1dCA9IChpbnB1dDogdW5rbm93bik6IFRvb2xJbnB1dCA9PiBpbnB1dCBhcyBUb29sSW5wdXRcblxuICAvLyBGYWxsIGJhY2sgdG8gZ2VuZXJpYyBwZXJtaXNzaW9uIHJlcXVlc3QgaWYgbm8gcGF0aCBpcyBmb3VuZFxuICBpZiAoIXBhdGgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEZhbGxiYWNrUGVybWlzc2lvblJlcXVlc3RcbiAgICAgICAgdG9vbFVzZUNvbmZpcm09e3Rvb2xVc2VDb25maXJtfVxuICAgICAgICB0b29sVXNlQ29udGV4dD17dG9vbFVzZUNvbnRleHR9XG4gICAgICAgIG9uRG9uZT17b25Eb25lfVxuICAgICAgICBvblJlamVjdD17b25SZWplY3R9XG4gICAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgICAgIHdvcmtlckJhZGdlPXt3b3JrZXJCYWRnZX1cbiAgICAgIC8+XG4gICAgKVxuICB9XG5cbiAgLy8gUmVuZGVyIHRvb2wgdXNlIG1lc3NhZ2UgY29udGVudFxuICBjb25zdCBjb250ZW50ID0gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsyfSBwYWRkaW5nWT17MX0+XG4gICAgICA8VGV4dD5cbiAgICAgICAge3VzZXJGYWNpbmdOYW1lfShcbiAgICAgICAge3Rvb2xVc2VDb25maXJtLnRvb2wucmVuZGVyVG9vbFVzZU1lc3NhZ2UoXG4gICAgICAgICAgdG9vbFVzZUNvbmZpcm0uaW5wdXQgYXMgbmV2ZXIsXG4gICAgICAgICAgeyB0aGVtZSwgdmVyYm9zZSB9LFxuICAgICAgICApfVxuICAgICAgICApXG4gICAgICA8L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcblxuICByZXR1cm4gKFxuICAgIDxGaWxlUGVybWlzc2lvbkRpYWxvZ1xuICAgICAgdG9vbFVzZUNvbmZpcm09e3Rvb2xVc2VDb25maXJtfVxuICAgICAgdG9vbFVzZUNvbnRleHQ9e3Rvb2xVc2VDb250ZXh0fVxuICAgICAgb25Eb25lPXtvbkRvbmV9XG4gICAgICBvblJlamVjdD17b25SZWplY3R9XG4gICAgICB3b3JrZXJCYWRnZT17d29ya2VyQmFkZ2V9XG4gICAgICB0aXRsZT17dGl0bGV9XG4gICAgICBjb250ZW50PXtjb250ZW50fVxuICAgICAgcGF0aD17cGF0aH1cbiAgICAgIHBhcnNlSW5wdXQ9e3BhcnNlSW5wdXR9XG4gICAgICBvcGVyYXRpb25UeXBlPXtpc1JlYWRPbmx5ID8gJ3JlYWQnIDogJ3dyaXRlJ31cbiAgICAgIGNvbXBsZXRpb25UeXBlPVwidG9vbF91c2Vfc2luZ2xlXCJcbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLGlCQUFpQjtBQUNyRCxTQUFTQyx5QkFBeUIsUUFBUSxpQ0FBaUM7QUFDM0UsU0FBU0Msb0JBQW9CLFFBQVEsaURBQWlEO0FBQ3RGLGNBQWNDLFNBQVMsUUFBUSxvREFBb0Q7QUFDbkYsY0FDRUMsc0JBQXNCLEVBQ3RCQyxjQUFjLFFBQ1QseUJBQXlCO0FBRWhDLFNBQVNDLGVBQWVBLENBQUNDLGNBQWMsRUFBRUYsY0FBYyxDQUFDLEVBQUUsTUFBTSxHQUFHLElBQUksQ0FBQztFQUN0RSxNQUFNRyxJQUFJLEdBQUdELGNBQWMsQ0FBQ0MsSUFBSTtFQUNoQyxJQUFJLFNBQVMsSUFBSUEsSUFBSSxJQUFJLE9BQU9BLElBQUksQ0FBQ0MsT0FBTyxLQUFLLFVBQVUsRUFBRTtJQUMzRCxJQUFJO01BQ0YsT0FBT0QsSUFBSSxDQUFDQyxPQUFPLENBQUNGLGNBQWMsQ0FBQ0csS0FBSyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxNQUFNO01BQ04sT0FBTyxJQUFJO0lBQ2I7RUFDRjtFQUNBLE9BQU8sSUFBSTtBQUNiO0FBRUEsT0FBTyxTQUFBQyw0QkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFxQztJQUFBUCxjQUFBO0lBQUFRLE1BQUE7SUFBQUMsUUFBQTtJQUFBQyxPQUFBO0lBQUFDLGNBQUE7SUFBQUM7RUFBQSxJQUFBUCxFQU9uQjtFQUN2QixPQUFBUSxLQUFBLElBQWdCcEIsUUFBUSxDQUFDLENBQUM7RUFBQSxJQUFBcUIsRUFBQTtFQUFBLElBQUFSLENBQUEsUUFBQU4sY0FBQTtJQUNiYyxFQUFBLEdBQUFmLGVBQWUsQ0FBQ0MsY0FBYyxDQUFDO0lBQUFNLENBQUEsTUFBQU4sY0FBQTtJQUFBTSxDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUE1QyxNQUFBUyxJQUFBLEdBQWFELEVBQStCO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFWLENBQUEsUUFBQU4sY0FBQSxDQUFBRyxLQUFBLElBQUFHLENBQUEsUUFBQU4sY0FBQSxDQUFBQyxJQUFBO0lBQ3JCZSxFQUFBLEdBQUFoQixjQUFjLENBQUFDLElBQUssQ0FBQWdCLGNBQWUsQ0FDdkRqQixjQUFjLENBQUFHLEtBQU0sSUFBSSxLQUMxQixDQUFDO0lBQUFHLENBQUEsTUFBQU4sY0FBQSxDQUFBRyxLQUFBO0lBQUFHLENBQUEsTUFBQU4sY0FBQSxDQUFBQyxJQUFBO0lBQUFLLENBQUEsTUFBQVUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVYsQ0FBQTtFQUFBO0VBRkQsTUFBQVcsY0FBQSxHQUF1QkQsRUFFdEI7RUFFRCxNQUFBRSxVQUFBLEdBQW1CbEIsY0FBYyxDQUFBQyxJQUFLLENBQUFpQixVQUFXLENBQUNsQixjQUFjLENBQUFHLEtBQU0sQ0FBQztFQUN2RSxNQUFBZ0Isb0JBQUEsR0FBNkJELFVBQVUsR0FBVixNQUE0QixHQUE1QixNQUE0QjtFQUd6RCxNQUFBRSxLQUFBLEdBQWMsR0FBR0Qsb0JBQW9CLE9BQU87RUFHNUMsTUFBQUUsVUFBQSxHQUFtQkMsS0FBaUQ7RUFHcEUsSUFBSSxDQUFDUCxJQUFJO0lBQUEsSUFBQVEsRUFBQTtJQUFBLElBQUFqQixDQUFBLFFBQUFFLE1BQUEsSUFBQUYsQ0FBQSxRQUFBRyxRQUFBLElBQUFILENBQUEsUUFBQU4sY0FBQSxJQUFBTSxDQUFBLFFBQUFLLGNBQUEsSUFBQUwsQ0FBQSxRQUFBSSxPQUFBLElBQUFKLENBQUEsU0FBQU0sV0FBQTtNQUVMVyxFQUFBLElBQUMseUJBQXlCLENBQ1J2QixjQUFjLENBQWRBLGVBQWEsQ0FBQyxDQUNkVyxjQUFjLENBQWRBLGVBQWEsQ0FBQyxDQUN0QkgsTUFBTSxDQUFOQSxPQUFLLENBQUMsQ0FDSkMsUUFBUSxDQUFSQSxTQUFPLENBQUMsQ0FDVEMsT0FBTyxDQUFQQSxRQUFNLENBQUMsQ0FDSEUsV0FBVyxDQUFYQSxZQUFVLENBQUMsR0FDeEI7TUFBQU4sQ0FBQSxNQUFBRSxNQUFBO01BQUFGLENBQUEsTUFBQUcsUUFBQTtNQUFBSCxDQUFBLE1BQUFOLGNBQUE7TUFBQU0sQ0FBQSxNQUFBSyxjQUFBO01BQUFMLENBQUEsTUFBQUksT0FBQTtNQUFBSixDQUFBLE9BQUFNLFdBQUE7TUFBQU4sQ0FBQSxPQUFBaUIsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQWpCLENBQUE7SUFBQTtJQUFBLE9BUEZpQixFQU9FO0VBQUE7RUFFTCxJQUFBQSxFQUFBO0VBQUEsSUFBQWpCLENBQUEsU0FBQU8sS0FBQSxJQUFBUCxDQUFBLFNBQUFOLGNBQUEsQ0FBQUcsS0FBQSxJQUFBRyxDQUFBLFNBQUFOLGNBQUEsQ0FBQUMsSUFBQSxJQUFBSyxDQUFBLFNBQUFJLE9BQUE7SUFPTWEsRUFBQSxHQUFBdkIsY0FBYyxDQUFBQyxJQUFLLENBQUF1QixvQkFBcUIsQ0FDdkN4QixjQUFjLENBQUFHLEtBQU0sSUFBSSxLQUFLLEVBQzdCO01BQUFVLEtBQUE7TUFBQUg7SUFBaUIsQ0FDbkIsQ0FBQztJQUFBSixDQUFBLE9BQUFPLEtBQUE7SUFBQVAsQ0FBQSxPQUFBTixjQUFBLENBQUFHLEtBQUE7SUFBQUcsQ0FBQSxPQUFBTixjQUFBLENBQUFDLElBQUE7SUFBQUssQ0FBQSxPQUFBSSxPQUFBO0lBQUFKLENBQUEsT0FBQWlCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFqQixDQUFBO0VBQUE7RUFBQSxJQUFBbUIsRUFBQTtFQUFBLElBQUFuQixDQUFBLFNBQUFpQixFQUFBLElBQUFqQixDQUFBLFNBQUFXLGNBQUE7SUFOTFEsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFXLFFBQUMsQ0FBRCxHQUFDLENBQVksUUFBQyxDQUFELEdBQUMsQ0FDbEQsQ0FBQyxJQUFJLENBQ0ZSLGVBQWEsQ0FBRSxDQUNmLENBQUFNLEVBR0QsQ0FBRSxDQUVKLEVBUEMsSUFBSSxDQVFQLEVBVEMsR0FBRyxDQVNFO0lBQUFqQixDQUFBLE9BQUFpQixFQUFBO0lBQUFqQixDQUFBLE9BQUFXLGNBQUE7SUFBQVgsQ0FBQSxPQUFBbUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQW5CLENBQUE7RUFBQTtFQVZSLE1BQUFvQixPQUFBLEdBQ0VELEVBU007RUFjVyxNQUFBRSxFQUFBLEdBQUFULFVBQVUsR0FBVixNQUE2QixHQUE3QixPQUE2QjtFQUFBLElBQUFVLEVBQUE7RUFBQSxJQUFBdEIsQ0FBQSxTQUFBb0IsT0FBQSxJQUFBcEIsQ0FBQSxTQUFBRSxNQUFBLElBQUFGLENBQUEsU0FBQUcsUUFBQSxJQUFBSCxDQUFBLFNBQUFTLElBQUEsSUFBQVQsQ0FBQSxTQUFBcUIsRUFBQSxJQUFBckIsQ0FBQSxTQUFBYyxLQUFBLElBQUFkLENBQUEsU0FBQU4sY0FBQSxJQUFBTSxDQUFBLFNBQUFLLGNBQUEsSUFBQUwsQ0FBQSxTQUFBTSxXQUFBO0lBVjlDZ0IsRUFBQSxJQUFDLG9CQUFvQixDQUNINUIsY0FBYyxDQUFkQSxlQUFhLENBQUMsQ0FDZFcsY0FBYyxDQUFkQSxlQUFhLENBQUMsQ0FDdEJILE1BQU0sQ0FBTkEsT0FBSyxDQUFDLENBQ0pDLFFBQVEsQ0FBUkEsU0FBTyxDQUFDLENBQ0xHLFdBQVcsQ0FBWEEsWUFBVSxDQUFDLENBQ2pCUSxLQUFLLENBQUxBLE1BQUksQ0FBQyxDQUNITSxPQUFPLENBQVBBLFFBQU0sQ0FBQyxDQUNWWCxJQUFJLENBQUpBLEtBQUcsQ0FBQyxDQUNFTSxVQUFVLENBQVZBLFdBQVMsQ0FBQyxDQUNQLGFBQTZCLENBQTdCLENBQUFNLEVBQTRCLENBQUMsQ0FDN0IsY0FBaUIsQ0FBakIsaUJBQWlCLEdBQ2hDO0lBQUFyQixDQUFBLE9BQUFvQixPQUFBO0lBQUFwQixDQUFBLE9BQUFFLE1BQUE7SUFBQUYsQ0FBQSxPQUFBRyxRQUFBO0lBQUFILENBQUEsT0FBQVMsSUFBQTtJQUFBVCxDQUFBLE9BQUFxQixFQUFBO0lBQUFyQixDQUFBLE9BQUFjLEtBQUE7SUFBQWQsQ0FBQSxPQUFBTixjQUFBO0lBQUFNLENBQUEsT0FBQUssY0FBQTtJQUFBTCxDQUFBLE9BQUFNLFdBQUE7SUFBQU4sQ0FBQSxPQUFBc0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXRCLENBQUE7RUFBQTtFQUFBLE9BWkZzQixFQVlFO0FBQUE7QUFoRUMsU0FBQU4sTUFBQW5CLEtBQUE7RUFBQSxPQXFCNkNBLEtBQUssSUFBSVAsU0FBUztBQUFBIiwiaWdub3JlTGlzdCI6W119
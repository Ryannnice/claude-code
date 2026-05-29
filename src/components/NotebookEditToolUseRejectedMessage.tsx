// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 HighlightedCode，将 ./HighlightedCode.js 中已经封装好的能力接到本文件流程里。
import { HighlightedCode } from './HighlightedCode.js';
// 引入 MessageResponse，将 ./MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from './MessageResponse.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  notebook_path: string;
  cell_id: string | undefined;
  new_source: string;
  cell_type?: 'code' | 'markdown';
  edit_mode?: 'replace' | 'insert' | 'delete';
  verbose: boolean;
};
// NotebookEditToolUseRejectedMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function NotebookEditToolUseRejectedMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(20);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    notebook_path,
    cell_id,
    new_source,
    cell_type,
    edit_mode: t1,
    verbose
  } = t0;
  // edit_mode标记终端 UI Notebook Edit Tool U...是否启用对应路径。
  const edit_mode = t1 === undefined ? "replace" : t1;
  // operation标记终端 UI Notebook Edit Tool U...是否启用对应路径。
  const operation = edit_mode === "delete" ? "delete" : `${edit_mode} cell in`;
  // t2 暂存 `<Text color="subtle">User rejected {operation} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== operation) {
    // t2 暂存 `<Text color="subtle">User rejected {operation} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color="subtle">User rejected {operation} </Text>;
    // $[0] 缓存 `operation`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = operation;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3 暂存 `verbose ? notebook_path : relative(getCwd(), notebook_pat...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== notebook_path || $[3] !== verbose) {
    // t3 暂存 `verbose ? notebook_path : relative(getCwd(), notebook_pat...` 生成的渲染片段，后续返回路径直接复用。
    t3 = verbose ? notebook_path : relative(getCwd(), notebook_path);
    // $[2] 缓存 `notebook_path`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = notebook_path;
    // $[3] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = verbose;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<Text bold={true} color="subtle">{t3}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t3) {
    // t4 暂存 `<Text bold={true} color="subtle">{t3}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text bold={true} color="subtle">{t3}</Text>;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Text color="subtle"> at cell {cell_id}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== cell_id) {
    // t5 暂存 `<Text color="subtle"> at cell {cell_id}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color="subtle"> at cell {cell_id}</Text>;
    // $[7] 缓存 `cell_id`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = cell_id;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<Box flexDirection="row">{t2}{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== t2 || $[10] !== t4 || $[11] !== t5) {
    // t6 暂存 `<Box flexDirection="row">{t2}{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="row">{t2}{t4}{t5}</Box>;
    // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t2;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // t7 暂存 `edit_mode !== "delete" && <Box marginTop={1} flexDirectio...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== cell_type || $[14] !== edit_mode || $[15] !== new_source) {
    // t7 暂存 `edit_mode !== "delete" && <Box marginTop={1} flexDirectio...` 生成的渲染片段，后续返回路径直接复用。
    t7 = edit_mode !== "delete" && <Box marginTop={1} flexDirection="column"><HighlightedCode code={new_source} filePath={cell_type === "markdown" ? "file.md" : "file.py"} dim={true} /></Box>;
    // $[13] 缓存 `cell_type`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = cell_type;
    // $[14] 缓存 `edit_mode`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = edit_mode;
    // $[15] 缓存 `new_source`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = new_source;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // t8 暂存 `<MessageResponse><Box flexDirection="column">{t6}{t7}</Bo...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== t6 || $[18] !== t7) {
    // t8 暂存 `<MessageResponse><Box flexDirection="column">{t6}{t7}</Bo...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <MessageResponse><Box flexDirection="column">{t6}{t7}</Box></MessageResponse>;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[19];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZWxhdGl2ZSIsIlJlYWN0IiwiZ2V0Q3dkIiwiQm94IiwiVGV4dCIsIkhpZ2hsaWdodGVkQ29kZSIsIk1lc3NhZ2VSZXNwb25zZSIsIlByb3BzIiwibm90ZWJvb2tfcGF0aCIsImNlbGxfaWQiLCJuZXdfc291cmNlIiwiY2VsbF90eXBlIiwiZWRpdF9tb2RlIiwidmVyYm9zZSIsIk5vdGVib29rRWRpdFRvb2xVc2VSZWplY3RlZE1lc3NhZ2UiLCJ0MCIsIiQiLCJfYyIsInQxIiwidW5kZWZpbmVkIiwib3BlcmF0aW9uIiwidDIiLCJ0MyIsInQ0IiwidDUiLCJ0NiIsInQ3IiwidDgiXSwic291cmNlcyI6WyJOb3RlYm9va0VkaXRUb29sVXNlUmVqZWN0ZWRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWxhdGl2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGdldEN3ZCB9IGZyb20gJ3NyYy91dGlscy9jd2QuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBIaWdobGlnaHRlZENvZGUgfSBmcm9tICcuL0hpZ2hsaWdodGVkQ29kZS5qcydcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4vTWVzc2FnZVJlc3BvbnNlLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBub3RlYm9va19wYXRoOiBzdHJpbmdcbiAgY2VsbF9pZDogc3RyaW5nIHwgdW5kZWZpbmVkXG4gIG5ld19zb3VyY2U6IHN0cmluZ1xuICBjZWxsX3R5cGU/OiAnY29kZScgfCAnbWFya2Rvd24nXG4gIGVkaXRfbW9kZT86ICdyZXBsYWNlJyB8ICdpbnNlcnQnIHwgJ2RlbGV0ZSdcbiAgdmVyYm9zZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gTm90ZWJvb2tFZGl0VG9vbFVzZVJlamVjdGVkTWVzc2FnZSh7XG4gIG5vdGVib29rX3BhdGgsXG4gIGNlbGxfaWQsXG4gIG5ld19zb3VyY2UsXG4gIGNlbGxfdHlwZSxcbiAgZWRpdF9tb2RlID0gJ3JlcGxhY2UnLFxuICB2ZXJib3NlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBvcGVyYXRpb24gPSBlZGl0X21vZGUgPT09ICdkZWxldGUnID8gJ2RlbGV0ZScgOiBgJHtlZGl0X21vZGV9IGNlbGwgaW5gXG5cbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VidGxlXCI+VXNlciByZWplY3RlZCB7b3BlcmF0aW9ufSA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgYm9sZCBjb2xvcj1cInN1YnRsZVwiPlxuICAgICAgICAgICAge3ZlcmJvc2UgPyBub3RlYm9va19wYXRoIDogcmVsYXRpdmUoZ2V0Q3dkKCksIG5vdGVib29rX3BhdGgpfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1YnRsZVwiPiBhdCBjZWxsIHtjZWxsX2lkfTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHtlZGl0X21vZGUgIT09ICdkZWxldGUnICYmIChcbiAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgPEhpZ2hsaWdodGVkQ29kZVxuICAgICAgICAgICAgICBjb2RlPXtuZXdfc291cmNlfVxuICAgICAgICAgICAgICBmaWxlUGF0aD17Y2VsbF90eXBlID09PSAnbWFya2Rvd24nID8gJ2ZpbGUubWQnIDogJ2ZpbGUucHknfVxuICAgICAgICAgICAgICBkaW1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICA8L01l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
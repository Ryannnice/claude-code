// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react';
// 引入 useTerminalSize，将 ../../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
// 引入 Box、NoSelect、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, NoSelect, Text } from '../../../ink.js';
// 复用 intersperse 工具函数，把通用处理留在 ../../../utils/array.js 中维护。
import { intersperse } from '../../../utils/array.js';
// 复用 getPatchForDisplay 工具函数，把通用处理留在 ../../../utils/diff.js 中维护。
import { getPatchForDisplay } from '../../../utils/diff.js';
// 引入 HighlightedCode，将 ../../HighlightedCode.js 中已经封装好的能力接到本文件流程里。
import { HighlightedCode } from '../../HighlightedCode.js';
// 引入 StructuredDiff，将 ../../StructuredDiff.js 中已经封装好的能力接到本文件流程里。
import { StructuredDiff } from '../../StructuredDiff.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  file_path: string;
  content: string;
  fileExists: boolean;
  oldContent: string;
};
// FileWriteToolDiff 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FileWriteToolDiff(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(15);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    file_path,
    content,
    fileExists,
    oldContent
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // t1 暂存 `null` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // 权限确认界面 File Write Tool Diff在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // 文件存在标记缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!fileExists) {
      // t1 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
      t1 = null;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb0;
    }
    // t2 暂存 `getPatchForDisplay({` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== content || $[1] !== file_path || $[2] !== oldContent) {
      // t2 暂存 `getPatchForDisplay({` 生成的渲染片段，后续返回路径直接复用。
      t2 = getPatchForDisplay({
        filePath: file_path,
        fileContents: oldContent,
        edits: [{
          old_string: oldContent,
          new_string: content,
          replace_all: false
        }]
      });
      // $[0] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = content;
      // $[1] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = file_path;
      // $[2] 缓存 `oldContent`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = oldContent;
      // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[3];
    }
    // t1 暂存 `t2` 生成的渲染片段，后续返回路径直接复用。
    t1 = t2;
  }
  // hunks 集合 命名 `t1`，让后续代码直接表达这个值的用途。
  const hunks = t1;
  // t2 暂存 `content.split("\n")[0] ?? null` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== content) {
    // t2 暂存 `content.split("\n")[0] ?? null` 生成的渲染片段，后续返回路径直接复用。
    t2 = content.split("\n")[0] ?? null;
    // $[4] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = content;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // firstLine沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const firstLine = t2;
  // t3 暂存 `hunks ? intersperse(hunks.map(_ => <StructuredDiff key={_...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== columns || $[7] !== content || $[8] !== file_path || $[9] !== firstLine || $[10] !== hunks || $[11] !== oldContent) {
    // t3 暂存 `hunks ? intersperse(hunks.map(_ => <StructuredDiff key={_...` 生成的渲染片段，后续返回路径直接复用。
    t3 = hunks ? intersperse(hunks.map(_ => <StructuredDiff key={_.newStart} patch={_} dim={false} filePath={file_path} firstLine={firstLine} fileContent={oldContent} width={columns - 2} />), _temp) : <HighlightedCode code={content || "(No content)"} filePath={file_path} />;
    // $[6] 缓存 `columns`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = columns;
    // $[7] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = content;
    // $[8] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = file_path;
    // $[9] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = firstLine;
    // $[10] 缓存 `hunks`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = hunks;
    // $[11] 缓存 `oldContent`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = oldContent;
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[12];
  }
  // t4 暂存 `<Box flexDirection="column"><Box borderColor="subtle" bor...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t3) {
    // t4 暂存 `<Box flexDirection="column"><Box borderColor="subtle" bor...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column"><Box borderColor="subtle" borderStyle="dashed" flexDirection="column" borderLeft={false} borderRight={false} paddingX={1}>{t3}</Box></Box>;
    // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t3;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[14];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(i) {
  // 返回 `<NoSelect fromLeftEdge={true} key={`ellipsis-${i}`}><Text dimColor={tru...`，作为终端渲染这次计算的结果。
  return <NoSelect fromLeftEdge={true} key={`ellipsis-${i}`}><Text dimColor={true}>...</Text></NoSelect>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1lbW8iLCJ1c2VUZXJtaW5hbFNpemUiLCJCb3giLCJOb1NlbGVjdCIsIlRleHQiLCJpbnRlcnNwZXJzZSIsImdldFBhdGNoRm9yRGlzcGxheSIsIkhpZ2hsaWdodGVkQ29kZSIsIlN0cnVjdHVyZWREaWZmIiwiUHJvcHMiLCJmaWxlX3BhdGgiLCJjb250ZW50IiwiZmlsZUV4aXN0cyIsIm9sZENvbnRlbnQiLCJGaWxlV3JpdGVUb29sRGlmZiIsInQwIiwiJCIsIl9jIiwiY29sdW1ucyIsInQxIiwiYmIwIiwidDIiLCJmaWxlUGF0aCIsImZpbGVDb250ZW50cyIsImVkaXRzIiwib2xkX3N0cmluZyIsIm5ld19zdHJpbmciLCJyZXBsYWNlX2FsbCIsImh1bmtzIiwic3BsaXQiLCJmaXJzdExpbmUiLCJ0MyIsIm1hcCIsIl8iLCJuZXdTdGFydCIsIl90ZW1wIiwidDQiLCJwYWRkaW5nWCIsImkiXSwic291cmNlcyI6WyJGaWxlV3JpdGVUb29sRGlmZi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi8uLi8uLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyBCb3gsIE5vU2VsZWN0LCBUZXh0IH0gZnJvbSAnLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgaW50ZXJzcGVyc2UgfSBmcm9tICcuLi8uLi8uLi91dGlscy9hcnJheS5qcydcbmltcG9ydCB7IGdldFBhdGNoRm9yRGlzcGxheSB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2RpZmYuanMnXG5pbXBvcnQgeyBIaWdobGlnaHRlZENvZGUgfSBmcm9tICcuLi8uLi9IaWdobGlnaHRlZENvZGUuanMnXG5pbXBvcnQgeyBTdHJ1Y3R1cmVkRGlmZiB9IGZyb20gJy4uLy4uL1N0cnVjdHVyZWREaWZmLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBmaWxlX3BhdGg6IHN0cmluZ1xuICBjb250ZW50OiBzdHJpbmdcbiAgZmlsZUV4aXN0czogYm9vbGVhblxuICBvbGRDb250ZW50OiBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEZpbGVXcml0ZVRvb2xEaWZmKHtcbiAgZmlsZV9wYXRoLFxuICBjb250ZW50LFxuICBmaWxlRXhpc3RzLFxuICBvbGRDb250ZW50LFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IGNvbHVtbnMgfSA9IHVzZVRlcm1pbmFsU2l6ZSgpXG4gIGNvbnN0IGh1bmtzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFmaWxlRXhpc3RzKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICByZXR1cm4gZ2V0UGF0Y2hGb3JEaXNwbGF5KHtcbiAgICAgIGZpbGVQYXRoOiBmaWxlX3BhdGgsXG4gICAgICBmaWxlQ29udGVudHM6IG9sZENvbnRlbnQsXG4gICAgICBlZGl0czogW1xuICAgICAgICB7XG4gICAgICAgICAgb2xkX3N0cmluZzogb2xkQ29udGVudCxcbiAgICAgICAgICBuZXdfc3RyaW5nOiBjb250ZW50LFxuICAgICAgICAgIHJlcGxhY2VfYWxsOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSlcbiAgfSwgW2ZpbGVFeGlzdHMsIGZpbGVfcGF0aCwgb2xkQ29udGVudCwgY29udGVudF0pXG5cbiAgY29uc3QgZmlyc3RMaW5lID0gY29udGVudC5zcGxpdCgnXFxuJylbMF0gPz8gbnVsbFxuICBjb25zdCBwYWRkaW5nWCA9IDFcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPEJveFxuICAgICAgICBib3JkZXJDb2xvcj1cInN1YnRsZVwiXG4gICAgICAgIGJvcmRlclN0eWxlPVwiZGFzaGVkXCJcbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIGJvcmRlckxlZnQ9e2ZhbHNlfVxuICAgICAgICBib3JkZXJSaWdodD17ZmFsc2V9XG4gICAgICAgIHBhZGRpbmdYPXtwYWRkaW5nWH1cbiAgICAgID5cbiAgICAgICAge2h1bmtzID8gKFxuICAgICAgICAgIGludGVyc3BlcnNlKFxuICAgICAgICAgICAgaHVua3MubWFwKF8gPT4gKFxuICAgICAgICAgICAgICA8U3RydWN0dXJlZERpZmZcbiAgICAgICAgICAgICAgICBrZXk9e18ubmV3U3RhcnR9XG4gICAgICAgICAgICAgICAgcGF0Y2g9e199XG4gICAgICAgICAgICAgICAgZGltPXtmYWxzZX1cbiAgICAgICAgICAgICAgICBmaWxlUGF0aD17ZmlsZV9wYXRofVxuICAgICAgICAgICAgICAgIGZpcnN0TGluZT17Zmlyc3RMaW5lfVxuICAgICAgICAgICAgICAgIGZpbGVDb250ZW50PXtvbGRDb250ZW50fVxuICAgICAgICAgICAgICAgIHdpZHRoPXtjb2x1bW5zIC0gMiAqIHBhZGRpbmdYfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKSksXG4gICAgICAgICAgICBpID0+IChcbiAgICAgICAgICAgICAgPE5vU2VsZWN0IGZyb21MZWZ0RWRnZSBrZXk9e2BlbGxpcHNpcy0ke2l9YH0+XG4gICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+Li4uPC9UZXh0PlxuICAgICAgICAgICAgICA8L05vU2VsZWN0PlxuICAgICAgICAgICAgKSxcbiAgICAgICAgICApXG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPEhpZ2hsaWdodGVkQ29kZVxuICAgICAgICAgICAgY29kZT17Y29udGVudCB8fCAnKE5vIGNvbnRlbnQpJ31cbiAgICAgICAgICAgIGZpbGVQYXRoPXtmaWxlX3BhdGh9XG4gICAgICAgICAgLz5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FB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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准终端渲染的数据契约。
import type { StructuredPatchHunk } from 'diff';
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useTerminalSize，将 src/hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from 'src/hooks/useTerminalSize.js';
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 HighlightedCode，将 ./HighlightedCode.js 中已经封装好的能力接到本文件流程里。
import { HighlightedCode } from './HighlightedCode.js';
// 引入 MessageResponse，将 ./MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from './MessageResponse.js';
// 引入 StructuredDiffList，将 ./StructuredDiffList.js 中已经封装好的能力接到本文件流程里。
import { StructuredDiffList } from './StructuredDiffList.js';
// MAX_LINES_TO_RENDER 命名 `10`，让后续代码直接表达这个值的用途。
const MAX_LINES_TO_RENDER = 10;
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  file_path: string;
  operation: 'write' | 'update';
  // For updates - show diff
  patch?: StructuredPatchHunk[];
  firstLine: string | null;
  fileContent?: string;
  // For new file creation - show content preview
  content?: string;
  style?: 'condensed';
  verbose: boolean;
};
// FileEditToolUseRejectedMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FileEditToolUseRejectedMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(38);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    file_path,
    operation,
    patch,
    firstLine,
    fileContent,
    content,
    style,
    verbose
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // t1 暂存 `<Text color="subtle">User rejected {operation} to </Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== operation) {
    // t1 暂存 `<Text color="subtle">User rejected {operation} to </Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color="subtle">User rejected {operation} to </Text>;
    // $[0] 缓存 `operation`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = operation;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `verbose ? file_path : relative(getCwd(), file_path)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== file_path || $[3] !== verbose) {
    // t2 暂存 `verbose ? file_path : relative(getCwd(), file_path)` 生成的渲染片段，后续返回路径直接复用。
    t2 = verbose ? file_path : relative(getCwd(), file_path);
    // $[2] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = file_path;
    // $[3] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = verbose;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text bold={true} color="subtle">{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t2) {
    // t3 暂存 `<Text bold={true} color="subtle">{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text bold={true} color="subtle">{t2}</Text>;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Box flexDirection="row">{t1}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t1 || $[8] !== t3) {
    // t4 暂存 `<Box flexDirection="row">{t1}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="row">{t1}{t3}</Box>;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // 文本内容沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const text = t4;
  // 只有 `style === "condensed" && !verbose` 满足时，终端渲染才执行该分支。
  if (style === "condensed" && !verbose) {
    // t5 暂存 `<MessageResponse>{text}</MessageResponse>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== text) {
      // t5 暂存 `<MessageResponse>{text}</MessageResponse>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <MessageResponse>{text}</MessageResponse>;
      // $[10] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = text;
      // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[11];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // `operation === "write" && content` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (operation === "write" && content !== undefined) {
    // plusLines 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let plusLines;
    // t5 暂存 `verbose ? content : lines.slice(0, MAX_LINES_TO_RENDER).j...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[12] !== content || $[13] !== verbose) {
      // 文本行格式化`content.split`，供终端渲染后续处理使用。
      const lines = content.split("\n");
      // numLines 集合 命名 `lines.length`，让后续代码直接表达这个值的用途。
      const numLines = lines.length;
      // plusLines 集合更新为 `numLines - MAX_LINES_TO_RENDER`，确保终端 UI后续读取最新状态。
      plusLines = numLines - MAX_LINES_TO_RENDER;
      // t5 暂存 `verbose ? content : lines.slice(0, MAX_LINES_TO_RENDER).j...` 生成的渲染片段，后续返回路径直接复用。
      t5 = verbose ? content : lines.slice(0, MAX_LINES_TO_RENDER).join("\n");
      // $[12] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = content;
      // $[13] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = verbose;
      // $[14] 缓存 `plusLines`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = plusLines;
      // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t5;
    } else {
      // plusLines 集合更新为 `$[14]`，确保终端 UI后续读取最新状态。
      plusLines = $[14];
      // t5 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[15];
    }
    // truncatedContent保存`t5`，作为后续临时缓存值处理的输入。
    const truncatedContent = t5;
    // t6标记终端 UI File Edit Tool Use R...是否启用对应路径。
    const t6 = truncatedContent || "(No content)";
    // t7保存`columns - 12`，供后续判断或组装使用。
    const t7 = columns - 12;
    // t8 暂存 `<HighlightedCode code={t6} filePath={file_path} width={t7...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[16] !== file_path || $[17] !== t6 || $[18] !== t7) {
      // t8 暂存 `<HighlightedCode code={t6} filePath={file_path} width={t7...` 生成的渲染片段，后续返回路径直接复用。
      t8 = <HighlightedCode code={t6} filePath={file_path} width={t7} dim={true} />;
      // $[16] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = file_path;
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
    // t9 暂存 `!verbose && plusLines > 0 && <Text dimColor={true}>… +{pl...` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[20] !== plusLines || $[21] !== verbose) {
      // t9 暂存 `!verbose && plusLines > 0 && <Text dimColor={true}>… +{pl...` 生成的渲染片段，后续返回路径直接复用。
      t9 = !verbose && plusLines > 0 && <Text dimColor={true}>… +{plusLines} lines</Text>;
      // $[20] 缓存 `plusLines`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = plusLines;
      // $[21] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = verbose;
      // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[22];
    }
    // t10 暂存 `<MessageResponse><Box flexDirection="column">{text}{t8}{t...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[23] !== t8 || $[24] !== t9 || $[25] !== text) {
      // t10 暂存 `<MessageResponse><Box flexDirection="column">{text}{t8}{t...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <MessageResponse><Box flexDirection="column">{text}{t8}{t9}</Box></MessageResponse>;
      // $[23] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = t8;
      // $[24] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = t9;
      // $[25] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = text;
      // $[26] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[26] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[26];
    }
    // 返回 `t10`，作为终端渲染这次计算的结果。
    return t10;
  }
  // !patch || patch为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (!patch || patch.length === 0) {
    // t5 暂存 `<MessageResponse>{text}</MessageResponse>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[27] !== text) {
      // t5 暂存 `<MessageResponse>{text}</MessageResponse>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <MessageResponse>{text}</MessageResponse>;
      // $[27] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
      $[27] = text;
      // $[28] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[28];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // t5保存`columns - 12`，供终端 UI File Edit Tool Use R...后续判断或输出使用。
  const t5 = columns - 12;
  // t6 暂存 `<StructuredDiffList hunks={patch} dim={true} width={t5} f...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== fileContent || $[30] !== file_path || $[31] !== firstLine || $[32] !== patch || $[33] !== t5) {
    // t6 暂存 `<StructuredDiffList hunks={patch} dim={true} width={t5} f...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <StructuredDiffList hunks={patch} dim={true} width={t5} filePath={file_path} firstLine={firstLine} fileContent={fileContent} />;
    // $[29] 缓存 `fileContent`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = fileContent;
    // $[30] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = file_path;
    // $[31] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = firstLine;
    // $[32] 缓存 `patch`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = patch;
    // $[33] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t5;
    // $[34] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[34];
  }
  // t7 暂存 `<MessageResponse><Box flexDirection="column">{text}{t6}</...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== t6 || $[36] !== text) {
    // t7 暂存 `<MessageResponse><Box flexDirection="column">{text}{t6}</...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <MessageResponse><Box flexDirection="column">{text}{t6}</Box></MessageResponse>;
    // $[35] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t6;
    // $[36] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = text;
    // $[37] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[37];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTdHJ1Y3R1cmVkUGF0Y2hIdW5rIiwicmVsYXRpdmUiLCJSZWFjdCIsInVzZVRlcm1pbmFsU2l6ZSIsImdldEN3ZCIsIkJveCIsIlRleHQiLCJIaWdobGlnaHRlZENvZGUiLCJNZXNzYWdlUmVzcG9uc2UiLCJTdHJ1Y3R1cmVkRGlmZkxpc3QiLCJNQVhfTElORVNfVE9fUkVOREVSIiwiUHJvcHMiLCJmaWxlX3BhdGgiLCJvcGVyYXRpb24iLCJwYXRjaCIsImZpcnN0TGluZSIsImZpbGVDb250ZW50IiwiY29udGVudCIsInN0eWxlIiwidmVyYm9zZSIsIkZpbGVFZGl0VG9vbFVzZVJlamVjdGVkTWVzc2FnZSIsInQwIiwiJCIsIl9jIiwiY29sdW1ucyIsInQxIiwidDIiLCJ0MyIsInQ0IiwidGV4dCIsInQ1IiwidW5kZWZpbmVkIiwicGx1c0xpbmVzIiwibGluZXMiLCJzcGxpdCIsIm51bUxpbmVzIiwibGVuZ3RoIiwic2xpY2UiLCJqb2luIiwidHJ1bmNhdGVkQ29udGVudCIsInQ2IiwidDciLCJ0OCIsInQ5IiwidDEwIl0sInNvdXJjZXMiOlsiRmlsZUVkaXRUb29sVXNlUmVqZWN0ZWRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFN0cnVjdHVyZWRQYXRjaEh1bmsgfSBmcm9tICdkaWZmJ1xuaW1wb3J0IHsgcmVsYXRpdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICdzcmMvaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgZ2V0Q3dkIH0gZnJvbSAnc3JjL3V0aWxzL2N3ZC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IEhpZ2hsaWdodGVkQ29kZSB9IGZyb20gJy4vSGlnaGxpZ2h0ZWRDb2RlLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBTdHJ1Y3R1cmVkRGlmZkxpc3QgfSBmcm9tICcuL1N0cnVjdHVyZWREaWZmTGlzdC5qcydcblxuY29uc3QgTUFYX0xJTkVTX1RPX1JFTkRFUiA9IDEwXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGZpbGVfcGF0aDogc3RyaW5nXG4gIG9wZXJhdGlvbjogJ3dyaXRlJyB8ICd1cGRhdGUnXG4gIC8vIEZvciB1cGRhdGVzIC0gc2hvdyBkaWZmXG4gIHBhdGNoPzogU3RydWN0dXJlZFBhdGNoSHVua1tdXG4gIGZpcnN0TGluZTogc3RyaW5nIHwgbnVsbFxuICBmaWxlQ29udGVudD86IHN0cmluZ1xuICAvLyBGb3IgbmV3IGZpbGUgY3JlYXRpb24gLSBzaG93IGNvbnRlbnQgcHJldmlld1xuICBjb250ZW50Pzogc3RyaW5nXG4gIHN0eWxlPzogJ2NvbmRlbnNlZCdcbiAgdmVyYm9zZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gRmlsZUVkaXRUb29sVXNlUmVqZWN0ZWRNZXNzYWdlKHtcbiAgZmlsZV9wYXRoLFxuICBvcGVyYXRpb24sXG4gIHBhdGNoLFxuICBmaXJzdExpbmUsXG4gIGZpbGVDb250ZW50LFxuICBjb250ZW50LFxuICBzdHlsZSxcbiAgdmVyYm9zZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBjb2x1bW5zIH0gPSB1c2VUZXJtaW5hbFNpemUoKVxuICBjb25zdCB0ZXh0ID0gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgPFRleHQgY29sb3I9XCJzdWJ0bGVcIj5Vc2VyIHJlamVjdGVkIHtvcGVyYXRpb259IHRvIDwvVGV4dD5cbiAgICAgIDxUZXh0IGJvbGQgY29sb3I9XCJzdWJ0bGVcIj5cbiAgICAgICAge3ZlcmJvc2UgPyBmaWxlX3BhdGggOiByZWxhdGl2ZShnZXRDd2QoKSwgZmlsZV9wYXRoKX1cbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxuXG4gIC8vIEZvciBjb25kZW5zZWQgc3R5bGUsIGp1c3Qgc2hvdyB0aGUgdGV4dFxuICBpZiAoc3R5bGUgPT09ICdjb25kZW5zZWQnICYmICF2ZXJib3NlKSB7XG4gICAgcmV0dXJuIDxNZXNzYWdlUmVzcG9uc2U+e3RleHR9PC9NZXNzYWdlUmVzcG9uc2U+XG4gIH1cblxuICAvLyBGb3IgbmV3IGZpbGUgY3JlYXRpb24sIHNob3cgY29udGVudCBwcmV2aWV3IChkaW1tZWQpXG4gIGlmIChvcGVyYXRpb24gPT09ICd3cml0ZScgJiYgY29udGVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKVxuICAgIGNvbnN0IG51bUxpbmVzID0gbGluZXMubGVuZ3RoXG4gICAgY29uc3QgcGx1c0xpbmVzID0gbnVtTGluZXMgLSBNQVhfTElORVNfVE9fUkVOREVSXG4gICAgY29uc3QgdHJ1bmNhdGVkQ29udGVudCA9IHZlcmJvc2VcbiAgICAgID8gY29udGVudFxuICAgICAgOiBsaW5lcy5zbGljZSgwLCBNQVhfTElORVNfVE9fUkVOREVSKS5qb2luKCdcXG4nKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIHt0ZXh0fVxuICAgICAgICAgIDxIaWdobGlnaHRlZENvZGVcbiAgICAgICAgICAgIGNvZGU9e3RydW5jYXRlZENvbnRlbnQgfHwgJyhObyBjb250ZW50KSd9XG4gICAgICAgICAgICBmaWxlUGF0aD17ZmlsZV9wYXRofVxuICAgICAgICAgICAgd2lkdGg9e2NvbHVtbnMgLSAxMn1cbiAgICAgICAgICAgIGRpbVxuICAgICAgICAgIC8+XG4gICAgICAgICAgeyF2ZXJib3NlICYmIHBsdXNMaW5lcyA+IDAgJiYgKFxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+4oCmICt7cGx1c0xpbmVzfSBsaW5lczwvVGV4dD5cbiAgICAgICAgICApfVxuICAgICAgICA8L0JveD5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIClcbiAgfVxuXG4gIC8vIEZvciB1cGRhdGVzLCBzaG93IGRpZmZcbiAgaWYgKCFwYXRjaCB8fCBwYXRjaC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gPE1lc3NhZ2VSZXNwb25zZT57dGV4dH08L01lc3NhZ2VSZXNwb25zZT5cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICB7dGV4dH1cbiAgICAgICAgPFN0cnVjdHVyZWREaWZmTGlzdFxuICAgICAgICAgIGh1bmtzPXtwYXRjaH1cbiAgICAgICAgICBkaW1cbiAgICAgICAgICB3aWR0aD17Y29sdW1ucyAtIDEyfVxuICAgICAgICAgIGZpbGVQYXRoPXtmaWxlX3BhdGh9XG4gICAgICAgICAgZmlyc3RMaW5lPXtmaXJzdExpbmV9XG4gICAgICAgICAgZmlsZUNvbnRlbnQ9e2ZpbGVDb250ZW50fVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLG1CQUFtQixRQUFRLE1BQU07QUFDL0MsU0FBU0MsUUFBUSxRQUFRLE1BQU07QUFDL0IsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxlQUFlLFFBQVEsOEJBQThCO0FBQzlELFNBQVNDLE1BQU0sUUFBUSxrQkFBa0I7QUFDekMsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUNyQyxTQUFTQyxlQUFlLFFBQVEsc0JBQXNCO0FBQ3RELFNBQVNDLGVBQWUsUUFBUSxzQkFBc0I7QUFDdEQsU0FBU0Msa0JBQWtCLFFBQVEseUJBQXlCO0FBRTVELE1BQU1DLG1CQUFtQixHQUFHLEVBQUU7QUFFOUIsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFNBQVMsRUFBRSxNQUFN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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准终端渲染的数据契约。
import type { StructuredPatchHunk } from 'diff';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useTerminalSize，将 ../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../hooks/useTerminalSize.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 count 工具函数，把通用处理留在 ../utils/array.js 中维护。
import { count } from '../utils/array.js';
// 引入 MessageResponse，将 ./MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from './MessageResponse.js';
// 引入 StructuredDiffList，将 ./StructuredDiffList.js 中已经封装好的能力接到本文件流程里。
import { StructuredDiffList } from './StructuredDiffList.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  filePath: string;
  structuredPatch: StructuredPatchHunk[];
  firstLine: string | null;
  fileContent?: string;
  style?: 'condensed';
  verbose: boolean;
  previewHint?: string;
};
// FileEditToolUpdatedMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FileEditToolUpdatedMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(22);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath,
    structuredPatch,
    firstLine,
    fileContent,
    style,
    verbose,
    previewHint
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // numAdditions 集合派生`structuredPatch.reduce`，供终端渲染后续处理使用。
  const numAdditions = structuredPatch.reduce(_temp2, 0);
  // numRemovals 集合派生`structuredPatch.reduce`，供终端渲染后续处理使用。
  const numRemovals = structuredPatch.reduce(_temp4, 0);
  // t1 暂存 `numAdditions > 0 ? <>Added <Text bold={true}>{numAddition...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== numAdditions) {
    // t1 暂存 `numAdditions > 0 ? <>Added <Text bold={true}>{numAddition...` 生成的渲染片段，后续返回路径直接复用。
    t1 = numAdditions > 0 ? <>Added <Text bold={true}>{numAdditions}</Text>{" "}{numAdditions > 1 ? "lines" : "line"}</> : null;
    // $[0] 缓存 `numAdditions`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = numAdditions;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2标记终端 UI File Edit Tool Updat...是否启用对应路径。
  const t2 = numAdditions > 0 && numRemovals > 0 ? ", " : null;
  // t3 暂存 `numRemovals > 0 ? <>{numAdditions === 0 ? "R" : "r"}emove...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== numAdditions || $[3] !== numRemovals) {
    // t3 暂存 `numRemovals > 0 ? <>{numAdditions === 0 ? "R" : "r"}emove...` 生成的渲染片段，后续返回路径直接复用。
    t3 = numRemovals > 0 ? <>{numAdditions === 0 ? "R" : "r"}emoved <Text bold={true}>{numRemovals}</Text>{" "}{numRemovals > 1 ? "lines" : "line"}</> : null;
    // $[2] 缓存 `numAdditions`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = numAdditions;
    // $[3] 缓存 `numRemovals`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = numRemovals;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<Text>{t1}{t2}{t3}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t1 || $[6] !== t2 || $[7] !== t3) {
    // t4 暂存 `<Text>{t1}{t2}{t3}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text>{t1}{t2}{t3}</Text>;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // 文本 命名 `t4`，让后续代码直接表达这个值的用途。
  const text = t4;
  // 满足 `previewHint` 时，终端渲染执行该分支。
  if (previewHint) {
    // `style` 与 `"condensed" && !verbose` 不一致时刷新派生状态，避免使用过期结果。
    if (style !== "condensed" && !verbose) {
      // t5 暂存 `<MessageResponse><Text dimColor={true}>{previewHint}</Tex...` 的派生结果，便于缓存命中时直接复用。
      let t5;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[9] !== previewHint) {
        // t5 暂存 `<MessageResponse><Text dimColor={true}>{previewHint}</Tex...` 生成的渲染片段，后续返回路径直接复用。
        t5 = <MessageResponse><Text dimColor={true}>{previewHint}</Text></MessageResponse>;
        // $[9] 缓存 `previewHint`，下次依赖未变时 React 编译产物可直接复用。
        $[9] = previewHint;
        // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[10] = t5;
      } else {
        // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
        t5 = $[10];
      }
      // 返回 `t5`，作为终端渲染这次计算的结果。
      return t5;
    }
  } else {
    // 只有 `style === "condensed" && !verbose` 满足时，终端渲染才执行该分支。
    if (style === "condensed" && !verbose) {
      // 返回 `text`，作为终端渲染这次计算的结果。
      return text;
    }
  }
  // t5 暂存 `<Text>{text}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== text) {
    // t5 暂存 `<Text>{text}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>{text}</Text>;
    // $[11] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = text;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // t6保存`columns - 12`，供后续判断或组装使用。
  const t6 = columns - 12;
  // t7 暂存 `<StructuredDiffList hunks={structuredPatch} dim={false} w...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== fileContent || $[14] !== filePath || $[15] !== firstLine || $[16] !== structuredPatch || $[17] !== t6) {
    // t7 暂存 `<StructuredDiffList hunks={structuredPatch} dim={false} w...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <StructuredDiffList hunks={structuredPatch} dim={false} width={t6} filePath={filePath} firstLine={firstLine} fileContent={fileContent} />;
    // $[13] 缓存 `fileContent`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = fileContent;
    // $[14] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = filePath;
    // $[15] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = firstLine;
    // $[16] 缓存 `structuredPatch`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = structuredPatch;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[18];
  }
  // t8 暂存 `<MessageResponse><Box flexDirection="column">{t5}{t7}</Bo...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t5 || $[20] !== t7) {
    // t8 暂存 `<MessageResponse><Box flexDirection="column">{t5}{t7}</Bo...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <MessageResponse><Box flexDirection="column">{t5}{t7}</Box></MessageResponse>;
    // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t5;
    // $[20] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t7;
    // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[21];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(acc_0, hunk_0) {
  // 返回 `acc_0 + count(hunk_0.lines, _temp3)`，作为终端渲染这次计算的结果。
  return acc_0 + count(hunk_0.lines, _temp3);
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(__0) {
  // 返回 `__0.startsWith("-")`，作为终端渲染这次计算的结果。
  return __0.startsWith("-");
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(acc, hunk) {
  // 返回 `acc + count(hunk.lines, _temp)`，作为终端渲染这次计算的结果。
  return acc + count(hunk.lines, _temp);
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(_) {
  // 返回 `_.startsWith("+")`，作为终端渲染这次计算的结果。
  return _.startsWith("+");
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTdHJ1Y3R1cmVkUGF0Y2hIdW5rIiwiUmVhY3QiLCJ1c2VUZXJtaW5hbFNpemUiLCJCb3giLCJUZXh0IiwiY291bnQiLCJNZXNzYWdlUmVzcG9uc2UiLCJTdHJ1Y3R1cmVkRGlmZkxpc3QiLCJQcm9wcyIsImZpbGVQYXRoIiwic3RydWN0dXJlZFBhdGNoIiwiZmlyc3RMaW5lIiwiZmlsZUNvbnRlbnQiLCJzdHlsZSIsInZlcmJvc2UiLCJwcmV2aWV3SGludCIsIkZpbGVFZGl0VG9vbFVwZGF0ZWRNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJjb2x1bW5zIiwibnVtQWRkaXRpb25zIiwicmVkdWNlIiwiX3RlbXAyIiwibnVtUmVtb3ZhbHMiLCJfdGVtcDQiLCJ0MSIsInQyIiwidDMiLCJ0NCIsInRleHQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsImFjY18wIiwiaHVua18wIiwiYWNjIiwiaHVuayIsImxpbmVzIiwiX3RlbXAzIiwiX18wIiwiXyIsInN0YXJ0c1dpdGgiLCJfdGVtcCJdLCJzb3VyY2VzIjpbIkZpbGVFZGl0VG9vbFVwZGF0ZWRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFN0cnVjdHVyZWRQYXRjaEh1bmsgfSBmcm9tICdkaWZmJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBjb3VudCB9IGZyb20gJy4uL3V0aWxzL2FycmF5LmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBTdHJ1Y3R1cmVkRGlmZkxpc3QgfSBmcm9tICcuL1N0cnVjdHVyZWREaWZmTGlzdC5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgZmlsZVBhdGg6IHN0cmluZ1xuICBzdHJ1Y3R1cmVkUGF0Y2g6IFN0cnVjdHVyZWRQYXRjaEh1bmtbXVxuICBmaXJzdExpbmU6IHN0cmluZyB8IG51bGxcbiAgZmlsZUNvbnRlbnQ/OiBzdHJpbmdcbiAgc3R5bGU/OiAnY29uZGVuc2VkJ1xuICB2ZXJib3NlOiBib29sZWFuXG4gIHByZXZpZXdIaW50Pzogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBGaWxlRWRpdFRvb2xVcGRhdGVkTWVzc2FnZSh7XG4gIGZpbGVQYXRoLFxuICBzdHJ1Y3R1cmVkUGF0Y2gsXG4gIGZpcnN0TGluZSxcbiAgZmlsZUNvbnRlbnQsXG4gIHN0eWxlLFxuICB2ZXJib3NlLFxuICBwcmV2aWV3SGludCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBjb2x1bW5zIH0gPSB1c2VUZXJtaW5hbFNpemUoKVxuICBjb25zdCBudW1BZGRpdGlvbnMgPSBzdHJ1Y3R1cmVkUGF0Y2gucmVkdWNlKFxuICAgIChhY2MsIGh1bmspID0+IGFjYyArIGNvdW50KGh1bmsubGluZXMsIF8gPT4gXy5zdGFydHNXaXRoKCcrJykpLFxuICAgIDAsXG4gIClcbiAgY29uc3QgbnVtUmVtb3ZhbHMgPSBzdHJ1Y3R1cmVkUGF0Y2gucmVkdWNlKFxuICAgIChhY2MsIGh1bmspID0+IGFjYyArIGNvdW50KGh1bmsubGluZXMsIF8gPT4gXy5zdGFydHNXaXRoKCctJykpLFxuICAgIDAsXG4gIClcblxuICBjb25zdCB0ZXh0ID0gKFxuICAgIDxUZXh0PlxuICAgICAge251bUFkZGl0aW9ucyA+IDAgPyAoXG4gICAgICAgIDw+XG4gICAgICAgICAgQWRkZWQgPFRleHQgYm9sZD57bnVtQWRkaXRpb25zfTwvVGV4dD57JyAnfVxuICAgICAgICAgIHtudW1BZGRpdGlvbnMgPiAxID8gJ2xpbmVzJyA6ICdsaW5lJ31cbiAgICAgICAgPC8+XG4gICAgICApIDogbnVsbH1cbiAgICAgIHtudW1BZGRpdGlvbnMgPiAwICYmIG51bVJlbW92YWxzID4gMCA/ICcsICcgOiBudWxsfVxuICAgICAge251bVJlbW92YWxzID4gMCA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICB7bnVtQWRkaXRpb25zID09PSAwID8gJ1InIDogJ3InfWVtb3ZlZCA8VGV4dCBib2xkPntudW1SZW1vdmFsc308L1RleHQ+eycgJ31cbiAgICAgICAgICB7bnVtUmVtb3ZhbHMgPiAxID8gJ2xpbmVzJyA6ICdsaW5lJ31cbiAgICAgICAgPC8+XG4gICAgICApIDogbnVsbH1cbiAgICA8L1RleHQ+XG4gIClcblxuICAvLyBQbGFuIGZpbGVzOiBpbnZlcnQgY29uZGVuc2VkIGJlaGF2aW9yXG4gIC8vIC0gUmVndWxhciBtb2RlOiBqdXN0IHNob3cgdGhlIGhpbnQgKHVzZXIgY2FuIHR5cGUgL3BsYW4gdG8gc2VlIGZ1bGwgY29udGVudClcbiAgLy8gLSBDb25kZW5zZWQgbW9kZSAoc3ViYWdlbnQgdmlldyk6IHNob3cgdGhlIGRpZmZcbiAgaWYgKHByZXZpZXdIaW50KSB7XG4gICAgaWYgKHN0eWxlICE9PSAnY29uZGVuc2VkJyAmJiAhdmVyYm9zZSkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57cHJldmlld0hpbnR9PC9UZXh0PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIClcbiAgICB9XG4gIH0gZWxzZSBpZiAoc3R5bGUgPT09ICdjb25kZW5zZWQnICYmICF2ZXJib3NlKSB7XG4gICAgcmV0dXJuIHRleHRcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dD57dGV4dH08L1RleHQ+XG4gICAgICAgIDxTdHJ1Y3R1cmVkRGlmZkxpc3RcbiAgICAgICAgICBodW5rcz17c3RydWN0dXJlZFBhdGNofVxuICAgICAgICAgIGRpbT17ZmFsc2V9XG4gICAgICAgICAgd2lkdGg9e2NvbHVtbnMgLSAxMn1cbiAgICAgICAgICBmaWxlUGF0aD17ZmlsZVBhdGh9XG4gICAgICAgICAgZmlyc3RMaW5lPXtmaXJzdExpbmV9XG4gICAgICAgICAgZmlsZUNvbnRlbnQ9e2ZpbGVDb250ZW50fVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLG1CQUFtQixRQUFRLE1BQU07QUFDL0MsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxlQUFlLFFBQVEsNkJBQTZCO0FBQzdELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FBU0MsS0FBSyxRQUFRLG1CQUFtQjtBQUN6QyxTQUFTQyxlQUFlLFFBQVEsc0JBQXNCO0FBQ3RELFNBQVNDLGtCQUFrQixRQUFRLHlCQUF5QjtBQUU1RCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsUUFBUSxFQUFFLE1BQU07RUFDaEJDLGVBQWUsRUFBRVYsbUJBQW1CLEVBQUU7RUFDdENXLFNBQVMsRUFBRSxNQUFNLEdBQUcsSUFBSTtFQUN4QkMsV0FBVyxDQUFDLEVBQUUsTUFBTTtFQUNwQkMsS0FBSyxDQUFDLEVBQUUsV0FBVztFQUNuQkMsT0FBTyxFQUFFLE9BQU87RUFDaEJDLFdBQVcsQ0FBQyxFQUFFLE1BQU07QUFDdEIsQ0FBQztBQUVELE9BQU8sU0FBQUMsMkJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBb0M7SUFBQVYsUUFBQTtJQUFBQyxlQUFBO0lBQUFDLFNBQUE7SUFBQUMsV0FBQTtJQUFBQyxLQUFBO0lBQUFDLE9BQUE7SUFBQUM7RUFBQSxJQUFBRSxFQVFuQztFQUNOO0lBQUFHO0VBQUEsSUFBb0JsQixlQUFlLENBQUMsQ0FBQztFQUNyQyxNQUFBbUIsWUFBQSxHQUFxQlgsZUFBZSxDQUFBWSxNQUFPLENBQ3pDQyxNQUE4RCxFQUM5RCxDQUNGLENBQUM7RUFDRCxNQUFBQyxX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QTtFQUFBLElBQUFmLENBQUEsU0FBQU4sV0FBQSxJQUFBTSxDQUFBLFNBQUFULFFBQUEsSUFBQVMsQ0FBQSxTQUFBUCxTQUFBLElBQUFPLENBQUEsU0FBQVIsZUFBQSxJQUFBUSxDQUFBLFNBQUFjLEVBQUE7SUFIckJDLEVBQUEsSUFBQyxrQkFBa0IsQ0FDVnZCLEtBQWUsQ0FBZkEsZ0JBQWMsQ0FBQyxDQUNqQixHQUFLLENBQUwsTUFBSSxDQUFDLENBQ0gsS0FBWSxDQUFaLENBQUFzQixFQUFXLENBQUMsQ0FDVHZCLFFBQVEsQ0FBUkEsU0FBTyxDQUFDLENBQ1BFLFNBQVMsQ0FBVEEsVUFBUSxDQUFDLENBQ1BDLFdBQVcsQ0FBWEEsWUFBVSxDQUFDLEdBQ3hCO0lBQUFNLENBQUEsT0FBQU4sV0FBQTtJQUFBTSxDQUFBLE9BQUFULFFBQUE7SUFBQVMsQ0FBQSxPQUFBUCxTQUFBO0lBQUFPLENBQUEsT0FBQVIsZUFBQTtJQUFBUSxDQUFBLE9BQUFjLEVBQUE7SUFBQWQsQ0FBQSxPQUFBZSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBZixDQUFBO0VBQUE7RUFBQSxJQUFBZ0IsRUFBQTtFQUFBLElBQUFoQixDQUFBLFNBQUFhLEVBQUEsSUFBQWIsQ0FBQSxTQUFBZSxFQUFBO0lBVk5DLEVBQUEsSUFBQyxlQUFlLENBQ2QsQ0FBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDekIsQ0FBQUgsRUFBa0IsQ0FDbEIsQ0FBQUUsRUFPQyxDQUNILEVBVkMsR0FBRyxDQVdOLEVBWkMsZUFBZSxDQVlFO0lBQUFmLENBQUEsT0FBQWEsRUFBQTtJQUFBYixDQUFBLE9BQUFlLEVBQUE7SUFBQWYsQ0FBQSxPQUFBZ0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWhCLENBQUE7RUFBQTtFQUFBLE9BWmxCZ0IsRUFZa0I7QUFBQTtBQWpFZixTQUFBVCxPQUFBVSxLQUFBLEVBQUFDLE1BQUE7RUFBQSxPQWVZQyxLQUFHLEdBQUdoQyxLQUFLLENBQUNpQyxNQUFJLENBQUFDLEtBQU0sRUFBRUMsTUFBc0IsQ0FBQztBQUFBO0FBZjNELFNBQUFBLE9BQUFDLEdBQUE7RUFBQSxPQWV5Q0MsR0FBQyxDQUFBQyxVQUFXLENBQUMsR0FBRyxDQUFDO0FBQUE7QUFmMUQsU0FBQXBCLE9BQUFjLEdBQUEsRUFBQUMsSUFBQTtFQUFBLE9BV1lELEdBQUcsR0FBR2hDLEtBQUssQ0FBQ2lDLElBQUksQ0FBQUMsS0FBTSxFQUFFSyxLQUFzQixDQUFDO0FBQUE7QUFYM0QsU0FBQUEsTUFBQUYsQ0FBQTtFQUFBLE9BV3lDQSxDQUFDLENBQUFDLFVBQVcsQ0FBQyxHQUFHLENBQUM7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
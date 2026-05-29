// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 DIAMOND_FILLED、DIAMOND_OPEN，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { DIAMOND_FILLED, DIAMOND_OPEN } from '../../constants/figures.js';
// 引入 NO_CONTENT_MESSAGE，将 ../../constants/messages.js 中已经封装好的能力接到本文件流程里。
import { NO_CONTENT_MESSAGE } from '../../constants/messages.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';
// 引入 Markdown，将 ../Markdown.js 中已经封装好的能力接到本文件流程里。
import { Markdown } from '../Markdown.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  content: string;
};
// UserLocalCommandOutputMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserLocalCommandOutputMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    content
  } = t0;
  // 文本行 先占位，稍后的条件分支会根据实际输入补齐它。
  let lines;
  // t1 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== content) {
    // t1 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t1 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 User Local Command Output ...在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // stdout保存`extractTag`，供终端渲染后续处理使用。
      const stdout = extractTag(content, "local-command-stdout");
      // stderr保存`extractTag`，供终端渲染后续处理使用。
      const stderr = extractTag(content, "local-command-stderr");
      // 只有 `!stdout && !stderr` 满足时，终端渲染才执行该分支。
      if (!stdout && !stderr) {
        // t2 暂存 `<MessageResponse><Text dimColor={true}>{NO_CONTENT_MESSAG...` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `<MessageResponse><Text dimColor={true}>{NO_CONTENT_MESSAG...` 生成的渲染片段，后续返回路径直接复用。
          t2 = <MessageResponse><Text dimColor={true}>{NO_CONTENT_MESSAGE}</Text></MessageResponse>;
          // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[3] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[3];
        }
        // t1 暂存 `t2` 生成的渲染片段，后续返回路径直接复用。
        t1 = t2;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 文本行更新为 `[]`，确保终端 UI后续读取最新状态。
      lines = [];
      // 满足 `stdout?.trim()` 时，终端渲染执行该分支。
      if (stdout?.trim()) {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(<IndentedContent key="stdout">{stdout.trim()}</IndentedContent>);
      }
      // 满足 `stderr?.trim()` 时，终端渲染执行该分支。
      if (stderr?.trim()) {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(<IndentedContent key="stderr">{stderr.trim()}</IndentedContent>);
      }
    }
    // $[0] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = content;
    // $[1] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = lines;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // 文本行更新为 `$[1]`，确保终端 UI后续读取最新状态。
    lines = $[1];
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // `t1` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 返回 `lines`，作为终端渲染这次计算的结果。
  return lines;
}
// IndentedContent 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function IndentedContent(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // 只有 `children.startsWith(`${DIAMOND_OPEN} `) || children.startsWith(`${DIAMOND_F...` 满足时，终端渲染才执行该分支。
  if (children.startsWith(`${DIAMOND_OPEN} `) || children.startsWith(`${DIAMOND_FILLED} `)) {
    // t1 暂存 `<CloudLaunchContent>{children}</CloudLaunchContent>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== children) {
      // t1 暂存 `<CloudLaunchContent>{children}</CloudLaunchContent>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <CloudLaunchContent>{children}</CloudLaunchContent>;
      // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = children;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[1];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `<Text dimColor={true}>{" \u23BF "}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text dimColor={true}>{" \u23BF "}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text dimColor={true}>{"  \u23BF  "}</Text>;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `<Box flexDirection="row">{t1}<Box flexDirection="column" ...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== children) {
    // t2 暂存 `<Box flexDirection="row">{t1}<Box flexDirection="column" ...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexDirection="row">{t1}<Box flexDirection="column" flexGrow={1}><Markdown>{children}</Markdown></Box></Box>;
    // $[3] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = children;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
// CloudLaunchContent 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function CloudLaunchContent(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(19);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // diamond保存`children[0]`，供终端 UI User Local Command O...后续判断或输出使用。
  const diamond = children[0];
  // label 先占位，稍后的条件分支会根据实际输入补齐它。
  let label;
  // rest 先占位，稍后的条件分支会根据实际输入补齐它。
  let rest;
  // t1 暂存 `sep === -1 ? "" : header.slice(sep)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children) {
    // nl保存`children.indexOf`，供终端渲染后续处理使用。
    const nl = children.indexOf("\n");
    // header格式化`children.slice`，供终端渲染后续处理使用。
    const header = nl === -1 ? children.slice(2) : children.slice(2, nl);
    // rest更新为 `nl === -1 ? "" : children.slice(nl + 1).trim()`，确保终端 UI后续读取最新状态。
    rest = nl === -1 ? "" : children.slice(nl + 1).trim();
    // sep保存`header.indexOf`，供终端渲染后续处理使用。
    const sep = header.indexOf(" \xB7 ");
    // label更新为 `sep === -1 ? header : header.slice(0, sep)`，确保终端 UI后续读取最新状态。
    label = sep === -1 ? header : header.slice(0, sep);
    // t1 暂存 `sep === -1 ? "" : header.slice(sep)` 生成的渲染片段，后续返回路径直接复用。
    t1 = sep === -1 ? "" : header.slice(sep);
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `label`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = label;
    // $[2] 缓存 `rest`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = rest;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // label更新为 `$[1]`，确保终端 UI后续读取最新状态。
    label = $[1];
    // rest更新为 `$[2]`，确保终端 UI后续读取最新状态。
    rest = $[2];
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // suffix沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const suffix = t1;
  // t2 暂存 `<Text color="background">{diamond} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== diamond) {
    // t2 暂存 `<Text color="background">{diamond} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color="background">{diamond} </Text>;
    // $[4] 缓存 `diamond`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = diamond;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // t3 暂存 `<Text bold={true}>{label}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== label) {
    // t3 暂存 `<Text bold={true}>{label}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text bold={true}>{label}</Text>;
    // $[6] 缓存 `label`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = label;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // t4 暂存 `suffix && <Text dimColor={true}>{suffix}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== suffix) {
    // t4 暂存 `suffix && <Text dimColor={true}>{suffix}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = suffix && <Text dimColor={true}>{suffix}</Text>;
    // $[8] 缓存 `suffix`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = suffix;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `<Text>{t2}{t3}{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t2 || $[11] !== t3 || $[12] !== t4) {
    // t5 暂存 `<Text>{t2}{t3}{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>{t2}{t3}{t4}</Text>;
    // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t2;
    // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t3;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[13];
  }
  // t6 暂存 `rest && <Box flexDirection="row"><Text dimColor={true}>{"...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== rest) {
    // t6 暂存 `rest && <Box flexDirection="row"><Text dimColor={true}>{"...` 生成的渲染片段，后续返回路径直接复用。
    t6 = rest && <Box flexDirection="row"><Text dimColor={true}>{"  \u23BF  "}</Text><Text dimColor={true}>{rest}</Text></Box>;
    // $[14] 缓存 `rest`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = rest;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[15];
  }
  // t7 暂存 `<Box flexDirection="column">{t5}{t6}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t5 || $[17] !== t6) {
    // t7 暂存 `<Box flexDirection="column">{t5}{t6}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column">{t5}{t6}</Box>;
    // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t5;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkRJQU1PTkRfRklMTEVEIiwiRElBTU9ORF9PUEVOIiwiTk9fQ09OVEVOVF9NRVNTQUdFIiwiQm94IiwiVGV4dCIsImV4dHJhY3RUYWciLCJNYXJrZG93biIsIk1lc3NhZ2VSZXNwb25zZSIsIlByb3BzIiwiY29udGVudCIsIlVzZXJMb2NhbENvbW1hbmRPdXRwdXRNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJsaW5lcyIsInQxIiwiU3ltYm9sIiwiZm9yIiwiYmIwIiwic3Rkb3V0Iiwic3RkZXJyIiwidDIiLCJ0cmltIiwicHVzaCIsIkluZGVudGVkQ29udGVudCIsImNoaWxkcmVuIiwic3RhcnRzV2l0aCIsIkNsb3VkTGF1bmNoQ29udGVudCIsImRpYW1vbmQiLCJsYWJlbCIsInJlc3QiLCJubCIsImluZGV4T2YiLCJoZWFkZXIiLCJzbGljZSIsInNlcCIsInN1ZmZpeCIsInQzIiwidDQiLCJ0NSIsInQ2IiwidDciXSwic291cmNlcyI6WyJVc2VyTG9jYWxDb21tYW5kT3V0cHV0TWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBESUFNT05EX0ZJTExFRCwgRElBTU9ORF9PUEVOIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL2ZpZ3VyZXMuanMnXG5pbXBvcnQgeyBOT19DT05URU5UX01FU1NBR0UgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBleHRyYWN0VGFnIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBNYXJrZG93biB9IGZyb20gJy4uL01hcmtkb3duLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vTWVzc2FnZVJlc3BvbnNlLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBjb250ZW50OiBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFVzZXJMb2NhbENvbW1hbmRPdXRwdXRNZXNzYWdlKHtcbiAgY29udGVudCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc3Rkb3V0ID0gZXh0cmFjdFRhZyhjb250ZW50LCAnbG9jYWwtY29tbWFuZC1zdGRvdXQnKVxuICBjb25zdCBzdGRlcnIgPSBleHRyYWN0VGFnKGNvbnRlbnQsICdsb2NhbC1jb21tYW5kLXN0ZGVycicpXG4gIGlmICghc3Rkb3V0ICYmICFzdGRlcnIpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+e05PX0NPTlRFTlRfTUVTU0FHRX08L1RleHQ+XG4gICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICApXG4gIH1cblxuICBjb25zdCBsaW5lczogUmVhY3QuUmVhY3ROb2RlW10gPSBbXVxuICBpZiAoc3Rkb3V0Py50cmltKCkpIHtcbiAgICBsaW5lcy5wdXNoKDxJbmRlbnRlZENvbnRlbnQga2V5PVwic3Rkb3V0XCI+e3N0ZG91dC50cmltKCl9PC9JbmRlbnRlZENvbnRlbnQ+KVxuICB9XG4gIGlmIChzdGRlcnI/LnRyaW0oKSkge1xuICAgIGxpbmVzLnB1c2goPEluZGVudGVkQ29udGVudCBrZXk9XCJzdGRlcnJcIj57c3RkZXJyLnRyaW0oKX08L0luZGVudGVkQ29udGVudD4pXG4gIH1cbiAgcmV0dXJuIGxpbmVzXG59XG5cbmZ1bmN0aW9uIEluZGVudGVkQ29udGVudCh7IGNoaWxkcmVuIH06IHsgY2hpbGRyZW46IHN0cmluZyB9KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKFxuICAgIGNoaWxkcmVuLnN0YXJ0c1dpdGgoYCR7RElBTU9ORF9PUEVOfSBgKSB8fFxuICAgIGNoaWxkcmVuLnN0YXJ0c1dpdGgoYCR7RElBTU9ORF9GSUxMRUR9IGApXG4gICkge1xuICAgIHJldHVybiA8Q2xvdWRMYXVuY2hDb250ZW50PntjaGlsZHJlbn08L0Nsb3VkTGF1bmNoQ29udGVudD5cbiAgfVxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgPFRleHQgZGltQ29sb3I+eycgIOKOvyAgJ308L1RleHQ+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBmbGV4R3Jvdz17MX0+XG4gICAgICAgIDxNYXJrZG93bj57Y2hpbGRyZW59PC9NYXJrZG93bj5cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG5cbmZ1bmN0aW9uIENsb3VkTGF1bmNoQ29udGVudCh7XG4gIGNoaWxkcmVuLFxufToge1xuICBjaGlsZHJlbjogc3RyaW5nXG59KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgZGlhbW9uZCA9IGNoaWxkcmVuWzBdIVxuICBjb25zdCBubCA9IGNoaWxkcmVuLmluZGV4T2YoJ1xcbicpXG4gIGNvbnN0IGhlYWRlciA9IG5sID09PSAtMSA/IGNoaWxkcmVuLnNsaWNlKDIpIDogY2hpbGRyZW4uc2xpY2UoMiwgbmwpXG4gIGNvbnN0IHJlc3QgPSBubCA9PT0gLTEgPyAnJyA6IGNoaWxkcmVuLnNsaWNlKG5sICsgMSkudHJpbSgpXG4gIGNvbnN0IHNlcCA9IGhlYWRlci5pbmRleE9mKCcgwrcgJylcbiAgY29uc3QgbGFiZWwgPSBzZXAgPT09IC0xID8gaGVhZGVyIDogaGVhZGVyLnNsaWNlKDAsIHNlcClcbiAgY29uc3Qgc3VmZml4ID0gc2VwID09PSAtMSA/ICcnIDogaGVhZGVyLnNsaWNlKHNlcClcbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIDxUZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImJhY2tncm91bmRcIj57ZGlhbW9uZH0gPC9UZXh0PlxuICAgICAgICA8VGV4dCBib2xkPntsYWJlbH08L1RleHQ+XG4gICAgICAgIHtzdWZmaXggJiYgPFRleHQgZGltQ29sb3I+e3N1ZmZpeH08L1RleHQ+fVxuICAgICAgPC9UZXh0PlxuICAgICAge3Jlc3QgJiYgKFxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57JyAg4o6/ICAnfTwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57cmVzdH08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxjQUFjLEVBQUVDLFlBQVksUUFBUSw0QkFBNEI7QUFDekUsU0FBU0Msa0JBQWtCLFFBQVEsNkJBQTZCO0FBQ2hFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0MsVUFBVSxRQUFRLHlCQUF5QjtBQUNwRCxTQUFTQyxRQUFRLFFBQVEsZ0JBQWdCO0FBQ3pDLFNBQVNDLGVBQWUsUUFBUSx1QkFBdUI7QUFFdkQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLE9BQU8sRUFBRSxNQUFNO0FBQ2pCLENBQUM7QUFFRCxPQUFPLFNBQUFDLDhCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXVDO0lBQUFKO0VBQUEsSUFBQUUsRUFFdEM7RUFBQSxJQUFBRyxLQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQUgsT0FBQTtJQUtGTSxFQUFBLEdBQUFDLE1BRWtCLENBQUFDLEdBQUEsQ0FGbEIsNkJBRWlCLENBQUM7SUFBQUMsR0FBQTtNQU50QixNQUFBQyxNQUFBLEdBQWVkLFVBQVUsQ0FBQ0ksT0FBTyxFQUFFLHNCQUFzQixDQUFDO01BQzFELE1BQUFXLE1BQUEsR0FBZWYsVUFBVSxDQUFDSSxPQUFPLEVBQUUsc0JBQXNCLENBQUM7TUFDMUQsSUFBSSxDQUFDVSxNQUFpQixJQUFsQixDQUFZQyxNQUFNO1FBQUEsSUFBQUMsRUFBQTtRQUFBLElBQUFULENBQUEsUUFBQUksTUFBQSxD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
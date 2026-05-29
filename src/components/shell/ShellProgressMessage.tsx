// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 stripAnsi，将 strip-ansi 中已经封装好的能力接到本文件流程里。
import stripAnsi from 'strip-ansi';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 formatFileSize 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatFileSize } from '../../utils/format.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// 引入 OffscreenFreeze，将 ../OffscreenFreeze.js 中已经封装好的能力接到本文件流程里。
import { OffscreenFreeze } from '../OffscreenFreeze.js';
// 引入 ShellTimeDisplay，将 ./ShellTimeDisplay.js 中已经封装好的能力接到本文件流程里。
import { ShellTimeDisplay } from './ShellTimeDisplay.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  output: string;
  fullOutput: string;
  elapsedTimeSeconds?: number;
  totalLines?: number;
  totalBytes?: number;
  timeoutMs?: number;
  taskId?: string;
  verbose: boolean;
};
// ShellProgressMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ShellProgressMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(30);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    output,
    fullOutput,
    elapsedTimeSeconds,
    totalLines,
    totalBytes,
    timeoutMs,
    verbose
  } = t0;
  // t1 暂存 `stripAnsi(fullOutput.trim())` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== fullOutput) {
    // t1 暂存 `stripAnsi(fullOutput.trim())` 生成的渲染片段，后续返回路径直接复用。
    t1 = stripAnsi(fullOutput.trim());
    // $[0] 缓存 `fullOutput`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = fullOutput;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // strippedFullOutput保存`t1`，作为后续临时缓存值处理的输入。
  const strippedFullOutput = t1;
  // 文本行 先占位，稍后的条件分支会根据实际输入补齐它。
  let lines;
  // t2 暂存 `verbose ? strippedFullOutput : lines.slice(-5).join("\n")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== output || $[3] !== strippedFullOutput || $[4] !== verbose) {
    // strippedOutput保存`stripAnsi`，供终端渲染后续处理使用。
    const strippedOutput = stripAnsi(output.trim());
    // 文本行更新为 `strippedOutput.split("\n").filter(_temp)`，确保终端 UI后续读取最新状态。
    lines = strippedOutput.split("\n").filter(_temp);
    // t2 暂存 `verbose ? strippedFullOutput : lines.slice(-5).join("\n")` 生成的渲染片段，后续返回路径直接复用。
    t2 = verbose ? strippedFullOutput : lines.slice(-5).join("\n");
    // $[2] 缓存 `output`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = output;
    // $[3] 缓存 `strippedFullOutput`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = strippedFullOutput;
    // $[4] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = verbose;
    // $[5] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = lines;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // 文本行更新为 `$[5]`，确保终端 UI后续读取最新状态。
    lines = $[5];
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // displayLines 集合 命名 `t2`，让后续代码直接表达这个值的用途。
  const displayLines = t2;
  // lines.length 数量缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!lines.length) {
    // t3 暂存 `<Text dimColor={true}>Running… </Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `<Text dimColor={true}>Running… </Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text dimColor={true}>Running… </Text>;
      // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[7];
    }
    // t4 暂存 `<MessageResponse><OffscreenFreeze>{t3}<ShellTimeDisplay e...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[8] !== elapsedTimeSeconds || $[9] !== timeoutMs) {
      // t4 暂存 `<MessageResponse><OffscreenFreeze>{t3}<ShellTimeDisplay e...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <MessageResponse><OffscreenFreeze>{t3}<ShellTimeDisplay elapsedTimeSeconds={elapsedTimeSeconds} timeoutMs={timeoutMs} /></OffscreenFreeze></MessageResponse>;
      // $[8] 缓存 `elapsedTimeSeconds`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = elapsedTimeSeconds;
      // $[9] 缓存 `timeoutMs`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = timeoutMs;
      // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[10];
    }
    // 返回 `t4`，作为终端渲染这次计算的结果。
    return t4;
  }
  // extraLines 集合保存`Math.max`，供终端渲染后续处理使用。
  const extraLines = totalLines ? Math.max(0, totalLines - 5) : 0;
  // lineStatus 集合 命名 `""`，让后续代码直接表达这个值的用途。
  let lineStatus = "";
  // 只有 `!verbose && totalBytes && totalLines` 满足时，终端渲染才执行该分支。
  if (!verbose && totalBytes && totalLines) {
    // lineStatus 集合更新为 ``~${totalLines} lines``，确保终端 UI后续读取最新状态。
    lineStatus = `~${totalLines} lines`;
  } else {
    // 只有 `!verbose && extraLines > 0` 满足时，终端渲染才执行该分支。
    if (!verbose && extraLines > 0) {
      // lineStatus 集合更新为 ``+${extraLines} lines``，确保终端 UI后续读取最新状态。
      lineStatus = `+${extraLines} lines`;
    }
  }
  // 临时值 t3保存`Math.min`，供终端渲染后续处理使用。
  const t3 = verbose ? undefined : Math.min(5, lines.length);
  // t4 暂存 `<Text dimColor={true}>{displayLines}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== displayLines) {
    // t4 暂存 `<Text dimColor={true}>{displayLines}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text dimColor={true}>{displayLines}</Text>;
    // $[11] 缓存 `displayLines`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = displayLines;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
  }
  // t5 暂存 `<Box height={t3} flexDirection="column" overflow="hidden"...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t3 || $[14] !== t4) {
    // t5 暂存 `<Box height={t3} flexDirection="column" overflow="hidden"...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box height={t3} flexDirection="column" overflow="hidden">{t4}</Box>;
    // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t3;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
    // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[15];
  }
  // t6 暂存 `lineStatus ? <Text dimColor={true}>{lineStatus}</Text> : ...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== lineStatus) {
    // t6 暂存 `lineStatus ? <Text dimColor={true}>{lineStatus}</Text> : ...` 生成的渲染片段，后续返回路径直接复用。
    t6 = lineStatus ? <Text dimColor={true}>{lineStatus}</Text> : null;
    // $[16] 缓存 `lineStatus`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = lineStatus;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[17];
  }
  // t7 暂存 `<ShellTimeDisplay elapsedTimeSeconds={elapsedTimeSeconds}...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== elapsedTimeSeconds || $[19] !== timeoutMs) {
    // t7 暂存 `<ShellTimeDisplay elapsedTimeSeconds={elapsedTimeSeconds}...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <ShellTimeDisplay elapsedTimeSeconds={elapsedTimeSeconds} timeoutMs={timeoutMs} />;
    // $[18] 缓存 `elapsedTimeSeconds`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = elapsedTimeSeconds;
    // $[19] 缓存 `timeoutMs`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = timeoutMs;
    // $[20] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[20];
  }
  // t8 暂存 `totalBytes ? <Text dimColor={true}>{formatFileSize(totalB...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== totalBytes) {
    // t8 暂存 `totalBytes ? <Text dimColor={true}>{formatFileSize(totalB...` 生成的渲染片段，后续返回路径直接复用。
    t8 = totalBytes ? <Text dimColor={true}>{formatFileSize(totalBytes)}</Text> : null;
    // $[21] 缓存 `totalBytes`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = totalBytes;
    // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[22];
  }
  // t9 暂存 `<Box flexDirection="row" gap={1}>{t6}{t7}{t8}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== t6 || $[24] !== t7 || $[25] !== t8) {
    // t9 暂存 `<Box flexDirection="row" gap={1}>{t6}{t7}{t8}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="row" gap={1}>{t6}{t7}{t8}</Box>;
    // $[23] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t6;
    // $[24] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t7;
    // $[25] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t8;
    // $[26] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[26];
  }
  // t10 暂存 `<MessageResponse><OffscreenFreeze><Box flexDirection="col...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== t5 || $[28] !== t9) {
    // t10 暂存 `<MessageResponse><OffscreenFreeze><Box flexDirection="col...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <MessageResponse><OffscreenFreeze><Box flexDirection="column">{t5}{t9}</Box></OffscreenFreeze></MessageResponse>;
    // $[27] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t5;
    // $[28] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t9;
    // $[29] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[29];
  }
  // 返回 `t10`，作为终端渲染这次计算的结果。
  return t10;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(line) {
  // 返回 `line`，作为终端渲染这次计算的结果。
  return line;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInN0cmlwQW5zaSIsIkJveCIsIlRleHQiLCJmb3JtYXRGaWxlU2l6ZSIsIk1lc3NhZ2VSZXNwb25zZSIsIk9mZnNjcmVlbkZyZWV6ZSIsIlNoZWxsVGltZURpc3BsYXkiLCJQcm9wcyIsIm91dHB1dCIsImZ1bGxPdXRwdXQiLCJlbGFwc2VkVGltZVNlY29uZHMiLCJ0b3RhbExpbmVzIiwidG90YWxCeXRlcyIsInRpbWVvdXRNcyIsInRhc2tJZCIsInZlcmJvc2UiLCJTaGVsbFByb2dyZXNzTWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJ0cmltIiwic3RyaXBwZWRGdWxsT3V0cHV0IiwibGluZXMiLCJ0MiIsInN0cmlwcGVkT3V0cHV0Iiwic3BsaXQiLCJmaWx0ZXIiLCJfdGVtcCIsInNsaWNlIiwiam9pbiIsImRpc3BsYXlMaW5lcyIsImxlbmd0aCIsInQzIiwiU3ltYm9sIiwiZm9yIiwidDQiLCJleHRyYUxpbmVzIiwiTWF0aCIsIm1heCIsImxpbmVTdGF0dXMiLCJ1bmRlZmluZWQiLCJtaW4iLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5IiwidDEwIiwibGluZSJdLCJzb3VyY2VzIjpbIlNoZWxsUHJvZ3Jlc3NNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgc3RyaXBBbnNpIGZyb20gJ3N0cmlwLWFuc2knXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBmb3JtYXRGaWxlU2l6ZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4uL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IE9mZnNjcmVlbkZyZWV6ZSB9IGZyb20gJy4uL09mZnNjcmVlbkZyZWV6ZS5qcydcbmltcG9ydCB7IFNoZWxsVGltZURpc3BsYXkgfSBmcm9tICcuL1NoZWxsVGltZURpc3BsYXkuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG91dHB1dDogc3RyaW5nXG4gIGZ1bGxPdXRwdXQ6IHN0cmluZ1xuICBlbGFwc2VkVGltZVNlY29uZHM/OiBudW1iZXJcbiAgdG90YWxMaW5lcz86IG51bWJlclxuICB0b3RhbEJ5dGVzPzogbnVtYmVyXG4gIHRpbWVvdXRNcz86IG51bWJlclxuICB0YXNrSWQ/OiBzdHJpbmdcbiAgdmVyYm9zZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gU2hlbGxQcm9ncmVzc01lc3NhZ2Uoe1xuICBvdXRwdXQsXG4gIGZ1bGxPdXRwdXQsXG4gIGVsYXBzZWRUaW1lU2Vjb25kcyxcbiAgdG90YWxMaW5lcyxcbiAgdG90YWxCeXRlcyxcbiAgdGltZW91dE1zLFxuICB2ZXJib3NlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBzdHJpcHBlZEZ1bGxPdXRwdXQgPSBzdHJpcEFuc2koZnVsbE91dHB1dC50cmltKCkpXG4gIGNvbnN0IHN0cmlwcGVkT3V0cHV0ID0gc3RyaXBBbnNpKG91dHB1dC50cmltKCkpXG4gIGNvbnN0IGxpbmVzID0gc3RyaXBwZWRPdXRwdXQuc3BsaXQoJ1xcbicpLmZpbHRlcihsaW5lID0+IGxpbmUpXG4gIGNvbnN0IGRpc3BsYXlMaW5lcyA9IHZlcmJvc2UgPyBzdHJpcHBlZEZ1bGxPdXRwdXQgOiBsaW5lcy5zbGljZSgtNSkuam9pbignXFxuJylcblxuICAvLyBPZmZzY3JlZW5GcmVlemU6IEJhc2hUb29sIHlpZWxkcyBwcm9ncmVzcyAoZWxhcHNlZFRpbWVTZWNvbmRzKSBldmVyeSBzZWNvbmQuXG4gIC8vIElmIHRoaXMgbGluZSBzY3JvbGxzIGludG8gc2Nyb2xsYmFjaywgZWFjaCB0aWNrIGZvcmNlcyBhIGZ1bGwgdGVybWluYWwgcmVzZXQuXG4gIC8vIEEgZm9yZWdyb3VuZCBgc2xlZXAgNjAwYCBvbiBhIDI5LXJvdyB0ZXJtaW5hbCB3aXRoIDQwMDAgcm93cyBvZiBoaXN0b3J5XG4gIC8vIHByb2R1Y2VkIDUwNyByZXNldHMgb3ZlciAxMCBtaW51dGVzIChnby9jY3NoYXJlL21heGstMjAyNjAyMjYtMTkwMzQ4KS5cbiAgaWYgKCFsaW5lcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgPE9mZnNjcmVlbkZyZWV6ZT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5SdW5uaW5n4oCmIDwvVGV4dD5cbiAgICAgICAgICA8U2hlbGxUaW1lRGlzcGxheVxuICAgICAgICAgICAgZWxhcHNlZFRpbWVTZWNvbmRzPXtlbGFwc2VkVGltZVNlY29uZHN9XG4gICAgICAgICAgICB0aW1lb3V0TXM9e3RpbWVvdXRNc31cbiAgICAgICAgICAvPlxuICAgICAgICA8L09mZnNjcmVlbkZyZWV6ZT5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIClcbiAgfVxuXG4gIC8vIE5vdCB0cnVuY2F0ZWQ6IFwiKzIgbGluZXNcIiAodG90YWwgZXhjZWVkcyBkaXNwbGF5ZWQgNSlcbiAgLy8gVHJ1bmNhdGVkOiAgICAgXCJ+MjAwMCBsaW5lc1wiIChleHRyYXBvbGF0ZWQgZXN0aW1hdGUgZnJvbSB0YWlsIHNhbXBsZSlcbiAgY29uc3QgZXh0cmFMaW5lcyA9IHRvdGFsTGluZXMgPyBNYXRoLm1heCgwLCB0b3RhbExpbmVzIC0gNSkgOiAwXG4gIGxldCBsaW5lU3RhdHVzID0gJydcbiAgaWYgKCF2ZXJib3NlICYmIHRvdGFsQnl0ZXMgJiYgdG90YWxMaW5lcykge1xuICAgIGxpbmVTdGF0dXMgPSBgfiR7dG90YWxMaW5lc30gbGluZXNgXG4gIH0gZWxzZSBpZiAoIXZlcmJvc2UgJiYgZXh0cmFMaW5lcyA+IDApIHtcbiAgICBsaW5lU3RhdHVzID0gYCske2V4dHJhTGluZXN9IGxpbmVzYFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgPE9mZnNjcmVlbkZyZWV6ZT5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgPEJveFxuICAgICAgICAgICAgaGVpZ2h0PXt2ZXJib3NlID8gdW5kZWZpbmVkIDogTWF0aC5taW4oNSwgbGluZXMubGVuZ3RoKX1cbiAgICAgICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICAgICAgb3ZlcmZsb3c9XCJoaWRkZW5cIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPntkaXNwbGF5TGluZXN9PC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiIGdhcD17MX0+XG4gICAgICAgICAgICB7bGluZVN0YXR1cyA/IDxUZXh0IGRpbUNvbG9yPntsaW5lU3RhdHVzfTwvVGV4dD4gOiBudWxsfVxuICAgICAgICAgICAgPFNoZWxsVGltZURpc3BsYXlcbiAgICAgICAgICAgICAgZWxhcHNlZFRpbWVTZWNvbmRzPXtlbGFwc2VkVGltZVNlY29uZHN9XG4gICAgICAgICAgICAgIHRpbWVvdXRNcz17dGltZW91dE1zfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIHt0b3RhbEJ5dGVzID8gKFxuICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57Zm9ybWF0RmlsZVNpemUodG90YWxCeXRlcyl9PC9UZXh0PlxuICAgICAgICAgICAgKSA6IG51bGx9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9PZmZzY3JlZW5GcmVlemU+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLE9BQU9DLFNBQVMsTUFBTSxZQUFZO0FBQ2xDLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0MsY0FBYyxRQUFRLHVCQUF1QjtBQUN0RCxTQUFTQyxlQUFlLFFBQVEsdUJBQXVCO0FBQ3ZELFNBQVNDLGVBQWUs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
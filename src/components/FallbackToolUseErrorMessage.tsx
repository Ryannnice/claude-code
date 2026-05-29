// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/messages/messages.mjs，用于校准终端渲染的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages/messages.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 stripUnderlineAnsi 终端界面组件，避免在这里重复拼装显示逻辑。
import { stripUnderlineAnsi } from 'src/components/shell/OutputLine.js';
// 复用 extractTag 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { extractTag } from 'src/utils/messages.js';
// 复用 removeSandboxViolationTags 工具函数，把通用处理留在 src/utils/sandbox/sandbox-ui-utils.js 中维护。
import { removeSandboxViolationTags } from 'src/utils/sandbox/sandbox-ui-utils.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useShortcutDisplay，将 ../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js';
// 复用 countCharInString 工具函数，把通用处理留在 ../utils/stringUtils.js 中维护。
import { countCharInString } from '../utils/stringUtils.js';
// 引入 MessageResponse，将 ./MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from './MessageResponse.js';
// MAX_RENDERED_LINES 集合 命名 `10`，让后续代码直接表达这个值的用途。
const MAX_RENDERED_LINES = 10;
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  result: ToolResultBlockParam['content'];
  verbose: boolean;
};
// FallbackToolUseErrorMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FallbackToolUseErrorMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    result,
    verbose
  } = t0;
  // transcriptShortcut保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const transcriptShortcut = useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // T2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T2;
  // plusLines 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let plusLines;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== result || $[1] !== verbose) {
    // 错误 先占位，稍后的条件分支会根据实际输入补齐它。
    let error;
    // `typeof result` 与 `"string"` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof result !== "string") {
      // 错误更新为 `"Tool execution failed"`，确保终端 UI后续读取最新状态。
      error = "Tool execution failed";
    } else {
      // extractedError 错误信息保存`extractTag`，供终端渲染后续处理使用。
      const extractedError = extractTag(result, "tool_use_error") ?? result;
      // withoutSandboxViolations 集合保存`removeSandboxViolationTags`，供终端渲染后续处理使用。
      const withoutSandboxViolations = removeSandboxViolationTags(extractedError);
      // withoutErrorTags 错误信息格式化`withoutSandboxViolations.replace`，供终端渲染后续处理使用。
      const withoutErrorTags = withoutSandboxViolations.replace(/<\/?error>/g, "");
      // trimmed格式化`withoutErrorTags.trim`，供终端渲染后续处理使用。
      const trimmed = withoutErrorTags.trim();
      // 只有 `!verbose && trimmed.includes("InputValidationError: ")` 满足时，终端渲染才执行该分支。
      if (!verbose && trimmed.includes("InputValidationError: ")) {
        // 错误更新为 `"Invalid tool parameters"`，确保终端 UI后续读取最新状态。
        error = "Invalid tool parameters";
      } else {
        // 只有 `trimmed.startsWith("Error: ") || trimmed.startsWith("Cancelled: ")` 满足时，终端渲染才执行该分支。
        if (trimmed.startsWith("Error: ") || trimmed.startsWith("Cancelled: ")) {
          // 错误更新为 `trimmed`，确保终端 UI后续读取最新状态。
          error = trimmed;
        } else {
          // 错误更新为 ``Error: ${trimmed}``，确保终端 UI后续读取最新状态。
          error = `Error: ${trimmed}`;
        }
      }
    }
    // plusLines 集合更新为 `countCharInString(error, "\n") + 1 - MAX_RENDERED_LINES`，确保终端 UI后续读取最新状态。
    plusLines = countCharInString(error, "\n") + 1 - MAX_RENDERED_LINES;
    // T2 暂存 `MessageResponse` 生成的渲染片段，后续返回路径直接复用。
    T2 = MessageResponse;
    // T1 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T1 = Box;
    // t3 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t3 = "column";
    // T0 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
    T0 = Text;
    // t1 暂存 `"error"` 生成的渲染片段，后续返回路径直接复用。
    t1 = "error";
    // t2 暂存 `stripUnderlineAnsi(verbose ? error : error.split("\n").sl...` 生成的渲染片段，后续返回路径直接复用。
    t2 = stripUnderlineAnsi(verbose ? error : error.split("\n").slice(0, MAX_RENDERED_LINES).join("\n"));
    // $[0] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = result;
    // $[1] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = verbose;
    // $[2] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = T0;
    // $[3] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = T1;
    // $[4] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = T2;
    // $[5] 缓存 `plusLines`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = plusLines;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // T0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[2];
    // T1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[3];
    // T2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    T2 = $[4];
    // plusLines 集合更新为 `$[5]`，确保终端 UI后续读取最新状态。
    plusLines = $[5];
    // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[6];
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // t4 暂存 `<T0 color={t1}>{t2}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== T0 || $[10] !== t1 || $[11] !== t2) {
    // t4 暂存 `<T0 color={t1}>{t2}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <T0 color={t1}>{t2}</T0>;
    // $[9] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = T0;
    // $[10] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t1;
    // $[11] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t2;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
  }
  // t5 暂存 `!verbose && plusLines > 0 && <Box><Text dimColor={true}>…...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== plusLines || $[14] !== transcriptShortcut || $[15] !== verbose) {
    // t5 暂存 `!verbose && plusLines > 0 && <Box><Text dimColor={true}>…...` 生成的渲染片段，后续返回路径直接复用。
    t5 = !verbose && plusLines > 0 && <Box><Text dimColor={true}>… +{plusLines} {plusLines === 1 ? "line" : "lines"} (</Text><Text dimColor={true} bold={true}>{transcriptShortcut}</Text><Text> </Text><Text dimColor={true}>to see all)</Text></Box>;
    // $[13] 缓存 `plusLines`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = plusLines;
    // $[14] 缓存 `transcriptShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = transcriptShortcut;
    // $[15] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = verbose;
    // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[16];
  }
  // t6 暂存 `<T1 flexDirection={t3}>{t4}{t5}</T1>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== T1 || $[18] !== t3 || $[19] !== t4 || $[20] !== t5) {
    // t6 暂存 `<T1 flexDirection={t3}>{t4}{t5}</T1>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <T1 flexDirection={t3}>{t4}{t5}</T1>;
    // $[17] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = T1;
    // $[18] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t3;
    // $[19] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t4;
    // $[20] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t5;
    // $[21] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[21];
  }
  // t7 暂存 `<T2>{t6}</T2>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== T2 || $[23] !== t6) {
    // t7 暂存 `<T2>{t6}</T2>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <T2>{t6}</T2>;
    // $[22] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = T2;
    // $[23] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t6;
    // $[24] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[24];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlJlYWN0Iiwic3RyaXBVbmRlcmxpbmVBbnNpIiwiZXh0cmFjdFRhZyIsInJlbW92ZVNhbmRib3hWaW9sYXRpb25UYWdzIiwiQm94IiwiVGV4dCIsInVzZVNob3J0Y3V0RGlzcGxheSIsImNvdW50Q2hhckluU3RyaW5nIiwiTWVzc2FnZVJlc3BvbnNlIiwiTUFYX1JFTkRFUkVEX0xJTkVTIiwiUHJvcHMiLCJyZXN1bHQiLCJ2ZXJib3NlIiwiRmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJ0cmFuc2NyaXB0U2hvcnRjdXQiLCJUMCIsIlQxIiwiVDIiLCJwbHVzTGluZXMiLCJ0MSIsInQyIiwidDMiLCJlcnJvciIsImV4dHJhY3RlZEVycm9yIiwid2l0aG91dFNhbmRib3hWaW9sYXRpb25zIiwid2l0aG91dEVycm9yVGFncyIsInJlcGxhY2UiLCJ0cmltbWVkIiwidHJpbSIsImluY2x1ZGVzIiwic3RhcnRzV2l0aCIsInNwbGl0Iiwic2xpY2UiLCJqb2luIiwidDQiLCJ0NSIsInQ2IiwidDciXSwic291cmNlcyI6WyJGYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVG9vbFJlc3VsdEJsb2NrUGFyYW0gfSBmcm9tICdAYW50aHJvcGljLWFpL3Nkay9yZXNvdXJjZXMvbWVzc2FnZXMvbWVzc2FnZXMubWpzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBzdHJpcFVuZGVybGluZUFuc2kgfSBmcm9tICdzcmMvY29tcG9uZW50cy9zaGVsbC9PdXRwdXRMaW5lLmpzJ1xuaW1wb3J0IHsgZXh0cmFjdFRhZyB9IGZyb20gJ3NyYy91dGlscy9tZXNzYWdlcy5qcydcbmltcG9ydCB7IHJlbW92ZVNhbmRib3hWaW9sYXRpb25UYWdzIH0gZnJvbSAnc3JjL3V0aWxzL3NhbmRib3gvc2FuZGJveC11aS11dGlscy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IHVzZVNob3J0Y3V0RGlzcGxheSB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZVNob3J0Y3V0RGlzcGxheS5qcydcbmltcG9ydCB7IGNvdW50Q2hhckluU3RyaW5nIH0gZnJvbSAnLi4vdXRpbHMvc3RyaW5nVXRpbHMuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuL01lc3NhZ2VSZXNwb25zZS5qcydcblxuY29uc3QgTUFYX1JFTkRFUkVEX0xJTkVTID0gMTBcblxudHlwZSBQcm9wcyA9IHtcbiAgcmVzdWx0OiBUb29sUmVzdWx0QmxvY2tQYXJhbVsnY29udGVudCddXG4gIHZlcmJvc2U6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSh7XG4gIHJlc3VsdCxcbiAgdmVyYm9zZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgdHJhbnNjcmlwdFNob3J0Y3V0ID0gdXNlU2hvcnRjdXREaXNwbGF5KFxuICAgICdhcHA6dG9nZ2xlVHJhbnNjcmlwdCcsXG4gICAgJ0dsb2JhbCcsXG4gICAgJ2N0cmwrbycsXG4gIClcbiAgbGV0IGVycm9yOiBzdHJpbmdcblxuICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gJ3N0cmluZycpIHtcbiAgICBlcnJvciA9ICdUb29sIGV4ZWN1dGlvbiBmYWlsZWQnXG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZXh0cmFjdGVkRXJyb3IgPSBleHRyYWN0VGFnKHJlc3VsdCwgJ3Rvb2xfdXNlX2Vycm9yJykgPz8gcmVzdWx0XG4gICAgLy8gUmVtb3ZlIHNhbmRib3hfdmlvbGF0aW9ucyB0YWdzIGZyb20gZXJyb3IgZGlzcGxheSAoQ2xhdWRlIHN0aWxsIHNlZXMgdGhlbSBpbiB0aGUgdG9vbCByZXN1bHQpXG4gICAgY29uc3Qgd2l0aG91dFNhbmRib3hWaW9sYXRpb25zID0gcmVtb3ZlU2FuZGJveFZpb2xhdGlvblRhZ3MoZXh0cmFjdGVkRXJyb3IpXG4gICAgLy8gU3RyaXAgPGVycm9yPiB0YWdzIGJ1dCBrZWVwIHRoZWlyIGNvbnRlbnQgKHRhZ3MgYXJlIGZvciB0aGUgbW9kZWwsIG5vdCB0aGUgVUkpXG4gICAgY29uc3Qgd2l0aG91dEVycm9yVGFncyA9IHdpdGhvdXRTYW5kYm94VmlvbGF0aW9ucy5yZXBsYWNlKC88XFwvP2Vycm9yPi9nLCAnJylcbiAgICBjb25zdCB0cmltbWVkID0gd2l0aG91dEVycm9yVGFncy50cmltKClcbiAgICBpZiAoIXZlcmJvc2UgJiYgdHJpbW1lZC5pbmNsdWRlcygnSW5wdXRWYWxpZGF0aW9uRXJyb3I6ICcpKSB7XG4gICAgICBlcnJvciA9ICdJbnZhbGlkIHRvb2wgcGFyYW1ldGVycydcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdHJpbW1lZC5zdGFydHNXaXRoKCdFcnJvcjogJykgfHxcbiAgICAgIHRyaW1tZWQuc3RhcnRzV2l0aCgnQ2FuY2VsbGVkOiAnKVxuICAgICkge1xuICAgICAgZXJyb3IgPSB0cmltbWVkXG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0gYEVycm9yOiAke3RyaW1tZWR9YFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHBsdXNMaW5lcyA9IGNvdW50Q2hhckluU3RyaW5nKGVycm9yLCAnXFxuJykgKyAxIC0gTUFYX1JFTkRFUkVEX0xJTkVTXG5cbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICB7c3RyaXBVbmRlcmxpbmVBbnNpKFxuICAgICAgICAgICAgdmVyYm9zZVxuICAgICAgICAgICAgICA/IGVycm9yXG4gICAgICAgICAgICAgIDogZXJyb3Iuc3BsaXQoJ1xcbicpLnNsaWNlKDAsIE1BWF9SRU5ERVJFRF9MSU5FUykuam9pbignXFxuJyksXG4gICAgICAgICAgKX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICB7IXZlcmJvc2UgJiYgcGx1c0xpbmVzID4gMCAmJiAoXG4gICAgICAgICAgLy8gVGhlIGNhcmVmdWwgPFRleHQ+IGxheW91dCBpcyBhIHdvcmthcm91bmQgZm9yIHRoZSBkaW0tYm9sZFxuICAgICAgICAgIC8vIHJlbmRlcmluZyBidWdcbiAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIOKApiAre3BsdXNMaW5lc30ge3BsdXNMaW5lcyA9PT0gMSA/ICdsaW5lJyA6ICdsaW5lcyd9IChcbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yIGJvbGQ+XG4gICAgICAgICAgICAgIHt0cmFuc2NyaXB0U2hvcnRjdXR9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+dG8gc2VlIGFsbCk8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsY0FBY0Esb0JBQW9CLFFBQVEsbURBQW1EO0FBQzdGLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0Msa0JBQWtCLFFBQVEsb0NBQW9DO0FBQ3ZFLFNBQVNDLFVBQVUsUUFBUSx1QkFBdUI7QUFDbEQsU0FBU0MsMEJBQTBCLFFBQVEsdUNBQXVDO0FBQ2xGLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FBU0Msa0JBQWtCLFFBQVEsc0NBQXNDO0FBQ3pFLFNBQVNDLGlCQUFpQixRQUFRLHlCQUF5QjtBQUMzRCxTQUFTQyxlQUFlLFFBQVEsc0JBQXNCO0FBRXRELE1BQU1DLGtCQUFrQixHQUFHLEVBQUU7QUFFN0IsS0FBS0MsS0FBSyxHQUFHO0VB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
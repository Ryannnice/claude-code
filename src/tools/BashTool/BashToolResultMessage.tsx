// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 removeSandboxViolationTags 工具函数，把通用处理留在 src/utils/sandbox/sandbox-ui-utils.js 中维护。
import { removeSandboxViolationTags } from 'src/utils/sandbox/sandbox-ui-utils.js';
// 复用 KeyboardShortcutHint 终端界面组件，避免在这里重复拼装显示逻辑。
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 复用 OutputLine 终端界面组件，避免在这里重复拼装显示逻辑。
import { OutputLine } from '../../components/shell/OutputLine.js';
// 复用 ShellTimeDisplay 终端界面组件，避免在这里重复拼装显示逻辑。
import { ShellTimeDisplay } from '../../components/shell/ShellTimeDisplay.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { Out as BashOut } 来自 ./BashTool.js，用于校准工具调用的数据契约。
import type { Out as BashOut } from './BashTool.js';
// Props 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  content: Omit<BashOut, 'interrupted'>;
  verbose: boolean;
  timeoutMs?: number;
};

// Pattern to match "Shell cwd was reset to <path>" message
// Use (?:^|\n) to match either start of string or after a newline
// SHELL_CWD_RESET_PATTERN保存`/(?:^|\n)(Shell cwd was reset to .+)$/`，供Bash 工具 Bash Tool Result Mess...后续判断或输出使用。
const SHELL_CWD_RESET_PATTERN = /(?:^|\n)(Shell cwd was reset to .+)$/;

/**
 * Extracts sandbox violations from stderr if present
 * Returns both the cleaned stderr and the violations content
 */
// extractSandboxViolations 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractSandboxViolations(stderr: string): {
  cleanedStderr: string;
} {
  // violationsMatch匹配`stderr.match`，供工具调用后续处理使用。
  const violationsMatch = stderr.match(/<sandbox_violations>([\s\S]*?)<\/sandbox_violations>/);
  // violationsMatch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!violationsMatch) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      cleanedStderr: stderr
    };
  }

  // Remove the sandbox violations section from stderr
  // cleanedStderr保存`removeSandboxViolationTags`，供工具调用后续处理使用。
  const cleanedStderr = removeSandboxViolationTags(stderr).trim();
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    cleanedStderr
  };
}

/**
 * Extracts the "Shell cwd was reset" warning message from stderr
 * Returns the cleaned stderr and the warning message separately
 */
// extractCwdResetWarning 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractCwdResetWarning(stderr: string): {
  cleanedStderr: string;
  cwdResetWarning: string | null;
} {
  // match匹配`stderr.match`，供工具调用后续处理使用。
  const match = stderr.match(SHELL_CWD_RESET_PATTERN);
  // match缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!match) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      cleanedStderr: stderr,
      cwdResetWarning: null
    };
  }

  // Extract the warning message from capture group 1
  // cwdResetWarning 警告信息读取 `match[1] ?? null` 对应条目，后续围绕该成员继续处理。
  const cwdResetWarning = match[1] ?? null;
  // Remove the warning from stderr (replace the full match)
  // cleanedStderr格式化`stderr.replace`，供工具调用后续处理使用。
  const cleanedStderr = stderr.replace(SHELL_CWD_RESET_PATTERN, '').trim();
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    cleanedStderr,
    cwdResetWarning
  };
}
// Bash 工具 Bash Tool Result Message在这里处理 `export default function BashToolResultMessage(t0) {`，完成这一小步状态转换。
export default function BashToolResultMessage(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(34);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    content: t1,
    verbose,
    timeoutMs
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    stdout: t2,
    stderr: t3,
    isImage,
    returnCodeInterpretation,
    noOutputExpected,
    backgroundTaskId
  } = t1;
  // stdout标记Bash 工具 Bash Tool Result Mess...是否启用对应路径。
  const stdout = t2 === undefined ? "" : t2;
  // stdErrWithViolations 集合标记Bash 工具 Bash Tool Result Mess...是否启用对应路径。
  const stdErrWithViolations = t3 === undefined ? "" : t3;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // cwdResetWarning 警告信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let cwdResetWarning;
  // stderr 先占位，稍后的条件分支会根据实际输入补齐它。
  let stderr;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // t7 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== isImage || $[1] !== stdErrWithViolations || $[2] !== stdout || $[3] !== verbose) {
    // t7 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t7 = Symbol.for("react.early_return_sentinel");
    // Bash 工具 Bash Tool Result Message在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        cleanedStderr: stderrWithoutViolations
      } = extractSandboxViolations(stdErrWithViolations);
      // 重新解构输入对象，把Bash 工具 Bash Tool Result Message需要的字段同步到本地变量。
      ({
        cleanedStderr: stderr,
        cwdResetWarning
      } = extractCwdResetWarning(stderrWithoutViolations));
      // 满足 `isImage` 时，工具调用执行该分支。
      if (isImage) {
        // t8 暂存 `<MessageResponse height={1}><Text dimColor={true}>[Image ...` 的派生结果，便于缓存命中时直接复用。
        let t8;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
          // t8 暂存 `<MessageResponse height={1}><Text dimColor={true}>[Image ...` 生成的渲染片段，后续返回路径直接复用。
          t8 = <MessageResponse height={1}><Text dimColor={true}>[Image data detected and sent to Claude]</Text></MessageResponse>;
          // $[11] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
          $[11] = t8;
        } else {
          // t8 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
          t8 = $[11];
        }
        // t7 暂存 `t8` 生成的渲染片段，后续返回路径直接复用。
        t7 = t8;
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break bb0;
      }
      // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
      T0 = Box;
      // t4 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
      t4 = "column";
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[12] !== stdout || $[13] !== verbose) {
        // t5 暂存 `stdout !== "" ? <OutputLine content={stdout} verbose={ver...` 生成的渲染片段，后续返回路径直接复用。
        t5 = stdout !== "" ? <OutputLine content={stdout} verbose={verbose} /> : null;
        // $[12] 缓存 `stdout`，下次依赖未变时 React 编译产物可直接复用。
        $[12] = stdout;
        // $[13] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
        $[13] = verbose;
        // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[14] = t5;
      } else {
        // t5 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
        t5 = $[14];
      }
      // t6 暂存 `stderr.trim() !== "" ? <OutputLine content={stderr} verbo...` 生成的渲染片段，后续返回路径直接复用。
      t6 = stderr.trim() !== "" ? <OutputLine content={stderr} verbose={verbose} isError={true} /> : null;
    }
    // $[0] 缓存 `isImage`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = isImage;
    // $[1] 缓存 `stdErrWithViolations`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = stdErrWithViolations;
    // $[2] 缓存 `stdout`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = stdout;
    // $[3] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = verbose;
    // $[4] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = T0;
    // $[5] 缓存 `cwdResetWarning`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = cwdResetWarning;
    // $[6] 缓存 `stderr`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = stderr;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // T0 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[4];
    // cwdResetWarning 警告信息更新为 `$[5]`，确保Bash 工具后续读取最新状态。
    cwdResetWarning = $[5];
    // stderr更新为 `$[6]`，确保Bash 工具后续读取最新状态。
    stderr = $[6];
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // `t7` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t7 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t7`，作为工具调用这次计算的结果。
    return t7;
  }
  // t8 暂存 `cwdResetWarning ? <MessageResponse><Text dimColor={true}>...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== cwdResetWarning) {
    // t8 暂存 `cwdResetWarning ? <MessageResponse><Text dimColor={true}>...` 生成的渲染片段，后续返回路径直接复用。
    t8 = cwdResetWarning ? <MessageResponse><Text dimColor={true}>{cwdResetWarning}</Text></MessageResponse> : null;
    // $[15] 缓存 `cwdResetWarning`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = cwdResetWarning;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[16];
  }
  // t9 暂存 `stdout === "" && stderr.trim() === "" && !cwdResetWarning...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== backgroundTaskId || $[18] !== cwdResetWarning || $[19] !== noOutputExpected || $[20] !== returnCodeInterpretation || $[21] !== stderr || $[22] !== stdout) {
    // t9 暂存 `stdout === "" && stderr.trim() === "" && !cwdResetWarning...` 生成的渲染片段，后续返回路径直接复用。
    t9 = stdout === "" && stderr.trim() === "" && !cwdResetWarning ? <MessageResponse height={1}><Text dimColor={true}>{backgroundTaskId ? <>Running in the background{" "}<KeyboardShortcutHint shortcut={"\u2193"} action="manage" parens={true} /></> : returnCodeInterpretation || (noOutputExpected ? "Done" : "(No output)")}</Text></MessageResponse> : null;
    // $[17] 缓存 `backgroundTaskId`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = backgroundTaskId;
    // $[18] 缓存 `cwdResetWarning`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = cwdResetWarning;
    // $[19] 缓存 `noOutputExpected`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = noOutputExpected;
    // $[20] 缓存 `returnCodeInterpretation`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = returnCodeInterpretation;
    // $[21] 缓存 `stderr`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = stderr;
    // $[22] 缓存 `stdout`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = stdout;
    // $[23] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[23];
  }
  // t10 暂存 `timeoutMs && <MessageResponse><ShellTimeDisplay timeoutMs...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== timeoutMs) {
    // t10 暂存 `timeoutMs && <MessageResponse><ShellTimeDisplay timeoutMs...` 生成的渲染片段，后续返回路径直接复用。
    t10 = timeoutMs && <MessageResponse><ShellTimeDisplay timeoutMs={timeoutMs} /></MessageResponse>;
    // $[24] 缓存 `timeoutMs`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = timeoutMs;
    // $[25] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[25];
  }
  // t11 暂存 `<T0 flexDirection={t4}>{t5}{t6}{t8}{t9}{t10}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== T0 || $[27] !== t10 || $[28] !== t4 || $[29] !== t5 || $[30] !== t6 || $[31] !== t8 || $[32] !== t9) {
    // t11 暂存 `<T0 flexDirection={t4}>{t5}{t6}{t8}{t9}{t10}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <T0 flexDirection={t4}>{t5}{t6}{t8}{t9}{t10}</T0>;
    // $[26] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = T0;
    // $[27] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t10;
    // $[28] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t4;
    // $[29] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t5;
    // $[30] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t6;
    // $[31] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t8;
    // $[32] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t9;
    // $[33] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[33];
  }
  // 返回 `t11`，作为工具调用这次计算的结果。
  return t11;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInJlbW92ZVNhbmRib3hWaW9sYXRpb25UYWdzIiwiS2V5Ym9hcmRTaG9ydGN1dEhpbnQiLCJNZXNzYWdlUmVzcG9uc2UiLCJPdXRwdXRMaW5lIiwiU2hlbGxUaW1lRGlzcGxheSIsIkJveCIsIlRleHQiLCJPdXQiLCJCYXNoT3V0IiwiUHJvcHMiLCJjb250ZW50IiwiT21pdCIsInZlcmJvc2UiLCJ0aW1lb3V0TXMiLCJTSEVMTF9DV0RfUkVTRVRfUEFUVEVSTiIsImV4dHJhY3RTYW5kYm94VmlvbGF0aW9ucyIsInN0ZGVyciIsImNsZWFuZWRTdGRlcnIiLCJ2aW9sYXRpb25zTWF0Y2giLCJtYXRjaCIsInRyaW0iLCJleHRyYWN0Q3dkUmVzZXRXYXJuaW5nIiwiY3dkUmVzZXRXYXJuaW5nIiwicmVwbGFjZSIsIkJhc2hUb29sUmVzdWx0TWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJzdGRvdXQiLCJ0MiIsInQzIiwiaXNJbWFnZSIsInJldHVybkNvZGVJbnRlcnByZXRhdGlvbiIsIm5vT3V0cHV0RXhwZWN0ZWQiLCJiYWNrZ3JvdW5kVGFza0lkIiwidW5kZWZpbmVkIiwic3RkRXJyV2l0aFZpb2xhdGlvbnMiLCJUMCIsInQ0IiwidDUiLCJ0NiIsInQ3IiwiU3ltYm9sIiwiZm9yIiwiYmIwIiwic3RkZXJyV2l0aG91dFZpb2xhdGlvbnMiLCJ0OCIsInQ5IiwidDEwIiwidDExIl0sInNvdXJjZXMiOlsiQmFzaFRvb2xSZXN1bHRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyByZW1vdmVTYW5kYm94VmlvbGF0aW9uVGFncyB9IGZyb20gJ3NyYy91dGlscy9zYW5kYm94L3NhbmRib3gtdWktdXRpbHMuanMnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvZGVzaWduLXN5c3RlbS9LZXlib2FyZFNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvTWVzc2FnZVJlc3BvbnNlLmpzJ1xuaW1wb3J0IHsgT3V0cHV0TGluZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvc2hlbGwvT3V0cHV0TGluZS5qcydcbmltcG9ydCB7IFNoZWxsVGltZURpc3BsYXkgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL3NoZWxsL1NoZWxsVGltZURpc3BsYXkuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IE91dCBhcyBCYXNoT3V0IH0gZnJvbSAnLi9CYXNoVG9vbC5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgY29udGVudDogT21pdDxCYXNoT3V0LCAnaW50ZXJydXB0ZWQnPlxuICB2ZXJib3NlOiBib29sZWFuXG4gIHRpbWVvdXRNcz86IG51bWJlclxufVxuXG4vLyBQYXR0ZXJuIHRvIG1hdGNoIFwiU2hlbGwgY3dkIHdhcyByZXNldCB0byA8cGF0aD5cIiBtZXNzYWdlXG4vLyBVc2UgKD86XnxcXG4pIHRvIG1hdGNoIGVpdGhlciBzdGFydCBvZiBzdHJpbmcgb3IgYWZ0ZXIgYSBuZXdsaW5lXG5jb25zdCBTSEVMTF9DV0RfUkVTRVRfUEFUVEVSTiA9IC8oPzpefFxcbikoU2hlbGwgY3dkIHdhcyByZXNldCB0byAuKykkL1xuXG4vKipcbiAqIEV4dHJhY3RzIHNhbmRib3ggdmlvbGF0aW9ucyBmcm9tIHN0ZGVyciBpZiBwcmVzZW50XG4gKiBSZXR1cm5zIGJvdGggdGhlIGNsZWFuZWQgc3RkZXJyIGFuZCB0aGUgdmlvbGF0aW9ucyBjb250ZW50XG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTYW5kYm94VmlvbGF0aW9ucyhzdGRlcnI6IHN0cmluZyk6IHtcbiAgY2xlYW5lZFN0ZGVycjogc3RyaW5nXG59IHtcbiAgY29uc3QgdmlvbGF0aW9uc01hdGNoID0gc3RkZXJyLm1hdGNoKFxuICAgIC88c2FuZGJveF92aW9sYXRpb25zPihbXFxzXFxTXSo/KTxcXC9zYW5kYm94X3Zpb2xhdGlvbnM+LyxcbiAgKVxuXG4gIGlmICghdmlvbGF0aW9uc01hdGNoKSB7XG4gICAgcmV0dXJuIHsgY2xlYW5lZFN0ZGVycjogc3RkZXJyIH1cbiAgfVxuXG4gIC8vIFJlbW92ZSB0aGUgc2FuZGJveCB2aW9sYXRpb25zIHNlY3Rpb24gZnJvbSBzdGRlcnJcbiAgY29uc3QgY2xlYW5lZFN0ZGVyciA9IHJlbW92ZVNhbmRib3hWaW9sYXRpb25UYWdzKHN0ZGVycikudHJpbSgpXG5cbiAgcmV0dXJuIHtcbiAgICBjbGVhbmVkU3RkZXJyLFxuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdHMgdGhlIFwiU2hlbGwgY3dkIHdhcyByZXNldFwiIHdhcm5pbmcgbWVzc2FnZSBmcm9tIHN0ZGVyclxuICogUmV0dXJucyB0aGUgY2xlYW5lZCBzdGRlcnIgYW5kIHRoZSB3YXJuaW5nIG1lc3NhZ2Ugc2VwYXJhdGVseVxuICovXG5mdW5jdGlvbiBleHRyYWN0Q3dkUmVzZXRXYXJuaW5nKHN0ZGVycjogc3RyaW5nKToge1xuICBjbGVhbmVkU3RkZXJyOiBzdHJpbmdcbiAgY3dkUmVzZXRXYXJuaW5nOiBzdHJpbmcgfCBudWxsXG59IHtcbiAgY29uc3QgbWF0Y2ggPSBzdGRlcnIubWF0Y2goU0hFTExfQ1dEX1JFU0VUX1BBVFRFUk4pXG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm4geyBjbGVhbmVkU3RkZXJyOiBzdGRlcnIsIGN3ZFJlc2V0V2FybmluZzogbnVsbCB9XG4gIH1cblxuICAvLyBFeHRyYWN0IHRoZSB3YXJuaW5nIG1lc3NhZ2UgZnJvbSBjYXB0dXJlIGdyb3VwIDFcbiAgY29uc3QgY3dkUmVzZXRXYXJuaW5nID0gbWF0Y2hbMV0gPz8gbnVsbFxuICAvLyBSZW1vdmUgdGhlIHdhcm5pbmcgZnJvbSBzdGRlcnIgKHJlcGxhY2UgdGhlIGZ1bGwgbWF0Y2gpXG4gIGNvbnN0IGNsZWFuZWRTdGRlcnIgPSBzdGRlcnIucmVwbGFjZShTSEVMTF9DV0RfUkVTRVRfUEFUVEVSTiwgJycpLnRyaW0oKVxuXG4gIHJldHVybiB7IGNsZWFuZWRTdGRlcnIsIGN3ZFJlc2V0V2FybmluZyB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEJhc2hUb29sUmVzdWx0TWVzc2FnZSh7XG4gIGNvbnRlbnQ6IHtcbiAgICBzdGRvdXQgPSAnJyxcbiAgICBzdGRlcnI6IHN0ZEVycldpdGhWaW9sYXRpb25zID0gJycsXG4gICAgaXNJbWFnZSxcbiAgICByZXR1cm5Db2RlSW50ZXJwcmV0YXRpb24sXG4gICAgbm9PdXRwdXRFeHBlY3RlZCxcbiAgICBiYWNrZ3JvdW5kVGFza0lkLFxuICB9LFxuICB2ZXJib3NlLFxuICB0aW1lb3V0TXMsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIEV4dHJhY3Qgc2FuZGJveCB2aW9sYXRpb25zIGZyb20gc3RkZXJyIGFzIGl0IGZlZWxzIGNsZWFuZXIgb24gdGhlIFVJXG4gIC8vIFdlIHdhbnQgdGhlIG1vZGVsIHRvIHNlZSB0aGUgdmlvbGF0aW9ucywgc28gaXQgY2FuIGV4cGxhaW4gd2hhdCB3ZW50IHdyb25nLCBhbmQgdGhlXG4gIC8vIHVzZXIgY2FuIGFjY2VzcyB0aGVtIGluIHRoZSB2aW9sYXRpb24gbG9nc1xuICBjb25zdCB7IGNsZWFuZWRTdGRlcnI6IHN0ZGVycldpdGhvdXRWaW9sYXRpb25zIH0gPVxuICAgIGV4dHJhY3RTYW5kYm94VmlvbGF0aW9ucyhzdGRFcnJXaXRoVmlvbGF0aW9ucylcblxuICAvLyBFeHRyYWN0IFwiU2hlbGwgY3dkIHdhcyByZXNldFwiIHdhcm5pbmcgdG8gcmVuZGVyIGl0IHdpdGggd2FybmluZyBjb2xvciBpbnN0ZWFkIG9mIGVycm9yXG4gIGNvbnN0IHsgY2xlYW5lZFN0ZGVycjogc3RkZXJyLCBjd2RSZXNldFdhcm5pbmcgfSA9IGV4dHJhY3RDd2RSZXNldFdhcm5pbmcoXG4gICAgc3RkZXJyV2l0aG91dFZpb2xhdGlvbnMsXG4gIClcblxuICAvLyBJZiB0aGlzIGlzIGFuIGltYWdlLCB3ZSBkb24ndCB3YW50IHRvIHRydW5jYXRlIGl0IGluIHRoZSBVSVxuICBpZiAoaXNJbWFnZSkge1xuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPltJbWFnZSBkYXRhIGRldGVjdGVkIGFuZCBzZW50IHRvIENsYXVkZV08L1RleHQ+XG4gICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAge3N0ZG91dCAhPT0gJycgPyA8T3V0cHV0TGluZSBjb250ZW50PXtzdGRvdXR9IHZlcmJvc2U9e3ZlcmJvc2V9IC8+IDogbnVsbH1cbiAgICAgIHtzdGRlcnIudHJpbSgpICE9PSAnJyA/IChcbiAgICAgICAgPE91dHB1dExpbmUgY29udGVudD17c3RkZXJyfSB2ZXJib3NlPXt2ZXJib3NlfSBpc0Vycm9yIC8+XG4gICAgICApIDogbnVsbH1cbiAgICAgIHtjd2RSZXNldFdhcm5pbmcgPyAoXG4gICAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+e2N3ZFJlc2V0V2FybmluZ308L1RleHQ+XG4gICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7c3Rkb3V0ID09PSAnJyAmJiBzdGRlcnIudHJpbSgpID09PSAnJyAmJiAhY3dkUmVzZXRXYXJuaW5nID8gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7YmFja2dyb3VuZFRhc2tJZCA/IChcbiAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICBSdW5uaW5nIGluIHRoZSBiYWNrZ3JvdW5keycgJ31cbiAgICAgICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCLihpNcIiBhY3Rpb249XCJtYW5hZ2VcIiBwYXJlbnMgLz5cbiAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICByZXR1cm5Db2RlSW50ZXJwcmV0YXRpb24gfHxcbiAgICAgICAgICAgICAgKG5vT3V0cHV0RXhwZWN0ZWQgPyAnRG9uZScgOiAnKE5vIG91dHB1dCknKVxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7dGltZW91dE1zICYmIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICA8U2hlbGxUaW1lRGlzcGxheSB0aW1lb3V0TXM9e3RpbWVvdXRNc30gLz5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApfVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQywwQkFBMEIsUUFBUSx1Q0FBdUM7QUFDbEYsU0FBU0Msb0JBQW9CLFFBQVEsd0RBQXdEO0FBQzdGLFNBQVNDLGVBQWUsUUFBUSxxQ0FBcUM7QUFDckUsU0FBU0MsVUFBVSxRQUFRLHNDQUFzQztBQUNqRSxTQUFTQyxnQkFBZ0IsUUFBUSw0Q0FBNEM7QUFDN0UsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxjQUFjQyxHQUFHLElBQUlDLE9BQU8sUUFBUSxlQUFlO0FBRW5ELEtBQUtDLEtBQUssR0FBRztFQUNYQyxPQUFPLEVBQUVDLElBQUksQ0FBQ0gsT0FBTyxFQUFFLGFBQWEsQ0FBQztFQUNyQ0ksT0FBTyxFQUFFLE9BQU87RUFDaEJDLFNBQVMsQ0FBQyxFQUFFLE1BQU07QUFDcEIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0EsTUFBTUMsdUJBQXVCLEdBQUcsc0NBQXNDOztBQUV0RTtBQUNBO0FBQ0E7QUFDQTtBQUNB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N0MsQ0FDRixFQVZDLElBQUksQ0FXUCxFQVpDLGVBQWUsQ0FhVixHQWRQLElBY087SUFBQVIsQ0FBQSxPQUFBUyxnQkFBQTtJQUFBVCxDQUFBLE9BQUFKLGVBQUE7SUFBQUksQ0FBQSxPQUFBUSxnQkFBQTtJQUFBUixDQUFBLE9BQUFPLHdCQUFBO0lBQUFQLENBQUEsT0FBQVYsTUFBQTtJQUFBVSxDQUFBLE9BQUFHLE1BQUE7SUFBQUgsQ0FBQSxPQUFBc0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXRCLENBQUE7RUFBQTtFQUFBLElBQUF1QixHQUFBO0VBQUEsSUFBQXZCLENBQUEsU0FBQWIsU0FBQTtJQUNQb0MsR0FBQSxHQUFBcEMsU0FJQSxJQUhDLENBQUMsZUFBZSxDQUNkLENBQUMsZ0JBQWdCLENBQVlBLFNBQVMsQ0FBVEEsVUFBUSxDQUFDLEdBQ3hDLEVBRkMsZUFBZSxDQUdqQjtJQUFBYSxDQUFBLE9BQUFiLFNBQUE7SUFBQWEsQ0FBQSxPQUFBdUIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQXZCLENBQUE7RUFBQTtFQUFBLElBQUF3QixHQUFBO0VBQUEsSUFBQXhCLENBQUEsU0FBQVksRUFBQSxJQUFBWixDQUFBLFNBQUF1QixHQUFBLElBQUF2QixDQUFBLFNBQUFhLEVBQUEsSUFBQWIsQ0FBQSxTQUFBYyxFQUFBLElBQUFkLENBQUEsU0FBQWUsRUFBQSxJQUFBZixDQUFBLFNBQUFxQixFQUFBLElBQUFyQixDQUFBLFNBQUFzQixFQUFBO0lBN0JIRSxHQUFBLElBQUMsRUFBRyxDQUFlLGFBQVEsQ0FBUixDQUFBWCxFQUFPLENBQUMsQ0FDeEIsQ0FBQUMsRUFBdUUsQ0FDdkUsQ0FBQUMsRUFFTSxDQUNOLENBQUFNLEVBSU0sQ0FDTixDQUFBQyxFQWNNLENBQ04sQ0FBQUMsR0FJRCxDQUNGLEVBOUJDLEVBQUcsQ0E4QkU7SUFBQXZCLENBQUEsT0FBQVksRUFBQTtJQUFBWixDQUFBLE9BQUF1QixHQUFBO0lBQUF2QixDQUFBLE9BQUFhLEVBQUE7SUFBQWIsQ0FBQSxPQUFBYyxFQUFBO0lBQUFkLENBQUEsT0FBQWUsRUFBQTtJQUFBZixDQUFBLE9BQUFxQixFQUFBO0lBQUFyQixDQUFBLE9BQUFzQixFQUFBO0lBQUF0QixDQUFBLE9BQUF3QixHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBeEIsQ0FBQTtFQUFBO0VBQUEsT0E5Qk53QixHQThCTTtBQUFBIiwiaWdub3JlTGlzdCI6W119
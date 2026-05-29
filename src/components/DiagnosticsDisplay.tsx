// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 接入 DiagnosticTrackingService 服务层能力，把外部通信或共享状态交给 ../services/diagnosticTracking.js 处理。
import { DiagnosticTrackingService } from '../services/diagnosticTracking.js';
// 类型依赖 { Attachment } 来自 ../utils/attachments.js，用于校准终端渲染的数据契约。
import type { Attachment } from '../utils/attachments.js';
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js';
// 引入 CtrlOToExpand，将 ./CtrlOToExpand.js 中已经封装好的能力接到本文件流程里。
import { CtrlOToExpand } from './CtrlOToExpand.js';
// 引入 MessageResponse，将 ./MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from './MessageResponse.js';
// DiagnosticsAttachment 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DiagnosticsAttachment = Extract<Attachment, {
  type: 'diagnostics';
}>;
// DiagnosticsDisplayProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DiagnosticsDisplayProps = {
  attachment: DiagnosticsAttachment;
  verbose: boolean;
};
// DiagnosticsDisplay 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DiagnosticsDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    attachment,
    verbose
  } = t0;
  // attachment.files 文件数据为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (attachment.files.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `attachment.files.reduce(_temp, 0)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== attachment.files) {
    // t1 暂存 `attachment.files.reduce(_temp, 0)` 生成的渲染片段，后续返回路径直接复用。
    t1 = attachment.files.reduce(_temp, 0);
    // $[0] 缓存 `attachment.files`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = attachment.files;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // totalIssues 集合沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const totalIssues = t1;
  // fileCount 文件数据 命名 `attachment.files.length`，让后续代码直接表达这个值的用途。
  const fileCount = attachment.files.length;
  // 满足 `verbose` 时，终端渲染执行该分支。
  if (verbose) {
    // t2 暂存 `attachment.files.map(_temp3)` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[2] !== attachment.files) {
      // t2 暂存 `attachment.files.map(_temp3)` 生成的渲染片段，后续返回路径直接复用。
      t2 = attachment.files.map(_temp3);
      // $[2] 缓存 `attachment.files`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = attachment.files;
      // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[3];
    }
    // t3 暂存 `<Box flexDirection="column">{t2}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== t2) {
      // t3 暂存 `<Box flexDirection="column">{t2}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Box flexDirection="column">{t2}</Box>;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
      // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[5];
    }
    // 返回 `t3`，作为终端渲染这次计算的结果。
    return t3;
  } else {
    // t2 暂存 `<Text bold={true}>{totalIssues}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[6] !== totalIssues) {
      // t2 暂存 `<Text bold={true}>{totalIssues}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text bold={true}>{totalIssues}</Text>;
      // $[6] 缓存 `totalIssues`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = totalIssues;
      // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[7];
    }
    // t3标记终端 UI Diagnostics Display是否启用对应路径。
    const t3 = totalIssues === 1 ? "issue" : "issues";
    // t4标记终端 UI Diagnostics Display是否启用对应路径。
    const t4 = fileCount === 1 ? "file" : "files";
    // t5 暂存 `<CtrlOToExpand />` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<CtrlOToExpand />` 生成的渲染片段，后续返回路径直接复用。
      t5 = <CtrlOToExpand />;
      // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[8];
    }
    // t6 暂存 `<MessageResponse><Text dimColor={true} wrap="wrap">Found ...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[9] !== fileCount || $[10] !== t2 || $[11] !== t3 || $[12] !== t4) {
      // t6 暂存 `<MessageResponse><Text dimColor={true} wrap="wrap">Found ...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <MessageResponse><Text dimColor={true} wrap="wrap">Found {t2} new diagnostic{" "}{t3} in {fileCount}{" "}{t4} {t5}</Text></MessageResponse>;
      // $[9] 缓存 `fileCount`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = fileCount;
      // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t2;
      // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t3;
      // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t4;
      // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[13];
    }
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(file_0, fileIndex) {
  // 返回 `<React.Fragment key={fileIndex}><MessageResponse><Text dimColor={true} ...`，作为终端渲染这次计算的结果。
  return <React.Fragment key={fileIndex}><MessageResponse><Text dimColor={true} wrap="wrap"><Text bold={true}>{relative(getCwd(), file_0.uri.replace("file://", "").replace("_claude_fs_right:", ""))}</Text>{" "}<Text dimColor={true}>{file_0.uri.startsWith("file://") ? "(file://)" : file_0.uri.startsWith("_claude_fs_right:") ? "(claude_fs_right)" : `(${file_0.uri.split(":")[0]})`}</Text>:</Text></MessageResponse>{file_0.diagnostics.map(_temp2)}</React.Fragment>;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(diagnostic, diagIndex) {
  // 返回 `<MessageResponse key={diagIndex}><Text dimColor={true} wrap="wrap">{" "...`，作为终端渲染这次计算的结果。
  return <MessageResponse key={diagIndex}><Text dimColor={true} wrap="wrap">{"  "}{DiagnosticTrackingService.getSeveritySymbol(diagnostic.severity)}{" [Line "}{diagnostic.range.start.line + 1}:{diagnostic.range.start.character + 1}{"] "}{diagnostic.message}{diagnostic.code ? ` [${diagnostic.code}]` : ""}{diagnostic.source ? ` (${diagnostic.source})` : ""}</Text></MessageResponse>;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(sum, file) {
  // 返回 `sum + file.diagnostics.length`，作为终端渲染这次计算的结果。
  return sum + file.diagnostics.length;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZWxhdGl2ZSIsIlJlYWN0IiwiQm94IiwiVGV4dCIsIkRpYWdub3N0aWNUcmFja2luZ1NlcnZpY2UiLCJBdHRhY2htZW50IiwiZ2V0Q3dkIiwiQ3RybE9Ub0V4cGFuZCIsIk1lc3NhZ2VSZXNwb25zZSIsIkRpYWdub3N0aWNzQXR0YWNobWVudCIsIkV4dHJhY3QiLCJ0eXBlIiwiRGlhZ25vc3RpY3NEaXNwbGF5UHJvcHMiLCJhdHRhY2htZW50IiwidmVyYm9zZSIsIkRpYWdub3N0aWNzRGlzcGxheSIsInQwIiwiJCIsIl9jIiwiZmlsZXMiLCJsZW5ndGgiLCJ0MSIsInJlZHVjZSIsIl90ZW1wIiwidG90YWxJc3N1ZXMiLCJmaWxlQ291bnQiLCJ0MiIsIm1hcCIsIl90ZW1wMyIsInQzIiwidDQiLCJ0NSIsIlN5bWJvbCIsImZvciIsInQ2IiwiZmlsZV8wIiwiZmlsZUluZGV4IiwiZmlsZSIsInVyaSIsInJlcGxhY2UiLCJzdGFydHNXaXRoIiwic3BsaXQiLCJkaWFnbm9zdGljcyIsIl90ZW1wMiIsImRpYWdub3N0aWMiLCJkaWFnSW5kZXgiLCJnZXRTZXZlcml0eVN5bWJvbCIsInNldmVyaXR5IiwicmFuZ2UiLCJzdGFydCIsImxpbmUiLCJjaGFyYWN0ZXIiLCJtZXNzYWdlIiwiY29kZSIsInNvdXJjZSIsInN1bSJdLCJzb3VyY2VzIjpbIkRpYWdub3N0aWNzRGlzcGxheS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVsYXRpdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgRGlhZ25vc3RpY1RyYWNraW5nU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2RpYWdub3N0aWNUcmFja2luZy5qcydcbmltcG9ydCB0eXBlIHsgQXR0YWNobWVudCB9IGZyb20gJy4uL3V0aWxzL2F0dGFjaG1lbnRzLmpzJ1xuaW1wb3J0IHsgZ2V0Q3dkIH0gZnJvbSAnLi4vdXRpbHMvY3dkLmpzJ1xuaW1wb3J0IHsgQ3RybE9Ub0V4cGFuZCB9IGZyb20gJy4vQ3RybE9Ub0V4cGFuZC5qcydcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4vTWVzc2FnZVJlc3BvbnNlLmpzJ1xuXG50eXBlIERpYWdub3N0aWNzQXR0YWNobWVudCA9IEV4dHJhY3Q8QXR0YWNobWVudCwgeyB0eXBlOiAnZGlhZ25vc3RpY3MnIH0+XG5cbnR5cGUgRGlhZ25vc3RpY3NEaXNwbGF5UHJvcHMgPSB7XG4gIGF0dGFjaG1lbnQ6IERpYWdub3N0aWNzQXR0YWNobWVudFxuICB2ZXJib3NlOiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBEaWFnbm9zdGljc0Rpc3BsYXkoe1xuICBhdHRhY2htZW50LFxuICB2ZXJib3NlLFxufTogRGlhZ25vc3RpY3NEaXNwbGF5UHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBPbmx5IHNob3cgaWYgdGhlcmUgYXJlIGRpYWdub3N0aWNzIHRvIHJlcG9ydFxuICBpZiAoYXR0YWNobWVudC5maWxlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsXG5cbiAgLy8gQ291bnQgdG90YWwgaXNzdWVzXG4gIGNvbnN0IHRvdGFsSXNzdWVzID0gYXR0YWNobWVudC5maWxlcy5yZWR1Y2UoXG4gICAgKHN1bSwgZmlsZSkgPT4gc3VtICsgZmlsZS5kaWFnbm9zdGljcy5sZW5ndGgsXG4gICAgMCxcbiAgKVxuXG4gIGNvbnN0IGZpbGVDb3VudCA9IGF0dGFjaG1lbnQuZmlsZXMubGVuZ3RoXG5cbiAgaWYgKHZlcmJvc2UpIHtcbiAgICAvLyBTaG93IGFsbCBkaWFnbm9zdGljcyBpbiB2ZXJib3NlIG1vZGUgKGN0cmwrbylcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIHthdHRhY2htZW50LmZpbGVzLm1hcCgoZmlsZSwgZmlsZUluZGV4KSA9PiAoXG4gICAgICAgICAgPFJlYWN0LkZyYWdtZW50IGtleT17ZmlsZUluZGV4fT5cbiAgICAgICAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yIHdyYXA9XCJ3cmFwXCI+XG4gICAgICAgICAgICAgICAgPFRleHQgYm9sZD5cbiAgICAgICAgICAgICAgICAgIHtyZWxhdGl2ZShcbiAgICAgICAgICAgICAgICAgICAgZ2V0Q3dkKCksXG4gICAgICAgICAgICAgICAgICAgIGZpbGUudXJpXG4gICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoJ2ZpbGU6Ly8nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgnX2NsYXVkZV9mc19yaWdodDonLCAnJyksXG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvVGV4dD57JyAnfVxuICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgICAge2ZpbGUudXJpLnN0YXJ0c1dpdGgoJ2ZpbGU6Ly8nKVxuICAgICAgICAgICAgICAgICAgICA/ICcoZmlsZTovLyknXG4gICAgICAgICAgICAgICAgICAgIDogZmlsZS51cmkuc3RhcnRzV2l0aCgnX2NsYXVkZV9mc19yaWdodDonKVxuICAgICAgICAgICAgICAgICAgICAgID8gJyhjbGF1ZGVfZnNfcmlnaHQpJ1xuICAgICAgICAgICAgICAgICAgICAgIDogYCgke2ZpbGUudXJpLnNwbGl0KCc6JylbMF19KWB9XG4gICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDpcbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgICB7ZmlsZS5kaWFnbm9zdGljcy5tYXAoKGRpYWdub3N0aWMsIGRpYWdJbmRleCkgPT4gKFxuICAgICAgICAgICAgICA8TWVzc2FnZVJlc3BvbnNlIGtleT17ZGlhZ0luZGV4fT5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvciB3cmFwPVwid3JhcFwiPlxuICAgICAgICAgICAgICAgICAgeycgICd9XG4gICAgICAgICAgICAgICAgICB7RGlhZ25vc3RpY1RyYWNraW5nU2VydmljZS5nZXRTZXZlcml0eVN5bWJvbChcbiAgICAgICAgICAgICAgICAgICAgZGlhZ25vc3RpYy5zZXZlcml0eSxcbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICB7JyBbTGluZSAnfVxuICAgICAgICAgICAgICAgICAge2RpYWdub3N0aWMucmFuZ2Uuc3RhcnQubGluZSArIDF9OlxuICAgICAgICAgICAgICAgICAge2RpYWdub3N0aWMucmFuZ2Uuc3RhcnQuY2hhcmFjdGVyICsgMX1cbiAgICAgICAgICAgICAgICAgIHsnXSAnfVxuICAgICAgICAgICAgICAgICAge2RpYWdub3N0aWMubWVzc2FnZX1cbiAgICAgICAgICAgICAgICAgIHtkaWFnbm9zdGljLmNvZGUgPyBgIFske2RpYWdub3N0aWMuY29kZX1dYCA6ICcnfVxuICAgICAgICAgICAgICAgICAge2RpYWdub3N0aWMuc291cmNlID8gYCAoJHtkaWFnbm9zdGljLnNvdXJjZX0pYCA6ICcnfVxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8L1JlYWN0LkZyYWdtZW50PlxuICAgICAgICApKX1cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfSBlbHNlIHtcbiAgICAvLyBTaG93IHN1bW1hcnkgaW4gbm9ybWFsIG1vZGVcbiAgICByZXR1cm4gKFxuICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgPFRleHQgZGltQ29sb3Igd3JhcD1cIndyYXBcIj5cbiAgICAgICAgICBGb3VuZCA8VGV4dCBib2xkPnt0b3RhbElzc3Vlc308L1RleHQ+IG5ldyBkaWFnbm9zdGljeycgJ31cbiAgICAgICAgICB7dG90YWxJc3N1ZXMgPT09IDEgPyAnaXNzdWUnIDogJ2lzc3Vlcyd9IGluIHtmaWxlQ291bnR9eycgJ31cbiAgICAgICAgICB7ZmlsZUNvdW50ID09PSAxID8gJ2ZpbGUnIDogJ2ZpbGVzJ30gPEN0cmxPVG9FeHBhbmQgLz5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgKVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxRQUFRLFFBQVEsTUFBTTtBQUMvQixPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLHlCQUF5QixRQUFRLG1DQUFtQztBQUM3RSxjQUFjQyxVQUFVLFFBQVEseUJBQXlCO0FBQ3pELFNBQVNDLE1BQU0sUUFBUSxpQkFBaUI7QUFDeEMsU0FBU0MsYUFBYSxRQUFRLG9CQUFvQjtBQUNsRCxTQUFTQyxlQUFlLFFBQVEsc0JBQXNCO0FBRXRELEtBQUtDLHFCQUFxQixHQUFHQyxPQUFPLENBQUNMLFVBQVUsRUFBRTtFQUFFTSxJQUFJLEVBQUUsYUFBYTtBQUFDLENBQUMsQ0FBQztBQUV6RSxLQUFLQyx1QkFBdUIsR0FBRztFQUM3QkMsVUFBVSxFQUFFSixxQkFBcUI7RUFDakNLLE9BQU8sRUFBRSxPQUFPO0FBQ2xCLENBQUM7QUFFRCxPQUFPLFNBQUFDLG1CQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQTRCO0lBQUFMLFVBQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUdUO0VBRXhCLElBQUlILFVBQVUsQ0FBQU0sS0FBTSxDQUFBQyxNQUFPLEtBQUssQ0FBQztJQUFBLE9BQVMsSUFBSTtFQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFKLENBQUEsUUFBQUosVUFBQSxDQUFBTSxLQUFBO0lBRzFCRSxFQUFBLEdBQUFSLFVBQVUsQ0FBQU0sS0FBTSxDQUFBRyxNQUFPLENBQ3pDQyxLQUE0QyxFQUM1QyxDQUNGLENBQUM7SUFBQU4sQ0FBQSxNQUFBSixVQUFBLENB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QUNSK0IsTUFBSSxDQUFBQyxHQUFJLENBQUFDLE9BQ0UsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUFBLE9BQ2YsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQ3BDLEVBQ0YsRUFQQyxJQUFJLENBT0csSUFBRSxDQUNWLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWCxDQUFBRixNQUFJLENBQUFDLEdBQUksQ0FBQUUsVUFBVyxDQUFDLFNBSWEsQ0FBQyxHQUpsQyxXQUlrQyxHQUYvQkgsTUFBSSxDQUFBQyxHQUFJLENBQUFFLFVBQVcsQ0FBQyxtQkFFVSxDQUFDLEdBRi9CLG1CQUUrQixHQUYvQixJQUVNSCxNQUFJLENBQUFDLEdBQUksQ0FBQUcsS0FBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUUsQ0FDcEMsRUFOQyxJQUFJLENBTUUsQ0FFVCxFQWpCQyxJQUFJLENBa0JQLEVBbkJDLGVBQWUsQ0FvQmYsQ0FBQUosTUFBSSxDQUFBSyxXQUFZLENBQUFmLEdBQUksQ0FBQ2dCLE1BZ0JyQixFQUNILGlCQUFpQjtBQUFBO0FBMURwQixTQUFBQSxPQUFBQyxVQUFBLEVBQUFDLFNBQUE7RUFBQSxPQTBDTyxDQUFDLGVBQWUsQ0FBTUEsR0FBUyxDQUFUQSxVQUFRLENBQUMsQ0FDN0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFNLElBQU0sQ0FBTixNQUFNLENBQ3ZCLEtBQUcsQ0FDSCxDQUFBekMseUJBQXlCLENBQUEwQyxpQkFBa0IsQ0FDMUNGLFVBQVUsQ0FBQUcsUUFDWixFQUNDLFVBQVEsQ0FDUixDQUFBSCxVQUFVLENBQUFJLEtBQU0sQ0FBQUMsS0FBTSxDQUFBQyxJQUFLLEdBQUcsRUFBRSxDQUNoQyxDQUFBTixVQUFVLENBQUFJLEtBQU0sQ0FBQUMsS0FBTSxDQUFBRSxTQUFVLEdBQUcsRUFDbkMsS0FBRyxDQUNILENBQUFQLFVBQVUsQ0FBQVEsT0FBTyxDQUNqQixDQUFBUixVQUFVLENBQUFTLElBQW9DLEdBQTlDLEtBQXVCVCxVQUFVLENBQUFTLElBQUssR0FBUSxHQUE5QyxFQUE2QyxDQUM3QyxDQUFBVCxVQUFVLENBQUFVLE1BQXdDLEdBQWxELEtBQXlCVixVQUFVLENBQUFVLE1BQU8sR0FBUSxHQUFsRCxFQUFpRCxDQUNwRCxFQVpDLElBQUksQ0FhUCxFQWRDLGVBQWUsQ0FjRTtBQUFBO0FBeER6QixTQUFBL0IsTUFBQWdDLEdBQUEsRUFBQWxCLElBQUE7RUFBQSxPQVNZa0IsR0FBRyxHQUFHbEIsSUFBSSxDQUFBSyxXQUFZLENBQUF0QixNQUFPO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
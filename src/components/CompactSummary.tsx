// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 BLACK_CIRCLE，将 ../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from '../constants/figures.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 类型依赖 { Screen } 来自 ../screens/REPL.js，用于校准终端渲染的数据契约。
import type { Screen } from '../screens/REPL.js';
// 类型依赖 { NormalizedUserMessage } 来自 ../types/message.js，用于校准终端渲染的数据契约。
import type { NormalizedUserMessage } from '../types/message.js';
// 复用 getUserMessageText 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { getUserMessageText } from '../utils/messages.js';
// 引入 ConfigurableShortcutHint，将 ./ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
// 引入 MessageResponse，将 ./MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from './MessageResponse.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  message: NormalizedUserMessage;
  screen: Screen;
};
// CompactSummary 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CompactSummary(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(24);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    message,
    screen
  } = t0;
  // isTranscriptMode标记终端 UI Compact Summary是否启用对应路径。
  const isTranscriptMode = screen === "transcript";
  // t1 暂存 `getUserMessageText(message) || ""` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== message) {
    // t1 暂存 `getUserMessageText(message) || ""` 生成的渲染片段，后续返回路径直接复用。
    t1 = getUserMessageText(message) || "";
    // $[0] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = message;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // textContent沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const textContent = t1;
  // metadata 命名 `message.summarizeMetadata`，让后续代码直接表达这个值的用途。
  const metadata = message.summarizeMetadata;
  // 满足 `metadata` 时，终端渲染执行该分支。
  if (metadata) {
    // t2 暂存 `<Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      // t2 暂存 `<Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text></Box>;
      // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[2];
    }
    // t3 暂存 `<Text bold={true}>Summarized conversation</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `<Text bold={true}>Summarized conversation</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text bold={true}>Summarized conversation</Text>;
      // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[3];
    }
    // t4 暂存 `!isTranscriptMode && <MessageResponse><Box flexDirection=...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== isTranscriptMode || $[5] !== metadata) {
      // t4 暂存 `!isTranscriptMode && <MessageResponse><Box flexDirection=...` 生成的渲染片段，后续返回路径直接复用。
      t4 = !isTranscriptMode && <MessageResponse><Box flexDirection="column"><Text dimColor={true}>Summarized {metadata.messagesSummarized} messages{" "}{metadata.direction === "up_to" ? "up to this point" : "from this point"}</Text>{metadata.userContext && <Text dimColor={true}>Context: {"\u201C"}{metadata.userContext}{"\u201D"}</Text>}<Text dimColor={true}><ConfigurableShortcutHint action="app:toggleTranscript" context="Global" fallback="ctrl+o" description="expand history" parens={true} /></Text></Box></MessageResponse>;
      // $[4] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = isTranscriptMode;
      // $[5] 缓存 `metadata`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = metadata;
      // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[6];
    }
    // t5 暂存 `isTranscriptMode && <MessageResponse><Text>{textContent}<...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== isTranscriptMode || $[8] !== textContent) {
      // t5 暂存 `isTranscriptMode && <MessageResponse><Text>{textContent}<...` 生成的渲染片段，后续返回路径直接复用。
      t5 = isTranscriptMode && <MessageResponse><Text>{textContent}</Text></MessageResponse>;
      // $[7] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = isTranscriptMode;
      // $[8] 缓存 `textContent`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = textContent;
      // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[9];
    }
    // t6 暂存 `<Box flexDirection="column" marginTop={1}><Box flexDirect...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== t4 || $[11] !== t5) {
      // t6 暂存 `<Box flexDirection="column" marginTop={1}><Box flexDirect...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Box flexDirection="column" marginTop={1}><Box flexDirection="row">{t2}<Box flexDirection="column">{t3}{t4}{t5}</Box></Box></Box>;
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
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
  // t2 暂存 `<Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text></Box>;
    // $[13] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[13];
  }
  // t3 暂存 `!isTranscriptMode && <Text dimColor={true}>{" "}<Configur...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== isTranscriptMode) {
    // t3 暂存 `!isTranscriptMode && <Text dimColor={true}>{" "}<Configur...` 生成的渲染片段，后续返回路径直接复用。
    t3 = !isTranscriptMode && <Text dimColor={true}>{" "}<ConfigurableShortcutHint action="app:toggleTranscript" context="Global" fallback="ctrl+o" description="expand" parens={true} /></Text>;
    // $[14] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = isTranscriptMode;
    // $[15] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[15];
  }
  // t4 暂存 `<Box flexDirection="row">{t2}<Box flexDirection="column">...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t3) {
    // t4 暂存 `<Box flexDirection="row">{t2}<Box flexDirection="column">...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="row">{t2}<Box flexDirection="column"><Text bold={true}>Compact summary{t3}</Text></Box></Box>;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
    // $[17] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[17];
  }
  // t5 暂存 `isTranscriptMode && <MessageResponse><Text>{textContent}<...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== isTranscriptMode || $[19] !== textContent) {
    // t5 暂存 `isTranscriptMode && <MessageResponse><Text>{textContent}<...` 生成的渲染片段，后续返回路径直接复用。
    t5 = isTranscriptMode && <MessageResponse><Text>{textContent}</Text></MessageResponse>;
    // $[18] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = isTranscriptMode;
    // $[19] 缓存 `textContent`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = textContent;
    // $[20] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[20];
  }
  // t6 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== t4 || $[22] !== t5) {
    // t6 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" marginTop={1}>{t4}{t5}</Box>;
    // $[21] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t4;
    // $[22] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t5;
    // $[23] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[23];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJMQUNLX0NJUkNMRSIsIkJveCIsIlRleHQiLCJTY3JlZW4iLCJOb3JtYWxpemVkVXNlck1lc3NhZ2UiLCJnZXRVc2VyTWVzc2FnZVRleHQiLCJDb25maWd1cmFibGVTaG9ydGN1dEhpbnQiLCJNZXNzYWdlUmVzcG9uc2UiLCJQcm9wcyIsIm1lc3NhZ2UiLCJzY3JlZW4iLCJDb21wYWN0U3VtbWFyeSIsInQwIiwiJCIsIl9jIiwiaXNUcmFuc2NyaXB0TW9kZSIsInQxIiwidGV4dENvbnRlbnQiLCJtZXRhZGF0YSIsInN1bW1hcml6ZU1ldGFkYXRhIiwidDIiLCJTeW1ib2wiLCJmb3IiLCJ0MyIsInQ0IiwibWVzc2FnZXNTdW1tYXJpemVkIiwiZGlyZWN0aW9uIiwidXNlckNvbnRleHQiLCJ0NSIsInQ2Il0sInNvdXJjZXMiOlsiQ29tcGFjdFN1bW1hcnkudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQkxBQ0tfQ0lSQ0xFIH0gZnJvbSAnLi4vY29uc3RhbnRzL2ZpZ3VyZXMuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IFNjcmVlbiB9IGZyb20gJy4uL3NjcmVlbnMvUkVQTC5qcydcbmltcG9ydCB0eXBlIHsgTm9ybWFsaXplZFVzZXJNZXNzYWdlIH0gZnJvbSAnLi4vdHlwZXMvbWVzc2FnZS5qcydcbmltcG9ydCB7IGdldFVzZXJNZXNzYWdlVGV4dCB9IGZyb20gJy4uL3V0aWxzL21lc3NhZ2VzLmpzJ1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi9Db25maWd1cmFibGVTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuL01lc3NhZ2VSZXNwb25zZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgbWVzc2FnZTogTm9ybWFsaXplZFVzZXJNZXNzYWdlXG4gIHNjcmVlbjogU2NyZWVuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDb21wYWN0U3VtbWFyeSh7IG1lc3NhZ2UsIHNjcmVlbiB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGlzVHJhbnNjcmlwdE1vZGUgPSBzY3JlZW4gPT09ICd0cmFuc2NyaXB0J1xuICBjb25zdCB0ZXh0Q29udGVudCA9IGdldFVzZXJNZXNzYWdlVGV4dChtZXNzYWdlKSB8fCAnJ1xuICBjb25zdCBtZXRhZGF0YSA9IG1lc3NhZ2Uuc3VtbWFyaXplTWV0YWRhdGFcblxuICAvLyBcIlN1bW1hcml6ZSBmcm9tIGhlcmVcIiB3aXRoIG1ldGFkYXRhXG4gIGlmIChtZXRhZGF0YSkge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgICA8Qm94IG1pbldpZHRoPXsyfT5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwidGV4dFwiPntCTEFDS19DSVJDTEV9PC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgPFRleHQgYm9sZD5TdW1tYXJpemVkIGNvbnZlcnNhdGlvbjwvVGV4dD5cbiAgICAgICAgICAgIHshaXNUcmFuc2NyaXB0TW9kZSAmJiAoXG4gICAgICAgICAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgICAgU3VtbWFyaXplZCB7bWV0YWRhdGEubWVzc2FnZXNTdW1tYXJpemVkfSBtZXNzYWdlc3snICd9XG4gICAgICAgICAgICAgICAgICAgIHttZXRhZGF0YS5kaXJlY3Rpb24gPT09ICd1cF90bydcbiAgICAgICAgICAgICAgICAgICAgICA/ICd1cCB0byB0aGlzIHBvaW50J1xuICAgICAgICAgICAgICAgICAgICAgIDogJ2Zyb20gdGhpcyBwb2ludCd9XG4gICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgICB7bWV0YWRhdGEudXNlckNvbnRleHQgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgICAgICBDb250ZXh0OiB7J1xcdTIwMWMnfVxuICAgICAgICAgICAgICAgICAgICAgIHttZXRhZGF0YS51c2VyQ29udGV4dH1cbiAgICAgICAgICAgICAgICAgICAgICB7J1xcdTIwMWQnfVxuICAgICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgICAgICAgICAgICBhY3Rpb249XCJhcHA6dG9nZ2xlVHJhbnNjcmlwdFwiXG4gICAgICAgICAgICAgICAgICAgICAgY29udGV4dD1cIkdsb2JhbFwiXG4gICAgICAgICAgICAgICAgICAgICAgZmFsbGJhY2s9XCJjdHJsK29cIlxuICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiZXhwYW5kIGhpc3RvcnlcIlxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVuc1xuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICB7aXNUcmFuc2NyaXB0TW9kZSAmJiAoXG4gICAgICAgICAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgICAgICAgPFRleHQ+e3RleHRDb250ZW50fTwvVGV4dD5cbiAgICAgICAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIC8vIERlZmF1bHQgY29tcGFjdCBzdW1tYXJ5IChhdXRvLWNvbXBhY3QpXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICA8Qm94IG1pbldpZHRoPXsyfT5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cInRleHRcIj57QkxBQ0tfQ0lSQ0xFfTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0IGJvbGQ+XG4gICAgICAgICAgICBDb21wYWN0IHN1bW1hcnlcbiAgICAgICAgICAgIHshaXNUcmFuc2NyaXB0TW9kZSAmJiAoXG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICAgICAgPENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludFxuICAgICAgICAgICAgICAgICAgYWN0aW9uPVwiYXBwOnRvZ2dsZVRyYW5zY3JpcHRcIlxuICAgICAgICAgICAgICAgICAgY29udGV4dD1cIkdsb2JhbFwiXG4gICAgICAgICAgICAgICAgICBmYWxsYmFjaz1cImN0cmwrb1wiXG4gICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbj1cImV4cGFuZFwiXG4gICAgICAgICAgICAgICAgICBwYXJlbnNcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICAgIHtpc1RyYW5zY3JpcHRNb2RlICYmIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICA8VGV4dD57dGV4dENvbnRlbnR9PC9UZXh0PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsWUFBWSxRQUFRLHlCQUF5QjtBQUN0RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLGNBQWNDLE1BQU0sUUFBUSxvQkFBb0I7QUFDaEQsY0FBY0MscUJBQXFCLFFBQVEscUJBQXFCO0FBQ2hFLFNBQVNDLGtCQUFrQixRQUFRLHNCQUFzQjtBQUN6RCxTQUFTQyx3QkFBd0IsUUFBUSwrQkFBK0I7QUFDeEUsU0FBU0MsZUFBZSxRQUFRLHNCQUFzQjtBQUV0RCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsT0FBTyxFQUFFTCxxQkFBcUI7RUFDOUJNLE1BQU0sRUFBRVAsTUFBTTtBQUNoQixDQUFDO0FBRUQsT0FBTyxTQUFBUSxlQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXdCO0lBQUFMLE9BQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUEwQjtFQUN2RCxNQUFBRyxnQkFBQSxHQUF5QkwsTUFBTSxLQUFLLFlBQVk7RUFBQSxJQUFBTSxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBSixPQUFBO0lBQzVCTyxFQUFBLEdBQUFYLGtCQUFrQixDQUFDSSxPQUFhLENBQUMsSUFBakMsRUFBaUM7SUFBQUksQ0FBQSxNQUFBSixPQUFBO0lBQUFJLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBQXJELE1BQUFJLFdBQUEsR0FBb0JELEVBQWlDO0VBQ3JELE1BQUFFLFFBQUEsR0FBaUJULE9BQU8sQ0FBQVUsaUJBQWtCO0VBRzFDLElB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
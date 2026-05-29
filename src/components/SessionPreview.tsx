// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { UUID } 来自 crypto，用于校准终端渲染的数据契约。
import type { UUID } from 'crypto';
// 引入 React、useCallback，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback } from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js';
// 引入 getAllBaseTools，将 ../tools.js 中已经封装好的能力接到本文件流程里。
import { getAllBaseTools } from '../tools.js';
// 类型依赖 { LogOption } 来自 ../types/logs.js，用于校准终端渲染的数据契约。
import type { LogOption } from '../types/logs.js';
// 复用 formatRelativeTimeAgo 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatRelativeTimeAgo } from '../utils/format.js';
// 复用 getSessionIdFromLog、isLiteLog、loadFullLog 工具函数，把通用处理留在 ../utils/sessionStorage.js 中维护。
import { getSessionIdFromLog, isLiteLog, loadFullLog } from '../utils/sessionStorage.js';
// 引入 ConfigurableShortcutHint，将 ./ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
// 引入 Byline，将 ./design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from './design-system/Byline.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// 引入 LoadingState，将 ./design-system/LoadingState.js 中已经封装好的能力接到本文件流程里。
import { LoadingState } from './design-system/LoadingState.js';
// 引入 Messages，将 ./Messages.js 中已经封装好的能力接到本文件流程里。
import { Messages } from './Messages.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  log: LogOption;
  // 这个回调绑定到 onExit: () => void;，负责终端渲染在该局部场景下的响应。
  onExit: () => void;
  // 这个回调绑定到 onSelect: (log: LogOption) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (log: LogOption) => void;
};
// SessionPreview 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SessionPreview(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(33);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    log,
    onExit,
    onSelect
  } = t0;
  // 从 `React.useState(null)` 按位置拆出 fullLog、setFullLog，让终端 UI 组件 Session Preview分别处理这些返回值。
  const [fullLog, setFullLog] = React.useState(null);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[log]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== log) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // setFullLog 写入新的状态值，使终端渲染后续读取保持一致。
      setFullLog(null);
      // 满足 `isLiteLog(log)` 时，终端渲染执行该分支。
      if (isLiteLog(log)) {
        // 调用 loadFullLog，触发终端渲染此处需要的副作用。
        loadFullLog(log).then(setFullLog);
      }
    };
    // t2 暂存 `[log]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [log];
    // $[0] 缓存 `log`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = log;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(t1, t2);
  // isLoading记录 `isLiteLog` 是否成立，终端渲染随后按该结果分支。
  const isLoading = isLiteLog(log) && fullLog === null;
  // displayLog保存`fullLog ?? log`，供后续判断或组装使用。
  const displayLog = fullLog ?? log;
  // t3 暂存 `getSessionIdFromLog(displayLog) || "" as UUID` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== displayLog) {
    // t3 暂存 `getSessionIdFromLog(displayLog) || "" as UUID` 生成的渲染片段，后续返回路径直接复用。
    t3 = getSessionIdFromLog(displayLog) || "" as UUID;
    // $[3] 缓存 `displayLog`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = displayLog;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // conversationId沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const conversationId = t3;
  // t4 暂存 `getAllBaseTools()` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `getAllBaseTools()` 生成的渲染片段，后续返回路径直接复用。
    t4 = getAllBaseTools();
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // tools 集合 命名 `t4`，让后续代码直接表达这个值的用途。
  const tools = t4;
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      context: "Confirmation"
    };
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", onExit, t5);
  // t6 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== fullLog || $[8] !== log || $[9] !== onSelect) {
    // t6 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = () => {
      // 调用 onSelect，触发终端渲染此处需要的副作用。
      onSelect(fullLog ?? log);
    };
    // $[7] 缓存 `fullLog`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = fullLog;
    // $[8] 缓存 `log`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = log;
    // $[9] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = onSelect;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[10];
  }
  // handleSelect沿用 `t6` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t6;
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      context: "Confirmation"
    };
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:yes", handleSelect, t7);
  // 满足 `isLoading` 时，终端渲染执行该分支。
  if (isLoading) {
    // t8 暂存 `<LoadingState message={"Loading session\u2026"} />` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      // t8 暂存 `<LoadingState message={"Loading session\u2026"} />` 生成的渲染片段，后续返回路径直接复用。
      t8 = <LoadingState message={"Loading session\u2026"} />;
      // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[12];
    }
    // t9 暂存 `<Box flexDirection="column" padding={1}>{t8}<Text dimColo...` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      // t9 暂存 `<Box flexDirection="column" padding={1}>{t8}<Text dimColo...` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Box flexDirection="column" padding={1}>{t8}<Text dimColor={true}><Byline><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="cancel" /></Byline></Text></Box>;
      // $[13] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[13];
    }
    // 返回 `t9`，作为终端渲染这次计算的结果。
    return t9;
  }
  // t8 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t8 = [];
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // t10 暂存 `new Set()` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // t9 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t9 = [];
    // t10 暂存 `new Set()` 生成的渲染片段，后续返回路径直接复用。
    t10 = new Set();
    // $[15] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t10;
    // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t9;
  } else {
    // t10 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[15];
    // t9 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[16];
  }
  // t11 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t11 = [];
    // $[17] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[17];
  }
  // t12 暂存 `<Messages messages={displayLog.messages} tools={tools} co...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== conversationId || $[19] !== displayLog.messages) {
    // t12 暂存 `<Messages messages={displayLog.messages} tools={tools} co...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Messages messages={displayLog.messages} tools={tools} commands={t8} verbose={true} toolJSX={null} toolUseConfirmQueue={t9} inProgressToolUseIDs={t10} isMessageSelectorVisible={false} conversationId={conversationId} screen="transcript" streamingToolUses={t11} showAllInTranscript={true} isLoading={false} />;
    // $[18] 缓存 `conversationId`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = conversationId;
    // $[19] 缓存 `displayLog.messages`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = displayLog.messages;
    // $[20] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[20];
  }
  // t13 暂存 `formatRelativeTimeAgo(displayLog.modified)` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== displayLog.modified) {
    // t13 暂存 `formatRelativeTimeAgo(displayLog.modified)` 生成的渲染片段，后续返回路径直接复用。
    t13 = formatRelativeTimeAgo(displayLog.modified);
    // $[21] 缓存 `displayLog.modified`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = displayLog.modified;
    // $[22] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[22];
  }
  // 临时值 t14 命名 `displayLog.gitBranch ? ` · ${displayLog.gitBranch}` : ""`，让后续代码直接表达这个值的用途。
  const t14 = displayLog.gitBranch ? ` · ${displayLog.gitBranch}` : "";
  // t15 暂存 `<Text>{t13} ·{" "}{displayLog.messageCount} messages{t14}...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== displayLog.messageCount || $[24] !== t13 || $[25] !== t14) {
    // t15 暂存 `<Text>{t13} ·{" "}{displayLog.messageCount} messages{t14}...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Text>{t13} ·{" "}{displayLog.messageCount} messages{t14}</Text>;
    // $[23] 缓存 `displayLog.messageCount`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = displayLog.messageCount;
    // $[24] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t13;
    // $[25] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t14;
    // $[26] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[26];
  }
  // t16 暂存 `<Text dimColor={true}><Byline><KeyboardShortcutHint short...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    // t16 暂存 `<Text dimColor={true}><Byline><KeyboardShortcutHint short...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Text dimColor={true}><Byline><KeyboardShortcutHint shortcut="Enter" action="resume" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="cancel" /></Byline></Text>;
    // $[27] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[27];
  }
  // t17 暂存 `<Box flexShrink={0} flexDirection="column" borderTopDimCo...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== t15) {
    // t17 暂存 `<Box flexShrink={0} flexDirection="column" borderTopDimCo...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Box flexShrink={0} flexDirection="column" borderTopDimColor={true} borderBottom={false} borderLeft={false} borderRight={false} borderStyle="single" paddingLeft={2}>{t15}{t16}</Box>;
    // $[28] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t15;
    // $[29] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[29];
  }
  // t18 暂存 `<Box flexDirection="column">{t12}{t17}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== t12 || $[31] !== t17) {
    // t18 暂存 `<Box flexDirection="column">{t12}{t17}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Box flexDirection="column">{t12}{t17}</Box>;
    // $[30] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t12;
    // $[31] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t17;
    // $[32] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[32];
  }
  // 返回 `t18`，作为终端渲染这次计算的结果。
  return t18;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJVVUlEIiwiUmVhY3QiLCJ1c2VDYWxsYmFjayIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwiZ2V0QWxsQmFzZVRvb2xzIiwiTG9nT3B0aW9uIiwiZm9ybWF0UmVsYXRpdmVUaW1lQWdvIiwiZ2V0U2Vzc2lvbklkRnJvbUxvZyIsImlzTGl0ZUxvZyIsImxvYWRGdWxsTG9nIiwiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IiwiQnlsaW5lIiwiS2V5Ym9hcmRTaG9ydGN1dEhpbnQiLCJMb2FkaW5nU3RhdGUiLCJNZXNzYWdlcyIsIlByb3BzIiwibG9nIiwib25FeGl0Iiwib25TZWxlY3QiLCJTZXNzaW9uUHJldmlldyIsInQwIiwiJCIsIl9jIiwiZnVsbExvZyIsInNldEZ1bGxMb2ciLCJ1c2VTdGF0ZSIsInQxIiwidDIiLCJ0aGVuIiwidXNlRWZmZWN0IiwiaXNMb2FkaW5nIiwiZGlzcGxheUxvZyIsInQzIiwiY29udmVyc2F0aW9uSWQiLCJ0NCIsIlN5bWJvbCIsImZvciIsInRvb2xzIiwidDUiLCJjb250ZXh0IiwidDYiLCJoYW5kbGVTZWxlY3QiLCJ0NyIsInQ4IiwidDkiLCJ0MTAiLCJTZXQiLCJ0MTEiLCJ0MTIiLCJtZXNzYWdlcyIsInQxMyIsIm1vZGlmaWVkIiwidDE0IiwiZ2l0QnJhbmNoIiwidDE1IiwibWVzc2FnZUNvdW50IiwidDE2IiwidDE3IiwidDE4Il0sInNvdXJjZXMiOlsiU2Vzc2lvblByZXZpZXcudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVVVJRCB9IGZyb20gJ2NyeXB0bydcbmltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjayB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyBnZXRBbGxCYXNlVG9vbHMgfSBmcm9tICcuLi90b29scy5qcydcbmltcG9ydCB0eXBlIHsgTG9nT3B0aW9uIH0gZnJvbSAnLi4vdHlwZXMvbG9ncy5qcydcbmltcG9ydCB7IGZvcm1hdFJlbGF0aXZlVGltZUFnbyB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB7XG4gIGdldFNlc3Npb25JZEZyb21Mb2csXG4gIGlzTGl0ZUxvZyxcbiAgbG9hZEZ1bGxMb2csXG59IGZyb20gJy4uL3V0aWxzL3Nlc3Npb25TdG9yYWdlLmpzJ1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi9Db25maWd1cmFibGVTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBMb2FkaW5nU3RhdGUgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vTG9hZGluZ1N0YXRlLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZXMgfSBmcm9tICcuL01lc3NhZ2VzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBsb2c6IExvZ09wdGlvblxuICBvbkV4aXQ6ICgpID0+IHZvaWRcbiAgb25TZWxlY3Q6IChsb2c6IExvZ09wdGlvbikgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gU2Vzc2lvblByZXZpZXcoe1xuICBsb2csXG4gIG9uRXhpdCxcbiAgb25TZWxlY3QsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIGZ1bGxMb2cgaG9sZHMgdGhlIGNvbXBsZXRlIGxvZyB3aXRoIG1lc3NhZ2VzIGxvYWRlZC5cbiAgLy8gVGhlIGlucHV0IGBsb2dgIG1heSBiZSBhIFwibGl0ZSBsb2dcIiAoZW1wdHkgbWVzc2FnZXMgYXJyYXkpLFxuICAvLyBzbyB3ZSBsb2FkIHRoZSBmdWxsIG1lc3NhZ2VzIG9uIG1vdW50IGFuZCBzdG9yZSB0aGVtIGhlcmUuXG4gIGNvbnN0IFtmdWxsTG9nLCBzZXRGdWxsTG9nXSA9IFJlYWN0LnVzZVN0YXRlPExvZ09wdGlvbiB8IG51bGw+KG51bGwpXG5cbiAgLy8gTG9hZCBmdWxsIG1lc3NhZ2VzIGlmIHRoaXMgaXMgYSBsaXRlIGxvZ1xuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIHNldEZ1bGxMb2cobnVsbClcbiAgICBpZiAoaXNMaXRlTG9nKGxvZykpIHtcbiAgICAgIHZvaWQgbG9hZEZ1bGxMb2cobG9nKS50aGVuKHNldEZ1bGxMb2cpXG4gICAgfVxuICB9LCBbbG9nXSlcblxuICBjb25zdCBpc0xvYWRpbmcgPSBpc0xpdGVMb2cobG9nKSAmJiBmdWxsTG9nID09PSBudWxsXG4gIGNvbnN0IGRpc3BsYXlMb2cgPSBmdWxsTG9nID8/IGxvZ1xuICBjb25zdCBjb252ZXJzYXRpb25JZCA9IGdldFNlc3Npb25JZEZyb21Mb2coZGlzcGxheUxvZykgfHwgKCcnIGFzIFVVSUQpXG5cbiAgLy8gR2V0IGFsbCBiYXNlIHRvb2xzIGZvciBwcmV2aWV3IChubyBwZXJtaXNzaW9ucyBuZWVkZWQgZm9yIHJlYWQtb25seSB2aWV3KVxuICBjb25zdCB0b29scyA9IGdldEFsbEJhc2VUb29scygpXG5cbiAgLy8gSGFuZGxlIGtleWJvYXJkIGlucHV0IHZpYSBrZXliaW5kaW5nc1xuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgb25FeGl0LCB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0pXG5cbiAgY29uc3QgaGFuZGxlU2VsZWN0ID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIG9uU2VsZWN0KGZ1bGxMb2cgPz8gbG9nKVxuICB9LCBbb25TZWxlY3QsIGZ1bGxMb2csIGxvZ10pXG5cbiAgdXNlS2V5YmluZGluZygnY29uZmlybTp5ZXMnLCBoYW5kbGVTZWxlY3QsIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSlcblxuICAvLyBTaG93IGxvYWRpbmcgc3RhdGUgd2hpbGUgZmV0Y2hpbmcgZnVsbCBsb2dcbiAgaWYgKGlzTG9hZGluZykge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBwYWRkaW5nPXsxfT5cbiAgICAgICAgPExvYWRpbmdTdGF0ZSBtZXNzYWdlPVwiTG9hZGluZyBzZXNzaW9u4oCmXCIgLz5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgPEJ5bGluZT5cbiAgICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgICAgYWN0aW9uPVwiY29uZmlybTpub1wiXG4gICAgICAgICAgICAgIGNvbnRleHQ9XCJDb25maXJtYXRpb25cIlxuICAgICAgICAgICAgICBmYWxsYmFjaz1cIkVzY1wiXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiY2FuY2VsXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9CeWxpbmU+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8TWVzc2FnZXNcbiAgICAgICAgbWVzc2FnZXM9e2Rpc3BsYXlMb2cubWVzc2FnZXN9XG4gICAgICAgIHRvb2xzPXt0b29sc31cbiAgICAgICAgY29tbWFuZHM9e1tdfVxuICAgICAgICB2ZXJib3NlPXt0cnVlfVxuICAgICAgICB0b29sSlNYPXtudWxsfVxuICAgICAgICB0b29sVXNlQ29uZmlybVF1ZXVlPXtbXX1cbiAgICAgICAgaW5Qcm9ncmVzc1Rvb2xVc2VJRHM9e25ldyBTZXQoKX1cbiAgICAgICAgaXNNZXNzYWdlU2VsZWN0b3JWaXNpYmxlPXtmYWxzZX1cbiAgICAgICAgY29udmVyc2F0aW9uSWQ9e2NvbnZlcnNhdGlvbklkfVxuICAgICAgICBzY3JlZW49XCJ0cmFuc2NyaXB0XCJcbiAgICAgICAgc3RyZWFtaW5nVG9vbFVzZXM9e1tdfVxuICAgICAgICBzaG93QWxsSW5UcmFuc2NyaXB0PXt0cnVlfVxuICAgICAgICBpc0xvYWRpbmc9e2ZhbHNlfVxuICAgICAgLz5cbiAgICAgIDxCb3hcbiAgICAgICAgZmxleFNocmluaz17MH1cbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIGJvcmRlclRvcERpbUNvbG9yXG4gICAgICAgIGJvcmRlckJvdHRvbT17ZmFsc2V9XG4gICAgICAgIGJvcmRlckxlZnQ9e2ZhbHNlfVxuICAgICAgICBib3JkZXJSaWdodD17ZmFsc2V9XG4gICAgICAgIGJvcmRlclN0eWxlPVwic2luZ2xlXCJcbiAgICAgICAgcGFkZGluZ0xlZnQ9ezJ9XG4gICAgICA+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHtmb3JtYXRSZWxhdGl2ZVRpbWVBZ28oZGlzcGxheUxvZy5tb2RpZmllZCl9IMK3eycgJ31cbiAgICAgICAgICB7ZGlzcGxheUxvZy5tZXNzYWdlQ291bnR9IG1lc3NhZ2VzXG4gICAgICAgICAge2Rpc3BsYXlMb2cuZ2l0QnJhbmNoID8gYCDCtyAke2Rpc3BsYXlMb2cuZ2l0QnJhbmNofWAgOiAnJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICA8QnlsaW5lPlxuICAgICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiRW50ZXJcIiBhY3Rpb249XCJyZXN1bWVcIiAvPlxuICAgICAgICAgICAgPENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludFxuICAgICAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICAgICAgY29udGV4dD1cIkNvbmZpcm1hdGlvblwiXG4gICAgICAgICAgICAgIGZhbGxiYWNrPVwiRXNjXCJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb249XCJjYW5jZWxcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0J5bGluZT5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLElBQUksUUFBUSxRQUFRO0FBQ2xDLE9BQU9DLEtBQUssSUFBSUMsV0FBVyxRQUFRLE9BQU87QUFDMUMsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUNyQyxTQUFTQyxhQUFhLFFBQVEsaUNBQWlDO0FBQy9ELFNBQVNDLGVBQWUsUUFBUSxhQUFhO0FBQzdDLGNBQWNDLFNBQVMsUUFBUSxrQkFBa0I7QUFDakQsU0FBU0MscUJBQXFCLFFBQVEsb0JBQW9CO0FBQzFELFNBQ0VDLG1CQUFtQixFQUNuQkMsU0FBUyxFQUNUQyxXQUFXLFFBQ04sNEJBQTRCO0FBQ25DLFNBQVNDLHdCQUF3QixRQUFRLCtCQUErQjtBQUN4RSxTQUFTQyxNQUFNLFFBQVEsMkJBQTJCO0FBQ2xELFNBQVNDLG9CQUFvQixRQUFRLHlDQUF5QztBQUM5RSxTQUFTQyxZQUFZLFFBQVEsaUNBQWlDO0FBQzlELFNBQVNDLFFBQVEsUUFBUSxlQUFlO0FBRXhDLEtBQUtDLEtBQUssR0FBRztFQUNYQyxHQUFHLEVBQUVYLFNBQVM7RUFDZFksTUFBTSxFQUFFLEdBQUcsR0FBRyxJQUFJO0VBQ2xCQyxRQUFRLEVBQUUsQ0FBQ0YsR0FBRyxFQUFFWCxTQUFTLEVBQUUsR0FBRyxJQUFJO0FBQ3BDLENBQUM7QUFFRCxPQUFPLFNBQUFjLGVBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBd0I7SUFBQU4sR0FBQTtJQUFBQyxNQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFJdkI7RUFJTixPQUFBRyxPQUFBLEVBQUFDLFVBQUEsSUFBOEJ6QixLQUFLLENBQUEwQixRQUFTLENBQW1CLElBQUksQ0FBQztFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxRQUFBTCxHQUFBO0lBR3BEVSxFQUFBLEdBQUFBLENBQUE7TUFDZEYsVUFBVSxDQUFDLElBQUksQ0FBQztNQUNoQixJQUFJaEIsU0FBUyxDQUFDUSxHQUFHLENBQUM7UUFDWFAsV0FBVyxDQUFDTyxHQUFHLENBQUMsQ0FBQVksSUFBSyxDQUFDSixVQUFVLENBQUM7TUFBQTtJQUN2QyxDQUNGO0lBQUVHLEVBQUEsSUFBQ1gsR0FBRyxDQUFDO0lBQUFLLENBQUEsTUFBQUwsR0FBQTtJQUFBSyxDQUFBLE1BQUFLLEVBQUE7SUFBQUwsQ0FBQSxNQUFBTSxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBTCxDQUFBO0lBQUFNLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBTFJ0QixLQUFLLENBQUE4QixTQUFVLENBQUNILEVBS2YsRUFBRUMsRUFBSyxDQUFDO0VBRVQsTUFBQUcsU0FBQSxHQUFrQnRCLFNBQVMsQ0FBQ1EsR0FBdUIsQ0FBQyxJQUFoQk8sT0FBTyxLQUFLLElBQUk7RUFDcEQsTUFBQVEsVUFBQSxHQUFtQlIsT0FBYyxJQUFkUCxHQUFjO0VBQUEsSUFBQWdCLEVBQUE7RUFBQSxJQUFBWCxDQUFBLFFBQUFVLFVBQUE7SUFDVkMsRUFBQSxHQUFBekIsbUJBQW1CLENBQUN3QixVQUEwQixDQUFDLElBQVgsRUFBRSxJQUFJakMsSUFBSztJQUFBdUIsQ0FBQSxNQUFBVSxVQUFBO0lBQUFWLENBQUEsTUFBQVcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVgsQ0FBQTtFQUFBO0VBQXRFLE1BQUFZLGNBQUEsR0FBdUJELEVBQStDO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFiLENBQUEsUUFBQWMsTUFBQSxDQUFBQyxHQUFBO0lBR3hERixFQUFBLEdBQUE5QixlQUFlLENBQUMsQ0FBQztJQUFBaUIsQ0FBQSxNQUFBYSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBYixDQUFBO0VBQUE7RUFBL0IsTUFBQWdCLEtBQUEsR0FBY0gsRUFBaUI7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQWpCLENBQUEsUUFBQWMsTUFBQSxDQUFBQyxHQUFBO0lBR0tFLEVBQUE7TUFBQUMsT0FBQSxFQUFXO0lBQWUsQ0FBQztJQUFBbEIsQ0FBQSxNQUFBaUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWpCLENBQUE7RUFBQTtFQUEvRGxCLGFBQWEsQ0FBQyxZQUFZLEVBQUVjLE1BQU0sRUFBRXFCLEVBQTJCLENBQUM7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQW5CLENBQUEsUUFBQUUsT0FBQSxJQUFBRixDQUFBLFFBQUFMLEdBQUEsSUFBQUssQ0FBQSxRQUFBSCxRQUFBO0lBRS9Cc0IsRUFBQSxHQUFBQSxDQUFBO01BQy9CdEIsUUFBUSxDQUFDSyxPQUFjLElBQWRQLEdBQWMsQ0FBQztJQUFBLENBQ3pCO0lBQUFLLENBQUEsTUFBQUUsT0FBQTtJQUFBRixDQUFBLE1BQUFMLEdBQUE7SUFBQUssQ0FBQSxNQUFBSCxRQUFBO0lBQUFHLENBQUEsT0FBQW1CLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFuQixDQUFBO0VBQUE7RUFGRCxNQUFBb0IsWUFBQSxHQUFxQkQsRUFFTztFQUFBLElBQUFFLEVBQUE7RUFBQSxJQUFBckIsQ0FBQSxTQUFBYyxNQUFBLENBQUFDLEdBQUE7SUFFZU0sRUFBQTtNQUFBSCxPQUFBLEVBQVc7SUFBZSxDQUFDO0lBQUFsQixDQUFBLE9BQUFxQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBckIsQ0FBQTtFQUFBO0VBQXRFbEIsYUFBYSxDQUFDLGFBQWEsRUFBRXNDLFlBQVksRUFBRUMsRUFBMkIsQ0FBQztFQUd2RSxJQUFJWixTQUFTO0lBQUEsSUFBQWEsRUFBQTtJQUFBLElBQUF0QixDQUFBLFNBQUFjLE1BQUEsQ0FBQUMsR0FBQTtNQUdQTyxFQUFBLElBQUMsWUFBWSxDQUFTLE9BQWtCLENBQWxCLHdCQUFpQixDQUFDLEdBQUc7TUFBQXRCLENBQUEsT0FBQXNCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUF0QixDQUFBO0lBQUE7SUFBQSxJQUFBdUIsRUFBQTtJQUFBLElBQUF2QixDQUFBLFNBQUFjLE1BQUEsQ0FBQUMsR0FBQTtNQUQ3Q1EsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFVLE9BQUMsQ0FBRCxHQUFDLENBQ3BDLENBQUFELEVBQTBDLENBQzFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWixDQUFDLE1BQU0sQ0FDTCxDQUFDLHdCQUF3QixDQUNoQixNQUFZLENBQVosWUFBWSxDQUNYLE9BQWMsQ0FBZCxjQUFjLENBQ2IsUUFBSyxDQUFMLEtBQUssQ0FDRixXQUFRLENBQVIsUUFBUSxHQUV4QixFQVBDLE1BQU0sQ0FRVCxFQVRDLElBQUksQ0FVUCxFQVpDLEdBQUcsQ0FZRTtNQUFBdEIsQ0FBQSxPQUFBdUIsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQXZCLENBQUE7SUFBQTtJQUFBLE9BWk51QixFQVlNO0VBQUE7RUFFVCxJQUFBRCxFQUFBO0VBQUEsSUFBQXRCLENBQUEsU0FBQWMsTUFBQSxDQUFBQyxHQUFBO0lBT2VPLEVBQUEsS0FBRTtJQUFBdEIsQ0FBQSxPQUFBc0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXRCLENBQUE7RUFBQTtFQUFBLElBQUF3QixHQUFBO0VBQUEsSUFBQUQsRUFBQTtFQUFBLElBQUF2QixDQUFBLFNBQUFjLE1BQUEsQ0FBQUMsR0FBQTtJQUdTUSxFQUFBLEtBQUU7SUFDREMsR0FBQSxPQUFJQyxHQUFHLENBQUMsQ0FBQztJQUFBekIsQ0FBQSxPQUFBd0IsR0FBQTtJQUFBeEIsQ0FBQSxPQUFBdUIsRUFBQTtFQUFBO0lBQUFDLEdBQUEsR0FBQXhCLENBQUE7SUFBQXVCLEVBQUEsR0FBQXZCLENBQUE7RUFBQTtFQUFBLElBQUEwQixHQUFBO0VBQUEsSUFBQTFCLENBQUEsU0FBQWMsTUFBQSxDQUFBQyxHQUFBO0lBSVpXLEdBQUEsS0FBRTtJQUFBMUIsQ0FBQSxPQUFBMEIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTFCLENBQUE7RUFBQTtFQUFBLElBQUEyQixHQUFBO0VBQUEsSUFBQTNCLENBQUEsU0FBQVksY0FBQSxJQUFBWixDQUFBLFNBQUFVLFVBQUEsQ0FBQWtCLFFBQUE7SUFYdkJELEdBQUEsSUFBQyxRQUFRLENBQ0csUUFBbUIsQ0FBbkIsQ0FBQWpCLFVBQVUsQ0FBQWtCLFFBQVEsQ0FBQyxDQUN0QlosS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDRixRQUFFLENBQUYsQ0FBQU0sRUFBQyxDQUFDLENBQ0gsT0FBSSxDQUFKLEtBQUcsQ0FBQyxDQUNKLE9BQUksQ0FBSixLQUFHLENBQUMsQ0FDUSxtQkFBRSxDQUFGLENBQUFDLEVBQUMsQ0FBQyxDQUNELG9CQUFTLENBQVQsQ0FBQUMsR0FBUSxDQUFDLENBQ0wsd0JBQUssQ0FBTCxNQUFJLENBQUMsQ0FDZlosY0FBYyxDQUFkQSxlQUFhLENBQUMsQ0FDdkIsTUFBWSxDQUFaLFlBQVksQ0FDQSxpQkFBRSxDQUFGLENBQUFjLEdBQUMsQ0FBQyxDQUNBLG1CQUFJLENBQUosS0FBRyxDQUFDLENBQ2QsU0FBSyxDQUFMLE1BQUksQ0FBQyxHQUNoQjtJQUFBMUIsQ0FBQSxPQUFBWSxjQUFBO0lBQUFaLENBQUEsT0FBQVUsVUFBQSxDQUFBa0IsUUFBQTtJQUFBNUIsQ0FBQSxPQUFBMkIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTNCLENBQUE7RUFBQTtFQUFBLElBQUE2QixHQUFBO0VBQUEsSUFBQTdCLENBQUEsU0FBQVUsVUFBQSxDQUFBb0IsUUFBQTtJQVlHRCxHQUFBLEdBQUE1QyxxQkFBcUIsQ0FBQ3lCLFVBQVUsQ0FBQW9CLFFBQVMsQ0FBQztJQUFBOUIsQ0FBQSxPQUFBVSxVQUFBLENBQUFvQixRQUFBO0lBQUE5QixDQUFBLE9BQUE2QixHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBN0IsQ0FBQTtFQUFBO0VBRTFDLE1BQUErQixHQUFBLEdBQUFyQixVQUFVLENBQUFzQixTQUE4QyxHQUF4RCxNQUE2QnRCLFVBQVUsQ0FBQXNCLFNBQVUsRUFBTyxHQUF4RCxFQUF3RDtFQUFBLElBQUFDLEdBQUE7RUFBQSxJQUFBakMsQ0FBQSxTQUFBVSxVQUFBLENBQUF3QixZQUFBLElBQUFsQyxDQUFBLFNBQUE2QixHQUFBLElBQUE3QixDQUFBLFNBQUErQixHQUFBO0lBSDNERSxHQUFBLElBQUMsSUFBSSxDQUNGLENBQUFKLEdBQXlDLENBQUUsRUFBRyxJQUFFLENBQ2hELENBQUFuQixVQUFVLENBQUF3QixZQUFZLENBQUUsU0FDeEIsQ0FBQUgsR0FBdUQsQ0FDMUQsRUFKQyxJQUFJLENBSUU7SUFBQS9CLENBQUEsT0FBQVUsVUFBQSxDQUFBd0IsWUFBQTtJQUFBbEMsQ0FBQSxPQUFBNkIsR0FBQTtJQUFBN0IsQ0FBQSxPQUFBK0IsR0FBQTtJQUFBL0IsQ0FBQSxPQUFBaUMsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQWpDLENBQUE7RUFBQTtFQUFBLElBQUFtQyxHQUFBO0VBQUEsSUFBQW5DLENBQUEsU0FBQWMsTUFBQSxDQUFBQyxHQUFBO0lBQ1BvQixHQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWixDQUFDLE1BQU0sQ0FDTCxDQUFDLG9CQUFvQixDQUFVLFFBQU8sQ0FBUCxPQUFPLENBQVEsTUFBUSxDQUFSLFFBQVEsR0FDdEQsQ0FBQyx3QkFBd0IsQ0FDaEIsTUFBWSxDQUFaLFlBQVksQ0FDWCxPQUFjLENBQWQsY0FBYyxDQUNiLFFBQUssQ0FBTCxLQUFLLENBQ0YsV0FBUSxDQUFSLFFBQVEsR0FFeEIsRUFSQyxNQUFNLENBU1QsRUFWQyxJQUFJLENBVUU7SUFBQW5DLENBQUEsT0FBQW1DLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFuQyxDQUFBO0VBQUE7RUFBQSxJQUFBb0MsR0FBQTtFQUFBLElBQUFwQyxDQUFBLFNBQUFpQyxHQUFBO0lBekJURyxHQUFBLElBQUMsR0FBRyxDQUNVLFVBQUMsQ0FBRCxHQUFDLENBQ0MsYUFBUSxDQUFSLFFBQVEsQ0FDdEIsaUJBQWlCLENBQWpCLEtBQWdCLENBQUMsQ0FDSCxZQUFLLENBQUwsTUFBSSxDQUFDLENBQ1AsVUFBSyxDQUFMLE1BQUksQ0FBQyxDQUNKLFdBQUssQ0FBTCxNQUFJLENBQUMsQ0FDTixXQUFRLENBQVIsUUFBUSxDQUNQLFdBQUMsQ0FBRCxHQUFDLENBRWQsQ0FBQUgsR0FJTSxDQUNOLENBQUFFLEdBVU0sQ0FDUixFQTFCQyxHQUFHLENBMEJFO0lBQUFuQyxDQUFBLE9BQUFpQyxHQUFBO0lBQUFqQyxDQUFBLE9BQUFvQyxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBcEMsQ0FBQTtFQUFBO0VBQUEsSUFBQXFDLEdBQUE7RUFBQSxJQUFBckMsQ0FBQSxTQUFBMkIsR0FBQSxJQUFBM0IsQ0FBQSxTQUFBb0MsR0FBQTtJQTFDUkMsR0FBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUN6QixDQUFBVixHQWNDLENBQ0QsQ0FBQVMsR0EwQkssQ0FDUCxFQTNDQyxHQUFHLENBMkNFO0lBQUFwQyxDQUFBLE9BQUEyQixHQUFBO0lBQUEzQixDQUFBLE9BQUFvQyxHQUFBO0lBQUFwQyxDQUFBLE9BQUFxQyxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBckMsQ0FBQTtFQUFBO0VBQUEsT0EzQ05xQyxHQTJDTTtBQUFBIiwiaWdub3JlTGlzdCI6W119
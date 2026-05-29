// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 KeyboardShortcutHint 终端界面组件，避免在这里重复拼装显示逻辑。
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js';
// 复用 FallbackToolUseErrorMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 复用 ShellProgressMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { ShellProgressMessage } from '../../components/shell/ShellProgressMessage.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 引入 useShortcutDisplay，将 ../../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
// 引入 useAppStateStore、useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppStateStore, useSetAppState } from '../../state/AppState.js';
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js';
// 引入 backgroundAll，将 ../../tasks/LocalShellTask/LocalShellTask.js 中已经封装好的能力接到本文件流程里。
import { backgroundAll } from '../../tasks/LocalShellTask/LocalShellTask.js';
// 类型依赖 { ProgressMessage } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { ProgressMessage } from '../../types/message.js';
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js';
// 复用 getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getDisplayPath } from '../../utils/file.js';
// 复用 isFullscreenEnvEnabled 工具函数，把通用处理留在 ../../utils/fullscreen.js 中维护。
import { isFullscreenEnvEnabled } from '../../utils/fullscreen.js';
// 类型依赖 { ThemeName } 来自 ../../utils/theme.js，用于校准工具调用的数据契约。
import type { ThemeName } from '../../utils/theme.js';
// 类型依赖 { BashProgress, BashToolInput, Out } 来自 ./BashTool.js，用于校准工具调用的数据契约。
import type { BashProgress, BashToolInput, Out } from './BashTool.js';
// 引入 BashToolResultMessage，将 ./BashToolResultMessage.js 中已经封装好的能力接到本文件流程里。
import BashToolResultMessage from './BashToolResultMessage.js';
// 引入 extractBashCommentLabel，将 ./commentLabel.js 中已经封装好的能力接到本文件流程里。
import { extractBashCommentLabel } from './commentLabel.js';
// 引入 parseSedEditCommand，将 ./sedEditParser.js 中已经封装好的能力接到本文件流程里。
import { parseSedEditCommand } from './sedEditParser.js';

// Constants for command display
// MAX_COMMAND_DISPLAY_LINES 命令数据保存`2`，供Bash 工具 UI后续判断或输出使用。
const MAX_COMMAND_DISPLAY_LINES = 2;
// MAX_COMMAND_DISPLAY_CHARS 命令数据 命名 `160`，让后续代码直接表达这个值的用途。
const MAX_COMMAND_DISPLAY_CHARS = 160;

// Simple component to show background hint and handle ctrl+b
// When ctrl+b is pressed, backgrounds ALL running foreground commands
// BackgroundHint 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function BackgroundHint(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(9);
  // t1 暂存 `t0 === undefined ? {} : t0` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // t1 暂存 `t0 === undefined ? {} : t0` 生成的渲染片段，后续返回路径直接复用。
    t1 = t0 === undefined ? {} : t0;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onBackground
  } = t1;
  // store保存`useAppStateStore`，供工具调用后续处理使用。
  const store = useAppStateStore();
  // setAppState 状态保存`useSetAppState`，供工具调用后续处理使用。
  const setAppState = useSetAppState();
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onBackground || $[3] !== setAppState || $[4] !== store) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 调用 backgroundAll，触发工具调用此处需要的副作用。
      backgroundAll(() => store.getState(), setAppState);
      // 调用 onBackground?.();，完成这一处局部操作。
      onBackground?.();
    };
    // $[2] 缓存 `onBackground`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onBackground;
    // $[3] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = setAppState;
    // $[4] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = store;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // handleBackground沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleBackground = t2;
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      context: "Task"
    };
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // 调用 useKeybinding，触发工具调用此处需要的副作用。
  useKeybinding("task:background", handleBackground, t3);
  // baseShortcut保存`useShortcutDisplay`，供工具调用后续处理使用。
  const baseShortcut = useShortcutDisplay("task:background", "Task", "ctrl+b");
  // shortcut保存`b`，供工具调用后续处理使用。
  const shortcut = env.terminal === "tmux" && baseShortcut === "ctrl+b" ? "ctrl+b ctrl+b (twice)" : baseShortcut;
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)` 时，工具调用执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // t4 暂存 `<Box paddingLeft={5}><Text dimColor={true}><KeyboardShort...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== shortcut) {
    // t4 暂存 `<Box paddingLeft={5}><Text dimColor={true}><KeyboardShort...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box paddingLeft={5}><Text dimColor={true}><KeyboardShortcutHint shortcut={shortcut} action="run in background" parens={true} /></Text></Box>;
    // $[7] 缓存 `shortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = shortcut;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // 返回 `t4`，作为工具调用这次计算的结果。
  return t4;
}
// renderToolUseMessage 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(input: Partial<BashToolInput>, {
  verbose,
  theme: _theme
}: {
  verbose: boolean;
  theme: ThemeName;
}): React.ReactNode {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    command
  } = input;
  // 命令缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!command) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }

  // Render sed in-place edits like file edits (show file path only)
  // sed 替换信息解析`parseSedEditCommand`，供工具调用后续处理使用。
  const sedInfo = parseSedEditCommand(command);
  // 满足 `sedInfo` 时，工具调用执行该分支。
  if (sedInfo) {
    // 返回 `verbose ? sedInfo.filePath : getDisplayPath(sedInfo.filePath)`，作为工具调用这次计算的结果。
    return verbose ? sedInfo.filePath : getDisplayPath(sedInfo.filePath);
  }
  // verbose缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!verbose) {
    // 文本行格式化`command.split`，供工具调用后续处理使用。
    const lines = command.split('\n');
    // 满足 `isFullscreenEnvEnabled()` 时，工具调用执行该分支。
    if (isFullscreenEnvEnabled()) {
      // label保存`extractBashCommentLabel`，供工具调用后续处理使用。
      const label = extractBashCommentLabel(command);
      // 满足 `label` 时，工具调用执行该分支。
      if (label) {
        // 返回 `label.length > MAX_COMMAND_DISPLAY_CHARS ? label.slice(0, MAX_COMMAND_D...`，作为工具调用这次计算的结果。
        return label.length > MAX_COMMAND_DISPLAY_CHARS ? label.slice(0, MAX_COMMAND_DISPLAY_CHARS) + '…' : label;
      }
    }
    // needsLineTruncation标记Bash 工具 UI是否启用对应路径。
    const needsLineTruncation = lines.length > MAX_COMMAND_DISPLAY_LINES;
    // needsCharTruncation标记Bash 工具 UI是否启用对应路径。
    const needsCharTruncation = command.length > MAX_COMMAND_DISPLAY_CHARS;
    // 只有 `needsLineTruncation || needsCharTruncation` 满足时，工具调用才执行该分支。
    if (needsLineTruncation || needsCharTruncation) {
      // truncated 命名 `command`，让后续代码直接表达这个值的用途。
      let truncated = command;

      // First truncate by lines if needed
      // 满足 `needsLineTruncation` 时，工具调用执行该分支。
      if (needsLineTruncation) {
        // truncated更新为 `lines.slice(0, MAX_COMMAND_DISPLAY_LINES).join('\n')`，确保Bash 工具后续读取最新状态。
        truncated = lines.slice(0, MAX_COMMAND_DISPLAY_LINES).join('\n');
      }

      // Then truncate by chars if still too long
      // 满足 `truncated.length > MAX_COMMAND_DISPLAY_CHARS` 时，工具调用执行该分支。
      if (truncated.length > MAX_COMMAND_DISPLAY_CHARS) {
        // truncated更新为 `truncated.slice(0, MAX_COMMAND_DISPLAY_CHARS)`，确保Bash 工具后续读取最新状态。
        truncated = truncated.slice(0, MAX_COMMAND_DISPLAY_CHARS);
      }
      // 返回 `<Text>{truncated.trim()}…</Text>`，作为工具调用这次计算的结果。
      return <Text>{truncated.trim()}…</Text>;
    }
  }
  // 返回 `command`，作为工具调用这次计算的结果。
  return command;
}
// renderToolUseProgressMessage 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseProgressMessage(progressMessagesForMessage: ProgressMessage<BashProgress>[], {
  verbose,
  tools: _tools,
  terminalSize: _terminalSize,
  inProgressToolCallCount: _inProgressToolCallCount
}: {
  tools: Tool[];
  verbose: boolean;
  terminalSize?: {
    columns: number;
    rows: number;
  };
  inProgressToolCallCount?: number;
}): React.ReactNode {
  // lastProgress 集合保存`progressMessagesForMessage.at`，供工具调用后续处理使用。
  const lastProgress = progressMessagesForMessage.at(-1);
  // 只有 `!lastProgress || !lastProgress.data` 满足时，工具调用才执行该分支。
  if (!lastProgress || !lastProgress.data) {
    // 返回 `<MessageResponse height={1}>`，作为工具调用这次计算的结果。
    return <MessageResponse height={1}>
        <Text dimColor>Running…</Text>
      </MessageResponse>;
  }
  // data保存`lastProgress.data`，供后续判断或组装使用。
  const data = lastProgress.data;
  // 返回 `<ShellProgressMessage fullOutput={data.fullOutput} output={data.output}...`，作为工具调用这次计算的结果。
  return <ShellProgressMessage fullOutput={data.fullOutput} output={data.output} elapsedTimeSeconds={data.elapsedTimeSeconds} totalLines={data.totalLines} totalBytes={data.totalBytes} timeoutMs={data.timeoutMs} taskId={data.taskId} verbose={verbose} />;
}
// renderToolUseQueuedMessage 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseQueuedMessage(): React.ReactNode {
  // 返回 `<MessageResponse height={1}>`，作为工具调用这次计算的结果。
  return <MessageResponse height={1}>
      <Text dimColor>Waiting…</Text>
    </MessageResponse>;
}
// renderToolResultMessage 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(content: Out, progressMessagesForMessage: ProgressMessage<BashProgress>[], {
  verbose,
  theme: _theme,
  tools: _tools,
  style: _style
}: {
  verbose: boolean;
  theme: ThemeName;
  tools: Tool[];
  style?: 'condensed';
}): React.ReactNode {
  // lastProgress 集合保存`progressMessagesForMessage.at`，供工具调用后续处理使用。
  const lastProgress = progressMessagesForMessage.at(-1);
  // timeoutMs 集合保存`lastProgress?.data?.timeoutMs`，供后续判断或组装使用。
  const timeoutMs = lastProgress?.data?.timeoutMs;
  // 返回 `<BashToolResultMessage content={content} verbose={verbose} timeoutMs={t...`，作为工具调用这次计算的结果。
  return <BashToolResultMessage content={content} verbose={verbose} timeoutMs={timeoutMs} />;
}
// renderToolUseErrorMessage 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseErrorMessage(result: ToolResultBlockParam['content'], {
  verbose,
  progressMessagesForMessage: _progressMessagesForMessage,
  tools: _tools
}: {
  verbose: boolean;
  progressMessagesForMessage: ProgressMessage<BashProgress>[];
  tools: Tool[];
}): React.ReactNode {
  // 返回 `<FallbackToolUseErrorMessage result={result} verbose={verbose} />`，作为工具调用这次计算的结果。
  return <FallbackToolUseErrorMessage result={result} verbose={verbose} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlJlYWN0IiwiS2V5Ym9hcmRTaG9ydGN1dEhpbnQiLCJGYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UiLCJNZXNzYWdlUmVzcG9uc2UiLCJTaGVsbFByb2dyZXNzTWVzc2FnZSIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwidXNlU2hvcnRjdXREaXNwbGF5IiwidXNlQXBwU3RhdGVTdG9yZSIsInVzZVNldEFwcFN0YXRlIiwiVG9vbCIsImJhY2tncm91bmRBbGwiLCJQcm9ncmVzc01lc3NhZ2UiLCJlbnYiLCJpc0VudlRydXRoeSIsImdldERpc3BsYXlQYXRoIiwiaXNGdWxsc2NyZWVuRW52RW5hYmxlZCIsIlRoZW1lTmFtZSIsIkJhc2hQcm9ncmVzcyIsIkJhc2hUb29sSW5wdXQiLCJPdXQiLCJCYXNoVG9vbFJlc3VsdE1lc3NhZ2UiLCJleHRyYWN0QmFzaENvbW1lbnRMYWJlbCIsInBhcnNlU2VkRWRpdENvbW1hbmQiLCJNQVhfQ09NTUFORF9ESVNQTEFZX0xJTkVTIiwiTUFYX0NPTU1BTkRfRElTUExBWV9DSEFSUyIsIkJhY2tncm91bmRIaW50IiwidDAiLCIkIiwiX2MiLCJ0MSIsInVuZGVmaW5lZCIsIm9uQmFja2dyb3VuZCIsInN0b3JlIiwic2V0QXBwU3RhdGUiLCJ0MiIsImdldFN0YXRlIiwiaGFuZGxlQmFja2dyb3VuZCIsInQzIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsImJhc2VTaG9ydGN1dCIsInNob3J0Y3V0IiwidGVybWluYWwiLCJwcm9jZXNzIiwiQ0xBVURFX0NPREVfRElTQUJMRV9CQUNLR1JPVU5EX1RBU0tTIiwidDQiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsImlucHV0IiwiUGFydGlhbCIsInZlcmJvc2UiLCJ0aGVtZSIsIl90aGVtZSIsIlJlYWN0Tm9kZSIsImNvbW1hbmQiLCJzZWRJbmZvIiwiZmlsZVBhdGgiLCJsaW5lcyIsInNwbGl0IiwibGFiZWwiLCJsZW5ndGgiLCJzbGljZSIsIm5lZWRzTGluZVRydW5jYXRpb24iLCJuZWVkc0NoYXJUcnVuY2F0aW9uIiwidHJ1bmNhdGVkIiwiam9pbiIsInRyaW0iLCJyZW5kZXJUb29sVXNlUHJvZ3Jlc3NNZXNzYWdlIiwicHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UiLCJ0b29scyIsIl90b29scyIsInRlcm1pbmFsU2l6ZSIsIl90ZXJtaW5hbFNpemUiLCJpblByb2dyZXNzVG9vbENhbGxDb3VudCIsIl9pblByb2dyZXNzVG9vbENhbGxDb3VudCIsImNvbHVtbnMiLCJyb3dzIiwibGFzdFByb2dyZXNzIiwiYXQiLCJkYXRhIiwiZnVsbE91dHB1dCIsIm91dHB1dCIsImVsYXBzZWRUaW1lU2Vjb25kcyIsInRvdGFsTGluZXMiLCJ0b3RhbEJ5dGVzIiwidGltZW91dE1zIiwidGFza0lkIiwicmVuZGVyVG9vbFVzZVF1ZXVlZE1lc3NhZ2UiLCJyZW5kZXJUb29sUmVzdWx0TWVzc2FnZSIsImNvbnRlbnQiLCJzdHlsZSIsIl9zdHlsZSIsInJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UiLCJyZXN1bHQiLCJfcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UiXSwic291cmNlcyI6WyJVSS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUb29sUmVzdWx0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgRmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9GYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IFNoZWxsUHJvZ3Jlc3NNZXNzYWdlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9zaGVsbC9TaGVsbFByb2dyZXNzTWVzc2FnZS5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHsgdXNlU2hvcnRjdXREaXNwbGF5IH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlU2hvcnRjdXREaXNwbGF5LmpzJ1xuaW1wb3J0IHsgdXNlQXBwU3RhdGVTdG9yZSwgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgVG9vbCB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgeyBiYWNrZ3JvdW5kQWxsIH0gZnJvbSAnLi4vLi4vdGFza3MvTG9jYWxTaGVsbFRhc2svTG9jYWxTaGVsbFRhc2suanMnXG5pbXBvcnQgdHlwZSB7IFByb2dyZXNzTWVzc2FnZSB9IGZyb20gJy4uLy4uL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQgeyBlbnYgfSBmcm9tICcuLi8uLi91dGlscy9lbnYuanMnXG5pbXBvcnQgeyBpc0VudlRydXRoeSB9IGZyb20gJy4uLy4uL3V0aWxzL2VudlV0aWxzLmpzJ1xuaW1wb3J0IHsgZ2V0RGlzcGxheVBhdGggfSBmcm9tICcuLi8uLi91dGlscy9maWxlLmpzJ1xuaW1wb3J0IHsgaXNGdWxsc2NyZWVuRW52RW5hYmxlZCB9IGZyb20gJy4uLy4uL3V0aWxzL2Z1bGxzY3JlZW4uanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lTmFtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHR5cGUgeyBCYXNoUHJvZ3Jlc3MsIEJhc2hUb29sSW5wdXQsIE91dCB9IGZyb20gJy4vQmFzaFRvb2wuanMnXG5pbXBvcnQgQmFzaFRvb2xSZXN1bHRNZXNzYWdlIGZyb20gJy4vQmFzaFRvb2xSZXN1bHRNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgZXh0cmFjdEJhc2hDb21tZW50TGFiZWwgfSBmcm9tICcuL2NvbW1lbnRMYWJlbC5qcydcbmltcG9ydCB7IHBhcnNlU2VkRWRpdENvbW1hbmQgfSBmcm9tICcuL3NlZEVkaXRQYXJzZXIuanMnXG5cbi8vIENvbnN0YW50cyBmb3IgY29tbWFuZCBkaXNwbGF5XG5jb25zdCBNQVhfQ09NTUFORF9ESVNQTEFZX0xJTkVTID0gMlxuY29uc3QgTUFYX0NPTU1BTkRfRElTUExBWV9DSEFSUyA9IDE2MFxuXG4vLyBTaW1wbGUgY29tcG9uZW50IHRvIHNob3cgYmFja2dyb3VuZCBoaW50IGFuZCBoYW5kbGUgY3RybCtiXG4vLyBXaGVuIGN0cmwrYiBpcyBwcmVzc2VkLCBiYWNrZ3JvdW5kcyBBTEwgcnVubmluZyBmb3JlZ3JvdW5kIGNvbW1hbmRzXG5leHBvcnQgZnVuY3Rpb24gQmFja2dyb3VuZEhpbnQoe1xuICBvbkJhY2tncm91bmQsXG59OiB7XG4gIG9uQmFja2dyb3VuZD86ICgpID0+IHZvaWRcbn0gPSB7fSk6IFJlYWN0LlJlYWN0RWxlbWVudCB8IG51bGwge1xuICBjb25zdCBzdG9yZSA9IHVzZUFwcFN0YXRlU3RvcmUoKVxuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcblxuICAvLyBIYW5kbGVyIGZvciB0YXNrOmJhY2tncm91bmQgLSBiYWNrZ3JvdW5kIGFsbCBmb3JlZ3JvdW5kIHRhc2tzXG4gIGNvbnN0IGhhbmRsZUJhY2tncm91bmQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgLy8gQmFja2dyb3VuZCBBTEwgZm9yZWdyb3VuZCBiYXNoIHRhc2tzXG4gICAgYmFja2dyb3VuZEFsbCgoKSA9PiBzdG9yZS5nZXRTdGF0ZSgpLCBzZXRBcHBTdGF0ZSlcbiAgICAvLyBBbHNvIGNhbGwgdGhlIG9wdGlvbmFsIGNhbGxiYWNrICh1c2VkIGZvciBub24tYmFzaCB0YXNrcyBsaWtlIGFnZW50cylcbiAgICBvbkJhY2tncm91bmQ/LigpXG4gIH0sIFtzdG9yZSwgc2V0QXBwU3RhdGUsIG9uQmFja2dyb3VuZF0pXG5cbiAgdXNlS2V5YmluZGluZygndGFzazpiYWNrZ3JvdW5kJywgaGFuZGxlQmFja2dyb3VuZCwge1xuICAgIGNvbnRleHQ6ICdUYXNrJyxcbiAgfSlcblxuICAvLyBHZXQgdGhlIGNvbmZpZ3VyZWQgc2hvcnRjdXQgZm9yIHRhc2s6YmFja2dyb3VuZFxuICBjb25zdCBiYXNlU2hvcnRjdXQgPSB1c2VTaG9ydGN1dERpc3BsYXkoJ3Rhc2s6YmFja2dyb3VuZCcsICdUYXNrJywgJ2N0cmwrYicpXG4gIC8vIEluIHRtdXgsIGN0cmwrYiBpcyB0aGUgcHJlZml4IGtleSwgc28gdXNlcnMgbmVlZCB0byBwcmVzcyBpdCB0d2ljZSB0byBzZW5kIGN0cmwrYlxuICBjb25zdCBzaG9ydGN1dCA9XG4gICAgZW52LnRlcm1pbmFsID09PSAndG11eCcgJiYgYmFzZVNob3J0Y3V0ID09PSAnY3RybCtiJ1xuICAgICAgPyAnY3RybCtiIGN0cmwrYiAodHdpY2UpJ1xuICAgICAgOiBiYXNlU2hvcnRjdXRcblxuICAvLyBEb24ndCBzaG93IGJhY2tncm91bmQgaGludCBpZiBiYWNrZ3JvdW5kIHRhc2tzIGFyZSBkaXNhYmxlZFxuICBpZiAoaXNFbnZUcnV0aHkocHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfRElTQUJMRV9CQUNLR1JPVU5EX1RBU0tTKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezV9PlxuICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludFxuICAgICAgICAgIHNob3J0Y3V0PXtzaG9ydGN1dH1cbiAgICAgICAgICBhY3Rpb249XCJydW4gaW4gYmFja2dyb3VuZFwiXG4gICAgICAgICAgcGFyZW5zXG4gICAgICAgIC8+XG4gICAgICA8L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VNZXNzYWdlKFxuICBpbnB1dDogUGFydGlhbDxCYXNoVG9vbElucHV0PixcbiAgeyB2ZXJib3NlLCB0aGVtZTogX3RoZW1lIH06IHsgdmVyYm9zZTogYm9vbGVhbjsgdGhlbWU6IFRoZW1lTmFtZSB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBjb21tYW5kIH0gPSBpbnB1dFxuICBpZiAoIWNvbW1hbmQpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gUmVuZGVyIHNlZCBpbi1wbGFjZSBlZGl0cyBsaWtlIGZpbGUgZWRpdHMgKHNob3cgZmlsZSBwYXRoIG9ubHkpXG4gIGNvbnN0IHNlZEluZm8gPSBwYXJzZVNlZEVkaXRDb21tYW5kKGNvbW1hbmQpXG4gIGlmIChzZWRJbmZvKSB7XG4gICAgcmV0dXJuIHZlcmJvc2UgPyBzZWRJbmZvLmZpbGVQYXRoIDogZ2V0RGlzcGxheVBhdGgoc2VkSW5mby5maWxlUGF0aClcbiAgfVxuXG4gIGlmICghdmVyYm9zZSkge1xuICAgIGNvbnN0IGxpbmVzID0gY29tbWFuZC5zcGxpdCgnXFxuJylcblxuICAgIGlmIChpc0Z1bGxzY3JlZW5FbnZFbmFibGVkKCkpIHtcbiAgICAgIGNvbnN0IGxhYmVsID0gZXh0cmFjdEJhc2hDb21tZW50TGFiZWwoY29tbWFuZClcbiAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICByZXR1cm4gbGFiZWwubGVuZ3RoID4gTUFYX0NPTU1BTkRfRElTUExBWV9DSEFSU1xuICAgICAgICAgID8gbGFiZWwuc2xpY2UoMCwgTUFYX0NPTU1BTkRfRElTUExBWV9DSEFSUykgKyAn4oCmJ1xuICAgICAgICAgIDogbGFiZWxcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBuZWVkc0xpbmVUcnVuY2F0aW9uID0gbGluZXMubGVuZ3RoID4gTUFYX0NPTU1BTkRfRElTUExBWV9MSU5FU1xuICAgIGNvbnN0IG5lZWRzQ2hhclRydW5jYXRpb24gPSBjb21tYW5kLmxlbmd0aCA+IE1BWF9DT01NQU5EX0RJU1BMQVlfQ0hBUlNcblxuICAgIGlmIChuZWVkc0xpbmVUcnVuY2F0aW9uIHx8IG5lZWRzQ2hhclRydW5jYXRpb24pIHtcbiAgICAgIGxldCB0cnVuY2F0ZWQgPSBjb21tYW5kXG5cbiAgICAgIC8vIEZpcnN0IHRydW5jYXRlIGJ5IGxpbmVzIGlmIG5lZWRlZFxuICAgICAgaWYgKG5lZWRzTGluZVRydW5jYXRpb24pIHtcbiAgICAgICAgdHJ1bmNhdGVkID0gbGluZXMuc2xpY2UoMCwgTUFYX0NPTU1BTkRfRElTUExBWV9MSU5FUykuam9pbignXFxuJylcbiAgICAgIH1cblxuICAgICAgLy8gVGhlbiB0cnVuY2F0ZSBieSBjaGFycyBpZiBzdGlsbCB0b28gbG9uZ1xuICAgICAgaWYgKHRydW5jYXRlZC5sZW5ndGggPiBNQVhfQ09NTUFORF9ESVNQTEFZX0NIQVJTKSB7XG4gICAgICAgIHRydW5jYXRlZCA9IHRydW5jYXRlZC5zbGljZSgwLCBNQVhfQ09NTUFORF9ESVNQTEFZX0NIQVJTKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gPFRleHQ+e3RydW5jYXRlZC50cmltKCl94oCmPC9UZXh0PlxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb21tYW5kXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlUHJvZ3Jlc3NNZXNzYWdlKFxuICBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZTogUHJvZ3Jlc3NNZXNzYWdlPEJhc2hQcm9ncmVzcz5bXSxcbiAge1xuICAgIHZlcmJvc2UsXG4gICAgdG9vbHM6IF90b29scyxcbiAgICB0ZXJtaW5hbFNpemU6IF90ZXJtaW5hbFNpemUsXG4gICAgaW5Qcm9ncmVzc1Rvb2xDYWxsQ291bnQ6IF9pblByb2dyZXNzVG9vbENhbGxDb3VudCxcbiAgfToge1xuICAgIHRvb2xzOiBUb29sW11cbiAgICB2ZXJib3NlOiBib29sZWFuXG4gICAgdGVybWluYWxTaXplPzogeyBjb2x1bW5zOiBudW1iZXI7IHJvd3M6IG51bWJlciB9XG4gICAgaW5Qcm9ncmVzc1Rvb2xDYWxsQ291bnQ/OiBudW1iZXJcbiAgfSxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGxhc3RQcm9ncmVzcyA9IHByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlLmF0KC0xKVxuXG4gIGlmICghbGFzdFByb2dyZXNzIHx8ICFsYXN0UHJvZ3Jlc3MuZGF0YSkge1xuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlJ1bm5pbmfigKY8L1RleHQ+XG4gICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICApXG4gIH1cblxuICBjb25zdCBkYXRhID0gbGFzdFByb2dyZXNzLmRhdGFcblxuICByZXR1cm4gKFxuICAgIDxTaGVsbFByb2dyZXNzTWVzc2FnZVxuICAgICAgZnVsbE91dHB1dD17ZGF0YS5mdWxsT3V0cHV0fVxuICAgICAgb3V0cHV0PXtkYXRhLm91dHB1dH1cbiAgICAgIGVsYXBzZWRUaW1lU2Vjb25kcz17ZGF0YS5lbGFwc2VkVGltZVNlY29uZHN9XG4gICAgICB0b3RhbExpbmVzPXtkYXRhLnRvdGFsTGluZXN9XG4gICAgICB0b3RhbEJ5dGVzPXtkYXRhLnRvdGFsQnl0ZXN9XG4gICAgICB0aW1lb3V0TXM9e2RhdGEudGltZW91dE1zfVxuICAgICAgdGFza0lkPXtkYXRhLnRhc2tJZH1cbiAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgLz5cbiAgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZVF1ZXVlZE1lc3NhZ2UoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICA8VGV4dCBkaW1Db2xvcj5XYWl0aW5n4oCmPC9UZXh0PlxuICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sUmVzdWx0TWVzc2FnZShcbiAgY29udGVudDogT3V0LFxuICBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZTogUHJvZ3Jlc3NNZXNzYWdlPEJhc2hQcm9ncmVzcz5bXSxcbiAge1xuICAgIHZlcmJvc2UsXG4gICAgdGhlbWU6IF90aGVtZSxcbiAgICB0b29sczogX3Rvb2xzLFxuICAgIHN0eWxlOiBfc3R5bGUsXG4gIH06IHtcbiAgICB2ZXJib3NlOiBib29sZWFuXG4gICAgdGhlbWU6IFRoZW1lTmFtZVxuICAgIHRvb2xzOiBUb29sW11cbiAgICBzdHlsZT86ICdjb25kZW5zZWQnXG4gIH0sXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBsYXN0UHJvZ3Jlc3MgPSBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZS5hdCgtMSlcbiAgY29uc3QgdGltZW91dE1zID0gbGFzdFByb2dyZXNzPy5kYXRhPy50aW1lb3V0TXNcbiAgcmV0dXJuIChcbiAgICA8QmFzaFRvb2xSZXN1bHRNZXNzYWdlXG4gICAgICBjb250ZW50PXtjb250ZW50fVxuICAgICAgdmVyYm9zZT17dmVyYm9zZX1cbiAgICAgIHRpbWVvdXRNcz17dGltZW91dE1zfVxuICAgIC8+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UoXG4gIHJlc3VsdDogVG9vbFJlc3VsdEJsb2NrUGFyYW1bJ2NvbnRlbnQnXSxcbiAge1xuICAgIHZlcmJvc2UsXG4gICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U6IF9wcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZSxcbiAgICB0b29sczogX3Rvb2xzLFxuICB9OiB7XG4gICAgdmVyYm9zZTogYm9vbGVhblxuICAgIHByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlOiBQcm9ncmVzc01lc3NhZ2U8QmFzaFByb2dyZXNzPltdXG4gICAgdG9vbHM6IFRvb2xbXVxuICB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIDxGYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UgcmVzdWx0PXtyZXN1bHR9IHZlcmJvc2U9e3ZlcmJvc2V9IC8+XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxvQkFBb0IsUUFBUSx1Q0FBdUM7QUFDakYsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxvQkFBb0IsUUFBUSx3REFBd0Q7QUFDN0YsU0FBU0MsMkJBQTJCLFFBQVEsaURBQWlEO0FBQzdGLFNBQVNDLGVBQWUsUUFBUSxxQ0FBcUM7QUFDckUsU0FBU0Msb0JBQW9CLFFBQVEsZ0RBQWdEO0FBQ3JGLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0MsYUFBYSxRQUFRLG9DQUFvQztBQUNsRSxTQUFTQyxrQkFBa0IsUUFBUSx5Q0FBeUM7QUFDNUUsU0FBU0MsZ0JBQWdCLEVBQUVDLGNBQWMsUUFBUSx5QkFBeUI7QUFDMUUsY0FBY0MsSUFBSSxRQUFRLGVBQWU7QUFDekMsU0FBU0MsYUFBYSxRQUFRLDhDQUE4QztBQUM1RSxjQUFjQyxlQUFlLFFBQVEsd0JBQXdCO0FBQzdELFNBQVNDLEdBQUcsUUFBUSxvQkFBb0I7QUFDeEMsU0FBU0MsV0FBVyxRQUFRLHlCQUF5QjtBQUNyRCxTQUFTQyxjQUFjLFFBQVEscUJBQXFCO0FBQ3BELFNBQVNDLHNCQUFzQixRQUFRLDJCQUEyQjtBQUNsRSxjQUFjQyxTQUFTLFFBQVEsc0JBQXNCO0FBQ3JELGNBQWNDLFlBQVksRUFBRUMsYUFBYSxFQUFFQyxHQUFHLFFBQVEsZUFBZTtBQUNyRSxPQUFPQyxxQkFBcUIsTUFBTSw0QkFBNEI7QUFDOUQsU0FBU0MsdUJBQXVCLFFBQVEsbUJBQW1CO0FBQzNELFNBQVNDLG1CQUFtQixRQUFRLG9CQUFvQjs7QUFFeEQ7QUFDQSxNQUFNQyx5QkFBeUIsR0FBRyxDQUFDO0FBQ25DLE1BQU1DLHlCQUF5QixHQUFHLEdBQUc7O0FBRXJDO0FBQ0E7QUFDQSxPQUFPLFNB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
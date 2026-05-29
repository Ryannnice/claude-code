// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 TEAMMATE_MESSAGE_TAG，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { TEAMMATE_MESSAGE_TAG } from '../../constants/xml.js';
// 引入 Ansi、Box、Text、TextProps，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Box, Text, type TextProps } from '../../ink.js';
// 复用 toInkColor 工具函数，把通用处理留在 ../../utils/ink.js 中维护。
import { toInkColor } from '../../utils/ink.js';
// 复用 jsonParse 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse } from '../../utils/slowOperations.js';
// 复用 isShutdownApproved 工具函数，把通用处理留在 ../../utils/teammateMailbox.js 中维护。
import { isShutdownApproved } from '../../utils/teammateMailbox.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// 引入 tryRenderPlanApprovalMessage，将 ./PlanApprovalMessage.js 中已经封装好的能力接到本文件流程里。
import { tryRenderPlanApprovalMessage } from './PlanApprovalMessage.js';
// 引入 tryRenderShutdownMessage，将 ./ShutdownMessage.js 中已经封装好的能力接到本文件流程里。
import { tryRenderShutdownMessage } from './ShutdownMessage.js';
// 引入 tryRenderTaskAssignmentMessage，将 ./TaskAssignmentMessage.js 中已经封装好的能力接到本文件流程里。
import { tryRenderTaskAssignmentMessage } from './TaskAssignmentMessage.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
  param: TextBlockParam;
  isTranscriptMode?: boolean;
};
// ParsedMessage 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ParsedMessage = {
  teammateId: string;
  content: string;
  color?: string;
  summary?: string;
};
// TEAMMATE_MSG_REGEX匹配`RegExp`，供终端渲染后续处理使用。
const TEAMMATE_MSG_REGEX = new RegExp(`<${TEAMMATE_MESSAGE_TAG}\\s+teammate_id="([^"]+)"(?:\\s+color="([^"]+)")?(?:\\s+summary="([^"]+)")?>\\n?([\\s\\S]*?)\\n?<\\/${TEAMMATE_MESSAGE_TAG}>`, 'g');

/**
 * Parse all teammate messages from XML format:
 * <teammate-message teammate_id="alice" color="red" summary="Brief update">message content</teammate-message>
 * Supports multiple messages in a single text block.
 */
// parseTeammateMessages 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTeammateMessages(text: string): ParsedMessage[] {
  // 对话消息 从空数组开始收集，后续循环会按处理顺序追加条目。
  const messages: ParsedMessage[] = [];
  // Use matchAll to find all matches (this is a RegExp method, not child_process)
  // 逐项读取 `text.matchAll(TEAMMATE_MSG_REGEX)` 中的match，按输入顺序推进终端渲染。
  for (const match of text.matchAll(TEAMMATE_MSG_REGEX)) {
    // 只有 `match[1] && match[4]` 满足时，终端渲染才执行该分支。
    if (match[1] && match[4]) {
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      messages.push({
        teammateId: match[1],
        color: match[2],
        // may be undefined
        summary: match[3],
        // may be undefined
        content: match[4].trim()
      });
    }
  }
  // 返回 `messages`，作为终端渲染这次计算的结果。
  return messages;
}
// getDisplayName 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDisplayName(teammateId: string): string {
  // 当 `teammateId` 匹配 `'leader'` 时，终端渲染执行对应分支。
  if (teammateId === 'leader') {
    // 返回 `'leader'`，作为终端渲染这次计算的结果。
    return 'leader';
  }
  // 返回 `teammateId`，作为终端渲染这次计算的结果。
  return teammateId;
}
// UserTeammateMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserTeammateMessage({
  addMargin,
  param: {
    text
  },
  isTranscriptMode
}: Props): React.ReactNode {
  // 对话消息解析`parseTeammateMessages`，供终端渲染后续处理使用。
  const messages = parseTeammateMessages(text).filter(msg => {
    // Pre-filter shutdown lifecycle messages to avoid empty wrapper
    // Box elements creating blank lines between model turns
    // 满足 `isShutdownApproved(msg.content)` 时，终端渲染执行该分支。
    if (isShutdownApproved(msg.content)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // 解析结果解析`jsonParse`，供终端渲染后续处理使用。
      const parsed = jsonParse(msg.content);
      // 当 `parsed?.type` 匹配 `'teammate_terminated'` 时，终端渲染执行对应分支。
      if (parsed?.type === 'teammate_terminated') return false;
    } catch {
      // Not JSON, keep the message
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  });
  // 对话消息为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (messages.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 返回 `<Box flexDirection="column" marginTop={addMargin ? 1 : 0} width="100%">`，作为终端渲染这次计算的结果。
  return <Box flexDirection="column" marginTop={addMargin ? 1 : 0} width="100%">
      {/* 这个回调绑定到 {messages.map((msg_0, index) => {，负责终端渲染在该局部场景下的响应。 */}
      {messages.map((msg_0, index) => {
      // inkColor保存`toInkColor`，供终端渲染后续处理使用。
      const inkColor = toInkColor(msg_0.color);
      // displayName读取`getDisplayName`，供终端渲染后续处理使用。
      const displayName = getDisplayName(msg_0.teammateId);

      // Try to render as plan approval message (request or response)
      // planApprovalElement保存`tryRenderPlanApprovalMessage`，供终端渲染后续处理使用。
      const planApprovalElement = tryRenderPlanApprovalMessage(msg_0.content, displayName);
      // 满足 `planApprovalElement` 时，终端渲染执行该分支。
      if (planApprovalElement) {
        // 返回 `<React.Fragment key={index}>{planApprovalElement}</React.Fragment>`，作为终端渲染这次计算的结果。
        return <React.Fragment key={index}>{planApprovalElement}</React.Fragment>;
      }

      // Try to render as shutdown message (request or rejected)
      // shutdownElement保存`tryRenderShutdownMessage`，供终端渲染后续处理使用。
      const shutdownElement = tryRenderShutdownMessage(msg_0.content);
      // 满足 `shutdownElement` 时，终端渲染执行该分支。
      if (shutdownElement) {
        // 返回 `<React.Fragment key={index}>{shutdownElement}</React.Fragment>`，作为终端渲染这次计算的结果。
        return <React.Fragment key={index}>{shutdownElement}</React.Fragment>;
      }

      // Try to render as task assignment message
      // taskAssignmentElement保存`tryRenderTaskAssignmentMessage`，供终端渲染后续处理使用。
      const taskAssignmentElement = tryRenderTaskAssignmentMessage(msg_0.content);
      // 满足 `taskAssignmentElement` 时，终端渲染执行该分支。
      if (taskAssignmentElement) {
        // 返回 `<React.Fragment key={index}>{taskAssignmentElement}</React.Fragment>`，作为终端渲染这次计算的结果。
        return <React.Fragment key={index}>{taskAssignmentElement}</React.Fragment>;
      }

      // Try to parse as structured JSON message
      // parsedIdleNotification 先占位，稍后的条件分支会根据实际输入补齐它。
      let parsedIdleNotification: {
        type?: string;
      } | null = null;
      // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
      try {
        // parsedIdleNotification更新为 `jsonParse(msg_0.content)`，确保终端 UI后续读取最新状态。
        parsedIdleNotification = jsonParse(msg_0.content);
      } catch {
        // Not JSON
      }

      // Hide idle notifications - they are processed silently
      // 满足 `parsedIdleNotification?.type === 'idle_notificati` 时，终端渲染执行该分支。
      if (parsedIdleNotification?.type === 'idle_notification') {
        // 返回 `null`，作为终端渲染这次计算的结果。
        return null;
      }

      // Task completed notification - show which task was completed
      // 当 `parsedIdleNotification?.type` 匹配 `'task_completed'` 时，终端渲染执行对应分支。
      if (parsedIdleNotification?.type === 'task_completed') {
        // taskCompleted解析`parsedIdleNotification as {` 整理出中间结果，供终端 UI User Teammate Message后续步骤使用。
        const taskCompleted = parsedIdleNotification as {
          type: string;
          from: string;
          taskId: string;
          taskSubject?: string;
        };
        // 返回 `<Box key={index} flexDirection="column" marginTop={1}>`，作为终端渲染这次计算的结果。
        return <Box key={index} flexDirection="column" marginTop={1}>
              <Text color={inkColor}>{`@${displayName}${figures.pointer}`}</Text>
              <MessageResponse>
                <Text color="success">✓</Text>
                <Text>
                  {' '}
                  Completed task #{taskCompleted.taskId}
                  {taskCompleted.taskSubject && <Text dimColor> ({taskCompleted.taskSubject})</Text>}
                </Text>
              </MessageResponse>
            </Box>;
      }

      // Default: plain text message (truncated)
      // 返回 `<TeammateMessageContent key={index} displayName={displayName} inkColor=...`，作为终端渲染这次计算的结果。
      return <TeammateMessageContent key={index} displayName={displayName} inkColor={inkColor} content={msg_0.content} summary={msg_0.summary} isTranscriptMode={isTranscriptMode} />;
    })}
    </Box>;
}
// TeammateMessageContentProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TeammateMessageContentProps = {
  displayName: string;
  inkColor: TextProps['color'];
  content: string;
  summary?: string;
  isTranscriptMode?: boolean;
};
// TeammateMessageContent 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TeammateMessageContent(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    displayName,
    inkColor,
    content,
    summary,
    isTranscriptMode
  } = t0;
  // t1固定为 ``@${displayName}${figures.pointer}``，作为终端 UI User Teammate Message后续展示或比较的基准。
  const t1 = `@${displayName}${figures.pointer}`;
  // t2 暂存 `<Text color={inkColor}>{t1}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== inkColor || $[1] !== t1) {
    // t2 暂存 `<Text color={inkColor}>{t1}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color={inkColor}>{t1}</Text>;
    // $[0] 缓存 `inkColor`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = inkColor;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `summary && <Text> {summary}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== summary) {
    // t3 暂存 `summary && <Text> {summary}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = summary && <Text> {summary}</Text>;
    // $[3] 缓存 `summary`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = summary;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<Box>{t2}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t2 || $[6] !== t3) {
    // t4 暂存 `<Box>{t2}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box>{t2}{t3}</Box>;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `isTranscriptMode && <Box paddingLeft={2}><Text><Ansi>{con...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== content || $[9] !== isTranscriptMode) {
    // t5 暂存 `isTranscriptMode && <Box paddingLeft={2}><Text><Ansi>{con...` 生成的渲染片段，后续返回路径直接复用。
    t5 = isTranscriptMode && <Box paddingLeft={2}><Text><Ansi>{content}</Ansi></Text></Box>;
    // $[8] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = content;
    // $[9] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = isTranscriptMode;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== t4 || $[12] !== t5) {
    // t6 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" marginTop={1}>{t4}{t5}</Box>;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUZXh0QmxvY2tQYXJhbSIsImZpZ3VyZXMiLCJSZWFjdCIsIlRFQU1NQVRFX01FU1NBR0VfVEFHIiwiQW5zaSIsIkJveCIsIlRleHQiLCJUZXh0UHJvcHMiLCJ0b0lua0NvbG9yIiwianNvblBhcnNlIiwiaXNTaHV0ZG93bkFwcHJvdmVkIiwiTWVzc2FnZVJlc3BvbnNlIiwidHJ5UmVuZGVyUGxhbkFwcHJvdmFsTWVzc2FnZSIsInRyeVJlbmRlclNodXRkb3duTWVzc2FnZSIsInRyeVJlbmRlclRhc2tBc3NpZ25tZW50TWVzc2FnZSIsIlByb3BzIiwiYWRkTWFyZ2luIiwicGFyYW0iLCJpc1RyYW5zY3JpcHRNb2RlIiwiUGFyc2VkTWVzc2FnZSIsInRlYW1tYXRlSWQiLCJjb250ZW50IiwiY29sb3IiLCJzdW1tYXJ5IiwiVEVBTU1BVEVfTVNHX1JFR0VYIiwiUmVnRXhwIiwicGFyc2VUZWFtbWF0ZU1lc3NhZ2VzIiwidGV4dCIsIm1lc3NhZ2VzIiwibWF0Y2giLCJtYXRjaEFsbCIsInB1c2giLCJ0cmltIiwiZ2V0RGlzcGxheU5hbWUiLCJVc2VyVGVhbW1hdGVNZXNzYWdlIiwiUmVhY3ROb2RlIiwiZmlsdGVyIiwibXNnIiwicGFyc2VkIiwidHlwZSIsImxlbmd0aCIsIm1hcCIsImluZGV4IiwiaW5rQ29sb3IiLCJkaXNwbGF5TmFtZSIsInBsYW5BcHByb3ZhbEVsZW1lbnQiLCJzaHV0ZG93bkVsZW1lbnQiLCJ0YXNrQXNzaWdubWVudEVsZW1lbnQiLCJwYXJzZWRJZGxlTm90aWZpY2F0aW9uIiwidGFza0NvbXBsZXRlZCIsImZyb20iLCJ0YXNrSWQiLCJ0YXNrU3ViamVjdCIsInBvaW50ZXIiLCJUZWFtbWF0ZU1lc3NhZ2VDb250ZW50UHJvcHMiLCJUZWFtbWF0ZU1lc3NhZ2VDb250ZW50IiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwidDMiLCJ0NCIsInQ1IiwidDYiXSwic291cmNlcyI6WyJVc2VyVGVhbW1hdGVNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRleHRCbG9ja1BhcmFtIH0gZnJvbSAnQGFudGhyb3BpYy1haS9zZGsvcmVzb3VyY2VzL2luZGV4Lm1qcydcbmltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRFQU1NQVRFX01FU1NBR0VfVEFHIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL3htbC5qcydcbmltcG9ydCB7IEFuc2ksIEJveCwgVGV4dCwgdHlwZSBUZXh0UHJvcHMgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB0b0lua0NvbG9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvaW5rLmpzJ1xuaW1wb3J0IHsganNvblBhcnNlIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2xvd09wZXJhdGlvbnMuanMnXG5pbXBvcnQgeyBpc1NodXRkb3duQXBwcm92ZWQgfSBmcm9tICcuLi8uLi91dGlscy90ZWFtbWF0ZU1haWxib3guanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyB0cnlSZW5kZXJQbGFuQXBwcm92YWxNZXNzYWdlIH0gZnJvbSAnLi9QbGFuQXBwcm92YWxNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgdHJ5UmVuZGVyU2h1dGRvd25NZXNzYWdlIH0gZnJvbSAnLi9TaHV0ZG93bk1lc3NhZ2UuanMnXG5pbXBvcnQgeyB0cnlSZW5kZXJUYXNrQXNzaWdubWVudE1lc3NhZ2UgfSBmcm9tICcuL1Rhc2tBc3NpZ25tZW50TWVzc2FnZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgYWRkTWFyZ2luOiBib29sZWFuXG4gIHBhcmFtOiBUZXh0QmxvY2tQYXJhbVxuICBpc1RyYW5zY3JpcHRNb2RlPzogYm9vbGVhblxufVxuXG50eXBlIFBhcnNlZE1lc3NhZ2UgPSB7XG4gIHRlYW1tYXRlSWQ6IHN0cmluZ1xuICBjb250ZW50OiBzdHJpbmdcbiAgY29sb3I/OiBzdHJpbmdcbiAgc3VtbWFyeT86IHN0cmluZ1xufVxuXG5jb25zdCBURUFNTUFURV9NU0dfUkVHRVggPSBuZXcgUmVnRXhwKFxuICBgPCR7VEVBTU1BVEVfTUVTU0FHRV9UQUd9XFxcXHMrdGVhbW1hdGVfaWQ9XCIoW15cIl0rKVwiKD86XFxcXHMrY29sb3I9XCIoW15cIl0rKVwiKT8oPzpcXFxccytzdW1tYXJ5PVwiKFteXCJdKylcIik/PlxcXFxuPyhbXFxcXHNcXFxcU10qPylcXFxcbj88XFxcXC8ke1RFQU1NQVRFX01FU1NBR0VfVEFHfT5gLFxuICAnZycsXG4pXG5cbi8qKlxuICogUGFyc2UgYWxsIHRlYW1tYXRlIG1lc3NhZ2VzIGZyb20gWE1MIGZvcm1hdDpcbiAqIDx0ZWFtbWF0ZS1tZXNzYWdlIHRlYW1tYXRlX2lkPVwiYWxpY2VcIiBjb2xvcj1cInJlZFwiIHN1bW1hcnk9XCJCcmllZiB1cGRhdGVcIj5tZXNzYWdlIGNvbnRlbnQ8L3RlYW1tYXRlLW1lc3NhZ2U+XG4gKiBTdXBwb3J0cyBtdWx0aXBsZSBtZXNzYWdlcyBpbiBhIHNpbmdsZSB0ZXh0IGJsb2NrLlxuICovXG5mdW5jdGlvbiBwYXJzZVRlYW1tYXRlTWVzc2FnZXModGV4dDogc3RyaW5nKTogUGFyc2VkTWVzc2FnZVtdIHtcbiAgY29uc3QgbWVzc2FnZXM6IFBhcnNlZE1lc3NhZ2VbXSA9IFtdXG4gIC8vIFVzZSBtYXRjaEFsbCB0byBmaW5kIGFsbCBtYXRjaGVzICh0aGlzIGlzIGEgUmVnRXhwIG1ldGhvZCwgbm90IGNoaWxkX3Byb2Nlc3MpXG4gIGZvciAoY29uc3QgbWF0Y2ggb2YgdGV4dC5tYXRjaEFsbChURUFNTUFURV9NU0dfUkVHRVgpKSB7XG4gICAgaWYgKG1hdGNoWzFdICYmIG1hdGNoWzRdKSB7XG4gICAgICBtZXNzYWdlcy5wdXNoKHtcbiAgICAgICAgdGVhbW1hdGVJZDogbWF0Y2hbMV0sXG4gICAgICAgIGNvbG9yOiBtYXRjaFsyXSwgLy8gbWF5IGJlIHVuZGVmaW5lZFxuICAgICAgICBzdW1tYXJ5OiBtYXRjaFszXSwgLy8gbWF5IGJlIHVuZGVmaW5lZFxuICAgICAgICBjb250ZW50OiBtYXRjaFs0XS50cmltKCksXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtZXNzYWdlc1xufVxuXG5mdW5jdGlvbiBnZXREaXNwbGF5TmFtZSh0ZWFtbWF0ZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodGVhbW1hdGVJZCA9PT0gJ2xlYWRlcicpIHtcbiAgICByZXR1cm4gJ2xlYWRlcidcbiAgfVxuICByZXR1cm4gdGVhbW1hdGVJZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gVXNlclRlYW1tYXRlTWVzc2FnZSh7XG4gIGFkZE1hcmdpbixcbiAgcGFyYW06IHsgdGV4dCB9LFxuICBpc1RyYW5zY3JpcHRNb2RlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBtZXNzYWdlcyA9IHBhcnNlVGVhbW1hdGVNZXNzYWdlcyh0ZXh0KS5maWx0ZXIobXNnID0+IHtcbiAgICAvLyBQcmUtZmlsdGVyIHNodXRkb3duIGxpZmVjeWNsZSBtZXNzYWdlcyB0byBhdm9pZCBlbXB0eSB3cmFwcGVyXG4gICAgLy8gQm94IGVsZW1lbnRzIGNyZWF0aW5nIGJsYW5rIGxpbmVzIGJldHdlZW4gbW9kZWwgdHVybnNcbiAgICBpZiAoaXNTaHV0ZG93bkFwcHJvdmVkKG1zZy5jb250ZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBqc29uUGFyc2UobXNnLmNvbnRlbnQpXG4gICAgICBpZiAocGFyc2VkPy50eXBlID09PSAndGVhbW1hdGVfdGVybWluYXRlZCcpIHJldHVybiBmYWxzZVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gTm90IEpTT04sIGtlZXAgdGhlIG1lc3NhZ2VcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfSlcbiAgaWYgKG1lc3NhZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17YWRkTWFyZ2luID8gMSA6IDB9IHdpZHRoPVwiMTAwJVwiPlxuICAgICAge21lc3NhZ2VzLm1hcCgobXNnLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBpbmtDb2xvciA9IHRvSW5rQ29sb3IobXNnLmNvbG9yKVxuICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9IGdldERpc3BsYXlOYW1lKG1zZy50ZWFtbWF0ZUlkKVxuXG4gICAgICAgIC8vIFRyeSB0byByZW5kZXIgYXMgcGxhbiBhcHByb3ZhbCBtZXNzYWdlIChyZXF1ZXN0IG9yIHJlc3BvbnNlKVxuICAgICAgICBjb25zdCBwbGFuQXBwcm92YWxFbGVtZW50ID0gdHJ5UmVuZGVyUGxhbkFwcHJvdmFsTWVzc2FnZShcbiAgICAgICAgICBtc2cuY29udGVudCxcbiAgICAgICAgICBkaXNwbGF5TmFtZSxcbiAgICAgICAgKVxuICAgICAgICBpZiAocGxhbkFwcHJvdmFsRWxlbWVudCkge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8UmVhY3QuRnJhZ21lbnQga2V5PXtpbmRleH0+e3BsYW5BcHByb3ZhbEVsZW1lbnR9PC9SZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgICAvLyBUcnkgdG8gcmVuZGVyIGFzIHNodXRkb3duIG1lc3NhZ2UgKHJlcXVlc3Qgb3IgcmVqZWN0ZWQpXG4gICAgICAgIGNvbnN0IHNodXRkb3duRWxlbWVudCA9IHRyeVJlbmRlclNodXRkb3duTWVzc2FnZShtc2cuY29udGVudClcbiAgICAgICAgaWYgKHNodXRkb3duRWxlbWVudCkge1xuICAgICAgICAgIHJldHVybiA8UmVhY3QuRnJhZ21lbnQga2V5PXtpbmRleH0+e3NodXRkb3duRWxlbWVudH08L1JlYWN0LkZyYWdtZW50PlxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVHJ5IHRvIHJlbmRlciBhcyB0YXNrIGFzc2lnbm1lbnQgbWVzc2FnZVxuICAgICAgICBjb25zdCB0YXNrQXNzaWdubWVudEVsZW1lbnQgPSB0cnlSZW5kZXJUYXNrQXNzaWdubWVudE1lc3NhZ2UoXG4gICAgICAgICAgbXNnLmNvbnRlbnQsXG4gICAgICAgIClcbiAgICAgICAgaWYgKHRhc2tBc3NpZ25tZW50RWxlbWVudCkge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8UmVhY3QuRnJhZ21lbnQga2V5PXtpbmRleH0+e3Rhc2tBc3NpZ25tZW50RWxlbWVudH08L1JlYWN0LkZyYWdtZW50PlxuICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRyeSB0byBwYXJzZSBhcyBzdHJ1Y3R1cmVkIEpTT04gbWVzc2FnZVxuICAgICAgICBsZXQgcGFyc2VkSWRsZU5vdGlmaWNhdGlvbjogeyB0eXBlPzogc3RyaW5nIH0gfCBudWxsID0gbnVsbFxuICAgICAgICB0cnkge1xuICAgICAgICAgIHBhcnNlZElkbGVOb3RpZmljYXRpb24gPSBqc29uUGFyc2UobXNnLmNvbnRlbnQpXG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIC8vIE5vdCBKU09OXG4gICAgICAgIH1cblxuICAgICAgICAvLyBIaWRlIGlkbGUgbm90aWZpY2F0aW9ucyAtIHRoZXkgYXJlIHByb2Nlc3NlZCBzaWxlbnRseVxuICAgICAgICBpZiAocGFyc2VkSWRsZU5vdGlmaWNhdGlvbj8udHlwZSA9PT0gJ2lkbGVfbm90aWZpY2F0aW9uJykge1xuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYXNrIGNvbXBsZXRlZCBub3RpZmljYXRpb24gLSBzaG93IHdoaWNoIHRhc2sgd2FzIGNvbXBsZXRlZFxuICAgICAgICBpZiAocGFyc2VkSWRsZU5vdGlmaWNhdGlvbj8udHlwZSA9PT0gJ3Rhc2tfY29tcGxldGVkJykge1xuICAgICAgICAgIGNvbnN0IHRhc2tDb21wbGV0ZWQgPSBwYXJzZWRJZGxlTm90aWZpY2F0aW9uIGFzIHtcbiAgICAgICAgICAgIHR5cGU6IHN0cmluZ1xuICAgICAgICAgICAgZnJvbTogc3RyaW5nXG4gICAgICAgICAgICB0YXNrSWQ6IHN0cmluZ1xuICAgICAgICAgICAgdGFza1N1YmplY3Q/OiBzdHJpbmdcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCb3gga2V5PXtpbmRleH0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICAgICAgY29sb3I9e2lua0NvbG9yfVxuICAgICAgICAgICAgICA+e2BAJHtkaXNwbGF5TmFtZX0ke2ZpZ3VyZXMucG9pbnRlcn1gfTwvVGV4dD5cbiAgICAgICAgICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1Y2Nlc3NcIj7inJM8L1RleHQ+XG4gICAgICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAgICAgICAgQ29tcGxldGVkIHRhc2sgI3t0YXNrQ29tcGxldGVkLnRhc2tJZH1cbiAgICAgICAgICAgICAgICAgIHt0YXNrQ29tcGxldGVkLnRhc2tTdWJqZWN0ICYmIChcbiAgICAgICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+ICh7dGFza0NvbXBsZXRlZC50YXNrU3ViamVjdH0pPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVmYXVsdDogcGxhaW4gdGV4dCBtZXNzYWdlICh0cnVuY2F0ZWQpXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPFRlYW1tYXRlTWVzc2FnZUNvbnRlbnRcbiAgICAgICAgICAgIGtleT17aW5kZXh9XG4gICAgICAgICAgICBkaXNwbGF5TmFtZT17ZGlzcGxheU5hbWV9XG4gICAgICAgICAgICBpbmtDb2xvcj17aW5rQ29sb3J9XG4gICAgICAgICAgICBjb250ZW50PXttc2cuY29udGVudH1cbiAgICAgICAgICAgIHN1bW1hcnk9e21zZy5zdW1tYXJ5fVxuICAgICAgICAgICAgaXNUcmFuc2NyaXB0TW9kZT17aXNUcmFuc2NyaXB0TW9kZX1cbiAgICAgICAgICAvPlxuICAgICAgICApXG4gICAgICB9KX1cbiAgICA8L0JveD5cbiAgKVxufVxuXG50eXBlIFRlYW1tYXRlTWVzc2FnZUNvbnRlbnRQcm9wcyA9IHtcbiAgZGlzcGxheU5hbWU6IHN0cmluZ1xuICBpbmtDb2xvcjogVGV4dFByb3BzWydjb2xvciddXG4gIGNvbnRlbnQ6IHN0cmluZ1xuICBzdW1tYXJ5Pzogc3RyaW5nXG4gIGlzVHJhbnNjcmlwdE1vZGU/OiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBUZWFtbWF0ZU1lc3NhZ2VDb250ZW50KHtcbiAgZGlzcGxheU5hbWUsXG4gIGlua0NvbG9yLFxuICBjb250ZW50LFxuICBzdW1tYXJ5LFxuICBpc1RyYW5zY3JpcHRNb2RlLFxufTogVGVhbW1hdGVNZXNzYWdlQ29udGVudFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgY29sb3I9e2lua0NvbG9yfT57YEAke2Rpc3BsYXlOYW1lfSR7ZmlndXJlcy5wb2ludGVyfWB9PC9UZXh0PlxuICAgICAgICB7c3VtbWFyeSAmJiA8VGV4dD4ge3N1bW1hcnl9PC9UZXh0Pn1cbiAgICAgIDwvQm94PlxuICAgICAge2lzVHJhbnNjcmlwdE1vZGUgJiYgKFxuICAgICAgICA8Qm94IHBhZGRpbmdMZWZ0PXsyfT5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIDxBbnNpPntjb250ZW50fTwvQW5zaT5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsY0FBY0EsY0FBYyxRQUFRLHVDQUF1QztBQUMzRSxPQUFPQyxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLG9CQUFvQixRQUFRLHdCQUF3QjtBQUM3RCxTQUFTQyxJQUFJLEVBQUVDLEdBQUcsRUFBRUMsSUFBSSxFQUFFLEtBQUtDLFNBQVMsUUFBUSxjQUFjO0FBQzlELFNBQVNDLFVBQVUsUUFBUSxvQkFBb0I7QUFDL0MsU0FBU0MsU0FBUyxRQUFRLCtCQUErQjtBQUN6RCxTQUFTQyxrQkFBa0IsUUFBUSxnQ0FBZ0M7QUFDbkUsU0FBU0MsZUFBZSxRQUFRLHVCQUF1QjtBQUN2RCxTQUFTQyw0QkFBNEIsUUFBUSwwQkFBMEI7QUFDdkUsU0FBU0Msd0JBQXdCLFFBQVEsc0JBQXNCO0FBQy9ELFNBQVNDLDhCQUE4QixRQUFRLDRCQUE0QjtBQUUzRSxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsU0FBUyxFQUFFLE9BQU87RUFDbEJDLEtBQUssRUFBRWpCLGNBQWM7RUFDckJrQixnQkFBZ0IsQ0FBQyxFQUFFLE9BQU87QUFDNUIsQ0FBQztBQUVELEtBQUtDLGFBQWEsR0FBRztFQUNuQkMsVUFBVSxFQUFFLE1BQU07RUFDbEJDLE9BQU8sRUFBRSxNQUFNO0VBQ2ZDLEtBQUssQ0FBQyxFQUFFLE1BQU07RUFDZEMsT0FBTyxDQUFDLEVBQUUsTUFBTTtBQUNsQixDQUFDO0FBRUQsTUFBTUMsa0JBQWtCLEdBQUcsSUFBSUMsTUFBTSxDQUNuQyxJQUFJdEIsb0JBQW9CLHVHQUF1R0Esb0JBQW9CLEdBQUcsRUFDdEosR0FDRixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTdUIscUJBQXFCQSxDQUFDQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUVSLGFBQWEsRUFBRSxDQUFDO0VBQzVELE1BQU1TLFFBQVEsRUFBRVQsYUFBYSxFQUFFLEdBQUcsRUFBRTtFQUNwQztFQUNBLEtBQUssTUFBTVUsS0FBSyxJQUFJRixJQUFJLENBQUNHLFFBQVEsQ0FBQ04sa0JBQWtCLENBQUMsRUFBRTtJQUNyRCxJQUFJSyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUlBLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUN4QkQsUUFBUSxDQUFDRyxJQUFJLENBQUM7UUFDWlgsVUFBVSxFQUFFUyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BCUCxLQUFLLEVBQUVPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFBRTtRQUNqQk4sT0FBTyxFQUFFTSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQUU7UUFDbkJSLE9BQU8sRUFBRVEsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDRyxJQUFJLENBQUM7TUFDekIsQ0FBQyxDQUFDO0lBQ0o7RUFDRjtFQUVBLE9BQU9KLFFBQVE7QUFDakI7QUFFQSxTQUFTSyxjQUFjQSxDQUFDYixVQUFVLEVBQUUsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDO0VBQ2xELElBQUlBLFVBQVUsS0FBSyxRQUFRLEVBQUU7SUFDM0IsT0FBTyxRQUFRO0VBQ2pCO0VBQ0EsT0FBT0EsVUFBVTtBQUNuQjtBQUVBLE9BQU8sU0FBU2MsbUJBQW1CQSxDQUFDO0VBQ2xDbEIsU0FBUztFQUNUQyxLQUFLLEVBQUU7SUFBRVU7RUFBSyxDQUFDO0VBQ2ZUO0FBQ0ssQ0FBTixFQUFFSCxLQUFLLENBQUMsRUFBRWIsS0FBSyxDQUFDaUMsU0FBUyxDQUFDO0VBQ3pCLE1BQU1QLFFBQVEsR0FBR0YscUJBQXFCLENBQUNDLElBQUksQ0FBQyxDQUFDUyxNQUFNLENBQUNDLEdBQUcsSUFBSTtJQUN6RDtJQUNBO0lBQ0EsSUFBSTNCLGtCQUFrQixDQUFDMkIsR0FBRyxDQUFDaEIsT0FBTyxDQUFDLEVBQUU7TUFDbkMsT0FBTyxLQUFLO0lBQ2Q7SUFDQSxJQUFJO01BQ0YsTUFBTWlCLE1BQU0sR0FBRzdCLFNBQVMsQ0FBQzRCLEdBQUcsQ0FBQ2hCLE9BQU8sQ0FBQztNQUNyQyxJQUFJaUIsTUFBTSxFQUFFQyxJQUFJLEtBQUsscUJBQXFCLEVBQUUsT0FBTyxLQUFLO0lBQzFELENBQUMsQ0FBQyxNQUFNO01BQ047SUFBQTtJQUVGLE9BQU8sSUFBSTtFQUNiLENBQUMsQ0FBQztFQUNGLElBQUlYLFFBQVEsQ0FBQ1ksTUFBTSxLQUFLLENBQUMsRUFBRTtJQUN6QixPQUFPLElBQUk7RUFDYjtFQUVBLE9BQ0UsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQ3hCLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU07QUFDMUUsTUFBTSxDQUFDWSxRQUFRLENBQUNhLEdBQUcsQ0FBQyxDQUFDSixLQUFHLEVBQUVLLEtBQUssS0FBSztNQUM1QixNQUFNQyxRQUFRLEdBQUduQyxVQUFVLENBQUM2QixLQUFHLENBQUNmLEtBQUssQ0FBQztNQUN0QyxNQUFNc0IsV0FBVyxHQUFHWCxjQUFjLENBQUNJLEtBQUcsQ0FBQ2pCLFVBQVUsQ0FBQzs7TUFFbEQ7TUFDQSxNQUFNeUIsbUJBQW1CLEdBQUdqQyw0QkFBNEIsQ0FDdER5QixLQUFHLENBQUNoQixPQUFPLEVBQ1h1QixXQUNGLENBQUM7TUFDRCxJQUFJQyxtQkFBbUIsRUFBRTtRQUN2QixPQUNFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQ0gsS0FBSyxDQUFDLENBQUMsQ0FBQ0csbUJBQW1CLENBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDO01BRXRFOztNQUVBO01BQ0EsTUFBTUMsZUFBZSxHQUFHakMsd0JBQXdCLENBQUN3QixLQUFHLENBQUNoQixPQUFPLENBQUM7TUFDN0QsSUFBSXlCLGVBQWUsRUFBRTtRQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQ0osS0FBSyxDQUFDLENBQUMsQ0FBQ0ksZUFBZSxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQztNQUN2RTs7TUFFQTtNQUNBLE1BQU1DLHFCQUFxQixHQUFHakMsOEJBQThCLENBQzFEdUIsS0FBRyxDQUFDaEIsT0FDTixDQUFDO01BQ0QsSUFBSTBCLHFCQUFxQixFQUFFO1FBQ3pCLE9BQ0UsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDTCxLQUFLLENBQUMsQ0FBQyxDQUFDSyxxQkFBcUIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUM7TUFFeEU7O01BRUE7TUFDQSxJQUFJQyxzQkFBc0IsRUFBRTtRQUFFVCxJQUFJLENBQUMsRUFBRSxNQUFNO01BQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJO01BQzNELElBQUk7UUFDRlMsc0JBQXNCLEdBQUd2QyxTQUFTLENBQUM0QixLQUFHLENBQUNoQixPQUFPLENBQUM7TUFDakQsQ0FBQyxDQUFDLE1BQU07UUFDTjtNQUFBOztNQUdGO01BQ0EsSUFBSTJCLHNCQUFzQixFQUFFVCxJQUFJLEtBQUssbUJBQW1CLEVBQUU7UUFDeEQsT0FBTyxJQUFJO01BQ2I7O01BRUE7TUFDQSxJQUFJUyxzQkFBc0IsRUFBRVQsSUFBSSxLQUFLLGdCQUFnQixFQUFFO1FBQ3JELE1BQU1VLGFBQWEsR0FBR0Qsc0JBQXNCLElBQUk7VUFDOUNULElBQUksRUFBRSxNQUFNO1VBQ1pXLElBQUksRUFBRSxNQUFNO1VBQ1pDLE1BQU0sRUFBRSxNQUFNO1VBQ2RDLFdBQVcsQ0FBQyxFQUFFLE1BQU07UUFDdEIsQ0FBQztRQUNELE9BQ0UsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUNWLEtBQUssQ0FBQyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLGNBQWMsQ0FBQyxJQUFJLENBQ0gsS0FBSyxDQUFDLENBQUNDLFFBQVEsQ0FBQyxDQUNqQixDQUFDLElBQUlDLFdBQVcsR0FBRzNDLE9BQU8sQ0FBQ29ELE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSTtBQUMxRCxjQUFjLENBQUMsZUFBZTtBQUM5QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSTtBQUM3QyxnQkFBZ0IsQ0FBQyxJQUFJO0FBQ3JCLGtCQUFrQixDQUFDLEdBQUc7QUFDdEIsa0NBQWtDLENBQUNKLGFBQWEsQ0FBQ0UsTUFBTTtBQUN2RCxrQkFBa0IsQ0FBQ0YsYUFBYSxDQUFDRyxXQUFXLElBQ3hCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUNILGFBQWEsQ0FBQ0csV0FBVyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQ3BEO0FBQ25CLGdCQUFnQixFQUFFLElBQUk7QUFDdEIsY0FBYyxFQUFFLGVBQWU7QUFDL0IsWUFBWSxFQUFFLEdBQUcsQ0FBQztNQUVWOztNQUVBO01BQ0EsT0FDRSxDQUFDLHNCQUFzQixDQUNyQixHQUFHLENBQUMsQ0FBQ1YsS0FBSyxDQUFDLENBQ1gsV0FBVyxDQUFDLENBQUNFLFdBQVcsQ0FBQyxDQUN6QixRQUFRLENBQUMsQ0FBQ0QsUUFBUSxDQUFDLENBQ25CLE9BQU8sQ0FBQyxDQUFDTixLQUFHLENBQUNoQixPQUFPLENBQUMsQ0FDckIsT0FBTyxDQUFDLENBQUNnQixLQUFHLENBQUNkLE9BQU8sQ0FBQyxDQUNyQixnQkFBZ0IsQ0FBQyxDQUFDTCxnQkFBZ0IsQ0FBQyxHQUNuQztJQUVOLENBQUMsQ0FBQztBQUNSLElBQUksRUFBRSxHQUFHLENBQUM7QUFFVjtBQUVBLEtBQUtvQywyQkFBMkIsR0FBRztFQUNqQ1YsV0FBVyxFQUFFLE1BQU07RUFDbkJELFFBQVEsRUFBRXBDLFNBQVMsQ0FBQyxPQUFPLENBQUM7RUFDNUJjLE9BQU8sRUFBRSxNQUFNO0VBQ2ZFLE9BQU8sQ0FBQyxFQUFFLE1BQU07RUFDaEJMLGdCQUFnQixDQUFDLEVBQUUsT0FBTztBQUM1QixDQUFDO0FBRUQsT0FBTyxTQUFBcUMsdUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBZ0M7SUFBQWQsV0FBQTtJQUFBRCxRQUFBO0lBQUF0QixPQUFBO0lBQUFFLE9BQUE7SUFBQUw7RUFBQSxJQUFBc0MsRUFNVDtFQUlFLE1BQUFHLEVBQUEsT0FBSWYsV0FBVyxHQUFHM0MsT0FBTyxDQUFBb0QsT0FBUSxFQUFFO0VBQUEsSUFBQU8sRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQWQsUUFBQSxJQUFBYyxDQUFBLFFBQUFFLEVBQUE7SUFBM0RDLEVBQUEsSUFBQyxJQUFJLENBQVFqQixLQUFRLENBQVJBLFNBQU8sQ0FBQyxDQUFHLENBQUFnQixFQUFrQyxDQUFFLEVBQTNELElBQUksQ0FBOEQ7SUFBQUYsQ0FBQSxNQUFBZCxRQUFBO0lBQUFjLENBQUEsTUFBQUUsRUFBQTtJQUFBRixDQUFBLE1BQUFHLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFILENBQUE7RUFBQTtFQUFBLElBQUFJLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFsQyxPQUFBO0lBQ2xFc0MsRUFBQSxHQUFBdEMsT0FBa0MsSUFBdkIsQ0FBQyxJQUFJLENBQUMsQ0FBRUEsUUFBTSxDQUFFLEVBQWYsSUFBSSxDQUFrQjtJQUFBa0MsQ0FBQSxNQUFBbEMsT0FBQTtJQUFBa0MsQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBRyxFQUFBLElBQUFILENBQUEsUUFBQUksRUFBQTtJQUZyQ0MsRUFBQSxJQUFDLEdBQUcsQ0FDRixDQUFBRixFQUFrRSxDQUNqRSxDQUFBQyxFQUFpQyxDQUNwQyxFQUhDLEdBQUcsQ0FHRTtJQUFBSixDQUFBLE1BQUFHLEVBQUE7SUFBQUgsQ0FBQSxNQUFBSSxFQUFBO0lBQUFKLENBQUEsTUFBQUssRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUwsQ0FBQTtFQUFBO0VBQUEsSUFBQU0sRUFBQTtFQUFBLElBQUFOLENBQUEsUUFBQXBDLE9BQUEsSUFBQW9DLENBQUEsUUFBQXZDLGdCQUFBO0lBQ0w2QyxFQUFBLEdBQUE3QyxnQkFNQSxJQUxDLENBQUMsR0FBRyxDQUFjLFdBQUMsQ0FBRCxHQUFDLENBQ2pCLENBQUMsSUFBSSxDQUNILENBQUMsSUFBSSxDQUFFRyxRQUFNLENBQUUsRUFBZCxJQUFJLENBQ1AsRUFGQyxJQUFJLENBR1AsRUFKQyxHQUFHLENBS0w7SUFBQW9DLENBQUEsTUFBQXBDLE9BQUE7SUFBQW9DLENBQUEsTUFBQXZDLGdCQUFBO0lBQUF1QyxDQUFBLE9BQUFNLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFOLENBQUE7RUFBQTtFQUFBLElBQUFPLEVBQUE7RUFBQSxJQUFBUCxDQUFBLFNBQUFLLEVBQUEsSUFBQUwsQ0FBQSxTQUFBTSxFQUFBO0lBWEhDLEVBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FBWSxTQUFDLENBQUQsR0FBQyxDQUN0QyxDQUFBRixFQUdLLENBQ0osQ0FBQUMsRUFNRCxDQUNGLEVBWkMsR0FBRyxDQVlFO0lBQUFOLENBQUEsT0FBQUssRUFBQTtJQUFBTCxDQUFBLE9BQUFNLEVBQUE7SUFBQU4sQ0FBQSxPQUFBTyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUCxDQUFBO0VBQUE7RUFBQSxPQVpOTyxFQVlNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
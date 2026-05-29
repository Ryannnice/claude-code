// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 sample，将 lodash-es/sample.js 中已经封装好的能力接到本文件流程里。
import sample from 'lodash-es/sample.js';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useRef, useState } from 'react';
// 引入 getSpinnerVerbs，将 ../../constants/spinnerVerbs.js 中已经封装好的能力接到本文件流程里。
import { getSpinnerVerbs } from '../../constants/spinnerVerbs.js';
// 引入 TURN_COMPLETION_VERBS，将 ../../constants/turnCompletionVerbs.js 中已经封装好的能力接到本文件流程里。
import { TURN_COMPLETION_VERBS } from '../../constants/turnCompletionVerbs.js';
// 引入 useElapsedTime，将 ../../hooks/useElapsedTime.js 中已经封装好的能力接到本文件流程里。
import { useElapsedTime } from '../../hooks/useElapsedTime.js';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { InProcessTeammateTaskState } 来自 ../../tasks/InProcessTeammateTask/types.js，用于校准终端渲染的数据契约。
import type { InProcessTeammateTaskState } from '../../tasks/InProcessTeammateTask/types.js';
// 复用 summarizeRecentActivities 工具函数，把通用处理留在 ../../utils/collapseReadSearch.js 中维护。
import { summarizeRecentActivities } from '../../utils/collapseReadSearch.js';
// 复用 formatDuration、formatNumber、truncateToWidth 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatDuration, formatNumber, truncateToWidth } from '../../utils/format.js';
// 复用 toInkColor 工具函数，把通用处理留在 ../../utils/ink.js 中维护。
import { toInkColor } from '../../utils/ink.js';
// 引入 TEAMMATE_SELECT_HINT，将 ./teammateSelectHint.js 中已经封装好的能力接到本文件流程里。
import { TEAMMATE_SELECT_HINT } from './teammateSelectHint.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  teammate: InProcessTeammateTaskState;
  isLast: boolean;
  isSelected?: boolean;
  isForegrounded?: boolean;
  allIdle?: boolean;
  showPreview?: boolean;
};

/**
 * Extract the last 3 lines of content from a teammate's conversation.
 * Shows recent activity from any message type (user or assistant).
 */
// getMessagePreview 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMessagePreview(messages: InProcessTeammateTaskState['messages']): string[] {
  // 满足 `!messages?.length` 时，终端渲染执行该分支。
  if (!messages?.length) return [];
  // allLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allLines: string[] = [];
  // maxLineLength 数量保存`80`，供终端 UI Teammate Spinner Line后续判断或输出使用。
  const maxLineLength = 80;

  // Collect lines from recent messages (newest first)
  // 循环处理 `let i = messages.length - 1; i >= 0 && allLines.l`，让终端渲染逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0 && allLines.length < 3; i--) {
    // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
    const msg = messages[i];
    // Only process messages that have content (user/assistant messages)
    // `!msg || msg.type` 与 `'user' && msg.type !== 'assi` 不一致时刷新派生状态，避免使用过期结果。
    if (!msg || msg.type !== 'user' && msg.type !== 'assistant' || !msg.message?.content?.length) {
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue;
    }
    // 文本内容 命名 `msg.message.content`，让后续代码直接表达这个值的用途。
    const content = msg.message.content;
    // 按顺序遍历 `content` 中的block，逐个交给终端渲染处理。
    for (const block of content) {
      // 满足 `allLines.length >= 3` 时，终端渲染执行该分支。
      if (allLines.length >= 3) break;
      // `!block || typeof block` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
      if (!block || typeof block !== 'object') continue;
      // 当 `'type' in block && block.type` 匹配 `'tool_use' && '` 时，终端渲染执行对应分支。
      if ('type' in block && block.type === 'tool_use' && 'name' in block) {
        // Try to show meaningful info from tool input
        // 用户输入 命名 `'input' in block ? block.input as Record<string, unknown>...`，让后续代码直接表达这个值的用途。
        const input = 'input' in block ? block.input as Record<string, unknown> : null;
        // toolLine固定为 ``Using ${block.name}…``，作为终端 UI Teammate Spinner Line后续展示或比较的基准。
        let toolLine = `Using ${block.name}…`;
        // 满足 `input` 时，终端渲染执行该分支。
        if (input) {
          // Look for common descriptive fields
          // desc标记终端 UI Teammate Spinner Line是否启用对应路径。
          const desc = input.description as string | undefined || input.prompt as string | undefined || input.command as string | undefined || input.query as string | undefined || input.pattern as string | undefined;
          // 满足 `desc` 时，终端渲染执行该分支。
          if (desc) {
            // toolLine更新为 `desc.split('\n')[0] ?? toolLine`，确保终端 UI后续读取最新状态。
            toolLine = desc.split('\n')[0] ?? toolLine;
          }
        }
        // allLines 集合追加新条目，保持收集顺序与输入顺序一致。
        allLines.push(truncateToWidth(toolLine, maxLineLength));
      // 终端 UI 组件 Teammate Spinner Line在这里处理 `} else if ('type' in block && block.type === 'text' && 'text' in block)...`，完成这一小步状态转换。
      } else if ('type' in block && block.type === 'text' && 'text' in block) {
        // textLines 集合格式化`split`，供终端渲染后续处理使用。
        const textLines = (block.text as string).split('\n').filter(l => l.trim());
        // Take from end of text (most recent lines)
        // 循环处理 `let j = textLines.length - 1; j >= 0 && allLines.`，让终端渲染逐项把同类条目按顺序走完。
        for (let j = textLines.length - 1; j >= 0 && allLines.length < 3; j--) {
          // line保存`textLines[j]`，供终端 UI Teammate Spinner Line后续判断或输出使用。
          const line = textLines[j];
          // line缺失时直接走兜底路径，避免终端渲染使用无效输入。
          if (!line) continue;
          // allLines 集合追加新条目，保持收集顺序与输入顺序一致。
          allLines.push(truncateToWidth(line, maxLineLength));
        }
      }
    }
  }

  // Reverse so oldest of the 3 is first (reading order)
  // 返回 `allLines.reverse()`，作为终端渲染这次计算的结果。
  return allLines.reverse();
}
// TeammateSpinnerLine 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TeammateSpinnerLine({
  teammate,
  isLast,
  isSelected,
  isForegrounded,
  allIdle,
  showPreview
}: Props): React.ReactNode {
  // 这个回调绑定到 const [randomVerb] = useState(() => teammate.spinnerVerb ?? sample(getSpinnerVerbs()…，负责终端渲染在该局部场景下的响应。
  const [randomVerb] = useState(() => teammate.spinnerVerb ?? sample(getSpinnerVerbs()));
  // 这个回调绑定到 const [pastTenseVerb] = useState(() => teammate.pastTenseVerb ?? sample(TURN_COMPLET…，负责终端渲染在该局部场景下的响应。
  const [pastTenseVerb] = useState(() => teammate.pastTenseVerb ?? sample(TURN_COMPLETION_VERBS));
  // isHighlighted标记终端 UI Teammate Spinner Line是否启用对应路径。
  const isHighlighted = isSelected || isForegrounded;
  // treeChar保存`isHighlighted ? isLast ? '╘═' : '╞═' : isLast ? '└─' : '├...`，供终端 UI Teammate Spinner Line后续判断或输出使用。
  const treeChar = isHighlighted ? isLast ? '╘═' : '╞═' : isLast ? '└─' : '├─';
  // nameColor保存`toInkColor`，供终端渲染后续处理使用。
  const nameColor = toInkColor(teammate.identity.color);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();

  // Track when teammate became idle (for "Idle for X..." display)
  // idleStartRef 引用保存 hook 状态，让终端 UI Teammate Spinner Line跨渲染复用同一个容器。
  const idleStartRef = useRef<number | null>(null);
  // Freeze elapsed time when entering all-idle state
  // frozenDurationRef 引用保存 hook 状态，让终端 UI Teammate Spinner Line跨渲染复用同一个容器。
  const frozenDurationRef = useRef<string | null>(null);

  // Track idle start time
  // 只有 `teammate.isIdle && idleStartRef.current === null` 满足时，终端渲染才执行该分支。
  if (teammate.isIdle && idleStartRef.current === null) {
    // current更新为 `Date.now()`，确保终端 UI后续读取最新状态。
    idleStartRef.current = Date.now();
  // 终端 UI 组件 Teammate Spinner Line在这里处理 `} else if (!teammate.isIdle) {`，完成这一小步状态转换。
  } else if (!teammate.isIdle) {
    // current更新为 `null`，确保终端 UI后续读取最新状态。
    idleStartRef.current = null;
  }

  // Reset frozen duration when leaving all-idle state
  // `!allIdle && frozenDurationRef.current` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (!allIdle && frozenDurationRef.current !== null) {
    // current更新为 `null`，确保终端 UI后续读取最新状态。
    frozenDurationRef.current = null;
  }

  // Get elapsed idle time (how long they've been idle) - for "Idle for X..." display
  // idleElapsedTime保存`useElapsedTime`，供终端渲染后续处理使用。
  const idleElapsedTime = useElapsedTime(idleStartRef.current ?? Date.now(), teammate.isIdle && !allIdle);

  // Freeze the duration when we first detect all idle
  // Use the teammate's actual work time (since task started) for the past-tense display
  // 只有 `allIdle && frozenDurationRef.current === null` 满足时，终端渲染才执行该分支。
  if (allIdle && frozenDurationRef.current === null) {
    // current更新为 `formatDuration(Math.max(0, Date.now() - teammate.startTim...`，确保终端 UI后续读取最新状态。
    frozenDurationRef.current = formatDuration(Math.max(0, Date.now() - teammate.startTime - (teammate.totalPausedMs ?? 0)));
  }

  // Use frozen work duration when all idle, otherwise use idle elapsed time
  // displayTime封装成回调，供终端 UI Teammate Spinner Line在事件触发或异步步骤中调用。
  const displayTime = allIdle ? frozenDurationRef.current ?? (() => {
    // 抛出 new Error(`frozenDurationRef is null for idle teammate ${teammate.identity.agentName}`);，阻止终端渲染在无效状态下继续运行。
    throw new Error(`frozenDurationRef is null for idle teammate ${teammate.identity.agentName}`);
  })() : idleElapsedTime;

  // Layout: paddingLeft(3) + pointer(1) + space(1) + treeChar(2) + space(1) = 8 fixed chars
  // Then optionally: @name + ": " OR just ": "
  // Then: activity text + optional extras (stats, hints)
  // basePrefix 命名 `8`，让后续代码直接表达这个值的用途。
  const basePrefix = 8;
  // fullAgentName保存``@${teammate.identity.agentName}``，作为后续固定文本处理的输入。
  const fullAgentName = `@${teammate.identity.agentName}`;
  // fullNameWidth保存`stringWidth`，供终端渲染后续处理使用。
  const fullNameWidth = stringWidth(fullAgentName);

  // Get stats from progress
  // toolUseCount 数量保存`teammate.progress?.toolUseCount ?? 0`，供后续判断或组装使用。
  const toolUseCount = teammate.progress?.toolUseCount ?? 0;
  // tokenCount 数量保存`teammate.progress?.tokenCount ?? 0`，供终端 UI Teammate Spinner Line后续判断或输出使用。
  const tokenCount = teammate.progress?.tokenCount ?? 0;
  // statsText格式化`formatNumber`，供终端渲染后续处理使用。
  const statsText = ` · ${toolUseCount} tool ${toolUseCount === 1 ? 'use' : 'uses'} · ${formatNumber(tokenCount)} tokens`;
  // statsWidth保存`stringWidth`，供终端渲染后续处理使用。
  const statsWidth = stringWidth(statsText);
  // selectHintText固定为 `` · ${TEAMMATE_SELECT_HINT}``，作为终端 UI Teammate Spinner Line后续展示或比较的基准。
  const selectHintText = ` · ${TEAMMATE_SELECT_HINT}`;
  // selectHintWidth保存`stringWidth`，供终端渲染后续处理使用。
  const selectHintWidth = stringWidth(selectHintText);
  // viewHintText固定为 `' · enter to view'`，作为终端 UI Teammate Spinner Line后续展示或比较的基准。
  const viewHintText = ' · enter to view';
  // viewHintWidth保存`stringWidth`，供终端渲染后续处理使用。
  const viewHintWidth = stringWidth(viewHintText);

  // Progressive responsive layout:
  // Wide (80+): full name + activity + stats + hint
  // Medium (60-80): full name + activity
  // Narrow (<60): hide name, just show activity
  // minActivityWidth 命名 `25`，让后续代码直接表达这个值的用途。
  const minActivityWidth = 25;

  // Hide name on narrow terminals (< 60 cols) or if there's not enough room
  // spaceWithFullName保存`columns - basePrefix - fullNameWidth - 2`，供后续判断或组装使用。
  const spaceWithFullName = columns - basePrefix - fullNameWidth - 2;
  // showName标记终端 UI Teammate Spinner Line是否启用对应路径。
  const showName = columns >= 60 && spaceWithFullName >= minActivityWidth;
  // nameWidth 命名 `showName ? fullNameWidth + 2 : 0; // +2 for ": " when nam...`，让后续代码直接表达这个值的用途。
  const nameWidth = showName ? fullNameWidth + 2 : 0; // +2 for ": " when name shown
  // availableForActivity保存`columns - basePrefix - nameWidth`，供后续判断或组装使用。
  const availableForActivity = columns - basePrefix - nameWidth;

  // Progressive hiding: view hint → select hint → stats
  // Stats always visible (dimmed when not selected); hints only when highlighted/selected
  // showViewHint标记终端 UI Teammate Spinner Line是否启用对应路径。
  const showViewHint = isSelected && !isForegrounded && availableForActivity > viewHintWidth + statsWidth + minActivityWidth + 5;
  // showSelectHint标记终端 UI Teammate Spinner Line是否启用对应路径。
  const showSelectHint = isHighlighted && availableForActivity > selectHintWidth + (showViewHint ? viewHintWidth : 0) + statsWidth + minActivityWidth + 5;
  // showStats 集合保存`availableForActivity > statsWidth + minActivityWidth + 5`，供终端 UI Teammate Spinner Line后续判断或输出使用。
  const showStats = availableForActivity > statsWidth + minActivityWidth + 5;

  // Activity text gets remaining space
  // extrasCost 命名 `(showStats ? statsWidth : 0) + (showSelectHint ? selectHi...`，让后续代码直接表达这个值的用途。
  const extrasCost = (showStats ? statsWidth : 0) + (showSelectHint ? selectHintWidth : 0) + (showViewHint ? viewHintWidth : 0);
  // activityMaxWidth保存`Math.max`，供终端渲染后续处理使用。
  const activityMaxWidth = Math.max(minActivityWidth, availableForActivity - extrasCost - 1);

  // Format the activity text for active teammates, rolling up search/read ops
  // activityText封装成回调，供终端 UI Teammate Spinner Line在事件触发或异步步骤中调用。
  const activityText = (() => {
    // activities 集合保存`teammate.progress?.recentActivities`，供终端 UI Teammate Spinner Line后续判断或输出使用。
    const activities = teammate.progress?.recentActivities;
    // 只有 `activities && activities.length > 0` 满足时，终端渲染才执行该分支。
    if (activities && activities.length > 0) {
      // summary保存`summarizeRecentActivities`，供终端渲染后续处理使用。
      const summary = summarizeRecentActivities(activities);
      // 满足 `summary) return truncateToWidth(summary, activityMaxWidth` 时，终端渲染执行该分支。
      if (summary) return truncateToWidth(summary, activityMaxWidth);
    }
    // desc保存`teammate.progress?.lastActivity?.activityDescription`，供终端 UI Teammate Spinner Line后续判断或输出使用。
    const desc = teammate.progress?.lastActivity?.activityDescription;
    // 满足 `desc) return truncateToWidth(desc, activityMaxWidth` 时，终端渲染执行该分支。
    if (desc) return truncateToWidth(desc, activityMaxWidth);
    // 返回 `randomVerb`，作为终端渲染这次计算的结果。
    return randomVerb;
  })();

  // Status rendering logic
  // renderStatus 集合封装成回调，供终端 UI Teammate Spinner Line在事件触发或异步步骤中调用。
  const renderStatus = (): React.ReactNode => {
    // 满足 `teammate.shutdownRequested` 时，终端渲染执行该分支。
    if (teammate.shutdownRequested) {
      // 返回 `<Text dimColor>[stopping]</Text>`，作为终端渲染这次计算的结果。
      return <Text dimColor>[stopping]</Text>;
    }
    // 满足 `teammate.awaitingPlanApproval` 时，终端渲染执行该分支。
    if (teammate.awaitingPlanApproval) {
      // 返回 `<Text color="warning">[awaiting approval]</Text>`，作为终端渲染这次计算的结果。
      return <Text color="warning">[awaiting approval]</Text>;
    }
    // 满足 `teammate.isIdle` 时，终端渲染执行该分支。
    if (teammate.isIdle) {
      // 满足 `allIdle` 时，终端渲染执行该分支。
      if (allIdle) {
        // 返回 `<Text dimColor>`，作为终端渲染这次计算的结果。
        return <Text dimColor>
            {pastTenseVerb} for {displayTime}
          </Text>;
      }
      // 返回 `<Text dimColor>Idle for {idleElapsedTime}</Text>`，作为终端渲染这次计算的结果。
      return <Text dimColor>Idle for {idleElapsedTime}</Text>;
    }
    // Active - show spinner glyph + activity description (only when not highlighted;
    // when highlighted, the main spinner above already shows the verb)
    // 满足 `isHighlighted` 时，终端渲染执行该分支。
    if (isHighlighted) {
      // 返回 `null`，作为终端渲染这次计算的结果。
      return null;
    }
    // 返回 `<Text dimColor>`，作为终端渲染这次计算的结果。
    return <Text dimColor>
        {activityText?.endsWith('…') ? activityText : `${activityText}…`}
      </Text>;
  };

  // Get preview lines if enabled
  // previewLines 集合读取`getMessagePreview`，供终端渲染后续处理使用。
  const previewLines = showPreview ? getMessagePreview(teammate.messages) : [];

  // Tree continuation character for preview lines
  // previewTreeChar保存`isLast ? ' ' : '│ '`，供后续判断或组装使用。
  const previewTreeChar = isLast ? '   ' : '│  ';
  // 返回 `<Box flexDirection="column">`，作为终端渲染这次计算的结果。
  return <Box flexDirection="column">
      <Box paddingLeft={3}>
        {/* Selection indicator: pointer when selected, otherwise space */}
        <Text color={isSelected ? 'suggestion' : undefined} bold={isSelected}>
          {isSelected ? figures.pointer : ' '}
        </Text>
        <Text dimColor={!isSelected}>{treeChar} </Text>
        {/* Agent name: hidden on very narrow screens */}
        {showName && <Text color={isSelected ? 'suggestion' : nameColor}>
            @{teammate.identity.agentName}
          </Text>}
        {showName && <Text dimColor={!isSelected}>: </Text>}
        {renderStatus()}
        {/* Stats: only shown when selected and terminal is wide enough */}
        {showStats && <Text dimColor>
            {' '}
            · {toolUseCount} tool {toolUseCount === 1 ? 'use' : 'uses'} ·{' '}
            {formatNumber(tokenCount)} tokens
          </Text>}
        {/* Hints: select hint when highlighted, view hint when selected but not foregrounded */}
        {showSelectHint && <Text dimColor> · {TEAMMATE_SELECT_HINT}</Text>}
        {showViewHint && <Text dimColor> · enter to view</Text>}
      </Box>
      {/* Preview lines */}
      {/* 这个回调绑定到 {previewLines.map((line, idx) => <Box key={idx} paddingLeft={3}>，负责终端渲染在该局部场景下的响应。 */}
      {previewLines.map((line, idx) => <Box key={idx} paddingLeft={3}>
          <Text dimColor> </Text>
          <Text dimColor>{previewTreeChar} </Text>
          <Text dimColor>{line}</Text>
        </Box>)}
    </Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwic2FtcGxlIiwiUmVhY3QiLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsImdldFNwaW5uZXJWZXJicyIsIlRVUk5fQ09NUExFVElPTl9WRVJCUyIsInVzZUVsYXBzZWRUaW1lIiwidXNlVGVybWluYWxTaXplIiwic3RyaW5nV2lkdGgiLCJCb3giLCJUZXh0IiwiSW5Qcm9jZXNzVGVhbW1hdGVUYXNrU3RhdGUiLCJzdW1tYXJpemVSZWNlbnRBY3Rpdml0aWVzIiwiZm9ybWF0RHVyYXRpb24iLCJmb3JtYXROdW1iZXIiLCJ0cnVuY2F0ZVRvV2lkdGgiLCJ0b0lua0NvbG9yIiwiVEVBTU1BVEVfU0VMRUNUX0hJTlQiLCJQcm9wcyIsInRlYW1tYXRlIiwiaXNMYXN0IiwiaXNTZWxlY3RlZCIsImlzRm9yZWdyb3VuZGVkIiwiYWxsSWRsZSIsInNob3dQcmV2aWV3IiwiZ2V0TWVzc2FnZVByZXZpZXciLCJtZXNzYWdlcyIsImxlbmd0aCIsImFsbExpbmVzIiwibWF4TGluZUxlbmd0aCIsImkiLCJtc2ciLCJ0eXBlIiwibWVzc2FnZSIsImNvbnRlbnQiLCJibG9jayIsImlucHV0IiwiUmVjb3JkIiwidG9vbExpbmUiLCJuYW1lIiwiZGVzYyIsImRlc2NyaXB0aW9uIiwicHJvbXB0IiwiY29tbWFuZCIsInF1ZXJ5IiwicGF0dGVybiIsInNwbGl0IiwicHVzaCIsInRleHRMaW5lcyIsInRleHQiLCJmaWx0ZXIiLCJsIiwidHJpbSIsImoiLCJsaW5lIiwicmV2ZXJzZSIsIlRlYW1tYXRlU3Bpbm5lckxpbmUiLCJSZWFjdE5vZGUiLCJyYW5kb21WZXJiIiwic3Bpbm5lclZlcmIiLCJwYXN0VGVuc2VWZXJiIiwiaXNIaWdobGlnaHRlZCIsInRyZWVDaGFyIiwibmFtZUNvbG9yIiwiaWRlbnRpdHkiLCJjb2xvciIsImNvbHVtbnMiLCJpZGxlU3RhcnRSZWYiLCJmcm96ZW5EdXJhdGlvblJlZiIsImlzSWRsZSIsImN1cnJlbnQiLCJEYXRlIiwibm93IiwiaWRsZUVsYXBzZWRUaW1lIiwiTWF0aCIsIm1heCIsInN0YXJ0VGltZSIsInRvdGFsUGF1c2VkTXMiLCJkaXNwbGF5VGltZSIsIkVycm9yIiwiYWdlbnROYW1lIiwiYmFzZVByZWZpeCIsImZ1bGxBZ2VudE5hbWUiLCJmdWxsTmFtZVdpZHRoIiwidG9vbFVzZUNvdW50IiwicHJvZ3Jlc3MiLCJ0b2tlbkNvdW50Iiwic3RhdHNUZXh0Iiwic3RhdHNXaWR0aCIsInNlbGVjdEhpbnRUZXh0Iiwic2VsZWN0SGludFdpZHRoIiwidmlld0hpbnRUZXh0Iiwidmlld0hpbnRXaWR0aCIsIm1pbkFjdGl2aXR5V2lkdGgiLCJzcGFjZVdpdGhGdWxsTmFtZSIsInNob3dOYW1lIiwibmFtZVdpZHRoIiwiYXZhaWxhYmxlRm9yQWN0aXZpdHkiLCJzaG93Vmlld0hpbnQiLCJzaG93U2VsZWN0SGludCIsInNob3dTdGF0cyIsImV4dHJhc0Nvc3QiLCJhY3Rpdml0eU1heFdpZHRoIiwiYWN0aXZpdHlUZXh0IiwiYWN0aXZpdGllcyIsInJlY2VudEFjdGl2aXRpZXMiLCJzdW1tYXJ5IiwibGFzdEFjdGl2aXR5IiwiYWN0aXZpdHlEZXNjcmlwdGlvbiIsInJlbmRlclN0YXR1cyIsInNodXRkb3duUmVxdWVzdGVkIiwiYXdhaXRpbmdQbGFuQXBwcm92YWwiLCJlbmRzV2l0aCIsInByZXZpZXdMaW5lcyIsInByZXZpZXdUcmVlQ2hhciIsInVuZGVmaW5lZCIsInBvaW50ZXIiLCJtYXAiLCJpZHgiXSwic291cmNlcyI6WyJUZWFtbWF0ZVNwaW5uZXJMaW5lLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0IHNhbXBsZSBmcm9tICdsb2Rhc2gtZXMvc2FtcGxlLmpzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBnZXRTcGlubmVyVmVyYnMgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvc3Bpbm5lclZlcmJzLmpzJ1xuaW1wb3J0IHsgVFVSTl9DT01QTEVUSU9OX1ZFUkJTIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL3R1cm5Db21wbGV0aW9uVmVyYnMuanMnXG5pbXBvcnQgeyB1c2VFbGFwc2VkVGltZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZUVsYXBzZWRUaW1lLmpzJ1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi8uLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IEluUHJvY2Vzc1RlYW1tYXRlVGFza1N0YXRlIH0gZnJvbSAnLi4vLi4vdGFza3MvSW5Qcm9jZXNzVGVhbW1hdGVUYXNrL3R5cGVzLmpzJ1xuaW1wb3J0IHsgc3VtbWFyaXplUmVjZW50QWN0aXZpdGllcyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbGxhcHNlUmVhZFNlYXJjaC5qcydcbmltcG9ydCB7XG4gIGZvcm1hdER1cmF0aW9uLFxuICBmb3JtYXROdW1iZXIsXG4gIHRydW5jYXRlVG9XaWR0aCxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvZm9ybWF0LmpzJ1xuaW1wb3J0IHsgdG9JbmtDb2xvciB9IGZyb20gJy4uLy4uL3V0aWxzL2luay5qcydcbmltcG9ydCB7IFRFQU1NQVRFX1NFTEVDVF9ISU5UIH0gZnJvbSAnLi90ZWFtbWF0ZVNlbGVjdEhpbnQuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHRlYW1tYXRlOiBJblByb2Nlc3NUZWFtbWF0ZVRhc2tTdGF0ZVxuICBpc0xhc3Q6IGJvb2xlYW5cbiAgaXNTZWxlY3RlZD86IGJvb2xlYW5cbiAgaXNGb3JlZ3JvdW5kZWQ/OiBib29sZWFuXG4gIGFsbElkbGU/OiBib29sZWFuXG4gIHNob3dQcmV2aWV3PzogYm9vbGVhblxufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGxhc3QgMyBsaW5lcyBvZiBjb250ZW50IGZyb20gYSB0ZWFtbWF0ZSdzIGNvbnZlcnNhdGlvbi5cbiAqIFNob3dzIHJlY2VudCBhY3Rpdml0eSBmcm9tIGFueSBtZXNzYWdlIHR5cGUgKHVzZXIgb3IgYXNzaXN0YW50KS5cbiAqL1xuZnVuY3Rpb24gZ2V0TWVzc2FnZVByZXZpZXcoXG4gIG1lc3NhZ2VzOiBJblByb2Nlc3NUZWFtbWF0ZVRhc2tTdGF0ZVsnbWVzc2FnZXMnXSxcbik6IHN0cmluZ1tdIHtcbiAgaWYgKCFtZXNzYWdlcz8ubGVuZ3RoKSByZXR1cm4gW11cblxuICBjb25zdCBhbGxMaW5lczogc3RyaW5nW10gPSBbXVxuICBjb25zdCBtYXhMaW5lTGVuZ3RoID0gODBcblxuICAvLyBDb2xsZWN0IGxpbmVzIGZyb20gcmVjZW50IG1lc3NhZ2VzIChuZXdlc3QgZmlyc3QpXG4gIGZvciAobGV0IGkgPSBtZXNzYWdlcy5sZW5ndGggLSAxOyBpID49IDAgJiYgYWxsTGluZXMubGVuZ3RoIDwgMzsgaS0tKSB7XG4gICAgY29uc3QgbXNnID0gbWVzc2FnZXNbaV1cbiAgICAvLyBPbmx5IHByb2Nlc3MgbWVzc2FnZXMgdGhhdCBoYXZlIGNvbnRlbnQgKHVzZXIvYXNzaXN0YW50IG1lc3NhZ2VzKVxuICAgIGlmIChcbiAgICAgICFtc2cgfHxcbiAgICAgIChtc2cudHlwZSAhPT0gJ3VzZXInICYmIG1zZy50eXBlICE9PSAnYXNzaXN0YW50JykgfHxcbiAgICAgICFtc2cubWVzc2FnZT8uY29udGVudD8ubGVuZ3RoXG4gICAgKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cbiAgICBjb25zdCBjb250ZW50ID0gbXNnLm1lc3NhZ2UuY29udGVudFxuXG4gICAgZm9yIChjb25zdCBibG9jayBvZiBjb250ZW50KSB7XG4gICAgICBpZiAoYWxsTGluZXMubGVuZ3RoID49IDMpIGJyZWFrXG4gICAgICBpZiAoIWJsb2NrIHx8IHR5cGVvZiBibG9jayAhPT0gJ29iamVjdCcpIGNvbnRpbnVlXG5cbiAgICAgIGlmICgndHlwZScgaW4gYmxvY2sgJiYgYmxvY2sudHlwZSA9PT0gJ3Rvb2xfdXNlJyAmJiAnbmFtZScgaW4gYmxvY2spIHtcbiAgICAgICAgLy8gVHJ5IHRvIHNob3cgbWVhbmluZ2Z1bCBpbmZvIGZyb20gdG9vbCBpbnB1dFxuICAgICAgICBjb25zdCBpbnB1dCA9XG4gICAgICAgICAgJ2lucHV0JyBpbiBibG9jayA/IChibG9jay5pbnB1dCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgOiBudWxsXG4gICAgICAgIGxldCB0b29sTGluZSA9IGBVc2luZyAke2Jsb2NrLm5hbWV94oCmYFxuICAgICAgICBpZiAoaW5wdXQpIHtcbiAgICAgICAgICAvLyBMb29rIGZvciBjb21tb24gZGVzY3JpcHRpdmUgZmllbGRzXG4gICAgICAgICAgY29uc3QgZGVzYyA9XG4gICAgICAgICAgICAoaW5wdXQuZGVzY3JpcHRpb24gYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSB8fFxuICAgICAgICAgICAgKGlucHV0LnByb21wdCBhcyBzdHJpbmcgfCB1bmRlZmluZWQpIHx8XG4gICAgICAgICAgICAoaW5wdXQuY29tbWFuZCBhcyBzdHJpbmcgfCB1bmRlZmluZWQpIHx8XG4gICAgICAgICAgICAoaW5wdXQucXVlcnkgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSB8fFxuICAgICAgICAgICAgKGlucHV0LnBhdHRlcm4gYXMgc3RyaW5nIHwgdW5kZWZpbmVkKVxuICAgICAgICAgIGlmIChkZXNjKSB7XG4gICAgICAgICAgICB0b29sTGluZSA9IGRlc2Muc3BsaXQoJ1xcbicpWzBdID8/IHRvb2xMaW5lXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGFsbExpbmVzLnB1c2godHJ1bmNhdGVUb1dpZHRoKHRvb2xMaW5lLCBtYXhMaW5lTGVuZ3RoKSlcbiAgICAgIH0gZWxzZSBpZiAoJ3R5cGUnIGluIGJsb2NrICYmIGJsb2NrLnR5cGUgPT09ICd0ZXh0JyAmJiAndGV4dCcgaW4gYmxvY2spIHtcbiAgICAgICAgY29uc3QgdGV4dExpbmVzID0gKGJsb2NrLnRleHQgYXMgc3RyaW5nKVxuICAgICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgICAuZmlsdGVyKGwgPT4gbC50cmltKCkpXG4gICAgICAgIC8vIFRha2UgZnJvbSBlbmQgb2YgdGV4dCAobW9zdCByZWNlbnQgbGluZXMpXG4gICAgICAgIGZvciAobGV0IGogPSB0ZXh0TGluZXMubGVuZ3RoIC0gMTsgaiA+PSAwICYmIGFsbExpbmVzLmxlbmd0aCA8IDM7IGotLSkge1xuICAgICAgICAgIGNvbnN0IGxpbmUgPSB0ZXh0TGluZXNbal1cbiAgICAgICAgICBpZiAoIWxpbmUpIGNvbnRpbnVlXG4gICAgICAgICAgYWxsTGluZXMucHVzaCh0cnVuY2F0ZVRvV2lkdGgobGluZSwgbWF4TGluZUxlbmd0aCkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBSZXZlcnNlIHNvIG9sZGVzdCBvZiB0aGUgMyBpcyBmaXJzdCAocmVhZGluZyBvcmRlcilcbiAgcmV0dXJuIGFsbExpbmVzLnJldmVyc2UoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gVGVhbW1hdGVTcGlubmVyTGluZSh7XG4gIHRlYW1tYXRlLFxuICBpc0xhc3QsXG4gIGlzU2VsZWN0ZWQsXG4gIGlzRm9yZWdyb3VuZGVkLFxuICBhbGxJZGxlLFxuICBzaG93UHJldmlldyxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3JhbmRvbVZlcmJdID0gdXNlU3RhdGUoXG4gICAgKCkgPT4gdGVhbW1hdGUuc3Bpbm5lclZlcmIgPz8gc2FtcGxlKGdldFNwaW5uZXJWZXJicygpKSxcbiAgKVxuICBjb25zdCBbcGFzdFRlbnNlVmVyYl0gPSB1c2VTdGF0ZShcbiAgICAoKSA9PiB0ZWFtbWF0ZS5wYXN0VGVuc2VWZXJiID8/IHNhbXBsZShUVVJOX0NPTVBMRVRJT05fVkVSQlMpLFxuICApXG4gIGNvbnN0IGlzSGlnaGxpZ2h0ZWQgPSBpc1NlbGVjdGVkIHx8IGlzRm9yZWdyb3VuZGVkXG4gIGNvbnN0IHRyZWVDaGFyID0gaXNIaWdobGlnaHRlZCA/IChpc0xhc3QgPyAn4pWY4pWQJyA6ICfilZ7ilZAnKSA6IGlzTGFzdCA/ICfilJTilIAnIDogJ+KUnOKUgCdcbiAgY29uc3QgbmFtZUNvbG9yID0gdG9JbmtDb2xvcih0ZWFtbWF0ZS5pZGVudGl0eS5jb2xvcilcbiAgY29uc3QgeyBjb2x1bW5zIH0gPSB1c2VUZXJtaW5hbFNpemUoKVxuXG4gIC8vIFRyYWNrIHdoZW4gdGVhbW1hdGUgYmVjYW1lIGlkbGUgKGZvciBcIklkbGUgZm9yIFguLi5cIiBkaXNwbGF5KVxuICBjb25zdCBpZGxlU3RhcnRSZWYgPSB1c2VSZWY8bnVtYmVyIHwgbnVsbD4obnVsbClcbiAgLy8gRnJlZXplIGVsYXBzZWQgdGltZSB3aGVuIGVudGVyaW5nIGFsbC1pZGxlIHN0YXRlXG4gIGNvbnN0IGZyb3plbkR1cmF0aW9uUmVmID0gdXNlUmVmPHN0cmluZyB8IG51bGw+KG51bGwpXG5cbiAgLy8gVHJhY2sgaWRsZSBzdGFydCB0aW1lXG4gIGlmICh0ZWFtbWF0ZS5pc0lkbGUgJiYgaWRsZVN0YXJ0UmVmLmN1cnJlbnQgPT09IG51bGwpIHtcbiAgICBpZGxlU3RhcnRSZWYuY3VycmVudCA9IERhdGUubm93KClcbiAgfSBlbHNlIGlmICghdGVhbW1hdGUuaXNJZGxlKSB7XG4gICAgaWRsZVN0YXJ0UmVmLmN1cnJlbnQgPSBudWxsXG4gIH1cblxuICAvLyBSZXNldCBmcm96ZW4gZHVyYXRpb24gd2hlbiBsZWF2aW5nIGFsbC1pZGxlIHN0YXRlXG4gIGlmICghYWxsSWRsZSAmJiBmcm96ZW5EdXJhdGlvblJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgZnJvemVuRHVyYXRpb25SZWYuY3VycmVudCA9IG51bGxcbiAgfVxuXG4gIC8vIEdldCBlbGFwc2VkIGlkbGUgdGltZSAoaG93IGxvbmcgdGhleSd2ZSBiZWVuIGlkbGUpIC0gZm9yIFwiSWRsZSBmb3IgWC4uLlwiIGRpc3BsYXlcbiAgY29uc3QgaWRsZUVsYXBzZWRUaW1lID0gdXNlRWxhcHNlZFRpbWUoXG4gICAgaWRsZVN0YXJ0UmVmLmN1cnJlbnQgPz8gRGF0ZS5ub3coKSxcbiAgICB0ZWFtbWF0ZS5pc0lkbGUgJiYgIWFsbElkbGUsXG4gIClcblxuICAvLyBGcmVlemUgdGhlIGR1cmF0aW9uIHdoZW4gd2UgZmlyc3QgZGV0ZWN0IGFsbCBpZGxlXG4gIC8vIFVzZSB0aGUgdGVhbW1hdGUncyBhY3R1YWwgd29yayB0aW1lIChzaW5jZSB0YXNrIHN0YXJ0ZWQpIGZvciB0aGUgcGFzdC10ZW5zZSBkaXNwbGF5XG4gIGlmIChhbGxJZGxlICYmIGZyb3plbkR1cmF0aW9uUmVmLmN1cnJlbnQgPT09IG51bGwpIHtcbiAgICBmcm96ZW5EdXJhdGlvblJlZi5jdXJyZW50ID0gZm9ybWF0RHVyYXRpb24oXG4gICAgICBNYXRoLm1heChcbiAgICAgICAgMCxcbiAgICAgICAgRGF0ZS5ub3coKSAtIHRlYW1tYXRlLnN0YXJ0VGltZSAtICh0ZWFtbWF0ZS50b3RhbFBhdXNlZE1zID8/IDApLFxuICAgICAgKSxcbiAgICApXG4gIH1cblxuICAvLyBVc2UgZnJvemVuIHdvcmsgZHVyYXRpb24gd2hlbiBhbGwgaWRsZSwgb3RoZXJ3aXNlIHVzZSBpZGxlIGVsYXBzZWQgdGltZVxuICBjb25zdCBkaXNwbGF5VGltZSA9IGFsbElkbGVcbiAgICA/IChmcm96ZW5EdXJhdGlvblJlZi5jdXJyZW50ID8/XG4gICAgICAoKCkgPT4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYGZyb3plbkR1cmF0aW9uUmVmIGlzIG51bGwgZm9yIGlkbGUgdGVhbW1hdGUgJHt0ZWFtbWF0ZS5pZGVudGl0eS5hZ2VudE5hbWV9YCxcbiAgICAgICAgKVxuICAgICAgfSkoKSlcbiAgICA6IGlkbGVFbGFwc2VkVGltZVxuXG4gIC8vIExheW91dDogcGFkZGluZ0xlZnQoMykgKyBwb2ludGVyKDEpICsgc3BhY2UoMSkgKyB0cmVlQ2hhcigyKSArIHNwYWNlKDEpID0gOCBmaXhlZCBjaGFyc1xuICAvLyBUaGVuIG9wdGlvbmFsbHk6IEBuYW1lICsgXCI6IFwiIE9SIGp1c3QgXCI6IFwiXG4gIC8vIFRoZW46IGFjdGl2aXR5IHRleHQgKyBvcHRpb25hbCBleHRyYXMgKHN0YXRzLCBoaW50cylcbiAgY29uc3QgYmFzZVByZWZpeCA9IDhcbiAgY29uc3QgZnVsbEFnZW50TmFtZSA9IGBAJHt0ZWFtbWF0ZS5pZGVudGl0eS5hZ2VudE5hbWV9YFxuICBjb25zdCBmdWxsTmFtZVdpZHRoID0gc3RyaW5nV2lkdGgoZnVsbEFnZW50TmFtZSlcblxuICAvLyBHZXQgc3RhdHMgZnJvbSBwcm9ncmVzc1xuICBjb25zdCB0b29sVXNlQ291bnQgPSB0ZWFtbWF0ZS5wcm9ncmVzcz8udG9vbFVzZUNvdW50ID8/IDBcbiAgY29uc3QgdG9rZW5Db3VudCA9IHRlYW1tYXRlLnByb2dyZXNzPy50b2tlbkNvdW50ID8/IDBcbiAgY29uc3Qgc3RhdHNUZXh0ID0gYCDCtyAke3Rvb2xVc2VDb3VudH0gdG9vbCAke3Rvb2xVc2VDb3VudCA9PT0gMSA/ICd1c2UnIDogJ3VzZXMnfSDCtyAke2Zvcm1hdE51bWJlcih0b2tlbkNvdW50KX0gdG9rZW5zYFxuICBjb25zdCBzdGF0c1dpZHRoID0gc3RyaW5nV2lkdGgoc3RhdHNUZXh0KVxuICBjb25zdCBzZWxlY3RIaW50VGV4dCA9IGAgwrcgJHtURUFNTUFURV9TRUxFQ1RfSElOVH1gXG4gIGNvbnN0IHNlbGVjdEhpbnRXaWR0aCA9IHN0cmluZ1dpZHRoKHNlbGVjdEhpbnRUZXh0KVxuICBjb25zdCB2aWV3SGludFRleHQgPSAnIMK3IGVudGVyIHRvIHZpZXcnXG4gIGNvbnN0IHZpZXdIaW50V2lkdGggPSBzdHJpbmdXaWR0aCh2aWV3SGludFRleHQpXG5cbiAgLy8gUHJvZ3Jlc3NpdmUgcmVzcG9uc2l2ZSBsYXlvdXQ6XG4gIC8vIFdpZGUgKDgwKyk6IGZ1bGwgbmFtZSArIGFjdGl2aXR5ICsgc3RhdHMgKyBoaW50XG4gIC8vIE1lZGl1bSAoNjAtODApOiBmdWxsIG5hbWUgKyBhY3Rpdml0eVxuICAvLyBOYXJyb3cgKDw2MCk6IGhpZGUgbmFtZSwganVzdCBzaG93IGFjdGl2aXR5XG4gIGNvbnN0IG1pbkFjdGl2aXR5V2lkdGggPSAyNVxuXG4gIC8vIEhpZGUgbmFtZSBvbiBuYXJyb3cgdGVybWluYWxzICg8IDYwIGNvbHMpIG9yIGlmIHRoZXJlJ3Mgbm90IGVub3VnaCByb29tXG4gIGNvbnN0IHNwYWNlV2l0aEZ1bGxOYW1lID0gY29sdW1ucyAtIGJhc2VQcmVmaXggLSBmdWxsTmFtZVdpZHRoIC0gMlxuICBjb25zdCBzaG93TmFtZSA9IGNvbHVtbnMgPj0gNjAgJiYgc3BhY2VXaXRoRnVsbE5hbWUgPj0gbWluQWN0aXZpdHlXaWR0aFxuICBjb25zdCBuYW1lV2lkdGggPSBzaG93TmFtZSA/IGZ1bGxOYW1lV2lkdGggKyAyIDogMCAvLyArMiBmb3IgXCI6IFwiIHdoZW4gbmFtZSBzaG93blxuICBjb25zdCBhdmFpbGFibGVGb3JBY3Rpdml0eSA9IGNvbHVtbnMgLSBiYXNlUHJlZml4IC0gbmFtZVdpZHRoXG5cbiAgLy8gUHJvZ3Jlc3NpdmUgaGlkaW5nOiB2aWV3IGhpbnQg4oaSIHNlbGVjdCBoaW50IOKGkiBzdGF0c1xuICAvLyBTdGF0cyBhbHdheXMgdmlzaWJsZSAoZGltbWVkIHdoZW4gbm90IHNlbGVjdGVkKTsgaGludHMgb25seSB3aGVuIGhpZ2hsaWdodGVkL3NlbGVjdGVkXG4gIGNvbnN0IHNob3dWaWV3SGludCA9XG4gICAgaXNTZWxlY3RlZCAmJlxuICAgICFpc0ZvcmVncm91bmRlZCAmJlxuICAgIGF2YWlsYWJsZUZvckFjdGl2aXR5ID4gdmlld0hpbnRXaWR0aCArIHN0YXRzV2lkdGggKyBtaW5BY3Rpdml0eVdpZHRoICsgNVxuICBjb25zdCBzaG93U2VsZWN0SGludCA9XG4gICAgaXNIaWdobGlnaHRlZCAmJlxuICAgIGF2YWlsYWJsZUZvckFjdGl2aXR5ID5cbiAgICAgIHNlbGVjdEhpbnRXaWR0aCArXG4gICAgICAgIChzaG93Vmlld0hpbnQgPyB2aWV3SGludFdpZHRoIDogMCkgK1xuICAgICAgICBzdGF0c1dpZHRoICtcbiAgICAgICAgbWluQWN0aXZpdHlXaWR0aCArXG4gICAgICAgIDVcbiAgY29uc3Qgc2hvd1N0YXRzID0gYXZhaWxhYmxlRm9yQWN0aXZpdHkgPiBzdGF0c1dpZHRoICsgbWluQWN0aXZpdHlXaWR0aCArIDVcblxuICAvLyBBY3Rpdml0eSB0ZXh0IGdldHMgcmVtYWluaW5nIHNwYWNlXG4gIGNvbnN0IGV4dHJhc0Nvc3QgPVxuICAgIChzaG93U3RhdHMgPyBzdGF0c1dpZHRoIDogMCkgK1xuICAgIChzaG93U2VsZWN0SGludCA/IHNlbGVjdEhpbnRXaWR0aCA6IDApICtcbiAgICAoc2hvd1ZpZXdIaW50ID8gdmlld0hpbnRXaWR0aCA6IDApXG4gIGNvbnN0IGFjdGl2aXR5TWF4V2lkdGggPSBNYXRoLm1heChcbiAgICBtaW5BY3Rpdml0eVdpZHRoLFxuICAgIGF2YWlsYWJsZUZvckFjdGl2aXR5IC0gZXh0cmFzQ29zdCAtIDEsXG4gIClcblxuICAvLyBGb3JtYXQgdGhlIGFjdGl2aXR5IHRleHQgZm9yIGFjdGl2ZSB0ZWFtbWF0ZXMsIHJvbGxpbmcgdXAgc2VhcmNoL3JlYWQgb3BzXG4gIGNvbnN0IGFjdGl2aXR5VGV4dCA9ICgoKSA9PiB7XG4gICAgY29uc3QgYWN0aXZpdGllcyA9IHRlYW1tYXRlLnByb2dyZXNzPy5yZWNlbnRBY3Rpdml0aWVzXG4gICAgaWYgKGFjdGl2aXRpZXMgJiYgYWN0aXZpdGllcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBzdW1tYXJ5ID0gc3VtbWFyaXplUmVjZW50QWN0aXZpdGllcyhhY3Rpdml0aWVzKVxuICAgICAgaWYgKHN1bW1hcnkpIHJldHVybiB0cnVuY2F0ZVRvV2lkdGgoc3VtbWFyeSwgYWN0aXZpdHlNYXhXaWR0aClcbiAgICB9XG4gICAgY29uc3QgZGVzYyA9IHRlYW1tYXRlLnByb2dyZXNzPy5sYXN0QWN0aXZpdHk/LmFjdGl2aXR5RGVzY3JpcHRpb25cbiAgICBpZiAoZGVzYykgcmV0dXJuIHRydW5jYXRlVG9XaWR0aChkZXNjLCBhY3Rpdml0eU1heFdpZHRoKVxuICAgIHJldHVybiByYW5kb21WZXJiXG4gIH0pKClcblxuICAvLyBTdGF0dXMgcmVuZGVyaW5nIGxvZ2ljXG4gIGNvbnN0IHJlbmRlclN0YXR1cyA9ICgpOiBSZWFjdC5SZWFjdE5vZGUgPT4ge1xuICAgIGlmICh0ZWFtbWF0ZS5zaHV0ZG93blJlcXVlc3RlZCkge1xuICAgICAgcmV0dXJuIDxUZXh0IGRpbUNvbG9yPltzdG9wcGluZ108L1RleHQ+XG4gICAgfVxuICAgIGlmICh0ZWFtbWF0ZS5hd2FpdGluZ1BsYW5BcHByb3ZhbCkge1xuICAgICAgcmV0dXJuIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlthd2FpdGluZyBhcHByb3ZhbF08L1RleHQ+XG4gICAgfVxuICAgIGlmICh0ZWFtbWF0ZS5pc0lkbGUpIHtcbiAgICAgIGlmIChhbGxJZGxlKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7cGFzdFRlbnNlVmVyYn0gZm9yIHtkaXNwbGF5VGltZX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIHJldHVybiA8VGV4dCBkaW1Db2xvcj5JZGxlIGZvciB7aWRsZUVsYXBzZWRUaW1lfTwvVGV4dD5cbiAgICB9XG4gICAgLy8gQWN0aXZlIC0gc2hvdyBzcGlubmVyIGdseXBoICsgYWN0aXZpdHkgZGVzY3JpcHRpb24gKG9ubHkgd2hlbiBub3QgaGlnaGxpZ2h0ZWQ7XG4gICAgLy8gd2hlbiBoaWdobGlnaHRlZCwgdGhlIG1haW4gc3Bpbm5lciBhYm92ZSBhbHJlYWR5IHNob3dzIHRoZSB2ZXJiKVxuICAgIGlmIChpc0hpZ2hsaWdodGVkKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgIHthY3Rpdml0eVRleHQ/LmVuZHNXaXRoKCfigKYnKSA/IGFjdGl2aXR5VGV4dCA6IGAke2FjdGl2aXR5VGV4dH3igKZgfVxuICAgICAgPC9UZXh0PlxuICAgIClcbiAgfVxuXG4gIC8vIEdldCBwcmV2aWV3IGxpbmVzIGlmIGVuYWJsZWRcbiAgY29uc3QgcHJldmlld0xpbmVzID0gc2hvd1ByZXZpZXcgPyBnZXRNZXNzYWdlUHJldmlldyh0ZWFtbWF0ZS5tZXNzYWdlcykgOiBbXVxuXG4gIC8vIFRyZWUgY29udGludWF0aW9uIGNoYXJhY3RlciBmb3IgcHJldmlldyBsaW5lc1xuICBjb25zdCBwcmV2aWV3VHJlZUNoYXIgPSBpc0xhc3QgPyAnICAgJyA6ICfilIIgICdcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPEJveCBwYWRkaW5nTGVmdD17M30+XG4gICAgICAgIHsvKiBTZWxlY3Rpb24gaW5kaWNhdG9yOiBwb2ludGVyIHdoZW4gc2VsZWN0ZWQsIG90aGVyd2lzZSBzcGFjZSAqL31cbiAgICAgICAgPFRleHQgY29sb3I9e2lzU2VsZWN0ZWQgPyAnc3VnZ2VzdGlvbicgOiB1bmRlZmluZWR9IGJvbGQ9e2lzU2VsZWN0ZWR9PlxuICAgICAgICAgIHtpc1NlbGVjdGVkID8gZmlndXJlcy5wb2ludGVyIDogJyAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+e3RyZWVDaGFyfSA8L1RleHQ+XG4gICAgICAgIHsvKiBBZ2VudCBuYW1lOiBoaWRkZW4gb24gdmVyeSBuYXJyb3cgc2NyZWVucyAqL31cbiAgICAgICAge3Nob3dOYW1lICYmIChcbiAgICAgICAgICA8VGV4dCBjb2xvcj17aXNTZWxlY3RlZCA/ICdzdWdnZXN0aW9uJyA6IG5hbWVDb2xvcn0+XG4gICAgICAgICAgICBAe3RlYW1tYXRlLmlkZW50aXR5LmFnZW50TmFtZX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG4gICAgICAgIHtzaG93TmFtZSAmJiA8VGV4dCBkaW1Db2xvcj17IWlzU2VsZWN0ZWR9PjogPC9UZXh0Pn1cbiAgICAgICAge3JlbmRlclN0YXR1cygpfVxuICAgICAgICB7LyogU3RhdHM6IG9ubHkgc2hvd24gd2hlbiBzZWxlY3RlZCBhbmQgdGVybWluYWwgaXMgd2lkZSBlbm91Z2ggKi99XG4gICAgICAgIHtzaG93U3RhdHMgJiYgKFxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgeycgJ31cbiAgICAgICAgICAgIMK3IHt0b29sVXNlQ291bnR9IHRvb2wge3Rvb2xVc2VDb3VudCA9PT0gMSA/ICd1c2UnIDogJ3VzZXMnfSDCt3snICd9XG4gICAgICAgICAgICB7Zm9ybWF0TnVtYmVyKHRva2VuQ291bnQpfSB0b2tlbnNcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG4gICAgICAgIHsvKiBIaW50czogc2VsZWN0IGhpbnQgd2hlbiBoaWdobGlnaHRlZCwgdmlldyBoaW50IHdoZW4gc2VsZWN0ZWQgYnV0IG5vdCBmb3JlZ3JvdW5kZWQgKi99XG4gICAgICAgIHtzaG93U2VsZWN0SGludCAmJiA8VGV4dCBkaW1Db2xvcj4gwrcge1RFQU1NQVRFX1NFTEVDVF9ISU5UfTwvVGV4dD59XG4gICAgICAgIHtzaG93Vmlld0hpbnQgJiYgPFRleHQgZGltQ29sb3I+IMK3IGVudGVyIHRvIHZpZXc8L1RleHQ+fVxuICAgICAgPC9Cb3g+XG4gICAgICB7LyogUHJldmlldyBsaW5lcyAqL31cbiAgICAgIHtwcmV2aWV3TGluZXMubWFwKChsaW5lLCBpZHgpID0+IChcbiAgICAgICAgPEJveCBrZXk9e2lkeH0gcGFkZGluZ0xlZnQ9ezN9PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+e3ByZXZpZXdUcmVlQ2hhcn0gPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPntsaW5lfTwvVGV4dD5cbiAgICAg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
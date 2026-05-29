// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 memo、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import { memo, type ReactNode } from 'react';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 truncatePathMiddle、truncateToWidth 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncatePathMiddle, truncateToWidth } from '../../utils/format.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// SuggestionItem 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type SuggestionItem = {
  id: string;
  displayText: string;
  tag?: string;
  description?: string;
  metadata?: unknown;
  color?: keyof Theme;
};
// SuggestionType 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type SuggestionType = 'command' | 'file' | 'directory' | 'agent' | 'shell' | 'custom-title' | 'slack-channel' | 'none';
// OVERLAY_MAX_ITEMS 集合保存`5`，供终端渲染提示输入组件 Prompt Input Footer Su...后续判断或输出使用。
export const OVERLAY_MAX_ITEMS = 5;

/**
 * Get the icon for a suggestion based on its type
 * Icons: + for files, ◇ for MCP resources, * for agents
 */
// getIcon 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getIcon(itemId: string): string {
  // 满足 `itemId.startsWith('file-')` 时，终端渲染执行该分支。
  if (itemId.startsWith('file-')) return '+';
  // 满足 `itemId.startsWith('mcp-resource-')` 时，终端渲染执行该分支。
  if (itemId.startsWith('mcp-resource-')) return '◇';
  // 满足 `itemId.startsWith('agent-')` 时，终端渲染执行该分支。
  if (itemId.startsWith('agent-')) return '*';
  // 返回 `'+'`，作为终端渲染这次计算的结果。
  return '+';
}

/**
 * Check if an item is a unified suggestion type (file, mcp-resource, or agent)
 */
// isUnifiedSuggestion 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isUnifiedSuggestion(itemId: string): boolean {
  // 返回 `itemId.startsWith('file-') || itemId.startsWith('mcp-resource-') || ite...`，作为终端渲染这次计算的结果。
  return itemId.startsWith('file-') || itemId.startsWith('mcp-resource-') || itemId.startsWith('agent-');
}
// SuggestionItemRow保存`memo`，供终端渲染后续处理使用。
const SuggestionItemRow = memo(function SuggestionItemRow(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(36);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    item,
    maxColumnWidth,
    isSelected
  } = t0;
  // columns 集合保存`useTerminalSize`，供终端渲染后续处理使用。
  const columns = useTerminalSize().columns;
  // isUnified记录 `isUnifiedSuggestion` 是否成立，终端渲染随后按该结果分支。
  const isUnified = isUnifiedSuggestion(item.id);
  // 满足 `isUnified` 时，终端渲染执行该分支。
  if (isUnified) {
    // t1 暂存 `getIcon(item.id)` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== item.id) {
      // t1 暂存 `getIcon(item.id)` 生成的渲染片段，后续返回路径直接复用。
      t1 = getIcon(item.id);
      // $[0] 缓存 `item.id`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = item.id;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[1];
    }
    // icon保存`t1`，作为后续临时缓存值处理的输入。
    const icon = t1;
    // textColor 命名 `isSelected ? "suggestion" : undefined`，让后续代码直接表达这个值的用途。
    const textColor = isSelected ? "suggestion" : undefined;
    // dimColor标记终端渲染提示输入组件 Prompt Input Footer Su...是否启用对应路径。
    const dimColor = !isSelected;
    // isFile 文件数据记录 `id.startsWith` 是否成立，终端渲染随后按该结果分支。
    const isFile = item.id.startsWith("file-");
    // isMcpResource记录 `id.startsWith` 是否成立，终端渲染随后按该结果分支。
    const isMcpResource = item.id.startsWith("mcp-resource-");
    // separatorWidth 命名 `item.description ? 3 : 0`，让后续代码直接表达这个值的用途。
    const separatorWidth = item.description ? 3 : 0;
    // displayText 先占位，稍后的条件分支会根据实际输入补齐它。
    let displayText;
    // 满足 `isFile` 时，终端渲染执行该分支。
    if (isFile) {
      // t2 暂存 `item.description ? Math.min(20, stringWidth(item.descript...` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[2] !== item.description) {
        // t2 暂存 `item.description ? Math.min(20, stringWidth(item.descript...` 生成的渲染片段，后续返回路径直接复用。
        t2 = item.description ? Math.min(20, stringWidth(item.description)) : 0;
        // $[2] 缓存 `item.description`，下次依赖未变时 React 编译产物可直接复用。
        $[2] = item.description;
        // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[3] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[3];
      }
      // descReserve 命名 `t2`，让后续代码直接表达这个值的用途。
      const descReserve = t2;
      // maxPathLength 路径数据保存`columns - 2 - 4 - separatorWidth - descReserve`，供后续判断或组装使用。
      const maxPathLength = columns - 2 - 4 - separatorWidth - descReserve;
      // t3 暂存 `truncatePathMiddle(item.displayText, maxPathLength)` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[4] !== item.displayText || $[5] !== maxPathLength) {
        // t3 暂存 `truncatePathMiddle(item.displayText, maxPathLength)` 生成的渲染片段，后续返回路径直接复用。
        t3 = truncatePathMiddle(item.displayText, maxPathLength);
        // $[4] 缓存 `item.displayText`，下次依赖未变时 React 编译产物可直接复用。
        $[4] = item.displayText;
        // $[5] 缓存 `maxPathLength`，下次依赖未变时 React 编译产物可直接复用。
        $[5] = maxPathLength;
        // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[6] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[6];
      }
      // displayText更新为 `t3`，确保提示输入组件后续读取最新状态。
      displayText = t3;
    } else {
      // 满足 `isMcpResource` 时，终端渲染执行该分支。
      if (isMcpResource) {
        // t2 暂存 `truncateToWidth(item.displayText, 30)` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[7] !== item.displayText) {
          // t2 暂存 `truncateToWidth(item.displayText, 30)` 生成的渲染片段，后续返回路径直接复用。
          t2 = truncateToWidth(item.displayText, 30);
          // $[7] 缓存 `item.displayText`，下次依赖未变时 React 编译产物可直接复用。
          $[7] = item.displayText;
          // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[8] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[8];
        }
        // displayText更新为 `t2`，确保提示输入组件后续读取最新状态。
        displayText = t2;
      } else {
        // displayText更新为 `item.displayText`，确保提示输入组件后续读取最新状态。
        displayText = item.displayText;
      }
    }
    // availableWidth保存`stringWidth`，供终端渲染后续处理使用。
    const availableWidth = columns - 2 - stringWidth(displayText) - separatorWidth - 4;
    // lineContent 先占位，稍后的条件分支会根据实际输入补齐它。
    let lineContent;
    // 满足 `item.description` 时，终端渲染执行该分支。
    if (item.description) {
      // maxDescLength 数量保存`Math.max`，供终端渲染后续处理使用。
      const maxDescLength = Math.max(0, availableWidth);
      // t2 暂存 `truncateToWidth(item.description.replace(/\s+/g, " "), ma...` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[9] !== item.description || $[10] !== maxDescLength) {
        // t2 暂存 `truncateToWidth(item.description.replace(/\s+/g, " "), ma...` 生成的渲染片段，后续返回路径直接复用。
        t2 = truncateToWidth(item.description.replace(/\s+/g, " "), maxDescLength);
        // $[9] 缓存 `item.description`，下次依赖未变时 React 编译产物可直接复用。
        $[9] = item.description;
        // $[10] 缓存 `maxDescLength`，下次依赖未变时 React 编译产物可直接复用。
        $[10] = maxDescLength;
        // $[11] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[11] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[11];
      }
      // truncatedDesc沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
      const truncatedDesc = t2;
      // lineContent更新为 ``${icon} ${displayText} – ${truncatedDesc}``，确保提示输入组件后续读取最新状态。
      lineContent = `${icon} ${displayText} – ${truncatedDesc}`;
    } else {
      // lineContent更新为 ``${icon} ${displayText}``，确保提示输入组件后续读取最新状态。
      lineContent = `${icon} ${displayText}`;
    }
    // t2 暂存 `<Text color={textColor} dimColor={dimColor} wrap="truncat...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[12] !== dimColor || $[13] !== lineContent || $[14] !== textColor) {
      // t2 暂存 `<Text color={textColor} dimColor={dimColor} wrap="truncat...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text color={textColor} dimColor={dimColor} wrap="truncate">{lineContent}</Text>;
      // $[12] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = dimColor;
      // $[13] 缓存 `lineContent`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = lineContent;
      // $[14] 缓存 `textColor`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = textColor;
      // $[15] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[15];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // maxNameWidth保存`Math.floor`，供终端渲染后续处理使用。
  const maxNameWidth = Math.floor(columns * 0.4);
  // displayTextWidth保存`Math.min`，供终端渲染后续处理使用。
  const displayTextWidth = Math.min(maxColumnWidth ?? stringWidth(item.displayText) + 5, maxNameWidth);
  // textColor_0标记终端渲染提示输入组件 Prompt Input Footer Su...是否启用对应路径。
  const textColor_0 = item.color || (isSelected ? "suggestion" : undefined);
  // shouldDim标记终端渲染提示输入组件 Prompt Input Footer Su...是否启用对应路径。
  const shouldDim = !isSelected;
  // displayText_0保存`item.displayText`，供终端渲染提示输入组件 Prompt Input Footer Su...后续判断或输出使用。
  let displayText_0 = item.displayText;
  // 满足 `stringWidth(displayText_0) > displayTextWidth - 2` 时，终端渲染执行该分支。
  if (stringWidth(displayText_0) > displayTextWidth - 2) {
    // t1保存`displayTextWidth - 2`，供后续判断或组装使用。
    const t1 = displayTextWidth - 2;
    // t2 暂存 `truncateToWidth(displayText_0, t1)` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[16] !== displayText_0 || $[17] !== t1) {
      // t2 暂存 `truncateToWidth(displayText_0, t1)` 生成的渲染片段，后续返回路径直接复用。
      t2 = truncateToWidth(displayText_0, t1);
      // $[16] 缓存 `displayText_0`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = displayText_0;
      // $[17] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t1;
      // $[18] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[18];
    }
    // displayText_0更新为 `t2`，确保提示输入组件后续读取最新状态。
    displayText_0 = t2;
  }
  // paddedDisplayText保存`repeat`，供终端渲染后续处理使用。
  const paddedDisplayText = displayText_0 + " ".repeat(Math.max(0, displayTextWidth - stringWidth(displayText_0)));
  // tagText 命名 `item.tag ? `[${item.tag}] ` : ""`，让后续代码直接表达这个值的用途。
  const tagText = item.tag ? `[${item.tag}] ` : "";
  // tagWidth保存`stringWidth`，供终端渲染后续处理使用。
  const tagWidth = stringWidth(tagText);
  // descriptionWidth保存`Math.max`，供终端渲染后续处理使用。
  const descriptionWidth = Math.max(0, columns - displayTextWidth - tagWidth - 4);
  // t1 暂存 `item.description ? truncateToWidth(item.description.repla...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== descriptionWidth || $[20] !== item.description) {
    // t1 暂存 `item.description ? truncateToWidth(item.description.repla...` 生成的渲染片段，后续返回路径直接复用。
    t1 = item.description ? truncateToWidth(item.description.replace(/\s+/g, " "), descriptionWidth) : "";
    // $[19] 缓存 `descriptionWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = descriptionWidth;
    // $[20] 缓存 `item.description`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = item.description;
    // $[21] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[21];
  }
  // truncatedDescription沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const truncatedDescription = t1;
  // t2 暂存 `<Text color={textColor_0} dimColor={shouldDim}>{paddedDis...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== paddedDisplayText || $[23] !== shouldDim || $[24] !== textColor_0) {
    // t2 暂存 `<Text color={textColor_0} dimColor={shouldDim}>{paddedDis...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color={textColor_0} dimColor={shouldDim}>{paddedDisplayText}</Text>;
    // $[22] 缓存 `paddedDisplayText`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = paddedDisplayText;
    // $[23] 缓存 `shouldDim`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = shouldDim;
    // $[24] 缓存 `textColor_0`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = textColor_0;
    // $[25] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[25];
  }
  // t3 暂存 `tagText ? <Text dimColor={true}>{tagText}</Text> : null` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== tagText) {
    // t3 暂存 `tagText ? <Text dimColor={true}>{tagText}</Text> : null` 生成的渲染片段，后续返回路径直接复用。
    t3 = tagText ? <Text dimColor={true}>{tagText}</Text> : null;
    // $[26] 缓存 `tagText`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = tagText;
    // $[27] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[27];
  }
  // t4保存`isSelected ? "suggestion" : undefined`，供终端渲染提示输入组件 Prompt Input Footer Su...后续判断或输出使用。
  const t4 = isSelected ? "suggestion" : undefined;
  // t5标记终端渲染提示输入组件 Prompt Input Footer Su...是否启用对应路径。
  const t5 = !isSelected;
  // t6 暂存 `<Text color={t4} dimColor={t5}>{truncatedDescription}</Te...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== t4 || $[29] !== t5 || $[30] !== truncatedDescription) {
    // t6 暂存 `<Text color={t4} dimColor={t5}>{truncatedDescription}</Te...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text color={t4} dimColor={t5}>{truncatedDescription}</Text>;
    // $[28] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t4;
    // $[29] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t5;
    // $[30] 缓存 `truncatedDescription`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = truncatedDescription;
    // $[31] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[31];
  }
  // t7 暂存 `<Text wrap="truncate">{t2}{t3}{t6}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== t2 || $[33] !== t3 || $[34] !== t6) {
    // t7 暂存 `<Text wrap="truncate">{t2}{t3}{t6}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text wrap="truncate">{t2}{t3}{t6}</Text>;
    // $[32] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t2;
    // $[33] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t3;
    // $[34] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t6;
    // $[35] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[35];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
});
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  suggestions: SuggestionItem[];
  selectedSuggestion: number;
  maxColumnWidth?: number;
  /**
   * When true, the suggestions are rendered inside a position=absolute
   * overlay. We omit minHeight and flex-end so the y-clamp in the
   * renderer doesn't push fewer items down into the prompt area.
   */
  overlay?: boolean;
};
// PromptInputFooterSuggestions 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PromptInputFooterSuggestions(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(22);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    suggestions,
    selectedSuggestion,
    maxColumnWidth: maxColumnWidthProp,
    overlay
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    rows
  } = useTerminalSize();
  // maxVisibleItems 集合保存`Math.min`，供终端渲染后续处理使用。
  const maxVisibleItems = overlay ? OVERLAY_MAX_ITEMS : Math.min(6, Math.max(1, rows - 3));
  // suggestions 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (suggestions.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `maxColumnWidthProp ?? Math.max(...suggestions.map(_temp))...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== maxColumnWidthProp || $[1] !== suggestions) {
    // t1 暂存 `maxColumnWidthProp ?? Math.max(...suggestions.map(_temp))...` 生成的渲染片段，后续返回路径直接复用。
    t1 = maxColumnWidthProp ?? Math.max(...suggestions.map(_temp)) + 5;
    // $[0] 缓存 `maxColumnWidthProp`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = maxColumnWidthProp;
    // $[1] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = suggestions;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // maxColumnWidth保存`t1`，作为后续临时缓存值处理的输入。
  const maxColumnWidth = t1;
  // startIndex 索引保存`Math.max`，供终端渲染后续处理使用。
  const startIndex = Math.max(0, Math.min(selectedSuggestion - Math.floor(maxVisibleItems / 2), suggestions.length - maxVisibleItems));
  // endIndex 索引保存`Math.min`，供终端渲染后续处理使用。
  const endIndex = Math.min(startIndex + maxVisibleItems, suggestions.length);
  // T0 暂存 `Box` 的派生结果，便于缓存命中时直接复用。
  let T0;
  // t2 暂存 `"column"` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `overlay ? undefined : "flex-end"` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== endIndex || $[4] !== maxColumnWidth || $[5] !== overlay || $[6] !== selectedSuggestion || $[7] !== startIndex || $[8] !== suggestions) {
    // visibleItems 集合格式化`suggestions.slice`，供终端渲染后续处理使用。
    const visibleItems = suggestions.slice(startIndex, endIndex);
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t2 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t2 = "column";
    // t3 暂存 `overlay ? undefined : "flex-end"` 生成的渲染片段，后续返回路径直接复用。
    t3 = overlay ? undefined : "flex-end";
    // t5 暂存 `item_0 => <SuggestionItemRow key={item_0.id} item={item_0...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[13] !== maxColumnWidth || $[14] !== selectedSuggestion || $[15] !== suggestions) {
      // t5 暂存 `item_0 => <SuggestionItemRow key={item_0.id} item={item_0...` 生成的渲染片段，后续返回路径直接复用。
      t5 = item_0 => <SuggestionItemRow key={item_0.id} item={item_0} maxColumnWidth={maxColumnWidth} isSelected={item_0.id === suggestions[selectedSuggestion]?.id} />;
      // $[13] 缓存 `maxColumnWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = maxColumnWidth;
      // $[14] 缓存 `selectedSuggestion`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = selectedSuggestion;
      // $[15] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = suggestions;
      // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[16];
    }
    // t4 暂存 `visibleItems.map(t5)` 生成的渲染片段，后续返回路径直接复用。
    t4 = visibleItems.map(t5);
    // $[3] 缓存 `endIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = endIndex;
    // $[4] 缓存 `maxColumnWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = maxColumnWidth;
    // $[5] 缓存 `overlay`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = overlay;
    // $[6] 缓存 `selectedSuggestion`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = selectedSuggestion;
    // $[7] 缓存 `startIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = startIndex;
    // $[8] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = suggestions;
    // $[9] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = T0;
    // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t2;
    // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t3;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
  } else {
    // T0 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[9];
    // t2 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[10];
    // t3 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[11];
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
  }
  // t5 暂存 `<T0 flexDirection={t2} justifyContent={t3}>{t4}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== T0 || $[18] !== t2 || $[19] !== t3 || $[20] !== t4) {
    // t5 暂存 `<T0 flexDirection={t2} justifyContent={t3}>{t4}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <T0 flexDirection={t2} justifyContent={t3}>{t4}</T0>;
    // $[17] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = T0;
    // $[18] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t2;
    // $[19] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t3;
    // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t4;
    // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[21];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// _temp 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(item) {
  // 返回 `stringWidth(item.displayText)`，作为终端渲染这次计算的结果。
  return stringWidth(item.displayText);
}
export default memo(PromptInputFooterSuggestions);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIm1lbW8iLCJSZWFjdE5vZGUiLCJ1c2VUZXJtaW5hbFNpemUiLCJzdHJpbmdXaWR0aCIsIkJveCIsIlRleHQiLCJ0cnVuY2F0ZVBhdGhNaWRkbGUiLCJ0cnVuY2F0ZVRvV2lkdGgiLCJUaGVtZSIsIlN1Z2dlc3Rpb25JdGVtIiwiaWQiLCJkaXNwbGF5VGV4dCIsInRhZyIsImRlc2NyaXB0aW9uIiwibWV0YWRhdGEiLCJjb2xvciIsIlN1Z2dlc3Rpb25UeXBlIiwiT1ZFUkxBWV9NQVhfSVRFTVMiLCJnZXRJY29uIiwiaXRlbUlkIiwic3RhcnRzV2l0aCIsImlzVW5pZmllZFN1Z2dlc3Rpb24iLCJTdWdnZXN0aW9uSXRlbVJvdyIsInQwIiwiJCIsIl9jIiwiaXRlbSIsIm1heENvbHVtbldpZHRoIiwiaXNTZWxlY3RlZCIsImNvbHVtbnMiLCJpc1VuaWZpZWQiLCJ0MSIsImljb24iLCJ0ZXh0Q29sb3IiLCJ1bmRlZmluZWQiLCJkaW1Db2xvciIsImlzRmlsZSIsImlzTWNwUmVzb3VyY2UiLCJzZXBhcmF0b3JXaWR0aCIsInQyIiwiTWF0aCIsIm1pbiIsImRlc2NSZXNlcnZlIiwibWF4UGF0aExlbmd0aCIsInQzIiwiYXZhaWxhYmxlV2lkdGgiLCJsaW5lQ29udGVudCIsIm1heERlc2NMZW5ndGgiLCJtYXgiLCJyZXBsYWNlIiwidHJ1bmNhdGVkRGVzYyIsIm1heE5hbWVXaWR0aCIsImZsb29yIiwiZGlzcGxheVRleHRXaWR0aCIsInRleHRDb2xvcl8wIiwic2hvdWxkRGltIiwiZGlzcGxheVRleHRfMCIsInBhZGRlZERpc3BsYXlUZXh0IiwicmVwZWF0IiwidGFnVGV4dCIsInRhZ1dpZHRoIiwiZGVzY3JpcHRpb25XaWR0aCIsInRydW5jYXRlZERlc2NyaXB0aW9uIiwidDQiLCJ0NSIsInQ2IiwidDciLCJQcm9wcyIsInN1Z2dlc3Rpb25zIiwic2VsZWN0ZWRTdWdnZXN0aW9uIiwib3ZlcmxheSIsIlByb21wdElucHV0Rm9vdGVyU3VnZ2VzdGlvbnMiLCJtYXhDb2x1bW5XaWR0aFByb3AiLCJyb3dzIiwibWF4VmlzaWJsZUl0ZW1zIiwibGVuZ3RoIiwibWFwIiwiX3RlbXAiLCJzdGFydEluZGV4IiwiZW5kSW5kZXgiLCJUMCIsInZpc2libGVJdGVtcyIsInNsaWNlIiwiaXRlbV8wIl0sInNvdXJjZXMiOlsiUHJvbXB0SW5wdXRGb290ZXJTdWdnZXN0aW9ucy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBtZW1vLCB0eXBlIFJlYWN0Tm9kZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi8uLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB0cnVuY2F0ZVBhdGhNaWRkbGUsIHRydW5jYXRlVG9XaWR0aCB9IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWUgfSBmcm9tICcuLi8uLi91dGlscy90aGVtZS5qcydcblxuZXhwb3J0IHR5cGUgU3VnZ2VzdGlvbkl0ZW0gPSB7XG4gIGlkOiBzdHJpbmdcbiAgZGlzcGxheVRleHQ6IHN0cmluZ1xuICB0YWc/OiBzdHJpbmdcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmdcbiAgbWV0YWRhdGE/OiB1bmtub3duXG4gIGNvbG9yPzoga2V5b2YgVGhlbWVcbn1cblxuZXhwb3J0IHR5cGUgU3VnZ2VzdGlvblR5cGUgPVxuICB8ICdjb21tYW5kJ1xuICB8ICdmaWxlJ1xuICB8ICdkaXJlY3RvcnknXG4gIHwgJ2FnZW50J1xuICB8ICdzaGVsbCdcbiAgfCAnY3VzdG9tLXRpdGxlJ1xuICB8ICdzbGFjay1jaGFubmVsJ1xuICB8ICdub25lJ1xuXG5leHBvcnQgY29uc3QgT1ZFUkxBWV9NQVhfSVRFTVMgPSA1XG5cbi8qKlxuICogR2V0IHRoZSBpY29uIGZvciBhIHN1Z2dlc3Rpb24gYmFzZWQgb24gaXRzIHR5cGVcbiAqIEljb25zOiArIGZvciBmaWxlcywg4peHIGZvciBNQ1AgcmVzb3VyY2VzLCAqIGZvciBhZ2VudHNcbiAqL1xuZnVuY3Rpb24gZ2V0SWNvbihpdGVtSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChpdGVtSWQuc3RhcnRzV2l0aCgnZmlsZS0nKSkgcmV0dXJuICcrJ1xuICBpZiAoaXRlbUlkLnN0YXJ0c1dpdGgoJ21jcC1yZXNvdXJjZS0nKSkgcmV0dXJuICfil4cnXG4gIGlmIChpdGVtSWQuc3RhcnRzV2l0aCgnYWdlbnQtJykpIHJldHVybiAnKidcbiAgcmV0dXJuICcrJ1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGFuIGl0ZW0gaXMgYSB1bmlmaWVkIHN1Z2dlc3Rpb24gdHlwZSAoZmlsZSwgbWNwLXJlc291cmNlLCBvciBhZ2VudClcbiAqL1xuZnVuY3Rpb24gaXNVbmlmaWVkU3VnZ2VzdGlvbihpdGVtSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGl0ZW1JZC5zdGFydHNXaXRoKCdmaWxlLScpIHx8XG4gICAgaXRlbUlkLnN0YXJ0c1dpdGgoJ21jcC1yZXNvdXJjZS0nKSB8fFxuICAgIGl0ZW1JZC5zdGFydHNXaXRoKCdhZ2VudC0nKVxuICApXG59XG5cbmNvbnN0IFN1Z2dlc3Rpb25JdGVtUm93ID0gbWVtbyhmdW5jdGlvbiBTdWdnZXN0aW9uSXRlbVJvdyh7XG4gIGl0ZW0sXG4gIG1heENvbHVtbldpZHRoLFxuICBpc1NlbGVjdGVkLFxufToge1xuICBpdGVtOiBTdWdnZXN0aW9uSXRlbVxuICBtYXhDb2x1bW5XaWR0aD86IG51bWJlclxuICBpc1NlbGVjdGVkOiBib29sZWFuXG59KTogUmVhY3ROb2RlIHtcbiAgY29uc3QgY29sdW1ucyA9IHVzZVRlcm1pbmFsU2l6ZSgpLmNvbHVtbnNcbiAgY29uc3QgaXNVbmlmaWVkID0gaXNVbmlmaWVkU3VnZ2VzdGlvbihpdGVtLmlkKVxuXG4gIC8vIEZvciB1bmlmaWVkIHN1Z2dlc3Rpb25zIChmaWxlLCBtY3AtcmVzb3VyY2UsIGFnZW50KSwgdXNlIHNpbmdsZS1saW5lIGxheW91dCB3aXRoIGljb25cbiAgaWYgKGlzVW5pZmllZCkge1xuICAgIGNvbnN0IGljb24gPSBnZXRJY29uKGl0ZW0uaWQpXG4gICAgY29uc3QgdGV4dENvbG9yOiBrZXlvZiBUaGVtZSB8IHVuZGVmaW5lZCA9IGlzU2VsZWN0ZWRcbiAgICAgID8gJ3N1Z2dlc3Rpb24nXG4gICAgICA6IHVuZGVmaW5lZFxuICAgIGNvbnN0IGRpbUNvbG9yID0gIWlzU2VsZWN0ZWRcblxuICAgIGNvbnN0IGlzRmlsZSA9IGl0ZW0uaWQuc3RhcnRzV2l0aCgnZmlsZS0nKVxuICAgIGNvbnN0IGlzTWNwUmVzb3VyY2UgPSBpdGVtLmlkLnN0YXJ0c1dpdGgoJ21jcC1yZXNvdXJjZS0nKVxuXG4gICAgLy8gQ2FsY3VsYXRlIGxheW91dCB3aWR0aHNcbiAgICAvLyBMYXlvdXQ6IFwiWCBcIiAoMikgKyBkaXNwbGF5VGV4dCArIFwiIOKAkyBcIiAoMykgKyBkZXNjcmlwdGlvbiArIHBhZGRpbmcgKDQpXG4gICAgY29uc3QgaWNvbldpZHRoID0gMiAvLyBpY29uICsgc3BhY2UgKGZpeGVkKVxuICAgIGNvbnN0IHBhZGRpbmdXaWR0aCA9IDRcbiAgICBjb25zdCBzZXBhcmF0b3JXaWR0aCA9IGl0ZW0uZGVzY3JpcHRpb24gPyAzIDogMCAvLyAnIOKAkyAnIHNlcGFyYXRvclxuXG4gICAgLy8gRm9yIGZpbGVzLCB0cnVuY2F0ZSBtaWRkbGUgb2YgcGF0aCB0byBzaG93IGJvdGggZGlyZWN0b3J5IGNvbnRleHQgYW5kIGZpbGVuYW1lXG4gICAgLy8gRm9yIE1DUCByZXNvdXJjZXMsIGxpbWl0IGRpc3BsYXlUZXh0IHRvIDMwIGNoYXJzICh0cnVuY2F0ZSBmcm9tIGVuZClcbiAgICAvLyBGb3IgYWdlbnRzLCBubyB0cnVuY2F0aW9uXG4gICAgbGV0IGRpc3BsYXlUZXh0OiBzdHJpbmdcbiAgICBpZiAoaXNGaWxlKSB7XG4gICAgICAvLyBSZXNlcnZlIHNwYWNlIGZvciBkZXNjcmlwdGlvbiBpZiBwcmVzZW50LCBvdGhlcndpc2UgdXNlIGFsbCBhdmFpbGFibGUgc3BhY2VcbiAgICAgIGNvbnN0IGRlc2NSZXNlcnZlID0gaXRlbS5kZXNjcmlwdGlvblxuICAgICAgICA/IE1hdGgubWluKDIwLCBzdHJpbmdXaWR0aChpdGVtLmRlc2NyaXB0aW9uKSlcbiAgICAgICAgOiAwXG4gICAgICBjb25zdCBtYXhQYXRoTGVuZ3RoID1cbiAgICAgICAgY29sdW1ucyAtIGljb25XaWR0aCAtIHBhZGRpbmdXaWR0aCAtIHNlcGFyYXRvcldpZHRoIC0gZGVzY1Jlc2VydmVcbiAgICAgIGRpc3BsYXlUZXh0ID0gdHJ1bmNhdGVQYXRoTWlkZGxlKGl0ZW0uZGlzcGxheVRleHQsIG1heFBhdGhMZW5ndGgpXG4gICAgfSBlbHNlIGlmIChpc01jcFJlc291cmNlKSB7XG4gICAgICBjb25zdCBtYXhEaXNwbGF5VGV4dExlbmd0aCA9IDMwXG4gICAgICBkaXNwbGF5VGV4dCA9IHRydW5jYXRlVG9XaWR0aChpdGVtLmRpc3BsYXlUZXh0LCBtYXhEaXNwbGF5VGV4dExlbmd0aClcbiAgICB9IGVsc2Uge1xuICAgICAgZGlzcGxheVRleHQgPSBpdGVtLmRpc3BsYXlUZXh0XG4gICAgfVxuXG4gICAgY29uc3QgYXZhaWxhYmxlV2lkdGggPVxuICAgICAgY29sdW1ucyAtXG4gICAgICBpY29uV2lkdGggLVxuICAgICAgc3RyaW5nV2lkdGgoZGlzcGxheVRleHQpIC1cbiAgICAgIHNlcGFyYXRvcldpZHRoIC1cbiAgICAgIHBhZGRpbmdXaWR0aFxuXG4gICAgLy8gQnVpbGQgdGhlIGZ1bGwgbGluZSBhcyBhIHNpbmdsZSBzdHJpbmcgdG8gcHJldmVudCB3cmFwcGluZ1xuICAgIGxldCBsaW5lQ29udGVudDogc3RyaW5nXG4gICAgaWYgKGl0ZW0uZGVzY3JpcHRpb24pIHtcbiAgICAgIGNvbnN0IG1heERlc2NMZW5ndGggPSBNYXRoLm1heCgwLCBhdmFpbGFibGVXaWR0aClcbiAgICAgIGNvbnN0IHRydW5jYXRlZERlc2MgPSB0cnVuY2F0ZVRvV2lkdGgoXG4gICAgICAgIGl0ZW0uZGVzY3JpcHRpb24ucmVwbGFjZSgvXFxzKy9nLCAnICcpLFxuICAgICAgICBtYXhEZXNjTGVuZ3RoLFxuICAgICAgKVxuICAgICAgbGluZUNvbnRlbnQgPSBgJHtpY29ufSAke2Rpc3BsYXlUZXh0fSDigJMgJHt0cnVuY2F0ZWREZXNjfWBcbiAgICB9IGVsc2Uge1xuICAgICAgbGluZUNvbnRlbnQgPSBgJHtpY29ufSAke2Rpc3BsYXlUZXh0fWBcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgPFRleHQgY29sb3I9e3RleHRDb2xvcn0gZGltQ29sb3I9e2RpbUNvbG9yfSB3cmFwPVwidHJ1bmNhdGVcIj5cbiAgICAgICAge2xpbmVDb250ZW50fVxuICAgICAgPC9UZXh0PlxuICAgIClcbiAgfVxuXG4gIC8vIEZvciBub24tdW5pZmllZCBzdWdnZXN0aW9ucyAoY29tbWFuZHMsIHNoZWxsLCBldGMuKSwgdXNlIGltcHJvdmVkIGxheW91dCBmcm9tIG1haW5cbiAgLy8gQ2FwIHRoZSBjb21tYW5kIG5hbWUgY29sdW1uIGF0IDQwJSBvZiB0ZXJtaW5hbCB3aWR0aCB0byBlbnN1cmUgZGVzY3JpcHRpb24gaGFzIHNwYWNlXG4gIGNvbnN0IG1heE5hbWVXaWR0aCA9IE1hdGguZmxvb3IoY29sdW1ucyAqIDAuNClcbiAgY29uc3QgZGlzcGxheVRleHRXaWR0aCA9IE1hdGgubWluKFxuICAgIG1heENvbHVtbldpZHRoID8/IHN0cmluZ1dpZHRoKGl0ZW0uZGlzcGxheVRleHQpICsgNSxcbiAgICBtYXhOYW1lV2lkdGgsXG4gIClcblxuICBjb25zdCB0ZXh0Q29sb3IgPSBpdGVtLmNvbG9yIHx8IChpc1NlbGVjdGVkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkKVxuICBjb25zdCBzaG91bGREaW0gPSAhaXNTZWxlY3RlZFxuXG4gIC8vIFRydW5jYXRlIGFuZCBwYWQgdGhlIGRpc3BsYXkgdGV4dCB0byBmaXhlZCB3aWR0aFxuICBsZXQgZGlzcGxheVRleHQgPSBpdGVtLmRpc3BsYXlUZXh0XG4gIGlmIChzdHJpbmdXaWR0aChkaXNwbGF5VGV4dCkgPiBkaXNwbGF5VGV4dFdpZHRoIC0gMikge1xuICAgIGRpc3BsYXlUZXh0ID0gdHJ1bmNhdGVUb1dpZHRoKGRpc3BsYXlUZXh0LCBkaXNwbGF5VGV4dFdpZHRoIC0gMilcbiAgfVxuICBjb25zdCBwYWRkZWREaXNwbGF5VGV4dCA9XG4gICAgZGlzcGxheVRleHQgK1xuICAgICcgJy5yZXBlYXQoTWF0aC5tYXgoMCwgZGlzcGxheVRleHRXaWR0aCAtIHN0cmluZ1dpZHRoKGRpc3BsYXlUZXh0KSkpXG5cbiAgY29uc3QgdGFnVGV4dCA9IGl0ZW0udGFnID8gYFske2l0ZW0udGFnfV0gYCA6ICcnXG4gIGNvbnN0IHRhZ1dpZHRoID0gc3RyaW5nV2lkdGgodGFnVGV4dClcbiAgY29uc3QgZGVzY3JpcHRpb25XaWR0aCA9IE1hdGgubWF4KFxuICAgIDAsXG4gICAgY29sdW1ucyAtIGRpc3BsYXlUZXh0V2lkdGggLSB0YWdXaWR0aCAtIDQsXG4gIClcbiAgLy8gU2tpbGwgZGVzY3JpcHRpb25zIGNhbiBjb250YWluIG5ld2xpbmVzIChlLmcuIC9jbGF1ZGUtYXBpJ3MgXCJUUklHR0VSXG4gIC8vIHdoZW46XCIgYmxvY2spLiBBIG11bHRpLWxpbmUgcm93IGdyb3dzIHRoZSBvdmVybGF5IHBhc3QgbWluSGVpZ2h0OyB3aGVuXG4gIC8vIHRoZSBmaWx0ZXIgbmFycm93cyBwYXN0IHRoYXQgc2tpbGwsIHRoZSBvdmVybGF5IHNocmlua3MgYW5kIGxlYXZlc1xuICAvLyBnaG9zdCByb3dzLiBGbGF0dGVuIHRvIG9uZSBsaW5lIGJlZm9yZSB0cnVuY2F0aW5nLlxuICBjb25zdCB0cnVuY2F0ZWREZXNjcmlwdGlvbiA9IGl0ZW0uZGVzY3JpcHRpb25cbiAgICA/IHRydW5jYXRlVG9XaWR0aChpdGVtLmRlc2NyaXB0aW9uLnJlcGxhY2UoL1xccysvZywgJyAnKSwgZGVzY3JpcHRpb25XaWR0aClcbiAgICA6ICcnXG5cbiAgcmV0dXJuIChcbiAgICA8VGV4dCB3cmFwPVwidHJ1bmNhdGVcIj5cbiAgICAgIDxUZXh0IGNvbG9yPXt0ZXh0Q29sb3J9IGRpbUNvbG9yPXtzaG91bGREaW19PlxuICAgICAgICB7cGFkZGVkRGlzcGxheVRleHR9XG4gICAgICA8L1RleHQ+XG4gICAgICB7dGFnVGV4dCA/IDxUZXh0IGRpbUNvbG9yPnt0YWdUZXh0fTwvVGV4dD4gOiBudWxsfVxuICAgICAgPFRleHRcbiAgICAgICAgY29sb3I9e2lzU2VsZWN0ZWQgPyAnc3VnZ2VzdGlvbicgOiB1bmRlZmluZWR9XG4gICAgICAgIGRpbUNvbG9yPXshaXNTZWxlY3RlZH1cbiAgICAgID5cbiAgICAgICAge3RydW5jYXRlZERlc2NyaXB0aW9ufVxuICAgICAgPC9UZXh0PlxuICAgIDwvVGV4dD5cbiAgKVxufSlcblxudHlwZSBQcm9wcyA9IHtcbiAgc3VnZ2VzdGlvbnM6IFN1Z2dlc3Rpb25JdGVtW11cbiAgc2VsZWN0ZWRTdWdnZXN0aW9uOiBudW1iZXJcbiAgbWF4Q29sdW1uV2lkdGg/OiBudW1iZXJcbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgdGhlIHN1Z2dlc3Rpb25zIGFyZSByZW5kZXJlZCBpbnNpZGUgYSBwb3NpdGlvbj1hYnNvbHV0ZVxuICAgKiBvdmVybGF5LiBXZSBvbWl0IG1pbkhlaWdodCBhbmQgZmxleC1lbmQgc28gdGhlIHktY2xhbXAgaW4gdGhlXG4gICAqIHJlbmRlcmVyIGRvZXNuJ3QgcHVzaCBmZXdlciBpdGVtcyBkb3duIGludG8gdGhlIHByb21wdCBhcmVhLlxuICAgKi9cbiAgb3ZlcmxheT86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByb21wdElucHV0Rm9vdGVyU3VnZ2VzdGlvbnMoe1xuICBzdWdnZXN0aW9ucyxcbiAgc2VsZWN0ZWRTdWdnZXN0aW9uLFxuICBtYXhDb2x1bW5XaWR0aDogbWF4Q29sdW1uV2lkdGhQcm9wLFxuICBvdmVybGF5LFxufTogUHJvcHMpOiBSZWFjdE5vZGUge1xuICBjb25zdCB7IHJvd3MgfSA9IHVzZVRlcm1pbmFsU2l6ZSgpXG4gIC8vIE1heGltdW0gbnVtYmVyIG9mIHN1Z2dlc3Rpb25zIHRvIHNob3cgYXQgb25jZSAobGVhdmluZyBzcGFjZSBmb3IgcHJvbXB0KS5cbiAgLy8gT3ZlcmxheSBtb2RlIChmdWxsc2NyZWVuKSB1c2VzIGEgZml4ZWQgNSDigJQgdGhlIGZsb2F0aW5nIGJveCBzaXRzIG92ZXJcbiAgLy8gdGhlIFNjcm9sbEJveCwgc28gdGVybWluYWwgaGVpZ2h0IGlzbid0IHRoZSBjb25zdHJhaW50LlxuICBjb25zdCBtYXhWaXNpYmxlSXRlbXMgPSBvdmVybGF5XG4gICAgPyBPVkVSTEFZX01BWF9JVEVNU1xuICAgIDogTWF0aC5taW4oNiwgTWF0aC5tYXgoMSwgcm93cyAtIDMpKVxuXG4gIC8vIE5vIHN1Z2dlc3Rpb25zIHRvIGRpc3BsYXlcbiAgaWYgKHN1Z2dlc3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBVc2UgcHJvcCBpZiBwcm92aWRlZCAoc3RhYmxlIHdpZHRoIGZyb20gYWxsIGNvbW1hbmRzKSwgb3RoZXJ3aXNlIGNhbGN1bGF0ZSBmcm9tIHZpc2libGVcbiAgY29uc3QgbWF4Q29sdW1uV2lkdGggPVxuICAgIG1heENvbHVtbldpZHRoUHJvcCA/P1xuICAgIE1hdGgubWF4KC4uLnN1Z2dlc3Rpb25zLm1hcChpdGVtID0+IHN0cmluZ1dpZHRoKGl0ZW0uZGlzcGxheVRleHQpKSkgKyA1XG5cbiAgLy8gQ2FsY3VsYXRlIHZpc2libGUgaXRlbXMgcmFuZ2UgYmFzZWQgb24gc2VsZWN0ZWQgaW5kZXhcbiAgY29uc3Qgc3RhcnRJbmRleCA9IE1hdGgubWF4KFxuICAgIDAsXG4gICAgTWF0aC5taW4oXG4gICAgICBzZWxlY3RlZFN1Z2dlc3Rpb24gLSBNYXRoLmZsb29yKG1heFZpc2libGVJdGVtcyAvIDIpLFxuICAgICAgc3VnZ2VzdGlvbnMubGVuZ3RoIC0gbWF4VmlzaWJsZUl0ZW1zLFxuICAgICksXG4gIClcbiAgY29uc3QgZW5kSW5kZXggPSBNYXRoLm1pbihzdGFydEluZGV4ICsgbWF4VmlzaWJsZUl0ZW1zLCBzdWdnZXN0aW9ucy5sZW5ndGgpXG4gIGNvbnN0IHZpc2libGVJdGVtcyA9IHN1Z2dlc3Rpb25zLnNsaWNlKHN0YXJ0SW5kZXgsIGVuZEluZGV4KVxuXG4gIC8vIEluIG5vbi1vdmVybGF5IChpbmxpbmUpIG1vZGUsIGp1c3RpZnlDb250ZW50IGtlZXBzIHN1Z2dlc3Rpb25zXG4gIC8vIGFuY2hvcmVkIHRvIHRoZSBib3R0b20gKG5lYXIgdGhlIHByb21wdCkuIEluIG92ZXJsYXkgbW9kZSB3ZSBvbWl0XG4gIC8vIGJvdGggbWluSGVpZ2h0IGFuZCBmbGV4LWVuZDogdGhlIHBhcmVudCBpcyBwb3NpdGlvbj1hYnNvbHV0ZSB3aXRoXG4gIC8vIGJvdHRvbT0nMTAwJScsIHNvIGl0cyB5IGlzIGNsYW1wZWQgdG8gMCBieSB0aGUgcmVuZGVyZXIgd2hlbiBpdFxuICAvLyB3b3VsZCBnbyBuZWdhdGl2ZS4gQWRkaW5nIG1pbkhlaWdodCArIGZsZXgtZW5kIHdvdWxkIGNyZWF0ZSBlbXB0eVxuICAvLyBwYWRkaW5nIHJvd3MgdGhhdCBzaGlmdCB0aGUgdmlzaWJsZSBpdGVtcyBkb3duIGludG8gdGhlIHByb21wdCBhcmVhXG4gIC8vIHdoZW4gdGhlIGxpc3QgaGFzIGZld2VyIGl0ZW1zIHRoYW4gbWF4VmlzaWJsZUl0ZW1zLlxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAganVzdGlmeUNvbnRlbnQ9e292ZXJsYXkgPyB1bmRlZmluZWQgOiAnZmxleC1lbmQnfVxuICAgID5cbiAgICAgIHt2aXNpYmxlSXRlbXMubWFwKGl0ZW0gPT4gKFxuICAgICAgICA8U3VnZ2VzdGlvbkl0ZW1Sb3dcbiAgICAgICAgICBrZXk9e2l0ZW0uaWR9XG4gICAgICAgICAgaXRlbT17aXRlbX1cbiAgICAgICAgICBtYXhDb2x1bW5XaWR0aD17bWF4Q29sdW1uV2lkdGh9XG4gICAgICAgICAgaXNTZWxlY3RlZD17aXRlbS5pZCA9PT0gc3VnZ2VzdGlvbnNbc2VsZWN0ZWRTdWdnZXN0aW9uXT8uaWR9XG4gICAgICAgIC8+XG4gICAgICApKX1cbiAgICA8L0JveD5cbiAgKVxufVxuXG5leHBvcnQgZGVmYXVsdCBtZW1vKFByb21wdElucHV0Rm9vdGVyU3VnZ2VzdGlvbnMpXG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLElBQUksRUFBRSxLQUFLQyxTQUFTLFFBQVEsT0FBTztBQUM1QyxTQUFTQyxlQUFlLFFBQVEsZ0NBQWdDO0FBQ2hFLFNBQVNDLFdBQVcsUUFBUSwwQkFBMEI7QUFDdEQsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxrQkFBa0IsRUFBRUMsZUFBZSxRQUFRLHVCQUF1QjtBQUMzRSxjQUFjQyxLQUFLLFFBQVEsc0JBQXNCO0FBRWpELE9BQU8sS0FBS0MsY0FBYyxHQUFHO0VBQzNCQyxFQUFFLEVBQUUsTUFBTTtFQUNWQyxXQUFXLEVBQUUsTUFBTTtFQUNuQkMsR0FBRyxDQUFDLEVBQUUsTUFBTTtFQUNaQyxXQUFXLENBQUMsRUFBRSxNQUFNO0VBQ3BCQyxRQUFRLENBQUMsRUFBRSxPQUFPO0VBQ2xCQyxLQUFLLENBQUMsRUFBRSxNQUFNUCxLQUFLO0FBQ3JCLENBQUM7QUFFRCxPQUFPLEtBQUtRLGNBQWMsR0FDdEIsU0FBUyxHQUNULE1BQU0sR0FDTixXQUFXLEdBQ1gsT0FBTyxHQUNQLE9BQU8sR0FDUCxjQUFjLEdBQ2QsZUFBZSxHQUNmLE1BQU07QUFFVixPQUFPLE1BQU1DLGlCQUFpQixHQUFHLENBQUM7O0FBRWxDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0MsT0FBT0EsQ0FBQ0MsTUFB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
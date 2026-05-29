// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 truncateToWidth 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { truncateToWidth } from '../utils/format.js';

// Constants for width calculations - derived from actual rendered strings
// ALL_TAB_LABEL固定为 `'All'`，作为终端 UI Tag Tabs后续展示或比较的基准。
const ALL_TAB_LABEL = 'All';
// TAB_PADDING保存`2; // Space before and after tab text: " {tab} "`，供终端 UI Tag Tabs后续判断或输出使用。
const TAB_PADDING = 2; // Space before and after tab text: " {tab} "
// HASH_PREFIX_LENGTH 数量保存`1; // "#" prefix for non-All tabs`，供后续判断或组装使用。
const HASH_PREFIX_LENGTH = 1; // "#" prefix for non-All tabs
// LEFT_ARROW_PREFIX保存`'← '`，作为后续固定文本处理的输入。
const LEFT_ARROW_PREFIX = '← ';
// RIGHT_HINT_WITH_COUNT_PREFIX 数量固定为 `'→'`，作为终端 UI Tag Tabs后续展示或比较的基准。
const RIGHT_HINT_WITH_COUNT_PREFIX = '→';
// RIGHT_HINT_SUFFIX固定为 `' (tab to cycle)'`，作为终端 UI Tag Tabs后续展示或比较的基准。
const RIGHT_HINT_SUFFIX = ' (tab to cycle)';
// RIGHT_HINT_NO_COUNT 数量保存`'(tab to cycle)'`，作为后续固定文本处理的输入。
const RIGHT_HINT_NO_COUNT = '(tab to cycle)';
// MAX_OVERFLOW_DIGITS 集合 命名 `2; // Assume max 99 hidden tabs for width calculation`，让后续代码直接表达这个值的用途。
const MAX_OVERFLOW_DIGITS = 2; // Assume max 99 hidden tabs for width calculation

// Computed widths
// LEFT_ARROW_WIDTH 命名 `LEFT_ARROW_PREFIX.length + MAX_OVERFLOW_DIGITS + 1; // "←...`，让后续代码直接表达这个值的用途。
const LEFT_ARROW_WIDTH = LEFT_ARROW_PREFIX.length + MAX_OVERFLOW_DIGITS + 1; // "← NN " with gap
// RIGHT_HINT_WIDTH_WITH_COUNT 数量保存`NN`，供终端渲染后续处理使用。
const RIGHT_HINT_WIDTH_WITH_COUNT = RIGHT_HINT_WITH_COUNT_PREFIX.length + MAX_OVERFLOW_DIGITS + RIGHT_HINT_SUFFIX.length; // "→NN (tab to cycle)"
// RIGHT_HINT_WIDTH_NO_COUNT 数量记录 `RIGHT_HINT_NO_COUNT.length` 是否成立，下一步按该结果分支。
const RIGHT_HINT_WIDTH_NO_COUNT = RIGHT_HINT_NO_COUNT.length;
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  tabs: string[];
  selectedIndex: number;
  availableWidth: number;
  showAllProjects?: boolean;
};

/**
 * Calculate the display width of a tab
 */
// getTabWidth 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTabWidth(tab: string, maxWidth?: number): number {
  // 满足 `tab === ALL_TAB_LABEL` 时，终端渲染执行该分支。
  if (tab === ALL_TAB_LABEL) {
    // 返回 `ALL_TAB_LABEL.length + TAB_PADDING`，作为终端渲染这次计算的结果。
    return ALL_TAB_LABEL.length + TAB_PADDING;
  }
  // For non-All tabs: " #{tag} " but truncate tag if needed
  // tagWidth保存`stringWidth`，供终端渲染后续处理使用。
  const tagWidth = stringWidth(tab);
  // effectiveTagWidth保存`Math.min`，供终端渲染后续处理使用。
  const effectiveTagWidth = maxWidth ? Math.min(tagWidth, maxWidth - TAB_PADDING - HASH_PREFIX_LENGTH) : tagWidth;
  // 返回 `Math.max(0, effectiveTagWidth) + TAB_PADDING + HASH_PREFIX_LENGTH`，作为终端渲染这次计算的结果。
  return Math.max(0, effectiveTagWidth) + TAB_PADDING + HASH_PREFIX_LENGTH;
}

/**
 * Truncate a tag to fit within maxWidth, accounting for padding and hash prefix
 */
// truncateTag 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncateTag(tag: string, maxWidth: number): string {
  // Available space for the tag text itself: maxWidth - " #" - " "
  // availableForTag 命名 `maxWidth - TAB_PADDING - HASH_PREFIX_LENGTH`，让后续代码直接表达这个值的用途。
  const availableForTag = maxWidth - TAB_PADDING - HASH_PREFIX_LENGTH;
  // 满足 `stringWidth(tag) <= availableForTag` 时，终端渲染执行该分支。
  if (stringWidth(tag) <= availableForTag) {
    // 返回 `tag`，作为终端渲染这次计算的结果。
    return tag;
  }
  // 满足 `availableForTag <= 1` 时，终端渲染执行该分支。
  if (availableForTag <= 1) {
    // 返回 `tag.charAt(0)`，作为终端渲染这次计算的结果。
    return tag.charAt(0);
  }
  // 返回 `truncateToWidth(tag, availableForTag)`，作为终端渲染这次计算的结果。
  return truncateToWidth(tag, availableForTag);
}
// TagTabs 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TagTabs({
  tabs,
  selectedIndex,
  availableWidth,
  showAllProjects = false
}: Props): React.ReactNode {
  // resumeLabel保存`Resume`，供终端渲染后续处理使用。
  const resumeLabel = showAllProjects ? 'Resume (All Projects)' : 'Resume';
  // resumeLabelWidth记录 `resumeLabel.length + 1; // +1 for gap` 是否成立，下一步按该结果分支。
  const resumeLabelWidth = resumeLabel.length + 1; // +1 for gap

  // Calculate how much space we have for tabs (use worst-case hint width)
  // rightHintWidth保存`Math.max`，供终端渲染后续处理使用。
  const rightHintWidth = Math.max(RIGHT_HINT_WIDTH_WITH_COUNT, RIGHT_HINT_WIDTH_NO_COUNT);
  // maxTabsWidth保存`availableWidth - resumeLabelWidth - rightHintWidth - 2; /...`，供终端 UI Tag Tabs后续判断或输出使用。
  const maxTabsWidth = availableWidth - resumeLabelWidth - rightHintWidth - 2; // 2 for gaps

  // Clamp selectedIndex to valid range
  // safeSelectedIndex 索引保存`Math.max`，供终端渲染后续处理使用。
  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, tabs.length - 1));

  // Calculate width of each tab, with truncation for very long tags
  // maxSingleTabWidth保存`Math.max`，供终端渲染后续处理使用。
  const maxSingleTabWidth = Math.max(20, Math.floor(maxTabsWidth / 2)); // At least show half the space for one tab
  // tabWidths 集合派生`tabs.map`，供终端渲染后续处理使用。
  const tabWidths = tabs.map(tab => getTabWidth(tab, maxSingleTabWidth));

  // Find a window of tabs that fits, centered around selectedIndex
  // startIndex 索引 命名 `0`，让后续代码直接表达这个值的用途。
  let startIndex = 0;
  // endIndex 索引保存 `tabs.length` 的判断结果，供终端 UI Tag Tabs后续分支直接复用。
  let endIndex = tabs.length;

  // Calculate total width of all tabs
  // totalTabsWidth派生`tabWidths.reduce`，供终端渲染后续处理使用。
  const totalTabsWidth = tabWidths.reduce((sum, w, i) => sum + w + (i < tabWidths.length - 1 ? 1 : 0), 0); // +1 for gaps between tabs

  // 满足 `totalTabsWidth > maxTabsWidth` 时，终端渲染执行该分支。
  if (totalTabsWidth > maxTabsWidth) {
    // Need to show a subset - account for left arrow when not at start
    // effectiveMaxWidth 命名 `maxTabsWidth - LEFT_ARROW_WIDTH`，让后续代码直接表达这个值的用途。
    const effectiveMaxWidth = maxTabsWidth - LEFT_ARROW_WIDTH;

    // Start with the selected tab
    // windowWidth读取 `tabWidths[safeSelectedIndex] ?? 0` 对应条目，后续围绕该成员继续处理。
    let windowWidth = tabWidths[safeSelectedIndex] ?? 0;
    // startIndex 索引更新为 `safeSelectedIndex`，确保终端 UI后续读取最新状态。
    startIndex = safeSelectedIndex;
    // endIndex 索引更新为 `safeSelectedIndex + 1`，确保终端 UI后续读取最新状态。
    endIndex = safeSelectedIndex + 1;

    // Expand window to include more tabs
    // while 使用 startIndex > 0 || endIndex < tabs.length 完成终端渲染里的对应操作。
    while (startIndex > 0 || endIndex < tabs.length) {
      // canExpandLeft标记终端 UI Tag Tabs是否启用对应路径。
      const canExpandLeft = startIndex > 0;
      // canExpandRight标记终端 UI Tag Tabs是否启用对应路径。
      const canExpandRight = endIndex < tabs.length;
      // 满足 `canExpandLeft` 时，终端渲染执行该分支。
      if (canExpandLeft) {
        // leftWidth读取 `(tabWidths[startIndex - 1] ?? 0) + 1; // +1 for gap` 对应条目，后续围绕该成员继续处理。
        const leftWidth = (tabWidths[startIndex - 1] ?? 0) + 1; // +1 for gap
        // 满足 `windowWidth + leftWidth <= effectiveMaxWidth` 时，终端渲染执行该分支。
        if (windowWidth + leftWidth <= effectiveMaxWidth) {
          // 终端 UI 组件 Tag Tabs在这里处理 `startIndex--`，完成这一小步状态转换。
          startIndex--;
          // 终端 UI 组件 Tag Tabs在这里处理 `windowWidth += leftWidth`，完成这一小步状态转换。
          windowWidth += leftWidth;
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue;
        }
      }
      // 满足 `canExpandRight` 时，终端渲染执行该分支。
      if (canExpandRight) {
        // rightWidth读取 `(tabWidths[endIndex] ?? 0) + 1; // +1 for gap` 对应条目，后续围绕该成员继续处理。
        const rightWidth = (tabWidths[endIndex] ?? 0) + 1; // +1 for gap
        // 满足 `windowWidth + rightWidth <= effectiveMaxWidth` 时，终端渲染执行该分支。
        if (windowWidth + rightWidth <= effectiveMaxWidth) {
          // 终端 UI 组件 Tag Tabs在这里处理 `endIndex++`，完成这一小步状态转换。
          endIndex++;
          // 终端 UI 组件 Tag Tabs在这里处理 `windowWidth += rightWidth`，完成这一小步状态转换。
          windowWidth += rightWidth;
          // 跳过当前项，继续处理终端渲染中的下一轮循环。
          continue;
        }
      }
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break;
    }
  }
  // hiddenLeft保存`startIndex`，供终端 UI Tag Tabs后续判断或输出使用。
  const hiddenLeft = startIndex;
  // hiddenRight 命名 `tabs.length - endIndex`，让后续代码直接表达这个值的用途。
  const hiddenRight = tabs.length - endIndex;
  // visibleTabs 集合格式化`tabs.slice`，供终端渲染后续处理使用。
  const visibleTabs = tabs.slice(startIndex, endIndex);
  // visibleIndices 集合派生`visibleTabs.map`，供终端渲染后续处理使用。
  const visibleIndices = visibleTabs.map((_, i_0) => startIndex + i_0);
  // 返回 `<Box flexDirection="row" gap={1}>`，作为终端渲染这次计算的结果。
  return <Box flexDirection="row" gap={1}>
      <Text color="suggestion">{resumeLabel}</Text>
      {hiddenLeft > 0 && <Text dimColor>
          {LEFT_ARROW_PREFIX}
          {hiddenLeft}
        </Text>}
      {/* 这个回调绑定到 {visibleTabs.map((tab_0, i_1) => {，负责终端渲染在该局部场景下的响应。 */}
      {visibleTabs.map((tab_0, i_1) => {
      // actualIndex 索引读取 `visibleIndices[i_1]!` 对应条目，后续围绕该成员继续处理。
      const actualIndex = visibleIndices[i_1]!;
      // isSelected标记终端 UI Tag Tabs是否启用对应路径。
      const isSelected = actualIndex === safeSelectedIndex;
      // displayText保存`truncateTag`，供终端渲染后续处理使用。
      const displayText = tab_0 === ALL_TAB_LABEL ? tab_0 : `#${truncateTag(tab_0, maxSingleTabWidth - TAB_PADDING)}`;
      // 返回 `<Text key={tab_0} backgroundColor={isSelected ? 'suggestion' : undefine...`，作为终端渲染这次计算的结果。
      return <Text key={tab_0} backgroundColor={isSelected ? 'suggestion' : undefined} color={isSelected ? 'inverseText' : undefined} bold={isSelected}>
            {' '}
            {displayText}{' '}
          </Text>;
    })}
      {hiddenRight > 0 ? <Text dimColor>
          {RIGHT_HINT_WITH_COUNT_PREFIX}
          {hiddenRight}
          {RIGHT_HINT_SUFFIX}
        </Text> : <Text dimColor>{RIGHT_HINT_NO_COUNT}</Text>}
    </Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInN0cmluZ1dpZHRoIiwiQm94IiwiVGV4dCIsInRydW5jYXRlVG9XaWR0aCIsIkFMTF9UQUJfTEFCRUwiLCJUQUJfUEFERElORyIsIkhBU0hfUFJFRklYX0xFTkdUSCIsIkxFRlRfQVJST1dfUFJFRklYIiwiUklHSFRfSElOVF9XSVRIX0NPVU5UX1BSRUZJWCIsIlJJR0hUX0hJTlRfU1VGRklYIiwiUklHSFRfSElOVF9OT19DT1VOVCIsIk1BWF9PVkVSRkxPV19ESUdJVFMiLCJMRUZUX0FSUk9XX1dJRFRIIiwibGVuZ3RoIiwiUklHSFRfSElOVF9XSURUSF9XSVRIX0NPVU5UIiwiUklHSFRfSElOVF9XSURUSF9OT19DT1VOVCIsIlByb3BzIiwidGFicyIsInNlbGVjdGVkSW5kZXgiLCJhdmFpbGFibGVXaWR0aCIsInNob3dBbGxQcm9qZWN0cyIsImdldFRhYldpZHRoIiwidGFiIiwibWF4V2lkdGgiLCJ0YWdXaWR0aCIsImVmZmVjdGl2ZVRhZ1dpZHRoIiwiTWF0aCIsIm1pbiIsIm1heCIsInRydW5jYXRlVGFnIiwidGFnIiwiYXZhaWxhYmxlRm9yVGFnIiwiY2hhckF0IiwiVGFnVGFicyIsIlJlYWN0Tm9kZSIsInJlc3VtZUxhYmVsIiwicmVzdW1lTGFiZWxXaWR0aCIsInJpZ2h0SGludFdpZHRoIiwibWF4VGFic1dpZHRoIiwic2FmZVNlbGVjdGVkSW5kZXgiLCJtYXhTaW5nbGVUYWJXaWR0aCIsImZsb29yIiwidGFiV2lkdGhzIiwibWFwIiwic3RhcnRJbmRleCIsImVuZEluZGV4IiwidG90YWxUYWJzV2lkdGgiLCJyZWR1Y2UiLCJzdW0iLCJ3IiwiaSIsImVmZmVjdGl2ZU1heFdpZHRoIiwid2luZG93V2lkdGgiLCJjYW5FeHBhbmRMZWZ0IiwiY2FuRXhwYW5kUmlnaHQiLCJsZWZ0V2lkdGgiLCJyaWdodFdpZHRoIiwiaGlkZGVuTGVmdCIsImhpZGRlblJpZ2h0IiwidmlzaWJsZVRhYnMiLCJzbGljZSIsInZpc2libGVJbmRpY2VzIiwiXyIsImFjdHVhbEluZGV4IiwiaXNTZWxlY3RlZCIsImRpc3BsYXlUZXh0IiwidW5kZWZpbmVkIl0sInNvdXJjZXMiOlsiVGFnVGFicy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyB0cnVuY2F0ZVRvV2lkdGggfSBmcm9tICcuLi91dGlscy9mb3JtYXQuanMnXG5cbi8vIENvbnN0YW50cyBmb3Igd2lkdGggY2FsY3VsYXRpb25zIC0gZGVyaXZlZCBmcm9tIGFjdHVhbCByZW5kZXJlZCBzdHJpbmdzXG5jb25zdCBBTExfVEFCX0xBQkVMID0gJ0FsbCdcbmNvbnN0IFRBQl9QQURESU5HID0gMiAvLyBTcGFjZSBiZWZvcmUgYW5kIGFmdGVyIHRhYiB0ZXh0OiBcIiB7dGFifSBcIlxuY29uc3QgSEFTSF9QUkVGSVhfTEVOR1RIID0gMSAvLyBcIiNcIiBwcmVmaXggZm9yIG5vbi1BbGwgdGFic1xuY29uc3QgTEVGVF9BUlJPV19QUkVGSVggPSAn4oaQICdcbmNvbnN0IFJJR0hUX0hJTlRfV0lUSF9DT1VOVF9QUkVGSVggPSAn4oaSJ1xuY29uc3QgUklHSFRfSElOVF9TVUZGSVggPSAnICh0YWIgdG8gY3ljbGUpJ1xuY29uc3QgUklHSFRfSElOVF9OT19DT1VOVCA9ICcodGFiIHRvIGN5Y2xlKSdcbmNvbnN0IE1BWF9PVkVSRkxPV19ESUdJVFMgPSAyIC8vIEFzc3VtZSBtYXggOTkgaGlkZGVuIHRhYnMgZm9yIHdpZHRoIGNhbGN1bGF0aW9uXG5cbi8vIENvbXB1dGVkIHdpZHRoc1xuY29uc3QgTEVGVF9BUlJPV19XSURUSCA9IExFRlRfQVJST1dfUFJFRklYLmxlbmd0aCArIE1BWF9PVkVSRkxPV19ESUdJVFMgKyAxIC8vIFwi4oaQIE5OIFwiIHdpdGggZ2FwXG5jb25zdCBSSUdIVF9ISU5UX1dJRFRIX1dJVEhfQ09VTlQgPVxuICBSSUdIVF9ISU5UX1dJVEhfQ09VTlRfUFJFRklYLmxlbmd0aCArXG4gIE1BWF9PVkVSRkxPV19ESUdJVFMgK1xuICBSSUdIVF9ISU5UX1NVRkZJWC5sZW5ndGggLy8gXCLihpJOTiAodGFiIHRvIGN5Y2xlKVwiXG5jb25zdCBSSUdIVF9ISU5UX1dJRFRIX05PX0NPVU5UID0gUklHSFRfSElOVF9OT19DT1VOVC5sZW5ndGhcblxudHlwZSBQcm9wcyA9IHtcbiAgdGFiczogc3RyaW5nW11cbiAgc2VsZWN0ZWRJbmRleDogbnVtYmVyXG4gIGF2YWlsYWJsZVdpZHRoOiBudW1iZXJcbiAgc2hvd0FsbFByb2plY3RzPzogYm9vbGVhblxufVxuXG4vKipcbiAqIENhbGN1bGF0ZSB0aGUgZGlzcGxheSB3aWR0aCBvZiBhIHRhYlxuICovXG5mdW5jdGlvbiBnZXRUYWJXaWR0aCh0YWI6IHN0cmluZywgbWF4V2lkdGg/OiBudW1iZXIpOiBudW1iZXIge1xuICBpZiAodGFiID09PSBBTExfVEFCX0xBQkVMKSB7XG4gICAgcmV0dXJuIEFMTF9UQUJfTEFCRUwubGVuZ3RoICsgVEFCX1BBRERJTkdcbiAgfVxuICAvLyBGb3Igbm9uLUFsbCB0YWJzOiBcIiAje3RhZ30gXCIgYnV0IHRydW5jYXRlIHRhZyBpZiBuZWVkZWRcbiAgY29uc3QgdGFnV2lkdGggPSBzdHJpbmdXaWR0aCh0YWIpXG4gIGNvbnN0IGVmZmVjdGl2ZVRhZ1dpZHRoID0gbWF4V2lkdGhcbiAgICA/IE1hdGgubWluKHRhZ1dpZHRoLCBtYXhXaWR0aCAtIFRBQl9QQURESU5HIC0gSEFTSF9QUkVGSVhfTEVOR1RIKVxuICAgIDogdGFnV2lkdGhcbiAgcmV0dXJuIE1hdGgubWF4KDAsIGVmZmVjdGl2ZVRhZ1dpZHRoKSArIFRBQl9QQURESU5HICsgSEFTSF9QUkVGSVhfTEVOR1RIXG59XG5cbi8qKlxuICogVHJ1bmNhdGUgYSB0YWcgdG8gZml0IHdpdGhpbiBtYXhXaWR0aCwgYWNjb3VudGluZyBmb3IgcGFkZGluZyBhbmQgaGFzaCBwcmVmaXhcbiAqL1xuZnVuY3Rpb24gdHJ1bmNhdGVUYWcodGFnOiBzdHJpbmcsIG1heFdpZHRoOiBudW1iZXIpOiBzdHJpbmcge1xuICAvLyBBdmFpbGFibGUgc3BhY2UgZm9yIHRoZSB0YWcgdGV4dCBpdHNlbGY6IG1heFdpZHRoIC0gXCIgI1wiIC0gXCIgXCJcbiAgY29uc3QgYXZhaWxhYmxlRm9yVGFnID0gbWF4V2lkdGggLSBUQUJfUEFERElORyAtIEhBU0hfUFJFRklYX0xFTkdUSFxuICBpZiAoc3RyaW5nV2lkdGgodGFnKSA8PSBhdmFpbGFibGVGb3JUYWcpIHtcbiAgICByZXR1cm4gdGFnXG4gIH1cbiAgaWYgKGF2YWlsYWJsZUZvclRhZyA8PSAxKSB7XG4gICAgcmV0dXJuIHRhZy5jaGFyQXQoMClcbiAgfVxuICByZXR1cm4gdHJ1bmNhdGVUb1dpZHRoKHRhZywgYXZhaWxhYmxlRm9yVGFnKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gVGFnVGFicyh7XG4gIHRhYnMsXG4gIHNlbGVjdGVkSW5kZXgsXG4gIGF2YWlsYWJsZVdpZHRoLFxuICBzaG93QWxsUHJvamVjdHMgPSBmYWxzZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcmVzdW1lTGFiZWwgPSBzaG93QWxsUHJvamVjdHMgPyAnUmVzdW1lIChBbGwgUHJvamVjdHMpJyA6ICdSZXN1bWUnXG4gIGNvbnN0IHJlc3VtZUxhYmVsV2lkdGggPSByZXN1bWVMYWJlbC5sZW5ndGggKyAxIC8vICsxIGZvciBnYXBcblxuICAvLyBDYWxjdWxhdGUgaG93IG11Y2ggc3BhY2Ugd2UgaGF2ZSBmb3IgdGFicyAodXNlIHdvcnN0LWNhc2UgaGludCB3aWR0aClcbiAgY29uc3QgcmlnaHRIaW50V2lkdGggPSBNYXRoLm1heChcbiAgICBSSUdIVF9ISU5UX1dJRFRIX1dJVEhfQ09VTlQsXG4gICAgUklHSFRfSElOVF9XSURUSF9OT19DT1VOVCxcbiAgKVxuICBjb25zdCBtYXhUYWJzV2lkdGggPSBhdmFpbGFibGVXaWR0aCAtIHJlc3VtZUxhYmVsV2lkdGggLSByaWdodEhpbnRXaWR0aCAtIDIgLy8gMiBmb3IgZ2Fwc1xuXG4gIC8vIENsYW1wIHNlbGVjdGVkSW5kZXggdG8gdmFsaWQgcmFuZ2VcbiAgY29uc3Qgc2FmZVNlbGVjdGVkSW5kZXggPSBNYXRoLm1heChcbiAgICAwLFxuICAgIE1hdGgubWluKHNlbGVjdGVkSW5kZXgsIHRhYnMubGVuZ3RoIC0gMSksXG4gIClcblxuICAvLyBDYWxjdWxhdGUgd2lkdGggb2YgZWFjaCB0YWIsIHdpdGggdHJ1bmNhdGlvbiBmb3IgdmVyeSBsb25nIHRhZ3NcbiAgY29uc3QgbWF4U2luZ2xlVGFiV2lkdGggPSBNYXRoLm1heCgyMCwgTWF0aC5mbG9vcihtYXhUYWJzV2lkdGggLyAyKSkgLy8gQXQgbGVhc3Qgc2hvdyBoYWxmIHRoZSBzcGFjZSBmb3Igb25lIHRhYlxuICBjb25zdCB0YWJXaWR0aHMgPSB0YWJzLm1hcCh0YWIgPT4gZ2V0VGFiV2lkdGgodGFiLCBtYXhTaW5nbGVUYWJXaWR0aCkpXG5cbiAgLy8gRmluZCBhIHdpbmRvdyBvZiB0YWJzIHRoYXQgZml0cywgY2VudGVyZWQgYXJvdW5kIHNlbGVjdGVkSW5kZXhcbiAgbGV0IHN0YXJ0SW5kZXggPSAwXG4gIGxldCBlbmRJbmRleCA9IHRhYnMubGVuZ3RoXG5cbiAgLy8gQ2FsY3VsYXRlIHRvdGFsIHdpZHRoIG9mIGFsbCB0YWJzXG4gIGNvbnN0IHRvdGFsVGFic1dpZHRoID0gdGFiV2lkdGhzLnJlZHVjZShcbiAgICAoc3VtLCB3LCBpKSA9PiBzdW0gKyB3ICsgKGkgPCB0YWJXaWR0aHMubGVuZ3RoIC0gMSA/IDEgOiAwKSxcbiAgICAwLFxuICApIC8vICsxIGZvciBnYXBzIGJldHdlZW4gdGFic1xuXG4gIGlmICh0b3RhbFRhYnNXaWR0aCA+IG1heFRhYnNXaWR0aCkge1xuICAgIC8vIE5lZWQgdG8gc2hvdyBhIHN1YnNldCAtIGFjY291bnQgZm9yIGxlZnQgYXJyb3cgd2hlbiBub3QgYXQgc3RhcnRcbiAgICBjb25zdCBlZmZlY3RpdmVNYXhXaWR0aCA9IG1heFRhYnNXaWR0aCAtIExFRlRfQVJST1dfV0lEVEhcblxuICAgIC8vIFN0YXJ0IHdpdGggdGhlIHNlbGVjdGVkIHRhYlxuICAgIGxldCB3aW5kb3dXaWR0aCA9IHRhYldpZHRoc1tzYWZlU2VsZWN0ZWRJbmRleF0gPz8gMFxuICAgIHN0YXJ0SW5kZXggPSBzYWZlU2VsZWN0ZWRJbmRleFxuICAgIGVuZEluZGV4ID0gc2FmZVNlbGVjdGVkSW5kZXggKyAxXG5cbiAgICAvLyBFeHBhbmQgd2luZG93IHRvIGluY2x1ZGUgbW9yZSB0YWJzXG4gICAgd2hpbGUgKHN0YXJ0SW5kZXggPiAwIHx8IGVuZEluZGV4IDwgdGFicy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGNhbkV4cGFuZExlZnQgPSBzdGFydEluZGV4ID4gMFxuICAgICAgY29uc3QgY2FuRXhwYW5kUmlnaHQgPSBlbmRJbmRleCA8IHRhYnMubGVuZ3RoXG5cbiAgICAgIGlmIChjYW5FeHBhbmRMZWZ0KSB7XG4gICAgICAgIGNvbnN0IGxlZnRXaWR0aCA9ICh0YWJXaWR0aHNbc3RhcnRJbmRleCAtIDFdID8/IDApICsgMSAvLyArMSBmb3IgZ2FwXG4gICAgICAgIGlmICh3aW5kb3dXaWR0aCArIGxlZnRXaWR0aCA8PSBlZmZlY3RpdmVNYXhXaWR0aCkge1xuICAgICAgICAgIHN0YXJ0SW5kZXgtLVxuICAgICAgICAgIHdpbmRvd1dpZHRoICs9IGxlZnRXaWR0aFxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNhbkV4cGFuZFJpZ2h0KSB7XG4gICAgICAgIGNvbnN0IHJpZ2h0V2lkdGggPSAodGFiV2lkdGhzW2VuZEluZGV4XSA/PyAwKSArIDEgLy8gKzEgZm9yIGdhcFxuICAgICAgICBpZiAod2luZG93V2lkdGggKyByaWdodFdpZHRoIDw9IGVmZmVjdGl2ZU1heFdpZHRoKSB7XG4gICAgICAgICAgZW5kSW5kZXgrK1xuICAgICAgICAgIHdpbmRvd1dpZHRoICs9IHJpZ2h0V2lkdGhcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgY29uc3QgaGlkZGVuTGVmdCA9IHN0YXJ0SW5kZXhcbiAgY29uc3QgaGlkZGVuUmlnaHQgPSB0YWJzLmxlbmd0aCAtIGVuZEluZGV4XG4gIGNvbnN0IHZpc2libGVUYWJzID0gdGFicy5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleClcbiAgY29uc3QgdmlzaWJsZUluZGljZXMgPSB2aXNpYmxlVGFicy5tYXAoKF8sIGkpID0+IHN0YXJ0SW5kZXggKyBpKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsxfT5cbiAgICAgIDxUZXh0IGNvbG9yPVwic3VnZ2VzdGlvblwiPntyZXN1bWVMYWJlbH08L1RleHQ+XG4gICAgICB7aGlkZGVuTGVmdCA+IDAgJiYgKFxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICB7TEVGVF9BUlJPV19QUkVGSVh9XG4gICAgICAgICAge2hpZGRlbkxlZnR9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgICB7dmlzaWJsZVRhYnMubWFwKCh0YWIsIGkpID0+IHtcbiAgICAgICAgY29uc3QgYWN0dWFsSW5kZXggPSB2aXNpYmxlSW5kaWNlc1tpXSFcbiAgICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IGFjdHVhbEluZGV4ID09PSBzYWZlU2VsZWN0ZWRJbmRleFxuICAgICAgICBjb25zdCBkaXNwbGF5VGV4dCA9XG4gICAgICAgICAgdGFiID09PSBBTExfVEFCX0xBQkVMXG4gICAgICAgICAgICA/IHRhYlxuICAgICAgICAgICAgOiBgIyR7dHJ1bmNhdGVUYWcodGFiLCBtYXhTaW5nbGVUYWJXaWR0aCAtIFRBQl9QQURESU5HKX1gXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPFRleHRcbiAgICAgICAgICAgIGtleT17dGFifVxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yPXtpc1NlbGVjdGVkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgY29sb3I9e2lzU2VsZWN0ZWQgPyAnaW52ZXJzZVRleHQnIDogdW5kZWZpbmVkfVxuICAgICAgICAgICAgYm9sZD17aXNTZWxlY3RlZH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAge2Rpc3BsYXlUZXh0fXsnICd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApXG4gICAgICB9KX1cbiAgICAgIHtoaWRkZW5SaWdodCA+IDAgPyAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIHtSSUdIVF9ISU5UX1dJVEhfQ09VTlRfUFJFRklYfVxuICAgICAgICAgIHtoaWRkZW5SaWdodH1cbiAgICAgICAgICB7UklHSFRfSElOVF9TVUZGSVh9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICkgOiAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPntSSUdIVF9ISU5UX05PX0NPVU5UfTwvVGV4dD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsV0FBVyxRQUFRLHVCQUF1QjtBQUNuRCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLGVBQWUsUUFBUSxvQkFBb0I7O0FBRXBEO0FBQ0EsTUFBTUMsYUFBYSxHQUFHLEtBQUs7QUFDM0IsTUFBTUMsV0FBVyxHQUFHLENBQUMsRUFBQztBQUN0QixNQUFNQyxrQkFBa0IsR0FBRyxDQUFDLEVBQUM7QUFDN0IsTUFBTUMsaUJBQWlCLEdBQUcsSUFBSTtBQUM5QixNQUFNQyw0QkFBNEIsR0FBRyxHQUFHO0FBQ3hDLE1BQU1DLGlCQUFpQixHQUFHLGlCQUFpQjtBQUMzQyxNQUFNQyxtQkFBbUIsR0FBRyxnQkFBZ0I7QUFDNUMsTUFBTUMsbUJB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
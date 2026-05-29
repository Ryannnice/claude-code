// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo } from 'react';
// 引入 useTerminalSize，将 ../../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../../ink/stringWidth.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 类型依赖 { Question } 来自 ../../../tools/AskUserQuestionTool/AskUserQuestionTool.js，用于校准终端渲染的数据契约。
import type { Question } from '../../../tools/AskUserQuestionTool/AskUserQuestionTool.js';
// 复用 truncateToWidth 工具函数，把通用处理留在 ../../../utils/format.js 中维护。
import { truncateToWidth } from '../../../utils/format.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  hideSubmitTab?: boolean;
};
// QuestionNavigationBar 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function QuestionNavigationBar(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(39);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    questions,
    currentQuestionIndex,
    answers,
    hideSubmitTab: t1
  } = t0;
  // hideSubmitTab标记终端渲染权限确认界面 Question Navigation Bar是否启用对应路径。
  const hideSubmitTab = t1 === undefined ? false : t1;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== columns || $[1] !== currentQuestionIndex || $[2] !== hideSubmitTab || $[3] !== questions) {
    // 权限确认界面 Question Navigation Bar在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // submitText保存`hideSubmitTab ? "" : ` ${figures.tick} Submit ``，供后续判断或组装使用。
      const submitText = hideSubmitTab ? "" : ` ${figures.tick} Submit `;
      // fixedWidth保存`stringWidth`，供终端渲染后续处理使用。
      const fixedWidth = stringWidth("\u2190 ") + stringWidth(" \u2192") + stringWidth(submitText);
      // availableForTabs 集合保存`columns - fixedWidth`，供终端渲染权限确认界面 Question Navigation Bar后续判断或输出使用。
      const availableForTabs = columns - fixedWidth;
      // 满足 `availableForTabs <= 0` 时，终端渲染执行该分支。
      if (availableForTabs <= 0) {
        // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
        let t3;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[5] !== currentQuestionIndex || $[6] !== questions) {
          // t4 暂存 `(q, index) => {` 的派生结果，便于缓存命中时直接复用。
          let t4;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[8] !== currentQuestionIndex) {
            // t4 暂存 `(q, index) => {` 生成的渲染片段，后续返回路径直接复用。
            t4 = (q, index) => {
              // header标记终端渲染权限确认界面 Question Navigation Bar是否启用对应路径。
              const header = q?.header || `Q${index + 1}`;
              // 返回 `index === currentQuestionIndex ? header.slice(0, 3) : ""`，作为终端渲染这次计算的结果。
              return index === currentQuestionIndex ? header.slice(0, 3) : "";
            };
            // $[8] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
            $[8] = currentQuestionIndex;
            // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
            $[9] = t4;
          } else {
            // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
            t4 = $[9];
          }
          // t3 暂存 `questions.map(t4)` 生成的渲染片段，后续返回路径直接复用。
          t3 = questions.map(t4);
          // $[5] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
          $[5] = currentQuestionIndex;
          // $[6] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
          $[6] = questions;
          // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[7] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[7];
        }
        // t2 暂存 `t3` 生成的渲染片段，后续返回路径直接复用。
        t2 = t3;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // tabHeaders 集合派生`questions.map`，供终端渲染后续处理使用。
      const tabHeaders = questions.map(_temp);
      // idealWidths 集合派生`tabHeaders.map`，供终端渲染后续处理使用。
      const idealWidths = tabHeaders.map(_temp2);
      // totalIdealWidth派生`idealWidths.reduce`，供终端渲染后续处理使用。
      const totalIdealWidth = idealWidths.reduce(_temp3, 0);
      // 满足 `totalIdealWidth <= availableForTabs` 时，终端渲染执行该分支。
      if (totalIdealWidth <= availableForTabs) {
        // t2 暂存 `tabHeaders` 生成的渲染片段，后续返回路径直接复用。
        t2 = tabHeaders;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // currentHeader标记终端渲染权限确认界面 Question Navigation Bar是否启用对应路径。
      const currentHeader = tabHeaders[currentQuestionIndex] || "";
      // currentIdealWidth保存`stringWidth`，供终端渲染后续处理使用。
      const currentIdealWidth = 4 + stringWidth(currentHeader);
      // currentTabWidth保存`Math.min`，供终端渲染后续处理使用。
      const currentTabWidth = Math.min(currentIdealWidth, availableForTabs / 2);
      // remainingWidth 命名 `availableForTabs - currentTabWidth`，让后续代码直接表达这个值的用途。
      const remainingWidth = availableForTabs - currentTabWidth;
      // otherTabCount 数量保存 `questions.length - 1` 的判断结果，供终端渲染权限确认界面 Question Navigation Bar后续分支直接复用。
      const otherTabCount = questions.length - 1;
      // widthPerOtherTab保存`Math.max`，供终端渲染后续处理使用。
      const widthPerOtherTab = Math.max(6, Math.floor(remainingWidth / Math.max(otherTabCount, 1)));
      // t3 暂存 `(header_1, index_1) => {` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[10] !== currentQuestionIndex || $[11] !== currentTabWidth || $[12] !== widthPerOtherTab) {
        // t3 暂存 `(header_1, index_1) => {` 生成的渲染片段，后续返回路径直接复用。
        t3 = (header_1, index_1) => {
          // 满足 `index_1 === currentQuestionIndex` 时，终端渲染执行该分支。
          if (index_1 === currentQuestionIndex) {
            // maxTextWidth保存`currentTabWidth - 2 - 2`，供终端渲染权限确认界面 Question Navigation Bar后续判断或输出使用。
            const maxTextWidth = currentTabWidth - 2 - 2;
            // 返回 `truncateToWidth(header_1, maxTextWidth)`，作为终端渲染这次计算的结果。
            return truncateToWidth(header_1, maxTextWidth);
          } else {
            // maxTextWidth_0保存`widthPerOtherTab - 2 - 2`，供终端渲染权限确认界面 Question Navigation Bar后续判断或输出使用。
            const maxTextWidth_0 = widthPerOtherTab - 2 - 2;
            // 返回 `truncateToWidth(header_1, maxTextWidth_0)`，作为终端渲染这次计算的结果。
            return truncateToWidth(header_1, maxTextWidth_0);
          }
        };
        // $[10] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
        $[10] = currentQuestionIndex;
        // $[11] 缓存 `currentTabWidth`，下次依赖未变时 React 编译产物可直接复用。
        $[11] = currentTabWidth;
        // $[12] 缓存 `widthPerOtherTab`，下次依赖未变时 React 编译产物可直接复用。
        $[12] = widthPerOtherTab;
        // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[13] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[13];
      }
      // t2 暂存 `tabHeaders.map(t3)` 生成的渲染片段，后续返回路径直接复用。
      t2 = tabHeaders.map(t3);
    }
    // $[0] 缓存 `columns`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = columns;
    // $[1] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = currentQuestionIndex;
    // $[2] 缓存 `hideSubmitTab`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = hideSubmitTab;
    // $[3] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = questions;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // tabDisplayTexts 集合保存`t2`，作为后续临时缓存值处理的输入。
  const tabDisplayTexts = t2;
  // hideArrows 集合标记终端渲染权限确认界面 Question Navigation Bar是否启用对应路径。
  const hideArrows = questions.length === 1 && hideSubmitTab;
  // t3 暂存 `!hideArrows && <Text color={currentQuestionIndex === 0 ? ...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== currentQuestionIndex || $[15] !== hideArrows) {
    // t3 暂存 `!hideArrows && <Text color={currentQuestionIndex === 0 ? ...` 生成的渲染片段，后续返回路径直接复用。
    t3 = !hideArrows && <Text color={currentQuestionIndex === 0 ? "inactive" : undefined}>←{" "}</Text>;
    // $[14] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = currentQuestionIndex;
    // $[15] 缓存 `hideArrows`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = hideArrows;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[16];
  }
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== answers || $[18] !== currentQuestionIndex || $[19] !== questions || $[20] !== tabDisplayTexts) {
    // t5 暂存 `(q_1, index_2) => {` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[22] !== answers || $[23] !== currentQuestionIndex || $[24] !== tabDisplayTexts) {
      // t5 暂存 `(q_1, index_2) => {` 生成的渲染片段，后续返回路径直接复用。
      t5 = (q_1, index_2) => {
        // isSelected标记终端渲染权限确认界面 Question Navigation Bar是否启用对应路径。
        const isSelected = index_2 === currentQuestionIndex;
        // isAnswered标记终端渲染权限确认界面 Question Navigation Bar是否启用对应路径。
        const isAnswered = q_1?.question && !!answers[q_1.question];
        // checkbox 命名 `isAnswered ? figures.checkboxOn : figures.checkboxOff`，让后续代码直接表达这个值的用途。
        const checkbox = isAnswered ? figures.checkboxOn : figures.checkboxOff;
        // displayText标记终端渲染权限确认界面 Question Navigation Bar是否启用对应路径。
        const displayText = tabDisplayTexts[index_2] || q_1?.header || `Q${index_2 + 1}`;
        // 返回 `<Box key={q_1?.question || `question-${index_2}`}>{isSelected ? <Text b...`，作为终端渲染这次计算的结果。
        return <Box key={q_1?.question || `question-${index_2}`}>{isSelected ? <Text backgroundColor="permission" color="inverseText">{" "}{checkbox} {displayText}{" "}</Text> : <Text>{" "}{checkbox} {displayText}{" "}</Text>}</Box>;
      };
      // $[22] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = answers;
      // $[23] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = currentQuestionIndex;
      // $[24] 缓存 `tabDisplayTexts`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = tabDisplayTexts;
      // $[25] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[25];
    }
    // t4 暂存 `questions.map(t5)` 生成的渲染片段，后续返回路径直接复用。
    t4 = questions.map(t5);
    // $[17] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = answers;
    // $[18] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = currentQuestionIndex;
    // $[19] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = questions;
    // $[20] 缓存 `tabDisplayTexts`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = tabDisplayTexts;
    // $[21] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[21];
  }
  // t5 暂存 `!hideSubmitTab && <Box key="submit">{currentQuestionIndex...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== currentQuestionIndex || $[27] !== hideSubmitTab || $[28] !== questions.length) {
    // t5 暂存 `!hideSubmitTab && <Box key="submit">{currentQuestionIndex...` 生成的渲染片段，后续返回路径直接复用。
    t5 = !hideSubmitTab && <Box key="submit">{currentQuestionIndex === questions.length ? <Text backgroundColor="permission" color="inverseText">{" "}{figures.tick} Submit{" "}</Text> : <Text> {figures.tick} Submit </Text>}</Box>;
    // $[26] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = currentQuestionIndex;
    // $[27] 缓存 `hideSubmitTab`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = hideSubmitTab;
    // $[28] 缓存 `questions.length`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = questions.length;
    // $[29] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[29];
  }
  // t6 暂存 `!hideArrows && <Text color={currentQuestionIndex === ques...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== currentQuestionIndex || $[31] !== hideArrows || $[32] !== questions.length) {
    // t6 暂存 `!hideArrows && <Text color={currentQuestionIndex === ques...` 生成的渲染片段，后续返回路径直接复用。
    t6 = !hideArrows && <Text color={currentQuestionIndex === questions.length ? "inactive" : undefined}>{" "}→</Text>;
    // $[30] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = currentQuestionIndex;
    // $[31] 缓存 `hideArrows`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = hideArrows;
    // $[32] 缓存 `questions.length`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = questions.length;
    // $[33] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[33];
  }
  // t7 暂存 `<Box flexDirection="row" marginBottom={1}>{t3}{t4}{t5}{t6...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t3 || $[35] !== t4 || $[36] !== t5 || $[37] !== t6) {
    // t7 暂存 `<Box flexDirection="row" marginBottom={1}>{t3}{t4}{t5}{t6...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="row" marginBottom={1}>{t3}{t4}{t5}{t6}</Box>;
    // $[34] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t3;
    // $[35] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t4;
    // $[36] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t5;
    // $[37] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t6;
    // $[38] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[38];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
// _temp3 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(sum, w) {
  // 返回 `sum + w`，作为终端渲染这次计算的结果。
  return sum + w;
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(header_0) {
  // 返回 `4 + stringWidth(header_0)`，作为终端渲染这次计算的结果。
  return 4 + stringWidth(header_0);
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(q_0, index_0) {
  // 返回 `q_0?.header || `Q${index_0 + 1}``，作为终端渲染这次计算的结果。
  return q_0?.header || `Q${index_0 + 1}`;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VNZW1vIiwidXNlVGVybWluYWxTaXplIiwic3RyaW5nV2lkdGgiLCJCb3giLCJUZXh0IiwiUXVlc3Rpb24iLCJ0cnVuY2F0ZVRvV2lkdGgiLCJQcm9wcyIsInF1ZXN0aW9ucyIsImN1cnJlbnRRdWVzdGlvbkluZGV4IiwiYW5zd2VycyIsIlJlY29yZCIsImhpZGVTdWJtaXRUYWIiLCJRdWVzdGlvbk5hdmlnYXRpb25CYXIiLCJ0MCIsIiQiLCJfYyIsInQxIiwidW5kZWZpbmVkIiwiY29sdW1ucyIsInQyIiwiYmIwIiwic3VibWl0VGV4dCIsInRpY2siLCJmaXhlZFdpZHRoIiwiYXZhaWxhYmxlRm9yVGFicyIsInQzIiwidDQiLCJxIiwiaW5kZXgiLCJoZWFkZXIiLCJzbGljZSIsIm1hcCIsInRhYkhlYWRlcnMiLCJfdGVtcCIsImlkZWFsV2lkdGhzIiwiX3RlbXAyIiwidG90YWxJZGVhbFdpZHRoIiwicmVkdWNlIiwiX3RlbXAzIiwiY3VycmVudEhlYWRlciIsImN1cnJlbnRJZGVhbFdpZHRoIiwiY3VycmVudFRhYldpZHRoIiwiTWF0aCIsIm1pbiIsInJlbWFpbmluZ1dpZHRoIiwib3RoZXJUYWJDb3VudCIsImxlbmd0aCIsIndpZHRoUGVyT3RoZXJUYWIiLCJtYXgiLCJmbG9vciIsImhlYWRlcl8xIiwiaW5kZXhfMSIsIm1heFRleHRXaWR0aCIsIm1heFRleHRXaWR0aF8wIiwidGFiRGlzcGxheVRleHRzIiwiaGlkZUFycm93cyIsInQ1IiwicV8xIiwiaW5kZXhfMiIsImlzU2VsZWN0ZWQiLCJpc0Fuc3dlcmVkIiwicXVlc3Rpb24iLCJjaGVja2JveCIsImNoZWNrYm94T24iLCJjaGVja2JveE9mZiIsImRpc3BsYXlUZXh0IiwidDYiLCJ0NyIsInN1bSIsInciLCJoZWFkZXJfMCIsInFfMCIsImluZGV4XzAiXSwic291cmNlcyI6WyJRdWVzdGlvbk5hdmlnYXRpb25CYXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgUmVhY3QsIHsgdXNlTWVtbyB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vLi4vLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi8uLi8uLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IFF1ZXN0aW9uIH0gZnJvbSAnLi4vLi4vLi4vdG9vbHMvQXNrVXNlclF1ZXN0aW9uVG9vbC9Bc2tVc2VyUXVlc3Rpb25Ub29sLmpzJ1xuaW1wb3J0IHsgdHJ1bmNhdGVUb1dpZHRoIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvZm9ybWF0LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBxdWVzdGlvbnM6IFF1ZXN0aW9uW11cbiAgY3VycmVudFF1ZXN0aW9uSW5kZXg6IG51bWJlclxuICBhbnN3ZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG4gIGhpZGVTdWJtaXRUYWI/OiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBRdWVzdGlvbk5hdmlnYXRpb25CYXIoe1xuICBxdWVzdGlvbnMsXG4gIGN1cnJlbnRRdWVzdGlvbkluZGV4LFxuICBhbnN3ZXJzLFxuICBoaWRlU3VibWl0VGFiID0gZmFsc2UsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcblxuICAvLyBDYWxjdWxhdGUgdGhlIGRpc3BsYXkgdGV4dCBmb3IgZWFjaCB0YWIgYmFzZWQgb24gYXZhaWxhYmxlIHdpZHRoXG4gIGNvbnN0IHRhYkRpc3BsYXlUZXh0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIENhbGN1bGF0ZSBmaXhlZCB3aWR0aCBlbGVtZW50c1xuICAgIGNvbnN0IGxlZnRBcnJvdyA9ICfihpAgJ1xuICAgIGNvbnN0IHJpZ2h0QXJyb3cgPSAnIOKGkidcbiAgICBjb25zdCBzdWJtaXRUZXh0ID0gaGlkZVN1Ym1pdFRhYiA/ICcnIDogYCAke2ZpZ3VyZXMudGlja30gU3VibWl0IGBcbiAgICBjb25zdCBjaGVja2JveFdpZHRoID0gMiAvLyBjaGVja2JveCArIHNwYWNlXG4gICAgY29uc3QgcGFkZGluZ1BlclRhYiA9IDIgLy8gc3BhY2UgYmVmb3JlIGFuZCBhZnRlciBlYWNoIHRhYiB0ZXh0XG5cbiAgICBjb25zdCBmaXhlZFdpZHRoID1cbiAgICAgIHN0cmluZ1dpZHRoKGxlZnRBcnJvdykgKyBzdHJpbmdXaWR0aChyaWdodEFycm93KSArIHN0cmluZ1dpZHRoKHN1Ym1pdFRleHQpXG5cbiAgICAvLyBBdmFpbGFibGUgd2lkdGggZm9yIGFsbCBxdWVzdGlvbiB0YWJzXG4gICAgY29uc3QgYXZhaWxhYmxlRm9yVGFicyA9IGNvbHVtbnMgLSBmaXhlZFdpZHRoXG5cbiAgICBpZiAoYXZhaWxhYmxlRm9yVGFicyA8PSAwKSB7XG4gICAgICAvLyBUZXJtaW5hbCB0b28gbmFycm93LCBmYWxsYmFjayB0byBtaW5pbWFsIGRpc3BsYXlcbiAgICAgIHJldHVybiBxdWVzdGlvbnMubWFwKChxOiBRdWVzdGlvbiwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBxPy5oZWFkZXIgfHwgYFEke2luZGV4ICsgMX1gXG4gICAgICAgIHJldHVybiBpbmRleCA9PT0gY3VycmVudFF1ZXN0aW9uSW5kZXggPyBoZWFkZXIuc2xpY2UoMCwgMykgOiAnJ1xuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgaWRlYWwgd2lkdGggZm9yIGVhY2ggdGFiIChjaGVja2JveCArIHBhZGRpbmcgKyB0ZXh0KVxuICAgIGNvbnN0IHRhYkhlYWRlcnMgPSBxdWVzdGlvbnMubWFwKFxuICAgICAgKHE6IFF1ZXN0aW9uLCBpbmRleDogbnVtYmVyKSA9PiBxPy5oZWFkZXIgfHwgYFEke2luZGV4ICsgMX1gLFxuICAgIClcbiAgICBjb25zdCBpZGVhbFdpZHRocyA9IHRhYkhlYWRlcnMubWFwKFxuICAgICAgaGVhZGVyID0+IGNoZWNrYm94V2lkdGggKyBwYWRkaW5nUGVyVGFiICsgc3RyaW5nV2lkdGgoaGVhZGVyKSxcbiAgICApXG5cbiAgICAvLyBDYWxjdWxhdGUgdG90YWwgaWRlYWwgd2lkdGhcbiAgICBjb25zdCB0b3RhbElkZWFsV2lkdGggPSBpZGVhbFdpZHRocy5yZWR1Y2UoKHN1bSwgdykgPT4gc3VtICsgdywgMClcblxuICAgIC8vIElmIGV2ZXJ5dGhpbmcgZml0cywgdXNlIGZ1bGwgaGVhZGVyc1xuICAgIGlmICh0b3RhbElkZWFsV2lkdGggPD0gYXZhaWxhYmxlRm9yVGFicykge1xuICAgICAgcmV0dXJuIHRhYkhlYWRlcnNcbiAgICB9XG5cbiAgICAvLyBOZWVkIHRvIHRydW5jYXRlIC0gcHJpb3JpdGl6ZSBjdXJyZW50IHRhYlxuICAgIGNvbnN0IGN1cnJlbnRIZWFkZXIgPSB0YWJIZWFkZXJzW2N1cnJlbnRRdWVzdGlvbkluZGV4XSB8fCAnJ1xuICAgIGNvbnN0IGN1cnJlbnRJZGVhbFdpZHRoID1cbiAgICAgIGNoZWNrYm94V2lkdGggKyBwYWRkaW5nUGVyVGFiICsgc3RyaW5nV2lkdGgoY3VycmVudEhlYWRlcilcblxuICAgIC8vIE1pbmltdW0gd2lkdGggZm9yIG90aGVyIHRhYnMgKGNoZWNrYm94ICsgcGFkZGluZyArIDEgY2hhciArIGVsbGlwc2lzKVxuICAgIGNvbnN0IG1pbldpZHRoUGVyVGFiID0gY2hlY2tib3hXaWR0aCArIHBhZGRpbmdQZXJUYWIgKyAyIC8vIFwiWOKAplwiXG5cbiAgICAvLyBDYWxjdWxhdGUgc3BhY2UgZm9yIGN1cnJlbnQgdGFiICh0cnkgdG8gc2hvdyBmdWxsIHRleHQpXG4gICAgY29uc3QgY3VycmVudFRhYldpZHRoID0gTWF0aC5taW4oY3VycmVudElkZWFsV2lkdGgsIGF2YWlsYWJsZUZvclRhYnMgLyAyKVxuICAgIGNvbnN0IHJlbWFpbmluZ1dpZHRoID0gYXZhaWxhYmxlRm9yVGFicyAtIGN1cnJlbnRUYWJXaWR0aFxuXG4gICAgLy8gQ2FsY3VsYXRlIHNwYWNlIGZvciBvdGhlciB0YWJzXG4gICAgY29uc3Qgb3RoZXJUYWJDb3VudCA9IHF1ZXN0aW9ucy5sZW5ndGggLSAxXG4gICAgY29uc3Qgd2lkdGhQZXJPdGhlclRhYiA9IE1hdGgubWF4KFxuICAgICAgbWluV2lkdGhQZXJUYWIsXG4gICAgICBNYXRoLmZsb29yKHJlbWFpbmluZ1dpZHRoIC8gTWF0aC5tYXgob3RoZXJUYWJDb3VudCwgMSkpLFxuICAgIClcblxuICAgIHJldHVybiB0YWJIZWFkZXJzLm1hcCgoaGVhZGVyLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKGluZGV4ID09PSBjdXJyZW50UXVlc3Rpb25JbmRleCkge1xuICAgICAgICAvLyBDdXJyZW50IHRhYiAtIHNob3cgYXMgbXVjaCBhcyBwb3NzaWJsZVxuICAgICAgICBjb25zdCBtYXhUZXh0V2lkdGggPSBjdXJyZW50VGFiV2lkdGggLSBjaGVja2JveFdpZHRoIC0gcGFkZGluZ1BlclRhYlxuICAgICAgICByZXR1cm4gdHJ1bmNhdGVUb1dpZHRoKGhlYWRlciwgbWF4VGV4dFdpZHRoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gT3RoZXIgdGFicyAtIHRydW5jYXRlIHRvIGZpdFxuICAgICAgICBjb25zdCBtYXhUZXh0V2lkdGggPSB3aWR0aFBlck90aGVyVGFiIC0gY2hlY2tib3hXaWR0aCAtIHBhZGRpbmdQZXJUYWJcbiAgICAgICAgcmV0dXJuIHRydW5jYXRlVG9XaWR0aChoZWFkZXIsIG1heFRleHRXaWR0aClcbiAgICAgIH1cbiAgICB9KVxuICB9LCBbcXVlc3Rpb25zLCBjdXJyZW50UXVlc3Rpb25JbmRleCwgY29sdW1ucywgaGlkZVN1Ym1pdFRhYl0pXG5cbiAgY29uc3QgaGlkZUFycm93cyA9IHF1ZXN0aW9ucy5sZW5ndGggPT09IDEgJiYgaGlkZVN1Ym1pdFRhYlxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgIHshaGlkZUFycm93cyAmJiAoXG4gICAgICAgIDxUZXh0IGNvbG9yPXtjdXJyZW50UXVlc3Rpb25JbmRleCA9PT0gMCA/ICdpbmFjdGl2ZScgOiB1bmRlZmluZWR9PlxuICAgICAgICAgIOKGkHsnICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgICB7cXVlc3Rpb25zLm1hcCgocTogUXVlc3Rpb24sIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IGluZGV4ID09PSBjdXJyZW50UXVlc3Rpb25JbmRleFxuICAgICAgICBjb25zdCBpc0Fuc3dlcmVkID0gcT8ucXVlc3Rpb24gJiYgISFhbnN3ZXJzW3EucXVlc3Rpb25dXG4gICAgICAgIGNvbnN0IGNoZWNrYm94ID0gaXNBbnN3ZXJlZCA/IGZpZ3VyZXMuY2hlY2tib3hPbiA6IGZpZ3VyZXMuY2hlY2tib3hPZmZcbiAgICAgICAgY29uc3QgZGlzcGxheVRleHQgPVxuICAgICAgICAgIHRhYkRpc3BsYXlUZXh0c1tpbmRleF0gfHwgcT8uaGVhZGVyIHx8IGBRJHtpbmRleCArIDF9YFxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPEJveCBrZXk9e3E/LnF1ZXN0aW9uIHx8IGBxdWVzdGlvbi0ke2luZGV4fWB9PlxuICAgICAgICAgICAge2lzU2VsZWN0ZWQgPyAoXG4gICAgICAgICAgICAgIDxUZXh0IGJhY2tncm91bmRDb2xvcj1cInBlcm1pc3Npb25cIiBjb2xvcj1cImludmVyc2VUZXh0XCI+XG4gICAgICAgICAgICAgICAgeycgJ31cbiAgICAgICAgICAgICAgICB7Y2hlY2tib3h9IHtkaXNwbGF5VGV4dH17JyAnfVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAgICAgIHtjaGVja2JveH0ge2Rpc3BsYXlUZXh0fXsnICd9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgIClcbiAgICAgIH0pfVxuICAgICAgeyFoaWRlU3VibWl0VGFiICYmIChcbiAgICAgICAgPEJveCBrZXk9XCJzdWJtaXRcIj5cbiAgICAgICAgICB7Y3VycmVudFF1ZXN0aW9uSW5kZXggPT09IHF1ZXN0aW9ucy5sZW5ndGggPyAoXG4gICAgICAgICAgICA8VGV4dCBiYWNrZ3JvdW5kQ29sb3I9XCJwZXJtaXNzaW9uXCIgY29sb3I9XCJpbnZlcnNlVGV4dFwiPlxuICAgICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAgICB7ZmlndXJlcy50aWNrfSBTdWJtaXR7JyAnfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8VGV4dD4ge2ZpZ3VyZXMudGlja30gU3VibWl0IDwvVGV4dD5cbiAgICAgICAgICApfVxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgICB7IWhpZGVBcnJvd3MgJiYgKFxuICAgICAgICA8VGV4dFxuICAgICAgICAgIGNvbG9yPXtcbiAgICAgICAgICAgIGN1cnJlbnRRdWVzdGlvbkluZGV4ID09PSBxdWVzdGlvbnMubGVuZ3RoID8gJ2luYWN0aXZlJyA6IHVuZGVmaW5lZFxuICAgICAgICAgIH1cbiAgICAgICAgPlxuICAgICAgICAgIHsnICd9XG4gICAgICAgICAg4oaSXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU9DLEtBQUssSUFBSUMsT0FBTyxRQUFRLE9BQU87QUFDdEMsU0FBU0MsZUFBZSxRQUFRLG1DQUFtQztBQUNuRSxTQUFTQyxXQUFXLFFBQVEsNkJBQTZCO0FBQ3pELFNBQVNDLEdB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
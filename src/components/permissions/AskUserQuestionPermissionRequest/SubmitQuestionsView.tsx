// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 类型依赖 { Question } 来自 ../../../tools/AskUserQuestionTool/AskUserQuestionTool.js，用于校准终端渲染的数据契约。
import type { Question } from '../../../tools/AskUserQuestionTool/AskUserQuestionTool.js';
// 类型依赖 { PermissionDecision } 来自 ../../../utils/permissions/PermissionResult.js，用于校准终端渲染的数据契约。
import type { PermissionDecision } from '../../../utils/permissions/PermissionResult.js';
// 引入 Select，将 ../../CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../../CustomSelect/index.js';
// 引入 Divider，将 ../../design-system/Divider.js 中已经封装好的能力接到本文件流程里。
import { Divider } from '../../design-system/Divider.js';
// 引入 PermissionRequestTitle，将 ../PermissionRequestTitle.js 中已经封装好的能力接到本文件流程里。
import { PermissionRequestTitle } from '../PermissionRequestTitle.js';
// 引入 PermissionRuleExplanation，将 ../PermissionRuleExplanation.js 中已经封装好的能力接到本文件流程里。
import { PermissionRuleExplanation } from '../PermissionRuleExplanation.js';
// 引入 QuestionNavigationBar，将 ./QuestionNavigationBar.js 中已经封装好的能力接到本文件流程里。
import { QuestionNavigationBar } from './QuestionNavigationBar.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  allQuestionsAnswered: boolean;
  permissionResult: PermissionDecision;
  minContentHeight?: number;
  // 这个回调绑定到 onFinalResponse: (value: 'submit' | 'cancel') => void;，负责终端渲染在该局部场景下的响应。
  onFinalResponse: (value: 'submit' | 'cancel') => void;
};
// SubmitQuestionsView 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SubmitQuestionsView(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(27);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    questions,
    currentQuestionIndex,
    answers,
    allQuestionsAnswered,
    permissionResult,
    minContentHeight,
    onFinalResponse
  } = t0;
  // t1 暂存 `<Divider color="inactive" />` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Divider color="inactive" />` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Divider color="inactive" />;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `<QuestionNavigationBar questions={questions} currentQuest...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== answers || $[2] !== currentQuestionIndex || $[3] !== questions) {
    // t2 暂存 `<QuestionNavigationBar questions={questions} currentQuest...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <QuestionNavigationBar questions={questions} currentQuestionIndex={currentQuestionIndex} answers={answers} />;
    // $[1] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = answers;
    // $[2] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = currentQuestionIndex;
    // $[3] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = questions;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<PermissionRequestTitle title="Review your answers" color...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<PermissionRequestTitle title="Review your answers" color...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <PermissionRequestTitle title="Review your answers" color="text" />;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `!allQuestionsAnswered && <Box marginBottom={1}><Text colo...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== allQuestionsAnswered) {
    // t4 暂存 `!allQuestionsAnswered && <Box marginBottom={1}><Text colo...` 生成的渲染片段，后续返回路径直接复用。
    t4 = !allQuestionsAnswered && <Box marginBottom={1}><Text color="warning">{figures.warning} You have not answered all questions</Text></Box>;
    // $[6] 缓存 `allQuestionsAnswered`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = allQuestionsAnswered;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `Object.keys(answers).length > 0 && <Box flexDirection="co...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== answers || $[9] !== questions) {
    // t5 暂存 `Object.keys(answers).length > 0 && <Box flexDirection="co...` 生成的渲染片段，后续返回路径直接复用。
    t5 = Object.keys(answers).length > 0 && <Box flexDirection="column" marginBottom={1}>{questions.filter(q => q?.question && answers[q.question]).map(q_0 => {
        // answer 命名 `answers[q_0?.question]`，让后续代码直接表达这个值的用途。
        const answer = answers[q_0?.question];
        // 返回 `<Box key={q_0?.question || "answer"} flexDirection="column" marginLeft=...`，作为终端渲染这次计算的结果。
        return <Box key={q_0?.question || "answer"} flexDirection="column" marginLeft={1}><Text>{figures.bullet} {q_0?.question || "Question"}</Text><Box marginLeft={2}><Text color="success">{figures.arrowRight} {answer}</Text></Box></Box>;
      })}</Box>;
    // $[8] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = answers;
    // $[9] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = questions;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `<PermissionRuleExplanation permissionResult={permissionRe...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== permissionResult) {
    // t6 暂存 `<PermissionRuleExplanation permissionResult={permissionRe...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <PermissionRuleExplanation permissionResult={permissionResult} toolType="tool" />;
    // $[11] 缓存 `permissionResult`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = permissionResult;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // t7 暂存 `<Text color="inactive">Ready to submit your answers?</Tex...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Text color="inactive">Ready to submit your answers?</Tex...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text color="inactive">Ready to submit your answers?</Text>;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[13];
  }
  // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t8 = {
      type: "text" as const,
      label: "Submit answers",
      value: "submit"
    };
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // t9 暂存 `[t8, {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `[t8, {` 生成的渲染片段，后续返回路径直接复用。
    t9 = [t8, {
      type: "text" as const,
      label: "Cancel",
      value: "cancel"
    }];
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // t10 暂存 `<Box marginTop={1}><Select options={t9} onChange={value =...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== onFinalResponse) {
    // t10 暂存 `<Box marginTop={1}><Select options={t9} onChange={value =...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box marginTop={1}><Select options={t9} onChange={value => onFinalResponse(value as 'submit' | 'cancel')} onCancel={() => onFinalResponse("cancel")} /></Box>;
    // $[16] 缓存 `onFinalResponse`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onFinalResponse;
    // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[17];
  }
  // t11 暂存 `<Box flexDirection="column" marginTop={1} minHeight={minC...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== minContentHeight || $[19] !== t10 || $[20] !== t4 || $[21] !== t5 || $[22] !== t6) {
    // t11 暂存 `<Box flexDirection="column" marginTop={1} minHeight={minC...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box flexDirection="column" marginTop={1} minHeight={minContentHeight}>{t4}{t5}{t6}{t7}{t10}</Box>;
    // $[18] 缓存 `minContentHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = minContentHeight;
    // $[19] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t10;
    // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t4;
    // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t5;
    // $[22] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t6;
    // $[23] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[23];
  }
  // t12 暂存 `<Box flexDirection="column" marginTop={1}>{t1}<Box flexDi...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== t11 || $[25] !== t2) {
    // t12 暂存 `<Box flexDirection="column" marginTop={1}>{t1}<Box flexDi...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box flexDirection="column" marginTop={1}>{t1}<Box flexDirection="column" borderTop={true} borderColor="inactive" paddingTop={0}>{t2}{t3}{t11}</Box></Box>;
    // $[24] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t11;
    // $[25] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t2;
    // $[26] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[26];
  }
  // 返回 `t12`，作为终端渲染这次计算的结果。
  return t12;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwiUXVlc3Rpb24iLCJQZXJtaXNzaW9uRGVjaXNpb24iLCJTZWxlY3QiLCJEaXZpZGVyIiwiUGVybWlzc2lvblJlcXVlc3RUaXRsZSIsIlBlcm1pc3Npb25SdWxlRXhwbGFuYXRpb24iLCJRdWVzdGlvbk5hdmlnYXRpb25CYXIiLCJQcm9wcyIsInF1ZXN0aW9ucyIsImN1cnJlbnRRdWVzdGlvbkluZGV4IiwiYW5zd2VycyIsIlJlY29yZCIsImFsbFF1ZXN0aW9uc0Fuc3dlcmVkIiwicGVybWlzc2lvblJlc3VsdCIsIm1pbkNvbnRlbnRIZWlnaHQiLCJvbkZpbmFsUmVzcG9uc2UiLCJ2YWx1ZSIsIlN1Ym1pdFF1ZXN0aW9uc1ZpZXciLCJ0MCIsIiQiLCJfYyIsInQxIiwiU3ltYm9sIiwiZm9yIiwidDIiLCJ0MyIsInQ0Iiwid2FybmluZyIsInQ1IiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsImZpbHRlciIsInEiLCJxdWVzdGlvbiIsIm1hcCIsInFfMCIsImFuc3dlciIsImJ1bGxldCIsImFycm93UmlnaHQiLCJ0NiIsInQ3IiwidDgiLCJ0eXBlIiwiY29uc3QiLCJsYWJlbCIsInQ5IiwidDEwIiwidDExIiwidDEyIl0sInNvdXJjZXMiOlsiU3VibWl0UXVlc3Rpb25zVmlldy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgUXVlc3Rpb24gfSBmcm9tICcuLi8uLi8uLi90b29scy9Bc2tVc2VyUXVlc3Rpb25Ub29sL0Fza1VzZXJRdWVzdGlvblRvb2wuanMnXG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25EZWNpc2lvbiB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25SZXN1bHQuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi8uLi9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBEaXZpZGVyIH0gZnJvbSAnLi4vLi4vZGVzaWduLXN5c3RlbS9EaXZpZGVyLmpzJ1xuaW1wb3J0IHsgUGVybWlzc2lvblJlcXVlc3RUaXRsZSB9IGZyb20gJy4uL1Blcm1pc3Npb25SZXF1ZXN0VGl0bGUuanMnXG5pbXBvcnQgeyBQZXJtaXNzaW9uUnVsZUV4cGxhbmF0aW9uIH0gZnJvbSAnLi4vUGVybWlzc2lvblJ1bGVFeHBsYW5hdGlvbi5qcydcbmltcG9ydCB7IFF1ZXN0aW9uTmF2aWdhdGlvbkJhciB9IGZyb20gJy4vUXVlc3Rpb25OYXZpZ2F0aW9uQmFyLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBxdWVzdGlvbnM6IFF1ZXN0aW9uW11cbiAgY3VycmVudFF1ZXN0aW9uSW5kZXg6IG51bWJlclxuICBhbnN3ZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG4gIGFsbFF1ZXN0aW9uc0Fuc3dlcmVkOiBib29sZWFuXG4gIHBlcm1pc3Npb25SZXN1bHQ6IFBlcm1pc3Npb25EZWNpc2lvblxuICBtaW5Db250ZW50SGVpZ2h0PzogbnVtYmVyXG4gIG9uRmluYWxSZXNwb25zZTogKHZhbHVlOiAnc3VibWl0JyB8ICdjYW5jZWwnKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTdWJtaXRRdWVzdGlvbnNWaWV3KHtcbiAgcXVlc3Rpb25zLFxuICBjdXJyZW50UXVlc3Rpb25JbmRleCxcbiAgYW5zd2VycyxcbiAgYWxsUXVlc3Rpb25zQW5zd2VyZWQsXG4gIHBlcm1pc3Npb25SZXN1bHQsXG4gIG1pbkNvbnRlbnRIZWlnaHQsXG4gIG9uRmluYWxSZXNwb25zZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgPERpdmlkZXIgY29sb3I9XCJpbmFjdGl2ZVwiIC8+XG4gICAgICA8Qm94XG4gICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICBib3JkZXJUb3BcbiAgICAgICAgYm9yZGVyQ29sb3I9XCJpbmFjdGl2ZVwiXG4gICAgICAgIHBhZGRpbmdUb3A9ezB9XG4gICAgICA+XG4gICAgICAgIDxRdWVzdGlvbk5hdmlnYXRpb25CYXJcbiAgICAgICAgICBxdWVzdGlvbnM9e3F1ZXN0aW9uc31cbiAgICAgICAgICBjdXJyZW50UXVlc3Rpb25JbmRleD17Y3VycmVudFF1ZXN0aW9uSW5kZXh9XG4gICAgICAgICAgYW5zd2Vycz17YW5zd2Vyc31cbiAgICAgICAgLz5cbiAgICAgICAgPFBlcm1pc3Npb25SZXF1ZXN0VGl0bGUgdGl0bGU9XCJSZXZpZXcgeW91ciBhbnN3ZXJzXCIgY29sb3I9XCJ0ZXh0XCIgLz5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfSBtaW5IZWlnaHQ9e21pbkNvbnRlbnRIZWlnaHR9PlxuICAgICAgICAgIHshYWxsUXVlc3Rpb25zQW5zd2VyZWQgJiYgKFxuICAgICAgICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICAgICAgICB7ZmlndXJlcy53YXJuaW5nfSBZb3UgaGF2ZSBub3QgYW5zd2VyZWQgYWxsIHF1ZXN0aW9uc1xuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICApfVxuICAgICAgICAgIHtPYmplY3Qua2V5cyhhbnN3ZXJzKS5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgICAgIHtxdWVzdGlvbnNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChxOiBRdWVzdGlvbikgPT4gcT8ucXVlc3Rpb24gJiYgYW5zd2Vyc1txLnF1ZXN0aW9uXSlcbiAgICAgICAgICAgICAgICAubWFwKChxOiBRdWVzdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYW5zd2VyID0gYW5zd2Vyc1txPy5xdWVzdGlvbl1cblxuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPEJveFxuICAgICAgICAgICAgICAgICAgICAgIGtleT17cT8ucXVlc3Rpb24gfHwgJ2Fuc3dlcid9XG4gICAgICAgICAgICAgICAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgICAgICAgICAgICAgICAgbWFyZ2luTGVmdD17MX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAge2ZpZ3VyZXMuYnVsbGV0fSB7cT8ucXVlc3Rpb24gfHwgJ1F1ZXN0aW9uJ31cbiAgICAgICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgPEJveCBtYXJnaW5MZWZ0PXsyfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VjY2Vzc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7ZmlndXJlcy5hcnJvd1JpZ2h0fSB7YW5zd2VyfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICA8UGVybWlzc2lvblJ1bGVFeHBsYW5hdGlvblxuICAgICAgICAgICAgcGVybWlzc2lvblJlc3VsdD17cGVybWlzc2lvblJlc3VsdH1cbiAgICAgICAgICAgIHRvb2xUeXBlPVwidG9vbFwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImluYWN0aXZlXCI+UmVhZHkgdG8gc3VibWl0IHlvdXIgYW5zd2Vycz88L1RleHQ+XG4gICAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgICBvcHRpb25zPXtbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnIGFzIGNvbnN0LFxuICAgICAgICAgICAgICAgICAgbGFiZWw6ICdTdWJtaXQgYW5zd2VycycsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogJ3N1Ym1pdCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7IHR5cGU6ICd0ZXh0JyBhcyBjb25zdCwgbGFiZWw6ICdDYW5jZWwnLCB2YWx1ZTogJ2NhbmNlbCcgfSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IG9uRmluYWxSZXNwb25zZSh2YWx1ZSBhcyAnc3VibWl0JyB8ICdjYW5jZWwnKX1cbiAgICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IG9uRmluYWxSZXNwb25zZSgnY2FuY2VsJyl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxpQkFBaUI7QUFDM0MsY0FBY0MsUUFBUSxRQUFRLDJEQUEyRDtBQUN6RixjQUFjQyxrQkFBa0IsUUFBUSxnREFBZ0Q7QUFDeEYsU0FBU0MsTUFBTSxRQUFRLDZCQUE2QjtBQUNwRCxTQUFTQyxPQUFPLFFBQVEsZ0NBQWdDO0FBQ3hELFNBQVND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
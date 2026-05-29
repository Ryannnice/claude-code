// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { AdvisorBlock } 来自 ../../utils/advisor.js，用于校准终端渲染的数据契约。
import type { AdvisorBlock } from '../../utils/advisor.js';
// 复用 renderModelName 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { renderModelName } from '../../utils/model/model.js';
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js';
// 引入 CtrlOToExpand，将 ../CtrlOToExpand.js 中已经封装好的能力接到本文件流程里。
import { CtrlOToExpand } from '../CtrlOToExpand.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// 引入 ToolUseLoader，将 ../ToolUseLoader.js 中已经封装好的能力接到本文件流程里。
import { ToolUseLoader } from '../ToolUseLoader.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  block: AdvisorBlock;
  addMargin: boolean;
  resolvedToolUseIDs: Set<string>;
  erroredToolUseIDs: Set<string>;
  shouldAnimate: boolean;
  verbose: boolean;
  advisorModel?: string;
};
// AdvisorMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AdvisorMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(30);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    block,
    addMargin,
    resolvedToolUseIDs,
    erroredToolUseIDs,
    shouldAnimate,
    verbose,
    advisorModel
  } = t0;
  // 当 `block.type` 匹配 `"server_tool_use"` 时，终端渲染执行对应分支。
  if (block.type === "server_tool_use") {
    // t1 暂存 `block.input && Object.keys(block.input).length > 0 ? json...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== block.input) {
      // t1 暂存 `block.input && Object.keys(block.input).length > 0 ? json...` 生成的渲染片段，后续返回路径直接复用。
      t1 = block.input && Object.keys(block.input).length > 0 ? jsonStringify(block.input) : null;
      // $[0] 缓存 `block.input`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = block.input;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[1];
    }
    // 用户输入 命名 `t1`，让后续代码直接表达这个值的用途。
    const input = t1;
    // t2保存`addMargin ? 1 : 0`，供后续判断或组装使用。
    const t2 = addMargin ? 1 : 0;
    // t3 暂存 `resolvedToolUseIDs.has(block.id)` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[2] !== block.id || $[3] !== resolvedToolUseIDs) {
      // t3 暂存 `resolvedToolUseIDs.has(block.id)` 生成的渲染片段，后续返回路径直接复用。
      t3 = resolvedToolUseIDs.has(block.id);
      // $[2] 缓存 `block.id`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = block.id;
      // $[3] 缓存 `resolvedToolUseIDs`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = resolvedToolUseIDs;
      // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[4];
    }
    // t4标记终端 UI Advisor Message是否启用对应路径。
    const t4 = !t3;
    // t5 暂存 `erroredToolUseIDs.has(block.id)` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== block.id || $[6] !== erroredToolUseIDs) {
      // t5 暂存 `erroredToolUseIDs.has(block.id)` 生成的渲染片段，后续返回路径直接复用。
      t5 = erroredToolUseIDs.has(block.id);
      // $[5] 缓存 `block.id`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = block.id;
      // $[6] 缓存 `erroredToolUseIDs`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = erroredToolUseIDs;
      // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[7];
    }
    // t6 暂存 `<ToolUseLoader shouldAnimate={shouldAnimate} isUnresolved...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[8] !== shouldAnimate || $[9] !== t4 || $[10] !== t5) {
      // t6 暂存 `<ToolUseLoader shouldAnimate={shouldAnimate} isUnresolved...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <ToolUseLoader shouldAnimate={shouldAnimate} isUnresolved={t4} isError={t5} />;
      // $[8] 缓存 `shouldAnimate`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = shouldAnimate;
      // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t4;
      // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t5;
      // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[11];
    }
    // t7 暂存 `<Text bold={true}>Advising</Text>` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      // t7 暂存 `<Text bold={true}>Advising</Text>` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text bold={true}>Advising</Text>;
      // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[12];
    }
    // t8 暂存 `advisorModel ? <Text dimColor={true}> using {renderModelN...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[13] !== advisorModel) {
      // t8 暂存 `advisorModel ? <Text dimColor={true}> using {renderModelN...` 生成的渲染片段，后续返回路径直接复用。
      t8 = advisorModel ? <Text dimColor={true}> using {renderModelName(advisorModel)}</Text> : null;
      // $[13] 缓存 `advisorModel`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = advisorModel;
      // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[14];
    }
    // t9 暂存 `input ? <Text dimColor={true}> · {input}</Text> : null` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[15] !== input) {
      // t9 暂存 `input ? <Text dimColor={true}> · {input}</Text> : null` 生成的渲染片段，后续返回路径直接复用。
      t9 = input ? <Text dimColor={true}> · {input}</Text> : null;
      // $[15] 缓存 `input`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = input;
      // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[16];
    }
    // t10 暂存 `<Box marginTop={t2} paddingRight={2} flexDirection="row">...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== t2 || $[18] !== t6 || $[19] !== t8 || $[20] !== t9) {
      // t10 暂存 `<Box marginTop={t2} paddingRight={2} flexDirection="row">...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Box marginTop={t2} paddingRight={2} flexDirection="row">{t6}{t7}{t8}{t9}</Box>;
      // $[17] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t2;
      // $[18] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t6;
      // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t8;
      // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t9;
      // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[21];
    }
    // 返回 `t10`，作为终端渲染这次计算的结果。
    return t10;
  }
  // 请求体 先占位，稍后的条件分支会根据实际输入补齐它。
  let body;
  // 终端 UI 组件 Advisor Message在这里处理 `bb0: switch (block.content.type) {`，完成这一小步状态转换。
  bb0: switch (block.content.type) {
    case "advisor_tool_result_error":
      {
        // t1 暂存 `<Text color="error">Advisor unavailable ({block.content.e...` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[22] !== block.content.error_code) {
          // t1 暂存 `<Text color="error">Advisor unavailable ({block.content.e...` 生成的渲染片段，后续返回路径直接复用。
          t1 = <Text color="error">Advisor unavailable ({block.content.error_code})</Text>;
          // $[22] 缓存 `block.content.error_code`，下次依赖未变时 React 编译产物可直接复用。
          $[22] = block.content.error_code;
          // $[23] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[23] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[23];
        }
        // 请求体更新为 `t1`，确保终端 UI后续读取最新状态。
        body = t1;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
    case "advisor_result":
      {
        // t1 暂存 `verbose ? <Text dimColor={true}>{block.content.text}</Tex...` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[24] !== block.content.text || $[25] !== verbose) {
          // t1 暂存 `verbose ? <Text dimColor={true}>{block.content.text}</Tex...` 生成的渲染片段，后续返回路径直接复用。
          t1 = verbose ? <Text dimColor={true}>{block.content.text}</Text> : <Text dimColor={true}>{figures.tick} Advisor has reviewed the conversation and will apply the feedback <CtrlOToExpand /></Text>;
          // $[24] 缓存 `block.content.text`，下次依赖未变时 React 编译产物可直接复用。
          $[24] = block.content.text;
          // $[25] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
          $[25] = verbose;
          // $[26] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[26] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[26];
        }
        // 请求体更新为 `t1`，确保终端 UI后续读取最新状态。
        body = t1;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
    case "advisor_redacted_result":
      {
        // t1 暂存 `<Text dimColor={true}>{figures.tick} Advisor has reviewed...` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
          // t1 暂存 `<Text dimColor={true}>{figures.tick} Advisor has reviewed...` 生成的渲染片段，后续返回路径直接复用。
          t1 = <Text dimColor={true}>{figures.tick} Advisor has reviewed the conversation and will apply the feedback</Text>;
          // $[27] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[27] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[27];
        }
        // 请求体更新为 `t1`，确保终端 UI后续读取最新状态。
        body = t1;
      }
  }
  // t1 暂存 `<Box paddingRight={2}><MessageResponse>{body}</MessageRes...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== body) {
    // t1 暂存 `<Box paddingRight={2}><MessageResponse>{body}</MessageRes...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box paddingRight={2}><MessageResponse>{body}</MessageResponse></Box>;
    // $[28] 缓存 `body`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = body;
    // $[29] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[29];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwiQWR2aXNvckJsb2NrIiwicmVuZGVyTW9kZWxOYW1lIiwianNvblN0cmluZ2lmeSIsIkN0cmxPVG9FeHBhbmQiLCJNZXNzYWdlUmVzcG9uc2UiLCJUb29sVXNlTG9hZGVyIiwiUHJvcHMiLCJibG9jayIsImFkZE1hcmdpbiIsInJlc29sdmVkVG9vbFVzZUlEcyIsIlNldCIsImVycm9yZWRUb29sVXNlSURzIiwic2hvdWxkQW5pbWF0ZSIsInZlcmJvc2UiLCJhZHZpc29yTW9kZWwiLCJBZHZpc29yTWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidHlwZSIsInQxIiwiaW5wdXQiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwidDIiLCJ0MyIsImlkIiwiaGFzIiwidDQiLCJ0NSIsInQ2IiwidDciLCJTeW1ib2wiLCJmb3IiLCJ0OCIsInQ5IiwidDEwIiwiYm9keSIsImJiMCIsImNvbnRlbnQiLCJlcnJvcl9jb2RlIiwidGV4dCIsInRpY2siXSwic291cmNlcyI6WyJBZHZpc29yTWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgQWR2aXNvckJsb2NrIH0gZnJvbSAnLi4vLi4vdXRpbHMvYWR2aXNvci5qcydcbmltcG9ydCB7IHJlbmRlck1vZGVsTmFtZSB9IGZyb20gJy4uLy4uL3V0aWxzL21vZGVsL21vZGVsLmpzJ1xuaW1wb3J0IHsganNvblN0cmluZ2lmeSB9IGZyb20gJy4uLy4uL3V0aWxzL3Nsb3dPcGVyYXRpb25zLmpzJ1xuaW1wb3J0IHsgQ3RybE9Ub0V4cGFuZCB9IGZyb20gJy4uL0N0cmxPVG9FeHBhbmQuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBUb29sVXNlTG9hZGVyIH0gZnJvbSAnLi4vVG9vbFVzZUxvYWRlci5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgYmxvY2s6IEFkdmlzb3JCbG9ja1xuICBhZGRNYXJnaW46IGJvb2xlYW5cbiAgcmVzb2x2ZWRUb29sVXNlSURzOiBTZXQ8c3RyaW5nPlxuICBlcnJvcmVkVG9vbFVzZUlEczogU2V0PHN0cmluZz5cbiAgc2hvdWxkQW5pbWF0ZTogYm9vbGVhblxuICB2ZXJib3NlOiBib29sZWFuXG4gIGFkdmlzb3JNb2RlbD86IHN0cmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gQWR2aXNvck1lc3NhZ2Uoe1xuICBibG9jayxcbiAgYWRkTWFyZ2luLFxuICByZXNvbHZlZFRvb2xVc2VJRHMsXG4gIGVycm9yZWRUb29sVXNlSURzLFxuICBzaG91bGRBbmltYXRlLFxuICB2ZXJib3NlLFxuICBhZHZpc29yTW9kZWwsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmIChibG9jay50eXBlID09PSAnc2VydmVyX3Rvb2xfdXNlJykge1xuICAgIGNvbnN0IGlucHV0ID1cbiAgICAgIGJsb2NrLmlucHV0ICYmIE9iamVjdC5rZXlzKGJsb2NrLmlucHV0KS5sZW5ndGggPiAwXG4gICAgICAgID8ganNvblN0cmluZ2lmeShibG9jay5pbnB1dClcbiAgICAgICAgOiBudWxsXG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggbWFyZ2luVG9wPXthZGRNYXJnaW4gPyAxIDogMH0gcGFkZGluZ1JpZ2h0PXsyfSBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgIDxUb29sVXNlTG9hZGVyXG4gICAgICAgICAgc2hvdWxkQW5pbWF0ZT17c2hvdWxkQW5pbWF0ZX1cbiAgICAgICAgICBpc1VucmVzb2x2ZWQ9eyFyZXNvbHZlZFRvb2xVc2VJRHMuaGFzKGJsb2NrLmlkKX1cbiAgICAgICAgICBpc0Vycm9yPXtlcnJvcmVkVG9vbFVzZUlEcy5oYXMoYmxvY2suaWQpfVxuICAgICAgICAvPlxuICAgICAgICA8VGV4dCBib2xkPkFkdmlzaW5nPC9UZXh0PlxuICAgICAgICB7YWR2aXNvck1vZGVsID8gKFxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiB1c2luZyB7cmVuZGVyTW9kZWxOYW1lKGFkdmlzb3JNb2RlbCl9PC9UZXh0PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAge2lucHV0ID8gPFRleHQgZGltQ29sb3I+IMK3IHtpbnB1dH08L1RleHQ+IDogbnVsbH1cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGxldCBib2R5OiBSZWFjdC5SZWFjdE5vZGVcbiAgc3dpdGNoIChibG9jay5jb250ZW50LnR5cGUpIHtcbiAgICBjYXNlICdhZHZpc29yX3Rvb2xfcmVzdWx0X2Vycm9yJzpcbiAgICAgIGJvZHkgPSAoXG4gICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICBBZHZpc29yIHVuYXZhaWxhYmxlICh7YmxvY2suY29udGVudC5lcnJvcl9jb2RlfSlcbiAgICAgICAgPC9UZXh0PlxuICAgICAgKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhZHZpc29yX3Jlc3VsdCc6XG4gICAgICBib2R5ID0gdmVyYm9zZSA/IChcbiAgICAgICAgPFRleHQgZGltQ29sb3I+e2Jsb2NrLmNvbnRlbnQudGV4dH08L1RleHQ+XG4gICAgICApIDogKFxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICB7ZmlndXJlcy50aWNrfSBBZHZpc29yIGhhcyByZXZpZXdlZCB0aGUgY29udmVyc2F0aW9uIGFuZCB3aWxsIGFwcGx5XG4gICAgICAgICAgdGhlIGZlZWRiYWNrIDxDdHJsT1RvRXhwYW5kIC8+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYWR2aXNvcl9yZWRhY3RlZF9yZXN1bHQnOlxuICAgICAgYm9keSA9IChcbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAge2ZpZ3VyZXMudGlja30gQWR2aXNvciBoYXMgcmV2aWV3ZWQgdGhlIGNvbnZlcnNhdGlvbiBhbmQgd2lsbCBhcHBseVxuICAgICAgICAgIHRoZSBmZWVkYmFja1xuICAgICAgICA8L1RleHQ+XG4gICAgICApXG4gICAgICBicmVha1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IHBhZGRpbmdSaWdodD17Mn0+XG4gICAgICA8TWVzc2FnZVJlc3BvbnNlPntib2R5fTwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLGNBQWNDLFlBQVksUUFBUSx3QkFBd0I7QUFDMUQsU0FBU0MsZUFBZSxRQUFRLDRCQUE0QjtBQUM1RCxTQUFTQyxhQUFhLFFBQVEsK0JBQStCO0FBQzdELFNBQVNDLGFBQWEsUUFBUSxxQkFBcUI7QUFDbkQsU0FBU0MsZUFBZSxRQUFRLHVCQUF1QjtBQUN2RCxTQUFTQyxhQUFhLFFBQVEscUJBQXFCO0FBRW5ELEtBQUtDLEtBQUssR0FBRztFQUNYQyxLQUFLLEVBQUVQLFlBQVk7RUFDbkJRLFNBQVMsRUFBRSxPQUFPO0VBQ2xCQyxrQkFBa0IsRUFBRUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztFQUMvQkMsaUJBQWlCLEVBQUVELEdBQUcsQ0FBQyxNQUFNLENBQUM7RUFDOUJFLGFBQWEsRUFBRSxPQUFPO0VBQ3RCQyxPQUFPLEVBQUUsT0FBTztFQUNoQkMsWUFBWSxDQUFDLEVBQUUsTUFBTTtBQUN2QixDQUFDO0FBRUQsT0FBTyxTQUFBQyxlQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXdCO0lBQUFYLEtBQUE7SUFBQUMsU0FBQTtJQUFBQyxrQkFBQTtJQUFBRSxpQkFBQTtJQUFBQyxhQUFBO0lBQUFDLE9BQUE7SUFBQUM7RUFBQSxJQUFBRSxF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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useRef } from 'react';
// 引入 BLACK_CIRCLE、BULLET_OPERATOR，将 ../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE, BULLET_OPERATOR } from '../constants/figures.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 类型依赖 { SkillUpdate } 来自 ../utils/hooks/skillImprovement.js，用于校准终端渲染的数据契约。
import type { SkillUpdate } from '../utils/hooks/skillImprovement.js';
// 复用 normalizeFullWidthDigits 工具函数，把通用处理留在 ../utils/stringUtils.js 中维护。
import { normalizeFullWidthDigits } from '../utils/stringUtils.js';
// 引入 isValidResponseInput，将 ./FeedbackSurvey/FeedbackSurveyView.js 中已经封装好的能力接到本文件流程里。
import { isValidResponseInput } from './FeedbackSurvey/FeedbackSurveyView.js';
// 类型依赖 { FeedbackSurveyResponse } 来自 ./FeedbackSurvey/utils.js，用于校准终端渲染的数据契约。
import type { FeedbackSurveyResponse } from './FeedbackSurvey/utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  isOpen: boolean;
  skillName: string;
  updates: SkillUpdate[];
  // 这个回调绑定到 handleSelect: (selected: FeedbackSurveyResponse) => void;，负责终端渲染在该局部场景下的响应。
  handleSelect: (selected: FeedbackSurveyResponse) => void;
  inputValue: string;
  // 这个回调绑定到 setInputValue: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  setInputValue: (value: string) => void;
};
// SkillImprovementSurvey 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SkillImprovementSurvey(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    isOpen,
    skillName,
    updates,
    handleSelect,
    inputValue,
    setInputValue
  } = t0;
  // isOpen缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!isOpen) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 只有 `inputValue && !isValidResponseInput(inputValue)` 满足时，终端渲染才执行该分支。
  if (inputValue && !isValidResponseInput(inputValue)) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `<SkillImprovementSurveyView skillName={skillName} updates...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== handleSelect || $[1] !== inputValue || $[2] !== setInputValue || $[3] !== skillName || $[4] !== updates) {
    // t1 暂存 `<SkillImprovementSurveyView skillName={skillName} updates...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <SkillImprovementSurveyView skillName={skillName} updates={updates} onSelect={handleSelect} inputValue={inputValue} setInputValue={setInputValue} />;
    // $[0] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = handleSelect;
    // $[1] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = inputValue;
    // $[2] 缓存 `setInputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = setInputValue;
    // $[3] 缓存 `skillName`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = skillName;
    // $[4] 缓存 `updates`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = updates;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// ViewProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ViewProps = {
  skillName: string;
  updates: SkillUpdate[];
  // 这个回调绑定到 onSelect: (option: FeedbackSurveyResponse) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (option: FeedbackSurveyResponse) => void;
  inputValue: string;
  // 这个回调绑定到 setInputValue: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  setInputValue: (value: string) => void;
};

// Only 1 (apply) and 0 (dismiss) are valid for this survey
// VALID_INPUTS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const VALID_INPUTS = ['0', '1'] as const;
// isValidInput 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isValidInput(input: string): boolean {
  // 返回 `(VALID_INPUTS as readonly string[]).includes(input)`，作为终端渲染这次计算的结果。
  return (VALID_INPUTS as readonly string[]).includes(input);
}
// SkillImprovementSurveyView 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SkillImprovementSurveyView(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(17);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    skillName,
    updates,
    onSelect,
    inputValue,
    setInputValue
  } = t0;
  // initialInputValue保存`useRef`，供终端渲染后续处理使用。
  const initialInputValue = useRef(inputValue);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[inputValue, onSelect, setInputValue]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== inputValue || $[1] !== onSelect || $[2] !== setInputValue) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // `inputValue` 与 `initialInputValue.current` 不一致时刷新派生状态，避免使用过期结果。
      if (inputValue !== initialInputValue.current) {
        // lastChar保存`normalizeFullWidthDigits`，供终端渲染后续处理使用。
        const lastChar = normalizeFullWidthDigits(inputValue.slice(-1));
        // 满足 `isValidInput(lastChar)` 时，终端渲染执行该分支。
        if (isValidInput(lastChar)) {
          // setInputValue 写入新的状态值，使终端渲染后续读取保持一致。
          setInputValue(inputValue.slice(0, -1));
          // 调用 onSelect，触发终端渲染此处需要的副作用。
          onSelect(lastChar === "1" ? "good" : "dismissed");
        }
      }
    };
    // t2 暂存 `[inputValue, onSelect, setInputValue]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [inputValue, onSelect, setInputValue];
    // $[0] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = inputValue;
    // $[1] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onSelect;
    // $[2] 缓存 `setInputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = setInputValue;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t1, t2);
  // t3 暂存 `<Text color="ansi:cyan">{BLACK_CIRCLE} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text color="ansi:cyan">{BLACK_CIRCLE} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text color="ansi:cyan">{BLACK_CIRCLE} </Text>;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `<Box>{t3}<Text bold={true}>Skill improvement suggested fo...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== skillName) {
    // t4 暂存 `<Box>{t3}<Text bold={true}>Skill improvement suggested fo...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box>{t3}<Text bold={true}>Skill improvement suggested for "{skillName}"</Text></Box>;
    // $[6] 缓存 `skillName`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = skillName;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `updates.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== updates) {
    // t5 暂存 `updates.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t5 = updates.map(_temp);
    // $[8] 缓存 `updates`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = updates;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // t6 暂存 `<Box flexDirection="column" marginLeft={2}>{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t5) {
    // t6 暂存 `<Box flexDirection="column" marginLeft={2}>{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" marginLeft={2}>{t5}</Box>;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // t7 暂存 `<Box width={12}><Text><Text color="ansi:cyan">1</Text>: A...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Box width={12}><Text><Text color="ansi:cyan">1</Text>: A...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box width={12}><Text><Text color="ansi:cyan">1</Text>: Apply</Text></Box>;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // t8 暂存 `<Box marginLeft={2} marginTop={1}>{t7}<Box width={14}><Te...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Box marginLeft={2} marginTop={1}>{t7}<Box width={14}><Te...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box marginLeft={2} marginTop={1}>{t7}<Box width={14}><Text><Text color="ansi:cyan">0</Text>: Dismiss</Text></Box></Box>;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // t9 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t6}{t8}</B...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t4 || $[15] !== t6) {
    // t9 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t6}{t8}</B...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" marginTop={1}>{t4}{t6}{t8}</Box>;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
    // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[16];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(u, i) {
  // 返回 `<Text key={i} dimColor={true}>{BULLET_OPERATOR} {u.change}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i} dimColor={true}>{BULLET_OPERATOR} {u.change}</Text>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsIkJMQUNLX0NJUkNMRSIsIkJVTExFVF9PUEVSQVRPUiIsIkJveCIsIlRleHQiLCJTa2lsbFVwZGF0ZSIsIm5vcm1hbGl6ZUZ1bGxXaWR0aERpZ2l0cyIsImlzVmFsaWRSZXNwb25zZUlucHV0IiwiRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSIsIlByb3BzIiwiaXNPcGVuIiwic2tpbGxOYW1lIiwidXBkYXRlcyIsImhhbmRsZVNlbGVjdCIsInNlbGVjdGVkIiwiaW5wdXRWYWx1ZSIsInNldElucHV0VmFsdWUiLCJ2YWx1ZSIsIlNraWxsSW1wcm92ZW1lbnRTdXJ2ZXkiLCJ0MCIsIiQiLCJfYyIsInQxIiwiVmlld1Byb3BzIiwib25TZWxlY3QiLCJvcHRpb24iLCJWQUxJRF9JTlBVVFMiLCJjb25zdCIsImlzVmFsaWRJbnB1dCIsImlucHV0IiwiaW5jbHVkZXMiLCJTa2lsbEltcHJvdmVtZW50U3VydmV5VmlldyIsImluaXRpYWxJbnB1dFZhbHVlIiwidDIiLCJjdXJyZW50IiwibGFzdENoYXIiLCJzbGljZSIsInQzIiwiU3ltYm9sIiwiZm9yIiwidDQiLCJ0NSIsIm1hcCIsIl90ZW1wIiwidDYiLCJ0NyIsInQ4IiwidDkiLCJ1IiwiaSIsImNoYW5nZSJdLCJzb3VyY2VzIjpbIlNraWxsSW1wcm92ZW1lbnRTdXJ2ZXkudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQkxBQ0tfQ0lSQ0xFLCBCVUxMRVRfT1BFUkFUT1IgfSBmcm9tICcuLi9jb25zdGFudHMvZmlndXJlcy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgU2tpbGxVcGRhdGUgfSBmcm9tICcuLi91dGlscy9ob29rcy9za2lsbEltcHJvdmVtZW50LmpzJ1xuaW1wb3J0IHsgbm9ybWFsaXplRnVsbFdpZHRoRGlnaXRzIH0gZnJvbSAnLi4vdXRpbHMvc3RyaW5nVXRpbHMuanMnXG5pbXBvcnQgeyBpc1ZhbGlkUmVzcG9uc2VJbnB1dCB9IGZyb20gJy4vRmVlZGJhY2tTdXJ2ZXkvRmVlZGJhY2tTdXJ2ZXlWaWV3LmpzJ1xuaW1wb3J0IHR5cGUgeyBGZWVkYmFja1N1cnZleVJlc3BvbnNlIH0gZnJvbSAnLi9GZWVkYmFja1N1cnZleS91dGlscy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgaXNPcGVuOiBib29sZWFuXG4gIHNraWxsTmFtZTogc3RyaW5nXG4gIHVwZGF0ZXM6IFNraWxsVXBkYXRlW11cbiAgaGFuZGxlU2VsZWN0OiAoc2VsZWN0ZWQ6IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UpID0+IHZvaWRcbiAgaW5wdXRWYWx1ZTogc3RyaW5nXG4gIHNldElucHV0VmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTa2lsbEltcHJvdmVtZW50U3VydmV5KHtcbiAgaXNPcGVuLFxuICBza2lsbE5hbWUsXG4gIHVwZGF0ZXMsXG4gIGhhbmRsZVNlbGVjdCxcbiAgaW5wdXRWYWx1ZSxcbiAgc2V0SW5wdXRWYWx1ZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCFpc09wZW4pIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gSGlkZSB0aGUgc3VydmV5IGlmIHRoZSB1c2VyIGlzIHR5cGluZyBhbnl0aGluZyBvdGhlciB0aGFuIGEgc3VydmV5IHJlc3BvbnNlXG4gIGlmIChpbnB1dFZhbHVlICYmICFpc1ZhbGlkUmVzcG9uc2VJbnB1dChpbnB1dFZhbHVlKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxTa2lsbEltcHJvdmVtZW50U3VydmV5Vmlld1xuICAgICAgc2tpbGxOYW1lPXtza2lsbE5hbWV9XG4gICAgICB1cGRhdGVzPXt1cGRhdGVzfVxuICAgICAgb25TZWxlY3Q9e2hhbmRsZVNlbGVjdH1cbiAgICAgIGlucHV0VmFsdWU9e2lucHV0VmFsdWV9XG4gICAgICBzZXRJbnB1dFZhbHVlPXtzZXRJbnB1dFZhbHVlfVxuICAgIC8+XG4gIClcbn1cblxudHlwZSBWaWV3UHJvcHMgPSB7XG4gIHNraWxsTmFtZTogc3RyaW5nXG4gIHVwZGF0ZXM6IFNraWxsVXBkYXRlW11cbiAgb25TZWxlY3Q6IChvcHRpb246IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UpID0+IHZvaWRcbiAgaW5wdXRWYWx1ZTogc3RyaW5nXG4gIHNldElucHV0VmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG59XG5cbi8vIE9ubHkgMSAoYXBwbHkpIGFuZCAwIChkaXNtaXNzKSBhcmUgdmFsaWQgZm9yIHRoaXMgc3VydmV5XG5jb25zdCBWQUxJRF9JTlBVVFMgPSBbJzAnLCAnMSddIGFzIGNvbnN0XG5cbmZ1bmN0aW9uIGlzVmFsaWRJbnB1dChpbnB1dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAoVkFMSURfSU5QVVRTIGFzIHJlYWRvbmx5IHN0cmluZ1tdKS5pbmNsdWRlcyhpbnB1dClcbn1cblxuZnVuY3Rpb24gU2tpbGxJbXByb3ZlbWVudFN1cnZleVZpZXcoe1xuICBza2lsbE5hbWUsXG4gIHVwZGF0ZXMsXG4gIG9uU2VsZWN0LFxuICBpbnB1dFZhbHVlLFxuICBzZXRJbnB1dFZhbHVlLFxufTogVmlld1Byb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgaW5pdGlhbElucHV0VmFsdWUgPSB1c2VSZWYoaW5wdXRWYWx1ZSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpbnB1dFZhbHVlICE9PSBpbml0aWFsSW5wdXRWYWx1ZS5jdXJyZW50KSB7XG4gICAgICBjb25zdCBsYXN0Q2hhciA9IG5vcm1hbGl6ZUZ1bGxXaWR0aERpZ2l0cyhpbnB1dFZhbHVlLnNsaWNlKC0xKSlcbiAgICAgIGlmIChpc1ZhbGlkSW5wdXQobGFzdENoYXIpKSB7XG4gICAgICAgIHNldElucHV0VmFsdWUoaW5wdXRWYWx1ZS5zbGljZSgwLCAtMSkpXG4gICAgICAgIC8vIE1hcDogMSA9IFwiZ29vZFwiIChhcHBseSksIDAgPSBcImRpc21pc3NlZFwiXG4gICAgICAgIG9uU2VsZWN0KGxhc3RDaGFyID09PSAnMScgPyAnZ29vZCcgOiAnZGlzbWlzc2VkJylcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtpbnB1dFZhbHVlLCBvblNlbGVjdCwgc2V0SW5wdXRWYWx1ZV0pXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgY29sb3I9XCJhbnNpOmN5YW5cIj57QkxBQ0tfQ0lSQ0xFfSA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGJvbGQ+XG4gICAgICAgICAgU2tpbGwgaW1wcm92ZW1lbnQgc3VnZ2VzdGVkIGZvciAmcXVvdDt7c2tpbGxOYW1lfSZxdW90O1xuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cblxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luTGVmdD17Mn0+XG4gICAgICAgIHt1cGRhdGVzLm1hcCgodSwgaSkgPT4gKFxuICAgICAgICAgIDxUZXh0IGtleT17aX0gZGltQ29sb3I+XG4gICAgICAgICAgICB7QlVMTEVUX09QRVJBVE9SfSB7dS5jaGFuZ2V9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApKX1cbiAgICAgIDwvQm94PlxuXG4gICAgICA8Qm94IG1hcmdpbkxlZnQ9ezJ9IG1hcmdpblRvcD17MX0+XG4gICAgICAgIDxCb3ggd2lkdGg9ezEyfT5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiYW5zaTpjeWFuXCI+MTwvVGV4dD46IEFwcGx5XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPEJveCB3aWR0aD17MTR9PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJhbnNpOmN5YW5cIj4wPC9UZXh0PjogRGlzbWlzc1xuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxTQUFTLEVBQUVDLE1BQU0sUUFBUSxPQUFPO0FBQ2hELFNBQVNDLFlBQVksRUFBRUMsZUFBZSxRQUFRLHlCQUF5QjtBQUN2RSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLGNBQWNDLFdBQVcsUUFBUSxvQ0FBb0M7QUFDckUsU0FBU0Msd0JBQXdCLFFBQVEseUJBQXlCO0FBQ2xFLFNBQVNDLG9CQUFvQixRQUFRLHdDQUF3QztBQUM3RSxjQUFjQyxzQkFBc0IsUUFBUSwyQkFBMkI7QUFFdkUsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLE1BQU0sRUFBRSxPQUFPO0VBQ2ZDLFNBQVMsRUFBRSxNQUFNO0VBQ2pCQyxPQUFPLEVBQUVQLFdBQVcsRUFBRTtFQUN0QlEsWUFBWSxFQUFFLENBQUNDLFFBQVEsRUFBRU4sc0JBQXNCLEVBQUUsR0FBRyxJQUFJO0VBQ3hETyxVQUFVLEVBQUUsTUFBTTtFQUNsQkMsYUFBYSxFQUFFLENBQUNDLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJO0FBQ3hDLENBQUM7QUFFRCxPQUFPLFNBQUFDLHVCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWdDO0lBQUFYLE1BQUE7SUFBQUMsU0FBQTtJQUFBQyxPQUFBO0lBQUFDLFlBQUE7SUFBQUUsVUFBQTtJQUFBQztFQUFBLElBQUFHLEVBTy9CO0VBQ04sSUFBSSxDQUFDVCxNQUFNO0lBQUEsT0FDRixJQUFJO0VBQUE7RUFJYixJQUFJSyxVQUErQyxJQUEvQyxDQUFlUixvQkFBb0IsQ0FBQ1EsVUFBVSxDQUFDO0lBQUEsT0FDMUMsSUFBSTtFQUFBO0VBQ1osSUFBQU8sRUFBQTtFQUFBLElBQUFGLENB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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useState } from 'react';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 接入 AGENT_COLOR_TO_THEME_COLOR、AGENT_COLORS、AgentColorName 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_COLOR_TO_THEME_COLOR, AGENT_COLORS, type AgentColorName } from '../../tools/AgentTool/agentColorManager.js';
// 复用 capitalize 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { capitalize } from '../../utils/stringUtils.js';
// ColorOption 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ColorOption = AgentColorName | 'automatic';
// COLOR_OPTIONS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const COLOR_OPTIONS: ColorOption[] = ['automatic', ...AGENT_COLORS];
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  agentName: string;
  currentColor?: AgentColorName | 'automatic';
  // 这个回调绑定到 onConfirm: (color: AgentColorName | undefined) => void;，负责终端渲染在该局部场景下的响应。
  onConfirm: (color: AgentColorName | undefined) => void;
};
// ColorPicker 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ColorPicker(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(17);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    agentName,
    currentColor: t1,
    onConfirm
  } = t0;
  // currentColor标记终端 UI Color Picker是否启用对应路径。
  const currentColor = t1 === undefined ? "automatic" : t1;
  // t2 暂存 `COLOR_OPTIONS.findIndex(opt => opt === currentColor)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== currentColor) {
    // t2 暂存 `COLOR_OPTIONS.findIndex(opt => opt === currentColor)` 生成的渲染片段，后续返回路径直接复用。
    t2 = COLOR_OPTIONS.findIndex(opt => opt === currentColor);
    // $[0] 缓存 `currentColor`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = currentColor;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // 选中索引 由 React state 持有，setSelectedIndex 会在用户操作或异步结果返回时触发刷新。
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, t2));
  // t3 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onConfirm || $[3] !== selectedIndex) {
    // t3 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = e => {
      // 当 `e.key` 匹配 `"up"` 时，终端渲染执行对应分支。
      if (e.key === "up") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // setSelectedIndex 写入新的状态值，使终端渲染后续读取保持一致。
        setSelectedIndex(_temp);
      } else {
        // 当 `e.key` 匹配 `"down"` 时，终端渲染执行对应分支。
        if (e.key === "down") {
          // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
          e.preventDefault();
          // setSelectedIndex 写入新的状态值，使终端渲染后续读取保持一致。
          setSelectedIndex(_temp2);
        } else {
          // 当 `e.key` 匹配 `"return"` 时，终端渲染执行对应分支。
          if (e.key === "return") {
            // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
            e.preventDefault();
            // selected保存`COLOR_OPTIONS[selectedIndex]`，供终端 UI Color Picker后续判断或输出使用。
            const selected = COLOR_OPTIONS[selectedIndex];
            // 调用 onConfirm，触发终端渲染此处需要的副作用。
            onConfirm(selected === "automatic" ? undefined : selected);
          }
        }
      }
    };
    // $[2] 缓存 `onConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onConfirm;
    // $[3] 缓存 `selectedIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = selectedIndex;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // handleKeyDown沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleKeyDown = t3;
  // selectedValue保存`COLOR_OPTIONS[selectedIndex]`，供终端 UI Color Picker后续判断或输出使用。
  const selectedValue = COLOR_OPTIONS[selectedIndex];
  // t4 暂存 `COLOR_OPTIONS.map((option, index) => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== selectedIndex) {
    // t4 暂存 `COLOR_OPTIONS.map((option, index) => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = COLOR_OPTIONS.map((option, index) => {
      // isSelected标记终端 UI Color Picker是否启用对应路径。
      const isSelected = index === selectedIndex;
      // 返回 `<Box key={option} flexDirection="row" gap={1}><Text color={isSelected ?...`，作为终端渲染这次计算的结果。
      return <Box key={option} flexDirection="row" gap={1}><Text color={isSelected ? "suggestion" : undefined}>{isSelected ? figures.pointer : " "}</Text>{option === "automatic" ? <Text bold={isSelected}>Automatic color</Text> : <Box gap={1}><Text backgroundColor={AGENT_COLOR_TO_THEME_COLOR[option]} color="inverseText">{" "}</Text><Text bold={isSelected}>{capitalize(option)}</Text></Box>}</Box>;
    });
    // $[5] 缓存 `selectedIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = selectedIndex;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Box flexDirection="column">{t4}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t4) {
    // t5 暂存 `<Box flexDirection="column">{t4}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column">{t4}</Box>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<Text>Preview: </Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Text>Preview: </Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text>Preview: </Text>;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `<Box marginTop={1}>{t6}{selectedValue === undefined || se...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== agentName || $[11] !== selectedValue) {
    // t7 暂存 `<Box marginTop={1}>{t6}{selectedValue === undefined || se...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginTop={1}>{t6}{selectedValue === undefined || selectedValue === "automatic" ? <Text inverse={true} bold={true}>{" "}@{agentName}{" "}</Text> : <Text backgroundColor={AGENT_COLOR_TO_THEME_COLOR[selectedValue]} color="inverseText" bold={true}>{" "}@{agentName}{" "}</Text>}</Box>;
    // $[10] 缓存 `agentName`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = agentName;
    // $[11] 缓存 `selectedValue`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = selectedValue;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // t8 暂存 `<Box flexDirection="column" gap={1} tabIndex={0} autoFocu...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== handleKeyDown || $[14] !== t5 || $[15] !== t7) {
    // t8 暂存 `<Box flexDirection="column" gap={1} tabIndex={0} autoFocu...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" gap={1} tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t5}{t7}</Box>;
    // $[13] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = handleKeyDown;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[16];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp2 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(prev_0) {
  // 返回 `prev_0 < COLOR_OPTIONS.length - 1 ? prev_0 + 1 : 0`，作为终端渲染这次计算的结果。
  return prev_0 < COLOR_OPTIONS.length - 1 ? prev_0 + 1 : 0;
}
// _temp 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(prev) {
  // 返回 `prev > 0 ? prev - 1 : COLOR_OPTIONS.length - 1`，作为终端渲染这次计算的结果。
  return prev > 0 ? prev - 1 : COLOR_OPTIONS.length - 1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VTdGF0ZSIsIktleWJvYXJkRXZlbnQiLCJCb3giLCJUZXh0IiwiQUdFTlRfQ09MT1JfVE9fVEhFTUVfQ09MT1IiLCJBR0VOVF9DT0xPUlMiLCJBZ2VudENvbG9yTmFtZSIsImNhcGl0YWxpemUiLCJDb2xvck9wdGlvbiIsIkNPTE9SX09QVElPTlMiLCJQcm9wcyIsImFnZW50TmFtZSIsImN1cnJlbnRDb2xvciIsIm9uQ29uZmlybSIsImNvbG9yIiwiQ29sb3JQaWNrZXIiLCJ0MCIsIiQiLCJfYyIsInQxIiwidW5kZWZpbmVkIiwidDIiLCJmaW5kSW5kZXgiLCJvcHQiLCJzZWxlY3RlZEluZGV4Iiwic2V0U2VsZWN0ZWRJbmRleCIsIk1hdGgiLCJtYXgiLCJ0MyIsImUiLCJrZXkiLCJwcmV2ZW50RGVmYXVsdCIsIl90ZW1wIiwiX3RlbXAyIiwic2VsZWN0ZWQiLCJoYW5kbGVLZXlEb3duIiwic2VsZWN0ZWRWYWx1ZSIsInQ0IiwibWFwIiwib3B0aW9uIiwiaW5kZXgiLCJpc1NlbGVjdGVkIiwicG9pbnRlciIsInQ1IiwidDYiLCJTeW1ib2wiLCJmb3IiLCJ0NyIsInQ4IiwicHJldl8wIiwicHJldiIsImxlbmd0aCJdLCJzb3VyY2VzIjpbIkNvbG9yUGlja2VyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi8uLi9pbmsvZXZlbnRzL2tleWJvYXJkLWV2ZW50LmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgQUdFTlRfQ09MT1JfVE9fVEhFTUVfQ09MT1IsXG4gIEFHRU5UX0NPTE9SUyxcbiAgdHlwZSBBZ2VudENvbG9yTmFtZSxcbn0gZnJvbSAnLi4vLi4vdG9vbHMvQWdlbnRUb29sL2FnZW50Q29sb3JNYW5hZ2VyLmpzJ1xuaW1wb3J0IHsgY2FwaXRhbGl6ZSB9IGZyb20gJy4uLy4uL3V0aWxzL3N0cmluZ1V0aWxzLmpzJ1xuXG50eXBlIENvbG9yT3B0aW9uID0gQWdlbnRDb2xvck5hbWUgfCAnYXV0b21hdGljJ1xuXG5jb25zdCBDT0xPUl9PUFRJT05TOiBDb2xvck9wdGlvbltdID0gWydhdXRvbWF0aWMnLCAuLi5BR0VOVF9DT0xPUlNdXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGFnZW50TmFtZTogc3RyaW5nXG4gIGN1cnJlbnRDb2xvcj86IEFnZW50Q29sb3JOYW1lIHwgJ2F1dG9tYXRpYydcbiAgb25Db25maXJtOiAoY29sb3I6IEFnZW50Q29sb3JOYW1lIHwgdW5kZWZpbmVkKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDb2xvclBpY2tlcih7XG4gIGFnZW50TmFtZSxcbiAgY3VycmVudENvbG9yID0gJ2F1dG9tYXRpYycsXG4gIG9uQ29uZmlybSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3NlbGVjdGVkSW5kZXgsIHNldFNlbGVjdGVkSW5kZXhdID0gdXNlU3RhdGUoXG4gICAgTWF0aC5tYXgoXG4gICAgICAwLFxuICAgICAgQ09MT1JfT1BUSU9OUy5maW5kSW5kZXgob3B0ID0+IG9wdCA9PT0gY3VycmVudENvbG9yKSxcbiAgICApLFxuICApXG5cbiAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKGUua2V5ID09PSAndXAnKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHNldFNlbGVjdGVkSW5kZXgocHJldiA9PiAocHJldiA+IDAgPyBwcmV2IC0gMSA6IENPTE9SX09QVElPTlMubGVuZ3RoIC0gMSkpXG4gICAgfSBlbHNlIGlmIChlLmtleSA9PT0gJ2Rvd24nKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHNldFNlbGVjdGVkSW5kZXgocHJldiA9PiAocHJldiA8IENPTE9SX09QVElPTlMubGVuZ3RoIC0gMSA/IHByZXYgKyAxIDogMCkpXG4gICAgfSBlbHNlIGlmIChlLmtleSA9PT0gJ3JldHVybicpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgY29uc3Qgc2VsZWN0ZWQgPSBDT0xPUl9PUFRJT05TW3NlbGVjdGVkSW5kZXhdXG4gICAgICBvbkNvbmZpcm0oc2VsZWN0ZWQgPT09ICdhdXRvbWF0aWMnID8gdW5kZWZpbmVkIDogc2VsZWN0ZWQpXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2VsZWN0ZWRWYWx1ZSA9IENPTE9SX09QVElPTlNbc2VsZWN0ZWRJbmRleF1cblxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgZ2FwPXsxfVxuICAgICAgdGFiSW5kZXg9ezB9XG4gICAgICBhdXRvRm9jdXNcbiAgICAgIG9uS2V5RG93bj17aGFuZGxlS2V5RG93bn1cbiAgICA+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAge0NPTE9SX09QVElPTlMubWFwKChvcHRpb24sIGluZGV4KSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IGluZGV4ID09PSBzZWxlY3RlZEluZGV4XG5cbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJveCBrZXk9e29wdGlvbn0gZmxleERpcmVjdGlvbj1cInJvd1wiIGdhcD17MX0+XG4gICAgICAgICAgICAgIDxUZXh0IGNvbG9yPXtpc1NlbGVjdGVkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfT5cbiAgICAgICAgICAgICAgICB7aXNTZWxlY3RlZCA/IGZpZ3VyZXMucG9pbnRlciA6ICcgJ31cbiAgICAgICAgICAgICAgPC9UZXh0PlxuXG4gICAgICAgICAgICAgIHtvcHRpb24gPT09ICdhdXRvbWF0aWMnID8gKFxuICAgICAgICAgICAgICAgIDxUZXh0IGJvbGQ9e2lzU2VsZWN0ZWR9PkF1dG9tYXRpYyBjb2xvcjwvVGV4dD5cbiAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8Qm94IGdhcD17MX0+XG4gICAgICAgICAgICAgICAgICA8VGV4dFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I9e0FHRU5UX0NPTE9SX1RPX1RIRU1FX0NPTE9SW29wdGlvbl19XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yPVwiaW52ZXJzZVRleHRcIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgPFRleHQgYm9sZD17aXNTZWxlY3RlZH0+e2NhcGl0YWxpemUob3B0aW9uKX08L1RleHQ+XG4gICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICApXG4gICAgICAgIH0pfVxuICAgICAgPC9Cb3g+XG5cbiAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgPFRleHQ+UHJldmlldzogPC9UZXh0PlxuICAgICAgICB7c2VsZWN0ZWRWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHNlbGVjdGVkVmFsdWUgPT09ICdhdXRvbWF0aWMnID8gKFxuICAgICAgICAgIDxUZXh0IGludmVyc2UgYm9sZD5cbiAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICBAe2FnZW50TmFtZX17JyAnfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8VGV4dFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yPXtBR0VOVF9DT0xPUl9UT19USEVNRV9DT0xPUltzZWxlY3RlZFZhbHVlXX1cbiAgICAgICAgICAgIGNvbG9yPVwiaW52ZXJzZVRleHRcIlxuICAgICAgICAgICAgYm9sZFxuICAgICAgICAgID5cbiAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICBAe2FnZW50TmFtZX17JyAnfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPQyxLQUFLLElBQUlDLFFBQVEsUUFBUSxPQUFPO0FBQ3ZDLGNBQWNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFDdkUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUNFQywwQkFBMEIsRUFDMUJDLFlBQVksRUFDWixLQUFLQyxjQUFjLFFBQ2QsNENBQTRDO0FBQ25ELFNBQVNDLFVBQVUsUUFBUSw0QkFBNEI7QUFFdkQsS0FBS0MsV0FBVyxHQUFHRixjQUFjLEdBQUcsV0FBVztBQUUvQyxNQUFNRyxhQUFhLEVBQUVELFdBQVcsRUFBRSxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUdILFlBQVksQ0FBQztBQUVuRSxLQUFLSyxLQUFLLEdBQUc7RUFDWEMsU0FBUyxFQUFFLE1BQU07RUFDakJDLFlBQVksQ0FBQyxFQUFFTixjQUFjLEdBQUcsV0FBVztFQUMzQ08sU0FBUyxFQUFFLENBQUNDLEtBQUssRUFBRVIsY0FBYyxHQUFHLFNBQVMsRUFBRSxHQUFHLElBQUk7QUFDeEQsQ0FBQztBQUVELE9BQU8sU0FBQVMsWUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFxQjtJQUFBUCxTQUFBO0lBQUFDLFlBQUEsRUFBQU8sRUFBQTtJQUFBTjtFQUFBLElBQUFHLEVBSXBCO0VBRk4sTUFBQUosWUFBQSxHQUFBTyxFQUEwQixLQUExQkMsU0FBMEIsR0FBMUIsV0FBMEIsR0FBMUJELEVBQTBCO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFKLENBQUEsUUFBQUwsWUFBQTtJQU10QlMsRUFBQSxHQUFBWixhQUFhLENBQUFhLFNBQVUsQ0FBQ0MsR0FBQSxJQUFPQSxHQUFHLEtBQUtYLFlBQVksQ0FBQztJ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
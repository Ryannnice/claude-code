// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from 'src/ink.js';
// 接入 AGENT_COLOR_TO_THEME_COLOR、AGENT_COLORS、AgentColorName 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_COLOR_TO_THEME_COLOR, AGENT_COLORS, type AgentColorName } from 'src/tools/AgentTool/agentColorManager.js';
// 类型依赖 { PromptInputMode } 来自 src/types/textInputTypes.js，用于校准终端渲染的数据契约。
import type { PromptInputMode } from 'src/types/textInputTypes.js';
// 复用 getTeammateColor 工具函数，把通用处理留在 src/utils/teammate.js 中维护。
import { getTeammateColor } from 'src/utils/teammate.js';
// 类型依赖 { Theme } 来自 src/utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from 'src/utils/theme.js';
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  mode: PromptInputMode;
  isLoading: boolean;
  viewingAgentName?: string;
  viewingAgentColor?: AgentColorName;
};

/**
 * Gets the theme color key for the teammate's assigned color.
 * Returns undefined if not a teammate or if the color is invalid.
 */
// getTeammateThemeColor 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTeammateThemeColor(): keyof Theme | undefined {
  // 满足 `!isAgentSwarmsEnabled()` 时，终端渲染执行该分支。
  if (!isAgentSwarmsEnabled()) {
    // 返回 `undefined`，作为终端渲染这次计算的结果。
    return undefined;
  }
  // colorName读取`getTeammateColor`，供终端渲染后续处理使用。
  const colorName = getTeammateColor();
  // colorName缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!colorName) {
    // 返回 `undefined`，作为终端渲染这次计算的结果。
    return undefined;
  }
  // 满足 `AGENT_COLORS.includes(colorName as AgentColorName)` 时，终端渲染执行该分支。
  if (AGENT_COLORS.includes(colorName as AgentColorName)) {
    // 返回 `AGENT_COLOR_TO_THEME_COLOR[colorName as AgentColorName]`，作为终端渲染这次计算的结果。
    return AGENT_COLOR_TO_THEME_COLOR[colorName as AgentColorName];
  }
  // 返回 `undefined`，作为终端渲染这次计算的结果。
  return undefined;
}
// PromptCharProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type PromptCharProps = {
  isLoading: boolean;
  // Dead code elimination: parameter named themeColor to avoid "teammate" string in external builds
  themeColor?: keyof Theme;
};

/**
 * Renders the prompt character (❯).
 * Teammate color overrides the default color when set.
 */
// PromptChar 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function PromptChar(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    isLoading,
    themeColor
  } = t0;
  // teammateColor保存`themeColor`，供后续判断或组装使用。
  const teammateColor = themeColor;
  // color保存`teammateColor ?? (false ? "subtle" : undefined)`，供终端渲染提示输入组件 Prompt Input Mode Indi...后续判断或输出使用。
  const color = teammateColor ?? (false ? "subtle" : undefined);
  // t1 暂存 `<Text color={color} dimColor={isLoading}>{figures.pointer...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== color || $[1] !== isLoading) {
    // t1 暂存 `<Text color={color} dimColor={isLoading}>{figures.pointer...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color={color} dimColor={isLoading}>{figures.pointer} </Text>;
    // $[0] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = color;
    // $[1] 缓存 `isLoading`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = isLoading;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// PromptInputModeIndicator 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PromptInputModeIndicator(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    mode,
    isLoading,
    viewingAgentName,
    viewingAgentColor
  } = t0;
  // t1 暂存 `getTeammateThemeColor()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getTeammateThemeColor()` 生成的渲染片段，后续返回路径直接复用。
    t1 = getTeammateThemeColor();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // teammateColor保存`t1`，作为后续临时缓存值处理的输入。
  const teammateColor = t1;
  // viewedTeammateThemeColor保存`viewingAgentColor ? AGENT_COLOR_TO_THEME_COLOR[viewingAge...`，供终端渲染提示输入组件 Prompt Input Mode Indi...后续判断或输出使用。
  const viewedTeammateThemeColor = viewingAgentColor ? AGENT_COLOR_TO_THEME_COLOR[viewingAgentColor] : undefined;
  // t2 暂存 `<Box alignItems="flex-start" alignSelf="flex-start" flexW...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== isLoading || $[2] !== mode || $[3] !== viewedTeammateThemeColor || $[4] !== viewingAgentName) {
    // t2 暂存 `<Box alignItems="flex-start" alignSelf="flex-start" flexW...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box alignItems="flex-start" alignSelf="flex-start" flexWrap="nowrap" justifyContent="flex-start">{viewingAgentName ? <PromptChar isLoading={isLoading} themeColor={viewedTeammateThemeColor} /> : mode === "bash" ? <Text color="bashBorder" dimColor={isLoading}>! </Text> : <PromptChar isLoading={isLoading} themeColor={isAgentSwarmsEnabled() ? teammateColor : undefined} />}</Box>;
    // $[1] 缓存 `isLoading`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = isLoading;
    // $[2] 缓存 `mode`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = mode;
    // $[3] 缓存 `viewedTeammateThemeColor`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = viewedTeammateThemeColor;
    // $[4] 缓存 `viewingAgentName`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = viewingAgentName;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwiQUdFTlRfQ09MT1JfVE9fVEhFTUVfQ09MT1IiLCJBR0VOVF9DT0xPUlMiLCJBZ2VudENvbG9yTmFtZSIsIlByb21wdElucHV0TW9kZSIsImdldFRlYW1tYXRlQ29sb3IiLCJUaGVtZSIsImlzQWdlbnRTd2FybXNFbmFibGVkIiwiUHJvcHMiLCJtb2RlIiwiaXNMb2FkaW5nIiwidmlld2luZ0FnZW50TmFtZSIsInZpZXdpbmdBZ2VudENvbG9yIiwiZ2V0VGVhbW1hdGVUaGVtZUNvbG9yIiwidW5kZWZpbmVkIiwiY29sb3JOYW1lIiwiaW5jbHVkZXMiLCJQcm9tcHRDaGFyUHJvcHMiLCJ0aGVtZUNvbG9yIiwiUHJvbXB0Q2hhciIsInQwIiwiJCIsIl9jIiwidGVhbW1hdGVDb2xvciIsImNvbG9yIiwidDEiLCJwb2ludGVyIiwiUHJvbXB0SW5wdXRNb2RlSW5kaWNhdG9yIiwiU3ltYm9sIiwiZm9yIiwidmlld2VkVGVhbW1hdGVUaGVtZUNvbG9yIiwidDIiXSwic291cmNlcyI6WyJQcm9tcHRJbnB1dE1vZGVJbmRpY2F0b3IudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJ3NyYy9pbmsuanMnXG5pbXBvcnQge1xuICBBR0VOVF9DT0xPUl9UT19USEVNRV9DT0xPUixcbiAgQUdFTlRfQ09MT1JTLFxuICB0eXBlIEFnZW50Q29sb3JOYW1lLFxufSBmcm9tICdzcmMvdG9vbHMvQWdlbnRUb29sL2FnZW50Q29sb3JNYW5hZ2VyLmpzJ1xuaW1wb3J0IHR5cGUgeyBQcm9tcHRJbnB1dE1vZGUgfSBmcm9tICdzcmMvdHlwZXMvdGV4dElucHV0VHlwZXMuanMnXG5pbXBvcnQgeyBnZXRUZWFtbWF0ZUNvbG9yIH0gZnJvbSAnc3JjL3V0aWxzL3RlYW1tYXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBUaGVtZSB9IGZyb20gJ3NyYy91dGlscy90aGVtZS5qcydcbmltcG9ydCB7IGlzQWdlbnRTd2FybXNFbmFibGVkIH0gZnJvbSAnLi4vLi4vdXRpbHMvYWdlbnRTd2FybXNFbmFibGVkLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBtb2RlOiBQcm9tcHRJbnB1dE1vZGVcbiAgaXNMb2FkaW5nOiBib29sZWFuXG4gIHZpZXdpbmdBZ2VudE5hbWU/OiBzdHJpbmdcbiAgdmlld2luZ0FnZW50Q29sb3I/OiBBZ2VudENvbG9yTmFtZVxufVxuXG4vKipcbiAqIEdldHMgdGhlIHRoZW1lIGNvbG9yIGtleSBmb3IgdGhlIHRlYW1tYXRlJ3MgYXNzaWduZWQgY29sb3IuXG4gKiBSZXR1cm5zIHVuZGVmaW5lZCBpZiBub3QgYSB0ZWFtbWF0ZSBvciBpZiB0aGUgY29sb3IgaXMgaW52YWxpZC5cbiAqL1xuZnVuY3Rpb24gZ2V0VGVhbW1hdGVUaGVtZUNvbG9yKCk6IGtleW9mIFRoZW1lIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpc0FnZW50U3dhcm1zRW5hYmxlZCgpKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG4gIGNvbnN0IGNvbG9yTmFtZSA9IGdldFRlYW1tYXRlQ29sb3IoKVxuICBpZiAoIWNvbG9yTmFtZSkge1xuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxuICBpZiAoQUdFTlRfQ09MT1JTLmluY2x1ZGVzKGNvbG9yTmFtZSBhcyBBZ2VudENvbG9yTmFtZSkpIHtcbiAgICByZXR1cm4gQUdFTlRfQ09MT1JfVE9fVEhFTUVfQ09MT1JbY29sb3JOYW1lIGFzIEFnZW50Q29sb3JOYW1lXVxuICB9XG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxudHlwZSBQcm9tcHRDaGFyUHJvcHMgPSB7XG4gIGlzTG9hZGluZzogYm9vbGVhblxuICAvLyBEZWFkIGNvZGUgZWxpbWluYXRpb246IHBhcmFtZXRlciBuYW1lZCB0aGVtZUNvbG9yIHRvIGF2b2lkIFwidGVhbW1hdGVcIiBzdHJpbmcgaW4gZXh0ZXJuYWwgYnVpbGRzXG4gIHRoZW1lQ29sb3I/OiBrZXlvZiBUaGVtZVxufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIHByb21wdCBjaGFyYWN0ZXIgKOKdrykuXG4gKiBUZWFtbWF0ZSBjb2xvciBvdmVycmlkZXMgdGhlIGRlZmF1bHQgY29sb3Igd2hlbiBzZXQuXG4gKi9cbmZ1bmN0aW9uIFByb21wdENoYXIoe1xuICBpc0xvYWRpbmcsXG4gIHRoZW1lQ29sb3IsXG59OiBQcm9tcHRDaGFyUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBBc3NpZ24gdG8gb3JpZ2luYWwgbmFtZSBmb3IgY2xhcml0eSB3aXRoaW4gdGhlIGZ1bmN0aW9uXG4gIGNvbnN0IHRlYW1tYXRlQ29sb3IgPSB0aGVtZUNvbG9yXG4gIGNvbnN0IGlzQW50ID0gXCJleHRlcm5hbFwiID09PSAnYW50J1xuICBjb25zdCBjb2xvciA9IHRlYW1tYXRlQ29sb3IgPz8gKGlzQW50ID8gJ3N1YnRsZScgOiB1bmRlZmluZWQpXG5cbiAgcmV0dXJuIChcbiAgICA8VGV4dCBjb2xvcj17Y29sb3J9IGRpbUNvbG9yPXtpc0xvYWRpbmd9PlxuICAgICAge2ZpZ3VyZXMucG9pbnRlcn0mbmJzcDtcbiAgICA8L1RleHQ+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByb21wdElucHV0TW9kZUluZGljYXRvcih7XG4gIG1vZGUsXG4gIGlzTG9hZGluZyxcbiAgdmlld2luZ0FnZW50TmFtZSxcbiAgdmlld2luZ0FnZW50Q29sb3IsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHRlYW1tYXRlQ29sb3IgPSBnZXRUZWFtbWF0ZVRoZW1lQ29sb3IoKVxuXG4gIC8vIENvbnZlcnQgdmlld2VkIHRlYW1tYXRlJ3MgY29sb3IgdG8gdGhlbWUgY29sb3JcbiAgLy8gRmFsbHMgYmFjayB0byBQcm9tcHRDaGFyJ3MgZGVmYXVsdCAoc3VidGxlIGZvciBhbnRzLCB1bmRlZmluZWQgZm9yIGV4dGVybmFsKVxuICBjb25zdCB2aWV3ZWRUZWFtbWF0ZVRoZW1lQ29sb3IgPSB2aWV3aW5nQWdlbnRDb2xvclxuICAgID8gQUdFTlRfQ09MT1JfVE9fVEhFTUVfQ09MT1Jbdmlld2luZ0FnZW50Q29sb3JdXG4gICAgOiB1bmRlZmluZWRcblxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGFsaWduSXRlbXM9XCJmbGV4LXN0YXJ0XCJcbiAgICAgIGFsaWduU2VsZj1cImZsZXgtc3RhcnRcIlxuICAgICAgZmxleFdyYXA9XCJub3dyYXBcIlxuICAgICAganVzdGlmeUNvbnRlbnQ9XCJmbGV4LXN0YXJ0XCJcbiAgICA+XG4gICAgICB7dmlld2luZ0FnZW50TmFtZSA/IChcbiAgICAgICAgLy8gVXNlIHRlYW1tYXRlJ3MgY29sb3Igb24gdGhlIHN0YW5kYXJkIHByb21wdCBjaGFyYWN0ZXIsIG1hdGNoaW5nIGVzdGFibGlzaGVkIHN0eWxlXG4gICAgICAgIDxQcm9tcHRDaGFyXG4gICAgICAgICAgaXNMb2FkaW5nPXtpc0xvYWRpbmd9XG4gICAgICAgICAgdGhlbWVDb2xvcj17dmlld2VkVGVhbW1hdGVUaGVtZUNvbG9yfVxuICAgICAgICAvPlxuICAgICAgKSA6IG1vZGUgPT09ICdiYXNoJyA/IChcbiAgICAgICAgPFRleHQgY29sb3I9XCJiYXNoQm9yZGVyXCIgZGltQ29sb3I9e2lzTG9hZGluZ30+XG4gICAgICAgICAgISZuYnNwO1xuICAgICAgICA8L1RleHQ+XG4gICAgICApIDogKFxuICAgICAgICA8UHJvbXB0Q2hhclxuICAgICAgICAgIGlzTG9hZGluZz17aXNMb2FkaW5nfVxuICAgICAgICAgIHRoZW1lQ29sb3I9e2lzQWdlbnRTd2FybXNFbmFibGVkKCkgPyB0ZWFtbWF0ZUNvbG9yIDogdW5kZWZpbmVkfVxuICAgICAgICAvPlxuICAgICAgKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBTyxLQUFLQyxLQUFLLE1B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
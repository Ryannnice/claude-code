// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 Byline，将 ../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../design-system/Byline.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  serverToolsCount: number;
  serverPromptsCount: number;
  serverResourcesCount: number;
};
// CapabilitiesSection 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CapabilitiesSection(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    serverToolsCount,
    serverPromptsCount,
    serverResourcesCount
  } = t0;
  // capabilities 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let capabilities;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== serverPromptsCount || $[1] !== serverResourcesCount || $[2] !== serverToolsCount) {
    // capabilities 集合更新为 `[]`，确保MCP 界面后续读取最新状态。
    capabilities = [];
    // 满足 `serverToolsCount > 0` 时，终端渲染执行该分支。
    if (serverToolsCount > 0) {
      // capabilities 集合追加新条目，保持收集顺序与输入顺序一致。
      capabilities.push("tools");
    }
    // 满足 `serverResourcesCount > 0` 时，终端渲染执行该分支。
    if (serverResourcesCount > 0) {
      // capabilities 集合追加新条目，保持收集顺序与输入顺序一致。
      capabilities.push("resources");
    }
    // 满足 `serverPromptsCount > 0` 时，终端渲染执行该分支。
    if (serverPromptsCount > 0) {
      // capabilities 集合追加新条目，保持收集顺序与输入顺序一致。
      capabilities.push("prompts");
    }
    // $[0] 缓存 `serverPromptsCount`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = serverPromptsCount;
    // $[1] 缓存 `serverResourcesCount`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = serverResourcesCount;
    // $[2] 缓存 `serverToolsCount`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = serverToolsCount;
    // $[3] 缓存 `capabilities`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = capabilities;
  } else {
    // capabilities 集合更新为 `$[3]`，确保MCP 界面后续读取最新状态。
    capabilities = $[3];
  }
  // t1 暂存 `<Text bold={true}>Capabilities: </Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text bold={true}>Capabilities: </Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text bold={true}>Capabilities: </Text>;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // t2 暂存 `capabilities.length > 0 ? <Byline>{capabilities}</Byline>...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== capabilities) {
    // t2 暂存 `capabilities.length > 0 ? <Byline>{capabilities}</Byline>...` 生成的渲染片段，后续返回路径直接复用。
    t2 = capabilities.length > 0 ? <Byline>{capabilities}</Byline> : "none";
    // $[5] 缓存 `capabilities`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = capabilities;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // t3 暂存 `<Box>{t1}<Text color="text">{t2}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t2) {
    // t3 暂存 `<Box>{t1}<Text color="text">{t2}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box>{t1}<Text color="text">{t2}</Text></Box>;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJCeWxpbmUiLCJQcm9wcyIsInNlcnZlclRvb2xzQ291bnQiLCJzZXJ2ZXJQcm9tcHRzQ291bnQiLCJzZXJ2ZXJSZXNvdXJjZXNDb3VudCIsIkNhcGFiaWxpdGllc1NlY3Rpb24iLCJ0MCIsIiQiLCJfYyIsImNhcGFiaWxpdGllcyIsInB1c2giLCJ0MSIsIlN5bWJvbCIsImZvciIsInQyIiwibGVuZ3RoIiwidDMiXSwic291cmNlcyI6WyJDYXBhYmlsaXRpZXNTZWN0aW9uLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0J5bGluZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgc2VydmVyVG9vbHNDb3VudDogbnVtYmVyXG4gIHNlcnZlclByb21wdHNDb3VudDogbnVtYmVyXG4gIHNlcnZlclJlc291cmNlc0NvdW50OiBudW1iZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENhcGFiaWxpdGllc1NlY3Rpb24oe1xuICBzZXJ2ZXJUb29sc0NvdW50LFxuICBzZXJ2ZXJQcm9tcHRzQ291bnQsXG4gIHNlcnZlclJlc291cmNlc0NvdW50LFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBjYXBhYmlsaXRpZXMgPSBbXVxuICBpZiAoc2VydmVyVG9vbHNDb3VudCA+IDApIHtcbiAgICBjYXBhYmlsaXRpZXMucHVzaCgndG9vbHMnKVxuICB9XG4gIGlmIChzZXJ2ZXJSZXNvdXJjZXNDb3VudCA+IDApIHtcbiAgICBjYXBhYmlsaXRpZXMucHVzaCgncmVzb3VyY2VzJylcbiAgfVxuICBpZiAoc2VydmVyUHJvbXB0c0NvdW50ID4gMCkge1xuICAgIGNhcGFiaWxpdGllcy5wdXNoKCdwcm9tcHRzJylcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveD5cbiAgICAgIDxUZXh0IGJvbGQ+Q2FwYWJpbGl0aWVzOiA8L1RleHQ+XG4gICAgICA8VGV4dCBjb2xvcj1cInRleHRcIj5cbiAgICAgICAge2NhcGFiaWxpdGllcy5sZW5ndGggPiAwID8gPEJ5bGluZT57Y2FwYWJpbGl0aWVzfTwvQnlsaW5lPiA6ICdub25lJ31cbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxNQUFNLFFBQVEsNEJBQTRCO0FBRW5ELEtBQUtDLEtBQUssR0FBRztFQUNYQyxnQkFBZ0IsRUFBRSxNQUFNO0VBQ3hCQyxrQkFBa0IsRUFBRSxNQUFNO0VBQzFCQyxvQkFBb0IsRUFBRSxNQUFNO0FBQzlCLENBQUM7QUFFRCxPQUFPLFNBQUFDLG9CQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQTZCO0lBQUFOLGdCQUFBO0lBQUFDLGtCQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFJNUI7RUFBQSxJQUFBRyxZQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBSixrQkFBQSxJQUFBSSxDQUFBLFFBQUFILG9CQUFBLElBQUFHLENBQUEsUUFBQUwsZ0JBQUE7SUFDTk8sWUFBQSxHQUFxQixFQUFFO0lBQ3ZCLElBQUlQLGdCQUFnQixHQUFHLENBQUM7TUFDdEJPLFlBQVksQ0FBQUMsSUFBSyxDQUFDLE9BQU8sQ0FBQztJQUFBO0lBRTVCLElBQUlOLG9CQUFvQixHQUFHLENBQUM7TUFDMUJLLFlBQVksQ0FBQUMsSUFBSyxDQUFDLFdBQVcsQ0FBQztJQUFBO0lBRWhDLElBQUlQLGtCQUFrQixHQUFHLENBQUM7TUFDeEJNLFlBQVksQ0FBQUMsSUFBSyxDQUFDLFNBQVMsQ0FBQztJQUFBO0lBQzdCSCxDQUFBLE1BQUFKLGtCQUFBO0lBQUFJLENBQUEsTUFBQUgsb0JBQUE7SUFBQUcsQ0FBQSxNQUFBTCxnQkFBQTtJQUFBSyxDQUFBLE1BQUFFLFlBQUE7RUFBQTtJQUFBQSxZQUFBLEdBQUFGLENBQUE7RUFBQTtFQUFBLElBQUFJLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFLLE1BQUEsQ0FBQUMsR0FBQTtJQUlHRixFQUFBLElBQUMsSUFBSSxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBQyxjQUFjLEVBQXhCLElBQUksQ0FBMkI7SUFBQUosQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBQSxJQUFBTyxFQUFBO0VBQUEsSUFBQVAsQ0FBQSxRQUFBRSxZQUFBO0lBRTdCSyxFQUFBLEdBQUFMLFlBQVksQ0FBQU0sTUFBTyxHQUFHLENBQTRDLEdBQXhDLENBQUMsTUFBTSxDQUFFTixhQUFXLENBQUUsRUFBckIsTUFBTSxDQUFpQyxHQUFsRSxNQUFrRTtJQUFBRixDQUFBLE1BQUFFLFlBQUE7SUFBQUYsQ0FBQSxNQUFBTyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUCxDQUFBO0VBQUE7RUFBQSxJQUFBUyxFQUFBO0VBQUEsSUFBQVQsQ0FBQSxRQUFBTyxFQUFBO0lBSHZFRSxFQUFBLElBQUMsR0FBRyxDQUNGLENBQUFMLEVBQStCLENBQy9CLENBQUMsSUFBSSxDQUFPLEtBQU0sQ0FBTixNQUFNLENBQ2YsQ0FBQUcsRUFBaUUsQ0FDcEUsRUFGQyxJQUFJLENBR1AsRUFMQyxHQUFHLENBS0U7SUFBQVAsQ0FBQSxNQUFBTyxFQUFBO0lBQUFQLENBQUEsTUFBQVMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVQsQ0FBQTtFQUFBO0VBQUEsT0FMTlMsRUFLTTtBQUFBIiwiaWdub3JlTGlzdCI6W119
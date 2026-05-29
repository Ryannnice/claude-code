// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// 类型依赖 { WorkerBadgeProps } 来自 ./WorkerBadge.js，用于校准终端渲染的数据契约。
import type { WorkerBadgeProps } from './WorkerBadge.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  title: string;
  subtitle?: React.ReactNode;
  color?: keyof Theme;
  workerBadge?: WorkerBadgeProps;
};
// PermissionRequestTitle 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionRequestTitle(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title,
    subtitle,
    color: t1,
    workerBadge
  } = t0;
  // color标记终端渲染权限确认界面 Permission Request Tit...是否启用对应路径。
  const color = t1 === undefined ? "permission" : t1;
  // t2 暂存 `<Text bold={true} color={color}>{title}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== color || $[1] !== title) {
    // t2 暂存 `<Text bold={true} color={color}>{title}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text bold={true} color={color}>{title}</Text>;
    // $[0] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = color;
    // $[1] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = title;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `workerBadge && <Text dimColor={true}>{"\xB7 "}@{workerBad...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== workerBadge) {
    // t3 暂存 `workerBadge && <Text dimColor={true}>{"\xB7 "}@{workerBad...` 生成的渲染片段，后续返回路径直接复用。
    t3 = workerBadge && <Text dimColor={true}>{"\xB7 "}@{workerBadge.name}</Text>;
    // $[3] 缓存 `workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = workerBadge;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<Box flexDirection="row" gap={1}>{t2}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t2 || $[6] !== t3) {
    // t4 暂存 `<Box flexDirection="row" gap={1}>{t2}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="row" gap={1}>{t2}{t3}</Box>;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `subtitle != null && (typeof subtitle === "string" ? <Text...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== subtitle) {
    // t5 暂存 `subtitle != null && (typeof subtitle === "string" ? <Text...` 生成的渲染片段，后续返回路径直接复用。
    t5 = subtitle != null && (typeof subtitle === "string" ? <Text dimColor={true} wrap="truncate-start">{subtitle}</Text> : subtitle);
    // $[8] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = subtitle;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // t6 暂存 `<Box flexDirection="column">{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t4 || $[11] !== t5) {
    // t6 暂存 `<Box flexDirection="column">{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column">{t4}{t5}</Box>;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJUaGVtZSIsIldvcmtlckJhZGdlUHJvcHMiLCJQcm9wcyIsInRpdGxlIiwic3VidGl0bGUiLCJSZWFjdE5vZGUiLCJjb2xvciIsIndvcmtlckJhZGdlIiwiUGVybWlzc2lvblJlcXVlc3RUaXRsZSIsInQwIiwiJCIsIl9jIiwidDEiLCJ1bmRlZmluZWQiLCJ0MiIsInQzIiwibmFtZSIsInQ0IiwidDUiLCJ0NiJdLCJzb3VyY2VzIjpbIlBlcm1pc3Npb25SZXF1ZXN0VGl0bGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBUaGVtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHR5cGUgeyBXb3JrZXJCYWRnZVByb3BzIH0gZnJvbSAnLi9Xb3JrZXJCYWRnZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgdGl0bGU6IHN0cmluZ1xuICBzdWJ0aXRsZT86IFJlYWN0LlJlYWN0Tm9kZVxuICBjb2xvcj86IGtleW9mIFRoZW1lXG4gIHdvcmtlckJhZGdlPzogV29ya2VyQmFkZ2VQcm9wc1xufVxuXG5leHBvcnQgZnVuY3Rpb24gUGVybWlzc2lvblJlcXVlc3RUaXRsZSh7XG4gIHRpdGxlLFxuICBzdWJ0aXRsZSxcbiAgY29sb3IgPSAncGVybWlzc2lvbicsXG4gIHdvcmtlckJhZGdlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsxfT5cbiAgICAgICAgPFRleHQgYm9sZCBjb2xvcj17Y29sb3J9PlxuICAgICAgICAgIHt0aXRsZX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICB7d29ya2VyQmFkZ2UgJiYgKFxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgeyfCtyAnfUB7d29ya2VyQmFkZ2UubmFtZX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICAgIHtzdWJ0aXRsZSAhPSBudWxsICYmXG4gICAgICAgICh0eXBlb2Ygc3VidGl0bGUgPT09ICdzdHJpbmcnID8gKFxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yIHdyYXA9XCJ0cnVuY2F0ZS1zdGFydFwiPlxuICAgICAgICAgICAge3N1YnRpdGxlfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICBzdWJ0aXRsZVxuICAgICAgICApKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLGNBQWNDLEtBQUssUUFBUSxzQkFBc0I7QUFDakQsY0FBY0MsZ0JBQWdCLFFBQVEsa0JBQWtCO0FBRXhELEtBQUtDLEtBQUssR0FBRztFQUNYQyxLQUFLLEVBQUUsTUFBTTtFQUNiQyxRQUFRLENBQUMsRUFBRVAsS0FBSyxDQUFDUSxTQUFTO0VBQzFCQyxLQUFLLENBQUMsRUFBRSxNQUFNTixLQUFLO0VBQ25CTyxXQUFXLENBQUMsRUFBRU4sZ0JBQWdCO0FBQ2hDLENBQUM7QUFFRCxPQUFPLFNBQUFPLHVCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWdDO0lBQUFSLEtBQUE7SUFBQUMsUUFBQTtJQUFBRSxLQUFBLEVBQUFNLEVBQUE7SUFBQUw7RUFBQSxJQUFBRSxFQUsvQjtFQUZOLE1BQUFILEtBQUEsR0FBQU0sRUFBb0IsS0FBcEJDLFNBQW9CLEdBQXBCLFlBQW9CLEdBQXBCRCxFQUFvQjtFQUFBLElBQUFFLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFKLEtBQUEsSUFBQUksQ0FBQSxRQUFBUCxLQUFBO0lBTWRXLEVBQUEsSUFBQyxJQUFJLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFRUixLQUFLLENBQUxBLE1BQUksQ0FBQyxDQUNwQkgsTUFBSSxDQUNQLEVBRkMsSUFBSSxDQUVFO0lBQUFPLENBQUEsTUFBQUosS0FBQTtJQUFBSSxDQUFBLE1BQUFQLEtBQUE7SUFBQU8sQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBSCxXQUFBO0lBQ05RLEVBQUEsR0FBQVIsV0FJQSxJQUhDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWCxRQUFHLENBQUUsQ0FBRSxDQUFBQSxXQUFXLENBQUFTLElBQUksQ0FDekIsRUFGQyxJQUFJLENBR047SUFBQU4sQ0FBQSxNQUFBSCxXQUFBO0lBQUFHLENBQUEsTUFBQUssRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUwsQ0FBQTtFQUFBO0VBQUEsSUFBQU8sRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQUksRUFBQSxJQUFBSixDQUFBLFFBQUFLLEVBQUE7SUFSSEUsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFLLENBQUwsS0FBSyxDQUFNLEdBQUMsQ0FBRCxHQUFDLENBQzdCLENBQUFILEVBRU0sQ0FDTCxDQUFBQyxFQUlELENBQ0YsRUFUQyxHQUFHLENBU0U7SUFBQUwsQ0FBQSxNQUFBSSxFQUFBO0lBQUFKLENBQUEsTUFBQUssRUFBQTtJQUFBTCxDQUFBLE1BQUFPLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFQLENBQUE7RUFBQTtFQUFBLElBQUFRLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFOLFFBQUE7SUFDTGMsRUFBQSxHQUFBZCxRQUFRLElBQUksSUFPVCxLQU5ELE9BQU9BLFFBQVEsS0FBSyxRQU1wQixHQUxDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBTSxJQUFnQixDQUFoQixnQkFBZ0IsQ0FDakNBLFNBQU8sQ0FDVixFQUZDLElBQUksQ0FLTixHQU5BQSxRQU1DO0lBQUFNLENBQUEsTUFBQU4sUUFBQTtJQUFBTSxDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFBLElBQUFTLEVBQUE7RUFBQSxJQUFBVCxDQUFBLFNBQUFPLEVBQUEsSUFBQVAsQ0FBQSxTQUFBUSxFQUFBO0lBbEJOQyxFQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQ3pCLENBQUFGLEVBU0ssQ0FDSixDQUFBQyxFQU9FLENBQ0wsRUFuQkMsR0FBRyxDQW1CRTtJQUFBUixDQUFBLE9BQUFPLEVBQUE7SUFBQVAsQ0FBQSxPQUFBUSxFQUFBO0lBQUFSLENBQUEsT0FBQVMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVQsQ0FBQTtFQUFBO0VBQUEsT0FuQk5TLEVBbUJNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
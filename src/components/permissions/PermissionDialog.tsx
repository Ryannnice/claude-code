// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../ink.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// 引入 PermissionRequestTitle，将 ./PermissionRequestTitle.js 中已经封装好的能力接到本文件流程里。
import { PermissionRequestTitle } from './PermissionRequestTitle.js';
// 类型依赖 { WorkerBadgeProps } 来自 ./WorkerBadge.js，用于校准终端渲染的数据契约。
import type { WorkerBadgeProps } from './WorkerBadge.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  title: string;
  subtitle?: React.ReactNode;
  color?: keyof Theme;
  titleColor?: keyof Theme;
  innerPaddingX?: number;
  workerBadge?: WorkerBadgeProps;
  titleRight?: React.ReactNode;
  children: React.ReactNode;
};
// PermissionDialog 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(15);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title,
    subtitle,
    color: t1,
    titleColor,
    innerPaddingX: t2,
    workerBadge,
    titleRight,
    children
  } = t0;
  // color标记终端渲染权限确认界面 Permission Dialog是否启用对应路径。
  const color = t1 === undefined ? "permission" : t1;
  // innerPaddingX标记终端渲染权限确认界面 Permission Dialog是否启用对应路径。
  const innerPaddingX = t2 === undefined ? 1 : t2;
  // t3 暂存 `<PermissionRequestTitle title={title} subtitle={subtitle}...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== subtitle || $[1] !== title || $[2] !== titleColor || $[3] !== workerBadge) {
    // t3 暂存 `<PermissionRequestTitle title={title} subtitle={subtitle}...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <PermissionRequestTitle title={title} subtitle={subtitle} color={titleColor} workerBadge={workerBadge} />;
    // $[0] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = subtitle;
    // $[1] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = title;
    // $[2] 缓存 `titleColor`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = titleColor;
    // $[3] 缓存 `workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = workerBadge;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<Box paddingX={1} flexDirection="column"><Box justifyCont...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t3 || $[6] !== titleRight) {
    // t4 暂存 `<Box paddingX={1} flexDirection="column"><Box justifyCont...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box paddingX={1} flexDirection="column"><Box justifyContent="space-between">{t3}{titleRight}</Box></Box>;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `titleRight`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = titleRight;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<Box flexDirection="column" paddingX={innerPaddingX}>{chi...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== children || $[9] !== innerPaddingX) {
    // t5 暂存 `<Box flexDirection="column" paddingX={innerPaddingX}>{chi...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" paddingX={innerPaddingX}>{children}</Box>;
    // $[8] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = children;
    // $[9] 缓存 `innerPaddingX`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = innerPaddingX;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `<Box flexDirection="column" borderStyle="round" borderCol...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== color || $[12] !== t4 || $[13] !== t5) {
    // t6 暂存 `<Box flexDirection="column" borderStyle="round" borderCol...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" borderStyle="round" borderColor={color} borderLeft={false} borderRight={false} borderBottom={false} marginTop={1}>{t4}{t5}</Box>;
    // $[11] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = color;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRoZW1lIiwiUGVybWlzc2lvblJlcXVlc3RUaXRsZSIsIldvcmtlckJhZGdlUHJvcHMiLCJQcm9wcyIsInRpdGxlIiwic3VidGl0bGUiLCJSZWFjdE5vZGUiLCJjb2xvciIsInRpdGxlQ29sb3IiLCJpbm5lclBhZGRpbmdYIiwid29ya2VyQmFkZ2UiLCJ0aXRsZVJpZ2h0IiwiY2hpbGRyZW4iLCJQZXJtaXNzaW9uRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwidW5kZWZpbmVkIiwidDMiLCJ0NCIsInQ1IiwidDYiXSwic291cmNlcyI6WyJQZXJtaXNzaW9uRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWUgfSBmcm9tICcuLi8uLi91dGlscy90aGVtZS5qcydcbmltcG9ydCB7IFBlcm1pc3Npb25SZXF1ZXN0VGl0bGUgfSBmcm9tICcuL1Blcm1pc3Npb25SZXF1ZXN0VGl0bGUuanMnXG5pbXBvcnQgdHlwZSB7IFdvcmtlckJhZGdlUHJvcHMgfSBmcm9tICcuL1dvcmtlckJhZGdlLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0aXRsZTogc3RyaW5nXG4gIHN1YnRpdGxlPzogUmVhY3QuUmVhY3ROb2RlXG4gIGNvbG9yPzoga2V5b2YgVGhlbWVcbiAgdGl0bGVDb2xvcj86IGtleW9mIFRoZW1lXG4gIGlubmVyUGFkZGluZ1g/OiBudW1iZXJcbiAgd29ya2VyQmFkZ2U/OiBXb3JrZXJCYWRnZVByb3BzXG4gIHRpdGxlUmlnaHQ/OiBSZWFjdC5SZWFjdE5vZGVcbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gUGVybWlzc2lvbkRpYWxvZyh7XG4gIHRpdGxlLFxuICBzdWJ0aXRsZSxcbiAgY29sb3IgPSAncGVybWlzc2lvbicsXG4gIHRpdGxlQ29sb3IsXG4gIGlubmVyUGFkZGluZ1ggPSAxLFxuICB3b3JrZXJCYWRnZSxcbiAgdGl0bGVSaWdodCxcbiAgY2hpbGRyZW4sXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICBib3JkZXJTdHlsZT1cInJvdW5kXCJcbiAgICAgIGJvcmRlckNvbG9yPXtjb2xvcn1cbiAgICAgIGJvcmRlckxlZnQ9e2ZhbHNlfVxuICAgICAgYm9yZGVyUmlnaHQ9e2ZhbHNlfVxuICAgICAgYm9yZGVyQm90dG9tPXtmYWxzZX1cbiAgICAgIG1hcmdpblRvcD17MX1cbiAgICA+XG4gICAgICA8Qm94IHBhZGRpbmdYPXsxfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxCb3gganVzdGlmeUNvbnRlbnQ9XCJzcGFjZS1iZXR3ZWVuXCI+XG4gICAgICAgICAgPFBlcm1pc3Npb25SZXF1ZXN0VGl0bGVcbiAgICAgICAgICAgIHRpdGxlPXt0aXRsZX1cbiAgICAgICAgICAgIHN1YnRpdGxlPXtzdWJ0aXRsZX1cbiAgICAgICAgICAgIGNvbG9yPXt0aXRsZUNvbG9yfVxuICAgICAgICAgICAgd29ya2VyQmFkZ2U9e3dvcmtlckJhZGdlfVxuICAgICAgICAgIC8+XG4gICAgICAgICAge3RpdGxlUmlnaHR9XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBwYWRkaW5nWD17aW5uZXJQYWRkaW5nWH0+XG4gICAgICAgIHtjaGlsZHJlbn1cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsUUFBUSxjQUFjO0FBQ2xDLGNBQWNDLEtBQUssUUFBUSxzQkFBc0I7QUFDakQsU0FBU0Msc0JBQXNCLFFBQVEsNkJBQTZCO0FBQ3BFLGNBQWNDLGdCQUFnQixRQUFRLGtCQUFrQjtBQUV4RCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsS0FBSyxFQUFFLE1BQU07RUFDYkMsUUFBUSxDQUFDLEVBQUVQLEtBQUssQ0FBQ1EsU0FBUztFQUMxQkMsS0FBSyxDQUFDLEVBQUUsTUFBTVAsS0FBSztFQUNuQlEsVUFBVSxDQUFDLEVBQUUsTUFBTVIsS0FBSztFQUN4QlMsYUFBYSxDQUFDLEVBQUUsTUFBTTtFQUN0QkMsV0FBVyxDQUFDLEVBQUVSLGdCQUFnQjtFQUM5QlMsVUFBVSxDQUFDLEVBQUViLEtBQUssQ0FBQ1EsU0FBUztFQUM1Qk0sUUFBUSxFQUFFZCxLQUFLLENBQUNRLFNBQVM7QUFDM0IsQ0FBQztBQUVELE9BQU8sU0FBQU8saUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBMEI7SUFBQVosS0FBQTtJQUFBQyxRQUFBO0lBQUFFLEtBQUEsRUFBQVUsRUFBQTtJQUFBVCxVQUFBO0lBQUFDLGFBQUEsRUFBQVMsRUFBQTtJQUFBUixXQUFBO0lBQUFDLFVBQUE7SUFBQUM7RUFBQSxJQUFBRSxFQVN6QjtFQU5OLE1BQUFQLEtBQUEsR0FBQVUsRUFBb0IsS0FBcEJFLFNBQW9CLEdBQXBCLFlBQW9CLEdBQXBCRixFQUFvQjtFQUVwQixNQUFBUixhQUFBLEdBQUFTLEVBQWlCLEtBQWpCQyxTQUFpQixHQUFqQixDQUFpQixHQUFqQkQsRUFBaUI7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBVixRQUFBLElBQUFVLENBQUEsUUFBQVgsS0FBQSxJQUFBVyxDQUFBLFFBQUFQLFVBQUEsSUFBQU8sQ0FBQSxRQUFBTCxXQUFBO0lBaUJUVSxFQUFBLElBQUMsc0JBQXNCLENBQ2RoQixLQUFLLENBQUxBLE1BQUksQ0FBQyxDQUNGQyxRQUFRLENBQVJBLFNBQU8sQ0FBQyxDQUNYRyxLQUFVLENBQVZBLFdBQVMsQ0FBQyxDQUNKRSxXQUFXLENBQVhBLFlBQVUsQ0FBQyxHQUN4QjtJQUFBSyxDQUFBLE1BQUFWLFFBQUE7SUFBQVUsQ0FBQSxNQUFBWCxLQUFBO0lBQUFXLENBQUEsTUFBQVAsVUFBQTtJQUFBTyxDQUFBLE1BQUFMLFdBQUE7SUFBQUssQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFBQSxJQUFBTSxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxRQUFBSyxFQUFBLElBQUFMLENBQUEsUUFBQUosVUFBQTtJQVBOVSxFQUFBLElBQUMsR0FBRyxDQUFXLFFBQUMsQ0FBRCxHQUFDLENBQWdCLGFBQVEsQ0FBUixRQUFRLENBQ3RDLENBQUMsR0FBRyxDQUFnQixjQUFlLENBQWYsZUFBZSxDQUNqQyxDQUFBRCxFQUtDLENBQ0FULFdBQVMsQ0FDWixFQVJDLEdBQUcsQ0FTTixFQVZDLEdBQUcsQ0FVRTtJQUFBSSxDQUFBLE1BQUFLLEVBQUE7SUFBQUwsQ0FBQSxNQUFBSixVQUFBO0lBQUFJLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBQUEsSUFBQU8sRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQUgsUUFBQSxJQUFBRyxDQUFBLFFBQUFOLGFBQUE7SUFDTmEsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFXYixRQUFhLENBQWJBLGNBQVksQ0FBQyxDQUNoREcsU0FBTyxDQUNWLEVBRkMsR0FBRyxDQUVFO0lBQUFHLENBQUEsTUFBQUgsUUFBQTtJQUFBRyxDQUFBLE1BQUFOLGFBQUE7SUFBQU0sQ0FBQSxPQUFBTyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUCxDQUFBO0VBQUE7RUFBQSxJQUFBUSxFQUFBO0VBQUEsSUFBQVIsQ0FBQSxTQUFBUixLQUFBLElBQUFRLENBQUEsU0FBQU0sRUFBQSxJQUFBTixDQUFBLFNBQUFPLEVBQUE7SUF0QlJDLEVBQUEsSUFBQyxHQUFHLENBQ1ksYUFBUSxDQUFSLFFBQVEsQ0FDVixXQUFPLENBQVAsT0FBTyxDQUNOaEIsV0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDTixVQUFLLENBQUwsTUFBSSxDQUFDLENBQ0osV0FBSyxDQUFMLE1BQUksQ0FBQyxDQUNKLFlBQUssQ0FBTCxNQUFJLENBQUMsQ0FDUixTQUFDLENBQUQsR0FBQyxDQUVaLENBQUFjLEVBVUssQ0FDTCxDQUFBQyxFQUVLLENBQ1AsRUF2QkMsR0FBRyxDQXVCRTtJQUFBUCxDQUFBLE9BQUFSLEtBQUE7SUFBQVEsQ0FBQSxPQUFBTSxFQUFBO0lBQUFOLENBQUEsT0FBQU8sRUFBQTtJQUFBUCxDQUFBLE9BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFBLE9BdkJOUSxFQXVCTTtBQUFBIiwiaWdub3JlTGlzdCI6W119
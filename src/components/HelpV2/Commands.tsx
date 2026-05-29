// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react';
// 引入 Command、formatDescriptionWithSource，将 ../../commands.js 中已经封装好的能力接到本文件流程里。
import { type Command, formatDescriptionWithSource } from '../../commands.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 useTabHeaderFocus，将 ../design-system/Tabs.js 中已经封装好的能力接到本文件流程里。
import { useTabHeaderFocus } from '../design-system/Tabs.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  commands: Command[];
  maxHeight: number;
  columns: number;
  title: string;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  emptyMessage?: string;
};
// Commands 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Commands(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    commands,
    maxHeight,
    columns,
    title,
    onCancel,
    emptyMessage
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    headerFocused,
    focusHeader
  } = useTabHeaderFocus();
  // maxWidth保存`Math.max`，供终端渲染后续处理使用。
  const maxWidth = Math.max(1, columns - 10);
  // visibleCount 数量保存`Math.max`，供终端渲染后续处理使用。
  const visibleCount = Math.max(1, Math.floor((maxHeight - 10) / 2));
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== commands || $[1] !== maxWidth) {
    // seen保存`Set`，供终端渲染后续处理使用。
    const seen = new Set();
    // t2 暂存 `cmd_0 => ({` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== maxWidth) {
      // t2 暂存 `cmd_0 => ({` 生成的渲染片段，后续返回路径直接复用。
      t2 = cmd_0 => ({
        label: `/${cmd_0.name}`,
        value: cmd_0.name,
        description: truncate(formatDescriptionWithSource(cmd_0), maxWidth, true)
      });
      // $[3] 缓存 `maxWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = maxWidth;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[4];
    }
    // t1 暂存 `commands.filter(cmd => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = commands.filter(cmd => {
      // 满足 `seen.has(cmd.name)` 时，终端渲染执行该分支。
      if (seen.has(cmd.name)) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
      // 调用 seen.add，触发终端渲染此处需要的副作用。
      seen.add(cmd.name);
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true;
    }).sort(_temp).map(t2);
    // $[0] 缓存 `commands`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = commands;
    // $[1] 缓存 `maxWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = maxWidth;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // 选项 命名 `t1`，让后续代码直接表达这个值的用途。
  const options = t1;
  // t2 暂存 `<Box flexDirection="column" paddingY={1}>{commands.length...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== commands.length || $[6] !== emptyMessage || $[7] !== focusHeader || $[8] !== headerFocused || $[9] !== onCancel || $[10] !== options || $[11] !== title || $[12] !== visibleCount) {
    // t2 暂存 `<Box flexDirection="column" paddingY={1}>{commands.length...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexDirection="column" paddingY={1}>{commands.length === 0 && emptyMessage ? <Text dimColor={true}>{emptyMessage}</Text> : <><Text>{title}</Text><Box marginTop={1}><Select options={options} visibleOptionCount={visibleCount} onCancel={onCancel} disableSelection={true} hideIndexes={true} layout="compact-vertical" onUpFromFirstItem={focusHeader} isDisabled={headerFocused} /></Box></>}</Box>;
    // $[5] 缓存 `commands.length`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = commands.length;
    // $[6] 缓存 `emptyMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = emptyMessage;
    // $[7] 缓存 `focusHeader`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = focusHeader;
    // $[8] 缓存 `headerFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = headerFocused;
    // $[9] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = onCancel;
    // $[10] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = options;
    // $[11] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = title;
    // $[12] 缓存 `visibleCount`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = visibleCount;
    // $[13] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[13];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(a, b) {
  // 返回 `a.name.localeCompare(b.name)`，作为终端渲染这次计算的结果。
  return a.name.localeCompare(b.name);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1lbW8iLCJDb21tYW5kIiwiZm9ybWF0RGVzY3JpcHRpb25XaXRoU291cmNlIiwiQm94IiwiVGV4dCIsInRydW5jYXRlIiwiU2VsZWN0IiwidXNlVGFiSGVhZGVyRm9jdXMiLCJQcm9wcyIsImNvbW1hbmRzIiwibWF4SGVpZ2h0IiwiY29sdW1ucyIsInRpdGxlIiwib25DYW5jZWwiLCJlbXB0eU1lc3NhZ2UiLCJDb21tYW5kcyIsInQwIiwiJCIsIl9jIiwiaGVhZGVyRm9jdXNlZCIsImZvY3VzSGVhZGVyIiwibWF4V2lkdGgiLCJNYXRoIiwibWF4IiwidmlzaWJsZUNvdW50IiwiZmxvb3IiLCJ0MSIsInNlZW4iLCJTZXQiLCJ0MiIsImNtZF8wIiwibGFiZWwiLCJjbWQiLCJuYW1lIiwidmFsdWUiLCJkZXNjcmlwdGlvbiIsImZpbHRlciIsImhhcyIsImFkZCIsInNvcnQiLCJfdGVtcCIsIm1hcCIsIm9wdGlvbnMiLCJsZW5ndGgiLCJhIiwiYiIsImxvY2FsZUNvbXBhcmUiXSwic291cmNlcyI6WyJDb21tYW5kcy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB0eXBlIENvbW1hbmQsIGZvcm1hdERlc2NyaXB0aW9uV2l0aFNvdXJjZSB9IGZyb20gJy4uLy4uL2NvbW1hbmRzLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdHJ1bmNhdGUgfSBmcm9tICcuLi8uLi91dGlscy9mb3JtYXQuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgdXNlVGFiSGVhZGVyRm9jdXMgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL1RhYnMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGNvbW1hbmRzOiBDb21tYW5kW11cbiAgbWF4SGVpZ2h0OiBudW1iZXJcbiAgY29sdW1uczogbnVtYmVyXG4gIHRpdGxlOiBzdHJpbmdcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbiAgZW1wdHlNZXNzYWdlPzogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDb21tYW5kcyh7XG4gIGNvbW1hbmRzLFxuICBtYXhIZWlnaHQsXG4gIGNvbHVtbnMsXG4gIHRpdGxlLFxuICBvbkNhbmNlbCxcbiAgZW1wdHlNZXNzYWdlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IGhlYWRlckZvY3VzZWQsIGZvY3VzSGVhZGVyIH0gPSB1c2VUYWJIZWFkZXJGb2N1cygpXG4gIGNvbnN0IG1heFdpZHRoID0gTWF0aC5tYXgoMSwgY29sdW1ucyAtIDEwKVxuICBjb25zdCB2aXNpYmxlQ291bnQgPSBNYXRoLm1heCgxLCBNYXRoLmZsb29yKChtYXhIZWlnaHQgLSAxMCkgLyAyKSlcblxuICBjb25zdCBvcHRpb25zID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gQ3VzdG9tIGNvbW1hbmRzIGNhbiBhcHBlYXIgbW9yZSB0aGFuIG9uY2UgKGUuZy4gc2FtZSBuYW1lIGF0IHVzZXIgYW5kXG4gICAgLy8gcHJvamVjdCBzY29wZSkuIERlZHVwZSBieSBuYW1lIHRvIGF2b2lkIFJlYWN0IGtleSBjb2xsaXNpb25zIGluIFNlbGVjdC5cbiAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KClcbiAgICByZXR1cm4gY29tbWFuZHNcbiAgICAgIC5maWx0ZXIoY21kID0+IHtcbiAgICAgICAgaWYgKHNlZW4uaGFzKGNtZC5uYW1lKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIHNlZW4uYWRkKGNtZC5uYW1lKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpKVxuICAgICAgLm1hcChjbWQgPT4gKHtcbiAgICAgICAgbGFiZWw6IGAvJHtjbWQubmFtZX1gLFxuICAgICAgICB2YWx1ZTogY21kLm5hbWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiB0cnVuY2F0ZShmb3JtYXREZXNjcmlwdGlvbldpdGhTb3VyY2UoY21kKSwgbWF4V2lkdGgsIHRydWUpLFxuICAgICAgfSkpXG4gIH0sIFtjb21tYW5kcywgbWF4V2lkdGhdKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgcGFkZGluZ1k9ezF9PlxuICAgICAge2NvbW1hbmRzLmxlbmd0aCA9PT0gMCAmJiBlbXB0eU1lc3NhZ2UgPyAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPntlbXB0eU1lc3NhZ2V9PC9UZXh0PlxuICAgICAgKSA6IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8VGV4dD57dGl0bGV9PC9UZXh0PlxuICAgICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICAgIDxTZWxlY3RcbiAgICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgICAgdmlzaWJsZU9wdGlvbkNvdW50PXt2aXNpYmxlQ291bnR9XG4gICAgICAgICAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbH1cbiAgICAgICAgICAgICAgZGlzYWJsZVNlbGVjdGlvblxuICAgICAgICAgICAgICBoaWRlSW5kZXhlc1xuICAgICAgICAgICAgICBsYXlvdXQ9XCJjb21wYWN0LXZlcnRpY2FsXCJcbiAgICAgICAgICAgICAgb25VcEZyb21GaXJzdEl0ZW09e2ZvY3VzSGVhZGVyfVxuICAgICAgICAgICAgICBpc0Rpc2FibGVkPXtoZWFkZXJGb2N1c2VkfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLE9BQU8sUUFBUSxPQUFPO0FBQy9C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
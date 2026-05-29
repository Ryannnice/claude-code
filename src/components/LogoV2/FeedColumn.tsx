// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../ink.js';
// 引入 Divider，将 ../design-system/Divider.js 中已经封装好的能力接到本文件流程里。
import { Divider } from '../design-system/Divider.js';
// 类型依赖 { FeedConfig } 来自 ./Feed.js，用于校准终端渲染的数据契约。
import type { FeedConfig } from './Feed.js';
// 引入 calculateFeedWidth、Feed，将 ./Feed.js 中已经封装好的能力接到本文件流程里。
import { calculateFeedWidth, Feed } from './Feed.js';
// FeedColumnProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FeedColumnProps = {
  feeds: FeedConfig[];
  maxWidth: number;
};
// FeedColumn 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FeedColumn(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    feeds,
    maxWidth
  } = t0;
  // t1 暂存 `Math.max(...feedWidths)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== feeds) {
    // feedWidths 集合派生`feeds.map`，供终端渲染后续处理使用。
    const feedWidths = feeds.map(_temp);
    // t1 暂存 `Math.max(...feedWidths)` 生成的渲染片段，后续返回路径直接复用。
    t1 = Math.max(...feedWidths);
    // $[0] 缓存 `feeds`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = feeds;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // maxOfAllFeeds 集合保存`t1`，作为后续临时缓存值处理的输入。
  const maxOfAllFeeds = t1;
  // actualWidth保存`Math.min`，供终端渲染后续处理使用。
  const actualWidth = Math.min(maxOfAllFeeds, maxWidth);
  // t2 暂存 `feeds.map(t3)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== actualWidth || $[3] !== feeds) {
    // t3 暂存 `(feed_0, index) => <React.Fragment key={index}><Feed conf...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== actualWidth || $[6] !== feeds.length) {
      // t3 暂存 `(feed_0, index) => <React.Fragment key={index}><Feed conf...` 生成的渲染片段，后续返回路径直接复用。
      t3 = (feed_0, index) => <React.Fragment key={index}><Feed config={feed_0} actualWidth={actualWidth} />{index < feeds.length - 1 && <Divider color="claude" width={actualWidth} />}</React.Fragment>;
      // $[5] 缓存 `actualWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = actualWidth;
      // $[6] 缓存 `feeds.length`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = feeds.length;
      // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[7];
    }
    // t2 暂存 `feeds.map(t3)` 生成的渲染片段，后续返回路径直接复用。
    t2 = feeds.map(t3);
    // $[2] 缓存 `actualWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = actualWidth;
    // $[3] 缓存 `feeds`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = feeds;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Box flexDirection="column">{t2}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t2) {
    // t3 暂存 `<Box flexDirection="column">{t2}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column">{t2}</Box>;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(feed) {
  // 返回 `calculateFeedWidth(feed)`，作为终端渲染这次计算的结果。
  return calculateFeedWidth(feed);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIkRpdmlkZXIiLCJGZWVkQ29uZmlnIiwiY2FsY3VsYXRlRmVlZFdpZHRoIiwiRmVlZCIsIkZlZWRDb2x1bW5Qcm9wcyIsImZlZWRzIiwibWF4V2lkdGgiLCJGZWVkQ29sdW1uIiwidDAiLCIkIiwiX2MiLCJ0MSIsImZlZWRXaWR0aHMiLCJtYXAiLCJfdGVtcCIsIk1hdGgiLCJtYXgiLCJtYXhPZkFsbEZlZWRzIiwiYWN0dWFsV2lkdGgiLCJtaW4iLCJ0MiIsInQzIiwibGVuZ3RoIiwiZmVlZF8wIiwiaW5kZXgiLCJmZWVkIl0sInNvdXJjZXMiOlsiRmVlZENvbHVtbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3ggfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBEaXZpZGVyIH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9EaXZpZGVyLmpzJ1xuaW1wb3J0IHR5cGUgeyBGZWVkQ29uZmlnIH0gZnJvbSAnLi9GZWVkLmpzJ1xuaW1wb3J0IHsgY2FsY3VsYXRlRmVlZFdpZHRoLCBGZWVkIH0gZnJvbSAnLi9GZWVkLmpzJ1xuXG50eXBlIEZlZWRDb2x1bW5Qcm9wcyA9IHtcbiAgZmVlZHM6IEZlZWRDb25maWdbXVxuICBtYXhXaWR0aDogbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBGZWVkQ29sdW1uKHtcbiAgZmVlZHMsXG4gIG1heFdpZHRoLFxufTogRmVlZENvbHVtblByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgZmVlZFdpZHRocyA9IGZlZWRzLm1hcChmZWVkID0+IGNhbGN1bGF0ZUZlZWRXaWR0aChmZWVkKSlcbiAgY29uc3QgbWF4T2ZBbGxGZWVkcyA9IE1hdGgubWF4KC4uLmZlZWRXaWR0aHMpXG4gIGNvbnN0IGFjdHVhbFdpZHRoID0gTWF0aC5taW4obWF4T2ZBbGxGZWVkcywgbWF4V2lkdGgpXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIHtmZWVkcy5tYXAoKGZlZWQsIGluZGV4KSA9PiAoXG4gICAgICAgIDxSZWFjdC5GcmFnbWVudCBrZXk9e2luZGV4fT5cbiAgICAgICAgICA8RmVlZCBjb25maWc9e2ZlZWR9IGFjdHVhbFdpZHRoPXthY3R1YWxXaWR0aH0gLz5cbiAgICAgICAgICB7aW5kZXggPCBmZWVkcy5sZW5ndGggLSAxICYmIChcbiAgICAgICAgICAgIDxEaXZpZGVyIGNvbG9yPVwiY2xhdWRlXCIgd2lkdGg9e2FjdHVhbFdpZHRofSAvPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvUmVhY3QuRnJhZ21lbnQ+XG4gICAgICApKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLFFBQVEsY0FBYztBQUNsQyxTQUFTQyxPQUFPLFFBQVEsNkJBQTZCO0FBQ3JELGNBQWNDLFVBQVUsUUFBUSxXQUFXO0FBQzNDLFNBQVNDLGtCQUFrQixFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUVwRCxLQUFLQyxlQUFlLEdBQUc7RUFDckJDLEtBQUssRUFBRUosVUFBVSxFQUFFO0VBQ25CSyxRQUFRLEVBQUUsTUFBTTtBQUNsQixDQUFDO0FBRUQsT0FBTyxTQUFBQyxXQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQW9CO0lBQUFMLEtBQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUdUO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUosS0FBQTtJQUNoQixNQUFBTyxVQUFBLEdBQW1CUCxLQUFLLENBQUFRLEdBQUksQ0FBQ0MsS0FBZ0MsQ0FBQztJQUN4Q0gsRUFBQSxHQUFBSSxJQUFJLENBQUFDLEdBQUksSUFBSUosVUFBVSxDQUFDO0lBQUFILENBQUEsTUFBQUosS0FBQTtJQUFBSSxDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQUE3QyxNQUFBUSxhQUFBLEdBQXNCTixFQUF1QjtFQUM3QyxNQUFBTyxXQUFBLEdBQW9CSCxJQUFJLENBQUFJLEdBQUksQ0FBQ0YsYUFBYSxFQUFFWCxRQUFRLENBQUM7RUFBQSxJQUFBYyxFQUFBO0VBQUEsSUFBQVgsQ0FBQSxRQUFBUyxXQUFBLElBQUFULENBQUEsUUFBQUosS0FBQTtJQUFBLElBQUFnQixFQUFBO0lBQUEsSUFBQVosQ0FBQSxRQUFBUyxXQUFBLElBQUFULENBQUEsUUFBQUosS0FBQSxDQUFBaUIsTUFBQTtNQUl0Q0QsRUFBQSxHQUFBQSxDQUFBRSxNQUFBLEVBQUFDLEtBQUEsS0FDVCxnQkFBcUJBLEdBQUssQ0FBTEEsTUFBSSxDQUFDLENBQ3hCLENBQUMsSUFBSSxDQUFTQyxNQUFJLENBQUpBLE9BQUcsQ0FBQyxDQUFlUCxXQUFXLENBQVhBLFlBQVUsQ0FBQyxHQUMzQyxDQUFBTSxLQUFLLEdBQUduQixLQUFLLENBQUFpQixNQUFPLEdBQUcsQ0FFdkIsSUFEQyxDQUFDLE9BQU8sQ0FBTyxLQUFRLENBQVIsUUFBUSxDQUFRSixLQUFXLENBQVhBLFlBQVUsQ0FBQyxHQUM1QyxDQUNGLGlCQUNEO01BQUFULENBQUEsTUFBQVMsV0FBQTtNQUFBVCxDQUFBLE1BQUFKLEtBQUEsQ0FBQWlCLE1BQUE7TUFBQWIsQ0FBQSxNQUFBWSxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBWixDQUFBO0lBQUE7SUFQQVcsRUFBQSxHQUFBZixLQUFLLENBQUFRLEdBQUksQ0FBQ1EsRUFPVixDQUFDO0lBQUFaLENBQUEsTUFBQVMsV0FBQTtJQUFBVCxDQUFBLE1BQUFKLEtBQUE7SUFBQUksQ0FBQSxNQUFBVyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWCxDQUFBO0VBQUE7RUFBQSxJQUFBWSxFQUFBO0VBQUEsSUFBQVosQ0FBQSxRQUFBVyxFQUFBO0lBUkpDLEVBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDeEIsQ0FBQUQsRUFPQSxDQUNILEVBVEMsR0FBRyxDQVNFO0lBQUFYLENBQUEsTUFBQVcsRUFBQTtJQUFBWCxDQUFBLE1BQUFZLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFaLENBQUE7RUFBQTtFQUFBLE9BVE5ZLEVBU007QUFBQTtBQWxCSCxTQUFBUCxNQUFBVyxJQUFBO0VBQUEsT0FJZ0N2QixrQkFBa0IsQ0FBQ3VCLElBQUksQ0FBQztBQUFBIiwiaWdub3JlTGlzdCI6W119
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os';
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js';
// getRelativeMemoryPath 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRelativeMemoryPath(path: string): string {
  // homeDir保存`homedir`，供终端渲染后续处理使用。
  const homeDir = homedir();
  // cwd读取`getCwd`，供终端渲染后续处理使用。
  const cwd = getCwd();

  // Calculate relative paths
  // relativeToHome保存`path.startsWith`，供终端渲染后续处理使用。
  const relativeToHome = path.startsWith(homeDir) ? '~' + path.slice(homeDir.length) : null;
  // relativeToCwd保存`path.startsWith`，供终端渲染后续处理使用。
  const relativeToCwd = path.startsWith(cwd) ? './' + relative(cwd, path) : null;

  // Return the shorter path, or absolute if neither is applicable
  // 只有 `relativeToHome && relativeToCwd` 满足时，终端渲染才执行该分支。
  if (relativeToHome && relativeToCwd) {
    // 返回 `relativeToHome.length <= relativeToCwd.length ? relativeToHome : relati...`，作为终端渲染这次计算的结果。
    return relativeToHome.length <= relativeToCwd.length ? relativeToHome : relativeToCwd;
  }
  // 返回 `relativeToHome || relativeToCwd || path`，作为终端渲染这次计算的结果。
  return relativeToHome || relativeToCwd || path;
}
// MemoryUpdateNotification 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MemoryUpdateNotification(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    memoryPath
  } = t0;
  // t1 暂存 `getRelativeMemoryPath(memoryPath)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== memoryPath) {
    // t1 暂存 `getRelativeMemoryPath(memoryPath)` 生成的渲染片段，后续返回路径直接复用。
    t1 = getRelativeMemoryPath(memoryPath);
    // $[0] 缓存 `memoryPath`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = memoryPath;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // displayPath 路径数据保存`t1`，作为后续临时缓存值处理的输入。
  const displayPath = t1;
  // t2 暂存 `<Box flexDirection="column" flexGrow={1}><Text color="tex...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== displayPath) {
    // t2 暂存 `<Box flexDirection="column" flexGrow={1}><Text color="tex...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexDirection="column" flexGrow={1}><Text color="text">Memory updated in {displayPath} · /memory to edit</Text></Box>;
    // $[2] 缓存 `displayPath`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = displayPath;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJob21lZGlyIiwicmVsYXRpdmUiLCJSZWFjdCIsIkJveCIsIlRleHQiLCJnZXRDd2QiLCJnZXRSZWxhdGl2ZU1lbW9yeVBhdGgiLCJwYXRoIiwiaG9tZURpciIsImN3ZCIsInJlbGF0aXZlVG9Ib21lIiwic3RhcnRzV2l0aCIsInNsaWNlIiwibGVuZ3RoIiwicmVsYXRpdmVUb0N3ZCIsIk1lbW9yeVVwZGF0ZU5vdGlmaWNhdGlvbiIsInQwIiwiJCIsIl9jIiwibWVtb3J5UGF0aCIsInQxIiwiZGlzcGxheVBhdGgiLCJ0MiJdLCJzb3VyY2VzIjpbIk1lbW9yeVVwZGF0ZU5vdGlmaWNhdGlvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gJ29zJ1xuaW1wb3J0IHsgcmVsYXRpdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0Q3dkIH0gZnJvbSAnLi4vLi4vdXRpbHMvY3dkLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVsYXRpdmVNZW1vcnlQYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGhvbWVEaXIgPSBob21lZGlyKClcbiAgY29uc3QgY3dkID0gZ2V0Q3dkKClcblxuICAvLyBDYWxjdWxhdGUgcmVsYXRpdmUgcGF0aHNcbiAgY29uc3QgcmVsYXRpdmVUb0hvbWUgPSBwYXRoLnN0YXJ0c1dpdGgoaG9tZURpcilcbiAgICA/ICd+JyArIHBhdGguc2xpY2UoaG9tZURpci5sZW5ndGgpXG4gICAgOiBudWxsXG5cbiAgY29uc3QgcmVsYXRpdmVUb0N3ZCA9IHBhdGguc3RhcnRzV2l0aChjd2QpID8gJy4vJyArIHJlbGF0aXZlKGN3ZCwgcGF0aCkgOiBudWxsXG5cbiAgLy8gUmV0dXJuIHRoZSBzaG9ydGVyIHBhdGgsIG9yIGFic29sdXRlIGlmIG5laXRoZXIgaXMgYXBwbGljYWJsZVxuICBpZiAocmVsYXRpdmVUb0hvbWUgJiYgcmVsYXRpdmVUb0N3ZCkge1xuICAgIHJldHVybiByZWxhdGl2ZVRvSG9tZS5sZW5ndGggPD0gcmVsYXRpdmVUb0N3ZC5sZW5ndGhcbiAgICAgID8gcmVsYXRpdmVUb0hvbWVcbiAgICAgIDogcmVsYXRpdmVUb0N3ZFxuICB9XG5cbiAgcmV0dXJuIHJlbGF0aXZlVG9Ib21lIHx8IHJlbGF0aXZlVG9Dd2QgfHwgcGF0aFxufVxuXG5leHBvcnQgZnVuY3Rpb24gTWVtb3J5VXBkYXRlTm90aWZpY2F0aW9uKHtcbiAgbWVtb3J5UGF0aCxcbn06IHtcbiAgbWVtb3J5UGF0aDogc3RyaW5nXG59KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgZGlzcGxheVBhdGggPSBnZXRSZWxhdGl2ZU1lbW9yeVBhdGgobWVtb3J5UGF0aClcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGZsZXhHcm93PXsxfT5cbiAgICAgIDxUZXh0IGNvbG9yPVwidGV4dFwiPlxuICAgICAgICBNZW1vcnkgdXBkYXRlZCBpbiB7ZGlzcGxheVBhdGh9IMK3IC9tZW1vcnkgdG8gZWRpdFxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxPQUFPLFFBQVEsSUFBSTtBQUM1QixTQUFTQyxRQUFRLFFBQVEsTUFBTTtBQUMvQixPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLE1BQU0sUUFBUSxvQkFBb0I7QUFFM0MsT0FBTyxTQUFTQyxxQkFBcUJBLENBQUNDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUM7RUFDMUQsTUFBTUMsT0FBTyxHQUFHUixPQUFPLENBQUMsQ0FBQztFQUN6QixNQUFNUyxHQUFHLEdBQUdKLE1BQU0sQ0FBQyxDQUFDOztFQUVwQjtFQUNBLE1BQU1LLGNBQWMsR0FBR0gsSUFBSSxDQUFDSSxVQUFVLENBQUNILE9BQU8sQ0FBQyxHQUMzQyxHQUFHLEdBQUdELElBQUksQ0FBQ0ssS0FBSyxDQUFDSixPQUFPLENBQUNLLE1BQU0sQ0FBQyxHQUNoQyxJQUFJO0VBRVIsTUFBTUMsYUFBYSxHQUFHUCxJQUFJLENBQUNJLFVBQVUsQ0FBQ0YsR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHUixRQUFRLENBQUNRLEdBQUcsRUFBRUYsSUFBSSxDQUFDLEdBQUcsSUFBSTs7RUFFOUU7RUFDQSxJQUFJRyxjQUFjLElBQUlJLGFBQWEsRUFBRTtJQUNuQyxPQUFPSixjQUFjLENBQUNHLE1BQU0sSUFBSUMsYUFBYSxDQUFDRCxNQUFNLEdBQ2hESCxjQUFjLEdBQ2RJLGFBQWE7RUFDbkI7RUFFQSxPQUFPSixjQUFjLElBQUlJLGFBQWEsSUFBSVAsSUFBSTtBQUNoRDtBQUVBLE9BQU8sU0FBQVEseUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBa0M7SUFBQUM7RUFBQSxJQUFBSCxFQUl4QztFQUFBLElBQUFJLEVBQUE7RUFBQSxJQUFBSCxDQUFBLFFBQUFFLFVBQUE7SUFDcUJDLEVBQUEsR0FBQWQscUJBQXFCLENBQUNhLFVBQVUsQ0FBQztJQUFBRixDQUFBLE1BQUFFLFVBQUE7SUFBQUYsQ0FBQSxNQUFBRyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSCxDQUFBO0VBQUE7RUFBckQsTUFBQUksV0FBQSxHQUFvQkQsRUFBaUM7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBSSxXQUFBO0lBR25EQyxFQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQVcsUUFBQyxDQUFELEdBQUMsQ0FDckMsQ0FBQyxJQUFJLENBQU8sS0FBTSxDQUFOLE1BQU0sQ0FBQyxrQkFDRUQsWUFBVSxDQUFFLGtCQUNqQyxFQUZDLElBQUksQ0FHUCxFQUpDLEdBQUcsQ0FJRTtJQUFBSixDQUFBLE1BQUFJLFdBQUE7SUFBQUosQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFBQSxPQUpOSyxFQUlNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
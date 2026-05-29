// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 接入 BashToolResultMessage 工具实现，后续工具池会按权限和开关决定是否暴露。
import BashToolResultMessage from '../../tools/BashTool/BashToolResultMessage.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';
// UserBashOutputMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserBashOutputMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    content,
    verbose
  } = t0;
  // t1 暂存 `extractTag(rawStdout, "persisted-output") ?? rawStdout` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== content) {
    // rawStdout保存`extractTag`，供终端渲染后续处理使用。
    const rawStdout = extractTag(content, "bash-stdout") ?? "";
    // t1 暂存 `extractTag(rawStdout, "persisted-output") ?? rawStdout` 生成的渲染片段，后续返回路径直接复用。
    t1 = extractTag(rawStdout, "persisted-output") ?? rawStdout;
    // $[0] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = content;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // stdout沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const stdout = t1;
  // t2 暂存 `extractTag(content, "bash-stderr") ?? ""` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== content) {
    // t2 暂存 `extractTag(content, "bash-stderr") ?? ""` 生成的渲染片段，后续返回路径直接复用。
    t2 = extractTag(content, "bash-stderr") ?? "";
    // $[2] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = content;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // stderr 命名 `t2`，让后续代码直接表达这个值的用途。
  const stderr = t2;
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== stderr || $[5] !== stdout) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      stdout,
      stderr
    };
    // $[4] 缓存 `stderr`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = stderr;
    // $[5] 缓存 `stdout`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = stdout;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4标记终端 UI User Bash Output Mes...是否启用对应路径。
  const t4 = !!verbose;
  // t5 暂存 `<BashToolResultMessage content={t3} verbose={t4} />` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t3 || $[8] !== t4) {
    // t5 暂存 `<BashToolResultMessage content={t3} verbose={t4} />` 生成的渲染片段，后续返回路径直接复用。
    t5 = <BashToolResultMessage content={t3} verbose={t4} />;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJhc2hUb29sUmVzdWx0TWVzc2FnZSIsImV4dHJhY3RUYWciLCJVc2VyQmFzaE91dHB1dE1lc3NhZ2UiLCJ0MCIsIiQiLCJfYyIsImNvbnRlbnQiLCJ2ZXJib3NlIiwidDEiLCJyYXdTdGRvdXQiLCJzdGRvdXQiLCJ0MiIsInN0ZGVyciIsInQzIiwidDQiLCJ0NSJdLCJzb3VyY2VzIjpbIlVzZXJCYXNoT3V0cHV0TWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgQmFzaFRvb2xSZXN1bHRNZXNzYWdlIGZyb20gJy4uLy4uL3Rvb2xzL0Jhc2hUb29sL0Jhc2hUb29sUmVzdWx0TWVzc2FnZS5qcydcbmltcG9ydCB7IGV4dHJhY3RUYWcgfSBmcm9tICcuLi8uLi91dGlscy9tZXNzYWdlcy5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIFVzZXJCYXNoT3V0cHV0TWVzc2FnZSh7XG4gIGNvbnRlbnQsXG4gIHZlcmJvc2UsXG59OiB7XG4gIGNvbnRlbnQ6IHN0cmluZ1xuICB2ZXJib3NlPzogYm9vbGVhblxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHJhd1N0ZG91dCA9IGV4dHJhY3RUYWcoY29udGVudCwgJ2Jhc2gtc3Rkb3V0JykgPz8gJydcbiAgLy8gVW53cmFwIDxwZXJzaXN0ZWQtb3V0cHV0PiBpZiBwcmVzZW50IOKAlCBrZWVwIHRoZSBpbm5lciBjb250ZW50IChmaWxlIHBhdGggK1xuICAvLyBwcmV2aWV3KSBmb3IgdGhlIHVzZXI7IHRoZSB3cmFwcGVyIHRhZyBpdHNlbGYgaXMgbW9kZWwtZmFjaW5nIHNpZ25hbGluZy5cbiAgY29uc3Qgc3Rkb3V0ID0gZXh0cmFjdFRhZyhyYXdTdGRvdXQsICdwZXJzaXN0ZWQtb3V0cHV0JykgPz8gcmF3U3Rkb3V0XG4gIGNvbnN0IHN0ZGVyciA9IGV4dHJhY3RUYWcoY29udGVudCwgJ2Jhc2gtc3RkZXJyJykgPz8gJydcbiAgcmV0dXJuIChcbiAgICA8QmFzaFRvb2xSZXN1bHRNZXNzYWdlIGNvbnRlbnQ9e3sgc3Rkb3V0LCBzdGRlcnIgfX0gdmVyYm9zZT17ISF2ZXJib3NlfSAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLE9BQU9DLHFCQUFxQixNQUFNLCtDQUErQztBQUNqRixTQUFTQyxVQUFVLFFBQVEseUJBQXlCO0FBRXBELE9BQU8sU0FBQUMsc0JBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBK0I7SUFBQUMsT0FBQTtJQUFBQztFQUFBLElBQUFKLEVBTXJDO0VBQUEsSUFBQUssRUFBQTtFQUFBLElBQUFKLENBQUEsUUFBQUUsT0FBQTtJQUNDLE1BQUFHLFNBQUEsR0FBa0JSLFVBQVUsQ0FBQ0ssT0FBTyxFQUFFLGFBQW1CLENBQUMsSUFBeEMsRUFBd0M7SUFHM0NFLEVBQUEsR0FBQVAsVUFBVSxDQUFDUSxTQUFTLEVBQUUsa0JBQStCLENBQUMsSUFBdERBLFNBQXNEO0lBQUFMLENBQUEsTUFBQUUsT0FBQTtJQUFBRixDQUFBLE1BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUFyRSxNQUFBTSxNQUFBLEdBQWVGLEVBQXNEO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQUUsT0FBQTtJQUN0REssRUFBQSxHQUFBVixVQUFVLENBQUNLLE9BQU8sRUFBRSxhQUFtQixDQUFDLElBQXhDLEVBQXdDO0lBQUFGLENBQUEsTUFBQUUsT0FBQTtJQUFBRixDQUFBLE1BQUFPLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFQLENBQUE7RUFBQTtFQUF2RCxNQUFBUSxNQUFBLEdBQWVELEVBQXdDO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFULENBQUEsUUFBQVEsTUFBQSxJQUFBUixDQUFBLFFBQUFNLE1BQUE7SUFFckJHLEVBQUE7TUFBQUgsTUFBQTtNQUFBRTtJQUFpQixDQUFDO0lBQUFSLENBQUEsTUFBQVEsTUFBQTtJQUFBUixDQUFBLE1BQUFNLE1BQUE7SUFBQU4sQ0FBQSxNQUFBUyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBVCxDQUFBO0VBQUE7RUFBVyxNQUFBVSxFQUFBLElBQUMsQ0FBQ1AsT0FBTztFQUFBLElBQUFRLEVBQUE7RUFBQSxJQUFBWCxDQUFBLFFBQUFTLEVBQUEsSUFBQVQsQ0FBQSxRQUFBVSxFQUFBO0lBQXRFQyxFQUFBLElBQUMscUJBQXFCLENBQVUsT0FBa0IsQ0FBbEIsQ0FBQUYsRUFBaUIsQ0FBQyxDQUFXLE9BQVMsQ0FBVCxDQUFBQyxFQUFRLENBQUMsR0FBSTtJQUFBVixDQUFBLE1BQUFTLEVBQUE7SUFBQVQsQ0FBQSxNQUFBVSxFQUFBO0lBQUFWLENBQUEsTUFBQVcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVgsQ0FBQTtFQUFBO0VBQUEsT0FBMUVXLEVBQTBFO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
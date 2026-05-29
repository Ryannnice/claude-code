// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 Spinner，将 ../Spinner.js 中已经封装好的能力接到本文件流程里。
import { Spinner } from '../Spinner.js';
// LoadingStateProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type LoadingStateProps = {
  /**
   * The loading message to display next to the spinner.
   */
  message: string;

  /**
   * Display the message in bold.
   * @default false
   */
  bold?: boolean;

  /**
   * Display the message in dimmed color.
   * @default false
   */
  dimColor?: boolean;

  /**
   * Optional subtitle displayed below the main message.
   */
  subtitle?: string;
};

/**
 * A spinner with loading message for async operations.
 *
 * @example
 * // Basic loading
 * <LoadingState message="Loading..." />
 *
 * @example
 * // Bold loading message
 * <LoadingState message="Loading sessions" bold />
 *
 * @example
 * // With subtitle
 * <LoadingState
 *   message="Loading sessions"
 *   bold
 *   subtitle="Fetching your Claude Code sessions..."
 * />
 */
// LoadingState 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function LoadingState(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    message,
    bold: t1,
    dimColor: t2,
    subtitle
  } = t0;
  // bold标记终端 UI Loading State是否启用对应路径。
  const bold = t1 === undefined ? false : t1;
  // dimColor标记终端 UI Loading State是否启用对应路径。
  const dimColor = t2 === undefined ? false : t2;
  // t3 暂存 `<Spinner />` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Spinner />` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Spinner />;
    // $[0] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[0];
  }
  // t4 暂存 `<Box flexDirection="row">{t3}<Text bold={bold} dimColor={...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== bold || $[2] !== dimColor || $[3] !== message) {
    // t4 暂存 `<Box flexDirection="row">{t3}<Text bold={bold} dimColor={...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="row">{t3}<Text bold={bold} dimColor={dimColor}>{" "}{message}</Text></Box>;
    // $[1] 缓存 `bold`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = bold;
    // $[2] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = dimColor;
    // $[3] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = message;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `subtitle && <Text dimColor={true}>{subtitle}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== subtitle) {
    // t5 暂存 `subtitle && <Text dimColor={true}>{subtitle}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = subtitle && <Text dimColor={true}>{subtitle}</Text>;
    // $[5] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = subtitle;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // t6 暂存 `<Box flexDirection="column">{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t4 || $[8] !== t5) {
    // t6 暂存 `<Box flexDirection="column">{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column">{t4}{t5}</Box>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJTcGlubmVyIiwiTG9hZGluZ1N0YXRlUHJvcHMiLCJtZXNzYWdlIiwiYm9sZCIsImRpbUNvbG9yIiwic3VidGl0bGUiLCJMb2FkaW5nU3RhdGUiLCJ0MCIsIiQiLCJfYyIsInQxIiwidDIiLCJ1bmRlZmluZWQiLCJ0MyIsIlN5bWJvbCIsImZvciIsInQ0IiwidDUiLCJ0NiJdLCJzb3VyY2VzIjpbIkxvYWRpbmdTdGF0ZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gJy4uL1NwaW5uZXIuanMnXG5cbnR5cGUgTG9hZGluZ1N0YXRlUHJvcHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgbG9hZGluZyBtZXNzYWdlIHRvIGRpc3BsYXkgbmV4dCB0byB0aGUgc3Bpbm5lci5cbiAgICovXG4gIG1lc3NhZ2U6IHN0cmluZ1xuXG4gIC8qKlxuICAgKiBEaXNwbGF5IHRoZSBtZXNzYWdlIGluIGJvbGQuXG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICBib2xkPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBEaXNwbGF5IHRoZSBtZXNzYWdlIGluIGRpbW1lZCBjb2xvci5cbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIGRpbUNvbG9yPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBPcHRpb25hbCBzdWJ0aXRsZSBkaXNwbGF5ZWQgYmVsb3cgdGhlIG1haW4gbWVzc2FnZS5cbiAgICovXG4gIHN1YnRpdGxlPzogc3RyaW5nXG59XG5cbi8qKlxuICogQSBzcGlubmVyIHdpdGggbG9hZGluZyBtZXNzYWdlIGZvciBhc3luYyBvcGVyYXRpb25zLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBCYXNpYyBsb2FkaW5nXG4gKiA8TG9hZGluZ1N0YXRlIG1lc3NhZ2U9XCJMb2FkaW5nLi4uXCIgLz5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQm9sZCBsb2FkaW5nIG1lc3NhZ2VcbiAqIDxMb2FkaW5nU3RhdGUgbWVzc2FnZT1cIkxvYWRpbmcgc2Vzc2lvbnNcIiBib2xkIC8+XG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIFdpdGggc3VidGl0bGVcbiAqIDxMb2FkaW5nU3RhdGVcbiAqICAgbWVzc2FnZT1cIkxvYWRpbmcgc2Vzc2lvbnNcIlxuICogICBib2xkXG4gKiAgIHN1YnRpdGxlPVwiRmV0Y2hpbmcgeW91ciBDbGF1ZGUgQ29kZSBzZXNzaW9ucy4uLlwiXG4gKiAvPlxuICovXG5leHBvcnQgZnVuY3Rpb24gTG9hZGluZ1N0YXRlKHtcbiAgbWVzc2FnZSxcbiAgYm9sZCA9IGZhbHNlLFxuICBkaW1Db2xvciA9IGZhbHNlLFxuICBzdWJ0aXRsZSxcbn06IExvYWRpbmdTdGF0ZVByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICA8U3Bpbm5lciAvPlxuICAgICAgICA8VGV4dCBib2xkPXtib2xkfSBkaW1Db2xvcj17ZGltQ29sb3J9PlxuICAgICAgICAgIHsnICd9XG4gICAgICAgICAge21lc3NhZ2V9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAge3N1YnRpdGxlICYmIDxUZXh0IGRpbUNvbG9yPntzdWJ0aXRsZX08L1RleHQ+fVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLE9BQU8sUUFBUSxlQUFlO0FBRXZDLEtBQUtDLGlCQUFpQixHQUFHO0VBQ3ZCO0FBQ0Y7QUFDQTtFQUNFQyxPQUFPLEVBQUUsTUFBTTs7RUFFZjtBQUNGO0FB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
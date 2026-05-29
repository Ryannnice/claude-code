// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useLayoutEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useLayoutEffect } from 'react';
// 引入 PassThrough，将 stream 中已经封装好的能力接到本文件流程里。
import { PassThrough } from 'stream';
// 引入 stripAnsi，将 strip-ansi 中已经封装好的能力接到本文件流程里。
import stripAnsi from 'strip-ansi';
// 引入 render、useApp，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { render, useApp } from '../ink.js';

// This is a workaround for the fact that Ink doesn't support multiple <Static>
// components in the same render tree. Instead of using a <Static> we just render
// the component to a string and then print it to stdout

/**
 * Wrapper component that exits after rendering.
 * Uses useLayoutEffect to ensure we wait for React's commit phase to complete
 * before exiting. This is more robust than process.nextTick() for React 19's
 * async render cycle.
 */
// RenderOnceAndExit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function RenderOnceAndExit(t0) {
  // $保存`_c`，供共享工具后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    exit
  } = useApp();
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[exit]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== exit) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // timer保存`setTimeout`，供共享工具后续处理使用。
      const timer = setTimeout(exit, 0);
      // 返回 `() => clearTimeout(timer)`，作为共享工具这次计算的结果。
      return () => clearTimeout(timer);
    };
    // t2 暂存 `[exit]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [exit];
    // $[0] 缓存 `exit`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = exit;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useLayoutEffect，触发共享工具此处需要的副作用。
  useLayoutEffect(t1, t2);
  // t3 暂存 `<>{children}</>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== children) {
    // t3 暂存 `<>{children}</>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <>{children}</>;
    // $[3] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = children;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 返回 `t3`，作为共享工具这次计算的结果。
  return t3;
}

// DEC synchronized update markers used by terminals
// SYNC_START 命名 `'\x1B[?2026h'`，让后续代码直接表达这个值的用途。
const SYNC_START = '\x1B[?2026h';
// SYNC_END固定为 `'\x1B[?2026l'`，作为共享工具 static Render后续展示或比较的基准。
const SYNC_END = '\x1B[?2026l';

/**
 * Extracts content from the first complete frame in Ink's output.
 * Ink with non-TTY stdout outputs multiple frames, each wrapped in DEC synchronized
 * update sequences ([?2026h ... [?2026l). We only want the first frame's content.
 */
// extractFirstFrame 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractFirstFrame(output: string): string {
  // startIndex 索引保存`output.indexOf`，供共享工具后续处理使用。
  const startIndex = output.indexOf(SYNC_START);
  // 满足 `startIndex === -1` 时，共享工具执行该分支。
  if (startIndex === -1) return output;
  // contentStart保存 `startIndex + SYNC_START.length` 的判断结果，供共享工具 static Render后续分支直接复用。
  const contentStart = startIndex + SYNC_START.length;
  // endIndex 索引保存`output.indexOf`，供共享工具后续处理使用。
  const endIndex = output.indexOf(SYNC_END, contentStart);
  // 满足 `endIndex === -1` 时，共享工具执行该分支。
  if (endIndex === -1) return output;
  // 返回 `output.slice(contentStart, endIndex)`，作为共享工具这次计算的结果。
  return output.slice(contentStart, endIndex);
}

/**
 * Renders a React node to a string with ANSI escape codes (for terminal output).
 */
// renderToAnsiString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToAnsiString(node: React.ReactNode, columns?: number): Promise<string> {
  // 返回 `new Promise(async resolve => {`，作为共享工具这次计算的结果。
  return new Promise(async resolve => {
    // output 命名 `''`，让后续代码直接表达这个值的用途。
    let output = '';

    // Capture all writes. Set .columns so Ink (ink.tsx:~165) picks up a
    // chosen width instead of PassThrough's undefined → 80 fallback —
    // useful for rendering at terminal width for file dumps that should
    // match what the user sees on screen.
    // stream保存`PassThrough`，供共享工具后续处理使用。
    const stream = new PassThrough();
    // `columns` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (columns !== undefined) {
      // 共享工具 static Render在这里处理 ``，完成这一小步状态转换。
      ;
      // 共享工具 static Render在这里处理 `(stream as unknown as {`，完成这一小步状态转换。
      (stream as unknown as {
        columns: number;
      }).columns = columns;
    }
    // 调用 stream.on，触发共享工具此处需要的副作用。
    stream.on('data', chunk => {
      // 共享工具 static Render在这里处理 `output += chunk.toString()`，完成这一小步状态转换。
      output += chunk.toString();
    });

    // Render the component wrapped in RenderOnceAndExit
    // Non-TTY stdout (PassThrough) gives full-frame output instead of diffs
    // instance保存`render`，供共享工具后续处理使用。
    const instance = await render(<RenderOnceAndExit>{node}</RenderOnceAndExit>, {
      stdout: stream as unknown as NodeJS.WriteStream,
      patchConsole: false
    });

    // Wait for the component to exit naturally
    // 等待 `instance.waitUntilExit()` 完成，再继续共享工具 static Render的异步流程。
    await instance.waitUntilExit();

    // Extract only the first frame's content to avoid duplication
    // (Ink outputs multiple frames in non-TTY mode)
    // 等待 `resolve(extractFirstFrame(output))` 完成，再继续共享工具 static Render的异步流程。
    await resolve(extractFirstFrame(output));
  });
}

/**
 * Renders a React node to a plain text string (ANSI codes stripped).
 */
// renderToString 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function renderToString(node: React.ReactNode, columns?: number): Promise<string> {
  // output保存`renderToAnsiString`，供共享工具后续处理使用。
  const output = await renderToAnsiString(node, columns);
  // 返回 `stripAnsi(output)`，作为共享工具这次计算的结果。
  return stripAnsi(output);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUxheW91dEVmZmVjdCIsIlBhc3NUaHJvdWdoIiwic3RyaXBBbnNpIiwicmVuZGVyIiwidXNlQXBwIiwiUmVuZGVyT25jZUFuZEV4aXQiLCJ0MCIsIiQiLCJfYyIsImNoaWxkcmVuIiwiZXhpdCIsInQxIiwidDIiLCJ0aW1lciIsInNldFRpbWVvdXQiLCJjbGVhclRpbWVvdXQiLCJ0MyIsIlNZTkNfU1RBUlQiLCJTWU5DX0VORCIsImV4dHJhY3RGaXJzdEZyYW1lIiwib3V0cHV0Iiwic3RhcnRJbmRleCIsImluZGV4T2YiLCJjb250ZW50U3RhcnQiLCJsZW5ndGgiLCJlbmRJbmRleCIsInNsaWNlIiwicmVuZGVyVG9BbnNpU3RyaW5nIiwibm9kZSIsIlJlYWN0Tm9kZSIsImNvbHVtbnMiLCJQcm9taXNlIiwicmVzb2x2ZSIsInN0cmVhbSIsInVuZGVmaW5lZCIsIm9uIiwiY2h1bmsiLCJ0b1N0cmluZyIsImluc3RhbmNlIiwic3Rkb3V0IiwiTm9kZUpTIiwiV3JpdGVTdHJlYW0iLCJwYXRjaENvbnNvbGUiLCJ3YWl0VW50aWxFeGl0IiwicmVuZGVyVG9TdHJpbmciXSwic291cmNlcyI6WyJzdGF0aWNSZW5kZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlTGF5b3V0RWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBQYXNzVGhyb3VnaCB9IGZyb20gJ3N0cmVhbSdcbmltcG9ydCBzdHJpcEFuc2kgZnJvbSAnc3RyaXAtYW5zaSdcbmltcG9ydCB7IHJlbmRlciwgdXNlQXBwIH0gZnJvbSAnLi4vaW5rLmpzJ1xuXG4vLyBUaGlzIGlzIGEgd29ya2Fyb3VuZCBmb3IgdGhlIGZhY3QgdGhhdCBJbmsgZG9lc24ndCBzdXBwb3J0IG11bHRpcGxlIDxTdGF0aWM+XG4vLyBjb21wb25lbnRzIGluIHRoZSBzYW1lIHJlbmRlciB0cmVlLiBJbnN0ZWFkIG9mIHVzaW5nIGEgPFN0YXRpYz4gd2UganVzdCByZW5kZXJcbi8vIHRoZSBjb21wb25lbnQgdG8gYSBzdHJpbmcgYW5kIHRoZW4gcHJpbnQgaXQgdG8gc3Rkb3V0XG5cbi8qKlxuICogV3JhcHBlciBjb21wb25lbnQgdGhhdCBleGl0cyBhZnRlciByZW5kZXJpbmcuXG4gKiBVc2VzIHVzZUxheW91dEVmZmVjdCB0byBlbnN1cmUgd2Ugd2FpdCBmb3IgUmVhY3QncyBjb21taXQgcGhhc2UgdG8gY29tcGxldGVcbiAqIGJlZm9yZSBleGl0aW5nLiBUaGlzIGlzIG1vcmUgcm9idXN0IHRoYW4gcHJvY2Vzcy5uZXh0VGljaygpIGZvciBSZWFjdCAxOSdzXG4gKiBhc3luYyByZW5kZXIgY3ljbGUuXG4gKi9cbmZ1bmN0aW9uIFJlbmRlck9uY2VBbmRFeGl0KHtcbiAgY2hpbGRyZW4sXG59OiB7XG4gIGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGVcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IGV4aXQgfSA9IHVzZUFwcCgpXG5cbiAgLy8gdXNlTGF5b3V0RWZmZWN0IHJ1bnMgc3luY2hyb25vdXNseSBhZnRlciBSZWFjdCBjb21taXRzIERPTSBtdXRhdGlvbnMuXG4gIC8vIHNldFRpbWVvdXQoMCkgZGVmZXJzIGV4aXQgdG8gYWxsb3cgSW5rIHRvIGZsdXNoIG91dHB1dCB0byB0aGUgc3RyZWFtLlxuICB1c2VMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dChleGl0LCAwKVxuICAgIHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpXG4gIH0sIFtleGl0XSlcblxuICByZXR1cm4gPD57Y2hpbGRyZW59PC8+XG59XG5cbi8vIERFQyBzeW5jaHJvbml6ZWQgdXBkYXRlIG1hcmtlcnMgdXNlZCBieSB0ZXJtaW5hbHNcbmNvbnN0IFNZTkNfU1RBUlQgPSAnXFx4MUJbPzIwMjZoJ1xuY29uc3QgU1lOQ19FTkQgPSAnXFx4MUJbPzIwMjZsJ1xuXG4vKipcbiAqIEV4dHJhY3RzIGNvbnRlbnQgZnJvbSB0aGUgZmlyc3QgY29tcGxldGUgZnJhbWUgaW4gSW5rJ3Mgb3V0cHV0LlxuICogSW5rIHdpdGggbm9uLVRUWSBzdGRvdXQgb3V0cHV0cyBtdWx0aXBsZSBmcmFtZXMsIGVhY2ggd3JhcHBlZCBpbiBERUMgc3luY2hyb25pemVkXG4gKiB1cGRhdGUgc2VxdWVuY2VzIChbPzIwMjZoIC4uLiBbPzIwMjZsKS4gV2Ugb25seSB3YW50IHRoZSBmaXJzdCBmcmFtZSdzIGNvbnRlbnQuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RGaXJzdEZyYW1lKG91dHB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IG91dHB1dC5pbmRleE9mKFNZTkNfU1RBUlQpXG4gIGlmIChzdGFydEluZGV4ID09PSAtMSkgcmV0dXJuIG91dHB1dFxuXG4gIGNvbnN0IGNvbnRlbnRTdGFydCA9IHN0YXJ0SW5kZXggKyBTWU5DX1NUQVJULmxlbmd0aFxuICBjb25zdCBlbmRJbmRleCA9IG91dHB1dC5pbmRleE9mKFNZTkNfRU5ELCBjb250ZW50U3RhcnQpXG4gIGlmIChlbmRJbmRleCA9PT0gLTEpIHJldHVybiBvdXRwdXRcblxuICByZXR1cm4gb3V0cHV0LnNsaWNlKGNvbnRlbnRTdGFydCwgZW5kSW5kZXgpXG59XG5cbi8qKlxuICogUmVuZGVycyBhIFJlYWN0IG5vZGUgdG8gYSBzdHJpbmcgd2l0aCBBTlNJIGVzY2FwZSBjb2RlcyAoZm9yIHRlcm1pbmFsIG91dHB1dCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb0Fuc2lTdHJpbmcoXG4gIG5vZGU6IFJlYWN0LlJlYWN0Tm9kZSxcbiAgY29sdW1ucz86IG51bWJlcixcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyByZXNvbHZlID0+IHtcbiAgICBsZXQgb3V0cHV0ID0gJydcblxuICAgIC8vIENhcHR1cmUgYWxsIHdyaXRlcy4gU2V0IC5jb2x1bW5zIHNvIEluayAoaW5rLnRzeDp+MTY1KSBwaWNrcyB1cCBhXG4gICAgLy8gY2hvc2VuIHdpZHRoIGluc3RlYWQgb2YgUGFzc1Rocm91Z2gncyB1bmRlZmluZWQg4oaSIDgwIGZhbGxiYWNrIOKAlFxuICAgIC8vIHVzZWZ1bCBmb3IgcmVuZGVyaW5nIGF0IHRlcm1pbmFsIHdpZHRoIGZvciBmaWxlIGR1bXBzIHRoYXQgc2hvdWxkXG4gICAgLy8gbWF0Y2ggd2hhdCB0aGUgdXNlciBzZWVzIG9uIHNjcmVlbi5cbiAgICBjb25zdCBzdHJlYW0gPSBuZXcgUGFzc1Rocm91Z2goKVxuICAgIGlmIChjb2x1bW5zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIDsoc3RyZWFtIGFzIHVua25vd24gYXMgeyBjb2x1bW5zOiBudW1iZXIgfSkuY29sdW1ucyA9IGNvbHVtbnNcbiAgICB9XG4gICAgc3RyZWFtLm9uKCdkYXRhJywgY2h1bmsgPT4ge1xuICAgICAgb3V0cHV0ICs9IGNodW5rLnRvU3RyaW5nKClcbiAgICB9KVxuXG4gICAgLy8gUmVuZGVyIHRoZSBjb21wb25lbnQgd3JhcHBlZCBpbiBSZW5kZXJPbmNlQW5kRXhpdFxuICAgIC8vIE5vbi1UVFkgc3Rkb3V0IChQYXNzVGhyb3VnaCkgZ2l2ZXMgZnVsbC1mcmFtZSBvdXRwdXQgaW5zdGVhZCBvZiBkaWZmc1xuICAgIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgcmVuZGVyKFxuICAgICAgPFJlbmRlck9uY2VBbmRFeGl0Pntub2RlfTwvUmVuZGVyT25jZUFuZEV4aXQ+LFxuICAgICAge1xuICAgICAgICBzdGRvdXQ6IHN0cmVhbSBhcyB1bmtub3duIGFzIE5vZGVKUy5Xcml0ZVN0cmVhbSxcbiAgICAgICAgcGF0Y2hDb25zb2xlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgKVxuXG4gICAgLy8gV2FpdCBmb3IgdGhlIGNvbXBvbmVudCB0byBleGl0IG5hdHVyYWxseVxuICAgIGF3YWl0IGluc3RhbmNlLndhaXRVbnRpbEV4aXQoKVxuXG4gICAgLy8gRXh0cmFjdCBvbmx5IHRoZSBmaXJzdCBmcmFtZSdzIGNvbnRlbnQgdG8gYXZvaWQgZHVwbGljYXRpb25cbiAgICAvLyAoSW5rIG91dHB1dHMgbXVsdGlwbGUgZnJhbWVzIGluIG5vbi1UVFkgbW9kZSlcbiAgICBhd2FpdCByZXNvbHZlKGV4dHJhY3RGaXJzdEZyYW1lKG91dHB1dCkpXG4gIH0pXG59XG5cbi8qKlxuICogUmVuZGVycyBhIFJlYWN0IG5vZGUgdG8gYSBwbGFpbiB0ZXh0IHN0cmluZyAoQU5TSSBjb2RlcyBzdHJpcHBlZCkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJUb1N0cmluZyhcbiAgbm9kZTogUmVhY3QuUmVhY3ROb2RlLFxuICBjb2x1bW5zPzogbnVtYmVyLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3Qgb3V0cHV0ID0gYXdhaXQgcmVuZGVyVG9BbnNpU3RyaW5nKG5vZGUsIGNvbHVtbnMpXG4gIHJldHVybiBzdHJpcEFuc2kob3V0cHV0KVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxlQUFlLFFBQVEsT0FBTztBQUN2QyxTQUFTQyxXQUFXLFFBQVEsUUFBUTtBQUNwQyxPQUFPQyxTQUFTLE1BQU0sWUFBWTtBQUNsQyxTQUFTQyxNQUFNLEVBQUVDLE1BQU0sUUFBUSxXQUFXOztBQUUxQztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBQUMsa0JBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBMkI7SUFBQUM7RUFBQSxJQUFBSCxFQUkxQjtFQUNDO0lBQUFJO0VBQUEsSUFBaUJOLE1BQU0sQ0FBQyxDQUFDO0VBQUEsSUFBQU8sRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBTCxDQUFBLFFBQUFHLElBQUE7SUFJVEMsRUFBQSxHQUFBQSxDQUFBO01BQ2QsTUFBQUUsS0FBQSxHQUFjQyxVQUFVLENBQUNKLElBQUksRUFBRSxDQUFDLENBQUM7TUFBQSxPQUMxQixNQUFNSyxZQUFZLENBQUNGLEtBQUssQ0FBQztJQUFBLENBQ2pDO0lBQUVELEVBQUEsSUFBQ0YsSUFBSSxDQUFDO0lBQUFILENBQUEsTUFBQUcsSUFBQTtJQUFBSCxDQUFBLE1BQUFJLEVBQUE7SUFBQUosQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBSixDQUFBO0lBQUFLLEVBQUEsR0FBQUwsQ0FBQTtFQUFBO0VBSFRQLGVBQWUsQ0FBQ1csRUFHZixFQUFFQyxFQUFNLENBQUM7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQVQsQ0FBQSxRQUFBRSxRQUFBO0lBRUhPLEVBQUEsS0FBR1AsU0FBTyxDQUFDLEdBQUk7SUFBQUYsQ0FBQSxNQUFBRSxRQUFBO0lBQUFGLENBQUEsTUFBQVMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVQsQ0FBQTtFQUFBO0VBQUEsT0FBZlMsRUFBZTtBQUFBOztBQUd4QjtBQUNBLE1BQU1DLFVBQVUsR0FBRyxhQUFhO0FBQ2hDLE1BQU1DLFFBQVEsR0FBRyxhQUFhOztBQUU5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0MsaUJBQWlCQSxDQUFDQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDO0VBQ2pELE1BQU1DLFVBQVUsR0FBR0QsTUFBTSxDQUFDRSxPQUFPLENBQUNMLFVBQVUsQ0FBQztFQUM3QyxJQUFJSSxVQUFVLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBT0QsTUFBTTtFQUVwQyxNQUFNRyxZQUFZLEdBQUdGLFVBQVUsR0FBR0osVUFBVSxDQUFDTyxNQUFNO0VBQ25ELE1BQU1DLFFBQVEsR0FBR0wsTUFBTSxDQUFDRSxPQUFPLENBQUNKLFFBQVEsRUFBRUssWUFBWSxDQUFDO0VBQ3ZELElBQUlFLFFBQVEsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPTCxNQUFNO0VBRWxDLE9BQU9BLE1BQU0sQ0FBQ00sS0FBSyxDQUFDSCxZQUFZLEVBQUVFLFFBQVEsQ0FBQztBQUM3Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQVNFLGtCQUFrQkEsQ0FDaENDLElBQUksRUFBRTdCLEtBQUssQ0FBQzhCLFNBQVMsRUFDckJDLE9BQWdCLENBQVIsRUFBRSxNQUFNLENBQ2pCLEVBQUVDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUNqQixPQUFPLElBQUlBLE9BQU8sQ0FBQyxNQUFNQyxPQUFPLElBQUk7SUFDbEMsSUFBSVosTUFBTSxHQUFHLEVBQUU7O0lBRWY7SUFDQTtJQUNBO0lBQ0E7SUFDQSxNQUFNYSxNQUFNLEdBQUcsSUFBSWhDLFdBQVcsQ0FBQyxDQUFDO0lBQ2hDLElBQUk2QixPQUFPLEtBQUtJLFNBQVMsRUFBRTtNQUN6QjtNQUFDLENBQUNELE1BQU0sSUFBSSxPQUFPLElBQUk7UUFBRUgsT0FBTyxFQUFFLE1BQU07TUFBQyxDQUFDLEVBQUVBLE9BQU8sR0FBR0EsT0FBTztJQUMvRDtJQUNBRyxNQUFNLENBQUNFLEVBQUUsQ0FBQyxNQUFNLEVBQUVDLEtBQUssSUFBSTtNQUN6QmhCLE1BQU0sSUFBSWdCLEtBQUssQ0FBQ0MsUUFBUSxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDOztJQUVGO0lBQ0E7SUFDQSxNQUFNQyxRQUFRLEdBQUcsTUFBTW5DLE1BQU0sQ0FDM0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDeUIsSUFBSSxDQUFDLEVBQUUsaUJBQWlCLENBQUMsRUFDN0M7TUFDRVcsTUFBTSxFQUFFTixNQUFNLElBQUksT0FBTyxJQUFJTyxNQUFNLENBQUNDLFdBQVc7TUFDL0NDLFlBQVksRUFBRTtJQUNoQixDQUNGLENBQUM7O0lBRUQ7SUFDQSxNQUFNSixRQUFRLENBQUNLLGFBQWEsQ0FBQyxDQUFDOztJQUU5QjtJQUNBO0lBQ0EsTUFBTVgsT0FBTyxDQUFDYixpQkFBaUIsQ0FBQ0MsTUFBTSxDQUFDLENBQUM7RUFDMUMsQ0FBQyxDQUFDO0FBQ0o7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsT0FBTyxlQUFld0IsY0FBY0EsQ0FDbENoQixJQUFJLEVBQUU3QixLQUFLLENBQUM4QixTQUFTLEVBQ3JCQyxPQUFnQixDQUFSLEVBQUUsTUFBTSxDQUNqQixFQUFFQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDakIsTUFBTVgsTUFBTSxHQUFHLE1BQU1PLGtCQUFrQixDQUFDQyxJQUFJLEVBQUVFLE9BQU8sQ0FBQztFQUN0RCxPQUFPNUIsU0FBUyxDQUFDa0IsTUFBTSxDQUFDO0FBQzFCIiwiaWdub3JlTGlzdCI6W119
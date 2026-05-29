// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  /**
   * Pre-rendered ANSI lines. Each element must be exactly one terminal row
   * (already wrapped to `width` by the producer) with ANSI escape codes inline.
   */
  lines: string[];
  /** Column width the producer wrapped to. Sent to Yoga as the fixed leaf width. */
  width: number;
};

/**
 * Bypass the <Ansi> → React tree → Yoga → squash → re-serialize roundtrip for
 * content that is already terminal-ready.
 *
 * Use this when an external renderer (e.g. the ColorDiff NAPI module) has
 * already produced ANSI-escaped, width-wrapped output. A normal <Ansi> mount
 * reparses that output into one React <Text> per style span, lays out each
 * span as a Yoga flex child, then walks the tree to re-emit the same escape
 * codes it was given. For a long transcript full of syntax-highlighted diffs
 * that roundtrip is the dominant cost of the render.
 *
 * This component emits a single Yoga leaf with a constant-time measure func
 * (width × lines.length) and hands the joined string straight to output.write(),
 * which already splits on '\n' and parses ANSI into the screen buffer.
 */
// RawAnsi 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function RawAnsi(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    lines,
    width
  } = t0;
  // 文本行为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (lines.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `lines.join("\n")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== lines) {
    // t1 暂存 `lines.join("\n")` 生成的渲染片段，后续返回路径直接复用。
    t1 = lines.join("\n");
    // $[0] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = lines;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `<ink-raw-ansi rawText={t1} rawWidth={width} rawHeight={li...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== lines.length || $[3] !== t1 || $[4] !== width) {
    // t2 暂存 `<ink-raw-ansi rawText={t1} rawWidth={width} rawHeight={li...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <ink-raw-ansi rawText={t1} rawWidth={width} rawHeight={lines.length} />;
    // $[2] 缓存 `lines.length`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = lines.length;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
    // $[4] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = width;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlByb3BzIiwibGluZXMiLCJ3aWR0aCIsIlJhd0Fuc2kiLCJ0MCIsIiQiLCJfYyIsImxlbmd0aCIsInQxIiwiam9pbiIsInQyIl0sInNvdXJjZXMiOlsiUmF3QW5zaS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuXG50eXBlIFByb3BzID0ge1xuICAvKipcbiAgICogUHJlLXJlbmRlcmVkIEFOU0kgbGluZXMuIEVhY2ggZWxlbWVudCBtdXN0IGJlIGV4YWN0bHkgb25lIHRlcm1pbmFsIHJvd1xuICAgKiAoYWxyZWFkeSB3cmFwcGVkIHRvIGB3aWR0aGAgYnkgdGhlIHByb2R1Y2VyKSB3aXRoIEFOU0kgZXNjYXBlIGNvZGVzIGlubGluZS5cbiAgICovXG4gIGxpbmVzOiBzdHJpbmdbXVxuICAvKiogQ29sdW1uIHdpZHRoIHRoZSBwcm9kdWNlciB3cmFwcGVkIHRvLiBTZW50IHRvIFlvZ2EgYXMgdGhlIGZpeGVkIGxlYWYgd2lkdGguICovXG4gIHdpZHRoOiBudW1iZXJcbn1cblxuLyoqXG4gKiBCeXBhc3MgdGhlIDxBbnNpPiDihpIgUmVhY3QgdHJlZSDihpIgWW9nYSDihpIgc3F1YXNoIOKGkiByZS1zZXJpYWxpemUgcm91bmR0cmlwIGZvclxuICogY29udGVudCB0aGF0IGlzIGFscmVhZHkgdGVybWluYWwtcmVhZHkuXG4gKlxuICogVXNlIHRoaXMgd2hlbiBhbiBleHRlcm5hbCByZW5kZXJlciAoZS5nLiB0aGUgQ29sb3JEaWZmIE5BUEkgbW9kdWxlKSBoYXNcbiAqIGFscmVhZHkgcHJvZHVjZWQgQU5TSS1lc2NhcGVkLCB3aWR0aC13cmFwcGVkIG91dHB1dC4gQSBub3JtYWwgPEFuc2k+IG1vdW50XG4gKiByZXBhcnNlcyB0aGF0IG91dHB1dCBpbnRvIG9uZSBSZWFjdCA8VGV4dD4gcGVyIHN0eWxlIHNwYW4sIGxheXMgb3V0IGVhY2hcbiAqIHNwYW4gYXMgYSBZb2dhIGZsZXggY2hpbGQsIHRoZW4gd2Fsa3MgdGhlIHRyZWUgdG8gcmUtZW1pdCB0aGUgc2FtZSBlc2NhcGVcbiAqIGNvZGVzIGl0IHdhcyBnaXZlbi4gRm9yIGEgbG9uZyB0cmFuc2NyaXB0IGZ1bGwgb2Ygc3ludGF4LWhpZ2hsaWdodGVkIGRpZmZzXG4gKiB0aGF0IHJvdW5kdHJpcCBpcyB0aGUgZG9taW5hbnQgY29zdCBvZiB0aGUgcmVuZGVyLlxuICpcbiAqIFRoaXMgY29tcG9uZW50IGVtaXRzIGEgc2luZ2xlIFlvZ2EgbGVhZiB3aXRoIGEgY29uc3RhbnQtdGltZSBtZWFzdXJlIGZ1bmNcbiAqICh3aWR0aCDDlyBsaW5lcy5sZW5ndGgpIGFuZCBoYW5kcyB0aGUgam9pbmVkIHN0cmluZyBzdHJhaWdodCB0byBvdXRwdXQud3JpdGUoKSxcbiAqIHdoaWNoIGFscmVhZHkgc3BsaXRzIG9uICdcXG4nIGFuZCBwYXJzZXMgQU5TSSBpbnRvIHRoZSBzY3JlZW4gYnVmZmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gUmF3QW5zaSh7IGxpbmVzLCB3aWR0aCB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmIChsaW5lcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiAoXG4gICAgPGluay1yYXctYW5zaVxuICAgICAgcmF3VGV4dD17bGluZXMuam9pbignXFxuJyl9XG4gICAgICByYXdXaWR0aD17d2lkdGh9XG4gICAgICByYXdIZWlnaHQ9e2xpbmVzLmxlbmd0aH1cbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUV6QixLQUFLQyxLQUFLLEdBQUc7RUFDWDtBQUNGO0FBQ0E7QUFDQTtFQUNFQyxLQUFLLEVBQUUsTUFBTSxFQUFFO0VBQ2Y7RUFDQUMsS0FBSyxFQUFFLE1BQU07QUFDZixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBQUMsUUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFpQjtJQUFBTCxLQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFBdUI7RUFDN0MsSUFBSUgsS0FBSyxDQUFBTSxNQUFPLEtBQUssQ0FBQztJQUFBLE9BQ2IsSUFBSTtFQUFBO0VBQ1osSUFBQUMsRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQUosS0FBQTtJQUdZTyxFQUFBLEdBQUFQLEtBQUssQ0FBQVEsSUFBSyxDQUFDLElBQUksQ0FBQztJQUFBSixDQUFBLE1BQUFKLEtBQUE7SUFBQUksQ0FBQSxNQUFBRyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSCxDQUFBO0VBQUE7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBSixLQUFBLENBQUFNLE1BQUEsSUFBQUYsQ0FBQSxRQUFBRyxFQUFBLElBQUFILENBQUEsUUFBQUgsS0FBQTtJQUQzQlEsRUFBQSxnQkFJRSxDQUhTLE9BQWdCLENBQWhCLENBQUFGLEVBQWUsQ0FBQyxDQUNmTixRQUFLLENBQUxBLE1BQUksQ0FBQyxDQUNKLFNBQVksQ0FBWixDQUFBRCxLQUFLLENBQUFNLE1BQU0sQ0FBQyxHQUN2QjtJQUFBRixDQUFBLE1BQUFKLEtBQUEsQ0FBQU0sTUFBQTtJQUFBRixDQUFBLE1BQUFHLEVBQUE7SUFBQUgsQ0FBQSxNQUFBSCxLQUFBO0lBQUFHLENBQUEsTUFBQUssRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUwsQ0FBQTtFQUFBO0VBQUEsT0FKRkssRUFJRTtBQUFBIiwiaWdub3JlTGlzdCI6W119
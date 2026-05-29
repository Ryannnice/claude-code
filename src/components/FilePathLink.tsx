// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 pathToFileURL，将 url 中已经封装好的能力接到本文件流程里。
import { pathToFileURL } from 'url';
// 复用 Link 终端界面组件，避免在这里重复拼装显示逻辑。
import Link from '../ink/components/Link.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  /** The absolute file path */
  filePath: string;
  /** Optional display text (defaults to filePath) */
  children?: React.ReactNode;
};

/**
 * Renders a file path as an OSC 8 hyperlink.
 * This helps terminals like iTerm correctly identify file paths
 * even when they appear inside parentheses or other text.
 */
// FilePathLink 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FilePathLink(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath,
    children
  } = t0;
  // t1 暂存 `pathToFileURL(filePath)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== filePath) {
    // t1 暂存 `pathToFileURL(filePath)` 生成的渲染片段，后续返回路径直接复用。
    t1 = pathToFileURL(filePath);
    // $[0] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = filePath;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 临时值 t2 命名 `children ?? filePath`，让后续代码直接表达这个值的用途。
  const t2 = children ?? filePath;
  // t3 暂存 `<Link url={t1.href}>{t2}</Link>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t1.href || $[3] !== t2) {
    // t3 暂存 `<Link url={t1.href}>{t2}</Link>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Link url={t1.href}>{t2}</Link>;
    // $[2] 缓存 `t1.href`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1.href;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInBhdGhUb0ZpbGVVUkwiLCJMaW5rIiwiUHJvcHMiLCJmaWxlUGF0aCIsImNoaWxkcmVuIiwiUmVhY3ROb2RlIiwiRmlsZVBhdGhMaW5rIiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwidDMiLCJocmVmIl0sInNvdXJjZXMiOlsiRmlsZVBhdGhMaW5rLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBwYXRoVG9GaWxlVVJMIH0gZnJvbSAndXJsJ1xuaW1wb3J0IExpbmsgZnJvbSAnLi4vaW5rL2NvbXBvbmVudHMvTGluay5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgLyoqIFRoZSBhYnNvbHV0ZSBmaWxlIHBhdGggKi9cbiAgZmlsZVBhdGg6IHN0cmluZ1xuICAvKiogT3B0aW9uYWwgZGlzcGxheSB0ZXh0IChkZWZhdWx0cyB0byBmaWxlUGF0aCkgKi9cbiAgY2hpbGRyZW4/OiBSZWFjdC5SZWFjdE5vZGVcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgZmlsZSBwYXRoIGFzIGFuIE9TQyA4IGh5cGVybGluay5cbiAqIFRoaXMgaGVscHMgdGVybWluYWxzIGxpa2UgaVRlcm0gY29ycmVjdGx5IGlkZW50aWZ5IGZpbGUgcGF0aHNcbiAqIGV2ZW4gd2hlbiB0aGV5IGFwcGVhciBpbnNpZGUgcGFyZW50aGVzZXMgb3Igb3RoZXIgdGV4dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZpbGVQYXRoTGluayh7IGZpbGVQYXRoLCBjaGlsZHJlbiB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiA8TGluayB1cmw9e3BhdGhUb0ZpbGVVUkwoZmlsZVBhdGgpLmhyZWZ9PntjaGlsZHJlbiA/PyBmaWxlUGF0aH08L0xpbms+XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxhQUFhLFFBQVEsS0FBSztBQUNuQyxPQUFPQyxJQUFJLE1BQU0sMkJBQTJCO0FBRTVDLEtBQUtDLEtBQUssR0FBRztFQUNYO0VBQ0FDLFFBQVEsRUFBRSxNQUFNO0VBQ2hCO0VBQ0FDLFFBQVEsQ0FBQyxFQUFFTCxLQUFLLENBQUNNLFNBQVM7QUFDNUIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyxhQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXNCO0lBQUFOLFFBQUE7SUFBQUM7RUFBQSxJQUFBRyxFQUE2QjtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFMLFFBQUE7SUFDdENPLEVBQUEsR0FBQVYsYUFBYSxDQUFDRyxRQUFRLENBQUM7SUFBQUssQ0FBQSxNQUFBTCxRQUFBO0lBQUFLLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQVEsTUFBQUcsRUFBQSxHQUFBUCxRQUFvQixJQUFwQkQsUUFBb0I7RUFBQSxJQUFBUyxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBRSxFQUFBLENBQUFHLElBQUEsSUFBQUwsQ0FBQSxRQUFBRyxFQUFBO0lBQTlEQyxFQUFBLElBQUMsSUFBSSxDQUFNLEdBQTRCLENBQTVCLENBQUFGLEVBQXVCLENBQUFHLElBQUksQ0FBQyxDQUFHLENBQUFGLEVBQW1CLENBQUUsRUFBOUQsSUFBSSxDQUFpRTtJQUFBSCxDQUFBLE1BQUFFLEVBQUEsQ0FBQUcsSUFBQTtJQUFBTCxDQUFBLE1BQUFHLEVBQUE7SUFBQUgsQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBQSxPQUF0RUksRUFBc0U7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
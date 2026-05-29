// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、PropsWithChildren、useContext、useInsertionEffect，将 react 中已经封装好的能力接到本文件流程里。
import React, { type PropsWithChildren, useContext, useInsertionEffect } from 'react';
// 引入 instances，将 ../instances.js 中已经封装好的能力接到本文件流程里。
import instances from '../instances.js';
// 引入 DISABLE_MOUSE_TRACKING、ENABLE_MOUSE_TRACKING、ENTER_ALT_SCREEN、EXIT_ALT_SCREEN，将 ../termio/dec.js 中已经封装好的能力接到本文件流程里。
import { DISABLE_MOUSE_TRACKING, ENABLE_MOUSE_TRACKING, ENTER_ALT_SCREEN, EXIT_ALT_SCREEN } from '../termio/dec.js';
// 引入 TerminalWriteContext，将 ../useTerminalNotification.js 中已经封装好的能力接到本文件流程里。
import { TerminalWriteContext } from '../useTerminalNotification.js';
// 引入 Box，将 ./Box.js 中已经封装好的能力接到本文件流程里。
import Box from './Box.js';
// 引入 TerminalSizeContext，将 ./TerminalSizeContext.js 中已经封装好的能力接到本文件流程里。
import { TerminalSizeContext } from './TerminalSizeContext.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = PropsWithChildren<{
  /** Enable SGR mouse tracking (wheel + click/drag). Default true. */
  mouseTracking?: boolean;
}>;

/**
 * Run children in the terminal's alternate screen buffer, constrained to
 * the viewport height. While mounted:
 *
 * - Enters the alt screen (DEC 1049), clears it, homes the cursor
 * - Constrains its own height to the terminal row count, so overflow must
 *   be handled via `overflow: scroll` / flexbox (no native scrollback)
 * - Optionally enables SGR mouse tracking (wheel + click/drag) — events
 *   surface as `ParsedKey` (wheel) and update the Ink instance's
 *   selection state (click/drag)
 *
 * On unmount, disables mouse tracking and exits the alt screen, restoring
 * the main screen's content. Safe for use in ctrl-o transcript overlays
 * and similar temporary fullscreen views — the main screen is preserved.
 *
 * Notifies the Ink instance via `setAltScreenActive()` so the renderer
 * keeps the cursor inside the viewport (preventing the cursor-restore LF
 * from scrolling content) and so signal-exit cleanup can exit the alt
 * screen if the component's own unmount doesn't run.
 */
// AlternateScreen 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AlternateScreen(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children,
    mouseTracking: t1
  } = t0;
  // mouseTracking标记终端 UI Alternate Screen是否启用对应路径。
  const mouseTracking = t1 === undefined ? true : t1;
  // size保存`useContext`，供终端渲染后续处理使用。
  const size = useContext(TerminalSizeContext);
  // writeRaw保存`useContext`，供终端渲染后续处理使用。
  const writeRaw = useContext(TerminalWriteContext);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== mouseTracking || $[1] !== writeRaw) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // ink读取`instances.get`，供终端渲染后续处理使用。
      const ink = instances.get(process.stdout);
      // writeRaw缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!writeRaw) {
        // 终端 UI 组件 Alternate Screen在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 writeRaw，触发终端渲染此处需要的副作用。
      writeRaw(ENTER_ALT_SCREEN + "\x1B[2J\x1B[H" + (mouseTracking ? ENABLE_MOUSE_TRACKING : ""));
      // 调用 ink?.setAltScreenActive(true, mouseTracking);，完成这一处局部操作。
      ink?.setAltScreenActive(true, mouseTracking);
      // 返回 `() => {`，作为终端渲染这次计算的结果。
      return () => {
        // 调用 ink?.setAltScreenActive(false);，完成这一处局部操作。
        ink?.setAltScreenActive(false);
        // 调用 ink?.clearTextSelection();，完成这一处局部操作。
        ink?.clearTextSelection();
        // 调用 writeRaw，触发终端渲染此处需要的副作用。
        writeRaw((mouseTracking ? DISABLE_MOUSE_TRACKING : "") + EXIT_ALT_SCREEN);
      };
    };
    // t3 暂存 `[writeRaw, mouseTracking]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [writeRaw, mouseTracking];
    // $[0] 缓存 `mouseTracking`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = mouseTracking;
    // $[1] 缓存 `writeRaw`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = writeRaw;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 调用 useInsertionEffect，触发终端渲染此处需要的副作用。
  useInsertionEffect(t2, t3);
  // t4统计`size?.rows ?? 24`，供后续判断或组装使用。
  const t4 = size?.rows ?? 24;
  // t5 暂存 `<Box flexDirection="column" height={t4} width="100%" flex...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== children || $[5] !== t4) {
    // t5 暂存 `<Box flexDirection="column" height={t4} width="100%" flex...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" height={t4} width="100%" flexShrink={0}>{children}</Box>;
    // $[4] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = children;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlByb3BzV2l0aENoaWxkcmVuIiwidXNlQ29udGV4dCIsInVzZUluc2VydGlvbkVmZmVjdCIsImluc3RhbmNlcyIsIkRJU0FCTEVfTU9VU0VfVFJBQ0tJTkciLCJFTkFCTEVfTU9VU0VfVFJBQ0tJTkciLCJFTlRFUl9BTFRfU0NSRUVOIiwiRVhJVF9BTFRfU0NSRUVOIiwiVGVybWluYWxXcml0ZUNvbnRleHQiLCJCb3giLCJUZXJtaW5hbFNpemVDb250ZXh0IiwiUHJvcHMiLCJtb3VzZVRyYWNraW5nIiwiQWx0ZXJuYXRlU2NyZWVuIiwidDAiLCIkIiwiX2MiLCJjaGlsZHJlbiIsInQxIiwidW5kZWZpbmVkIiwic2l6ZSIsIndyaXRlUmF3IiwidDIiLCJ0MyIsImluayIsImdldCIsInByb2Nlc3MiLCJzdGRvdXQiLCJzZXRBbHRTY3JlZW5BY3RpdmUiLCJjbGVhclRleHRTZWxlY3Rpb24iLCJ0NCIsInJvd3MiLCJ0NSJdLCJzb3VyY2VzIjpbIkFsdGVybmF0ZVNjcmVlbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7XG4gIHR5cGUgUHJvcHNXaXRoQ2hpbGRyZW4sXG4gIHVzZUNvbnRleHQsXG4gIHVzZUluc2VydGlvbkVmZmVjdCxcbn0gZnJvbSAncmVhY3QnXG5pbXBvcnQgaW5zdGFuY2VzIGZyb20gJy4uL2luc3RhbmNlcy5qcydcbmltcG9ydCB7XG4gIERJU0FCTEVfTU9VU0VfVFJBQ0tJTkcsXG4gIEVOQUJMRV9NT1VTRV9UUkFDS0lORyxcbiAgRU5URVJfQUxUX1NDUkVFTixcbiAgRVhJVF9BTFRfU0NSRUVOLFxufSBmcm9tICcuLi90ZXJtaW8vZGVjLmpzJ1xuaW1wb3J0IHsgVGVybWluYWxXcml0ZUNvbnRleHQgfSBmcm9tICcuLi91c2VUZXJtaW5hbE5vdGlmaWNhdGlvbi5qcydcbmltcG9ydCBCb3ggZnJvbSAnLi9Cb3guanMnXG5pbXBvcnQgeyBUZXJtaW5hbFNpemVDb250ZXh0IH0gZnJvbSAnLi9UZXJtaW5hbFNpemVDb250ZXh0LmpzJ1xuXG50eXBlIFByb3BzID0gUHJvcHNXaXRoQ2hpbGRyZW48e1xuICAvKiogRW5hYmxlIFNHUiBtb3VzZSB0cmFja2luZyAod2hlZWwgKyBjbGljay9kcmFnKS4gRGVmYXVsdCB0cnVlLiAqL1xuICBtb3VzZVRyYWNraW5nPzogYm9vbGVhblxufT5cblxuLyoqXG4gKiBSdW4gY2hpbGRyZW4gaW4gdGhlIHRlcm1pbmFsJ3MgYWx0ZXJuYXRlIHNjcmVlbiBidWZmZXIsIGNvbnN0cmFpbmVkIHRvXG4gKiB0aGUgdmlld3BvcnQgaGVpZ2h0LiBXaGlsZSBtb3VudGVkOlxuICpcbiAqIC0gRW50ZXJzIHRoZSBhbHQgc2NyZWVuIChERUMgMTA0OSksIGNsZWFycyBpdCwgaG9tZXMgdGhlIGN1cnNvclxuICogLSBDb25zdHJhaW5zIGl0cyBvd24gaGVpZ2h0IHRvIHRoZSB0ZXJtaW5hbCByb3cgY291bnQsIHNvIG92ZXJmbG93IG11c3RcbiAqICAgYmUgaGFuZGxlZCB2aWEgYG92ZXJmbG93OiBzY3JvbGxgIC8gZmxleGJveCAobm8gbmF0aXZlIHNjcm9sbGJhY2spXG4gKiAtIE9wdGlvbmFsbHkgZW5hYmxlcyBTR1IgbW91c2UgdHJhY2tpbmcgKHdoZWVsICsgY2xpY2svZHJhZykg4oCUIGV2ZW50c1xuICogICBzdXJmYWNlIGFzIGBQYXJzZWRLZXlgICh3aGVlbCkgYW5kIHVwZGF0ZSB0aGUgSW5rIGluc3RhbmNlJ3NcbiAqICAgc2VsZWN0aW9uIHN0YXRlIChjbGljay9kcmFnKVxuICpcbiAqIE9uIHVubW91bnQsIGRpc2FibGVzIG1vdXNlIHRyYWNraW5nIGFuZCBleGl0cyB0aGUgYWx0IHNjcmVlbiwgcmVzdG9yaW5nXG4gKiB0aGUgbWFpbiBzY3JlZW4ncyBjb250ZW50LiBTYWZlIGZvciB1c2UgaW4gY3RybC1vIHRyYW5zY3JpcHQgb3ZlcmxheXNcbiAqIGFuZCBzaW1pbGFyIHRlbXBvcmFyeSBmdWxsc2NyZWVuIHZpZXdzIOKAlCB0aGUgbWFpbiBzY3JlZW4gaXMgcHJlc2VydmVkLlxuICpcbiAqIE5vdGlmaWVzIHRoZSBJbmsgaW5zdGFuY2UgdmlhIGBzZXRBbHRTY3JlZW5BY3RpdmUoKWAgc28gdGhlIHJlbmRlcmVyXG4gKiBrZWVwcyB0aGUgY3Vyc29yIGluc2lkZSB0aGUgdmlld3BvcnQgKHByZXZlbnRpbmcgdGhlIGN1cnNvci1yZXN0b3JlIExGXG4gKiBmcm9tIHNjcm9sbGluZyBjb250ZW50KSBhbmQgc28gc2lnbmFsLWV4aXQgY2xlYW51cCBjYW4gZXhpdCB0aGUgYWx0XG4gKiBzY3JlZW4gaWYgdGhlIGNvbXBvbmVudCdzIG93biB1bm1vdW50IGRvZXNuJ3QgcnVuLlxuICovXG5leHBvcnQgZnVuY3Rpb24gQWx0ZXJuYXRlU2NyZWVuKHtcbiAgY2hpbGRyZW4sXG4gIG1vdXNlVHJhY2tpbmcgPSB0cnVlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBzaXplID0gdXNlQ29udGV4dChUZXJtaW5hbFNpemVDb250ZXh0KVxuICBjb25zdCB3cml0ZVJhdyA9IHVzZUNvbnRleHQoVGVybWluYWxXcml0ZUNvbnRleHQpXG5cbiAgLy8gdXNlSW5zZXJ0aW9uRWZmZWN0IChub3QgdXNlTGF5b3V0RWZmZWN0KTogcmVhY3QtcmVjb25jaWxlciBjYWxsc1xuICAvLyByZXNldEFmdGVyQ29tbWl0IGJldHdlZW4gdGhlIG11dGF0aW9uIGFuZCBsYXlvdXQgY29tbWl0IHBoYXNlcywgYW5kXG4gIC8vIEluaydzIHJlc2V0QWZ0ZXJDb21taXQgdHJpZ2dlcnMgb25SZW5kZXIuIFdpdGggdXNlTGF5b3V0RWZmZWN0LCB0aGF0XG4gIC8vIGZpcnN0IG9uUmVuZGVyIGZpcmVzIEJFRk9SRSB0aGlzIGVmZmVjdCDigJQgd3JpdGluZyBhIGZ1bGwgZnJhbWUgdG8gdGhlXG4gIC8vIG1haW4gc2NyZWVuIHdpdGggYWx0U2NyZWVuPWZhbHNlLiBUaGF0IGZyYW1lIGlzIHByZXNlcnZlZCB3aGVuIHdlXG4gIC8vIGVudGVyIGFsdCBzY3JlZW4gYW5kIHJldmVhbGVkIG9uIGV4aXQgYXMgYSBicm9rZW4gdmlldy4gSW5zZXJ0aW9uXG4gIC8vIGVmZmVjdHMgZmlyZSBkdXJpbmcgdGhlIG11dGF0aW9uIHBoYXNlLCBiZWZvcmUgcmVzZXRBZnRlckNvbW1pdCwgc29cbiAgLy8gRU5URVJfQUxUX1NDUkVFTiByZWFjaGVzIHRoZSB0ZXJtaW5hbCBiZWZvcmUgdGhlIGZpcnN0IGZyYW1lIGRvZXMuXG4gIC8vIENsZWFudXAgdGltaW5nIGlzIHVuY2hhbmdlZDogYm90aCBpbnNlcnRpb24gYW5kIGxheW91dCBlZmZlY3QgY2xlYW51cFxuICAvLyBydW4gaW4gdGhlIG11dGF0aW9uIHBoYXNlIG9uIHVubW91bnQsIGJlZm9yZSByZXNldEFmdGVyQ29tbWl0LlxuICB1c2VJbnNlcnRpb25FZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGluayA9IGluc3RhbmNlcy5nZXQocHJvY2Vzcy5zdGRvdXQpXG4gICAgaWYgKCF3cml0ZVJhdykgcmV0dXJuXG5cbiAgICB3cml0ZVJhdyhcbiAgICAgIEVOVEVSX0FMVF9TQ1JFRU4gK1xuICAgICAgICAnXFx4MWJbMkpcXHgxYltIJyArXG4gICAgICAgIChtb3VzZVRyYWNraW5nID8gRU5BQkxFX01PVVNFX1RSQUNLSU5HIDogJycpLFxuICAgIClcbiAgICBpbms/LnNldEFsdFNjcmVlbkFjdGl2ZSh0cnVlLCBtb3VzZVRyYWNraW5nKVxuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGluaz8uc2V0QWx0U2NyZWVuQWN0aXZlKGZhbHNlKVxuICAgICAgaW5rPy5jbGVhclRleHRTZWxlY3Rpb24oKVxuICAgICAgd3JpdGVSYXcoKG1vdXNlVHJhY2tpbmcgPyBESVNBQkxFX01PVVNFX1RSQUNLSU5HIDogJycpICsgRVhJVF9BTFRfU0NSRUVOKVxuICAgIH1cbiAgfSwgW3dyaXRlUmF3LCBtb3VzZVRyYWNraW5nXSlcblxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgaGVpZ2h0PXtzaXplPy5yb3dzID8/IDI0fVxuICAgICAgd2lkdGg9XCIxMDAlXCJcbiAgICAgIGZsZXhTaHJpbms9ezB9XG4gICAgPlxuICAgICAge2NoaWxkcmVufVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQ1YsS0FBS0MsaUJBQWlCLEVBQ3RCQyxVQUFVLEVBQ1ZDLGtCQUFrQixRQUNiLE9BQU87QUFDZCxPQUFPQyxTQUFTLE1BQU0saUJBQWlCO0FBQ3ZDLFNBQ0VDLHNCQUFzQixFQUN0QkMscUJBQXFCLEVBQ3JCQyxnQkFBZ0IsRUFDaEJDLGVBQWUsUUFDVixrQkFBa0I7QUFDekIsU0FBU0Msb0JBQW9CLFFBQVEsK0JBQStCO0FBQ3BFLE9BQU9DLEdBQUcsTUFBTSxVQUFVO0FBQzFCLFNBQVNDLG1CQUFtQixRQUFRLDBCQUEwQjtBQUU5RCxLQUFLQyxLQUFLLEdBQUdYLGlCQUFpQixDQUFDO0VBQzdCO0VBQ0FZLGFBQWEsQ0FBQyxFQUFFLE9BQU87QUFDekIsQ0FBQyxDQUFDOztBQUVGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFDLGdCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXlCO0lBQUFDLFFBQUE7SUFBQUwsYUFBQSxFQUFBTTtFQUFBLElBQUFKLEVBR3hCO0VBRE4sTUFBQUYsYUFBQSxHQUFBTSxFQUFvQixLQUFwQkMsU0FBb0IsR0FBcEIsSUFBb0IsR0FBcEJELEVBQW9CO0VBRXBCLE1BQUFFLElBQUEsR0FBYW5CLFVBQVUsQ0FBQ1MsbUJBQW1CLENBQUM7RUFDNUMsTUFBQVcsUUFBQSxHQUFpQnBCLFVBQVUsQ0FBQ08sb0JBQW9CLENBQUM7RUFBQSxJQUFBYyxFQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFSLENBQUEsUUFBQUgsYUFBQSxJQUFBRyxDQUFBLFFBQUFNLFFBQUE7SUFZOUJDLEVBQUEsR0FBQUEsQ0FBQTtNQUNqQixNQUFBRSxHQUFBLEdBQVlyQixTQUFTLENBQUFzQixHQUFJLENBQUNDLE9BQU8sQ0FBQUMsTUFBTyxDQUFDO01BQ3pDLElBQUksQ0FBQ04sUUFBUTtRQUFBO01BQUE7TUFFYkEsUUFBUSxDQUNOZixnQkFBZ0IsR0FDZCxlQUFlLElBQ2RNLGFBQWEsR0FBYlAscUJBQTBDLEdBQTFDLEVBQTBDLENBQy9DLENBQUM7TUFDRG1CLEdBQUcsRUFBQUksa0JBQXlDLENBQXBCLElBQUksRUFBRWhCLGFBQWEsQ0FBQztNQUFBLE9BRXJDO1FBQ0xZLEdBQUcsRUFBQUksa0JBQTJCLENBQU4sS0FBSyxDQUFDO1FBQzlCSixHQUFHLEVBQUFLLGtCQUFzQixDQUFELENBQUM7UUFDekJSLFFBQVEsQ0FBQyxDQUFDVCxhQUFhLEdBQWJSLHNCQUEyQyxHQUEzQyxFQUEyQyxJQUFJRyxlQUFlLENBQUM7TUFBQSxDQUMxRTtJQUFBLENBQ0Y7SUFBRWdCLEVBQUEsSUFBQ0YsUUFBUSxFQUFFVCxhQUFhLENBQUM7SUFBQUcsQ0FBQSxNQUFBSCxhQUFBO0lBQUFHLENBQUEsTUFBQU0sUUFBQTtJQUFBTixDQUFBLE1BQUFPLEVBQUE7SUFBQVAsQ0FBQSxNQUFBUSxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBUCxDQUFBO0lBQUFRLEVBQUEsR0FBQVIsQ0FBQTtFQUFBO0VBaEI1QmIsa0JBQWtCLENBQUNvQixFQWdCbEIsRUFBRUMsRUFBeUIsQ0FBQztFQUtqQixNQUFBTyxFQUFBLEdBQUFWLElBQUksRUFBQVcsSUFBWSxJQUFoQixFQUFnQjtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBakIsQ0FBQSxRQUFBRSxRQUFBLElBQUFGLENBQUEsUUFBQWUsRUFBQTtJQUYxQkUsRUFBQSxJQUFDLEdBQUcsQ0FDWSxhQUFRLENBQVIsUUFBUSxDQUNkLE1BQWdCLENBQWhCLENBQUFGLEVBQWUsQ0FBQyxDQUNsQixLQUFNLENBQU4sTUFBTSxDQUNBLFVBQUMsQ0FBRCxHQUFDLENBRVpiLFNBQU8sQ0FDVixFQVBDLEdBQUcsQ0FPRTtJQUFBRixDQUFBLE1BQUFFLFFBQUE7SUFBQUYsQ0FBQSxNQUFBZSxFQUFBO0lBQUFmLENBQUEsTUFBQWlCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFqQixDQUFBO0VBQUE7RUFBQSxPQVBOaUIsRUFPTTtBQUFBIiwiaWdub3JlTGlzdCI6W119
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react';
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js';
// 复用 getModelDeprecationWarning 工具函数，把通用处理留在 src/utils/model/deprecation.js 中维护。
import { getModelDeprecationWarning } from 'src/utils/model/deprecation.js';
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js';
// useDeprecationWarningNotification 封装useDeprecationWarningNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDeprecationWarningNotification(model) {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification
  } = useNotifications();
  // lastWarningRef 引用保存`useRef`，供React hook后续处理使用。
  const lastWarningRef = useRef(null);
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== addNotification || $[1] !== model) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Deprecation Warning ...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // deprecationWarning 警告信息读取`getModelDeprecationWarning`，供React hook后续处理使用。
      const deprecationWarning = getModelDeprecationWarning(model);
      // `deprecationWarning && deprecationWarning` 与 `last` 不一致时刷新派生状态，避免使用过期结果。
      if (deprecationWarning && deprecationWarning !== lastWarningRef.current) {
        // current更新为 `deprecationWarning`，确保useDeprecationWarningNotification后续读取最新状态。
        lastWarningRef.current = deprecationWarning;
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: "model-deprecation-warning",
          text: deprecationWarning,
          color: "warning",
          priority: "high"
        });
      }
      // deprecationWarning 警告信息缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!deprecationWarning) {
        // current更新为 `null`，确保useDeprecationWarningNotification后续读取最新状态。
        lastWarningRef.current = null;
      }
    };
    // t1 暂存 `[model, addNotification]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [model, addNotification];
    // $[0] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = addNotification;
    // $[1] 缓存 `model`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = model;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t0, t1);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VSZWYiLCJ1c2VOb3RpZmljYXRpb25zIiwiZ2V0TW9kZWxEZXByZWNhdGlvbldhcm5pbmciLCJnZXRJc1JlbW90ZU1vZGUiLCJ1c2VEZXByZWNhdGlvbldhcm5pbmdOb3RpZmljYXRpb24iLCJtb2RlbCIsIiQiLCJfYyIsImFkZE5vdGlmaWNhdGlvbiIsImxhc3RXYXJuaW5nUmVmIiwidDAiLCJ0MSIsImRlcHJlY2F0aW9uV2FybmluZyIsImN1cnJlbnQiLCJrZXkiLCJ0ZXh0IiwiY29sb3IiLCJwcmlvcml0eSJdLCJzb3VyY2VzIjpbInVzZURlcHJlY2F0aW9uV2FybmluZ05vdGlmaWNhdGlvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZU5vdGlmaWNhdGlvbnMgfSBmcm9tICdzcmMvY29udGV4dC9ub3RpZmljYXRpb25zLmpzJ1xuaW1wb3J0IHsgZ2V0TW9kZWxEZXByZWNhdGlvbldhcm5pbmcgfSBmcm9tICdzcmMvdXRpbHMvbW9kZWwvZGVwcmVjYXRpb24uanMnXG5pbXBvcnQgeyBnZXRJc1JlbW90ZU1vZGUgfSBmcm9tICcuLi8uLi9ib290c3RyYXAvc3RhdGUuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VEZXByZWNhdGlvbldhcm5pbmdOb3RpZmljYXRpb24obW9kZWw6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCB7IGFkZE5vdGlmaWNhdGlvbiB9ID0gdXNlTm90aWZpY2F0aW9ucygpXG4gIGNvbnN0IGxhc3RXYXJuaW5nUmVmID0gdXNlUmVmPHN0cmluZyB8IG51bGw+KG51bGwpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZ2V0SXNSZW1vdGVNb2RlKCkpIHJldHVyblxuICAgIGNvbnN0IGRlcHJlY2F0aW9uV2FybmluZyA9IGdldE1vZGVsRGVwcmVjYXRpb25XYXJuaW5nKG1vZGVsKVxuXG4gICAgLy8gU2hvdyB3YXJuaW5nIGlmIG1vZGVsIGlzIGRlcHJlY2F0ZWQgYW5kIHdlIGhhdmVuJ3Qgc2hvd24gdGhpcyBleGFjdCB3YXJuaW5nIHlldFxuICAgIGlmIChkZXByZWNhdGlvbldhcm5pbmcgJiYgZGVwcmVjYXRpb25XYXJuaW5nICE9PSBsYXN0V2FybmluZ1JlZi5jdXJyZW50KSB7XG4gICAgICBsYXN0V2FybmluZ1JlZi5jdXJyZW50ID0gZGVwcmVjYXRpb25XYXJuaW5nXG4gICAgICBhZGROb3RpZmljYXRpb24oe1xuICAgICAgICBrZXk6ICdtb2RlbC1kZXByZWNhdGlvbi13YXJuaW5nJyxcbiAgICAgICAgdGV4dDogZGVwcmVjYXRpb25XYXJuaW5nLFxuICAgICAgICBjb2xvcjogJ3dhcm5pbmcnLFxuICAgICAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBSZXNldCB0cmFja2luZyBpZiBtb2RlbCBjaGFuZ2VzIHRvIG5vbi1kZXByZWNhdGVkXG4gICAgaWYgKCFkZXByZWNhdGlvbldhcm5pbmcpIHtcbiAgICAgIGxhc3RXYXJuaW5nUmVmLmN1cnJlbnQgPSBudWxsXG4gICAgfVxuICB9LCBbbW9kZWwsIGFkZE5vdGlmaWNhdGlvbl0pXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxTQUFTLEVBQUVDLE1BQU0sUUFBUSxPQUFPO0FBQ3pDLFNBQVNDLGdCQUFnQixRQUFRLDhCQUE4QjtBQUMvRCxTQUFTQywwQkFBMEIsUUFBUSxnQ0FBZ0M7QUFDM0UsU0FBU0MsZUFBZSxRQUFRLDBCQUEwQjtBQUUxRCxPQUFPLFNBQUFDLGtDQUFBQyxLQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQ0w7SUFBQUM7RUFBQSxJQUE0QlAsZ0JBQWdCLENBQUMsQ0FBQztFQUM5QyxNQUFBUSxjQUFBLEdBQXVCVCxNQUFNLENBQWdCLElBQUksQ0FBQztFQUFBLElBQUFVLEVBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBRSxlQUFBLElBQUFGLENBQUEsUUFBQUQsS0FBQTtJQUV4Q0ssRUFBQSxHQUFBQSxDQUFBO01BQ1IsSUFBSVAsZUFBZSxDQUFDLENBQUM7UUFBQTtNQUFBO01BQ3JCLE1BQUFTLGtCQUFBLEdBQTJCViwwQkFBMEIsQ0FBQ0csS0FBSyxDQUFDO01BRzVELElBQUlPLGtCQUFtRSxJQUE3Q0Esa0JBQWtCLEtBQUtILGNBQWMsQ0FBQUksT0FBUTtRQUNyRUosY0FBYyxDQUFBSSxPQUFBLEdBQVdELGtCQUFIO1FBQ3RCSixlQUFlLENBQUM7VUFBQU0sR0FBQSxFQUNULDJCQUEyQjtVQUFBQyxJQUFBLEVBQzFCSCxrQkFBa0I7VUFBQUksS0FBQSxFQUNqQixTQUFTO1VBQUFDLFFBQUEsRUFDTjtRQUNaLENBQUMsQ0FBQztNQUFBO01BSUosSUFBSSxDQUFDTCxrQkFBa0I7UUFDckJILGNBQWMsQ0FBQUksT0FBQSxHQUFXLElBQUg7TUFBQTtJQUN2QixDQUNGO0lBQUVGLEVBQUEsSUFBQ04sS0FBSyxFQUFFRyxlQUFlLENBQUM7SUFBQUYsQ0FBQSxNQUFBRSxlQUFBO0lBQUFGLENBQUEsTUFBQUQsS0FBQTtJQUFBQyxDQUFBLE1BQUFJLEVBQUE7SUFBQUosQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBSixDQUFBO0lBQUFLLEVBQUEsR0FBQUwsQ0FBQTtFQUFBO0VBbkIzQlAsU0FBUyxDQUFDVyxFQW1CVCxFQUFFQyxFQUF3QixDQUFDO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
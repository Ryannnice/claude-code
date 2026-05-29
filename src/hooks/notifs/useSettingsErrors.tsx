// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 useCallback、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useState } from 'react';
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js';
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js';
// 复用 getSettingsWithAllErrors 工具函数，把通用处理留在 ../../utils/settings/allErrors.js 中维护。
import { getSettingsWithAllErrors } from '../../utils/settings/allErrors.js';
// 类型依赖 { ValidationError } 来自 ../../utils/settings/validation.js，用于校准React hook 状态流的数据契约。
import type { ValidationError } from '../../utils/settings/validation.js';
// 引入 useSettingsChange，将 ../useSettingsChange.js 中已经封装好的能力接到本文件流程里。
import { useSettingsChange } from '../useSettingsChange.js';
// SETTINGS_ERRORS_NOTIFICATION_KEY 错误信息固定为 `'settings-errors'`，作为React hook use Settin...后续展示或比较的基准。
const SETTINGS_ERRORS_NOTIFICATION_KEY = 'settings-errors';
// useSettingsErrors 封装useSettingsErrors的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSettingsErrors() {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification,
    removeNotification
  } = useNotifications();
  // errors_0 错误信息 由 React state 持有，setErrors 会在用户操作或异步结果返回时触发刷新。
  const [errors_0, setErrors] = useState(_temp);
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        errors: errors_1
      } = getSettingsWithAllErrors();
      // setErrors 写入新的状态值，使React hook 状态流后续读取保持一致。
      setErrors(errors_1);
    };
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // handleSettingsChange保存`t0`，作为后续临时缓存值处理的输入。
  const handleSettingsChange = t0;
  // 调用 useSettingsChange，触发React hook此处需要的副作用。
  useSettingsChange(handleSettingsChange);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== addNotification || $[2] !== errors_0 || $[3] !== removeNotification) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Settings Errors在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `errors_0.length > 0` 时，React hook执行该分支。
      if (errors_0.length > 0) {
        // 消息标记React hook use Settin...是否启用对应路径。
        const message = `Found ${errors_0.length} settings ${errors_0.length === 1 ? "issue" : "issues"} · /doctor for details`;
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: SETTINGS_ERRORS_NOTIFICATION_KEY,
          text: message,
          color: "warning",
          priority: "high",
          timeoutMs: 60000
        });
      } else {
        // 调用 removeNotification，触发React hook此处需要的副作用。
        removeNotification(SETTINGS_ERRORS_NOTIFICATION_KEY);
      }
    };
    // t2 暂存 `[errors_0, addNotification, removeNotification]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [errors_0, addNotification, removeNotification];
    // $[1] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = addNotification;
    // $[2] 缓存 `errors_0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = errors_0;
    // $[3] 缓存 `removeNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = removeNotification;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t1, t2);
  // 返回 `errors_0`，作为React hook 状态流这次计算的结果。
  return errors_0;
}
// _temp 封装useSettingsErrors的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    errors
  } = getSettingsWithAllErrors();
  // 返回 `errors`，作为React hook 状态流这次计算的结果。
  return errors;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwidXNlTm90aWZpY2F0aW9ucyIsImdldElzUmVtb3RlTW9kZSIsImdldFNldHRpbmdzV2l0aEFsbEVycm9ycyIsIlZhbGlkYXRpb25FcnJvciIsInVzZVNldHRpbmdzQ2hhbmdlIiwiU0VUVElOR1NfRVJST1JTX05PVElGSUNBVElPTl9LRVkiLCJ1c2VTZXR0aW5nc0Vycm9ycyIsIiQiLCJfYyIsImFkZE5vdGlmaWNhdGlvbiIsInJlbW92ZU5vdGlmaWNhdGlvbiIsImVycm9yc18wIiwic2V0RXJyb3JzIiwiX3RlbXAiLCJ0MCIsIlN5bWJvbCIsImZvciIsImVycm9ycyIsImVycm9yc18xIiwiaGFuZGxlU2V0dGluZ3NDaGFuZ2UiLCJ0MSIsInQyIiwibGVuZ3RoIiwibWVzc2FnZSIsImtleSIsInRleHQiLCJjb2xvciIsInByaW9yaXR5IiwidGltZW91dE1zIl0sInNvdXJjZXMiOlsidXNlU2V0dGluZ3NFcnJvcnMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VOb3RpZmljYXRpb25zIH0gZnJvbSAnc3JjL2NvbnRleHQvbm90aWZpY2F0aW9ucy5qcydcbmltcG9ydCB7IGdldElzUmVtb3RlTW9kZSB9IGZyb20gJy4uLy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB7IGdldFNldHRpbmdzV2l0aEFsbEVycm9ycyB9IGZyb20gJy4uLy4uL3V0aWxzL3NldHRpbmdzL2FsbEVycm9ycy5qcydcbmltcG9ydCB0eXBlIHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2V0dGluZ3MvdmFsaWRhdGlvbi5qcydcbmltcG9ydCB7IHVzZVNldHRpbmdzQ2hhbmdlIH0gZnJvbSAnLi4vdXNlU2V0dGluZ3NDaGFuZ2UuanMnXG5cbmNvbnN0IFNFVFRJTkdTX0VSUk9SU19OT1RJRklDQVRJT05fS0VZID0gJ3NldHRpbmdzLWVycm9ycydcblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVNldHRpbmdzRXJyb3JzKCk6IFZhbGlkYXRpb25FcnJvcltdIHtcbiAgY29uc3QgeyBhZGROb3RpZmljYXRpb24sIHJlbW92ZU5vdGlmaWNhdGlvbiB9ID0gdXNlTm90aWZpY2F0aW9ucygpXG4gIGNvbnN0IFtlcnJvcnMsIHNldEVycm9yc10gPSB1c2VTdGF0ZTxWYWxpZGF0aW9uRXJyb3JbXT4oKCkgPT4ge1xuICAgIGNvbnN0IHsgZXJyb3JzIH0gPSBnZXRTZXR0aW5nc1dpdGhBbGxFcnJvcnMoKVxuICAgIHJldHVybiBlcnJvcnNcbiAgfSlcblxuICBjb25zdCBoYW5kbGVTZXR0aW5nc0NoYW5nZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBjb25zdCB7IGVycm9ycyB9ID0gZ2V0U2V0dGluZ3NXaXRoQWxsRXJyb3JzKClcbiAgICBzZXRFcnJvcnMoZXJyb3JzKVxuICB9LCBbXSlcblxuICB1c2VTZXR0aW5nc0NoYW5nZShoYW5kbGVTZXR0aW5nc0NoYW5nZSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChnZXRJc1JlbW90ZU1vZGUoKSkgcmV0dXJuXG4gICAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYEZvdW5kICR7ZXJyb3JzLmxlbmd0aH0gc2V0dGluZ3MgJHtlcnJvcnMubGVuZ3RoID09PSAxID8gJ2lzc3VlJyA6ICdpc3N1ZXMnfSDCtyAvZG9jdG9yIGZvciBkZXRhaWxzYFxuICAgICAgYWRkTm90aWZpY2F0aW9uKHtcbiAgICAgICAga2V5OiBTRVRUSU5HU19FUlJPUlNfTk9USUZJQ0FUSU9OX0tFWSxcbiAgICAgICAgdGV4dDogbWVzc2FnZSxcbiAgICAgICAgY29sb3I6ICd3YXJuaW5nJyxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgdGltZW91dE1zOiA2MDAwMCxcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZU5vdGlmaWNhdGlvbihTRVRUSU5HU19FUlJPUlNfTk9USUZJQ0FUSU9OX0tFWSlcbiAgICB9XG4gIH0sIFtlcnJvcnMsIGFkZE5vdGlmaWNhdGlvbiwgcmVtb3ZlTm90aWZpY2F0aW9uXSlcblxuICByZXR1cm4gZXJyb3JzXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxXQUFXLEVBQUVDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDeEQsU0FBU0MsZ0JBQWdCLFFBQVEsOEJBQThCO0FBQy9ELFNBQVNDLGVBQWUsUUFBUSwwQkFBMEI7QUFDMUQsU0FBU0Msd0JBQXdCLFFBQVEsbUNBQW1DO0FBQzVFLGNBQWNDLGVBQWUsUUFBUSxvQ0FBb0M7QUFDekUsU0FBU0MsaUJBQWlCLFFBQVEseUJBQXlCO0FBRTNELE1BQU1DLGdDQUFnQyxHQUFHLGlCQUFpQjtBQUUxRCxPQUFPLFNBQUFDLGtCQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQ0w7SUFBQUMsZUFBQTtJQUFBQztFQUFBLElBQWdEVixnQkFBZ0IsQ0FBQyxDQUFDO0VBQ2xFLE9BQUFXLFFBQUEsRUFBQUMsU0FBQSxJQUE0QmIsUUFBUSxDQUFvQmMsS0FHdkQsQ0FBQztFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBUCxDQUFBLFFBQUFRLE1BQUEsQ0FBQUMsR0FBQTtJQUV1Q0YsRUFBQSxHQUFBQSxDQUFBO01BQ3ZDO1FBQUFHLE1BQUEsRUFBQUM7TUFBQSxJQUFtQmhCLHdCQUF3QixDQUFDLENBQUM7TUFDN0NVLFNBQVMsQ0FBQ0ssUUFBTSxDQUFDO0lBQUEsQ0FDbEI7SUFBQVYsQ0FBQSxNQUFBTyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUCxDQUFBO0VBQUE7RUFIRCxNQUFBWSxvQkFBQSxHQUE2QkwsRUFHdkI7RUFFTlYsaUJBQWlCLENBQUNlLG9CQUFvQixDQUFDO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBZCxDQUFBLFFBQUFFLGVBQUEsSUFBQUYsQ0FBQSxRQUFBSSxRQUFBLElBQUFKLENBQUEsUUFBQUcsa0JBQUE7SUFFN0JVLEVBQUEsR0FBQUEsQ0FBQTtNQUNSLElBQUluQixlQUFlLENBQUMsQ0FBQztRQUFBO01BQUE7TUFDckIsSUFBSWdCLFFBQU0sQ0FBQUssTUFBTyxHQUFHLENBQUM7UUFDbkIsTUFBQUMsT0FBQSxHQUFnQixTQUFTTixRQUFNLENBQUFLLE1BQU8sYUFBYUwsUUFBTSxDQUFBSyxNQUFPLEtBQUssQ0FBc0IsR0FBeEMsT0FBd0MsR0FBeEMsUUFBd0Msd0JBQXdCO1FBQ25IYixlQUFlLENBQUM7VUFBQWUsR0FBQSxFQUNUbkIsZ0NBQWdDO1VBQUFvQixJQUFBLEVBQy9CRixPQUFPO1VBQUFHLEtBQUEsRUFDTixTQUFTO1VBQUFDLFFBQUEsRUFDTixNQUFNO1VBQUFDLFNBQUEsRUFDTDtRQUNiLENBQUMsQ0FBQztNQUFBO1FBRUZsQixrQkFBa0IsQ0FBQ0wsZ0NBQWdDLENBQUM7TUFBQTtJQUNyRCxDQUNGO0lBQUVnQixFQUFBLElBQUNKLFFBQU0sRUFBRVIsZUFBZSxFQUFFQyxrQkFBa0IsQ0FBQztJQUFBSCxDQUFBLE1BQUFFLGVBQUE7SUFBQUYsQ0FBQSxNQUFBSSxRQUFBO0lBQUFKLENBQUEsTUFBQUcsa0JBQUE7SUFBQUgsQ0FBQSxNQUFBYSxFQUFBO0lBQUFiLENBQUEsTUFBQWMsRUFBQTtFQUFBO0lBQUFELEVBQUEsR0FBQWIsQ0FBQTtJQUFBYyxFQUFBLEdBQUFkLENBQUE7RUFBQTtFQWRoRFQsU0FBUyxDQUFDc0IsRUFjVCxFQUFFQyxFQUE2QyxDQUFDO0VBQUEsT0FFMUNKLFFBQU07QUFBQTtBQTlCUixTQUFBSixNQUFBO0VBR0g7SUFBQUk7RUFBQSxJQUFtQmYsd0JBQXdCLENBQUMsQ0FBQztFQUFBLE9BQ3RDZSxNQUFNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
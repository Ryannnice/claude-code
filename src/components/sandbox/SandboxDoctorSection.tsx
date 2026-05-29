// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js';
// SandboxDoctorSection 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SandboxDoctorSection() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 满足 `!SandboxManager.isSupportedPlatform()` 时，终端渲染执行该分支。
  if (!SandboxManager.isSupportedPlatform()) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 满足 `!SandboxManager.isSandboxEnabledInSettings()` 时，终端渲染执行该分支。
  if (!SandboxManager.isSandboxEnabledInSettings()) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t0;
  // t1 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t1 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 Sandbox Doctor Section在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // depCheck读取`SandboxManager.checkDependencies`，供终端渲染后续处理使用。
      const depCheck = SandboxManager.checkDependencies();
      // hasErrors 错误信息标记终端 UI Sandbox Doctor Secti...是否启用对应路径。
      const hasErrors = depCheck.errors.length > 0;
      // hasWarnings 警告信息标记终端 UI Sandbox Doctor Secti...是否启用对应路径。
      const hasWarnings = depCheck.warnings.length > 0;
      // 只有 `!hasErrors && !hasWarnings` 满足时，终端渲染才执行该分支。
      if (!hasErrors && !hasWarnings) {
        // t1 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t1 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // statusColor保存`hasErrors ? "error" as const : "warning" as const`，供后续判断或组装使用。
      const statusColor = hasErrors ? "error" as const : "warning" as const;
      // statusText保存`Available`，供终端渲染后续处理使用。
      const statusText = hasErrors ? "Missing dependencies" : "Available (with warnings)";
      // t0 暂存 `<Box flexDirection="column"><Text bold={true}>Sandbox</Te...` 生成的渲染片段，后续返回路径直接复用。
      t0 = <Box flexDirection="column"><Text bold={true}>Sandbox</Text><Text>└ Status: <Text color={statusColor}>{statusText}</Text></Text>{depCheck.errors.map(_temp)}{depCheck.warnings.map(_temp2)}{hasErrors && <Text dimColor={true}>└ Run /sandbox for install instructions</Text>}</Box>;
    }
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // `t1` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(w, i_0) {
  // 返回 `<Text key={i_0} color="warning">└ {w}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i_0} color="warning">└ {w}</Text>;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(e, i) {
  // 返回 `<Text key={i} color="error">└ {e}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i} color="error">└ {e}</Text>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJTYW5kYm94TWFuYWdlciIsIlNhbmRib3hEb2N0b3JTZWN0aW9uIiwiJCIsIl9jIiwiaXNTdXBwb3J0ZWRQbGF0Zm9ybSIsImlzU2FuZGJveEVuYWJsZWRJblNldHRpbmdzIiwidDAiLCJ0MSIsIlN5bWJvbCIsImZvciIsImJiMCIsImRlcENoZWNrIiwiY2hlY2tEZXBlbmRlbmNpZXMiLCJoYXNFcnJvcnMiLCJlcnJvcnMiLCJsZW5ndGgiLCJoYXNXYXJuaW5ncyIsIndhcm5pbmdzIiwic3RhdHVzQ29sb3IiLCJjb25zdCIsInN0YXR1c1RleHQiLCJtYXAiLCJfdGVtcCIsIl90ZW1wMiIsInciLCJpXzAiLCJpIiwiZSJdLCJzb3VyY2VzIjpbIlNhbmRib3hEb2N0b3JTZWN0aW9uLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBTYW5kYm94TWFuYWdlciB9IGZyb20gJy4uLy4uL3V0aWxzL3NhbmRib3gvc2FuZGJveC1hZGFwdGVyLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gU2FuZGJveERvY3RvclNlY3Rpb24oKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCFTYW5kYm94TWFuYWdlci5pc1N1cHBvcnRlZFBsYXRmb3JtKCkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKCFTYW5kYm94TWFuYWdlci5pc1NhbmRib3hFbmFibGVkSW5TZXR0aW5ncygpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IGRlcENoZWNrID0gU2FuZGJveE1hbmFnZXIuY2hlY2tEZXBlbmRlbmNpZXMoKVxuICBjb25zdCBoYXNFcnJvcnMgPSBkZXBDaGVjay5lcnJvcnMubGVuZ3RoID4gMFxuICBjb25zdCBoYXNXYXJuaW5ncyA9IGRlcENoZWNrLndhcm5pbmdzLmxlbmd0aCA+IDBcblxuICBpZiAoIWhhc0Vycm9ycyAmJiAhaGFzV2FybmluZ3MpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3Qgc3RhdHVzQ29sb3IgPSBoYXNFcnJvcnMgPyAoJ2Vycm9yJyBhcyBjb25zdCkgOiAoJ3dhcm5pbmcnIGFzIGNvbnN0KVxuICBjb25zdCBzdGF0dXNUZXh0ID0gaGFzRXJyb3JzXG4gICAgPyAnTWlzc2luZyBkZXBlbmRlbmNpZXMnXG4gICAgOiAnQXZhaWxhYmxlICh3aXRoIHdhcm5pbmdzKSdcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPFRleHQgYm9sZD5TYW5kYm94PC9UZXh0PlxuICAgICAgPFRleHQ+XG4gICAgICAgIOKUlCBTdGF0dXM6IDxUZXh0IGNvbG9yPXtzdGF0dXNDb2xvcn0+e3N0YXR1c1RleHR9PC9UZXh0PlxuICAgICAgPC9UZXh0PlxuICAgICAge2RlcENoZWNrLmVycm9ycy5tYXAoKGUsIGkpID0+IChcbiAgICAgICAgPFRleHQga2V5PXtpfSBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAg4pSUIHtlfVxuICAgICAgICA8L1RleHQ+XG4gICAgICApKX1cbiAgICAgIHtkZXBDaGVjay53YXJuaW5ncy5tYXAoKHcsIGkpID0+IChcbiAgICAgICAgPFRleHQga2V5PXtpfSBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICDilJQge3d9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICkpfVxuICAgICAge2hhc0Vycm9ycyAmJiAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPuKUlCBSdW4gL3NhbmRib3ggZm9yIGluc3RhbGwgaW5zdHJ1Y3Rpb25zPC9UZXh0PlxuICAgICAgKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxjQUFjLFFBQVEsd0NBQXdDO0FBRXZFLE9BQU8sU0FBQUMscUJBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFDTCxJQUFJLENBQUNILGNBQWMsQ0FBQUksbUJBQW9CLENBQUMsQ0FBQztJQUFBLE9BQ2hDLElBQUk7RUFBQTtFQUdiLElBQUksQ0FBQ0osY0FBYyxDQUFBSywwQkFBMkIsQ0FBQyxDQUFDO0lBQUEsT0FDdkMsSUFBSTtFQUFBO0VBQ1osSUFBQUMsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBTCxDQUFBLFFBQUFNLE1BQUEsQ0FBQUMsR0FBQTtJQU9RRixFQUFBLEdBQUFDLE1BQUksQ0FBQUMsR0FBQSxDQUFKLDZCQUFHLENBQUM7SUFBQUMsR0FBQTtNQUxiLE1BQUFDLFFBQUEsR0FBaUJYLGNBQWMsQ0FBQVksaUJBQWtCLENBQUMsQ0FBQztNQUNuRCxNQUFBQyxTQUFBLEdBQWtCRixRQUFRLENBQUFHLE1BQU8sQ0FBQUMsTUFBTyxHQUFHLENBQUM7TUFDNUMsTUFBQUMsV0FBQSxHQUFvQkwsUUFBUSxDQUFBTSxRQUFTLENBQUFGLE1BQU8sR0FBRyxDQUFDO01BRWhELElBQUksQ0FBQ0YsU0FBeUIsSUFBMUIsQ0FBZUcsV0FBVztRQUNyQlQsRUFBQSxPQUFJO1FBQUosTUFBQUcsR0FBQTtNQUFJO01BR2IsTUFBQVEsV0FBQSxHQUFvQkwsU0FBUyxHQUFJLE9BQU8sSUFBSU0sS0FBNkIsR0FBbkIsU0FBUyxJQUFJQSxLQUFNO01BQ3pFLE1BQUFDLFVBQUEsR0FBbUJQLFNBQVMsR0FBVCxzQkFFWSxHQUZaLDJCQUVZO01BRzdCUCxFQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQ3pCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBQyxPQUFPLEVBQWpCLElBQUksQ0FDTCxDQUFDLElBQUksQ0FBQyxVQUNNLENBQUMsSUFBSSxDQUFRWSxLQUFXLENBQVhBLFlBQVUsQ0FBQyxDQUFHRSxXQUFTLENBQUUsRUFBckMsSUFBSSxDQUNqQixFQUZDLElBQUksQ0FHSixDQUFBVCxRQUFRLENBQUFHLE1BQU8sQ0FBQU8sR0FBSSxDQUFDQyxLQUlwQixFQUNBLENBQUFYLFFBQVEsQ0FBQU0sUUFBUyxDQUFBSSxHQUFJLENBQUNFLE1BSXRCLEVBQ0EsQ0FBQVYsU0FFQSxJQURDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyx1Q0FBdUMsRUFBckQsSUFBSSxDQUNQLENBQ0YsRUFsQkMsR0FBRyxDQWtCRTtJQUFBO0lBQUFYLENBQUEsTUFBQUksRUFBQTtJQUFBSixDQUFBLE1BQUFLLEVBQUE7RUFBQTtJQUFBRCxFQUFBLEdBQUFKLENBQUE7SUFBQUssRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFBQSxJQUFBSyxFQUFBLEtBQUFDLE1BQUEsQ0FBQUMsR0FBQTtJQUFBLE9BQUFGLEVBQUE7RUFBQTtFQUFBLE9BbEJORCxFQWtCTTtBQUFBO0FBekNILFNBQUFpQixPQUFBQyxDQUFBLEVBQUFDLEdBQUE7RUFBQSxPQWtDQyxDQUFDLElBQUksQ0FBTUMsR0FBQyxDQUFEQSxJQUFBLENBQUMsQ0FBUSxLQUFTLENBQVQsU0FBUyxDQUFDLEVBQ3pCRixFQUFBLENBQ0wsRUFGQyxJQUFJLENBRUU7QUFBQTtBQXBDUixTQUFBRixNQUFBSyxDQUFBLEVBQUFELENBQUE7RUFBQSxPQTZCQyxDQUFDLElBQUksQ0FBTUEsR0FBQyxDQUFEQSxFQUFBLENBQUMsQ0FBUSxLQUFPLENBQVAsT0FBTyxDQUFDLEVBQ3ZCQyxFQUFBLENBQ0wsRUFGQyxJQUFJLENBRUU7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
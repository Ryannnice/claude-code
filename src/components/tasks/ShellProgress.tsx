// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ReactNode } 来自 react，用于校准终端渲染的数据契约。
import type { ReactNode } from 'react';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from 'src/ink.js';
// 类型依赖 { TaskStatus } 来自 src/Task.js，用于校准终端渲染的数据契约。
import type { TaskStatus } from 'src/Task.js';
// 类型依赖 { LocalShellTaskState } 来自 src/tasks/LocalShellTask/guards.js，用于校准终端渲染的数据契约。
import type { LocalShellTaskState } from 'src/tasks/LocalShellTask/guards.js';
// 类型依赖 { DeepImmutable } 来自 src/types/utils.js，用于校准终端渲染的数据契约。
import type { DeepImmutable } from 'src/types/utils.js';
// TaskStatusTextProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TaskStatusTextProps = {
  status: TaskStatus;
  label?: string;
  suffix?: string;
};
// TaskStatusText 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TaskStatusText(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    status,
    label,
    suffix
  } = t0;
  // displayLabel保存`label ?? status`，供后续判断或组装使用。
  const displayLabel = label ?? status;
  // color标记终端 UI Shell Progress是否启用对应路径。
  const color = status === "completed" ? "success" : status === "failed" ? "error" : status === "killed" ? "warning" : undefined;
  // t1 暂存 `<Text color={color} dimColor={true}>({displayLabel}{suffi...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== color || $[1] !== displayLabel || $[2] !== suffix) {
    // t1 暂存 `<Text color={color} dimColor={true}>({displayLabel}{suffi...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color={color} dimColor={true}>({displayLabel}{suffix})</Text>;
    // $[0] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = color;
    // $[1] 缓存 `displayLabel`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = displayLabel;
    // $[2] 缓存 `suffix`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = suffix;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// ShellProgress 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ShellProgress(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    shell
  } = t0;
  // 按照 shell.status 的取值选择终端渲染的具体处理分支。
  switch (shell.status) {
    case "completed":
      {
        // t1 暂存 `<TaskStatusText status="completed" label="done" />` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
          // t1 暂存 `<TaskStatusText status="completed" label="done" />` 生成的渲染片段，后续返回路径直接复用。
          t1 = <TaskStatusText status="completed" label="done" />;
          // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[0] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[0];
        }
        // 返回 `t1`，作为终端渲染这次计算的结果。
        return t1;
      }
    case "failed":
      {
        // t1 暂存 `<TaskStatusText status="failed" label="error" />` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
          // t1 暂存 `<TaskStatusText status="failed" label="error" />` 生成的渲染片段，后续返回路径直接复用。
          t1 = <TaskStatusText status="failed" label="error" />;
          // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[1] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[1];
        }
        // 返回 `t1`，作为终端渲染这次计算的结果。
        return t1;
      }
    case "killed":
      {
        // t1 暂存 `<TaskStatusText status="killed" label="stopped" />` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
          // t1 暂存 `<TaskStatusText status="killed" label="stopped" />` 生成的渲染片段，后续返回路径直接复用。
          t1 = <TaskStatusText status="killed" label="stopped" />;
          // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[2] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[2];
        }
        // 返回 `t1`，作为终端渲染这次计算的结果。
        return t1;
      }
    case "running":
    case "pending":
      {
        // t1 暂存 `<TaskStatusText status="running" />` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
          // t1 暂存 `<TaskStatusText status="running" />` 生成的渲染片段，后续返回路径直接复用。
          t1 = <TaskStatusText status="running" />;
          // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[3] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[3];
        }
        // 返回 `t1`，作为终端渲染这次计算的结果。
        return t1;
      }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdE5vZGUiLCJSZWFjdCIsIlRleHQiLCJUYXNrU3RhdHVzIiwiTG9jYWxTaGVsbFRhc2tTdGF0ZSIsIkRlZXBJbW11dGFibGUiLCJUYXNrU3RhdHVzVGV4dFByb3BzIiwic3RhdHVzIiwibGFiZWwiLCJzdWZmaXgiLCJUYXNrU3RhdHVzVGV4dCIsInQwIiwiJCIsIl9jIiwiZGlzcGxheUxhYmVsIiwiY29sb3IiLCJ1bmRlZmluZWQiLCJ0MSIsIlNoZWxsUHJvZ3Jlc3MiLCJzaGVsbCIsIlN5bWJvbCIsImZvciJdLCJzb3VyY2VzIjpbIlNoZWxsUHJvZ3Jlc3MudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgUmVhY3ROb2RlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnc3JjL2luay5qcydcbmltcG9ydCB0eXBlIHsgVGFza1N0YXR1cyB9IGZyb20gJ3NyYy9UYXNrLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbFNoZWxsVGFza1N0YXRlIH0gZnJvbSAnc3JjL3Rhc2tzL0xvY2FsU2hlbGxUYXNrL2d1YXJkcy5qcydcbmltcG9ydCB0eXBlIHsgRGVlcEltbXV0YWJsZSB9IGZyb20gJ3NyYy90eXBlcy91dGlscy5qcydcblxudHlwZSBUYXNrU3RhdHVzVGV4dFByb3BzID0ge1xuICBzdGF0dXM6IFRhc2tTdGF0dXNcbiAgbGFiZWw/OiBzdHJpbmdcbiAgc3VmZml4Pzogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBUYXNrU3RhdHVzVGV4dCh7XG4gIHN0YXR1cyxcbiAgbGFiZWwsXG4gIHN1ZmZpeCxcbn06IFRhc2tTdGF0dXNUZXh0UHJvcHMpOiBSZWFjdE5vZGUge1xuICBjb25zdCBkaXNwbGF5TGFiZWwgPSBsYWJlbCA/PyBzdGF0dXNcbiAgY29uc3QgY29sb3IgPVxuICAgIHN0YXR1cyA9PT0gJ2NvbXBsZXRlZCdcbiAgICAgID8gJ3N1Y2Nlc3MnXG4gICAgICA6IHN0YXR1cyA9PT0gJ2ZhaWxlZCdcbiAgICAgICAgPyAnZXJyb3InXG4gICAgICAgIDogc3RhdHVzID09PSAna2lsbGVkJ1xuICAgICAgICAgID8gJ3dhcm5pbmcnXG4gICAgICAgICAgOiB1bmRlZmluZWRcbiAgcmV0dXJuIChcbiAgICA8VGV4dCBjb2xvcj17Y29sb3J9IGRpbUNvbG9yPlxuICAgICAgKHtkaXNwbGF5TGFiZWx9XG4gICAgICB7c3VmZml4fSlcbiAgICA8L1RleHQ+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNoZWxsUHJvZ3Jlc3Moe1xuICBzaGVsbCxcbn06IHtcbiAgc2hlbGw6IERlZXBJbW11dGFibGU8TG9jYWxTaGVsbFRhc2tTdGF0ZT5cbn0pOiBSZWFjdE5vZGUge1xuICBzd2l0Y2ggKHNoZWxsLnN0YXR1cykge1xuICAgIGNhc2UgJ2NvbXBsZXRlZCc6XG4gICAgICByZXR1cm4gPFRhc2tTdGF0dXNUZXh0IHN0YXR1cz1cImNvbXBsZXRlZFwiIGxhYmVsPVwiZG9uZVwiIC8+XG4gICAgY2FzZSAnZmFpbGVkJzpcbiAgICAgIHJldHVybiA8VGFza1N0YXR1c1RleHQgc3RhdHVzPVwiZmFpbGVkXCIgbGFiZWw9XCJlcnJvclwiIC8+XG4gICAgY2FzZSAna2lsbGVkJzpcbiAgICAgIHJldHVybiA8VGFza1N0YXR1c1RleHQgc3RhdHVzPVwia2lsbGVkXCIgbGFiZWw9XCJzdG9wcGVkXCIgLz5cbiAgICBjYXNlICdydW5uaW5nJzpcbiAgICBjYXNlICdwZW5kaW5nJzpcbiAgICAgIHJldHVybiA8VGFza1N0YXR1c1RleHQgc3RhdHVzPVwicnVubmluZ1wiIC8+XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLFNBQVMsUUFBUSxPQUFPO0FBQ3RDLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLElBQUksUUFBUSxZQUFZO0FBQ2pDLGNBQWNDLFVBQVUsUUFBUSxhQUFhO0FBQzdDLGNBQWNDLG1CQUFtQixRQUFRLG9DQUFvQztBQUM3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
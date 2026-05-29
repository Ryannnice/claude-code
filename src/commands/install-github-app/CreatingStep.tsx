// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { Workflow } 来自 ./types.js，用于校准命令处理的数据契约。
import type { Workflow } from './types.js';
// CreatingStepProps 描述命令处理需要实现的字段和回调，避免跨模块交互时契约漂移。
interface CreatingStepProps {
  currentWorkflowInstallStep: number;
  secretExists: boolean;
  useExistingSecret: boolean;
  secretName: string;
  skipWorkflow?: boolean;
  selectedWorkflows: Workflow[];
}
// CreatingStep 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CreatingStep(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    currentWorkflowInstallStep,
    secretExists,
    useExistingSecret,
    secretName,
    skipWorkflow: t1,
    selectedWorkflows
  } = t0;
  // skipWorkflow标记命令处理斜杠命令 Creating Step是否启用对应路径。
  const skipWorkflow = t1 === undefined ? false : t1;
  // t2 暂存 `skipWorkflow ? ["Getting repository information", secretE...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== secretExists || $[1] !== secretName || $[2] !== selectedWorkflows || $[3] !== skipWorkflow || $[4] !== useExistingSecret) {
    // t2 暂存 `skipWorkflow ? ["Getting repository information", secretE...` 生成的渲染片段，后续返回路径直接复用。
    t2 = skipWorkflow ? ["Getting repository information", secretExists && useExistingSecret ? "Using existing API key secret" : `Setting up ${secretName} secret`] : ["Getting repository information", "Creating branch", selectedWorkflows.length > 1 ? "Creating workflow files" : "Creating workflow file", secretExists && useExistingSecret ? "Using existing API key secret" : `Setting up ${secretName} secret`, "Opening pull request page"];
    // $[0] 缓存 `secretExists`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = secretExists;
    // $[1] 缓存 `secretName`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = secretName;
    // $[2] 缓存 `selectedWorkflows`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = selectedWorkflows;
    // $[3] 缓存 `skipWorkflow`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = skipWorkflow;
    // $[4] 缓存 `useExistingSecret`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = useExistingSecret;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // progressSteps 集合沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const progressSteps = t2;
  // t3 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column" marginBottom={1}><Text bold={true}>Install GitHub App</Text><Text dimColor={true}>Create GitHub Actions workflow</Text></Box>;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<><Box flexDirection="column" borderStyle="round" padding...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== currentWorkflowInstallStep || $[8] !== progressSteps) {
    // t4 暂存 `<><Box flexDirection="column" borderStyle="round" padding...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <><Box flexDirection="column" borderStyle="round" paddingX={1}>{t3}{progressSteps.map((stepText, index) => {
          // status 集合固定为 `"pending"`，作为命令处理斜杠命令 Creating Step后续展示或比较的基准。
          let status = "pending";
          // 满足 `index < currentWorkflowInstallStep` 时，命令处理执行该分支。
          if (index < currentWorkflowInstallStep) {
            // status 集合更新为 `"completed"`，确保斜杠命令后续读取最新状态。
            status = "completed";
          } else {
            // 满足 `index === currentWorkflowInstallStep` 时，命令处理执行该分支。
            if (index === currentWorkflowInstallStep) {
              // status 集合更新为 `"in-progress"`，确保斜杠命令后续读取最新状态。
              status = "in-progress";
            }
          }
          // 返回 `<Box key={index}><Text color={status === "completed" ? "success" : stat...`，作为命令处理这次计算的结果。
          return <Box key={index}><Text color={status === "completed" ? "success" : status === "in-progress" ? "warning" : undefined}>{status === "completed" ? "\u2713 " : ""}{stepText}{status === "in-progress" ? "\u2026" : ""}</Text></Box>;
        })}</Box></>;
    // $[7] 缓存 `currentWorkflowInstallStep`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = currentWorkflowInstallStep;
    // $[8] 缓存 `progressSteps`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = progressSteps;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // 返回 `t4`，作为命令处理这次计算的结果。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJXb3JrZmxvdyIsIkNyZWF0aW5nU3RlcFByb3BzIiwiY3VycmVudFdvcmtmbG93SW5zdGFsbFN0ZXAiLCJzZWNyZXRFeGlzdHMiLCJ1c2VFeGlzdGluZ1NlY3JldCIsInNlY3JldE5hbWUiLCJza2lwV29ya2Zsb3ciLCJzZWxlY3RlZFdvcmtmbG93cyIsIkNyZWF0aW5nU3RlcCIsInQwIiwiJCIsIl9jIiwidDEiLCJ1bmRlZmluZWQiLCJ0MiIsImxlbmd0aCIsInByb2dyZXNzU3RlcHMiLCJ0MyIsIlN5bWJvbCIsImZvciIsInQ0IiwibWFwIiwic3RlcFRleHQiLCJpbmRleCIsInN0YXR1cyJdLCJzb3VyY2VzIjpbIkNyZWF0aW5nU3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBXb3JrZmxvdyB9IGZyb20gJy4vdHlwZXMuanMnXG5cbmludGVyZmFjZSBDcmVhdGluZ1N0ZXBQcm9wcyB7XG4gIGN1cnJlbnRXb3JrZmxvd0luc3RhbGxTdGVwOiBudW1iZXJcbiAgc2VjcmV0RXhpc3RzOiBib29sZWFuXG4gIHVzZUV4aXN0aW5nU2VjcmV0OiBib29sZWFuXG4gIHNlY3JldE5hbWU6IHN0cmluZ1xuICBza2lwV29ya2Zsb3c/OiBib29sZWFuXG4gIHNlbGVjdGVkV29ya2Zsb3dzOiBXb3JrZmxvd1tdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDcmVhdGluZ1N0ZXAoe1xuICBjdXJyZW50V29ya2Zsb3dJbnN0YWxsU3RlcCxcbiAgc2VjcmV0RXhpc3RzLFxuICB1c2VFeGlzdGluZ1NlY3JldCxcbiAgc2VjcmV0TmFtZSxcbiAgc2tpcFdvcmtmbG93ID0gZmFsc2UsXG4gIHNlbGVjdGVkV29ya2Zsb3dzLFxufTogQ3JlYXRpbmdTdGVwUHJvcHMpIHtcbiAgY29uc3QgcHJvZ3Jlc3NTdGVwcyA9IHNraXBXb3JrZmxvd1xuICAgID8gW1xuICAgICAgICAnR2V0dGluZyByZXBvc2l0b3J5IGluZm9ybWF0aW9uJyxcbiAgICAgICAgc2VjcmV0RXhpc3RzICYmIHVzZUV4aXN0aW5nU2VjcmV0XG4gICAgICAgICAgPyAnVXNpbmcgZXhpc3RpbmcgQVBJIGtleSBzZWNyZXQnXG4gICAgICAgICAgOiBgU2V0dGluZyB1cCAke3NlY3JldE5hbWV9IHNlY3JldGAsXG4gICAgICBdXG4gICAgOiBbXG4gICAgICAgICdHZXR0aW5nIHJlcG9zaXRvcnkgaW5mb3JtYXRpb24nLFxuICAgICAgICAnQ3JlYXRpbmcgYnJhbmNoJyxcbiAgICAgICAgc2VsZWN0ZWRXb3JrZmxvd3MubGVuZ3RoID4gMVxuICAgICAgICAgID8gJ0NyZWF0aW5nIHdvcmtmbG93IGZpbGVzJ1xuICAgICAgICAgIDogJ0NyZWF0aW5nIHdvcmtmbG93IGZpbGUnLFxuICAgICAgICBzZWNyZXRFeGlzdHMgJiYgdXNlRXhpc3RpbmdTZWNyZXRcbiAgICAgICAgICA/ICdVc2luZyBleGlzdGluZyBBUEkga2V5IHNlY3JldCdcbiAgICAgICAgICA6IGBTZXR0aW5nIHVwICR7c2VjcmV0TmFtZX0gc2VjcmV0YCxcbiAgICAgICAgJ09wZW5pbmcgcHVsbCByZXF1ZXN0IHBhZ2UnLFxuICAgICAgXVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGJvcmRlclN0eWxlPVwicm91bmRcIiBwYWRkaW5nWD17MX0+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgPFRleHQgYm9sZD5JbnN0YWxsIEdpdEh1YiBBcHA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+Q3JlYXRlIEdpdEh1YiBBY3Rpb25zIHdvcmtmbG93PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAge3Byb2dyZXNzU3RlcHMubWFwKChzdGVwVGV4dCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBsZXQgc3RhdHVzOiAnY29tcGxldGVkJyB8ICdpbi1wcm9ncmVzcycgfCAncGVuZGluZycgPSAncGVuZGluZydcblxuICAgICAgICAgIGlmIChpbmRleCA8IGN1cnJlbnRXb3JrZmxvd0luc3RhbGxTdGVwKSB7XG4gICAgICAgICAgICBzdGF0dXMgPSAnY29tcGxldGVkJ1xuICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IGN1cnJlbnRXb3JrZmxvd0luc3RhbGxTdGVwKSB7XG4gICAgICAgICAgICBzdGF0dXMgPSAnaW4tcHJvZ3Jlc3MnXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCb3gga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICAgICAgY29sb3I9e1xuICAgICAgICAgICAgICAgICAgc3RhdHVzID09PSAnY29tcGxldGVkJ1xuICAgICAgICAgICAgICAgICAgICA/ICdzdWNjZXNzJ1xuICAgICAgICAgICAgICAgICAgICA6IHN0YXR1cyA9PT0gJ2luLXByb2dyZXNzJ1xuICAgICAgICAgICAgICAgICAgICAgID8gJ3dhcm5pbmcnXG4gICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7c3RhdHVzID09PSAnY29tcGxldGVkJyA/ICfinJMgJyA6ICcnfVxuICAgICAgICAgICAgICAgIHtzdGVwVGV4dH1cbiAgICAgICAgICAgICAgICB7c3RhdHVzID09PSAnaW4tcHJvZ3Jlc3MnID8gJ+KApicgOiAnJ31cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgKVxuICAgICAgICB9KX1cbiAgICAgIDwvQm94PlxuICAgIDwvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFP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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { Select } from 'src/components/CustomSelect/index.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// ExistingWorkflowStepProps 描述命令处理需要实现的字段和回调，避免跨模块交互时契约漂移。
interface ExistingWorkflowStepProps {
  repoName: string;
  // 这个回调绑定到 onSelectAction: (action: 'update' | 'skip' | 'exit') => void;，负责命令处理在该局部场景下的响应。
  onSelectAction: (action: 'update' | 'skip' | 'exit') => void;
}
// ExistingWorkflowStep 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ExistingWorkflowStep(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(16);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    repoName,
    onSelectAction
  } = t0;
  // t1 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t1 = [{
      label: "Update workflow file with latest version",
      value: "update"
    }, {
      label: "Skip workflow update (configure secrets only)",
      value: "skip"
    }, {
      label: "Exit without making changes",
      value: "exit"
    }];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 选项 命名 `t1`，让后续代码直接表达这个值的用途。
  const options = t1;
  // t2 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onSelectAction) {
    // t2 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = value => {
      // 调用 onSelectAction，触发命令处理此处需要的副作用。
      onSelectAction(value as 'update' | 'skip' | 'exit');
    };
    // $[1] 缓存 `onSelectAction`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onSelectAction;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // handleSelect沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t2;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onSelectAction) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 调用 onSelectAction，触发命令处理此处需要的副作用。
      onSelectAction("exit");
    };
    // $[3] 缓存 `onSelectAction`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onSelectAction;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // handleCancel 命名 `t3`，让后续代码直接表达这个值的用途。
  const handleCancel = t3;
  // t4 暂存 `<Text bold={true}>Existing Workflow Found</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text bold={true}>Existing Workflow Found</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text bold={true}>Existing Workflow Found</Text>;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `<Box flexDirection="column" marginBottom={1}>{t4}<Text di...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== repoName) {
    // t5 暂存 `<Box flexDirection="column" marginBottom={1}>{t4}<Text di...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" marginBottom={1}>{t4}<Text dimColor={true}>Repository: {repoName}</Text></Box>;
    // $[6] 缓存 `repoName`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = repoName;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `<Box flexDirection="column" marginBottom={1}><Text>A Clau...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Box flexDirection="column" marginBottom={1}><Text>A Clau...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" marginBottom={1}><Text>A Claude workflow file already exists at{" "}<Text color="claude">.github/workflows/claude.yml</Text></Text><Text dimColor={true}>What would you like to do?</Text></Box>;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // t7 暂存 `<Box flexDirection="column"><Select options={options} onC...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== handleCancel || $[10] !== handleSelect) {
    // t7 暂存 `<Box flexDirection="column"><Select options={options} onC...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column"><Select options={options} onChange={handleSelect} onCancel={handleCancel} /></Box>;
    // $[9] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = handleCancel;
    // $[10] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = handleSelect;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // t8 暂存 `<Box marginTop={1}><Text dimColor={true}>View the latest ...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Box marginTop={1}><Text dimColor={true}>View the latest ...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box marginTop={1}><Text dimColor={true}>View the latest workflow template at:{" "}<Text color="claude">https://github.com/anthropics/claude-code-action/blob/main/examples/claude.yml</Text></Text></Box>;
    // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[12];
  }
  // t9 暂存 `<Box flexDirection="column" borderStyle="round" borderDim...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t5 || $[14] !== t7) {
    // t9 暂存 `<Box flexDirection="column" borderStyle="round" borderDim...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" borderStyle="round" borderDimColor={true} paddingX={1}>{t5}{t6}{t7}{t8}</Box>;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // 返回 `t9`，作为命令处理这次计算的结果。
  return t9;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlNlbGVjdCIsIkJveCIsIlRleHQiLCJFeGlzdGluZ1dvcmtmbG93U3RlcFByb3BzIiwicmVwb05hbWUiLCJvblNlbGVjdEFjdGlvbiIsImFjdGlvbiIsIkV4aXN0aW5nV29ya2Zsb3dTdGVwIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsImxhYmVsIiwidmFsdWUiLCJvcHRpb25zIiwidDIiLCJoYW5kbGVTZWxlY3QiLCJ0MyIsImhhbmRsZUNhbmNlbCIsInQ0IiwidDUiLCJ0NiIsInQ3IiwidDgiLCJ0OSJdLCJzb3VyY2VzIjpbIkV4aXN0aW5nV29ya2Zsb3dTdGVwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICdzcmMvY29tcG9uZW50cy9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5cbmludGVyZmFjZSBFeGlzdGluZ1dvcmtmbG93U3RlcFByb3BzIHtcbiAgcmVwb05hbWU6IHN0cmluZ1xuICBvblNlbGVjdEFjdGlvbjogKGFjdGlvbjogJ3VwZGF0ZScgfCAnc2tpcCcgfCAnZXhpdCcpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEV4aXN0aW5nV29ya2Zsb3dTdGVwKHtcbiAgcmVwb05hbWUsXG4gIG9uU2VsZWN0QWN0aW9uLFxufTogRXhpc3RpbmdXb3JrZmxvd1N0ZXBQcm9wcykge1xuICBjb25zdCBvcHRpb25zID0gW1xuICAgIHtcbiAgICAgIGxhYmVsOiAnVXBkYXRlIHdvcmtmbG93IGZpbGUgd2l0aCBsYXRlc3QgdmVyc2lvbicsXG4gICAgICB2YWx1ZTogJ3VwZGF0ZScsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ1NraXAgd29ya2Zsb3cgdXBkYXRlIChjb25maWd1cmUgc2VjcmV0cyBvbmx5KScsXG4gICAgICB2YWx1ZTogJ3NraXAnLFxuICAgIH0sXG4gICAge1xuICAgICAgbGFiZWw6ICdFeGl0IHdpdGhvdXQgbWFraW5nIGNoYW5nZXMnLFxuICAgICAgdmFsdWU6ICdleGl0JyxcbiAgICB9LFxuICBdXG5cbiAgY29uc3QgaGFuZGxlU2VsZWN0ID0gKHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBvblNlbGVjdEFjdGlvbih2YWx1ZSBhcyAndXBkYXRlJyB8ICdza2lwJyB8ICdleGl0JylcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZUNhbmNlbCA9ICgpID0+IHtcbiAgICBvblNlbGVjdEFjdGlvbignZXhpdCcpXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGJvcmRlclN0eWxlPVwicm91bmRcIiBib3JkZXJEaW1Db2xvciBwYWRkaW5nWD17MX0+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICA8VGV4dCBib2xkPkV4aXN0aW5nIFdvcmtmbG93IEZvdW5kPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5SZXBvc2l0b3J5OiB7cmVwb05hbWV9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIEEgQ2xhdWRlIHdvcmtmbG93IGZpbGUgYWxyZWFkeSBleGlzdHMgYXR7JyAnfVxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+LmdpdGh1Yi93b3JrZmxvd3MvY2xhdWRlLnltbDwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5XaGF0IHdvdWxkIHlvdSBsaWtlIHRvIGRvPzwvVGV4dD5cbiAgICAgIDwvQm94PlxuXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFNlbGVjdFxuICAgICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XG4gICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVNlbGVjdH1cbiAgICAgICAgICBvbkNhbmNlbD17aGFuZGxlQ2FuY2VsfVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG5cbiAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgVmlldyB0aGUgbGF0ZXN0IHdvcmtmbG93IHRlbXBsYXRlIGF0OnsnICd9XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF1ZGVcIj5cbiAgICAgICAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9hbnRocm9waWNzL2NsYXVkZS1jb2RlLWFjdGlvbi9ibG9iL21haW4vZXhhbXBsZXMvY2xhdWRlLnltbFxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLE1BQU0sUUFBUSxzQ0FBc0M7QUFDN0QsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUV4QyxVQUFVQyx5QkFBeUIsQ0FBQztFQUNsQ0MsUUFBUSxFQUFFLE1BQU07RUFDaEJDLGNBQWMsRUFBRSxDQUFDQyxNQUFNLEVBQUUsUUFBUSxHQUFHLE1BQU0sR0FBRyxNQUFNLEVBQUUsR0FBRyxJQUFJO0FBQzlEO0FBRUEsT0FBTyxTQUFBQyxxQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUE4QjtJQUFBTixRQUFBO0lBQUFDO0VBQUEsSUFBQUcsRUFHVDtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUNWRixFQUFBLElBQ2Q7TUFBQUcsS0FBQSxFQUNTLDBDQUEwQztNQUFBQyxLQUFBLEVBQzFDO0lBQ1QsQ0FBQyxFQUNEO01BQUFELEtBQUEsRUFDUywrQ0FB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
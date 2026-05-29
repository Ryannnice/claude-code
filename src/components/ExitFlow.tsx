// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 sample，将 lodash-es/sample.js 中已经封装好的能力接到本文件流程里。
import sample from 'lodash-es/sample.js';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 gracefulShutdown 工具函数，把通用处理留在 ../utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from '../utils/gracefulShutdown.js';
// 引入 WorktreeExitDialog，将 ./WorktreeExitDialog.js 中已经封装好的能力接到本文件流程里。
import { WorktreeExitDialog } from './WorktreeExitDialog.js';
// GOODBYE_MESSAGES 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
const GOODBYE_MESSAGES = ['Goodbye!', 'See ya!', 'Bye!', 'Catch you later!'];
// getRandomGoodbyeMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRandomGoodbyeMessage(): string {
  // 返回 `sample(GOODBYE_MESSAGES) ?? 'Goodbye!'`，作为终端渲染这次计算的结果。
  return sample(GOODBYE_MESSAGES) ?? 'Goodbye!';
}
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: (message?: string) => void;，负责终端渲染在该局部场景下的响应。
  onDone: (message?: string) => void;
  onCancel?: () => void;
  showWorktree: boolean;
};
// ExitFlow 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ExitFlow(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    showWorktree,
    onDone,
    onCancel
  } = t0;
  // t1 暂存 `async function onExit(resultMessage) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone) {
    // t1 暂存 `async function onExit(resultMessage) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = async function onExit(resultMessage) {
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone(resultMessage ?? getRandomGoodbyeMessage());
      // 等待 `gracefulShutdown(0, "prompt_input_exit")` 完成，再继续终端 UI 组件 Exit Flow的异步流程。
      await gracefulShutdown(0, "prompt_input_exit");
    };
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // onExit沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const onExit = t1;
  // 满足 `showWorktree` 时，终端渲染执行该分支。
  if (showWorktree) {
    // t2 暂存 `<WorktreeExitDialog onDone={onExit} onCancel={onCancel} />` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[2] !== onCancel || $[3] !== onExit) {
      // t2 暂存 `<WorktreeExitDialog onDone={onExit} onCancel={onCancel} />` 生成的渲染片段，后续返回路径直接复用。
      t2 = <WorktreeExitDialog onDone={onExit} onCancel={onCancel} />;
      // $[2] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = onCancel;
      // $[3] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = onExit;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[4];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzYW1wbGUiLCJSZWFjdCIsImdyYWNlZnVsU2h1dGRvd24iLCJXb3JrdHJlZUV4aXREaWFsb2ciLCJHT09EQllFX01FU1NBR0VTIiwiZ2V0UmFuZG9tR29vZGJ5ZU1lc3NhZ2UiLCJQcm9wcyIsIm9uRG9uZSIsIm1lc3NhZ2UiLCJvbkNhbmNlbCIsInNob3dXb3JrdHJlZSIsIkV4aXRGbG93IiwidDAiLCIkIiwiX2MiLCJ0MSIsIm9uRXhpdCIsInJlc3VsdE1lc3NhZ2UiLCJ0MiJdLCJzb3VyY2VzIjpbIkV4aXRGbG93LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc2FtcGxlIGZyb20gJ2xvZGFzaC1lcy9zYW1wbGUuanMnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBncmFjZWZ1bFNodXRkb3duIH0gZnJvbSAnLi4vdXRpbHMvZ3JhY2VmdWxTaHV0ZG93bi5qcydcbmltcG9ydCB7IFdvcmt0cmVlRXhpdERpYWxvZyB9IGZyb20gJy4vV29ya3RyZWVFeGl0RGlhbG9nLmpzJ1xuXG5jb25zdCBHT09EQllFX01FU1NBR0VTID0gWydHb29kYnllIScsICdTZWUgeWEhJywgJ0J5ZSEnLCAnQ2F0Y2ggeW91IGxhdGVyISddXG5cbmZ1bmN0aW9uIGdldFJhbmRvbUdvb2RieWVNZXNzYWdlKCk6IHN0cmluZyB7XG4gIHJldHVybiBzYW1wbGUoR09PREJZRV9NRVNTQUdFUykgPz8gJ0dvb2RieWUhJ1xufVxuXG50eXBlIFByb3BzID0ge1xuICBvbkRvbmU6IChtZXNzYWdlPzogc3RyaW5nKSA9PiB2b2lkXG4gIG9uQ2FuY2VsPzogKCkgPT4gdm9pZFxuICBzaG93V29ya3RyZWU6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEV4aXRGbG93KHtcbiAgc2hvd1dvcmt0cmVlLFxuICBvbkRvbmUsXG4gIG9uQ2FuY2VsLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBhc3luYyBmdW5jdGlvbiBvbkV4aXQocmVzdWx0TWVzc2FnZT86IHN0cmluZykge1xuICAgIG9uRG9uZShyZXN1bHRNZXNzYWdlID8/IGdldFJhbmRvbUdvb2RieWVNZXNzYWdlKCkpXG4gICAgYXdhaXQgZ3JhY2VmdWxTaHV0ZG93bigwLCAncHJvbXB0X2lucHV0X2V4aXQnKVxuICB9XG5cbiAgaWYgKHNob3dXb3JrdHJlZSkge1xuICAgIHJldHVybiA8V29ya3RyZWVFeGl0RGlhbG9nIG9uRG9uZT17b25FeGl0fSBvbkNhbmNlbD17b25DYW5jZWx9IC8+XG4gIH1cblxuICByZXR1cm4gbnVsbFxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsTUFBTSxNQUFNLHFCQUFxQjtBQUN4QyxPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxnQkFBZ0IsUUFBUSw4QkFBOEI7QUFDL0QsU0FBU0Msa0JBQWtCLFFBQVEseUJBQXlCO0FBRTVELE1BQU1DLGdCQUFnQixHQUFHLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLENBQUM7QUFFNUUsU0FBU0MsdUJBQXVCQSxDQUFBLENBQUUsRUFBRSxNQUFNLENBQUM7RUFDekMsT0FBT0wsTUFBTSxDQUFDSSxnQkFBZ0IsQ0FBQyxJQUFJLFVBQVU7QUFDL0M7QUFFQSxLQUFLRSxLQUFLLEdBQUc7RUFDWEMsTUFBTSxFQUFFLENBQUNDLE9BQWdCLENBQVIsRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJO0VBQ2xDQyxRQUFRLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSTtFQUNyQkMsWUFBWSxFQUFFLE9BQU87QUFDdkIsQ0FBQztBQUVELE9BQU8sU0FBQUMsU0FBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFrQjtJQUFBSixZQUFBO0lBQUFILE1BQUE7SUFBQUU7RUFBQSxJQUFBRyxFQUlqQjtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFOLE1BQUE7SUFDTlEsRUFBQSxrQkFBQUMsT0FBQUMsYUFBQTtNQUNFVixNQUFNLENBQUNVLGFBQTBDLElBQXpCWix1QkFBdUIsQ0FBQyxDQUFDLENBQUM7TUFDbEQsTUFBTUgsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixDQUFDO0lBQUEsQ0FDL0M7SUFBQVcsQ0FBQSxNQUFBTixNQUFBO0lBQUFNLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBSEQsTUFBQUcsTUFBQSxHQUFBRCxFQUdDO0VBRUQsSUFBSUwsWUFBWTtJQUFBLElBQUFRLEVBQUE7SUFBQSxJQUFBTCxDQUFBLFFBQUFKLFFBQUEsSUFBQUksQ0FBQSxRQUFBRyxNQUFBO01BQ1BFLEVBQUEsSUFBQyxrQkFBa0IsQ0FBU0YsTUFBTSxDQUFOQSxPQUFLLENBQUMsQ0FBWVAsUUFBUSxDQUFSQSxTQUFPLENBQUMsR0FBSTtNQUFBSSxDQUFBLE1BQUFKLFFBQUE7TUFBQUksQ0FBQSxNQUFBRyxNQUFBO01BQUFILENBQUEsTUFBQUssRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQUwsQ0FBQTtJQUFBO0lBQUEsT0FBMURLLEVBQTBEO0VBQUE7RUFDbEUsT0FFTSxJQUFJO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
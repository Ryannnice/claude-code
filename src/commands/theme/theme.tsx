// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 复用 Pane 终端界面组件，避免在这里重复拼装显示逻辑。
import { Pane } from '../../components/design-system/Pane.js';
// 复用 ThemePicker 终端界面组件，避免在这里重复拼装显示逻辑。
import { ThemePicker } from '../../components/ThemePicker.js';
// 引入 useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { useTheme } from '../../ink.js';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// Props 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onDone: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// ThemePickerCommand 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ThemePickerCommand(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // 从 `useTheme()` 按位置拆出 setTheme，让斜杠命令 theme分别处理这些返回值。
  const [, setTheme] = useTheme();
  // t1 暂存 `setting => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone || $[1] !== setTheme) {
    // t1 暂存 `setting => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = setting => {
      // setTheme 写入新的状态值，使命令处理后续读取保持一致。
      setTheme(setting);
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Theme set to ${setting}`);
    };
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `setTheme`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = setTheme;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onDone) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone("Theme picker dismissed", {
        display: "system"
      });
    };
    // $[3] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onDone;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Pane color="permission"><ThemePicker onThemeSelect={t1} ...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t1 || $[6] !== t2) {
    // t3 暂存 `<Pane color="permission"><ThemePicker onThemeSelect={t1} ...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Pane color="permission"><ThemePicker onThemeSelect={t1} onCancel={t2} skipExitHandling={true} /></Pane>;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // 返回 `t3`，作为命令处理这次计算的结果。
  return t3;
}
// 这个回调绑定到 export const call: LocalJSXCommandCall = async (onDone, _context) => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = async (onDone, _context) => {
  // 返回 `<ThemePickerCommand onDone={onDone} />`，作为命令处理这次计算的结果。
  return <ThemePickerCommand onDone={onDone} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkNvbW1hbmRSZXN1bHREaXNwbGF5IiwiUGFuZSIsIlRoZW1lUGlja2VyIiwidXNlVGhlbWUiLCJMb2NhbEpTWENvbW1hbmRDYWxsIiwiUHJvcHMiLCJvbkRvbmUiLCJyZXN1bHQiLCJvcHRpb25zIiwiZGlzcGxheSIsIlRoZW1lUGlja2VyQ29tbWFuZCIsInQwIiwiJCIsIl9jIiwic2V0VGhlbWUiLCJ0MSIsInNldHRpbmciLCJ0MiIsInQzIiwiY2FsbCIsIl9jb250ZXh0Il0sInNvdXJjZXMiOlsidGhlbWUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBDb21tYW5kUmVzdWx0RGlzcGxheSB9IGZyb20gJy4uLy4uL2NvbW1hbmRzLmpzJ1xuaW1wb3J0IHsgUGFuZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvZGVzaWduLXN5c3RlbS9QYW5lLmpzJ1xuaW1wb3J0IHsgVGhlbWVQaWNrZXIgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL1RoZW1lUGlja2VyLmpzJ1xuaW1wb3J0IHsgdXNlVGhlbWUgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZENhbGwgfSBmcm9tICcuLi8uLi90eXBlcy9jb21tYW5kLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBvbkRvbmU6IChcbiAgICByZXN1bHQ/OiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHsgZGlzcGxheT86IENvbW1hbmRSZXN1bHREaXNwbGF5IH0sXG4gICkgPT4gdm9pZFxufVxuXG5mdW5jdGlvbiBUaGVtZVBpY2tlckNvbW1hbmQoeyBvbkRvbmUgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbLCBzZXRUaGVtZV0gPSB1c2VUaGVtZSgpXG5cbiAgcmV0dXJuIChcbiAgICA8UGFuZSBjb2xvcj1cInBlcm1pc3Npb25cIj5cbiAgICAgIDxUaGVtZVBpY2tlclxuICAgICAgICBvblRoZW1lU2VsZWN0PXtzZXR0aW5nID0+IHtcbiAgICAgICAgICBzZXRUaGVtZShzZXR0aW5nKVxuICAgICAgICAgIG9uRG9uZShgVGhlbWUgc2V0IHRvICR7c2V0dGluZ31gKVxuICAgICAgICB9fVxuICAgICAgICBvbkNhbmNlbD17KCkgPT4ge1xuICAgICAgICAgIG9uRG9uZSgnVGhlbWUgcGlja2VyIGRpc21pc3NlZCcsIHsgZGlzcGxheTogJ3N5c3RlbScgfSlcbiAgICAgICAgfX1cbiAgICAgICAgc2tpcEV4aXRIYW5kbGluZz17dHJ1ZX1cbiAgICAgIC8+XG4gICAgPC9QYW5lPlxuICApXG59XG5cbmV4cG9ydCBjb25zdCBjYWxsOiBMb2NhbEpTWENvbW1hbmRDYWxsID0gYXN5bmMgKG9uRG9uZSwgX2NvbnRleHQpID0+IHtcbiAgcmV0dXJuIDxUaGVtZVBpY2tlckNvbW1hbmQgb25Eb25lPXtvbkRvbmV9IC8+XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLGNBQWNDLG9CQUFvQixRQUFRLG1CQUFtQjtBQUM3RCxTQUFTQyxJQUFJLFFBQVEsd0NBQXdDO0FBQzdELFNBQVNDLFdBQVcsUUFBUSxpQ0FBaUM7QUFDN0QsU0FBU0MsUUFBUSxRQUFRLGNBQWM7QUFDdkMsY0FBY0MsbUJBQW1CLFFBQVEsd0JBQXdCO0FBRWpFLEtBQUtDLEtBQUssR0FBRztFQUNYQyxNQUFNLEVBQUUsQ0FDTkMsTUFBZSxDQUFSLEVBQUUsTUFBTSxFQUNmQyxPQUE0QyxDQUFwQyxFQUFFO0lBQUVDLE9BQU8sQ0FBQyxFQUFFVCxvQkFBb0I7RUFBQyxDQUFDLEVBQzVDLEdBQUcsSUFBSTtBQUNYLENBQUM7QUFFRCxTQUFBVSxtQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUE0QjtJQUFBUDtFQUFBLElBQUFLLEVBQWlCO0VBQzNDLFNBQUFHLFFBQUEsSUFBcUJYLFFBQVEsQ0FBQyxDQUFDO0VBQUEsSUFBQVksRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQU4sTUFBQSxJQUFBTSxDQUFBLFFBQUFFLFFBQUE7SUFLVkMsRUFBQSxHQUFBQyxPQUFBO01BQ2JGLFFBQVEsQ0FBQ0UsT0FBTyxDQUFDO01BQ2pCVixNQUFNLENBQUMsZ0JBQWdCVSxPQUFPLEVBQUUsQ0FBQztJQUFBLENBQ2xDO0lBQUFKLENBQUEsTUFBQU4sTUFBQTtJQUFBTSxDQUFBLE1BQUFFLFFBQUE7SUFBQUYsQ0FBQSxNQUFBRyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSCxDQUFBO0VBQUE7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBTixNQUFBO0lBQ1NXLEVBQUEsR0FBQUEsQ0FBQTtNQUNSWCxNQUFNLENBQUMsd0JBQXdCLEVBQUU7UUFBQUcsT0FBQSxFQUFXO01BQVMsQ0FBQyxDQUFDO0lBQUEsQ0FDeEQ7SUFBQUcsQ0FBQSxNQUFBTixNQUFBO0lBQUFNLENBQUEsTUFBQUssRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUwsQ0FBQTtFQUFBO0VBQUEsSUFBQU0sRUFBQTtFQUFBLElBQUFOLENBQUEsUUFBQUcsRUFBQSxJQUFBSCxDQUFBLFFBQUFLLEVBQUE7SUFSTEMsRUFBQSxJQUFDLElBQUksQ0FBTyxLQUFZLENBQVosWUFBWSxDQUN0QixDQUFDLFdBQVcsQ0FDSyxhQUdkLENBSGMsQ0FBQUgsRUFHZixDQUFDLENBQ1MsUUFFVCxDQUZTLENBQUFFLEVBRVYsQ0FBQyxDQUNpQixnQkFBSSxDQUFKLEtBQUcsQ0FBQyxHQUUxQixFQVhDLElBQUksQ0FXRTtJQUFBTCxDQUFBLE1BQUFHLEVBQUE7SUFBQUgsQ0FBQSxNQUFBSyxFQUFBO0lBQUFMLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBQUEsT0FYUE0sRUFXTztBQUFBO0FBSVgsT0FBTyxNQUFNQyxJQUFJLEVBQUVmLG1CQUFtQixHQUFHLE1BQUFlLENBQU9iLE1BQU0sRUFBRWMsUUFBUSxLQUFLO0VBQ25FLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQ2QsTUFBTSxDQUFDLEdBQUc7QUFDL0MsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==
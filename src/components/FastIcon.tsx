// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 LIGHTNING_BOLT，将 ../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { LIGHTNING_BOLT } from '../constants/figures.js';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js';
// 复用 resolveThemeSetting 工具函数，把通用处理留在 ../utils/systemTheme.js 中维护。
import { resolveThemeSetting } from '../utils/systemTheme.js';
// 引入 color，将 ./design-system/color.js 中已经封装好的能力接到本文件流程里。
import { color } from './design-system/color.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  cooldown?: boolean;
};
// FastIcon 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FastIcon(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    cooldown
  } = t0;
  // 满足 `cooldown` 时，终端渲染执行该分支。
  if (cooldown) {
    // t1 暂存 `<Text color="promptBorder" dimColor={true}>{LIGHTNING_BOL...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Text color="promptBorder" dimColor={true}>{LIGHTNING_BOL...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text color="promptBorder" dimColor={true}>{LIGHTNING_BOLT}</Text>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `<Text color="fastMode">{LIGHTNING_BOLT}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text color="fastMode">{LIGHTNING_BOLT}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color="fastMode">{LIGHTNING_BOLT}</Text>;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// getFastIconString 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFastIconString(applyColor = true, cooldown = false): string {
  // applyColor缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!applyColor) {
    // 返回 `LIGHTNING_BOLT`，作为终端渲染这次计算的结果。
    return LIGHTNING_BOLT;
  }
  // 主题名称读取`resolveThemeSetting`，供终端渲染后续处理使用。
  const themeName = resolveThemeSetting(getGlobalConfig().theme);
  // 满足 `cooldown` 时，终端渲染执行该分支。
  if (cooldown) {
    // 返回 `chalk.dim(color('promptBorder', themeName)(LIGHTNING_BOLT))`，作为终端渲染这次计算的结果。
    return chalk.dim(color('promptBorder', themeName)(LIGHTNING_BOLT));
  }
  // 返回 `color('fastMode', themeName)(LIGHTNING_BOLT)`，作为终端渲染这次计算的结果。
  return color('fastMode', themeName)(LIGHTNING_BOLT);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsIlJlYWN0IiwiTElHSFROSU5HX0JPTFQiLCJUZXh0IiwiZ2V0R2xvYmFsQ29uZmlnIiwicmVzb2x2ZVRoZW1lU2V0dGluZyIsImNvbG9yIiwiUHJvcHMiLCJjb29sZG93biIsIkZhc3RJY29uIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsImdldEZhc3RJY29uU3RyaW5nIiwiYXBwbHlDb2xvciIsInRoZW1lTmFtZSIsInRoZW1lIiwiZGltIl0sInNvdXJjZXMiOlsiRmFzdEljb24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgTElHSFROSU5HX0JPTFQgfSBmcm9tICcuLi9jb25zdGFudHMvZmlndXJlcy5qcydcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBnZXRHbG9iYWxDb25maWcgfSBmcm9tICcuLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgeyByZXNvbHZlVGhlbWVTZXR0aW5nIH0gZnJvbSAnLi4vdXRpbHMvc3lzdGVtVGhlbWUuanMnXG5pbXBvcnQgeyBjb2xvciB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9jb2xvci5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgY29vbGRvd24/OiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBGYXN0SWNvbih7IGNvb2xkb3duIH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKGNvb2xkb3duKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxUZXh0IGNvbG9yPVwicHJvbXB0Qm9yZGVyXCIgZGltQ29sb3I+XG4gICAgICAgIHtMSUdIVE5JTkdfQk9MVH1cbiAgICAgIDwvVGV4dD5cbiAgICApXG4gIH1cbiAgcmV0dXJuIDxUZXh0IGNvbG9yPVwiZmFzdE1vZGVcIj57TElHSFROSU5HX0JPTFR9PC9UZXh0PlxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFzdEljb25TdHJpbmcoYXBwbHlDb2xvciA9IHRydWUsIGNvb2xkb3duID0gZmFsc2UpOiBzdHJpbmcge1xuICBpZiAoIWFwcGx5Q29sb3IpIHtcbiAgICByZXR1cm4gTElHSFROSU5HX0JPTFRcbiAgfVxuICBjb25zdCB0aGVtZU5hbWUgPSByZXNvbHZlVGhlbWVTZXR0aW5nKGdldEdsb2JhbENvbmZpZygpLnRoZW1lKVxuICBpZiAoY29vbGRvd24pIHtcbiAgICByZXR1cm4gY2hhbGsuZGltKGNvbG9yKCdwcm9tcHRCb3JkZXInLCB0aGVtZU5hbWUpKExJR0hUTklOR19CT0xUKSlcbiAgfVxuICByZXR1cm4gY29sb3IoJ2Zhc3RNb2RlJywgdGhlbWVOYW1lKShMSUdIVE5JTkdfQk9MVClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsY0FBYyxRQUFRLHlCQUF5QjtBQUN4RCxTQUFTQyxJQUFJLFFBQVEsV0FBVztBQUNoQyxTQUFTQyxlQUFlLFFBQVEsb0JBQW9CO0FBQ3BELFNBQVNDLG1CQUFtQixRQUFRLHlCQUF5QjtBQUM3RCxTQUFTQyxLQUFLLFFBQVEsMEJBQTBCO0FBRWhELEtBQUtDLEtBQUssR0FBRztFQUNYQyxRQUFRLENBQUMsRUFBRSxPQUFPO0FBQ3BCLENBQUM7QUFFRCxPQUFPLFNBQUFDLFNBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBa0I7SUFBQUo7RUFBQSxJQUFBRSxFQUFtQjtFQUMxQyxJQUFJRixRQUFRO0lBQUEsSUFBQUssRUFBQTtJQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO01BRVJGLEVBQUEsSUFBQyxJQUFJLENBQU8sS0FBYyxDQUFkLGNBQWMsQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQ2hDWCxlQUFhLENBQ2hCLEVBRkMsSUFBSSxDQUVFO01BQUFTLENBQUEsTUFBQUUsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQUYsQ0FBQTtJQUFBO0lBQUEsT0FGUEUsRUFFTztFQUFBO0VBRVYsSUFBQUEsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBQ01GLEVBQUEsSUFBQyxJQUFJLENBQU8sS0FBVSxDQUFWLFVBQVUsQ0FBRVgsZUFBYSxDQUFFLEVBQXRDLElBQUksQ0FBeUM7SUFBQVMsQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxPQUE5Q0UsRUFBOEM7QUFBQTtBQUd2RCxPQUFPLFNBQVNHLGlCQUFpQkEsQ0FBQ0MsVUFBVSxHQUFHLElBQUksRUFBRVQsUUFBUSxHQUFHLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQztFQUM3RSxJQUFJLENBQUNTLFVBQVUsRUFBRTtJQUNmLE9BQU9mLGNBQWM7RUFDdkI7RUFDQSxNQUFNZ0IsU0FBUyxHQUFHYixtQkFBbUIsQ0FBQ0QsZUFBZSxDQUFDLENBQUMsQ0FBQ2UsS0FBSyxDQUFDO0VBQzlELElBQUlYLFFBQVEsRUFBRTtJQUNaLE9BQU9SLEtBQUssQ0FBQ29CLEdBQUcsQ0FBQ2QsS0FBSyxDQUFDLGNBQWMsRUFBRVksU0FBUyxDQUFDLENBQUNoQixjQUFjLENBQUMsQ0FBQztFQUNwRTtFQUNBLE9BQU9JLEtBQUssQ0FBQyxVQUFVLEVBQUVZLFNBQVMsQ0FBQyxDQUFDaEIsY0FBYyxDQUFDO0FBQ3JEIiwiaWdub3JlTGlzdCI6W119
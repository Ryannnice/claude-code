// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 pathToFileURL，将 url 中已经封装好的能力接到本文件流程里。
import { pathToFileURL } from 'url';
// 复用 Link 终端界面组件，避免在这里重复拼装显示逻辑。
import Link from '../ink/components/Link.js';
// 复用 supportsHyperlinks 终端界面组件，避免在这里重复拼装显示逻辑。
import { supportsHyperlinks } from '../ink/supports-hyperlinks.js';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 复用 getStoredImagePath 工具函数，把通用处理留在 ../utils/imageStore.js 中维护。
import { getStoredImagePath } from '../utils/imageStore.js';
// 类型依赖 { Theme } 来自 ../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../utils/theme.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  imageId: number;
  backgroundColor?: keyof Theme;
  isSelected?: boolean;
};

/**
 * Renders an image reference like [Image #1] as a clickable link.
 * When clicked, opens the stored image file in the default viewer.
 *
 * Falls back to styled text if:
 * - Terminal doesn't support hyperlinks
 * - Image file is not found in the store
 */
// ClickableImageRef 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ClickableImageRef(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    imageId,
    backgroundColor,
    isSelected: t1
  } = t0;
  // isSelected标记终端 UI Clickable Image Ref是否启用对应路径。
  const isSelected = t1 === undefined ? false : t1;
  // imagePath 路径数据读取`getStoredImagePath`，供终端渲染后续处理使用。
  const imagePath = getStoredImagePath(imageId);
  // displayText固定为 ``[Image #${imageId}]``，作为终端 UI Clickable Image Ref后续展示或比较的基准。
  const displayText = `[Image #${imageId}]`;
  // 只有 `imagePath && supportsHyperlinks()` 满足时，终端渲染才执行该分支。
  if (imagePath && supportsHyperlinks()) {
    // fileUrl 文件数据保存`pathToFileURL`，供终端渲染后续处理使用。
    const fileUrl = pathToFileURL(imagePath).href;
    // t2 暂存 `<Text backgroundColor={backgroundColor} inverse={isSelect...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // t3 暂存 `<Text backgroundColor={backgroundColor} inverse={isSelect...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== backgroundColor || $[1] !== displayText || $[2] !== isSelected) {
      // t2 暂存 `<Text backgroundColor={backgroundColor} inverse={isSelect...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text backgroundColor={backgroundColor} inverse={isSelected}>{displayText}</Text>;
      // t3 暂存 `<Text backgroundColor={backgroundColor} inverse={isSelect...` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text backgroundColor={backgroundColor} inverse={isSelected} bold={isSelected}>{displayText}</Text>;
      // $[0] 缓存 `backgroundColor`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = backgroundColor;
      // $[1] 缓存 `displayText`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = displayText;
      // $[2] 缓存 `isSelected`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = isSelected;
      // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t2;
      // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t3;
    } else {
      // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[3];
      // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[4];
    }
    // t4 暂存 `<Link url={fileUrl} fallback={t2}>{t3}</Link>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== fileUrl || $[6] !== t2 || $[7] !== t3) {
      // t4 暂存 `<Link url={fileUrl} fallback={t2}>{t3}</Link>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Link url={fileUrl} fallback={t2}>{t3}</Link>;
      // $[5] 缓存 `fileUrl`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = fileUrl;
      // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t2;
      // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t3;
      // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[8];
    }
    // 返回 `t4`，作为终端渲染这次计算的结果。
    return t4;
  }
  // t2 暂存 `<Text backgroundColor={backgroundColor} inverse={isSelect...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== backgroundColor || $[10] !== displayText || $[11] !== isSelected) {
    // t2 暂存 `<Text backgroundColor={backgroundColor} inverse={isSelect...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text backgroundColor={backgroundColor} inverse={isSelected}>{displayText}</Text>;
    // $[9] 缓存 `backgroundColor`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = backgroundColor;
    // $[10] 缓存 `displayText`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = displayText;
    // $[11] 缓存 `isSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = isSelected;
    // $[12] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[12];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInBhdGhUb0ZpbGVVUkwiLCJMaW5rIiwic3VwcG9ydHNIeXBlcmxpbmtzIiwiVGV4dCIsImdldFN0b3JlZEltYWdlUGF0aCIsIlRoZW1lIiwiUHJvcHMiLCJpbWFnZUlkIiwiYmFja2dyb3VuZENvbG9yIiwiaXNTZWxlY3RlZCIsIkNsaWNrYWJsZUltYWdlUmVmIiwidDAiLCIkIiwiX2MiLCJ0MSIsInVuZGVmaW5lZCIsImltYWdlUGF0aCIsImRpc3BsYXlUZXh0IiwiZmlsZVVybCIsImhyZWYiLCJ0MiIsInQzIiwidDQiXSwic291cmNlcyI6WyJDbGlja2FibGVJbWFnZVJlZi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBwYXRoVG9GaWxlVVJMIH0gZnJvbSAndXJsJ1xuaW1wb3J0IExpbmsgZnJvbSAnLi4vaW5rL2NvbXBvbmVudHMvTGluay5qcydcbmltcG9ydCB7IHN1cHBvcnRzSHlwZXJsaW5rcyB9IGZyb20gJy4uL2luay9zdXBwb3J0cy1oeXBlcmxpbmtzLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGdldFN0b3JlZEltYWdlUGF0aCB9IGZyb20gJy4uL3V0aWxzL2ltYWdlU3RvcmUuanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lIH0gZnJvbSAnLi4vdXRpbHMvdGhlbWUuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGltYWdlSWQ6IG51bWJlclxuICBiYWNrZ3JvdW5kQ29sb3I/OiBrZXlvZiBUaGVtZVxuICBpc1NlbGVjdGVkPzogYm9vbGVhblxufVxuXG4vKipcbiAqIFJlbmRlcnMgYW4gaW1hZ2UgcmVmZXJlbmNlIGxpa2UgW0ltYWdlICMxXSBhcyBhIGNsaWNrYWJsZSBsaW5rLlxuICogV2hlbiBjbGlja2VkLCBvcGVucyB0aGUgc3RvcmVkIGltYWdlIGZpbGUgaW4gdGhlIGRlZmF1bHQgdmlld2VyLlxuICpcbiAqIEZhbGxzIGJhY2sgdG8gc3R5bGVkIHRleHQgaWY6XG4gKiAtIFRlcm1pbmFsIGRvZXNuJ3Qgc3VwcG9ydCBoeXBlcmxpbmtzXG4gKiAtIEltYWdlIGZpbGUgaXMgbm90IGZvdW5kIGluIHRoZSBzdG9yZVxuICovXG5leHBvcnQgZnVuY3Rpb24gQ2xpY2thYmxlSW1hZ2VSZWYoe1xuICBpbWFnZUlkLFxuICBiYWNrZ3JvdW5kQ29sb3IsXG4gIGlzU2VsZWN0ZWQgPSBmYWxzZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgaW1hZ2VQYXRoID0gZ2V0U3RvcmVkSW1hZ2VQYXRoKGltYWdlSWQpXG4gIGNvbnN0IGRpc3BsYXlUZXh0ID0gYFtJbWFnZSAjJHtpbWFnZUlkfV1gXG5cbiAgLy8gSWYgd2UgaGF2ZSBhIHN0b3JlZCBpbWFnZSBhbmQgdGVybWluYWwgc3VwcG9ydHMgaHlwZXJsaW5rcywgbWFrZSBpdCBjbGlja2FibGVcbiAgaWYgKGltYWdlUGF0aCAmJiBzdXBwb3J0c0h5cGVybGlua3MoKSkge1xuICAgIGNvbnN0IGZpbGVVcmwgPSBwYXRoVG9GaWxlVVJMKGltYWdlUGF0aCkuaHJlZlxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxMaW5rXG4gICAgICAgIHVybD17ZmlsZVVybH1cbiAgICAgICAgZmFsbGJhY2s9e1xuICAgICAgICAgIDxUZXh0IGJhY2tncm91bmRDb2xvcj17YmFja2dyb3VuZENvbG9yfSBpbnZlcnNlPXtpc1NlbGVjdGVkfT5cbiAgICAgICAgICAgIHtkaXNwbGF5VGV4dH1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIH1cbiAgICAgID5cbiAgICAgICAgPFRleHRcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I9e2JhY2tncm91bmRDb2xvcn1cbiAgICAgICAgICBpbnZlcnNlPXtpc1NlbGVjdGVkfVxuICAgICAgICAgIGJvbGQ9e2lzU2VsZWN0ZWR9XG4gICAgICAgID5cbiAgICAgICAgICB7ZGlzcGxheVRleHR9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvTGluaz5cbiAgICApXG4gIH1cblxuICAvLyBGYWxsYmFjazogc3R5bGVkIGJ1dCBub3QgY2xpY2thYmxlXG4gIHJldHVybiAoXG4gICAgPFRleHQgYmFja2dyb3VuZENvbG9yPXtiYWNrZ3JvdW5kQ29sb3J9IGludmVyc2U9e2lzU2VsZWN0ZWR9PlxuICAgICAge2Rpc3BsYXlUZXh0fVxuICAgIDwvVGV4dD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxhQUFhLFFBQVEsS0FBSztBQUNuQyxPQUFPQyxJQUFJLE1BQU0sMkJBQTJCO0FBQzVDLFNBQVNDLGtCQUFrQixRQUFRLCtCQUErQjtBQUNsRSxTQUFTQyxJQUFJLFFBQVEsV0FBVztBQUNoQyxTQUFTQyxrQkFBa0IsUUFBUSx3QkFBd0I7QUFDM0QsY0FBY0MsS0FBSyxRQUFRLG1CQUFtQjtBQUU5QyxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsT0FBTyxFQUFFLE1BQU07RUFDZkMsZUFBZSxDQUFDLEVBQUUsTUFBTUgsS0FBSztFQUM3QkksVUFBVSxDQUFDLEVBQUUsT0FBTztBQUN0QixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFDLGtCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQTJCO0lBQUFOLE9BQUE7SUFBQUMsZUFBQTtJQUFBQyxVQUFBLEVBQUFLO0VBQUEsSUFBQUgsRUFJMUI7RUFETixNQUFBRixVQUFBLEdBQUFLLEVBQWtCLEtBQWxCQyxTQUFrQixHQUFsQixLQUFrQixHQUFsQkQsRUFBa0I7RUFFbEIsTUFBQUUsU0FBQSxHQUFrQlosa0JBQWtCLENBQUNHLE9BQU8sQ0FBQztFQUM3QyxNQUFBVSxXQUFBLEdBQW9CLFdBQVdWLE9BQU8sR0FBRztFQUd6QyxJQUFJUyxTQUFpQyxJQUFwQmQsa0JBQWtCLENBQUMsQ0FBQztJQUNuQyxNQUFBZ0IsT0FBQSxHQUFnQmxCLGFBQWEsQ0FBQ2dCLFNBQVMsQ0FBQyxDQUFBRyxJQUFLO0lBQUEsSUFBQUMsRUFBQTtJQUFBLElBQUFDLEVBQUE7SUFBQSxJQUFBVCxDQUFBLFFBQUFKLGVBQUEsSUFBQUksQ0FBQSxRQUFBSyxXQUFBLElBQUFMLENBQUEsUUFBQUgsVUFBQTtNQU12Q1csRUFBQSxJQUFDLElBQUksQ0FBa0JaLGVBQWUsQ0FBZkEsZ0JBQWMsQ0FBQyxDQUFXQyxPQUFVLENBQVZBLFdBQVMsQ0FBQyxDQUN4RFEsWUFBVSxDQUNiLEVBRkMsSUFBSSxDQUVFO01BR1RJLEVBQUEsSUFBQyxJQUFJLENBQ2NiLGVBQWUsQ0FBZkEsZ0JBQWMsQ0FBQyxDQUN2QkMsT0FBVSxDQUFWQSxXQUFTLENBQUMsQ0FDYkEsSUFBVSxDQUFWQSxXQUFTLENBQUMsQ0FFZlEsWUFBVSxDQUNiLEVBTkMsSUFBSSxDQU1FO01BQUFMLENBQUEsTUFBQUosZUFBQTtNQUFBSSxDQUFBLE1BQUFLLFdBQUE7TUFBQUwsQ0FBQSxNQUFBSCxVQUFBO01BQUFHLENBQUEsTUFBQVEsRUFBQTtNQUFBUixDQUFBLE1BQUFTLEVBQUE7SUFBQTtNQUFBRCxFQUFBLEdBQUFSLENBQUE7TUFBQVMsRUFBQSxHQUFBVCxDQUFBO0lBQUE7SUFBQSxJQUFBVSxFQUFBO0lBQUEsSUFBQVYsQ0FBQSxRQUFBTSxPQUFBLElBQUFOLENBQUEsUUFBQVEsRUFBQSxJQUFBUixDQUFBLFFBQUFTLEVBQUE7TUFkVEMsRUFBQSxJQUFDLElBQUksQ0FDRUosR0FBTyxDQUFQQSxRQUFNLENBQUMsQ0FFVixRQUVPLENBRlAsQ0FBQUUsRUFFTSxDQUFDLENBR1QsQ0FBQUMsRUFNTSxDQUNSLEVBZkMsSUFBSSxDQWVFO01BQUFULENBQUEsTUFBQU0sT0FBQTtNQUFBTixDQUFBLE1BQUFRLEVBQUE7TUFBQVIsQ0FBQSxNQUFBUyxFQUFBO01BQUFULENBQUEsTUFBQVUsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQVYsQ0FBQTtJQUFBO0lBQUEsT0FmUFUsRUFlTztFQUFBO0VBRVYsSUFBQUYsRUFBQTtFQUFBLElBQUFSLENBQUEsUUFBQUosZUFBQSxJQUFBSSxDQUFBLFNBQUFLLFdBQUEsSUFBQUwsQ0FBQSxTQUFBSCxVQUFBO0lBSUNXLEVBQUEsSUFBQyxJQUFJLENBQWtCWixlQUFlLENBQWZBLGdCQUFjLENBQUMsQ0FBV0MsT0FBVSxDQUFWQSxXQUFTLENBQUMsQ0FDeERRLFlBQVUsQ0FDYixFQUZDLElBQUksQ0FFRTtJQUFBTCxDQUFBLE1BQUFKLGVBQUE7SUFBQUksQ0FBQSxPQUFBSyxXQUFBO0lBQUFMLENBQUEsT0FBQUgsVUFBQTtJQUFBRyxDQUFBLE9BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFBLE9BRlBRLEVBRU87QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
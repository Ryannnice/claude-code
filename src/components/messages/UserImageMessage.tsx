// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 pathToFileURL，将 url 中已经封装好的能力接到本文件流程里。
import { pathToFileURL } from 'url';
// 复用 Link 终端界面组件，避免在这里重复拼装显示逻辑。
import Link from '../../ink/components/Link.js';
// 复用 supportsHyperlinks 终端界面组件，避免在这里重复拼装显示逻辑。
import { supportsHyperlinks } from '../../ink/supports-hyperlinks.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getStoredImagePath 工具函数，把通用处理留在 ../../utils/imageStore.js 中维护。
import { getStoredImagePath } from '../../utils/imageStore.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  imageId?: number;
  addMargin?: boolean;
};

/**
 * Renders an image attachment in user messages.
 * Shows as a clickable link if the image is stored and terminal supports hyperlinks.
 * Uses MessageResponse styling to appear connected to the message above,
 * unless addMargin is true (image starts a new user turn without text).
 */
// UserImageMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserImageMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    imageId,
    addMargin
  } = t0;
  // label 命名 `imageId ? `[Image #${imageId}]` : "[Image]"`，让后续代码直接表达这个值的用途。
  const label = imageId ? `[Image #${imageId}]` : "[Image]";
  // t1 暂存 `imagePath && supportsHyperlinks() ? <Link url={pathToFile...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== imageId || $[1] !== label) {
    // imagePath 路径数据读取`getStoredImagePath`，供终端渲染后续处理使用。
    const imagePath = imageId ? getStoredImagePath(imageId) : null;
    // t1 暂存 `imagePath && supportsHyperlinks() ? <Link url={pathToFile...` 生成的渲染片段，后续返回路径直接复用。
    t1 = imagePath && supportsHyperlinks() ? <Link url={pathToFileURL(imagePath).href}><Text>{label}</Text></Link> : <Text>{label}</Text>;
    // $[0] 缓存 `imageId`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = imageId;
    // $[1] 缓存 `label`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = label;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // 文本内容 命名 `t1`，让后续代码直接表达这个值的用途。
  const content = t1;
  // 满足 `addMargin` 时，终端渲染执行该分支。
  if (addMargin) {
    // t2 暂存 `<Box marginTop={1}>{content}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== content) {
      // t2 暂存 `<Box marginTop={1}>{content}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Box marginTop={1}>{content}</Box>;
      // $[3] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = content;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[4];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // t2 暂存 `<MessageResponse>{content}</MessageResponse>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== content) {
    // t2 暂存 `<MessageResponse>{content}</MessageResponse>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <MessageResponse>{content}</MessageResponse>;
    // $[5] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = content;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInBhdGhUb0ZpbGVVUkwiLCJMaW5rIiwic3VwcG9ydHNIeXBlcmxpbmtzIiwiQm94IiwiVGV4dCIsImdldFN0b3JlZEltYWdlUGF0aCIsIk1lc3NhZ2VSZXNwb25zZSIsIlByb3BzIiwiaW1hZ2VJZCIsImFkZE1hcmdpbiIsIlVzZXJJbWFnZU1lc3NhZ2UiLCJ0MCIsIiQiLCJfYyIsImxhYmVsIiwidDEiLCJpbWFnZVBhdGgiLCJocmVmIiwiY29udGVudCIsInQyIl0sInNvdXJjZXMiOlsiVXNlckltYWdlTWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBwYXRoVG9GaWxlVVJMIH0gZnJvbSAndXJsJ1xuaW1wb3J0IExpbmsgZnJvbSAnLi4vLi4vaW5rL2NvbXBvbmVudHMvTGluay5qcydcbmltcG9ydCB7IHN1cHBvcnRzSHlwZXJsaW5rcyB9IGZyb20gJy4uLy4uL2luay9zdXBwb3J0cy1oeXBlcmxpbmtzLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0U3RvcmVkSW1hZ2VQYXRoIH0gZnJvbSAnLi4vLi4vdXRpbHMvaW1hZ2VTdG9yZS5qcydcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4uL01lc3NhZ2VSZXNwb25zZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgaW1hZ2VJZD86IG51bWJlclxuICBhZGRNYXJnaW4/OiBib29sZWFuXG59XG5cbi8qKlxuICogUmVuZGVycyBhbiBpbWFnZSBhdHRhY2htZW50IGluIHVzZXIgbWVzc2FnZXMuXG4gKiBTaG93cyBhcyBhIGNsaWNrYWJsZSBsaW5rIGlmIHRoZSBpbWFnZSBpcyBzdG9yZWQgYW5kIHRlcm1pbmFsIHN1cHBvcnRzIGh5cGVybGlua3MuXG4gKiBVc2VzIE1lc3NhZ2VSZXNwb25zZSBzdHlsaW5nIHRvIGFwcGVhciBjb25uZWN0ZWQgdG8gdGhlIG1lc3NhZ2UgYWJvdmUsXG4gKiB1bmxlc3MgYWRkTWFyZ2luIGlzIHRydWUgKGltYWdlIHN0YXJ0cyBhIG5ldyB1c2VyIHR1cm4gd2l0aG91dCB0ZXh0KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFVzZXJJbWFnZU1lc3NhZ2Uoe1xuICBpbWFnZUlkLFxuICBhZGRNYXJnaW4sXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGxhYmVsID0gaW1hZ2VJZCA/IGBbSW1hZ2UgIyR7aW1hZ2VJZH1dYCA6ICdbSW1hZ2VdJ1xuICBjb25zdCBpbWFnZVBhdGggPSBpbWFnZUlkID8gZ2V0U3RvcmVkSW1hZ2VQYXRoKGltYWdlSWQpIDogbnVsbFxuXG4gIGNvbnN0IGNvbnRlbnQgPVxuICAgIGltYWdlUGF0aCAmJiBzdXBwb3J0c0h5cGVybGlua3MoKSA/IChcbiAgICAgIDxMaW5rIHVybD17cGF0aFRvRmlsZVVSTChpbWFnZVBhdGgpLmhyZWZ9PlxuICAgICAgICA8VGV4dD57bGFiZWx9PC9UZXh0PlxuICAgICAgPC9MaW5rPlxuICAgICkgOiAoXG4gICAgICA8VGV4dD57bGFiZWx9PC9UZXh0PlxuICAgIClcblxuICAvLyBXaGVuIHRoaXMgaW1hZ2Ugc3RhcnRzIGEgbmV3IHVzZXIgdHVybiAobm8gdGV4dCBiZWZvcmUgaXQpLFxuICAvLyBzaG93IHdpdGggbWFyZ2luIGluc3RlYWQgb2YgdGhlIGNvbm5lY3RlZCBsaW5lIHN0eWxlXG4gIGlmIChhZGRNYXJnaW4pIHtcbiAgICByZXR1cm4gPEJveCBtYXJnaW5Ub3A9ezF9Pntjb250ZW50fTwvQm94PlxuICB9XG5cbiAgcmV0dXJuIDxNZXNzYWdlUmVzcG9uc2U+e2NvbnRlbnR9PC9NZXNzYWdlUmVzcG9uc2U+XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLGFBQWEsUUFBUSxLQUFLO0FBQ25DLE9BQU9DLElBQUksTUFBTSw4QkFBOEI7QUFDL0MsU0FBU0Msa0JBQWtCLFFBQVEsa0NBQWtDO0FBQ3JFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0Msa0JBQWtCLFFBQVEsMkJBQTJCO0FBQzlELFNBQVNDLGVBQWUsUUFBUSx1QkFBdUI7QUFFdkQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLE9BQU8sQ0FBQyxFQUFFLE1BQU07RUFDaEJDLFNBQVMsQ0FBQyxFQUFFLE9BQU87QUFDckIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFDLGlCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQTBCO0lBQUFMLE9BQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUd6QjtFQUNOLE1BQUFHLEtBQUEsR0FBY04sT0FBTyxHQUFQLFdBQXFCQSxPQUFPLEdBQWUsR0FBM0MsU0FBMkM7RUFBQSxJQUFBTyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBSixPQUFBLElBQUFJLENBQUEsUUFBQUUsS0FBQTtJQUN6RCxNQUFBRSxTQUFBLEdBQWtCUixPQUFPLEdBQUdILGtCQUFrQixDQUFDRyxPQUFjLENBQUMsR0FBNUMsSUFBNEM7SUFHNURPLEVBQUEsR0FBQUMsU0FBaUMsSUFBcEJkLGtCQUFrQixDQUFDLENBTS9CLEdBTEMsQ0FBQyxJQUFJLENBQU0sR0FBNkIsQ0FBN0IsQ0FBQUYsYUFBYSxDQUFDZ0IsU0FBUyxDQUFDLENBQUFDLElBQUksQ0FBQyxDQUN0QyxDQUFDLElBQUksQ0FBRUgsTUFBSSxDQUFFLEVBQVosSUFBSSxDQUNQLEVBRkMsSUFBSSxDQUtOLEdBREMsQ0FBQyxJQUFJLENBQUVBLE1BQUksQ0FBRSxFQUFaLElBQUksQ0FDTjtJQUFBRixDQUFBLE1BQUFKLE9BQUE7SUFBQUksQ0FBQSxNQUFBRSxLQUFBO0lBQUFGLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBUEgsTUFBQU0sT0FBQSxHQUNFSCxFQU1DO0VBSUgsSUFBSU4sU0FBUztJQUFBLElBQUFVLEVBQUE7SUFBQSxJQUFBUCxDQUFBLFFBQUFNLE9BQUE7TUFDSkMsRUFBQSxJQUFDLEdBQUcsQ0FBWSxTQUFDLENBQUQsR0FBQyxDQUFHRCxRQUFNLENBQUUsRUFBM0IsR0FBRyxDQUE4QjtNQUFBTixDQUFBLE1BQUFNLE9BQUE7TUFBQU4sQ0FBQSxNQUFBTyxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBUCxDQUFBO0lBQUE7SUFBQSxPQUFsQ08sRUFBa0M7RUFBQTtFQUMxQyxJQUFBQSxFQUFBO0VBQUEsSUFBQVAsQ0FBQSxRQUFBTSxPQUFBO0lBRU1DLEVBQUEsSUFBQyxlQUFlLENBQUVELFFBQU0sQ0FBRSxFQUF6QixlQUFlLENBQTRCO0lBQUFOLENBQUEsTUFBQU0sT0FBQTtJQUFBTixDQUFBLE1BQUFPLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFQLENBQUE7RUFBQTtFQUFBLE9BQTVDTyxFQUE0QztBQUFBIiwiaWdub3JlTGlzdCI6W119
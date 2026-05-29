// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- enter to continue
// 引入 Box、Link、Newline、Text、useInput，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Newline, Text, useInput } from '../ink.js';
// 复用 isChromeExtensionInstalled 工具函数，把通用处理留在 ../utils/claudeInChrome/setup.js 中维护。
import { isChromeExtensionInstalled } from '../utils/claudeInChrome/setup.js';
// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { saveGlobalConfig } from '../utils/config.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// CHROME_EXTENSION_URL 命名 `'https://claude.ai/chrome'`，让后续代码直接表达这个值的用途。
const CHROME_EXTENSION_URL = 'https://claude.ai/chrome';
// CHROME_PERMISSIONS_URL 权限数据保存`'https://clau.de/chrome/permissions'`，作为后续固定文本处理的输入。
const CHROME_PERMISSIONS_URL = 'https://clau.de/chrome/permissions';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onDone(): void;
};
// ClaudeInChromeOnboarding 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ClaudeInChromeOnboarding(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(20);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // 从 `React.useState(false)` 按位置拆出 isExtensionInstalled、setIsExtensionInstalled，让终端 UI 组件 Claude In Chrome Onboarding分别处理这些返回值。
  const [isExtensionInstalled, setIsExtensionInstalled] = React.useState(false);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_claude_in_chrome_onboarding_shown", {});
      // 调用 isChromeExtensionInstalled，触发终端渲染此处需要的副作用。
      isChromeExtensionInstalled().then(setIsExtensionInstalled);
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(_temp);
    };
    // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(t1, t2);
  // t3 暂存 `(_input, key) => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onDone) {
    // t3 暂存 `(_input, key) => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = (_input, key) => {
      // 满足 `key.return` 时，终端渲染执行该分支。
      if (key.return) {
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone();
      }
    };
    // $[2] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onDone;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 调用 useInput，触发终端渲染此处需要的副作用。
  useInput(t3);
  // t4 暂存 `!isExtensionInstalled && <><Newline /><Newline />Requires...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== isExtensionInstalled) {
    // t4 暂存 `!isExtensionInstalled && <><Newline /><Newline />Requires...` 生成的渲染片段，后续返回路径直接复用。
    t4 = !isExtensionInstalled && <><Newline /><Newline />Requires the Chrome extension. Get started at{" "}<Link url={CHROME_EXTENSION_URL} /></>;
    // $[4] 缓存 `isExtensionInstalled`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = isExtensionInstalled;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `<Text>Claude in Chrome works with the Chrome extension to...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t4) {
    // t5 暂存 `<Text>Claude in Chrome works with the Chrome extension to...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>Claude in Chrome works with the Chrome extension to let you control your browser directly from Claude Code. You can navigate websites, fill forms, capture screenshots, record GIFs, and debug with console logs and network requests.{t4}</Text>;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `isExtensionInstalled && <>{" "}(<Link url={CHROME_PERMISS...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== isExtensionInstalled) {
    // t6 暂存 `isExtensionInstalled && <>{" "}(<Link url={CHROME_PERMISS...` 生成的渲染片段，后续返回路径直接复用。
    t6 = isExtensionInstalled && <>{" "}(<Link url={CHROME_PERMISSIONS_URL} />)</>;
    // $[8] 缓存 `isExtensionInstalled`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = isExtensionInstalled;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `<Text dimColor={true}>Site-level permissions are inherite...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t6) {
    // t7 暂存 `<Text dimColor={true}>Site-level permissions are inherite...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text dimColor={true}>Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on{t6}.</Text>;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // t8 暂存 `<Text bold={true} color="chromeYellow">/chrome</Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Text bold={true} color="chromeYellow">/chrome</Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text bold={true} color="chromeYellow">/chrome</Text>;
    // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[12];
  }
  // t9 暂存 `<Text dimColor={true}>For more info, use{" "}{t8}{" "}or ...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `<Text dimColor={true}>For more info, use{" "}{t8}{" "}or ...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text dimColor={true}>For more info, use{" "}{t8}{" "}or visit <Link url="https://code.claude.com/docs/en/chrome" /></Text>;
    // $[13] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[13];
  }
  // t10 暂存 `<Box flexDirection="column" gap={1}>{t5}{t7}{t9}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t5 || $[15] !== t7) {
    // t10 暂存 `<Box flexDirection="column" gap={1}>{t5}{t7}{t9}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box flexDirection="column" gap={1}>{t5}{t7}{t9}</Box>;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
    // $[16] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[16];
  }
  // t11 暂存 `<Dialog title="Claude in Chrome (Beta)" onCancel={onDone}...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== onDone || $[18] !== t10) {
    // t11 暂存 `<Dialog title="Claude in Chrome (Beta)" onCancel={onDone}...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Dialog title="Claude in Chrome (Beta)" onCancel={onDone} color="chromeYellow">{t10}</Dialog>;
    // $[17] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = onDone;
    // $[18] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t10;
    // $[19] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[19];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(current) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...current,
    hasCompletedClaudeInChromeOnboarding: true
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImxvZ0V2ZW50IiwiQm94IiwiTGluayIsIk5ld2xpbmUiLCJUZXh0IiwidXNlSW5wdXQiLCJpc0Nocm9tZUV4dGVuc2lvbkluc3RhbGxlZCIsInNhdmVHbG9iYWxDb25maWciLCJEaWFsb2ciLCJDSFJPTUVfRVhURU5TSU9OX1VSTCIsIkNIUk9NRV9QRVJNSVNTSU9OU19VUkwiLCJQcm9wcyIsIm9uRG9uZSIsIkNsYXVkZUluQ2hyb21lT25ib2FyZGluZyIsInQwIiwiJCIsIl9jIiwiaXNFeHRlbnNpb25JbnN0YWxsZWQiLCJzZXRJc0V4dGVuc2lvbkluc3RhbGxlZCIsInVzZVN0YXRlIiwidDEiLCJ0MiIsIlN5bWJvbCIsImZvciIsInRoZW4iLCJfdGVtcCIsInVzZUVmZmVjdCIsInQzIiwiX2lucHV0Iiwia2V5IiwicmV0dXJuIiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5IiwidDEwIiwidDExIiwiY3VycmVudCIsImhhc0NvbXBsZXRlZENsYXVkZUluQ2hyb21lT25ib2FyZGluZyJdLCJzb3VyY2VzIjpbIkNsYXVkZUluQ2hyb21lT25ib2FyZGluZy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgbG9nRXZlbnQgfSBmcm9tICdzcmMvc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGN1c3RvbS1ydWxlcy9wcmVmZXItdXNlLWtleWJpbmRpbmdzIC0tIGVudGVyIHRvIGNvbnRpbnVlXG5pbXBvcnQgeyBCb3gsIExpbmssIE5ld2xpbmUsIFRleHQsIHVzZUlucHV0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgaXNDaHJvbWVFeHRlbnNpb25JbnN0YWxsZWQgfSBmcm9tICcuLi91dGlscy9jbGF1ZGVJbkNocm9tZS9zZXR1cC5qcydcbmltcG9ydCB7IHNhdmVHbG9iYWxDb25maWcgfSBmcm9tICcuLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuXG5jb25zdCBDSFJPTUVfRVhURU5TSU9OX1VSTCA9ICdodHRwczovL2NsYXVkZS5haS9jaHJvbWUnXG5jb25zdCBDSFJPTUVfUEVSTUlTU0lPTlNfVVJMID0gJ2h0dHBzOi8vY2xhdS5kZS9jaHJvbWUvcGVybWlzc2lvbnMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uRG9uZSgpOiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDbGF1ZGVJbkNocm9tZU9uYm9hcmRpbmcoeyBvbkRvbmUgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbaXNFeHRlbnNpb25JbnN0YWxsZWQsIHNldElzRXh0ZW5zaW9uSW5zdGFsbGVkXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKVxuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbG9nRXZlbnQoJ3Rlbmd1X2NsYXVkZV9pbl9jaHJvbWVfb25ib2FyZGluZ19zaG93bicsIHt9KVxuICAgIHZvaWQgaXNDaHJvbWVFeHRlbnNpb25JbnN0YWxsZWQoKS50aGVuKHNldElzRXh0ZW5zaW9uSW5zdGFsbGVkKVxuICAgIHNhdmVHbG9iYWxDb25maWcoY3VycmVudCA9PiB7XG4gICAgICByZXR1cm4geyAuLi5jdXJyZW50LCBoYXNDb21wbGV0ZWRDbGF1ZGVJbkNocm9tZU9uYm9hcmRpbmc6IHRydWUgfVxuICAgIH0pXG4gIH0sIFtdKVxuXG4gIC8vIEhhbmRsZSBFbnRlciB0byBjb250aW51ZVxuICB1c2VJbnB1dCgoX2lucHV0LCBrZXkpID0+IHtcbiAgICBpZiAoa2V5LnJldHVybikge1xuICAgICAgb25Eb25lKClcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT1cIkNsYXVkZSBpbiBDaHJvbWUgKEJldGEpXCJcbiAgICAgIG9uQ2FuY2VsPXtvbkRvbmV9XG4gICAgICBjb2xvcj1cImNocm9tZVllbGxvd1wiXG4gICAgPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgQ2xhdWRlIGluIENocm9tZSB3b3JrcyB3aXRoIHRoZSBDaHJvbWUgZXh0ZW5zaW9uIHRvIGxldCB5b3UgY29udHJvbFxuICAgICAgICAgIHlvdXIgYnJvd3NlciBkaXJlY3RseSBmcm9tIENsYXVkZSBDb2RlLiBZb3UgY2FuIG5hdmlnYXRlIHdlYnNpdGVzLFxuICAgICAgICAgIGZpbGwgZm9ybXMsIGNhcHR1cmUgc2NyZWVuc2hvdHMsIHJlY29yZCBHSUZzLCBhbmQgZGVidWcgd2l0aCBjb25zb2xlXG4gICAgICAgICAgbG9ncyBhbmQgbmV0d29yayByZXF1ZXN0cy5cbiAgICAgICAgICB7IWlzRXh0ZW5zaW9uSW5zdGFsbGVkICYmIChcbiAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgIDxOZXdsaW5lIC8+XG4gICAgICAgICAgICAgIDxOZXdsaW5lIC8+XG4gICAgICAgICAgICAgIFJlcXVpcmVzIHRoZSBDaHJvbWUgZXh0ZW5zaW9uLiBHZXQgc3RhcnRlZCBhdHsnICd9XG4gICAgICAgICAgICAgIDxMaW5rIHVybD17Q0hST01FX0VYVEVOU0lPTl9VUkx9IC8+XG4gICAgICAgICAgICA8Lz5cbiAgICAgICAgICApfVxuICAgICAgICA8L1RleHQ+XG5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgU2l0ZS1sZXZlbCBwZXJtaXNzaW9ucyBhcmUgaW5oZXJpdGVkIGZyb20gdGhlIENocm9tZSBleHRlbnNpb24uIE1hbmFnZVxuICAgICAgICAgIHBlcm1pc3Npb25zIGluIHRoZSBDaHJvbWUgZXh0ZW5zaW9uIHNldHRpbmdzIHRvIGNvbnRyb2wgd2hpY2ggc2l0ZXNcbiAgICAgICAgICBDbGF1ZGUgY2FuIGJyb3dzZSwgY2xpY2ssIGFuZCB0eXBlIG9uXG4gICAgICAgICAge2lzRXh0ZW5zaW9uSW5zdGFsbGVkICYmIChcbiAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICAgICg8TGluayB1cmw9e0NIUk9NRV9QRVJNSVNTSU9OU19VUkx9IC8+KVxuICAgICAgICAgICAgPC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgICAuXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgRm9yIG1vcmUgaW5mbywgdXNleycgJ31cbiAgICAgICAgICA8VGV4dCBib2xkIGNvbG9yPVwiY2hyb21lWWVsbG93XCI+XG4gICAgICAgICAgICAvY2hyb21lXG4gICAgICAgICAgPC9UZXh0PnsnICd9XG4gICAgICAgICAgb3IgdmlzaXQgPExpbmsgdXJsPVwiaHR0cHM6Ly9jb2RlLmNsYXVkZS5jb20vZG9jcy9lbi9jaHJvbWVcIiAvPlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsUUFBUSxRQUFRLGlDQUFpQztBQUMxRDtBQUNBLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxPQUFPLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLFdBQVc7QUFDOUQsU0FBU0MsMEJBQTBCLFFBQVEsa0NBQWtDO0FBQzdFLFNBQVNDLGdCQUFnQixRQUFRLG9CQUFvQjtBQUNyRCxTQUFTQyxNQUFNLFFBQVEsMkJBQTJCO0FBRWxELE1BQU1DLG9CQUFvQixHQUFHLDBCQUEwQjtBQUN2RCxNQUFNQyxzQkFBc0IsR0FBRyxvQ0FBb0M7QUFFbkUsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLE1BQU0sRUFBRSxFQUFFLElBQUk7QUFDaEIsQ0FBQztBQUVELE9BQU8sU0FBQUMseUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBa0M7SUFBQUo7RUFBQSxJQUFBRSxFQUFpQjtFQUN4RCxPQUFBRyxv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
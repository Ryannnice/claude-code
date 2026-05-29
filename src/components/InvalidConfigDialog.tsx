// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、render、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, render, Text } from '../ink.js';
// 引入 KeybindingSetup，将 ../keybindings/KeybindingProviderSetup.js 中已经封装好的能力接到本文件流程里。
import { KeybindingSetup } from '../keybindings/KeybindingProviderSetup.js';
// 引入 AppStateProvider，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { AppStateProvider } from '../state/AppState.js';
// 类型依赖 { ConfigParseError } 来自 ../utils/errors.js，用于校准终端渲染的数据契约。
import type { ConfigParseError } from '../utils/errors.js';
// 复用 getBaseRenderOptions 工具函数，把通用处理留在 ../utils/renderOptions.js 中维护。
import { getBaseRenderOptions } from '../utils/renderOptions.js';
// 复用 jsonStringify、writeFileSync_DEPRECATED 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify, writeFileSync_DEPRECATED } from '../utils/slowOperations.js';
// 类型依赖 { ThemeName } 来自 ../utils/theme.js，用于校准终端渲染的数据契约。
import type { ThemeName } from '../utils/theme.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// InvalidConfigHandlerProps 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface InvalidConfigHandlerProps {
  error: ConfigParseError;
}
// InvalidConfigDialogProps 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface InvalidConfigDialogProps {
  filePath: string;
  errorDescription: string;
  // 这个回调绑定到 onExit: () => void;，负责终端渲染在该局部场景下的响应。
  onExit: () => void;
  // 这个回调绑定到 onReset: () => void;，负责终端渲染在该局部场景下的响应。
  onReset: () => void;
}

/**
 * Dialog shown when the Claude config file contains invalid JSON
 */
// InvalidConfigDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function InvalidConfigDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(19);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath,
    errorDescription,
    onExit,
    onReset
  } = t0;
  // t1 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onExit || $[1] !== onReset) {
    // t1 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = value => {
      // 当 `value` 匹配 `"exit"` 时，终端渲染执行对应分支。
      if (value === "exit") {
        // 调用 onExit，触发终端渲染此处需要的副作用。
        onExit();
      } else {
        // 调用 onReset，触发终端渲染此处需要的副作用。
        onReset();
      }
    };
    // $[0] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onExit;
    // $[1] 缓存 `onReset`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onReset;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // handleSelect 命名 `t1`，让后续代码直接表达这个值的用途。
  const handleSelect = t1;
  // t2 暂存 `<Text>The configuration file at <Text bold={true}>{filePa...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== filePath) {
    // t2 暂存 `<Text>The configuration file at <Text bold={true}>{filePa...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text>The configuration file at <Text bold={true}>{filePath}</Text> contains invalid JSON.</Text>;
    // $[3] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = filePath;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text>{errorDescription}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== errorDescription) {
    // t3 暂存 `<Text>{errorDescription}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>{errorDescription}</Text>;
    // $[5] 缓存 `errorDescription`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = errorDescription;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Box flexDirection="column" gap={1}>{t2}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t2 || $[8] !== t3) {
    // t4 暂存 `<Box flexDirection="column" gap={1}>{t2}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column" gap={1}>{t2}{t3}</Box>;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `<Text bold={true}>Choose an option:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text bold={true}>Choose an option:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text bold={true}>Choose an option:</Text>;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t6 = [{
      label: "Exit and fix manually",
      value: "exit"
    }, {
      label: "Reset with default configuration",
      value: "reset"
    }];
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // t7 暂存 `<Box flexDirection="column">{t5}<Select options={t6} onCh...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== handleSelect || $[13] !== onExit) {
    // t7 暂存 `<Box flexDirection="column">{t5}<Select options={t6} onCh...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column">{t5}<Select options={t6} onChange={handleSelect} onCancel={onExit} /></Box>;
    // $[12] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = handleSelect;
    // $[13] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = onExit;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[14];
  }
  // t8 暂存 `<Dialog title="Configuration Error" color="error" onCance...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== onExit || $[16] !== t4 || $[17] !== t7) {
    // t8 暂存 `<Dialog title="Configuration Error" color="error" onCance...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Dialog title="Configuration Error" color="error" onCancel={onExit}>{t4}{t7}</Dialog>;
    // $[15] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = onExit;
    // $[16] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t4;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[18];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}

/**
 * Safe fallback theme name for error dialogs to avoid circular dependency.
 * Uses a hardcoded dark theme that doesn't require reading from config.
 */
// SAFE_ERROR_THEME_NAME 错误信息固定为 `'dark'`，作为终端 UI 组件 Invalid Config Dialog后续展示或比较的基准。
const SAFE_ERROR_THEME_NAME: ThemeName = 'dark';
// showInvalidConfigDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function showInvalidConfigDialog({
  error
}: InvalidConfigHandlerProps): Promise<void> {
  // Extend RenderOptions with theme property for this specific usage
  // SafeRenderOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
  type SafeRenderOptions = Parameters<typeof render>[1] & {
    theme?: ThemeName;
  };
  // renderOptions 集合 集中保存终端 UI 组件 Invalid Config Dialog要一起传递的字段。
  const renderOptions: SafeRenderOptions = {
    ...getBaseRenderOptions(false),
    // IMPORTANT: Use hardcoded theme name to avoid circular dependency with getGlobalConfig()
    // This allows the error dialog to show even when config file has JSON syntax errors
    theme: SAFE_ERROR_THEME_NAME
  };
  // 这个回调绑定到 await new Promise<void>(async resolve => {，负责终端渲染在该局部场景下的响应。
  await new Promise<void>(async resolve => {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      unmount
    } = await render(<AppStateProvider>
        <KeybindingSetup>
          {/* 这个回调绑定到 <InvalidConfigDialog filePath={error.filePath} errorDescription={error.message} onEx…，负责终端渲染在该局部场景下的响应。 */}
          <InvalidConfigDialog filePath={error.filePath} errorDescription={error.message} onExit={() => {
          // 调用 unmount，触发终端渲染此处需要的副作用。
          unmount();
          // 显式忽略 `resolve()` 的返回值，只保留它触发的副作用。
          void resolve();
          // 调用 process.exit，触发终端渲染此处需要的副作用。
          process.exit(1);
        // 这个回调绑定到 }} onReset={() => {，负责终端渲染在该局部场景下的响应。
        }} onReset={() => {
          // 调用 writeFileSync_DEPRECATED，触发终端渲染此处需要的副作用。
          writeFileSync_DEPRECATED(error.filePath, jsonStringify(error.defaultConfig, null, 2), {
            flush: false,
            encoding: 'utf8'
          });
          // 调用 unmount，触发终端渲染此处需要的副作用。
          unmount();
          // 显式忽略 `resolve()` 的返回值，只保留它触发的副作用。
          void resolve();
          // 调用 process.exit，触发终端渲染此处需要的副作用。
          process.exit(0);
        }} />
        </KeybindingSetup>
      </AppStateProvider>, renderOptions);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsInJlbmRlciIsIlRleHQiLCJLZXliaW5kaW5nU2V0dXAiLCJBcHBTdGF0ZVByb3ZpZGVyIiwiQ29uZmlnUGFyc2VFcnJvciIsImdldEJhc2VSZW5kZXJPcHRpb25zIiwianNvblN0cmluZ2lmeSIsIndyaXRlRmlsZVN5bmNfREVQUkVDQVRFRCIsIlRoZW1lTmFtZSIsIlNlbGVjdCIsIkRpYWxvZyIsIkludmFsaWRDb25maWdIYW5kbGVyUHJvcHMiLCJlcnJvciIsIkludmFsaWRDb25maWdEaWFsb2dQcm9wcyIsImZpbGVQYXRoIiwiZXJyb3JEZXNjcmlwdGlvbiIsIm9uRXhpdCIsIm9uUmVzZXQiLCJJbnZhbGlkQ29uZmlnRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsInZhbHVlIiwiaGFuZGxlU2VsZWN0IiwidDIiLCJ0MyIsInQ0IiwidDUiLCJTeW1ib2wiLCJmb3IiLCJ0NiIsImxhYmVsIiwidDciLCJ0OCIsIlNBRkVfRVJST1JfVEhFTUVfTkFNRSIsInNob3dJbnZhbGlkQ29uZmlnRGlhbG9nIiwiUHJvbWlzZSIsIlNhZmVSZW5kZXJPcHRpb25zIiwiUGFyYW1ldGVycyIsInRoZW1lIiwicmVuZGVyT3B0aW9ucyIsInJlc29sdmUiLCJ1bm1vdW50IiwibWVzc2FnZSIsInByb2Nlc3MiLCJleGl0IiwiZGVmYXVsdENvbmZpZyIsImZsdXNoIiwiZW5jb2RpbmciXSwic291cmNlcyI6WyJJbnZhbGlkQ29uZmlnRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIHJlbmRlciwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IEtleWJpbmRpbmdTZXR1cCB9IGZyb20gJy4uL2tleWJpbmRpbmdzL0tleWJpbmRpbmdQcm92aWRlclNldHVwLmpzJ1xuaW1wb3J0IHsgQXBwU3RhdGVQcm92aWRlciB9IGZyb20gJy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBDb25maWdQYXJzZUVycm9yIH0gZnJvbSAnLi4vdXRpbHMvZXJyb3JzLmpzJ1xuaW1wb3J0IHsgZ2V0QmFzZVJlbmRlck9wdGlvbnMgfSBmcm9tICcuLi91dGlscy9yZW5kZXJPcHRpb25zLmpzJ1xuaW1wb3J0IHtcbiAganNvblN0cmluZ2lmeSxcbiAgd3JpdGVGaWxlU3luY19ERVBSRUNBVEVELFxufSBmcm9tICcuLi91dGlscy9zbG93T3BlcmF0aW9ucy5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWVOYW1lIH0gZnJvbSAnLi4vdXRpbHMvdGhlbWUuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5cbmludGVyZmFjZSBJbnZhbGlkQ29uZmlnSGFuZGxlclByb3BzIHtcbiAgZXJyb3I6IENvbmZpZ1BhcnNlRXJyb3Jcbn1cblxuaW50ZXJmYWNlIEludmFsaWRDb25maWdEaWFsb2dQcm9wcyB7XG4gIGZpbGVQYXRoOiBzdHJpbmdcbiAgZXJyb3JEZXNjcmlwdGlvbjogc3RyaW5nXG4gIG9uRXhpdDogKCkgPT4gdm9pZFxuICBvblJlc2V0OiAoKSA9PiB2b2lkXG59XG5cbi8qKlxuICogRGlhbG9nIHNob3duIHdoZW4gdGhlIENsYXVkZSBjb25maWcgZmlsZSBjb250YWlucyBpbnZhbGlkIEpTT05cbiAqL1xuZnVuY3Rpb24gSW52YWxpZENvbmZpZ0RpYWxvZyh7XG4gIGZpbGVQYXRoLFxuICBlcnJvckRlc2NyaXB0aW9uLFxuICBvbkV4aXQsXG4gIG9uUmVzZXQsXG59OiBJbnZhbGlkQ29uZmlnRGlhbG9nUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBIYW5kbGVyIGZvciBTZWxlY3Qgb25DaGFuZ2VcbiAgY29uc3QgaGFuZGxlU2VsZWN0ID0gKHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBpZiAodmFsdWUgPT09ICdleGl0Jykge1xuICAgICAgb25FeGl0KClcbiAgICB9IGVsc2Uge1xuICAgICAgb25SZXNldCgpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nIHRpdGxlPVwiQ29uZmlndXJhdGlvbiBFcnJvclwiIGNvbG9yPVwiZXJyb3JcIiBvbkNhbmNlbD17b25FeGl0fT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIFRoZSBjb25maWd1cmF0aW9uIGZpbGUgYXQgPFRleHQgYm9sZD57ZmlsZVBhdGh9PC9UZXh0PiBjb250YWluc1xuICAgICAgICAgIGludmFsaWQgSlNPTi5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dD57ZXJyb3JEZXNjcmlwdGlvbn08L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dCBib2xkPkNob29zZSBhbiBvcHRpb246PC9UZXh0PlxuICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgb3B0aW9ucz17W1xuICAgICAgICAgICAgeyBsYWJlbDogJ0V4aXQgYW5kIGZpeCBtYW51YWxseScsIHZhbHVlOiAnZXhpdCcgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdSZXNldCB3aXRoIGRlZmF1bHQgY29uZmlndXJhdGlvbicsIHZhbHVlOiAncmVzZXQnIH0sXG4gICAgICAgICAgXX1cbiAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlU2VsZWN0fVxuICAgICAgICAgIG9uQ2FuY2VsPXtvbkV4aXR9XG4gICAgICAgIC8+XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuXG4vKipcbiAqIFNhZmUgZmFsbGJhY2sgdGhlbWUgbmFtZSBmb3IgZXJyb3IgZGlhbG9ncyB0byBhdm9pZCBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICogVXNlcyBhIGhhcmRjb2RlZCBkYXJrIHRoZW1lIHRoYXQgZG9lc24ndCByZXF1aXJlIHJlYWRpbmcgZnJvbSBjb25maWcuXG4gKi9cbmNvbnN0IFNBRkVfRVJST1JfVEhFTUVfTkFNRTogVGhlbWVOYW1lID0gJ2RhcmsnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzaG93SW52YWxpZENvbmZpZ0RpYWxvZyh7XG4gIGVycm9yLFxufTogSW52YWxpZENvbmZpZ0hhbmRsZXJQcm9wcyk6IFByb21pc2U8dm9pZD4ge1xuICAvLyBFeHRlbmQgUmVuZGVyT3B0aW9ucyB3aXRoIHRoZW1lIHByb3BlcnR5IGZvciB0aGlzIHNwZWNpZmljIHVzYWdlXG4gIHR5cGUgU2FmZVJlbmRlck9wdGlvbnMgPSBQYXJhbWV0ZXJzPHR5cGVvZiByZW5kZXI+WzFdICYgeyB0aGVtZT86IFRoZW1lTmFtZSB9XG5cbiAgY29uc3QgcmVuZGVyT3B0aW9uczogU2FmZVJlbmRlck9wdGlvbnMgPSB7XG4gICAgLi4uZ2V0QmFzZVJlbmRlck9wdGlvbnMoZmFsc2UpLFxuICAgIC8vIElNUE9SVEFOVDogVXNlIGhhcmRjb2RlZCB0aGVtZSBuYW1lIHRvIGF2b2lkIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2l0aCBnZXRHbG9iYWxDb25maWcoKVxuICAgIC8vIFRoaXMgYWxsb3dzIHRoZSBlcnJvciBkaWFsb2cgdG8gc2hvdyBldmVuIHdoZW4gY29uZmlnIGZpbGUgaGFzIEpTT04gc3ludGF4IGVycm9yc1xuICAgIHRoZW1lOiBTQUZFX0VSUk9SX1RIRU1FX05BTUUsXG4gIH1cblxuICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPihhc3luYyByZXNvbHZlID0+IHtcbiAgICBjb25zdCB7IHVubW91bnQgfSA9IGF3YWl0IHJlbmRlcihcbiAgICAgIDxBcHBTdGF0ZVByb3ZpZGVyPlxuICAgICAgICA8S2V5YmluZGluZ1NldHVwPlxuICAgICAgICAgIDxJbnZhbGlkQ29uZmlnRGlhbG9nXG4gICAgICAgICAgICBmaWxlUGF0aD17ZXJyb3IuZmlsZVBhdGh9XG4gICAgICAgICAgICBlcnJvckRlc2NyaXB0aW9uPXtlcnJvci5tZXNzYWdlfVxuICAgICAgICAgICAgb25FeGl0PXsoKSA9PiB7XG4gICAgICAgICAgICAgIHVubW91bnQoKVxuICAgICAgICAgICAgICB2b2lkIHJlc29sdmUoKVxuICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSlcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvblJlc2V0PXsoKSA9PiB7XG4gICAgICAgICAgICAgIHdyaXRlRmlsZVN5bmNfREVQUkVDQVRFRChcbiAgICAgICAgICAgICAgICBlcnJvci5maWxlUGF0aCxcbiAgICAgICAgICAgICAgICBqc29uU3RyaW5naWZ5KGVycm9yLmRlZmF1bHRDb25maWcsIG51bGwsIDIpLFxuICAgICAgICAgICAgICAgIHsgZmx1c2g6IGZhbHNlLCBlbmNvZGluZzogJ3V0ZjgnIH0sXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgdW5tb3VudCgpXG4gICAgICAgICAgICAgIHZvaWQgcmVzb2x2ZSgpXG4gICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgwKVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L0tleWJpbmRpbmdTZXR1cD5cbiAgICAgIDwvQXBwU3RhdGVQcm92aWRlcj4sXG4gICAgICByZW5kZXJPcHRpb25zLFxuICAgIClcbiAgfSlcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLEdBQUcsRUFBRUMsTUFBTSxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUM3QyxTQUFTQyxlQUFlLFFBQVEsMkNBQTJDO0FBQzNFLFNBQVNDLGdCQUFnQixRQUFRLHNCQUFzQjtBQUN2RCxjQUFjQyxnQkFBZ0IsUUFBUSxvQkFBb0I7QUFDMUQsU0FBU0Msb0JBQW9CLFFBQVEsMkJBQTJCO0FBQ2hFLFNBQ0VDLGFBQWEsRUFDYkMsd0JBQXdCLFFBQ25CLDRCQUE0QjtBQUNuQyxjQUFjQyxTQUFTLFFBQVEsbUJBQW1CO0FBQ2xELFNBQVNDLE1B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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useState } from 'react';
// 引入 getAllOutputStyles、OUTPUT_STYLE_CONFIG、OutputStyleConfig，将 ../constants/outputStyles.js 中已经封装好的能力接到本文件流程里。
import { getAllOutputStyles, OUTPUT_STYLE_CONFIG, type OutputStyleConfig } from '../constants/outputStyles.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 类型依赖 { OutputStyle } 来自 ../utils/config.js，用于校准终端渲染的数据契约。
import type { OutputStyle } from '../utils/config.js';
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js';
// 类型依赖 { OptionWithDescription } 来自 ./CustomSelect/select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './CustomSelect/select.js';
// 引入 Select，将 ./CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/select.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// DEFAULT_OUTPUT_STYLE_LABEL保存`'Default'`，作为后续固定文本处理的输入。
const DEFAULT_OUTPUT_STYLE_LABEL = 'Default';
// DEFAULT_OUTPUT_STYLE_DESCRIPTION固定为 `'Claude completes coding tasks efficiently and provides c...`，作为终端 UI Output Style Picker后续展示或比较的基准。
const DEFAULT_OUTPUT_STYLE_DESCRIPTION = 'Claude completes coding tasks efficiently and provides concise responses';
// mapConfigsToOptions 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mapConfigsToOptions(styles: {
  [styleName: string]: OutputStyleConfig | null;
}): OptionWithDescription[] {
  // 返回 `Object.entries(styles).map(([style, config]) => ({`，作为终端渲染这次计算的结果。
  return Object.entries(styles).map(([style, config]) => ({
    label: config?.name ?? DEFAULT_OUTPUT_STYLE_LABEL,
    value: style,
    description: config?.description ?? DEFAULT_OUTPUT_STYLE_DESCRIPTION
  }));
}
// OutputStylePickerProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type OutputStylePickerProps = {
  initialStyle: OutputStyle;
  // 这个回调绑定到 onComplete: (style: OutputStyle) => void;，负责终端渲染在该局部场景下的响应。
  onComplete: (style: OutputStyle) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  isStandaloneCommand?: boolean;
};
// OutputStylePicker 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function OutputStylePicker(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(16);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    initialStyle,
    onComplete,
    onCancel,
    isStandaloneCommand
  } = t0;
  // t1 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // styleOptions 集合 由 React state 持有，setStyleOptions 会在用户操作或异步结果返回时触发刷新。
  const [styleOptions, setStyleOptions] = useState(t1);
  // isLoading 由 React state 持有，setIsLoading 会在用户操作或异步结果返回时触发刷新。
  const [isLoading, setIsLoading] = useState(true);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 调用 getAllOutputStyles，触发终端渲染此处需要的副作用。
      getAllOutputStyles(getCwd()).then(allStyles => {
        // 选项派生`mapConfigsToOptions`，供终端渲染后续处理使用。
        const options = mapConfigsToOptions(allStyles);
        // setStyleOptions 写入新的状态值，使终端渲染后续读取保持一致。
        setStyleOptions(options);
        // setIsLoading 写入新的状态值，使终端渲染后续读取保持一致。
        setIsLoading(false);
      // 这个回调绑定到 }).catch(() => {，负责终端渲染在该局部场景下的响应。
      }).catch(() => {
        // builtInOptions 集合派生`mapConfigsToOptions`，供终端渲染后续处理使用。
        const builtInOptions = mapConfigsToOptions(OUTPUT_STYLE_CONFIG);
        // setStyleOptions 写入新的状态值，使终端渲染后续读取保持一致。
        setStyleOptions(builtInOptions);
        // setIsLoading 写入新的状态值，使终端渲染后续读取保持一致。
        setIsLoading(false);
      });
    };
    // t3 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `style => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onComplete) {
    // t4 暂存 `style => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = style => {
      // outputStyle 命名 `style as OutputStyle`，让后续代码直接表达这个值的用途。
      const outputStyle = style as OutputStyle;
      // 调用 onComplete，触发终端渲染此处需要的副作用。
      onComplete(outputStyle);
    };
    // $[3] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onComplete;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // handleStyleSelect 命名 `t4`，让后续代码直接表达这个值的用途。
  const handleStyleSelect = t4;
  // t5标记终端 UI Output Style Picker是否启用对应路径。
  const t5 = !isStandaloneCommand;
  // t6标记终端 UI Output Style Picker是否启用对应路径。
  const t6 = !isStandaloneCommand;
  // t7 暂存 `<Box marginTop={1}><Text dimColor={true}>This changes how...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Box marginTop={1}><Text dimColor={true}>This changes how...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginTop={1}><Text dimColor={true}>This changes how Claude Code communicates with you</Text></Box>;
    // $[5] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[5];
  }
  // t8 暂存 `<Box flexDirection="column" gap={1}>{t7}{isLoading ? <Tex...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== handleStyleSelect || $[7] !== initialStyle || $[8] !== isLoading || $[9] !== styleOptions) {
    // t8 暂存 `<Box flexDirection="column" gap={1}>{t7}{isLoading ? <Tex...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" gap={1}>{t7}{isLoading ? <Text dimColor={true}>Loading output styles…</Text> : <Select options={styleOptions} onChange={handleStyleSelect} visibleOptionCount={10} defaultValue={initialStyle} />}</Box>;
    // $[6] 缓存 `handleStyleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = handleStyleSelect;
    // $[7] 缓存 `initialStyle`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = initialStyle;
    // $[8] 缓存 `isLoading`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = isLoading;
    // $[9] 缓存 `styleOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = styleOptions;
    // $[10] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[10];
  }
  // t9 暂存 `<Dialog title="Preferred output style" onCancel={onCancel...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onCancel || $[12] !== t5 || $[13] !== t6 || $[14] !== t8) {
    // t9 暂存 `<Dialog title="Preferred output style" onCancel={onCancel...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Dialog title="Preferred output style" onCancel={onCancel} hideInputGuide={t5} hideBorder={t6}>{t8}</Dialog>;
    // $[11] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onCancel;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJnZXRBbGxPdXRwdXRTdHlsZXMiLCJPVVRQVVRfU1RZTEVfQ09ORklHIiwiT3V0cHV0U3R5bGVDb25maWciLCJCb3giLCJUZXh0IiwiT3V0cHV0U3R5bGUiLCJnZXRDd2QiLCJPcHRpb25XaXRoRGVzY3JpcHRpb24iLCJTZWxlY3QiLCJEaWFsb2ciLCJERUZBVUxUX09VVFBVVF9TVFlMRV9MQUJFTCIsIkRFRkFVTFRfT1VUUFVUX1NUWUxFX0RFU0NSSVBUSU9OIiwibWFwQ29uZmlnc1RvT3B0aW9ucyIsInN0eWxlcyIsInN0eWxlTmFtZSIsIk9iamVjdCIsImVudHJpZXMiLCJtYXAiLCJzdHlsZSIsImNvbmZpZyIsImxhYmVsIiwibmFtZSIsInZhbHVlIiwiZGVzY3JpcHRpb24iLCJPdXRwdXRTdHlsZVBpY2tlclByb3BzIiwiaW5pdGlhbFN0eWxlIiwib25Db21wbGV0ZSIsIm9uQ2FuY2VsIiwiaXNTdGFuZGFsb25lQ29tbWFuZCIsIk91dHB1dFN0eWxlUGlja2VyIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsInN0eWxlT3B0aW9ucyIsInNldFN0eWxlT3B0aW9ucyIsImlzTG9hZGluZyIsInNldElzTG9hZGluZyIsInQyIiwidDMiLCJ0aGVuIiwiYWxsU3R5bGVzIiwib3B0aW9ucyIsImNhdGNoIiwiYnVpbHRJbk9wdGlvbnMiLCJ0NCIsIm91dHB1dFN0eWxlIiwiaGFuZGxlU3R5bGVTZWxlY3QiLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5Il0sInNvdXJjZXMiOlsiT3V0cHV0U3R5bGVQaWNrZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7XG4gIGdldEFsbE91dHB1dFN0eWxlcyxcbiAgT1VUUFVUX1NUWUxFX0NPTkZJRyxcbiAgdHlwZSBPdXRwdXRTdHlsZUNvbmZpZyxcbn0gZnJvbSAnLi4vY29uc3RhbnRzL291dHB1dFN0eWxlcy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgT3V0cHV0U3R5bGUgfSBmcm9tICcuLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgeyBnZXRDd2QgfSBmcm9tICcuLi91dGlscy9jd2QuanMnXG5pbXBvcnQgdHlwZSB7IE9wdGlvbldpdGhEZXNjcmlwdGlvbiB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5cbmNvbnN0IERFRkFVTFRfT1VUUFVUX1NUWUxFX0xBQkVMID0gJ0RlZmF1bHQnXG5jb25zdCBERUZBVUxUX09VVFBVVF9TVFlMRV9ERVNDUklQVElPTiA9XG4gICdDbGF1ZGUgY29tcGxldGVzIGNvZGluZyB0YXNrcyBlZmZpY2llbnRseSBhbmQgcHJvdmlkZXMgY29uY2lzZSByZXNwb25zZXMnXG5cbmZ1bmN0aW9uIG1hcENvbmZpZ3NUb09wdGlvbnMoc3R5bGVzOiB7XG4gIFtzdHlsZU5hbWU6IHN0cmluZ106IE91dHB1dFN0eWxlQ29uZmlnIHwgbnVsbFxufSk6IE9wdGlvbldpdGhEZXNjcmlwdGlvbltdIHtcbiAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHN0eWxlcykubWFwKChbc3R5bGUsIGNvbmZpZ10pID0+ICh7XG4gICAgbGFiZWw6IGNvbmZpZz8ubmFtZSA/PyBERUZBVUxUX09VVFBVVF9TVFlMRV9MQUJFTCxcbiAgICB2YWx1ZTogc3R5bGUsXG4gICAgZGVzY3JpcHRpb246IGNvbmZpZz8uZGVzY3JpcHRpb24gPz8gREVGQVVMVF9PVVRQVVRfU1RZTEVfREVTQ1JJUFRJT04sXG4gIH0pKVxufVxuXG5leHBvcnQgdHlwZSBPdXRwdXRTdHlsZVBpY2tlclByb3BzID0ge1xuICBpbml0aWFsU3R5bGU6IE91dHB1dFN0eWxlXG4gIG9uQ29tcGxldGU6IChzdHlsZTogT3V0cHV0U3R5bGUpID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbiAgaXNTdGFuZGFsb25lQ29tbWFuZD86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE91dHB1dFN0eWxlUGlja2VyKHtcbiAgaW5pdGlhbFN0eWxlLFxuICBvbkNvbXBsZXRlLFxuICBvbkNhbmNlbCxcbiAgaXNTdGFuZGFsb25lQ29tbWFuZCxcbn06IE91dHB1dFN0eWxlUGlja2VyUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbc3R5bGVPcHRpb25zLCBzZXRTdHlsZU9wdGlvbnNdID0gdXNlU3RhdGU8T3B0aW9uV2l0aERlc2NyaXB0aW9uW10+KFtdKVxuICBjb25zdCBbaXNMb2FkaW5nLCBzZXRJc0xvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIExvYWQgYWxsIG91dHB1dCBzdHlsZXMgaW5jbHVkaW5nIGN1c3RvbSBvbmVzXG4gICAgZ2V0QWxsT3V0cHV0U3R5bGVzKGdldEN3ZCgpKVxuICAgICAgLnRoZW4oYWxsU3R5bGVzID0+IHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IG1hcENvbmZpZ3NUb09wdGlvbnMoYWxsU3R5bGVzKVxuICAgICAgICBzZXRTdHlsZU9wdGlvbnMob3B0aW9ucylcbiAgICAgICAgc2V0SXNMb2FkaW5nKGZhbHNlKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoKSA9PiB7XG4gICAgICAgIC8vIE9uIGVycm9yLCBmYWxsIGJhY2sgdG8gYnVpbHQtaW4gc3R5bGVzIG9ubHlcbiAgICAgICAgY29uc3QgYnVpbHRJbk9wdGlvbnMgPSBtYXBDb25maWdzVG9PcHRpb25zKE9VVFBVVF9TVFlMRV9DT05GSUcpXG4gICAgICAgIHNldFN0eWxlT3B0aW9ucyhidWlsdEluT3B0aW9ucylcbiAgICAgICAgc2V0SXNMb2FkaW5nKGZhbHNlKVxuICAgICAgfSlcbiAgfSwgW10pXG5cbiAgY29uc3QgaGFuZGxlU3R5bGVTZWxlY3QgPSB1c2VDYWxsYmFjayhcbiAgICAoc3R5bGU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3Qgb3V0cHV0U3R5bGUgPSBzdHlsZSBhcyBPdXRwdXRTdHlsZVxuICAgICAgb25Db21wbGV0ZShvdXRwdXRTdHlsZSlcbiAgICB9LFxuICAgIFtvbkNvbXBsZXRlXSxcbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9XCJQcmVmZXJyZWQgb3V0cHV0IHN0eWxlXCJcbiAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbH1cbiAgICAgIGhpZGVJbnB1dEd1aWRlPXshaXNTdGFuZGFsb25lQ29tbWFuZH1cbiAgICAgIGhpZGVCb3JkZXI9eyFpc1N0YW5kYWxvbmVDb21tYW5kfVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIFRoaXMgY2hhbmdlcyBob3cgQ2xhdWRlIENvZGUgY29tbXVuaWNhdGVzIHdpdGggeW91XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAge2lzTG9hZGluZyA/IChcbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5Mb2FkaW5nIG91dHB1dCBzdHlsZXPigKY8L1RleHQ+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgb3B0aW9ucz17c3R5bGVPcHRpb25zfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVN0eWxlU2VsZWN0fVxuICAgICAgICAgICAgdmlzaWJsZU9wdGlvbkNvdW50PXsxMH1cbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17aW5pdGlhbFN0eWxlfVxuICAgICAgICAgIC8+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLEVBQUVDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDeEQsU0FDRUMsa0JBQWtCLEVBQ2xCQyxtQkFBbUIsRUFDbkIsS0FBS0MsaUJBQWlCLFFBQ2pCLDhCQUE4QjtBQUNyQyxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLGNBQWNDLFdBQVcsUUFBUSxvQkFBb0I7QUFDckQsU0FBU0MsTUFBTSxRQUFRLGlCQUFpQjtBQUN4QyxjQUFjQyxxQkFBcUIsUUFBUSwwQkFBMEI7QUFDckUsU0FBU0MsTUFBTSxRQUFRLDBCQUEwQjtBQUNqRCxTQUFTQyxNQUFNLFFBQVEsMkJBQTJCO0FBRWxELE1BQU1DLDBCQUEwQixHQUFHLFNBQVM7QUFDNUMsTUFBTUMsZ0NBQWdDLEdBQ3BDLDBFQUEwRTtBQUU1RSxTQUFTQyxtQkFBbUJBLENBQUNDLE1BQU0sRUFBRTtFQUNuQyxDQUFDQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQUVaLGlCQUFpQixHQUFHLElBQUk7QUFDL0MsQ0FBQyxDQUFDLEVBQUVLLHFCQUFxQixFQUFFLENBQUM7RUFDMUIsT0FBT1EsTUFBTSxDQUFDQyxPQUFPLENBQUNILE1BQU0sQ0FBQyxDQUFDSSxHQUFHLENBQUMsQ0FBQyxDQUFDQyxLQUFLLEVBQUVDLE1BQU0sQ0FBQyxNQUFNO0lBQ3REQyxLQUFLLEVBQUVELE1BQU0sRUFBRUUsSUFBSSxJQUFJWCwwQkFBMEI7SUFDakRZLEtBQUssRUFBRUosS0FBSztJQUNaSyxXQUFXLEVBQUVKLE1BQU0sRUFBRUksV0FBVyxJQUFJWjtFQUN0QyxDQUFDLENBQUMsQ0FBQztBQUNMO0FBRUEsT0FBTyxLQUFLYSxzQkFBc0IsR0FBRztFQUNuQ0MsWUFBWSxFQUFF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
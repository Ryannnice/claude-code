// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 PromptInputHelpMenu，将 ../PromptInput/PromptInputHelpMenu.js 中已经封装好的能力接到本文件流程里。
import { PromptInputHelpMenu } from '../PromptInput/PromptInputHelpMenu.js';
// General 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function General() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // t0 暂存 `<Box><Text>Claude understands your codebase, makes edits ...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<Box><Text>Claude understands your codebase, makes edits ...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Box><Text>Claude understands your codebase, makes edits with your permission, and executes commands — right from your terminal.</Text></Box>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // t1 暂存 `<Box flexDirection="column" paddingY={1} gap={1}>{t0}<Box...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Box flexDirection="column" paddingY={1} gap={1}>{t0}<Box...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box flexDirection="column" paddingY={1} gap={1}>{t0}<Box flexDirection="column"><Box><Text bold={true}>Shortcuts</Text></Box><PromptInputHelpMenu gap={2} fixedWidth={true} /></Box></Box>;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJQcm9tcHRJbnB1dEhlbHBNZW51IiwiR2VuZXJhbCIsIiQiLCJfYyIsInQwIiwiU3ltYm9sIiwiZm9yIiwidDEiXSwic291cmNlcyI6WyJHZW5lcmFsLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IFByb21wdElucHV0SGVscE1lbnUgfSBmcm9tICcuLi9Qcm9tcHRJbnB1dC9Qcm9tcHRJbnB1dEhlbHBNZW51LmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gR2VuZXJhbCgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdZPXsxfSBnYXA9ezF9PlxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgQ2xhdWRlIHVuZGVyc3RhbmRzIHlvdXIgY29kZWJhc2UsIG1ha2VzIGVkaXRzIHdpdGggeW91ciBwZXJtaXNzaW9uLFxuICAgICAgICAgIGFuZCBleGVjdXRlcyBjb21tYW5kcyDigJQgcmlnaHQgZnJvbSB5b3VyIHRlcm1pbmFsLlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGJvbGQ+U2hvcnRjdXRzPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPFByb21wdElucHV0SGVscE1lbnUgZ2FwPXsyfSBmaXhlZFdpZHRoPXt0cnVlfSAvPlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxtQkFBbUIsUUFBUSx1Q0FBdUM7QUFFM0UsT0FBTyxTQUFBQyxRQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBR0RGLEVBQUEsSUFBQyxHQUFHLENBQ0YsQ0FBQyxJQUFJLENBQUMscUhBR04sRUFIQyxJQUFJLENBSVAsRUFMQyxHQUFHLENBS0U7SUFBQUYsQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFOUkMsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFXLFFBQUMsQ0FBRCxHQUFDLENBQU8sR0FBQyxDQUFELEdBQUMsQ0FDN0MsQ0FBQUgsRUFLSyxDQUNMLENBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQ3pCLENBQUMsR0FBRyxDQUNGLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBQyxTQUFTLEVBQW5CLElBQUksQ0FDUCxFQUZDLEdBQUcsQ0FHSixDQUFDLG1CQUFtQixDQUFNLEdBQUMsQ0FBRCxHQUFDLENBQWMsVUFBSSxDQUFKLEtBQUcsQ0FBQyxHQUMvQyxFQUxDLEdBQUcsQ0FNTixFQWJDLEdBQUcsQ0FhRTtJQUFBRixDQUFBLE1BQUFLLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFMLENBQUE7RUFBQTtFQUFBLE9BYk5LLEVBYU07QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
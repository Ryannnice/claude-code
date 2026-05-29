// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
};
// AssistantRedactedThinkingMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AssistantRedactedThinkingMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addMargin: t1
  } = t0;
  // addMargin标记终端 UI Assistant Redacted T...是否启用对应路径。
  const addMargin = t1 === undefined ? false : t1;
  // 临时值 t2 命名 `addMargin ? 1 : 0`，让后续代码直接表达这个值的用途。
  const t2 = addMargin ? 1 : 0;
  // t3 暂存 `<Text dimColor={true} italic={true}>✻ Thinking…</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text dimColor={true} italic={true}>✻ Thinking…</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text dimColor={true} italic={true}>✻ Thinking…</Text>;
    // $[0] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[0];
  }
  // t4 暂存 `<Box marginTop={t2}>{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== t2) {
    // t4 暂存 `<Box marginTop={t2}>{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box marginTop={t2}>{t3}</Box>;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[2];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJQcm9wcyIsImFkZE1hcmdpbiIsIkFzc2lzdGFudFJlZGFjdGVkVGhpbmtpbmdNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJ0MSIsInVuZGVmaW5lZCIsInQyIiwidDMiLCJTeW1ib2wiLCJmb3IiLCJ0NCJdLCJzb3VyY2VzIjpbIkFzc2lzdGFudFJlZGFjdGVkVGhpbmtpbmdNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGFkZE1hcmdpbjogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gQXNzaXN0YW50UmVkYWN0ZWRUaGlua2luZ01lc3NhZ2Uoe1xuICBhZGRNYXJnaW4gPSBmYWxzZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8Qm94IG1hcmdpblRvcD17YWRkTWFyZ2luID8gMSA6IDB9PlxuICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICDinLsgVGhpbmtpbmfigKZcbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUV4QyxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsU0FBUyxFQUFFLE9BQU87QUFDcEIsQ0FBQztBQUVELE9BQU8sU0FBQUMsaUNBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBMEM7SUFBQUosU0FBQSxFQUFBSztFQUFBLElBQUFILEVBRXpDO0VBRE4sTUFBQUYsU0FBQSxHQUFBSyxFQUFpQixLQUFqQkMsU0FBaUIsR0FBakIsS0FBaUIsR0FBakJELEVBQWlCO0VBR0MsTUFBQUUsRUFBQSxHQUFBUCxTQUFTLEdBQVQsQ0FBaUIsR0FBakIsQ0FBaUI7RUFBQSxJQUFBUSxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBTSxNQUFBLENBQUFDLEdBQUE7SUFDL0JGLEVBQUEsSUFBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBTixLQUFLLENBQUMsQ0FBQyxXQUV0QixFQUZDLElBQUksQ0FFRTtJQUFBTCxDQUFBLE1BQUFLLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFMLENBQUE7RUFBQTtFQUFBLElBQUFRLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFJLEVBQUE7SUFIVEksRUFBQSxJQUFDLEdBQUcsQ0FBWSxTQUFpQixDQUFqQixDQUFBSixFQUFnQixDQUFDLENBQy9CLENBQUFDLEVBRU0sQ0FDUixFQUpDLEdBQUcsQ0FJRTtJQUFBTCxDQUFBLE1BQUFJLEVBQUE7SUFBQUosQ0FBQSxNQUFBUSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUixDQUFBO0VBQUE7RUFBQSxPQUpOUSxFQUlNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
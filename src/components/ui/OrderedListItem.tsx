// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、ReactNode、useContext，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, type ReactNode, useContext } from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// OrderedListItemContext 集合构建`createContext`，供终端渲染后续处理使用。
export const OrderedListItemContext = createContext({
  marker: ''
});
// OrderedListItemProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type OrderedListItemProps = {
  children: ReactNode;
};
// OrderedListItem 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function OrderedListItem(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    marker
  } = useContext(OrderedListItemContext);
  // t1 暂存 `<Text dimColor={true}>{marker}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== marker) {
    // t1 暂存 `<Text dimColor={true}>{marker}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text dimColor={true}>{marker}</Text>;
    // $[0] 缓存 `marker`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = marker;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `<Box flexDirection="column">{children}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== children) {
    // t2 暂存 `<Box flexDirection="column">{children}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexDirection="column">{children}</Box>;
    // $[2] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = children;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Box gap={1}>{t1}{t2}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== t1 || $[5] !== t2) {
    // t3 暂存 `<Box gap={1}>{t1}{t2}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box gap={1}>{t1}{t2}</Box>;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJSZWFjdE5vZGUiLCJ1c2VDb250ZXh0IiwiQm94IiwiVGV4dCIsIk9yZGVyZWRMaXN0SXRlbUNvbnRleHQiLCJtYXJrZXIiLCJPcmRlcmVkTGlzdEl0ZW1Qcm9wcyIsImNoaWxkcmVuIiwiT3JkZXJlZExpc3RJdGVtIiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwidDMiXSwic291cmNlcyI6WyJPcmRlcmVkTGlzdEl0ZW0udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyBjcmVhdGVDb250ZXh0LCB0eXBlIFJlYWN0Tm9kZSwgdXNlQ29udGV4dCB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuXG5leHBvcnQgY29uc3QgT3JkZXJlZExpc3RJdGVtQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQoeyBtYXJrZXI6ICcnIH0pXG5cbnR5cGUgT3JkZXJlZExpc3RJdGVtUHJvcHMgPSB7XG4gIGNoaWxkcmVuOiBSZWFjdE5vZGVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE9yZGVyZWRMaXN0SXRlbSh7XG4gIGNoaWxkcmVuLFxufTogT3JkZXJlZExpc3RJdGVtUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IG1hcmtlciB9ID0gdXNlQ29udGV4dChPcmRlcmVkTGlzdEl0ZW1Db250ZXh0KVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBnYXA9ezF9PlxuICAgICAgPFRleHQgZGltQ29sb3I+e21hcmtlcn08L1RleHQ+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj57Y2hpbGRyZW59PC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsYUFBYSxFQUFFLEtBQUtDLFNBQVMsRUFBRUMsVUFBVSxRQUFRLE9BQU87QUFDeEUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUV4QyxPQUFPLE1BQU1DLHNCQUFzQixHQUFHTCxhQUFhLENBQUM7RUFBRU0sTUFBTSxFQUFFO0FBQUcsQ0FBQyxDQUFDO0FBRW5FLEtBQUtDLG9CQUFvQixHQUFHO0VBQzFCQyxRQUFRLEVBQUVQLFNBQVM7QUFDckIsQ0FBQztBQUVELE9BQU8sU0FBQVEsZ0JBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBeUI7SUFBQUo7RUFBQSxJQUFBRSxFQUVUO0VBQ3JCO0lBQUFKO0VBQUEsSUFBbUJKLFVBQVUsQ0FBQ0csc0JBQXNCLENBQUM7RUFBQSxJQUFBUSxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBTCxNQUFBO0lBSWpETyxFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBRVAsT0FBSyxDQUFFLEVBQXRCLElBQUksQ0FBeUI7SUFBQUssQ0FBQSxNQUFBTCxNQUFBO0lBQUFLLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQUgsUUFBQTtJQUM5Qk0sRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFFTixTQUFPLENBQUUsRUFBckMsR0FBRyxDQUF3QztJQUFBRyxDQUFBLE1BQUFILFFBQUE7SUFBQUcsQ0FBQSxNQUFBRyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSCxDQUFBO0VBQUE7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBRSxFQUFBLElBQUFGLENBQUEsUUFBQUcsRUFBQTtJQUY5Q0MsRUFBQSxJQUFDLEdBQUcsQ0FBTSxHQUFDLENBQUQsR0FBQyxDQUNULENBQUFGLEVBQTZCLENBQzdCLENBQUFDLEVBQTJDLENBQzdDLEVBSEMsR0FBRyxDQUdFO0lBQUFILENBQUEsTUFBQUUsRUFBQTtJQUFBRixDQUFBLE1BQUFHLEVBQUE7SUFBQUgsQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBQSxPQUhOSSxFQUdNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
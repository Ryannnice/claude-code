// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 Markdown 终端界面组件，避免在这里重复拼装显示逻辑。
import { Markdown } from 'src/components/Markdown.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from 'src/components/MessageResponse.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  plan: string;
};
// RejectedPlanMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function RejectedPlanMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    plan
  } = t0;
  // t1 暂存 `<Text color="subtle">User rejected Claude's plan:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text color="subtle">User rejected Claude's plan:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color="subtle">User rejected Claude's plan:</Text>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2暂存 `<MessageResponse><Box flexDirection="column">{t1}<Box bor...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== plan) {
    // t2暂存 `<MessageResponse><Box flexDirection="column">{t1}<Box bor...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <MessageResponse><Box flexDirection="column">{t1}<Box borderStyle="round" borderColor="planMode" paddingX={1} overflow="hidden"><Markdown>{plan}</Markdown></Box></Box></MessageResponse>;
    // $[1] 缓存 `plan`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = plan;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 返回 t2，把终端渲染这个分支的结果交还调用方。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1hcmtkb3duIiwiTWVzc2FnZVJlc3BvbnNlIiwiQm94IiwiVGV4dCIsIlByb3BzIiwicGxhbiIsIlJlamVjdGVkUGxhbk1lc3NhZ2UiLCJ0MCIsIiQiLCJfYyIsInQxIiwiU3ltYm9sIiwiZm9yIiwidDIiXSwic291cmNlcyI6WyJSZWplY3RlZFBsYW5NZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IE1hcmtkb3duIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvTWFya2Rvd24uanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICdzcmMvY29tcG9uZW50cy9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHBsYW46IHN0cmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gUmVqZWN0ZWRQbGFuTWVzc2FnZSh7IHBsYW4gfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgY29sb3I9XCJzdWJ0bGVcIj5Vc2VyIHJlamVjdGVkIENsYXVkZSZhcG9zO3MgcGxhbjo8L1RleHQ+XG4gICAgICAgIDxCb3hcbiAgICAgICAgICBib3JkZXJTdHlsZT1cInJvdW5kXCJcbiAgICAgICAgICBib3JkZXJDb2xvcj1cInBsYW5Nb2RlXCJcbiAgICAgICAgICBwYWRkaW5nWD17MX1cbiAgICAgICAgICAvLyBOZWNlc3NhcnkgZm9yIFdpbmRvd3MgVGVybWluYWwgdG8gcmVuZGVyIHByb3Blcmx5XG4gICAgICAgICAgb3ZlcmZsb3c9XCJoaWRkZW5cIlxuICAgICAgICA+XG4gICAgICAgICAgPE1hcmtkb3duPntwbGFufTwvTWFya2Rvd24+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsUUFBUSxRQUFRLDRCQUE0QjtBQUNyRCxTQUFTQyxlQUFlLFFBQVEsbUNBQW1DO0FBQ25FLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGlCQUFpQjtBQUUzQyxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsSUFBSSxFQUFFLE1BQU07QUFDZCxDQUFDO0FBRUQsT0FBTyxTQUFBQyxvQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUE2QjtJQUFBSjtFQUFBLElBQUFFLEVBQWU7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFJM0NGLEVBQUEsSUFBQyxJQUFJLENBQU8sS0FBUSxDQUFSLFFBQVEsQ0FBQyw0QkFBaUMsRUFBckQsSUFBSSxDQUF3RDtJQUFBRixDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQUFBLElBQUFLLEVBQUE7RUFBQSxJQUFBTCxDQUFBLFFBQUFILElBQUE7SUFGakVRLEVBQUEsSUFBQyxlQUFlLENBQ2QsQ0FBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDekIsQ0FBQUgsRUFBNEQsQ0FDNUQsQ0FBQyxHQUFHLENBQ1UsV0FBTyxDQUFQLE9BQU8sQ0FDUCxXQUFVLENBQVYsVUFBVSxDQUNaLFFBQUMsQ0FBRCxHQUFDLENBRUYsUUFBUSxDQUFSLFFBQVEsQ0FFakIsQ0FBQyxRQUFRLENBQUVMLEtBQUcsQ0FBRSxFQUFmLFFBQVEsQ0FDWCxFQVJDLEdBQUcsQ0FTTixFQVhDLEdBQUcsQ0FZTixFQWJDLGVBQWUsQ0FhRTtJQUFBRyxDQUFBLE1BQUFILElBQUE7SUFBQUcsQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFBQSxPQWJsQkssRUFha0I7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
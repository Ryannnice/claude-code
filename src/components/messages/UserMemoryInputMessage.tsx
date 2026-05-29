// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 sample，将 lodash-es/sample.js 中已经封装好的能力接到本文件流程里。
import sample from 'lodash-es/sample.js';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// getSavingMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSavingMessage(): string {
  // 返回 `sample(['Got it.', 'Good to know.', 'Noted.'])`，作为终端渲染这次计算的结果。
  return sample(['Got it.', 'Good to know.', 'Noted.']);
}
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
  text: string;
};
// UserMemoryInputMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserMemoryInputMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text,
    addMargin
  } = t0;
  // t1 暂存 `extractTag(text, "user-memory-input")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== text) {
    // t1 暂存 `extractTag(text, "user-memory-input")` 生成的渲染片段，后续返回路径直接复用。
    t1 = extractTag(text, "user-memory-input");
    // $[0] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = text;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 用户输入 命名 `t1`，让后续代码直接表达这个值的用途。
  const input = t1;
  // t2 暂存 `getSavingMessage()` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `getSavingMessage()` 生成的渲染片段，后续返回路径直接复用。
    t2 = getSavingMessage();
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // savingText沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const savingText = t2;
  // 用户输入缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!input) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t3保存`addMargin ? 1 : 0`，供后续判断或组装使用。
  const t3 = addMargin ? 1 : 0;
  // t4 暂存 `<Text color="remember" backgroundColor="memoryBackgroundC...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text color="remember" backgroundColor="memoryBackgroundC...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text color="remember" backgroundColor="memoryBackgroundColor">#</Text>;
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // t5 暂存 `<Box>{t4}<Text backgroundColor="memoryBackgroundColor" co...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== input) {
    // t5 暂存 `<Box>{t4}<Text backgroundColor="memoryBackgroundColor" co...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box>{t4}<Text backgroundColor="memoryBackgroundColor" color="text">{" "}{input}{" "}</Text></Box>;
    // $[4] 缓存 `input`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = input;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // t6 暂存 `<MessageResponse height={1}><Text dimColor={true}>{saving...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<MessageResponse height={1}><Text dimColor={true}>{saving...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <MessageResponse height={1}><Text dimColor={true}>{savingText}</Text></MessageResponse>;
    // $[6] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[6];
  }
  // t7 暂存 `<Box flexDirection="column" marginTop={t3} width="100%">{...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t3 || $[8] !== t5) {
    // t7 暂存 `<Box flexDirection="column" marginTop={t3} width="100%">{...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column" marginTop={t3} width="100%">{t5}{t6}</Box>;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[9];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzYW1wbGUiLCJSZWFjdCIsInVzZU1lbW8iLCJCb3giLCJUZXh0IiwiZXh0cmFjdFRhZyIsIk1lc3NhZ2VSZXNwb25zZSIsImdldFNhdmluZ01lc3NhZ2UiLCJQcm9wcyIsImFkZE1hcmdpbiIsInRleHQiLCJVc2VyTWVtb3J5SW5wdXRNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJ0MSIsImlucHV0IiwidDIiLCJTeW1ib2wiLCJmb3IiLCJzYXZpbmdUZXh0IiwidDMiLCJ0NCIsInQ1IiwidDYiLCJ0NyJdLCJzb3VyY2VzIjpbIlVzZXJNZW1vcnlJbnB1dE1lc3NhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzYW1wbGUgZnJvbSAnbG9kYXNoLWVzL3NhbXBsZS5qcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlTWVtbyB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZXh0cmFjdFRhZyB9IGZyb20gJy4uLy4uL3V0aWxzL21lc3NhZ2VzLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vTWVzc2FnZVJlc3BvbnNlLmpzJ1xuXG5mdW5jdGlvbiBnZXRTYXZpbmdNZXNzYWdlKCk6IHN0cmluZyB7XG4gIHJldHVybiBzYW1wbGUoWydHb3QgaXQuJywgJ0dvb2QgdG8ga25vdy4nLCAnTm90ZWQuJ10pXG59XG5cbnR5cGUgUHJvcHMgPSB7XG4gIGFkZE1hcmdpbjogYm9vbGVhblxuICB0ZXh0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFVzZXJNZW1vcnlJbnB1dE1lc3NhZ2Uoe1xuICB0ZXh0LFxuICBhZGRNYXJnaW4sXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGlucHV0ID0gZXh0cmFjdFRhZyh0ZXh0LCAndXNlci1tZW1vcnktaW5wdXQnKVxuICBjb25zdCBzYXZpbmdUZXh0ID0gdXNlTWVtbygoKSA9PiBnZXRTYXZpbmdNZXNzYWdlKCksIFtdKVxuXG4gIGlmICghaW5wdXQpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9e2FkZE1hcmdpbiA/IDEgOiAwfSB3aWR0aD1cIjEwMCVcIj5cbiAgICAgIDxCb3g+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwicmVtZW1iZXJcIiBiYWNrZ3JvdW5kQ29sb3I9XCJtZW1vcnlCYWNrZ3JvdW5kQ29sb3JcIj5cbiAgICAgICAgICAjXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwibWVtb3J5QmFja2dyb3VuZENvbG9yXCIgY29sb3I9XCJ0ZXh0XCI+XG4gICAgICAgICAgeycgJ31cbiAgICAgICAgICB7aW5wdXR9eycgJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPntzYXZpbmdUZXh0fTwvVGV4dD5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxNQUFNLE1BQU0scUJBQXFCO0FBQ3hDLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsT0FBTyxRQUFRLE9BQU87QUFDL0IsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxVQUFVLFFBQVEseUJBQXlCO0FBQ3BELFNBQVNDLGVBQWUsUUFBUSx1QkFBdUI7QUFFdkQsU0FBU0MsZ0JBQWdCQSxDQUFBLENBQUUsRUFBRSxNQUFNLENBQUM7RUFDbEMsT0FBT1AsTUFBTSxDQUFDLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN2RDtBQUVBLEtBQUtRLEtBQUssR0FBRztFQUNYQyxTQUFTLEVBQUUsT0FBTztFQUNsQkMsSUFBSSxFQUFFLE1BQU07QUFDZCxDQUFDO0FBRUQsT0FBTyxTQUFBQyx1QkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFnQztJQUFBSixJQUFBO0lBQUFEO0VBQUEsSUFBQUcsRUFHL0I7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBSCxJQUFBO0lBQ1FLLEVBQUEsR0FBQVYsVUFBVSxDQUFDSyxJQUFJLEVBQUUsbUJBQW1CLENBQUM7SUFBQUcsQ0FBQSxNQUFBSCxJQUFBO0lBQUFHLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQW5ELE1BQUFHLEtBQUEsR0FBY0QsRUFBcUM7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBSyxNQUFBLENBQUFDLEdBQUE7SUFDbEJGLEVBQUEsR0FBQVYsZ0JBQWdCLENBQUMsQ0FBQztJQUFBTSxDQUFBLE1BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUFuRCxNQUFBTyxVQUFBLEdBQWlDSCxFQUFrQjtFQUVuRCxJQUFJLENBQUNELEtBQUs7SUFBQSxPQUNELElBQUk7RUFBQTtFQUk0QixNQUFBSyxFQUFBLEdBQUFaLFNBQVMsR0FBVCxDQUFpQixHQUFqQixDQUFpQjtFQUFBLElBQUFhLEVBQUE7RUFBQSxJQUFBVCxDQUFBLFFBQUFLLE1BQUEsQ0FBQUMsR0FBQTtJQUVwREcsRUFBQSxJQUFDLElBQUksQ0FBTyxLQUFVLENBQVYsVUFBVSxDQUFpQixlQUF1QixDQUF2Qix1QkFBdUIsQ0FBQyxDQUUvRCxFQUZDLElBQUksQ0FFRTtJQUFBVCxDQUFBLE1BQUFTLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFULENBQUE7RUFBQTtFQUFBLElBQUFVLEVBQUE7RUFBQSxJQUFBVixDQUFBLFFBQUFHLEtBQUE7SUFIVE8sRUFBQSxJQUFDLEdBQUcsQ0FDRixDQUFBRCxFQUVNLENBQ04sQ0FBQyxJQUFJLENBQWlCLGVBQXVCLENBQXZCLHVCQUF1QixDQUFPLEtBQU0sQ0FBTixNQUFNLENBQ3ZELElBQUUsQ0FDRk4sTUFBSSxDQUFHLElBQUUsQ0FDWixFQUhDLElBQUksQ0FJUCxFQVJDLEdBQUcsQ0FRRTtJQUFBSCxDQUFBLE1BQUFHLEtBQUE7SUFBQUgsQ0FBQSxNQUFBVSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBVixDQUFBO0VBQUE7RUFBQSxJQUFBVyxFQUFBO0VBQUEsSUFBQVgsQ0FBQSxRQUFBSyxNQUFBLENBQUFDLEdBQUE7SUFDTkssRUFBQSxJQUFDLGVBQWUsQ0FBUyxNQUFDLENBQUQsR0FBQyxDQUN4QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUVKLFdBQVMsQ0FBRSxFQUExQixJQUFJLENBQ1AsRUFGQyxlQUFlLENBRUU7SUFBQVAsQ0FBQSxNQUFBVyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWCxDQUFBO0VBQUE7RUFBQSxJQUFBWSxFQUFBO0VBQUEsSUFBQVosQ0FBQSxRQUFBUSxFQUFBLElBQUFSLENBQUEsUUFBQVUsRUFBQTtJQVpwQkUsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFZLFNBQWlCLENBQWpCLENBQUFKLEVBQWdCLENBQUMsQ0FBUSxLQUFNLENBQU4sTUFBTSxDQUNwRSxDQUFBRSxFQVFLLENBQ0wsQ0FBQUMsRUFFaUIsQ0FDbkIsRUFiQyxHQUFHLENBYUU7SUFBQVgsQ0FBQSxNQUFBUSxFQUFBO0lBQUFSLENBQUEsTUFBQVUsRUFBQTtJQUFBVixDQUFBLE1BQUFZLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFaLENBQUE7RUFBQTtFQUFBLE9BYk5ZLEVBYU07QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==
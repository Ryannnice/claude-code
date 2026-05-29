// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 类型依赖 { NormalizedMessage } 来自 ../types/message.js，用于校准终端渲染的数据契约。
import type { NormalizedMessage } from '../types/message.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  message: NormalizedMessage;
  isTranscriptMode: boolean;
};
// MessageTimestamp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MessageTimestamp(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    message,
    isTranscriptMode
  } = t0;
  // shouldShowTimestamp记录 `content.some` 是否成立，终端渲染随后按该结果分支。
  const shouldShowTimestamp = isTranscriptMode && message.timestamp && message.type === "assistant" && message.message.content.some(_temp);
  // shouldShowTimestamp缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!shouldShowTimestamp) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // T0 暂存 `Box` 的派生结果，便于缓存命中时直接复用。
  let T0;
  // formattedTimestamp 先占位，稍后的条件分支会根据实际输入补齐它。
  let formattedTimestamp;
  // t1 暂存 `stringWidth(formattedTimestamp)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== message.timestamp) {
    // formattedTimestamp更新为 `new Date(message.timestamp).toLocaleTimeString("en-US", {`，确保终端 UI后续读取最新状态。
    formattedTimestamp = new Date(message.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t1 暂存 `stringWidth(formattedTimestamp)` 生成的渲染片段，后续返回路径直接复用。
    t1 = stringWidth(formattedTimestamp);
    // $[0] 缓存 `message.timestamp`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = message.timestamp;
    // $[1] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = T0;
    // $[2] 缓存 `formattedTimestamp`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = formattedTimestamp;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // T0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[1];
    // formattedTimestamp更新为 `$[2]`，确保终端 UI后续读取最新状态。
    formattedTimestamp = $[2];
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // t2 暂存 `<Text dimColor={true}>{formattedTimestamp}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== formattedTimestamp) {
    // t2 暂存 `<Text dimColor={true}>{formattedTimestamp}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>{formattedTimestamp}</Text>;
    // $[4] 缓存 `formattedTimestamp`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = formattedTimestamp;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // t3 暂存 `<T0 minWidth={t1}>{t2}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== T0 || $[7] !== t1 || $[8] !== t2) {
    // t3 暂存 `<T0 minWidth={t1}>{t2}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <T0 minWidth={t1}>{t2}</T0>;
    // $[6] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = T0;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(c) {
  // 返回 `c.type === "text"`，作为终端渲染这次计算的结果。
  return c.type === "text";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInN0cmluZ1dpZHRoIiwiQm94IiwiVGV4dCIsIk5vcm1hbGl6ZWRNZXNzYWdlIiwiUHJvcHMiLCJtZXNzYWdlIiwiaXNUcmFuc2NyaXB0TW9kZSIsIk1lc3NhZ2VUaW1lc3RhbXAiLCJ0MCIsIiQiLCJfYyIsInNob3VsZFNob3dUaW1lc3RhbXAiLCJ0aW1lc3RhbXAiLCJ0eXBlIiwiY29udGVudCIsInNvbWUiLCJfdGVtcCIsIlQwIiwiZm9ybWF0dGVkVGltZXN0YW1wIiwidDEiLCJEYXRlIiwidG9Mb2NhbGVUaW1lU3RyaW5nIiwiaG91ciIsIm1pbnV0ZSIsImhvdXIxMiIsInQyIiwidDMiLCJjIl0sInNvdXJjZXMiOlsiTWVzc2FnZVRpbWVzdGFtcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IE5vcm1hbGl6ZWRNZXNzYWdlIH0gZnJvbSAnLi4vdHlwZXMvbWVzc2FnZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgbWVzc2FnZTogTm9ybWFsaXplZE1lc3NhZ2VcbiAgaXNUcmFuc2NyaXB0TW9kZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gTWVzc2FnZVRpbWVzdGFtcCh7XG4gIG1lc3NhZ2UsXG4gIGlzVHJhbnNjcmlwdE1vZGUsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHNob3VsZFNob3dUaW1lc3RhbXAgPVxuICAgIGlzVHJhbnNjcmlwdE1vZGUgJiZcbiAgICBtZXNzYWdlLnRpbWVzdGFtcCAmJlxuICAgIG1lc3NhZ2UudHlwZSA9PT0gJ2Fzc2lzdGFudCcgJiZcbiAgICBtZXNzYWdlLm1lc3NhZ2UuY29udGVudC5zb21lKGMgPT4gYy50eXBlID09PSAndGV4dCcpXG5cbiAgaWYgKCFzaG91bGRTaG93VGltZXN0YW1wKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IGZvcm1hdHRlZFRpbWVzdGFtcCA9IG5ldyBEYXRlKG1lc3NhZ2UudGltZXN0YW1wKS50b0xvY2FsZVRpbWVTdHJpbmcoXG4gICAgJ2VuLVVTJyxcbiAgICB7XG4gICAgICBob3VyOiAnMi1kaWdpdCcsXG4gICAgICBtaW51dGU6ICcyLWRpZ2l0JyxcbiAgICAgIGhvdXIxMjogdHJ1ZSxcbiAgICB9LFxuICApXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IG1pbldpZHRoPXtzdHJpbmdXaWR0aChmb3JtYXR0ZWRUaW1lc3RhbXApfT5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPntmb3JtYXR0ZWRUaW1lc3RhbXB9PC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxXQUFXLFFBQVEsdUJBQXVCO0FBQ25ELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsY0FBY0MsaUJBQWlCLFFBQVEscUJBQXFCO0FBRTVELEtBQUtDLEtBQUssR0FBRztFQUNYQyxPQUFPLEVBQUVGLGlCQUFpQjtFQUMxQkcsZ0JBQWdCLEVBQUUsT0FBTztBQUMzQixDQUFDO0FBRUQsT0FBTyxTQUFBQyxpQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUEwQjtJQUFBTCxPQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFHekI7RUFDTixNQUFBRyxtQkFBQSxHQUNFTCxnQkFDaUIsSUFBakJELE9BQU8sQ0FBQU8sU0FDcUIsSUFBNUJQLE9BQU8sQ0FBQVEsSUFBSyxLQUFLLFdBQ21DLElBQXBEUixPQUFPLENBQUFBLE9BQVEsQ0FBQVMsT0FBUSxDQUFBQyxJQUFLLENBQUNDLEtBQXNCLENBQUM7RUFFdEQsSUFBSSxDQUFDTCxtQkFBbUI7SUFBQSxPQUNmLElBQUk7RUFBQTtFQUNaLElBQUFNLEVBQUE7RUFBQSxJQUFBQyxrQkFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBVixDQUFBLFFBQUFKLE9BQUEsQ0FBQU8sU0FBQTtJQUVETSxrQkFBQSxHQUEyQixJQUFJRSxJQUFJLENBQUNmLE9BQU8sQ0FBQU8sU0FBVSxDQUFDLENBQUFTLGtCQUFtQixDQUN2RSxPQUFPLEVBQ1A7TUFBQUMsSUFBQSxFQUNRLFNBQVM7TUFBQUMsTUFBQSxFQUNQLFNBQVM7TUFBQUMsTUFBQSxFQUNUO0lBQ1YsQ0FDRixDQUFDO0lBR0VQLEVBQUEsR0FBQWhCLEdBQUc7SUFBV2tCLEVBQUEsR0FBQW5CLFdBQVcsQ0FBQ2tCLGtCQUFrQixDQUFDO0lBQUFULENBQUEsTUFBQUosT0FBQSxDQUFBTyxTQUFBO0lBQUFILENBQUEsTUFBQVEsRUFBQTtJQUFBUixDQUFBLE1BQUFTLGtCQUFBO0lBQUFULENBQUEsTUFBQVUsRUFBQTtFQUFBO0lBQUFGLEVBQUEsR0FBQVIsQ0FBQTtJQUFBUyxrQkFBQSxHQUFBVCxDQUFBO0lBQUFVLEVBQUEsR0FBQVYsQ0FBQTtFQUFBO0VBQUEsSUFBQWdCLEVBQUE7RUFBQSxJQUFBaEIsQ0FBQSxRQUFBUyxrQkFBQTtJQUM1Q08sRUFBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUVQLG1CQUFpQixDQUFFLEVBQWxDLElBQUksQ0FBcUM7SUFBQVQsQ0FBQSxNQUFBUyxrQkFBQTtJQUFBVCxDQUFBLE1BQUFnQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBaEIsQ0FBQTtFQUFBO0VBQUEsSUFBQWlCLEVBQUE7RUFBQSxJQUFBakIsQ0FBQSxRQUFBUSxFQUFBLElBQUFSLENBQUEsUUFBQVUsRUFBQSxJQUFBVixDQUFBLFFBQUFnQixFQUFBO0lBRDVDQyxFQUFBLElBQUMsRUFBRyxDQUFXLFFBQStCLENBQS9CLENBQUFQLEVBQThCLENBQUMsQ0FDNUMsQ0FBQU0sRUFBeUMsQ0FDM0MsRUFGQyxFQUFHLENBRUU7SUFBQWhCLENBQUEsTUFBQVEsRUFBQTtJQUFBUixDQUFBLE1BQUFVLEVBQUE7SUFBQVYsQ0FBQSxNQUFBZ0IsRUFBQTtJQUFBaEIsQ0FBQSxNQUFBaUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWpCLENBQUE7RUFBQTtFQUFBLE9BRk5pQixFQUVNO0FBQUE7QUExQkgsU0FBQVYsTUFBQVcsQ0FBQTtFQUFBLE9BUStCQSxDQUFDLENBQUFkLElBQUssS0FBSyxNQUFNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
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
// MessageModel 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MessageModel(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    message,
    isTranscriptMode
  } = t0;
  // shouldShowModel记录 `content.some` 是否成立，终端渲染随后按该结果分支。
  const shouldShowModel = isTranscriptMode && message.type === "assistant" && message.message.model && message.message.content.some(_temp);
  // shouldShowModel缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!shouldShowModel) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 临时值 t1保存`stringWidth`，供终端渲染后续处理使用。
  const t1 = stringWidth(message.message.model) + 8;
  // t2 暂存 `<Text dimColor={true}>{message.message.model}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== message.message.model) {
    // t2 暂存 `<Text dimColor={true}>{message.message.model}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>{message.message.model}</Text>;
    // $[0] 缓存 `message.message.model`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = message.message.model;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3 暂存 `<Box minWidth={t1}>{t2}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t1 || $[3] !== t2) {
    // t3 暂存 `<Box minWidth={t1}>{t2}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box minWidth={t1}>{t2}</Box>;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(c) {
  // 返回 `c.type === "text"`，作为终端渲染这次计算的结果。
  return c.type === "text";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInN0cmluZ1dpZHRoIiwiQm94IiwiVGV4dCIsIk5vcm1hbGl6ZWRNZXNzYWdlIiwiUHJvcHMiLCJtZXNzYWdlIiwiaXNUcmFuc2NyaXB0TW9kZSIsIk1lc3NhZ2VNb2RlbCIsInQwIiwiJCIsIl9jIiwic2hvdWxkU2hvd01vZGVsIiwidHlwZSIsIm1vZGVsIiwiY29udGVudCIsInNvbWUiLCJfdGVtcCIsInQxIiwidDIiLCJ0MyIsImMiXSwic291cmNlcyI6WyJNZXNzYWdlTW9kZWwudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHN0cmluZ1dpZHRoIH0gZnJvbSAnLi4vaW5rL3N0cmluZ1dpZHRoLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBOb3JtYWxpemVkTWVzc2FnZSB9IGZyb20gJy4uL3R5cGVzL21lc3NhZ2UuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG1lc3NhZ2U6IE5vcm1hbGl6ZWRNZXNzYWdlXG4gIGlzVHJhbnNjcmlwdE1vZGU6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE1lc3NhZ2VNb2RlbCh7XG4gIG1lc3NhZ2UsXG4gIGlzVHJhbnNjcmlwdE1vZGUsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHNob3VsZFNob3dNb2RlbCA9XG4gICAgaXNUcmFuc2NyaXB0TW9kZSAmJlxuICAgIG1lc3NhZ2UudHlwZSA9PT0gJ2Fzc2lzdGFudCcgJiZcbiAgICBtZXNzYWdlLm1lc3NhZ2UubW9kZWwgJiZcbiAgICBtZXNzYWdlLm1lc3NhZ2UuY29udGVudC5zb21lKGMgPT4gYy50eXBlID09PSAndGV4dCcpXG5cbiAgaWYgKCFzaG91bGRTaG93TW9kZWwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IG1pbldpZHRoPXtzdHJpbmdXaWR0aChtZXNzYWdlLm1lc3NhZ2UubW9kZWwpICsgOH0+XG4gICAgICA8VGV4dCBkaW1Db2xvcj57bWVzc2FnZS5tZXNzYWdlLm1vZGVsfTwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsV0FBVyxRQUFRLHVCQUF1QjtBQUNuRCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLGNBQWNDLGlCQUFpQixRQUFRLHFCQUFxQjtBQUU1RCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsT0FBTyxFQUFFRixpQkFBaUI7RUFDMUJHLGdCQUFnQixFQUFFLE9BQU87QUFDM0IsQ0FBQztBQUVELE9BQU8sU0FBQUMsYUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFzQjtJQUFBTCxPQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFHckI7RUFDTixNQUFBRyxlQUFBLEdBQ0VMLGdCQUM0QixJQUE1QkQsT0FBTyxDQUFBTyxJQUFLLEtBQUssV0FDSSxJQUFyQlAsT0FBTyxDQUFBQSxPQUFRLENBQUFRLEtBQ3FDLElBQXBEUixPQUFPLENBQUFBLE9BQVEsQ0FBQVMsT0FBUSxDQUFBQyxJQUFLLENBQUNDLEtBQXNCLENBQUM7RUFFdEQsSUFBSSxDQUFDTCxlQUFlO0lBQUEsT0FDWCxJQUFJO0VBQUE7RUFJSSxNQUFBTSxFQUFBLEdBQUFqQixXQUFXLENBQUNLLE9BQU8sQ0FBQUEsT0FBUSxDQUFBUSxLQUFNLENBQUMsR0FBRyxDQUFDO0VBQUEsSUFBQUssRUFBQTtFQUFBLElBQUFULENBQUEsUUFBQUosT0FBQSxDQUFBQSxPQUFBLENBQUFRLEtBQUE7SUFDbkRLLEVBQUEsSUFBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFFLENBQUFiLE9BQU8sQ0FBQUEsT0FBUSxDQUFBUSxLQUFLLENBQUUsRUFBckMsSUFBSSxDQUF3QztJQUFBSixDQUFBLE1BQUFKLE9BQUEsQ0FBQUEsT0FBQSxDQUFBUSxLQUFBO0lBQUFKLENBQUEsTUFBQVMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVQsQ0FBQTtFQUFBO0VBQUEsSUFBQVUsRUFBQTtFQUFBLElBQUFWLENBQUEsUUFBQVEsRUFBQSxJQUFBUixDQUFBLFFBQUFTLEVBQUE7SUFEL0NDLEVBQUEsSUFBQyxHQUFHLENBQVcsUUFBc0MsQ0FBdEMsQ0FBQUYsRUFBcUMsQ0FBQyxDQUNuRCxDQUFBQyxFQUE0QyxDQUM5QyxFQUZDLEdBQUcsQ0FFRTtJQUFBVCxDQUFBLE1BQUFRLEVBQUE7SUFBQVIsQ0FBQSxNQUFBUyxFQUFBO0lBQUFULENBQUEsTUFBQVUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVYsQ0FBQTtFQUFBO0VBQUEsT0FGTlUsRUFFTTtBQUFBO0FBakJILFNBQUFILE1BQUFJLENBQUE7RUFBQSxPQVErQkEsQ0FBQyxDQUFBUixJQUFLLEtBQUssTUFBTTtBQUFBIiwiaWdub3JlTGlzdCI6W119
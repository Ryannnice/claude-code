// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 COMMAND_MESSAGE_TAG，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { COMMAND_MESSAGE_TAG } from '../../constants/xml.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
  param: TextBlockParam;
};
// UserCommandMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserCommandMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(19);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addMargin,
    param: t1
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text
  } = t1;
  // t2 暂存 `extractTag(text, COMMAND_MESSAGE_TAG)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== text) {
    // t2 暂存 `extractTag(text, COMMAND_MESSAGE_TAG)` 生成的渲染片段，后续返回路径直接复用。
    t2 = extractTag(text, COMMAND_MESSAGE_TAG);
    // $[0] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = text;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // commandMessage 命令数据保存`t2`，作为后续临时缓存值处理的输入。
  const commandMessage = t2;
  // t3 暂存 `extractTag(text, "command-args")` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== text) {
    // t3 暂存 `extractTag(text, "command-args")` 生成的渲染片段，后续返回路径直接复用。
    t3 = extractTag(text, "command-args");
    // $[2] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = text;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 参数列表保存`t3`，作为后续临时缓存值处理的输入。
  const args = t3;
  // isSkillFormat记录 `extractTag` 是否成立，终端渲染随后按该结果分支。
  const isSkillFormat = extractTag(text, "skill-format") === "true";
  // commandMessage 命令数据缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!commandMessage) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 满足 `isSkillFormat` 时，终端渲染执行该分支。
  if (isSkillFormat) {
    // 临时值 t4 命名 `addMargin ? 1 : 0`，让后续代码直接表达这个值的用途。
    const t4 = addMargin ? 1 : 0;
    // t5 暂存 `<Text color="subtle">{figures.pointer} </Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<Text color="subtle">{figures.pointer} </Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text color="subtle">{figures.pointer} </Text>;
      // $[4] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[4];
    }
    // t6 暂存 `<Text>{t5}<Text color="text">Skill({commandMessage})</Tex...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== commandMessage) {
      // t6 暂存 `<Text>{t5}<Text color="text">Skill({commandMessage})</Tex...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Text>{t5}<Text color="text">Skill({commandMessage})</Text></Text>;
      // $[5] 缓存 `commandMessage`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = commandMessage;
      // $[6] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[6];
    }
    // t7 暂存 `<Box flexDirection="column" marginTop={t4} backgroundColo...` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== t4 || $[8] !== t6) {
      // t7 暂存 `<Box flexDirection="column" marginTop={t4} backgroundColo...` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Box flexDirection="column" marginTop={t4} backgroundColor="userMessageBackground" paddingRight={1}>{t6}</Box>;
      // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t4;
      // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t6;
      // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[9];
    }
    // 返回 `t7`，作为终端渲染这次计算的结果。
    return t7;
  }
  // t4 暂存 `[commandMessage, args].filter(Boolean)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== args || $[11] !== commandMessage) {
    // t4 暂存 `[commandMessage, args].filter(Boolean)` 生成的渲染片段，后续返回路径直接复用。
    t4 = [commandMessage, args].filter(Boolean);
    // $[10] 缓存 `args`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = args;
    // $[11] 缓存 `commandMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = commandMessage;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
  }
  // 文本内容格式化`t4.join`，供终端渲染后续处理使用。
  const content = `/${t4.join(" ")}`;
  // 临时值 t5 命名 `addMargin ? 1 : 0`，让后续代码直接表达这个值的用途。
  const t5 = addMargin ? 1 : 0;
  // t6 暂存 `<Text color="subtle">{figures.pointer} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Text color="subtle">{figures.pointer} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text color="subtle">{figures.pointer} </Text>;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // t7 暂存 `<Text>{t6}<Text color="text">{content}</Text></Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== content) {
    // t7 暂存 `<Text>{t6}<Text color="text">{content}</Text></Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text>{t6}<Text color="text">{content}</Text></Text>;
    // $[14] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = content;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // t8 暂存 `<Box flexDirection="column" marginTop={t5} backgroundColo...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t5 || $[17] !== t7) {
    // t8 暂存 `<Box flexDirection="column" marginTop={t5} backgroundColo...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" marginTop={t5} backgroundColor="userMessageBackground" paddingRight={1}>{t7}</Box>;
    // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t5;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUZXh0QmxvY2tQYXJhbSIsImZpZ3VyZXMiLCJSZWFjdCIsIkNPTU1BTkRfTUVTU0FHRV9UQUciLCJCb3giLCJUZXh0IiwiZXh0cmFjdFRhZyIsIlByb3BzIiwiYWRkTWFyZ2luIiwicGFyYW0iLCJVc2VyQ29tbWFuZE1lc3NhZ2UiLCJ0MCIsIiQiLCJfYyIsInQxIiwidGV4dCIsInQyIiwiY29tbWFuZE1lc3NhZ2UiLCJ0MyIsImFyZ3MiLCJpc1NraWxsRm9ybWF0IiwidDQiLCJ0NSIsIlN5bWJvbCIsImZvciIsInBvaW50ZXIiLCJ0NiIsInQ3IiwiZmlsdGVyIiwiQm9vbGVhbiIsImNvbnRlbnQiLCJqb2luIiwidDgiXSwic291cmNlcyI6WyJVc2VyQ29tbWFuZE1lc3NhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVGV4dEJsb2NrUGFyYW0gfSBmcm9tICdAYW50aHJvcGljLWFpL3Nkay9yZXNvdXJjZXMvaW5kZXgubWpzJ1xuaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQ09NTUFORF9NRVNTQUdFX1RBRyB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy94bWwuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBleHRyYWN0VGFnIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGFkZE1hcmdpbjogYm9vbGVhblxuICBwYXJhbTogVGV4dEJsb2NrUGFyYW1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFVzZXJDb21tYW5kTWVzc2FnZSh7XG4gIGFkZE1hcmdpbixcbiAgcGFyYW06IHsgdGV4dCB9LFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBjb21tYW5kTWVzc2FnZSA9IGV4dHJhY3RUYWcodGV4dCwgQ09NTUFORF9NRVNTQUdFX1RBRylcbiAgY29uc3QgYXJncyA9IGV4dHJhY3RUYWcodGV4dCwgJ2NvbW1hbmQtYXJncycpXG4gIGNvbnN0IGlzU2tpbGxGb3JtYXQgPSBleHRyYWN0VGFnKHRleHQsICdza2lsbC1mb3JtYXQnKSA9PT0gJ3RydWUnXG5cbiAgaWYgKCFjb21tYW5kTWVzc2FnZSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBTa2lsbHMgdXNlIFwiU2tpbGwobmFtZSlcIiBmb3JtYXRcbiAgaWYgKGlzU2tpbGxGb3JtYXQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveFxuICAgICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgICAgbWFyZ2luVG9wPXthZGRNYXJnaW4gPyAxIDogMH1cbiAgICAgICAgYmFja2dyb3VuZENvbG9yPVwidXNlck1lc3NhZ2VCYWNrZ3JvdW5kXCJcbiAgICAgICAgcGFkZGluZ1JpZ2h0PXsxfVxuICAgICAgPlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1YnRsZVwiPntmaWd1cmVzLnBvaW50ZXJ9IDwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cInRleHRcIj5Ta2lsbCh7Y29tbWFuZE1lc3NhZ2V9KTwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgLy8gU2xhc2ggY29tbWFuZCBmb3JtYXQ6IHNob3cgYXMgXCLina8gL2NvbW1hbmQgYXJnc1wiXG4gIGNvbnN0IGNvbnRlbnQgPSBgLyR7W2NvbW1hbmRNZXNzYWdlLCBhcmdzXS5maWx0ZXIoQm9vbGVhbikuam9pbignICcpfWBcbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgIG1hcmdpblRvcD17YWRkTWFyZ2luID8gMSA6IDB9XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I9XCJ1c2VyTWVzc2FnZUJhY2tncm91bmRcIlxuICAgICAgcGFkZGluZ1JpZ2h0PXsxfVxuICAgID5cbiAgICAgIDxUZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj1cInN1YnRsZVwiPntmaWd1cmVzLnBvaW50ZXJ9IDwvVGV4dD5cbiAgICAgICAgPFRleHQgY29sb3I9XCJ0ZXh0XCI+e2NvbnRlbnR9PC9UZXh0PlxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxjQUFjLFFBQVEsdUNBQXVDO0FBQzNFLE9BQU9DLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsbUJBQW1CLFFBQVEsd0JBQXdCO0FBQzVELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0MsVUFBVSxRQUFRLHlCQUF5QjtBQUVwRCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsU0FBUyxFQUFFLE9BQU87RUFDbEJDLEtBQUssRUFBRVQsY0FBYztBQUN2QixDQUFDO0FBRUQsT0FBTyxTQUFBVSxtQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUE0QjtJQUFBTCxTQUFBO0lBQUFDLEtBQUEsRUFBQUs7RUFBQSxJQUFBSCxFQUczQjtFQURDO0lBQUFJO0VBQUEsSUFBQUQsRUFBUTtFQUFBLElBQUFFLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFHLElBQUE7SUFFUUMsRUFBQSxHQUFBVixVQUFVLENBQUNTLElBQUksRUFBRVosbUJBQW1CLENBQUM7SUFBQVMsQ0FBQSxNQUFBRyxJQUFBO0lBQUFILENBQUEsTUFBQUksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUosQ0FBQTtFQUFBO0VBQTVELE1BQUFLLGNBQUEsR0FBdUJELEVBQXFDO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFOLENBQUEsUUFBQUcsSUFBQTtJQUMvQ0csRUFBQSxHQUFBWixVQUFVLENBQUNTLElBQUksRUFBRSxjQUFjLENBQUM7SUFBQUgsQ0FBQSxNQUFBRyxJQUFBO0lBQUFILENB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
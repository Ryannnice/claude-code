// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 BLACK_CIRCLE，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from '../../constants/figures.js';
// 引入 Box、Text、TextProps，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, type TextProps } from '../../ink.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
  param: TextBlockParam;
};
// getStatusColor 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getStatusColor(status: string | null): TextProps['color'] {
  // 按照 status 的取值选择终端渲染的具体处理分支。
  switch (status) {
    case 'completed':
      // 返回 `'success'`，作为终端渲染这次计算的结果。
      return 'success';
    case 'failed':
      // 返回 `'error'`，作为终端渲染这次计算的结果。
      return 'error';
    case 'killed':
      // 返回 `'warning'`，作为终端渲染这次计算的结果。
      return 'warning';
    default:
      // 返回 `'text'`，作为终端渲染这次计算的结果。
      return 'text';
  }
}
// UserAgentNotificationMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserAgentNotificationMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(12);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addMargin,
    param: t1
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text
  } = t1;
  // t2 暂存 `extractTag(text, "summary")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== text) {
    // t2 暂存 `extractTag(text, "summary")` 生成的渲染片段，后续返回路径直接复用。
    t2 = extractTag(text, "summary");
    // $[0] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = text;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // summary保存`t2`，作为后续临时缓存值处理的输入。
  const summary = t2;
  // summary缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!summary) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t3 暂存 `getStatusColor(status)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== text) {
    // status 集合保存`extractTag`，供终端渲染后续处理使用。
    const status = extractTag(text, "status");
    // t3 暂存 `getStatusColor(status)` 生成的渲染片段，后续返回路径直接复用。
    t3 = getStatusColor(status);
    // $[2] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = text;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // color 命名 `t3`，让后续代码直接表达这个值的用途。
  const color = t3;
  // t4保存`addMargin ? 1 : 0`，供终端 UI User Agent Notificat...后续判断或输出使用。
  const t4 = addMargin ? 1 : 0;
  // t5 暂存 `<Text color={color}>{BLACK_CIRCLE}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== color) {
    // t5 暂存 `<Text color={color}>{BLACK_CIRCLE}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color={color}>{BLACK_CIRCLE}</Text>;
    // $[4] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = color;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // t6 暂存 `<Text>{t5} {summary}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== summary || $[7] !== t5) {
    // t6 暂存 `<Text>{t5} {summary}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text>{t5} {summary}</Text>;
    // $[6] 缓存 `summary`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = summary;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // t7 暂存 `<Box marginTop={t4}>{t6}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== t4 || $[10] !== t6) {
    // t7 暂存 `<Box marginTop={t4}>{t6}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginTop={t4}>{t6}</Box>;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUZXh0QmxvY2tQYXJhbSIsIlJlYWN0IiwiQkxBQ0tfQ0lSQ0xFIiwiQm94IiwiVGV4dCIsIlRleHRQcm9wcyIsImV4dHJhY3RUYWciLCJQcm9wcyIsImFkZE1hcmdpbiIsInBhcmFtIiwiZ2V0U3RhdHVzQ29sb3IiLCJzdGF0dXMiLCJVc2VyQWdlbnROb3RpZmljYXRpb25NZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJ0MSIsInRleHQiLCJ0MiIsInN1bW1hcnkiLCJ0MyIsImNvbG9yIiwidDQiLCJ0NSIsInQ2IiwidDciXSwic291cmNlcyI6WyJVc2VyQWdlbnROb3RpZmljYXRpb25NZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRleHRCbG9ja1BhcmFtIH0gZnJvbSAnQGFudGhyb3BpYy1haS9zZGsvcmVzb3VyY2VzL2luZGV4Lm1qcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQkxBQ0tfQ0lSQ0xFIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL2ZpZ3VyZXMuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQsIHR5cGUgVGV4dFByb3BzIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZXh0cmFjdFRhZyB9IGZyb20gJy4uLy4uL3V0aWxzL21lc3NhZ2VzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBhZGRNYXJnaW46IGJvb2xlYW5cbiAgcGFyYW06IFRleHRCbG9ja1BhcmFtXG59XG5cbmZ1bmN0aW9uIGdldFN0YXR1c0NvbG9yKHN0YXR1czogc3RyaW5nIHwgbnVsbCk6IFRleHRQcm9wc1snY29sb3InXSB7XG4gIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSAnY29tcGxldGVkJzpcbiAgICAgIHJldHVybiAnc3VjY2VzcydcbiAgICBjYXNlICdmYWlsZWQnOlxuICAgICAgcmV0dXJuICdlcnJvcidcbiAgICBjYXNlICdraWxsZWQnOlxuICAgICAgcmV0dXJuICd3YXJuaW5nJ1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ3RleHQnXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFVzZXJBZ2VudE5vdGlmaWNhdGlvbk1lc3NhZ2Uoe1xuICBhZGRNYXJnaW4sXG4gIHBhcmFtOiB7IHRleHQgfSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc3VtbWFyeSA9IGV4dHJhY3RUYWcodGV4dCwgJ3N1bW1hcnknKVxuICBpZiAoIXN1bW1hcnkpIHJldHVybiBudWxsXG5cbiAgY29uc3Qgc3RhdHVzID0gZXh0cmFjdFRhZyh0ZXh0LCAnc3RhdHVzJylcbiAgY29uc3QgY29sb3IgPSBnZXRTdGF0dXNDb2xvcihzdGF0dXMpXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IG1hcmdpblRvcD17YWRkTWFyZ2luID8gMSA6IDB9PlxuICAgICAgPFRleHQ+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtjb2xvcn0+e0JMQUNLX0NJUkNMRX08L1RleHQ+IHtzdW1tYXJ5fVxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxjQUFjLFFBQVEsdUNBQXVDO0FBQzNFLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsWUFBWSxRQUFRLDRCQUE0QjtBQUN6RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRSxLQUFLQyxTQUFTLFFBQVEsY0FBYztBQUN4RCxTQUFTQyxVQUFVLFFBQVEseUJBQXlCO0FBRXBELEtBQUtDLEtBQUssR0FBRztFQUNYQyxTQUFTLEVBQUUsT0FBTztFQUNsQkMsS0FBSyxFQUFFVCxjQUFjO0FBQ3ZCLENBQUM7QUFFRCxTQUFTVSxjQUFjQSxDQUFDQyxNQUFNLEVBQUUsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFTixTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7RUFDakUsUUFBUU0sTUFBTTtJQUNaLEtBQUssV0FBVztNQUNkLE9BQU8sU0FBUztJQUNsQixLQUFLLFFBQVE7TUFDWCxPQUFPLE9BQU87SUFDaEIsS0FBSyxRQUFRO01BQ1gsT0FBTyxTQUFTO0lBQ2xCO01BQ0UsT0FBTyxNQUFNO0VBQ2pCO0FBQ0Y7QUFFQSxPQUFPLFNBQUFDLDZCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXNDO0lBQUFQLFNBQUE7SUFBQUMsS0FBQSxFQUFBTztFQUFBLElBQUFILEVBR3JDO0VBREM7SUFBQUk7RUFBQSxJQUFBRCxFQUFRO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFKLENBQUEsUUFBQUcsSUFBQTtJQUVDQyxFQUFBLEdBQUFaLFVBQVUsQ0FBQ1csSUFBSSxFQUFFLFNBQVMsQ0FBQztJQUFBSCxDQUFBLE1BQUFHLElBQUE7SUFBQUgsQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBM0MsTUFBQUssT0FBQSxHQUFnQkQsRUFBMkI7RUFDM0MsSUFBSSxDQUFDQyxPQUFPO0lBQUEsT0FBUyxJQUFJO0VBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxRQUFBRyxJQUFBO0lBRXpCLE1BQUFOLE1BQUEsR0FBZUwsVUFBVSxDQUFDVyxJQUFJLEVBQUUsUUFBUSxDQUFDO0lBQzNCRyxFQUFBLEdBQUFWLGNBQWMsQ0FBQ0MsTUFBTSxDQUFDO0lBQUFHLENBQUEsTUFBQUcsSUFBQTtJQUFBSCxDQUFBLE1BQUFNLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFOLENBQUE7RUFBQTtFQUFwQyxNQUFBTyxLQUFBLEdBQWNELEVBQXNCO0VBR2xCLE1BQUFFLEVBQUEsR0FBQWQsU0FBUyxHQUFULENBQWlCLEdBQWpCLENBQWlCO0VBQUEsSUFBQWUsRUFBQTtFQUFBLElBQUFULENBQUEsUUFBQU8sS0FBQTtJQUU3QkUsRUFBQSxJQUFDLElBQUksQ0FBUUYsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FBR25CLGFBQVcsQ0FBRSxFQUFqQyxJQUFJLENBQW9DO0lBQUFZLENBQUEsTUFBQU8sS0FBQTtJQUFBUCxDQUFBLE1BQUFTLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFULENBQUE7RUFBQTtFQUFBLElBQUFVLEVBQUE7RUFBQSxJQUFBVixDQUFBLFFBQUFLLE9BQUEsSUFBQUwsQ0FBQSxRQUFBUyxFQUFBO0lBRDNDQyxFQUFBLElBQUMsSUFBSSxDQUNILENBQUFELEVBQXdDLENBQUMsQ0FBRUosUUFBTSxDQUNuRCxFQUZDLElBQUksQ0FFRTtJQUFBTCxDQUFBLE1BQUFLLE9BQUE7SUFBQUwsQ0FBQSxNQUFBUyxFQUFBO0lBQUFULENBQUEsTUFBQVUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVYsQ0FBQTtFQUFBO0VBQUEsSUFBQVcsRUFBQTtFQUFBLElBQUFYLENBQUEsUUFBQVEsRUFBQSxJQUFBUixDQUFBLFNBQUFVLEVBQUE7SUFIVEMsRUFBQSxJQUFDLEdBQUcsQ0FBWSxTQUFpQixDQUFqQixDQUFBSCxFQUFnQixDQUFDLENBQy9CLENBQUFFLEVBRU0sQ0FDUixFQUpDLEdBQUcsQ0FJRTtJQUFBVixDQUFBLE1BQUFRLEVBQUE7SUFBQVIsQ0FBQSxPQUFBVSxFQUFBO0lBQUFWLENBQUEsT0FBQVcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVgsQ0FBQTtFQUFBO0VBQUEsT0FKTlcsRUFJTTtBQUFBIiwiaWdub3JlTGlzdCI6W119
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 REFRESH_ARROW，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { REFRESH_ARROW } from '../../constants/figures.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
  param: TextBlockParam;
};
// ParsedUpdate 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ParsedUpdate = {
  kind: 'resource' | 'polling';
  server: string;
  /** URI for resource updates, tool name for polling updates */
  target: string;
  reason?: string;
};

// Parse resource and polling updates from XML format
// parseUpdates 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseUpdates(text: string): ParsedUpdate[] {
  // updates 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const updates: ParsedUpdate[] = [];

  // Match <mcp-resource-update server="..." uri="...">
  // resourceRegex保存`/<mcp-resource-update\s+server="([^"]+)"\s+uri="([^"]+)"[...`，供终端 UI User Resource Update...后续判断或输出使用。
  const resourceRegex = /<mcp-resource-update\s+server="([^"]+)"\s+uri="([^"]+)"[^>]*>(?:[\s\S]*?<reason>([^<]+)<\/reason>)?/g;
  // match 先占位，稍后的条件分支会根据实际输入补齐它。
  let match;
  // 只要 (match = resourceRegex.exec(text)) !== null 成立，就持续推进终端渲染中的循环处理。
  while ((match = resourceRegex.exec(text)) !== null) {
    // updates 集合追加新条目，保持收集顺序与输入顺序一致。
    updates.push({
      kind: 'resource',
      server: match[1] ?? '',
      target: match[2] ?? '',
      reason: match[3]
    });
  }

  // Match <mcp-polling-update type="tool" server="..." tool="...">
  // pollingRegex保存`/<mcp-polling-update\s+type="([^"]+)"\s+server="([^"]+)"\...`，供终端 UI User Resource Update...后续判断或输出使用。
  const pollingRegex = /<mcp-polling-update\s+type="([^"]+)"\s+server="([^"]+)"\s+tool="([^"]+)"[^>]*>(?:[\s\S]*?<reason>([^<]+)<\/reason>)?/g;
  // 只要 (match = pollingRegex.exec(text)) !== null 成立，就持续推进终端渲染中的循环处理。
  while ((match = pollingRegex.exec(text)) !== null) {
    // updates 集合追加新条目，保持收集顺序与输入顺序一致。
    updates.push({
      kind: 'polling',
      server: match[2] ?? '',
      target: match[3] ?? '',
      reason: match[4]
    });
  }
  // 返回 updates，把终端渲染这个分支的结果交还调用方。
  return updates;
}

// Format URI for display - show just the meaningful part
// formatUri 承担终端渲染中的独立步骤，串起终端 UI 组件 User Resource Update Message需要的输入整理、状态更新和结果输出。
function formatUri(uri: string): string {
  // For file:// URIs, show just the filename
  // 判断 uri.startsWith('file://')，将终端渲染分流到只适用于该条件的处理路径。
  if (uri.startsWith('file://')) {
    // path 文件数据格式化`uri.slice`，供终端渲染后续处理使用。
    const path = uri.slice(7);
    // parts 集合格式化`path.split`，供终端渲染后续处理使用。
    const parts = path.split('/');
    // 返回 parts[parts.length - 1] || path，把终端渲染这个分支的结果交还调用方。
    return parts[parts.length - 1] || path;
  }
  // For other URIs, show the whole thing but truncated
  // 满足 `uri.length > 40` 时，终端渲染执行该分支。
  if (uri.length > 40) {
    // 返回 uri.slice(0, 39) + '\u2026'，把终端渲染这个分支的结果交还调用方。
    return uri.slice(0, 39) + '\u2026';
  }
  // 返回 uri，把终端渲染这个分支的结果交还调用方。
  return uri;
}
// UserResourceUpdateMessage 承担终端渲染中的独立步骤，串起终端 UI 组件 User Resource Update Message需要的输入整理、状态更新和结果输出。
export function UserResourceUpdateMessage(t0) {
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
  // T0暂存 `Box` 的派生结果，便于缓存命中时直接复用。
  let T0;
  // t2暂存 `"column"` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3暂存 `addMargin ? 1 : 0` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4暂存 `updates.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== addMargin || $[1] !== text) {
    // t5暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t5 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 User Resource Update Mes...处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // updates 集合解析`parseUpdates`，供终端渲染后续处理使用。
      const updates = parseUpdates(text);
      // updates 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
      if (updates.length === 0) {
        // t5暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t5 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // T0暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
      T0 = Box;
      // t2暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
      t2 = "column";
      // t3暂存 `addMargin ? 1 : 0` 生成的渲染片段，后续返回路径直接复用。
      t3 = addMargin ? 1 : 0;
      // t4暂存 `updates.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
      t4 = updates.map(_temp);
    }
    // $[0] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = addMargin;
    // $[1] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = text;
    // $[2] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = T0;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // T0从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[2];
    // t2从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
    // t3从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
    // t4从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
    // t5从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // 判断 t5 !== Symbol.for("react.early_return_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if (t5 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 t5，把终端渲染这个分支的结果交还调用方。
    return t5;
  }
  // t6暂存 `<T0 flexDirection={t2} marginTop={t3}>{t4}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== T0 || $[8] !== t2 || $[9] !== t3 || $[10] !== t4) {
    // t6暂存 `<T0 flexDirection={t2} marginTop={t3}>{t4}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <T0 flexDirection={t2} marginTop={t3}>{t4}</T0>;
    // $[7] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = T0;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // 返回 t6，把终端渲染这个分支的结果交还调用方。
  return t6;
}
// _temp 承担终端渲染中的独立步骤，串起终端 UI 组件 User Resource Update Message需要的输入整理、状态更新和结果输出。
function _temp(update, i) {
  // 返回 <Box key={i}><Text><Text color="success">{REFRESH_ARROW}</Text>{" "}<Text dimColor={true}>{upd…，把终端渲染这个分支的结果交还调用方。
  return <Box key={i}><Text><Text color="success">{REFRESH_ARROW}</Text>{" "}<Text dimColor={true}>{update.server}:</Text>{" "}<Text color="suggestion">{update.kind === "resource" ? formatUri(update.target) : update.target}</Text>{update.reason && <Text dimColor={true}> · {update.reason}</Text>}</Text></Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUZXh0QmxvY2tQYXJhbSIsIlJlYWN0IiwiUkVGUkVTSF9BUlJPVyIsIkJveCIsIlRleHQiLCJQcm9wcyIsImFkZE1hcmdpbiIsInBhcmFtIiwiUGFyc2VkVXBkYXRlIiwia2luZCIsInNlcnZlciIsInRhcmdldCIsInJlYXNvbiIsInBhcnNlVXBkYXRlcyIsInRleHQiLCJ1cGRhdGVzIiwicmVzb3VyY2VSZWdleCIsIm1hdGNoIiwiZXhlYyIsInB1c2giLCJwb2xsaW5nUmVnZXgiLCJmb3JtYXRVcmkiLCJ1cmkiLCJzdGFydHNXaXRoIiwicGF0aCIsInNsaWNlIiwicGFydHMiLCJzcGxpdCIsImxlbmd0aCIsIlVzZXJSZXNvdXJjZVVwZGF0ZU1lc3NhZ2UiLCJ0MCIsIiQiLCJfYyIsInQxIiwiVDAiLCJ0MiIsInQzIiwidDQiLCJ0NSIsIlN5bWJvbCIsImZvciIsImJiMCIsIm1hcCIsIl90ZW1wIiwidDYiLCJ1cGRhdGUiLCJpIl0sInNvdXJjZXMiOlsiVXNlclJlc291cmNlVXBkYXRlTWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUZXh0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFJFRlJFU0hfQVJST1cgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvZmlndXJlcy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgYWRkTWFyZ2luOiBib29sZWFuXG4gIHBhcmFtOiBUZXh0QmxvY2tQYXJhbVxufVxuXG50eXBlIFBhcnNlZFVwZGF0ZSA9IHtcbiAga2luZDogJ3Jlc291cmNlJyB8ICdwb2xsaW5nJ1xuICBzZXJ2ZXI6IHN0cmluZ1xuICAvKiogVVJJIGZvciByZXNvdXJjZSB1cGRhdGVzLCB0b29sIG5hbWUgZm9yIHBvbGxpbmcgdXBkYXRlcyAqL1xuICB0YXJnZXQ6IHN0cmluZ1xuICByZWFzb24/OiBzdHJpbmdcbn1cblxuLy8gUGFyc2UgcmVzb3VyY2UgYW5kIHBvbGxpbmcgdXBkYXRlcyBmcm9tIFhNTCBmb3JtYXRcbmZ1bmN0aW9uIHBhcnNlVXBkYXRlcyh0ZXh0OiBzdHJpbmcpOiBQYXJzZWRVcGRhdGVbXSB7XG4gIGNvbnN0IHVwZGF0ZXM6IFBhcnNlZFVwZGF0ZVtdID0gW11cblxuICAvLyBNYXRjaCA8bWNwLXJlc291cmNlLXVwZGF0ZSBzZXJ2ZXI9XCIuLi5cIiB1cmk9XCIuLi5cIj5cbiAgY29uc3QgcmVzb3VyY2VSZWdleCA9XG4gICAgLzxtY3AtcmVzb3VyY2UtdXBkYXRlXFxzK3NlcnZlcj1cIihbXlwiXSspXCJcXHMrdXJpPVwiKFteXCJdKylcIltePl0qPig/OltcXHNcXFNdKj88cmVhc29uPihbXjxdKyk8XFwvcmVhc29uPik/L2dcbiAgbGV0IG1hdGNoXG4gIHdoaWxlICgobWF0Y2ggPSByZXNvdXJjZVJlZ2V4LmV4ZWModGV4dCkpICE9PSBudWxsKSB7XG4gICAgdXBkYXRlcy5wdXNoKHtcbiAgICAgIGtpbmQ6ICdyZXNvdXJjZScsXG4gICAgICBzZXJ2ZXI6IG1hdGNoWzFdID8/ICcnLFxuICAgICAgdGFyZ2V0OiBtYXRjaFsyXSA/PyAnJyxcbiAgICAgIHJlYXNvbjogbWF0Y2hbM10sXG4gICAgfSlcbiAgfVxuXG4gIC8vIE1hdGNoIDxtY3AtcG9sbGluZy11cGRhdGUgdHlwZT1cInRvb2xcIiBzZXJ2ZXI9XCIuLi5cIiB0b29sPVwiLi4uXCI+XG4gIGNvbnN0IHBvbGxpbmdSZWdleCA9XG4gICAgLzxtY3AtcG9sbGluZy11cGRhdGVcXHMrdHlwZT1cIihbXlwiXSspXCJcXHMrc2VydmVyPVwiKFteXCJdKylcIlxccyt0b29sPVwiKFteXCJdKylcIltePl0qPig/OltcXHNcXFNdKj88cmVhc29uPihbXjxdKyk8XFwvcmVhc29uPik/L2dcbiAgd2hpbGUgKChtYXRjaCA9IHBvbGxpbmdSZWdleC5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgIHVwZGF0ZXMucHVzaCh7XG4gICAgICBraW5kOiAncG9sbGluZycsXG4gICAgICBzZXJ2ZXI6IG1hdGNoWzJdID8/ICcnLFxuICAgICAgdGFyZ2V0OiBtYXRjaFszXSA/PyAnJyxcbiAgICAgIHJlYXNvbjogbWF0Y2hbNF0sXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiB1cGRhdGVzXG59XG5cbi8vIEZvcm1hdCBVUkkgZm9yIGRpc3BsYXkgLSBzaG93IGp1c3QgdGhlIG1lYW5pbmdmdWwgcGFydFxuZnVuY3Rpb24gZm9ybWF0VXJpKHVyaTogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gRm9yIGZpbGU6Ly8gVVJJcywgc2hvdyBqdXN0IHRoZSBmaWxlbmFtZVxuICBpZiAodXJpLnN0YXJ0c1dpdGgoJ2ZpbGU6Ly8nKSkge1xuICAgIGNvbnN0IHBhdGggPSB1cmkuc2xpY2UoNylcbiAgICBjb25zdCBwYXJ0cyA9IHBhdGguc3BsaXQoJy8nKVxuICAgIHJldHVybiBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSB8fCBwYXRoXG4gIH1cbiAgLy8gRm9yIG90aGVyIFVSSXMsIHNob3cgdGhlIHdob2xlIHRoaW5nIGJ1dCB0cnVuY2F0ZWRcbiAgaWYgKHVyaS5sZW5ndGggPiA0MCkge1xuICAgIHJldHVybiB1cmkuc2xpY2UoMCwgMzkpICsgJ1xcdTIwMjYnXG4gIH1cbiAgcmV0dXJuIHVyaVxufVxuXG5leHBvcnQgZnVuY3Rpb24gVXNlclJlc291cmNlVXBkYXRlTWVzc2FnZSh7XG4gIGFkZE1hcmdpbixcbiAgcGFyYW06IHsgdGV4dCB9LFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB1cGRhdGVzID0gcGFyc2VVcGRhdGVzKHRleHQpXG4gIGlmICh1cGRhdGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGxcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17YWRkTWFyZ2luID8gMSA6IDB9PlxuICAgICAge3VwZGF0ZXMubWFwKCh1cGRhdGUsIGkpID0+IChcbiAgICAgICAgPEJveCBrZXk9e2l9PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJzdWNjZXNzXCI+e1JFRlJFU0hfQVJST1d9PC9UZXh0PnsnICd9XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57dXBkYXRlLnNlcnZlcn06PC9UZXh0PnsnICd9XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1Z2dlc3Rpb25cIj5cbiAgICAgICAgICAgICAge3VwZGF0ZS5raW5kID09PSAncmVzb3VyY2UnXG4gICAgICAgICAgICAgICAgPyBmb3JtYXRVcmkodXBkYXRlLnRhcmdldClcbiAgICAgICAgICAgICAgICA6IHVwZGF0ZS50YXJnZXR9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICB7dXBkYXRlLnJlYXNvbiAmJiA8VGV4dCBkaW1Db2xvcj4gwrcge3VwZGF0ZS5yZWFzb259PC9UZXh0Pn1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKSl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLGNBQWMsUUFBUSx1Q0FBdUM7QUFDM0UsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxhQUFhLFFBQVEsNEJBQTRCO0FBQzFELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFFeEMsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFNBQVMsRUFBRSxPQUFPO0VBQ2xCQyxLQUFLLEVBQUVQLGNBQWM7QUFDdkIsQ0FBQztBQUVELEtBQUtRLFlBQVksR0FBRztFQUNsQkMsSUFBSSxFQUFFLFVBQVUsR0FBRyxTQUFTO0VBQzVCQyxNQUFNLEVBQUUsTUFBTTtFQUNkO0VBQ0FDLE1BQU0sRUFBRSxNQUFNO0VBQ2RDLE1BQU0sQ0FBQyxFQUFFLE1BQU07QUFDakIsQ0FBQzs7QUFFRDtB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
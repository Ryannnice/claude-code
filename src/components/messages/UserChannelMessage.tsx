// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 CHANNEL_ARROW，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { CHANNEL_ARROW } from '../../constants/figures.js';
// 引入 CHANNEL_TAG，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { CHANNEL_TAG } from '../../constants/xml.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 truncateToWidth 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncateToWidth } from '../../utils/format.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
  param: TextBlockParam;
};

// <channel source="..." user="..." chat_id="...">content</channel>
// source is always first (wrapChannelMessage writes it), user is optional.
// CHANNEL_RE匹配`RegExp`，供终端渲染后续处理使用。
const CHANNEL_RE = new RegExp(`<${CHANNEL_TAG}\\s+source="([^"]+)"([^>]*)>\\n?([\\s\\S]*?)\\n?</${CHANNEL_TAG}>`);
// USER_ATTR_RE保存`/\buser="([^"]+)"/`，供终端 UI User Channel Message后续判断或输出使用。
const USER_ATTR_RE = /\buser="([^"]+)"/;

// Plugin-provided servers get names like plugin:slack-channel:slack via
// addPluginScopeToServers — show just the leaf. Matches the suffix-match
// logic in isServerInChannels.
// displayServerName 承担终端渲染中的独立步骤，串起终端 UI 组件 User Channel Message需要的输入整理、状态更新和结果输出。
function displayServerName(name: string): string {
  // i保存`name.lastIndexOf`，供终端渲染后续处理使用。
  const i = name.lastIndexOf(':');
  // 返回 i === -1 ? name : name.slice(i + 1)，把终端渲染这个分支的结果交还调用方。
  return i === -1 ? name : name.slice(i + 1);
}
// TRUNCATE_AT保存`60`，供终端 UI User Channel Messa...后续步骤使用。
const TRUNCATE_AT = 60;
// UserChannelMessage 承担终端渲染中的独立步骤，串起终端 UI 组件 User Channel Message需要的输入整理、状态更新和结果输出。
export function UserChannelMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(29);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addMargin,
    param: t1
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text
  } = t1;
  // T0作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // T2作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T2;
  // t2作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // t3作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // t4作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // t5作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // t6作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // t7暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // truncated先声明占位，稍后的分支会根据实际输入补齐。
  let truncated;
  // user先声明占位，稍后的分支会根据实际输入补齐。
  let user;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== addMargin || $[1] !== text) {
    // t7暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t7 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 User Channel Message处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // m保存`CHANNEL_RE.exec`，供终端渲染后续处理使用。
      const m = CHANNEL_RE.exec(text);
      // m缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!m) {
        // t7暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t7 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 从 `m` 按位置拆出 source、attrs、content，让终端 UI 组件 User Channel Message分别处理这些返回值。
      const [, source, attrs, content] = m;
      // user更新为 `USER_ATTR_RE.exec(attrs ?? "")?.[1]`，确保终端 UI后续读取最新状态。
      user = USER_ATTR_RE.exec(attrs ?? "")?.[1];
      // body格式化`trim`，供终端渲染后续处理使用。
      const body = (content ?? "").trim().replace(/\s+/g, " ");
      // truncated更新为 `truncateToWidth(body, TRUNCATE_AT)`，确保终端 UI后续读取最新状态。
      truncated = truncateToWidth(body, TRUNCATE_AT);
      // T2暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
      T2 = Box;
      // t6暂存 `addMargin ? 1 : 0` 生成的渲染片段，后续返回路径直接复用。
      t6 = addMargin ? 1 : 0;
      // T1暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
      T1 = Text;
      // 判断 $[13] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
      if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
        // t4暂存 `<Text color="suggestion">{CHANNEL_ARROW}</Text>` 生成的渲染片段，后续返回路径直接复用。
        t4 = <Text color="suggestion">{CHANNEL_ARROW}</Text>;
        // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
        $[13] = t4;
      } else {
        // t4从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
        t4 = $[13];
      }
      // t5暂存 `" "` 生成的渲染片段，后续返回路径直接复用。
      t5 = " ";
      // T0暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
      T0 = Text;
      // t2暂存 `true` 生成的渲染片段，后续返回路径直接复用。
      t2 = true;
      // t3暂存 `displayServerName(source ?? "")` 生成的渲染片段，后续返回路径直接复用。
      t3 = displayServerName(source ?? "");
    }
    // $[0] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = addMargin;
    // $[1] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = text;
    // $[2] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = T0;
    // $[3] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = T1;
    // $[4] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = T2;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
    // $[11] 缓存 `truncated`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = truncated;
    // $[12] 缓存 `user`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = user;
  } else {
    // T0从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[2];
    // T1从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[3];
    // T2从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    T2 = $[4];
    // t2从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
    // t3从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
    // t4从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
    // t5从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
    // t6从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
    // t7从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
    // truncated更新为 `$[11]`，确保终端 UI后续读取最新状态。
    truncated = $[11];
    // user更新为 `$[12]`，确保终端 UI后续读取最新状态。
    user = $[12];
  }
  // 判断 t7 !== Symbol.for("react.early_return_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if (t7 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 t7，把终端渲染这个分支的结果交还调用方。
    return t7;
  }
  // 临时值 t8保存`user ? ` \u00b7 ${user}` : ""`，供终端 UI User Channel Messa...后续步骤使用。
  const t8 = user ? ` \u00b7 ${user}` : "";
  // t9暂存 `<T0 dimColor={t2}>{t3}{t8}:</T0>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== T0 || $[15] !== t2 || $[16] !== t3 || $[17] !== t8) {
    // t9暂存 `<T0 dimColor={t2}>{t3}{t8}:</T0>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <T0 dimColor={t2}>{t3}{t8}:</T0>;
    // $[14] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = T0;
    // $[15] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t2;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
    // $[17] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t8;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t9从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // t10暂存 `<T1>{t4}{t5}{t9}{" "}{truncated}</T1>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== T1 || $[20] !== t4 || $[21] !== t5 || $[22] !== t9 || $[23] !== truncated) {
    // t10暂存 `<T1>{t4}{t5}{t9}{" "}{truncated}</T1>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <T1>{t4}{t5}{t9}{" "}{truncated}</T1>;
    // $[19] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = T1;
    // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t4;
    // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t5;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
    // $[23] 缓存 `truncated`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = truncated;
    // $[24] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t10;
  } else {
    // t10从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[24];
  }
  // t11暂存 `<T2 marginTop={t6}>{t10}</T2>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== T2 || $[26] !== t10 || $[27] !== t6) {
    // t11暂存 `<T2 marginTop={t6}>{t10}</T2>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <T2 marginTop={t6}>{t10}</T2>;
    // $[25] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = T2;
    // $[26] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t10;
    // $[27] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t6;
    // $[28] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t11;
  } else {
    // t11从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[28];
  }
  // 返回 t11，把终端渲染这个分支的结果交还调用方。
  return t11;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUZXh0QmxvY2tQYXJhbSIsIlJlYWN0IiwiQ0hBTk5FTF9BUlJPVyIsIkNIQU5ORUxfVEFHIiwiQm94IiwiVGV4dCIsInRydW5jYXRlVG9XaWR0aCIsIlByb3BzIiwiYWRkTWFyZ2luIiwicGFyYW0iLCJDSEFOTkVMX1JFIiwiUmVnRXhwIiwiVVNFUl9BVFRSX1JFIiwiZGlzcGxheVNlcnZlck5hbWUiLCJuYW1lIiwiaSIsImxhc3RJbmRleE9mIiwic2xpY2UiLCJUUlVOQ0FURV9BVCIsIlVzZXJDaGFubmVsTWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJ0ZXh0IiwiVDAiLCJUMSIsIlQyIiwidDIiLCJ0MyIsInQ0IiwidDUiLCJ0NiIsInQ3IiwidHJ1bmNhdGVkIiwidXNlciIsIlN5bWJvbCIsImZvciIsImJiMCIsIm0iLCJleGVjIiwic291cmNlIiwiYXR0cnMiLCJjb250ZW50IiwiYm9keSIsInRyaW0iLCJyZXBsYWNlIiwidDgiLCJ0OSIsInQxMCIsInQxMSJdLCJzb3VyY2VzIjpbIlVzZXJDaGFubmVsTWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUZXh0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IENIQU5ORUxfQVJST1cgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvZmlndXJlcy5qcydcbmltcG9ydCB7IENIQU5ORUxfVEFHIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL3htbC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHRydW5jYXRlVG9XaWR0aCB9IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgYWRkTWFyZ2luOiBib29sZWFuXG4gIHBhcmFtOiBUZXh0QmxvY2tQYXJhbVxufVxuXG4vLyA8Y2hhbm5lbCBzb3VyY2U9XCIuLi5cIiB1c2VyPVwiLi4uXCIgY2hhdF9pZD1cIi4uLlwiPmNvbnRlbnQ8L2NoYW5uZWw+XG4vLyBzb3VyY2UgaXMgYWx3YXlzIGZpcnN0ICh3cmFwQ2hhbm5lbE1lc3NhZ2Ugd3JpdGVzIGl0KSwgdXNlciBpcyBvcHRpb25hbC5cbmNvbnN0IENIQU5ORUxfUkUgPSBuZXcgUmVnRXhwKFxuICBgPCR7Q0hBTk5FTF9UQUd9XFxcXHMrc291cmNlPVwiKFteXCJdKylcIihbXj5dKik+XFxcXG4/KFtcXFxcc1xcXFxTXSo/KVxcXFxuPzwvJHtDSEFOTkVMX1RBR30+YCxcbilcbmNvbnN0IFVTRVJfQVRUUl9SRSA9IC9cXGJ1c2VyPVwiKFteXCJdKylcIi9cblxuLy8gUGx1Z2luLXByb3ZpZGVkIHNlcnZlcnMgZ2V0IG5hbWVzIGxpa2UgcGx1Z2luOnNsYWNrLWNoYW5uZWw6c2xhY2sgdmlhXG4vLyBhZGRQbHVnaW5TY29wZVRvU2VydmVycyDigJQgc2hvdyBqdXN0IHRoZSBsZWFmLiBNYXRjaGVzIHRoZSBzdWZmaXgtbWF0Y2hcbi8vIGxvZ2ljIGluIGlzU2VydmVySW5DaGFubmVscy5cbmZ1bmN0aW9uIGRpc3BsYXlTZXJ2ZXJOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGkgPSBuYW1lLmxhc3RJbmRleE9mKCc6JylcbiAgcmV0dXJuIGkgPT09IC0xID8gbmFtZSA6IG5hbWUuc2xpY2UoaSArIDEpXG59XG5cbmNvbnN0IFRSVU5DQVRFX0FUID0gNjBcblxuZXhwb3J0IGZ1bmN0aW9uIFVzZXJDaGFubmVsTWVzc2FnZSh7XG4gIGFkZE1hcmdpbixcbiAgcGFyYW06IHsgdGV4dCB9LFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBtID0gQ0hBTk5FTF9SRS5leGVjKHRleHQpXG4gIGlmICghbSkgcmV0dXJuIG51bGxcbiAgY29uc3QgWywgc291cmNlLCBhdHRycywgY29udGVudF0gPSBtXG4gIGNvbnN0IHVzZXIgPSBVU0VSX0FUVFJfUkUuZXhlYyhhdHRycyA/PyAnJyk/LlsxXVxuICBjb25zdCBib2R5ID0gKGNvbnRlbnQgPz8gJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgY29uc3QgdHJ1bmNhdGVkID0gdHJ1bmNhdGVUb1dpZHRoKGJvZHksIFRSVU5DQVRFX0FUKVxuICByZXR1cm4gKFxuICAgIDxCb3ggbWFyZ2luVG9wPXthZGRNYXJnaW4gPyAxIDogMH0+XG4gICAgICA8VGV4dD5cbiAgICAgICAgPFRleHQgY29sb3I9XCJzdWdnZXN0aW9uXCI+e0NIQU5ORUxfQVJST1d9PC9UZXh0PnsnICd9XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIHtkaXNwbGF5U2VydmVyTmFtZShzb3VyY2UgPz8gJycpfVxuICAgICAgICAgIHt1c2VyID8gYCBcXHUwMGI3ICR7dXNlcn1gIDogJyd9OlxuICAgICAgICA8L1RleHQ+eycgJ31cbiAgICAgICAge3RydW5jYXRlZH1cbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsY0FBY0EsY0FBYyxRQUFRLHVDQUF1QztBQUMzRSxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLGFBQWEsUUFBUSw0QkFBNEI7QUFDMUQsU0FBU0MsV0FBVyxRQUFRLHdCQUF3QjtBQUNwRCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGVBQWUsUUFBUSx1QkFBdUI7QUFFdkQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFNBQVMsRUFBRSxPQUFPO0VBQ2xCQyxLQUFLLEVBQUVULGNBQWM7QUFDdkIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0EsTUFBTVUsVUFBVSxHQUFHLElBQUlDLE1BQU0sQ0FDM0IsSUFBSVIsV0FBVyxxREFBcURBLFdBQVcsR0FDakYsQ0FBQztBQUNELE1BQU1TLFlBQVksR0FBRyxrQkFBa0I7O0FBRXZDO0FBQ0E7QUFDQTtBQUNBLFNBQVNDLGlC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
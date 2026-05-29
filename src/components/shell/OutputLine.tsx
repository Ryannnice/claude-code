// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 引入 Ansi、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Text } from '../../ink.js';
// 复用 createHyperlink 工具函数，把通用处理留在 ../../utils/hyperlink.js 中维护。
import { createHyperlink } from '../../utils/hyperlink.js';
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js';
// 复用 renderTruncatedContent 工具函数，把通用处理留在 ../../utils/terminal.js 中维护。
import { renderTruncatedContent } from '../../utils/terminal.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// 引入 InVirtualListContext，将 ../messageActions.js 中已经封装好的能力接到本文件流程里。
import { InVirtualListContext } from '../messageActions.js';
// 引入 useExpandShellOutput，将 ./ExpandShellOutputContext.js 中已经封装好的能力接到本文件流程里。
import { useExpandShellOutput } from './ExpandShellOutputContext.js';
// tryFormatJson 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tryFormatJson(line: string): string {
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供终端渲染后续处理使用。
    const parsed = jsonParse(line);
    // stringified保存`jsonStringify`，供终端渲染后续处理使用。
    const stringified = jsonStringify(parsed);

    // Check if precision was lost during JSON round-trip
    // This happens when large integers exceed Number.MAX_SAFE_INTEGER
    // We normalize both strings by removing whitespace and unnecessary
    // escapes (\/ is valid but optional in JSON) for comparison
    // normalizedOriginal格式化`line.replace`，供终端渲染后续处理使用。
    const normalizedOriginal = line.replace(/\\\//g, '/').replace(/\s+/g, '');
    // normalizedStringified格式化`stringified.replace`，供终端渲染后续处理使用。
    const normalizedStringified = stringified.replace(/\s+/g, '');
    // `normalizedOriginal` 与 `normalizedStringified` 不一致时刷新派生状态，避免使用过期结果。
    if (normalizedOriginal !== normalizedStringified) {
      // Precision loss detected - return original line unformatted
      // 返回 `line`，作为终端渲染这次计算的结果。
      return line;
    }
    // 返回 `jsonStringify(parsed, null, 2)`，作为终端渲染这次计算的结果。
    return jsonStringify(parsed, null, 2);
  } catch {
    // 返回 `line`，作为终端渲染这次计算的结果。
    return line;
  }
}
// MAX_JSON_FORMAT_LENGTH 数量保存`10_000`，供后续判断或组装使用。
const MAX_JSON_FORMAT_LENGTH = 10_000;
// tryJsonFormatContent 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tryJsonFormatContent(content: string): string {
  // 满足 `content.length > MAX_JSON_FORMAT_LENGTH` 时，终端渲染执行该分支。
  if (content.length > MAX_JSON_FORMAT_LENGTH) {
    // 返回 `content`，作为终端渲染这次计算的结果。
    return content;
  }
  // allLines 集合格式化`content.split`，供终端渲染后续处理使用。
  const allLines = content.split('\n');
  // 返回 `allLines.map(tryFormatJson).join('\n')`，作为终端渲染这次计算的结果。
  return allLines.map(tryFormatJson).join('\n');
}

// Match http(s) URLs inside JSON string values. Conservative: no quotes,
// no whitespace, no trailing comma/brace that'd be JSON structure.
// URL_IN_JSON保存`/https?:\/\/[^\s"'<>\\]+/g`，供终端 UI Output Line后续判断或输出使用。
const URL_IN_JSON = /https?:\/\/[^\s"'<>\\]+/g;
// linkifyUrlsInText 承担终端渲染中的独立步骤，串起终端 UI 组件 Output Line需要的输入整理、状态更新和结果输出。
export function linkifyUrlsInText(content: string): string {
  // 返回 content.replace(URL_IN_JSON, url => createHyperlink(url))，把终端渲染这个分支的结果交还调用方。
  return content.replace(URL_IN_JSON, url => createHyperlink(url));
}
// OutputLine 承担终端渲染中的独立步骤，串起终端 UI 组件 Output Line需要的输入整理、状态更新和结果输出。
export function OutputLine(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    content,
    verbose,
    isError,
    isWarning,
    linkifyUrls
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // expandShellOutput保存`useExpandShellOutput`，供终端渲染后续处理使用。
  const expandShellOutput = useExpandShellOutput();
  // inVirtualList保存`React.useContext`，供终端渲染后续处理使用。
  const inVirtualList = React.useContext(InVirtualListContext);
  // shouldShowFull记录当前扫描状态，终端 UI Output Line随后按该状态分支。
  const shouldShowFull = verbose || expandShellOutput;
  // t1暂存 `stripUnderlineAnsi(formatted)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== columns || $[1] !== content || $[2] !== inVirtualList || $[3] !== linkifyUrls || $[4] !== shouldShowFull) {
    // 终端 UI 组件 Output Line处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // formatted保存`tryJsonFormatContent`，供终端渲染后续处理使用。
      let formatted = tryJsonFormatContent(content);
      // 满足 `linkifyUrls` 时，终端渲染执行该分支。
      if (linkifyUrls) {
        // formatted更新为 `linkifyUrlsInText(formatted)`，确保终端 UI后续读取最新状态。
        formatted = linkifyUrlsInText(formatted);
      }
      // 满足 `shouldShowFull` 时，终端渲染执行该分支。
      if (shouldShowFull) {
        // t1暂存 `stripUnderlineAnsi(formatted)` 生成的渲染片段，后续返回路径直接复用。
        t1 = stripUnderlineAnsi(formatted);
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // t1暂存 `stripUnderlineAnsi(renderTruncatedContent(formatted, colu...` 生成的渲染片段，后续返回路径直接复用。
      t1 = stripUnderlineAnsi(renderTruncatedContent(formatted, columns, inVirtualList));
    }
    // $[0] 缓存 `columns`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = columns;
    // $[1] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = content;
    // $[2] 缓存 `inVirtualList`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = inVirtualList;
    // $[3] 缓存 `linkifyUrls`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = linkifyUrls;
    // $[4] 缓存 `shouldShowFull`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = shouldShowFull;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
  } else {
    // t1从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
  }
  // formattedContent保存`t1`，供终端 UI Output Line后续步骤使用。
  const formattedContent = t1;
  // color保存`isError ? "error" : isWarning ? "warning" : undefined`，供终端 UI Output Line后续步骤使用。
  const color = isError ? "error" : isWarning ? "warning" : undefined;
  // t2暂存 `<Ansi>{formattedContent}</Ansi>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== formattedContent) {
    // t2暂存 `<Ansi>{formattedContent}</Ansi>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Ansi>{formattedContent}</Ansi>;
    // $[6] 缓存 `formattedContent`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = formattedContent;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // t3暂存 `<MessageResponse><Text color={color}>{t2}</Text></Message...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== color || $[9] !== t2) {
    // t3暂存 `<MessageResponse><Text color={color}>{t2}</Text></Message...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <MessageResponse><Text color={color}>{t2}</Text></MessageResponse>;
    // $[8] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = color;
    // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t2;
    // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t3;
  } else {
    // t3从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[10];
  }
  // 返回 t3，把终端渲染这个分支的结果交还调用方。
  return t3;
}

/**
 * Underline ANSI codes in particular tend to leak out for some reason. I wasn't
 * able to figure out why, or why emitting a reset ANSI code wasn't enough to
 * prevent them from leaking. I also didn't want to strip all ANSI codes with
 * stripAnsi(), because we used to do that and people complained about losing
 * all formatting. So we just strip the underline ANSI codes specifically.
 */
// stripUnderlineAnsi 承担终端渲染中的独立步骤，串起终端 UI 组件 Output Line需要的输入整理、状态更新和结果输出。
export function stripUnderlineAnsi(content: string): string {
  // 返回 content.replace(，把终端渲染这个分支的结果交还调用方。
  return content.replace(
  // eslint-disable-next-line no-control-regex
  /\u001b\[([0-9]+;)*4(;[0-9]+)*m|\u001b\[4(;[0-9]+)*m|\u001b\[([0-9]+;)*4m/g, '');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1lbW8iLCJ1c2VUZXJtaW5hbFNpemUiLCJBbnNpIiwiVGV4dCIsImNyZWF0ZUh5cGVybGluayIsImpzb25QYXJzZSIsImpzb25TdHJpbmdpZnkiLCJyZW5kZXJUcnVuY2F0ZWRDb250ZW50IiwiTWVzc2FnZVJlc3BvbnNlIiwiSW5WaXJ0dWFsTGlzdENvbnRleHQiLCJ1c2VFeHBhbmRTaGVsbE91dHB1dCIsInRyeUZvcm1hdEpzb24iLCJsaW5lIiwicGFyc2VkIiwic3RyaW5naWZpZWQiLCJub3JtYWxpemVkT3JpZ2luYWwiLCJyZXBsYWNlIiwibm9ybWFsaXplZFN0cmluZ2lmaWVkIiwiTUFYX0pTT05fRk9STUFUX0xFTkdUSCIsInRyeUpzb25Gb3JtYXRDb250ZW50IiwiY29udGVudCIsImxlbmd0aCIsImFsbExpbmVzIiwic3BsaXQiLCJtYXAiLCJqb2luIiwiVVJMX0lOX0pTT04iLCJsaW5raWZ5VXJsc0luVGV4dCIsInVybCIsIk91dHB1dExpbmUiLCJ0MCIsIiQiLCJfYyIsInZlcmJvc2UiLCJpc0Vycm9yIiwiaXNXYXJuaW5nIiwibGlua2lmeVVybHMiLCJjb2x1bW5zIiwiZXhwYW5kU2hlbGxPdXRwdXQiLCJpblZpcnR1YWxMaXN0IiwidXNlQ29udGV4dCIsInNob3VsZFNob3dGdWxsIiwidDEiLCJiYjAiLCJmb3JtYXR0ZWQiLCJzdHJpcFVuZGVybGluZUFuc2kiLCJmb3JtYXR0ZWRDb250ZW50IiwiY29sb3IiLCJ1bmRlZmluZWQiLCJ0MiIsInQzIl0sInNvdXJjZXMiOlsiT3V0cHV0TGluZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi8uLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyBBbnNpLCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgY3JlYXRlSHlwZXJsaW5rIH0gZnJvbSAnLi4vLi4vdXRpbHMvaHlwZXJsaW5rLmpzJ1xuaW1wb3J0IHsganNvblBhcnNlLCBqc29uU3RyaW5naWZ5IH0gZnJvbSAnLi4vLi4vdXRpbHMvc2xvd09wZXJhdGlvbnMuanMnXG5pbXBvcnQgeyByZW5kZXJUcnVuY2F0ZWRDb250ZW50IH0gZnJvbSAnLi4vLi4vdXRpbHMvdGVybWluYWwuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBJblZpcnR1YWxMaXN0Q29udGV4dCB9IGZyb20gJy4uL21lc3NhZ2VBY3Rpb25zLmpzJ1xuaW1wb3J0IHsgdXNlRXhwYW5kU2hlbGxPdXRwdXQgfSBmcm9tICcuL0V4cGFuZFNoZWxsT3V0cHV0Q29udGV4dC5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIHRyeUZvcm1hdEpzb24obGluZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSBqc29uUGFyc2UobGluZSlcbiAgICBjb25zdCBzdHJpbmdpZmllZCA9IGpzb25TdHJpbmdpZnkocGFyc2VkKVxuXG4gICAgLy8gQ2hlY2sgaWYgcHJlY2lzaW9uIHdhcyBsb3N0IGR1cmluZyBKU09OIHJvdW5kLXRyaXBcbiAgICAvLyBUaGlzIGhhcHBlbnMgd2hlbiBsYXJnZSBpbnRlZ2VycyBleGNlZWQgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJcbiAgICAvLyBXZSBub3JtYWxpemUgYm90aCBzdHJpbmdzIGJ5IHJlbW92aW5nIHdoaXRlc3BhY2UgYW5kIHVubmVjZXNzYXJ5XG4gICAgLy8gZXNjYXBlcyAoXFwvIGlzIHZhbGlkIGJ1dCBvcHRpb25hbCBpbiBKU09OKSBmb3IgY29tcGFyaXNvblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRPcmlnaW5hbCA9IGxpbmUucmVwbGFjZSgvXFxcXFxcLy9nLCAnLycpLnJlcGxhY2UoL1xccysvZywgJycpXG4gICAgY29uc3Qgbm9ybWFsaXplZFN0cmluZ2lmaWVkID0gc3RyaW5naWZpZWQucmVwbGFjZSgvXFxzKy9nLCAnJylcblxuICAgIGlmIChub3JtYWxpemVkT3JpZ2luYWwgIT09IG5vcm1hbGl6ZWRTdHJpbmdpZmllZCkge1xuICAgICAgLy8gUHJlY2lzaW9uIGxvc3MgZGV0ZWN0ZWQgLSByZXR1cm4gb3JpZ2luYWwgbGluZSB1bmZvcm1hdHRlZFxuICAgICAgcmV0dXJuIGxpbmVcbiAgICB9XG5cbiAgICByZXR1cm4ganNvblN0cmluZ2lmeShwYXJzZWQsIG51bGwsIDIpXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBsaW5lXG4gIH1cbn1cblxuY29uc3QgTUFYX0pTT05fRk9STUFUX0xFTkdUSCA9IDEwXzAwMFxuXG5leHBvcnQgZnVuY3Rpb24gdHJ5SnNvbkZvcm1hdENvbnRlbnQoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKGNvbnRlbnQubGVuZ3RoID4gTUFYX0pTT05fRk9STUFUX0xFTkdUSCkge1xuICAgIHJldHVybiBjb250ZW50XG4gIH1cbiAgY29uc3QgYWxsTGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKVxuICByZXR1cm4gYWxsTGluZXMubWFwKHRyeUZvcm1hdEpzb24pLmpvaW4oJ1xcbicpXG59XG5cbi8vIE1hdGNoIGh0dHAocykgVVJMcyBpbnNpZGUgSlNPTiBzdHJpbmcgdmFsdWVzLiBDb25zZXJ2YXRpdmU6IG5vIHF1b3Rlcyxcbi8vIG5vIHdoaXRlc3BhY2UsIG5vIHRyYWlsaW5nIGNvbW1hL2JyYWNlIHRoYXQnZCBiZSBKU09OIHN0cnVjdHVyZS5cbmNvbnN0IFVSTF9JTl9KU09OID0gL2h0dHBzPzpcXC9cXC9bXlxcc1wiJzw+XFxcXF0rL2dcblxuZXhwb3J0IGZ1bmN0aW9uIGxpbmtpZnlVcmxzSW5UZXh0KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZW50LnJlcGxhY2UoVVJMX0lOX0pTT04sIHVybCA9PiBjcmVhdGVIeXBlcmxpbmsodXJsKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE91dHB1dExpbmUoe1xuICBjb250ZW50LFxuICB2ZXJib3NlLFxuICBpc0Vycm9yLFxuICBpc1dhcm5pbmcsXG4gIGxpbmtpZnlVcmxzLFxufToge1xuICBjb250ZW50OiBzdHJpbmdcbiAgdmVyYm9zZTogYm9vbGVhblxuICBpc0Vycm9yPzogYm9vbGVhblxuICBpc1dhcm5pbmc/OiBib29sZWFuXG4gIGxpbmtpZnlVcmxzPzogYm9vbGVhblxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgLy8gQ29udGV4dC1iYXNlZCBleHBhbnNpb24gZm9yIGxhdGVzdCB1c2VyIHNoZWxsIG91dHB1dCAoZnJvbSAhIGNvbW1hbmRzKVxuICBjb25zdCBleHBhbmRTaGVsbE91dHB1dCA9IHVzZUV4cGFuZFNoZWxsT3V0cHV0KClcbiAgY29uc3QgaW5WaXJ0dWFsTGlzdCA9IFJlYWN0LnVzZUNvbnRleHQoSW5WaXJ0dWFsTGlzdENvbnRleHQpXG5cbiAgLy8gU2hvdyBmdWxsIG91dHB1dCBpZiB2ZXJib3NlIG1vZGUgT1IgaWYgdGhpcyBpcyB0aGUgbGF0ZXN0IHVzZXIgc2hlbGwgb3V0cHV0XG4gIGNvbnN0IHNob3VsZFNob3dGdWxsID0gdmVyYm9zZSB8fCBleHBhbmRTaGVsbE91dHB1dFxuXG4gIGNvbnN0IGZvcm1hdHRlZENvbnRlbnQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBsZXQgZm9ybWF0dGVkID0gdHJ5SnNvbkZvcm1hdENvbnRlbnQoY29udGVudClcbiAgICBpZiAobGlua2lmeVVybHMpIHtcbiAgICAgIGZvcm1hdHRlZCA9IGxpbmtpZnlVcmxzSW5UZXh0KGZvcm1hdHRlZClcbiAgICB9XG4gICAgaWYgKHNob3VsZFNob3dGdWxsKSB7XG4gICAgICByZXR1cm4gc3RyaXBVbmRlcmxpbmVBbnNpKGZvcm1hdHRlZClcbiAgICB9XG4gICAgcmV0dXJuIHN0cmlwVW5kZXJsaW5lQW5zaShcbiAgICAgIHJlbmRlclRydW5jYXRlZENvbnRlbnQoZm9ybWF0dGVkLCBjb2x1bW5zLCBpblZpcnR1YWxMaXN0KSxcbiAgICApXG4gIH0sIFtjb250ZW50LCBzaG91bGRTaG93RnVsbCwgY29sdW1ucywgbGlua2lmeVVybHMsIGluVmlydHVhbExpc3RdKVxuXG4gIGNvbnN0IGNvbG9yID0gaXNFcnJvciA/ICdlcnJvcicgOiBpc1dhcm5pbmcgPyAnd2FybmluZycgOiB1bmRlZmluZWRcblxuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICA8VGV4dCBjb2xvcj17Y29sb3J9PlxuICAgICAgICA8QW5zaT57Zm9ybWF0dGVkQ29udGVudH08L0Fuc2k+XG4gICAgICA8L1RleHQ+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cblxuLyoqXG4gKiBVbmRlcmxpbmUgQU5TSSBjb2RlcyBpbiBwYXJ0aWN1bGFyIHRlbmQgdG8gbGVhayBvdXQgZm9yIHNvbWUgcmVhc29uLiBJIHdhc24ndFxuICogYWJsZSB0byBmaWd1cmUgb3V0IHdoeSwgb3Igd2h5IGVtaXR0aW5nIGEgcmVzZXQgQU5TSSBjb2RlIHdhc24ndCBlbm91Z2ggdG9cbiAqIHByZXZlbnQgdGhlbSBmcm9tIGxlYWtpbmcuIEkgYWxzbyBkaWRuJ3Qgd2FudCB0byBzdHJpcCBhbGwgQU5TSSBjb2RlcyB3aXRoXG4gKiBzdHJpcEFuc2koKSwgYmVjYXVzZSB3ZSB1c2VkIHRvIGRvIHRoYXQgYW5kIHBlb3BsZSBjb21wbGFpbmVkIGFib3V0IGxvc2luZ1xuICogYWxsIGZvcm1hdHRpbmcuIFNvIHdlIGp1c3Qgc3RyaXAgdGhlIHVuZGVybGluZSBBTlNJIGNvZGVzIHNwZWNpZmljYWxseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwVW5kZXJsaW5lQW5zaShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGVudC5yZXBsYWNlKFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250cm9sLXJlZ2V4XG4gICAgL1xcdTAwMWJcXFsoWzAtOV0rOykqNCg7WzAtOV0rKSptfFxcdTAwMWJcXFs0KDtbMC05XSspKm18XFx1MDAxYlxcWyhbMC05XSs7KSo0bS9nLFxuICAgICcnLFxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLE9BQU8sUUFBUSxPQUFPO0FBQy9CLFNBQVNDLGVBQWUsUUFBUSxnQ0FBZ0M7QUFDaEUsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN6QyxTQUFTQyxlQUFlLFFBQVEsMEJBQTBCO0FBQzFELFNBQVNDLFNBQVMsRUFBRUMsYUFBYSxRQUFRLCtCQUErQjtBQUN4RSxTQUFTQyxzQkFBc0IsUUFBUSx5QkFBeUI7QUFDaEUsU0FBU0MsZUFBZSxRQUFRLHVCQUF1QjtBQUN2RCxTQUFTQyxvQkFBb0IsUUFBUSxzQkFBc0I7QUFDM0QsU0FBU0Msb0JBQW9CLFFBQVEsK0JBQStCO0FBRXBFLE9BQU8sU0FBU0MsYUFBYUEsQ0FBQ0MsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQztFQUNsRCxJQUFJO0lBQ0YsTUFBTUMsTUFBTSxHQUFHUixTQUFTLENBQUNPLElBQUksQ0FBQztJQUM5QixNQUFNRSxXQUFXLEdBQUdSLGFBQWEsQ0FBQ08sTUFBTSxDQUFDOztJQUV6QztJQUNBO0lBQ0E7SUFDQTtJQUNBLE1BQU1FLGtCQUFrQixHQUFHSCxJQUFJLENBQUNJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUNBLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0lBQ3pFLE1BQU1DLHFCQUFxQixHQUFHSCxXQUFXLENBQUNFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0lBRTdELElBQUlELGtCQUFrQixLQUFLRSxxQkFBcUIsRUFBRTtNQUNoRDtNQUNBLE9BQU9MLElBQUk7SUFDYjtJQUVBLE9BQU9OLGFBQWEsQ0FBQ08sTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7RUFDdkMsQ0FBQyxDQUFDLE1BQU07SUFDTixPQUFPRCxJQUFJO0VBQ2I7QUFDRjtBQUVBLE1BQU1NLHNCQUFzQixHQUFHLE1BQU07QUFFckMsT0FBTyxTQUFTQyxvQkFBb0JBLENBQUNDLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUM7RUFDNUQsSUFBSUEsT0FBTyxDQUFDQyxNQUFNLEdBQUdILHNCQUFzQixFQUFFO0lBQzNDLE9BQU9FLE9BQU87RUFDaEI7RUFDQSxNQUFNRSxRQUFRLEdBQUdGLE9BQU8sQ0FBQ0csS0FBSyxDQUFDLElBQUksQ0FBQztFQUNwQyxPQUFPRCxRQUFRLENBQUNFLEdBQUcsQ0FBQ2IsYUFBYSxDQUFDLENBQUNjLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDL0M7O0FBRUE7QUFDQTtBQUNBLE1BQU1DLFdBQVcsR0FBRywwQkFBMEI7QUFFOUMsT0FBTyxTQUFTQyxpQkFBaUJBLENBQUNQLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUM7RUFDekQsT0FBT0EsT0FBTyxDQUFDSixPQUFPLENBQUNVLFdBQVcsRUFBRUUsR0FBRyxJQUFJeEIsZUFBZSxDQUFDd0IsR0FBRyxDQUFDLENBQUM7QUFDbEU7QUFFQSxPQUFPLFNBQUFDLFdBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBb0I7SUFBQVosT0FBQTtJQUFBYSxPQUFBO0lBQUFDLE9BQUE7SUFBQUMsU0FBQTtJQUFBQztFQUFBLElBQUFOLEVBWTFCO0VBQ0M7SUFBQU87RUFBQSxJQUFvQnBDLGVBQWUsQ0FBQyxDQUFDO0VBRXJDLE1BQUFxQyxpQkFBQSxHQUEwQjVCLG9CQUFvQixDQUFDLENBQUM7RUFDaEQsTUFBQTZCLGFBQUEsR0FBc0J4QyxLQUFLLENBQUF5QyxVQUFXLENBQUMvQixvQkFBb0IsQ0FBQztFQUc1RCxNQUFBZ0MsY0FBQSxHQUF1QlIsT0FBNEIsSUFBNUJLLGlCQUE0QjtFQUFBLElBQUFJLEVBQUE7RUFBQSxJQUFBWCxDQUFBLFFBQUFNLE9BQUEsSUFBQU4sQ0FBQSxRQUFBWCxPQUFBLElBQUFXLENBQUEsUUFBQVEsYUFBQSxJQUFBUixDQUFBLFFBQUFLLFdBQUEsSUFBQUwsQ0FBQSxRQUFBVSxjQUFBO0lBQUFFLEdBQUE7TUFHakQsSUFBQUMsU0FBQSxHQUFnQnpCLG9CQUFvQixDQUFDQyxPQUFPLENBQUM7TUFDN0MsSUFBSWdCLFdBQVc7UUFDYlEsU0FBQSxDQUFBQSxDQUFBLENBQVlqQixpQkFBaUIsQ0FBQ2lCLFNBQVMsQ0FBQztNQUEvQjtNQUVYLElBQUlILGNBQWM7UUFDaEJDLEVBQUEsR0FBT0csa0JBQWtCLENBQUNELFNBQVMsQ0FBQztRQUFwQyxNQUFBRCxHQUFBO01BQW9DO01BRXRDRCxFQUFBLEdBQU9HLGtCQUFrQixDQUN2QnRDLHNCQUFzQixDQUFDcUMsU0FBUyxFQUFFUCxPQUFPLEVBQUVFLGFBQWEsQ0FDMUQsQ0FBQztJQUFBO0lBQUFSLENBQUEsTUFBQU0sT0FBQTtJQUFBTixDQUFBLE1BQUFYLE9BQUE7SUFBQVcsQ0FBQSxNQUFBUSxhQUFBO0lBQUFSLENBQUEsTUFBQUssV0FBQTtJQUFBTCxDQUFBLE1BQUFVLGNBQUE7SUFBQVYsQ0FBQSxNQUFBVyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWCxDQUFBO0VBQUE7RUFWSCxNQUFBZSxnQkFBQSxHQUF5QkosRUFXeUM7RUFFbEUsTUFBQUssS0FBQSxHQUFjYixPQUFPLEdBQVAsT0FBcUQsR0FBakNDLFNBQVMsR0FBVCxTQUFpQyxHQUFqQ2EsU0FBaUM7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQWxCLENBQUEsUUFBQWUsZ0JBQUE7SUFLN0RHLEVBQUEsSUFBQyxJQUFJLENBQUVILGlCQUFlLENBQUUsRUFBdkIsSUFBSSxDQUEwQjtJQUFBZixDQUFBLE1BQUFlLGdCQUFBO0lBQUFmLENBQUEsTUFBQWtCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFsQixDQUFBO0VBQUE7RUFBQSxJQUFBbUIsRUFBQTtFQUFBLElBQUFuQixDQUFBLFFBQUFnQixLQUFBLElBQUFoQixDQUFBLFFBQUFrQixFQUFBO0lBRm5DQyxFQUFBLElBQUMsZUFBZSxDQUNkLENBQUMsSUFBSSxDQUFRSCxLQUFLLENBQUxBLE1BQUksQ0FBQyxDQUNoQixDQUFBRSxFQUE4QixDQUNoQyxFQUZDLElBQUksQ0FHUCxFQUpDLGVBQWUsQ0FJRTtJQUFBbEIsQ0FBQSxNQUFBZ0IsS0FBQTtJQUFBaEIsQ0FBQSxNQUFBa0IsRUFBQTtJQUFBbEIsQ0FBQSxPQUFBbUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQW5CLENBQUE7RUFBQTtFQUFBLE9BSmxCbUIsRUFJa0I7QUFBQTs7QUFJdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQVNMLGtCQUFrQkEsQ0FBQ3pCLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUM7RUFDMUQsT0FBT0EsT0FBTyxDQUFDSixPQUFPO0VBQ3BCO0VBQ0EsMkVBQTJFLEVBQzNFLEVBQ0YsQ0FBQztBQUNIIiwiaWdub3JlTGlzdCI6W119
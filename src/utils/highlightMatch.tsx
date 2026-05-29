// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';

/**
 * Inverse-highlight every occurrence of `query` in `text` (case-insensitive).
 * Used by search dialogs to show where the query matched in result rows
 * and preview panes.
 */
// highlightMatch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function highlightMatch(text: string, query: string): React.ReactNode {
  // query缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!query) return text;
  // queryLower保存`query.toLowerCase`，供共享工具后续处理使用。
  const queryLower = query.toLowerCase();
  // textLower保存`text.toLowerCase`，供共享工具后续处理使用。
  const textLower = text.toLowerCase();
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: React.ReactNode[] = [];
  // offset保存`0`，供共享工具 highlight Match后续判断或输出使用。
  let offset = 0;
  // idx保存`textLower.indexOf`，供共享工具后续处理使用。
  let idx = textLower.indexOf(queryLower, offset);
  // 满足 `idx === -1` 时，共享工具执行该分支。
  if (idx === -1) return text;
  // while 使用 idx !== -1 完成共享工具里的对应操作。
  while (idx !== -1) {
    // 满足 `idx > offset) parts.push(text.slice(offset, idx)` 时，共享工具执行该分支。
    if (idx > offset) parts.push(text.slice(offset, idx));
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(<Text key={idx} inverse>
        {text.slice(idx, idx + query.length)}
      </Text>);
    // offset更新为 `idx + query.length`，确保共享工具后续读取最新状态。
    offset = idx + query.length;
    // idx更新为 `textLower.indexOf(queryLower, offset)`，确保共享工具后续读取最新状态。
    idx = textLower.indexOf(queryLower, offset);
  }
  // 满足 `offset < text.length) parts.push(text.slice(offset)` 时，共享工具执行该分支。
  if (offset < text.length) parts.push(text.slice(offset));
  // 返回 `<>{parts}</>`，作为共享工具这次计算的结果。
  return <>{parts}</>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJoaWdobGlnaHRNYXRjaCIsInRleHQiLCJxdWVyeSIsIlJlYWN0Tm9kZSIsInF1ZXJ5TG93ZXIiLCJ0b0xvd2VyQ2FzZSIsInRleHRMb3dlciIsInBhcnRzIiwib2Zmc2V0IiwiaWR4IiwiaW5kZXhPZiIsInB1c2giLCJzbGljZSIsImxlbmd0aCJdLCJzb3VyY2VzIjpbImhpZ2hsaWdodE1hdGNoLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5cbi8qKlxuICogSW52ZXJzZS1oaWdobGlnaHQgZXZlcnkgb2NjdXJyZW5jZSBvZiBgcXVlcnlgIGluIGB0ZXh0YCAoY2FzZS1pbnNlbnNpdGl2ZSkuXG4gKiBVc2VkIGJ5IHNlYXJjaCBkaWFsb2dzIHRvIHNob3cgd2hlcmUgdGhlIHF1ZXJ5IG1hdGNoZWQgaW4gcmVzdWx0IHJvd3NcbiAqIGFuZCBwcmV2aWV3IHBhbmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGlnaGxpZ2h0TWF0Y2godGV4dDogc3RyaW5nLCBxdWVyeTogc3RyaW5nKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCFxdWVyeSkgcmV0dXJuIHRleHRcbiAgY29uc3QgcXVlcnlMb3dlciA9IHF1ZXJ5LnRvTG93ZXJDYXNlKClcbiAgY29uc3QgdGV4dExvd2VyID0gdGV4dC50b0xvd2VyQ2FzZSgpXG4gIGNvbnN0IHBhcnRzOiBSZWFjdC5SZWFjdE5vZGVbXSA9IFtdXG4gIGxldCBvZmZzZXQgPSAwXG4gIGxldCBpZHggPSB0ZXh0TG93ZXIuaW5kZXhPZihxdWVyeUxvd2VyLCBvZmZzZXQpXG4gIGlmIChpZHggPT09IC0xKSByZXR1cm4gdGV4dFxuICB3aGlsZSAoaWR4ICE9PSAtMSkge1xuICAgIGlmIChpZHggPiBvZmZzZXQpIHBhcnRzLnB1c2godGV4dC5zbGljZShvZmZzZXQsIGlkeCkpXG4gICAgcGFydHMucHVzaChcbiAgICAgIDxUZXh0IGtleT17aWR4fSBpbnZlcnNlPlxuICAgICAgICB7dGV4dC5zbGljZShpZHgsIGlkeCArIHF1ZXJ5Lmxlbmd0aCl9XG4gICAgICA8L1RleHQ+LFxuICAgIClcbiAgICBvZmZzZXQgPSBpZHggKyBxdWVyeS5sZW5ndGhcbiAgICBpZHggPSB0ZXh0TG93ZXIuaW5kZXhPZihxdWVyeUxvd2VyLCBvZmZzZXQpXG4gIH1cbiAgaWYgKG9mZnNldCA8IHRleHQubGVuZ3RoKSBwYXJ0cy5wdXNoKHRleHQuc2xpY2Uob2Zmc2V0KSlcbiAgcmV0dXJuIDw+e3BhcnRzfTwvPlxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLElBQUksUUFBUSxXQUFXOztBQUVoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFTQyxjQUFjQSxDQUFDQyxJQUFJLEVBQUUsTUFBTSxFQUFFQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUVKLEtBQUssQ0FBQ0ssU0FBUyxDQUFDO0VBQzNFLElBQUksQ0FBQ0QsS0FBSyxFQUFFLE9BQU9ELElBQUk7RUFDdkIsTUFBTUcsVUFBVSxHQUFHRixLQUFLLENBQUNHLFdBQVcsQ0FBQyxDQUFDO0VBQ3RDLE1BQU1DLFNBQVMsR0FBR0wsSUFBSSxDQUFDSSxXQUFXLENBQUMsQ0FBQztFQUNwQyxNQUFNRSxLQUFLLEVBQUVULEtBQUssQ0FBQ0ssU0FBUyxFQUFFLEdBQUcsRUFBRTtFQUNuQyxJQUFJSyxNQUFNLEdBQUcsQ0FBQztFQUNkLElBQUlDLEdBQUcsR0FBR0gsU0FBUyxDQUFDSSxPQUFPLENBQUNOLFVBQVUsRUFBRUksTUFBTSxDQUFDO0VBQy9DLElBQUlDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPUixJQUFJO0VBQzNCLE9BQU9RLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRTtJQUNqQixJQUFJQSxHQUFHLEdBQUdELE1BQU0sRUFBRUQsS0FBSyxDQUFDSSxJQUFJLENBQUNWLElBQUksQ0FBQ1csS0FBSyxDQUFDSixNQUFNLEVBQUVDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JERixLQUFLLENBQUNJLElBQUksQ0FDUixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQ0YsR0FBRyxDQUFDLENBQUMsT0FBTztBQUM3QixRQUFRLENBQUNSLElBQUksQ0FBQ1csS0FBSyxDQUFDSCxHQUFHLEVBQUVBLEdBQUcsR0FBR1AsS0FBSyxDQUFDVyxNQUFNLENBQUM7QUFDNUMsTUFBTSxFQUFFLElBQUksQ0FDUixDQUFDO0lBQ0RMLE1BQU0sR0FBR0MsR0FBRyxHQUFHUCxLQUFLLENBQUNXLE1BQU07SUFDM0JKLEdBQUcsR0FBR0gsU0FBUyxDQUFDSSxPQUFPLENBQUNOLFVBQVUsRUFBRUksTUFBTSxDQUFDO0VBQzdDO0VBQ0EsSUFBSUEsTUFBTSxHQUFHUCxJQUFJLENBQUNZLE1BQU0sRUFBRU4sS0FBSyxDQUFDSSxJQUFJLENBQUNWLElBQUksQ0FBQ1csS0FBSyxDQUFDSixNQUFNLENBQUMsQ0FBQztFQUN4RCxPQUFPLEVBQUUsQ0FBQ0QsS0FBSyxDQUFDLEdBQUc7QUFDckIiLCJpZ25vcmVMaXN0IjpbXX0=
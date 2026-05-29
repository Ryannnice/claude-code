// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js';
// FeedLine 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type FeedLine = {
  text: string;
  timestamp?: string;
};
// FeedConfig 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type FeedConfig = {
  title: string;
  lines: FeedLine[];
  footer?: string;
  emptyMessage?: string;
  customContent?: {
    content: React.ReactNode;
    width: number;
  };
};
// FeedProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FeedProps = {
  config: FeedConfig;
  actualWidth: number;
};
// calculateFeedWidth 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateFeedWidth(config: FeedConfig): number {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title,
    lines,
    footer,
    emptyMessage,
    customContent
  } = config;
  // maxWidth保存`stringWidth`，供终端渲染后续处理使用。
  let maxWidth = stringWidth(title);
  // `customContent` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (customContent !== undefined) {
    // maxWidth更新为 `Math.max(maxWidth, customContent.width)`，确保终端 UI后续读取最新状态。
    maxWidth = Math.max(maxWidth, customContent.width);
  // 终端 UI 组件 Feed在这里处理 `} else if (lines.length === 0 && emptyMessage) {`，完成这一小步状态转换。
  } else if (lines.length === 0 && emptyMessage) {
    // maxWidth更新为 `Math.max(maxWidth, stringWidth(emptyMessage))`，确保终端 UI后续读取最新状态。
    maxWidth = Math.max(maxWidth, stringWidth(emptyMessage));
  } else {
    // gap 命名 `' '`，让后续代码直接表达这个值的用途。
    const gap = '  ';
    // maxTimestampWidth保存`Math.max`，供终端渲染后续处理使用。
    const maxTimestampWidth = Math.max(0, ...lines.map(line => line.timestamp ? stringWidth(line.timestamp) : 0));
    // 按顺序遍历 `lines` 中的line，逐个交给终端渲染处理。
    for (const line of lines) {
      // timestampWidth保存`maxTimestampWidth > 0 ? maxTimestampWidth : 0`，供终端 UI Feed后续判断或输出使用。
      const timestampWidth = maxTimestampWidth > 0 ? maxTimestampWidth : 0;
      // lineWidth保存`stringWidth`，供终端渲染后续处理使用。
      const lineWidth = stringWidth(line.text) + (timestampWidth > 0 ? timestampWidth + gap.length : 0);
      // maxWidth更新为 `Math.max(maxWidth, lineWidth)`，确保终端 UI后续读取最新状态。
      maxWidth = Math.max(maxWidth, lineWidth);
    }
  }
  // 满足 `footer` 时，终端渲染执行该分支。
  if (footer) {
    // maxWidth更新为 `Math.max(maxWidth, stringWidth(footer))`，确保终端 UI后续读取最新状态。
    maxWidth = Math.max(maxWidth, stringWidth(footer));
  }
  // 返回 `maxWidth`，作为终端渲染这次计算的结果。
  return maxWidth;
}
// Feed 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Feed(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(15);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    config,
    actualWidth
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title,
    lines,
    footer,
    emptyMessage,
    customContent
  } = config;
  // t1 暂存 `Math.max(0, ...lines.map(_temp))` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== lines) {
    // t1 暂存 `Math.max(0, ...lines.map(_temp))` 生成的渲染片段，后续返回路径直接复用。
    t1 = Math.max(0, ...lines.map(_temp));
    // $[0] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = lines;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // maxTimestampWidth 命名 `t1`，让后续代码直接表达这个值的用途。
  const maxTimestampWidth = t1;
  // t2 暂存 `<Text bold={true} color="claude">{title}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== title) {
    // t2 暂存 `<Text bold={true} color="claude">{title}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text bold={true} color="claude">{title}</Text>;
    // $[2] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = title;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `customContent ? <>{customContent.content}{footer && <Text...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== actualWidth || $[5] !== customContent || $[6] !== emptyMessage || $[7] !== footer || $[8] !== lines || $[9] !== maxTimestampWidth) {
    // t3 暂存 `customContent ? <>{customContent.content}{footer && <Text...` 生成的渲染片段，后续返回路径直接复用。
    t3 = customContent ? <>{customContent.content}{footer && <Text dimColor={true} italic={true}>{truncate(footer, actualWidth)}</Text>}</> : lines.length === 0 && emptyMessage ? <Text dimColor={true}>{truncate(emptyMessage, actualWidth)}</Text> : <>{lines.map((line_0, index) => {
        // textWidth保存`Math.max`，供终端渲染后续处理使用。
        const textWidth = Math.max(10, actualWidth - (maxTimestampWidth > 0 ? maxTimestampWidth + 2 : 0));
        // 返回 `<Text key={index}>{maxTimestampWidth > 0 && <><Text dimColor={true}>{(l...`，作为终端渲染这次计算的结果。
        return <Text key={index}>{maxTimestampWidth > 0 && <><Text dimColor={true}>{(line_0.timestamp || "").padEnd(maxTimestampWidth)}</Text>{"  "}</>}<Text>{truncate(line_0.text, textWidth)}</Text></Text>;
      })}{footer && <Text dimColor={true} italic={true}>{truncate(footer, actualWidth)}</Text>}</>;
    // $[4] 缓存 `actualWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = actualWidth;
    // $[5] 缓存 `customContent`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = customContent;
    // $[6] 缓存 `emptyMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = emptyMessage;
    // $[7] 缓存 `footer`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = footer;
    // $[8] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = lines;
    // $[9] 缓存 `maxTimestampWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = maxTimestampWidth;
    // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[10];
  }
  // t4 暂存 `<Box flexDirection="column" width={actualWidth}>{t2}{t3}<...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== actualWidth || $[12] !== t2 || $[13] !== t3) {
    // t4 暂存 `<Box flexDirection="column" width={actualWidth}>{t2}{t3}<...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column" width={actualWidth}>{t2}{t3}</Box>;
    // $[11] 缓存 `actualWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = actualWidth;
    // $[12] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t2;
    // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t3;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[14];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(line) {
  // 返回 `line.timestamp ? stringWidth(line.timestamp) : 0`，作为终端渲染这次计算的结果。
  return line.timestamp ? stringWidth(line.timestamp) : 0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInN0cmluZ1dpZHRoIiwiQm94IiwiVGV4dCIsInRydW5jYXRlIiwiRmVlZExpbmUiLCJ0ZXh0IiwidGltZXN0YW1wIiwiRmVlZENvbmZpZyIsInRpdGxlIiwibGluZXMiLCJmb290ZXIiLCJlbXB0eU1lc3NhZ2UiLCJjdXN0b21Db250ZW50IiwiY29udGVudCIsIlJlYWN0Tm9kZSIsIndpZHRoIiwiRmVlZFByb3BzIiwiY29uZmlnIiwiYWN0dWFsV2lkdGgiLCJjYWxjdWxhdGVGZWVkV2lkdGgiLCJtYXhXaWR0aCIsInVuZGVmaW5lZCIsIk1hdGgiLCJtYXgiLCJsZW5ndGgiLCJnYXAiLCJtYXhUaW1lc3RhbXBXaWR0aCIsIm1hcCIsImxpbmUiLCJ0aW1lc3RhbXBXaWR0aCIsImxpbmVXaWR0aCIsIkZlZWQiLCJ0MCIsIiQiLCJfYyIsInQxIiwiX3RlbXAiLCJ0MiIsInQzIiwibGluZV8wIiwiaW5kZXgiLCJ0ZXh0V2lkdGgiLCJwYWRFbmQiLCJ0NCJdLCJzb3VyY2VzIjpbIkZlZWQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi8uLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB0cnVuY2F0ZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcblxuZXhwb3J0IHR5cGUgRmVlZExpbmUgPSB7XG4gIHRleHQ6IHN0cmluZ1xuICB0aW1lc3RhbXA/OiBzdHJpbmdcbn1cblxuZXhwb3J0IHR5cGUgRmVlZENvbmZpZyA9IHtcbiAgdGl0bGU6IHN0cmluZ1xuICBsaW5lczogRmVlZExpbmVbXVxuICBmb290ZXI/OiBzdHJpbmdcbiAgZW1wdHlNZXNzYWdlPzogc3RyaW5nXG4gIGN1c3RvbUNvbnRlbnQ/OiB7IGNvbnRlbnQ6IFJlYWN0LlJlYWN0Tm9kZTsgd2lkdGg6IG51bWJlciB9XG59XG5cbnR5cGUgRmVlZFByb3BzID0ge1xuICBjb25maWc6IEZlZWRDb25maWdcbiAgYWN0dWFsV2lkdGg6IG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlRmVlZFdpZHRoKGNvbmZpZzogRmVlZENvbmZpZyk6IG51bWJlciB7XG4gIGNvbnN0IHsgdGl0bGUsIGxpbmVzLCBmb290ZXIsIGVtcHR5TWVzc2FnZSwgY3VzdG9tQ29udGVudCB9ID0gY29uZmlnXG5cbiAgbGV0IG1heFdpZHRoID0gc3RyaW5nV2lkdGgodGl0bGUpXG5cbiAgaWYgKGN1c3RvbUNvbnRlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgIG1heFdpZHRoID0gTWF0aC5tYXgobWF4V2lkdGgsIGN1c3RvbUNvbnRlbnQud2lkdGgpXG4gIH0gZWxzZSBpZiAobGluZXMubGVuZ3RoID09PSAwICYmIGVtcHR5TWVzc2FnZSkge1xuICAgIG1heFdpZHRoID0gTWF0aC5tYXgobWF4V2lkdGgsIHN0cmluZ1dpZHRoKGVtcHR5TWVzc2FnZSkpXG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZ2FwID0gJyAgJ1xuICAgIGNvbnN0IG1heFRpbWVzdGFtcFdpZHRoID0gTWF0aC5tYXgoXG4gICAgICAwLFxuICAgICAgLi4ubGluZXMubWFwKGxpbmUgPT4gKGxpbmUudGltZXN0YW1wID8gc3RyaW5nV2lkdGgobGluZS50aW1lc3RhbXApIDogMCkpLFxuICAgIClcblxuICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgY29uc3QgdGltZXN0YW1wV2lkdGggPSBtYXhUaW1lc3RhbXBXaWR0aCA+IDAgPyBtYXhUaW1lc3RhbXBXaWR0aCA6IDBcbiAgICAgIGNvbnN0IGxpbmVXaWR0aCA9XG4gICAgICAgIHN0cmluZ1dpZHRoKGxpbmUudGV4dCkgK1xuICAgICAgICAodGltZXN0YW1wV2lkdGggPiAwID8gdGltZXN0YW1wV2lkdGggKyBnYXAubGVuZ3RoIDogMClcbiAgICAgIG1heFdpZHRoID0gTWF0aC5tYXgobWF4V2lkdGgsIGxpbmVXaWR0aClcbiAgICB9XG4gIH1cblxuICBpZiAoZm9vdGVyKSB7XG4gICAgbWF4V2lkdGggPSBNYXRoLm1heChtYXhXaWR0aCwgc3RyaW5nV2lkdGgoZm9vdGVyKSlcbiAgfVxuXG4gIHJldHVybiBtYXhXaWR0aFxufVxuXG5leHBvcnQgZnVuY3Rpb24gRmVlZCh7IGNvbmZpZywgYWN0dWFsV2lkdGggfTogRmVlZFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyB0aXRsZSwgbGluZXMsIGZvb3RlciwgZW1wdHlNZXNzYWdlLCBjdXN0b21Db250ZW50IH0gPSBjb25maWdcblxuICBjb25zdCBnYXAgPSAnICAnXG4gIGNvbnN0IG1heFRpbWVzdGFtcFdpZHRoID0gTWF0aC5tYXgoXG4gICAgMCxcbiAgICAuLi5saW5lcy5tYXAobGluZSA9PiAobGluZS50aW1lc3RhbXAgPyBzdHJpbmdXaWR0aChsaW5lLnRpbWVzdGFtcCkgOiAwKSksXG4gIClcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHdpZHRoPXthY3R1YWxXaWR0aH0+XG4gICAgICA8VGV4dCBib2xkIGNvbG9yPVwiY2xhdWRlXCI+XG4gICAgICAgIHt0aXRsZX1cbiAgICAgIDwvVGV4dD5cbiAgICAgIHtjdXN0b21Db250ZW50ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIHtjdXN0b21Db250ZW50LmNvbnRlbnR9XG4gICAgICAgICAge2Zvb3RlciAmJiAoXG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvciBpdGFsaWM+XG4gICAgICAgICAgICAgIHt0cnVuY2F0ZShmb290ZXIsIGFjdHVhbFdpZHRoKX1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApfVxuICAgICAgICA8Lz5cbiAgICAgICkgOiBsaW5lcy5sZW5ndGggPT09IDAgJiYgZW1wdHlNZXNzYWdlID8gKFxuICAgICAgICA8VGV4dCBkaW1Db2xvcj57dHJ1bmNhdGUoZW1wdHlNZXNzYWdlLCBhY3R1YWxXaWR0aCl9PC9UZXh0PlxuICAgICAgKSA6IChcbiAgICAgICAgPD5cbiAgICAgICAgICB7bGluZXMubWFwKChsaW5lLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGV4dFdpZHRoID0gTWF0aC5tYXgoXG4gICAgICAgICAgICAgIDEwLFxuICAgICAgICAgICAgICBhY3R1YWxXaWR0aCAtXG4gICAgICAgICAgICAgICAgKG1heFRpbWVzdGFtcFdpZHRoID4gMCA/IG1heFRpbWVzdGFtcFdpZHRoICsgZ2FwLmxlbmd0aCA6IDApLFxuICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8VGV4dCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICB7bWF4VGltZXN0YW1wV2lkdGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgICAgICAgIHsobGluZS50aW1lc3RhbXAgfHwgJycpLnBhZEVuZChtYXhUaW1lc3RhbXBXaWR0aCl9XG4gICAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAge2dhcH1cbiAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPFRleHQ+e3RydW5jYXRlKGxpbmUudGV4dCwgdGV4dFdpZHRoKX08L1RleHQ+XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9KX1cbiAgICAgICAgICB7Zm9vdGVyICYmIChcbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yIGl0YWxpYz5cbiAgICAgICAgICAgICAge3RydW5jYXRlKGZvb3RlciwgYWN0dWFsV2lkdGgpfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICl9XG4gICAgICAgIDwvPlxuICAg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
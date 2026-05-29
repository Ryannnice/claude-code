// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 引入 Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text, useTheme } from '../../ink.js';
// 复用 getGraphemeSegmenter 工具函数，把通用处理留在 ../../utils/intl.js 中维护。
import { getGraphemeSegmenter } from '../../utils/intl.js';
// 复用 getTheme、Theme 工具函数，把通用处理留在 ../../utils/theme.js 中维护。
import { getTheme, type Theme } from '../../utils/theme.js';
// 类型依赖 { SpinnerMode } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { SpinnerMode } from './types.js';
// 引入 interpolateColor、parseRGB、toRGBColor，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { interpolateColor, parseRGB, toRGBColor } from './utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  message: string;
  mode: SpinnerMode;
  messageColor: keyof Theme;
  glimmerIndex: number;
  flashOpacity: number;
  shimmerColor: keyof Theme;
  stalledIntensity?: number;
};
// ERROR_RED 错误信息集中保存终端 UI Glimmer Message要一起传递的字段。
const ERROR_RED = {
  r: 171,
  g: 43,
  b: 63
};
// GlimmerMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function GlimmerMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(75);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    message,
    mode,
    messageColor,
    glimmerIndex,
    flashOpacity,
    shimmerColor,
    stalledIntensity: t1
  } = t0;
  // stalledIntensity标记终端 UI Glimmer Message是否启用对应路径。
  const stalledIntensity = t1 === undefined ? 0 : t1;
  // 从 `useTheme()` 按位置拆出 themeName，让终端 UI 组件 Glimmer Message分别处理这些返回值。
  const [themeName] = useTheme();
  // messageWidth 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let messageWidth;
  // segments 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let segments;
  // t2 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== flashOpacity || $[1] !== message || $[2] !== messageColor || $[3] !== mode || $[4] !== shimmerColor || $[5] !== stalledIntensity || $[6] !== themeName) {
    // t2 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t2 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 Glimmer Message在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // 主题读取`getTheme`，供终端渲染后续处理使用。
      const theme = getTheme(themeName);
      // segs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let segs;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[10] !== message) {
        // segs 集合更新为 `[]`，确保终端 UI后续读取最新状态。
        segs = [];
        // 调用 for，触发终端渲染此处需要的副作用。
        for (const {
          segment
        } of getGraphemeSegmenter().segment(message)) {
          // segs 集合追加新条目，保持收集顺序与输入顺序一致。
          segs.push({
            segment,
            width: stringWidth(segment)
          });
        }
        // $[10] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
        $[10] = message;
        // $[11] 缓存 `segs`，下次依赖未变时 React 编译产物可直接复用。
        $[11] = segs;
      } else {
        // segs 集合更新为 `$[11]`，确保终端 UI后续读取最新状态。
        segs = $[11];
      }
      // t3 暂存 `stringWidth(message)` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[12] !== message) {
        // t3 暂存 `stringWidth(message)` 生成的渲染片段，后续返回路径直接复用。
        t3 = stringWidth(message);
        // $[12] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
        $[12] = message;
        // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[13] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[13];
      }
      // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t4;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[14] !== segs || $[15] !== t3) {
        // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t4 = {
          segments: segs,
          messageWidth: t3
        };
        // $[14] 缓存 `segs`，下次依赖未变时 React 编译产物可直接复用。
        $[14] = segs;
        // $[15] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[15] = t3;
        // $[16] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
        $[16] = t4;
      } else {
        // t4 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
        t4 = $[16];
      }
      // 重新解构输入对象，把终端 UI 组件 Glimmer Message需要的字段同步到本地变量。
      ({
        segments,
        messageWidth
      } = t4);
      // 消息缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!message) {
        // t2 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t2 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 满足 `stalledIntensity > 0` 时，终端渲染执行该分支。
      if (stalledIntensity > 0) {
        // baseColorStr保存`theme[messageColor]`，供终端 UI Glimmer Message后续判断或输出使用。
        const baseColorStr = theme[messageColor];
        // baseRGB解析`parseRGB`，供终端渲染后续处理使用。
        const baseRGB = baseColorStr ? parseRGB(baseColorStr) : null;
        // 满足 `baseRGB` 时，终端渲染执行该分支。
        if (baseRGB) {
          // interpolated保存`interpolateColor`，供终端渲染后续处理使用。
          const interpolated = interpolateColor(baseRGB, ERROR_RED, stalledIntensity);
          // color保存`toRGBColor`，供终端渲染后续处理使用。
          const color = toRGBColor(interpolated);
          // t5 暂存 `<Text color={color}> </Text>` 的派生结果，便于缓存命中时直接复用。
          let t5;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[17] !== color) {
            // t5 暂存 `<Text color={color}> </Text>` 生成的渲染片段，后续返回路径直接复用。
            t5 = <Text color={color}> </Text>;
            // $[17] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
            $[17] = color;
            // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
            $[18] = t5;
          } else {
            // t5 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
            t5 = $[18];
          }
          // t2 暂存 `<><Text color={color}>{message}</Text>{t5}</>` 生成的渲染片段，后续返回路径直接复用。
          t2 = <><Text color={color}>{message}</Text>{t5}</>;
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break bb0;
        }
        // color_0保存`stalledIntensity > 0.5 ? "error" : messageColor`，供终端 UI Glimmer Message后续判断或输出使用。
        const color_0 = stalledIntensity > 0.5 ? "error" : messageColor;
        // t5 暂存 `<Text color={color_0}>{message}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[19] !== color_0 || $[20] !== message) {
          // t5 暂存 `<Text color={color_0}>{message}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t5 = <Text color={color_0}>{message}</Text>;
          // $[19] 缓存 `color_0`，下次依赖未变时 React 编译产物可直接复用。
          $[19] = color_0;
          // $[20] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
          $[20] = message;
          // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[21] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[21];
        }
        // t6 暂存 `<Text color={color_0}> </Text>` 的派生结果，便于缓存命中时直接复用。
        let t6;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[22] !== color_0) {
          // t6 暂存 `<Text color={color_0}> </Text>` 生成的渲染片段，后续返回路径直接复用。
          t6 = <Text color={color_0}> </Text>;
          // $[22] 缓存 `color_0`，下次依赖未变时 React 编译产物可直接复用。
          $[22] = color_0;
          // $[23] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[23] = t6;
        } else {
          // t6 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
          t6 = $[23];
        }
        // t7 暂存 `<>{t5}{t6}</>` 的派生结果，便于缓存命中时直接复用。
        let t7;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[24] !== t5 || $[25] !== t6) {
          // t7 暂存 `<>{t5}{t6}</>` 生成的渲染片段，后续返回路径直接复用。
          t7 = <>{t5}{t6}</>;
          // $[24] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[24] = t5;
          // $[25] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[25] = t6;
          // $[26] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
          $[26] = t7;
        } else {
          // t7 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
          t7 = $[26];
        }
        // t2 暂存 `t7` 生成的渲染片段，后续返回路径直接复用。
        t2 = t7;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 当 `mode` 匹配 `"tool-use"` 时，终端渲染执行对应分支。
      if (mode === "tool-use") {
        // baseColorStr_0读取 `theme[messageColor]` 对应条目，后续围绕该成员继续处理。
        const baseColorStr_0 = theme[messageColor];
        // shimmerColorStr读取 `theme[shimmerColor]` 对应条目，后续围绕该成员继续处理。
        const shimmerColorStr = theme[shimmerColor];
        // baseRGB_0解析`parseRGB`，供终端渲染后续处理使用。
        const baseRGB_0 = baseColorStr_0 ? parseRGB(baseColorStr_0) : null;
        // shimmerRGB解析`parseRGB`，供终端渲染后续处理使用。
        const shimmerRGB = shimmerColorStr ? parseRGB(shimmerColorStr) : null;
        // 只有 `baseRGB_0 && shimmerRGB` 满足时，终端渲染才执行该分支。
        if (baseRGB_0 && shimmerRGB) {
          // interpolated_0保存`interpolateColor`，供终端渲染后续处理使用。
          const interpolated_0 = interpolateColor(baseRGB_0, shimmerRGB, flashOpacity);
          // 临时值 t5保存`toRGBColor`，供终端渲染后续处理使用。
          const t5 = <Text color={toRGBColor(interpolated_0)}>{message}</Text>;
          // t6 暂存 `<Text color={messageColor}> </Text>` 的派生结果，便于缓存命中时直接复用。
          let t6;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[27] !== messageColor) {
            // t6 暂存 `<Text color={messageColor}> </Text>` 生成的渲染片段，后续返回路径直接复用。
            t6 = <Text color={messageColor}> </Text>;
            // $[27] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
            $[27] = messageColor;
            // $[28] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
            $[28] = t6;
          } else {
            // t6 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
            t6 = $[28];
          }
          // t7 暂存 `<>{t5}{t6}</>` 的派生结果，便于缓存命中时直接复用。
          let t7;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[29] !== t5 || $[30] !== t6) {
            // t7 暂存 `<>{t5}{t6}</>` 生成的渲染片段，后续返回路径直接复用。
            t7 = <>{t5}{t6}</>;
            // $[29] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
            $[29] = t5;
            // $[30] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
            $[30] = t6;
            // $[31] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
            $[31] = t7;
          } else {
            // t7 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
            t7 = $[31];
          }
          // t2 暂存 `t7` 生成的渲染片段，后续返回路径直接复用。
          t2 = t7;
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break bb0;
        }
        // color_1保存`flashOpacity > 0.5 ? shimmerColor : messageColor`，供终端 UI Glimmer Message后续判断或输出使用。
        const color_1 = flashOpacity > 0.5 ? shimmerColor : messageColor;
        // t5 暂存 `<Text color={color_1}>{message}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[32] !== color_1 || $[33] !== message) {
          // t5 暂存 `<Text color={color_1}>{message}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t5 = <Text color={color_1}>{message}</Text>;
          // $[32] 缓存 `color_1`，下次依赖未变时 React 编译产物可直接复用。
          $[32] = color_1;
          // $[33] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
          $[33] = message;
          // $[34] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[34] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[34];
        }
        // t6 暂存 `<Text color={messageColor}> </Text>` 的派生结果，便于缓存命中时直接复用。
        let t6;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[35] !== messageColor) {
          // t6 暂存 `<Text color={messageColor}> </Text>` 生成的渲染片段，后续返回路径直接复用。
          t6 = <Text color={messageColor}> </Text>;
          // $[35] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
          $[35] = messageColor;
          // $[36] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[36] = t6;
        } else {
          // t6 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
          t6 = $[36];
        }
        // t7 暂存 `<>{t5}{t6}</>` 的派生结果，便于缓存命中时直接复用。
        let t7;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[37] !== t5 || $[38] !== t6) {
          // t7 暂存 `<>{t5}{t6}</>` 生成的渲染片段，后续返回路径直接复用。
          t7 = <>{t5}{t6}</>;
          // $[37] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[37] = t5;
          // $[38] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[38] = t6;
          // $[39] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
          $[39] = t7;
        } else {
          // t7 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
          t7 = $[39];
        }
        // t2 暂存 `t7` 生成的渲染片段，后续返回路径直接复用。
        t2 = t7;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
    }
    // $[0] 缓存 `flashOpacity`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = flashOpacity;
    // $[1] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = message;
    // $[2] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = messageColor;
    // $[3] 缓存 `mode`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = mode;
    // $[4] 缓存 `shimmerColor`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = shimmerColor;
    // $[5] 缓存 `stalledIntensity`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = stalledIntensity;
    // $[6] 缓存 `themeName`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = themeName;
    // $[7] 缓存 `messageWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = messageWidth;
    // $[8] 缓存 `segments`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = segments;
    // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t2;
  } else {
    // messageWidth 消息数据更新为 `$[7]`，确保终端 UI后续读取最新状态。
    messageWidth = $[7];
    // segments 集合更新为 `$[8]`，确保终端 UI后续读取最新状态。
    segments = $[8];
    // t2 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[9];
  }
  // `t2` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // shimmerStart保存`glimmerIndex - 1`，供后续判断或组装使用。
  const shimmerStart = glimmerIndex - 1;
  // shimmerEnd保存`glimmerIndex + 1`，供终端 UI Glimmer Message后续判断或输出使用。
  const shimmerEnd = glimmerIndex + 1;
  // 只有 `shimmerStart >= messageWidth || shimmerEnd < 0` 满足时，终端渲染才执行该分支。
  if (shimmerStart >= messageWidth || shimmerEnd < 0) {
    // t3 暂存 `<Text color={messageColor}>{message}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[40] !== message || $[41] !== messageColor) {
      // t3 暂存 `<Text color={messageColor}>{message}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text color={messageColor}>{message}</Text>;
      // $[40] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
      $[40] = message;
      // $[41] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
      $[41] = messageColor;
      // $[42] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[42] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[42];
    }
    // t4 暂存 `<Text color={messageColor}> </Text>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[43] !== messageColor) {
      // t4 暂存 `<Text color={messageColor}> </Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text color={messageColor}> </Text>;
      // $[43] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
      $[43] = messageColor;
      // $[44] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[44] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[44];
    }
    // t5 暂存 `<>{t3}{t4}</>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[45] !== t3 || $[46] !== t4) {
      // t5 暂存 `<>{t3}{t4}</>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <>{t3}{t4}</>;
      // $[45] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[45] = t3;
      // $[46] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[46] = t4;
      // $[47] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[47] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[47];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // clampedStart保存`Math.max`，供终端渲染后续处理使用。
  const clampedStart = Math.max(0, shimmerStart);
  // colPos 集合保存`0`，供后续判断或组装使用。
  let colPos = 0;
  // before 命名 `""`，让后续代码直接表达这个值的用途。
  let before = "";
  // shim 命名 `""`，让后续代码直接表达这个值的用途。
  let shim = "";
  // after固定为 `""`，作为终端 UI Glimmer Message后续展示或比较的基准。
  let after = "";
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[48] !== after || $[49] !== before || $[50] !== clampedStart || $[51] !== colPos || $[52] !== segments || $[53] !== shim || $[54] !== shimmerEnd) {
    // 调用 for，触发终端渲染此处需要的副作用。
    for (const {
      segment: segment_0,
      width
    } of segments) {
      // 满足 `colPos + width <= clampedStart` 时，终端渲染执行该分支。
      if (colPos + width <= clampedStart) {
        // before更新为 `before + segment_0`，确保终端 UI后续读取最新状态。
        before = before + segment_0;
      } else {
        // 满足 `colPos > shimmerEnd` 时，终端渲染执行该分支。
        if (colPos > shimmerEnd) {
          // after更新为 `after + segment_0`，确保终端 UI后续读取最新状态。
          after = after + segment_0;
        } else {
          // shim更新为 `shim + segment_0`，确保终端 UI后续读取最新状态。
          shim = shim + segment_0;
        }
      }
      // colPos 集合更新为 `colPos + width`，确保终端 UI后续读取最新状态。
      colPos = colPos + width;
    }
    // $[48] 缓存 `after`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = after;
    // $[49] 缓存 `before`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = before;
    // $[50] 缓存 `clampedStart`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = clampedStart;
    // $[51] 缓存 `colPos`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = colPos;
    // $[52] 缓存 `segments`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = segments;
    // $[53] 缓存 `shim`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = shim;
    // $[54] 缓存 `shimmerEnd`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = shimmerEnd;
    // $[55] 缓存 `before`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = before;
    // $[56] 缓存 `after`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = after;
    // $[57] 缓存 `shim`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = shim;
    // $[58] 缓存 `colPos`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = colPos;
  } else {
    // before更新为 `$[55]`，确保终端 UI后续读取最新状态。
    before = $[55];
    // after更新为 `$[56]`，确保终端 UI后续读取最新状态。
    after = $[56];
    // shim更新为 `$[57]`，确保终端 UI后续读取最新状态。
    shim = $[57];
    // colPos 集合更新为 `$[58]`，确保终端 UI后续读取最新状态。
    colPos = $[58];
  }
  // t3 暂存 `before && <Text color={messageColor}>{before}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[59] !== before || $[60] !== messageColor) {
    // t3 暂存 `before && <Text color={messageColor}>{before}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = before && <Text color={messageColor}>{before}</Text>;
    // $[59] 缓存 `before`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = before;
    // $[60] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = messageColor;
    // $[61] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[61] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[61];
  }
  // t4 暂存 `<Text color={shimmerColor}>{shim}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[62] !== shim || $[63] !== shimmerColor) {
    // t4 暂存 `<Text color={shimmerColor}>{shim}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text color={shimmerColor}>{shim}</Text>;
    // $[62] 缓存 `shim`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = shim;
    // $[63] 缓存 `shimmerColor`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = shimmerColor;
    // $[64] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[64] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[64];
  }
  // t5 暂存 `after && <Text color={messageColor}>{after}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[65] !== after || $[66] !== messageColor) {
    // t5 暂存 `after && <Text color={messageColor}>{after}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = after && <Text color={messageColor}>{after}</Text>;
    // $[65] 缓存 `after`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = after;
    // $[66] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = messageColor;
    // $[67] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[67] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[67];
  }
  // t6 暂存 `<Text color={messageColor}> </Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[68] !== messageColor) {
    // t6 暂存 `<Text color={messageColor}> </Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text color={messageColor}> </Text>;
    // $[68] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = messageColor;
    // $[69] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[69] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[69];
  }
  // t7 暂存 `<>{t3}{t4}{t5}{t6}</>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[70] !== t3 || $[71] !== t4 || $[72] !== t5 || $[73] !== t6) {
    // t7 暂存 `<>{t3}{t4}{t5}{t6}</>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <>{t3}{t4}{t5}{t6}</>;
    // $[70] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = t3;
    // $[71] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = t4;
    // $[72] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = t5;
    // $[73] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = t6;
    // $[74] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[74] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[74];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInN0cmluZ1dpZHRoIiwiVGV4dCIsInVzZVRoZW1lIiwiZ2V0R3JhcGhlbWVTZWdtZW50ZXIiLCJnZXRUaGVtZSIsIlRoZW1lIiwiU3Bpbm5lck1vZGUiLCJpbnRlcnBvbGF0ZUNvbG9yIiwicGFyc2VSR0IiLCJ0b1JHQkNvbG9yIiwiUHJvcHMiLCJtZXNzYWdlIiwibW9kZSIsIm1lc3NhZ2VDb2xvciIsImdsaW1tZXJJbmRleCIsImZsYXNoT3BhY2l0eSIsInNoaW1tZXJDb2xvciIsInN0YWxsZWRJbnRlbnNpdHkiLCJFUlJPUl9SRUQiLCJyIiwiZyIsImIiLCJHbGltbWVyTWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJ1bmRlZmluZWQiLCJ0aGVtZU5hbWUiLCJtZXNzYWdlV2lkdGgiLCJzZWdtZW50cyIsInQyIiwiU3ltYm9sIiwiZm9yIiwiYmIwIiwidGhlbWUiLCJzZWdzIiwic2VnbWVudCIsInB1c2giLCJ3aWR0aCIsInQzIiwidDQiLCJiYXNlQ29sb3JTdHIiLCJiYXNlUkdCIiwiaW50ZXJwb2xhdGVkIiwiY29sb3IiLCJ0NSIsImNvbG9yXzAiLCJ0NiIsInQ3IiwiYmFzZUNvbG9yU3RyXzAiLCJzaGltbWVyQ29sb3JTdHIiLCJiYXNlUkdCXzAiLCJzaGltbWVyUkdCIiwiaW50ZXJwb2xhdGVkXzAiLCJjb2xvcl8xIiwic2hpbW1lclN0YXJ0Iiwic2hpbW1lckVuZCIsImNsYW1wZWRTdGFydCIsIk1hdGgiLCJtYXgiLCJjb2xQb3MiLCJiZWZvcmUiLCJzaGltIiwiYWZ0ZXIiLCJzZWdtZW50XzAiXSwic291cmNlcyI6WyJHbGltbWVyTWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBzdHJpbmdXaWR0aCB9IGZyb20gJy4uLy4uL2luay9zdHJpbmdXaWR0aC5qcydcbmltcG9ydCB7IFRleHQsIHVzZVRoZW1lIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0R3JhcGhlbWVTZWdtZW50ZXIgfSBmcm9tICcuLi8uLi91dGlscy9pbnRsLmpzJ1xuaW1wb3J0IHsgZ2V0VGhlbWUsIHR5cGUgVGhlbWUgfSBmcm9tICcuLi8uLi91dGlscy90aGVtZS5qcydcbmltcG9ydCB0eXBlIHsgU3Bpbm5lck1vZGUgfSBmcm9tICcuL3R5cGVzLmpzJ1xuaW1wb3J0IHsgaW50ZXJwb2xhdGVDb2xvciwgcGFyc2VSR0IsIHRvUkdCQ29sb3IgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBtZXNzYWdlOiBzdHJpbmdcbiAgbW9kZTogU3Bpbm5lck1vZGVcbiAgbWVzc2FnZUNvbG9yOiBrZXlvZiBUaGVtZVxuICBnbGltbWVySW5kZXg6IG51bWJlclxuICBmbGFzaE9wYWNpdHk6IG51bWJlclxuICBzaGltbWVyQ29sb3I6IGtleW9mIFRoZW1lXG4gIHN0YWxsZWRJbnRlbnNpdHk/OiBudW1iZXJcbn1cblxuY29uc3QgRVJST1JfUkVEID0geyByOiAxNzEsIGc6IDQzLCBiOiA2MyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBHbGltbWVyTWVzc2FnZSh7XG4gIG1lc3NhZ2UsXG4gIG1vZGUsXG4gIG1lc3NhZ2VDb2xvcixcbiAgZ2xpbW1lckluZGV4LFxuICBmbGFzaE9wYWNpdHksXG4gIHNoaW1tZXJDb2xvcixcbiAgc3RhbGxlZEludGVuc2l0eSA9IDAsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZU5hbWVdID0gdXNlVGhlbWUoKVxuICBjb25zdCB0aGVtZSA9IGdldFRoZW1lKHRoZW1lTmFtZSlcblxuICAvLyBUaGlzIGNvbXBvbmVudCByZS1yZW5kZXJzIGF0IDIwZnBzIChnbGltbWVySW5kZXggY2hhbmdlcyBldmVyeSA1MG1zKSBidXRcbiAgLy8gbWVzc2FnZSBpcyBzdGFibGUgd2l0aGluIGEgdHVybi4gUHJlY29tcHV0ZSBncmFwaGVtZSBzZWdtZW50YXRpb24gKyB3aWR0aHNcbiAgLy8gb25jZSBwZXIgbWVzc2FnZSBpbnN0ZWFkIG9mIHBlciBmcmFtZS4gTWVhc3VyZWQgLTgxJSBvbiB0aGUgc2hpbW1lciBwYXRoLlxuICBjb25zdCB7IHNlZ21lbnRzLCBtZXNzYWdlV2lkdGggfSA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IHNlZ3M6IHsgc2VnbWVudDogc3RyaW5nOyB3aWR0aDogbnVtYmVyIH1bXSA9IFtdXG4gICAgZm9yIChjb25zdCB7IHNlZ21lbnQgfSBvZiBnZXRHcmFwaGVtZVNlZ21lbnRlcigpLnNlZ21lbnQobWVzc2FnZSkpIHtcbiAgICAgIHNlZ3MucHVzaCh7IHNlZ21lbnQsIHdpZHRoOiBzdHJpbmdXaWR0aChzZWdtZW50KSB9KVxuICAgIH1cbiAgICByZXR1cm4geyBzZWdtZW50czogc2VncywgbWVzc2FnZVdpZHRoOiBzdHJpbmdXaWR0aChtZXNzYWdlKSB9XG4gIH0sIFttZXNzYWdlXSlcblxuICBpZiAoIW1lc3NhZ2UpIHJldHVybiBudWxsXG5cbiAgLy8gV2hlbiBzdGFsbGVkLCBzaG93IHRleHQgdGhhdCBzbW9vdGhseSB0cmFuc2l0aW9ucyB0byByZWRcbiAgaWYgKHN0YWxsZWRJbnRlbnNpdHkgPiAwKSB7XG4gICAgY29uc3QgYmFzZUNvbG9yU3RyID0gdGhlbWVbbWVzc2FnZUNvbG9yXVxuICAgIGNvbnN0IGJhc2VSR0IgPSBiYXNlQ29sb3JTdHIgPyBwYXJzZVJHQihiYXNlQ29sb3JTdHIpIDogbnVsbFxuXG4gICAgaWYgKGJhc2VSR0IpIHtcbiAgICAgIGNvbnN0IGludGVycG9sYXRlZCA9IGludGVycG9sYXRlQ29sb3IoXG4gICAgICAgIGJhc2VSR0IsXG4gICAgICAgIEVSUk9SX1JFRCxcbiAgICAgICAgc3RhbGxlZEludGVuc2l0eSxcbiAgICAgIClcbiAgICAgIGNvbnN0IGNvbG9yID0gdG9SR0JDb2xvcihpbnRlcnBvbGF0ZWQpXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPXtjb2xvcn0+e21lc3NhZ2V9PC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPXtjb2xvcn0+IDwvVGV4dD5cbiAgICAgICAgPC8+XG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgZm9yIEFOU0kgdGhlbWVzOiB1c2UgbWVzc2FnZUNvbG9yIHVudGlsIGZ1bGx5IHN0YWxsZWQsIHRoZW4gZXJyb3JcbiAgICBjb25zdCBjb2xvciA9IHN0YWxsZWRJbnRlbnNpdHkgPiAwLjUgPyAnZXJyb3InIDogbWVzc2FnZUNvbG9yXG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtjb2xvcn0+e21lc3NhZ2V9PC9UZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj17Y29sb3J9PiA8L1RleHQ+XG4gICAgICA8Lz5cbiAgICApXG4gIH1cblxuICAvLyB0b29sLXVzZSBtb2RlOiBhbGwgY2hhcnMgZmxhc2ggd2l0aCB0aGUgc2FtZSBvcGFjaXR5LCBzbyByZW5kZXIgYXMgYVxuICAvLyBzaW5nbGUgPFRleHQ+IGluc3RlYWQgb2YgTiBpbmRpdmlkdWFsIEZsYXNoaW5nQ2hhciBjb21wb25lbnRzLlxuICBpZiAobW9kZSA9PT0gJ3Rvb2wtdXNlJykge1xuICAgIGNvbnN0IGJhc2VDb2xvclN0ciA9IHRoZW1lW21lc3NhZ2VDb2xvcl1cbiAgICBjb25zdCBzaGltbWVyQ29sb3JTdHIgPSB0aGVtZVtzaGltbWVyQ29sb3JdXG4gICAgY29uc3QgYmFzZVJHQiA9IGJhc2VDb2xvclN0ciA/IHBhcnNlUkdCKGJhc2VDb2xvclN0cikgOiBudWxsXG4gICAgY29uc3Qgc2hpbW1lclJHQiA9IHNoaW1tZXJDb2xvclN0ciA/IHBhcnNlUkdCKHNoaW1tZXJDb2xvclN0cikgOiBudWxsXG5cbiAgICBpZiAoYmFzZVJHQiAmJiBzaGltbWVyUkdCKSB7XG4gICAgICBjb25zdCBpbnRlcnBvbGF0ZWQgPSBpbnRlcnBvbGF0ZUNvbG9yKGJhc2VSR0IsIHNoaW1tZXJSR0IsIGZsYXNoT3BhY2l0eSlcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPFRleHQgY29sb3I9e3RvUkdCQ29sb3IoaW50ZXJwb2xhdGVkKX0+e21lc3NhZ2V9PC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPXttZXNzYWdlQ29sb3J9PiA8L1RleHQ+XG4gICAgICAgIDwvPlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGNvbG9yID0gZmxhc2hPcGFjaXR5ID4gMC41ID8gc2hpbW1lckNvbG9yIDogbWVzc2FnZUNvbG9yXG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtjb2xvcn0+e21lc3NhZ2V9PC9UZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj17bWVzc2FnZUNvbG9yfT4gPC9UZXh0PlxuICAgICAgPC8+XG4gICAgKVxuICB9XG5cbiAgLy8gU2hpbW1lciBtb2RlOiBvbmx5IGNoYXJzIHdpdGhpbiDCsTEgb2YgZ2xpbW1lckluZGV4IG5lZWQgdGhlIHNoaW1tZXJcbiAgLy8gY29sb3IuIFdoZW4gZ2xpbW1lciBpcyBvZmZzY3JlZW4sIHJlbmRlciBhcyBhIHNpbmdsZSA8VGV4dD4uXG4gIGNvbnN0IHNoaW1tZXJTdGFydCA9IGdsaW1tZXJJbmRleCAtIDFcbiAgY29uc3Qgc2hpbW1lckVuZCA9IGdsaW1tZXJJbmRleCArIDFcblxuICBpZiAoc2hpbW1lclN0YXJ0ID49IG1lc3NhZ2VXaWR0aCB8fCBzaGltbWVyRW5kIDwgMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8PlxuICAgICAgICA8VGV4dCBjb2xvcj17bWVzc2FnZUNvbG9yfT57bWVzc2FnZX08L1RleHQ+XG4gICAgICAgIDxUZXh0IGNvbG9yPXttZXNzYWdlQ29sb3J9PiA8L1RleHQ+XG4gICAgICA8Lz5cbiAgICApXG4gIH1cblxuICAvLyBTcGxpdCBpbnRvIGF0IG1vc3QgMyBzZWdtZW50cyBieSB2aXN1YWwgY29sdW1uIHBvc2l0aW9uXG4gIGNvbnN0IGNsYW1wZWRTdGFydCA9IE1hdGgubWF4KDAsIHNoaW1tZXJTdGFydClcbiAgbGV0IGNvbFBvcyA9IDBcbiAgbGV0IGJlZm9yZSA9ICcnXG4gIGxldCBzaGltID0gJydcbiAgbGV0IGFmdGVyID0gJydcbiAgZm9yIChjb25zdCB7IHNlZ21lbnQsIHdpZHRoIH0gb2Ygc2VnbWVudHMpIHtcbiAgICBpZiAoY29sUG9zICsgd2lkdGggPD0gY2xhbXBlZFN0YXJ0KSB7XG4gICAgICBiZWZvcmUgKz0gc2VnbWVudFxuICAgIH0gZWxzZSBpZiAoY29sUG9zID4gc2hpbW1lckVuZCkge1xuICAgICAgYWZ0ZXIgKz0gc2VnbWVudFxuICAgIH0gZWxzZSB7XG4gICAgICBzaGltICs9IHNlZ21lbnRcbiAgICB9XG4gICAgY29sUG9zICs9IHdpZHRoXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICB7YmVmb3JlICYmIDxUZXh0IGNvbG9yPXttZXNzYWdlQ29sb3J9PntiZWZvcmV9PC9UZXh0Pn1cbiAgICAgIDxUZXh0IGNvbG9yPXtzaGltbWVyQ29sb3J9PntzaGltfTwvVGV4dD5cbiAgICAgIHthZnRlciAmJiA8VGV4dCBjb2xvcj17bWVzc2FnZUNvbG9yfT57YWZ0ZXJ9PC9UZXh0Pn1cbiAgICAgIDxUZXh0IGNvbG9yPXttZXNzYWdlQ29sb3J9PiA8L1RleHQ+XG4gICAgPC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsV0FBVyxRQUFRLDBCQUEwQjtBQUN0RCxTQUFTQyxJQUFJLEVBQUVDLFFBQVEsUUFBUSxjQUFjO0FBQzdDLFNBQVNDLG9CQUFvQixRQUFRLHFCQUFxQjtBQUMxRCxTQUFTQyxRQUFRLEVBQUUsS0FBS0MsS0FBSyxRQUFRLHNCQUFzQjtBQUMzRCxjQUFjQyxXQUFXLFFBQVEsWUFBWTtBQUM3QyxTQUFTQyxnQkFBZ0IsRUFBRUMsUUFBUSxFQUFFQyxVQUFVLFFBQVEsWUFBWTtBQUVuRSxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsT0FBTyxFQUFFLE1B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
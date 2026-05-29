// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 Link 终端界面组件，避免在这里重复拼装显示逻辑。
import Link from './components/Link.js';
// 复用 Text 终端界面组件，避免在这里重复拼装显示逻辑。
import Text from './components/Text.js';
// 类型依赖 { Color } 来自 ./styles.js，用于校准终端渲染的数据契约。
import type { Color } from './styles.js';
// 引入 NamedColor、Parser、Color as TermioColor、TextStyle，将 ./termio.js 中已经封装好的能力接到本文件流程里。
import { type NamedColor, Parser, type Color as TermioColor, type TextStyle } from './termio.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  children: string;
  /** When true, force all text to be rendered with dim styling */
  dimColor?: boolean;
};
// SpanProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type SpanProps = {
  color?: Color;
  backgroundColor?: Color;
  dim?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  inverse?: boolean;
  hyperlink?: string;
};

/**
 * Component that parses ANSI escape codes and renders them using Text components.
 *
 * Use this as an escape hatch when you have pre-formatted ANSI strings from
 * external tools (like cli-highlight) that need to be rendered in Ink.
 *
 * Memoized to prevent re-renders when parent changes but children string is the same.
 */
// Ansi保存`React.memo`，供终端渲染后续处理使用。
export const Ansi = React.memo(function Ansi(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(12);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children,
    dimColor
  } = t0;
  // `typeof children` 与 `"string"` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof children !== "string") {
    // t1 暂存 `dimColor ? <Text dim={true}>{String(children)}</Text> : <...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== children || $[1] !== dimColor) {
      // t1 暂存 `dimColor ? <Text dim={true}>{String(children)}</Text> : <...` 生成的渲染片段，后续返回路径直接复用。
      t1 = dimColor ? <Text dim={true}>{String(children)}</Text> : <Text>{String(children)}</Text>;
      // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = children;
      // $[1] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = dimColor;
      // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[2];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 满足 `children === ""` 时，终端渲染执行该分支。
  if (children === "") {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // t2 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== children || $[4] !== dimColor) {
    // t2 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t2 = Symbol.for("react.early_return_sentinel");
    // Ink 渲染层 Ansi在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // spans 集合解析`parseToSpans`，供终端渲染后续处理使用。
      const spans = parseToSpans(children);
      // spans 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
      if (spans.length === 0) {
        // t2 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t2 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 只有 `spans.length === 1 && !hasAnyProps(spans[0].props)` 满足时，终端渲染才执行该分支。
      if (spans.length === 1 && !hasAnyProps(spans[0].props)) {
        // t2 暂存 `dimColor ? <Text dim={true}>{spans[0].text}</Text> : <Tex...` 生成的渲染片段，后续返回路径直接复用。
        t2 = dimColor ? <Text dim={true}>{spans[0].text}</Text> : <Text>{spans[0].text}</Text>;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // t3 暂存 `(span, i) => {` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[7] !== dimColor) {
        // t3 暂存 `(span, i) => {` 生成的渲染片段，后续返回路径直接复用。
        t3 = (span, i) => {
          // hyperlink保存`span.props.hyperlink`，供后续判断或组装使用。
          const hyperlink = span.props.hyperlink;
          // 满足 `dimColor` 时，终端渲染执行该分支。
          if (dimColor) {
            // dim更新为 `true`，确保Ink 渲染层后续读取最新状态。
            span.props.dim = true;
          }
          // hasTextProps 集合记录 `hasAnyTextProps` 是否成立，终端渲染随后按该结果分支。
          const hasTextProps = hasAnyTextProps(span.props);
          // 满足 `hyperlink` 时，终端渲染执行该分支。
          if (hyperlink) {
            // 返回 `hasTextProps ? <Link key={i} url={hyperlink}><StyledText color={span.pr...`，作为终端渲染这次计算的结果。
            return hasTextProps ? <Link key={i} url={hyperlink}><StyledText color={span.props.color} backgroundColor={span.props.backgroundColor} dim={span.props.dim} bold={span.props.bold} italic={span.props.italic} underline={span.props.underline} strikethrough={span.props.strikethrough} inverse={span.props.inverse}>{span.text}</StyledText></Link> : <Link key={i} url={hyperlink}>{span.text}</Link>;
          }
          // 返回 `hasTextProps ? <StyledText key={i} color={span.props.color} backgroundC...`，作为终端渲染这次计算的结果。
          return hasTextProps ? <StyledText key={i} color={span.props.color} backgroundColor={span.props.backgroundColor} dim={span.props.dim} bold={span.props.bold} italic={span.props.italic} underline={span.props.underline} strikethrough={span.props.strikethrough} inverse={span.props.inverse}>{span.text}</StyledText> : span.text;
        };
        // $[7] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
        $[7] = dimColor;
        // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[8] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[8];
      }
      // t1 暂存 `spans.map(t3)` 生成的渲染片段，后续返回路径直接复用。
      t1 = spans.map(t3);
    }
    // $[3] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = children;
    // $[4] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = dimColor;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // `t2` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 文本内容 命名 `t1`，让后续代码直接表达这个值的用途。
  const content = t1;
  // t3 暂存 `dimColor ? <Text dim={true}>{content}</Text> : <Text>{con...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== content || $[10] !== dimColor) {
    // t3 暂存 `dimColor ? <Text dim={true}>{content}</Text> : <Text>{con...` 生成的渲染片段，后续返回路径直接复用。
    t3 = dimColor ? <Text dim={true}>{content}</Text> : <Text>{content}</Text>;
    // $[9] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = content;
    // $[10] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = dimColor;
    // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[11];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
});
// Span 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Span = {
  text: string;
  props: SpanProps;
};

/**
 * Parse an ANSI string into spans using the termio parser.
 */
// parseToSpans 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseToSpans(input: string): Span[] {
  // parser保存`Parser`，供终端渲染后续处理使用。
  const parser = new Parser();
  // actions 集合解析`parser.feed`，供终端渲染后续处理使用。
  const actions = parser.feed(input);
  // spans 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const spans: Span[] = [];
  // currentHyperlink 先占位，稍后的条件分支会根据实际输入补齐它。
  let currentHyperlink: string | undefined;
  // 按顺序遍历 `actions` 中的action，逐个交给终端渲染处理。
  for (const action of actions) {
    // 当 `action.type` 匹配 `'link'` 时，终端渲染执行对应分支。
    if (action.type === 'link') {
      // 当 `action.action.type` 匹配 `'start'` 时，终端渲染执行对应分支。
      if (action.action.type === 'start') {
        // currentHyperlink更新为 `action.action.url`，确保Ink 渲染层后续读取最新状态。
        currentHyperlink = action.action.url;
      } else {
        // currentHyperlink更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
        currentHyperlink = undefined;
      }
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue;
    }
    // 当 `action.type` 匹配 `'text'` 时，终端渲染执行对应分支。
    if (action.type === 'text') {
      // 文本派生`graphemes.map`，供终端渲染后续处理使用。
      const text = action.graphemes.map(g => g.value).join('');
      // 文本缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!text) continue;
      // 组件属性保存`textStyleToSpanProps`，供终端渲染后续处理使用。
      const props = textStyleToSpanProps(action.style);
      // 满足 `currentHyperlink` 时，终端渲染执行该分支。
      if (currentHyperlink) {
        // hyperlink更新为 `currentHyperlink`，确保Ink 渲染层后续读取最新状态。
        props.hyperlink = currentHyperlink;
      }

      // Try to merge with previous span if props match
      // lastSpan保存 `spans[spans.length - 1]` 的判断结果，供Ink 渲染层 Ansi后续分支直接复用。
      const lastSpan = spans[spans.length - 1];
      // 只有 `lastSpan && propsEqual(lastSpan.props, props)` 满足时，终端渲染才执行该分支。
      if (lastSpan && propsEqual(lastSpan.props, props)) {
        // Ink 渲染层 Ansi在这里处理 `lastSpan.text += text`，完成这一小步状态转换。
        lastSpan.text += text;
      } else {
        // spans 集合追加新条目，保持收集顺序与输入顺序一致。
        spans.push({
          text,
          props
        });
      }
    }
  }
  // 返回 `spans`，作为终端渲染这次计算的结果。
  return spans;
}

/**
 * Convert termio's TextStyle to SpanProps.
 */
// textStyleToSpanProps 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function textStyleToSpanProps(style: TextStyle): SpanProps {
  // 组件属性 从空对象开始收集键值，后续按名称补齐内容。
  const props: SpanProps = {};
  // 满足 `style.bold` 时，终端渲染执行该分支。
  if (style.bold) props.bold = true;
  // 满足 `style.dim` 时，终端渲染执行该分支。
  if (style.dim) props.dim = true;
  // 满足 `style.italic` 时，终端渲染执行该分支。
  if (style.italic) props.italic = true;
  // `style.underline` 与 `'none'` 不一致时刷新派生状态，避免使用过期结果。
  if (style.underline !== 'none') props.underline = true;
  // 满足 `style.strikethrough` 时，终端渲染执行该分支。
  if (style.strikethrough) props.strikethrough = true;
  // 满足 `style.inverse` 时，终端渲染执行该分支。
  if (style.inverse) props.inverse = true;
  // fgColor保存`colorToString`，供终端渲染后续处理使用。
  const fgColor = colorToString(style.fg);
  // 满足 `fgColor` 时，终端渲染执行该分支。
  if (fgColor) props.color = fgColor;
  // bgColor保存`colorToString`，供终端渲染后续处理使用。
  const bgColor = colorToString(style.bg);
  // 满足 `bgColor` 时，终端渲染执行该分支。
  if (bgColor) props.backgroundColor = bgColor;
  // 返回 `props`，作为终端渲染这次计算的结果。
  return props;
}

// Map termio named colors to the ansi: format
// NAMED_COLOR_MAP 集中保存Ink 渲染层 Ansi要一起传递的字段。
const NAMED_COLOR_MAP: Record<NamedColor, string> = {
  black: 'ansi:black',
  red: 'ansi:red',
  green: 'ansi:green',
  yellow: 'ansi:yellow',
  blue: 'ansi:blue',
  magenta: 'ansi:magenta',
  cyan: 'ansi:cyan',
  white: 'ansi:white',
  brightBlack: 'ansi:blackBright',
  brightRed: 'ansi:redBright',
  brightGreen: 'ansi:greenBright',
  brightYellow: 'ansi:yellowBright',
  brightBlue: 'ansi:blueBright',
  brightMagenta: 'ansi:magentaBright',
  brightCyan: 'ansi:cyanBright',
  brightWhite: 'ansi:whiteBright'
};

/**
 * Convert termio's Color to the string format used by Ink.
 */
// colorToString 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function colorToString(color: TermioColor): Color | undefined {
  // 按照 color.type 的取值选择终端渲染的具体处理分支。
  switch (color.type) {
    case 'named':
      // 返回 `NAMED_COLOR_MAP[color.name] as Color`，作为终端渲染这次计算的结果。
      return NAMED_COLOR_MAP[color.name] as Color;
    case 'indexed':
      // 返回 ``ansi256(${color.index})` as Color`，作为终端渲染这次计算的结果。
      return `ansi256(${color.index})` as Color;
    case 'rgb':
      // 返回 ``rgb(${color.r},${color.g},${color.b})` as Color`，作为终端渲染这次计算的结果。
      return `rgb(${color.r},${color.g},${color.b})` as Color;
    case 'default':
      // 返回 `undefined`，作为终端渲染这次计算的结果。
      return undefined;
  }
}

/**
 * Check if two SpanProps are equal for merging.
 */
// propsEqual 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function propsEqual(a: SpanProps, b: SpanProps): boolean {
  // 返回 `a.color === b.color && a.backgroundColor === b.backgroundColor && a.bol...`，作为终端渲染这次计算的结果。
  return a.color === b.color && a.backgroundColor === b.backgroundColor && a.bold === b.bold && a.dim === b.dim && a.italic === b.italic && a.underline === b.underline && a.strikethrough === b.strikethrough && a.inverse === b.inverse && a.hyperlink === b.hyperlink;
}
// hasAnyProps 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasAnyProps(props: SpanProps): boolean {
  // 返回 `props.color !== undefined || props.backgroundColor !== undefined || pro...`，作为终端渲染这次计算的结果。
  return props.color !== undefined || props.backgroundColor !== undefined || props.dim === true || props.bold === true || props.italic === true || props.underline === true || props.strikethrough === true || props.inverse === true || props.hyperlink !== undefined;
}
// hasAnyTextProps 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasAnyTextProps(props: SpanProps): boolean {
  // 返回 `props.color !== undefined || props.backgroundColor !== undefined || pro...`，作为终端渲染这次计算的结果。
  return props.color !== undefined || props.backgroundColor !== undefined || props.dim === true || props.bold === true || props.italic === true || props.underline === true || props.strikethrough === true || props.inverse === true;
}

// Text style props without weight (bold/dim) - these are handled separately
// BaseTextStyleProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type BaseTextStyleProps = {
  color?: Color;
  backgroundColor?: Color;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  inverse?: boolean;
};

// Wrapper component that handles bold/dim mutual exclusivity for Text
// StyledText 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function StyledText(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // bold 先占位，稍后的条件分支会根据实际输入补齐它。
  let bold;
  // 子节点 先占位，稍后的条件分支会根据实际输入补齐它。
  let children;
  // dim 先占位，稍后的条件分支会根据实际输入补齐它。
  let dim;
  // rest 先占位，稍后的条件分支会根据实际输入补齐它。
  let rest;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // 重新解构输入对象，把Ink 渲染层 Ansi需要的字段同步到本地变量。
    ({
      bold,
      dim,
      children,
      ...rest
    } = t0);
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `bold`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = bold;
    // $[2] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = children;
    // $[3] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = dim;
    // $[4] 缓存 `rest`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = rest;
  } else {
    // bold更新为 `$[1]`，确保Ink 渲染层后续读取最新状态。
    bold = $[1];
    // 子节点更新为 `$[2]`，确保Ink 渲染层后续读取最新状态。
    children = $[2];
    // dim更新为 `$[3]`，确保Ink 渲染层后续读取最新状态。
    dim = $[3];
    // rest更新为 `$[4]`，确保Ink 渲染层后续读取最新状态。
    rest = $[4];
  }
  // 满足 `dim` 时，终端渲染执行该分支。
  if (dim) {
    // t1 暂存 `<Text {...rest} dim={true}>{children}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== children || $[6] !== rest) {
      // t1 暂存 `<Text {...rest} dim={true}>{children}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text {...rest} dim={true}>{children}</Text>;
      // $[5] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = children;
      // $[6] 缓存 `rest`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = rest;
      // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[7];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 满足 `bold` 时，终端渲染执行该分支。
  if (bold) {
    // t1 暂存 `<Text {...rest} bold={true}>{children}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[8] !== children || $[9] !== rest) {
      // t1 暂存 `<Text {...rest} bold={true}>{children}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text {...rest} bold={true}>{children}</Text>;
      // $[8] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = children;
      // $[9] 缓存 `rest`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = rest;
      // $[10] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[10];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `<Text {...rest}>{children}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== children || $[12] !== rest) {
    // t1 暂存 `<Text {...rest}>{children}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text {...rest}>{children}</Text>;
    // $[11] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = children;
    // $[12] 缓存 `rest`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = rest;
    // $[13] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[13];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkxpbmsiLCJUZXh0IiwiQ29sb3IiLCJOYW1lZENvbG9yIiwiUGFyc2VyIiwiVGVybWlvQ29sb3IiLCJUZXh0U3R5bGUiLCJQcm9wcyIsImNoaWxkcmVuIiwiZGltQ29sb3IiLCJTcGFuUHJvcHMiLCJjb2xvciIsImJhY2tncm91bmRDb2xvciIsImRpbSIsImJvbGQiLCJpdGFsaWMiLCJ1bmRlcmxpbmUiLCJzdHJpa2V0aHJvdWdoIiwiaW52ZXJzZSIsImh5cGVybGluayIsIkFuc2kiLCJtZW1vIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN0cmluZyIsInQyIiwiU3ltYm9sIiwiZm9yIiwiYmIwIiwic3BhbnMiLCJwYXJzZVRvU3BhbnMiLCJsZW5ndGgiLCJoYXNBbnlQcm9wcyIsInByb3BzIiwidGV4dCIsInQzIiwic3BhbiIsImkiLCJoYXNUZXh0UHJvcHMiLCJoYXNBbnlUZXh0UHJvcHMiLCJtYXAiLCJjb250ZW50IiwiU3BhbiIsImlucHV0IiwicGFyc2VyIiwiYWN0aW9ucyIsImZlZWQiLCJjdXJyZW50SHlwZXJsaW5rIiwiYWN0aW9uIiwidHlwZSIsInVybCIsInVuZGVmaW5lZCIsImdyYXBoZW1lcyIsImciLCJ2YWx1ZSIsImpvaW4iLCJ0ZXh0U3R5bGVUb1NwYW5Qcm9wcyIsInN0eWxlIiwibGFzdFNwYW4iLCJwcm9wc0VxdWFsIiwicHVzaCIsImZnQ29sb3IiLCJjb2xvclRvU3RyaW5nIiwiZmciLCJiZ0NvbG9yIiwiYmciLCJOQU1FRF9DT0xPUl9NQVAiLCJSZWNvcmQiLCJibGFjayIsInJlZCIsImdyZWVuIiwieWVsbG93IiwiYmx1ZSIsIm1hZ2VudGEiLCJjeWFuIiwid2hpdGUiLCJicmlnaHRCbGFjayIsImJyaWdodFJlZCIsImJyaWdodEdyZWVuIiwiYnJpZ2h0WWVsbG93IiwiYnJpZ2h0Qmx1ZSIsImJyaWdodE1hZ2VudGEiLCJicmlnaHRDeWFuIiwiYnJpZ2h0V2hpdGUiLCJuYW1lIiwiaW5kZXgiLCJyIiwiYiIsImEiLCJCYXNlVGV4dFN0eWxlUHJvcHMiLCJTdHlsZWRUZXh0IiwicmVzdCJdLCJzb3VyY2VzIjpbIkFuc2kudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCBMaW5rIGZyb20gJy4vY29tcG9uZW50cy9MaW5rLmpzJ1xuaW1wb3J0IFRleHQgZnJvbSAnLi9jb21wb25lbnRzL1RleHQuanMnXG5pbXBvcnQgdHlwZSB7IENvbG9yIH0gZnJvbSAnLi9zdHlsZXMuanMnXG5pbXBvcnQge1xuICB0eXBlIE5hbWVkQ29sb3IsXG4gIFBhcnNlcixcbiAgdHlwZSBDb2xvciBhcyBUZXJtaW9Db2xvcixcbiAgdHlwZSBUZXh0U3R5bGUsXG59IGZyb20gJy4vdGVybWlvLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBjaGlsZHJlbjogc3RyaW5nXG4gIC8qKiBXaGVuIHRydWUsIGZvcmNlIGFsbCB0ZXh0IHRvIGJlIHJlbmRlcmVkIHdpdGggZGltIHN0eWxpbmcgKi9cbiAgZGltQ29sb3I/OiBib29sZWFuXG59XG5cbnR5cGUgU3BhblByb3BzID0ge1xuICBjb2xvcj86IENvbG9yXG4gIGJhY2tncm91bmRDb2xvcj86IENvbG9yXG4gIGRpbT86IGJvb2xlYW5cbiAgYm9sZD86IGJvb2xlYW5cbiAgaXRhbGljPzogYm9vbGVhblxuICB1bmRlcmxpbmU/OiBib29sZWFuXG4gIHN0cmlrZXRocm91Z2g/OiBib29sZWFuXG4gIGludmVyc2U/OiBib29sZWFuXG4gIGh5cGVybGluaz86IHN0cmluZ1xufVxuXG4vKipcbiAqIENvbXBvbmVudCB0aGF0IHBhcnNlcyBBTlNJIGVzY2FwZSBjb2RlcyBhbmQgcmVuZGVycyB0aGVtIHVzaW5nIFRleHQgY29tcG9uZW50cy5cbiAqXG4gKiBVc2UgdGhpcyBhcyBhbiBlc2NhcGUgaGF0Y2ggd2hlbiB5b3UgaGF2ZSBwcmUtZm9ybWF0dGVkIEFOU0kgc3RyaW5ncyBmcm9tXG4gKiBleHRlcm5hbCB0b29scyAobGlrZSBjbGktaGlnaGxpZ2h0KSB0aGF0IG5lZWQgdG8gYmUgcmVuZGVyZWQgaW4gSW5rLlxuICpcbiAqIE1lbW9pemVkIHRvIHByZXZlbnQgcmUtcmVuZGVycyB3aGVuIHBhcmVudCBjaGFuZ2VzIGJ1dCBjaGlsZHJlbiBzdHJpbmcgaXMgdGhlIHNhbWUuXG4gKi9cbmV4cG9ydCBjb25zdCBBbnNpID0gUmVhY3QubWVtbyhmdW5jdGlvbiBBbnNpKHtcbiAgY2hpbGRyZW4sXG4gIGRpbUNvbG9yLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAodHlwZW9mIGNoaWxkcmVuICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBkaW1Db2xvciA/IChcbiAgICAgIDxUZXh0IGRpbT57U3RyaW5nKGNoaWxkcmVuKX08L1RleHQ+XG4gICAgKSA6IChcbiAgICAgIDxUZXh0PntTdHJpbmcoY2hpbGRyZW4pfTwvVGV4dD5cbiAgICApXG4gIH1cblxuICBpZiAoY2hpbGRyZW4gPT09ICcnKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IHNwYW5zID0gcGFyc2VUb1NwYW5zKGNoaWxkcmVuKVxuXG4gIGlmIChzcGFucy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKHNwYW5zLmxlbmd0aCA9PT0gMSAmJiAhaGFzQW55UHJvcHMoc3BhbnNbMF0hLnByb3BzKSkge1xuICAgIHJldHVybiBkaW1Db2xvciA/IChcbiAgICAgIDxUZXh0IGRpbT57c3BhbnNbMF0hLnRleHR9PC9UZXh0PlxuICAgICkgOiAoXG4gICAgICA8VGV4dD57c3BhbnNbMF0hLnRleHR9PC9UZXh0PlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBzcGFucy5tYXAoKHNwYW4sIGkpID0+IHtcbiAgICBjb25zdCBoeXBlcmxpbmsgPSBzcGFuLnByb3BzLmh5cGVybGlua1xuICAgIC8vIFdoZW4gZGltQ29sb3IgaXMgZm9yY2VkLCBvdmVycmlkZSB0aGUgc3BhbidzIGRpbSBwcm9wXG4gICAgaWYgKGRpbUNvbG9yKSB7XG4gICAgICBzcGFuLnByb3BzLmRpbSA9IHRydWVcbiAgICB9XG4gICAgY29uc3QgaGFzVGV4dFByb3BzID0gaGFzQW55VGV4dFByb3BzKHNwYW4ucHJvcHMpXG5cbiAgICBpZiAoaHlwZXJsaW5rKSB7XG4gICAgICByZXR1cm4gaGFzVGV4dFByb3BzID8gKFxuICAgICAgICA8TGluayBrZXk9e2l9IHVybD17aHlwZXJsaW5rfT5cbiAgICAgICAgICA8U3R5bGVkVGV4dFxuICAgICAgICAgICAgY29sb3I9e3NwYW4ucHJvcHMuY29sb3J9XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I9e3NwYW4ucHJvcHMuYmFja2dyb3VuZENvbG9yfVxuICAgICAgICAgICAgZGltPXtzcGFuLnByb3BzLmRpbX1cbiAgICAgICAgICAgIGJvbGQ9e3NwYW4ucHJvcHMuYm9sZH1cbiAgICAgICAgICAgIGl0YWxpYz17c3Bhbi5wcm9wcy5pdGFsaWN9XG4gICAgICAgICAgICB1bmRlcmxpbmU9e3NwYW4ucHJvcHMudW5kZXJsaW5lfVxuICAgICAgICAgICAgc3RyaWtldGhyb3VnaD17c3Bhbi5wcm9wcy5zdHJpa2V0aHJvdWdofVxuICAgICAgICAgICAgaW52ZXJzZT17c3Bhbi5wcm9wcy5pbnZlcnNlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtzcGFuLnRleHR9XG4gICAgICAgICAgPC9TdHlsZWRUZXh0PlxuICAgICAgICA8L0xpbms+XG4gICAgICApIDogKFxuICAgICAgICA8TGluayBrZXk9e2l9IHVybD17aHlwZXJsaW5rfT5cbiAgICAgICAgICB7c3Bhbi50ZXh0fVxuICAgICAgICA8L0xpbms+XG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIGhhc1RleHRQcm9wcyA/IChcbiAgICAgIDxTdHlsZWRUZXh0XG4gICAgICAgIGtleT17aX1cbiAgICAgICAgY29sb3I9e3NwYW4ucHJvcHMuY29sb3J9XG4gICAgICAgIGJhY2tncm91bmRDb2xvcj17c3Bhbi5wcm9wcy5iYWNrZ3JvdW5kQ29sb3J9XG4gICAgICAgIGRpbT17c3Bhbi5wcm9wcy5kaW19XG4gICAgICAgIGJvbGQ9e3NwYW4ucHJvcHMuYm9sZH1cbiAgICAgICAgaXRhbGljPXtzcGFuLnByb3BzLml0YWxpY31cbiAgICAgICAgdW5kZXJsaW5lPXtzcGFuLnByb3BzLnVuZGVybGluZX1cbiAgICAgICAgc3RyaWtldGhyb3VnaD17c3Bhbi5wcm9wcy5zdHJpa2V0aHJvdWdofVxuICAgICAgICBpbnZlcnNlPXtzcGFuLnByb3BzLmludmVyc2V9XG4gICAgICA+XG4gICAgICAgIHtzcGFuLnRleHR9XG4gICAgICA8L1N0eWxlZFRleHQ+XG4gICAgKSA6IChcbiAgICAgIHNwYW4udGV4dFxuICAgIClcbiAgfSlcblxuICByZXR1cm4gZGltQ29sb3IgPyA8VGV4dCBkaW0+e2NvbnRlbnR9PC9UZXh0PiA6IDxUZXh0Pntjb250ZW50fTwvVGV4dD5cbn0pXG5cbnR5cGUgU3BhbiA9IHtcbiAgdGV4dDogc3RyaW5nXG4gIHByb3BzOiBTcGFuUHJvcHNcbn1cblxuLyoqXG4gKiBQYXJzZSBhbiBBTlNJIHN0cmluZyBpbnRvIHNwYW5zIHVzaW5nIHRoZSB0ZXJtaW8gcGFyc2VyLlxuICovXG5mdW5jdGlvbiBwYXJzZVRvU3BhbnMoaW5wdXQ6IHN0cmluZyk6IFNwYW5bXSB7XG4gIGNvbnN0IHBhcnNlciA9IG5ldyBQYXJzZXIoKVxuICBjb25zdCBhY3Rpb25zID0gcGFyc2VyLmZlZWQoaW5wdXQpXG4gIGNvbnN0IHNwYW5zOiBTcGFuW10gPSBbXVxuXG4gIGxldCBjdXJyZW50SHlwZXJsaW5rOiBzdHJpbmcgfCB1bmRlZmluZWRcblxuICBmb3IgKGNvbnN0IGFjdGlvbiBvZiBhY3Rpb25zKSB7XG4gICAgaWYgKGFjdGlvbi50eXBlID09PSAnbGluaycpIHtcbiAgICAgIGlmIChhY3Rpb24uYWN0aW9uLnR5cGUgPT09ICdzdGFydCcpIHtcbiAgICAgICAgY3VycmVudEh5cGVybGluayA9IGFjdGlvbi5hY3Rpb24udXJsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyZW50SHlwZXJsaW5rID0gdW5kZWZpbmVkXG4gICAgICB9XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmIChhY3Rpb24udHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYWN0aW9uLmdyYXBoZW1lcy5tYXAoZyA9PiBnLnZhbHVlKS5qb2luKCcnKVxuICAgICAgaWYgKCF0ZXh0KSBjb250aW51ZVxuXG4gICAgICBjb25zdCBwcm9wcyA9IHRleHRTdHlsZVRvU3BhblByb3BzKGFjdGlvbi5zdHlsZSlcbiAgICAgIGlmIChjdXJyZW50SHlwZXJsaW5rKSB7XG4gICAgICAgIHByb3BzLmh5cGVybGluayA9IGN1cnJlbnRIeXBlcmxpbmtcbiAgICAgIH1cblxuICAgICAgLy8gVHJ5IHRvIG1lcmdlIHdpdGggcHJldmlvdXMgc3BhbiBpZiBwcm9wcyBtYXRjaFxuICAgICAgY29uc3QgbGFzdFNwYW4gPSBzcGFuc1tzcGFucy5sZW5ndGggLSAxXVxuICAgICAgaWYgKGxhc3RTcGFuICYmIHByb3BzRXF1YWwobGFzdFNwYW4ucHJvcHMsIHByb3BzKSkge1xuICAgICAgICBsYXN0U3Bhbi50ZXh0ICs9IHRleHRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwYW5zLnB1c2goeyB0ZXh0LCBwcm9wcyB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzcGFuc1xufVxuXG4vKipcbiAqIENvbnZlcnQgdGVybWlvJ3MgVGV4dFN0eWxlIHRvIFNwYW5Qcm9wcy5cbiAqL1xuZnVuY3Rpb24gdGV4dFN0eWxlVG9TcGFuUHJvcHMoc3R5bGU6IFRleHRTdHlsZSk6IFNwYW5Qcm9wcyB7XG4gIGNvbnN0IHByb3BzOiBTcGFuUHJvcHMgPSB7fVxuXG4gIGlmIChzdHlsZS5ib2xkKSBwcm9wcy5ib2xkID0gdHJ1ZVxuICBpZiAoc3R5bGUuZGltKSBwcm9wcy5kaW0gPSB0cnVlXG4gIGlmIChzdHlsZS5pdGFsaWMpIHByb3BzLml0YWxpYyA9IHRydWVcbiAgaWYgKHN0eWxlLnVuZGVybGluZSAhPT0gJ25vbmUnKSBwcm9wcy51bmRlcmxpbmUgPSB0cnVlXG4gIGlmIChzdHlsZS5zdHJpa2V0aHJvdWdoKSBwcm9wcy5zdHJpa2V0aHJvdWdoID0gdHJ1ZVxuICBpZiAoc3R5bGUuaW52ZXJzZSkgcHJvcHMuaW52ZXJzZSA9IHRydWVcblxuICBjb25zdCBmZ0NvbG9yID0gY29sb3JUb1N0cmluZyhzdHlsZS5mZylcbiAgaWYgKGZnQ29sb3IpIHByb3BzLmNvbG9yID0gZmdDb2xvclxuXG4gIGNvbnN0IGJnQ29sb3IgPSBjb2xvclRvU3RyaW5nKHN0eWxlLmJnKVxuICBpZiAoYmdDb2xvcikgcHJvcHMuYmFja2dyb3VuZENvbG9yID0gYmdDb2xvclxuXG4gIHJldHVybiBwcm9wc1xufVxuXG4vLyBNYXAgdGVybWlvIG5hbWVkIGNvbG9ycyB0byB0aGUgYW5zaTogZm9ybWF0XG5jb25zdCBOQU1FRF9DT0xPUl9NQVA6IFJlY29yZDxOYW1lZENvbG9yLCBzdHJpbmc+ID0ge1xuICBibGFjazogJ2Fuc2k6YmxhY2snLFxuICByZWQ6ICdhbnNpOnJlZCcsXG4gIGdyZWVuOiAnYW5zaTpncmVlbicsXG4gIHllbGxvdzogJ2Fuc2k6eWVsbG93JyxcbiAgYmx1ZTogJ2Fuc2k6Ymx1ZScsXG4gIG1hZ2VudGE6ICdhbnNpOm1hZ2VudGEnLFxuICBjeWFuOiAnYW5zaTpjeWFuJyxcbiAgd2hpdGU6ICdhbnNpOndoaXRlJyxcbiAgYnJpZ2h0QmxhY2s6ICdhbnNpOmJsYWNrQnJpZ2h0JyxcbiAgYnJpZ2h0UmVkOiAnYW5zaTpyZWRCcmlnaHQnLFxuICBicmlnaHRHcmVlbjogJ2Fuc2k6Z3JlZW5CcmlnaHQnLFxuICBicmlnaHRZZWxsb3c6ICdhbnNpOnllbGxvd0JyaWdodCcsXG4gIGJyaWdodEJsdWU6ICdhbnNpOmJsdWVCcmlnaHQnLFxuICBicmlnaHRNYWdlbnRhOiAnYW5zaTptYWdlbnRhQnJpZ2h0JyxcbiAgYnJpZ2h0Q3lhbjogJ2Fuc2k6Y3lhbkJyaWdodCcsXG4gIGJyaWdodFdoaXRlOiAnYW5zaTp3aGl0ZUJyaWdodCcsXG59XG5cbi8qKlxuICogQ29udmVydCB0ZXJtaW8ncyBDb2xvciB0byB0aGUgc3RyaW5nIGZvcm1hdCB1c2VkIGJ5IEluay5cbiAqL1xuZnVuY3Rpb24gY29sb3JUb1N0cmluZyhjb2xvcjogVGVybWlvQ29sb3IpOiBDb2xvciB8IHVuZGVmaW5lZCB7XG4gIHN3aXRjaCAoY29sb3IudHlwZSkge1xuICAgIGNhc2UgJ25hbWVkJzpcbiAgICAgIHJldHVybiBOQU1FRF9DT0xPUl9NQVBbY29sb3IubmFtZV0gYXMgQ29sb3JcbiAgICBjYXNlICdpbmRleGVkJzpcbiAgICAgIHJldHVybiBgYW5zaTI1Nigke2NvbG9yLmluZGV4fSlgIGFzIENvbG9yXG4gICAgY2FzZSAncmdiJzpcbiAgICAgIHJldHVybiBgcmdiKCR7Y29sb3Iucn0sJHtjb2xvci5nfSwke2NvbG9yLmJ9KWAgYXMgQ29sb3JcbiAgICBjYXNlICdkZWZhdWx0JzpcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHR3byBTcGFuUHJvcHMgYXJlIGVxdWFsIGZvciBtZXJnaW5nLlxuICovXG5mdW5jdGlvbiBwcm9wc0VxdWFsKGE6IFNwYW5Qcm9wcywgYjogU3BhblByb3BzKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgYS5jb2xvciA9PT0gYi5jb2xvciAmJlxuICAgIGEuYmFja2dyb3VuZENvbG9yID09PSBiLmJhY2tncm91bmRDb2xvciAmJlxuICAgIGEuYm9sZCA9PT0gYi5ib2xkICYmXG4gICAgYS5kaW0gPT09IGIuZGltICYmXG4gICAgYS5pdGFsaWMgPT09IGIuaXRhbGljICYmXG4gICAgYS51bmRlcmxpbmUgPT09IGIudW5kZXJsaW5lICYmXG4gICAgYS5zdHJpa2V0aHJvdWdoID09PSBiLnN0cmlrZXRocm91Z2ggJiZcbiAgICBhLmludmVyc2UgPT09IGIuaW52ZXJzZSAmJlxuICAgIGEuaHlwZXJsaW5rID09PSBiLmh5cGVybGlua1xuICApXG59XG5cbmZ1bmN0aW9uIGhhc0FueVByb3BzKHByb3BzOiBTcGFuUHJvcHMpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBwcm9wcy5jb2xvciAhPT0gdW5kZWZpbmVkIHx8XG4gICAgcHJvcHMuYmFja2dyb3VuZENvbG9yICE9PSB1bmRlZmluZWQgfHxcbiAgICBwcm9wcy5kaW0gPT09IHRydWUgfHxcbiAgICBwcm9wcy5ib2xkID09PSB0cnVlIHx8XG4gICAgcHJvcHMuaXRhbGljID09PSB0cnVlIHx8XG4gICAgcHJvcHMudW5kZXJsaW5lID09PSB0cnVlIHx8XG4gICAgcHJvcHMuc3RyaWtldGhyb3VnaCA9PT0gdHJ1ZSB8fFxuICAgIHByb3BzLmludmVyc2UgPT09IHRydWUgfHxcbiAgICBwcm9wcy5oeXBlcmxpbmsgIT09IHVuZGVmaW5lZFxuICApXG59XG5cbmZ1bmN0aW9uIGhhc0FueVRleHRQcm9wcyhwcm9wczogU3BhblByb3BzKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgcHJvcHMuY29sb3IgIT09IHVuZGVmaW5lZCB8fFxuICAgIHByb3BzLmJhY2tncm91bmRDb2xvciAhPT0gdW5kZWZpbmVkIHx8XG4gICAgcHJvcHMuZGltID09PSB0cnVlIHx8XG4gICAgcHJvcHMuYm9sZCA9PT0gdHJ1ZSB8fFxuICAgIHByb3BzLml0YWxpYyA9PT0gdHJ1ZSB8fFxuICAgIHByb3BzLnVuZGVybGluZSA9PT0gdHJ1ZSB8fFxuICAgIHByb3BzLnN0cmlrZXRocm91Z2ggPT09IHRydWUgfHxcbiAgICBwcm9wcy5pbnZlcnNlID09PSB0cnVlXG4gIClcbn1cblxuLy8gVGV4dCBzdHlsZSBwcm9wcyB3aXRob3V0IHdlaWdodCAoYm9sZC9kaW0pIC0gdGhlc2UgYXJlIGhhbmRsZWQgc2VwYXJhdGVseVxudHlwZSBCYXNlVGV4dFN0eWxlUHJvcHMgPSB7XG4gIGNvbG9yPzogQ29sb3JcbiAgYmFja2dyb3VuZENvbG9yPzogQ29sb3JcbiAgaXRhbGljPzogYm9vbGVhblxuICB1bmRlcmxpbmU/OiBib29sZWFuXG4gIHN0cmlrZXRocm91Z2g/OiBib29sZWFuXG4gIGludmVyc2U/OiBib29sZWFuXG59XG5cbi8vIFdyYXBwZXIgY29tcG9uZW50IHRoYXQgaGFuZGxlcyBib2xkL2RpbSBtdXR1YWwgZXhjbHVzaXZpdHkgZm9yIFRleHRcbmZ1bmN0aW9uIFN0eWxlZFRleHQoe1xuICBib2xkLFxuICBkaW0sXG4gIGNoaWxkcmVuLFxuICAuLi5yZXN0XG59OiBCYXNlVGV4dFN0eWxlUHJvcHMgJiB7XG4gIGJvbGQ/OiBib29sZWFuXG4gIGRpbT86IGJvb2xlYW5cbiAgY2hpbGRyZW46IHN0cmluZ1xufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIGRpbSB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgYm9sZCB3aGVuIGJvdGggYXJlIHNldCAodGVybWluYWxzIHRyZWF0IHRoZW0gYXMgbXV0dWFsbHkgZXhjbHVzaXZlKVxuICBpZiAoZGltKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxUZXh0IHsuLi5yZXN0fSBkaW0+XG4gICAgICAgIHtjaGlsZHJlbn1cbiAgICAgIDwvVGV4dD5cbiAgICApXG4gIH1cbiAgaWYgKGJvbGQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFRleHQgey4uLnJlc3R9IGJvbGQ+XG4gICAgICAgIHtjaGlsZHJlbn1cbiAgICAgIDwvVGV4dD5cbiAgICApXG4gIH1cbiAgcmV0dXJuIDxUZXh0IHsuLi5yZXN0fT57Y2hpbGRyZW59PC9UZXh0PlxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsT0FBT0MsSUFBSSxNQUFNLHNCQUFzQjtBQUN2QyxPQUFPQyxJQUFJLE1BQU0sc0JBQXNCO0FBQ3ZDLGNBQWNDLEtBQUssUUFBUSxhQUFhO0FBQ3hDLFNBQ0UsS0FBS0MsVUFBVSxFQUNmQyxNQUFNLEVBQ04sS0FBS0YsS0FBSyxJQUFJRyxXQUFXLEVBQ3pCLEtBQUtDLFNBQVMsUUFDVCxhQUFhO0FBRXBC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
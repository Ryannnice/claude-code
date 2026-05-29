// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ReactNode } 来自 react，用于校准终端渲染的数据契约。
import type { ReactNode } from 'react';
// 引入 React、useContext，将 react 中已经封装好的能力接到本文件流程里。
import React, { useContext } from 'react';
// 复用 Text 终端界面组件，避免在这里重复拼装显示逻辑。
import Text from '../../ink/components/Text.js';
// 类型依赖 { Color, Styles } 来自 ../../ink/styles.js，用于校准终端渲染的数据契约。
import type { Color, Styles } from '../../ink/styles.js';
// 复用 getTheme、Theme 工具函数，把通用处理留在 ../../utils/theme.js 中维护。
import { getTheme, type Theme } from '../../utils/theme.js';
// 引入 useTheme，将 ./ThemeProvider.js 中已经封装好的能力接到本文件流程里。
import { useTheme } from './ThemeProvider.js';

/** Colors uncolored ThemedText in the subtree. Precedence: explicit `color` >
 *  this > dimColor. Crosses Box boundaries (Ink's style cascade doesn't). */
// TextHoverColorContext构建`React.createContext<keyof Theme | undefined>(undefined)` 整理出中间结果，供终端 UI Themed Text后续步骤使用。
export const TextHoverColorContext = React.createContext<keyof Theme | undefined>(undefined);
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = {
  /**
   * Change text color. Accepts a theme key or raw color value.
   */
  readonly color?: keyof Theme | Color;

  /**
   * Same as `color`, but for background. Must be a theme key.
   */
  readonly backgroundColor?: keyof Theme;

  /**
   * Dim the color using the theme's inactive color.
   * This is compatible with bold (unlike ANSI dim).
   */
  readonly dimColor?: boolean;

  /**
   * Make the text bold.
   */
  readonly bold?: boolean;

  /**
   * Make the text italic.
   */
  readonly italic?: boolean;

  /**
   * Make the text underlined.
   */
  readonly underline?: boolean;

  /**
   * Make the text crossed with a line.
   */
  readonly strikethrough?: boolean;

  /**
   * Inverse background and foreground colors.
   */
  readonly inverse?: boolean;

  /**
   * This property tells Ink to wrap or truncate text if its width is larger than container.
   * If `wrap` is passed (by default), Ink will wrap text and split it into multiple lines.
   * If `truncate-*` is passed, Ink will truncate text instead, which will result in one line of text with the rest cut off.
   */
  readonly wrap?: Styles['textWrap'];
  readonly children?: ReactNode;
};

/**
 * Resolves a color value that may be a theme key to a raw Color.
 */
// resolveColor 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveColor(color: keyof Theme | Color | undefined, theme: Theme): Color | undefined {
  // color缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!color) return undefined;
  // Check if it's a raw color (starts with rgb(, #, ansi256(, or ansi:)
  // 只有 `color.startsWith('rgb(') || color.startsWith('#') || color.startsWith('ansi...` 满足时，终端渲染才执行该分支。
  if (color.startsWith('rgb(') || color.startsWith('#') || color.startsWith('ansi256(') || color.startsWith('ansi:')) {
    // 返回 `color as Color`，作为终端渲染这次计算的结果。
    return color as Color;
  }
  // It's a theme key - resolve it
  // 返回 `theme[color as keyof Theme] as Color`，作为终端渲染这次计算的结果。
  return theme[color as keyof Theme] as Color;
}

/**
 * Theme-aware Text component that resolves theme color keys to raw colors.
 * This wraps the base Text component with theme resolution.
 */
// 终端 UI 组件 Themed Text在这里处理 `export default function ThemedText(t0) {`，完成这一小步状态转换。
export default function ThemedText(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    color,
    backgroundColor,
    dimColor: t1,
    bold: t2,
    italic: t3,
    underline: t4,
    strikethrough: t5,
    inverse: t6,
    wrap: t7,
    children
  } = t0;
  // dimColor标记终端 UI Themed Text是否启用对应路径。
  const dimColor = t1 === undefined ? false : t1;
  // bold标记终端 UI Themed Text是否启用对应路径。
  const bold = t2 === undefined ? false : t2;
  // italic标记终端 UI Themed Text是否启用对应路径。
  const italic = t3 === undefined ? false : t3;
  // underline标记终端 UI Themed Text是否启用对应路径。
  const underline = t4 === undefined ? false : t4;
  // strikethrough标记终端 UI Themed Text是否启用对应路径。
  const strikethrough = t5 === undefined ? false : t5;
  // inverse标记终端 UI Themed Text是否启用对应路径。
  const inverse = t6 === undefined ? false : t6;
  // wrap标记终端 UI Themed Text是否启用对应路径。
  const wrap = t7 === undefined ? "wrap" : t7;
  // 从 `useTheme()` 按位置拆出 themeName，让终端 UI 组件 Themed Text分别处理这些返回值。
  const [themeName] = useTheme();
  // 主题读取`getTheme`，供终端渲染后续处理使用。
  const theme = getTheme(themeName);
  // hoverColor保存`useContext`，供终端渲染后续处理使用。
  const hoverColor = useContext(TextHoverColorContext);
  // resolvedColor读取`resolveColor`，供终端渲染后续处理使用。
  const resolvedColor = !color && hoverColor ? resolveColor(hoverColor, theme) : dimColor ? theme.inactive as Color : resolveColor(color, theme);
  // resolvedBackgroundColor保存`backgroundColor ? theme[backgroundColor] as Color : undef...`，供终端 UI Themed Text后续判断或输出使用。
  const resolvedBackgroundColor = backgroundColor ? theme[backgroundColor] as Color : undefined;
  // t8 暂存 `<Text color={resolvedColor} backgroundColor={resolvedBack...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== bold || $[1] !== children || $[2] !== inverse || $[3] !== italic || $[4] !== resolvedBackgroundColor || $[5] !== resolvedColor || $[6] !== strikethrough || $[7] !== underline || $[8] !== wrap) {
    // t8 暂存 `<Text color={resolvedColor} backgroundColor={resolvedBack...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text color={resolvedColor} backgroundColor={resolvedBackgroundColor} bold={bold} italic={italic} underline={underline} strikethrough={strikethrough} inverse={inverse} wrap={wrap}>{children}</Text>;
    // $[0] 缓存 `bold`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = bold;
    // $[1] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = children;
    // $[2] 缓存 `inverse`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = inverse;
    // $[3] 缓存 `italic`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = italic;
    // $[4] 缓存 `resolvedBackgroundColor`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = resolvedBackgroundColor;
    // $[5] 缓存 `resolvedColor`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = resolvedColor;
    // $[6] 缓存 `strikethrough`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = strikethrough;
    // $[7] 缓存 `underline`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = underline;
    // $[8] 缓存 `wrap`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = wrap;
    // $[9] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[9];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdE5vZGUiLCJSZWFjdCIsInVzZUNvbnRleHQiLCJUZXh0IiwiQ29sb3IiLCJTdHlsZXMiLCJnZXRUaGVtZSIsIlRoZW1lIiwidXNlVGhlbWUiLCJUZXh0SG92ZXJDb2xvckNvbnRleHQiLCJjcmVhdGVDb250ZXh0IiwidW5kZWZpbmVkIiwiUHJvcHMiLCJjb2xvciIsImJhY2tncm91bmRDb2xvciIsImRpbUNvbG9yIiwiYm9sZCIsIml0YWxpYyIsInVuZGVybGluZSIsInN0cmlrZXRocm91Z2giLCJpbnZlcnNlIiwid3JhcCIsImNoaWxkcmVuIiwicmVzb2x2ZUNvbG9yIiwidGhlbWUiLCJzdGFydHNXaXRoIiwiVGhlbWVkVGV4dCIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsInQzIiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0aGVtZU5hbWUiLCJob3ZlckNvbG9yIiwicmVzb2x2ZWRDb2xvciIsImluYWN0aXZlIiwicmVzb2x2ZWRCYWNrZ3JvdW5kQ29sb3IiLCJ0OCJdLCJzb3VyY2VzIjpbIlRoZW1lZFRleHQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgUmVhY3ROb2RlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgUmVhY3QsIHsgdXNlQ29udGV4dCB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFRleHQgZnJvbSAnLi4vLi4vaW5rL2NvbXBvbmVudHMvVGV4dC5qcydcbmltcG9ydCB0eXBlIHsgQ29sb3IsIFN0eWxlcyB9IGZyb20gJy4uLy4uL2luay9zdHlsZXMuanMnXG5pbXBvcnQgeyBnZXRUaGVtZSwgdHlwZSBUaGVtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHsgdXNlVGhlbWUgfSBmcm9tICcuL1RoZW1lUHJvdmlkZXIuanMnXG5cbi8qKiBDb2xvcnMgdW5jb2xvcmVkIFRoZW1lZFRleHQgaW4gdGhlIHN1YnRyZWUuIFByZWNlZGVuY2U6IGV4cGxpY2l0IGBjb2xvcmAgPlxuICogIHRoaXMgPiBkaW1Db2xvci4gQ3Jvc3NlcyBCb3ggYm91bmRhcmllcyAoSW5rJ3Mgc3R5bGUgY2FzY2FkZSBkb2Vzbid0KS4gKi9cbmV4cG9ydCBjb25zdCBUZXh0SG92ZXJDb2xvckNvbnRleHQgPSBSZWFjdC5jcmVhdGVDb250ZXh0PFxuICBrZXlvZiBUaGVtZSB8IHVuZGVmaW5lZFxuPih1bmRlZmluZWQpXG5cbmV4cG9ydCB0eXBlIFByb3BzID0ge1xuICAvKipcbiAgICogQ2hhbmdlIHRleHQgY29sb3IuIEFjY2VwdHMgYSB0aGVtZSBrZXkgb3IgcmF3IGNvbG9yIHZhbHVlLlxuICAgKi9cbiAgcmVhZG9ubHkgY29sb3I/OiBrZXlvZiBUaGVtZSB8IENvbG9yXG5cbiAgLyoqXG4gICAqIFNhbWUgYXMgYGNvbG9yYCwgYnV0IGZvciBiYWNrZ3JvdW5kLiBNdXN0IGJlIGEgdGhlbWUga2V5LlxuICAgKi9cbiAgcmVhZG9ubHkgYmFja2dyb3VuZENvbG9yPzoga2V5b2YgVGhlbWVcblxuICAvKipcbiAgICogRGltIHRoZSBjb2xvciB1c2luZyB0aGUgdGhlbWUncyBpbmFjdGl2ZSBjb2xvci5cbiAgICogVGhpcyBpcyBjb21wYXRpYmxlIHdpdGggYm9sZCAodW5saWtlIEFOU0kgZGltKS5cbiAgICovXG4gIHJlYWRvbmx5IGRpbUNvbG9yPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBNYWtlIHRoZSB0ZXh0IGJvbGQuXG4gICAqL1xuICByZWFkb25seSBib2xkPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBNYWtlIHRoZSB0ZXh0IGl0YWxpYy5cbiAgICovXG4gIHJlYWRvbmx5IGl0YWxpYz86IGJvb2xlYW5cblxuICAvKipcbiAgICogTWFrZSB0aGUgdGV4dCB1bmRlcmxpbmVkLlxuICAgKi9cbiAgcmVhZG9ubHkgdW5kZXJsaW5lPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBNYWtlIHRoZSB0ZXh0IGNyb3NzZWQgd2l0aCBhIGxpbmUuXG4gICAqL1xuICByZWFkb25seSBzdHJpa2V0aHJvdWdoPzogYm9vbGVhblxuXG4gIC8qKlxuICAgKiBJbnZlcnNlIGJhY2tncm91bmQgYW5kIGZvcmVncm91bmQgY29sb3JzLlxuICAgKi9cbiAgcmVhZG9ubHkgaW52ZXJzZT86IGJvb2xlYW5cblxuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0eSB0ZWxscyBJbmsgdG8gd3JhcCBvciB0cnVuY2F0ZSB0ZXh0IGlmIGl0cyB3aWR0aCBpcyBsYXJnZXIgdGhhbiBjb250YWluZXIuXG4gICAqIElmIGB3cmFwYCBpcyBwYXNzZWQgKGJ5IGRlZmF1bHQpLCBJbmsgd2lsbCB3cmFwIHRleHQgYW5kIHNwbGl0IGl0IGludG8gbXVsdGlwbGUgbGluZXMuXG4gICAqIElmIGB0cnVuY2F0ZS0qYCBpcyBwYXNzZWQsIEluayB3aWxsIHRydW5jYXRlIHRleHQgaW5zdGVhZCwgd2hpY2ggd2lsbCByZXN1bHQgaW4gb25lIGxpbmUgb2YgdGV4dCB3aXRoIHRoZSByZXN0IGN1dCBvZmYuXG4gICAqL1xuICByZWFkb25seSB3cmFwPzogU3R5bGVzWyd0ZXh0V3JhcCddXG5cbiAgcmVhZG9ubHkgY2hpbGRyZW4/OiBSZWFjdE5vZGVcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyBhIGNvbG9yIHZhbHVlIHRoYXQgbWF5IGJlIGEgdGhlbWUga2V5IHRvIGEgcmF3IENvbG9yLlxuICovXG5mdW5jdGlvbiByZXNvbHZlQ29sb3IoXG4gIGNvbG9yOiBrZXlvZiBUaGVtZSB8IENvbG9yIHwgdW5kZWZpbmVkLFxuICB0aGVtZTogVGhlbWUsXG4pOiBDb2xvciB8IHVuZGVmaW5lZCB7XG4gIGlmICghY29sb3IpIHJldHVybiB1bmRlZmluZWRcbiAgLy8gQ2hlY2sgaWYgaXQncyBhIHJhdyBjb2xvciAoc3RhcnRzIHdpdGggcmdiKCwgIywgYW5zaTI1NigsIG9yIGFuc2k6KVxuICBpZiAoXG4gICAgY29sb3Iuc3RhcnRzV2l0aCgncmdiKCcpIHx8XG4gICAgY29sb3Iuc3RhcnRzV2l0aCgnIycpIHx8XG4gICAgY29sb3Iuc3RhcnRzV2l0aCgnYW5zaTI1NignKSB8fFxuICAgIGNvbG9yLnN0YXJ0c1dpdGgoJ2Fuc2k6JylcbiAgKSB7XG4gICAgcmV0dXJuIGNvbG9yIGFzIENvbG9yXG4gIH1cbiAgLy8gSXQncyBhIHRoZW1lIGtleSAtIHJlc29sdmUgaXRcbiAgcmV0dXJuIHRoZW1lW2NvbG9yIGFzIGtleW9mIFRoZW1lXSBhcyBDb2xvclxufVxuXG4vKipcbiAqIFRoZW1lLWF3YXJlIFRleHQgY29tcG9uZW50IHRoYXQgcmVzb2x2ZXMgdGhlbWUgY29sb3Iga2V5cyB0byByYXcgY29sb3JzLlxuICogVGhpcyB3cmFwcyB0aGUgYmFzZSBUZXh0IGNvbXBvbmVudCB3aXRoIHRoZW1lIHJlc29sdXRpb24uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRoZW1lZFRleHQoe1xuICBjb2xvcixcbiAgYmFja2dyb3VuZENvbG9yLFxuICBkaW1Db2xvciA9IGZhbHNlLFxuICBib2xkID0gZmFsc2UsXG4gIGl0YWxpYyA9IGZhbHNlLFxuICB1bmRlcmxpbmUgPSBmYWxzZSxcbiAgc3RyaWtldGhyb3VnaCA9IGZhbHNlLFxuICBpbnZlcnNlID0gZmFsc2UsXG4gIHdyYXAgPSAnd3JhcCcsXG4gIGNoaWxkcmVuLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbdGhlbWVOYW1lXSA9IHVzZVRoZW1lKClcbiAgY29uc3QgdGhlbWUgPSBnZXRUaGVtZSh0aGVtZU5hbWUpXG4gIGNvbnN0IGhvdmVyQ29sb3IgPSB1c2VDb250ZXh0KFRleHRIb3ZlckNvbG9yQ29udGV4dClcblxuICAvLyBSZXNvbHZlIHRoZW1lIGtleXMgdG8gcmF3IGNvbG9yc1xuICBjb25zdCByZXNvbHZlZENvbG9yID1cbiAgICAhY29sb3IgJiYgaG92ZXJDb2xvclxuICAgICAgPyByZXNvbHZlQ29sb3IoaG92ZXJDb2xvciwgdGhlbWUpXG4gICAgICA6IGRpbUNvbG9yXG4gICAgICAgID8gKHRoZW1lLmluYWN0aXZlIGFzIENvbG9yKVxuICAgICAgICA6IHJlc29sdmVDb2xvcihjb2xvciwgdGhlbWUpXG4gIGNvbnN0IHJlc29sdmVkQmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yXG4gICAgPyAodGhlbWVbYmFja2dyb3VuZENvbG9yXSBhcyBDb2xvcilcbiAgICA6IHVuZGVmaW5lZFxuXG4gIHJldHVybiAoXG4gICAgPFRleHRcbiAgICAgIGNvbG9yPXtyZXNvbHZlZENvbG9yfVxuICAgICAgYmFja2dyb3VuZENvbG9yPXtyZXNvbHZlZEJhY2tncm91bmRDb2xvcn1cbiAgICAgIGJvbGQ9e2JvbGR9XG4gICAgICBpdGFsaWM9e2l0YWxpY31cbiAgICAgIHVuZGVybGluZT17dW5kZXJsaW5lfVxuICAgICAgc3RyaWtldGhyb3VnaD17c3RyaWtldGhyb3VnaH1cbiAgICAgIGludmVyc2U9e2ludmVyc2V9XG4gICAgICB3cmFwPXt3cmFwfVxuICAgID5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L1RleHQ+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLFNBQVMsUUFBUSxPQUFPO0FBQ3RDLE9BQU9DLEtBQUssSUFBSUMsVUFBVSxRQUFRLE9BQU87QUFDekMsT0FBT0MsSUFBSSxNQUFNLDhCQUE4QjtBQUMvQyxjQUFjQyxLQUFLLEVBQUVDLE1BQU0sUUFBUSxxQkFBcUI7QUFDeEQsU0FBU0MsUUFBUSxFQUFFLEtBQUtDLEtBQUssUUFBUSxzQkFBc0I7QUFDM0QsU0FBU0MsUUFBUSxRQUFRLG9CQUFvQjs7QUFFN0M7QUFDQTtBQUNBLE9BQU8sTUFBTUMscUJBQXFCLEdBQUdSLEtBQUssQ0FBQ1MsYUFBYSxDQUN0RCxNQUFNSCxLQUFLLEdBQUcsU0FBUyxDQUN4QixDQUFDSSxTQUFTLENBQUM7QUFFWixPQUFPLEtBQUtDLEtBQUssR0FBRztFQUNsQjtBQUNGO0FBQ0E7RUFDRSxTQUFTQyxLQUFLLENBQUMsRUFBRSxNQUFNTixLQUFLLEdBQUdILEtBQUs7O0VBRXBDO0FBQ0Y7QUFDQTtFQUNFLFNBQVNVLGVBQWUsQ0FBQyxFQUFFLE1BQU1QLEtBQUs7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
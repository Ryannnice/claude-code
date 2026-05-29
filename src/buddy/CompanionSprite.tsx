// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useRef, useState } from 'react';
// 引入 useTerminalSize，将 ../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js';
// 类型依赖 { AppState } 来自 ../state/AppStateStore.js，用于校准Companion Sprite的数据契约。
import type { AppState } from '../state/AppStateStore.js';
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js';
// 复用 isFullscreenActive 工具函数，把通用处理留在 ../utils/fullscreen.js 中维护。
import { isFullscreenActive } from '../utils/fullscreen.js';
// 类型依赖 { Theme } 来自 ../utils/theme.js，用于校准Companion Sprite的数据契约。
import type { Theme } from '../utils/theme.js';
// 引入 isBuddyEnabled，将 ./availability.js 中已经封装好的能力接到本文件流程里。
import { isBuddyEnabled } from './availability.js';
// 引入 getCompanion，将 ./companion.js 中已经封装好的能力接到本文件流程里。
import { getCompanion } from './companion.js';
// 引入 renderFace、renderSprite、spriteFrameCount，将 ./sprites.js 中已经封装好的能力接到本文件流程里。
import { renderFace, renderSprite, spriteFrameCount } from './sprites.js';
// 引入 RARITY_COLORS，将 ./types.js 中已经封装好的能力接到本文件流程里。
import { RARITY_COLORS } from './types.js';
// TICK_MS 集合 命名 `500`，让后续代码直接表达这个值的用途。
const TICK_MS = 500;
// BUBBLE_SHOW 命名 `20; // ticks → ~10s at 500ms`，让后续代码直接表达这个值的用途。
const BUBBLE_SHOW = 20; // ticks → ~10s at 500ms
// FADE_WINDOW保存`6; // last ~3s the bubble dims so you know it's about to ...`，供Companion Sprite后续判断或输出使用。
const FADE_WINDOW = 6; // last ~3s the bubble dims so you know it's about to go
// PET_BURST_MS 集合 命名 `2500; // how long hearts float after /buddy pet`，让后续代码直接表达这个值的用途。
const PET_BURST_MS = 2500; // how long hearts float after /buddy pet

// Idle sequence: mostly rest (frame 0), occasional fidget (frames 1-2), rare blink.
// Sequence indices map to sprite frames; -1 means "blink on frame 0".
// IDLE_SEQUENCE 聚合成有序列表，保持后续遍历顺序稳定。
const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0];

// Hearts float up-and-out over 5 ticks (~2.5s). Prepended above the sprite.
// H保存`figures.heart`，供Companion Sprite后续判断或输出使用。
const H = figures.heart;
// PET_HEARTS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const PET_HEARTS = [`   ${H}    ${H}   `, `  ${H}  ${H}   ${H}  `, ` ${H}   ${H}  ${H}   `, `${H}  ${H}      ${H} `, '·    ·   ·  '];
// wrap 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wrap(text: string, width: number): string[] {
  // words 集合格式化`text.split`，供Companion Sprite后续处理使用。
  const words = text.split(' ');
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = [];
  // cur 命名 `''`，让后续代码直接表达这个值的用途。
  let cur = '';
  // 按顺序遍历 `words` 中的w，逐个交给Companion Sprite处理。
  for (const w of words) {
    // 组合条件 `cur.length + w.length + 1 > width && cur` 成立时，Companion Sprite才启用这条专门路径。
    if (cur.length + w.length + 1 > width && cur) {
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(cur);
      // cur更新为 `w`，确保CompanionSprite后续读取最新状态。
      cur = w;
    } else {
      // cur更新为 `cur ? `${cur} ${w}` : w`，确保CompanionSprite后续读取最新状态。
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  // 满足 `cur) lines.push(cur` 时，Companion Sprite执行该分支。
  if (cur) lines.push(cur);
  // 返回 `lines`，作为Companion Sprite这次计算的结果。
  return lines;
}
// SpeechBubble 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SpeechBubble(t0) {
  // $保存`_c`，供Companion Sprite后续处理使用。
  const $ = _c(31);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text,
    color,
    fading,
    tail
  } = t0;
  // T0 暂存 `Box` 的派生结果，便于缓存命中时直接复用。
  let T0;
  // borderColor 先占位，稍后的条件分支会根据实际输入补齐它。
  let borderColor;
  // t1 暂存 `"column"` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `"round"` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `borderColor` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 暂存 `1` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 暂存 `34` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== color || $[1] !== fading || $[2] !== text) {
    // 文本行保存`wrap`，供Companion Sprite后续处理使用。
    const lines = wrap(text, 30);
    // borderColor更新为 `fading ? "inactive" : color`，确保CompanionSprite后续读取最新状态。
    borderColor = fading ? "inactive" : color;
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t1 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t1 = "column";
    // t2 暂存 `"round"` 生成的渲染片段，后续返回路径直接复用。
    t2 = "round";
    // t3 暂存 `borderColor` 生成的渲染片段，后续返回路径直接复用。
    t3 = borderColor;
    // t4 暂存 `1` 生成的渲染片段，后续返回路径直接复用。
    t4 = 1;
    // t5 暂存 `34` 生成的渲染片段，后续返回路径直接复用。
    t5 = 34;
    // t7 暂存 `(l, i) => <Text key={i} italic={true} dimColor={!fading} ...` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[11] !== fading) {
      // t7 暂存 `(l, i) => <Text key={i} italic={true} dimColor={!fading} ...` 生成的渲染片段，后续返回路径直接复用。
      t7 = (l, i) => <Text key={i} italic={true} dimColor={!fading} color={fading ? "inactive" : undefined}>{l}</Text>;
      // $[11] 缓存 `fading`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = fading;
      // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[12];
    }
    // t6 暂存 `lines.map(t7)` 生成的渲染片段，后续返回路径直接复用。
    t6 = lines.map(t7);
    // $[0] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = color;
    // $[1] 缓存 `fading`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = fading;
    // $[2] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = text;
    // $[3] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = T0;
    // $[4] 缓存 `borderColor`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = borderColor;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
  } else {
    // T0 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[3];
    // borderColor更新为 `$[4]`，确保CompanionSprite后续读取最新状态。
    borderColor = $[4];
    // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
    // t6 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[10];
  }
  // t7 暂存 `<T0 flexDirection={t1} borderStyle={t2} borderColor={t3} ...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== T0 || $[14] !== t1 || $[15] !== t2 || $[16] !== t3 || $[17] !== t4 || $[18] !== t5 || $[19] !== t6) {
    // t7 暂存 `<T0 flexDirection={t1} borderStyle={t2} borderColor={t3} ...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <T0 flexDirection={t1} borderStyle={t2} borderColor={t3} paddingX={t4} width={t5}>{t6}</T0>;
    // $[13] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = T0;
    // $[14] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t1;
    // $[15] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t2;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
    // $[17] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t4;
    // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t5;
    // $[19] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t6;
    // $[20] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[20];
  }
  // bubble 命名 `t7`，让后续代码直接表达这个值的用途。
  const bubble = t7;
  // 当 `tail` 匹配 `"right"` 时，Companion Sprite执行对应分支。
  if (tail === "right") {
    // t8 暂存 `<Text color={borderColor}>─</Text>` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[21] !== borderColor) {
      // t8 暂存 `<Text color={borderColor}>─</Text>` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text color={borderColor}>─</Text>;
      // $[21] 缓存 `borderColor`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = borderColor;
      // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[22];
    }
    // t9 暂存 `<Box flexDirection="row" alignItems="center">{bubble}{t8}...` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[23] !== bubble || $[24] !== t8) {
      // t9 暂存 `<Box flexDirection="row" alignItems="center">{bubble}{t8}...` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Box flexDirection="row" alignItems="center">{bubble}{t8}</Box>;
      // $[23] 缓存 `bubble`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = bubble;
      // $[24] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = t8;
      // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[25];
    }
    // 返回 `t9`，作为Companion Sprite这次计算的结果。
    return t9;
  }
  // t8 暂存 `<Box flexDirection="column" alignItems="flex-end" padding...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== borderColor) {
    // t8 暂存 `<Box flexDirection="column" alignItems="flex-end" padding...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" alignItems="flex-end" paddingRight={6}><Text color={borderColor}>╲ </Text><Text color={borderColor}>╲</Text></Box>;
    // $[26] 缓存 `borderColor`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = borderColor;
    // $[27] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[27];
  }
  // t9 暂存 `<Box flexDirection="column" alignItems="flex-end" marginR...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== bubble || $[29] !== t8) {
    // t9 暂存 `<Box flexDirection="column" alignItems="flex-end" marginR...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" alignItems="flex-end" marginRight={1}>{bubble}{t8}</Box>;
    // $[28] 缓存 `bubble`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = bubble;
    // $[29] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t8;
    // $[30] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[30];
  }
  // 返回 `t9`，作为Companion Sprite这次计算的结果。
  return t9;
}
// MIN_COLS_FOR_FULL_SPRITE 命名 `100`，让后续代码直接表达这个值的用途。
export const MIN_COLS_FOR_FULL_SPRITE = 100;
// SPRITE_BODY_WIDTH 命名 `12`，让后续代码直接表达这个值的用途。
const SPRITE_BODY_WIDTH = 12;
// NAME_ROW_PAD保存`2; // focused state wraps name in spaces: ` name ``，供Companion Sprite后续判断或输出使用。
const NAME_ROW_PAD = 2; // focused state wraps name in spaces: ` name `
// SPRITE_PADDING_X保存`2`，供Companion Sprite后续判断或输出使用。
const SPRITE_PADDING_X = 2;
// BUBBLE_WIDTH保存`box`，供Companion Sprite后续处理使用。
const BUBBLE_WIDTH = 36; // SpeechBubble box (34) + tail column
// NARROW_QUIP_CAP 命名 `24`，让后续代码直接表达这个值的用途。
const NARROW_QUIP_CAP = 24;
// spriteColWidth 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function spriteColWidth(nameWidth: number): number {
  // 返回 `Math.max(SPRITE_BODY_WIDTH, nameWidth + NAME_ROW_PAD)`，作为Companion Sprite这次计算的结果。
  return Math.max(SPRITE_BODY_WIDTH, nameWidth + NAME_ROW_PAD);
}

// Width the sprite area consumes. PromptInput subtracts this so text wraps
// correctly. In fullscreen the bubble floats over scrollback (no extra
// width); in non-fullscreen it sits inline and needs BUBBLE_WIDTH more.
// Narrow terminals: 0 — REPL.tsx stacks the one-liner on its own row
// (above input in fullscreen, below in scrollback), so no reservation.
// companionReservedColumns 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function companionReservedColumns(terminalColumns: number, speaking: boolean): number {
  // 满足 `!isBuddyEnabled()` 时，Companion Sprite执行该分支。
  if (!isBuddyEnabled()) return 0;
  // companion读取`getCompanion`，供Companion Sprite后续处理使用。
  const companion = getCompanion();
  // 组合条件 `!companion || getGlobalConfig().companionMuted` 成立时，Companion Sprite才启用这条专门路径。
  if (!companion || getGlobalConfig().companionMuted) return 0;
  // 满足 `terminalColumns < MIN_COLS_FOR_FULL_SPRITE` 时，Companion Sprite执行该分支。
  if (terminalColumns < MIN_COLS_FOR_FULL_SPRITE) return 0;
  // nameWidth保存`stringWidth`，供Companion Sprite后续处理使用。
  const nameWidth = stringWidth(companion.name);
  // bubble保存`isFullscreenActive`，供Companion Sprite后续处理使用。
  const bubble = speaking && !isFullscreenActive() ? BUBBLE_WIDTH : 0;
  // 返回 `spriteColWidth(nameWidth) + SPRITE_PADDING_X + bubble`，作为Companion Sprite这次计算的结果。
  return spriteColWidth(nameWidth) + SPRITE_PADDING_X + bubble;
}
// CompanionSprite 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CompanionSprite(): React.ReactNode {
  // reaction保存`useAppState`，供Companion Sprite后续处理使用。
  const reaction = useAppState(s => s.companionReaction);
  // petAt保存`useAppState`，供Companion Sprite后续处理使用。
  const petAt = useAppState(s => s.companionPetAt);
  // focused保存`useAppState`，供Companion Sprite后续处理使用。
  const focused = useAppState(s => s.footerSelection === 'companion');
  // setAppState 状态保存`useSetAppState`，供Companion Sprite后续处理使用。
  const setAppState = useSetAppState();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // tick 由 React state 持有，setTick 会在用户操作或异步结果返回时触发刷新。
  const [tick, setTick] = useState(0);
  // lastSpokeTick保存`useRef`，供Companion Sprite后续处理使用。
  const lastSpokeTick = useRef(0);
  // Sync-during-render (not useEffect) so the first post-pet render already
  // has petStartTick=tick and petAge=0 — otherwise frame 0 is skipped.
  // Companion Sprite先整理这一处局部数据，后续分支可以直接读取。
  const [{
    petStartTick,
    forPetAt
  }, setPetStart] = useState({
    petStartTick: 0,
    forPetAt: petAt
  });
  // `petAt` 与 `forPetAt` 不一致时刷新派生状态，避免使用过期结果。
  if (petAt !== forPetAt) {
    // setPetStart 写入新的状态值，使Companion Sprite后续读取保持一致。
    setPetStart({
      petStartTick: tick,
      forPetAt: petAt
    });
  }
  // 调用 useEffect，触发Companion Sprite此处需要的副作用。
  useEffect(() => {
    // timer保存`setInterval`，供Companion Sprite后续处理使用。
    const timer = setInterval(setT => setT((t: number) => t + 1), TICK_MS, setTick);
    // 返回 `() => clearInterval(timer)`，作为Companion Sprite这次计算的结果。
    return () => clearInterval(timer);
  }, []);
  // 调用 useEffect，触发Companion Sprite此处需要的副作用。
  useEffect(() => {
    // reaction缺失时提前走兜底路径，避免Companion Sprite继续依赖无效输入。
    if (!reaction) return;
    // current更新为 `tick`，确保CompanionSprite后续读取最新状态。
    lastSpokeTick.current = tick;
    // timer保存`setTimeout`，供Companion Sprite后续处理使用。
    const timer = setTimeout(setA => setA((prev: AppState) => prev.companionReaction === undefined ? prev : {
      ...prev,
      companionReaction: undefined
    }), BUBBLE_SHOW * TICK_MS, setAppState);
    // 返回 `() => clearTimeout(timer)`，作为Companion Sprite这次计算的结果。
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick intentionally captured at reaction-change, not tracked
  }, [reaction, setAppState]);
  // 满足 `!isBuddyEnabled()` 时，Companion Sprite执行该分支。
  if (!isBuddyEnabled()) return null;
  // companion读取`getCompanion`，供Companion Sprite后续处理使用。
  const companion = getCompanion();
  // 组合条件 `!companion || getGlobalConfig().companionMuted` 成立时，Companion Sprite才启用这条专门路径。
  if (!companion || getGlobalConfig().companionMuted) return null;
  // color 命名 `RARITY_COLORS[companion.rarity]`，让后续代码直接表达这个值的用途。
  const color = RARITY_COLORS[companion.rarity];
  // colWidth保存`spriteColWidth`，供Companion Sprite后续处理使用。
  const colWidth = spriteColWidth(stringWidth(companion.name));
  // bubbleAge 命名 `reaction ? tick - lastSpokeTick.current : 0`，让后续代码直接表达这个值的用途。
  const bubbleAge = reaction ? tick - lastSpokeTick.current : 0;
  // fading标记Companion Sprite是否启用对应路径。
  const fading = reaction !== undefined && bubbleAge >= BUBBLE_SHOW - FADE_WINDOW;
  // petAge 命名 `petAt ? tick - petStartTick : Infinity`，让后续代码直接表达这个值的用途。
  const petAge = petAt ? tick - petStartTick : Infinity;
  // petting 命名 `petAge * TICK_MS < PET_BURST_MS`，让后续代码直接表达这个值的用途。
  const petting = petAge * TICK_MS < PET_BURST_MS;

  // Narrow terminals: collapse to one-line face. When speaking, the quip
  // replaces the name beside the face (no room for a bubble).
  // 满足 `columns < MIN_COLS_FOR_FULL_SPRITE` 时，Companion Sprite执行该分支。
  if (columns < MIN_COLS_FOR_FULL_SPRITE) {
    // quip格式化`reaction.slice`，供Companion Sprite后续处理使用。
    const quip = reaction && reaction.length > NARROW_QUIP_CAP ? reaction.slice(0, NARROW_QUIP_CAP - 1) + '…' : reaction;
    // label保存`quip ? `"${quip}"` : focused ? ` ${companion.name} ` : co...`，供Companion Sprite后续判断或输出使用。
    const label = quip ? `"${quip}"` : focused ? ` ${companion.name} ` : companion.name;
    // 返回 `<Box paddingX={1} alignSelf="flex-end">`，作为Companion Sprite这次计算的结果。
    return <Box paddingX={1} alignSelf="flex-end">
        <Text>
          {petting && <Text color="autoAccept">{figures.heart} </Text>}
          <Text bold color={color}>
            {renderFace(companion)}
          </Text>{' '}
          <Text italic dimColor={!focused && !reaction} bold={focused} inverse={focused && !reaction} color={reaction ? fading ? 'inactive' : color : focused ? color : undefined}>
            {label}
          </Text>
        </Text>
      </Box>;
  }
  // frameCount 数量保存`spriteFrameCount`，供Companion Sprite后续处理使用。
  const frameCount = spriteFrameCount(companion.species);
  // heartFrame 命名 `petting ? PET_HEARTS[petAge % PET_HEARTS.length] : null`，让后续代码直接表达这个值的用途。
  const heartFrame = petting ? PET_HEARTS[petAge % PET_HEARTS.length] : null;
  // spriteFrame 先占位，稍后的条件分支会根据实际输入补齐它。
  let spriteFrame: number;
  // blink标记Companion Sprite是否启用对应路径。
  let blink = false;
  // 组合条件 `reaction || petting` 成立时，Companion Sprite才启用这条专门路径。
  if (reaction || petting) {
    // Excited: cycle all fidget frames fast
    // spriteFrame更新为 `tick % frameCount`，确保CompanionSprite后续读取最新状态。
    spriteFrame = tick % frameCount;
  } else {
    // step记录 `IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!` 是否成立，下一步按该结果分支。
    const step = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!;
    // 满足 `step === -1` 时，Companion Sprite执行该分支。
    if (step === -1) {
      // spriteFrame更新为 `0`，确保CompanionSprite后续读取最新状态。
      spriteFrame = 0;
      // blink更新为 `true`，确保CompanionSprite后续读取最新状态。
      blink = true;
    } else {
      // spriteFrame更新为 `step % frameCount`，确保CompanionSprite后续读取最新状态。
      spriteFrame = step % frameCount;
    }
  }
  // 请求体保存`renderSprite`，供Companion Sprite后续处理使用。
  const body = renderSprite(companion, spriteFrame).map(line => blink ? line.replaceAll(companion.eye, '-') : line);
  // sprite读取 `heartFrame ? [heartFrame, ...body] : body` 对应条目，后续围绕该成员继续处理。
  const sprite = heartFrame ? [heartFrame, ...body] : body;

  // Name row doubles as hint row — unfocused shows dim name + ↓ discovery,
  // focused shows inverse name. The enter-to-open hint lives in
  // PromptInputFooter's right column so this row stays one line and the
  // sprite doesn't jump up when selected. flexShrink=0 stops the
  // inline-bubble row wrapper from squeezing the sprite to fit.
  // spriteColumn保存`<Box flexDirection="column" flexShrink={0} alignItems="ce...`，供Companion Sprite后续判断或输出使用。
  const spriteColumn = <Box flexDirection="column" flexShrink={0} alignItems="center" width={colWidth}>
      {/* 这个回调绑定到 {sprite.map((line, i) => <Text key={i} color={i === 0 && heartFrame ? 'autoAccept' :…，负责Companion Sprite在该局部场景下的响应。 */}
      {sprite.map((line, i) => <Text key={i} color={i === 0 && heartFrame ? 'autoAccept' : color}>
          {line}
        </Text>)}
      <Text italic bold={focused} dimColor={!focused} color={focused ? color : undefined} inverse={focused}>
        {focused ? ` ${companion.name} ` : companion.name}
      </Text>
    </Box>;
  // reaction缺失时提前走兜底路径，避免Companion Sprite继续依赖无效输入。
  if (!reaction) {
    // 返回 `<Box paddingX={1}>{spriteColumn}</Box>`，作为Companion Sprite这次计算的结果。
    return <Box paddingX={1}>{spriteColumn}</Box>;
  }

  // Fullscreen: bubble renders separately via CompanionFloatingBubble in
  // FullscreenLayout's bottomFloat slot (the bottom slot's overflowY:hidden
  // would clip a position:absolute overlay here). Sprite body only.
  // Non-fullscreen: bubble sits inline beside the sprite (input shrinks)
  // because floating into Static scrollback can't be cleared.
  // 满足 `isFullscreenActive()` 时，Companion Sprite执行该分支。
  if (isFullscreenActive()) {
    // 返回 `<Box paddingX={1}>{spriteColumn}</Box>`，作为Companion Sprite这次计算的结果。
    return <Box paddingX={1}>{spriteColumn}</Box>;
  }
  // 返回 `<Box flexDirection="row" alignItems="flex-end" paddingX={1} flexShrink=...`，作为Companion Sprite这次计算的结果。
  return <Box flexDirection="row" alignItems="flex-end" paddingX={1} flexShrink={0}>
      <SpeechBubble text={reaction} color={color} fading={fading} tail="right" />
      {spriteColumn}
    </Box>;
}

// Floating bubble overlay for fullscreen mode. Mounted in FullscreenLayout's
// bottomFloat slot (outside the overflowY:hidden clip) so it can extend into
// the ScrollBox region. CompanionSprite owns the clear-after-10s timer; this
// just reads companionReaction and renders the fade.
// CompanionFloatingBubble 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CompanionFloatingBubble() {
  // $保存`_c`，供Companion Sprite后续处理使用。
  const $ = _c(8);
  // reaction保存`useAppState`，供Companion Sprite后续处理使用。
  const reaction = useAppState(_temp);
  // t0 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== reaction) {
    // t0 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t0 = {
      tick: 0,
      forReaction: reaction
    };
    // $[0] 缓存 `reaction`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = reaction;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // 临时值 t1 由 React state 持有，setTick 会在用户操作或异步结果返回时触发刷新。
  const [t1, setTick] = useState(t0);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tick,
    forReaction
  } = t1;
  // `reaction` 与 `forReaction` 不一致时刷新派生状态，避免使用过期结果。
  if (reaction !== forReaction) {
    // setTick 写入新的状态值，使Companion Sprite后续读取保持一致。
    setTick({
      tick: 0,
      forReaction: reaction
    });
  }
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[reaction]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== reaction) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // reaction缺失时提前走兜底路径，避免Companion Sprite继续依赖无效输入。
      if (!reaction) {
        // Companion Sprite在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // timer保存`setInterval`，供Companion Sprite后续处理使用。
      const timer = setInterval(_temp3, TICK_MS, setTick);
      // 返回 `() => clearInterval(timer)`，作为Companion Sprite这次计算的结果。
      return () => clearInterval(timer);
    };
    // t3 暂存 `[reaction]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [reaction];
    // $[2] 缓存 `reaction`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = reaction;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 调用 useEffect，触发Companion Sprite此处需要的副作用。
  useEffect(t2, t3);
  // 组合条件 `!isBuddyEnabled() || !reaction` 成立时，Companion Sprite才启用这条专门路径。
  if (!isBuddyEnabled() || !reaction) {
    // 返回 `null`，作为Companion Sprite这次计算的结果。
    return null;
  }
  // companion读取`getCompanion`，供Companion Sprite后续处理使用。
  const companion = getCompanion();
  // 组合条件 `!companion || getGlobalConfig().companionMuted` 成立时，Companion Sprite才启用这条专门路径。
  if (!companion || getGlobalConfig().companionMuted) {
    // 返回 `null`，作为Companion Sprite这次计算的结果。
    return null;
  }
  // 临时值 t4 命名 `tick >= BUBBLE_SHOW - FADE_WINDOW`，让后续代码直接表达这个值的用途。
  const t4 = tick >= BUBBLE_SHOW - FADE_WINDOW;
  // t5 暂存 `<SpeechBubble text={reaction} color={RARITY_COLORS[compan...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== reaction || $[6] !== t4) {
    // t5 暂存 `<SpeechBubble text={reaction} color={RARITY_COLORS[compan...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <SpeechBubble text={reaction} color={RARITY_COLORS[companion.rarity]} fading={t4} tail="down" />;
    // $[5] 缓存 `reaction`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = reaction;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // 返回 `t5`，作为Companion Sprite这次计算的结果。
  return t5;
}
// _temp3 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(set) {
  // 返回 `set(_temp2)`，作为Companion Sprite这次计算的结果。
  return set(_temp2);
}
// _temp2 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回结构化结果，集中表达Companion Sprite已经整理出的状态。
  return {
    ...s_0,
    tick: s_0.tick + 1
  };
}
// _temp 封装CompanionSprite的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.companionReaction`，作为Companion Sprite这次计算的结果。
  return s.companionReaction;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiZmlndXJlcyIsIlJlYWN0IiwidXNlRWZmZWN0IiwidXNlUmVmIiwidXNlU3RhdGUiLCJ1c2VUZXJtaW5hbFNpemUiLCJzdHJpbmdXaWR0aCIsIkJveCIsIlRleHQiLCJ1c2VBcHBTdGF0ZSIsInVzZVNldEFwcFN0YXRlIiwiQXBwU3RhdGUiLCJnZXRHbG9iYWxDb25maWciLCJpc0Z1bGxzY3JlZW5BY3RpdmUiLCJUaGVtZSIsImdldENvbXBhbmlvbiIsInJlbmRlckZhY2UiLCJyZW5kZXJTcHJpdGUiLCJzcHJpdGVGcmFtZUNvdW50IiwiUkFSSVRZX0NPTE9SUyIsIlRJQ0tfTVMiLCJCVUJCTEVfU0hPVyIsIkZBREVfV0lORE9XIiwiUEVUX0JVUlNUX01TIiwiSURMRV9TRVFVRU5DRSIsIkgiLCJoZWFydCIsIlBFVF9IRUFSVFMiLCJ3cmFwIiwidGV4dCIsIndpZHRoIiwid29yZHMiLCJzcGxpdCIsImxpbmVzIiwiY3VyIiwidyIsImxlbmd0aCIsInB1c2giLCJTcGVlY2hCdWJibGUiLCJ0MCIsIiQiLCJfYyIsImNvbG9yIiwiZmFkaW5nIiwidGFpbCIsIlQwIiwiYm9yZGVyQ29sb3IiLCJ0MSIsInQyIiwidDMiLCJ0NCIsInQ1IiwidDYiLCJ0NyIsImwiLCJpIiwidW5kZWZpbmVkIiwibWFwIiwiYnViYmxlIiwidDgiLCJ0OSIsIk1JTl9DT0xTX0ZPUl9GVUxMX1NQUklURSIsIlNQUklURV9CT0RZX1dJRFRIIiwiTkFNRV9ST1dfUEFEIiwiU1BSSVRFX1BBRERJTkdfWCIsIkJVQkJMRV9XSURUSCIsIk5BUlJPV19RVUlQX0NBUCIsInNwcml0ZUNvbFdpZHRoIiwibmFtZVdpZHRoIiwiTWF0aCIsIm1heCIsImNvbXBhbmlvblJlc2VydmVkQ29sdW1ucyIsInRlcm1pbmFsQ29sdW1ucyIsInNwZWFraW5nIiwiY29tcGFuaW9uIiwiY29tcGFuaW9uTXV0ZWQiLCJuYW1lIiwiQ29tcGFuaW9uU3ByaXRlIiwiUmVhY3ROb2RlIiwicmVhY3Rpb24iLCJzIiwiY29tcGFuaW9uUmVhY3Rpb24iLCJwZXRBdCIsImNvbXBhbmlvblBldEF0IiwiZm9jdXNlZCIsImZvb3RlclNlbGVjdGlvbiIsInNldEFwcFN0YXRlIiwiY29sdW1ucyIsInRpY2siLCJzZXRUaWNrIiwibGFzdFNwb2tlVGljayIsInBldFN0YXJ0VGljayIsImZvclBldEF0Iiwic2V0UGV0U3RhcnQiLCJ0aW1lciIsInNldEludGVydmFsIiwic2V0VCIsInQiLCJjbGVhckludGVydmFsIiwiY3VycmVudCIsInNldFRpbWVvdXQiLCJzZXRBIiwicHJldiIsImNsZWFyVGltZW91dCIsInJhcml0eSIsImNvbFdpZHRoIiwiYnViYmxlQWdlIiwicGV0QWdlIiwiSW5maW5pdHkiLCJwZXR0aW5nIiwicXVpcCIsInNsaWNlIiwibGFiZWwiLCJmcmFtZUNvdW50Iiwic3BlY2llcyIsImhlYXJ0RnJhbWUiLCJzcHJpdGVGcmFtZSIsImJsaW5rIiwic3RlcCIsImJvZHkiLCJsaW5lIiwicmVwbGFjZUFsbCIsImV5ZSIsInNwcml0ZSIsInNwcml0ZUNvbHVtbiIsIkNvbXBhbmlvbkZsb2F0aW5nQnViYmxlIiwiX3RlbXAiLCJmb3JSZWFjdGlvbiIsIl90ZW1wMyIsInNldCIsIl90ZW1wMiIsInNfMCJdLCJzb3VyY2VzIjpbIkNvbXBhbmlvblNwcml0ZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmVhdHVyZSB9IGZyb20gJ2J1bjpidW5kbGUnXG5pbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSwgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgQXBwU3RhdGUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdGF0ZVN0b3JlLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHsgaXNGdWxsc2NyZWVuQWN0aXZlIH0gZnJvbSAnLi4vdXRpbHMvZnVsbHNjcmVlbi5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWUgfSBmcm9tICcuLi91dGlscy90aGVtZS5qcydcbmltcG9ydCB7IGdldENvbXBhbmlvbiB9IGZyb20gJy4vY29tcGFuaW9uLmpzJ1xuaW1wb3J0IHsgcmVuZGVyRmFjZSwgcmVuZGVyU3ByaXRlLCBzcHJpdGVGcmFtZUNvdW50IH0gZnJvbSAnLi9zcHJpdGVzLmpzJ1xuaW1wb3J0IHsgUkFSSVRZX0NPTE9SUyB9IGZyb20gJy4vdHlwZXMuanMnXG5cbmNvbnN0IFRJQ0tfTVMgPSA1MDBcbmNvbnN0IEJVQkJMRV9TSE9XID0gMjAgLy8gdGlja3Mg4oaSIH4xMHMgYXQgNTAwbXNcbmNvbnN0IEZBREVfV0lORE9XID0gNiAvLyBsYXN0IH4zcyB0aGUgYnViYmxlIGRpbXMgc28geW91IGtub3cgaXQncyBhYm91dCB0byBnb1xuY29uc3QgUEVUX0JVUlNUX01TID0gMjUwMCAvLyBob3cgbG9uZyBoZWFydHMgZmxvYXQgYWZ0ZXIgL2J1ZGR5IHBldFxuXG4vLyBJZGxlIHNlcXVlbmNlOiBtb3N0bHkgcmVzdCAoZnJhbWUgMCksIG9jY2FzaW9uYWwgZmlkZ2V0IChmcmFtZXMgMS0yKSwgcmFyZSBibGluay5cbi8vIFNlcXVlbmNlIGluZGljZXMgbWFwIHRvIHNwcml0ZSBmcmFtZXM7IC0xIG1lYW5zIFwiYmxpbmsgb24gZnJhbWUgMFwiLlxuY29uc3QgSURMRV9TRVFVRU5DRSA9IFswLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAtMSwgMCwgMCwgMiwgMCwgMCwgMF1cblxuLy8gSGVhcnRzIGZsb2F0IHVwLWFuZC1vdXQgb3ZlciA1IHRpY2tzICh+Mi41cykuIFByZXBlbmRlZCBhYm92ZSB0aGUgc3ByaXRlLlxuY29uc3QgSCA9IGZpZ3VyZXMuaGVhcnRcbmNvbnN0IFBFVF9IRUFSVFMgPSBbXG4gIGAgICAke0h9ICAgICR7SH0gICBgLFxuICBgICAke0h9ICAke0h9ICAgJHtIfSAgYCxcbiAgYCAke0h9ICAgJHtIfSAgJHtIfSAgIGAsXG4gIGAke0h9ICAke0h9ICAgICAgJHtIfSBgLFxuICAnwrcgICAgwrcgICDCtyAgJyxcbl1cblxuZnVuY3Rpb24gd3JhcCh0ZXh0OiBzdHJpbmcsIHdpZHRoOiBudW1iZXIpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgnICcpXG4gIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdXG4gIGxldCBjdXIgPSAnJ1xuICBmb3IgKGNvbnN0IHcgb2Ygd29yZHMpIHtcbiAgICBpZiAoY3VyLmxlbmd0aCArIHcubGVuZ3RoICsgMSA+IHdpZHRoICYmIGN1cikge1xuICAgICAgbGluZXMucHVzaChjdXIpXG4gICAgICBjdXIgPSB3XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1ciA9IGN1ciA/IGAke2N1cn0gJHt3fWAgOiB3XG4gICAgfVxuICB9XG4gIGlmIChjdXIpIGxpbmVzLnB1c2goY3VyKVxuICByZXR1cm4gbGluZXNcbn1cblxuZnVuY3Rpb24gU3BlZWNoQnViYmxlKHtcbiAgdGV4dCxcbiAgY29sb3IsXG4gIGZhZGluZyxcbiAgdGFpbCxcbn06IHtcbiAgdGV4dDogc3RyaW5nXG4gIGNvbG9yOiBrZXlvZiBUaGVtZVxuICBmYWRpbmc6IGJvb2xlYW5cbiAgdGFpbDogJ2Rvd24nIHwgJ3JpZ2h0J1xufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGxpbmVzID0gd3JhcCh0ZXh0LCAzMClcbiAgY29uc3QgYm9yZGVyQ29sb3IgPSBmYWRpbmcgPyAnaW5hY3RpdmUnIDogY29sb3JcbiAgY29uc3QgYnViYmxlID0gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgYm9yZGVyU3R5bGU9XCJyb3VuZFwiXG4gICAgICBib3JkZXJDb2xvcj17Ym9yZGVyQ29sb3J9XG4gICAgICBwYWRkaW5nWD17MX1cbiAgICAgIHdpZHRoPXszNH1cbiAgICA+XG4gICAgICB7bGluZXMubWFwKChsLCBpKSA9PiAoXG4gICAgICAgIDxUZXh0XG4gICAgICAgICAga2V5PXtpfVxuICAgICAgICAgIGl0YWxpY1xuICAgICAgICAgIGRpbUNvbG9yPXshZmFkaW5nfVxuICAgICAgICAgIGNvbG9yPXtmYWRpbmcgPyAnaW5hY3RpdmUnIDogdW5kZWZpbmVkfVxuICAgICAgICA+XG4gICAgICAgICAge2x9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICkpfVxuICAgIDwvQm94PlxuICApXG4gIGlmICh0YWlsID09PSAncmlnaHQnKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiIGFsaWduSXRlbXM9XCJjZW50ZXJcIj5cbiAgICAgICAge2J1YmJsZX1cbiAgICAgICAgPFRleHQgY29sb3I9e2JvcmRlckNvbG9yfT7ilIA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBhbGlnbkl0ZW1zPVwiZmxleC1lbmRcIiBtYXJnaW5SaWdodD17MX0+XG4gICAgICB7YnViYmxlfVxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgYWxpZ25JdGVtcz1cImZsZXgtZW5kXCIgcGFkZGluZ1JpZ2h0PXs2fT5cbiAgICAgICAgPFRleHQgY29sb3I9e2JvcmRlckNvbG9yfT7ilbIgPC9UZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj17Ym9yZGVyQ29sb3J9PuKVsjwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG5cbmV4cG9ydCBjb25zdCBNSU5fQ09MU19GT1JfRlVMTF9TUFJJVEUgPSAxMDBcbmNvbnN0IFNQUklURV9CT0RZX1dJRFRIID0gMTJcbmNvbnN0IE5BTUVfUk9XX1BBRCA9IDIgLy8gZm9jdXNlZCBzdGF0ZSB3cmFwcyBuYW1lIGluIHNwYWNlczogYCBuYW1lIGBcbmNvbnN0IFNQUklURV9QQURESU5HX1ggPSAyXG5jb25zdCBCVUJCTEVfV0lEVEggPSAzNiAvLyBTcGVlY2hCdWJibGUgYm94ICgzNCkgKyB0YWlsIGNvbHVtblxuY29uc3QgTkFSUk9XX1FVSVBfQ0FQID0gMjRcblxuZnVuY3Rpb24gc3ByaXRlQ29sV2lkdGgobmFtZVdpZHRoOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5tYXgoU1BSSVRFX0JPRFlfV0lEVEgsIG5hbWVXaWR0aCArIE5BTUVfUk9XX1BBRClcbn1cblxuLy8gV2lkdGggdGhlIHNwcml0ZSBhcmVhIGNvbnN1bWVzLiBQcm9tcHRJbnB1dCBzdWJ0cmFjdHMgdGhpcyBzbyB0ZXh0IHdyYXBzXG4vLyBjb3JyZWN0bHkuIEluIGZ1bGxzY3JlZW4gdGhlIGJ1YmJsZSBmbG9hdHMgb3ZlciBzY3JvbGxiYWNrIChubyBleHRyYVxuLy8gd2lkdGgpOyBpbiBub24tZnVsbHNjcmVlbiBpdCBzaXRzIGlubGluZSBhbmQgbmVlZHMgQlVCQkxFX1dJRFRIIG1vcmUuXG4vLyBOYXJyb3cgdGVybWluYWxzOiAwIOKAlCBSRVBMLnRzeCBzdGFja3MgdGhlIG9uZS1saW5lciBvbiBpdHMgb3duIHJvd1xuLy8gKGFib3ZlIGlucHV0IGluIGZ1bGxzY3JlZW4sIGJlbG93IGluIHNjcm9sbGJhY2spLCBzbyBubyByZXNlcnZhdGlvbi5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYW5pb25SZXNlcnZlZENvbHVtbnMoXG4gIHRlcm1pbmFsQ29sdW1uczogbnVtYmVyLFxuICBzcGVha2luZzogYm9vbGVhbixcbik6IG51bWJlciB7XG4gIGlmICghZmVhdHVyZSgnQlVERFknKSkgcmV0dXJuIDBcbiAgY29uc3QgY29tcGFuaW9uID0gZ2V0Q29tcGFuaW9uKClcbiAgaWYgKCFjb21wYW5pb24gfHwgZ2V0R2xvYmFsQ29uZmlnKCkuY29tcGFuaW9uTXV0ZWQpIHJldHVybiAwXG4gIGlmICh0ZXJtaW5hbENvbHVtbnMgPCBNSU5fQ09MU19GT1JfRlVMTF9TUFJJVEUpIHJldHVybiAwXG4gIGNvbnN0IG5hbWVXaWR0aCA9IHN0cmluZ1dpZHRoKGNvbXBhbmlvbi5uYW1lKVxuICBjb25zdCBidWJibGUgPSBzcGVha2luZyAmJiAhaXNGdWxsc2NyZWVuQWN0aXZlKCkgPyBCVUJCTEVfV0lEVEggOiAwXG4gIHJldHVybiBzcHJpdGVDb2xXaWR0aChuYW1lV2lkdGgpICsgU1BSSVRFX1BBRERJTkdfWCArIGJ1YmJsZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gQ29tcGFuaW9uU3ByaXRlKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHJlYWN0aW9uID0gdXNlQXBwU3RhdGUocyA9PiBzLmNvbXBhbmlvblJlYWN0aW9uKVxuICBjb25zdCBwZXRBdCA9IHVzZUFwcFN0YXRlKHMgPT4gcy5jb21wYW5pb25QZXRBdClcbiAgY29uc3QgZm9jdXNlZCA9IHVzZUFwcFN0YXRlKHMgPT4gcy5mb290ZXJTZWxlY3Rpb24gPT09ICdjb21wYW5pb24nKVxuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcbiAgY29uc3QgeyBjb2x1bW5zIH0gPSB1c2VUZXJtaW5hbFNpemUoKVxuICBjb25zdCBbdGljaywgc2V0VGlja10gPSB1c2VTdGF0ZSgwKVxuICBjb25zdCBsYXN0U3Bva2VUaWNrID0gdXNlUmVmKDApXG4gIC8vIFN5bmMtZHVyaW5nLXJlbmRlciAobm90IHVzZUVmZmVjdCkgc28gdGhlIGZpcnN0IHBvc3QtcGV0IHJlbmRlciBhbHJlYWR5XG4gIC8vIGhhcyBwZXRTdGFydFRpY2s9dGljayBhbmQgcGV0QWdlPTAg4oCUIG90aGVyd2lzZSBmcmFtZSAwIGlzIHNraXBwZWQuXG4gIGNvbnN0IFt7IHBldFN0YXJ0VGljaywgZm9yUGV0QXQgfSwgc2V0UGV0U3RhcnRdID0gdXNlU3RhdGUoe1xuICAgIHBldFN0YXJ0VGljazogMCxcbiAgICBmb3JQZXRBdDogcGV0QXQsXG4gIH0pXG4gIGlmIChwZXRBdCAhPT0gZm9yUGV0QXQpIHtcbiAgICBzZXRQZXRTdGFydCh7IHBldFN0YXJ0VGljazogdGljaywgZm9yUGV0QXQ6IHBldEF0IH0pXG4gIH1cblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoXG4gICAgICBzZXRUID0+IHNldFQoKHQ6IG51bWJlcikgPT4gdCArIDEpLFxuICAgICAgVElDS19NUyxcbiAgICAgIHNldFRpY2ssXG4gICAgKVxuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVyKVxuICB9LCBbXSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghcmVhY3Rpb24pIHJldHVyblxuICAgIGxhc3RTcG9rZVRpY2suY3VycmVudCA9IHRpY2tcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoXG4gICAgICBzZXRBID0+XG4gICAgICAgIHNldEEoKHByZXY6IEFwcFN0YXRlKSA9PlxuICAgICAgICAgIHByZXYuY29tcGFuaW9uUmVhY3Rpb24gPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBwcmV2XG4gICAgICAgICAgICA6IHsgLi4ucHJldiwgY29tcGFuaW9uUmVhY3Rpb246IHVuZGVmaW5lZCB9LFxuICAgICAgICApLFxuICAgICAgQlVCQkxFX1NIT1cgKiBUSUNLX01TLFxuICAgICAgc2V0QXBwU3RhdGUsXG4gICAgKVxuICAgIHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwcyAtLSB0aWNrIGludGVudGlvbmFsbHkgY2FwdHVyZWQgYXQgcmVhY3Rpb24tY2hhbmdlLCBub3QgdHJhY2tlZFxuICB9LCBbcmVhY3Rpb24sIHNldEFwcFN0YXRlXSlcblxuICBpZiAoIWZlYXR1cmUoJ0JVRERZJykpIHJldHVybiBudWxsXG4gIGNvbnN0IGNvbXBhbmlvbiA9IGdldENvbXBhbmlvbigpXG4gIGlmICghY29tcGFuaW9uIHx8IGdldEdsb2JhbENvbmZpZygpLmNvbXBhbmlvbk11dGVkKSByZXR1cm4gbnVsbFxuXG4gIGNvbnN0IGNvbG9yID0gUkFSSVRZX0NPTE9SU1tjb21wYW5pb24ucmFyaXR5XVxuICBjb25zdCBjb2xXaWR0aCA9IHNwcml0ZUNvbFdpZHRoKHN0cmluZ1dpZHRoKGNvbXBhbmlvbi5uYW1lKSlcblxuICBjb25zdCBidWJibGVBZ2UgPSByZWFjdGlvbiA/IHRpY2sgLSBsYXN0U3Bva2VUaWNrLmN1cnJlbnQgOiAwXG4gIGNvbnN0IGZhZGluZyA9XG4gICAgcmVhY3Rpb24gIT09IHVuZGVmaW5lZCAmJiBidWJibGVBZ2UgPj0gQlVCQkxFX1NIT1cgLSBGQURFX1dJTkRPV1xuXG4gIGNvbnN0IHBldEFnZSA9IHBldEF0ID8gdGljayAtIHBldFN0YXJ0VGljayA6IEluZmluaXR5XG4gIGNvbnN0IHBldHRpbmcgPSBwZXRBZ2UgKiBUSUNLX01TIDwgUEVUX0JVUlNUX01TXG5cbiAgLy8gTmFycm93IHRlcm1pbmFsczogY29sbGFwc2UgdG8gb25lLWxpbmUgZmFjZS4gV2hlbiBzcGVha2luZywgdGhlIHF1aXBcbiAgLy8gcmVwbGFjZXMgdGhlIG5hbWUgYmVzaWRlIHRoZSBmYWNlIChubyByb29tIGZvciBhIGJ1YmJsZSkuXG4gIGlmIChjb2x1bW5zIDwgTUlOX0NPTFNfRk9SX0ZVTExfU1BSSVRFKSB7XG4gICAgY29uc3QgcXVpcCA9XG4gICAgICByZWFjdGlvbiAmJiByZWFjdGlvbi5sZW5ndGggPiBOQVJST1dfUVVJUF9DQVBcbiAgICAgICAgPyByZWFjdGlvbi5zbGljZSgwLCBOQVJST1dfUVVJUF9DQVAgLSAxKSArICfigKYnXG4gICAgICAgIDogcmVhY3Rpb25cbiAgICBjb25zdCBsYWJlbCA9IHF1aXBcbiAgICAgID8gYFwiJHtxdWlwfVwiYFxuICAgICAgOiBmb2N1c2VkXG4gICAgICAgID8gYCAke2NvbXBhbmlvbi5uYW1lfSBgXG4gICAgICAgIDogY29tcGFuaW9uLm5hbWVcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBwYWRkaW5nWD17MX0gYWxpZ25TZWxmPVwiZmxleC1lbmRcIj5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAge3BldHRpbmcgJiYgPFRleHQgY29sb3I9XCJhdXRvQWNjZXB0XCI+e2ZpZ3VyZXMuaGVhcnR9IDwvVGV4dD59XG4gICAgICAgICAgPFRleHQgYm9sZCBjb2xvcj17Y29sb3J9PlxuICAgICAgICAgICAge3JlbmRlckZhY2UoY29tcGFuaW9uKX1cbiAgICAgICAgICA8L1RleHQ+eycgJ31cbiAgICAgICAgICA8VGV4dFxuICAgICAgICAgICAgaXRhbGljXG4gICAgICAgICAgICBkaW1Db2xvcj17IWZvY3VzZWQgJiYgIXJlYWN0aW9ufVxuICAgICAgICAgICAgYm9sZD17Zm9jdXNlZH1cbiAgICAgICAgICAgIGludmVyc2U9e2ZvY3VzZWQgJiYgIXJlYWN0aW9ufVxuICAgICAgICAgICAgY29sb3I9e1xuICAgICAgICAgICAgICByZWFjdGlvblxuICAgICAgICAgICAgICAgID8gZmFkaW5nXG4gICAgICAgICAgICAgICAgICA/ICdpbmFjdGl2ZSdcbiAgICAgICAgICAgICAgICAgIDogY29sb3JcbiAgICAgICAgICAgICAgICA6IGZvY3VzZWRcbiAgICAgICAgICAgICAgICAgID8gY29sb3JcbiAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgPlxuICAgICAgICAgICAge2xhYmVsfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG4gIGNvbnN0IGZyYW1lQ291bnQgPSBzcHJpdGVGcmFtZUNvdW50KGNvbXBhbmlvbi5zcGVjaWVzKVxuICBjb25zdCBoZWFydEZyYW1lID0gcGV0dGluZyA/IFBFVF9IRUFSVFNbcGV0QWdlICUgUEVUX0hFQVJUUy5sZW5ndGhdIDogbnVsbFxuXG4gIGxldCBzcHJpdGVGcmFtZTogbnVtYmVyXG4gIGxldCBibGluayA9IGZhbHNlXG4gIGlmIChyZWFjdGlvbiB8fCBwZXR0aW5nKSB7XG4gICAgLy8gRXhjaXRlZDogY3ljbGUgYWxsIGZpZGdldCBmcmFtZXMgZmFzdFxuICAgIHNwcml0ZUZyYW1lID0gdGljayAlIGZyYW1lQ291bnRcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzdGVwID0gSURMRV9TRVFVRU5DRVt0aWNrICUgSURMRV9TRVFVRU5DRS5sZW5ndGhdIVxuICAgIGlmIChzdGVwID09PSAtMSkge1xuICAgICAgc3ByaXRlRnJhbWUgPSAwXG4gICAgICBibGluayA9IHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgc3ByaXRlRnJhbWUgPSBzdGVwICUgZnJhbWVDb3VudFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGJvZHkgPSByZW5kZXJTcHJpdGUoY29tcGFuaW9uLCBzcHJpdGVGcmFtZSkubWFwKGxpbmUgPT5cbiAgICBibGluayA/IGxpbmUucmVwbGFjZUFsbChjb21wYW5pb24uZXllLCAnLScpIDogbGluZSxcbiAgKVxuICBjb25zdCBzcHJpdGUgPSBoZWFydEZyYW1lID8gW2hlYXJ0RnJhbWUsIC4uLmJvZHldIDogYm9keVxuXG4gIC8vIE5hbWUgcm93IGRvdWJsZXMgYXMgaGludCByb3cg4oCUIHVuZm9jdXNlZCBzaG93cyBkaW0gbmFtZSArIOKGkyBkaXNjb3ZlcnksXG4gIC8vIGZvY3VzZWQgc2hvd3MgaW52ZXJzZSBuYW1lLiBUaGUgZW50ZXItdG8tb3BlbiBoaW50IGxpdmVzIGluXG4gIC8vIFByb21wdElucHV0Rm9vdGVyJ3MgcmlnaHQgY29sdW1uIHNvIHRoaXMgcm93IHN0YXlzIG9uZSBsaW5lIGFuZCB0aGVcbiAgLy8gc3ByaXRlIGRvZXNuJ3QganVtcCB1cCB3aGVuIHNlbGVjdGVkLiBmbGV4U2hyaW5rPTAgc3RvcHMgdGhlXG4gIC8vIGlubGluZS1idWJibGUgcm93IHdyYXBwZXIgZnJvbSBzcXVlZXppbmcgdGhlIHNwcml0ZSB0byBmaXQuXG4gIGNvbnN0IHNwcml0ZUNvbHVtbiA9IChcbiAgICA8Qm94XG4gICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgIGZsZXhTaHJpbms9ezB9XG4gICAgICBhbGlnbkl0ZW1zPVwiY2VudGVyXCJcbiAgICAgIHdpZHRoPXtjb2xXaWR0aH1cbiAgICA+XG4gICAgICB7c3ByaXRlLm1hcCgobGluZSwgaSkgPT4gKFxuICAgICAgICA8VGV4dCBrZXk9e2l9IGNvbG9yPXtpID09PSAwICYmIGhlYXJ0RnJhbWUgPyAnYXV0b0FjY2VwdCcgOiBjb2xvcn0+XG4gICAgICAgICAge2xpbmV9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICkpfVxuICAgICAgPFRleHRcbiAgICAgICAgaXRhbGljXG4gICAgICAgIGJvbGQ9e2ZvY3VzZWR9XG4gICAgICAgIGRpbUNvbG9yPXshZm9jdXNlZH1cbiAgICAgICAgY29sb3I9e2ZvY3VzZWQgPyBjb2xvciA6IHVuZGVmaW5lZH1cbiAgICAgICAgaW52ZXJzZT17Zm9jdXNlZH1cbiAgICAgID5cbiAgICAgICAge2ZvY3VzZWQgPyBgICR7Y29tcGFuaW9uLm5hbWV9IGAgOiBjb21wYW5pb24ubmFtZX1cbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxuXG4gIGlmICghcmVhY3Rpb24pIHtcbiAgICByZXR1cm4gPEJveCBwYWRkaW5nWD17MX0+e3Nwcml0ZUNvbHVtbn08L0JveD5cbiAgfVxuXG4gIC8vIEZ1bGxzY3JlZW46IGJ1YmJsZSByZW5kZXJzIHNlcGFyYXRlbHkgdmlhIENvbXBhbmlvbkZsb2F0aW5nQnViYmxlIGluXG4gIC8vIEZ1bGxzY3JlZW5MYXlvdXQncyBib3R0b21GbG9hdCBzbG90ICh0aGUgYm90dG9tIHNsb3QncyBvdmVyZmxvd1k6aGlkZGVuXG4gIC8vIHdvdWxkIGNsaXAgYSBwb3NpdGlvbjphYnNvbHV0ZSBvdmVybGF5IGhlcmUpLiBTcHJpdGUgYm9keSBvbmx5LlxuICAvLyBOb24tZnVsbHNjcmVlbjogYnViYmxlIHNpdHMgaW5saW5lIGJlc2lkZSB0aGUgc3ByaXRlIChpbnB1dCBzaHJpbmtzKVxuICAvLyBiZWNhdXNlIGZsb2F0aW5nIGludG8gU3RhdGljIHNjcm9sbGJhY2sgY2FuJ3QgYmUgY2xlYXJlZC5cbiAgaWYgKGlzRnVsbHNjcmVlbkFjdGl2ZSgpKSB7XG4gICAgcmV0dXJuIDxCb3ggcGFkZGluZ1g9ezF9PntzcHJpdGVDb2x1bW59PC9Cb3g+XG4gIH1cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIiBhbGlnbkl0ZW1zPVwiZmxleC1lbmRcIiBwYWRkaW5nWD17MX0gZmxleFNocmluaz17MH0+XG4gICAgICA8U3BlZWNoQnViYmxlXG4gICAgICAgIHRleHQ9e3JlYWN0aW9ufVxuICAgICAgICBjb2xvcj17Y29sb3J9XG4gICAgICAgIGZhZGluZz17ZmFkaW5nfVxuICAgICAgICB0YWlsPVwicmlnaHRcIlxuICAgICAgLz5cbiAgICAgIHtzcHJpdGVDb2x1bW59XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuLy8gRmxvYXRpbmcgYnViYmxlIG92ZXJsYXkgZm9yIGZ1bGxzY3JlZW4gbW9kZS4gTW91bnRlZCBpbiBGdWxsc2NyZWVuTGF5b3V0J3Ncbi8vIGJvdHRvbUZsb2F0IHNsb3QgKG91dHNpZGUgdGhlIG92ZXJmbG93WTpoaWRkZW4gY2xpcCkgc28gaXQgY2FuIGV4dGVuZCBpbnRvXG4vLyB0aGUgU2Nyb2xsQm94IHJlZ2lvbi4gQ29tcGFuaW9uU3ByaXRlIG93bnMgdGhlIGNsZWFyLWFmdGVyLTEwcyB0aW1lcjsgdGhpc1xuLy8ganVzdCByZWFkcyBjb21wYW5pb25SZWFjdGlvbiBhbmQgcmVuZGVycyB0aGUgZmFkZS5cbmV4cG9ydCBmdW5jdGlvbiBDb21wYW5pb25GbG9hdGluZ0J1YmJsZSgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCByZWFjdGlvbiA9IHVzZUFwcFN0YXRlKHMgPT4gcy5jb21wYW5pb25SZWFjdGlvbilcbiAgY29uc3QgW3sgdGljaywgZm9yUmVhY3Rpb24gfSwgc2V0VGlja10gPSB1c2VTdGF0ZSh7XG4gICAgdGljazogMCxcbiAgICBmb3JSZWFjdGlvbjogcmVhY3Rpb24sXG4gIH0pXG5cbiAgLy8gUmVzZXQgdGljayBzeW5jaHJvbm91c2x5IHdoZW4gcmVhY3Rpb24gY2hhbmdlcyAobm90IGluIHVzZUVmZmVjdCwgd2hpY2hcbiAgLy8gcnVucyBwb3N0LXJlbmRlciBhbmQgd291bGQgc2hvdyBvbmUgc3RhbGUtZmFkZWQgZnJhbWUpLiBTdG9yaW5nIHRoZVxuICAvLyByZWFjdGlvbiB0aGUgdGljayBpcyBjb3VudGluZyBGT1IgYWxvbmdzaWRlIHRoZSB0aWNrIGl0c2VsZiBtZWFucyB0aGVcbiAgLy8gZmFkZSBjb21wdXRhdGlvbiBuZXZlciBzZWVzIGEgdGljayBmcm9tIGEgcHJldmlvdXMgcmVhY3Rpb24uXG4gIGlmIChyZWFjdGlvbiAhPT0gZm9yUmVhY3Rpb24pIHtcbiAgICBzZXRUaWNrKHsgdGljazogMCwgZm9yUmVhY3Rpb246IHJlYWN0aW9uIH0pXG4gIH1cblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghcmVhY3Rpb24pIHJldHVyblxuICAgIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoXG4gICAgICBzZXQgPT4gc2V0KHMgPT4gKHsgLi4ucywgdGljazogcy50aWNrICsgMSB9KSksXG4gICAgICBUSUNLX01TLFxuICAgICAgc2V0VGljayxcbiAgICApXG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwodGltZXIpXG4gIH0sIFtyZWFjdGlvbl0pXG5cbiAgaWYgKCFmZWF0dXJlKCdCVUREWScpIHx8ICFyZWFjdGlvbikgcmV0dXJuIG51bGxcbiAgY29uc3QgY29tcGFuaW9uID0gZ2V0Q29tcGFuaW9uKClcbiAgaWYgKCFjb21wYW5pb24gfHwgZ2V0R2xvYmFsQ29uZmlnKCkuY29tcGFuaW9uTXV0ZWQpIHJldHVybiBudWxsXG5cbiAgcmV0dXJuIChcbiAgICA8U3BlZWNoQnViYmxlXG4gICAgICB0ZXh0PXtyZWFjdGlvbn1cbiAgICAgIGNvbG9yPXtSQVJJVFlfQ09MT1JTW2NvbXBhbmlvbi5yYXJpdHldfVxuICAgICAgZmFkaW5nPXt0aWNrID49IEJVQkJMRV9TSE9XIC0gRkFERV9XSU5ET1d9XG4gICAgICB0YWlsPVwiZG93blwiXG4gICAgLz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsT0FBTyxRQUFRLFlBQVk7QUFDcEMsT0FBT0MsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBT0MsS0FBSyxJQUFJQyxTQUFTLEVBQUVDLE1BQU0sRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDMUQsU0FBU0MsZUFBZSxRQUFRLDZCQUE2QjtBQUM3RCxTQUFTQyxXQUFXLFFBQVEsdUJBQXVCO0FBQ25ELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FBU0MsV0FBVyxFQUFFQyxjQUFjLFFBQVEsc0JBQXNCO0FBQ2xFLGNBQWNDLFFBQVEsUUFBUSwyQkFBMkI7QUFDekQsU0FBU0MsZUFBZSxRQUFRLG9CQUFvQjtBQUNwRCxTQUFTQyxrQkFBa0IsUUFBUSx3QkFBd0I7QUFDM0QsY0FBY0MsS0FBSyxRQUFRLG1CQUFtQjtBQUM5QyxTQUFTQyxZQUFZLFFBQVEsZ0JBQWdCO0FBQzdDLFNBQVNDLFVBQVUsRUFBRUMsWUFBWSxFQUFFQyxnQkFBZ0IsUUFBUSxjQUFjO0FBQ3pFLFNBQVNDLGFBQWEsUUFBUSxZQUFZO0FBRTFDLE1BQU1DLE9BQU8sR0FBRyxHQUFHO0FBQ25CLE1BQU1DLFdBQVcsR0FBRyxFQUFFLEVBQUM7QUFDdkIsTUFBTUMsV0FBVyxHQUFHLENBQUMsRUFBQztBQUN0QixNQUFNQyxZQUFZLEdBQUcsSUFBSSxFQUFDOztBQUUxQjtBQUNBO0FBQ0EsTUFBTUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxF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

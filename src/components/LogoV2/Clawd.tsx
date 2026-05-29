// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js';
// ClawdPose 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClawdPose = 'default' | 'arms-up' // both arms raised (used during jump)
| 'look-left' // both pupils shifted left
| 'look-right'; // both pupils shifted right

// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  pose?: ClawdPose;
};

// Standard-terminal pose fragments. Each row is split into segments so we can
// vary only the parts that change (eyes, arms) while keeping the body/bg spans
// stable. All poses end up 9 cols wide.
//
// arms-up: the row-2 arm shapes (▝▜ / ▛▘) move to row 1 as their
// bottom-heavy mirrors (▗▟ / ▙▖) — same silhouette, one row higher.
//
// look-* use top-quadrant eye chars (▙/▟) so both eyes change from the
// default (▛/▜, bottom pupils) — otherwise only one eye would appear to move.
// Segments 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Segments = {
  /** row 1 left (no bg): optional raised arm + side */
  r1L: string;
  /** row 1 eyes (with bg): left-eye, forehead, right-eye */
  r1E: string;
  /** row 1 right (no bg): side + optional raised arm */
  r1R: string;
  /** row 2 left (no bg): arm + body curve */
  r2L: string;
  /** row 2 right (no bg): body curve + arm */
  r2R: string;
};
// POSES 集合 集中保存终端 UI 组件 Clawd要一起传递的字段。
const POSES: Record<ClawdPose, Segments> = {
  default: {
    r1L: ' ▐',
    r1E: '▛███▜',
    r1R: '▌',
    r2L: '▝▜',
    r2R: '▛▘'
  },
  'look-left': {
    r1L: ' ▐',
    r1E: '▟███▟',
    r1R: '▌',
    r2L: '▝▜',
    r2R: '▛▘'
  },
  'look-right': {
    r1L: ' ▐',
    r1E: '▙███▙',
    r1R: '▌',
    r2L: '▝▜',
    r2R: '▛▘'
  },
  'arms-up': {
    r1L: '▗▟',
    r1E: '▛███▜',
    r1R: '▙▖',
    r2L: ' ▜',
    r2R: '▛ '
  }
};

// Apple Terminal uses a bg-fill trick (see below), so only eye poses make
// sense. Arm poses fall back to default.
// APPLE_EYES 集合 集中保存终端 UI 组件 Clawd要一起传递的字段。
const APPLE_EYES: Record<ClawdPose, string> = {
  default: ' ▗   ▖ ',
  'look-left': ' ▘   ▘ ',
  'look-right': ' ▝   ▝ ',
  'arms-up': ' ▗   ▖ '
};
// Clawd 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Clawd(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(26);
  // t1 暂存 `t0 === undefined ? {} : t0` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // t1 暂存 `t0 === undefined ? {} : t0` 生成的渲染片段，后续返回路径直接复用。
    t1 = t0 === undefined ? {} : t0;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    pose: t2
  } = t1;
  // pose标记终端 UI Clawd是否启用对应路径。
  const pose = t2 === undefined ? "default" : t2;
  // 当 `env.terminal` 匹配 `"Apple_Terminal"` 时，终端渲染执行对应分支。
  if (env.terminal === "Apple_Terminal") {
    // t3 暂存 `<AppleTerminalClawd pose={pose} />` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[2] !== pose) {
      // t3 暂存 `<AppleTerminalClawd pose={pose} />` 生成的渲染片段，后续返回路径直接复用。
      t3 = <AppleTerminalClawd pose={pose} />;
      // $[2] 缓存 `pose`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = pose;
      // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[3];
    }
    // 返回 `t3`，作为终端渲染这次计算的结果。
    return t3;
  }
  // p保存`POSES[pose]`，供终端 UI Clawd后续判断或输出使用。
  const p = POSES[pose];
  // t3 暂存 `<Text color="clawd_body">{p.r1L}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== p.r1L) {
    // t3 暂存 `<Text color="clawd_body">{p.r1L}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text color="clawd_body">{p.r1L}</Text>;
    // $[4] 缓存 `p.r1L`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = p.r1L;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `<Text color="clawd_body" backgroundColor="clawd_backgroun...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== p.r1E) {
    // t4 暂存 `<Text color="clawd_body" backgroundColor="clawd_backgroun...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text color="clawd_body" backgroundColor="clawd_background">{p.r1E}</Text>;
    // $[6] 缓存 `p.r1E`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = p.r1E;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<Text color="clawd_body">{p.r1R}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== p.r1R) {
    // t5 暂存 `<Text color="clawd_body">{p.r1R}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color="clawd_body">{p.r1R}</Text>;
    // $[8] 缓存 `p.r1R`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = p.r1R;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // t6 暂存 `<Text>{t3}{t4}{t5}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t3 || $[11] !== t4 || $[12] !== t5) {
    // t6 暂存 `<Text>{t3}{t4}{t5}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text>{t3}{t4}{t5}</Text>;
    // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t3;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // t7 暂存 `<Text color="clawd_body">{p.r2L}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== p.r2L) {
    // t7 暂存 `<Text color="clawd_body">{p.r2L}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text color="clawd_body">{p.r2L}</Text>;
    // $[14] 缓存 `p.r2L`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = p.r2L;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // t8 暂存 `<Text color="clawd_body" backgroundColor="clawd_backgroun...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Text color="clawd_body" backgroundColor="clawd_backgroun...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text color="clawd_body" backgroundColor="clawd_background">█████</Text>;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[16];
  }
  // t9 暂存 `<Text color="clawd_body">{p.r2R}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== p.r2R) {
    // t9 暂存 `<Text color="clawd_body">{p.r2R}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text color="clawd_body">{p.r2R}</Text>;
    // $[17] 缓存 `p.r2R`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = p.r2R;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // t10 暂存 `<Text>{t7}{t8}{t9}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t7 || $[20] !== t9) {
    // t10 暂存 `<Text>{t7}{t8}{t9}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text>{t7}{t8}{t9}</Text>;
    // $[19] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t7;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
    // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[21];
  }
  // t11 暂存 `<Text color="clawd_body">{" "}▘▘ ▝▝{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `<Text color="clawd_body">{" "}▘▘ ▝▝{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text color="clawd_body">{"  "}▘▘ ▝▝{"  "}</Text>;
    // $[22] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[22];
  }
  // t12 暂存 `<Box flexDirection="column">{t6}{t10}{t11}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== t10 || $[24] !== t6) {
    // t12 暂存 `<Box flexDirection="column">{t6}{t10}{t11}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box flexDirection="column">{t6}{t10}{t11}</Box>;
    // $[23] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t10;
    // $[24] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t6;
    // $[25] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[25];
  }
  // 返回 `t12`，作为终端渲染这次计算的结果。
  return t12;
}
// AppleTerminalClawd 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function AppleTerminalClawd(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    pose
  } = t0;
  // t1 暂存 `<Text color="clawd_body">▗</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text color="clawd_body">▗</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color="clawd_body">▗</Text>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2读取 `APPLE_EYES[pose]` 对应条目，后续围绕该成员继续处理。
  const t2 = APPLE_EYES[pose];
  // t3 暂存 `<Text color="clawd_background" backgroundColor="clawd_bod...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== t2) {
    // t3 暂存 `<Text color="clawd_background" backgroundColor="clawd_bod...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text color="clawd_background" backgroundColor="clawd_body">{t2}</Text>;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // t4 暂存 `<Text color="clawd_body">▖</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text color="clawd_body">▖</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text color="clawd_body">▖</Text>;
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // t5 暂存 `<Text>{t1}{t3}{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== t3) {
    // t5 暂存 `<Text>{t1}{t3}{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>{t1}{t3}{t4}</Text>;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // t6 暂存 `<Text backgroundColor="clawd_body">{" ".repeat(7)}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // t7 暂存 `<Text color="clawd_body">▘▘ ▝▝</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Text backgroundColor="clawd_body">{" ".repeat(7)}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text backgroundColor="clawd_body">{" ".repeat(7)}</Text>;
    // t7 暂存 `<Text color="clawd_body">▘▘ ▝▝</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text color="clawd_body">▘▘ ▝▝</Text>;
    // $[6] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t6;
    // $[7] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t7;
  } else {
    // t6 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[6];
    // t7 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[7];
  }
  // t8 暂存 `<Box flexDirection="column" alignItems="center">{t5}{t6}{...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t5) {
    // t8 暂存 `<Box flexDirection="column" alignItems="center">{t5}{t6}{...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" alignItems="center">{t5}{t6}{t7}</Box>;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[9];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJlbnYiLCJDbGF3ZFBvc2UiLCJQcm9wcyIsInBvc2UiLCJTZWdtZW50cyIsInIxTCIsInIxRSIsInIxUiIsInIyTCIsInIyUiIsIlBPU0VTIiwiUmVjb3JkIiwiZGVmYXVsdCIsIkFQUExFX0VZRVMiLCJDbGF3ZCIsInQwIiwiJCIsIl9jIiwidDEiLCJ1bmRlZmluZWQiLCJ0MiIsInRlcm1pbmFsIiwidDMiLCJwIiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsIlN5bWJvbCIsImZvciIsInQ5IiwidDEwIiwidDExIiwidDEyIiwiQXBwbGVUZXJtaW5hbENsYXdkIiwicmVwZWF0Il0sInNvdXJjZXMiOlsiQ2xhd2QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZW52IH0gZnJvbSAnLi4vLi4vdXRpbHMvZW52LmpzJ1xuXG5leHBvcnQgdHlwZSBDbGF3ZFBvc2UgPVxuICB8ICdkZWZhdWx0J1xuICB8ICdhcm1zLXVwJyAvLyBib3RoIGFybXMgcmFpc2VkICh1c2VkIGR1cmluZyBqdW1wKVxuICB8ICdsb29rLWxlZnQnIC8vIGJvdGggcHVwaWxzIHNoaWZ0ZWQgbGVmdFxuICB8ICdsb29rLXJpZ2h0JyAvLyBib3RoIHB1cGlscyBzaGlmdGVkIHJpZ2h0XG5cbnR5cGUgUHJvcHMgPSB7XG4gIHBvc2U/OiBDbGF3ZFBvc2Vcbn1cblxuLy8gU3RhbmRhcmQtdGVybWluYWwgcG9zZSBmcmFnbWVudHMuIEVhY2ggcm93IGlzIHNwbGl0IGludG8gc2VnbWVudHMgc28gd2UgY2FuXG4vLyB2YXJ5IG9ubHkgdGhlIHBhcnRzIHRoYXQgY2hhbmdlIChleWVzLCBhcm1zKSB3aGlsZSBrZWVwaW5nIHRoZSBib2R5L2JnIHNwYW5zXG4vLyBzdGFibGUuIEFsbCBwb3NlcyBlbmQgdXAgOSBjb2xzIHdpZGUuXG4vL1xuLy8gYXJtcy11cDogdGhlIHJvdy0yIGFybSBzaGFwZXMgKOKWneKWnCAvIOKWm+KWmCkgbW92ZSB0byByb3cgMSBhcyB0aGVpclxuLy8gYm90dG9tLWhlYXZ5IG1pcnJvcnMgKOKWl+KWnyAvIOKWmeKWlikg4oCUIHNhbWUgc2lsaG91ZXR0ZSwgb25lIHJvdyBoaWdoZXIuXG4vL1xuLy8gbG9vay0qIHVzZSB0b3AtcXVhZHJhbnQgZXllIGNoYXJzICjilpkv4pafKSBzbyBib3RoIGV5ZXMgY2hhbmdlIGZyb20gdGhlXG4vLyBkZWZhdWx0ICjilpsv4pacLCBib3R0b20gcHVwaWxzKSDigJQgb3RoZXJ3aXNlIG9ubHkgb25lIGV5ZSB3b3VsZCBhcHBlYXIgdG8gbW92ZS5cbnR5cGUgU2VnbWVudHMgPSB7XG4gIC8qKiByb3cgMSBsZWZ0IChubyBiZyk6IG9wdGlvbmFsIHJhaXNlZCBhcm0gKyBzaWRlICovXG4gIHIxTDogc3RyaW5nXG4gIC8qKiByb3cgMSBleWVzICh3aXRoIGJnKTogbGVmdC1leWUsIGZvcmVoZWFkLCByaWdodC1leWUgKi9cbiAgcjFFOiBzdHJpbmdcbiAgLyoqIHJvdyAxIHJpZ2h0IChubyBiZyk6IHNpZGUgKyBvcHRpb25hbCByYWlzZWQgYXJtICovXG4gIHIxUjogc3RyaW5nXG4gIC8qKiByb3cgMiBsZWZ0IChubyBiZyk6IGFybSArIGJvZHkgY3VydmUgKi9cbiAgcjJMOiBzdHJpbmdcbiAgLyoqIHJvdyAyIHJpZ2h0IChubyBiZyk6IGJvZHkgY3VydmUgKyBhcm0gKi9cbiAgcjJSOiBzdHJpbmdcbn1cblxuY29uc3QgUE9TRVM6IFJlY29yZDxDbGF3ZFBvc2UsIFNlZ21lbnRzPiA9IHtcbiAgZGVmYXVsdDogeyByMUw6ICcg4paQJywgcjFFOiAn4pab4paI4paI4paI4pacJywgcjFSOiAn4paMJywgcjJMOiAn4pad4pacJywgcjJSOiAn4pab4paYJyB9LFxuICAnbG9vay1sZWZ0JzogeyByMUw6ICcg4paQJywgcjFFOiAn4paf4paI4paI4paI4pafJywgcjFSOiAn4paMJywgcjJMOiAn4pad4pacJywgcjJSOiAn4pab4paYJyB9LFxuICAnbG9vay1yaWdodCc6IHsgcjFMOiAnIOKWkCcsIHIxRTogJ+KWmeKWiOKWiOKWiOKWmScsIHIxUjogJ+KWjCcsIHIyTDogJ+KWneKWnCcsIHIyUjogJ+KWm+KWmCcgfSxcbiAgJ2FybXMtdXAnOiB7IHIxTDogJ+KWl+KWnycsIHIxRTogJ+KWm+KWiOKWiOKWiOKWnCcsIHIxUjogJ+KWmeKWlicsIHIyTDogJyDilpwnLCByMlI6ICfilpsgJyB9LFxufVxuXG4vLyBBcHBsZSBUZXJtaW5hbCB1c2VzIGEgYmctZmlsbCB0cmljayAoc2VlIGJlbG93KSwgc28gb25seSBleWUgcG9zZXMgbWFrZVxuLy8gc2Vuc2UuIEFybSBwb3NlcyBmYWxsIGJhY2sgdG8gZGVmYXVsdC5cbmNvbnN0IEFQUExFX0VZRVM6IFJlY29yZDxDbGF3ZFBvc2UsIHN0cmluZz4gPSB7XG4gIGRlZmF1bHQ6ICcg4paXICAg4paWICcsXG4gICdsb29rLWxlZnQnOiAnIOKWmCAgIOKWmCAnLFxuICAnbG9vay1yaWdodCc6ICcg4padICAg4padICcsXG4gICdhcm1zLXVwJzogJyDilpcgICDilpYgJyxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENsYXdkKHsgcG9zZSA9ICdkZWZhdWx0JyB9OiBQcm9wcyA9IHt9KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKGVudi50ZXJtaW5hbCA9PT0gJ0FwcGxlX1Rlcm1pbmFsJykge1xuICAgIHJldHVybiA8QXBwbGVUZXJtaW5hbENsYXdkIHBvc2U9e3Bvc2V9IC8+XG4gIH1cbiAgY29uc3QgcCA9IFBPU0VTW3Bvc2VdXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8VGV4dD5cbiAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+e3AucjFMfTwvVGV4dD5cbiAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCIgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYmFja2dyb3VuZFwiPlxuICAgICAgICAgIHtwLnIxRX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JvZHlcIj57cC5yMVJ9PC9UZXh0PlxuICAgICAgPC9UZXh0PlxuICAgICAgPFRleHQ+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhd2RfYm9keVwiPntwLnIyTH08L1RleHQ+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhd2RfYm9keVwiIGJhY2tncm91bmRDb2xvcj1cImNsYXdkX2JhY2tncm91bmRcIj5cbiAgICAgICAgICDilojilojilojilojilohcbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JvZHlcIj57cC5yMlJ9PC9UZXh0PlxuICAgICAgPC9UZXh0PlxuICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+XG4gICAgICAgIHsnICAnfeKWmOKWmCDilp3ilp17JyAgJ31cbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuXG5mdW5jdGlvbiBBcHBsZVRlcm1pbmFsQ2xhd2QoeyBwb3NlIH06IHsgcG9zZTogQ2xhd2RQb3NlIH0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBBcHBsZSdzIFRlcm1pbmFsIHJlbmRlcnMgdmVydGljYWwgc3BhY2UgYmV0d2VlbiBjaGFycyBieSBkZWZhdWx0LlxuICAvLyBJdCBkb2VzIE5PVCByZW5kZXIgdmVydGljYWwgc3BhY2UgYmV0d2VlbiBiYWNrZ3JvdW5kIGNvbG9yc1xuICAvLyBzbyB3ZSB1c2UgYmFja2dyb3VuZCBjb2xvciB0byBkcmF3IHRoZSBtYWluIHNoYXBlLlxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGFsaWduSXRlbXM9XCJjZW50ZXJcIj5cbiAgICAgIDxUZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JvZHlcIj7ilpc8L1RleHQ+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhd2RfYmFja2dyb3VuZFwiIGJhY2tncm91bmRDb2xvcj1cImNsYXdkX2JvZHlcIj5cbiAgICAgICAgICB7QVBQTEVfRVlFU1twb3NlXX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JvZHlcIj7ilpY8L1RleHQ+XG4gICAgICA8L1RleHQ+XG4gICAgICA8VGV4dCBiYWNrZ3JvdW5kQ29sb3I9XCJjbGF3ZF9ib2R5XCI+eycgJy5yZXBlYXQoNyl9PC9UZXh0PlxuICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+4paY4paYIOKWneKWnTwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLEdBQUcsUUFBUSxvQkFBb0I7QUFFeEMsT0FBTyxLQUFLQyxTQUFTLEdBQ2pCLFNBQVMsR0FDVCxTQUFTLENBQUM7QUFBQSxFQUNWLFdBQVcsQ0FBQztBQUFBLEVBQ1osWUFBWSxFQUFDOztBQUVqQixLQUFLQyxLQUFLLEdBQUc7RUFDWEMsSUFBSSxDQUFDLEVBQUVGLFNBQVM7QUFDbEIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLRyxRQUFRLEdBQUc7RUFDZDtFQUNBQyxHQUFHLEVBQUUsTUFBTTtFQUNYO0VBQ0FDLEdBQUcsRUFBRSxNQUFNO0VBQ1g7RUFDQUMsR0FBRyxFQUFFLE1BQU07RUFDWDtFQUNBQyxHQUFHLEVBQUUsTUFBTTtFQUNYO0VBQ0FDLEdBQUcsRUFBRSxNQUFNO0FBQ2IsQ0FBQztBQUVELE1BQU1DLEtBQUssRUFBRUMsTUFBTSxDQUFDVixTQUFTLEVBQUVHLFFBQVEsQ0FBQyxHQUFHO0VBQ3pDUSxPQUFPLEVBQUU7SUFBRVAsR0FBRyxFQUFFLElBQUk7SUFBRUMsR0FBRyxFQUFFLE9BQU87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
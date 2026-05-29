// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useRef，将 react 中已经封装好的能力接到本文件流程里。
import React, { useRef } from 'react';
// 类型依赖 { RemoteAgentTaskState } 来自 src/tasks/RemoteAgentTask/RemoteAgentTask.js，用于校准终端渲染的数据契约。
import type { RemoteAgentTaskState } from 'src/tasks/RemoteAgentTask/RemoteAgentTask.js';
// 类型依赖 { DeepImmutable } 来自 src/types/utils.js，用于校准终端渲染的数据契约。
import type { DeepImmutable } from 'src/types/utils.js';
// 引入 DIAMOND_FILLED、DIAMOND_OPEN，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { DIAMOND_FILLED, DIAMOND_OPEN } from '../../constants/figures.js';
// 引入 useSettings，将 ../../hooks/useSettings.js 中已经封装好的能力接到本文件流程里。
import { useSettings } from '../../hooks/useSettings.js';
// 引入 Text、useAnimationFrame，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text, useAnimationFrame } from '../../ink.js';
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js';
// 复用 getRainbowColor 工具函数，把通用处理留在 ../../utils/thinking.js 中维护。
import { getRainbowColor } from '../../utils/thinking.js';
// TICK_MS 集合保存`80`，供终端 UI Remote Session Progr...后续判断或输出使用。
const TICK_MS = 80;
// ReviewStage 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ReviewStage = NonNullable<NonNullable<RemoteAgentTaskState['reviewProgress']>['stage']>;

/**
 * Stage-appropriate counts line for a running review. Shared between the
 * one-line pill (below) and RemoteSessionDetailDialog's reviewCountsLine so
 * the two can't drift — they have historically disagreed on whether to show
 * refuted counts and what to call the synthesizing stage.
 *
 * Canonical behavior: word labels (not ✓/✗), hide refuted when 0, "deduping"
 * for the synthesizing stage (matches STAGE_LABELS in the detail dialog).
 */
// formatReviewStageCounts 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatReviewStageCounts(stage: ReviewStage | undefined, found: number, verified: number, refuted: number): string {
  // Pre-stage orchestrator images don't write the stage field.
  // stage缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!stage) return `${found} found · ${verified} verified`;
  // 当 `stage` 匹配 `'synthesizing'` 时，终端渲染执行对应分支。
  if (stage === 'synthesizing') {
    // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
    const parts = [`${verified} verified`];
    // 满足 `refuted > 0) parts.push(`${refuted} refuted`` 时，终端渲染执行该分支。
    if (refuted > 0) parts.push(`${refuted} refuted`);
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push('deduping');
    // 返回 `parts.join(' · ')`，作为终端渲染这次计算的结果。
    return parts.join(' · ');
  }
  // 当 `stage` 匹配 `'verifying'` 时，终端渲染执行对应分支。
  if (stage === 'verifying') {
    // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
    const parts = [`${found} found`, `${verified} verified`];
    // 满足 `refuted > 0) parts.push(`${refuted} refuted`` 时，终端渲染执行该分支。
    if (refuted > 0) parts.push(`${refuted} refuted`);
    // 返回 `parts.join(' · ')`，作为终端渲染这次计算的结果。
    return parts.join(' · ');
  }
  // stage === 'finding'
  // 返回 `found > 0 ? `${found} found` : 'finding'`，作为终端渲染这次计算的结果。
  return found > 0 ? `${found} found` : 'finding';
}

// Per-character rainbow gradient, same treatment as the ultraplan keyword.
// The phase offset lets the gradient cycle — so the colors sweep along the
// text on each animation frame instead of being static.
// RainbowText 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function RainbowText(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text,
    phase: t1
  } = t0;
  // phase标记终端 UI Remote Session Progr...是否启用对应路径。
  const phase = t1 === undefined ? 0 : t1;
  // t2 暂存 `[...text]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== text) {
    // t2 暂存 `[...text]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [...text];
    // $[0] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = text;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3 暂存 `<>{t2.map((ch, i) => <Text key={i} color={getRainbowColor...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== phase || $[3] !== t2) {
    // t3 暂存 `<>{t2.map((ch, i) => <Text key={i} color={getRainbowColor...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <>{t2.map((ch, i) => <Text key={i} color={getRainbowColor(i + phase)}>{ch}</Text>)}</>;
    // $[2] 缓存 `phase`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = phase;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}

// Smooth-tick a count toward target, +1 per frame. Same pattern as the
// token counter in SpinnerAnimationRow — the ref survives re-renders and
// the animation clock drives the tick. Target jumps (2→5) display as
// 2→3→4→5 instead of snapping. When `snap` is set (reduced motion, or
// the clock is frozen), bypass the tick and jump straight to target —
// otherwise a frozen `time` would leave the ref stuck at its init value.
// useSmoothCount 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function useSmoothCount(target: number, time: number, snap: boolean): number {
  // displayed保存`useRef`，供终端渲染后续处理使用。
  const displayed = useRef(target);
  // lastTick保存`useRef`，供终端渲染后续处理使用。
  const lastTick = useRef(time);
  // 只有 `snap || target < displayed.current` 满足时，终端渲染才执行该分支。
  if (snap || target < displayed.current) {
    // current更新为 `target`，确保任务详情界面后续读取最新状态。
    displayed.current = target;
  // 终端 UI 组件 Remote Session Progress在这里处理 `} else if (target > displayed.current && time !== lastTick.current) {`，完成这一小步状态转换。
  } else if (target > displayed.current && time !== lastTick.current) {
    // 终端 UI 组件 Remote Session Progress在这里处理 `displayed.current += 1`，完成这一小步状态转换。
    displayed.current += 1;
    // current更新为 `time`，确保任务详情界面后续读取最新状态。
    lastTick.current = time;
  }
  // 返回 `displayed.current`，作为终端渲染这次计算的结果。
  return displayed.current;
}
// ReviewRainbowLine 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ReviewRainbowLine(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(15);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    session
  } = t0;
  // settings 集合保存`useSettings`，供终端渲染后续处理使用。
  const settings = useSettings();
  // reducedMotion保存`settings.prefersReducedMotion ?? false`，供后续判断或组装使用。
  const reducedMotion = settings.prefersReducedMotion ?? false;
  // p 命名 `session.reviewProgress`，让后续代码直接表达这个值的用途。
  const p = session.reviewProgress;
  // running标记终端 UI Remote Session Progr...是否启用对应路径。
  const running = session.status === "running";
  // 从 `useAnimationFrame(running && !reducedMotion ? TICK_MS :...` 按位置拆出 time，让终端 UI 组件 Remote Session Progress分别处理这些返回值。
  const [, time] = useAnimationFrame(running && !reducedMotion ? TICK_MS : null);
  // targetFound保存`p?.bugsFound ?? 0`，供后续判断或组装使用。
  const targetFound = p?.bugsFound ?? 0;
  // targetVerified保存`p?.bugsVerified ?? 0`，供后续判断或组装使用。
  const targetVerified = p?.bugsVerified ?? 0;
  // targetRefuted 命名 `p?.bugsRefuted ?? 0`，让后续代码直接表达这个值的用途。
  const targetRefuted = p?.bugsRefuted ?? 0;
  // snap标记终端 UI Remote Session Progr...是否启用对应路径。
  const snap = reducedMotion || !running;
  // found保存`useSmoothCount`，供终端渲染后续处理使用。
  const found = useSmoothCount(targetFound, time, snap);
  // verified保存`useSmoothCount`，供终端渲染后续处理使用。
  const verified = useSmoothCount(targetVerified, time, snap);
  // refuted保存`useSmoothCount`，供终端渲染后续处理使用。
  const refuted = useSmoothCount(targetRefuted, time, snap);
  // phase保存`Math.floor`，供终端渲染后续处理使用。
  const phase = Math.floor(time / (TICK_MS * 3)) % 7;
  // 当 `session.status` 匹配 `"completed"` 时，终端渲染执行对应分支。
  if (session.status === "completed") {
    // t1 暂存 `<><Text color="background">{DIAMOND_FILLED} </Text><Rainb...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<><Text color="background">{DIAMOND_FILLED} </Text><Rainb...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <><Text color="background">{DIAMOND_FILLED} </Text><RainbowText text="ultrareview" phase={0} /><Text dimColor={true}> ready · shift+↓ to view</Text></>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 当 `session.status` 匹配 `"failed"` 时，终端渲染执行对应分支。
  if (session.status === "failed") {
    // t1 暂存 `<><Text color="background">{DIAMOND_FILLED} </Text><Rainb...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<><Text color="background">{DIAMOND_FILLED} </Text><Rainb...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <><Text color="background">{DIAMOND_FILLED} </Text><RainbowText text="ultrareview" phase={0} /><Text color="error" dimColor={true}>{" \xB7 "}error</Text></>;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[1];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `!p ? "setting up" : formatReviewStageCounts(p.stage, foun...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== found || $[3] !== p || $[4] !== refuted || $[5] !== verified) {
    // t1 暂存 `!p ? "setting up" : formatReviewStageCounts(p.stage, foun...` 生成的渲染片段，后续返回路径直接复用。
    t1 = !p ? "setting up" : formatReviewStageCounts(p.stage, found, verified, refuted);
    // $[2] 缓存 `found`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = found;
    // $[3] 缓存 `p`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = p;
    // $[4] 缓存 `refuted`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = refuted;
    // $[5] 缓存 `verified`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = verified;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[6];
  }
  // tail 命名 `t1`，让后续代码直接表达这个值的用途。
  const tail = t1;
  // t2 暂存 `<Text color="background">{DIAMOND_OPEN} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Text color="background">{DIAMOND_OPEN} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color="background">{DIAMOND_OPEN} </Text>;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // t3保存`running ? phase : 0`，供后续判断或组装使用。
  const t3 = running ? phase : 0;
  // t4 暂存 `<RainbowText text="ultrareview" phase={t3} />` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t3) {
    // t4 暂存 `<RainbowText text="ultrareview" phase={t3} />` 生成的渲染片段，后续返回路径直接复用。
    t4 = <RainbowText text="ultrareview" phase={t3} />;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `<Text dimColor={true}> · {tail}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== tail) {
    // t5 暂存 `<Text dimColor={true}> · {tail}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text dimColor={true}> · {tail}</Text>;
    // $[10] 缓存 `tail`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = tail;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // t6 暂存 `<>{t2}{t4}{t5}</>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== t4 || $[13] !== t5) {
    // t6 暂存 `<>{t2}{t4}{t5}</>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <>{t2}{t4}{t5}</>;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
// RemoteSessionProgress 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function RemoteSessionProgress(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    session
  } = t0;
  // 满足 `session.isRemoteReview` 时，终端渲染执行该分支。
  if (session.isRemoteReview) {
    // t1 暂存 `<ReviewRainbowLine session={session} />` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== session) {
      // t1 暂存 `<ReviewRainbowLine session={session} />` 生成的渲染片段，后续返回路径直接复用。
      t1 = <ReviewRainbowLine session={session} />;
      // $[0] 缓存 `session`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = session;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[1];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 当 `session.status` 匹配 `"completed"` 时，终端渲染执行对应分支。
  if (session.status === "completed") {
    // t1 暂存 `<Text bold={true} color="success" dimColor={true}>done</T...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Text bold={true} color="success" dimColor={true}>done</T...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text bold={true} color="success" dimColor={true}>done</Text>;
      // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[2];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 当 `session.status` 匹配 `"failed"` 时，终端渲染执行对应分支。
  if (session.status === "failed") {
    // t1 暂存 `<Text bold={true} color="error" dimColor={true}>error</Te...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Text bold={true} color="error" dimColor={true}>error</Te...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text bold={true} color="error" dimColor={true}>error</Text>;
      // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[3];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // session.todoList.length 会话数据缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!session.todoList.length) {
    // t1 暂存 `<Text dimColor={true}>{session.status}…</Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== session.status) {
      // t1 暂存 `<Text dimColor={true}>{session.status}…</Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text dimColor={true}>{session.status}…</Text>;
      // $[4] 缓存 `session.status`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = session.status;
      // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[5];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `count(session.todoList, _temp)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== session.todoList) {
    // t1 暂存 `count(session.todoList, _temp)` 生成的渲染片段，后续返回路径直接复用。
    t1 = count(session.todoList, _temp);
    // $[6] 缓存 `session.todoList`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = session.todoList;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[7];
  }
  // completed沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const completed = t1;
  // total保存 `session.todoList.length` 的判断结果，供终端 UI Remote Session Progr...后续分支直接复用。
  const total = session.todoList.length;
  // t2 暂存 `<Text dimColor={true}>{completed}/{total}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== completed || $[9] !== total) {
    // t2 暂存 `<Text dimColor={true}>{completed}/{total}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>{completed}/{total}</Text>;
    // $[8] 缓存 `completed`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = completed;
    // $[9] 缓存 `total`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = total;
    // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[10];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
// _temp 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(_) {
  // 返回 `_.status === "completed"`，作为终端渲染这次计算的结果。
  return _.status === "completed";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVJlZiIsIlJlbW90ZUFnZW50VGFza1N0YXRlIiwiRGVlcEltbXV0YWJsZSIsIkRJQU1PTkRfRklMTEVEIiwiRElBTU9ORF9PUEVOIiwidXNlU2V0dGluZ3MiLCJUZXh0IiwidXNlQW5pbWF0aW9uRnJhbWUiLCJjb3VudCIsImdldFJhaW5ib3dDb2xvciIsIlRJQ0tfTVMiLCJSZXZpZXdTdGFnZSIsIk5vbk51bGxhYmxlIiwiZm9ybWF0UmV2aWV3U3RhZ2VDb3VudHMiLCJzdGFnZSIsImZvdW5kIiwidmVyaWZpZWQiLCJyZWZ1dGVkIiwicGFydHMiLCJwdXNoIiwiam9pbiIsIlJhaW5ib3dUZXh0IiwidDAiLCIkIiwiX2MiLCJ0ZXh0IiwicGhhc2UiLCJ0MSIsInVuZGVmaW5lZCIsInQyIiwidDMiLCJtYXAiLCJjaCIsImkiLCJ1c2VTbW9vdGhDb3VudCIsInRhcmdldCIsInRpbWUiLCJzbmFwIiwiZGlzcGxheWVkIiwibGFzdFRpY2siLCJjdXJyZW50IiwiUmV2aWV3UmFpbmJvd0xpbmUiLCJzZXNzaW9uIiwic2V0dGluZ3MiLCJyZWR1Y2VkTW90aW9uIiwicHJlZmVyc1JlZHVjZWRNb3Rpb24iLCJwIiwicmV2aWV3UHJvZ3Jlc3MiLCJydW5uaW5nIiwic3RhdHVzIiwidGFyZ2V0Rm91bmQiLCJidWdzRm91bmQiLCJ0YXJnZXRWZXJpZmllZCIsImJ1Z3NWZXJpZmllZCIsInRhcmdldFJlZnV0ZWQiLCJidWdzUmVmdXRlZCIsIk1hdGgiLCJmbG9vciIsIlN5bWJvbCIsImZvciIsInRhaWwiLCJ0NCIsInQ1IiwidDYiLCJSZW1vdGVTZXNzaW9uUHJvZ3Jlc3MiLCJpc1JlbW90ZVJldmlldyIsInRvZG9MaXN0IiwibGVuZ3RoIiwiX3RlbXAiLCJjb21wbGV0ZWQiLCJ0b3RhbCIsIl8iXSwic291cmNlcyI6WyJSZW1vdGVTZXNzaW9uUHJvZ3Jlc3MudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VSZWYgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgUmVtb3RlQWdlbnRUYXNrU3RhdGUgfSBmcm9tICdzcmMvdGFza3MvUmVtb3RlQWdlbnRUYXNrL1JlbW90ZUFnZW50VGFzay5qcydcbmltcG9ydCB0eXBlIHsgRGVlcEltbXV0YWJsZSB9IGZyb20gJ3NyYy90eXBlcy91dGlscy5qcydcbmltcG9ydCB7IERJQU1PTkRfRklMTEVELCBESUFNT05EX09QRU4gfSBmcm9tICcuLi8uLi9jb25zdGFudHMvZmlndXJlcy5qcydcbmltcG9ydCB7IHVzZVNldHRpbmdzIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlU2V0dGluZ3MuanMnXG5pbXBvcnQgeyBUZXh0LCB1c2VBbmltYXRpb25GcmFtZSB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGNvdW50IH0gZnJvbSAnLi4vLi4vdXRpbHMvYXJyYXkuanMnXG5pbXBvcnQgeyBnZXRSYWluYm93Q29sb3IgfSBmcm9tICcuLi8uLi91dGlscy90aGlua2luZy5qcydcblxuY29uc3QgVElDS19NUyA9IDgwXG5cbnR5cGUgUmV2aWV3U3RhZ2UgPSBOb25OdWxsYWJsZTxcbiAgTm9uTnVsbGFibGU8UmVtb3RlQWdlbnRUYXNrU3RhdGVbJ3Jldmlld1Byb2dyZXNzJ10+WydzdGFnZSddXG4+XG5cbi8qKlxuICogU3RhZ2UtYXBwcm9wcmlhdGUgY291bnRzIGxpbmUgZm9yIGEgcnVubmluZyByZXZpZXcuIFNoYXJlZCBiZXR3ZWVuIHRoZVxuICogb25lLWxpbmUgcGlsbCAoYmVsb3cpIGFuZCBSZW1vdGVTZXNzaW9uRGV0YWlsRGlhbG9nJ3MgcmV2aWV3Q291bnRzTGluZSBzb1xuICogdGhlIHR3byBjYW4ndCBkcmlmdCDigJQgdGhleSBoYXZlIGhpc3RvcmljYWxseSBkaXNhZ3JlZWQgb24gd2hldGhlciB0byBzaG93XG4gKiByZWZ1dGVkIGNvdW50cyBhbmQgd2hhdCB0byBjYWxsIHRoZSBzeW50aGVzaXppbmcgc3RhZ2UuXG4gKlxuICogQ2Fub25pY2FsIGJlaGF2aW9yOiB3b3JkIGxhYmVscyAobm90IOKcky/inJcpLCBoaWRlIHJlZnV0ZWQgd2hlbiAwLCBcImRlZHVwaW5nXCJcbiAqIGZvciB0aGUgc3ludGhlc2l6aW5nIHN0YWdlIChtYXRjaGVzIFNUQUdFX0xBQkVMUyBpbiB0aGUgZGV0YWlsIGRpYWxvZykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRSZXZpZXdTdGFnZUNvdW50cyhcbiAgc3RhZ2U6IFJldmlld1N0YWdlIHwgdW5kZWZpbmVkLFxuICBmb3VuZDogbnVtYmVyLFxuICB2ZXJpZmllZDogbnVtYmVyLFxuICByZWZ1dGVkOiBudW1iZXIsXG4pOiBzdHJpbmcge1xuICAvLyBQcmUtc3RhZ2Ugb3JjaGVzdHJhdG9yIGltYWdlcyBkb24ndCB3cml0ZSB0aGUgc3RhZ2UgZmllbGQuXG4gIGlmICghc3RhZ2UpIHJldHVybiBgJHtmb3VuZH0gZm91bmQgwrcgJHt2ZXJpZmllZH0gdmVyaWZpZWRgXG4gIGlmIChzdGFnZSA9PT0gJ3N5bnRoZXNpemluZycpIHtcbiAgICBjb25zdCBwYXJ0cyA9IFtgJHt2ZXJpZmllZH0gdmVyaWZpZWRgXVxuICAgIGlmIChyZWZ1dGVkID4gMCkgcGFydHMucHVzaChgJHtyZWZ1dGVkfSByZWZ1dGVkYClcbiAgICBwYXJ0cy5wdXNoKCdkZWR1cGluZycpXG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oJyDCtyAnKVxuICB9XG4gIGlmIChzdGFnZSA9PT0gJ3ZlcmlmeWluZycpIHtcbiAgICBjb25zdCBwYXJ0cyA9IFtgJHtmb3VuZH0gZm91bmRgLCBgJHt2ZXJpZmllZH0gdmVyaWZpZWRgXVxuICAgIGlmIChyZWZ1dGVkID4gMCkgcGFydHMucHVzaChgJHtyZWZ1dGVkfSByZWZ1dGVkYClcbiAgICByZXR1cm4gcGFydHMuam9pbignIMK3ICcpXG4gIH1cbiAgLy8gc3RhZ2UgPT09ICdmaW5kaW5nJ1xuICByZXR1cm4gZm91bmQgPiAwID8gYCR7Zm91bmR9IGZvdW5kYCA6ICdmaW5kaW5nJ1xufVxuXG4vLyBQZXItY2hhcmFjdGVyIHJhaW5ib3cgZ3JhZGllbnQsIHNhbWUgdHJlYXRtZW50IGFzIHRoZSB1bHRyYXBsYW4ga2V5d29yZC5cbi8vIFRoZSBwaGFzZSBvZmZzZXQgbGV0cyB0aGUgZ3JhZGllbnQgY3ljbGUg4oCUIHNvIHRoZSBjb2xvcnMgc3dlZXAgYWxvbmcgdGhlXG4vLyB0ZXh0IG9uIGVhY2ggYW5pbWF0aW9uIGZyYW1lIGluc3RlYWQgb2YgYmVpbmcgc3RhdGljLlxuZnVuY3Rpb24gUmFpbmJvd1RleHQoe1xuICB0ZXh0LFxuICBwaGFzZSA9IDAsXG59OiB7XG4gIHRleHQ6IHN0cmluZ1xuICBwaGFzZT86IG51bWJlclxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIHtbLi4udGV4dF0ubWFwKChjaCwgaSkgPT4gKFxuICAgICAgICA8VGV4dCBrZXk9e2l9IGNvbG9yPXtnZXRSYWluYm93Q29sb3IoaSArIHBoYXNlKX0+XG4gICAgICAgICAge2NofVxuICAgICAgICA8L1RleHQ+XG4gICAgICApKX1cbiAgICA8Lz5cbiAgKVxufVxuXG4vLyBTbW9vdGgtdGljayBhIGNvdW50IHRvd2FyZCB0YXJnZXQsICsxIHBlciBmcmFtZS4gU2FtZSBwYXR0ZXJuIGFzIHRoZVxuLy8gdG9rZW4gY291bnRlciBpbiBTcGlubmVyQW5pbWF0aW9uUm93IOKAlCB0aGUgcmVmIHN1cnZpdmVzIHJlLXJlbmRlcnMgYW5kXG4vLyB0aGUgYW5pbWF0aW9uIGNsb2NrIGRyaXZlcyB0aGUgdGljay4gVGFyZ2V0IGp1bXBzICgy4oaSNSkgZGlzcGxheSBhc1xuLy8gMuKGkjPihpI04oaSNSBpbnN0ZWFkIG9mIHNuYXBwaW5nLiBXaGVuIGBzbmFwYCBpcyBzZXQgKHJlZHVjZWQgbW90aW9uLCBvclxuLy8gdGhlIGNsb2NrIGlzIGZyb3plbiksIGJ5cGFzcyB0aGUgdGljayBhbmQganVtcCBzdHJhaWdodCB0byB0YXJnZXQg4oCUXG4vLyBvdGhlcndpc2UgYSBmcm96ZW4gYHRpbWVgIHdvdWxkIGxlYXZlIHRoZSByZWYgc3R1Y2sgYXQgaXRzIGluaXQgdmFsdWUuXG5mdW5jdGlvbiB1c2VTbW9vdGhDb3VudCh0YXJnZXQ6IG51bWJlciwgdGltZTogbnVtYmVyLCBzbmFwOiBib29sZWFuKTogbnVtYmVyIHtcbiAgY29uc3QgZGlzcGxheWVkID0gdXNlUmVmKHRhcmdldClcbiAgY29uc3QgbGFzdFRpY2sgPSB1c2VSZWYodGltZSlcbiAgaWYgKHNuYXAgfHwgdGFyZ2V0IDwgZGlzcGxheWVkLmN1cnJlbnQpIHtcbiAgICBkaXNwbGF5ZWQuY3VycmVudCA9IHRhcmdldFxuICB9IGVsc2UgaWYgKHRhcmdldCA+IGRpc3BsYXllZC5jdXJyZW50ICYmIHRpbWUgIT09IGxhc3RUaWNrLmN1cnJlbnQpIHtcbiAgICBkaXNwbGF5ZWQuY3VycmVudCArPSAxXG4gICAgbGFzdFRpY2suY3VycmVudCA9IHRpbWVcbiAgfVxuICByZXR1cm4gZGlzcGxheWVkLmN1cnJlbnRcbn1cblxuZnVuY3Rpb24gUmV2aWV3UmFpbmJvd0xpbmUoe1xuICBzZXNzaW9uLFxufToge1xuICBzZXNzaW9uOiBEZWVwSW1tdXRhYmxlPFJlbW90ZUFnZW50VGFza1N0YXRlPlxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHNldHRpbmdzID0gdXNlU2V0dGluZ3MoKVxuICBjb25zdCByZWR1Y2VkTW90aW9uID0gc2V0dGluZ3MucHJlZmVyc1JlZHVjZWRNb3Rpb24gPz8gZmFsc2VcbiAgY29uc3QgcCA9IHNlc3Npb24ucmV2aWV3UHJvZ3Jlc3NcbiAgY29uc3QgcnVubmluZyA9IHNlc3Npb24uc3RhdHVzID09PSAncnVubmluZydcbiAgLy8gQW5pbWF0aW9uIGNsb2NrIHJ1bnMgb25seSB3aGlsZSBydW5uaW5nIOKAlCBjb21wbGV0ZWQvZmFpbGVkIGFyZSBzdGF0aWMuXG4gIC8vIERpc2FibGVkIGVudGlyZWx5IHdoZW4gdGhlIHVzZXIgcHJlZmVycyByZWR1Y2VkIG1vdGlvbi5cbiAgLy9cbiAgLy8gVGhlIHJlZiBpcyBpbnRlbnRpb25hbGx5IGRpc2NhcmRlZDogdGhpcyBjb21wb25lbnQgaXMgcmVuZGVyZWQgaW5zaWRlXG4gIC8vIDxUZXh0PiB3cmFwcGVycyAoQmFja2dyb3VuZFRhc2tzRGlhbG9nLCBSZW1vdGVTZXNzaW9uRGV0YWlsRGlhbG9nKSwgYW5kXG4gIC8vIEluayBjYW4ndCBuZXN0IDxCb3g+IGluc2lkZSA8VGV4dD4uIERyb3BwaW5nIHRoZSByZWYgbWVhbnNcbiAgLy8gdXNlVGVybWluYWxWaWV3cG9ydCdzIGlzVmlzaWJsZSBzdGF5cyB0cnVlLCBzbyB0aGUgY2xvY2sgdGlja3MgZXZlbiB3aGVuXG4gIC8vIHNjcm9sbGVkIG9mZi1zY3JlZW4g4oCUIGFjY2VwdGFibGUgZm9yIGEgc2luZ2xlIDMwLWNoYXIgbGluZS5cbiAgY29uc3QgWywgdGltZV0gPSB1c2VBbmltYXRpb25GcmFtZShydW5uaW5nICYmICFyZWR1Y2VkTW90aW9uID8gVElDS19NUyA6IG51bGwpXG5cbiAgY29uc3QgdGFyZ2V0Rm91bmQgPSBwPy5idWdzRm91bmQgPz8gMFxuICBjb25zdCB0YXJnZXRWZXJpZmllZCA9IHA/LmJ1Z3NWZXJpZmllZCA/PyAwXG4gIGNvbnN0IHRhcmdldFJlZnV0ZWQgPSBwPy5idWdzUmVmdXRlZCA/PyAwXG4gIC8vIHNuYXAgd2hlbiB0aGUgY2xvY2sgaXNuJ3QgYWR2YW5jaW5nIChyZWR1Y2VkIG1vdGlvbiwgb3Igbm90IHJ1bm5pbmcpIOKAlFxuICAvLyB1c2VBbmltYXRpb25GcmFtZShudWxsKSBmcmVlemVzIGB0aW1lYCBhdCBpdHMgbW91bnQgdmFsdWUsIHdoaWNoIHdvdWxkXG4gIC8vIGxlYXZlIHRoZSB0aWNrLWdhdGUgcGVybWFuZW50bHkgZmFsc2UuXG4gIGNvbnN0IHNuYXAgPSByZWR1Y2VkTW90aW9uIHx8ICFydW5uaW5nXG4gIGNvbnN0IGZvdW5kID0gdXNlU21vb3RoQ291bnQodGFyZ2V0Rm91bmQsIHRpbWUsIHNuYXApXG4gIGNvbnN0IHZlcmlmaWVkID0gdXNlU21vb3RoQ291bnQodGFyZ2V0VmVyaWZpZWQsIHRpbWUsIHNuYXApXG4gIGNvbnN0IHJlZnV0ZWQgPSB1c2VTbW9vdGhDb3VudCh0YXJnZXRSZWZ1dGVkLCB0aW1lLCBzbmFwKVxuXG4gIC8vIFBoYXNlIGFkdmFuY2VzIGV2ZXJ5IDMgdGlja3Mgc28gdGhlIGdyYWRpZW50IHN3ZWVwIGlzIHZpc2libGUgYnV0XG4gIC8vIG5vdCBmcmFudGljLiBNb2R1bG8ga2VlcHMgaXQgaW4gdGhlIDctY29sb3IgY3ljbGUuXG4gIGNvbnN0IHBoYXNlID0gTWF0aC5mbG9vcih0aW1lIC8gKFRJQ0tfTVMgKiAzKSkgJSA3XG5cbiAgLy8g4peHIG9wZW4gZGlhbW9uZCB3aGlsZSBydW5uaW5nICh0ZWFsLCBtYXRjaGVzIGNsb3VkLXNlc3Npb24gYWNjZW50KSwg4peGXG4gIC8vIGZpbGxlZCB3aGVuIHRlcm1pbmFsLiBSYWluYm93IGlzIHNjb3BlZCB0byB0aGUgd29yZCBgdWx0cmFyZXZpZXdgIG9ubHkg4oCUXG4gIC8vIHBlciBkZXNpZ24gZmVlZGJhY2ssIFwidGhlcmUgaXMgYSBsaW1pdCB0byB0aGUgZ2xpdHRlcmluZyByYWluYm93XCIuXG4gIC8vIENvdW50cyBzdGF5IGRpbUNvbG9yLlxuICBpZiAoc2Vzc2lvbi5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiYmFja2dyb3VuZFwiPntESUFNT05EX0ZJTExFRH0gPC9UZXh0PlxuICAgICAgICA8UmFpbmJvd1RleHQgdGV4dD1cInVsdHJhcmV2aWV3XCIgcGhhc2U9ezB9IC8+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPiByZWFkeSDCtyBzaGlmdCvihpMgdG8gdmlldzwvVGV4dD5cbiAgICAgIDwvPlxuICAgIClcbiAgfVxuICBpZiAoc2Vzc2lvbi5zdGF0dXMgPT09ICdmYWlsZWQnKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiYmFja2dyb3VuZFwiPntESUFNT05EX0ZJTExFRH0gPC9UZXh0PlxuICAgICAgICA8UmFpbmJvd1RleHQgdGV4dD1cInVsdHJhcmV2aWV3XCIgcGhhc2U9ezB9IC8+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIiBkaW1Db2xvcj5cbiAgICAgICAgICB7JyDCtyAnfVxuICAgICAgICAgIGVycm9yXG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvPlxuICAgIClcbiAgfVxuXG4gIC8vIFRoZSAhcCBicmFuY2ggKFwic2V0dGluZyB1cFwiKSBjb3ZlcnMgdGhlIHdpbmRvdyBiZWZvcmUgdGhlIG9yY2hlc3RyYXRvclxuICAvLyB3cml0ZXMgaXRzIGZpcnN0IHByb2dyZXNzIHNuYXBzaG90IOKAlCBjb250YWluZXIgYm9vdCArIHJlcG8gY2xvbmUgY2FuXG4gIC8vIHRha2UgMS0zIG1pbiwgZHVyaW5nIHdoaWNoIFwiMCBmb3VuZFwiIGxvb2tlZCBodW5nLlxuICBjb25zdCB0YWlsID0gIXBcbiAgICA/ICdzZXR0aW5nIHVwJ1xuICAgIDogZm9ybWF0UmV2aWV3U3RhZ2VDb3VudHMocC5zdGFnZSwgZm91bmQsIHZlcmlmaWVkLCByZWZ1dGVkKVxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8VGV4dCBjb2xvcj1cImJhY2tncm91bmRcIj57RElBTU9ORF9PUEVOfSA8L1RleHQ+XG4gICAgICA8UmFpbmJvd1RleHQgdGV4dD1cInVsdHJhcmV2aWV3XCIgcGhhc2U9e3J1bm5pbmcgPyBwaGFzZSA6IDB9IC8+XG4gICAgICA8VGV4dCBkaW1Db2xvcj4gwrcge3RhaWx9PC9UZXh0PlxuICAgIDwvPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBSZW1vdGVTZXNzaW9uUHJvZ3Jlc3Moe1xuICBzZXNzaW9uLFxufToge1xuICBzZXNzaW9uOiBEZWVwSW1tdXRhYmxlPFJlbW90ZUFnZW50VGFza1N0YXRlPlxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIExpdGUtcmV2aWV3OiByYWluYm93IGdyYWRpZW50IG92ZXIgdGhlIGZ1bGwgbGluZSwgdWx0cmFwbGFuLXN0eWxlLlxuICAvLyBCYWNrZ3JvdW5kVGFzay50c3ggZGVsZWdhdGVzIHRoZSB3aG9sZSA8VGV4dD4gd3JhcHBlciBoZXJlIHNvIHRoZVxuICAvLyBncmFkaWVudCBzcGFucyB0aGUgdGl0bGUsIG5vdCBqdXN0IHRoZSB0cmFpbGluZyBzdGF0dXMuXG4gIGlmIChzZXNzaW9uLmlzUmVtb3RlUmV2aWV3KSB7XG4gICAgcmV0dXJuIDxSZXZpZXdSYWluYm93TGluZSBzZXNzaW9uPXtzZXNzaW9ufSAvPlxuICB9XG5cbiAgaWYgKHNlc3Npb24uc3RhdHVzID09PSAnY29tcGxldGVkJykge1xuICAgIHJldHVybiAoXG4gICAgICA8VGV4dCBib2xkIGNvbG9yPVwic3VjY2Vzc1wiIGRpbUNvbG9yPlxuICAgICAgICBkb25lXG4gICAgICA8L1RleHQ+XG4gICAgKVxuICB9XG5cbiAgaWYgKHNlc3Npb24uc3RhdHVzID09PSAnZmFpbGVkJykge1xuICAgIHJldHVybiAoXG4gICAgICA8VGV4dCBib2xkIGNvbG9yPVwiZXJyb3JcIiBkaW1Db2xvcj5cbiAgICAgICAgZXJyb3JcbiAgICAgIDwvVGV4dD5cbiAgICApXG4gIH1cblxuICBpZiAoIXNlc3Npb24udG9kb0xpc3QubGVuZ3RoKSB7XG4gICAgcmV0dXJuIDxUZXh0IGRpbUNvbG9yPntzZXNzaW9uLnN0YXR1c33igKY8L1RleHQ+XG4gIH1cblxuICBjb25zdCBjb21wbGV0ZWQgPSBjb3VudChzZXNzaW9uLnRvZG9MaXN0LCBfID0+IF8uc3RhdHVzID09PSAnY29tcGxldGVkJylcbiAgY29uc3QgdG90YWwgPSBzZXNzaW9uLnRvZG9MaXN0Lmxlbmd0aFxuICByZXR1cm4gKFxuICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAge2NvbXBsZXRlZH0ve3RvdGFsfVxuICAgIDwvVGV4dD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxNQUFNLFFBQVEsT0FBTztBQUNyQyxjQUFjQyxv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
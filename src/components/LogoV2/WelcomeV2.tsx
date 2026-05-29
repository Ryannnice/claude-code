// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text、useTheme，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTheme } from 'src/ink.js';
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js';
// WELCOME_V2_WIDTH保存`58`，供终端 UI Welcome V2后续判断或输出使用。
const WELCOME_V2_WIDTH = 58;
// WelcomeV2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WelcomeV2() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(35);
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 Welcome V2分别处理这些返回值。
  const [theme] = useTheme();
  // 当 `env.terminal` 匹配 `"Apple_Terminal"` 时，终端渲染执行对应分支。
  if (env.terminal === "Apple_Terminal") {
    // t0 暂存 `<AppleTerminalWelcomeV2 theme={theme} welcomeMessage="Wel...` 的派生结果，便于缓存命中时直接复用。
    let t0;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== theme) {
      // t0 暂存 `<AppleTerminalWelcomeV2 theme={theme} welcomeMessage="Wel...` 生成的渲染片段，后续返回路径直接复用。
      t0 = <AppleTerminalWelcomeV2 theme={theme} welcomeMessage="Welcome to Claude Code" />;
      // $[0] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = theme;
      // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t0;
    } else {
      // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t0 = $[1];
    }
    // 返回 `t0`，作为终端渲染这次计算的结果。
    return t0;
  }
  // 满足 `["light", "light-daltonized", "light-ansi"].includes(theme)` 时，终端渲染执行该分支。
  if (["light", "light-daltonized", "light-ansi"].includes(theme)) {
    // t0 暂存 `<Text><Text color="claude">{"Welcome to Claude Code"} </T...` 的派生结果，便于缓存命中时直接复用。
    let t0;
    // t1 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // t2 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // t3 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // t4 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // t5 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591 "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // t6 暂存 `<Text>{" \u2591\u2591\u2591 \u2591\u2591\u2591\u2591\u259...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // t7 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591...` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // t8 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      // t0 暂存 `<Text><Text color="claude">{"Welcome to Claude Code"} </T...` 生成的渲染片段，后续返回路径直接复用。
      t0 = <Text><Text color="claude">{"Welcome to Claude Code"} </Text><Text dimColor={true}>v{MACRO.VERSION} </Text></Text>;
      // t1 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}</Text>;
      // t2 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text>{"                                                          "}</Text>;
      // t3 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text>{"                                                          "}</Text>;
      // t4 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text>{"                                                          "}</Text>;
      // t5 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591 "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text>{"            \u2591\u2591\u2591\u2591\u2591\u2591                                        "}</Text>;
      // t6 暂存 `<Text>{" \u2591\u2591\u2591 \u2591\u2591\u2591\u2591\u259...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Text>{"    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                      "}</Text>;
      // t7 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591...` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text>{"   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                    "}</Text>;
      // t8 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text>{"                                                          "}</Text>;
      // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t0;
      // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t1;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
      // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t3;
      // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t4;
      // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t5;
      // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t6;
      // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t7;
      // $[10] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t8;
    } else {
      // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t0 = $[2];
      // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[3];
      // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[4];
      // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[5];
      // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[6];
      // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[7];
      // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[8];
      // t7 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[9];
      // t8 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[10];
    }
    // t9 暂存 `<Text><Text dimColor={true}>{" \u2591\u2591\u2591\u2591"}...` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
      // t9 暂存 `<Text><Text dimColor={true}>{" \u2591\u2591\u2591\u2591"}...` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Text><Text dimColor={true}>{"                           \u2591\u2591\u2591\u2591"}</Text><Text>{"                     \u2588\u2588    "}</Text></Text>;
      // $[11] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[11];
    }
    // t10 暂存 `<Text><Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // t11 暂存 `<Text>{" \u2592\u2592 \u2588\u2588 \u2592"}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      // t10 暂存 `<Text><Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Text><Text dimColor={true}>{"                         \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591"}</Text><Text>{"               \u2588\u2588\u2592\u2592\u2588\u2588  "}</Text></Text>;
      // t11 暂存 `<Text>{" \u2592\u2592 \u2588\u2588 \u2592"}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t11 = <Text>{"                                            \u2592\u2592      \u2588\u2588   \u2592"}</Text>;
      // $[12] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t10;
      // $[13] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t11;
    } else {
      // t10 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[12];
      // t11 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[13];
    }
    // t12 暂存 `<Text>{" "}<Text color="clawd_body"> █████████ </Text>{" ...` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      // t12 暂存 `<Text>{" "}<Text color="clawd_body"> █████████ </Text>{" ...` 生成的渲染片段，后续返回路径直接复用。
      t12 = <Text>{"      "}<Text color="clawd_body"> █████████ </Text>{"                         \u2592\u2592\u2591\u2591\u2592\u2592      \u2592 \u2592\u2592"}</Text>;
      // $[14] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[14];
    }
    // t13 暂存 `<Text>{" "}<Text color="clawd_body" backgroundColor="claw...` 的派生结果，便于缓存命中时直接复用。
    let t13;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      // t13 暂存 `<Text>{" "}<Text color="clawd_body" backgroundColor="claw...` 生成的渲染片段，后续返回路径直接复用。
      t13 = <Text>{"      "}<Text color="clawd_body" backgroundColor="clawd_background">██▄█████▄██</Text>{"                           \u2592\u2592         \u2592\u2592 "}</Text>;
      // $[15] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t13;
    } else {
      // t13 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t13 = $[15];
    }
    // t14 暂存 `<Text>{" "}<Text color="clawd_body"> █████████ </Text>{" ...` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      // t14 暂存 `<Text>{" "}<Text color="clawd_body"> █████████ </Text>{" ...` 生成的渲染片段，后续返回路径直接复用。
      t14 = <Text>{"      "}<Text color="clawd_body"> █████████ </Text>{"                          \u2591          \u2592   "}</Text>;
      // $[16] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t14;
    } else {
      // t14 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[16];
    }
    // t15 暂存 `<Box width={WELCOME_V2_WIDTH}><Text>{t0}{t1}{t2}{t3}{t4}{...` 的派生结果，便于缓存命中时直接复用。
    let t15;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
      // t15 暂存 `<Box width={WELCOME_V2_WIDTH}><Text>{t0}{t1}{t2}{t3}{t4}{...` 生成的渲染片段，后续返回路径直接复用。
      t15 = <Box width={WELCOME_V2_WIDTH}><Text>{t0}{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}{t9}{t10}{t11}{t12}{t13}{t14}<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}<Text color="clawd_body">{"\u2588 \u2588   \u2588 \u2588"}</Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2591\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2592\u2026\u2026\u2026\u2026"}</Text></Text></Box>;
      // $[17] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t15;
    } else {
      // t15 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
      t15 = $[17];
    }
    // 返回 `t15`，作为终端渲染这次计算的结果。
    return t15;
  }
  // t0 暂存 `<Text><Text color="claude">{"Welcome to Claude Code"} </T...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t1 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `<Text>{" * \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u25...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 暂存 `<Text>{" * \u2588\u2588\u2588\u2593\u2591 \u2591\u2591 "}...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591 \u2588\u258...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `<Text>{" \u2591\u2591\u2591 \u2591\u2591\u2591\u2591\u259...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<Text><Text color="claude">{"Welcome to Claude Code"} </T...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Text><Text color="claude">{"Welcome to Claude Code"} </Text><Text dimColor={true}>v{MACRO.VERSION} </Text></Text>;
    // t1 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}</Text>;
    // t2 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text>{"                                                          "}</Text>;
    // t3 暂存 `<Text>{" * \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u25...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>{"     *                                       \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2591     "}</Text>;
    // t4 暂存 `<Text>{" * \u2588\u2588\u2588\u2593\u2591 \u2591\u2591 "}...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text>{"                                 *         \u2588\u2588\u2588\u2593\u2591     \u2591\u2591   "}</Text>;
    // t5 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591 \u2588\u258...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>{"            \u2591\u2591\u2591\u2591\u2591\u2591                        \u2588\u2588\u2588\u2593\u2591           "}</Text>;
    // t6 暂存 `<Text>{" \u2591\u2591\u2591 \u2591\u2591\u2591\u2591\u259...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text>{"    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                      \u2588\u2588\u2588\u2593\u2591           "}</Text>;
    // $[18] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t0;
    // $[19] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t1;
    // $[20] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t2;
    // $[21] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t3;
    // $[22] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t4;
    // $[23] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t5;
    // $[24] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t6;
  } else {
    // t0 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[18];
    // t1 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[19];
    // t2 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[20];
    // t3 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[21];
    // t4 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[22];
    // t5 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[23];
    // t6 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[24];
  }
  // t10 暂存 `<Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u2591\u...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // t11 暂存 `<Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u2591\u...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // t7 暂存 `<Text><Text>{" \u2591\u2591\u2591\u2591\u2591\u2591\u2591...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // t8 暂存 `<Text>{" \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // t9 暂存 `<Text dimColor={true}>{" * \u2591\u2591\u2591\u2591 "}</T...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Text><Text>{" \u2591\u2591\u2591\u2591\u2591\u2591\u2591...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text><Text>{"   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591    "}</Text><Text bold={true}>*</Text><Text>{"                \u2588\u2588\u2593\u2591\u2591      \u2593   "}</Text></Text>;
    // t8 暂存 `<Text>{" \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text>{"                                             \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593\u2591    "}</Text>;
    // t9 暂存 `<Text dimColor={true}>{" * \u2591\u2591\u2591\u2591 "}</T...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text dimColor={true}>{" *                                 \u2591\u2591\u2591\u2591                   "}</Text>;
    // t10 暂存 `<Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u2591\u...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text dimColor={true}>{"                                 \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                 "}</Text>;
    // t11 暂存 `<Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u2591\u...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text dimColor={true}>{"                               \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591           "}</Text>;
    // $[25] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t10;
    // $[26] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t11;
    // $[27] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t7;
    // $[28] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t8;
    // $[29] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t9;
  } else {
    // t10 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[25];
    // t11 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[26];
    // t7 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[27];
    // t8 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[28];
    // t9 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[29];
  }
  // t12 暂存 `<Text color="clawd_body"> █████████ </Text>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
    // t12 暂存 `<Text color="clawd_body"> █████████ </Text>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text color="clawd_body"> █████████ </Text>;
    // $[30] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[30];
  }
  // t13 暂存 `<Text>{" "}{t12}{" "}<Text dimColor={true}>*</Text><Text>...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
    // t13 暂存 `<Text>{" "}{t12}{" "}<Text dimColor={true}>*</Text><Text>...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Text>{"      "}{t12}{"                                       "}<Text dimColor={true}>*</Text><Text> </Text></Text>;
    // $[31] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[31];
  }
  // t14 暂存 `<Text>{" "}<Text color="clawd_body">██▄█████▄██</Text><Te...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
    // t14 暂存 `<Text>{" "}<Text color="clawd_body">██▄█████▄██</Text><Te...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Text>{"      "}<Text color="clawd_body">██▄█████▄██</Text><Text>{"                        "}</Text><Text bold={true}>*</Text><Text>{"                "}</Text></Text>;
    // $[32] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[32];
  }
  // t15 暂存 `<Text>{" "}<Text color="clawd_body"> █████████ </Text>{" ...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    // t15 暂存 `<Text>{" "}<Text color="clawd_body"> █████████ </Text>{" ...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Text>{"      "}<Text color="clawd_body"> █████████ </Text>{"     *                                   "}</Text>;
    // $[33] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[33];
  }
  // t16 暂存 `<Box width={WELCOME_V2_WIDTH}><Text>{t0}{t1}{t2}{t3}{t4}{...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
    // t16 暂存 `<Box width={WELCOME_V2_WIDTH}><Text>{t0}{t1}{t2}{t3}{t4}{...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Box width={WELCOME_V2_WIDTH}><Text>{t0}{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}{t9}{t10}{t11}{t13}{t14}{t15}<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}<Text color="clawd_body">{"\u2588 \u2588   \u2588 \u2588"}</Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}</Text></Text></Box>;
    // $[34] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[34];
  }
  // 返回 `t16`，作为终端渲染这次计算的结果。
  return t16;
}
// AppleTerminalWelcomeV2Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type AppleTerminalWelcomeV2Props = {
  theme: string;
  welcomeMessage: string;
};
// AppleTerminalWelcomeV2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function AppleTerminalWelcomeV2(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(44);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    theme,
    welcomeMessage
  } = t0;
  // isLightTheme记录 `includes` 是否成立，终端渲染随后按该结果分支。
  const isLightTheme = ["light", "light-daltonized", "light-ansi"].includes(theme);
  // 满足 `isLightTheme` 时，终端渲染执行该分支。
  if (isLightTheme) {
    // t1 暂存 `<Text color="claude">{welcomeMessage} </Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== welcomeMessage) {
      // t1 暂存 `<Text color="claude">{welcomeMessage} </Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text color="claude">{welcomeMessage} </Text>;
      // $[0] 缓存 `welcomeMessage`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = welcomeMessage;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[1];
    }
    // t2 暂存 `<Text dimColor={true}>v{MACRO.VERSION} </Text>` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      // t2 暂存 `<Text dimColor={true}>v{MACRO.VERSION} </Text>` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text dimColor={true}>v{MACRO.VERSION} </Text>;
      // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[2];
    }
    // t3 暂存 `<Text>{t1}{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== t1) {
      // t3 暂存 `<Text>{t1}{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text>{t1}{t2}</Text>;
      // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t1;
      // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[4];
    }
    // t10 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
    let t10;
    // t11 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
    let t11;
    // t4 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // t5 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // t6 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // t7 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // t8 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591 "}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // t9 暂存 `<Text>{" \u2591\u2591\u2591 \u2591\u2591\u2591\u2591\u259...` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}</Text>;
      // t5 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text>{"                                                          "}</Text>;
      // t6 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Text>{"                                                          "}</Text>;
      // t7 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text>{"                                                          "}</Text>;
      // t8 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591 "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text>{"            \u2591\u2591\u2591\u2591\u2591\u2591                                        "}</Text>;
      // t9 暂存 `<Text>{" \u2591\u2591\u2591 \u2591\u2591\u2591\u2591\u259...` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Text>{"    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                      "}</Text>;
      // t10 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Text>{"   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                    "}</Text>;
      // t11 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t11 = <Text>{"                                                          "}</Text>;
      // $[5] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t10;
      // $[6] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t11;
      // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t4;
      // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t5;
      // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t6;
      // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t7;
      // $[11] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t8;
      // $[12] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t9;
    } else {
      // t10 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[5];
      // t11 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[6];
      // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[7];
      // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[8];
      // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[9];
      // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[10];
      // t8 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[11];
      // t9 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[12];
    }
    // t12 暂存 `<Text><Text dimColor={true}>{" \u2591\u2591\u2591\u2591"}...` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      // t12 暂存 `<Text><Text dimColor={true}>{" \u2591\u2591\u2591\u2591"}...` 生成的渲染片段，后续返回路径直接复用。
      t12 = <Text><Text dimColor={true}>{"                           \u2591\u2591\u2591\u2591"}</Text><Text>{"                     \u2588\u2588    "}</Text></Text>;
      // $[13] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[13];
    }
    // t13 暂存 `<Text><Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u...` 的派生结果，便于缓存命中时直接复用。
    let t13;
    // t14 暂存 `<Text>{" \u2592\u2592 \u2588\u2588 \u2592"}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // t15 暂存 `<Text>{" \u2592\u2592\u2591\u2591\u2592\u2592 \u2592 \u25...` 的派生结果，便于缓存命中时直接复用。
    let t15;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      // t13 暂存 `<Text><Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u...` 生成的渲染片段，后续返回路径直接复用。
      t13 = <Text><Text dimColor={true}>{"                         \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591"}</Text><Text>{"               \u2588\u2588\u2592\u2592\u2588\u2588  "}</Text></Text>;
      // t14 暂存 `<Text>{" \u2592\u2592 \u2588\u2588 \u2592"}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t14 = <Text>{"                                            \u2592\u2592      \u2588\u2588   \u2592"}</Text>;
      // t15 暂存 `<Text>{" \u2592\u2592\u2591\u2591\u2592\u2592 \u2592 \u25...` 生成的渲染片段，后续返回路径直接复用。
      t15 = <Text>{"                                          \u2592\u2592\u2591\u2591\u2592\u2592      \u2592 \u2592\u2592"}</Text>;
      // $[14] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t13;
      // $[15] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t14;
      // $[16] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t15;
    } else {
      // t13 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t13 = $[14];
      // t14 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[15];
      // t15 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t15 = $[16];
    }
    // t16 暂存 `<Text>{" "}<Text color="clawd_body">▗</Text><Text color="...` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
      // t16 暂存 `<Text>{" "}<Text color="clawd_body">▗</Text><Text color="...` 生成的渲染片段，后续返回路径直接复用。
      t16 = <Text>{"      "}<Text color="clawd_body">▗</Text><Text color="clawd_background" backgroundColor="clawd_body">{" "}▗{"     "}▖{" "}</Text><Text color="clawd_body">▖</Text>{"                           \u2592\u2592         \u2592\u2592 "}</Text>;
      // $[17] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t16;
    } else {
      // t16 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[17];
    }
    // t17 暂存 `<Text>{" "}<Text backgroundColor="clawd_body">{" ".repeat...` 的派生结果，便于缓存命中时直接复用。
    let t17;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
      // t17 暂存 `<Text>{" "}<Text backgroundColor="clawd_body">{" ".repeat...` 生成的渲染片段，后续返回路径直接复用。
      t17 = <Text>{"       "}<Text backgroundColor="clawd_body">{" ".repeat(9)}</Text>{"                           \u2591          \u2592   "}</Text>;
      // $[18] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t17;
    } else {
      // t17 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t17 = $[18];
    }
    // t18 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}<Text...` 的派生结果，便于缓存命中时直接复用。
    let t18;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
      // t18 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}<Text...` 生成的渲染片段，后续返回路径直接复用。
      t18 = <Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}<Text backgroundColor="clawd_body"> </Text><Text> </Text><Text backgroundColor="clawd_body"> </Text><Text>{"   "}</Text><Text backgroundColor="clawd_body"> </Text><Text> </Text><Text backgroundColor="clawd_body"> </Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2591\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2592\u2026\u2026\u2026\u2026"}</Text>;
      // $[19] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t18;
    } else {
      // t18 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t18 = $[19];
    }
    // t19 暂存 `<Box width={WELCOME_V2_WIDTH}><Text>{t3}{t4}{t5}{t6}{t7}{...` 的派生结果，便于缓存命中时直接复用。
    let t19;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[20] !== t3) {
      // t19 暂存 `<Box width={WELCOME_V2_WIDTH}><Text>{t3}{t4}{t5}{t6}{t7}{...` 生成的渲染片段，后续返回路径直接复用。
      t19 = <Box width={WELCOME_V2_WIDTH}><Text>{t3}{t4}{t5}{t6}{t7}{t8}{t9}{t10}{t11}{t12}{t13}{t14}{t15}{t16}{t17}{t18}</Text></Box>;
      // $[20] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t3;
      // $[21] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t19;
    } else {
      // t19 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
      t19 = $[21];
    }
    // 返回 `t19`，作为终端渲染这次计算的结果。
    return t19;
  }
  // t1 暂存 `<Text color="claude">{welcomeMessage} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== welcomeMessage) {
    // t1 暂存 `<Text color="claude">{welcomeMessage} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color="claude">{welcomeMessage} </Text>;
    // $[22] 缓存 `welcomeMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = welcomeMessage;
    // $[23] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[23];
  }
  // t2 暂存 `<Text dimColor={true}>v{MACRO.VERSION} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Text dimColor={true}>v{MACRO.VERSION} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>v{MACRO.VERSION} </Text>;
    // $[24] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[24];
  }
  // t3 暂存 `<Text>{t1}{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== t1) {
    // t3 暂存 `<Text>{t1}{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>{t1}{t2}</Text>;
    // $[25] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t1;
    // $[26] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[26];
  }
  // t4 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 暂存 `<Text>{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `<Text>{" * \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u25...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // t7 暂存 `<Text>{" * \u2588\u2588\u2588\u2593\u2591 \u2591\u2591 "}...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // t8 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591 \u2588\u258...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // t9 暂存 `<Text>{" \u2591\u2591\u2591 \u2591\u2591\u2591\u2591\u259...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}</Text>;
    // t5 暂存 `<Text>{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>{"                                                          "}</Text>;
    // t6 暂存 `<Text>{" * \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u25...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text>{"     *                                       \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2591     "}</Text>;
    // t7 暂存 `<Text>{" * \u2588\u2588\u2588\u2593\u2591 \u2591\u2591 "}...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text>{"                                 *         \u2588\u2588\u2588\u2593\u2591     \u2591\u2591   "}</Text>;
    // t8 暂存 `<Text>{" \u2591\u2591\u2591\u2591\u2591\u2591 \u2588\u258...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text>{"            \u2591\u2591\u2591\u2591\u2591\u2591                        \u2588\u2588\u2588\u2593\u2591           "}</Text>;
    // t9 暂存 `<Text>{" \u2591\u2591\u2591 \u2591\u2591\u2591\u2591\u259...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text>{"    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                      \u2588\u2588\u2588\u2593\u2591           "}</Text>;
    // $[27] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t4;
    // $[28] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t5;
    // $[29] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t6;
    // $[30] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t7;
    // $[31] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t8;
    // $[32] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t9;
  } else {
    // t4 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[27];
    // t5 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[28];
    // t6 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[29];
    // t7 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[30];
    // t8 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[31];
    // t9 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[32];
  }
  // t10 暂存 `<Text><Text>{" \u2591\u2591\u2591\u2591\u2591\u2591\u2591...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // t11 暂存 `<Text>{" \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // t12 暂存 `<Text dimColor={true}>{" * \u2591\u2591\u2591\u2591 "}</T...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // t13 暂存 `<Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u2591\u...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // t14 暂存 `<Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u2591\u...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `<Text><Text>{" \u2591\u2591\u2591\u2591\u2591\u2591\u2591...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text><Text>{"   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591    "}</Text><Text bold={true}>*</Text><Text>{"                \u2588\u2588\u2593\u2591\u2591      \u2593   "}</Text></Text>;
    // t11 暂存 `<Text>{" \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text>{"                                             \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593\u2591    "}</Text>;
    // t12 暂存 `<Text dimColor={true}>{" * \u2591\u2591\u2591\u2591 "}</T...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text dimColor={true}>{" *                                 \u2591\u2591\u2591\u2591                   "}</Text>;
    // t13 暂存 `<Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u2591\u...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Text dimColor={true}>{"                                 \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                 "}</Text>;
    // t14 暂存 `<Text dimColor={true}>{" \u2591\u2591\u2591\u2591\u2591\u...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Text dimColor={true}>{"                               \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591           "}</Text>;
    // $[33] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t10;
    // $[34] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t11;
    // $[35] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t12;
    // $[36] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t13;
    // $[37] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t14;
  } else {
    // t10 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[33];
    // t11 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[34];
    // t12 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[35];
    // t13 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[36];
    // t14 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[37];
  }
  // t15 暂存 `<Text>{" "}<Text dimColor={true}>*</Text><Text> </Text></...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
    // t15 暂存 `<Text>{" "}<Text dimColor={true}>*</Text><Text> </Text></...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Text>{"                                                      "}<Text dimColor={true}>*</Text><Text> </Text></Text>;
    // $[38] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[38];
  }
  // t16 暂存 `<Text>{" "}<Text color="clawd_body">▗</Text><Text color="...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[39] === Symbol.for("react.memo_cache_sentinel")) {
    // t16 暂存 `<Text>{" "}<Text color="clawd_body">▗</Text><Text color="...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Text>{"        "}<Text color="clawd_body">▗</Text><Text color="clawd_background" backgroundColor="clawd_body">{" "}▗{"     "}▖{" "}</Text><Text color="clawd_body">▖</Text><Text>{"                       "}</Text><Text bold={true}>*</Text><Text>{"                "}</Text></Text>;
    // $[39] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[39];
  }
  // t17 暂存 `<Text>{" "}<Text backgroundColor="clawd_body">{" ".repeat...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[40] === Symbol.for("react.memo_cache_sentinel")) {
    // t17 暂存 `<Text>{" "}<Text backgroundColor="clawd_body">{" ".repeat...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Text>{"        "}<Text backgroundColor="clawd_body">{" ".repeat(9)}</Text>{"      *                                   "}</Text>;
    // $[40] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[40];
  }
  // t18 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}<Text...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
    // t18 暂存 `<Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}<Text...` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}<Text backgroundColor="clawd_body"> </Text><Text> </Text><Text backgroundColor="clawd_body"> </Text><Text>{"   "}</Text><Text backgroundColor="clawd_body"> </Text><Text> </Text><Text backgroundColor="clawd_body"> </Text>{"\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"}</Text>;
    // $[41] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[41];
  }
  // t19 暂存 `<Box width={WELCOME_V2_WIDTH}><Text>{t3}{t4}{t5}{t6}{t7}{...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[42] !== t3) {
    // t19 暂存 `<Box width={WELCOME_V2_WIDTH}><Text>{t3}{t4}{t5}{t6}{t7}{...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Box width={WELCOME_V2_WIDTH}><Text>{t3}{t4}{t5}{t6}{t7}{t8}{t9}{t10}{t11}{t12}{t13}{t14}{t15}{t16}{t17}{t18}</Text></Box>;
    // $[42] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t3;
    // $[43] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[43];
  }
  // 返回 `t19`，作为终端渲染这次计算的结果。
  return t19;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJ1c2VUaGVtZSIsImVudiIsIldFTENPTUVfVjJfV0lEVEgiLCJXZWxjb21lVjIiLCIkIiwiX2MiLCJ0aGVtZSIsInRlcm1pbmFsIiwidDAiLCJ3ZWxjb21lTWVzc2FnZSIsImluY2x1ZGVzIiwidDEiLCJ0MiIsInQzIiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsIlN5bWJvbCIsImZvciIsIk1BQ1JPIiwiVkVSU0lPTiIsInQ5IiwidDEwIiwidDExIiwidDEyIiwidDEzIiwidDE0IiwidDE1IiwidDE2IiwiQXBwbGVUZXJtaW5hbFdlbGNvbWVWMlByb3BzIiwiQXBwbGVUZXJtaW5hbFdlbGNvbWVWMiIsImlzTGlnaHRUaGVtZSIsInQxNyIsInJlcGVhdCIsInQxOCIsInQxOSJdLCJzb3VyY2VzIjpbIldlbGNvbWVWMi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0LCB1c2VUaGVtZSB9IGZyb20gJ3NyYy9pbmsuanMnXG5pbXBvcnQgeyBlbnYgfSBmcm9tICcuLi8uLi91dGlscy9lbnYuanMnXG5cbmNvbnN0IFdFTENPTUVfVjJfV0lEVEggPSA1OFxuXG5leHBvcnQgZnVuY3Rpb24gV2VsY29tZVYyKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG4gIGNvbnN0IHdlbGNvbWVNZXNzYWdlID0gJ1dlbGNvbWUgdG8gQ2xhdWRlIENvZGUnXG5cbiAgaWYgKGVudi50ZXJtaW5hbCA9PT0gJ0FwcGxlX1Rlcm1pbmFsJykge1xuICAgIHJldHVybiAoXG4gICAgICA8QXBwbGVUZXJtaW5hbFdlbGNvbWVWMiB0aGVtZT17dGhlbWV9IHdlbGNvbWVNZXNzYWdlPXt3ZWxjb21lTWVzc2FnZX0gLz5cbiAgICApXG4gIH1cblxuICBpZiAoWydsaWdodCcsICdsaWdodC1kYWx0b25pemVkJywgJ2xpZ2h0LWFuc2knXS5pbmNsdWRlcyh0aGVtZSkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCB3aWR0aD17V0VMQ09NRV9WMl9XSURUSH0+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF1ZGVcIj57d2VsY29tZU1lc3NhZ2V9IDwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPnZ7TUFDUk8uVkVSU0lPTn0gPC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIHsn4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCmJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7JyAgICAgICAgICAgIOKWkeKWkeKWkeKWkeKWkeKWkSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIHsnICAgIOKWkeKWkeKWkSAgIOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7JyAgIOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57JyAgICAgICAgICAgICAgICAgICAgICAgICAgIOKWkeKWkeKWkeKWkSd9PC9UZXh0PlxuICAgICAgICAgICAgPFRleHQ+eycgICAgICAgICAgICAgICAgICAgICDilojiloggICAgJ308L1RleHQ+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+eycgICAgICAgICAgICAgICAgICAgICAgICAg4paR4paR4paR4paR4paR4paR4paR4paR4paR4paRJ308L1RleHQ+XG4gICAgICAgICAgICA8VGV4dD57JyAgICAgICAgICAgICAgIOKWiOKWiOKWkuKWkuKWiOKWiCAgJ308L1RleHQ+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKWkuKWkiAgICAgIOKWiOKWiCAgIOKWkid9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeycgICAgICAnfVxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+IOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCA8L1RleHQ+XG4gICAgICAgICAgICB7JyAgICAgICAgICAgICAgICAgICAgICAgICDilpLilpLilpHilpHilpLilpIgICAgICDilpIg4paS4paSJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7JyAgICAgICd9XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JvZHlcIiBiYWNrZ3JvdW5kQ29sb3I9XCJjbGF3ZF9iYWNrZ3JvdW5kXCI+XG4gICAgICAgICAgICAgIOKWiOKWiOKWhOKWiOKWiOKWiOKWiOKWiOKWhOKWiOKWiFxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICDilpLilpIgICAgICAgICDilpLilpIgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7JyAgICAgICd9XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JvZHlcIj4g4paI4paI4paI4paI4paI4paI4paI4paI4paIIDwvVGV4dD5cbiAgICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICDilpEgICAgICAgICAg4paSICAgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7J+KApuKApuKApuKApuKApuKApuKApid9XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JvZHlcIj57J+KWiCDiloggICDilogg4paIJ308L1RleHQ+XG4gICAgICAgICAgICB7J+KApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKWkeKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKWkuKApuKApuKApuKApid9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggd2lkdGg9e1dFTENPTUVfVjJfV0lEVEh9PlxuICAgICAgPFRleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+e3dlbGNvbWVNZXNzYWdlfSA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+dntNQUNSTy5WRVJTSU9OfSA8L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeyfigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKYnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeycgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilojilojilojilojilojilpPilpPilpEgICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqICAgICAgICAg4paI4paI4paI4paT4paRICAgICDilpHilpEgICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgICAgICAgICAg4paR4paR4paR4paR4paR4paRICAgICAgICAgICAgICAgICAgICAgICAg4paI4paI4paI4paT4paRICAgICAgICAgICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgIOKWkeKWkeKWkSAgIOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkSAgICAgICAgICAgICAgICAgICAgICDilojilojilojilpPilpEgICAgICAgICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgPFRleHQ+eycgICDilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpEgICAgJ308L1RleHQ+XG4gICAgICAgICAgPFRleHQgYm9sZD4qPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PnsnICAgICAgICAgICAgICAgIOKWiOKWiOKWk+KWkeKWkSAgICAgIOKWkyAgICd9PC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4paR4paT4paT4paI4paI4paI4paT4paT4paRICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgeycgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKWkeKWkeKWkeKWkSAgICAgICAgICAgICAgICAgICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4paR4paR4paR4paR4paR4paR4paR4paRICAgICAgICAgICAgICAgICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkSAgICAgICAgICAgJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7JyAgICAgICd9XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+IOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiCA8L1RleHQ+XG4gICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnfVxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPio8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+IDwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7JyAgICAgICd9XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+4paI4paI4paE4paI4paI4paI4paI4paI4paE4paI4paIPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PnsnICAgICAgICAgICAgICAgICAgICAgICAgJ308L1RleHQ+XG4gICAgICAgICAgPFRleHQgYm9sZD4qPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PnsnICAgICAgICAgICAgICAgICd9PC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgICAgJ31cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JvZHlcIj4g4paI4paI4paI4paI4paI4paI4paI4paI4paIIDwvVGV4dD5cbiAgICAgICAgICB7JyAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7J+KApuKApuKApuKApuKApuKApuKApid9XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+eyfilogg4paIICAg4paIIOKWiCd9PC9UZXh0PlxuICAgICAgICAgIHsn4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCmJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG5cbnR5cGUgQXBwbGVUZXJtaW5hbFdlbGNvbWVWMlByb3BzID0ge1xuICB0aGVtZTogc3RyaW5nXG4gIHdlbGNvbWVNZXNzYWdlOiBzdHJpbmdcbn1cblxuZnVuY3Rpb24gQXBwbGVUZXJtaW5hbFdlbGNvbWVWMih7XG4gIHRoZW1lLFxuICB3ZWxjb21lTWVzc2FnZSxcbn06IEFwcGxlVGVybWluYWxXZWxjb21lVjJQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGlzTGlnaHRUaGVtZSA9IFsnbGlnaHQnLCAnbGlnaHQtZGFsdG9uaXplZCcsICdsaWdodC1hbnNpJ10uaW5jbHVkZXMoXG4gICAgdGhlbWUsXG4gIClcblxuICBpZiAoaXNMaWdodFRoZW1lKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggd2lkdGg9e1dFTENPTUVfVjJfV0lEVEh9PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+e3dlbGNvbWVNZXNzYWdlfSA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj52e01BQ1JPLlZFUlNJT059IDwvVGV4dD5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7J+KApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApid9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeycgICAgICAgICAgICDilpHilpHilpHilpHilpHilpEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7JyAgICDilpHilpHilpEgICDilpHilpHilpHilpHilpHilpHilpHilpHilpHilpEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeycgICDilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+eycgICAgICAgICAgICAgICAgICAgICAgICAgICDilpHilpHilpHilpEnfTwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0PnsnICAgICAgICAgICAgICAgICAgICAg4paI4paIICAgICd9PC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPnsnICAgICAgICAgICAgICAgICAgICAgICAgIOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkSd9PC9UZXh0PlxuICAgICAgICAgICAgPFRleHQ+eycgICAgICAgICAgICAgICDilojilojilpLilpLilojiloggICd9PC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilpLilpIgICAgICDilojiloggICDilpInfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4paS4paS4paR4paR4paS4paSICAgICAg4paSIOKWkuKWkid9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeycgICAgICAnfVxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+4paXPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9iYWNrZ3JvdW5kXCIgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYm9keVwiPlxuICAgICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAgICDilpd7JyAgICAgJ33ilpZ7JyAnfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+4paWPC9UZXh0PlxuICAgICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICDilpLilpIgICAgICAgICDilpLilpIgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICB7JyAgICAgICAnfVxuICAgICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYm9keVwiPnsnICcucmVwZWF0KDkpfTwvVGV4dD5cbiAgICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAg4paRICAgICAgICAgIOKWkiAgICd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgeyfigKbigKbigKbigKbigKbigKbigKYnfVxuICAgICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYm9keVwiPiA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYm9keVwiPiA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dD57JyAgICd9PC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYm9keVwiPiA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYm9keVwiPiA8L1RleHQ+XG4gICAgICAgICAgICB7J+KApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKWkeKApuKApuKApuKApuKApuKApuKApuKApuKApuKApuKWkuKApuKApuKApuKApid9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggd2lkdGg9e1dFTENPTUVfVjJfV0lEVEh9PlxuICAgICAgPFRleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+e3dlbGNvbWVNZXNzYWdlfSA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+dntNQUNSTy5WRVJTSU9OfSA8L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeyfigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKbigKYnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeycgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDilojilojilojilojilojilpPilpPilpEgICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqICAgICAgICAg4paI4paI4paI4paT4paRICAgICDilpHilpEgICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgICAgICAgICAg4paR4paR4paR4paR4paR4paRICAgICAgICAgICAgICAgICAgICAgICAg4paI4paI4paI4paT4paRICAgICAgICAgICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgIOKWkeKWkeKWkSAgIOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkSAgICAgICAgICAgICAgICAgICAgICDilojilojilojilpPilpEgICAgICAgICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgPFRleHQ+eycgICDilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpHilpEgICAgJ308L1RleHQ+XG4gICAgICAgICAgPFRleHQgYm9sZD4qPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PnsnICAgICAgICAgICAgICAgIOKWiOKWiOKWk+KWkeKWkSAgICAgIOKWkyAgICd9PC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4paR4paT4paT4paI4paI4paI4paT4paT4paRICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgeycgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKWkeKWkeKWkeKWkSAgICAgICAgICAgICAgICAgICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4paR4paR4paR4paR4paR4paR4paR4paRICAgICAgICAgICAgICAgICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIHsnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkeKWkSAgICAgICAgICAgJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+KjwvVGV4dD5cbiAgICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHsnICAgICAgICAnfVxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhd2RfYm9keVwiPuKWlzwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXdkX2JhY2tncm91bmRcIiBiYWNrZ3JvdW5kQ29sb3I9XCJjbGF3ZF9ib2R5XCI+XG4gICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAg4paXeycgICAgICd94paWeycgJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF3ZF9ib2R5XCI+4paWPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PnsnICAgICAgICAgICAgICAgICAgICAgICAnfTwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBib2xkPio8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+eycgICAgICAgICAgICAgICAgJ308L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeycgICAgICAgICd9XG4gICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYm9keVwiPnsnICcucmVwZWF0KDkpfTwvVGV4dD5cbiAgICAgICAgICB7JyAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeyfigKbigKbigKbigKbigKbigKbigKYnfVxuICAgICAgICAgIDxUZXh0IGJhY2tncm91bmRDb2xvcj1cImNsYXdkX2JvZHlcIj4gPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PiA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwiY2xhd2RfYm9keVwiPiA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+eycgICAnfTwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBiYWNrZ3JvdW5kQ29sb3I9XCJjbGF3ZF9ib2R5XCI+IDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGJhY2tncm91bmRDb2xvcj1cImNsYXdkX2JvZHlcIj4gPC9UZXh0PlxuICAgICAgICAgIHsn4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCm4oCmJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLFlBQVk7QUFDaEQsU0FBU0MsR0FBRyxRQUFRLG9CQUFvQjtBQUV4QyxNQUFNQyxnQkFBZ0IsR0FBRyxFQUFFO0FBRTNCLE9BQU8sU0FBQUMsVUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUNMLE9BQUFDLEtBQUEsSUFBZ0JOLFFBQVEsQ0FBQyxDQUFDO0VBRzFCLElBQUlDLEdBQUcsQ0FBQU0sUUFBUyxLQUFLLGdCQUFnQjtJQUFBLElBQUFDLEVBQUE7SUFBQSxJQUFBSixDQUFBLFFBQUFFLEtBQUE7TUFFakNF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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text、color，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, color } from '../../ink.js';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 复用 getLayoutMode、calculateLayoutDimensions、calculateOptimalLeftWidth、formatWelcomeMessage、truncatePath、getRecentActivitySync、getRecentReleaseNotesSync、getLogoDisplayData 工具函数，把通用处理留在 ../../utils/logoV2Utils.js 中维护。
import { getLayoutMode, calculateLayoutDimensions, calculateOptimalLeftWidth, formatWelcomeMessage, truncatePath, getRecentActivitySync, getRecentReleaseNotesSync, getLogoDisplayData } from '../../utils/logoV2Utils.js';
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js';
// 复用 getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getDisplayPath } from '../../utils/file.js';
// 引入 Clawd，将 ./Clawd.js 中已经封装好的能力接到本文件流程里。
import { Clawd } from './Clawd.js';
// 引入 FeedColumn，将 ./FeedColumn.js 中已经封装好的能力接到本文件流程里。
import { FeedColumn } from './FeedColumn.js';
// 引入 createRecentActivityFeed、createWhatsNewFeed、createProjectOnboardingFeed、createGuestPassesFeed，将 ./feedConfigs.js 中已经封装好的能力接到本文件流程里。
import { createRecentActivityFeed, createWhatsNewFeed, createProjectOnboardingFeed, createGuestPassesFeed } from './feedConfigs.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 src/utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from 'src/utils/config.js';
// 复用 resolveThemeSetting 工具函数，把通用处理留在 src/utils/systemTheme.js 中维护。
import { resolveThemeSetting } from 'src/utils/systemTheme.js';
// 复用 getInitialSettings 工具函数，把通用处理留在 src/utils/settings/settings.js 中维护。
import { getInitialSettings } from 'src/utils/settings/settings.js';
// 复用 isDebugMode、isDebugToStdErr、getDebugLogPath 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { isDebugMode, isDebugToStdErr, getDebugLogPath } from 'src/utils/debug.js';
// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react';
// 引入 getSteps、shouldShowProjectOnboarding、incrementProjectOnboardingSeenCount，将 ../../projectOnboardingState.js 中已经封装好的能力接到本文件流程里。
import { getSteps, shouldShowProjectOnboarding, incrementProjectOnboardingSeenCount } from '../../projectOnboardingState.js';
// 引入 CondensedLogo，将 ./CondensedLogo.js 中已经封装好的能力接到本文件流程里。
import { CondensedLogo } from './CondensedLogo.js';
// 引入 OffscreenFreeze，将 ../OffscreenFreeze.js 中已经封装好的能力接到本文件流程里。
import { OffscreenFreeze } from '../OffscreenFreeze.js';
// 复用 checkForReleaseNotesSync 工具函数，把通用处理留在 ../../utils/releaseNotes.js 中维护。
import { checkForReleaseNotesSync } from '../../utils/releaseNotes.js';
// 接入 getDumpPromptsPath 服务层能力，把外部通信或共享状态交给 src/services/api/dumpPrompts.js 处理。
import { getDumpPromptsPath } from 'src/services/api/dumpPrompts.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 src/utils/envUtils.js 中维护。
import { isEnvTruthy } from 'src/utils/envUtils.js';
// 复用 getStartupPerfLogPath、isDetailedProfilingEnabled 工具函数，把通用处理留在 src/utils/startupProfiler.js 中维护。
import { getStartupPerfLogPath, isDetailedProfilingEnabled } from 'src/utils/startupProfiler.js';
// 引入 EmergencyTip，将 ./EmergencyTip.js 中已经封装好的能力接到本文件流程里。
import { EmergencyTip } from './EmergencyTip.js';
// 引入 VoiceModeNotice，将 ./VoiceModeNotice.js 中已经封装好的能力接到本文件流程里。
import { VoiceModeNotice } from './VoiceModeNotice.js';
// 引入 Opus1mMergeNotice，将 ./Opus1mMergeNotice.js 中已经封装好的能力接到本文件流程里。
import { Opus1mMergeNotice } from './Opus1mMergeNotice.js';
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';

// Conditional require so ChannelsNotice.tsx tree-shakes when both flags are
// false. A module-scope helper component inside a feature() ternary does NOT
// tree-shake (docs/feature-gating.md); the require pattern eliminates the
// whole file. VoiceModeNotice uses the unsafe helper pattern but VOICE_MODE
// is external: true so it's moot there.
/* eslint-disable @typescript-eslint/no-require-imports */
// ChannelsNoticeModule保存`feature`，供终端渲染后续处理使用。
const ChannelsNoticeModule = feature('KAIROS') || feature('KAIROS_CHANNELS') ? require('./ChannelsNotice.js') as typeof import('./ChannelsNotice.js') : null;
/* eslint-enable @typescript-eslint/no-require-imports */
// 复用 SandboxManager 工具函数，把通用处理留在 src/utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from 'src/utils/sandbox/sandbox-adapter.js';
// 引入 useShowGuestPassesUpsell、incrementGuestPassesSeenCount，将 ./GuestPassesUpsell.js 中已经封装好的能力接到本文件流程里。
import { useShowGuestPassesUpsell, incrementGuestPassesSeenCount } from './GuestPassesUpsell.js';
// 引入 useShowOverageCreditUpsell、incrementOverageCreditUpsellSeenCount、createOverageCreditFeed，将 ./OverageCreditUpsell.js 中已经封装好的能力接到本文件流程里。
import { useShowOverageCreditUpsell, incrementOverageCreditUpsellSeenCount, createOverageCreditFeed } from './OverageCreditUpsell.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 复用 getEffortSuffix 工具函数，把通用处理留在 ../../utils/effort.js 中维护。
import { getEffortSuffix } from '../../utils/effort.js';
// 引入 useMainLoopModel，将 ../../hooks/useMainLoopModel.js 中已经封装好的能力接到本文件流程里。
import { useMainLoopModel } from '../../hooks/useMainLoopModel.js';
// 复用 renderModelSetting 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { renderModelSetting } from '../../utils/model/model.js';
// LEFT_PANEL_MAX_WIDTH保存`50`，供后续判断或组装使用。
const LEFT_PANEL_MAX_WIDTH = 50;
// LogoV2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function LogoV2() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(94);
  // activities 集合读取`getRecentActivitySync`，供终端渲染后续处理使用。
  const activities = getRecentActivitySync();
  // username读取`getGlobalConfig`，供终端渲染后续处理使用。
  const username = getGlobalConfig().oauthAccount?.displayName ?? "";
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // t0 暂存 `shouldShowProjectOnboarding()` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `shouldShowProjectOnboarding()` 生成的渲染片段，后续返回路径直接复用。
    t0 = shouldShowProjectOnboarding();
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // showOnboarding 命名 `t0`，让后续代码直接表达这个值的用途。
  const showOnboarding = t0;
  // t1 暂存 `SandboxManager.isSandboxingEnabled()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `SandboxManager.isSandboxingEnabled()` 生成的渲染片段，后续返回路径直接复用。
    t1 = SandboxManager.isSandboxingEnabled();
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // showSandboxStatus 集合 命名 `t1`，让后续代码直接表达这个值的用途。
  const showSandboxStatus = t1;
  // showGuestPassesUpsell保存`useShowGuestPassesUpsell`，供终端渲染后续处理使用。
  const showGuestPassesUpsell = useShowGuestPassesUpsell();
  // showOverageCreditUpsell保存`useShowOverageCreditUpsell`，供终端渲染后续处理使用。
  const showOverageCreditUpsell = useShowOverageCreditUpsell();
  // agent保存`useAppState`，供终端渲染后续处理使用。
  const agent = useAppState(_temp);
  // effortValue保存`useAppState`，供终端渲染后续处理使用。
  const effortValue = useAppState(_temp2);
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // changelog 先占位，稍后的条件分支会根据实际输入补齐它。
  let changelog;
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // changelog更新为 `getRecentReleaseNotesSync(3)`，确保终端 UI后续读取最新状态。
    changelog = getRecentReleaseNotesSync(3);
  } catch {
    // changelog更新为 `[]`，确保终端 UI后续读取最新状态。
    changelog = [];
  }
  // 这个回调绑定到 const [announcement] = useState(() => {，负责终端渲染在该局部场景下的响应。
  const [announcement] = useState(() => {
    // announcements 集合读取`getInitialSettings`，供终端渲染后续处理使用。
    const announcements = getInitialSettings().companyAnnouncements;
    // !announcements || announcements 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
    if (!announcements || announcements.length === 0) {
      // 终端 UI 组件 Logo V2在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 返回 `config.numStartups === 1 ? announcements[0] : announcements[Math.floor(...`，作为终端渲染这次计算的结果。
    return config.numStartups === 1 ? announcements[0] : announcements[Math.floor(Math.random() * announcements.length)];
  });
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    hasReleaseNotes
  } = checkForReleaseNotesSync(config.lastReleaseNotesSeen);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // currentConfig 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
      const currentConfig = getGlobalConfig();
      // 满足 `currentConfig.lastReleaseNotesSeen === MACRO.VERS` 时，终端渲染执行该分支。
      if (currentConfig.lastReleaseNotesSeen === MACRO.VERSION) {
        // 终端 UI 组件 Logo V2在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(_temp3);
      // 满足 `showOnboarding` 时，终端渲染执行该分支。
      if (showOnboarding) {
        // 调用 incrementProjectOnboardingSeenCount，触发终端渲染此处需要的副作用。
        incrementProjectOnboardingSeenCount();
      }
    };
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `[config, showOnboarding]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== config) {
    // t3 暂存 `[config, showOnboarding]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [config, showOnboarding];
    // $[3] 缓存 `config`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = config;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `!hasReleaseNotes && !showOnboarding && !isEnvTruthy(proce...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `!hasReleaseNotes && !showOnboarding && !isEnvTruthy(proce...` 生成的渲染片段，后续返回路径直接复用。
    t4 = !hasReleaseNotes && !showOnboarding && !isEnvTruthy(process.env.CLAUDE_CODE_FORCE_FULL_LOGO);
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // isCondensedMode标记终端 UI Logo V2是否启用对应路径。
  const isCondensedMode = t4;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `[showGuestPassesUpsell, showOnboarding, isCondensedMode]` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== showGuestPassesUpsell) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // 只有 `showGuestPassesUpsell && !showOnboarding && !isCo` 满足时，终端渲染才执行该分支。
      if (showGuestPassesUpsell && !showOnboarding && !isCondensedMode) {
        // 调用 incrementGuestPassesSeenCount，触发终端渲染此处需要的副作用。
        incrementGuestPassesSeenCount();
      }
    };
    // t6 暂存 `[showGuestPassesUpsell, showOnboarding, isCondensedMode]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [showGuestPassesUpsell, showOnboarding, isCondensedMode];
    // $[6] 缓存 `showGuestPassesUpsell`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = showGuestPassesUpsell;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t5, t6);
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // t8 暂存 `[showOverageCreditUpsell, showOnboarding, showGuestPasses...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== showGuestPassesUpsell || $[10] !== showOverageCreditUpsell) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // 只有 `showOverageCreditUpsell && !showOnboarding && !sh` 满足时，终端渲染才执行该分支。
      if (showOverageCreditUpsell && !showOnboarding && !showGuestPassesUpsell && !isCondensedMode) {
        // 调用 incrementOverageCreditUpsellSeenCount，触发终端渲染此处需要的副作用。
        incrementOverageCreditUpsellSeenCount();
      }
    };
    // t8 暂存 `[showOverageCreditUpsell, showOnboarding, showGuestPasses...` 生成的渲染片段，后续返回路径直接复用。
    t8 = [showOverageCreditUpsell, showOnboarding, showGuestPassesUpsell, isCondensedMode];
    // $[9] 缓存 `showGuestPassesUpsell`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = showGuestPassesUpsell;
    // $[10] 缓存 `showOverageCreditUpsell`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = showOverageCreditUpsell;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
    // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t8;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
    // t8 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[12];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t7, t8);
  // 模型名称保存`useMainLoopModel`，供终端渲染后续处理使用。
  const model = useMainLoopModel();
  // fullModelDisplayName保存`renderModelSetting`，供终端渲染后续处理使用。
  const fullModelDisplayName = renderModelSetting(model);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    version,
    cwd,
    billingType,
    agentName: agentNameFromSettings
  } = getLogoDisplayData();
  // agentName保存`agent ?? agentNameFromSettings`，供后续判断或组装使用。
  const agentName = agent ?? agentNameFromSettings;
  // effortSuffix读取`getEffortSuffix`，供终端渲染后续处理使用。
  const effortSuffix = getEffortSuffix(model, effortValue);
  // 临时值 t9 命名 `fullModelDisplayName + effortSuffix`，让后续代码直接表达这个值的用途。
  const t9 = fullModelDisplayName + effortSuffix;
  // t10 暂存 `truncate(t9, LEFT_PANEL_MAX_WIDTH - 20)` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t9) {
    // t10 暂存 `truncate(t9, LEFT_PANEL_MAX_WIDTH - 20)` 生成的渲染片段，后续返回路径直接复用。
    t10 = truncate(t9, LEFT_PANEL_MAX_WIDTH - 20);
    // $[13] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t9;
    // $[14] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[14];
  }
  // modelDisplayName保存`t10`，作为后续临时缓存值处理的输入。
  const modelDisplayName = t10;
  // 只有 `!hasReleaseNotes && !showOnboarding && !isEnvTruthy(process.env.CLAUDE_CODE...` 满足时，终端渲染才执行该分支。
  if (!hasReleaseNotes && !showOnboarding && !isEnvTruthy(process.env.CLAUDE_CODE_FORCE_FULL_LOGO)) {
    // t11 暂存 `<CondensedLogo />` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // t12 暂存 `<VoiceModeNotice />` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // t13 暂存 `<Opus1mMergeNotice />` 的派生结果，便于缓存命中时直接复用。
    let t13;
    // t14 暂存 `ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNot...` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // t15 暂存 `isDebugMode() && <Box paddingLeft={2} flexDirection="colu...` 的派生结果，便于缓存命中时直接复用。
    let t15;
    // t16 暂存 `<EmergencyTip />` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // t17 暂存 `process.env.CLAUDE_CODE_TMUX_SESSION && <Box paddingLeft=...` 的派生结果，便于缓存命中时直接复用。
    let t17;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      // t11 暂存 `<CondensedLogo />` 生成的渲染片段，后续返回路径直接复用。
      t11 = <CondensedLogo />;
      // t12 暂存 `<VoiceModeNotice />` 生成的渲染片段，后续返回路径直接复用。
      t12 = <VoiceModeNotice />;
      // t13 暂存 `<Opus1mMergeNotice />` 生成的渲染片段，后续返回路径直接复用。
      t13 = <Opus1mMergeNotice />;
      // t14 暂存 `ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNot...` 生成的渲染片段，后续返回路径直接复用。
      t14 = ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNotice />;
      // t15 暂存 `isDebugMode() && <Box paddingLeft={2} flexDirection="colu...` 生成的渲染片段，后续返回路径直接复用。
      t15 = isDebugMode() && <Box paddingLeft={2} flexDirection="column"><Text color="warning">Debug mode enabled</Text><Text dimColor={true}>Logging to: {isDebugToStdErr() ? "stderr" : getDebugLogPath()}</Text></Box>;
      // t16 暂存 `<EmergencyTip />` 生成的渲染片段，后续返回路径直接复用。
      t16 = <EmergencyTip />;
      // t17 暂存 `process.env.CLAUDE_CODE_TMUX_SESSION && <Box paddingLeft=...` 生成的渲染片段，后续返回路径直接复用。
      t17 = process.env.CLAUDE_CODE_TMUX_SESSION && <Box paddingLeft={2} flexDirection="column"><Text dimColor={true}>tmux session: {process.env.CLAUDE_CODE_TMUX_SESSION}</Text><Text dimColor={true}>{process.env.CLAUDE_CODE_TMUX_PREFIX_CONFLICTS ? `Detach: ${process.env.CLAUDE_CODE_TMUX_PREFIX} ${process.env.CLAUDE_CODE_TMUX_PREFIX} d (press prefix twice - Claude uses ${process.env.CLAUDE_CODE_TMUX_PREFIX})` : `Detach: ${process.env.CLAUDE_CODE_TMUX_PREFIX} d`}</Text></Box>;
      // $[15] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t11;
      // $[16] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t12;
      // $[17] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t13;
      // $[18] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t14;
      // $[19] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t15;
      // $[20] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t16;
      // $[21] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t17;
    } else {
      // t11 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[15];
      // t12 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[16];
      // t13 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
      t13 = $[17];
      // t14 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[18];
      // t15 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t15 = $[19];
      // t16 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[20];
      // t17 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
      t17 = $[21];
    }
    // t18 暂存 `announcement && <Box paddingLeft={2} flexDirection="colum...` 的派生结果，便于缓存命中时直接复用。
    let t18;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[22] !== announcement || $[23] !== config) {
      // t18 暂存 `announcement && <Box paddingLeft={2} flexDirection="colum...` 生成的渲染片段，后续返回路径直接复用。
      t18 = announcement && <Box paddingLeft={2} flexDirection="column">{!process.env.IS_DEMO && config.oauthAccount?.organizationName && <Text dimColor={true}>Message from {config.oauthAccount.organizationName}:</Text>}<Text>{announcement}</Text></Box>;
      // $[22] 缓存 `announcement`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = announcement;
      // $[23] 缓存 `config`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = config;
      // $[24] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = t18;
    } else {
      // t18 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
      t18 = $[24];
    }
    // t19 暂存 `false && !process.env.DEMO_VERSION && <Box paddingLeft={2...` 的派生结果，便于缓存命中时直接复用。
    let t19;
    // t20 暂存 `false && !process.env.DEMO_VERSION && <Box paddingLeft={2...` 的派生结果，便于缓存命中时直接复用。
    let t20;
    // t21 暂存 `false && <GateOverridesWarning />` 的派生结果，便于缓存命中时直接复用。
    let t21;
    // t22 暂存 `false && <ExperimentEnrollmentNotice />` 的派生结果，便于缓存命中时直接复用。
    let t22;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
      // t19 暂存 `false && !process.env.DEMO_VERSION && <Box paddingLeft={2...` 生成的渲染片段，后续返回路径直接复用。
      t19 = false && !process.env.DEMO_VERSION && <Box paddingLeft={2} flexDirection="column"><Text dimColor={true}>Use /issue to report model behavior issues</Text></Box>;
      // t20 暂存 `false && !process.env.DEMO_VERSION && <Box paddingLeft={2...` 生成的渲染片段，后续返回路径直接复用。
      t20 = false && !process.env.DEMO_VERSION && <Box paddingLeft={2} flexDirection="column"><Text color="warning">[ANT-ONLY] Logs:</Text><Text dimColor={true}>API calls: {getDisplayPath(getDumpPromptsPath())}</Text><Text dimColor={true}>Debug logs: {getDisplayPath(getDebugLogPath())}</Text>{isDetailedProfilingEnabled() && <Text dimColor={true}>Startup Perf: {getDisplayPath(getStartupPerfLogPath())}</Text>}</Box>;
      // t21 暂存 `false && <GateOverridesWarning />` 生成的渲染片段，后续返回路径直接复用。
      t21 = false && <GateOverridesWarning />;
      // t22 暂存 `false && <ExperimentEnrollmentNotice />` 生成的渲染片段，后续返回路径直接复用。
      t22 = false && <ExperimentEnrollmentNotice />;
      // $[25] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = t19;
      // $[26] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
      $[26] = t20;
      // $[27] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
      $[27] = t21;
      // $[28] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = t22;
    } else {
      // t19 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
      t19 = $[25];
      // t20 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
      t20 = $[26];
      // t21 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
      t21 = $[27];
      // t22 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
      t22 = $[28];
    }
    // t23 暂存 `<>{t11}{t12}{t13}{t14}{t15}{t16}{t17}{t18}{t19}{t20}{t21}...` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[29] !== t18) {
      // t23 暂存 `<>{t11}{t12}{t13}{t14}{t15}{t16}{t17}{t18}{t19}{t20}{t21}...` 生成的渲染片段，后续返回路径直接复用。
      t23 = <>{t11}{t12}{t13}{t14}{t15}{t16}{t17}{t18}{t19}{t20}{t21}{t22}</>;
      // $[29] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
      $[29] = t18;
      // $[30] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[30] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[30];
    }
    // 返回 `t23`，作为终端渲染这次计算的结果。
    return t23;
  }
  // layoutMode读取`getLayoutMode`，供终端渲染后续处理使用。
  const layoutMode = getLayoutMode(columns);
  // userTheme读取`resolveThemeSetting`，供终端渲染后续处理使用。
  const userTheme = resolveThemeSetting(getGlobalConfig().theme);
  // borderTitle 标题保存`color`，供终端渲染后续处理使用。
  const borderTitle = ` ${color("claude", userTheme)("Claude Code")} ${color("inactive", userTheme)(`v${version}`)} `;
  // compactBorderTitle 标题保存`color`，供终端渲染后续处理使用。
  const compactBorderTitle = color("claude", userTheme)(" Claude Code ");
  // 当 `layoutMode` 匹配 `"compact"` 时，终端渲染执行对应分支。
  if (layoutMode === "compact") {
    // welcomeMessage 消息数据格式化`formatWelcomeMessage`，供终端渲染后续处理使用。
    let welcomeMessage = formatWelcomeMessage(username);
    // 满足 `stringWidth(welcomeMessage) > columns - 4` 时，终端渲染执行该分支。
    if (stringWidth(welcomeMessage) > columns - 4) {
      // t11 暂存 `formatWelcomeMessage(null)` 的派生结果，便于缓存命中时直接复用。
      let t11;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
        // t11 暂存 `formatWelcomeMessage(null)` 生成的渲染片段，后续返回路径直接复用。
        t11 = formatWelcomeMessage(null);
        // $[31] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
        $[31] = t11;
      } else {
        // t11 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
        t11 = $[31];
      }
      // welcomeMessage 消息数据更新为 `t11`，确保终端 UI后续读取最新状态。
      welcomeMessage = t11;
    }
    // cwdAvailableWidth保存`stringWidth`，供终端渲染后续处理使用。
    const cwdAvailableWidth = agentName ? columns - 4 - 1 - stringWidth(agentName) - 3 : columns - 4;
    // truncatedCwd保存`truncatePath`，供终端渲染后续处理使用。
    const truncatedCwd = truncatePath(cwd, Math.max(cwdAvailableWidth, 10));
    // t11 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[32] !== compactBorderTitle) {
      // t11 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t11 = {
        content: compactBorderTitle,
        position: "top",
        align: "start",
        offset: 1
      };
      // $[32] 缓存 `compactBorderTitle`，下次依赖未变时 React 编译产物可直接复用。
      $[32] = compactBorderTitle;
      // $[33] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[33] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[33];
    }
    // t12 暂存 `<Box marginY={1}><Clawd /></Box>` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
      // t12 暂存 `<Box marginY={1}><Clawd /></Box>` 生成的渲染片段，后续返回路径直接复用。
      t12 = <Box marginY={1}><Clawd /></Box>;
      // $[34] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[34] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[34];
    }
    // t13 暂存 `<Text dimColor={true}>{modelDisplayName}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t13;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[35] !== modelDisplayName) {
      // t13 暂存 `<Text dimColor={true}>{modelDisplayName}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t13 = <Text dimColor={true}>{modelDisplayName}</Text>;
      // $[35] 缓存 `modelDisplayName`，下次依赖未变时 React 编译产物可直接复用。
      $[35] = modelDisplayName;
      // $[36] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[36] = t13;
    } else {
      // t13 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
      t13 = $[36];
    }
    // t14 暂存 `<VoiceModeNotice />` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // t15 暂存 `<Opus1mMergeNotice />` 的派生结果，便于缓存命中时直接复用。
    let t15;
    // t16 暂存 `ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNot...` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[37] === Symbol.for("react.memo_cache_sentinel")) {
      // t14 暂存 `<VoiceModeNotice />` 生成的渲染片段，后续返回路径直接复用。
      t14 = <VoiceModeNotice />;
      // t15 暂存 `<Opus1mMergeNotice />` 生成的渲染片段，后续返回路径直接复用。
      t15 = <Opus1mMergeNotice />;
      // t16 暂存 `ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNot...` 生成的渲染片段，后续返回路径直接复用。
      t16 = ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNotice />;
      // $[37] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[37] = t14;
      // $[38] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
      $[38] = t15;
      // $[39] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[39] = t16;
    } else {
      // t14 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[37];
      // t15 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
      t15 = $[38];
      // t16 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[39];
    }
    // t17 暂存 `showSandboxStatus && <Box marginTop={1} flexDirection="co...` 的派生结果，便于缓存命中时直接复用。
    let t17;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[40] !== showSandboxStatus) {
      // t17 暂存 `showSandboxStatus && <Box marginTop={1} flexDirection="co...` 生成的渲染片段，后续返回路径直接复用。
      t17 = showSandboxStatus && <Box marginTop={1} flexDirection="column"><Text color="warning">Your bash commands will be sandboxed. Disable with /sandbox.</Text></Box>;
      // $[40] 缓存 `showSandboxStatus`，下次依赖未变时 React 编译产物可直接复用。
      $[40] = showSandboxStatus;
      // $[41] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
      $[41] = t17;
    } else {
      // t17 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
      t17 = $[41];
    }
    // t18 暂存 `false && <GateOverridesWarning />` 的派生结果，便于缓存命中时直接复用。
    let t18;
    // t19 暂存 `false && <ExperimentEnrollmentNotice />` 的派生结果，便于缓存命中时直接复用。
    let t19;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[42] === Symbol.for("react.memo_cache_sentinel")) {
      // t18 暂存 `false && <GateOverridesWarning />` 生成的渲染片段，后续返回路径直接复用。
      t18 = false && <GateOverridesWarning />;
      // t19 暂存 `false && <ExperimentEnrollmentNotice />` 生成的渲染片段，后续返回路径直接复用。
      t19 = false && <ExperimentEnrollmentNotice />;
      // $[42] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
      $[42] = t18;
      // $[43] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
      $[43] = t19;
    } else {
      // t18 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
      t18 = $[42];
      // t19 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
      t19 = $[43];
    }
    // 返回 `<><OffscreenFreeze><Box flexDirection="column" borderStyle="round" bord...`，作为终端渲染这次计算的结果。
    return <><OffscreenFreeze><Box flexDirection="column" borderStyle="round" borderColor="claude" borderText={t11} paddingX={1} paddingY={1} alignItems="center" width={columns}><Text bold={true}>{welcomeMessage}</Text>{t12}{t13}<Text dimColor={true}>{billingType}</Text><Text dimColor={true}>{agentName ? `@${agentName} · ${truncatedCwd}` : truncatedCwd}</Text></Box></OffscreenFreeze>{t14}{t15}{t16}{t17}{t18}{t19}</>;
  }
  // welcomeMessage_0 消息数据格式化`formatWelcomeMessage`，供终端渲染后续处理使用。
  const welcomeMessage_0 = formatWelcomeMessage(username);
  // modelLine 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const modelLine = !process.env.IS_DEMO && config.oauthAccount?.organizationName ? `${modelDisplayName} · ${billingType} · ${config.oauthAccount.organizationName}` : `${modelDisplayName} · ${billingType}`;
  // cwdAvailableWidth_0保存`stringWidth`，供终端渲染后续处理使用。
  const cwdAvailableWidth_0 = agentName ? LEFT_PANEL_MAX_WIDTH - 1 - stringWidth(agentName) - 3 : LEFT_PANEL_MAX_WIDTH;
  // truncatedCwd_0保存`truncatePath`，供终端渲染后续处理使用。
  const truncatedCwd_0 = truncatePath(cwd, Math.max(cwdAvailableWidth_0, 10));
  // cwdLine保存`agentName ? `@${agentName} · ${truncatedCwd_0}` : truncat...`，供后续判断或组装使用。
  const cwdLine = agentName ? `@${agentName} · ${truncatedCwd_0}` : truncatedCwd_0;
  // optimalLeftWidth保存`calculateOptimalLeftWidth`，供终端渲染后续处理使用。
  const optimalLeftWidth = calculateOptimalLeftWidth(welcomeMessage_0, cwdLine, modelLine);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    leftWidth,
    rightWidth
  } = calculateLayoutDimensions(columns, layoutMode, optimalLeftWidth);
  // 临时值 T0 命名 `OffscreenFreeze`，让后续代码直接表达这个值的用途。
  const T0 = OffscreenFreeze;
  // 临时值 T1 命名 `Box`，让后续代码直接表达这个值的用途。
  const T1 = Box;
  // t11固定为 `"column"`，作为终端 UI Logo V2后续展示或比较的基准。
  const t11 = "column";
  // t12保存`"round"`，作为后续固定文本处理的输入。
  const t12 = "round";
  // 临时值 t13 命名 `"claude"`，让后续代码直接表达这个值的用途。
  const t13 = "claude";
  // t14 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[44] !== borderTitle) {
    // t14 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t14 = {
      content: borderTitle,
      position: "top",
      align: "start",
      offset: 3
    };
    // $[44] 缓存 `borderTitle`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = borderTitle;
    // $[45] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[45] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[45];
  }
  // 临时值 T2保存`Box`，供终端 UI Logo V2后续判断或输出使用。
  const T2 = Box;
  // t15标记终端 UI Logo V2是否启用对应路径。
  const t15 = layoutMode === "horizontal" ? "row" : "column";
  // 临时值 t16 命名 `1`，让后续代码直接表达这个值的用途。
  const t16 = 1;
  // t17保存`1`，供终端 UI Logo V2后续判断或输出使用。
  const t17 = 1;
  // t18 暂存 `<Box marginTop={1}><Text bold={true}>{welcomeMessage_0}</...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[46] !== welcomeMessage_0) {
    // t18 暂存 `<Box marginTop={1}><Text bold={true}>{welcomeMessage_0}</...` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Box marginTop={1}><Text bold={true}>{welcomeMessage_0}</Text></Box>;
    // $[46] 缓存 `welcomeMessage_0`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = welcomeMessage_0;
    // $[47] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[47];
  }
  // t19 暂存 `<Clawd />` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[48] === Symbol.for("react.memo_cache_sentinel")) {
    // t19 暂存 `<Clawd />` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Clawd />;
    // $[48] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[48];
  }
  // t20 暂存 `<Text dimColor={true}>{modelLine}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[49] !== modelLine) {
    // t20 暂存 `<Text dimColor={true}>{modelLine}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t20 = <Text dimColor={true}>{modelLine}</Text>;
    // $[49] 缓存 `modelLine`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = modelLine;
    // $[50] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[50];
  }
  // t21 暂存 `<Text dimColor={true}>{cwdLine}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[51] !== cwdLine) {
    // t21 暂存 `<Text dimColor={true}>{cwdLine}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t21 = <Text dimColor={true}>{cwdLine}</Text>;
    // $[51] 缓存 `cwdLine`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = cwdLine;
    // $[52] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[52];
  }
  // t22 暂存 `<Box flexDirection="column" alignItems="center">{t20}{t21...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[53] !== t20 || $[54] !== t21) {
    // t22 暂存 `<Box flexDirection="column" alignItems="center">{t20}{t21...` 生成的渲染片段，后续返回路径直接复用。
    t22 = <Box flexDirection="column" alignItems="center">{t20}{t21}</Box>;
    // $[53] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t20;
    // $[54] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = t21;
    // $[55] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[55] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[55];
  }
  // t23 暂存 `<Box flexDirection="column" width={leftWidth} justifyCont...` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[56] !== leftWidth || $[57] !== t18 || $[58] !== t22) {
    // t23 暂存 `<Box flexDirection="column" width={leftWidth} justifyCont...` 生成的渲染片段，后续返回路径直接复用。
    t23 = <Box flexDirection="column" width={leftWidth} justifyContent="space-between" alignItems="center" minHeight={9}>{t18}{t19}{t22}</Box>;
    // $[56] 缓存 `leftWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = leftWidth;
    // $[57] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = t18;
    // $[58] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = t22;
    // $[59] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[59] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[59];
  }
  // t24 暂存 `layoutMode === "horizontal" && <Box height="100%" borderS...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[60] !== layoutMode) {
    // t24 暂存 `layoutMode === "horizontal" && <Box height="100%" borderS...` 生成的渲染片段，后续返回路径直接复用。
    t24 = layoutMode === "horizontal" && <Box height="100%" borderStyle="single" borderColor="claude" borderDimColor={true} borderTop={false} borderBottom={false} borderLeft={false} />;
    // $[60] 缓存 `layoutMode`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = layoutMode;
    // $[61] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[61] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[61];
  }
  // 临时值 t25构建`createProjectOnboardingFeed`，供终端渲染后续处理使用。
  const t25 = layoutMode === "horizontal" && <FeedColumn feeds={showOnboarding ? [createProjectOnboardingFeed(getSteps()), createRecentActivityFeed(activities)] : showGuestPassesUpsell ? [createRecentActivityFeed(activities), createGuestPassesFeed()] : showOverageCreditUpsell ? [createRecentActivityFeed(activities), createOverageCreditFeed()] : [createRecentActivityFeed(activities), createWhatsNewFeed(changelog)]} maxWidth={rightWidth} />;
  // t26 暂存 `<T2 flexDirection={t15} paddingX={t16} gap={t17}>{t23}{t2...` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[62] !== T2 || $[63] !== t15 || $[64] !== t23 || $[65] !== t24 || $[66] !== t25) {
    // t26 暂存 `<T2 flexDirection={t15} paddingX={t16} gap={t17}>{t23}{t2...` 生成的渲染片段，后续返回路径直接复用。
    t26 = <T2 flexDirection={t15} paddingX={t16} gap={t17}>{t23}{t24}{t25}</T2>;
    // $[62] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = T2;
    // $[63] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = t15;
    // $[64] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = t23;
    // $[65] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = t24;
    // $[66] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = t25;
    // $[67] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[67] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[67];
  }
  // t27 暂存 `<T1 flexDirection={t11} borderStyle={t12} borderColor={t1...` 的派生结果，便于缓存命中时直接复用。
  let t27;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[68] !== T1 || $[69] !== t14 || $[70] !== t26) {
    // t27 暂存 `<T1 flexDirection={t11} borderStyle={t12} borderColor={t1...` 生成的渲染片段，后续返回路径直接复用。
    t27 = <T1 flexDirection={t11} borderStyle={t12} borderColor={t13} borderText={t14}>{t26}</T1>;
    // $[68] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = T1;
    // $[69] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = t14;
    // $[70] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = t26;
    // $[71] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = t27;
  } else {
    // t27 从 React 编译缓存槽 $[71] 取回渲染片段，避免依赖未变时重建 JSX。
    t27 = $[71];
  }
  // t28 暂存 `<T0>{t27}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t28;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[72] !== T0 || $[73] !== t27) {
    // t28 暂存 `<T0>{t27}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t28 = <T0>{t27}</T0>;
    // $[72] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = T0;
    // $[73] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = t27;
    // $[74] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = t28;
  } else {
    // t28 从 React 编译缓存槽 $[74] 取回渲染片段，避免依赖未变时重建 JSX。
    t28 = $[74];
  }
  // t29 暂存 `<VoiceModeNotice />` 的派生结果，便于缓存命中时直接复用。
  let t29;
  // t30 暂存 `<Opus1mMergeNotice />` 的派生结果，便于缓存命中时直接复用。
  let t30;
  // t31 暂存 `ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNot...` 的派生结果，便于缓存命中时直接复用。
  let t31;
  // t32 暂存 `isDebugMode() && <Box paddingLeft={2} flexDirection="colu...` 的派生结果，便于缓存命中时直接复用。
  let t32;
  // t33 暂存 `<EmergencyTip />` 的派生结果，便于缓存命中时直接复用。
  let t33;
  // t34 暂存 `process.env.CLAUDE_CODE_TMUX_SESSION && <Box paddingLeft=...` 的派生结果，便于缓存命中时直接复用。
  let t34;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[75] === Symbol.for("react.memo_cache_sentinel")) {
    // t29 暂存 `<VoiceModeNotice />` 生成的渲染片段，后续返回路径直接复用。
    t29 = <VoiceModeNotice />;
    // t30 暂存 `<Opus1mMergeNotice />` 生成的渲染片段，后续返回路径直接复用。
    t30 = <Opus1mMergeNotice />;
    // t31 暂存 `ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNot...` 生成的渲染片段，后续返回路径直接复用。
    t31 = ChannelsNoticeModule && <ChannelsNoticeModule.ChannelsNotice />;
    // t32 暂存 `isDebugMode() && <Box paddingLeft={2} flexDirection="colu...` 生成的渲染片段，后续返回路径直接复用。
    t32 = isDebugMode() && <Box paddingLeft={2} flexDirection="column"><Text color="warning">Debug mode enabled</Text><Text dimColor={true}>Logging to: {isDebugToStdErr() ? "stderr" : getDebugLogPath()}</Text></Box>;
    // t33 暂存 `<EmergencyTip />` 生成的渲染片段，后续返回路径直接复用。
    t33 = <EmergencyTip />;
    // t34 暂存 `process.env.CLAUDE_CODE_TMUX_SESSION && <Box paddingLeft=...` 生成的渲染片段，后续返回路径直接复用。
    t34 = process.env.CLAUDE_CODE_TMUX_SESSION && <Box paddingLeft={2} flexDirection="column"><Text dimColor={true}>tmux session: {process.env.CLAUDE_CODE_TMUX_SESSION}</Text><Text dimColor={true}>{process.env.CLAUDE_CODE_TMUX_PREFIX_CONFLICTS ? `Detach: ${process.env.CLAUDE_CODE_TMUX_PREFIX} ${process.env.CLAUDE_CODE_TMUX_PREFIX} d (press prefix twice - Claude uses ${process.env.CLAUDE_CODE_TMUX_PREFIX})` : `Detach: ${process.env.CLAUDE_CODE_TMUX_PREFIX} d`}</Text></Box>;
    // $[75] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = t29;
    // $[76] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = t30;
    // $[77] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = t31;
    // $[78] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
    $[78] = t32;
    // $[79] 缓存 `t33`，下次依赖未变时 React 编译产物可直接复用。
    $[79] = t33;
    // $[80] 缓存 `t34`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = t34;
  } else {
    // t29 从 React 编译缓存槽 $[75] 取回渲染片段，避免依赖未变时重建 JSX。
    t29 = $[75];
    // t30 从 React 编译缓存槽 $[76] 取回渲染片段，避免依赖未变时重建 JSX。
    t30 = $[76];
    // t31 从 React 编译缓存槽 $[77] 取回渲染片段，避免依赖未变时重建 JSX。
    t31 = $[77];
    // t32 从 React 编译缓存槽 $[78] 取回渲染片段，避免依赖未变时重建 JSX。
    t32 = $[78];
    // t33 从 React 编译缓存槽 $[79] 取回渲染片段，避免依赖未变时重建 JSX。
    t33 = $[79];
    // t34 从 React 编译缓存槽 $[80] 取回渲染片段，避免依赖未变时重建 JSX。
    t34 = $[80];
  }
  // t35 暂存 `announcement && <Box paddingLeft={2} flexDirection="colum...` 的派生结果，便于缓存命中时直接复用。
  let t35;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[81] !== announcement || $[82] !== config) {
    // t35 暂存 `announcement && <Box paddingLeft={2} flexDirection="colum...` 生成的渲染片段，后续返回路径直接复用。
    t35 = announcement && <Box paddingLeft={2} flexDirection="column">{!process.env.IS_DEMO && config.oauthAccount?.organizationName && <Text dimColor={true}>Message from {config.oauthAccount.organizationName}:</Text>}<Text>{announcement}</Text></Box>;
    // $[81] 缓存 `announcement`，下次依赖未变时 React 编译产物可直接复用。
    $[81] = announcement;
    // $[82] 缓存 `config`，下次依赖未变时 React 编译产物可直接复用。
    $[82] = config;
    // $[83] 缓存 `t35`，下次依赖未变时 React 编译产物可直接复用。
    $[83] = t35;
  } else {
    // t35 从 React 编译缓存槽 $[83] 取回渲染片段，避免依赖未变时重建 JSX。
    t35 = $[83];
  }
  // t36 暂存 `showSandboxStatus && <Box paddingLeft={2} flexDirection="...` 的派生结果，便于缓存命中时直接复用。
  let t36;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[84] !== showSandboxStatus) {
    // t36 暂存 `showSandboxStatus && <Box paddingLeft={2} flexDirection="...` 生成的渲染片段，后续返回路径直接复用。
    t36 = showSandboxStatus && <Box paddingLeft={2} flexDirection="column"><Text color="warning">Your bash commands will be sandboxed. Disable with /sandbox.</Text></Box>;
    // $[84] 缓存 `showSandboxStatus`，下次依赖未变时 React 编译产物可直接复用。
    $[84] = showSandboxStatus;
    // $[85] 缓存 `t36`，下次依赖未变时 React 编译产物可直接复用。
    $[85] = t36;
  } else {
    // t36 从 React 编译缓存槽 $[85] 取回渲染片段，避免依赖未变时重建 JSX。
    t36 = $[85];
  }
  // t37 暂存 `false && !process.env.DEMO_VERSION && <Box paddingLeft={2...` 的派生结果，便于缓存命中时直接复用。
  let t37;
  // t38 暂存 `false && !process.env.DEMO_VERSION && <Box paddingLeft={2...` 的派生结果，便于缓存命中时直接复用。
  let t38;
  // t39 暂存 `false && <GateOverridesWarning />` 的派生结果，便于缓存命中时直接复用。
  let t39;
  // t40 暂存 `false && <ExperimentEnrollmentNotice />` 的派生结果，便于缓存命中时直接复用。
  let t40;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[86] === Symbol.for("react.memo_cache_sentinel")) {
    // t37 暂存 `false && !process.env.DEMO_VERSION && <Box paddingLeft={2...` 生成的渲染片段，后续返回路径直接复用。
    t37 = false && !process.env.DEMO_VERSION && <Box paddingLeft={2} flexDirection="column"><Text dimColor={true}>Use /issue to report model behavior issues</Text></Box>;
    // t38 暂存 `false && !process.env.DEMO_VERSION && <Box paddingLeft={2...` 生成的渲染片段，后续返回路径直接复用。
    t38 = false && !process.env.DEMO_VERSION && <Box paddingLeft={2} flexDirection="column"><Text color="warning">[ANT-ONLY] Logs:</Text><Text dimColor={true}>API calls: {getDisplayPath(getDumpPromptsPath())}</Text><Text dimColor={true}>Debug logs: {getDisplayPath(getDebugLogPath())}</Text>{isDetailedProfilingEnabled() && <Text dimColor={true}>Startup Perf: {getDisplayPath(getStartupPerfLogPath())}</Text>}</Box>;
    // t39 暂存 `false && <GateOverridesWarning />` 生成的渲染片段，后续返回路径直接复用。
    t39 = false && <GateOverridesWarning />;
    // t40 暂存 `false && <ExperimentEnrollmentNotice />` 生成的渲染片段，后续返回路径直接复用。
    t40 = false && <ExperimentEnrollmentNotice />;
    // $[86] 缓存 `t37`，下次依赖未变时 React 编译产物可直接复用。
    $[86] = t37;
    // $[87] 缓存 `t38`，下次依赖未变时 React 编译产物可直接复用。
    $[87] = t38;
    // $[88] 缓存 `t39`，下次依赖未变时 React 编译产物可直接复用。
    $[88] = t39;
    // $[89] 缓存 `t40`，下次依赖未变时 React 编译产物可直接复用。
    $[89] = t40;
  } else {
    // t37 从 React 编译缓存槽 $[86] 取回渲染片段，避免依赖未变时重建 JSX。
    t37 = $[86];
    // t38 从 React 编译缓存槽 $[87] 取回渲染片段，避免依赖未变时重建 JSX。
    t38 = $[87];
    // t39 从 React 编译缓存槽 $[88] 取回渲染片段，避免依赖未变时重建 JSX。
    t39 = $[88];
    // t40 从 React 编译缓存槽 $[89] 取回渲染片段，避免依赖未变时重建 JSX。
    t40 = $[89];
  }
  // t41 暂存 `<>{t28}{t29}{t30}{t31}{t32}{t33}{t34}{t35}{t36}{t37}{t38}...` 的派生结果，便于缓存命中时直接复用。
  let t41;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[90] !== t28 || $[91] !== t35 || $[92] !== t36) {
    // t41 暂存 `<>{t28}{t29}{t30}{t31}{t32}{t33}{t34}{t35}{t36}{t37}{t38}...` 生成的渲染片段，后续返回路径直接复用。
    t41 = <>{t28}{t29}{t30}{t31}{t32}{t33}{t34}{t35}{t36}{t37}{t38}{t39}{t40}</>;
    // $[90] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
    $[90] = t28;
    // $[91] 缓存 `t35`，下次依赖未变时 React 编译产物可直接复用。
    $[91] = t35;
    // $[92] 缓存 `t36`，下次依赖未变时 React 编译产物可直接复用。
    $[92] = t36;
    // $[93] 缓存 `t41`，下次依赖未变时 React 编译产物可直接复用。
    $[93] = t41;
  } else {
    // t41 从 React 编译缓存槽 $[93] 取回渲染片段，避免依赖未变时重建 JSX。
    t41 = $[93];
  }
  // 返回 `t41`，作为终端渲染这次计算的结果。
  return t41;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(current) {
  // 满足 `current.lastReleaseNotesSeen === MACRO.VERSION` 时，终端渲染执行该分支。
  if (current.lastReleaseNotesSeen === MACRO.VERSION) {
    // 返回 `current`，作为终端渲染这次计算的结果。
    return current;
  }
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...current,
    lastReleaseNotesSeen: MACRO.VERSION
  };
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回 `s_0.effortValue`，作为终端渲染这次计算的结果。
  return s_0.effortValue;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.agent`，作为终端渲染这次计算的结果。
  return s.agent;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJjb2xvciIsInVzZVRlcm1pbmFsU2l6ZSIsInN0cmluZ1dpZHRoIiwiZ2V0TGF5b3V0TW9kZSIsImNhbGN1bGF0ZUxheW91dERpbWVuc2lvbnMiLCJjYWxjdWxhdGVPcHRpbWFsTGVmdFdpZHRoIiwiZm9ybWF0V2VsY29tZU1lc3NhZ2UiLCJ0cnVuY2F0ZVBhdGgiLCJnZXRSZWNlbnRBY3Rpdml0eVN5bmMiLCJnZXRSZWNlbnRSZWxlYXNlTm90ZXNTeW5jIiwiZ2V0TG9nb0Rpc3BsYXlEYXRhIiwidHJ1bmNhdGUiLCJnZXREaXNwbGF5UGF0aCIsIkNsYXdkIiwiRmVlZENvbHVtbiIsImNyZWF0ZVJlY2VudEFjdGl2aXR5RmVlZCIsImNyZWF0ZVdoYXRzTmV3RmVlZCIsImNyZWF0ZVByb2plY3RPbmJvYXJkaW5nRmVlZCIsImNyZWF0ZUd1ZXN0UGFzc2VzRmVlZCIsImdldEdsb2JhbENvbmZpZyIsInNhdmVHbG9iYWxDb25maWciLCJyZXNvbHZlVGhlbWVTZXR0aW5nIiwiZ2V0SW5pdGlhbFNldHRpbmdzIiwiaXNEZWJ1Z01vZGUiLCJpc0RlYnVnVG9TdGRFcnIiLCJnZXREZWJ1Z0xvZ1BhdGgiLCJ1c2VFZmZlY3QiLCJ1c2VTdGF0ZSIsImdldFN0ZXBzIiwic2hvdWxkU2hvd1Byb2plY3RPbmJvYXJkaW5nIiwiaW5jcmVtZW50UHJvamVjdE9uYm9hcmRpbmdTZWVuQ291bnQiLCJDb25kZW5zZWRMb2dvIiwiT2Zmc2NyZWVuRnJlZXplIiwiY2hlY2tGb3JSZWxlYXNlTm90ZXNTeW5jIiwiZ2V0RHVtcFByb21wdHNQYXRoIiwiaXNFbnZUcnV0aHkiLCJnZXRTdGFydHVwUGVyZkxvZ1BhdGgiLCJpc0RldGFpbGVkUHJvZmlsaW5nRW5hYmxlZCIsIkVtZXJnZW5jeVRpcCIsIlZvaWNlTW9kZU5vdGljZSIsIk9wdXMxbU1lcmdlTm90aWNlIiwiZmVhdHVyZSIsIkNoYW5uZWxzTm90aWNlTW9kdWxlIiwicmVxdWlyZSIsIlNhbmRib3hNYW5hZ2VyIiwidXNlU2hvd0d1ZXN0UGFzc2VzVXBzZWxsIiwiaW5jcmVtZW50R3Vlc3RQYXNzZXNTZWVuQ291bnQiLCJ1c2VTaG93T3ZlcmFnZUNyZWRpdFVwc2VsbCIsImluY3JlbWVudE92ZXJhZ2VDcmVkaXRVcHNlbGxTZWVuQ291bnQiLCJjcmVhdGVPdmVyYWdlQ3JlZGl0RmVlZCIsInBsdXJhbCIsInVzZUFwcFN0YXRlIiwiZ2V0RWZmb3J0U3VmZml4IiwidXNlTWFpbkxvb3BNb2RlbCIsInJlbmRlck1vZGVsU2V0dGluZyIsIkxFRlRfUEFORUxfTUFYX1dJRFRIIiwiTG9nb1YyIiwiJCIsIl9jIiwiYWN0aXZpdGllcyIsInVzZXJuYW1lIiwib2F1dGhBY2NvdW50IiwiZGlzcGxheU5hbWUiLCJjb2x1bW5zIiwidDAiLCJTeW1ib2wiLCJmb3IiLCJzaG93T25ib2FyZGluZyIsInQxIiwiaXNTYW5kYm94aW5nRW5hYmxlZCIsInNob3dTYW5kYm94U3RhdHVzIiwic2hvd0d1ZXN0UGFzc2VzVXBzZWxsIiwic2hvd092ZXJhZ2VDcmVkaXRVcHNlbGwiLCJhZ2VudCIsIl90ZW1wIiwiZWZmb3J0VmFsdWUiLCJfdGVtcDIiLCJjb25maWciLCJjaGFuZ2Vsb2ciLCJhbm5vdW5jZW1lbnQiLCJhbm5vdW5jZW1lbnRzIiwiY29tcGFueUFubm91bmNlbWVudHMiLCJsZW5ndGgiLCJudW1TdGFydHVwcyIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImhhc1JlbGVhc2VOb3RlcyIsImxhc3RSZWxlYXNlTm90ZXNTZWVuIiwidDIiLCJjdXJyZW50Q29uZmlnIiwiTUFDUk8iLCJWRVJTSU9OIiwiX3RlbXAzIiwidDMiLCJ0NCIsInByb2Nlc3MiLCJlbnYiLCJDTEFVREVfQ09ERV9GT1JDRV9GVUxMX0xPR08iLCJpc0NvbmRlbnNlZE1vZGUiLCJ0NSIsInQ2IiwidDciLCJ0OCIsIm1vZGVsIiwiZnVsbE1vZGVsRGlzcGxheU5hbWUiLCJ2ZXJzaW9uIiwiY3dkIiwiYmlsbGluZ1R5cGUiLCJhZ2VudE5hbWUiLCJhZ2VudE5hbWVGcm9tU2V0dGluZ3MiLCJlZmZvcnRTdWZmaXgiLCJ0OSIsInQxMCIsIm1vZGVsRGlzcGxheU5hbWUiLCJ0MTEiLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJ0MTYiLCJ0MTciLCJDTEFVREVfQ09ERV9UTVVYX1NFU1NJT04iLCJDTEFVREVfQ09ERV9UTVVYX1BSRUZJWF9DT05GTElDVFMiLCJDTEFVREVfQ09ERV9UTVVYX1BSRUZJWCIsInQxOCIsIklTX0RFTU8iLCJvcmdhbml6YXRpb25OYW1lIiwidDE5IiwidDIwIiwidDIxIiwidDIyIiwiREVNT19WRVJTSU9OIiwidDIzIiwibGF5b3V0TW9kZSIsInVzZXJUaGVtZSIsInRoZW1lIiwiYm9yZGVyVGl0bGUiLCJjb21wYWN0Qm9yZGVyVGl0bGUiLCJ3ZWxjb21lTWVzc2FnZSIsImN3ZEF2YWlsYWJsZVdpZHRoIiwidHJ1bmNhdGVkQ3dkIiwibWF4IiwiY29udGVudCIsInBvc2l0aW9uIiwiYWxpZ24iLCJvZmZzZXQiLCJ3ZWxjb21lTWVzc2FnZV8wIiwibW9kZWxMaW5lIiwiY3dkQXZhaWxhYmxlV2lkdGhfMCIsInRydW5jYXRlZEN3ZF8wIiwiY3dkTGluZSIsIm9wdGltYWxMZWZ0V2lkdGgiLCJsZWZ0V2lkdGgiLCJyaWdodFdpZHRoIiwiVDAiLCJUMSIsIlQyIiwidDI0IiwidDI1IiwidDI2IiwidDI3IiwidDI4IiwidDI5IiwidDMwIiwidDMxIiwidDMyIiwidDMzIiwidDM0IiwidDM1IiwidDM2IiwidDM3IiwidDM4IiwidDM5IiwidDQwIiwidDQxIiwiY3VycmVudCIsInNfMCIsInMiXSwic291cmNlcyI6WyJMb2dvVjIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIGJpb21lLWlnbm9yZS1hbGwgYXNzaXN0L3NvdXJjZS9vcmdhbml6ZUltcG9ydHM6IEFOVC1PTkxZIGltcG9ydCBtYXJrZXJzIG11c3Qgbm90IGJlIHJlb3JkZXJlZFxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQsIGNvbG9yIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi8uLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQge1xuICBnZXRMYXlvdXRNb2RlLFxuICBjYWxjdWxhdGVMYXlvdXREaW1lbnNpb25zLFxuICBjYWxjdWxhdGVPcHRpbWFsTGVmdFdpZHRoLFxuICBmb3JtYXRXZWxjb21lTWVzc2FnZSxcbiAgdHJ1bmNhdGVQYXRoLFxuICBnZXRSZWNlbnRBY3Rpdml0eVN5bmMsXG4gIGdldFJlY2VudFJlbGVhc2VOb3Rlc1N5bmMsXG4gIGdldExvZ29EaXNwbGF5RGF0YSxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvbG9nb1YyVXRpbHMuanMnXG5pbXBvcnQgeyB0cnVuY2F0ZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB7IGdldERpc3BsYXlQYXRoIH0gZnJvbSAnLi4vLi4vdXRpbHMvZmlsZS5qcydcbmltcG9ydCB7IENsYXdkIH0gZnJvbSAnLi9DbGF3ZC5qcydcbmltcG9ydCB7IEZlZWRDb2x1bW4gfSBmcm9tICcuL0ZlZWRDb2x1bW4uanMnXG5pbXBvcnQge1xuICBjcmVhdGVSZWNlbnRBY3Rpdml0eUZlZWQsXG4gIGNyZWF0ZVdoYXRzTmV3RmVlZCxcbiAgY3JlYXRlUHJvamVjdE9uYm9hcmRpbmdGZWVkLFxuICBjcmVhdGVHdWVzdFBhc3Nlc0ZlZWQsXG59IGZyb20gJy4vZmVlZENvbmZpZ3MuanMnXG5pbXBvcnQgeyBnZXRHbG9iYWxDb25maWcsIHNhdmVHbG9iYWxDb25maWcgfSBmcm9tICdzcmMvdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHsgcmVzb2x2ZVRoZW1lU2V0dGluZyB9IGZyb20gJ3NyYy91dGlscy9zeXN0ZW1UaGVtZS5qcydcbmltcG9ydCB7IGdldEluaXRpYWxTZXR0aW5ncyB9IGZyb20gJ3NyYy91dGlscy9zZXR0aW5ncy9zZXR0aW5ncy5qcydcbmltcG9ydCB7XG4gIGlzRGVidWdNb2RlLFxuICBpc0RlYnVnVG9TdGRFcnIsXG4gIGdldERlYnVnTG9nUGF0aCxcbn0gZnJvbSAnc3JjL3V0aWxzL2RlYnVnLmpzJ1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtcbiAgZ2V0U3RlcHMsXG4gIHNob3VsZFNob3dQcm9qZWN0T25ib2FyZGluZyxcbiAgaW5jcmVtZW50UHJvamVjdE9uYm9hcmRpbmdTZWVuQ291bnQsXG59IGZyb20gJy4uLy4uL3Byb2plY3RPbmJvYXJkaW5nU3RhdGUuanMnXG5pbXBvcnQgeyBDb25kZW5zZWRMb2dvIH0gZnJvbSAnLi9Db25kZW5zZWRMb2dvLmpzJ1xuaW1wb3J0IHsgT2Zmc2NyZWVuRnJlZXplIH0gZnJvbSAnLi4vT2Zmc2NyZWVuRnJlZXplLmpzJ1xuaW1wb3J0IHsgY2hlY2tGb3JSZWxlYXNlTm90ZXNTeW5jIH0gZnJvbSAnLi4vLi4vdXRpbHMvcmVsZWFzZU5vdGVzLmpzJ1xuaW1wb3J0IHsgZ2V0RHVtcFByb21wdHNQYXRoIH0gZnJvbSAnc3JjL3NlcnZpY2VzL2FwaS9kdW1wUHJvbXB0cy5qcydcbmltcG9ydCB7IGlzRW52VHJ1dGh5IH0gZnJvbSAnc3JjL3V0aWxzL2VudlV0aWxzLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0U3RhcnR1cFBlcmZMb2dQYXRoLFxuICBpc0RldGFpbGVkUHJvZmlsaW5nRW5hYmxlZCxcbn0gZnJvbSAnc3JjL3V0aWxzL3N0YXJ0dXBQcm9maWxlci5qcydcbmltcG9ydCB7IEVtZXJnZW5jeVRpcCB9IGZyb20gJy4vRW1lcmdlbmN5VGlwLmpzJ1xuaW1wb3J0IHsgVm9pY2VNb2RlTm90aWNlIH0gZnJvbSAnLi9Wb2ljZU1vZGVOb3RpY2UuanMnXG5pbXBvcnQgeyBPcHVzMW1NZXJnZU5vdGljZSB9IGZyb20gJy4vT3B1czFtTWVyZ2VOb3RpY2UuanMnXG5pbXBvcnQgeyBmZWF0dXJlIH0gZnJvbSAnYnVuOmJ1bmRsZSdcblxuLy8gQ29uZGl0aW9uYWwgcmVxdWlyZSBzbyBDaGFubmVsc05vdGljZS50c3ggdHJlZS1zaGFrZXMgd2hlbiBib3RoIGZsYWdzIGFyZVxuLy8gZmFsc2UuIEEgbW9kdWxlLXNjb3BlIGhlbHBlciBjb21wb25lbnQgaW5zaWRlIGEgZmVhdHVyZSgpIHRlcm5hcnkgZG9lcyBOT1Rcbi8vIHRyZWUtc2hha2UgKGRvY3MvZmVhdHVyZS1nYXRpbmcubWQpOyB0aGUgcmVxdWlyZSBwYXR0ZXJuIGVsaW1pbmF0ZXMgdGhlXG4vLyB3aG9sZSBmaWxlLiBWb2ljZU1vZGVOb3RpY2UgdXNlcyB0aGUgdW5zYWZlIGhlbHBlciBwYXR0ZXJuIGJ1dCBWT0lDRV9NT0RFXG4vLyBpcyBleHRlcm5hbDogdHJ1ZSBzbyBpdCdzIG1vb3QgdGhlcmUuXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tcmVxdWlyZS1pbXBvcnRzICovXG5jb25zdCBDaGFubmVsc05vdGljZU1vZHVsZSA9XG4gIGZlYXR1cmUoJ0tBSVJPUycpIHx8IGZlYXR1cmUoJ0tBSVJPU19DSEFOTkVMUycpXG4gICAgPyAocmVxdWlyZSgnLi9DaGFubmVsc05vdGljZS5qcycpIGFzIHR5cGVvZiBpbXBvcnQoJy4vQ2hhbm5lbHNOb3RpY2UuanMnKSlcbiAgICA6IG51bGxcbi8qIGVzbGludC1lbmFibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0cyAqL1xuaW1wb3J0IHsgU2FuZGJveE1hbmFnZXIgfSBmcm9tICdzcmMvdXRpbHMvc2FuZGJveC9zYW5kYm94LWFkYXB0ZXIuanMnXG5pbXBvcnQge1xuICB1c2VTaG93R3Vlc3RQYXNzZXNVcHNlbGwsXG4gIGluY3JlbWVudEd1ZXN0UGFzc2VzU2VlbkNvdW50LFxufSBmcm9tICcuL0d1ZXN0UGFzc2VzVXBzZWxsLmpzJ1xuaW1wb3J0IHtcbiAgdXNlU2hvd092ZXJhZ2VDcmVkaXRVcHNlbGwsXG4gIGluY3JlbWVudE92ZXJhZ2VDcmVkaXRVcHNlbGxTZWVuQ291bnQsXG4gIGNyZWF0ZU92ZXJhZ2VDcmVkaXRGZWVkLFxufSBmcm9tICcuL092ZXJhZ2VDcmVkaXRVcHNlbGwuanMnXG5pbXBvcnQgeyBwbHVyYWwgfSBmcm9tICcuLi8uLi91dGlscy9zdHJpbmdVdGlscy5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgeyBnZXRFZmZvcnRTdWZmaXggfSBmcm9tICcuLi8uLi91dGlscy9lZmZvcnQuanMnXG5pbXBvcnQgeyB1c2VNYWluTG9vcE1vZGVsIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlTWFpbkxvb3BNb2RlbC5qcydcbmltcG9ydCB7IHJlbmRlck1vZGVsU2V0dGluZyB9IGZyb20gJy4uLy4uL3V0aWxzL21vZGVsL21vZGVsLmpzJ1xuXG5jb25zdCBMRUZUX1BBTkVMX01BWF9XSURUSCA9IDUwXG5cbmV4cG9ydCBmdW5jdGlvbiBMb2dvVjIoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgYWN0aXZpdGllcyA9IGdldFJlY2VudEFjdGl2aXR5U3luYygpXG4gIGNvbnN0IHVzZXJuYW1lID0gZ2V0R2xvYmFsQ29uZmlnKCkub2F1dGhBY2NvdW50Py5kaXNwbGF5TmFtZSA/PyAnJ1xuXG4gIGNvbnN0IHsgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgY29uc3Qgc2hvd09uYm9hcmRpbmcgPSBzaG91bGRTaG93UHJvamVjdE9uYm9hcmRpbmcoKVxuICBjb25zdCBzaG93U2FuZGJveFN0YXR1cyA9IFNhbmRib3hNYW5hZ2VyLmlzU2FuZGJveGluZ0VuYWJsZWQoKVxuICBjb25zdCBzaG93R3Vlc3RQYXNzZXNVcHNlbGwgPSB1c2VTaG93R3Vlc3RQYXNzZXNVcHNlbGwoKVxuICBjb25zdCBzaG93T3ZlcmFnZUNyZWRpdFVwc2VsbCA9IHVzZVNob3dPdmVyYWdlQ3JlZGl0VXBzZWxsKClcbiAgY29uc3QgYWdlbnQgPSB1c2VBcHBTdGF0ZShzID0+IHMuYWdlbnQpXG4gIGNvbnN0IGVmZm9ydFZhbHVlID0gdXNlQXBwU3RhdGUocyA9PiBzLmVmZm9ydFZhbHVlKVxuXG4gIGNvbnN0IGNvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG5cbiAgbGV0IGNoYW5nZWxvZzogc3RyaW5nW11cbiAgdHJ5IHtcbiAgICBjaGFuZ2Vsb2cgPSBnZXRSZWNlbnRSZWxlYXNlTm90ZXNTeW5jKDMpXG4gIH0gY2F0Y2gge1xuICAgIGNoYW5nZWxvZyA9IFtdXG4gIH1cblxuICAvLyBHZXQgY29tcGFueSBhbm5vdW5jZW1lbnRzIGFuZCBzZWxlY3Qgb25lOlxuICAvLyAtIEZpcnN0IHN0YXJ0dXAgKG51bVN0YXJ0dXBzID09PSAxKTogc2hvdyBmaXJzdCBhbm5vdW5jZW1lbnRcbiAgLy8gLSBBbGwgb3RoZXIgc3RhcnR1cHM6IHJhbmRvbWx5IHNlbGVjdCBmcm9tIGFubm91bmNlbWVudHNcbiAgY29uc3QgW2Fubm91bmNlbWVudF0gPSB1c2VTdGF0ZSgoKSA9PiB7XG4gICAgY29uc3QgYW5ub3VuY2VtZW50cyA9IGdldEluaXRpYWxTZXR0aW5ncygpLmNvbXBhbnlBbm5vdW5jZW1lbnRzXG4gICAgaWYgKCFhbm5vdW5jZW1lbnRzIHx8IGFubm91bmNlbWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIGNvbmZpZy5udW1TdGFydHVwcyA9PT0gMVxuICAgICAgPyBhbm5vdW5jZW1lbnRzWzBdXG4gICAgICA6IGFubm91bmNlbWVudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYW5ub3VuY2VtZW50cy5sZW5ndGgpXVxuICB9KVxuICBjb25zdCB7IGhhc1JlbGVhc2VOb3RlcyB9ID0gY2hlY2tGb3JSZWxlYXNlTm90ZXNTeW5jKFxuICAgIGNvbmZpZy5sYXN0UmVsZWFzZU5vdGVzU2VlbixcbiAgKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgY3VycmVudENvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG4gICAgaWYgKGN1cnJlbnRDb25maWcubGFzdFJlbGVhc2VOb3Rlc1NlZW4gPT09IE1BQ1JPLlZFUlNJT04pIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBzYXZlR2xvYmFsQ29uZmlnKGN1cnJlbnQgPT4ge1xuICAgICAgaWYgKGN1cnJlbnQubGFzdFJlbGVhc2VOb3Rlc1NlZW4gPT09IE1BQ1JPLlZFUlNJT04pIHJldHVybiBjdXJyZW50XG4gICAgICByZXR1cm4geyAuLi5jdXJyZW50LCBsYXN0UmVsZWFzZU5vdGVzU2VlbjogTUFDUk8uVkVSU0lPTiB9XG4gICAgfSlcbiAgICBpZiAoc2hvd09uYm9hcmRpbmcpIHtcbiAgICAgIGluY3JlbWVudFByb2plY3RPbmJvYXJkaW5nU2VlbkNvdW50KClcbiAgICB9XG4gIH0sIFtjb25maWcsIHNob3dPbmJvYXJkaW5nXSlcblxuICAvLyBJbiBjb25kZW5zZWQgbW9kZSAoZWFybHktcmV0dXJuIGJlbG93IHJlbmRlcnMgPENvbmRlbnNlZExvZ28vPiksXG4gIC8vIENvbmRlbnNlZExvZ28ncyBvd24gdXNlRWZmZWN0IGhhbmRsZXMgdGhlIGltcHJlc3Npb24gY291bnQuIFNraXBwaW5nXG4gIC8vIGhlcmUgYXZvaWRzIGRvdWJsZS1jb3VudGluZyBzaW5jZSBob29rcyBmaXJlIGJlZm9yZSB0aGUgZWFybHkgcmV0dXJuLlxuICBjb25zdCBpc0NvbmRlbnNlZE1vZGUgPVxuICAgICFoYXNSZWxlYXNlTm90ZXMgJiZcbiAgICAhc2hvd09uYm9hcmRpbmcgJiZcbiAgICAhaXNFbnZUcnV0aHkocHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfRk9SQ0VfRlVMTF9MT0dPKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHNob3dHdWVzdFBhc3Nlc1Vwc2VsbCAmJiAhc2hvd09uYm9hcmRpbmcgJiYgIWlzQ29uZGVuc2VkTW9kZSkge1xuICAgICAgaW5jcmVtZW50R3Vlc3RQYXNzZXNTZWVuQ291bnQoKVxuICAgIH1cbiAgfSwgW3Nob3dHdWVzdFBhc3Nlc1Vwc2VsbCwgc2hvd09uYm9hcmRpbmcsIGlzQ29uZGVuc2VkTW9kZV0pXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoXG4gICAgICBzaG93T3ZlcmFnZUNyZWRpdFVwc2VsbCAmJlxuICAgICAgIXNob3dPbmJvYXJkaW5nICYmXG4gICAgICAhc2hvd0d1ZXN0UGFzc2VzVXBzZWxsICYmXG4gICAgICAhaXNDb25kZW5zZWRNb2RlXG4gICAgKSB7XG4gICAgICBpbmNyZW1lbnRPdmVyYWdlQ3JlZGl0VXBzZWxsU2VlbkNvdW50KClcbiAgICB9XG4gIH0sIFtcbiAgICBzaG93T3ZlcmFnZUNyZWRpdFVwc2VsbCxcbiAgICBzaG93T25ib2FyZGluZyxcbiAgICBzaG93R3Vlc3RQYXNzZXNVcHNlbGwsXG4gICAgaXNDb25kZW5zZWRNb2RlLFxuICBdKVxuXG4gIGNvbnN0IG1vZGVsID0gdXNlTWFpbkxvb3BNb2RlbCgpXG4gIGNvbnN0IGZ1bGxNb2RlbERpc3BsYXlOYW1lID0gcmVuZGVyTW9kZWxTZXR0aW5nKG1vZGVsKVxuICBjb25zdCB7XG4gICAgdmVyc2lvbixcbiAgICBjd2QsXG4gICAgYmlsbGluZ1R5cGUsXG4gICAgYWdlbnROYW1lOiBhZ2VudE5hbWVGcm9tU2V0dGluZ3MsXG4gIH0gPSBnZXRMb2dvRGlzcGxheURhdGEoKVxuICAvLyBQcmVmZXIgQXBwU3RhdGUuYWdlbnQgKHNldCBmcm9tIC0tYWdlbnQgQ0xJIGZsYWcpIG92ZXIgc2V0dGluZ3NcbiAgY29uc3QgYWdlbnROYW1lID0gYWdlbnQgPz8gYWdlbnROYW1lRnJvbVNldHRpbmdzXG4gIC8vIC0yMCB0byBhY2NvdW50IGZvciB0aGUgbWF4IGxlbmd0aCBvZiBzdWJzY3JpcHRpb24gbmFtZSBcIiDCtyBDbGF1ZGUgRW50ZXJwcmlzZVwiLlxuICBjb25zdCBlZmZvcnRTdWZmaXggPSBnZXRFZmZvcnRTdWZmaXgobW9kZWwsIGVmZm9ydFZhbHVlKVxuICBjb25zdCBtb2RlbERpc3BsYXlOYW1lID0gdHJ1bmNhdGUoXG4gICAgZnVsbE1vZGVsRGlzcGxheU5hbWUgKyBlZmZvcnRTdWZmaXgsXG4gICAgTEVGVF9QQU5FTF9NQVhfV0lEVEggLSAyMCxcbiAgKVxuXG4gIC8vIFNob3cgY29uZGVuc2VkIGxvZ28gaWYgbm8gbmV3IGNoYW5nZWxvZyBhbmQgbm90IHNob3dpbmcgb25ib2FyZGluZyBhbmQgbm90IGZvcmNpbmcgZnVsbCBsb2dvXG4gIGlmIChcbiAgICAhaGFzUmVsZWFzZU5vdGVzICYmXG4gICAgIXNob3dPbmJvYXJkaW5nICYmXG4gICAgIWlzRW52VHJ1dGh5KHByb2Nlc3MuZW52LkNMQVVERV9DT0RFX0ZPUkNFX0ZVTExfTE9HTylcbiAgKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIDxDb25kZW5zZWRMb2dvIC8+XG4gICAgICAgIDxWb2ljZU1vZGVOb3RpY2UgLz5cbiAgICAgICAgPE9wdXMxbU1lcmdlTm90aWNlIC8+XG4gICAgICAgIHtDaGFubmVsc05vdGljZU1vZHVsZSAmJiA8Q2hhbm5lbHNOb3RpY2VNb2R1bGUuQ2hhbm5lbHNOb3RpY2UgLz59XG4gICAgICAgIHtpc0RlYnVnTW9kZSgpICYmIChcbiAgICAgICAgICA8Qm94IHBhZGRpbmdMZWZ0PXsyfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5EZWJ1ZyBtb2RlIGVuYWJsZWQ8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgTG9nZ2luZyB0bzoge2lzRGVidWdUb1N0ZEVycigpID8gJ3N0ZGVycicgOiBnZXREZWJ1Z0xvZ1BhdGgoKX1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgICAgPEVtZXJnZW5jeVRpcCAvPlxuICAgICAgICB7cHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfVE1VWF9TRVNTSU9OICYmIChcbiAgICAgICAgICA8Qm94IHBhZGRpbmdMZWZ0PXsyfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgdG11eCBzZXNzaW9uOiB7cHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfVE1VWF9TRVNTSU9OfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIHtwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9UTVVYX1BSRUZJWF9DT05GTElDVFNcbiAgICAgICAgICAgICAgICA/IGBEZXRhY2g6ICR7cHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfVE1VWF9QUkVGSVh9ICR7cHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfVE1VWF9QUkVGSVh9IGQgKHByZXNzIHByZWZpeCB0d2ljZSAtIENsYXVkZSB1c2VzICR7cHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfVE1VWF9QUkVGSVh9KWBcbiAgICAgICAgICAgICAgICA6IGBEZXRhY2g6ICR7cHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfVE1VWF9QUkVGSVh9IGRgfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApfVxuICAgICAgICB7YW5ub3VuY2VtZW50ICYmIChcbiAgICAgICAgICA8Qm94IHBhZGRpbmdMZWZ0PXsyfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICB7IXByb2Nlc3MuZW52LklTX0RFTU8gJiYgY29uZmlnLm9hdXRoQWNjb3VudD8ub3JnYW5pemF0aW9uTmFtZSAmJiAoXG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgIE1lc3NhZ2UgZnJvbSB7Y29uZmlnLm9hdXRoQWNjb3VudC5vcmdhbml6YXRpb25OYW1lfTpcbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxUZXh0Pnthbm5vdW5jZW1lbnR9PC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApfVxuICAgICAgICB7XCJleHRlcm5hbFwiID09PSAnYW50JyAmJiAhcHJvY2Vzcy5lbnYuREVNT19WRVJTSU9OICYmIChcbiAgICAgICAgICA8Qm94IHBhZGRpbmdMZWZ0PXsyfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5Vc2UgL2lzc3VlIHRvIHJlcG9ydCBtb2RlbCBiZWhhdmlvciBpc3N1ZXM8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICAgIHtcImV4dGVybmFsXCIgPT09ICdhbnQnICYmICFwcm9jZXNzLmVudi5ERU1PX1ZFUlNJT04gJiYgKFxuICAgICAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPltBTlQtT05MWV0gTG9nczo8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgQVBJIGNhbGxzOiB7Z2V0RGlzcGxheVBhdGgoZ2V0RHVtcFByb21wdHNQYXRoKCkpfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIERlYnVnIGxvZ3M6IHtnZXREaXNwbGF5UGF0aChnZXREZWJ1Z0xvZ1BhdGgoKSl9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICB7aXNEZXRhaWxlZFByb2ZpbGluZ0VuYWJsZWQoKSAmJiAoXG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgIFN0YXJ0dXAgUGVyZjoge2dldERpc3BsYXlQYXRoKGdldFN0YXJ0dXBQZXJmTG9nUGF0aCgpKX1cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgICAge1wiZXh0ZXJuYWxcIiA9PT0gJ2FudCcgJiYgPEdhdGVPdmVycmlkZXNXYXJuaW5nIC8+fVxuICAgICAgICB7XCJleHRlcm5hbFwiID09PSAnYW50JyAmJiA8RXhwZXJpbWVudEVucm9sbG1lbnROb3RpY2UgLz59XG4gICAgICA8Lz5cbiAgICApXG4gIH1cblxuICAvLyBDYWxjdWxhdGUgbGF5b3V0IGFuZCBkaXNwbGF5IHZhbHVlc1xuICBjb25zdCBsYXlvdXRNb2RlID0gZ2V0TGF5b3V0TW9kZShjb2x1bW5zKVxuXG4gIGNvbnN0IHVzZXJUaGVtZSA9IHJlc29sdmVUaGVtZVNldHRpbmcoZ2V0R2xvYmFsQ29uZmlnKCkudGhlbWUpXG4gIGNvbnN0IGJvcmRlclRpdGxlID0gYCAke2NvbG9yKCdjbGF1ZGUnLCB1c2VyVGhlbWUpKCdDbGF1ZGUgQ29kZScpfSAke2NvbG9yKCdpbmFjdGl2ZScsIHVzZXJUaGVtZSkoYHYke3ZlcnNpb259YCl9IGBcbiAgY29uc3QgY29tcGFjdEJvcmRlclRpdGxlID0gY29sb3IoJ2NsYXVkZScsIHVzZXJUaGVtZSkoJyBDbGF1ZGUgQ29kZSAnKVxuXG4gIC8vIEVhcmx5IHJldHVybiBmb3IgY29tcGFjdCBtb2RlXG4gIGlmIChsYXlvdXRNb2RlID09PSAnY29tcGFjdCcpIHtcbiAgICBjb25zdCBsYXlvdXRXaWR0aCA9IDQgLy8gYm9yZGVyICsgcGFkZGluZ1xuICAgIGxldCB3ZWxjb21lTWVzc2FnZSA9IGZvcm1hdFdlbGNvbWVNZXNzYWdlKHVzZXJuYW1lKVxuICAgIGlmIChzdHJpbmdXaWR0aCh3ZWxjb21lTWVzc2FnZSkgPiBjb2x1bW5zIC0gbGF5b3V0V2lkdGgpIHtcbiAgICAgIHdlbGNvbWVNZXNzYWdlID0gZm9ybWF0V2VsY29tZU1lc3NhZ2UobnVsbClcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgY3dkIHdpZHRoIGFjY291bnRpbmcgZm9yIGFnZW50IG5hbWUgaWYgcHJlc2VudFxuICAgIGNvbnN0IHNlcGFyYXRvciA9ICcgwrcgJ1xuICAgIGNvbnN0IGF0UHJlZml4ID0gJ0AnXG4gICAgY29uc3QgY3dkQXZhaWxhYmxlV2lkdGggPSBhZ2VudE5hbWVcbiAgICAgID8gY29sdW1ucyAtXG4gICAgICAgIGxheW91dFdpZHRoIC1cbiAgICAgICAgYXRQcmVmaXgubGVuZ3RoIC1cbiAgICAgICAgc3RyaW5nV2lkdGgoYWdlbnROYW1lKSAtXG4gICAgICAgIHNlcGFyYXRvci5sZW5ndGhcbiAgICAgIDogY29sdW1ucyAtIGxheW91dFdpZHRoXG4gICAgY29uc3QgdHJ1bmNhdGVkQ3dkID0gdHJ1bmNhdGVQYXRoKGN3ZCwgTWF0aC5tYXgoY3dkQXZhaWxhYmxlV2lkdGgsIDEwKSlcbiAgICAvLyBPZmZzY3JlZW5GcmVlemU6IGxvZ28gaXMgdGhlIGZpcnN0IHRoaW5nIHRvIGVudGVyIHNjcm9sbGJhY2s7IHVzZU1haW5Mb29wTW9kZWwoKVxuICAgIC8vIHN1YnNjcmliZXMgdG8gbW9kZWwgY2hhbmdlcyBhbmQgZ2V0TG9nb0Rpc3BsYXlEYXRhKCkgcmVhZHMgY3dkL3N1YnNjcmlwdGlvbiDigJRcbiAgICAvLyBhbnkgY2hhbmdlIHdoaWxlIGluIHNjcm9sbGJhY2sgZm9yY2VzIGEgZnVsbCByZXNldC5cbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPE9mZnNjcmVlbkZyZWV6ZT5cbiAgICAgICAgICA8Qm94XG4gICAgICAgICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgICAgICAgIGJvcmRlclN0eWxlPVwicm91bmRcIlxuICAgICAgICAgICAgYm9yZGVyQ29sb3I9XCJjbGF1ZGVcIlxuICAgICAgICAgICAgYm9yZGVyVGV4dD17e1xuICAgICAgICAgICAgICBjb250ZW50OiBjb21wYWN0Qm9yZGVyVGl0bGUsXG4gICAgICAgICAgICAgIHBvc2l0aW9uOiAndG9wJyxcbiAgICAgICAgICAgICAgYWxpZ246ICdzdGFydCcsXG4gICAgICAgICAgICAgIG9mZnNldDogMSxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBwYWRkaW5nWD17MX1cbiAgICAgICAgICAgIHBhZGRpbmdZPXsxfVxuICAgICAgICAgICAgYWxpZ25JdGVtcz1cImNlbnRlclwiXG4gICAgICAgICAgICB3aWR0aD17Y29sdW1uc31cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8VGV4dCBib2xkPnt3ZWxjb21lTWVzc2FnZX08L1RleHQ+XG4gICAgICAgICAgICA8Qm94IG1hcmdpblk9ezF9PlxuICAgICAgICAgICAgICA8Q2xhd2QgLz5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e21vZGVsRGlzcGxheU5hbWV9PC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e2JpbGxpbmdUeXBlfTwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICB7YWdlbnROYW1lID8gYEAke2FnZW50TmFtZX0gwrcgJHt0cnVuY2F0ZWRDd2R9YCA6IHRydW5jYXRlZEN3ZH1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgPC9PZmZzY3JlZW5GcmVlemU+XG4gICAgICAgIDxWb2ljZU1vZGVOb3RpY2UgLz5cbiAgICAgICAgPE9wdXMxbU1lcmdlTm90aWNlIC8+XG4gICAgICAgIHtDaGFubmVsc05vdGljZU1vZHVsZSAmJiA8Q2hhbm5lbHNOb3RpY2VNb2R1bGUuQ2hhbm5lbHNOb3RpY2UgLz59XG4gICAgICAgIHtzaG93U2FuZGJveFN0YXR1cyAmJiAoXG4gICAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICBZb3VyIGJhc2ggY29tbWFuZHMgd2lsbCBiZSBzYW5kYm94ZWQuIERpc2FibGUgd2l0aCAvc2FuZGJveC5cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgICAge1wiZXh0ZXJuYWxcIiA9PT0gJ2FudCcgJiYgPEdhdGVPdmVycmlkZXNXYXJuaW5nIC8+fVxuICAgICAgICB7XCJleHRlcm5hbFwiID09PSAnYW50JyAmJiA8RXhwZXJpbWVudEVucm9sbG1lbnROb3RpY2UgLz59XG4gICAgICA8Lz5cbiAgICApXG4gIH1cblxuICBjb25zdCB3ZWxjb21lTWVzc2FnZSA9IGZvcm1hdFdlbGNvbWVNZXNzYWdlKHVzZXJuYW1lKVxuICBjb25zdCBtb2RlbExpbmUgPVxuICAgICFwcm9jZXNzLmVudi5JU19ERU1PICYmIGNvbmZpZy5vYXV0aEFjY291bnQ/Lm9yZ2FuaXphdGlvbk5hbWVcbiAgICAgID8gYCR7bW9kZWxEaXNwbGF5TmFtZX0gwrcgJHtiaWxsaW5nVHlwZX0gwrcgJHtjb25maWcub2F1dGhBY2NvdW50Lm9yZ2FuaXphdGlvbk5hbWV9YFxuICAgICAgOiBgJHttb2RlbERpc3BsYXlOYW1lfSDCtyAke2JpbGxpbmdUeXBlfWBcbiAgLy8gQ2FsY3VsYXRlIGN3ZCB3aWR0aCBhY2NvdW50aW5nIGZvciBhZ2VudCBuYW1lIGlmIHByZXNlbnRcbiAgY29uc3QgY3dkU2VwYXJhdG9yID0gJyDCtyAnXG4gIGNvbnN0IGN3ZEF0UHJlZml4ID0gJ0AnXG4gIGNvbnN0IGN3ZEF2YWlsYWJsZVdpZHRoID0gYWdlbnROYW1lXG4gICAgPyBMRUZUX1BBTkVMX01BWF9XSURUSCAtXG4gICAgICBjd2RBdFByZWZpeC5sZW5ndGggLVxuICAgICAgc3RyaW5nV2lkdGgoYWdlbnROYW1lKSAtXG4gICAgICBjd2RTZXBhcmF0b3IubGVuZ3RoXG4gICAgOiBMRUZUX1BBTkVMX01BWF9XSURUSFxuICBjb25zdCB0cnVuY2F0ZWRDd2QgPSB0cnVuY2F0ZVBhdGgoY3dkLCBNYXRoLm1heChjd2RBdmFpbGFibGVXaWR0aCwgMTApKVxuICBjb25zdCBjd2RMaW5lID0gYWdlbnROYW1lID8gYEAke2FnZW50TmFtZX0gwrcgJHt0cnVuY2F0ZWRDd2R9YCA6IHRydW5jYXRlZEN3ZFxuICBjb25zdCBvcHRpbWFsTGVmdFdpZHRoID0gY2FsY3VsYXRlT3B0aW1hbExlZnRXaWR0aChcbiAgICB3ZWxjb21lTWVzc2FnZSxcbiAgICBjd2RMaW5lLFxuICAgIG1vZGVsTGluZSxcbiAgKVxuXG4gIC8vIENhbGN1bGF0ZSBsYXlvdXQgZGltZW5zaW9uc1xuICBjb25zdCB7IGxlZnRXaWR0aCwgcmlnaHRXaWR0aCB9ID0gY2FsY3VsYXRlTGF5b3V0RGltZW5zaW9ucyhcbiAgICBjb2x1bW5zLFxuICAgIGxheW91dE1vZGUsXG4gICAgb3B0aW1hbExlZnRXaWR0aCxcbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxPZmZzY3JlZW5GcmVlemU+XG4gICAgICAgIDxCb3hcbiAgICAgICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgICAgICBib3JkZXJTdHlsZT1cInJvdW5kXCJcbiAgICAgICAgICBib3JkZXJDb2xvcj1cImNsYXVkZVwiXG4gICAgICAgICAgYm9yZGVyVGV4dD17e1xuICAgICAgICAgICAgY29udGVudDogYm9yZGVyVGl0bGUsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ3RvcCcsXG4gICAgICAgICAgICBhbGlnbjogJ3N0YXJ0JyxcbiAgICAgICAgICAgIG9mZnNldDogMyxcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAgey8qIE1haW4gY29udGVudCAqL31cbiAgICAgICAgICA8Qm94XG4gICAgICAgICAgICBmbGV4RGlyZWN0aW9uPXtsYXlvdXRNb2RlID09PSAnaG9yaXpvbnRhbCcgPyAncm93JyA6ICdjb2x1bW4nfVxuICAgICAgICAgICAgcGFkZGluZ1g9ezF9XG4gICAgICAgICAgICBnYXA9ezF9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgey8qIExlZnQgUGFuZWwgKi99XG4gICAgICAgICAgICA8Qm94XG4gICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICAgICAgICB3aWR0aD17bGVmdFdpZHRofVxuICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudD1cInNwYWNlLWJldHdlZW5cIlxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zPVwiY2VudGVyXCJcbiAgICAgICAgICAgICAgbWluSGVpZ2h0PXs5fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICAgICAgPFRleHQgYm9sZD57d2VsY29tZU1lc3NhZ2V9PC9UZXh0PlxuICAgICAgICAgICAgICA8L0JveD5cblxuICAgICAgICAgICAgICA8Q2xhd2QgLz5cblxuICAgICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBhbGlnbkl0ZW1zPVwiY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e21vZGVsTGluZX08L1RleHQ+XG4gICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e2N3ZExpbmV9PC9UZXh0PlxuICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgIDwvQm94PlxuXG4gICAgICAgICAgICB7LyogVmVydGljYWwgZGl2aWRlciAqL31cbiAgICAgICAgICAgIHtsYXlvdXRNb2RlID09PSAnaG9yaXpvbnRhbCcgJiYgKFxuICAgICAgICAgICAgICA8Qm94XG4gICAgICAgICAgICAgICAgaGVpZ2h0PVwiMTAwJVwiXG4gICAgICAgICAgICAgICAgYm9yZGVyU3R5bGU9XCJzaW5nbGVcIlxuICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yPVwiY2xhdWRlXCJcbiAgICAgICAgICAgICAgICBib3JkZXJEaW1Db2xvclxuICAgICAgICAgICAgICAgIGJvcmRlclRvcD17ZmFsc2V9XG4gICAgICAgICAgICAgICAgYm9yZGVyQm90dG9tPXtmYWxzZX1cbiAgICAgICAgICAgICAgICBib3JkZXJMZWZ0PXtmYWxzZX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHsvKiBSaWdodCBQYW5lbCAtIFByb2plY3QgT25ib2FyZGluZyBvciBSZWNlbnQgQWN0aXZpdHkgYW5kIFdoYXQncyBOZXcgKi99XG4gICAgICAgICAgICB7bGF5b3V0TW9kZSA9PT0gJ2hvcml6b250YWwnICYmIChcbiAgICAgICAgICAgICAgPEZlZWRDb2x1bW5cbiAgICAgICAgICAgICAgICBmZWVkcz17XG4gICAgICAgICAgICAgICAgICBzaG93T25ib2FyZGluZ1xuICAgICAgICAgICAgICAgICAgICA/IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZVByb2plY3RPbmJvYXJkaW5nRmVlZChnZXRTdGVwcygpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZVJlY2VudEFjdGl2aXR5RmVlZChhY3Rpdml0aWVzKSxcbiAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgIDogc2hvd0d1ZXN0UGFzc2VzVXBzZWxsXG4gICAgICAgICAgICAgICAgICAgICAgPyBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZVJlY2VudEFjdGl2aXR5RmVlZChhY3Rpdml0aWVzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlR3Vlc3RQYXNzZXNGZWVkKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgOiBzaG93T3ZlcmFnZUNyZWRpdFVwc2VsbFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlUmVjZW50QWN0aXZpdHlGZWVkKGFjdGl2aXRpZXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU92ZXJhZ2VDcmVkaXRGZWVkKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZVJlY2VudEFjdGl2aXR5RmVlZChhY3Rpdml0aWVzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVXaGF0c05ld0ZlZWQoY2hhbmdlbG9nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtYXhXaWR0aD17cmlnaHRXaWR0aH1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9PZmZzY3JlZW5GcmVlemU+XG4gICAgICA8Vm9pY2VNb2RlTm90aWNlIC8+XG4gICAgICA8T3B1czFtTWVyZ2VOb3RpY2UgLz5cbiAgICAgIHtDaGFubmVsc05vdGljZU1vZHVsZSAmJiA8Q2hhbm5lbHNOb3RpY2VNb2R1bGUuQ2hhbm5lbHNOb3RpY2UgLz59XG4gICAgICB7aXNEZWJ1Z01vZGUoKSAmJiAoXG4gICAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5EZWJ1ZyBtb2RlIGVuYWJsZWQ8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICBMb2dnaW5nIHRvOiB7aXNEZWJ1Z1RvU3RkRXJyKCkgPyAnc3RkZXJyJyA6IGdldERlYnVnTG9nUGF0aCgpfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgICAgPEVtZXJnZW5jeVRpcCAvPlxuICAgICAge3Byb2Nlc3MuZW52LkNMQVVERV9DT0RFX1RNVVhfU0VTU0lPTiAmJiAoXG4gICAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIHRtdXggc2Vzc2lvbjoge3Byb2Nlc3MuZW52LkNMQVVERV9DT0RFX1RNVVhfU0VTU0lPTn1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7cHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfVE1VWF9QUkVGSVhfQ09ORkxJQ1RTXG4gICAgICAgICAgICAgID8gYERldGFjaDogJHtwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9UTVVYX1BSRUZJWH0gJHtwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9UTVVYX1BSRUZJWH0gZCAocHJlc3MgcHJlZml4IHR3aWNlIC0gQ2xhdWRlIHVzZXMgJHtwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9UTVVYX1BSRUZJWH0pYFxuICAgICAgICAgICAgICA6IGBEZXRhY2g6ICR7cHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfVE1VWF9QUkVGSVh9IGRgfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgICAge2Fubm91bmNlbWVudCAmJiAoXG4gICAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICB7IXByb2Nlc3MuZW52LklTX0RFTU8gJiYgY29uZmlnLm9hdXRoQWNjb3VudD8ub3JnYW5pemF0aW9uTmFtZSAmJiAoXG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgTWVzc2FnZSBmcm9tIHtjb25maWcub2F1dGhBY2NvdW50Lm9yZ2FuaXphdGlvbk5hbWV9OlxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICl9XG4gICAgICAgICAgPFRleHQ+e2Fubm91bmNlbWVudH08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cbiAgICAgIHtzaG93U2FuZGJveFN0YXR1cyAmJiAoXG4gICAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICAgIFlvdXIgYmFzaCBjb21tYW5kcyB3aWxsIGJlIHNhbmRib3hlZC4gRGlzYWJsZSB3aXRoIC9zYW5kYm94LlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgICAge1wiZXh0ZXJuYWxcIiA9PT0gJ2FudCcgJiYgIXByb2Nlc3MuZW52LkRFTU9fVkVSU0lPTiAmJiAoXG4gICAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5Vc2UgL2lzc3VlIHRvIHJlcG9ydCBtb2RlbCBiZWhhdmlvciBpc3N1ZXM8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cbiAgICAgIHtcImV4dGVybmFsXCIgPT09ICdhbnQnICYmICFwcm9jZXNzLmVudi5ERU1PX1ZFUlNJT04gJiYgKFxuICAgICAgICA8Qm94IHBhZGRpbmdMZWZ0PXsyfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCI+W0FOVC1PTkxZXSBMb2dzOjwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIEFQSSBjYWxsczoge2dldERpc3BsYXlQYXRoKGdldER1bXBQcm9tcHRzUGF0aCgpKX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+RGVidWcgbG9nczoge2dldERpc3BsYXlQYXRoKGdldERlYnVnTG9nUGF0aCgpKX08L1RleHQ+XG4gICAgICAgICAge2lzRGV0YWlsZWRQcm9maWxpbmdFbmFibGVkKCkgJiYgKFxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIFN0YXJ0dXAgUGVyZjoge2dldERpc3BsYXlQYXRoKGdldFN0YXJ0dXBQZXJmTG9nUGF0aCgpKX1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApfVxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgICB7XCJleHRlcm5hbFwiID09PSAnYW50JyAmJiA8R2F0ZU92ZXJyaWRlc1dhcm5pbmcgLz59XG4gICAgICB7XCJleHRlcm5hbFwiID09PSAnYW50JyAmJiA8RXhwZXJpbWVudEVucm9sbG1lbnROb3RpY2UgLz59XG4gICAgPC8+XG4gIClcbn1cblxuIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxLQUFLLFFBQVEsY0FBYztBQUMvQyxTQUFTQyxlQUFlLFFBQVEsZ0NBQWdDO0FBQ2hFLFNBQVNDLFdBQVcsUUFBUSwwQkFBMEI7QUFDdEQsU0FDRUMsYUFBYSxFQUNiQyx5QkFBeUIsRUFDekJDLHlCQUF5QixFQUN6QkMsb0JBQW9CLEVBQ3BCQyxZQUFZLEVBQ1pDLHFCQUFxQixFQUNyQkMseUJBQXlCLEVBQ3pCQyxrQkFBa0IsUUFDYiw0QkFBNEI7QUFDbkMsU0FBU0MsUUFBUSxRQUFRLHVCQUF1QjtBQUNoRCxTQUFTQyxjQUFjLFFBQVEscUJBQXFCO0FBQ3BELFNBQVNDLEtBQUssUUFBUSxZQUFZO0FBQ2xDLFNBQVNDLFVBQVUsUUFBUSxpQkFBaUI7QUFDNUMsU0FDRUMsd0JBQXdCLEVBQ3hCQyxrQkFBa0IsRUFDbEJDLDJCQUEyQixFQUMzQkMscUJBQXFCLFFBQ2hCLGtCQUFrQjtBQUN6QixTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLHFCQUFxQjtBQUN2RSxTQUFTQyxtQkFBbUIsUUFBUSwwQkFBMEI7QUFDOUQsU0FBU0Msa0JBQWtCLFFBQVEsZ0NBQWdDO0FBQ25FLFNBQ0VDLFdBQVcsRUFDWEMsZUFBZSxFQUNmQyxlQUFlLFFBQ1Ysb0JBQW9CO0FBQzNCLFNBQVNDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDM0MsU0FDRUMsUUFBUSxFQUNSQywyQkFBMkIsRUFDM0JDLG1DQUFtQyxRQUM5QixpQ0FBaUM7QUFD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
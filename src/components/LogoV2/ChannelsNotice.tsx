// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// Conditionally require()'d in LogoV2.tsx behind feature('KAIROS') ||
// feature('KAIROS_CHANNELS'). No feature() guard here — the whole file
// tree-shakes via the require pattern when both flags are false (see
// docs/feature-gating.md). Do NOT import this module statically from
// unguarded code.

// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 引入 ChannelEntry、getAllowedChannels、getHasDevChannels，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { type ChannelEntry, getAllowedChannels, getHasDevChannels } from '../../bootstrap/state.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 接入 isChannelsEnabled 服务层能力，把外部通信或共享状态交给 ../../services/mcp/channelAllowlist.js 处理。
import { isChannelsEnabled } from '../../services/mcp/channelAllowlist.js';
// 接入 getEffectiveChannelAllowlist 服务层能力，把外部通信或共享状态交给 ../../services/mcp/channelNotification.js 处理。
import { getEffectiveChannelAllowlist } from '../../services/mcp/channelNotification.js';
// 接入 getMcpConfigsByScope 服务层能力，把外部通信或共享状态交给 ../../services/mcp/config.js 处理。
import { getMcpConfigsByScope } from '../../services/mcp/config.js';
// 复用 getClaudeAIOAuthTokens、getSubscriptionType 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getClaudeAIOAuthTokens, getSubscriptionType } from '../../utils/auth.js';
// 复用 loadInstalledPluginsV2 工具函数，把通用处理留在 ../../utils/plugins/installedPluginsManager.js 中维护。
import { loadInstalledPluginsV2 } from '../../utils/plugins/installedPluginsManager.js';
// 复用 getSettingsForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettingsForSource } from '../../utils/settings/settings.js';
// ChannelsNotice 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ChannelsNotice() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(32);
  // 临时值 t0 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [t0] = useState(_temp);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    channels,
    disabled,
    noAuth,
    policyBlocked,
    list,
    unmatched
  } = t0;
  // channels 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (channels.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // hasNonDev记录 `channels.some` 是否成立，终端渲染随后按该结果分支。
  const hasNonDev = channels.some(_temp2);
  // flag读取`getHasDevChannels`，供终端渲染后续处理使用。
  const flag = getHasDevChannels() && hasNonDev ? "Channels" : getHasDevChannels() ? "--dangerously-load-development-channels" : "--channels";
  // 满足 `disabled` 时，终端渲染执行该分支。
  if (disabled) {
    // t1 暂存 `<Text color="error">{flag} ignored ({list})</Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== flag || $[1] !== list) {
      // t1 暂存 `<Text color="error">{flag} ignored ({list})</Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text color="error">{flag} ignored ({list})</Text>;
      // $[0] 缓存 `flag`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = flag;
      // $[1] 缓存 `list`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = list;
      // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[2];
    }
    // t2 暂存 `<Text dimColor={true}>Channels are not currently availabl...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      // t2 暂存 `<Text dimColor={true}>Channels are not currently availabl...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text dimColor={true}>Channels are not currently available</Text>;
      // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[3];
    }
    // t3 暂存 `<Box paddingLeft={2} flexDirection="column">{t1}{t2}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== t1) {
      // t3 暂存 `<Box paddingLeft={2} flexDirection="column">{t1}{t2}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Box paddingLeft={2} flexDirection="column">{t1}{t2}</Box>;
      // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t1;
      // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[5];
    }
    // 返回 `t3`，作为终端渲染这次计算的结果。
    return t3;
  }
  // 满足 `noAuth` 时，终端渲染执行该分支。
  if (noAuth) {
    // t1 暂存 `<Text color="error">{flag} ignored ({list})</Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[6] !== flag || $[7] !== list) {
      // t1 暂存 `<Text color="error">{flag} ignored ({list})</Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text color="error">{flag} ignored ({list})</Text>;
      // $[6] 缓存 `flag`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = flag;
      // $[7] 缓存 `list`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = list;
      // $[8] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[8];
    }
    // t2 暂存 `<Text dimColor={true}>Channels require claude.ai authenti...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      // t2 暂存 `<Text dimColor={true}>Channels require claude.ai authenti...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text dimColor={true}>Channels require claude.ai authentication · run /login, then restart</Text>;
      // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[9];
    }
    // t3 暂存 `<Box paddingLeft={2} flexDirection="column">{t1}{t2}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== t1) {
      // t3 暂存 `<Box paddingLeft={2} flexDirection="column">{t1}{t2}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Box paddingLeft={2} flexDirection="column">{t1}{t2}</Box>;
      // $[10] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t1;
      // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[11];
    }
    // 返回 `t3`，作为终端渲染这次计算的结果。
    return t3;
  }
  // 满足 `policyBlocked` 时，终端渲染执行该分支。
  if (policyBlocked) {
    // t1 暂存 `<Text color="error">{flag} blocked by org policy ({list})...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[12] !== flag || $[13] !== list) {
      // t1 暂存 `<Text color="error">{flag} blocked by org policy ({list})...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text color="error">{flag} blocked by org policy ({list})</Text>;
      // $[12] 缓存 `flag`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = flag;
      // $[13] 缓存 `list`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = list;
      // $[14] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[14];
    }
    // t2 暂存 `<Text dimColor={true}>Inbound messages will be silently d...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // t3 暂存 `<Text dimColor={true}>Have an administrator set channelsE...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      // t2 暂存 `<Text dimColor={true}>Inbound messages will be silently d...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text dimColor={true}>Inbound messages will be silently dropped</Text>;
      // t3 暂存 `<Text dimColor={true}>Have an administrator set channelsE...` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text dimColor={true}>Have an administrator set channelsEnabled: true in managed settings to enable</Text>;
      // $[15] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t2;
      // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t3;
    } else {
      // t2 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[15];
      // t3 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[16];
    }
    // t4 暂存 `unmatched.map(_temp3)` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== unmatched) {
      // t4 暂存 `unmatched.map(_temp3)` 生成的渲染片段，后续返回路径直接复用。
      t4 = unmatched.map(_temp3);
      // $[17] 缓存 `unmatched`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = unmatched;
      // $[18] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[18];
    }
    // t5 暂存 `<Box paddingLeft={2} flexDirection="column">{t1}{t2}{t3}{...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[19] !== t1 || $[20] !== t4) {
      // t5 暂存 `<Box paddingLeft={2} flexDirection="column">{t1}{t2}{t3}{...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Box paddingLeft={2} flexDirection="column">{t1}{t2}{t3}{t4}</Box>;
      // $[19] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t1;
      // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t4;
      // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[21];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // t1 暂存 `<Text color="error">Listening for channel messages from: ...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== list) {
    // t1 暂存 `<Text color="error">Listening for channel messages from: ...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color="error">Listening for channel messages from: {list}</Text>;
    // $[22] 缓存 `list`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = list;
    // $[23] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[23];
  }
  // t2 暂存 `<Text dimColor={true}>Experimental · inbound messages wil...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== flag) {
    // t2 暂存 `<Text dimColor={true}>Experimental · inbound messages wil...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>Experimental · inbound messages will be pushed into this session, this carries prompt injection risks. Restart Claude Code without {flag} to disable.</Text>;
    // $[24] 缓存 `flag`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = flag;
    // $[25] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[25];
  }
  // t3 暂存 `unmatched.map(_temp4)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== unmatched) {
    // t3 暂存 `unmatched.map(_temp4)` 生成的渲染片段，后续返回路径直接复用。
    t3 = unmatched.map(_temp4);
    // $[26] 缓存 `unmatched`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = unmatched;
    // $[27] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[27];
  }
  // t4 暂存 `<Box paddingLeft={2} flexDirection="column">{t1}{t2}{t3}<...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== t1 || $[29] !== t2 || $[30] !== t3) {
    // t4 暂存 `<Box paddingLeft={2} flexDirection="column">{t1}{t2}{t3}<...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box paddingLeft={2} flexDirection="column">{t1}{t2}{t3}</Box>;
    // $[28] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t1;
    // $[29] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t2;
    // $[30] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t3;
    // $[31] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[31];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(u_0) {
  // 返回 `<Text key={`${formatEntry(u_0.entry)}:${u_0.why}`} color="warning">{for...`，作为终端渲染这次计算的结果。
  return <Text key={`${formatEntry(u_0.entry)}:${u_0.why}`} color="warning">{formatEntry(u_0.entry)} · {u_0.why}</Text>;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(u) {
  // 返回 `<Text key={`${formatEntry(u.entry)}:${u.why}`} color="warning">{formatE...`，作为终端渲染这次计算的结果。
  return <Text key={`${formatEntry(u.entry)}:${u.why}`} color="warning">{formatEntry(u.entry)} · {u.why}</Text>;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(c) {
  // 返回 `!c.dev`，作为终端渲染这次计算的结果。
  return !c.dev;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // ch读取`getAllowedChannels`，供终端渲染后续处理使用。
  const ch = getAllowedChannels();
  // ch为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (ch.length === 0) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      channels: ch,
      disabled: false,
      noAuth: false,
      policyBlocked: false,
      list: "",
      unmatched: [] as Unmatched[]
    };
  }
  // l派生`ch.map`，供终端渲染后续处理使用。
  const l = ch.map(formatEntry).join(", ");
  // sub读取`getSubscriptionType`，供终端渲染后续处理使用。
  const sub = getSubscriptionType();
  // managed标记终端 UI Channels Notice是否启用对应路径。
  const managed = sub === "team" || sub === "enterprise";
  // policy读取`getSettingsForSource`，供终端渲染后续处理使用。
  const policy = getSettingsForSource("policySettings");
  // allowlist 集合读取`getEffectiveChannelAllowlist`，供终端渲染后续处理使用。
  const allowlist = getEffectiveChannelAllowlist(sub, policy?.allowedChannelPlugins);
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    channels: ch,
    disabled: !isChannelsEnabled(),
    noAuth: !getClaudeAIOAuthTokens()?.accessToken,
    policyBlocked: managed && policy?.channelsEnabled !== true,
    list: l,
    unmatched: findUnmatched(ch, allowlist)
  };
}
// formatEntry 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatEntry(c: ChannelEntry): string {
  // 返回 `c.kind === 'plugin' ? `plugin:${c.name}@${c.marketplace}` : `server:${c...`，作为终端渲染这次计算的结果。
  return c.kind === 'plugin' ? `plugin:${c.name}@${c.marketplace}` : `server:${c.name}`;
}
// Unmatched 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Unmatched = {
  entry: ChannelEntry;
  why: string;
};
// findUnmatched 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findUnmatched(entries: readonly ChannelEntry[], allowlist: ReturnType<typeof getEffectiveChannelAllowlist>): Unmatched[] {
  // Server-kind: build one Set from all scopes up front. getMcpConfigsByScope
  // is not cached (project scope walks the dir tree); getMcpConfigByName would
  // redo that walk per entry.
  // scopes 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const scopes = ['enterprise', 'user', 'project', 'local'] as const;
  // configured 配置构建`new Set<string>()` 整理出中间结果，供终端 UI Channels Notice后续步骤使用。
  const configured = new Set<string>();
  // 按顺序遍历 `scopes` 中的scope，逐个交给终端渲染处理。
  for (const scope of scopes) {
    // 逐项读取 `Object.keys(getMcpConfigsByScope(scope).servers)` 中的名称，按输入顺序推进终端渲染。
    for (const name of Object.keys(getMcpConfigsByScope(scope).servers)) {
      // 调用 configured.add，触发终端渲染此处需要的副作用。
      configured.add(name);
    }
  }

  // Plugin-kind installed check: installed_plugins.json keys are
  // `name@marketplace`. loadInstalledPluginsV2 is cached.
  // installedPluginIds 插件数据保存`Set`，供终端渲染后续处理使用。
  const installedPluginIds = new Set(Object.keys(loadInstalledPluginsV2().plugins));

  // Plugin-kind allowlist check: same {marketplace, plugin} test as the
  // gate at channelNotification.ts. entry.dev bypasses (dev flag opts out
  // of the allowlist). Org list replaces ledger when set (team/enterprise).
  // GrowthBook _CACHED_MAY_BE_STALE — cold cache yields [] so every plugin
  // entry warns; same tradeoff the gate already accepts.
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    entries: allowed,
    source
  } = allowlist;

  // Independent ifs — a plugin entry that's both uninstalled AND
  // unlisted shows two lines. Server kind checks config + dev flag.
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: Unmatched[] = [];
  // 按顺序遍历 `entries` 中的entry，逐个交给终端渲染处理。
  for (const entry of entries) {
    // 当 `entry.kind` 匹配 `'server'` 时，终端渲染执行对应分支。
    if (entry.kind === 'server') {
      // 满足 `!configured.has(entry.name)` 时，终端渲染执行该分支。
      if (!configured.has(entry.name)) {
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push({
          entry,
          why: 'no MCP server configured with that name'
        });
      }
      // entry.dev缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!entry.dev) {
        // out追加新条目，保持收集顺序与输入顺序一致。
        out.push({
          entry,
          why: 'server: entries need --dangerously-load-development-channels'
        });
      }
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue;
    }
    // 满足 `!installedPluginIds.has(`${entry.name}@${entry.marketplace}`)` 时，终端渲染执行该分支。
    if (!installedPluginIds.has(`${entry.name}@${entry.marketplace}`)) {
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push({
        entry,
        why: 'plugin not installed'
      });
    }
    // 只有 `!entry.dev && !allowed.some(e => e.plugin === entry.name && e.marketplace =...` 满足时，终端渲染才执行该分支。
    if (!entry.dev && !allowed.some(e => e.plugin === entry.name && e.marketplace === entry.marketplace)) {
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push({
        entry,
        why: source === 'org' ? "not on your org's approved channels list" : 'not on the approved channels allowlist'
      });
    }
  }
  // 返回 `out`，作为终端渲染这次计算的结果。
  return out;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwiQ2hhbm5lbEVudHJ5IiwiZ2V0QWxsb3dlZENoYW5uZWxzIiwiZ2V0SGFzRGV2Q2hhbm5lbHMiLCJCb3giLCJUZXh0IiwiaXNDaGFubmVsc0VuYWJsZWQiLCJnZXRFZmZlY3RpdmVDaGFubmVsQWxsb3dsaXN0IiwiZ2V0TWNwQ29uZmlnc0J5U2NvcGUiLCJnZXRDbGF1ZGVBSU9BdXRoVG9rZW5zIiwiZ2V0U3Vic2NyaXB0aW9uVHlwZSIsImxvYWRJbnN0YWxsZWRQbHVnaW5zVjIiLCJnZXRTZXR0aW5nc0ZvclNvdXJjZSIsIkNoYW5uZWxzTm90aWNlIiwiJCIsIl9jIiwidDAiLCJfdGVtcCIsImNoYW5uZWxzIiwiZGlzYWJsZWQiLCJub0F1dGgiLCJwb2xpY3lCbG9ja2VkIiwibGlzdCIsInVubWF0Y2hlZCIsImxlbmd0aCIsImhhc05vbkRldiIsInNvbWUiLCJfdGVtcDIiLCJmbGFnIiwidDEiLCJ0MiIsIlN5bWJvbCIsImZvciIsInQzIiwidDQiLCJtYXAiLCJfdGVtcDMiLCJ0NSIsIl90ZW1wNCIsInVfMCIsImZvcm1hdEVudHJ5IiwidSIsImVudHJ5Iiwid2h5IiwiYyIsImRldiIsImNoIiwiVW5tYXRjaGVkIiwibCIsImpvaW4iLCJzdWIiLCJtYW5hZ2VkIiwicG9saWN5IiwiYWxsb3dsaXN0IiwiYWxsb3dlZENoYW5uZWxQbHVnaW5zIiwiYWNjZXNzVG9rZW4iLCJjaGFubmVsc0VuYWJsZWQiLCJmaW5kVW5tYXRjaGVkIiwia2luZCIsIm5hbWUiLCJtYXJrZXRwbGFjZSIsImVudHJpZXMiLCJSZXR1cm5UeXBlIiwic2NvcGVzIiwiY29uc3QiLCJjb25maWd1cmVkIiwiU2V0Iiwic2NvcGUiLCJPYmplY3QiLCJrZXlzIiwic2VydmVycyIsImFkZCIsImluc3RhbGxlZFBsdWdpbklkcyIsInBsdWdpbnMiLCJhbGxvd2VkIiwic291cmNlIiwib3V0IiwiaGFzIiwicHVzaCIsImUiLCJwbHVnaW4iXSwic291cmNlcyI6WyJDaGFubmVsc05vdGljZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29uZGl0aW9uYWxseSByZXF1aXJlKCknZCBpbiBMb2dvVjIudHN4IGJlaGluZCBmZWF0dXJlKCdLQUlST1MnKSB8fFxuLy8gZmVhdHVyZSgnS0FJUk9TX0NIQU5ORUxTJykuIE5vIGZlYXR1cmUoKSBndWFyZCBoZXJlIOKAlCB0aGUgd2hvbGUgZmlsZVxuLy8gdHJlZS1zaGFrZXMgdmlhIHRoZSByZXF1aXJlIHBhdHRlcm4gd2hlbiBib3RoIGZsYWdzIGFyZSBmYWxzZSAoc2VlXG4vLyBkb2NzL2ZlYXR1cmUtZ2F0aW5nLm1kKS4gRG8gTk9UIGltcG9ydCB0aGlzIG1vZHVsZSBzdGF0aWNhbGx5IGZyb21cbi8vIHVuZ3VhcmRlZCBjb2RlLlxuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQge1xuICB0eXBlIENoYW5uZWxFbnRyeSxcbiAgZ2V0QWxsb3dlZENoYW5uZWxzLFxuICBnZXRIYXNEZXZDaGFubmVscyxcbn0gZnJvbSAnLi4vLi4vYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgaXNDaGFubmVsc0VuYWJsZWQgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tY3AvY2hhbm5lbEFsbG93bGlzdC5qcydcbmltcG9ydCB7IGdldEVmZmVjdGl2ZUNoYW5uZWxBbGxvd2xpc3QgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tY3AvY2hhbm5lbE5vdGlmaWNhdGlvbi5qcydcbmltcG9ydCB7IGdldE1jcENvbmZpZ3NCeVNjb3BlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvbWNwL2NvbmZpZy5qcydcbmltcG9ydCB7XG4gIGdldENsYXVkZUFJT0F1dGhUb2tlbnMsXG4gIGdldFN1YnNjcmlwdGlvblR5cGUsXG59IGZyb20gJy4uLy4uL3V0aWxzL2F1dGguanMnXG5pbXBvcnQgeyBsb2FkSW5zdGFsbGVkUGx1Z2luc1YyIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGx1Z2lucy9pbnN0YWxsZWRQbHVnaW5zTWFuYWdlci5qcydcbmltcG9ydCB7IGdldFNldHRpbmdzRm9yU291cmNlIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2V0dGluZ3Mvc2V0dGluZ3MuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiBDaGFubmVsc05vdGljZSgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBTbmFwc2hvdCBhbGwgcmVhZHMgYXQgbW91bnQuIFRoaXMgbm90aWNlIGVudGVycyBzY3JvbGxiYWNrIGltbWVkaWF0ZWx5XG4gIC8vIGFmdGVyIHRoZSBsb2dvOyBhbnkgcmUtcmVuZGVyIHBhc3QgdGhhdCBwb2ludCBmb3JjZXMgYSBmdWxsIHRlcm1pbmFsXG4gIC8vIHJlc2V0LiBnZXRBbGxvd2VkQ2hhbm5lbHMgKGJvb3RzdHJhcCBzdGF0ZSksIGdldFNldHRpbmdzRm9yU291cmNlXG4gIC8vIChzZXNzaW9uIGNhY2hlIHVwZGF0ZWQgYnkgYmFja2dyb3VuZCBwb2xsaW5nIC8gL2xvZ2luKSwgYW5kXG4gIC8vIGlzQ2hhbm5lbHNFbmFibGVkIChHcm93dGhCb29rIDUtbWluIHJlZnJlc2gpIG11c3QgYmUgY2FwdHVyZWQgb25jZVxuICAvLyBzbyBhIGxhdGVyIHJlLXJlbmRlciBjYW5ub3QgZmxpcCBicmFuY2hlcy5cbiAgY29uc3QgW3sgY2hhbm5lbHMsIGRpc2FibGVkLCBub0F1dGgsIHBvbGljeUJsb2NrZWQsIGxpc3QsIHVubWF0Y2hlZCB9XSA9XG4gICAgdXNlU3RhdGUoKCkgPT4ge1xuICAgICAgY29uc3QgY2ggPSBnZXRBbGxvd2VkQ2hhbm5lbHMoKVxuICAgICAgaWYgKGNoLmxlbmd0aCA9PT0gMClcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjaGFubmVsczogY2gsXG4gICAgICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgIG5vQXV0aDogZmFsc2UsXG4gICAgICAgICAgcG9saWN5QmxvY2tlZDogZmFsc2UsXG4gICAgICAgICAgbGlzdDogJycsXG4gICAgICAgICAgdW5tYXRjaGVkOiBbXSBhcyBVbm1hdGNoZWRbXSxcbiAgICAgICAgfVxuICAgICAgY29uc3QgbCA9IGNoLm1hcChmb3JtYXRFbnRyeSkuam9pbignLCAnKVxuICAgICAgY29uc3Qgc3ViID0gZ2V0U3Vic2NyaXB0aW9uVHlwZSgpXG4gICAgICBjb25zdCBtYW5hZ2VkID0gc3ViID09PSAndGVhbScgfHwgc3ViID09PSAnZW50ZXJwcmlzZSdcbiAgICAgIGNvbnN0IHBvbGljeSA9IGdldFNldHRpbmdzRm9yU291cmNlKCdwb2xpY3lTZXR0aW5ncycpXG4gICAgICBjb25zdCBhbGxvd2xpc3QgPSBnZXRFZmZlY3RpdmVDaGFubmVsQWxsb3dsaXN0KFxuICAgICAgICBzdWIsXG4gICAgICAgIHBvbGljeT8uYWxsb3dlZENoYW5uZWxQbHVnaW5zLFxuICAgICAgKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2hhbm5lbHM6IGNoLFxuICAgICAgICBkaXNhYmxlZDogIWlzQ2hhbm5lbHNFbmFibGVkKCksXG4gICAgICAgIG5vQXV0aDogIWdldENsYXVkZUFJT0F1dGhUb2tlbnMoKT8uYWNjZXNzVG9rZW4sXG4gICAgICAgIHBvbGljeUJsb2NrZWQ6IG1hbmFnZWQgJiYgcG9saWN5Py5jaGFubmVsc0VuYWJsZWQgIT09IHRydWUsXG4gICAgICAgIGxpc3Q6IGwsXG4gICAgICAgIHVubWF0Y2hlZDogZmluZFVubWF0Y2hlZChjaCwgYWxsb3dsaXN0KSxcbiAgICAgIH1cbiAgICB9KVxuICBpZiAoY2hhbm5lbHMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbFxuXG4gIC8vIFdoZW4gYm90aCBmbGFncyBhcmUgcGFzc2VkLCB0aGUgbGlzdCBtaXhlcyBlbnRyaWVzIGFuZCBhIHNpbmdsZSBmbGFnXG4gIC8vIG5hbWUgd291bGQgYmUgd3JvbmcgZm9yIGhhbGYgb2YgaXQuIGVudHJ5LmRldiBkaXN0aW5ndWlzaGVzIG9yaWdpbi5cbiAgY29uc3QgaGFzTm9uRGV2ID0gY2hhbm5lbHMuc29tZShjID0+ICFjLmRldilcbiAgY29uc3QgZmxhZyA9XG4gICAgZ2V0SGFzRGV2Q2hhbm5lbHMoKSAmJiBoYXNOb25EZXZcbiAgICAgID8gJ0NoYW5uZWxzJ1xuICAgICAgOiBnZXRIYXNEZXZDaGFubmVscygpXG4gICAgICAgID8gJy0tZGFuZ2Vyb3VzbHktbG9hZC1kZXZlbG9wbWVudC1jaGFubmVscydcbiAgICAgICAgOiAnLS1jaGFubmVscydcblxuICBpZiAoZGlzYWJsZWQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBwYWRkaW5nTGVmdD17Mn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAge2ZsYWd9IGlnbm9yZWQgKHtsaXN0fSlcbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5DaGFubmVscyBhcmUgbm90IGN1cnJlbnRseSBhdmFpbGFibGU8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICBpZiAobm9BdXRoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPlxuICAgICAgICAgIHtmbGFnfSBpZ25vcmVkICh7bGlzdH0pXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgQ2hhbm5lbHMgcmVxdWlyZSBjbGF1ZGUuYWkgYXV0aGVudGljYXRpb24gwrcgcnVuIC9sb2dpbiwgdGhlbiByZXN0YXJ0XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGlmIChwb2xpY3lCbG9ja2VkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPlxuICAgICAgICAgIHtmbGFnfSBibG9ja2VkIGJ5IG9yZyBwb2xpY3kgKHtsaXN0fSlcbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5JbmJvdW5kIG1lc3NhZ2VzIHdpbGwgYmUgc2lsZW50bHkgZHJvcHBlZDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgSGF2ZSBhbiBhZG1pbmlzdHJhdG9yIHNldCBjaGFubmVsc0VuYWJsZWQ6IHRydWUgaW4gbWFuYWdlZCBzZXR0aW5ncyB0b1xuICAgICAgICAgIGVuYWJsZVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIHt1bm1hdGNoZWQubWFwKHUgPT4gKFxuICAgICAgICAgIDxUZXh0IGtleT17YCR7Zm9ybWF0RW50cnkodS5lbnRyeSl9OiR7dS53aHl9YH0gY29sb3I9XCJ3YXJuaW5nXCI+XG4gICAgICAgICAgICB7Zm9ybWF0RW50cnkodS5lbnRyeSl9IMK3IHt1LndoeX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICkpfVxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgLy8gXCJMaXN0ZW5pbmcgZm9yXCIgbm90IFwiYWN0aXZlXCIg4oCUIGF0IHRoaXMgcG9pbnQgd2Ugb25seSBrbm93IHRoZSBhbGxvd2xpc3RcbiAgLy8gd2FzIHNldC4gU2VydmVyIGNvbm5lY3Rpb24sIGNhcGFiaWxpdHkgZGVjbGFyYXRpb24sIGFuZCB3aGV0aGVyIHRoZSBuYW1lXG4gIC8vIGV2ZW4gbWF0Y2hlcyBhIGNvbmZpZ3VyZWQgTUNQIHNlcnZlciBhcmUgYWxsIHN0aWxsIHVua25vd24uXG4gIHJldHVybiAoXG4gICAgPEJveCBwYWRkaW5nTGVmdD17Mn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPkxpc3RlbmluZyBmb3IgY2hhbm5lbCBtZXNzYWdlcyBmcm9tOiB7bGlzdH08L1RleHQ+XG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgRXhwZXJpbWVudGFsIMK3IGluYm91bmQgbWVzc2FnZXMgd2lsbCBiZSBwdXNoZWQgaW50byB0aGlzIHNlc3Npb24sIHRoaXNcbiAgICAgICAgY2FycmllcyBwcm9tcHQgaW5qZWN0aW9uIHJpc2tzLiBSZXN0YXJ0IENsYXVkZSBDb2RlIHdpdGhvdXQge2ZsYWd9IHRvXG4gICAgICAgIGRpc2FibGUuXG4gICAgICA8L1RleHQ+XG4gICAgICB7dW5tYXRjaGVkLm1hcCh1ID0+IChcbiAgICAgICAgPFRleHQga2V5PXtgJHtmb3JtYXRFbnRyeSh1LmVudHJ5KX06JHt1LndoeX1gfSBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICB7Zm9ybWF0RW50cnkodS5lbnRyeSl9IMK3IHt1LndoeX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKSl9XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZnVuY3Rpb24gZm9ybWF0RW50cnkoYzogQ2hhbm5lbEVudHJ5KTogc3RyaW5nIHtcbiAgcmV0dXJuIGMua2luZCA9PT0gJ3BsdWdpbidcbiAgICA/IGBwbHVnaW46JHtjLm5hbWV9QCR7Yy5tYXJrZXRwbGFjZX1gXG4gICAgOiBgc2VydmVyOiR7Yy5uYW1lfWBcbn1cblxudHlwZSBVbm1hdGNoZWQgPSB7IGVudHJ5OiBDaGFubmVsRW50cnk7IHdoeTogc3RyaW5nIH1cblxuZnVuY3Rpb24gZmluZFVubWF0Y2hlZChcbiAgZW50cmllczogcmVhZG9ubHkgQ2hhbm5lbEVudHJ5W10sXG4gIGFsbG93bGlzdDogUmV0dXJuVHlwZTx0eXBlb2YgZ2V0RWZmZWN0aXZlQ2hhbm5lbEFsbG93bGlzdD4sXG4pOiBVbm1hdGNoZWRbXSB7XG4gIC8vIFNlcnZlci1raW5kOiBidWlsZCBvbmUgU2V0IGZyb20gYWxsIHNjb3BlcyB1cCBmcm9udC4gZ2V0TWNwQ29uZmlnc0J5U2NvcGVcbiAgLy8gaXMgbm90IGNhY2hlZCAocHJvamVjdCBzY29wZSB3YWxrcyB0aGUgZGlyIHRyZWUpOyBnZXRNY3BDb25maWdCeU5hbWUgd291bGRcbiAgLy8gcmVkbyB0aGF0IHdhbGsgcGVyIGVudHJ5LlxuICBjb25zdCBzY29wZXMgPSBbJ2VudGVycHJpc2UnLCAndXNlcicsICdwcm9qZWN0JywgJ2xvY2FsJ10gYXMgY29uc3RcbiAgY29uc3QgY29uZmlndXJlZCA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gIGZvciAoY29uc3Qgc2NvcGUgb2Ygc2NvcGVzKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKGdldE1jcENvbmZpZ3NCeVNjb3BlKHNjb3BlKS5zZXJ2ZXJzKSkge1xuICAgICAgY29uZmlndXJlZC5hZGQobmFtZSlcbiAgICB9XG4gIH1cblxuICAvLyBQbHVnaW4ta2luZCBpbnN0YWxsZWQgY2hlY2s6IGluc3RhbGxlZF9wbHVnaW5zLmpzb24ga2V5cyBhcmVcbiAgLy8gYG5hbWVAbWFya2V0cGxhY2VgLiBsb2FkSW5zdGFsbGVkUGx1Z2luc1YyIGlzIGNhY2hlZC5cbiAgY29uc3QgaW5zdGFsbGVkUGx1Z2luSWRzID0gbmV3IFNldChcbiAgICBPYmplY3Qua2V5cyhsb2FkSW5zdGFsbGVkUGx1Z2luc1YyKCkucGx1Z2lucyksXG4gIClcblxuICAvLyBQbHVnaW4ta2luZCBhbGxvd2xpc3QgY2hlY2s6IHNhbWUge21hcmtldHBsYWNlLCBwbHVnaW59IHRlc3QgYXMgdGhlXG4gIC8vIGdhdGUgYXQgY2hhbm5lbE5vdGlmaWNhdGlvbi50cy4gZW50cnkuZGV2IGJ5cGFzc2VzIChkZXYgZmxhZyBvcHRzIG91dFxuICAvLyBvZiB0aGUgYWxsb3dsaXN0KS4gT3JnIGxpc3QgcmVwbGFjZXMgbGVkZ2VyIHdoZW4gc2V0ICh0ZWFtL2VudGVycHJpc2UpLlxuICAvLyBHcm93dGhCb29rIF9DQUNIRURfTUFZX0JFX1NUQUxFIOKAlCBjb2xkIGNhY2hlIHlpZWxkcyBbXSBzbyBldmVyeSBwbHVnaW5cbiAgLy8gZW50cnkgd2FybnM7IHNhbWUgdHJhZGVvZmYgdGhlIGdhdGUgYWxyZWFkeSBhY2NlcHRzLlxuICBjb25zdCB7IGVudHJpZXM6IGFsbG93ZWQsIHNvdXJjZSB9ID0gYWxsb3dsaXN0XG5cbiAgLy8gSW5kZXBlbmRlbnQgaWZzIOKAlCBhIHBsdWdpbiBlbnRyeSB0aGF0J3MgYm90aCB1bmluc3RhbGxlZCBBTkRcbiAgLy8gdW5saXN0ZWQgc2hvd3MgdHdvIGxpbmVzLiBTZXJ2ZXIga2luZCBjaGVja3MgY29uZmlnICsgZGV2IGZsYWcuXG4gIGNvbnN0IG91dDogVW5tYXRjaGVkW10gPSBbXVxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICBpZiAoZW50cnkua2luZCA9PT0gJ3NlcnZlcicpIHtcbiAgICAgIGlmICghY29uZmlndXJlZC5oYXMoZW50cnkubmFtZSkpIHtcbiAgICAgICAgb3V0LnB1c2goeyBlbnRyeSwgd2h5OiAnbm8gTUNQIHNlcnZlciBjb25maWd1cmVkIHdpdGggdGhhdCBuYW1lJyB9KVxuICAgICAgfVxuICAgICAgaWYgKCFlbnRyeS5kZXYpIHtcbiAgICAgICAgb3V0LnB1c2goe1xuICAgICAgICAgIGVudHJ5LFxuICAgICAgICAgIHdoeTogJ3NlcnZlcjogZW50cmllcyBuZWVkIC0tZGFuZ2Vyb3VzbHktbG9hZC1kZXZlbG9wbWVudC1jaGFubmVscycsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBjb250aW51ZVxuICAgIH1cbiAgICBpZiAoIWluc3RhbGxlZFBsdWdpbklkcy5oYXMoYCR7ZW50cnkubmFtZX1AJHtlbnRyeS5tYXJrZXRwbGFjZX1gKSkge1xuICAgICAgb3V0LnB1c2goeyBlbnRyeSwgd2h5OiAncGx1Z2luIG5vdCBpbnN0YWxsZWQnIH0pXG4gICAgfVxuICAgIGlmIChcbiAgICAgICFlbnRyeS5kZXYgJiZcbiAgICAgICFhbGxvd2VkLnNvbWUoXG4gICAgICAgIGUgPT4gZS5wbHVnaW4gPT09IGVudHJ5Lm5hbWUgJiYgZS5tYXJrZXRwbGFjZSA9PT0gZW50cnkubWFya2V0cGxhY2UsXG4gICAgICApXG4gICAgKSB7XG4gICAgICBvdXQucHVzaCh7XG4gICAgICAgIGVudHJ5LFxuICAgICAgICB3aHk6XG4gICAgICAgICAgc291cmNlID09PSAnb3JnJ1xuICAgICAgICAgICAgPyBcIm5vdCBvbiB5b3VyIG9yZydzIGFwcHJvdmVkIGNoYW5uZWxzIGxpc3RcIlxuICAgICAgICAgICAgOiAnbm90IG9uIHRoZSBhcHByb3ZlZCBjaGFubmVscyBhbGxvd2xpc3QnLFxuICAgICAgfSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dFxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFFBQVEsUUFBUSxPQUFPO0FBQ2hDLFNBQ0UsS0FBS0MsWUFBWSxFQUNqQkMsa0JBQWtCLEVBQ2xCQyxpQkFBaUIsUUFDWiwwQkFBMEI7QUFDakMsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxpQkFBaUIsUUFBUSx3Q0FBd0M7QUFDMUUsU0FBU0MsNEJBQTRCLFFBQVEsMkNBQTJDO0FBQ3hGLFNBQVNDLG9CQUFvQixRQUFRLDhCQUE4QjtBQUNuRSxTQUNFQyxzQkFBc0IsRUFDdEJDLG1CQUFtQixRQUNkLHFCQUFxQjtBQUM1QixTQUFTQyxzQkFBc0IsUUFBUSxnREFBZ0Q7QUFDdkYsU0FBU0Msb0JBQW9CLFFBQVEsa0NBQWtDO0FBRXZFLE9BQU8sU0FBQUMsZUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQU9MLE9BQUFDLEVBQUEsSUFDRWhCLFFBQVEsQ0FBQ2lCLEtBMkJSLENBQUM7RUE1Qkc7SUFBQUMsUUFBQTtJQUFBQyxRQUFBO0lBQUFDLE1BQUE7SUFBQUMsYUFBQTtJQUFBQyxJQUFBO0lBQUFDO0VBQUEsSUFBQVAsRUFBOEQ7RUE2QnJFLElBQUlFLFFBQVEsQ0FBQU0sTUFBTyxLQUFLLENBQUM7SUFBQSxPQUFTLElBQUk7RUFBQTtFQUl0QyxN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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Suspense、use，将 react 中已经封装好的能力接到本文件流程里。
import { Suspense, use } from 'react';
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js';
// 类型依赖 { LocalJSXCommandContext } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { LocalJSXCommandContext } from '../../commands.js';
// 引入 useIsInsideModal，将 ../../context/modalContext.js 中已经封装好的能力接到本文件流程里。
import { useIsInsideModal } from '../../context/modalContext.js';
// 引入 Box、Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTheme } from '../../ink.js';
// 引入 AppState、useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { type AppState, useAppState } from '../../state/AppState.js';
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js';
// 复用 getCurrentSessionTitle 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { getCurrentSessionTitle } from '../../utils/sessionStorage.js';
// 复用 buildAccountProperties、buildAPIProviderProperties、buildIDEProperties、buildInstallationDiagnostics、buildInstallationHealthDiagnostics、buildMcpProperties、buildMemoryDiagnostics、buildSandboxProperties、buildSettingSourcesProperties、Diagnostic、getModelDisplayLabel、Property 工具函数，把通用处理留在 ../../utils/status.js 中维护。
import { buildAccountProperties, buildAPIProviderProperties, buildIDEProperties, buildInstallationDiagnostics, buildInstallationHealthDiagnostics, buildMcpProperties, buildMemoryDiagnostics, buildSandboxProperties, buildSettingSourcesProperties, type Diagnostic, getModelDisplayLabel, type Property } from '../../utils/status.js';
// 类型依赖 { ThemeName } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { ThemeName } from '../../utils/theme.js';
// 引入 ConfigurableShortcutHint，将 ../ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  context: LocalJSXCommandContext;
  diagnosticsPromise: Promise<Diagnostic[]>;
};
// buildPrimarySection 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildPrimarySection(): Property[] {
  // sessionId 会话数据读取`getSessionId`，供终端渲染后续处理使用。
  const sessionId = getSessionId();
  // customTitle 标题读取`getCurrentSessionTitle`，供终端渲染后续处理使用。
  const customTitle = getCurrentSessionTitle(sessionId);
  // nameValue保存`customTitle ?? <Text dimColor>/rename to add a name</Text>`，供终端 UI Status后续判断或输出使用。
  const nameValue = customTitle ?? <Text dimColor>/rename to add a name</Text>;
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [{
    label: 'Version',
    value: MACRO.VERSION
  }, {
    label: 'Session name',
    value: nameValue
  }, {
    label: 'Session ID',
    value: sessionId
  }, {
    label: 'cwd',
    value: getCwd()
  }, ...buildAccountProperties(), ...buildAPIProviderProperties()];
}
// buildSecondarySection 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildSecondarySection({
  mainLoopModel,
  mcp,
  theme,
  context
}: {
  mainLoopModel: AppState['mainLoopModel'];
  mcp: AppState['mcp'];
  theme: ThemeName;
  context: LocalJSXCommandContext;
}): Property[] {
  // modelLabel读取`getModelDisplayLabel`，供终端渲染后续处理使用。
  const modelLabel = getModelDisplayLabel(mainLoopModel);
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [{
    label: 'Model',
    value: modelLabel
  }, ...buildIDEProperties(mcp.clients, context.options.ideInstallationStatus, theme), ...buildMcpProperties(mcp.clients, theme), ...buildSandboxProperties(), ...buildSettingSourcesProperties()];
}
// buildDiagnostics 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function buildDiagnostics(): Promise<Diagnostic[]> {
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [...(await buildInstallationDiagnostics()), ...(await buildInstallationHealthDiagnostics()), ...(await buildMemoryDiagnostics())];
}
// PropertyValue 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function PropertyValue(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    value
  } = t0;
  // 满足 `Array.isArray(value)` 时，终端渲染执行该分支。
  if (Array.isArray(value)) {
    // t1 暂存 `value.map(t2)` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== value) {
      // t2 暂存 `(item, i) => <Text key={i}>{item}{i < value.length - 1 ? ...` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[2] !== value.length) {
        // t2 暂存 `(item, i) => <Text key={i}>{item}{i < value.length - 1 ? ...` 生成的渲染片段，后续返回路径直接复用。
        t2 = (item, i) => <Text key={i}>{item}{i < value.length - 1 ? "," : ""}</Text>;
        // $[2] 缓存 `value.length`，下次依赖未变时 React 编译产物可直接复用。
        $[2] = value.length;
        // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[3] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[3];
      }
      // t1 暂存 `value.map(t2)` 生成的渲染片段，后续返回路径直接复用。
      t1 = value.map(t2);
      // $[0] 缓存 `value`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = value;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[1];
    }
    // t2 暂存 `<Box flexWrap="wrap" columnGap={1} flexShrink={99}>{t1}</...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== t1) {
      // t2 暂存 `<Box flexWrap="wrap" columnGap={1} flexShrink={99}>{t1}</...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Box flexWrap="wrap" columnGap={1} flexShrink={99}>{t1}</Box>;
      // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t1;
      // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[5];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 当 `typeof value` 匹配 `"string"` 时，终端渲染执行对应分支。
  if (typeof value === "string") {
    // t1 暂存 `<Text>{value}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[6] !== value) {
      // t1 暂存 `<Text>{value}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text>{value}</Text>;
      // $[6] 缓存 `value`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = value;
      // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[7];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 返回 `value`，作为终端渲染这次计算的结果。
  return value;
}
// Status 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Status(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(20);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    context,
    diagnosticsPromise
  } = t0;
  // mainLoopModel保存`useAppState`，供终端渲染后续处理使用。
  const mainLoopModel = useAppState(_temp);
  // mcp保存`useAppState`，供终端渲染后续处理使用。
  const mcp = useAppState(_temp2);
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 Status分别处理这些返回值。
  const [theme] = useTheme();
  // t1 暂存 `buildPrimarySection()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `buildPrimarySection()` 生成的渲染片段，后续返回路径直接复用。
    t1 = buildPrimarySection();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `buildSecondarySection({` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== context || $[2] !== mainLoopModel || $[3] !== mcp || $[4] !== theme) {
    // t2 暂存 `buildSecondarySection({` 生成的渲染片段，后续返回路径直接复用。
    t2 = buildSecondarySection({
      mainLoopModel,
      mcp,
      theme,
      context
    });
    // $[1] 缓存 `context`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = context;
    // $[2] 缓存 `mainLoopModel`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = mainLoopModel;
    // $[3] 缓存 `mcp`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = mcp;
    // $[4] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = theme;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // t3 暂存 `[t1, t2]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t2) {
    // t3 暂存 `[t1, t2]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [t1, t2];
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // sections 集合 命名 `t3`，让后续代码直接表达这个值的用途。
  const sections = t3;
  // grow保存`useIsInsideModal`，供终端渲染后续处理使用。
  const grow = useIsInsideModal() ? 1 : undefined;
  // t4 暂存 `sections.map(_temp4)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== sections) {
    // t4 暂存 `sections.map(_temp4)` 生成的渲染片段，后续返回路径直接复用。
    t4 = sections.map(_temp4);
    // $[8] 缓存 `sections`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = sections;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `<Suspense fallback={null}><Diagnostics promise={diagnosti...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== diagnosticsPromise) {
    // t5 暂存 `<Suspense fallback={null}><Diagnostics promise={diagnosti...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Suspense fallback={null}><Diagnostics promise={diagnosticsPromise} /></Suspense>;
    // $[10] 缓存 `diagnosticsPromise`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = diagnosticsPromise;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // t6 暂存 `<Box flexDirection="column" gap={1} flexGrow={grow}>{t4}{...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== grow || $[13] !== t4 || $[14] !== t5) {
    // t6 暂存 `<Box flexDirection="column" gap={1} flexGrow={grow}>{t4}{...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" gap={1} flexGrow={grow}>{t4}{t5}</Box>;
    // $[12] 缓存 `grow`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = grow;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[15];
  }
  // t7 暂存 `<Text dimColor={true}><ConfigurableShortcutHint action="c...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Text dimColor={true}><ConfigurableShortcutHint action="c...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text dimColor={true}><ConfigurableShortcutHint action="confirm:no" context="Settings" fallback="Esc" description="cancel" /></Text>;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // t8 暂存 `<Box flexDirection="column" flexGrow={grow}>{t6}{t7}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== grow || $[18] !== t6) {
    // t8 暂存 `<Box flexDirection="column" flexGrow={grow}>{t6}{t7}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" flexGrow={grow}>{t6}{t7}</Box>;
    // $[17] 缓存 `grow`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = grow;
    // $[18] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t6;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[19];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(properties, i) {
  // 返回 `properties.length > 0 && <Box key={i} flexDirection="column">{propertie...`，作为终端渲染这次计算的结果。
  return properties.length > 0 && <Box key={i} flexDirection="column">{properties.map(_temp3)}</Box>;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(t0, j) {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    label,
    value
  } = t0;
  // 返回 `<Box key={j} flexDirection="row" gap={1} flexShrink={0}>{label !== unde...`，作为终端渲染这次计算的结果。
  return <Box key={j} flexDirection="row" gap={1} flexShrink={0}>{label !== undefined && <Text bold={true}>{label}:</Text>}<PropertyValue value={value} /></Box>;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回 `s_0.mcp`，作为终端渲染这次计算的结果。
  return s_0.mcp;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.mainLoopModel`，作为终端渲染这次计算的结果。
  return s.mainLoopModel;
}
// Diagnostics 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function Diagnostics(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    promise
  } = t0;
  // diagnostics 集合保存`use`，供终端渲染后续处理使用。
  const diagnostics = use(promise);
  // diagnostics 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (diagnostics.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `<Text bold={true}>System Diagnostics</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text bold={true}>System Diagnostics</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text bold={true}>System Diagnostics</Text>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `diagnostics.map(_temp5)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== diagnostics) {
    // t2 暂存 `diagnostics.map(_temp5)` 生成的渲染片段，后续返回路径直接复用。
    t2 = diagnostics.map(_temp5);
    // $[1] 缓存 `diagnostics`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = diagnostics;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `<Box flexDirection="column" paddingBottom={1}>{t1}{t2}</B...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== t2) {
    // t3 暂存 `<Box flexDirection="column" paddingBottom={1}>{t1}{t2}</B...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column" paddingBottom={1}>{t1}{t2}</Box>;
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
// _temp5 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(diagnostic, i) {
  // 返回 `<Box key={i} flexDirection="row" gap={1} paddingX={1}><Text color="erro...`，作为终端渲染这次计算的结果。
  return <Box key={i} flexDirection="row" gap={1} paddingX={1}><Text color="error">{figures.warning}</Text>{typeof diagnostic === "string" ? <Text wrap="wrap">{diagnostic}</Text> : diagnostic}</Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJTdXNwZW5zZSIsInVzZSIsImdldFNlc3Npb25JZCIsIkxvY2FsSlNYQ29tbWFuZENvbnRleHQiLCJ1c2VJc0luc2lkZU1vZGFsIiwiQm94IiwiVGV4dCIsInVzZVRoZW1lIiwiQXBwU3RhdGUiLCJ1c2VBcHBTdGF0ZSIsImdldEN3ZCIsImdldEN1cnJlbnRTZXNzaW9uVGl0bGUiLCJidWlsZEFjY291bnRQcm9wZXJ0aWVzIiwiYnVpbGRBUElQcm92aWRlclByb3BlcnRpZXMiLCJidWlsZElERVByb3BlcnRpZXMiLCJidWlsZEluc3RhbGxhdGlvbkRpYWdub3N0aWNzIiwiYnVpbGRJbnN0YWxsYXRpb25IZWFsdGhEaWFnbm9zdGljcyIsImJ1aWxkTWNwUHJvcGVydGllcyIsImJ1aWxkTWVtb3J5RGlhZ25vc3RpY3MiLCJidWlsZFNhbmRib3hQcm9wZXJ0aWVzIiwiYnVpbGRTZXR0aW5nU291cmNlc1Byb3BlcnRpZXMiLCJEaWFnbm9zdGljIiwiZ2V0TW9kZWxEaXNwbGF5TGFiZWwiLCJQcm9wZXJ0eSIsIlRoZW1lTmFtZSIsIkNvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCIsIlByb3BzIiwiY29udGV4dCIsImRpYWdub3N0aWNzUHJvbWlzZSIsIlByb21pc2UiLCJidWlsZFByaW1hcnlTZWN0aW9uIiwic2Vzc2lvbklkIiwiY3VzdG9tVGl0bGUiLCJuYW1lVmFsdWUiLCJsYWJlbCIsInZhbHVlIiwiTUFDUk8iLCJWRVJTSU9OIiwiYnVpbGRTZWNvbmRhcnlTZWN0aW9uIiwibWFpbkxvb3BNb2RlbCIsIm1jcCIsInRoZW1lIiwibW9kZWxMYWJlbCIsImNsaWVudHMiLCJvcHRpb25zIiwiaWRlSW5zdGFsbGF0aW9uU3RhdHVzIiwiYnVpbGREaWFnbm9zdGljcyIsIlByb3BlcnR5VmFsdWUiLCJ0MCIsIiQiLCJfYyIsIkFycmF5IiwiaXNBcnJheSIsInQxIiwidDIiLCJsZW5ndGgiLCJpdGVtIiwiaSIsIm1hcCIsIlN0YXR1cyIsIl90ZW1wIiwiX3RlbXAyIiwiU3ltYm9sIiwiZm9yIiwidDMiLCJzZWN0aW9ucyIsImdyb3ciLCJ1bmRlZmluZWQiLCJ0NCIsIl90ZW1wNCIsInQ1IiwidDYiLCJ0NyIsInQ4IiwicHJvcGVydGllcyIsIl90ZW1wMyIsImoiLCJzXzAiLCJzIiwiRGlhZ25vc3RpY3MiLCJwcm9taXNlIiwiZGlhZ25vc3RpY3MiLCJfdGVtcDUiLCJkaWFnbm9zdGljIiwid2FybmluZyJdLCJzb3VyY2VzIjpbIlN0YXR1cy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgU3VzcGVuc2UsIHVzZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgZ2V0U2Vzc2lvbklkIH0gZnJvbSAnLi4vLi4vYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29tbWFuZHMuanMnXG5pbXBvcnQgeyB1c2VJc0luc2lkZU1vZGFsIH0gZnJvbSAnLi4vLi4vY29udGV4dC9tb2RhbENvbnRleHQuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQsIHVzZVRoZW1lIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdHlwZSBBcHBTdGF0ZSwgdXNlQXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IGdldEN3ZCB9IGZyb20gJy4uLy4uL3V0aWxzL2N3ZC5qcydcbmltcG9ydCB7IGdldEN1cnJlbnRTZXNzaW9uVGl0bGUgfSBmcm9tICcuLi8uLi91dGlscy9zZXNzaW9uU3RvcmFnZS5qcydcbmltcG9ydCB7XG4gIGJ1aWxkQWNjb3VudFByb3BlcnRpZXMsXG4gIGJ1aWxkQVBJUHJvdmlkZXJQcm9wZXJ0aWVzLFxuICBidWlsZElERVByb3BlcnRpZXMsXG4gIGJ1aWxkSW5zdGFsbGF0aW9uRGlhZ25vc3RpY3MsXG4gIGJ1aWxkSW5zdGFsbGF0aW9uSGVhbHRoRGlhZ25vc3RpY3MsXG4gIGJ1aWxkTWNwUHJvcGVydGllcyxcbiAgYnVpbGRNZW1vcnlEaWFnbm9zdGljcyxcbiAgYnVpbGRTYW5kYm94UHJvcGVydGllcyxcbiAgYnVpbGRTZXR0aW5nU291cmNlc1Byb3BlcnRpZXMsXG4gIHR5cGUgRGlhZ25vc3RpYyxcbiAgZ2V0TW9kZWxEaXNwbGF5TGFiZWwsXG4gIHR5cGUgUHJvcGVydHksXG59IGZyb20gJy4uLy4uL3V0aWxzL3N0YXR1cy5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWVOYW1lIH0gZnJvbSAnLi4vLi4vdXRpbHMvdGhlbWUuanMnXG5pbXBvcnQgeyBDb25maWd1cmFibGVTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi9Db25maWd1cmFibGVTaG9ydGN1dEhpbnQuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGNvbnRleHQ6IExvY2FsSlNYQ29tbWFuZENvbnRleHRcbiAgZGlhZ25vc3RpY3NQcm9taXNlOiBQcm9taXNlPERpYWdub3N0aWNbXT5cbn1cblxuZnVuY3Rpb24gYnVpbGRQcmltYXJ5U2VjdGlvbigpOiBQcm9wZXJ0eVtdIHtcbiAgY29uc3Qgc2Vzc2lvbklkID0gZ2V0U2Vzc2lvbklkKClcbiAgY29uc3QgY3VzdG9tVGl0bGUgPSBnZXRDdXJyZW50U2Vzc2lvblRpdGxlKHNlc3Npb25JZClcbiAgY29uc3QgbmFtZVZhbHVlID0gY3VzdG9tVGl0bGUgPz8gPFRleHQgZGltQ29sb3I+L3JlbmFtZSB0byBhZGQgYSBuYW1lPC9UZXh0PlxuXG4gIHJldHVybiBbXG4gICAgeyBsYWJlbDogJ1ZlcnNpb24nLCB2YWx1ZTogTUFDUk8uVkVSU0lPTiB9LFxuICAgIHsgbGFiZWw6ICdTZXNzaW9uIG5hbWUnLCB2YWx1ZTogbmFtZVZhbHVlIH0sXG4gICAgeyBsYWJlbDogJ1Nlc3Npb24gSUQnLCB2YWx1ZTogc2Vzc2lvbklkIH0sXG4gICAgeyBsYWJlbDogJ2N3ZCcsIHZhbHVlOiBnZXRDd2QoKSB9LFxuICAgIC4uLmJ1aWxkQWNjb3VudFByb3BlcnRpZXMoKSxcbiAgICAuLi5idWlsZEFQSVByb3ZpZGVyUHJvcGVydGllcygpLFxuICBdXG59XG5cbmZ1bmN0aW9uIGJ1aWxkU2Vjb25kYXJ5U2VjdGlvbih7XG4gIG1haW5Mb29wTW9kZWwsXG4gIG1jcCxcbiAgdGhlbWUsXG4gIGNvbnRleHQsXG59OiB7XG4gIG1haW5Mb29wTW9kZWw6IEFwcFN0YXRlWydtYWluTG9vcE1vZGVsJ11cbiAgbWNwOiBBcHBTdGF0ZVsnbWNwJ11cbiAgdGhlbWU6IFRoZW1lTmFtZVxuICBjb250ZXh0OiBMb2NhbEpTWENvbW1hbmRDb250ZXh0XG59KTogUHJvcGVydHlbXSB7XG4gIGNvbnN0IG1vZGVsTGFiZWwgPSBnZXRNb2RlbERpc3BsYXlMYWJlbChtYWluTG9vcE1vZGVsKVxuXG4gIHJldHVybiBbXG4gICAgeyBsYWJlbDogJ01vZGVsJywgdmFsdWU6IG1vZGVsTGFiZWwgfSxcbiAgICAuLi5idWlsZElERVByb3BlcnRpZXMoXG4gICAgICBtY3AuY2xpZW50cyxcbiAgICAgIGNvbnRleHQub3B0aW9ucy5pZGVJbnN0YWxsYXRpb25TdGF0dXMsXG4gICAgICB0aGVtZSxcbiAgICApLFxuICAgIC4uLmJ1aWxkTWNwUHJvcGVydGllcyhtY3AuY2xpZW50cywgdGhlbWUpLFxuICAgIC4uLmJ1aWxkU2FuZGJveFByb3BlcnRpZXMoKSxcbiAgICAuLi5idWlsZFNldHRpbmdTb3VyY2VzUHJvcGVydGllcygpLFxuICBdXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZERpYWdub3N0aWNzKCk6IFByb21pc2U8RGlhZ25vc3RpY1tdPiB7XG4gIHJldHVybiBbXG4gICAgLi4uKGF3YWl0IGJ1aWxkSW5zdGFsbGF0aW9uRGlhZ25vc3RpY3MoKSksXG4gICAgLi4uKGF3YWl0IGJ1aWxkSW5zdGFsbGF0aW9uSGVhbHRoRGlhZ25vc3RpY3MoKSksXG4gICAgLi4uKGF3YWl0IGJ1aWxkTWVtb3J5RGlhZ25vc3RpY3MoKSksXG4gIF1cbn1cblxuZnVuY3Rpb24gUHJvcGVydHlWYWx1ZSh7XG4gIHZhbHVlLFxufToge1xuICB2YWx1ZTogUHJvcGVydHlbJ3ZhbHVlJ11cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4V3JhcD1cIndyYXBcIiBjb2x1bW5HYXA9ezF9IGZsZXhTaHJpbms9ezk5fT5cbiAgICAgICAge3ZhbHVlLm1hcCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8VGV4dCBrZXk9e2l9PlxuICAgICAgICAgICAgICB7aXRlbX1cbiAgICAgICAgICAgICAge2kgPCB2YWx1ZS5sZW5ndGggLSAxID8gJywnIDogJyd9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgKVxuICAgICAgICB9KX1cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIDxUZXh0Pnt2YWx1ZX08L1RleHQ+XG4gIH1cblxuICByZXR1cm4gdmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFN0YXR1cyh7XG4gIGNvbnRleHQsXG4gIGRpYWdub3N0aWNzUHJvbWlzZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgbWFpbkxvb3BNb2RlbCA9IHVzZUFwcFN0YXRlKHMgPT4gcy5tYWluTG9vcE1vZGVsKVxuICBjb25zdCBtY3AgPSB1c2VBcHBTdGF0ZShzID0+IHMubWNwKVxuICBjb25zdCBbdGhlbWVdID0gdXNlVGhlbWUoKVxuXG4gIC8vIFNlY3Rpb25zIGFyZSBzeW5jaHJvbm91cyDigJQgY29tcHV0ZSBpbiByZW5kZXIgc28gdGhleSdyZSBuZXZlciBlbXB0eS5cbiAgLy8gZGlhZ25vc3RpY3NQcm9taXNlIGlzIGNyZWF0ZWQgb25jZSBpbiBTZXR0aW5ncy50c3ggc28gaXQgcmVzb2x2ZXMgb25jZVxuICAvLyBwZXIgcGFuZSBpbnZvY2F0aW9uIGluc3RlYWQgb2YgcmUtZmV0Y2hpbmcgb24gZXZlcnkgdGFiIHN3aXRjaCAoVGFiXG4gIC8vIHVubW91bnRzIGNoaWxkcmVuIHdoZW4gbm90IHNlbGVjdGVkLCB3aGljaCB3YXMgY2F1c2luZyB0aGUgZmxhc2gpLlxuICBjb25zdCBzZWN0aW9ucyA9IFJlYWN0LnVzZU1lbW8oXG4gICAgKCkgPT4gW1xuICAgICAgYnVpbGRQcmltYXJ5U2VjdGlvbigpLFxuICAgICAgYnVpbGRTZWNvbmRhcnlTZWN0aW9uKHsgbWFpbkxvb3BNb2RlbCwgbWNwLCB0aGVtZSwgY29udGV4dCB9KSxcbiAgICBdLFxuICAgIFttYWluTG9vcE1vZGVsLCBtY3AsIHRoZW1lLCBjb250ZXh0XSxcbiAgKVxuXG4gIC8vIGZsZXhHcm93IHNvIHRoZSBcIkVzYyB0byBjYW5jZWxcIiBmb290ZXIgcGlucyB0byB0aGUgYm90dG9tIG9mIHRoZVxuICAvLyBNb2RhbCdzIGlubmVyIFNjcm9sbEJveCB3aGVuIGNvbnRlbnQgaXMgc2hvcnQuIFRoZSBTY3JvbGxCb3ggY29udGVudFxuICAvLyB3cmFwcGVyIGhhcyBmbGV4R3JvdzoxIChmaWxscyBhdCBsZWFzdCB0aGUgdmlld3BvcnQpLCBzbyB0aGlzIHN0cmV0Y2hlc1xuICAvLyB0byBtYXRjaC4gV2l0aG91dCBpdCwgc2hvcnQgU3RhdHVzIGNvbnRlbnQgZmxvYXRzIGF0IHRoZSB0b3AgYW5kIHRoZVxuICAvLyBmb290ZXIgc2l0cyBtaWQtbW9kYWwgd2l0aCAyLTMgdHJhaWxpbmcgYmxhbmsgcm93cyBiZWxvdy4gT3V0c2lkZSBhXG4gIC8vIE1vZGFsIChub24tZnVsbHNjcmVlbiksIGxlYXZlIGxheW91dCBhbG9uZSDigJQgbm8gU2Nyb2xsQm94IHRvIGZpbGwuXG4gIGNvbnN0IGdyb3cgPSB1c2VJc0luc2lkZU1vZGFsKCkgPyAxIDogdW5kZWZpbmVkXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBmbGV4R3Jvdz17Z3Jvd30+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9IGZsZXhHcm93PXtncm93fT5cbiAgICAgICAge3NlY3Rpb25zLm1hcChcbiAgICAgICAgICAocHJvcGVydGllcywgaSkgPT5cbiAgICAgICAgICAgIHByb3BlcnRpZXMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxCb3gga2V5PXtpfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICAgICAge3Byb3BlcnRpZXMubWFwKCh7IGxhYmVsLCB2YWx1ZSB9LCBqKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8Qm94IGtleT17an0gZmxleERpcmVjdGlvbj1cInJvd1wiIGdhcD17MX0gZmxleFNocmluaz17MH0+XG4gICAgICAgICAgICAgICAgICAgIHtsYWJlbCAhPT0gdW5kZWZpbmVkICYmIDxUZXh0IGJvbGQ+e2xhYmVsfTo8L1RleHQ+fVxuICAgICAgICAgICAgICAgICAgICA8UHJvcGVydHlWYWx1ZSB2YWx1ZT17dmFsdWV9IC8+XG4gICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICApLFxuICAgICAgICApfVxuXG4gICAgICAgIDxTdXNwZW5zZSBmYWxsYmFjaz17bnVsbH0+XG4gICAgICAgICAgPERpYWdub3N0aWNzIHByb21pc2U9e2RpYWdub3N0aWNzUHJvbWlzZX0gLz5cbiAgICAgICAgPC9TdXNwZW5zZT5cbiAgICAgIDwvQm94PlxuICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICBjb250ZXh0PVwiU2V0dGluZ3NcIlxuICAgICAgICAgIGZhbGxiYWNrPVwiRXNjXCJcbiAgICAgICAgICBkZXNjcmlwdGlvbj1cImNhbmNlbFwiXG4gICAgICAgIC8+XG4gICAgICA8L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZnVuY3Rpb24gRGlhZ25vc3RpY3Moe1xuICBwcm9taXNlLFxufToge1xuICBwcm9taXNlOiBQcm9taXNlPERpYWdub3N0aWNbXT5cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBkaWFnbm9zdGljcyA9IHVzZShwcm9taXNlKVxuICBpZiAoZGlhZ25vc3RpY3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbFxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdCb3R0b209ezF9PlxuICAgICAgPFRleHQgYm9sZD5TeXN0ZW0gRGlhZ25vc3RpY3M8L1RleHQ+XG4gICAgICB7ZGlhZ25vc3RpY3MubWFwKChkaWFnbm9zdGljLCBpKSA9PiAoXG4gICAgICAgIDxCb3gga2V5PXtpfSBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsxfSBwYWRkaW5nWD17MX0+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPntmaWd1cmVzLndhcm5pbmd9PC9UZXh0PlxuICAgICAgICAgIHt0eXBlb2YgZGlhZ25vc3RpYyA9PT0gJ3N0cmluZycgPyAoXG4gICAgICAgICAgICA8VGV4dCB3cmFwPVwid3JhcFwiPntkaWFnbm9zdGljfTwvVGV4dD5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgZGlhZ25vc3RpY1xuICAgICAgICAgICl9XG4gICAgICAgIDwvQm94PlxuICAgICAgKSl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsUUFBUSxFQUFFQyxHQUFHLFFBQVEsT0FBTztBQUNyQyxTQUFTQyxZQUFZLFFBQVEsMEJBQTBCO0FBQ3ZELGNBQWNDLHNCQUFzQixRQUFRLG1CQUFtQjtBQUMv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
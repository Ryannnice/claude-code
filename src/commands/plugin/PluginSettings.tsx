// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useState } from 'react';
// 复用 ConfigurableShortcutHint 终端界面组件，避免在这里重复拼装显示逻辑。
import { ConfigurableShortcutHint } from '../../components/ConfigurableShortcutHint.js';
// 复用 Byline 终端界面组件，避免在这里重复拼装显示逻辑。
import { Byline } from '../../components/design-system/Byline.js';
// 复用 Pane 终端界面组件，避免在这里重复拼装显示逻辑。
import { Pane } from '../../components/design-system/Pane.js';
// 复用 Tab、Tabs 终端界面组件，避免在这里重复拼装显示逻辑。
import { Tab, Tabs } from '../../components/design-system/Tabs.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding、useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding, useKeybindings } from '../../keybindings/useKeybinding.js';
// 引入 useAppState、useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../../state/AppState.js';
// 类型依赖 { PluginError } 来自 ../../types/plugin.js，用于校准命令处理的数据契约。
import type { PluginError } from '../../types/plugin.js';
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js';
// 复用 clearAllCaches 工具函数，把通用处理留在 ../../utils/plugins/cacheUtils.js 中维护。
import { clearAllCaches } from '../../utils/plugins/cacheUtils.js';
// 复用 loadMarketplacesWithGracefulDegradation 工具函数，把通用处理留在 ../../utils/plugins/marketplaceHelpers.js 中维护。
import { loadMarketplacesWithGracefulDegradation } from '../../utils/plugins/marketplaceHelpers.js';
// 复用 loadKnownMarketplacesConfig、removeMarketplaceSource 工具函数，把通用处理留在 ../../utils/plugins/marketplaceManager.js 中维护。
import { loadKnownMarketplacesConfig, removeMarketplaceSource } from '../../utils/plugins/marketplaceManager.js';
// 复用 getPluginEditableScopes 工具函数，把通用处理留在 ../../utils/plugins/pluginStartupCheck.js 中维护。
import { getPluginEditableScopes } from '../../utils/plugins/pluginStartupCheck.js';
// 类型依赖 { EditableSettingSource } 来自 ../../utils/settings/constants.js，用于校准命令处理的数据契约。
import type { EditableSettingSource } from '../../utils/settings/constants.js';
// 复用 getSettingsForSource、updateSettingsForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettingsForSource, updateSettingsForSource } from '../../utils/settings/settings.js';
// 引入 AddMarketplace，将 ./AddMarketplace.js 中已经封装好的能力接到本文件流程里。
import { AddMarketplace } from './AddMarketplace.js';
// 引入 BrowseMarketplace，将 ./BrowseMarketplace.js 中已经封装好的能力接到本文件流程里。
import { BrowseMarketplace } from './BrowseMarketplace.js';
// 引入 DiscoverPlugins，将 ./DiscoverPlugins.js 中已经封装好的能力接到本文件流程里。
import { DiscoverPlugins } from './DiscoverPlugins.js';
// 引入 ManageMarketplaces，将 ./ManageMarketplaces.js 中已经封装好的能力接到本文件流程里。
import { ManageMarketplaces } from './ManageMarketplaces.js';
// 引入 ManagePlugins，将 ./ManagePlugins.js 中已经封装好的能力接到本文件流程里。
import { ManagePlugins } from './ManagePlugins.js';
// 引入 formatErrorMessage、getErrorGuidance，将 ./PluginErrors.js 中已经封装好的能力接到本文件流程里。
import { formatErrorMessage, getErrorGuidance } from './PluginErrors.js';
// 引入 ParsedCommand、parsePluginArgs，将 ./parseArgs.js 中已经封装好的能力接到本文件流程里。
import { type ParsedCommand, parsePluginArgs } from './parseArgs.js';
// 类型依赖 { PluginSettingsProps, ViewState } 来自 ./types.js，用于校准命令处理的数据契约。
import type { PluginSettingsProps, ViewState } from './types.js';
// 引入 ValidatePlugin，将 ./ValidatePlugin.js 中已经封装好的能力接到本文件流程里。
import { ValidatePlugin } from './ValidatePlugin.js';
// TabId 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type TabId = 'discover' | 'installed' | 'marketplaces' | 'errors';
// MarketplaceList 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function MarketplaceList(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onComplete
  } = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onComplete) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // loadList 集合读取`loadList`，供命令处理后续处理使用。
      const loadList = async function loadList() {
        // 插件命令界面 Plugin Settings在这里处理 ``，完成这一小步状态转换。
        ;
        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // 配置读取`loadKnownMarketplacesConfig`，供命令处理后续处理使用。
          const config = await loadKnownMarketplacesConfig();
          // names 集合派生`Object.keys`，供命令处理后续处理使用。
          const names = Object.keys(config);
          // names 集合为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
          if (names.length === 0) {
            // 调用 onComplete，触发命令处理此处需要的副作用。
            onComplete("No marketplaces configured");
          } else {
            // 调用 onComplete，触发命令处理此处需要的副作用。
            onComplete(`Configured marketplaces:\n${names.map(_temp).join("\n")}`);
          }
        } catch (t3) {
          // err保存`t3`，作为后续临时缓存值处理的输入。
          const err = t3;
          // 调用 onComplete，触发命令处理此处需要的副作用。
          onComplete(`Error loading marketplaces: ${errorMessage(err)}`);
        }
      };
      // 调用 loadList，触发命令处理此处需要的副作用。
      loadList();
    };
    // t2 暂存 `[onComplete]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [onComplete];
    // $[0] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onComplete;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t1, t2);
  // t3 暂存 `<Text>Loading marketplaces...</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text>Loading marketplaces...</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>Loading marketplaces...</Text>;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 返回 `t3`，作为命令处理这次计算的结果。
  return t3;
}
// _temp 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(n) {
  // 返回 `` • ${n}``，作为命令处理这次计算的结果。
  return `  • ${n}`;
}
// McpRedirectBanner 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function McpRedirectBanner() {
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
// ErrorRowAction 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type ErrorRowAction = {
  kind: 'navigate';
  tab: TabId;
  viewState: ViewState;
} | {
  kind: 'remove-extra-marketplace';
  name: string;
  sources: Array<{
    source: EditableSettingSource;
    scope: string;
  }>;
} | {
  kind: 'remove-installed-marketplace';
  name: string;
} | {
  kind: 'managed-only';
  name: string;
} | {
  kind: 'none';
};
// ErrorRow 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type ErrorRow = {
  label: string;
  message: string;
  guidance?: string | null;
  action: ErrorRowAction;
  scope?: string;
};

/**
 * Determine which settings sources define an extraKnownMarketplace entry.
 * Returns the editable sources (user/project/local) and whether policy also has it.
 */
// getExtraMarketplaceSourceInfo 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getExtraMarketplaceSourceInfo(name: string): {
  editableSources: Array<{
    source: EditableSettingSource;
    scope: string;
  }>;
  isInPolicy: boolean;
} {
  // editableSources 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const editableSources: Array<{
    source: EditableSettingSource;
    scope: string;
  }> = [];
  // sourcesToCheck 聚合成有序列表，保持后续遍历顺序稳定。
  const sourcesToCheck = [{
    source: 'userSettings' as const,
    scope: 'user'
  }, {
    source: 'projectSettings' as const,
    scope: 'project'
  }, {
    source: 'localSettings' as const,
    scope: 'local'
  }];
  // 调用 for，触发命令处理此处需要的副作用。
  for (const {
    source,
    scope
  } of sourcesToCheck) {
    // settings 集合读取`getSettingsForSource`，供命令处理后续处理使用。
    const settings = getSettingsForSource(source);
    // 满足 `settings?.extraKnownMarketplaces?.[name]` 时，命令处理执行该分支。
    if (settings?.extraKnownMarketplaces?.[name]) {
      // editableSources 集合追加新条目，保持收集顺序与输入顺序一致。
      editableSources.push({
        source,
        scope
      });
    }
  }
  // policySettings 集合读取`getSettingsForSource`，供命令处理后续处理使用。
  const policySettings = getSettingsForSource('policySettings');
  // isInPolicy记录 `Boolean` 是否成立，命令处理随后按该结果分支。
  const isInPolicy = Boolean(policySettings?.extraKnownMarketplaces?.[name]);
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    editableSources,
    isInPolicy
  };
}
// buildMarketplaceAction 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildMarketplaceAction(name: string): ErrorRowAction {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    editableSources,
    isInPolicy
  } = getExtraMarketplaceSourceInfo(name);
  // 满足 `editableSources.length > 0` 时，命令处理执行该分支。
  if (editableSources.length > 0) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      kind: 'remove-extra-marketplace',
      name,
      sources: editableSources
    };
  }
  // 满足 `isInPolicy` 时，命令处理执行该分支。
  if (isInPolicy) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      kind: 'managed-only',
      name
    };
  }

  // Marketplace is in known_marketplaces.json but not in extraKnownMarketplaces
  // (e.g. previously installed manually) — route to ManageMarketplaces
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    kind: 'navigate',
    tab: 'marketplaces',
    viewState: {
      type: 'manage-marketplaces',
      targetMarketplace: name,
      action: 'remove'
    }
  };
}
// buildPluginAction 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildPluginAction(pluginName: string): ErrorRowAction {
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    kind: 'navigate',
    tab: 'installed',
    viewState: {
      type: 'manage-plugins',
      targetPlugin: pluginName,
      action: 'uninstall'
    }
  };
}
// TRANSIENT_ERROR_TYPES 错误信息保存`Set`，供命令处理后续处理使用。
const TRANSIENT_ERROR_TYPES = new Set(['git-auth-failed', 'git-timeout', 'network-error']);
// isTransientError 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTransientError(error: PluginError): boolean {
  // 返回 `TRANSIENT_ERROR_TYPES.has(error.type)`，作为命令处理这次计算的结果。
  return TRANSIENT_ERROR_TYPES.has(error.type);
}

/**
 * Extract the plugin name from a PluginError, checking explicit fields first,
 * then falling back to the source field (format: "pluginName@marketplace").
 */
// getPluginNameFromError 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPluginNameFromError(error: PluginError): string | undefined {
  // 只有 `'pluginId' in error && error.pluginId` 满足时，命令处理才执行该分支。
  if ('pluginId' in error && error.pluginId) return error.pluginId;
  // 只有 `'plugin' in error && error.plugin` 满足时，命令处理才执行该分支。
  if ('plugin' in error && error.plugin) return error.plugin;
  // Fallback: source often contains "pluginName@marketplace"
  // 满足 `error.source.includes('@')) return error.source.split('@'` 时，命令处理执行该分支。
  if (error.source.includes('@')) return error.source.split('@')[0];
  // 返回 `undefined`，作为命令处理这次计算的结果。
  return undefined;
}
// buildErrorRows 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildErrorRows(failedMarketplaces: Array<{
  name: string;
  error?: string;
}>, extraMarketplaceErrors: PluginError[], pluginLoadingErrors: PluginError[], otherErrors: PluginError[], brokenInstalledMarketplaces: Array<{
  name: string;
  error: string;
}>, transientErrors: PluginError[], pluginScopes: Map<string, string>): ErrorRow[] {
  // rows 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const rows: ErrorRow[] = [];

  // --- Transient errors at the top (restart to retry) ---
  // 按顺序遍历 `transientErrors` 中的错误，逐个交给命令处理处理。
  for (const error of transientErrors) {
    // pluginName 插件数据固定为 `'pluginId' in error ? error.pluginId : 'plugin' in error ...`，作为插件命令界面 Plugin Settings后续展示或比较的基准。
    const pluginName = 'pluginId' in error ? error.pluginId : 'plugin' in error ? error.plugin : undefined;
    // rows 集合追加新条目，保持收集顺序与输入顺序一致。
    rows.push({
      label: pluginName ?? error.source,
      message: formatErrorMessage(error),
      guidance: 'Restart to retry loading plugins',
      action: {
        kind: 'none'
      }
    });
  }

  // --- Marketplace errors ---
  // Track shown marketplace names to avoid duplicates across sources
  // shownMarketplaceNames 市场数据构建`new Set<string>()`，供后续判断或组装使用。
  const shownMarketplaceNames = new Set<string>();
  // 按顺序遍历 `failedMarketplaces` 中的m，逐个交给命令处理处理。
  for (const m of failedMarketplaces) {
    // 调用 shownMarketplaceNames.add，触发命令处理此处需要的副作用。
    shownMarketplaceNames.add(m.name);
    // action构建`buildMarketplaceAction`，供命令处理后续处理使用。
    const action = buildMarketplaceAction(m.name);
    // sourceInfo读取`getExtraMarketplaceSourceInfo`，供命令处理后续处理使用。
    const sourceInfo = getExtraMarketplaceSourceInfo(m.name);
    // scope读取 `sourceInfo.isInPolicy ? 'managed' : sourceInfo.editableSo...` 对应条目，后续围绕该成员继续处理。
    const scope = sourceInfo.isInPolicy ? 'managed' : sourceInfo.editableSources[0]?.scope;
    // rows 集合追加新条目，保持收集顺序与输入顺序一致。
    rows.push({
      label: m.name,
      message: m.error ?? 'Installation failed',
      guidance: action.kind === 'managed-only' ? 'Managed by your organization — contact your admin' : undefined,
      action,
      scope
    });
  }
  // 按顺序遍历 `extraMarketplaceErrors` 中的e，逐个交给命令处理处理。
  for (const e of extraMarketplaceErrors) {
    // marketplace 市场数据固定为 `'marketplace' in e ? e.marketplace : e.source`，作为插件命令界面 Plugin Settings后续展示或比较的基准。
    const marketplace = 'marketplace' in e ? e.marketplace : e.source;
    // 满足 `shownMarketplaceNames.has(marketplace)` 时，命令处理执行该分支。
    if (shownMarketplaceNames.has(marketplace)) continue;
    // 调用 shownMarketplaceNames.add，触发命令处理此处需要的副作用。
    shownMarketplaceNames.add(marketplace);
    // action构建`buildMarketplaceAction`，供命令处理后续处理使用。
    const action = buildMarketplaceAction(marketplace);
    // sourceInfo读取`getExtraMarketplaceSourceInfo`，供命令处理后续处理使用。
    const sourceInfo = getExtraMarketplaceSourceInfo(marketplace);
    // scope读取 `sourceInfo.isInPolicy ? 'managed' : sourceInfo.editableSo...` 对应条目，后续围绕该成员继续处理。
    const scope = sourceInfo.isInPolicy ? 'managed' : sourceInfo.editableSources[0]?.scope;
    // rows 集合追加新条目，保持收集顺序与输入顺序一致。
    rows.push({
      label: marketplace,
      message: formatErrorMessage(e),
      guidance: action.kind === 'managed-only' ? 'Managed by your organization — contact your admin' : getErrorGuidance(e),
      action,
      scope
    });
  }

  // Installed marketplaces that fail to load data (from known_marketplaces.json)
  // 按顺序遍历 `brokenInstalledMarketplaces` 中的m，逐个交给命令处理处理。
  for (const m of brokenInstalledMarketplaces) {
    // 满足 `shownMarketplaceNames.has(m.name)` 时，命令处理执行该分支。
    if (shownMarketplaceNames.has(m.name)) continue;
    // 调用 shownMarketplaceNames.add，触发命令处理此处需要的副作用。
    shownMarketplaceNames.add(m.name);
    // rows 集合追加新条目，保持收集顺序与输入顺序一致。
    rows.push({
      label: m.name,
      message: m.error,
      action: {
        kind: 'remove-installed-marketplace',
        name: m.name
      }
    });
  }

  // --- Plugin errors ---
  // shownPluginNames 插件数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const shownPluginNames = new Set<string>();
  // 按顺序遍历 `pluginLoadingErrors` 中的错误，逐个交给命令处理处理。
  for (const error of pluginLoadingErrors) {
    // pluginName 插件数据读取`getPluginNameFromError`，供命令处理后续处理使用。
    const pluginName = getPluginNameFromError(error);
    // 只有 `pluginName && shownPluginNames.has(pluginName)` 满足时，命令处理才执行该分支。
    if (pluginName && shownPluginNames.has(pluginName)) continue;
    // 满足 `pluginName) shownPluginNames.add(pluginName` 时，命令处理执行该分支。
    if (pluginName) shownPluginNames.add(pluginName);
    // marketplace 市场数据固定为 `'marketplace' in error ? error.marketplace : undefined`，作为插件命令界面 Plugin Settings后续展示或比较的基准。
    const marketplace = 'marketplace' in error ? error.marketplace : undefined;
    // Try pluginId@marketplace format first, then just pluginName
    // scope读取`pluginScopes.get`，供命令处理后续处理使用。
    const scope = pluginName ? pluginScopes.get(error.source) ?? pluginScopes.get(pluginName) : undefined;
    // rows 集合追加新条目，保持收集顺序与输入顺序一致。
    rows.push({
      label: pluginName ? marketplace ? `${pluginName} @ ${marketplace}` : pluginName : error.source,
      message: formatErrorMessage(error),
      guidance: getErrorGuidance(error),
      action: pluginName ? buildPluginAction(pluginName) : {
        kind: 'none'
      },
      scope
    });
  }

  // --- Other errors (non-marketplace, non-plugin-specific) ---
  // 按顺序遍历 `otherErrors` 中的错误，逐个交给命令处理处理。
  for (const error of otherErrors) {
    // rows 集合追加新条目，保持收集顺序与输入顺序一致。
    rows.push({
      label: error.source,
      message: formatErrorMessage(error),
      guidance: getErrorGuidance(error),
      action: {
        kind: 'none'
      }
    });
  }
  // 返回 `rows`，作为命令处理这次计算的结果。
  return rows;
}

/**
 * Remove a marketplace from extraKnownMarketplaces in the given settings sources,
 * and also remove any associated enabled plugins.
 */
// removeExtraMarketplace 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function removeExtraMarketplace(name: string, sources: Array<{
  source: EditableSettingSource;
}>): void {
  // 调用 for，触发命令处理此处需要的副作用。
  for (const {
    source
  } of sources) {
    // settings 集合读取`getSettingsForSource`，供命令处理后续处理使用。
    const settings = getSettingsForSource(source);
    // settings 集合缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!settings) continue;
    // updates 集合 从空对象开始收集键值，后续按名称补齐内容。
    const updates: Record<string, unknown> = {};

    // Remove from extraKnownMarketplaces
    // 满足 `settings.extraKnownMarketplaces?.[name]` 时，命令处理执行该分支。
    if (settings.extraKnownMarketplaces?.[name]) {
      // extraKnownMarketplaces 市场数据更新为 `{`，确保插件命令界面后续读取最新状态。
      updates.extraKnownMarketplaces = {
        ...settings.extraKnownMarketplaces,
        [name]: undefined
      };
    }

    // Remove associated enabled plugins (format: "plugin@marketplace")
    // 满足 `settings.enabledPlugins` 时，命令处理执行该分支。
    if (settings.enabledPlugins) {
      // suffix 命名 ``@${name}``，让后续代码直接表达这个值的用途。
      const suffix = `@${name}`;
      // removedPlugins 插件数据标记插件命令界面 Plugin Settings是否启用对应路径。
      let removedPlugins = false;
      // updatedPlugins 插件数据集中保存插件命令界面 Plugin Settings要一起传递的字段。
      const updatedPlugins = {
        ...settings.enabledPlugins
      };
      // 循环处理 `const pluginId in updatedPlugins`，让命令处理逐项把同类条目按顺序走完。
      for (const pluginId in updatedPlugins) {
        // 满足 `pluginId.endsWith(suffix)` 时，命令处理执行该分支。
        if (pluginId.endsWith(suffix)) {
          // updatedPlugins[pluginId 插件数据更新为 `undefined`，确保插件命令界面 Plugin Settings后续读取最新状态。
          updatedPlugins[pluginId] = undefined;
          // removedPlugins 插件数据更新为 `true`，确保插件命令界面后续读取最新状态。
          removedPlugins = true;
        }
      }
      // 满足 `removedPlugins` 时，命令处理执行该分支。
      if (removedPlugins) {
        // enabledPlugins 插件数据更新为 `updatedPlugins`，确保插件命令界面后续读取最新状态。
        updates.enabledPlugins = updatedPlugins;
      }
    }
    // 满足 `Object.keys(updates).length > 0` 时，命令处理执行该分支。
    if (Object.keys(updates).length > 0) {
      // 调用 updateSettingsForSource，触发命令处理此处需要的副作用。
      updateSettingsForSource(source, updates);
    }
  }
}
// ErrorsTabContent 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ErrorsTabContent(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    setViewState,
    setActiveTab,
    markPluginsChanged
  } = t0;
  // 错误列表保存`useAppState`，供命令处理后续处理使用。
  const errors = useAppState(_temp2);
  // installationStatus 集合保存`useAppState`，供命令处理后续处理使用。
  const installationStatus = useAppState(_temp3);
  // setAppState 状态保存`useSetAppState`，供命令处理后续处理使用。
  const setAppState = useSetAppState();
  // 选中索引 由 React state 持有，setSelectedIndex 会在用户操作或异步结果返回时触发刷新。
  const [selectedIndex, setSelectedIndex] = useState(0);
  // actionMessage 消息数据 由 React state 持有，setActionMessage 会在用户操作或异步结果返回时触发刷新。
  const [actionMessage, setActionMessage] = useState(null);
  // t1 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // marketplaceLoadFailures 市场数据 由 React state 持有，setMarketplaceLoadFailures 会在用户操作或异步结果返回时触发刷新。
  const [marketplaceLoadFailures, setMarketplaceLoadFailures] = useState(t1);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 这个回调绑定到 (async () => {，负责命令处理在该局部场景下的响应。
      (async () => {
        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // 配置读取`loadKnownMarketplacesConfig`，供命令处理后续处理使用。
          const config = await loadKnownMarketplacesConfig();
          // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
          const {
            failures
          } = await loadMarketplacesWithGracefulDegradation(config);
          // setMarketplaceLoadFailures 写入新的状态值，使命令处理后续读取保持一致。
          setMarketplaceLoadFailures(failures);
        } catch {}
      })();
    };
    // t3 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t2, t3);
  // failedMarketplaces 市场数据筛选`marketplaces.filter`，供命令处理后续处理使用。
  const failedMarketplaces = installationStatus.marketplaces.filter(_temp4);
  // failedMarketplaceNames 市场数据保存`Set`，供命令处理后续处理使用。
  const failedMarketplaceNames = new Set(failedMarketplaces.map(_temp5));
  // transientErrors 错误信息筛选`errors.filter`，供命令处理后续处理使用。
  const transientErrors = errors.filter(isTransientError);
  // extraMarketplaceErrors 市场数据筛选`errors.filter`，供命令处理后续处理使用。
  const extraMarketplaceErrors = errors.filter(e => (e.type === "marketplace-not-found" || e.type === "marketplace-load-failed" || e.type === "marketplace-blocked-by-policy") && !failedMarketplaceNames.has(e.marketplace));
  // pluginLoadingErrors 插件数据筛选`errors.filter`，供命令处理后续处理使用。
  const pluginLoadingErrors = errors.filter(_temp6);
  // otherErrors 错误信息筛选`errors.filter`，供命令处理后续处理使用。
  const otherErrors = errors.filter(_temp7);
  // pluginScopes 插件数据读取`getPluginEditableScopes`，供命令处理后续处理使用。
  const pluginScopes = getPluginEditableScopes();
  // rows 集合构建`buildErrorRows`，供命令处理后续处理使用。
  const rows = buildErrorRows(failedMarketplaces, extraMarketplaceErrors, pluginLoadingErrors, otherErrors, marketplaceLoadFailures, transientErrors, pluginScopes);
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== setViewState) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // setViewState 写入新的状态值，使命令处理后续读取保持一致。
      setViewState({
        type: "menu"
      });
    };
    // $[3] 缓存 `setViewState`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = setViewState;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      context: "Confirmation"
    };
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // 调用 useKeybinding，触发命令处理此处需要的副作用。
  useKeybinding("confirm:no", t4, t5);
  // handleSelect封装成回调，供插件命令界面 Plugin Settings在事件触发或异步步骤中调用。
  const handleSelect = () => {
    // row读取 `rows[selectedIndex]` 对应条目，后续围绕该成员继续处理。
    const row = rows[selectedIndex];
    // row缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!row) {
      // 插件命令界面 Plugin Settings在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      action
    } = row;
    // 插件命令界面 Plugin Settings在这里处理 `bb77: switch (action.kind) {`，完成这一小步状态转换。
    bb77: switch (action.kind) {
      case "navigate":
        {
          // setActiveTab 写入新的状态值，使命令处理后续读取保持一致。
          setActiveTab(action.tab);
          // setViewState 写入新的状态值，使命令处理后续读取保持一致。
          setViewState(action.viewState);
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break bb77;
        }
      case "remove-extra-marketplace":
        {
          // scopes 集合派生`sources.map`，供命令处理后续处理使用。
          const scopes = action.sources.map(_temp8).join(", ");
          // 调用 removeExtraMarketplace，触发命令处理此处需要的副作用。
          removeExtraMarketplace(action.name, action.sources);
          // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
          clearAllCaches();
          // setAppState 写入新的状态值，使命令处理后续读取保持一致。
          setAppState(prev_0 => ({
            ...prev_0,
            plugins: {
              ...prev_0.plugins,
              // 这个回调绑定到 errors: prev_0.plugins.errors.filter(e_2 => !("marketplace" in e_2 && e_2.marketplac…，负责命令处理在该局部场景下的响应。
              errors: prev_0.plugins.errors.filter(e_2 => !("marketplace" in e_2 && e_2.marketplace === action.name)),
              installationStatus: {
                ...prev_0.plugins.installationStatus,
                // 这个回调绑定到 marketplaces: prev_0.plugins.installationStatus.marketplaces.filter(m_1 => m_1.name …，负责命令处理在该局部场景下的响应。
                marketplaces: prev_0.plugins.installationStatus.marketplaces.filter(m_1 => m_1.name !== action.name)
              }
            }
          }));
          // setActionMessage 写入新的状态值，使命令处理后续读取保持一致。
          setActionMessage(`${figures.tick} Removed "${action.name}" from ${scopes} settings`);
          // 调用 markPluginsChanged，触发命令处理此处需要的副作用。
          markPluginsChanged();
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break bb77;
        }
      case "remove-installed-marketplace":
        {
          // 这个回调绑定到 (async () => {，负责命令处理在该局部场景下的响应。
          (async () => {
            // 插件命令界面 Plugin Settings在这里处理 ``，完成这一小步状态转换。
            ;
            // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
            try {
              // 等待 `removeMarketplaceSource(action.name)` 完成，再继续插件命令界面 Plugin Settings的异步流程。
              await removeMarketplaceSource(action.name);
              // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
              clearAllCaches();
              // setMarketplaceLoadFailures 写入新的状态值，使命令处理后续读取保持一致。
              setMarketplaceLoadFailures(prev => prev.filter(f => f.name !== action.name));
              // setActionMessage 写入新的状态值，使命令处理后续读取保持一致。
              setActionMessage(`${figures.tick} Removed marketplace "${action.name}"`);
              // 调用 markPluginsChanged，触发命令处理此处需要的副作用。
              markPluginsChanged();
            } catch (t6) {
              // err 命名 `t6`，让后续代码直接表达这个值的用途。
              const err = t6;
              // setActionMessage 写入新的状态值，使命令处理后续读取保持一致。
              setActionMessage(`Failed to remove "${action.name}": ${err instanceof Error ? err.message : String(err)}`);
            }
          })();
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break bb77;
        }
      case "managed-only":
        {
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break bb77;
        }
      case "none":
    }
  };
  // t7 暂存 `() => setSelectedIndex(_temp9)` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `() => setSelectedIndex(_temp9)` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => setSelectedIndex(_temp9);
    // $[6] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[6];
  }
  // 临时值 t8 命名 `rows.length > 0`，让后续代码直接表达这个值的用途。
  const t8 = rows.length > 0;
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t8) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      context: "Select",
      isActive: t8
    };
    // $[7] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t8;
    // $[8] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[8];
  }
  // 调用 useKeybindings，触发命令处理此处需要的副作用。
  useKeybindings({
    "select:previous": t7,
    // 这个回调绑定到 "select:next": () => setSelectedIndex(prev_2 => Math.min(rows.length - 1, prev_2 + 1…，负责命令处理在该局部场景下的响应。
    "select:next": () => setSelectedIndex(prev_2 => Math.min(rows.length - 1, prev_2 + 1)),
    "select:accept": handleSelect
  }, t9);
  // clampedIndex 索引保存`Math.min`，供命令处理后续处理使用。
  const clampedIndex = Math.min(selectedIndex, Math.max(0, rows.length - 1));
  // `clampedIndex` 与 `selectedIndex` 不一致时刷新派生状态，避免使用过期结果。
  if (clampedIndex !== selectedIndex) {
    // setSelectedIndex 写入新的状态值，使命令处理后续读取保持一致。
    setSelectedIndex(clampedIndex);
  }
  // selectedAction 命名 `rows[clampedIndex]?.action`，让后续代码直接表达这个值的用途。
  const selectedAction = rows[clampedIndex]?.action;
  // hasAction标记插件命令界面 Plugin Settings是否启用对应路径。
  const hasAction = selectedAction && selectedAction.kind !== "none" && selectedAction.kind !== "managed-only";
  // rows 集合为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (rows.length === 0) {
    // t10 暂存 `<Box marginLeft={1}><Text dimColor={true}>No plugin error...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      // t10 暂存 `<Box marginLeft={1}><Text dimColor={true}>No plugin error...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Box marginLeft={1}><Text dimColor={true}>No plugin errors</Text></Box>;
      // $[9] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[9];
    }
    // t11 暂存 `<Box flexDirection="column">{t10}<Box marginTop={1}><Text...` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
      // t11 暂存 `<Box flexDirection="column">{t10}<Box marginTop={1}><Text...` 生成的渲染片段，后续返回路径直接复用。
      t11 = <Box flexDirection="column">{t10}<Box marginTop={1}><Text dimColor={true} italic={true}><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="back" /></Text></Box></Box>;
      // $[10] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[10];
    }
    // 返回 `t11`，作为命令处理这次计算的结果。
    return t11;
  }
  // 临时值 T0保存`Box`，供插件命令界面 Plugin Settings后续判断或输出使用。
  const T0 = Box;
  // t10保存`"column"`，作为后续固定文本处理的输入。
  const t10 = "column";
  // t11 暂存 `(row_0, idx) => {` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== clampedIndex) {
    // t11 暂存 `(row_0, idx) => {` 生成的渲染片段，后续返回路径直接复用。
    t11 = (row_0, idx) => {
      // isSelected标记插件命令界面 Plugin Settings是否启用对应路径。
      const isSelected = idx === clampedIndex;
      // 返回 `<Box key={idx} marginLeft={1} flexDirection="column" marginBottom={1}><...`，作为命令处理这次计算的结果。
      return <Box key={idx} marginLeft={1} flexDirection="column" marginBottom={1}><Text><Text color={isSelected ? "suggestion" : "error"}>{isSelected ? figures.pointer : figures.cross}{" "}</Text><Text bold={isSelected}>{row_0.label}</Text>{row_0.scope && <Text dimColor={true}> ({row_0.scope})</Text>}</Text><Box marginLeft={3}><Text color="error">{row_0.message}</Text></Box>{row_0.guidance && <Box marginLeft={3}><Text dimColor={true} italic={true}>{row_0.guidance}</Text></Box>}</Box>;
    };
    // $[11] 缓存 `clampedIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = clampedIndex;
    // $[12] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[12];
  }
  // 临时值 t12派生`rows.map`，供命令处理后续处理使用。
  const t12 = rows.map(t11);
  // t13 暂存 `actionMessage && <Box marginTop={1} marginLeft={1}><Text ...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== actionMessage) {
    // t13 暂存 `actionMessage && <Box marginTop={1} marginLeft={1}><Text ...` 生成的渲染片段，后续返回路径直接复用。
    t13 = actionMessage && <Box marginTop={1} marginLeft={1}><Text color="claude">{actionMessage}</Text></Box>;
    // $[13] 缓存 `actionMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = actionMessage;
    // $[14] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[14];
  }
  // t14 暂存 `<ConfigurableShortcutHint action="select:previous" contex...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t14 暂存 `<ConfigurableShortcutHint action="select:previous" contex...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <ConfigurableShortcutHint action="select:previous" context="Select" fallback={"\u2191"} description="navigate" />;
    // $[15] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[15];
  }
  // t15 暂存 `hasAction && <ConfigurableShortcutHint action="select:acc...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== hasAction) {
    // t15 暂存 `hasAction && <ConfigurableShortcutHint action="select:acc...` 生成的渲染片段，后续返回路径直接复用。
    t15 = hasAction && <ConfigurableShortcutHint action="select:accept" context="Select" fallback="Enter" description="resolve" />;
    // $[16] 缓存 `hasAction`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = hasAction;
    // $[17] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[17];
  }
  // t16 暂存 `<ConfigurableShortcutHint action="confirm:no" context="Co...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
    // t16 暂存 `<ConfigurableShortcutHint action="confirm:no" context="Co...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="back" />;
    // $[18] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[18];
  }
  // t17 暂存 `<Box marginTop={1}><Text dimColor={true} italic={true}><B...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t15) {
    // t17 暂存 `<Box marginTop={1}><Text dimColor={true} italic={true}><B...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Box marginTop={1}><Text dimColor={true} italic={true}><Byline>{t14}{t15}{t16}</Byline></Text></Box>;
    // $[19] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t15;
    // $[20] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[20];
  }
  // t18 暂存 `<T0 flexDirection={t10}>{t12}{t13}{t17}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== T0 || $[22] !== t12 || $[23] !== t13 || $[24] !== t17) {
    // t18 暂存 `<T0 flexDirection={t10}>{t12}{t13}{t17}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <T0 flexDirection={t10}>{t12}{t13}{t17}</T0>;
    // $[21] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = T0;
    // $[22] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t12;
    // $[23] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t13;
    // $[24] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t17;
    // $[25] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[25];
  }
  // 返回 `t18`，作为命令处理这次计算的结果。
  return t18;
}
// _temp9 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp9(prev_1) {
  // 返回 `Math.max(0, prev_1 - 1)`，作为命令处理这次计算的结果。
  return Math.max(0, prev_1 - 1);
}
// _temp8 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp8(s_1) {
  // 返回 `s_1.scope`，作为命令处理这次计算的结果。
  return s_1.scope;
}
// _temp7 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp7(e_1) {
  // 满足 `isTransientError(e_1)` 时，命令处理执行该分支。
  if (isTransientError(e_1)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }
  // 只有 `e_1.type === "marketplace-not-found" || e_1.type` 满足时，命令处理才执行该分支。
  if (e_1.type === "marketplace-not-found" || e_1.type === "marketplace-load-failed" || e_1.type === "marketplace-blocked-by-policy") {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }
  // 返回 `getPluginNameFromError(e_1) === undefined`，作为命令处理这次计算的结果。
  return getPluginNameFromError(e_1) === undefined;
}
// _temp6 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(e_0) {
  // 满足 `isTransientError(e_0)` 时，命令处理执行该分支。
  if (isTransientError(e_0)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }
  // 只有 `e_0.type === "marketplace-not-found" || e_0.type` 满足时，命令处理才执行该分支。
  if (e_0.type === "marketplace-not-found" || e_0.type === "marketplace-load-failed" || e_0.type === "marketplace-blocked-by-policy") {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }
  // 返回 `getPluginNameFromError(e_0) !== undefined`，作为命令处理这次计算的结果。
  return getPluginNameFromError(e_0) !== undefined;
}
// _temp5 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(m_0) {
  // 返回 `m_0.name`，作为命令处理这次计算的结果。
  return m_0.name;
}
// _temp4 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(m) {
  // 返回 `m.status === "failed"`，作为命令处理这次计算的结果。
  return m.status === "failed";
}
// _temp3 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(s_0) {
  // 返回 `s_0.plugins.installationStatus`，作为命令处理这次计算的结果。
  return s_0.plugins.installationStatus;
}
// _temp2 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s) {
  // 返回 `s.plugins.errors`，作为命令处理这次计算的结果。
  return s.plugins.errors;
}
// getInitialViewState 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInitialViewState(parsedCommand: ParsedCommand): ViewState {
  // 按照 parsedCommand.type 的取值选择命令处理的具体处理分支。
  switch (parsedCommand.type) {
    case 'help':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'help'
      };
    case 'validate':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'validate',
        path: parsedCommand.path
      };
    case 'install':
      // 满足 `parsedCommand.marketplace` 时，命令处理执行该分支。
      if (parsedCommand.marketplace) {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'browse-marketplace',
          targetMarketplace: parsedCommand.marketplace,
          targetPlugin: parsedCommand.plugin
        };
      }
      // 满足 `parsedCommand.plugin` 时，命令处理执行该分支。
      if (parsedCommand.plugin) {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'discover-plugins',
          targetPlugin: parsedCommand.plugin
        };
      }
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'discover-plugins'
      };
    case 'manage':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'manage-plugins'
      };
    case 'uninstall':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'manage-plugins',
        targetPlugin: parsedCommand.plugin,
        action: 'uninstall'
      };
    case 'enable':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'manage-plugins',
        targetPlugin: parsedCommand.plugin,
        action: 'enable'
      };
    case 'disable':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'manage-plugins',
        targetPlugin: parsedCommand.plugin,
        action: 'disable'
      };
    case 'marketplace':
      // 当 `parsedCommand.action` 匹配 `'list'` 时，命令处理执行对应分支。
      if (parsedCommand.action === 'list') {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'marketplace-list'
        };
      }
      // 当 `parsedCommand.action` 匹配 `'add'` 时，命令处理执行对应分支。
      if (parsedCommand.action === 'add') {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'add-marketplace',
          initialValue: parsedCommand.target
        };
      }
      // 当 `parsedCommand.action` 匹配 `'remove'` 时，命令处理执行对应分支。
      if (parsedCommand.action === 'remove') {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'manage-marketplaces',
          targetMarketplace: parsedCommand.target,
          action: 'remove'
        };
      }
      // 当 `parsedCommand.action` 匹配 `'update'` 时，命令处理执行对应分支。
      if (parsedCommand.action === 'update') {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'manage-marketplaces',
          targetMarketplace: parsedCommand.target,
          action: 'update'
        };
      }
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'marketplace-menu'
      };
    case 'menu':
    default:
      // Default to discover view showing all plugins
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'discover-plugins'
      };
  }
}
// getInitialTab 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInitialTab(viewState: ViewState): TabId {
  // 当 `viewState.type` 匹配 `'manage-plugins'` 时，命令处理执行对应分支。
  if (viewState.type === 'manage-plugins') return 'installed';
  // 当 `viewState.type` 匹配 `'manage-marketplaces'` 时，命令处理执行对应分支。
  if (viewState.type === 'manage-marketplaces') return 'marketplaces';
  // 返回 `'discover'`，作为命令处理这次计算的结果。
  return 'discover';
}
// PluginSettings 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PluginSettings(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(75);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onComplete,
    args,
    showMcpRedirectMessage
  } = t0;
  // parsedCommand 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsedCommand;
  // t1 暂存 `getInitialViewState(parsedCommand)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== args) {
    // parsedCommand 命令数据更新为 `parsePluginArgs(args)`，确保插件命令界面后续读取最新状态。
    parsedCommand = parsePluginArgs(args);
    // t1 暂存 `getInitialViewState(parsedCommand)` 生成的渲染片段，后续返回路径直接复用。
    t1 = getInitialViewState(parsedCommand);
    // $[0] 缓存 `args`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = args;
    // $[1] 缓存 `parsedCommand`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = parsedCommand;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // parsedCommand 命令数据更新为 `$[1]`，确保插件命令界面后续读取最新状态。
    parsedCommand = $[1];
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // initialViewState 状态 命名 `t1`，让后续代码直接表达这个值的用途。
  const initialViewState = t1;
  // viewState 状态 由 React state 持有，setViewState 会在用户操作或异步结果返回时触发刷新。
  const [viewState, setViewState] = useState(initialViewState);
  // t2 暂存 `getInitialTab(initialViewState)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== initialViewState) {
    // t2 暂存 `getInitialTab(initialViewState)` 生成的渲染片段，后续返回路径直接复用。
    t2 = getInitialTab(initialViewState);
    // $[3] 缓存 `initialViewState`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = initialViewState;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // activeTab 由 React state 持有，setActiveTab 会在用户操作或异步结果返回时触发刷新。
  const [activeTab, setActiveTab] = useState(t2);
  // inputValue 由 React state 持有，setInputValue 会在用户操作或异步结果返回时触发刷新。
  const [inputValue, setInputValue] = useState(viewState.type === "add-marketplace" ? viewState.initialValue || "" : "");
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(0);
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // 结果 由 React state 持有，setResult 会在用户操作或异步结果返回时触发刷新。
  const [result, setResult] = useState(null);
  // childSearchActive 由 React state 持有，setChildSearchActive 会在用户操作或异步结果返回时触发刷新。
  const [childSearchActive, setChildSearchActive] = useState(false);
  // setAppState 状态保存`useSetAppState`，供命令处理后续处理使用。
  const setAppState = useSetAppState();
  // pluginErrorCount 插件数据保存`useAppState`，供命令处理后续处理使用。
  const pluginErrorCount = useAppState(_temp0);
  // errorsTabTitle 错误信息保存`Errors`，供命令处理后续处理使用。
  const errorsTabTitle = pluginErrorCount > 0 ? `Errors (${pluginErrorCount})` : "Errors";
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供命令处理后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings();
  // cliMode标记插件命令界面 Plugin Settings是否启用对应路径。
  const cliMode = parsedCommand.type === "marketplace" && parsedCommand.action === "add" && parsedCommand.target !== undefined;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== setAppState) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // setAppState 写入新的状态值，使命令处理后续读取保持一致。
      setAppState(_temp1);
    };
    // $[5] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = setAppState;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // markPluginsChanged 插件数据 命名 `t3`，让后续代码直接表达这个值的用途。
  const markPluginsChanged = t3;
  // t4 暂存 `tabId => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `tabId => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = tabId => {
      // tab 命名 `tabId as TabId`，让后续代码直接表达这个值的用途。
      const tab = tabId as TabId;
      // setActiveTab 写入新的状态值，使命令处理后续读取保持一致。
      setActiveTab(tab);
      // setError 写入新的状态值，使命令处理后续读取保持一致。
      setError(null);
      // 插件命令界面 Plugin Settings在这里处理 `bb37: switch (tab) {`，完成这一小步状态转换。
      bb37: switch (tab) {
        case "discover":
          {
            // setViewState 写入新的状态值，使命令处理后续读取保持一致。
            setViewState({
              type: "discover-plugins"
            });
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break bb37;
          }
        case "installed":
          {
            // setViewState 写入新的状态值，使命令处理后续读取保持一致。
            setViewState({
              type: "manage-plugins"
            });
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break bb37;
          }
        case "marketplaces":
          {
            // setViewState 写入新的状态值，使命令处理后续读取保持一致。
            setViewState({
              type: "manage-marketplaces"
            });
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break bb37;
          }
        case "errors":
      }
    };
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // handleTabChange保存`t4`，作为后续临时缓存值处理的输入。
  const handleTabChange = t4;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `[viewState.type, result, onComplete]` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== onComplete || $[9] !== result || $[10] !== viewState.type) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // 只有 `viewState.type === "menu" && !result` 满足时，命令处理才执行该分支。
      if (viewState.type === "menu" && !result) {
        // 调用 onComplete，触发命令处理此处需要的副作用。
        onComplete();
      }
    };
    // t6 暂存 `[viewState.type, result, onComplete]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [viewState.type, result, onComplete];
    // $[8] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onComplete;
    // $[9] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = result;
    // $[10] 缓存 `viewState.type`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = viewState.type;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t5, t6);
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // t8 暂存 `[viewState.type, activeTab]` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== activeTab || $[14] !== viewState.type) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // 只有 `viewState.type === "browse-marketplace" && active` 满足时，命令处理才执行该分支。
      if (viewState.type === "browse-marketplace" && activeTab !== "discover") {
        // setActiveTab 写入新的状态值，使命令处理后续读取保持一致。
        setActiveTab("discover");
      }
    };
    // t8 暂存 `[viewState.type, activeTab]` 生成的渲染片段，后续返回路径直接复用。
    t8 = [viewState.type, activeTab];
    // $[13] 缓存 `activeTab`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = activeTab;
    // $[14] 缓存 `viewState.type`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = viewState.type;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
    // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[16];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t7, t8);
  // t9 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = () => {
      // setActiveTab 写入新的状态值，使命令处理后续读取保持一致。
      setActiveTab("marketplaces");
      // setViewState 写入新的状态值，使命令处理后续读取保持一致。
      setViewState({
        type: "manage-marketplaces"
      });
      // setInputValue 写入新的状态值，使命令处理后续读取保持一致。
      setInputValue("");
      // setError 写入新的状态值，使命令处理后续读取保持一致。
      setError(null);
    };
    // $[17] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[17];
  }
  // handleAddMarketplaceEscape 市场数据保存`t9`，作为后续临时缓存值处理的输入。
  const handleAddMarketplaceEscape = t9;
  // t10标记插件命令界面 Plugin Settings是否启用对应路径。
  const t10 = viewState.type === "add-marketplace";
  // t11 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== t10) {
    // t11 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t11 = {
      context: "Settings",
      isActive: t10
    };
    // $[18] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t10;
    // $[19] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[19];
  }
  // 调用 useKeybinding，触发命令处理此处需要的副作用。
  useKeybinding("confirm:no", handleAddMarketplaceEscape, t11);
  // t12 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // t13 暂存 `[result, onComplete]` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== onComplete || $[21] !== result) {
    // t12 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t12 = () => {
      // 满足 `result` 时，命令处理执行该分支。
      if (result) {
        // 调用 onComplete，触发命令处理此处需要的副作用。
        onComplete(result);
      }
    };
    // t13 暂存 `[result, onComplete]` 生成的渲染片段，后续返回路径直接复用。
    t13 = [result, onComplete];
    // $[20] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = onComplete;
    // $[21] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = result;
    // $[22] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t12;
    // $[23] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t13;
  } else {
    // t12 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[22];
    // t13 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[23];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t12, t13);
  // t14 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // t15 暂存 `[viewState.type, onComplete]` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== onComplete || $[25] !== viewState.type) {
    // t14 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t14 = () => {
      // 当 `viewState.type` 匹配 `"help"` 时，命令处理执行对应分支。
      if (viewState.type === "help") {
        // 调用 onComplete，触发命令处理此处需要的副作用。
        onComplete();
      }
    };
    // t15 暂存 `[viewState.type, onComplete]` 生成的渲染片段，后续返回路径直接复用。
    t15 = [viewState.type, onComplete];
    // $[24] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = onComplete;
    // $[25] 缓存 `viewState.type`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = viewState.type;
    // $[26] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t14;
    // $[27] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t15;
  } else {
    // t14 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[26];
    // t15 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[27];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t14, t15);
  // 当 `viewState.type` 匹配 `"help"` 时，命令处理执行对应分支。
  if (viewState.type === "help") {
    // t16 暂存 `<Box flexDirection="column"><Text bold={true}>Plugin Comm...` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
      // t16 暂存 `<Box flexDirection="column"><Text bold={true}>Plugin Comm...` 生成的渲染片段，后续返回路径直接复用。
      t16 = <Box flexDirection="column"><Text bold={true}>Plugin Command Usage:</Text><Text> </Text><Text dimColor={true}>Installation:</Text><Text> /plugin install - Browse and install plugins</Text><Text>{" "}{"/plugin install <marketplace> - Install from specific marketplace"}</Text><Text>{" /plugin install <plugin> - Install specific plugin"}</Text><Text>{" "}{"/plugin install <plugin>@<market> - Install plugin from marketplace"}</Text><Text> </Text><Text dimColor={true}>Management:</Text><Text> /plugin manage - Manage installed plugins</Text><Text>{" /plugin enable <plugin> - Enable a plugin"}</Text><Text>{" /plugin disable <plugin> - Disable a plugin"}</Text><Text>{" /plugin uninstall <plugin> - Uninstall a plugin"}</Text><Text> </Text><Text dimColor={true}>Marketplaces:</Text><Text> /plugin marketplace - Marketplace management menu</Text><Text> /plugin marketplace add - Add a marketplace</Text><Text>{" "}{"/plugin marketplace add <path/url> - Add marketplace directly"}</Text><Text> /plugin marketplace update - Update marketplaces</Text><Text>{" "}{"/plugin marketplace update <name> - Update specific marketplace"}</Text><Text> /plugin marketplace remove - Remove a marketplace</Text><Text>{" "}{"/plugin marketplace remove <name> - Remove specific marketplace"}</Text><Text> /plugin marketplace list - List all marketplaces</Text><Text> </Text><Text dimColor={true}>Validation:</Text><Text>{" "}{"/plugin validate <path> - Validate a manifest file or directory"}</Text><Text> </Text><Text dimColor={true}>Other:</Text><Text> /plugin - Main plugin menu</Text><Text> /plugin help - Show this help</Text><Text> /plugins - Alias for /plugin</Text></Box>;
      // $[28] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = t16;
    } else {
      // t16 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[28];
    }
    // 返回 `t16`，作为命令处理这次计算的结果。
    return t16;
  }
  // 当 `viewState.type` 匹配 `"validate"` 时，命令处理执行对应分支。
  if (viewState.type === "validate") {
    // t16 暂存 `<ValidatePlugin onComplete={onComplete} path={viewState.p...` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[29] !== onComplete || $[30] !== viewState.path) {
      // t16 暂存 `<ValidatePlugin onComplete={onComplete} path={viewState.p...` 生成的渲染片段，后续返回路径直接复用。
      t16 = <ValidatePlugin onComplete={onComplete} path={viewState.path} />;
      // $[29] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
      $[29] = onComplete;
      // $[30] 缓存 `viewState.path`，下次依赖未变时 React 编译产物可直接复用。
      $[30] = viewState.path;
      // $[31] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[31] = t16;
    } else {
      // t16 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[31];
    }
    // 返回 `t16`，作为命令处理这次计算的结果。
    return t16;
  }
  // 当 `viewState.type` 匹配 `"marketplace-menu"` 时，命令处理执行对应分支。
  if (viewState.type === "marketplace-menu") {
    // setViewState 写入新的状态值，使命令处理后续读取保持一致。
    setViewState({
      type: "menu"
    });
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // 当 `viewState.type` 匹配 `"marketplace-list"` 时，命令处理执行对应分支。
  if (viewState.type === "marketplace-list") {
    // t16 暂存 `<MarketplaceList onComplete={onComplete} />` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[32] !== onComplete) {
      // t16 暂存 `<MarketplaceList onComplete={onComplete} />` 生成的渲染片段，后续返回路径直接复用。
      t16 = <MarketplaceList onComplete={onComplete} />;
      // $[32] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
      $[32] = onComplete;
      // $[33] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[33] = t16;
    } else {
      // t16 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[33];
    }
    // 返回 `t16`，作为命令处理这次计算的结果。
    return t16;
  }
  // 当 `viewState.type` 匹配 `"add-marketplace"` 时，命令处理执行对应分支。
  if (viewState.type === "add-marketplace") {
    // t16 暂存 `<AddMarketplace inputValue={inputValue} setInputValue={se...` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[34] !== cliMode || $[35] !== cursorOffset || $[36] !== error || $[37] !== inputValue || $[38] !== markPluginsChanged || $[39] !== result) {
      // t16 暂存 `<AddMarketplace inputValue={inputValue} setInputValue={se...` 生成的渲染片段，后续返回路径直接复用。
      t16 = <AddMarketplace inputValue={inputValue} setInputValue={setInputValue} cursorOffset={cursorOffset} setCursorOffset={setCursorOffset} error={error} setError={setError} result={result} setResult={setResult} setViewState={setViewState} onAddComplete={markPluginsChanged} cliMode={cliMode} />;
      // $[34] 缓存 `cliMode`，下次依赖未变时 React 编译产物可直接复用。
      $[34] = cliMode;
      // $[35] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
      $[35] = cursorOffset;
      // $[36] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
      $[36] = error;
      // $[37] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
      $[37] = inputValue;
      // $[38] 缓存 `markPluginsChanged`，下次依赖未变时 React 编译产物可直接复用。
      $[38] = markPluginsChanged;
      // $[39] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
      $[39] = result;
      // $[40] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[40] = t16;
    } else {
      // t16 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[40];
    }
    // 返回 `t16`，作为命令处理这次计算的结果。
    return t16;
  }
  // t16 暂存 `showMcpRedirectMessage && activeTab === "installed" ? <Mc...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[41] !== activeTab || $[42] !== showMcpRedirectMessage) {
    // t16 暂存 `showMcpRedirectMessage && activeTab === "installed" ? <Mc...` 生成的渲染片段，后续返回路径直接复用。
    t16 = showMcpRedirectMessage && activeTab === "installed" ? <McpRedirectBanner /> : undefined;
    // $[41] 缓存 `activeTab`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = activeTab;
    // $[42] 缓存 `showMcpRedirectMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = showMcpRedirectMessage;
    // $[43] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[43];
  }
  // t17 暂存 `<Tab id="discover" title="Discover">{viewState.type === "...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[44] !== error || $[45] !== markPluginsChanged || $[46] !== result || $[47] !== viewState.targetMarketplace || $[48] !== viewState.targetPlugin || $[49] !== viewState.type) {
    // t17 暂存 `<Tab id="discover" title="Discover">{viewState.type === "...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Tab id="discover" title="Discover">{viewState.type === "browse-marketplace" ? <BrowseMarketplace error={error} setError={setError} result={result} setResult={setResult} setViewState={setViewState} onInstallComplete={markPluginsChanged} targetMarketplace={viewState.targetMarketplace} targetPlugin={viewState.targetPlugin} /> : <DiscoverPlugins error={error} setError={setError} result={result} setResult={setResult} setViewState={setViewState} onInstallComplete={markPluginsChanged} onSearchModeChange={setChildSearchActive} targetPlugin={viewState.type === "discover-plugins" ? viewState.targetPlugin : undefined} />}</Tab>;
    // $[44] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = error;
    // $[45] 缓存 `markPluginsChanged`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = markPluginsChanged;
    // $[46] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = result;
    // $[47] 缓存 `viewState.targetMarketplace`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = viewState.targetMarketplace;
    // $[48] 缓存 `viewState.targetPlugin`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = viewState.targetPlugin;
    // $[49] 缓存 `viewState.type`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = viewState.type;
    // $[50] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[50];
  }
  // t18标记插件命令界面 Plugin Settings是否启用对应路径。
  const t18 = viewState.type === "manage-plugins" ? viewState.targetPlugin : undefined;
  // t19标记插件命令界面 Plugin Settings是否启用对应路径。
  const t19 = viewState.type === "manage-plugins" ? viewState.targetMarketplace : undefined;
  // t20标记插件命令界面 Plugin Settings是否启用对应路径。
  const t20 = viewState.type === "manage-plugins" ? viewState.action : undefined;
  // t21 暂存 `<Tab id="installed" title="Installed"><ManagePlugins setV...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[51] !== markPluginsChanged || $[52] !== t18 || $[53] !== t19 || $[54] !== t20) {
    // t21 暂存 `<Tab id="installed" title="Installed"><ManagePlugins setV...` 生成的渲染片段，后续返回路径直接复用。
    t21 = <Tab id="installed" title="Installed"><ManagePlugins setViewState={setViewState} setResult={setResult} onManageComplete={markPluginsChanged} onSearchModeChange={setChildSearchActive} targetPlugin={t18} targetMarketplace={t19} action={t20} /></Tab>;
    // $[51] 缓存 `markPluginsChanged`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = markPluginsChanged;
    // $[52] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t18;
    // $[53] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t19;
    // $[54] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = t20;
    // $[55] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[55] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[55];
  }
  // t22标记插件命令界面 Plugin Settings是否启用对应路径。
  const t22 = viewState.type === "manage-marketplaces" ? viewState.targetMarketplace : undefined;
  // t23标记插件命令界面 Plugin Settings是否启用对应路径。
  const t23 = viewState.type === "manage-marketplaces" ? viewState.action : undefined;
  // t24 暂存 `<Tab id="marketplaces" title="Marketplaces"><ManageMarket...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[56] !== error || $[57] !== exitState || $[58] !== markPluginsChanged || $[59] !== t22 || $[60] !== t23) {
    // t24 暂存 `<Tab id="marketplaces" title="Marketplaces"><ManageMarket...` 生成的渲染片段，后续返回路径直接复用。
    t24 = <Tab id="marketplaces" title="Marketplaces"><ManageMarketplaces setViewState={setViewState} error={error} setError={setError} setResult={setResult} exitState={exitState} onManageComplete={markPluginsChanged} targetMarketplace={t22} action={t23} /></Tab>;
    // $[56] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = error;
    // $[57] 缓存 `exitState`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = exitState;
    // $[58] 缓存 `markPluginsChanged`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = markPluginsChanged;
    // $[59] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = t22;
    // $[60] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = t23;
    // $[61] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[61] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[61];
  }
  // t25 暂存 `<ErrorsTabContent setViewState={setViewState} setActiveTa...` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[62] !== markPluginsChanged) {
    // t25 暂存 `<ErrorsTabContent setViewState={setViewState} setActiveTa...` 生成的渲染片段，后续返回路径直接复用。
    t25 = <ErrorsTabContent setViewState={setViewState} setActiveTab={setActiveTab} markPluginsChanged={markPluginsChanged} />;
    // $[62] 缓存 `markPluginsChanged`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = markPluginsChanged;
    // $[63] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = t25;
  } else {
    // t25 从 React 编译缓存槽 $[63] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[63];
  }
  // t26 暂存 `<Tab id="errors" title={errorsTabTitle}>{t25}</Tab>` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[64] !== errorsTabTitle || $[65] !== t25) {
    // t26 暂存 `<Tab id="errors" title={errorsTabTitle}>{t25}</Tab>` 生成的渲染片段，后续返回路径直接复用。
    t26 = <Tab id="errors" title={errorsTabTitle}>{t25}</Tab>;
    // $[64] 缓存 `errorsTabTitle`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = errorsTabTitle;
    // $[65] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = t25;
    // $[66] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[66] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[66];
  }
  // t27 暂存 `<Pane color="suggestion"><Tabs title="Plugins" selectedTa...` 的派生结果，便于缓存命中时直接复用。
  let t27;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[67] !== activeTab || $[68] !== childSearchActive || $[69] !== t16 || $[70] !== t17 || $[71] !== t21 || $[72] !== t24 || $[73] !== t26) {
    // t27 暂存 `<Pane color="suggestion"><Tabs title="Plugins" selectedTa...` 生成的渲染片段，后续返回路径直接复用。
    t27 = <Pane color="suggestion"><Tabs title="Plugins" selectedTab={activeTab} onTabChange={handleTabChange} color="suggestion" disableNavigation={childSearchActive} banner={t16}>{t17}{t21}{t24}{t26}</Tabs></Pane>;
    // $[67] 缓存 `activeTab`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = activeTab;
    // $[68] 缓存 `childSearchActive`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = childSearchActive;
    // $[69] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = t16;
    // $[70] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = t17;
    // $[71] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = t21;
    // $[72] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = t24;
    // $[73] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = t26;
    // $[74] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = t27;
  } else {
    // t27 从 React 编译缓存槽 $[74] 取回渲染片段，避免依赖未变时重建 JSX。
    t27 = $[74];
  }
  // 返回 `t27`，作为命令处理这次计算的结果。
  return t27;
}
// _temp1 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp1(prev) {
  // 返回 `prev.plugins.needsRefresh ? prev : {`，作为命令处理这次计算的结果。
  return prev.plugins.needsRefresh ? prev : {
    ...prev,
    plugins: {
      ...prev.plugins,
      needsRefresh: true
    }
  };
}
// _temp0 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp0(s) {
  // count 数量保存 `s.plugins.errors.length` 的判断结果，供插件命令界面 Plugin Settings后续分支直接复用。
  let count = s.plugins.errors.length;
  // 按顺序遍历 `s.plugins.installationStatus.marketpla` 中的m，逐个交给命令处理处理。
  for (const m of s.plugins.installationStatus.marketplaces) {
    // 当 `m.status` 匹配 `"failed"` 时，命令处理执行对应分支。
    if (m.status === "failed") {
      // 插件命令界面 Plugin Settings在这里处理 `count++`，完成这一小步状态转换。
      count++;
    }
  }
  // 返回 `count`，作为命令处理这次计算的结果。
  return count;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IiwiQnlsaW5lIiwiUGFuZSIsIlRhYiIsIlRhYnMiLCJ1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZyIsInVzZUtleWJpbmRpbmdzIiwidXNlQXBwU3RhdGUiLCJ1c2VTZXRBcHBTdGF0ZSIsIlBsdWdpbkVycm9yIiwiZXJyb3JNZXNzYWdlIiwiY2xlYXJBbGxDYWNoZXMiLCJsb2FkTWFya2V0cGxhY2VzV2l0aEdyYWNlZnVsRGVncmFkYXRpb24iLCJsb2FkS25vd25NYXJrZXRwbGFjZXNDb25maWciLCJyZW1vdmVNYXJrZXRwbGFjZVNvdXJjZSIsImdldFBsdWdpbkVkaXRhYmxlU2NvcGVzIiwiRWRpdGFibGVTZXR0aW5nU291cmNlIiwiZ2V0U2V0dGluZ3NGb3JTb3VyY2UiLCJ1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSIsIkFkZE1hcmtldHBsYWNlIiwiQnJvd3NlTWFya2V0cGxhY2UiLCJEaXNjb3ZlclBsdWdpbnMiLCJNYW5hZ2VNYXJrZXRwbGFjZXMiLCJNYW5hZ2VQbHVnaW5zIiwiZm9ybWF0RXJyb3JNZXNzYWdlIiwiZ2V0RXJyb3JHdWlkYW5jZSIsIlBhcnNlZENvbW1hbmQiLCJwYXJzZVBsdWdpbkFyZ3MiLCJQbHVnaW5TZXR0aW5nc1Byb3BzIiwiVmlld1N0YXRlIiwiVmFsaWRhdGVQbHVnaW4iLCJUYWJJZCIsIk1hcmtldHBsYWNlTGlzdCIsInQwIiwiJCIsIl9jIiwib25Db21wbGV0ZSIsInQxIiwidDIiLCJsb2FkTGlzdCIsImNvbmZpZyIsIm5hbWVzIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsIm1hcCIsIl90ZW1wIiwiam9pbiIsInQzIiwiZXJyIiwiU3ltYm9sIiwiZm9yIiwibiIsIk1jcFJlZGlyZWN0QmFubmVyIiwiRXJyb3JSb3dBY3Rpb24iLCJraW5kIiwidGFiIiwidmlld1N0YXRlIiwibmFtZSIsInNvdXJjZXMiLCJBcnJheSIsInNvdXJjZSIsInNjb3BlIiwiRXJyb3JSb3ciLCJsYWJlbCIsIm1lc3NhZ2UiLCJndWlkYW5jZSIsImFjdGlvbiIsImdldEV4dHJhTWFya2V0cGxhY2VTb3VyY2VJbmZvIiwiZWRpdGFibGVTb3VyY2VzIiwiaXNJblBvbGljeSIsInNvdXJjZXNUb0NoZWNrIiwiY29uc3QiLCJzZXR0aW5ncyIsImV4dHJhS25vd25NYXJrZXRwbGFjZXMiLCJwdXNoIiwicG9saWN5U2V0dGluZ3MiLCJCb29sZWFuIiwiYnVpbGRNYXJrZXRwbGFjZUFjdGlvbiIsInR5cGUiLCJ0YXJnZXRNYXJrZXRwbGFjZSIsImJ1aWxkUGx1Z2luQWN0aW9uIiwicGx1Z2luTmFtZSIsInRhcmdldFBsdWdpbiIsIlRSQU5TSUVOVF9FUlJPUl9UWVBFUyIsIlNldCIsImlzVHJhbnNpZW50RXJyb3IiLCJlcnJvciIsImhhcyIsImdldFBsdWdpbk5hbWVGcm9tRXJyb3IiLCJwbHVnaW5JZCIsInBsdWdpbiIsImluY2x1ZGVzIiwic3BsaXQiLCJ1bmRlZmluZWQiLCJidWlsZEVycm9yUm93cyIsImZhaWxlZE1hcmtldHBsYWNlcyIsImV4dHJhTWFya2V0cGxhY2VFcnJvcnMiLCJwbHVnaW5Mb2FkaW5nRXJyb3JzIiwib3RoZXJFcnJvcnMiLCJicm9rZW5JbnN0YWxsZWRNYXJrZXRwbGFjZXMiLCJ0cmFuc2llbnRFcnJvcnMiLCJwbHVnaW5TY29wZXMiLCJNYXAiLCJyb3dzIiwic2hvd25NYXJrZXRwbGFjZU5hbWVzIiwibSIsImFkZCIsInNvdXJjZUluZm8iLCJlIiwibWFya2V0cGxhY2UiLCJzaG93blBsdWdpbk5hbWVzIiwiZ2V0IiwicmVtb3ZlRXh0cmFNYXJrZXRwbGFjZSIsInVwZGF0ZXMiLCJSZWNvcmQiLCJlbmFibGVkUGx1Z2lucyIsInN1ZmZpeCIsInJlbW92ZWRQbHVnaW5zIiwidXBkYXRlZFBsdWdpbnMiLCJlbmRzV2l0aCIsIkVycm9yc1RhYkNvbnRlbnQiLCJzZXRWaWV3U3RhdGUiLCJzZXRBY3RpdmVUYWIiLCJtYXJrUGx1Z2luc0NoYW5nZWQiLCJlcnJvcnMiLCJfdGVtcDIiLCJpbnN0YWxsYXRpb25TdGF0dXMiLCJfdGVtcDMiLCJzZXRBcHBTdGF0ZSIsInNlbGVjdGVkSW5kZXgiLCJzZXRTZWxlY3RlZEluZGV4IiwiYWN0aW9uTWVzc2FnZSIsInNldEFjdGlvbk1lc3NhZ2UiLCJtYXJrZXRwbGFjZUxvYWRGYWlsdXJlcyIsInNldE1hcmtldHBsYWNlTG9hZEZhaWx1cmVzIiwiZmFpbHVyZXMiLCJtYXJrZXRwbGFjZXMiLCJmaWx0ZXIiLCJfdGVtcDQiLCJmYWlsZWRNYXJrZXRwbGFjZU5hbWVzIiwiX3RlbXA1IiwiX3RlbXA2IiwiX3RlbXA3IiwidDQiLCJ0NSIsImNvbnRleHQiLCJoYW5kbGVTZWxlY3QiLCJyb3ciLCJiYjc3Iiwic2NvcGVzIiwiX3RlbXA4IiwicHJldl8wIiwicHJldiIsInBsdWdpbnMiLCJlXzIiLCJtXzEiLCJ0aWNrIiwiZiIsInQ2IiwiRXJyb3IiLCJTdHJpbmciLCJ0NyIsIl90ZW1wOSIsInQ4IiwidDkiLCJpc0FjdGl2ZSIsInNlbGVjdDpuZXh0IiwicHJldl8yIiwiTWF0aCIsIm1pbiIsImNsYW1wZWRJbmRleCIsIm1heCIsInNlbGVjdGVkQWN0aW9uIiwiaGFzQWN0aW9uIiwidDEwIiwidDExIiwiVDAiLCJyb3dfMCIsImlkeCIsImlzU2VsZWN0ZWQiLCJwb2ludGVyIiwiY3Jvc3MiLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJ0MTYiLCJ0MTciLCJ0MTgiLCJwcmV2XzEiLCJzXzEiLCJzIiwiZV8xIiwiZV8wIiwibV8wIiwic3RhdHVzIiwic18wIiwiZ2V0SW5pdGlhbFZpZXdTdGF0ZSIsInBhcnNlZENvbW1hbmQiLCJwYXRoIiwiaW5pdGlhbFZhbHVlIiwidGFyZ2V0IiwiZ2V0SW5pdGlhbFRhYiIsIlBsdWdpblNldHRpbmdzIiwiYXJncyIsInNob3dNY3BSZWRpcmVjdE1lc3NhZ2UiLCJpbml0aWFsVmlld1N0YXRlIiwiYWN0aXZlVGFiIiwiaW5wdXRWYWx1ZSIsInNldElucHV0VmFsdWUiLCJjdXJzb3JPZmZzZXQiLCJzZXRDdXJzb3JPZmZzZXQiLCJzZXRFcnJvciIsInJlc3VsdCIsInNldFJlc3VsdCIsImNoaWxkU2VhcmNoQWN0aXZlIiwic2V0Q2hpbGRTZWFyY2hBY3RpdmUiLCJwbHVnaW5FcnJvckNvdW50IiwiX3RlbXAwIiwiZXJyb3JzVGFiVGl0bGUiLCJleGl0U3RhdGUiLCJjbGlNb2RlIiwiX3RlbXAxIiwidGFiSWQiLCJiYjM3IiwiaGFuZGxlVGFiQ2hhbmdlIiwiaGFuZGxlQWRkTWFya2V0cGxhY2VFc2NhcGUiLCJ0MTkiLCJ0MjAiLCJ0MjEiLCJ0MjIiLCJ0MjMiLCJ0MjQiLCJ0MjUiLCJ0MjYiLCJ0MjciLCJuZWVkc1JlZnJlc2giLCJjb3VudCJdLCJzb3VyY2VzIjpbIlBsdWdpblNldHRpbmdzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db25maWd1cmFibGVTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL2Rlc2lnbi1zeXN0ZW0vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgUGFuZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvZGVzaWduLXN5c3RlbS9QYW5lLmpzJ1xuaW1wb3J0IHsgVGFiLCBUYWJzIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9kZXNpZ24tc3lzdGVtL1RhYnMuanMnXG5pbXBvcnQgeyB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MgfSBmcm9tICcuLi8uLi9ob29rcy91c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQge1xuICB1c2VLZXliaW5kaW5nLFxuICB1c2VLZXliaW5kaW5ncyxcbn0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlLCB1c2VTZXRBcHBTdGF0ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBQbHVnaW5FcnJvciB9IGZyb20gJy4uLy4uL3R5cGVzL3BsdWdpbi5qcydcbmltcG9ydCB7IGVycm9yTWVzc2FnZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9ycy5qcydcbmltcG9ydCB7IGNsZWFyQWxsQ2FjaGVzIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGx1Z2lucy9jYWNoZVV0aWxzLmpzJ1xuaW1wb3J0IHsgbG9hZE1hcmtldHBsYWNlc1dpdGhHcmFjZWZ1bERlZ3JhZGF0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGx1Z2lucy9tYXJrZXRwbGFjZUhlbHBlcnMuanMnXG5pbXBvcnQge1xuICBsb2FkS25vd25NYXJrZXRwbGFjZXNDb25maWcsXG4gIHJlbW92ZU1hcmtldHBsYWNlU291cmNlLFxufSBmcm9tICcuLi8uLi91dGlscy9wbHVnaW5zL21hcmtldHBsYWNlTWFuYWdlci5qcydcbmltcG9ydCB7IGdldFBsdWdpbkVkaXRhYmxlU2NvcGVzIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGx1Z2lucy9wbHVnaW5TdGFydHVwQ2hlY2suanMnXG5pbXBvcnQgdHlwZSB7IEVkaXRhYmxlU2V0dGluZ1NvdXJjZSB9IGZyb20gJy4uLy4uL3V0aWxzL3NldHRpbmdzL2NvbnN0YW50cy5qcydcbmltcG9ydCB7XG4gIGdldFNldHRpbmdzRm9yU291cmNlLFxuICB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvc2V0dGluZ3Mvc2V0dGluZ3MuanMnXG5pbXBvcnQgeyBBZGRNYXJrZXRwbGFjZSB9IGZyb20gJy4vQWRkTWFya2V0cGxhY2UuanMnXG5pbXBvcnQgeyBCcm93c2VNYXJrZXRwbGFjZSB9IGZyb20gJy4vQnJvd3NlTWFya2V0cGxhY2UuanMnXG5pbXBvcnQgeyBEaXNjb3ZlclBsdWdpbnMgfSBmcm9tICcuL0Rpc2NvdmVyUGx1Z2lucy5qcydcbmltcG9ydCB7IE1hbmFnZU1hcmtldHBsYWNlcyB9IGZyb20gJy4vTWFuYWdlTWFya2V0cGxhY2VzLmpzJ1xuaW1wb3J0IHsgTWFuYWdlUGx1Z2lucyB9IGZyb20gJy4vTWFuYWdlUGx1Z2lucy5qcydcbmltcG9ydCB7IGZvcm1hdEVycm9yTWVzc2FnZSwgZ2V0RXJyb3JHdWlkYW5jZSB9IGZyb20gJy4vUGx1Z2luRXJyb3JzLmpzJ1xuaW1wb3J0IHsgdHlwZSBQYXJzZWRDb21tYW5kLCBwYXJzZVBsdWdpbkFyZ3MgfSBmcm9tICcuL3BhcnNlQXJncy5qcydcbmltcG9ydCB0eXBlIHsgUGx1Z2luU2V0dGluZ3NQcm9wcywgVmlld1N0YXRlIH0gZnJvbSAnLi90eXBlcy5qcydcbmltcG9ydCB7IFZhbGlkYXRlUGx1Z2luIH0gZnJvbSAnLi9WYWxpZGF0ZVBsdWdpbi5qcydcblxudHlwZSBUYWJJZCA9ICdkaXNjb3ZlcicgfCAnaW5zdGFsbGVkJyB8ICdtYXJrZXRwbGFjZXMnIHwgJ2Vycm9ycydcblxuZnVuY3Rpb24gTWFya2V0cGxhY2VMaXN0KHtcbiAgb25Db21wbGV0ZSxcbn06IHtcbiAgb25Db21wbGV0ZTogKHJlc3VsdD86IHN0cmluZykgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYXN5bmMgZnVuY3Rpb24gbG9hZExpc3QoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb25maWcgPSBhd2FpdCBsb2FkS25vd25NYXJrZXRwbGFjZXNDb25maWcoKVxuICAgICAgICBjb25zdCBuYW1lcyA9IE9iamVjdC5rZXlzKGNvbmZpZylcblxuICAgICAgICBpZiAobmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgb25Db21wbGV0ZSgnTm8gbWFya2V0cGxhY2VzIGNvbmZpZ3VyZWQnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9uQ29tcGxldGUoXG4gICAgICAgICAgICBgQ29uZmlndXJlZCBtYXJrZXRwbGFjZXM6XFxuJHtuYW1lcy5tYXAobiA9PiBgICDigKIgJHtufWApLmpvaW4oJ1xcbicpfWAsXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgb25Db21wbGV0ZShgRXJyb3IgbG9hZGluZyBtYXJrZXRwbGFjZXM6ICR7ZXJyb3JNZXNzYWdlKGVycil9YClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2b2lkIGxvYWRMaXN0KClcbiAgfSwgW29uQ29tcGxldGVdKVxuXG4gIHJldHVybiA8VGV4dD5Mb2FkaW5nIG1hcmtldHBsYWNlcy4uLjwvVGV4dD5cbn1cblxuZnVuY3Rpb24gTWNwUmVkaXJlY3RCYW5uZXIoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKFwiZXh0ZXJuYWxcIiAhPT0gJ2FudCcpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICBmbGV4RGlyZWN0aW9uPVwicm93XCJcbiAgICAgIGFsaWduSXRlbXM9XCJmbGV4LXN0YXJ0XCJcbiAgICAgIHBhZGRpbmdMZWZ0PXsxfVxuICAgICAgbWFyZ2luVG9wPXsxfVxuICAgICAgYm9yZGVyTGVmdFxuICAgICAgYm9yZGVyUmlnaHQ9e2ZhbHNlfVxuICAgICAgYm9yZGVyVG9wPXtmYWxzZX1cbiAgICAgIGJvcmRlckJvdHRvbT17ZmFsc2V9XG4gICAgICBib3JkZXJDb2xvcj1cInBlcm1pc3Npb25cIlxuICAgICAgYm9yZGVyU3R5bGU9XCJzaW5nbGVcIlxuICAgID5cbiAgICAgIDxCb3ggZmxleFNocmluaz17MH0+XG4gICAgICAgIDxUZXh0IGJvbGQgaXRhbGljIGNvbG9yPVwicGVybWlzc2lvblwiPlxuICAgICAgICAgIGl7JyAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIDxUZXh0PlxuICAgICAgICBbQU5ULU9OTFldIE1DUCBzZXJ2ZXJzIGFyZSBub3cgbWFuYWdlZCBpbiAvcGx1Z2lucy4gVXNlIC9tY3Agbm8tcmVkaXJlY3RcbiAgICAgICAgdG8gdGVzdCBvbGQgVUlcbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuXG50eXBlIEVycm9yUm93QWN0aW9uID1cbiAgfCB7IGtpbmQ6ICduYXZpZ2F0ZSc7IHRhYjogVGFiSWQ7IHZpZXdTdGF0ZTogVmlld1N0YXRlIH1cbiAgfCB7XG4gICAgICBraW5kOiAncmVtb3ZlLWV4dHJhLW1hcmtldHBsYWNlJ1xuICAgICAgbmFtZTogc3RyaW5nXG4gICAgICBzb3VyY2VzOiBBcnJheTx7IHNvdXJjZTogRWRpdGFibGVTZXR0aW5nU291cmNlOyBzY29wZTogc3RyaW5nIH0+XG4gICAgfVxuICB8IHsga2luZDogJ3JlbW92ZS1pbnN0YWxsZWQtbWFya2V0cGxhY2UnOyBuYW1lOiBzdHJpbmcgfVxuICB8IHsga2luZDogJ21hbmFnZWQtb25seSc7IG5hbWU6IHN0cmluZyB9XG4gIHwgeyBraW5kOiAnbm9uZScgfVxuXG50eXBlIEVycm9yUm93ID0ge1xuICBsYWJlbDogc3RyaW5nXG4gIG1lc3NhZ2U6IHN0cmluZ1xuICBndWlkYW5jZT86IHN0cmluZyB8IG51bGxcbiAgYWN0aW9uOiBFcnJvclJvd0FjdGlvblxuICBzY29wZT86IHN0cmluZ1xufVxuXG4vKipcbiAqIERldGVybWluZSB3aGljaCBzZXR0aW5ncyBzb3VyY2VzIGRlZmluZSBhbiBleHRyYUtub3duTWFya2V0cGxhY2UgZW50cnkuXG4gKiBSZXR1cm5zIHRoZSBlZGl0YWJsZSBzb3VyY2VzICh1c2VyL3Byb2plY3QvbG9jYWwpIGFuZCB3aGV0aGVyIHBvbGljeSBhbHNvIGhhcyBpdC5cbiAqL1xuZnVuY3Rpb24gZ2V0RXh0cmFNYXJrZXRwbGFjZVNvdXJjZUluZm8obmFtZTogc3RyaW5nKToge1xuICBlZGl0YWJsZVNvdXJjZXM6IEFycmF5PHsgc291cmNlOiBFZGl0YWJsZVNldHRpbmdTb3VyY2U7IHNjb3BlOiBzdHJpbmcgfT5cbiAgaXNJblBvbGljeTogYm9vbGVhblxufSB7XG4gIGNvbnN0IGVkaXRhYmxlU291cmNlczogQXJyYXk8e1xuICAgIHNvdXJjZTogRWRpdGFibGVTZXR0aW5nU291cmNlXG4gICAgc2NvcGU6IHN0cmluZ1xuICB9PiA9IFtdXG5cbiAgY29uc3Qgc291cmNlc1RvQ2hlY2sgPSBbXG4gICAgeyBzb3VyY2U6ICd1c2VyU2V0dGluZ3MnIGFzIGNvbnN0LCBzY29wZTogJ3VzZXInIH0sXG4gICAgeyBzb3VyY2U6ICdwcm9qZWN0U2V0dGluZ3MnIGFzIGNvbnN0LCBzY29wZTogJ3Byb2plY3QnIH0sXG4gICAgeyBzb3VyY2U6ICdsb2NhbFNldHRpbmdzJyBhcyBjb25zdCwgc2NvcGU6ICdsb2NhbCcgfSxcbiAgXVxuXG4gIGZvciAoY29uc3QgeyBzb3VyY2UsIHNjb3BlIH0gb2Ygc291cmNlc1RvQ2hlY2spIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IGdldFNldHRpbmdzRm9yU291cmNlKHNvdXJjZSlcbiAgICBpZiAoc2V0dGluZ3M/LmV4dHJhS25vd25NYXJrZXRwbGFjZXM/LltuYW1lXSkge1xuICAgICAgZWRpdGFibGVTb3VyY2VzLnB1c2goeyBzb3VyY2UsIHNjb3BlIH0pXG4gICAgfVxuICB9XG5cbiAgY29uc3QgcG9saWN5U2V0dGluZ3MgPSBnZXRTZXR0aW5nc0ZvclNvdXJjZSgncG9saWN5U2V0dGluZ3MnKVxuICBjb25zdCBpc0luUG9saWN5ID0gQm9vbGVhbihwb2xpY3lTZXR0aW5ncz8uZXh0cmFLbm93bk1hcmtldHBsYWNlcz8uW25hbWVdKVxuXG4gIHJldHVybiB7IGVkaXRhYmxlU291cmNlcywgaXNJblBvbGljeSB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkTWFya2V0cGxhY2VBY3Rpb24obmFtZTogc3RyaW5nKTogRXJyb3JSb3dBY3Rpb24ge1xuICBjb25zdCB7IGVkaXRhYmxlU291cmNlcywgaXNJblBvbGljeSB9ID0gZ2V0RXh0cmFNYXJrZXRwbGFjZVNvdXJjZUluZm8obmFtZSlcblxuICBpZiAoZWRpdGFibGVTb3VyY2VzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAga2luZDogJ3JlbW92ZS1leHRyYS1tYXJrZXRwbGFjZScsXG4gICAgICBuYW1lLFxuICAgICAgc291cmNlczogZWRpdGFibGVTb3VyY2VzLFxuICAgIH1cbiAgfVxuXG4gIGlmIChpc0luUG9saWN5KSB7XG4gICAgcmV0dXJuIHsga2luZDogJ21hbmFnZWQtb25seScsIG5hbWUgfVxuICB9XG5cbiAgLy8gTWFya2V0cGxhY2UgaXMgaW4ga25vd25fbWFya2V0cGxhY2VzLmpzb24gYnV0IG5vdCBpbiBleHRyYUtub3duTWFya2V0cGxhY2VzXG4gIC8vIChlLmcuIHByZXZpb3VzbHkgaW5zdGFsbGVkIG1hbnVhbGx5KSDigJQgcm91dGUgdG8gTWFuYWdlTWFya2V0cGxhY2VzXG4gIHJldHVybiB7XG4gICAga2luZDogJ25hdmlnYXRlJyxcbiAgICB0YWI6ICdtYXJrZXRwbGFjZXMnLFxuICAgIHZpZXdTdGF0ZToge1xuICAgICAgdHlwZTogJ21hbmFnZS1tYXJrZXRwbGFjZXMnLFxuICAgICAgdGFyZ2V0TWFya2V0cGxhY2U6IG5hbWUsXG4gICAgICBhY3Rpb246ICdyZW1vdmUnLFxuICAgIH0sXG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRQbHVnaW5BY3Rpb24ocGx1Z2luTmFtZTogc3RyaW5nKTogRXJyb3JSb3dBY3Rpb24ge1xuICByZXR1cm4ge1xuICAgIGtpbmQ6ICduYXZpZ2F0ZScsXG4gICAgdGFiOiAnaW5zdGFsbGVkJyxcbiAgICB2aWV3U3RhdGU6IHtcbiAgICAgIHR5cGU6ICdtYW5hZ2UtcGx1Z2lucycsXG4gICAgICB0YXJnZXRQbHVnaW46IHBsdWdpbk5hbWUsXG4gICAgICBhY3Rpb246ICd1bmluc3RhbGwnLFxuICAgIH0sXG4gIH1cbn1cblxuY29uc3QgVFJBTlNJRU5UX0VSUk9SX1RZUEVTID0gbmV3IFNldChbXG4gICdnaXQtYXV0aC1mYWlsZWQnLFxuICAnZ2l0LXRpbWVvdXQnLFxuICAnbmV0d29yay1lcnJvcicsXG5dKVxuXG5mdW5jdGlvbiBpc1RyYW5zaWVudEVycm9yKGVycm9yOiBQbHVnaW5FcnJvcik6IGJvb2xlYW4ge1xuICByZXR1cm4gVFJBTlNJRU5UX0VSUk9SX1RZUEVTLmhhcyhlcnJvci50eXBlKVxufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHBsdWdpbiBuYW1lIGZyb20gYSBQbHVnaW5FcnJvciwgY2hlY2tpbmcgZXhwbGljaXQgZmllbGRzIGZpcnN0LFxuICogdGhlbiBmYWxsaW5nIGJhY2sgdG8gdGhlIHNvdXJjZSBmaWVsZCAoZm9ybWF0OiBcInBsdWdpbk5hbWVAbWFya2V0cGxhY2VcIikuXG4gKi9cbmZ1bmN0aW9uIGdldFBsdWdpbk5hbWVGcm9tRXJyb3IoZXJyb3I6IFBsdWdpbkVycm9yKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCdwbHVnaW5JZCcgaW4gZXJyb3IgJiYgZXJyb3IucGx1Z2luSWQpIHJldHVybiBlcnJvci5wbHVnaW5JZFxuICBpZiAoJ3BsdWdpbicgaW4gZXJyb3IgJiYgZXJyb3IucGx1Z2luKSByZXR1cm4gZXJyb3IucGx1Z2luXG4gIC8vIEZhbGxiYWNrOiBzb3VyY2Ugb2Z0ZW4gY29udGFpbnMgXCJwbHVnaW5OYW1lQG1hcmtldHBsYWNlXCJcbiAgaWYgKGVycm9yLnNvdXJjZS5pbmNsdWRlcygnQCcpKSByZXR1cm4gZXJyb3Iuc291cmNlLnNwbGl0KCdAJylbMF1cbiAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBidWlsZEVycm9yUm93cyhcbiAgZmFpbGVkTWFya2V0cGxhY2VzOiBBcnJheTx7IG5hbWU6IHN0cmluZzsgZXJyb3I/OiBzdHJpbmcgfT4sXG4gIGV4dHJhTWFya2V0cGxhY2VFcnJvcnM6IFBsdWdpbkVycm9yW10sXG4gIHBsdWdpbkxvYWRpbmdFcnJvcnM6IFBsdWdpbkVycm9yW10sXG4gIG90aGVyRXJyb3JzOiBQbHVnaW5FcnJvcltdLFxuICBicm9rZW5JbnN0YWxsZWRNYXJrZXRwbGFjZXM6IEFycmF5PHsgbmFtZTogc3RyaW5nOyBlcnJvcjogc3RyaW5nIH0+LFxuICB0cmFuc2llbnRFcnJvcnM6IFBsdWdpbkVycm9yW10sXG4gIHBsdWdpblNjb3BlczogTWFwPHN0cmluZywgc3RyaW5nPixcbik6IEVycm9yUm93W10ge1xuICBjb25zdCByb3dzOiBFcnJvclJvd1tdID0gW11cblxuICAvLyAtLS0gVHJhbnNpZW50IGVycm9ycyBhdCB0aGUgdG9wIChyZXN0YXJ0IHRvIHJldHJ5KSAtLS1cbiAgZm9yIChjb25zdCBlcnJvciBvZiB0cmFuc2llbnRFcnJvcnMpIHtcbiAgICBjb25zdCBwbHVnaW5OYW1lID1cbiAgICAgICdwbHVnaW5JZCcgaW4gZXJyb3JcbiAgICAgICAgPyBlcnJvci5wbHVnaW5JZFxuICAgICAgICA6ICdwbHVnaW4nIGluIGVycm9yXG4gICAgICAgICAgPyBlcnJvci5wbHVnaW5cbiAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgIHJvd3MucHVzaCh7XG4gICAgICBsYWJlbDogcGx1Z2luTmFtZSA/PyBlcnJvci5zb3VyY2UsXG4gICAgICBtZXNzYWdlOiBmb3JtYXRFcnJvck1lc3NhZ2UoZXJyb3IpLFxuICAgICAgZ3VpZGFuY2U6ICdSZXN0YXJ0IHRvIHJldHJ5IGxvYWRpbmcgcGx1Z2lucycsXG4gICAgICBhY3Rpb246IHsga2luZDogJ25vbmUnIH0sXG4gICAgfSlcbiAgfVxuXG4gIC8vIC0tLSBNYXJrZXRwbGFjZSBlcnJvcnMgLS0tXG4gIC8vIFRyYWNrIHNob3duIG1hcmtldHBsYWNlIG5hbWVzIHRvIGF2b2lkIGR1cGxpY2F0ZXMgYWNyb3NzIHNvdXJjZXNcbiAgY29uc3Qgc2hvd25NYXJrZXRwbGFjZU5hbWVzID0gbmV3IFNldDxzdHJpbmc+KClcblxuICBmb3IgKGNvbnN0IG0gb2YgZmFpbGVkTWFya2V0cGxhY2VzKSB7XG4gICAgc2hvd25NYXJrZXRwbGFjZU5hbWVzLmFkZChtLm5hbWUpXG4gICAgY29uc3QgYWN0aW9uID0gYnVpbGRNYXJrZXRwbGFjZUFjdGlvbihtLm5hbWUpXG4gICAgY29uc3Qgc291cmNlSW5mbyA9IGdldEV4dHJhTWFya2V0cGxhY2VTb3VyY2VJbmZvKG0ubmFtZSlcbiAgICBjb25zdCBzY29wZSA9IHNvdXJjZUluZm8uaXNJblBvbGljeVxuICAgICAgPyAnbWFuYWdlZCdcbiAgICAgIDogc291cmNlSW5mby5lZGl0YWJsZVNvdXJjZXNbMF0/LnNjb3BlXG4gICAgcm93cy5wdXNoKHtcbiAgICAgIGxhYmVsOiBtLm5hbWUsXG4gICAgICBtZXNzYWdlOiBtLmVycm9yID8/ICdJbnN0YWxsYXRpb24gZmFpbGVkJyxcbiAgICAgIGd1aWRhbmNlOlxuICAgICAgICBhY3Rpb24ua2luZCA9PT0gJ21hbmFnZWQtb25seSdcbiAgICAgICAgICA/ICdNYW5hZ2VkIGJ5IHlvdXIgb3JnYW5pemF0aW9uIOKAlCBjb250YWN0IHlvdXIgYWRtaW4nXG4gICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBhY3Rpb24sXG4gICAgICBzY29wZSxcbiAgICB9KVxuICB9XG5cbiAgZm9yIChjb25zdCBlIG9mIGV4dHJhTWFya2V0cGxhY2VFcnJvcnMpIHtcbiAgICBjb25zdCBtYXJrZXRwbGFjZSA9ICdtYXJrZXRwbGFjZScgaW4gZSA/IGUubWFya2V0cGxhY2UgOiBlLnNvdXJjZVxuICAgIGlmIChzaG93bk1hcmtldHBsYWNlTmFtZXMuaGFzKG1hcmtldHBsYWNlKSkgY29udGludWVcbiAgICBzaG93bk1hcmtldHBsYWNlTmFtZXMuYWRkKG1hcmtldHBsYWNlKVxuICAgIGNvbnN0IGFjdGlvbiA9IGJ1aWxkTWFya2V0cGxhY2VBY3Rpb24obWFya2V0cGxhY2UpXG4gICAgY29uc3Qgc291cmNlSW5mbyA9IGdldEV4dHJhTWFya2V0cGxhY2VTb3VyY2VJbmZvKG1hcmtldHBsYWNlKVxuICAgIGNvbnN0IHNjb3BlID0gc291cmNlSW5mby5pc0luUG9saWN5XG4gICAgICA/ICdtYW5hZ2VkJ1xuICAgICAgOiBzb3VyY2VJbmZvLmVkaXRhYmxlU291cmNlc1swXT8uc2NvcGVcbiAgICByb3dzLnB1c2goe1xuICAgICAgbGFiZWw6IG1hcmtldHBsYWNlLFxuICAgICAgbWVzc2FnZTogZm9ybWF0RXJyb3JNZXNzYWdlKGUpLFxuICAgICAgZ3VpZGFuY2U6XG4gICAgICAgIGFjdGlvbi5raW5kID09PSAnbWFuYWdlZC1vbmx5J1xuICAgICAgICAgID8gJ01hbmFnZWQgYnkgeW91ciBvcmdhbml6YXRpb24g4oCUIGNvbnRhY3QgeW91ciBhZG1pbidcbiAgICAgICAgICA6IGdldEVycm9yR3VpZGFuY2UoZSksXG4gICAgICBhY3Rpb24sXG4gICAgICBzY29wZSxcbiAgICB9KVxuICB9XG5cbiAgLy8gSW5zdGFsbGVkIG1hcmtldHBsYWNlcyB0aGF0IGZhaWwgdG8gbG9hZCBkYXRhIChmcm9tIGtub3duX21hcmtldHBsYWNlcy5qc29uKVxuICBmb3IgKGNvbnN0IG0gb2YgYnJva2VuSW5zdGFsbGVkTWFya2V0cGxhY2VzKSB7XG4gICAgaWYgKHNob3duTWFya2V0cGxhY2VOYW1lcy5oYXMobS5uYW1lKSkgY29udGludWVcbiAgICBzaG93bk1hcmtldHBsYWNlTmFtZXMuYWRkKG0ubmFtZSlcbiAgICByb3dzLnB1c2goe1xuICAgICAgbGFiZWw6IG0ubmFtZSxcbiAgICAgIG1lc3NhZ2U6IG0uZXJyb3IsXG4gICAgICBhY3Rpb246IHsga2luZDogJ3JlbW92ZS1pbnN0YWxsZWQtbWFya2V0cGxhY2UnLCBuYW1lOiBtLm5hbWUgfSxcbiAgICB9KVxuICB9XG5cbiAgLy8gLS0tIFBsdWdpbiBlcnJvcnMgLS0tXG4gIGNvbnN0IHNob3duUGx1Z2luTmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICBmb3IgKGNvbnN0IGVycm9yIG9mIHBsdWdpbkxvYWRpbmdFcnJvcnMpIHtcbiAgICBjb25zdCBwbHVnaW5OYW1lID0gZ2V0UGx1Z2luTmFtZUZyb21FcnJvcihlcnJvcilcbiAgICBpZiAocGx1Z2luTmFtZSAmJiBzaG93blBsdWdpbk5hbWVzLmhhcyhwbHVnaW5OYW1lKSkgY29udGludWVcbiAgICBpZiAocGx1Z2luTmFtZSkgc2hvd25QbHVnaW5OYW1lcy5hZGQocGx1Z2luTmFtZSlcblxuICAgIGNvbnN0IG1hcmtldHBsYWNlID0gJ21hcmtldHBsYWNlJyBpbiBlcnJvciA/IGVycm9yLm1hcmtldHBsYWNlIDogdW5kZWZpbmVkXG4gICAgLy8gVHJ5IHBsdWdpbklkQG1hcmtldHBsYWNlIGZvcm1hdCBmaXJzdCwgdGhlbiBqdXN0IHBsdWdpbk5hbWVcbiAgICBjb25zdCBzY29wZSA9IHBsdWdpbk5hbWVcbiAgICAgID8gKHBsdWdpblNjb3Blcy5nZXQoZXJyb3Iuc291cmNlKSA/PyBwbHVnaW5TY29wZXMuZ2V0KHBsdWdpbk5hbWUpKVxuICAgICAgOiB1bmRlZmluZWRcbiAgICByb3dzLnB1c2goe1xuICAgICAgbGFiZWw6IHBsdWdpbk5hbWVcbiAgICAgICAgPyBtYXJrZXRwbGFjZVxuICAgICAgICAgID8gYCR7cGx1Z2luTmFtZX0gQCAke21hcmtldHBsYWNlfWBcbiAgICAgICAgICA6IHBsdWdpbk5hbWVcbiAgICAgICAgOiBlcnJvci5zb3VyY2UsXG4gICAgICBtZXNzYWdlOiBmb3JtYXRFcnJvck1lc3NhZ2UoZXJyb3IpLFxuICAgICAgZ3VpZGFuY2U6IGdldEVycm9yR3VpZGFuY2UoZXJyb3IpLFxuICAgICAgYWN0aW9uOiBwbHVnaW5OYW1lID8gYnVpbGRQbHVnaW5BY3Rpb24ocGx1Z2luTmFtZSkgOiB7IGtpbmQ6ICdub25lJyB9LFxuICAgICAgc2NvcGUsXG4gICAgfSlcbiAgfVxuXG4gIC8vIC0tLSBPdGhlciBlcnJvcnMgKG5vbi1tYXJrZXRwbGFjZSwgbm9uLXBsdWdpbi1zcGVjaWZpYykgLS0tXG4gIGZvciAoY29uc3QgZXJyb3Igb2Ygb3RoZXJFcnJvcnMpIHtcbiAgICByb3dzLnB1c2goe1xuICAgICAgbGFiZWw6IGVycm9yLnNvdXJjZSxcbiAgICAgIG1lc3NhZ2U6IGZvcm1hdEVycm9yTWVzc2FnZShlcnJvciksXG4gICAgICBndWlkYW5jZTogZ2V0RXJyb3JHdWlkYW5jZShlcnJvciksXG4gICAgICBhY3Rpb246IHsga2luZDogJ25vbmUnIH0sXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiByb3dzXG59XG5cbi8qKlxuICogUmVtb3ZlIGEgbWFya2V0cGxhY2UgZnJvbSBleHRyYUtub3duTWFya2V0cGxhY2VzIGluIHRoZSBnaXZlbiBzZXR0aW5ncyBzb3VyY2VzLFxuICogYW5kIGFsc28gcmVtb3ZlIGFueSBhc3NvY2lhdGVkIGVuYWJsZWQgcGx1Z2lucy5cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlRXh0cmFNYXJrZXRwbGFjZShcbiAgbmFtZTogc3RyaW5nLFxuICBzb3VyY2VzOiBBcnJheTx7IHNvdXJjZTogRWRpdGFibGVTZXR0aW5nU291cmNlIH0+LFxuKTogdm9pZCB7XG4gIGZvciAoY29uc3QgeyBzb3VyY2UgfSBvZiBzb3VyY2VzKSB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBnZXRTZXR0aW5nc0ZvclNvdXJjZShzb3VyY2UpXG4gICAgaWYgKCFzZXR0aW5ncykgY29udGludWVcblxuICAgIGNvbnN0IHVwZGF0ZXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge31cblxuICAgIC8vIFJlbW92ZSBmcm9tIGV4dHJhS25vd25NYXJrZXRwbGFjZXNcbiAgICBpZiAoc2V0dGluZ3MuZXh0cmFLbm93bk1hcmtldHBsYWNlcz8uW25hbWVdKSB7XG4gICAgICB1cGRhdGVzLmV4dHJhS25vd25NYXJrZXRwbGFjZXMgPSB7XG4gICAgICAgIC4uLnNldHRpbmdzLmV4dHJhS25vd25NYXJrZXRwbGFjZXMsXG4gICAgICAgIFtuYW1lXTogdW5kZWZpbmVkLFxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhc3NvY2lhdGVkIGVuYWJsZWQgcGx1Z2lucyAoZm9ybWF0OiBcInBsdWdpbkBtYXJrZXRwbGFjZVwiKVxuICAgIGlmIChzZXR0aW5ncy5lbmFibGVkUGx1Z2lucykge1xuICAgICAgY29uc3Qgc3VmZml4ID0gYEAke25hbWV9YFxuICAgICAgbGV0IHJlbW92ZWRQbHVnaW5zID0gZmFsc2VcbiAgICAgIGNvbnN0IHVwZGF0ZWRQbHVnaW5zID0geyAuLi5zZXR0aW5ncy5lbmFibGVkUGx1Z2lucyB9XG4gICAgICBmb3IgKGNvbnN0IHBsdWdpbklkIGluIHVwZGF0ZWRQbHVnaW5zKSB7XG4gICAgICAgIGlmIChwbHVnaW5JZC5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgICAgdXBkYXRlZFBsdWdpbnNbcGx1Z2luSWRdID0gdW5kZWZpbmVkXG4gICAgICAgICAgcmVtb3ZlZFBsdWdpbnMgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZW1vdmVkUGx1Z2lucykge1xuICAgICAgICB1cGRhdGVzLmVuYWJsZWRQbHVnaW5zID0gdXBkYXRlZFBsdWdpbnNcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LmtleXModXBkYXRlcykubGVuZ3RoID4gMCkge1xuICAgICAgdXBkYXRlU2V0dGluZ3NGb3JTb3VyY2Uoc291cmNlLCB1cGRhdGVzKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBFcnJvcnNUYWJDb250ZW50KHtcbiAgc2V0Vmlld1N0YXRlLFxuICBzZXRBY3RpdmVUYWIsXG4gIG1hcmtQbHVnaW5zQ2hhbmdlZCxcbn06IHtcbiAgc2V0Vmlld1N0YXRlOiAoc3RhdGU6IFZpZXdTdGF0ZSkgPT4gdm9pZFxuICBzZXRBY3RpdmVUYWI6ICh0YWI6IFRhYklkKSA9PiB2b2lkXG4gIG1hcmtQbHVnaW5zQ2hhbmdlZDogKCkgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGVycm9ycyA9IHVzZUFwcFN0YXRlKHMgPT4gcy5wbHVnaW5zLmVycm9ycylcbiAgY29uc3QgaW5zdGFsbGF0aW9uU3RhdHVzID0gdXNlQXBwU3RhdGUocyA9PiBzLnBsdWdpbnMuaW5zdGFsbGF0aW9uU3RhdHVzKVxuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcbiAgY29uc3QgW3NlbGVjdGVkSW5kZXgsIHNldFNlbGVjdGVkSW5kZXhdID0gdXNlU3RhdGUoMClcbiAgY29uc3QgW2FjdGlvbk1lc3NhZ2UsIHNldEFjdGlvbk1lc3NhZ2VdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW21hcmtldHBsYWNlTG9hZEZhaWx1cmVzLCBzZXRNYXJrZXRwbGFjZUxvYWRGYWlsdXJlc10gPSB1c2VTdGF0ZTxcbiAgICBBcnJheTx7IG5hbWU6IHN0cmluZzsgZXJyb3I6IHN0cmluZyB9PlxuICA+KFtdKVxuXG4gIC8vIERldGVjdCBtYXJrZXRwbGFjZXMgdGhhdCBhcmUgaW5zdGFsbGVkIGJ1dCBmYWlsIHRvIGxvYWQgdGhlaXIgZGF0YVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZvaWQgKGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGxvYWRLbm93bk1hcmtldHBsYWNlc0NvbmZpZygpXG4gICAgICAgIGNvbnN0IHsgZmFpbHVyZXMgfSA9XG4gICAgICAgICAgYXdhaXQgbG9hZE1hcmtldHBsYWNlc1dpdGhHcmFjZWZ1bERlZ3JhZGF0aW9uKGNvbmZpZylcbiAgICAgICAgc2V0TWFya2V0cGxhY2VMb2FkRmFpbHVyZXMoZmFpbHVyZXMpXG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gSWdub3JlIOKAlCBpZiB3ZSBjYW4ndCBsb2FkIGNvbmZpZywgb3RoZXIgdGFicyBoYW5kbGUgaXRcbiAgICAgIH1cbiAgICB9KSgpXG4gIH0sIFtdKVxuXG4gIGNvbnN0IGZhaWxlZE1hcmtldHBsYWNlcyA9IGluc3RhbGxhdGlvblN0YXR1cy5tYXJrZXRwbGFjZXMuZmlsdGVyKFxuICAgIG0gPT4gbS5zdGF0dXMgPT09ICdmYWlsZWQnLFxuICApXG4gIGNvbnN0IGZhaWxlZE1hcmtldHBsYWNlTmFtZXMgPSBuZXcgU2V0KGZhaWxlZE1hcmtldHBsYWNlcy5tYXAobSA9PiBtLm5hbWUpKVxuXG4gIC8vIFRyYW5zaWVudCBlcnJvcnMgKGdpdC9uZXR3b3JrKSDigJQgc2hvdyBhdCB0b3Agd2l0aCBcInJlc3RhcnQgdG8gcmV0cnlcIlxuICBjb25zdCB0cmFuc2llbnRFcnJvcnMgPSBlcnJvcnMuZmlsdGVyKGlzVHJhbnNpZW50RXJyb3IpXG5cbiAgLy8gTWFya2V0cGxhY2UtcmVsYXRlZCBsb2FkaW5nIGVycm9ycyBub3QgYWxyZWFkeSBjb3ZlcmVkIGJ5IGluc3RhbGwgZmFpbHVyZXNcbiAgY29uc3QgZXh0cmFNYXJrZXRwbGFjZUVycm9ycyA9IGVycm9ycy5maWx0ZXIoXG4gICAgZSA9PlxuICAgICAgKGUudHlwZSA9PT0gJ21hcmtldHBsYWNlLW5vdC1mb3VuZCcgfHxcbiAgICAgICAgZS50eXBlID09PSAnbWFya2V0cGxhY2UtbG9hZC1mYWlsZWQnIHx8XG4gICAgICAgIGUudHlwZSA9PT0gJ21hcmtldHBsYWNlLWJsb2NrZWQtYnktcG9saWN5JykgJiZcbiAgICAgICFmYWlsZWRNYXJrZXRwbGFjZU5hbWVzLmhhcyhlLm1hcmtldHBsYWNlKSxcbiAgKVxuXG4gIC8vIFBsdWdpbi1zcGVjaWZpYyBsb2FkaW5nIGVycm9yc1xuICBjb25zdCBwbHVnaW5Mb2FkaW5nRXJyb3JzID0gZXJyb3JzLmZpbHRlcihlID0+IHtcbiAgICBpZiAoaXNUcmFuc2llbnRFcnJvcihlKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKFxuICAgICAgZS50eXBlID09PSAnbWFya2V0cGxhY2Utbm90LWZvdW5kJyB8fFxuICAgICAgZS50eXBlID09PSAnbWFya2V0cGxhY2UtbG9hZC1mYWlsZWQnIHx8XG4gICAgICBlLnR5cGUgPT09ICdtYXJrZXRwbGFjZS1ibG9ja2VkLWJ5LXBvbGljeSdcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gZ2V0UGx1Z2luTmFtZUZyb21FcnJvcihlKSAhPT0gdW5kZWZpbmVkXG4gIH0pXG5cbiAgLy8gUmVtYWluaW5nIGVycm9ycyB3aXRoIG5vIHBsdWdpbiBhc3NvY2lhdGlvblxuICBjb25zdCBvdGhlckVycm9ycyA9IGVycm9ycy5maWx0ZXIoZSA9PiB7XG4gICAgaWYgKGlzVHJhbnNpZW50RXJyb3IoZSkpIHJldHVybiBmYWxzZVxuICAgIGlmIChcbiAgICAgIGUudHlwZSA9PT0gJ21hcmtldHBsYWNlLW5vdC1mb3VuZCcgfHxcbiAgICAgIGUudHlwZSA9PT0gJ21hcmtldHBsYWNlLWxvYWQtZmFpbGVkJyB8fFxuICAgICAgZS50eXBlID09PSAnbWFya2V0cGxhY2UtYmxvY2tlZC1ieS1wb2xpY3knXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIGdldFBsdWdpbk5hbWVGcm9tRXJyb3IoZSkgPT09IHVuZGVmaW5lZFxuICB9KVxuXG4gIGNvbnN0IHBsdWdpblNjb3BlcyA9IGdldFBsdWdpbkVkaXRhYmxlU2NvcGVzKClcbiAgY29uc3Qgcm93cyA9IGJ1aWxkRXJyb3JSb3dzKFxuICAgIGZhaWxlZE1hcmtldHBsYWNlcyxcbiAgICBleHRyYU1hcmtldHBsYWNlRXJyb3JzLFxuICAgIHBsdWdpbkxvYWRpbmdFcnJvcnMsXG4gICAgb3RoZXJFcnJvcnMsXG4gICAgbWFya2V0cGxhY2VMb2FkRmFpbHVyZXMsXG4gICAgdHJhbnNpZW50RXJyb3JzLFxuICAgIHBsdWdpblNjb3BlcyxcbiAgKVxuXG4gIC8vIEhhbmRsZSBlc2NhcGUgdG8gZXhpdCB0aGUgcGx1Z2luIG1lbnVcbiAgdXNlS2V5YmluZGluZyhcbiAgICAnY29uZmlybTpubycsXG4gICAgKCkgPT4ge1xuICAgICAgc2V0Vmlld1N0YXRlKHsgdHlwZTogJ21lbnUnIH0pXG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0sXG4gIClcblxuICBjb25zdCBoYW5kbGVTZWxlY3QgPSAoKSA9PiB7XG4gICAgY29uc3Qgcm93ID0gcm93c1tzZWxlY3RlZEluZGV4XVxuICAgIGlmICghcm93KSByZXR1cm5cbiAgICBjb25zdCB7IGFjdGlvbiB9ID0gcm93XG4gICAgc3dpdGNoIChhY3Rpb24ua2luZCkge1xuICAgICAgY2FzZSAnbmF2aWdhdGUnOlxuICAgICAgICBzZXRBY3RpdmVUYWIoYWN0aW9uLnRhYilcbiAgICAgICAgc2V0Vmlld1N0YXRlKGFjdGlvbi52aWV3U3RhdGUpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdyZW1vdmUtZXh0cmEtbWFya2V0cGxhY2UnOiB7XG4gICAgICAgIGNvbnN0IHNjb3BlcyA9IGFjdGlvbi5zb3VyY2VzLm1hcChzID0+IHMuc2NvcGUpLmpvaW4oJywgJylcbiAgICAgICAgcmVtb3ZlRXh0cmFNYXJrZXRwbGFjZShhY3Rpb24ubmFtZSwgYWN0aW9uLnNvdXJjZXMpXG4gICAgICAgIGNsZWFyQWxsQ2FjaGVzKClcbiAgICAgICAgLy8gU3luY2hyb25vdXNseSBjbGVhciBhbGwgc3RhbGUgc3RhdGUgZm9yIHRoaXMgbWFya2V0cGxhY2Ugc28gdGhlIFVJXG4gICAgICAgIC8vIHVwZGF0ZXMgZ2xpdGNoLWZyZWUuIG1hcmtQbHVnaW5zQ2hhbmdlZCBvbmx5IHNldHMgbmVlZHNSZWZyZXNoIOKAlFxuICAgICAgICAvLyBpdCBkb2VzIG5vdCByZWZyZXNoIHBsdWdpbnMuZXJyb3JzLCBzbyB0aGlzIGlzIHRoZSBhdXRob3JpdGF0aXZlXG4gICAgICAgIC8vIGNsZWFudXAgdW50aWwgdGhlIHVzZXIgcnVucyAvcmVsb2FkLXBsdWdpbnMuXG4gICAgICAgIHNldEFwcFN0YXRlKHByZXYgPT4gKHtcbiAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgIHBsdWdpbnM6IHtcbiAgICAgICAgICAgIC4uLnByZXYucGx1Z2lucyxcbiAgICAgICAgICAgIGVycm9yczogcHJldi5wbHVnaW5zLmVycm9ycy5maWx0ZXIoXG4gICAgICAgICAgICAgIGUgPT4gISgnbWFya2V0cGxhY2UnIGluIGUgJiYgZS5tYXJrZXRwbGFjZSA9PT0gYWN0aW9uLm5hbWUpLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIGluc3RhbGxhdGlvblN0YXR1czoge1xuICAgICAgICAgICAgICAuLi5wcmV2LnBsdWdpbnMuaW5zdGFsbGF0aW9uU3RhdHVzLFxuICAgICAgICAgICAgICBtYXJrZXRwbGFjZXM6IHByZXYucGx1Z2lucy5pbnN0YWxsYXRpb25TdGF0dXMubWFya2V0cGxhY2VzLmZpbHRlcihcbiAgICAgICAgICAgICAgICBtID0+IG0ubmFtZSAhPT0gYWN0aW9uLm5hbWUsXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pKVxuICAgICAgICBzZXRBY3Rpb25NZXNzYWdlKFxuICAgICAgICAgIGAke2ZpZ3VyZXMudGlja30gUmVtb3ZlZCBcIiR7YWN0aW9uLm5hbWV9XCIgZnJvbSAke3Njb3Blc30gc2V0dGluZ3NgLFxuICAgICAgICApXG4gICAgICAgIG1hcmtQbHVnaW5zQ2hhbmdlZCgpXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlICdyZW1vdmUtaW5zdGFsbGVkLW1hcmtldHBsYWNlJzoge1xuICAgICAgICB2b2lkIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHJlbW92ZU1hcmtldHBsYWNlU291cmNlKGFjdGlvbi5uYW1lKVxuICAgICAgICAgICAgY2xlYXJBbGxDYWNoZXMoKVxuICAgICAgICAgICAgc2V0TWFya2V0cGxhY2VMb2FkRmFpbHVyZXMocHJldiA9PlxuICAgICAgICAgICAgICBwcmV2LmZpbHRlcihmID0+IGYubmFtZSAhPT0gYWN0aW9uLm5hbWUpLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgc2V0QWN0aW9uTWVzc2FnZShcbiAgICAgICAgICAgICAgYCR7ZmlndXJlcy50aWNrfSBSZW1vdmVkIG1hcmtldHBsYWNlIFwiJHthY3Rpb24ubmFtZX1cImAsXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBtYXJrUGx1Z2luc0NoYW5nZWQoKVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgc2V0QWN0aW9uTWVzc2FnZShcbiAgICAgICAgICAgICAgYEZhaWxlZCB0byByZW1vdmUgXCIke2FjdGlvbi5uYW1lfVwiOiAke2VyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKX1gLFxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cbiAgICAgICAgfSkoKVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgY2FzZSAnbWFuYWdlZC1vbmx5JzpcbiAgICAgICAgLy8gTm8gYWN0aW9uIGF2YWlsYWJsZSDigJQgZ3VpZGFuY2UgdGV4dCBhbHJlYWR5IHNob3duXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdub25lJzpcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICB1c2VLZXliaW5kaW5ncyhcbiAgICB7XG4gICAgICAnc2VsZWN0OnByZXZpb3VzJzogKCkgPT4gc2V0U2VsZWN0ZWRJbmRleChwcmV2ID0+IE1hdGgubWF4KDAsIHByZXYgLSAxKSksXG4gICAgICAnc2VsZWN0Om5leHQnOiAoKSA9PlxuICAgICAgICBzZXRTZWxlY3RlZEluZGV4KHByZXYgPT4gTWF0aC5taW4ocm93cy5sZW5ndGggLSAxLCBwcmV2ICsgMSkpLFxuICAgICAgJ3NlbGVjdDphY2NlcHQnOiBoYW5kbGVTZWxlY3QsXG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdTZWxlY3QnLCBpc0FjdGl2ZTogcm93cy5sZW5ndGggPiAwIH0sXG4gIClcblxuICAvLyBDbGFtcCBzZWxlY3RlZEluZGV4IHdoZW4gcm93cyBzaHJpbmsgKGUuZy4gYWZ0ZXIgcmVtb3ZhbClcbiAgY29uc3QgY2xhbXBlZEluZGV4ID0gTWF0aC5taW4oc2VsZWN0ZWRJbmRleCwgTWF0aC5tYXgoMCwgcm93cy5sZW5ndGggLSAxKSlcbiAgaWYgKGNsYW1wZWRJbmRleCAhPT0gc2VsZWN0ZWRJbmRleCkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoY2xhbXBlZEluZGV4KVxuICB9XG5cbiAgY29uc3Qgc2VsZWN0ZWRBY3Rpb24gPSByb3dzW2NsYW1wZWRJbmRleF0/LmFjdGlvblxuICBjb25zdCBoYXNBY3Rpb24gPVxuICAgIHNlbGVjdGVkQWN0aW9uICYmXG4gICAgc2VsZWN0ZWRBY3Rpb24ua2luZCAhPT0gJ25vbmUnICYmXG4gICAgc2VsZWN0ZWRBY3Rpb24ua2luZCAhPT0gJ21hbmFnZWQtb25seSdcblxuICBpZiAocm93cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxCb3ggbWFyZ2luTGVmdD17MX0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+Tm8gcGx1Z2luIGVycm9yczwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvciBpdGFsaWM+XG4gICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICAgICAgICBjb250ZXh0PVwiQ29uZmlybWF0aW9uXCJcbiAgICAgICAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbj1cImJhY2tcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIHtyb3dzLm1hcCgocm93LCBpZHgpID0+IHtcbiAgICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IGlkeCA9PT0gY2xhbXBlZEluZGV4XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPEJveCBrZXk9e2lkeH0gbWFyZ2luTGVmdD17MX0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgPFRleHQgY29sb3I9e2lzU2VsZWN0ZWQgPyAnc3VnZ2VzdGlvbicgOiAnZXJyb3InfT5cbiAgICAgICAgICAgICAgICB7aXNTZWxlY3RlZCA/IGZpZ3VyZXMucG9pbnRlciA6IGZpZ3VyZXMuY3Jvc3N9eycgJ31cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICA8VGV4dCBib2xkPXtpc1NlbGVjdGVkfT57cm93LmxhYmVsfTwvVGV4dD5cbiAgICAgICAgICAgICAge3Jvdy5zY29wZSAmJiA8VGV4dCBkaW1Db2xvcj4gKHtyb3cuc2NvcGV9KTwvVGV4dD59XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8Qm94IG1hcmdpbkxlZnQ9ezN9PlxuICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+e3Jvdy5tZXNzYWdlfTwvVGV4dD5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAge3Jvdy5ndWlkYW5jZSAmJiAoXG4gICAgICAgICAgICAgIDxCb3ggbWFyZ2luTGVmdD17M30+XG4gICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICAgICAgICAgICAge3Jvdy5ndWlkYW5jZX1cbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKVxuICAgICAgfSl9XG5cbiAgICAgIHthY3Rpb25NZXNzYWdlICYmIChcbiAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9IG1hcmdpbkxlZnQ9ezF9PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+e2FjdGlvbk1lc3NhZ2V9PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG5cbiAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgIGFjdGlvbj1cInNlbGVjdDpwcmV2aW91c1wiXG4gICAgICAgICAgICAgIGNvbnRleHQ9XCJTZWxlY3RcIlxuICAgICAgICAgICAgICBmYWxsYmFjaz1cIuKGkVwiXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwibmF2aWdhdGVcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIHtoYXNBY3Rpb24gJiYgKFxuICAgICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgICAgYWN0aW9uPVwic2VsZWN0OmFjY2VwdFwiXG4gICAgICAgICAgICAgICAgY29udGV4dD1cIlNlbGVjdFwiXG4gICAgICAgICAgICAgICAgZmFsbGJhY2s9XCJFbnRlclwiXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb249XCJyZXNvbHZlXCJcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICAgICAgICBjb250ZXh0PVwiQ29uZmlybWF0aW9uXCJcbiAgICAgICAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbj1cImJhY2tcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0J5bGluZT5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbFZpZXdTdGF0ZShwYXJzZWRDb21tYW5kOiBQYXJzZWRDb21tYW5kKTogVmlld1N0YXRlIHtcbiAgc3dpdGNoIChwYXJzZWRDb21tYW5kLnR5cGUpIHtcbiAgICBjYXNlICdoZWxwJzpcbiAgICAgIHJldHVybiB7IHR5cGU6ICdoZWxwJyB9XG4gICAgY2FzZSAndmFsaWRhdGUnOlxuICAgICAgcmV0dXJuIHsgdHlwZTogJ3ZhbGlkYXRlJywgcGF0aDogcGFyc2VkQ29tbWFuZC5wYXRoIH1cbiAgICBjYXNlICdpbnN0YWxsJzpcbiAgICAgIGlmIChwYXJzZWRDb21tYW5kLm1hcmtldHBsYWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2Jyb3dzZS1tYXJrZXRwbGFjZScsXG4gICAgICAgICAgdGFyZ2V0TWFya2V0cGxhY2U6IHBhcnNlZENvbW1hbmQubWFya2V0cGxhY2UsXG4gICAgICAgICAgdGFyZ2V0UGx1Z2luOiBwYXJzZWRDb21tYW5kLnBsdWdpbixcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHBhcnNlZENvbW1hbmQucGx1Z2luKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2Rpc2NvdmVyLXBsdWdpbnMnLFxuICAgICAgICAgIHRhcmdldFBsdWdpbjogcGFyc2VkQ29tbWFuZC5wbHVnaW4sXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7IHR5cGU6ICdkaXNjb3Zlci1wbHVnaW5zJyB9XG4gICAgY2FzZSAnbWFuYWdlJzpcbiAgICAgIHJldHVybiB7IHR5cGU6ICdtYW5hZ2UtcGx1Z2lucycgfVxuICAgIGNhc2UgJ3VuaW5zdGFsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnbWFuYWdlLXBsdWdpbnMnLFxuICAgICAgICB0YXJnZXRQbHVnaW46IHBhcnNlZENvbW1hbmQucGx1Z2luLFxuICAgICAgICBhY3Rpb246ICd1bmluc3RhbGwnLFxuICAgICAgfVxuICAgIGNhc2UgJ2VuYWJsZSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnbWFuYWdlLXBsdWdpbnMnLFxuICAgICAgICB0YXJnZXRQbHVnaW46IHBhcnNlZENvbW1hbmQucGx1Z2luLFxuICAgICAgICBhY3Rpb246ICdlbmFibGUnLFxuICAgICAgfVxuICAgIGNhc2UgJ2Rpc2FibGUnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ21hbmFnZS1wbHVnaW5zJyxcbiAgICAgICAgdGFyZ2V0UGx1Z2luOiBwYXJzZWRDb21tYW5kLnBsdWdpbixcbiAgICAgICAgYWN0aW9uOiAnZGlzYWJsZScsXG4gICAgICB9XG4gICAgY2FzZSAnbWFya2V0cGxhY2UnOlxuICAgICAgaWYgKHBhcnNlZENvbW1hbmQuYWN0aW9uID09PSAnbGlzdCcpIHtcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ21hcmtldHBsYWNlLWxpc3QnIH1cbiAgICAgIH1cbiAgICAgIGlmIChwYXJzZWRDb21tYW5kLmFjdGlvbiA9PT0gJ2FkZCcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnYWRkLW1hcmtldHBsYWNlJyxcbiAgICAgICAgICBpbml0aWFsVmFsdWU6IHBhcnNlZENvbW1hbmQudGFyZ2V0LFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocGFyc2VkQ29tbWFuZC5hY3Rpb24gPT09ICdyZW1vdmUnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ21hbmFnZS1tYXJrZXRwbGFjZXMnLFxuICAgICAgICAgIHRhcmdldE1hcmtldHBsYWNlOiBwYXJzZWRDb21tYW5kLnRhcmdldCxcbiAgICAgICAgICBhY3Rpb246ICdyZW1vdmUnLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocGFyc2VkQ29tbWFuZC5hY3Rpb24gPT09ICd1cGRhdGUnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ21hbmFnZS1tYXJrZXRwbGFjZXMnLFxuICAgICAgICAgIHRhcmdldE1hcmtldHBsYWNlOiBwYXJzZWRDb21tYW5kLnRhcmdldCxcbiAgICAgICAgICBhY3Rpb246ICd1cGRhdGUnLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4geyB0eXBlOiAnbWFya2V0cGxhY2UtbWVudScgfVxuICAgIGNhc2UgJ21lbnUnOlxuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBEZWZhdWx0IHRvIGRpc2NvdmVyIHZpZXcgc2hvd2luZyBhbGwgcGx1Z2luc1xuICAgICAgcmV0dXJuIHsgdHlwZTogJ2Rpc2NvdmVyLXBsdWdpbnMnIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsVGFiKHZpZXdTdGF0ZTogVmlld1N0YXRlKTogVGFiSWQge1xuICBpZiAodmlld1N0YXRlLnR5cGUgPT09ICdtYW5hZ2UtcGx1Z2lucycpIHJldHVybiAnaW5zdGFsbGVkJ1xuICBpZiAodmlld1N0YXRlLnR5cGUgPT09ICdtYW5hZ2UtbWFya2V0cGxhY2VzJykgcmV0dXJuICdtYXJrZXRwbGFjZXMnXG4gIHJldHVybiAnZGlzY292ZXInXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQbHVnaW5TZXR0aW5ncyh7XG4gIG9uQ29tcGxldGUsXG4gIGFyZ3MsXG4gIHNob3dNY3BSZWRpcmVjdE1lc3NhZ2UsXG59OiBQbHVnaW5TZXR0aW5nc1Byb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcGFyc2VkQ29tbWFuZCA9IHBhcnNlUGx1Z2luQXJncyhhcmdzKVxuICBjb25zdCBpbml0aWFsVmlld1N0YXRlID0gZ2V0SW5pdGlhbFZpZXdTdGF0ZShwYXJzZWRDb21tYW5kKVxuICBjb25zdCBbdmlld1N0YXRlLCBzZXRWaWV3U3RhdGVdID0gdXNlU3RhdGU8Vmlld1N0YXRlPihpbml0aWFsVmlld1N0YXRlKVxuICBjb25zdCBbYWN0aXZlVGFiLCBzZXRBY3RpdmVUYWJdID0gdXNlU3RhdGU8VGFiSWQ+KFxuICAgIGdldEluaXRpYWxUYWIoaW5pdGlhbFZpZXdTdGF0ZSksXG4gIClcbiAgY29uc3QgW2lucHV0VmFsdWUsIHNldElucHV0VmFsdWVdID0gdXNlU3RhdGUoXG4gICAgdmlld1N0YXRlLnR5cGUgPT09ICdhZGQtbWFya2V0cGxhY2UnID8gdmlld1N0YXRlLmluaXRpYWxWYWx1ZSB8fCAnJyA6ICcnLFxuICApXG4gIGNvbnN0IFtjdXJzb3JPZmZzZXQsIHNldEN1cnNvck9mZnNldF0gPSB1c2VTdGF0ZSgwKVxuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtyZXN1bHQsIHNldFJlc3VsdF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbY2hpbGRTZWFyY2hBY3RpdmUsIHNldENoaWxkU2VhcmNoQWN0aXZlXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcblxuICAvLyBFcnJvciBjb3VudCBmb3IgdGhlIEVycm9ycyB0YWIgYmFkZ2Ug4oCUIGNvdW50cyBsb2FkZXIgZXJyb3JzICsgYmFja2dyb3VuZFxuICAvLyBtYXJrZXRwbGFjZSBpbnN0YWxsIGZhaWx1cmVzLiBEb2VzIE5PVCBjb3VudCBtYXJrZXRwbGFjZS1vbi1kaXNrIGxvYWRcbiAgLy8gZmFpbHVyZXMgKHRob3NlIHJlcXVpcmUgSS9PIGFuZCBhcmUgZGlzY292ZXJlZCBsYXppbHkgd2hlbiB0aGUgdGFiIG9wZW5zKS5cbiAgLy8gTWF5IHNsaWdodGx5IG92ZXJjb3VudCB2cy4gZGlzcGxheWVkIHJvd3Mgd2hlbiBhIG1hcmtldHBsYWNlIGhhcyBib3RoIGFcbiAgLy8gbG9hZGVyIGVycm9yIGFuZCBhIGZhaWxlZCBpbnN0YWxsIHN0YXR1cyAoYnVpbGRFcnJvclJvd3MgZGVkdXBsaWNhdGVzKS5cbiAgY29uc3QgcGx1Z2luRXJyb3JDb3VudCA9IHVzZUFwcFN0YXRlKHMgPT4ge1xuICAgIGxldCBjb3VudCA9IHMucGx1Z2lucy5lcnJvcnMubGVuZ3RoXG4gICAgZm9yIChjb25zdCBtIG9mIHMucGx1Z2lucy5pbnN0YWxsYXRpb25TdGF0dXMubWFya2V0cGxhY2VzKSB7XG4gICAgICBpZiAobS5zdGF0dXMgPT09ICdmYWlsZWQnKSBjb3VudCsrXG4gICAgfVxuICAgIHJldHVybiBjb3VudFxuICB9KVxuICBjb25zdCBlcnJvcnNUYWJUaXRsZSA9XG4gICAgcGx1Z2luRXJyb3JDb3VudCA+IDAgPyBgRXJyb3JzICgke3BsdWdpbkVycm9yQ291bnR9KWAgOiAnRXJyb3JzJ1xuXG4gIGNvbnN0IGV4aXRTdGF0ZSA9IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncygpXG5cbiAgLyoqXG4gICAqIENMSSBtb2RlIGlzIGFjdGl2ZSB3aGVuIHRoZSB1c2VyIHByb3ZpZGVzIGEgY29tcGxldGUgY29tbWFuZCB3aXRoIGFsbCByZXF1aXJlZCBhcmd1bWVudHMuXG4gICAqIEluIHRoaXMgbW9kZSwgdGhlIG9wZXJhdGlvbiBleGVjdXRlcyBpbW1lZGlhdGVseSB3aXRob3V0IGludGVyYWN0aXZlIHByb21wdHMuXG4gICAqIEludGVyYWN0aXZlIG1vZGUgaXMgdXNlZCB3aGVuIGFyZ3VtZW50cyBhcmUgbWlzc2luZywgYWxsb3dpbmcgdGhlIHVzZXIgdG8gaW5wdXQgdGhlbS5cbiAgICovXG4gIGNvbnN0IGNsaU1vZGUgPVxuICAgIHBhcnNlZENvbW1hbmQudHlwZSA9PT0gJ21hcmtldHBsYWNlJyAmJlxuICAgIHBhcnNlZENvbW1hbmQuYWN0aW9uID09PSAnYWRkJyAmJlxuICAgIHBhcnNlZENvbW1hbmQudGFyZ2V0ICE9PSB1bmRlZmluZWRcblxuICAvLyBTaWduYWwgdGhhdCBwbHVnaW4gc3RhdGUgaGFzIGNoYW5nZWQgb24gZGlzayAoTGF5ZXIgMikgYW5kIGFjdGl2ZVxuICAvLyBjb21wb25lbnRzIChMYXllciAzKSBhcmUgc3RhbGUuIFVzZXIgcnVucyAvcmVsb2FkLXBsdWdpbnMgdG8gYXBwbHkuXG4gIC8vIFByZXZpb3VzbHkgdGhpcyB3YXMgdXBkYXRlUGx1Z2luU3RhdGUoKSB3aGljaCBkaWQgYSBwYXJ0aWFsIHJlZnJlc2hcbiAgLy8gKGNvbW1hbmRzIG9ubHkg4oCUIGFnZW50cy9ob29rcy9NQ1Agd2VyZSBzaWxlbnRseSBza2lwcGVkKS4gTm93IGFsbFxuICAvLyBMYXllci0zIHJlZnJlc2ggZmxvd3MgdGhyb3VnaCB0aGUgdW5pZmllZCByZWZyZXNoQWN0aXZlUGx1Z2lucygpXG4gIC8vIHByaW1pdGl2ZSB2aWEgL3JlbG9hZC1wbHVnaW5zLCBnaXZpbmcgb25lIGNvbnNpc3RlbnQgbWVudGFsIG1vZGVsOlxuICAvLyBwbHVnaW4gY2hhbmdlcyByZXF1aXJlIC9yZWxvYWQtcGx1Z2lucy5cbiAgY29uc3QgbWFya1BsdWdpbnNDaGFuZ2VkID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHNldEFwcFN0YXRlKHByZXYgPT5cbiAgICAgIHByZXYucGx1Z2lucy5uZWVkc1JlZnJlc2hcbiAgICAgICAgPyBwcmV2XG4gICAgICAgIDogeyAuLi5wcmV2LCBwbHVnaW5zOiB7IC4uLnByZXYucGx1Z2lucywgbmVlZHNSZWZyZXNoOiB0cnVlIH0gfSxcbiAgICApXG4gIH0sIFtzZXRBcHBTdGF0ZV0pXG5cbiAgLy8gSGFuZGxlIHRhYiBzd2l0Y2hpbmcgKGNhbGxlZCBieSBUYWJzIGNvbXBvbmVudClcbiAgY29uc3QgaGFuZGxlVGFiQ2hhbmdlID0gdXNlQ2FsbGJhY2soKHRhYklkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCB0YWIgPSB0YWJJZCBhcyBUYWJJZFxuICAgIHNldEFjdGl2ZVRhYih0YWIpXG4gICAgc2V0RXJyb3IobnVsbClcbiAgICBzd2l0Y2ggKHRhYikge1xuICAgICAgY2FzZSAnZGlzY292ZXInOlxuICAgICAgICBzZXRWaWV3U3RhdGUoeyB0eXBlOiAnZGlzY292ZXItcGx1Z2lucycgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2luc3RhbGxlZCc6XG4gICAgICAgIHNldFZpZXdTdGF0ZSh7IHR5cGU6ICdtYW5hZ2UtcGx1Z2lucycgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ21hcmtldHBsYWNlcyc6XG4gICAgICAgIHNldFZpZXdTdGF0ZSh7IHR5cGU6ICdtYW5hZ2UtbWFya2V0cGxhY2VzJyB9KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnZXJyb3JzJzpcbiAgICAgICAgLy8gTm8gdmlld1N0YXRlIGNoYW5nZSBuZWVkZWQg4oCUIEVycm9yc1RhYkNvbnRlbnQgcmVuZGVycyBpbnNpZGUgPFRhYiBpZD1cImVycm9yc1wiPlxuICAgICAgICBicmVha1xuICAgIH1cbiAgfSwgW10pXG5cbiAgLy8gSGFuZGxlIGV4aXRpbmcgd2hlbiBjaGlsZCBjb21wb25lbnRzIHNldCB2aWV3U3RhdGUgdG8gJ21lbnUnLlxuICAvLyBDaGlsZCBjb21wb25lbnRzIHR5cGljYWxseSBzZXQgQk9USCBzZXRSZXN1bHQobXNnKSBhbmQgc2V0UGFyZW50Vmlld1N0YXRlXG4gIC8vICh7dHlwZTonbWVudSd9KSDigJQgYm90aCBlZmZlY3RzIGZpcmUgb24gdGhlIHNhbWUgcmVuZGVyLiBPbmx5IGNsb3NlIHZpYSB0aGlzXG4gIC8vIHBhdGggd2hlbiB0aGVyZSdzIG5vIHJlc3VsdCwgb3RoZXJ3aXNlIHRoZSByZXN1bHQgZWZmZWN0IChiZWxvdykgaGFuZGxlc1xuICAvLyB0aGUgY2xvc2UgQU5EIGRlbGl2ZXJzIHRoZSBtZXNzYWdlIHRvIHRoZSB0cmFuc2NyaXB0LlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWV3U3RhdGUudHlwZSA9PT0gJ21lbnUnICYmICFyZXN1bHQpIHtcbiAgICAgIG9uQ29tcGxldGUoKVxuICAgIH1cbiAgfSwgW3ZpZXdTdGF0ZS50eXBlLCByZXN1bHQsIG9uQ29tcGxldGVdKVxuXG4gIC8vIFN5bmMgYWN0aXZlVGFiIHdoZW4gdmlld1N0YXRlIGNoYW5nZXMgdG8gYSBkaWZmZXJlbnQgdGFiJ3MgY29udGVudFxuICAvLyBUaGlzIGhhbmRsZXMgY2FzZXMgbGlrZSBBZGRNYXJrZXRwbGFjZSBuYXZpZ2F0aW5nIHRvIGJyb3dzZS1tYXJrZXRwbGFjZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWV3U3RhdGUudHlwZSA9PT0gJ2Jyb3dzZS1tYXJrZXRwbGFjZScgJiYgYWN0aXZlVGFiICE9PSAnZGlzY292ZXInKSB7XG4gICAgICBzZXRBY3RpdmVUYWIoJ2Rpc2NvdmVyJylcbiAgICB9XG4gIH0sIFt2aWV3U3RhdGUudHlwZSwgYWN0aXZlVGFiXSlcblxuICAvLyBIYW5kbGUgZXNjYXBlIGtleSBmb3IgYWRkLW1hcmtldHBsYWNlIG1vZGUgb25seVxuICAvLyBPdGhlciB0YWJiZWQgdmlld3MgaGFuZGxlIGVzY2FwZSBpbiB0aGVpciBvd24gY29tcG9uZW50c1xuICBjb25zdCBoYW5kbGVBZGRNYXJrZXRwbGFjZUVzY2FwZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRBY3RpdmVUYWIoJ21hcmtldHBsYWNlcycpXG4gICAgc2V0Vmlld1N0YXRlKHsgdHlwZTogJ21hbmFnZS1tYXJrZXRwbGFjZXMnIH0pXG4gICAgc2V0SW5wdXRWYWx1ZSgnJylcbiAgICBzZXRFcnJvcihudWxsKVxuICB9LCBbXSlcblxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgaGFuZGxlQWRkTWFya2V0cGxhY2VFc2NhcGUsIHtcbiAgICBjb250ZXh0OiAnU2V0dGluZ3MnLFxuICAgIGlzQWN0aXZlOiB2aWV3U3RhdGUudHlwZSA9PT0gJ2FkZC1tYXJrZXRwbGFjZScsXG4gIH0pXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICBvbkNvbXBsZXRlKHJlc3VsdClcbiAgICB9XG4gIH0sIFtyZXN1bHQsIG9uQ29tcGxldGVdKVxuXG4gIC8vIEhhbmRsZSBoZWxwIHZpZXcgY29tcGxldGlvblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2aWV3U3RhdGUudHlwZSA9PT0gJ2hlbHAnKSB7XG4gICAgICBvbkNvbXBsZXRlKClcbiAgICB9XG4gIH0sIFt2aWV3U3RhdGUudHlwZSwgb25Db21wbGV0ZV0pXG5cbiAgLy8gUmVuZGVyIGRpZmZlcmVudCB2aWV3cyBiYXNlZCBvbiBzdGF0ZVxuICBpZiAodmlld1N0YXRlLnR5cGUgPT09ICdoZWxwJykge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgYm9sZD5QbHVnaW4gQ29tbWFuZCBVc2FnZTo8L1RleHQ+XG4gICAgICAgIDxUZXh0PiA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPkluc3RhbGxhdGlvbjo8L1RleHQ+XG4gICAgICAgIDxUZXh0PiAvcGx1Z2luIGluc3RhbGwgLSBCcm93c2UgYW5kIGluc3RhbGwgcGx1Z2luczwvVGV4dD5cbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgeycgJ31cbiAgICAgICAgICAvcGx1Z2luIGluc3RhbGwgJmx0O21hcmtldHBsYWNlJmd0OyAtIEluc3RhbGwgZnJvbSBzcGVjaWZpY1xuICAgICAgICAgIG1hcmtldHBsYWNlXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQ+IC9wbHVnaW4gaW5zdGFsbCAmbHQ7cGx1Z2luJmd0OyAtIEluc3RhbGwgc3BlY2lmaWMgcGx1Z2luPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7JyAnfVxuICAgICAgICAgIC9wbHVnaW4gaW5zdGFsbCAmbHQ7cGx1Z2luJmd0O0AmbHQ7bWFya2V0Jmd0OyAtIEluc3RhbGwgcGx1Z2luIGZyb21cbiAgICAgICAgICBtYXJrZXRwbGFjZVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PiA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPk1hbmFnZW1lbnQ6PC9UZXh0PlxuICAgICAgICA8VGV4dD4gL3BsdWdpbiBtYW5hZ2UgLSBNYW5hZ2UgaW5zdGFsbGVkIHBsdWdpbnM8L1RleHQ+XG4gICAgICAgIDxUZXh0PiAvcGx1Z2luIGVuYWJsZSAmbHQ7cGx1Z2luJmd0OyAtIEVuYWJsZSBhIHBsdWdpbjwvVGV4dD5cbiAgICAgICAgPFRleHQ+IC9wbHVnaW4gZGlzYWJsZSAmbHQ7cGx1Z2luJmd0OyAtIERpc2FibGUgYSBwbHVnaW48L1RleHQ+XG4gICAgICAgIDxUZXh0PiAvcGx1Z2luIHVuaW5zdGFsbCAmbHQ7cGx1Z2luJmd0OyAtIFVuaW5zdGFsbCBhIHBsdWdpbjwvVGV4dD5cbiAgICAgICAgPFRleHQ+IDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+TWFya2V0cGxhY2VzOjwvVGV4dD5cbiAgICAgICAgPFRleHQ+IC9wbHVnaW4gbWFya2V0cGxhY2UgLSBNYXJrZXRwbGFjZSBtYW5hZ2VtZW50IG1lbnU8L1RleHQ+XG4gICAgICAgIDxUZXh0PiAvcGx1Z2luIG1hcmtldHBsYWNlIGFkZCAtIEFkZCBhIG1hcmtldHBsYWNlPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7JyAnfVxuICAgICAgICAgIC9wbHVnaW4gbWFya2V0cGxhY2UgYWRkICZsdDtwYXRoL3VybCZndDsgLSBBZGQgbWFya2V0cGxhY2UgZGlyZWN0bHlcbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dD4gL3BsdWdpbiBtYXJrZXRwbGFjZSB1cGRhdGUgLSBVcGRhdGUgbWFya2V0cGxhY2VzPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7JyAnfVxuICAgICAgICAgIC9wbHVnaW4gbWFya2V0cGxhY2UgdXBkYXRlICZsdDtuYW1lJmd0OyAtIFVwZGF0ZSBzcGVjaWZpYyBtYXJrZXRwbGFjZVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PiAvcGx1Z2luIG1hcmtldHBsYWNlIHJlbW92ZSAtIFJlbW92ZSBhIG1hcmtldHBsYWNlPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7JyAnfVxuICAgICAgICAgIC9wbHVnaW4gbWFya2V0cGxhY2UgcmVtb3ZlICZsdDtuYW1lJmd0OyAtIFJlbW92ZSBzcGVjaWZpYyBtYXJrZXRwbGFjZVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PiAvcGx1Z2luIG1hcmtldHBsYWNlIGxpc3QgLSBMaXN0IGFsbCBtYXJrZXRwbGFjZXM8L1RleHQ+XG4gICAgICAgIDxUZXh0PiA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlZhbGlkYXRpb246PC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7JyAnfVxuICAgICAgICAgIC9wbHVnaW4gdmFsaWRhdGUgJmx0O3BhdGgmZ3Q7IC0gVmFsaWRhdGUgYSBtYW5pZmVzdCBmaWxlIG9yIGRpcmVjdG9yeVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0PiA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPk90aGVyOjwvVGV4dD5cbiAgICAgICAgPFRleHQ+IC9wbHVnaW4gLSBNYWluIHBsdWdpbiBtZW51PC9UZXh0PlxuICAgICAgICA8VGV4dD4gL3BsdWdpbiBoZWxwIC0gU2hvdyB0aGlzIGhlbHA8L1RleHQ+XG4gICAgICAgIDxUZXh0PiAvcGx1Z2lucyAtIEFsaWFzIGZvciAvcGx1Z2luPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgaWYgKHZpZXdTdGF0ZS50eXBlID09PSAndmFsaWRhdGUnKSB7XG4gICAgcmV0dXJuIDxWYWxpZGF0ZVBsdWdpbiBvbkNvbXBsZXRlPXtvbkNvbXBsZXRlfSBwYXRoPXt2aWV3U3RhdGUucGF0aH0gLz5cbiAgfVxuXG4gIGlmICh2aWV3U3RhdGUudHlwZSA9PT0gJ21hcmtldHBsYWNlLW1lbnUnKSB7XG4gICAgLy8gU2hvdyBhIHNpbXBsZSBtZW51IGZvciBtYXJrZXRwbGFjZSBvcGVyYXRpb25zXG4gICAgc2V0Vmlld1N0YXRlKHsgdHlwZTogJ21lbnUnIH0pXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmICh2aWV3U3RhdGUudHlwZSA9PT0gJ21hcmtldHBsYWNlLWxpc3QnKSB7XG4gICAgcmV0dXJuIDxNYXJrZXRwbGFjZUxpc3Qgb25Db21wbGV0ZT17b25Db21wbGV0ZX0gLz5cbiAgfVxuXG4gIGlmICh2aWV3U3RhdGUudHlwZSA9PT0gJ2FkZC1tYXJrZXRwbGFjZScpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEFkZE1hcmtldHBsYWNlXG4gICAgICAgIGlucHV0VmFsdWU9e2lucHV0VmFsdWV9XG4gICAgICAgIHNldElucHV0VmFsdWU9e3NldElucHV0VmFsdWV9XG4gICAgICAgIGN1cnNvck9mZnNldD17Y3Vyc29yT2Zmc2V0fVxuICAgICAgICBzZXRDdXJzb3JPZmZzZXQ9e3NldEN1cnNvck9mZnNldH1cbiAgICAgICAgZXJyb3I9e2Vycm9yfVxuICAgICAgICBzZXRFcnJvcj17c2V0RXJyb3J9XG4gICAgICAgIHJlc3VsdD17cmVzdWx0fVxuICAgICAgICBzZXRSZXN1bHQ9e3NldFJlc3VsdH1cbiAgICAgICAgc2V0Vmlld1N0YXRlPXtzZXRWaWV3U3RhdGV9XG4gICAgICAgIG9uQWRkQ29tcGxldGU9e21hcmtQbHVnaW5zQ2hhbmdlZH1cbiAgICAgICAgY2xpTW9kZT17Y2xpTW9kZX1cbiAgICAgIC8+XG4gICAgKVxuICB9XG4gIC8vIFJlbmRlciB0YWJiZWQgaW50ZXJmYWNlIHVzaW5nIHRoZSBkZXNpZ24gc3lzdGVtIFRhYnMgY29tcG9uZW50XG4gIHJldHVybiAoXG4gICAgPFBhbmUgY29sb3I9XCJzdWdnZXN0aW9uXCI+XG4gICAgICA8VGFic1xuICAgICAgICB0aXRsZT1cIlBsdWdpbnNcIlxuICAgICAgICBzZWxlY3RlZFRhYj17YWN0aXZlVGFifVxuICAgICAgICBvblRhYkNoYW5nZT17aGFuZGxlVGFiQ2hhbmdlfVxuICAgICAgICBjb2xvcj1cInN1Z2dlc3Rpb25cIlxuICAgICAgICBkaXNhYmxlTmF2aWdhdGlvbj17Y2hpbGRTZWFyY2hBY3RpdmV9XG4gICAgICAgIGJhbm5lcj17XG4gICAgICAgICAgc2hvd01jcFJlZGlyZWN0TWVzc2FnZSAmJiBhY3RpdmVUYWIgPT09ICdpbnN0YWxsZWQnID8gKFxuICAgICAgICAgICAgPE1jcFJlZGlyZWN0QmFubmVyIC8+XG4gICAgICAgICAgKSA6IHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgICA+XG4gICAgICAgIDxUYWIgaWQ9XCJkaXNjb3ZlclwiIHRpdGxlPVwiRGlzY292ZXJcIj5cbiAgICAgICAgICB7dmlld1N0YXRlLnR5cGUgPT09ICdicm93c2UtbWFya2V0cGxhY2UnID8gKFxuICAgICAgICAgICAgPEJyb3dzZU1hcmtldHBsYWNlXG4gICAgICAgICAgICAgIGVycm9yPXtlcnJvcn1cbiAgICAgICAgICAgICAgc2V0RXJyb3I9e3NldEVycm9yfVxuICAgICAgICAgICAgICByZXN1bHQ9e3Jlc3VsdH1cbiAgICAgICAgICAgICAgc2V0UmVzdWx0PXtzZXRSZXN1bHR9XG4gICAgICAgICAgICAgIHNldFZpZXdTdGF0ZT17c2V0Vmlld1N0YXRlfVxuICAgICAgICAgICAgICBvbkluc3RhbGxDb21wbGV0ZT17bWFya1BsdWdpbnNDaGFuZ2VkfVxuICAgICAgICAgICAgICB0YXJnZXRNYXJrZXRwbGFjZT17dmlld1N0YXRlLnRhcmdldE1hcmtldHBsYWNlfVxuICAgICAgICAgICAgICB0YXJnZXRQbHVnaW49e3ZpZXdTdGF0ZS50YXJnZXRQbHVnaW59XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8RGlzY292ZXJQbHVnaW5zXG4gICAgICAgICAgICAgIGVycm9yPXtlcnJvcn1cbiAgICAgICAgICAgICAgc2V0RXJyb3I9e3NldEVycm9yfVxuICAgICAgICAgICAgICByZXN1bHQ9e3Jlc3VsdH1cbiAgICAgICAgICAgICAgc2V0UmVzdWx0PXtzZXRSZXN1bHR9XG4gICAgICAgICAgICAgIHNldFZpZXdTdGF0ZT17c2V0Vmlld1N0YXRlfVxuICAgICAgICAgICAgICBvbkluc3RhbGxDb21wbGV0ZT17bWFya1BsdWdpbnNDaGFuZ2VkfVxuICAgICAgICAgICAgICBvblNlYXJjaE1vZGVDaGFuZ2U9e3NldENoaWxkU2VhcmNoQWN0aXZlfVxuICAgICAgICAgICAgICB0YXJnZXRQbHVnaW49e1xuICAgICAgICAgICAgICAgIHZpZXdTdGF0ZS50eXBlID09PSAnZGlzY292ZXItcGx1Z2lucydcbiAgICAgICAgICAgICAgICAgID8gdmlld1N0YXRlLnRhcmdldFBsdWdpblxuICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApfVxuICAgICAgICA8L1RhYj5cbiAgICAgICAgPFRhYiBpZD1cImluc3RhbGxlZFwiIHRpdGxlPVwiSW5zdGFsbGVkXCI+XG4gICAgICAgICAgPE1hbmFnZVBsdWdpbnNcbiAgICAgICAgICAgIHNldFZpZXdTdGF0ZT17c2V0Vmlld1N0YXRlfVxuICAgICAgICAgICAgc2V0UmVzdWx0PXtzZXRSZXN1bHR9XG4gICAgICAgICAgICBvbk1hbmFnZUNvbXBsZXRlPXttYXJrUGx1Z2luc0NoYW5nZWR9XG4gICAgICAgICAgICBvblNlYXJjaE1vZGVDaGFuZ2U9e3NldENoaWxkU2VhcmNoQWN0aXZlfVxuICAgICAgICAgICAgdGFyZ2V0UGx1Z2luPXtcbiAgICAgICAgICAgICAgdmlld1N0YXRlLnR5cGUgPT09ICdtYW5hZ2UtcGx1Z2lucydcbiAgICAgICAgICAgICAgICA/IHZpZXdTdGF0ZS50YXJnZXRQbHVnaW5cbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFyZ2V0TWFya2V0cGxhY2U9e1xuICAgICAgICAgICAgICB2aWV3U3RhdGUudHlwZSA9PT0gJ21hbmFnZS1wbHVnaW5zJ1xuICAgICAgICAgICAgICAgID8gdmlld1N0YXRlLnRhcmdldE1hcmtldHBsYWNlXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFjdGlvbj17XG4gICAgICAgICAgICAgIHZpZXdTdGF0ZS50eXBlID09PSAnbWFuYWdlLXBsdWdpbnMnID8gdmlld1N0YXRlLmFjdGlvbiA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvVGFiPlxuICAgICAgICA8VGFiIGlkPVwibWFya2V0cGxhY2VzXCIgdGl0bGU9XCJNYXJrZXRwbGFjZXNcIj5cbiAgICAgICAgICA8TWFuYWdlTWFya2V0cGxhY2VzXG4gICAgICAgICAgICBzZXRWaWV3U3RhdGU9e3NldFZpZXdTdGF0ZX1cbiAgICAgICAgICAgIGVycm9yPXtlcnJvcn1cbiAgICAgICAgICAgIHNldEVycm9yPXtzZXRFcnJvcn1cbiAgICAgICAgICAgIHNldFJlc3VsdD17c2V0UmVzdWx0fVxuICAgICAgICAgICAgZXhpdFN0YXRlPXtleGl0U3RhdGV9XG4gICAgICAgICAgICBvbk1hbmFnZUNvbXBsZXRlPXttYXJrUGx1Z2luc0NoYW5nZWR9XG4gICAgICAgICAgICB0YXJnZXRNYXJrZXRwbGFjZT17XG4gICAgICAgICAgICAgIHZpZXdTdGF0ZS50eXBlID09PSAnbWFuYWdlLW1hcmtldHBsYWNlcydcbiAgICAgICAgICAgICAgICA/IHZpZXdTdGF0ZS50YXJnZXRNYXJrZXRwbGFjZVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhY3Rpb249e1xuICAgICAgICAgICAgICB2aWV3U3RhdGUudHlwZSA9PT0gJ21hbmFnZS1tYXJrZXRwbGFjZXMnXG4gICAgICAgICAgICAgICAgPyB2aWV3U3RhdGUuYWN0aW9uXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAvPlxuICAgICAgICA8L1RhYj5cbiAgICAgICAgPFRhYiBpZD1cImVycm9yc1wiIHRpdGxlPXtlcnJvcnNUYWJUaXRsZX0+XG4gICAgICAgICAgPEVycm9yc1RhYkNvbnRlbnRcbiAgICAgICAgICAgIHNldFZpZXdTdGF0ZT17c2V0Vmlld1N0YXRlfVxuICAgICAgICAgICAgc2V0QWN0aXZlVGFiPXtzZXRBY3RpdmVUYWJ9XG4gICAgICAgICAgICBtYXJrUGx1Z2luc0NoYW5nZWQ9e21hcmtQbHVnaW5zQ2hhbmdlZH1cbiAgICAgICAgICAvPlxuICAgICAgICA8L1RhYj5cbiAgICAgIDwvVGFicz5cbiAgICA8L1BhbmU+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsV0FBVyxFQUFFQyxTQUFTLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3hELFNBQVNDLHdCQUF3QixRQUFRLDhDQUE4QztBQUN2RixTQUFTQyxNQUFNLFFBQVEsMENBQTBDO0FBQ2pFLFNBQVNDLElBQUksUUFBUSx3Q0FBd0M7QUFDN0QsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsd0NBQXdDO0FBQ2xFLFNBQVNDLDhCQUE4QixRQUFRLCtDQUErQztBQUM5RixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQ0VDLGFBQWEsRUFDYkMsY0FBYyxRQUNULG9DQUFvQztBQUMzQyxTQUFTQyxXQUFXLEVBQUVDLGNBQWMsUUFBUSx5QkFBeUI7QUFDckUsY0FBY0MsV0FBVyxRQUFRLHVCQUF1QjtBQUN4RCxTQUFTQyxZQUFZLFFBQVEsdUJBQXVCO0FBQ3BELFNBQVNDLGNBQWMsUUFBUSxtQ0FBbUM7QUFDbEUsU0FBU0MsdUNBQXVDLFFBQVEsMkNBQTJDO0FBQ25HLFNBQ0VDLDJCQUEyQixFQUMzQkMsdUJBQXVCLFFBQ2xCLDJDQUEyQztBQUNsRCxTQUFTQyx1QkFBdUIsUUFBUSwyQ0FBMkM7QUFDbkYsY0FBY0MscUJBQXFCLFFBQVEsbUNBQW1DO0FBQzlFLFNBQ0VDLG9CQUFvQixFQUNwQkMsdUJBQXVCLFFBQ2xCLGtDQUFrQztBQUN6QyxTQUFTQyxjQUFjLFFBQVEscUJBQXFCO0FB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
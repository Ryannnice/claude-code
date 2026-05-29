// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 color、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { color, Text } from '../ink.js';
// 类型依赖 { MCPServerConnection } 来自 ../services/mcp/types.js，用于校准共享工具的数据契约。
import type { MCPServerConnection } from '../services/mcp/types.js';
// 引入 getAccountInformation、isClaudeAISubscriber，将 ./auth.js 中已经封装好的能力接到本文件流程里。
import { getAccountInformation, isClaudeAISubscriber } from './auth.js';
// 引入 getLargeMemoryFiles、getMemoryFiles、MAX_MEMORY_CHARACTER_COUNT，将 ./claudemd.js 中已经封装好的能力接到本文件流程里。
import { getLargeMemoryFiles, getMemoryFiles, MAX_MEMORY_CHARACTER_COUNT } from './claudemd.js';
// 引入 getDoctorDiagnostic，将 ./doctorDiagnostic.js 中已经封装好的能力接到本文件流程里。
import { getDoctorDiagnostic } from './doctorDiagnostic.js';
// 引入 getAWSRegion、getDefaultVertexRegion、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getAWSRegion, getDefaultVertexRegion, isEnvTruthy } from './envUtils.js';
// 引入 getDisplayPath，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { getDisplayPath } from './file.js';
// 引入 formatNumber，将 ./format.js 中已经封装好的能力接到本文件流程里。
import { formatNumber } from './format.js';
// 引入 getIdeClientName、IDEExtensionInstallationStatus、isJetBrainsIde、toIDEDisplayName，将 ./ide.js 中已经封装好的能力接到本文件流程里。
import { getIdeClientName, type IDEExtensionInstallationStatus, isJetBrainsIde, toIDEDisplayName } from './ide.js';
// 引入 getClaudeAiUserDefaultModelDescription、modelDisplayString，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { getClaudeAiUserDefaultModelDescription, modelDisplayString } from './model/model.js';
// 引入 getAPIProvider，将 ./model/providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './model/providers.js';
// 引入 getMTLSConfig，将 ./mtls.js 中已经封装好的能力接到本文件流程里。
import { getMTLSConfig } from './mtls.js';
// 引入 checkInstall，将 ./nativeInstaller/index.js 中已经封装好的能力接到本文件流程里。
import { checkInstall } from './nativeInstaller/index.js';
// 引入 getProxyUrl，将 ./proxy.js 中已经封装好的能力接到本文件流程里。
import { getProxyUrl } from './proxy.js';
// 引入 SandboxManager，将 ./sandbox/sandbox-adapter.js 中已经封装好的能力接到本文件流程里。
import { SandboxManager } from './sandbox/sandbox-adapter.js';
// 引入 getSettingsWithAllErrors，将 ./settings/allErrors.js 中已经封装好的能力接到本文件流程里。
import { getSettingsWithAllErrors } from './settings/allErrors.js';
// 引入 getEnabledSettingSources、getSettingSourceDisplayNameCapitalized，将 ./settings/constants.js 中已经封装好的能力接到本文件流程里。
import { getEnabledSettingSources, getSettingSourceDisplayNameCapitalized } from './settings/constants.js';
// 引入 getManagedFileSettingsPresence、getPolicySettingsOrigin、getSettingsForSource，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getManagedFileSettingsPresence, getPolicySettingsOrigin, getSettingsForSource } from './settings/settings.js';
// 类型依赖 { ThemeName } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { ThemeName } from './theme.js';
// Property 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Property = {
  label?: string;
  value: React.ReactNode | Array<string>;
};
// Diagnostic 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Diagnostic = React.ReactNode;
// buildSandboxProperties 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildSandboxProperties(): Property[] {
  // `"external"` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if ("external" !== 'ant') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [];
  }
  // isSandboxed记录 `SandboxManager.isSandboxingEnabled` 是否成立，共享工具随后按该结果分支。
  const isSandboxed = SandboxManager.isSandboxingEnabled();
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{
    label: 'Bash Sandbox',
    value: isSandboxed ? 'Enabled' : 'Disabled'
  }];
}
// buildIDEProperties 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildIDEProperties(mcpClients: MCPServerConnection[], ideInstallationStatus: IDEExtensionInstallationStatus | null = null, theme: ThemeName): Property[] {
  // ideClient筛选`find`，供共享工具后续处理使用。
  const ideClient = mcpClients?.find(client => client.name === 'ide');
  // 满足 `ideInstallationStatus` 时，共享工具执行该分支。
  if (ideInstallationStatus) {
    // ideName保存`toIDEDisplayName`，供共享工具后续处理使用。
    const ideName = toIDEDisplayName(ideInstallationStatus.ideType);
    // pluginOrExtension 插件数据保存`isJetBrainsIde`，供共享工具后续处理使用。
    const pluginOrExtension = isJetBrainsIde(ideInstallationStatus.ideType) ? 'plugin' : 'extension';
    // 满足 `ideInstallationStatus.error` 时，共享工具执行该分支。
    if (ideInstallationStatus.error) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [{
        label: 'IDE',
        value: <Text>
              {color('error', theme)(figures.cross)} Error installing {ideName}{' '}
              {pluginOrExtension}: {ideInstallationStatus.error}
              {'\n'}Please restart your IDE and try again.
            </Text>
      }];
    }
    // 满足 `ideInstallationStatus.installed` 时，共享工具执行该分支。
    if (ideInstallationStatus.installed) {
      // 当 `ideClient && ideClient.type` 匹配 `'connected'` 时，共享工具执行对应分支。
      if (ideClient && ideClient.type === 'connected') {
        // `ideInstallationStatus.installedVersion` 与 `ideCli` 不一致时刷新派生状态，避免使用过期结果。
        if (ideInstallationStatus.installedVersion !== ideClient.serverInfo?.version) {
          // 返回列表结果，保留共享工具已经排好的条目顺序。
          return [{
            label: 'IDE',
            value: `Connected to ${ideName} ${pluginOrExtension} version ${ideInstallationStatus.installedVersion} (server version: ${ideClient.serverInfo?.version})`
          }];
        } else {
          // 返回列表结果，保留共享工具已经排好的条目顺序。
          return [{
            label: 'IDE',
            value: `Connected to ${ideName} ${pluginOrExtension} version ${ideInstallationStatus.installedVersion}`
          }];
        }
      } else {
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return [{
          label: 'IDE',
          value: `Installed ${ideName} ${pluginOrExtension}`
        }];
      }
    }
  // 共享工具 status在这里处理 `} else if (ideClient) {`，完成这一小步状态转换。
  } else if (ideClient) {
    // ideName读取`getIdeClientName`，供共享工具后续处理使用。
    const ideName = getIdeClientName(ideClient) ?? 'IDE';
    // 当 `ideClient.type` 匹配 `'connected'` 时，共享工具执行对应分支。
    if (ideClient.type === 'connected') {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [{
        label: 'IDE',
        value: `Connected to ${ideName} extension`
      }];
    } else {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [{
        label: 'IDE',
        value: `${color('error', theme)(figures.cross)} Not connected to ${ideName}`
      }];
    }
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [];
}
// buildMcpProperties 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildMcpProperties(clients: MCPServerConnection[] = [], theme: ThemeName): Property[] {
  // servers 集合筛选`clients.filter`，供共享工具后续处理使用。
  const servers = clients.filter(client => client.name !== 'ide');
  // servers.length 数量缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!servers.length) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [];
  }

  // Summary instead of a full server list — 20+ servers wrapped onto many
  // rows, dominating the Status pane. Show counts by state + /mcp hint.
  // byState 状态集中保存共享工具 status要一起传递的字段。
  const byState = {
    connected: 0,
    pending: 0,
    needsAuth: 0,
    failed: 0
  };
  // 按顺序遍历 `servers` 中的s 集合，逐个交给共享工具处理。
  for (const s of servers) {
    // 满足 `s.type === 'connected') byState.connected++;else if (s.type === 'pending') ...` 时，共享工具执行该分支。
    if (s.type === 'connected') byState.connected++;else if (s.type === 'pending') byState.pending++;else if (s.type === 'needs-auth') byState.needsAuth++;else byState.failed++;
  }
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = [];
  // 满足 `byState.connected) parts.push(color('success', theme)(`${byState.connected}...` 时，共享工具执行该分支。
  if (byState.connected) parts.push(color('success', theme)(`${byState.connected} connected`));
  // 满足 `byState.needsAuth) parts.push(color('warning', theme)(`${byState.needsAuth}...` 时，共享工具执行该分支。
  if (byState.needsAuth) parts.push(color('warning', theme)(`${byState.needsAuth} need auth`));
  // 满足 `byState.pending) parts.push(color('inactive', theme)(`${byState.pending} pe...` 时，共享工具执行该分支。
  if (byState.pending) parts.push(color('inactive', theme)(`${byState.pending} pending`));
  // 满足 `byState.failed) parts.push(color('error', theme)(`${byState.failed} failed`)` 时，共享工具执行该分支。
  if (byState.failed) parts.push(color('error', theme)(`${byState.failed} failed`));
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{
    label: 'MCP servers',
    value: `${parts.join(', ')} ${color('inactive', theme)('· /mcp')}`
  }];
}
// buildMemoryDiagnostics 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function buildMemoryDiagnostics(): Promise<Diagnostic[]> {
  // files 文件数据读取`getMemoryFiles`，供共享工具后续处理使用。
  const files = await getMemoryFiles();
  // largeFiles 文件数据读取`getLargeMemoryFiles`，供共享工具后续处理使用。
  const largeFiles = getLargeMemoryFiles(files);
  // diagnostics 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const diagnostics: Diagnostic[] = [];
  // 调用 largeFiles.forEach，触发共享工具此处需要的副作用。
  largeFiles.forEach(file => {
    // displayPath 路径数据读取`getDisplayPath`，供共享工具后续处理使用。
    const displayPath = getDisplayPath(file.path);
    // diagnostics 集合追加新条目，保持收集顺序与输入顺序一致。
    diagnostics.push(`Large ${displayPath} will impact performance (${formatNumber(file.content.length)} chars > ${formatNumber(MAX_MEMORY_CHARACTER_COUNT)})`);
  });
  // 返回 `diagnostics`，作为共享工具这次计算的结果。
  return diagnostics;
}
// buildSettingSourcesProperties 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildSettingSourcesProperties(): Property[] {
  // enabledSources 集合读取`getEnabledSettingSources`，供共享工具后续处理使用。
  const enabledSources = getEnabledSettingSources();

  // Filter to only sources that actually have settings loaded
  // sourcesWithSettings 集合筛选`enabledSources.filter`，供共享工具后续处理使用。
  const sourcesWithSettings = enabledSources.filter(source => {
    // settings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
    const settings = getSettingsForSource(source);
    // 返回 `settings !== null && Object.keys(settings).length > 0`，作为共享工具这次计算的结果。
    return settings !== null && Object.keys(settings).length > 0;
  });

  // Map internal names to user-friendly names
  // For policySettings, distinguish between remote and local (or skip if neither exists)
  // sourceNames 集合派生`sourcesWithSettings.map`，供共享工具后续处理使用。
  const sourceNames = sourcesWithSettings.map(source => {
    // 当 `source` 匹配 `'policySettings'` 时，共享工具执行对应分支。
    if (source === 'policySettings') {
      // origin读取`getPolicySettingsOrigin`，供共享工具后续处理使用。
      const origin = getPolicySettingsOrigin();
      // 满足 `origin === null` 时，共享工具执行该分支。
      if (origin === null) {
        // 返回 `null; // Skip - no policy settings exist`，作为共享工具这次计算的结果。
        return null; // Skip - no policy settings exist
      }
      // 按照 origin 的取值选择共享工具的具体处理分支。
      switch (origin) {
        case 'remote':
          // 返回 `'Enterprise managed settings (remote)'`，作为共享工具这次计算的结果。
          return 'Enterprise managed settings (remote)';
        case 'plist':
          // 返回 `'Enterprise managed settings (plist)'`，作为共享工具这次计算的结果。
          return 'Enterprise managed settings (plist)';
        case 'hklm':
          // 返回 `'Enterprise managed settings (HKLM)'`，作为共享工具这次计算的结果。
          return 'Enterprise managed settings (HKLM)';
        case 'file':
          {
            // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
            const {
              hasBase,
              hasDropIns
            } = getManagedFileSettingsPresence();
            // 只有 `hasBase && hasDropIns` 满足时，共享工具才执行该分支。
            if (hasBase && hasDropIns) {
              // 返回 `'Enterprise managed settings (file + drop-ins)'`，作为共享工具这次计算的结果。
              return 'Enterprise managed settings (file + drop-ins)';
            }
            // 满足 `hasDropIns` 时，共享工具执行该分支。
            if (hasDropIns) {
              // 返回 `'Enterprise managed settings (drop-ins)'`，作为共享工具这次计算的结果。
              return 'Enterprise managed settings (drop-ins)';
            }
            // 返回 `'Enterprise managed settings (file)'`，作为共享工具这次计算的结果。
            return 'Enterprise managed settings (file)';
          }
        case 'hkcu':
          // 返回 `'Enterprise managed settings (HKCU)'`，作为共享工具这次计算的结果。
          return 'Enterprise managed settings (HKCU)';
      }
    }
    // 返回 `getSettingSourceDisplayNameCapitalized(source)`，作为共享工具这次计算的结果。
    return getSettingSourceDisplayNameCapitalized(source);
  // 这个回调绑定到 }).filter((name): name is string => name !== null);，负责共享工具在该局部场景下的响应。
  }).filter((name): name is string => name !== null);
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{
    label: 'Setting sources',
    value: sourceNames
  }];
}
// buildInstallationDiagnostics 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function buildInstallationDiagnostics(): Promise<Diagnostic[]> {
  // installWarnings 警告信息读取`checkInstall`，供共享工具后续处理使用。
  const installWarnings = await checkInstall();
  // 返回 `installWarnings.map(warning => warning.message)`，作为共享工具这次计算的结果。
  return installWarnings.map(warning => warning.message);
}
// buildInstallationHealthDiagnostics 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function buildInstallationHealthDiagnostics(): Promise<Diagnostic[]> {
  // diagnostic读取`getDoctorDiagnostic`，供共享工具后续处理使用。
  const diagnostic = await getDoctorDiagnostic();
  // items 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const items: Diagnostic[] = [];
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    errors: validationErrors
  } = getSettingsWithAllErrors();
  // 满足 `validationErrors.length > 0` 时，共享工具执行该分支。
  if (validationErrors.length > 0) {
    // invalidFiles 文件数据保存`Array.from`，供共享工具后续处理使用。
    const invalidFiles = Array.from(new Set(validationErrors.map(error => error.file)));
    // fileList 文件数据格式化`invalidFiles.join`，供共享工具后续处理使用。
    const fileList = invalidFiles.join(', ');
    // items 集合追加新条目，保持收集顺序与输入顺序一致。
    items.push(`Found invalid settings files: ${fileList}. They will be ignored.`);
  }

  // Add warnings from doctor diagnostic (includes leftover installations, config mismatches, etc.)
  // 调用 diagnostic.warnings.forEach，触发共享工具此处需要的副作用。
  diagnostic.warnings.forEach(warning => {
    // items 集合追加新条目，保持收集顺序与输入顺序一致。
    items.push(warning.issue);
  });
  // 满足 `diagnostic.hasUpdatePermissions === false` 时，共享工具执行该分支。
  if (diagnostic.hasUpdatePermissions === false) {
    // items 集合追加新条目，保持收集顺序与输入顺序一致。
    items.push('No write permissions for auto-updates (requires sudo)');
  }
  // 返回 `items`，作为共享工具这次计算的结果。
  return items;
}
// buildAccountProperties 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildAccountProperties(): Property[] {
  // accountInfo 数量格式化`getAccountInformation`，供共享工具后续处理使用。
  const accountInfo = getAccountInformation();
  // accountInfo 数量缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!accountInfo) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [];
  }
  // properties 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const properties: Property[] = [];
  // 满足 `accountInfo.subscription` 时，共享工具执行该分支。
  if (accountInfo.subscription) {
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'Login method',
      value: `${accountInfo.subscription} Account`
    });
  }
  // 满足 `accountInfo.tokenSource` 时，共享工具执行该分支。
  if (accountInfo.tokenSource) {
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'Auth token',
      value: accountInfo.tokenSource
    });
  }
  // 满足 `accountInfo.apiKeySource` 时，共享工具执行该分支。
  if (accountInfo.apiKeySource) {
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'API key',
      value: accountInfo.apiKeySource
    });
  }

  // Hide sensitive account info in demo mode
  // 只有 `accountInfo.organization && !process.env.IS_DEMO` 满足时，共享工具才执行该分支。
  if (accountInfo.organization && !process.env.IS_DEMO) {
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'Organization',
      value: accountInfo.organization
    });
  }
  // 只有 `accountInfo.email && !process.env.IS_DEMO` 满足时，共享工具才执行该分支。
  if (accountInfo.email && !process.env.IS_DEMO) {
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'Email',
      value: accountInfo.email
    });
  }
  // 返回 `properties`，作为共享工具这次计算的结果。
  return properties;
}
// buildAPIProviderProperties 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildAPIProviderProperties(): Property[] {
  // apiProvider读取`getAPIProvider`，供共享工具后续处理使用。
  const apiProvider = getAPIProvider();
  // properties 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const properties: Property[] = [];
  // `apiProvider` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (apiProvider !== 'firstParty') {
    // providerLabel集中保存共享工具 status要一起传递的字段。
    const providerLabel = {
      bedrock: 'AWS Bedrock',
      vertex: 'Google Vertex AI',
      foundry: 'Microsoft Foundry'
    }[apiProvider];
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'API provider',
      value: providerLabel
    });
  }
  // 当 `apiProvider` 匹配 `'firstParty'` 时，共享工具执行对应分支。
  if (apiProvider === 'firstParty') {
    // anthropicBaseUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL;
    // 满足 `anthropicBaseUrl` 时，共享工具执行该分支。
    if (anthropicBaseUrl) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        label: 'Anthropic base URL',
        value: anthropicBaseUrl
      });
    }
  // 共享工具 status在这里处理 `} else if (apiProvider === 'bedrock') {`，完成这一小步状态转换。
  } else if (apiProvider === 'bedrock') {
    // bedrockBaseUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const bedrockBaseUrl = process.env.BEDROCK_BASE_URL;
    // 满足 `bedrockBaseUrl` 时，共享工具执行该分支。
    if (bedrockBaseUrl) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        label: 'Bedrock base URL',
        value: bedrockBaseUrl
      });
    }
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'AWS region',
      value: getAWSRegion()
    });
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)` 时，共享工具执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        value: 'AWS auth skipped'
      });
    }
  // 共享工具 status在这里处理 `} else if (apiProvider === 'vertex') {`，完成这一小步状态转换。
  } else if (apiProvider === 'vertex') {
    // vertexBaseUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const vertexBaseUrl = process.env.VERTEX_BASE_URL;
    // 满足 `vertexBaseUrl` 时，共享工具执行该分支。
    if (vertexBaseUrl) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        label: 'Vertex base URL',
        value: vertexBaseUrl
      });
    }
    // gcpProject 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const gcpProject = process.env.ANTHROPIC_VERTEX_PROJECT_ID;
    // 满足 `gcpProject` 时，共享工具执行该分支。
    if (gcpProject) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        label: 'GCP project',
        value: gcpProject
      });
    }
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'Default region',
      value: getDefaultVertexRegion()
    });
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)` 时，共享工具执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        value: 'GCP auth skipped'
      });
    }
  // 共享工具 status在这里处理 `} else if (apiProvider === 'foundry') {`，完成这一小步状态转换。
  } else if (apiProvider === 'foundry') {
    // foundryBaseUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const foundryBaseUrl = process.env.ANTHROPIC_FOUNDRY_BASE_URL;
    // 满足 `foundryBaseUrl` 时，共享工具执行该分支。
    if (foundryBaseUrl) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        label: 'Microsoft Foundry base URL',
        value: foundryBaseUrl
      });
    }
    // foundryResource 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const foundryResource = process.env.ANTHROPIC_FOUNDRY_RESOURCE;
    // 满足 `foundryResource` 时，共享工具执行该分支。
    if (foundryResource) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        label: 'Microsoft Foundry resource',
        value: foundryResource
      });
    }
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FOUNDRY_AUTH)` 时，共享工具执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FOUNDRY_AUTH)) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        value: 'Microsoft Foundry auth skipped'
      });
    }
  }
  // proxyUrl读取`getProxyUrl`，供共享工具后续处理使用。
  const proxyUrl = getProxyUrl();
  // 满足 `proxyUrl` 时，共享工具执行该分支。
  if (proxyUrl) {
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'Proxy',
      value: proxyUrl
    });
  }
  // mtlsConfig 配置读取`getMTLSConfig`，供共享工具后续处理使用。
  const mtlsConfig = getMTLSConfig();
  // 满足 `process.env.NODE_EXTRA_CA_CERTS` 时，共享工具执行该分支。
  if (process.env.NODE_EXTRA_CA_CERTS) {
    // properties 集合追加新条目，保持收集顺序与输入顺序一致。
    properties.push({
      label: 'Additional CA cert(s)',
      value: process.env.NODE_EXTRA_CA_CERTS
    });
  }
  // 满足 `mtlsConfig` 时，共享工具执行该分支。
  if (mtlsConfig) {
    // 只有 `mtlsConfig.cert && process.env.CLAUDE_CODE_CLIENT` 满足时，共享工具才执行该分支。
    if (mtlsConfig.cert && process.env.CLAUDE_CODE_CLIENT_CERT) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        label: 'mTLS client cert',
        value: process.env.CLAUDE_CODE_CLIENT_CERT
      });
    }
    // 只有 `mtlsConfig.key && process.env.CLAUDE_CODE_CLIENT_` 满足时，共享工具才执行该分支。
    if (mtlsConfig.key && process.env.CLAUDE_CODE_CLIENT_KEY) {
      // properties 集合追加新条目，保持收集顺序与输入顺序一致。
      properties.push({
        label: 'mTLS client key',
        value: process.env.CLAUDE_CODE_CLIENT_KEY
      });
    }
  }
  // 返回 `properties`，作为共享工具这次计算的结果。
  return properties;
}
// getModelDisplayLabel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelDisplayLabel(mainLoopModel: string | null): string {
  // modelLabel保存`modelDisplayString`，供共享工具后续处理使用。
  let modelLabel = modelDisplayString(mainLoopModel);
  // 只有 `mainLoopModel === null && isClaudeAISubscriber()` 满足时，共享工具才执行该分支。
  if (mainLoopModel === null && isClaudeAISubscriber()) {
    // description读取`getClaudeAiUserDefaultModelDescription`，供共享工具后续处理使用。
    const description = getClaudeAiUserDefaultModelDescription();
    // modelLabel更新为 ``${chalk.bold('Default')} ${description}``，确保共享工具后续读取最新状态。
    modelLabel = `${chalk.bold('Default')} ${description}`;
  }
  // 返回 `modelLabel`，作为共享工具这次计算的结果。
  return modelLabel;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsImZpZ3VyZXMiLCJSZWFjdCIsImNvbG9yIiwiVGV4dCIsIk1DUFNlcnZlckNvbm5lY3Rpb24iLCJnZXRBY2NvdW50SW5mb3JtYXRpb24iLCJpc0NsYXVkZUFJU3Vic2NyaWJlciIsImdldExhcmdlTWVtb3J5RmlsZXMiLCJnZXRNZW1vcnlGaWxlcyIsIk1BWF9NRU1PUllfQ0hBUkFDVEVSX0NPVU5UIiwiZ2V0RG9jdG9yRGlhZ25vc3RpYyIsImdldEFXU1JlZ2lvbiIsImdldERlZmF1bHRWZXJ0ZXhSZWdpb24iLCJpc0VudlRydXRoeSIsImdldERpc3BsYXlQYXRoIiwiZm9ybWF0TnVtYmVyIiwiZ2V0SWRlQ2xpZW50TmFtZSIsIklERUV4dGVuc2lvbkluc3RhbGxhdGlvblN0YXR1cyIsImlzSmV0QnJhaW5zSWRlIiwidG9JREVEaXNwbGF5TmFtZSIsImdldENsYXVkZUFpVXNlckRlZmF1bHRNb2RlbERlc2NyaXB0aW9uIiwibW9kZWxEaXNwbGF5U3RyaW5nIiwiZ2V0QVBJUHJvdmlkZXIiLCJnZXRNVExTQ29uZmlnIiwiY2hlY2tJbnN0YWxsIiwiZ2V0UHJveHlVcmwiLCJTYW5kYm94TWFuYWdlciIsImdldFNldHRpbmdzV2l0aEFsbEVycm9ycyIsImdldEVuYWJsZWRTZXR0aW5nU291cmNlcyIsImdldFNldHRpbmdTb3VyY2VEaXNwbGF5TmFtZUNhcGl0YWxpemVkIiwiZ2V0TWFuYWdlZEZpbGVTZXR0aW5nc1ByZXNlbmNlIiwiZ2V0UG9saWN5U2V0dGluZ3NPcmlnaW4iLCJnZXRTZXR0aW5nc0ZvclNvdXJjZSIsIlRoZW1lTmFtZSIsIlByb3BlcnR5IiwibGFiZWwiLCJ2YWx1ZSIsIlJlYWN0Tm9kZSIsIkFycmF5IiwiRGlhZ25vc3RpYyIsImJ1aWxkU2FuZGJveFByb3BlcnRpZXMiLCJpc1NhbmRib3hlZCIsImlzU2FuZGJveGluZ0VuYWJsZWQiLCJidWlsZElERVByb3BlcnRpZXMiLCJtY3BDbGllbnRzIiwiaWRlSW5zdGFsbGF0aW9uU3RhdHVzIiwidGhlbWUiLCJpZGVDbGllbnQiLCJmaW5kIiwiY2xpZW50IiwibmFtZSIsImlkZU5hbWUiLCJpZGVUeXBlIiwicGx1Z2luT3JFeHRlbnNpb24iLCJlcnJvciIsImNyb3NzIiwiaW5zdGFsbGVkIiwidHlwZSIsImluc3RhbGxlZFZlcnNpb24iLCJzZXJ2ZXJJbmZvIiwidmVyc2lvbiIsImJ1aWxkTWNwUHJvcGVydGllcyIsImNsaWVudHMiLCJzZXJ2ZXJzIiwiZmlsdGVyIiwibGVuZ3RoIiwiYnlTdGF0ZSIsImNvbm5lY3RlZCIsInBlbmRpbmciLCJuZWVkc0F1dGgiLCJmYWlsZWQiLCJzIiwicGFydHMiLCJwdXNoIiwiam9pbiIsImJ1aWxkTWVtb3J5RGlhZ25vc3RpY3MiLCJQcm9taXNlIiwiZmlsZXMiLCJsYXJnZUZpbGVzIiwiZGlhZ25vc3RpY3MiLCJmb3JFYWNoIiwiZmlsZSIsImRpc3BsYXlQYXRoIiwicGF0aCIsImNvbnRlbnQiLCJidWlsZFNldHRpbmdTb3VyY2VzUHJvcGVydGllcyIsImVuYWJsZWRTb3VyY2VzIiwic291cmNlc1dpdGhTZXR0aW5ncyIsInNvdXJjZSIsInNldHRpbmdzIiwiT2JqZWN0Iiwia2V5cyIsInNvdXJjZU5hbWVzIiwibWFwIiwib3JpZ2luIiwiaGFzQmFzZSIsImhhc0Ryb3BJbnMiLCJidWlsZEluc3RhbGxhdGlvbkRpYWdub3N0aWNzIiwiaW5zdGFsbFdhcm5pbmdzIiwid2FybmluZyIsIm1lc3NhZ2UiLCJidWlsZEluc3RhbGxhdGlvbkhlYWx0aERpYWdub3N0aWNzIiwiZGlhZ25vc3RpYyIsIml0ZW1zIiwiZXJyb3JzIiwidmFsaWRhdGlvbkVycm9ycyIsImludmFsaWRGaWxlcyIsImZyb20iLCJTZXQiLCJmaWxlTGlzdCIsIndhcm5pbmdzIiwiaXNzdWUiLCJoYXNVcGRhdGVQZXJtaXNzaW9ucyIsImJ1aWxkQWNjb3VudFByb3BlcnRpZXMiLCJhY2NvdW50SW5mbyIsInByb3BlcnRpZXMiLCJzdWJzY3JpcHRpb24iLCJ0b2tlblNvdXJjZSIsImFwaUtleVNvdXJjZSIsIm9yZ2FuaXphdGlvbiIsInByb2Nlc3MiLCJlbnYiLCJJU19ERU1PIiwiZW1haWwiLCJidWlsZEFQSVByb3ZpZGVyUHJvcGVydGllcyIsImFwaVByb3ZpZGVyIiwicHJvdmlkZXJMYWJlbCIsImJlZHJvY2siLCJ2ZXJ0ZXgiLCJmb3VuZHJ5IiwiYW50aHJvcGljQmFzZVVybCIsIkFOVEhST1BJQ19CQVNFX1VSTCIsImJlZHJvY2tCYXNlVXJsIiwiQkVEUk9DS19CQVNFX1VSTCIsIkNMQVVERV9DT0RFX1NLSVBfQkVEUk9DS19BVVRIIiwidmVydGV4QmFzZVVybCIsIlZFUlRFWF9CQVNFX1VSTCIsImdjcFByb2plY3QiLCJBTlRIUk9QSUNfVkVSVEVYX1BST0pFQ1RfSUQiLCJDTEFVREVfQ09ERV9TS0lQX1ZFUlRFWF9BVVRIIiwiZm91bmRyeUJhc2VVcmwiLCJBTlRIUk9QSUNfRk9VTkRSWV9CQVNFX1VSTCIsImZvdW5kcnlSZXNvdXJjZSIsIkFOVEhST1BJQ19GT1VORFJZX1JFU09VUkNFIiwiQ0xBVURFX0NPREVfU0tJUF9GT1VORFJZX0FVVEgiLCJwcm94eVVybCIsIm10bHNDb25maWciLCJOT0RFX0VYVFJBX0NBX0NFUlRTIiwiY2VydCIsIkNMQVVERV9DT0RFX0NMSUVOVF9DRVJUIiwia2V5IiwiQ0xBVURFX0NPREVfQ0xJRU5UX0tFWSIsImdldE1vZGVsRGlzcGxheUxhYmVsIiwibWFpbkxvb3BNb2RlbCIsIm1vZGVsTGFiZWwiLCJkZXNjcmlwdGlvbiIsImJvbGQiXSwic291cmNlcyI6WyJzdGF0dXMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGNvbG9yLCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBNQ1BTZXJ2ZXJDb25uZWN0aW9uIH0gZnJvbSAnLi4vc2VydmljZXMvbWNwL3R5cGVzLmpzJ1xuaW1wb3J0IHsgZ2V0QWNjb3VudEluZm9ybWF0aW9uLCBpc0NsYXVkZUFJU3Vic2NyaWJlciB9IGZyb20gJy4vYXV0aC5qcydcbmltcG9ydCB7XG4gIGdldExhcmdlTWVtb3J5RmlsZXMsXG4gIGdldE1lbW9yeUZpbGVzLFxuICBNQVhfTUVNT1JZX0NIQVJBQ1RFUl9DT1VOVCxcbn0gZnJvbSAnLi9jbGF1ZGVtZC5qcydcbmltcG9ydCB7IGdldERvY3RvckRpYWdub3N0aWMgfSBmcm9tICcuL2RvY3RvckRpYWdub3N0aWMuanMnXG5pbXBvcnQge1xuICBnZXRBV1NSZWdpb24sXG4gIGdldERlZmF1bHRWZXJ0ZXhSZWdpb24sXG4gIGlzRW52VHJ1dGh5LFxufSBmcm9tICcuL2VudlV0aWxzLmpzJ1xuaW1wb3J0IHsgZ2V0RGlzcGxheVBhdGggfSBmcm9tICcuL2ZpbGUuanMnXG5pbXBvcnQgeyBmb3JtYXROdW1iZXIgfSBmcm9tICcuL2Zvcm1hdC5qcydcbmltcG9ydCB7XG4gIGdldElkZUNsaWVudE5hbWUsXG4gIHR5cGUgSURFRXh0ZW5zaW9uSW5zdGFsbGF0aW9uU3RhdHVzLFxuICBpc0pldEJyYWluc0lkZSxcbiAgdG9JREVEaXNwbGF5TmFtZSxcbn0gZnJvbSAnLi9pZGUuanMnXG5pbXBvcnQge1xuICBnZXRDbGF1ZGVBaVVzZXJEZWZhdWx0TW9kZWxEZXNjcmlwdGlvbixcbiAgbW9kZWxEaXNwbGF5U3RyaW5nLFxufSBmcm9tICcuL21vZGVsL21vZGVsLmpzJ1xuaW1wb3J0IHsgZ2V0QVBJUHJvdmlkZXIgfSBmcm9tICcuL21vZGVsL3Byb3ZpZGVycy5qcydcbmltcG9ydCB7IGdldE1UTFNDb25maWcgfSBmcm9tICcuL210bHMuanMnXG5pbXBvcnQgeyBjaGVja0luc3RhbGwgfSBmcm9tICcuL25hdGl2ZUluc3RhbGxlci9pbmRleC5qcydcbmltcG9ydCB7IGdldFByb3h5VXJsIH0gZnJvbSAnLi9wcm94eS5qcydcbmltcG9ydCB7IFNhbmRib3hNYW5hZ2VyIH0gZnJvbSAnLi9zYW5kYm94L3NhbmRib3gtYWRhcHRlci5qcydcbmltcG9ydCB7IGdldFNldHRpbmdzV2l0aEFsbEVycm9ycyB9IGZyb20gJy4vc2V0dGluZ3MvYWxsRXJyb3JzLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0RW5hYmxlZFNldHRpbmdTb3VyY2VzLFxuICBnZXRTZXR0aW5nU291cmNlRGlzcGxheU5hbWVDYXBpdGFsaXplZCxcbn0gZnJvbSAnLi9zZXR0aW5ncy9jb25zdGFudHMuanMnXG5pbXBvcnQge1xuICBnZXRNYW5hZ2VkRmlsZVNldHRpbmdzUHJlc2VuY2UsXG4gIGdldFBvbGljeVNldHRpbmdzT3JpZ2luLFxuICBnZXRTZXR0aW5nc0ZvclNvdXJjZSxcbn0gZnJvbSAnLi9zZXR0aW5ncy9zZXR0aW5ncy5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWVOYW1lIH0gZnJvbSAnLi90aGVtZS5qcydcblxuZXhwb3J0IHR5cGUgUHJvcGVydHkgPSB7XG4gIGxhYmVsPzogc3RyaW5nXG4gIHZhbHVlOiBSZWFjdC5SZWFjdE5vZGUgfCBBcnJheTxzdHJpbmc+XG59XG5cbmV4cG9ydCB0eXBlIERpYWdub3N0aWMgPSBSZWFjdC5SZWFjdE5vZGVcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU2FuZGJveFByb3BlcnRpZXMoKTogUHJvcGVydHlbXSB7XG4gIGlmIChcImV4dGVybmFsXCIgIT09ICdhbnQnKSB7XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICBjb25zdCBpc1NhbmRib3hlZCA9IFNhbmRib3hNYW5hZ2VyLmlzU2FuZGJveGluZ0VuYWJsZWQoKVxuXG4gIHJldHVybiBbXG4gICAge1xuICAgICAgbGFiZWw6ICdCYXNoIFNhbmRib3gnLFxuICAgICAgdmFsdWU6IGlzU2FuZGJveGVkID8gJ0VuYWJsZWQnIDogJ0Rpc2FibGVkJyxcbiAgICB9LFxuICBdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZElERVByb3BlcnRpZXMoXG4gIG1jcENsaWVudHM6IE1DUFNlcnZlckNvbm5lY3Rpb25bXSxcbiAgaWRlSW5zdGFsbGF0aW9uU3RhdHVzOiBJREVFeHRlbnNpb25JbnN0YWxsYXRpb25TdGF0dXMgfCBudWxsID0gbnVsbCxcbiAgdGhlbWU6IFRoZW1lTmFtZSxcbik6IFByb3BlcnR5W10ge1xuICBjb25zdCBpZGVDbGllbnQgPSBtY3BDbGllbnRzPy5maW5kKGNsaWVudCA9PiBjbGllbnQubmFtZSA9PT0gJ2lkZScpXG5cbiAgaWYgKGlkZUluc3RhbGxhdGlvblN0YXR1cykge1xuICAgIGNvbnN0IGlkZU5hbWUgPSB0b0lERURpc3BsYXlOYW1lKGlkZUluc3RhbGxhdGlvblN0YXR1cy5pZGVUeXBlKVxuICAgIGNvbnN0IHBsdWdpbk9yRXh0ZW5zaW9uID0gaXNKZXRCcmFpbnNJZGUoaWRlSW5zdGFsbGF0aW9uU3RhdHVzLmlkZVR5cGUpXG4gICAgICA/ICdwbHVnaW4nXG4gICAgICA6ICdleHRlbnNpb24nXG5cbiAgICBpZiAoaWRlSW5zdGFsbGF0aW9uU3RhdHVzLmVycm9yKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgbGFiZWw6ICdJREUnLFxuICAgICAgICAgIHZhbHVlOiAoXG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAge2NvbG9yKCdlcnJvcicsIHRoZW1lKShmaWd1cmVzLmNyb3NzKX0gRXJyb3IgaW5zdGFsbGluZyB7aWRlTmFtZX17JyAnfVxuICAgICAgICAgICAgICB7cGx1Z2luT3JFeHRlbnNpb259OiB7aWRlSW5zdGFsbGF0aW9uU3RhdHVzLmVycm9yfVxuICAgICAgICAgICAgICB7J1xcbid9UGxlYXNlIHJlc3RhcnQgeW91ciBJREUgYW5kIHRyeSBhZ2Fpbi5cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApLFxuICAgICAgICB9LFxuICAgICAgXVxuICAgIH1cblxuICAgIGlmIChpZGVJbnN0YWxsYXRpb25TdGF0dXMuaW5zdGFsbGVkKSB7XG4gICAgICBpZiAoaWRlQ2xpZW50ICYmIGlkZUNsaWVudC50eXBlID09PSAnY29ubmVjdGVkJykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgaWRlSW5zdGFsbGF0aW9uU3RhdHVzLmluc3RhbGxlZFZlcnNpb24gIT09XG4gICAgICAgICAgaWRlQ2xpZW50LnNlcnZlckluZm8/LnZlcnNpb25cbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGFiZWw6ICdJREUnLFxuICAgICAgICAgICAgICB2YWx1ZTogYENvbm5lY3RlZCB0byAke2lkZU5hbWV9ICR7cGx1Z2luT3JFeHRlbnNpb259IHZlcnNpb24gJHtpZGVJbnN0YWxsYXRpb25TdGF0dXMuaW5zdGFsbGVkVmVyc2lvbn0gKHNlcnZlciB2ZXJzaW9uOiAke2lkZUNsaWVudC5zZXJ2ZXJJbmZvPy52ZXJzaW9ufSlgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGFiZWw6ICdJREUnLFxuICAgICAgICAgICAgICB2YWx1ZTogYENvbm5lY3RlZCB0byAke2lkZU5hbWV9ICR7cGx1Z2luT3JFeHRlbnNpb259IHZlcnNpb24gJHtpZGVJbnN0YWxsYXRpb25TdGF0dXMuaW5zdGFsbGVkVmVyc2lvbn1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdJREUnLFxuICAgICAgICAgICAgdmFsdWU6IGBJbnN0YWxsZWQgJHtpZGVOYW1lfSAke3BsdWdpbk9yRXh0ZW5zaW9ufWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgXVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpZGVDbGllbnQpIHtcbiAgICBjb25zdCBpZGVOYW1lID0gZ2V0SWRlQ2xpZW50TmFtZShpZGVDbGllbnQpID8/ICdJREUnXG4gICAgaWYgKGlkZUNsaWVudC50eXBlID09PSAnY29ubmVjdGVkJykge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIGxhYmVsOiAnSURFJyxcbiAgICAgICAgICB2YWx1ZTogYENvbm5lY3RlZCB0byAke2lkZU5hbWV9IGV4dGVuc2lvbmAsXG4gICAgICAgIH0sXG4gICAgICBdXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsYWJlbDogJ0lERScsXG4gICAgICAgICAgdmFsdWU6IGAke2NvbG9yKCdlcnJvcicsIHRoZW1lKShmaWd1cmVzLmNyb3NzKX0gTm90IGNvbm5lY3RlZCB0byAke2lkZU5hbWV9YCxcbiAgICAgICAgfSxcbiAgICAgIF1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gW11cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTWNwUHJvcGVydGllcyhcbiAgY2xpZW50czogTUNQU2VydmVyQ29ubmVjdGlvbltdID0gW10sXG4gIHRoZW1lOiBUaGVtZU5hbWUsXG4pOiBQcm9wZXJ0eVtdIHtcbiAgY29uc3Qgc2VydmVycyA9IGNsaWVudHMuZmlsdGVyKGNsaWVudCA9PiBjbGllbnQubmFtZSAhPT0gJ2lkZScpXG4gIGlmICghc2VydmVycy5sZW5ndGgpIHtcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIC8vIFN1bW1hcnkgaW5zdGVhZCBvZiBhIGZ1bGwgc2VydmVyIGxpc3Qg4oCUIDIwKyBzZXJ2ZXJzIHdyYXBwZWQgb250byBtYW55XG4gIC8vIHJvd3MsIGRvbWluYXRpbmcgdGhlIFN0YXR1cyBwYW5lLiBTaG93IGNvdW50cyBieSBzdGF0ZSArIC9tY3AgaGludC5cbiAgY29uc3QgYnlTdGF0ZSA9IHsgY29ubmVjdGVkOiAwLCBwZW5kaW5nOiAwLCBuZWVkc0F1dGg6IDAsIGZhaWxlZDogMCB9XG4gIGZvciAoY29uc3QgcyBvZiBzZXJ2ZXJzKSB7XG4gICAgaWYgKHMudHlwZSA9PT0gJ2Nvbm5lY3RlZCcpIGJ5U3RhdGUuY29ubmVjdGVkKytcbiAgICBlbHNlIGlmIChzLnR5cGUgPT09ICdwZW5kaW5nJykgYnlTdGF0ZS5wZW5kaW5nKytcbiAgICBlbHNlIGlmIChzLnR5cGUgPT09ICduZWVkcy1hdXRoJykgYnlTdGF0ZS5uZWVkc0F1dGgrK1xuICAgIGVsc2UgYnlTdGF0ZS5mYWlsZWQrK1xuICB9XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdXG4gIGlmIChieVN0YXRlLmNvbm5lY3RlZClcbiAgICBwYXJ0cy5wdXNoKGNvbG9yKCdzdWNjZXNzJywgdGhlbWUpKGAke2J5U3RhdGUuY29ubmVjdGVkfSBjb25uZWN0ZWRgKSlcbiAgaWYgKGJ5U3RhdGUubmVlZHNBdXRoKVxuICAgIHBhcnRzLnB1c2goY29sb3IoJ3dhcm5pbmcnLCB0aGVtZSkoYCR7YnlTdGF0ZS5uZWVkc0F1dGh9IG5lZWQgYXV0aGApKVxuICBpZiAoYnlTdGF0ZS5wZW5kaW5nKVxuICAgIHBhcnRzLnB1c2goY29sb3IoJ2luYWN0aXZlJywgdGhlbWUpKGAke2J5U3RhdGUucGVuZGluZ30gcGVuZGluZ2ApKVxuICBpZiAoYnlTdGF0ZS5mYWlsZWQpXG4gICAgcGFydHMucHVzaChjb2xvcignZXJyb3InLCB0aGVtZSkoYCR7YnlTdGF0ZS5mYWlsZWR9IGZhaWxlZGApKVxuXG4gIHJldHVybiBbXG4gICAge1xuICAgICAgbGFiZWw6ICdNQ1Agc2VydmVycycsXG4gICAgICB2YWx1ZTogYCR7cGFydHMuam9pbignLCAnKX0gJHtjb2xvcignaW5hY3RpdmUnLCB0aGVtZSkoJ8K3IC9tY3AnKX1gLFxuICAgIH0sXG4gIF1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkTWVtb3J5RGlhZ25vc3RpY3MoKTogUHJvbWlzZTxEaWFnbm9zdGljW10+IHtcbiAgY29uc3QgZmlsZXMgPSBhd2FpdCBnZXRNZW1vcnlGaWxlcygpXG4gIGNvbnN0IGxhcmdlRmlsZXMgPSBnZXRMYXJnZU1lbW9yeUZpbGVzKGZpbGVzKVxuXG4gIGNvbnN0IGRpYWdub3N0aWNzOiBEaWFnbm9zdGljW10gPSBbXVxuXG4gIGxhcmdlRmlsZXMuZm9yRWFjaChmaWxlID0+IHtcbiAgICBjb25zdCBkaXNwbGF5UGF0aCA9IGdldERpc3BsYXlQYXRoKGZpbGUucGF0aClcbiAgICBkaWFnbm9zdGljcy5wdXNoKFxuICAgICAgYExhcmdlICR7ZGlzcGxheVBhdGh9IHdpbGwgaW1wYWN0IHBlcmZvcm1hbmNlICgke2Zvcm1hdE51bWJlcihmaWxlLmNvbnRlbnQubGVuZ3RoKX0gY2hhcnMgPiAke2Zvcm1hdE51bWJlcihNQVhfTUVNT1JZX0NIQVJBQ1RFUl9DT1VOVCl9KWAsXG4gICAgKVxuICB9KVxuXG4gIHJldHVybiBkaWFnbm9zdGljc1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTZXR0aW5nU291cmNlc1Byb3BlcnRpZXMoKTogUHJvcGVydHlbXSB7XG4gIGNvbnN0IGVuYWJsZWRTb3VyY2VzID0gZ2V0RW5hYmxlZFNldHRpbmdTb3VyY2VzKClcblxuICAvLyBGaWx0ZXIgdG8gb25seSBzb3VyY2VzIHRoYXQgYWN0dWFsbHkgaGF2ZSBzZXR0aW5ncyBsb2FkZWRcbiAgY29uc3Qgc291cmNlc1dpdGhTZXR0aW5ncyA9IGVuYWJsZWRTb3VyY2VzLmZpbHRlcihzb3VyY2UgPT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gZ2V0U2V0dGluZ3NGb3JTb3VyY2Uoc291cmNlKVxuICAgIHJldHVybiBzZXR0aW5ncyAhPT0gbnVsbCAmJiBPYmplY3Qua2V5cyhzZXR0aW5ncykubGVuZ3RoID4gMFxuICB9KVxuXG4gIC8vIE1hcCBpbnRlcm5hbCBuYW1lcyB0byB1c2VyLWZyaWVuZGx5IG5hbWVzXG4gIC8vIEZvciBwb2xpY3lTZXR0aW5ncywgZGlzdGluZ3Vpc2ggYmV0d2VlbiByZW1vdGUgYW5kIGxvY2FsIChvciBza2lwIGlmIG5laXRoZXIgZXhpc3RzKVxuICBjb25zdCBzb3VyY2VOYW1lcyA9IHNvdXJjZXNXaXRoU2V0dGluZ3NcbiAgICAubWFwKHNvdXJjZSA9PiB7XG4gICAgICBpZiAoc291cmNlID09PSAncG9saWN5U2V0dGluZ3MnKSB7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IGdldFBvbGljeVNldHRpbmdzT3JpZ2luKClcbiAgICAgICAgaWYgKG9yaWdpbiA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsIC8vIFNraXAgLSBubyBwb2xpY3kgc2V0dGluZ3MgZXhpc3RcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKG9yaWdpbikge1xuICAgICAgICAgIGNhc2UgJ3JlbW90ZSc6XG4gICAgICAgICAgICByZXR1cm4gJ0VudGVycHJpc2UgbWFuYWdlZCBzZXR0aW5ncyAocmVtb3RlKSdcbiAgICAgICAgICBjYXNlICdwbGlzdCc6XG4gICAgICAgICAgICByZXR1cm4gJ0VudGVycHJpc2UgbWFuYWdlZCBzZXR0aW5ncyAocGxpc3QpJ1xuICAgICAgICAgIGNhc2UgJ2hrbG0nOlxuICAgICAgICAgICAgcmV0dXJuICdFbnRlcnByaXNlIG1hbmFnZWQgc2V0dGluZ3MgKEhLTE0pJ1xuICAgICAgICAgIGNhc2UgJ2ZpbGUnOiB7XG4gICAgICAgICAgICBjb25zdCB7IGhhc0Jhc2UsIGhhc0Ryb3BJbnMgfSA9IGdldE1hbmFnZWRGaWxlU2V0dGluZ3NQcmVzZW5jZSgpXG4gICAgICAgICAgICBpZiAoaGFzQmFzZSAmJiBoYXNEcm9wSW5zKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnRW50ZXJwcmlzZSBtYW5hZ2VkIHNldHRpbmdzIChmaWxlICsgZHJvcC1pbnMpJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhhc0Ryb3BJbnMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdFbnRlcnByaXNlIG1hbmFnZWQgc2V0dGluZ3MgKGRyb3AtaW5zKSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAnRW50ZXJwcmlzZSBtYW5hZ2VkIHNldHRpbmdzIChmaWxlKSdcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSAnaGtjdSc6XG4gICAgICAgICAgICByZXR1cm4gJ0VudGVycHJpc2UgbWFuYWdlZCBzZXR0aW5ncyAoSEtDVSknXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXRTZXR0aW5nU291cmNlRGlzcGxheU5hbWVDYXBpdGFsaXplZChzb3VyY2UpXG4gICAgfSlcbiAgICAuZmlsdGVyKChuYW1lKTogbmFtZSBpcyBzdHJpbmcgPT4gbmFtZSAhPT0gbnVsbClcblxuICByZXR1cm4gW1xuICAgIHtcbiAgICAgIGxhYmVsOiAnU2V0dGluZyBzb3VyY2VzJyxcbiAgICAgIHZhbHVlOiBzb3VyY2VOYW1lcyxcbiAgICB9LFxuICBdXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZEluc3RhbGxhdGlvbkRpYWdub3N0aWNzKCk6IFByb21pc2U8RGlhZ25vc3RpY1tdPiB7XG4gIGNvbnN0IGluc3RhbGxXYXJuaW5ncyA9IGF3YWl0IGNoZWNrSW5zdGFsbCgpXG4gIHJldHVybiBpbnN0YWxsV2FybmluZ3MubWFwKHdhcm5pbmcgPT4gd2FybmluZy5tZXNzYWdlKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGRJbnN0YWxsYXRpb25IZWFsdGhEaWFnbm9zdGljcygpOiBQcm9taXNlPFxuICBEaWFnbm9zdGljW11cbj4ge1xuICBjb25zdCBkaWFnbm9zdGljID0gYXdhaXQgZ2V0RG9jdG9yRGlhZ25vc3RpYygpXG4gIGNvbnN0IGl0ZW1zOiBEaWFnbm9zdGljW10gPSBbXVxuXG4gIGNvbnN0IHsgZXJyb3JzOiB2YWxpZGF0aW9uRXJyb3JzIH0gPSBnZXRTZXR0aW5nc1dpdGhBbGxFcnJvcnMoKVxuICBpZiAodmFsaWRhdGlvbkVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaW52YWxpZEZpbGVzID0gQXJyYXkuZnJvbShcbiAgICAgIG5ldyBTZXQodmFsaWRhdGlvbkVycm9ycy5tYXAoZXJyb3IgPT4gZXJyb3IuZmlsZSkpLFxuICAgIClcbiAgICBjb25zdCBmaWxlTGlzdCA9IGludmFsaWRGaWxlcy5qb2luKCcsICcpXG5cbiAgICBpdGVtcy5wdXNoKFxuICAgICAgYEZvdW5kIGludmFsaWQgc2V0dGluZ3MgZmlsZXM6ICR7ZmlsZUxpc3R9LiBUaGV5IHdpbGwgYmUgaWdub3JlZC5gLFxuICAgIClcbiAgfVxuXG4gIC8vIEFkZCB3YXJuaW5ncyBmcm9tIGRvY3RvciBkaWFnbm9zdGljIChpbmNsdWRlcyBsZWZ0b3ZlciBpbnN0YWxsYXRpb25zLCBjb25maWcgbWlzbWF0Y2hlcywgZXRjLilcbiAgZGlhZ25vc3RpYy53YXJuaW5ncy5mb3JFYWNoKHdhcm5pbmcgPT4ge1xuICAgIGl0ZW1zLnB1c2god2FybmluZy5pc3N1ZSlcbiAgfSlcblxuICBpZiAoZGlhZ25vc3RpYy5oYXNVcGRhdGVQZXJtaXNzaW9ucyA9PT0gZmFsc2UpIHtcbiAgICBpdGVtcy5wdXNoKCdObyB3cml0ZSBwZXJtaXNzaW9ucyBmb3IgYXV0by11cGRhdGVzIChyZXF1aXJlcyBzdWRvKScpXG4gIH1cblxuICByZXR1cm4gaXRlbXNcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkQWNjb3VudFByb3BlcnRpZXMoKTogUHJvcGVydHlbXSB7XG4gIGNvbnN0IGFjY291bnRJbmZvID0gZ2V0QWNjb3VudEluZm9ybWF0aW9uKClcbiAgaWYgKCFhY2NvdW50SW5mbykge1xuICAgIHJldHVybiBbXVxuICB9XG5cbiAgY29uc3QgcHJvcGVydGllczogUHJvcGVydHlbXSA9IFtdXG5cbiAgaWYgKGFjY291bnRJbmZvLnN1YnNjcmlwdGlvbikge1xuICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICBsYWJlbDogJ0xvZ2luIG1ldGhvZCcsXG4gICAgICB2YWx1ZTogYCR7YWNjb3VudEluZm8uc3Vic2NyaXB0aW9ufSBBY2NvdW50YCxcbiAgICB9KVxuICB9XG5cbiAgaWYgKGFjY291bnRJbmZvLnRva2VuU291cmNlKSB7XG4gICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgIGxhYmVsOiAnQXV0aCB0b2tlbicsXG4gICAgICB2YWx1ZTogYWNjb3VudEluZm8udG9rZW5Tb3VyY2UsXG4gICAgfSlcbiAgfVxuXG4gIGlmIChhY2NvdW50SW5mby5hcGlLZXlTb3VyY2UpIHtcbiAgICBwcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgbGFiZWw6ICdBUEkga2V5JyxcbiAgICAgIHZhbHVlOiBhY2NvdW50SW5mby5hcGlLZXlTb3VyY2UsXG4gICAgfSlcbiAgfVxuXG4gIC8vIEhpZGUgc2Vuc2l0aXZlIGFjY291bnQgaW5mbyBpbiBkZW1vIG1vZGVcbiAgaWYgKGFjY291bnRJbmZvLm9yZ2FuaXphdGlvbiAmJiAhcHJvY2Vzcy5lbnYuSVNfREVNTykge1xuICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICBsYWJlbDogJ09yZ2FuaXphdGlvbicsXG4gICAgICB2YWx1ZTogYWNjb3VudEluZm8ub3JnYW5pemF0aW9uLFxuICAgIH0pXG4gIH1cbiAgaWYgKGFjY291bnRJbmZvLmVtYWlsICYmICFwcm9jZXNzLmVudi5JU19ERU1PKSB7XG4gICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgIGxhYmVsOiAnRW1haWwnLFxuICAgICAgdmFsdWU6IGFjY291bnRJbmZvLmVtYWlsLFxuICAgIH0pXG4gIH1cblxuICByZXR1cm4gcHJvcGVydGllc1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRBUElQcm92aWRlclByb3BlcnRpZXMoKTogUHJvcGVydHlbXSB7XG4gIGNvbnN0IGFwaVByb3ZpZGVyID0gZ2V0QVBJUHJvdmlkZXIoKVxuXG4gIGNvbnN0IHByb3BlcnRpZXM6IFByb3BlcnR5W10gPSBbXVxuXG4gIGlmIChhcGlQcm92aWRlciAhPT0gJ2ZpcnN0UGFydHknKSB7XG4gICAgY29uc3QgcHJvdmlkZXJMYWJlbCA9IHtcbiAgICAgIGJlZHJvY2s6ICdBV1MgQmVkcm9jaycsXG4gICAgICB2ZXJ0ZXg6ICdHb29nbGUgVmVydGV4IEFJJyxcbiAgICAgIGZvdW5kcnk6ICdNaWNyb3NvZnQgRm91bmRyeScsXG4gICAgfVthcGlQcm92aWRlcl1cblxuICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICBsYWJlbDogJ0FQSSBwcm92aWRlcicsXG4gICAgICB2YWx1ZTogcHJvdmlkZXJMYWJlbCxcbiAgICB9KVxuICB9XG5cbiAgaWYgKGFwaVByb3ZpZGVyID09PSAnZmlyc3RQYXJ0eScpIHtcbiAgICBjb25zdCBhbnRocm9waWNCYXNlVXJsID0gcHJvY2Vzcy5lbnYuQU5USFJPUElDX0JBU0VfVVJMXG4gICAgaWYgKGFudGhyb3BpY0Jhc2VVcmwpIHtcbiAgICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgIGxhYmVsOiAnQW50aHJvcGljIGJhc2UgVVJMJyxcbiAgICAgICAgdmFsdWU6IGFudGhyb3BpY0Jhc2VVcmwsXG4gICAgICB9KVxuICAgIH1cbiAgfSBlbHNlIGlmIChhcGlQcm92aWRlciA9PT0gJ2JlZHJvY2snKSB7XG4gICAgY29uc3QgYmVkcm9ja0Jhc2VVcmwgPSBwcm9jZXNzLmVudi5CRURST0NLX0JBU0VfVVJMXG4gICAgaWYgKGJlZHJvY2tCYXNlVXJsKSB7XG4gICAgICBwcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgICBsYWJlbDogJ0JlZHJvY2sgYmFzZSBVUkwnLFxuICAgICAgICB2YWx1ZTogYmVkcm9ja0Jhc2VVcmwsXG4gICAgICB9KVxuICAgIH1cblxuICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICBsYWJlbDogJ0FXUyByZWdpb24nLFxuICAgICAgdmFsdWU6IGdldEFXU1JlZ2lvbigpLFxuICAgIH0pXG5cbiAgICBpZiAoaXNFbnZUcnV0aHkocHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfU0tJUF9CRURST0NLX0FVVEgpKSB7XG4gICAgICBwcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgICB2YWx1ZTogJ0FXUyBhdXRoIHNraXBwZWQnLFxuICAgICAgfSlcbiAgICB9XG4gIH0gZWxzZSBpZiAoYXBpUHJvdmlkZXIgPT09ICd2ZXJ0ZXgnKSB7XG4gICAgY29uc3QgdmVydGV4QmFzZVVybCA9IHByb2Nlc3MuZW52LlZFUlRFWF9CQVNFX1VSTFxuICAgIGlmICh2ZXJ0ZXhCYXNlVXJsKSB7XG4gICAgICBwcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgICBsYWJlbDogJ1ZlcnRleCBiYXNlIFVSTCcsXG4gICAgICAgIHZhbHVlOiB2ZXJ0ZXhCYXNlVXJsLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBnY3BQcm9qZWN0ID0gcHJvY2Vzcy5lbnYuQU5USFJPUElDX1ZFUlRFWF9QUk9KRUNUX0lEXG4gICAgaWYgKGdjcFByb2plY3QpIHtcbiAgICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgIGxhYmVsOiAnR0NQIHByb2plY3QnLFxuICAgICAgICB2YWx1ZTogZ2NwUHJvamVjdCxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgIGxhYmVsOiAnRGVmYXVsdCByZWdpb24nLFxuICAgICAgdmFsdWU6IGdldERlZmF1bHRWZXJ0ZXhSZWdpb24oKSxcbiAgICB9KVxuXG4gICAgaWYgKGlzRW52VHJ1dGh5KHByb2Nlc3MuZW52LkNMQVVERV9DT0RFX1NLSVBfVkVSVEVYX0FVVEgpKSB7XG4gICAgICBwcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgICB2YWx1ZTogJ0dDUCBhdXRoIHNraXBwZWQnLFxuICAgICAgfSlcbiAgICB9XG4gIH0gZWxzZSBpZiAoYXBpUHJvdmlkZXIgPT09ICdmb3VuZHJ5Jykge1xuICAgIGNvbnN0IGZvdW5kcnlCYXNlVXJsID0gcHJvY2Vzcy5lbnYuQU5USFJPUElDX0ZPVU5EUllfQkFTRV9VUkxcbiAgICBpZiAoZm91bmRyeUJhc2VVcmwpIHtcbiAgICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgIGxhYmVsOiAnTWljcm9zb2Z0IEZvdW5kcnkgYmFzZSBVUkwnLFxuICAgICAgICB2YWx1ZTogZm91bmRyeUJhc2VVcmwsXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IGZvdW5kcnlSZXNvdXJjZSA9IHByb2Nlc3MuZW52LkFOVEhST1BJQ19GT1VORFJZX1JFU09VUkNFXG4gICAgaWYgKGZvdW5kcnlSZXNvdXJjZSkge1xuICAgICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgICAgbGFiZWw6ICdNaWNyb3NvZnQgRm91bmRyeSByZXNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmb3VuZHJ5UmVzb3VyY2UsXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChpc0VudlRydXRoeShwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9TS0lQX0ZPVU5EUllfQVVUSCkpIHtcbiAgICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICAgIHZhbHVlOiAnTWljcm9zb2Z0IEZvdW5kcnkgYXV0aCBza2lwcGVkJyxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgY29uc3QgcHJveHlVcmwgPSBnZXRQcm94eVVybCgpXG4gIGlmIChwcm94eVVybCkge1xuICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICBsYWJlbDogJ1Byb3h5JyxcbiAgICAgIHZhbHVlOiBwcm94eVVybCxcbiAgICB9KVxuICB9XG5cbiAgY29uc3QgbXRsc0NvbmZpZyA9IGdldE1UTFNDb25maWcoKVxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FWFRSQV9DQV9DRVJUUykge1xuICAgIHByb3BlcnRpZXMucHVzaCh7XG4gICAgICBsYWJlbDogJ0FkZGl0aW9uYWwgQ0EgY2VydChzKScsXG4gICAgICB2YWx1ZTogcHJvY2Vzcy5lbnYuTk9ERV9FWFRSQV9DQV9DRVJUUyxcbiAgICB9KVxuICB9XG4gIGlmIChtdGxzQ29uZmlnKSB7XG4gICAgaWYgKG10bHNDb25maWcuY2VydCAmJiBwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9DTElFTlRfQ0VSVCkge1xuICAgICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgICAgbGFiZWw6ICdtVExTIGNsaWVudCBjZXJ0JyxcbiAgICAgICAgdmFsdWU6IHByb2Nlc3MuZW52LkNMQVVERV9DT0RFX0NMSUVOVF9DRVJULFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAobXRsc0NvbmZpZy5rZXkgJiYgcHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfQ0xJRU5UX0tFWSkge1xuICAgICAgcHJvcGVydGllcy5wdXNoKHtcbiAgICAgICAgbGFiZWw6ICdtVExTIGNsaWVudCBrZXknLFxuICAgICAgICB2YWx1ZTogcHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfQ0xJRU5UX0tFWSxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHByb3BlcnRpZXNcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZGVsRGlzcGxheUxhYmVsKG1haW5Mb29wTW9kZWw6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcge1xuICBsZXQgbW9kZWxMYWJlbCA9IG1vZGVsRGlzcGxheVN0cmluZyhtYWluTG9vcE1vZGVsKVxuXG4gIGlmIChtYWluTG9vcE1vZGVsID09PSBudWxsICYmIGlzQ2xhdWRlQUlTdWJzY3JpYmVyKCkpIHtcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IGdldENsYXVkZUFpVXNlckRlZmF1bHRNb2RlbERlc2NyaXB0aW9uKClcblxuICAgIG1vZGVsTGFiZWwgPSBgJHtjaGFsay5ib2xkKCdEZWZhdWx0Jyl9ICR7ZGVzY3JpcHRpb259YFxuICB9XG5cbiAgcmV0dXJuIG1vZGVsTGFiZWxcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsT0FBT0MsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxLQUFLLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3ZDLGNBQWNDLG1CQUFtQixRQUFRLDBCQUEwQjtBQUNuRSxTQUFTQyxxQkFBcUIsRUFBRUMsb0JBQW9CLFFBQVEsV0FBVztBQUN2RSxTQUNFQyxtQkFBbUIsRUFDbkJDLGNBQWMsRUFDZEMsMEJBQTBCLFFBQ3JCLGVBQWU7QUFDdEIsU0FBU0MsbUJBQW1CLFFBQVEsdUJBQXVCO0FBQzNELFNBQ0VDLFlBQVks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
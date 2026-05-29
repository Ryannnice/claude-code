// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile, stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname } from 'path'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  downloadUserSettings,
  redownloadUserSettings,
} from 'src/services/settingsSync/index.js'
// 接入 waitForRemoteManagedSettingsToLoad 服务层能力，把外部通信或共享状态交给 src/services/remoteManagedSettings/index.js 处理。
import { waitForRemoteManagedSettingsToLoad } from 'src/services/remoteManagedSettings/index.js'
// 引入 StructuredIO，将 src/cli/structuredIO.js 中已经封装好的能力接到本文件流程里。
import { StructuredIO } from 'src/cli/structuredIO.js'
// 引入 RemoteIO，将 src/cli/remoteIO.js 中已经封装好的能力接到本文件流程里。
import { RemoteIO } from 'src/cli/remoteIO.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  type Command,
  formatDescriptionWithSource,
  getCommandName,
} from 'src/commands.js'
// 复用 createStreamlinedTransformer 工具函数，把通用处理留在 src/utils/streamlinedTransform.js 中维护。
import { createStreamlinedTransformer } from 'src/utils/streamlinedTransform.js'
// 复用 installStreamJsonStdoutGuard 工具函数，把通用处理留在 src/utils/streamJsonStdoutGuard.js 中维护。
import { installStreamJsonStdoutGuard } from 'src/utils/streamJsonStdoutGuard.js'
// 类型依赖 { ToolPermissionContext } 来自 src/Tool.js，用于校准print的数据契约。
import type { ToolPermissionContext } from 'src/Tool.js'
// 类型依赖 { ThinkingConfig } 来自 src/utils/thinking.js，用于校准print的数据契约。
import type { ThinkingConfig } from 'src/utils/thinking.js'
// 引入 assembleToolPool、filterToolsByDenyRules，将 src/tools.js 中已经封装好的能力接到本文件流程里。
import { assembleToolPool, filterToolsByDenyRules } from 'src/tools.js'
// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'
// 复用 uniq 工具函数，把通用处理留在 src/utils/array.js 中维护。
import { uniq } from 'src/utils/array.js'
// 复用 mergeAndFilterTools 工具函数，把通用处理留在 src/utils/toolPool.js 中维护。
import { mergeAndFilterTools } from 'src/utils/toolPool.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  logEvent,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
} from 'src/services/analytics/index.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  logForDiagnosticsNoPII,
  withDiagnosticsTiming,
} from 'src/utils/diagLogs.js'
// 引入 toolMatchesName、Tool、Tools，将 src/Tool.js 中已经封装好的能力接到本文件流程里。
import { toolMatchesName, type Tool, type Tools } from 'src/Tool.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  type AgentDefinition,
  isBuiltInAgent,
  parseAgentsFromJson,
} from 'src/tools/AgentTool/loadAgentsDir.js'
// 类型依赖 { Message, NormalizedUserMessage } 来自 src/types/message.js，用于校准print的数据契约。
import type { Message, NormalizedUserMessage } from 'src/types/message.js'
// 类型依赖 { QueuedCommand } 来自 src/types/textInputTypes.js，用于校准print的数据契约。
import type { QueuedCommand } from 'src/types/textInputTypes.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  dequeue,
  dequeueAllMatching,
  enqueue,
  hasCommandsInQueue,
  peek,
  subscribeToCommandQueue,
  getCommandsByMaxPriority,
} from 'src/utils/messageQueueManager.js'
// 复用 notifyCommandLifecycle 工具函数，把通用处理留在 src/utils/commandLifecycle.js 中维护。
import { notifyCommandLifecycle } from 'src/utils/commandLifecycle.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  getSessionState,
  notifySessionStateChanged,
  notifySessionMetadataChanged,
  setPermissionModeChangedListener,
  type RequiresActionDetails,
  type SessionExternalMetadata,
} from 'src/utils/sessionState.js'
// 引入 externalMetadataToAppState，将 src/state/onChangeAppState.js 中已经封装好的能力接到本文件流程里。
import { externalMetadataToAppState } from 'src/state/onChangeAppState.js'
// 复用 getInMemoryErrors、logError、logMCPDebug 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { getInMemoryErrors, logError, logMCPDebug } from 'src/utils/log.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  writeToStdout,
  registerProcessOutputErrorHandlers,
} from 'src/utils/process.js'
// 类型依赖 { Stream } 来自 src/utils/stream.js，用于校准print的数据契约。
import type { Stream } from 'src/utils/stream.js'
// 接入 EMPTY_USAGE 服务层能力，把外部通信或共享状态交给 src/services/api/logging.js 处理。
import { EMPTY_USAGE } from 'src/services/api/logging.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  loadConversationForResume,
  type TurnInterruptionState,
} from 'src/utils/conversationRecovery.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import type {
  MCPServerConnection,
  McpSdkServerConfig,
  ScopedMcpServerConfig,
} from 'src/services/mcp/types.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  ChannelMessageNotificationSchema,
  gateChannelServer,
  wrapChannelMessage,
  findChannelEntry,
} from 'src/services/mcp/channelNotification.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  isChannelAllowlisted,
  isChannelsEnabled,
} from 'src/services/mcp/channelAllowlist.js'
// 复用 parsePluginIdentifier 工具函数，把通用处理留在 src/utils/plugins/pluginIdentifier.js 中维护。
import { parsePluginIdentifier } from 'src/utils/plugins/pluginIdentifier.js'
// 复用 validateUuid 工具函数，把通用处理留在 src/utils/uuid.js 中维护。
import { validateUuid } from 'src/utils/uuid.js'
// 复用 fromArray 工具函数，把通用处理留在 src/utils/generators.js 中维护。
import { fromArray } from 'src/utils/generators.js'
// 引入 ask，将 src/QueryEngine.js 中已经封装好的能力接到本文件流程里。
import { ask } from 'src/QueryEngine.js'
// 类型依赖 { PermissionPromptTool } 来自 src/utils/queryHelpers.js，用于校准print的数据契约。
import type { PermissionPromptTool } from 'src/utils/queryHelpers.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  createFileStateCacheWithSizeLimit,
  mergeFileStateCaches,
  READ_FILE_STATE_CACHE_SIZE,
} from 'src/utils/fileStateCache.js'
// 复用 expandPath 工具函数，把通用处理留在 src/utils/path.js 中维护。
import { expandPath } from 'src/utils/path.js'
// 复用 extractReadFilesFromMessages 工具函数，把通用处理留在 src/utils/queryHelpers.js 中维护。
import { extractReadFilesFromMessages } from 'src/utils/queryHelpers.js'
// 复用 registerHookEventHandler 工具函数，把通用处理留在 src/utils/hooks/hookEvents.js 中维护。
import { registerHookEventHandler } from 'src/utils/hooks/hookEvents.js'
// 复用 executeFilePersistence 工具函数，把通用处理留在 src/utils/filePersistence/filePersistence.js 中维护。
import { executeFilePersistence } from 'src/utils/filePersistence/filePersistence.js'
// 复用 finalizePendingAsyncHooks 工具函数，把通用处理留在 src/utils/hooks/AsyncHookRegistry.js 中维护。
import { finalizePendingAsyncHooks } from 'src/utils/hooks/AsyncHookRegistry.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  gracefulShutdown,
  gracefulShutdownSync,
  isShuttingDown,
} from 'src/utils/gracefulShutdown.js'
// 复用 registerCleanup 工具函数，把通用处理留在 src/utils/cleanupRegistry.js 中维护。
import { registerCleanup } from 'src/utils/cleanupRegistry.js'
// 复用 createIdleTimeoutManager 工具函数，把通用处理留在 src/utils/idleTimeout.js 中维护。
import { createIdleTimeoutManager } from 'src/utils/idleTimeout.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import type {
  SDKStatus,
  ModelInfo,
  SDKMessage,
  SDKUserMessage,
  SDKUserMessageReplay,
  PermissionResult,
  McpServerConfigForProcessTransport,
  McpServerStatus,
  RewindFilesResult,
} from 'src/entrypoints/agentSdkTypes.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import type {
  StdoutMessage,
  SDKControlInitializeRequest,
  SDKControlInitializeResponse,
  SDKControlRequest,
  SDKControlResponse,
  SDKControlMcpSetServersResponse,
  SDKControlReloadPluginsResponse,
} from 'src/entrypoints/sdk/controlTypes.js'
// 类型依赖 { PermissionMode } 来自 @anthropic-ai/claude-agent-sdk，用于校准print的数据契约。
import type { PermissionMode } from '@anthropic-ai/claude-agent-sdk'
// 类型依赖 { PermissionMode as InternalPermissionMode } 来自 src/types/permissions.js，用于校准print的数据契约。
import type { PermissionMode as InternalPermissionMode } from 'src/types/permissions.js'
// 引入 cwd，将 process 中已经封装好的能力接到本文件流程里。
import { cwd } from 'process'
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js'
// 引入 omit，将 lodash-es/omit.js 中已经封装好的能力接到本文件流程里。
import omit from 'lodash-es/omit.js'
// 引入 reject，将 lodash-es/reject.js 中已经封装好的能力接到本文件流程里。
import reject from 'lodash-es/reject.js'
// 接入 isPolicyAllowed 服务层能力，把外部通信或共享状态交给 src/services/policyLimits/index.js 处理。
import { isPolicyAllowed } from 'src/services/policyLimits/index.js'
// 类型依赖 { ReplBridgeHandle } 来自 src/bridge/replBridge.js，用于校准print的数据契约。
import type { ReplBridgeHandle } from 'src/bridge/replBridge.js'
// 引入 getRemoteSessionUrl，将 src/constants/product.js 中已经封装好的能力接到本文件流程里。
import { getRemoteSessionUrl } from 'src/constants/product.js'
// 引入 buildBridgeConnectUrl，将 src/bridge/bridgeStatusUtil.js 中已经封装好的能力接到本文件流程里。
import { buildBridgeConnectUrl } from 'src/bridge/bridgeStatusUtil.js'
// 引入 extractInboundMessageFields，将 src/bridge/inboundMessages.js 中已经封装好的能力接到本文件流程里。
import { extractInboundMessageFields } from 'src/bridge/inboundMessages.js'
// 引入 resolveAndPrepend，将 src/bridge/inboundAttachments.js 中已经封装好的能力接到本文件流程里。
import { resolveAndPrepend } from 'src/bridge/inboundAttachments.js'
// 类型依赖 { CanUseToolFn } 来自 src/hooks/useCanUseTool.js，用于校准print的数据契约。
import type { CanUseToolFn } from 'src/hooks/useCanUseTool.js'
// 复用 hasPermissionsToUseTool 工具函数，把通用处理留在 src/utils/permissions/permissions.js 中维护。
import { hasPermissionsToUseTool } from 'src/utils/permissions/permissions.js'
// 复用 safeParseJSON 工具函数，把通用处理留在 src/utils/json.js 中维护。
import { safeParseJSON } from 'src/utils/json.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  outputSchema as permissionToolOutputSchema,
  permissionPromptToolResultToPermissionDecision,
} from 'src/utils/permissions/PermissionPromptToolResultSchema.js'
// 复用 createAbortController 工具函数，把通用处理留在 src/utils/abortController.js 中维护。
import { createAbortController } from 'src/utils/abortController.js'
// 复用 createCombinedAbortSignal 工具函数，把通用处理留在 src/utils/combinedAbortSignal.js 中维护。
import { createCombinedAbortSignal } from 'src/utils/combinedAbortSignal.js'
// 复用 generateSessionTitle 工具函数，把通用处理留在 src/utils/sessionTitle.js 中维护。
import { generateSessionTitle } from 'src/utils/sessionTitle.js'
// 复用 buildSideQuestionFallbackParams 工具函数，把通用处理留在 src/utils/queryContext.js 中维护。
import { buildSideQuestionFallbackParams } from 'src/utils/queryContext.js'
// 复用 runSideQuestion 工具函数，把通用处理留在 src/utils/sideQuestion.js 中维护。
import { runSideQuestion } from 'src/utils/sideQuestion.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  processSessionStartHooks,
  processSetupHooks,
  takeInitialUserMessage,
} from 'src/utils/sessionStart.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  DEFAULT_OUTPUT_STYLE_NAME,
  getAllOutputStyles,
} from 'src/constants/outputStyles.js'
// 引入 TEAMMATE_MESSAGE_TAG、TICK_TAG，将 src/constants/xml.js 中已经封装好的能力接到本文件流程里。
import { TEAMMATE_MESSAGE_TAG, TICK_TAG } from 'src/constants/xml.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  getSettingsWithSources,
} from 'src/utils/settings/settings.js'
// 复用 settingsChangeDetector 工具函数，把通用处理留在 src/utils/settings/changeDetector.js 中维护。
import { settingsChangeDetector } from 'src/utils/settings/changeDetector.js'
// 复用 applySettingsChange 工具函数，把通用处理留在 src/utils/settings/applySettingsChange.js 中维护。
import { applySettingsChange } from 'src/utils/settings/applySettingsChange.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  isFastModeAvailable,
  isFastModeEnabled,
  isFastModeSupportedByModel,
  getFastModeState,
} from 'src/utils/fastMode.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  isAutoModeGateEnabled,
  getAutoModeUnavailableNotification,
  getAutoModeUnavailableReason,
  isBypassPermissionsModeDisabled,
  transitionPermissionMode,
} from 'src/utils/permissions/permissionSetup.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  tryGenerateSuggestion,
  logSuggestionOutcome,
  logSuggestionSuppressed,
  type PromptVariant,
} from 'src/services/PromptSuggestion/promptSuggestion.js'
// 复用 getLastCacheSafeParams 工具函数，把通用处理留在 src/utils/forkedAgent.js 中维护。
import { getLastCacheSafeParams } from 'src/utils/forkedAgent.js'
// 复用 getAccountInformation 工具函数，把通用处理留在 src/utils/auth.js 中维护。
import { getAccountInformation } from 'src/utils/auth.js'
// 接入 OAuthService 服务层能力，把外部通信或共享状态交给 src/services/oauth/index.js 处理。
import { OAuthService } from 'src/services/oauth/index.js'
// 引入 installOAuthTokens，将 src/cli/handlers/auth.js 中已经封装好的能力接到本文件流程里。
import { installOAuthTokens } from 'src/cli/handlers/auth.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 src/utils/model/providers.js 中维护。
import { getAPIProvider } from 'src/utils/model/providers.js'
// 类型依赖 { HookCallbackMatcher } 来自 src/types/hooks.js，用于校准print的数据契约。
import type { HookCallbackMatcher } from 'src/types/hooks.js'
// 复用 AwsAuthStatusManager 工具函数，把通用处理留在 src/utils/awsAuthStatusManager.js 中维护。
import { AwsAuthStatusManager } from 'src/utils/awsAuthStatusManager.js'
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准print的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  registerHookCallbacks,
  setInitJsonSchema,
  getInitJsonSchema,
  setSdkAgentProgressSummariesEnabled,
} from 'src/bootstrap/state.js'
// 接入 createSyntheticOutputTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { createSyntheticOutputTool } from 'src/tools/SyntheticOutputTool/SyntheticOutputTool.js'
// 复用 parseSessionIdentifier 工具函数，把通用处理留在 src/utils/sessionUrl.js 中维护。
import { parseSessionIdentifier } from 'src/utils/sessionUrl.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  hydrateRemoteSession,
  hydrateFromCCRv2InternalEvents,
  resetSessionFilePointer,
  doesMessageExistInSession,
  findUnresolvedToolUse,
  recordAttributionSnapshot,
  saveAgentSetting,
  saveMode,
  saveAiGeneratedTitle,
  restoreSessionMetadata,
} from 'src/utils/sessionStorage.js'
// 复用 incrementPromptCount 工具函数，把通用处理留在 src/utils/commitAttribution.js 中维护。
import { incrementPromptCount } from 'src/utils/commitAttribution.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  setupSdkMcpClients,
  connectToServer,
  clearServerCache,
  fetchToolsForClient,
  areMcpConfigsEqual,
  reconnectMcpServerImpl,
} from 'src/services/mcp/client.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  filterMcpServersByPolicy,
  getMcpConfigByName,
  isMcpServerDisabled,
  setMcpServerEnabled,
} from 'src/services/mcp/config.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  performMCPOAuthFlow,
  revokeServerTokens,
} from 'src/services/mcp/auth.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  runElicitationHooks,
  runElicitationResultHooks,
} from 'src/services/mcp/elicitationHandler.js'
// 复用 executeNotificationHooks 工具函数，把通用处理留在 src/utils/hooks.js 中维护。
import { executeNotificationHooks } from 'src/utils/hooks.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  ElicitRequestSchema,
  ElicitationCompleteNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js'
// 接入 getMcpPrefix 服务层能力，把外部通信或共享状态交给 src/services/mcp/mcpStringUtils.js 处理。
import { getMcpPrefix } from 'src/services/mcp/mcpStringUtils.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  commandBelongsToServer,
  filterToolsByServer,
} from 'src/services/mcp/utils.js'
// 接入 setupVscodeSdkMcp 服务层能力，把外部通信或共享状态交给 src/services/mcp/vscodeSdkMcp.js 处理。
import { setupVscodeSdkMcp } from 'src/services/mcp/vscodeSdkMcp.js'
// 接入 getAllMcpConfigs 服务层能力，把外部通信或共享状态交给 src/services/mcp/config.js 处理。
import { getAllMcpConfigs } from 'src/services/mcp/config.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  isQualifiedForGrove,
  checkGroveForNonInteractive,
} from 'src/services/api/grove.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  toInternalMessages,
  toSDKRateLimitInfo,
} from 'src/utils/messages/mappers.js'
// 复用 createModelSwitchBreadcrumbs 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { createModelSwitchBreadcrumbs } from 'src/utils/messages.js'
// 注册 collectContextData 命令实现，后续会把它纳入斜杠命令集合。
import { collectContextData } from 'src/commands/context/context-noninteractive.js'
// 引入 LOCAL_COMMAND_STDOUT_TAG，将 src/constants/xml.js 中已经封装好的能力接到本文件流程里。
import { LOCAL_COMMAND_STDOUT_TAG } from 'src/constants/xml.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  statusListeners,
  type ClaudeAILimits,
} from 'src/services/claudeAiLimits.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  getDefaultMainLoopModel,
  getMainLoopModel,
  modelDisplayString,
  parseUserSpecifiedModel,
} from 'src/utils/model/model.js'
// 复用 getModelOptions 工具函数，把通用处理留在 src/utils/model/modelOptions.js 中维护。
import { getModelOptions } from 'src/utils/model/modelOptions.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  modelSupportsEffort,
  modelSupportsMaxEffort,
  EFFORT_LEVELS,
  resolveAppliedEffort,
} from 'src/utils/effort.js'
// 复用 modelSupportsAdaptiveThinking 工具函数，把通用处理留在 src/utils/thinking.js 中维护。
import { modelSupportsAdaptiveThinking } from 'src/utils/thinking.js'
// 复用 modelSupportsAutoMode 工具函数，把通用处理留在 src/utils/betas.js 中维护。
import { modelSupportsAutoMode } from 'src/utils/betas.js'
// 复用 ensureModelStringsInitialized 工具函数，把通用处理留在 src/utils/model/modelStrings.js 中维护。
import { ensureModelStringsInitialized } from 'src/utils/model/modelStrings.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  getSessionId,
  setMainLoopModelOverride,
  setMainThreadAgentType,
  switchSession,
  isSessionPersistenceDisabled,
  getIsRemoteMode,
  getFlagSettingsInline,
  setFlagSettingsInline,
  getMainThreadAgentType,
  getAllowedChannels,
  setAllowedChannels,
  type ChannelEntry,
} from 'src/bootstrap/state.js'
// 复用 runWithWorkload、WORKLOAD_CRON 工具函数，把通用处理留在 src/utils/workloadContext.js 中维护。
import { runWithWorkload, WORKLOAD_CRON } from 'src/utils/workloadContext.js'
// 类型依赖 { UUID } 来自 crypto，用于校准print的数据契约。
import type { UUID } from 'crypto'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准print的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 类型依赖 { AppState } 来自 src/state/AppStateStore.js，用于校准print的数据契约。
import type { AppState } from 'src/state/AppStateStore.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  fileHistoryRewind,
  fileHistoryCanRestore,
  fileHistoryEnabled,
  fileHistoryGetDiffStats,
} from 'src/utils/fileHistory.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  restoreAgentFromSession,
  restoreSessionStateFromLog,
} from 'src/utils/sessionRestore.js'
// 复用 SandboxManager 工具函数，把通用处理留在 src/utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from 'src/utils/sandbox/sandbox-adapter.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  headlessProfilerStartTurn,
  headlessProfilerCheckpoint,
  logHeadlessProfilerTurn,
} from 'src/utils/headlessProfiler.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  startQueryProfile,
  logQueryProfileReport,
} from 'src/utils/queryProfiler.js'
// 引入 asSessionId，将 src/types/ids.js 中已经封装好的能力接到本文件流程里。
import { asSessionId } from 'src/types/ids.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'
// 复用 skillChangeDetector 工具函数，把通用处理留在 ../utils/skills/skillChangeDetector.js 中维护。
import { skillChangeDetector } from '../utils/skills/skillChangeDetector.js'
// 引入 getCommands、clearCommandsCache，将 ../commands.js 中已经封装好的能力接到本文件流程里。
import { getCommands, clearCommandsCache } from '../commands.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  isBareMode,
  isEnvTruthy,
  isEnvDefinedFalsy,
} from '../utils/envUtils.js'
// 复用 installPluginsForHeadless 工具函数，把通用处理留在 ../utils/plugins/headlessPluginInstall.js 中维护。
import { installPluginsForHeadless } from '../utils/plugins/headlessPluginInstall.js'
// 复用 refreshActivePlugins 工具函数，把通用处理留在 ../utils/plugins/refresh.js 中维护。
import { refreshActivePlugins } from '../utils/plugins/refresh.js'
// 复用 loadAllPluginsCacheOnly 工具函数，把通用处理留在 ../utils/plugins/pluginLoader.js 中维护。
import { loadAllPluginsCacheOnly } from '../utils/plugins/pluginLoader.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  isTeamLead,
  hasActiveInProcessTeammates,
  hasWorkingInProcessTeammates,
  waitForTeammatesToBecomeIdle,
} from '../utils/teammate.js'
// 整理这一组导入，让print后续逻辑可以直接复用这些外部能力。
import {
  readUnreadMessages,
  markMessagesAsRead,
  isShutdownApproved,
} from '../utils/teammateMailbox.js'
// 复用 removeTeammateFromTeamFile 工具函数，把通用处理留在 ../utils/swarm/teamHelpers.js 中维护。
import { removeTeammateFromTeamFile } from '../utils/swarm/teamHelpers.js'
// 复用 unassignTeammateTasks 工具函数，把通用处理留在 ../utils/tasks.js 中维护。
import { unassignTeammateTasks } from '../utils/tasks.js'
// 复用 getRunningTasks 工具函数，把通用处理留在 ../utils/task/framework.js 中维护。
import { getRunningTasks } from '../utils/task/framework.js'
// 引入 isBackgroundTask，将 ../tasks/types.js 中已经封装好的能力接到本文件流程里。
import { isBackgroundTask } from '../tasks/types.js'
// 引入 stopTask，将 ../tasks/stopTask.js 中已经封装好的能力接到本文件流程里。
import { stopTask } from '../tasks/stopTask.js'
// 复用 drainSdkEvents 工具函数，把通用处理留在 ../utils/sdkEventQueue.js 中维护。
import { drainSdkEvents } from '../utils/sdkEventQueue.js'
// 接入 initializeGrowthBook 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { initializeGrowthBook } from '../services/analytics/growthbook.js'
// 复用 errorMessage、toError 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage, toError } from '../utils/errors.js'
// 复用 sleep 工具函数，把通用处理留在 ../utils/sleep.js 中维护。
import { sleep } from '../utils/sleep.js'
// 引入 isExtractModeActive，将 ../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isExtractModeActive } from '../memdir/paths.js'

// Dead code elimination: conditional imports
/* eslint-disable @typescript-eslint/no-require-imports */
// coordinatorModeModule保存`feature`，供print后续处理使用。
const coordinatorModeModule = feature('COORDINATOR_MODE')
  ? (require('../coordinator/coordinatorMode.js') as typeof import('../coordinator/coordinatorMode.js'))
  : null
// proactiveModule 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const proactiveModule =
  feature('PROACTIVE') || feature('KAIROS')
    ? (require('../proactive/index.js') as typeof import('../proactive/index.js'))
    : null
// cronSchedulerModule保存`feature`，供print后续处理使用。
const cronSchedulerModule = feature('AGENT_TRIGGERS')
  ? (require('../utils/cronScheduler.js') as typeof import('../utils/cronScheduler.js'))
  : null
// cronJitterConfigModule 配置保存`feature`，供print后续处理使用。
const cronJitterConfigModule = feature('AGENT_TRIGGERS')
  ? (require('../utils/cronJitterConfig.js') as typeof import('../utils/cronJitterConfig.js'))
  : null
// cronGate保存`feature`，供print后续处理使用。
const cronGate = feature('AGENT_TRIGGERS')
  ? (require('../tools/ScheduleCronTool/prompt.js') as typeof import('../tools/ScheduleCronTool/prompt.js'))
  : null
// extractMemoriesModule保存`feature`，供print后续处理使用。
const extractMemoriesModule = feature('EXTRACT_MEMORIES')
  ? (require('../services/extractMemories/extractMemories.js') as typeof import('../services/extractMemories/extractMemories.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

// SHUTDOWN_TEAM_PROMPT固定为 ``<system-reminder>`，作为print后续展示或比较的基准。
const SHUTDOWN_TEAM_PROMPT = `<system-reminder>
You are running in non-interactive mode and cannot return a response to the user until your team is shut down.

You MUST shut down your team before preparing your final response:
1. Use requestShutdown to ask each team member to shut down gracefully
2. Wait for shutdown approvals
3. Use the cleanup operation to clean up the team
4. Only then provide your final response to the user

The user cannot receive your response until the team is completely shut down.
</system-reminder>

Shut down your team and prepare your final response for the user.`

// Track message UUIDs received during the current session runtime
// MAX_RECEIVED_UUIDS 集合 命名 `10_000`，让后续代码直接表达这个值的用途。
const MAX_RECEIVED_UUIDS = 10_000
// receivedMessageUuids 消息数据构建`new Set<UUID>()` 整理出中间结果，供print后续步骤使用。
const receivedMessageUuids = new Set<UUID>()
// receivedMessageUuidsOrder 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
const receivedMessageUuidsOrder: UUID[] = []

// trackReceivedMessageUuid 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function trackReceivedMessageUuid(uuid: UUID): boolean {
  // 满足 `receivedMessageUuids.has(uuid)` 时，print执行该分支。
  if (receivedMessageUuids.has(uuid)) {
    // 返回 `false // duplicate`，作为print这次计算的结果。
    return false // duplicate
  }
  // 调用 receivedMessageUuids.add，触发print此处需要的副作用。
  receivedMessageUuids.add(uuid)
  // receivedMessageUuidsOrder 消息数据追加新条目，保持收集顺序与输入顺序一致。
  receivedMessageUuidsOrder.push(uuid)
  // Evict oldest entries when at capacity
  // 满足 `receivedMessageUuidsOrder.length > MAX_RECEIVED_U` 时，print执行该分支。
  if (receivedMessageUuidsOrder.length > MAX_RECEIVED_UUIDS) {
    // toEvict保存`receivedMessageUuidsOrder.splice`，供print后续处理使用。
    const toEvict = receivedMessageUuidsOrder.splice(
      0,
      receivedMessageUuidsOrder.length - MAX_RECEIVED_UUIDS,
    )
    // 按顺序遍历 `toEvict` 中的old，逐个交给print处理。
    for (const old of toEvict) {
      // 调用 receivedMessageUuids.delete，触发print此处需要的副作用。
      receivedMessageUuids.delete(old)
    }
  }
  // 返回 `true // new UUID`，作为print这次计算的结果。
  return true // new UUID
}

// PromptValue 固化print里传递的数据形状，帮助调用方按同一结构读写字段。
type PromptValue = string | ContentBlockParam[]

// toBlocks 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toBlocks(v: PromptValue): ContentBlockParam[] {
  // 返回 `typeof v === 'string' ? [{ type: 'text', text: v }] : v`，作为print这次计算的结果。
  return typeof v === 'string' ? [{ type: 'text', text: v }] : v
}

/**
 * Join prompt values from multiple queued commands into one. Strings are
 * newline-joined; if any value is a block array, all values are normalized
 * to blocks and concatenated.
 */
// joinPromptValues 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function joinPromptValues(values: PromptValue[]): PromptValue {
  // 满足 `values.length === 1` 时，print执行该分支。
  if (values.length === 1) return values[0]!
  // 满足 `values.every(v => typeof v === 'string')` 时，print执行该分支。
  if (values.every(v => typeof v === 'string')) {
    // 返回 `values.join('\n')`，作为print这次计算的结果。
    return values.join('\n')
  }
  // 返回 `values.flatMap(toBlocks)`，作为print这次计算的结果。
  return values.flatMap(toBlocks)
}

/**
 * Whether `next` can be batched into the same ask() call as `head`. Only
 * prompt-mode commands batch, and only when the workload tag matches (so the
 * combined turn is attributed correctly) and the isMeta flag matches (so a
 * proactive tick can't merge into a user prompt and lose its hidden-in-
 * transcript marking when the head is spread over the merged command).
 */
// canBatchWith 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function canBatchWith(
  head: QueuedCommand,
  next: QueuedCommand | undefined,
): boolean {
  // 返回 `(`，作为print这次计算的结果。
  return (
    next !== undefined &&
    next.mode === 'prompt' &&
    next.workload === head.workload &&
    next.isMeta === head.isMeta
  )
}

// runHeadless 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runHeadless(
  inputPrompt: string | AsyncIterable<string>,
  // 这个回调绑定到 getAppState: () => AppState,，负责print在该局部场景下的响应。
  getAppState: () => AppState,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责print在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
  commands: Command[],
  tools: Tools,
  sdkMcpConfigs: Record<string, McpSdkServerConfig>,
  agents: AgentDefinition[],
  options: {
    continue: boolean | undefined
    resume: string | boolean | undefined
    resumeSessionAt: string | undefined
    verbose: boolean | undefined
    outputFormat: string | undefined
    jsonSchema: Record<string, unknown> | undefined
    permissionPromptToolName: string | undefined
    allowedTools: string[] | undefined
    thinkingConfig: ThinkingConfig | undefined
    maxTurns: number | undefined
    maxBudgetUsd: number | undefined
    taskBudget: { total: number } | undefined
    systemPrompt: string | undefined
    appendSystemPrompt: string | undefined
    userSpecifiedModel: string | undefined
    fallbackModel: string | undefined
    teleport: string | true | null | undefined
    sdkUrl: string | undefined
    replayUserMessages: boolean | undefined
    includePartialMessages: boolean | undefined
    forkSession: boolean | undefined
    rewindFiles: string | undefined
    enableAuthStatus: boolean | undefined
    agent: string | undefined
    workload: string | undefined
    setupTrigger?: 'init' | 'maintenance' | undefined
    sessionStartHooksPromise?: ReturnType<typeof processSessionStartHooks>
    // 这个回调绑定到 setSDKStatus?: (status: SDKStatus) => void，负责print在该局部场景下的响应。
    setSDKStatus?: (status: SDKStatus) => void
  },
): Promise<void> {
  // print在这里进入条件判断，后续代码按实际状态分流。
  if (
    process.env.USER_TYPE === 'ant' &&
    isEnvTruthy(process.env.CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER)
  ) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      `\nStartup time: ${Math.round(process.uptime() * 1000)}ms\n`,
    )
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发print此处需要的副作用。
    process.exit(0)
  }

  // Fire user settings download now so it overlaps with the MCP/tool setup
  // below. Managed settings already started in main.tsx preAction; this gives
  // user settings a similar head start. The cached promise is joined in
  // installPluginsAndApplyMcpInBackground before plugin install reads
  // enabledPlugins.
  // print在这里进入条件判断，后续代码按实际状态分流。
  if (
    feature('DOWNLOAD_USER_SETTINGS') &&
    (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) || getIsRemoteMode())
  ) {
    // 显式忽略 `downloadUserSettings()` 的返回值，只保留它触发的副作用。
    void downloadUserSettings()
  }

  // In headless mode there is no React tree, so the useSettingsChange hook
  // never runs. Subscribe directly so that settings changes (including
  // managed-settings / policy updates) are fully applied.
  // 调用 settingsChangeDetector.subscribe，触发print此处需要的副作用。
  settingsChangeDetector.subscribe(source => {
    // 调用 applySettingsChange，触发print此处需要的副作用。
    applySettingsChange(source, setAppState)

    // In headless mode, also sync the denormalized fastMode field from
    // settings. The TUI manages fastMode via the UI so it skips this.
    // 满足 `isFastModeEnabled()` 时，print执行该分支。
    if (isFastModeEnabled()) {
      // setAppState 写入新的状态值，使print后续读取保持一致。
      setAppState(prev => {
        // s 集合保存`prev.settings as Record<string, unknown>`，供后续判断或组装使用。
        const s = prev.settings as Record<string, unknown>
        // fastMode标记print是否启用对应路径。
        const fastMode = s.fastMode === true && !s.fastModePerSessionOptIn
        // 返回结构化结果，集中表达print已经整理出的状态。
        return { ...prev, fastMode }
      })
    }
  })

  // Proactive activation is now handled in main.tsx before getTools() so
  // SleepTool passes isEnabled() filtering. This fallback covers the case
  // where CLAUDE_CODE_PROACTIVE is set but main.tsx's check didn't fire
  // (e.g. env was injected by the SDK transport after argv parsing).
  // print在这里进入条件判断，后续代码按实际状态分流。
  if (
    (feature('PROACTIVE') || feature('KAIROS')) &&
    proactiveModule &&
    !proactiveModule.isProactiveActive() &&
    isEnvTruthy(process.env.CLAUDE_CODE_PROACTIVE)
  ) {
    // 调用 proactiveModule.activateProactive，触发print此处需要的副作用。
    proactiveModule.activateProactive('command')
  }

  // Periodically force a full GC to keep memory usage in check
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // gcTimer保存`setInterval`，供print后续处理使用。
    const gcTimer = setInterval(Bun.gc, 1000)
    // 调用 gcTimer.unref，触发print此处需要的副作用。
    gcTimer.unref()
  }

  // Start headless profiler for first turn
  // 调用 headlessProfilerStartTurn，触发print此处需要的副作用。
  headlessProfilerStartTurn()
  // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
  headlessProfilerCheckpoint('runHeadless_entry')

  // Check Grove requirements for non-interactive consumer subscribers
  // 满足 `await isQualifiedForGrove()` 时，print执行该分支。
  if (await isQualifiedForGrove()) {
    // 等待 `checkGroveForNonInteractive()` 完成，再继续print的异步流程。
    await checkGroveForNonInteractive()
  }
  // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
  headlessProfilerCheckpoint('after_grove_check')

  // Initialize GrowthBook so feature flags take effect in headless mode.
  // Without this, the disk cache is empty and all flags fall back to defaults.
  // 显式忽略 `initializeGrowthBook()` 的返回值，只保留它触发的副作用。
  void initializeGrowthBook()

  // 组合条件 `options.resumeSessionAt && !options.resume` 成立时，print才启用这条专门路径。
  if (options.resumeSessionAt && !options.resume) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(`Error: --resume-session-at requires --resume\n`)
    // 调用 gracefulShutdownSync，触发print此处需要的副作用。
    gracefulShutdownSync(1)
    // print在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 组合条件 `options.rewindFiles && !options.resume` 成立时，print才启用这条专门路径。
  if (options.rewindFiles && !options.resume) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(`Error: --rewind-files requires --resume\n`)
    // 调用 gracefulShutdownSync，触发print此处需要的副作用。
    gracefulShutdownSync(1)
    // print在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 组合条件 `options.rewindFiles && inputPrompt` 成立时，print才启用这条专门路径。
  if (options.rewindFiles && inputPrompt) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      `Error: --rewind-files is a standalone operation and cannot be used with a prompt\n`,
    )
    // 调用 gracefulShutdownSync，触发print此处需要的副作用。
    gracefulShutdownSync(1)
    // print在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // structuredIO读取`getStructuredIO`，供print后续处理使用。
  const structuredIO = getStructuredIO(inputPrompt, options)

  // When emitting NDJSON for SDK clients, any stray write to stdout (debug
  // prints, dependency console.log, library banners) breaks the client's
  // line-by-line JSON parser. Install a guard that diverts non-JSON lines to
  // stderr so the stream stays clean. Must run before the first
  // structuredIO.write below.
  // 当 `options.outputFormat` 匹配 `'stream-json'` 时，print执行对应分支。
  if (options.outputFormat === 'stream-json') {
    // 调用 installStreamJsonStdoutGuard，触发print此处需要的副作用。
    installStreamJsonStdoutGuard()
  }

  // #34044: if user explicitly set sandbox.enabled=true but deps are missing,
  // isSandboxingEnabled() returns false silently. Surface the reason so users
  // know their security config isn't being enforced.
  // sandboxUnavailableReason读取`SandboxManager.getSandboxUnavailableReason`，供print后续处理使用。
  const sandboxUnavailableReason = SandboxManager.getSandboxUnavailableReason()
  // 满足 `sandboxUnavailableReason` 时，print执行该分支。
  if (sandboxUnavailableReason) {
    // 满足 `SandboxManager.isSandboxRequired()` 时，print执行该分支。
    if (SandboxManager.isSandboxRequired()) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        `\nError: sandbox required but unavailable: ${sandboxUnavailableReason}\n` +
          `  sandbox.failIfUnavailable is set — refusing to start without a working sandbox.\n\n`,
      )
      // 调用 gracefulShutdownSync，触发print此处需要的副作用。
      gracefulShutdownSync(1)
      // print在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      `\n⚠ Sandbox disabled: ${sandboxUnavailableReason}\n` +
        `  Commands will run WITHOUT sandboxing. Network and filesystem restrictions will NOT be enforced.\n\n`,
    )
  // print在这里处理 `} else if (SandboxManager.isSandboxingEnabled()) {`，完成这一小步状态转换。
  } else if (SandboxManager.isSandboxingEnabled()) {
    // Initialize sandbox with a callback that forwards network permission
    // requests to the SDK host via the can_use_tool control_request protocol.
    // This must happen after structuredIO is created so we can send requests.
    // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `SandboxManager.initialize(structuredIO.createSandboxAskCallback())` 完成，再继续print的异步流程。
      await SandboxManager.initialize(structuredIO.createSandboxAskCallback())
    } catch (err) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(`\n❌ Sandbox Error: ${errorMessage(err)}\n`)
      // 调用 gracefulShutdownSync，触发print此处需要的副作用。
      gracefulShutdownSync(1, 'other')
      // print在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }

  // 组合条件 `options.outputFormat === 'stream-json' && options` 成立时，print才启用这条专门路径。
  if (options.outputFormat === 'stream-json' && options.verbose) {
    // 调用 registerHookEventHandler，触发print此处需要的副作用。
    registerHookEventHandler(event => {
      // 这个回调绑定到 const message: StdoutMessage = (() => {，负责print在该局部场景下的响应。
      const message: StdoutMessage = (() => {
        // 按照 event.type 的取值选择print的具体处理分支。
        switch (event.type) {
          case 'started':
            // 返回结构化结果，集中表达print已经整理出的状态。
            return {
              type: 'system' as const,
              subtype: 'hook_started' as const,
              hook_id: event.hookId,
              hook_name: event.hookName,
              hook_event: event.hookEvent,
              uuid: randomUUID(),
              session_id: getSessionId(),
            }
          case 'progress':
            // 返回结构化结果，集中表达print已经整理出的状态。
            return {
              type: 'system' as const,
              subtype: 'hook_progress' as const,
              hook_id: event.hookId,
              hook_name: event.hookName,
              hook_event: event.hookEvent,
              stdout: event.stdout,
              stderr: event.stderr,
              output: event.output,
              uuid: randomUUID(),
              session_id: getSessionId(),
            }
          case 'response':
            // 返回结构化结果，集中表达print已经整理出的状态。
            return {
              type: 'system' as const,
              subtype: 'hook_response' as const,
              hook_id: event.hookId,
              hook_name: event.hookName,
              hook_event: event.hookEvent,
              output: event.output,
              stdout: event.stdout,
              stderr: event.stderr,
              exit_code: event.exitCode,
              outcome: event.outcome,
              uuid: randomUUID(),
              session_id: getSessionId(),
            }
        }
      })()
      // 显式忽略 `structuredIO.write(message)` 的返回值，只保留它触发的副作用。
      void structuredIO.write(message)
    })
  }

  // 满足 `options.setupTrigger` 时，print执行该分支。
  if (options.setupTrigger) {
    // 等待 `processSetupHooks(options.setupTrigger)` 完成，再继续print的异步流程。
    await processSetupHooks(options.setupTrigger)
  }

  // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
  headlessProfilerCheckpoint('before_loadInitialMessages')
  // appState 状态读取`getAppState`，供print后续处理使用。
  const appState = getAppState()
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    messages: initialMessages,
    turnInterruptionState,
    agentSetting: resumedAgentSetting,
  } = await loadInitialMessages(setAppState, {
    continue: options.continue,
    teleport: options.teleport,
    resume: options.resume,
    resumeSessionAt: options.resumeSessionAt,
    forkSession: options.forkSession,
    outputFormat: options.outputFormat,
    sessionStartHooksPromise: options.sessionStartHooksPromise,
    restoredWorkerState: structuredIO.restoredWorkerState,
  })

  // SessionStart hooks can emit initialUserMessage — the first user turn for
  // headless orchestrator sessions where stdin is empty and additionalContext
  // alone (an attachment, not a turn) would leave the REPL with nothing to
  // respond to. The hook promise is awaited inside loadInitialMessages, so the
  // module-level pending value is set by the time we get here.
  // hookInitialUserMessage 消息数据保存`takeInitialUserMessage`，供print后续处理使用。
  const hookInitialUserMessage = takeInitialUserMessage()
  // 满足 `hookInitialUserMessage` 时，print执行该分支。
  if (hookInitialUserMessage) {
    // 调用 structuredIO.prependUserMessage，触发print此处需要的副作用。
    structuredIO.prependUserMessage(hookInitialUserMessage)
  }

  // Restore agent setting from the resumed session (if not overridden by current --agent flag
  // or settings-based agent, which would already have set mainThreadAgentType in main.tsx)
  // 组合条件 `!options.agent && !getMainThreadAgentType() && resumedAgentSetting` 成立时，print才启用这条专门路径。
  if (!options.agent && !getMainThreadAgentType() && resumedAgentSetting) {
    // 从 `restoreAgentFromSession(` 解构 agentDefinition，减少print对同一对象的重复访问。
    const { agentDefinition: restoredAgent } = restoreAgentFromSession(
      resumedAgentSetting,
      undefined,
      { activeAgents: agents, allAgents: agents },
    )
    // 满足 `restoredAgent` 时，print执行该分支。
    if (restoredAgent) {
      // setAppState 写入新的状态值，使print后续读取保持一致。
      setAppState(prev => ({ ...prev, agent: restoredAgent.agentType }))
      // Apply the agent's system prompt for non-built-in agents (mirrors main.tsx initial --agent path)
      // 组合条件 `!options.systemPrompt && !isBuiltInAgent(restoredAgent)` 成立时，print才启用这条专门路径。
      if (!options.systemPrompt && !isBuiltInAgent(restoredAgent)) {
        // agentSystemPrompt读取`restoredAgent.getSystemPrompt`，供print后续处理使用。
        const agentSystemPrompt = restoredAgent.getSystemPrompt()
        // 满足 `agentSystemPrompt` 时，print执行该分支。
        if (agentSystemPrompt) {
          // 系统提示词更新为 `agentSystemPrompt`，确保CLI后续读取最新状态。
          options.systemPrompt = agentSystemPrompt
        }
      }
      // Re-persist agent setting so future resumes maintain the agent
      // 调用 saveAgentSetting，触发print此处需要的副作用。
      saveAgentSetting(restoredAgent.agentType)
    }
  }

  // gracefulShutdownSync schedules an async shutdown and sets process.exitCode.
  // If a loadInitialMessages error path triggered it, bail early to avoid
  // unnecessary work while the process winds down.
  // 组合条件 `initialMessages.length === 0 && process.exitCode` 成立时，print才启用这条专门路径。
  if (initialMessages.length === 0 && process.exitCode !== undefined) {
    // print在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Handle --rewind-files: restore filesystem and exit immediately
  // 满足 `options.rewindFiles` 时，print执行该分支。
  if (options.rewindFiles) {
    // File history snapshots are only created for user messages,
    // so we require the target to be a user message
    // targetMessage 消息数据筛选`initialMessages.find`，供print后续处理使用。
    const targetMessage = initialMessages.find(
      // m更新为 `> m.uuid === options.rewindFiles`，确保CLI后续读取最新状态。
      m => m.uuid === options.rewindFiles,
    )

    // `!targetMessage || targetMessage.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
    if (!targetMessage || targetMessage.type !== 'user') {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        `Error: --rewind-files requires a user message UUID, but ${options.rewindFiles} is not a user message in this session\n`,
      )
      // 调用 gracefulShutdownSync，触发print此处需要的副作用。
      gracefulShutdownSync(1)
      // print在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // currentAppState 状态读取`getAppState`，供print后续处理使用。
    const currentAppState = getAppState()
    // 结果保存`handleRewindFiles`，供print后续处理使用。
    const result = await handleRewindFiles(
      options.rewindFiles as UUID,
      currentAppState,
      setAppState,
      false,
    )
    // result.canRewind缺失时提前走兜底路径，避免print继续依赖无效输入。
    if (!result.canRewind) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(`Error: ${result.error || 'Unexpected error'}\n`)
      // 调用 gracefulShutdownSync，触发print此处需要的副作用。
      gracefulShutdownSync(1)
      // print在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Rewind complete - exit successfully
    // 向标准输出写入print要展示给用户的文本。
    process.stdout.write(
      `Files rewound to state at message ${options.rewindFiles}\n`,
    )
    // 调用 gracefulShutdownSync，触发print此处需要的副作用。
    gracefulShutdownSync(0)
    // print在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Check if we need input prompt - skip if we're resuming with a valid session ID/JSONL file or using SDK URL
  // hasValidResumeSessionId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasValidResumeSessionId =
    typeof options.resume === 'string' &&
    (Boolean(validateUuid(options.resume)) || options.resume.endsWith('.jsonl'))
  // isUsingSdkUrl记录 `Boolean` 是否成立，print随后按该结果分支。
  const isUsingSdkUrl = Boolean(options.sdkUrl)

  // 组合条件 `!inputPrompt && !hasValidResumeSessionId && !isUs` 成立时，print才启用这条专门路径。
  if (!inputPrompt && !hasValidResumeSessionId && !isUsingSdkUrl) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      `Error: Input must be provided either through stdin or as a prompt argument when using --print\n`,
    )
    // 调用 gracefulShutdownSync，触发print此处需要的副作用。
    gracefulShutdownSync(1)
    // print在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 组合条件 `options.outputFormat === 'stream-json' && !option` 成立时，print才启用这条专门路径。
  if (options.outputFormat === 'stream-json' && !options.verbose) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      'Error: When using --print, --output-format=stream-json requires --verbose\n',
    )
    // 调用 gracefulShutdownSync，触发print此处需要的副作用。
    gracefulShutdownSync(1)
    // print在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Filter out MCP tools that are in the deny list
  // allowedMcpTools 集合筛选`filterToolsByDenyRules`，供print后续处理使用。
  const allowedMcpTools = filterToolsByDenyRules(
    appState.mcp.tools,
    appState.toolPermissionContext,
  )
  // filteredTools 集合 聚合成有序列表，保持后续遍历顺序稳定。
  let filteredTools = [...tools, ...allowedMcpTools]

  // When using SDK URL, always use stdio permission prompting to delegate to the SDK
  // effectivePermissionPromptToolName 权限数据保存`options.sdkUrl`，供后续判断或组装使用。
  const effectivePermissionPromptToolName = options.sdkUrl
    ? 'stdio'
    : options.permissionPromptToolName

  // Callback for when a permission prompt is shown
  // onPermissionPrompt 权限数据封装成回调，供print在事件触发或异步步骤中调用。
  const onPermissionPrompt = (details: RequiresActionDetails) => {
    // 满足 `feature('COMMIT_ATTRIBUTION')` 时，print执行该分支。
    if (feature('COMMIT_ATTRIBUTION')) {
      // setAppState 写入新的状态值，使print后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        attribution: {
          ...prev.attribution,
          permissionPromptCount: prev.attribution.permissionPromptCount + 1,
        },
      }))
    }
    // 调用 notifySessionStateChanged，触发print此处需要的副作用。
    notifySessionStateChanged('requires_action', details)
  }

  // canUseTool记录 `getCanUseToolFn` 是否成立，print随后按该结果分支。
  const canUseTool = getCanUseToolFn(
    effectivePermissionPromptToolName,
    structuredIO,
    // 这个回调绑定到 () => getAppState().mcp.tools,，负责print在该局部场景下的响应。
    () => getAppState().mcp.tools,
    onPermissionPrompt,
  )
  // 满足 `options.permissionPromptToolName` 时，print执行该分支。
  if (options.permissionPromptToolName) {
    // Remove the permission prompt tool from the list of available tools.
    // filteredTools 集合更新为 `filteredTools.filter(`，确保CLI后续读取最新状态。
    filteredTools = filteredTools.filter(
      // 工具更新为 `> !toolMatchesName(tool, options.permissionPromptToolName...`，确保CLI后续读取最新状态。
      tool => !toolMatchesName(tool, options.permissionPromptToolName!),
    )
  }

  // Install errors handlers to gracefully handle broken pipes (e.g., when parent process dies)
  // 调用 registerProcessOutputErrorHandlers，触发print此处需要的副作用。
  registerProcessOutputErrorHandlers()

  // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
  headlessProfilerCheckpoint('after_loadInitialMessages')

  // Ensure model strings are initialized before generating model options.
  // For Bedrock users, this waits for the profile fetch to get correct region strings.
  // 等待 `ensureModelStringsInitialized()` 完成，再继续print的异步流程。
  await ensureModelStringsInitialized()
  // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
  headlessProfilerCheckpoint('after_modelStrings')

  // UDS inbox store registration is deferred until after `run` is defined
  // so we can pass `run` as the onEnqueue callback (see below).

  // Only `json` + `verbose` needs the full array (jsonStringify(messages) below).
  // For stream-json (SDK/CCR) and default text output, only the last message is
  // read for the exit code / final result. Avoid accumulating every message in
  // memory for the entire session.
  // needsFullArray标记print是否启用对应路径。
  const needsFullArray = options.outputFormat === 'json' && options.verbose
  // 对话消息 从空数组开始收集，后续循环会按处理顺序追加条目。
  const messages: SDKMessage[] = []
  // lastMessage 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastMessage: SDKMessage | undefined
  // Streamlined mode transforms messages when CLAUDE_CODE_STREAMLINED_OUTPUT=true and using stream-json
  // Build flag gates this out of external builds; env var is the runtime opt-in for ant builds
  // transformToStreamlined 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const transformToStreamlined =
    feature('STREAMLINED_OUTPUT') &&
    isEnvTruthy(process.env.CLAUDE_CODE_STREAMLINED_OUTPUT) &&
    options.outputFormat === 'stream-json'
      ? createStreamlinedTransformer()
      : null

  // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
  headlessProfilerCheckpoint('before_runHeadlessStreaming')
  // 逐项读取 `runHeadlessStreaming(` 中的消息，按输入顺序推进print。
  for await (const message of runHeadlessStreaming(
    structuredIO,
    appState.mcp.clients,
    [...commands, ...appState.mcp.commands],
    filteredTools,
    initialMessages,
    canUseTool,
    sdkMcpConfigs,
    getAppState,
    setAppState,
    agents,
    options,
    turnInterruptionState,
  )) {
    // 满足 `transformToStreamlined` 时，print执行该分支。
    if (transformToStreamlined) {
      // Streamlined mode: transform messages and stream immediately
      // transformed保存`transformToStreamlined`，供print后续处理使用。
      const transformed = transformToStreamlined(message)
      // 满足 `transformed` 时，print执行该分支。
      if (transformed) {
        // 等待 `structuredIO.write(transformed)` 完成，再继续print的异步流程。
        await structuredIO.write(transformed)
      }
    // print在这里处理 `} else if (options.outputFormat === 'stream-json' && options.verbose) {`，完成这一小步状态转换。
    } else if (options.outputFormat === 'stream-json' && options.verbose) {
      // 等待 `structuredIO.write(message)` 完成，再继续print的异步流程。
      await structuredIO.write(message)
    }
    // Should not be getting control messages or stream events in non-stream mode.
    // Also filter out streamlined types since they're only produced by the transformer.
    // SDK-only system events are excluded so lastMessage stays at the result
    // (session_state_changed(idle) and any late task_notification drain after
    // result in the finally block).
    // print在这里进入条件判断，后续代码按实际状态分流。
    if (
      message.type !== 'control_response' &&
      message.type !== 'control_request' &&
      message.type !== 'control_cancel_request' &&
      !(
        message.type === 'system' &&
        (message.subtype === 'session_state_changed' ||
          message.subtype === 'task_notification' ||
          message.subtype === 'task_started' ||
          message.subtype === 'task_progress' ||
          message.subtype === 'post_turn_summary')
      ) &&
      message.type !== 'stream_event' &&
      message.type !== 'keep_alive' &&
      message.type !== 'streamlined_text' &&
      message.type !== 'streamlined_tool_use_summary' &&
      message.type !== 'prompt_suggestion'
    ) {
      // 满足 `needsFullArray` 时，print执行该分支。
      if (needsFullArray) {
        // 对话消息追加新条目，保持收集顺序与输入顺序一致。
        messages.push(message)
      }
      // lastMessage 消息数据更新为 `message`，确保CLI后续读取最新状态。
      lastMessage = message
    }
  }

  // 按照 options.outputFormat 的取值选择print的具体处理分支。
  switch (options.outputFormat) {
    case 'json':
      // `!lastMessage || lastMessage.type` 与 `'result'` 不一致时刷新派生状态，避免使用过期结果。
      if (!lastMessage || lastMessage.type !== 'result') {
        // 抛出 new Error('No messages returned')，阻止print在无效状态下继续运行。
        throw new Error('No messages returned')
      }
      // 满足 `options.verbose` 时，print执行该分支。
      if (options.verbose) {
        // 调用 writeToStdout，触发print此处需要的副作用。
        writeToStdout(jsonStringify(messages) + '\n')
        // 结束这个分支或循环，避免print继续落入后续路径。
        break
      }
      // 调用 writeToStdout，触发print此处需要的副作用。
      writeToStdout(jsonStringify(lastMessage) + '\n')
      // 结束这个分支或循环，避免print继续落入后续路径。
      break
    case 'stream-json':
      // already logged above
      // 结束这个分支或循环，避免print继续落入后续路径。
      break
    default:
      // `!lastMessage || lastMessage.type` 与 `'result'` 不一致时刷新派生状态，避免使用过期结果。
      if (!lastMessage || lastMessage.type !== 'result') {
        // 抛出 new Error('No messages returned')，阻止print在无效状态下继续运行。
        throw new Error('No messages returned')
      }
      // 按照 lastMessage.subtype 的取值选择print的具体处理分支。
      switch (lastMessage.subtype) {
        case 'success':
          // 调用 writeToStdout，触发print此处需要的副作用。
          writeToStdout(
            lastMessage.result.endsWith('\n')
              ? lastMessage.result
              : lastMessage.result + '\n',
          )
          // 结束这个分支或循环，避免print继续落入后续路径。
          break
        case 'error_during_execution':
          // 调用 writeToStdout，触发print此处需要的副作用。
          writeToStdout(`Execution error`)
          // 结束这个分支或循环，避免print继续落入后续路径。
          break
        case 'error_max_turns':
          // 调用 writeToStdout，触发print此处需要的副作用。
          writeToStdout(`Error: Reached max turns (${options.maxTurns})`)
          // 结束这个分支或循环，避免print继续落入后续路径。
          break
        case 'error_max_budget_usd':
          // 调用 writeToStdout，触发print此处需要的副作用。
          writeToStdout(`Error: Exceeded USD budget (${options.maxBudgetUsd})`)
          // 结束这个分支或循环，避免print继续落入后续路径。
          break
        case 'error_max_structured_output_retries':
          // 调用 writeToStdout，触发print此处需要的副作用。
          writeToStdout(
            `Error: Failed to provide valid structured output after maximum retries`,
          )
      }
  }

  // Log headless latency metrics for the final turn
  // 调用 logHeadlessProfilerTurn，触发print此处需要的副作用。
  logHeadlessProfilerTurn()

  // Drain any in-flight memory extraction before shutdown. The response is
  // already flushed above, so this adds no user-visible latency — it just
  // delays process exit so gracefulShutdownSync's 5s failsafe doesn't kill
  // the forked agent mid-flight. Gated by isExtractModeActive so the
  // tengu_slate_thimble flag controls non-interactive extraction end-to-end.
  // 组合条件 `feature('EXTRACT_MEMORIES') && isExtractModeActive()` 成立时，print才启用这条专门路径。
  if (feature('EXTRACT_MEMORIES') && isExtractModeActive()) {
    // 等待 `extractMemoriesModule!.drainPendingExtraction()` 完成，再继续print的异步流程。
    await extractMemoriesModule!.drainPendingExtraction()
  }

  // 调用 gracefulShutdownSync，触发print此处需要的副作用。
  gracefulShutdownSync(
    lastMessage?.type === 'result' && lastMessage?.is_error ? 1 : 0,
  )
}

// runHeadlessStreaming 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function runHeadlessStreaming(
  structuredIO: StructuredIO,
  mcpClients: MCPServerConnection[],
  commands: Command[],
  tools: Tools,
  initialMessages: Message[],
  canUseTool: CanUseToolFn,
  sdkMcpConfigs: Record<string, McpSdkServerConfig>,
  // 这个回调绑定到 getAppState: () => AppState,，负责print在该局部场景下的响应。
  getAppState: () => AppState,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责print在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
  agents: AgentDefinition[],
  options: {
    verbose: boolean | undefined
    jsonSchema: Record<string, unknown> | undefined
    permissionPromptToolName: string | undefined
    allowedTools: string[] | undefined
    thinkingConfig: ThinkingConfig | undefined
    maxTurns: number | undefined
    maxBudgetUsd: number | undefined
    taskBudget: { total: number } | undefined
    systemPrompt: string | undefined
    appendSystemPrompt: string | undefined
    userSpecifiedModel: string | undefined
    fallbackModel: string | undefined
    replayUserMessages?: boolean | undefined
    includePartialMessages?: boolean | undefined
    enableAuthStatus?: boolean | undefined
    agent?: string | undefined
    // 这个回调绑定到 setSDKStatus?: (status: SDKStatus) => void，负责print在该局部场景下的响应。
    setSDKStatus?: (status: SDKStatus) => void
    promptSuggestions?: boolean | undefined
    workload?: string | undefined
  },
  turnInterruptionState?: TurnInterruptionState,
): AsyncIterable<StdoutMessage> {
  // running标记print是否启用对应路径。
  let running = false
  // print先整理这一处局部数据，后续分支可以直接读取。
  let runPhase:
    | 'draining_commands'
    | 'waiting_for_agents'
    | 'finally_flush'
    | 'finally_post_flush'
    | undefined
  // inputClosed标记print是否启用对应路径。
  let inputClosed = false
  // shutdownPromptInjected标记print是否启用对应路径。
  let shutdownPromptInjected = false
  // heldBackResult保存`null`，作为后续空值处理的输入。
  let heldBackResult: StdoutMessage | null = null
  // abortController 先占位，稍后的条件分支会根据实际输入补齐它。
  let abortController: AbortController | undefined
  // Same queue sendRequest() enqueues to — one FIFO for everything.
  // output保存`structuredIO.outbound`，供后续判断或组装使用。
  const output = structuredIO.outbound

  // Ctrl+C in -p mode: abort the in-flight query, then shut down gracefully.
  // gracefulShutdown persists session state and flushes analytics, with a
  // failsafe timer that force-exits if cleanup hangs.
  // sigintHandler封装成回调，供print在事件触发或异步步骤中调用。
  const sigintHandler = () => {
    // 调用 logForDiagnosticsNoPII，触发print此处需要的副作用。
    logForDiagnosticsNoPII('info', 'shutdown_signal', { signal: 'SIGINT' })
    // 组合条件 `abortController && !abortController.signal.aborted` 成立时，print才启用这条专门路径。
    if (abortController && !abortController.signal.aborted) {
      // 触发取消信号，通知print中仍在等待的异步任务尽快停止。
      abortController.abort()
    }
    // 显式忽略 `gracefulShutdown(0)` 的返回值，只保留它触发的副作用。
    void gracefulShutdown(0)
  }
  // 调用 process.on，触发print此处需要的副作用。
  process.on('SIGINT', sigintHandler)

  // Dump run()'s state at SIGTERM so a stuck session's healthsweep can name
  // the do/while(waitingForAgents) poll without reading the transcript.
  // 调用 registerCleanup，触发print此处需要的副作用。
  registerCleanup(async () => {
    // bg 从空对象开始收集键值，后续按名称补齐内容。
    const bg: Record<string, number> = {}
    // 逐项读取 `getRunningTasks(getAppState())` 中的t，按输入顺序推进print。
    for (const t of getRunningTasks(getAppState())) {
      // 满足 `isBackgroundTask(t)) bg[t.type] = (bg[t.type] ?? 0` 时，print执行该分支。
      if (isBackgroundTask(t)) bg[t.type] = (bg[t.type] ?? 0) + 1
    }
    // 调用 logForDiagnosticsNoPII，触发print此处需要的副作用。
    logForDiagnosticsNoPII('info', 'run_state_at_shutdown', {
      run_active: running,
      run_phase: runPhase,
      worker_status: getSessionState(),
      internal_events_pending: structuredIO.internalEventsPending,
      bg_tasks: bg,
    })
  })

  // Wire the central onChangeAppState mode-diff hook to the SDK output stream.
  // This fires whenever ANY code path mutates toolPermissionContext.mode —
  // Shift+Tab, ExitPlanMode dialog, /plan slash command, rewind, bridge
  // set_permission_mode, the query loop, stop_task — rather than the two
  // paths that previously went through a bespoke wrapper.
  // The wrapper's body was fully redundant (it enqueued here AND called
  // notifySessionMetadataChanged, both of which onChangeAppState now covers);
  // keeping it would double-emit status messages.
  // setPermissionModeChangedListener 写入新的状态值，使print后续读取保持一致。
  setPermissionModeChangedListener(newMode => {
    // Only emit for SDK-exposed modes.
    // print在这里进入条件判断，后续代码按实际状态分流。
    if (
      newMode === 'default' ||
      newMode === 'acceptEdits' ||
      newMode === 'bypassPermissions' ||
      newMode === 'plan' ||
      newMode === (feature('TRANSCRIPT_CLASSIFIER') && 'auto') ||
      newMode === 'dontAsk'
    ) {
      // 调用 output.enqueue，触发print此处需要的副作用。
      output.enqueue({
        type: 'system',
        subtype: 'status',
        status: null,
        permissionMode: newMode as PermissionMode,
        uuid: randomUUID(),
        session_id: getSessionId(),
      })
    }
  })

  // Prompt suggestion tracking (push model)
  // suggestionState 状态 先占位，稍后的条件分支会根据实际输入补齐它。
  const suggestionState: {
    abortController: AbortController | null
    inflightPromise: Promise<void> | null
    lastEmitted: {
      text: string
      emittedAt: number
      promptId: PromptVariant
      generationRequestId: string | null
    } | null
    pendingSuggestion: {
      type: 'prompt_suggestion'
      suggestion: string
      uuid: UUID
      session_id: string
    } | null
    pendingLastEmittedEntry: {
      text: string
      promptId: PromptVariant
      generationRequestId: string | null
    } | null
  } = {
    abortController: null,
    inflightPromise: null,
    lastEmitted: null,
    pendingSuggestion: null,
    pendingLastEmittedEntry: null,
  }

  // Set up AWS auth status listener if enabled
  // 这个回调绑定到 let unsubscribeAuthStatus: (() => void) | undefined，负责print在该局部场景下的响应。
  let unsubscribeAuthStatus: (() => void) | undefined
  // 满足 `options.enableAuthStatus` 时，print执行该分支。
  if (options.enableAuthStatus) {
    // authStatusManager读取`AwsAuthStatusManager.getInstance`，供print后续处理使用。
    const authStatusManager = AwsAuthStatusManager.getInstance()
    // unsubscribeAuthStatus 集合更新为 `authStatusManager.subscribe(status => {`，确保CLI后续读取最新状态。
    unsubscribeAuthStatus = authStatusManager.subscribe(status => {
      // 调用 output.enqueue，触发print此处需要的副作用。
      output.enqueue({
        type: 'auth_status',
        isAuthenticating: status.isAuthenticating,
        output: status.output,
        error: status.error,
        uuid: randomUUID(),
        session_id: getSessionId(),
      })
    })
  }

  // Set up rate limit status listener to emit SDKRateLimitEvent for all status changes.
  // Emitting for all statuses (including 'allowed') ensures consumers can clear warnings
  // when rate limits reset. The upstream emitStatusChange already deduplicates via isEqual.
  // rateLimitListener 集合封装成回调，供print在事件触发或异步步骤中调用。
  const rateLimitListener = (limits: ClaudeAILimits) => {
    // rateLimitInfo保存`toSDKRateLimitInfo`，供print后续处理使用。
    const rateLimitInfo = toSDKRateLimitInfo(limits)
    // 满足 `rateLimitInfo` 时，print执行该分支。
    if (rateLimitInfo) {
      // 调用 output.enqueue，触发print此处需要的副作用。
      output.enqueue({
        type: 'rate_limit_event',
        rate_limit_info: rateLimitInfo,
        uuid: randomUUID(),
        session_id: getSessionId(),
      })
    }
  }
  // 调用 statusListeners.add，触发print此处需要的副作用。
  statusListeners.add(rateLimitListener)

  // Messages for internal tracking, directly mutated by ask(). These messages
  // include Assistant, User, Attachment, and Progress messages.
  // TODO: Clean up this code to avoid passing around a mutable array.
  // mutableMessages 消息数据保存`initialMessages`，供后续判断或组装使用。
  const mutableMessages: Message[] = initialMessages

  // Seed the readFileState cache from the transcript (content the model saw,
  // with message timestamps) so getChangedFiles can detect external edits.
  // This cache instance must persist across ask() calls, since the edit tool
  // relies on this as a global state.
  // readFileState 文件数据保存`extractReadFilesFromMessages`，供print后续处理使用。
  let readFileState = extractReadFilesFromMessages(
    initialMessages,
    cwd(),
    READ_FILE_STATE_CACHE_SIZE,
  )

  // Client-supplied readFileState seeds (via seed_read_state control request).
  // The stdin IIFE runs concurrently with ask() — a seed arriving mid-turn
  // would be lost to ask()'s clone-then-replace (QueryEngine.ts finally block)
  // if written directly into readFileState. Instead, seeds land here, merge
  // into getReadFileCache's view (readFileState-wins-ties: seeds fill gaps),
  // and are re-applied then CLEARED in setReadFileCache. One-shot: each seed
  // survives exactly one clone-replace cycle, then becomes a regular
  // readFileState entry subject to compact's clear like everything else.
  // pendingSeeds 集合构建`createFileStateCacheWithSizeLimit`，供print后续处理使用。
  const pendingSeeds = createFileStateCacheWithSizeLimit(
    READ_FILE_STATE_CACHE_SIZE,
  )

  // Auto-resume interrupted turns on restart so CC continues from where it
  // left off without requiring the SDK to re-send the prompt.
  // resumeInterruptedTurnEnv 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const resumeInterruptedTurnEnv =
    process.env.CLAUDE_CODE_RESUME_INTERRUPTED_TURN
  // print在这里进入条件判断，后续代码按实际状态分流。
  if (
    turnInterruptionState &&
    turnInterruptionState.kind !== 'none' &&
    resumeInterruptedTurnEnv
  ) {
    // 记录print运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[print.ts] Auto-resuming interrupted turn (kind: ${turnInterruptionState.kind})`,
    )

    // Remove the interrupted message and its sentinel, then re-enqueue so
    // the model sees it exactly once. For mid-turn interruptions, the
    // deserialization layer transforms them into interrupted_prompt by
    // appending a synthetic "Continue from where you left off." message.
    // 调用 removeInterruptedMessage，触发print此处需要的副作用。
    removeInterruptedMessage(mutableMessages, turnInterruptionState.message)
    // 调用 enqueue，触发print此处需要的副作用。
    enqueue({
      mode: 'prompt',
      value: turnInterruptionState.message.message.content,
      uuid: randomUUID(),
    })
  }

  // modelOptions 集合读取`getModelOptions`，供print后续处理使用。
  const modelOptions = getModelOptions()
  // modelInfos 集合派生`modelOptions.map`，供print后续处理使用。
  const modelInfos = modelOptions.map(option => {
    // modelId标记print是否启用对应路径。
    const modelId = option.value === null ? 'default' : option.value
    // resolvedModel 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const resolvedModel =
      modelId === 'default'
        ? getDefaultMainLoopModel()
        : parseUserSpecifiedModel(modelId)
    // hasEffort记录 `modelSupportsEffort` 是否成立，print随后按该结果分支。
    const hasEffort = modelSupportsEffort(resolvedModel)
    // hasAdaptiveThinking记录 `modelSupportsAdaptiveThinking` 是否成立，print随后按该结果分支。
    const hasAdaptiveThinking = modelSupportsAdaptiveThinking(resolvedModel)
    // hasFastMode记录 `isFastModeSupportedByModel` 是否成立，print随后按该结果分支。
    const hasFastMode = isFastModeSupportedByModel(option.value)
    // hasAutoMode记录 `modelSupportsAutoMode` 是否成立，print随后按该结果分支。
    const hasAutoMode = modelSupportsAutoMode(resolvedModel)
    // 返回结构化结果，集中表达print已经整理出的状态。
    return {
      value: modelId,
      displayName: option.label,
      description: option.description,
      ...(hasEffort && {
        supportsEffort: true,
        supportedEffortLevels: modelSupportsMaxEffort(resolvedModel)
          ? [...EFFORT_LEVELS]
          // 这个回调绑定到 : EFFORT_LEVELS.filter(l => l !== 'max'),，负责print在该局部场景下的响应。
          : EFFORT_LEVELS.filter(l => l !== 'max'),
      }),
      ...(hasAdaptiveThinking && { supportsAdaptiveThinking: true }),
      ...(hasFastMode && { supportsFastMode: true }),
      ...(hasAutoMode && { supportsAutoMode: true }),
    }
  })
  // activeUserSpecifiedModel 命名 `options.userSpecifiedModel`，让后续代码直接表达这个值的用途。
  let activeUserSpecifiedModel = options.userSpecifiedModel

  // injectModelSwitchBreadcrumbs 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function injectModelSwitchBreadcrumbs(
    modelArg: string,
    resolvedModel: string,
  ): void {
    // breadcrumbs 集合读取`createModelSwitchBreadcrumbs`，供print后续处理使用。
    const breadcrumbs = createModelSwitchBreadcrumbs(
      modelArg,
      modelDisplayString(resolvedModel),
    )
    // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
    mutableMessages.push(...breadcrumbs)
    // 按顺序遍历 `breadcrumbs` 中的crumb，逐个交给print处理。
    for (const crumb of breadcrumbs) {
      // print在这里进入条件判断，后续代码按实际状态分流。
      if (
        typeof crumb.message.content === 'string' &&
        crumb.message.content.includes(`<${LOCAL_COMMAND_STDOUT_TAG}>`)
      ) {
        // 调用 output.enqueue，触发print此处需要的副作用。
        output.enqueue({
          type: 'user',
          message: crumb.message,
          session_id: getSessionId(),
          parent_tool_use_id: null,
          uuid: crumb.uuid,
          timestamp: crumb.timestamp,
          isReplay: true,
        } satisfies SDKUserMessageReplay)
      }
    }
  }

  // Cache SDK MCP clients to avoid reconnecting on each run
  // sdkClients 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let sdkClients: MCPServerConnection[] = []
  // sdkTools 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let sdkTools: Tools = []

  // Track which MCP clients have had elicitation handlers registered
  // elicitationRegistered 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const elicitationRegistered = new Set<string>()

  /**
   * Register elicitation request/completion handlers on connected MCP clients
   * that haven't been registered yet. SDK MCP servers are excluded because they
   * route through SdkControlClientTransport. Hooks run first (matching REPL
   * behavior); if no hook responds, the request is forwarded to the SDK
   * consumer via the control protocol.
   */
  // registerElicitationHandlers 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function registerElicitationHandlers(clients: MCPServerConnection[]): void {
    // 按顺序遍历 `clients` 中的connection，逐个交给print处理。
    for (const connection of clients) {
      // print在这里进入条件判断，后续代码按实际状态分流。
      if (
        connection.type !== 'connected' ||
        elicitationRegistered.has(connection.name)
      ) {
        // 跳过当前项，继续处理print中的下一轮循环。
        continue
      }
      // Skip SDK MCP servers — elicitation flows through SdkControlClientTransport
      // 当 `connection.config.type` 匹配 `'sdk'` 时，print执行对应分支。
      if (connection.config.type === 'sdk') {
        // 跳过当前项，继续处理print中的下一轮循环。
        continue
      }
      // serverName 命名 `connection.name`，让后续代码直接表达这个值的用途。
      const serverName = connection.name

      // Wrapped in try/catch because setRequestHandler throws if the client wasn't
      // created with elicitation capability declared (e.g., SDK-created clients).
      // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
      try {
        // connection.client.setRequestHandler 写入新的状态值，使print后续读取保持一致。
        connection.client.setRequestHandler(
          ElicitRequestSchema,
          // 调用 async，触发print此处需要的副作用。
          async (request, extra) => {
            // 调用 logMCPDebug，触发print此处需要的副作用。
            logMCPDebug(
              serverName,
              `Elicitation request received in print mode: ${jsonStringify(request)}`,
            )

            // mode标记print是否启用对应路径。
            const mode = request.params.mode === 'url' ? 'url' : 'form'

            // 记录print运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_mcp_elicitation_shown', {
              mode: mode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            })

            // Run elicitation hooks first — they can provide a response programmatically
            // hookResponse 响应数据保存`runElicitationHooks`，供print后续处理使用。
            const hookResponse = await runElicitationHooks(
              serverName,
              request.params,
              extra.signal,
            )
            // 满足 `hookResponse` 时，print执行该分支。
            if (hookResponse) {
              // 调用 logMCPDebug，触发print此处需要的副作用。
              logMCPDebug(
                serverName,
                `Elicitation resolved by hook: ${jsonStringify(hookResponse)}`,
              )
              // 记录print运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_mcp_elicitation_response', {
                mode: mode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                action:
                  hookResponse.action as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              })
              // 返回 `hookResponse`，作为print这次计算的结果。
              return hookResponse
            }

            // Delegate to SDK consumer via control protocol
            // url 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const url =
              'url' in request.params
                ? (request.params.url as string)
                : undefined
            // requestedSchema 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const requestedSchema =
              'requestedSchema' in request.params
                ? (request.params.requestedSchema as
                    | Record<string, unknown>
                    | undefined)
                : undefined

            // elicitationId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const elicitationId =
              'elicitationId' in request.params
                ? (request.params.elicitationId as string | undefined)
                : undefined

            // rawResult保存`structuredIO.handleElicitation`，供print后续处理使用。
            const rawResult = await structuredIO.handleElicitation(
              serverName,
              request.params.message,
              requestedSchema,
              extra.signal,
              mode,
              url,
              elicitationId,
            )

            // 结果保存`runElicitationResultHooks`，供print后续处理使用。
            const result = await runElicitationResultHooks(
              serverName,
              rawResult,
              extra.signal,
              mode,
              elicitationId,
            )

            // 记录print运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_mcp_elicitation_response', {
              mode: mode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              action:
                result.action as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            })
            // 返回 `result`，作为print这次计算的结果。
            return result
          },
        )

        // Surface completion notifications to SDK consumers (URL mode)
        // connection.client.setNotificationHandler 写入新的状态值，使print后续读取保持一致。
        connection.client.setNotificationHandler(
          ElicitationCompleteNotificationSchema,
          // notification更新为 `> {`，确保CLI后续读取最新状态。
          notification => {
            // 从 `notification.params` 解构 elicitationId，减少print对同一对象的重复访问。
            const { elicitationId } = notification.params
            // 调用 logMCPDebug，触发print此处需要的副作用。
            logMCPDebug(
              serverName,
              `Elicitation completion notification: ${elicitationId}`,
            )
            // 显式忽略 `executeNotificationHooks({` 的返回值，只保留它触发的副作用。
            void executeNotificationHooks({
              message: `MCP server "${serverName}" confirmed elicitation ${elicitationId} complete`,
              notificationType: 'elicitation_complete',
            })
            // 调用 output.enqueue，触发print此处需要的副作用。
            output.enqueue({
              type: 'system',
              subtype: 'elicitation_complete',
              mcp_server_name: serverName,
              elicitation_id: elicitationId,
              uuid: randomUUID(),
              session_id: getSessionId(),
            })
          },
        )

        // 调用 elicitationRegistered.add，触发print此处需要的副作用。
        elicitationRegistered.add(serverName)
      } catch {
        // setRequestHandler throws if the client wasn't created with
        // elicitation capability — skip silently
      }
    }
  }

  // updateSdkMcp 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function updateSdkMcp() {
    // Check if SDK MCP servers need to be updated (new servers added or removed)
    // currentServerNames 集合保存`Set`，供print后续处理使用。
    const currentServerNames = new Set(Object.keys(sdkMcpConfigs))
    // connectedServerNames 集合保存`Set`，供print后续处理使用。
    const connectedServerNames = new Set(sdkClients.map(c => c.name))

    // Check if there are any differences (additions or removals)
    // hasNewServers 集合记录 `Array.from` 是否成立，print随后按该结果分支。
    const hasNewServers = Array.from(currentServerNames).some(
      // 名称更新为 `> !connectedServerNames.has(name)`，确保CLI后续读取最新状态。
      name => !connectedServerNames.has(name),
    )
    // hasRemovedServers 集合记录 `Array.from` 是否成立，print随后按该结果分支。
    const hasRemovedServers = Array.from(connectedServerNames).some(
      // 名称更新为 `> !currentServerNames.has(name)`，确保CLI后续读取最新状态。
      name => !currentServerNames.has(name),
    )
    // Check if any SDK clients are pending and need to be upgraded
    // hasPendingSdkClients 集合记录 `sdkClients.some` 是否成立，print随后按该结果分支。
    const hasPendingSdkClients = sdkClients.some(c => c.type === 'pending')
    // Check if any SDK clients failed their handshake and need to be retried.
    // Without this, a client that lands in 'failed' (e.g. handshake timeout on
    // a WS reconnect race) stays failed forever — its name satisfies the
    // connectedServerNames diff but it contributes zero tools.
    // hasFailedSdkClients 集合记录 `sdkClients.some` 是否成立，print随后按该结果分支。
    const hasFailedSdkClients = sdkClients.some(c => c.type === 'failed')

    // haveServersChanged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const haveServersChanged =
      hasNewServers ||
      hasRemovedServers ||
      hasPendingSdkClients ||
      hasFailedSdkClients

    // 满足 `haveServersChanged` 时，print执行该分支。
    if (haveServersChanged) {
      // Clean up removed servers
      // 按顺序遍历 `sdkClients` 中的API 客户端，逐个交给print处理。
      for (const client of sdkClients) {
        // 满足 `!currentServerNames.has(client.name)` 时，print执行该分支。
        if (!currentServerNames.has(client.name)) {
          // 当 `client.type` 匹配 `'connected'` 时，print执行对应分支。
          if (client.type === 'connected') {
            // 等待 `client.cleanup()` 完成，再继续print的异步流程。
            await client.cleanup()
          }
        }
      }

      // Re-initialize all SDK MCP servers with current config
      // sdkSetup保存`setupSdkMcpClients`，供print后续处理使用。
      const sdkSetup = await setupSdkMcpClients(
        sdkMcpConfigs,
        // 这个回调绑定到 (serverName, message) =>，负责print在该局部场景下的响应。
        (serverName, message) =>
          structuredIO.sendMcpMessage(serverName, message),
      )
      // sdkClients 集合更新为 `sdkSetup.clients`，确保CLI后续读取最新状态。
      sdkClients = sdkSetup.clients
      // sdkTools 集合更新为 `sdkSetup.tools`，确保CLI后续读取最新状态。
      sdkTools = sdkSetup.tools

      // Store SDK MCP tools in appState so subagents can access them via
      // assembleToolPool. Only tools are stored here — SDK clients are already
      // merged separately in the query loop (allMcpClients) and mcp_status handler.
      // Use both old (connectedServerNames) and new (currentServerNames) to remove
      // stale SDK tools when servers are added or removed.
      // allSdkNames 集合保存`uniq`，供print后续处理使用。
      const allSdkNames = uniq([...connectedServerNames, ...currentServerNames])
      // setAppState 写入新的状态值，使print后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        mcp: {
          ...prev.mcp,
          tools: [
            ...prev.mcp.tools.filter(
              // t更新为 `>`，确保CLI后续读取最新状态。
              t =>
                // 这个回调绑定到 !allSdkNames.some(name =>，负责print在该局部场景下的响应。
                !allSdkNames.some(name =>
                  t.name.startsWith(getMcpPrefix(name)),
                ),
            ),
            ...sdkTools,
          ],
        },
      }))

      // Set up the special internal VSCode MCP server if necessary.
      // 调用 setupVscodeSdkMcp，触发print此处需要的副作用。
      setupVscodeSdkMcp(sdkClients)
    }
  }

  // 显式忽略 `updateSdkMcp()` 的返回值，只保留它触发的副作用。
  void updateSdkMcp()

  // State for dynamically added MCP servers (via mcp_set_servers control message)
  // These are separate from SDK MCP servers and support all transport types
  // dynamicMcpState 状态 集中保存print要一起传递的字段。
  let dynamicMcpState: DynamicMcpState = {
    clients: [],
    tools: [],
    configs: {},
  }

  // Shared tool assembly for ask() and the get_context_usage control request.
  // Closes over the mutable sdkTools/dynamicMcpState bindings so both call
  // sites see late-connecting servers.
  // buildAllTools 集合封装成回调，供print在事件触发或异步步骤中调用。
  const buildAllTools = (appState: AppState): Tools => {
    // assembledTools 集合保存`assembleToolPool`，供print后续处理使用。
    const assembledTools = assembleToolPool(
      appState.toolPermissionContext,
      appState.mcp.tools,
    )
    // allTools 集合保存`uniqBy`，供print后续处理使用。
    let allTools = uniqBy(
      mergeAndFilterTools(
        [...tools, ...sdkTools, ...dynamicMcpState.tools],
        assembledTools,
        appState.toolPermissionContext.mode,
      ),
      'name',
    )
    // 满足 `options.permissionPromptToolName` 时，print执行该分支。
    if (options.permissionPromptToolName) {
      // allTools 集合更新为 `allTools.filter(`，确保CLI后续读取最新状态。
      allTools = allTools.filter(
        // 工具更新为 `> !toolMatchesName(tool, options.permissionPromptToolName...`，确保CLI后续读取最新状态。
        tool => !toolMatchesName(tool, options.permissionPromptToolName!),
      )
    }
    // initJsonSchema读取`getInitJsonSchema`，供print后续处理使用。
    const initJsonSchema = getInitJsonSchema()
    // 组合条件 `initJsonSchema && !options.jsonSchema` 成立时，print才启用这条专门路径。
    if (initJsonSchema && !options.jsonSchema) {
      // syntheticOutputResult构建`createSyntheticOutputTool`，供print后续处理使用。
      const syntheticOutputResult = createSyntheticOutputTool(initJsonSchema)
      // 满足 `'tool' in syntheticOutputResult` 时，print执行该分支。
      if ('tool' in syntheticOutputResult) {
        // allTools 集合更新为 `[...allTools, syntheticOutputResult.tool]`，确保CLI后续读取最新状态。
        allTools = [...allTools, syntheticOutputResult.tool]
      }
    }
    // 返回 `allTools`，作为print这次计算的结果。
    return allTools
  }

  // Bridge handle for remote-control (SDK control message).
  // Mirrors the REPL's useReplBridge hook: the handle is created when
  // `remote_control` is enabled and torn down when disabled.
  // bridgeHandle初始化为空值，后续分支会在有数据时补齐。
  let bridgeHandle: ReplBridgeHandle | null = null
  // Cursor into mutableMessages — tracks how far we've forwarded.
  // Same index-based diff as useReplBridge's lastWrittenIndexRef.
  // bridgeLastForwardedIndex 索引保存`0`，供后续判断或组装使用。
  let bridgeLastForwardedIndex = 0

  // Forward new messages from mutableMessages to the bridge.
  // Called incrementally during each turn (so claude.ai sees progress
  // and stays alive during permission waits) and again after the turn.
  //
  // writeMessages has its own UUID-based dedup (initialMessageUUIDs,
  // recentPostedUUIDs) — the index cursor here is a pre-filter to avoid
  // O(n) re-scanning of already-sent messages on every call.
  // forwardMessagesToBridge 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function forwardMessagesToBridge(): void {
    // bridgeHandle缺失时提前走兜底路径，避免print继续依赖无效输入。
    if (!bridgeHandle) return
    // Guard against mutableMessages shrinking (compaction truncates it).
    // startIndex 索引保存`Math.min`，供print后续处理使用。
    const startIndex = Math.min(
      bridgeLastForwardedIndex,
      mutableMessages.length,
    )
    // newMessages 消息数据保存`mutableMessages`，供print后续判断或输出使用。
    const newMessages = mutableMessages
      .slice(startIndex)
      // 链式调用 filter，继续加工上一行在print中产生的数据。
      .filter(m => m.type === 'user' || m.type === 'assistant')
    // bridgeLastForwardedIndex 索引更新为 `mutableMessages.length`，确保CLI后续读取最新状态。
    bridgeLastForwardedIndex = mutableMessages.length
    // 满足 `newMessages.length > 0` 时，print执行该分支。
    if (newMessages.length > 0) {
      // 调用 bridgeHandle.writeMessages，触发print此处需要的副作用。
      bridgeHandle.writeMessages(newMessages)
    }
  }

  // Helper to apply MCP server changes - used by both mcp_set_servers control message
  // and background plugin installation.
  // NOTE: Nested function required - mutates closure state (sdkMcpConfigs, sdkClients, etc.)
  // mcpChangesPromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
  let mcpChangesPromise: Promise<{
    response: SDKControlMcpSetServersResponse
    sdkServersChanged: boolean
  }> = Promise.resolve({
    response: {
      added: [] as string[],
      removed: [] as string[],
      errors: {} as Record<string, string>,
    },
    sdkServersChanged: false,
  })

  // applyMcpServerChanges 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function applyMcpServerChanges(
    servers: Record<string, McpServerConfigForProcessTransport>,
  ): Promise<{
    response: SDKControlMcpSetServersResponse
    sdkServersChanged: boolean
  }> {
    // Serialize calls to prevent race conditions between concurrent callers
    // (background plugin install and mcp_set_servers control messages)
    // doWork保存`async`，供print后续处理使用。
    const doWork = async (): Promise<{
      response: SDKControlMcpSetServersResponse
      sdkServersChanged: boolean
    }> => {
      // oldSdkClientNames 集合保存`Set`，供print后续处理使用。
      const oldSdkClientNames = new Set(sdkClients.map(c => c.name))

      // 结果保存`handleMcpSetServers`，供print后续处理使用。
      const result = await handleMcpSetServers(
        servers,
        { configs: sdkMcpConfigs, clients: sdkClients, tools: sdkTools },
        dynamicMcpState,
        setAppState,
      )

      // Update SDK state (need to mutate sdkMcpConfigs since it's shared)
      // 逐项读取 `Object.keys(sdkMcpConfigs)` 中的key，按输入顺序推进print。
      for (const key of Object.keys(sdkMcpConfigs)) {
        // print在这里处理 `delete sdkMcpConfigs[key]`，完成这一小步状态转换。
        delete sdkMcpConfigs[key]
      }
      // 调用 Object.assign，触发print此处需要的副作用。
      Object.assign(sdkMcpConfigs, result.newSdkState.configs)
      // sdkClients 集合更新为 `result.newSdkState.clients`，确保CLI后续读取最新状态。
      sdkClients = result.newSdkState.clients
      // sdkTools 集合更新为 `result.newSdkState.tools`，确保CLI后续读取最新状态。
      sdkTools = result.newSdkState.tools
      // dynamicMcpState 状态更新为 `result.newDynamicState`，确保CLI后续读取最新状态。
      dynamicMcpState = result.newDynamicState

      // Keep appState.mcp.tools in sync so subagents can see SDK MCP tools.
      // Use both old and new SDK client names to remove stale tools.
      // 满足 `result.sdkServersChanged` 时，print执行该分支。
      if (result.sdkServersChanged) {
        // newSdkClientNames 集合保存`Set`，供print后续处理使用。
        const newSdkClientNames = new Set(sdkClients.map(c => c.name))
        // allSdkNames 集合保存`uniq`，供print后续处理使用。
        const allSdkNames = uniq([...oldSdkClientNames, ...newSdkClientNames])
        // setAppState 写入新的状态值，使print后续读取保持一致。
        setAppState(prev => ({
          ...prev,
          mcp: {
            ...prev.mcp,
            tools: [
              ...prev.mcp.tools.filter(
                // t更新为 `>`，确保CLI后续读取最新状态。
                t =>
                  // 这个回调绑定到 !allSdkNames.some(name =>，负责print在该局部场景下的响应。
                  !allSdkNames.some(name =>
                    t.name.startsWith(getMcpPrefix(name)),
                  ),
              ),
              ...sdkTools,
            ],
          },
        }))
      }

      // 返回结构化结果，集中表达print已经整理出的状态。
      return {
        response: result.response,
        sdkServersChanged: result.sdkServersChanged,
      }
    }

    // mcpChangesPromise 异步任务更新为 `mcpChangesPromise.then(doWork, doWork)`，确保CLI后续读取最新状态。
    mcpChangesPromise = mcpChangesPromise.then(doWork, doWork)
    // 返回 `mcpChangesPromise`，作为print这次计算的结果。
    return mcpChangesPromise
  }

  // Build McpServerStatus[] for control responses. Shared by mcp_status and
  // reload_plugins handlers. Reads closure state: sdkClients, dynamicMcpState.
  // buildMcpServerStatuses 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function buildMcpServerStatuses(): McpServerStatus[] {
    // currentAppState 状态读取`getAppState`，供print后续处理使用。
    const currentAppState = getAppState()
    // currentMcpClients 集合 命名 `currentAppState.mcp.clients`，让后续代码直接表达这个值的用途。
    const currentMcpClients = currentAppState.mcp.clients
    // allMcpTools 集合保存`uniqBy`，供print后续处理使用。
    const allMcpTools = uniqBy(
      [...currentAppState.mcp.tools, ...dynamicMcpState.tools],
      'name',
    )
    // existingNames 集合保存`Set`，供print后续处理使用。
    const existingNames = new Set([
      // 链式调用 链式方法，继续加工上一行在print中产生的数据。
      ...currentMcpClients.map(c => c.name),
      // 链式调用 链式方法，继续加工上一行在print中产生的数据。
      ...sdkClients.map(c => c.name),
    ])
    // 返回列表结果，保留print已经排好的条目顺序。
    return [
      ...currentMcpClients,
      ...sdkClients,
      // 链式调用 链式方法，继续加工上一行在print中产生的数据。
      ...dynamicMcpState.clients.filter(c => !existingNames.has(c.name)),
    // 这个回调绑定到 ].map(connection => {，负责print在该局部场景下的响应。
    ].map(connection => {
      // config 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let config
      // print在这里进入条件判断，后续代码按实际状态分流。
      if (
        connection.config.type === 'sse' ||
        connection.config.type === 'http'
      ) {
        // 配置更新为 `{`，确保CLI后续读取最新状态。
        config = {
          type: connection.config.type,
          url: connection.config.url,
          headers: connection.config.headers,
          oauth: connection.config.oauth,
        }
      // print在这里处理 `} else if (connection.config.type === 'claudeai-proxy') {`，完成这一小步状态转换。
      } else if (connection.config.type === 'claudeai-proxy') {
        // 配置更新为 `{`，确保CLI后续读取最新状态。
        config = {
          type: 'claudeai-proxy' as const,
          url: connection.config.url,
          id: connection.config.id,
        }
      // print在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        connection.config.type === 'stdio' ||
        connection.config.type === undefined
      ) {
        // 配置更新为 `{`，确保CLI后续读取最新状态。
        config = {
          type: 'stdio' as const,
          command: connection.config.command,
          args: connection.config.args,
        }
      }
      // serverTools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const serverTools =
        connection.type === 'connected'
          // 这个回调绑定到 ? filterToolsByServer(allMcpTools, connection.name).map(tool => ({，负责print在该局部场景下的响应。
          ? filterToolsByServer(allMcpTools, connection.name).map(tool => ({
              name: tool.mcpInfo?.toolName ?? tool.name,
              annotations: {
                readOnly: tool.isReadOnly({}) || undefined,
                destructive: tool.isDestructive?.({}) || undefined,
                openWorld: tool.isOpenWorld?.({}) || undefined,
              },
            }))
          : undefined
      // Capabilities passthrough with allowlist pre-filter. The IDE reads
      // experimental['claude/channel'] to decide whether to show the
      // Enable-channel prompt — only echo it if channel_enable would
      // actually pass the allowlist. Not a security boundary (the
      // handler re-runs the full gate); just avoids dead buttons.
      // capabilities 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let capabilities: { experimental?: Record<string, unknown> } | undefined
      // print在这里进入条件判断，后续代码按实际状态分流。
      if (
        (feature('KAIROS') || feature('KAIROS_CHANNELS')) &&
        connection.type === 'connected' &&
        connection.capabilities.experimental
      ) {
        // exp 集中保存print要一起传递的字段。
        const exp = { ...connection.capabilities.experimental }
        // print在这里进入条件判断，后续代码按实际状态分流。
        if (
          exp['claude/channel'] &&
          (!isChannelsEnabled() ||
            !isChannelAllowlisted(connection.config.pluginSource))
        ) {
          // print在这里处理 `delete exp['claude/channel']`，完成这一小步状态转换。
          delete exp['claude/channel']
        }
        // 满足 `Object.keys(exp).length > 0` 时，print执行该分支。
        if (Object.keys(exp).length > 0) {
          // capabilities 集合更新为 `{ experimental: exp }`，确保CLI后续读取最新状态。
          capabilities = { experimental: exp }
        }
      }
      // 返回结构化结果，集中表达print已经整理出的状态。
      return {
        name: connection.name,
        status: connection.type,
        serverInfo:
          connection.type === 'connected' ? connection.serverInfo : undefined,
        error: connection.type === 'failed' ? connection.error : undefined,
        config,
        scope: connection.config.scope,
        tools: serverTools,
        capabilities,
      }
    })
  }

  // NOTE: Nested function required - needs closure access to applyMcpServerChanges and updateSdkMcp
  // installPluginsAndApplyMcpInBackground 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function installPluginsAndApplyMcpInBackground(): Promise<void> {
    // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
    try {
      // Join point for user settings (fired at runHeadless entry) and managed
      // settings (fired in main.tsx preAction). downloadUserSettings() caches
      // its promise so this awaits the same in-flight request.
      // 等待 `Promise.all([` 完成，再继续print的异步流程。
      await Promise.all([
        feature('DOWNLOAD_USER_SETTINGS') &&
        (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) || getIsRemoteMode())
          // 这个回调绑定到 ? withDiagnosticsTiming('headless_user_settings_download', () =>，负责print在该局部场景下的响应。
          ? withDiagnosticsTiming('headless_user_settings_download', () =>
              downloadUserSettings(),
            )
          : Promise.resolve(),
        // 调用 withDiagnosticsTiming，触发print此处需要的副作用。
        withDiagnosticsTiming('headless_managed_settings_wait', () =>
          waitForRemoteManagedSettingsToLoad(),
        ),
      ])

      // pluginsInstalled 插件数据保存`installPluginsForHeadless`，供print后续处理使用。
      const pluginsInstalled = await installPluginsForHeadless()

      // 满足 `pluginsInstalled` 时，print执行该分支。
      if (pluginsInstalled) {
        // 等待 `applyPluginMcpDiff()` 完成，再继续print的异步流程。
        await applyPluginMcpDiff()
      }
    } catch (error) {
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // Background plugin installation for all headless users
  // Installs marketplaces from extraKnownMarketplaces and missing enabled plugins
  // CLAUDE_CODE_SYNC_PLUGIN_INSTALL=true: resolved in run() before the first
  // query so plugins are guaranteed available on the first ask().
  // pluginInstallPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
  let pluginInstallPromise: Promise<void> | null = null
  // --bare / SIMPLE: skip plugin install. Scripted calls don't add plugins
  // mid-session; the next interactive run reconciles.
  // 满足 `!isBareMode()` 时，print执行该分支。
  if (!isBareMode()) {
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL)` 时，print执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL)) {
      // pluginInstallPromise 异步任务更新为 `installPluginsAndApplyMcpInBackground()`，确保CLI后续读取最新状态。
      pluginInstallPromise = installPluginsAndApplyMcpInBackground()
    } else {
      // 显式忽略 `installPluginsAndApplyMcpInBackground()` 的返回值，只保留它触发的副作用。
      void installPluginsAndApplyMcpInBackground()
    }
  }

  // Idle timeout management
  // idleTimeout构建`createIdleTimeoutManager`，供print后续处理使用。
  const idleTimeout = createIdleTimeoutManager(() => !running)

  // Mutable commands and agents for hot reloading
  // currentCommands 命令数据保存`commands`，供print后续判断或输出使用。
  let currentCommands = commands
  // currentAgents 集合 命名 `agents`，让后续代码直接表达这个值的用途。
  let currentAgents = agents

  // Clear all plugin-related caches, reload commands/agents/hooks.
  // Called after CLAUDE_CODE_SYNC_PLUGIN_INSTALL completes (before first query)
  // and after non-sync background install finishes.
  // refreshActivePlugins calls clearAllCaches() which is required because
  // loadAllPlugins() may have run during main.tsx startup BEFORE managed
  // settings were fetched. Without clearing, getCommands() would rebuild
  // from a stale plugin list.
  // refreshPluginState 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function refreshPluginState(): Promise<void> {
    // refreshActivePlugins handles the full cache sweep (clearAllCaches),
    // reloads all plugin component loaders, writes AppState.plugins +
    // AppState.agentDefinitions, registers hooks, and bumps mcp.pluginReconnectKey.
    // print先整理这一处局部数据，后续分支可以直接读取。
    const { agentDefinitions: freshAgentDefs } =
      await refreshActivePlugins(setAppState)

    // Headless-specific: currentCommands/currentAgents are local mutable refs
    // captured by the query loop (REPL uses AppState instead). getCommands is
    // fresh because refreshActivePlugins cleared its cache.
    // currentCommands 命令数据更新为 `await getCommands(cwd())`，确保CLI后续读取最新状态。
    currentCommands = await getCommands(cwd())

    // Preserve SDK-provided agents (--agents CLI flag or SDK initialize
    // control_request) — both inject via parseAgentsFromJson with
    // source='flagSettings'. loadMarkdownFilesForSubdir never assigns this
    // source, so it cleanly discriminates "injected, not disk-loadable".
    //
    // The previous filter used a negative set-diff (!freshAgentTypes.has(a))
    // which also matched plugin agents that were in the poisoned initial
    // currentAgents but correctly excluded from freshAgentDefs after managed
    // settings applied — leaking policy-blocked agents into the init message.
    // See gh-23085: isBridgeEnabled() at Commander-definition time poisoned
    // the settings cache before setEligibility(true) ran.
    // sdkAgents 集合筛选`currentAgents.filter`，供print后续处理使用。
    const sdkAgents = currentAgents.filter(a => a.source === 'flagSettings')
    // currentAgents 集合更新为 `[...freshAgentDefs.allAgents, ...sdkAgents]`，确保CLI后续读取最新状态。
    currentAgents = [...freshAgentDefs.allAgents, ...sdkAgents]
  }

  // Re-diff MCP configs after plugin state changes. Filters to
  // process-transport-supported types and carries SDK-mode servers through
  // so applyMcpServerChanges' diff doesn't close their transports.
  // Nested: needs closure access to sdkMcpConfigs, applyMcpServerChanges,
  // updateSdkMcp.
  // applyPluginMcpDiff 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function applyPluginMcpDiff(): Promise<void> {
    // 从 `await getAllMcpConfigs()` 解构 servers，减少print对同一对象的重复访问。
    const { servers: newConfigs } = await getAllMcpConfigs()
    // supportedConfigs 配置 先占位，稍后的条件分支会根据实际输入补齐它。
    const supportedConfigs: Record<string, McpServerConfigForProcessTransport> =
      {}
    // 循环处理 `const [name, config] of Object.entries(newConfigs)`，让print把同类条目按顺序走完。
    for (const [name, config] of Object.entries(newConfigs)) {
      // type保存`config.type`，供后续判断或组装使用。
      const type = config.type
      // print在这里进入条件判断，后续代码按实际状态分流。
      if (
        type === undefined ||
        type === 'stdio' ||
        type === 'sse' ||
        type === 'http' ||
        type === 'sdk'
      ) {
        // supportedConfigs[name 配置更新为 `config`，确保print后续读取最新状态。
        supportedConfigs[name] = config
      }
    }
    // 循环处理 `const [name, config] of Object.entries(sdkMcpConfigs)`，让print把同类条目按顺序走完。
    for (const [name, config] of Object.entries(sdkMcpConfigs)) {
      // 组合条件 `config.type === 'sdk' && !(name in supportedConfigs)` 成立时，print才启用这条专门路径。
      if (config.type === 'sdk' && !(name in supportedConfigs)) {
        // supportedConfigs[name 配置更新为 `config`，确保print后续读取最新状态。
        supportedConfigs[name] = config
      }
    }
    // print先整理这一处局部数据，后续分支可以直接读取。
    const { response, sdkServersChanged } =
      await applyMcpServerChanges(supportedConfigs)
    // 满足 `sdkServersChanged` 时，print执行该分支。
    if (sdkServersChanged) {
      // 显式忽略 `updateSdkMcp()` 的返回值，只保留它触发的副作用。
      void updateSdkMcp()
    }
    // 记录print运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Headless MCP refresh: added=${response.added.length}, removed=${response.removed.length}`,
    )
  }

  // Subscribe to skill changes for hot reloading
  // unsubscribeSkillChanges 集合保存`skillChangeDetector.subscribe`，供print后续处理使用。
  const unsubscribeSkillChanges = skillChangeDetector.subscribe(() => {
    // 清理相关缓存，确保print下一次读取时重新加载最新数据。
    clearCommandsCache()
    // 这个回调绑定到 void getCommands(cwd()).then(newCommands => {，负责print在该局部场景下的响应。
    void getCommands(cwd()).then(newCommands => {
      // currentCommands 命令数据更新为 `newCommands`，确保CLI后续读取最新状态。
      currentCommands = newCommands
    })
  })

  // Proactive mode: schedule a tick to keep the model looping autonomously.
  // setTimeout(0) yields to the event loop so pending stdin messages
  // (interrupts, user messages) are processed before the tick fires.
  // scheduleProactiveTick 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const scheduleProactiveTick =
    feature('PROACTIVE') || feature('KAIROS')
      // 这个回调绑定到 ? () => {，负责print在该局部场景下的响应。
      ? () => {
          // setTimeout 写入新的状态值，使print后续读取保持一致。
          setTimeout(() => {
            // print在这里进入条件判断，后续代码按实际状态分流。
            if (
              !proactiveModule?.isProactiveActive() ||
              proactiveModule.isProactivePaused() ||
              inputClosed
            ) {
              // print在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // tickContent记录时间`Date`，供print后续处理使用。
            const tickContent = `<${TICK_TAG}>${new Date().toLocaleTimeString()}</${TICK_TAG}>`
            // 调用 enqueue，触发print此处需要的副作用。
            enqueue({
              mode: 'prompt' as const,
              value: tickContent,
              uuid: randomUUID(),
              priority: 'later',
              isMeta: true,
            })
            // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
            void run()
          }, 0)
        }
      : undefined

  // Abort the current operation when a 'now' priority message arrives.
  // 调用 subscribeToCommandQueue，触发print此处需要的副作用。
  subscribeToCommandQueue(() => {
    // 组合条件 `abortController && getCommandsByMaxPriority('now').length > 0` 成立时，print才启用这条专门路径。
    if (abortController && getCommandsByMaxPriority('now').length > 0) {
      // 触发取消信号，通知print中仍在等待的异步任务尽快停止。
      abortController.abort('interrupt')
    }
  })

  // run保存`async`，供print后续处理使用。
  const run = async () => {
    // 满足 `running` 时，print执行该分支。
    if (running) {
      // print在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // running更新为 `true`，确保CLI后续读取最新状态。
    running = true
    // runPhase更新为 `undefined`，确保CLI后续读取最新状态。
    runPhase = undefined
    // 调用 notifySessionStateChanged，触发print此处需要的副作用。
    notifySessionStateChanged('running')
    // 调用 idleTimeout.stop，触发print此处需要的副作用。
    idleTimeout.stop()

    // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
    headlessProfilerCheckpoint('run_entry')
    // TODO(custom-tool-refactor): Should move to the init message, like browser

    // 等待 `updateSdkMcp()` 完成，再继续print的异步流程。
    await updateSdkMcp()
    // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
    headlessProfilerCheckpoint('after_updateSdkMcp')

    // Resolve deferred plugin installation (CLAUDE_CODE_SYNC_PLUGIN_INSTALL).
    // The promise was started eagerly so installation overlaps with other init.
    // Awaiting here guarantees plugins are available before the first ask().
    // If CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS is set, races against that
    // deadline and proceeds without plugins on timeout (logging an error).
    // 满足 `pluginInstallPromise` 时，print执行该分支。
    if (pluginInstallPromise) {
      // timeoutMs 集合解析`parseInt`，供print后续处理使用。
      const timeoutMs = parseInt(
        process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS || '',
        10,
      )
      // 满足 `timeoutMs > 0` 时，print执行该分支。
      if (timeoutMs > 0) {
        // timeout保存`sleep`，供print后续处理使用。
        const timeout = sleep(timeoutMs).then(() => 'timeout' as const)
        // 结果保存`Promise.race`，供print后续处理使用。
        const result = await Promise.race([pluginInstallPromise, timeout])
        // 当 `result` 匹配 `'timeout'` 时，print执行对应分支。
        if (result === 'timeout') {
          // 记录print运行诊断，方便排查异常路径或性能问题。
          logError(
            new Error(
              `CLAUDE_CODE_SYNC_PLUGIN_INSTALL: plugin installation timed out after ${timeoutMs}ms`,
            ),
          )
          // 记录print运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_sync_plugin_install_timeout', {
            timeout_ms: timeoutMs,
          })
        }
      } else {
        // 等待 `pluginInstallPromise` 完成，再继续print的异步流程。
        await pluginInstallPromise
      }
      // pluginInstallPromise 异步任务更新为 `null`，确保CLI后续读取最新状态。
      pluginInstallPromise = null

      // Refresh commands, agents, and hooks now that plugins are installed
      // 等待 `refreshPluginState()` 完成，再继续print的异步流程。
      await refreshPluginState()

      // Set up hot-reload for plugin hooks now that the initial install is done.
      // In sync-install mode, setup.ts skips this to avoid racing with the install.
      // 从 `await import(` 解构 setupPluginHookHotReload，减少print对同一对象的重复访问。
      const { setupPluginHookHotReload } = await import(
        '../utils/plugins/loadPluginHooks.js'
      )
      // 调用 setupPluginHookHotReload，触发print此处需要的副作用。
      setupPluginHookHotReload()
    }

    // Only main-thread commands (agentId===undefined) — subagent
    // notifications are drained by the subagent's mid-turn gate in query.ts.
    // Defined outside the try block so it's accessible in the post-finally
    // queue re-checks at the bottom of run().
    // isMainThread封装成回调，供print在事件触发或异步步骤中调用。
    const isMainThread = (cmd: QueuedCommand) => cmd.agentId === undefined

    // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
    try {
      // 命令 先占位，稍后的条件分支会根据实际输入补齐它。
      let command: QueuedCommand | undefined
      // waitingForAgents 集合标记print是否启用对应路径。
      let waitingForAgents = false

      // Extract command processing into a named function for the do-while pattern.
      // Drains the queue, batching consecutive prompt-mode commands into one
      // ask() call so messages that queued up during a long turn coalesce
      // into a single follow-up turn instead of N separate turns.
      // drainCommandQueue 命令数据保存`async`，供print后续处理使用。
      const drainCommandQueue = async () => {
        // 只要 (command = dequeue(isMainThread)) 成立，就持续推进print中的循环处理。
        while ((command = dequeue(isMainThread))) {
          // print在这里进入条件判断，后续代码按实际状态分流。
          if (
            command.mode !== 'prompt' &&
            command.mode !== 'orphaned-permission' &&
            command.mode !== 'task-notification'
          ) {
            // 抛出 new Error(，阻止print在无效状态下继续运行。
            throw new Error(
              'only prompt commands are supported in streaming mode',
            )
          }

          // Non-prompt commands (task-notification, orphaned-permission) carry
          // side effects or orphanedPermission state, so they process singly.
          // Prompt commands greedily collect followers with matching workload.
          // batch 聚合成有序列表，保持后续遍历顺序稳定。
          const batch: QueuedCommand[] = [command]
          // 当 `command.mode` 匹配 `'prompt'` 时，print执行对应分支。
          if (command.mode === 'prompt') {
            // 只要 canBatchWith(command, peek(isMainThread)) 成立，就持续推进print中的循环处理。
            while (canBatchWith(command, peek(isMainThread))) {
              // batch追加新条目，保持收集顺序与输入顺序一致。
              batch.push(dequeue(isMainThread)!)
            }
            // 满足 `batch.length > 1` 时，print执行该分支。
            if (batch.length > 1) {
              // 命令更新为 `{`，确保CLI后续读取最新状态。
              command = {
                ...command,
                // 这个回调绑定到 value: joinPromptValues(batch.map(c => c.value)),，负责print在该局部场景下的响应。
                value: joinPromptValues(batch.map(c => c.value)),
                // 这个回调绑定到 uuid: batch.findLast(c => c.uuid)?.uuid ?? command.uuid,，负责print在该局部场景下的响应。
                uuid: batch.findLast(c => c.uuid)?.uuid ?? command.uuid,
              }
            }
          }
          // batchUuids 集合派生`batch.map`，供print后续处理使用。
          const batchUuids = batch.map(c => c.uuid).filter(u => u !== undefined)

          // QueryEngine will emit a replay for command.uuid (the last uuid in
          // the batch) via its messagesToAck path. Emit replays here for the
          // rest so consumers that track per-uuid delivery (clank's
          // asyncMessages footer, CCR) see an ack for every message they sent,
          // not just the one that survived the merge.
          // 组合条件 `options.replayUserMessages && batch.length > 1` 成立时，print才启用这条专门路径。
          if (options.replayUserMessages && batch.length > 1) {
            // 按顺序遍历 `batch` 中的c，逐个交给print处理。
            for (const c of batch) {
              // `c.uuid && c.uuid` 与 `command.uuid` 不一致时刷新派生状态，避免使用过期结果。
              if (c.uuid && c.uuid !== command.uuid) {
                // 调用 output.enqueue，触发print此处需要的副作用。
                output.enqueue({
                  type: 'user',
                  message: { role: 'user', content: c.value },
                  session_id: getSessionId(),
                  parent_tool_use_id: null,
                  uuid: c.uuid,
                  isReplay: true,
                } satisfies SDKUserMessageReplay)
              }
            }
          }

          // Combine all MCP clients. appState.mcp is populated incrementally
          // per-server by main.tsx (mirrors useManageMCPConnections). Reading
          // fresh per-command means late-connecting servers are visible on the
          // next turn. registerElicitationHandlers is idempotent (tracking set).
          // appState 状态读取`getAppState`，供print后续处理使用。
          const appState = getAppState()
          // allMcpClients 集合 聚合成有序列表，保持后续遍历顺序稳定。
          const allMcpClients = [
            ...appState.mcp.clients,
            ...sdkClients,
            ...dynamicMcpState.clients,
          ]
          // 调用 registerElicitationHandlers，触发print此处需要的副作用。
          registerElicitationHandlers(allMcpClients)
          // Channel handlers for servers allowlisted via --channels at
          // construction time (or enableChannel() mid-session). Runs every
          // turn like registerElicitationHandlers — idempotent per-client
          // (setNotificationHandler replaces, not stacks) and no-ops for
          // non-allowlisted servers (one feature-flag check).
          // 按顺序遍历 `allMcpClients` 中的API 客户端，逐个交给print处理。
          for (const client of allMcpClients) {
            // 调用 reregisterChannelHandlerAfterReconnect，触发print此处需要的副作用。
            reregisterChannelHandlerAfterReconnect(client)
          }

          // allTools 集合构建`buildAllTools`，供print后续处理使用。
          const allTools = buildAllTools(appState)

          // 按顺序遍历 `batchUuids` 中的uuid，逐个交给print处理。
          for (const uuid of batchUuids) {
            // 调用 notifyCommandLifecycle，触发print此处需要的副作用。
            notifyCommandLifecycle(uuid, 'started')
          }

          // Task notifications arrive when background agents complete.
          // Emit an SDK system event for SDK consumers, then fall through
          // to ask() so the model sees the agent result and can act on it.
          // This matches TUI behavior where useQueueProcessor always feeds
          // notifications to the model regardless of coordinator mode.
          // 当 `command.mode` 匹配 `'task-notification'` 时，print执行对应分支。
          if (command.mode === 'task-notification') {
            // notificationText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const notificationText =
              typeof command.value === 'string' ? command.value : ''
            // Parse the XML-formatted notification
            // taskIdMatch匹配`notificationText.match`，供print后续处理使用。
            const taskIdMatch = notificationText.match(
              /<task-id>([^<]+)<\/task-id>/,
            )
            // toolUseIdMatch匹配`notificationText.match`，供print后续处理使用。
            const toolUseIdMatch = notificationText.match(
              /<tool-use-id>([^<]+)<\/tool-use-id>/,
            )
            // outputFileMatch 文件数据匹配`notificationText.match`，供print后续处理使用。
            const outputFileMatch = notificationText.match(
              /<output-file>([^<]+)<\/output-file>/,
            )
            // statusMatch匹配`notificationText.match`，供print后续处理使用。
            const statusMatch = notificationText.match(
              /<status>([^<]+)<\/status>/,
            )
            // summaryMatch匹配`notificationText.match`，供print后续处理使用。
            const summaryMatch = notificationText.match(
              /<summary>([^<]+)<\/summary>/,
            )

            // isValidStatus 集合标记print是否启用对应路径。
            const isValidStatus = (
              s: string | undefined,
            ): s is 'completed' | 'failed' | 'stopped' | 'killed' =>
              s === 'completed' ||
              s === 'failed' ||
              s === 'stopped' ||
              s === 'killed'
            // rawStatus 集合保存`statusMatch?.[1]`，供print后续判断或输出使用。
            const rawStatus = statusMatch?.[1]
            // status 集合保存`isValidStatus`，供print后续处理使用。
            const status = isValidStatus(rawStatus)
              ? rawStatus === 'killed'
                ? 'stopped'
                : rawStatus
              : 'completed'

            // usageMatch匹配`notificationText.match`，供print后续处理使用。
            const usageMatch = notificationText.match(
              /<usage>([\s\S]*?)<\/usage>/,
            )
            // usageContent读取 `usageMatch?.[1] ?? ''` 对应条目，后续围绕该成员继续处理。
            const usageContent = usageMatch?.[1] ?? ''
            // totalTokensMatch匹配`usageContent.match`，供print后续处理使用。
            const totalTokensMatch = usageContent.match(
              /<total_tokens>(\d+)<\/total_tokens>/,
            )
            // toolUsesMatch匹配`usageContent.match`，供print后续处理使用。
            const toolUsesMatch = usageContent.match(
              /<tool_uses>(\d+)<\/tool_uses>/,
            )
            // durationMsMatch匹配`usageContent.match`，供print后续处理使用。
            const durationMsMatch = usageContent.match(
              /<duration_ms>(\d+)<\/duration_ms>/,
            )

            // Only emit a task_notification SDK event when a <status> tag is
            // present — that means this is a terminal notification (completed/
            // failed/stopped). Stream events from enqueueStreamEvent carry no
            // <status> (they're progress pings); emitting them here would
            // default to 'completed' and falsely close the task for SDK
            // consumers. Terminal bookends are now emitted directly via
            // emitTaskTerminatedSdk, so skipping statusless events is safe.
            // 满足 `statusMatch` 时，print执行该分支。
            if (statusMatch) {
              // 调用 output.enqueue，触发print此处需要的副作用。
              output.enqueue({
                type: 'system',
                subtype: 'task_notification',
                task_id: taskIdMatch?.[1] ?? '',
                tool_use_id: toolUseIdMatch?.[1],
                status,
                output_file: outputFileMatch?.[1] ?? '',
                summary: summaryMatch?.[1] ?? '',
                usage:
                  totalTokensMatch && toolUsesMatch
                    ? {
                        total_tokens: parseInt(totalTokensMatch[1]!, 10),
                        tool_uses: parseInt(toolUsesMatch[1]!, 10),
                        duration_ms: durationMsMatch
                          ? parseInt(durationMsMatch[1]!, 10)
                          : 0,
                      }
                    : undefined,
                session_id: getSessionId(),
                uuid: randomUUID(),
              })
            }
            // No continue -- fall through to ask() so the model processes the result
          }

          // 用户输入 命名 `command.value`，让后续代码直接表达这个值的用途。
          const input = command.value

          // 组合条件 `structuredIO instanceof RemoteIO && command.mode` 成立时，print才启用这条专门路径。
          if (structuredIO instanceof RemoteIO && command.mode === 'prompt') {
            // 记录print运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_bridge_message_received', {
              is_repl: false,
            })
          }

          // Abort any in-flight suggestion generation and track acceptance
          // 调用 suggestionState.abortController?.abort()，完成这一处局部操作。
          suggestionState.abortController?.abort()
          // abortController更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.abortController = null
          // pendingSuggestion更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.pendingSuggestion = null
          // pendingLastEmittedEntry更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.pendingLastEmittedEntry = null
          // 满足 `suggestionState.lastEmitted` 时，print执行该分支。
          if (suggestionState.lastEmitted) {
            // 当 `command.mode` 匹配 `'prompt'` 时，print执行对应分支。
            if (command.mode === 'prompt') {
              // SDK user messages enqueue ContentBlockParam[], not a plain string
              // inputText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
              const inputText =
                typeof input === 'string'
                  ? input
                  : (
                      // 调用 input.find，触发print此处需要的副作用。
                      input.find(b => b.type === 'text') as
                        | { type: 'text'; text: string }
                        | undefined
                    )?.text
              // 当 `typeof inputText` 匹配 `'string'` 时，print执行对应分支。
              if (typeof inputText === 'string') {
                // 调用 logSuggestionOutcome，触发print此处需要的副作用。
                logSuggestionOutcome(
                  suggestionState.lastEmitted.text,
                  inputText,
                  suggestionState.lastEmitted.emittedAt,
                  suggestionState.lastEmitted.promptId,
                  suggestionState.lastEmitted.generationRequestId,
                )
              }
              // lastEmitted更新为 `null`，确保CLI后续读取最新状态。
              suggestionState.lastEmitted = null
            }
          }

          // abortController更新为 `createAbortController()`，确保CLI后续读取最新状态。
          abortController = createAbortController()
          // turnStartTime保存`feature`，供print后续处理使用。
          const turnStartTime = feature('FILE_PERSISTENCE')
            ? Date.now()
            : undefined

          // 调用 headlessProfilerCheckpoint，触发print此处需要的副作用。
          headlessProfilerCheckpoint('before_ask')
          // 调用 startQueryProfile，触发print此处需要的副作用。
          startQueryProfile()
          // Per-iteration ALS context so bg agents spawned inside ask()
          // inherit workload across their detached awaits. In-process cron
          // stamps cmd.workload; the SDK --workload flag is options.workload.
          // const-capture: TS loses `while ((command = dequeue()))` narrowing
          // inside the closure.
          // cmd 命令数据 命名 `command`，让后续代码直接表达这个值的用途。
          const cmd = command
          // 这个回调绑定到 await runWithWorkload(cmd.workload ?? options.workload, async () => {，负责print在该局部场景下的响应。
          await runWithWorkload(cmd.workload ?? options.workload, async () => {
            // 逐项读取 `ask({` 中的消息，按输入顺序推进print。
            for await (const message of ask({
              commands: uniqBy(
                [...currentCommands, ...appState.mcp.commands],
                'name',
              ),
              prompt: input,
              promptUuid: cmd.uuid,
              isMeta: cmd.isMeta,
              cwd: cwd(),
              tools: allTools,
              verbose: options.verbose,
              mcpClients: allMcpClients,
              thinkingConfig: options.thinkingConfig,
              maxTurns: options.maxTurns,
              maxBudgetUsd: options.maxBudgetUsd,
              taskBudget: options.taskBudget,
              canUseTool,
              userSpecifiedModel: activeUserSpecifiedModel,
              fallbackModel: options.fallbackModel,
              jsonSchema: getInitJsonSchema() ?? options.jsonSchema,
              mutableMessages,
              // 这个回调绑定到 getReadFileCache: () =>，负责print在该局部场景下的响应。
              getReadFileCache: () =>
                pendingSeeds.size === 0
                  ? readFileState
                  : mergeFileStateCaches(readFileState, pendingSeeds),
              // 这个回调绑定到 setReadFileCache: cache => {，负责print在该局部场景下的响应。
              setReadFileCache: cache => {
                // readFileState 文件数据更新为 `cache`，确保CLI后续读取最新状态。
                readFileState = cache
                // 循环处理 `const [path, seed] of pendingSeeds.entries()`，让print把同类条目按顺序走完。
                for (const [path, seed] of pendingSeeds.entries()) {
                  // existing读取`readFileState.get`，供print后续处理使用。
                  const existing = readFileState.get(path)
                  // 组合条件 `!existing || seed.timestamp > existing.timestamp` 成立时，print才启用这条专门路径。
                  if (!existing || seed.timestamp > existing.timestamp) {
                    // readFileState.set 写入新的状态值，使print后续读取保持一致。
                    readFileState.set(path, seed)
                  }
                }
                // 调用 pendingSeeds.clear，触发print此处需要的副作用。
                pendingSeeds.clear()
              },
              customSystemPrompt: options.systemPrompt,
              appendSystemPrompt: options.appendSystemPrompt,
              getAppState,
              setAppState,
              abortController,
              replayUserMessages: options.replayUserMessages,
              includePartialMessages: options.includePartialMessages,
              // 这个回调绑定到 handleElicitation: (serverName, params, elicitSignal) =>，负责print在该局部场景下的响应。
              handleElicitation: (serverName, params, elicitSignal) =>
                structuredIO.handleElicitation(
                  serverName,
                  params.message,
                  undefined,
                  elicitSignal,
                  params.mode,
                  params.url,
                  'elicitationId' in params ? params.elicitationId : undefined,
                ),
              agents: currentAgents,
              orphanedPermission: cmd.orphanedPermission,
              // 这个回调绑定到 setSDKStatus: status => {，负责print在该局部场景下的响应。
              setSDKStatus: status => {
                // 调用 output.enqueue，触发print此处需要的副作用。
                output.enqueue({
                  type: 'system',
                  subtype: 'status',
                  status,
                  session_id: getSessionId(),
                  uuid: randomUUID(),
                })
              },
            })) {
              // Forward messages to bridge incrementally (mid-turn) so
              // claude.ai sees progress and the connection stays alive
              // while blocked on permission requests.
              // 调用 forwardMessagesToBridge，触发print此处需要的副作用。
              forwardMessagesToBridge()

              // 当 `message.type` 匹配 `'result'` 时，print执行对应分支。
              if (message.type === 'result') {
                // Flush pending SDK events so they appear before result on the stream.
                // 逐项读取 `drainSdkEvents()` 中的event，按输入顺序推进print。
                for (const event of drainSdkEvents()) {
                  // 调用 output.enqueue，触发print此处需要的副作用。
                  output.enqueue(event)
                }

                // Hold-back: don't emit result while background agents are running
                // currentState 状态读取`getAppState`，供print后续处理使用。
                const currentState = getAppState()
                // print在这里进入条件判断，后续代码按实际状态分流。
                if (
                  getRunningTasks(currentState).some(
                    // t更新为 `>`，确保CLI后续读取最新状态。
                    t =>
                      (t.type === 'local_agent' ||
                        t.type === 'local_workflow') &&
                      isBackgroundTask(t),
                  )
                ) {
                  // heldBackResult更新为 `message`，确保CLI后续读取最新状态。
                  heldBackResult = message
                } else {
                  // heldBackResult更新为 `null`，确保CLI后续读取最新状态。
                  heldBackResult = null
                  // 调用 output.enqueue，触发print此处需要的副作用。
                  output.enqueue(message)
                }
              } else {
                // Flush SDK events (task_started, task_progress) so background
                // agent progress is streamed in real-time, not batched until result.
                // 逐项读取 `drainSdkEvents()` 中的event，按输入顺序推进print。
                for (const event of drainSdkEvents()) {
                  // 调用 output.enqueue，触发print此处需要的副作用。
                  output.enqueue(event)
                }
                // 调用 output.enqueue，触发print此处需要的副作用。
                output.enqueue(message)
              }
            }
          }) // end runWithWorkload

          // 按顺序遍历 `batchUuids` 中的uuid，逐个交给print处理。
          for (const uuid of batchUuids) {
            // 调用 notifyCommandLifecycle，触发print此处需要的副作用。
            notifyCommandLifecycle(uuid, 'completed')
          }

          // Forward messages to bridge after each turn
          // 调用 forwardMessagesToBridge，触发print此处需要的副作用。
          forwardMessagesToBridge()
          // 调用 bridgeHandle?.sendResult()，完成这一处局部操作。
          bridgeHandle?.sendResult()

          // `feature('FILE_PERSISTENCE') && turnStartTime` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
          if (feature('FILE_PERSISTENCE') && turnStartTime !== undefined) {
            // 显式忽略 `executeFilePersistence(` 的返回值，只保留它触发的副作用。
            void executeFilePersistence(
              turnStartTime,
              abortController.signal,
              // 结果更新为 `> {`，确保CLI后续读取最新状态。
              result => {
                // 调用 output.enqueue，触发print此处需要的副作用。
                output.enqueue({
                  type: 'system' as const,
                  subtype: 'files_persisted' as const,
                  files: result.files,
                  failed: result.failed,
                  processed_at: new Date().toISOString(),
                  uuid: randomUUID(),
                  session_id: getSessionId(),
                })
              },
            )
          }

          // Generate and emit prompt suggestion for SDK consumers
          // print在这里进入条件判断，后续代码按实际状态分流。
          if (
            options.promptSuggestions &&
            !isEnvDefinedFalsy(process.env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION)
          ) {
            // TS narrows suggestionState to never in the while loop body;
            // cast via unknown to reset narrowing.
            // 状态保存`suggestionState as unknown as typeof suggestionState`，供后续判断或组装使用。
            const state = suggestionState as unknown as typeof suggestionState
            // 调用 state.abortController?.abort()，完成这一处局部操作。
            state.abortController?.abort()
            // localAbort保存`AbortController`，供print后续处理使用。
            const localAbort = new AbortController()
            // abortController更新为 `localAbort`，确保CLI后续读取最新状态。
            suggestionState.abortController = localAbort

            // cacheSafeParams 缓存读取`getLastCacheSafeParams`，供print后续处理使用。
            const cacheSafeParams = getLastCacheSafeParams()
            // cacheSafeParams 缓存缺失时提前走兜底路径，避免print继续依赖无效输入。
            if (!cacheSafeParams) {
              // 调用 logSuggestionSuppressed，触发print此处需要的副作用。
              logSuggestionSuppressed(
                'sdk_no_params',
                undefined,
                undefined,
                'sdk',
              )
            } else {
              // Use a ref object so the IIFE's finally can compare against its own
              // promise without a self-reference (which upsets TypeScript's flow analysis).
              // ref 引用 集中保存print要一起传递的字段。
              const ref: { promise: Promise<void> | null } = { promise: null }
              // promise 异步任务更新为 `(async () => {`，确保CLI后续读取最新状态。
              ref.promise = (async () => {
                // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
                try {
                  // 结果保存`tryGenerateSuggestion`，供print后续处理使用。
                  const result = await tryGenerateSuggestion(
                    localAbort,
                    mutableMessages,
                    getAppState,
                    cacheSafeParams,
                    'sdk',
                  )
                  // 组合条件 `!result || localAbort.signal.aborted` 成立时，print才启用这条专门路径。
                  if (!result || localAbort.signal.aborted) return
                  // suggestionMsg 集中保存print要一起传递的字段。
                  const suggestionMsg = {
                    type: 'prompt_suggestion' as const,
                    suggestion: result.suggestion,
                    uuid: randomUUID(),
                    session_id: getSessionId(),
                  }
                  // lastEmittedEntry 集中保存print要一起传递的字段。
                  const lastEmittedEntry = {
                    text: result.suggestion,
                    emittedAt: Date.now(),
                    promptId: result.promptId,
                    generationRequestId: result.generationRequestId,
                  }
                  // Defer emission if the result is being held for background agents,
                  // so that prompt_suggestion always arrives after result.
                  // Only set lastEmitted when the suggestion is actually delivered
                  // to the consumer; deferred suggestions may be discarded before
                  // delivery if a new command arrives first.
                  // 满足 `heldBackResult` 时，print执行该分支。
                  if (heldBackResult) {
                    // pendingSuggestion更新为 `suggestionMsg`，确保CLI后续读取最新状态。
                    suggestionState.pendingSuggestion = suggestionMsg
                    // pendingLastEmittedEntry更新为 `{`，确保CLI后续读取最新状态。
                    suggestionState.pendingLastEmittedEntry = {
                      text: lastEmittedEntry.text,
                      promptId: lastEmittedEntry.promptId,
                      generationRequestId: lastEmittedEntry.generationRequestId,
                    }
                  } else {
                    // lastEmitted更新为 `lastEmittedEntry`，确保CLI后续读取最新状态。
                    suggestionState.lastEmitted = lastEmittedEntry
                    // 调用 output.enqueue，触发print此处需要的副作用。
                    output.enqueue(suggestionMsg)
                  }
                } catch (error) {
                  // print在这里进入条件判断，后续代码按实际状态分流。
                  if (
                    error instanceof Error &&
                    (error.name === 'AbortError' ||
                      error.name === 'APIUserAbortError')
                  ) {
                    // 调用 logSuggestionSuppressed，触发print此处需要的副作用。
                    logSuggestionSuppressed(
                      'aborted',
                      undefined,
                      undefined,
                      'sdk',
                    )
                    // print在这里结束当前路径，避免继续执行不适用的后续分支。
                    return
                  }
                  // 记录print运行诊断，方便排查异常路径或性能问题。
                  logError(toError(error))
                } finally {
                  // 满足 `suggestionState.inflightPromise === ref.promise` 时，print执行该分支。
                  if (suggestionState.inflightPromise === ref.promise) {
                    // inflightPromise 异步任务更新为 `null`，确保CLI后续读取最新状态。
                    suggestionState.inflightPromise = null
                  }
                }
              })()
              // inflightPromise 异步任务更新为 `ref.promise`，确保CLI后续读取最新状态。
              suggestionState.inflightPromise = ref.promise
            }
          }

          // Log headless profiler metrics for this turn and start next turn
          // 调用 logHeadlessProfilerTurn，触发print此处需要的副作用。
          logHeadlessProfilerTurn()
          // 调用 logQueryProfileReport，触发print此处需要的副作用。
          logQueryProfileReport()
          // 调用 headlessProfilerStartTurn，触发print此处需要的副作用。
          headlessProfilerStartTurn()
        }
      }

      // Use a do-while loop to drain commands and then wait for any
      // background agents that are still running. When agents complete,
      // their notifications are enqueued and the loop re-drains.
      // 先执行一次循环体，再按尾部条件决定是否继续print处理。
      do {
        // Drain SDK events (task_started, task_progress) before command queue
        // so progress events precede task_notification on the stream.
        // 逐项读取 `drainSdkEvents()` 中的event，按输入顺序推进print。
        for (const event of drainSdkEvents()) {
          // 调用 output.enqueue，触发print此处需要的副作用。
          output.enqueue(event)
        }

        // runPhase更新为 `'draining_commands'`，确保CLI后续读取最新状态。
        runPhase = 'draining_commands'
        // 等待 `drainCommandQueue()` 完成，再继续print的异步流程。
        await drainCommandQueue()

        // Check for running background tasks before exiting.
        // Exclude in_process_teammate — teammates are long-lived by design
        // (status: 'running' for their whole lifetime, cleaned up by the
        // shutdown protocol, not by transitioning to 'completed'). Waiting
        // on them here loops forever (gh-30008). Same exclusion already
        // exists at useBackgroundTaskNavigation.ts:55 for the same reason;
        // L1839 above is already narrower (type === 'local_agent') so it
        // doesn't hit this.
        // waitingForAgents 集合更新为 `false`，确保CLI后续读取最新状态。
        waitingForAgents = false
        {
          // 状态读取`getAppState`，供print后续处理使用。
          const state = getAppState()
          // hasRunningBg记录 `getRunningTasks` 是否成立，print随后按该结果分支。
          const hasRunningBg = getRunningTasks(state).some(
            // t更新为 `> isBackgroundTask(t) && t.type !== 'in_process_teammate'`，确保CLI后续读取最新状态。
            t => isBackgroundTask(t) && t.type !== 'in_process_teammate',
          )
          // hasMainThreadQueued记录 `peek` 是否成立，print随后按该结果分支。
          const hasMainThreadQueued = peek(isMainThread) !== undefined
          // 组合条件 `hasRunningBg || hasMainThreadQueued` 成立时，print才启用这条专门路径。
          if (hasRunningBg || hasMainThreadQueued) {
            // waitingForAgents 集合更新为 `true`，确保CLI后续读取最新状态。
            waitingForAgents = true
            // hasMainThreadQueued缺失时提前走兜底路径，避免print继续依赖无效输入。
            if (!hasMainThreadQueued) {
              // runPhase更新为 `'waiting_for_agents'`，确保CLI后续读取最新状态。
              runPhase = 'waiting_for_agents'
              // No commands ready yet, wait for tasks to complete
              // 等待 `sleep(100)` 完成，再继续print的异步流程。
              await sleep(100)
            }
            // Loop back to drain any newly queued commands
          }
        }
      } while (waitingForAgents)

      // 满足 `heldBackResult` 时，print执行该分支。
      if (heldBackResult) {
        // 调用 output.enqueue，触发print此处需要的副作用。
        output.enqueue(heldBackResult)
        // heldBackResult更新为 `null`，确保CLI后续读取最新状态。
        heldBackResult = null
        // 满足 `suggestionState.pendingSuggestion` 时，print执行该分支。
        if (suggestionState.pendingSuggestion) {
          // 调用 output.enqueue，触发print此处需要的副作用。
          output.enqueue(suggestionState.pendingSuggestion)
          // Now that the suggestion is actually delivered, record it for acceptance tracking
          // 满足 `suggestionState.pendingLastEmittedEntry` 时，print执行该分支。
          if (suggestionState.pendingLastEmittedEntry) {
            // lastEmitted更新为 `{`，确保CLI后续读取最新状态。
            suggestionState.lastEmitted = {
              ...suggestionState.pendingLastEmittedEntry,
              emittedAt: Date.now(),
            }
            // pendingLastEmittedEntry更新为 `null`，确保CLI后续读取最新状态。
            suggestionState.pendingLastEmittedEntry = null
          }
          // pendingSuggestion更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.pendingSuggestion = null
        }
      }
    } catch (error) {
      // Emit error result message before shutting down
      // Write directly to structuredIO to ensure immediate delivery
      // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `structuredIO.write({` 完成，再继续print的异步流程。
        await structuredIO.write({
          type: 'result',
          subtype: 'error_during_execution',
          duration_ms: 0,
          duration_api_ms: 0,
          is_error: true,
          num_turns: 0,
          stop_reason: null,
          session_id: getSessionId(),
          total_cost_usd: 0,
          usage: EMPTY_USAGE,
          modelUsage: {},
          permission_denials: [],
          uuid: randomUUID(),
          errors: [
            errorMessage(error),
            // 链式调用 链式方法，继续加工上一行在print中产生的数据。
            ...getInMemoryErrors().map(_ => _.error),
          ],
        })
      } catch {
        // If we can't emit the error result, continue with shutdown anyway
      }
      // 调用 suggestionState.abortController?.abort()，完成这一处局部操作。
      suggestionState.abortController?.abort()
      // 调用 gracefulShutdownSync，触发print此处需要的副作用。
      gracefulShutdownSync(1)
      // print在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    } finally {
      // runPhase更新为 `'finally_flush'`，确保CLI后续读取最新状态。
      runPhase = 'finally_flush'
      // Flush pending internal events before going idle
      // 等待 `structuredIO.flushInternalEvents()` 完成，再继续print的异步流程。
      await structuredIO.flushInternalEvents()
      // runPhase更新为 `'finally_post_flush'`，确保CLI后续读取最新状态。
      runPhase = 'finally_post_flush'
      // 满足 `!isShuttingDown()` 时，print执行该分支。
      if (!isShuttingDown()) {
        // 调用 notifySessionStateChanged，触发print此处需要的副作用。
        notifySessionStateChanged('idle')
        // Drain so the idle session_state_changed SDK event (plus any
        // terminal task_notification bookends emitted during bg-agent
        // teardown) reach the output stream before we block on the next
        // command. The do-while drain above only runs while
        // waitingForAgents; once we're here the next drain would be the
        // top of the next run(), which won't come if input is idle.
        // 逐项读取 `drainSdkEvents()` 中的event，按输入顺序推进print。
        for (const event of drainSdkEvents()) {
          // 调用 output.enqueue，触发print此处需要的副作用。
          output.enqueue(event)
        }
      }
      // running更新为 `false`，确保CLI后续读取最新状态。
      running = false
      // Start idle timer when we finish processing and are waiting for input
      // 调用 idleTimeout.start，触发print此处需要的副作用。
      idleTimeout.start()
    }

    // Proactive tick: if proactive is active and queue is empty, inject a tick
    // print在这里进入条件判断，后续代码按实际状态分流。
    if (
      (feature('PROACTIVE') || feature('KAIROS')) &&
      proactiveModule?.isProactiveActive() &&
      !proactiveModule.isProactivePaused()
    ) {
      // 组合条件 `peek(isMainThread) === undefined && !inputClosed` 成立时，print才启用这条专门路径。
      if (peek(isMainThread) === undefined && !inputClosed) {
        // print在这里处理 `scheduleProactiveTick!()`，完成这一小步状态转换。
        scheduleProactiveTick!()
        // print在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }

    // Re-check the queue after releasing the mutex. A message may have
    // arrived (and called run()) between the last dequeue() returning
    // undefined and `running = false` above. In that case the caller
    // saw `running === true` and returned immediately, leaving the
    // message stranded in the queue with no one to process it.
    // `peek(isMainThread)` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (peek(isMainThread) !== undefined) {
      // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
      void run()
      // print在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Check for unread teammate messages and process them
    // This mirrors what useInboxPoller does in interactive REPL mode
    // Poll until no more messages (teammates may still be working)
    {
      // currentAppState 状态读取`getAppState`，供print后续处理使用。
      const currentAppState = getAppState()
      // teamContext保存`currentAppState.teamContext`，供print后续判断或输出使用。
      const teamContext = currentAppState.teamContext

      // 组合条件 `teamContext && isTeamLead(teamContext)` 成立时，print才启用这条专门路径。
      if (teamContext && isTeamLead(teamContext)) {
        // agentName固定为 `'team-lead'`，作为print后续展示或比较的基准。
        const agentName = 'team-lead'

        // Poll for messages while teammates are active
        // This is needed because teammates may send messages while we're waiting
        // Keep polling until the team is shut down
        // POLL_INTERVAL_MS 集合保存`500`，供后续判断或组装使用。
        const POLL_INTERVAL_MS = 500

        // while 使用 true 完成print里的对应操作。
        while (true) {
          // Check if teammates are still active
          // refreshedState 状态读取`getAppState`，供print后续处理使用。
          const refreshedState = getAppState()
          // hasActiveTeammates 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const hasActiveTeammates =
            hasActiveInProcessTeammates(refreshedState) ||
            (refreshedState.teamContext &&
              Object.keys(refreshedState.teamContext.teammates).length > 0)

          // hasActiveTeammates 集合缺失时提前走兜底路径，避免print继续依赖无效输入。
          if (!hasActiveTeammates) {
            // 记录print运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              '[print.ts] No more active teammates, stopping poll',
            )
            // 结束这个分支或循环，避免print继续落入后续路径。
            break
          }

          // unread读取`readUnreadMessages`，供print后续处理使用。
          const unread = await readUnreadMessages(
            agentName,
            refreshedState.teamContext?.teamName,
          )

          // 满足 `unread.length > 0` 时，print执行该分支。
          if (unread.length > 0) {
            // 记录print运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[print.ts] Team-lead found ${unread.length} unread messages`,
            )

            // Mark as read immediately to avoid duplicate processing
            // 等待 `markMessagesAsRead(` 完成，再继续print的异步流程。
            await markMessagesAsRead(
              agentName,
              refreshedState.teamContext?.teamName,
            )

            // Process shutdown_approved messages - remove teammates from team file
            // This mirrors what useInboxPoller does in interactive mode (lines 546-606)
            // teamName保存`refreshedState.teamContext?.teamName`，供后续判断或组装使用。
            const teamName = refreshedState.teamContext?.teamName
            // 按顺序遍历 `unread` 中的m，逐个交给print处理。
            for (const m of unread) {
              // shutdownApproval保存`isShutdownApproved`，供print后续处理使用。
              const shutdownApproval = isShutdownApproved(m.text)
              // 组合条件 `shutdownApproval && teamName` 成立时，print才启用这条专门路径。
              if (shutdownApproval && teamName) {
                // teammateToRemove保存`shutdownApproval.from`，供后续判断或组装使用。
                const teammateToRemove = shutdownApproval.from
                // 记录print运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[print.ts] Processing shutdown_approved from ${teammateToRemove}`,
                )

                // Find the teammate ID by name
                // teammateId保存`refreshedState.teamContext?.teammates`，供print后续判断或输出使用。
                const teammateId = refreshedState.teamContext?.teammates
                  ? Object.entries(refreshedState.teamContext.teammates).find(
                      // 这个回调绑定到 ([, t]) => t.name === teammateToRemove,，负责print在该局部场景下的响应。
                      ([, t]) => t.name === teammateToRemove,
                    )?.[0]
                  : undefined

                // 满足 `teammateId` 时，print执行该分支。
                if (teammateId) {
                  // Remove from team file
                  // 调用 removeTeammateFromTeamFile，触发print此处需要的副作用。
                  removeTeammateFromTeamFile(teamName, {
                    agentId: teammateId,
                    name: teammateToRemove,
                  })
                  // 记录print运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `[print.ts] Removed ${teammateToRemove} from team file`,
                  )

                  // Unassign tasks owned by this teammate
                  // 等待 `unassignTeammateTasks(` 完成，再继续print的异步流程。
                  await unassignTeammateTasks(
                    teamName,
                    teammateId,
                    teammateToRemove,
                    'shutdown',
                  )

                  // Remove from teamContext in AppState
                  // setAppState 写入新的状态值，使print后续读取保持一致。
                  setAppState(prev => {
                    // 满足 `!prev.teamContext?.teammates` 时，print执行该分支。
                    if (!prev.teamContext?.teammates) return prev
                    // 满足 `!(teammateId in prev.teamContext.teammates)` 时，print执行该分支。
                    if (!(teammateId in prev.teamContext.teammates)) return prev
                    // print先整理这一处局部数据，后续分支可以直接读取。
                    const { [teammateId]: _, ...remainingTeammates } =
                      prev.teamContext.teammates
                    // 返回结构化结果，集中表达print已经整理出的状态。
                    return {
                      ...prev,
                      teamContext: {
                        ...prev.teamContext,
                        teammates: remainingTeammates,
                      },
                    }
                  })
                }
              }
            }

            // Format messages same as useInboxPoller
            // formatted读取`unread` 整理出中间结果，供print后续步骤使用。
            const formatted = unread
              .map(
                // 这个回调绑定到 (m: { from: string; text: string; color?: string }) =>，负责print在该局部场景下的响应。
                (m: { from: string; text: string; color?: string }) =>
                  `<${TEAMMATE_MESSAGE_TAG} teammate_id="${m.from}"${m.color ? ` color="${m.color}"` : ''}>\n${m.text}\n</${TEAMMATE_MESSAGE_TAG}>`,
              )
              .join('\n\n')

            // Enqueue and process
            // 调用 enqueue，触发print此处需要的副作用。
            enqueue({
              mode: 'prompt',
              value: formatted,
              uuid: randomUUID(),
            })
            // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
            void run()
            // 返回 `// run() will come back here after processing`，作为print这次计算的结果。
            return // run() will come back here after processing
          }

          // No messages - check if we need to prompt for shutdown
          // If input is closed and teammates are active, inject shutdown prompt once
          // 组合条件 `inputClosed && !shutdownPromptInjected` 成立时，print才启用这条专门路径。
          if (inputClosed && !shutdownPromptInjected) {
            // shutdownPromptInjected更新为 `true`，确保CLI后续读取最新状态。
            shutdownPromptInjected = true
            // 记录print运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              '[print.ts] Input closed with active teammates, injecting shutdown prompt',
            )
            // 调用 enqueue，触发print此处需要的副作用。
            enqueue({
              mode: 'prompt',
              value: SHUTDOWN_TEAM_PROMPT,
              uuid: randomUUID(),
            })
            // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
            void run()
            // 返回 `// run() will come back here after processing`，作为print这次计算的结果。
            return // run() will come back here after processing
          }

          // Wait and check again
          // 等待 `sleep(POLL_INTERVAL_MS)` 完成，再继续print的异步流程。
          await sleep(POLL_INTERVAL_MS)
        }
      }
    }

    // 满足 `inputClosed` 时，print执行该分支。
    if (inputClosed) {
      // Check for active swarm that needs shutdown
      // hasActiveSwarm记录 `await` 是否成立，print随后按该结果分支。
      const hasActiveSwarm = await (async () => {
        // Wait for any working in-process team members to finish
        // currentAppState 状态读取`getAppState`，供print后续处理使用。
        const currentAppState = getAppState()
        // 满足 `hasWorkingInProcessTeammates(currentAppState)` 时，print执行该分支。
        if (hasWorkingInProcessTeammates(currentAppState)) {
          // 等待 `waitForTeammatesToBecomeIdle(setAppState, currentAppState)` 完成，再继续print的异步流程。
          await waitForTeammatesToBecomeIdle(setAppState, currentAppState)
        }

        // Re-fetch state after potential wait
        // refreshedAppState 状态读取`getAppState`，供print后续处理使用。
        const refreshedAppState = getAppState()
        // refreshedTeamContext保存`refreshedAppState.teamContext`，供print后续判断或输出使用。
        const refreshedTeamContext = refreshedAppState.teamContext
        // hasTeamMembersNotCleanedUp 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const hasTeamMembersNotCleanedUp =
          refreshedTeamContext &&
          Object.keys(refreshedTeamContext.teammates).length > 0

        // 返回 `(`，作为print这次计算的结果。
        return (
          hasTeamMembersNotCleanedUp ||
          hasActiveInProcessTeammates(refreshedAppState)
        )
      })()

      // 满足 `hasActiveSwarm` 时，print执行该分支。
      if (hasActiveSwarm) {
        // Team members are idle or pane-based - inject prompt to shut down team
        // 调用 enqueue，触发print此处需要的副作用。
        enqueue({
          mode: 'prompt',
          value: SHUTDOWN_TEAM_PROMPT,
          uuid: randomUUID(),
        })
        // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
        void run()
      } else {
        // Wait for any in-flight push suggestion before closing the output stream.
        // 满足 `suggestionState.inflightPromise` 时，print执行该分支。
        if (suggestionState.inflightPromise) {
          // 等待 `Promise.race([suggestionState.inflightPromise, sleep(5000)])` 完成，再继续print的异步流程。
          await Promise.race([suggestionState.inflightPromise, sleep(5000)])
        }
        // 调用 suggestionState.abortController?.abort()，完成这一处局部操作。
        suggestionState.abortController?.abort()
        // abortController更新为 `null`，确保CLI后续读取最新状态。
        suggestionState.abortController = null
        // 等待 `finalizePendingAsyncHooks()` 完成，再继续print的异步流程。
        await finalizePendingAsyncHooks()
        // 调用 unsubscribeSkillChanges，触发print此处需要的副作用。
        unsubscribeSkillChanges()
        // 调用 unsubscribeAuthStatus?.()，完成这一处局部操作。
        unsubscribeAuthStatus?.()
        // 调用 statusListeners.delete，触发print此处需要的副作用。
        statusListeners.delete(rateLimitListener)
        // 调用 output.done，触发print此处需要的副作用。
        output.done()
      }
    }
  }

  // Set up UDS inbox callback so the query loop is kicked off
  // when a message arrives via the UDS socket in headless mode.
  // 满足 `feature('UDS_INBOX')` 时，print执行该分支。
  if (feature('UDS_INBOX')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 从 `require('../utils/udsMessaging.js')` 解构 setOnEnqueue，减少print对同一对象的重复访问。
    const { setOnEnqueue } = require('../utils/udsMessaging.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // setOnEnqueue 写入新的状态值，使print后续读取保持一致。
    setOnEnqueue(() => {
      // inputClosed缺失时提前走兜底路径，避免print继续依赖无效输入。
      if (!inputClosed) {
        // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
        void run()
      }
    })
  }

  // Cron scheduler: runs scheduled_tasks.json tasks in SDK/-p mode.
  // Mirrors REPL's useScheduledTasks hook. Fired prompts enqueue + kick
  // off run() directly — unlike REPL, there's no queue subscriber here
  // that drains on enqueue while idle. The run() mutex makes this safe
  // during an active turn: the call no-ops and the post-run recheck at
  // the end of run() picks up the queued command.
  // cronScheduler 先占位，稍后的条件分支会根据实际输入补齐它。
  let cronScheduler: import('../utils/cronScheduler.js').CronScheduler | null =
    null
  // print在这里进入条件判断，后续代码按实际状态分流。
  if (
    feature('AGENT_TRIGGERS') &&
    cronSchedulerModule &&
    cronGate?.isKairosCronEnabled()
  ) {
    // cronScheduler更新为 `cronSchedulerModule.createCronScheduler({`，确保CLI后续读取最新状态。
    cronScheduler = cronSchedulerModule.createCronScheduler({
      // 这个回调绑定到 onFire: prompt => {，负责print在该局部场景下的响应。
      onFire: prompt => {
        // 满足 `inputClosed` 时，print执行该分支。
        if (inputClosed) return
        // 调用 enqueue，触发print此处需要的副作用。
        enqueue({
          mode: 'prompt',
          value: prompt,
          uuid: randomUUID(),
          priority: 'later',
          // System-generated — matches useScheduledTasks.ts REPL equivalent.
          // Without this, messages.ts metaProp eval is {} → prompt leaks
          // into visible transcript when cron fires mid-turn in -p mode.
          isMeta: true,
          // Threaded to cc_workload= in the billing-header attribution block
          // so the API can serve cron requests at lower QoS. drainCommandQueue
          // reads this per-iteration and hoists it into bootstrap state for
          // the ask() call.
          workload: WORKLOAD_CRON,
        })
        // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
        void run()
      },
      // 这个回调绑定到 isLoading: () => running || inputClosed,，负责print在该局部场景下的响应。
      isLoading: () => running || inputClosed,
      getJitterConfig: cronJitterConfigModule?.getCronJitterConfig,
      // 这个回调绑定到 isKilled: () => !cronGate?.isKairosCronEnabled(),，负责print在该局部场景下的响应。
      isKilled: () => !cronGate?.isKairosCronEnabled(),
    })
    // 调用 cronScheduler.start，触发print此处需要的副作用。
    cronScheduler.start()
  }

  // sendControlResponseSuccess 响应数据保存`function`，供print后续处理使用。
  const sendControlResponseSuccess = function (
    message: SDKControlRequest,
    response?: Record<string, unknown>,
  ) {
    // 调用 output.enqueue，触发print此处需要的副作用。
    output.enqueue({
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: message.request_id,
        response: response,
      },
    })
  }

  // sendControlResponseError 响应数据保存`function`，供print后续处理使用。
  const sendControlResponseError = function (
    message: SDKControlRequest,
    errorMessage: string,
  ) {
    // 调用 output.enqueue，触发print此处需要的副作用。
    output.enqueue({
      type: 'control_response',
      response: {
        subtype: 'error',
        request_id: message.request_id,
        error: errorMessage,
      },
    })
  }

  // Handle unexpected permission responses by looking up the unresolved tool
  // call in the transcript and executing it
  // handledOrphanedToolUseIds 集合构建`new Set<string>()`，供后续判断或组装使用。
  const handledOrphanedToolUseIds = new Set<string>()
  // structuredIO.setUnexpectedResponseCallback 写入新的状态值，使print后续读取保持一致。
  structuredIO.setUnexpectedResponseCallback(async message => {
    // 等待 `handleOrphanedPermissionResponse({` 完成，再继续print的异步流程。
    await handleOrphanedPermissionResponse({
      message,
      setAppState,
      handledToolUseIds: handledOrphanedToolUseIds,
      // 这个回调绑定到 onEnqueued: () => {，负责print在该局部场景下的响应。
      onEnqueued: () => {
        // The first message of a session might be the orphaned permission
        // check rather than a user prompt, so kick off the loop.
        // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
        void run()
      },
    })
  })

  // Track active OAuth flows per server so we can abort a previous flow
  // when a new mcp_authenticate request arrives for the same server.
  // activeOAuthFlows 集合构建`new Map<string, AbortController>()` 整理出中间结果，供print后续步骤使用。
  const activeOAuthFlows = new Map<string, AbortController>()
  // Track manual callback URL submit functions for active OAuth flows.
  // Used when localhost is not reachable (e.g., browser-based IDEs).
  // oauthCallbackSubmitters 集合 命名 `new Map<`，让后续代码直接表达这个值的用途。
  const oauthCallbackSubmitters = new Map<
    string,
    // 这个回调绑定到 (callbackUrl: string) => void，负责print在该局部场景下的响应。
    (callbackUrl: string) => void
  >()
  // Track servers where the manual callback was actually invoked (so the
  // automatic reconnect path knows to skip — the extension will reconnect).
  // oauthManualCallbackUsed 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const oauthManualCallbackUsed = new Set<string>()
  // Track OAuth auth-only promises so mcp_oauth_callback_url can await
  // token exchange completion. Reconnect is handled separately by the
  // extension via handleAuthDone → mcp_reconnect.
  // oauthAuthPromises 集合构建`new Map<string, Promise<void>>()` 整理出中间结果，供print后续步骤使用。
  const oauthAuthPromises = new Map<string, Promise<void>>()

  // In-flight Anthropic OAuth flow (claude_authenticate). Single-slot: a
  // second authenticate request cleans up the first. The service holds the
  // PKCE verifier + localhost listener; the promise settles after
  // installOAuthTokens — after it resolves, the in-process memoized token
  // cache is already cleared and the next API call picks up the new creds.
  // claudeOAuth 先占位，稍后的条件分支会根据实际输入补齐它。
  let claudeOAuth: {
    service: OAuthService
    flow: Promise<void>
  } | null = null

  // This is essentially spawning a parallel async task- we have two
  // running in parallel- one reading from stdin and adding to the
  // queue to be processed and another reading from the queue,
  // processing and returning the result of the generation.
  // The process is complete when the input stream completes and
  // the last generation of the queue has complete.
  // 调用 void，触发print此处需要的副作用。
  void (async () => {
    // initialized标记print是否启用对应路径。
    let initialized = false
    // 调用 logForDiagnosticsNoPII，触发print此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_message_loop_started')
    // 逐项读取 `structuredIO.structuredInput` 中的消息，按输入顺序推进print。
    for await (const message of structuredIO.structuredInput) {
      // Non-user events are handled inline (no queue). started→completed in
      // the same tick carries no information, so only fire completed.
      // control_response is reported by StructuredIO.processLine (which also
      // sees orphans that never yield here).
      // eventId 命名 `'uuid' in message ? message.uuid : undefined`，让后续代码直接表达这个值的用途。
      const eventId = 'uuid' in message ? message.uuid : undefined
      // print在这里进入条件判断，后续代码按实际状态分流。
      if (
        eventId &&
        message.type !== 'user' &&
        message.type !== 'control_response'
      ) {
        // 调用 notifyCommandLifecycle，触发print此处需要的副作用。
        notifyCommandLifecycle(eventId, 'completed')
      }

      // 当 `message.type` 匹配 `'control_request'` 时，print执行对应分支。
      if (message.type === 'control_request') {
        // 当 `message.request.subtype` 匹配 `'interrupt'` 时，print执行对应分支。
        if (message.request.subtype === 'interrupt') {
          // Track escapes for attribution (ant-only feature)
          // 满足 `feature('COMMIT_ATTRIBUTION')` 时，print执行该分支。
          if (feature('COMMIT_ATTRIBUTION')) {
            // setAppState 写入新的状态值，使print后续读取保持一致。
            setAppState(prev => ({
              ...prev,
              attribution: {
                ...prev.attribution,
                escapeCount: prev.attribution.escapeCount + 1,
              },
            }))
          }
          // 满足 `abortController` 时，print执行该分支。
          if (abortController) {
            // 触发取消信号，通知print中仍在等待的异步任务尽快停止。
            abortController.abort()
          }
          // 调用 suggestionState.abortController?.abort()，完成这一处局部操作。
          suggestionState.abortController?.abort()
          // abortController更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.abortController = null
          // lastEmitted更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.lastEmitted = null
          // pendingSuggestion更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.pendingSuggestion = null
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message)
        // print在这里处理 `} else if (message.request.subtype === 'end_session') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'end_session') {
          // 记录print运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[print.ts] end_session received, reason=${message.request.reason ?? 'unspecified'}`,
          )
          // 满足 `abortController` 时，print执行该分支。
          if (abortController) {
            // 触发取消信号，通知print中仍在等待的异步任务尽快停止。
            abortController.abort()
          }
          // 调用 suggestionState.abortController?.abort()，完成这一处局部操作。
          suggestionState.abortController?.abort()
          // abortController更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.abortController = null
          // lastEmitted更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.lastEmitted = null
          // pendingSuggestion更新为 `null`，确保CLI后续读取最新状态。
          suggestionState.pendingSuggestion = null
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message)
          // 结束这个分支或循环，避免print继续落入后续路径。
          break // exits for-await → falls through to inputClosed=true drain below
        // print在这里处理 `} else if (message.request.subtype === 'initialize') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'initialize') {
          // SDK MCP server names from the initialize message
          // Populated by both browser and ProcessTransport sessions
          // print在这里进入条件判断，后续代码按实际状态分流。
          if (
            message.request.sdkMcpServers &&
            message.request.sdkMcpServers.length > 0
          ) {
            // 按顺序遍历 `message.request.sdkMcpServers` 中的serverName，逐个交给print处理。
            for (const serverName of message.request.sdkMcpServers) {
              // Create placeholder config for SDK MCP servers
              // The actual server connection is managed by the SDK Query class
              // sdkMcpConfigs[serverName 配置更新为 `{`，确保print后续读取最新状态。
              sdkMcpConfigs[serverName] = {
                type: 'sdk',
                name: serverName,
              }
            }
          }

          // 等待 `handleInitializeRequest(` 完成，再继续print的异步流程。
          await handleInitializeRequest(
            message.request,
            message.request_id,
            initialized,
            output,
            commands,
            modelInfos,
            structuredIO,
            !!options.enableAuthStatus,
            options,
            agents,
            getAppState,
          )

          // Enable prompt suggestions in AppState when SDK consumer opts in.
          // shouldEnablePromptSuggestion() returns false for non-interactive
          // sessions, but the SDK consumer explicitly requested suggestions.
          // 满足 `message.request.promptSuggestions` 时，print执行该分支。
          if (message.request.promptSuggestions) {
            // setAppState 写入新的状态值，使print后续读取保持一致。
            setAppState(prev => {
              // 满足 `prev.promptSuggestionEnabled` 时，print执行该分支。
              if (prev.promptSuggestionEnabled) return prev
              // 返回结构化结果，集中表达print已经整理出的状态。
              return { ...prev, promptSuggestionEnabled: true }
            })
          }

          // print在这里进入条件判断，后续代码按实际状态分流。
          if (
            message.request.agentProgressSummaries &&
            getFeatureValue_CACHED_MAY_BE_STALE('tengu_slate_prism', true)
          ) {
            // setSdkAgentProgressSummariesEnabled 写入新的状态值，使print后续读取保持一致。
            setSdkAgentProgressSummariesEnabled(true)
          }

          // initialized更新为 `true`，确保CLI后续读取最新状态。
          initialized = true

          // If the auto-resume logic pre-enqueued a command, drain it now
          // that initialize has set up systemPrompt, agents, hooks, etc.
          // 满足 `hasCommandsInQueue()` 时，print执行该分支。
          if (hasCommandsInQueue()) {
            // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
            void run()
          }
        // print在这里处理 `} else if (message.request.subtype === 'set_permission_mode') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'set_permission_mode') {
          // m保存`typescript`，供print后续处理使用。
          const m = message.request // for typescript (TODO: use readonly types to avoid this)
          // setAppState 写入新的状态值，使print后续读取保持一致。
          setAppState(prev => ({
            ...prev,
            toolPermissionContext: handleSetPermissionMode(
              m,
              message.request_id,
              prev.toolPermissionContext,
              output,
            ),
            isUltraplanMode: m.ultraplan ?? prev.isUltraplanMode,
          }))
          // handleSetPermissionMode sends the control_response; the
          // notifySessionMetadataChanged that used to follow here is
          // now fired by onChangeAppState (with externalized mode name).
        // print在这里处理 `} else if (message.request.subtype === 'set_model') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'set_model') {
          // requestedModel 请求数据保存`message.request.model ?? 'default'`，供后续判断或组装使用。
          const requestedModel = message.request.model ?? 'default'
          // model 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const model =
            requestedModel === 'default'
              ? getDefaultMainLoopModel()
              : requestedModel
          // activeUserSpecifiedModel更新为 `model`，确保CLI后续读取最新状态。
          activeUserSpecifiedModel = model
          // setMainLoopModelOverride 写入新的状态值，使print后续读取保持一致。
          setMainLoopModelOverride(model)
          // 调用 notifySessionMetadataChanged，触发print此处需要的副作用。
          notifySessionMetadataChanged({ model })
          // 调用 injectModelSwitchBreadcrumbs，触发print此处需要的副作用。
          injectModelSwitchBreadcrumbs(requestedModel, model)

          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message)
        // print在这里处理 `} else if (message.request.subtype === 'set_max_thinking_tokens') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'set_max_thinking_tokens') {
          // 满足 `message.request.max_thinking_tokens === null` 时，print执行该分支。
          if (message.request.max_thinking_tokens === null) {
            // thinkingConfig 配置更新为 `undefined`，确保CLI后续读取最新状态。
            options.thinkingConfig = undefined
          // print在这里处理 `} else if (message.request.max_thinking_tokens === 0) {`，完成这一小步状态转换。
          } else if (message.request.max_thinking_tokens === 0) {
            // thinkingConfig 配置更新为 `{ type: 'disabled' }`，确保CLI后续读取最新状态。
            options.thinkingConfig = { type: 'disabled' }
          } else {
            // thinkingConfig 配置更新为 `{`，确保CLI后续读取最新状态。
            options.thinkingConfig = {
              type: 'enabled',
              budgetTokens: message.request.max_thinking_tokens,
            }
          }
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message)
        // print在这里处理 `} else if (message.request.subtype === 'mcp_status') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'mcp_status') {
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message, {
            mcpServers: buildMcpServerStatuses(),
          })
        // print在这里处理 `} else if (message.request.subtype === 'get_context_usage') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'get_context_usage') {
          // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
          try {
            // appState 状态读取`getAppState`，供print后续处理使用。
            const appState = getAppState()
            // data保存`collectContextData`，供print后续处理使用。
            const data = await collectContextData({
              messages: mutableMessages,
              getAppState,
              options: {
                mainLoopModel: getMainLoopModel(),
                tools: buildAllTools(appState),
                agentDefinitions: appState.agentDefinitions,
                customSystemPrompt: options.systemPrompt,
                appendSystemPrompt: options.appendSystemPrompt,
              },
            })
            // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
            sendControlResponseSuccess(message, { ...data })
          } catch (error) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(message, errorMessage(error))
          }
        // print在这里处理 `} else if (message.request.subtype === 'mcp_message') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'mcp_message') {
          // Handle MCP notifications from SDK servers
          // mcpRequest 请求数据保存`message.request`，供print后续判断或输出使用。
          const mcpRequest = message.request
          // sdkClient筛选`sdkClients.find`，供print后续处理使用。
          const sdkClient = sdkClients.find(
            // API 客户端更新为 `> client.name === mcpRequest.server_name`，确保CLI后续读取最新状态。
            client => client.name === mcpRequest.server_name,
          )
          // Check client exists - dynamically added SDK servers may have
          // placeholder clients with null client until updateSdkMcp() runs
          // print在这里进入条件判断，后续代码按实际状态分流。
          if (
            sdkClient &&
            sdkClient.type === 'connected' &&
            sdkClient.client?.transport?.onmessage
          ) {
            // 调用 sdkClient.client.transport.onmessage，触发print此处需要的副作用。
            sdkClient.client.transport.onmessage(mcpRequest.message)
          }
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message)
        // print在这里处理 `} else if (message.request.subtype === 'rewind_files') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'rewind_files') {
          // appState 状态读取`getAppState`，供print后续处理使用。
          const appState = getAppState()
          // 结果保存`handleRewindFiles`，供print后续处理使用。
          const result = await handleRewindFiles(
            message.request.user_message_id as UUID,
            appState,
            setAppState,
            message.request.dry_run ?? false,
          )
          // 组合条件 `result.canRewind || message.request.dry_run` 成立时，print才启用这条专门路径。
          if (result.canRewind || message.request.dry_run) {
            // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
            sendControlResponseSuccess(message, result)
          } else {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(
              message,
              result.error ?? 'Unexpected error',
            )
          }
        // print在这里处理 `} else if (message.request.subtype === 'cancel_async_message') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'cancel_async_message') {
          // targetUuid保存`message.request.message_uuid`，供print后续判断或输出使用。
          const targetUuid = message.request.message_uuid
          // removed保存`dequeueAllMatching`，供print后续处理使用。
          const removed = dequeueAllMatching(cmd => cmd.uuid === targetUuid)
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message, {
            cancelled: removed.length > 0,
          })
        // print在这里处理 `} else if (message.request.subtype === 'seed_read_state') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'seed_read_state') {
          // Client observed a Read that was later removed from context (e.g.
          // by snip), so transcript-based seeding missed it. Queued into
          // pendingSeeds; applied at the next clone-replace boundary.
          // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
          try {
            // expandPath: all other readFileState writers normalize (~, relative,
            // session cwd vs process cwd). FileEditTool looks up by expandPath'd
            // key — a verbatim client path would miss.
            // normalizedPath 路径数据保存`expandPath`，供print后续处理使用。
            const normalizedPath = expandPath(message.request.path)
            // Check disk mtime before reading content. If the file changed
            // since the client's observation, readFile would return C_current
            // but we'd store it with the client's M_observed — getChangedFiles
            // then sees disk > cache.timestamp, re-reads, diffs C_current vs
            // C_current = empty, emits no attachment, and the model is never
            // told about the C_observed → C_current change. Skipping the seed
            // makes Edit fail "file not read yet" → forces a fresh Read.
            // Math.floor matches FileReadTool and getFileModificationTime.
            // diskMtime保存`Math.floor`，供print后续处理使用。
            const diskMtime = Math.floor((await stat(normalizedPath)).mtimeMs)
            // 满足 `diskMtime <= message.request.mtime` 时，print执行该分支。
            if (diskMtime <= message.request.mtime) {
              // 原始文本读取`readFile`，供print后续处理使用。
              const raw = await readFile(normalizedPath, 'utf-8')
              // Strip BOM + normalize CRLF→LF to match readFileInRange and
              // readFileSyncWithMetadata. FileEditTool's content-compare
              // fallback (for Windows mtime bumps without content change)
              // compares against LF-normalized disk reads.
              // 文本内容保存`(`，供后续判断或组装使用。
              const content = (
                raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
              ).replaceAll('\r\n', '\n')
              // pendingSeeds.set 写入新的状态值，使print后续读取保持一致。
              pendingSeeds.set(normalizedPath, {
                content,
                timestamp: diskMtime,
                offset: undefined,
                limit: undefined,
              })
            }
          } catch {
            // ENOENT etc — skip seeding but still succeed
          }
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message)
        // print在这里处理 `} else if (message.request.subtype === 'mcp_set_servers') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'mcp_set_servers') {
          // 从 `await applyMcpServerChanges(` 解构 response、sdkServersChanged，减少print对同一对象的重复访问。
          const { response, sdkServersChanged } = await applyMcpServerChanges(
            message.request.servers,
          )
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message, response)

          // Connect SDK servers AFTER response to avoid deadlock
          // 满足 `sdkServersChanged` 时，print执行该分支。
          if (sdkServersChanged) {
            // 显式忽略 `updateSdkMcp()` 的返回值，只保留它触发的副作用。
            void updateSdkMcp()
          }
        // print在这里处理 `} else if (message.request.subtype === 'reload_plugins') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'reload_plugins') {
          // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
          try {
            // print在这里进入条件判断，后续代码按实际状态分流。
            if (
              feature('DOWNLOAD_USER_SETTINGS') &&
              (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) || getIsRemoteMode())
            ) {
              // Re-pull user settings so enabledPlugins pushed from the
              // user's local CLI take effect before the cache sweep.
              // applied读取`redownloadUserSettings`，供print后续处理使用。
              const applied = await redownloadUserSettings()
              // 满足 `applied` 时，print执行该分支。
              if (applied) {
                // 调用 settingsChangeDetector.notifyChange，触发print此处需要的副作用。
                settingsChangeDetector.notifyChange('userSettings')
              }
            }

            // r保存`refreshActivePlugins`，供print后续处理使用。
            const r = await refreshActivePlugins(setAppState)

            // sdkAgents 集合筛选`currentAgents.filter`，供print后续处理使用。
            const sdkAgents = currentAgents.filter(
              // a更新为 `> a.source === 'flagSettings'`，确保CLI后续读取最新状态。
              a => a.source === 'flagSettings',
            )
            // currentAgents 集合更新为 `[...r.agentDefinitions.allAgents, ...sdkAgents]`，确保CLI后续读取最新状态。
            currentAgents = [...r.agentDefinitions.allAgents, ...sdkAgents]

            // Reload succeeded — gather response data best-effort so a
            // read failure doesn't mask the successful state change.
            // allSettled so one failure doesn't discard the others.
            // plugins 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
            let plugins: SDKControlReloadPluginsResponse['plugins'] = []
            // 从 `await Promise.allSettled([` 按位置拆出 cmdsR、mcpR、pluginsR，让print分别处理这些返回值。
            const [cmdsR, mcpR, pluginsR] = await Promise.allSettled([
              getCommands(cwd()),
              applyPluginMcpDiff(),
              loadAllPluginsCacheOnly(),
            ])
            // 当 `cmdsR.status` 匹配 `'fulfilled'` 时，print执行对应分支。
            if (cmdsR.status === 'fulfilled') {
              // currentCommands 命令数据更新为 `cmdsR.value`，确保CLI后续读取最新状态。
              currentCommands = cmdsR.value
            } else {
              // 记录print运行诊断，方便排查异常路径或性能问题。
              logError(cmdsR.reason)
            }
            // 当 `mcpR.status` 匹配 `'rejected'` 时，print执行对应分支。
            if (mcpR.status === 'rejected') {
              // 记录print运行诊断，方便排查异常路径或性能问题。
              logError(mcpR.reason)
            }
            // 当 `pluginsR.status` 匹配 `'fulfilled'` 时，print执行对应分支。
            if (pluginsR.status === 'fulfilled') {
              // plugins 插件数据更新为 `pluginsR.value.enabled.map(p => ({`，确保CLI后续读取最新状态。
              plugins = pluginsR.value.enabled.map(p => ({
                name: p.name,
                path: p.path,
                source: p.source,
              }))
            } else {
              // 记录print运行诊断，方便排查异常路径或性能问题。
              logError(pluginsR.reason)
            }

            // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
            sendControlResponseSuccess(message, {
              commands: currentCommands
                // 链式调用 filter，继续加工上一行在print中产生的数据。
                .filter(cmd => cmd.userInvocable !== false)
                // 链式调用 map，继续加工上一行在print中产生的数据。
                .map(cmd => ({
                  name: getCommandName(cmd),
                  description: formatDescriptionWithSource(cmd),
                  argumentHint: cmd.argumentHint || '',
                })),
              // 这个回调绑定到 agents: currentAgents.map(a => ({，负责print在该局部场景下的响应。
              agents: currentAgents.map(a => ({
                name: a.agentType,
                description: a.whenToUse,
                model: a.model === 'inherit' ? undefined : a.model,
              })),
              plugins,
              mcpServers: buildMcpServerStatuses(),
              error_count: r.error_count,
            } satisfies SDKControlReloadPluginsResponse)
          } catch (error) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(message, errorMessage(error))
          }
        // print在这里处理 `} else if (message.request.subtype === 'mcp_reconnect') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'mcp_reconnect') {
          // currentAppState 状态读取`getAppState`，供print后续处理使用。
          const currentAppState = getAppState()
          // 从 `message.request` 解构 serverName，减少print对同一对象的重复访问。
          const { serverName } = message.request
          // 调用 elicitationRegistered.delete，触发print此处需要的副作用。
          elicitationRegistered.delete(serverName)
          // Config-existence gate must cover the SAME sources as the
          // operations below. SDK-injected servers (query({mcpServers:{...}}))
          // and dynamically-added servers were missing here, so
          // toggleMcpServer/reconnect returned "Server not found" even though
          // the disconnect/reconnect would have worked (gh-31339 / CC-314).
          // config 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const config =
            getMcpConfigByName(serverName) ??
            // 调用 mcpClients.find，触发print此处需要的副作用。
            mcpClients.find(c => c.name === serverName)?.config ??
            // 调用 sdkClients.find，触发print此处需要的副作用。
            sdkClients.find(c => c.name === serverName)?.config ??
            // 调用 dynamicMcpState.clients.find，触发print此处需要的副作用。
            dynamicMcpState.clients.find(c => c.name === serverName)?.config ??
            // 调用 currentAppState.mcp.clients.find，触发print此处需要的副作用。
            currentAppState.mcp.clients.find(c => c.name === serverName)
              ?.config ??
            null
          // 配置缺失时提前走兜底路径，避免print继续依赖无效输入。
          if (!config) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(message, `Server not found: ${serverName}`)
          } else {
            // 结果保存`reconnectMcpServerImpl`，供print后续处理使用。
            const result = await reconnectMcpServerImpl(serverName, config)
            // Update appState.mcp with the new client, tools, commands, and resources
            // prefix读取`getMcpPrefix`，供print后续处理使用。
            const prefix = getMcpPrefix(serverName)
            // setAppState 写入新的状态值，使print后续读取保持一致。
            setAppState(prev => ({
              ...prev,
              mcp: {
                ...prev.mcp,
                // 这个回调绑定到 clients: prev.mcp.clients.map(c =>，负责print在该局部场景下的响应。
                clients: prev.mcp.clients.map(c =>
                  c.name === serverName ? result.client : c,
                ),
                tools: [
                  // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                  ...reject(prev.mcp.tools, t => t.name?.startsWith(prefix)),
                  ...result.tools,
                ],
                commands: [
                  // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                  ...reject(prev.mcp.commands, c =>
                    commandBelongsToServer(c, serverName),
                  ),
                  ...result.commands,
                ],
                resources:
                  result.resources && result.resources.length > 0
                    ? { ...prev.mcp.resources, [serverName]: result.resources }
                    : omit(prev.mcp.resources, serverName),
              },
            }))
            // Also update dynamicMcpState so run() picks up the new tools
            // on the next turn (run() reads dynamicMcpState, not appState)
            // dynamicMcpState 状态更新为 `{`，确保CLI后续读取最新状态。
            dynamicMcpState = {
              ...dynamicMcpState,
              clients: [
                // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                ...dynamicMcpState.clients.filter(c => c.name !== serverName),
                result.client,
              ],
              tools: [
                ...dynamicMcpState.tools.filter(
                  // t更新为 `> !t.name?.startsWith(prefix)`，确保CLI后续读取最新状态。
                  t => !t.name?.startsWith(prefix),
                ),
                ...result.tools,
              ],
            }
            // 当 `result.client.type` 匹配 `'connected'` 时，print执行对应分支。
            if (result.client.type === 'connected') {
              // 调用 registerElicitationHandlers，触发print此处需要的副作用。
              registerElicitationHandlers([result.client])
              // 调用 reregisterChannelHandlerAfterReconnect，触发print此处需要的副作用。
              reregisterChannelHandlerAfterReconnect(result.client)
              // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
              sendControlResponseSuccess(message)
            } else {
              // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
              const errorMessage =
                result.client.type === 'failed'
                  ? (result.client.error ?? 'Connection failed')
                  : `Server status: ${result.client.type}`
              // 调用 sendControlResponseError，触发print此处需要的副作用。
              sendControlResponseError(message, errorMessage)
            }
          }
        // print在这里处理 `} else if (message.request.subtype === 'mcp_toggle') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'mcp_toggle') {
          // currentAppState 状态读取`getAppState`，供print后续处理使用。
          const currentAppState = getAppState()
          // 从 `message.request` 解构 serverName、enabled，减少print对同一对象的重复访问。
          const { serverName, enabled } = message.request
          // 调用 elicitationRegistered.delete，触发print此处需要的副作用。
          elicitationRegistered.delete(serverName)
          // Gate must match the client-lookup spread below (which
          // includes sdkClients and dynamicMcpState.clients). Same fix as
          // mcp_reconnect above (gh-31339 / CC-314).
          // config 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const config =
            getMcpConfigByName(serverName) ??
            // 调用 mcpClients.find，触发print此处需要的副作用。
            mcpClients.find(c => c.name === serverName)?.config ??
            // 调用 sdkClients.find，触发print此处需要的副作用。
            sdkClients.find(c => c.name === serverName)?.config ??
            // 调用 dynamicMcpState.clients.find，触发print此处需要的副作用。
            dynamicMcpState.clients.find(c => c.name === serverName)?.config ??
            // 调用 currentAppState.mcp.clients.find，触发print此处需要的副作用。
            currentAppState.mcp.clients.find(c => c.name === serverName)
              ?.config ??
            null

          // 配置缺失时提前走兜底路径，避免print继续依赖无效输入。
          if (!config) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(message, `Server not found: ${serverName}`)
          // print在这里处理 `} else if (!enabled) {`，完成这一小步状态转换。
          } else if (!enabled) {
            // Disabling: persist + disconnect (matches TUI toggleMcpServer behavior)
            // setMcpServerEnabled 写入新的状态值，使print后续读取保持一致。
            setMcpServerEnabled(serverName, false)
            // API 客户端 聚合成有序列表，保持后续遍历顺序稳定。
            const client = [
              ...mcpClients,
              ...sdkClients,
              ...dynamicMcpState.clients,
              ...currentAppState.mcp.clients,
            // 这个回调绑定到 ].find(c => c.name === serverName)，负责print在该局部场景下的响应。
            ].find(c => c.name === serverName)
            // 当 `client && client.type` 匹配 `'connected'` 时，print执行对应分支。
            if (client && client.type === 'connected') {
              // 等待 `clearServerCache(serverName, config)` 完成，再继续print的异步流程。
              await clearServerCache(serverName, config)
            }
            // Update appState.mcp to reflect disabled status and remove tools/commands/resources
            // prefix读取`getMcpPrefix`，供print后续处理使用。
            const prefix = getMcpPrefix(serverName)
            // setAppState 写入新的状态值，使print后续读取保持一致。
            setAppState(prev => ({
              ...prev,
              mcp: {
                ...prev.mcp,
                // 这个回调绑定到 clients: prev.mcp.clients.map(c =>，负责print在该局部场景下的响应。
                clients: prev.mcp.clients.map(c =>
                  c.name === serverName
                    ? { name: serverName, type: 'disabled' as const, config }
                    : c,
                ),
                // 这个回调绑定到 tools: reject(prev.mcp.tools, t => t.name?.startsWith(prefix)),，负责print在该局部场景下的响应。
                tools: reject(prev.mcp.tools, t => t.name?.startsWith(prefix)),
                // 这个回调绑定到 commands: reject(prev.mcp.commands, c =>，负责print在该局部场景下的响应。
                commands: reject(prev.mcp.commands, c =>
                  commandBelongsToServer(c, serverName),
                ),
                resources: omit(prev.mcp.resources, serverName),
              },
            }))
            // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
            sendControlResponseSuccess(message)
          } else {
            // Enabling: persist + reconnect
            // setMcpServerEnabled 写入新的状态值，使print后续读取保持一致。
            setMcpServerEnabled(serverName, true)
            // 结果保存`reconnectMcpServerImpl`，供print后续处理使用。
            const result = await reconnectMcpServerImpl(serverName, config)
            // Update appState.mcp with the new client, tools, commands, and resources
            // This ensures the LLM sees updated tools after enabling the server
            // prefix读取`getMcpPrefix`，供print后续处理使用。
            const prefix = getMcpPrefix(serverName)
            // setAppState 写入新的状态值，使print后续读取保持一致。
            setAppState(prev => ({
              ...prev,
              mcp: {
                ...prev.mcp,
                // 这个回调绑定到 clients: prev.mcp.clients.map(c =>，负责print在该局部场景下的响应。
                clients: prev.mcp.clients.map(c =>
                  c.name === serverName ? result.client : c,
                ),
                tools: [
                  // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                  ...reject(prev.mcp.tools, t => t.name?.startsWith(prefix)),
                  ...result.tools,
                ],
                commands: [
                  // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                  ...reject(prev.mcp.commands, c =>
                    commandBelongsToServer(c, serverName),
                  ),
                  ...result.commands,
                ],
                resources:
                  result.resources && result.resources.length > 0
                    ? { ...prev.mcp.resources, [serverName]: result.resources }
                    : omit(prev.mcp.resources, serverName),
              },
            }))
            // 当 `result.client.type` 匹配 `'connected'` 时，print执行对应分支。
            if (result.client.type === 'connected') {
              // 调用 registerElicitationHandlers，触发print此处需要的副作用。
              registerElicitationHandlers([result.client])
              // 调用 reregisterChannelHandlerAfterReconnect，触发print此处需要的副作用。
              reregisterChannelHandlerAfterReconnect(result.client)
              // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
              sendControlResponseSuccess(message)
            } else {
              // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
              const errorMessage =
                result.client.type === 'failed'
                  ? (result.client.error ?? 'Connection failed')
                  : `Server status: ${result.client.type}`
              // 调用 sendControlResponseError，触发print此处需要的副作用。
              sendControlResponseError(message, errorMessage)
            }
          }
        // print在这里处理 `} else if (message.request.subtype === 'channel_enable') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'channel_enable') {
          // currentAppState 状态读取`getAppState`，供print后续处理使用。
          const currentAppState = getAppState()
          // 调用 handleChannelEnable，触发print此处需要的副作用。
          handleChannelEnable(
            message.request_id,
            message.request.serverName,
            // Pool spread matches mcp_status — all three client sources.
            [
              ...currentAppState.mcp.clients,
              ...sdkClients,
              ...dynamicMcpState.clients,
            ],
            output,
          )
        // print在这里处理 `} else if (message.request.subtype === 'mcp_authenticate') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'mcp_authenticate') {
          // 从 `message.request` 解构 serverName，减少print对同一对象的重复访问。
          const { serverName } = message.request
          // currentAppState 状态读取`getAppState`，供print后续处理使用。
          const currentAppState = getAppState()
          // config 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const config =
            getMcpConfigByName(serverName) ??
            // 调用 mcpClients.find，触发print此处需要的副作用。
            mcpClients.find(c => c.name === serverName)?.config ??
            // 调用 currentAppState.mcp.clients.find，触发print此处需要的副作用。
            currentAppState.mcp.clients.find(c => c.name === serverName)
              ?.config ??
            null
          // 配置缺失时提前走兜底路径，避免print继续依赖无效输入。
          if (!config) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(message, `Server not found: ${serverName}`)
          // print在这里处理 `} else if (config.type !== 'sse' && config.type !== 'http') {`，完成这一小步状态转换。
          } else if (config.type !== 'sse' && config.type !== 'http') {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(
              message,
              `Server type "${config.type}" does not support OAuth authentication`,
            )
          } else {
            // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
            try {
              // Abort any previous in-flight OAuth flow for this server
              // 调用 activeOAuthFlows.get，触发print此处需要的副作用。
              activeOAuthFlows.get(serverName)?.abort()
              // controller保存`AbortController`，供print后续处理使用。
              const controller = new AbortController()
              // activeOAuthFlows.set 写入新的状态值，使print后续读取保持一致。
              activeOAuthFlows.set(serverName, controller)

              // Capture the auth URL from the callback
              // 这个回调绑定到 let resolveAuthUrl: (url: string) => void，负责print在该局部场景下的响应。
              let resolveAuthUrl: (url: string) => void
              // authUrlPromise 异步任务封装成回调，供print在事件触发或异步步骤中调用。
              const authUrlPromise = new Promise<string>(resolve => {
                // resolveAuthUrl更新为 `resolve`，确保CLI后续读取最新状态。
                resolveAuthUrl = resolve
              })

              // Start the OAuth flow in the background
              // oauthPromise 异步任务保存 `performMCPOAuthFlow` 启动的异步任务，稍后再决定等待还是后台完成。
              const oauthPromise = performMCPOAuthFlow(
                serverName,
                config,
                // URL更新为 `> resolveAuthUrl!(url)`，确保CLI后续读取最新状态。
                url => resolveAuthUrl!(url),
                controller.signal,
                {
                  skipBrowserOpen: true,
                  // 这个回调绑定到 onWaitingForCallback: submit => {，负责print在该局部场景下的响应。
                  onWaitingForCallback: submit => {
                    // oauthCallbackSubmitters.set 写入新的状态值，使print后续读取保持一致。
                    oauthCallbackSubmitters.set(serverName, submit)
                  },
                },
              )

              // Wait for the auth URL (or the flow to complete without needing redirect)
              // authUrl保存`Promise.race`，供print后续处理使用。
              const authUrl = await Promise.race([
                authUrlPromise,
                // 调用 oauthPromise.then，触发print此处需要的副作用。
                oauthPromise.then(() => null as string | null),
              ])

              // 满足 `authUrl` 时，print执行该分支。
              if (authUrl) {
                // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
                sendControlResponseSuccess(message, {
                  authUrl,
                  requiresUserAction: true,
                })
              } else {
                // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
                sendControlResponseSuccess(message, {
                  requiresUserAction: false,
                })
              }

              // Store auth-only promise for mcp_oauth_callback_url handler.
              // Don't swallow errors — the callback handler needs to detect
              // auth failures and report them to the caller.
              // oauthAuthPromises.set 写入新的状态值，使print后续读取保持一致。
              oauthAuthPromises.set(serverName, oauthPromise)

              // Handle background completion — reconnect after auth.
              // When manual callback is used, skip the reconnect here;
              // the extension's handleAuthDone → mcp_reconnect handles it
              // (which also updates dynamicMcpState for tool registration).
              // fullFlowPromise 异步任务保存`oauthPromise`，供后续判断或组装使用。
              const fullFlowPromise = oauthPromise
                // 链式调用 then，继续加工上一行在print中产生的数据。
                .then(async () => {
                  // Don't reconnect if the server was disabled during the OAuth flow
                  // 满足 `isMcpServerDisabled(serverName)` 时，print执行该分支。
                  if (isMcpServerDisabled(serverName)) {
                    // print在这里结束当前路径，避免继续执行不适用的后续分支。
                    return
                  }
                  // Skip reconnect if the manual callback path was used —
                  // handleAuthDone will do it via mcp_reconnect (which
                  // updates dynamicMcpState for tool registration).
                  // 满足 `oauthManualCallbackUsed.has(serverName)` 时，print执行该分支。
                  if (oauthManualCallbackUsed.has(serverName)) {
                    // print在这里结束当前路径，避免继续执行不适用的后续分支。
                    return
                  }
                  // Reconnect the server after successful auth
                  // 结果保存`reconnectMcpServerImpl`，供print后续处理使用。
                  const result = await reconnectMcpServerImpl(
                    serverName,
                    config,
                  )
                  // prefix读取`getMcpPrefix`，供print后续处理使用。
                  const prefix = getMcpPrefix(serverName)
                  // setAppState 写入新的状态值，使print后续读取保持一致。
                  setAppState(prev => ({
                    ...prev,
                    mcp: {
                      ...prev.mcp,
                      // 这个回调绑定到 clients: prev.mcp.clients.map(c =>，负责print在该局部场景下的响应。
                      clients: prev.mcp.clients.map(c =>
                        c.name === serverName ? result.client : c,
                      ),
                      tools: [
                        // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                        ...reject(prev.mcp.tools, t =>
                          t.name?.startsWith(prefix),
                        ),
                        ...result.tools,
                      ],
                      commands: [
                        // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                        ...reject(prev.mcp.commands, c =>
                          commandBelongsToServer(c, serverName),
                        ),
                        ...result.commands,
                      ],
                      resources:
                        result.resources && result.resources.length > 0
                          ? {
                              ...prev.mcp.resources,
                              [serverName]: result.resources,
                            }
                          : omit(prev.mcp.resources, serverName),
                    },
                  }))
                  // Also update dynamicMcpState so run() picks up the new tools
                  // on the next turn (run() reads dynamicMcpState, not appState)
                  // dynamicMcpState 状态更新为 `{`，确保CLI后续读取最新状态。
                  dynamicMcpState = {
                    ...dynamicMcpState,
                    clients: [
                      ...dynamicMcpState.clients.filter(
                        // c更新为 `> c.name !== serverName`，确保CLI后续读取最新状态。
                        c => c.name !== serverName,
                      ),
                      result.client,
                    ],
                    tools: [
                      ...dynamicMcpState.tools.filter(
                        // t更新为 `> !t.name?.startsWith(prefix)`，确保CLI后续读取最新状态。
                        t => !t.name?.startsWith(prefix),
                      ),
                      ...result.tools,
                    ],
                  }
                })
                // 链式调用 catch，继续加工上一行在print中产生的数据。
                .catch(error => {
                  // 记录print运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `MCP OAuth failed for ${serverName}: ${error}`,
                    { level: 'error' },
                  )
                })
                // 链式调用 finally，继续加工上一行在print中产生的数据。
                .finally(() => {
                  // Clean up only if this is still the active flow
                  // 满足 `activeOAuthFlows.get(serverName) === controller` 时，print执行该分支。
                  if (activeOAuthFlows.get(serverName) === controller) {
                    // 调用 activeOAuthFlows.delete，触发print此处需要的副作用。
                    activeOAuthFlows.delete(serverName)
                    // 调用 oauthCallbackSubmitters.delete，触发print此处需要的副作用。
                    oauthCallbackSubmitters.delete(serverName)
                    // 调用 oauthManualCallbackUsed.delete，触发print此处需要的副作用。
                    oauthManualCallbackUsed.delete(serverName)
                    // 调用 oauthAuthPromises.delete，触发print此处需要的副作用。
                    oauthAuthPromises.delete(serverName)
                  }
                })
              // 显式忽略 `fullFlowPromise` 的返回值，只保留它触发的副作用。
              void fullFlowPromise
            } catch (error) {
              // 调用 sendControlResponseError，触发print此处需要的副作用。
              sendControlResponseError(message, errorMessage(error))
            }
          }
        // print在这里处理 `} else if (message.request.subtype === 'mcp_oauth_callback_url') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'mcp_oauth_callback_url') {
          // 从 `message.request` 解构 serverName、callbackUrl，减少print对同一对象的重复访问。
          const { serverName, callbackUrl } = message.request
          // submit读取`oauthCallbackSubmitters.get`，供print后续处理使用。
          const submit = oauthCallbackSubmitters.get(serverName)
          // 满足 `submit` 时，print执行该分支。
          if (submit) {
            // Validate the callback URL before submitting. The submit
            // callback in auth.ts silently ignores URLs missing a code
            // param, which would leave the auth promise unresolved and
            // block the control message loop until timeout.
            // hasCodeOrError 错误信息标记print是否启用对应路径。
            let hasCodeOrError = false
            // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
            try {
              // 解析结果保存`URL`，供print后续处理使用。
              const parsed = new URL(callbackUrl)
              // print在这里处理 `hasCodeOrError =`，完成这一小步状态转换。
              hasCodeOrError =
                parsed.searchParams.has('code') ||
                parsed.searchParams.has('error')
            } catch {
              // Invalid URL
            }
            // hasCodeOrError 错误信息缺失时提前走兜底路径，避免print继续依赖无效输入。
            if (!hasCodeOrError) {
              // 调用 sendControlResponseError，触发print此处需要的副作用。
              sendControlResponseError(
                message,
                'Invalid callback URL: missing authorization code. Please paste the full redirect URL including the code parameter.',
              )
            } else {
              // 调用 oauthManualCallbackUsed.add，触发print此处需要的副作用。
              oauthManualCallbackUsed.add(serverName)
              // 调用 submit，触发print此处需要的副作用。
              submit(callbackUrl)
              // Wait for auth (token exchange) to complete before responding.
              // Reconnect is handled by the extension via handleAuthDone →
              // mcp_reconnect (which updates dynamicMcpState for tools).
              // authPromise 异步任务保存 `oauthAuthPromises.get` 启动的异步任务，稍后再决定等待还是后台完成。
              const authPromise = oauthAuthPromises.get(serverName)
              // 满足 `authPromise` 时，print执行该分支。
              if (authPromise) {
                // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
                try {
                  // 等待 `authPromise` 完成，再继续print的异步流程。
                  await authPromise
                  // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
                  sendControlResponseSuccess(message)
                } catch (error) {
                  // 调用 sendControlResponseError，触发print此处需要的副作用。
                  sendControlResponseError(
                    message,
                    error instanceof Error
                      ? error.message
                      : 'OAuth authentication failed',
                  )
                }
              } else {
                // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
                sendControlResponseSuccess(message)
              }
            }
          } else {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(
              message,
              `No active OAuth flow for server: ${serverName}`,
            )
          }
        // print在这里处理 `} else if (message.request.subtype === 'claude_authenticate') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'claude_authenticate') {
          // Anthropic OAuth over the control channel. The SDK client owns
          // the user's browser (we're headless in -p mode); we hand back
          // both URLs and wait. Automatic URL → localhost listener catches
          // the redirect if the browser is on this host; manual URL → the
          // success page shows "code#state" for claude_oauth_callback.
          // 从 `message.request` 解构 loginWithClaudeAi，减少print对同一对象的重复访问。
          const { loginWithClaudeAi } = message.request

          // Clean up any prior flow. cleanup() closes the localhost listener
          // and nulls the manual resolver. The prior `flow` promise is left
          // pending (AuthCodeListener.close() does not reject) but its object
          // graph becomes unreachable once the server handle is released and
          // is GC'd — no fd or port is held.
          // 调用 claudeOAuth?.service.cleanup()，完成这一处局部操作。
          claudeOAuth?.service.cleanup()

          // 记录print运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_oauth_flow_start', {
            loginWithClaudeAi: loginWithClaudeAi ?? true,
          })

          // service保存`OAuthService`，供print后续处理使用。
          const service = new OAuthService()
          // print先整理这一处局部数据，后续分支可以直接读取。
          let urlResolver!: (urls: {
            manualUrl: string
            automaticUrl: string
          }) => void
          // urlPromise 异步任务构建`new Promise<{` 整理出中间结果，供print后续步骤使用。
          const urlPromise = new Promise<{
            manualUrl: string
            automaticUrl: string
          // 这个回调绑定到 }>(resolve => {，负责print在该局部场景下的响应。
          }>(resolve => {
            // urlResolver更新为 `resolve`，确保CLI后续读取最新状态。
            urlResolver = resolve
          })

          // flow保存`service`，供print后续判断或输出使用。
          const flow = service
            .startOAuthFlow(
              // 调用 async，触发print此处需要的副作用。
              async (manualUrl, automaticUrl) => {
                // automaticUrl is always defined when skipBrowserOpen is set;
                // the signature is optional only for the existing single-arg callers.
                // 调用 urlResolver，触发print此处需要的副作用。
                urlResolver({ manualUrl, automaticUrl: automaticUrl! })
              },
              {
                loginWithClaudeAi: loginWithClaudeAi ?? true,
                skipBrowserOpen: true,
              },
            )
            // 链式调用 then，继续加工上一行在print中产生的数据。
            .then(async tokens => {
              // installOAuthTokens: performLogout (clear stale state) →
              // store profile → saveOAuthTokensIfNeeded → clearOAuthTokenCache
              // → clearAuthRelatedCaches. After this resolves, the memoized
              // getClaudeAIOAuthTokens in this process is invalidated; the
              // next API call re-reads keychain/file and works. No respawn.
              // 等待 `installOAuthTokens(tokens)` 完成，再继续print的异步流程。
              await installOAuthTokens(tokens)
              // 记录print运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_oauth_success', {
                loginWithClaudeAi: loginWithClaudeAi ?? true,
              })
            })
            // 链式调用 finally，继续加工上一行在print中产生的数据。
            .finally(() => {
              // 调用 service.cleanup，触发print此处需要的副作用。
              service.cleanup()
              // 满足 `claudeOAuth?.service === service` 时，print执行该分支。
              if (claudeOAuth?.service === service) {
                // claudeOAuth更新为 `null`，确保CLI后续读取最新状态。
                claudeOAuth = null
              }
            })

          // claudeOAuth更新为 `{ service, flow }`，确保CLI后续读取最新状态。
          claudeOAuth = { service, flow }

          // Attach the rejection handler before awaiting so a synchronous
          // startOAuthFlow failure doesn't surface as an unhandled rejection.
          // The claude_oauth_callback handler re-awaits flow for the manual
          // path and surfaces the real error to the client.
          // 这个回调绑定到 void flow.catch(err =>，负责print在该局部场景下的响应。
          void flow.catch(err =>
            logForDebugging(`claude_authenticate flow ended: ${err}`, {
              level: 'info',
            }),
          )

          // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
          try {
            // Race against flow: if startOAuthFlow rejects before calling
            // the authURLHandler (e.g. AuthCodeListener.start() fails with
            // EACCES or fd exhaustion), urlPromise would pend forever and
            // wedge the stdin loop. flow resolving first is unreachable in
            // practice (it's suspended on the same urls we're waiting for).
            // 从 `await Promise.race([` 解构 manualUrl、automaticUrl，减少print对同一对象的重复访问。
            const { manualUrl, automaticUrl } = await Promise.race([
              urlPromise,
              // 调用 flow.then，触发print此处需要的副作用。
              flow.then(() => {
                // 抛出 new Error(，阻止print在无效状态下继续运行。
                throw new Error(
                  'OAuth flow completed without producing auth URLs',
                )
              }),
            ])
            // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
            sendControlResponseSuccess(message, {
              manualUrl,
              automaticUrl,
            })
          } catch (error) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(message, errorMessage(error))
          }
        // print在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          message.request.subtype === 'claude_oauth_callback' ||
          message.request.subtype === 'claude_oauth_wait_for_completion'
        ) {
          // claudeOAuth缺失时提前走兜底路径，避免print继续依赖无效输入。
          if (!claudeOAuth) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(
              message,
              'No active claude_authenticate flow',
            )
          } else {
            // Inject the manual code synchronously — must happen in stdin
            // message order so a subsequent claude_authenticate doesn't
            // replace the service before this code lands.
            // 满足 `message.request.subtype === 'claude_oauth_callbac` 时，print执行该分支。
            if (message.request.subtype === 'claude_oauth_callback') {
              // 调用 claudeOAuth.service.handleManualAuthCodeInput，触发print此处需要的副作用。
              claudeOAuth.service.handleManualAuthCodeInput({
                authorizationCode: message.request.authorizationCode,
                state: message.request.state,
              })
            }
            // Detach the await — the stdin reader is serial and blocking
            // here deadlocks claude_oauth_wait_for_completion: flow may
            // only resolve via a future claude_oauth_callback on stdin,
            // which can't be read while we're parked. Capture the binding;
            // claudeOAuth is nulled in flow's own .finally.
            // 从 `claudeOAuth` 解构 flow，减少print对同一对象的重复访问。
            const { flow } = claudeOAuth
            // 显式忽略 `flow.then(` 的返回值，只保留它触发的副作用。
            void flow.then(
              // 这个回调绑定到 () => {，负责print在该局部场景下的响应。
              () => {
                // accountInfo 数量格式化`getAccountInformation`，供print后续处理使用。
                const accountInfo = getAccountInformation()
                // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
                sendControlResponseSuccess(message, {
                  account: {
                    email: accountInfo?.email,
                    organization: accountInfo?.organization,
                    subscriptionType: accountInfo?.subscription,
                    tokenSource: accountInfo?.tokenSource,
                    apiKeySource: accountInfo?.apiKeySource,
                    apiProvider: getAPIProvider(),
                  },
                })
              },
              // 这个回调绑定到 (error: unknown) =>，负责print在该局部场景下的响应。
              (error: unknown) =>
                sendControlResponseError(message, errorMessage(error)),
            )
          }
        // print在这里处理 `} else if (message.request.subtype === 'mcp_clear_auth') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'mcp_clear_auth') {
          // 从 `message.request` 解构 serverName，减少print对同一对象的重复访问。
          const { serverName } = message.request
          // currentAppState 状态读取`getAppState`，供print后续处理使用。
          const currentAppState = getAppState()
          // config 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const config =
            getMcpConfigByName(serverName) ??
            // 调用 mcpClients.find，触发print此处需要的副作用。
            mcpClients.find(c => c.name === serverName)?.config ??
            // 调用 currentAppState.mcp.clients.find，触发print此处需要的副作用。
            currentAppState.mcp.clients.find(c => c.name === serverName)
              ?.config ??
            null
          // 配置缺失时提前走兜底路径，避免print继续依赖无效输入。
          if (!config) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(message, `Server not found: ${serverName}`)
          // print在这里处理 `} else if (config.type !== 'sse' && config.type !== 'http') {`，完成这一小步状态转换。
          } else if (config.type !== 'sse' && config.type !== 'http') {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(
              message,
              `Cannot clear auth for server type "${config.type}"`,
            )
          } else {
            // 等待 `revokeServerTokens(serverName, config)` 完成，再继续print的异步流程。
            await revokeServerTokens(serverName, config)
            // 结果保存`reconnectMcpServerImpl`，供print后续处理使用。
            const result = await reconnectMcpServerImpl(serverName, config)
            // prefix读取`getMcpPrefix`，供print后续处理使用。
            const prefix = getMcpPrefix(serverName)
            // setAppState 写入新的状态值，使print后续读取保持一致。
            setAppState(prev => ({
              ...prev,
              mcp: {
                ...prev.mcp,
                // 这个回调绑定到 clients: prev.mcp.clients.map(c =>，负责print在该局部场景下的响应。
                clients: prev.mcp.clients.map(c =>
                  c.name === serverName ? result.client : c,
                ),
                tools: [
                  // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                  ...reject(prev.mcp.tools, t => t.name?.startsWith(prefix)),
                  ...result.tools,
                ],
                commands: [
                  // 链式调用 链式方法，继续加工上一行在print中产生的数据。
                  ...reject(prev.mcp.commands, c =>
                    commandBelongsToServer(c, serverName),
                  ),
                  ...result.commands,
                ],
                resources:
                  result.resources && result.resources.length > 0
                    ? {
                        ...prev.mcp.resources,
                        [serverName]: result.resources,
                      }
                    : omit(prev.mcp.resources, serverName),
              },
            }))
            // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
            sendControlResponseSuccess(message, {})
          }
        // print在这里处理 `} else if (message.request.subtype === 'apply_flag_settings') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'apply_flag_settings') {
          // Snapshot the current model before applying — we need to detect
          // model switches so we can inject breadcrumbs and notify listeners.
          // prevModel读取`getMainLoopModel`，供print后续处理使用。
          const prevModel = getMainLoopModel()

          // Merge the provided settings into the in-memory flag settings
          // existing读取`getFlagSettingsInline`，供print后续处理使用。
          const existing = getFlagSettingsInline() ?? {}
          // incoming保存`message.request.settings`，供后续判断或组装使用。
          const incoming = message.request.settings
          // Shallow-merge top-level keys; getSettingsForSource handles
          // the deep merge with file-based flag settings via mergeWith.
          // JSON serialization drops `undefined`, so callers use `null`
          // to signal "clear this key". Convert nulls to deletions so
          // SettingsSchema().safeParse() doesn't reject the whole object
          // (z.string().optional() accepts string | undefined, not null).
          // merged 集中保存print要一起传递的字段。
          const merged = { ...existing, ...incoming }
          // 逐项读取 `Object.keys(merged)` 中的key，按输入顺序推进print。
          for (const key of Object.keys(merged)) {
            // 满足 `merged[key as keyof typeof merged] === null` 时，print执行该分支。
            if (merged[key as keyof typeof merged] === null) {
              // print在这里处理 `delete merged[key as keyof typeof merged]`，完成这一小步状态转换。
              delete merged[key as keyof typeof merged]
            }
          }
          // setFlagSettingsInline 写入新的状态值，使print后续读取保持一致。
          setFlagSettingsInline(merged)
          // Route through notifyChange so fanOut() resets the settings cache
          // before listeners run. The subscriber at :392 calls
          // applySettingsChange for us. Pre-#20625 this was a direct
          // applySettingsChange() call that relied on its own internal reset —
          // now that the reset is centralized in fanOut, a direct call here
          // would read stale cached settings and silently drop the update.
          // Bonus: going through notifyChange also tells the other subscribers
          // (loadPluginHooks, sandbox-adapter) about the change, which the
          // previous direct call skipped.
          // 调用 settingsChangeDetector.notifyChange，触发print此处需要的副作用。
          settingsChangeDetector.notifyChange('flagSettings')

          // If the incoming settings include a model change, update the
          // override so getMainLoopModel() reflects it. The override has
          // higher priority than the settings cascade in
          // getUserSpecifiedModelSetting(), so without this update,
          // getMainLoopModel() returns the stale override and the model
          // change is silently ignored (matching set_model at :2811).
          // 满足 `'model' in incoming` 时，print执行该分支。
          if ('model' in incoming) {
            // 满足 `incoming.model != null` 时，print执行该分支。
            if (incoming.model != null) {
              // setMainLoopModelOverride 写入新的状态值，使print后续读取保持一致。
              setMainLoopModelOverride(String(incoming.model))
            } else {
              // setMainLoopModelOverride 写入新的状态值，使print后续读取保持一致。
              setMainLoopModelOverride(undefined)
            }
          }

          // If the model changed, inject breadcrumbs so the model sees the
          // mid-conversation switch, and notify metadata listeners (CCR).
          // newModel读取`getMainLoopModel`，供print后续处理使用。
          const newModel = getMainLoopModel()
          // `newModel` 与 `prevModel` 不一致时刷新派生状态，避免使用过期结果。
          if (newModel !== prevModel) {
            // activeUserSpecifiedModel更新为 `newModel`，确保CLI后续读取最新状态。
            activeUserSpecifiedModel = newModel
            // modelArg保存`String`，供print后续处理使用。
            const modelArg = incoming.model ? String(incoming.model) : 'default'
            // 调用 notifySessionMetadataChanged，触发print此处需要的副作用。
            notifySessionMetadataChanged({ model: newModel })
            // 调用 injectModelSwitchBreadcrumbs，触发print此处需要的副作用。
            injectModelSwitchBreadcrumbs(modelArg, newModel)
          }

          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message)
        // print在这里处理 `} else if (message.request.subtype === 'get_settings') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'get_settings') {
          // currentAppState 状态读取`getAppState`，供print后续处理使用。
          const currentAppState = getAppState()
          // 模型名称读取`getMainLoopModel`，供print后续处理使用。
          const model = getMainLoopModel()
          // modelSupportsEffort gate matches claude.ts — applied.effort must
          // mirror what actually goes to the API, not just what's configured.
          // effort保存`modelSupportsEffort`，供print后续处理使用。
          const effort = modelSupportsEffort(model)
            ? resolveAppliedEffort(model, currentAppState.effortValue)
            : undefined
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message, {
            ...getSettingsWithSources(),
            applied: {
              model,
              // Numeric effort (ant-only) → null; SDK schema is string-level only.
              effort: typeof effort === 'string' ? effort : null,
            },
          })
        // print在这里处理 `} else if (message.request.subtype === 'stop_task') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'stop_task') {
          // 从 `message.request` 解构 task_id，减少print对同一对象的重复访问。
          const { task_id: taskId } = message.request
          // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `stopTask(taskId, {` 完成，再继续print的异步流程。
            await stopTask(taskId, {
              getAppState,
              setAppState,
            })
            // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
            sendControlResponseSuccess(message, {})
          } catch (error) {
            // 调用 sendControlResponseError，触发print此处需要的副作用。
            sendControlResponseError(message, errorMessage(error))
          }
        // print在这里处理 `} else if (message.request.subtype === 'generate_session_title') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'generate_session_title') {
          // Fire-and-forget so the Haiku call does not block the stdin loop
          // (which would delay processing of subsequent user messages /
          // interrupts for the duration of the API roundtrip).
          // 从 `message.request` 解构 description、persist，减少print对同一对象的重复访问。
          const { description, persist } = message.request
          // Reuse the live controller only if it has not already been aborted
          // (e.g. by interrupt()); an aborted signal would cause queryHaiku to
          // immediately throw APIUserAbortError → {title: null}.
          // titleSignal 标题保存`(`，供print后续判断或输出使用。
          const titleSignal = (
            abortController && !abortController.signal.aborted
              ? abortController
              : createAbortController()
          ).signal
          // 调用 void，触发print此处需要的副作用。
          void (async () => {
            // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
            try {
              // title 标题保存`generateSessionTitle`，供print后续处理使用。
              const title = await generateSessionTitle(description, titleSignal)
              // 组合条件 `title && persist` 成立时，print才启用这条专门路径。
              if (title && persist) {
                // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
                try {
                  // 调用 saveAiGeneratedTitle，触发print此处需要的副作用。
                  saveAiGeneratedTitle(getSessionId() as UUID, title)
                } catch (e) {
                  // 记录print运行诊断，方便排查异常路径或性能问题。
                  logError(e)
                }
              }
              // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
              sendControlResponseSuccess(message, { title })
            } catch (e) {
              // Unreachable in practice — generateSessionTitle wraps its
              // own body and returns null, saveAiGeneratedTitle is wrapped
              // above. Propagate (not swallow) so unexpected failures are
              // visible to the SDK caller (hostComms.ts catches and logs).
              // 调用 sendControlResponseError，触发print此处需要的副作用。
              sendControlResponseError(message, errorMessage(e))
            }
          })()
        // print在这里处理 `} else if (message.request.subtype === 'side_question') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'side_question') {
          // Same fire-and-forget pattern as generate_session_title above —
          // the forked agent's API roundtrip must not block the stdin loop.
          //
          // The snapshot captured by stopHooks (for querySource === 'sdk')
          // holds the exact systemPrompt/userContext/systemContext/messages
          // sent on the last main-thread turn. Reusing them gives a byte-
          // identical prefix → prompt cache hit.
          //
          // Fallback (resume before first turn completes — no snapshot yet):
          // rebuild from scratch. buildSideQuestionFallbackParams mirrors
          // QueryEngine.ts:ask()'s system prompt assembly (including
          // --system-prompt / --append-system-prompt) so the rebuilt prefix
          // matches in the common case. May still miss the cache for
          // coordinator mode or memory-mechanics extras — acceptable, the
          // alternative is the side question failing entirely.
          // 从 `message.request` 解构 question，减少print对同一对象的重复访问。
          const { question } = message.request
          // 调用 void，触发print此处需要的副作用。
          void (async () => {
            // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
            try {
              // saved读取`getLastCacheSafeParams`，供print后续处理使用。
              const saved = getLastCacheSafeParams()
              // cacheSafeParams 缓存保存`saved`，供后续判断或组装使用。
              const cacheSafeParams = saved
                ? {
                    ...saved,
                    // If the last turn was interrupted, the snapshot holds an
                    // already-aborted controller; createChildAbortController in
                    // createSubagentContext would propagate it and the fork
                    // would die before sending a request. The controller is
                    // not part of the cache key — swapping in a fresh one is
                    // safe. Same guard as generate_session_title above.
                    toolUseContext: {
                      ...saved.toolUseContext,
                      abortController: createAbortController(),
                    },
                  }
                : await buildSideQuestionFallbackParams({
                    tools: buildAllTools(getAppState()),
                    commands: currentCommands,
                    mcpClients: [
                      ...getAppState().mcp.clients,
                      ...sdkClients,
                      ...dynamicMcpState.clients,
                    ],
                    messages: mutableMessages,
                    readFileState,
                    getAppState,
                    setAppState,
                    customSystemPrompt: options.systemPrompt,
                    appendSystemPrompt: options.appendSystemPrompt,
                    thinkingConfig: options.thinkingConfig,
                    agents: currentAgents,
                  })
              // 结果保存`runSideQuestion`，供print后续处理使用。
              const result = await runSideQuestion({
                question,
                cacheSafeParams,
              })
              // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
              sendControlResponseSuccess(message, { response: result.response })
            } catch (e) {
              // 调用 sendControlResponseError，触发print此处需要的副作用。
              sendControlResponseError(message, errorMessage(e))
            }
          })()
        // print在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          (feature('PROACTIVE') || feature('KAIROS')) &&
          (message.request as { subtype: string }).subtype === 'set_proactive'
        ) {
          // req保存`message.request as unknown as {`，供print后续判断或输出使用。
          const req = message.request as unknown as {
            subtype: string
            enabled: boolean
          }
          // 满足 `req.enabled` 时，print执行该分支。
          if (req.enabled) {
            // 满足 `!proactiveModule!.isProactiveActive()` 时，print执行该分支。
            if (!proactiveModule!.isProactiveActive()) {
              // print在这里处理 `proactiveModule!.activateProactive('command')`，完成这一小步状态转换。
              proactiveModule!.activateProactive('command')
              // print在这里处理 `scheduleProactiveTick!()`，完成这一小步状态转换。
              scheduleProactiveTick!()
            }
          } else {
            // print在这里处理 `proactiveModule!.deactivateProactive()`，完成这一小步状态转换。
            proactiveModule!.deactivateProactive()
          }
          // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
          sendControlResponseSuccess(message)
        // print在这里处理 `} else if (message.request.subtype === 'remote_control') {`，完成这一小步状态转换。
        } else if (message.request.subtype === 'remote_control') {
          // 满足 `message.request.enabled` 时，print执行该分支。
          if (message.request.enabled) {
            // 满足 `bridgeHandle` 时，print执行该分支。
            if (bridgeHandle) {
              // Already connected
              // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
              sendControlResponseSuccess(message, {
                session_url: getRemoteSessionUrl(
                  bridgeHandle.bridgeSessionId,
                  bridgeHandle.sessionIngressUrl,
                ),
                connect_url: buildBridgeConnectUrl(
                  bridgeHandle.environmentId,
                  bridgeHandle.sessionIngressUrl,
                ),
                environment_id: bridgeHandle.environmentId,
              })
            } else {
              // initReplBridge surfaces gate-failure reasons via
              // onStateChange('failed', detail) before returning null.
              // Capture so the control-response error is actionable
              // ("/login", "disabled by your organization's policy", etc.)
              // instead of a generic "initialization failed".
              // bridgeFailureDetail 先占位，稍后的条件分支会根据实际输入补齐它。
              let bridgeFailureDetail: string | undefined
              // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
              try {
                // 从 `await import(` 解构 initReplBridge，减少print对同一对象的重复访问。
                const { initReplBridge } = await import(
                  'src/bridge/initReplBridge.js'
                )
                // handle保存`initReplBridge`，供print后续处理使用。
                const handle = await initReplBridge({
                  // onInboundMessage 使用 msg 完成print里的对应操作。
                  onInboundMessage(msg) {
                    // fields 集合保存`extractInboundMessageFields`，供print后续处理使用。
                    const fields = extractInboundMessageFields(msg)
                    // fields 集合缺失时提前走兜底路径，避免print继续依赖无效输入。
                    if (!fields) return
                    // 从 `fields` 解构 content、uuid，减少print对同一对象的重复访问。
                    const { content, uuid } = fields
                    // 调用 enqueue，触发print此处需要的副作用。
                    enqueue({
                      value: content,
                      mode: 'prompt' as const,
                      uuid,
                      skipSlashCommands: true,
                    })
                    // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
                    void run()
                  },
                  // onPermissionResponse 使用 response 完成print里的对应操作。
                  onPermissionResponse(response) {
                    // Forward bridge permission responses into the
                    // stdin processing loop so they resolve pending
                    // permission requests from the SDK consumer.
                    // 调用 structuredIO.injectControlResponse，触发print此处需要的副作用。
                    structuredIO.injectControlResponse(response)
                  },
                  // onInterrupt 使用 无 完成print里的对应操作。
                  onInterrupt() {
                    // 调用 abortController?.abort()，完成这一处局部操作。
                    abortController?.abort()
                  },
                  // onSetModel 使用 model 完成print里的对应操作。
                  onSetModel(model) {
                    // resolved 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
                    const resolved =
                      model === 'default' ? getDefaultMainLoopModel() : model
                    // activeUserSpecifiedModel更新为 `resolved`，确保CLI后续读取最新状态。
                    activeUserSpecifiedModel = resolved
                    // setMainLoopModelOverride 写入新的状态值，使print后续读取保持一致。
                    setMainLoopModelOverride(resolved)
                  },
                  // onSetMaxThinkingTokens 使用 maxTokens 完成print里的对应操作。
                  onSetMaxThinkingTokens(maxTokens) {
                    // 满足 `maxTokens === null` 时，print执行该分支。
                    if (maxTokens === null) {
                      // thinkingConfig 配置更新为 `undefined`，确保CLI后续读取最新状态。
                      options.thinkingConfig = undefined
                    // print在这里处理 `} else if (maxTokens === 0) {`，完成这一小步状态转换。
                    } else if (maxTokens === 0) {
                      // thinkingConfig 配置更新为 `{ type: 'disabled' }`，确保CLI后续读取最新状态。
                      options.thinkingConfig = { type: 'disabled' }
                    } else {
                      // thinkingConfig 配置更新为 `{`，确保CLI后续读取最新状态。
                      options.thinkingConfig = {
                        type: 'enabled',
                        budgetTokens: maxTokens,
                      }
                    }
                  },
                  // onStateChange 使用 state, detail 完成print里的对应操作。
                  onStateChange(state, detail) {
                    // 当 `state` 匹配 `'failed'` 时，print执行对应分支。
                    if (state === 'failed') {
                      // bridgeFailureDetail更新为 `detail`，确保CLI后续读取最新状态。
                      bridgeFailureDetail = detail
                    }
                    // 记录print运行诊断，方便排查异常路径或性能问题。
                    logForDebugging(
                      `[bridge:sdk] State change: ${state}${detail ? ` — ${detail}` : ''}`,
                    )
                    // 调用 output.enqueue，触发print此处需要的副作用。
                    output.enqueue({
                      type: 'system' as StdoutMessage['type'],
                      subtype: 'bridge_state' as string,
                      state,
                      detail,
                      uuid: randomUUID(),
                      session_id: getSessionId(),
                    } as StdoutMessage)
                  },
                  initialMessages:
                    mutableMessages.length > 0 ? mutableMessages : undefined,
                })
                // handle缺失时提前走兜底路径，避免print继续依赖无效输入。
                if (!handle) {
                  // 调用 sendControlResponseError，触发print此处需要的副作用。
                  sendControlResponseError(
                    message,
                    bridgeFailureDetail ??
                      'Remote Control initialization failed',
                  )
                } else {
                  // bridgeHandle更新为 `handle`，确保CLI后续读取最新状态。
                  bridgeHandle = handle
                  // bridgeLastForwardedIndex 索引更新为 `mutableMessages.length`，确保CLI后续读取最新状态。
                  bridgeLastForwardedIndex = mutableMessages.length
                  // Forward permission requests to the bridge
                  // structuredIO.setOnControlRequestSent 写入新的状态值，使print后续读取保持一致。
                  structuredIO.setOnControlRequestSent(request => {
                    // 调用 handle.sendControlRequest，触发print此处需要的副作用。
                    handle.sendControlRequest(request)
                  })
                  // Cancel stale bridge permission prompts when the SDK
                  // consumer resolves a can_use_tool request first.
                  // structuredIO.setOnControlRequestResolved 写入新的状态值，使print后续读取保持一致。
                  structuredIO.setOnControlRequestResolved(requestId => {
                    // 调用 handle.sendControlCancelRequest，触发print此处需要的副作用。
                    handle.sendControlCancelRequest(requestId)
                  })
                  // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
                  sendControlResponseSuccess(message, {
                    session_url: getRemoteSessionUrl(
                      handle.bridgeSessionId,
                      handle.sessionIngressUrl,
                    ),
                    connect_url: buildBridgeConnectUrl(
                      handle.environmentId,
                      handle.sessionIngressUrl,
                    ),
                    environment_id: handle.environmentId,
                  })
                }
              } catch (err) {
                // 调用 sendControlResponseError，触发print此处需要的副作用。
                sendControlResponseError(message, errorMessage(err))
              }
            }
          } else {
            // Disable
            // 满足 `bridgeHandle` 时，print执行该分支。
            if (bridgeHandle) {
              // structuredIO.setOnControlRequestSent 写入新的状态值，使print后续读取保持一致。
              structuredIO.setOnControlRequestSent(undefined)
              // structuredIO.setOnControlRequestResolved 写入新的状态值，使print后续读取保持一致。
              structuredIO.setOnControlRequestResolved(undefined)
              // 等待 `bridgeHandle.teardown()` 完成，再继续print的异步流程。
              await bridgeHandle.teardown()
              // bridgeHandle更新为 `null`，确保CLI后续读取最新状态。
              bridgeHandle = null
            }
            // 调用 sendControlResponseSuccess，触发print此处需要的副作用。
            sendControlResponseSuccess(message)
          }
        } else {
          // Unknown control request subtype — send an error response so
          // the caller doesn't hang waiting for a reply that never comes.
          // 调用 sendControlResponseError，触发print此处需要的副作用。
          sendControlResponseError(
            message,
            `Unsupported control request subtype: ${(message.request as { subtype: string }).subtype}`,
          )
        }
        // 跳过当前项，继续处理print中的下一轮循环。
        continue
      // print在这里处理 `} else if (message.type === 'control_response') {`，完成这一小步状态转换。
      } else if (message.type === 'control_response') {
        // Replay control_response messages when replay mode is enabled
        // 满足 `options.replayUserMessages` 时，print执行该分支。
        if (options.replayUserMessages) {
          // 调用 output.enqueue，触发print此处需要的副作用。
          output.enqueue(message)
        }
        // 跳过当前项，继续处理print中的下一轮循环。
        continue
      // print在这里处理 `} else if (message.type === 'keep_alive') {`，完成这一小步状态转换。
      } else if (message.type === 'keep_alive') {
        // Silently ignore keep-alive messages
        // 跳过当前项，继续处理print中的下一轮循环。
        continue
      // print在这里处理 `} else if (message.type === 'update_environment_variables') {`，完成这一小步状态转换。
      } else if (message.type === 'update_environment_variables') {
        // Handled in structuredIO.ts, but TypeScript needs the type guard
        // 跳过当前项，继续处理print中的下一轮循环。
        continue
      // print在这里处理 `} else if (message.type === 'assistant' || message.type === 'system') {`，完成这一小步状态转换。
      } else if (message.type === 'assistant' || message.type === 'system') {
        // History replay from bridge: inject into mutableMessages as
        // conversation context so the model sees prior turns.
        // internalMsgs 集合保存`toInternalMessages`，供print后续处理使用。
        const internalMsgs = toInternalMessages([message])
        // mutableMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        mutableMessages.push(...internalMsgs)
        // Echo assistant messages back so CCR displays them
        // 组合条件 `message.type === 'assistant' && options.replayUse` 成立时，print才启用这条专门路径。
        if (message.type === 'assistant' && options.replayUserMessages) {
          // 调用 output.enqueue，触发print此处需要的副作用。
          output.enqueue(message)
        }
        // 跳过当前项，继续处理print中的下一轮循环。
        continue
      }
      // After handling control, keep-alive, env-var, assistant, and system
      // messages above, only user messages should remain.
      // `message.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
      if (message.type !== 'user') {
        // 跳过当前项，继续处理print中的下一轮循环。
        continue
      }

      // First prompt message implicitly initializes if not already done.
      // initialized更新为 `true`，确保CLI后续读取最新状态。
      initialized = true

      // Check for duplicate user message - skip if already processed
      // 满足 `message.uuid` 时，print执行该分支。
      if (message.uuid) {
        // sessionId 会话数据读取`getSessionId`，供print后续处理使用。
        const sessionId = getSessionId() as UUID
        // existsInSession 会话数据保存`doesMessageExistInSession`，供print后续处理使用。
        const existsInSession = await doesMessageExistInSession(
          sessionId,
          message.uuid,
        )

        // Check both historical duplicates (from file) and runtime duplicates (this session)
        // 组合条件 `existsInSession || receivedMessageUuids.has(message.uuid)` 成立时，print才启用这条专门路径。
        if (existsInSession || receivedMessageUuids.has(message.uuid)) {
          // 记录print运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Skipping duplicate user message: ${message.uuid}`)
          // Send acknowledgment for duplicate message if replay mode is enabled
          // 满足 `options.replayUserMessages` 时，print执行该分支。
          if (options.replayUserMessages) {
            // 记录print运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Sending acknowledgment for duplicate user message: ${message.uuid}`,
            )
            // 调用 output.enqueue，触发print此处需要的副作用。
            output.enqueue({
              type: 'user',
              message: message.message,
              session_id: sessionId,
              parent_tool_use_id: null,
              uuid: message.uuid,
              timestamp: message.timestamp,
              isReplay: true,
            } as SDKUserMessageReplay)
          }
          // Historical dup = transcript already has this turn's output, so it
          // ran but its lifecycle was never closed (interrupted before ack).
          // Runtime dups don't need this — the original enqueue path closes them.
          // 满足 `existsInSession` 时，print执行该分支。
          if (existsInSession) {
            // 调用 notifyCommandLifecycle，触发print此处需要的副作用。
            notifyCommandLifecycle(message.uuid, 'completed')
          }
          // Don't enqueue duplicate messages for execution
          // 跳过当前项，继续处理print中的下一轮循环。
          continue
        }

        // Track this UUID to prevent runtime duplicates
        // 调用 trackReceivedMessageUuid，触发print此处需要的副作用。
        trackReceivedMessageUuid(message.uuid)
      }

      // 调用 enqueue，触发print此处需要的副作用。
      enqueue({
        mode: 'prompt' as const,
        // file_attachments rides the protobuf catchall from the web composer.
        // Same-ref no-op when absent (no 'file_attachments' key).
        value: await resolveAndPrepend(message, message.message.content),
        uuid: message.uuid,
        priority: message.priority,
      })
      // Increment prompt count for attribution tracking and save snapshot
      // The snapshot persists promptCount so it survives compaction
      // 满足 `feature('COMMIT_ATTRIBUTION')` 时，print执行该分支。
      if (feature('COMMIT_ATTRIBUTION')) {
        // setAppState 写入新的状态值，使print后续读取保持一致。
        setAppState(prev => ({
          ...prev,
          // 这个回调绑定到 attribution: incrementPromptCount(prev.attribution, snapshot => {，负责print在该局部场景下的响应。
          attribution: incrementPromptCount(prev.attribution, snapshot => {
            // 这个回调绑定到 void recordAttributionSnapshot(snapshot).catch(error => {，负责print在该局部场景下的响应。
            void recordAttributionSnapshot(snapshot).catch(error => {
              // 记录print运行诊断，方便排查异常路径或性能问题。
              logForDebugging(`Attribution: Failed to save snapshot: ${error}`)
            })
          }),
        }))
      }
      // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
      void run()
    }
    // inputClosed更新为 `true`，确保CLI后续读取最新状态。
    inputClosed = true
    // 调用 cronScheduler?.stop()，完成这一处局部操作。
    cronScheduler?.stop()
    // running缺失时提前走兜底路径，避免print继续依赖无效输入。
    if (!running) {
      // If a push-suggestion is in-flight, wait for it to emit before closing
      // the output stream (5 s safety timeout to prevent hanging).
      // 满足 `suggestionState.inflightPromise` 时，print执行该分支。
      if (suggestionState.inflightPromise) {
        // 等待 `Promise.race([suggestionState.inflightPromise, sleep(5000)])` 完成，再继续print的异步流程。
        await Promise.race([suggestionState.inflightPromise, sleep(5000)])
      }
      // 调用 suggestionState.abortController?.abort()，完成这一处局部操作。
      suggestionState.abortController?.abort()
      // abortController更新为 `null`，确保CLI后续读取最新状态。
      suggestionState.abortController = null
      // 等待 `finalizePendingAsyncHooks()` 完成，再继续print的异步流程。
      await finalizePendingAsyncHooks()
      // 调用 unsubscribeSkillChanges，触发print此处需要的副作用。
      unsubscribeSkillChanges()
      // 调用 unsubscribeAuthStatus?.()，完成这一处局部操作。
      unsubscribeAuthStatus?.()
      // 调用 statusListeners.delete，触发print此处需要的副作用。
      statusListeners.delete(rateLimitListener)
      // 调用 output.done，触发print此处需要的副作用。
      output.done()
    }
  })()

  // 返回 `output`，作为print这次计算的结果。
  return output
}

/**
 * Creates a CanUseToolFn that incorporates a custom permission prompt tool.
 * This function converts the permissionPromptTool into a CanUseToolFn that can be used in ask.tsx
 */
// createCanUseToolWithPermissionPrompt 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createCanUseToolWithPermissionPrompt(
  permissionPromptTool: PermissionPromptTool,
): CanUseToolFn {
  // canUseTool封装成回调，供print在事件触发或异步步骤中调用。
  const canUseTool: CanUseToolFn = async (
    tool,
    input,
    toolUseContext,
    assistantMessage,
    toolUseId,
    forceDecision,
  ) => {
    // mainPermissionResult 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const mainPermissionResult =
      forceDecision ??
      (await hasPermissionsToUseTool(
        tool,
        input,
        toolUseContext,
        assistantMessage,
        toolUseId,
      ))

    // If the tool is allowed or denied, return the result
    // print在这里进入条件判断，后续代码按实际状态分流。
    if (
      mainPermissionResult.behavior === 'allow' ||
      mainPermissionResult.behavior === 'deny'
    ) {
      // 返回 `mainPermissionResult`，作为print这次计算的结果。
      return mainPermissionResult
    }

    // Race the permission prompt tool against the abort signal.
    //
    // Why we need this: The permission prompt tool may block indefinitely waiting
    // for user input (e.g., via stdin or a UI dialog). If the user triggers an
    // interrupt (Ctrl+C), we need to detect it even while the tool is blocked.
    // Without this race, the abort check would only run AFTER the tool completes,
    // which may never happen if the tool is waiting for input that will never come.
    //
    // The second check (combinedSignal.aborted) handles a race condition where
    // abort fires after Promise.race resolves but before we reach this check.
    // print先整理这一处局部数据，后续分支可以直接读取。
    const { signal: combinedSignal, cleanup: cleanupAbortListener } =
      createCombinedAbortSignal(toolUseContext.abortController.signal)

    // Check if already aborted before starting the race
    // 满足 `combinedSignal.aborted` 时，print执行该分支。
    if (combinedSignal.aborted) {
      // 触发取消信号，通知print中仍在等待的异步任务尽快停止。
      cleanupAbortListener()
      // 返回结构化结果，集中表达print已经整理出的状态。
      return {
        behavior: 'deny',
        message: 'Permission prompt was aborted.',
        decisionReason: {
          type: 'permissionPromptTool' as const,
          permissionPromptToolName: tool.name,
          toolResult: undefined,
        },
      }
    }

    // abortPromise 异步任务封装成回调，供print在事件触发或异步步骤中调用。
    const abortPromise = new Promise<'aborted'>(resolve => {
      // 调用 combinedSignal.addEventListener，触发print此处需要的副作用。
      combinedSignal.addEventListener('abort', () => resolve('aborted'), {
        once: true,
      })
    })

    // toolCallPromise 异步任务保存 `permissionPromptTool.call` 启动的异步任务，稍后再决定等待还是后台完成。
    const toolCallPromise = permissionPromptTool.call(
      {
        tool_name: tool.name,
        input,
        tool_use_id: toolUseId,
      },
      toolUseContext,
      canUseTool,
      assistantMessage,
    )

    // raceResult保存`Promise.race`，供print后续处理使用。
    const raceResult = await Promise.race([toolCallPromise, abortPromise])
    // 触发取消信号，通知print中仍在等待的异步任务尽快停止。
    cleanupAbortListener()

    // 组合条件 `raceResult === 'aborted' || combinedSignal.aborted` 成立时，print才启用这条专门路径。
    if (raceResult === 'aborted' || combinedSignal.aborted) {
      // 返回结构化结果，集中表达print已经整理出的状态。
      return {
        behavior: 'deny',
        message: 'Permission prompt was aborted.',
        decisionReason: {
          type: 'permissionPromptTool' as const,
          permissionPromptToolName: tool.name,
          toolResult: undefined,
        },
      }
    }

    // TypeScript narrowing: after the abort check, raceResult must be ToolResult
    // 结果保存`raceResult as Awaited<typeof toolCallPromise>`，供后续判断或组装使用。
    const result = raceResult as Awaited<typeof toolCallPromise>

    // permissionToolResultBlockParam 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const permissionToolResultBlockParam =
      permissionPromptTool.mapToolResultToToolResultBlockParam(result.data, '1')
    // print在这里进入条件判断，后续代码按实际状态分流。
    if (
      !permissionToolResultBlockParam.content ||
      !Array.isArray(permissionToolResultBlockParam.content) ||
      !permissionToolResultBlockParam.content[0] ||
      permissionToolResultBlockParam.content[0].type !== 'text' ||
      typeof permissionToolResultBlockParam.content[0].text !== 'string'
    ) {
      // 抛出 new Error(，阻止print在无效状态下继续运行。
      throw new Error(
        'Permission prompt tool returned an invalid result. Expected a single text block param with type="text" and a string text value.',
      )
    }
    // 返回 `permissionPromptToolResultToPermissionDecision(`，作为print这次计算的结果。
    return permissionPromptToolResultToPermissionDecision(
      permissionToolOutputSchema().parse(
        safeParseJSON(permissionToolResultBlockParam.content[0].text),
      ),
      permissionPromptTool,
      input,
      toolUseContext,
    )
  }
  // 返回 `canUseTool`，作为print这次计算的结果。
  return canUseTool
}

// Exported for testing — regression: this used to crash at construction when
// getMcpTools() was empty (before per-server connects populated appState).
// getCanUseToolFn 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCanUseToolFn(
  permissionPromptToolName: string | undefined,
  structuredIO: StructuredIO,
  // 这个回调绑定到 getMcpTools: () => Tool[],，负责print在该局部场景下的响应。
  getMcpTools: () => Tool[],
  onPermissionPrompt?: (details: RequiresActionDetails) => void,
): CanUseToolFn {
  // 当 `permissionPromptToolName` 匹配 `'stdio'` 时，print执行对应分支。
  if (permissionPromptToolName === 'stdio') {
    // 返回 `structuredIO.createCanUseTool(onPermissionPrompt)`，作为print这次计算的结果。
    return structuredIO.createCanUseTool(onPermissionPrompt)
  }
  // permissionPromptToolName 权限数据缺失时提前走兜底路径，避免print继续依赖无效输入。
  if (!permissionPromptToolName) {
    // 返回 `async (`，作为print这次计算的结果。
    return async (
      tool,
      input,
      toolUseContext,
      assistantMessage,
      toolUseId,
      forceDecision,
    ) =>
      forceDecision ??
      (await hasPermissionsToUseTool(
        tool,
        input,
        toolUseContext,
        assistantMessage,
        toolUseId,
      ))
  }
  // Lazy lookup: MCP connects are per-server incremental in print mode, so
  // the tool may not be in appState yet at init time. Resolve on first call
  // (first permission prompt), by which point connects have had time to finish.
  // resolved保存`null`，作为后续空值处理的输入。
  let resolved: CanUseToolFn | null = null
  // 返回 `async (`，作为print这次计算的结果。
  return async (
    tool,
    input,
    toolUseContext,
    assistantMessage,
    toolUseId,
    forceDecision,
  ) => {
    // resolved缺失时提前走兜底路径，避免print继续依赖无效输入。
    if (!resolved) {
      // mcpTools 集合读取`getMcpTools`，供print后续处理使用。
      const mcpTools = getMcpTools()
      // permissionPromptTool 权限数据筛选`mcpTools.find`，供print后续处理使用。
      const permissionPromptTool = mcpTools.find(t =>
        toolMatchesName(t, permissionPromptToolName),
      ) as PermissionPromptTool | undefined
      // permissionPromptTool 权限数据缺失时提前走兜底路径，避免print继续依赖无效输入。
      if (!permissionPromptTool) {
        // 错误派生`mcpTools.map`，供print后续处理使用。
        const error = `Error: MCP tool ${permissionPromptToolName} (passed via --permission-prompt-tool) not found. Available MCP tools: ${mcpTools.map(t => t.name).join(', ') || 'none'}`
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(`${error}\n`)
        // 调用 gracefulShutdownSync，触发print此处需要的副作用。
        gracefulShutdownSync(1)
        // 抛出 new Error(error)，阻止print在无效状态下继续运行。
        throw new Error(error)
      }
      // permissionPromptTool.inputJSONSchema 权限数据缺失时提前走兜底路径，避免print继续依赖无效输入。
      if (!permissionPromptTool.inputJSONSchema) {
        // 错误固定为 ``Error: tool ${permissionPromptToolName} (passed via --pe...`，作为print后续展示或比较的基准。
        const error = `Error: tool ${permissionPromptToolName} (passed via --permission-prompt-tool) must be an MCP tool`
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(`${error}\n`)
        // 调用 gracefulShutdownSync，触发print此处需要的副作用。
        gracefulShutdownSync(1)
        // 抛出 new Error(error)，阻止print在无效状态下继续运行。
        throw new Error(error)
      }
      // resolved更新为 `createCanUseToolWithPermissionPrompt(permissionPromptTool)`，确保CLI后续读取最新状态。
      resolved = createCanUseToolWithPermissionPrompt(permissionPromptTool)
    }
    // 返回 `resolved(`，作为print这次计算的结果。
    return resolved(
      tool,
      input,
      toolUseContext,
      assistantMessage,
      toolUseId,
      forceDecision,
    )
  }
}

// handleInitializeRequest 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleInitializeRequest(
  request: SDKControlInitializeRequest,
  requestId: string,
  initialized: boolean,
  output: Stream<StdoutMessage>,
  commands: Command[],
  modelInfos: ModelInfo[],
  structuredIO: StructuredIO,
  enableAuthStatus: boolean,
  options: {
    systemPrompt: string | undefined
    appendSystemPrompt: string | undefined
    agent?: string | undefined
    userSpecifiedModel?: string | undefined
    [key: string]: unknown
  },
  agents: AgentDefinition[],
  // 这个回调绑定到 getAppState: () => AppState,，负责print在该局部场景下的响应。
  getAppState: () => AppState,
): Promise<void> {
  // 满足 `initialized` 时，print执行该分支。
  if (initialized) {
    // 调用 output.enqueue，触发print此处需要的副作用。
    output.enqueue({
      type: 'control_response',
      response: {
        subtype: 'error',
        error: 'Already initialized',
        request_id: requestId,
        pending_permission_requests:
          structuredIO.getPendingPermissionRequests(),
      },
    })
    // print在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Apply systemPrompt/appendSystemPrompt from stdin to avoid ARG_MAX limits
  // `request.systemPrompt` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (request.systemPrompt !== undefined) {
    // 系统提示词更新为 `request.systemPrompt`，确保CLI后续读取最新状态。
    options.systemPrompt = request.systemPrompt
  }
  // `request.appendSystemPrompt` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (request.appendSystemPrompt !== undefined) {
    // 追加系统提示词更新为 `request.appendSystemPrompt`，确保CLI后续读取最新状态。
    options.appendSystemPrompt = request.appendSystemPrompt
  }
  // `request.promptSuggestions` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (request.promptSuggestions !== undefined) {
    // promptSuggestions 集合更新为 `request.promptSuggestions`，确保CLI后续读取最新状态。
    options.promptSuggestions = request.promptSuggestions
  }

  // Merge agents from stdin to avoid ARG_MAX limits
  // 满足 `request.agents` 时，print执行该分支。
  if (request.agents) {
    // stdinAgents 集合解析`parseAgentsFromJson`，供print后续处理使用。
    const stdinAgents = parseAgentsFromJson(request.agents, 'flagSettings')
    // agents 集合追加新条目，保持收集顺序与输入顺序一致。
    agents.push(...stdinAgents)
  }

  // Re-evaluate main thread agent after SDK agents are merged
  // This allows --agent to reference agents defined via SDK
  // 满足 `options.agent` 时，print执行该分支。
  if (options.agent) {
    // If main.tsx already found this agent (filesystem-defined), it already
    // applied systemPrompt/model/initialPrompt. Skip to avoid double-apply.
    // alreadyResolved读取`getMainThreadAgentType`，供print后续处理使用。
    const alreadyResolved = getMainThreadAgentType() === options.agent
    // mainThreadAgent筛选`agents.find`，供print后续处理使用。
    const mainThreadAgent = agents.find(a => a.agentType === options.agent)
    // 组合条件 `mainThreadAgent && !alreadyResolved` 成立时，print才启用这条专门路径。
    if (mainThreadAgent && !alreadyResolved) {
      // Update the main thread agent type in bootstrap state
      // setMainThreadAgentType 写入新的状态值，使print后续读取保持一致。
      setMainThreadAgentType(mainThreadAgent.agentType)

      // Apply the agent's system prompt if user hasn't specified a custom one
      // SDK agents are always custom agents (not built-in), so getSystemPrompt() takes no args
      // 组合条件 `!options.systemPrompt && !isBuiltInAgent(mainThreadAgent)` 成立时，print才启用这条专门路径。
      if (!options.systemPrompt && !isBuiltInAgent(mainThreadAgent)) {
        // agentSystemPrompt读取`mainThreadAgent.getSystemPrompt`，供print后续处理使用。
        const agentSystemPrompt = mainThreadAgent.getSystemPrompt()
        // 满足 `agentSystemPrompt` 时，print执行该分支。
        if (agentSystemPrompt) {
          // 系统提示词更新为 `agentSystemPrompt`，确保CLI后续读取最新状态。
          options.systemPrompt = agentSystemPrompt
        }
      }

      // Apply the agent's model if user didn't specify one and agent has a model
      // print在这里进入条件判断，后续代码按实际状态分流。
      if (
        !options.userSpecifiedModel &&
        mainThreadAgent.model &&
        mainThreadAgent.model !== 'inherit'
      ) {
        // agentModel解析`parseUserSpecifiedModel`，供print后续处理使用。
        const agentModel = parseUserSpecifiedModel(mainThreadAgent.model)
        // setMainLoopModelOverride 写入新的状态值，使print后续读取保持一致。
        setMainLoopModelOverride(agentModel)
      }

      // SDK-defined agents arrive via init, so main.tsx's lookup missed them.
      // 满足 `mainThreadAgent.initialPrompt` 时，print执行该分支。
      if (mainThreadAgent.initialPrompt) {
        // 调用 structuredIO.prependUserMessage，触发print此处需要的副作用。
        structuredIO.prependUserMessage(mainThreadAgent.initialPrompt)
      }
    // print在这里处理 `} else if (mainThreadAgent?.initialPrompt) {`，完成这一小步状态转换。
    } else if (mainThreadAgent?.initialPrompt) {
      // Filesystem-defined agent (alreadyResolved by main.tsx). main.tsx
      // handles initialPrompt for the string inputPrompt case, but when
      // inputPrompt is an AsyncIterable (SDK stream-json), it can't
      // concatenate — fall back to prependUserMessage here.
      // 调用 structuredIO.prependUserMessage，触发print此处需要的副作用。
      structuredIO.prependUserMessage(mainThreadAgent.initialPrompt)
    }
  }

  // settings 集合读取`getSettings_DEPRECATED`，供print后续处理使用。
  const settings = getSettings_DEPRECATED()
  // outputStyle标记print是否启用对应路径。
  const outputStyle = settings?.outputStyle || DEFAULT_OUTPUT_STYLE_NAME
  // availableOutputStyles 集合读取`getAllOutputStyles`，供print后续处理使用。
  const availableOutputStyles = await getAllOutputStyles(getCwd())

  // Get account information
  // accountInfo 数量格式化`getAccountInformation`，供print后续处理使用。
  const accountInfo = getAccountInformation()
  // 满足 `request.hooks` 时，print执行该分支。
  if (request.hooks) {
    // hooks 集合 从空对象开始收集键值，后续按名称补齐内容。
    const hooks: Partial<Record<HookEvent, HookCallbackMatcher[]>> = {}
    // 循环处理 `const [event, matchers] of Object.entries(request.hooks)`，让print把同类条目按顺序走完。
    for (const [event, matchers] of Object.entries(request.hooks)) {
      // 这个回调绑定到 hooks[event as HookEvent] = matchers.map(matcher => {，负责print在该局部场景下的响应。
      hooks[event as HookEvent] = matchers.map(matcher => {
        // callbacks 集合派生`hookCallbackIds.map`，供print后续处理使用。
        const callbacks = matcher.hookCallbackIds.map(callbackId => {
          // 返回 `structuredIO.createHookCallback(callbackId, matcher.timeout)`，作为print这次计算的结果。
          return structuredIO.createHookCallback(callbackId, matcher.timeout)
        })
        // 返回结构化结果，集中表达print已经整理出的状态。
        return {
          matcher: matcher.matcher,
          hooks: callbacks,
        }
      })
    }
    // 调用 registerHookCallbacks，触发print此处需要的副作用。
    registerHookCallbacks(hooks)
  }
  // 满足 `request.jsonSchema` 时，print执行该分支。
  if (request.jsonSchema) {
    // setInitJsonSchema 写入新的状态值，使print后续读取保持一致。
    setInitJsonSchema(request.jsonSchema)
  }
  // initResponse 响应数据 集中保存print要一起传递的字段。
  const initResponse: SDKControlInitializeResponse = {
    commands: commands
      // 链式调用 filter，继续加工上一行在print中产生的数据。
      .filter(cmd => cmd.userInvocable !== false)
      // 链式调用 map，继续加工上一行在print中产生的数据。
      .map(cmd => ({
        name: getCommandName(cmd),
        description: formatDescriptionWithSource(cmd),
        argumentHint: cmd.argumentHint || '',
      })),
    // 这个回调绑定到 agents: agents.map(agent => ({，负责print在该局部场景下的响应。
    agents: agents.map(agent => ({
      name: agent.agentType,
      description: agent.whenToUse,
      // 'inherit' is an internal sentinel; normalize to undefined for the public API
      model: agent.model === 'inherit' ? undefined : agent.model,
    })),
    output_style: outputStyle,
    available_output_styles: Object.keys(availableOutputStyles),
    models: modelInfos,
    account: {
      email: accountInfo?.email,
      organization: accountInfo?.organization,
      subscriptionType: accountInfo?.subscription,
      tokenSource: accountInfo?.tokenSource,
      apiKeySource: accountInfo?.apiKeySource,
      // getAccountInformation() returns undefined under 3P providers, so the
      // other fields are all absent. apiProvider disambiguates "not logged
      // in" (firstParty + tokenSource:none) from "3P, login not applicable".
      apiProvider: getAPIProvider(),
    },
    pid: process.pid,
  }

  // 组合条件 `isFastModeEnabled() && isFastModeAvailable()` 成立时，print才启用这条专门路径。
  if (isFastModeEnabled() && isFastModeAvailable()) {
    // appState 状态读取`getAppState`，供print后续处理使用。
    const appState = getAppState()
    // fast_mode_state 状态更新为 `getFastModeState(`，确保CLI后续读取最新状态。
    initResponse.fast_mode_state = getFastModeState(
      options.userSpecifiedModel ?? null,
      appState.fastMode,
    )
  }

  // 调用 output.enqueue，触发print此处需要的副作用。
  output.enqueue({
    type: 'control_response',
    response: {
      subtype: 'success',
      request_id: requestId,
      response: initResponse,
    },
  })

  // After the initialize message, check the auth status-
  // This will get notified of changes, but we also want to send the
  // initial state.
  // 满足 `enableAuthStatus` 时，print执行该分支。
  if (enableAuthStatus) {
    // authStatusManager读取`AwsAuthStatusManager.getInstance`，供print后续处理使用。
    const authStatusManager = AwsAuthStatusManager.getInstance()
    // status 集合读取`authStatusManager.getStatus`，供print后续处理使用。
    const status = authStatusManager.getStatus()
    // 满足 `status` 时，print执行该分支。
    if (status) {
      // 调用 output.enqueue，触发print此处需要的副作用。
      output.enqueue({
        type: 'auth_status',
        isAuthenticating: status.isAuthenticating,
        output: status.output,
        error: status.error,
        uuid: randomUUID(),
        session_id: getSessionId(),
      })
    }
  }
}

// handleRewindFiles 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleRewindFiles(
  userMessageId: UUID,
  appState: AppState,
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责print在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  dryRun: boolean,
): Promise<RewindFilesResult> {
  // 满足 `!fileHistoryEnabled()` 时，print执行该分支。
  if (!fileHistoryEnabled()) {
    // 返回结构化结果，集中表达print已经整理出的状态。
    return { canRewind: false, error: 'File rewinding is not enabled.' }
  }
  // 满足 `!fileHistoryCanRestore(appState.fileHistory, userMessageId)` 时，print执行该分支。
  if (!fileHistoryCanRestore(appState.fileHistory, userMessageId)) {
    // 返回结构化结果，集中表达print已经整理出的状态。
    return {
      canRewind: false,
      error: 'No file checkpoint found for this message.',
    }
  }

  // 满足 `dryRun` 时，print执行该分支。
  if (dryRun) {
    // diffStats 集合保存`fileHistoryGetDiffStats`，供print后续处理使用。
    const diffStats = await fileHistoryGetDiffStats(
      appState.fileHistory,
      userMessageId,
    )
    // 返回结构化结果，集中表达print已经整理出的状态。
    return {
      canRewind: true,
      filesChanged: diffStats?.filesChanged,
      insertions: diffStats?.insertions,
      deletions: diffStats?.deletions,
    }
  }

  // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fileHistoryRewind(` 完成，再继续print的异步流程。
    await fileHistoryRewind(
      // updater更新为 `>`，确保CLI后续读取最新状态。
      updater =>
        // setAppState 写入新的状态值，使print后续读取保持一致。
        setAppState(prev => ({
          ...prev,
          fileHistory: updater(prev.fileHistory),
        })),
      userMessageId,
    )
  } catch (error) {
    // 返回结构化结果，集中表达print已经整理出的状态。
    return {
      canRewind: false,
      error: `Failed to rewind: ${errorMessage(error)}`,
    }
  }

  // 返回结构化结果，集中表达print已经整理出的状态。
  return { canRewind: true }
}

// handleSetPermissionMode 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleSetPermissionMode(
  request: { mode: InternalPermissionMode },
  requestId: string,
  toolPermissionContext: ToolPermissionContext,
  output: Stream<StdoutMessage>,
): ToolPermissionContext {
  // Check if trying to switch to bypassPermissions mode
  // 当 `request.mode` 匹配 `'bypassPermissions'` 时，print执行对应分支。
  if (request.mode === 'bypassPermissions') {
    // 满足 `isBypassPermissionsModeDisabled()` 时，print执行该分支。
    if (isBypassPermissionsModeDisabled()) {
      // 调用 output.enqueue，触发print此处需要的副作用。
      output.enqueue({
        type: 'control_response',
        response: {
          subtype: 'error',
          request_id: requestId,
          error:
            'Cannot set permission mode to bypassPermissions because it is disabled by settings or configuration',
        },
      })
      // 返回 `toolPermissionContext`，作为print这次计算的结果。
      return toolPermissionContext
    }
    // toolPermissionContext.isBypassPermissionsModeAva 权限数据缺失时提前走兜底路径，避免print继续依赖无效输入。
    if (!toolPermissionContext.isBypassPermissionsModeAvailable) {
      // 调用 output.enqueue，触发print此处需要的副作用。
      output.enqueue({
        type: 'control_response',
        response: {
          subtype: 'error',
          request_id: requestId,
          error:
            'Cannot set permission mode to bypassPermissions because the session was not launched with --dangerously-skip-permissions',
        },
      })
      // 返回 `toolPermissionContext`，作为print这次计算的结果。
      return toolPermissionContext
    }
  }

  // Check if trying to switch to auto mode without the classifier gate
  // print在这里进入条件判断，后续代码按实际状态分流。
  if (
    feature('TRANSCRIPT_CLASSIFIER') &&
    request.mode === 'auto' &&
    !isAutoModeGateEnabled()
  ) {
    // reason读取`getAutoModeUnavailableReason`，供print后续处理使用。
    const reason = getAutoModeUnavailableReason()
    // 调用 output.enqueue，触发print此处需要的副作用。
    output.enqueue({
      type: 'control_response',
      response: {
        subtype: 'error',
        request_id: requestId,
        error: reason
          ? `Cannot set permission mode to auto: ${getAutoModeUnavailableNotification(reason)}`
          : 'Cannot set permission mode to auto',
      },
    })
    // 返回 `toolPermissionContext`，作为print这次计算的结果。
    return toolPermissionContext
  }

  // Allow the mode switch
  // 调用 output.enqueue，触发print此处需要的副作用。
  output.enqueue({
    type: 'control_response',
    response: {
      subtype: 'success',
      request_id: requestId,
      response: {
        mode: request.mode,
      },
    },
  })

  // 返回结构化结果，集中表达print已经整理出的状态。
  return {
    ...transitionPermissionMode(
      toolPermissionContext.mode,
      request.mode,
      toolPermissionContext,
    ),
    mode: request.mode,
  }
}

/**
 * IDE-triggered channel enable. Derives the ChannelEntry from the connection's
 * pluginSource (IDE can't spoof kind/marketplace — we only take the server
 * name), appends it to session allowedChannels, and runs the full gate. On
 * gate failure, rolls back the append. On success, registers a notification
 * handler that enqueues channel messages at priority:'next' — drainCommandQueue
 * picks them up between turns.
 *
 * Intentionally does NOT register the claude/channel/permission handler that
 * useManageMCPConnections sets up for interactive mode. That handler resolves
 * a pending dialog inside handleInteractivePermission — but print.ts never
 * calls handleInteractivePermission. When SDK permission lands on 'ask', it
 * goes to the consumer's canUseTool callback over stdio; there is no CLI-side
 * dialog for a remote "yes tbxkq" to resolve. If an IDE wants channel-relayed
 * tool approval, that's IDE-side plumbing against its own pending-map. (Also
 * gated separately by tengu_harbor_permissions — not yet shipping on
 * interactive either.)
 */
// handleChannelEnable 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleChannelEnable(
  requestId: string,
  serverName: string,
  connectionPool: readonly MCPServerConnection[],
  output: Stream<StdoutMessage>,
): void {
  // respondError 错误信息封装成回调，供print在事件触发或异步步骤中调用。
  const respondError = (error: string) =>
    output.enqueue({
      type: 'control_response',
      response: { subtype: 'error', request_id: requestId, error },
    })

  // 组合条件 `!(feature('KAIROS') || feature('KAIROS_CHANNELS'))` 成立时，print才启用这条专门路径。
  if (!(feature('KAIROS') || feature('KAIROS_CHANNELS'))) {
    // 返回 `respondError('channels feature not available in this build')`，作为print这次计算的结果。
    return respondError('channels feature not available in this build')
  }

  // Only a 'connected' client has .capabilities and .client to register the
  // handler on. The pool spread at the call site matches mcp_status.
  // connection筛选`connectionPool.find`，供print后续处理使用。
  const connection = connectionPool.find(
    // c更新为 `> c.name === serverName && c.type === 'connected'`，确保CLI后续读取最新状态。
    c => c.name === serverName && c.type === 'connected',
  )
  // `!connection || connection.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
  if (!connection || connection.type !== 'connected') {
    // 返回 `respondError(`server ${serverName} is not connected`)`，作为print这次计算的结果。
    return respondError(`server ${serverName} is not connected`)
  }

  // pluginSource 插件数据 命名 `connection.config.pluginSource`，让后续代码直接表达这个值的用途。
  const pluginSource = connection.config.pluginSource
  // 解析结果解析`parsePluginIdentifier`，供print后续处理使用。
  const parsed = pluginSource ? parsePluginIdentifier(pluginSource) : undefined
  // 满足 `!parsed?.marketplace` 时，print执行该分支。
  if (!parsed?.marketplace) {
    // No pluginSource or @-less source — can never pass the {plugin,
    // marketplace}-keyed allowlist. Short-circuit with the same reason the
    // gate would produce.
    // 返回 `respondError(`，作为print这次计算的结果。
    return respondError(
      `server ${serverName} is not plugin-sourced; channel_enable requires a marketplace plugin`,
    )
  }

  // entry 集中保存print要一起传递的字段。
  const entry: ChannelEntry = {
    kind: 'plugin',
    name: parsed.name,
    marketplace: parsed.marketplace,
  }
  // Idempotency: don't double-append on repeat enable.
  // prior读取`getAllowedChannels`，供print后续处理使用。
  const prior = getAllowedChannels()
  // already筛选`prior.some`，供print后续处理使用。
  const already = prior.some(
    // e更新为 `>`，确保CLI后续读取最新状态。
    e =>
      e.kind === 'plugin' &&
      e.name === entry.name &&
      e.marketplace === entry.marketplace,
  )
  // 满足 `!already) setAllowedChannels([...prior, entry]` 时，print执行该分支。
  if (!already) setAllowedChannels([...prior, entry])

  // gate保存`gateChannelServer`，供print后续处理使用。
  const gate = gateChannelServer(
    serverName,
    connection.capabilities,
    pluginSource,
  )
  // 当 `gate.action` 匹配 `'skip'` 时，print执行对应分支。
  if (gate.action === 'skip') {
    // Rollback — only remove the entry we appended.
    // 满足 `!already) setAllowedChannels(prior` 时，print执行该分支。
    if (!already) setAllowedChannels(prior)
    // 返回 `respondError(gate.reason)`，作为print这次计算的结果。
    return respondError(gate.reason)
  }

  // pluginId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const pluginId =
    `${entry.name}@${entry.marketplace}` as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  // 调用 logMCPDebug，触发print此处需要的副作用。
  logMCPDebug(serverName, 'Channel notifications registered')
  // 记录print运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_mcp_channel_enable', { plugin: pluginId })

  // Identical enqueue shape to the interactive register block in
  // useManageMCPConnections. drainCommandQueue processes it between turns —
  // channel messages queue at priority 'next' and are seen by the model on
  // the turn after they arrive.
  // connection.client.setNotificationHandler 写入新的状态值，使print后续读取保持一致。
  connection.client.setNotificationHandler(
    ChannelMessageNotificationSchema(),
    // 这个回调绑定到 async notification => {，负责print在该局部场景下的响应。
    async notification => {
      // 从 `notification.params` 解构 content、meta，减少print对同一对象的重复访问。
      const { content, meta } = notification.params
      // 调用 logMCPDebug，触发print此处需要的副作用。
      logMCPDebug(
        serverName,
        `notifications/claude/channel: ${content.slice(0, 80)}`,
      )
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_mcp_channel_message', {
        content_length: content.length,
        meta_key_count: Object.keys(meta ?? {}).length,
        entry_kind:
          'plugin' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        is_dev: false,
        plugin: pluginId,
      })
      // 调用 enqueue，触发print此处需要的副作用。
      enqueue({
        mode: 'prompt',
        value: wrapChannelMessage(serverName, content, meta),
        priority: 'next',
        isMeta: true,
        origin: { kind: 'channel', server: serverName },
        skipSlashCommands: true,
      })
    },
  )

  // 调用 output.enqueue，触发print此处需要的副作用。
  output.enqueue({
    type: 'control_response',
    response: {
      subtype: 'success',
      request_id: requestId,
      response: undefined,
    },
  })
}

/**
 * Re-register the channel notification handler after mcp_reconnect /
 * mcp_toggle creates a new client. handleChannelEnable bound the handler to
 * the OLD client object; allowedChannels survives the reconnect but the
 * handler binding does not. Without this, channel messages silently drop
 * after a reconnect while the IDE still believes the channel is live.
 *
 * Mirrors the interactive CLI's onConnectionAttempt in
 * useManageMCPConnections, which re-gates on every new connection. Paired
 * with registerElicitationHandlers at the same call sites.
 *
 * No-op if the server was never channel-enabled: gateChannelServer calls
 * findChannelEntry internally and returns skip/session for an unlisted
 * server, so reconnecting a non-channel MCP server costs one feature-flag
 * check.
 */
// reregisterChannelHandlerAfterReconnect 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function reregisterChannelHandlerAfterReconnect(
  connection: MCPServerConnection,
): void {
  // 组合条件 `!(feature('KAIROS') || feature('KAIROS_CHANNELS'))` 成立时，print才启用这条专门路径。
  if (!(feature('KAIROS') || feature('KAIROS_CHANNELS'))) return
  // `connection.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
  if (connection.type !== 'connected') return

  // gate保存`gateChannelServer`，供print后续处理使用。
  const gate = gateChannelServer(
    connection.name,
    connection.capabilities,
    connection.config.pluginSource,
  )
  // `gate.action` 与 `'register'` 不一致时刷新派生状态，避免使用过期结果。
  if (gate.action !== 'register') return

  // entry筛选`findChannelEntry`，供print后续处理使用。
  const entry = findChannelEntry(connection.name, getAllowedChannels())
  // pluginId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const pluginId =
    entry?.kind === 'plugin'
      ? (`${entry.name}@${entry.marketplace}` as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
      : undefined

  // 调用 logMCPDebug，触发print此处需要的副作用。
  logMCPDebug(
    connection.name,
    'Channel notifications re-registered after reconnect',
  )
  // connection.client.setNotificationHandler 写入新的状态值，使print后续读取保持一致。
  connection.client.setNotificationHandler(
    ChannelMessageNotificationSchema(),
    // 这个回调绑定到 async notification => {，负责print在该局部场景下的响应。
    async notification => {
      // 从 `notification.params` 解构 content、meta，减少print对同一对象的重复访问。
      const { content, meta } = notification.params
      // 调用 logMCPDebug，触发print此处需要的副作用。
      logMCPDebug(
        connection.name,
        `notifications/claude/channel: ${content.slice(0, 80)}`,
      )
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_mcp_channel_message', {
        content_length: content.length,
        meta_key_count: Object.keys(meta ?? {}).length,
        entry_kind:
          entry?.kind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        is_dev: entry?.dev ?? false,
        plugin: pluginId,
      })
      // 调用 enqueue，触发print此处需要的副作用。
      enqueue({
        mode: 'prompt',
        value: wrapChannelMessage(connection.name, content, meta),
        priority: 'next',
        isMeta: true,
        origin: { kind: 'channel', server: connection.name },
        skipSlashCommands: true,
      })
    },
  )
}

/**
 * Emits an error message in the correct format based on outputFormat.
 * When using stream-json, writes JSON to stdout; otherwise writes plain text to stderr.
 */
// emitLoadError 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function emitLoadError(
  message: string,
  outputFormat: string | undefined,
): void {
  // 当 `outputFormat` 匹配 `'stream-json'` 时，print执行对应分支。
  if (outputFormat === 'stream-json') {
    // errorResult 错误信息 集中保存print要一起传递的字段。
    const errorResult = {
      type: 'result',
      subtype: 'error_during_execution',
      duration_ms: 0,
      duration_api_ms: 0,
      is_error: true,
      num_turns: 0,
      stop_reason: null,
      session_id: getSessionId(),
      total_cost_usd: 0,
      usage: EMPTY_USAGE,
      modelUsage: {},
      permission_denials: [],
      uuid: randomUUID(),
      errors: [message],
    }
    // 向标准输出写入print要展示给用户的文本。
    process.stdout.write(jsonStringify(errorResult) + '\n')
  } else {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(message + '\n')
  }
}

/**
 * Removes an interrupted user message and its synthetic assistant sentinel
 * from the message array. Used during gateway-triggered restarts to clean up
 * the message history before re-enqueuing the interrupted prompt.
 *
 * @internal Exported for testing
 */
// removeInterruptedMessage 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeInterruptedMessage(
  messages: Message[],
  interruptedUserMessage: NormalizedUserMessage,
): void {
  // idx筛选`messages.findIndex`，供print后续处理使用。
  const idx = messages.findIndex(m => m.uuid === interruptedUserMessage.uuid)
  // `idx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (idx !== -1) {
    // Remove the user message and the sentinel that immediately follows it.
    // splice safely handles the case where idx is the last element.
    // 调用 messages.splice，触发print此处需要的副作用。
    messages.splice(idx, 2)
  }
}

// LoadInitialMessagesResult 固化print里传递的数据形状，帮助调用方按同一结构读写字段。
type LoadInitialMessagesResult = {
  messages: Message[]
  turnInterruptionState?: TurnInterruptionState
  agentSetting?: string
}

// loadInitialMessages 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadInitialMessages(
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责print在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
  options: {
    continue: boolean | undefined
    teleport: string | true | null | undefined
    resume: string | boolean | undefined
    resumeSessionAt: string | undefined
    forkSession: boolean | undefined
    outputFormat: string | undefined
    sessionStartHooksPromise?: ReturnType<typeof processSessionStartHooks>
    restoredWorkerState: Promise<SessionExternalMetadata | null>
  },
): Promise<LoadInitialMessagesResult> {
  // persistSession 会话数据保存`isSessionPersistenceDisabled`，供print后续处理使用。
  const persistSession = !isSessionPersistenceDisabled()
  // Handle continue in print mode
  // 满足 `options.continue` 时，print执行该分支。
  if (options.continue) {
    // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
    try {
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_continue_print', {})

      // 结果读取`loadConversationForResume`，供print后续处理使用。
      const result = await loadConversationForResume(
        undefined /* sessionId */,
        undefined /* file path */,
      )
      // 满足 `result` 时，print执行该分支。
      if (result) {
        // Match coordinator mode to the resumed session's mode
        // 组合条件 `feature('COORDINATOR_MODE') && coordinatorModeModule` 成立时，print才启用这条专门路径。
        if (feature('COORDINATOR_MODE') && coordinatorModeModule) {
          // warning 警告信息保存`coordinatorModeModule.matchSessionMode`，供print后续处理使用。
          const warning = coordinatorModeModule.matchSessionMode(result.mode)
          // 满足 `warning` 时，print执行该分支。
          if (warning) {
            // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
            process.stderr.write(warning + '\n')
            // Refresh agent definitions to reflect the mode switch
            // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
            const {
              getAgentDefinitionsWithOverrides,
              getActiveAgentsFromList,
            } =
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              require('../tools/AgentTool/loadAgentsDir.js') as typeof import('../tools/AgentTool/loadAgentsDir.js')
            // 调用 getAgentDefinitionsWithOverrides.cache.clear?.()，完成这一处局部操作。
            getAgentDefinitionsWithOverrides.cache.clear?.()
            // freshAgentDefs 集合读取`getAgentDefinitionsWithOverrides`，供print后续处理使用。
            const freshAgentDefs = await getAgentDefinitionsWithOverrides(
              getCwd(),
            )

            // setAppState 写入新的状态值，使print后续读取保持一致。
            setAppState(prev => ({
              ...prev,
              agentDefinitions: {
                ...freshAgentDefs,
                allAgents: freshAgentDefs.allAgents,
                activeAgents: getActiveAgentsFromList(freshAgentDefs.allAgents),
              },
            }))
          }
        }

        // Reuse the resumed session's ID
        // options.forkSession 会话数据缺失时提前走兜底路径，避免print继续依赖无效输入。
        if (!options.forkSession) {
          // 满足 `result.sessionId` 时，print执行该分支。
          if (result.sessionId) {
            // 调用 switchSession，触发print此处需要的副作用。
            switchSession(
              asSessionId(result.sessionId),
              result.fullPath ? dirname(result.fullPath) : null,
            )
            // 满足 `persistSession` 时，print执行该分支。
            if (persistSession) {
              // 等待 `resetSessionFilePointer()` 完成，再继续print的异步流程。
              await resetSessionFilePointer()
            }
          }
        }
        // 调用 restoreSessionStateFromLog，触发print此处需要的副作用。
        restoreSessionStateFromLog(result, setAppState)

        // Restore session metadata so it's re-appended on exit via reAppendSessionMetadata
        // 调用 restoreSessionMetadata，触发print此处需要的副作用。
        restoreSessionMetadata(
          options.forkSession
            ? { ...result, worktreeSession: undefined }
            : result,
        )

        // Write mode entry for the resumed session
        // 组合条件 `feature('COORDINATOR_MODE') && coordinatorModeModule` 成立时，print才启用这条专门路径。
        if (feature('COORDINATOR_MODE') && coordinatorModeModule) {
          // 调用 saveMode，触发print此处需要的副作用。
          saveMode(
            coordinatorModeModule.isCoordinatorMode()
              ? 'coordinator'
              : 'normal',
          )
        }

        // 返回结构化结果，集中表达print已经整理出的状态。
        return {
          messages: result.messages,
          turnInterruptionState: result.turnInterruptionState,
          agentSetting: result.agentSetting,
        }
      }
    } catch (error) {
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 调用 gracefulShutdownSync，触发print此处需要的副作用。
      gracefulShutdownSync(1)
      // 返回结构化结果，集中表达print已经整理出的状态。
      return { messages: [] }
    }
  }

  // Handle teleport in print mode
  // 满足 `options.teleport` 时，print执行该分支。
  if (options.teleport) {
    // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
    try {
      // 满足 `!isPolicyAllowed('allow_remote_sessions')` 时，print执行该分支。
      if (!isPolicyAllowed('allow_remote_sessions')) {
        // 抛出 new Error(，阻止print在无效状态下继续运行。
        throw new Error(
          "Remote sessions are disabled by your organization's policy.",
        )
      }

      // 记录print运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_teleport_print', {})

      // `typeof options.teleport` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof options.teleport !== 'string') {
        // 抛出 new Error('No session ID provided for teleport')，阻止print在无效状态下继续运行。
        throw new Error('No session ID provided for teleport')
      }

      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        checkOutTeleportedSessionBranch,
        processMessagesForTeleportResume,
        teleportResumeCodeSession,
        validateGitState,
      } = await import('src/utils/teleport.js')
      // 等待 `validateGitState()` 完成，再继续print的异步流程。
      await validateGitState()
      // teleportResult保存`teleportResumeCodeSession`，供print后续处理使用。
      const teleportResult = await teleportResumeCodeSession(options.teleport)
      // 从 `await checkOutTeleportedSessionBranch(` 解构 branchError，减少print对同一对象的重复访问。
      const { branchError } = await checkOutTeleportedSessionBranch(
        teleportResult.branch,
      )
      // 返回结构化结果，集中表达print已经整理出的状态。
      return {
        messages: processMessagesForTeleportResume(
          teleportResult.log,
          branchError,
        ),
      }
    } catch (error) {
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 调用 gracefulShutdownSync，触发print此处需要的副作用。
      gracefulShutdownSync(1)
      // 返回结构化结果，集中表达print已经整理出的状态。
      return { messages: [] }
    }
  }

  // Handle resume in print mode (accepts session ID or URL)
  // URLs are [ANT-ONLY]
  // 满足 `options.resume` 时，print执行该分支。
  if (options.resume) {
    // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
    try {
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_resume_print', {})

      // In print mode - we require a valid session ID, JSONL file or URL
      // parsedSessionId 会话数据解析`parseSessionIdentifier`，供print后续处理使用。
      const parsedSessionId = parseSessionIdentifier(
        typeof options.resume === 'string' ? options.resume : '',
      )
      // parsedSessionId 会话数据缺失时提前走兜底路径，避免print继续依赖无效输入。
      if (!parsedSessionId) {
        // errorMessage 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
        let errorMessage =
          'Error: --resume requires a valid session ID when used with --print. Usage: claude -p --resume <session-id>'
        // 当 `typeof options.resume` 匹配 `'string'` 时，print执行对应分支。
        if (typeof options.resume === 'string') {
          // print在这里处理 `errorMessage += `. Session IDs must be in UUID format (e.g., 550e8400-e...`，完成这一小步状态转换。
          errorMessage += `. Session IDs must be in UUID format (e.g., 550e8400-e29b-41d4-a716-446655440000). Provided value "${options.resume}" is not a valid UUID`
        }
        // 调用 emitLoadError，触发print此处需要的副作用。
        emitLoadError(errorMessage, options.outputFormat)
        // 调用 gracefulShutdownSync，触发print此处需要的副作用。
        gracefulShutdownSync(1)
        // 返回结构化结果，集中表达print已经整理出的状态。
        return { messages: [] }
      }

      // Hydrate local transcript from remote before loading
      // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)` 时，print执行该分支。
      if (isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)) {
        // Await restore alongside hydration so SSE catchup lands on
        // restored state, not a fresh default.
        // 并行获取 metadata，缩短print等待多个独立异步任务的时间。
        const [, metadata] = await Promise.all([
          hydrateFromCCRv2InternalEvents(parsedSessionId.sessionId),
          options.restoredWorkerState,
        ])
        // 满足 `metadata` 时，print执行该分支。
        if (metadata) {
          // setAppState 写入新的状态值，使print后续读取保持一致。
          setAppState(externalMetadataToAppState(metadata))
          // 当 `typeof metadata.model` 匹配 `'string'` 时，print执行对应分支。
          if (typeof metadata.model === 'string') {
            // setMainLoopModelOverride 写入新的状态值，使print后续读取保持一致。
            setMainLoopModelOverride(metadata.model)
          }
        }
      // print在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        parsedSessionId.isUrl &&
        parsedSessionId.ingressUrl &&
        isEnvTruthy(process.env.ENABLE_SESSION_PERSISTENCE)
      ) {
        // v1: fetch session logs from Session Ingress
        // 等待 `hydrateRemoteSession(` 完成，再继续print的异步流程。
        await hydrateRemoteSession(
          parsedSessionId.sessionId,
          parsedSessionId.ingressUrl,
        )
      }

      // Load the conversation with the specified session ID
      // 结果读取`loadConversationForResume`，供print后续处理使用。
      const result = await loadConversationForResume(
        parsedSessionId.sessionId,
        parsedSessionId.jsonlFile || undefined,
      )

      // hydrateFromCCRv2InternalEvents writes an empty transcript file for
      // fresh sessions (writeFile(sessionFile, '') with zero events), so
      // loadConversationForResume returns {messages: []} not null. Treat
      // empty the same as null so SessionStart still fires.
      // !result || result.messages 消息数据为空时立即返回或跳过，避免print把空集合当成可处理内容。
      if (!result || result.messages.length === 0) {
        // For URL-based or CCR v2 resume, start with empty session (it was hydrated but empty)
        // print在这里进入条件判断，后续代码按实际状态分流。
        if (
          parsedSessionId.isUrl ||
          isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)
        ) {
          // Execute SessionStart hooks for startup since we're starting a new session
          // 返回结构化结果，集中表达print已经整理出的状态。
          return {
            messages: await (options.sessionStartHooksPromise ??
              processSessionStartHooks('startup')),
          }
        } else {
          // 调用 emitLoadError，触发print此处需要的副作用。
          emitLoadError(
            `No conversation found with session ID: ${parsedSessionId.sessionId}`,
            options.outputFormat,
          )
          // 调用 gracefulShutdownSync，触发print此处需要的副作用。
          gracefulShutdownSync(1)
          // 返回结构化结果，集中表达print已经整理出的状态。
          return { messages: [] }
        }
      }

      // Handle resumeSessionAt feature
      // 满足 `options.resumeSessionAt` 时，print执行该分支。
      if (options.resumeSessionAt) {
        // index 索引筛选`messages.findIndex`，供print后续处理使用。
        const index = result.messages.findIndex(
          // m更新为 `> m.uuid === options.resumeSessionAt`，确保CLI后续读取最新状态。
          m => m.uuid === options.resumeSessionAt,
        )
        // 满足 `index < 0` 时，print执行该分支。
        if (index < 0) {
          // 调用 emitLoadError，触发print此处需要的副作用。
          emitLoadError(
            `No message found with message.uuid of: ${options.resumeSessionAt}`,
            options.outputFormat,
          )
          // 调用 gracefulShutdownSync，触发print此处需要的副作用。
          gracefulShutdownSync(1)
          // 返回结构化结果，集中表达print已经整理出的状态。
          return { messages: [] }
        }

        // 对话消息更新为 `index >= 0 ? result.messages.slice(0, index + 1) : []`，确保CLI后续读取最新状态。
        result.messages = index >= 0 ? result.messages.slice(0, index + 1) : []
      }

      // Match coordinator mode to the resumed session's mode
      // 组合条件 `feature('COORDINATOR_MODE') && coordinatorModeModule` 成立时，print才启用这条专门路径。
      if (feature('COORDINATOR_MODE') && coordinatorModeModule) {
        // warning 警告信息保存`coordinatorModeModule.matchSessionMode`，供print后续处理使用。
        const warning = coordinatorModeModule.matchSessionMode(result.mode)
        // 满足 `warning` 时，print执行该分支。
        if (warning) {
          // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
          process.stderr.write(warning + '\n')
          // Refresh agent definitions to reflect the mode switch
          // print先整理这一处局部数据，后续分支可以直接读取。
          const { getAgentDefinitionsWithOverrides, getActiveAgentsFromList } =
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('../tools/AgentTool/loadAgentsDir.js') as typeof import('../tools/AgentTool/loadAgentsDir.js')
          // 调用 getAgentDefinitionsWithOverrides.cache.clear?.()，完成这一处局部操作。
          getAgentDefinitionsWithOverrides.cache.clear?.()
          // freshAgentDefs 集合读取`getAgentDefinitionsWithOverrides`，供print后续处理使用。
          const freshAgentDefs = await getAgentDefinitionsWithOverrides(
            getCwd(),
          )

          // setAppState 写入新的状态值，使print后续读取保持一致。
          setAppState(prev => ({
            ...prev,
            agentDefinitions: {
              ...freshAgentDefs,
              allAgents: freshAgentDefs.allAgents,
              activeAgents: getActiveAgentsFromList(freshAgentDefs.allAgents),
            },
          }))
        }
      }

      // Reuse the resumed session's ID
      // 组合条件 `!options.forkSession && result.sessionId` 成立时，print才启用这条专门路径。
      if (!options.forkSession && result.sessionId) {
        // 调用 switchSession，触发print此处需要的副作用。
        switchSession(
          asSessionId(result.sessionId),
          result.fullPath ? dirname(result.fullPath) : null,
        )
        // 满足 `persistSession` 时，print执行该分支。
        if (persistSession) {
          // 等待 `resetSessionFilePointer()` 完成，再继续print的异步流程。
          await resetSessionFilePointer()
        }
      }
      // 调用 restoreSessionStateFromLog，触发print此处需要的副作用。
      restoreSessionStateFromLog(result, setAppState)

      // Restore session metadata so it's re-appended on exit via reAppendSessionMetadata
      // 调用 restoreSessionMetadata，触发print此处需要的副作用。
      restoreSessionMetadata(
        options.forkSession
          ? { ...result, worktreeSession: undefined }
          : result,
      )

      // Write mode entry for the resumed session
      // 组合条件 `feature('COORDINATOR_MODE') && coordinatorModeModule` 成立时，print才启用这条专门路径。
      if (feature('COORDINATOR_MODE') && coordinatorModeModule) {
        // 调用 saveMode，触发print此处需要的副作用。
        saveMode(
          coordinatorModeModule.isCoordinatorMode() ? 'coordinator' : 'normal',
        )
      }

      // 返回结构化结果，集中表达print已经整理出的状态。
      return {
        messages: result.messages,
        turnInterruptionState: result.turnInterruptionState,
        agentSetting: result.agentSetting,
      }
    } catch (error) {
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error
          ? `Failed to resume session: ${error.message}`
          : 'Failed to resume session with --print mode'
      // 调用 emitLoadError，触发print此处需要的副作用。
      emitLoadError(errorMessage, options.outputFormat)
      // 调用 gracefulShutdownSync，触发print此处需要的副作用。
      gracefulShutdownSync(1)
      // 返回结构化结果，集中表达print已经整理出的状态。
      return { messages: [] }
    }
  }

  // Join the SessionStart hooks promise kicked in main.tsx (or run fresh if
  // it wasn't kicked — e.g. --continue with no prior session falls through
  // here with sessionStartHooksPromise undefined because main.tsx guards on continue)
  // 返回结构化结果，集中表达print已经整理出的状态。
  return {
    messages: await (options.sessionStartHooksPromise ??
      processSessionStartHooks('startup')),
  }
}

// getStructuredIO 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getStructuredIO(
  inputPrompt: string | AsyncIterable<string>,
  options: {
    sdkUrl: string | undefined
    replayUserMessages?: boolean
  },
): StructuredIO {
  // inputStream 先占位，稍后的条件分支会根据实际输入补齐它。
  let inputStream: AsyncIterable<string>
  // 当 `typeof inputPrompt` 匹配 `'string'` 时，print执行对应分支。
  if (typeof inputPrompt === 'string') {
    // `inputPrompt.trim()` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
    if (inputPrompt.trim() !== '') {
      // Normalize to a streaming input.
      // inputStream更新为 `fromArray([`，确保CLI后续读取最新状态。
      inputStream = fromArray([
        jsonStringify({
          type: 'user',
          session_id: '',
          message: {
            role: 'user',
            content: inputPrompt,
          },
          parent_tool_use_id: null,
        } satisfies SDKUserMessage),
      ])
    } else {
      // Empty string - create empty stream
      // inputStream更新为 `fromArray([])`，确保CLI后续读取最新状态。
      inputStream = fromArray([])
    }
  } else {
    // inputStream更新为 `inputPrompt`，确保CLI后续读取最新状态。
    inputStream = inputPrompt
  }

  // Use RemoteIO if sdkUrl is provided, otherwise use regular StructuredIO
  // 返回 `options.sdkUrl`，作为print这次计算的结果。
  return options.sdkUrl
    ? new RemoteIO(options.sdkUrl, inputStream, options.replayUserMessages)
    : new StructuredIO(inputStream, options.replayUserMessages)
}

/**
 * Handles unexpected permission responses by looking up the unresolved tool
 * call in the transcript and enqueuing it for execution.
 *
 * Returns true if a permission was enqueued, false otherwise.
 */
// handleOrphanedPermissionResponse 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function handleOrphanedPermissionResponse({
  message,
  setAppState,
  onEnqueued,
  handledToolUseIds,
}: {
  message: SDKControlResponse
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void，负责print在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void
  onEnqueued?: () => void
  handledToolUseIds: Set<string>
}): Promise<boolean> {
  // print在这里进入条件判断，后续代码按实际状态分流。
  if (
    message.response.subtype === 'success' &&
    message.response.response?.toolUseID &&
    typeof message.response.response.toolUseID === 'string'
  ) {
    // 权限判断结果保存`message.response.response as PermissionResult`，供print后续判断或输出使用。
    const permissionResult = message.response.response as PermissionResult
    // 从 `permissionResult` 解构 toolUseID，减少print对同一对象的重复访问。
    const { toolUseID } = permissionResult
    // toolUseID缺失时提前走兜底路径，避免print继续依赖无效输入。
    if (!toolUseID) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 记录print运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `handleOrphanedPermissionResponse: received orphaned control_response for toolUseID=${toolUseID} request_id=${message.response.request_id}`,
    )

    // Prevent re-processing the same orphaned tool_use. Without this guard,
    // duplicate control_response deliveries (e.g. from WebSocket reconnect)
    // cause the same tool to be executed multiple times, producing duplicate
    // tool_use IDs in the messages array and a 400 error from the API.
    // Once corrupted, every retry accumulates more duplicates.
    // 满足 `handledToolUseIds.has(toolUseID)` 时，print执行该分支。
    if (handledToolUseIds.has(toolUseID)) {
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `handleOrphanedPermissionResponse: skipping duplicate orphaned permission for toolUseID=${toolUseID} (already handled)`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // assistantMessage 消息数据筛选`findUnresolvedToolUse`，供print后续处理使用。
    const assistantMessage = await findUnresolvedToolUse(toolUseID)
    // assistantMessage 消息数据缺失时提前走兜底路径，避免print继续依赖无效输入。
    if (!assistantMessage) {
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `handleOrphanedPermissionResponse: no unresolved tool_use found for toolUseID=${toolUseID} (already resolved in transcript)`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 调用 handledToolUseIds.add，触发print此处需要的副作用。
    handledToolUseIds.add(toolUseID)
    // 记录print运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `handleOrphanedPermissionResponse: enqueuing orphaned permission for toolUseID=${toolUseID} messageID=${assistantMessage.message.id}`,
    )
    // 调用 enqueue，触发print此处需要的副作用。
    enqueue({
      mode: 'orphaned-permission' as const,
      value: [],
      orphanedPermission: {
        permissionResult,
        assistantMessage,
      },
    })

    // 调用 onEnqueued?.()，完成这一处局部操作。
    onEnqueued?.()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// DynamicMcpState 固化print里传递的数据形状，帮助调用方按同一结构读写字段。
export type DynamicMcpState = {
  clients: MCPServerConnection[]
  tools: Tools
  configs: Record<string, ScopedMcpServerConfig>
}

/**
 * Converts a process transport config to a scoped config.
 * The types are structurally compatible, so we just add the scope.
 */
// toScopedConfig 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toScopedConfig(
  config: McpServerConfigForProcessTransport,
): ScopedMcpServerConfig {
  // McpServerConfigForProcessTransport is a subset of McpServerConfig
  // (it excludes IDE-specific types like sse-ide and ws-ide)
  // Adding scope makes it a valid ScopedMcpServerConfig
  // 返回结构化结果，集中表达print已经整理出的状态。
  return { ...config, scope: 'dynamic' } as ScopedMcpServerConfig
}

/**
 * State for SDK MCP servers that run in the SDK process.
 */
// SdkMcpState 固化print里传递的数据形状，帮助调用方按同一结构读写字段。
export type SdkMcpState = {
  configs: Record<string, McpSdkServerConfig>
  clients: MCPServerConnection[]
  tools: Tools
}

/**
 * Result of handleMcpSetServers - contains new state and response data.
 */
// McpSetServersResult 固化print里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpSetServersResult = {
  response: SDKControlMcpSetServersResponse
  newSdkState: SdkMcpState
  newDynamicState: DynamicMcpState
  sdkServersChanged: boolean
}

/**
 * Handles mcp_set_servers requests by processing both SDK and process-based servers.
 * SDK servers run in the SDK process; process-based servers are spawned by the CLI.
 *
 * Applies enterprise allowedMcpServers/deniedMcpServers policy — same filter as
 * --mcp-config (see filterMcpServersByPolicy call in main.tsx). Without this,
 * SDK V2 Query.setMcpServers() was a second policy bypass vector. Blocked servers
 * are reported in response.errors so the SDK consumer knows why they weren't added.
 */
// handleMcpSetServers 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function handleMcpSetServers(
  servers: Record<string, McpServerConfigForProcessTransport>,
  sdkState: SdkMcpState,
  dynamicState: DynamicMcpState,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责print在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
): Promise<McpSetServersResult> {
  // Enforce enterprise MCP policy on process-based servers (stdio/http/sse).
  // Mirrors the --mcp-config filter in main.tsx — both user-controlled injection
  // paths must have the same gate. type:'sdk' servers are exempt (SDK-managed,
  // CLI never spawns/connects for them — see filterMcpServersByPolicy jsdoc).
  // Blocked servers go into response.errors so the SDK caller sees why.
  // 从 `filterMcpServersByPolicy(servers)` 解构 allowed、blocked，减少print对同一对象的重复访问。
  const { allowed: allowedServers, blocked } = filterMcpServersByPolicy(servers)
  // policyErrors 错误信息 从空对象开始收集键值，后续按名称补齐内容。
  const policyErrors: Record<string, string> = {}
  // 按顺序遍历 `blocked` 中的名称，逐个交给print处理。
  for (const name of blocked) {
    // print在这里处理 `policyErrors[name] =`，完成这一小步状态转换。
    policyErrors[name] =
      'Blocked by enterprise policy (allowedMcpServers/deniedMcpServers)'
  }

  // Separate SDK servers from process-based servers
  // sdkServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const sdkServers: Record<string, McpSdkServerConfig> = {}
  // processServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const processServers: Record<string, McpServerConfigForProcessTransport> = {}

  // 循环处理 `const [name, config] of Object.entries(allowedServers)`，让print把同类条目按顺序走完。
  for (const [name, config] of Object.entries(allowedServers)) {
    // 当 `config.type` 匹配 `'sdk'` 时，print执行对应分支。
    if (config.type === 'sdk') {
      // sdkServers[name更新为 `config`，确保print后续读取最新状态。
      sdkServers[name] = config
    } else {
      // processServers[name更新为 `config`，确保print后续读取最新状态。
      processServers[name] = config
    }
  }

  // Handle SDK servers
  // currentSdkNames 集合保存`Set`，供print后续处理使用。
  const currentSdkNames = new Set(Object.keys(sdkState.configs))
  // newSdkNames 集合保存`Set`，供print后续处理使用。
  const newSdkNames = new Set(Object.keys(sdkServers))
  // sdkAdded 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sdkAdded: string[] = []
  // sdkRemoved 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sdkRemoved: string[] = []

  // newSdkConfigs 配置 集中保存print要一起传递的字段。
  const newSdkConfigs = { ...sdkState.configs }
  // newSdkClients 集合 聚合成有序列表，保持后续遍历顺序稳定。
  let newSdkClients = [...sdkState.clients]
  // newSdkTools 集合 聚合成有序列表，保持后续遍历顺序稳定。
  let newSdkTools = [...sdkState.tools]

  // Remove SDK servers no longer in desired state
  // 按顺序遍历 `currentSdkNames` 中的名称，逐个交给print处理。
  for (const name of currentSdkNames) {
    // 满足 `!newSdkNames.has(name)` 时，print执行该分支。
    if (!newSdkNames.has(name)) {
      // API 客户端筛选`newSdkClients.find`，供print后续处理使用。
      const client = newSdkClients.find(c => c.name === name)
      // 当 `client && client.type` 匹配 `'connected'` 时，print执行对应分支。
      if (client && client.type === 'connected') {
        // 等待 `client.cleanup()` 完成，再继续print的异步流程。
        await client.cleanup()
      }
      // newSdkClients 集合更新为 `newSdkClients.filter(c => c.name !== name)`，确保CLI后续读取最新状态。
      newSdkClients = newSdkClients.filter(c => c.name !== name)
      // prefix 命名 ``mcp__${name}__``，让后续代码直接表达这个值的用途。
      const prefix = `mcp__${name}__`
      // newSdkTools 集合更新为 `newSdkTools.filter(t => !t.name.startsWith(prefix))`，确保CLI后续读取最新状态。
      newSdkTools = newSdkTools.filter(t => !t.name.startsWith(prefix))
      // print在这里处理 `delete newSdkConfigs[name]`，完成这一小步状态转换。
      delete newSdkConfigs[name]
      // sdkRemoved追加新条目，保持收集顺序与输入顺序一致。
      sdkRemoved.push(name)
    }
  }

  // Add new SDK servers as pending - they'll be upgraded to connected
  // when updateSdkMcp() runs on the next query
  // 循环处理 `const [name, config] of Object.entries(sdkServers)`，让print把同类条目按顺序走完。
  for (const [name, config] of Object.entries(sdkServers)) {
    // 满足 `!currentSdkNames.has(name)` 时，print执行该分支。
    if (!currentSdkNames.has(name)) {
      // newSdkConfigs[name 配置更新为 `config`，确保print后续读取最新状态。
      newSdkConfigs[name] = config
      // pendingClient 集中保存print要一起传递的字段。
      const pendingClient: MCPServerConnection = {
        type: 'pending',
        name,
        config: { ...config, scope: 'dynamic' as const },
      }
      // newSdkClients 集合更新为 `[...newSdkClients, pendingClient]`，确保CLI后续读取最新状态。
      newSdkClients = [...newSdkClients, pendingClient]
      // sdkAdded追加新条目，保持收集顺序与输入顺序一致。
      sdkAdded.push(name)
    }
  }

  // Handle process-based servers
  // processResult保存`reconcileMcpServers`，供print后续处理使用。
  const processResult = await reconcileMcpServers(
    processServers,
    dynamicState,
    setAppState,
  )

  // 返回结构化结果，集中表达print已经整理出的状态。
  return {
    response: {
      added: [...sdkAdded, ...processResult.response.added],
      removed: [...sdkRemoved, ...processResult.response.removed],
      errors: { ...policyErrors, ...processResult.response.errors },
    },
    newSdkState: {
      configs: newSdkConfigs,
      clients: newSdkClients,
      tools: newSdkTools,
    },
    newDynamicState: processResult.newState,
    sdkServersChanged: sdkAdded.length > 0 || sdkRemoved.length > 0,
  }
}

/**
 * Reconciles the current set of dynamic MCP servers with a new desired state.
 * Handles additions, removals, and config changes.
 */
// reconcileMcpServers 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function reconcileMcpServers(
  desiredConfigs: Record<string, McpServerConfigForProcessTransport>,
  currentState: DynamicMcpState,
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责print在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
): Promise<{
  response: SDKControlMcpSetServersResponse
  newState: DynamicMcpState
}> {
  // currentNames 集合保存`Set`，供print后续处理使用。
  const currentNames = new Set(Object.keys(currentState.configs))
  // desiredNames 集合保存`Set`，供print后续处理使用。
  const desiredNames = new Set(Object.keys(desiredConfigs))

  // toRemove筛选`filter`，供print后续处理使用。
  const toRemove = [...currentNames].filter(n => !desiredNames.has(n))
  // toAdd筛选`filter`，供print后续处理使用。
  const toAdd = [...desiredNames].filter(n => !currentNames.has(n))

  // Check for config changes (same name, different config)
  // toCheck筛选`filter`，供print后续处理使用。
  const toCheck = [...currentNames].filter(n => desiredNames.has(n))
  // toReplace筛选`toCheck.filter`，供print后续处理使用。
  const toReplace = toCheck.filter(name => {
    // currentConfig 配置保存`currentState.configs[name]`，供print后续判断或输出使用。
    const currentConfig = currentState.configs[name]
    // desiredConfigRaw 配置读取 `desiredConfigs[name]` 对应条目，后续围绕该成员继续处理。
    const desiredConfigRaw = desiredConfigs[name]
    // 组合条件 `!currentConfig || !desiredConfigRaw` 成立时，print才启用这条专门路径。
    if (!currentConfig || !desiredConfigRaw) return true
    // desiredConfig 配置保存`toScopedConfig`，供print后续处理使用。
    const desiredConfig = toScopedConfig(desiredConfigRaw)
    // 返回 `!areMcpConfigsEqual(currentConfig, desiredConfig)`，作为print这次计算的结果。
    return !areMcpConfigsEqual(currentConfig, desiredConfig)
  })

  // removed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const removed: string[] = []
  // added 从空数组开始收集，后续循环会按处理顺序追加条目。
  const added: string[] = []
  // 错误列表 从空对象开始收集键值，后续按名称补齐内容。
  const errors: Record<string, string> = {}

  // newClients 集合 聚合成有序列表，保持后续遍历顺序稳定。
  let newClients = [...currentState.clients]
  // newTools 集合 聚合成有序列表，保持后续遍历顺序稳定。
  let newTools = [...currentState.tools]

  // Remove old servers (including ones being replaced)
  // 按顺序遍历 `[...toRemove, ...toReplace]` 中的名称，逐个交给print处理。
  for (const name of [...toRemove, ...toReplace]) {
    // API 客户端筛选`newClients.find`，供print后续处理使用。
    const client = newClients.find(c => c.name === name)
    // 配置 命名 `currentState.configs[name]`，让后续代码直接表达这个值的用途。
    const config = currentState.configs[name]
    // 组合条件 `client && config` 成立时，print才启用这条专门路径。
    if (client && config) {
      // 当 `client.type` 匹配 `'connected'` 时，print执行对应分支。
      if (client.type === 'connected') {
        // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `client.cleanup()` 完成，再继续print的异步流程。
          await client.cleanup()
        } catch (e) {
          // 记录print运行诊断，方便排查异常路径或性能问题。
          logError(e)
        }
      }
      // Clear the memoization cache
      // 等待 `clearServerCache(name, config)` 完成，再继续print的异步流程。
      await clearServerCache(name, config)
    }

    // Remove tools from this server
    // prefix 命名 ``mcp__${name}__``，让后续代码直接表达这个值的用途。
    const prefix = `mcp__${name}__`
    // newTools 集合更新为 `newTools.filter(t => !t.name.startsWith(prefix))`，确保CLI后续读取最新状态。
    newTools = newTools.filter(t => !t.name.startsWith(prefix))

    // Remove from clients list
    // newClients 集合更新为 `newClients.filter(c => c.name !== name)`，确保CLI后续读取最新状态。
    newClients = newClients.filter(c => c.name !== name)

    // Track removal (only for actually removed, not replaced)
    // 满足 `toRemove.includes(name)` 时，print执行该分支。
    if (toRemove.includes(name)) {
      // removed追加新条目，保持收集顺序与输入顺序一致。
      removed.push(name)
    }
  }

  // Add new servers (including replacements)
  // 按顺序遍历 `[...toAdd, ...toReplace]` 中的名称，逐个交给print处理。
  for (const name of [...toAdd, ...toReplace]) {
    // 配置读取 `desiredConfigs[name]` 对应条目，后续围绕该成员继续处理。
    const config = desiredConfigs[name]
    // 配置缺失时提前走兜底路径，避免print继续依赖无效输入。
    if (!config) continue
    // scopedConfig 配置保存`toScopedConfig`，供print后续处理使用。
    const scopedConfig = toScopedConfig(config)

    // SDK servers are managed by the SDK process, not the CLI.
    // Just track them without trying to connect.
    // 当 `config.type` 匹配 `'sdk'` 时，print执行对应分支。
    if (config.type === 'sdk') {
      // added追加新条目，保持收集顺序与输入顺序一致。
      added.push(name)
      // 跳过当前项，继续处理print中的下一轮循环。
      continue
    }

    // 保护这一段可能失败的print操作，确保异常能进入相邻错误处理。
    try {
      // API 客户端保存`connectToServer`，供print后续处理使用。
      const client = await connectToServer(name, scopedConfig)
      // newClients 集合追加新条目，保持收集顺序与输入顺序一致。
      newClients.push(client)

      // 当 `client.type` 匹配 `'connected'` 时，print执行对应分支。
      if (client.type === 'connected') {
        // serverTools 集合读取`fetchToolsForClient`，供print后续处理使用。
        const serverTools = await fetchToolsForClient(client)
        // newTools 集合追加新条目，保持收集顺序与输入顺序一致。
        newTools.push(...serverTools)
      // print在这里处理 `} else if (client.type === 'failed') {`，完成这一小步状态转换。
      } else if (client.type === 'failed') {
        // errors[name 错误信息更新为 `client.error || 'Connection failed'`，确保print后续读取最新状态。
        errors[name] = client.error || 'Connection failed'
      }

      // added追加新条目，保持收集顺序与输入顺序一致。
      added.push(name)
    } catch (e) {
      // err保存`toError`，供print后续处理使用。
      const err = toError(e)
      // errors[name 错误信息更新为 `err.message`，确保print后续读取最新状态。
      errors[name] = err.message
      // 记录print运行诊断，方便排查异常路径或性能问题。
      logError(err)
    }
  }

  // Build new configs
  // newConfigs 配置 从空对象开始收集键值，后续按名称补齐内容。
  const newConfigs: Record<string, ScopedMcpServerConfig> = {}
  // 按顺序遍历 `desiredNames` 中的名称，逐个交给print处理。
  for (const name of desiredNames) {
    // 配置读取 `desiredConfigs[name]` 对应条目，后续围绕该成员继续处理。
    const config = desiredConfigs[name]
    // 满足 `config` 时，print执行该分支。
    if (config) {
      // newConfigs[name 配置更新为 `toScopedConfig(config)`，确保print后续读取最新状态。
      newConfigs[name] = toScopedConfig(config)
    }
  }

  // newState 状态 集中保存print要一起传递的字段。
  const newState: DynamicMcpState = {
    clients: newClients,
    tools: newTools,
    configs: newConfigs,
  }

  // Update AppState with the new tools
  // setAppState 写入新的状态值，使print后续读取保持一致。
  setAppState(prev => {
    // Get all dynamic server names (current + new)
    // allDynamicServerNames 集合保存`Set`，供print后续处理使用。
    const allDynamicServerNames = new Set([
      ...Object.keys(currentState.configs),
      ...Object.keys(newConfigs),
    ])

    // Remove old dynamic tools
    // nonDynamicTools 集合筛选`tools.filter`，供print后续处理使用。
    const nonDynamicTools = prev.mcp.tools.filter(t => {
      // 按顺序遍历 `allDynamicServerNames` 中的serverName，逐个交给print处理。
      for (const serverName of allDynamicServerNames) {
        // 满足 `t.name.startsWith(`mcp__${serverName}__`)` 时，print执行该分支。
        if (t.name.startsWith(`mcp__${serverName}__`)) {
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
      }
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    })

    // Remove old dynamic clients
    // nonDynamicClients 集合筛选`clients.filter`，供print后续处理使用。
    const nonDynamicClients = prev.mcp.clients.filter(c => {
      // 返回 `!allDynamicServerNames.has(c.name)`，作为print这次计算的结果。
      return !allDynamicServerNames.has(c.name)
    })

    // 返回结构化结果，集中表达print已经整理出的状态。
    return {
      ...prev,
      mcp: {
        ...prev.mcp,
        tools: [...nonDynamicTools, ...newTools],
        clients: [...nonDynamicClients, ...newClients],
      },
    }
  })

  // 返回结构化结果，集中表达print已经整理出的状态。
  return {
    response: { added, removed, errors },
    newState,
  }
}

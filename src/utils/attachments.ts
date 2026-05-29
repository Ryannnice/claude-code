// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  logEvent,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
} from 'src/services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  toolMatchesName,
  type Tools,
  type ToolUseContext,
  type ToolPermissionContext,
} from '../Tool.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  FileReadTool,
  MaxFileReadTokenExceededError,
  type Output as FileReadToolOutput,
  readImageWithTokenBudget,
} from '../tools/FileReadTool/FileReadTool.js'
// 引入 FileTooLargeError、readFileInRange，将 ./readFileInRange.js 中已经封装好的能力接到本文件流程里。
import { FileTooLargeError, readFileInRange } from './readFileInRange.js'
// 引入 expandPath，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { expandPath } from './path.js'
// 引入 countCharInString，将 ./stringUtils.js 中已经封装好的能力接到本文件流程里。
import { countCharInString } from './stringUtils.js'
// 引入 count、uniq，将 ./array.js 中已经封装好的能力接到本文件流程里。
import { count, uniq } from './array.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, stat } from 'fs/promises'
// 类型依赖 { IDESelection } 来自 ../hooks/useIdeSelection.js，用于校准共享工具的数据契约。
import type { IDESelection } from '../hooks/useIdeSelection.js'
// 接入 TODO_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TODO_WRITE_TOOL_NAME } from '../tools/TodoWriteTool/constants.js'
// 接入 TASK_CREATE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_CREATE_TOOL_NAME } from '../tools/TaskCreateTool/constants.js'
// 接入 TASK_UPDATE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_UPDATE_TOOL_NAME } from '../tools/TaskUpdateTool/constants.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../tools/BashTool/toolName.js'
// 接入 SKILL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SKILL_TOOL_NAME } from '../tools/SkillTool/constants.js'
// 类型依赖 { TodoList } 来自 ./todo/types.js，用于校准共享工具的数据契约。
import type { TodoList } from './todo/types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type Task,
  listTasks,
  getTaskListId,
  isTodoV2Enabled,
} from './tasks.js'
// 引入 getPlanFilePath、getPlan，将 ./plans.js 中已经封装好的能力接到本文件流程里。
import { getPlanFilePath, getPlan } from './plans.js'
// 引入 getConnectedIdeName，将 ./ide.js 中已经封装好的能力接到本文件流程里。
import { getConnectedIdeName } from './ide.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  filterInjectedMemoryFiles,
  getManagedAndUserConditionalRules,
  getMemoryFiles,
  getMemoryFilesForNestedDirectory,
  getConditionalRulesForCwdLevelDirectory,
  type MemoryFileInfo,
} from './claudemd.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, parse, relative, resolve } from 'path'
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js'
// 引入 getViewedTeammateTask，将 ../state/selectors.js 中已经封装好的能力接到本文件流程里。
import { getViewedTeammateTask } from '../state/selectors.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 logAntError，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logAntError } from './debug.js'
// 引入 isENOENT、toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT, toError } from './errors.js'
// 类型依赖 { DiagnosticFile } 来自 ../services/diagnosticTracking.js，用于校准共享工具的数据契约。
import type { DiagnosticFile } from '../services/diagnosticTracking.js'
// 接入 diagnosticTracker 服务层能力，把外部通信或共享状态交给 ../services/diagnosticTracking.js 处理。
import { diagnosticTracker } from '../services/diagnosticTracking.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AttachmentMessage,
  Message,
  MessageOrigin,
} from 'src/types/message.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type QueuedCommand,
  getImagePasteIds,
  isValidImagePaste,
} from 'src/types/textInputTypes.js'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID, type UUID } from 'crypto'
// 引入 getSettings_DEPRECATED，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from './settings/settings.js'
// 接入 getSnippetForTwoFileDiff 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getSnippetForTwoFileDiff } from 'src/tools/FileEditTool/utils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ContentBlockParam,
  ImageBlockParam,
  Base64ImageSource,
} from '@anthropic-ai/sdk/resources/messages.mjs'
// 引入 maybeResizeAndDownsampleImageBlock，将 ./imageResizer.js 中已经封装好的能力接到本文件流程里。
import { maybeResizeAndDownsampleImageBlock } from './imageResizer.js'
// 类型依赖 { PastedContent } 来自 ./config.js，用于校准共享工具的数据契约。
import type { PastedContent } from './config.js'
// 引入 getGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from './config.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getDefaultSonnetModel,
  getDefaultHaikuModel,
  getDefaultOpusModel,
} from './model/model.js'
// 类型依赖 { ReadResourceResult } 来自 @modelcontextprotocol/sdk/types.js，用于校准共享工具的数据契约。
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'
// 引入 getSkillToolCommands、getMcpSkillCommands，将 ../commands.js 中已经封装好的能力接到本文件流程里。
import { getSkillToolCommands, getMcpSkillCommands } from '../commands.js'
// 类型依赖 { Command } 来自 ../types/command.js，用于校准共享工具的数据契约。
import type { Command } from '../types/command.js'
// 引入 uniqBy，将 lodash-es/uniqBy.js 中已经封装好的能力接到本文件流程里。
import uniqBy from 'lodash-es/uniqBy.js'
// 引入 getProjectRoot，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getProjectRoot } from '../bootstrap/state.js'
// 接入 formatCommandsWithinBudget 工具实现，后续工具池会按权限和开关决定是否暴露。
import { formatCommandsWithinBudget } from '../tools/SkillTool/prompt.js'
// 引入 getContextWindowForModel，将 ./context.js 中已经封装好的能力接到本文件流程里。
import { getContextWindowForModel } from './context.js'
// 类型依赖 { DiscoverySignal } 来自 ../services/skillSearch/signals.js，用于校准共享工具的数据契约。
import type { DiscoverySignal } from '../services/skillSearch/signals.js'
// Conditional require for DCE. All skill-search string literals that would
// otherwise leak into external builds live inside these modules. The only
// surfaces in THIS file are: the maybe() call (gated via spread below) and
// the skill_listing suppression check (uses the same skillSearchModules null
// check). The type-only DiscoverySignal import above is erased at compile time.
/* eslint-disable @typescript-eslint/no-require-imports */
// skillSearchModules 集合保存`feature`，供共享工具后续处理使用。
const skillSearchModules = feature('EXPERIMENTAL_SKILL_SEARCH')
  ? {
      featureCheck:
        require('../services/skillSearch/featureCheck.js') as typeof import('../services/skillSearch/featureCheck.js'),
      prefetch:
        require('../services/skillSearch/prefetch.js') as typeof import('../services/skillSearch/prefetch.js'),
    }
  : null
// autoModeStateModule 状态保存`feature`，供共享工具后续处理使用。
const autoModeStateModule = feature('TRANSCRIPT_CLASSIFIER')
  ? (require('./permissions/autoModeState.js') as typeof import('./permissions/autoModeState.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  MAX_LINES_TO_READ,
  FILE_READ_TOOL_NAME,
} from 'src/tools/FileReadTool/prompt.js'
// 接入 getDefaultFileReadingLimits 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getDefaultFileReadingLimits } from 'src/tools/FileReadTool/limits.js'
// 引入 cacheKeys、FileStateCache，将 ./fileStateCache.js 中已经封装好的能力接到本文件流程里。
import { cacheKeys, type FileStateCache } from './fileStateCache.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createAbortController,
  createChildAbortController,
} from './abortController.js'
// 引入 isAbortError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isAbortError } from './errors.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getFileModificationTimeAsync,
  isFileWithinReadSizeLimit,
} from './file.js'
// 类型依赖 { AgentDefinition } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准共享工具的数据契约。
import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
// 接入 filterAgentsByMcpRequirements 工具实现，后续工具池会按权限和开关决定是否暴露。
import { filterAgentsByMcpRequirements } from '../tools/AgentTool/loadAgentsDir.js'
// 接入 AGENT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_TOOL_NAME } from '../tools/AgentTool/constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  formatAgentLine,
  shouldInjectAgentListInMessages,
} from '../tools/AgentTool/prompt.js'
// 引入 filterDeniedAgents，将 ./permissions/permissions.js 中已经封装好的能力接到本文件流程里。
import { filterDeniedAgents } from './permissions/permissions.js'
// 引入 getSubscriptionType，将 ./auth.js 中已经封装好的能力接到本文件流程里。
import { getSubscriptionType } from './auth.js'
// 接入 mcpInfoFromString 服务层能力，把外部通信或共享状态交给 ../services/mcp/mcpStringUtils.js 处理。
import { mcpInfoFromString } from '../services/mcp/mcpStringUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  matchingRuleForInput,
  pathInAllowedWorkingPath,
} from './permissions/filesystem.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  generateTaskAttachments,
  applyTaskOffsetsAndEvictions,
} from './task/framework.js'
// 引入 getTaskOutputPath，将 ./task/diskOutput.js 中已经封装好的能力接到本文件流程里。
import { getTaskOutputPath } from './task/diskOutput.js'
// 引入 drainPendingMessages，将 ../tasks/LocalAgentTask/LocalAgentTask.js 中已经封装好的能力接到本文件流程里。
import { drainPendingMessages } from '../tasks/LocalAgentTask/LocalAgentTask.js'
// 类型依赖 { TaskType, TaskStatus } 来自 ../Task.js，用于校准共享工具的数据契约。
import type { TaskType, TaskStatus } from '../Task.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getOriginalCwd,
  getSessionId,
  getSdkBetas,
  getTotalCostUSD,
  getTotalOutputTokens,
  getCurrentTurnTokenBudget,
  getTurnOutputTokens,
  hasExitedPlanModeInSession,
  setHasExitedPlanMode,
  needsPlanModeExitAttachment,
  setNeedsPlanModeExitAttachment,
  needsAutoModeExitAttachment,
  setNeedsAutoModeExitAttachment,
  getLastEmittedDate,
  setLastEmittedDate,
  getKairosActive,
} from '../bootstrap/state.js'
// 类型依赖 { QuerySource } 来自 ../constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from '../constants/querySource.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getDeferredToolsDelta,
  isDeferredToolsDeltaEnabled,
  isToolSearchEnabledOptimistic,
  isToolSearchToolAvailable,
  modelSupportsToolReference,
  type DeferredToolsDeltaScanContext,
} from './toolSearch.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getMcpInstructionsDelta,
  isMcpInstructionsDeltaEnabled,
  type ClientSideInstruction,
} from './mcpInstructionsDelta.js'
// 引入 CLAUDE_IN_CHROME_MCP_SERVER_NAME，将 ./claudeInChrome/common.js 中已经封装好的能力接到本文件流程里。
import { CLAUDE_IN_CHROME_MCP_SERVER_NAME } from './claudeInChrome/common.js'
// 引入 CHROME_TOOL_SEARCH_INSTRUCTIONS，将 ./claudeInChrome/prompt.js 中已经封装好的能力接到本文件流程里。
import { CHROME_TOOL_SEARCH_INSTRUCTIONS } from './claudeInChrome/prompt.js'
// 类型依赖 { MCPServerConnection } 来自 ../services/mcp/types.js，用于校准共享工具的数据契约。
import type { MCPServerConnection } from '../services/mcp/types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  HookEvent,
  SyncHookJSONOutput,
} from 'src/entrypoints/agentSdkTypes.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  checkForAsyncHookResponses,
  removeDeliveredAsyncHooks,
} from './hooks/AsyncHookRegistry.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  checkForLSPDiagnostics,
  clearAllLSPDiagnostics,
} from '../services/lsp/LSPDiagnosticRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  extractTextContent,
  getUserMessageText,
  isThinkingMessage,
} from './messages.js'
// 引入 isHumanTurn，将 ./messagePredicates.js 中已经封装好的能力接到本文件流程里。
import { isHumanTurn } from './messagePredicates.js'
// 引入 isEnvTruthy、getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy, getClaudeConfigHomeDir } from './envUtils.js'
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 isBuddyEnabled，将 ../buddy/availability.js 中已经封装好的能力接到本文件流程里。
import { isBuddyEnabled } from '../buddy/availability.js'
/* eslint-disable @typescript-eslint/no-require-imports */
// BRIEF_TOOL_NAME 先占位，稍后的条件分支会根据实际输入补齐它。
const BRIEF_TOOL_NAME: string | null =
  feature('KAIROS') || feature('KAIROS_BRIEF')
    ? (
        require('../tools/BriefTool/prompt.js') as typeof import('../tools/BriefTool/prompt.js')
      ).BRIEF_TOOL_NAME
    : null
// sessionTranscriptModule 会话数据保存`feature`，供共享工具后续处理使用。
const sessionTranscriptModule = feature('KAIROS')
  ? (require('../services/sessionTranscript/sessionTranscript.js') as typeof import('../services/sessionTranscript/sessionTranscript.js'))
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
// 引入 hasUltrathinkKeyword、isUltrathinkEnabled，将 ./thinking.js 中已经封装好的能力接到本文件流程里。
import { hasUltrathinkKeyword, isUltrathinkEnabled } from './thinking.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  tokenCountFromLastAPIResponse,
  tokenCountWithEstimation,
} from './tokens.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getEffectiveContextWindowSize,
  isAutoCompactEnabled,
} from '../services/compact/autoCompact.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  hasInstructionsLoadedHook,
  executeInstructionsLoadedHooks,
  type HookBlockingError,
  type InstructionsMemoryType,
} from './hooks.js'
// 引入 jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from './slowOperations.js'
// 引入 isPDFExtension，将 ./pdfUtils.js 中已经封装好的能力接到本文件流程里。
import { isPDFExtension } from './pdfUtils.js'
// 引入 getLocalISODate，将 ../constants/common.js 中已经封装好的能力接到本文件流程里。
import { getLocalISODate } from '../constants/common.js'
// 引入 getPDFPageCount，将 ./pdf.js 中已经封装好的能力接到本文件流程里。
import { getPDFPageCount } from './pdf.js'
// 引入 PDF_AT_MENTION_INLINE_THRESHOLD，将 ../constants/apiLimits.js 中已经封装好的能力接到本文件流程里。
import { PDF_AT_MENTION_INLINE_THRESHOLD } from '../constants/apiLimits.js'
// 引入 isAgentSwarmsEnabled，将 ./agentSwarmsEnabled.js 中已经封装好的能力接到本文件流程里。
import { isAgentSwarmsEnabled } from './agentSwarmsEnabled.js'
// 引入 findRelevantMemories，将 ../memdir/findRelevantMemories.js 中已经封装好的能力接到本文件流程里。
import { findRelevantMemories } from '../memdir/findRelevantMemories.js'
// 引入 memoryAge、memoryFreshnessText，将 ../memdir/memoryAge.js 中已经封装好的能力接到本文件流程里。
import { memoryAge, memoryFreshnessText } from '../memdir/memoryAge.js'
// 引入 getAutoMemPath、isAutoMemoryEnabled，将 ../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { getAutoMemPath, isAutoMemoryEnabled } from '../memdir/paths.js'
// 接入 getAgentMemoryDir 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getAgentMemoryDir } from '../tools/AgentTool/agentMemory.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  readUnreadMessages,
  markMessagesAsReadByPredicate,
  isShutdownApproved,
  isStructuredProtocolMessage,
  isIdleNotification,
} from './teammateMailbox.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAgentName,
  getAgentId,
  getTeamName,
  isTeamLead,
} from './teammate.js'
// 引入 isInProcessTeammate，将 ./teammateContext.js 中已经封装好的能力接到本文件流程里。
import { isInProcessTeammate } from './teammateContext.js'
// 引入 removeTeammateFromTeamFile，将 ./swarm/teamHelpers.js 中已经封装好的能力接到本文件流程里。
import { removeTeammateFromTeamFile } from './swarm/teamHelpers.js'
// 引入 unassignTeammateTasks，将 ./tasks.js 中已经封装好的能力接到本文件流程里。
import { unassignTeammateTasks } from './tasks.js'
// 引入 getCompanionIntroAttachment，将 ../buddy/prompt.js 中已经封装好的能力接到本文件流程里。
import { getCompanionIntroAttachment } from '../buddy/prompt.js'

// TODO_REMINDER_CONFIG 配置集中保存共享工具 attachments要一起传递的字段。
export const TODO_REMINDER_CONFIG = {
  TURNS_SINCE_WRITE: 10,
  TURNS_BETWEEN_REMINDERS: 10,
} as const

// PLAN_MODE_ATTACHMENT_CONFIG 配置集中保存共享工具 attachments要一起传递的字段。
export const PLAN_MODE_ATTACHMENT_CONFIG = {
  TURNS_BETWEEN_ATTACHMENTS: 5,
  FULL_REMINDER_EVERY_N_ATTACHMENTS: 5,
} as const

// AUTO_MODE_ATTACHMENT_CONFIG 配置集中保存共享工具 attachments要一起传递的字段。
export const AUTO_MODE_ATTACHMENT_CONFIG = {
  TURNS_BETWEEN_ATTACHMENTS: 5,
  FULL_REMINDER_EVERY_N_ATTACHMENTS: 5,
} as const

// MAX_MEMORY_LINES 集合 命名 `200`，让后续代码直接表达这个值的用途。
const MAX_MEMORY_LINES = 200
// Line cap alone doesn't bound size (200 × 500-char lines = 100KB).  The
// surfacer injects up to 5 files per turn via <system-reminder>, bypassing
// the per-message tool-result budget, so a tight per-file byte cap keeps
// aggregate injection bounded (5 × 4KB = 20KB/turn).  Enforced via
// readFileInRange's truncateOnByteLimit option.  Truncation means the
// most-relevant memory still surfaces: the frontmatter + opening context
// is usually what matters.
// MAX_MEMORY_BYTES 集合保存`4096`，供后续判断或组装使用。
const MAX_MEMORY_BYTES = 4096

// RELEVANT_MEMORIES_CONFIG 配置集中保存共享工具 attachments要一起传递的字段。
export const RELEVANT_MEMORIES_CONFIG = {
  // Per-turn cap (5 × 4KB = 20KB) bounds a single injection, but over a
  // long session the selector keeps surfacing distinct files — ~26K tokens/
  // session observed in prod.  Cap the cumulative bytes: once hit, stop
  // prefetching entirely.  Budget is ~3 full injections; after that the
  // most-relevant memories are already in context.  Scanning messages
  // (rather than tracking in toolUseContext) means compact naturally
  // resets the counter — old attachments are gone from context, so
  // re-surfacing is valid.
  MAX_SESSION_BYTES: 60 * 1024,
} as const

// VERIFY_PLAN_REMINDER_CONFIG 配置集中保存共享工具 attachments要一起传递的字段。
export const VERIFY_PLAN_REMINDER_CONFIG = {
  TURNS_BETWEEN_REMINDERS: 10,
} as const

// FileAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileAttachment = {
  type: 'file'
  filename: string
  content: FileReadToolOutput
  /**
   * Whether the file was truncated due to size limits
   */
  truncated?: boolean
  /** Path relative to CWD at creation time, for stable display */
  displayPath: string
}

// CompactFileReferenceAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CompactFileReferenceAttachment = {
  type: 'compact_file_reference'
  filename: string
  /** Path relative to CWD at creation time, for stable display */
  displayPath: string
}

// PDFReferenceAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PDFReferenceAttachment = {
  type: 'pdf_reference'
  filename: string
  pageCount: number
  fileSize: number
  /** Path relative to CWD at creation time, for stable display */
  displayPath: string
}

// AlreadyReadFileAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AlreadyReadFileAttachment = {
  type: 'already_read_file'
  filename: string
  content: FileReadToolOutput
  /**
   * Whether the file was truncated due to size limits
   */
  truncated?: boolean
  /** Path relative to CWD at creation time, for stable display */
  displayPath: string
}

// AgentMentionAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentMentionAttachment = {
  type: 'agent_mention'
  agentType: string
}

// AsyncHookResponseAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AsyncHookResponseAttachment = {
  type: 'async_hook_response'
  processId: string
  hookName: string
  hookEvent: HookEvent | 'StatusLine' | 'FileSuggestion'
  toolName?: string
  response: SyncHookJSONOutput
  stdout: string
  stderr: string
  exitCode?: number
}

// HookAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookAttachment =
  | HookCancelledAttachment
  | {
      type: 'hook_blocking_error'
      blockingError: HookBlockingError
      hookName: string
      toolUseID: string
      hookEvent: HookEvent
    }
  | HookNonBlockingErrorAttachment
  | HookErrorDuringExecutionAttachment
  | {
      type: 'hook_stopped_continuation'
      message: string
      hookName: string
      toolUseID: string
      hookEvent: HookEvent
    }
  | HookSuccessAttachment
  | {
      type: 'hook_additional_context'
      content: string[]
      hookName: string
      toolUseID: string
      hookEvent: HookEvent
    }
  | HookSystemMessageAttachment
  | HookPermissionDecisionAttachment

// HookPermissionDecisionAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookPermissionDecisionAttachment = {
  type: 'hook_permission_decision'
  decision: 'allow' | 'deny'
  toolUseID: string
  hookEvent: HookEvent
}

// HookSystemMessageAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookSystemMessageAttachment = {
  type: 'hook_system_message'
  content: string
  hookName: string
  toolUseID: string
  hookEvent: HookEvent
}

// HookCancelledAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookCancelledAttachment = {
  type: 'hook_cancelled'
  hookName: string
  toolUseID: string
  hookEvent: HookEvent
  command?: string
  durationMs?: number
}

// HookErrorDuringExecutionAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookErrorDuringExecutionAttachment = {
  type: 'hook_error_during_execution'
  content: string
  hookName: string
  toolUseID: string
  hookEvent: HookEvent
  command?: string
  durationMs?: number
}

// HookSuccessAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookSuccessAttachment = {
  type: 'hook_success'
  content: string
  hookName: string
  toolUseID: string
  hookEvent: HookEvent
  stdout?: string
  stderr?: string
  exitCode?: number
  command?: string
  durationMs?: number
}

// HookNonBlockingErrorAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type HookNonBlockingErrorAttachment = {
  type: 'hook_non_blocking_error'
  hookName: string
  stderr: string
  stdout: string
  exitCode: number
  toolUseID: string
  hookEvent: HookEvent
  command?: string
  durationMs?: number
}

// Attachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Attachment =
  /**
   * User at-mentioned the file
   */
  | FileAttachment
  | CompactFileReferenceAttachment
  | PDFReferenceAttachment
  | AlreadyReadFileAttachment
  /**
   * An at-mentioned file was edited
   */
  | {
      type: 'edited_text_file'
      filename: string
      snippet: string
    }
  | {
      type: 'edited_image_file'
      filename: string
      content: FileReadToolOutput
    }
  | {
      type: 'directory'
      path: string
      content: string
      /** Path relative to CWD at creation time, for stable display */
      displayPath: string
    }
  | {
      type: 'selected_lines_in_ide'
      ideName: string
      lineStart: number
      lineEnd: number
      filename: string
      content: string
      /** Path relative to CWD at creation time, for stable display */
      displayPath: string
    }
  | {
      type: 'opened_file_in_ide'
      filename: string
    }
  | {
      type: 'todo_reminder'
      content: TodoList
      itemCount: number
    }
  | {
      type: 'task_reminder'
      content: Task[]
      itemCount: number
    }
  | {
      type: 'nested_memory'
      path: string
      content: MemoryFileInfo
      /** Path relative to CWD at creation time, for stable display */
      displayPath: string
    }
  | {
      type: 'relevant_memories'
      memories: {
        path: string
        content: string
        mtimeMs: number
        /**
         * Pre-computed header string (age + path prefix).  Computed once
         * at attachment-creation time so the rendered bytes are stable
         * across turns — recomputing memoryAge(mtimeMs) at render time
         * calls Date.now(), so "saved 3 days ago" becomes "saved 4 days
         * ago" across turns → different bytes → prompt cache bust.
         * Optional for backward compat with resumed sessions; render
         * path falls back to recomputing if missing.
         */
        header?: string
        /**
         * lineCount when the file was truncated by readMemoriesForSurfacing,
         * else undefined. Threaded to the readFileState write so
         * getChangedFiles skips truncated memories (partial content would
         * yield a misleading diff).
         */
        limit?: number
      }[]
    }
  | {
      type: 'dynamic_skill'
      skillDir: string
      skillNames: string[]
      /** Path relative to CWD at creation time, for stable display */
      displayPath: string
    }
  | {
      type: 'skill_listing'
      content: string
      skillCount: number
      isInitial: boolean
    }
  | {
      type: 'skill_discovery'
      skills: { name: string; description: string; shortId?: string }[]
      signal: DiscoverySignal
      source: 'native' | 'aki' | 'both'
    }
  | {
      type: 'queued_command'
      prompt: string | Array<ContentBlockParam>
      source_uuid?: UUID
      imagePasteIds?: number[]
      /** Original queue mode — 'prompt' for user messages, 'task-notification' for system events */
      commandMode?: string
      /** Provenance carried from QueuedCommand so mid-turn drains preserve it */
      origin?: MessageOrigin
      /** Carried from QueuedCommand.isMeta — distinguishes human-typed from system-injected */
      isMeta?: boolean
    }
  | {
      type: 'output_style'
      style: string
    }
  | {
      type: 'diagnostics'
      files: DiagnosticFile[]
      isNew: boolean
    }
  | {
      type: 'plan_mode'
      reminderType: 'full' | 'sparse'
      isSubAgent?: boolean
      planFilePath: string
      planExists: boolean
    }
  | {
      type: 'plan_mode_reentry'
      planFilePath: string
    }
  | {
      type: 'plan_mode_exit'
      planFilePath: string
      planExists: boolean
    }
  | {
      type: 'auto_mode'
      reminderType: 'full' | 'sparse'
    }
  | {
      type: 'auto_mode_exit'
    }
  | {
      type: 'critical_system_reminder'
      content: string
    }
  | {
      type: 'plan_file_reference'
      planFilePath: string
      planContent: string
    }
  | {
      type: 'mcp_resource'
      server: string
      uri: string
      name: string
      description?: string
      content: ReadResourceResult
    }
  | {
      type: 'command_permissions'
      allowedTools: string[]
      model?: string
    }
  | AgentMentionAttachment
  | {
      type: 'task_status'
      taskId: string
      taskType: TaskType
      status: TaskStatus
      description: string
      deltaSummary: string | null
      outputFilePath?: string
    }
  | AsyncHookResponseAttachment
  | {
      type: 'token_usage'
      used: number
      total: number
      remaining: number
    }
  | {
      type: 'budget_usd'
      used: number
      total: number
      remaining: number
    }
  | {
      type: 'output_token_usage'
      turn: number
      session: number
      budget: number | null
    }
  | {
      type: 'structured_output'
      data: unknown
    }
  | TeammateMailboxAttachment
  | TeamContextAttachment
  | HookAttachment
  | {
      type: 'invoked_skills'
      skills: Array<{
        name: string
        path: string
        content: string
      }>
    }
  | {
      type: 'verify_plan_reminder'
    }
  | {
      type: 'max_turns_reached'
      maxTurns: number
      turnCount: number
    }
  | {
      type: 'current_session_memory'
      content: string
      path: string
      tokenCount: number
    }
  | {
      type: 'teammate_shutdown_batch'
      count: number
    }
  | {
      type: 'compaction_reminder'
    }
  | {
      type: 'context_efficiency'
    }
  | {
      type: 'date_change'
      newDate: string
    }
  | {
      type: 'ultrathink_effort'
      level: 'high'
    }
  | {
      type: 'deferred_tools_delta'
      addedNames: string[]
      addedLines: string[]
      removedNames: string[]
    }
  | {
      type: 'agent_listing_delta'
      addedTypes: string[]
      addedLines: string[]
      removedTypes: string[]
      /** True when this is the first announcement in the conversation */
      isInitial: boolean
      /** Whether to include the "launch multiple agents concurrently" note (non-pro subscriptions) */
      showConcurrencyNote: boolean
    }
  | {
      type: 'mcp_instructions_delta'
      addedNames: string[]
      addedBlocks: string[]
      removedNames: string[]
    }
  | {
      type: 'companion_intro'
      name: string
      species: string
    }
  | {
      type: 'bagel_console'
      errorCount: number
      warningCount: number
      sample: string
    }

// TeammateMailboxAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateMailboxAttachment = {
  type: 'teammate_mailbox'
  messages: Array<{
    from: string
    text: string
    timestamp: string
    color?: string
    summary?: string
  }>
}

// TeamContextAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeamContextAttachment = {
  type: 'team_context'
  agentId: string
  agentName: string
  teamName: string
  teamConfigPath: string
  taskListPath: string
}

/**
 * This is janky
 * TODO: Generate attachments when we create messages
 */
// getAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAttachments(
  input: string | null,
  toolUseContext: ToolUseContext,
  ideSelection: IDESelection | null,
  queuedCommands: QueuedCommand[],
  messages?: Message[],
  querySource?: QuerySource,
  options?: { skipSkillDiscovery?: boolean },
): Promise<Attachment[]> {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_ATTACHMENTS) ||
    isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)
  ) {
    // query.ts:removeFromQueue dequeues these unconditionally after
    // getAttachmentMessages runs — returning [] here silently drops them.
    // Coworker runs with --bare and depends on task-notification for
    // mid-tool-call notifications from Local*Task/Remote*Task.
    // 返回 `getQueuedCommandAttachments(queuedCommands)`，作为共享工具这次计算的结果。
    return getQueuedCommandAttachments(queuedCommands)
  }

  // This will slow down submissions
  // TODO: Compute attachments as the user types, not here (though we use this
  // function for slash command prompts too)
  // abortController构建`createAbortController`，供共享工具后续处理使用。
  const abortController = createAbortController()
  // timeoutId保存`setTimeout`，供共享工具后续处理使用。
  const timeoutId = setTimeout(ac => ac.abort(), 1000, abortController)
  // context集中保存共享工具 attachments要一起传递的字段。
  const context = { ...toolUseContext, abortController }

  // isMainThread标记共享工具 attachments是否启用对应路径。
  const isMainThread = !toolUseContext.agentId

  // Attachments which are added in response to on user input
  // userInputAttachments 集合 命名 `input`，让后续代码直接表达这个值的用途。
  const userInputAttachments = input
    ? [
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('at_mentioned_files', () =>
          processAtMentionedFiles(input, context),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('mcp_resources', () =>
          processMcpResourceAttachments(input, context),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('agent_mentions', () =>
          Promise.resolve(
            processAgentMentions(
              input,
              toolUseContext.options.agentDefinitions.activeAgents,
            ),
          ),
        ),
        // Skill discovery on turn 0 (user input as signal). Inter-turn
        // discovery runs via startSkillDiscoveryPrefetch in query.ts,
        // gated on write-pivot detection — see skillSearch/prefetch.ts.
        // feature() here lets DCE drop the 'skill_discovery' string (and the
        // function it calls) from external builds.
        //
        // skipSkillDiscovery gates out the SKILL.md-expansion path
        // (getMessagesForPromptSlashCommand). When a skill is invoked, its
        // SKILL.md content is passed as `input` here to extract @-mentions —
        // but that content is NOT user intent and must not trigger discovery.
        // Without this gate, a 110KB SKILL.md fires ~3.3s of chunked AKI
        // queries on every skill invocation (session 13a9afae).
        ...(feature('EXPERIMENTAL_SKILL_SEARCH') &&
        skillSearchModules &&
        !options?.skipSkillDiscovery
          ? [
              // 调用 maybe，触发共享工具此处需要的副作用。
              maybe('skill_discovery', () =>
                skillSearchModules.prefetch.getTurnZeroSkillDiscovery(
                  input,
                  messages ?? [],
                  context,
                ),
              ),
            ]
          : []),
      ]
    : []

  // Process user input attachments first (includes @mentioned files)
  // This ensures files are added to nestedMemoryAttachmentTriggers before nested_memory processes them
  // userAttachmentResults 集合保存`Promise.all`，供共享工具后续处理使用。
  const userAttachmentResults = await Promise.all(userInputAttachments)

  // Thread-safe attachments available in sub-agents
  // NOTE: These must be created AFTER userInputAttachments completes to ensure
  // nestedMemoryAttachmentTriggers is populated before getNestedMemoryAttachments runs
  // allThreadAttachments 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const allThreadAttachments = [
    // queuedCommands is already agent-scoped by the drain gate in query.ts —
    // main thread gets agentId===undefined, subagents get their own agentId.
    // Must run for all threads or subagent notifications drain into the void
    // (removed from queue by removeFromQueue but never attached).
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('queued_commands', () => getQueuedCommandAttachments(queuedCommands)),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('date_change', () =>
      Promise.resolve(getDateChangeAttachments(messages)),
    ),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('ultrathink_effort', () =>
      Promise.resolve(getUltrathinkEffortAttachment(input)),
    ),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('deferred_tools_delta', () =>
      Promise.resolve(
        getDeferredToolsDeltaAttachment(
          toolUseContext.options.tools,
          toolUseContext.options.mainLoopModel,
          messages,
          {
            callSite: isMainThread
              ? 'attachments_main'
              : 'attachments_subagent',
            querySource,
          },
        ),
      ),
    ),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('agent_listing_delta', () =>
      Promise.resolve(getAgentListingDeltaAttachment(toolUseContext, messages)),
    ),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('mcp_instructions_delta', () =>
      Promise.resolve(
        getMcpInstructionsDeltaAttachment(
          toolUseContext.options.mcpClients,
          toolUseContext.options.tools,
          toolUseContext.options.mainLoopModel,
          messages,
        ),
      ),
    ),
    ...(isBuddyEnabled()
      ? [
          // 调用 maybe，触发共享工具此处需要的副作用。
          maybe('companion_intro', () =>
            Promise.resolve(getCompanionIntroAttachment(messages)),
          ),
        ]
      : []),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('changed_files', () => getChangedFiles(context)),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('nested_memory', () => getNestedMemoryAttachments(context)),
    // relevant_memories moved to async prefetch (startRelevantMemoryPrefetch)
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('dynamic_skill', () => getDynamicSkillAttachments(context)),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('skill_listing', () => getSkillListingAttachments(context)),
    // Inter-turn skill discovery now runs via startSkillDiscoveryPrefetch
    // (query.ts, concurrent with the main turn). The blocking call that
    // previously lived here was the assistant_turn signal — 97% of those
    // Haiku calls found nothing in prod. Prefetch + await-at-collection
    // replaces it; see src/services/skillSearch/prefetch.ts.
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('plan_mode', () => getPlanModeAttachments(messages, toolUseContext)),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('plan_mode_exit', () => getPlanModeExitAttachment(toolUseContext)),
    ...(feature('TRANSCRIPT_CLASSIFIER')
      ? [
          // 调用 maybe，触发共享工具此处需要的副作用。
          maybe('auto_mode', () =>
            getAutoModeAttachments(messages, toolUseContext),
          ),
          // 调用 maybe，触发共享工具此处需要的副作用。
          maybe('auto_mode_exit', () =>
            getAutoModeExitAttachment(toolUseContext),
          ),
        ]
      : []),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('todo_reminders', () =>
      isTodoV2Enabled()
        ? getTaskReminderAttachments(messages, toolUseContext)
        : getTodoReminderAttachments(messages, toolUseContext),
    ),
    ...(isAgentSwarmsEnabled()
      ? [
          // Skip teammate mailbox for the session_memory forked agent.
          // It shares AppState.teamContext with the leader, so isTeamLead resolves
          // true and it reads+marks-as-read the leader's DMs as ephemeral attachments,
          // silently stealing messages that should be delivered as permanent turns.
          ...(querySource === 'session_memory'
            ? []
            : [
                // 调用 maybe，触发共享工具此处需要的副作用。
                maybe('teammate_mailbox', async () =>
                  getTeammateMailboxAttachments(toolUseContext),
                ),
              ]),
          // 调用 maybe，触发共享工具此处需要的副作用。
          maybe('team_context', async () =>
            getTeamContextAttachment(messages ?? []),
          ),
        ]
      : []),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('agent_pending_messages', async () =>
      getAgentPendingMessageAttachments(toolUseContext),
    ),
    // 调用 maybe，触发共享工具此处需要的副作用。
    maybe('critical_system_reminder', () =>
      Promise.resolve(getCriticalSystemReminderAttachment(toolUseContext)),
    ),
    ...(feature('COMPACTION_REMINDERS')
      ? [
          // 调用 maybe，触发共享工具此处需要的副作用。
          maybe('compaction_reminder', () =>
            Promise.resolve(
              getCompactionReminderAttachment(
                messages ?? [],
                toolUseContext.options.mainLoopModel,
              ),
            ),
          ),
        ]
      : []),
    ...(feature('HISTORY_SNIP')
      ? [
          // 调用 maybe，触发共享工具此处需要的副作用。
          maybe('context_efficiency', () =>
            Promise.resolve(getContextEfficiencyAttachment(messages ?? [])),
          ),
        ]
      : []),
  ]

  // Attachments which are semantically only for the main conversation or don't have concurrency-safe implementations
  // mainThreadAttachments 集合 命名 `isMainThread`，让后续代码直接表达这个值的用途。
  const mainThreadAttachments = isMainThread
    ? [
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('ide_selection', async () =>
          getSelectedLinesFromIDE(ideSelection, toolUseContext),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('ide_opened_file', async () =>
          getOpenedFileFromIDE(ideSelection, toolUseContext),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('output_style', async () =>
          Promise.resolve(getOutputStyleAttachment()),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('diagnostics', async () =>
          getDiagnosticAttachments(toolUseContext),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('lsp_diagnostics', async () =>
          getLSPDiagnosticAttachments(toolUseContext),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('unified_tasks', async () =>
          getUnifiedTaskAttachments(toolUseContext),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('async_hook_responses', async () =>
          getAsyncHookResponseAttachments(),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('token_usage', async () =>
          Promise.resolve(
            getTokenUsageAttachment(
              messages ?? [],
              toolUseContext.options.mainLoopModel,
            ),
          ),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('budget_usd', async () =>
          Promise.resolve(
            getMaxBudgetUsdAttachment(toolUseContext.options.maxBudgetUsd),
          ),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('output_token_usage', async () =>
          Promise.resolve(getOutputTokenUsageAttachment()),
        ),
        // 调用 maybe，触发共享工具此处需要的副作用。
        maybe('verify_plan_reminder', async () =>
          getVerifyPlanReminderAttachment(messages, toolUseContext),
        ),
      ]
    : []

  // Process thread and main thread attachments in parallel (no dependencies between them)
  // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
  const [threadAttachmentResults, mainThreadAttachmentResults] =
    await Promise.all([
      Promise.all(allThreadAttachments),
      Promise.all(mainThreadAttachments),
    ])

  // 调用 clearTimeout，触发共享工具此处需要的副作用。
  clearTimeout(timeoutId)
  // Defensive: a getter leaking [undefined] crashes .map(a => a.type) below.
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    ...userAttachmentResults.flat(),
    ...threadAttachmentResults.flat(),
    ...mainThreadAttachmentResults.flat(),
  // 这个回调绑定到 ].filter(a => a !== undefined && a !== null)，负责共享工具在该局部场景下的响应。
  ].filter(a => a !== undefined && a !== null)
}

// maybe 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function maybe<A>(label: string, f: () => Promise<A[]>): Promise<A[]> {
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`f`，供共享工具后续处理使用。
    const result = await f()
    // duration记录时间`Date.now`，供共享工具后续处理使用。
    const duration = Date.now() - startTime
    // Log only 5% of events to reduce volume
    // 满足 `Math.random() < 0.05` 时，共享工具执行该分支。
    if (Math.random() < 0.05) {
      // jsonStringify(undefined) returns undefined, so .length would throw
      // attachmentSizeBytes 集合保存`result`，供后续判断或组装使用。
      const attachmentSizeBytes = result
        // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
        .filter(a => a !== undefined && a !== null)
        // 链式调用 reduce，继续加工上一行在共享工具中产生的数据。
        .reduce((total, attachment) => {
          // 返回 `total + jsonStringify(attachment).length`，作为共享工具这次计算的结果。
          return total + jsonStringify(attachment).length
        }, 0)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_attachment_compute_duration', {
        label,
        duration_ms: duration,
        attachment_size_bytes: attachmentSizeBytes,
        attachment_count: result.length,
      } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
    }
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  } catch (e) {
    // duration记录时间`Date.now`，供共享工具后续处理使用。
    const duration = Date.now() - startTime
    // Log only 5% of events to reduce volume
    // 满足 `Math.random() < 0.05` 时，共享工具执行该分支。
    if (Math.random() < 0.05) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_attachment_compute_duration', {
        label,
        duration_ms: duration,
        error: true,
      } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // For Ant users, log the full error to help with debugging
    // 调用 logAntError，触发共享工具此处需要的副作用。
    logAntError(`Attachment error in ${label}`, e)

    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

// INLINE_NOTIFICATION_MODES 集合保存`Set`，供共享工具后续处理使用。
const INLINE_NOTIFICATION_MODES = new Set(['prompt', 'task-notification'])

// getQueuedCommandAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getQueuedCommandAttachments(
  queuedCommands: QueuedCommand[],
): Promise<Attachment[]> {
  // queuedCommands 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!queuedCommands) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // Include both 'prompt' and 'task-notification' commands as attachments.
  // During proactive agentic loops, task-notification commands would otherwise
  // stay in the queue permanently (useQueueProcessor can't run while a query
  // is active), causing hasPendingNotifications() to return true and Sleep to
  // wake immediately with 0ms duration in an infinite loop.
  // filtered筛选`queuedCommands.filter`，供共享工具后续处理使用。
  const filtered = queuedCommands.filter(_ =>
    INLINE_NOTIFICATION_MODES.has(_.mode),
  )
  // 返回 `Promise.all(`，作为共享工具这次计算的结果。
  return Promise.all(
    // 调用 filtered.map，触发共享工具此处需要的副作用。
    filtered.map(async _ => {
      // imageBlocks 集合构建`buildImageContentBlocks`，供共享工具后续处理使用。
      const imageBlocks = await buildImageContentBlocks(_.pastedContents)
      // 提示词 命名 `_.value`，让后续代码直接表达这个值的用途。
      let prompt: string | Array<ContentBlockParam> = _.value
      // 满足 `imageBlocks.length > 0` 时，共享工具执行该分支。
      if (imageBlocks.length > 0) {
        // Build content block array with text + images so the model sees them
        // textValue 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const textValue =
          typeof _.value === 'string'
            ? _.value
            : extractTextContent(_.value, '\n')
        // 提示词更新为 `[{ type: 'text' as const, text: textValue }, ...imageBloc...`，确保共享工具后续读取最新状态。
        prompt = [{ type: 'text' as const, text: textValue }, ...imageBlocks]
      }
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        type: 'queued_command' as const,
        prompt,
        source_uuid: _.uuid,
        imagePasteIds: getImagePasteIds(_.pastedContents),
        commandMode: _.mode,
        origin: _.origin,
        isMeta: _.isMeta,
      }
    }),
  )
}

// getAgentPendingMessageAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentPendingMessageAttachments(
  toolUseContext: ToolUseContext,
): Attachment[] {
  // agentId保存`toolUseContext.agentId`，供后续判断或组装使用。
  const agentId = toolUseContext.agentId
  // agentId缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!agentId) return []
  // drained保存`drainPendingMessages`，供共享工具后续处理使用。
  const drained = drainPendingMessages(
    agentId,
    toolUseContext.getAppState,
    toolUseContext.setAppStateForTasks ?? toolUseContext.setAppState,
  )
  // 返回 `drained.map(msg => ({`，作为共享工具这次计算的结果。
  return drained.map(msg => ({
    type: 'queued_command' as const,
    prompt: msg,
    origin: { kind: 'coordinator' as const },
    isMeta: true,
  }))
}

// buildImageContentBlocks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function buildImageContentBlocks(
  pastedContents: Record<number, PastedContent> | undefined,
): Promise<ImageBlockParam[]> {
  // pastedContents 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!pastedContents) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // imageContents 集合派生`Object.values`，供共享工具后续处理使用。
  const imageContents = Object.values(pastedContents).filter(isValidImagePaste)
  // imageContents 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (imageContents.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 imageContents.map，触发共享工具此处需要的副作用。
    imageContents.map(async img => {
      // imageBlock 集中保存共享工具 attachments要一起传递的字段。
      const imageBlock: ImageBlockParam = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: (img.mediaType ||
            'image/png') as Base64ImageSource['media_type'],
          data: img.content,
        },
      }
      // resized统计`maybeResizeAndDownsampleImageBlock`，供共享工具后续处理使用。
      const resized = await maybeResizeAndDownsampleImageBlock(imageBlock)
      // 返回 `resized.block`，作为共享工具这次计算的结果。
      return resized.block
    }),
  )
  // 返回 `results`，作为共享工具这次计算的结果。
  return results
}

// getPlanModeAttachmentTurnCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPlanModeAttachmentTurnCount(messages: Message[]): {
  turnCount: number
  foundPlanModeAttachment: boolean
} {
  // turnsSinceLastAttachment保存`0`，供共享工具 attachments后续判断或输出使用。
  let turnsSinceLastAttachment = 0
  // foundPlanModeAttachment标记共享工具 attachments是否启用对应路径。
  let foundPlanModeAttachment = false

  // Iterate backwards to find most recent plan_mode attachment.
  // Count HUMAN turns (non-meta, non-tool-result user messages), not assistant
  // messages — the tool loop in query.ts calls getAttachmentMessages on every
  // tool round, so counting assistant messages would fire the reminder every
  // 5 tool calls instead of every 5 human turns.
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
    const message = messages[i]

    // 共享工具在这里按实际状态进入对应分支。
    if (
      message?.type === 'user' &&
      !message.isMeta &&
      !hasToolResultContent(message.message.content)
    ) {
      // 共享工具 attachments在这里处理 `turnsSinceLastAttachment++`，完成这一小步状态转换。
      turnsSinceLastAttachment++
    // 共享工具 attachments在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      message?.type === 'attachment' &&
      (message.attachment.type === 'plan_mode' ||
        message.attachment.type === 'plan_mode_reentry')
    ) {
      // foundPlanModeAttachment更新为 `true`，确保共享工具后续读取最新状态。
      foundPlanModeAttachment = true
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { turnCount: turnsSinceLastAttachment, foundPlanModeAttachment }
}

/**
 * Count plan_mode attachments since the last plan_mode_exit (or from start if no exit).
 * This ensures the full/sparse cycle resets when re-entering plan mode.
 */
// countPlanModeAttachmentsSinceLastExit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countPlanModeAttachmentsSinceLastExit(messages: Message[]): number {
  // count 数量保存`0`，供共享工具 attachments后续判断或输出使用。
  let count = 0
  // Iterate backwards - if we hit a plan_mode_exit, stop counting
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
    const message = messages[i]
    // 当 `message?.type` 匹配 `'attachment'` 时，共享工具执行对应分支。
    if (message?.type === 'attachment') {
      // 当 `message.attachment.type` 匹配 `'plan_mode_exit'` 时，共享工具执行对应分支。
      if (message.attachment.type === 'plan_mode_exit') {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break // Stop counting at the last exit
      }
      // 当 `message.attachment.type` 匹配 `'plan_mode'` 时，共享工具执行对应分支。
      if (message.attachment.type === 'plan_mode') {
        // 共享工具 attachments在这里处理 `count++`，完成这一小步状态转换。
        count++
      }
    }
  }
  // 返回 `count`，作为共享工具这次计算的结果。
  return count
}

// getPlanModeAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getPlanModeAttachments(
  messages: Message[] | undefined,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // permissionContext 权限数据 命名 `appState.toolPermissionContext`，让后续代码直接表达这个值的用途。
  const permissionContext = appState.toolPermissionContext
  // `permissionContext.mode` 与 `'plan'` 不一致时刷新派生状态，避免使用过期结果。
  if (permissionContext.mode !== 'plan') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Check if we should attach based on turn count (except for first turn)
  // 只有 `messages && messages.length > 0` 满足时，共享工具才执行该分支。
  if (messages && messages.length > 0) {
    // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
    const { turnCount, foundPlanModeAttachment } =
      getPlanModeAttachmentTurnCount(messages)
    // Only throttle if we've already sent a plan_mode attachment before
    // On first turn in plan mode, always attach
    // 共享工具在这里按实际状态进入对应分支。
    if (
      foundPlanModeAttachment &&
      turnCount < PLAN_MODE_ATTACHMENT_CONFIG.TURNS_BETWEEN_ATTACHMENTS
    ) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
  }

  // planFilePath 路径数据读取`getPlanFilePath`，供共享工具后续处理使用。
  const planFilePath = getPlanFilePath(toolUseContext.agentId)
  // existingPlan读取`getPlan`，供共享工具后续处理使用。
  const existingPlan = getPlan(toolUseContext.agentId)

  // attachments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const attachments: Attachment[] = []

  // Check for re-entry: flag is set AND plan file exists
  // `hasExitedPlanModeInSession() && existingPlan` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (hasExitedPlanModeInSession() && existingPlan !== null) {
    // attachments 集合追加新条目，保持收集顺序与输入顺序一致。
    attachments.push({ type: 'plan_mode_reentry', planFilePath })
    // setHasExitedPlanMode 写入新的状态值，使共享工具后续读取保持一致。
    setHasExitedPlanMode(false) // Clear flag - one-time guidance
  }

  // Determine if this should be a full or sparse reminder
  // Full reminder on 1st, 6th, 11th... (every Nth attachment)
  // attachmentCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const attachmentCount =
    countPlanModeAttachmentsSinceLastExit(messages ?? []) + 1
  // reminderType 先占位，稍后的条件分支会根据实际输入补齐它。
  const reminderType: 'full' | 'sparse' =
    attachmentCount %
      PLAN_MODE_ATTACHMENT_CONFIG.FULL_REMINDER_EVERY_N_ATTACHMENTS ===
    1
      ? 'full'
      : 'sparse'

  // Always add the main plan_mode attachment
  // attachments 集合追加新条目，保持收集顺序与输入顺序一致。
  attachments.push({
    type: 'plan_mode',
    reminderType,
    isSubAgent: !!toolUseContext.agentId,
    planFilePath,
    planExists: existingPlan !== null,
  })

  // 返回 `attachments`，作为共享工具这次计算的结果。
  return attachments
}

/**
 * Returns a plan_mode_exit attachment if we just exited plan mode.
 * This is a one-time notification to tell the model it's no longer in plan mode.
 */
// getPlanModeExitAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getPlanModeExitAttachment(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // Only trigger if the flag is set (we just exited plan mode)
  // 满足 `!needsPlanModeExitAttachment()` 时，共享工具执行该分支。
  if (!needsPlanModeExitAttachment()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // 当 `appState.toolPermissionContext.mode` 匹配 `'plan'` 时，共享工具执行对应分支。
  if (appState.toolPermissionContext.mode === 'plan') {
    // setNeedsPlanModeExitAttachment 写入新的状态值，使共享工具后续读取保持一致。
    setNeedsPlanModeExitAttachment(false)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Clear the flag - this is a one-time notification
  // setNeedsPlanModeExitAttachment 写入新的状态值，使共享工具后续读取保持一致。
  setNeedsPlanModeExitAttachment(false)

  // planFilePath 路径数据读取`getPlanFilePath`，供共享工具后续处理使用。
  const planFilePath = getPlanFilePath(toolUseContext.agentId)
  // planExists 集合读取`getPlan`，供共享工具后续处理使用。
  const planExists = getPlan(toolUseContext.agentId) !== null

  // Note: skill discovery does NOT fire on plan exit. By the time the plan is
  // written, it's too late — the model should have had relevant skills WHILE
  // planning. The user_message signal already fires on the request that
  // triggers planning ("plan how to deploy this"), which is the right moment.
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'plan_mode_exit', planFilePath, planExists }]
}

// getAutoModeAttachmentTurnCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAutoModeAttachmentTurnCount(messages: Message[]): {
  turnCount: number
  foundAutoModeAttachment: boolean
} {
  // turnsSinceLastAttachment保存`0`，供共享工具 attachments后续判断或输出使用。
  let turnsSinceLastAttachment = 0
  // foundAutoModeAttachment标记共享工具 attachments是否启用对应路径。
  let foundAutoModeAttachment = false

  // Iterate backwards to find most recent auto_mode attachment.
  // Count HUMAN turns (non-meta, non-tool-result user messages), not assistant
  // messages — the tool loop in query.ts calls getAttachmentMessages on every
  // tool round, so a single human turn with 100 tool calls would fire ~20
  // reminders if we counted assistant messages. Auto mode's target use case is
  // long agentic sessions, where this accumulated 60-105× per session.
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
    const message = messages[i]

    // 共享工具在这里按实际状态进入对应分支。
    if (
      message?.type === 'user' &&
      !message.isMeta &&
      !hasToolResultContent(message.message.content)
    ) {
      // 共享工具 attachments在这里处理 `turnsSinceLastAttachment++`，完成这一小步状态转换。
      turnsSinceLastAttachment++
    // 共享工具 attachments在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      message?.type === 'attachment' &&
      message.attachment.type === 'auto_mode'
    ) {
      // foundAutoModeAttachment更新为 `true`，确保共享工具后续读取最新状态。
      foundAutoModeAttachment = true
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    // 共享工具 attachments在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      message?.type === 'attachment' &&
      message.attachment.type === 'auto_mode_exit'
    ) {
      // Exit resets the throttle — treat as if no prior attachment exists
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { turnCount: turnsSinceLastAttachment, foundAutoModeAttachment }
}

/**
 * Count auto_mode attachments since the last auto_mode_exit (or from start if no exit).
 * This ensures the full/sparse cycle resets when re-entering auto mode.
 */
// countAutoModeAttachmentsSinceLastExit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countAutoModeAttachmentsSinceLastExit(messages: Message[]): number {
  // count 数量保存`0`，供共享工具 attachments后续判断或输出使用。
  let count = 0
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
    const message = messages[i]
    // 当 `message?.type` 匹配 `'attachment'` 时，共享工具执行对应分支。
    if (message?.type === 'attachment') {
      // 当 `message.attachment.type` 匹配 `'auto_mode_exit'` 时，共享工具执行对应分支。
      if (message.attachment.type === 'auto_mode_exit') {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // 当 `message.attachment.type` 匹配 `'auto_mode'` 时，共享工具执行对应分支。
      if (message.attachment.type === 'auto_mode') {
        // 共享工具 attachments在这里处理 `count++`，完成这一小步状态转换。
        count++
      }
    }
  }
  // 返回 `count`，作为共享工具这次计算的结果。
  return count
}

// getAutoModeAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getAutoModeAttachments(
  messages: Message[] | undefined,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // permissionContext 权限数据 命名 `appState.toolPermissionContext`，让后续代码直接表达这个值的用途。
  const permissionContext = appState.toolPermissionContext
  // inAuto标记共享工具 attachments是否启用对应路径。
  const inAuto = permissionContext.mode === 'auto'
  // inPlanWithAuto 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const inPlanWithAuto =
    permissionContext.mode === 'plan' &&
    (autoModeStateModule?.isAutoModeActive() ?? false)
  // 只有 `!inAuto && !inPlanWithAuto` 满足时，共享工具才执行该分支。
  if (!inAuto && !inPlanWithAuto) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Check if we should attach based on turn count (except for first turn)
  // 只有 `messages && messages.length > 0` 满足时，共享工具才执行该分支。
  if (messages && messages.length > 0) {
    // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
    const { turnCount, foundAutoModeAttachment } =
      getAutoModeAttachmentTurnCount(messages)
    // Only throttle if we've already sent an auto_mode attachment before
    // On first turn in auto mode, always attach
    // 共享工具在这里按实际状态进入对应分支。
    if (
      foundAutoModeAttachment &&
      turnCount < AUTO_MODE_ATTACHMENT_CONFIG.TURNS_BETWEEN_ATTACHMENTS
    ) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
  }

  // Determine if this should be a full or sparse reminder
  // attachmentCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const attachmentCount =
    countAutoModeAttachmentsSinceLastExit(messages ?? []) + 1
  // reminderType 先占位，稍后的条件分支会根据实际输入补齐它。
  const reminderType: 'full' | 'sparse' =
    attachmentCount %
      AUTO_MODE_ATTACHMENT_CONFIG.FULL_REMINDER_EVERY_N_ATTACHMENTS ===
    1
      ? 'full'
      : 'sparse'

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'auto_mode', reminderType }]
}

/**
 * Returns an auto_mode_exit attachment if we just exited auto mode.
 * This is a one-time notification to tell the model it's no longer in auto mode.
 */
// getAutoModeExitAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getAutoModeExitAttachment(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // 满足 `!needsAutoModeExitAttachment()` 时，共享工具执行该分支。
  if (!needsAutoModeExitAttachment()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // Suppress when auto is still active — covers both mode==='auto' and
  // plan-with-auto-active (where mode==='plan' but classifier runs).
  // 共享工具在这里按实际状态进入对应分支。
  if (
    appState.toolPermissionContext.mode === 'auto' ||
    (autoModeStateModule?.isAutoModeActive() ?? false)
  ) {
    // setNeedsAutoModeExitAttachment 写入新的状态值，使共享工具后续读取保持一致。
    setNeedsAutoModeExitAttachment(false)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // setNeedsAutoModeExitAttachment 写入新的状态值，使共享工具后续读取保持一致。
  setNeedsAutoModeExitAttachment(false)
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'auto_mode_exit' }]
}

/**
 * Detects when the local date has changed since the last turn (user coding
 * past midnight) and emits an attachment to notify the model.
 *
 * The date_change attachment is appended at the tail of the conversation,
 * so the model learns the new date without mutating the cached prefix.
 * messages[0] (from getUserContext → prependUserContext) intentionally
 * keeps the stale date — clearing that cache would regenerate the prefix
 * and turn the entire conversation into cache_creation on the next turn
 * (~920K effective tokens per midnight crossing per overnight session).
 *
 * Exported for testing — regression guard for the cache-clear removal.
 */
// getDateChangeAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDateChangeAttachments(
  messages: Message[] | undefined,
): Attachment[] {
  // currentDate读取`getLocalISODate`，供共享工具后续处理使用。
  const currentDate = getLocalISODate()
  // lastDate读取`getLastEmittedDate`，供共享工具后续处理使用。
  const lastDate = getLastEmittedDate()

  // 满足 `lastDate === null` 时，共享工具执行该分支。
  if (lastDate === null) {
    // First turn — just record, no attachment needed
    // setLastEmittedDate 写入新的状态值，使共享工具后续读取保持一致。
    setLastEmittedDate(currentDate)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 满足 `currentDate === lastDate` 时，共享工具执行该分支。
  if (currentDate === lastDate) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // setLastEmittedDate 写入新的状态值，使共享工具后续读取保持一致。
  setLastEmittedDate(currentDate)

  // Assistant mode: flush yesterday's transcript to the per-day file so
  // the /dream skill (1–5am local) finds it even if no compaction fires
  // today. Fire-and-forget; writeSessionTranscriptSegment buckets by
  // message timestamp so a multi-day gap flushes each day correctly.
  // 满足 `feature('KAIROS')` 时，共享工具执行该分支。
  if (feature('KAIROS')) {
    // `getKairosActive() && messages` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (getKairosActive() && messages !== undefined) {
      // 调用 sessionTranscriptModule?.flushOnDateChange(messages, currentDate)，完成这一处局部操作。
      sessionTranscriptModule?.flushOnDateChange(messages, currentDate)
    }
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'date_change', newDate: currentDate }]
}

// getUltrathinkEffortAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUltrathinkEffortAttachment(input: string | null): Attachment[] {
  // 只有 `!isUltrathinkEnabled() || !input || !hasUltrathinkKeyword(input)` 满足时，共享工具才执行该分支。
  if (!isUltrathinkEnabled() || !input || !hasUltrathinkKeyword(input)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_ultrathink', {})
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'ultrathink_effort', level: 'high' }]
}

// Exported for compact.ts — the gate must be identical at both call sites.
// getDeferredToolsDeltaAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDeferredToolsDeltaAttachment(
  tools: Tools,
  model: string,
  messages: Message[] | undefined,
  scanContext?: DeferredToolsDeltaScanContext,
): Attachment[] {
  // 满足 `!isDeferredToolsDeltaEnabled()` 时，共享工具执行该分支。
  if (!isDeferredToolsDeltaEnabled()) return []
  // These three checks mirror the sync parts of isToolSearchEnabled —
  // the attachment text says "available via ToolSearch", so ToolSearch
  // has to actually be in the request. The async auto-threshold check
  // is not replicated (would double-fire tengu_tool_search_mode_decision);
  // in tst-auto below-threshold the attachment can fire while ToolSearch
  // is filtered out, but that's a narrow case and the tools announced
  // are directly callable anyway.
  // 满足 `!isToolSearchEnabledOptimistic()` 时，共享工具执行该分支。
  if (!isToolSearchEnabledOptimistic()) return []
  // 满足 `!modelSupportsToolReference(model)` 时，共享工具执行该分支。
  if (!modelSupportsToolReference(model)) return []
  // 满足 `!isToolSearchToolAvailable(tools)` 时，共享工具执行该分支。
  if (!isToolSearchToolAvailable(tools)) return []
  // delta读取`getDeferredToolsDelta`，供共享工具后续处理使用。
  const delta = getDeferredToolsDelta(tools, messages ?? [], scanContext)
  // delta缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!delta) return []
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'deferred_tools_delta', ...delta }]
}

/**
 * Diff the current filtered agent pool against what's already been announced
 * in this conversation (reconstructed from prior agent_listing_delta
 * attachments). Returns [] if nothing changed or the gate is off.
 *
 * The agent list was embedded in AgentTool's description, causing ~10.2% of
 * fleet cache_creation: MCP async connect, /reload-plugins, or
 * permission-mode change → description changes → full tool-schema cache bust.
 * Moving the list here keeps the tool description static.
 *
 * Exported for compact.ts — re-announces the full set after compaction eats
 * prior deltas.
 */
// getAgentListingDeltaAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentListingDeltaAttachment(
  toolUseContext: ToolUseContext,
  messages: Message[] | undefined,
): Attachment[] {
  // 满足 `!shouldInjectAgentListInMessages()` 时，共享工具执行该分支。
  if (!shouldInjectAgentListInMessages()) return []

  // Skip if AgentTool isn't in the pool — the listing would be unactionable.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    // 这个回调绑定到 !toolUseContext.options.tools.some(t => toolMatchesName(t, AGENT_TOOL_NAME))，负责共享工具在该局部场景下的响应。
    !toolUseContext.options.tools.some(t => toolMatchesName(t, AGENT_TOOL_NAME))
  ) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
  const { activeAgents, allowedAgentTypes } =
    toolUseContext.options.agentDefinitions

  // Mirror AgentTool.prompt()'s filtering: MCP requirements → deny rules →
  // allowedAgentTypes restriction. Keep this in sync with AgentTool.tsx.
  // mcpServers 集合构建`new Set<string>()` 整理出中间结果，供共享工具 attachments后续步骤使用。
  const mcpServers = new Set<string>()
  // 按顺序遍历 `toolUseContext.options.tools` 中的工具，逐个交给共享工具处理。
  for (const tool of toolUseContext.options.tools) {
    // info保存`mcpInfoFromString`，供共享工具后续处理使用。
    const info = mcpInfoFromString(tool.name)
    // 满足 `info) mcpServers.add(info.serverName` 时，共享工具执行该分支。
    if (info) mcpServers.add(info.serverName)
  }
  // permissionContext 权限数据读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const permissionContext = toolUseContext.getAppState().toolPermissionContext
  // filtered筛选`filterDeniedAgents`，供共享工具后续处理使用。
  let filtered = filterDeniedAgents(
    filterAgentsByMcpRequirements(activeAgents, [...mcpServers]),
    permissionContext,
    AGENT_TOOL_NAME,
  )
  // 满足 `allowedAgentTypes` 时，共享工具执行该分支。
  if (allowedAgentTypes) {
    // filtered更新为 `filtered.filter(a => allowedAgentTypes.includes(a.agentTy...`，确保共享工具后续读取最新状态。
    filtered = filtered.filter(a => allowedAgentTypes.includes(a.agentType))
  }

  // Reconstruct announced set from prior deltas in the transcript.
  // announced 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const announced = new Set<string>()
  // 按顺序遍历 `messages ?? []` 中的消息，逐个交给共享工具处理。
  for (const msg of messages ?? []) {
    // `msg.type` 与 `'attachment'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'attachment') continue
    // `msg.attachment.type` 与 `'agent_listing_delta'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.attachment.type !== 'agent_listing_delta') continue
    // 逐项读取 `msg.attachment.addedTypes) announced.add(t` 中的t，按输入顺序推进共享工具。
    for (const t of msg.attachment.addedTypes) announced.add(t)
    // 逐项读取 `msg.attachment.removedTypes) announced.delete(t` 中的t，按输入顺序推进共享工具。
    for (const t of msg.attachment.removedTypes) announced.delete(t)
  }

  // currentTypes 集合保存`Set`，供共享工具后续处理使用。
  const currentTypes = new Set(filtered.map(a => a.agentType))
  // added筛选`filtered.filter`，供共享工具后续处理使用。
  const added = filtered.filter(a => !announced.has(a.agentType))
  // removed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const removed: string[] = []
  // 按顺序遍历 `announced` 中的t，逐个交给共享工具处理。
  for (const t of announced) {
    // 满足 `!currentTypes.has(t)) removed.push(t` 时，共享工具执行该分支。
    if (!currentTypes.has(t)) removed.push(t)
  }

  // added.length === 0 && removed 数量为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (added.length === 0 && removed.length === 0) return []

  // Sort for deterministic output — agent load order is nondeterministic
  // (plugin load races, MCP async connect).
  // 调用 added.sort，触发共享工具此处需要的副作用。
  added.sort((a, b) => a.agentType.localeCompare(b.agentType))
  // 调用 removed.sort，触发共享工具此处需要的副作用。
  removed.sort()

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    {
      type: 'agent_listing_delta',
      // 这个回调绑定到 addedTypes: added.map(a => a.agentType),，负责共享工具在该局部场景下的响应。
      addedTypes: added.map(a => a.agentType),
      addedLines: added.map(formatAgentLine),
      removedTypes: removed,
      isInitial: announced.size === 0,
      showConcurrencyNote: getSubscriptionType() !== 'pro',
    },
  ]
}

// Exported for compact.ts / reactiveCompact.ts — single source of truth for the gate.
// getMcpInstructionsDeltaAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpInstructionsDeltaAttachment(
  mcpClients: MCPServerConnection[],
  tools: Tools,
  model: string,
  messages: Message[] | undefined,
): Attachment[] {
  // 满足 `!isMcpInstructionsDeltaEnabled()` 时，共享工具执行该分支。
  if (!isMcpInstructionsDeltaEnabled()) return []

  // The chrome ToolSearch hint is client-authored and ToolSearch-conditional;
  // actual server `instructions` are unconditional. Decide the chrome part
  // here, pass it into the pure diff as a synthesized entry.
  // clientSide 从空数组开始收集，后续循环会按处理顺序追加条目。
  const clientSide: ClientSideInstruction[] = []
  // 共享工具在这里按实际状态进入对应分支。
  if (
    isToolSearchEnabledOptimistic() &&
    modelSupportsToolReference(model) &&
    isToolSearchToolAvailable(tools)
  ) {
    // clientSide追加新条目，保持收集顺序与输入顺序一致。
    clientSide.push({
      serverName: CLAUDE_IN_CHROME_MCP_SERVER_NAME,
      block: CHROME_TOOL_SEARCH_INSTRUCTIONS,
    })
  }

  // delta读取`getMcpInstructionsDelta`，供共享工具后续处理使用。
  const delta = getMcpInstructionsDelta(mcpClients, messages ?? [], clientSide)
  // delta缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!delta) return []
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'mcp_instructions_delta', ...delta }]
}

// getCriticalSystemReminderAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCriticalSystemReminderAttachment(
  toolUseContext: ToolUseContext,
): Attachment[] {
  // reminder保存`toolUseContext.criticalSystemReminder_EXPERIMENTAL`，供后续判断或组装使用。
  const reminder = toolUseContext.criticalSystemReminder_EXPERIMENTAL
  // reminder缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!reminder) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'critical_system_reminder', content: reminder }]
}

// getOutputStyleAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOutputStyleAttachment(): Attachment[] {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()
  // outputStyle标记共享工具 attachments是否启用对应路径。
  const outputStyle = settings?.outputStyle || 'default'

  // Only show for non-default styles
  // 当 `outputStyle` 匹配 `'default'` 时，共享工具执行对应分支。
  if (outputStyle === 'default') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    {
      type: 'output_style',
      style: outputStyle,
    },
  ]
}

// getSelectedLinesFromIDE 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getSelectedLinesFromIDE(
  ideSelection: IDESelection | null,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // ideName读取`getConnectedIdeName`，供共享工具后续处理使用。
  const ideName = getConnectedIdeName(toolUseContext.options.mcpClients)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !ideName ||
    ideSelection?.lineStart === undefined ||
    !ideSelection.text ||
    !ideSelection.filePath
  ) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // 满足 `isFileReadDenied(ideSelection.filePath, appState.toolPermissionContext)` 时，共享工具执行该分支。
  if (isFileReadDenied(ideSelection.filePath, appState.toolPermissionContext)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    {
      type: 'selected_lines_in_ide',
      ideName,
      lineStart: ideSelection.lineStart,
      lineEnd: ideSelection.lineStart + ideSelection.lineCount - 1,
      filename: ideSelection.filePath,
      content: ideSelection.text,
      displayPath: relative(getCwd(), ideSelection.filePath),
    },
  ]
}

/**
 * Computes the directories to process for nested memory file loading.
 * Returns two lists:
 * - nestedDirs: Directories between CWD and targetPath (processed for CLAUDE.md + all rules)
 * - cwdLevelDirs: Directories from root to CWD (processed for conditional rules only)
 *
 * @param targetPath The target file path
 * @param originalCwd The original current working directory
 * @returns Object with nestedDirs and cwdLevelDirs arrays, both ordered from parent to child
 */
// getDirectoriesToProcess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDirectoriesToProcess(
  targetPath: string,
  originalCwd: string,
): { nestedDirs: string[]; cwdLevelDirs: string[] } {
  // Build list of directories from original CWD to targetPath's directory
  // targetDir保存`dirname`，供共享工具后续处理使用。
  const targetDir = dirname(resolve(targetPath))
  // nestedDirs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const nestedDirs: string[] = []
  // currentDir读取`targetDir` 整理出中间结果，供共享工具 attachments后续步骤使用。
  let currentDir = targetDir

  // Walk up from target directory to original CWD
  // 只要 currentDir !== originalCwd && currentDir !== parse(currentDir).root 成立，就持续推进共享工具中的循环处理。
  while (currentDir !== originalCwd && currentDir !== parse(currentDir).root) {
    // 满足 `currentDir.startsWith(originalCwd)` 时，共享工具执行该分支。
    if (currentDir.startsWith(originalCwd)) {
      // nestedDirs 集合追加新条目，保持收集顺序与输入顺序一致。
      nestedDirs.push(currentDir)
    }
    // currentDir更新为 `dirname(currentDir)`，确保共享工具后续读取最新状态。
    currentDir = dirname(currentDir)
  }

  // Reverse to get order from CWD down to target
  // 调用 nestedDirs.reverse，触发共享工具此处需要的副作用。
  nestedDirs.reverse()

  // Build list of directories from root to CWD (for conditional rules only)
  // cwdLevelDirs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const cwdLevelDirs: string[] = []
  // currentDir更新为 `originalCwd`，确保共享工具后续读取最新状态。
  currentDir = originalCwd

  // 只要 currentDir !== parse(currentDir).root 成立，就持续推进共享工具中的循环处理。
  while (currentDir !== parse(currentDir).root) {
    // cwdLevelDirs 集合追加新条目，保持收集顺序与输入顺序一致。
    cwdLevelDirs.push(currentDir)
    // currentDir更新为 `dirname(currentDir)`，确保共享工具后续读取最新状态。
    currentDir = dirname(currentDir)
  }

  // Reverse to get order from root to CWD
  // 调用 cwdLevelDirs.reverse，触发共享工具此处需要的副作用。
  cwdLevelDirs.reverse()

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { nestedDirs, cwdLevelDirs }
}

/**
 * Converts memory files to attachments, filtering out already-loaded files.
 *
 * @param memoryFiles The memory files to convert
 * @param toolUseContext The tool use context (for tracking loaded files)
 * @returns Array of nested memory attachments
 */
// isInstructionsMemoryType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isInstructionsMemoryType(
  type: MemoryFileInfo['type'],
): type is InstructionsMemoryType {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    type === 'User' ||
    type === 'Project' ||
    type === 'Local' ||
    type === 'Managed'
  )
}

/** Exported for testing — regression guard for LRU-eviction re-injection. */
// memoryFilesToAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoryFilesToAttachments(
  memoryFiles: MemoryFileInfo[],
  toolUseContext: ToolUseContext,
  triggerFilePath?: string,
): Attachment[] {
  // attachments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const attachments: Attachment[] = []
  // shouldFireHook记录 `hasInstructionsLoadedHook` 是否成立，共享工具随后按该结果分支。
  const shouldFireHook = hasInstructionsLoadedHook()

  // 按顺序遍历 `memoryFiles` 中的memoryFile 文件数据，逐个交给共享工具处理。
  for (const memoryFile of memoryFiles) {
    // Dedup: loadedNestedMemoryPaths is a non-evicting Set; readFileState
    // is a 100-entry LRU that drops entries in busy sessions, so relying
    // on it alone re-injects the same CLAUDE.md on every eviction cycle.
    // 满足 `toolUseContext.loadedNestedMemoryPaths?.has(memoryFile.path)` 时，共享工具执行该分支。
    if (toolUseContext.loadedNestedMemoryPaths?.has(memoryFile.path)) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `!toolUseContext.readFileState.has(memoryFile.path)` 时，共享工具执行该分支。
    if (!toolUseContext.readFileState.has(memoryFile.path)) {
      // attachments 集合追加新条目，保持收集顺序与输入顺序一致。
      attachments.push({
        type: 'nested_memory',
        path: memoryFile.path,
        content: memoryFile,
        displayPath: relative(getCwd(), memoryFile.path),
      })
      // 调用 toolUseContext.loadedNestedMemoryPaths?.add(memoryFile.path)，完成这一处局部操作。
      toolUseContext.loadedNestedMemoryPaths?.add(memoryFile.path)

      // Mark as loaded in readFileState — this provides cross-function and
      // cross-turn dedup via the .has() check above.
      //
      // When the injected content doesn't match disk (stripped HTML comments,
      // stripped frontmatter, truncated MEMORY.md), cache the RAW disk bytes
      // with `isPartialView: true`. Edit/Write see the flag and require a real
      // Read first; getChangedFiles sees real content + undefined offset/limit
      // so mid-session change detection still works.
      // toolUseContext.readFileState.set 写入新的状态值，使共享工具后续读取保持一致。
      toolUseContext.readFileState.set(memoryFile.path, {
        content: memoryFile.contentDiffersFromDisk
          ? (memoryFile.rawContent ?? memoryFile.content)
          : memoryFile.content,
        timestamp: Date.now(),
        offset: undefined,
        limit: undefined,
        isPartialView: memoryFile.contentDiffersFromDisk,
      })


      // Fire InstructionsLoaded hook for audit/observability (fire-and-forget)
      // 只有 `shouldFireHook && isInstructionsMemoryType(memoryFile.type)` 满足时，共享工具才执行该分支。
      if (shouldFireHook && isInstructionsMemoryType(memoryFile.type)) {
        // loadReason 命名 `memoryFile.globs`，让后续代码直接表达这个值的用途。
        const loadReason = memoryFile.globs
          ? 'path_glob_match'
          : memoryFile.parent
            ? 'include'
            : 'nested_traversal'
        // 显式忽略 `executeInstructionsLoadedHooks(` 的返回值，只保留它触发的副作用。
        void executeInstructionsLoadedHooks(
          memoryFile.path,
          memoryFile.type,
          loadReason,
          {
            globs: memoryFile.globs,
            triggerFilePath,
            parentFilePath: memoryFile.parent,
          },
        )
      }
    }
  }

  // 返回 `attachments`，作为共享工具这次计算的结果。
  return attachments
}

/**
 * Loads nested memory files for a given file path and returns them as attachments.
 * This function performs directory traversal to find CLAUDE.md files and conditional rules
 * that apply to the target file path.
 *
 * Processing order (must be preserved):
 * 1. Managed/User conditional rules matching targetPath
 * 2. Nested directories (CWD → target): CLAUDE.md + unconditional + conditional rules
 * 3. CWD-level directories (root → CWD): conditional rules only
 *
 * @param filePath The file path to get nested memory files for
 * @param toolUseContext The tool use context
 * @param appState The app state containing tool permission context
 * @returns Array of nested memory attachments
 */
// getNestedMemoryAttachmentsForFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getNestedMemoryAttachmentsForFile(
  filePath: string,
  toolUseContext: ToolUseContext,
  appState: { toolPermissionContext: ToolPermissionContext },
): Promise<Attachment[]> {
  // attachments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const attachments: Attachment[] = []

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Early return if path is not in allowed working path
    // 满足 `!pathInAllowedWorkingPath(filePath, appState.toolPermissionContext)` 时，共享工具执行该分支。
    if (!pathInAllowedWorkingPath(filePath, appState.toolPermissionContext)) {
      // 返回 `attachments`，作为共享工具这次计算的结果。
      return attachments
    }

    // processedPaths 路径数据构建`new Set<string>()`，供后续判断或组装使用。
    const processedPaths = new Set<string>()
    // originalCwd读取`getOriginalCwd`，供共享工具后续处理使用。
    const originalCwd = getOriginalCwd()

    // Phase 1: Process Managed and User conditional rules
    // managedUserRules 集合读取`getManagedAndUserConditionalRules`，供共享工具后续处理使用。
    const managedUserRules = await getManagedAndUserConditionalRules(
      filePath,
      processedPaths,
    )
    // attachments 集合追加新条目，保持收集顺序与输入顺序一致。
    attachments.push(
      ...memoryFilesToAttachments(managedUserRules, toolUseContext, filePath),
    )

    // Phase 2: Get directories to process
    // 从 `getDirectoriesToProcess(` 解构 nestedDirs、cwdLevelDirs，减少共享工具 attachments对同一对象的重复访问。
    const { nestedDirs, cwdLevelDirs } = getDirectoriesToProcess(
      filePath,
      originalCwd,
    )

    // skipProjectLevel读取`getFeatureValue_CACHED_MAY_BE_STALE`，供共享工具后续处理使用。
    const skipProjectLevel = getFeatureValue_CACHED_MAY_BE_STALE(
      'tengu_paper_halyard',
      false,
    )

    // Phase 3: Process nested directories (CWD → target)
    // Each directory gets: CLAUDE.md + unconditional rules + conditional rules
    // 按顺序遍历 `nestedDirs` 中的dir，逐个交给共享工具处理。
    for (const dir of nestedDirs) {
      // memoryFiles 文件数据 命名 `(`，让后续代码直接表达这个值的用途。
      const memoryFiles = (
        await getMemoryFilesForNestedDirectory(dir, filePath, processedPaths)
      ).filter(
        // f更新为 `> !skipProjectLevel || (f.type !== 'Project' && f.type !=...`，确保共享工具后续读取最新状态。
        f => !skipProjectLevel || (f.type !== 'Project' && f.type !== 'Local'),
      )
      // attachments 集合追加新条目，保持收集顺序与输入顺序一致。
      attachments.push(
        ...memoryFilesToAttachments(memoryFiles, toolUseContext, filePath),
      )
    }

    // Phase 4: Process CWD-level directories (root → CWD)
    // Only conditional rules (unconditional rules are already loaded eagerly)
    // 按顺序遍历 `cwdLevelDirs` 中的dir，逐个交给共享工具处理。
    for (const dir of cwdLevelDirs) {
      // conditionalRules 集合保存`(`，供共享工具 attachments后续判断或输出使用。
      const conditionalRules = (
        await getConditionalRulesForCwdLevelDirectory(
          dir,
          filePath,
          processedPaths,
        )
      ).filter(
        // f更新为 `> !skipProjectLevel || (f.type !== 'Project' && f.type !=...`，确保共享工具后续读取最新状态。
        f => !skipProjectLevel || (f.type !== 'Project' && f.type !== 'Local'),
      )
      // attachments 集合追加新条目，保持收集顺序与输入顺序一致。
      attachments.push(
        ...memoryFilesToAttachments(conditionalRules, toolUseContext, filePath),
      )
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }

  // 返回 `attachments`，作为共享工具这次计算的结果。
  return attachments
}

// getOpenedFileFromIDE 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getOpenedFileFromIDE(
  ideSelection: IDESelection | null,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // 只有 `!ideSelection?.filePath || ideSelection.text` 满足时，共享工具才执行该分支。
  if (!ideSelection?.filePath || ideSelection.text) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // 满足 `isFileReadDenied(ideSelection.filePath, appState.toolPermissionContext)` 时，共享工具执行该分支。
  if (isFileReadDenied(ideSelection.filePath, appState.toolPermissionContext)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Get nested memory files
  // nestedMemoryAttachments 集合读取`getNestedMemoryAttachmentsForFile`，供共享工具后续处理使用。
  const nestedMemoryAttachments = await getNestedMemoryAttachmentsForFile(
    ideSelection.filePath,
    toolUseContext,
    appState,
  )

  // Return nested memory attachments followed by the opened file attachment
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    ...nestedMemoryAttachments,
    {
      type: 'opened_file_in_ide',
      filename: ideSelection.filePath,
    },
  ]
}

// processAtMentionedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function processAtMentionedFiles(
  input: string,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // files 文件数据保存`extractAtMentionedFiles`，供共享工具后续处理使用。
  const files = extractAtMentionedFiles(input)
  // files 文件数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (files.length === 0) return []

  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 files.map，触发共享工具此处需要的副作用。
    files.map(async file => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 从 `parseAtMentionedFileLines(file)` 解构 filename、lineStart、lineEnd，减少共享工具 attachments对同一对象的重复访问。
        const { filename, lineStart, lineEnd } = parseAtMentionedFileLines(file)
        // absoluteFilename 文件数据保存`expandPath`，供共享工具后续处理使用。
        const absoluteFilename = expandPath(filename)

        // 共享工具在这里按实际状态进入对应分支。
        if (
          isFileReadDenied(absoluteFilename, appState.toolPermissionContext)
        ) {
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }

        // Check if it's a directory
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // stats 集合保存`stat`，供共享工具后续处理使用。
          const stats = await stat(absoluteFilename)
          // 满足 `stats.isDirectory()` 时，共享工具执行该分支。
          if (stats.isDirectory()) {
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // entries 集合读取`readdir`，供共享工具后续处理使用。
              const entries = await readdir(absoluteFilename, {
                withFileTypes: true,
              })
              // MAX_DIR_ENTRIES 集合保存`1000`，供共享工具 attachments后续判断或输出使用。
              const MAX_DIR_ENTRIES = 1000
              // truncated 命名 `entries.length > MAX_DIR_ENTRIES`，让后续代码直接表达这个值的用途。
              const truncated = entries.length > MAX_DIR_ENTRIES
              // names 集合格式化`entries.slice`，供共享工具后续处理使用。
              const names = entries.slice(0, MAX_DIR_ENTRIES).map(e => e.name)
              // 满足 `truncated` 时，共享工具执行该分支。
              if (truncated) {
                // names 集合追加新条目，保持收集顺序与输入顺序一致。
                names.push(
                  `\u2026 and ${entries.length - MAX_DIR_ENTRIES} more entries`,
                )
              }
              // stdout格式化`names.join`，供共享工具后续处理使用。
              const stdout = names.join('\n')
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_at_mention_extracting_directory_success', {})

              // 返回结构化结果，集中表达共享工具已经整理出的状态。
              return {
                type: 'directory' as const,
                path: absoluteFilename,
                content: stdout,
                displayPath: relative(getCwd(), absoluteFilename),
              }
            } catch {
              // 返回 `null`，作为共享工具这次计算的结果。
              return null
            }
          }
        } catch {
          // If stat fails, continue with file logic
        }

        // 等待并返回 `generateFileAttachment(`，调用方直接接收异步结果。
        return await generateFileAttachment(
          absoluteFilename,
          toolUseContext,
          'tengu_at_mention_extracting_filename_success',
          'tengu_at_mention_extracting_filename_error',
          'at-mention',
          {
            offset: lineStart,
            limit: lineEnd && lineStart ? lineEnd - lineStart + 1 : undefined,
          },
        )
      } catch {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_at_mention_extracting_filename_error', {})
      }
    }),
  )
  // 返回 `results.filter(Boolean) as Attachment[]`，作为共享工具这次计算的结果。
  return results.filter(Boolean) as Attachment[]
}

// processAgentMentions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processAgentMentions(
  input: string,
  agents: AgentDefinition[],
): Attachment[] {
  // agentMentions 集合保存`extractAgentMentions`，供共享工具后续处理使用。
  const agentMentions = extractAgentMentions(input)
  // agentMentions 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (agentMentions.length === 0) return []

  // 结果列表派生`agentMentions.map`，供共享工具后续处理使用。
  const results = agentMentions.map(mention => {
    // agentType格式化`mention.replace`，供共享工具后续处理使用。
    const agentType = mention.replace('agent-', '')
    // agentDef筛选`agents.find`，供共享工具后续处理使用。
    const agentDef = agents.find(def => def.agentType === agentType)

    // agentDef缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!agentDef) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_at_mention_agent_not_found', {})
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_at_mention_agent_success', {})

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      type: 'agent_mention' as const,
      agentType: agentDef.agentType,
    }
  })

  // 返回 `results.filter(`，作为共享工具这次计算的结果。
  return results.filter(
    // 这个回调绑定到 (result): result is NonNullable<typeof result> => result !== null,，负责共享工具在该局部场景下的响应。
    (result): result is NonNullable<typeof result> => result !== null,
  )
}

// processMcpResourceAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function processMcpResourceAttachments(
  input: string,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // resourceMentions 集合保存`extractMcpResourceMentions`，供共享工具后续处理使用。
  const resourceMentions = extractMcpResourceMentions(input)
  // resourceMentions 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (resourceMentions.length === 0) return []

  // mcpClients 集合标记共享工具 attachments是否启用对应路径。
  const mcpClients = toolUseContext.options.mcpClients || []

  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 resourceMentions.map，触发共享工具此处需要的副作用。
    resourceMentions.map(async mention => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 从 `mention.split(':')` 按位置拆出 serverName、其余 uriParts，让共享工具 attachments分别处理这些返回值。
        const [serverName, ...uriParts] = mention.split(':')
        // uri格式化`uriParts.join`，供共享工具后续处理使用。
        const uri = uriParts.join(':') // Rejoin in case URI contains colons

        // 只有 `!serverName || !uri` 满足时，共享工具才执行该分支。
        if (!serverName || !uri) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_at_mention_mcp_resource_error', {})
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }

        // Find the MCP client
        // API 客户端筛选`mcpClients.find`，供共享工具后续处理使用。
        const client = mcpClients.find(c => c.name === serverName)
        // `!client || client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
        if (!client || client.type !== 'connected') {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_at_mention_mcp_resource_error', {})
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }

        // Find the resource in available resources to get its metadata
        // serverResources 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const serverResources =
          toolUseContext.options.mcpResources?.[serverName] || []
        // resourceInfo筛选`serverResources.find`，供共享工具后续处理使用。
        const resourceInfo = serverResources.find(r => r.uri === uri)
        // resourceInfo缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!resourceInfo) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_at_mention_mcp_resource_error', {})
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 结果读取`client.readResource`，供共享工具后续处理使用。
          const result = await client.client.readResource({
            uri,
          })

          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_at_mention_mcp_resource_success', {})

          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            type: 'mcp_resource' as const,
            server: serverName,
            uri,
            name: resourceInfo.name || uri,
            description: resourceInfo.description,
            content: result,
          }
        } catch (error) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_at_mention_mcp_resource_error', {})
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(error)
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }
      } catch {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_at_mention_mcp_resource_error', {})
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )

  // 返回 `results.filter(`，作为共享工具这次计算的结果。
  return results.filter(
    // 这个回调绑定到 (result): result is NonNullable<typeof result> => result !== null,，负责共享工具在该局部场景下的响应。
    (result): result is NonNullable<typeof result> => result !== null,
  ) as Attachment[]
}

// getChangedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getChangedFiles(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // filePaths 路径数据保存`cacheKeys`，供共享工具后续处理使用。
  const filePaths = cacheKeys(toolUseContext.readFileState)
  // filePaths 路径数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (filePaths.length === 0) return []

  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 filePaths.map，触发共享工具此处需要的副作用。
    filePaths.map(async filePath => {
      // fileState 文件数据读取`readFileState.get`，供共享工具后续处理使用。
      const fileState = toolUseContext.readFileState.get(filePath)
      // fileState 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!fileState) return null

      // TODO: Implement offset/limit support for changed files
      // `fileState.offset` 与 `undefined || fileState.limit` 不一致时刷新派生状态，避免使用过期结果。
      if (fileState.offset !== undefined || fileState.limit !== undefined) {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }

      // normalizedPath 路径数据保存`expandPath`，供共享工具后续处理使用。
      const normalizedPath = expandPath(filePath)

      // Check if file has a deny rule configured
      // 满足 `isFileReadDenied(normalizedPath, appState.toolPermissionContext)` 时，共享工具执行该分支。
      if (isFileReadDenied(normalizedPath, appState.toolPermissionContext)) {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }

      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // mtime读取`getFileModificationTimeAsync`，供共享工具后续处理使用。
        const mtime = await getFileModificationTimeAsync(normalizedPath)
        // 满足 `mtime <= fileState.timestamp` 时，共享工具执行该分支。
        if (mtime <= fileState.timestamp) {
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }

        // fileInput 文件数据集中保存共享工具 attachments要一起传递的字段。
        const fileInput = { file_path: normalizedPath }

        // Validate file path is valid
        // isValid记录 `FileReadTool.validateInput` 是否成立，共享工具随后按该结果分支。
        const isValid = await FileReadTool.validateInput(
          fileInput,
          toolUseContext,
        )
        // isValid.result缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!isValid.result) {
          // 返回 `null`，作为共享工具这次计算的结果。
          return null
        }

        // 结果保存`FileReadTool.call`，供共享工具后续处理使用。
        const result = await FileReadTool.call(fileInput, toolUseContext)
        // Extract only the changed section
        // 当 `result.data.type` 匹配 `'text'` 时，共享工具执行对应分支。
        if (result.data.type === 'text') {
          // snippet读取`getSnippetForTwoFileDiff`，供共享工具后续处理使用。
          const snippet = getSnippetForTwoFileDiff(
            fileState.content,
            result.data.file.content,
          )

          // File was touched but not modified
          // 满足 `snippet === ''` 时，共享工具执行该分支。
          if (snippet === '') {
            // 返回 `null`，作为共享工具这次计算的结果。
            return null
          }

          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            type: 'edited_text_file' as const,
            filename: normalizedPath,
            snippet,
          }
        }

        // For non-text files (images), apply the same token limit logic as FileReadTool
        // 当 `result.data.type` 匹配 `'image'` 时，共享工具执行对应分支。
        if (result.data.type === 'image') {
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // data读取`readImageWithTokenBudget`，供共享工具后续处理使用。
            const data = await readImageWithTokenBudget(normalizedPath)
            // 返回结构化结果，集中表达共享工具已经整理出的状态。
            return {
              type: 'edited_image_file' as const,
              filename: normalizedPath,
              content: data,
            }
          } catch (compressionError) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logError(compressionError)
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_watched_file_compression_failed', {
              file: normalizedPath,
            } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
            // 返回 `null`，作为共享工具这次计算的结果。
            return null
          }
        }

        // notebook / pdf / parts — no diff representation; explicitly
        // null so the map callback has no implicit-undefined path.
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      } catch (err) {
        // Evict ONLY on ENOENT (file truly deleted). Transient stat
        // failures — atomic-save races (editor writes tmp→rename and
        // stat hits the gap), EACCES churn, network-FS hiccups — must
        // NOT evict, or the next Edit fails code-6 even though the
        // file still exists and the model just read it. VS Code
        // auto-save/format-on-save hits this race especially often.
        // See regression analysis on PR #18525.
        // 满足 `isENOENT(err)` 时，共享工具执行该分支。
        if (isENOENT(err)) {
          // 调用 toolUseContext.readFileState.delete，触发共享工具此处需要的副作用。
          toolUseContext.readFileState.delete(filePath)
        }
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )
  // 返回 `results.filter(result => result != null) as Attachment[]`，作为共享工具这次计算的结果。
  return results.filter(result => result != null) as Attachment[]
}

/**
 * Processes paths that need nested memory attachments and checks for nested CLAUDE.md files
 * Uses nestedMemoryAttachmentTriggers field from ToolUseContext
 */
// getNestedMemoryAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getNestedMemoryAttachments(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // Check triggers first — getAppState() waits for a React render cycle,
  // and the common case is an empty trigger set.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !toolUseContext.nestedMemoryAttachmentTriggers ||
    toolUseContext.nestedMemoryAttachmentTriggers.size === 0
  ) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // attachments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const attachments: Attachment[] = []

  // 按顺序遍历 `toolUseContext.nestedMemoryAtta` 中的文件路径，逐个交给共享工具处理。
  for (const filePath of toolUseContext.nestedMemoryAttachmentTriggers) {
    // nestedAttachments 集合读取`getNestedMemoryAttachmentsForFile`，供共享工具后续处理使用。
    const nestedAttachments = await getNestedMemoryAttachmentsForFile(
      filePath,
      toolUseContext,
      appState,
    )
    // attachments 集合追加新条目，保持收集顺序与输入顺序一致。
    attachments.push(...nestedAttachments)
  }

  // 调用 toolUseContext.nestedMemoryAttachmentTriggers.clear，触发共享工具此处需要的副作用。
  toolUseContext.nestedMemoryAttachmentTriggers.clear()

  // 返回 `attachments`，作为共享工具这次计算的结果。
  return attachments
}

// getRelevantMemoryAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getRelevantMemoryAttachments(
  input: string,
  agents: AgentDefinition[],
  readFileState: FileStateCache,
  recentTools: readonly string[],
  signal: AbortSignal,
  alreadySurfaced: ReadonlySet<string>,
): Promise<Attachment[]> {
  // If an agent is @-mentioned, search only its memory dir (isolation).
  // Otherwise search the auto-memory dir.
  // memoryDirs 集合保存`extractAgentMentions`，供共享工具后续处理使用。
  const memoryDirs = extractAgentMentions(input).flatMap(mention => {
    // agentType格式化`mention.replace`，供共享工具后续处理使用。
    const agentType = mention.replace('agent-', '')
    // agentDef筛选`agents.find`，供共享工具后续处理使用。
    const agentDef = agents.find(def => def.agentType === agentType)
    // 返回 `agentDef?.memory`，作为共享工具这次计算的结果。
    return agentDef?.memory
      ? [getAgentMemoryDir(agentType, agentDef.memory)]
      : []
  })
  // dirs 集合读取`getAutoMemPath`，供共享工具后续处理使用。
  const dirs = memoryDirs.length > 0 ? memoryDirs : [getAutoMemPath()]

  // allResults 集合保存`Promise.all`，供共享工具后续处理使用。
  const allResults = await Promise.all(
    // 调用 dirs.map，触发共享工具此处需要的副作用。
    dirs.map(dir =>
      findRelevantMemories(
        input,
        dir,
        signal,
        recentTools,
        alreadySurfaced,
      // 这个回调绑定到 ).catch(() => []),，负责共享工具在该局部场景下的响应。
      ).catch(() => []),
    ),
  )
  // alreadySurfaced is filtered inside the selector so Sonnet spends its
  // 5-slot budget on fresh candidates; readFileState catches files the
  // model read via FileReadTool. The redundant alreadySurfaced check here
  // is a belt-and-suspenders guard (multi-dir results may re-introduce a
  // path the selector filtered in a different dir).
  // selected保存`allResults`，供后续判断或组装使用。
  const selected = allResults
    .flat()
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(m => !readFileState.has(m.path) && !alreadySurfaced.has(m.path))
    .slice(0, 5)

  // memories 集合读取`readMemoriesForSurfacing`，供共享工具后续处理使用。
  const memories = await readMemoriesForSurfacing(selected, signal)

  // memories 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (memories.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'relevant_memories' as const, memories }]
}

/**
 * Scan messages for past relevant_memories attachments.  Returns both the
 * set of surfaced paths (for selector de-dup) and cumulative byte count
 * (for session-total throttle).  Scanning messages rather than tracking
 * in toolUseContext means compact naturally resets both — old attachments
 * are gone from the compacted transcript, so re-surfacing is valid again.
 */
// collectSurfacedMemories 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function collectSurfacedMemories(messages: ReadonlyArray<Message>): {
  paths: Set<string>
  totalBytes: number
} {
  // 路径列表构建`new Set<string>()` 整理出中间结果，供共享工具 attachments后续步骤使用。
  const paths = new Set<string>()
  // totalBytes 集合保存`0`，供后续判断或组装使用。
  let totalBytes = 0
  // 按顺序遍历 `messages` 中的m，逐个交给共享工具处理。
  for (const m of messages) {
    // 只有 `m.type === 'attachment' && m.attachment.type ===` 满足时，共享工具才执行该分支。
    if (m.type === 'attachment' && m.attachment.type === 'relevant_memories') {
      // 按顺序遍历 `m.attachment.memories` 中的mem，逐个交给共享工具处理。
      for (const mem of m.attachment.memories) {
        // 调用 paths.add，触发共享工具此处需要的副作用。
        paths.add(mem.path)
        // 共享工具 attachments在这里处理 `totalBytes += mem.content.length`，完成这一小步状态转换。
        totalBytes += mem.content.length
      }
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { paths, totalBytes }
}

/**
 * Reads a set of relevance-ranked memory files for injection as
 * <system-reminder> attachments. Enforces both MAX_MEMORY_LINES and
 * MAX_MEMORY_BYTES via readFileInRange's truncateOnByteLimit option.
 * Truncation surfaces partial
 * content with a note rather than dropping the file — findRelevantMemories
 * already picked this as most-relevant, so the frontmatter + opening context
 * is worth surfacing even if later lines are cut.
 *
 * Exported for direct testing without mocking the ranker + GB gates.
 */
// readMemoriesForSurfacing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readMemoriesForSurfacing(
  selected: ReadonlyArray<{ path: string; mtimeMs: number }>,
  signal?: AbortSignal,
): Promise<
  Array<{
    path: string
    content: string
    mtimeMs: number
    header: string
    limit?: number
  }>
> {
  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 selected.map，触发共享工具此处需要的副作用。
    selected.map(async ({ path: filePath, mtimeMs }) => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 结果读取`readFileInRange`，供共享工具后续处理使用。
        const result = await readFileInRange(
          filePath,
          0,
          MAX_MEMORY_LINES,
          MAX_MEMORY_BYTES,
          signal,
          { truncateOnByteLimit: true },
        )
        // truncated 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const truncated =
          result.totalLines > MAX_MEMORY_LINES || result.truncatedByBytes
        // 文本内容保存`truncated`，供后续判断或组装使用。
        const content = truncated
          ? result.content +
            `\n\n> This memory file was truncated (${result.truncatedByBytes ? `${MAX_MEMORY_BYTES} byte limit` : `first ${MAX_MEMORY_LINES} lines`}). Use the ${FILE_READ_TOOL_NAME} tool to view the complete file at: ${filePath}`
          : result.content
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          path: filePath,
          content,
          mtimeMs,
          header: memoryHeader(filePath, mtimeMs),
          limit: truncated ? result.lineCount : undefined,
        }
      } catch {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )
  // 返回 `results.filter(r => r !== null)`，作为共享工具这次计算的结果。
  return results.filter(r => r !== null)
}

/**
 * Header string for a relevant-memory block.  Exported so messages.ts
 * can fall back for resumed sessions where the stored header is missing.
 */
// memoryHeader 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function memoryHeader(path: string, mtimeMs: number): string {
  // staleness 集合保存`memoryFreshnessText`，供共享工具后续处理使用。
  const staleness = memoryFreshnessText(mtimeMs)
  // 返回 `staleness`，作为共享工具这次计算的结果。
  return staleness
    ? `${staleness}\n\nMemory: ${path}:`
    : `Memory (saved ${memoryAge(mtimeMs)}): ${path}:`
}

/**
 * A memory relevance-selector prefetch handle. The promise is started once
 * per user turn and runs while the main model streams and tools execute.
 * At the collect point (post-tools), the caller reads settledAt to
 * consume-if-ready or skip-and-retry-next-iteration — the prefetch never
 * blocks the turn.
 *
 * Disposable: query.ts binds with `using`, so [Symbol.dispose] fires on all
 * generator exit paths (return, throw, .return() closure) — aborting the
 * in-flight request and emitting terminal telemetry without instrumenting
 * each of the ~13 return sites inside the while loop.
 */
// MemoryPrefetch 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MemoryPrefetch = {
  promise: Promise<Attachment[]>
  /** Set by promise.finally(). null until the promise settles. */
  settledAt: number | null
  /** Set by the collect point in query.ts. -1 until consumed. */
  consumedOnIteration: number
  // 共享工具 attachments在这里处理 `[Symbol.dispose](): void`，完成这一小步状态转换。
  [Symbol.dispose](): void
}

/**
 * Starts the relevant memory search as an async prefetch.
 * Extracts the last real user prompt from messages (skipping isMeta system
 * injections) and kicks off a non-blocking search. Returns a Disposable
 * handle with settlement tracking. Bound with `using` in query.ts.
 */
// startRelevantMemoryPrefetch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startRelevantMemoryPrefetch(
  messages: ReadonlyArray<Message>,
  toolUseContext: ToolUseContext,
): MemoryPrefetch | undefined {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !isAutoMemoryEnabled() ||
    !getFeatureValue_CACHED_MAY_BE_STALE('tengu_moth_copse', false)
  ) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // lastUserMessage 消息数据筛选`messages.findLast`，供共享工具后续处理使用。
  const lastUserMessage = messages.findLast(m => m.type === 'user' && !m.isMeta)
  // lastUserMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastUserMessage) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 用户输入读取`getUserMessageText`，供共享工具后续处理使用。
  const input = getUserMessageText(lastUserMessage)
  // Single-word prompts lack enough context for meaningful term extraction
  // 只有 `!input || !/\s/.test(input.trim())` 满足时，共享工具才执行该分支。
  if (!input || !/\s/.test(input.trim())) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // surfaced保存`collectSurfacedMemories`，供共享工具后续处理使用。
  const surfaced = collectSurfacedMemories(messages)
  // 满足 `surfaced.totalBytes >= RELEVANT_MEMORIES_CONFIG.M` 时，共享工具执行该分支。
  if (surfaced.totalBytes >= RELEVANT_MEMORIES_CONFIG.MAX_SESSION_BYTES) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Chained to the turn-level abort so user Escape cancels the sideQuery
  // immediately, not just on [Symbol.dispose] when queryLoop exits.
  // controller构建`createChildAbortController`，供共享工具后续处理使用。
  const controller = createChildAbortController(toolUseContext.abortController)
  // firedAt记录时间`Date.now`，供共享工具后续处理使用。
  const firedAt = Date.now()
  // promise 异步任务读取`getRelevantMemoryAttachments`，供共享工具后续处理使用。
  const promise = getRelevantMemoryAttachments(
    input,
    toolUseContext.options.agentDefinitions.activeAgents,
    toolUseContext.readFileState,
    collectRecentSuccessfulTools(messages, lastUserMessage),
    controller.signal,
    surfaced.paths,
  // 这个回调绑定到 ).catch(e => {，负责共享工具在该局部场景下的响应。
  ).catch(e => {
    // 满足 `!isAbortError(e)` 时，共享工具执行该分支。
    if (!isAbortError(e)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e)
    }
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  })

  // handle 集中保存共享工具 attachments要一起传递的字段。
  const handle: MemoryPrefetch = {
    promise,
    settledAt: null,
    consumedOnIteration: -1,
    // 共享工具 attachments在这里处理 `[Symbol.dispose]() {`，完成这一小步状态转换。
    [Symbol.dispose]() {
      // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
      controller.abort()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_memdir_prefetch_collected', {
        hidden_by_first_iteration:
          handle.settledAt !== null && handle.consumedOnIteration === 0,
        consumed_on_iteration: handle.consumedOnIteration,
        latency_ms: (handle.settledAt ?? Date.now()) - firedAt,
      })
    },
  }
  // 这个回调绑定到 void promise.finally(() => {，负责共享工具在该局部场景下的响应。
  void promise.finally(() => {
    // settledAt更新为 `Date.now()`，确保共享工具后续读取最新状态。
    handle.settledAt = Date.now()
  })
  // 返回 `handle`，作为共享工具这次计算的结果。
  return handle
}

// ToolResultBlock 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolResultBlock = {
  type: 'tool_result'
  tool_use_id: string
  is_error?: boolean
}

// isToolResultBlock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isToolResultBlock(b: unknown): b is ToolResultBlock {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof b === 'object' &&
    b !== null &&
    (b as ToolResultBlock).type === 'tool_result' &&
    typeof (b as ToolResultBlock).tool_use_id === 'string'
  )
}

/**
 * Check whether a user message's content contains tool_result blocks.
 * This is more reliable than checking `toolUseResult === undefined` because
 * sub-agent tool result messages explicitly set `toolUseResult` to `undefined`
 * when `preserveToolUseResults` is false (the default for Explore agents).
 */
// hasToolResultContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasToolResultContent(content: unknown): boolean {
  // 返回 `Array.isArray(content) && content.some(isToolResultBlock)`，作为共享工具这次计算的结果。
  return Array.isArray(content) && content.some(isToolResultBlock)
}

/**
 * Tools that succeeded (and never errored) since the previous real turn
 * boundary.  The memory selector uses this to suppress docs about tools
 * that are working — surfacing reference material for a tool the model
 * is already calling successfully is noise.
 *
 * Any error → tool excluded (model is struggling, docs stay available).
 * No result yet → also excluded (outcome unknown).
 *
 * tool_use lives in assistant content; tool_result in user content
 * (toolUseResult set, isMeta undefined).  Both are within the scan window.
 * Backward scan sees results before uses so we collect both by id and
 * resolve after.
 */
// collectRecentSuccessfulTools 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function collectRecentSuccessfulTools(
  messages: ReadonlyArray<Message>,
  lastUserMessage: Message,
): readonly string[] {
  // useIdToName 命名 `new Map<string, string>()`，让后续代码直接表达这个值的用途。
  const useIdToName = new Map<string, string>()
  // resultByUseId 命名 `new Map<string, boolean>()`，让后续代码直接表达这个值的用途。
  const resultByUseId = new Map<string, boolean>()
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // m 命名 `messages[i]`，让后续代码直接表达这个值的用途。
    const m = messages[i]
    // m缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!m) continue
    // `isHumanTurn(m) && m` 与 `lastUserMessage` 不一致时刷新派生状态，避免使用过期结果。
    if (isHumanTurn(m) && m !== lastUserMessage) break
    // 只有 `m.type === 'assistant' && typeof m.message.conten` 满足时，共享工具才执行该分支。
    if (m.type === 'assistant' && typeof m.message.content !== 'string') {
      // 按顺序遍历 `m.message.content` 中的block，逐个交给共享工具处理。
      for (const block of m.message.content) {
        // 满足 `block.type === 'tool_use') useIdToName.set(block.id, block.name` 时，共享工具执行该分支。
        if (block.type === 'tool_use') useIdToName.set(block.id, block.name)
      }
    // 共享工具 attachments在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      m.type === 'user' &&
      'message' in m &&
      Array.isArray(m.message.content)
    ) {
      // 按顺序遍历 `m.message.content` 中的block，逐个交给共享工具处理。
      for (const block of m.message.content) {
        // 满足 `isToolResultBlock(block)` 时，共享工具执行该分支。
        if (isToolResultBlock(block)) {
          // resultByUseId.set 写入新的状态值，使共享工具后续读取保持一致。
          resultByUseId.set(block.tool_use_id, block.is_error === true)
        }
      }
    }
  }
  // failed构建`new Set<string>()` 整理出中间结果，供共享工具 attachments后续步骤使用。
  const failed = new Set<string>()
  // succeeded构建`new Set<string>()`，供后续判断或组装使用。
  const succeeded = new Set<string>()
  // 循环处理 `const [id, name] of useIdToName`，让共享工具逐项把同类条目按顺序走完。
  for (const [id, name] of useIdToName) {
    // errored 错误信息读取`resultByUseId.get`，供共享工具后续处理使用。
    const errored = resultByUseId.get(id)
    // 满足 `errored === undefined` 时，共享工具执行该分支。
    if (errored === undefined) continue
    // 满足 `errored` 时，共享工具执行该分支。
    if (errored) {
      // 调用 failed.add，触发共享工具此处需要的副作用。
      failed.add(name)
    } else {
      // 调用 succeeded.add，触发共享工具此处需要的副作用。
      succeeded.add(name)
    }
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...succeeded].filter(t => !failed.has(t))
}


/**
 * Filters prefetched memory attachments to exclude memories the model already
 * has in context via FileRead/Write/Edit tool calls (any iteration this turn)
 * or a previous turn's memory surfacing — both tracked in the cumulative
 * readFileState. Survivors are then marked in readFileState so subsequent
 * turns won't re-surface them.
 *
 * The mark-after-filter ordering is load-bearing: readMemoriesForSurfacing
 * used to write to readFileState during the prefetch, which meant the filter
 * saw every prefetch-selected path as "already in context" and dropped them
 * all (self-referential filter). Deferring the write to here, after the
 * filter runs, breaks that cycle while still deduping against tool calls
 * from any iteration.
 */
// filterDuplicateMemoryAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterDuplicateMemoryAttachments(
  attachments: Attachment[],
  readFileState: FileStateCache,
): Attachment[] {
  // 返回 `attachments`，作为共享工具这次计算的结果。
  return attachments
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(attachment => {
      // `attachment.type` 与 `'relevant_memories'` 不一致时刷新派生状态，避免使用过期结果。
      if (attachment.type !== 'relevant_memories') return attachment
      // filtered筛选`memories.filter`，供共享工具后续处理使用。
      const filtered = attachment.memories.filter(
        // m更新为 `> !readFileState.has(m.path)`，确保共享工具后续读取最新状态。
        m => !readFileState.has(m.path),
      )
      // 按顺序遍历 `filtered` 中的m，逐个交给共享工具处理。
      for (const m of filtered) {
        // readFileState.set 写入新的状态值，使共享工具后续读取保持一致。
        readFileState.set(m.path, {
          content: m.content,
          timestamp: m.mtimeMs,
          offset: undefined,
          limit: m.limit,
        })
      }
      // 返回 `filtered.length > 0 ? { ...attachment, memories: filtered } : null`，作为共享工具这次计算的结果。
      return filtered.length > 0 ? { ...attachment, memories: filtered } : null
    })
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter((a): a is Attachment => a !== null)
}

/**
 * Processes skill directories that were discovered during file operations.
 * Uses dynamicSkillDirTriggers field from ToolUseContext
 */
// getDynamicSkillAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getDynamicSkillAttachments(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // attachments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const attachments: Attachment[] = []

  // 共享工具在这里按实际状态进入对应分支。
  if (
    toolUseContext.dynamicSkillDirTriggers &&
    toolUseContext.dynamicSkillDirTriggers.size > 0
  ) {
    // Parallelize: readdir all skill dirs concurrently
    // perDirResults 集合保存`Promise.all`，供共享工具后续处理使用。
    const perDirResults = await Promise.all(
      // 调用 Array.from，触发共享工具此处需要的副作用。
      Array.from(toolUseContext.dynamicSkillDirTriggers).map(async skillDir => {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // entries 集合读取`readdir`，供共享工具后续处理使用。
          const entries = await readdir(skillDir, { withFileTypes: true })
          // candidates 集合 命名 `entries`，让后续代码直接表达这个值的用途。
          const candidates = entries
            // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
            .filter(e => e.isDirectory() || e.isSymbolicLink())
            // 链式调用 map，继续加工上一行在共享工具中产生的数据。
            .map(e => e.name)
          // Parallelize: stat all SKILL.md candidates concurrently
          // checked保存`Promise.all`，供共享工具后续处理使用。
          const checked = await Promise.all(
            // 调用 candidates.map，触发共享工具此处需要的副作用。
            candidates.map(async name => {
              // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
              try {
                // 等待 `stat(resolve(skillDir, name, 'SKILL.md'))` 完成，再继续共享工具 attachments的异步流程。
                await stat(resolve(skillDir, name, 'SKILL.md'))
                // 返回 `name`，作为共享工具这次计算的结果。
                return name
              } catch {
                // 返回 `null // SKILL.md doesn't exist, skip this entry`，作为共享工具这次计算的结果。
                return null // SKILL.md doesn't exist, skip this entry
              }
            }),
          )
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            skillDir,
            // 这个回调绑定到 skillNames: checked.filter((n): n is string => n !== null),，负责共享工具在该局部场景下的响应。
            skillNames: checked.filter((n): n is string => n !== null),
          }
        } catch {
          // Ignore errors reading skill directories (e.g., directory doesn't exist)
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { skillDir, skillNames: [] }
        }
      }),
    )

    // 循环处理 `const { skillDir, skillNames } of perDirResults`，让共享工具逐项把同类条目按顺序走完。
    for (const { skillDir, skillNames } of perDirResults) {
      // 满足 `skillNames.length > 0` 时，共享工具执行该分支。
      if (skillNames.length > 0) {
        // attachments 集合追加新条目，保持收集顺序与输入顺序一致。
        attachments.push({
          type: 'dynamic_skill',
          skillDir,
          skillNames,
          displayPath: relative(getCwd(), skillDir),
        })
      }
    }

    // 调用 toolUseContext.dynamicSkillDirTriggers.clear，触发共享工具此处需要的副作用。
    toolUseContext.dynamicSkillDirTriggers.clear()
  }

  // 返回 `attachments`，作为共享工具这次计算的结果。
  return attachments
}

// Track which skills have been sent to avoid re-sending. Keyed by agentId
// (empty string = main thread) so subagents get their own turn-0 listing —
// without per-agent scoping, the main thread populating this Set would cause
// every subagent's filterToBundledAndMcp result to dedup to empty.
// sentSkillNames 集合构建`new Map<string, Set<string>>()`，供后续判断或组装使用。
const sentSkillNames = new Map<string, Set<string>>()

// Called when the skill set genuinely changes (plugin reload, skill file
// change on disk) so new skills get announced. NOT called on compact —
// post-compact re-injection costs ~4K tokens/event for marginal benefit.
// resetSentSkillNames 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSentSkillNames(): void {
  // 调用 sentSkillNames.clear，触发共享工具此处需要的副作用。
  sentSkillNames.clear()
  // suppressNext更新为 `false`，确保共享工具后续读取最新状态。
  suppressNext = false
}

/**
 * Suppress the next skill-listing injection. Called by conversationRecovery
 * on --resume when a skill_listing attachment already exists in the
 * transcript.
 *
 * `sentSkillNames` is module-scope — process-local. Each `claude -p` spawn
 * starts with an empty Map, so without this every resume re-injects the
 * full ~600-token listing even though it's already in the conversation from
 * the prior process. Shows up on every --resume; particularly loud for
 * daemons that respawn frequently.
 *
 * Trade-off: skills added between sessions won't be announced until the
 * next non-resume session. Acceptable — skill_listing was never meant to
 * cover cross-process deltas, and the agent can still call them (they're
 * in the Skill tool's runtime registry regardless).
 */
// suppressNextSkillListing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function suppressNextSkillListing(): void {
  // suppressNext更新为 `true`，确保共享工具后续读取最新状态。
  suppressNext = true
}
// suppressNext标记共享工具 attachments是否启用对应路径。
let suppressNext = false

// When skill-search is enabled and the filtered (bundled + MCP) listing exceeds
// this count, fall back to bundled-only. Protects MCP-heavy users (100+ servers)
// from truncation while keeping the turn-0 guarantee for typical setups.
// FILTERED_LISTING_MAX 集合 命名 `30`，让后续代码直接表达这个值的用途。
const FILTERED_LISTING_MAX = 30

/**
 * Filter skills to bundled (Anthropic-curated) + MCP (user-connected) only.
 * Used when skill-search is enabled to resolve the turn-0 gap for subagents:
 * these sources are small, intent-signaled, and won't hit the truncation budget.
 * User/project/plugin skills (the long tail — 200+) go through discovery instead.
 *
 * Falls back to bundled-only if bundled+mcp exceeds FILTERED_LISTING_MAX.
 */
// filterToBundledAndMcp 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterToBundledAndMcp(commands: Command[]): Command[] {
  // filtered筛选`commands.filter`，供共享工具后续处理使用。
  const filtered = commands.filter(
    cmd => cmd.loadedFrom === 'bundled' || cmd.loadedFrom === 'mcp',
  )
  // 满足 `filtered.length > FILTERED_LISTING_MAX` 时，共享工具执行该分支。
  if (filtered.length > FILTERED_LISTING_MAX) {
    // 返回 `filtered.filter(cmd => cmd.loadedFrom === 'bundled')`，作为共享工具这次计算的结果。
    return filtered.filter(cmd => cmd.loadedFrom === 'bundled')
  }
  // 返回 `filtered`，作为共享工具这次计算的结果。
  return filtered
}

// getSkillListingAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getSkillListingAttachments(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Skip skill listing for agents that don't have the Skill tool — they can't use skills directly.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    // 这个回调绑定到 !toolUseContext.options.tools.some(t => toolMatchesName(t, SKILL_TOOL_NAME))，负责共享工具在该局部场景下的响应。
    !toolUseContext.options.tools.some(t => toolMatchesName(t, SKILL_TOOL_NAME))
  ) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // cwd读取`getProjectRoot`，供共享工具后续处理使用。
  const cwd = getProjectRoot()
  // localCommands 命令数据读取`getSkillToolCommands`，供共享工具后续处理使用。
  const localCommands = await getSkillToolCommands(cwd)
  // mcpSkills 集合读取`getMcpSkillCommands`，供共享工具后续处理使用。
  const mcpSkills = getMcpSkillCommands(
    toolUseContext.getAppState().mcp.commands,
  )
  // allCommands 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let allCommands =
    mcpSkills.length > 0
      ? uniqBy([...localCommands, ...mcpSkills], 'name')
      : localCommands

  // When skill search is active, filter to bundled + MCP instead of full
  // suppression. Resolves the turn-0 gap: main thread gets turn-0 discovery
  // via getTurnZeroSkillDiscovery (blocking), but subagents use the async
  // subagent_spawn signal (collected post-tools, visible turn 1). Bundled +
  // MCP are small and intent-signaled; user/project/plugin skills go through
  // discovery. feature() first for DCE — the property-access string leaks
  // otherwise even with ?. on null.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('EXPERIMENTAL_SKILL_SEARCH') &&
    skillSearchModules?.featureCheck.isSkillSearchEnabled()
  ) {
    // allCommands 命令数据更新为 `filterToBundledAndMcp(allCommands)`，确保共享工具后续读取最新状态。
    allCommands = filterToBundledAndMcp(allCommands)
  }

  // agentKey保存`toolUseContext.agentId ?? ''`，供后续判断或组装使用。
  const agentKey = toolUseContext.agentId ?? ''
  // sent读取`sentSkillNames.get`，供共享工具后续处理使用。
  let sent = sentSkillNames.get(agentKey)
  // sent缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!sent) {
    // sent更新为 `new Set()`，确保共享工具后续读取最新状态。
    sent = new Set()
    // sentSkillNames.set 写入新的状态值，使共享工具后续读取保持一致。
    sentSkillNames.set(agentKey, sent)
  }

  // Resume path: prior process already injected a listing; it's in the
  // transcript. Mark everything current as sent so only post-resume deltas
  // (skills loaded later via /reload-plugins etc) get announced.
  // 满足 `suppressNext` 时，共享工具执行该分支。
  if (suppressNext) {
    // suppressNext更新为 `false`，确保共享工具后续读取最新状态。
    suppressNext = false
    // 按顺序遍历 `allCommands` 中的cmd 命令数据，逐个交给共享工具处理。
    for (const cmd of allCommands) {
      // 调用 sent.add，触发共享工具此处需要的副作用。
      sent.add(cmd.name)
    }
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Find skills we haven't sent yet
  // newSkills 集合筛选`allCommands.filter`，供共享工具后续处理使用。
  const newSkills = allCommands.filter(cmd => !sent.has(cmd.name))

  // newSkills 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (newSkills.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // If no skills have been sent yet, this is the initial batch
  // isInitial标记共享工具 attachments是否启用对应路径。
  const isInitial = sent.size === 0

  // Mark as sent
  // 按顺序遍历 `newSkills` 中的cmd 命令数据，逐个交给共享工具处理。
  for (const cmd of newSkills) {
    // 调用 sent.add，触发共享工具此处需要的副作用。
    sent.add(cmd.name)
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Sending ${newSkills.length} skills via attachment (${isInitial ? 'initial' : 'dynamic'}, ${sent.size} total sent)`,
  )

  // Format within budget using existing logic
  // contextWindowTokens 集合读取`getContextWindowForModel`，供共享工具后续处理使用。
  const contextWindowTokens = getContextWindowForModel(
    toolUseContext.options.mainLoopModel,
    getSdkBetas(),
  )
  // 文本内容格式化`formatCommandsWithinBudget`，供共享工具后续处理使用。
  const content = formatCommandsWithinBudget(newSkills, contextWindowTokens)

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    {
      type: 'skill_listing',
      content,
      skillCount: newSkills.length,
      isInitial,
    },
  ]
}

// getSkillDiscoveryAttachment moved to skillSearch/prefetch.ts as
// getTurnZeroSkillDiscovery — keeps the 'skill_discovery' string literal inside
// a feature-gated module so it doesn't leak into external builds.

// extractAtMentionedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractAtMentionedFiles(content: string): string[] {
  // Extract filenames mentioned with @ symbol, including line range syntax: @file.txt#L10-20
  // Also supports quoted paths for files with spaces: @"my/file with spaces.txt"
  // Example: "foo bar @baz moo" would extract "baz"
  // Example: 'check @"my file.txt" please' would extract "my file.txt"

  // Two patterns: quoted paths and regular paths
  // quotedAtMentionRegex保存`/(^|\s)@"([^"]+)"/g`，供共享工具 attachments后续判断或输出使用。
  const quotedAtMentionRegex = /(^|\s)@"([^"]+)"/g
  // 普通 @ 文件匹配器保存`/(^|\s)@([^\s]+)\b/g`，供共享工具 attachments后续步骤使用。
  const regularAtMentionRegex = /(^|\s)@([^\s]+)\b/g

  // 带引号文件提及列表从空数组开始收集，后续按处理顺序追加条目。
  const quotedMatches: string[] = []
  // 普通文件提及列表从空数组开始收集，后续按处理顺序追加条目。
  const regularMatches: string[] = []

  // Extract quoted mentions first (skip agent mentions like @"code-reviewer (agent)")
  // match 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let match
  // 只要 (match = quotedAtMentionRegex.exec(content)) !== null 成立，就持续推进共享工具中的循环处理。
  while ((match = quotedAtMentionRegex.exec(content)) !== null) {
    // 判断 match[2] && !match[2].endsWith(' (agent)')，将共享工具分流到只适用于该条件的处理路径。
    if (match[2] && !match[2].endsWith(' (agent)')) {
      // 带引号文件提及列表追加新条目，保持收集顺序与输入顺序一致。
      quotedMatches.push(match[2]) // The content inside quotes
    }
  }

  // Extract regular mentions
  // 普通 @ 匹配结果匹配`content.match`，供共享工具后续处理使用。
  const regularMatchArray = content.match(regularAtMentionRegex) || []
  // regularMatchArray.forEach执行共享工具在此处需要的副作用或外部交互。
  regularMatchArray.forEach(match => {
    // 文件名格式化`match.slice`，供共享工具后续处理使用。
    const filename = match.slice(match.indexOf('@') + 1)
    // Don't include if it starts with a quote (already handled as quoted)
    // 判断 !filename.startsWith('"')，将共享工具分流到只适用于该条件的处理路径。
    if (!filename.startsWith('"')) {
      // 普通文件提及列表追加新条目，保持收集顺序与输入顺序一致。
      regularMatches.push(filename)
    }
  })

  // Combine and deduplicate
  // 返回 uniq([...quotedMatches, ...regularMatches])，把共享工具这个分支的结果交还调用方。
  return uniq([...quotedMatches, ...regularMatches])
}

// extractMcpResourceMentions 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
export function extractMcpResourceMentions(content: string): string[] {
  // Extract MCP resources mentioned with @ symbol in format @server:uri
  // Example: "@server1:resource/path" would extract "server1:resource/path"
  // MCP 资源提及匹配器保存`/(^|\s)@([^\s]+:[^\s]+)\b/g`，供共享工具 attachments后续步骤使用。
  const atMentionRegex = /(^|\s)@([^\s]+:[^\s]+)\b/g
  // 匹配结果匹配`content.match`，供共享工具后续处理使用。
  const matches = content.match(atMentionRegex) || []

  // Remove the prefix (everything before @) from each match
  // 返回 uniq(matches.map(match => match.slice(match.indexOf('@') + 1)))，把共享工具这个分支的结果交还调用方。
  return uniq(matches.map(match => match.slice(match.indexOf('@') + 1)))
}

// extractAgentMentions 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
export function extractAgentMentions(content: string): string[] {
  // Extract agent mentions in two formats:
  // 1. @agent-<agent-type> (legacy/manual typing)
  //    Example: "@agent-code-elegance-refiner" → "agent-code-elegance-refiner"
  // 2. @"<agent-type> (agent)" (from autocomplete selection)
  //    Example: '@"code-reviewer (agent)"' → "code-reviewer"
  // Supports colons, dots, and at-signs for plugin-scoped agents like "@agent-asana:project-status-updater"
  // results 集合从空数组开始收集，后续按处理顺序追加条目。
  const results: string[] = []

  // Match quoted format: @"<type> (agent)"
  // 带引号 Agent 匹配器保存`/(^|\s)@"([\w:.@-]+) \(agent\)"/g`，供共享工具 attachments后续步骤使用。
  const quotedAgentRegex = /(^|\s)@"([\w:.@-]+) \(agent\)"/g
  // match 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let match
  // 只要 (match = quotedAgentRegex.exec(content)) !== null 成立，就持续推进共享工具中的循环处理。
  while ((match = quotedAgentRegex.exec(content)) !== null) {
    // 满足 `match[2]` 时，共享工具执行该分支。
    if (match[2]) {
      // results 集合追加新条目，保持收集顺序与输入顺序一致。
      results.push(match[2])
    }
  }

  // Match unquoted format: @agent-<type>
  // 未加引号 Agent 匹配器保存`/(^|\s)@(agent-[\w:.@-]+)/g`，供共享工具 attachments后续步骤使用。
  const unquotedAgentRegex = /(^|\s)@(agent-[\w:.@-]+)/g
  // 未加引号 Agent 匹配结果匹配`content.match`，供共享工具后续处理使用。
  const unquotedMatches = content.match(unquotedAgentRegex) || []
  // 遍历 const m of unquotedMatches，让共享工具逐项完成同一类处理。
  for (const m of unquotedMatches) {
    // results 集合追加新条目，保持收集顺序与输入顺序一致。
    results.push(m.slice(m.indexOf('@') + 1))
  }

  // 返回 uniq(results)，把共享工具这个分支的结果交还调用方。
  return uniq(results)
}

// AtMentionedFileLines 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface AtMentionedFileLines {
  filename: string
  lineStart?: number
  lineEnd?: number
}

// parseAtMentionedFileLines 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
export function parseAtMentionedFileLines(
  mention: string,
): AtMentionedFileLines {
  // Parse mentions like "file.txt#L10-20", "file.txt#heading", or just "file.txt"
  // Supports line ranges (#L10, #L10-20) and strips non-line-range fragments (#heading)
  // match匹配`mention.match`，供共享工具后续处理使用。
  const match = mention.match(/^([^#]+)(?:#L(\d+)(?:-(\d+))?)?(?:#[^#]*)?$/)

  // match缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
  if (!match) {
    // 返回 { filename: mention }，把共享工具这个分支的结果交还调用方。
    return { filename: mention }
  }

  // 从 `match` 按位置拆出 filename、lineStartStr、lineEndStr，让共享工具 attachments分别处理这些返回值。
  const [, filename, lineStartStr, lineEndStr] = match
  // 起始行号解析`parseInt`，供共享工具后续处理使用。
  const lineStart = lineStartStr ? parseInt(lineStartStr, 10) : undefined
  // 结束行号解析`parseInt`，供共享工具后续处理使用。
  const lineEnd = lineEndStr ? parseInt(lineEndStr, 10) : lineStart

  // 返回 { filename: filename ?? mention, lineStart, lineEnd }，把共享工具这个分支的结果交还调用方。
  return { filename: filename ?? mention, lineStart, lineEnd }
}

// getDiagnosticAttachments 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
async function getDiagnosticAttachments(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // Diagnostics are only useful if the agent has the Bash tool to act on them
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    // 这个回调绑定到 !toolUseContext.options.tools.some(t => toolMatchesName(t, BASH_TOOL_NAME))，负责共享工具在该局部场景下的响应。
    !toolUseContext.options.tools.some(t => toolMatchesName(t, BASH_TOOL_NAME))
  ) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // Get new diagnostics from the tracker (IDE diagnostics via MCP)
  // 新增诊断列表读取`diagnosticTracker.getNewDiagnostics`，供共享工具后续处理使用。
  const newDiagnostics = await diagnosticTracker.getNewDiagnostics()
  // 新增诊断列表为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (newDiagnostics.length === 0) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // 返回 [，把共享工具这个分支的结果交还调用方。
  return [
    {
      type: 'diagnostics',
      files: newDiagnostics,
      isNew: true,
    },
  ]
}

/**
 * Get LSP diagnostic attachments from passive LSP servers.
 * Follows the AsyncHookRegistry pattern for consistent async attachment delivery.
 */
// getLSPDiagnosticAttachments 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
async function getLSPDiagnosticAttachments(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // LSP diagnostics are only useful if the agent has the Bash tool to act on them
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    // 这个回调绑定到 !toolUseContext.options.tools.some(t => toolMatchesName(t, BASH_TOOL_NAME))，负责共享工具在该局部场景下的响应。
    !toolUseContext.options.tools.some(t => toolMatchesName(t, BASH_TOOL_NAME))
  ) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('LSP Diagnostics: getLSPDiagnosticAttachments called')

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 诊断集合读取`checkForLSPDiagnostics`，供共享工具后续处理使用。
    const diagnosticSets = checkForLSPDiagnostics()

    // 诊断集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (diagnosticSets.length === 0) {
      // 返回 []，把共享工具这个分支的结果交还调用方。
      return []
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `LSP Diagnostics: Found ${diagnosticSets.length} pending diagnostic set(s)`,
    )

    // Convert each diagnostic set to an attachment
    // 这个回调绑定到 const attachments: Attachment[] = diagnosticSets.map(({ files }) => ({，负责共享工具在该局部场景下的响应。
    const attachments: Attachment[] = diagnosticSets.map(({ files }) => ({
      type: 'diagnostics' as const,
      files,
      isNew: true,
    }))

    // Clear delivered diagnostics from registry to prevent memory leak
    // Follows same pattern as removeDeliveredAsyncHooks
    // 满足 `diagnosticSets.length > 0` 时，共享工具执行该分支。
    if (diagnosticSets.length > 0) {
      // clearAllLSPDiagnostics执行共享工具在此处需要的副作用或外部交互。
      clearAllLSPDiagnostics()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `LSP Diagnostics: Cleared ${diagnosticSets.length} delivered diagnostic(s) from registry`,
      )
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `LSP Diagnostics: Returning ${attachments.length} diagnostic attachment(s)`,
    )

    // 返回 attachments，把共享工具这个分支的结果交还调用方。
    return attachments
  } catch (error) {
    // err保存`toError`，供共享工具后续处理使用。
    const err = toError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(`Failed to get LSP diagnostic attachments: ${err.message}`),
    )
    // Return empty array to allow other attachments to proceed
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }
}

// 共享工具 attachments处理 `export async function* getAttachmentMessages(`，完成这一小步状态转换。
export async function* getAttachmentMessages(
  input: string | null,
  toolUseContext: ToolUseContext,
  ideSelection: IDESelection | null,
  queuedCommands: QueuedCommand[],
  messages?: Message[],
  querySource?: QuerySource,
  options?: { skipSkillDiscovery?: boolean },
): AsyncGenerator<AttachmentMessage, void> {
  // TODO: Compute this upstream
  // 附件列表读取`getAttachments`，供共享工具后续处理使用。
  const attachments = await getAttachments(
    input,
    toolUseContext,
    ideSelection,
    queuedCommands,
    messages,
    querySource,
    options,
  )

  // 附件列表为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (attachments.length === 0) {
    // 共享工具 attachments在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_attachments', {
    attachment_types: attachments.map(
      // _更新为 `> _.type`，确保共享工具后续读取最新状态。
      _ => _.type,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 遍历 const attachment of attachments，让共享工具逐项完成同一类处理。
  for (const attachment of attachments) {
    // 生成器产出 `createAttachmentMessage(attachment)`，把阶段性结果交给上层消费。
    yield createAttachmentMessage(attachment)
  }
}

/**
 * Generates a file attachment by reading a file with proper validation and truncation.
 * This is the core file reading logic shared between @-mentioned files and post-compact restoration.
 *
 * @param filename The absolute path to the file to read
 * @param toolUseContext The tool use context for calling FileReadTool
 * @param options Optional configuration for file reading
 * @returns A new_file attachment or null if the file couldn't be read
 */
/**
 * Check if a PDF file should be represented as a lightweight reference
 * instead of being inlined. Returns a PDFReferenceAttachment for large PDFs
 * (more than PDF_AT_MENTION_INLINE_THRESHOLD pages), or null otherwise.
 */
// tryGetPDFReference 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
export async function tryGetPDFReference(
  filename: string,
): Promise<PDFReferenceAttachment | null> {
  // 文件扩展名解析`parse`，供共享工具后续处理使用。
  const ext = parse(filename).ext.toLowerCase()
  // 判断 !isPDFExtension(ext)，将共享工具分流到只适用于该条件的处理路径。
  if (!isPDFExtension(ext)) {
    // 返回 null，把共享工具这个分支的结果交还调用方。
    return null
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 并行获取 stats、pageCount，缩短共享工具 attachments等待多个独立异步任务的时间。
    const [stats, pageCount] = await Promise.all([
      getFsImplementation().stat(filename),
      getPDFPageCount(filename),
    ])
    // Use page count if available, otherwise fall back to size heuristic (~100KB per page)
    // 有效页数保存`Math.ceil`，供共享工具后续处理使用。
    const effectivePageCount = pageCount ?? Math.ceil(stats.size / (100 * 1024))
    // 满足 `effectivePageCount > PDF_AT_MENTION_INLINE_THRESH` 时，共享工具执行该分支。
    if (effectivePageCount > PDF_AT_MENTION_INLINE_THRESHOLD) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_pdf_reference_attachment', {
        pageCount: effectivePageCount,
        fileSize: stats.size,
        hadPdfinfo: pageCount !== null,
      } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        type: 'pdf_reference',
        filename,
        pageCount: effectivePageCount,
        fileSize: stats.size,
        displayPath: relative(getCwd(), filename),
      }
    }
  } catch {
    // If we can't stat the file, return null to proceed with normal reading
  }
  // 返回 null，把共享工具这个分支的结果交还调用方。
  return null
}

// generateFileAttachment 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
export async function generateFileAttachment(
  filename: string,
  toolUseContext: ToolUseContext,
  successEventName: string,
  errorEventName: string,
  mode: 'compact' | 'at-mention',
  options?: {
    offset?: number
    limit?: number
  },
): Promise<
  | FileAttachment
  | CompactFileReferenceAttachment
  | PDFReferenceAttachment
  | AlreadyReadFileAttachment
  | null
> {
  // 从 `options ?? {}` 解构 offset、limit，减少共享工具 attachments对同一对象的重复访问。
  const { offset, limit } = options ?? {}

  // Check if file has a deny rule configured
  // 应用状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // 判断 isFileReadDenied(filename, appState.toolPermissionContext)，将共享工具分流到只适用于该条件的处理路径。
  if (isFileReadDenied(filename, appState.toolPermissionContext)) {
    // 返回 null，把共享工具这个分支的结果交还调用方。
    return null
  }

  // Check file size before attempting to read (skip for PDFs — they have their own size/page handling below)
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    mode === 'at-mention' &&
    !isFileWithinReadSizeLimit(
      filename,
      getDefaultFileReadingLimits().maxSizeBytes,
    )
  ) {
    // 文件扩展名解析`parse`，供共享工具后续处理使用。
    const ext = parse(filename).ext.toLowerCase()
    // 判断 !isPDFExtension(ext)，将共享工具分流到只适用于该条件的处理路径。
    if (!isPDFExtension(ext)) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 文件状态读取`getFsImplementation`，供共享工具后续处理使用。
        const stats = await getFsImplementation().stat(filename)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_attachment_file_too_large', {
          size_bytes: stats.size,
          mode,
        } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
        // 返回 null，把共享工具这个分支的结果交还调用方。
        return null
      } catch {
        // If we can't stat the file, proceed with normal reading (will fail later if file doesn't exist)
      }
    }
  }

  // For large PDFs on @ mention, return a lightweight reference instead of inlining
  // `mode` 命中特定值 `'at-mention'` 时，进入共享工具对应处理。
  if (mode === 'at-mention') {
    // PDF 引用保存`tryGetPDFReference`，供共享工具后续处理使用。
    const pdfRef = await tryGetPDFReference(filename)
    // 满足 `pdfRef` 时，共享工具执行该分支。
    if (pdfRef) {
      // 返回 pdfRef，把共享工具这个分支的结果交还调用方。
      return pdfRef
    }
  }

  // Check if file is already in context with latest version
  // 已缓存文件状态读取`readFileState.get`，供共享工具后续处理使用。
  const existingFileState = toolUseContext.readFileState.get(filename)
  // `existingFileState && mode` 命中特定值 `'at-mention'` 时，进入共享工具对应处理。
  if (existingFileState && mode === 'at-mention') {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Check if the file has been modified since we last read it
      // 修改时间读取`getFileModificationTimeAsync`，供共享工具后续处理使用。
      const mtimeMs = await getFileModificationTimeAsync(filename)

      // Handle timestamp format inconsistency:
      // - FileReadTool stores Date.now() (current time when read)
      // - FileEdit/WriteTools store mtimeMs (file modification time)
      //
      // If timestamp > mtimeMs, it was stored by FileReadTool using Date.now()
      // In this case, we should not use the optimization since we can't reliably
      // compare modification times. Only use optimization when timestamp <= mtimeMs,
      // indicating it was stored by FileEdit/WriteTool with actual mtimeMs.

      // 共享工具在这里进入条件判断，后续代码按实际状态分流。
      if (
        existingFileState.timestamp <= mtimeMs &&
        mtimeMs === existingFileState.timestamp
      ) {
        // File hasn't been modified, return already_read_file attachment
        // This tells the system the file is already in context and doesn't need to be sent to API
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent(successEventName, {})
        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          type: 'already_read_file',
          filename,
          displayPath: relative(getCwd(), filename),
          content: {
            type: 'text',
            file: {
              filePath: filename,
              content: existingFileState.content,
              numLines: countCharInString(existingFileState.content, '\n') + 1,
              startLine: offset ?? 1,
              totalLines:
                countCharInString(existingFileState.content, '\n') + 1,
            },
          },
        }
      }
    } catch {
      // If we can't stat the file, proceed with normal reading
    }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文件读取输入集中保存共享工具 attachments要一起传递的字段。
    const fileInput = {
      file_path: filename,
      offset,
      limit,
    }

    // readTruncatedFile 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
    async function readTruncatedFile(): Promise<
      | FileAttachment
      | CompactFileReferenceAttachment
      | AlreadyReadFileAttachment
      | null
    > {
      // `mode` 命中特定值 `'compact'` 时，进入共享工具对应处理。
      if (mode === 'compact') {
        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          type: 'compact_file_reference',
          filename,
          displayPath: relative(getCwd(), filename),
        }
      }

      // Check deny rules before reading truncated file
      // 应用状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
      const appState = toolUseContext.getAppState()
      // 判断 isFileReadDenied(filename, appState.toolPermissionContext)，将共享工具分流到只适用于该条件的处理路径。
      if (isFileReadDenied(filename, appState.toolPermissionContext)) {
        // 返回 null，把共享工具这个分支的结果交还调用方。
        return null
      }

      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // Read only the first MAX_LINES_TO_READ lines for files that are too large
        // 截断读取输入集中保存共享工具 attachments要一起传递的字段。
        const truncatedInput = {
          file_path: filename,
          offset: offset ?? 1,
          limit: MAX_LINES_TO_READ,
        }
        // 结果保存`FileReadTool.call`，供共享工具后续处理使用。
        const result = await FileReadTool.call(truncatedInput, toolUseContext)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent(successEventName, {})

        // 返回 {，把共享工具这个分支的结果交还调用方。
        return {
          type: 'file' as const,
          filename,
          content: result.data,
          truncated: true,
          displayPath: relative(getCwd(), filename),
        }
      } catch {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent(errorEventName, {})
        // 返回 null，把共享工具这个分支的结果交还调用方。
        return null
      }
    }

    // Validate file path is valid
    // 输入校验结果读取`FileReadTool.validateInput`，供共享工具后续处理使用。
    const isValid = await FileReadTool.validateInput(fileInput, toolUseContext)
    // isValid.result缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
    if (!isValid.result) {
      // 返回 null，把共享工具这个分支的结果交还调用方。
      return null
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果保存`FileReadTool.call`，供共享工具后续处理使用。
      const result = await FileReadTool.call(fileInput, toolUseContext)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent(successEventName, {})
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        type: 'file',
        filename,
        content: result.data,
        displayPath: relative(getCwd(), filename),
      }
    } catch (error) {
      // 共享工具在这里进入条件判断，后续代码按实际状态分流。
      if (
        error instanceof MaxFileReadTokenExceededError ||
        error instanceof FileTooLargeError
      ) {
        // 返回 await readTruncatedFile()，把共享工具这个分支的结果交还调用方。
        return await readTruncatedFile()
      }
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }
  } catch {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent(errorEventName, {})
    // 返回 null，把共享工具这个分支的结果交还调用方。
    return null
  }
}

// createAttachmentMessage 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
export function createAttachmentMessage(
  attachment: Attachment,
): AttachmentMessage {
  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    attachment,
    type: 'attachment',
    uuid: randomUUID(),
    timestamp: new Date().toISOString(),
  }
}

// getTodoReminderTurnCounts 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
function getTodoReminderTurnCounts(messages: Message[]): {
  turnsSinceLastTodoWrite: number
  turnsSinceLastReminder: number
} {
  // 最近 TodoWrite 位置保存`-1`，供共享工具 attachments后续步骤使用。
  let lastTodoWriteIndex = -1
  // 最近提醒位置保存`-1`，供共享工具 attachments后续步骤使用。
  let lastReminderIndex = -1
  // 写入后的 assistant 轮数保存`0`，供共享工具 attachments后续步骤使用。
  let assistantTurnsSinceWrite = 0
  // 提醒后的 assistant 轮数保存`0`，供共享工具 attachments后续步骤使用。
  let assistantTurnsSinceReminder = 0

  // Iterate backwards to find most recent events
  // 遍历 let i = messages.length - 1; i >= 0; i--，让共享工具逐项完成同一类处理。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息保存`messages[i]`，供共享工具 attachments后续步骤使用。
    const message = messages[i]

    // `message?.type` 命中特定值 `'assistant'` 时，进入共享工具对应处理。
    if (message?.type === 'assistant') {
      // 判断 isThinkingMessage(message)，将共享工具分流到只适用于该条件的处理路径。
      if (isThinkingMessage(message)) {
        // Skip thinking messages
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Check for TodoWrite usage BEFORE incrementing counter
      // (we don't want to count the TodoWrite message itself as "1 turn since write")
      // 共享工具在这里进入条件判断，后续代码按实际状态分流。
      if (
        lastTodoWriteIndex === -1 &&
        'message' in message &&
        Array.isArray(message.message?.content) &&
        message.message.content.some(
          // block更新为 `> block.type === 'tool_use' && block.name === 'TodoWrite'`，确保共享工具后续读取最新状态。
          block => block.type === 'tool_use' && block.name === 'TodoWrite',
        )
      ) {
        // 最近 TodoWrite 位置更新为 `i`，确保共享工具后续读取最新状态。
        lastTodoWriteIndex = i
      }

      // Count assistant turns before finding events
      // 判断 lastTodoWriteIndex === -1，将共享工具分流到只适用于该条件的处理路径。
      if (lastTodoWriteIndex === -1) assistantTurnsSinceWrite++
      // 判断 lastReminderIndex === -1，将共享工具分流到只适用于该条件的处理路径。
      if (lastReminderIndex === -1) assistantTurnsSinceReminder++
    // 共享工具 attachments处理 `} else if (`，完成这一小步状态转换。
    } else if (
      lastReminderIndex === -1 &&
      message?.type === 'attachment' &&
      message.attachment.type === 'todo_reminder'
    ) {
      // 最近提醒位置更新为 `i`，确保共享工具后续读取最新状态。
      lastReminderIndex = i
    }

    // `lastTodoWriteIndex` 与 `-1 && lastReminderIndex !=` 不一致时刷新派生状态。
    if (lastTodoWriteIndex !== -1 && lastReminderIndex !== -1) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    turnsSinceLastTodoWrite: assistantTurnsSinceWrite,
    turnsSinceLastReminder: assistantTurnsSinceReminder,
  }
}

// getTodoReminderAttachments 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
async function getTodoReminderAttachments(
  messages: Message[] | undefined,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // Skip if TodoWrite tool is not available
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    // 这个回调绑定到 !toolUseContext.options.tools.some(t =>，负责共享工具在该局部场景下的响应。
    !toolUseContext.options.tools.some(t =>
      toolMatchesName(t, TODO_WRITE_TOOL_NAME),
    )
  ) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // When SendUserMessage is in the toolkit, it's the primary communication
  // channel and the model is always told to use it (#20467). TodoWrite
  // becomes a side channel — nudging the model about it conflicts with the
  // brief workflow. The tool itself stays available; this only gates the
  // "you haven't used it in a while" nag.
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    BRIEF_TOOL_NAME &&
    // toolUseContext.options.tools.some执行共享工具在此处需要的副作用或外部交互。
    toolUseContext.options.tools.some(t => toolMatchesName(t, BRIEF_TOOL_NAME))
  ) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // Skip if no messages provided
  // !messages || messages 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!messages || messages.length === 0) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
  const { turnsSinceLastTodoWrite, turnsSinceLastReminder } =
    getTodoReminderTurnCounts(messages)

  // Check if we should show a reminder
  // 共享工具在这里进入条件判断，后续代码按实际状态分流。
  if (
    turnsSinceLastTodoWrite >= TODO_REMINDER_CONFIG.TURNS_SINCE_WRITE &&
    turnsSinceLastReminder >= TODO_REMINDER_CONFIG.TURNS_BETWEEN_REMINDERS
  ) {
    // todo 状态键读取`getSessionId`，供共享工具后续处理使用。
    const todoKey = toolUseContext.agentId ?? getSessionId()
    // 应用状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
    const appState = toolUseContext.getAppState()
    // todo 列表保存`appState.todos[todoKey] ?? []`，供共享工具 attachments后续步骤使用。
    const todos = appState.todos[todoKey] ?? []
    // 返回 [，把共享工具这个分支的结果交还调用方。
    return [
      {
        type: 'todo_reminder',
        content: todos,
        itemCount: todos.length,
      },
    ]
  }

  // 返回 []，把共享工具这个分支的结果交还调用方。
  return []
}

// getTaskReminderTurnCounts 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
function getTaskReminderTurnCounts(messages: Message[]): {
  turnsSinceLastTaskManagement: number
  turnsSinceLastReminder: number
} {
  // 最近任务管理位置保存`-1`，供共享工具 attachments后续步骤使用。
  let lastTaskManagementIndex = -1
  // 最近提醒位置保存`-1`，供共享工具 attachments后续步骤使用。
  let lastReminderIndex = -1
  // 任务管理后的 assistant 轮数保存`0`，供共享工具 attachments后续步骤使用。
  let assistantTurnsSinceTaskManagement = 0
  // 提醒后的 assistant 轮数保存`0`，供共享工具 attachments后续步骤使用。
  let assistantTurnsSinceReminder = 0

  // Iterate backwards to find most recent events
  // 遍历 let i = messages.length - 1; i >= 0; i--，让共享工具逐项完成同一类处理。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息保存`messages[i]`，供共享工具 attachments后续步骤使用。
    const message = messages[i]

    // `message?.type` 命中特定值 `'assistant'` 时，进入共享工具对应处理。
    if (message?.type === 'assistant') {
      // 判断 isThinkingMessage(message)，将共享工具分流到只适用于该条件的处理路径。
      if (isThinkingMessage(message)) {
        // Skip thinking messages
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Check for TaskCreate or TaskUpdate usage BEFORE incrementing counter
      // 共享工具在这里进入条件判断，后续代码按实际状态分流。
      if (
        lastTaskManagementIndex === -1 &&
        'message' in message &&
        Array.isArray(message.message?.content) &&
        message.message.content.some(
          // block更新为 `>`，确保共享工具后续读取最新状态。
          block =>
            block.type === 'tool_use' &&
            (block.name === TASK_CREATE_TOOL_NAME ||
              block.name === TASK_UPDATE_TOOL_NAME),
        )
      ) {
        // 最近任务管理位置更新为 `i`，确保共享工具后续读取最新状态。
        lastTaskManagementIndex = i
      }

      // Count assistant turns before finding events
      // 判断 lastTaskManagementIndex === -1，将共享工具分流到只适用于该条件的处理路径。
      if (lastTaskManagementIndex === -1) assistantTurnsSinceTaskManagement++
      // 判断 lastReminderIndex === -1，将共享工具分流到只适用于该条件的处理路径。
      if (lastReminderIndex === -1) assistantTurnsSinceReminder++
    // 共享工具 attachments处理 `} else if (`，完成这一小步状态转换。
    } else if (
      lastReminderIndex === -1 &&
      message?.type === 'attachment' &&
      message.attachment.type === 'task_reminder'
    ) {
      // 最近提醒位置更新为 `i`，确保共享工具后续读取最新状态。
      lastReminderIndex = i
    }

    // `lastTaskManagementIndex` 与 `-1 && lastReminderInd` 不一致时刷新派生状态。
    if (lastTaskManagementIndex !== -1 && lastReminderIndex !== -1) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }

  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    turnsSinceLastTaskManagement: assistantTurnsSinceTaskManagement,
    turnsSinceLastReminder: assistantTurnsSinceReminder,
  }
}

// getTaskReminderAttachments 承担共享工具中的独立步骤，串起共享工具 attachments需要的输入整理、状态更新和结果输出。
async function getTaskReminderAttachments(
  messages: Message[] | undefined,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // 判断 !isTodoV2Enabled()，将共享工具分流到只适用于该条件的处理路径。
  if (!isTodoV2Enabled()) {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // Skip for ant users
  // `process.env.USER_TYPE` 命中特定值 `'ant'` 时，进入共享工具对应处理。
  if (process.env.USER_TYPE === 'ant') {
    // 返回 []，把共享工具这个分支的结果交还调用方。
    return []
  }

  // When SendUserMessage is in the toolkit, it's the primary communication
  // channel and the model is always told to use it (#20467). TaskUpdate
  // becomes a side channel — nudging the model about it conflicts with the
  // brief workflow. The tool itself stays available; this only gates the nag.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    BRIEF_TOOL_NAME &&
    // 调用 toolUseContext.options.tools.some，触发共享工具此处需要的副作用。
    toolUseContext.options.tools.some(t => toolMatchesName(t, BRIEF_TOOL_NAME))
  ) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Skip if TaskUpdate tool is not available
  // 共享工具在这里按实际状态进入对应分支。
  if (
    // 这个回调绑定到 !toolUseContext.options.tools.some(t =>，负责共享工具在该局部场景下的响应。
    !toolUseContext.options.tools.some(t =>
      toolMatchesName(t, TASK_UPDATE_TOOL_NAME),
    )
  ) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Skip if no messages provided
  // !messages || messages 消息数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!messages || messages.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
  const { turnsSinceLastTaskManagement, turnsSinceLastReminder } =
    getTaskReminderTurnCounts(messages)

  // Check if we should show a reminder
  // 共享工具在这里按实际状态进入对应分支。
  if (
    turnsSinceLastTaskManagement >= TODO_REMINDER_CONFIG.TURNS_SINCE_WRITE &&
    turnsSinceLastReminder >= TODO_REMINDER_CONFIG.TURNS_BETWEEN_REMINDERS
  ) {
    // tasks 集合保存`listTasks`，供共享工具后续处理使用。
    const tasks = await listTasks(getTaskListId())
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [
      {
        type: 'task_reminder',
        content: tasks,
        itemCount: tasks.length,
      },
    ]
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Get attachments for all unified tasks using the Task framework.
 * Replaces the old getBackgroundShellAttachments, getBackgroundRemoteSessionAttachments,
 * and getAsyncAgentAttachments functions.
 */
// getUnifiedTaskAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getUnifiedTaskAttachments(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
  const { attachments, updatedTaskOffsets, evictedTaskIds } =
    await generateTaskAttachments(appState)

  // 调用 applyTaskOffsetsAndEvictions，触发共享工具此处需要的副作用。
  applyTaskOffsetsAndEvictions(
    toolUseContext.setAppState,
    updatedTaskOffsets,
    evictedTaskIds,
  )

  // Convert TaskAttachment to Attachment format
  // 返回 `attachments.map(taskAttachment => ({`，作为共享工具这次计算的结果。
  return attachments.map(taskAttachment => ({
    type: 'task_status' as const,
    taskId: taskAttachment.taskId,
    taskType: taskAttachment.taskType,
    status: taskAttachment.status,
    description: taskAttachment.description,
    deltaSummary: taskAttachment.deltaSummary,
    outputFilePath: getTaskOutputPath(taskAttachment.taskId),
  }))
}

// getAsyncHookResponseAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getAsyncHookResponseAttachments(): Promise<Attachment[]> {
  // responses 响应数据读取`checkForAsyncHookResponses`，供共享工具后续处理使用。
  const responses = await checkForAsyncHookResponses()

  // responses 响应数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (responses.length === 0) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Hooks: getAsyncHookResponseAttachments found ${responses.length} responses`,
  )

  // attachments 集合派生`responses.map`，供共享工具后续处理使用。
  const attachments = responses.map(
    // 重新解构输入对象，把共享工具 attachments需要的字段同步到本地变量。
    ({
      processId,
      response,
      hookName,
      hookEvent,
      toolName,
      pluginId,
      stdout,
      stderr,
      exitCode,
    }) => {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Hooks: Creating attachment for ${processId} (${hookName}): ${jsonStringify(response)}`,
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        type: 'async_hook_response' as const,
        processId,
        hookName,
        hookEvent,
        toolName,
        response,
        stdout,
        stderr,
        exitCode,
      }
    },
  )

  // Remove delivered hooks from registry to prevent re-processing
  // 满足 `responses.length > 0` 时，共享工具执行该分支。
  if (responses.length > 0) {
    // processIds 集合派生`responses.map`，供共享工具后续处理使用。
    const processIds = responses.map(r => r.processId)
    // 调用 removeDeliveredAsyncHooks，触发共享工具此处需要的副作用。
    removeDeliveredAsyncHooks(processIds)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Hooks: Removed ${processIds.length} delivered hooks from registry`,
    )
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Hooks: getAsyncHookResponseAttachments found ${attachments.length} attachments`,
  )

  // 返回 `attachments`，作为共享工具这次计算的结果。
  return attachments
}

/**
 * Get teammate mailbox attachments for agent swarm communication
 * Teammates are independent Claude Code sessions running in parallel (swarms),
 * not parent-child subagent relationships.
 *
 * This function checks two sources for messages:
 * 1. File-based mailbox (for messages that arrived between polls)
 * 2. AppState.inbox (for messages queued mid-turn by useInboxPoller)
 *
 * Messages from AppState.inbox are delivered mid-turn as attachments,
 * allowing teammates to receive messages without waiting for the turn to end.
 */
// getTeammateMailboxAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getTeammateMailboxAttachments(
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // 满足 `!isAgentSwarmsEnabled()` 时，共享工具执行该分支。
  if (!isAgentSwarmsEnabled()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Get AppState early to check for team lead status
  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()

  // Use agent name from helper (checks AsyncLocalStorage, then dynamicTeamContext)
  // envAgentName读取`getAgentName`，供共享工具后续处理使用。
  const envAgentName = getAgentName()

  // Get team name (checks AsyncLocalStorage, dynamicTeamContext, then AppState)
  // teamName读取`getTeamName`，供共享工具后续处理使用。
  const teamName = getTeamName(appState.teamContext)

  // Check if we're the team lead (uses shared logic from swarm utils)
  // teamLeadStatus 集合保存`isTeamLead`，供共享工具后续处理使用。
  const teamLeadStatus = isTeamLead(appState.teamContext)

  // Check if viewing a teammate's transcript (for in-process teammates)
  // viewedTeammate读取`getViewedTeammateTask`，供共享工具后续处理使用。
  const viewedTeammate = getViewedTeammateTask(appState)

  // Resolve agent name based on who we're VIEWING:
  // - If viewing a teammate, use THEIR name (to read from their mailbox)
  // - Otherwise use env var if set, or leader's name if we're the team lead
  // agentName保存`viewedTeammate?.identity.agentName ?? envAgentName`，供后续判断或组装使用。
  let agentName = viewedTeammate?.identity.agentName ?? envAgentName
  // 只有 `!agentName && teamLeadStatus && appState.teamCont` 满足时，共享工具才执行该分支。
  if (!agentName && teamLeadStatus && appState.teamContext) {
    // leadAgentId保存`appState.teamContext.leadAgentId`，供共享工具 attachments后续判断或输出使用。
    const leadAgentId = appState.teamContext.leadAgentId
    // Look up the lead's name from agents map (not the UUID)
    // agentName更新为 `appState.teamContext.teammates[leadAgentId]?.name || 'tea...`，确保共享工具后续读取最新状态。
    agentName = appState.teamContext.teammates[leadAgentId]?.name || 'team-lead'
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmMailbox] getTeammateMailboxAttachments called: envAgentName=${envAgentName}, isTeamLead=${teamLeadStatus}, resolved agentName=${agentName}, teamName=${teamName}`,
  )

  // Only check inbox if running as an agent in a swarm or team lead
  // agentName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!agentName) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[SwarmMailbox] Not checking inbox - not in a swarm or team lead`,
    )
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmMailbox] Checking inbox for agent="${agentName}" team="${teamName || 'default'}"`,
  )

  // Check mailbox for unread messages (routes to in-process or file-based)
  // Filter out structured protocol messages (permission requests/responses, shutdown
  // messages, etc.) — these must be left unread for useInboxPoller to route to their
  // proper handlers (workerPermissions queue, sandbox queue, etc.). Without filtering,
  // attachment generation races with InboxPoller: whichever reads first marks all
  // messages as read, and if attachments wins, protocol messages get bundled as raw
  // LLM context text instead of being routed to their UI handlers.
  // allUnreadMessages 消息数据读取`readUnreadMessages`，供共享工具后续处理使用。
  const allUnreadMessages = await readUnreadMessages(agentName, teamName)
  // unreadMessages 消息数据筛选`allUnreadMessages.filter`，供共享工具后续处理使用。
  const unreadMessages = allUnreadMessages.filter(
    // m更新为 `> !isStructuredProtocolMessage(m.text)`，确保共享工具后续读取最新状态。
    m => !isStructuredProtocolMessage(m.text),
  )
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[MailboxBridge] Found ${allUnreadMessages.length} unread message(s) for "${agentName}" (${allUnreadMessages.length - unreadMessages.length} structured protocol messages filtered out)`,
  )

  // Also check AppState.inbox for pending messages (queued mid-turn by useInboxPoller)
  // IMPORTANT: appState.inbox contains messages FROM teammates TO the leader.
  // Only show these when viewing the leader's transcript (not a teammate's).
  // When viewing a teammate, their messages come from the file-based mailbox above.
  // In-process teammates share AppState with the leader — appState.inbox contains
  // the LEADER's queued messages, not the teammate's. Skip it to prevent leakage
  // (including self-echo from broadcasts). Teammates receive messages exclusively
  // through their file-based mailbox + waitForNextPromptOrShutdown.
  // Note: viewedTeammate was already computed above for agentName resolution
  // pendingInboxMessages 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const pendingInboxMessages =
    viewedTeammate || isInProcessTeammate()
      ? [] // Viewing teammate or running as in-process teammate - don't show leader's inbox
      // 这个回调绑定到 : appState.inbox.messages.filter(m => m.status === 'pending')，负责共享工具在该局部场景下的响应。
      : appState.inbox.messages.filter(m => m.status === 'pending')
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmMailbox] Found ${pendingInboxMessages.length} pending message(s) in AppState.inbox`,
  )

  // Combine both sources of messages WITH DEDUPLICATION
  // The same message could exist in both file mailbox and AppState.inbox due to race conditions:
  // 1. getTeammateMailboxAttachments reads file -> finds message M
  // 2. InboxPoller reads same file -> queues M in AppState.inbox
  // 3. getTeammateMailboxAttachments reads AppState -> finds M again
  // We deduplicate using from+timestamp+text prefix as the key
  // seen构建`new Set<string>()` 整理出中间结果，供共享工具 attachments后续步骤使用。
  const seen = new Set<string>()
  // allMessages 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let allMessages: Array<{
    from: string
    text: string
    timestamp: string
    color?: string
    summary?: string
  }> = []

  // 按顺序遍历 `[...unreadMessages, ...pendingInboxMes` 中的m，逐个交给共享工具处理。
  for (const m of [...unreadMessages, ...pendingInboxMessages]) {
    // 按键格式化`text.slice`，供共享工具后续处理使用。
    const key = `${m.from}|${m.timestamp}|${m.text.slice(0, 100)}`
    // 满足 `!seen.has(key)` 时，共享工具执行该分支。
    if (!seen.has(key)) {
      // 调用 seen.add，触发共享工具此处需要的副作用。
      seen.add(key)
      // allMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      allMessages.push({
        from: m.from,
        text: m.text,
        timestamp: m.timestamp,
        color: m.color,
        summary: m.summary,
      })
    }
  }

  // Collapse multiple idle notifications per agent — keep only the latest.
  // Single pass to parse, then filter without re-parsing.
  // idleAgentByIndex 索引 命名 `new Map<number, string>()`，让后续代码直接表达这个值的用途。
  const idleAgentByIndex = new Map<number, string>()
  // latestIdleByAgent构建`new Map<string, number>()`，供后续判断或组装使用。
  const latestIdleByAgent = new Map<string, number>()
  // 按索引扫描 `allMessages.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < allMessages.length; i++) {
    // idle保存`isIdleNotification`，供共享工具后续处理使用。
    const idle = isIdleNotification(allMessages[i]!.text)
    // 满足 `idle` 时，共享工具执行该分支。
    if (idle) {
      // idleAgentByIndex.set 写入新的状态值，使共享工具后续读取保持一致。
      idleAgentByIndex.set(i, idle.from)
      // latestIdleByAgent.set 写入新的状态值，使共享工具后续读取保持一致。
      latestIdleByAgent.set(idle.from, i)
    }
  }
  // 满足 `idleAgentByIndex.size > latestIdleByAgent.size` 时，共享工具执行该分支。
  if (idleAgentByIndex.size > latestIdleByAgent.size) {
    // beforeCount 数量记录 `allMessages.length` 是否成立，下一步按该结果分支。
    const beforeCount = allMessages.length
    // allMessages 消息数据更新为 `allMessages.filter((_m, i) => {`，确保共享工具后续读取最新状态。
    allMessages = allMessages.filter((_m, i) => {
      // agent读取`idleAgentByIndex.get`，供共享工具后续处理使用。
      const agent = idleAgentByIndex.get(i)
      // 满足 `agent === undefined` 时，共享工具执行该分支。
      if (agent === undefined) return true
      // 返回 `latestIdleByAgent.get(agent) === i`，作为共享工具这次计算的结果。
      return latestIdleByAgent.get(agent) === i
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[SwarmMailbox] Collapsed ${beforeCount - allMessages.length} duplicate idle notification(s)`,
    )
  }

  // allMessages 消息数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (allMessages.length === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[SwarmMailbox] No messages to deliver, returning empty`)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[SwarmMailbox] Returning ${allMessages.length} message(s) as attachment for "${agentName}" (${unreadMessages.length} from file, ${pendingInboxMessages.length} from AppState, after dedup)`,
  )

  // Build the attachment BEFORE marking messages as processed
  // This prevents message loss if any operation below fails
  // attachment 聚合成有序列表，保持后续遍历顺序稳定。
  const attachment: Attachment[] = [
    {
      type: 'teammate_mailbox',
      messages: allMessages,
    },
  ]

  // Mark only non-structured mailbox messages as read after attachment is built.
  // Structured protocol messages stay unread for useInboxPoller to handle.
  // 满足 `unreadMessages.length > 0` 时，共享工具执行该分支。
  if (unreadMessages.length > 0) {
    // 等待 `markMessagesAsReadByPredicate(` 完成，再继续共享工具 attachments的异步流程。
    await markMessagesAsReadByPredicate(
      agentName,
      // m更新为 `> !isStructuredProtocolMessage(m.text)`，确保共享工具后续读取最新状态。
      m => !isStructuredProtocolMessage(m.text),
      teamName,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[MailboxBridge] marked ${unreadMessages.length} non-structured message(s) as read for agent="${agentName}" team="${teamName || 'default'}"`,
    )
  }

  // Process shutdown_approved messages - remove teammates from team file
  // This mirrors what useInboxPoller does in interactive mode (lines 546-606)
  // In -p mode, useInboxPoller doesn't run, so we must handle this here
  // 只有 `teamLeadStatus && teamName` 满足时，共享工具才执行该分支。
  if (teamLeadStatus && teamName) {
    // 按顺序遍历 `allMessages` 中的m，逐个交给共享工具处理。
    for (const m of allMessages) {
      // shutdownApproval保存`isShutdownApproved`，供共享工具后续处理使用。
      const shutdownApproval = isShutdownApproved(m.text)
      // 满足 `shutdownApproval` 时，共享工具执行该分支。
      if (shutdownApproval) {
        // teammateToRemove保存`shutdownApproval.from`，供后续判断或组装使用。
        const teammateToRemove = shutdownApproval.from
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SwarmMailbox] Processing shutdown_approved from ${teammateToRemove}`,
        )

        // Find the teammate ID by name
        // teammateId保存`appState.teamContext?.teammates`，供共享工具 attachments后续判断或输出使用。
        const teammateId = appState.teamContext?.teammates
          ? Object.entries(appState.teamContext.teammates).find(
              // 这个回调绑定到 ([, t]) => t.name === teammateToRemove,，负责共享工具在该局部场景下的响应。
              ([, t]) => t.name === teammateToRemove,
            )?.[0]
          : undefined

        // 满足 `teammateId` 时，共享工具执行该分支。
        if (teammateId) {
          // Remove from team file
          // 调用 removeTeammateFromTeamFile，触发共享工具此处需要的副作用。
          removeTeammateFromTeamFile(teamName, {
            agentId: teammateId,
            name: teammateToRemove,
          })
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[SwarmMailbox] Removed ${teammateToRemove} from team file`,
          )

          // Unassign tasks owned by this teammate
          // 等待 `unassignTeammateTasks(` 完成，再继续共享工具 attachments的异步流程。
          await unassignTeammateTasks(
            teamName,
            teammateId,
            teammateToRemove,
            'shutdown',
          )

          // Remove from teamContext in AppState
          // toolUseContext.setAppState 写入新的状态值，使共享工具后续读取保持一致。
          toolUseContext.setAppState(prev => {
            // 满足 `!prev.teamContext?.teammates` 时，共享工具执行该分支。
            if (!prev.teamContext?.teammates) return prev
            // 满足 `!(teammateId in prev.teamContext.teammates)` 时，共享工具执行该分支。
            if (!(teammateId in prev.teamContext.teammates)) return prev
            // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
            const { [teammateId]: _, ...remainingTeammates } =
              prev.teamContext.teammates
            // 返回结构化结果，集中表达共享工具已经整理出的状态。
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
  }

  // Mark AppState inbox messages as processed LAST, after attachment is built
  // This ensures messages aren't lost if earlier operations fail
  // 满足 `pendingInboxMessages.length > 0` 时，共享工具执行该分支。
  if (pendingInboxMessages.length > 0) {
    // pendingIds 集合保存`Set`，供共享工具后续处理使用。
    const pendingIds = new Set(pendingInboxMessages.map(m => m.id))
    // toolUseContext.setAppState 写入新的状态值，使共享工具后续读取保持一致。
    toolUseContext.setAppState(prev => ({
      ...prev,
      inbox: {
        // 这个回调绑定到 messages: prev.inbox.messages.map(m =>，负责共享工具在该局部场景下的响应。
        messages: prev.inbox.messages.map(m =>
          pendingIds.has(m.id) ? { ...m, status: 'processed' as const } : m,
        ),
      },
    }))
  }

  // 返回 `attachment`，作为共享工具这次计算的结果。
  return attachment
}

/**
 * Get team context attachment for teammates in a swarm.
 * Only injected on the first turn to provide team coordination instructions.
 */
// getTeamContextAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTeamContextAttachment(messages: Message[]): Attachment[] {
  // teamName读取`getTeamName`，供共享工具后续处理使用。
  const teamName = getTeamName()
  // agentId读取`getAgentId`，供共享工具后续处理使用。
  const agentId = getAgentId()
  // agentName读取`getAgentName`，供共享工具后续处理使用。
  const agentName = getAgentName()

  // Only inject for teammates (not team lead or non-team sessions)
  // 只有 `!teamName || !agentId` 满足时，共享工具才执行该分支。
  if (!teamName || !agentId) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Only inject on first turn - check if there are no assistant messages yet
  // hasAssistantMessage 消息数据记录 `messages.some` 是否成立，共享工具随后按该结果分支。
  const hasAssistantMessage = messages.some(m => m.type === 'assistant')
  // 满足 `hasAssistantMessage` 时，共享工具执行该分支。
  if (hasAssistantMessage) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // configDir 配置读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
  const configDir = getClaudeConfigHomeDir()
  // teamConfigPath 路径数据保存``${configDir}/teams/${teamName}/config.json``，作为后续固定文本处理的输入。
  const teamConfigPath = `${configDir}/teams/${teamName}/config.json`
  // taskListPath 路径数据保存``${configDir}/tasks/${teamName}/``，作为后续固定文本处理的输入。
  const taskListPath = `${configDir}/tasks/${teamName}/`

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    {
      type: 'team_context',
      agentId,
      agentName: agentName || agentId,
      teamName,
      teamConfigPath,
      taskListPath,
    },
  ]
}

// getTokenUsageAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTokenUsageAttachment(
  messages: Message[],
  model: string,
): Attachment[] {
  // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT)` 时，共享工具执行该分支。
  if (!isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // contextWindow读取`getEffectiveContextWindowSize`，供共享工具后续处理使用。
  const contextWindow = getEffectiveContextWindowSize(model)
  // usedTokens 集合保存`tokenCountFromLastAPIResponse`，供共享工具后续处理使用。
  const usedTokens = tokenCountFromLastAPIResponse(messages)

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    {
      type: 'token_usage',
      used: usedTokens,
      total: contextWindow,
      remaining: contextWindow - usedTokens,
    },
  ]
}

// getOutputTokenUsageAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOutputTokenUsageAttachment(): Attachment[] {
  // 满足 `feature('TOKEN_BUDGET')` 时，共享工具执行该分支。
  if (feature('TOKEN_BUDGET')) {
    // budget读取`getCurrentTurnTokenBudget`，供共享工具后续处理使用。
    const budget = getCurrentTurnTokenBudget()
    // 只有 `budget === null || budget <= 0` 满足时，共享工具才执行该分支。
    if (budget === null || budget <= 0) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [
      {
        type: 'output_token_usage',
        turn: getTurnOutputTokens(),
        session: getTotalOutputTokens(),
        budget,
      },
    ]
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

// getMaxBudgetUsdAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMaxBudgetUsdAttachment(maxBudgetUsd?: number): Attachment[] {
  // 满足 `maxBudgetUsd === undefined` 时，共享工具执行该分支。
  if (maxBudgetUsd === undefined) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // usedCost读取`getTotalCostUSD`，供共享工具后续处理使用。
  const usedCost = getTotalCostUSD()
  // remainingBudget读取`maxBudgetUsd - usedCost`，供后续判断或组装使用。
  const remainingBudget = maxBudgetUsd - usedCost

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [
    {
      type: 'budget_usd',
      used: usedCost,
      total: maxBudgetUsd,
      remaining: remainingBudget,
    },
  ]
}

/**
 * Count human turns since plan mode exit (plan_mode_exit attachment).
 * Returns 0 if no plan_mode_exit attachment found.
 *
 * tool_result messages are type:'user' without isMeta, so filter by
 * toolUseResult to avoid counting them — otherwise the 10-turn reminder
 * interval fires every ~10 tool calls instead of ~10 human turns.
 */
// getVerifyPlanReminderTurnCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getVerifyPlanReminderTurnCount(messages: Message[]): number {
  // turnCount 数量保存`0`，供共享工具 attachments后续判断或输出使用。
  let turnCount = 0
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]`，让后续代码直接表达这个值的用途。
    const message = messages[i]
    // 只有 `message && isHumanTurn(message)` 满足时，共享工具才执行该分支。
    if (message && isHumanTurn(message)) {
      // 共享工具 attachments在这里处理 `turnCount++`，完成这一小步状态转换。
      turnCount++
    }
    // Stop counting at plan_mode_exit attachment (marks when implementation started)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      message?.type === 'attachment' &&
      message.attachment.type === 'plan_mode_exit'
    ) {
      // 返回 `turnCount`，作为共享工具这次计算的结果。
      return turnCount
    }
  }
  // No plan_mode_exit found
  // 返回 `0`，作为共享工具这次计算的结果。
  return 0
}

/**
 * Get verify plan reminder attachment if the model hasn't called VerifyPlanExecution yet.
 */
// getVerifyPlanReminderAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getVerifyPlanReminderAttachment(
  messages: Message[] | undefined,
  toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.USER_TYPE !== 'ant' ||
    !isEnvTruthy(process.env.CLAUDE_CODE_VERIFY_PLAN)
  ) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // appState 状态读取`toolUseContext.getAppState`，供共享工具后续处理使用。
  const appState = toolUseContext.getAppState()
  // pending 命名 `appState.pendingPlanVerification`，让后续代码直接表达这个值的用途。
  const pending = appState.pendingPlanVerification

  // Only remind if plan exists and verification not started or completed
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !pending ||
    pending.verificationStarted ||
    pending.verificationCompleted
  ) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Only remind every N turns
  // 只有 `messages && messages.length > 0` 满足时，共享工具才执行该分支。
  if (messages && messages.length > 0) {
    // turnCount 数量读取`getVerifyPlanReminderTurnCount`，供共享工具后续处理使用。
    const turnCount = getVerifyPlanReminderTurnCount(messages)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      turnCount === 0 ||
      turnCount % VERIFY_PLAN_REMINDER_CONFIG.TURNS_BETWEEN_REMINDERS !== 0
    ) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'verify_plan_reminder' }]
}

// getCompactionReminderAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCompactionReminderAttachment(
  messages: Message[],
  model: string,
): Attachment[] {
  // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE('tengu_marble_fox', false)` 时，共享工具执行该分支。
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_marble_fox', false)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 满足 `!isAutoCompactEnabled()` 时，共享工具执行该分支。
  if (!isAutoCompactEnabled()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // contextWindow读取`getContextWindowForModel`，供共享工具后续处理使用。
  const contextWindow = getContextWindowForModel(model, getSdkBetas())
  // 满足 `contextWindow < 1_000_000` 时，共享工具执行该分支。
  if (contextWindow < 1_000_000) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // effectiveWindow读取`getEffectiveContextWindowSize`，供共享工具后续处理使用。
  const effectiveWindow = getEffectiveContextWindowSize(model)
  // usedTokens 集合保存`tokenCountWithEstimation`，供共享工具后续处理使用。
  const usedTokens = tokenCountWithEstimation(messages)
  // 满足 `usedTokens < effectiveWindow * 0.25` 时，共享工具执行该分支。
  if (usedTokens < effectiveWindow * 0.25) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'compaction_reminder' }]
}

/**
 * Context-efficiency nudge. Injected after every N tokens of growth without
 * a snip. Pacing is handled entirely by shouldNudgeForSnips — the 10k
 * interval resets on prior nudges, snip markers, snip boundaries, and
 * compact boundaries.
 */
// getContextEfficiencyAttachment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getContextEfficiencyAttachment(
  messages: Message[],
): Attachment[] {
  // 满足 `!feature('HISTORY_SNIP')` 时，共享工具执行该分支。
  if (!feature('HISTORY_SNIP')) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // Gate must match SnipTool.isEnabled() — don't nudge toward a tool that
  // isn't in the tool list. Lazy require keeps this file snip-string-free.
  // 共享工具 attachments先整理这一处局部数据，后续分支可以直接读取。
  const { isSnipRuntimeEnabled, shouldNudgeForSnips } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../services/compact/snipCompact.js') as typeof import('../services/compact/snipCompact.js')
  // 满足 `!isSnipRuntimeEnabled()` 时，共享工具执行该分支。
  if (!isSnipRuntimeEnabled()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 满足 `!shouldNudgeForSnips(messages)` 时，共享工具执行该分支。
  if (!shouldNudgeForSnips(messages)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [{ type: 'context_efficiency' }]
}


// isFileReadDenied 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isFileReadDenied(
  filePath: string,
  toolPermissionContext: ToolPermissionContext,
): boolean {
  // denyRule保存`matchingRuleForInput`，供共享工具后续处理使用。
  const denyRule = matchingRuleForInput(
    filePath,
    toolPermissionContext,
    'read',
    'deny',
  )
  // 返回 `denyRule !== null`，作为共享工具这次计算的结果。
  return denyRule !== null
}

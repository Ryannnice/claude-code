// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { copyFile, stat as fsStat, truncate as fsTruncate, link } from 'fs/promises';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { CanUseToolFn } 来自 src/hooks/useCanUseTool.js，用于校准工具调用的数据契约。
import type { CanUseToolFn } from 'src/hooks/useCanUseTool.js';
// 类型依赖 { AppState } 来自 src/state/AppState.js，用于校准工具调用的数据契约。
import type { AppState } from 'src/state/AppState.js';
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4';
// 引入 getKairosActive，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getKairosActive } from '../../bootstrap/state.js';
// 引入 TOOL_SUMMARY_MAX_LENGTH，将 ../../constants/toolLimits.js 中已经封装好的能力接到本文件流程里。
import { TOOL_SUMMARY_MAX_LENGTH } from '../../constants/toolLimits.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../services/analytics/index.js';
// 类型依赖 { SetToolJSXFn, Tool, ToolCallProgress, ValidationResult } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { SetToolJSXFn, Tool, ToolCallProgress, ValidationResult } from '../../Tool.js';
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js';
// 引入 backgroundExistingForegroundTask、markTaskNotified、registerForeground、spawnShellTask、unregisterForeground，将 ../../tasks/LocalShellTask/LocalShellTask.js 中已经封装好的能力接到本文件流程里。
import { backgroundExistingForegroundTask, markTaskNotified, registerForeground, spawnShellTask, unregisterForeground } from '../../tasks/LocalShellTask/LocalShellTask.js';
// 类型依赖 { AgentId } 来自 ../../types/ids.js，用于校准工具调用的数据契约。
import type { AgentId } from '../../types/ids.js';
// 类型依赖 { AssistantMessage } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { AssistantMessage } from '../../types/message.js';
// 复用 extractClaudeCodeHints 工具函数，把通用处理留在 ../../utils/claudeCodeHints.js 中维护。
import { extractClaudeCodeHints } from '../../utils/claudeCodeHints.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js';
// 复用 errorMessage as getErrorMessage、ShellError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage as getErrorMessage, ShellError } from '../../utils/errors.js';
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js';
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js';
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js';
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js';
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js';
// 复用 maybeRecordPluginHint 工具函数，把通用处理留在 ../../utils/plugins/hintRecommendation.js 中维护。
import { maybeRecordPluginHint } from '../../utils/plugins/hintRecommendation.js';
// 复用 exec 工具函数，把通用处理留在 ../../utils/Shell.js 中维护。
import { exec } from '../../utils/Shell.js';
// 类型依赖 { ExecResult } 来自 ../../utils/ShellCommand.js，用于校准工具调用的数据契约。
import type { ExecResult } from '../../utils/ShellCommand.js';
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js';
// 复用 semanticBoolean 工具函数，把通用处理留在 ../../utils/semanticBoolean.js 中维护。
import { semanticBoolean } from '../../utils/semanticBoolean.js';
// 复用 semanticNumber 工具函数，把通用处理留在 ../../utils/semanticNumber.js 中维护。
import { semanticNumber } from '../../utils/semanticNumber.js';
// 复用 getCachedPowerShellPath 工具函数，把通用处理留在 ../../utils/shell/powershellDetection.js 中维护。
import { getCachedPowerShellPath } from '../../utils/shell/powershellDetection.js';
// 复用 EndTruncatingAccumulator 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { EndTruncatingAccumulator } from '../../utils/stringUtils.js';
// 复用 getTaskOutputPath 工具函数，把通用处理留在 ../../utils/task/diskOutput.js 中维护。
import { getTaskOutputPath } from '../../utils/task/diskOutput.js';
// 复用 TaskOutput 工具函数，把通用处理留在 ../../utils/task/TaskOutput.js 中维护。
import { TaskOutput } from '../../utils/task/TaskOutput.js';
// 复用 isOutputLineTruncated 工具函数，把通用处理留在 ../../utils/terminal.js 中维护。
import { isOutputLineTruncated } from '../../utils/terminal.js';
// 复用 buildLargeToolResultMessage、ensureToolResultsDir、generatePreview、getToolResultPath、PREVIEW_SIZE_BYTES 工具函数，把通用处理留在 ../../utils/toolResultStorage.js 中维护。
import { buildLargeToolResultMessage, ensureToolResultsDir, generatePreview, getToolResultPath, PREVIEW_SIZE_BYTES } from '../../utils/toolResultStorage.js';
// 引入 shouldUseSandbox，将 ../BashTool/shouldUseSandbox.js 中已经封装好的能力接到本文件流程里。
import { shouldUseSandbox } from '../BashTool/shouldUseSandbox.js';
// 引入 BackgroundHint，将 ../BashTool/UI.js 中已经封装好的能力接到本文件流程里。
import { BackgroundHint } from '../BashTool/UI.js';
// 引入 buildImageToolResult、isImageOutput、resetCwdIfOutsideProject、resizeShellImageOutput、stdErrAppendShellResetMessage、stripEmptyLines，将 ../BashTool/utils.js 中已经封装好的能力接到本文件流程里。
import { buildImageToolResult, isImageOutput, resetCwdIfOutsideProject, resizeShellImageOutput, stdErrAppendShellResetMessage, stripEmptyLines } from '../BashTool/utils.js';
// 引入 trackGitOperations，将 ../shared/gitOperationTracking.js 中已经封装好的能力接到本文件流程里。
import { trackGitOperations } from '../shared/gitOperationTracking.js';
// 引入 interpretCommandResult，将 ./commandSemantics.js 中已经封装好的能力接到本文件流程里。
import { interpretCommandResult } from './commandSemantics.js';
// 引入 powershellToolHasPermission，将 ./powershellPermissions.js 中已经封装好的能力接到本文件流程里。
import { powershellToolHasPermission } from './powershellPermissions.js';
// 引入 getDefaultTimeoutMs、getMaxTimeoutMs、getPrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { getDefaultTimeoutMs, getMaxTimeoutMs, getPrompt } from './prompt.js';
// 引入 hasSyncSecurityConcerns、isReadOnlyCommand、resolveToCanonical，将 ./readOnlyValidation.js 中已经封装好的能力接到本文件流程里。
import { hasSyncSecurityConcerns, isReadOnlyCommand, resolveToCanonical } from './readOnlyValidation.js';
// 引入 POWERSHELL_TOOL_NAME，将 ./toolName.js 中已经封装好的能力接到本文件流程里。
import { POWERSHELL_TOOL_NAME } from './toolName.js';
// 引入 renderToolResultMessage、renderToolUseErrorMessage、renderToolUseMessage、renderToolUseProgressMessage、renderToolUseQueuedMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseErrorMessage, renderToolUseMessage, renderToolUseProgressMessage, renderToolUseQueuedMessage } from './UI.js';

// Never use os.EOL for terminal output — \r\n on Windows breaks Ink rendering
// EOL保存`'\n'`，作为后续固定文本处理的输入。
const EOL = '\n';

/**
 * PowerShell search commands (grep equivalents) for collapsible display.
 * Stored as canonical (lowercase) cmdlet names.
 */
// PS_SEARCH_COMMANDS 命令数据保存`Set`，供工具调用后续处理使用。
const PS_SEARCH_COMMANDS = new Set(['select-string',
// grep equivalent
'get-childitem',
// find equivalent (with -Recurse)
'findstr',
// native Windows search
'where.exe' // native Windows which
]);

/**
 * PowerShell read/view commands for collapsible display.
 * Stored as canonical (lowercase) cmdlet names.
 */
// PS_READ_COMMANDS 命令数据保存`Set`，供工具调用后续处理使用。
const PS_READ_COMMANDS = new Set(['get-content',
// cat equivalent
'get-item',
// file info
'test-path',
// test -e equivalent
'resolve-path',
// realpath equivalent
'get-process',
// ps equivalent
'get-service',
// system info
'get-childitem',
// ls/dir equivalent (also search when recursive)
'get-location',
// pwd equivalent
'get-filehash',
// checksum
'get-acl',
// permissions info
'format-hex' // hexdump equivalent
]);

/**
 * PowerShell semantic-neutral commands that don't change the search/read nature.
 */
// PS_SEMANTIC_NEUTRAL_COMMANDS 命令数据保存`Set`，供工具调用后续处理使用。
const PS_SEMANTIC_NEUTRAL_COMMANDS = new Set(['write-output',
// echo equivalent
'write-host']);

/**
 * Checks if a PowerShell command is a search or read operation.
 * Used to determine if the command should be collapsed in the UI.
 */
// isSearchOrReadPowerShellCommand 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSearchOrReadPowerShellCommand(command: string): {
  isSearch: boolean;
  isRead: boolean;
} {
  // trimmed格式化`command.trim`，供工具调用后续处理使用。
  const trimmed = command.trim();
  // trimmed缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!trimmed) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      isSearch: false,
      isRead: false
    };
  }

  // Simple split on statement separators and pipe operators
  // This is a sync function so we use a lightweight approach
  // 片段列表格式化`trimmed.split`，供工具调用后续处理使用。
  const parts = trimmed.split(/\s*[;|]\s*/).filter(Boolean);
  // 片段列表为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (parts.length === 0) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      isSearch: false,
      isRead: false
    };
  }
  // hasSearch标记工具实现 Power Shell Tool是否启用对应路径。
  let hasSearch = false;
  // hasRead标记工具实现 Power Shell Tool是否启用对应路径。
  let hasRead = false;
  // hasNonNeutralCommand 命令数据标记工具实现 Power Shell Tool是否启用对应路径。
  let hasNonNeutralCommand = false;
  // 按顺序遍历 `parts` 中的part，逐个交给工具调用处理。
  for (const part of parts) {
    // baseCommand 命令数据格式化`part.trim`，供工具调用后续处理使用。
    const baseCommand = part.trim().split(/\s+/)[0];
    // baseCommand 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!baseCommand) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue;
    }
    // canonical读取`resolveToCanonical`，供工具调用后续处理使用。
    const canonical = resolveToCanonical(baseCommand);
    // 满足 `PS_SEMANTIC_NEUTRAL_COMMANDS.has(canonical)` 时，工具调用执行该分支。
    if (PS_SEMANTIC_NEUTRAL_COMMANDS.has(canonical)) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue;
    }
    // hasNonNeutralCommand 命令数据更新为 `true`，确保工具调用后续读取最新状态。
    hasNonNeutralCommand = true;
    // isPartSearch记录 `PS_SEARCH_COMMANDS.has` 是否成立，工具调用随后按该结果分支。
    const isPartSearch = PS_SEARCH_COMMANDS.has(canonical);
    // isPartRead记录 `PS_READ_COMMANDS.has` 是否成立，工具调用随后按该结果分支。
    const isPartRead = PS_READ_COMMANDS.has(canonical);
    // 只有 `!isPartSearch && !isPartRead` 满足时，工具调用才执行该分支。
    if (!isPartSearch && !isPartRead) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        isSearch: false,
        isRead: false
      };
    }
    // 满足 `isPartSearch` 时，工具调用执行该分支。
    if (isPartSearch) hasSearch = true;
    // 满足 `isPartRead` 时，工具调用执行该分支。
    if (isPartRead) hasRead = true;
  }
  // hasNonNeutralCommand 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!hasNonNeutralCommand) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      isSearch: false,
      isRead: false
    };
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    isSearch: hasSearch,
    isRead: hasRead
  };
}

// Progress display constants
// PROGRESS_THRESHOLD_MS 集合保存`2000`，供工具实现 Power Shell Tool后续判断或输出使用。
const PROGRESS_THRESHOLD_MS = 2000;
// PROGRESS_INTERVAL_MS 集合保存`1000`，供工具实现 Power Shell Tool后续判断或输出使用。
const PROGRESS_INTERVAL_MS = 1000;
// In assistant mode, blocking commands auto-background after this many ms in the main agent
// ASSISTANT_BLOCKING_BUDGET_MS 集合保存`15_000`，供后续判断或组装使用。
const ASSISTANT_BLOCKING_BUDGET_MS = 15_000;

// Commands that should not be auto-backgrounded (canonical lowercase).
// 'sleep' is a PS built-in alias for Start-Sleep but not in COMMON_ALIASES,
// so list both forms.
// DISALLOWED_AUTO_BACKGROUND_COMMANDS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
const DISALLOWED_AUTO_BACKGROUND_COMMANDS = ['start-sleep',
// Start-Sleep should run in foreground unless explicitly backgrounded
'sleep'];

/**
 * Checks if a command is allowed to be automatically backgrounded
 * @param command The command to check
 * @returns false for commands that should not be auto-backgrounded (like Start-Sleep)
 */
// isAutobackgroundingAllowed 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAutobackgroundingAllowed(command: string): boolean {
  // firstWord格式化`command.trim`，供工具调用后续处理使用。
  const firstWord = command.trim().split(/\s+/)[0];
  // firstWord缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!firstWord) return true;
  // canonical读取`resolveToCanonical`，供工具调用后续处理使用。
  const canonical = resolveToCanonical(firstWord);
  // 返回 `!DISALLOWED_AUTO_BACKGROUND_COMMANDS.includes(canonical)`，作为工具调用这次计算的结果。
  return !DISALLOWED_AUTO_BACKGROUND_COMMANDS.includes(canonical);
}

/**
 * PS-flavored port of BashTool's detectBlockedSleepPattern.
 * Catches `Start-Sleep N`, `Start-Sleep -Seconds N`, `sleep N` (built-in alias)
 * as the first statement. Does NOT block `Start-Sleep -Milliseconds` (sub-second
 * pacing is fine) or float seconds (legit rate limiting).
 */
// detectBlockedSleepPattern 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectBlockedSleepPattern(command: string): string | null {
  // First statement only — split on PS statement separators: `;`, `|`,
  // `&`/`&&`/`||` (pwsh 7+), and newline (PS's primary separator). This is
  // intentionally shallow — sleep inside script blocks, subshells, or later
  // pipeline stages is fine. Matches BashTool's splitCommandWithOperators
  // intent (src/utils/bash/commands.ts) without a full PS parser.
  // first格式化`command.trim`，供工具调用后续处理使用。
  const first = command.trim().split(/[;|&\r\n]/)[0]?.trim() ?? '';
  // Match: Start-Sleep N, Start-Sleep -Seconds N, Start-Sleep -s N, sleep N
  // (case-insensitive; -Seconds can be abbreviated to -s per PS convention)
  // m保存`s`，供工具调用后续处理使用。
  const m = /^(?:start-sleep|sleep)(?:\s+-s(?:econds)?)?\s+(\d+)\s*$/i.exec(first);
  // m缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!m) return null;
  // secs 集合解析`parseInt`，供工具调用后续处理使用。
  const secs = parseInt(m[1]!, 10);
  // 满足 `secs < 2) return null; // sub-2s sleeps are fine (rate limiting, pacing` 时，工具调用执行该分支。
  if (secs < 2) return null; // sub-2s sleeps are fine (rate limiting, pacing)

  // rest格式化`command.trim`，供工具调用后续处理使用。
  const rest = command.trim().slice(first.length).replace(/^[\s;|&]+/, '');
  // 返回 `rest ? `Start-Sleep ${secs} followed by: ${rest}` : `standalone Start-S...`，作为工具调用这次计算的结果。
  return rest ? `Start-Sleep ${secs} followed by: ${rest}` : `standalone Start-Sleep ${secs}`;
}

/**
 * On Windows native, sandbox is unavailable (bwrap/sandbox-exec are
 * POSIX-only). If enterprise policy has sandbox.enabled AND forbids
 * unsandboxed commands, PowerShell cannot comply — refuse execution
 * rather than silently bypass the policy. On Linux/macOS/WSL2, pwsh
 * runs as a native binary under the sandbox same as bash, so this
 * gate does not apply.
 *
 * Checked in BOTH validateInput (clean tool-runner error) and call()
 * (covers direct callers like promptShellExecution.ts that skip
 * validateInput). The call() guard is the load-bearing one.
 */
// WINDOWS_SANDBOX_POLICY_REFUSAL 命名 `'Enterprise policy requires sandboxing, but sandboxing is...`，让后续代码直接表达这个值的用途。
const WINDOWS_SANDBOX_POLICY_REFUSAL = 'Enterprise policy requires sandboxing, but sandboxing is not available on native Windows. Shell command execution is blocked on this platform by policy.';
// isWindowsSandboxPolicyViolation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isWindowsSandboxPolicyViolation(): boolean {
  // 返回 `getPlatform() === 'windows' && SandboxManager.isSandboxEnabledInSetting...`，作为工具调用这次计算的结果。
  return getPlatform() === 'windows' && SandboxManager.isSandboxEnabledInSettings() && !SandboxManager.areUnsandboxedCommandsAllowed();
}

// Check if background tasks are disabled at module load time
// isBackgroundTasksDisabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const isBackgroundTasksDisabled =
// eslint-disable-next-line custom-rules/no-process-env-top-level -- Intentional: schema must be defined at module load
isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS);
// fullInputSchema保存`lazySchema`，供工具调用后续处理使用。
const fullInputSchema = lazySchema(() => z.strictObject({
  command: z.string().describe('The PowerShell command to execute'),
  timeout: semanticNumber(z.number().optional()).describe(`Optional timeout in milliseconds (max ${getMaxTimeoutMs()})`),
  description: z.string().optional().describe('Clear, concise description of what this command does in active voice.'),
  run_in_background: semanticBoolean(z.boolean().optional()).describe(`Set to true to run this command in the background. Use Read to read the output later.`),
  dangerouslyDisableSandbox: semanticBoolean(z.boolean().optional()).describe('Set this to true to dangerously override sandbox mode and run commands without sandboxing.')
}));

// Conditionally remove run_in_background from schema when background tasks are disabled
// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => isBackgroundTasksDisabled ? fullInputSchema().omit({
  run_in_background: true
}) : fullInputSchema());
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>;

// Use fullInputSchema for the type to always include run_in_background
// (even when it's omitted from the schema, the code needs to handle it)
// PowerShellToolInput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type PowerShellToolInput = z.infer<ReturnType<typeof fullInputSchema>>;
// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() => z.object({
  stdout: z.string().describe('The standard output of the command'),
  stderr: z.string().describe('The standard error output of the command'),
  interrupted: z.boolean().describe('Whether the command was interrupted'),
  returnCodeInterpretation: z.string().optional().describe('Semantic interpretation for non-error exit codes with special meaning'),
  isImage: z.boolean().optional().describe('Flag to indicate if stdout contains image data'),
  persistedOutputPath: z.string().optional().describe('Path to persisted full output when too large for inline'),
  persistedOutputSize: z.number().optional().describe('Total output size in bytes when persisted'),
  backgroundTaskId: z.string().optional().describe('ID of the background task if command is running in background'),
  backgroundedByUser: z.boolean().optional().describe('True if the user manually backgrounded the command with Ctrl+B'),
  assistantAutoBackgrounded: z.boolean().optional().describe('True if the command was auto-backgrounded by the assistant-mode blocking budget')
}));
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>;
// Out 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Out = z.infer<OutputSchema>;
// 类型依赖 { PowerShellProgress } 来自 ../../types/tools.js，用于校准工具调用的数据契约。
import type { PowerShellProgress } from '../../types/tools.js';
// 导出类型定义，让其他模块沿用工具实现 Power Shell Tool的数据契约。
export type { PowerShellProgress } from '../../types/tools.js';
// COMMON_BACKGROUND_COMMANDS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
const COMMON_BACKGROUND_COMMANDS = ['npm', 'yarn', 'pnpm', 'node', 'python', 'python3', 'go', 'cargo', 'make', 'docker', 'terraform', 'webpack', 'vite', 'jest', 'pytest', 'curl', 'Invoke-WebRequest', 'build', 'test', 'serve', 'watch', 'dev'] as const;
// getCommandTypeForLogging 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCommandTypeForLogging(command: string): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  // trimmed格式化`command.trim`，供工具调用后续处理使用。
  const trimmed = command.trim();
  // firstWord格式化`trimmed.split`，供工具调用后续处理使用。
  const firstWord = trimmed.split(/\s+/)[0] || '';
  // 按顺序遍历 `COMMON_BACKGROUND_COMMANDS` 中的cmd 命令数据，逐个交给工具调用处理。
  for (const cmd of COMMON_BACKGROUND_COMMANDS) {
    // 满足 `firstWord.toLowerCase() === cmd.toLowerCase()` 时，工具调用执行该分支。
    if (firstWord.toLowerCase() === cmd.toLowerCase()) {
      // 返回 `cmd as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`，作为工具调用这次计算的结果。
      return cmd as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS;
    }
  }
  // 返回 `'other' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS`，作为工具调用这次计算的结果。
  return 'other' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS;
}
// PowerShellTool构建`buildTool`，供工具调用后续处理使用。
export const PowerShellTool = buildTool({
  name: POWERSHELL_TOOL_NAME,
  searchHint: 'execute Windows PowerShell commands',
  maxResultSizeChars: 30_000,
  strict: true,
  // 工具实现 Power Shell Tool在这里处理 `async description({`，完成这一小步状态转换。
  async description({
    description
  }: Partial<PowerShellToolInput>): Promise<string> {
    // 返回 `description || 'Run PowerShell command'`，作为工具调用这次计算的结果。
    return description || 'Run PowerShell command';
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt(): Promise<string> {
    // 返回 `getPrompt()`，作为工具调用这次计算的结果。
    return getPrompt();
  },
  // isConcurrencySafe 用 input: PowerShellToolInput 判断工具调用是否满足条件。
  isConcurrencySafe(input: PowerShellToolInput): boolean {
    // 返回 `this.isReadOnly?.(input) ?? false`，作为工具调用这次计算的结果。
    return this.isReadOnly?.(input) ?? false;
  },
  // isSearchOrReadCommand 用 input: Partial<PowerShellToolInput> 判断工具调用是否满足条件。
  isSearchOrReadCommand(input: Partial<PowerShellToolInput>): {
    isSearch: boolean;
    isRead: boolean;
  } {
    // input.command 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!input.command) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        isSearch: false,
        isRead: false
      };
    }
    // 返回 `isSearchOrReadPowerShellCommand(input.command)`，作为工具调用这次计算的结果。
    return isSearchOrReadPowerShellCommand(input.command);
  },
  // isReadOnly 用 input: PowerShellToolInput 判断工具调用是否满足条件。
  isReadOnly(input: PowerShellToolInput): boolean {
    // Check sync security heuristics before declaring read-only.
    // The full AST parse is async and unavailable here, so we use
    // regex-based detection of subexpressions, splatting, member
    // invocations, and assignments — matching BashTool's pattern of
    // checking security concerns before cmdlet allowlist evaluation.
    // 满足 `hasSyncSecurityConcerns(input.command)` 时，工具调用执行该分支。
    if (hasSyncSecurityConcerns(input.command)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // NOTE: This calls isReadOnlyCommand without the parsed AST. Without the
    // AST, isReadOnlyCommand cannot split pipelines/statements and will return
    // false for anything but the simplest single-token commands. This is a
    // known limitation of the sync Tool.isReadOnly() interface — the real
    // read-only auto-allow happens async in powershellToolHasPermission (step
    // 4.5) where the parsed AST is available.
    // 返回 `isReadOnlyCommand(input.command)`，作为工具调用这次计算的结果。
    return isReadOnlyCommand(input.command);
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.command`，作为工具调用这次计算的结果。
    return input.command;
  },
  // 工具实现 Power Shell Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema();
  },
  // 工具实现 Power Shell Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema();
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName(): string {
    // 返回 `'PowerShell'`，作为工具调用这次计算的结果。
    return 'PowerShell';
  },
  // getToolUseSummary 根据 input: Partial<PowerShellToolInput> | undefined 读取或计算工具调用需要的结果。
  getToolUseSummary(input: Partial<PowerShellToolInput> | undefined): string | null {
    // 满足 `!input?.command` 时，工具调用执行该分支。
    if (!input?.command) {
      // 返回 `null`，作为工具调用这次计算的结果。
      return null;
    }
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      command,
      description
    } = input;
    // 满足 `description` 时，工具调用执行该分支。
    if (description) {
      // 返回 `description`，作为工具调用这次计算的结果。
      return description;
    }
    // 返回 `truncate(command, TOOL_SUMMARY_MAX_LENGTH)`，作为工具调用这次计算的结果。
    return truncate(command, TOOL_SUMMARY_MAX_LENGTH);
  },
  // getActivityDescription 根据 input: Partial<PowerShellToolInput> | undefined 读取或计算工具调用需要的结果。
  getActivityDescription(input: Partial<PowerShellToolInput> | undefined): string {
    // 满足 `!input?.command` 时，工具调用执行该分支。
    if (!input?.command) {
      // 返回 `'Running command'`，作为工具调用这次计算的结果。
      return 'Running command';
    }
    // desc保存`truncate`，供工具调用后续处理使用。
    const desc = input.description ?? truncate(input.command, TOOL_SUMMARY_MAX_LENGTH);
    // 返回 ``Running ${desc}``，作为工具调用这次计算的结果。
    return `Running ${desc}`;
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled(): boolean {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  },
  // validateInput 使用 input: PowerShellToolInput 完成工具调用里的对应操作。
  async validateInput(input: PowerShellToolInput): Promise<ValidationResult> {
    // Defense-in-depth: also guarded in call() for direct callers.
    // 满足 `isWindowsSandboxPolicyViolation()` 时，工具调用执行该分支。
    if (isWindowsSandboxPolicyViolation()) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: WINDOWS_SANDBOX_POLICY_REFUSAL,
        errorCode: 11
      };
    }
    // 只有 `feature('MONITOR_TOOL') && !isBackgroundTasksDisabled && !input.run_in_back...` 满足时，工具调用才执行该分支。
    if (feature('MONITOR_TOOL') && !isBackgroundTasksDisabled && !input.run_in_background) {
      // sleepPattern读取`detectBlockedSleepPattern`，供工具调用后续处理使用。
      const sleepPattern = detectBlockedSleepPattern(input.command);
      // `sleepPattern` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (sleepPattern !== null) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Blocked: ${sleepPattern}. Run blocking commands in the background with run_in_background: true — you'll get a completion notification when done. For streaming events (watching logs, polling APIs), use the Monitor tool. If you genuinely need a delay (rate limiting, deliberate pacing), keep it under 2 seconds.`,
          errorCode: 10
        };
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      result: true
    };
  },
  // checkPermissions 使用 input: PowerShellToolInput, context: Parameters<T… 完成工具调用里的对应操作。
  async checkPermissions(input: PowerShellToolInput, context: Parameters<Tool['checkPermissions']>[1]): Promise<PermissionResult> {
    // 等待并返回 `powershellToolHasPermission(input, context)`，调用方直接接收异步结果。
    return await powershellToolHasPermission(input, context);
  },
  renderToolUseMessage,
  renderToolUseProgressMessage,
  renderToolUseQueuedMessage,
  renderToolResultMessage,
  renderToolUseErrorMessage,
  // 调用 mapToolResultToToolResultBlockParam，触发工具调用此处需要的副作用。
  mapToolResultToToolResultBlockParam({
    interrupted,
    stdout,
    stderr,
    isImage,
    persistedOutputPath,
    persistedOutputSize,
    backgroundTaskId,
    backgroundedByUser,
    assistantAutoBackgrounded
  }: Out, toolUseID: string): ToolResultBlockParam {
    // For image data, format as image content block for Claude
    // 满足 `isImage` 时，工具调用执行该分支。
    if (isImage) {
      // block构建`buildImageToolResult`，供工具调用后续处理使用。
      const block = buildImageToolResult(stdout, toolUseID);
      // 满足 `block` 时，工具调用执行该分支。
      if (block) return block;
    }
    // processedStdout保存`stdout`，供后续判断或组装使用。
    let processedStdout = stdout;
    // 满足 `persistedOutputPath` 时，工具调用执行该分支。
    if (persistedOutputPath) {
      // trimmed格式化`stdout.replace`，供工具调用后续处理使用。
      const trimmed = stdout ? stdout.replace(/^(\s*\n)+/, '').trimEnd() : '';
      // preview保存`generatePreview`，供工具调用后续处理使用。
      const preview = generatePreview(trimmed, PREVIEW_SIZE_BYTES);
      // processedStdout更新为 `buildLargeToolResultMessage({`，确保工具调用后续读取最新状态。
      processedStdout = buildLargeToolResultMessage({
        filepath: persistedOutputPath,
        originalSize: persistedOutputSize ?? 0,
        isJson: false,
        preview: preview.preview,
        hasMore: preview.hasMore
      });
    // 工具实现 Power Shell Tool在这里处理 `} else if (stdout) {`，完成这一小步状态转换。
    } else if (stdout) {
      // processedStdout更新为 `stdout.replace(/^(\s*\n)+/, '')`，确保工具调用后续读取最新状态。
      processedStdout = stdout.replace(/^(\s*\n)+/, '');
      // processedStdout更新为 `processedStdout.trimEnd()`，确保工具调用后续读取最新状态。
      processedStdout = processedStdout.trimEnd();
    }
    // errorMessage 消息数据格式化`stderr.trim`，供工具调用后续处理使用。
    let errorMessage = stderr.trim();
    // 满足 `interrupted` 时，工具调用执行该分支。
    if (interrupted) {
      // 满足 `stderr` 时，工具调用执行该分支。
      if (stderr) errorMessage += EOL;
      // 工具实现 Power Shell Tool在这里处理 `errorMessage += '<error>Command was aborted before completion</error>'`，完成这一小步状态转换。
      errorMessage += '<error>Command was aborted before completion</error>';
    }
    // backgroundInfo固定为 `''`，作为工具实现 Power Shell Tool后续展示或比较的基准。
    let backgroundInfo = '';
    // 满足 `backgroundTaskId` 时，工具调用执行该分支。
    if (backgroundTaskId) {
      // outputPath 路径数据读取`getTaskOutputPath`，供工具调用后续处理使用。
      const outputPath = getTaskOutputPath(backgroundTaskId);
      // 满足 `assistantAutoBackgrounded` 时，工具调用执行该分支。
      if (assistantAutoBackgrounded) {
        // backgroundInfo更新为 ``Command exceeded the assistant-mode blocking budget (${A...`，确保工具调用后续读取最新状态。
        backgroundInfo = `Command exceeded the assistant-mode blocking budget (${ASSISTANT_BLOCKING_BUDGET_MS / 1000}s) and was moved to the background with ID: ${backgroundTaskId}. It is still running — you will be notified when it completes. Output is being written to: ${outputPath}. In assistant mode, delegate long-running work to a subagent or use run_in_background to keep this conversation responsive.`;
      // 工具实现 Power Shell Tool在这里处理 `} else if (backgroundedByUser) {`，完成这一小步状态转换。
      } else if (backgroundedByUser) {
        // backgroundInfo更新为 ``Command was manually backgrounded by user with ID: ${bac...`，确保工具调用后续读取最新状态。
        backgroundInfo = `Command was manually backgrounded by user with ID: ${backgroundTaskId}. Output is being written to: ${outputPath}`;
      } else {
        // backgroundInfo更新为 ``Command running in background with ID: ${backgroundTaskI...`，确保工具调用后续读取最新状态。
        backgroundInfo = `Command running in background with ID: ${backgroundTaskId}. Output is being written to: ${outputPath}`;
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: [processedStdout, errorMessage, backgroundInfo].filter(Boolean).join('\n'),
      is_error: interrupted
    };
  },
  // call 使用 input: PowerShellToolInput, toolUseContext: Param… 完成工具调用里的对应操作。
  async call(input: PowerShellToolInput, toolUseContext: Parameters<Tool['call']>[1], _canUseTool?: CanUseToolFn, _parentMessage?: AssistantMessage, onProgress?: ToolCallProgress<PowerShellProgress>): Promise<{
    data: Out;
  }> {
    // Load-bearing guard: promptShellExecution.ts and processBashCommand.tsx
    // call PowerShellTool.call() directly, bypassing validateInput. This is
    // the check that covers ALL callers. See isWindowsSandboxPolicyViolation
    // comment for the policy rationale.
    // 满足 `isWindowsSandboxPolicyViolation()` 时，工具调用执行该分支。
    if (isWindowsSandboxPolicyViolation()) {
      // 抛出 new Error(WINDOWS_SANDBOX_POLICY_REFUSAL);，阻止工具调用在无效状态下继续运行。
      throw new Error(WINDOWS_SANDBOX_POLICY_REFUSAL);
    }
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      abortController,
      setAppState,
      setToolJSX
    } = toolUseContext;
    // isMainThread标记工具实现 Power Shell Tool是否启用对应路径。
    const isMainThread = !toolUseContext.agentId;
    // progressCounter 数量保存`0`，供工具实现 Power Shell Tool后续判断或输出使用。
    let progressCounter = 0;
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // commandGenerator 命令数据保存`runPowerShellCommand`，供工具调用后续处理使用。
      const commandGenerator = runPowerShellCommand({
        input,
        abortController,
        // Use the always-shared task channel so async agents' background
        // shell tasks are actually registered (and killable on agent exit).
        setAppState: toolUseContext.setAppStateForTasks ?? setAppState,
        setToolJSX,
        preventCwdChanges: !isMainThread,
        isMainThread,
        toolUseId: toolUseContext.toolUseId,
        agentId: toolUseContext.agentId
      });
      // generatorResult 先占位，稍后的条件分支会根据实际输入补齐它。
      let generatorResult;
      // 先执行一次循环体，再按尾部条件决定是否继续工具调用处理。
      do {
        // generatorResult更新为 `await commandGenerator.next()`，确保工具调用后续读取最新状态。
        generatorResult = await commandGenerator.next();
        // 只有 `!generatorResult.done && onProgress` 满足时，工具调用才执行该分支。
        if (!generatorResult.done && onProgress) {
          // progress 集合保存`generatorResult.value`，供后续判断或组装使用。
          const progress = generatorResult.value;
          // 调用 onProgress，触发工具调用此处需要的副作用。
          onProgress({
            toolUseID: `ps-progress-${progressCounter++}`,
            data: {
              type: 'powershell_progress',
              output: progress.output,
              fullOutput: progress.fullOutput,
              elapsedTimeSeconds: progress.elapsedTimeSeconds,
              totalLines: progress.totalLines,
              totalBytes: progress.totalBytes,
              timeoutMs: progress.timeoutMs,
              taskId: progress.taskId
            }
          });
        }
      } while (!generatorResult.done);
      // 结果保存`generatorResult.value`，供后续判断或组装使用。
      const result = generatorResult.value;

      // Feed git/PR usage metrics (same counters as BashTool). PS invokes
      // git/gh/glab/curl as external binaries with identical syntax, so the
      // shell-agnostic regex detection in trackGitOperations works as-is.
      // Called before the backgroundTaskId early-return so backgrounded
      // commands are counted too (matches BashTool.tsx:912).
      //
      // Pre-flight sentinel guard: the two PS pre-flight paths (pwsh-not-found,
      // exec-spawn-catch) return code: 0 + empty stdout + stderr so call() can
      // surface stderr gracefully instead of throwing ShellError. But
      // gitOperationTracking.ts:48 treats code 0 as success and would
      // regex-match the command, mis-counting a command that never ran.
      // BashTool is safe — its pre-flight goes through createFailedCommand
      // (code: 1) so tracking early-returns. Skip tracking on this sentinel.
      // isPreFlightSentinel标记工具实现 Power Shell Tool是否启用对应路径。
      const isPreFlightSentinel = result.code === 0 && !result.stdout && result.stderr && !result.backgroundTaskId;
      // isPreFlightSentinel缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!isPreFlightSentinel) {
        // 调用 trackGitOperations，触发工具调用此处需要的副作用。
        trackGitOperations(input.command, result.code, result.stdout);
      }

      // Distinguish user-driven interrupt (new message submitted) from other
      // interrupted states. Only user-interrupt should suppress ShellError —
      // timeout-kill or process-kill with isError should still throw.
      // Matches BashTool's isInterrupt.
      // isInterrupt标记工具实现 Power Shell Tool是否启用对应路径。
      const isInterrupt = result.interrupted && abortController.signal.reason === 'interrupt';

      // Only the main thread tracks/resets cwd; agents have their own cwd
      // isolation. Matches BashTool's !preventCwdChanges guard.
      // Runs before the backgroundTaskId early-return: a command may change
      // CWD before being backgrounded (e.g. `Set-Location C:\temp;
      // Start-Sleep 60`), and BashTool has no such early return — its
      // backgrounded results flow through resetCwdIfOutsideProject at :945.
      // stderrForShellReset 命名 `''`，让后续代码直接表达这个值的用途。
      let stderrForShellReset = '';
      // 满足 `isMainThread` 时，工具调用执行该分支。
      if (isMainThread) {
        // appState 状态读取`toolUseContext.getAppState`，供工具调用后续处理使用。
        const appState = toolUseContext.getAppState();
        // 满足 `resetCwdIfOutsideProject(appState.toolPermissionContext)` 时，工具调用执行该分支。
        if (resetCwdIfOutsideProject(appState.toolPermissionContext)) {
          // stderrForShellReset更新为 `stdErrAppendShellResetMessage('')`，确保工具调用后续读取最新状态。
          stderrForShellReset = stdErrAppendShellResetMessage('');
        }
      }

      // If backgrounded, return immediately with task ID. Strip hints first
      // so interrupt-backgrounded fullOutput doesn't leak the tag to the
      // model (BashTool has no early return, so all paths flow through its
      // single extraction site).
      // 满足 `result.backgroundTaskId` 时，工具调用执行该分支。
      if (result.backgroundTaskId) {
        // bgExtracted保存`extractClaudeCodeHints`，供工具调用后续处理使用。
        const bgExtracted = extractClaudeCodeHints(result.stdout || '', input.command);
        // 只有 `isMainThread && bgExtracted.hints.length > 0` 满足时，工具调用才执行该分支。
        if (isMainThread && bgExtracted.hints.length > 0) {
          // 逐项读取 `bgExtracted.hints) maybeRecordPluginHint(hint` 中的hint，按输入顺序推进工具调用。
          for (const hint of bgExtracted.hints) maybeRecordPluginHint(hint);
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            stdout: bgExtracted.stripped,
            stderr: [result.stderr || '', stderrForShellReset].filter(Boolean).join('\n'),
            interrupted: false,
            backgroundTaskId: result.backgroundTaskId,
            backgroundedByUser: result.backgroundedByUser,
            assistantAutoBackgrounded: result.assistantAutoBackgrounded
          }
        };
      }
      // stdoutAccumulator保存`EndTruncatingAccumulator`，供工具调用后续处理使用。
      const stdoutAccumulator = new EndTruncatingAccumulator();
      // processedStdout格式化`trimEnd`，供工具调用后续处理使用。
      const processedStdout = (result.stdout || '').trimEnd();
      // 调用 stdoutAccumulator.append，触发工具调用此处需要的副作用。
      stdoutAccumulator.append(processedStdout + EOL);

      // Interpret exit code using semantic rules. PS-native cmdlets (Select-String,
      // Compare-Object, Test-Path) exit 0 on no-match so they always hit the default
      // here. This primarily handles external .exe's (grep, rg, findstr, fc, robocopy)
      // where non-zero can mean "no match" / "files copied" rather than failure.
      // interpretation保存`interpretCommandResult`，供工具调用后续处理使用。
      const interpretation = interpretCommandResult(input.command, result.code, processedStdout, result.stderr || '');

      // getErrorParts() in toolErrors.ts already prepends 'Exit code N'
      // from error.code when building the ShellError message. Do not
      // duplicate it into stdout here (BashTool's append at :939 is dead
      // code — it throws before stdoutAccumulator.toString() is read).

      // stdout保存`stripEmptyLines`，供工具调用后续处理使用。
      let stdout = stripEmptyLines(stdoutAccumulator.toString());

      // Claude Code hints protocol: CLIs/SDKs gated on CLAUDECODE=1 emit a
      // `<claude-code-hint />` tag to stderr (merged into stdout here). Scan,
      // record for useClaudeCodeHintRecommendation to surface, then strip
      // so the model never sees the tag — a zero-token side channel.
      // Stripping runs unconditionally (subagent output must stay clean too);
      // only the dialog recording is main-thread-only.
      // extracted保存`extractClaudeCodeHints`，供工具调用后续处理使用。
      const extracted = extractClaudeCodeHints(stdout, input.command);
      // stdout更新为 `extracted.stripped`，确保工具调用后续读取最新状态。
      stdout = extracted.stripped;
      // 只有 `isMainThread && extracted.hints.length > 0` 满足时，工具调用才执行该分支。
      if (isMainThread && extracted.hints.length > 0) {
        // 逐项读取 `extracted.hints) maybeRecordPluginHint(hint` 中的hint，按输入顺序推进工具调用。
        for (const hint of extracted.hints) maybeRecordPluginHint(hint);
      }

      // preSpawnError means exec() succeeded but the inner shell failed before
      // the command ran (e.g. CWD deleted). createFailedCommand sets code=1,
      // which interpretCommandResult can mistake for grep-no-match / findstr
      // string-not-found. Throw it directly. Matches BashTool.tsx:957.
      // 满足 `result.preSpawnError` 时，工具调用执行该分支。
      if (result.preSpawnError) {
        // 抛出 new Error(result.preSpawnError);，阻止工具调用在无效状态下继续运行。
        throw new Error(result.preSpawnError);
      }
      // 只有 `interpretation.isError && !isInterrupt` 满足时，工具调用才执行该分支。
      if (interpretation.isError && !isInterrupt) {
        // 抛出 new ShellError(stdout, result.stderr || '', result.code, result.interrupted);，阻止工具调用在无效状态下继续运行。
        throw new ShellError(stdout, result.stderr || '', result.code, result.interrupted);
      }

      // Large output: file on disk has more than getMaxOutputLength() bytes.
      // stdout already contains the first chunk. Copy the output file to the
      // tool-results dir so the model can read it via FileRead. If > 64 MB,
      // truncate after copying. Matches BashTool.tsx:983-1005.
      //
      // Placed AFTER the preSpawnError/ShellError throws (matches BashTool's
      // ordering, where persistence is post-try/finally): a failing command
      // that also produced >maxOutputLength bytes would otherwise do 3-4 disk
      // syscalls, store to tool-results/, then throw — orphaning the file.
      // MAX_PERSISTED_SIZE保存`64 * 1024 * 1024`，供后续判断或组装使用。
      const MAX_PERSISTED_SIZE = 64 * 1024 * 1024;
      // persistedOutputPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
      let persistedOutputPath: string | undefined;
      // persistedOutputSize 先占位，稍后的条件分支会根据实际输入补齐它。
      let persistedOutputSize: number | undefined;
      // 只有 `result.outputFilePath && result.outputTaskId` 满足时，工具调用才执行该分支。
      if (result.outputFilePath && result.outputTaskId) {
        // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
        try {
          // fileStat 文件数据保存`fsStat`，供工具调用后续处理使用。
          const fileStat = await fsStat(result.outputFilePath);
          // persistedOutputSize更新为 `fileStat.size`，确保工具调用后续读取最新状态。
          persistedOutputSize = fileStat.size;
          // 等待 `ensureToolResultsDir()` 完成，再继续工具实现 Power Shell Tool的异步流程。
          await ensureToolResultsDir();
          // dest读取`getToolResultPath`，供工具调用后续处理使用。
          const dest = getToolResultPath(result.outputTaskId, false);
          // 满足 `fileStat.size > MAX_PERSISTED_SIZE` 时，工具调用执行该分支。
          if (fileStat.size > MAX_PERSISTED_SIZE) {
            // 等待 `fsTruncate(result.outputFilePath, MAX_PERSISTED_SIZE)` 完成，再继续工具实现 Power Shell Tool的异步流程。
            await fsTruncate(result.outputFilePath, MAX_PERSISTED_SIZE);
          }
          // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `link(result.outputFilePath, dest)` 完成，再继续工具实现 Power Shell Tool的异步流程。
            await link(result.outputFilePath, dest);
          } catch {
            // 等待 `copyFile(result.outputFilePath, dest)` 完成，再继续工具实现 Power Shell Tool的异步流程。
            await copyFile(result.outputFilePath, dest);
          }
          // persistedOutputPath 路径数据更新为 `dest`，确保工具调用后续读取最新状态。
          persistedOutputPath = dest;
        } catch {
          // File may already be gone — stdout preview is sufficient
        }
      }

      // Cap image dimensions + size if present (CC-304 — see
      // resizeShellImageOutput). Scope the decoded buffer so it can be
      // reclaimed before we build the output object.
      // isImage记录 `isImageOutput` 是否成立，工具调用随后按该结果分支。
      let isImage = isImageOutput(stdout);
      // compressedStdout保存`stdout`，供后续判断或组装使用。
      let compressedStdout = stdout;
      // 满足 `isImage` 时，工具调用执行该分支。
      if (isImage) {
        // resized统计`resizeShellImageOutput`，供工具调用后续处理使用。
        const resized = await resizeShellImageOutput(stdout, result.outputFilePath, persistedOutputSize);
        // 满足 `resized` 时，工具调用执行该分支。
        if (resized) {
          // compressedStdout更新为 `resized`，确保工具调用后续读取最新状态。
          compressedStdout = resized;
        } else {
          // Parse failed (e.g. multi-line stdout after the data URL). Keep
          // isImage in sync with what we actually send so the UI label stays
          // accurate — mapToolResultToToolResultBlockParam's defensive
          // fallthrough will send text, not an image block.
          // isImage更新为 `false`，确保工具调用后续读取最新状态。
          isImage = false;
        }
      }
      // finalStderr筛选`filter`，供工具调用后续处理使用。
      const finalStderr = [result.stderr || '', stderrForShellReset].filter(Boolean).join('\n');
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_powershell_tool_command_executed', {
        command_type: getCommandTypeForLogging(input.command),
        stdout_length: compressedStdout.length,
        stderr_length: finalStderr.length,
        exit_code: result.code,
        interrupted: result.interrupted
      });
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          stdout: compressedStdout,
          stderr: finalStderr,
          interrupted: result.interrupted,
          returnCodeInterpretation: interpretation.message,
          isImage,
          persistedOutputPath,
          persistedOutputSize
        }
      };
    } finally {
      // 满足 `setToolJSX) setToolJSX(null` 时，工具调用执行该分支。
      if (setToolJSX) setToolJSX(null);
    }
  },
  // isResultTruncated 用 output: Out 判断工具调用是否满足条件。
  isResultTruncated(output: Out): boolean {
    // 返回 `isOutputLineTruncated(output.stdout) || isOutputLineTruncated(output.st...`，作为工具调用这次计算的结果。
    return isOutputLineTruncated(output.stdout) || isOutputLineTruncated(output.stderr);
  }
} satisfies ToolDef<InputSchema, Out>);
// 工具实现 Power Shell Tool在这里处理 `async function* runPowerShellCommand({`，完成这一小步状态转换。
async function* runPowerShellCommand({
  input,
  abortController,
  setAppState,
  setToolJSX,
  preventCwdChanges,
  isMainThread,
  toolUseId,
  agentId
}: {
  input: PowerShellToolInput;
  abortController: AbortController;
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void;，负责工具调用在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void;
  setToolJSX?: SetToolJSXFn;
  preventCwdChanges?: boolean;
  isMainThread?: boolean;
  toolUseId?: string;
  agentId?: AgentId;
}): AsyncGenerator<{
  type: 'progress';
  output: string;
  fullOutput: string;
  elapsedTimeSeconds: number;
  totalLines: number;
  totalBytes: number;
  taskId?: string;
  timeoutMs?: number;
}, ExecResult, void> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    command,
    description,
    timeout,
    run_in_background,
    dangerouslyDisableSandbox
  } = input;
  // timeoutMs 集合保存`Math.min`，供工具调用后续处理使用。
  const timeoutMs = Math.min(timeout || getDefaultTimeoutMs(), getMaxTimeoutMs());
  // fullOutput 命名 `''`，让后续代码直接表达这个值的用途。
  let fullOutput = '';
  // lastProgressOutput 命名 `''`，让后续代码直接表达这个值的用途。
  let lastProgressOutput = '';
  // lastTotalLines 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let lastTotalLines = 0;
  // lastTotalBytes 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let lastTotalBytes = 0;
  // backgroundShellId初始化为未定义值，后续分支会在有数据时补齐。
  let backgroundShellId: string | undefined = undefined;
  // interruptBackgroundingStarted标记工具实现 Power Shell Tool是否启用对应路径。
  let interruptBackgroundingStarted = false;
  // assistantAutoBackgrounded标记工具实现 Power Shell Tool是否启用对应路径。
  let assistantAutoBackgrounded = false;

  // Progress signal: resolved when backgroundShellId is set in the async
  // .then() path, waking the generator's Promise.race immediately instead of
  // waiting for the next setTimeout tick (matches BashTool pattern).
  // 这个回调绑定到 let resolveProgress: (() => void) | null = null;，负责工具调用在该局部场景下的响应。
  let resolveProgress: (() => void) | null = null;
  // createProgressSignal 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function createProgressSignal(): Promise<null> {
    // 返回 `new Promise<null>(resolve => {`，作为工具调用这次计算的结果。
    return new Promise<null>(resolve => {
      // resolveProgress 集合更新为 `() => resolve(null)`，确保工具调用后续读取最新状态。
      resolveProgress = () => resolve(null);
    });
  }
  // shouldAutoBackground记录 `isAutobackgroundingAllowed` 是否成立，工具调用随后按该结果分支。
  const shouldAutoBackground = !isBackgroundTasksDisabled && isAutobackgroundingAllowed(command);
  // powershellPath 路径数据读取`getCachedPowerShellPath`，供工具调用后续处理使用。
  const powershellPath = await getCachedPowerShellPath();
  // powershellPath 路径数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!powershellPath) {
    // Pre-flight failure: pwsh not installed. Return code 0 so call() surfaces
    // this as a graceful stderr message rather than throwing ShellError — the
    // command never ran, so there is no meaningful non-zero exit to report.
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      stdout: '',
      stderr: 'PowerShell is not available on this system.',
      code: 0,
      interrupted: false
    };
  }
  // shellCommand 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let shellCommand: Awaited<ReturnType<typeof exec>>;
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // shellCommand 命令数据更新为 `await exec(command, abortController.signal, 'powershell',...`，确保工具调用后续读取最新状态。
    shellCommand = await exec(command, abortController.signal, 'powershell', {
      timeout: timeoutMs,
      // onProgress 使用 lastLines, allLines, totalLines, totalBytes, isIn… 完成工具调用里的对应操作。
      onProgress(lastLines, allLines, totalLines, totalBytes, isIncomplete) {
        // lastProgressOutput更新为 `lastLines`，确保工具调用后续读取最新状态。
        lastProgressOutput = lastLines;
        // fullOutput更新为 `allLines`，确保工具调用后续读取最新状态。
        fullOutput = allLines;
        // lastTotalLines 集合更新为 `totalLines`，确保工具调用后续读取最新状态。
        lastTotalLines = totalLines;
        // lastTotalBytes 集合更新为 `isIncomplete ? totalBytes : 0`，确保工具调用后续读取最新状态。
        lastTotalBytes = isIncomplete ? totalBytes : 0;
      },
      preventCwdChanges,
      // Sandbox works on Linux/macOS/WSL2 — pwsh there is a native binary and
      // SandboxManager.wrapWithSandbox wraps it same as bash (Shell.ts uses
      // /bin/sh for the outer spawn to parse the POSIX-quoted bwrap/sandbox-exec
      // string). On Windows native, sandbox is unsupported; shouldUseSandbox()
      // returns false via isSandboxingEnabled() → isSupportedPlatform() → false.
      // The explicit platform check is redundant-but-obvious.
      shouldUseSandbox: getPlatform() === 'windows' ? false : shouldUseSandbox({
        command,
        dangerouslyDisableSandbox
      }),
      shouldAutoBackground
    });
  } catch (e) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(e);
    // Pre-flight failure: spawn/exec rejected before the command ran. Use
    // code 0 so call() returns stderr gracefully instead of throwing ShellError.
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      stdout: '',
      stderr: `Failed to execute PowerShell command: ${getErrorMessage(e)}`,
      code: 0,
      interrupted: false
    };
  }
  // resultPromise 异步任务保存`shellCommand.result`，供工具实现 Power Shell Tool后续判断或输出使用。
  const resultPromise = shellCommand.result;

  // Helper to spawn a background task and return its ID
  // spawnBackgroundTask 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function spawnBackgroundTask(): Promise<string> {
    // handle保存`spawnShellTask`，供工具调用后续处理使用。
    const handle = await spawnShellTask({
      command,
      description: description || command,
      shellCommand,
      toolUseId,
      agentId
    }, {
      abortController,
      // 这个回调绑定到 getAppState: () => {，负责工具调用在该局部场景下的响应。
      getAppState: () => {
        // 抛出 new Error('getAppState not available in runPowerShellCommand context');，阻止工具调用在无效状态下继续运行。
        throw new Error('getAppState not available in runPowerShellCommand context');
      },
      setAppState
    });
    // 返回 `handle.taskId`，作为工具调用这次计算的结果。
    return handle.taskId;
  }

  // Helper to start backgrounding with logging
  // startBackgrounding 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function startBackgrounding(eventName: string, backgroundFn?: (shellId: string) => void): void {
    // If a foreground task is already registered (via registerForeground in the
    // progress loop), background it in-place instead of re-spawning. Re-spawning
    // would overwrite tasks[taskId], emit a duplicate task_started SDK event,
    // and leak the first cleanup callback.
    // 满足 `foregroundTaskId` 时，工具调用执行该分支。
    if (foregroundTaskId) {
      // 只有 `!backgroundExistingForegroundTask(foregroundTaskId, shellCommand, descripti...` 满足时，工具调用才执行该分支。
      if (!backgroundExistingForegroundTask(foregroundTaskId, shellCommand, description || command, setAppState, toolUseId)) {
        // 工具实现 Power Shell Tool在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // backgroundShellId更新为 `foregroundTaskId`，确保工具调用后续读取最新状态。
      backgroundShellId = foregroundTaskId;
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent(eventName, {
        command_type: getCommandTypeForLogging(command)
      });
      // 调用 backgroundFn?.(foregroundTaskId);，完成这一处局部操作。
      backgroundFn?.(foregroundTaskId);
      // 工具实现 Power Shell Tool在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }

    // No foreground task registered — spawn a new background task
    // Note: spawn is essentially synchronous despite being async
    // 这个回调绑定到 void spawnBackgroundTask().then(shellId => {，负责工具调用在该局部场景下的响应。
    void spawnBackgroundTask().then(shellId => {
      // backgroundShellId更新为 `shellId`，确保工具调用后续读取最新状态。
      backgroundShellId = shellId;

      // Wake the generator's Promise.race so it sees backgroundShellId.
      // Without this, the generator waits for the current setTimeout to fire
      // (up to ~1s) before noticing the backgrounding. Matches BashTool.
      // resolve 命名 `resolveProgress`，让后续代码直接表达这个值的用途。
      const resolve = resolveProgress;
      // 满足 `resolve` 时，工具调用执行该分支。
      if (resolve) {
        // resolveProgress 集合更新为 `null`，确保工具调用后续读取最新状态。
        resolveProgress = null;
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve();
      }
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent(eventName, {
        command_type: getCommandTypeForLogging(command)
      });
      // 满足 `backgroundFn` 时，工具调用执行该分支。
      if (backgroundFn) {
        // 调用 backgroundFn，触发工具调用此处需要的副作用。
        backgroundFn(shellId);
      }
    });
  }

  // Set up auto-backgrounding on timeout if enabled
  // 只有 `shellCommand.onTimeout && shouldAutoBackground` 满足时，工具调用才执行该分支。
  if (shellCommand.onTimeout && shouldAutoBackground) {
    // 调用 shellCommand.onTimeout，触发工具调用此处需要的副作用。
    shellCommand.onTimeout(backgroundFn => {
      // 调用 startBackgrounding，触发工具调用此处需要的副作用。
      startBackgrounding('tengu_powershell_command_timeout_backgrounded', backgroundFn);
    });
  }

  // In assistant mode, the main agent should stay responsive. Auto-background
  // blocking commands after ASSISTANT_BLOCKING_BUDGET_MS so the agent can keep
  // coordinating instead of waiting. The command keeps running — no state loss.
  // 只有 `feature('KAIROS') && getKairosActive() && isMainThread && !isBackgroundTask...` 满足时，工具调用才执行该分支。
  if (feature('KAIROS') && getKairosActive() && isMainThread && !isBackgroundTasksDisabled && run_in_background !== true) {
    // setTimeout 写入新的状态值，使工具调用后续读取保持一致。
    setTimeout(() => {
      // 只有 `shellCommand.status === 'running' && backgroundSh` 满足时，工具调用才执行该分支。
      if (shellCommand.status === 'running' && backgroundShellId === undefined) {
        // assistantAutoBackgrounded更新为 `true`，确保工具调用后续读取最新状态。
        assistantAutoBackgrounded = true;
        // 调用 startBackgrounding，触发工具调用此处需要的副作用。
        startBackgrounding('tengu_powershell_command_assistant_auto_backgrounded');
      }
    }, ASSISTANT_BLOCKING_BUDGET_MS).unref();
  }

  // Handle Claude asking to run it in the background explicitly
  // When explicitly requested via run_in_background, always honor the request
  // regardless of the command type (isAutobackgroundingAllowed only applies to automatic backgrounding)
  // 只有 `run_in_background === true && !isBackgroundTasksD` 满足时，工具调用才执行该分支。
  if (run_in_background === true && !isBackgroundTasksDisabled) {
    // shellId保存`spawnBackgroundTask`，供工具调用后续处理使用。
    const shellId = await spawnBackgroundTask();
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_powershell_command_explicitly_backgrounded', {
      command_type: getCommandTypeForLogging(command)
    });
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      stdout: '',
      stderr: '',
      code: 0,
      interrupted: false,
      backgroundTaskId: shellId
    };
  }

  // Start polling the output file for progress
  // 调用 TaskOutput.startPolling，触发工具调用此处需要的副作用。
  TaskOutput.startPolling(shellCommand.taskOutput.taskId);

  // Set up progress yielding with periodic checks
  // startTime记录时间`Date.now`，供工具调用后续处理使用。
  const startTime = Date.now();
  // nextProgressTime保存`startTime + PROGRESS_THRESHOLD_MS`，供后续判断或组装使用。
  let nextProgressTime = startTime + PROGRESS_THRESHOLD_MS;
  // foregroundTaskId保存`undefined`，作为后续未定义值处理的输入。
  let foregroundTaskId: string | undefined = undefined;

  // Progress loop: wrap in try/finally so stopPolling is called on every exit
  // path — normal completion, timeout/interrupt backgrounding, and Ctrl+B
  // (matches BashTool pattern; see PR #18887 review thread at :560)
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // while 使用 true 完成工具调用里的对应操作。
    while (true) {
      // now记录时间`Date.now`，供工具调用后续处理使用。
      const now = Date.now();
      // timeUntilNextProgress 集合保存`Math.max`，供工具调用后续处理使用。
      const timeUntilNextProgress = Math.max(0, nextProgressTime - now);
      // progressSignal构建`createProgressSignal`，供工具调用后续处理使用。
      const progressSignal = createProgressSignal();
      // 结果保存`Promise.race`，供工具调用后续处理使用。
      const result = await Promise.race([resultPromise, new Promise<null>(resolve => setTimeout(r => r(null), timeUntilNextProgress, resolve).unref()), progressSignal]);
      // `result` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (result !== null) {
        // Race: backgrounding fired (15s timer / onTimeout / Ctrl+B) but the
        // command completed before the next poll tick. #handleExit sets
        // backgroundTaskId but skips outputFilePath (it assumes the background
        // message or <task_notification> will carry the path). Strip
        // backgroundTaskId so the model sees a clean completed command,
        // reconstruct outputFilePath for large outputs, and suppress the
        // redundant <task_notification> from the .then() handler.
        // Check result.backgroundTaskId (not the closure var) to also cover
        // Ctrl+B, which calls shellCommand.background() directly.
        // `result.backgroundTaskId` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (result.backgroundTaskId !== undefined) {
          // 调用 markTaskNotified，触发工具调用此处需要的副作用。
          markTaskNotified(result.backgroundTaskId, setAppState);
          // fixedResult 集中保存工具实现 Power Shell Tool要一起传递的字段。
          const fixedResult: ExecResult = {
            ...result,
            backgroundTaskId: undefined
          };
          // Mirror ShellCommand.#handleExit's large-output branch that was
          // skipped because #backgroundTaskId was set.
          // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
          const {
            taskOutput
          } = shellCommand;
          // 只有 `taskOutput.stdoutToFile && !taskOutput.outputFile` 满足时，工具调用才执行该分支。
          if (taskOutput.stdoutToFile && !taskOutput.outputFileRedundant) {
            // outputFilePath 路径数据更新为 `taskOutput.path`，确保工具调用后续读取最新状态。
            fixedResult.outputFilePath = taskOutput.path;
            // outputFileSize 文件数据更新为 `taskOutput.outputFileSize`，确保工具调用后续读取最新状态。
            fixedResult.outputFileSize = taskOutput.outputFileSize;
            // outputTaskId更新为 `taskOutput.taskId`，确保工具调用后续读取最新状态。
            fixedResult.outputTaskId = taskOutput.taskId;
          }
          // Command completed — cleanup stream listeners here. The finally
          // block's guard (!backgroundShellId && status !== 'backgrounded')
          // correctly skips cleanup for *running* backgrounded tasks, but
          // in this race the process is done. Matches BashTool.tsx:1399.
          // 调用 shellCommand.cleanup，触发工具调用此处需要的副作用。
          shellCommand.cleanup();
          // 返回 `fixedResult`，作为工具调用这次计算的结果。
          return fixedResult;
        }
        // Command has completed
        // 返回 `result`，作为工具调用这次计算的结果。
        return result;
      }

      // Check if command was backgrounded (by timeout or interrupt)
      // 满足 `backgroundShellId` 时，工具调用执行该分支。
      if (backgroundShellId) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          stdout: interruptBackgroundingStarted ? fullOutput : '',
          stderr: '',
          code: 0,
          interrupted: false,
          backgroundTaskId: backgroundShellId,
          assistantAutoBackgrounded
        };
      }

      // User submitted a new message - background instead of killing
      // 只有 `abortController.signal.aborted && abortController` 满足时，工具调用才执行该分支。
      if (abortController.signal.aborted && abortController.signal.reason === 'interrupt' && !interruptBackgroundingStarted) {
        // interruptBackgroundingStarted更新为 `true`，确保工具调用后续读取最新状态。
        interruptBackgroundingStarted = true;
        // isBackgroundTasksDisabled缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!isBackgroundTasksDisabled) {
          // 调用 startBackgrounding，触发工具调用此处需要的副作用。
          startBackgrounding('tengu_powershell_command_interrupt_backgrounded');
          // Reloop so the backgroundShellId check (above) catches the sync
          // foregroundTaskId→background path. Without this, we fall through
          // to the Ctrl+B check below, which matches status==='backgrounded'
          // and incorrectly returns backgroundedByUser:true. (bugs 020/021)
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue;
        }
        // 调用 shellCommand.kill，触发工具调用此处需要的副作用。
        shellCommand.kill();
      }

      // Check if this foreground task was backgrounded via backgroundAll() (ctrl+b)
      // 满足 `foregroundTaskId` 时，工具调用执行该分支。
      if (foregroundTaskId) {
        // 当 `shellCommand.status` 匹配 `'backgrounded'` 时，工具调用执行对应分支。
        if (shellCommand.status === 'backgrounded') {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            stdout: '',
            stderr: '',
            code: 0,
            interrupted: false,
            backgroundTaskId: foregroundTaskId,
            backgroundedByUser: true
          };
        }
      }

      // Time for a progress update
      // elapsed记录时间`Date.now`，供工具调用后续处理使用。
      const elapsed = Date.now() - startTime;
      // elapsedSeconds 集合保存`Math.floor`，供工具调用后续处理使用。
      const elapsedSeconds = Math.floor(elapsed / 1000);

      // Show backgrounding UI hint after threshold
      // 只有 `!isBackgroundTasksDisabled && backgroundShellId =` 满足时，工具调用才执行该分支。
      if (!isBackgroundTasksDisabled && backgroundShellId === undefined && elapsedSeconds >= PROGRESS_THRESHOLD_MS / 1000 && setToolJSX) {
        // foregroundTaskId缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!foregroundTaskId) {
          // foregroundTaskId更新为 `registerForeground({`，确保工具调用后续读取最新状态。
          foregroundTaskId = registerForeground({
            command,
            description: description || command,
            shellCommand,
            agentId
          }, setAppState, toolUseId);
        }
        // setToolJSX 写入新的状态值，使工具调用后续读取保持一致。
        setToolJSX({
          jsx: <BackgroundHint />,
          shouldHidePromptInput: false,
          shouldContinueAnimation: true,
          showSpinner: true
        });
      }
      // 生成器产出 `{`，把阶段性结果交给上层消费。
      yield {
        type: 'progress',
        fullOutput,
        output: lastProgressOutput,
        elapsedTimeSeconds: elapsedSeconds,
        totalLines: lastTotalLines,
        totalBytes: lastTotalBytes,
        taskId: shellCommand.taskOutput.taskId,
        ...(timeout ? {
          timeoutMs
        } : undefined)
      };
      // nextProgressTime更新为 `Date.now() + PROGRESS_INTERVAL_MS`，确保工具调用后续读取最新状态。
      nextProgressTime = Date.now() + PROGRESS_INTERVAL_MS;
    }
  } finally {
    // 调用 TaskOutput.stopPolling，触发工具调用此处需要的副作用。
    TaskOutput.stopPolling(shellCommand.taskOutput.taskId);
    // Ensure cleanup runs on every exit path (success, rejection, abort).
    // Skip when backgrounded — LocalShellTask owns cleanup for those.
    // Matches main #21105.
    // `!backgroundShellId && shellCommand.status` 与 `'ba` 不一致时刷新派生状态，避免使用过期结果。
    if (!backgroundShellId && shellCommand.status !== 'backgrounded') {
      // 满足 `foregroundTaskId` 时，工具调用执行该分支。
      if (foregroundTaskId) {
        // 调用 unregisterForeground，触发工具调用此处需要的副作用。
        unregisterForeground(foregroundTaskId, setAppState);
      }
      // 调用 shellCommand.cleanup，触发工具调用此处需要的副作用。
      shellCommand.cleanup();
    }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiVG9vbFJlc3VsdEJsb2NrUGFyYW0iLCJjb3B5RmlsZSIsInN0YXQiLCJmc1N0YXQiLCJ0cnVuY2F0ZSIsImZzVHJ1bmNhdGUiLCJsaW5rIiwiUmVhY3QiLCJDYW5Vc2VUb29sRm4iLCJBcHBTdGF0ZSIsInoiLCJnZXRLYWlyb3NBY3RpdmUiLCJUT09MX1NVTU1BUllfTUFYX0xFTkdUSCIsIkFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMiLCJsb2dFdmVudCIsIlNldFRvb2xKU1hGbiIsIlRvb2wiLCJUb29sQ2FsbFByb2dyZXNzIiwiVmFsaWRhdGlvblJlc3VsdCIsImJ1aWxkVG9vbCIsIlRvb2xEZWYiLCJiYWNrZ3JvdW5kRXhpc3RpbmdGb3JlZ3JvdW5kVGFzayIsIm1hcmtUYXNrTm90aWZpZWQiLCJyZWdpc3RlckZvcmVncm91bmQiLCJzcGF3blNoZWxsVGFzayIsInVucmVnaXN0ZXJGb3JlZ3JvdW5kIiwiQWdlbnRJZCIsIkFzc2lzdGFudE1lc3NhZ2UiLCJleHRyYWN0Q2xhdWRlQ29kZUhpbnRzIiwiaXNFbnZUcnV0aHkiLCJlcnJvck1lc3NhZ2UiLCJnZXRFcnJvck1lc3NhZ2UiLCJTaGVsbEVycm9yIiwibGF6eVNjaGVtYSIsImxvZ0Vycm9yIiwiUGVybWlzc2lvblJlc3VsdCIsImdldFBsYXRmb3JtIiwibWF5YmVSZWNvcmRQbHVnaW5IaW50IiwiZXhlYyIsIkV4ZWNSZXN1bHQiLCJTYW5kYm94TWFuYWdlciIsInNlbWFudGljQm9vbGVhbiIsInNlbWFudGljTnVtYmVyIiwiZ2V0Q2FjaGVkUG93ZXJTaGVsbFBhdGgiLCJFbmRUcnVuY2F0aW5nQWNjdW11bGF0b3IiLCJnZXRUYXNrT3V0cHV0UGF0aCIsIlRhc2tPdXRwdXQiLCJpc091dHB1dExpbmVUcnVuY2F0ZWQiLCJidWlsZExhcmdlVG9vbFJlc3VsdE1lc3NhZ2UiLCJlbnN1cmVUb29sUmVzdWx0c0RpciIsImdlbmVyYXRlUHJldmlldyIsImdldFRvb2xSZXN1bHRQYXRoIiwiUFJFVklFV19TSVpFX0JZVEVTIiwic2hvdWxkVXNlU2FuZGJveCIsIkJhY2tncm91bmRIaW50IiwiYnVpbGRJbWFnZVRvb2xSZXN1bHQiLCJpc0ltYWdlT3V0cHV0IiwicmVzZXRDd2RJZk91dHNpZGVQcm9qZWN0IiwicmVzaXplU2hlbGxJbWFnZU91dHB1dCIsInN0ZEVyckFwcGVuZFNoZWxsUmVzZXRNZXNzYWdlIiwic3RyaXBFbXB0eUxpbmVzIiwidHJhY2tHaXRPcGVyYXRpb25zIiwiaW50ZXJwcmV0Q29tbWFuZFJlc3VsdCIsInBvd2Vyc2hlbGxUb29sSGFzUGVybWlzc2lvbiIsImdldERlZmF1bHRUaW1lb3V0TXMiLCJnZXRNYXhUaW1lb3V0TXMiLCJnZXRQcm9tcHQiLCJoYXNTeW5jU2VjdXJpdHlDb25jZXJucyIsImlzUmVhZE9ubHlDb21tYW5kIiwicmVzb2x2ZVRvQ2Fub25pY2FsIiwiUE9XRVJTSEVMTF9UT09MX05BTUUiLCJyZW5kZXJUb29sUmVzdWx0TWVzc2FnZSIsInJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsInJlbmRlclRvb2xVc2VQcm9ncmVzc01lc3NhZ2UiLCJyZW5kZXJUb29sVXNlUXVldWVkTWVzc2FnZSIsIkVPTCIsIlBTX1NFQVJDSF9DT01NQU5EUyIsIlNldCIsIlBTX1JFQURfQ09NTUFORFMiLCJQU19TRU1BTlRJQ19ORVVUUkFMX0NPTU1BTkRTIiwiaXNTZWFyY2hPclJlYWRQb3dlclNoZWxsQ29tbWFuZCIsImNvbW1hbmQiLCJpc1NlYXJjaCIsImlzUmVhZCIsInRyaW1tZWQiLCJ0cmltIiwicGFydHMiLCJzcGxpdCIsImZpbHRlciIsIkJvb2xlYW4iLCJsZW5ndGgiLCJoYXNTZWFyY2giLCJoYXNSZWFkIiwiaGFzTm9uTmV1dHJhbENvbW1hbmQiLCJwYXJ0IiwiYmFzZUNvbW1hbmQiLCJjYW5vbmljYWwiLCJoYXMiLCJpc1BhcnRTZWFyY2giLCJpc1BhcnRSZWFkIiwiUFJPR1JFU1NfVEhSRVNIT0xEX01TIiwiUFJPR1JFU1NfSU5URVJWQUxfTVMiLCJBU1NJU1RBTlRfQkxPQ0tJTkdfQlVER0VUX01TIiwiRElTQUxMT1dFRF9BVVRPX0JBQ0tHUk9VTkRfQ09NTUFORFMiLCJpc0F1dG9iYWNrZ3JvdW5kaW5nQWxsb3dlZCIsImZpcnN0V29yZCIsImluY2x1ZGVzIiwiZGV0ZWN0QmxvY2tlZFNsZWVwUGF0dGVybiIsImZpcnN0IiwibSIsInNlY3MiLCJwYXJzZUludCIsInJlc3QiLCJzbGljZSIsInJlcGxhY2UiLCJXSU5ET1dTX1NBTkRCT1hfUE9MSUNZX1JFRlVTQUwiLCJpc1dpbmRvd3NTYW5kYm94UG9saWN5VmlvbGF0aW9uIiwiaXNTYW5kYm94RW5hYmxlZEluU2V0dGluZ3MiLCJhcmVVbnNhbmRib3hlZENvbW1hbmRzQWxsb3dlZCIsImlzQmFja2dyb3VuZFRhc2tzRGlzYWJsZWQiLCJwcm9jZXNzIiwiZW52IiwiQ0xBVURFX0NPREVfRElTQUJMRV9CQUNLR1JPVU5EX1RBU0tTIiwiZnVsbElucHV0U2NoZW1hIiwic3RyaWN0T2JqZWN0Iiwic3RyaW5nIiwiZGVzY3JpYmUiLCJ0aW1lb3V0IiwibnVtYmVyIiwib3B0aW9uYWwiLCJkZXNjcmlwdGlvbiIsInJ1bl9pbl9iYWNrZ3JvdW5kIiwiYm9vbGVhbiIsImRhbmdlcm91c2x5RGlzYWJsZVNhbmRib3giLCJpbnB1dFNjaGVtYSIsIm9taXQiLCJJbnB1dFNjaGVtYSIsIlJldHVyblR5cGUiLCJQb3dlclNoZWxsVG9vbElucHV0IiwiaW5mZXIiLCJvdXRwdXRTY2hlbWEiLCJvYmplY3QiLCJzdGRvdXQiLCJzdGRlcnIiLCJpbnRlcnJ1cHRlZCIsInJldHVybkNvZGVJbnRlcnByZXRhdGlvbiIsImlzSW1hZ2UiLCJwZXJzaXN0ZWRPdXRwdXRQYXRoIiwicGVyc2lzdGVkT3V0cHV0U2l6ZSIsImJhY2tncm91bmRUYXNrSWQiLCJiYWNrZ3JvdW5kZWRCeVVzZXIiLCJhc3Npc3RhbnRBdXRvQmFja2dyb3VuZGVkIiwiT3V0cHV0U2NoZW1hIiwiT3V0IiwiUG93ZXJTaGVsbFByb2dyZXNzIiwiQ09NTU9OX0JBQ0tHUk9VTkRfQ09NTUFORFMiLCJjb25zdCIsImdldENvbW1hbmRUeXBlRm9yTG9nZ2luZyIsImNtZCIsInRvTG93ZXJDYXNlIiwiUG93ZXJTaGVsbFRvb2wiLCJuYW1lIiwic2VhcmNoSGludCIsIm1heFJlc3VsdFNpemVDaGFycyIsInN0cmljdCIsIlBhcnRpYWwiLCJQcm9taXNlIiwicHJvbXB0IiwiaXNDb25jdXJyZW5jeVNhZmUiLCJpbnB1dCIsImlzUmVhZE9ubHkiLCJpc1NlYXJjaE9yUmVhZENvbW1hbmQiLCJ0b0F1dG9DbGFzc2lmaWVySW5wdXQiLCJ1c2VyRmFjaW5nTmFtZSIsImdldFRvb2xVc2VTdW1tYXJ5IiwiZ2V0QWN0aXZpdHlEZXNjcmlwdGlvbiIsImRlc2MiLCJpc0VuYWJsZWQiLCJ2YWxpZGF0ZUlucHV0IiwicmVzdWx0IiwibWVzc2FnZSIsImVycm9yQ29kZSIsInNsZWVwUGF0dGVybiIsImNoZWNrUGVybWlzc2lvbnMiLCJjb250ZXh0IiwiUGFyYW1ldGVycyIsIm1hcFRvb2xSZXN1bHRUb1Rvb2xSZXN1bHRCbG9ja1BhcmFtIiwidG9vbFVzZUlEIiwiYmxvY2siLCJwcm9jZXNzZWRTdGRvdXQiLCJ0cmltRW5kIiwicHJldmlldyIsImZpbGVwYXRoIiwib3JpZ2luYWxTaXplIiwiaXNKc29uIiwiaGFzTW9yZSIsImJhY2tncm91bmRJbmZvIiwib3V0cHV0UGF0aCIsInRvb2xfdXNlX2lkIiwidHlwZSIsImNvbnRlbnQiLCJqb2luIiwiaXNfZXJyb3IiLCJjYWxsIiwidG9vbFVzZUNvbnRleHQiLCJfY2FuVXNlVG9vbCIsIl9wYXJlbnRNZXNzYWdlIiwib25Qcm9ncmVzcyIsImRhdGEiLCJFcnJvciIsImFib3J0Q29udHJvbGxlciIsInNldEFwcFN0YXRlIiwic2V0VG9vbEpTWCIsImlzTWFpblRocmVhZCIsImFnZW50SWQiLCJwcm9ncmVzc0NvdW50ZXIiLCJjb21tYW5kR2VuZXJhdG9yIiwicnVuUG93ZXJTaGVsbENvbW1hbmQiLCJzZXRBcHBTdGF0ZUZvclRhc2tzIiwicHJldmVudEN3ZENoYW5nZXMiLCJ0b29sVXNlSWQiLCJnZW5lcmF0b3JSZXN1bHQiLCJuZXh0IiwiZG9uZSIsInByb2dyZXNzIiwidmFsdWUiLCJvdXRwdXQiLCJmdWxsT3V0cHV0IiwiZWxhcHNlZFRpbWVTZWNvbmRzIiwidG90YWxMaW5lcyIsInRvdGFsQnl0ZXMiLCJ0aW1lb3V0TXMiLCJ0YXNrSWQiLCJpc1ByZUZsaWdodFNlbnRpbmVsIiwiY29kZSIsImlzSW50ZXJydXB0Iiwic2lnbmFsIiwicmVhc29uIiwic3RkZXJyRm9yU2hlbGxSZXNldCIsImFwcFN0YXRlIiwiZ2V0QXBwU3RhdGUiLCJ0b29sUGVybWlzc2lvbkNvbnRleHQiLCJiZ0V4dHJhY3RlZCIsImhpbnRzIiwiaGludCIsInN0cmlwcGVkIiwic3Rkb3V0QWNjdW11bGF0b3IiLCJhcHBlbmQiLCJpbnRlcnByZXRhdGlvbiIsInRvU3RyaW5nIiwiZXh0cmFjdGVkIiwicHJlU3Bhd25FcnJvciIsImlzRXJyb3IiLCJNQVhfUEVSU0lTVEVEX1NJWkUiLCJvdXRwdXRGaWxlUGF0aCIsIm91dHB1dFRhc2tJZCIsImZpbGVTdGF0Iiwic2l6ZSIsImRlc3QiLCJjb21wcmVzc2VkU3Rkb3V0IiwicmVzaXplZCIsImZpbmFsU3RkZXJyIiwiY29tbWFuZF90eXBlIiwic3Rkb3V0X2xlbmd0aCIsInN0ZGVycl9sZW5ndGgiLCJleGl0X2NvZGUiLCJpc1Jlc3VsdFRydW5jYXRlZCIsIkFib3J0Q29udHJvbGxlciIsImYiLCJwcmV2IiwiQXN5bmNHZW5lcmF0b3IiLCJNYXRoIiwibWluIiwibGFzdFByb2dyZXNzT3V0cHV0IiwibGFzdFRvdGFsTGluZXMiLCJsYXN0VG90YWxCeXRlcyIsImJhY2tncm91bmRTaGVsbElkIiwidW5kZWZpbmVkIiwiaW50ZXJydXB0QmFja2dyb3VuZGluZ1N0YXJ0ZWQiLCJyZXNvbHZlUHJvZ3Jlc3MiLCJjcmVhdGVQcm9ncmVzc1NpZ25hbCIsInJlc29sdmUiLCJzaG91bGRBdXRvQmFja2dyb3VuZCIsInBvd2Vyc2hlbGxQYXRoIiwic2hlbGxDb21tYW5kIiwiQXdhaXRlZCIsImxhc3RMaW5lcyIsImFsbExpbmVzIiwiaXNJbmNvbXBsZXRlIiwiZSIsInJlc3VsdFByb21pc2UiLCJzcGF3bkJhY2tncm91bmRUYXNrIiwiaGFuZGxlIiwic3RhcnRCYWNrZ3JvdW5kaW5nIiwiZXZlbnROYW1lIiwiYmFja2dyb3VuZEZuIiwic2hlbGxJZCIsImZvcmVncm91bmRUYXNrSWQiLCJ0aGVuIiwib25UaW1lb3V0Iiwic2V0VGltZW91dCIsInN0YXR1cyIsInVucmVmIiwic3RhcnRQb2xsaW5nIiwidGFza091dHB1dCIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJuZXh0UHJvZ3Jlc3NUaW1lIiwidGltZVVudGlsTmV4dFByb2dyZXNzIiwibWF4IiwicHJvZ3Jlc3NTaWduYWwiLCJyYWNlIiwiciIsImZpeGVkUmVzdWx0Iiwic3Rkb3V0VG9GaWxlIiwib3V0cHV0RmlsZVJlZHVuZGFudCIsInBhdGgiLCJvdXRwdXRGaWxlU2l6ZSIsImNsZWFudXAiLCJhYm9ydGVkIiwia2lsbCIsImVsYXBzZWQiLCJlbGFwc2VkU2Vjb25kcyIsImZsb29yIiwianN4Iiwic2hvdWxkSGlkZVByb21wdElucHV0Iiwic2hvdWxkQ29udGludWVBbmltYXRpb24iLCJzaG93U3Bpbm5lciIsInN0b3BQb2xsaW5nIl0sInNvdXJjZXMiOlsiUG93ZXJTaGVsbFRvb2wudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZlYXR1cmUgfSBmcm9tICdidW46YnVuZGxlJ1xuaW1wb3J0IHR5cGUgeyBUb29sUmVzdWx0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQge1xuICBjb3B5RmlsZSxcbiAgc3RhdCBhcyBmc1N0YXQsXG4gIHRydW5jYXRlIGFzIGZzVHJ1bmNhdGUsXG4gIGxpbmssXG59IGZyb20gJ2ZzL3Byb21pc2VzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IENhblVzZVRvb2xGbiB9IGZyb20gJ3NyYy9ob29rcy91c2VDYW5Vc2VUb29sLmpzJ1xuaW1wb3J0IHR5cGUgeyBBcHBTdGF0ZSB9IGZyb20gJ3NyYy9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IHogfSBmcm9tICd6b2QvdjQnXG5pbXBvcnQgeyBnZXRLYWlyb3NBY3RpdmUgfSBmcm9tICcuLi8uLi9ib290c3RyYXAvc3RhdGUuanMnXG5pbXBvcnQgeyBUT09MX1NVTU1BUllfTUFYX0xFTkdUSCB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy90b29sTGltaXRzLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnLi4vLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHR5cGUge1xuICBTZXRUb29sSlNYRm4sXG4gIFRvb2wsXG4gIFRvb2xDYWxsUHJvZ3Jlc3MsXG4gIFZhbGlkYXRpb25SZXN1bHQsXG59IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgeyBidWlsZFRvb2wsIHR5cGUgVG9vbERlZiB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQge1xuICBiYWNrZ3JvdW5kRXhpc3RpbmdGb3JlZ3JvdW5kVGFzayxcbiAgbWFya1Rhc2tOb3RpZmllZCxcbiAgcmVnaXN0ZXJGb3JlZ3JvdW5kLFxuICBzcGF3blNoZWxsVGFzayxcbiAgdW5yZWdpc3RlckZvcmVncm91bmQsXG59IGZyb20gJy4uLy4uL3Rhc2tzL0xvY2FsU2hlbGxUYXNrL0xvY2FsU2hlbGxUYXNrLmpzJ1xuaW1wb3J0IHR5cGUgeyBBZ2VudElkIH0gZnJvbSAnLi4vLi4vdHlwZXMvaWRzLmpzJ1xuaW1wb3J0IHR5cGUgeyBBc3Npc3RhbnRNZXNzYWdlIH0gZnJvbSAnLi4vLi4vdHlwZXMvbWVzc2FnZS5qcydcbmltcG9ydCB7IGV4dHJhY3RDbGF1ZGVDb2RlSGludHMgfSBmcm9tICcuLi8uLi91dGlscy9jbGF1ZGVDb2RlSGludHMuanMnXG5pbXBvcnQgeyBpc0VudlRydXRoeSB9IGZyb20gJy4uLy4uL3V0aWxzL2VudlV0aWxzLmpzJ1xuaW1wb3J0IHtcbiAgZXJyb3JNZXNzYWdlIGFzIGdldEVycm9yTWVzc2FnZSxcbiAgU2hlbGxFcnJvcixcbn0gZnJvbSAnLi4vLi4vdXRpbHMvZXJyb3JzLmpzJ1xuaW1wb3J0IHsgdHJ1bmNhdGUgfSBmcm9tICcuLi8uLi91dGlscy9mb3JtYXQuanMnXG5pbXBvcnQgeyBsYXp5U2NoZW1hIH0gZnJvbSAnLi4vLi4vdXRpbHMvbGF6eVNjaGVtYS5qcydcbmltcG9ydCB7IGxvZ0Vycm9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvbG9nLmpzJ1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uUmVzdWx0IH0gZnJvbSAnLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvUGVybWlzc2lvblJlc3VsdC5qcydcbmltcG9ydCB7IGdldFBsYXRmb3JtIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGxhdGZvcm0uanMnXG5pbXBvcnQgeyBtYXliZVJlY29yZFBsdWdpbkhpbnQgfSBmcm9tICcuLi8uLi91dGlscy9wbHVnaW5zL2hpbnRSZWNvbW1lbmRhdGlvbi5qcydcbmltcG9ydCB7IGV4ZWMgfSBmcm9tICcuLi8uLi91dGlscy9TaGVsbC5qcydcbmltcG9ydCB0eXBlIHsgRXhlY1Jlc3VsdCB9IGZyb20gJy4uLy4uL3V0aWxzL1NoZWxsQ29tbWFuZC5qcydcbmltcG9ydCB7IFNhbmRib3hNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2FuZGJveC9zYW5kYm94LWFkYXB0ZXIuanMnXG5pbXBvcnQgeyBzZW1hbnRpY0Jvb2xlYW4gfSBmcm9tICcuLi8uLi91dGlscy9zZW1hbnRpY0Jvb2xlYW4uanMnXG5pbXBvcnQgeyBzZW1hbnRpY051bWJlciB9IGZyb20gJy4uLy4uL3V0aWxzL3NlbWFudGljTnVtYmVyLmpzJ1xuaW1wb3J0IHsgZ2V0Q2FjaGVkUG93ZXJTaGVsbFBhdGggfSBmcm9tICcuLi8uLi91dGlscy9zaGVsbC9wb3dlcnNoZWxsRGV0ZWN0aW9uLmpzJ1xuaW1wb3J0IHsgRW5kVHJ1bmNhdGluZ0FjY3VtdWxhdG9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvc3RyaW5nVXRpbHMuanMnXG5pbXBvcnQgeyBnZXRUYXNrT3V0cHV0UGF0aCB9IGZyb20gJy4uLy4uL3V0aWxzL3Rhc2svZGlza091dHB1dC5qcydcbmltcG9ydCB7IFRhc2tPdXRwdXQgfSBmcm9tICcuLi8uLi91dGlscy90YXNrL1Rhc2tPdXRwdXQuanMnXG5pbXBvcnQgeyBpc091dHB1dExpbmVUcnVuY2F0ZWQgfSBmcm9tICcuLi8uLi91dGlscy90ZXJtaW5hbC5qcydcbmltcG9ydCB7XG4gIGJ1aWxkTGFyZ2VUb29sUmVzdWx0TWVzc2FnZSxcbiAgZW5zdXJlVG9vbFJlc3VsdHNEaXIsXG4gIGdlbmVyYXRlUHJldmlldyxcbiAgZ2V0VG9vbFJlc3VsdFBhdGgsXG4gIFBSRVZJRVdfU0laRV9CWVRFUyxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvdG9vbFJlc3VsdFN0b3JhZ2UuanMnXG5pbXBvcnQgeyBzaG91bGRVc2VTYW5kYm94IH0gZnJvbSAnLi4vQmFzaFRvb2wvc2hvdWxkVXNlU2FuZGJveC5qcydcbmltcG9ydCB7IEJhY2tncm91bmRIaW50IH0gZnJvbSAnLi4vQmFzaFRvb2wvVUkuanMnXG5pbXBvcnQge1xuICBidWlsZEltYWdlVG9vbFJlc3VsdCxcbiAgaXNJbWFnZU91dHB1dCxcbiAgcmVzZXRDd2RJZk91dHNpZGVQcm9qZWN0LFxuICByZXNpemVTaGVsbEltYWdlT3V0cHV0LFxuICBzdGRFcnJBcHBlbmRTaGVsbFJlc2V0TWVzc2FnZSxcbiAgc3RyaXBFbXB0eUxpbmVzLFxufSBmcm9tICcuLi9CYXNoVG9vbC91dGlscy5qcydcbmltcG9ydCB7IHRyYWNrR2l0T3BlcmF0aW9ucyB9IGZyb20gJy4uL3NoYXJlZC9naXRPcGVyYXRpb25UcmFja2luZy5qcydcbmltcG9ydCB7IGludGVycHJldENvbW1hbmRSZXN1bHQgfSBmcm9tICcuL2NvbW1hbmRTZW1hbnRpY3MuanMnXG5pbXBvcnQgeyBwb3dlcnNoZWxsVG9vbEhhc1Blcm1pc3Npb24gfSBmcm9tICcuL3Bvd2Vyc2hlbGxQZXJtaXNzaW9ucy5qcydcbmltcG9ydCB7IGdldERlZmF1bHRUaW1lb3V0TXMsIGdldE1heFRpbWVvdXRNcywgZ2V0UHJvbXB0IH0gZnJvbSAnLi9wcm9tcHQuanMnXG5pbXBvcnQge1xuICBoYXNTeW5jU2VjdXJpdHlDb25jZXJucyxcbiAgaXNSZWFkT25seUNvbW1hbmQsXG4gIHJlc29sdmVUb0Nhbm9uaWNhbCxcbn0gZnJvbSAnLi9yZWFkT25seVZhbGlkYXRpb24uanMnXG5pbXBvcnQgeyBQT1dFUlNIRUxMX1RPT0xfTkFNRSB9IGZyb20gJy4vdG9vbE5hbWUuanMnXG5pbXBvcnQge1xuICByZW5kZXJUb29sUmVzdWx0TWVzc2FnZSxcbiAgcmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZSxcbiAgcmVuZGVyVG9vbFVzZU1lc3NhZ2UsXG4gIHJlbmRlclRvb2xVc2VQcm9ncmVzc01lc3NhZ2UsXG4gIHJlbmRlclRvb2xVc2VRdWV1ZWRNZXNzYWdlLFxufSBmcm9tICcuL1VJLmpzJ1xuXG4vLyBOZXZlciB1c2Ugb3MuRU9MIGZvciB0ZXJtaW5hbCBvdXRwdXQg4oCUIFxcclxcbiBvbiBXaW5kb3dzIGJyZWFrcyBJbmsgcmVuZGVyaW5nXG5jb25zdCBFT0wgPSAnXFxuJ1xuXG4vKipcbiAqIFBvd2VyU2hlbGwgc2VhcmNoIGNvbW1hbmRzIChncmVwIGVxdWl2YWxlbnRzKSBmb3IgY29sbGFwc2libGUgZGlzcGxheS5cbiAqIFN0b3JlZCBhcyBjYW5vbmljYWwgKGxvd2VyY2FzZSkgY21kbGV0IG5hbWVzLlxuICovXG5jb25zdCBQU19TRUFSQ0hfQ09NTUFORFMgPSBuZXcgU2V0KFtcbiAgJ3NlbGVjdC1zdHJpbmcnLCAvLyBncmVwIGVxdWl2YWxlbnRcbiAgJ2dldC1jaGlsZGl0ZW0nLCAvLyBmaW5kIGVxdWl2YWxlbnQgKHdpdGggLVJlY3Vyc2UpXG4gICdmaW5kc3RyJywgLy8gbmF0aXZlIFdpbmRvd3Mgc2VhcmNoXG4gICd3aGVyZS5leGUnLCAvLyBuYXRpdmUgV2luZG93cyB3aGljaFxuXSlcblxuLyoqXG4gKiBQb3dlclNoZWxsIHJlYWQvdmlldyBjb21tYW5kcyBmb3IgY29sbGFwc2libGUgZGlzcGxheS5cbiAqIFN0b3JlZCBhcyBjYW5vbmljYWwgKGxvd2VyY2FzZSkgY21kbGV0IG5hbWVzLlxuICovXG5jb25zdCBQU19SRUFEX0NPTU1BTkRTID0gbmV3IFNldChbXG4gICdnZXQtY29udGVudCcsIC8vIGNhdCBlcXVpdmFsZW50XG4gICdnZXQtaXRlbScsIC8vIGZpbGUgaW5mb1xuICAndGVzdC1wYXRoJywgLy8gdGVzdCAtZSBlcXVpdmFsZW50XG4gICdyZXNvbHZlLXBhdGgnLCAvLyByZWFscGF0aCBlcXVpdmFsZW50XG4gICdnZXQtcHJvY2VzcycsIC8vIHBzIGVxdWl2YWxlbnRcbiAgJ2dldC1zZXJ2aWNlJywgLy8gc3lzdGVtIGluZm9cbiAgJ2dldC1jaGlsZGl0ZW0nLCAvLyBscy9kaXIgZXF1aXZhbGVudCAoYWxzbyBzZWFyY2ggd2hlbiByZWN1cnNpdmUpXG4gICdnZXQtbG9jYXRpb24nLCAvLyBwd2QgZXF1aXZhbGVudFxuICAnZ2V0LWZpbGVoYXNoJywgLy8gY2hlY2tzdW1cbiAgJ2dldC1hY2wnLCAvLyBwZXJtaXNzaW9ucyBpbmZvXG4gICdmb3JtYXQtaGV4JywgLy8gaGV4ZHVtcCBlcXVpdmFsZW50XG5dKVxuXG4vKipcbiAqIFBvd2VyU2hlbGwgc2VtYW50aWMtbmV1dHJhbCBjb21tYW5kcyB0aGF0IGRvbid0IGNoYW5nZSB0aGUgc2VhcmNoL3JlYWQgbmF0dXJlLlxuICovXG5jb25zdCBQU19TRU1BTlRJQ19ORVVUUkFMX0NPTU1BTkRTID0gbmV3IFNldChbXG4gICd3cml0ZS1vdXRwdXQnLCAvLyBlY2hvIGVxdWl2YWxlbnRcbiAgJ3dyaXRlLWhvc3QnLFxuXSlcblxuLyoqXG4gKiBDaGVja3MgaWYgYSBQb3dlclNoZWxsIGNvbW1hbmQgaXMgYSBzZWFyY2ggb3IgcmVhZCBvcGVyYXRpb24uXG4gKiBVc2VkIHRvIGRldGVybWluZSBpZiB0aGUgY29tbWFuZCBzaG91bGQgYmUgY29sbGFwc2VkIGluIHRoZSBVSS5cbiAqL1xuZnVuY3Rpb24gaXNTZWFyY2hPclJlYWRQb3dlclNoZWxsQ29tbWFuZChjb21tYW5kOiBzdHJpbmcpOiB7XG4gIGlzU2VhcmNoOiBib29sZWFuXG4gIGlzUmVhZDogYm9vbGVhblxufSB7XG4gIGNvbnN0IHRyaW1tZWQgPSBjb21tYW5kLnRyaW0oKVxuICBpZiAoIXRyaW1tZWQpIHtcbiAgICByZXR1cm4geyBpc1NlYXJjaDogZmFsc2UsIGlzUmVhZDogZmFsc2UgfVxuICB9XG5cbiAgLy8gU2ltcGxlIHNwbGl0IG9uIHN0YXRlbWVudCBzZXBhcmF0b3JzIGFuZCBwaXBlIG9wZXJhdG9yc1xuICAvLyBUaGlzIGlzIGEgc3luYyBmdW5jdGlvbiBzbyB3ZSB1c2UgYSBsaWdodHdlaWdodCBhcHByb2FjaFxuICBjb25zdCBwYXJ0cyA9IHRyaW1tZWQuc3BsaXQoL1xccypbO3xdXFxzKi8pLmZpbHRlcihCb29sZWFuKVxuXG4gIGlmIChwYXJ0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyBpc1NlYXJjaDogZmFsc2UsIGlzUmVhZDogZmFsc2UgfVxuICB9XG5cbiAgbGV0IGhhc1NlYXJjaCA9IGZhbHNlXG4gIGxldCBoYXNSZWFkID0gZmFsc2VcbiAgbGV0IGhhc05vbk5ldXRyYWxDb21tYW5kID0gZmFsc2VcblxuICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICBjb25zdCBiYXNlQ29tbWFuZCA9IHBhcnQudHJpbSgpLnNwbGl0KC9cXHMrLylbMF1cbiAgICBpZiAoIWJhc2VDb21tYW5kKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGNvbnN0IGNhbm9uaWNhbCA9IHJlc29sdmVUb0Nhbm9uaWNhbChiYXNlQ29tbWFuZClcblxuICAgIGlmIChQU19TRU1BTlRJQ19ORVVUUkFMX0NPTU1BTkRTLmhhcyhjYW5vbmljYWwpKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGhhc05vbk5ldXRyYWxDb21tYW5kID0gdHJ1ZVxuXG4gICAgY29uc3QgaXNQYXJ0U2VhcmNoID0gUFNfU0VBUkNIX0NPTU1BTkRTLmhhcyhjYW5vbmljYWwpXG4gICAgY29uc3QgaXNQYXJ0UmVhZCA9IFBTX1JFQURfQ09NTUFORFMuaGFzKGNhbm9uaWNhbClcblxuICAgIGlmICghaXNQYXJ0U2VhcmNoICYmICFpc1BhcnRSZWFkKSB7XG4gICAgICByZXR1cm4geyBpc1NlYXJjaDogZmFsc2UsIGlzUmVhZDogZmFsc2UgfVxuICAgIH1cblxuICAgIGlmIChpc1BhcnRTZWFyY2gpIGhhc1NlYXJjaCA9IHRydWVcbiAgICBpZiAoaXNQYXJ0UmVhZCkgaGFzUmVhZCA9IHRydWVcbiAgfVxuXG4gIGlmICghaGFzTm9uTmV1dHJhbENvbW1hbmQpIHtcbiAgICByZXR1cm4geyBpc1NlYXJjaDogZmFsc2UsIGlzUmVhZDogZmFsc2UgfVxuICB9XG5cbiAgcmV0dXJuIHsgaXNTZWFyY2g6IGhhc1NlYXJjaCwgaXNSZWFkOiBoYXNSZWFkIH1cbn1cblxuLy8gUHJvZ3Jlc3MgZGlzcGxheSBjb25zdGFudHNcbmNvbnN0IFBST0dSRVNTX1RIUkVTSE9MRF9NUyA9IDIwMDBcbmNvbnN0IFBST0dSRVNTX0lOVEVSVkFMX01TID0gMTAwMFxuLy8gSW4gYXNzaXN0YW50IG1vZGUsIGJsb2NraW5nIGNvbW1hbmRzIGF1dG8tYmFja2dyb3VuZCBhZnRlciB0aGlzIG1hbnkgbXMgaW4gdGhlIG1haW4gYWdlbnRcbmNvbnN0IEFTU0lTVEFOVF9CTE9DS0lOR19CVURHRVRfTVMgPSAxNV8wMDBcblxuLy8gQ29tbWFuZHMgdGhhdCBzaG91bGQgbm90IGJlIGF1dG8tYmFja2dyb3VuZGVkIChjYW5vbmljYWwgbG93ZXJjYXNlKS5cbi8vICdzbGVlcCcgaXMgYSBQUyBidWlsdC1pbiBhbGlhcyBmb3IgU3RhcnQtU2xlZXAgYnV0IG5vdCBpbiBDT01NT05fQUxJQVNFUyxcbi8vIHNvIGxpc3QgYm90aCBmb3Jtcy5cbmNvbnN0IERJU0FMTE9XRURfQVVUT19CQUNLR1JPVU5EX0NPTU1BTkRTID0gW1xuICAnc3RhcnQtc2xlZXAnLCAvLyBTdGFydC1TbGVlcCBzaG91bGQgcnVuIGluIGZvcmVncm91bmQgdW5sZXNzIGV4cGxpY2l0bHkgYmFja2dyb3VuZGVkXG4gICdzbGVlcCcsXG5dXG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgY29tbWFuZCBpcyBhbGxvd2VkIHRvIGJlIGF1dG9tYXRpY2FsbHkgYmFja2dyb3VuZGVkXG4gKiBAcGFyYW0gY29tbWFuZCBUaGUgY29tbWFuZCB0byBjaGVja1xuICogQHJldHVybnMgZmFsc2UgZm9yIGNvbW1hbmRzIHRoYXQgc2hvdWxkIG5vdCBiZSBhdXRvLWJhY2tncm91bmRlZCAobGlrZSBTdGFydC1TbGVlcClcbiAqL1xuZnVuY3Rpb24gaXNBdXRvYmFja2dyb3VuZGluZ0FsbG93ZWQoY29tbWFuZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGZpcnN0V29yZCA9IGNvbW1hbmQudHJpbSgpLnNwbGl0KC9cXHMrLylbMF1cbiAgaWYgKCFmaXJzdFdvcmQpIHJldHVybiB0cnVlXG4gIGNvbnN0IGNhbm9uaWNhbCA9IHJlc29sdmVUb0Nhbm9uaWNhbChmaXJzdFdvcmQpXG4gIHJldHVybiAhRElTQUxMT1dFRF9BVVRPX0JBQ0tHUk9VTkRfQ09NTUFORFMuaW5jbHVkZXMoY2Fub25pY2FsKVxufVxuXG4vKipcbiAqIFBTLWZsYXZvcmVkIHBvcnQgb2YgQmFzaFRvb2wncyBkZXRlY3RCbG9ja2VkU2xlZXBQYXR0ZXJuLlxuICogQ2F0Y2hlcyBgU3RhcnQtU2xlZXAgTmAsIGBTdGFydC1TbGVlcCAtU2Vjb25kcyBOYCwgYHNsZWVwIE5gIChidWlsdC1pbiBhbGlhcylcbiAqIGFzIHRoZSBmaXJzdCBzdGF0ZW1lbnQuIERvZXMgTk9UIGJsb2NrIGBTdGFydC1TbGVlcCAtTWlsbGlzZWNvbmRzYCAoc3ViLXNlY29uZFxuICogcGFjaW5nIGlzIGZpbmUpIG9yIGZsb2F0IHNlY29uZHMgKGxlZ2l0IHJhdGUgbGltaXRpbmcpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0QmxvY2tlZFNsZWVwUGF0dGVybihjb21tYW5kOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gRmlyc3Qgc3RhdGVtZW50IG9ubHkg4oCUIHNwbGl0IG9uIFBTIHN0YXRlbWVudCBzZXBhcmF0b3JzOiBgO2AsIGB8YCxcbiAgLy8gYCZgL2AmJmAvYHx8YCAocHdzaCA3KyksIGFuZCBuZXdsaW5lIChQUydzIHByaW1hcnkgc2VwYXJhdG9yKS4gVGhpcyBpc1xuICAvLyBpbnRlbnRpb25hbGx5IHNoYWxsb3cg4oCUIHNsZWVwIGluc2lkZSBzY3JpcHQgYmxvY2tzLCBzdWJzaGVsbHMsIG9yIGxhdGVyXG4gIC8vIHBpcGVsaW5lIHN0YWdlcyBpcyBmaW5lLiBNYXRjaGVzIEJhc2hUb29sJ3Mgc3BsaXRDb21tYW5kV2l0aE9wZXJhdG9yc1xuICAvLyBpbnRlbnQgKHNyYy91dGlscy9iYXNoL2NvbW1hbmRzLnRzKSB3aXRob3V0IGEgZnVsbCBQUyBwYXJzZXIuXG4gIGNvbnN0IGZpcnN0ID1cbiAgICBjb21tYW5kXG4gICAgICAudHJpbSgpXG4gICAgICAuc3BsaXQoL1s7fCZcXHJcXG5dLylbMF1cbiAgICAgID8udHJpbSgpID8/ICcnXG4gIC8vIE1hdGNoOiBTdGFydC1TbGVlcCBOLCBTdGFydC1TbGVlcCAtU2Vjb25kcyBOLCBTdGFydC1TbGVlcCAtcyBOLCBzbGVlcCBOXG4gIC8vIChjYXNlLWluc2Vuc2l0aXZlOyAtU2Vjb25kcyBjYW4gYmUgYWJicmV2aWF0ZWQgdG8gLXMgcGVyIFBTIGNvbnZlbnRpb24pXG4gIGNvbnN0IG0gPSAvXig/OnN0YXJ0LXNsZWVwfHNsZWVwKSg/Olxccystcyg/OmVjb25kcyk/KT9cXHMrKFxcZCspXFxzKiQvaS5leGVjKFxuICAgIGZpcnN0LFxuICApXG4gIGlmICghbSkgcmV0dXJuIG51bGxcbiAgY29uc3Qgc2VjcyA9IHBhcnNlSW50KG1bMV0hLCAxMClcbiAgaWYgKHNlY3MgPCAyKSByZXR1cm4gbnVsbCAvLyBzdWItMnMgc2xlZXBzIGFyZSBmaW5lIChyYXRlIGxpbWl0aW5nLCBwYWNpbmcpXG5cbiAgY29uc3QgcmVzdCA9IGNvbW1hbmRcbiAgICAudHJpbSgpXG4gICAgLnNsaWNlKGZpcnN0Lmxlbmd0aClcbiAgICAucmVwbGFjZSgvXltcXHM7fCZdKy8sICcnKVxuICByZXR1cm4gcmVzdFxuICAgID8gYFN0YXJ0LVNsZWVwICR7c2Vjc30gZm9sbG93ZWQgYnk6ICR7cmVzdH1gXG4gICAgOiBgc3RhbmRhbG9uZSBTdGFydC1TbGVlcCAke3NlY3N9YFxufVxuXG4vKipcbiAqIE9uIFdpbmRvd3MgbmF0aXZlLCBzYW5kYm94IGlzIHVuYXZhaWxhYmxlIChid3JhcC9zYW5kYm94LWV4ZWMgYXJlXG4gKiBQT1NJWC1vbmx5KS4gSWYgZW50ZXJwcmlzZSBwb2xpY3kgaGFzIHNhbmRib3guZW5hYmxlZCBBTkQgZm9yYmlkc1xuICogdW5zYW5kYm94ZWQgY29tbWFuZHMsIFBvd2VyU2hlbGwgY2Fubm90IGNvbXBseSDigJQgcmVmdXNlIGV4ZWN1dGlvblxuICogcmF0aGVyIHRoYW4gc2lsZW50bHkgYnlwYXNzIHRoZSBwb2xpY3kuIE9uIExpbnV4L21hY09TL1dTTDIsIHB3c2hcbiAqIHJ1bnMgYXMgYSBuYXRpdmUgYmluYXJ5IHVuZGVyIHRoZSBzYW5kYm94IHNhbWUgYXMgYmFzaCwgc28gdGhpc1xuICogZ2F0ZSBkb2VzIG5vdCBhcHBseS5cbiAqXG4gKiBDaGVja2VkIGluIEJPVEggdmFsaWRhdGVJbnB1dCAoY2xlYW4gdG9vbC1ydW5uZXIgZXJyb3IpIGFuZCBjYWxsKClcbiAqIChjb3ZlcnMgZGlyZWN0IGNhbGxlcnMgbGlrZSBwcm9tcHRTaGVsbEV4ZWN1dGlvbi50cyB0aGF0IHNraXBcbiAqIHZhbGlkYXRlSW5wdXQpLiBUaGUgY2FsbCgpIGd1YXJkIGlzIHRoZSBsb2FkLWJlYXJpbmcgb25lLlxuICovXG5jb25zdCBXSU5ET1dTX1NBTkRCT1hfUE9MSUNZX1JFRlVTQUwgPVxuICAnRW50ZXJwcmlzZSBwb2xpY3kgcmVxdWlyZXMgc2FuZGJveGluZywgYnV0IHNhbmRib3hpbmcgaXMgbm90IGF2YWlsYWJsZSBvbiBuYXRpdmUgV2luZG93cy4gU2hlbGwgY29tbWFuZCBleGVjdXRpb24gaXMgYmxvY2tlZCBvbiB0aGlzIHBsYXRmb3JtIGJ5IHBvbGljeS4nXG5mdW5jdGlvbiBpc1dpbmRvd3NTYW5kYm94UG9saWN5VmlvbGF0aW9uKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGdldFBsYXRmb3JtKCkgPT09ICd3aW5kb3dzJyAmJlxuICAgIFNhbmRib3hNYW5hZ2VyLmlzU2FuZGJveEVuYWJsZWRJblNldHRpbmdzKCkgJiZcbiAgICAhU2FuZGJveE1hbmFnZXIuYXJlVW5zYW5kYm94ZWRDb21tYW5kc0FsbG93ZWQoKVxuICApXG59XG5cbi8vIENoZWNrIGlmIGJhY2tncm91bmQgdGFza3MgYXJlIGRpc2FibGVkIGF0IG1vZHVsZSBsb2FkIHRpbWVcbmNvbnN0IGlzQmFja2dyb3VuZFRhc2tzRGlzYWJsZWQgPVxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY3VzdG9tLXJ1bGVzL25vLXByb2Nlc3MtZW52LXRvcC1sZXZlbCAtLSBJbnRlbnRpb25hbDogc2NoZW1hIG11c3QgYmUgZGVmaW5lZCBhdCBtb2R1bGUgbG9hZFxuICBpc0VudlRydXRoeShwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9ESVNBQkxFX0JBQ0tHUk9VTkRfVEFTS1MpXG5cbmNvbnN0IGZ1bGxJbnB1dFNjaGVtYSA9IGxhenlTY2hlbWEoKCkgPT5cbiAgei5zdHJpY3RPYmplY3Qoe1xuICAgIGNvbW1hbmQ6IHouc3RyaW5nKCkuZGVzY3JpYmUoJ1RoZSBQb3dlclNoZWxsIGNvbW1hbmQgdG8gZXhlY3V0ZScpLFxuICAgIHRpbWVvdXQ6IHNlbWFudGljTnVtYmVyKHoubnVtYmVyKCkub3B0aW9uYWwoKSkuZGVzY3JpYmUoXG4gICAgICBgT3B0aW9uYWwgdGltZW91dCBpbiBtaWxsaXNlY29uZHMgKG1heCAke2dldE1heFRpbWVvdXRNcygpfSlgLFxuICAgICksXG4gICAgZGVzY3JpcHRpb246IHpcbiAgICAgIC5zdHJpbmcoKVxuICAgICAgLm9wdGlvbmFsKClcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgJ0NsZWFyLCBjb25jaXNlIGRlc2NyaXB0aW9uIG9mIHdoYXQgdGhpcyBjb21tYW5kIGRvZXMgaW4gYWN0aXZlIHZvaWNlLicsXG4gICAgICApLFxuICAgIHJ1bl9pbl9iYWNrZ3JvdW5kOiBzZW1hbnRpY0Jvb2xlYW4oei5ib29sZWFuKCkub3B0aW9uYWwoKSkuZGVzY3JpYmUoXG4gICAgICBgU2V0IHRvIHRydWUgdG8gcnVuIHRoaXMgY29tbWFuZCBpbiB0aGUgYmFja2dyb3VuZC4gVXNlIFJlYWQgdG8gcmVhZCB0aGUgb3V0cHV0IGxhdGVyLmAsXG4gICAgKSxcbiAgICBkYW5nZXJvdXNseURpc2FibGVTYW5kYm94OiBzZW1hbnRpY0Jvb2xlYW4oei5ib29sZWFuKCkub3B0aW9uYWwoKSkuZGVzY3JpYmUoXG4gICAgICAnU2V0IHRoaXMgdG8gdHJ1ZSB0byBkYW5nZXJvdXNseSBvdmVycmlkZSBzYW5kYm94IG1vZGUgYW5kIHJ1biBjb21tYW5kcyB3aXRob3V0IHNhbmRib3hpbmcuJyxcbiAgICApLFxuICB9KSxcbilcblxuLy8gQ29uZGl0aW9uYWxseSByZW1vdmUgcnVuX2luX2JhY2tncm91bmQgZnJvbSBzY2hlbWEgd2hlbiBiYWNrZ3JvdW5kIHRhc2tzIGFyZSBkaXNhYmxlZFxuY29uc3QgaW5wdXRTY2hlbWEgPSBsYXp5U2NoZW1hKCgpID0+XG4gIGlzQmFja2dyb3VuZFRhc2tzRGlzYWJsZWRcbiAgICA/IGZ1bGxJbnB1dFNjaGVtYSgpLm9taXQoeyBydW5faW5fYmFja2dyb3VuZDogdHJ1ZSB9KVxuICAgIDogZnVsbElucHV0U2NoZW1hKCksXG4pXG50eXBlIElucHV0U2NoZW1hID0gUmV0dXJuVHlwZTx0eXBlb2YgaW5wdXRTY2hlbWE+XG5cbi8vIFVzZSBmdWxsSW5wdXRTY2hlbWEgZm9yIHRoZSB0eXBlIHRvIGFsd2F5cyBpbmNsdWRlIHJ1bl9pbl9iYWNrZ3JvdW5kXG4vLyAoZXZlbiB3aGVuIGl0J3Mgb21pdHRlZCBmcm9tIHRoZSBzY2hlbWEsIHRoZSBjb2RlIG5lZWRzIHRvIGhhbmRsZSBpdClcbmV4cG9ydCB0eXBlIFBvd2VyU2hlbGxUb29sSW5wdXQgPSB6LmluZmVyPFJldHVyblR5cGU8dHlwZW9mIGZ1bGxJbnB1dFNjaGVtYT4+XG5cbmNvbnN0IG91dHB1dFNjaGVtYSA9IGxhenlTY2hlbWEoKCkgPT5cbiAgei5vYmplY3Qoe1xuICAgIHN0ZG91dDogei5zdHJpbmcoKS5kZXNjcmliZSgnVGhlIHN0YW5kYXJkIG91dHB1dCBvZiB0aGUgY29tbWFuZCcpLFxuICAgIHN0ZGVycjogei5zdHJpbmcoKS5kZXNjcmliZSgnVGhlIHN0YW5kYXJkIGVycm9yIG91dHB1dCBvZiB0aGUgY29tbWFuZCcpLFxuICAgIGludGVycnVwdGVkOiB6LmJvb2xlYW4oKS5kZXNjcmliZSgnV2hldGhlciB0aGUgY29tbWFuZCB3YXMgaW50ZXJydXB0ZWQnKSxcbiAgICByZXR1cm5Db2RlSW50ZXJwcmV0YXRpb246IHpcbiAgICAgIC5zdHJpbmcoKVxuICAgICAgLm9wdGlvbmFsKClcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgJ1NlbWFudGljIGludGVycHJldGF0aW9uIGZvciBub24tZXJyb3IgZXhpdCBjb2RlcyB3aXRoIHNwZWNpYWwgbWVhbmluZycsXG4gICAgICApLFxuICAgIGlzSW1hZ2U6IHpcbiAgICAgIC5ib29sZWFuKClcbiAgICAgIC5vcHRpb25hbCgpXG4gICAgICAuZGVzY3JpYmUoJ0ZsYWcgdG8gaW5kaWNhdGUgaWYgc3Rkb3V0IGNvbnRhaW5zIGltYWdlIGRhdGEnKSxcbiAgICBwZXJzaXN0ZWRPdXRwdXRQYXRoOiB6XG4gICAgICAuc3RyaW5nKClcbiAgICAgIC5vcHRpb25hbCgpXG4gICAgICAuZGVzY3JpYmUoJ1BhdGggdG8gcGVyc2lzdGVkIGZ1bGwgb3V0cHV0IHdoZW4gdG9vIGxhcmdlIGZvciBpbmxpbmUnKSxcbiAgICBwZXJzaXN0ZWRPdXRwdXRTaXplOiB6XG4gICAgICAubnVtYmVyKClcbiAgICAgIC5vcHRpb25hbCgpXG4gICAgICAuZGVzY3JpYmUoJ1RvdGFsIG91dHB1dCBzaXplIGluIGJ5dGVzIHdoZW4gcGVyc2lzdGVkJyksXG4gICAgYmFja2dyb3VuZFRhc2tJZDogelxuICAgICAgLnN0cmluZygpXG4gICAgICAub3B0aW9uYWwoKVxuICAgICAgLmRlc2NyaWJlKFxuICAgICAgICAnSUQgb2YgdGhlIGJhY2tncm91bmQgdGFzayBpZiBjb21tYW5kIGlzIHJ1bm5pbmcgaW4gYmFja2dyb3VuZCcsXG4gICAgICApLFxuICAgIGJhY2tncm91bmRlZEJ5VXNlcjogelxuICAgICAgLmJvb2xlYW4oKVxuICAgICAgLm9wdGlvbmFsKClcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgJ1RydWUgaWYgdGhlIHVzZXIgbWFudWFsbHkgYmFja2dyb3VuZGVkIHRoZSBjb21tYW5kIHdpdGggQ3RybCtCJyxcbiAgICAgICksXG4gICAgYXNzaXN0YW50QXV0b0JhY2tncm91bmRlZDogelxuICAgICAgLmJvb2xlYW4oKVxuICAgICAgLm9wdGlvbmFsKClcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgJ1RydWUgaWYgdGhlIGNvbW1hbmQgd2FzIGF1dG8tYmFja2dyb3VuZGVkIGJ5IHRoZSBhc3Npc3RhbnQtbW9kZSBibG9ja2luZyBidWRnZXQnLFxuICAgICAgKSxcbiAgfSksXG4pXG50eXBlIE91dHB1dFNjaGVtYSA9IFJldHVyblR5cGU8dHlwZW9mIG91dHB1dFNjaGVtYT5cbmV4cG9ydCB0eXBlIE91dCA9IHouaW5mZXI8T3V0cHV0U2NoZW1hPlxuXG5pbXBvcnQgdHlwZSB7IFBvd2VyU2hlbGxQcm9ncmVzcyB9IGZyb20gJy4uLy4uL3R5cGVzL3Rvb2xzLmpzJ1xuXG5leHBvcnQgdHlwZSB7IFBvd2VyU2hlbGxQcm9ncmVzcyB9IGZyb20gJy4uLy4uL3R5cGVzL3Rvb2xzLmpzJ1xuXG5jb25zdCBDT01NT05fQkFDS0dST1VORF9DT01NQU5EUyA9IFtcbiAgJ25wbScsXG4gICd5YXJuJyxcbiAgJ3BucG0nLFxuICAnbm9kZScsXG4gICdweXRob24nLFxuICAncHl0aG9uMycsXG4gICdnbycsXG4gICdjYXJnbycsXG4gICdtYWtlJyxcbiAgJ2RvY2tlcicsXG4gICd0ZXJyYWZvcm0nLFxuICAnd2VicGFjaycsXG4gICd2aXRlJyxcbiAgJ2plc3QnLFxuICAncHl0ZXN0JyxcbiAgJ2N1cmwnLFxuICAnSW52b2tlLVdlYlJlcXVlc3QnLFxuICAnYnVpbGQnLFxuICAndGVzdCcsXG4gICdzZXJ2ZScsXG4gICd3YXRjaCcsXG4gICdkZXYnLFxuXSBhcyBjb25zdFxuXG5mdW5jdGlvbiBnZXRDb21tYW5kVHlwZUZvckxvZ2dpbmcoXG4gIGNvbW1hbmQ6IHN0cmluZyxcbik6IEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMge1xuICBjb25zdCB0cmltbWVkID0gY29tbWFuZC50cmltKClcbiAgY29uc3QgZmlyc3RXb3JkID0gdHJpbW1lZC5zcGxpdCgvXFxzKy8pWzBdIHx8ICcnXG5cbiAgZm9yIChjb25zdCBjbWQgb2YgQ09NTU9OX0JBQ0tHUk9VTkRfQ09NTUFORFMpIHtcbiAgICBpZiAoZmlyc3RXb3JkLnRvTG93ZXJDYXNlKCkgPT09IGNtZC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICByZXR1cm4gY21kIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFNcbiAgICB9XG4gIH1cblxuICByZXR1cm4gJ290aGVyJyBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTXG59XG5cbmV4cG9ydCBjb25zdCBQb3dlclNoZWxsVG9vbCA9IGJ1aWxkVG9vbCh7XG4gIG5hbWU6IFBPV0VSU0hFTExfVE9PTF9OQU1FLFxuICBzZWFyY2hIaW50OiAnZXhlY3V0ZSBXaW5kb3dzIFBvd2VyU2hlbGwgY29tbWFuZHMnLFxuICBtYXhSZXN1bHRTaXplQ2hhcnM6IDMwXzAwMCxcbiAgc3RyaWN0OiB0cnVlLFxuXG4gIGFzeW5jIGRlc2NyaXB0aW9uKHtcbiAgICBkZXNjcmlwdGlvbixcbiAgfTogUGFydGlhbDxQb3dlclNoZWxsVG9vbElucHV0Pik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uIHx8ICdSdW4gUG93ZXJTaGVsbCBjb21tYW5kJ1xuICB9LFxuXG4gIGFzeW5jIHByb21wdCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBnZXRQcm9tcHQoKVxuICB9LFxuXG4gIGlzQ29uY3VycmVuY3lTYWZlKGlucHV0OiBQb3dlclNoZWxsVG9vbElucHV0KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNSZWFkT25seT8uKGlucHV0KSA/PyBmYWxzZVxuICB9LFxuXG4gIGlzU2VhcmNoT3JSZWFkQ29tbWFuZChpbnB1dDogUGFydGlhbDxQb3dlclNoZWxsVG9vbElucHV0Pik6IHtcbiAgICBpc1NlYXJjaDogYm9vbGVhblxuICAgIGlzUmVhZDogYm9vbGVhblxuICB9IHtcbiAgICBpZiAoIWlucHV0LmNvbW1hbmQpIHtcbiAgICAgIHJldHVybiB7IGlzU2VhcmNoOiBmYWxzZSwgaXNSZWFkOiBmYWxzZSB9XG4gICAgfVxuICAgIHJldHVybiBpc1NlYXJjaE9yUmVhZFBvd2VyU2hlbGxDb21tYW5kKGlucHV0LmNvbW1hbmQpXG4gIH0sXG5cbiAgaXNSZWFkT25seShpbnB1dDogUG93ZXJTaGVsbFRvb2xJbnB1dCk6IGJvb2xlYW4ge1xuICAgIC8vIENoZWNrIHN5bmMgc2VjdXJpdHkgaGV1cmlzdGljcyBiZWZvcmUgZGVjbGFyaW5nIHJlYWQtb25seS5cbiAgICAvLyBUaGUgZnVsbCBBU1QgcGFyc2UgaXMgYXN5bmMgYW5kIHVuYXZhaWxhYmxlIGhlcmUsIHNvIHdlIHVzZVxuICAgIC8vIHJlZ2V4LWJhc2VkIGRldGVjdGlvbiBvZiBzdWJleHByZXNzaW9ucywgc3BsYXR0aW5nLCBtZW1iZXJcbiAgICAvLyBpbnZvY2F0aW9ucywgYW5kIGFzc2lnbm1lbnRzIOKAlCBtYXRjaGluZyBCYXNoVG9vbCdzIHBhdHRlcm4gb2ZcbiAgICAvLyBjaGVja2luZyBzZWN1cml0eSBjb25jZXJucyBiZWZvcmUgY21kbGV0IGFsbG93bGlzdCBldmFsdWF0aW9uLlxuICAgIGlmIChoYXNTeW5jU2VjdXJpdHlDb25jZXJucyhpbnB1dC5jb21tYW5kKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIC8vIE5PVEU6IFRoaXMgY2FsbHMgaXNSZWFkT25seUNvbW1hbmQgd2l0aG91dCB0aGUgcGFyc2VkIEFTVC4gV2l0aG91dCB0aGVcbiAgICAvLyBBU1QsIGlzUmVhZE9ubHlDb21tYW5kIGNhbm5vdCBzcGxpdCBwaXBlbGluZXMvc3RhdGVtZW50cyBhbmQgd2lsbCByZXR1cm5cbiAgICAvLyBmYWxzZSBmb3IgYW55dGhpbmcgYnV0IHRoZSBzaW1wbGVzdCBzaW5nbGUtdG9rZW4gY29tbWFuZHMuIFRoaXMgaXMgYVxuICAgIC8vIGtub3duIGxpbWl0YXRpb24gb2YgdGhlIHN5bmMgVG9vbC5pc1JlYWRPbmx5KCkgaW50ZXJmYWNlIOKAlCB0aGUgcmVhbFxuICAgIC8vIHJlYWQtb25seSBhdXRvLWFsbG93IGhhcHBlbnMgYXN5bmMgaW4gcG93ZXJzaGVsbFRvb2xIYXNQZXJtaXNzaW9uIChzdGVwXG4gICAgLy8gNC41KSB3aGVyZSB0aGUgcGFyc2VkIEFTVCBpcyBhdmFpbGFibGUuXG4gICAgcmV0dXJuIGlzUmVhZE9ubHlDb21tYW5kKGlucHV0LmNvbW1hbmQpXG4gIH0sXG4gIHRvQXV0b0NsYXNzaWZpZXJJbnB1dChpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dC5jb21tYW5kXG4gIH0sXG5cbiAgZ2V0IGlucHV0U2NoZW1hKCk6IElucHV0U2NoZW1hIHtcbiAgICByZXR1cm4gaW5wdXRTY2hlbWEoKVxuICB9LFxuXG4gIGdldCBvdXRwdXRTY2hlbWEoKTogT3V0cHV0U2NoZW1hIHtcbiAgICByZXR1cm4gb3V0cHV0U2NoZW1hKClcbiAgfSxcblxuICB1c2VyRmFjaW5nTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnUG93ZXJTaGVsbCdcbiAgfSxcblxuICBnZXRUb29sVXNlU3VtbWFyeShcbiAgICBpbnB1dDogUGFydGlhbDxQb3dlclNoZWxsVG9vbElucHV0PiB8IHVuZGVmaW5lZCxcbiAgKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKCFpbnB1dD8uY29tbWFuZCkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgY29uc3QgeyBjb21tYW5kLCBkZXNjcmlwdGlvbiB9ID0gaW5wdXRcbiAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybiBkZXNjcmlwdGlvblxuICAgIH1cbiAgICByZXR1cm4gdHJ1bmNhdGUoY29tbWFuZCwgVE9PTF9TVU1NQVJZX01BWF9MRU5HVEgpXG4gIH0sXG5cbiAgZ2V0QWN0aXZpdHlEZXNjcmlwdGlvbihcbiAgICBpbnB1dDogUGFydGlhbDxQb3dlclNoZWxsVG9vbElucHV0PiB8IHVuZGVmaW5lZCxcbiAgKTogc3RyaW5nIHtcbiAgICBpZiAoIWlucHV0Py5jb21tYW5kKSB7XG4gICAgICByZXR1cm4gJ1J1bm5pbmcgY29tbWFuZCdcbiAgICB9XG4gICAgY29uc3QgZGVzYyA9XG4gICAgICBpbnB1dC5kZXNjcmlwdGlvbiA/PyB0cnVuY2F0ZShpbnB1dC5jb21tYW5kLCBUT09MX1NVTU1BUllfTUFYX0xFTkdUSClcbiAgICByZXR1cm4gYFJ1bm5pbmcgJHtkZXNjfWBcbiAgfSxcblxuICBpc0VuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICBhc3luYyB2YWxpZGF0ZUlucHV0KGlucHV0OiBQb3dlclNoZWxsVG9vbElucHV0KTogUHJvbWlzZTxWYWxpZGF0aW9uUmVzdWx0PiB7XG4gICAgLy8gRGVmZW5zZS1pbi1kZXB0aDogYWxzbyBndWFyZGVkIGluIGNhbGwoKSBmb3IgZGlyZWN0IGNhbGxlcnMuXG4gICAgaWYgKGlzV2luZG93c1NhbmRib3hQb2xpY3lWaW9sYXRpb24oKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdWx0OiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogV0lORE9XU19TQU5EQk9YX1BPTElDWV9SRUZVU0FMLFxuICAgICAgICBlcnJvckNvZGU6IDExLFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoXG4gICAgICBmZWF0dXJlKCdNT05JVE9SX1RPT0wnKSAmJlxuICAgICAgIWlzQmFja2dyb3VuZFRhc2tzRGlzYWJsZWQgJiZcbiAgICAgICFpbnB1dC5ydW5faW5fYmFja2dyb3VuZFxuICAgICkge1xuICAgICAgY29uc3Qgc2xlZXBQYXR0ZXJuID0gZGV0ZWN0QmxvY2tlZFNsZWVwUGF0dGVybihpbnB1dC5jb21tYW5kKVxuICAgICAgaWYgKHNsZWVwUGF0dGVybiAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogYEJsb2NrZWQ6ICR7c2xlZXBQYXR0ZXJufS4gUnVuIGJsb2NraW5nIGNvbW1hbmRzIGluIHRoZSBiYWNrZ3JvdW5kIHdpdGggcnVuX2luX2JhY2tncm91bmQ6IHRydWUg4oCUIHlvdSdsbCBnZXQgYSBjb21wbGV0aW9uIG5vdGlmaWNhdGlvbiB3aGVuIGRvbmUuIEZvciBzdHJlYW1pbmcgZXZlbnRzICh3YXRjaGluZyBsb2dzLCBwb2xsaW5nIEFQSXMpLCB1c2UgdGhlIE1vbml0b3IgdG9vbC4gSWYgeW91IGdlbnVpbmVseSBuZWVkIGEgZGVsYXkgKHJhdGUgbGltaXRpbmcsIGRlbGliZXJhdGUgcGFjaW5nKSwga2VlcCBpdCB1bmRlciAyIHNlY29uZHMuYCxcbiAgICAgICAgICBlcnJvckNvZGU6IDEwLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHJlc3VsdDogdHJ1ZSB9XG4gIH0sXG5cbiAgYXN5bmMgY2hlY2tQZXJtaXNzaW9ucyhcbiAgICBpbnB1dDogUG93ZXJTaGVsbFRvb2xJbnB1dCxcbiAgICBjb250ZXh0OiBQYXJhbWV0ZXJzPFRvb2xbJ2NoZWNrUGVybWlzc2lvbnMnXT5bMV0sXG4gICk6IFByb21pc2U8UGVybWlzc2lvblJlc3VsdD4ge1xuICAgIHJldHVybiBhd2FpdCBwb3dlcnNoZWxsVG9vbEhhc1Blcm1pc3Npb24oaW5wdXQsIGNvbnRleHQpXG4gIH0sXG5cbiAgcmVuZGVyVG9vbFVzZU1lc3NhZ2UsXG4gIHJlbmRlclRvb2xVc2VQcm9ncmVzc01lc3NhZ2UsXG4gIHJlbmRlclRvb2xVc2VRdWV1ZWRNZXNzYWdlLFxuICByZW5kZXJUb29sUmVzdWx0TWVzc2FnZSxcbiAgcmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZSxcblxuICBtYXBUb29sUmVzdWx0VG9Ub29sUmVzdWx0QmxvY2tQYXJhbShcbiAgICB7XG4gICAgICBpbnRlcnJ1cHRlZCxcbiAgICAgIHN0ZG91dCxcbiAgICAgIHN0ZGVycixcbiAgICAgIGlzSW1hZ2UsXG4gICAgICBwZXJzaXN0ZWRPdXRwdXRQYXRoLFxuICAgICAgcGVyc2lzdGVkT3V0cHV0U2l6ZSxcbiAgICAgIGJhY2tncm91bmRUYXNrSWQsXG4gICAgICBiYWNrZ3JvdW5kZWRCeVVzZXIsXG4gICAgICBhc3Npc3RhbnRBdXRvQmFja2dyb3VuZGVkLFxuICAgIH06IE91dCxcbiAgICB0b29sVXNlSUQ6IHN0cmluZyxcbiAgKTogVG9vbFJlc3VsdEJsb2NrUGFyYW0ge1xuICAgIC8vIEZvciBpbWFnZSBkYXRhLCBmb3JtYXQgYXMgaW1hZ2UgY29udGVudCBibG9jayBmb3IgQ2xhdWRlXG4gICAgaWYgKGlzSW1hZ2UpIHtcbiAgICAgIGNvbnN0IGJsb2NrID0gYnVpbGRJbWFnZVRvb2xSZXN1bHQoc3Rkb3V0LCB0b29sVXNlSUQpXG4gICAgICBpZiAoYmxvY2spIHJldHVybiBibG9ja1xuICAgIH1cblxuICAgIGxldCBwcm9jZXNzZWRTdGRvdXQgPSBzdGRvdXRcblxuICAgIGlmIChwZXJzaXN0ZWRPdXRwdXRQYXRoKSB7XG4gICAgICBjb25zdCB0cmltbWVkID0gc3Rkb3V0ID8gc3Rkb3V0LnJlcGxhY2UoL14oXFxzKlxcbikrLywgJycpLnRyaW1FbmQoKSA6ICcnXG4gICAgICBjb25zdCBwcmV2aWV3ID0gZ2VuZXJhdGVQcmV2aWV3KHRyaW1tZWQsIFBSRVZJRVdfU0laRV9CWVRFUylcbiAgICAgIHByb2Nlc3NlZFN0ZG91dCA9IGJ1aWxkTGFyZ2VUb29sUmVzdWx0TWVzc2FnZSh7XG4gICAgICAgIGZpbGVwYXRoOiBwZXJzaXN0ZWRPdXRwdXRQYXRoLFxuICAgICAgICBvcmlnaW5hbFNpemU6IHBlcnNpc3RlZE91dHB1dFNpemUgPz8gMCxcbiAgICAgICAgaXNKc29uOiBmYWxzZSxcbiAgICAgICAgcHJldmlldzogcHJldmlldy5wcmV2aWV3LFxuICAgICAgICBoYXNNb3JlOiBwcmV2aWV3Lmhhc01vcmUsXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoc3Rkb3V0KSB7XG4gICAgICBwcm9jZXNzZWRTdGRvdXQgPSBzdGRvdXQucmVwbGFjZSgvXihcXHMqXFxuKSsvLCAnJylcbiAgICAgIHByb2Nlc3NlZFN0ZG91dCA9IHByb2Nlc3NlZFN0ZG91dC50cmltRW5kKClcbiAgICB9XG5cbiAgICBsZXQgZXJyb3JNZXNzYWdlID0gc3RkZXJyLnRyaW0oKVxuICAgIGlmIChpbnRlcnJ1cHRlZCkge1xuICAgICAgaWYgKHN0ZGVycikgZXJyb3JNZXNzYWdlICs9IEVPTFxuICAgICAgZXJyb3JNZXNzYWdlICs9ICc8ZXJyb3I+Q29tbWFuZCB3YXMgYWJvcnRlZCBiZWZvcmUgY29tcGxldGlvbjwvZXJyb3I+J1xuICAgIH1cblxuICAgIGxldCBiYWNrZ3JvdW5kSW5mbyA9ICcnXG4gICAgaWYgKGJhY2tncm91bmRUYXNrSWQpIHtcbiAgICAgIGNvbnN0IG91dHB1dFBhdGggPSBnZXRUYXNrT3V0cHV0UGF0aChiYWNrZ3JvdW5kVGFza0lkKVxuICAgICAgaWYgKGFzc2lzdGFudEF1dG9CYWNrZ3JvdW5kZWQpIHtcbiAgICAgICAgYmFja2dyb3VuZEluZm8gPSBgQ29tbWFuZCBleGNlZWRlZCB0aGUgYXNzaXN0YW50LW1vZGUgYmxvY2tpbmcgYnVkZ2V0ICgke0FTU0lTVEFOVF9CTE9DS0lOR19CVURHRVRfTVMgLyAxMDAwfXMpIGFuZCB3YXMgbW92ZWQgdG8gdGhlIGJhY2tncm91bmQgd2l0aCBJRDogJHtiYWNrZ3JvdW5kVGFza0lkfS4gSXQgaXMgc3RpbGwgcnVubmluZyDigJQgeW91IHdpbGwgYmUgbm90aWZpZWQgd2hlbiBpdCBjb21wbGV0ZXMuIE91dHB1dCBpcyBiZWluZyB3cml0dGVuIHRvOiAke291dHB1dFBhdGh9LiBJbiBhc3Npc3RhbnQgbW9kZSwgZGVsZWdhdGUgbG9uZy1ydW5uaW5nIHdvcmsgdG8gYSBzdWJhZ2VudCBvciB1c2UgcnVuX2luX2JhY2tncm91bmQgdG8ga2VlcCB0aGlzIGNvbnZlcnNhdGlvbiByZXNwb25zaXZlLmBcbiAgICAgIH0gZWxzZSBpZiAoYmFja2dyb3VuZGVkQnlVc2VyKSB7XG4gICAgICAgIGJhY2tncm91bmRJbmZvID0gYENvbW1hbmQgd2FzIG1hbnVhbGx5IGJhY2tncm91bmRlZCBieSB1c2VyIHdpdGggSUQ6ICR7YmFja2dyb3VuZFRhc2tJZH0uIE91dHB1dCBpcyBiZWluZyB3cml0dGVuIHRvOiAke291dHB1dFBhdGh9YFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFja2dyb3VuZEluZm8gPSBgQ29tbWFuZCBydW5uaW5nIGluIGJhY2tncm91bmQgd2l0aCBJRDogJHtiYWNrZ3JvdW5kVGFza0lkfS4gT3V0cHV0IGlzIGJlaW5nIHdyaXR0ZW4gdG86ICR7b3V0cHV0UGF0aH1gXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvb2xfdXNlX2lkOiB0b29sVXNlSUQsXG4gICAgICB0eXBlOiAndG9vbF9yZXN1bHQnIGFzIGNvbnN0LFxuICAgICAgY29udGVudDogW3Byb2Nlc3NlZFN0ZG91dCwgZXJyb3JNZXNzYWdlLCBiYWNrZ3JvdW5kSW5mb11cbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAuam9pbignXFxuJyksXG4gICAgICBpc19lcnJvcjogaW50ZXJydXB0ZWQsXG4gICAgfVxuICB9LFxuXG4gIGFzeW5jIGNhbGwoXG4gICAgaW5wdXQ6IFBvd2VyU2hlbGxUb29sSW5wdXQsXG4gICAgdG9vbFVzZUNvbnRleHQ6IFBhcmFtZXRlcnM8VG9vbFsnY2FsbCddPlsxXSxcbiAgICBfY2FuVXNlVG9vbD86IENhblVzZVRvb2xGbixcbiAgICBfcGFyZW50TWVzc2FnZT86IEFzc2lzdGFudE1lc3NhZ2UsXG4gICAgb25Qcm9ncmVzcz86IFRvb2xDYWxsUHJvZ3Jlc3M8UG93ZXJTaGVsbFByb2dyZXNzPixcbiAgKTogUHJvbWlzZTx7IGRhdGE6IE91dCB9PiB7XG4gICAgLy8gTG9hZC1iZWFyaW5nIGd1YXJkOiBwcm9tcHRTaGVsbEV4ZWN1dGlvbi50cyBhbmQgcHJvY2Vzc0Jhc2hDb21tYW5kLnRzeFxuICAgIC8vIGNhbGwgUG93ZXJTaGVsbFRvb2wuY2FsbCgpIGRpcmVjdGx5LCBieXBhc3NpbmcgdmFsaWRhdGVJbnB1dC4gVGhpcyBpc1xuICAgIC8vIHRoZSBjaGVjayB0aGF0IGNvdmVycyBBTEwgY2FsbGVycy4gU2VlIGlzV2luZG93c1NhbmRib3hQb2xpY3lWaW9sYXRpb25cbiAgICAvLyBjb21tZW50IGZvciB0aGUgcG9saWN5IHJhdGlvbmFsZS5cbiAgICBpZiAoaXNXaW5kb3dzU2FuZGJveFBvbGljeVZpb2xhdGlvbigpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoV0lORE9XU19TQU5EQk9YX1BPTElDWV9SRUZVU0FMKVxuICAgIH1cblxuICAgIGNvbnN0IHsgYWJvcnRDb250cm9sbGVyLCBzZXRBcHBTdGF0ZSwgc2V0VG9vbEpTWCB9ID0gdG9vbFVzZUNvbnRleHRcblxuICAgIGNvbnN0IGlzTWFpblRocmVhZCA9ICF0b29sVXNlQ29udGV4dC5hZ2VudElkXG5cbiAgICBsZXQgcHJvZ3Jlc3NDb3VudGVyID0gMFxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbW1hbmRHZW5lcmF0b3IgPSBydW5Qb3dlclNoZWxsQ29tbWFuZCh7XG4gICAgICAgIGlucHV0LFxuICAgICAgICBhYm9ydENvbnRyb2xsZXIsXG4gICAgICAgIC8vIFVzZSB0aGUgYWx3YXlzLXNoYXJlZCB0YXNrIGNoYW5uZWwgc28gYXN5bmMgYWdlbnRzJyBiYWNrZ3JvdW5kXG4gICAgICAgIC8vIHNoZWxsIHRhc2tzIGFyZSBhY3R1YWxseSByZWdpc3RlcmVkIChhbmQga2lsbGFibGUgb24gYWdlbnQgZXhpdCkuXG4gICAgICAgIHNldEFwcFN0YXRlOiB0b29sVXNlQ29udGV4dC5zZXRBcHBTdGF0ZUZvclRhc2tzID8/IHNldEFwcFN0YXRlLFxuICAgICAgICBzZXRUb29sSlNYLFxuICAgICAgICBwcmV2ZW50Q3dkQ2hhbmdlczogIWlzTWFpblRocmVhZCxcbiAgICAgICAgaXNNYWluVGhyZWFkLFxuICAgICAgICB0b29sVXNlSWQ6IHRvb2xVc2VDb250ZXh0LnRvb2xVc2VJZCxcbiAgICAgICAgYWdlbnRJZDogdG9vbFVzZUNvbnRleHQuYWdlbnRJZCxcbiAgICAgIH0pXG5cbiAgICAgIGxldCBnZW5lcmF0b3JSZXN1bHRcbiAgICAgIGRvIHtcbiAgICAgICAgZ2VuZXJhdG9yUmVzdWx0ID0gYXdhaXQgY29tbWFuZEdlbmVyYXRvci5uZXh0KClcbiAgICAgICAgaWYgKCFnZW5lcmF0b3JSZXN1bHQuZG9uZSAmJiBvblByb2dyZXNzKSB7XG4gICAgICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBnZW5lcmF0b3JSZXN1bHQudmFsdWVcbiAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgIHRvb2xVc2VJRDogYHBzLXByb2dyZXNzLSR7cHJvZ3Jlc3NDb3VudGVyKyt9YCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgdHlwZTogJ3Bvd2Vyc2hlbGxfcHJvZ3Jlc3MnLFxuICAgICAgICAgICAgICBvdXRwdXQ6IHByb2dyZXNzLm91dHB1dCxcbiAgICAgICAgICAgICAgZnVsbE91dHB1dDogcHJvZ3Jlc3MuZnVsbE91dHB1dCxcbiAgICAgICAgICAgICAgZWxhcHNlZFRpbWVTZWNvbmRzOiBwcm9ncmVzcy5lbGFwc2VkVGltZVNlY29uZHMsXG4gICAgICAgICAgICAgIHRvdGFsTGluZXM6IHByb2dyZXNzLnRvdGFsTGluZXMsXG4gICAgICAgICAgICAgIHRvdGFsQnl0ZXM6IHByb2dyZXNzLnRvdGFsQnl0ZXMsXG4gICAgICAgICAgICAgIHRpbWVvdXRNczogcHJvZ3Jlc3MudGltZW91dE1zLFxuICAgICAgICAgICAgICB0YXNrSWQ6IHByb2dyZXNzLnRhc2tJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoIWdlbmVyYXRvclJlc3VsdC5kb25lKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBnZW5lcmF0b3JSZXN1bHQudmFsdWVcblxuICAgICAgLy8gRmVlZCBnaXQvUFIgdXNhZ2UgbWV0cmljcyAoc2FtZSBjb3VudGVycyBhcyBCYXNoVG9vbCkuIFBTIGludm9rZXNcbiAgICAgIC8vIGdpdC9naC9nbGFiL2N1cmwgYXMgZXh0ZXJuYWwgYmluYXJpZXMgd2l0aCBpZGVudGljYWwgc3ludGF4LCBzbyB0aGVcbiAgICAgIC8vIHNoZWxsLWFnbm9zdGljIHJlZ2V4IGRldGVjdGlvbiBpbiB0cmFja0dpdE9wZXJhdGlvbnMgd29ya3MgYXMtaXMuXG4gICAgICAvLyBDYWxsZWQgYmVmb3JlIHRoZSBiYWNrZ3JvdW5kVGFza0lkIGVhcmx5LXJldHVybiBzbyBiYWNrZ3JvdW5kZWRcbiAgICAgIC8vIGNvbW1hbmRzIGFyZSBjb3VudGVkIHRvbyAobWF0Y2hlcyBCYXNoVG9vbC50c3g6OTEyKS5cbiAgICAgIC8vXG4gICAgICAvLyBQcmUtZmxpZ2h0IHNlbnRpbmVsIGd1YXJkOiB0aGUgdHdvIFBTIHByZS1mbGlnaHQgcGF0aHMgKHB3c2gtbm90LWZvdW5kLFxuICAgICAgLy8gZXhlYy1zcGF3bi1jYXRjaCkgcmV0dXJuIGNvZGU6IDAgKyBlbXB0eSBzdGRvdXQgKyBzdGRlcnIgc28gY2FsbCgpIGNhblxuICAgICAgLy8gc3VyZmFjZSBzdGRlcnIgZ3JhY2VmdWxseSBpbnN0ZWFkIG9mIHRocm93aW5nIFNoZWxsRXJyb3IuIEJ1dFxuICAgICAgLy8gZ2l0T3BlcmF0aW9uVHJhY2tpbmcudHM6NDggdHJlYXRzIGNvZGUgMCBhcyBzdWNjZXNzIGFuZCB3b3VsZFxuICAgICAgLy8gcmVnZXgtbWF0Y2ggdGhlIGNvbW1hbmQsIG1pcy1jb3VudGluZyBhIGNvbW1hbmQgdGhhdCBuZXZlciByYW4uXG4gICAgICAvLyBCYXNoVG9vbCBpcyBzYWZlIOKAlCBpdHMgcHJlLWZsaWdodCBnb2VzIHRocm91Z2ggY3JlYXRlRmFpbGVkQ29tbWFuZFxuICAgICAgLy8gKGNvZGU6IDEpIHNvIHRyYWNraW5nIGVhcmx5LXJldHVybnMuIFNraXAgdHJhY2tpbmcgb24gdGhpcyBzZW50aW5lbC5cbiAgICAgIGNvbnN0IGlzUHJlRmxpZ2h0U2VudGluZWwgPVxuICAgICAgICByZXN1bHQuY29kZSA9PT0gMCAmJlxuICAgICAgICAhcmVzdWx0LnN0ZG91dCAmJlxuICAgICAgICByZXN1bHQuc3RkZXJyICYmXG4gICAgICAgICFyZXN1bHQuYmFja2dyb3VuZFRhc2tJZFxuICAgICAgaWYgKCFpc1ByZUZsaWdodFNlbnRpbmVsKSB7XG4gICAgICAgIHRyYWNrR2l0T3BlcmF0aW9ucyhpbnB1dC5jb21tYW5kLCByZXN1bHQuY29kZSwgcmVzdWx0LnN0ZG91dClcbiAgICAgIH1cblxuICAgICAgLy8gRGlzdGluZ3Vpc2ggdXNlci1kcml2ZW4gaW50ZXJydXB0IChuZXcgbWVzc2FnZSBzdWJtaXR0ZWQpIGZyb20gb3RoZXJcbiAgICAgIC8vIGludGVycnVwdGVkIHN0YXRlcy4gT25seSB1c2VyLWludGVycnVwdCBzaG91bGQgc3VwcHJlc3MgU2hlbGxFcnJvciDigJRcbiAgICAgIC8vIHRpbWVvdXQta2lsbCBvciBwcm9jZXNzLWtpbGwgd2l0aCBpc0Vycm9yIHNob3VsZCBzdGlsbCB0aHJvdy5cbiAgICAgIC8vIE1hdGNoZXMgQmFzaFRvb2wncyBpc0ludGVycnVwdC5cbiAgICAgIGNvbnN0IGlzSW50ZXJydXB0ID1cbiAgICAgICAgcmVzdWx0LmludGVycnVwdGVkICYmIGFib3J0Q29udHJvbGxlci5zaWduYWwucmVhc29uID09PSAnaW50ZXJydXB0J1xuXG4gICAgICAvLyBPbmx5IHRoZSBtYWluIHRocmVhZCB0cmFja3MvcmVzZXRzIGN3ZDsgYWdlbnRzIGhhdmUgdGhlaXIgb3duIGN3ZFxuICAgICAgLy8gaXNvbGF0aW9uLiBNYXRjaGVzIEJhc2hUb29sJ3MgIXByZXZlbnRDd2RDaGFuZ2VzIGd1YXJkLlxuICAgICAgLy8gUnVucyBiZWZvcmUgdGhlIGJhY2tncm91bmRUYXNrSWQgZWFybHktcmV0dXJuOiBhIGNvbW1hbmQgbWF5IGNoYW5nZVxuICAgICAgLy8gQ1dEIGJlZm9yZSBiZWluZyBiYWNrZ3JvdW5kZWQgKGUuZy4gYFNldC1Mb2NhdGlvbiBDOlxcdGVtcDtcbiAgICAgIC8vIFN0YXJ0LVNsZWVwIDYwYCksIGFuZCBCYXNoVG9vbCBoYXMgbm8gc3VjaCBlYXJseSByZXR1cm4g4oCUIGl0c1xuICAgICAgLy8gYmFja2dyb3VuZGVkIHJlc3VsdHMgZmxvdyB0aHJvdWdoIHJlc2V0Q3dkSWZPdXRzaWRlUHJvamVjdCBhdCA6OTQ1LlxuICAgICAgbGV0IHN0ZGVyckZvclNoZWxsUmVzZXQgPSAnJ1xuICAgICAgaWYgKGlzTWFpblRocmVhZCkge1xuICAgICAgICBjb25zdCBhcHBTdGF0ZSA9IHRvb2xVc2VDb250ZXh0LmdldEFwcFN0YXRlKClcbiAgICAgICAgaWYgKHJlc2V0Q3dkSWZPdXRzaWRlUHJvamVjdChhcHBTdGF0ZS50b29sUGVybWlzc2lvbkNvbnRleHQpKSB7XG4gICAgICAgICAgc3RkZXJyRm9yU2hlbGxSZXNldCA9IHN0ZEVyckFwcGVuZFNoZWxsUmVzZXRNZXNzYWdlKCcnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGJhY2tncm91bmRlZCwgcmV0dXJuIGltbWVkaWF0ZWx5IHdpdGggdGFzayBJRC4gU3RyaXAgaGludHMgZmlyc3RcbiAgICAgIC8vIHNvIGludGVycnVwdC1iYWNrZ3JvdW5kZWQgZnVsbE91dHB1dCBkb2Vzbid0IGxlYWsgdGhlIHRhZyB0byB0aGVcbiAgICAgIC8vIG1vZGVsIChCYXNoVG9vbCBoYXMgbm8gZWFybHkgcmV0dXJuLCBzbyBhbGwgcGF0aHMgZmxvdyB0aHJvdWdoIGl0c1xuICAgICAgLy8gc2luZ2xlIGV4dHJhY3Rpb24gc2l0ZSkuXG4gICAgICBpZiAocmVzdWx0LmJhY2tncm91bmRUYXNrSWQpIHtcbiAgICAgICAgY29uc3QgYmdFeHRyYWN0ZWQgPSBleHRyYWN0Q2xhdWRlQ29kZUhpbnRzKFxuICAgICAgICAgIHJlc3VsdC5zdGRvdXQgfHwgJycsXG4gICAgICAgICAgaW5wdXQuY29tbWFuZCxcbiAgICAgICAgKVxuICAgICAgICBpZiAoaXNNYWluVGhyZWFkICYmIGJnRXh0cmFjdGVkLmhpbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGhpbnQgb2YgYmdFeHRyYWN0ZWQuaGludHMpIG1heWJlUmVjb3JkUGx1Z2luSGludChoaW50KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgc3Rkb3V0OiBiZ0V4dHJhY3RlZC5zdHJpcHBlZCxcbiAgICAgICAgICAgIHN0ZGVycjogW3Jlc3VsdC5zdGRlcnIgfHwgJycsIHN0ZGVyckZvclNoZWxsUmVzZXRdXG4gICAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAgICAgLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgaW50ZXJydXB0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgYmFja2dyb3VuZFRhc2tJZDogcmVzdWx0LmJhY2tncm91bmRUYXNrSWQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kZWRCeVVzZXI6IHJlc3VsdC5iYWNrZ3JvdW5kZWRCeVVzZXIsXG4gICAgICAgICAgICBhc3Npc3RhbnRBdXRvQmFja2dyb3VuZGVkOiByZXN1bHQuYXNzaXN0YW50QXV0b0JhY2tncm91bmRlZCxcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0ZG91dEFjY3VtdWxhdG9yID0gbmV3IEVuZFRydW5jYXRpbmdBY2N1bXVsYXRvcigpXG4gICAgICBjb25zdCBwcm9jZXNzZWRTdGRvdXQgPSAocmVzdWx0LnN0ZG91dCB8fCAnJykudHJpbUVuZCgpXG5cbiAgICAgIHN0ZG91dEFjY3VtdWxhdG9yLmFwcGVuZChwcm9jZXNzZWRTdGRvdXQgKyBFT0wpXG5cbiAgICAgIC8vIEludGVycHJldCBleGl0IGNvZGUgdXNpbmcgc2VtYW50aWMgcnVsZXMuIFBTLW5hdGl2ZSBjbWRsZXRzIChTZWxlY3QtU3RyaW5nLFxuICAgICAgLy8gQ29tcGFyZS1PYmplY3QsIFRlc3QtUGF0aCkgZXhpdCAwIG9uIG5vLW1hdGNoIHNvIHRoZXkgYWx3YXlzIGhpdCB0aGUgZGVmYXVsdFxuICAgICAgLy8gaGVyZS4gVGhpcyBwcmltYXJpbHkgaGFuZGxlcyBleHRlcm5hbCAuZXhlJ3MgKGdyZXAsIHJnLCBmaW5kc3RyLCBmYywgcm9ib2NvcHkpXG4gICAgICAvLyB3aGVyZSBub24temVybyBjYW4gbWVhbiBcIm5vIG1hdGNoXCIgLyBcImZpbGVzIGNvcGllZFwiIHJhdGhlciB0aGFuIGZhaWx1cmUuXG4gICAgICBjb25zdCBpbnRlcnByZXRhdGlvbiA9IGludGVycHJldENvbW1hbmRSZXN1bHQoXG4gICAgICAgIGlucHV0LmNvbW1hbmQsXG4gICAgICAgIHJlc3VsdC5jb2RlLFxuICAgICAgICBwcm9jZXNzZWRTdGRvdXQsXG4gICAgICAgIHJlc3VsdC5zdGRlcnIgfHwgJycsXG4gICAgICApXG5cbiAgICAgIC8vIGdldEVycm9yUGFydHMoKSBpbiB0b29sRXJyb3JzLnRzIGFscmVhZHkgcHJlcGVuZHMgJ0V4aXQgY29kZSBOJ1xuICAgICAgLy8gZnJvbSBlcnJvci5jb2RlIHdoZW4gYnVpbGRpbmcgdGhlIFNoZWxsRXJyb3IgbWVzc2FnZS4gRG8gbm90XG4gICAgICAvLyBkdXBsaWNhdGUgaXQgaW50byBzdGRvdXQgaGVyZSAoQmFzaFRvb2wncyBhcHBlbmQgYXQgOjkzOSBpcyBkZWFkXG4gICAgICAvLyBjb2RlIOKAlCBpdCB0aHJvd3MgYmVmb3JlIHN0ZG91dEFjY3VtdWxhdG9yLnRvU3RyaW5nKCkgaXMgcmVhZCkuXG5cbiAgICAgIGxldCBzdGRvdXQgPSBzdHJpcEVtcHR5TGluZXMoc3Rkb3V0QWNjdW11bGF0b3IudG9TdHJpbmcoKSlcblxuICAgICAgLy8gQ2xhdWRlIENvZGUgaGludHMgcHJvdG9jb2w6IENMSXMvU0RLcyBnYXRlZCBvbiBDTEFVREVDT0RFPTEgZW1pdCBhXG4gICAgICAvLyBgPGNsYXVkZS1jb2RlLWhpbnQgLz5gIHRhZyB0byBzdGRlcnIgKG1lcmdlZCBpbnRvIHN0ZG91dCBoZXJlKS4gU2NhbixcbiAgICAgIC8vIHJlY29yZCBmb3IgdXNlQ2xhdWRlQ29kZUhpbnRSZWNvbW1lbmRhdGlvbiB0byBzdXJmYWNlLCB0aGVuIHN0cmlwXG4gICAgICAvLyBzbyB0aGUgbW9kZWwgbmV2ZXIgc2VlcyB0aGUgdGFnIOKAlCBhIHplcm8tdG9rZW4gc2lkZSBjaGFubmVsLlxuICAgICAgLy8gU3RyaXBwaW5nIHJ1bnMgdW5jb25kaXRpb25hbGx5IChzdWJhZ2VudCBvdXRwdXQgbXVzdCBzdGF5IGNsZWFuIHRvbyk7XG4gICAgICAvLyBvbmx5IHRoZSBkaWFsb2cgcmVjb3JkaW5nIGlzIG1haW4tdGhyZWFkLW9ubHkuXG4gICAgICBjb25zdCBleHRyYWN0ZWQgPSBleHRyYWN0Q2xhdWRlQ29kZUhpbnRzKHN0ZG91dCwgaW5wdXQuY29tbWFuZClcbiAgICAgIHN0ZG91dCA9IGV4dHJhY3RlZC5zdHJpcHBlZFxuICAgICAgaWYgKGlzTWFpblRocmVhZCAmJiBleHRyYWN0ZWQuaGludHMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGNvbnN0IGhpbnQgb2YgZXh0cmFjdGVkLmhpbnRzKSBtYXliZVJlY29yZFBsdWdpbkhpbnQoaGludClcbiAgICAgIH1cblxuICAgICAgLy8gcHJlU3Bhd25FcnJvciBtZWFucyBleGVjKCkgc3VjY2VlZGVkIGJ1dCB0aGUgaW5uZXIgc2hlbGwgZmFpbGVkIGJlZm9yZVxuICAgICAgLy8gdGhlIGNvbW1hbmQgcmFuIChlLmcuIENXRCBkZWxldGVkKS4gY3JlYXRlRmFpbGVkQ29tbWFuZCBzZXRzIGNvZGU9MSxcbiAgICAgIC8vIHdoaWNoIGludGVycHJldENvbW1hbmRSZXN1bHQgY2FuIG1pc3Rha2UgZm9yIGdyZXAtbm8tbWF0Y2ggLyBmaW5kc3RyXG4gICAgICAvLyBzdHJpbmctbm90LWZvdW5kLiBUaHJvdyBpdCBkaXJlY3RseS4gTWF0Y2hlcyBCYXNoVG9vbC50c3g6OTU3LlxuICAgICAgaWYgKHJlc3VsdC5wcmVTcGF3bkVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXN1bHQucHJlU3Bhd25FcnJvcilcbiAgICAgIH1cbiAgICAgIGlmIChpbnRlcnByZXRhdGlvbi5pc0Vycm9yICYmICFpc0ludGVycnVwdCkge1xuICAgICAgICB0aHJvdyBuZXcgU2hlbGxFcnJvcihcbiAgICAgICAgICBzdGRvdXQsXG4gICAgICAgICAgcmVzdWx0LnN0ZGVyciB8fCAnJyxcbiAgICAgICAgICByZXN1bHQuY29kZSxcbiAgICAgICAgICByZXN1bHQuaW50ZXJydXB0ZWQsXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgLy8gTGFyZ2Ugb3V0cHV0OiBmaWxlIG9uIGRpc2sgaGFzIG1vcmUgdGhhbiBnZXRNYXhPdXRwdXRMZW5ndGgoKSBieXRlcy5cbiAgICAgIC8vIHN0ZG91dCBhbHJlYWR5IGNvbnRhaW5zIHRoZSBmaXJzdCBjaHVuay4gQ29weSB0aGUgb3V0cHV0IGZpbGUgdG8gdGhlXG4gICAgICAvLyB0b29sLXJlc3VsdHMgZGlyIHNvIHRoZSBtb2RlbCBjYW4gcmVhZCBpdCB2aWEgRmlsZVJlYWQuIElmID4gNjQgTUIsXG4gICAgICAvLyB0cnVuY2F0ZSBhZnRlciBjb3B5aW5nLiBNYXRjaGVzIEJhc2hUb29sLnRzeDo5ODMtMTAwNS5cbiAgICAgIC8vXG4gICAgICAvLyBQbGFjZWQgQUZURVIgdGhlIHByZVNwYXduRXJyb3IvU2hlbGxFcnJvciB0aHJvd3MgKG1hdGNoZXMgQmFzaFRvb2wnc1xuICAgICAgLy8gb3JkZXJpbmcsIHdoZXJlIHBlcnNpc3RlbmNlIGlzIHBvc3QtdHJ5L2ZpbmFsbHkpOiBhIGZhaWxpbmcgY29tbWFuZFxuICAgICAgLy8gdGhhdCBhbHNvIHByb2R1Y2VkID5tYXhPdXRwdXRMZW5ndGggYnl0ZXMgd291bGQgb3RoZXJ3aXNlIGRvIDMtNCBkaXNrXG4gICAgICAvLyBzeXNjYWxscywgc3RvcmUgdG8gdG9vbC1yZXN1bHRzLywgdGhlbiB0aHJvdyDigJQgb3JwaGFuaW5nIHRoZSBmaWxlLlxuICAgICAgY29uc3QgTUFYX1BFUlNJU1RFRF9TSVpFID0gNjQgKiAxMDI0ICogMTAyNFxuICAgICAgbGV0IHBlcnNpc3RlZE91dHB1dFBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgbGV0IHBlcnNpc3RlZE91dHB1dFNpemU6IG51bWJlciB8IHVuZGVmaW5lZFxuICAgICAgaWYgKHJlc3VsdC5vdXRwdXRGaWxlUGF0aCAmJiByZXN1bHQub3V0cHV0VGFza0lkKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZmlsZVN0YXQgPSBhd2FpdCBmc1N0YXQocmVzdWx0Lm91dHB1dEZpbGVQYXRoKVxuICAgICAgICAgIHBlcnNpc3RlZE91dHB1dFNpemUgPSBmaWxlU3RhdC5zaXplXG5cbiAgICAgICAgICBhd2FpdCBlbnN1cmVUb29sUmVzdWx0c0RpcigpXG4gICAgICAgICAgY29uc3QgZGVzdCA9IGdldFRvb2xSZXN1bHRQYXRoKHJlc3VsdC5vdXRwdXRUYXNrSWQsIGZhbHNlKVxuICAgICAgICAgIGlmIChmaWxlU3RhdC5zaXplID4gTUFYX1BFUlNJU1RFRF9TSVpFKSB7XG4gICAgICAgICAgICBhd2FpdCBmc1RydW5jYXRlKHJlc3VsdC5vdXRwdXRGaWxlUGF0aCwgTUFYX1BFUlNJU1RFRF9TSVpFKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgbGluayhyZXN1bHQub3V0cHV0RmlsZVBhdGgsIGRlc3QpXG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICBhd2FpdCBjb3B5RmlsZShyZXN1bHQub3V0cHV0RmlsZVBhdGgsIGRlc3QpXG4gICAgICAgICAgfVxuICAgICAgICAgIHBlcnNpc3RlZE91dHB1dFBhdGggPSBkZXN0XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIC8vIEZpbGUgbWF5IGFscmVhZHkgYmUgZ29uZSDigJQgc3Rkb3V0IHByZXZpZXcgaXMgc3VmZmljaWVudFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENhcCBpbWFnZSBkaW1lbnNpb25zICsgc2l6ZSBpZiBwcmVzZW50IChDQy0zMDQg4oCUIHNlZVxuICAgICAgLy8gcmVzaXplU2hlbGxJbWFnZU91dHB1dCkuIFNjb3BlIHRoZSBkZWNvZGVkIGJ1ZmZlciBzbyBpdCBjYW4gYmVcbiAgICAgIC8vIHJlY2xhaW1lZCBiZWZvcmUgd2UgYnVpbGQgdGhlIG91dHB1dCBvYmplY3QuXG4gICAgICBsZXQgaXNJbWFnZSA9IGlzSW1hZ2VPdXRwdXQoc3Rkb3V0KVxuICAgICAgbGV0IGNvbXByZXNzZWRTdGRvdXQgPSBzdGRvdXRcbiAgICAgIGlmIChpc0ltYWdlKSB7XG4gICAgICAgIGNvbnN0IHJlc2l6ZWQgPSBhd2FpdCByZXNpemVTaGVsbEltYWdlT3V0cHV0KFxuICAgICAgICAgIHN0ZG91dCxcbiAgICAgICAgICByZXN1bHQub3V0cHV0RmlsZVBhdGgsXG4gICAgICAgICAgcGVyc2lzdGVkT3V0cHV0U2l6ZSxcbiAgICAgICAgKVxuICAgICAgICBpZiAocmVzaXplZCkge1xuICAgICAgICAgIGNvbXByZXNzZWRTdGRvdXQgPSByZXNpemVkXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gUGFyc2UgZmFpbGVkIChlLmcuIG11bHRpLWxpbmUgc3Rkb3V0IGFmdGVyIHRoZSBkYXRhIFVSTCkuIEtlZXBcbiAgICAgICAgICAvLyBpc0ltYWdlIGluIHN5bmMgd2l0aCB3aGF0IHdlIGFjdHVhbGx5IHNlbmQgc28gdGhlIFVJIGxhYmVsIHN0YXlzXG4gICAgICAgICAgLy8gYWNjdXJhdGUg4oCUIG1hcFRvb2xSZXN1bHRUb1Rvb2xSZXN1bHRCbG9ja1BhcmFtJ3MgZGVmZW5zaXZlXG4gICAgICAgICAgLy8gZmFsbHRocm91Z2ggd2lsbCBzZW5kIHRleHQsIG5vdCBhbiBpbWFnZSBibG9jay5cbiAgICAgICAgICBpc0ltYWdlID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaW5hbFN0ZGVyciA9IFtyZXN1bHQuc3RkZXJyIHx8ICcnLCBzdGRlcnJGb3JTaGVsbFJlc2V0XVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5qb2luKCdcXG4nKVxuXG4gICAgICBsb2dFdmVudCgndGVuZ3VfcG93ZXJzaGVsbF90b29sX2NvbW1hbmRfZXhlY3V0ZWQnLCB7XG4gICAgICAgIGNvbW1hbmRfdHlwZTogZ2V0Q29tbWFuZFR5cGVGb3JMb2dnaW5nKGlucHV0LmNvbW1hbmQpLFxuICAgICAgICBzdGRvdXRfbGVuZ3RoOiBjb21wcmVzc2VkU3Rkb3V0Lmxlbmd0aCxcbiAgICAgICAgc3RkZXJyX2xlbmd0aDogZmluYWxTdGRlcnIubGVuZ3RoLFxuICAgICAgICBleGl0X2NvZGU6IHJlc3VsdC5jb2RlLFxuICAgICAgICBpbnRlcnJ1cHRlZDogcmVzdWx0LmludGVycnVwdGVkLFxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHN0ZG91dDogY29tcHJlc3NlZFN0ZG91dCxcbiAgICAgICAgICBzdGRlcnI6IGZpbmFsU3RkZXJyLFxuICAgICAgICAgIGludGVycnVwdGVkOiByZXN1bHQuaW50ZXJydXB0ZWQsXG4gICAgICAgICAgcmV0dXJuQ29kZUludGVycHJldGF0aW9uOiBpbnRlcnByZXRhdGlvbi5tZXNzYWdlLFxuICAgICAgICAgIGlzSW1hZ2UsXG4gICAgICAgICAgcGVyc2lzdGVkT3V0cHV0UGF0aCxcbiAgICAgICAgICBwZXJzaXN0ZWRPdXRwdXRTaXplLFxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoc2V0VG9vbEpTWCkgc2V0VG9vbEpTWChudWxsKVxuICAgIH1cbiAgfSxcbiAgaXNSZXN1bHRUcnVuY2F0ZWQob3V0cHV0OiBPdXQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgaXNPdXRwdXRMaW5lVHJ1bmNhdGVkKG91dHB1dC5zdGRvdXQpIHx8XG4gICAgICBpc091dHB1dExpbmVUcnVuY2F0ZWQob3V0cHV0LnN0ZGVycilcbiAgICApXG4gIH0sXG59IHNhdGlzZmllcyBUb29sRGVmPElucHV0U2NoZW1hLCBPdXQ+KVxuXG5hc3luYyBmdW5jdGlvbiogcnVuUG93ZXJTaGVsbENvbW1hbmQoe1xuICBpbnB1dCxcbiAgYWJvcnRDb250cm9sbGVyLFxuICBzZXRBcHBTdGF0ZSxcbiAgc2V0VG9vbEpTWCxcbiAgcHJldmVudEN3ZENoYW5nZXMsXG4gIGlzTWFpblRocmVhZCxcbiAgdG9vbFVzZUlkLFxuICBhZ2VudElkLFxufToge1xuICBpbnB1dDogUG93ZXJTaGVsbFRvb2xJbnB1dFxuICBhYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlclxuICBzZXRBcHBTdGF0ZTogKGY6IChwcmV2OiBBcHBTdGF0ZSkgPT4gQXBwU3RhdGUpID0+IHZvaWRcbiAgc2V0VG9vbEpTWD86IFNldFRvb2xKU1hGblxuICBwcmV2ZW50Q3dkQ2hhbmdlcz86IGJvb2xlYW5cbiAgaXNNYWluVGhyZWFkPzogYm9vbGVhblxuICB0b29sVXNlSWQ/OiBzdHJpbmdcbiAgYWdlbnRJZD86IEFnZW50SWRcbn0pOiBBc3luY0dlbmVyYXRvcjxcbiAge1xuICAgIHR5cGU6ICdwcm9ncmVzcydcbiAgICBvdXRwdXQ6IHN0cmluZ1xuICAgIGZ1bGxPdXRwdXQ6IHN0cmluZ1xuICAgIGVsYXBzZWRUaW1lU2Vjb25kczogbnVtYmVyXG4gICAgdG90YWxMaW5lczogbnVtYmVyXG4gICAgdG90YWxCeXRlczogbnVtYmVyXG4gICAgdGFza0lkPzogc3RyaW5nXG4gICAgdGltZW91dE1zPzogbnVtYmVyXG4gIH0sXG4gIEV4ZWNSZXN1bHQsXG4gIHZvaWRcbj4ge1xuICBjb25zdCB7XG4gICAgY29tbWFuZCxcbiAgICBkZXNjcmlwdGlvbixcbiAgICB0aW1lb3V0LFxuICAgIHJ1bl9pbl9iYWNrZ3JvdW5kLFxuICAgIGRhbmdlcm91c2x5RGlzYWJsZVNhbmRib3gsXG4gIH0gPSBpbnB1dFxuICBjb25zdCB0aW1lb3V0TXMgPSBNYXRoLm1pbihcbiAgICB0aW1lb3V0IHx8IGdldERlZmF1bHRUaW1lb3V0TXMoKSxcbiAgICBnZXRNYXhUaW1lb3V0TXMoKSxcbiAgKVxuXG4gIGxldCBmdWxsT3V0cHV0ID0gJydcbiAgbGV0IGxhc3RQcm9ncmVzc091dHB1dCA9ICcnXG4gIGxldCBsYXN0VG90YWxMaW5lcyA9IDBcbiAgbGV0IGxhc3RUb3RhbEJ5dGVzID0gMFxuICBsZXQgYmFja2dyb3VuZFNoZWxsSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxuICBsZXQgaW50ZXJydXB0QmFja2dyb3VuZGluZ1N0YXJ0ZWQgPSBmYWxzZVxuICBsZXQgYXNzaXN0YW50QXV0b0JhY2tncm91bmRlZCA9IGZhbHNlXG5cbiAgLy8gUHJvZ3Jlc3Mgc2lnbmFsOiByZXNvbHZlZCB3aGVuIGJhY2tncm91bmRTaGVsbElkIGlzIHNldCBpbiB0aGUgYXN5bmNcbiAgLy8gLnRoZW4oKSBwYXRoLCB3YWtpbmcgdGhlIGdlbmVyYXRvcidzIFByb21pc2UucmFjZSBpbW1lZGlhdGVseSBpbnN0ZWFkIG9mXG4gIC8vIHdhaXRpbmcgZm9yIHRoZSBuZXh0IHNldFRpbWVvdXQgdGljayAobWF0Y2hlcyBCYXNoVG9vbCBwYXR0ZXJuKS5cbiAgbGV0IHJlc29sdmVQcm9ncmVzczogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGxcbiAgZnVuY3Rpb24gY3JlYXRlUHJvZ3Jlc3NTaWduYWwoKTogUHJvbWlzZTxudWxsPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPG51bGw+KHJlc29sdmUgPT4ge1xuICAgICAgcmVzb2x2ZVByb2dyZXNzID0gKCkgPT4gcmVzb2x2ZShudWxsKVxuICAgIH0pXG4gIH1cblxuICBjb25zdCBzaG91bGRBdXRvQmFja2dyb3VuZCA9XG4gICAgIWlzQmFja2dyb3VuZFRhc2tzRGlzYWJsZWQgJiYgaXNBdXRvYmFja2dyb3VuZGluZ0FsbG93ZWQoY29tbWFuZClcblxuICBjb25zdCBwb3dlcnNoZWxsUGF0aCA9IGF3YWl0IGdldENhY2hlZFBvd2VyU2hlbGxQYXRoKClcbiAgaWYgKCFwb3dlcnNoZWxsUGF0aCkge1xuICAgIC8vIFByZS1mbGlnaHQgZmFpbHVyZTogcHdzaCBub3QgaW5zdGFsbGVkLiBSZXR1cm4gY29kZSAwIHNvIGNhbGwoKSBzdXJmYWNlc1xuICAgIC8vIHRoaXMgYXMgYSBncmFjZWZ1bCBzdGRlcnIgbWVzc2FnZSByYXRoZXIgdGhhbiB0aHJvd2luZyBTaGVsbEVycm9yIOKAlCB0aGVcbiAgICAvLyBjb21tYW5kIG5ldmVyIHJhbiwgc28gdGhlcmUgaXMgbm8gbWVhbmluZ2Z1bCBub24temVybyBleGl0IHRvIHJlcG9ydC5cbiAgICByZXR1cm4ge1xuICAgICAgc3Rkb3V0OiAnJyxcbiAgICAgIHN0ZGVycjogJ1Bvd2VyU2hlbGwgaXMgbm90IGF2YWlsYWJsZSBvbiB0aGlzIHN5c3RlbS4nLFxuICAgICAgY29kZTogMCxcbiAgICAgIGludGVycnVwdGVkOiBmYWxzZSxcbiAgICB9XG4gIH1cblxuICBsZXQgc2hlbGxDb21tYW5kOiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIGV4ZWM+PlxuICB0cnkge1xuICAgIHNoZWxsQ29tbWFuZCA9IGF3YWl0IGV4ZWMoY29tbWFuZCwgYWJvcnRDb250cm9sbGVyLnNpZ25hbCwgJ3Bvd2Vyc2hlbGwnLCB7XG4gICAgICB0aW1lb3V0OiB0aW1lb3V0TXMsXG4gICAgICBvblByb2dyZXNzKGxhc3RMaW5lcywgYWxsTGluZXMsIHRvdGFsTGluZXMsIHRvdGFsQnl0ZXMsIGlzSW5jb21wbGV0ZSkge1xuICAgICAgICBsYXN0UHJvZ3Jlc3NPdXRwdXQgPSBsYXN0TGluZXNcbiAgICAgICAgZnVsbE91dHB1dCA9IGFsbExpbmVzXG4gICAgICAgIGxhc3RUb3RhbExpbmVzID0gdG90YWxMaW5lc1xuICAgICAgICBsYXN0VG90YWxCeXRlcyA9IGlzSW5jb21wbGV0ZSA/IHRvdGFsQnl0ZXMgOiAwXG4gICAgICB9LFxuICAgICAgcHJldmVudEN3ZENoYW5nZXMsXG4gICAgICAvLyBTYW5kYm94IHdvcmtzIG9uIExpbnV4L21hY09TL1dTTDIg4oCUIHB3c2ggdGhlcmUgaXMgYSBuYXRpdmUgYmluYXJ5IGFuZFxuICAgICAgLy8gU2FuZGJveE1hbmFnZXIud3JhcFdpdGhTYW5kYm94IHdyYXBzIGl0IHNhbWUgYXMgYmFzaCAoU2hlbGwudHMgdXNlc1xuICAgICAgLy8gL2Jpbi9zaCBmb3IgdGhlIG91dGVyIHNwYXduIHRvIHBhcnNlIHRoZSBQT1NJWC1xdW90ZWQgYndyYXAvc2FuZGJveC1leGVjXG4gICAgICAvLyBzdHJpbmcpLiBPbiBXaW5kb3dzIG5hdGl2ZSwgc2FuZGJveCBpcyB1bnN1cHBvcnRlZDsgc2hvdWxkVXNlU2FuZGJveCgpXG4gICAgICAvLyByZXR1cm5zIGZhbHNlIHZpYSBpc1NhbmRib3hpbmdFbmFibGVkKCkg4oaSIGlzU3VwcG9ydGVkUGxhdGZvcm0oKSDihpIgZmFsc2UuXG4gICAgICAvLyBUaGUgZXhwbGljaXQgcGxhdGZvcm0gY2hlY2sgaXMgcmVkdW5kYW50LWJ1dC1vYnZpb3VzLlxuICAgICAgc2hvdWxkVXNlU2FuZGJveDpcbiAgICAgICAgZ2V0UGxhdGZvcm0oKSA9PT0gJ3dpbmRvd3MnXG4gICAgICAgICAgPyBmYWxzZVxuICAgICAgICAgIDogc2hvdWxkVXNlU2FuZGJveCh7IGNvbW1hbmQsIGRhbmdlcm91c2x5RGlzYWJsZVNhbmRib3ggfSksXG4gICAgICBzaG91bGRBdXRvQmFja2dyb3VuZCxcbiAgICB9KVxuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nRXJyb3IoZSlcbiAgICAvLyBQcmUtZmxpZ2h0IGZhaWx1cmU6IHNwYXduL2V4ZWMgcmVqZWN0ZWQgYmVmb3JlIHRoZSBjb21tYW5kIHJhbi4gVXNlXG4gICAgLy8gY29kZSAwIHNvIGNhbGwoKSByZXR1cm5zIHN0ZGVyciBncmFjZWZ1bGx5IGluc3RlYWQgb2YgdGhyb3dpbmcgU2hlbGxFcnJvci5cbiAgICByZXR1cm4ge1xuICAgICAgc3Rkb3V0OiAnJyxcbiAgICAgIHN0ZGVycjogYEZhaWxlZCB0byBleGVjdXRlIFBvd2VyU2hlbGwgY29tbWFuZDogJHtnZXRFcnJvck1lc3NhZ2UoZSl9YCxcbiAgICAgIGNvZGU6IDAsXG4gICAgICBpbnRlcnJ1cHRlZDogZmFsc2UsXG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVzdWx0UHJvbWlzZSA9IHNoZWxsQ29tbWFuZC5yZXN1bHRcblxuICAvLyBIZWxwZXIgdG8gc3Bhd24gYSBiYWNrZ3JvdW5kIHRhc2sgYW5kIHJldHVybiBpdHMgSURcbiAgYXN5bmMgZnVuY3Rpb24gc3Bhd25CYWNrZ3JvdW5kVGFzaygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGhhbmRsZSA9IGF3YWl0IHNwYXduU2hlbGxUYXNrKFxuICAgICAge1xuICAgICAgICBjb21tYW5kLFxuICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfHwgY29tbWFuZCxcbiAgICAgICAgc2hlbGxDb21tYW5kLFxuICAgICAgICB0b29sVXNlSWQsXG4gICAgICAgIGFnZW50SWQsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBhYm9ydENvbnRyb2xsZXIsXG4gICAgICAgIGdldEFwcFN0YXRlOiAoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgJ2dldEFwcFN0YXRlIG5vdCBhdmFpbGFibGUgaW4gcnVuUG93ZXJTaGVsbENvbW1hbmQgY29udGV4dCcsXG4gICAgICAgICAgKVxuICAgICAgICB9LFxuICAgICAgICBzZXRBcHBTdGF0ZSxcbiAgICAgIH0sXG4gICAgKVxuICAgIHJldHVybiBoYW5kbGUudGFza0lkXG4gIH1cblxuICAvLyBIZWxwZXIgdG8gc3RhcnQgYmFja2dyb3VuZGluZyB3aXRoIGxvZ2dpbmdcbiAgZnVuY3Rpb24gc3RhcnRCYWNrZ3JvdW5kaW5nKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgIGJhY2tncm91bmRGbj86IChzaGVsbElkOiBzdHJpbmcpID0+IHZvaWQsXG4gICk6IHZvaWQge1xuICAgIC8vIElmIGEgZm9yZWdyb3VuZCB0YXNrIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCAodmlhIHJlZ2lzdGVyRm9yZWdyb3VuZCBpbiB0aGVcbiAgICAvLyBwcm9ncmVzcyBsb29wKSwgYmFja2dyb3VuZCBpdCBpbi1wbGFjZSBpbnN0ZWFkIG9mIHJlLXNwYXduaW5nLiBSZS1zcGF3bmluZ1xuICAgIC8vIHdvdWxkIG92ZXJ3cml0ZSB0YXNrc1t0YXNrSWRdLCBlbWl0IGEgZHVwbGljYXRlIHRhc2tfc3RhcnRlZCBTREsgZXZlbnQsXG4gICAgLy8gYW5kIGxlYWsgdGhlIGZpcnN0IGNsZWFudXAgY2FsbGJhY2suXG4gICAgaWYgKGZvcmVncm91bmRUYXNrSWQpIHtcbiAgICAgIGlmIChcbiAgICAgICAgIWJhY2tncm91bmRFeGlzdGluZ0ZvcmVncm91bmRUYXNrKFxuICAgICAgICAgIGZvcmVncm91bmRUYXNrSWQsXG4gICAgICAgICAgc2hlbGxDb21tYW5kLFxuICAgICAgICAgIGRlc2NyaXB0aW9uIHx8IGNvbW1hbmQsXG4gICAgICAgICAgc2V0QXBwU3RhdGUsXG4gICAgICAgICAgdG9vbFVzZUlkLFxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBiYWNrZ3JvdW5kU2hlbGxJZCA9IGZvcmVncm91bmRUYXNrSWRcbiAgICAgIGxvZ0V2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgICBjb21tYW5kX3R5cGU6IGdldENvbW1hbmRUeXBlRm9yTG9nZ2luZyhjb21tYW5kKSxcbiAgICAgIH0pXG4gICAgICBiYWNrZ3JvdW5kRm4/Lihmb3JlZ3JvdW5kVGFza0lkKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gTm8gZm9yZWdyb3VuZCB0YXNrIHJlZ2lzdGVyZWQg4oCUIHNwYXduIGEgbmV3IGJhY2tncm91bmQgdGFza1xuICAgIC8vIE5vdGU6IHNwYXduIGlzIGVzc2VudGlhbGx5IHN5bmNocm9ub3VzIGRlc3BpdGUgYmVpbmcgYXN5bmNcbiAgICB2b2lkIHNwYXduQmFja2dyb3VuZFRhc2soKS50aGVuKHNoZWxsSWQgPT4ge1xuICAgICAgYmFja2dyb3VuZFNoZWxsSWQgPSBzaGVsbElkXG5cbiAgICAgIC8vIFdha2UgdGhlIGdlbmVyYXRvcidzIFByb21pc2UucmFjZSBzbyBpdCBzZWVzIGJhY2tncm91bmRTaGVsbElkLlxuICAgICAgLy8gV2l0aG91dCB0aGlzLCB0aGUgZ2VuZXJhdG9yIHdhaXRzIGZvciB0aGUgY3VycmVudCBzZXRUaW1lb3V0IHRvIGZpcmVcbiAgICAgIC8vICh1cCB0byB+MXMpIGJlZm9yZSBub3RpY2luZyB0aGUgYmFja2dyb3VuZGluZy4gTWF0Y2hlcyBCYXNoVG9vbC5cbiAgICAgIGNvbnN0IHJlc29sdmUgPSByZXNvbHZlUHJvZ3Jlc3NcbiAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgIHJlc29sdmVQcm9ncmVzcyA9IG51bGxcbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgICB9XG5cbiAgICAgIGxvZ0V2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgICBjb21tYW5kX3R5cGU6IGdldENvbW1hbmRUeXBlRm9yTG9nZ2luZyhjb21tYW5kKSxcbiAgICAgIH0pXG5cbiAgICAgIGlmIChiYWNrZ3JvdW5kRm4pIHtcbiAgICAgICAgYmFja2dyb3VuZEZuKHNoZWxsSWQpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8vIFNldCB1cCBhdXRvLWJhY2tncm91bmRpbmcgb24gdGltZW91dCBpZiBlbmFibGVkXG4gIGlmIChzaGVsbENvbW1hbmQub25UaW1lb3V0ICYmIHNob3VsZEF1dG9CYWNrZ3JvdW5kKSB7XG4gICAgc2hlbGxDb21tYW5kLm9uVGltZW91dChiYWNrZ3JvdW5kRm4gPT4ge1xuICAgICAgc3RhcnRCYWNrZ3JvdW5kaW5nKFxuICAgICAgICAndGVuZ3VfcG93ZXJzaGVsbF9jb21tYW5kX3RpbWVvdXRfYmFja2dyb3VuZGVkJyxcbiAgICAgICAgYmFja2dyb3VuZEZuLFxuICAgICAgKVxuICAgIH0pXG4gIH1cblxuICAvLyBJbiBhc3Npc3RhbnQgbW9kZSwgdGhlIG1haW4gYWdlbnQgc2hvdWxkIHN0YXkgcmVzcG9uc2l2ZS4gQXV0by1iYWNrZ3JvdW5kXG4gIC8vIGJsb2NraW5nIGNvbW1hbmRzIGFmdGVyIEFTU0lTVEFOVF9CTE9DS0lOR19CVURHRVRfTVMgc28gdGhlIGFnZW50IGNhbiBrZWVwXG4gIC8vIGNvb3JkaW5hdGluZyBpbnN0ZWFkIG9mIHdhaXRpbmcuIFRoZSBjb21tYW5kIGtlZXBzIHJ1bm5pbmcg4oCUIG5vIHN0YXRlIGxvc3MuXG4gIGlmIChcbiAgICBmZWF0dXJlKCdLQUlST1MnKSAmJlxuICAgIGdldEthaXJvc0FjdGl2ZSgpICYmXG4gICAgaXNNYWluVGhyZWFkICYmXG4gICAgIWlzQmFja2dyb3VuZFRhc2tzRGlzYWJsZWQgJiZcbiAgICBydW5faW5fYmFja2dyb3VuZCAhPT0gdHJ1ZVxuICApIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmIChcbiAgICAgICAgc2hlbGxDb21tYW5kLnN0YXR1cyA9PT0gJ3J1bm5pbmcnICYmXG4gICAgICAgIGJhY2tncm91bmRTaGVsbElkID09PSB1bmRlZmluZWRcbiAgICAgICkge1xuICAgICAgICBhc3Npc3RhbnRBdXRvQmFja2dyb3VuZGVkID0gdHJ1ZVxuICAgICAgICBzdGFydEJhY2tncm91bmRpbmcoXG4gICAgICAgICAgJ3Rlbmd1X3Bvd2Vyc2hlbGxfY29tbWFuZF9hc3Npc3RhbnRfYXV0b19iYWNrZ3JvdW5kZWQnLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSwgQVNTSVNUQU5UX0JMT0NLSU5HX0JVREdFVF9NUykudW5yZWYoKVxuICB9XG5cbiAgLy8gSGFuZGxlIENsYXVkZSBhc2tpbmcgdG8gcnVuIGl0IGluIHRoZSBiYWNrZ3JvdW5kIGV4cGxpY2l0bHlcbiAgLy8gV2hlbiBleHBsaWNpdGx5IHJlcXVlc3RlZCB2aWEgcnVuX2luX2JhY2tncm91bmQsIGFsd2F5cyBob25vciB0aGUgcmVxdWVzdFxuICAvLyByZWdhcmRsZXNzIG9mIHRoZSBjb21tYW5kIHR5cGUgKGlzQXV0b2JhY2tncm91bmRpbmdBbGxvd2VkIG9ubHkgYXBwbGllcyB0byBhdXRvbWF0aWMgYmFja2dyb3VuZGluZylcbiAgaWYgKHJ1bl9pbl9iYWNrZ3JvdW5kID09PSB0cnVlICYmICFpc0JhY2tncm91bmRUYXNrc0Rpc2FibGVkKSB7XG4gICAgY29uc3Qgc2hlbGxJZCA9IGF3YWl0IHNwYXduQmFja2dyb3VuZFRhc2soKVxuXG4gICAgbG9nRXZlbnQoJ3Rlbmd1X3Bvd2Vyc2hlbGxfY29tbWFuZF9leHBsaWNpdGx5X2JhY2tncm91bmRlZCcsIHtcbiAgICAgIGNvbW1hbmRfdHlwZTogZ2V0Q29tbWFuZFR5cGVGb3JMb2dnaW5nKGNvbW1hbmQpLFxuICAgIH0pXG5cbiAgICByZXR1cm4ge1xuICAgICAgc3Rkb3V0OiAnJyxcbiAgICAgIHN0ZGVycjogJycsXG4gICAgICBjb2RlOiAwLFxuICAgICAgaW50ZXJydXB0ZWQ6IGZhbHNlLFxuICAgICAgYmFja2dyb3VuZFRhc2tJZDogc2hlbGxJZCxcbiAgICB9XG4gIH1cblxuICAvLyBTdGFydCBwb2xsaW5nIHRoZSBvdXRwdXQgZmlsZSBmb3IgcHJvZ3Jlc3NcbiAgVGFza091dHB1dC5zdGFydFBvbGxpbmcoc2hlbGxDb21tYW5kLnRhc2tPdXRwdXQudGFza0lkKVxuXG4gIC8vIFNldCB1cCBwcm9ncmVzcyB5aWVsZGluZyB3aXRoIHBlcmlvZGljIGNoZWNrc1xuICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gIGxldCBuZXh0UHJvZ3Jlc3NUaW1lID0gc3RhcnRUaW1lICsgUFJPR1JFU1NfVEhSRVNIT0xEX01TXG4gIGxldCBmb3JlZ3JvdW5kVGFza0lkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWRcblxuICAvLyBQcm9ncmVzcyBsb29wOiB3cmFwIGluIHRyeS9maW5hbGx5IHNvIHN0b3BQb2xsaW5nIGlzIGNhbGxlZCBvbiBldmVyeSBleGl0XG4gIC8vIHBhdGgg4oCUIG5vcm1hbCBjb21wbGV0aW9uLCB0aW1lb3V0L2ludGVycnVwdCBiYWNrZ3JvdW5kaW5nLCBhbmQgQ3RybCtCXG4gIC8vIChtYXRjaGVzIEJhc2hUb29sIHBhdHRlcm47IHNlZSBQUiAjMTg4ODcgcmV2aWV3IHRocmVhZCBhdCA6NTYwKVxuICB0cnkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gICAgICBjb25zdCB0aW1lVW50aWxOZXh0UHJvZ3Jlc3MgPSBNYXRoLm1heCgwLCBuZXh0UHJvZ3Jlc3NUaW1lIC0gbm93KVxuXG4gICAgICBjb25zdCBwcm9ncmVzc1NpZ25hbCA9IGNyZWF0ZVByb2dyZXNzU2lnbmFsKClcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgIHJlc3VsdFByb21pc2UsXG4gICAgICAgIG5ldyBQcm9taXNlPG51bGw+KHJlc29sdmUgPT5cbiAgICAgICAgICBzZXRUaW1lb3V0KHIgPT4gcihudWxsKSwgdGltZVVudGlsTmV4dFByb2dyZXNzLCByZXNvbHZlKS51bnJlZigpLFxuICAgICAgICApLFxuICAgICAgICBwcm9ncmVzc1NpZ25hbCxcbiAgICAgIF0pXG5cbiAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgLy8gUmFjZTogYmFja2dyb3VuZGluZyBmaXJlZCAoMTVzIHRpbWVyIC8gb25UaW1lb3V0IC8gQ3RybCtCKSBidXQgdGhlXG4gICAgICAgIC8vIGNvbW1hbmQgY29tcGxldGVkIGJlZm9yZSB0aGUgbmV4dCBwb2xsIHRpY2suICNoYW5kbGVFeGl0IHNldHNcbiAgICAgICAgLy8gYmFja2dyb3VuZFRhc2tJZCBidXQgc2tpcHMgb3V0cHV0RmlsZVBhdGggKGl0IGFzc3VtZXMgdGhlIGJhY2tncm91bmRcbiAgICAgICAgLy8gbWVzc2FnZSBvciA8dGFza19ub3RpZmljYXRpb24+IHdpbGwgY2FycnkgdGhlIHBhdGgpLiBTdHJpcFxuICAgICAgICAvLyBiYWNrZ3JvdW5kVGFza0lkIHNvIHRoZSBtb2RlbCBzZWVzIGEgY2xlYW4gY29tcGxldGVkIGNvbW1hbmQsXG4gICAgICAgIC8vIHJlY29uc3RydWN0IG91dHB1dEZpbGVQYXRoIGZvciBsYXJnZSBvdXRwdXRzLCBhbmQgc3VwcHJlc3MgdGhlXG4gICAgICAgIC8vIHJlZHVuZGFudCA8dGFza19ub3RpZmljYXRpb24+IGZyb20gdGhlIC50aGVuKCkgaGFuZGxlci5cbiAgICAgICAgLy8gQ2hlY2sgcmVzdWx0LmJhY2tncm91bmRUYXNrSWQgKG5vdCB0aGUgY2xvc3VyZSB2YXIpIHRvIGFsc28gY292ZXJcbiAgICAgICAgLy8gQ3RybCtCLCB3aGljaCBjYWxscyBzaGVsbENvbW1hbmQuYmFja2dyb3VuZCgpIGRpcmVjdGx5LlxuICAgICAgICBpZiAocmVzdWx0LmJhY2tncm91bmRUYXNrSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG1hcmtUYXNrTm90aWZpZWQocmVzdWx0LmJhY2tncm91bmRUYXNrSWQsIHNldEFwcFN0YXRlKVxuICAgICAgICAgIGNvbnN0IGZpeGVkUmVzdWx0OiBFeGVjUmVzdWx0ID0ge1xuICAgICAgICAgICAgLi4ucmVzdWx0LFxuICAgICAgICAgICAgYmFja2dyb3VuZFRhc2tJZDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBNaXJyb3IgU2hlbGxDb21tYW5kLiNoYW5kbGVFeGl0J3MgbGFyZ2Utb3V0cHV0IGJyYW5jaCB0aGF0IHdhc1xuICAgICAgICAgIC8vIHNraXBwZWQgYmVjYXVzZSAjYmFja2dyb3VuZFRhc2tJZCB3YXMgc2V0LlxuICAgICAgICAgIGNvbnN0IHsgdGFza091dHB1dCB9ID0gc2hlbGxDb21tYW5kXG4gICAgICAgICAgaWYgKHRhc2tPdXRwdXQuc3Rkb3V0VG9GaWxlICYmICF0YXNrT3V0cHV0Lm91dHB1dEZpbGVSZWR1bmRhbnQpIHtcbiAgICAgICAgICAgIGZpeGVkUmVzdWx0Lm91dHB1dEZpbGVQYXRoID0gdGFza091dHB1dC5wYXRoXG4gICAgICAgICAgICBmaXhlZFJlc3VsdC5vdXRwdXRGaWxlU2l6ZSA9IHRhc2tPdXRwdXQub3V0cHV0RmlsZVNpemVcbiAgICAgICAgICAgIGZpeGVkUmVzdWx0Lm91dHB1dFRhc2tJZCA9IHRhc2tPdXRwdXQudGFza0lkXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIENvbW1hbmQgY29tcGxldGVkIOKAlCBjbGVhbnVwIHN0cmVhbSBsaXN0ZW5lcnMgaGVyZS4gVGhlIGZpbmFsbHlcbiAgICAgICAgICAvLyBibG9jaydzIGd1YXJkICghYmFja2dyb3VuZFNoZWxsSWQgJiYgc3RhdHVzICE9PSAnYmFja2dyb3VuZGVkJylcbiAgICAgICAgICAvLyBjb3JyZWN0bHkgc2tpcHMgY2xlYW51cCBmb3IgKnJ1bm5pbmcqIGJhY2tncm91bmRlZCB0YXNrcywgYnV0XG4gICAgICAgICAgLy8gaW4gdGhpcyByYWNlIHRoZSBwcm9jZXNzIGlzIGRvbmUuIE1hdGNoZXMgQmFzaFRvb2wudHN4OjEzOTkuXG4gICAgICAgICAgc2hlbGxDb21tYW5kLmNsZWFudXAoKVxuICAgICAgICAgIHJldHVybiBmaXhlZFJlc3VsdFxuICAgICAgICB9XG4gICAgICAgIC8vIENvbW1hbmQgaGFzIGNvbXBsZXRlZFxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIGNvbW1hbmQgd2FzIGJhY2tncm91bmRlZCAoYnkgdGltZW91dCBvciBpbnRlcnJ1cHQpXG4gICAgICBpZiAoYmFja2dyb3VuZFNoZWxsSWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGRvdXQ6IGludGVycnVwdEJhY2tncm91bmRpbmdTdGFydGVkID8gZnVsbE91dHB1dCA6ICcnLFxuICAgICAgICAgIHN0ZGVycjogJycsXG4gICAgICAgICAgY29kZTogMCxcbiAgICAgICAgICBpbnRlcnJ1cHRlZDogZmFsc2UsXG4gICAgICAgICAgYmFja2dyb3VuZFRhc2tJZDogYmFja2dyb3VuZFNoZWxsSWQsXG4gICAgICAgICAgYXNzaXN0YW50QXV0b0JhY2tncm91bmRlZCxcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBVc2VyIHN1Ym1pdHRlZCBhIG5ldyBtZXNzYWdlIC0gYmFja2dyb3VuZCBpbnN0ZWFkIG9mIGtpbGxpbmdcbiAgICAgIGlmIChcbiAgICAgICAgYWJvcnRDb250cm9sbGVyLnNpZ25hbC5hYm9ydGVkICYmXG4gICAgICAgIGFib3J0Q29udHJvbGxlci5zaWduYWwucmVhc29uID09PSAnaW50ZXJydXB0JyAmJlxuICAgICAgICAhaW50ZXJydXB0QmFja2dyb3VuZGluZ1N0YXJ0ZWRcbiAgICAgICkge1xuICAgICAgICBpbnRlcnJ1cHRCYWNrZ3JvdW5kaW5nU3RhcnRlZCA9IHRydWVcbiAgICAgICAgaWYgKCFpc0JhY2tncm91bmRUYXNrc0Rpc2FibGVkKSB7XG4gICAgICAgICAgc3RhcnRCYWNrZ3JvdW5kaW5nKCd0ZW5ndV9wb3dlcnNoZWxsX2NvbW1hbmRfaW50ZXJydXB0X2JhY2tncm91bmRlZCcpXG4gICAgICAgICAgLy8gUmVsb29wIHNvIHRoZSBiYWNrZ3JvdW5kU2hlbGxJZCBjaGVjayAoYWJvdmUpIGNhdGNoZXMgdGhlIHN5bmNcbiAgICAgICAgICAvLyBmb3JlZ3JvdW5kVGFza0lk4oaSYmFja2dyb3VuZCBwYXRoLiBXaXRob3V0IHRoaXMsIHdlIGZhbGwgdGhyb3VnaFxuICAgICAgICAgIC8vIHRvIHRoZSBDdHJsK0IgY2hlY2sgYmVsb3csIHdoaWNoIG1hdGNoZXMgc3RhdHVzPT09J2JhY2tncm91bmRlZCdcbiAgICAgICAgICAvLyBhbmQgaW5jb3JyZWN0bHkgcmV0dXJucyBiYWNrZ3JvdW5kZWRCeVVzZXI6dHJ1ZS4gKGJ1Z3MgMDIwLzAyMSlcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIHNoZWxsQ29tbWFuZC5raWxsKClcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBmb3JlZ3JvdW5kIHRhc2sgd2FzIGJhY2tncm91bmRlZCB2aWEgYmFja2dyb3VuZEFsbCgpIChjdHJsK2IpXG4gICAgICBpZiAoZm9yZWdyb3VuZFRhc2tJZCkge1xuICAgICAgICBpZiAoc2hlbGxDb21tYW5kLnN0YXR1cyA9PT0gJ2JhY2tncm91bmRlZCcpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Rkb3V0OiAnJyxcbiAgICAgICAgICAgIHN0ZGVycjogJycsXG4gICAgICAgICAgICBjb2RlOiAwLFxuICAgICAgICAgICAgaW50ZXJydXB0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgYmFja2dyb3VuZFRhc2tJZDogZm9yZWdyb3VuZFRhc2tJZCxcbiAgICAgICAgICAgIGJhY2tncm91bmRlZEJ5VXNlcjogdHJ1ZSxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVGltZSBmb3IgYSBwcm9ncmVzcyB1cGRhdGVcbiAgICAgIGNvbnN0IGVsYXBzZWQgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lXG4gICAgICBjb25zdCBlbGFwc2VkU2Vjb25kcyA9IE1hdGguZmxvb3IoZWxhcHNlZCAvIDEwMDApXG5cbiAgICAgIC8vIFNob3cgYmFja2dyb3VuZGluZyBVSSBoaW50IGFmdGVyIHRocmVzaG9sZFxuICAgICAgaWYgKFxuICAgICAgICAhaXNCYWNrZ3JvdW5kVGFza3NEaXNhYmxlZCAmJlxuICAgICAgICBiYWNrZ3JvdW5kU2hlbGxJZCA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGVsYXBzZWRTZWNvbmRzID49IFBST0dSRVNTX1RIUkVTSE9MRF9NUyAvIDEwMDAgJiZcbiAgICAgICAgc2V0VG9vbEpTWFxuICAgICAgKSB7XG4gICAgICAgIGlmICghZm9yZWdyb3VuZFRhc2tJZCkge1xuICAgICAgICAgIGZvcmVncm91bmRUYXNrSWQgPSByZWdpc3RlckZvcmVncm91bmQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNvbW1hbmQsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB8fCBjb21tYW5kLFxuICAgICAgICAgICAgICBzaGVsbENvbW1hbmQsXG4gICAgICAgICAgICAgIGFnZW50SWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0QXBwU3RhdGUsXG4gICAgICAgICAgICB0b29sVXNlSWQsXG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgc2V0VG9vbEpTWCh7XG4gICAgICAgICAganN4OiA8QmFja2dyb3VuZEhpbnQgLz4sXG4gICAgICAgICAgc2hvdWxkSGlkZVByb21wdElucHV0OiBmYWxzZSxcbiAgICAgICAgICBzaG91bGRDb250aW51ZUFuaW1hdGlvbjogdHJ1ZSxcbiAgICAgICAgICBzaG93U3Bpbm5lcjogdHJ1ZSxcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgeWllbGQge1xuICAgICAgICB0eXBlOiAncHJvZ3Jlc3MnLFxuICAgICAgICBmdWxsT3V0cHV0LFxuICAgICAgICBvdXRwdXQ6IGxhc3RQcm9ncmVzc091dHB1dCxcbiAgICAgICAgZWxhcHNlZFRpbWVTZWNvbmRzOiBlbGFwc2VkU2Vjb25kcyxcbiAgICAgICAgdG90YWxMaW5lczogbGFzdFRvdGFsTGluZXMsXG4gICAgICAgIHRvdGFsQnl0ZXM6IGxhc3RUb3RhbEJ5dGVzLFxuICAgICAgICB0YXNrSWQ6IHNoZWxsQ29tbWFuZC50YXNrT3V0cHV0LnRhc2tJZCxcbiAgICAgICAgLi4uKHRpbWVvdXQgPyB7IHRpbWVvdXRNcyB9IDogdW5kZWZpbmVkKSxcbiAgICAgIH1cblxuICAgICAgbmV4dFByb2dyZXNzVGltZSA9IERhdGUubm93KCkgKyBQUk9HUkVTU19JTlRFUlZBTF9NU1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBUYXNrT3V0cHV0LnN0b3BQb2xsaW5nKHNoZWxsQ29tbWFuZC50YXNrT3V0cHV0LnRhc2tJZClcbiAgICAvLyBFbnN1cmUgY2xlYW51cCBydW5zIG9uIGV2ZXJ5IGV4aXQgcGF0aCAoc3VjY2VzcywgcmVqZWN0aW9uLCBhYm9ydCkuXG4gICAgLy8gU2tpcCB3aGVuIGJhY2tncm91bmRlZCDigJQgTG9jYWxTaGVsbFRhc2sgb3ducyBjbGVhbnVwIGZvciB0aG9zZS5cbiAgICAvLyBNYXRjaGVzIG1haW4gIzIxMTA1LlxuICAgIGlmICghYmFja2dyb3VuZFNoZWxsSWQgJiYgc2hlbGxDb21tYW5kLnN0YXR1cyAhPT0gJ2JhY2tncm91bmRlZCcpIHtcbiAgICAgIGlmIChmb3JlZ3JvdW5kVGFza0lkKSB7XG4gICAgICAgIHVucmVnaXN0ZXJGb3JlZ3JvdW5kKGZvcmVncm91bmRUYXNrSWQsIHNldEFwcFN0YXRlKVxuICAgICAgfVxuICAgICAgc2hlbGxDb21tYW5kLmNsZWFudXAoKVxuICAgIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTQSxPQUFPLFFBQVEsWUFBWTtBQUNwQyxjQUFjQyxvQkFBb0IsUUFBUSx1Q0FBdUM7QUFDakYsU0FDRUMsUUFBUSxFQUNSQyxJQUFJLElBQUlDLE1BQU0sRUFDZEMsUUFBUSxJQUFJQyxVQUFVLEVBQ3RCQyxJQUFJLFFBQ0MsYUFBYTtBQUNwQixPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLGNBQWNDLFlBQVksUUFBUSw0QkFBNEI7QUFDOUQsY0FBY0MsUUFBUSxRQUFRLHVCQUF1QjtBQUNyRCxTQUFTQyxDQUFDLFFBQVEsUUFBUTtBQUMxQixTQUFTQyxlQUFlLFFBQVEsMEJBQTBCO0FBQzFELFNBQVNDLHVCQUF1QixRQUFRLCtCQUErQjtBQUN2RSxTQUNFLEtBQUtDLDBEQUEwRCxFQUMvREMsUUFBUSxRQUNILG1DQUFtQztBQUMxQyxjQUNFQyxZQUFZLEVBQ1pDLElBQUksRUFDSkMsZ0JBQWdCLEVBQ2hCQyxnQkFBZ0IsUUFDWCxlQUFlO0FBQ3RCLFNBQVNDLFNBQVMsRUFBRSxLQUFLQyxPQUFPLFFBQVEsZUFBZTtBQUN2RCxTQUNFQyxnQ0FBZ0MsRUFDaENDLGdCQUFnQixFQUNoQkMsa0JBQWtCLEVBQ2xCQyxjQUFjLEVBQ2RDLG9CQUFvQixRQUNmLDhDQUE4QztBQUNyRCxjQUFjQyxPQUFPLFFBQVEsb0JBQW9CO0FBQ2pELGNBQWNDLGdCQUFnQixRQUFRLHdCQUF3QjtBQUM5RCxTQUFTQyxzQkFBc0IsUUFBUSxnQ0FBZ0M7QUFDdkUsU0FBU0MsV0FBVyxRQUFRLHlCQUF5QjtBQUNyRCxTQUNFQyxZQUFZLElBQUlDLGVBQWUsRUFDL0JDLFVBQVUsUUFDTCx1QkFBdUI7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
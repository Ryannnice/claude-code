// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { unwatchFile, watchFile } from 'fs'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 pickBy，将 lodash-es/pickBy.js 中已经封装好的能力接到本文件流程里。
import pickBy from 'lodash-es/pickBy.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join, resolve } from 'path'
// 引入 getOriginalCwd、getSessionTrustAccepted，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd, getSessionTrustAccepted } from '../bootstrap/state.js'
// 引入 getAutoMemEntrypoint，将 ../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { getAutoMemEntrypoint } from '../memdir/paths.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 类型依赖 { McpServerConfig } 来自 ../services/mcp/types.js，用于校准共享工具的数据契约。
import type { McpServerConfig } from '../services/mcp/types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  BillingType,
  ReferralEligibilityResponse,
} from '../services/oauth/types.js'
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js'
// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 logForDiagnosticsNoPII，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from './diagLogs.js'
// 引入 getGlobalClaudeFile，将 ./env.js 中已经封装好的能力接到本文件流程里。
import { getGlobalClaudeFile } from './env.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 引入 ConfigParseError、getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { ConfigParseError, getErrnoCode } from './errors.js'
// 引入 writeFileSyncAndFlush_DEPRECATED，将 ./file.js 中已经封装好的能力接到本文件流程里。
import { writeFileSyncAndFlush_DEPRECATED } from './file.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 findCanonicalGitRoot，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { findCanonicalGitRoot } from './git.js'
// 引入 safeParseJSON，将 ./json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from './json.js'
// 引入 stripBOM，将 ./jsonRead.js 中已经封装好的能力接到本文件流程里。
import { stripBOM } from './jsonRead.js'
// 引入 * as lockfile，将 ./lockfile.js 中已经封装好的能力接到本文件流程里。
import * as lockfile from './lockfile.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 类型依赖 { MemoryType } 来自 ./memory/types.js，用于校准共享工具的数据契约。
import type { MemoryType } from './memory/types.js'
// 引入 normalizePathForConfigKey，将 ./path.js 中已经封装好的能力接到本文件流程里。
import { normalizePathForConfigKey } from './path.js'
// 引入 getEssentialTrafficOnlyReason，将 ./privacyLevel.js 中已经封装好的能力接到本文件流程里。
import { getEssentialTrafficOnlyReason } from './privacyLevel.js'
// 引入 getManagedFilePath，将 ./settings/managedPath.js 中已经封装好的能力接到本文件流程里。
import { getManagedFilePath } from './settings/managedPath.js'
// 类型依赖 { ThemeSetting } 来自 ./theme.js，用于校准共享工具的数据契约。
import type { ThemeSetting } from './theme.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemPaths 路径数据保存`feature`，供共享工具后续处理使用。
const teamMemPaths = feature('TEAMMEM')
  ? (require('../memdir/teamMemPaths.js') as typeof import('../memdir/teamMemPaths.js'))
  : null
// ccrAutoConnect保存`feature`，供共享工具后续处理使用。
const ccrAutoConnect = feature('CCR_AUTO_CONNECT')
  ? (require('../bridge/bridgeEnabled.js') as typeof import('../bridge/bridgeEnabled.js'))
  : null

/* eslint-enable @typescript-eslint/no-require-imports */
// 类型依赖 { ImageDimensions } 来自 ./imageResizer.js，用于校准共享工具的数据契约。
import type { ImageDimensions } from './imageResizer.js'
// 类型依赖 { ModelOption } 来自 ./model/modelOptions.js，用于校准共享工具的数据契约。
import type { ModelOption } from './model/modelOptions.js'
// 引入 jsonParse、jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from './slowOperations.js'

// Re-entrancy guard: prevents getConfig → logEvent → getGlobalConfig → getConfig
// infinite recursion when the config file is corrupted. logEvent's sampling check
// reads GrowthBook features from the global config, which calls getConfig again.
// insideGetConfig 配置标记共享工具 config是否启用对应路径。
let insideGetConfig = false

// Image dimension info for coordinate mapping (only set when image was resized)
// PastedContent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PastedContent = {
  id: number // Sequential numeric ID
  type: 'text' | 'image'
  content: string
  mediaType?: string // e.g., 'image/png', 'image/jpeg'
  filename?: string // Display name for images in attachment slot
  dimensions?: ImageDimensions
  sourcePath?: string // Original file path for images dragged onto the terminal
}

// SerializedStructuredHistoryEntry 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface SerializedStructuredHistoryEntry {
  display: string
  pastedContents?: Record<number, PastedContent>
  pastedText?: string
}
// HistoryEntry 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface HistoryEntry {
  display: string
  pastedContents: Record<number, PastedContent>
}

// ReleaseChannel 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReleaseChannel = 'stable' | 'latest'

// ProjectConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ProjectConfig = {
  allowedTools: string[]
  mcpContextUris: string[]
  mcpServers?: Record<string, McpServerConfig>
  lastAPIDuration?: number
  lastAPIDurationWithoutRetries?: number
  lastToolDuration?: number
  lastCost?: number
  lastDuration?: number
  lastLinesAdded?: number
  lastLinesRemoved?: number
  lastTotalInputTokens?: number
  lastTotalOutputTokens?: number
  lastTotalCacheCreationInputTokens?: number
  lastTotalCacheReadInputTokens?: number
  lastTotalWebSearchRequests?: number
  lastFpsAverage?: number
  lastFpsLow1Pct?: number
  lastSessionId?: string
  lastModelUsage?: Record<
    string,
    {
      inputTokens: number
      outputTokens: number
      cacheReadInputTokens: number
      cacheCreationInputTokens: number
      webSearchRequests: number
      costUSD: number
    }
  >
  lastSessionMetrics?: Record<string, number>
  exampleFiles?: string[]
  exampleFilesGeneratedAt?: number

  // Trust dialog settings
  hasTrustDialogAccepted?: boolean

  hasCompletedProjectOnboarding?: boolean
  projectOnboardingSeenCount: number
  hasClaudeMdExternalIncludesApproved?: boolean
  hasClaudeMdExternalIncludesWarningShown?: boolean
  // MCP server approval fields - migrated to settings but kept for backward compatibility
  enabledMcpjsonServers?: string[]
  disabledMcpjsonServers?: string[]
  enableAllProjectMcpServers?: boolean
  // List of disabled MCP servers (all scopes) - used for enable/disable toggle
  disabledMcpServers?: string[]
  // Opt-in list for built-in MCP servers that default to disabled
  enabledMcpServers?: string[]
  // Worktree session management
  activeWorktreeSession?: {
    originalCwd: string
    worktreePath: string
    worktreeName: string
    originalBranch?: string
    sessionId: string
    hookBased?: boolean
  }
  /** Spawn mode for `claude remote-control` multi-session. Set by first-run dialog or `w` toggle. */
  remoteControlSpawnMode?: 'same-dir' | 'worktree'
}

// DEFAULT_PROJECT_CONFIG 配置 集中保存共享工具 config要一起传递的字段。
const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  allowedTools: [],
  mcpContextUris: [],
  mcpServers: {},
  enabledMcpjsonServers: [],
  disabledMcpjsonServers: [],
  hasTrustDialogAccepted: false,
  projectOnboardingSeenCount: 0,
  hasClaudeMdExternalIncludesApproved: false,
  hasClaudeMdExternalIncludesWarningShown: false,
}

// InstallMethod 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstallMethod = 'local' | 'native' | 'global' | 'unknown'

// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export {
  EDITOR_MODES,
  NOTIFICATION_CHANNELS,
} from './configConstants.js'

// 类型依赖 { EDITOR_MODES, NOTIFICATION_CHANNELS } 来自 ./configConstants.js，用于校准共享工具的数据契约。
import type { EDITOR_MODES, NOTIFICATION_CHANNELS } from './configConstants.js'

// NotificationChannel 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

// AccountInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AccountInfo = {
  accountUuid: string
  emailAddress: string
  organizationUuid?: string
  organizationName?: string | null // added 4/23/2025, not populated for existing users
  organizationRole?: string | null
  workspaceRole?: string | null
  // Populated by /api/oauth/profile
  displayName?: string
  hasExtraUsageEnabled?: boolean
  billingType?: BillingType | null
  accountCreatedAt?: string
  subscriptionCreatedAt?: string
}

// TODO: 'emacs' is kept for backward compatibility - remove after a few releases
// EditorMode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EditorMode = 'emacs' | (typeof EDITOR_MODES)[number]

// DiffTool 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DiffTool = 'terminal' | 'auto'

// OutputStyle 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type OutputStyle = string

// GlobalConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GlobalConfig = {
  /**
   * @deprecated Use settings.apiKeyHelper instead.
   */
  apiKeyHelper?: string
  projects?: Record<string, ProjectConfig>
  numStartups: number
  installMethod?: InstallMethod
  autoUpdates?: boolean
  // Flag to distinguish protection-based disabling from user preference
  autoUpdatesProtectedForNative?: boolean
  // Session count when Doctor was last shown
  doctorShownAtSession?: number
  userID?: string
  theme: ThemeSetting
  hasCompletedOnboarding?: boolean
  // Tracks the last version that reset onboarding, used with MIN_VERSION_REQUIRING_ONBOARDING_RESET
  lastOnboardingVersion?: string
  // Tracks the last version for which release notes were seen, used for managing release notes
  lastReleaseNotesSeen?: string
  // Timestamp when changelog was last fetched (content stored in ~/.claude/cache/changelog.md)
  changelogLastFetched?: number
  // @deprecated - Migrated to ~/.claude/cache/changelog.md. Keep for migration support.
  cachedChangelog?: string
  mcpServers?: Record<string, McpServerConfig>
  // claude.ai MCP connectors that have successfully connected at least once.
  // Used to gate "connector unavailable" / "needs auth" startup notifications:
  // a connector the user has actually used is worth flagging when it breaks,
  // but an org-configured connector that's been needs-auth since day one is
  // something the user has demonstrably ignored and shouldn't nag about.
  claudeAiMcpEverConnected?: string[]
  preferredNotifChannel: NotificationChannel
  /**
   * @deprecated. Use the Notification hook instead (docs/hooks.md).
   */
  customNotifyCommand?: string
  verbose: boolean
  customApiKeyResponses?: {
    approved?: string[]
    rejected?: string[]
  }
  primaryApiKey?: string // Primary API key for the user when no environment variable is set, set via oauth (TODO: rename)
  hasAcknowledgedCostThreshold?: boolean
  hasSeenUndercoverAutoNotice?: boolean // ant-only: whether the one-time auto-undercover explainer has been shown
  hasSeenUltraplanTerms?: boolean // ant-only: whether the one-time CCR terms notice has been shown in the ultraplan launch dialog
  hasResetAutoModeOptInForDefaultOffer?: boolean // ant-only: one-shot migration guard, re-prompts churned auto-mode users
  oauthAccount?: AccountInfo
  iterm2KeyBindingInstalled?: boolean // Legacy - keeping for backward compatibility
  editorMode?: EditorMode
  bypassPermissionsModeAccepted?: boolean
  hasUsedBackslashReturn?: boolean
  autoCompactEnabled: boolean // Controls whether auto-compact is enabled
  showTurnDuration: boolean // Controls whether to show turn duration message (e.g., "Cooked for 1m 6s")
  /**
   * @deprecated Use settings.env instead.
   */
  env: { [key: string]: string } // Environment variables to set for the CLI
  hasSeenTasksHint?: boolean // Whether the user has seen the tasks hint
  hasUsedStash?: boolean // Whether the user has used the stash feature (Ctrl+S)
  hasUsedBackgroundTask?: boolean // Whether the user has backgrounded a task (Ctrl+B)
  queuedCommandUpHintCount?: number // Counter for how many times the user has seen the queued command up hint
  diffTool?: DiffTool // Which tool to use for displaying diffs (terminal or vscode)

  // Terminal setup state tracking
  iterm2SetupInProgress?: boolean
  iterm2BackupPath?: string // Path to the backup file for iTerm2 preferences
  appleTerminalBackupPath?: string // Path to the backup file for Terminal.app preferences
  appleTerminalSetupInProgress?: boolean // Whether Terminal.app setup is currently in progress

  // Key binding setup tracking
  shiftEnterKeyBindingInstalled?: boolean // Whether Shift+Enter key binding is installed (for iTerm2 or VSCode)
  optionAsMetaKeyInstalled?: boolean // Whether Option as Meta key is installed (for Terminal.app)

  // IDE configurations
  autoConnectIde?: boolean // Whether to automatically connect to IDE on startup if exactly one valid IDE is available
  autoInstallIdeExtension?: boolean // Whether to automatically install IDE extensions when running from within an IDE

  // IDE dialogs
  hasIdeOnboardingBeenShown?: Record<string, boolean> // Map of terminal name to whether IDE onboarding has been shown
  ideHintShownCount?: number // Number of times the /ide command hint has been shown
  hasIdeAutoConnectDialogBeenShown?: boolean // Whether the auto-connect IDE dialog has been shown

  tipsHistory: {
    [tipId: string]: number // Key is tipId, value is the numStartups when tip was last shown
  }

  // /buddy companion soul — bones regenerated from userId on read. See src/buddy/.
  companion?: import('../buddy/types.js').StoredCompanion
  companionMuted?: boolean

  // Feedback survey tracking
  feedbackSurveyState?: {
    lastShownTime?: number
  }

  // Transcript share prompt tracking ("Don't ask again")
  transcriptShareDismissed?: boolean

  // Memory usage tracking
  memoryUsageCount: number // Number of times user has added to memory

  // Sonnet-1M configs
  hasShownS1MWelcomeV2?: Record<string, boolean> // Whether the Sonnet-1M v2 welcome message has been shown per org
  // Cache of Sonnet-1M subscriber access per org - key is org ID
  // hasAccess means "hasAccessAsDefault" but the old name is kept for backward
  // compatibility.
  s1mAccessCache?: Record<
    string,
    { hasAccess: boolean; hasAccessNotAsDefault?: boolean; timestamp: number }
  >
  // Cache of Sonnet-1M PayG access per org - key is org ID
  // hasAccess means "hasAccessAsDefault" but the old name is kept for backward
  // compatibility.
  s1mNonSubscriberAccessCache?: Record<
    string,
    { hasAccess: boolean; hasAccessNotAsDefault?: boolean; timestamp: number }
  >

  // Guest passes eligibility cache per org - key is org ID
  passesEligibilityCache?: Record<
    string,
    ReferralEligibilityResponse & { timestamp: number }
  >

  // Grove config cache per account - key is account UUID
  groveConfigCache?: Record<
    string,
    { grove_enabled: boolean; timestamp: number }
  >

  // Guest passes upsell tracking
  passesUpsellSeenCount?: number // Number of times the guest passes upsell has been shown
  hasVisitedPasses?: boolean // Whether the user has visited /passes command
  passesLastSeenRemaining?: number // Last seen remaining_passes count — reset upsell when it increases

  // Overage credit grant upsell tracking (keyed by org UUID — multi-org users).
  // Inlined shape (not import()) because config.ts is in the SDK build surface
  // and the SDK bundler can't resolve CLI service modules.
  overageCreditGrantCache?: Record<
    string,
    {
      info: {
        available: boolean
        eligible: boolean
        granted: boolean
        amount_minor_units: number | null
        currency: string | null
      }
      timestamp: number
    }
  >
  overageCreditUpsellSeenCount?: number // Number of times the overage credit upsell has been shown
  hasVisitedExtraUsage?: boolean // Whether the user has visited /extra-usage — hides credit upsells

  // Voice mode notice tracking
  voiceNoticeSeenCount?: number // Number of times the voice-mode-available notice has been shown
  voiceLangHintShownCount?: number // Number of times the /voice dictation-language hint has been shown
  voiceLangHintLastLanguage?: string // Resolved STT language code when the hint was last shown — reset count when it changes
  voiceFooterHintSeenCount?: number // Number of sessions the "hold X to speak" footer hint has been shown

  // Opus 1M merge notice tracking
  opus1mMergeNoticeSeenCount?: number // Number of times the opus-1m-merge notice has been shown

  // Experiment enrollment notice tracking (keyed by experiment id)
  experimentNoticesSeenCount?: Record<string, number>

  // OpusPlan experiment config
  hasShownOpusPlanWelcome?: Record<string, boolean> // Whether the OpusPlan welcome message has been shown per org

  // Queue usage tracking
  promptQueueUseCount: number // Number of times use has used the prompt queue

  // Btw usage tracking
  btwUseCount: number // Number of times user has used /btw

  // Plan mode usage tracking
  lastPlanModeUse?: number // Timestamp of last plan mode usage

  // Subscription notice tracking
  subscriptionNoticeCount?: number // Number of times the subscription notice has been shown
  hasAvailableSubscription?: boolean // Cached result of whether user has a subscription available
  subscriptionUpsellShownCount?: number // Number of times the subscription upsell has been shown (deprecated)
  recommendedSubscription?: string // Cached config value from Statsig (deprecated)

  // Todo feature configuration
  todoFeatureEnabled: boolean // Whether the todo feature is enabled
  showExpandedTodos?: boolean // Whether to show todos expanded, even when empty
  showSpinnerTree?: boolean // Whether to show the teammate spinner tree instead of pills

  // First start time tracking
  firstStartTime?: string // ISO timestamp when Claude Code was first started on this machine

  messageIdleNotifThresholdMs: number // How long the user has to have been idle to get a notification that Claude is done generating

  githubActionSetupCount?: number // Number of times the user has set up the GitHub Action
  slackAppInstallCount?: number // Number of times the user has clicked to install the Slack app

  // File checkpointing configuration
  fileCheckpointingEnabled: boolean

  // Terminal progress bar configuration (OSC 9;4)
  terminalProgressBarEnabled: boolean

  // Terminal tab status indicator (OSC 21337). When on, emits a colored
  // dot + status text to the tab sidebar and drops the spinner prefix
  // from the title (the dot makes it redundant).
  showStatusInTerminalTab?: boolean

  // Push-notification toggles (set via /config). Default off — explicit opt-in required.
  taskCompleteNotifEnabled?: boolean
  inputNeededNotifEnabled?: boolean
  agentPushNotifEnabled?: boolean

  // Claude Code usage tracking
  claudeCodeFirstTokenDate?: string // ISO timestamp of the user's first Claude Code OAuth token

  // Model switch callout tracking (ant-only)
  modelSwitchCalloutDismissed?: boolean // Whether user chose "Don't show again"
  modelSwitchCalloutLastShown?: number // Timestamp of last shown (don't show for 24h)
  modelSwitchCalloutVersion?: string

  // Effort callout tracking - shown once for Opus 4.6 users
  effortCalloutDismissed?: boolean // v1 - legacy, read to suppress v2 for Pro users who already saw it
  effortCalloutV2Dismissed?: boolean

  // Remote callout tracking - shown once before first bridge enable
  remoteDialogSeen?: boolean

  // Cross-process backoff for initReplBridge's oauth_expired_unrefreshable skip.
  // `expiresAt` is the dedup key — content-addressed, self-clears when /login
  // replaces the token. `failCount` caps false positives: transient refresh
  // failures (auth server 5xx, lock errors) get 3 retries before backoff kicks
  // in, mirroring useReplBridge's MAX_CONSECUTIVE_INIT_FAILURES. Dead-token
  // accounts cap at 3 config writes; healthy+transient-blip self-heals in ~210s.
  bridgeOauthDeadExpiresAt?: number
  bridgeOauthDeadFailCount?: number

  // Desktop upsell startup dialog tracking
  desktopUpsellSeenCount?: number // Total showings (max 3)
  desktopUpsellDismissed?: boolean // "Don't ask again" picked

  // Idle-return dialog tracking
  idleReturnDismissed?: boolean // "Don't ask again" picked

  // Opus 4.5 Pro migration tracking
  opusProMigrationComplete?: boolean
  opusProMigrationTimestamp?: number

  // Sonnet 4.5 1m migration tracking
  sonnet1m45MigrationComplete?: boolean

  // Opus 4.0/4.1 → current Opus migration (shows one-time notif)
  legacyOpusMigrationTimestamp?: number

  // Sonnet 4.5 → 4.6 migration (pro/max/team premium)
  sonnet45To46MigrationTimestamp?: number

  // Cached statsig gate values
  cachedStatsigGates: {
    [gateName: string]: boolean
  }

  // Cached statsig dynamic configs
  cachedDynamicConfigs?: { [configName: string]: unknown }

  // Cached GrowthBook feature values
  cachedGrowthBookFeatures?: { [featureName: string]: unknown }

  // Local GrowthBook overrides (ant-only, set via /config Gates tab).
  // Checked after env-var overrides but before the real resolved value.
  growthBookOverrides?: { [featureName: string]: unknown }

  // Emergency tip tracking - stores the last shown tip to prevent re-showing
  lastShownEmergencyTip?: string

  // File picker gitignore behavior
  respectGitignore: boolean // Whether file picker should respect .gitignore files (default: true). Note: .ignore files are always respected

  // Copy command behavior
  copyFullResponse: boolean // Whether /copy always copies the full response instead of showing the picker

  // Fullscreen in-app text selection behavior
  copyOnSelect?: boolean // Auto-copy to clipboard on mouse-up (undefined → true; lets cmd+c "work" via no-op)

  // GitHub repo path mapping for teleport directory switching
  // Key: "owner/repo" (lowercase), Value: array of absolute paths where repo is cloned
  githubRepoPaths?: Record<string, string[]>

  // Terminal emulator to launch for claude-cli:// deep links. Captured from
  // TERM_PROGRAM during interactive sessions since the deep link handler runs
  // headless (LaunchServices/xdg) with no TERM_PROGRAM set.
  deepLinkTerminal?: string

  // iTerm2 it2 CLI setup
  iterm2It2SetupComplete?: boolean // Whether it2 setup has been verified
  preferTmuxOverIterm2?: boolean // User preference to always use tmux over iTerm2 split panes

  // Skill usage tracking for autocomplete ranking
  skillUsage?: Record<string, { usageCount: number; lastUsedAt: number }>
  // Official marketplace auto-install tracking
  officialMarketplaceAutoInstallAttempted?: boolean // Whether auto-install was attempted
  officialMarketplaceAutoInstalled?: boolean // Whether auto-install succeeded
  officialMarketplaceAutoInstallFailReason?:
    | 'policy_blocked'
    | 'git_unavailable'
    | 'gcs_unavailable'
    | 'unknown' // Reason for failure if applicable
  officialMarketplaceAutoInstallRetryCount?: number // Number of retry attempts
  officialMarketplaceAutoInstallLastAttemptTime?: number // Timestamp of last attempt
  officialMarketplaceAutoInstallNextRetryTime?: number // Earliest time to retry again

  // Claude in Chrome settings
  hasCompletedClaudeInChromeOnboarding?: boolean // Whether Claude in Chrome onboarding has been shown
  claudeInChromeDefaultEnabled?: boolean // Whether Claude in Chrome is enabled by default (undefined means platform default)
  cachedChromeExtensionInstalled?: boolean // Cached result of whether Chrome extension is installed

  // Chrome extension pairing state (persisted across sessions)
  chromeExtension?: {
    pairedDeviceId?: string
    pairedDeviceName?: string
  }

  // LSP plugin recommendation preferences
  lspRecommendationDisabled?: boolean // Disable all LSP plugin recommendations
  lspRecommendationNeverPlugins?: string[] // Plugin IDs to never suggest
  lspRecommendationIgnoredCount?: number // Track ignored recommendations (stops after 5)

  // Claude Code hint protocol state (<claude-code-hint /> tags from CLIs/SDKs).
  // Nested by hint type so future types (docs, mcp, ...) slot in without new
  // top-level keys.
  claudeCodeHints?: {
    // Plugin IDs the user has already been prompted for. Show-once semantics:
    // recorded regardless of yes/no response, never re-prompted. Capped at
    // 100 entries to bound config growth — past that, hints stop entirely.
    plugin?: string[]
    // User chose "don't show plugin installation hints again" from the dialog.
    disabled?: boolean
  }

  // Permission explainer configuration
  permissionExplainerEnabled?: boolean // Enable Haiku-generated explanations for permission requests (default: true)

  // Teammate spawn mode: 'auto' | 'tmux' | 'in-process'
  teammateMode?: 'auto' | 'tmux' | 'in-process' // How to spawn teammates (default: 'auto')
  // Model for new teammates when the tool call doesn't pass one.
  // undefined = hardcoded Opus (backward-compat); null = leader's model; string = model alias/ID.
  teammateDefaultModel?: string | null

  // PR status footer configuration (feature-flagged via GrowthBook)
  prStatusFooterEnabled?: boolean // Show PR review status in footer (default: true)

  // Tmux live panel visibility (ant-only, toggled via Enter on tmux pill)
  tungstenPanelVisible?: boolean

  // Cached org-level fast mode status from the API.
  // Used to detect cross-session changes and notify users.
  penguinModeOrgEnabled?: boolean

  // Epoch ms when background refreshes last ran (fast mode, quota, passes, client data).
  // Used with tengu_cicada_nap_ms to throttle API calls
  startupPrefetchedAt?: number

  // Run Remote Control at startup (requires BRIDGE_MODE)
  // undefined = use default (see getRemoteControlAtStartup() for precedence)
  remoteControlAtStartup?: boolean

  // Cached extra usage disabled reason from the last API response
  // undefined = no cache, null = extra usage enabled, string = disabled reason.
  cachedExtraUsageDisabledReason?: string | null

  // Auto permissions notification tracking (ant-only)
  autoPermissionsNotificationCount?: number // Number of times the auto permissions notification has been shown

  // Speculation configuration (ant-only)
  speculationEnabled?: boolean // Whether speculation is enabled (default: true)


  // Client data for server-side experiments (fetched during bootstrap).
  clientDataCache?: Record<string, unknown> | null

  // Additional model options for the model picker (fetched during bootstrap).
  additionalModelOptionsCache?: ModelOption[]

  // Disk cache for /api/claude_code/organizations/metrics_enabled.
  // Org-level settings change rarely; persisting across processes avoids a
  // cold API call on every `claude -p` invocation.
  metricsStatusCache?: {
    enabled: boolean
    timestamp: number
  }

  // Version of the last-applied migration set. When equal to
  // CURRENT_MIGRATION_VERSION, runMigrations() skips all sync migrations
  // (avoiding 11× saveGlobalConfig lock+re-read on every startup).
  migrationVersion?: number
}

/**
 * Factory for a fresh default GlobalConfig. Used instead of deep-cloning a
 * shared constant — the nested containers (arrays, records) are all empty, so
 * a factory gives fresh refs at zero clone cost.
 */
// createDefaultGlobalConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createDefaultGlobalConfig(): GlobalConfig {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    numStartups: 0,
    installMethod: undefined,
    autoUpdates: undefined,
    theme: 'dark',
    preferredNotifChannel: 'auto',
    verbose: false,
    editorMode: 'normal',
    autoCompactEnabled: true,
    showTurnDuration: true,
    hasSeenTasksHint: false,
    hasUsedStash: false,
    hasUsedBackgroundTask: false,
    queuedCommandUpHintCount: 0,
    diffTool: 'auto',
    customApiKeyResponses: {
      approved: [],
      rejected: [],
    },
    env: {},
    tipsHistory: {},
    memoryUsageCount: 0,
    promptQueueUseCount: 0,
    btwUseCount: 0,
    todoFeatureEnabled: true,
    showExpandedTodos: false,
    messageIdleNotifThresholdMs: 60000,
    autoConnectIde: false,
    autoInstallIdeExtension: true,
    fileCheckpointingEnabled: true,
    terminalProgressBarEnabled: true,
    cachedStatsigGates: {},
    cachedDynamicConfigs: {},
    cachedGrowthBookFeatures: {},
    respectGitignore: true,
    copyFullResponse: false,
  }
}

// DEFAULT_GLOBAL_CONFIG 配置 命名 `createDefaultGlobalConfig()`，让后续代码直接表达这个值的用途。
export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = createDefaultGlobalConfig()

// GLOBAL_CONFIG_KEYS 配置 聚合成有序列表，保持后续遍历顺序稳定。
export const GLOBAL_CONFIG_KEYS = [
  'apiKeyHelper',
  'installMethod',
  'autoUpdates',
  'autoUpdatesProtectedForNative',
  'theme',
  'verbose',
  'preferredNotifChannel',
  'shiftEnterKeyBindingInstalled',
  'editorMode',
  'hasUsedBackslashReturn',
  'autoCompactEnabled',
  'showTurnDuration',
  'diffTool',
  'env',
  'tipsHistory',
  'todoFeatureEnabled',
  'showExpandedTodos',
  'messageIdleNotifThresholdMs',
  'autoConnectIde',
  'autoInstallIdeExtension',
  'fileCheckpointingEnabled',
  'terminalProgressBarEnabled',
  'showStatusInTerminalTab',
  'taskCompleteNotifEnabled',
  'inputNeededNotifEnabled',
  'agentPushNotifEnabled',
  'respectGitignore',
  'claudeInChromeDefaultEnabled',
  'hasCompletedClaudeInChromeOnboarding',
  'lspRecommendationDisabled',
  'lspRecommendationNeverPlugins',
  'lspRecommendationIgnoredCount',
  'copyFullResponse',
  'copyOnSelect',
  'permissionExplainerEnabled',
  'prStatusFooterEnabled',
  'remoteControlAtStartup',
  'remoteDialogSeen',
] as const

// GlobalConfigKey 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GlobalConfigKey = (typeof GLOBAL_CONFIG_KEYS)[number]

// isGlobalConfigKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isGlobalConfigKey(key: string): key is GlobalConfigKey {
  // 返回 `GLOBAL_CONFIG_KEYS.includes(key as GlobalConfigKey)`，作为共享工具这次计算的结果。
  return GLOBAL_CONFIG_KEYS.includes(key as GlobalConfigKey)
}

// PROJECT_CONFIG_KEYS 配置 聚合成有序列表，保持后续遍历顺序稳定。
export const PROJECT_CONFIG_KEYS = [
  'allowedTools',
  'hasTrustDialogAccepted',
  'hasCompletedProjectOnboarding',
] as const

// ProjectConfigKey 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ProjectConfigKey = (typeof PROJECT_CONFIG_KEYS)[number]

/**
 * Check if the user has already accepted the trust dialog for the cwd.
 *
 * This function traverses parent directories to check if a parent directory
 * had approval. Accepting trust for a directory implies trust for child
 * directories.
 *
 * @returns Whether the trust dialog has been accepted (i.e. "should not be shown")
 */
// _trustAccepted标记共享工具 config是否启用对应路径。
let _trustAccepted = false

// resetTrustDialogAcceptedCacheForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetTrustDialogAcceptedCacheForTesting(): void {
  // _trustAccepted更新为 `false`，确保共享工具后续读取最新状态。
  _trustAccepted = false
}

// checkHasTrustDialogAccepted 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkHasTrustDialogAccepted(): boolean {
  // Trust only transitions false→true during a session (never the reverse),
  // so once true we can latch it. false is not cached — it gets re-checked
  // on every call so that trust dialog acceptance is picked up mid-session.
  // (lodash memoize doesn't fit here because it would also cache false.)
  // 返回 `(_trustAccepted ||= computeTrustDialogAccepted())`，作为共享工具这次计算的结果。
  return (_trustAccepted ||= computeTrustDialogAccepted())
}

// computeTrustDialogAccepted 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeTrustDialogAccepted(): boolean {
  // Check session-level trust (for home directory case where trust is not persisted)
  // When running from home dir, trust dialog is shown but acceptance is stored
  // in memory only. This allows hooks and other features to work during the session.
  // 满足 `getSessionTrustAccepted()` 时，共享工具执行该分支。
  if (getSessionTrustAccepted()) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()

  // Always check where trust would be saved (git root or original cwd)
  // This is the primary location where trust is persisted by saveCurrentProjectConfig
  // projectPath 路径数据读取`getProjectPathForConfig`，供共享工具后续处理使用。
  const projectPath = getProjectPathForConfig()
  // projectConfig 配置读取 `config.projects?.[projectPath]` 对应条目，后续围绕该成员继续处理。
  const projectConfig = config.projects?.[projectPath]
  // 满足 `projectConfig?.hasTrustDialogAccepted` 时，共享工具执行该分支。
  if (projectConfig?.hasTrustDialogAccepted) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Now check from current working directory and its parents
  // Normalize paths for consistent JSON key lookup
  // currentPath 路径数据保存`normalizePathForConfigKey`，供共享工具后续处理使用。
  let currentPath = normalizePathForConfigKey(getCwd())

  // Traverse all parent directories
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // pathConfig 路径数据保存`config.projects?.[currentPath]`，供共享工具 config后续判断或输出使用。
    const pathConfig = config.projects?.[currentPath]
    // 满足 `pathConfig?.hasTrustDialogAccepted` 时，共享工具执行该分支。
    if (pathConfig?.hasTrustDialogAccepted) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // parentPath 路径数据保存`normalizePathForConfigKey`，供共享工具后续处理使用。
    const parentPath = normalizePathForConfigKey(resolve(currentPath, '..'))
    // Stop if we've reached the root (when parent is same as current)
    // 满足 `parentPath === currentPath` 时，共享工具执行该分支。
    if (parentPath === currentPath) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // currentPath 路径数据更新为 `parentPath`，确保共享工具后续读取最新状态。
    currentPath = parentPath
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check trust for an arbitrary directory (not the session cwd).
 * Walks up from `dir`, returning true if any ancestor has trust persisted.
 * Unlike checkHasTrustDialogAccepted, this does NOT consult session trust or
 * the memoized project path — use when the target dir differs from cwd (e.g.
 * /assistant installing into a user-typed path).
 */
// isPathTrusted 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPathTrusted(dir: string): boolean {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // currentPath 路径数据保存`normalizePathForConfigKey`，供共享工具后续处理使用。
  let currentPath = normalizePathForConfigKey(resolve(dir))
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 满足 `config.projects?.[currentPath]?.hasTrustDialogAccepted` 时，共享工具执行该分支。
    if (config.projects?.[currentPath]?.hasTrustDialogAccepted) return true
    // parentPath 路径数据保存`normalizePathForConfigKey`，供共享工具后续处理使用。
    const parentPath = normalizePathForConfigKey(resolve(currentPath, '..'))
    // 满足 `parentPath === currentPath` 时，共享工具执行该分支。
    if (parentPath === currentPath) return false
    // currentPath 路径数据更新为 `parentPath`，确保共享工具后续读取最新状态。
    currentPath = parentPath
  }
}

// We have to put this test code here because Jest doesn't support mocking ES modules :O
// TEST_GLOBAL_CONFIG_FOR_TESTING 配置 集中保存共享工具 config要一起传递的字段。
const TEST_GLOBAL_CONFIG_FOR_TESTING: GlobalConfig = {
  ...DEFAULT_GLOBAL_CONFIG,
  autoUpdates: false,
}
// TEST_PROJECT_CONFIG_FOR_TESTING 配置 集中保存共享工具 config要一起传递的字段。
const TEST_PROJECT_CONFIG_FOR_TESTING: ProjectConfig = {
  ...DEFAULT_PROJECT_CONFIG,
}

// isProjectConfigKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isProjectConfigKey(key: string): key is ProjectConfigKey {
  // 返回 `PROJECT_CONFIG_KEYS.includes(key as ProjectConfigKey)`，作为共享工具这次计算的结果。
  return PROJECT_CONFIG_KEYS.includes(key as ProjectConfigKey)
}

/**
 * Detect whether writing `fresh` would lose auth/onboarding state that the
 * in-memory cache still has. This happens when `getConfig` hits a corrupted
 * or truncated file mid-write (from another process or a non-atomic fallback)
 * and returns DEFAULT_GLOBAL_CONFIG. Writing that back would permanently
 * wipe auth. See GH #3117.
 */
// wouldLoseAuthState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function wouldLoseAuthState(fresh: {
  oauthAccount?: unknown
  hasCompletedOnboarding?: boolean
}): boolean {
  // cached 缓存保存`globalConfigCache.config`，供共享工具 config后续判断或输出使用。
  const cached = globalConfigCache.config
  // cached 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cached) return false
  // lostOauth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const lostOauth =
    cached.oauthAccount !== undefined && fresh.oauthAccount === undefined
  // lostOnboarding 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const lostOnboarding =
    cached.hasCompletedOnboarding === true &&
    fresh.hasCompletedOnboarding !== true
  // 返回 `lostOauth || lostOnboarding`，作为共享工具这次计算的结果。
  return lostOauth || lostOnboarding
}

// saveGlobalConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveGlobalConfig(
  // 这个回调绑定到 updater: (currentConfig: GlobalConfig) => GlobalConfig,，负责共享工具在该局部场景下的响应。
  updater: (currentConfig: GlobalConfig) => GlobalConfig,
): void {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 配置保存`updater`，供共享工具后续处理使用。
    const config = updater(TEST_GLOBAL_CONFIG_FOR_TESTING)
    // Skip if no changes (same reference returned)
    // 满足 `config === TEST_GLOBAL_CONFIG_FOR_TESTING` 时，共享工具执行该分支。
    if (config === TEST_GLOBAL_CONFIG_FOR_TESTING) {
      // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 Object.assign，触发共享工具此处需要的副作用。
    Object.assign(TEST_GLOBAL_CONFIG_FOR_TESTING, config)
    // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // written初始化为空值，后续分支会在有数据时补齐。
  let written: GlobalConfig | null = null
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // didWrite记录 `saveConfigWithLock` 是否成立，共享工具随后按该结果分支。
    const didWrite = saveConfigWithLock(
      getGlobalClaudeFile(),
      createDefaultGlobalConfig,
      // current更新为 `> {`，确保共享工具后续读取最新状态。
      current => {
        // 配置保存`updater`，供共享工具后续处理使用。
        const config = updater(current)
        // Skip if no changes (same reference returned)
        // 满足 `config === current` 时，共享工具执行该分支。
        if (config === current) {
          // 返回 `current`，作为共享工具这次计算的结果。
          return current
        }
        // written更新为 `{`，确保共享工具后续读取最新状态。
        written = {
          ...config,
          projects: removeProjectHistory(current.projects),
        }
        // 返回 `written`，作为共享工具这次计算的结果。
        return written
      },
    )
    // Only write-through if we actually wrote. If the auth-loss guard
    // tripped (or the updater made no changes), the file is untouched and
    // the cache is still valid -- touching it would corrupt the guard.
    // 只有 `didWrite && written` 满足时，共享工具才执行该分支。
    if (didWrite && written) {
      // 调用 writeThroughGlobalConfigCache，触发共享工具此处需要的副作用。
      writeThroughGlobalConfigCache(written)
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to save config with lock: ${error}`, {
      level: 'error',
    })
    // Fall back to non-locked version on error. This fallback is a race
    // window: if another process is mid-write (or the file got truncated),
    // getConfig returns defaults. Refuse to write those over a good cached
    // config to avoid wiping auth. See GH #3117.
    // currentConfig 配置读取`getConfig`，供共享工具后续处理使用。
    const currentConfig = getConfig(
      getGlobalClaudeFile(),
      createDefaultGlobalConfig,
    )
    // 满足 `wouldLoseAuthState(currentConfig)` 时，共享工具执行该分支。
    if (wouldLoseAuthState(currentConfig)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'saveGlobalConfig fallback: re-read config is missing auth that cache has; refusing to write. See GH #3117.',
        { level: 'error' },
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_config_auth_loss_prevented', {})
      // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 配置保存`updater`，供共享工具后续处理使用。
    const config = updater(currentConfig)
    // Skip if no changes (same reference returned)
    // 满足 `config === currentConfig` 时，共享工具执行该分支。
    if (config === currentConfig) {
      // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // written更新为 `{`，确保共享工具后续读取最新状态。
    written = {
      ...config,
      projects: removeProjectHistory(currentConfig.projects),
    }
    // 调用 saveConfig，触发共享工具此处需要的副作用。
    saveConfig(getGlobalClaudeFile(), written, DEFAULT_GLOBAL_CONFIG)
    // 调用 writeThroughGlobalConfigCache，触发共享工具此处需要的副作用。
    writeThroughGlobalConfigCache(written)
  }
}

// Cache for global config
// globalConfigCache 配置 集中保存共享工具 config要一起传递的字段。
let globalConfigCache: { config: GlobalConfig | null; mtime: number } = {
  config: null,
  mtime: 0,
}

// Tracking for config file operations (telemetry)
// lastReadFileStats 文件数据初始化为空值，后续分支会在有数据时补齐。
let lastReadFileStats: { mtime: number; size: number } | null = null
// configCacheHits 配置 命名 `0`，让后续代码直接表达这个值的用途。
let configCacheHits = 0
// configCacheMisses 配置保存`0`，供后续判断或组装使用。
let configCacheMisses = 0
// Session-total count of actual disk writes to the global config file.
// Exposed for ant-only dev diagnostics (see inc-4552) so anomalous write
// rates surface in the UI before they corrupt ~/.claude.json.
// globalConfigWriteCount 配置 命名 `0`，让后续代码直接表达这个值的用途。
let globalConfigWriteCount = 0

// getGlobalConfigWriteCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGlobalConfigWriteCount(): number {
  // 返回 `globalConfigWriteCount`，作为共享工具这次计算的结果。
  return globalConfigWriteCount
}

// CONFIG_WRITE_DISPLAY_THRESHOLD 配置保存`20`，供后续判断或组装使用。
export const CONFIG_WRITE_DISPLAY_THRESHOLD = 20

// reportConfigCacheStats 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function reportConfigCacheStats(): void {
  // total 命名 `configCacheHits + configCacheMisses`，让后续代码直接表达这个值的用途。
  const total = configCacheHits + configCacheMisses
  // 满足 `total > 0` 时，共享工具执行该分支。
  if (total > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_config_cache_stats', {
      cache_hits: configCacheHits,
      cache_misses: configCacheMisses,
      hit_rate: configCacheHits / total,
    })
  }
  // configCacheHits 配置更新为 `0`，确保共享工具后续读取最新状态。
  configCacheHits = 0
  // configCacheMisses 配置更新为 `0`，确保共享工具后续读取最新状态。
  configCacheMisses = 0
}

// Register cleanup to report cache stats at session end
// eslint-disable-next-line custom-rules/no-top-level-side-effects
// 调用 registerCleanup，触发共享工具此处需要的副作用。
registerCleanup(async () => {
  // 调用 reportConfigCacheStats，触发共享工具此处需要的副作用。
  reportConfigCacheStats()
})

/**
 * Migrates old autoUpdaterStatus to new installMethod and autoUpdates fields
 * @internal
 */
// migrateConfigFields 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function migrateConfigFields(config: GlobalConfig): GlobalConfig {
  // Already migrated
  // `config.installMethod` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (config.installMethod !== undefined) {
    // 返回 `config`，作为共享工具这次计算的结果。
    return config
  }

  // autoUpdaterStatus is removed from the type but may exist in old configs
  // legacy保存`config as GlobalConfig & {`，供共享工具 config后续判断或输出使用。
  const legacy = config as GlobalConfig & {
    autoUpdaterStatus?:
      | 'migrated'
      | 'installed'
      | 'disabled'
      | 'enabled'
      | 'no_permissions'
      | 'not_configured'
  }

  // Determine install method and auto-update preference from old field
  // installMethod保存`'unknown'`，作为后续固定文本处理的输入。
  let installMethod: InstallMethod = 'unknown'
  // autoUpdates 集合保存`config.autoUpdates ?? true // Default to enabled unless e...`，供共享工具 config后续判断或输出使用。
  let autoUpdates = config.autoUpdates ?? true // Default to enabled unless explicitly disabled

  // 按照 legacy.autoUpdaterStatus 的取值选择共享工具的具体处理分支。
  switch (legacy.autoUpdaterStatus) {
    case 'migrated':
      // installMethod更新为 `'local'`，确保共享工具后续读取最新状态。
      installMethod = 'local'
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'installed':
      // installMethod更新为 `'native'`，确保共享工具后续读取最新状态。
      installMethod = 'native'
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'disabled':
      // When disabled, we don't know the install method
      // autoUpdates 集合更新为 `false`，确保共享工具后续读取最新状态。
      autoUpdates = false
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'enabled':
    case 'no_permissions':
    case 'not_configured':
      // These imply global installation
      // installMethod更新为 `'global'`，确保共享工具后续读取最新状态。
      installMethod = 'global'
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case undefined:
      // No old status, keep defaults
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...config,
    installMethod,
    autoUpdates,
  }
}

/**
 * Removes history field from projects (migrated to history.jsonl)
 * @internal
 */
// removeProjectHistory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function removeProjectHistory(
  projects: Record<string, ProjectConfig> | undefined,
): Record<string, ProjectConfig> | undefined {
  // projects 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!projects) {
    // 返回 `projects`，作为共享工具这次计算的结果。
    return projects
  }

  // cleanedProjects 集合 从空对象开始收集键值，后续按名称补齐内容。
  const cleanedProjects: Record<string, ProjectConfig> = {}
  // needsCleaning标记共享工具 config是否启用对应路径。
  let needsCleaning = false

  // 循环处理 `const [path, projectConfig] of Object.entries(projects)`，让共享工具把同类条目按顺序走完。
  for (const [path, projectConfig] of Object.entries(projects)) {
    // history is removed from the type but may exist in old configs
    // legacy保存`projectConfig as ProjectConfig & { history?: unknown }`，供共享工具 config后续判断或输出使用。
    const legacy = projectConfig as ProjectConfig & { history?: unknown }
    // `legacy.history` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (legacy.history !== undefined) {
      // needsCleaning更新为 `true`，确保共享工具后续读取最新状态。
      needsCleaning = true
      // 从 `legacy` 解构 history、其余 cleanedConfig，减少共享工具 config对同一对象的重复访问。
      const { history, ...cleanedConfig } = legacy
      // cleanedProjects[path 路径数据更新为 `cleanedConfig`，确保共享工具 config后续读取最新状态。
      cleanedProjects[path] = cleanedConfig
    } else {
      // cleanedProjects[path 路径数据更新为 `projectConfig`，确保共享工具 config后续读取最新状态。
      cleanedProjects[path] = projectConfig
    }
  }

  // 返回 `needsCleaning ? cleanedProjects : projects`，作为共享工具这次计算的结果。
  return needsCleaning ? cleanedProjects : projects
}

// fs.watchFile poll interval for detecting writes from other instances (ms)
// CONFIG_FRESHNESS_POLL_MS 配置 命名 `1000`，让后续代码直接表达这个值的用途。
const CONFIG_FRESHNESS_POLL_MS = 1000
// freshnessWatcherStarted标记共享工具 config是否启用对应路径。
let freshnessWatcherStarted = false

// fs.watchFile polls stat on the libuv threadpool and only calls us when mtime
// changed — a stalled stat never blocks the main thread.
// startGlobalConfigFreshnessWatcher 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startGlobalConfigFreshnessWatcher(): void {
  // 当 `freshnessWatcherStarted || process.env.NODE...` 匹配 `'test'` 时，共享工具执行对应分支。
  if (freshnessWatcherStarted || process.env.NODE_ENV === 'test') return
  // freshnessWatcherStarted更新为 `true`，确保共享工具后续读取最新状态。
  freshnessWatcherStarted = true
  // file 文件数据读取`getGlobalClaudeFile`，供共享工具后续处理使用。
  const file = getGlobalClaudeFile()
  // 调用 watchFile，触发共享工具此处需要的副作用。
  watchFile(
    file,
    { interval: CONFIG_FRESHNESS_POLL_MS, persistent: false },
    // curr更新为 `> {`，确保共享工具后续读取最新状态。
    curr => {
      // Our own writes fire this too — the write-through's Date.now()
      // overshoot makes cache.mtime > file mtime, so we skip the re-read.
      // Bun/Node also fire with curr.mtimeMs=0 when the file doesn't exist
      // (initial callback or deletion) — the <= handles that too.
      // 满足 `curr.mtimeMs <= globalConfigCache.mtime` 时，共享工具执行该分支。
      if (curr.mtimeMs <= globalConfigCache.mtime) return
      // 显式忽略 `getFsImplementation()` 的返回值，只保留它触发的副作用。
      void getFsImplementation()
        .readFile(file, { encoding: 'utf-8' })
        // 链式调用 then，继续加工上一行在共享工具中产生的数据。
        .then(content => {
          // A write-through may have advanced the cache while we were reading;
          // don't regress to the stale snapshot watchFile stat'd.
          // 满足 `curr.mtimeMs <= globalConfigCache.mtime` 时，共享工具执行该分支。
          if (curr.mtimeMs <= globalConfigCache.mtime) return
          // 解析结果保存`safeParseJSON`，供共享工具后续处理使用。
          const parsed = safeParseJSON(stripBOM(content))
          // `parsed === null || typeof parsed` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
          if (parsed === null || typeof parsed !== 'object') return
          // globalConfigCache 配置更新为 `{`，确保共享工具后续读取最新状态。
          globalConfigCache = {
            config: migrateConfigFields({
              ...createDefaultGlobalConfig(),
              ...(parsed as Partial<GlobalConfig>),
            }),
            mtime: curr.mtimeMs,
          }
          // lastReadFileStats 文件数据更新为 `{ mtime: curr.mtimeMs, size: curr.size }`，确保共享工具后续读取最新状态。
          lastReadFileStats = { mtime: curr.mtimeMs, size: curr.size }
        })
        // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
        .catch(() => {})
    },
  )
  // 调用 registerCleanup，触发共享工具此处需要的副作用。
  registerCleanup(async () => {
    // 调用 unwatchFile，触发共享工具此处需要的副作用。
    unwatchFile(file)
    // freshnessWatcherStarted更新为 `false`，确保共享工具后续读取最新状态。
    freshnessWatcherStarted = false
  })
}

// Write-through: what we just wrote IS the new config. cache.mtime overshoots
// the file's real mtime (Date.now() is recorded after the write) so the
// freshness watcher skips re-reading our own write on its next tick.
// writeThroughGlobalConfigCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function writeThroughGlobalConfigCache(config: GlobalConfig): void {
  // globalConfigCache 配置更新为 `{ config, mtime: Date.now() }`，确保共享工具后续读取最新状态。
  globalConfigCache = { config, mtime: Date.now() }
  // lastReadFileStats 文件数据更新为 `null`，确保共享工具后续读取最新状态。
  lastReadFileStats = null
}

// getGlobalConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGlobalConfig(): GlobalConfig {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 返回 `TEST_GLOBAL_CONFIG_FOR_TESTING`，作为共享工具这次计算的结果。
    return TEST_GLOBAL_CONFIG_FOR_TESTING
  }

  // Fast path: pure memory read. After startup, this always hits — our own
  // writes go write-through and other instances' writes are picked up by the
  // background freshness watcher (never blocks this path).
  // 满足 `globalConfigCache.config` 时，共享工具执行该分支。
  if (globalConfigCache.config) {
    // 共享工具 config在这里处理 `configCacheHits++`，完成这一小步状态转换。
    configCacheHits++
    // 返回 `globalConfigCache.config`，作为共享工具这次计算的结果。
    return globalConfigCache.config
  }

  // Slow path: startup load. Sync I/O here is acceptable because it runs
  // exactly once, before any UI is rendered. Stat before read so any race
  // self-corrects (old mtime + new content → watcher re-reads next tick).
  // 共享工具 config在这里处理 `configCacheMisses++`，完成这一小步状态转换。
  configCacheMisses++
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合 命名 `null`，让后续代码直接表达这个值的用途。
    let stats: { mtimeMs: number; size: number } | null = null
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合更新为 `getFsImplementation().statSync(getGlobalClaudeFile())`，确保共享工具后续读取最新状态。
      stats = getFsImplementation().statSync(getGlobalClaudeFile())
    } catch {
      // File doesn't exist
    }
    // 配置保存`migrateConfigFields`，供共享工具后续处理使用。
    const config = migrateConfigFields(
      getConfig(getGlobalClaudeFile(), createDefaultGlobalConfig),
    )
    // globalConfigCache 配置更新为 `{`，确保共享工具后续读取最新状态。
    globalConfigCache = {
      config,
      mtime: stats?.mtimeMs ?? Date.now(),
    }
    // lastReadFileStats 文件数据更新为 `stats`，确保共享工具后续读取最新状态。
    lastReadFileStats = stats
      ? { mtime: stats.mtimeMs, size: stats.size }
      : null
    // 调用 startGlobalConfigFreshnessWatcher，触发共享工具此处需要的副作用。
    startGlobalConfigFreshnessWatcher()
    // 返回 `config`，作为共享工具这次计算的结果。
    return config
  } catch {
    // If anything goes wrong, fall back to uncached behavior
    // 返回 `migrateConfigFields(`，作为共享工具这次计算的结果。
    return migrateConfigFields(
      getConfig(getGlobalClaudeFile(), createDefaultGlobalConfig),
    )
  }
}

/**
 * Returns the effective value of remoteControlAtStartup. Precedence:
 *   1. User's explicit config value (always wins — honors opt-out)
 *   2. CCR auto-connect default (ant-only build, GrowthBook-gated)
 *   3. false (Remote Control must be explicitly opted into)
 */
// getRemoteControlAtStartup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRemoteControlAtStartup(): boolean {
  // explicit读取`getGlobalConfig`，供共享工具后续处理使用。
  const explicit = getGlobalConfig().remoteControlAtStartup
  // `explicit` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (explicit !== undefined) return explicit
  // 满足 `feature('CCR_AUTO_CONNECT')` 时，共享工具执行该分支。
  if (feature('CCR_AUTO_CONNECT')) {
    // 满足 `ccrAutoConnect?.getCcrAutoConnectDefault()` 时，共享工具执行该分支。
    if (ccrAutoConnect?.getCcrAutoConnectDefault()) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// getCustomApiKeyStatus 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCustomApiKeyStatus(
  truncatedApiKey: string,
): 'approved' | 'rejected' | 'new' {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // 满足 `config.customApiKeyResponses?.approved?.includes(truncatedApiKey)` 时，共享工具执行该分支。
  if (config.customApiKeyResponses?.approved?.includes(truncatedApiKey)) {
    // 返回 `'approved'`，作为共享工具这次计算的结果。
    return 'approved'
  }
  // 满足 `config.customApiKeyResponses?.rejected?.includes(truncatedApiKey)` 时，共享工具执行该分支。
  if (config.customApiKeyResponses?.rejected?.includes(truncatedApiKey)) {
    // 返回 `'rejected'`，作为共享工具这次计算的结果。
    return 'rejected'
  }
  // 返回 `'new'`，作为共享工具这次计算的结果。
  return 'new'
}

// saveConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function saveConfig<A extends object>(
  file: string,
  config: A,
  defaultConfig: A,
): void {
  // Ensure the directory exists before writing the config file
  // dir保存`dirname`，供共享工具后续处理使用。
  const dir = dirname(file)
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // mkdirSync is already recursive in FsOperations implementation
  // 调用 fs.mkdirSync，触发共享工具此处需要的副作用。
  fs.mkdirSync(dir)

  // Filter out any values that match the defaults
  // filteredConfig 配置保存`pickBy`，供共享工具后续处理使用。
  const filteredConfig = pickBy(
    config,
    // 这个回调绑定到 (value, key) =>，负责共享工具在该局部场景下的响应。
    (value, key) =>
      jsonStringify(value) !== jsonStringify(defaultConfig[key as keyof A]),
  )
  // Write config file with secure permissions - mode only applies to new files
  // 调用 writeFileSyncAndFlush_DEPRECATED，触发共享工具此处需要的副作用。
  writeFileSyncAndFlush_DEPRECATED(
    file,
    jsonStringify(filteredConfig, null, 2),
    {
      encoding: 'utf-8',
      mode: 0o600,
    },
  )
  // 满足 `file === getGlobalClaudeFile()` 时，共享工具执行该分支。
  if (file === getGlobalClaudeFile()) {
    // 共享工具 config在这里处理 `globalConfigWriteCount++`，完成这一小步状态转换。
    globalConfigWriteCount++
  }
}

/**
 * Returns true if a write was performed; false if the write was skipped
 * (no changes, or auth-loss guard tripped). Callers use this to decide
 * whether to invalidate the cache -- invalidating after a skipped write
 * destroys the good cached state the auth-loss guard depends on.
 */
// saveConfigWithLock 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function saveConfigWithLock<A extends object>(
  file: string,
  // 这个回调绑定到 createDefault: () => A,，负责共享工具在该局部场景下的响应。
  createDefault: () => A,
  // 这个回调绑定到 mergeFn: (current: A) => A,，负责共享工具在该局部场景下的响应。
  mergeFn: (current: A) => A,
): boolean {
  // defaultConfig 配置构建`createDefault`，供共享工具后续处理使用。
  const defaultConfig = createDefault()
  // dir保存`dirname`，供共享工具后续处理使用。
  const dir = dirname(file)
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // Ensure directory exists (mkdirSync is already recursive in FsOperations)
  // 调用 fs.mkdirSync，触发共享工具此处需要的副作用。
  fs.mkdirSync(dir)

  // release 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let release
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // lockFilePath 路径数据保存``${file}.lock``，作为后续固定文本处理的输入。
    const lockFilePath = `${file}.lock`
    // startTime记录时间`Date.now`，供共享工具后续处理使用。
    const startTime = Date.now()
    // release更新为 `lockfile.lockSync(file, {`，确保共享工具后续读取最新状态。
    release = lockfile.lockSync(file, {
      lockfilePath: lockFilePath,
      // 这个回调绑定到 onCompromised: err => {，负责共享工具在该局部场景下的响应。
      onCompromised: err => {
        // Default onCompromised throws from a setTimeout callback, which
        // becomes an unhandled exception. Log instead -- the lock being
        // stolen (e.g. after a 10s event-loop stall) is recoverable.
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Config lock compromised: ${err}`, { level: 'error' })
      },
    })
    // lockTime记录时间`Date.now`，供共享工具后续处理使用。
    const lockTime = Date.now() - startTime
    // 满足 `lockTime > 100` 时，共享工具执行该分支。
    if (lockTime > 100) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Lock acquisition took longer than expected - another Claude instance may be running',
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_config_lock_contention', {
        lock_time_ms: lockTime,
      })
    }

    // Check for stale write - file changed since we last read it
    // Only check for global config file since lastReadFileStats tracks that specific file
    // 只有 `lastReadFileStats && file === getGlobalClaudeFile()` 满足时，共享工具才执行该分支。
    if (lastReadFileStats && file === getGlobalClaudeFile()) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // currentStats 集合保存`fs.statSync`，供共享工具后续处理使用。
        const currentStats = fs.statSync(file)
        // 共享工具在这里按实际状态进入对应分支。
        if (
          currentStats.mtimeMs !== lastReadFileStats.mtime ||
          currentStats.size !== lastReadFileStats.size
        ) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_config_stale_write', {
            read_mtime: lastReadFileStats.mtime,
            write_mtime: currentStats.mtimeMs,
            read_size: lastReadFileStats.size,
            write_size: currentStats.size,
          })
        }
      } catch (e) {
        // code读取`getErrnoCode`，供共享工具后续处理使用。
        const code = getErrnoCode(e)
        // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
        if (code !== 'ENOENT') {
          // 抛出 e，阻止共享工具在无效状态下继续运行。
          throw e
        }
        // File doesn't exist yet, no stale check needed
      }
    }

    // Re-read the current config to get latest state. If the file is
    // momentarily corrupted (concurrent writes, kill-during-write), this
    // returns defaults -- we must not write those back over good config.
    // currentConfig 配置读取`getConfig`，供共享工具后续处理使用。
    const currentConfig = getConfig(file, createDefault)
    // 只有 `file === getGlobalClaudeFile() && wouldLoseAuthState(currentConfig)` 满足时，共享工具才执行该分支。
    if (file === getGlobalClaudeFile() && wouldLoseAuthState(currentConfig)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'saveConfigWithLock: re-read config is missing auth that cache has; refusing to write to avoid wiping ~/.claude.json. See GH #3117.',
        { level: 'error' },
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_config_auth_loss_prevented', {})
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Apply the merge function to get the updated config
    // mergedConfig 配置保存`mergeFn`，供共享工具后续处理使用。
    const mergedConfig = mergeFn(currentConfig)

    // Skip write if no changes (same reference returned)
    // 满足 `mergedConfig === currentConfig` 时，共享工具执行该分支。
    if (mergedConfig === currentConfig) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Filter out any values that match the defaults
    // filteredConfig 配置保存`pickBy`，供共享工具后续处理使用。
    const filteredConfig = pickBy(
      mergedConfig,
      // 这个回调绑定到 (value, key) =>，负责共享工具在该局部场景下的响应。
      (value, key) =>
        jsonStringify(value) !== jsonStringify(defaultConfig[key as keyof A]),
    )

    // Create timestamped backup of existing config before writing
    // We keep multiple backups to prevent data loss if a reset/corrupted config
    // overwrites a good backup. Backups are stored in ~/.claude/backups/ to
    // keep the home directory clean.
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // fileBase 文件数据保存`basename`，供共享工具后续处理使用。
      const fileBase = basename(file)
      // backupDir读取`getConfigBackupDir`，供共享工具后续处理使用。
      const backupDir = getConfigBackupDir()

      // Ensure backup directory exists
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 调用 fs.mkdirSync，触发共享工具此处需要的副作用。
        fs.mkdirSync(backupDir)
      } catch (mkdirErr) {
        // mkdirCode读取`getErrnoCode`，供共享工具后续处理使用。
        const mkdirCode = getErrnoCode(mkdirErr)
        // `mkdirCode` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
        if (mkdirCode !== 'EEXIST') {
          // 抛出 mkdirErr，阻止共享工具在无效状态下继续运行。
          throw mkdirErr
        }
      }

      // Check existing backups first -- skip creating a new one if a recent
      // backup already exists. During startup, many saveGlobalConfig calls fire
      // within milliseconds of each other; without this check, each call
      // creates a new backup file that accumulates on disk.
      // MIN_BACKUP_INTERVAL_MS 集合保存`60_000`，供后续判断或组装使用。
      const MIN_BACKUP_INTERVAL_MS = 60_000
      // existingBackups 集合 命名 `fs`，让后续代码直接表达这个值的用途。
      const existingBackups = fs
        .readdirStringSync(backupDir)
        // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
        .filter(f => f.startsWith(`${fileBase}.backup.`))
        .sort()
        .reverse() // Most recent first (timestamps sort lexicographically)

      // mostRecentBackup保存`existingBackups[0]`，供共享工具 config后续判断或输出使用。
      const mostRecentBackup = existingBackups[0]
      // mostRecentTimestamp 命名 `mostRecentBackup`，让后续代码直接表达这个值的用途。
      const mostRecentTimestamp = mostRecentBackup
        ? Number(mostRecentBackup.split('.backup.').pop())
        : 0
      // shouldCreateBackup 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const shouldCreateBackup =
        Number.isNaN(mostRecentTimestamp) ||
        Date.now() - mostRecentTimestamp >= MIN_BACKUP_INTERVAL_MS

      // 满足 `shouldCreateBackup` 时，共享工具执行该分支。
      if (shouldCreateBackup) {
        // backupPath 路径数据格式化`join`，供共享工具后续处理使用。
        const backupPath = join(backupDir, `${fileBase}.backup.${Date.now()}`)
        // 调用 fs.copyFileSync，触发共享工具此处需要的副作用。
        fs.copyFileSync(file, backupPath)
      }

      // Clean up old backups, keeping only the 5 most recent
      // MAX_BACKUPS 集合 命名 `5`，让后续代码直接表达这个值的用途。
      const MAX_BACKUPS = 5
      // Re-read if we just created one; otherwise reuse the list
      // backupsForCleanup保存`shouldCreateBackup`，供后续判断或组装使用。
      const backupsForCleanup = shouldCreateBackup
        ? fs
            .readdirStringSync(backupDir)
            // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
            .filter(f => f.startsWith(`${fileBase}.backup.`))
            .sort()
            .reverse()
        : existingBackups

      // 逐项读取 `backupsForCleanup.slice(MAX_BACKUPS)` 中的oldBackup，按输入顺序推进共享工具。
      for (const oldBackup of backupsForCleanup.slice(MAX_BACKUPS)) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 调用 fs.unlinkSync，触发共享工具此处需要的副作用。
          fs.unlinkSync(join(backupDir, oldBackup))
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (e) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(e)
      // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
      if (code !== 'ENOENT') {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to backup config: ${e}`, {
          level: 'error',
        })
      }
      // No file to backup or backup failed, continue with write
    }

    // Write config file with secure permissions - mode only applies to new files
    // 调用 writeFileSyncAndFlush_DEPRECATED，触发共享工具此处需要的副作用。
    writeFileSyncAndFlush_DEPRECATED(
      file,
      jsonStringify(filteredConfig, null, 2),
      {
        encoding: 'utf-8',
        mode: 0o600,
      },
    )
    // 满足 `file === getGlobalClaudeFile()` 时，共享工具执行该分支。
    if (file === getGlobalClaudeFile()) {
      // 共享工具 config在这里处理 `globalConfigWriteCount++`，完成这一小步状态转换。
      globalConfigWriteCount++
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 调用 release，触发共享工具此处需要的副作用。
      release()
    }
  }
}

// Flag to track if config reading is allowed
// configReadingAllowed 配置标记共享工具 config是否启用对应路径。
let configReadingAllowed = false

// enableConfigs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function enableConfigs(): void {
  // 满足 `configReadingAllowed` 时，共享工具执行该分支。
  if (configReadingAllowed) {
    // Ensure this is idempotent
    // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
  logForDiagnosticsNoPII('info', 'enable_configs_started')

  // Any reads to configuration before this flag is set show an console warning
  // to prevent us from adding config reading during module initialization
  // configReadingAllowed 配置更新为 `true`，确保共享工具后续读取最新状态。
  configReadingAllowed = true
  // We only check the global config because currently all the configs share a file
  // 调用 getConfig，触发共享工具此处需要的副作用。
  getConfig(
    getGlobalClaudeFile(),
    createDefaultGlobalConfig,
    true /* throw on invalid */,
  )

  // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
  logForDiagnosticsNoPII('info', 'enable_configs_completed', {
    duration_ms: Date.now() - startTime,
  })
}

/**
 * Returns the directory where config backup files are stored.
 * Uses ~/.claude/backups/ to keep the home directory clean.
 */
// getConfigBackupDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfigBackupDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'backups')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'backups')
}

/**
 * Find the most recent backup file for a given config file.
 * Checks ~/.claude/backups/ first, then falls back to the legacy location
 * (next to the config file) for backwards compatibility.
 * Returns the full path to the most recent backup, or null if none exist.
 */
// findMostRecentBackup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findMostRecentBackup(file: string): string | null {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // fileBase 文件数据保存`basename`，供共享工具后续处理使用。
  const fileBase = basename(file)
  // backupDir读取`getConfigBackupDir`，供共享工具后续处理使用。
  const backupDir = getConfigBackupDir()

  // Check the new backup directory first
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // backups 集合保存`fs`，供共享工具 config后续判断或输出使用。
    const backups = fs
      .readdirStringSync(backupDir)
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(f => f.startsWith(`${fileBase}.backup.`))
      .sort()

    // mostRecent保存`backups.at`，供共享工具后续处理使用。
    const mostRecent = backups.at(-1) // Timestamps sort lexicographically
    // 满足 `mostRecent` 时，共享工具执行该分支。
    if (mostRecent) {
      // 返回 `join(backupDir, mostRecent)`，作为共享工具这次计算的结果。
      return join(backupDir, mostRecent)
    }
  } catch {
    // Backup dir doesn't exist yet
  }

  // Fall back to legacy location (next to the config file)
  // fileDir 文件数据保存`dirname`，供共享工具后续处理使用。
  const fileDir = dirname(file)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // backups 集合保存`fs`，供共享工具 config后续判断或输出使用。
    const backups = fs
      .readdirStringSync(fileDir)
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(f => f.startsWith(`${fileBase}.backup.`))
      .sort()

    // mostRecent保存`backups.at`，供共享工具后续处理使用。
    const mostRecent = backups.at(-1) // Timestamps sort lexicographically
    // 满足 `mostRecent` 时，共享工具执行该分支。
    if (mostRecent) {
      // 返回 `join(fileDir, mostRecent)`，作为共享工具这次计算的结果。
      return join(fileDir, mostRecent)
    }

    // Check for legacy backup file (no timestamp)
    // legacyBackup固定为 ``${file}.backup``，作为共享工具 config后续展示或比较的基准。
    const legacyBackup = `${file}.backup`
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 调用 fs.statSync，触发共享工具此处需要的副作用。
      fs.statSync(legacyBackup)
      // 返回 `legacyBackup`，作为共享工具这次计算的结果。
      return legacyBackup
    } catch {
      // Legacy backup doesn't exist
    }
  } catch {
    // Ignore errors reading directory
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// getConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfig<A>(
  file: string,
  // 这个回调绑定到 createDefault: () => A,，负责共享工具在该局部场景下的响应。
  createDefault: () => A,
  throwOnInvalid?: boolean,
): A {
  // Log a warning if config is accessed before it's allowed
  // 只有 `!configReadingAllowed && process.env.NODE_ENV !==` 满足时，共享工具才执行该分支。
  if (!configReadingAllowed && process.env.NODE_ENV !== 'test') {
    // 抛出 new Error('Config accessed before allowed.')，阻止共享工具在无效状态下继续运行。
    throw new Error('Config accessed before allowed.')
  }

  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fileContent 文件数据读取`fs.readFileSync`，供共享工具后续处理使用。
    const fileContent = fs.readFileSync(file, {
      encoding: 'utf-8',
    })
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Strip BOM before parsing - PowerShell 5.x adds BOM to UTF-8 files
      // parsedConfig 配置解析`jsonParse`，供共享工具后续处理使用。
      const parsedConfig = jsonParse(stripBOM(fileContent))
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        ...createDefault(),
        ...parsedConfig,
      }
    } catch (error) {
      // Throw a ConfigParseError with the file path and default config
      // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      // 抛出 new ConfigParseError(errorMessage, file, createDefault())，阻止共享工具在无效状态下继续运行。
      throw new ConfigParseError(errorMessage, file, createDefault())
    }
  } catch (error) {
    // Handle file not found - check for backup and return default
    // errCode读取`getErrnoCode`，供共享工具后续处理使用。
    const errCode = getErrnoCode(error)
    // 当 `errCode` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (errCode === 'ENOENT') {
      // backupPath 路径数据筛选`findMostRecentBackup`，供共享工具后续处理使用。
      const backupPath = findMostRecentBackup(file)
      // 满足 `backupPath` 时，共享工具执行该分支。
      if (backupPath) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          `\nClaude configuration file not found at: ${file}\n` +
            `A backup file exists at: ${backupPath}\n` +
            `You can manually restore it by running: cp "${backupPath}" "${file}"\n\n`,
        )
      }
      // 返回 `createDefault()`，作为共享工具这次计算的结果。
      return createDefault()
    }

    // Re-throw ConfigParseError if throwOnInvalid is true
    // 只有 `error instanceof ConfigParseError && throwOnInval` 满足时，共享工具才执行该分支。
    if (error instanceof ConfigParseError && throwOnInvalid) {
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }

    // Log config parse errors so users know what happened
    // 满足 `error instanceof ConfigParseError` 时，共享工具执行该分支。
    if (error instanceof ConfigParseError) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Config file corrupted, resetting to defaults: ${error.message}`,
        { level: 'error' },
      )

      // Guard: logEvent → shouldSampleEvent → getGlobalConfig → getConfig
      // causes infinite recursion when the config file is corrupted, because
      // the sampling check reads a GrowthBook feature from global config.
      // Only log analytics on the outermost call.
      // insideGetConfig 配置缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!insideGetConfig) {
        // insideGetConfig 配置更新为 `true`，确保共享工具后续读取最新状态。
        insideGetConfig = true
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // Log the error for monitoring
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(error)

          // Log analytics event for config corruption
          // hasBackup标记共享工具 config是否启用对应路径。
          let hasBackup = false
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // 调用 fs.statSync，触发共享工具此处需要的副作用。
            fs.statSync(`${file}.backup`)
            // hasBackup更新为 `true`，确保共享工具后续读取最新状态。
            hasBackup = true
          } catch {
            // No backup
          }
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_config_parse_error', {
            has_backup: hasBackup,
          })
        } finally {
          // insideGetConfig 配置更新为 `false`，确保共享工具后续读取最新状态。
          insideGetConfig = false
        }
      }

      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        `\nClaude configuration file at ${file} is corrupted: ${error.message}\n`,
      )

      // Try to backup the corrupted config file (only if not already backed up)
      // fileBase 文件数据保存`basename`，供共享工具后续处理使用。
      const fileBase = basename(file)
      // corruptedBackupDir读取`getConfigBackupDir`，供共享工具后续处理使用。
      const corruptedBackupDir = getConfigBackupDir()

      // Ensure backup directory exists
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 调用 fs.mkdirSync，触发共享工具此处需要的副作用。
        fs.mkdirSync(corruptedBackupDir)
      } catch (mkdirErr) {
        // mkdirCode读取`getErrnoCode`，供共享工具后续处理使用。
        const mkdirCode = getErrnoCode(mkdirErr)
        // `mkdirCode` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
        if (mkdirCode !== 'EEXIST') {
          // 抛出 mkdirErr，阻止共享工具在无效状态下继续运行。
          throw mkdirErr
        }
      }

      // existingCorruptedBackups 集合 命名 `fs`，让后续代码直接表达这个值的用途。
      const existingCorruptedBackups = fs
        .readdirStringSync(corruptedBackupDir)
        // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
        .filter(f => f.startsWith(`${fileBase}.corrupted.`))

      // corruptedBackupPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
      let corruptedBackupPath: string | undefined
      // alreadyBackedUp标记共享工具 config是否启用对应路径。
      let alreadyBackedUp = false

      // Check if current corrupted content matches any existing backup
      // currentContent读取`fs.readFileSync`，供共享工具后续处理使用。
      const currentContent = fs.readFileSync(file, { encoding: 'utf-8' })
      // 按顺序遍历 `existingCorruptedBackups` 中的backup，逐个交给共享工具处理。
      for (const backup of existingCorruptedBackups) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // backupContent读取`fs.readFileSync`，供共享工具后续处理使用。
          const backupContent = fs.readFileSync(
            join(corruptedBackupDir, backup),
            { encoding: 'utf-8' },
          )
          // 满足 `currentContent === backupContent` 时，共享工具执行该分支。
          if (currentContent === backupContent) {
            // alreadyBackedUp更新为 `true`，确保共享工具后续读取最新状态。
            alreadyBackedUp = true
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
        } catch {
          // Ignore read errors on backups
        }
      }

      // alreadyBackedUp缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!alreadyBackedUp) {
        // corruptedBackupPath 路径数据更新为 `join(`，确保共享工具后续读取最新状态。
        corruptedBackupPath = join(
          corruptedBackupDir,
          `${fileBase}.corrupted.${Date.now()}`,
        )
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 调用 fs.copyFileSync，触发共享工具此处需要的副作用。
          fs.copyFileSync(file, corruptedBackupPath)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Corrupted config backed up to: ${corruptedBackupPath}`,
            {
              level: 'error',
            },
          )
        } catch {
          // Ignore backup errors
        }
      }

      // Notify user about corrupted config and available backup
      // backupPath 路径数据筛选`findMostRecentBackup`，供共享工具后续处理使用。
      const backupPath = findMostRecentBackup(file)
      // 满足 `corruptedBackupPath` 时，共享工具执行该分支。
      if (corruptedBackupPath) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          `The corrupted file has been backed up to: ${corruptedBackupPath}\n`,
        )
      // 共享工具 config在这里处理 `} else if (alreadyBackedUp) {`，完成这一小步状态转换。
      } else if (alreadyBackedUp) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(`The corrupted file has already been backed up.\n`)
      }

      // 满足 `backupPath` 时，共享工具执行该分支。
      if (backupPath) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          `A backup file exists at: ${backupPath}\n` +
            `You can manually restore it by running: cp "${backupPath}" "${file}"\n\n`,
        )
      } else {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(`\n`)
      }
    }

    // 返回 `createDefault()`，作为共享工具这次计算的结果。
    return createDefault()
  }
}

// Memoized function to get the project path for config lookup
// getProjectPathForConfig 路径数据保存`memoize`，供共享工具后续处理使用。
export const getProjectPathForConfig = memoize((): string => {
  // originalCwd读取`getOriginalCwd`，供共享工具后续处理使用。
  const originalCwd = getOriginalCwd()
  // gitRoot筛选`findCanonicalGitRoot`，供共享工具后续处理使用。
  const gitRoot = findCanonicalGitRoot(originalCwd)

  // 满足 `gitRoot` 时，共享工具执行该分支。
  if (gitRoot) {
    // Normalize for consistent JSON keys (forward slashes on all platforms)
    // This ensures paths like C:\Users\... and C:/Users/... map to the same key
    // 返回 `normalizePathForConfigKey(gitRoot)`，作为共享工具这次计算的结果。
    return normalizePathForConfigKey(gitRoot)
  }

  // Not in a git repo
  // 返回 `normalizePathForConfigKey(resolve(originalCwd))`，作为共享工具这次计算的结果。
  return normalizePathForConfigKey(resolve(originalCwd))
})

// getCurrentProjectConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentProjectConfig(): ProjectConfig {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 返回 `TEST_PROJECT_CONFIG_FOR_TESTING`，作为共享工具这次计算的结果。
    return TEST_PROJECT_CONFIG_FOR_TESTING
  }

  // absolutePath 路径数据读取`getProjectPathForConfig`，供共享工具后续处理使用。
  const absolutePath = getProjectPathForConfig()
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()

  // config.projects 配置缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!config.projects) {
    // 返回 `DEFAULT_PROJECT_CONFIG`，作为共享工具这次计算的结果。
    return DEFAULT_PROJECT_CONFIG
  }

  // projectConfig 配置保存`config.projects[absolutePath] ?? DEFAULT_PROJECT_CONFIG`，供共享工具 config后续判断或输出使用。
  const projectConfig = config.projects[absolutePath] ?? DEFAULT_PROJECT_CONFIG
  // Not sure how this became a string
  // TODO: Fix upstream
  // 当 `typeof projectConfig.allowedTools` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof projectConfig.allowedTools === 'string') {
    // 共享工具 config在这里处理 `projectConfig.allowedTools =`，完成这一小步状态转换。
    projectConfig.allowedTools =
      (safeParseJSON(projectConfig.allowedTools) as string[]) ?? []
  }

  // 返回 `projectConfig`，作为共享工具这次计算的结果。
  return projectConfig
}

// saveCurrentProjectConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveCurrentProjectConfig(
  // 这个回调绑定到 updater: (currentConfig: ProjectConfig) => ProjectConfig,，负责共享工具在该局部场景下的响应。
  updater: (currentConfig: ProjectConfig) => ProjectConfig,
): void {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 配置保存`updater`，供共享工具后续处理使用。
    const config = updater(TEST_PROJECT_CONFIG_FOR_TESTING)
    // Skip if no changes (same reference returned)
    // 满足 `config === TEST_PROJECT_CONFIG_FOR_TESTING` 时，共享工具执行该分支。
    if (config === TEST_PROJECT_CONFIG_FOR_TESTING) {
      // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 Object.assign，触发共享工具此处需要的副作用。
    Object.assign(TEST_PROJECT_CONFIG_FOR_TESTING, config)
    // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // absolutePath 路径数据读取`getProjectPathForConfig`，供共享工具后续处理使用。
  const absolutePath = getProjectPathForConfig()

  // written初始化为空值，后续分支会在有数据时补齐。
  let written: GlobalConfig | null = null
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // didWrite记录 `saveConfigWithLock` 是否成立，共享工具随后按该结果分支。
    const didWrite = saveConfigWithLock(
      getGlobalClaudeFile(),
      createDefaultGlobalConfig,
      // current更新为 `> {`，确保共享工具后续读取最新状态。
      current => {
        // currentProjectConfig 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const currentProjectConfig =
          current.projects?.[absolutePath] ?? DEFAULT_PROJECT_CONFIG
        // newProjectConfig 配置保存`updater`，供共享工具后续处理使用。
        const newProjectConfig = updater(currentProjectConfig)
        // Skip if no changes (same reference returned)
        // 满足 `newProjectConfig === currentProjectConfig` 时，共享工具执行该分支。
        if (newProjectConfig === currentProjectConfig) {
          // 返回 `current`，作为共享工具这次计算的结果。
          return current
        }
        // written更新为 `{`，确保共享工具后续读取最新状态。
        written = {
          ...current,
          projects: {
            ...current.projects,
            [absolutePath]: newProjectConfig,
          },
        }
        // 返回 `written`，作为共享工具这次计算的结果。
        return written
      },
    )
    // 只有 `didWrite && written` 满足时，共享工具才执行该分支。
    if (didWrite && written) {
      // 调用 writeThroughGlobalConfigCache，触发共享工具此处需要的副作用。
      writeThroughGlobalConfigCache(written)
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to save config with lock: ${error}`, {
      level: 'error',
    })

    // Same race window as saveGlobalConfig's fallback -- refuse to write
    // defaults over good cached config. See GH #3117.
    // 配置读取`getConfig`，供共享工具后续处理使用。
    const config = getConfig(getGlobalClaudeFile(), createDefaultGlobalConfig)
    // 满足 `wouldLoseAuthState(config)` 时，共享工具执行该分支。
    if (wouldLoseAuthState(config)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'saveCurrentProjectConfig fallback: re-read config is missing auth that cache has; refusing to write. See GH #3117.',
        { level: 'error' },
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_config_auth_loss_prevented', {})
      // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // currentProjectConfig 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const currentProjectConfig =
      config.projects?.[absolutePath] ?? DEFAULT_PROJECT_CONFIG
    // newProjectConfig 配置保存`updater`，供共享工具后续处理使用。
    const newProjectConfig = updater(currentProjectConfig)
    // Skip if no changes (same reference returned)
    // 满足 `newProjectConfig === currentProjectConfig` 时，共享工具执行该分支。
    if (newProjectConfig === currentProjectConfig) {
      // 共享工具 config在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // written更新为 `{`，确保共享工具后续读取最新状态。
    written = {
      ...config,
      projects: {
        ...config.projects,
        [absolutePath]: newProjectConfig,
      },
    }
    // 调用 saveConfig，触发共享工具此处需要的副作用。
    saveConfig(getGlobalClaudeFile(), written, DEFAULT_GLOBAL_CONFIG)
    // 调用 writeThroughGlobalConfigCache，触发共享工具此处需要的副作用。
    writeThroughGlobalConfigCache(written)
  }
}

// isAutoUpdaterDisabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoUpdaterDisabled(): boolean {
  // 返回 `getAutoUpdaterDisabledReason() !== null`，作为共享工具这次计算的结果。
  return getAutoUpdaterDisabledReason() !== null
}

/**
 * Returns true if plugin autoupdate should be skipped.
 * This checks if the auto-updater is disabled AND the FORCE_AUTOUPDATE_PLUGINS
 * env var is not set to 'true'. The env var allows forcing plugin autoupdate
 * even when the auto-updater is otherwise disabled.
 */
// shouldSkipPluginAutoupdate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldSkipPluginAutoupdate(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    isAutoUpdaterDisabled() &&
    !isEnvTruthy(process.env.FORCE_AUTOUPDATE_PLUGINS)
  )
}

// AutoUpdaterDisabledReason 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AutoUpdaterDisabledReason =
  | { type: 'development' }
  | { type: 'env'; envVar: string }
  | { type: 'config' }

// formatAutoUpdaterDisabledReason 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatAutoUpdaterDisabledReason(
  reason: AutoUpdaterDisabledReason,
): string {
  // 按照 reason.type 的取值选择共享工具的具体处理分支。
  switch (reason.type) {
    case 'development':
      // 返回 `'development build'`，作为共享工具这次计算的结果。
      return 'development build'
    case 'env':
      // 返回 ``${reason.envVar} set``，作为共享工具这次计算的结果。
      return `${reason.envVar} set`
    case 'config':
      // 返回 `'config'`，作为共享工具这次计算的结果。
      return 'config'
  }
}

// getAutoUpdaterDisabledReason 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoUpdaterDisabledReason(): AutoUpdaterDisabledReason | null {
  // 当 `process.env.NODE_ENV` 匹配 `'development'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'development') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'development' }
  }
  // 满足 `isEnvTruthy(process.env.DISABLE_AUTOUPDATER)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.DISABLE_AUTOUPDATER)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'env', envVar: 'DISABLE_AUTOUPDATER' }
  }
  // essentialTrafficEnvVar读取`getEssentialTrafficOnlyReason`，供共享工具后续处理使用。
  const essentialTrafficEnvVar = getEssentialTrafficOnlyReason()
  // 满足 `essentialTrafficEnvVar` 时，共享工具执行该分支。
  if (essentialTrafficEnvVar) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'env', envVar: essentialTrafficEnvVar }
  }
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // 共享工具在这里按实际状态进入对应分支。
  if (
    config.autoUpdates === false &&
    (config.installMethod !== 'native' ||
      config.autoUpdatesProtectedForNative !== true)
  ) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { type: 'config' }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// getOrCreateUserID 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOrCreateUserID(): string {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // 满足 `config.userID` 时，共享工具执行该分支。
  if (config.userID) {
    // 返回 `config.userID`，作为共享工具这次计算的结果。
    return config.userID
  }

  // userID保存`randomBytes`，供共享工具后续处理使用。
  const userID = randomBytes(32).toString('hex')
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => ({ ...current, userID }))
  // 返回 `userID`，作为共享工具这次计算的结果。
  return userID
}

// recordFirstStartTime 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordFirstStartTime(): void {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // config.firstStartTime 配置缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!config.firstStartTime) {
    // firstStartTime记录时间`Date`，供共享工具后续处理使用。
    const firstStartTime = new Date().toISOString()
    // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      firstStartTime: current.firstStartTime ?? firstStartTime,
    }))
  }
}

// getMemoryPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMemoryPath(memoryType: MemoryType): string {
  // cwd读取`getOriginalCwd`，供共享工具后续处理使用。
  const cwd = getOriginalCwd()

  // 按照 memoryType 的取值选择共享工具的具体处理分支。
  switch (memoryType) {
    case 'User':
      // 返回 `join(getClaudeConfigHomeDir(), 'CLAUDE.md')`，作为共享工具这次计算的结果。
      return join(getClaudeConfigHomeDir(), 'CLAUDE.md')
    case 'Local':
      // 返回 `join(cwd, 'CLAUDE.local.md')`，作为共享工具这次计算的结果。
      return join(cwd, 'CLAUDE.local.md')
    case 'Project':
      // 返回 `join(cwd, 'CLAUDE.md')`，作为共享工具这次计算的结果。
      return join(cwd, 'CLAUDE.md')
    case 'Managed':
      // 返回 `join(getManagedFilePath(), 'CLAUDE.md')`，作为共享工具这次计算的结果。
      return join(getManagedFilePath(), 'CLAUDE.md')
    case 'AutoMem':
      // 返回 `getAutoMemEntrypoint()`，作为共享工具这次计算的结果。
      return getAutoMemEntrypoint()
  }
  // TeamMem is only a valid MemoryType when feature('TEAMMEM') is true
  // 满足 `feature('TEAMMEM')` 时，共享工具执行该分支。
  if (feature('TEAMMEM')) {
    // 返回 `teamMemPaths!.getTeamMemEntrypoint()`，作为共享工具这次计算的结果。
    return teamMemPaths!.getTeamMemEntrypoint()
  }
  // 返回 `'' // unreachable in external builds where TeamMem is not in MemoryType`，作为共享工具这次计算的结果。
  return '' // unreachable in external builds where TeamMem is not in MemoryType
}

// getManagedClaudeRulesDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getManagedClaudeRulesDir(): string {
  // 返回 `join(getManagedFilePath(), '.claude', 'rules')`，作为共享工具这次计算的结果。
  return join(getManagedFilePath(), '.claude', 'rules')
}

// getUserClaudeRulesDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUserClaudeRulesDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'rules')`，作为共享工具这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'rules')
}

// Exported for testing only
// _getConfigForTesting 配置读取`getConfig` 整理出中间结果，供共享工具 config后续步骤使用。
export const _getConfigForTesting = getConfig
// _wouldLoseAuthStateForTesting 状态保存`wouldLoseAuthState`，供共享工具 config后续判断或输出使用。
export const _wouldLoseAuthStateForTesting = wouldLoseAuthState
// _setGlobalConfigCacheForTesting 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _setGlobalConfigCacheForTesting(
  config: GlobalConfig | null,
): void {
  // 配置更新为 `config`，确保共享工具后续读取最新状态。
  globalConfigCache.config = config
  // mtime更新为 `config ? Date.now() : 0`，确保共享工具后续读取最新状态。
  globalConfigCache.mtime = config ? Date.now() : 0
}

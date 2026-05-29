/**
 * Pure permission type definitions extracted to break import cycles.
 *
 * This file contains only type definitions and constants with no runtime dependencies.
 * Implementation files remain in src/utils/permissions/ but can now import from here
 * to avoid circular dependencies.
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准permissions的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'

// ============================================================================
// Permission Modes
// ============================================================================

// EXTERNAL_PERMISSION_MODES 权限数据 聚合成有序列表，保持后续遍历顺序稳定。
export const EXTERNAL_PERMISSION_MODES = [
  'acceptEdits',
  'bypassPermissions',
  'default',
  'dontAsk',
  'plan',
] as const

// ExternalPermissionMode 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type ExternalPermissionMode = (typeof EXTERNAL_PERMISSION_MODES)[number]

// Exhaustive mode union for typechecking. The user-addressable runtime set
// is INTERNAL_PERMISSION_MODES below.
// InternalPermissionMode 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type InternalPermissionMode = ExternalPermissionMode | 'auto' | 'bubble'
// PermissionMode 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionMode = InternalPermissionMode

// Runtime validation set: modes that are user-addressable (settings.json
// defaultMode, --permission-mode CLI flag, conversation recovery).
// INTERNAL_PERMISSION_MODES 权限数据 聚合成有序列表，保持后续遍历顺序稳定。
export const INTERNAL_PERMISSION_MODES = [
  ...EXTERNAL_PERMISSION_MODES,
  ...(feature('TRANSCRIPT_CLASSIFIER') ? (['auto'] as const) : ([] as const)),
] as const satisfies readonly PermissionMode[]

// PERMISSION_MODES 权限数据 命名 `INTERNAL_PERMISSION_MODES`，让后续代码直接表达这个值的用途。
export const PERMISSION_MODES = INTERNAL_PERMISSION_MODES

// ============================================================================
// Permission Behaviors
// ============================================================================

// PermissionBehavior 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionBehavior = 'allow' | 'deny' | 'ask'

// ============================================================================
// Permission Rules
// ============================================================================

/**
 * Where a permission rule originated from.
 * Includes all SettingSource values plus additional rule-specific sources.
 */
// PermissionRuleSource 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRuleSource =
  | 'userSettings'
  | 'projectSettings'
  | 'localSettings'
  | 'flagSettings'
  | 'policySettings'
  | 'cliArg'
  | 'command'
  | 'session'

/**
 * The value of a permission rule - specifies which tool and optional content
 */
// PermissionRuleValue 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRuleValue = {
  toolName: string
  ruleContent?: string
}

/**
 * A permission rule with its source and behavior
 */
// PermissionRule 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRule = {
  source: PermissionRuleSource
  ruleBehavior: PermissionBehavior
  ruleValue: PermissionRuleValue
}

// ============================================================================
// Permission Updates
// ============================================================================

/**
 * Where a permission update should be persisted
 */
// PermissionUpdateDestination 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionUpdateDestination =
  | 'userSettings'
  | 'projectSettings'
  | 'localSettings'
  | 'session'
  | 'cliArg'

/**
 * Update operations for permission configuration
 */
// PermissionUpdate 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionUpdate =
  | {
      type: 'addRules'
      destination: PermissionUpdateDestination
      rules: PermissionRuleValue[]
      behavior: PermissionBehavior
    }
  | {
      type: 'replaceRules'
      destination: PermissionUpdateDestination
      rules: PermissionRuleValue[]
      behavior: PermissionBehavior
    }
  | {
      type: 'removeRules'
      destination: PermissionUpdateDestination
      rules: PermissionRuleValue[]
      behavior: PermissionBehavior
    }
  | {
      type: 'setMode'
      destination: PermissionUpdateDestination
      mode: ExternalPermissionMode
    }
  | {
      type: 'addDirectories'
      destination: PermissionUpdateDestination
      directories: string[]
    }
  | {
      type: 'removeDirectories'
      destination: PermissionUpdateDestination
      directories: string[]
    }

/**
 * Source of an additional working directory permission.
 * Note: This is currently the same as PermissionRuleSource but kept as a
 * separate type for semantic clarity and potential future divergence.
 */
// WorkingDirectorySource 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type WorkingDirectorySource = PermissionRuleSource

/**
 * An additional directory included in permission scope
 */
// AdditionalWorkingDirectory 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type AdditionalWorkingDirectory = {
  path: string
  source: WorkingDirectorySource
}

// ============================================================================
// Permission Decisions & Results
// ============================================================================

/**
 * Minimal command shape for permission metadata.
 * This is intentionally a subset of the full Command type to avoid import cycles.
 * Only includes properties needed by permission-related components.
 */
// PermissionCommandMetadata 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionCommandMetadata = {
  name: string
  description?: string
  // Allow additional properties for forward compatibility
  [key: string]: unknown
}

/**
 * Metadata attached to permission decisions
 */
// PermissionMetadata 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionMetadata =
  | { command: PermissionCommandMetadata }
  | undefined

/**
 * Result when permission is granted
 */
// PermissionAllowDecision 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionAllowDecision<
  Input extends { [key: string]: unknown } = { [key: string]: unknown },
> = {
  behavior: 'allow'
  updatedInput?: Input
  userModified?: boolean
  decisionReason?: PermissionDecisionReason
  toolUseID?: string
  acceptFeedback?: string
  contentBlocks?: ContentBlockParam[]
}

/**
 * Metadata for a pending classifier check that will run asynchronously.
 * Used to enable non-blocking allow classifier evaluation.
 */
// PendingClassifierCheck 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PendingClassifierCheck = {
  command: string
  cwd: string
  descriptions: string[]
}

/**
 * Result when user should be prompted
 */
// PermissionAskDecision 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionAskDecision<
  Input extends { [key: string]: unknown } = { [key: string]: unknown },
> = {
  behavior: 'ask'
  message: string
  updatedInput?: Input
  decisionReason?: PermissionDecisionReason
  suggestions?: PermissionUpdate[]
  blockedPath?: string
  metadata?: PermissionMetadata
  /**
   * If true, this ask decision was triggered by a bashCommandIsSafe_DEPRECATED security check
   * for patterns that splitCommand_DEPRECATED could misparse (e.g. line continuations, shell-quote
   * transformations). Used by bashToolHasPermission to block early before splitCommand_DEPRECATED
   * transforms the command. Not set for simple newline compound commands.
   */
  isBashSecurityCheckForMisparsing?: boolean
  /**
   * If set, an allow classifier check should be run asynchronously.
   * The classifier may auto-approve the permission before the user responds.
   */
  pendingClassifierCheck?: PendingClassifierCheck
  /**
   * Optional content blocks (e.g., images) to include alongside the rejection
   * message in the tool result. Used when users paste images as feedback.
   */
  contentBlocks?: ContentBlockParam[]
}

/**
 * Result when permission is denied
 */
// PermissionDenyDecision 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionDenyDecision = {
  behavior: 'deny'
  message: string
  decisionReason: PermissionDecisionReason
  toolUseID?: string
}

/**
 * A permission decision - allow, ask, or deny
 */
// PermissionDecision 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionDecision<
  Input extends { [key: string]: unknown } = { [key: string]: unknown },
> =
  | PermissionAllowDecision<Input>
  | PermissionAskDecision<Input>
  | PermissionDenyDecision

/**
 * Permission result with additional passthrough option
 */
// PermissionResult 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionResult<
  Input extends { [key: string]: unknown } = { [key: string]: unknown },
> =
  | PermissionDecision<Input>
  | {
      behavior: 'passthrough'
      message: string
      decisionReason?: PermissionDecision<Input>['decisionReason']
      suggestions?: PermissionUpdate[]
      blockedPath?: string
      /**
       * If set, an allow classifier check should be run asynchronously.
       * The classifier may auto-approve the permission before the user responds.
       */
      pendingClassifierCheck?: PendingClassifierCheck
    }

/**
 * Explanation of why a permission decision was made
 */
// PermissionDecisionReason 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionDecisionReason =
  | {
      type: 'rule'
      rule: PermissionRule
    }
  | {
      type: 'mode'
      mode: PermissionMode
    }
  | {
      type: 'subcommandResults'
      reasons: Map<string, PermissionResult>
    }
  | {
      type: 'permissionPromptTool'
      permissionPromptToolName: string
      toolResult: unknown
    }
  | {
      type: 'hook'
      hookName: string
      hookSource?: string
      reason?: string
    }
  | {
      type: 'asyncAgent'
      reason: string
    }
  | {
      type: 'sandboxOverride'
      reason: 'excludedCommand' | 'dangerouslyDisableSandbox'
    }
  | {
      type: 'classifier'
      classifier: string
      reason: string
    }
  | {
      type: 'workingDir'
      reason: string
    }
  | {
      type: 'safetyCheck'
      reason: string
      // When true, auto mode lets the classifier evaluate this instead of
      // forcing a prompt. True for sensitive-file paths (.claude/, .git/,
      // shell configs) — the classifier can see context and decide. False
      // for Windows path bypass attempts and cross-machine bridge messages.
      classifierApprovable: boolean
    }
  | {
      type: 'other'
      reason: string
    }

// ============================================================================
// Bash Classifier Types
// ============================================================================

// ClassifierResult 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClassifierResult = {
  matches: boolean
  matchedDescription?: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

// ClassifierBehavior 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClassifierBehavior = 'deny' | 'ask' | 'allow'

// ClassifierUsage 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClassifierUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
}

// YoloClassifierResult 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type YoloClassifierResult = {
  thinking?: string
  shouldBlock: boolean
  reason: string
  unavailable?: boolean
  /**
   * API returned "prompt is too long" — the classifier transcript exceeded
   * the context window. Deterministic (same transcript → same error), so
   * callers should fall back to normal prompting rather than retry/fail-closed.
   */
  transcriptTooLong?: boolean
  /** The model used for this classifier call */
  model: string
  /** Token usage from the classifier API call (for overhead telemetry) */
  usage?: ClassifierUsage
  /** Duration of the classifier API call in ms */
  durationMs?: number
  /** Character lengths of the prompt components sent to the classifier */
  promptLengths?: {
    systemPrompt: number
    toolCalls: number
    userPrompts: number
  }
  /** Path where error prompts were dumped (only set when unavailable due to API error) */
  errorDumpPath?: string
  /** Which classifier stage produced the final decision (2-stage XML only) */
  stage?: 'fast' | 'thinking'
  /** Token usage from stage 1 (fast) when stage 2 was also run */
  stage1Usage?: ClassifierUsage
  /** Duration of stage 1 in ms when stage 2 was also run */
  stage1DurationMs?: number
  /**
   * API request_id (req_xxx) for stage 1. Enables joining to server-side
   * api_usage logs for cache-miss / routing attribution. Also used for the
   * legacy 1-stage (tool_use) classifier — the single request goes here.
   */
  stage1RequestId?: string
  /**
   * API message id (msg_xxx) for stage 1. Enables joining the
   * tengu_auto_mode_decision analytics event to the classifier's actual
   * prompt/completion in post-analysis.
   */
  stage1MsgId?: string
  /** Token usage from stage 2 (thinking) when stage 2 was run */
  stage2Usage?: ClassifierUsage
  /** Duration of stage 2 in ms when stage 2 was run */
  stage2DurationMs?: number
  /** API request_id for stage 2 (set whenever stage 2 ran) */
  stage2RequestId?: string
  /** API message id (msg_xxx) for stage 2 (set whenever stage 2 ran) */
  stage2MsgId?: string
}

// ============================================================================
// Permission Explainer Types
// ============================================================================

// RiskLevel 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

// PermissionExplanation 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionExplanation = {
  riskLevel: RiskLevel
  explanation: string
  reasoning: string
  risk: string
}

// ============================================================================
// Tool Permission Context
// ============================================================================

/**
 * Mapping of permission rules by their source
 */
// ToolPermissionRulesBySource 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolPermissionRulesBySource = {
  [T in PermissionRuleSource]?: string[]
}

/**
 * Context needed for permission checking in tools
 * Note: Uses a simplified DeepImmutable approximation for this types-only file
 */
// ToolPermissionContext 固化permissions里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolPermissionContext = {
  readonly mode: PermissionMode
  readonly additionalWorkingDirectories: ReadonlyMap<
    string,
    AdditionalWorkingDirectory
  >
  readonly alwaysAllowRules: ToolPermissionRulesBySource
  readonly alwaysDenyRules: ToolPermissionRulesBySource
  readonly alwaysAskRules: ToolPermissionRulesBySource
  readonly isBypassPermissionsModeAvailable: boolean
  readonly strippedDangerousRules?: ToolPermissionRulesBySource
  readonly shouldAvoidPermissionPrompts?: boolean
  readonly awaitAutomatedChecksBeforeDialog?: boolean
  readonly prePlanMode?: PermissionMode
}

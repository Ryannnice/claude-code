// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准text Input Types的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 类型依赖 { UUID } 来自 crypto，用于校准text Input Types的数据契约。
import type { UUID } from 'crypto'
// 类型依赖 React 来自 react，用于校准text Input Types的数据契约。
import type React from 'react'
// 类型依赖 { PermissionResult } 来自 ../entrypoints/agentSdkTypes.js，用于校准text Input Types的数据契约。
import type { PermissionResult } from '../entrypoints/agentSdkTypes.js'
// 类型依赖 { Key } 来自 ../ink.js，用于校准text Input Types的数据契约。
import type { Key } from '../ink.js'
// 类型依赖 { PastedContent } 来自 ../utils/config.js，用于校准text Input Types的数据契约。
import type { PastedContent } from '../utils/config.js'
// 类型依赖 { ImageDimensions } 来自 ../utils/imageResizer.js，用于校准text Input Types的数据契约。
import type { ImageDimensions } from '../utils/imageResizer.js'
// 类型依赖 { TextHighlight } 来自 ../utils/textHighlighting.js，用于校准text Input Types的数据契约。
import type { TextHighlight } from '../utils/textHighlighting.js'
// 类型依赖 { AgentId } 来自 ./ids.js，用于校准text Input Types的数据契约。
import type { AgentId } from './ids.js'
// 类型依赖 { AssistantMessage, MessageOrigin } 来自 ./message.js，用于校准text Input Types的数据契约。
import type { AssistantMessage, MessageOrigin } from './message.js'

/**
 * Inline ghost text for mid-input command autocomplete
 */
// InlineGhostText 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type InlineGhostText = {
  /** The ghost text to display (e.g., "mit" for /commit) */
  readonly text: string
  /** The full command name (e.g., "commit") */
  readonly fullCommand: string
  /** Position in the input where the ghost text should appear */
  readonly insertPosition: number
}

/**
 * Base props for text input components
 */
// BaseTextInputProps 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type BaseTextInputProps = {
  /**
   * Optional callback for handling history navigation on up arrow at start of input
   */
  readonly onHistoryUp?: () => void

  /**
   * Optional callback for handling history navigation on down arrow at end of input
   */
  // 这个回调绑定到 readonly onHistoryDown?: () => void，负责text Input Types在该局部场景下的响应。
  readonly onHistoryDown?: () => void

  /**
   * Text to display when `value` is empty.
   */
  readonly placeholder?: string

  /**
   * Allow multi-line input via line ending with backslash (default: `true`)
   */
  readonly multiline?: boolean

  /**
   * Listen to user's input. Useful in case there are multiple input components
   * at the same time and input must be "routed" to a specific component.
   */
  readonly focus?: boolean

  /**
   * Replace all chars and mask the value. Useful for password inputs.
   */
  readonly mask?: string

  /**
   * Whether to show cursor and allow navigation inside text input with arrow keys.
   */
  readonly showCursor?: boolean

  /**
   * Highlight pasted text
   */
  readonly highlightPastedText?: boolean

  /**
   * Value to display in a text input.
   */
  readonly value: string

  /**
   * Function to call when value updates.
   */
  // 这个回调绑定到 readonly onChange: (value: string) => void，负责text Input Types在该局部场景下的响应。
  readonly onChange: (value: string) => void

  /**
   * Function to call when `Enter` is pressed, where first argument is a value of the input.
   */
  // 这个回调绑定到 readonly onSubmit?: (value: string) => void，负责text Input Types在该局部场景下的响应。
  readonly onSubmit?: (value: string) => void

  /**
   * Function to call when Ctrl+C is pressed to exit.
   */
  // 这个回调绑定到 readonly onExit?: () => void，负责text Input Types在该局部场景下的响应。
  readonly onExit?: () => void

  /**
   * Optional callback to show exit message
   */
  // 这个回调绑定到 readonly onExitMessage?: (show: boolean, key?: string) => void，负责text Input Types在该局部场景下的响应。
  readonly onExitMessage?: (show: boolean, key?: string) => void

  /**
   * Optional callback to show custom message
   */
  // readonly onMessage?: (show: boolean, message?: string) => void

  /**
   * Optional callback to reset history position
   */
  // 这个回调绑定到 readonly onHistoryReset?: () => void，负责text Input Types在该局部场景下的响应。
  readonly onHistoryReset?: () => void

  /**
   * Optional callback when input is cleared (e.g., double-escape)
   */
  // 这个回调绑定到 readonly onClearInput?: () => void，负责text Input Types在该局部场景下的响应。
  readonly onClearInput?: () => void

  /**
   * Number of columns to wrap text at
   */
  readonly columns: number

  /**
   * Maximum visible lines for the input viewport. When the wrapped input
   * exceeds this many lines, only lines around the cursor are rendered.
   */
  readonly maxVisibleLines?: number

  /**
   * Optional callback when an image is pasted
   */
  // text Input Types在这里处理 `readonly onImagePaste?: (`，完成这一小步状态转换。
  readonly onImagePaste?: (
    base64Image: string,
    mediaType?: string,
    filename?: string,
    dimensions?: ImageDimensions,
    sourcePath?: string,
  ) => void

  /**
   * Optional callback when a large text (over 800 chars) is pasted
   */
  // 这个回调绑定到 readonly onPaste?: (text: string) => void，负责text Input Types在该局部场景下的响应。
  readonly onPaste?: (text: string) => void

  /**
   * Callback when the pasting state changes
   */
  // 这个回调绑定到 readonly onIsPastingChange?: (isPasting: boolean) => void，负责text Input Types在该局部场景下的响应。
  readonly onIsPastingChange?: (isPasting: boolean) => void

  /**
   * Whether to disable cursor movement for up/down arrow keys
   */
  readonly disableCursorMovementForUpDownKeys?: boolean

  /**
   * Skip the text-level double-press escape handler. Set this when a
   * keybinding context (e.g. Autocomplete) owns escape — the keybinding's
   * stopImmediatePropagation can't shield the text input because child
   * effects register useInput listeners before parent effects.
   */
  readonly disableEscapeDoublePress?: boolean

  /**
   * The offset of the cursor within the text
   */
  readonly cursorOffset: number

  /**
   * Callback to set the offset of the cursor
   */
  // 这个回调绑定到 onChangeCursorOffset: (offset: number) => void，负责text Input Types在该局部场景下的响应。
  onChangeCursorOffset: (offset: number) => void

  /**
   * Optional hint text to display after command input
   * Used for showing available arguments for commands
   */
  readonly argumentHint?: string

  /**
   * Optional callback for undo functionality
   */
  // 这个回调绑定到 readonly onUndo?: () => void，负责text Input Types在该局部场景下的响应。
  readonly onUndo?: () => void

  /**
   * Whether to render the text with dim color
   */
  readonly dimColor?: boolean

  /**
   * Optional text highlights for search results or other highlighting
   */
  readonly highlights?: TextHighlight[]

  /**
   * Optional custom React element to render as placeholder.
   * When provided, overrides the standard `placeholder` string rendering.
   */
  readonly placeholderElement?: React.ReactNode

  /**
   * Optional inline ghost text for mid-input command autocomplete
   */
  readonly inlineGhostText?: InlineGhostText

  /**
   * Optional filter applied to raw input before key routing. Return the
   * (possibly transformed) input string; returning '' for a non-empty
   * input drops the event.
   */
  // 这个回调绑定到 readonly inputFilter?: (input: string, key: Key) => string，负责text Input Types在该局部场景下的响应。
  readonly inputFilter?: (input: string, key: Key) => string
}

/**
 * Extended props for VimTextInput
 */
// VimTextInputProps 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type VimTextInputProps = BaseTextInputProps & {
  /**
   * Initial vim mode to use
   */
  readonly initialMode?: VimMode

  /**
   * Optional callback for mode changes
   */
  // 这个回调绑定到 readonly onModeChange?: (mode: VimMode) => void，负责text Input Types在该局部场景下的响应。
  readonly onModeChange?: (mode: VimMode) => void
}

/**
 * Vim editor modes
 */
// VimMode 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type VimMode = 'INSERT' | 'NORMAL'

/**
 * Common properties for input hook results
 */
// BaseInputState 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type BaseInputState = {
  // 这个回调绑定到 onInput: (input: string, key: Key) => void，负责text Input Types在该局部场景下的响应。
  onInput: (input: string, key: Key) => void
  renderedValue: string
  offset: number
  // 这个回调绑定到 setOffset: (offset: number) => void，负责text Input Types在该局部场景下的响应。
  setOffset: (offset: number) => void
  /** Cursor line (0-indexed) within the rendered text, accounting for wrapping. */
  cursorLine: number
  /** Cursor column (display-width) within the current line. */
  cursorColumn: number
  /** Character offset in the full text where the viewport starts (0 when no windowing). */
  viewportCharOffset: number
  /** Character offset in the full text where the viewport ends (text.length when no windowing). */
  viewportCharEnd: number

  // For paste handling
  isPasting?: boolean
  pasteState?: {
    chunks: string[]
    timeoutId: ReturnType<typeof setTimeout> | null
  }
}

/**
 * State for text input
 */
// TextInputState 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextInputState = BaseInputState

/**
 * State for vim input with mode
 */
// VimInputState 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type VimInputState = BaseInputState & {
  mode: VimMode
  // 这个回调绑定到 setMode: (mode: VimMode) => void，负责text Input Types在该局部场景下的响应。
  setMode: (mode: VimMode) => void
}

/**
 * Input modes for the prompt
 */
// PromptInputMode 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type PromptInputMode =
  | 'bash'
  | 'prompt'
  | 'orphaned-permission'
  | 'task-notification'

// EditablePromptInputMode 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type EditablePromptInputMode = Exclude<
  PromptInputMode,
  `${string}-notification`
>

/**
 * Queue priority levels. Same semantics in both normal and proactive mode.
 *
 *  - `now`   — Interrupt and send immediately. Aborts any in-flight tool
 *              call (equivalent to Esc + send). Consumers (print.ts,
 *              REPL.tsx) subscribe to queue changes and abort when they
 *              see a 'now' command.
 *  - `next`  — Mid-turn drain. Let the current tool call finish, then
 *              send this message between the tool result and the next API
 *              round-trip. Wakes an in-progress SleepTool call.
 *  - `later` — End-of-turn drain. Wait for the current turn to finish,
 *              then process as a new query. Wakes an in-progress SleepTool
 *              call (query.ts upgrades the drain threshold after sleep so
 *              the message is attached to the same turn).
 *
 * The SleepTool is only available in proactive mode, so "wakes SleepTool"
 * is a no-op in normal mode.
 */
// QueuePriority 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type QueuePriority = 'now' | 'next' | 'later'

/**
 * Queued command type
 */
// QueuedCommand 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type QueuedCommand = {
  value: string | Array<ContentBlockParam>
  mode: PromptInputMode
  /** Defaults to the priority implied by `mode` when enqueued. */
  priority?: QueuePriority
  uuid?: UUID
  orphanedPermission?: OrphanedPermission
  /** Raw pasted contents including images. Images are resized at execution time. */
  pastedContents?: Record<number, PastedContent>
  /**
   * The input string before [Pasted text #N] placeholders were expanded.
   * Used for ultraplan keyword detection so pasted content containing the
   * keyword does not trigger a CCR session. Falls back to `value` when
   * unset (bridge/UDS/MCP sources have no paste expansion).
   */
  preExpansionValue?: string
  /**
   * When true, the input is treated as plain text even if it starts with `/`.
   * Used for remotely-received messages (e.g. bridge/CCR) that should not
   * trigger local slash commands or skills.
   */
  skipSlashCommands?: boolean
  /**
   * When true, slash commands are dispatched but filtered through
   * isBridgeSafeCommand() — 'local-jsx' and terminal-only commands return
   * a helpful error instead of executing. Set by the Remote Control bridge
   * inbound path so mobile/web clients can run skills and benign commands
   * without re-exposing the PR #19134 bug (/model popping the local picker).
   */
  bridgeOrigin?: boolean
  /**
   * When true, the resulting UserMessage gets `isMeta: true` — hidden in the
   * transcript UI but visible to the model. Used by system-generated prompts
   * (proactive ticks, teammate messages, resource updates) that route through
   * the queue instead of calling `onQuery` directly.
   */
  isMeta?: boolean
  /**
   * Provenance of this command. Stamped onto the resulting UserMessage so the
   * transcript records origin structurally (not just via XML tags in content).
   * undefined = human (keyboard).
   */
  origin?: MessageOrigin
  /**
   * Workload tag threaded through to cc_workload= in the billing-header
   * attribution block. The queue is the async boundary between the cron
   * scheduler firing and the turn actually running — a user prompt can slip
   * in between — so the tag rides on the QueuedCommand itself and is only
   * hoisted into bootstrap state when THIS command is dequeued.
   */
  workload?: string
  /**
   * Agent that should receive this notification. Undefined = main thread.
   * Subagents run in-process and share the module-level command queue; the
   * drain gate in query.ts filters by this field so a subagent's background
   * task notifications don't leak into the coordinator's context (PR #18453
   * unified the queue but lost the isolation the dual-queue accidentally had).
   */
  agentId?: AgentId
}

/**
 * Type guard for image PastedContent with non-empty data. Empty-content
 * images (e.g. from a 0-byte file drag) yield empty base64 strings that
 * the API rejects with `image cannot be empty`. Use this at every site
 * that converts PastedContent → ImageBlockParam so the filter and the
 * ID list stay in sync.
 */
// isValidImagePaste 封装textInputTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isValidImagePaste(c: PastedContent): boolean {
  // 返回 `c.type === 'image' && c.content.length > 0`，作为text Input Types这次计算的结果。
  return c.type === 'image' && c.content.length > 0
}

/** Extract image paste IDs from a QueuedCommand's pastedContents. */
// getImagePasteIds 封装textInputTypes的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getImagePasteIds(
  pastedContents: Record<number, PastedContent> | undefined,
): number[] | undefined {
  // pastedContents 集合缺失时提前走兜底路径，避免text Input Types继续依赖无效输入。
  if (!pastedContents) {
    // 返回 `undefined`，作为text Input Types这次计算的结果。
    return undefined
  }
  // ids 集合派生`Object.values`，供text Input Types后续处理使用。
  const ids = Object.values(pastedContents)
    .filter(isValidImagePaste)
    // 链式调用 map，继续加工上一行在text Input Types中产生的数据。
    .map(c => c.id)
  // 返回 `ids.length > 0 ? ids : undefined`，作为text Input Types这次计算的结果。
  return ids.length > 0 ? ids : undefined
}

// OrphanedPermission 固化text Input Types里传递的数据形状，帮助调用方按同一结构读写字段。
export type OrphanedPermission = {
  permissionResult: PermissionResult
  assistantMessage: AssistantMessage
}

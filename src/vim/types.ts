/**
 * Vim Mode State Machine Types
 *
 * This file defines the complete state machine for vim input handling.
 * The types ARE the documentation - reading them tells you how the system works.
 *
 * State Diagram:
 * ```
 *                              VimState
 *   ┌──────────────────────────────┬──────────────────────────────────────┐
 *   │  INSERT                      │  NORMAL                              │
 *   │  (tracks insertedText)       │  (CommandState machine)              │
 *   │                              │                                      │
 *   │                              │  idle ──┬─[d/c/y]──► operator        │
 *   │                              │         ├─[1-9]────► count           │
 *   │                              │         ├─[fFtT]───► find            │
 *   │                              │         ├─[g]──────► g               │
 *   │                              │         ├─[r]──────► replace         │
 *   │                              │         └─[><]─────► indent          │
 *   │                              │                                      │
 *   │                              │  operator ─┬─[motion]──► execute     │
 *   │                              │            ├─[0-9]────► operatorCount│
 *   │                              │            ├─[ia]─────► operatorTextObj
 *   │                              │            └─[fFtT]───► operatorFind │
 *   └──────────────────────────────┴──────────────────────────────────────┘
 * ```
 */

// ============================================================================
// Core Types
// ============================================================================

// Operator 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type Operator = 'delete' | 'change' | 'yank'

// FindType 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type FindType = 'f' | 'F' | 't' | 'T'

// TextObjScope 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type TextObjScope = 'inner' | 'around'

// ============================================================================
// State Machine Types
// ============================================================================

/**
 * Complete vim state. Mode determines what data is tracked.
 *
 * INSERT mode: Track text being typed (for dot-repeat)
 * NORMAL mode: Track command being parsed (state machine)
 */
// VimState 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type VimState =
  | { mode: 'INSERT'; insertedText: string }
  | { mode: 'NORMAL'; command: CommandState }

/**
 * Command state machine for NORMAL mode.
 *
 * Each state knows exactly what input it's waiting for.
 * TypeScript ensures exhaustive handling in switches.
 */
// CommandState 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommandState =
  | { type: 'idle' }
  | { type: 'count'; digits: string }
  | { type: 'operator'; op: Operator; count: number }
  | { type: 'operatorCount'; op: Operator; count: number; digits: string }
  | { type: 'operatorFind'; op: Operator; count: number; find: FindType }
  | {
      type: 'operatorTextObj'
      op: Operator
      count: number
      scope: TextObjScope
    }
  | { type: 'find'; find: FindType; count: number }
  | { type: 'g'; count: number }
  | { type: 'operatorG'; op: Operator; count: number }
  | { type: 'replace'; count: number }
  | { type: 'indent'; dir: '>' | '<'; count: number }

/**
 * Persistent state that survives across commands.
 * This is the "memory" of vim - what gets recalled for repeats and pastes.
 */
// PersistentState 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type PersistentState = {
  lastChange: RecordedChange | null
  lastFind: { type: FindType; char: string } | null
  register: string
  registerIsLinewise: boolean
}

/**
 * Recorded change for dot-repeat.
 * Captures everything needed to replay a command.
 */
// RecordedChange 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type RecordedChange =
  | { type: 'insert'; text: string }
  | {
      type: 'operator'
      op: Operator
      motion: string
      count: number
    }
  | {
      type: 'operatorTextObj'
      op: Operator
      objType: string
      scope: TextObjScope
      count: number
    }
  | {
      type: 'operatorFind'
      op: Operator
      find: FindType
      char: string
      count: number
    }
  | { type: 'replace'; char: string; count: number }
  | { type: 'x'; count: number }
  | { type: 'toggleCase'; count: number }
  | { type: 'indent'; dir: '>' | '<'; count: number }
  | { type: 'openLine'; direction: 'above' | 'below' }
  | { type: 'join'; count: number }

// ============================================================================
// Key Groups - Named constants, no magic strings
// ============================================================================

// OPERATORS 集合 集中保存types要一起传递的字段。
export const OPERATORS = {
  d: 'delete',
  c: 'change',
  y: 'yank',
} as const satisfies Record<string, Operator>

// isOperatorKey 封装types的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOperatorKey(key: string): key is keyof typeof OPERATORS {
  // 返回 `key in OPERATORS`，作为types这次计算的结果。
  return key in OPERATORS
}

// SIMPLE_MOTIONS 集合保存`Set`，供types后续处理使用。
export const SIMPLE_MOTIONS = new Set([
  'h',
  'l',
  'j',
  'k', // Basic movement
  'w',
  'b',
  'e',
  'W',
  'B',
  'E', // Word motions
  '0',
  '^',
  '$', // Line positions
])

// FIND_KEYS 集合保存`Set`，供types后续处理使用。
export const FIND_KEYS = new Set(['f', 'F', 't', 'T'])

// TEXT_OBJ_SCOPES 集合 集中保存types要一起传递的字段。
export const TEXT_OBJ_SCOPES = {
  i: 'inner',
  a: 'around',
} as const satisfies Record<string, TextObjScope>

// isTextObjScopeKey 封装types的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTextObjScopeKey(
  key: string,
): key is keyof typeof TEXT_OBJ_SCOPES {
  // 返回 `key in TEXT_OBJ_SCOPES`，作为types这次计算的结果。
  return key in TEXT_OBJ_SCOPES
}

// TEXT_OBJ_TYPES 集合保存`Set`，供types后续处理使用。
export const TEXT_OBJ_TYPES = new Set([
  'w',
  'W', // Word/WORD
  '"',
  "'",
  '`', // Quotes
  '(',
  ')',
  'b', // Parens
  '[',
  ']', // Brackets
  '{',
  '}',
  'B', // Braces
  '<',
  '>', // Angle brackets
])

// MAX_VIM_COUNT 数量保存`10000`，供types后续判断或输出使用。
export const MAX_VIM_COUNT = 10000

// ============================================================================
// State Factories
// ============================================================================

// createInitialVimState 封装types的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createInitialVimState(): VimState {
  // 返回结构化结果，集中表达types已经整理出的状态。
  return { mode: 'INSERT', insertedText: '' }
}

// createInitialPersistentState 封装types的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createInitialPersistentState(): PersistentState {
  // 返回结构化结果，集中表达types已经整理出的状态。
  return {
    lastChange: null,
    lastFind: null,
    register: '',
    registerIsLinewise: false,
  }
}

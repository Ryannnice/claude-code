// 类型依赖 { Key } 来自 ../ink.js，用于校准resolver的数据契约。
import type { Key } from '../ink.js'
// 引入 getKeyName、matchesBinding，将 ./match.js 中已经封装好的能力接到本文件流程里。
import { getKeyName, matchesBinding } from './match.js'
// 引入 chordToString，将 ./parser.js 中已经封装好的能力接到本文件流程里。
import { chordToString } from './parser.js'
// 整理这一组导入，让resolver后续逻辑可以直接复用这些外部能力。
import type {
  KeybindingContextName,
  ParsedBinding,
  ParsedKeystroke,
} from './types.js'

// ResolveResult 固化resolver里传递的数据形状，帮助调用方按同一结构读写字段。
export type ResolveResult =
  | { type: 'match'; action: string }
  | { type: 'none' }
  | { type: 'unbound' }

// ChordResolveResult 固化resolver里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChordResolveResult =
  | { type: 'match'; action: string }
  | { type: 'none' }
  | { type: 'unbound' }
  | { type: 'chord_started'; pending: ParsedKeystroke[] }
  | { type: 'chord_cancelled' }

/**
 * Resolve a key input to an action.
 * Pure function - no state, no side effects, just matching logic.
 *
 * @param input - The character input from Ink
 * @param key - The Key object from Ink with modifier flags
 * @param activeContexts - Array of currently active contexts (e.g., ['Chat', 'Global'])
 * @param bindings - All parsed bindings to search through
 * @returns The resolution result
 */
// resolveKey 封装resolver的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveKey(
  input: string,
  key: Key,
  activeContexts: KeybindingContextName[],
  bindings: ParsedBinding[],
): ResolveResult {
  // Find matching bindings (last one wins for user overrides)
  // match 先占位，稍后的条件分支会根据实际输入补齐它。
  let match: ParsedBinding | undefined
  // ctxSet保存`Set`，供resolver后续处理使用。
  const ctxSet = new Set(activeContexts)

  // 按顺序遍历 `bindings` 中的binding，逐个交给resolver处理。
  for (const binding of bindings) {
    // Phase 1: Only single-keystroke bindings
    // `binding.chord.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
    if (binding.chord.length !== 1) continue
    // 满足 `!ctxSet.has(binding.context)` 时，resolver执行该分支。
    if (!ctxSet.has(binding.context)) continue

    // 满足 `matchesBinding(input, key, binding)` 时，resolver执行该分支。
    if (matchesBinding(input, key, binding)) {
      // match更新为 `binding`，确保resolver后续读取最新状态。
      match = binding
    }
  }

  // match缺失时提前走兜底路径，避免resolver继续依赖无效输入。
  if (!match) {
    // 返回结构化结果，集中表达resolver已经整理出的状态。
    return { type: 'none' }
  }

  // 满足 `match.action === null` 时，resolver执行该分支。
  if (match.action === null) {
    // 返回结构化结果，集中表达resolver已经整理出的状态。
    return { type: 'unbound' }
  }

  // 返回结构化结果，集中表达resolver已经整理出的状态。
  return { type: 'match', action: match.action }
}

/**
 * Get display text for an action from bindings (e.g., "ctrl+t" for "app:toggleTodos").
 * Searches in reverse order so user overrides take precedence.
 */
// getBindingDisplayText 封装resolver的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBindingDisplayText(
  action: string,
  context: KeybindingContextName,
  bindings: ParsedBinding[],
): string | undefined {
  // Find the last binding for this action in this context
  // binding筛选`bindings.findLast`，供resolver后续处理使用。
  const binding = bindings.findLast(
    // b更新为 `> b.action === action && b.context === context`，确保resolver后续读取最新状态。
    b => b.action === action && b.context === context,
  )
  // 返回 `binding ? chordToString(binding.chord) : undefined`，作为resolver这次计算的结果。
  return binding ? chordToString(binding.chord) : undefined
}

/**
 * Build a ParsedKeystroke from Ink's input/key.
 */
// buildKeystroke 封装resolver的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildKeystroke(input: string, key: Key): ParsedKeystroke | null {
  // keyName读取`getKeyName`，供resolver后续处理使用。
  const keyName = getKeyName(input, key)
  // keyName缺失时提前走兜底路径，避免resolver继续依赖无效输入。
  if (!keyName) return null

  // QUIRK: Ink sets key.meta=true when escape is pressed (see input-event.ts).
  // This is legacy terminal behavior - we should NOT record this as a modifier
  // for the escape key itself, otherwise chord matching will fail.
  // effectiveMeta保存`key.escape ? false : key.meta`，供后续判断或组装使用。
  const effectiveMeta = key.escape ? false : key.meta

  // 返回结构化结果，集中表达resolver已经整理出的状态。
  return {
    key: keyName,
    ctrl: key.ctrl,
    alt: effectiveMeta,
    shift: key.shift,
    meta: effectiveMeta,
    super: key.super,
  }
}

/**
 * Compare two ParsedKeystrokes for equality. Collapses alt/meta into
 * one logical modifier — legacy terminals can't distinguish them (see
 * match.ts modifiersMatch), so "alt+k" and "meta+k" are the same key.
 * Super (cmd/win) is distinct — only arrives via kitty keyboard protocol.
 */
// keystrokesEqual 封装resolver的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function keystrokesEqual(
  a: ParsedKeystroke,
  b: ParsedKeystroke,
): boolean {
  // 返回 `(`，作为resolver这次计算的结果。
  return (
    a.key === b.key &&
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    (a.alt || a.meta) === (b.alt || b.meta) &&
    a.super === b.super
  )
}

/**
 * Check if a chord prefix matches the beginning of a binding's chord.
 */
// chordPrefixMatches 封装resolver的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function chordPrefixMatches(
  prefix: ParsedKeystroke[],
  binding: ParsedBinding,
): boolean {
  // 满足 `prefix.length >= binding.chord.length` 时，resolver执行该分支。
  if (prefix.length >= binding.chord.length) return false
  // 按索引扫描 `prefix.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < prefix.length; i++) {
    // prefixKey读取 `prefix[i]` 对应条目，后续围绕该成员继续处理。
    const prefixKey = prefix[i]
    // bindingKey 命名 `binding.chord[i]`，让后续代码直接表达这个值的用途。
    const bindingKey = binding.chord[i]
    // 组合条件 `!prefixKey || !bindingKey` 成立时，resolver才启用这条专门路径。
    if (!prefixKey || !bindingKey) return false
    // 满足 `!keystrokesEqual(prefixKey, bindingKey)` 时，resolver执行该分支。
    if (!keystrokesEqual(prefixKey, bindingKey)) return false
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Check if a full chord matches a binding's chord.
 */
// chordExactlyMatches 封装resolver的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function chordExactlyMatches(
  chord: ParsedKeystroke[],
  binding: ParsedBinding,
): boolean {
  // `chord.length` 与 `binding.chord.length` 不一致时刷新派生状态，避免使用过期结果。
  if (chord.length !== binding.chord.length) return false
  // 按索引扫描 `chord.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < chord.length; i++) {
    // chordKey 命名 `chord[i]`，让后续代码直接表达这个值的用途。
    const chordKey = chord[i]
    // bindingKey 命名 `binding.chord[i]`，让后续代码直接表达这个值的用途。
    const bindingKey = binding.chord[i]
    // 组合条件 `!chordKey || !bindingKey` 成立时，resolver才启用这条专门路径。
    if (!chordKey || !bindingKey) return false
    // 满足 `!keystrokesEqual(chordKey, bindingKey)` 时，resolver执行该分支。
    if (!keystrokesEqual(chordKey, bindingKey)) return false
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Resolve a key with chord state support.
 *
 * This function handles multi-keystroke chord bindings like "ctrl+k ctrl+s".
 *
 * @param input - The character input from Ink
 * @param key - The Key object from Ink with modifier flags
 * @param activeContexts - Array of currently active contexts
 * @param bindings - All parsed bindings
 * @param pending - Current chord state (null if not in a chord)
 * @returns Resolution result with chord state
 */
// resolveKeyWithChordState 封装resolver的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveKeyWithChordState(
  input: string,
  key: Key,
  activeContexts: KeybindingContextName[],
  bindings: ParsedBinding[],
  pending: ParsedKeystroke[] | null,
): ChordResolveResult {
  // Cancel chord on escape
  // `key.escape && pending` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (key.escape && pending !== null) {
    // 返回结构化结果，集中表达resolver已经整理出的状态。
    return { type: 'chord_cancelled' }
  }

  // Build current keystroke
  // currentKeystroke构建`buildKeystroke`，供resolver后续处理使用。
  const currentKeystroke = buildKeystroke(input, key)
  // currentKeystroke缺失时提前走兜底路径，避免resolver继续依赖无效输入。
  if (!currentKeystroke) {
    // `pending` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (pending !== null) {
      // 返回结构化结果，集中表达resolver已经整理出的状态。
      return { type: 'chord_cancelled' }
    }
    // 返回结构化结果，集中表达resolver已经整理出的状态。
    return { type: 'none' }
  }

  // Build the full chord sequence to test
  // testChord 命名 `pending`，让后续代码直接表达这个值的用途。
  const testChord = pending
    ? [...pending, currentKeystroke]
    : [currentKeystroke]

  // Filter bindings by active contexts (Set lookup: O(n) instead of O(n·m))
  // ctxSet保存`Set`，供resolver后续处理使用。
  const ctxSet = new Set(activeContexts)
  // contextBindings 集合筛选`bindings.filter`，供resolver后续处理使用。
  const contextBindings = bindings.filter(b => ctxSet.has(b.context))

  // Check if this could be a prefix for longer chords. Group by chord
  // string so a later null-override shadows the default it unbinds —
  // otherwise null-unbinding `ctrl+x ctrl+k` still makes `ctrl+x` enter
  // chord-wait and the single-key binding on the prefix never fires.
  // chordWinners 集合构建`new Map<string, string | null>()` 整理出中间结果，供resolver后续步骤使用。
  const chordWinners = new Map<string, string | null>()
  // 按顺序遍历 `contextBindings` 中的binding，逐个交给resolver处理。
  for (const binding of contextBindings) {
    // resolver在这里进入条件判断，后续代码按实际状态分流。
    if (
      binding.chord.length > testChord.length &&
      chordPrefixMatches(testChord, binding)
    ) {
      // chordWinners.set 写入新的状态值，使resolver后续读取保持一致。
      chordWinners.set(chordToString(binding.chord), binding.action)
    }
  }
  // hasLongerChords 集合标记resolver是否启用对应路径。
  let hasLongerChords = false
  // 逐项读取 `chordWinners.values()` 中的action，按输入顺序推进resolver。
  for (const action of chordWinners.values()) {
    // `action` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (action !== null) {
      // hasLongerChords 集合更新为 `true`，确保resolver后续读取最新状态。
      hasLongerChords = true
      // 结束这个分支或循环，避免resolver继续落入后续路径。
      break
    }
  }

  // If this keystroke could start a longer chord, prefer that
  // (even if there's an exact single-key match)
  // 满足 `hasLongerChords` 时，resolver执行该分支。
  if (hasLongerChords) {
    // 返回结构化结果，集中表达resolver已经整理出的状态。
    return { type: 'chord_started', pending: testChord }
  }

  // Check for exact matches (last one wins)
  // exactMatch 先占位，稍后的条件分支会根据实际输入补齐它。
  let exactMatch: ParsedBinding | undefined
  // 按顺序遍历 `contextBindings` 中的binding，逐个交给resolver处理。
  for (const binding of contextBindings) {
    // 满足 `chordExactlyMatches(testChord, binding)` 时，resolver执行该分支。
    if (chordExactlyMatches(testChord, binding)) {
      // exactMatch更新为 `binding`，确保resolver后续读取最新状态。
      exactMatch = binding
    }
  }

  // 满足 `exactMatch` 时，resolver执行该分支。
  if (exactMatch) {
    // 满足 `exactMatch.action === null` 时，resolver执行该分支。
    if (exactMatch.action === null) {
      // 返回结构化结果，集中表达resolver已经整理出的状态。
      return { type: 'unbound' }
    }
    // 返回结构化结果，集中表达resolver已经整理出的状态。
    return { type: 'match', action: exactMatch.action }
  }

  // No match and no potential longer chords
  // `pending` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (pending !== null) {
    // 返回结构化结果，集中表达resolver已经整理出的状态。
    return { type: 'chord_cancelled' }
  }

  // 返回结构化结果，集中表达resolver已经整理出的状态。
  return { type: 'none' }
}

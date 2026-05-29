// 类型依赖 { Key } 来自 ../ink.js，用于校准match的数据契约。
import type { Key } from '../ink.js'
// 类型依赖 { ParsedBinding, ParsedKeystroke } 来自 ./types.js，用于校准match的数据契约。
import type { ParsedBinding, ParsedKeystroke } from './types.js'

/**
 * Modifier keys from Ink's Key type that we care about for matching.
 * Note: `fn` from Key is intentionally excluded as it's rarely used and
 * not commonly configurable in terminal applications.
 */
// InkModifiers 固化match里传递的数据形状，帮助调用方按同一结构读写字段。
type InkModifiers = Pick<Key, 'ctrl' | 'shift' | 'meta' | 'super'>

/**
 * Extract modifiers from an Ink Key object.
 * This function ensures we're explicitly extracting the modifiers we care about.
 */
// getInkModifiers 封装match的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInkModifiers(key: Key): InkModifiers {
  // 返回结构化结果，集中表达match已经整理出的状态。
  return {
    ctrl: key.ctrl,
    shift: key.shift,
    meta: key.meta,
    super: key.super,
  }
}

/**
 * Extract the normalized key name from Ink's Key + input.
 * Maps Ink's boolean flags (key.escape, key.return, etc.) to string names
 * that match our ParsedKeystroke.key format.
 */
// getKeyName 封装match的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getKeyName(input: string, key: Key): string | null {
  // 满足 `key.escape` 时，match执行该分支。
  if (key.escape) return 'escape'
  // 满足 `key.return` 时，match执行该分支。
  if (key.return) return 'enter'
  // 满足 `key.tab` 时，match执行该分支。
  if (key.tab) return 'tab'
  // 满足 `key.backspace` 时，match执行该分支。
  if (key.backspace) return 'backspace'
  // 满足 `key.delete` 时，match执行该分支。
  if (key.delete) return 'delete'
  // 满足 `key.upArrow` 时，match执行该分支。
  if (key.upArrow) return 'up'
  // 满足 `key.downArrow` 时，match执行该分支。
  if (key.downArrow) return 'down'
  // 满足 `key.leftArrow` 时，match执行该分支。
  if (key.leftArrow) return 'left'
  // 满足 `key.rightArrow` 时，match执行该分支。
  if (key.rightArrow) return 'right'
  // 满足 `key.pageUp` 时，match执行该分支。
  if (key.pageUp) return 'pageup'
  // 满足 `key.pageDown` 时，match执行该分支。
  if (key.pageDown) return 'pagedown'
  // 满足 `key.wheelUp` 时，match执行该分支。
  if (key.wheelUp) return 'wheelup'
  // 满足 `key.wheelDown` 时，match执行该分支。
  if (key.wheelDown) return 'wheeldown'
  // 满足 `key.home` 时，match执行该分支。
  if (key.home) return 'home'
  // 满足 `key.end` 时，match执行该分支。
  if (key.end) return 'end'
  // 满足 `input.length === 1) return input.toLowerCase(` 时，match执行该分支。
  if (input.length === 1) return input.toLowerCase()
  // 返回 `null`，作为match这次计算的结果。
  return null
}

/**
 * Check if all modifiers match between Ink Key and ParsedKeystroke.
 *
 * Alt and Meta: Ink historically set `key.meta` for Alt/Option. A `meta`
 * modifier in config is treated as an alias for `alt` — both match when
 * `key.meta` is true.
 *
 * Super (Cmd/Win): distinct from alt/meta. Only arrives via the kitty
 * keyboard protocol on supporting terminals. A `cmd`/`super` binding will
 * simply never fire on terminals that don't send it.
 */
// modifiersMatch 封装match的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function modifiersMatch(
  inkMods: InkModifiers,
  target: ParsedKeystroke,
): boolean {
  // Check ctrl modifier
  // `inkMods.ctrl` 与 `target.ctrl` 不一致时刷新派生状态，避免使用过期结果。
  if (inkMods.ctrl !== target.ctrl) return false

  // Check shift modifier
  // `inkMods.shift` 与 `target.shift` 不一致时刷新派生状态，避免使用过期结果。
  if (inkMods.shift !== target.shift) return false

  // Alt and meta both map to key.meta in Ink (terminal limitation)
  // So we check if EITHER alt OR meta is required in target
  // targetNeedsMeta标记match是否启用对应路径。
  const targetNeedsMeta = target.alt || target.meta
  // `inkMods.meta` 与 `targetNeedsMeta` 不一致时刷新派生状态，避免使用过期结果。
  if (inkMods.meta !== targetNeedsMeta) return false

  // Super (cmd/win) is a distinct modifier from alt/meta
  // `inkMods.super` 与 `target.super` 不一致时刷新派生状态，避免使用过期结果。
  if (inkMods.super !== target.super) return false

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Check if a ParsedKeystroke matches the given Ink input + Key.
 *
 * The display text will show platform-appropriate names (opt on macOS, alt elsewhere).
 */
// matchesKeystroke 封装match的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function matchesKeystroke(
  input: string,
  key: Key,
  target: ParsedKeystroke,
): boolean {
  // keyName读取`getKeyName`，供match后续处理使用。
  const keyName = getKeyName(input, key)
  // `keyName` 与 `target.key` 不一致时刷新派生状态，避免使用过期结果。
  if (keyName !== target.key) return false

  // inkMods 集合读取`getInkModifiers`，供match后续处理使用。
  const inkMods = getInkModifiers(key)

  // QUIRK: Ink sets key.meta=true when escape is pressed (see input-event.ts).
  // This is a legacy behavior from how escape sequences work in terminals.
  // We need to ignore the meta modifier when matching the escape key itself,
  // otherwise bindings like "escape" (without modifiers) would never match.
  // 满足 `key.escape` 时，match执行该分支。
  if (key.escape) {
    // 返回 `modifiersMatch({ ...inkMods, meta: false }, target)`，作为match这次计算的结果。
    return modifiersMatch({ ...inkMods, meta: false }, target)
  }

  // 返回 `modifiersMatch(inkMods, target)`，作为match这次计算的结果。
  return modifiersMatch(inkMods, target)
}

/**
 * Check if Ink's Key + input matches a parsed binding's first keystroke.
 * For single-keystroke bindings only (Phase 1).
 */
// matchesBinding 封装match的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function matchesBinding(
  input: string,
  key: Key,
  binding: ParsedBinding,
): boolean {
  // `binding.chord.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
  if (binding.chord.length !== 1) return false
  // keystroke保存`binding.chord[0]`，供match后续判断或输出使用。
  const keystroke = binding.chord[0]
  // keystroke缺失时提前走兜底路径，避免match继续依赖无效输入。
  if (!keystroke) return false
  // 返回 `matchesKeystroke(input, key, keystroke)`，作为match这次计算的结果。
  return matchesKeystroke(input, key, keystroke)
}

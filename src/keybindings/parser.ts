// 整理这一组导入，让parser后续逻辑可以直接复用这些外部能力。
import type {
  Chord,
  KeybindingBlock,
  ParsedBinding,
  ParsedKeystroke,
} from './types.js'

/**
 * Parse a keystroke string like "ctrl+shift+k" into a ParsedKeystroke.
 * Supports various modifier aliases (ctrl/control, alt/opt/option/meta,
 * cmd/command/super/win).
 */
// parseKeystroke 封装parser的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseKeystroke(input: string): ParsedKeystroke {
  // 片段列表格式化`input.split`，供parser后续处理使用。
  const parts = input.split('+')
  // keystroke 集中保存parser要一起传递的字段。
  const keystroke: ParsedKeystroke = {
    key: '',
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    super: false,
  }
  // 按顺序遍历 `parts` 中的part，逐个交给parser处理。
  for (const part of parts) {
    // lower保存`part.toLowerCase`，供parser后续处理使用。
    const lower = part.toLowerCase()
    // 按照 lower 的取值选择parser的具体处理分支。
    switch (lower) {
      case 'ctrl':
      case 'control':
        // ctrl更新为 `true`，确保parser后续读取最新状态。
        keystroke.ctrl = true
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case 'alt':
      case 'opt':
      case 'option':
        // alt更新为 `true`，确保parser后续读取最新状态。
        keystroke.alt = true
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case 'shift':
        // shift更新为 `true`，确保parser后续读取最新状态。
        keystroke.shift = true
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case 'meta':
        // meta更新为 `true`，确保parser后续读取最新状态。
        keystroke.meta = true
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case 'cmd':
      case 'command':
      case 'super':
      case 'win':
        // super更新为 `true`，确保parser后续读取最新状态。
        keystroke.super = true
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case 'esc':
        // key更新为 `'escape'`，确保parser后续读取最新状态。
        keystroke.key = 'escape'
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case 'return':
        // key更新为 `'enter'`，确保parser后续读取最新状态。
        keystroke.key = 'enter'
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case 'space':
        // key更新为 `' '`，确保parser后续读取最新状态。
        keystroke.key = ' '
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case '↑':
        // key更新为 `'up'`，确保parser后续读取最新状态。
        keystroke.key = 'up'
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case '↓':
        // key更新为 `'down'`，确保parser后续读取最新状态。
        keystroke.key = 'down'
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case '←':
        // key更新为 `'left'`，确保parser后续读取最新状态。
        keystroke.key = 'left'
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      case '→':
        // key更新为 `'right'`，确保parser后续读取最新状态。
        keystroke.key = 'right'
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
      default:
        // key更新为 `lower`，确保parser后续读取最新状态。
        keystroke.key = lower
        // 结束这个分支或循环，避免parser继续落入后续路径。
        break
    }
  }

  // 返回 `keystroke`，作为parser这次计算的结果。
  return keystroke
}

/**
 * Parse a chord string like "ctrl+k ctrl+s" into an array of ParsedKeystrokes.
 */
// parseChord 封装parser的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseChord(input: string): Chord {
  // A lone space character IS the space key binding, not a separator
  // 当 `input` 匹配 `' ') return [parseKeystroke...` 时，parser执行对应分支。
  if (input === ' ') return [parseKeystroke('space')]
  // 返回 `input.trim().split(/\s+/).map(parseKeystroke)`，作为parser这次计算的结果。
  return input.trim().split(/\s+/).map(parseKeystroke)
}

/**
 * Convert a ParsedKeystroke to its canonical string representation for display.
 */
// keystrokeToString 封装parser的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function keystrokeToString(ks: ParsedKeystroke): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // 满足 `ks.ctrl) parts.push('ctrl'` 时，parser执行该分支。
  if (ks.ctrl) parts.push('ctrl')
  // 满足 `ks.alt) parts.push('alt'` 时，parser执行该分支。
  if (ks.alt) parts.push('alt')
  // 满足 `ks.shift) parts.push('shift'` 时，parser执行该分支。
  if (ks.shift) parts.push('shift')
  // 满足 `ks.meta) parts.push('meta'` 时，parser执行该分支。
  if (ks.meta) parts.push('meta')
  // 满足 `ks.super) parts.push('cmd'` 时，parser执行该分支。
  if (ks.super) parts.push('cmd')
  // Use readable names for display
  // displayKey保存`keyToDisplayName`，供parser后续处理使用。
  const displayKey = keyToDisplayName(ks.key)
  // 片段列表追加新条目，保持收集顺序与输入顺序一致。
  parts.push(displayKey)
  // 返回 `parts.join('+')`，作为parser这次计算的结果。
  return parts.join('+')
}

/**
 * Map internal key names to human-readable display names.
 */
// keyToDisplayName 封装parser的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function keyToDisplayName(key: string): string {
  // 按照 key 的取值选择parser的具体处理分支。
  switch (key) {
    case 'escape':
      // 返回 `'Esc'`，作为parser这次计算的结果。
      return 'Esc'
    case ' ':
      // 返回 `'Space'`，作为parser这次计算的结果。
      return 'Space'
    case 'tab':
      // 返回 `'tab'`，作为parser这次计算的结果。
      return 'tab'
    case 'enter':
      // 返回 `'Enter'`，作为parser这次计算的结果。
      return 'Enter'
    case 'backspace':
      // 返回 `'Backspace'`，作为parser这次计算的结果。
      return 'Backspace'
    case 'delete':
      // 返回 `'Delete'`，作为parser这次计算的结果。
      return 'Delete'
    case 'up':
      // 返回 `'↑'`，作为parser这次计算的结果。
      return '↑'
    case 'down':
      // 返回 `'↓'`，作为parser这次计算的结果。
      return '↓'
    case 'left':
      // 返回 `'←'`，作为parser这次计算的结果。
      return '←'
    case 'right':
      // 返回 `'→'`，作为parser这次计算的结果。
      return '→'
    case 'pageup':
      // 返回 `'PageUp'`，作为parser这次计算的结果。
      return 'PageUp'
    case 'pagedown':
      // 返回 `'PageDown'`，作为parser这次计算的结果。
      return 'PageDown'
    case 'home':
      // 返回 `'Home'`，作为parser这次计算的结果。
      return 'Home'
    case 'end':
      // 返回 `'End'`，作为parser这次计算的结果。
      return 'End'
    default:
      // 返回 `key`，作为parser这次计算的结果。
      return key
  }
}

/**
 * Convert a Chord to its canonical string representation for display.
 */
// chordToString 封装parser的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function chordToString(chord: Chord): string {
  // 返回 `chord.map(keystrokeToString).join(' ')`，作为parser这次计算的结果。
  return chord.map(keystrokeToString).join(' ')
}

/**
 * Display platform type - a subset of Platform that we care about for display.
 * WSL and unknown are treated as linux for display purposes.
 */
// DisplayPlatform 固化parser里传递的数据形状，帮助调用方按同一结构读写字段。
type DisplayPlatform = 'macos' | 'windows' | 'linux' | 'wsl' | 'unknown'

/**
 * Convert a ParsedKeystroke to a platform-appropriate display string.
 * Uses "opt" for alt on macOS, "alt" elsewhere.
 */
// keystrokeToDisplayString 封装parser的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function keystrokeToDisplayString(
  ks: ParsedKeystroke,
  platform: DisplayPlatform = 'linux',
): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // 满足 `ks.ctrl) parts.push('ctrl'` 时，parser执行该分支。
  if (ks.ctrl) parts.push('ctrl')
  // Alt/meta are equivalent in terminals, show platform-appropriate name
  // 组合条件 `ks.alt || ks.meta` 成立时，parser才启用这条专门路径。
  if (ks.alt || ks.meta) {
    // Only macOS uses "opt", all other platforms use "alt"
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(platform === 'macos' ? 'opt' : 'alt')
  }
  // 满足 `ks.shift) parts.push('shift'` 时，parser执行该分支。
  if (ks.shift) parts.push('shift')
  // 满足 `ks.super` 时，parser执行该分支。
  if (ks.super) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(platform === 'macos' ? 'cmd' : 'super')
  }
  // Use readable names for display
  // displayKey保存`keyToDisplayName`，供parser后续处理使用。
  const displayKey = keyToDisplayName(ks.key)
  // 片段列表追加新条目，保持收集顺序与输入顺序一致。
  parts.push(displayKey)
  // 返回 `parts.join('+')`，作为parser这次计算的结果。
  return parts.join('+')
}

/**
 * Convert a Chord to a platform-appropriate display string.
 */
// chordToDisplayString 封装parser的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function chordToDisplayString(
  chord: Chord,
  platform: DisplayPlatform = 'linux',
): string {
  // 返回 `chord.map(ks => keystrokeToDisplayString(ks, platform)).join(' ')`，作为parser这次计算的结果。
  return chord.map(ks => keystrokeToDisplayString(ks, platform)).join(' ')
}

/**
 * Parse keybinding blocks (from JSON config) into a flat list of ParsedBindings.
 */
// parseBindings 封装parser的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseBindings(blocks: KeybindingBlock[]): ParsedBinding[] {
  // bindings 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const bindings: ParsedBinding[] = []
  // 按顺序遍历 `blocks` 中的block，逐个交给parser处理。
  for (const block of blocks) {
    // 循环处理 `const [key, action] of Object.entries(block.bindings)`，让parser把同类条目按顺序走完。
    for (const [key, action] of Object.entries(block.bindings)) {
      // bindings 集合追加新条目，保持收集顺序与输入顺序一致。
      bindings.push({
        chord: parseChord(key),
        action,
        context: block.context,
      })
    }
  }
  // 返回 `bindings`，作为parser这次计算的结果。
  return bindings
}

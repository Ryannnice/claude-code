// 复用 plural 工具函数，把通用处理留在 ../utils/stringUtils.js 中维护。
import { plural } from '../utils/stringUtils.js'
// 引入 chordToString、parseChord、parseKeystroke，将 ./parser.js 中已经封装好的能力接到本文件流程里。
import { chordToString, parseChord, parseKeystroke } from './parser.js'
// 整理这一组导入，让validate后续逻辑可以直接复用这些外部能力。
import {
  getReservedShortcuts,
  normalizeKeyForComparison,
} from './reservedShortcuts.js'
// 整理这一组导入，让validate后续逻辑可以直接复用这些外部能力。
import type {
  KeybindingBlock,
  KeybindingContextName,
  ParsedBinding,
} from './types.js'

/**
 * Types of validation issues that can occur with keybindings.
 */
// KeybindingWarningType 固化validate里传递的数据形状，帮助调用方按同一结构读写字段。
export type KeybindingWarningType =
  | 'parse_error'
  | 'duplicate'
  | 'reserved'
  | 'invalid_context'
  | 'invalid_action'

/**
 * A warning or error about a keybinding configuration issue.
 */
// KeybindingWarning 固化validate里传递的数据形状，帮助调用方按同一结构读写字段。
export type KeybindingWarning = {
  type: KeybindingWarningType
  severity: 'error' | 'warning'
  message: string
  key?: string
  context?: string
  action?: string
  suggestion?: string
}

/**
 * Type guard to check if an object is a valid KeybindingBlock.
 */
// isKeybindingBlock 封装validate的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isKeybindingBlock(obj: unknown): obj is KeybindingBlock {
  // `typeof obj` 与 `'object' || obj === null` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof obj !== 'object' || obj === null) return false
  // b保存`obj as Record<string, unknown>`，供validate后续判断或输出使用。
  const b = obj as Record<string, unknown>
  // 返回 `(`，作为validate这次计算的结果。
  return (
    typeof b.context === 'string' &&
    typeof b.bindings === 'object' &&
    b.bindings !== null
  )
}

/**
 * Type guard to check if an array contains only valid KeybindingBlocks.
 */
// isKeybindingBlockArray 封装validate的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isKeybindingBlockArray(arr: unknown): arr is KeybindingBlock[] {
  // 返回 `Array.isArray(arr) && arr.every(isKeybindingBlock)`，作为validate这次计算的结果。
  return Array.isArray(arr) && arr.every(isKeybindingBlock)
}

/**
 * Valid context names for keybindings.
 * Must match KeybindingContextName in types.ts
 */
// VALID_CONTEXTS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const VALID_CONTEXTS: KeybindingContextName[] = [
  'Global',
  'Chat',
  'Autocomplete',
  'Confirmation',
  'Help',
  'Transcript',
  'HistorySearch',
  'Task',
  'ThemePicker',
  'Settings',
  'Tabs',
  'Attachments',
  'Footer',
  'MessageSelector',
  'DiffDialog',
  'ModelPicker',
  'Select',
  'Plugin',
]

/**
 * Type guard to check if a string is a valid context name.
 */
// isValidContext 封装validate的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isValidContext(value: string): value is KeybindingContextName {
  // 返回 `(VALID_CONTEXTS as readonly string[]).includes(value)`，作为validate这次计算的结果。
  return (VALID_CONTEXTS as readonly string[]).includes(value)
}

/**
 * Validate a single keystroke string and return any parse errors.
 */
// validateKeystroke 封装validate的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateKeystroke(keystroke: string): KeybindingWarning | null {
  // 片段列表保存`keystroke.toLowerCase`，供validate后续处理使用。
  const parts = keystroke.toLowerCase().split('+')

  // 按顺序遍历 `parts` 中的part，逐个交给validate处理。
  for (const part of parts) {
    // trimmed格式化`part.trim`，供validate后续处理使用。
    const trimmed = part.trim()
    // trimmed缺失时提前走兜底路径，避免validate继续依赖无效输入。
    if (!trimmed) {
      // 返回结构化结果，集中表达validate已经整理出的状态。
      return {
        type: 'parse_error',
        severity: 'error',
        message: `Empty key part in "${keystroke}"`,
        key: keystroke,
        suggestion: 'Remove extra "+" characters',
      }
    }
  }

  // Try to parse and see if it fails
  // 解析结果解析`parseKeystroke`，供validate后续处理使用。
  const parsed = parseKeystroke(keystroke)
  // validate在这里进入条件判断，后续代码按实际状态分流。
  if (
    !parsed.key &&
    !parsed.ctrl &&
    !parsed.alt &&
    !parsed.shift &&
    !parsed.meta
  ) {
    // 返回结构化结果，集中表达validate已经整理出的状态。
    return {
      type: 'parse_error',
      severity: 'error',
      message: `Could not parse keystroke "${keystroke}"`,
      key: keystroke,
    }
  }

  // 返回 `null`，作为validate这次计算的结果。
  return null
}

/**
 * Validate a keybinding block from user config.
 */
// validateBlock 封装validate的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateBlock(
  block: unknown,
  blockIndex: number,
): KeybindingWarning[] {
  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: KeybindingWarning[] = []

  // `typeof block` 与 `'object' || block === null` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof block !== 'object' || block === null) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      type: 'parse_error',
      severity: 'error',
      message: `Keybinding block ${blockIndex + 1} is not an object`,
    })
    // 返回 `warnings`，作为validate这次计算的结果。
    return warnings
  }

  // b 命名 `block as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const b = block as Record<string, unknown>

  // Validate context - extract to narrowed variable for type safety
  // rawContext保存`b.context`，供validate后续判断或输出使用。
  const rawContext = b.context
  // contextName 先占位，稍后的条件分支会根据实际输入补齐它。
  let contextName: string | undefined
  // `typeof rawContext` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof rawContext !== 'string') {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      type: 'parse_error',
      severity: 'error',
      message: `Keybinding block ${blockIndex + 1} missing "context" field`,
    })
  // validate在这里处理 `} else if (!isValidContext(rawContext)) {`，完成这一小步状态转换。
  } else if (!isValidContext(rawContext)) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      type: 'invalid_context',
      severity: 'error',
      message: `Unknown context "${rawContext}"`,
      context: rawContext,
      suggestion: `Valid contexts: ${VALID_CONTEXTS.join(', ')}`,
    })
  } else {
    // contextName更新为 `rawContext`，确保validate后续读取最新状态。
    contextName = rawContext
  }

  // Validate bindings
  // `typeof b.bindings` 与 `'object' || b.bindings ===` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof b.bindings !== 'object' || b.bindings === null) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      type: 'parse_error',
      severity: 'error',
      message: `Keybinding block ${blockIndex + 1} missing "bindings" field`,
    })
    // 返回 `warnings`，作为validate这次计算的结果。
    return warnings
  }

  // bindings 集合保存`b.bindings as Record<string, unknown>`，供validate后续判断或输出使用。
  const bindings = b.bindings as Record<string, unknown>
  // 循环处理 `const [key, action] of Object.entries(bindings)`，让validate把同类条目按顺序走完。
  for (const [key, action] of Object.entries(bindings)) {
    // Validate key syntax
    // keyError 错误信息读取`validateKeystroke`，供validate后续处理使用。
    const keyError = validateKeystroke(key)
    // 满足 `keyError` 时，validate执行该分支。
    if (keyError) {
      // context更新为 `contextName`，确保validate后续读取最新状态。
      keyError.context = contextName
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push(keyError)
    }

    // Validate action
    // `action` 与 `null && typeof action !== 'stri...` 不一致时刷新派生状态，避免使用过期结果。
    if (action !== null && typeof action !== 'string') {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        type: 'invalid_action',
        severity: 'error',
        message: `Invalid action for "${key}": must be a string or null`,
        key,
        context: contextName,
      })
    // validate在这里处理 `} else if (typeof action === 'string' && action.startsWith('command:'))...`，完成这一小步状态转换。
    } else if (typeof action === 'string' && action.startsWith('command:')) {
      // Validate command binding format
      // 满足 `!/^command:[a-zA-Z0-9:\-_]+$/.test(action)` 时，validate执行该分支。
      if (!/^command:[a-zA-Z0-9:\-_]+$/.test(action)) {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          type: 'invalid_action',
          severity: 'warning',
          message: `Invalid command binding "${action}" for "${key}": command name may only contain alphanumeric characters, colons, hyphens, and underscores`,
          key,
          context: contextName,
          action,
        })
      }
      // Command bindings must be in Chat context
      // `contextName && contextName` 与 `'Chat'` 不一致时刷新派生状态，避免使用过期结果。
      if (contextName && contextName !== 'Chat') {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          type: 'invalid_action',
          severity: 'warning',
          message: `Command binding "${action}" must be in "Chat" context, not "${contextName}"`,
          key,
          context: contextName,
          action,
          suggestion: 'Move this binding to a block with "context": "Chat"',
        })
      }
    // validate在这里处理 `} else if (action === 'voice:pushToTalk') {`，完成这一小步状态转换。
    } else if (action === 'voice:pushToTalk') {
      // Hold detection needs OS auto-repeat. Bare letters print into the
      // input during warmup and the activation strip is best-effort —
      // space (default) or a modifier combo like meta+k avoid that.
      // ks 集合解析`parseChord`，供validate后续处理使用。
      const ks = parseChord(key)[0]
      // validate在这里进入条件判断，后续代码按实际状态分流。
      if (
        ks &&
        !ks.ctrl &&
        !ks.alt &&
        !ks.shift &&
        !ks.meta &&
        !ks.super &&
        /^[a-z]$/.test(ks.key)
      ) {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          type: 'invalid_action',
          severity: 'warning',
          message: `Binding "${key}" to voice:pushToTalk prints into the input during warmup; use space or a modifier combo like meta+k`,
          key,
          context: contextName,
          action,
        })
      }
    }
  }

  // 返回 `warnings`，作为validate这次计算的结果。
  return warnings
}

/**
 * Detect duplicate keys within the same bindings block in a JSON string.
 * JSON.parse silently uses the last value for duplicate keys,
 * so we need to check the raw string to warn users.
 *
 * Only warns about duplicates within the same context's bindings object.
 * Duplicates across different contexts are allowed (e.g., "enter" in Chat
 * and "enter" in Confirmation).
 */
// checkDuplicateKeysInJson 封装validate的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkDuplicateKeysInJson(
  jsonString: string,
): KeybindingWarning[] {
  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: KeybindingWarning[] = []

  // Find each "bindings" block and check for duplicates within it
  // Pattern: "bindings" : { ... }
  // bindingsBlockPattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const bindingsBlockPattern =
    /"bindings"\s*:\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g

  // blockMatch 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let blockMatch
  // 只要 (blockMatch = bindingsBlockPattern.exec(jsonString)) !== null 成立，就持续推进validate中的循环处理。
  while ((blockMatch = bindingsBlockPattern.exec(jsonString)) !== null) {
    // blockContent读取 `blockMatch[1]` 对应条目，后续围绕该成员继续处理。
    const blockContent = blockMatch[1]
    // blockContent缺失时提前走兜底路径，避免validate继续依赖无效输入。
    if (!blockContent) continue

    // Find the context for this block by looking backwards
    // textBeforeBlock格式化`jsonString.slice`，供validate后续处理使用。
    const textBeforeBlock = jsonString.slice(0, blockMatch.index)
    // contextMatch匹配`textBeforeBlock.match`，供validate后续处理使用。
    const contextMatch = textBeforeBlock.match(
      /"context"\s*:\s*"([^"]+)"[^{]*$/,
    )
    // 上下文保存`contextMatch?.[1] ?? 'unknown'`，供validate后续步骤使用。
    const context = contextMatch?.[1] ?? 'unknown'

    // Find all keys within this bindings block
    // 按键匹配器保存`/"([^"]+)"\s*:/g`，供validate后续步骤使用。
    const keyPattern = /"([^"]+)"\s*:/g
    // 同名按键计数表构建`new Map<string, number>()`，供validate后续步骤使用。
    const keysByName = new Map<string, number>()

    // keyMatch 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let keyMatch
    // 只要 (keyMatch = keyPattern.exec(blockContent)) !== null 成立，就持续推进validate中的循环处理。
    while ((keyMatch = keyPattern.exec(blockContent)) !== null) {
      // 按键保存`keyMatch[1]`，供validate后续步骤使用。
      const key = keyMatch[1]
      // 判断 !key，将validate分流到只适用于该条件的处理路径。
      if (!key) continue

      // 计数读取`keysByName.get`，供validate后续处理使用。
      const count = (keysByName.get(key) ?? 0) + 1
      // keysByName.set写入新的状态值，使validate后续读取保持一致。
      keysByName.set(key, count)

      // 满足 `count === 2` 时，validate执行该分支。
      if (count === 2) {
        // Only warn on the second occurrence
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          type: 'duplicate',
          severity: 'warning',
          message: `Duplicate key "${key}" in ${context} bindings`,
          key,
          context,
          suggestion: `This key appears multiple times in the same context. JSON uses the last value, earlier values are ignored.`,
        })
      }
    }
  }

  // 返回 warnings，把validate这个分支的结果交还调用方。
  return warnings
}

/**
 * Validate user keybinding config and return all warnings.
 */
// validateUserConfig 承担validate中的独立步骤，串起validate需要的输入整理、状态更新和结果输出。
export function validateUserConfig(userBlocks: unknown): KeybindingWarning[] {
  // 警告列表从空数组开始收集，后续按处理顺序追加条目。
  const warnings: KeybindingWarning[] = []

  // 判断 !Array.isArray(userBlocks)，将validate分流到只适用于该条件的处理路径。
  if (!Array.isArray(userBlocks)) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      type: 'parse_error',
      severity: 'error',
      message: 'keybindings.json must contain an array',
      suggestion: 'Wrap your bindings in [ ]',
    })
    // 返回 warnings，把validate这个分支的结果交还调用方。
    return warnings
  }

  // 遍历 let i = 0; i < userBlocks.length; i++，让validate逐项完成同一类处理。
  for (let i = 0; i < userBlocks.length; i++) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push(...validateBlock(userBlocks[i], i))
  }

  // 返回 warnings，把validate这个分支的结果交还调用方。
  return warnings
}

/**
 * Check for duplicate bindings within the same context.
 * Only checks user bindings (not default + user merged).
 */
// checkDuplicates 承担validate中的独立步骤，串起validate需要的输入整理、状态更新和结果输出。
export function checkDuplicates(
  blocks: KeybindingBlock[],
): KeybindingWarning[] {
  // 警告列表从空数组开始收集，后续按处理顺序追加条目。
  const warnings: KeybindingWarning[] = []
  // seenByContext构建`new Map<string, Map<string, string>>()`，供validate后续步骤使用。
  const seenByContext = new Map<string, Map<string, string>>()

  // 遍历 const block of blocks，让validate逐项完成同一类处理。
  for (const block of blocks) {
    // contextMap 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const contextMap =
      seenByContext.get(block.context) ?? new Map<string, string>()
    // seenByContext.set写入新的状态值，使validate后续读取保持一致。
    seenByContext.set(block.context, contextMap)

    // 遍历 const [key, action] of Object.entries(block.bindings)，逐项推进validate里的批量处理。
    for (const [key, action] of Object.entries(block.bindings)) {
      // 规范化按键保存`normalizeKeyForComparison`，供validate后续处理使用。
      const normalizedKey = normalizeKeyForComparison(key)
      // 已有动作读取`contextMap.get`，供validate后续处理使用。
      const existingAction = contextMap.get(normalizedKey)

      // `existingAction && existingAction` 与 `action` 不一致时刷新派生状态。
      if (existingAction && existingAction !== action) {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          type: 'duplicate',
          severity: 'warning',
          message: `Duplicate binding "${key}" in ${block.context} context`,
          key,
          context: block.context,
          action: action ?? 'null (unbind)',
          suggestion: `Previously bound to "${existingAction}". Only the last binding will be used.`,
        })
      }

      // contextMap.set写入新的状态值，使validate后续读取保持一致。
      contextMap.set(normalizedKey, action ?? 'null')
    }
  }

  // 返回 warnings，把validate这个分支的结果交还调用方。
  return warnings
}

/**
 * Check for reserved shortcuts that may not work.
 */
// checkReservedShortcuts 承担validate中的独立步骤，串起validate需要的输入整理、状态更新和结果输出。
export function checkReservedShortcuts(
  bindings: ParsedBinding[],
): KeybindingWarning[] {
  // 警告列表从空数组开始收集，后续按处理顺序追加条目。
  const warnings: KeybindingWarning[] = []
  // 保留快捷键集合读取`getReservedShortcuts`，供validate后续处理使用。
  const reserved = getReservedShortcuts()

  // 遍历 const binding of bindings，让validate逐项完成同一类处理。
  for (const binding of bindings) {
    // keyDisplay保存`chordToString`，供validate后续处理使用。
    const keyDisplay = chordToString(binding.chord)
    // 规范化按键保存`normalizeKeyForComparison`，供validate后续处理使用。
    const normalizedKey = normalizeKeyForComparison(keyDisplay)

    // Check against reserved shortcuts
    // 遍历 const res of reserved，让validate逐项完成同一类处理。
    for (const res of reserved) {
      // 判断 normalizeKeyForComparison(res.key) === normalizedKey，将validate分流到只适用于该条件的处理路径。
      if (normalizeKeyForComparison(res.key) === normalizedKey) {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          type: 'reserved',
          severity: res.severity,
          message: `"${keyDisplay}" may not work: ${res.reason}`,
          key: keyDisplay,
          context: binding.context,
          action: binding.action ?? undefined,
        })
      }
    }
  }

  // 返回 warnings，把validate这个分支的结果交还调用方。
  return warnings
}

/**
 * Parse user blocks into bindings for validation.
 * This is separate from the main parser to avoid importing it.
 */
// getUserBindingsForValidation 承担validate中的独立步骤，串起validate需要的输入整理、状态更新和结果输出。
function getUserBindingsForValidation(
  userBlocks: KeybindingBlock[],
): ParsedBinding[] {
  // 绑定列表从空数组开始收集，后续按处理顺序追加条目。
  const bindings: ParsedBinding[] = []
  // 遍历 const block of userBlocks，让validate逐项完成同一类处理。
  for (const block of userBlocks) {
    // 遍历 const [key, action] of Object.entries(block.bindings)，逐项推进validate里的批量处理。
    for (const [key, action] of Object.entries(block.bindings)) {
      // chord格式化`key.split`，供validate后续处理使用。
      const chord = key.split(' ').map(k => parseKeystroke(k))
      // 绑定列表追加新条目，保持收集顺序与输入顺序一致。
      bindings.push({
        chord,
        action,
        context: block.context,
      })
    }
  }
  // 返回 bindings，把validate这个分支的结果交还调用方。
  return bindings
}

/**
 * Run all validations and return combined warnings.
 */
// validateBindings 承担validate中的独立步骤，串起validate需要的输入整理、状态更新和结果输出。
export function validateBindings(
  userBlocks: unknown,
  _parsedBindings: ParsedBinding[],
): KeybindingWarning[] {
  // 警告列表从空数组开始收集，后续按处理顺序追加条目。
  const warnings: KeybindingWarning[] = []

  // Validate user config structure
  // 警告列表追加新条目，保持收集顺序与输入顺序一致。
  warnings.push(...validateUserConfig(userBlocks))

  // Check for duplicates in user config
  // 判断 isKeybindingBlockArray(userBlocks)，将validate分流到只适用于该条件的处理路径。
  if (isKeybindingBlockArray(userBlocks)) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push(...checkDuplicates(userBlocks))

    // Check for reserved/conflicting shortcuts - only check USER bindings
    // 用户快捷键读取`getUserBindingsForValidation`，供validate后续处理使用。
    const userBindings = getUserBindingsForValidation(userBlocks)
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push(...checkReservedShortcuts(userBindings))
  }

  // Deduplicate warnings (same key+context+type)
  // 已见集合构建`new Set<string>()`，供validate后续步骤使用。
  const seen = new Set<string>()
  // 返回 warnings.filter(w => {，把validate这个分支的结果交还调用方。
  return warnings.filter(w => {
    // 按键保存``${w.type}:${w.key}:${w.context}``，供validate后续步骤使用。
    const key = `${w.type}:${w.key}:${w.context}`
    // 判断 seen.has(key)，将validate分流到只适用于该条件的处理路径。
    if (seen.has(key)) return false
    // seen.add执行validate在此处需要的副作用或外部交互。
    seen.add(key)
    // 返回 true，把validate这个分支的结果交还调用方。
    return true
  })
}

/**
 * Format a warning for display to the user.
 */
// formatWarning 承担validate中的独立步骤，串起validate需要的输入整理、状态更新和结果输出。
export function formatWarning(warning: KeybindingWarning): string {
  // 提示图标记录当前扫描状态，validate随后按该状态分支。
  const icon = warning.severity === 'error' ? '✗' : '⚠'
  // 提示消息保存``${icon} Keybinding ${warning.severity}: ${warning.messag...`，供validate后续步骤使用。
  let msg = `${icon} Keybinding ${warning.severity}: ${warning.message}`

  // 满足 `warning.suggestion` 时，validate执行该分支。
  if (warning.suggestion) {
    // validate处理 `msg += `\n ${warning.suggestion}``，完成这一小步状态转换。
    msg += `\n  ${warning.suggestion}`
  }

  // 返回 msg，把validate这个分支的结果交还调用方。
  return msg
}

/**
 * Format multiple warnings for display.
 */
// formatWarnings 承担validate中的独立步骤，串起validate需要的输入整理、状态更新和结果输出。
export function formatWarnings(warnings: KeybindingWarning[]): string {
  // 判断 warnings.length === 0，将validate分流到只适用于该条件的处理路径。
  if (warnings.length === 0) return ''

  // 错误列表筛选`warnings.filter`，供validate后续处理使用。
  const errors = warnings.filter(w => w.severity === 'error')
  // 警告列表筛选`warnings.filter`，供validate后续处理使用。
  const warns = warnings.filter(w => w.severity === 'warning')

  // 文本行从空数组开始收集，后续按处理顺序追加条目。
  const lines: string[] = []

  // 满足 `errors.length > 0` 时，validate执行该分支。
  if (errors.length > 0) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `Found ${errors.length} keybinding ${plural(errors.length, 'error')}:`,
    )
    // 遍历 const e of errors，让validate逐项完成同一类处理。
    for (const e of errors) {
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(formatWarning(e))
    }
  }

  // 满足 `warns.length > 0` 时，validate执行该分支。
  if (warns.length > 0) {
    // 判断 lines.length > 0) lines.push(''，将validate分流到只适用于该条件的处理路径。
    if (lines.length > 0) lines.push('')
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `Found ${warns.length} keybinding ${plural(warns.length, 'warning')}:`,
    )
    // 遍历 const w of warns，让validate逐项完成同一类处理。
    for (const w of warns) {
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(formatWarning(w))
    }
  }

  // 返回 lines.join('\n')，把validate这个分支的结果交还调用方。
  return lines.join('\n')
}

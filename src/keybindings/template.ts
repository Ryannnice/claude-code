/**
 * Keybindings template generator.
 * Generates a well-documented template file for ~/.claude/keybindings.json
 */

// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'
// 引入 DEFAULT_BINDINGS，将 ./defaultBindings.js 中已经封装好的能力接到本文件流程里。
import { DEFAULT_BINDINGS } from './defaultBindings.js'
// 整理这一组导入，让template后续逻辑可以直接复用这些外部能力。
import {
  NON_REBINDABLE,
  normalizeKeyForComparison,
} from './reservedShortcuts.js'
// 类型依赖 { KeybindingBlock } 来自 ./types.js，用于校准template的数据契约。
import type { KeybindingBlock } from './types.js'

/**
 * Filter out reserved shortcuts that cannot be rebound.
 * These would cause /doctor to warn, so we exclude them from the template.
 */
// filterReservedShortcuts 封装template的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function filterReservedShortcuts(blocks: KeybindingBlock[]): KeybindingBlock[] {
  // reservedKeys 集合保存`Set`，供template后续处理使用。
  const reservedKeys = new Set(
    NON_REBINDABLE.map(r => normalizeKeyForComparison(r.key)),
  )

  // 返回 `blocks`，作为template这次计算的结果。
  return blocks
    // 链式调用 map，继续加工上一行在template中产生的数据。
    .map(block => {
      // filteredBindings 集合 从空对象开始收集键值，后续按名称补齐内容。
      const filteredBindings: Record<string, string | null> = {}
      // 循环处理 `const [key, action] of Object.entries(block.bindings)`，让template把同类条目按顺序走完。
      for (const [key, action] of Object.entries(block.bindings)) {
        // 满足 `!reservedKeys.has(normalizeKeyForComparison(key))` 时，template执行该分支。
        if (!reservedKeys.has(normalizeKeyForComparison(key))) {
          // filteredBindings[key更新为 `action`，确保template后续读取最新状态。
          filteredBindings[key] = action
        }
      }
      // 返回结构化结果，集中表达template已经整理出的状态。
      return { context: block.context, bindings: filteredBindings }
    })
    // 链式调用 filter，继续加工上一行在template中产生的数据。
    .filter(block => Object.keys(block.bindings).length > 0)
}

/**
 * Generate a template keybindings.json file content.
 * Creates a fully valid JSON file with all default bindings that users can customize.
 */
// generateKeybindingsTemplate 封装template的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateKeybindingsTemplate(): string {
  // Filter out reserved shortcuts that cannot be rebound
  // bindings 集合筛选`filterReservedShortcuts`，供template后续处理使用。
  const bindings = filterReservedShortcuts(DEFAULT_BINDINGS)

  // Format as object wrapper with bindings array
  // 配置 集中保存template要一起传递的字段。
  const config = {
    $schema: 'https://www.schemastore.org/claude-code-keybindings.json',
    $docs: 'https://code.claude.com/docs/en/keybindings',
    bindings,
  }

  // 返回 `jsonStringify(config, null, 2) + '\n'`，作为template这次计算的结果。
  return jsonStringify(config, null, 2) + '\n'
}

// 引入 DEFAULT_BINDINGS，将 ../../keybindings/defaultBindings.js 中已经封装好的能力接到本文件流程里。
import { DEFAULT_BINDINGS } from '../../keybindings/defaultBindings.js'
// 引入 isKeybindingCustomizationEnabled，将 ../../keybindings/loadUserBindings.js 中已经封装好的能力接到本文件流程里。
import { isKeybindingCustomizationEnabled } from '../../keybindings/loadUserBindings.js'
// 整理这一组导入，让keybindings后续逻辑可以直接复用这些外部能力。
import {
  MACOS_RESERVED,
  NON_REBINDABLE,
  TERMINAL_RESERVED,
} from '../../keybindings/reservedShortcuts.js'
// 类型依赖 { KeybindingsSchemaType } 来自 ../../keybindings/schema.js，用于校准keybindings的数据契约。
import type { KeybindingsSchemaType } from '../../keybindings/schema.js'
// 整理这一组导入，让keybindings后续逻辑可以直接复用这些外部能力。
import {
  KEYBINDING_ACTIONS,
  KEYBINDING_CONTEXT_DESCRIPTIONS,
  KEYBINDING_CONTEXTS,
} from '../../keybindings/schema.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

/**
 * Build a markdown table of all contexts.
 */
// generateContextsTable 封装keybindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateContextsTable(): string {
  // 返回 `markdownTable(`，作为keybindings这次计算的结果。
  return markdownTable(
    ['Context', 'Description'],
    KEYBINDING_CONTEXTS.map(ctx => [
      `\`${ctx}\``,
      KEYBINDING_CONTEXT_DESCRIPTIONS[ctx],
    ]),
  )
}

/**
 * Build a markdown table of all actions with their default bindings and context.
 */
// generateActionsTable 封装keybindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateActionsTable(): string {
  // Build a lookup: action -> { keys, context }
  // actionInfo 从空对象开始收集键值，后续按名称补齐内容。
  const actionInfo: Record<string, { keys: string[]; context: string }> = {}
  // 按顺序遍历 `DEFAULT_BINDINGS` 中的block，逐个交给keybindings处理。
  for (const block of DEFAULT_BINDINGS) {
    // 循环处理 `const [key, action] of Object.entries(block.bindings)`，让keybindings把同类条目按顺序走完。
    for (const [key, action] of Object.entries(block.bindings)) {
      // 满足 `action` 时，keybindings执行该分支。
      if (action) {
        // 满足 `!actionInfo[action]` 时，keybindings执行该分支。
        if (!actionInfo[action]) {
          // actionInfo[action更新为 `{ keys: [], context: block.context }`，确保keybindings后续读取最新状态。
          actionInfo[action] = { keys: [], context: block.context }
        }
        // keybindings在这里处理 `actionInfo[action].keys.push(key)`，完成这一小步状态转换。
        actionInfo[action].keys.push(key)
      }
    }
  }

  // 返回 `markdownTable(`，作为keybindings这次计算的结果。
  return markdownTable(
    ['Action', 'Default Key(s)', 'Context'],
    // 调用 KEYBINDING_ACTIONS.map，触发keybindings此处需要的副作用。
    KEYBINDING_ACTIONS.map(action => {
      // info读取 `actionInfo[action]` 对应条目，后续围绕该成员继续处理。
      const info = actionInfo[action]
      // keys 集合派生`keys.map`，供keybindings后续处理使用。
      const keys = info ? info.keys.map(k => `\`${k}\``).join(', ') : '(none)'
      // context保存`inferContextFromAction`，供keybindings后续处理使用。
      const context = info ? info.context : inferContextFromAction(action)
      // 返回列表结果，保留keybindings已经排好的条目顺序。
      return [`\`${action}\``, keys, context]
    }),
  )
}

/**
 * Infer context from action prefix when not in DEFAULT_BINDINGS.
 */
// inferContextFromAction 封装keybindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function inferContextFromAction(action: string): string {
  // prefix格式化`action.split`，供keybindings后续处理使用。
  const prefix = action.split(':')[0]
  // prefixToContext 集中保存keybindings要一起传递的字段。
  const prefixToContext: Record<string, string> = {
    app: 'Global',
    history: 'Global or Chat',
    chat: 'Chat',
    autocomplete: 'Autocomplete',
    confirm: 'Confirmation',
    tabs: 'Tabs',
    transcript: 'Transcript',
    historySearch: 'HistorySearch',
    task: 'Task',
    theme: 'ThemePicker',
    help: 'Help',
    attachments: 'Attachments',
    footer: 'Footer',
    messageSelector: 'MessageSelector',
    diff: 'DiffDialog',
    modelPicker: 'ModelPicker',
    select: 'Select',
    permission: 'Confirmation',
  }
  // 返回 `prefixToContext[prefix ?? ''] ?? 'Unknown'`，作为keybindings这次计算的结果。
  return prefixToContext[prefix ?? ''] ?? 'Unknown'
}

/**
 * Build a list of reserved shortcuts.
 */
// generateReservedShortcuts 封装keybindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateReservedShortcuts(): string {
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []

  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('### Non-rebindable (errors)')
  // 按顺序遍历 `NON_REBINDABLE` 中的s 集合，逐个交给keybindings处理。
  for (const s of NON_REBINDABLE) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`- \`${s.key}\` — ${s.reason}`)
  }

  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('### Terminal reserved (errors/warnings)')
  // 按顺序遍历 `TERMINAL_RESERVED` 中的s 集合，逐个交给keybindings处理。
  for (const s of TERMINAL_RESERVED) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `- \`${s.key}\` — ${s.reason} (${s.severity === 'error' ? 'will not work' : 'may conflict'})`,
    )
  }

  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('### macOS reserved (errors)')
  // 按顺序遍历 `MACOS_RESERVED` 中的s 集合，逐个交给keybindings处理。
  for (const s of MACOS_RESERVED) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`- \`${s.key}\` — ${s.reason}`)
  }

  // 返回 `lines.join('\n')`，作为keybindings这次计算的结果。
  return lines.join('\n')
}

// FILE_FORMAT_EXAMPLE 文件数据 集中保存keybindings要一起传递的字段。
const FILE_FORMAT_EXAMPLE: KeybindingsSchemaType = {
  $schema: 'https://www.schemastore.org/claude-code-keybindings.json',
  $docs: 'https://code.claude.com/docs/en/keybindings',
  bindings: [
    {
      context: 'Chat',
      bindings: {
        'ctrl+e': 'chat:externalEditor',
      },
    },
  ],
}

// UNBIND_EXAMPLE 集中保存keybindings要一起传递的字段。
const UNBIND_EXAMPLE: KeybindingsSchemaType['bindings'][number] = {
  context: 'Chat',
  bindings: {
    'ctrl+s': null,
  },
}

// REBIND_EXAMPLE 集中保存keybindings要一起传递的字段。
const REBIND_EXAMPLE: KeybindingsSchemaType['bindings'][number] = {
  context: 'Chat',
  bindings: {
    'ctrl+g': null,
    'ctrl+e': 'chat:externalEditor',
  },
}

// CHORD_EXAMPLE 集中保存keybindings要一起传递的字段。
const CHORD_EXAMPLE: KeybindingsSchemaType['bindings'][number] = {
  context: 'Global',
  bindings: {
    'ctrl+k ctrl+t': 'app:toggleTodos',
  },
}

// SECTION_INTRO 聚合成有序列表，保持后续遍历顺序稳定。
const SECTION_INTRO = [
  '# Keybindings Skill',
  '',
  'Create or modify `~/.claude/keybindings.json` to customize keyboard shortcuts.',
  '',
  '## CRITICAL: Read Before Write',
  '',
  '**Always read `~/.claude/keybindings.json` first** (it may not exist yet). Merge changes with existing bindings — never replace the entire file.',
  '',
  '- Use **Edit** tool for modifications to existing files',
  '- Use **Write** tool only if the file does not exist yet',
].join('\n')

// SECTION_FILE_FORMAT 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
const SECTION_FILE_FORMAT = [
  '## File Format',
  '',
  '```json',
  jsonStringify(FILE_FORMAT_EXAMPLE, null, 2),
  '```',
  '',
  'Always include the `$schema` and `$docs` fields.',
].join('\n')

// SECTION_KEYSTROKE_SYNTAX 聚合成有序列表，保持后续遍历顺序稳定。
const SECTION_KEYSTROKE_SYNTAX = [
  '## Keystroke Syntax',
  '',
  '**Modifiers** (combine with `+`):',
  '- `ctrl` (alias: `control`)',
  '- `alt` (aliases: `opt`, `option`) — note: `alt` and `meta` are identical in terminals',
  '- `shift`',
  '- `meta` (aliases: `cmd`, `command`)',
  '',
  '**Special keys**: `escape`/`esc`, `enter`/`return`, `tab`, `space`, `backspace`, `delete`, `up`, `down`, `left`, `right`',
  '',
  '**Chords**: Space-separated keystrokes, e.g. `ctrl+k ctrl+s` (1-second timeout between keystrokes)',
  '',
  '**Examples**: `ctrl+shift+p`, `alt+enter`, `ctrl+k ctrl+n`',
].join('\n')

// SECTION_UNBINDING 聚合成有序列表，保持后续遍历顺序稳定。
const SECTION_UNBINDING = [
  '## Unbinding Default Shortcuts',
  '',
  'Set a key to `null` to remove its default binding:',
  '',
  '```json',
  jsonStringify(UNBIND_EXAMPLE, null, 2),
  '```',
].join('\n')

// SECTION_INTERACTION 聚合成有序列表，保持后续遍历顺序稳定。
const SECTION_INTERACTION = [
  '## How User Bindings Interact with Defaults',
  '',
  '- User bindings are **additive** — they are appended after the default bindings',
  '- To **move** a binding to a different key: unbind the old key (`null`) AND add the new binding',
  "- A context only needs to appear in the user's file if they want to change something in that context",
].join('\n')

// SECTION_COMMON_PATTERNS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SECTION_COMMON_PATTERNS = [
  '## Common Patterns',
  '',
  '### Rebind a key',
  'To change the external editor shortcut from `ctrl+g` to `ctrl+e`:',
  '```json',
  jsonStringify(REBIND_EXAMPLE, null, 2),
  '```',
  '',
  '### Add a chord binding',
  '```json',
  jsonStringify(CHORD_EXAMPLE, null, 2),
  '```',
].join('\n')

// SECTION_BEHAVIORAL_RULES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SECTION_BEHAVIORAL_RULES = [
  '## Behavioral Rules',
  '',
  '1. Only include contexts the user wants to change (minimal overrides)',
  '2. Validate that actions and contexts are from the known lists below',
  '3. Warn the user proactively if they choose a key that conflicts with reserved shortcuts or common tools like tmux (`ctrl+b`) and screen (`ctrl+a`)',
  '4. When adding a new binding for an existing action, the new binding is additive (existing default still works unless explicitly unbound)',
  '5. To fully replace a default binding, unbind the old key AND add the new one',
].join('\n')

// SECTION_DOCTOR 聚合成有序列表，保持后续遍历顺序稳定。
const SECTION_DOCTOR = [
  '## Validation with /doctor',
  '',
  'The `/doctor` command includes a "Keybinding Configuration Issues" section that validates `~/.claude/keybindings.json`.',
  '',
  '### Common Issues and Fixes',
  '',
  markdownTable(
    ['Issue', 'Cause', 'Fix'],
    [
      [
        '`keybindings.json must have a "bindings" array`',
        'Missing wrapper object',
        'Wrap bindings in `{ "bindings": [...] }`',
      ],
      [
        '`"bindings" must be an array`',
        '`bindings` is not an array',
        'Set `"bindings"` to an array: `[{ context: ..., bindings: ... }]`',
      ],
      [
        '`Unknown context "X"`',
        'Typo or invalid context name',
        'Use exact context names from the Available Contexts table',
      ],
      [
        '`Duplicate key "X" in Y bindings`',
        'Same key defined twice in one context',
        'Remove the duplicate; JSON uses only the last value',
      ],
      [
        '`"X" may not work: ...`',
        'Key conflicts with terminal/OS reserved shortcut',
        'Choose a different key (see Reserved Shortcuts section)',
      ],
      [
        '`Could not parse keystroke "X"`',
        'Invalid key syntax',
        'Check syntax: use `+` between modifiers, valid key names',
      ],
      [
        '`Invalid action for "X"`',
        'Action value is not a string or null',
        'Actions must be strings like `"app:help"` or `null` to unbind',
      ],
    ],
  ),
  '',
  '### Example /doctor Output',
  '',
  '```',
  'Keybinding Configuration Issues',
  'Location: ~/.claude/keybindings.json',
  '  └ [Error] Unknown context "chat"',
  '    → Valid contexts: Global, Chat, Autocomplete, ...',
  '  └ [Warning] "ctrl+c" may not work: Terminal interrupt (SIGINT)',
  '```',
  '',
  '**Errors** prevent bindings from working and must be fixed. **Warnings** indicate potential conflicts but the binding may still work.',
].join('\n')

// registerKeybindingsSkill 封装keybindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerKeybindingsSkill(): void {
  // 调用 registerBundledSkill，触发keybindings此处需要的副作用。
  registerBundledSkill({
    name: 'keybindings-help',
    description:
      'Use when the user wants to customize keyboard shortcuts, rebind keys, add chord bindings, or modify ~/.claude/keybindings.json. Examples: "rebind ctrl+s", "add a chord shortcut", "change the submit key", "customize keybindings".',
    allowedTools: ['Read'],
    userInvocable: false,
    isEnabled: isKeybindingCustomizationEnabled,
    // getPromptForCommand 根据 args 读取或计算keybindings需要的结果。
    async getPromptForCommand(args) {
      // Generate reference tables dynamically from source-of-truth arrays
      // contextsTable保存`generateContextsTable`，供keybindings后续处理使用。
      const contextsTable = generateContextsTable()
      // actionsTable保存`generateActionsTable`，供keybindings后续处理使用。
      const actionsTable = generateActionsTable()
      // reservedShortcuts 集合保存`generateReservedShortcuts`，供keybindings后续处理使用。
      const reservedShortcuts = generateReservedShortcuts()

      // sections 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const sections = [
        SECTION_INTRO,
        SECTION_FILE_FORMAT,
        SECTION_KEYSTROKE_SYNTAX,
        SECTION_UNBINDING,
        SECTION_INTERACTION,
        SECTION_COMMON_PATTERNS,
        SECTION_BEHAVIORAL_RULES,
        SECTION_DOCTOR,
        `## Reserved Shortcuts\n\n${reservedShortcuts}`,
        `## Available Contexts\n\n${contextsTable}`,
        `## Available Actions\n\n${actionsTable}`,
      ]

      // 满足 `args` 时，keybindings执行该分支。
      if (args) {
        // sections 集合追加新条目，保持收集顺序与输入顺序一致。
        sections.push(`## User Request\n\n${args}`)
      }

      // 返回列表结果，保留keybindings已经排好的条目顺序。
      return [{ type: 'text', text: sections.join('\n\n') }]
    },
  })
}

/**
 * Build a markdown table from headers and rows.
 */
// markdownTable 封装keybindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function markdownTable(headers: string[], rows: string[][]): string {
  // separator派生`headers.map`，供keybindings后续处理使用。
  const separator = headers.map(() => '---')
  // 返回列表结果，保留keybindings已经排好的条目顺序。
  return [
    `| ${headers.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    // 链式调用 链式方法，继续加工上一行在keybindings中产生的数据。
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n')
}

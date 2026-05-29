// 引入 Fuse，将 fuse.js 中已经封装好的能力接到本文件流程里。
import Fuse from 'fuse.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type Command,
  formatDescriptionWithSource,
  getCommand,
  getCommandName,
} from '../../commands.js'
// 类型依赖 { SuggestionItem } 来自 ../../components/PromptInput/PromptInputFooterSuggestions.js，用于校准共享工具的数据契约。
import type { SuggestionItem } from '../../components/PromptInput/PromptInputFooterSuggestions.js'
// 引入 getSkillUsageScore，将 ./skillUsageTracking.js 中已经封装好的能力接到本文件流程里。
import { getSkillUsageScore } from './skillUsageTracking.js'

// Treat these characters as word separators for command search
// SEPARATORS 集合保存`/[:_-]/g`，供共享工具 command Suggestions后续判断或输出使用。
const SEPARATORS = /[:_-]/g

// CommandSearchItem 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CommandSearchItem = {
  descriptionKey: string[]
  partKey: string[] | undefined
  commandName: string
  command: Command
  aliasKey: string[] | undefined
}

// Cache the Fuse index keyed by the commands array identity. The commands
// array is stable (memoized in REPL.tsx), so we only rebuild when it changes
// rather than on every keystroke.
// fuseCache 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let fuseCache: {
  commands: Command[]
  fuse: Fuse<CommandSearchItem>
} | null = null

// getCommandFuse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCommandFuse(commands: Command[]): Fuse<CommandSearchItem> {
  // 满足 `fuseCache?.commands === commands` 时，共享工具执行该分支。
  if (fuseCache?.commands === commands) {
    // 返回 `fuseCache.fuse`，作为共享工具这次计算的结果。
    return fuseCache.fuse
  }

  // commandData 命令数据保存`commands`，供共享工具 command Suggestions后续判断或输出使用。
  const commandData: CommandSearchItem[] = commands
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(cmd => !cmd.isHidden)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(cmd => {
      // commandName 命令数据读取`getCommandName`，供共享工具后续处理使用。
      const commandName = getCommandName(cmd)
      // 片段列表格式化`commandName.split`，供共享工具后续处理使用。
      const parts = commandName.split(SEPARATORS).filter(Boolean)

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        descriptionKey: (cmd.description ?? '')
          .split(' ')
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(word => cleanWord(word))
          .filter(Boolean),
        partKey: parts.length > 1 ? parts : undefined,
        commandName,
        command: cmd,
        aliasKey: cmd.aliases,
      }
    })

  // fuse保存`Fuse`，供共享工具后续处理使用。
  const fuse = new Fuse(commandData, {
    includeScore: true,
    threshold: 0.3, // relatively strict matching
    location: 0, // prefer matches at the beginning of strings
    distance: 100, // increased to allow matching in descriptions
    keys: [
      {
        name: 'commandName',
        weight: 3, // Highest priority for command names
      },
      {
        name: 'partKey',
        weight: 2, // Next highest priority for command parts
      },
      {
        name: 'aliasKey',
        weight: 2, // Same high priority for aliases
      },
      {
        name: 'descriptionKey',
        weight: 0.5, // Lower priority for descriptions
      },
    ],
  })

  // fuseCache 缓存更新为 `{ commands, fuse }`，确保共享工具后续读取最新状态。
  fuseCache = { commands, fuse }
  // 返回 `fuse`，作为共享工具这次计算的结果。
  return fuse
}

/**
 * Type guard to check if a suggestion's metadata is a Command.
 * Commands have a name string and a type property.
 */
// isCommandMetadata 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCommandMetadata(metadata: unknown): metadata is Command {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'name' in metadata &&
    typeof (metadata as { name: unknown }).name === 'string' &&
    'type' in metadata
  )
}

/**
 * Represents a slash command found mid-input (not at the start)
 */
// MidInputSlashCommand 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MidInputSlashCommand = {
  token: string // e.g., "/com"
  startPos: number // Position of "/"
  partialCommand: string // e.g., "com"
}

/**
 * Finds a slash command token that appears mid-input (not at position 0).
 * A mid-input slash command is a "/" preceded by whitespace, where the cursor
 * is at or after the "/".
 *
 * @param input The full input string
 * @param cursorOffset The current cursor position
 * @returns The mid-input slash command info, or null if not found
 */
// findMidInputSlashCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findMidInputSlashCommand(
  input: string,
  cursorOffset: number,
): MidInputSlashCommand | null {
  // If input starts with "/", this is start-of-input case (handled elsewhere)
  // 满足 `input.startsWith('/')` 时，共享工具执行该分支。
  if (input.startsWith('/')) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Look backwards from cursor to find a "/" preceded by whitespace
  // beforeCursor格式化`input.slice`，供共享工具后续处理使用。
  const beforeCursor = input.slice(0, cursorOffset)

  // Find the last "/" in the text before cursor
  // Pattern: whitespace followed by "/" then optional alphanumeric/dash characters.
  // Lookbehind (?<=\s) is avoided — it defeats YARR JIT in JSC, and the
  // interpreter scans O(n) even with the $ anchor. Capture the whitespace
  // instead and offset match.index by 1.
  // match匹配`beforeCursor.match`，供共享工具后续处理使用。
  const match = beforeCursor.match(/\s\/([a-zA-Z0-9_:-]*)$/)
  // 只有 `!match || match.index === undefined` 满足时，共享工具才执行该分支。
  if (!match || match.index === undefined) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Get the full token (may extend past cursor)
  // slashPos 集合保存`match.index + 1`，供后续判断或组装使用。
  const slashPos = match.index + 1
  // textAfterSlash格式化`input.slice`，供共享工具后续处理使用。
  const textAfterSlash = input.slice(slashPos + 1)

  // Extract the command portion (until whitespace or end)
  // commandMatch 命令数据匹配`textAfterSlash.match`，供共享工具后续处理使用。
  const commandMatch = textAfterSlash.match(/^[a-zA-Z0-9_:-]*/)
  // fullCommand 命令数据读取 `commandMatch ? commandMatch[0] : ''` 对应条目，后续围绕该成员继续处理。
  const fullCommand = commandMatch ? commandMatch[0] : ''

  // If cursor is past the command (after a space), don't show ghost text
  // 满足 `cursorOffset > slashPos + 1 + fullCommand.length` 时，共享工具执行该分支。
  if (cursorOffset > slashPos + 1 + fullCommand.length) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    token: '/' + fullCommand,
    startPos: slashPos,
    partialCommand: fullCommand,
  }
}

/**
 * Finds the best matching command for a partial command string.
 * Delegates to generateCommandSuggestions and filters to prefix matches.
 *
 * @param partialCommand The partial command typed by the user (without "/")
 * @param commands Available commands
 * @returns The completion suffix (e.g., "mit" for partial "com" matching "commit"), or null
 */
// getBestCommandMatch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBestCommandMatch(
  partialCommand: string,
  commands: Command[],
): { suffix: string; fullCommand: string } | null {
  // partialCommand 命令数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!partialCommand) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Use existing suggestion logic
  // suggestions 集合保存`generateCommandSuggestions`，供共享工具后续处理使用。
  const suggestions = generateCommandSuggestions('/' + partialCommand, commands)
  // suggestions 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (suggestions.length === 0) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Find first suggestion that is a prefix match (for inline completion)
  // query保存`partialCommand.toLowerCase`，供共享工具后续处理使用。
  const query = partialCommand.toLowerCase()
  // 按顺序遍历 `suggestions` 中的suggestion，逐个交给共享工具处理。
  for (const suggestion of suggestions) {
    // 满足 `!isCommandMetadata(suggestion.metadata)` 时，共享工具执行该分支。
    if (!isCommandMetadata(suggestion.metadata)) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 名称读取`getCommandName`，供共享工具后续处理使用。
    const name = getCommandName(suggestion.metadata)
    // 满足 `name.toLowerCase().startsWith(query)` 时，共享工具执行该分支。
    if (name.toLowerCase().startsWith(query)) {
      // suffix格式化`name.slice`，供共享工具后续处理使用。
      const suffix = name.slice(partialCommand.length)
      // Only return if there's something to complete
      // 满足 `suffix` 时，共享工具执行该分支。
      if (suffix) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { suffix, fullCommand: name }
      }
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if input is a command (starts with slash)
 */
// isCommandInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCommandInput(input: string): boolean {
  // 返回 `input.startsWith('/')`，作为共享工具这次计算的结果。
  return input.startsWith('/')
}

/**
 * Checks if a command input has arguments
 * A command with just a trailing space is considered to have no arguments
 */
// hasCommandArgs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasCommandArgs(input: string): boolean {
  // 满足 `!isCommandInput(input)` 时，共享工具执行该分支。
  if (!isCommandInput(input)) return false

  // 满足 `!input.includes(' ')` 时，共享工具执行该分支。
  if (!input.includes(' ')) return false

  // 满足 `input.endsWith(' ')` 时，共享工具执行该分支。
  if (input.endsWith(' ')) return false

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Formats a command with proper notation
 */
// formatCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatCommand(command: string): string {
  // 返回 ``/${command} ``，作为共享工具这次计算的结果。
  return `/${command} `
}

/**
 * Generates a deterministic unique ID for a command suggestion.
 * Commands with the same name from different sources get unique IDs.
 *
 * Only prompt commands can have duplicates (from user settings, project
 * settings, plugins, etc). Built-in commands (local, local-jsx) are
 * defined once in code and can't have duplicates.
 */
// getCommandId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCommandId(cmd: Command): string {
  // commandName 命令数据读取`getCommandName`，供共享工具后续处理使用。
  const commandName = getCommandName(cmd)
  // 当 `cmd.type` 匹配 `'prompt'` 时，共享工具执行对应分支。
  if (cmd.type === 'prompt') {
    // For plugin commands, include the repository to disambiguate
    // 只有 `cmd.source === 'plugin' && cmd.pluginInfo?.reposi` 满足时，共享工具才执行该分支。
    if (cmd.source === 'plugin' && cmd.pluginInfo?.repository) {
      // 返回 ``${commandName}:${cmd.source}:${cmd.pluginInfo.repository}``，作为共享工具这次计算的结果。
      return `${commandName}:${cmd.source}:${cmd.pluginInfo.repository}`
    }
    // 返回 ``${commandName}:${cmd.source}``，作为共享工具这次计算的结果。
    return `${commandName}:${cmd.source}`
  }
  // Built-in commands include type as fallback for future-proofing
  // 返回 ``${commandName}:${cmd.type}``，作为共享工具这次计算的结果。
  return `${commandName}:${cmd.type}`
}

/**
 * Checks if a query matches any of the command's aliases.
 * Returns the matched alias if found, otherwise undefined.
 */
// findMatchedAlias 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findMatchedAlias(
  query: string,
  aliases?: string[],
): string | undefined {
  // 只有 `!aliases || aliases.length === 0 || query === ''` 满足时，共享工具才执行该分支。
  if (!aliases || aliases.length === 0 || query === '') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // Check if query is a prefix of any alias (case-insensitive)
  // 返回 `aliases.find(alias => alias.toLowerCase().startsWith(query))`，作为共享工具这次计算的结果。
  return aliases.find(alias => alias.toLowerCase().startsWith(query))
}

/**
 * Creates a suggestion item from a command.
 * Only shows the matched alias in parentheses if the user typed an alias.
 */
// createCommandSuggestionItem 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createCommandSuggestionItem(
  cmd: Command,
  matchedAlias?: string,
): SuggestionItem {
  // commandName 命令数据读取`getCommandName`，供共享工具后续处理使用。
  const commandName = getCommandName(cmd)
  // Only show the alias if the user typed it
  // aliasText保存`matchedAlias ? ` (${matchedAlias})` : ''`，供共享工具 command Suggestions后续判断或输出使用。
  const aliasText = matchedAlias ? ` (${matchedAlias})` : ''

  // isWorkflow标记共享工具 command Suggestions是否启用对应路径。
  const isWorkflow = cmd.type === 'prompt' && cmd.kind === 'workflow'
  // fullDescription 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const fullDescription =
    (isWorkflow ? cmd.description : formatDescriptionWithSource(cmd)) +
    (cmd.type === 'prompt' && cmd.argNames?.length
      ? ` (arguments: ${cmd.argNames.join(', ')})`
      : '')

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    id: getCommandId(cmd),
    displayText: `/${commandName}${aliasText}`,
    tag: isWorkflow ? 'workflow' : undefined,
    description: fullDescription,
    metadata: cmd,
  }
}

/**
 * Generate command suggestions based on input
 */
// generateCommandSuggestions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateCommandSuggestions(
  input: string,
  commands: Command[],
): SuggestionItem[] {
  // Only process command input
  // 满足 `!isCommandInput(input)` 时，共享工具执行该分支。
  if (!isCommandInput(input)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // If there are arguments, don't show suggestions
  // 满足 `hasCommandArgs(input)` 时，共享工具执行该分支。
  if (hasCommandArgs(input)) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // query格式化`input.slice`，供共享工具后续处理使用。
  const query = input.slice(1).toLowerCase().trim()

  // When just typing '/' without additional text
  // 满足 `query === ''` 时，共享工具执行该分支。
  if (query === '') {
    // visibleCommands 命令数据筛选`commands.filter`，供共享工具后续处理使用。
    const visibleCommands = commands.filter(cmd => !cmd.isHidden)

    // Find recently used skills (only prompt commands have usage tracking)
    // recentlyUsed 从空数组开始收集，后续循环会按处理顺序追加条目。
    const recentlyUsed: Command[] = []
    // commandsWithScores 命令数据保存`visibleCommands`，供共享工具 command Suggestions后续判断或输出使用。
    const commandsWithScores = visibleCommands
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(cmd => cmd.type === 'prompt')
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(cmd => ({
        cmd,
        score: getSkillUsageScore(getCommandName(cmd)),
      }))
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(item => item.score > 0)
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => b.score - a.score)

    // Take top 5 recently used skills
    // 逐项读取 `commandsWithScores.slice(0, 5)` 中的item，按输入顺序推进共享工具。
    for (const item of commandsWithScores.slice(0, 5)) {
      // recentlyUsed追加新条目，保持收集顺序与输入顺序一致。
      recentlyUsed.push(item.cmd)
    }

    // Create a set of recently used command IDs to avoid duplicates
    // recentlyUsedIds 集合保存`Set`，供共享工具后续处理使用。
    const recentlyUsedIds = new Set(recentlyUsed.map(cmd => getCommandId(cmd)))

    // Categorize remaining commands (excluding recently used)
    // builtinCommands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const builtinCommands: Command[] = []
    // userCommands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const userCommands: Command[] = []
    // projectCommands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const projectCommands: Command[] = []
    // policyCommands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const policyCommands: Command[] = []
    // otherCommands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const otherCommands: Command[] = []

    // 调用 visibleCommands.forEach，触发共享工具此处需要的副作用。
    visibleCommands.forEach(cmd => {
      // Skip if already in recently used
      // 满足 `recentlyUsedIds.has(getCommandId(cmd))` 时，共享工具执行该分支。
      if (recentlyUsedIds.has(getCommandId(cmd))) {
        // 共享工具 command Suggestions在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 当 `cmd.type` 匹配 `'local' || cmd.type === 'lo...` 时，共享工具执行对应分支。
      if (cmd.type === 'local' || cmd.type === 'local-jsx') {
        // builtinCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
        builtinCommands.push(cmd)
      // 共享工具 command Suggestions在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        cmd.type === 'prompt' &&
        (cmd.source === 'userSettings' || cmd.source === 'localSettings')
      ) {
        // userCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
        userCommands.push(cmd)
      // 共享工具 command Suggestions在这里处理 `} else if (cmd.type === 'prompt' && cmd.source === 'projectSettings') {`，完成这一小步状态转换。
      } else if (cmd.type === 'prompt' && cmd.source === 'projectSettings') {
        // projectCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
        projectCommands.push(cmd)
      // 共享工具 command Suggestions在这里处理 `} else if (cmd.type === 'prompt' && cmd.source === 'policySettings') {`，完成这一小步状态转换。
      } else if (cmd.type === 'prompt' && cmd.source === 'policySettings') {
        // policyCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
        policyCommands.push(cmd)
      } else {
        // otherCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
        otherCommands.push(cmd)
      }
    })

    // Sort each category alphabetically
    // sortAlphabetically封装成回调，供共享工具 command Suggestions在事件触发或异步步骤中调用。
    const sortAlphabetically = (a: Command, b: Command) =>
      getCommandName(a).localeCompare(getCommandName(b))

    // 调用 builtinCommands.sort，触发共享工具此处需要的副作用。
    builtinCommands.sort(sortAlphabetically)
    // 调用 userCommands.sort，触发共享工具此处需要的副作用。
    userCommands.sort(sortAlphabetically)
    // 调用 projectCommands.sort，触发共享工具此处需要的副作用。
    projectCommands.sort(sortAlphabetically)
    // 调用 policyCommands.sort，触发共享工具此处需要的副作用。
    policyCommands.sort(sortAlphabetically)
    // 调用 otherCommands.sort，触发共享工具此处需要的副作用。
    otherCommands.sort(sortAlphabetically)

    // Combine with built-in commands prioritized after recently used,
    // so they remain visible even when many skills are installed
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [
      ...recentlyUsed,
      ...builtinCommands,
      ...userCommands,
      ...projectCommands,
      ...policyCommands,
      ...otherCommands,
    // 这个回调绑定到 ].map(cmd => createCommandSuggestionItem(cmd))，负责共享工具在该局部场景下的响应。
    ].map(cmd => createCommandSuggestionItem(cmd))
  }

  // The Fuse index filters isHidden at build time and is keyed on the
  // (memoized) commands array identity, so a command that is hidden when Fuse
  // first builds stays invisible to Fuse for the whole session. If the user
  // types the exact name of a currently-hidden command, prepend it to the
  // Fuse results so exact-name always wins over weak description fuzzy
  // matches — but only when no visible command shares the name (that would
  // be the user's explicit override and should win). Prepend rather than
  // early-return so visible prefix siblings (e.g. /voice-memo) still appear
  // below, and getBestCommandMatch can still find a non-empty suffix.
  // hiddenExact筛选`commands.find`，供共享工具后续处理使用。
  let hiddenExact = commands.find(
    // cmd 命令数据更新为 `> cmd.isHidden && getCommandName(cmd).toLowerCase() === q...`，确保共享工具后续读取最新状态。
    cmd => cmd.isHidden && getCommandName(cmd).toLowerCase() === query,
  )
  // 共享工具在这里按实际状态进入对应分支。
  if (
    hiddenExact &&
    commands.some(
      // cmd 命令数据更新为 `> !cmd.isHidden && getCommandName(cmd).toLowerCase() === ...`，确保共享工具后续读取最新状态。
      cmd => !cmd.isHidden && getCommandName(cmd).toLowerCase() === query,
    )
  ) {
    // hiddenExact更新为 `undefined`，确保共享工具后续读取最新状态。
    hiddenExact = undefined
  }

  // fuse读取`getCommandFuse`，供共享工具后续处理使用。
  const fuse = getCommandFuse(commands)
  // searchResults 集合保存`fuse.search`，供共享工具后续处理使用。
  const searchResults = fuse.search(query)

  // Sort results prioritizing exact/prefix command name matches over fuzzy description matches
  // Priority order:
  // 1. Exact name match (highest)
  // 2. Exact alias match
  // 3. Prefix name match
  // 4. Prefix alias match
  // 5. Fuzzy match (lowest)
  // Precompute per-item values once to avoid O(n log n) recomputation in comparator
  // withMeta派生`searchResults.map`，供共享工具后续处理使用。
  const withMeta = searchResults.map(r => {
    // 名称保存`commandName.toLowerCase`，供共享工具后续处理使用。
    const name = r.item.commandName.toLowerCase()
    // aliases 集合派生`map`，供共享工具后续处理使用。
    const aliases = r.item.aliasKey?.map(alias => alias.toLowerCase()) ?? []
    // usage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const usage =
      r.item.command.type === 'prompt'
        ? getSkillUsageScore(getCommandName(r.item.command))
        : 0
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { r, name, aliases, usage }
  })

  // sortedResults 集合保存`withMeta.sort`，供共享工具后续处理使用。
  const sortedResults = withMeta.sort((a, b) => {
    // aName 命名 `a.name`，让后续代码直接表达这个值的用途。
    const aName = a.name
    // bName保存`b.name`，供共享工具 command Suggestions后续判断或输出使用。
    const bName = b.name
    // aAliases 集合保存`a.aliases`，供后续判断或组装使用。
    const aAliases = a.aliases
    // bAliases 集合保存`b.aliases`，供共享工具 command Suggestions后续判断或输出使用。
    const bAliases = b.aliases

    // Check for exact name match (highest priority)
    // aExactName标记共享工具 command Suggestions是否启用对应路径。
    const aExactName = aName === query
    // bExactName标记共享工具 command Suggestions是否启用对应路径。
    const bExactName = bName === query
    // 只有 `aExactName && !bExactName` 满足时，共享工具才执行该分支。
    if (aExactName && !bExactName) return -1
    // 只有 `bExactName && !aExactName` 满足时，共享工具才执行该分支。
    if (bExactName && !aExactName) return 1

    // Check for exact alias match
    // aExactAlias 集合筛选`aAliases.some`，供共享工具后续处理使用。
    const aExactAlias = aAliases.some(alias => alias === query)
    // bExactAlias 集合筛选`bAliases.some`，供共享工具后续处理使用。
    const bExactAlias = bAliases.some(alias => alias === query)
    // 只有 `aExactAlias && !bExactAlias` 满足时，共享工具才执行该分支。
    if (aExactAlias && !bExactAlias) return -1
    // 只有 `bExactAlias && !aExactAlias` 满足时，共享工具才执行该分支。
    if (bExactAlias && !aExactAlias) return 1

    // Check for prefix name match
    // aPrefixName保存`aName.startsWith`，供共享工具后续处理使用。
    const aPrefixName = aName.startsWith(query)
    // bPrefixName保存`bName.startsWith`，供共享工具后续处理使用。
    const bPrefixName = bName.startsWith(query)
    // 只有 `aPrefixName && !bPrefixName` 满足时，共享工具才执行该分支。
    if (aPrefixName && !bPrefixName) return -1
    // 只有 `bPrefixName && !aPrefixName` 满足时，共享工具才执行该分支。
    if (bPrefixName && !aPrefixName) return 1
    // Among prefix name matches, prefer the shorter name (closer to exact)
    // `aPrefixName && bPrefixName && aName.length` 与 `bN` 不一致时刷新派生状态，避免使用过期结果。
    if (aPrefixName && bPrefixName && aName.length !== bName.length) {
      // 返回 `aName.length - bName.length`，作为共享工具这次计算的结果。
      return aName.length - bName.length
    }

    // Check for prefix alias match
    // aPrefixAlias 集合筛选`aAliases.find`，供共享工具后续处理使用。
    const aPrefixAlias = aAliases.find(alias => alias.startsWith(query))
    // bPrefixAlias 集合筛选`bAliases.find`，供共享工具后续处理使用。
    const bPrefixAlias = bAliases.find(alias => alias.startsWith(query))
    // 只有 `aPrefixAlias && !bPrefixAlias` 满足时，共享工具才执行该分支。
    if (aPrefixAlias && !bPrefixAlias) return -1
    // 只有 `bPrefixAlias && !aPrefixAlias` 满足时，共享工具才执行该分支。
    if (bPrefixAlias && !aPrefixAlias) return 1
    // Among prefix alias matches, prefer the shorter alias
    // 共享工具在这里按实际状态进入对应分支。
    if (
      aPrefixAlias &&
      bPrefixAlias &&
      aPrefixAlias.length !== bPrefixAlias.length
    ) {
      // 返回 `aPrefixAlias.length - bPrefixAlias.length`，作为共享工具这次计算的结果。
      return aPrefixAlias.length - bPrefixAlias.length
    }

    // For similar match types, use Fuse score with usage as tiebreaker
    // scoreDiff保存`(a.r.score ?? 0) - (b.r.score ?? 0)`，供后续判断或组装使用。
    const scoreDiff = (a.r.score ?? 0) - (b.r.score ?? 0)
    // 满足 `Math.abs(scoreDiff) > 0.1` 时，共享工具执行该分支。
    if (Math.abs(scoreDiff) > 0.1) {
      // 返回 `scoreDiff`，作为共享工具这次计算的结果。
      return scoreDiff
    }
    // For similar Fuse scores, prefer more frequently used skills
    // 返回 `b.usage - a.usage`，作为共享工具这次计算的结果。
    return b.usage - a.usage
  })

  // Map search results to suggestion items
  // Note: We intentionally don't deduplicate here because commands with the same name
  // from different sources (e.g., projectSettings vs userSettings) may have different
  // implementations and should both be available to the user
  // fuseSuggestions 集合派生`sortedResults.map`，供共享工具后续处理使用。
  const fuseSuggestions = sortedResults.map(result => {
    // cmd 命令数据 命名 `result.r.item.command`，让后续代码直接表达这个值的用途。
    const cmd = result.r.item.command
    // Only show alias in parentheses if the user typed an alias
    // matchedAlias 集合筛选`findMatchedAlias`，供共享工具后续处理使用。
    const matchedAlias = findMatchedAlias(query, cmd.aliases)
    // 返回 `createCommandSuggestionItem(cmd, matchedAlias)`，作为共享工具这次计算的结果。
    return createCommandSuggestionItem(cmd, matchedAlias)
  })
  // Skip the prepend if hiddenExact is already in fuseSuggestions — this
  // happens when isHidden flips false→true mid-session (OAuth expiry,
  // GrowthBook kill-switch) and the stale Fuse index still holds the
  // command. Fuse already sorts exact-name matches first, so no reorder
  // is needed; we just don't want a duplicate id (duplicate React keys,
  // both rows rendering as selected).
  // 满足 `hiddenExact` 时，共享工具执行该分支。
  if (hiddenExact) {
    // hiddenId读取`getCommandId`，供共享工具后续处理使用。
    const hiddenId = getCommandId(hiddenExact)
    // 满足 `!fuseSuggestions.some(s => s.id === hiddenId)` 时，共享工具执行该分支。
    if (!fuseSuggestions.some(s => s.id === hiddenId)) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [createCommandSuggestionItem(hiddenExact), ...fuseSuggestions]
    }
  }
  // 返回 `fuseSuggestions`，作为共享工具这次计算的结果。
  return fuseSuggestions
}

/**
 * Apply selected command to input
 */
// applyCommandSuggestion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyCommandSuggestion(
  suggestion: string | SuggestionItem,
  shouldExecute: boolean,
  commands: Command[],
  // 这个回调绑定到 onInputChange: (value: string) => void,，负责共享工具在该局部场景下的响应。
  onInputChange: (value: string) => void,
  // 这个回调绑定到 setCursorOffset: (offset: number) => void,，负责共享工具在该局部场景下的响应。
  setCursorOffset: (offset: number) => void,
  // 这个回调绑定到 onSubmit: (value: string, isSubmittingSlashCommand?: boolean) => void,，负责共享工具在该局部场景下的响应。
  onSubmit: (value: string, isSubmittingSlashCommand?: boolean) => void,
): void {
  // Extract command name and object from string or SuggestionItem metadata
  // commandName 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let commandName: string
  // commandObj 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let commandObj: Command | undefined
  // 当 `typeof suggestion` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof suggestion === 'string') {
    // commandName 命令数据更新为 `suggestion`，确保共享工具后续读取最新状态。
    commandName = suggestion
    // commandObj 命令数据更新为 `shouldExecute ? getCommand(commandName, commands) : undef...`，确保共享工具后续读取最新状态。
    commandObj = shouldExecute ? getCommand(commandName, commands) : undefined
  } else {
    // 满足 `!isCommandMetadata(suggestion.metadata)` 时，共享工具执行该分支。
    if (!isCommandMetadata(suggestion.metadata)) {
      // 返回 `// Invalid suggestion, nothing to apply`，作为共享工具这次计算的结果。
      return // Invalid suggestion, nothing to apply
    }
    // commandName 命令数据更新为 `getCommandName(suggestion.metadata)`，确保共享工具后续读取最新状态。
    commandName = getCommandName(suggestion.metadata)
    // commandObj 命令数据更新为 `suggestion.metadata`，确保共享工具后续读取最新状态。
    commandObj = suggestion.metadata
  }

  // Format the command input with trailing space
  // newInput格式化`formatCommand`，供共享工具后续处理使用。
  const newInput = formatCommand(commandName)
  // 调用 onInputChange，触发共享工具此处需要的副作用。
  onInputChange(newInput)
  // setCursorOffset 写入新的状态值，使共享工具后续读取保持一致。
  setCursorOffset(newInput.length)

  // Execute command if requested and it takes no arguments
  // 只有 `shouldExecute && commandObj` 满足时，共享工具才执行该分支。
  if (shouldExecute && commandObj) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      commandObj.type !== 'prompt' ||
      (commandObj.argNames ?? []).length === 0
    ) {
      // 调用 onSubmit，触发共享工具此处需要的副作用。
      onSubmit(newInput, /* isSubmittingSlashCommand */ true)
    }
  }
}

// Helper function at bottom of file per CLAUDE.md
// cleanWord 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cleanWord(word: string) {
  // 返回 `word.toLowerCase().replace(/[^a-z0-9]/g, '')`，作为共享工具这次计算的结果。
  return word.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Find all /command patterns in text for highlighting.
 * Returns array of {start, end} positions.
 * Requires whitespace or start-of-string before the slash to avoid
 * matching paths like /usr/bin.
 */
// findSlashCommandPositions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findSlashCommandPositions(
  text: string,
): Array<{ start: number; end: number }> {
  // positions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positions: Array<{ start: number; end: number }> = []
  // Match /command patterns preceded by whitespace or start-of-string
  // regex保存`/(^|[\s])(\/[a-zA-Z][a-zA-Z0-9:\-_]*)/g`，供共享工具 command Suggestions后续判断或输出使用。
  const regex = /(^|[\s])(\/[a-zA-Z][a-zA-Z0-9:\-_]*)/g
  // match保存`null`，作为后续空值处理的输入。
  let match: RegExpExecArray | null = null
  // 只要 (match = regex.exec(text)) !== null 成立，就持续推进共享工具中的循环处理。
  while ((match = regex.exec(text)) !== null) {
    // precedingChar保存`match[1] ?? ''`，供共享工具 command Suggestions后续判断或输出使用。
    const precedingChar = match[1] ?? ''
    // commandName 命令数据 命名 `match[2] ?? ''`，让后续代码直接表达这个值的用途。
    const commandName = match[2] ?? ''
    // Start position is after the whitespace (if any)
    // start记录 `match.index + precedingChar.length` 是否成立，下一步按该结果分支。
    const start = match.index + precedingChar.length
    // positions 集合追加新条目，保持收集顺序与输入顺序一致。
    positions.push({ start, end: start + commandName.length })
  }
  // 返回 `positions`，作为共享工具这次计算的结果。
  return positions
}

// 引入 memoize，将 lodash-es 中已经封装好的能力接到本文件流程里。
import { memoize } from 'lodash-es'
// 类型依赖 { Command } 来自 src/commands.js，用于校准工具调用的数据契约。
import type { Command } from 'src/commands.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getCommandName,
  getSkillToolCommands,
  getSlashCommandToolSkills,
} from 'src/commands.js'
// 引入 COMMAND_NAME_TAG，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { COMMAND_NAME_TAG } from '../../constants/xml.js'
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { toError } from '../../utils/errors.js'
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'

// Skill listing gets 1% of the context window (in characters)
// SKILL_BUDGET_CONTEXT_PERCENT保存`0.01`，供工具实现 prompt后续判断或输出使用。
export const SKILL_BUDGET_CONTEXT_PERCENT = 0.01
// CHARS_PER_TOKEN 命名 `4`，让后续代码直接表达这个值的用途。
export const CHARS_PER_TOKEN = 4
// DEFAULT_CHAR_BUDGET保存`8_000 // Fallback: 1% of 200k × 4`，供工具实现 prompt后续判断或输出使用。
export const DEFAULT_CHAR_BUDGET = 8_000 // Fallback: 1% of 200k × 4

// Per-entry hard cap. The listing is for discovery only — the Skill tool loads
// full content on invoke, so verbose whenToUse strings waste turn-1 cache_creation
// tokens without improving match rate. Applies to all entries, including bundled,
// since the cap is generous enough to preserve the core use case.
// MAX_LISTING_DESC_CHARS 集合保存`250`，供后续判断或组装使用。
export const MAX_LISTING_DESC_CHARS = 250

// getCharBudget 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCharBudget(contextWindowTokens?: number): number {
  // 满足 `Number(process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET)` 时，工具调用执行该分支。
  if (Number(process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET)) {
    // 返回 `Number(process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET)`，作为工具调用这次计算的结果。
    return Number(process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET)
  }
  // 满足 `contextWindowTokens` 时，工具调用执行该分支。
  if (contextWindowTokens) {
    // 返回 `Math.floor(`，作为工具调用这次计算的结果。
    return Math.floor(
      contextWindowTokens * CHARS_PER_TOKEN * SKILL_BUDGET_CONTEXT_PERCENT,
    )
  }
  // 返回 `DEFAULT_CHAR_BUDGET`，作为工具调用这次计算的结果。
  return DEFAULT_CHAR_BUDGET
}

// getCommandDescription 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCommandDescription(cmd: Command): string {
  // desc保存`cmd.whenToUse`，供后续判断或组装使用。
  const desc = cmd.whenToUse
    ? `${cmd.description} - ${cmd.whenToUse}`
    : cmd.description
  // 返回 `desc.length > MAX_LISTING_DESC_CHARS`，作为工具调用这次计算的结果。
  return desc.length > MAX_LISTING_DESC_CHARS
    ? desc.slice(0, MAX_LISTING_DESC_CHARS - 1) + '\u2026'
    : desc
}

// formatCommandDescription 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatCommandDescription(cmd: Command): string {
  // Debug: log if userFacingName differs from cmd.name for plugin skills
  // displayName读取`getCommandName`，供工具调用后续处理使用。
  const displayName = getCommandName(cmd)
  // 工具调用在这里按实际状态进入对应分支。
  if (
    cmd.name !== displayName &&
    cmd.type === 'prompt' &&
    cmd.source === 'plugin'
  ) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skill prompt: showing "${cmd.name}" (userFacingName="${displayName}")`,
    )
  }

  // 返回 ``- ${cmd.name}: ${getCommandDescription(cmd)}``，作为工具调用这次计算的结果。
  return `- ${cmd.name}: ${getCommandDescription(cmd)}`
}

// MIN_DESC_LENGTH 数量保存`20`，供后续判断或组装使用。
const MIN_DESC_LENGTH = 20

// formatCommandsWithinBudget 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatCommandsWithinBudget(
  commands: Command[],
  contextWindowTokens?: number,
): string {
  // commands 命令数据为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (commands.length === 0) return ''

  // budget读取`getCharBudget`，供工具调用后续处理使用。
  const budget = getCharBudget(contextWindowTokens)

  // Try full descriptions first
  // fullEntries 集合派生`commands.map`，供工具调用后续处理使用。
  const fullEntries = commands.map(cmd => ({
    cmd,
    full: formatCommandDescription(cmd),
  }))
  // join('\n') produces N-1 newlines for N entries
  // fullTotal 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const fullTotal =
    // 调用 fullEntries.reduce，触发工具调用此处需要的副作用。
    fullEntries.reduce((sum, e) => sum + stringWidth(e.full), 0) +
    (fullEntries.length - 1)

  // 满足 `fullTotal <= budget` 时，工具调用执行该分支。
  if (fullTotal <= budget) {
    // 返回 `fullEntries.map(e => e.full).join('\n')`，作为工具调用这次计算的结果。
    return fullEntries.map(e => e.full).join('\n')
  }

  // Partition into bundled (never truncated) and rest
  // bundledIndices 集合构建`new Set<number>()`，供后续判断或组装使用。
  const bundledIndices = new Set<number>()
  // restCommands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const restCommands: Command[] = []
  // 按索引扫描 `commands.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < commands.length; i++) {
    // cmd 命令数据保存`commands[i]!`，供工具实现 prompt后续判断或输出使用。
    const cmd = commands[i]!
    // 当 `cmd.type` 匹配 `'prompt' && cmd.source === ...` 时，工具调用执行对应分支。
    if (cmd.type === 'prompt' && cmd.source === 'bundled') {
      // 调用 bundledIndices.add，触发工具调用此处需要的副作用。
      bundledIndices.add(i)
    } else {
      // restCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
      restCommands.push(cmd)
    }
  }

  // Compute space used by bundled skills (full descriptions, always preserved)
  // bundledChars 集合派生`fullEntries.reduce`，供工具调用后续处理使用。
  const bundledChars = fullEntries.reduce(
    // 这个回调绑定到 (sum, e, i) =>，负责工具调用在该局部场景下的响应。
    (sum, e, i) =>
      bundledIndices.has(i) ? sum + stringWidth(e.full) + 1 : sum,
    0,
  )
  // remainingBudget读取`budget - bundledChars` 整理出中间结果，供工具实现 prompt后续步骤使用。
  const remainingBudget = budget - bundledChars

  // Calculate max description length for non-bundled commands
  // restCommands 命令数据为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (restCommands.length === 0) {
    // 返回 `fullEntries.map(e => e.full).join('\n')`，作为工具调用这次计算的结果。
    return fullEntries.map(e => e.full).join('\n')
  }

  // restNameOverhead 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const restNameOverhead =
    // 调用 restCommands.reduce，触发工具调用此处需要的副作用。
    restCommands.reduce((sum, cmd) => sum + stringWidth(cmd.name) + 4, 0) +
    (restCommands.length - 1)
  // availableForDescs 集合读取`remainingBudget - restNameOverhead` 整理出中间结果，供工具实现 prompt后续步骤使用。
  const availableForDescs = remainingBudget - restNameOverhead
  // maxDescLen保存`Math.floor`，供工具调用后续处理使用。
  const maxDescLen = Math.floor(availableForDescs / restCommands.length)

  // 满足 `maxDescLen < MIN_DESC_LENGTH` 时，工具调用执行该分支。
  if (maxDescLen < MIN_DESC_LENGTH) {
    // Extreme case: non-bundled go names-only, bundled keep descriptions
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，工具调用执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_skill_descriptions_truncated', {
        skill_count: commands.length,
        budget,
        full_total: fullTotal,
        truncation_mode:
          'names_only' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        max_desc_length: maxDescLen,
        bundled_count: bundledIndices.size,
        bundled_chars: bundledChars,
      })
    }
    // 返回 `commands`，作为工具调用这次计算的结果。
    return commands
      // 链式调用 map，继续加工上一行在工具调用中产生的数据。
      .map((cmd, i) =>
        bundledIndices.has(i) ? fullEntries[i]!.full : `- ${cmd.name}`,
      )
      .join('\n')
  }

  // Truncate non-bundled descriptions to fit within budget
  // truncatedCount 数量统计`count`，供工具调用后续处理使用。
  const truncatedCount = count(
    restCommands,
    // cmd 命令数据更新为 `> stringWidth(getCommandDescription(cmd)) > maxDescLen`，确保工具调用后续读取最新状态。
    cmd => stringWidth(getCommandDescription(cmd)) > maxDescLen,
  )
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，工具调用执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_skill_descriptions_truncated', {
      skill_count: commands.length,
      budget,
      full_total: fullTotal,
      truncation_mode:
        'description_trimmed' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      max_desc_length: maxDescLen,
      truncated_count: truncatedCount,
      // Count of bundled skills included in this prompt (excludes skills with disableModelInvocation)
      bundled_count: bundledIndices.size,
      bundled_chars: bundledChars,
    })
  }
  // 返回 `commands`，作为工具调用这次计算的结果。
  return commands
    // 链式调用 map，继续加工上一行在工具调用中产生的数据。
    .map((cmd, i) => {
      // Bundled skills always get full descriptions
      // 满足 `bundledIndices.has(i)` 时，工具调用执行该分支。
      if (bundledIndices.has(i)) return fullEntries[i]!.full
      // description读取`getCommandDescription`，供工具调用后续处理使用。
      const description = getCommandDescription(cmd)
      // 返回 ``- ${cmd.name}: ${truncate(description, maxDescLen)}``，作为工具调用这次计算的结果。
      return `- ${cmd.name}: ${truncate(description, maxDescLen)}`
    })
    .join('\n')
}

// getPrompt保存`memoize`，供工具调用后续处理使用。
export const getPrompt = memoize(async (_cwd: string): Promise<string> => {
  // 返回 ``Execute a skill within the main conversation`，作为工具调用这次计算的结果。
  return `Execute a skill within the main conversation

When users ask you to perform tasks, check if any of the available skills match. Skills provide specialized capabilities and domain knowledge.

When users reference a "slash command" or "/<something>" (e.g., "/commit", "/review-pr"), they are referring to a skill. Use this tool to invoke it.

How to invoke:
- Use this tool with the skill name and optional arguments
- Examples:
  - \`skill: "pdf"\` - invoke the pdf skill
  - \`skill: "commit", args: "-m 'Fix bug'"\` - invoke with arguments
  - \`skill: "review-pr", args: "123"\` - invoke with arguments
  - \`skill: "ms-office-suite:pdf"\` - invoke using fully qualified name

Important:
- Available skills are listed in system-reminder messages in the conversation
- When a skill matches the user's request, this is a BLOCKING REQUIREMENT: invoke the relevant Skill tool BEFORE generating any other response about the task
- NEVER mention a skill without actually calling this tool
- Do not invoke a skill that is already running
- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)
- If you see a <${COMMAND_NAME_TAG}> tag in the current conversation turn, the skill has ALREADY been loaded - follow the instructions directly instead of calling this tool again
`
})

// getSkillToolInfo 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSkillToolInfo(cwd: string): Promise<{
  totalCommands: number
  includedCommands: number
}> {
  // agentCommands 命令数据读取`getSkillToolCommands`，供工具调用后续处理使用。
  const agentCommands = await getSkillToolCommands(cwd)

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    totalCommands: agentCommands.length,
    includedCommands: agentCommands.length,
  }
}

// Returns the commands included in the SkillTool prompt.
// All commands are always included (descriptions may be truncated to fit budget).
// Used by analyzeContext to count skill tokens.
// getLimitedSkillToolCommands 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLimitedSkillToolCommands(cwd: string): Promise<Command[]> {
  // 返回 `getSkillToolCommands(cwd)`，作为工具调用这次计算的结果。
  return getSkillToolCommands(cwd)
}

// clearPromptCache 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPromptCache(): void {
  // 调用 getPrompt.cache?.clear?.()，完成这一处局部操作。
  getPrompt.cache?.clear?.()
}

// getSkillInfo 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSkillInfo(cwd: string): Promise<{
  totalSkills: number
  includedSkills: number
}> {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // skills 集合读取`getSlashCommandToolSkills`，供工具调用后续处理使用。
    const skills = await getSlashCommandToolSkills(cwd)

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      totalSkills: skills.length,
      includedSkills: skills.length,
    }
  } catch (error) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))

    // Return zeros rather than throwing - let caller decide how to handle
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      totalSkills: 0,
      includedSkills: 0,
    }
  }
}

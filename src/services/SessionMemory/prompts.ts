// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 接入 roughTokenCountEstimation 服务层能力，把外部通信或共享状态交给 ../../services/tokenEstimation.js 处理。
import { roughTokenCountEstimation } from '../../services/tokenEstimation.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 getErrnoCode、toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { getErrnoCode, toError } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'

// MAX_SECTION_LENGTH 数量保存`2000`，供后续判断或组装使用。
const MAX_SECTION_LENGTH = 2000
// MAX_TOTAL_SESSION_MEMORY_TOKENS 会话数据保存`12000`，供后续判断或组装使用。
const MAX_TOTAL_SESSION_MEMORY_TOKENS = 12000

// DEFAULT_SESSION_MEMORY_TEMPLATE 会话数据 命名 ```，让后续代码直接表达这个值的用途。
export const DEFAULT_SESSION_MEMORY_TEMPLATE = `
# Session Title
_A short and distinctive 5-10 word descriptive title for the session. Super info dense, no filler_

# Current State
_What is actively being worked on right now? Pending tasks not yet completed. Immediate next steps._

# Task specification
_What did the user ask to build? Any design decisions or other explanatory context_

# Files and Functions
_What are the important files? In short, what do they contain and why are they relevant?_

# Workflow
_What bash commands are usually run and in what order? How to interpret their output if not obvious?_

# Errors & Corrections
_Errors encountered and how they were fixed. What did the user correct? What approaches failed and should not be tried again?_

# Codebase and System Documentation
_What are the important system components? How do they work/fit together?_

# Learnings
_What has worked well? What has not? What to avoid? Do not duplicate items from other sections_

# Key results
_If the user asked a specific output such as an answer to a question, a table, or other document, repeat the exact result here_

# Worklog
_Step by step, what was attempted, done? Very terse summary for each step_
`

// getDefaultUpdatePrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDefaultUpdatePrompt(): string {
  // 返回 ``IMPORTANT: This message and these instructions are NOT part of the act...`，作为服务层 prompts这次计算的结果。
  return `IMPORTANT: This message and these instructions are NOT part of the actual user conversation. Do NOT include any references to "note-taking", "session notes extraction", or these update instructions in the notes content.

Based on the user conversation above (EXCLUDING this note-taking instruction message as well as system prompt, claude.md entries, or any past session summaries), update the session notes file.

The file {{notesPath}} has already been read for you. Here are its current contents:
<current_notes_content>
{{currentNotes}}
</current_notes_content>

Your ONLY task is to use the Edit tool to update the notes file, then stop. You can make multiple edits (update every section as needed) - make all Edit tool calls in parallel in a single message. Do not call any other tools.

CRITICAL RULES FOR EDITING:
- The file must maintain its exact structure with all sections, headers, and italic descriptions intact
-- NEVER modify, delete, or add section headers (the lines starting with '#' like # Task specification)
-- NEVER modify or delete the italic _section description_ lines (these are the lines in italics immediately following each header - they start and end with underscores)
-- The italic _section descriptions_ are TEMPLATE INSTRUCTIONS that must be preserved exactly as-is - they guide what content belongs in each section
-- ONLY update the actual content that appears BELOW the italic _section descriptions_ within each existing section
-- Do NOT add any new sections, summaries, or information outside the existing structure
- Do NOT reference this note-taking process or instructions anywhere in the notes
- It's OK to skip updating a section if there are no substantial new insights to add. Do not add filler content like "No info yet", just leave sections blank/unedited if appropriate.
- Write DETAILED, INFO-DENSE content for each section - include specifics like file paths, function names, error messages, exact commands, technical details, etc.
- For "Key results", include the complete, exact output the user requested (e.g., full table, full answer, etc.)
- Do not include information that's already in the CLAUDE.md files included in the context
- Keep each section under ~${MAX_SECTION_LENGTH} tokens/words - if a section is approaching this limit, condense it by cycling out less important details while preserving the most critical information
- Focus on actionable, specific information that would help someone understand or recreate the work discussed in the conversation
- IMPORTANT: Always update "Current State" to reflect the most recent work - this is critical for continuity after compaction

Use the Edit tool with file_path: {{notesPath}}

STRUCTURE PRESERVATION REMINDER:
Each section has TWO parts that must be preserved exactly as they appear in the current file:
1. The section header (line starting with #)
2. The italic description line (the _italicized text_ immediately after the header - this is a template instruction)

You ONLY update the actual content that comes AFTER these two preserved lines. The italic description lines starting and ending with underscores are part of the template structure, NOT content to be edited or removed.

REMEMBER: Use the Edit tool in parallel and stop. Do not continue after the edits. Only include insights from the actual user conversation, never from these note-taking instructions. Do not delete or change section headers or italic _section descriptions_.`
}

/**
 * Load custom session memory template from file if it exists
 */
// loadSessionMemoryTemplate 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadSessionMemoryTemplate(): Promise<string> {
  // templatePath 路径数据格式化`join`，供服务层 prompts后续处理使用。
  const templatePath = join(
    getClaudeConfigHomeDir(),
    'session-memory',
    'config',
    'template.md',
  )

  // 保护这一段可能失败的服务层 prompts操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `readFile(templatePath, { encoding: 'utf-8' })`，调用方直接接收异步结果。
    return await readFile(templatePath, { encoding: 'utf-8' })
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供服务层 prompts后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，服务层 prompts执行对应分支。
    if (code === 'ENOENT') {
      // 返回 `DEFAULT_SESSION_MEMORY_TEMPLATE`，作为服务层 prompts这次计算的结果。
      return DEFAULT_SESSION_MEMORY_TEMPLATE
    }
    // 记录服务层 prompts运行诊断，方便排查异常路径或性能问题。
    logError(toError(e))
    // 返回 `DEFAULT_SESSION_MEMORY_TEMPLATE`，作为服务层 prompts这次计算的结果。
    return DEFAULT_SESSION_MEMORY_TEMPLATE
  }
}

/**
 * Load custom session memory prompt from file if it exists
 * Custom prompts can be placed at ~/.claude/session-memory/prompt.md
 * Use {{variableName}} syntax for variable substitution (e.g., {{currentNotes}}, {{notesPath}})
 */
// loadSessionMemoryPrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadSessionMemoryPrompt(): Promise<string> {
  // promptPath 路径数据格式化`join`，供服务层 prompts后续处理使用。
  const promptPath = join(
    getClaudeConfigHomeDir(),
    'session-memory',
    'config',
    'prompt.md',
  )

  // 保护这一段可能失败的服务层 prompts操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `readFile(promptPath, { encoding: 'utf-8' })`，调用方直接接收异步结果。
    return await readFile(promptPath, { encoding: 'utf-8' })
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供服务层 prompts后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，服务层 prompts执行对应分支。
    if (code === 'ENOENT') {
      // 返回 `getDefaultUpdatePrompt()`，作为服务层 prompts这次计算的结果。
      return getDefaultUpdatePrompt()
    }
    // 记录服务层 prompts运行诊断，方便排查异常路径或性能问题。
    logError(toError(e))
    // 返回 `getDefaultUpdatePrompt()`，作为服务层 prompts这次计算的结果。
    return getDefaultUpdatePrompt()
  }
}

/**
 * Parse the session memory file and analyze section sizes
 */
// analyzeSectionSizes 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function analyzeSectionSizes(content: string): Record<string, number> {
  // sections 集合 从空对象开始收集键值，后续按名称补齐内容。
  const sections: Record<string, number> = {}
  // 文本行格式化`content.split`，供服务层 prompts后续处理使用。
  const lines = content.split('\n')
  // currentSection保存`''`，作为后续固定文本处理的输入。
  let currentSection = ''
  // currentContent 从空数组开始收集，后续循环会按处理顺序追加条目。
  let currentContent: string[] = []

  // 按顺序遍历 `lines` 中的line，逐个交给服务层 prompts处理。
  for (const line of lines) {
    // 满足 `line.startsWith('# ')` 时，服务层 prompts执行该分支。
    if (line.startsWith('# ')) {
      // 组合条件 `currentSection && currentContent.length > 0` 成立时，服务层 prompts才启用这条专门路径。
      if (currentSection && currentContent.length > 0) {
        // sectionContent格式化`currentContent.join`，供服务层 prompts后续处理使用。
        const sectionContent = currentContent.join('\n').trim()
        // sections[currentSection更新为 `roughTokenCountEstimation(sectionContent)`，确保服务层 prompts后续读取最新状态。
        sections[currentSection] = roughTokenCountEstimation(sectionContent)
      }
      // currentSection更新为 `line`，确保服务层后续读取最新状态。
      currentSection = line
      // currentContent更新为 `[]`，确保服务层后续读取最新状态。
      currentContent = []
    } else {
      // currentContent追加新条目，保持收集顺序与输入顺序一致。
      currentContent.push(line)
    }
  }

  // 组合条件 `currentSection && currentContent.length > 0` 成立时，服务层 prompts才启用这条专门路径。
  if (currentSection && currentContent.length > 0) {
    // sectionContent格式化`currentContent.join`，供服务层 prompts后续处理使用。
    const sectionContent = currentContent.join('\n').trim()
    // sections[currentSection更新为 `roughTokenCountEstimation(sectionContent)`，确保服务层 prompts后续读取最新状态。
    sections[currentSection] = roughTokenCountEstimation(sectionContent)
  }

  // 返回 `sections`，作为服务层 prompts这次计算的结果。
  return sections
}

/**
 * Generate reminders for sections that are too long
 */
// generateSectionReminders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateSectionReminders(
  sectionSizes: Record<string, number>,
  totalTokens: number,
): string {
  // overBudget 命名 `totalTokens > MAX_TOTAL_SESSION_MEMORY_TOKENS`，让后续代码直接表达这个值的用途。
  const overBudget = totalTokens > MAX_TOTAL_SESSION_MEMORY_TOKENS
  // oversizedSections 集合派生`Object.entries`，供服务层 prompts后续处理使用。
  const oversizedSections = Object.entries(sectionSizes)
    // 链式调用 filter，继续加工上一行在服务层 prompts中产生的数据。
    .filter(([_, tokens]) => tokens > MAX_SECTION_LENGTH)
    // 链式调用 sort，继续加工上一行在服务层 prompts中产生的数据。
    .sort(([, a], [, b]) => b - a)
    .map(
      // 这个回调绑定到 ([section, tokens]) =>，负责服务层 prompts在该局部场景下的响应。
      ([section, tokens]) =>
        `- "${section}" is ~${tokens} tokens (limit: ${MAX_SECTION_LENGTH})`,
    )

  // 组合条件 `oversizedSections.length === 0 && !overBudget` 成立时，服务层 prompts才启用这条专门路径。
  if (oversizedSections.length === 0 && !overBudget) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []

  // 满足 `overBudget` 时，服务层 prompts执行该分支。
  if (overBudget) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `\n\nCRITICAL: The session memory file is currently ~${totalTokens} tokens, which exceeds the maximum of ${MAX_TOTAL_SESSION_MEMORY_TOKENS} tokens. You MUST condense the file to fit within this budget. Aggressively shorten oversized sections by removing less important details, merging related items, and summarizing older entries. Prioritize keeping "Current State" and "Errors & Corrections" accurate and detailed.`,
    )
  }

  // 满足 `oversizedSections.length > 0` 时，服务层 prompts执行该分支。
  if (oversizedSections.length > 0) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `\n\n${overBudget ? 'Oversized sections to condense' : 'IMPORTANT: The following sections exceed the per-section limit and MUST be condensed'}:\n${oversizedSections.join('\n')}`,
    )
  }

  // 返回 `parts.join('')`，作为服务层 prompts这次计算的结果。
  return parts.join('')
}

/**
 * Substitute variables in the prompt template using {{variable}} syntax
 */
// substituteVariables 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function substituteVariables(
  template: string,
  variables: Record<string, string>,
): string {
  // Single-pass replacement avoids two bugs: (1) $ backreference corruption
  // (replacer fn treats $ literally), and (2) double-substitution when user
  // content happens to contain {{varName}} matching a later variable.
  // 返回 `template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>`，作为服务层 prompts这次计算的结果。
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(variables, key)
      ? variables[key]!
      : match,
  )
}

/**
 * Check if the session memory content is essentially empty (matches the template).
 * This is used to detect if no actual content has been extracted yet,
 * which means we should fall back to legacy compact behavior.
 */
// isSessionMemoryEmpty 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isSessionMemoryEmpty(content: string): Promise<boolean> {
  // template读取`loadSessionMemoryTemplate`，供服务层 prompts后续处理使用。
  const template = await loadSessionMemoryTemplate()
  // Compare trimmed content to detect if it's just the template
  // 返回 `content.trim() === template.trim()`，作为服务层 prompts这次计算的结果。
  return content.trim() === template.trim()
}

// buildSessionMemoryUpdatePrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function buildSessionMemoryUpdatePrompt(
  currentNotes: string,
  notesPath: string,
): Promise<string> {
  // promptTemplate读取`loadSessionMemoryPrompt`，供服务层 prompts后续处理使用。
  const promptTemplate = await loadSessionMemoryPrompt()

  // Analyze section sizes and generate reminders if needed
  // sectionSizes 集合保存`analyzeSectionSizes`，供服务层 prompts后续处理使用。
  const sectionSizes = analyzeSectionSizes(currentNotes)
  // totalTokens 集合保存`roughTokenCountEstimation`，供服务层 prompts后续处理使用。
  const totalTokens = roughTokenCountEstimation(currentNotes)
  // sectionReminders 集合保存`generateSectionReminders`，供服务层 prompts后续处理使用。
  const sectionReminders = generateSectionReminders(sectionSizes, totalTokens)

  // Substitute variables in the prompt
  // variables 集合 集中保存服务层 prompts要一起传递的字段。
  const variables = {
    currentNotes,
    notesPath,
  }

  // basePrompt保存`substituteVariables`，供服务层 prompts后续处理使用。
  const basePrompt = substituteVariables(promptTemplate, variables)

  // Add section size reminders and/or total budget warnings
  // 返回 `basePrompt + sectionReminders`，作为服务层 prompts这次计算的结果。
  return basePrompt + sectionReminders
}

/**
 * Truncate session memory sections that exceed the per-section token limit.
 * Used when inserting session memory into compact messages to prevent
 * oversized session memory from consuming the entire post-compact token budget.
 *
 * Returns the truncated content and whether any truncation occurred.
 */
// truncateSessionMemoryForCompact 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function truncateSessionMemoryForCompact(content: string): {
  truncatedContent: string
  wasTruncated: boolean
} {
  // 文本行格式化`content.split`，供服务层 prompts后续处理使用。
  const lines = content.split('\n')
  // maxCharsPerSection 命名 `MAX_SECTION_LENGTH * 4 // roughTokenCountEstimation uses ...`，让后续代码直接表达这个值的用途。
  const maxCharsPerSection = MAX_SECTION_LENGTH * 4 // roughTokenCountEstimation uses length/4
  // outputLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const outputLines: string[] = []
  // currentSectionLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let currentSectionLines: string[] = []
  // currentSectionHeader 命名 `''`，让后续代码直接表达这个值的用途。
  let currentSectionHeader = ''
  // wasTruncated标记服务层 prompts是否启用对应路径。
  let wasTruncated = false

  // 按顺序遍历 `lines` 中的line，逐个交给服务层 prompts处理。
  for (const line of lines) {
    // 满足 `line.startsWith('# ')` 时，服务层 prompts执行该分支。
    if (line.startsWith('# ')) {
      // 结果保存`flushSessionSection`，供服务层 prompts后续处理使用。
      const result = flushSessionSection(
        currentSectionHeader,
        currentSectionLines,
        maxCharsPerSection,
      )
      // outputLines 集合追加新条目，保持收集顺序与输入顺序一致。
      outputLines.push(...result.lines)
      // wasTruncated更新为 `wasTruncated || result.wasTruncated`，确保服务层后续读取最新状态。
      wasTruncated = wasTruncated || result.wasTruncated
      // currentSectionHeader更新为 `line`，确保服务层后续读取最新状态。
      currentSectionHeader = line
      // currentSectionLines 集合更新为 `[]`，确保服务层后续读取最新状态。
      currentSectionLines = []
    } else {
      // currentSectionLines 集合追加新条目，保持收集顺序与输入顺序一致。
      currentSectionLines.push(line)
    }
  }

  // Flush the last section
  // 结果保存`flushSessionSection`，供服务层 prompts后续处理使用。
  const result = flushSessionSection(
    currentSectionHeader,
    currentSectionLines,
    maxCharsPerSection,
  )
  // outputLines 集合追加新条目，保持收集顺序与输入顺序一致。
  outputLines.push(...result.lines)
  // wasTruncated更新为 `wasTruncated || result.wasTruncated`，确保服务层后续读取最新状态。
  wasTruncated = wasTruncated || result.wasTruncated

  // 返回结构化结果，集中表达服务层 prompts已经整理出的状态。
  return {
    truncatedContent: outputLines.join('\n'),
    wasTruncated,
  }
}

// flushSessionSection 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function flushSessionSection(
  sectionHeader: string,
  sectionLines: string[],
  maxCharsPerSection: number,
): { lines: string[]; wasTruncated: boolean } {
  // sectionHeader缺失时提前走兜底路径，避免服务层 prompts继续依赖无效输入。
  if (!sectionHeader) {
    // 返回结构化结果，集中表达服务层 prompts已经整理出的状态。
    return { lines: sectionLines, wasTruncated: false }
  }

  // sectionContent格式化`sectionLines.join`，供服务层 prompts后续处理使用。
  const sectionContent = sectionLines.join('\n')
  // 满足 `sectionContent.length <= maxCharsPerSection` 时，服务层 prompts执行该分支。
  if (sectionContent.length <= maxCharsPerSection) {
    // 返回结构化结果，集中表达服务层 prompts已经整理出的状态。
    return { lines: [sectionHeader, ...sectionLines], wasTruncated: false }
  }

  // Truncate at a line boundary near the limit
  // charCount 数量保存`0`，供后续判断或组装使用。
  let charCount = 0
  // keptLines 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const keptLines: string[] = [sectionHeader]
  // 按顺序遍历 `sectionLines` 中的line，逐个交给服务层 prompts处理。
  for (const line of sectionLines) {
    // 满足 `charCount + line.length + 1 > maxCharsPerSection` 时，服务层 prompts执行该分支。
    if (charCount + line.length + 1 > maxCharsPerSection) {
      // 结束这个分支或循环，避免服务层 prompts继续落入后续路径。
      break
    }
    // keptLines 集合追加新条目，保持收集顺序与输入顺序一致。
    keptLines.push(line)
    // 服务层 prompts在这里处理 `charCount += line.length + 1`，完成这一小步状态转换。
    charCount += line.length + 1
  }
  // keptLines 集合追加新条目，保持收集顺序与输入顺序一致。
  keptLines.push('\n[... section truncated for length ...]')
  // 返回结构化结果，集中表达服务层 prompts已经整理出的状态。
  return { lines: keptLines, wasTruncated: true }
}

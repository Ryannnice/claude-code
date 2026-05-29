// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'

/**
 * Get the Magic Docs update prompt template
 */
// getUpdatePromptTemplate 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUpdatePromptTemplate(): string {
  // 返回 ``IMPORTANT: This message and these instructions are NOT part of the act...`，作为服务层 prompts这次计算的结果。
  return `IMPORTANT: This message and these instructions are NOT part of the actual user conversation. Do NOT include any references to "documentation updates", "magic docs", or these update instructions in the document content.

Based on the user conversation above (EXCLUDING this documentation update instruction message), update the Magic Doc file to incorporate any NEW learnings, insights, or information that would be valuable to preserve.

The file {{docPath}} has already been read for you. Here are its current contents:
<current_doc_content>
{{docContents}}
</current_doc_content>

Document title: {{docTitle}}
{{customInstructions}}

Your ONLY task is to use the Edit tool to update the documentation file if there is substantial new information to add, then stop. You can make multiple edits (update multiple sections as needed) - make all Edit tool calls in parallel in a single message. If there's nothing substantial to add, simply respond with a brief explanation and do not call any tools.

CRITICAL RULES FOR EDITING:
- Preserve the Magic Doc header exactly as-is: # MAGIC DOC: {{docTitle}}
- If there's an italicized line immediately after the header, preserve it exactly as-is
- Keep the document CURRENT with the latest state of the codebase - this is NOT a changelog or history
- Update information IN-PLACE to reflect the current state - do NOT append historical notes or track changes over time
- Remove or replace outdated information rather than adding "Previously..." or "Updated to..." notes
- Clean up or DELETE sections that are no longer relevant or don't align with the document's purpose
- Fix obvious errors: typos, grammar mistakes, broken formatting, incorrect information, or confusing statements
- Keep the document well organized: use clear headings, logical section order, consistent formatting, and proper nesting

DOCUMENTATION PHILOSOPHY - READ CAREFULLY:
- BE TERSE. High signal only. No filler words or unnecessary elaboration.
- Documentation is for OVERVIEWS, ARCHITECTURE, and ENTRY POINTS - not detailed code walkthroughs
- Do NOT duplicate information that's already obvious from reading the source code
- Do NOT document every function, parameter, or line number reference
- Focus on: WHY things exist, HOW components connect, WHERE to start reading, WHAT patterns are used
- Skip: detailed implementation steps, exhaustive API docs, play-by-play narratives

What TO document:
- High-level architecture and system design
- Non-obvious patterns, conventions, or gotchas
- Key entry points and where to start reading code
- Important design decisions and their rationale
- Critical dependencies or integration points
- References to related files, docs, or code (like a wiki) - help readers navigate to relevant context

What NOT to document:
- Anything obvious from reading the code itself
- Exhaustive lists of files, functions, or parameters
- Step-by-step implementation details
- Low-level code mechanics
- Information already in CLAUDE.md or other project docs

Use the Edit tool with file_path: {{docPath}}

REMEMBER: Only update if there is substantial new information. The Magic Doc header (# MAGIC DOC: {{docTitle}}) must remain unchanged.`
}

/**
 * Load custom Magic Docs prompt from file if it exists
 * Custom prompts can be placed at ~/.claude/magic-docs/prompt.md
 * Use {{variableName}} syntax for variable substitution (e.g., {{docContents}}, {{docPath}}, {{docTitle}})
 */
// loadMagicDocsPrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadMagicDocsPrompt(): Promise<string> {
  // fs 集合读取`getFsImplementation`，供服务层 prompts后续处理使用。
  const fs = getFsImplementation()
  // promptPath 路径数据格式化`join`，供服务层 prompts后续处理使用。
  const promptPath = join(getClaudeConfigHomeDir(), 'magic-docs', 'prompt.md')

  // 保护这一段可能失败的服务层 prompts操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `fs.readFile(promptPath, { encoding: 'utf-8' })`，调用方直接接收异步结果。
    return await fs.readFile(promptPath, { encoding: 'utf-8' })
  } catch {
    // Silently fall back to default if custom prompt doesn't exist or fails to load
    // 返回 `getUpdatePromptTemplate()`，作为服务层 prompts这次计算的结果。
    return getUpdatePromptTemplate()
  }
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
 * Build the Magic Docs update prompt with variable substitution
 */
// buildMagicDocsUpdatePrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function buildMagicDocsUpdatePrompt(
  docContents: string,
  docPath: string,
  docTitle: string,
  instructions?: string,
): Promise<string> {
  // promptTemplate读取`loadMagicDocsPrompt`，供服务层 prompts后续处理使用。
  const promptTemplate = await loadMagicDocsPrompt()

  // Build custom instructions section if provided
  // customInstructions 集合保存`instructions`，供服务层 prompts后续判断或输出使用。
  const customInstructions = instructions
    ? `

DOCUMENT-SPECIFIC UPDATE INSTRUCTIONS:
The document author has provided specific instructions for how this file should be updated. Pay extra attention to these instructions and follow them carefully:

"${instructions}"

These instructions take priority over the general rules below. Make sure your updates align with these specific guidelines.`
    : ''

  // Substitute variables in the prompt
  // variables 集合 集中保存服务层 prompts要一起传递的字段。
  const variables = {
    docContents,
    docPath,
    docTitle,
    customInstructions,
  }

  // 返回 `substituteVariables(promptTemplate, variables)`，作为服务层 prompts这次计算的结果。
  return substituteVariables(promptTemplate, variables)
}

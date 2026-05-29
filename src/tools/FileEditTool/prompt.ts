// 复用 isCompactLinePrefixEnabled 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { isCompactLinePrefixEnabled } from '../../utils/file.js'
// 引入 FILE_READ_TOOL_NAME，将 ../FileReadTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_READ_TOOL_NAME } from '../FileReadTool/prompt.js'

// getPreReadInstruction 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPreReadInstruction(): string {
  // 返回 ``\n- You must use your \`${FILE_READ_TOOL_NAME}\` tool at least once in...`，作为工具调用这次计算的结果。
  return `\n- You must use your \`${FILE_READ_TOOL_NAME}\` tool at least once in the conversation before editing. This tool will error if you attempt an edit without reading the file. `
}

// getEditToolDescription 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEditToolDescription(): string {
  // 返回 `getDefaultEditDescription()`，作为工具调用这次计算的结果。
  return getDefaultEditDescription()
}

// getDefaultEditDescription 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDefaultEditDescription(): string {
  // prefixFormat保存`isCompactLinePrefixEnabled`，供工具调用后续处理使用。
  const prefixFormat = isCompactLinePrefixEnabled()
    ? 'line number + tab'
    : 'spaces + line number + arrow'
  // minimalUniquenessHint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const minimalUniquenessHint =
    process.env.USER_TYPE === 'ant'
      ? `\n- Use the smallest old_string that's clearly unique — usually 2-4 adjacent lines is sufficient. Avoid including 10+ lines of context when less uniquely identifies the target.`
      : ''
  // 返回 ``Performs exact string replacements in files.`，作为工具调用这次计算的结果。
  return `Performs exact string replacements in files.

Usage:${getPreReadInstruction()}
- When editing text from Read tool output, ensure you preserve the exact indentation (tabs/spaces) as it appears AFTER the line number prefix. The line number prefix format is: ${prefixFormat}. Everything after that is the actual file content to match. Never include any part of the line number prefix in the old_string or new_string.
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.
- The edit will FAIL if \`old_string\` is not unique in the file. Either provide a larger string with more surrounding context to make it unique or use \`replace_all\` to change every instance of \`old_string\`.${minimalUniquenessHint}
- Use \`replace_all\` for replacing and renaming strings across the file. This parameter is useful if you want to rename a variable for instance.`
}

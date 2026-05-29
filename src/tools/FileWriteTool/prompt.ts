// 引入 FILE_READ_TOOL_NAME，将 ../FileReadTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_READ_TOOL_NAME } from '../FileReadTool/prompt.js'

// FILE_WRITE_TOOL_NAME 文件数据保存`'Write'`，作为后续固定文本处理的输入。
export const FILE_WRITE_TOOL_NAME = 'Write'
// DESCRIPTION保存`'Write a file to the local filesystem.'`，作为后续固定文本处理的输入。
export const DESCRIPTION = 'Write a file to the local filesystem.'

// getPreReadInstruction 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPreReadInstruction(): string {
  // 返回 ``\n- If this is an existing file, you MUST use the ${FILE_READ_TOOL_NAM...`，作为工具调用这次计算的结果。
  return `\n- If this is an existing file, you MUST use the ${FILE_READ_TOOL_NAME} tool first to read the file's contents. This tool will fail if you did not read the file first.`
}

// getWriteToolDescription 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getWriteToolDescription(): string {
  // 返回 ``Writes a file to the local filesystem.`，作为工具调用这次计算的结果。
  return `Writes a file to the local filesystem.

Usage:
- This tool will overwrite the existing file if there is one at the provided path.${getPreReadInstruction()}
- Prefer the Edit tool for modifying existing files \u2014 it only sends the diff. Only use this tool to create new files or for complete rewrites.
- NEVER create documentation files (*.md) or README files unless explicitly requested by the User.
- Only use emojis if the user explicitly requests it. Avoid writing emojis to files unless asked.`
}

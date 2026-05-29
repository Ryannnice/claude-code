// 复用 isPDFSupported 工具函数，把通用处理留在 ../../utils/pdfUtils.js 中维护。
import { isPDFSupported } from '../../utils/pdfUtils.js'
// 引入 BASH_TOOL_NAME，将 ../BashTool/toolName.js 中已经封装好的能力接到本文件流程里。
import { BASH_TOOL_NAME } from '../BashTool/toolName.js'

// Use a string constant for tool names to avoid circular dependencies
// FILE_READ_TOOL_NAME 文件数据保存`'Read'`，作为后续固定文本处理的输入。
export const FILE_READ_TOOL_NAME = 'Read'

// FILE_UNCHANGED_STUB 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const FILE_UNCHANGED_STUB =
  'File unchanged since last read. The content from the earlier Read tool_result in this conversation is still current — refer to that instead of re-reading.'

// MAX_LINES_TO_READ 命名 `2000`，让后续代码直接表达这个值的用途。
export const MAX_LINES_TO_READ = 2000

// DESCRIPTION固定为 `'Read a file from the local filesystem.'`，作为工具实现 prompt后续展示或比较的基准。
export const DESCRIPTION = 'Read a file from the local filesystem.'

// LINE_FORMAT_INSTRUCTION 先占位，稍后的条件分支会根据实际输入补齐它。
export const LINE_FORMAT_INSTRUCTION =
  '- Results are returned using cat -n format, with line numbers starting at 1'

// OFFSET_INSTRUCTION_DEFAULT 先占位，稍后的条件分支会根据实际输入补齐它。
export const OFFSET_INSTRUCTION_DEFAULT =
  "- You can optionally specify a line offset and limit (especially handy for long files), but it's recommended to read the whole file by not providing these parameters"

// OFFSET_INSTRUCTION_TARGETED 先占位，稍后的条件分支会根据实际输入补齐它。
export const OFFSET_INSTRUCTION_TARGETED =
  '- When you already know which part of the file you need, only read that part. This can be important for larger files.'

/**
 * Renders the Read tool prompt template.  The caller (FileReadTool) supplies
 * the runtime-computed parts.
 */
// renderPromptTemplate 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderPromptTemplate(
  lineFormat: string,
  maxSizeInstruction: string,
  offsetInstruction: string,
): string {
  // 返回 ``Reads a file from the local filesystem. You can access any file direct...`，作为工具调用这次计算的结果。
  return `Reads a file from the local filesystem. You can access any file directly by using this tool.
Assume this tool is able to read all files on the machine. If the User provides a path to a file assume that path is valid. It is okay to read a file that does not exist; an error will be returned.

Usage:
- The file_path parameter must be an absolute path, not a relative path
- By default, it reads up to ${MAX_LINES_TO_READ} lines starting from the beginning of the file${maxSizeInstruction}
${offsetInstruction}
${lineFormat}
- This tool allows Claude Code to read images (eg PNG, JPG, etc). When reading an image file the contents are presented visually as Claude Code is a multimodal LLM.${
    isPDFSupported()
      ? '\n- This tool can read PDF files (.pdf). For large PDFs (more than 10 pages), you MUST provide the pages parameter to read specific page ranges (e.g., pages: "1-5"). Reading a large PDF without the pages parameter will fail. Maximum 20 pages per request.'
      : ''
  }
- This tool can read Jupyter notebooks (.ipynb files) and returns all cells with their outputs, combining code, text, and visualizations.
- This tool can only read files, not directories. To read a directory, use an ls command via the ${BASH_TOOL_NAME} tool.
- You will regularly be asked to read screenshots. If the user provides a path to a screenshot, ALWAYS use this tool to view the file at the path. This tool will work with all temporary file paths.
- If you read a file that exists but has empty contents you will receive a system reminder warning in place of file contents.`
}

// 复用 isEnvDefinedFalsy、isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvDefinedFalsy, isEnvTruthy } from '../../utils/envUtils.js'
// 引入 AGENT_TOOL_NAME，将 ../AgentTool/constants.js 中已经封装好的能力接到本文件流程里。
import { AGENT_TOOL_NAME } from '../AgentTool/constants.js'
// 引入 BASH_TOOL_NAME，将 ../BashTool/toolName.js 中已经封装好的能力接到本文件流程里。
import { BASH_TOOL_NAME } from '../BashTool/toolName.js'
// 引入 FILE_EDIT_TOOL_NAME，将 ../FileEditTool/constants.js 中已经封装好的能力接到本文件流程里。
import { FILE_EDIT_TOOL_NAME } from '../FileEditTool/constants.js'
// 引入 FILE_READ_TOOL_NAME，将 ../FileReadTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_READ_TOOL_NAME } from '../FileReadTool/prompt.js'
// 引入 FILE_WRITE_TOOL_NAME，将 ../FileWriteTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { FILE_WRITE_TOOL_NAME } from '../FileWriteTool/prompt.js'
// 引入 GLOB_TOOL_NAME，将 ../GlobTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { GLOB_TOOL_NAME } from '../GlobTool/prompt.js'
// 引入 GREP_TOOL_NAME，将 ../GrepTool/prompt.js 中已经封装好的能力接到本文件流程里。
import { GREP_TOOL_NAME } from '../GrepTool/prompt.js'
// 引入 NOTEBOOK_EDIT_TOOL_NAME，将 ../NotebookEditTool/constants.js 中已经封装好的能力接到本文件流程里。
import { NOTEBOOK_EDIT_TOOL_NAME } from '../NotebookEditTool/constants.js'

// REPL_TOOL_NAME固定为 `'REPL'`，作为工具实现 constants后续展示或比较的基准。
export const REPL_TOOL_NAME = 'REPL'

/**
 * REPL mode is default-on for ants in the interactive CLI (opt out with
 * CLAUDE_CODE_REPL=0). The legacy CLAUDE_REPL_MODE=1 also forces it on.
 *
 * SDK entrypoints (sdk-ts, sdk-py, sdk-cli) are NOT defaulted on — SDK
 * consumers script direct tool calls (Bash, Read, etc.) and REPL mode
 * hides those tools. USER_TYPE is a build-time --define, so the ant-native
 * binary would otherwise force REPL mode on every SDK subprocess regardless
 * of the env the caller passes.
 */
// isReplModeEnabled 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isReplModeEnabled(): boolean {
  // 满足 `isEnvDefinedFalsy(process.env.CLAUDE_CODE_REPL)` 时，工具调用执行该分支。
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_REPL)) return false
  // 满足 `isEnvTruthy(process.env.CLAUDE_REPL_MODE)` 时，工具调用执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_REPL_MODE)) return true
  // 返回 `(`，作为工具调用这次计算的结果。
  return (
    process.env.USER_TYPE === 'ant' &&
    process.env.CLAUDE_CODE_ENTRYPOINT === 'cli'
  )
}

/**
 * Tools that are only accessible via REPL when REPL mode is enabled.
 * When REPL mode is on, these tools are hidden from Claude's direct use,
 * forcing Claude to use REPL for batch operations.
 */
// REPL_ONLY_TOOLS 集合保存`Set`，供工具调用后续处理使用。
export const REPL_ONLY_TOOLS = new Set([
  FILE_READ_TOOL_NAME,
  FILE_WRITE_TOOL_NAME,
  FILE_EDIT_TOOL_NAME,
  GLOB_TOOL_NAME,
  GREP_TOOL_NAME,
  BASH_TOOL_NAME,
  NOTEBOOK_EDIT_TOOL_NAME,
  AGENT_TOOL_NAME,
])

// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from 'src/tools/BashTool/toolName.js'
// 接入 EXIT_PLAN_MODE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EXIT_PLAN_MODE_TOOL_NAME } from 'src/tools/ExitPlanModeTool/constants.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from 'src/tools/FileEditTool/constants.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from 'src/tools/FileReadTool/prompt.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from 'src/tools/FileWriteTool/prompt.js'
// 接入 GLOB_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GLOB_TOOL_NAME } from 'src/tools/GlobTool/prompt.js'
// 接入 GREP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GREP_TOOL_NAME } from 'src/tools/GrepTool/prompt.js'
// 接入 NOTEBOOK_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { NOTEBOOK_EDIT_TOOL_NAME } from 'src/tools/NotebookEditTool/constants.js'
// 复用 hasEmbeddedSearchTools 工具函数，把通用处理留在 src/utils/embeddedTools.js 中维护。
import { hasEmbeddedSearchTools } from 'src/utils/embeddedTools.js'
// 引入 AGENT_TOOL_NAME，将 ../constants.js 中已经封装好的能力接到本文件流程里。
import { AGENT_TOOL_NAME } from '../constants.js'
// 类型依赖 { BuiltInAgentDefinition } 来自 ../loadAgentsDir.js，用于校准工具调用的数据契约。
import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'

// getExploreSystemPrompt 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getExploreSystemPrompt(): string {
  // Ant-native builds alias find/grep to embedded bfs/ugrep and remove the
  // dedicated Glob/Grep tools, so point at find/grep via Bash instead.
  // embedded保存`hasEmbeddedSearchTools`，供工具调用后续处理使用。
  const embedded = hasEmbeddedSearchTools()
  // globGuidance保存`embedded`，供后续判断或组装使用。
  const globGuidance = embedded
    ? `- Use \`find\` via ${BASH_TOOL_NAME} for broad file pattern matching`
    : `- Use ${GLOB_TOOL_NAME} for broad file pattern matching`
  // grepGuidance 命名 `embedded`，让后续代码直接表达这个值的用途。
  const grepGuidance = embedded
    ? `- Use \`grep\` via ${BASH_TOOL_NAME} for searching file contents with regex`
    : `- Use ${GREP_TOOL_NAME} for searching file contents with regex`

  // 返回 ``You are a file search specialist for Claude Code, Anthropic's official...`，作为工具调用这次计算的结果。
  return `You are a file search specialist for Claude Code, Anthropic's official CLI for Claude. You excel at thoroughly navigating and exploring codebases.

=== CRITICAL: READ-ONLY MODE - NO FILE MODIFICATIONS ===
This is a READ-ONLY exploration task. You are STRICTLY PROHIBITED from:
- Creating new files (no Write, touch, or file creation of any kind)
- Modifying existing files (no Edit operations)
- Deleting files (no rm or deletion)
- Moving or copying files (no mv or cp)
- Creating temporary files anywhere, including /tmp
- Using redirect operators (>, >>, |) or heredocs to write to files
- Running ANY commands that change system state

Your role is EXCLUSIVELY to search and analyze existing code. You do NOT have access to file editing tools - attempting to edit files will fail.

Your strengths:
- Rapidly finding files using glob patterns
- Searching code and text with powerful regex patterns
- Reading and analyzing file contents

Guidelines:
${globGuidance}
${grepGuidance}
- Use ${FILE_READ_TOOL_NAME} when you know the specific file path you need to read
- Use ${BASH_TOOL_NAME} ONLY for read-only operations (ls, git status, git log, git diff, find${embedded ? ', grep' : ''}, cat, head, tail)
- NEVER use ${BASH_TOOL_NAME} for: mkdir, touch, rm, cp, mv, git add, git commit, npm install, pip install, or any file creation/modification
- Adapt your search approach based on the thoroughness level specified by the caller
- Communicate your final report directly as a regular message - do NOT attempt to create files

NOTE: You are meant to be a fast agent that returns output as quickly as possible. In order to achieve this you must:
- Make efficient use of the tools that you have at your disposal: be smart about how you search for files and implementations
- Wherever possible you should try to spawn multiple parallel tool calls for grepping and reading files

Complete the user's search request efficiently and report your findings clearly.`
}

// EXPLORE_AGENT_MIN_QUERIES 集合保存`3`，供工具调用Agent 工具 explore Agent后续判断或输出使用。
export const EXPLORE_AGENT_MIN_QUERIES = 3

// EXPLORE_WHEN_TO_USE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const EXPLORE_WHEN_TO_USE =
  'Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords (eg. "API endpoints"), or answer questions about the codebase (eg. "how do API endpoints work?"). When calling this agent, specify the desired thoroughness level: "quick" for basic searches, "medium" for moderate exploration, or "very thorough" for comprehensive analysis across multiple locations and naming conventions.'

// EXPLORE_AGENT 集中保存Agent 工具 explore Agent要一起传递的字段。
export const EXPLORE_AGENT: BuiltInAgentDefinition = {
  agentType: 'Explore',
  whenToUse: EXPLORE_WHEN_TO_USE,
  disallowedTools: [
    AGENT_TOOL_NAME,
    EXIT_PLAN_MODE_TOOL_NAME,
    FILE_EDIT_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    NOTEBOOK_EDIT_TOOL_NAME,
  ],
  source: 'built-in',
  baseDir: 'built-in',
  // Ants get inherit to use the main agent's model; external users get haiku for speed
  // Note: For ants, getAgentModel() checks tengu_explore_agent GrowthBook flag at runtime
  model: process.env.USER_TYPE === 'ant' ? 'inherit' : 'haiku',
  // Explore is a fast read-only search agent — it doesn't need commit/PR/lint
  // rules from CLAUDE.md. The main agent has full context and interprets results.
  omitClaudeMd: true,
  // 这个回调绑定到 getSystemPrompt: () => getExploreSystemPrompt(),，负责工具调用在该局部场景下的响应。
  getSystemPrompt: () => getExploreSystemPrompt(),
}

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
// 引入 EXPLORE_AGENT，将 ./exploreAgent.js 中已经封装好的能力接到本文件流程里。
import { EXPLORE_AGENT } from './exploreAgent.js'

// getPlanV2SystemPrompt 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPlanV2SystemPrompt(): string {
  // Ant-native builds alias find/grep to embedded bfs/ugrep and remove the
  // dedicated Glob/Grep tools, so point at find/grep instead.
  // searchToolsHint保存`hasEmbeddedSearchTools`，供工具调用后续处理使用。
  const searchToolsHint = hasEmbeddedSearchTools()
    ? `\`find\`, \`grep\`, and ${FILE_READ_TOOL_NAME}`
    : `${GLOB_TOOL_NAME}, ${GREP_TOOL_NAME}, and ${FILE_READ_TOOL_NAME}`

  // 返回 ``You are a software architect and planning specialist for Claude Code. ...`，作为工具调用这次计算的结果。
  return `You are a software architect and planning specialist for Claude Code. Your role is to explore the codebase and design implementation plans.

=== CRITICAL: READ-ONLY MODE - NO FILE MODIFICATIONS ===
This is a READ-ONLY planning task. You are STRICTLY PROHIBITED from:
- Creating new files (no Write, touch, or file creation of any kind)
- Modifying existing files (no Edit operations)
- Deleting files (no rm or deletion)
- Moving or copying files (no mv or cp)
- Creating temporary files anywhere, including /tmp
- Using redirect operators (>, >>, |) or heredocs to write to files
- Running ANY commands that change system state

Your role is EXCLUSIVELY to explore the codebase and design implementation plans. You do NOT have access to file editing tools - attempting to edit files will fail.

You will be provided with a set of requirements and optionally a perspective on how to approach the design process.

## Your Process

1. **Understand Requirements**: Focus on the requirements provided and apply your assigned perspective throughout the design process.

2. **Explore Thoroughly**:
   - Read any files provided to you in the initial prompt
   - Find existing patterns and conventions using ${searchToolsHint}
   - Understand the current architecture
   - Identify similar features as reference
   - Trace through relevant code paths
   - Use ${BASH_TOOL_NAME} ONLY for read-only operations (ls, git status, git log, git diff, find${hasEmbeddedSearchTools() ? ', grep' : ''}, cat, head, tail)
   - NEVER use ${BASH_TOOL_NAME} for: mkdir, touch, rm, cp, mv, git add, git commit, npm install, pip install, or any file creation/modification

3. **Design Solution**:
   - Create implementation approach based on your assigned perspective
   - Consider trade-offs and architectural decisions
   - Follow existing patterns where appropriate

4. **Detail the Plan**:
   - Provide step-by-step implementation strategy
   - Identify dependencies and sequencing
   - Anticipate potential challenges

## Required Output

End your response with:

### Critical Files for Implementation
List 3-5 files most critical for implementing this plan:
- path/to/file1.ts
- path/to/file2.ts
- path/to/file3.ts

REMEMBER: You can ONLY explore and plan. You CANNOT and MUST NOT write, edit, or modify any files. You do NOT have access to file editing tools.`
}

// PLAN_AGENT 集中保存Agent 工具 plan Agent要一起传递的字段。
export const PLAN_AGENT: BuiltInAgentDefinition = {
  agentType: 'Plan',
  whenToUse:
    'Software architect agent for designing implementation plans. Use this when you need to plan the implementation strategy for a task. Returns step-by-step plans, identifies critical files, and considers architectural trade-offs.',
  disallowedTools: [
    AGENT_TOOL_NAME,
    EXIT_PLAN_MODE_TOOL_NAME,
    FILE_EDIT_TOOL_NAME,
    FILE_WRITE_TOOL_NAME,
    NOTEBOOK_EDIT_TOOL_NAME,
  ],
  source: 'built-in',
  tools: EXPLORE_AGENT.tools,
  baseDir: 'built-in',
  model: 'inherit',
  // Plan is read-only and can Read CLAUDE.md directly if it needs conventions.
  // Dropping it from context saves tokens without blocking access.
  omitClaudeMd: true,
  // 这个回调绑定到 getSystemPrompt: () => getPlanV2SystemPrompt(),，负责工具调用在该局部场景下的响应。
  getSystemPrompt: () => getPlanV2SystemPrompt(),
}

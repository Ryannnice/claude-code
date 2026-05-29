// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 isReplBridgeActive，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { isReplBridgeActive } from '../../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js'
// 引入 AGENT_TOOL_NAME，将 ../AgentTool/constants.js 中已经封装好的能力接到本文件流程里。
import { AGENT_TOOL_NAME } from '../AgentTool/constants.js'

// Dead code elimination: Brief tool name only needed when KAIROS or KAIROS_BRIEF is on
/* eslint-disable @typescript-eslint/no-require-imports */
// BRIEF_TOOL_NAME 先占位，稍后的条件分支会根据实际输入补齐它。
const BRIEF_TOOL_NAME: string | null =
  feature('KAIROS') || feature('KAIROS_BRIEF')
    ? (
        require('../BriefTool/prompt.js') as typeof import('../BriefTool/prompt.js')
      ).BRIEF_TOOL_NAME
    : null
// SEND_USER_FILE_TOOL_NAME 文件数据 通过懒加载取得，避免工具实现 prompt在启动阶段加载暂时用不到的实现。
const SEND_USER_FILE_TOOL_NAME: string | null = feature('KAIROS')
  ? (
      require('../SendUserFileTool/prompt.js') as typeof import('../SendUserFileTool/prompt.js')
    ).SEND_USER_FILE_TOOL_NAME
  : null

/* eslint-enable @typescript-eslint/no-require-imports */

// 重新导出这一组成员，让工具调用的公共 API 保持集中入口。
export { TOOL_SEARCH_TOOL_NAME } from './constants.js'

// 引入 TOOL_SEARCH_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { TOOL_SEARCH_TOOL_NAME } from './constants.js'

// PROMPT_HEAD固定为 ``Fetches full schema definitions for deferred tools so th...`，作为工具实现 prompt后续展示或比较的基准。
const PROMPT_HEAD = `Fetches full schema definitions for deferred tools so they can be called.

`

// Matches isDeferredToolsDeltaEnabled in toolSearch.ts (not imported —
// toolSearch.ts imports from this file). When enabled: tools announced
// via system-reminder attachments. When disabled: prepended
// <available-deferred-tools> block (pre-gate behavior).
// getToolLocationHint 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getToolLocationHint(): string {
  // deltaEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const deltaEnabled =
    process.env.USER_TYPE === 'ant' ||
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_glacier_2xr', false)
  // 返回 `deltaEnabled`，作为工具调用这次计算的结果。
  return deltaEnabled
    ? 'Deferred tools appear by name in <system-reminder> messages.'
    : 'Deferred tools appear by name in <available-deferred-tools> messages.'
}

// PROMPT_TAIL固定为 `` Until fetched, only the name is known — there is no par...`，作为工具实现 prompt后续展示或比较的基准。
const PROMPT_TAIL = ` Until fetched, only the name is known — there is no parameter schema, so the tool cannot be invoked. This tool takes a query, matches it against the deferred tool list, and returns the matched tools' complete JSONSchema definitions inside a <functions> block. Once a tool's schema appears in that result, it is callable exactly like any tool defined at the top of the prompt.

Result format: each matched tool appears as one <function>{"description": "...", "name": "...", "parameters": {...}}</function> line inside the <functions> block — the same encoding as the tool list at the top of this prompt.

Query forms:
- "select:Read,Edit,Grep" — fetch these exact tools by name
- "notebook jupyter" — keyword search, up to max_results best matches
- "+slack send" — require "slack" in the name, rank by remaining terms`

/**
 * Check if a tool should be deferred (requires ToolSearch to load).
 * A tool is deferred if:
 * - It's an MCP tool (always deferred - workflow-specific)
 * - It has shouldDefer: true
 *
 * A tool is NEVER deferred if it has alwaysLoad: true (MCP tools set this via
 * _meta['anthropic/alwaysLoad']). This check runs first, before any other rule.
 */
// isDeferredTool 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDeferredTool(tool: Tool): boolean {
  // Explicit opt-out via _meta['anthropic/alwaysLoad'] — tool appears in the
  // initial prompt with full schema. Checked first so MCP tools can opt out.
  // 满足 `tool.alwaysLoad === true` 时，工具调用执行该分支。
  if (tool.alwaysLoad === true) return false

  // MCP tools are always deferred (workflow-specific)
  // 满足 `tool.isMcp === true` 时，工具调用执行该分支。
  if (tool.isMcp === true) return true

  // Never defer ToolSearch itself — the model needs it to load everything else
  // 满足 `tool.name === TOOL_SEARCH_TOOL_NAME` 时，工具调用执行该分支。
  if (tool.name === TOOL_SEARCH_TOOL_NAME) return false

  // Fork-first experiment: Agent must be available turn 1, not behind ToolSearch.
  // Lazy require: static import of forkSubagent → coordinatorMode creates a cycle
  // through constants/tools.ts at module init.
  // 只有 `feature('FORK_SUBAGENT') && tool.name === AGENT_TOOL_NAME` 满足时，工具调用才执行该分支。
  if (feature('FORK_SUBAGENT') && tool.name === AGENT_TOOL_NAME) {
    // ForkMod 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
    type ForkMod = typeof import('../AgentTool/forkSubagent.js')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // m保存`require`，供工具调用后续处理使用。
    const m = require('../AgentTool/forkSubagent.js') as ForkMod
    // 满足 `m.isForkSubagentEnabled()` 时，工具调用执行该分支。
    if (m.isForkSubagentEnabled()) return false
  }

  // Brief is the primary communication channel whenever the tool is present.
  // Its prompt contains the text-visibility contract, which the model must
  // see without a ToolSearch round-trip. No runtime gate needed here: this
  // tool's isEnabled() IS isBriefEnabled(), so being asked about its deferral
  // status implies the gate already passed.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    (feature('KAIROS') || feature('KAIROS_BRIEF')) &&
    BRIEF_TOOL_NAME &&
    tool.name === BRIEF_TOOL_NAME
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // SendUserFile is a file-delivery communication channel (sibling of Brief).
  // Must be immediately available without a ToolSearch round-trip.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    feature('KAIROS') &&
    SEND_USER_FILE_TOOL_NAME &&
    tool.name === SEND_USER_FILE_TOOL_NAME &&
    isReplBridgeActive()
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `tool.shouldDefer === true`，作为工具调用这次计算的结果。
  return tool.shouldDefer === true
}

/**
 * Format one deferred-tool line for the <available-deferred-tools> user
 * message. Search hints (tool.searchHint) are not rendered — the
 * hints A/B (exp_xenhnnmn0smrx4, stopped Mar 21) showed no benefit.
 */
// formatDeferredToolLine 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatDeferredToolLine(tool: Tool): string {
  // 返回 `tool.name`，作为工具调用这次计算的结果。
  return tool.name
}

// getPrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPrompt(): string {
  // 返回 `PROMPT_HEAD + getToolLocationHint() + PROMPT_TAIL`，作为工具调用这次计算的结果。
  return PROMPT_HEAD + getToolLocationHint() + PROMPT_TAIL
}

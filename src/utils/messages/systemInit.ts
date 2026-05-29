// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 getSdkBetas、getSessionId，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSdkBetas, getSessionId } from 'src/bootstrap/state.js'
// 引入 DEFAULT_OUTPUT_STYLE_NAME，将 src/constants/outputStyles.js 中已经封装好的能力接到本文件流程里。
import { DEFAULT_OUTPUT_STYLE_NAME } from 'src/constants/outputStyles.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ApiKeySource,
  PermissionMode,
  SDKMessage,
} from 'src/entrypoints/agentSdkTypes.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  AGENT_TOOL_NAME,
  LEGACY_AGENT_TOOL_NAME,
} from 'src/tools/AgentTool/constants.js'
// 引入 getAnthropicApiKeyWithSource，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { getAnthropicApiKeyWithSource } from '../auth.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 getFastModeState，将 ../fastMode.js 中已经封装好的能力接到本文件流程里。
import { getFastModeState } from '../fastMode.js'
// 引入 getSettings_DEPRECATED，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from '../settings/settings.js'

// TODO(next-minor): remove this translation once SDK consumers have migrated
// to the 'Agent' tool name. The wire name was renamed Task → Agent in #19647,
// but emitting the new name in init/result events broke SDK consumers on a
// patch-level release. Keep emitting 'Task' until the next minor.
// sdkCompatToolName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sdkCompatToolName(name: string): string {
  // 返回 `name === AGENT_TOOL_NAME ? LEGACY_AGENT_TOOL_NAME : name`，作为共享工具这次计算的结果。
  return name === AGENT_TOOL_NAME ? LEGACY_AGENT_TOOL_NAME : name
}

// CommandLike 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CommandLike = { name: string; userInvocable?: boolean }

// SystemInitInputs 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SystemInitInputs = {
  tools: ReadonlyArray<{ name: string }>
  mcpClients: ReadonlyArray<{ name: string; type: string }>
  model: string
  permissionMode: PermissionMode
  commands: ReadonlyArray<CommandLike>
  agents: ReadonlyArray<{ agentType: string }>
  skills: ReadonlyArray<CommandLike>
  plugins: ReadonlyArray<{ name: string; path: string; source: string }>
  fastMode: boolean | undefined
}

/**
 * Build the `system/init` SDKMessage — the first message on the SDK stream
 * carrying session metadata (cwd, tools, model, commands, etc.) that remote
 * clients use to render pickers and gate UI.
 *
 * Called from two paths that must produce identical shapes:
 *   - QueryEngine (spawn-bridge / print-mode / SDK) — yielded as the first
 *     stream message per query turn
 *   - useReplBridge (REPL Remote Control) — sent via writeSdkMessages() on
 *     bridge connect, since REPL uses query() directly and never hits the
 *     QueryEngine SDKMessage layer
 */
// buildSystemInitMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildSystemInitMessage(inputs: SystemInitInputs): SDKMessage {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()
  // outputStyle 命名 `settings?.outputStyle ?? DEFAULT_OUTPUT_STYLE_NAME`，让后续代码直接表达这个值的用途。
  const outputStyle = settings?.outputStyle ?? DEFAULT_OUTPUT_STYLE_NAME

  // initMessage 消息数据 集中保存共享工具 system Init要一起传递的字段。
  const initMessage: SDKMessage = {
    type: 'system',
    subtype: 'init',
    cwd: getCwd(),
    session_id: getSessionId(),
    // 这个回调绑定到 tools: inputs.tools.map(tool => sdkCompatToolName(tool.name)),，负责共享工具在该局部场景下的响应。
    tools: inputs.tools.map(tool => sdkCompatToolName(tool.name)),
    // 这个回调绑定到 mcp_servers: inputs.mcpClients.map(client => ({，负责共享工具在该局部场景下的响应。
    mcp_servers: inputs.mcpClients.map(client => ({
      name: client.name,
      status: client.type,
    })),
    model: inputs.model,
    permissionMode: inputs.permissionMode,
    slash_commands: inputs.commands
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(c => c.userInvocable !== false)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(c => c.name),
    apiKeySource: getAnthropicApiKeyWithSource().source as ApiKeySource,
    betas: getSdkBetas(),
    claude_code_version: MACRO.VERSION,
    output_style: outputStyle,
    // 这个回调绑定到 agents: inputs.agents.map(agent => agent.agentType),，负责共享工具在该局部场景下的响应。
    agents: inputs.agents.map(agent => agent.agentType),
    skills: inputs.skills
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(s => s.userInvocable !== false)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(skill => skill.name),
    // 这个回调绑定到 plugins: inputs.plugins.map(plugin => ({，负责共享工具在该局部场景下的响应。
    plugins: inputs.plugins.map(plugin => ({
      name: plugin.name,
      path: plugin.path,
      source: plugin.source,
    })),
    uuid: randomUUID(),
  }
  // Hidden from public SDK types — ant-only UDS messaging socket path
  // 满足 `feature('UDS_INBOX')` 时，共享工具执行该分支。
  if (feature('UDS_INBOX')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 共享工具 system Init在这里处理 `;(initMessage as Record<string, unknown>).messaging_socket_path =`，完成这一小步状态转换。
    ;(initMessage as Record<string, unknown>).messaging_socket_path =
      require('../udsMessaging.js').getUdsMessagingSocketPath()
    /* eslint-enable @typescript-eslint/no-require-imports */
  }
  // fast_mode_state 状态更新为 `getFastModeState(inputs.model, inputs.fastMode)`，确保共享工具后续读取最新状态。
  initMessage.fast_mode_state = getFastModeState(inputs.model, inputs.fastMode)
  // 返回 `initMessage`，作为共享工具这次计算的结果。
  return initMessage
}

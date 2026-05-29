// 引入 buildComputerUseTools，将 @ant/computer-use-mcp 中已经封装好的能力接到本文件流程里。
import { buildComputerUseTools } from '@ant/computer-use-mcp'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 fileURLToPath，将 url 中已经封装好的能力接到本文件流程里。
import { fileURLToPath } from 'url'
// 接入 buildMcpToolName 服务层能力，把外部通信或共享状态交给 ../../services/mcp/mcpStringUtils.js 处理。
import { buildMcpToolName } from '../../services/mcp/mcpStringUtils.js'
// 类型依赖 { ScopedMcpServerConfig } 来自 ../../services/mcp/types.js，用于校准共享工具的数据契约。
import type { ScopedMcpServerConfig } from '../../services/mcp/types.js'

// 引入 isInBundledMode，将 ../bundledMode.js 中已经封装好的能力接到本文件流程里。
import { isInBundledMode } from '../bundledMode.js'
// 引入 CLI_CU_CAPABILITIES、COMPUTER_USE_MCP_SERVER_NAME，将 ./common.js 中已经封装好的能力接到本文件流程里。
import { CLI_CU_CAPABILITIES, COMPUTER_USE_MCP_SERVER_NAME } from './common.js'
// 引入 getChicagoCoordinateMode，将 ./gates.js 中已经封装好的能力接到本文件流程里。
import { getChicagoCoordinateMode } from './gates.js'

/**
 * Build the dynamic MCP config + allowed tool names. Mirror of
 * `setupClaudeInChrome`. The `mcp__computer-use__*` tools are added to
 * `allowedTools` so they bypass the normal permission prompt — the package's
 * `request_access` handles approval for the whole session.
 *
 * The MCP layer isn't ceremony: the API backend detects `mcp__computer-use__*`
 * tool names and emits a CU availability hint into the system prompt
 * (COMPUTER_USE_MCP_AVAILABILITY_HINT in the anthropic repo). Built-in tools
 * with different names wouldn't trigger it. Cowork uses the same names for the
 * same reason (apps/desktop/src/main/local-agent-mode/systemPrompt.ts:314).
 */
// setupComputerUseMCP 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setupComputerUseMCP(): {
  mcpConfig: Record<string, ScopedMcpServerConfig>
  allowedTools: string[]
} {
  // allowedTools 集合构建`buildComputerUseTools`，供共享工具后续处理使用。
  const allowedTools = buildComputerUseTools(
    CLI_CU_CAPABILITIES,
    getChicagoCoordinateMode(),
  // 这个回调绑定到 ).map(t => buildMcpToolName(COMPUTER_USE_MCP_SERVER_NAME, t.name))，负责共享工具在该局部场景下的响应。
  ).map(t => buildMcpToolName(COMPUTER_USE_MCP_SERVER_NAME, t.name))

  // command/args are never spawned — client.ts intercepts by name and
  // uses the in-process server. The config just needs to exist with
  // type 'stdio' to hit the right branch. Mirrors Chrome's setup.
  // 参数列表保存`isInBundledMode`，供共享工具后续处理使用。
  const args = isInBundledMode()
    ? ['--computer-use-mcp']
    : [
        join(fileURLToPath(import.meta.url), '..', 'cli.js'),
        '--computer-use-mcp',
      ]

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    mcpConfig: {
      [COMPUTER_USE_MCP_SERVER_NAME]: {
        type: 'stdio',
        command: process.execPath,
        args,
        scope: 'dynamic',
      } as const,
    },
    allowedTools,
  }
}

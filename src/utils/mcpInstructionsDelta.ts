// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ConnectedMCPServer,
  MCPServerConnection,
} from '../services/mcp/types.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'

// McpInstructionsDelta 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type McpInstructionsDelta = {
  /** Server names — for stateless-scan reconstruction. */
  addedNames: string[]
  /** Rendered "## {name}\n{instructions}" blocks for addedNames. */
  addedBlocks: string[]
  removedNames: string[]
}

/**
 * Client-authored instruction block to announce when a server connects,
 * in addition to (or instead of) the server's own `InitializeResult.instructions`.
 * Lets first-party servers (e.g., claude-in-chrome) carry client-side
 * context the server itself doesn't know about.
 */
// ClientSideInstruction 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClientSideInstruction = {
  serverName: string
  block: string
}

/**
 * True → announce MCP server instructions via persisted delta attachments.
 * False → prompts.ts keeps its DANGEROUS_uncachedSystemPromptSection
 * (rebuilt every turn; cache-busts on late connect).
 *
 * Env override for local testing: CLAUDE_CODE_MCP_INSTR_DELTA=true/false
 * wins over both ant bypass and the GrowthBook gate.
 */
// isMcpInstructionsDeltaEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMcpInstructionsDeltaEnabled(): boolean {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_MCP_INSTR_DELTA)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_MCP_INSTR_DELTA)) return true
  // 满足 `isEnvDefinedFalsy(process.env.CLAUDE_CODE_MCP_INSTR_DELTA)` 时，共享工具执行该分支。
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_MCP_INSTR_DELTA)) return false
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    process.env.USER_TYPE === 'ant' ||
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_basalt_3kr', false)
  )
}

/**
 * Diff the current set of connected MCP servers that have instructions
 * (server-authored via InitializeResult, or client-side synthesized)
 * against what's already been announced in this conversation. Null if
 * nothing changed.
 *
 * Instructions are immutable for the life of a connection (set once at
 * handshake), so the scan diffs on server NAME, not on content.
 */
// getMcpInstructionsDelta 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpInstructionsDelta(
  mcpClients: MCPServerConnection[],
  messages: Message[],
  clientSideInstructions: ClientSideInstruction[],
): McpInstructionsDelta | null {
  // announced构建`new Set<string>()` 整理出中间结果，供共享工具 mcp Instructions Delta后续步骤使用。
  const announced = new Set<string>()
  // attachmentCount 数量保存`0`，供共享工具 mcp Instructions Delta后续判断或输出使用。
  let attachmentCount = 0
  // midCount 数量保存`0`，供共享工具 mcp Instructions Delta后续判断或输出使用。
  let midCount = 0
  // 按顺序遍历 `messages` 中的消息，逐个交给共享工具处理。
  for (const msg of messages) {
    // `msg.type` 与 `'attachment'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'attachment') continue
    // 共享工具 mcp Instructions Delta在这里处理 `attachmentCount++`，完成这一小步状态转换。
    attachmentCount++
    // `msg.attachment.type` 与 `'mcp_instructions_delta'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.attachment.type !== 'mcp_instructions_delta') continue
    // 共享工具 mcp Instructions Delta在这里处理 `midCount++`，完成这一小步状态转换。
    midCount++
    // 逐项读取 `msg.attachment.addedNames) announced.add(n` 中的n，按输入顺序推进共享工具。
    for (const n of msg.attachment.addedNames) announced.add(n)
    // 逐项读取 `msg.attachment.removedNames) announced.delete(n` 中的n，按输入顺序推进共享工具。
    for (const n of msg.attachment.removedNames) announced.delete(n)
  }

  // connected筛选`mcpClients.filter`，供共享工具后续处理使用。
  const connected = mcpClients.filter(
    // 这个回调绑定到 (c): c is ConnectedMCPServer => c.type === 'connected',，负责共享工具在该局部场景下的响应。
    (c): c is ConnectedMCPServer => c.type === 'connected',
  )
  // connectedNames 集合保存`Set`，供共享工具后续处理使用。
  const connectedNames = new Set(connected.map(c => c.name))

  // Servers with instructions to announce (either channel). A server can
  // have both: server-authored instructions + a client-side block appended.
  // blocks 集合 命名 `new Map<string, string>()`，让后续代码直接表达这个值的用途。
  const blocks = new Map<string, string>()
  // 按顺序遍历 `connected` 中的c，逐个交给共享工具处理。
  for (const c of connected) {
    // 满足 `c.instructions) blocks.set(c.name, `## ${c.name}\n${c.instructions}`` 时，共享工具执行该分支。
    if (c.instructions) blocks.set(c.name, `## ${c.name}\n${c.instructions}`)
  }
  // 按顺序遍历 `clientSideInstructions` 中的ci，逐个交给共享工具处理。
  for (const ci of clientSideInstructions) {
    // 满足 `!connectedNames.has(ci.serverName)` 时，共享工具执行该分支。
    if (!connectedNames.has(ci.serverName)) continue
    // existing读取`blocks.get`，供共享工具后续处理使用。
    const existing = blocks.get(ci.serverName)
    // blocks.set 写入新的状态值，使共享工具后续读取保持一致。
    blocks.set(
      ci.serverName,
      existing
        ? `${existing}\n\n${ci.block}`
        : `## ${ci.serverName}\n${ci.block}`,
    )
  }

  // added 从空数组开始收集，后续循环会按处理顺序追加条目。
  const added: Array<{ name: string; block: string }> = []
  // 循环处理 `const [name, block] of blocks`，让共享工具逐项把同类条目按顺序走完。
  for (const [name, block] of blocks) {
    // 满足 `!announced.has(name)) added.push({ name, block }` 时，共享工具执行该分支。
    if (!announced.has(name)) added.push({ name, block })
  }

  // A previously-announced server that is no longer connected → removed.
  // There is no "announced but now has no instructions" case for a still-
  // connected server: InitializeResult is immutable, and client-side
  // instruction gates are session-stable in practice. (/model can flip
  // the model gate, but deferred_tools_delta has the same property and
  // we treat history as historical — no retroactive retractions.)
  // removed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const removed: string[] = []
  // 按顺序遍历 `announced` 中的n，逐个交给共享工具处理。
  for (const n of announced) {
    // 满足 `!connectedNames.has(n)) removed.push(n` 时，共享工具执行该分支。
    if (!connectedNames.has(n)) removed.push(n)
  }

  // added.length === 0 && removed 数量为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (added.length === 0 && removed.length === 0) return null

  // Same diagnostic fields as tengu_deferred_tools_pool_change — same
  // scan-fails-in-prod bug, same attachment persistence path.
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_mcp_instructions_pool_change', {
    addedCount: added.length,
    removedCount: removed.length,
    priorAnnouncedCount: announced.size,
    clientSideCount: clientSideInstructions.length,
    messagesLength: messages.length,
    attachmentCount,
    midCount,
  })

  // 调用 added.sort，触发共享工具此处需要的副作用。
  added.sort((a, b) => a.name.localeCompare(b.name))
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // 这个回调绑定到 addedNames: added.map(a => a.name),，负责共享工具在该局部场景下的响应。
    addedNames: added.map(a => a.name),
    // 这个回调绑定到 addedBlocks: added.map(a => a.block),，负责共享工具在该局部场景下的响应。
    addedBlocks: added.map(a => a.block),
    removedNames: removed.sort(),
  }
}

// 整理这一组导入，让mcp Skill Builders后续逻辑可以直接复用这些外部能力。
import type {
  createSkillCommand,
  parseSkillFrontmatterFields,
} from './loadSkillsDir.js'

/**
 * Write-once registry for the two loadSkillsDir functions that MCP skill
 * discovery needs. This module is a dependency-graph leaf: it imports nothing
 * but types, so both mcpSkills.ts and loadSkillsDir.ts can depend on it
 * without forming a cycle (client.ts → mcpSkills.ts → loadSkillsDir.ts → …
 * → client.ts).
 *
 * The non-literal dynamic-import approach ("await import(variable)") fails at
 * runtime in Bun-bundled binaries — the specifier is resolved against the
 * chunk's /$bunfs/root/… path, not the original source tree, yielding "Cannot
 * find module './loadSkillsDir.js'". A literal dynamic import works in bunfs
 * but dependency-cruiser tracks it, and because loadSkillsDir transitively
 * reaches almost everything, the single new edge fans out into many new cycle
 * violations in the diff check.
 *
 * Registration happens at loadSkillsDir.ts module init, which is eagerly
 * evaluated at startup via the static import from commands.ts — long before
 * any MCP server connects.
 */

// MCPSkillBuilders 固化mcp Skill Builders里传递的数据形状，帮助调用方按同一结构读写字段。
export type MCPSkillBuilders = {
  createSkillCommand: typeof createSkillCommand
  parseSkillFrontmatterFields: typeof parseSkillFrontmatterFields
}

// builders 集合 命名 `null`，让后续代码直接表达这个值的用途。
let builders: MCPSkillBuilders | null = null

// registerMCPSkillBuilders 封装mcpSkillBuilders的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerMCPSkillBuilders(b: MCPSkillBuilders): void {
  // builders 集合更新为 `b`，确保mcpSkillBuilders后续读取最新状态。
  builders = b
}

// getMCPSkillBuilders 封装mcpSkillBuilders的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMCPSkillBuilders(): MCPSkillBuilders {
  // builders 集合缺失时提前走兜底路径，避免mcp Skill Builders继续依赖无效输入。
  if (!builders) {
    // 抛出 new Error(，阻止mcp Skill Builders在无效状态下继续运行。
    throw new Error(
      'MCP skill builders not registered — loadSkillsDir.ts has not been evaluated yet',
    )
  }
  // 返回 `builders`，作为mcp Skill Builders这次计算的结果。
  return builders
}

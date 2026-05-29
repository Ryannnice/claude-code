// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'
// 引入 AgentMemoryScope、getAgentMemoryDir，将 ./agentMemory.js 中已经封装好的能力接到本文件流程里。
import { type AgentMemoryScope, getAgentMemoryDir } from './agentMemory.js'

// SNAPSHOT_BASE固定为 `'agent-memory-snapshots'`，作为工具调用Agent 工具 agent Memory Snapshot后续展示或比较的基准。
const SNAPSHOT_BASE = 'agent-memory-snapshots'
// SNAPSHOT_JSON固定为 `'snapshot.json'`，作为工具调用Agent 工具 agent Memory Snapshot后续展示或比较的基准。
const SNAPSHOT_JSON = 'snapshot.json'
// SYNCED_JSON 命名 `'.snapshot-synced.json'`，让后续代码直接表达这个值的用途。
const SYNCED_JSON = '.snapshot-synced.json'

// snapshotMetaSchema保存`lazySchema`，供工具调用后续处理使用。
const snapshotMetaSchema = lazySchema(() =>
  z.object({
    updatedAt: z.string().min(1),
  }),
)

// syncedMetaSchema保存`lazySchema`，供工具调用后续处理使用。
const syncedMetaSchema = lazySchema(() =>
  z.object({
    syncedFrom: z.string().min(1),
  }),
)
// SyncedMeta 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type SyncedMeta = z.infer<ReturnType<typeof syncedMetaSchema>>

/**
 * Returns the path to the snapshot directory for an agent in the current project.
 * e.g., <cwd>/.claude/agent-memory-snapshots/<agentType>/
 */
// getSnapshotDirForAgent 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSnapshotDirForAgent(agentType: string): string {
  // 返回 `join(getCwd(), '.claude', SNAPSHOT_BASE, agentType)`，作为工具调用这次计算的结果。
  return join(getCwd(), '.claude', SNAPSHOT_BASE, agentType)
}

// getSnapshotJsonPath 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSnapshotJsonPath(agentType: string): string {
  // 返回 `join(getSnapshotDirForAgent(agentType), SNAPSHOT_JSON)`，作为工具调用这次计算的结果。
  return join(getSnapshotDirForAgent(agentType), SNAPSHOT_JSON)
}

// getSyncedJsonPath 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSyncedJsonPath(agentType: string, scope: AgentMemoryScope): string {
  // 返回 `join(getAgentMemoryDir(agentType, scope), SYNCED_JSON)`，作为工具调用这次计算的结果。
  return join(getAgentMemoryDir(agentType, scope), SYNCED_JSON)
}

async function readJsonFile<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供工具调用后续处理使用。
    const content = await readFile(path, { encoding: 'utf-8' })
    // 结果保存`schema.safeParse`，供工具调用后续处理使用。
    const result = schema.safeParse(jsonParse(content))
    // 返回 `result.success ? result.data : null`，作为工具调用这次计算的结果。
    return result.success ? result.data : null
  } catch {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }
}

// copySnapshotToLocal 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function copySnapshotToLocal(
  agentType: string,
  scope: AgentMemoryScope,
): Promise<void> {
  // snapshotMemDir读取`getSnapshotDirForAgent`，供工具调用后续处理使用。
  const snapshotMemDir = getSnapshotDirForAgent(agentType)
  // localMemDir读取`getAgentMemoryDir`，供工具调用后续处理使用。
  const localMemDir = getAgentMemoryDir(agentType, scope)

  // 等待 `mkdir(localMemDir, { recursive: true })` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
  await mkdir(localMemDir, { recursive: true })

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据读取`readdir`，供工具调用后续处理使用。
    const files = await readdir(snapshotMemDir, { withFileTypes: true })
    // 按顺序遍历 `files` 中的dirent，逐个交给工具调用处理。
    for (const dirent of files) {
      // 只有 `!dirent.isFile() || dirent.name === SNAPSHOT_JSON` 满足时，工具调用才执行该分支。
      if (!dirent.isFile() || dirent.name === SNAPSHOT_JSON) continue
      // 文本内容读取`readFile`，供工具调用后续处理使用。
      const content = await readFile(join(snapshotMemDir, dirent.name), {
        encoding: 'utf-8',
      })
      // 等待 `writeFile(join(localMemDir, dirent.name), content)` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
      await writeFile(join(localMemDir, dirent.name), content)
    }
  } catch (e) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to copy snapshot to local agent memory: ${e}`)
  }
}

// saveSyncedMeta 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function saveSyncedMeta(
  agentType: string,
  scope: AgentMemoryScope,
  snapshotTimestamp: string,
): Promise<void> {
  // syncedPath 路径数据读取`getSyncedJsonPath`，供工具调用后续处理使用。
  const syncedPath = getSyncedJsonPath(agentType, scope)
  // localMemDir读取`getAgentMemoryDir`，供工具调用后续处理使用。
  const localMemDir = getAgentMemoryDir(agentType, scope)
  // 等待 `mkdir(localMemDir, { recursive: true })` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
  await mkdir(localMemDir, { recursive: true })
  // meta 集中保存Agent 工具 agent Memory Snapshot要一起传递的字段。
  const meta: SyncedMeta = { syncedFrom: snapshotTimestamp }
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(syncedPath, jsonStringify(meta))` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
    await writeFile(syncedPath, jsonStringify(meta))
  } catch (e) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to save snapshot sync metadata: ${e}`)
  }
}

/**
 * Check if a snapshot exists and whether it's newer than what we last synced.
 */
// checkAgentMemorySnapshot 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkAgentMemorySnapshot(
  agentType: string,
  scope: AgentMemoryScope,
): Promise<{
  action: 'none' | 'initialize' | 'prompt-update'
  snapshotTimestamp?: string
}> {
  // snapshotMeta读取`readJsonFile`，供工具调用后续处理使用。
  const snapshotMeta = await readJsonFile(
    getSnapshotJsonPath(agentType),
    snapshotMetaSchema(),
  )

  // snapshotMeta缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!snapshotMeta) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { action: 'none' }
  }

  // localMemDir读取`getAgentMemoryDir`，供工具调用后续处理使用。
  const localMemDir = getAgentMemoryDir(agentType, scope)

  // hasLocalMemory标记工具调用Agent 工具 agent Memory Snapshot是否启用对应路径。
  let hasLocalMemory = false
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合读取`readdir`，供工具调用后续处理使用。
    const dirents = await readdir(localMemDir, { withFileTypes: true })
    // hasLocalMemory更新为 `dirents.some(d => d.isFile() && d.name.endsWith('.md'))`，确保Agent 工具后续读取最新状态。
    hasLocalMemory = dirents.some(d => d.isFile() && d.name.endsWith('.md'))
  } catch {
    // Directory doesn't exist
  }

  // hasLocalMemory缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!hasLocalMemory) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { action: 'initialize', snapshotTimestamp: snapshotMeta.updatedAt }
  }

  // syncedMeta读取`readJsonFile`，供工具调用后续处理使用。
  const syncedMeta = await readJsonFile(
    getSyncedJsonPath(agentType, scope),
    syncedMetaSchema(),
  )

  // 工具调用在这里按实际状态进入对应分支。
  if (
    !syncedMeta ||
    new Date(snapshotMeta.updatedAt) > new Date(syncedMeta.syncedFrom)
  ) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      action: 'prompt-update',
      snapshotTimestamp: snapshotMeta.updatedAt,
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { action: 'none' }
}

/**
 * Initialize local agent memory from a snapshot (first-time setup).
 */
// initializeFromSnapshot 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initializeFromSnapshot(
  agentType: string,
  scope: AgentMemoryScope,
  snapshotTimestamp: string,
): Promise<void> {
  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Initializing agent memory for ${agentType} from project snapshot`,
  )
  // 等待 `copySnapshotToLocal(agentType, scope)` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
  await copySnapshotToLocal(agentType, scope)
  // 等待 `saveSyncedMeta(agentType, scope, snapshotTimestamp)` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
  await saveSyncedMeta(agentType, scope, snapshotTimestamp)
}

/**
 * Replace local agent memory with the snapshot.
 */
// replaceFromSnapshot 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function replaceFromSnapshot(
  agentType: string,
  scope: AgentMemoryScope,
  snapshotTimestamp: string,
): Promise<void> {
  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Replacing agent memory for ${agentType} with project snapshot`,
  )
  // Remove existing .md files before copying to avoid orphans
  // localMemDir读取`getAgentMemoryDir`，供工具调用后续处理使用。
  const localMemDir = getAgentMemoryDir(agentType, scope)
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // existing读取`readdir`，供工具调用后续处理使用。
    const existing = await readdir(localMemDir, { withFileTypes: true })
    // 按顺序遍历 `existing` 中的dirent，逐个交给工具调用处理。
    for (const dirent of existing) {
      // 只有 `dirent.isFile() && dirent.name.endsWith('.md')` 满足时，工具调用才执行该分支。
      if (dirent.isFile() && dirent.name.endsWith('.md')) {
        // 等待 `unlink(join(localMemDir, dirent.name))` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
        await unlink(join(localMemDir, dirent.name))
      }
    }
  } catch {
    // Directory may not exist yet
  }
  // 等待 `copySnapshotToLocal(agentType, scope)` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
  await copySnapshotToLocal(agentType, scope)
  // 等待 `saveSyncedMeta(agentType, scope, snapshotTimestamp)` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
  await saveSyncedMeta(agentType, scope, snapshotTimestamp)
}

/**
 * Mark the current snapshot as synced without changing local memory.
 */
// markSnapshotSynced 封装Agent 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function markSnapshotSynced(
  agentType: string,
  scope: AgentMemoryScope,
  snapshotTimestamp: string,
): Promise<void> {
  // 等待 `saveSyncedMeta(agentType, scope, snapshotTimestamp)` 完成，再继续Agent 工具 agent Memory Snapshot的异步流程。
  await saveSyncedMeta(agentType, scope, snapshotTimestamp)
}

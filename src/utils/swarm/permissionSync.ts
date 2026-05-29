/**
 * Synchronized Permission Prompts for Agent Swarms
 *
 * This module provides infrastructure for coordinating permission prompts across
 * multiple agents in a swarm. When a worker agent needs permission for a tool use,
 * it can forward the request to the team leader, who can then approve or deny it.
 *
 * The system uses the teammate mailbox for message passing:
 * - Workers send permission requests to the leader's mailbox
 * - Leaders send permission responses to the worker's mailbox
 *
 * Flow:
 * 1. Worker agent encounters a permission prompt
 * 2. Worker sends a permission_request message to the leader's mailbox
 * 3. Leader polls for mailbox messages and detects permission requests
 * 4. User approves/denies via the leader's UI
 * 5. Leader sends a permission_response message to the worker's mailbox
 * 6. Worker polls mailbox for responses and continues execution
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from '../errors.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 * as lockfile，将 ../lockfile.js 中已经封装好的能力接到本文件流程里。
import * as lockfile from '../lockfile.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 类型依赖 { PermissionUpdate } 来自 ../permissions/PermissionUpdateSchema.js，用于校准共享工具的数据契约。
import type { PermissionUpdate } from '../permissions/PermissionUpdateSchema.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAgentId,
  getAgentName,
  getTeammateColor,
  getTeamName,
} from '../teammate.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createPermissionRequestMessage,
  createPermissionResponseMessage,
  createSandboxPermissionRequestMessage,
  createSandboxPermissionResponseMessage,
  writeToMailbox,
} from '../teammateMailbox.js'
// 引入 getTeamDir、readTeamFileAsync，将 ./teamHelpers.js 中已经封装好的能力接到本文件流程里。
import { getTeamDir, readTeamFileAsync } from './teamHelpers.js'

/**
 * Full request schema for a permission request from a worker to the leader
 */
// SwarmPermissionRequestSchema 权限数据保存`lazySchema`，供共享工具后续处理使用。
export const SwarmPermissionRequestSchema = lazySchema(() =>
  z.object({
    /** Unique identifier for this request */
    id: z.string(),
    /** Worker's CLAUDE_CODE_AGENT_ID */
    workerId: z.string(),
    /** Worker's CLAUDE_CODE_AGENT_NAME */
    workerName: z.string(),
    /** Worker's CLAUDE_CODE_AGENT_COLOR */
    workerColor: z.string().optional(),
    /** Team name for routing */
    teamName: z.string(),
    /** Tool name requiring permission (e.g., "Bash", "Edit") */
    toolName: z.string(),
    /** Original toolUseID from worker's context */
    toolUseId: z.string(),
    /** Human-readable description of the tool use */
    description: z.string(),
    /** Serialized tool input */
    input: z.record(z.string(), z.unknown()),
    /** Suggested permission rules from the permission result */
    permissionSuggestions: z.array(z.unknown()),
    /** Status of the request */
    status: z.enum(['pending', 'approved', 'rejected']),
    /** Who resolved the request */
    resolvedBy: z.enum(['worker', 'leader']).optional(),
    /** Timestamp when resolved */
    resolvedAt: z.number().optional(),
    /** Rejection feedback message */
    feedback: z.string().optional(),
    /** Modified input if changed by resolver */
    updatedInput: z.record(z.string(), z.unknown()).optional(),
    /** "Always allow" rules applied during resolution */
    permissionUpdates: z.array(z.unknown()).optional(),
    /** Timestamp when request was created */
    createdAt: z.number(),
  }),
)

// SwarmPermissionRequest 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SwarmPermissionRequest = z.infer<
  ReturnType<typeof SwarmPermissionRequestSchema>
>

/**
 * Resolution data returned when leader/worker resolves a request
 */
// PermissionResolution 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionResolution = {
  /** Decision: approved or rejected */
  decision: 'approved' | 'rejected'
  /** Who resolved it */
  resolvedBy: 'worker' | 'leader'
  /** Optional feedback message if rejected */
  feedback?: string
  /** Optional updated input if the resolver modified it */
  updatedInput?: Record<string, unknown>
  /** Permission updates to apply (e.g., "always allow" rules) */
  permissionUpdates?: PermissionUpdate[]
}

/**
 * Get the base directory for a team's permission requests
 * Path: ~/.claude/teams/{teamName}/permissions/
 */
// getPermissionDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPermissionDir(teamName: string): string {
  // 返回 `join(getTeamDir(teamName), 'permissions')`，作为共享工具这次计算的结果。
  return join(getTeamDir(teamName), 'permissions')
}

/**
 * Get the pending directory for a team
 */
// getPendingDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPendingDir(teamName: string): string {
  // 返回 `join(getPermissionDir(teamName), 'pending')`，作为共享工具这次计算的结果。
  return join(getPermissionDir(teamName), 'pending')
}

/**
 * Get the resolved directory for a team
 */
// getResolvedDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getResolvedDir(teamName: string): string {
  // 返回 `join(getPermissionDir(teamName), 'resolved')`，作为共享工具这次计算的结果。
  return join(getPermissionDir(teamName), 'resolved')
}

/**
 * Ensure the permissions directory structure exists (async)
 */
// ensurePermissionDirsAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function ensurePermissionDirsAsync(teamName: string): Promise<void> {
  // permDir读取`getPermissionDir`，供共享工具后续处理使用。
  const permDir = getPermissionDir(teamName)
  // pendingDir读取`getPendingDir`，供共享工具后续处理使用。
  const pendingDir = getPendingDir(teamName)
  // resolvedDir读取`getResolvedDir`，供共享工具后续处理使用。
  const resolvedDir = getResolvedDir(teamName)

  // 按顺序遍历 `[permDir, pendingDir, resolvedDir]` 中的dir，逐个交给共享工具处理。
  for (const dir of [permDir, pendingDir, resolvedDir]) {
    // 等待 `mkdir(dir, { recursive: true })` 完成，再继续共享工具 permission Sync的异步流程。
    await mkdir(dir, { recursive: true })
  }
}

/**
 * Get the path to a pending request file
 */
// getPendingRequestPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPendingRequestPath(teamName: string, requestId: string): string {
  // 返回 `join(getPendingDir(teamName), `${requestId}.json`)`，作为共享工具这次计算的结果。
  return join(getPendingDir(teamName), `${requestId}.json`)
}

/**
 * Get the path to a resolved request file
 */
// getResolvedRequestPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getResolvedRequestPath(teamName: string, requestId: string): string {
  // 返回 `join(getResolvedDir(teamName), `${requestId}.json`)`，作为共享工具这次计算的结果。
  return join(getResolvedDir(teamName), `${requestId}.json`)
}

/**
 * Generate a unique request ID
 */
// generateRequestId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateRequestId(): string {
  // 返回 ``perm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}``，作为共享工具这次计算的结果。
  return `perm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a new SwarmPermissionRequest object
 */
// createPermissionRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPermissionRequest(params: {
  toolName: string
  toolUseId: string
  input: Record<string, unknown>
  description: string
  permissionSuggestions?: unknown[]
  teamName?: string
  workerId?: string
  workerName?: string
  workerColor?: string
}): SwarmPermissionRequest {
  // teamName读取`getTeamName`，供共享工具后续处理使用。
  const teamName = params.teamName || getTeamName()
  // workerId读取`getAgentId`，供共享工具后续处理使用。
  const workerId = params.workerId || getAgentId()
  // workerName读取`getAgentName`，供共享工具后续处理使用。
  const workerName = params.workerName || getAgentName()
  // workerColor读取`getTeammateColor`，供共享工具后续处理使用。
  const workerColor = params.workerColor || getTeammateColor()

  // teamName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamName) {
    // 抛出 new Error('Team name is required for permission requests')，阻止共享工具在无效状态下继续运行。
    throw new Error('Team name is required for permission requests')
  }
  // workerId缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!workerId) {
    // 抛出 new Error('Worker ID is required for permission requests')，阻止共享工具在无效状态下继续运行。
    throw new Error('Worker ID is required for permission requests')
  }
  // workerName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!workerName) {
    // 抛出 new Error('Worker name is required for permission requests')，阻止共享工具在无效状态下继续运行。
    throw new Error('Worker name is required for permission requests')
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    id: generateRequestId(),
    workerId,
    workerName,
    workerColor,
    teamName,
    toolName: params.toolName,
    toolUseId: params.toolUseId,
    description: params.description,
    input: params.input,
    permissionSuggestions: params.permissionSuggestions || [],
    status: 'pending',
    createdAt: Date.now(),
  }
}

/**
 * Write a permission request to the pending directory with file locking
 * Called by worker agents when they need permission approval from the leader
 *
 * @returns The written request
 */
// writePermissionRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writePermissionRequest(
  request: SwarmPermissionRequest,
): Promise<SwarmPermissionRequest> {
  // 等待 `ensurePermissionDirsAsync(request.teamName)` 完成，再继续共享工具 permission Sync的异步流程。
  await ensurePermissionDirsAsync(request.teamName)

  // pendingPath 路径数据读取`getPendingRequestPath`，供共享工具后续处理使用。
  const pendingPath = getPendingRequestPath(request.teamName, request.id)
  // lockDir读取`getPendingDir`，供共享工具后续处理使用。
  const lockDir = getPendingDir(request.teamName)

  // Create a directory-level lock file for atomic writes
  // lockFilePath 路径数据格式化`join`，供共享工具后续处理使用。
  const lockFilePath = join(lockDir, '.lock')
  // 等待 `writeFile(lockFilePath, '', 'utf-8')` 完成，再继续共享工具 permission Sync的异步流程。
  await writeFile(lockFilePath, '', 'utf-8')

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // release更新为 `await lockfile.lock(lockFilePath)`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(lockFilePath)

    // Write the request file
    // 等待 `writeFile(pendingPath, jsonStringify(request, null, 2), 'utf-8')` 完成，再继续共享工具 permission Sync的异步流程。
    await writeFile(pendingPath, jsonStringify(request, null, 2), 'utf-8')

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Wrote pending request ${request.id} from ${request.workerName} for ${request.toolName}`,
    )

    // 返回 `request`，作为共享工具这次计算的结果。
    return request
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Failed to write permission request: ${error}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 permission Sync的异步流程。
      await release()
    }
  }
}

/**
 * Read all pending permission requests for a team
 * Called by the team leader to see what requests need attention
 */
// readPendingPermissions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readPendingPermissions(
  teamName?: string,
): Promise<SwarmPermissionRequest[]> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[PermissionSync] No team name available')
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // pendingDir读取`getPendingDir`，供共享工具后续处理使用。
  const pendingDir = getPendingDir(team)

  // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let files: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据更新为 `await readdir(pendingDir)`，确保共享工具后续读取最新状态。
    files = await readdir(pendingDir)
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[PermissionSync] Failed to read pending requests: ${e}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // jsonFiles 文件数据筛选`files.filter`，供共享工具后续处理使用。
  const jsonFiles = files.filter(f => f.endsWith('.json') && f !== '.lock')

  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(
    // 调用 jsonFiles.map，触发共享工具此处需要的副作用。
    jsonFiles.map(async file => {
      // 文件路径格式化`join`，供共享工具后续处理使用。
      const filePath = join(pendingDir, file)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容读取`readFile`，供共享工具后续处理使用。
        const content = await readFile(filePath, 'utf-8')
        // 解析结果保存`SwarmPermissionRequestSchema`，供共享工具后续处理使用。
        const parsed = SwarmPermissionRequestSchema().safeParse(
          jsonParse(content),
        )
        // 满足 `parsed.success` 时，共享工具执行该分支。
        if (parsed.success) {
          // 返回 `parsed.data`，作为共享工具这次计算的结果。
          return parsed.data
        }
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[PermissionSync] Invalid request file ${file}: ${parsed.error.message}`,
        )
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      } catch (err) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[PermissionSync] Failed to read request file ${file}: ${err}`,
        )
        // 返回 `null`，作为共享工具这次计算的结果。
        return null
      }
    }),
  )

  // requests 请求数据筛选`results.filter`，供共享工具后续处理使用。
  const requests = results.filter(r => r !== null)

  // Sort by creation time (oldest first)
  // 调用 requests.sort，触发共享工具此处需要的副作用。
  requests.sort((a, b) => a.createdAt - b.createdAt)

  // 返回 `requests`，作为共享工具这次计算的结果。
  return requests
}

/**
 * Read a resolved permission request by ID
 * Called by workers to check if their request has been resolved
 *
 * @returns The resolved request, or null if not yet resolved
 */
// readResolvedPermission 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readResolvedPermission(
  requestId: string,
  teamName?: string,
): Promise<SwarmPermissionRequest | null> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // resolvedPath 路径数据读取`getResolvedRequestPath`，供共享工具后续处理使用。
  const resolvedPath = getResolvedRequestPath(team, requestId)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = await readFile(resolvedPath, 'utf-8')
    // 解析结果保存`SwarmPermissionRequestSchema`，供共享工具后续处理使用。
    const parsed = SwarmPermissionRequestSchema().safeParse(jsonParse(content))
    // 满足 `parsed.success` 时，共享工具执行该分支。
    if (parsed.success) {
      // 返回 `parsed.data`，作为共享工具这次计算的结果。
      return parsed.data
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Invalid resolved request ${requestId}: ${parsed.error.message}`,
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Failed to read resolved request ${requestId}: ${e}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Resolve a permission request
 * Called by the team leader (or worker in self-resolution cases)
 *
 * Writes the resolution to resolved/, removes from pending/
 */
// resolvePermission 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolvePermission(
  requestId: string,
  resolution: PermissionResolution,
  teamName?: string,
): Promise<boolean> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[PermissionSync] No team name available')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 等待 `ensurePermissionDirsAsync(team)` 完成，再继续共享工具 permission Sync的异步流程。
  await ensurePermissionDirsAsync(team)

  // pendingPath 路径数据读取`getPendingRequestPath`，供共享工具后续处理使用。
  const pendingPath = getPendingRequestPath(team, requestId)
  // resolvedPath 路径数据读取`getResolvedRequestPath`，供共享工具后续处理使用。
  const resolvedPath = getResolvedRequestPath(team, requestId)
  // lockFilePath 路径数据格式化`join`，供共享工具后续处理使用。
  const lockFilePath = join(getPendingDir(team), '.lock')

  // 等待 `writeFile(lockFilePath, '', 'utf-8')` 完成，再继续共享工具 permission Sync的异步流程。
  await writeFile(lockFilePath, '', 'utf-8')

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // release更新为 `await lockfile.lock(lockFilePath)`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(lockFilePath)

    // Read the pending request
    // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
    let content: string
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 文本内容更新为 `await readFile(pendingPath, 'utf-8')`，确保共享工具后续读取最新状态。
      content = await readFile(pendingPath, 'utf-8')
    } catch (e: unknown) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(e)
      // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
      if (code === 'ENOENT') {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[PermissionSync] Pending request not found: ${requestId}`,
        )
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 抛出 e，阻止共享工具在无效状态下继续运行。
      throw e
    }

    // 解析结果保存`SwarmPermissionRequestSchema`，供共享工具后续处理使用。
    const parsed = SwarmPermissionRequestSchema().safeParse(jsonParse(content))
    // parsed.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!parsed.success) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[PermissionSync] Invalid pending request ${requestId}: ${parsed.error.message}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // request 请求数据 命名 `parsed.data`，让后续代码直接表达这个值的用途。
    const request = parsed.data

    // Update the request with resolution data
    // resolvedRequest 请求数据 集中保存共享工具 permission Sync要一起传递的字段。
    const resolvedRequest: SwarmPermissionRequest = {
      ...request,
      status: resolution.decision === 'approved' ? 'approved' : 'rejected',
      resolvedBy: resolution.resolvedBy,
      resolvedAt: Date.now(),
      feedback: resolution.feedback,
      updatedInput: resolution.updatedInput,
      permissionUpdates: resolution.permissionUpdates,
    }

    // Write to resolved directory
    // 等待 `writeFile(` 完成，再继续共享工具 permission Sync的异步流程。
    await writeFile(
      resolvedPath,
      jsonStringify(resolvedRequest, null, 2),
      'utf-8',
    )

    // Remove from pending directory
    // 等待 `unlink(pendingPath)` 完成，再继续共享工具 permission Sync的异步流程。
    await unlink(pendingPath)

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Resolved request ${requestId} with ${resolution.decision}`,
    )

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[PermissionSync] Failed to resolve request: ${error}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 permission Sync的异步流程。
      await release()
    }
  }
}

/**
 * Clean up old resolved permission files
 * Called periodically to prevent file accumulation
 *
 * @param teamName - Team name
 * @param maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 */
// cleanupOldResolutions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupOldResolutions(
  teamName?: string,
  maxAgeMs = 3600000,
): Promise<number> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }

  // resolvedDir读取`getResolvedDir`，供共享工具后续处理使用。
  const resolvedDir = getResolvedDir(team)

  // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let files: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据更新为 `await readdir(resolvedDir)`，确保共享工具后续读取最新状态。
    files = await readdir(resolvedDir)
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回 `0`，作为共享工具这次计算的结果。
      return 0
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[PermissionSync] Failed to cleanup resolutions: ${e}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }

  // now记录时间`Date.now`，供共享工具后续处理使用。
  const now = Date.now()
  // jsonFiles 文件数据筛选`files.filter`，供共享工具后续处理使用。
  const jsonFiles = files.filter(f => f.endsWith('.json'))

  // cleanupResults 集合保存`Promise.all`，供共享工具后续处理使用。
  const cleanupResults = await Promise.all(
    // 调用 jsonFiles.map，触发共享工具此处需要的副作用。
    jsonFiles.map(async file => {
      // 文件路径格式化`join`，供共享工具后续处理使用。
      const filePath = join(resolvedDir, file)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容读取`readFile`，供共享工具后续处理使用。
        const content = await readFile(filePath, 'utf-8')
        // request 请求数据解析`jsonParse`，供共享工具后续处理使用。
        const request = jsonParse(content) as SwarmPermissionRequest

        // Check if the resolution is old enough to clean up
        // Use >= to handle edge case where maxAgeMs is 0 (clean up everything)
        // resolvedAt标记共享工具 permission Sync是否启用对应路径。
        const resolvedAt = request.resolvedAt || request.createdAt
        // 满足 `now - resolvedAt >= maxAgeMs` 时，共享工具执行该分支。
        if (now - resolvedAt >= maxAgeMs) {
          // 等待 `unlink(filePath)` 完成，再继续共享工具 permission Sync的异步流程。
          await unlink(filePath)
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`[PermissionSync] Cleaned up old resolution: ${file}`)
          // 返回 `1`，作为共享工具这次计算的结果。
          return 1
        }
        // 返回 `0`，作为共享工具这次计算的结果。
        return 0
      } catch {
        // If we can't parse it, clean it up anyway
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `unlink(filePath)` 完成，再继续共享工具 permission Sync的异步流程。
          await unlink(filePath)
          // 返回 `1`，作为共享工具这次计算的结果。
          return 1
        } catch {
          // Ignore deletion errors
          // 返回 `0`，作为共享工具这次计算的结果。
          return 0
        }
      }
    }),
  )

  // cleanedCount 数量封装成回调，供共享工具 permission Sync在事件触发或异步步骤中调用。
  const cleanedCount = cleanupResults.reduce<number>((sum, n) => sum + n, 0)

  // 满足 `cleanedCount > 0` 时，共享工具执行该分支。
  if (cleanedCount > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Cleaned up ${cleanedCount} old resolutions`,
    )
  }

  // 返回 `cleanedCount`，作为共享工具这次计算的结果。
  return cleanedCount
}

/**
 * Legacy response type for worker polling
 * Used for backward compatibility with worker integration code
 */
// PermissionResponse 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionResponse = {
  /** ID of the request this responds to */
  requestId: string
  /** Decision: approved or denied */
  decision: 'approved' | 'denied'
  /** Timestamp when response was created */
  timestamp: string
  /** Optional feedback message if denied */
  feedback?: string
  /** Optional updated input if the resolver modified it */
  updatedInput?: Record<string, unknown>
  /** Permission updates to apply (e.g., "always allow" rules) */
  permissionUpdates?: unknown[]
}

/**
 * Poll for a permission response (worker-side convenience function)
 * Converts the resolved request into a simpler response format
 *
 * @returns The permission response, or null if not yet resolved
 */
// pollForResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pollForResponse(
  requestId: string,
  _agentName?: string,
  teamName?: string,
): Promise<PermissionResponse | null> {
  // resolved读取`readResolvedPermission`，供共享工具后续处理使用。
  const resolved = await readResolvedPermission(requestId, teamName)
  // resolved缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!resolved) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    requestId: resolved.id,
    decision: resolved.status === 'approved' ? 'approved' : 'denied',
    timestamp: resolved.resolvedAt
      ? new Date(resolved.resolvedAt).toISOString()
      : new Date(resolved.createdAt).toISOString(),
    feedback: resolved.feedback,
    updatedInput: resolved.updatedInput,
    permissionUpdates: resolved.permissionUpdates,
  }
}

/**
 * Remove a worker's response after processing
 * This is an alias for deleteResolvedPermission for backward compatibility
 */
// removeWorkerResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeWorkerResponse(
  requestId: string,
  _agentName?: string,
  teamName?: string,
): Promise<void> {
  // 等待 `deleteResolvedPermission(requestId, teamName)` 完成，再继续共享工具 permission Sync的异步流程。
  await deleteResolvedPermission(requestId, teamName)
}

/**
 * Check if the current agent is a team leader
 */
// isTeamLeader 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamLeader(teamName?: string): boolean {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Team leaders don't have an agent ID set, or their ID is 'team-lead'
  // agentId读取`getAgentId`，供共享工具后续处理使用。
  const agentId = getAgentId()

  // 返回 `!agentId || agentId === 'team-lead'`，作为共享工具这次计算的结果。
  return !agentId || agentId === 'team-lead'
}

/**
 * Check if the current agent is a worker in a swarm
 */
// isSwarmWorker 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSwarmWorker(): boolean {
  // teamName读取`getTeamName`，供共享工具后续处理使用。
  const teamName = getTeamName()
  // agentId读取`getAgentId`，供共享工具后续处理使用。
  const agentId = getAgentId()

  // 返回 `!!teamName && !!agentId && !isTeamLeader()`，作为共享工具这次计算的结果。
  return !!teamName && !!agentId && !isTeamLeader()
}

/**
 * Delete a resolved permission file
 * Called after a worker has processed the resolution
 */
// deleteResolvedPermission 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function deleteResolvedPermission(
  requestId: string,
  teamName?: string,
): Promise<boolean> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // resolvedPath 路径数据读取`getResolvedRequestPath`，供共享工具后续处理使用。
  const resolvedPath = getResolvedRequestPath(team, requestId)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(resolvedPath)` 完成，再继续共享工具 permission Sync的异步流程。
    await unlink(resolvedPath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Deleted resolved permission: ${requestId}`,
    )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Failed to delete resolved permission: ${e}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Submit a permission request (alias for writePermissionRequest)
 * Provided for backward compatibility with worker integration code
 */
// submitPermissionRequest 权限数据 命名 `writePermissionRequest`，让后续代码直接表达这个值的用途。
export const submitPermissionRequest = writePermissionRequest

// ============================================================================
// Mailbox-Based Permission System
// ============================================================================

/**
 * Get the leader's name from the team file
 * This is needed to send permission requests to the leader's mailbox
 */
// getLeaderName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLeaderName(teamName?: string): Promise<string | null> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // teamFile 文件数据读取`readTeamFileAsync`，供共享工具后续处理使用。
  const teamFile = await readTeamFileAsync(team)
  // teamFile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamFile) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[PermissionSync] Team file not found for team: ${team}`)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // leadMember筛选`members.find`，供共享工具后续处理使用。
  const leadMember = teamFile.members.find(
    // m更新为 `> m.agentId === teamFile.leadAgentId`，确保共享工具后续读取最新状态。
    m => m.agentId === teamFile.leadAgentId,
  )
  // 返回 `leadMember?.name || 'team-lead'`，作为共享工具这次计算的结果。
  return leadMember?.name || 'team-lead'
}

/**
 * Send a permission request to the leader via mailbox.
 * This is the new mailbox-based approach that replaces the file-based pending directory.
 *
 * @param request - The permission request to send
 * @returns true if the message was sent successfully
 */
// sendPermissionRequestViaMailbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendPermissionRequestViaMailbox(
  request: SwarmPermissionRequest,
): Promise<boolean> {
  // leaderName读取`getLeaderName`，供共享工具后续处理使用。
  const leaderName = await getLeaderName(request.teamName)
  // leaderName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!leaderName) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Cannot send permission request: leader name not found`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Create the permission request message
    // 消息构建`createPermissionRequestMessage`，供共享工具后续处理使用。
    const message = createPermissionRequestMessage({
      request_id: request.id,
      agent_id: request.workerName,
      tool_name: request.toolName,
      tool_use_id: request.toolUseId,
      description: request.description,
      input: request.input,
      permission_suggestions: request.permissionSuggestions,
    })

    // Send to leader's mailbox (routes to in-process or file-based based on recipient)
    // 等待 `writeToMailbox(` 完成，再继续共享工具 permission Sync的异步流程。
    await writeToMailbox(
      leaderName,
      {
        from: request.workerName,
        text: jsonStringify(message),
        timestamp: new Date().toISOString(),
        color: request.workerColor,
      },
      request.teamName,
    )

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Sent permission request ${request.id} to leader ${leaderName} via mailbox`,
    )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Failed to send permission request via mailbox: ${error}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Send a permission response to a worker via mailbox.
 * This is the new mailbox-based approach that replaces the file-based resolved directory.
 *
 * @param workerName - The worker's name to send the response to
 * @param resolution - The permission resolution
 * @param requestId - The original request ID
 * @param teamName - The team name
 * @returns true if the message was sent successfully
 */
// sendPermissionResponseViaMailbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendPermissionResponseViaMailbox(
  workerName: string,
  resolution: PermissionResolution,
  requestId: string,
  teamName?: string,
): Promise<boolean> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Cannot send permission response: team name not found`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Create the permission response message
    // 消息构建`createPermissionResponseMessage`，供共享工具后续处理使用。
    const message = createPermissionResponseMessage({
      request_id: requestId,
      subtype: resolution.decision === 'approved' ? 'success' : 'error',
      error: resolution.feedback,
      updated_input: resolution.updatedInput,
      permission_updates: resolution.permissionUpdates,
    })

    // Get the sender name (leader's name)
    // senderName读取`getAgentName`，供共享工具后续处理使用。
    const senderName = getAgentName() || 'team-lead'

    // Send to worker's mailbox (routes to in-process or file-based based on recipient)
    // 等待 `writeToMailbox(` 完成，再继续共享工具 permission Sync的异步流程。
    await writeToMailbox(
      workerName,
      {
        from: senderName,
        text: jsonStringify(message),
        timestamp: new Date().toISOString(),
      },
      team,
    )

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Sent permission response for ${requestId} to worker ${workerName} via mailbox`,
    )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Failed to send permission response via mailbox: ${error}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// ============================================================================
// Sandbox Permission Mailbox System
// ============================================================================

/**
 * Generate a unique sandbox permission request ID
 */
// generateSandboxRequestId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateSandboxRequestId(): string {
  // 返回 ``sandbox-${Date.now()}-${Math.random().toString(36).substring(2, 9)}``，作为共享工具这次计算的结果。
  return `sandbox-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Send a sandbox permission request to the leader via mailbox.
 * Called by workers when sandbox runtime needs network access approval.
 *
 * @param host - The host requesting network access
 * @param requestId - Unique ID for this request
 * @param teamName - Optional team name
 * @returns true if the message was sent successfully
 */
// sendSandboxPermissionRequestViaMailbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendSandboxPermissionRequestViaMailbox(
  host: string,
  requestId: string,
  teamName?: string,
): Promise<boolean> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Cannot send sandbox permission request: team name not found`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // leaderName读取`getLeaderName`，供共享工具后续处理使用。
  const leaderName = await getLeaderName(team)
  // leaderName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!leaderName) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Cannot send sandbox permission request: leader name not found`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // workerId读取`getAgentId`，供共享工具后续处理使用。
  const workerId = getAgentId()
  // workerName读取`getAgentName`，供共享工具后续处理使用。
  const workerName = getAgentName()
  // workerColor读取`getTeammateColor`，供共享工具后续处理使用。
  const workerColor = getTeammateColor()

  // 只有 `!workerId || !workerName` 满足时，共享工具才执行该分支。
  if (!workerId || !workerName) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Cannot send sandbox permission request: worker ID or name not found`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 消息构建`createSandboxPermissionRequestMessage`，供共享工具后续处理使用。
    const message = createSandboxPermissionRequestMessage({
      requestId,
      workerId,
      workerName,
      workerColor,
      host,
    })

    // Send to leader's mailbox (routes to in-process or file-based based on recipient)
    // 等待 `writeToMailbox(` 完成，再继续共享工具 permission Sync的异步流程。
    await writeToMailbox(
      leaderName,
      {
        from: workerName,
        text: jsonStringify(message),
        timestamp: new Date().toISOString(),
        color: workerColor,
      },
      team,
    )

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Sent sandbox permission request ${requestId} for host ${host} to leader ${leaderName} via mailbox`,
    )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Failed to send sandbox permission request via mailbox: ${error}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Send a sandbox permission response to a worker via mailbox.
 * Called by the leader when approving/denying a sandbox network access request.
 *
 * @param workerName - The worker's name to send the response to
 * @param requestId - The original request ID
 * @param host - The host that was approved/denied
 * @param allow - Whether the connection is allowed
 * @param teamName - Optional team name
 * @returns true if the message was sent successfully
 */
// sendSandboxPermissionResponseViaMailbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendSandboxPermissionResponseViaMailbox(
  workerName: string,
  requestId: string,
  host: string,
  allow: boolean,
  teamName?: string,
): Promise<boolean> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName()
  // team缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!team) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Cannot send sandbox permission response: team name not found`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 消息构建`createSandboxPermissionResponseMessage`，供共享工具后续处理使用。
    const message = createSandboxPermissionResponseMessage({
      requestId,
      host,
      allow,
    })

    // senderName读取`getAgentName`，供共享工具后续处理使用。
    const senderName = getAgentName() || 'team-lead'

    // Send to worker's mailbox (routes to in-process or file-based based on recipient)
    // 等待 `writeToMailbox(` 完成，再继续共享工具 permission Sync的异步流程。
    await writeToMailbox(
      workerName,
      {
        from: senderName,
        text: jsonStringify(message),
        timestamp: new Date().toISOString(),
      },
      team,
    )

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Sent sandbox permission response for ${requestId} (host: ${host}, allow: ${allow}) to worker ${workerName} via mailbox`,
    )
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[PermissionSync] Failed to send sandbox permission response via mailbox: ${error}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

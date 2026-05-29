// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getIsNonInteractiveSession、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession, getSessionId } from '../bootstrap/state.js'
// 引入 uniq，将 ./array.js 中已经封装好的能力接到本文件流程里。
import { uniq } from './array.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir、getTeamsDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, getTeamsDir, isEnvTruthy } from './envUtils.js'
// 引入 errorMessage、getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode } from './errors.js'
// 引入 lazySchema，将 ./lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from './lazySchema.js'
// 引入 * as lockfile，将 ./lockfile.js 中已经封装好的能力接到本文件流程里。
import * as lockfile from './lockfile.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 createSignal，将 ./signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from './signal.js'
// 引入 jsonParse、jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from './slowOperations.js'
// 引入 getTeamName，将 ./teammate.js 中已经封装好的能力接到本文件流程里。
import { getTeamName } from './teammate.js'
// 引入 getTeammateContext，将 ./teammateContext.js 中已经封装好的能力接到本文件流程里。
import { getTeammateContext } from './teammateContext.js'

// Listeners for task list updates (used for immediate UI refresh in same process)
// tasksUpdated构建`createSignal`，供共享工具后续处理使用。
const tasksUpdated = createSignal()

/**
 * Team name set by the leader when creating a team.
 * Used by getTaskListId() so the leader's tasks are stored under the team name
 * (matching where tmux/iTerm2 teammates look), not under the session ID.
 */
// leaderTeamName 先占位，稍后的条件分支会根据实际输入补齐它。
let leaderTeamName: string | undefined

/**
 * Sets the leader's team name for task list resolution.
 * Called by TeamCreateTool when a team is created.
 */
// setLeaderTeamName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLeaderTeamName(teamName: string): void {
  // 满足 `leaderTeamName === teamName` 时，共享工具执行该分支。
  if (leaderTeamName === teamName) return
  // leaderTeamName更新为 `teamName`，确保共享工具后续读取最新状态。
  leaderTeamName = teamName
  // Changing the task list ID is a "tasks updated" event for subscribers —
  // they're now looking at a different directory.
  // 调用 notifyTasksUpdated，触发共享工具此处需要的副作用。
  notifyTasksUpdated()
}

/**
 * Clears the leader's team name.
 * Called when a team is deleted.
 */
// clearLeaderTeamName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearLeaderTeamName(): void {
  // 满足 `leaderTeamName === undefined` 时，共享工具执行该分支。
  if (leaderTeamName === undefined) return
  // leaderTeamName更新为 `undefined`，确保共享工具后续读取最新状态。
  leaderTeamName = undefined
  // 调用 notifyTasksUpdated，触发共享工具此处需要的副作用。
  notifyTasksUpdated()
}

/**
 * Register a listener to be called when tasks are updated in this process.
 * Returns an unsubscribe function.
 */
// onTasksUpdated保存`tasksUpdated.subscribe`，供后续判断或组装使用。
export const onTasksUpdated = tasksUpdated.subscribe

/**
 * Notify listeners that tasks have been updated.
 * Called internally after createTask, updateTask, etc.
 * Wraps emit in try/catch so listener failures never propagate to callers
 * (task mutations must succeed from the caller's perspective).
 */
// notifyTasksUpdated 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifyTasksUpdated(): void {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 tasksUpdated.emit，触发共享工具此处需要的副作用。
    tasksUpdated.emit()
  } catch {
    // Ignore listener errors — task mutations must not fail due to notification issues
  }
}

// TASK_STATUSES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const

// TaskStatusSchema保存`lazySchema`，供共享工具后续处理使用。
export const TaskStatusSchema = lazySchema(() =>
  z.enum(['pending', 'in_progress', 'completed']),
)
// TaskStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskStatus = z.infer<ReturnType<typeof TaskStatusSchema>>

// TaskSchema保存`lazySchema`，供共享工具后续处理使用。
export const TaskSchema = lazySchema(() =>
  z.object({
    id: z.string(),
    subject: z.string(),
    description: z.string(),
    activeForm: z.string().optional(), // present continuous form for spinner (e.g., "Running tests")
    owner: z.string().optional(), // agent ID
    status: TaskStatusSchema(),
    blocks: z.array(z.string()), // task IDs this task blocks
    blockedBy: z.array(z.string()), // task IDs that block this task
    metadata: z.record(z.string(), z.unknown()).optional(), // arbitrary metadata
  }),
)
// Task 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Task = z.infer<ReturnType<typeof TaskSchema>>

// High water mark file name - stores the maximum task ID ever assigned
// HIGH_WATER_MARK_FILE 文件数据 命名 `'.highwatermark'`，让后续代码直接表达这个值的用途。
const HIGH_WATER_MARK_FILE = '.highwatermark'

// Lock options: retry with backoff so concurrent callers (multiple Claudes
// in a swarm) wait for the lock instead of failing immediately. The sync
// lockSync API blocked the event loop; the async API needs explicit retries
// to achieve the same serialization semantics.
//
// Budget sized for ~10+ concurrent swarm agents: each critical section does
// readdir + N×readFile + writeFile (~50-100ms on slow disks), so the last
// caller in a 10-way race needs ~900ms. retries=30 gives ~2.6s total wait.
// LOCK_OPTIONS 集合集中保存共享工具 tasks要一起传递的字段。
const LOCK_OPTIONS = {
  retries: {
    retries: 30,
    minTimeout: 5,
    maxTimeout: 100,
  },
}

// getHighWaterMarkPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHighWaterMarkPath(taskListId: string): string {
  // 返回 `join(getTasksDir(taskListId), HIGH_WATER_MARK_FILE)`，作为共享工具这次计算的结果。
  return join(getTasksDir(taskListId), HIGH_WATER_MARK_FILE)
}

// readHighWaterMark 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readHighWaterMark(taskListId: string): Promise<number> {
  // 路径读取`getHighWaterMarkPath`，供共享工具后续处理使用。
  const path = getHighWaterMarkPath(taskListId)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = (await readFile(path, 'utf-8')).trim()
    // 取值解析`parseInt`，供共享工具后续处理使用。
    const value = parseInt(content, 10)
    // 返回 `isNaN(value) ? 0 : value`，作为共享工具这次计算的结果。
    return isNaN(value) ? 0 : value
  } catch {
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }
}

// writeHighWaterMark 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeHighWaterMark(
  taskListId: string,
  value: number,
): Promise<void> {
  // 路径读取`getHighWaterMarkPath`，供共享工具后续处理使用。
  const path = getHighWaterMarkPath(taskListId)
  // 等待 `writeFile(path, String(value))` 完成，再继续共享工具 tasks的异步流程。
  await writeFile(path, String(value))
}

// isTodoV2Enabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTodoV2Enabled(): boolean {
  // Force-enable tasks in non-interactive mode (e.g. SDK users who want Task tools over TodoWrite)
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_TASKS)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_TASKS)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 `!getIsNonInteractiveSession()`，作为共享工具这次计算的结果。
  return !getIsNonInteractiveSession()
}

/**
 * Resets the task list for a new swarm - clears any existing tasks.
 * Writes a high water mark file to prevent ID reuse after reset.
 * Should be called when a new swarm is created to ensure task numbering starts at 1.
 * Uses file locking to prevent race conditions when multiple Claudes run in parallel.
 */
// resetTaskList 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resetTaskList(taskListId: string): Promise<void> {
  // dir读取`getTasksDir`，供共享工具后续处理使用。
  const dir = getTasksDir(taskListId)
  // lockPath 路径数据保存`ensureTaskListLockFile`，供共享工具后续处理使用。
  const lockPath = await ensureTaskListLockFile(taskListId)

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Acquire exclusive lock on the task list
    // release更新为 `await lockfile.lock(lockPath, LOCK_OPTIONS)`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(lockPath, LOCK_OPTIONS)

    // Find the current highest ID and save it to the high water mark file
    // currentHighest筛选`findHighestTaskIdFromFiles`，供共享工具后续处理使用。
    const currentHighest = await findHighestTaskIdFromFiles(taskListId)
    // 满足 `currentHighest > 0` 时，共享工具执行该分支。
    if (currentHighest > 0) {
      // existingMark读取`readHighWaterMark`，供共享工具后续处理使用。
      const existingMark = await readHighWaterMark(taskListId)
      // 满足 `currentHighest > existingMark` 时，共享工具执行该分支。
      if (currentHighest > existingMark) {
        // 等待 `writeHighWaterMark(taskListId, currentHighest)` 完成，再继续共享工具 tasks的异步流程。
        await writeHighWaterMark(taskListId, currentHighest)
      }
    }

    // Delete all task files
    // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let files: string[]
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // files 文件数据更新为 `await readdir(dir)`，确保共享工具后续读取最新状态。
      files = await readdir(dir)
    } catch {
      // files 文件数据更新为 `[]`，确保共享工具后续读取最新状态。
      files = []
    }
    // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
    for (const file of files) {
      // 只有 `file.endsWith('.json') && !file.startsWith('.')` 满足时，共享工具才执行该分支。
      if (file.endsWith('.json') && !file.startsWith('.')) {
        // 文件路径格式化`join`，供共享工具后续处理使用。
        const filePath = join(dir, file)
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `unlink(filePath)` 完成，再继续共享工具 tasks的异步流程。
          await unlink(filePath)
        } catch {
          // Ignore errors, file may already be deleted
        }
      }
    }
    // 调用 notifyTasksUpdated，触发共享工具此处需要的副作用。
    notifyTasksUpdated()
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 tasks的异步流程。
      await release()
    }
  }
}

/**
 * Gets the task list ID based on the current context.
 * Priority:
 * 1. CLAUDE_CODE_TASK_LIST_ID - explicit task list ID
 * 2. In-process teammate: leader's team name (so teammates share the leader's task list)
 * 3. CLAUDE_CODE_TEAM_NAME - set when running as a process-based teammate
 * 4. Leader team name - set when the leader creates a team via TeamCreate
 * 5. Session ID - fallback for standalone sessions
 */
// getTaskListId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTaskListId(): string {
  // 满足 `process.env.CLAUDE_CODE_TASK_LIST_ID` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_TASK_LIST_ID) {
    // 返回 `process.env.CLAUDE_CODE_TASK_LIST_ID`，作为共享工具这次计算的结果。
    return process.env.CLAUDE_CODE_TASK_LIST_ID
  }
  // In-process teammates use the leader's team name so they share the same
  // task list that tmux/iTerm2 teammates also resolve to.
  // teammateCtx读取`getTeammateContext`，供共享工具后续处理使用。
  const teammateCtx = getTeammateContext()
  // 满足 `teammateCtx` 时，共享工具执行该分支。
  if (teammateCtx) {
    // 返回 `teammateCtx.teamName`，作为共享工具这次计算的结果。
    return teammateCtx.teamName
  }
  // 返回 `getTeamName() || leaderTeamName || getSessionId()`，作为共享工具这次计算的结果。
  return getTeamName() || leaderTeamName || getSessionId()
}

/**
 * Sanitizes a string for safe use in file paths.
 * Removes path traversal characters and other potentially dangerous characters.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
// sanitizePathComponent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizePathComponent(input: string): string {
  // 返回 `input.replace(/[^a-zA-Z0-9_-]/g, '-')`，作为共享工具这次计算的结果。
  return input.replace(/[^a-zA-Z0-9_-]/g, '-')
}

// getTasksDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTasksDir(taskListId: string): string {
  // 返回 `join(`，作为共享工具这次计算的结果。
  return join(
    getClaudeConfigHomeDir(),
    'tasks',
    sanitizePathComponent(taskListId),
  )
}

// getTaskPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTaskPath(taskListId: string, taskId: string): string {
  // 返回 `join(getTasksDir(taskListId), `${sanitizePathComponent(taskId)}.json`)`，作为共享工具这次计算的结果。
  return join(getTasksDir(taskListId), `${sanitizePathComponent(taskId)}.json`)
}

// ensureTasksDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureTasksDir(taskListId: string): Promise<void> {
  // dir读取`getTasksDir`，供共享工具后续处理使用。
  const dir = getTasksDir(taskListId)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(dir, { recursive: true })` 完成，再继续共享工具 tasks的异步流程。
    await mkdir(dir, { recursive: true })
  } catch {
    // Directory already exists or creation failed; callers will surface
    // errors from subsequent operations.
  }
}

/**
 * Finds the highest task ID from existing task files (not including high water mark).
 */
// findHighestTaskIdFromFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function findHighestTaskIdFromFiles(taskListId: string): Promise<number> {
  // dir读取`getTasksDir`，供共享工具后续处理使用。
  const dir = getTasksDir(taskListId)
  // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let files: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据更新为 `await readdir(dir)`，确保共享工具后续读取最新状态。
    files = await readdir(dir)
  } catch {
    // 返回 `0`，作为共享工具这次计算的结果。
    return 0
  }
  // highest保存`0`，供后续判断或组装使用。
  let highest = 0
  // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
  for (const file of files) {
    // 满足 `!file.endsWith('.json')` 时，共享工具执行该分支。
    if (!file.endsWith('.json')) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // taskId解析`parseInt`，供共享工具后续处理使用。
    const taskId = parseInt(file.replace('.json', ''), 10)
    // 只有 `!isNaN(taskId) && taskId > highest` 满足时，共享工具才执行该分支。
    if (!isNaN(taskId) && taskId > highest) {
      // highest更新为 `taskId`，确保共享工具后续读取最新状态。
      highest = taskId
    }
  }
  // 返回 `highest`，作为共享工具这次计算的结果。
  return highest
}

/**
 * Finds the highest task ID ever assigned, considering both existing files
 * and the high water mark (for deleted/reset tasks).
 */
// findHighestTaskId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function findHighestTaskId(taskListId: string): Promise<number> {
  // 并行获取 fromFiles、fromMark，缩短共享工具 tasks等待多个独立异步任务的时间。
  const [fromFiles, fromMark] = await Promise.all([
    findHighestTaskIdFromFiles(taskListId),
    readHighWaterMark(taskListId),
  ])
  // 返回 `Math.max(fromFiles, fromMark)`，作为共享工具这次计算的结果。
  return Math.max(fromFiles, fromMark)
}

/**
 * Creates a new task with a unique ID.
 * Uses file locking to prevent race conditions when multiple processes
 * create tasks concurrently.
 */
// createTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createTask(
  taskListId: string,
  taskData: Omit<Task, 'id'>,
): Promise<string> {
  // lockPath 路径数据保存`ensureTaskListLockFile`，供共享工具后续处理使用。
  const lockPath = await ensureTaskListLockFile(taskListId)

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Acquire exclusive lock on the task list
    // release更新为 `await lockfile.lock(lockPath, LOCK_OPTIONS)`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(lockPath, LOCK_OPTIONS)

    // Read highest ID from disk while holding the lock
    // highestId筛选`findHighestTaskId`，供共享工具后续处理使用。
    const highestId = await findHighestTaskId(taskListId)
    // 标识符保存`String`，供共享工具后续处理使用。
    const id = String(highestId + 1)
    // task 集中保存共享工具 tasks要一起传递的字段。
    const task: Task = { id, ...taskData }
    // 路径读取`getTaskPath`，供共享工具后续处理使用。
    const path = getTaskPath(taskListId, id)
    // 等待 `writeFile(path, jsonStringify(task, null, 2))` 完成，再继续共享工具 tasks的异步流程。
    await writeFile(path, jsonStringify(task, null, 2))
    // 调用 notifyTasksUpdated，触发共享工具此处需要的副作用。
    notifyTasksUpdated()
    // 返回 `id`，作为共享工具这次计算的结果。
    return id
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 tasks的异步流程。
      await release()
    }
  }
}

// getTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTask(
  taskListId: string,
  taskId: string,
): Promise<Task | null> {
  // 路径读取`getTaskPath`，供共享工具后续处理使用。
  const path = getTaskPath(taskListId, taskId)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = await readFile(path, 'utf-8')
    // data解析`jsonParse`，供共享工具后续处理使用。
    const data = jsonParse(content) as { status?: string }

    // TEMPORARY: Migrate old status names for existing sessions (ant-only)
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 当 `data.status` 匹配 `'open'` 时，共享工具执行对应分支。
      if (data.status === 'open') data.status = 'pending'
      else if (data.status === 'resolved') data.status = 'completed'
      // Migrate development task statuses to in_progress
      else if (
        data.status &&
        ['planning', 'implementing', 'reviewing', 'verifying'].includes(
          data.status,
        )
      ) {
        // status 集合更新为 `'in_progress'`，确保共享工具后续读取最新状态。
        data.status = 'in_progress'
      }
    }
    // 解析结果保存`TaskSchema`，供共享工具后续处理使用。
    const parsed = TaskSchema().safeParse(data)
    // parsed.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!parsed.success) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[Tasks] Task ${taskId} failed schema validation: ${parsed.error.message}`,
      )
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回 `parsed.data`，作为共享工具这次计算的结果。
    return parsed.data
  } catch (e) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[Tasks] Failed to read task ${taskId}: ${errorMessage(e)}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// Internal: no lock. Callers already holding a lock on taskPath must use this
// to avoid deadlock (claimTask, deleteTask cascade, etc.).
// updateTaskUnsafe 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function updateTaskUnsafe(
  taskListId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id'>>,
): Promise<Task | null> {
  // existing读取`getTask`，供共享工具后续处理使用。
  const existing = await getTask(taskListId, taskId)
  // existing缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!existing) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // updated 集中保存共享工具 tasks要一起传递的字段。
  const updated: Task = { ...existing, ...updates, id: taskId }
  // 路径读取`getTaskPath`，供共享工具后续处理使用。
  const path = getTaskPath(taskListId, taskId)
  // 等待 `writeFile(path, jsonStringify(updated, null, 2))` 完成，再继续共享工具 tasks的异步流程。
  await writeFile(path, jsonStringify(updated, null, 2))
  // 调用 notifyTasksUpdated，触发共享工具此处需要的副作用。
  notifyTasksUpdated()
  // 返回 `updated`，作为共享工具这次计算的结果。
  return updated
}

// updateTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updateTask(
  taskListId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id'>>,
): Promise<Task | null> {
  // 路径读取`getTaskPath`，供共享工具后续处理使用。
  const path = getTaskPath(taskListId, taskId)

  // Check existence before locking — proper-lockfile throws if the
  // target file doesn't exist, and we want a clean null result.
  // taskBeforeLock读取`getTask`，供共享工具后续处理使用。
  const taskBeforeLock = await getTask(taskListId, taskId)
  // taskBeforeLock缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!taskBeforeLock) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // release更新为 `await lockfile.lock(path, LOCK_OPTIONS)`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(path, LOCK_OPTIONS)
    // 等待并返回 `updateTaskUnsafe(taskListId, taskId, updates)`，调用方直接接收异步结果。
    return await updateTaskUnsafe(taskListId, taskId, updates)
  } finally {
    // 等待 `release?.()` 完成，再继续共享工具 tasks的异步流程。
    await release?.()
  }
}

// deleteTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function deleteTask(
  taskListId: string,
  taskId: string,
): Promise<boolean> {
  // 路径读取`getTaskPath`，供共享工具后续处理使用。
  const path = getTaskPath(taskListId, taskId)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Update high water mark before deleting to prevent ID reuse
    // numericId解析`parseInt`，供共享工具后续处理使用。
    const numericId = parseInt(taskId, 10)
    // 满足 `!isNaN(numericId)` 时，共享工具执行该分支。
    if (!isNaN(numericId)) {
      // currentMark读取`readHighWaterMark`，供共享工具后续处理使用。
      const currentMark = await readHighWaterMark(taskListId)
      // 满足 `numericId > currentMark` 时，共享工具执行该分支。
      if (numericId > currentMark) {
        // 等待 `writeHighWaterMark(taskListId, numericId)` 完成，再继续共享工具 tasks的异步流程。
        await writeHighWaterMark(taskListId, numericId)
      }
    }

    // Delete the task file
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(path)` 完成，再继续共享工具 tasks的异步流程。
      await unlink(path)
    } catch (e) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(e)
      // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
      if (code === 'ENOENT') {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 抛出 e，阻止共享工具在无效状态下继续运行。
      throw e
    }

    // Remove references to this task from other tasks
    // allTasks 集合保存`listTasks`，供共享工具后续处理使用。
    const allTasks = await listTasks(taskListId)
    // 按顺序遍历 `allTasks` 中的task，逐个交给共享工具处理。
    for (const task of allTasks) {
      // newBlocks 集合筛选`blocks.filter`，供共享工具后续处理使用。
      const newBlocks = task.blocks.filter(id => id !== taskId)
      // newBlockedBy筛选`blockedBy.filter`，供共享工具后续处理使用。
      const newBlockedBy = task.blockedBy.filter(id => id !== taskId)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        newBlocks.length !== task.blocks.length ||
        newBlockedBy.length !== task.blockedBy.length
      ) {
        // 等待 `updateTask(taskListId, task.id, {` 完成，再继续共享工具 tasks的异步流程。
        await updateTask(taskListId, task.id, {
          blocks: newBlocks,
          blockedBy: newBlockedBy,
        })
      }
    }

    // 调用 notifyTasksUpdated，触发共享工具此处需要的副作用。
    notifyTasksUpdated()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// listTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function listTasks(taskListId: string): Promise<Task[]> {
  // dir读取`getTasksDir`，供共享工具后续处理使用。
  const dir = getTasksDir(taskListId)
  // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let files: string[]
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据更新为 `await readdir(dir)`，确保共享工具后续读取最新状态。
    files = await readdir(dir)
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // taskIds 集合保存`files`，供共享工具 tasks后续判断或输出使用。
  const taskIds = files
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(f => f.endsWith('.json'))
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(f => f.replace('.json', ''))
  // 结果列表保存`Promise.all`，供共享工具后续处理使用。
  const results = await Promise.all(taskIds.map(id => getTask(taskListId, id)))
  // 返回 `results.filter((t): t is Task => t !== null)`，作为共享工具这次计算的结果。
  return results.filter((t): t is Task => t !== null)
}

// blockTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function blockTask(
  taskListId: string,
  fromTaskId: string,
  toTaskId: string,
): Promise<boolean> {
  // 并行获取 fromTask、toTask，缩短共享工具 tasks等待多个独立异步任务的时间。
  const [fromTask, toTask] = await Promise.all([
    getTask(taskListId, fromTaskId),
    getTask(taskListId, toTaskId),
  ])
  // 只有 `!fromTask || !toTask` 满足时，共享工具才执行该分支。
  if (!fromTask || !toTask) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Update source task: A blocks B
  // 满足 `!fromTask.blocks.includes(toTaskId)` 时，共享工具执行该分支。
  if (!fromTask.blocks.includes(toTaskId)) {
    // 等待 `updateTask(taskListId, fromTaskId, {` 完成，再继续共享工具 tasks的异步流程。
    await updateTask(taskListId, fromTaskId, {
      blocks: [...fromTask.blocks, toTaskId],
    })
  }

  // Update target task: B is blockedBy A
  // 满足 `!toTask.blockedBy.includes(fromTaskId)` 时，共享工具执行该分支。
  if (!toTask.blockedBy.includes(fromTaskId)) {
    // 等待 `updateTask(taskListId, toTaskId, {` 完成，再继续共享工具 tasks的异步流程。
    await updateTask(taskListId, toTaskId, {
      blockedBy: [...toTask.blockedBy, fromTaskId],
    })
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// ClaimTaskResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClaimTaskResult = {
  success: boolean
  reason?:
    | 'task_not_found'
    | 'already_claimed'
    | 'already_resolved'
    | 'blocked'
    | 'agent_busy'
  task?: Task
  busyWithTasks?: string[] // task IDs the agent is busy with (when reason is 'agent_busy')
  blockedByTasks?: string[] // task IDs blocking this task (when reason is 'blocked')
}

/**
 * Gets the lock file path for a task list (used for list-level locking)
 */
// getTaskListLockPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTaskListLockPath(taskListId: string): string {
  // 返回 `join(getTasksDir(taskListId), '.lock')`，作为共享工具这次计算的结果。
  return join(getTasksDir(taskListId), '.lock')
}

/**
 * Ensures the lock file exists for a task list
 */
// ensureTaskListLockFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function ensureTaskListLockFile(taskListId: string): Promise<string> {
  // 等待 `ensureTasksDir(taskListId)` 完成，再继续共享工具 tasks的异步流程。
  await ensureTasksDir(taskListId)
  // lockPath 路径数据读取`getTaskListLockPath`，供共享工具后续处理使用。
  const lockPath = getTaskListLockPath(taskListId)
  // proper-lockfile requires the target file to exist. Create it with the
  // 'wx' flag (write-exclusive) so concurrent callers don't both create it,
  // and the first one to create wins silently.
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(lockPath, '', { flag: 'wx' })` 完成，再继续共享工具 tasks的异步流程。
    await writeFile(lockPath, '', { flag: 'wx' })
  } catch {
    // EEXIST or other — file already exists, which is fine.
  }
  // 返回 `lockPath`，作为共享工具这次计算的结果。
  return lockPath
}

// ClaimTaskOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClaimTaskOptions = {
  /**
   * If true, checks whether the agent is already busy (owns other open tasks)
   * before allowing the claim. This check is performed atomically with the claim
   * using a task-list-level lock to prevent TOCTOU race conditions.
   */
  checkAgentBusy?: boolean
}

/**
 * Attempts to claim a task for an agent with file locking to prevent race conditions.
 * Returns success if the task was claimed, or a reason if it wasn't.
 *
 * When checkAgentBusy is true, uses a task-list-level lock to atomically check
 * if the agent owns any other open tasks before claiming.
 */
// claimTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function claimTask(
  taskListId: string,
  taskId: string,
  claimantAgentId: string,
  options: ClaimTaskOptions = {},
): Promise<ClaimTaskResult> {
  // taskPath 路径数据读取`getTaskPath`，供共享工具后续处理使用。
  const taskPath = getTaskPath(taskListId, taskId)

  // Check existence before locking — proper-lockfile.lock throws if the
  // target file doesn't exist, and we want a clean task_not_found result.
  // taskBeforeLock读取`getTask`，供共享工具后续处理使用。
  const taskBeforeLock = await getTask(taskListId, taskId)
  // taskBeforeLock缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!taskBeforeLock) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: false, reason: 'task_not_found' }
  }

  // If we need to check agent busy status, use task-list-level lock
  // to prevent TOCTOU race conditions
  // 满足 `options.checkAgentBusy` 时，共享工具执行该分支。
  if (options.checkAgentBusy) {
    // 返回 `claimTaskWithBusyCheck(taskListId, taskId, claimantAgentId)`，作为共享工具这次计算的结果。
    return claimTaskWithBusyCheck(taskListId, taskId, claimantAgentId)
  }

  // Otherwise, use task-level lock (original behavior)
  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Acquire exclusive lock on the task file
    // release更新为 `await lockfile.lock(taskPath, LOCK_OPTIONS)`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(taskPath, LOCK_OPTIONS)

    // Read current task state
    // task读取`getTask`，供共享工具后续处理使用。
    const task = await getTask(taskListId, taskId)
    // task缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!task) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, reason: 'task_not_found' }
    }

    // Check if already claimed by another agent
    // `task.owner && task.owner` 与 `claimantAgentId` 不一致时刷新派生状态，避免使用过期结果。
    if (task.owner && task.owner !== claimantAgentId) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, reason: 'already_claimed', task }
    }

    // Check if already resolved
    // 当 `task.status` 匹配 `'completed'` 时，共享工具执行对应分支。
    if (task.status === 'completed') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, reason: 'already_resolved', task }
    }

    // Check for unresolved blockers (open or in_progress tasks block)
    // allTasks 集合保存`listTasks`，供共享工具后续处理使用。
    const allTasks = await listTasks(taskListId)
    // unresolvedTaskIds 集合保存`Set`，供共享工具后续处理使用。
    const unresolvedTaskIds = new Set(
      // 调用 allTasks.filter，触发共享工具此处需要的副作用。
      allTasks.filter(t => t.status !== 'completed').map(t => t.id),
    )
    // blockedByTasks 集合筛选`blockedBy.filter`，供共享工具后续处理使用。
    const blockedByTasks = task.blockedBy.filter(id =>
      unresolvedTaskIds.has(id),
    )
    // 满足 `blockedByTasks.length > 0` 时，共享工具执行该分支。
    if (blockedByTasks.length > 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, reason: 'blocked', task, blockedByTasks }
    }

    // Claim the task (already holding taskPath lock — use unsafe variant)
    // updated保存`updateTaskUnsafe`，供共享工具后续处理使用。
    const updated = await updateTaskUnsafe(taskListId, taskId, {
      owner: claimantAgentId,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, task: updated! }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Tasks] Failed to claim task ${taskId}: ${errorMessage(error)}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: false, reason: 'task_not_found' }
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 tasks的异步流程。
      await release()
    }
  }
}

/**
 * Claims a task with an atomic check for agent busy status.
 * Uses a task-list-level lock to ensure the busy check and claim are atomic.
 */
// claimTaskWithBusyCheck 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function claimTaskWithBusyCheck(
  taskListId: string,
  taskId: string,
  claimantAgentId: string,
): Promise<ClaimTaskResult> {
  // lockPath 路径数据保存`ensureTaskListLockFile`，供共享工具后续处理使用。
  const lockPath = await ensureTaskListLockFile(taskListId)

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Acquire exclusive lock on the task list
    // release更新为 `await lockfile.lock(lockPath, LOCK_OPTIONS)`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(lockPath, LOCK_OPTIONS)

    // Read all tasks to check agent status and task state atomically
    // allTasks 集合保存`listTasks`，供共享工具后续处理使用。
    const allTasks = await listTasks(taskListId)

    // Find the task we want to claim
    // task筛选`allTasks.find`，供共享工具后续处理使用。
    const task = allTasks.find(t => t.id === taskId)
    // task缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!task) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, reason: 'task_not_found' }
    }

    // Check if already claimed by another agent
    // `task.owner && task.owner` 与 `claimantAgentId` 不一致时刷新派生状态，避免使用过期结果。
    if (task.owner && task.owner !== claimantAgentId) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, reason: 'already_claimed', task }
    }

    // Check if already resolved
    // 当 `task.status` 匹配 `'completed'` 时，共享工具执行对应分支。
    if (task.status === 'completed') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, reason: 'already_resolved', task }
    }

    // Check for unresolved blockers (open or in_progress tasks block)
    // unresolvedTaskIds 集合保存`Set`，供共享工具后续处理使用。
    const unresolvedTaskIds = new Set(
      // 调用 allTasks.filter，触发共享工具此处需要的副作用。
      allTasks.filter(t => t.status !== 'completed').map(t => t.id),
    )
    // blockedByTasks 集合筛选`blockedBy.filter`，供共享工具后续处理使用。
    const blockedByTasks = task.blockedBy.filter(id =>
      unresolvedTaskIds.has(id),
    )
    // 满足 `blockedByTasks.length > 0` 时，共享工具执行该分支。
    if (blockedByTasks.length > 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, reason: 'blocked', task, blockedByTasks }
    }

    // Check if agent is busy with other unresolved tasks
    // agentOpenTasks 集合筛选`allTasks.filter`，供共享工具后续处理使用。
    const agentOpenTasks = allTasks.filter(
      // t更新为 `>`，确保共享工具后续读取最新状态。
      t =>
        t.status !== 'completed' &&
        t.owner === claimantAgentId &&
        t.id !== taskId,
    )
    // 满足 `agentOpenTasks.length > 0` 时，共享工具执行该分支。
    if (agentOpenTasks.length > 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        reason: 'agent_busy',
        task,
        // 这个回调绑定到 busyWithTasks: agentOpenTasks.map(t => t.id),，负责共享工具在该局部场景下的响应。
        busyWithTasks: agentOpenTasks.map(t => t.id),
      }
    }

    // Claim the task
    // updated保存`updateTask`，供共享工具后续处理使用。
    const updated = await updateTask(taskListId, taskId, {
      owner: claimantAgentId,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, task: updated! }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Tasks] Failed to claim task ${taskId} with busy check: ${errorMessage(error)}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: false, reason: 'task_not_found' }
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 tasks的异步流程。
      await release()
    }
  }
}

/**
 * Team member info (subset of TeamFile member structure)
 */
// TeamMember 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeamMember = {
  agentId: string
  name: string
  agentType?: string
}

/**
 * Agent status based on task ownership
 */
// AgentStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentStatus = {
  agentId: string
  name: string
  agentType?: string
  status: 'idle' | 'busy'
  currentTasks: string[] // task IDs the agent owns
}

/**
 * Sanitizes a name for use in file paths
 */
// sanitizeName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeName(name: string): string {
  // 返回 `name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()`，作为共享工具这次计算的结果。
  return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
}

/**
 * Reads team members from the team file
 */
// readTeamMembers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readTeamMembers(
  teamName: string,
): Promise<{ leadAgentId: string; members: TeamMember[] } | null> {
  // teamsDir读取`getTeamsDir`，供共享工具后续处理使用。
  const teamsDir = getTeamsDir()
  // teamFilePath 路径数据格式化`join`，供共享工具后续处理使用。
  const teamFilePath = join(teamsDir, sanitizeName(teamName), 'config.json')
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = await readFile(teamFilePath, 'utf-8')
    // teamFile 文件数据解析`jsonParse`，供共享工具后续处理使用。
    const teamFile = jsonParse(content) as {
      leadAgentId: string
      members: TeamMember[]
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      leadAgentId: teamFile.leadAgentId,
      // 这个回调绑定到 members: teamFile.members.map(m => ({，负责共享工具在该局部场景下的响应。
      members: teamFile.members.map(m => ({
        agentId: m.agentId,
        name: m.name,
        agentType: m.agentType,
      })),
    }
  } catch (e) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Tasks] Failed to read team file for ${teamName}: ${errorMessage(e)}`,
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Gets the status of all agents in a team based on task ownership.
 * An agent is considered "idle" if they don't own any open tasks.
 * An agent is considered "busy" if they own at least one open task.
 *
 * @param teamName - The name of the team (also used as taskListId)
 * @returns Array of agent statuses, or null if team not found
 */
// getAgentStatuses 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAgentStatuses(
  teamName: string,
): Promise<AgentStatus[] | null> {
  // teamData读取`readTeamMembers`，供共享工具后续处理使用。
  const teamData = await readTeamMembers(teamName)
  // teamData缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!teamData) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // taskListId 集合保存`sanitizeName`，供共享工具后续处理使用。
  const taskListId = sanitizeName(teamName)
  // allTasks 集合保存`listTasks`，供共享工具后续处理使用。
  const allTasks = await listTasks(taskListId)

  // Get unresolved tasks grouped by owner (open or in_progress)
  // unresolvedTasksByOwner构建`new Map<string, string[]>()` 整理出中间结果，供共享工具 tasks后续步骤使用。
  const unresolvedTasksByOwner = new Map<string, string[]>()
  // 按顺序遍历 `allTasks` 中的task，逐个交给共享工具处理。
  for (const task of allTasks) {
    // `task.status` 与 `'completed' && task.owner` 不一致时刷新派生状态，避免使用过期结果。
    if (task.status !== 'completed' && task.owner) {
      // existing读取`unresolvedTasksByOwner.get`，供共享工具后续处理使用。
      const existing = unresolvedTasksByOwner.get(task.owner) || []
      // existing追加新条目，保持收集顺序与输入顺序一致。
      existing.push(task.id)
      // unresolvedTasksByOwner.set 写入新的状态值，使共享工具后续读取保持一致。
      unresolvedTasksByOwner.set(task.owner, existing)
    }
  }

  // Build status for each agent (leader is already in members)
  // 返回 `teamData.members.map(member => {`，作为共享工具这次计算的结果。
  return teamData.members.map(member => {
    // Check both name (new) and agentId (legacy) for backwards compatibility
    // tasksByName读取`unresolvedTasksByOwner.get`，供共享工具后续处理使用。
    const tasksByName = unresolvedTasksByOwner.get(member.name) || []
    // tasksById读取`unresolvedTasksByOwner.get`，供共享工具后续处理使用。
    const tasksById = unresolvedTasksByOwner.get(member.agentId) || []
    // currentTasks 集合保存`uniq`，供共享工具后续处理使用。
    const currentTasks = uniq([...tasksByName, ...tasksById])
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      agentId: member.agentId,
      name: member.name,
      agentType: member.agentType,
      status: currentTasks.length === 0 ? 'idle' : 'busy',
      currentTasks,
    }
  })
}

/**
 * Result of unassigning tasks from a teammate
 */
// UnassignTasksResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type UnassignTasksResult = {
  unassignedTasks: Array<{ id: string; subject: string }>
  notificationMessage: string
}

/**
 * Unassigns all open tasks from a teammate and builds a notification message.
 * Used when a teammate is killed or gracefully shuts down.
 *
 * @param teamName - The team/task list name
 * @param teammateId - The teammate's agent ID
 * @param teammateName - The teammate's display name
 * @param reason - How the teammate exited ('terminated' | 'shutdown')
 * @returns The unassigned tasks and a formatted notification message
 */
// unassignTeammateTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function unassignTeammateTasks(
  teamName: string,
  teammateId: string,
  teammateName: string,
  reason: 'terminated' | 'shutdown',
): Promise<UnassignTasksResult> {
  // tasks 集合保存`listTasks`，供共享工具后续处理使用。
  const tasks = await listTasks(teamName)
  // unresolvedAssignedTasks 集合筛选`tasks.filter`，供共享工具后续处理使用。
  const unresolvedAssignedTasks = tasks.filter(
    // t更新为 `>`，确保共享工具后续读取最新状态。
    t =>
      t.status !== 'completed' &&
      (t.owner === teammateId || t.owner === teammateName),
  )

  // Unassign each task and reset status to open
  // 按顺序遍历 `unresolvedAssignedTasks` 中的task，逐个交给共享工具处理。
  for (const task of unresolvedAssignedTasks) {
    // 等待 `updateTask(teamName, task.id, { owner: undefined, status: 'pending' })` 完成，再继续共享工具 tasks的异步流程。
    await updateTask(teamName, task.id, { owner: undefined, status: 'pending' })
  }

  // 满足 `unresolvedAssignedTasks.length > 0` 时，共享工具执行该分支。
  if (unresolvedAssignedTasks.length > 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Tasks] Unassigned ${unresolvedAssignedTasks.length} task(s) from ${teammateName}`,
    )
  }

  // Build notification message
  // actionVerb 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const actionVerb =
    reason === 'terminated' ? 'was terminated' : 'has shut down'
  // notificationMessage 消息数据固定为 ``${teammateName} ${actionVerb}.``，作为共享工具 tasks后续展示或比较的基准。
  let notificationMessage = `${teammateName} ${actionVerb}.`
  // 满足 `unresolvedAssignedTasks.length > 0` 时，共享工具执行该分支。
  if (unresolvedAssignedTasks.length > 0) {
    // taskList 集合 命名 `unresolvedAssignedTasks`，让后续代码直接表达这个值的用途。
    const taskList = unresolvedAssignedTasks
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(t => `#${t.id} "${t.subject}"`)
      .join(', ')
    // 共享工具 tasks在这里处理 `notificationMessage += ` ${unresolvedAssignedTasks.length} task(s) were...`，完成这一小步状态转换。
    notificationMessage += ` ${unresolvedAssignedTasks.length} task(s) were unassigned: ${taskList}. Use TaskList to check availability and TaskUpdate with owner to reassign them to idle teammates.`
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // 这个回调绑定到 unassignedTasks: unresolvedAssignedTasks.map(t => ({，负责共享工具在该局部场景下的响应。
    unassignedTasks: unresolvedAssignedTasks.map(t => ({
      id: t.id,
      subject: t.subject,
    })),
    notificationMessage,
  }
}

// DEFAULT_TASKS_MODE_TASK_LIST_ID 集合保存`'tasklist'`，作为后续固定文本处理的输入。
export const DEFAULT_TASKS_MODE_TASK_LIST_ID = 'tasklist'

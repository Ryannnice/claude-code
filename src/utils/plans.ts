// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { copyFile, writeFile } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, resolve, sep } from 'path'
// 类型依赖 { AgentId, SessionId } 来自 src/types/ids.js，用于校准共享工具的数据契约。
import type { AgentId, SessionId } from 'src/types/ids.js'
// 类型依赖 { LogOption } 来自 src/types/logs.js，用于校准共享工具的数据契约。
import type { LogOption } from 'src/types/logs.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  SystemFileSnapshotMessage,
  UserMessage,
} from 'src/types/message.js'
// 引入 getPlanSlugCache、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getPlanSlugCache, getSessionId } from '../bootstrap/state.js'
// 接入 EXIT_PLAN_MODE_V2_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EXIT_PLAN_MODE_V2_TOOL_NAME } from '../tools/ExitPlanModeTool/constants.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT } from './errors.js'
// 引入 getEnvironmentKind，将 ./filePersistence/outputsScanner.js 中已经封装好的能力接到本文件流程里。
import { getEnvironmentKind } from './filePersistence/outputsScanner.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getInitialSettings，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from './settings/settings.js'
// 引入 generateWordSlug，将 ./words.js 中已经封装好的能力接到本文件流程里。
import { generateWordSlug } from './words.js'

// MAX_SLUG_RETRIES 集合保存`10`，供共享工具 plans后续判断或输出使用。
const MAX_SLUG_RETRIES = 10

/**
 * Get or generate a word slug for the current session's plan.
 * The slug is generated lazily on first access and cached for the session.
 * If a plan file with the generated slug already exists, retries up to 10 times.
 */
// getPlanSlug 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPlanSlug(sessionId?: SessionId): string {
  // 标识符读取`getSessionId`，供共享工具后续处理使用。
  const id = sessionId ?? getSessionId()
  // cache 缓存读取`getPlanSlugCache`，供共享工具后续处理使用。
  const cache = getPlanSlugCache()
  // slug读取`cache.get`，供共享工具后续处理使用。
  let slug = cache.get(id)
  // slug缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!slug) {
    // plansDir读取`getPlansDirectory`，供共享工具后续处理使用。
    const plansDir = getPlansDirectory()
    // Try to find a unique slug that doesn't conflict with existing files
    // 按索引扫描 `MAX_SLUG_RETRIES`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < MAX_SLUG_RETRIES; i++) {
      // slug更新为 `generateWordSlug()`，确保共享工具后续读取最新状态。
      slug = generateWordSlug()
      // 文件路径格式化`join`，供共享工具后续处理使用。
      const filePath = join(plansDir, `${slug}.md`)
      // 满足 `!getFsImplementation().existsSync(filePath)` 时，共享工具执行该分支。
      if (!getFsImplementation().existsSync(filePath)) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
    // cache.set 写入新的状态值，使共享工具后续读取保持一致。
    cache.set(id, slug!)
  }
  // 返回 `slug!`，作为共享工具这次计算的结果。
  return slug!
}

/**
 * Set a specific plan slug for a session (used when resuming a session)
 */
// setPlanSlug 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setPlanSlug(sessionId: SessionId, slug: string): void {
  // 调用 getPlanSlugCache，触发共享工具此处需要的副作用。
  getPlanSlugCache().set(sessionId, slug)
}

/**
 * Clear the plan slug for the current session.
 * This should be called on /clear to ensure a fresh plan file is used.
 */
// clearPlanSlug 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPlanSlug(sessionId?: SessionId): void {
  // 标识符读取`getSessionId`，供共享工具后续处理使用。
  const id = sessionId ?? getSessionId()
  // 调用 getPlanSlugCache，触发共享工具此处需要的副作用。
  getPlanSlugCache().delete(id)
}

/**
 * Clear ALL plan slug entries (all sessions).
 * Use this on /clear to free sub-session slug entries.
 */
// clearAllPlanSlugs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllPlanSlugs(): void {
  // 调用 getPlanSlugCache，触发共享工具此处需要的副作用。
  getPlanSlugCache().clear()
}

// Memoized: called from render bodies (FileReadTool/FileEditTool/FileWriteTool UI.tsx)
// and permission checks. Inputs (initial settings + cwd) are fixed at startup, so the
// mkdirSync result is stable for the session. Without memoization, each rendered tool
// message triggers a mkdirSync syscall (regressed in #20005).
// getPlansDirectory保存`memoize`，供共享工具后续处理使用。
export const getPlansDirectory = memoize(function getPlansDirectory(): string {
  // settings 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const settings = getInitialSettings()
  // settingsDir 命名 `settings.plansDirectory`，让后续代码直接表达这个值的用途。
  const settingsDir = settings.plansDirectory
  // plansPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let plansPath: string

  // 满足 `settingsDir` 时，共享工具执行该分支。
  if (settingsDir) {
    // Settings.json (relative to project root)
    // cwd读取`getCwd`，供共享工具后续处理使用。
    const cwd = getCwd()
    // resolved读取`resolve`，供共享工具后续处理使用。
    const resolved = resolve(cwd, settingsDir)

    // Validate path stays within project root to prevent path traversal
    // `!resolved.startsWith(cwd + sep) && resolved` 与 `cwd` 不一致时刷新派生状态，避免使用过期结果。
    if (!resolved.startsWith(cwd + sep) && resolved !== cwd) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(`plansDirectory must be within project root: ${settingsDir}`),
      )
      // plansPath 路径数据更新为 `join(getClaudeConfigHomeDir(), 'plans')`，确保共享工具后续读取最新状态。
      plansPath = join(getClaudeConfigHomeDir(), 'plans')
    } else {
      // plansPath 路径数据更新为 `resolved`，确保共享工具后续读取最新状态。
      plansPath = resolved
    }
  } else {
    // Default
    // plansPath 路径数据更新为 `join(getClaudeConfigHomeDir(), 'plans')`，确保共享工具后续读取最新状态。
    plansPath = join(getClaudeConfigHomeDir(), 'plans')
  }

  // Ensure directory exists (mkdirSync with recursive: true is a no-op if it exists)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 getFsImplementation，触发共享工具此处需要的副作用。
    getFsImplementation().mkdirSync(plansPath)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }

  // 返回 `plansPath`，作为共享工具这次计算的结果。
  return plansPath
})

/**
 * Get the file path for a session's plan
 * @param agentId Optional agent ID for subagents. If not provided, returns main session plan.
 * For main conversation (no agentId), returns {planSlug}.md
 * For subagents (agentId provided), returns {planSlug}-agent-{agentId}.md
 */
// getPlanFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPlanFilePath(agentId?: AgentId): string {
  // planSlug读取`getPlanSlug`，供共享工具后续处理使用。
  const planSlug = getPlanSlug(getSessionId())

  // Main conversation: simple filename with word slug
  // agentId缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!agentId) {
    // 返回 `join(getPlansDirectory(), `${planSlug}.md`)`，作为共享工具这次计算的结果。
    return join(getPlansDirectory(), `${planSlug}.md`)
  }

  // Subagents: include agent ID
  // 返回 `join(getPlansDirectory(), `${planSlug}-agent-${agentId}.md`)`，作为共享工具这次计算的结果。
  return join(getPlansDirectory(), `${planSlug}-agent-${agentId}.md`)
}

/**
 * Get the plan content for a session
 * @param agentId Optional agent ID for subagents. If not provided, returns main session plan.
 */
// getPlan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPlan(agentId?: AgentId): string | null {
  // 文件路径读取`getPlanFilePath`，供共享工具后续处理使用。
  const filePath = getPlanFilePath(agentId)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `getFsImplementation().readFileSync(filePath, { encoding: 'utf-8' })`，作为共享工具这次计算的结果。
    return getFsImplementation().readFileSync(filePath, { encoding: 'utf-8' })
  } catch (error) {
    // 满足 `isENOENT(error)` 时，共享工具执行该分支。
    if (isENOENT(error)) return null
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Extract the plan slug from a log's message history.
 */
// getSlugFromLog 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSlugFromLog(log: LogOption): string | undefined {
  // 返回 `log.messages.find(m => m.slug)?.slug`，作为共享工具这次计算的结果。
  return log.messages.find(m => m.slug)?.slug
}

/**
 * Restore plan slug from a resumed session.
 * Sets the slug in the session cache so getPlanSlug returns it.
 * If the plan file is missing, attempts to recover it from a file snapshot
 * (written incrementally during the session) or from message history.
 * Returns true if a plan file exists (or was recovered) for the slug.
 * @param log The log to restore from
 * @param targetSessionId The session ID to associate the plan slug with.
 *                        This should be the ORIGINAL session ID being resumed,
 *                        not the temporary session ID from before resume.
 */
// copyPlanForResume 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function copyPlanForResume(
  log: LogOption,
  targetSessionId?: SessionId,
): Promise<boolean> {
  // slug读取`getSlugFromLog`，供共享工具后续处理使用。
  const slug = getSlugFromLog(log)
  // slug缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!slug) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Set the slug for the target session ID (or current if not provided)
  // sessionId 会话数据读取`getSessionId`，供共享工具后续处理使用。
  const sessionId = targetSessionId ?? getSessionId()
  // setPlanSlug 写入新的状态值，使共享工具后续读取保持一致。
  setPlanSlug(sessionId, slug)

  // Attempt to read the plan file directly — recovery triggers on ENOENT.
  // planPath 路径数据格式化`join`，供共享工具后续处理使用。
  const planPath = join(getPlansDirectory(), `${slug}.md`)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `getFsImplementation().readFile(planPath, { encoding: 'utf-8' })` 完成，再继续共享工具 plans的异步流程。
    await getFsImplementation().readFile(planPath, { encoding: 'utf-8' })
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
    if (!isENOENT(e)) {
      // Don't throw — called fire-and-forget (void copyPlanForResume(...)) with no .catch()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e)
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // Only attempt recovery in remote sessions (CCR) where files don't persist
    // 满足 `getEnvironmentKind() === null` 时，共享工具执行该分支。
    if (getEnvironmentKind() === null) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Plan file missing during resume: ${planPath}. Attempting recovery.`,
    )

    // Try file snapshot first (written incrementally during session)
    // snapshotPlan筛选`findFileSnapshotEntry`，供共享工具后续处理使用。
    const snapshotPlan = findFileSnapshotEntry(log.messages, 'plan')
    // recovered保存`null`，作为后续空值处理的输入。
    let recovered: string | null = null
    // 只有 `snapshotPlan && snapshotPlan.content.length > 0` 满足时，共享工具才执行该分支。
    if (snapshotPlan && snapshotPlan.content.length > 0) {
      // recovered更新为 `snapshotPlan.content`，确保共享工具后续读取最新状态。
      recovered = snapshotPlan.content
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plan recovered from file snapshot, ${recovered.length} chars`,
        { level: 'info' },
      )
    } else {
      // Fall back to searching message history
      // recovered更新为 `recoverPlanFromMessages(log)`，确保共享工具后续读取最新状态。
      recovered = recoverPlanFromMessages(log)
      // 满足 `recovered` 时，共享工具执行该分支。
      if (recovered) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plan recovered from message history, ${recovered.length} chars`,
          { level: 'info' },
        )
      }
    }

    // 满足 `recovered` 时，共享工具执行该分支。
    if (recovered) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `writeFile(planPath, recovered, { encoding: 'utf-8' })` 完成，再继续共享工具 plans的异步流程。
        await writeFile(planPath, recovered, { encoding: 'utf-8' })
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      } catch (writeError) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(writeError)
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Plan file recovery failed: no file snapshot or plan content found in message history',
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Copy a plan file for a forked session. Unlike copyPlanForResume (which reuses
 * the original slug), this generates a NEW slug for the forked session and
 * writes the original plan content to the new file. This prevents the original
 * and forked sessions from clobbering each other's plan files.
 */
// copyPlanForFork 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function copyPlanForFork(
  log: LogOption,
  targetSessionId: SessionId,
): Promise<boolean> {
  // originalSlug读取`getSlugFromLog`，供共享工具后续处理使用。
  const originalSlug = getSlugFromLog(log)
  // originalSlug缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!originalSlug) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // plansDir读取`getPlansDirectory`，供共享工具后续处理使用。
  const plansDir = getPlansDirectory()
  // originalPlanPath 路径数据格式化`join`，供共享工具后续处理使用。
  const originalPlanPath = join(plansDir, `${originalSlug}.md`)

  // Generate a new slug for the forked session (do NOT reuse the original)
  // newSlug读取`getPlanSlug`，供共享工具后续处理使用。
  const newSlug = getPlanSlug(targetSessionId)
  // newPlanPath 路径数据格式化`join`，供共享工具后续处理使用。
  const newPlanPath = join(plansDir, `${newSlug}.md`)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `copyFile(originalPlanPath, newPlanPath)` 完成，再继续共享工具 plans的异步流程。
    await copyFile(originalPlanPath, newPlanPath)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 满足 `isENOENT(error)` 时，共享工具执行该分支。
    if (isENOENT(error)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Recover plan content from the message history. Plan content can appear in
 * three forms depending on what happened during the session:
 *
 * 1. ExitPlanMode tool_use input — normalizeToolInput injects the plan content
 *    into the tool_use input, which persists in the transcript.
 *
 * 2. planContent field on user messages — set during the "clear context and
 *    implement" flow when ExitPlanMode is approved.
 *
 * 3. plan_file_reference attachment — created by auto-compact to preserve the
 *    plan across compaction boundaries.
 */
// recoverPlanFromMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function recoverPlanFromMessages(log: LogOption): string | null {
  // 循环处理 `let i = log.messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = log.messages.length - 1; i >= 0; i--) {
    // 消息保存`log.messages[i]`，供共享工具 plans后续判断或输出使用。
    const msg = log.messages[i]
    // 消息缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!msg) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 当 `msg.type` 匹配 `'assistant'` 时，共享工具执行对应分支。
    if (msg.type === 'assistant') {
      // 从 `(msg as AssistantMessage).message` 解构 content，减少共享工具 plans对同一对象的重复访问。
      const { content } = (msg as AssistantMessage).message
      // 满足 `Array.isArray(content)` 时，共享工具执行该分支。
      if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给共享工具处理。
        for (const block of content) {
          // 共享工具在这里按实际状态进入对应分支。
          if (
            block.type === 'tool_use' &&
            block.name === EXIT_PLAN_MODE_V2_TOOL_NAME
          ) {
            // 用户输入保存`block.input as Record<string, unknown> | undefined`，供后续判断或组装使用。
            const input = block.input as Record<string, unknown> | undefined
            // plan保存`input?.plan`，供共享工具 plans后续判断或输出使用。
            const plan = input?.plan
            // 只有 `typeof plan === 'string' && plan.length > 0` 满足时，共享工具才执行该分支。
            if (typeof plan === 'string' && plan.length > 0) {
              // 返回 `plan`，作为共享工具这次计算的结果。
              return plan
            }
          }
        }
      }
    }

    // 当 `msg.type` 匹配 `'user'` 时，共享工具执行对应分支。
    if (msg.type === 'user') {
      // userMsg 命名 `msg as UserMessage`，让后续代码直接表达这个值的用途。
      const userMsg = msg as UserMessage
      // 共享工具在这里按实际状态进入对应分支。
      if (
        typeof userMsg.planContent === 'string' &&
        userMsg.planContent.length > 0
      ) {
        // 返回 `userMsg.planContent`，作为共享工具这次计算的结果。
        return userMsg.planContent
      }
    }

    // 当 `msg.type` 匹配 `'attachment'` 时，共享工具执行对应分支。
    if (msg.type === 'attachment') {
      // attachmentMsg 命名 `msg as AttachmentMessage`，让后续代码直接表达这个值的用途。
      const attachmentMsg = msg as AttachmentMessage
      // 满足 `attachmentMsg.attachment?.type === 'plan_file_ref` 时，共享工具执行该分支。
      if (attachmentMsg.attachment?.type === 'plan_file_reference') {
        // plan保存`(attachmentMsg.attachment as { planContent?: string })`，供后续判断或组装使用。
        const plan = (attachmentMsg.attachment as { planContent?: string })
          .planContent
        // 只有 `typeof plan === 'string' && plan.length > 0` 满足时，共享工具才执行该分支。
        if (typeof plan === 'string' && plan.length > 0) {
          // 返回 `plan`，作为共享工具这次计算的结果。
          return plan
        }
      }
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Find a file entry in the most recent file-snapshot system message in the transcript.
 * Scans backwards to find the latest snapshot.
 */
// findFileSnapshotEntry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findFileSnapshotEntry(
  messages: LogOption['messages'],
  key: string,
): { key: string; path: string; content: string } | undefined {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息保存`messages[i]`，供共享工具 plans后续判断或输出使用。
    const msg = messages[i]
    // 共享工具在这里按实际状态进入对应分支。
    if (
      msg?.type === 'system' &&
      'subtype' in msg &&
      msg.subtype === 'file_snapshot' &&
      'snapshotFiles' in msg
    ) {
      // files 文件数据 命名 `msg.snapshotFiles as Array<{`，让后续代码直接表达这个值的用途。
      const files = msg.snapshotFiles as Array<{
        key: string
        path: string
        content: string
      }>
      // 返回 `files.find(f => f.key === key)`，作为共享工具这次计算的结果。
      return files.find(f => f.key === key)
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Persist a snapshot of session files (plan, todos) to the transcript.
 * Called incrementally whenever these files change. Only active in remote
 * sessions (CCR) where local files don't persist between sessions.
 */
// persistFileSnapshotIfRemote 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function persistFileSnapshotIfRemote(): Promise<void> {
  // 满足 `getEnvironmentKind() === null` 时，共享工具执行该分支。
  if (getEnvironmentKind() === null) {
    // 共享工具 plans在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // snapshotFiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const snapshotFiles: SystemFileSnapshotMessage['snapshotFiles'] = []

    // Snapshot plan file
    // plan读取`getPlan`，供共享工具后续处理使用。
    const plan = getPlan()
    // 满足 `plan` 时，共享工具执行该分支。
    if (plan) {
      // snapshotFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
      snapshotFiles.push({
        key: 'plan',
        path: getPlanFilePath(),
        content: plan,
      })
    }

    // snapshotFiles 文件数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (snapshotFiles.length === 0) {
      // 共享工具 plans在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 消息 集中保存共享工具 plans要一起传递的字段。
    const message: SystemFileSnapshotMessage = {
      type: 'system',
      subtype: 'file_snapshot',
      content: 'File snapshot',
      level: 'info',
      isMeta: true,
      timestamp: new Date().toISOString(),
      uuid: randomUUID(),
      snapshotFiles,
    }

    // 从 `await import('./sessionStorage.js')` 解构 recordTranscript，减少共享工具 plans对同一对象的重复访问。
    const { recordTranscript } = await import('./sessionStorage.js')
    // 等待 `recordTranscript([message])` 完成，再继续共享工具 plans的异步流程。
    await recordTranscript([message])
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

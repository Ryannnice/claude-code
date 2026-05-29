/**
 * Teammate Mailbox - File-based messaging system for agent swarms
 *
 * Each teammate has an inbox file at .claude/teams/{team_name}/inboxes/{agent_name}.json
 * Other teammates can write messages to it, and the recipient sees them as attachments.
 *
 * Note: Inboxes are keyed by agent name within a team.
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 TEAMMATE_MESSAGE_TAG，将 ../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { TEAMMATE_MESSAGE_TAG } from '../constants/xml.js'
// 引入 PermissionModeSchema，将 ../entrypoints/sdk/coreSchemas.js 中已经封装好的能力接到本文件流程里。
import { PermissionModeSchema } from '../entrypoints/sdk/coreSchemas.js'
// 接入 SEND_MESSAGE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SEND_MESSAGE_TOOL_NAME } from '../tools/SendMessageTool/constants.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../types/message.js'
// 引入 generateRequestId，将 ./agentId.js 中已经封装好的能力接到本文件流程里。
import { generateRequestId } from './agentId.js'
// 引入 count，将 ./array.js 中已经封装好的能力接到本文件流程里。
import { count } from './array.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getTeamsDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getTeamsDir } from './envUtils.js'
// 引入 getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from './errors.js'
// 引入 lazySchema，将 ./lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from './lazySchema.js'
// 引入 * as lockfile，将 ./lockfile.js 中已经封装好的能力接到本文件流程里。
import * as lockfile from './lockfile.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 jsonParse、jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from './slowOperations.js'
// 类型依赖 { BackendType } 来自 ./swarm/backends/types.js，用于校准共享工具的数据契约。
import type { BackendType } from './swarm/backends/types.js'
// 引入 TEAM_LEAD_NAME，将 ./swarm/constants.js 中已经封装好的能力接到本文件流程里。
import { TEAM_LEAD_NAME } from './swarm/constants.js'
// 引入 sanitizePathComponent，将 ./tasks.js 中已经封装好的能力接到本文件流程里。
import { sanitizePathComponent } from './tasks.js'
// 引入 getAgentName、getTeammateColor、getTeamName，将 ./teammate.js 中已经封装好的能力接到本文件流程里。
import { getAgentName, getTeammateColor, getTeamName } from './teammate.js'

// Lock options: retry with backoff so concurrent callers (multiple Claudes
// in a swarm) wait for the lock instead of failing immediately. The sync
// lockSync API blocked the event loop; the async API needs explicit retries
// to achieve the same serialization semantics.
// LOCK_OPTIONS 集合集中保存共享工具 teammate Mailbox要一起传递的字段。
const LOCK_OPTIONS = {
  retries: {
    retries: 10,
    minTimeout: 5,
    maxTimeout: 100,
  },
}

// TeammateMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateMessage = {
  from: string
  text: string
  timestamp: string
  read: boolean
  color?: string // Sender's assigned color (e.g., 'red', 'blue', 'green')
  summary?: string // 5-10 word summary shown as preview in the UI
}

/**
 * Get the path to a teammate's inbox file
 * Structure: ~/.claude/teams/{team_name}/inboxes/{agent_name}.json
 */
// getInboxPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInboxPath(agentName: string, teamName?: string): string {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName() || 'default'
  // safeTeam保存`sanitizePathComponent`，供共享工具后续处理使用。
  const safeTeam = sanitizePathComponent(team)
  // safeAgentName保存`sanitizePathComponent`，供共享工具后续处理使用。
  const safeAgentName = sanitizePathComponent(agentName)
  // inboxDir格式化`join`，供共享工具后续处理使用。
  const inboxDir = join(getTeamsDir(), safeTeam, 'inboxes')
  // fullPath 路径数据格式化`join`，供共享工具后续处理使用。
  const fullPath = join(inboxDir, `${safeAgentName}.json`)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateMailbox] getInboxPath: agent=${agentName}, team=${team}, fullPath=${fullPath}`,
  )
  // 返回 `fullPath`，作为共享工具这次计算的结果。
  return fullPath
}

/**
 * Ensure the inbox directory exists for a team
 */
// ensureInboxDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function ensureInboxDir(teamName?: string): Promise<void> {
  // team读取`getTeamName`，供共享工具后续处理使用。
  const team = teamName || getTeamName() || 'default'
  // safeTeam保存`sanitizePathComponent`，供共享工具后续处理使用。
  const safeTeam = sanitizePathComponent(team)
  // inboxDir格式化`join`，供共享工具后续处理使用。
  const inboxDir = join(getTeamsDir(), safeTeam, 'inboxes')
  // 等待 `mkdir(inboxDir, { recursive: true })` 完成，再继续共享工具 teammate Mailbox的异步流程。
  await mkdir(inboxDir, { recursive: true })
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[TeammateMailbox] Ensured inbox directory: ${inboxDir}`)
}

/**
 * Read all messages from a teammate's inbox
 * @param agentName - The agent name (not UUID) to read inbox for
 * @param teamName - Optional team name (defaults to CLAUDE_CODE_TEAM_NAME env var or 'default')
 */
// readMailbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readMailbox(
  agentName: string,
  teamName?: string,
): Promise<TeammateMessage[]> {
  // inboxPath 路径数据读取`getInboxPath`，供共享工具后续处理使用。
  const inboxPath = getInboxPath(agentName, teamName)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[TeammateMailbox] readMailbox: path=${inboxPath}`)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供共享工具后续处理使用。
    const content = await readFile(inboxPath, 'utf-8')
    // 对话消息解析`jsonParse`，供共享工具后续处理使用。
    const messages = jsonParse(content) as TeammateMessage[]
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] readMailbox: read ${messages.length} message(s)`,
    )
    // 返回 `messages`，作为共享工具这次计算的结果。
    return messages
  } catch (error) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[TeammateMailbox] readMailbox: file does not exist`)
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to read inbox for ${agentName}: ${error}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

/**
 * Read only unread messages from a teammate's inbox
 * @param agentName - The agent name (not UUID) to read inbox for
 * @param teamName - Optional team name
 */
// readUnreadMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readUnreadMessages(
  agentName: string,
  teamName?: string,
): Promise<TeammateMessage[]> {
  // 对话消息读取`readMailbox`，供共享工具后续处理使用。
  const messages = await readMailbox(agentName, teamName)
  // unread筛选`messages.filter`，供共享工具后续处理使用。
  const unread = messages.filter(m => !m.read)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateMailbox] readUnreadMessages: ${unread.length} unread of ${messages.length} total`,
  )
  // 返回 `unread`，作为共享工具这次计算的结果。
  return unread
}

/**
 * Write a message to a teammate's inbox
 * Uses file locking to prevent race conditions when multiple agents write concurrently
 * @param recipientName - The recipient's agent name (not UUID)
 * @param message - The message to write
 * @param teamName - Optional team name
 */
// writeToMailbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function writeToMailbox(
  recipientName: string,
  message: Omit<TeammateMessage, 'read'>,
  teamName?: string,
): Promise<void> {
  // 等待 `ensureInboxDir(teamName)` 完成，再继续共享工具 teammate Mailbox的异步流程。
  await ensureInboxDir(teamName)

  // inboxPath 路径数据读取`getInboxPath`，供共享工具后续处理使用。
  const inboxPath = getInboxPath(recipientName, teamName)
  // lockFilePath 路径数据 命名 ``${inboxPath}.lock``，让后续代码直接表达这个值的用途。
  const lockFilePath = `${inboxPath}.lock`

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateMailbox] writeToMailbox: recipient=${recipientName}, from=${message.from}, path=${inboxPath}`,
  )

  // Ensure the inbox file exists before locking (proper-lockfile requires the file to exist)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(inboxPath, '[]', { encoding: 'utf-8', flag: 'wx' })` 完成，再继续共享工具 teammate Mailbox的异步流程。
    await writeFile(inboxPath, '[]', { encoding: 'utf-8', flag: 'wx' })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[TeammateMailbox] writeToMailbox: created new inbox file`)
  } catch (error) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // `code` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'EEXIST') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateMailbox] writeToMailbox: failed to create inbox file: ${error}`,
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // release更新为 `await lockfile.lock(inboxPath, {`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(inboxPath, {
      lockfilePath: lockFilePath,
      ...LOCK_OPTIONS,
    })

    // Re-read messages after acquiring lock to get the latest state
    // 对话消息读取`readMailbox`，供共享工具后续处理使用。
    const messages = await readMailbox(recipientName, teamName)

    // newMessage 消息数据 集中保存共享工具 teammate Mailbox要一起传递的字段。
    const newMessage: TeammateMessage = {
      ...message,
      read: false,
    }

    // 对话消息追加新条目，保持收集顺序与输入顺序一致。
    messages.push(newMessage)

    // 等待 `writeFile(inboxPath, jsonStringify(messages, null, 2), 'utf-8')` 完成，再继续共享工具 teammate Mailbox的异步流程。
    await writeFile(inboxPath, jsonStringify(messages, null, 2), 'utf-8')
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] Wrote message to ${recipientName}'s inbox from ${message.from}`,
    )
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to write to inbox for ${recipientName}: ${error}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 teammate Mailbox的异步流程。
      await release()
    }
  }
}

/**
 * Mark a specific message in a teammate's inbox as read by index
 * Uses file locking to prevent race conditions
 * @param agentName - The agent name to mark message as read for
 * @param teamName - Optional team name
 * @param messageIndex - Index of the message to mark as read
 */
// markMessageAsReadByIndex 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function markMessageAsReadByIndex(
  agentName: string,
  teamName: string | undefined,
  messageIndex: number,
): Promise<void> {
  // inboxPath 路径数据读取`getInboxPath`，供共享工具后续处理使用。
  const inboxPath = getInboxPath(agentName, teamName)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateMailbox] markMessageAsReadByIndex called: agentName=${agentName}, teamName=${teamName}, index=${messageIndex}, path=${inboxPath}`,
  )

  // lockFilePath 路径数据 命名 ``${inboxPath}.lock``，让后续代码直接表达这个值的用途。
  const lockFilePath = `${inboxPath}.lock`

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] markMessageAsReadByIndex: acquiring lock...`,
    )
    // release更新为 `await lockfile.lock(inboxPath, {`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(inboxPath, {
      lockfilePath: lockFilePath,
      ...LOCK_OPTIONS,
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[TeammateMailbox] markMessageAsReadByIndex: lock acquired`)

    // Re-read messages after acquiring lock to get the latest state
    // 对话消息读取`readMailbox`，供共享工具后续处理使用。
    const messages = await readMailbox(agentName, teamName)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] markMessageAsReadByIndex: read ${messages.length} messages after lock`,
    )

    // 只有 `messageIndex < 0 || messageIndex >= messages.leng` 满足时，共享工具才执行该分支。
    if (messageIndex < 0 || messageIndex >= messages.length) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateMailbox] markMessageAsReadByIndex: index ${messageIndex} out of bounds (${messages.length} messages)`,
      )
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 消息读取 `messages[messageIndex]` 对应条目，后续围绕该成员继续处理。
    const message = messages[messageIndex]
    // 只有 `!message || message.read` 满足时，共享工具才执行该分支。
    if (!message || message.read) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateMailbox] markMessageAsReadByIndex: message already read or missing`,
      )
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // messages[messageIndex 消息数据更新为 `{ ...message, read: true }`，确保共享工具 teammate Mailbox后续读取最新状态。
    messages[messageIndex] = { ...message, read: true }

    // 等待 `writeFile(inboxPath, jsonStringify(messages, null, 2), 'utf-8')` 完成，再继续共享工具 teammate Mailbox的异步流程。
    await writeFile(inboxPath, jsonStringify(messages, null, 2), 'utf-8')
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] markMessageAsReadByIndex: marked message at index ${messageIndex} as read`,
    )
  } catch (error) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateMailbox] markMessageAsReadByIndex: file does not exist at ${inboxPath}`,
      )
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] markMessageAsReadByIndex FAILED for ${agentName}: ${error}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 teammate Mailbox的异步流程。
      await release()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateMailbox] markMessageAsReadByIndex: lock released`,
      )
    }
  }
}

/**
 * Mark all messages in a teammate's inbox as read
 * Uses file locking to prevent race conditions
 * @param agentName - The agent name to mark messages as read for
 * @param teamName - Optional team name
 */
// markMessagesAsRead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function markMessagesAsRead(
  agentName: string,
  teamName?: string,
): Promise<void> {
  // inboxPath 路径数据读取`getInboxPath`，供共享工具后续处理使用。
  const inboxPath = getInboxPath(agentName, teamName)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[TeammateMailbox] markMessagesAsRead called: agentName=${agentName}, teamName=${teamName}, path=${inboxPath}`,
  )

  // lockFilePath 路径数据 命名 ``${inboxPath}.lock``，让后续代码直接表达这个值的用途。
  const lockFilePath = `${inboxPath}.lock`

  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[TeammateMailbox] markMessagesAsRead: acquiring lock...`)
    // release更新为 `await lockfile.lock(inboxPath, {`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(inboxPath, {
      lockfilePath: lockFilePath,
      ...LOCK_OPTIONS,
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[TeammateMailbox] markMessagesAsRead: lock acquired`)

    // Re-read messages after acquiring lock to get the latest state
    // 对话消息读取`readMailbox`，供共享工具后续处理使用。
    const messages = await readMailbox(agentName, teamName)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] markMessagesAsRead: read ${messages.length} messages after lock`,
    )

    // 对话消息为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (messages.length === 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateMailbox] markMessagesAsRead: no messages to mark`,
      )
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // unreadCount 数量统计`count`，供共享工具后续处理使用。
    const unreadCount = count(messages, m => !m.read)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] markMessagesAsRead: ${unreadCount} unread of ${messages.length} total`,
    )

    // messages comes from jsonParse — fresh, unshared objects safe to mutate
    // 逐项读取 `messages` 中的m，按输入顺序推进共享工具。
    for (const m of messages) m.read = true

    // 等待 `writeFile(inboxPath, jsonStringify(messages, null, 2), 'utf-8')` 完成，再继续共享工具 teammate Mailbox的异步流程。
    await writeFile(inboxPath, jsonStringify(messages, null, 2), 'utf-8')
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] markMessagesAsRead: WROTE ${unreadCount} message(s) as read to ${inboxPath}`,
    )
  } catch (error) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TeammateMailbox] markMessagesAsRead: file does not exist at ${inboxPath}`,
      )
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TeammateMailbox] markMessagesAsRead FAILED for ${agentName}: ${error}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 等待 `release()` 完成，再继续共享工具 teammate Mailbox的异步流程。
      await release()
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[TeammateMailbox] markMessagesAsRead: lock released`)
    }
  }
}

/**
 * Clear a teammate's inbox (delete all messages)
 * @param agentName - The agent name to clear inbox for
 * @param teamName - Optional team name
 */
// clearMailbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearMailbox(
  agentName: string,
  teamName?: string,
): Promise<void> {
  // inboxPath 路径数据读取`getInboxPath`，供共享工具后续处理使用。
  const inboxPath = getInboxPath(agentName, teamName)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // flag 'r+' throws ENOENT if the file doesn't exist, so we don't
    // accidentally create an inbox file that wasn't there.
    // 等待 `writeFile(inboxPath, '[]', { encoding: 'utf-8', flag: 'r+' })` 完成，再继续共享工具 teammate Mailbox的异步流程。
    await writeFile(inboxPath, '[]', { encoding: 'utf-8', flag: 'r+' })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[TeammateMailbox] Cleared inbox for ${agentName}`)
  } catch (error) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to clear inbox for ${agentName}: ${error}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

/**
 * Format teammate messages as XML for attachment display
 */
// formatTeammateMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatTeammateMessages(
  messages: Array<{
    from: string
    text: string
    timestamp: string
    color?: string
    summary?: string
  }>,
): string {
  // 返回 `messages`，作为共享工具这次计算的结果。
  return messages
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(m => {
      // colorAttr 命名 `m.color ? ` color="${m.color}"` : ''`，让后续代码直接表达这个值的用途。
      const colorAttr = m.color ? ` color="${m.color}"` : ''
      // summaryAttr保存`m.summary ? ` summary="${m.summary}"` : ''`，供共享工具 teammate Mailbox后续判断或输出使用。
      const summaryAttr = m.summary ? ` summary="${m.summary}"` : ''
      // 返回 ``<${TEAMMATE_MESSAGE_TAG} teammate_id="${m.from}"${colorAttr}${summaryA...`，作为共享工具这次计算的结果。
      return `<${TEAMMATE_MESSAGE_TAG} teammate_id="${m.from}"${colorAttr}${summaryAttr}>\n${m.text}\n</${TEAMMATE_MESSAGE_TAG}>`
    })
    .join('\n\n')
}

/**
 * Structured message sent when a teammate becomes idle (via Stop hook)
 */
// IdleNotificationMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type IdleNotificationMessage = {
  type: 'idle_notification'
  from: string
  timestamp: string
  /** Why the agent went idle */
  idleReason?: 'available' | 'interrupted' | 'failed'
  /** Brief summary of the last DM sent this turn (if any) */
  summary?: string
  completedTaskId?: string
  completedStatus?: 'resolved' | 'blocked' | 'failed'
  failureReason?: string
}

/**
 * Creates an idle notification message to send to the team leader
 */
// createIdleNotification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createIdleNotification(
  agentId: string,
  options?: {
    idleReason?: IdleNotificationMessage['idleReason']
    summary?: string
    completedTaskId?: string
    completedStatus?: 'resolved' | 'blocked' | 'failed'
    failureReason?: string
  },
): IdleNotificationMessage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'idle_notification',
    from: agentId,
    timestamp: new Date().toISOString(),
    idleReason: options?.idleReason,
    summary: options?.summary,
    completedTaskId: options?.completedTaskId,
    completedStatus: options?.completedStatus,
    failureReason: options?.failureReason,
  }
}

/**
 * Checks if a message text contains an idle notification
 */
// isIdleNotification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isIdleNotification(
  messageText: string,
): IdleNotificationMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(messageText)
    // 当 `parsed && parsed.type` 匹配 `'idle_notification'` 时，共享工具执行对应分支。
    if (parsed && parsed.type === 'idle_notification') {
      // 返回 `parsed as IdleNotificationMessage`，作为共享工具这次计算的结果。
      return parsed as IdleNotificationMessage
    }
  } catch {
    // Not JSON or not a valid idle notification
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Permission request message sent from worker to leader via mailbox.
 * Field names align with SDK `can_use_tool` (snake_case).
 */
// PermissionRequestMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRequestMessage = {
  type: 'permission_request'
  request_id: string
  agent_id: string
  tool_name: string
  tool_use_id: string
  description: string
  input: Record<string, unknown>
  permission_suggestions: unknown[]
}

/**
 * Permission response message sent from leader to worker via mailbox.
 * Shape mirrors SDK ControlResponseSchema / ControlErrorResponseSchema.
 */
// PermissionResponseMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionResponseMessage =
  | {
      type: 'permission_response'
      request_id: string
      subtype: 'success'
      response?: {
        updated_input?: Record<string, unknown>
        permission_updates?: unknown[]
      }
    }
  | {
      type: 'permission_response'
      request_id: string
      subtype: 'error'
      error: string
    }

/**
 * Creates a permission request message to send to the team leader
 */
// createPermissionRequestMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPermissionRequestMessage(params: {
  request_id: string
  agent_id: string
  tool_name: string
  tool_use_id: string
  description: string
  input: Record<string, unknown>
  permission_suggestions?: unknown[]
}): PermissionRequestMessage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'permission_request',
    request_id: params.request_id,
    agent_id: params.agent_id,
    tool_name: params.tool_name,
    tool_use_id: params.tool_use_id,
    description: params.description,
    input: params.input,
    permission_suggestions: params.permission_suggestions || [],
  }
}

/**
 * Creates a permission response message to send back to a worker
 */
// createPermissionResponseMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPermissionResponseMessage(params: {
  request_id: string
  subtype: 'success' | 'error'
  error?: string
  updated_input?: Record<string, unknown>
  permission_updates?: unknown[]
}): PermissionResponseMessage {
  // 当 `params.subtype` 匹配 `'error'` 时，共享工具执行对应分支。
  if (params.subtype === 'error') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      type: 'permission_response',
      request_id: params.request_id,
      subtype: 'error',
      error: params.error || 'Permission denied',
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'permission_response',
    request_id: params.request_id,
    subtype: 'success',
    response: {
      updated_input: params.updated_input,
      permission_updates: params.permission_updates,
    },
  }
}

/**
 * Checks if a message text contains a permission request
 */
// isPermissionRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPermissionRequest(
  messageText: string,
): PermissionRequestMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(messageText)
    // 当 `parsed && parsed.type` 匹配 `'permission_request'` 时，共享工具执行对应分支。
    if (parsed && parsed.type === 'permission_request') {
      // 返回 `parsed as PermissionRequestMessage`，作为共享工具这次计算的结果。
      return parsed as PermissionRequestMessage
    }
  } catch {
    // Not JSON or not a valid permission request
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a message text contains a permission response
 */
// isPermissionResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPermissionResponse(
  messageText: string,
): PermissionResponseMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(messageText)
    // 当 `parsed && parsed.type` 匹配 `'permission_response'` 时，共享工具执行对应分支。
    if (parsed && parsed.type === 'permission_response') {
      // 返回 `parsed as PermissionResponseMessage`，作为共享工具这次计算的结果。
      return parsed as PermissionResponseMessage
    }
  } catch {
    // Not JSON or not a valid permission response
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Sandbox permission request message sent from worker to leader via mailbox
 * This is triggered when sandbox runtime detects a network access to a non-allowed host
 */
// SandboxPermissionRequestMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SandboxPermissionRequestMessage = {
  type: 'sandbox_permission_request'
  /** Unique identifier for this request */
  requestId: string
  /** Worker's CLAUDE_CODE_AGENT_ID */
  workerId: string
  /** Worker's CLAUDE_CODE_AGENT_NAME */
  workerName: string
  /** Worker's CLAUDE_CODE_AGENT_COLOR */
  workerColor?: string
  /** The host pattern requesting network access */
  hostPattern: {
    host: string
  }
  /** Timestamp when request was created */
  createdAt: number
}

/**
 * Sandbox permission response message sent from leader to worker via mailbox
 */
// SandboxPermissionResponseMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SandboxPermissionResponseMessage = {
  type: 'sandbox_permission_response'
  /** ID of the request this responds to */
  requestId: string
  /** The host that was approved/denied */
  host: string
  /** Whether the connection is allowed */
  allow: boolean
  /** Timestamp when response was created */
  timestamp: string
}

/**
 * Creates a sandbox permission request message to send to the team leader
 */
// createSandboxPermissionRequestMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSandboxPermissionRequestMessage(params: {
  requestId: string
  workerId: string
  workerName: string
  workerColor?: string
  host: string
}): SandboxPermissionRequestMessage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'sandbox_permission_request',
    requestId: params.requestId,
    workerId: params.workerId,
    workerName: params.workerName,
    workerColor: params.workerColor,
    hostPattern: { host: params.host },
    createdAt: Date.now(),
  }
}

/**
 * Creates a sandbox permission response message to send back to a worker
 */
// createSandboxPermissionResponseMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSandboxPermissionResponseMessage(params: {
  requestId: string
  host: string
  allow: boolean
}): SandboxPermissionResponseMessage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'sandbox_permission_response',
    requestId: params.requestId,
    host: params.host,
    allow: params.allow,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Checks if a message text contains a sandbox permission request
 */
// isSandboxPermissionRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSandboxPermissionRequest(
  messageText: string,
): SandboxPermissionRequestMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(messageText)
    // 只有 `parsed && parsed.type === 'sandbox_permission_req` 满足时，共享工具才执行该分支。
    if (parsed && parsed.type === 'sandbox_permission_request') {
      // 返回 `parsed as SandboxPermissionRequestMessage`，作为共享工具这次计算的结果。
      return parsed as SandboxPermissionRequestMessage
    }
  } catch {
    // Not JSON or not a valid sandbox permission request
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a message text contains a sandbox permission response
 */
// isSandboxPermissionResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSandboxPermissionResponse(
  messageText: string,
): SandboxPermissionResponseMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(messageText)
    // 只有 `parsed && parsed.type === 'sandbox_permission_res` 满足时，共享工具才执行该分支。
    if (parsed && parsed.type === 'sandbox_permission_response') {
      // 返回 `parsed as SandboxPermissionResponseMessage`，作为共享工具这次计算的结果。
      return parsed as SandboxPermissionResponseMessage
    }
  } catch {
    // Not JSON or not a valid sandbox permission response
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Message sent when a teammate requests plan approval from the team leader
 */
// PlanApprovalRequestMessageSchema 消息数据保存`lazySchema`，供共享工具后续处理使用。
export const PlanApprovalRequestMessageSchema = lazySchema(() =>
  z.object({
    type: z.literal('plan_approval_request'),
    from: z.string(),
    timestamp: z.string(),
    planFilePath: z.string(),
    planContent: z.string(),
    requestId: z.string(),
  }),
)

// PlanApprovalRequestMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PlanApprovalRequestMessage = z.infer<
  ReturnType<typeof PlanApprovalRequestMessageSchema>
>

/**
 * Message sent by the team leader in response to a plan approval request
 */
// PlanApprovalResponseMessageSchema 消息数据保存`lazySchema`，供共享工具后续处理使用。
export const PlanApprovalResponseMessageSchema = lazySchema(() =>
  z.object({
    type: z.literal('plan_approval_response'),
    requestId: z.string(),
    approved: z.boolean(),
    feedback: z.string().optional(),
    timestamp: z.string(),
    permissionMode: PermissionModeSchema().optional(),
  }),
)

// PlanApprovalResponseMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PlanApprovalResponseMessage = z.infer<
  ReturnType<typeof PlanApprovalResponseMessageSchema>
>

/**
 * Shutdown request message sent from leader to teammate via mailbox
 */
// ShutdownRequestMessageSchema 消息数据保存`lazySchema`，供共享工具后续处理使用。
export const ShutdownRequestMessageSchema = lazySchema(() =>
  z.object({
    type: z.literal('shutdown_request'),
    requestId: z.string(),
    from: z.string(),
    reason: z.string().optional(),
    timestamp: z.string(),
  }),
)

// ShutdownRequestMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShutdownRequestMessage = z.infer<
  ReturnType<typeof ShutdownRequestMessageSchema>
>

/**
 * Shutdown approved message sent from teammate to leader via mailbox
 */
// ShutdownApprovedMessageSchema 消息数据保存`lazySchema`，供共享工具后续处理使用。
export const ShutdownApprovedMessageSchema = lazySchema(() =>
  z.object({
    type: z.literal('shutdown_approved'),
    requestId: z.string(),
    from: z.string(),
    timestamp: z.string(),
    paneId: z.string().optional(),
    backendType: z.string().optional(),
  }),
)

// ShutdownApprovedMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShutdownApprovedMessage = z.infer<
  ReturnType<typeof ShutdownApprovedMessageSchema>
>

/**
 * Shutdown rejected message sent from teammate to leader via mailbox
 */
// ShutdownRejectedMessageSchema 消息数据保存`lazySchema`，供共享工具后续处理使用。
export const ShutdownRejectedMessageSchema = lazySchema(() =>
  z.object({
    type: z.literal('shutdown_rejected'),
    requestId: z.string(),
    from: z.string(),
    reason: z.string(),
    timestamp: z.string(),
  }),
)

// ShutdownRejectedMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShutdownRejectedMessage = z.infer<
  ReturnType<typeof ShutdownRejectedMessageSchema>
>

/**
 * Creates a shutdown request message to send to a teammate
 */
// createShutdownRequestMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createShutdownRequestMessage(params: {
  requestId: string
  from: string
  reason?: string
}): ShutdownRequestMessage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'shutdown_request',
    requestId: params.requestId,
    from: params.from,
    reason: params.reason,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Creates a shutdown approved message to send to the team leader
 */
// createShutdownApprovedMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createShutdownApprovedMessage(params: {
  requestId: string
  from: string
  paneId?: string
  backendType?: BackendType
}): ShutdownApprovedMessage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'shutdown_approved',
    requestId: params.requestId,
    from: params.from,
    timestamp: new Date().toISOString(),
    paneId: params.paneId,
    backendType: params.backendType,
  }
}

/**
 * Creates a shutdown rejected message to send to the team leader
 */
// createShutdownRejectedMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createShutdownRejectedMessage(params: {
  requestId: string
  from: string
  reason: string
}): ShutdownRejectedMessage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'shutdown_rejected',
    requestId: params.requestId,
    from: params.from,
    reason: params.reason,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Sends a shutdown request to a teammate's mailbox.
 * This is the core logic extracted for reuse by both the tool and UI components.
 *
 * @param targetName - Name of the teammate to send shutdown request to
 * @param teamName - Optional team name (defaults to CLAUDE_CODE_TEAM_NAME env var)
 * @param reason - Optional reason for the shutdown request
 * @returns The request ID and target name
 */
// sendShutdownRequestToMailbox 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendShutdownRequestToMailbox(
  targetName: string,
  teamName?: string,
  reason?: string,
): Promise<{ requestId: string; target: string }> {
  // resolvedTeamName读取`getTeamName`，供共享工具后续处理使用。
  const resolvedTeamName = teamName || getTeamName()

  // Get sender name (supports in-process teammates via AsyncLocalStorage)
  // senderName读取`getAgentName`，供共享工具后续处理使用。
  const senderName = getAgentName() || TEAM_LEAD_NAME

  // Generate a deterministic request ID for this shutdown request
  // requestId 请求数据保存`generateRequestId`，供共享工具后续处理使用。
  const requestId = generateRequestId('shutdown', targetName)

  // Create and send the shutdown request message
  // shutdownMessage 消息数据构建`createShutdownRequestMessage`，供共享工具后续处理使用。
  const shutdownMessage = createShutdownRequestMessage({
    requestId,
    from: senderName,
    reason,
  })

  // 等待 `writeToMailbox(` 完成，再继续共享工具 teammate Mailbox的异步流程。
  await writeToMailbox(
    targetName,
    {
      from: senderName,
      text: jsonStringify(shutdownMessage),
      timestamp: new Date().toISOString(),
      color: getTeammateColor(),
    },
    resolvedTeamName,
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { requestId, target: targetName }
}

/**
 * Checks if a message text contains a shutdown request
 */
// isShutdownRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isShutdownRequest(
  messageText: string,
): ShutdownRequestMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`ShutdownRequestMessageSchema`，供共享工具后续处理使用。
    const result = ShutdownRequestMessageSchema().safeParse(
      jsonParse(messageText),
    )
    // 满足 `result.success` 时，共享工具执行该分支。
    if (result.success) return result.data
  } catch {
    // Not JSON
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a message text contains a plan approval request
 */
// isPlanApprovalRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPlanApprovalRequest(
  messageText: string,
): PlanApprovalRequestMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`PlanApprovalRequestMessageSchema`，供共享工具后续处理使用。
    const result = PlanApprovalRequestMessageSchema().safeParse(
      jsonParse(messageText),
    )
    // 满足 `result.success` 时，共享工具执行该分支。
    if (result.success) return result.data
  } catch {
    // Not JSON
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a message text contains a shutdown approved message
 */
// isShutdownApproved 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isShutdownApproved(
  messageText: string,
): ShutdownApprovedMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`ShutdownApprovedMessageSchema`，供共享工具后续处理使用。
    const result = ShutdownApprovedMessageSchema().safeParse(
      jsonParse(messageText),
    )
    // 满足 `result.success` 时，共享工具执行该分支。
    if (result.success) return result.data
  } catch {
    // Not JSON
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a message text contains a shutdown rejected message
 */
// isShutdownRejected 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isShutdownRejected(
  messageText: string,
): ShutdownRejectedMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`ShutdownRejectedMessageSchema`，供共享工具后续处理使用。
    const result = ShutdownRejectedMessageSchema().safeParse(
      jsonParse(messageText),
    )
    // 满足 `result.success` 时，共享工具执行该分支。
    if (result.success) return result.data
  } catch {
    // Not JSON
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a message text contains a plan approval response
 */
// isPlanApprovalResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPlanApprovalResponse(
  messageText: string,
): PlanApprovalResponseMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`PlanApprovalResponseMessageSchema`，供共享工具后续处理使用。
    const result = PlanApprovalResponseMessageSchema().safeParse(
      jsonParse(messageText),
    )
    // 满足 `result.success` 时，共享工具执行该分支。
    if (result.success) return result.data
  } catch {
    // Not JSON
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Task assignment message sent when a task is assigned to a teammate
 */
// TaskAssignmentMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskAssignmentMessage = {
  type: 'task_assignment'
  taskId: string
  subject: string
  description: string
  assignedBy: string
  timestamp: string
}

/**
 * Checks if a message text contains a task assignment
 */
// isTaskAssignment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTaskAssignment(
  messageText: string,
): TaskAssignmentMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(messageText)
    // 当 `parsed && parsed.type` 匹配 `'task_assignment'` 时，共享工具执行对应分支。
    if (parsed && parsed.type === 'task_assignment') {
      // 返回 `parsed as TaskAssignmentMessage`，作为共享工具这次计算的结果。
      return parsed as TaskAssignmentMessage
    }
  } catch {
    // Not JSON or not a valid task assignment
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Team permission update message sent from leader to teammates via mailbox
 * Broadcasts a permission update that applies to all teammates
 */
// TeamPermissionUpdateMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeamPermissionUpdateMessage = {
  type: 'team_permission_update'
  /** The permission update to apply */
  permissionUpdate: {
    type: 'addRules'
    rules: Array<{ toolName: string; ruleContent?: string }>
    behavior: 'allow' | 'deny' | 'ask'
    destination: 'session'
  }
  /** The directory path that was allowed */
  directoryPath: string
  /** The tool name this applies to */
  toolName: string
}

/**
 * Checks if a message text contains a team permission update
 */
// isTeamPermissionUpdate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamPermissionUpdate(
  messageText: string,
): TeamPermissionUpdateMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(messageText)
    // 当 `parsed && parsed.type` 匹配 `'team_permission_update'` 时，共享工具执行对应分支。
    if (parsed && parsed.type === 'team_permission_update') {
      // 返回 `parsed as TeamPermissionUpdateMessage`，作为共享工具这次计算的结果。
      return parsed as TeamPermissionUpdateMessage
    }
  } catch {
    // Not JSON or not a valid team permission update
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Mode set request message sent from leader to teammate via mailbox
 * Uses SDK PermissionModeSchema for validated mode values
 */
// ModeSetRequestMessageSchema 消息数据保存`lazySchema`，供共享工具后续处理使用。
export const ModeSetRequestMessageSchema = lazySchema(() =>
  z.object({
    type: z.literal('mode_set_request'),
    mode: PermissionModeSchema(),
    from: z.string(),
  }),
)

// ModeSetRequestMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModeSetRequestMessage = z.infer<
  ReturnType<typeof ModeSetRequestMessageSchema>
>

/**
 * Creates a mode set request message to send to a teammate
 */
// createModeSetRequestMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createModeSetRequestMessage(params: {
  mode: string
  from: string
}): ModeSetRequestMessage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    type: 'mode_set_request',
    mode: params.mode as ModeSetRequestMessage['mode'],
    from: params.from,
  }
}

/**
 * Checks if a message text contains a mode set request
 */
// isModeSetRequest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isModeSetRequest(
  messageText: string,
): ModeSetRequestMessage | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`ModeSetRequestMessageSchema`，供共享工具后续处理使用。
    const parsed = ModeSetRequestMessageSchema().safeParse(
      jsonParse(messageText),
    )
    // 满足 `parsed.success` 时，共享工具执行该分支。
    if (parsed.success) {
      // 返回 `parsed.data`，作为共享工具这次计算的结果。
      return parsed.data
    }
  } catch {
    // Not JSON or not a valid mode set request
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Checks if a message text is a structured protocol message that should be
 * routed by useInboxPoller rather than consumed as raw LLM context.
 *
 * These message types have specific handlers in useInboxPoller that route them
 * to the correct queues (workerPermissions, workerSandboxPermissions, etc.).
 * If getTeammateMailboxAttachments consumes them first, they get bundled as
 * raw text in attachments and never reach their intended handlers.
 */
// isStructuredProtocolMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isStructuredProtocolMessage(messageText: string): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供共享工具后续处理使用。
    const parsed = jsonParse(messageText)
    // `!parsed || typeof parsed` 与 `'object' || !('type' in parsed)` 不一致时刷新派生状态，避免使用过期结果。
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // type解析`(parsed as { type: unknown }).type`，供后续判断或组装使用。
    const type = (parsed as { type: unknown }).type
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      type === 'permission_request' ||
      type === 'permission_response' ||
      type === 'sandbox_permission_request' ||
      type === 'sandbox_permission_response' ||
      type === 'shutdown_request' ||
      type === 'shutdown_approved' ||
      type === 'team_permission_update' ||
      type === 'mode_set_request' ||
      type === 'plan_approval_request' ||
      type === 'plan_approval_response'
    )
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Marks only messages matching a predicate as read, leaving others unread.
 * Uses the same file-locking mechanism as markMessagesAsRead.
 */
// markMessagesAsReadByPredicate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function markMessagesAsReadByPredicate(
  agentName: string,
  // 这个回调绑定到 predicate: (msg: TeammateMessage) => boolean,，负责共享工具在该局部场景下的响应。
  predicate: (msg: TeammateMessage) => boolean,
  teamName?: string,
): Promise<void> {
  // inboxPath 路径数据读取`getInboxPath`，供共享工具后续处理使用。
  const inboxPath = getInboxPath(agentName, teamName)

  // lockFilePath 路径数据 命名 ``${inboxPath}.lock``，让后续代码直接表达这个值的用途。
  const lockFilePath = `${inboxPath}.lock`
  // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责共享工具在该局部场景下的响应。
  let release: (() => Promise<void>) | undefined

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // release更新为 `await lockfile.lock(inboxPath, {`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(inboxPath, {
      lockfilePath: lockFilePath,
      ...LOCK_OPTIONS,
    })

    // 对话消息读取`readMailbox`，供共享工具后续处理使用。
    const messages = await readMailbox(agentName, teamName)
    // 对话消息为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (messages.length === 0) {
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // updatedMessages 消息数据派生`messages.map`，供共享工具后续处理使用。
    const updatedMessages = messages.map(m =>
      !m.read && predicate(m) ? { ...m, read: true } : m,
    )

    // 等待 `writeFile(inboxPath, jsonStringify(updatedMessages, null, 2), 'utf-8')` 完成，再继续共享工具 teammate Mailbox的异步流程。
    await writeFile(inboxPath, jsonStringify(updatedMessages, null, 2), 'utf-8')
  } catch (error) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
    if (code === 'ENOENT') {
      // 共享工具 teammate Mailbox在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  } finally {
    // 满足 `release` 时，共享工具执行该分支。
    if (release) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `release()` 完成，再继续共享工具 teammate Mailbox的异步流程。
        await release()
      } catch {
        // Lock may have already been released
      }
    }
  }
}

/**
 * Extracts a "[to {name}] {summary}" string from the last assistant message
 * if it ended with a SendMessage tool_use targeting a peer (not the team lead).
 * Returns undefined when the turn didn't end with a peer DM.
 */
// getLastPeerDmSummary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastPeerDmSummary(messages: Message[]): string | undefined {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息保存`messages[i]`，供共享工具 teammate Mailbox后续判断或输出使用。
    const msg = messages[i]
    // 消息缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!msg) continue

    // Stop at wake-up boundary: a user prompt (string content), not tool results (array content)
    // 只有 `msg.type === 'user' && typeof msg.message.content` 满足时，共享工具才执行该分支。
    if (msg.type === 'user' && typeof msg.message.content === 'string') {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    // `msg.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'assistant') continue
    // 按顺序遍历 `msg.message.content` 中的block，逐个交给共享工具处理。
    for (const block of msg.message.content) {
      // 共享工具在这里按实际状态进入对应分支。
      if (
        block.type === 'tool_use' &&
        block.name === SEND_MESSAGE_TOOL_NAME &&
        typeof block.input === 'object' &&
        block.input !== null &&
        'to' in block.input &&
        typeof block.input.to === 'string' &&
        block.input.to !== '*' &&
        block.input.to.toLowerCase() !== TEAM_LEAD_NAME.toLowerCase() &&
        'message' in block.input &&
        typeof block.input.message === 'string'
      ) {
        // to保存`block.input.to`，供共享工具 teammate Mailbox后续判断或输出使用。
        const to = block.input.to
        // summary 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const summary =
          'summary' in block.input && typeof block.input.summary === 'string'
            ? block.input.summary
            : block.input.message.slice(0, 80)
        // 返回 ``[to ${to}] ${summary}``，作为共享工具这次计算的结果。
        return `[to ${to}] ${summary}`
      }
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

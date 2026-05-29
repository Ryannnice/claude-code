/**
 * Resolve file_uuid attachments on inbound bridge user messages.
 *
 * Web composer uploads via cookie-authed /api/{org}/upload, sends file_uuid
 * alongside the message. Here we fetch each via GET /api/oauth/files/{uuid}/content
 * (oauth-authed, same store), write to ~/.claude/uploads/{sessionId}/, and
 * return @path refs to prepend. Claude's Read tool takes it from there.
 *
 * Best-effort: any failure (no token, network, non-2xx, disk) logs debug and
 * skips that attachment. The message still reaches Claude, just without @path.
 */

// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准远程桥接会话的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, join } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'
// 引入 getBridgeAccessToken、getBridgeBaseUrl，将 ./bridgeConfig.js 中已经封装好的能力接到本文件流程里。
import { getBridgeAccessToken, getBridgeBaseUrl } from './bridgeConfig.js'

// DOWNLOAD_TIMEOUT_MS 集合保存`30_000`，供后续判断或组装使用。
const DOWNLOAD_TIMEOUT_MS = 30_000

// debug 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function debug(msg: string): void {
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[bridge:inbound-attach] ${msg}`)
}

// attachmentSchema保存`lazySchema`，供远程桥接会话后续处理使用。
const attachmentSchema = lazySchema(() =>
  z.object({
    file_uuid: z.string(),
    file_name: z.string(),
  }),
)
// attachmentsArraySchema保存`lazySchema`，供远程桥接会话后续处理使用。
const attachmentsArraySchema = lazySchema(() => z.array(attachmentSchema()))

// InboundAttachment 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type InboundAttachment = z.infer<ReturnType<typeof attachmentSchema>>

/** Pull file_attachments off a loosely-typed inbound message. */
// extractInboundAttachments 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractInboundAttachments(msg: unknown): InboundAttachment[] {
  // `typeof msg` 与 `'object' || msg === null || !('...` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof msg !== 'object' || msg === null || !('file_attachments' in msg)) {
    // 返回列表结果，保留远程桥接会话已经排好的条目顺序。
    return []
  }
  // 解析结果保存`attachmentsArraySchema`，供远程桥接会话后续处理使用。
  const parsed = attachmentsArraySchema().safeParse(msg.file_attachments)
  // 返回 `parsed.success ? parsed.data : []`，作为远程桥接会话这次计算的结果。
  return parsed.success ? parsed.data : []
}

/**
 * Strip path components and keep only filename-safe chars. file_name comes
 * from the network (web composer), so treat it as untrusted even though the
 * composer controls it.
 */
// sanitizeFileName 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeFileName(name: string): string {
  // base保存`basename`，供远程桥接会话后续处理使用。
  const base = basename(name).replace(/[^a-zA-Z0-9._-]/g, '_')
  // 返回 `base || 'attachment'`，作为远程桥接会话这次计算的结果。
  return base || 'attachment'
}

// uploadsDir 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function uploadsDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'uploads', getSessionId())`，作为远程桥接会话这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'uploads', getSessionId())
}

/**
 * Fetch + write one attachment. Returns the absolute path on success,
 * undefined on any failure.
 */
// resolveOne 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function resolveOne(att: InboundAttachment): Promise<string | undefined> {
  // token读取`getBridgeAccessToken`，供远程桥接会话后续处理使用。
  const token = getBridgeAccessToken()
  // token缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!token) {
    // 调用 debug，触发远程桥接会话此处需要的副作用。
    debug('skip: no oauth token')
    // 返回 `undefined`，作为远程桥接会话这次计算的结果。
    return undefined
  }

  // data 先占位，稍后的条件分支会根据实际输入补齐它。
  let data: Buffer
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // getOauthConfig() (via getBridgeBaseUrl) throws on a non-allowlisted
    // CLAUDE_CODE_CUSTOM_OAUTH_URL — keep it inside the try so a bad
    // FedStart URL degrades to "no @path" instead of crashing print.ts's
    // reader loop (which has no catch around the await).
    // URL读取`getBridgeBaseUrl`，供远程桥接会话后续处理使用。
    const url = `${getBridgeBaseUrl()}/api/oauth/files/${encodeURIComponent(att.file_uuid)}/content`
    // 接口响应读取`axios.get`，供远程桥接会话后续处理使用。
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
      timeout: DOWNLOAD_TIMEOUT_MS,
      // 这个回调绑定到 validateStatus: () => true,，负责远程桥接会话在该局部场景下的响应。
      validateStatus: () => true,
    })
    // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
    if (response.status !== 200) {
      // 调用 debug，触发远程桥接会话此处需要的副作用。
      debug(`fetch ${att.file_uuid} failed: status=${response.status}`)
      // 返回 `undefined`，作为远程桥接会话这次计算的结果。
      return undefined
    }
    // data更新为 `Buffer.from(response.data)`，确保Bridge 通信后续读取最新状态。
    data = Buffer.from(response.data)
  } catch (e) {
    // 调用 debug，触发远程桥接会话此处需要的副作用。
    debug(`fetch ${att.file_uuid} threw: ${e}`)
    // 返回 `undefined`，作为远程桥接会话这次计算的结果。
    return undefined
  }

  // uuid-prefix makes collisions impossible across messages and within one
  // (same filename, different files). 8 chars is enough — this isn't security.
  // safeName保存`sanitizeFileName`，供远程桥接会话后续处理使用。
  const safeName = sanitizeFileName(att.file_name)
  // prefix 命名 `(`，让后续代码直接表达这个值的用途。
  const prefix = (
    att.file_uuid.slice(0, 8) || randomUUID().slice(0, 8)
  ).replace(/[^a-zA-Z0-9_-]/g, '_')
  // dir读取`uploadsDir`，供远程桥接会话后续处理使用。
  const dir = uploadsDir()
  // outPath 路径数据格式化`join`，供远程桥接会话后续处理使用。
  const outPath = join(dir, `${prefix}-${safeName}`)

  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(dir, { recursive: true })` 完成，再继续远程桥接 inbound Attachments的异步流程。
    await mkdir(dir, { recursive: true })
    // 等待 `writeFile(outPath, data)` 完成，再继续远程桥接 inbound Attachments的异步流程。
    await writeFile(outPath, data)
  } catch (e) {
    // 调用 debug，触发远程桥接会话此处需要的副作用。
    debug(`write ${outPath} failed: ${e}`)
    // 返回 `undefined`，作为远程桥接会话这次计算的结果。
    return undefined
  }

  // 调用 debug，触发远程桥接会话此处需要的副作用。
  debug(`resolved ${att.file_uuid} → ${outPath} (${data.length} bytes)`)
  // 返回 `outPath`，作为远程桥接会话这次计算的结果。
  return outPath
}

/**
 * Resolve all attachments on an inbound message to a prefix string of
 * @path refs. Empty string if none resolved.
 */
// resolveInboundAttachments 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveInboundAttachments(
  attachments: InboundAttachment[],
): Promise<string> {
  // attachments 集合为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
  if (attachments.length === 0) return ''
  // 调用 debug，触发远程桥接会话此处需要的副作用。
  debug(`resolving ${attachments.length} attachment(s)`)
  // 路径列表保存`Promise.all`，供远程桥接会话后续处理使用。
  const paths = await Promise.all(attachments.map(resolveOne))
  // ok筛选`paths.filter`，供远程桥接会话后续处理使用。
  const ok = paths.filter((p): p is string => p !== undefined)
  // ok为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
  if (ok.length === 0) return ''
  // Quoted form — extractAtMentionedFiles truncates unquoted @refs at the
  // first space, which breaks any home dir with spaces (/Users/John Smith/).
  // 返回 `ok.map(p => `@"${p}"`).join(' ') + ' '`，作为远程桥接会话这次计算的结果。
  return ok.map(p => `@"${p}"`).join(' ') + ' '
}

/**
 * Prepend @path refs to content, whichever form it's in.
 * Targets the LAST text block — processUserInputBase reads inputString
 * from processedBlocks[processedBlocks.length - 1], so putting refs in
 * block[0] means they're silently ignored for [text, image] content.
 */
// prependPathRefs 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prependPathRefs(
  content: string | Array<ContentBlockParam>,
  prefix: string,
): string | Array<ContentBlockParam> {
  // prefix缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!prefix) return content
  // 当 `typeof content` 匹配 `'string'` 时，远程桥接会话执行对应分支。
  if (typeof content === 'string') return prefix + content
  // i筛选`content.findLastIndex`，供远程桥接会话后续处理使用。
  const i = content.findLastIndex(b => b.type === 'text')
  // `i` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (i !== -1) {
    // b保存`content[i]!`，供远程桥接会话远程桥接 inbound Attachments后续判断或输出使用。
    const b = content[i]!
    // 当 `b.type` 匹配 `'text'` 时，远程桥接会话执行对应分支。
    if (b.type === 'text') {
      // 返回列表结果，保留远程桥接会话已经排好的条目顺序。
      return [
        ...content.slice(0, i),
        { ...b, text: prefix + b.text },
        ...content.slice(i + 1),
      ]
    }
  }
  // No text block — append one at the end so it's last.
  // 返回列表结果，保留远程桥接会话已经排好的条目顺序。
  return [...content, { type: 'text', text: prefix.trimEnd() }]
}

/**
 * Convenience: extract + resolve + prepend. No-op when the message has no
 * file_attachments field (fast path — no network, returns same reference).
 */
// resolveAndPrepend 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveAndPrepend(
  msg: unknown,
  content: string | Array<ContentBlockParam>,
): Promise<string | Array<ContentBlockParam>> {
  // attachments 集合保存`extractInboundAttachments`，供远程桥接会话后续处理使用。
  const attachments = extractInboundAttachments(msg)
  // attachments 集合为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
  if (attachments.length === 0) return content
  // prefix读取`resolveInboundAttachments`，供远程桥接会话后续处理使用。
  const prefix = await resolveInboundAttachments(attachments)
  // 返回 `prependPathRefs(content, prefix)`，作为远程桥接会话这次计算的结果。
  return prependPathRefs(content, prefix)
}

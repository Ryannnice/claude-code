/**
 * Upload BriefTool attachments to private_api so web viewers can preview them.
 *
 * When the repl bridge is active, attachment paths are meaningless to a web
 * viewer (they're on Claude's machine). We upload to /api/oauth/file_upload —
 * the same store MessageComposer/SpaceMessage render from — and stash the
 * returned file_uuid alongside the path. Web resolves file_uuid → preview;
 * desktop/local try path first.
 *
 * Best-effort: any failure (no token, bridge off, network error, 4xx) logs
 * debug and returns undefined. The attachment still carries {path, size,
 * isImage}, so local-terminal and same-machine-desktop render unaffected.
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, extname } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'

// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getBridgeAccessToken,
  getBridgeBaseUrlOverride,
} from '../../bridge/bridgeConfig.js'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'

// Matches the private_api backend limit
// MAX_UPLOAD_BYTES 集合保存`30 * 1024 * 1024`，供后续判断或组装使用。
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024

// UPLOAD_TIMEOUT_MS 集合 命名 `30_000`，让后续代码直接表达这个值的用途。
const UPLOAD_TIMEOUT_MS = 30_000

// Backend dispatches on mime: image/* → upload_image_wrapped (writes
// PREVIEW/THUMBNAIL, no ORIGINAL), everything else → upload_generic_file
// (ORIGINAL only, no preview). Only whitelist raster formats the
// transcoder reliably handles — svg/bmp/ico risk a 400, and pdf routes
// to upload_pdf_file_wrapped which also skips ORIGINAL. Dispatch
// viewers use /preview for images and /contents for everything else,
// so images go image/* and the rest go octet-stream.
// MIME_BY_EXT 集中保存工具实现 upload要一起传递的字段。
const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

// guessMimeType 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function guessMimeType(filename: string): string {
  // ext保存`extname`，供工具调用后续处理使用。
  const ext = extname(filename).toLowerCase()
  // 返回 `MIME_BY_EXT[ext] ?? 'application/octet-stream'`，作为工具调用这次计算的结果。
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

// debug 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function debug(msg: string): void {
  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[brief:upload] ${msg}`)
}

/**
 * Base URL for uploads. Must match the host the token is valid for.
 *
 * Subprocess hosts (cowork) pass ANTHROPIC_BASE_URL alongside
 * CLAUDE_CODE_OAUTH_TOKEN — prefer that since getOauthConfig() only
 * returns staging when USE_STAGING_OAUTH is set, which such hosts don't
 * set. Without this a staging token hits api.anthropic.com → 401 → silent
 * skip → web viewer sees inert cards with no file_uuid.
 */
// getBridgeBaseUrl 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBridgeBaseUrl(): string {
  // 返回 `(`，作为工具调用这次计算的结果。
  return (
    getBridgeBaseUrlOverride() ??
    process.env.ANTHROPIC_BASE_URL ??
    getOauthConfig().BASE_API_URL
  )
}

// /api/oauth/file_upload returns one of ChatMessage{Image,Blob,Document}FileSchema.
// All share file_uuid; that's the only field we need.
// uploadResponseSchema 响应数据保存`lazySchema`，供工具调用后续处理使用。
const uploadResponseSchema = lazySchema(() =>
  z.object({ file_uuid: z.string() }),
)

// BriefUploadContext 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type BriefUploadContext = {
  replBridgeEnabled: boolean
  signal?: AbortSignal
}

/**
 * Upload a single attachment. Returns file_uuid on success, undefined otherwise.
 * Every early-return is intentional graceful degradation.
 */
// uploadBriefAttachment 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function uploadBriefAttachment(
  fullPath: string,
  size: number,
  ctx: BriefUploadContext,
): Promise<string | undefined> {
  // Positive pattern so bun:bundle eliminates the entire body from
  // non-BRIDGE_MODE builds (negative `if (!feature(...)) return` does not).
  // 满足 `feature('BRIDGE_MODE')` 时，工具调用执行该分支。
  if (feature('BRIDGE_MODE')) {
    // ctx.replBridgeEnabled缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!ctx.replBridgeEnabled) return undefined

    // 满足 `size > MAX_UPLOAD_BYTES` 时，工具调用执行该分支。
    if (size > MAX_UPLOAD_BYTES) {
      // 调用 debug，触发工具调用此处需要的副作用。
      debug(`skip ${fullPath}: ${size} bytes exceeds ${MAX_UPLOAD_BYTES} limit`)
      // 返回 `undefined`，作为工具调用这次计算的结果。
      return undefined
    }

    // token读取`getBridgeAccessToken`，供工具调用后续处理使用。
    const token = getBridgeAccessToken()
    // token缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!token) {
      // 调用 debug，触发工具调用此处需要的副作用。
      debug('skip: no oauth token')
      // 返回 `undefined`，作为工具调用这次计算的结果。
      return undefined
    }

    // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
    let content: Buffer
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 文本内容更新为 `await readFile(fullPath)`，确保工具调用后续读取最新状态。
      content = await readFile(fullPath)
    } catch (e) {
      // 调用 debug，触发工具调用此处需要的副作用。
      debug(`read failed for ${fullPath}: ${e}`)
      // 返回 `undefined`，作为工具调用这次计算的结果。
      return undefined
    }

    // baseUrl读取`getBridgeBaseUrl`，供工具调用后续处理使用。
    const baseUrl = getBridgeBaseUrl()
    // URL 命名 ``${baseUrl}/api/oauth/file_upload``，让后续代码直接表达这个值的用途。
    const url = `${baseUrl}/api/oauth/file_upload`
    // 文件名保存`basename`，供工具调用后续处理使用。
    const filename = basename(fullPath)
    // mimeType保存`guessMimeType`，供工具调用后续处理使用。
    const mimeType = guessMimeType(filename)
    // boundary保存`randomUUID`，供工具调用后续处理使用。
    const boundary = `----FormBoundary${randomUUID()}`

    // Manual multipart — same pattern as filesApi.ts. The oauth endpoint takes
    // a single "file" part (no "purpose" field like the public Files API).
    // 请求体保存`Buffer.concat`，供工具调用后续处理使用。
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
          `Content-Type: ${mimeType}\r\n\r\n`,
      ),
      content,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ])

    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应保存`axios.post`，供工具调用后续处理使用。
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length.toString(),
        },
        timeout: UPLOAD_TIMEOUT_MS,
        signal: ctx.signal,
        // 这个回调绑定到 validateStatus: () => true,，负责工具调用在该局部场景下的响应。
        validateStatus: () => true,
      })

      // `response.status` 与 `201` 不一致时刷新派生状态，避免使用过期结果。
      if (response.status !== 201) {
        // 调用 debug，触发工具调用此处需要的副作用。
        debug(
          `upload failed for ${fullPath}: status=${response.status} body=${jsonStringify(response.data).slice(0, 200)}`,
        )
        // 返回 `undefined`，作为工具调用这次计算的结果。
        return undefined
      }

      // 解析结果读取`uploadResponseSchema`，供工具调用后续处理使用。
      const parsed = uploadResponseSchema().safeParse(response.data)
      // parsed.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!parsed.success) {
        // 调用 debug，触发工具调用此处需要的副作用。
        debug(
          `unexpected response shape for ${fullPath}: ${parsed.error.message}`,
        )
        // 返回 `undefined`，作为工具调用这次计算的结果。
        return undefined
      }

      // 调用 debug，触发工具调用此处需要的副作用。
      debug(`uploaded ${fullPath} → ${parsed.data.file_uuid} (${size} bytes)`)
      // 返回 `parsed.data.file_uuid`，作为工具调用这次计算的结果。
      return parsed.data.file_uuid
    } catch (e) {
      // 调用 debug，触发工具调用此处需要的副作用。
      debug(`upload threw for ${fullPath}: ${e}`)
      // 返回 `undefined`，作为工具调用这次计算的结果。
      return undefined
    }
  }
  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

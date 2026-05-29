/**
 * Shared attachment validation + resolution for SendUserMessage and
 * SendUserFile. Lives in BriefTool/ so the dynamic `./upload.js` import
 * inside the feature('BRIDGE_MODE') guard stays relative and upload.ts
 * (axios, crypto, auth utils) remains tree-shakeable from non-bridge builds.
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'

// 类型依赖 { ValidationResult } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ValidationResult } from '../../Tool.js'

// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { getErrnoCode } from '../../utils/errors.js'
// 复用 IMAGE_EXTENSION_REGEX 工具函数，把通用处理留在 ../../utils/imagePaste.js 中维护。
import { IMAGE_EXTENSION_REGEX } from '../../utils/imagePaste.js'
// 复用 expandPath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath } from '../../utils/path.js'

// ResolvedAttachment 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type ResolvedAttachment = {
  path: string
  size: number
  isImage: boolean
  file_uuid?: string
}

// validateAttachmentPaths 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateAttachmentPaths(
  rawPaths: string[],
): Promise<ValidationResult> {
  // cwd读取`getCwd`，供工具调用后续处理使用。
  const cwd = getCwd()
  // 按顺序遍历 `rawPaths` 中的rawPath 路径数据，逐个交给工具调用处理。
  for (const rawPath of rawPaths) {
    // fullPath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const fullPath = expandPath(rawPath)
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // stats 集合保存`stat`，供工具调用后续处理使用。
      const stats = await stat(fullPath)
      // 满足 `!stats.isFile()` 时，工具调用执行该分支。
      if (!stats.isFile()) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Attachment "${rawPath}" is not a regular file.`,
          errorCode: 1,
        }
      }
    } catch (e) {
      // code读取`getErrnoCode`，供工具调用后续处理使用。
      const code = getErrnoCode(e)
      // 当 `code` 匹配 `'ENOENT'` 时，工具调用执行对应分支。
      if (code === 'ENOENT') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Attachment "${rawPath}" does not exist. Current working directory: ${cwd}.`,
          errorCode: 1,
        }
      }
      // 当 `code` 匹配 `'EACCES' || code === 'EPERM'` 时，工具调用执行对应分支。
      if (code === 'EACCES' || code === 'EPERM') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          result: false,
          message: `Attachment "${rawPath}" is not accessible (permission denied).`,
          errorCode: 1,
        }
      }
      // 抛出 e，阻止工具调用在无效状态下继续运行。
      throw e
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { result: true }
}

// resolveAttachments 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function resolveAttachments(
  rawPaths: string[],
  uploadCtx: { replBridgeEnabled: boolean; signal?: AbortSignal },
): Promise<ResolvedAttachment[]> {
  // Stat serially (local, fast) to keep ordering deterministic, then upload
  // in parallel (network, slow). Upload failures resolve undefined — the
  // attachment still carries {path, size, isImage} for local renderers.
  // stated 状态 从空数组开始收集，后续循环会按处理顺序追加条目。
  const stated: ResolvedAttachment[] = []
  // 按顺序遍历 `rawPaths` 中的rawPath 路径数据，逐个交给工具调用处理。
  for (const rawPath of rawPaths) {
    // fullPath 路径数据保存`expandPath`，供工具调用后续处理使用。
    const fullPath = expandPath(rawPath)
    // Single stat — we need size, so this is the operation, not a guard.
    // validateInput ran before us, but the file could have moved since
    // (TOCTOU); if it did, let the error propagate so the model sees it.
    // stats 集合保存`stat`，供工具调用后续处理使用。
    const stats = await stat(fullPath)
    // stated 状态追加新条目，保持收集顺序与输入顺序一致。
    stated.push({
      path: fullPath,
      size: stats.size,
      isImage: IMAGE_EXTENSION_REGEX.test(fullPath),
    })
  }
  // Dynamic import inside the feature() guard so upload.ts (axios, crypto,
  // zod, auth utils, MIME map) is fully eliminated from non-BRIDGE_MODE
  // builds. A static import would force module-scope evaluation regardless
  // of the guard inside uploadBriefAttachment — CLAUDE.md: "helpers defined
  // outside remain in the build even if never called".
  // 满足 `feature('BRIDGE_MODE')` 时，工具调用执行该分支。
  if (feature('BRIDGE_MODE')) {
    // Headless/SDK callers never set appState.replBridgeEnabled (only the TTY
    // REPL does, at main.tsx init). CLAUDE_CODE_BRIEF_UPLOAD lets a host that
    // runs the CLI as a subprocess opt in — e.g. the cowork desktop bridge,
    // which already passes CLAUDE_CODE_OAUTH_TOKEN for auth.
    // shouldUpload 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const shouldUpload =
      uploadCtx.replBridgeEnabled ||
      isEnvTruthy(process.env.CLAUDE_CODE_BRIEF_UPLOAD)
    // 从 `await import('./upload.js')` 解构 uploadBriefAttachment，减少工具实现 attachments对同一对象的重复访问。
    const { uploadBriefAttachment } = await import('./upload.js')
    // uuids 集合保存`Promise.all`，供工具调用后续处理使用。
    const uuids = await Promise.all(
      // 调用 stated.map，触发工具调用此处需要的副作用。
      stated.map(a =>
        uploadBriefAttachment(a.path, a.size, {
          replBridgeEnabled: shouldUpload,
          signal: uploadCtx.signal,
        }),
      ),
    )
    // 返回 `stated.map((a, i) =>`，作为工具调用这次计算的结果。
    return stated.map((a, i) =>
      uuids[i] === undefined ? a : { ...a, file_uuid: uuids[i] },
    )
  }
  // 返回 `stated`，作为工具调用这次计算的结果。
  return stated
}

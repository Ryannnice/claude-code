// 类型依赖 { McpbManifest } 来自 @anthropic-ai/mcpb，用于校准共享工具的数据契约。
import type { McpbManifest } from '@anthropic-ai/mcpb'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 jsonParse，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from '../slowOperations.js'

/**
 * Parses and validates a DXT manifest from a JSON object.
 *
 * Lazy-imports @anthropic-ai/mcpb: that package uses zod v3 which eagerly
 * creates 24 .bind(this) closures per schema instance (~300 instances between
 * schemas.js and schemas-loose.js). Deferring the import keeps ~700KB of bound
 * closures out of the startup heap for sessions that never touch .dxt/.mcpb.
 */
// validateManifest 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateManifest(
  manifestJson: unknown,
): Promise<McpbManifest> {
  // 从 `await import('@anthropic-ai/mcpb')` 解构 McpbManifestSchema，减少共享工具 helpers对同一对象的重复访问。
  const { McpbManifestSchema } = await import('@anthropic-ai/mcpb')
  // parseResult保存`McpbManifestSchema.safeParse`，供共享工具后续处理使用。
  const parseResult = McpbManifestSchema.safeParse(manifestJson)

  // parseResult.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parseResult.success) {
    // 错误列表保存`error.flatten`，供共享工具后续处理使用。
    const errors = parseResult.error.flatten()
    // errorMessages 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
    const errorMessages = [
      ...Object.entries(errors.fieldErrors).map(
        // 这个回调绑定到 ([field, errs]) => `${field}: ${errs?.join(', ')}`,，负责共享工具在该局部场景下的响应。
        ([field, errs]) => `${field}: ${errs?.join(', ')}`,
      ),
      ...(errors.formErrors || []),
    ]
      .filter(Boolean)
      .join('; ')

    // 抛出 new Error(`Invalid manifest: ${errorMessages}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Invalid manifest: ${errorMessages}`)
  }

  // 返回 `parseResult.data`，作为共享工具这次计算的结果。
  return parseResult.data
}

/**
 * Parses and validates a DXT manifest from raw text data.
 */
// parseAndValidateManifestFromText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function parseAndValidateManifestFromText(
  manifestText: string,
): Promise<McpbManifest> {
  // manifestJson 先占位，稍后的条件分支会根据实际输入补齐它。
  let manifestJson: unknown

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // manifestJson更新为 `jsonParse(manifestText)`，确保共享工具后续读取最新状态。
    manifestJson = jsonParse(manifestText)
  } catch (error) {
    // 抛出 new Error(`Invalid JSON in manifest.json: ${errorMessage(error)}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Invalid JSON in manifest.json: ${errorMessage(error)}`)
  }

  // 返回 `validateManifest(manifestJson)`，作为共享工具这次计算的结果。
  return validateManifest(manifestJson)
}

/**
 * Parses and validates a DXT manifest from raw binary data.
 */
// parseAndValidateManifestFromBytes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function parseAndValidateManifestFromBytes(
  manifestData: Uint8Array,
): Promise<McpbManifest> {
  // manifestText保存`TextDecoder`，供共享工具后续处理使用。
  const manifestText = new TextDecoder().decode(manifestData)
  // 返回 `parseAndValidateManifestFromText(manifestText)`，作为共享工具这次计算的结果。
  return parseAndValidateManifestFromText(manifestText)
}

/**
 * Generates an extension ID from author name and extension name.
 * Uses the same algorithm as the directory backend for consistency.
 */
// generateExtensionId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateExtensionId(
  manifest: McpbManifest,
  prefix?: 'local.unpacked' | 'local.dxt',
): string {
  // sanitize封装成回调，供共享工具 helpers在事件触发或异步步骤中调用。
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_.]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')

  // authorName保存`manifest.author.name`，供共享工具 helpers后续判断或输出使用。
  const authorName = manifest.author.name
  // extensionName 命名 `manifest.name`，让后续代码直接表达这个值的用途。
  const extensionName = manifest.name

  // sanitizedAuthor保存`sanitize`，供共享工具后续处理使用。
  const sanitizedAuthor = sanitize(authorName)
  // sanitizedName保存`sanitize`，供共享工具后续处理使用。
  const sanitizedName = sanitize(extensionName)

  // 返回 `prefix`，作为共享工具这次计算的结果。
  return prefix
    ? `${prefix}.${sanitizedAuthor}.${sanitizedName}`
    : `${sanitizedAuthor}.${sanitizedName}`
}

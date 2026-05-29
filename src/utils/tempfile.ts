// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash, randomUUID } from 'crypto'
// 引入 tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { tmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'

/**
 * Generate a temporary file path.
 *
 * @param prefix Optional prefix for the temp file name
 * @param extension Optional file extension (defaults to '.md')
 * @param options.contentHash When provided, the identifier is derived from a
 *   SHA-256 hash of this string (first 16 hex chars). This produces a path
 *   that is stable across process boundaries — any process with the same
 *   content will get the same path. Use this when the path ends up in content
 *   sent to the Anthropic API (e.g., sandbox deny lists in tool descriptions),
 *   because a random UUID would change on every subprocess spawn and
 *   invalidate the prompt cache prefix.
 * @returns Temp file path
 */
// generateTempFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateTempFilePath(
  prefix: string = 'claude-prompt',
  extension: string = '.md',
  options?: { contentHash?: string },
): string {
  // 标识符 命名 `options?.contentHash`，让后续代码直接表达这个值的用途。
  const id = options?.contentHash
    ? createHash('sha256')
        .update(options.contentHash)
        .digest('hex')
        .slice(0, 16)
    : randomUUID()
  // 返回 `join(tmpdir(), `${prefix}-${id}${extension}`)`，作为共享工具这次计算的结果。
  return join(tmpdir(), `${prefix}-${id}${extension}`)
}

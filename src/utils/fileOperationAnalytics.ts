// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 src/services/analytics/index.js，用于校准共享工具的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from 'src/services/analytics/index.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'

/**
 * Creates a truncated SHA256 hash (16 chars) for file paths
 * Used for privacy-preserving analytics on file operations
 */
// hashFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hashFilePath(
  filePath: string,
): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  // 返回 `createHash('sha256')`，作为共享工具这次计算的结果。
  return createHash('sha256')
    .update(filePath)
    .digest('hex')
    .slice(0, 16) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Creates a full SHA256 hash (64 chars) for file contents
 * Used for deduplication and change detection analytics
 */
// hashFileContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hashFileContent(
  content: string,
): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  // 返回 `createHash('sha256')`，作为共享工具这次计算的结果。
  return createHash('sha256')
    .update(content)
    .digest('hex') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

// Maximum content size to hash (100KB)
// Prevents memory exhaustion when hashing large files (e.g., base64-encoded images)
// MAX_CONTENT_HASH_SIZE保存`100 * 1024`，供共享工具 file Operation Analytics后续判断或输出使用。
const MAX_CONTENT_HASH_SIZE = 100 * 1024

/**
 * Logs file operation analytics to Statsig
 */
// logFileOperation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logFileOperation(params: {
  operation: 'read' | 'write' | 'edit'
  tool: 'FileReadTool' | 'FileWriteTool' | 'FileEditTool'
  filePath: string
  content?: string
  type?: 'create' | 'update'
}): void {
  // metadata 先占位，稍后的条件分支会根据实际输入补齐它。
  const metadata: Record<
    string,
    | AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    | number
    | boolean
  > = {
    operation:
      params.operation as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    tool: params.tool as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    filePathHash: hashFilePath(params.filePath),
  }

  // Only hash content if it's provided and below size limit
  // This prevents memory exhaustion from hashing large files (e.g., base64-encoded images)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    params.content !== undefined &&
    params.content.length <= MAX_CONTENT_HASH_SIZE
  ) {
    // contentHash更新为 `hashFileContent(params.content)`，确保共享工具后续读取最新状态。
    metadata.contentHash = hashFileContent(params.content)
  }

  // `params.type` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (params.type !== undefined) {
    // 共享工具 file Operation Analytics在这里处理 `metadata.type =`，完成这一小步状态转换。
    metadata.type =
      params.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_file_operation', metadata)
}

// 引入 envPaths，将 env-paths 中已经封装好的能力接到本文件流程里。
import envPaths from 'env-paths'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 djb2Hash，将 ./hash.js 中已经封装好的能力接到本文件流程里。
import { djb2Hash } from './hash.js'

// 路径列表保存`envPaths`，供共享工具后续处理使用。
const paths = envPaths('claude-cli')

// Local sanitizePath using djb2Hash — NOT the shared version from
// sessionStoragePortable.ts which uses Bun.hash (wyhash) when available.
// Cache directory names must remain stable across upgrades so existing cache
// data (error logs, MCP logs) is not orphaned.
// MAX_SANITIZED_LENGTH 数量保存`200`，供后续判断或组装使用。
const MAX_SANITIZED_LENGTH = 200
// sanitizePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizePath(name: string): string {
  // sanitized格式化`name.replace`，供共享工具后续处理使用。
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, '-')
  // 满足 `sanitized.length <= MAX_SANITIZED_LENGTH` 时，共享工具执行该分支。
  if (sanitized.length <= MAX_SANITIZED_LENGTH) {
    // 返回 `sanitized`，作为共享工具这次计算的结果。
    return sanitized
  }
  // 返回 ``${sanitized.slice(0, MAX_SANITIZED_LENGTH)}-${Math.abs(djb2Hash(name))...`，作为共享工具这次计算的结果。
  return `${sanitized.slice(0, MAX_SANITIZED_LENGTH)}-${Math.abs(djb2Hash(name)).toString(36)}`
}

// getProjectDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getProjectDir(cwd: string): string {
  // 返回 `sanitizePath(cwd)`，作为共享工具这次计算的结果。
  return sanitizePath(cwd)
}

// CACHE_PATHS 路径数据集中保存共享工具 cache Paths要一起传递的字段。
export const CACHE_PATHS = {
  // 这个回调绑定到 baseLogs: () => join(paths.cache, getProjectDir(getFsImplementation().cwd())),，负责共享工具在该局部场景下的响应。
  baseLogs: () => join(paths.cache, getProjectDir(getFsImplementation().cwd())),
  // 这个回调绑定到 errors: () =>，负责共享工具在该局部场景下的响应。
  errors: () =>
    join(paths.cache, getProjectDir(getFsImplementation().cwd()), 'errors'),
  // 这个回调绑定到 messages: () =>，负责共享工具在该局部场景下的响应。
  messages: () =>
    join(paths.cache, getProjectDir(getFsImplementation().cwd()), 'messages'),
  // 这个回调绑定到 mcpLogs: (serverName: string) =>，负责共享工具在该局部场景下的响应。
  mcpLogs: (serverName: string) =>
    join(
      paths.cache,
      getProjectDir(getFsImplementation().cwd()),
      // Sanitize server name for Windows compatibility (colons are reserved for drive letters)
      `mcp-logs-${sanitizePath(serverName)}`,
    ),
}

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'

// RegistryServer 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type RegistryServer = {
  server: {
    remotes?: Array<{ url: string }>
  }
}

// RegistryResponse 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type RegistryResponse = {
  servers: RegistryServer[]
}

// URLs stripped of query string and trailing slash — matches the normalization
// done by getLoggingSafeMcpBaseUrl so direct Set.has() lookup works.
// officialUrls 集合初始化为未定义值，后续分支会在有数据时补齐。
let officialUrls: Set<string> | undefined = undefined

// normalizeUrl 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizeUrl(url: string): string | undefined {
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // u保存`URL`，供MCP 服务后续处理使用。
    const u = new URL(url)
    // search更新为 `''`，确保MCP 服务后续读取最新状态。
    u.search = ''
    // 返回 `u.toString().replace(/\/$/, '')`，作为MCP 服务这次计算的结果。
    return u.toString().replace(/\/$/, '')
  } catch {
    // 返回 `undefined`，作为MCP 服务这次计算的结果。
    return undefined
  }
}

/**
 * Fire-and-forget fetch of the official MCP registry.
 * Populates officialUrls for isOfficialMcpUrl lookups.
 */
// prefetchOfficialMcpUrls 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function prefetchOfficialMcpUrls(): Promise<void> {
  // 满足 `process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAF` 时，MCP 服务执行该分支。
  if (process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    // MCP 服务 official Registry在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应 等待 `axios.get<RegistryResponse>(`，确保继续执行前已有结果。
    const response = await axios.get<RegistryResponse>(
      'https://api.anthropic.com/mcp-registry/v0/servers?version=latest&visibility=commercial',
      { timeout: 5000 },
    )

    // urls 集合构建`new Set<string>()` 整理出中间结果，供MCP 服务MCP 服务 official Registry后续步骤使用。
    const urls = new Set<string>()
    // 按顺序遍历 `response.data.servers` 中的entry，逐个交给MCP 服务处理。
    for (const entry of response.data.servers) {
      // 按顺序遍历 `entry.server.remotes ?? []` 中的remote，逐个交给MCP 服务处理。
      for (const remote of entry.server.remotes ?? []) {
        // normalized保存`normalizeUrl`，供MCP 服务后续处理使用。
        const normalized = normalizeUrl(remote.url)
        // 满足 `normalized` 时，MCP 服务执行该分支。
        if (normalized) {
          // 调用 urls.add，触发MCP 服务此处需要的副作用。
          urls.add(normalized)
        }
      }
    }
    // officialUrls 集合更新为 `urls`，确保MCP 服务后续读取最新状态。
    officialUrls = urls
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[mcp-registry] Loaded ${urls.size} official MCP URLs`)
  } catch (error) {
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to fetch MCP registry: ${errorMessage(error)}`, {
      level: 'error',
    })
  }
}

/**
 * Returns true iff the given (already-normalized via getLoggingSafeMcpBaseUrl)
 * URL is in the official MCP registry. Undefined registry → false (fail-closed).
 */
// isOfficialMcpUrl 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOfficialMcpUrl(normalizedUrl: string): boolean {
  // 返回 `officialUrls?.has(normalizedUrl) ?? false`，作为MCP 服务这次计算的结果。
  return officialUrls?.has(normalizedUrl) ?? false
}

// resetOfficialMcpUrlsForTesting 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetOfficialMcpUrlsForTesting(): void {
  // officialUrls 集合更新为 `undefined`，确保MCP 服务后续读取最新状态。
  officialUrls = undefined
}

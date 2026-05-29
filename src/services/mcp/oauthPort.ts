/**
 * OAuth redirect port helpers — extracted from auth.ts to break the
 * auth.ts ↔ xaaIdpLogin.ts circular dependency.
 */
// 引入 createServer，将 http 中已经封装好的能力接到本文件流程里。
import { createServer } from 'http'
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js'

// Windows dynamic port range 49152-65535 is reserved
// REDIRECT_PORT_RANGE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const REDIRECT_PORT_RANGE =
  getPlatform() === 'windows'
    ? { min: 39152, max: 49151 }
    : { min: 49152, max: 65535 }
// REDIRECT_PORT_FALLBACK 命名 `3118`，让后续代码直接表达这个值的用途。
const REDIRECT_PORT_FALLBACK = 3118

/**
 * Builds a redirect URI on localhost with the given port and a fixed `/callback` path.
 *
 * RFC 8252 Section 7.3 (OAuth for Native Apps): loopback redirect URIs match any
 * port as long as the path matches.
 */
// buildRedirectUri 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildRedirectUri(
  port: number = REDIRECT_PORT_FALLBACK,
): string {
  // 返回 ``http://localhost:${port}/callback``，作为MCP 服务这次计算的结果。
  return `http://localhost:${port}/callback`
}

// getMcpOAuthCallbackPort 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMcpOAuthCallbackPort(): number | undefined {
  // port解析`parseInt`，供MCP 服务后续处理使用。
  const port = parseInt(process.env.MCP_OAUTH_CALLBACK_PORT || '', 10)
  // 返回 `port > 0 ? port : undefined`，作为MCP 服务这次计算的结果。
  return port > 0 ? port : undefined
}

/**
 * Finds an available port in the specified range for OAuth redirect
 * Uses random selection for better security
 */
// findAvailablePort 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findAvailablePort(): Promise<number> {
  // First, try the configured port if specified
  // configuredPort 配置读取`getMcpOAuthCallbackPort`，供MCP 服务后续处理使用。
  const configuredPort = getMcpOAuthCallbackPort()
  // 满足 `configuredPort` 时，MCP 服务执行该分支。
  if (configuredPort) {
    // 返回 `configuredPort`，作为MCP 服务这次计算的结果。
    return configuredPort
  }

  // 从 `REDIRECT_PORT_RANGE` 解构 min、max，减少MCP 服务 oauth Port对同一对象的重复访问。
  const { min, max } = REDIRECT_PORT_RANGE
  // range保存`max - min + 1`，供后续判断或组装使用。
  const range = max - min + 1
  // maxAttempts 集合保存`Math.min`，供MCP 服务后续处理使用。
  const maxAttempts = Math.min(range, 100) // Don't try forever

  // 按索引扫描 `maxAttempts`，需要消费相邻参数时可以精确移动游标。
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // port保存`Math.floor`，供MCP 服务后续处理使用。
    const port = min + Math.floor(Math.random() * range)

    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 这个回调绑定到 await new Promise<void>((resolve, reject) => {，负责MCP 服务在该局部场景下的响应。
      await new Promise<void>((resolve, reject) => {
        // testServer构建`createServer`，供MCP 服务后续处理使用。
        const testServer = createServer()
        // 调用 testServer.once，触发MCP 服务此处需要的副作用。
        testServer.once('error', reject)
        // 调用 testServer.listen，触发MCP 服务此处需要的副作用。
        testServer.listen(port, () => {
          // 调用 testServer.close，触发MCP 服务此处需要的副作用。
          testServer.close(() => resolve())
        })
      })
      // 返回 `port`，作为MCP 服务这次计算的结果。
      return port
    } catch {
      // Port in use, try another random port
      // 跳过当前项，继续处理MCP 服务中的下一轮循环。
      continue
    }
  }

  // If random selection failed, try the fallback port
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 这个回调绑定到 await new Promise<void>((resolve, reject) => {，负责MCP 服务在该局部场景下的响应。
    await new Promise<void>((resolve, reject) => {
      // testServer构建`createServer`，供MCP 服务后续处理使用。
      const testServer = createServer()
      // 调用 testServer.once，触发MCP 服务此处需要的副作用。
      testServer.once('error', reject)
      // 调用 testServer.listen，触发MCP 服务此处需要的副作用。
      testServer.listen(REDIRECT_PORT_FALLBACK, () => {
        // 调用 testServer.close，触发MCP 服务此处需要的副作用。
        testServer.close(() => resolve())
      })
    })
    // 返回 `REDIRECT_PORT_FALLBACK`，作为MCP 服务这次计算的结果。
    return REDIRECT_PORT_FALLBACK
  } catch {
    // 抛出 new Error(`No available ports for OAuth redirect`)，阻止MCP 服务在无效状态下继续运行。
    throw new Error(`No available ports for OAuth redirect`)
  }
}

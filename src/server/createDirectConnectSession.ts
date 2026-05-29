/* eslint-disable eslint-plugin-n/no-unsupported-features/node-builtins */

// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'
// 类型依赖 { DirectConnectConfig } 来自 ./directConnectManager.js，用于校准create Direct Connect Session的数据契约。
import type { DirectConnectConfig } from './directConnectManager.js'
// 引入 connectResponseSchema，将 ./types.js 中已经封装好的能力接到本文件流程里。
import { connectResponseSchema } from './types.js'

/**
 * Errors thrown by createDirectConnectSession when the connection fails.
 */
// DirectConnectError 聚合create Direct Connect Session相关状态与操作，把同一职责的行为收束到类实例中。
export class DirectConnectError extends Error {
  // 构造函数接收 message: string，把外部输入整理成实例可复用的内部状态。
  constructor(message: string) {
    // 调用 super，触发create Direct Connect Session此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'DirectConnectError'，同步create Direct Connect Session的内部状态。
    this.name = 'DirectConnectError'
  }
}

/**
 * Create a session on a direct-connect server.
 *
 * Posts to `${serverUrl}/sessions`, validates the response, and returns
 * a DirectConnectConfig ready for use by the REPL or headless runner.
 *
 * Throws DirectConnectError on network, HTTP, or response-parsing failures.
 */
// createDirectConnectSession 封装createDirectConnectSession的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createDirectConnectSession({
  serverUrl,
  authToken,
  cwd,
  dangerouslySkipPermissions,
}: {
  serverUrl: string
  authToken?: string
  cwd: string
  dangerouslySkipPermissions?: boolean
}): Promise<{
  config: DirectConnectConfig
  workDir?: string
}> {
  // 请求头 集中保存create Direct Connect Session要一起传递的字段。
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  // 满足 `authToken` 时，create Direct Connect Session执行该分支。
  if (authToken) {
    // headers['authorization'更新为 ``Bearer ${authToken}``，确保create Direct Connect Session后续读取最新状态。
    headers['authorization'] = `Bearer ${authToken}`
  }

  // resp 先占位，稍后的条件分支会根据实际输入补齐它。
  let resp: Response
  // 保护这一段可能失败的create Direct Connect Session操作，确保异常能进入相邻错误处理。
  try {
    // resp更新为 `await fetch(`${serverUrl}/sessions`, {`，确保createDirectConnectSession后续读取最新状态。
    resp = await fetch(`${serverUrl}/sessions`, {
      method: 'POST',
      headers,
      body: jsonStringify({
        cwd,
        ...(dangerouslySkipPermissions && {
          dangerously_skip_permissions: true,
        }),
      }),
    })
  } catch (err) {
    // 抛出 new DirectConnectError(，阻止create Direct Connect Session在无效状态下继续运行。
    throw new DirectConnectError(
      `Failed to connect to server at ${serverUrl}: ${errorMessage(err)}`,
    )
  }

  // resp.ok缺失时提前走兜底路径，避免create Direct Connect Session继续依赖无效输入。
  if (!resp.ok) {
    // 抛出 new DirectConnectError(，阻止create Direct Connect Session在无效状态下继续运行。
    throw new DirectConnectError(
      `Failed to create session: ${resp.status} ${resp.statusText}`,
    )
  }

  // 结果保存`connectResponseSchema`，供create Direct Connect Session后续处理使用。
  const result = connectResponseSchema().safeParse(await resp.json())
  // result.success 集合缺失时提前走兜底路径，避免create Direct Connect Session继续依赖无效输入。
  if (!result.success) {
    // 抛出 new DirectConnectError(，阻止create Direct Connect Session在无效状态下继续运行。
    throw new DirectConnectError(
      `Invalid session response: ${result.error.message}`,
    )
  }

  // data保存`result.data`，供create Direct Connect Session后续判断或输出使用。
  const data = result.data
  // 返回结构化结果，集中表达create Direct Connect Session已经整理出的状态。
  return {
    config: {
      serverUrl,
      sessionId: data.session_id,
      wsUrl: data.ws_url,
      authToken,
    },
    workDir: data.work_dir,
  }
}

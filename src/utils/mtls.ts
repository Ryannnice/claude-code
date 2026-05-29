// 类型依赖 * as https 来自 https，用于校准共享工具的数据契约。
import type * as https from 'https'
// 引入 Agent as HttpsAgent，将 https 中已经封装好的能力接到本文件流程里。
import { Agent as HttpsAgent } from 'https'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 类型依赖 * as tls 来自 tls，用于校准共享工具的数据契约。
import type * as tls from 'tls'
// 类型依赖 * as undici 来自 undici，用于校准共享工具的数据契约。
import type * as undici from 'undici'
// 引入 getCACertificates，将 ./caCerts.js 中已经封装好的能力接到本文件流程里。
import { getCACertificates } from './caCerts.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'

// MTLSConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MTLSConfig = {
  cert?: string
  key?: string
  passphrase?: string
}

// TLSConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TLSConfig = MTLSConfig & {
  ca?: string | string[] | Buffer
}

/**
 * Get mTLS configuration from environment variables
 */
// getMTLSConfig 配置保存`memoize`，供共享工具后续处理使用。
export const getMTLSConfig = memoize((): MTLSConfig | undefined => {
  // 配置 从空对象开始收集键值，后续按名称补齐内容。
  const config: MTLSConfig = {}

  // Note: NODE_EXTRA_CA_CERTS is automatically handled by Node.js at runtime
  // We don't need to manually load it - Node.js appends it to the built-in CAs automatically

  // Client certificate
  // 满足 `process.env.CLAUDE_CODE_CLIENT_CERT` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_CLIENT_CERT) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // cert更新为 `getFsImplementation().readFileSync(`，确保共享工具后续读取最新状态。
      config.cert = getFsImplementation().readFileSync(
        process.env.CLAUDE_CODE_CLIENT_CERT,
        { encoding: 'utf8' },
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'mTLS: Loaded client certificate from CLAUDE_CODE_CLIENT_CERT',
      )
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`mTLS: Failed to load client certificate: ${error}`, {
        level: 'error',
      })
    }
  }

  // Client key
  // 满足 `process.env.CLAUDE_CODE_CLIENT_KEY` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_CLIENT_KEY) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // key更新为 `getFsImplementation().readFileSync(`，确保共享工具后续读取最新状态。
      config.key = getFsImplementation().readFileSync(
        process.env.CLAUDE_CODE_CLIENT_KEY,
        { encoding: 'utf8' },
      )
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('mTLS: Loaded client key from CLAUDE_CODE_CLIENT_KEY')
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`mTLS: Failed to load client key: ${error}`, {
        level: 'error',
      })
    }
  }

  // Key passphrase
  // 满足 `process.env.CLAUDE_CODE_CLIENT_KEY_PASSPHRASE` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_CLIENT_KEY_PASSPHRASE) {
    // passphrase更新为 `process.env.CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`，确保共享工具后续读取最新状态。
    config.passphrase = process.env.CLAUDE_CODE_CLIENT_KEY_PASSPHRASE
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('mTLS: Using client key passphrase')
  }

  // Only return config if at least one option is set
  // Object.keys(config) 配置为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (Object.keys(config).length === 0) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 返回 `config`，作为共享工具这次计算的结果。
  return config
})

/**
 * Create an HTTPS agent with mTLS configuration
 */
// getMTLSAgent保存`memoize`，供共享工具后续处理使用。
export const getMTLSAgent = memoize((): HttpsAgent | undefined => {
  // mtlsConfig 配置读取`getMTLSConfig`，供共享工具后续处理使用。
  const mtlsConfig = getMTLSConfig()
  // caCerts 集合读取`getCACertificates`，供共享工具后续处理使用。
  const caCerts = getCACertificates()

  // 只有 `!mtlsConfig && !caCerts` 满足时，共享工具才执行该分支。
  if (!mtlsConfig && !caCerts) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // agentOptions 集合 集中保存共享工具 mtls要一起传递的字段。
  const agentOptions: https.AgentOptions = {
    ...mtlsConfig,
    ...(caCerts && { ca: caCerts }),
    // Enable keep-alive for better performance
    keepAlive: true,
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('mTLS: Creating HTTPS agent with custom certificates')
  // 返回 `new HttpsAgent(agentOptions)`，作为共享工具这次计算的结果。
  return new HttpsAgent(agentOptions)
})

/**
 * Get TLS options for WebSocket connections
 */
// getWebSocketTLSOptions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getWebSocketTLSOptions(): tls.ConnectionOptions | undefined {
  // mtlsConfig 配置读取`getMTLSConfig`，供共享工具后续处理使用。
  const mtlsConfig = getMTLSConfig()
  // caCerts 集合读取`getCACertificates`，供共享工具后续处理使用。
  const caCerts = getCACertificates()

  // 只有 `!mtlsConfig && !caCerts` 满足时，共享工具才执行该分支。
  if (!mtlsConfig && !caCerts) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...mtlsConfig,
    ...(caCerts && { ca: caCerts }),
  }
}

/**
 * Get fetch options with TLS configuration (mTLS + CA certs) for undici
 */
// getTLSFetchOptions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTLSFetchOptions(): {
  tls?: TLSConfig
  dispatcher?: undici.Dispatcher
} {
  // mtlsConfig 配置读取`getMTLSConfig`，供共享工具后续处理使用。
  const mtlsConfig = getMTLSConfig()
  // caCerts 集合读取`getCACertificates`，供共享工具后续处理使用。
  const caCerts = getCACertificates()

  // 只有 `!mtlsConfig && !caCerts` 满足时，共享工具才执行该分支。
  if (!mtlsConfig && !caCerts) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {}
  }

  // tlsConfig 配置 集中保存共享工具 mtls要一起传递的字段。
  const tlsConfig: TLSConfig = {
    ...mtlsConfig,
    ...(caCerts && { ca: caCerts }),
  }

  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { tls: tlsConfig }
  }
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('TLS: Created undici agent with custom certificates')
  // Create a custom undici Agent with TLS options. Lazy-required so that
  // the ~1.5MB undici package is only loaded when mTLS/CA certs are configured.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // undiciMod保存`require`，供共享工具后续处理使用。
  const undiciMod = require('undici') as typeof undici
  // agent保存`undiciMod.Agent`，供共享工具后续处理使用。
  const agent = new undiciMod.Agent({
    connect: {
      cert: tlsConfig.cert,
      key: tlsConfig.key,
      passphrase: tlsConfig.passphrase,
      ...(tlsConfig.ca && { ca: tlsConfig.ca }),
    },
    pipelining: 1,
  })

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { dispatcher: agent }
}

/**
 * Clear the mTLS configuration cache.
 */
// clearMTLSCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearMTLSCache(): void {
  // 调用 getMTLSConfig.cache.clear?.()，完成这一处局部操作。
  getMTLSConfig.cache.clear?.()
  // 调用 getMTLSAgent.cache.clear?.()，完成这一处局部操作。
  getMTLSAgent.cache.clear?.()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Cleared mTLS configuration cache')
}

/**
 * Configure global Node.js TLS settings
 */
// configureGlobalMTLS 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function configureGlobalMTLS(): void {
  // mtlsConfig 配置读取`getMTLSConfig`，供共享工具后续处理使用。
  const mtlsConfig = getMTLSConfig()

  // mtlsConfig 配置缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!mtlsConfig) {
    // 共享工具 mtls在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // NODE_EXTRA_CA_CERTS is automatically handled by Node.js at runtime
  // 满足 `process.env.NODE_EXTRA_CA_CERTS` 时，共享工具执行该分支。
  if (process.env.NODE_EXTRA_CA_CERTS) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'NODE_EXTRA_CA_CERTS detected - Node.js will automatically append to built-in CAs',
    )
  }
}

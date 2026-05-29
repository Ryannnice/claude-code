// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 hasNodeOption，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { hasNodeOption } from './envUtils.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'

/**
 * Load CA certificates for TLS connections.
 *
 * Since setting `ca` on an HTTPS agent replaces the default certificate store,
 * we must always include base CAs (either system or bundled Mozilla) when returning.
 *
 * Returns undefined when no custom CA configuration is needed, allowing the
 * runtime's default certificate handling to apply.
 *
 * Behavior:
 * - Neither NODE_EXTRA_CA_CERTS nor --use-system-ca/--use-openssl-ca set: undefined (runtime defaults)
 * - NODE_EXTRA_CA_CERTS only: bundled Mozilla CAs + extra cert file contents
 * - --use-system-ca or --use-openssl-ca only: system CAs
 * - --use-system-ca + NODE_EXTRA_CA_CERTS: system CAs + extra cert file contents
 *
 * Memoized for performance. Call clearCACertsCache() to invalidate after
 * environment variable changes (e.g., after trust dialog applies settings.json).
 *
 * Reads ONLY `process.env.NODE_EXTRA_CA_CERTS`. `caCertsConfig.ts` populates
 * that env var from settings.json at CLI init; this module stays config-free
 * so `proxy.ts`/`mtls.ts` don't transitively pull in the command registry.
 */
// getCACertificates 集合保存`memoize`，供共享工具后续处理使用。
export const getCACertificates = memoize((): string[] | undefined => {
  // useSystemCA 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const useSystemCA =
    hasNodeOption('--use-system-ca') || hasNodeOption('--use-openssl-ca')

  // extraCertsPath 路径数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const extraCertsPath = process.env.NODE_EXTRA_CA_CERTS

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `CA certs: useSystemCA=${useSystemCA}, extraCertsPath=${extraCertsPath}`,
  )

  // If neither is set, return undefined (use runtime defaults, no override)
  // 只有 `!useSystemCA && !extraCertsPath` 满足时，共享工具才执行该分支。
  if (!useSystemCA && !extraCertsPath) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Deferred load: Bun's node:tls module eagerly materializes ~150 Mozilla
  // root certificates (~750KB heap) on import, even if tls.rootCertificates
  // is never accessed. Most users hit the early return above, so we only
  // pay this cost when custom CA handling is actually needed.
  /* eslint-disable @typescript-eslint/no-require-imports */
  // tls 集合保存`require`，供共享工具后续处理使用。
  const tls = require('tls') as typeof import('tls')
  /* eslint-enable @typescript-eslint/no-require-imports */

  // certs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const certs: string[] = []

  // 满足 `useSystemCA` 时，共享工具执行该分支。
  if (useSystemCA) {
    // Load system CA store (Bun API)
    // getCACerts 集合保存`(`，供共享工具 ca Certs后续判断或输出使用。
    const getCACerts = (
      tls as typeof tls & { getCACertificates?: (type: string) => string[] }
    ).getCACertificates
    // systemCAs 集合读取`getCACerts?.('system')` 整理出中间结果，供共享工具 ca Certs后续步骤使用。
    const systemCAs = getCACerts?.('system')
    // 只有 `systemCAs && systemCAs.length > 0` 满足时，共享工具才执行该分支。
    if (systemCAs && systemCAs.length > 0) {
      // certs 集合追加新条目，保持收集顺序与输入顺序一致。
      certs.push(...systemCAs)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `CA certs: Loaded ${certs.length} system CA certificates (--use-system-ca)`,
      )
    // 共享工具 ca Certs在这里处理 `} else if (!getCACerts && !extraCertsPath) {`，完成这一小步状态转换。
    } else if (!getCACerts && !extraCertsPath) {
      // Under Node.js where getCACertificates doesn't exist and no extra certs,
      // return undefined to let Node.js handle --use-system-ca natively.
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'CA certs: --use-system-ca set but system CA API unavailable, deferring to runtime',
      )
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    } else {
      // System CA API returned empty or unavailable; fall back to bundled root certs
      // certs 集合追加新条目，保持收集顺序与输入顺序一致。
      certs.push(...tls.rootCertificates)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `CA certs: Loaded ${certs.length} bundled root certificates as base (--use-system-ca fallback)`,
      )
    }
  } else {
    // Must include bundled Mozilla CAs as base since ca replaces defaults
    // certs 集合追加新条目，保持收集顺序与输入顺序一致。
    certs.push(...tls.rootCertificates)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `CA certs: Loaded ${certs.length} bundled root certificates as base`,
    )
  }

  // Append extra certs from file
  // 满足 `extraCertsPath` 时，共享工具执行该分支。
  if (extraCertsPath) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // extraCert读取`getFsImplementation`，供共享工具后续处理使用。
      const extraCert = getFsImplementation().readFileSync(extraCertsPath, {
        encoding: 'utf8',
      })
      // certs 集合追加新条目，保持收集顺序与输入顺序一致。
      certs.push(extraCert)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `CA certs: Appended extra certificates from NODE_EXTRA_CA_CERTS (${extraCertsPath})`,
      )
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `CA certs: Failed to read NODE_EXTRA_CA_CERTS file (${extraCertsPath}): ${error}`,
        { level: 'error' },
      )
    }
  }

  // 返回 `certs.length > 0 ? certs : undefined`，作为共享工具这次计算的结果。
  return certs.length > 0 ? certs : undefined
})

/**
 * Clear the CA certificates cache.
 * Call this when environment variables that affect CA certs may have changed
 * (e.g., NODE_EXTRA_CA_CERTS, NODE_OPTIONS).
 */
// clearCACertsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearCACertsCache(): void {
  // 调用 getCACertificates.cache.clear?.()，完成这一处局部操作。
  getCACertificates.cache.clear?.()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Cleared CA certificates cache')
}

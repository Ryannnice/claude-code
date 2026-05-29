// 引入 execaSync，将 execa 中已经封装好的能力接到本文件流程里。
import { execaSync } from 'execa'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 execFileNoThrow，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from '../execFileNoThrow.js'
// 引入 execSyncWithDefaults_DEPRECATED，将 ../execFileNoThrowPortable.js 中已经封装好的能力接到本文件流程里。
import { execSyncWithDefaults_DEPRECATED } from '../execFileNoThrowPortable.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  CREDENTIALS_SERVICE_SUFFIX,
  clearKeychainCache,
  getMacOsKeychainStorageServiceName,
  getUsername,
  KEYCHAIN_CACHE_TTL_MS,
  keychainCacheState,
} from './macOsKeychainHelpers.js'
// 类型依赖 { SecureStorage, SecureStorageData } 来自 ./types.js，用于校准共享工具的数据契约。
import type { SecureStorage, SecureStorageData } from './types.js'

// `security -i` reads stdin with a 4096-byte fgets() buffer (BUFSIZ on darwin).
// A command line longer than this is truncated mid-argument: the first 4096
// bytes are consumed as one command (unterminated quote → fails), the overflow
// is interpreted as a second unknown command. Net: non-zero exit with NO data
// written, but the *previous* keychain entry is left intact — which fallback
// storage then reads as stale. See #30337.
// Headroom of 64B below the limit guards against edge-case line-terminator
// accounting differences.
// SECURITY_STDIN_LINE_LIMIT 命名 `4096 - 64`，让后续代码直接表达这个值的用途。
const SECURITY_STDIN_LINE_LIMIT = 4096 - 64

// macOsKeychainStorage集中保存共享工具 mac Os Keychain Storage要一起传递的字段。
export const macOsKeychainStorage = {
  name: 'keychain',
  // read 使用 无 完成共享工具里的对应操作。
  read(): SecureStorageData | null {
    // prev 命名 `keychainCacheState.cache`，让后续代码直接表达这个值的用途。
    const prev = keychainCacheState.cache
    // 满足 `Date.now() - prev.cachedAt < KEYCHAIN_CACHE_TTL_MS` 时，共享工具执行该分支。
    if (Date.now() - prev.cachedAt < KEYCHAIN_CACHE_TTL_MS) {
      // 返回 `prev.data`，作为共享工具这次计算的结果。
      return prev.data
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // storageServiceName读取`getMacOsKeychainStorageServiceName`，供共享工具后续处理使用。
      const storageServiceName = getMacOsKeychainStorageServiceName(
        CREDENTIALS_SERVICE_SUFFIX,
      )
      // username读取`getUsername`，供共享工具后续处理使用。
      const username = getUsername()
      // 结果保存`execSyncWithDefaults_DEPRECATED`，供共享工具后续处理使用。
      const result = execSyncWithDefaults_DEPRECATED(
        `security find-generic-password -a "${username}" -w -s "${storageServiceName}"`,
      )
      // 满足 `result` 时，共享工具执行该分支。
      if (result) {
        // data解析`jsonParse`，供共享工具后续处理使用。
        const data = jsonParse(result)
        // cache 缓存更新为 `{ data, cachedAt: Date.now() }`，确保共享工具后续读取最新状态。
        keychainCacheState.cache = { data, cachedAt: Date.now() }
        // 返回 `data`，作为共享工具这次计算的结果。
        return data
      }
    } catch (_e) {
      // fall through
    }
    // Stale-while-error: if we had a value before and the refresh failed,
    // keep serving the stale value rather than caching null. Since #23192
    // clears the upstream memoize on every API request (macOS path), a
    // single transient `security` spawn failure would otherwise poison the
    // cache and surface as "Not logged in" across all subsystems until the
    // next user interaction. clearKeychainCache() sets data=null, so
    // explicit invalidation (logout, delete) still reads through.
    // `prev.data` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (prev.data !== null) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[keychain] read failed; serving stale cache', {
        level: 'warn',
      })
      // cache 缓存更新为 `{ data: prev.data, cachedAt: Date.now() }`，确保共享工具后续读取最新状态。
      keychainCacheState.cache = { data: prev.data, cachedAt: Date.now() }
      // 返回 `prev.data`，作为共享工具这次计算的结果。
      return prev.data
    }
    // cache 缓存更新为 `{ data: null, cachedAt: Date.now() }`，确保共享工具后续读取最新状态。
    keychainCacheState.cache = { data: null, cachedAt: Date.now() }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  },
  // readAsync 使用 无 完成共享工具里的对应操作。
  async readAsync(): Promise<SecureStorageData | null> {
    // prev 命名 `keychainCacheState.cache`，让后续代码直接表达这个值的用途。
    const prev = keychainCacheState.cache
    // 满足 `Date.now() - prev.cachedAt < KEYCHAIN_CACHE_TTL_MS` 时，共享工具执行该分支。
    if (Date.now() - prev.cachedAt < KEYCHAIN_CACHE_TTL_MS) {
      // 返回 `prev.data`，作为共享工具这次计算的结果。
      return prev.data
    }
    // 满足 `keychainCacheState.readInFlight` 时，共享工具执行该分支。
    if (keychainCacheState.readInFlight) {
      // 返回 `keychainCacheState.readInFlight`，作为共享工具这次计算的结果。
      return keychainCacheState.readInFlight
    }

    // gen 命名 `keychainCacheState.generation`，让后续代码直接表达这个值的用途。
    const gen = keychainCacheState.generation
    // promise 异步任务保存`doReadAsync`，供共享工具后续处理使用。
    const promise = doReadAsync().then(data => {
      // If the cache was invalidated or updated while we were reading,
      // our subprocess result is stale — don't overwrite the newer entry.
      // 满足 `gen === keychainCacheState.generation` 时，共享工具执行该分支。
      if (gen === keychainCacheState.generation) {
        // Stale-while-error — mirror read() above.
        // `data === null && prev.data` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
        if (data === null && prev.data !== null) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging('[keychain] readAsync failed; serving stale cache', {
            level: 'warn',
          })
        }
        // next保存`data ?? prev.data`，供共享工具 mac Os Keychain Storage后续判断或输出使用。
        const next = data ?? prev.data
        // cache 缓存更新为 `{ data: next, cachedAt: Date.now() }`，确保共享工具后续读取最新状态。
        keychainCacheState.cache = { data: next, cachedAt: Date.now() }
        // readInFlight更新为 `null`，确保共享工具后续读取最新状态。
        keychainCacheState.readInFlight = null
        // 返回 `next`，作为共享工具这次计算的结果。
        return next
      }
      // 返回 `data`，作为共享工具这次计算的结果。
      return data
    })
    // readInFlight更新为 `promise`，确保共享工具后续读取最新状态。
    keychainCacheState.readInFlight = promise
    // 返回 `promise`，作为共享工具这次计算的结果。
    return promise
  },
  // update 使用 data: SecureStorageData 完成共享工具里的对应操作。
  update(data: SecureStorageData): { success: boolean; warning?: string } {
    // Invalidate cache before update
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearKeychainCache()

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // storageServiceName读取`getMacOsKeychainStorageServiceName`，供共享工具后续处理使用。
      const storageServiceName = getMacOsKeychainStorageServiceName(
        CREDENTIALS_SERVICE_SUFFIX,
      )
      // username读取`getUsername`，供共享工具后续处理使用。
      const username = getUsername()
      // jsonString保存`jsonStringify`，供共享工具后续处理使用。
      const jsonString = jsonStringify(data)

      // Convert to hexadecimal to avoid any escaping issues
      // hexValue保存`Buffer.from`，供共享工具后续处理使用。
      const hexValue = Buffer.from(jsonString, 'utf-8').toString('hex')

      // Prefer stdin (`security -i`) so process monitors (CrowdStrike et al.)
      // see only "security -i", not the payload (INC-3028).
      // When the payload would overflow the stdin line buffer, fall back to
      // argv. Hex in argv is recoverable by a determined observer but defeats
      // naive plaintext-grep rules, and the alternative — silent credential
      // corruption — is strictly worse. ARG_MAX on darwin is 1MB so argv has
      // effectively no size limit for our purposes.
      // 命令 命名 ``add-generic-password -U -a "${username}" -s "${storageSe...`，让后续代码直接表达这个值的用途。
      const command = `add-generic-password -U -a "${username}" -s "${storageServiceName}" -X "${hexValue}"\n`

      // result 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let result
      // 满足 `command.length <= SECURITY_STDIN_LINE_LIMIT` 时，共享工具执行该分支。
      if (command.length <= SECURITY_STDIN_LINE_LIMIT) {
        // 结果更新为 `execaSync('security', ['-i'], {`，确保共享工具后续读取最新状态。
        result = execaSync('security', ['-i'], {
          input: command,
          stdio: ['pipe', 'pipe', 'pipe'],
          reject: false,
        })
      } else {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Keychain payload (${jsonString.length}B JSON) exceeds security -i stdin limit; using argv`,
          { level: 'warn' },
        )
        // 结果更新为 `execaSync(`，确保共享工具后续读取最新状态。
        result = execaSync(
          'security',
          [
            'add-generic-password',
            '-U',
            '-a',
            username,
            '-s',
            storageServiceName,
            '-X',
            hexValue,
          ],
          { stdio: ['ignore', 'pipe', 'pipe'], reject: false },
        )
      }

      // `result.exitCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (result.exitCode !== 0) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { success: false }
      }

      // Update cache with new data on success
      // cache 缓存更新为 `{ data, cachedAt: Date.now() }`，确保共享工具后续读取最新状态。
      keychainCacheState.cache = { data, cachedAt: Date.now() }
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: true }
    } catch (_e) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false }
    }
  },
  // delete 使用 无 完成共享工具里的对应操作。
  delete(): boolean {
    // Invalidate cache before delete
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearKeychainCache()

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // storageServiceName读取`getMacOsKeychainStorageServiceName`，供共享工具后续处理使用。
      const storageServiceName = getMacOsKeychainStorageServiceName(
        CREDENTIALS_SERVICE_SUFFIX,
      )
      // username读取`getUsername`，供共享工具后续处理使用。
      const username = getUsername()
      // 调用 execSyncWithDefaults_DEPRECATED，触发共享工具此处需要的副作用。
      execSyncWithDefaults_DEPRECATED(
        `security delete-generic-password -a "${username}" -s "${storageServiceName}"`,
      )
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    } catch (_e) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  },
} satisfies SecureStorage

// doReadAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function doReadAsync(): Promise<SecureStorageData | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // storageServiceName读取`getMacOsKeychainStorageServiceName`，供共享工具后续处理使用。
    const storageServiceName = getMacOsKeychainStorageServiceName(
      CREDENTIALS_SERVICE_SUFFIX,
    )
    // username读取`getUsername`，供共享工具后续处理使用。
    const username = getUsername()
    // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 mac Os Keychain Storage对同一对象的重复访问。
    const { stdout, code } = await execFileNoThrow(
      'security',
      ['find-generic-password', '-a', username, '-w', '-s', storageServiceName],
      { useCwd: false, preserveOutputOnError: false },
    )
    // 只有 `code === 0 && stdout` 满足时，共享工具才执行该分支。
    if (code === 0 && stdout) {
      // 返回 `jsonParse(stdout.trim())`，作为共享工具这次计算的结果。
      return jsonParse(stdout.trim())
    }
  } catch (_e) {
    // fall through
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// keychainLockedCache 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let keychainLockedCache: boolean | undefined

/**
 * Checks if the macOS keychain is locked.
 * Returns true if on macOS and keychain is locked (exit code 36 from security show-keychain-info).
 * This commonly happens in SSH sessions where the keychain isn't automatically unlocked.
 *
 * Cached for process lifetime — execaSync('security', ...) is a ~27ms sync
 * subprocess spawn, and this is called from render (AssistantTextMessage).
 * During virtual-scroll remounts on sessions with "Not logged in" messages,
 * each remount re-spawned security(1), adding 27ms/message to the commit.
 * Keychain lock state doesn't change during a CLI session.
 */
// isMacOsKeychainLocked 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMacOsKeychainLocked(): boolean {
  // `keychainLockedCache` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (keychainLockedCache !== undefined) return keychainLockedCache
  // Only check on macOS
  // `process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin') {
    // keychainLockedCache 缓存更新为 `false`，确保共享工具后续读取最新状态。
    keychainLockedCache = false
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`execaSync`，供共享工具后续处理使用。
    const result = execaSync('security', ['show-keychain-info'], {
      reject: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    // Exit code 36 indicates the keychain is locked
    // keychainLockedCache 缓存更新为 `result.exitCode === 36`，确保共享工具后续读取最新状态。
    keychainLockedCache = result.exitCode === 36
  } catch {
    // If the command fails for any reason, assume keychain is not locked
    // keychainLockedCache 缓存更新为 `false`，确保共享工具后续读取最新状态。
    keychainLockedCache = false
  }
  // 返回 `keychainLockedCache`，作为共享工具这次计算的结果。
  return keychainLockedCache
}

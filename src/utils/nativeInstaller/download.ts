/**
 * Download functionality for native installer
 *
 * Handles downloading Claude binaries from various sources:
 * - Artifactory NPM packages
 * - GCS bucket
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { chmod, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 类型依赖 { ReleaseChannel } 来自 ../config.js，用于校准共享工具的数据契约。
import type { ReleaseChannel } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from '../errors.js'
// 引入 execFileNoThrowWithCwd，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from '../execFileNoThrow.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 sleep，将 ../sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from '../sleep.js'
// 引入 jsonStringify、writeFileSync_DEPRECATED，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify, writeFileSync_DEPRECATED } from '../slowOperations.js'
// 引入 getBinaryName、getPlatform，将 ./installer.js 中已经封装好的能力接到本文件流程里。
import { getBinaryName, getPlatform } from './installer.js'

// GCS_BUCKET_URL 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const GCS_BUCKET_URL =
  'https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases'
// ARTIFACTORY_REGISTRY_URL 先占位，稍后的条件分支会根据实际输入补齐它。
export const ARTIFACTORY_REGISTRY_URL =
  'https://artifactory.infra.ant.dev/artifactory/api/npm/npm-all/'

// getLatestVersionFromArtifactory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLatestVersionFromArtifactory(
  tag: string = 'latest',
): Promise<string> {
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 从 `await execFileNoThrowWithCwd(` 解构 stdout、code、stderr，减少共享工具 download对同一对象的重复访问。
  const { stdout, code, stderr } = await execFileNoThrowWithCwd(
    'npm',
    [
      'view',
      `${MACRO.NATIVE_PACKAGE_URL}@${tag}`,
      'version',
      '--prefer-online',
      '--registry',
      ARTIFACTORY_REGISTRY_URL,
    ],
    {
      timeout: 30000,
      preserveOutputOnError: true,
    },
  )

  // latencyMs 集合记录时间`Date.now`，供共享工具后续处理使用。
  const latencyMs = Date.now() - startTime

  // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_version_check_failure', {
      latency_ms: latencyMs,
      source_npm: true,
      exit_code: code,
    })
    // 错误保存`Error`，供共享工具后续处理使用。
    const error = new Error(`npm view failed with code ${code}: ${stderr}`)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_version_check_success', {
    latency_ms: latencyMs,
    source_npm: true,
  })
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `npm view ${MACRO.NATIVE_PACKAGE_URL}@${tag} version: ${stdout}`,
  )
  // latestVersion格式化`stdout.trim`，供共享工具后续处理使用。
  const latestVersion = stdout.trim()
  // 返回 `latestVersion`，作为共享工具这次计算的结果。
  return latestVersion
}

// getLatestVersionFromBinaryRepo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLatestVersionFromBinaryRepo(
  channel: ReleaseChannel = 'latest',
  baseUrl: string,
  authConfig?: { auth: { username: string; password: string } },
): Promise<string> {
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应读取`axios.get`，供共享工具后续处理使用。
    const response = await axios.get(`${baseUrl}/${channel}`, {
      timeout: 30000,
      responseType: 'text',
      ...authConfig,
    })
    // latencyMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const latencyMs = Date.now() - startTime
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_version_check_success', {
      latency_ms: latencyMs,
    })
    // 返回 `response.data.trim()`，作为共享工具这次计算的结果。
    return response.data.trim()
  } catch (error) {
    // latencyMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const latencyMs = Date.now() - startTime
    // errorMessage 消息数据保存`String`，供共享工具后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // httpStatus 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let httpStatus: number | undefined
    // 只有 `axios.isAxiosError(error) && error.response` 满足时，共享工具才执行该分支。
    if (axios.isAxiosError(error) && error.response) {
      // httpStatus 集合更新为 `error.response.status`，确保共享工具后续读取最新状态。
      httpStatus = error.response.status
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_version_check_failure', {
      latency_ms: latencyMs,
      http_status: httpStatus,
      is_timeout: errorMessage.includes('timeout'),
    })
    // fetchError 错误信息保存`Error`，供共享工具后续处理使用。
    const fetchError = new Error(
      `Failed to fetch version from ${baseUrl}/${channel}: ${errorMessage}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(fetchError)
    // 抛出 fetchError，阻止共享工具在无效状态下继续运行。
    throw fetchError
  }
}

// getLatestVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLatestVersion(
  channelOrVersion: string,
): Promise<string> {
  // Direct version - match internal format too (e.g. 1.0.30-dev.shaf4937ce)
  // 满足 `/^v?\d+\.\d+\.\d+(-\S+)?$/.test(channelOrVersion)` 时，共享工具执行该分支。
  if (/^v?\d+\.\d+\.\d+(-\S+)?$/.test(channelOrVersion)) {
    // normalized保存`channelOrVersion.startsWith`，供共享工具后续处理使用。
    const normalized = channelOrVersion.startsWith('v')
      ? channelOrVersion.slice(1)
      : channelOrVersion
    // 99.99.x is reserved for CI smoke-test fixtures on real GCS.
    // feature() is false in all shipped builds — DCE collapses this to an
    // unconditional throw. Only `bun --feature=ALLOW_TEST_VERSIONS` (the
    // smoke test's source-level invocation) bypasses.
    // 只有 `/^99\.99\./.test(normalized) && !feature('ALLOW_TEST_VERSIONS')` 满足时，共享工具才执行该分支。
    if (/^99\.99\./.test(normalized) && !feature('ALLOW_TEST_VERSIONS')) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Version ${normalized} is not available for installation. Use 'stable' or 'latest'.`,
      )
    }
    // 返回 `normalized`，作为共享工具这次计算的结果。
    return normalized
  }

  // ReleaseChannel validation
  // channel保存`channelOrVersion as ReleaseChannel`，供后续判断或组装使用。
  const channel = channelOrVersion as ReleaseChannel
  // `channel` 与 `'stable' && channel !== 'latest'` 不一致时刷新派生状态，避免使用过期结果。
  if (channel !== 'stable' && channel !== 'latest') {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Invalid channel: ${channelOrVersion}. Use 'stable' or 'latest'`,
    )
  }

  // Route to appropriate source
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // Use Artifactory for ant users
    // npmTag标记共享工具 download是否启用对应路径。
    const npmTag = channel === 'stable' ? 'stable' : 'latest'
    // 返回 `getLatestVersionFromArtifactory(npmTag)`，作为共享工具这次计算的结果。
    return getLatestVersionFromArtifactory(npmTag)
  }

  // Use GCS for external users
  // 返回 `getLatestVersionFromBinaryRepo(channel, GCS_BUCKET_URL)`，作为共享工具这次计算的结果。
  return getLatestVersionFromBinaryRepo(channel, GCS_BUCKET_URL)
}

// downloadVersionFromArtifactory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function downloadVersionFromArtifactory(
  version: string,
  stagingPath: string,
) {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // If we get here, we own the lock and can delete a partial download
  // 等待 `fs.rm(stagingPath, { recursive: true, force: true })` 完成，再继续共享工具 download的异步流程。
  await fs.rm(stagingPath, { recursive: true, force: true })

  // Get the platform-specific package name
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // platformPackageName 命名 ``${MACRO.NATIVE_PACKAGE_URL}-${platform}``，让后续代码直接表达这个值的用途。
  const platformPackageName = `${MACRO.NATIVE_PACKAGE_URL}-${platform}`

  // Fetch integrity hash for the platform-specific package
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Fetching integrity hash for ${platformPackageName}@${version}`,
  )
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    stdout: integrityOutput,
    code,
    stderr,
  } = await execFileNoThrowWithCwd(
    'npm',
    [
      'view',
      `${platformPackageName}@${version}`,
      'dist.integrity',
      '--registry',
      ARTIFACTORY_REGISTRY_URL,
    ],
    {
      timeout: 30000,
      preserveOutputOnError: true,
    },
  )

  // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0) {
    // 抛出 new Error(`npm view integrity failed with code ${code}: ${stderr}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`npm view integrity failed with code ${code}: ${stderr}`)
  }

  // integrity格式化`integrityOutput.trim`，供共享工具后续处理使用。
  const integrity = integrityOutput.trim()
  // integrity缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!integrity) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Failed to fetch integrity hash for ${platformPackageName}@${version}`,
    )
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Got integrity hash for ${platform}: ${integrity}`)

  // Create isolated npm project in staging
  // 等待 `fs.mkdir(stagingPath)` 完成，再继续共享工具 download的异步流程。
  await fs.mkdir(stagingPath)

  // packageJson集中保存共享工具 download要一起传递的字段。
  const packageJson = {
    name: 'claude-native-installer',
    version: '0.0.1',
    dependencies: {
      [MACRO.NATIVE_PACKAGE_URL!]: version,
    },
  }

  // Create package-lock.json with integrity verification for platform-specific package
  // packageLock集中保存共享工具 download要一起传递的字段。
  const packageLock = {
    name: 'claude-native-installer',
    version: '0.0.1',
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': {
        name: 'claude-native-installer',
        version: '0.0.1',
        dependencies: {
          [MACRO.NATIVE_PACKAGE_URL!]: version,
        },
      },
      [`node_modules/${MACRO.NATIVE_PACKAGE_URL}`]: {
        version: version,
        optionalDependencies: {
          [platformPackageName]: version,
        },
      },
      [`node_modules/${platformPackageName}`]: {
        version: version,
        integrity: integrity,
      },
    },
  }

  // 调用 writeFileSync_DEPRECATED，触发共享工具此处需要的副作用。
  writeFileSync_DEPRECATED(
    join(stagingPath, 'package.json'),
    jsonStringify(packageJson, null, 2),
    { encoding: 'utf8', flush: true },
  )

  // 调用 writeFileSync_DEPRECATED，触发共享工具此处需要的副作用。
  writeFileSync_DEPRECATED(
    join(stagingPath, 'package-lock.json'),
    jsonStringify(packageLock, null, 2),
    { encoding: 'utf8', flush: true },
  )

  // Install with npm - it will verify integrity from package-lock.json
  // Use --prefer-online to force fresh metadata checks, helping with Artifactory replication delays
  // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const result = await execFileNoThrowWithCwd(
    'npm',
    ['ci', '--prefer-online', '--registry', ARTIFACTORY_REGISTRY_URL],
    {
      timeout: 60000,
      preserveOutputOnError: true,
      cwd: stagingPath,
    },
  )

  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 抛出 new Error(`npm ci failed with code ${result.code}: ${result.stderr}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`npm ci failed with code ${result.code}: ${result.stderr}`)
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Successfully downloaded and verified ${MACRO.NATIVE_PACKAGE_URL}@${version}`,
  )
}

// Stall timeout: abort if no bytes received for this duration
// DEFAULT_STALL_TIMEOUT_MS 集合 命名 `60000 // 60 seconds`，让后续代码直接表达这个值的用途。
const DEFAULT_STALL_TIMEOUT_MS = 60000 // 60 seconds
// MAX_DOWNLOAD_RETRIES 集合保存`3`，供共享工具 download后续判断或输出使用。
const MAX_DOWNLOAD_RETRIES = 3

// getStallTimeoutMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getStallTimeoutMs(): number {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    Number(process.env.CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING) ||
    DEFAULT_STALL_TIMEOUT_MS
  )
}

// StallTimeoutError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class StallTimeoutError extends Error {
  // 构造函数接收 无，把外部输入整理成实例可复用的内部状态。
  constructor() {
    // 调用 super，触发共享工具此处需要的副作用。
    super('Download stalled: no data received for 60 seconds')
    // 更新实例字段 name 为 'StallTimeoutError'，同步共享工具的内部状态。
    this.name = 'StallTimeoutError'
  }
}

/**
 * Common logic for downloading and verifying a binary.
 * Includes stall detection (aborts if no bytes for 60s) and retry logic.
 */
// downloadAndVerifyBinary 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function downloadAndVerifyBinary(
  binaryUrl: string,
  expectedChecksum: string,
  binaryPath: string,
  requestConfig: Record<string, unknown> = {},
) {
  // lastError 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastError: Error | undefined

  // 循环处理 `let attempt = 1; attempt <= MAX_DOWNLOAD_RETRIES`，让共享工具逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= MAX_DOWNLOAD_RETRIES; attempt++) {
    // controller保存`AbortController`，供共享工具后续处理使用。
    const controller = new AbortController()
    // stallTimer 先占位，稍后的条件分支会根据实际输入补齐它。
    let stallTimer: ReturnType<typeof setTimeout> | undefined

    // clearStallTimer封装成回调，供共享工具 download在事件触发或异步步骤中调用。
    const clearStallTimer = () => {
      // 满足 `stallTimer` 时，共享工具执行该分支。
      if (stallTimer) {
        // 调用 clearTimeout，触发共享工具此处需要的副作用。
        clearTimeout(stallTimer)
        // stallTimer更新为 `undefined`，确保共享工具后续读取最新状态。
        stallTimer = undefined
      }
    }

    // resetStallTimer封装成回调，供共享工具 download在事件触发或异步步骤中调用。
    const resetStallTimer = () => {
      // 调用 clearStallTimer，触发共享工具此处需要的副作用。
      clearStallTimer()
      // stallTimer更新为 `setTimeout(c => c.abort(), getStallTimeoutMs(), controlle...`，确保共享工具后续读取最新状态。
      stallTimer = setTimeout(c => c.abort(), getStallTimeoutMs(), controller)
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Start the stall timer before the request
      // 调用 resetStallTimer，触发共享工具此处需要的副作用。
      resetStallTimer()

      // 接口响应读取`axios.get`，供共享工具后续处理使用。
      const response = await axios.get(binaryUrl, {
        timeout: 5 * 60000, // 5 minute total timeout
        responseType: 'arraybuffer',
        signal: controller.signal,
        // 这个回调绑定到 onDownloadProgress: () => {，负责共享工具在该局部场景下的响应。
        onDownloadProgress: () => {
          // Reset stall timer on each chunk of data received
          // 调用 resetStallTimer，触发共享工具此处需要的副作用。
          resetStallTimer()
        },
        ...requestConfig,
      })

      // 调用 clearStallTimer，触发共享工具此处需要的副作用。
      clearStallTimer()

      // Verify checksum
      // hash构建`createHash`，供共享工具后续处理使用。
      const hash = createHash('sha256')
      // 调用 hash.update，触发共享工具此处需要的副作用。
      hash.update(response.data)
      // actualChecksum保存`hash.digest`，供共享工具后续处理使用。
      const actualChecksum = hash.digest('hex')

      // `actualChecksum` 与 `expectedChecksum` 不一致时刷新派生状态，避免使用过期结果。
      if (actualChecksum !== expectedChecksum) {
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`,
        )
      }

      // Write binary to disk
      // 等待 `writeFile(binaryPath, Buffer.from(response.data))` 完成，再继续共享工具 download的异步流程。
      await writeFile(binaryPath, Buffer.from(response.data))
      // 等待 `chmod(binaryPath, 0o755)` 完成，再继续共享工具 download的异步流程。
      await chmod(binaryPath, 0o755)

      // Success - return early
      // 共享工具 download在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    } catch (error) {
      // 调用 clearStallTimer，触发共享工具此处需要的副作用。
      clearStallTimer()

      // Check if this was a stall timeout (axios wraps abort signals in CanceledError)
      // isStallTimeout记录 `axios.isCancel` 是否成立，共享工具随后按该结果分支。
      const isStallTimeout = axios.isCancel(error)

      // 满足 `isStallTimeout` 时，共享工具执行该分支。
      if (isStallTimeout) {
        // lastError 错误信息更新为 `new StallTimeoutError()`，确保共享工具后续读取最新状态。
        lastError = new StallTimeoutError()
      } else {
        // lastError 错误信息更新为 `toError(error)`，确保共享工具后续读取最新状态。
        lastError = toError(error)
      }

      // Only retry on stall timeouts
      // 只有 `isStallTimeout && attempt < MAX_DOWNLOAD_RETRIES` 满足时，共享工具才执行该分支。
      if (isStallTimeout && attempt < MAX_DOWNLOAD_RETRIES) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Download stalled on attempt ${attempt}/${MAX_DOWNLOAD_RETRIES}, retrying...`,
        )
        // Brief pause before retry to let network recover
        // 等待 `sleep(1000)` 完成，再继续共享工具 download的异步流程。
        await sleep(1000)
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Don't retry other errors (HTTP errors, checksum mismatches, etc.)
      // 抛出 lastError，阻止共享工具在无效状态下继续运行。
      throw lastError
    }
  }

  // Should not reach here, but just in case
  // 抛出 lastError ?? new Error('Download failed after all retries')，阻止共享工具在无效状态下继续运行。
  throw lastError ?? new Error('Download failed after all retries')
}

// downloadVersionFromBinaryRepo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function downloadVersionFromBinaryRepo(
  version: string,
  stagingPath: string,
  baseUrl: string,
  authConfig?: {
    auth?: { username: string; password: string }
    headers?: Record<string, string>
  },
) {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // If we get here, we own the lock and can delete a partial download
  // 等待 `fs.rm(stagingPath, { recursive: true, force: true })` 完成，再继续共享工具 download的异步流程。
  await fs.rm(stagingPath, { recursive: true, force: true })

  // Get platform
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()

  // Log download attempt start
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_binary_download_attempt', {})

  // Fetch manifest to get checksum
  // manifest 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let manifest
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // manifestResponse 响应数据读取`axios.get`，供共享工具后续处理使用。
    const manifestResponse = await axios.get(
      `${baseUrl}/${version}/manifest.json`,
      {
        timeout: 10000,
        responseType: 'json',
        ...authConfig,
      },
    )
    // manifest更新为 `manifestResponse.data`，确保共享工具后续读取最新状态。
    manifest = manifestResponse.data
  } catch (error) {
    // latencyMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const latencyMs = Date.now() - startTime
    // errorMessage 消息数据保存`String`，供共享工具后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // httpStatus 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let httpStatus: number | undefined
    // 只有 `axios.isAxiosError(error) && error.response` 满足时，共享工具才执行该分支。
    if (axios.isAxiosError(error) && error.response) {
      // httpStatus 集合更新为 `error.response.status`，确保共享工具后续读取最新状态。
      httpStatus = error.response.status
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_binary_manifest_fetch_failure', {
      latency_ms: latencyMs,
      http_status: httpStatus,
      is_timeout: errorMessage.includes('timeout'),
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `Failed to fetch manifest from ${baseUrl}/${version}/manifest.json: ${errorMessage}`,
      ),
    )
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }

  // platformInfo读取 `manifest.platforms[platform]` 对应条目，后续围绕该成员继续处理。
  const platformInfo = manifest.platforms[platform]

  // platformInfo缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!platformInfo) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_binary_platform_not_found', {})
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Platform ${platform} not found in manifest for version ${version}`,
    )
  }

  // expectedChecksum 命名 `platformInfo.checksum`，让后续代码直接表达这个值的用途。
  const expectedChecksum = platformInfo.checksum

  // Both GCS and generic bucket use identical layout: ${baseUrl}/${version}/${platform}/${binaryName}
  // binaryName读取`getBinaryName`，供共享工具后续处理使用。
  const binaryName = getBinaryName(platform)
  // binaryUrl 命名 ``${baseUrl}/${version}/${platform}/${binaryName}``，让后续代码直接表达这个值的用途。
  const binaryUrl = `${baseUrl}/${version}/${platform}/${binaryName}`

  // Write to staging
  // 等待 `fs.mkdir(stagingPath)` 完成，再继续共享工具 download的异步流程。
  await fs.mkdir(stagingPath)
  // binaryPath 路径数据格式化`join`，供共享工具后续处理使用。
  const binaryPath = join(stagingPath, binaryName)

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `downloadAndVerifyBinary(` 完成，再继续共享工具 download的异步流程。
    await downloadAndVerifyBinary(
      binaryUrl,
      expectedChecksum,
      binaryPath,
      authConfig || {},
    )
    // latencyMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const latencyMs = Date.now() - startTime
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_binary_download_success', {
      latency_ms: latencyMs,
    })
  } catch (error) {
    // latencyMs 集合记录时间`Date.now`，供共享工具后续处理使用。
    const latencyMs = Date.now() - startTime
    // errorMessage 消息数据保存`String`，供共享工具后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // httpStatus 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let httpStatus: number | undefined
    // 只有 `axios.isAxiosError(error) && error.response` 满足时，共享工具才执行该分支。
    if (axios.isAxiosError(error) && error.response) {
      // httpStatus 集合更新为 `error.response.status`，确保共享工具后续读取最新状态。
      httpStatus = error.response.status
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_binary_download_failure', {
      latency_ms: latencyMs,
      http_status: httpStatus,
      is_timeout: errorMessage.includes('timeout'),
      is_checksum_mismatch: errorMessage.includes('Checksum mismatch'),
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(`Failed to download binary from ${binaryUrl}: ${errorMessage}`),
    )
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

// downloadVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function downloadVersion(
  version: string,
  stagingPath: string,
): Promise<'npm' | 'binary'> {
  // Test-fixture versions route to the private sentinel bucket. DCE'd in all
  // shipped builds — the string 'claude-code-ci-sentinel' and the gcloud call
  // never exist in compiled binaries. Same gcloud-token pattern as
  // remoteSkillLoader.ts:175-195.
  // 只有 `feature('ALLOW_TEST_VERSIONS') && /^99\.99\./.test(version)` 满足时，共享工具才执行该分支。
  if (feature('ALLOW_TEST_VERSIONS') && /^99\.99\./.test(version)) {
    // 从 `await execFileNoThrowWithCwd('gcloud', [` 解构 stdout，减少共享工具 download对同一对象的重复访问。
    const { stdout } = await execFileNoThrowWithCwd('gcloud', [
      'auth',
      'print-access-token',
    ])
    // 等待 `downloadVersionFromBinaryRepo(` 完成，再继续共享工具 download的异步流程。
    await downloadVersionFromBinaryRepo(
      version,
      stagingPath,
      'https://storage.googleapis.com/claude-code-ci-sentinel',
      { headers: { Authorization: `Bearer ${stdout.trim()}` } },
    )
    // 返回 `'binary'`，作为共享工具这次计算的结果。
    return 'binary'
  }

  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // Use Artifactory for ant users
    // 等待 `downloadVersionFromArtifactory(version, stagingPath)` 完成，再继续共享工具 download的异步流程。
    await downloadVersionFromArtifactory(version, stagingPath)
    // 返回 `'npm'`，作为共享工具这次计算的结果。
    return 'npm'
  }

  // Use GCS for external users
  // 等待 `downloadVersionFromBinaryRepo(version, stagingPath, GCS_BUCKET_URL)` 完成，再继续共享工具 download的异步流程。
  await downloadVersionFromBinaryRepo(version, stagingPath, GCS_BUCKET_URL)
  // 返回 `'binary'`，作为共享工具这次计算的结果。
  return 'binary'
}

// Exported for testing
// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { StallTimeoutError, MAX_DOWNLOAD_RETRIES }
// STALL_TIMEOUT_MS 集合保存`DEFAULT_STALL_TIMEOUT_MS`，供共享工具 download后续判断或输出使用。
export const STALL_TIMEOUT_MS = DEFAULT_STALL_TIMEOUT_MS
// _downloadAndVerifyBinaryForTesting读取`downloadAndVerifyBinary` 整理出中间结果，供共享工具 download后续步骤使用。
export const _downloadAndVerifyBinaryForTesting = downloadAndVerifyBinary

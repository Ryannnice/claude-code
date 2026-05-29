// 类型依赖 { Client } 来自 @modelcontextprotocol/sdk/client/index.js，用于校准共享工具的数据契约。
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 引入 capitalize，将 lodash-es/capitalize.js 中已经封装好的能力接到本文件流程里。
import capitalize from 'lodash-es/capitalize.js'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 createConnection，将 net 中已经封装好的能力接到本文件流程里。
import { createConnection } from 'net'
// 引入 * as os，将 os 中已经封装好的能力接到本文件流程里。
import * as os from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, join, sep as pathSeparator, resolve } from 'path'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 引入 getIsScrollDraining、getOriginalCwd，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsScrollDraining, getOriginalCwd } from '../bootstrap/state.js'
// 接入 callIdeRpc 服务层能力，把外部通信或共享状态交给 ../services/mcp/client.js 处理。
import { callIdeRpc } from '../services/mcp/client.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ConnectedMCPServer,
  MCPServerConnection,
} from '../services/mcp/types.js'
// 引入 getGlobalConfig、saveGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from './config.js'
// 引入 env，将 ./env.js 中已经封装好的能力接到本文件流程里。
import { env } from './env.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from './envUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  execFileNoThrow,
  execFileNoThrowWithCwd,
  execSyncWithDefaults_DEPRECATED,
} from './execFileNoThrow.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 getAncestorPidsAsync，将 ./genericProcessUtils.js 中已经封装好的能力接到本文件流程里。
import { getAncestorPidsAsync } from './genericProcessUtils.js'
// 引入 isJetBrainsPluginInstalledCached，将 ./jetbrains.js 中已经封装好的能力接到本文件流程里。
import { isJetBrainsPluginInstalledCached } from './jetbrains.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'
// 引入 lt，将 ./semver.js 中已经封装好的能力接到本文件流程里。
import { lt } from './semver.js'

// Lazy: IdeOnboardingDialog.tsx pulls React/ink; only needed in interactive onboarding path
/* eslint-disable @typescript-eslint/no-require-imports */
// ideOnboardingDialog 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const ideOnboardingDialog =
  // 这个回调绑定到 (): typeof import('src/components/IdeOnboardingDialog.js') =>，负责共享工具在该局部场景下的响应。
  (): typeof import('src/components/IdeOnboardingDialog.js') =>
    require('src/components/IdeOnboardingDialog.js')

// 引入 createAbortController，将 ./abortController.js 中已经封装好的能力接到本文件流程里。
import { createAbortController } from './abortController.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 envDynamic，将 ./envDynamic.js 中已经封装好的能力接到本文件流程里。
import { envDynamic } from './envDynamic.js'
// 引入 errorMessage、isFsInaccessible，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, isFsInaccessible } from './errors.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  checkWSLDistroMatch,
  WindowsToWSLConverter,
} from './idePathConversion.js'
// 引入 sleep，将 ./sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from './sleep.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'

// isProcessRunning 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isProcessRunning(pid: number): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 process.kill，触发共享工具此处需要的副作用。
    process.kill(pid, 0)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// Returns a function that lazily fetches our process's ancestor PID chain,
// caching within the closure's lifetime. Callers should scope this to a
// single detection pass — PIDs recycle and process trees change over time.
// makeAncestorPidLookup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function makeAncestorPidLookup(): () => Promise<Set<number>> {
  // promise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
  let promise: Promise<Set<number>> | null = null
  // 返回 `() => {`，作为共享工具这次计算的结果。
  return () => {
    // promise 异步任务缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!promise) {
      // promise 异步任务更新为 `getAncestorPidsAsync(process.ppid, 10).then(`，确保共享工具后续读取最新状态。
      promise = getAncestorPidsAsync(process.ppid, 10).then(
        // pids 集合更新为 `> new Set(pids)`，确保共享工具后续读取最新状态。
        pids => new Set(pids),
      )
    }
    // 返回 `promise`，作为共享工具这次计算的结果。
    return promise
  }
}

// LockfileJsonContent 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type LockfileJsonContent = {
  workspaceFolders?: string[]
  pid?: number
  ideName?: string
  transport?: 'ws' | 'sse'
  runningInWindows?: boolean
  authToken?: string
}

// IdeLockfileInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type IdeLockfileInfo = {
  workspaceFolders: string[]
  port: number
  pid?: number
  ideName?: string
  useWebSocket: boolean
  runningInWindows: boolean
  authToken?: string
}

// DetectedIDEInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type DetectedIDEInfo = {
  name: string
  port: number
  workspaceFolders: string[]
  url: string
  isValid: boolean
  authToken?: string
  ideRunningInWindows?: boolean
}

// IdeType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type IdeType =
  | 'cursor'
  | 'windsurf'
  | 'vscode'
  | 'pycharm'
  | 'intellij'
  | 'webstorm'
  | 'phpstorm'
  | 'rubymine'
  | 'clion'
  | 'goland'
  | 'rider'
  | 'datagrip'
  | 'appcode'
  | 'dataspell'
  | 'aqua'
  | 'gateway'
  | 'fleet'
  | 'androidstudio'

// IdeConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type IdeConfig = {
  ideKind: 'vscode' | 'jetbrains'
  displayName: string
  processKeywordsMac: string[]
  processKeywordsWindows: string[]
  processKeywordsLinux: string[]
}

// supportedIdeConfigs 配置 集中保存共享工具 ide要一起传递的字段。
const supportedIdeConfigs: Record<IdeType, IdeConfig> = {
  cursor: {
    ideKind: 'vscode',
    displayName: 'Cursor',
    processKeywordsMac: ['Cursor Helper', 'Cursor.app'],
    processKeywordsWindows: ['cursor.exe'],
    processKeywordsLinux: ['cursor'],
  },
  windsurf: {
    ideKind: 'vscode',
    displayName: 'Windsurf',
    processKeywordsMac: ['Windsurf Helper', 'Windsurf.app'],
    processKeywordsWindows: ['windsurf.exe'],
    processKeywordsLinux: ['windsurf'],
  },
  vscode: {
    ideKind: 'vscode',
    displayName: 'VS Code',
    processKeywordsMac: ['Visual Studio Code', 'Code Helper'],
    processKeywordsWindows: ['code.exe'],
    processKeywordsLinux: ['code'],
  },
  intellij: {
    ideKind: 'jetbrains',
    displayName: 'IntelliJ IDEA',
    processKeywordsMac: ['IntelliJ IDEA'],
    processKeywordsWindows: ['idea64.exe'],
    processKeywordsLinux: ['idea', 'intellij'],
  },
  pycharm: {
    ideKind: 'jetbrains',
    displayName: 'PyCharm',
    processKeywordsMac: ['PyCharm'],
    processKeywordsWindows: ['pycharm64.exe'],
    processKeywordsLinux: ['pycharm'],
  },
  webstorm: {
    ideKind: 'jetbrains',
    displayName: 'WebStorm',
    processKeywordsMac: ['WebStorm'],
    processKeywordsWindows: ['webstorm64.exe'],
    processKeywordsLinux: ['webstorm'],
  },
  phpstorm: {
    ideKind: 'jetbrains',
    displayName: 'PhpStorm',
    processKeywordsMac: ['PhpStorm'],
    processKeywordsWindows: ['phpstorm64.exe'],
    processKeywordsLinux: ['phpstorm'],
  },
  rubymine: {
    ideKind: 'jetbrains',
    displayName: 'RubyMine',
    processKeywordsMac: ['RubyMine'],
    processKeywordsWindows: ['rubymine64.exe'],
    processKeywordsLinux: ['rubymine'],
  },
  clion: {
    ideKind: 'jetbrains',
    displayName: 'CLion',
    processKeywordsMac: ['CLion'],
    processKeywordsWindows: ['clion64.exe'],
    processKeywordsLinux: ['clion'],
  },
  goland: {
    ideKind: 'jetbrains',
    displayName: 'GoLand',
    processKeywordsMac: ['GoLand'],
    processKeywordsWindows: ['goland64.exe'],
    processKeywordsLinux: ['goland'],
  },
  rider: {
    ideKind: 'jetbrains',
    displayName: 'Rider',
    processKeywordsMac: ['Rider'],
    processKeywordsWindows: ['rider64.exe'],
    processKeywordsLinux: ['rider'],
  },
  datagrip: {
    ideKind: 'jetbrains',
    displayName: 'DataGrip',
    processKeywordsMac: ['DataGrip'],
    processKeywordsWindows: ['datagrip64.exe'],
    processKeywordsLinux: ['datagrip'],
  },
  appcode: {
    ideKind: 'jetbrains',
    displayName: 'AppCode',
    processKeywordsMac: ['AppCode'],
    processKeywordsWindows: ['appcode.exe'],
    processKeywordsLinux: ['appcode'],
  },
  dataspell: {
    ideKind: 'jetbrains',
    displayName: 'DataSpell',
    processKeywordsMac: ['DataSpell'],
    processKeywordsWindows: ['dataspell64.exe'],
    processKeywordsLinux: ['dataspell'],
  },
  aqua: {
    ideKind: 'jetbrains',
    displayName: 'Aqua',
    processKeywordsMac: [], // Do not auto-detect since aqua is too common
    processKeywordsWindows: ['aqua64.exe'],
    processKeywordsLinux: [],
  },
  gateway: {
    ideKind: 'jetbrains',
    displayName: 'Gateway',
    processKeywordsMac: [], // Do not auto-detect since gateway is too common
    processKeywordsWindows: ['gateway64.exe'],
    processKeywordsLinux: [],
  },
  fleet: {
    ideKind: 'jetbrains',
    displayName: 'Fleet',
    processKeywordsMac: [], // Do not auto-detect since fleet is too common
    processKeywordsWindows: ['fleet.exe'],
    processKeywordsLinux: [],
  },
  androidstudio: {
    ideKind: 'jetbrains',
    displayName: 'Android Studio',
    processKeywordsMac: ['Android Studio'],
    processKeywordsWindows: ['studio64.exe'],
    processKeywordsLinux: ['android-studio'],
  },
}

// isVSCodeIde 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isVSCodeIde(ide: IdeType | null): boolean {
  // ide缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ide) return false
  // 配置读取 `supportedIdeConfigs[ide]` 对应条目，后续围绕该成员继续处理。
  const config = supportedIdeConfigs[ide]
  // 返回 `config && config.ideKind === 'vscode'`，作为共享工具这次计算的结果。
  return config && config.ideKind === 'vscode'
}

// isJetBrainsIde 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isJetBrainsIde(ide: IdeType | null): boolean {
  // ide缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ide) return false
  // 配置读取 `supportedIdeConfigs[ide]` 对应条目，后续围绕该成员继续处理。
  const config = supportedIdeConfigs[ide]
  // 返回 `config && config.ideKind === 'jetbrains'`，作为共享工具这次计算的结果。
  return config && config.ideKind === 'jetbrains'
}

// isSupportedVSCodeTerminal记录 `memoize` 是否成立，共享工具随后按该结果分支。
export const isSupportedVSCodeTerminal = memoize(() => {
  // 返回 `isVSCodeIde(env.terminal as IdeType)`，作为共享工具这次计算的结果。
  return isVSCodeIde(env.terminal as IdeType)
})

// isSupportedJetBrainsTerminal记录 `memoize` 是否成立，共享工具随后按该结果分支。
export const isSupportedJetBrainsTerminal = memoize(() => {
  // 返回 `isJetBrainsIde(envDynamic.terminal as IdeType)`，作为共享工具这次计算的结果。
  return isJetBrainsIde(envDynamic.terminal as IdeType)
})

// isSupportedTerminal记录 `memoize` 是否成立，共享工具随后按该结果分支。
export const isSupportedTerminal = memoize(() => {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    isSupportedVSCodeTerminal() ||
    isSupportedJetBrainsTerminal() ||
    Boolean(process.env.FORCE_CODE_TERMINAL)
  )
})

// getTerminalIdeType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTerminalIdeType(): IdeType | null {
  // 满足 `!isSupportedTerminal()` 时，共享工具执行该分支。
  if (!isSupportedTerminal()) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回 `env.terminal as IdeType`，作为共享工具这次计算的结果。
  return env.terminal as IdeType
}

/**
 * Gets sorted IDE lockfiles from ~/.claude/ide directory
 * @returns Array of full lockfile paths sorted by modification time (newest first)
 */
// getSortedIdeLockfiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSortedIdeLockfiles(): Promise<string[]> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // ideLockFilePaths 路径数据读取`getIdeLockfilesPaths`，供共享工具后续处理使用。
    const ideLockFilePaths = await getIdeLockfilesPaths()

    // Collect all lockfiles from all directories
    // allLockfiles 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
    const allLockfiles: Array<{ path: string; mtime: Date }>[] =
      await Promise.all(
        // 调用 ideLockFilePaths.map，触发共享工具此处需要的副作用。
        ideLockFilePaths.map(async ideLockFilePath => {
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // entries 集合读取`getFsImplementation`，供共享工具后续处理使用。
            const entries = await getFsImplementation().readdir(ideLockFilePath)
            // lockEntries 集合筛选`entries.filter`，供共享工具后续处理使用。
            const lockEntries = entries.filter(file =>
              file.name.endsWith('.lock'),
            )
            // Stat all lockfiles in parallel; skip ones that fail
            // stats 集合保存`Promise.all`，供共享工具后续处理使用。
            const stats = await Promise.all(
              // 调用 lockEntries.map，触发共享工具此处需要的副作用。
              lockEntries.map(async file => {
                // fullPath 路径数据格式化`join`，供共享工具后续处理使用。
                const fullPath = join(ideLockFilePath, file.name)
                // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
                try {
                  // fileStat 文件数据读取`getFsImplementation`，供共享工具后续处理使用。
                  const fileStat = await getFsImplementation().stat(fullPath)
                  // 返回结构化结果，集中表达共享工具已经整理出的状态。
                  return { path: fullPath, mtime: fileStat.mtime }
                } catch {
                  // 返回 `null`，作为共享工具这次计算的结果。
                  return null
                }
              }),
            )
            // 返回 `stats.filter(s => s !== null)`，作为共享工具这次计算的结果。
            return stats.filter(s => s !== null)
          } catch (error) {
            // Candidate paths are pushed without pre-checking existence, so
            // missing/inaccessible dirs are expected here — skip silently.
            // 满足 `!isFsInaccessible(error)` 时，共享工具执行该分支。
            if (!isFsInaccessible(error)) {
              // 记录共享工具运行诊断，方便排查异常路径或性能问题。
              logError(error)
            }
            // 返回列表结果，保留共享工具已经排好的条目顺序。
            return []
          }
        }),
      )

    // Flatten and sort all lockfiles by last modified date (newest first)
    // 返回 `allLockfiles`，作为共享工具这次计算的结果。
    return allLockfiles
      .flat()
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(file => file.path)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

// readIdeLockfile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readIdeLockfile(path: string): Promise<IdeLockfileInfo | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`getFsImplementation`，供共享工具后续处理使用。
    const content = await getFsImplementation().readFile(path, {
      encoding: 'utf-8',
    })

    // workspaceFolders 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    let workspaceFolders: string[] = []
    // pid 先占位，稍后的条件分支会根据实际输入补齐它。
    let pid: number | undefined
    // ideName 先占位，稍后的条件分支会根据实际输入补齐它。
    let ideName: string | undefined
    // useWebSocket标记共享工具 ide是否启用对应路径。
    let useWebSocket = false
    // runningInWindows 集合标记共享工具 ide是否启用对应路径。
    let runningInWindows = false
    // 认证令牌 先占位，稍后的条件分支会根据实际输入补齐它。
    let authToken: string | undefined

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // parsedContent解析`jsonParse`，供共享工具后续处理使用。
      const parsedContent = jsonParse(content) as LockfileJsonContent
      // 满足 `parsedContent.workspaceFolders` 时，共享工具执行该分支。
      if (parsedContent.workspaceFolders) {
        // workspaceFolders 集合更新为 `parsedContent.workspaceFolders`，确保共享工具后续读取最新状态。
        workspaceFolders = parsedContent.workspaceFolders
      }
      // pid更新为 `parsedContent.pid`，确保共享工具后续读取最新状态。
      pid = parsedContent.pid
      // ideName更新为 `parsedContent.ideName`，确保共享工具后续读取最新状态。
      ideName = parsedContent.ideName
      // useWebSocket更新为 `parsedContent.transport === 'ws'`，确保共享工具后续读取最新状态。
      useWebSocket = parsedContent.transport === 'ws'
      // runningInWindows 集合更新为 `parsedContent.runningInWindows === true`，确保共享工具后续读取最新状态。
      runningInWindows = parsedContent.runningInWindows === true
      // 认证令牌更新为 `parsedContent.authToken`，确保共享工具后续读取最新状态。
      authToken = parsedContent.authToken
    } catch (_) {
      // Older format- just a list of paths.
      // workspaceFolders 集合更新为 `content.split('\n').map(line => line.trim())`，确保共享工具后续读取最新状态。
      workspaceFolders = content.split('\n').map(line => line.trim())
    }

    // Extract the port from the filename (e.g., 12345.lock -> 12345)
    // 文件名格式化`path.split`，供共享工具后续处理使用。
    const filename = path.split(pathSeparator).pop()
    // filename 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!filename) return null

    // port格式化`filename.replace`，供共享工具后续处理使用。
    const port = filename.replace('.lock', '')

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      workspaceFolders,
      port: parseInt(port),
      pid,
      ideName,
      useWebSocket,
      runningInWindows,
      authToken,
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Checks if the IDE connection is responding by testing if the port is open
 * @param host Host to connect to
 * @param port Port to connect to
 * @param timeout Optional timeout in milliseconds (defaults to 500ms)
 * @returns true if the port is open, false otherwise
 */
// checkIdeConnection 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkIdeConnection(
  host: string,
  port: number,
  timeout = 500,
): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `new Promise(resolve => {`，作为共享工具这次计算的结果。
    return new Promise(resolve => {
      // socket构建`createConnection`，供共享工具后续处理使用。
      const socket = createConnection({
        host: host,
        port: port,
        timeout: timeout,
      })

      // 调用 socket.on，触发共享工具此处需要的副作用。
      socket.on('connect', () => {
        // 调用 socket.destroy，触发共享工具此处需要的副作用。
        socket.destroy()
        // 显式忽略 `resolve(true)` 的返回值，只保留它触发的副作用。
        void resolve(true)
      })

      // 调用 socket.on，触发共享工具此处需要的副作用。
      socket.on('error', () => {
        // 显式忽略 `resolve(false)` 的返回值，只保留它触发的副作用。
        void resolve(false)
      })

      // 调用 socket.on，触发共享工具此处需要的副作用。
      socket.on('timeout', () => {
        // 调用 socket.destroy，触发共享工具此处需要的副作用。
        socket.destroy()
        // 显式忽略 `resolve(false)` 的返回值，只保留它触发的副作用。
        void resolve(false)
      })
    })
  } catch (_) {
    // Invalid URL or other errors
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Resolve the Windows USERPROFILE path. WSL often doesn't pass USERPROFILE
 * through, so fall back to shelling out to powershell.exe. That spawn is
 * ~500ms–2s cold; the value is static per session.
 */
// getWindowsUserProfile 文件数据保存`memoize`，供共享工具后续处理使用。
const getWindowsUserProfile = memoize(async (): Promise<string | undefined> => {
  // 满足 `process.env.USERPROFILE` 时，共享工具执行该分支。
  if (process.env.USERPROFILE) return process.env.USERPROFILE
  // 从 `await execFileNoThrow('powershell.exe', [` 解构 stdout、code，减少共享工具 ide对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrow('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    '$env:USERPROFILE',
  ])
  // 只有 `code === 0 && stdout.trim()) return stdout.trim(` 满足时，共享工具才执行该分支。
  if (code === 0 && stdout.trim()) return stdout.trim()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    'Unable to get Windows USERPROFILE via PowerShell - IDE detection may be incomplete',
  )
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
})

/**
 * Gets the potential IDE lockfiles directories path based on platform.
 * Paths are not pre-checked for existence — the consumer readdirs each
 * and handles ENOENT. Pre-checking with stat() would double syscalls,
 * and on WSL (where /mnt/c access is 2-10x slower) the per-user-dir
 * stat loop compounded startup latency.
 */
// getIdeLockfilesPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getIdeLockfilesPaths(): Promise<string[]> {
  // 路径列表 聚合成有序列表，保持后续遍历顺序稳定。
  const paths: string[] = [join(getClaudeConfigHomeDir(), 'ide')]

  // `getPlatform()` 与 `'wsl'` 不一致时刷新派生状态，避免使用过期结果。
  if (getPlatform() !== 'wsl') {
    // 返回 `paths`，作为共享工具这次计算的结果。
    return paths
  }

  // For Windows, use heuristics to find the potential paths.
  // See https://learn.microsoft.com/en-us/windows/wsl/filesystems

  // windowsHome读取`getWindowsUserProfile`，供共享工具后续处理使用。
  const windowsHome = await getWindowsUserProfile()

  // 满足 `windowsHome` 时，共享工具执行该分支。
  if (windowsHome) {
    // converter保存`WindowsToWSLConverter`，供共享工具后续处理使用。
    const converter = new WindowsToWSLConverter(process.env.WSL_DISTRO_NAME)
    // wslPath 路径数据保存`converter.toLocalPath`，供共享工具后续处理使用。
    const wslPath = converter.toLocalPath(windowsHome)
    // 路径列表追加新条目，保持收集顺序与输入顺序一致。
    paths.push(resolve(wslPath, '.claude', 'ide'))
  }

  // Construct the path based on the standard Windows WSL locations
  // This can fail if the current user does not have "List folder contents" permission on C:\Users
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // usersDir固定为 `'/mnt/c/Users'`，作为共享工具 ide后续展示或比较的基准。
    const usersDir = '/mnt/c/Users'
    // userDirs 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const userDirs = await getFsImplementation().readdir(usersDir)

    // 按顺序遍历 `userDirs` 中的user，逐个交给共享工具处理。
    for (const user of userDirs) {
      // Skip files (e.g. desktop.ini) — readdir on a file path throws ENOTDIR.
      // isFsInaccessible covers ENOTDIR, but pre-filtering here avoids the
      // cost of attempting to readdir non-directories. Symlinks are kept since
      // Windows creates junction points for user profiles.
      // 只有 `!user.isDirectory() && !user.isSymbolicLink()` 满足时，共享工具才执行该分支。
      if (!user.isDirectory() && !user.isSymbolicLink()) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 共享工具在这里按实际状态进入对应分支。
      if (
        user.name === 'Public' ||
        user.name === 'Default' ||
        user.name === 'Default User' ||
        user.name === 'All Users'
      ) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue // Skip system directories
      }
      // 路径列表追加新条目，保持收集顺序与输入顺序一致。
      paths.push(join(usersDir, user.name, '.claude', 'ide'))
    }
  } catch (error: unknown) {
    // 满足 `isFsInaccessible(error)` 时，共享工具执行该分支。
    if (isFsInaccessible(error)) {
      // Expected on WSL when C: drive is not mounted or user lacks permissions
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `WSL IDE lockfile path detection failed (${error.code}): ${errorMessage(error)}`,
      )
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }
  // 返回 `paths`，作为共享工具这次计算的结果。
  return paths
}

/**
 * Cleans up stale IDE lockfiles
 * - Removes lockfiles for processes that are no longer running
 * - Removes lockfiles for ports that are not responding
 */
// cleanupStaleIdeLockfiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function cleanupStaleIdeLockfiles(): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // lockfiles 文件数据读取`getSortedIdeLockfiles`，供共享工具后续处理使用。
    const lockfiles = await getSortedIdeLockfiles()

    // 按顺序遍历 `lockfiles` 中的lockfilePath 路径数据，逐个交给共享工具处理。
    for (const lockfilePath of lockfiles) {
      // lockfileInfo 文件数据读取`readIdeLockfile`，供共享工具后续处理使用。
      const lockfileInfo = await readIdeLockfile(lockfilePath)

      // lockfileInfo 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!lockfileInfo) {
        // If we can't read the lockfile, delete it
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `getFsImplementation().unlink(lockfilePath)` 完成，再继续共享工具 ide的异步流程。
          await getFsImplementation().unlink(lockfilePath)
        } catch (error) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(error as Error)
        }
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // host读取`detectHostIP`，供共享工具后续处理使用。
      const host = await detectHostIP(
        lockfileInfo.runningInWindows,
        lockfileInfo.port,
      )

      // shouldDelete标记共享工具 ide是否启用对应路径。
      let shouldDelete = false

      // 满足 `lockfileInfo.pid` 时，共享工具执行该分支。
      if (lockfileInfo.pid) {
        // Check if the process is still running
        // 满足 `!isProcessRunning(lockfileInfo.pid)` 时，共享工具执行该分支。
        if (!isProcessRunning(lockfileInfo.pid)) {
          // `getPlatform()` 与 `'wsl'` 不一致时刷新派生状态，避免使用过期结果。
          if (getPlatform() !== 'wsl') {
            // shouldDelete更新为 `true`，确保共享工具后续读取最新状态。
            shouldDelete = true
          } else {
            // The process id may not be reliable in wsl, so also check the connection
            // isResponding记录 `checkIdeConnection` 是否成立，共享工具随后按该结果分支。
            const isResponding = await checkIdeConnection(
              host,
              lockfileInfo.port,
            )
            // isResponding缺失时直接走兜底路径，避免共享工具使用无效输入。
            if (!isResponding) {
              // shouldDelete更新为 `true`，确保共享工具后续读取最新状态。
              shouldDelete = true
            }
          }
        }
      } else {
        // No PID, check if the URL is responding
        // isResponding记录 `checkIdeConnection` 是否成立，共享工具随后按该结果分支。
        const isResponding = await checkIdeConnection(host, lockfileInfo.port)
        // isResponding缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!isResponding) {
          // shouldDelete更新为 `true`，确保共享工具后续读取最新状态。
          shouldDelete = true
        }
      }

      // 满足 `shouldDelete` 时，共享工具执行该分支。
      if (shouldDelete) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `getFsImplementation().unlink(lockfilePath)` 完成，再继续共享工具 ide的异步流程。
          await getFsImplementation().unlink(lockfilePath)
        } catch (error) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(error as Error)
        }
      }
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }
}

// IDEExtensionInstallationStatus 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface IDEExtensionInstallationStatus {
  installed: boolean
  error: string | null
  installedVersion: string | null
  ideType: IdeType | null
}

// maybeInstallIDEExtension 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function maybeInstallIDEExtension(
  ideType: IdeType,
): Promise<IDEExtensionInstallationStatus | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Install/update the extension
    // installedVersion保存`installIDEExtension`，供共享工具后续处理使用。
    const installedVersion = await installIDEExtension(ideType)
    // Only track successful installations
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_ext_installed', {})

    // Set diff tool config to auto if it has not been set already
    // globalConfig 配置读取`getGlobalConfig`，供共享工具后续处理使用。
    const globalConfig = getGlobalConfig()
    // globalConfig.diffTool 配置缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!globalConfig.diffTool) {
      // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
      saveGlobalConfig(current => ({ ...current, diffTool: 'auto' }))
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      installed: true,
      error: null,
      installedVersion,
      ideType: ideType,
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_ext_install_error', {})
    // Handle installation errors
    // errorMessage 消息数据保存`String`，供共享工具后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      installed: false,
      error: errorMessage,
      installedVersion: null,
      ideType: ideType,
    }
  }
}

// currentIDESearch 命名 `null`，让后续代码直接表达这个值的用途。
let currentIDESearch: AbortController | null = null

// findAvailableIDE 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findAvailableIDE(): Promise<DetectedIDEInfo | null> {
  // 满足 `currentIDESearch` 时，共享工具执行该分支。
  if (currentIDESearch) {
    // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
    currentIDESearch.abort()
  }
  // currentIDESearch更新为 `createAbortController()`，确保共享工具后续读取最新状态。
  currentIDESearch = createAbortController()
  // signal保存`currentIDESearch.signal`，供后续判断或组装使用。
  const signal = currentIDESearch.signal

  // Clean up stale IDE lockfiles first so we don't check them at all.
  // 等待 `cleanupStaleIdeLockfiles()` 完成，再继续共享工具 ide的异步流程。
  await cleanupStaleIdeLockfiles()
  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 只要 Date.now() - startTime < 30_000 && !signal.aborted 成立，就持续推进共享工具中的循环处理。
  while (Date.now() - startTime < 30_000 && !signal.aborted) {
    // Skip iteration during scroll drain — detectIDEs reads lockfiles +
    // shells out to ps, competing for the event loop with scroll frames.
    // Next tick after scroll settles resumes the search.
    // 满足 `getIsScrollDraining()` 时，共享工具执行该分支。
    if (getIsScrollDraining()) {
      // 等待 `sleep(1000, signal)` 完成，再继续共享工具 ide的异步流程。
      await sleep(1000, signal)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // ides 集合读取`detectIDEs`，供共享工具后续处理使用。
    const ides = await detectIDEs(false)
    // 满足 `signal.aborted` 时，共享工具执行该分支。
    if (signal.aborted) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // Return the IDE if and only if there is exactly one match, otherwise the user must
    // use /ide to select an IDE. When running from a supported built-in terminal, detectIDEs()
    // should return at most one IDE.
    // 满足 `ides.length === 1` 时，共享工具执行该分支。
    if (ides.length === 1) {
      // 返回 `ides[0]!`，作为共享工具这次计算的结果。
      return ides[0]!
    }
    // 等待 `sleep(1000, signal)` 完成，再继续共享工具 ide的异步流程。
    await sleep(1000, signal)
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Detects IDEs that have a running extension/plugin.
 * @param includeInvalid If true, also return IDEs that are invalid (ie. where
 * the workspace directory does not match the cwd)
 */
// detectIDEs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectIDEs(
  includeInvalid: boolean,
): Promise<DetectedIDEInfo[]> {
  // detectedIDEs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const detectedIDEs: DetectedIDEInfo[] = []

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Get the CLAUDE_CODE_SSE_PORT if set
    // ssePort 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const ssePort = process.env.CLAUDE_CODE_SSE_PORT
    // envPort解析`parseInt`，供共享工具后续处理使用。
    const envPort = ssePort ? parseInt(ssePort) : null

    // Get the current working directory, normalized to NFC for consistent
    // comparison. macOS returns NFD paths (decomposed Unicode), while IDEs
    // like VS Code report NFC paths (composed Unicode). Without normalization,
    // paths containing accented/CJK characters fail to match.
    // cwd读取`getOriginalCwd`，供共享工具后续处理使用。
    const cwd = getOriginalCwd().normalize('NFC')

    // Get sorted lockfiles (full paths) and read them all in parallel.
    // findAvailableIDE() polls this every 1s for up to 30s; serial I/O here was
    // showing up as ~500ms self-time in CPU profiles.
    // lockfiles 文件数据读取`getSortedIdeLockfiles`，供共享工具后续处理使用。
    const lockfiles = await getSortedIdeLockfiles()
    // lockfileInfos 文件数据保存`Promise.all`，供共享工具后续处理使用。
    const lockfileInfos = await Promise.all(lockfiles.map(readIdeLockfile))

    // Ancestor PID walk shells out (ps in a loop, up to 10x). Make it lazy and
    // single-shot per detectIDEs() call; with the workspace-check-first ordering
    // below, this often never fires at all.
    // getAncestors 集合构建`makeAncestorPidLookup`，供共享工具后续处理使用。
    const getAncestors = makeAncestorPidLookup()
    // needsAncestryCheck记录 `getPlatform` 是否成立，共享工具随后按该结果分支。
    const needsAncestryCheck = getPlatform() !== 'wsl' && isSupportedTerminal()

    // Try to find a lockfile that contains our current working directory
    // 按顺序遍历 `lockfileInfos` 中的lockfileInfo 文件数据，逐个交给共享工具处理。
    for (const lockfileInfo of lockfileInfos) {
      // lockfileInfo 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!lockfileInfo) continue

      // isValid标记共享工具 ide是否启用对应路径。
      let isValid = false
      // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_IDE_SKIP_VALID_CHECK)` 时，共享工具执行该分支。
      if (isEnvTruthy(process.env.CLAUDE_CODE_IDE_SKIP_VALID_CHECK)) {
        // isValid更新为 `true`，确保共享工具后续读取最新状态。
        isValid = true
      // 共享工具 ide在这里处理 `} else if (lockfileInfo.port === envPort) {`，完成这一小步状态转换。
      } else if (lockfileInfo.port === envPort) {
        // If the port matches the environment variable, mark as valid regardless of directory
        // isValid更新为 `true`，确保共享工具后续读取最新状态。
        isValid = true
      } else {
        // Otherwise, check if the current working directory is within the workspace folders
        // isValid更新为 `lockfileInfo.workspaceFolders.some(idePath => {`，确保共享工具后续读取最新状态。
        isValid = lockfileInfo.workspaceFolders.some(idePath => {
          // idePath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
          if (!idePath) return false

          // localPath 路径数据保存`idePath`，供共享工具 ide后续判断或输出使用。
          let localPath = idePath

          // Handle WSL-specific path conversion and distro matching
          // 共享工具在这里按实际状态进入对应分支。
          if (
            getPlatform() === 'wsl' &&
            lockfileInfo.runningInWindows &&
            process.env.WSL_DISTRO_NAME
          ) {
            // Check for WSL distro mismatch
            // 满足 `!checkWSLDistroMatch(idePath, process.env.WSL_DISTRO_NAME)` 时，共享工具执行该分支。
            if (!checkWSLDistroMatch(idePath, process.env.WSL_DISTRO_NAME)) {
              // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
              return false
            }

            // Try both the original path and the converted path
            // This handles cases where the IDE might report either format
            // resolvedOriginal读取`resolve`，供共享工具后续处理使用。
            const resolvedOriginal = resolve(localPath).normalize('NFC')
            // 共享工具在这里按实际状态进入对应分支。
            if (
              cwd === resolvedOriginal ||
              cwd.startsWith(resolvedOriginal + pathSeparator)
            ) {
              // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
              return true
            }

            // Convert Windows IDE path to WSL local path and check that too
            // converter保存`WindowsToWSLConverter`，供共享工具后续处理使用。
            const converter = new WindowsToWSLConverter(
              process.env.WSL_DISTRO_NAME,
            )
            // localPath 路径数据更新为 `converter.toLocalPath(idePath)`，确保共享工具后续读取最新状态。
            localPath = converter.toLocalPath(idePath)
          }

          // resolvedPath 路径数据读取`resolve`，供共享工具后续处理使用。
          const resolvedPath = resolve(localPath).normalize('NFC')

          // On Windows, normalize paths for case-insensitive drive letter comparison
          // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
          if (getPlatform() === 'windows') {
            // normalizedCwd格式化`cwd.replace`，供共享工具后续处理使用。
            const normalizedCwd = cwd.replace(/^[a-zA-Z]:/, match =>
              match.toUpperCase(),
            )
            // normalizedResolvedPath 路径数据格式化`resolvedPath.replace`，供共享工具后续处理使用。
            const normalizedResolvedPath = resolvedPath.replace(
              /^[a-zA-Z]:/,
              // match更新为 `> match.toUpperCase()`，确保共享工具后续读取最新状态。
              match => match.toUpperCase(),
            )
            // 返回 `(`，作为共享工具这次计算的结果。
            return (
              normalizedCwd === normalizedResolvedPath ||
              normalizedCwd.startsWith(normalizedResolvedPath + pathSeparator)
            )
          }

          // 返回 `(`，作为共享工具这次计算的结果。
          return (
            cwd === resolvedPath || cwd.startsWith(resolvedPath + pathSeparator)
          )
        })
      }

      // 只有 `!isValid && !includeInvalid` 满足时，共享工具才执行该分支。
      if (!isValid && !includeInvalid) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // PID ancestry check: when running in a supported IDE's built-in terminal,
      // ensure this lockfile's IDE is actually our parent process. This
      // disambiguates when multiple IDE windows have overlapping workspace folders.
      // Runs AFTER the workspace check so non-matching lockfiles skip it entirely —
      // previously this shelled out once per lockfile and dominated CPU profiles
      // during findAvailableIDE() polling.
      // 满足 `needsAncestryCheck` 时，共享工具执行该分支。
      if (needsAncestryCheck) {
        // portMatchesEnv标记共享工具 ide是否启用对应路径。
        const portMatchesEnv = envPort !== null && lockfileInfo.port === envPort
        // portMatchesEnv缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!portMatchesEnv) {
          // 只有 `!lockfileInfo.pid || !isProcessRunning(lockfileInfo.pid)` 满足时，共享工具才执行该分支。
          if (!lockfileInfo.pid || !isProcessRunning(lockfileInfo.pid)) {
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // `process.ppid` 与 `lockfileInfo.pid` 不一致时刷新派生状态，避免使用过期结果。
          if (process.ppid !== lockfileInfo.pid) {
            // ancestors 集合读取`getAncestors`，供共享工具后续处理使用。
            const ancestors = await getAncestors()
            // 满足 `!ancestors.has(lockfileInfo.pid)` 时，共享工具执行该分支。
            if (!ancestors.has(lockfileInfo.pid)) {
              // 跳过当前项，继续处理共享工具中的下一轮循环。
              continue
            }
          }
        }
      }

      // ideName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const ideName =
        lockfileInfo.ideName ??
        (isSupportedTerminal() ? toIDEDisplayName(envDynamic.terminal) : 'IDE')

      // host读取`detectHostIP`，供共享工具后续处理使用。
      const host = await detectHostIP(
        lockfileInfo.runningInWindows,
        lockfileInfo.port,
      )
      // url 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let url
      // 满足 `lockfileInfo.useWebSocket` 时，共享工具执行该分支。
      if (lockfileInfo.useWebSocket) {
        // URL更新为 ``ws://${host}:${lockfileInfo.port}``，确保共享工具后续读取最新状态。
        url = `ws://${host}:${lockfileInfo.port}`
      } else {
        // URL更新为 ``http://${host}:${lockfileInfo.port}/sse``，确保共享工具后续读取最新状态。
        url = `http://${host}:${lockfileInfo.port}/sse`
      }

      // detectedIDEs 集合追加新条目，保持收集顺序与输入顺序一致。
      detectedIDEs.push({
        url: url,
        name: ideName,
        workspaceFolders: lockfileInfo.workspaceFolders,
        port: lockfileInfo.port,
        isValid: isValid,
        authToken: lockfileInfo.authToken,
        ideRunningInWindows: lockfileInfo.runningInWindows,
      })
    }

    // The envPort should be defined for supported IDE terminals. If there is
    // an extension with a matching envPort, then we will single that one out
    // and return it, otherwise we return all the valid ones.
    // 只有 `!includeInvalid && envPort` 满足时，共享工具才执行该分支。
    if (!includeInvalid && envPort) {
      // envPortMatch筛选`detectedIDEs.filter`，供共享工具后续处理使用。
      const envPortMatch = detectedIDEs.filter(
        // ide更新为 `> ide.isValid && ide.port === envPort`，确保共享工具后续读取最新状态。
        ide => ide.isValid && ide.port === envPort,
      )
      // 满足 `envPortMatch.length === 1` 时，共享工具执行该分支。
      if (envPortMatch.length === 1) {
        // 返回 `envPortMatch`，作为共享工具这次计算的结果。
        return envPortMatch
      }
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }

  // 返回 `detectedIDEs`，作为共享工具这次计算的结果。
  return detectedIDEs
}

// maybeNotifyIDEConnected 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function maybeNotifyIDEConnected(client: Client) {
  // 等待 `client.notification({` 完成，再继续共享工具 ide的异步流程。
  await client.notification({
    method: 'ide_connected',
    params: {
      pid: process.pid,
    },
  })
}

// hasAccessToIDEExtensionDiffFeature 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasAccessToIDEExtensionDiffFeature(
  mcpClients: MCPServerConnection[],
): boolean {
  // Check if there's a connected IDE client in the provided MCP clients list
  // 返回 `mcpClients.some(`，作为共享工具这次计算的结果。
  return mcpClients.some(
    // API 客户端更新为 `> client.type === 'connected' && client.name === 'ide'`，确保共享工具后续读取最新状态。
    client => client.type === 'connected' && client.name === 'ide',
  )
}

// EXTENSION_ID 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const EXTENSION_ID =
  process.env.USER_TYPE === 'ant'
    ? 'anthropic.claude-code-internal'
    : 'anthropic.claude-code'

// isIDEExtensionInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isIDEExtensionInstalled(
  ideType: IdeType,
): Promise<boolean> {
  // 满足 `isVSCodeIde(ideType)` 时，共享工具执行该分支。
  if (isVSCodeIde(ideType)) {
    // 命令读取`getVSCodeIDECommand`，供共享工具后续处理使用。
    const command = await getVSCodeIDECommand(ideType)
    // 满足 `command` 时，共享工具执行该分支。
    if (command) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
        const result = await execFileNoThrowWithCwd(
          command,
          ['--list-extensions'],
          {
            env: getInstallationEnv(),
          },
        )
        // 满足 `result.stdout?.includes(EXTENSION_ID)` 时，共享工具执行该分支。
        if (result.stdout?.includes(EXTENSION_ID)) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      } catch {
        // eat the error
      }
    }
  // 共享工具 ide在这里处理 `} else if (isJetBrainsIde(ideType)) {`，完成这一小步状态转换。
  } else if (isJetBrainsIde(ideType)) {
    // 等待并返回 `isJetBrainsPluginInstalledCached(ideType)`，调用方直接接收异步结果。
    return await isJetBrainsPluginInstalledCached(ideType)
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// installIDEExtension 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installIDEExtension(ideType: IdeType): Promise<string | null> {
  // 满足 `isVSCodeIde(ideType)` 时，共享工具执行该分支。
  if (isVSCodeIde(ideType)) {
    // 命令读取`getVSCodeIDECommand`，供共享工具后续处理使用。
    const command = await getVSCodeIDECommand(ideType)

    // 满足 `command` 时，共享工具执行该分支。
    if (command) {
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 等待并返回 `installFromArtifactory(command)`，调用方直接接收异步结果。
        return await installFromArtifactory(command)
      }
      // version读取`getInstalledVSCodeExtensionVersion`，供共享工具后续处理使用。
      let version = await getInstalledVSCodeExtensionVersion(command)
      // If it's not installed or the version is older than the one we have bundled,
      // 只有 `!version || lt(version, getClaudeCodeVersion())` 满足时，共享工具才执行该分支。
      if (!version || lt(version, getClaudeCodeVersion())) {
        // `code` may crash when invoked too quickly in succession
        // 等待 `sleep(500)` 完成，再继续共享工具 ide的异步流程。
        await sleep(500)
        // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
        const result = await execFileNoThrowWithCwd(
          command,
          ['--force', '--install-extension', 'anthropic.claude-code'],
          {
            env: getInstallationEnv(),
          },
        )
        // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
        if (result.code !== 0) {
          // 抛出 new Error(`${result.code}: ${result.error} ${result.stderr}`)，阻止共享工具在无效状态下继续运行。
          throw new Error(`${result.code}: ${result.error} ${result.stderr}`)
        }
        // version更新为 `getClaudeCodeVersion()`，确保共享工具后续读取最新状态。
        version = getClaudeCodeVersion()
      }
      // 返回 `version`，作为共享工具这次计算的结果。
      return version
    }
  }
  // No automatic installation for JetBrains IDEs as it is not supported in native
  // builds. We show a prominent notice for them to download from the marketplace
  // instead.
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// getInstallationEnv 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInstallationEnv(): NodeJS.ProcessEnv | undefined {
  // Cursor on Linux may incorrectly implement
  // the `code` command and actually launch the UI.
  // Make this error out if this happens by clearing the DISPLAY
  // environment variable.
  // 当 `getPlatform()` 匹配 `'linux'` 时，共享工具执行对应分支。
  if (getPlatform() === 'linux') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...process.env,
      DISPLAY: '',
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// getClaudeCodeVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getClaudeCodeVersion() {
  // 返回 `MACRO.VERSION`，作为共享工具这次计算的结果。
  return MACRO.VERSION
}

// getInstalledVSCodeExtensionVersion 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getInstalledVSCodeExtensionVersion(
  command: string,
): Promise<string | null> {
  // 从 `await execFileNoThrow(` 解构 stdout，减少共享工具 ide对同一对象的重复访问。
  const { stdout } = await execFileNoThrow(
    command,
    ['--list-extensions', '--show-versions'],
    {
      env: getInstallationEnv(),
    },
  )
  // 文本行格式化`split`，供共享工具后续处理使用。
  const lines = stdout?.split('\n') || []
  // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
  for (const line of lines) {
    // 从 `line.split('@')` 按位置拆出 extensionId、version，让共享工具 ide分别处理这些返回值。
    const [extensionId, version] = line.split('@')
    // 只有 `extensionId === 'anthropic.claude-code' && version` 满足时，共享工具才执行该分支。
    if (extensionId === 'anthropic.claude-code' && version) {
      // 返回 `version`，作为共享工具这次计算的结果。
      return version
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// getVSCodeIDECommandByParentProcess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getVSCodeIDECommandByParentProcess(): string | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // platform读取`getPlatform`，供共享工具后续处理使用。
    const platform = getPlatform()

    // Only supported on OSX, where Cursor has the ability to
    // register itself as the 'code' command.
    // `platform` 与 `'macos'` 不一致时刷新派生状态，避免使用过期结果。
    if (platform !== 'macos') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // pid保存`process.ppid`，供后续判断或组装使用。
    let pid = process.ppid

    // Walk up the process tree to find the actual app
    // 按索引扫描 `10`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < 10; i++) {
      // 只有 `!pid || pid === 0 || pid === 1` 满足时，共享工具才执行该分支。
      if (!pid || pid === 0 || pid === 1) break

      // Get the command for this PID
      // this function already returned if not running on macos
      // 命令保存`execSyncWithDefaults_DEPRECATED`，供共享工具后续处理使用。
      const command = execSyncWithDefaults_DEPRECATED(
        // eslint-disable-next-line custom-rules/no-direct-ps-commands
        `ps -o command= -p ${pid}`,
      )?.trim()

      // 满足 `command` 时，共享工具执行该分支。
      if (command) {
        // Check for known applications and extract the path up to and including .app
        // appNames 集合集中保存共享工具 ide要一起传递的字段。
        const appNames = {
          'Visual Studio Code.app': 'code',
          'Cursor.app': 'cursor',
          'Windsurf.app': 'windsurf',
          'Visual Studio Code - Insiders.app': 'code',
          'VSCodium.app': 'codium',
        }
        // pathToExecutable 路径数据保存`'/Contents/MacOS/Electron'`，作为后续固定文本处理的输入。
        const pathToExecutable = '/Contents/MacOS/Electron'

        // 循环处理 `const [appName, executableName] of Object.entries(appNames)`，让共享工具把同类条目按顺序走完。
        for (const [appName, executableName] of Object.entries(appNames)) {
          // appIndex 索引保存`command.indexOf`，供共享工具后续处理使用。
          const appIndex = command.indexOf(appName + pathToExecutable)
          // `appIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
          if (appIndex !== -1) {
            // Extract the path from the beginning to the end of the .app name
            // folderPathEnd 路径数据记录 `appIndex + appName.length` 是否成立，下一步按该结果分支。
            const folderPathEnd = appIndex + appName.length
            // These are all known VSCode variants with the same structure
            // 返回 `(`，作为共享工具这次计算的结果。
            return (
              command.substring(0, folderPathEnd) +
              '/Contents/Resources/app/bin/' +
              executableName
            )
          }
        }
      }

      // Get parent PID
      // this function already returned if not running on macos
      // ppidStr保存`execSyncWithDefaults_DEPRECATED`，供共享工具后续处理使用。
      const ppidStr = execSyncWithDefaults_DEPRECATED(
        // eslint-disable-next-line custom-rules/no-direct-ps-commands
        `ps -o ppid= -p ${pid}`,
      )?.trim()
      // ppidStr缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!ppidStr) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // pid更新为 `parseInt(ppidStr.trim())`，确保共享工具后续读取最新状态。
      pid = parseInt(ppidStr.trim())
    }

    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}
// getVSCodeIDECommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getVSCodeIDECommand(ideType: IdeType): Promise<string | null> {
  // parentExecutable读取`getVSCodeIDECommandByParentProcess`，供共享工具后续处理使用。
  const parentExecutable = getVSCodeIDECommandByParentProcess()
  // 满足 `parentExecutable` 时，共享工具执行该分支。
  if (parentExecutable) {
    // Verify the parent executable actually exists
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `getFsImplementation().stat(parentExecutable)` 完成，再继续共享工具 ide的异步流程。
      await getFsImplementation().stat(parentExecutable)
      // 返回 `parentExecutable`，作为共享工具这次计算的结果。
      return parentExecutable
    } catch {
      // Parent executable doesn't exist
    }
  }

  // On Windows, explicitly request the .cmd wrapper. VS Code 1.110.0 began
  // prepending the install root (containing Code.exe, the Electron GUI binary)
  // to the integrated terminal's PATH ahead of bin\ (containing code.cmd, the
  // CLI wrapper) when launched via Start-Menu/Taskbar shortcuts. A bare 'code'
  // then resolves to Code.exe via PATHEXT which opens a new editor window
  // instead of running the CLI. Asking for 'code.cmd' forces cross-spawn/which
  // to skip Code.exe. See microsoft/vscode#299416 (fixed in Insiders) and
  // anthropics/claude-code#30975.
  // ext读取`getPlatform`，供共享工具后续处理使用。
  const ext = getPlatform() === 'windows' ? '.cmd' : ''
  // 按照 ideType 的取值选择共享工具的具体处理分支。
  switch (ideType) {
    case 'vscode':
      // 返回 `'code' + ext`，作为共享工具这次计算的结果。
      return 'code' + ext
    case 'cursor':
      // 返回 `'cursor' + ext`，作为共享工具这次计算的结果。
      return 'cursor' + ext
    case 'windsurf':
      // 返回 `'windsurf' + ext`，作为共享工具这次计算的结果。
      return 'windsurf' + ext
    default:
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// isCursorInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isCursorInstalled(): Promise<boolean> {
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow('cursor', ['--version'])
  // 返回 `result.code === 0`，作为共享工具这次计算的结果。
  return result.code === 0
}

// isWindsurfInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isWindsurfInstalled(): Promise<boolean> {
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow('windsurf', ['--version'])
  // 返回 `result.code === 0`，作为共享工具这次计算的结果。
  return result.code === 0
}

// isVSCodeInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isVSCodeInstalled(): Promise<boolean> {
  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow('code', ['--help'])
  // Check if the output indicates this is actually Visual Studio Code
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    result.code === 0 && Boolean(result.stdout?.includes('Visual Studio Code'))
  )
}

// Cache for IDE detection results
// cachedRunningIDEs 缓存保存`null`，作为后续空值处理的输入。
let cachedRunningIDEs: IdeType[] | null = null

/**
 * Internal implementation of IDE detection.
 */
// detectRunningIDEsImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectRunningIDEsImpl(): Promise<IdeType[]> {
  // runningIDEs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const runningIDEs: IdeType[] = []

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // platform读取`getPlatform`，供共享工具后续处理使用。
    const platform = getPlatform()
    // 当 `platform` 匹配 `'macos'` 时，共享工具执行对应分支。
    if (platform === 'macos') {
      // On macOS, use ps with process name matching
      // 结果保存`execa`，供共享工具后续处理使用。
      const result = await execa(
        'ps aux | grep -E "Visual Studio Code|Code Helper|Cursor Helper|Windsurf Helper|IntelliJ IDEA|PyCharm|WebStorm|PhpStorm|RubyMine|CLion|GoLand|Rider|DataGrip|AppCode|DataSpell|Aqua|Gateway|Fleet|Android Studio" | grep -v grep',
        { shell: true, reject: false },
      )
      // stdout保存`result.stdout ?? ''`，供后续判断或组装使用。
      const stdout = result.stdout ?? ''
      // 循环处理 `const [ide, config] of Object.entries(supportedIdeConfigs)`，让共享工具把同类条目按顺序走完。
      for (const [ide, config] of Object.entries(supportedIdeConfigs)) {
        // 按顺序遍历 `config.processKeywordsMac` 中的keyword，逐个交给共享工具处理。
        for (const keyword of config.processKeywordsMac) {
          // 满足 `stdout.includes(keyword)` 时，共享工具执行该分支。
          if (stdout.includes(keyword)) {
            // runningIDEs 集合追加新条目，保持收集顺序与输入顺序一致。
            runningIDEs.push(ide as IdeType)
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
        }
      }
    // 共享工具 ide在这里处理 `} else if (platform === 'windows') {`，完成这一小步状态转换。
    } else if (platform === 'windows') {
      // On Windows, use tasklist with findstr for multiple patterns
      // 结果保存`execa`，供共享工具后续处理使用。
      const result = await execa(
        'tasklist | findstr /I "Code.exe Cursor.exe Windsurf.exe idea64.exe pycharm64.exe webstorm64.exe phpstorm64.exe rubymine64.exe clion64.exe goland64.exe rider64.exe datagrip64.exe appcode.exe dataspell64.exe aqua64.exe gateway64.exe fleet.exe studio64.exe"',
        { shell: true, reject: false },
      )
      // stdout保存`result.stdout ?? ''`，供后续判断或组装使用。
      const stdout = result.stdout ?? ''

      // normalizedStdout保存`stdout.toLowerCase`，供共享工具后续处理使用。
      const normalizedStdout = stdout.toLowerCase()

      // 循环处理 `const [ide, config] of Object.entries(supportedIdeConfigs)`，让共享工具把同类条目按顺序走完。
      for (const [ide, config] of Object.entries(supportedIdeConfigs)) {
        // 按顺序遍历 `config.processKeywordsWindows` 中的keyword，逐个交给共享工具处理。
        for (const keyword of config.processKeywordsWindows) {
          // 满足 `normalizedStdout.includes(keyword.toLowerCase())` 时，共享工具执行该分支。
          if (normalizedStdout.includes(keyword.toLowerCase())) {
            // runningIDEs 集合追加新条目，保持收集顺序与输入顺序一致。
            runningIDEs.push(ide as IdeType)
            // 结束这个分支或循环，避免共享工具继续落入后续路径。
            break
          }
        }
      }
    // 共享工具 ide在这里处理 `} else if (platform === 'linux') {`，完成这一小步状态转换。
    } else if (platform === 'linux') {
      // On Linux, use ps with process name matching
      // 结果保存`execa`，供共享工具后续处理使用。
      const result = await execa(
        'ps aux | grep -E "code|cursor|windsurf|idea|pycharm|webstorm|phpstorm|rubymine|clion|goland|rider|datagrip|dataspell|aqua|gateway|fleet|android-studio" | grep -v grep',
        { shell: true, reject: false },
      )
      // stdout保存`result.stdout ?? ''`，供后续判断或组装使用。
      const stdout = result.stdout ?? ''

      // normalizedStdout保存`stdout.toLowerCase`，供共享工具后续处理使用。
      const normalizedStdout = stdout.toLowerCase()

      // 循环处理 `const [ide, config] of Object.entries(supportedIdeConfigs)`，让共享工具把同类条目按顺序走完。
      for (const [ide, config] of Object.entries(supportedIdeConfigs)) {
        // 按顺序遍历 `config.processKeywordsLinux` 中的keyword，逐个交给共享工具处理。
        for (const keyword of config.processKeywordsLinux) {
          // 满足 `normalizedStdout.includes(keyword)` 时，共享工具执行该分支。
          if (normalizedStdout.includes(keyword)) {
            // `ide` 与 `'vscode'` 不一致时刷新派生状态，避免使用过期结果。
            if (ide !== 'vscode') {
              // runningIDEs 集合追加新条目，保持收集顺序与输入顺序一致。
              runningIDEs.push(ide as IdeType)
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            // 共享工具 ide在这里处理 `} else if (`，完成这一小步状态转换。
            } else if (
              !normalizedStdout.includes('cursor') &&
              !normalizedStdout.includes('appcode')
            ) {
              // Special case conflicting keywords from some of the IDEs.
              // runningIDEs 集合追加新条目，保持收集顺序与输入顺序一致。
              runningIDEs.push(ide as IdeType)
              // 结束这个分支或循环，避免共享工具继续落入后续路径。
              break
            }
          }
        }
      }
    }
  } catch (error) {
    // If process detection fails, return empty array
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }

  // 返回 `runningIDEs`，作为共享工具这次计算的结果。
  return runningIDEs
}

/**
 * Detects running IDEs and returns an array of IdeType for those that are running.
 * This performs fresh detection (~150ms) and updates the cache for subsequent
 * detectRunningIDEsCached() calls.
 */
// detectRunningIDEs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectRunningIDEs(): Promise<IdeType[]> {
  // 结果读取`detectRunningIDEsImpl`，供共享工具后续处理使用。
  const result = await detectRunningIDEsImpl()
  // cachedRunningIDEs 缓存更新为 `result`，确保共享工具后续读取最新状态。
  cachedRunningIDEs = result
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Returns cached IDE detection results, or performs detection if cache is empty.
 * Use this for performance-sensitive paths like tips where fresh results aren't needed.
 */
// detectRunningIDEsCached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectRunningIDEsCached(): Promise<IdeType[]> {
  // 满足 `cachedRunningIDEs === null` 时，共享工具执行该分支。
  if (cachedRunningIDEs === null) {
    // 返回 `detectRunningIDEs()`，作为共享工具这次计算的结果。
    return detectRunningIDEs()
  }
  // 返回 `cachedRunningIDEs`，作为共享工具这次计算的结果。
  return cachedRunningIDEs
}

/**
 * Resets the cache for detectRunningIDEsCached.
 * Exported for testing - allows resetting state between tests.
 */
// resetDetectRunningIDEs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetDetectRunningIDEs(): void {
  // cachedRunningIDEs 缓存更新为 `null`，确保共享工具后续读取最新状态。
  cachedRunningIDEs = null
}

// getConnectedIdeName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getConnectedIdeName(
  mcpClients: MCPServerConnection[],
): string | null {
  // ideClient筛选`mcpClients.find`，供共享工具后续处理使用。
  const ideClient = mcpClients.find(
    client => client.type === 'connected' && client.name === 'ide',
  )
  // 返回 `getIdeClientName(ideClient)`，作为共享工具这次计算的结果。
  return getIdeClientName(ideClient)
}

// getIdeClientName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getIdeClientName(
  ideClient?: MCPServerConnection,
): string | null {
  // 配置保存`ideClient?.config`，供后续判断或组装使用。
  const config = ideClient?.config
  // 返回 `config?.type === 'sse-ide' || config?.type === 'ws-ide'`，作为共享工具这次计算的结果。
  return config?.type === 'sse-ide' || config?.type === 'ws-ide'
    ? config.ideName
    : isSupportedTerminal()
      ? toIDEDisplayName(envDynamic.terminal)
      : null
}

// EDITOR_DISPLAY_NAMES 集合 集中保存共享工具 ide要一起传递的字段。
const EDITOR_DISPLAY_NAMES: Record<string, string> = {
  code: 'VS Code',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  antigravity: 'Antigravity',
  vi: 'Vim',
  vim: 'Vim',
  nano: 'nano',
  notepad: 'Notepad',
  'start /wait notepad': 'Notepad',
  emacs: 'Emacs',
  subl: 'Sublime Text',
  atom: 'Atom',
}

// toIDEDisplayName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toIDEDisplayName(terminal: string | null): string {
  // terminal缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!terminal) return 'IDE'

  // 配置 命名 `supportedIdeConfigs[terminal as IdeType]`，让后续代码直接表达这个值的用途。
  const config = supportedIdeConfigs[terminal as IdeType]
  // 满足 `config` 时，共享工具执行该分支。
  if (config) {
    // 返回 `config.displayName`，作为共享工具这次计算的结果。
    return config.displayName
  }

  // Check editor command names (exact match first)
  // editorName保存`terminal.toLowerCase`，供共享工具后续处理使用。
  const editorName = EDITOR_DISPLAY_NAMES[terminal.toLowerCase().trim()]
  // 满足 `editorName` 时，共享工具执行该分支。
  if (editorName) {
    // 返回 `editorName`，作为共享工具这次计算的结果。
    return editorName
  }

  // Extract command name from path/arguments (e.g., "/usr/bin/code --wait" -> "code")
  // 命令格式化`terminal.split`，供共享工具后续处理使用。
  const command = terminal.split(' ')[0]
  // commandName 命令数据保存`basename`，供共享工具后续处理使用。
  const commandName = command ? basename(command).toLowerCase() : null
  // 满足 `commandName` 时，共享工具执行该分支。
  if (commandName) {
    // mappedName读取 `EDITOR_DISPLAY_NAMES[commandName]` 对应条目，后续围绕该成员继续处理。
    const mappedName = EDITOR_DISPLAY_NAMES[commandName]
    // 满足 `mappedName` 时，共享工具执行该分支。
    if (mappedName) {
      // 返回 `mappedName`，作为共享工具这次计算的结果。
      return mappedName
    }
    // Fallback: capitalize the command basename
    // 返回 `capitalize(commandName)`，作为共享工具这次计算的结果。
    return capitalize(commandName)
  }

  // Fallback: capitalize first letter
  // 返回 `capitalize(terminal)`，作为共享工具这次计算的结果。
  return capitalize(terminal)
}

// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { callIdeRpc }

/**
 * Gets the connected IDE client from a list of MCP clients
 * @param mcpClients - Array of wrapped MCP clients
 * @returns The connected IDE client, or undefined if not found
 */
// getConnectedIdeClient 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getConnectedIdeClient(
  mcpClients?: MCPServerConnection[],
): ConnectedMCPServer | undefined {
  // mcpClients 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!mcpClients) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // ideClient筛选`mcpClients.find`，供共享工具后续处理使用。
  const ideClient = mcpClients.find(
    // API 客户端更新为 `> client.type === 'connected' && client.name === 'ide'`，确保共享工具后续读取最新状态。
    client => client.type === 'connected' && client.name === 'ide',
  )

  // Type guard to ensure we return the correct type
  // 返回 `ideClient?.type === 'connected' ? ideClient : undefined`，作为共享工具这次计算的结果。
  return ideClient?.type === 'connected' ? ideClient : undefined
}

/**
 * Notifies the IDE that a new prompt has been submitted.
 * This triggers IDE-specific actions like closing all diff tabs.
 */
// closeOpenDiffs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function closeOpenDiffs(
  ideClient: ConnectedMCPServer,
): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `callIdeRpc('closeAllDiffTabs', {}, ideClient)` 完成，再继续共享工具 ide的异步流程。
    await callIdeRpc('closeAllDiffTabs', {}, ideClient)
  } catch (_) {
    // Silently ignore errors when closing diff tabs
    // This prevents exceptions if the IDE doesn't support this operation
  }
}

/**
 * Initializes IDE detection and extension installation, then calls the provided callback
 * with the detected IDE information and installation status.
 * @param ideToInstallExtension The ide to install the extension to (if installing from external terminal)
 * @param onIdeDetected Callback to be called when an IDE is detected (including null)
 * @param onInstallationComplete Callback to be called when extension installation is complete
 */
// initializeIdeIntegration 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initializeIdeIntegration(
  // 这个回调绑定到 onIdeDetected: (ide: DetectedIDEInfo | null) => void,，负责共享工具在该局部场景下的响应。
  onIdeDetected: (ide: DetectedIDEInfo | null) => void,
  ideToInstallExtension: IdeType | null,
  // 这个回调绑定到 onShowIdeOnboarding: () => void,，负责共享工具在该局部场景下的响应。
  onShowIdeOnboarding: () => void,
  // 共享工具 ide在这里处理 `onInstallationComplete: (`，完成这一小步状态转换。
  onInstallationComplete: (
    status: IDEExtensionInstallationStatus | null,
  ) => void,
): Promise<void> {
  // Don't await so we don't block startup, but return a promise that resolves with the status
  // 显式忽略 `findAvailableIDE().then(onIdeDetected)` 的返回值，只保留它触发的副作用。
  void findAvailableIDE().then(onIdeDetected)

  // shouldAutoInstall记录 `getGlobalConfig` 是否成立，共享工具随后按该结果分支。
  const shouldAutoInstall = getGlobalConfig().autoInstallIdeExtension ?? true
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !isEnvTruthy(process.env.CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL) &&
    shouldAutoInstall
  ) {
    // ideType读取`getTerminalIdeType`，供共享工具后续处理使用。
    const ideType = ideToInstallExtension ?? getTerminalIdeType()
    // 满足 `ideType` 时，共享工具执行该分支。
    if (ideType) {
      // 满足 `isVSCodeIde(ideType)` 时，共享工具执行该分支。
      if (isVSCodeIde(ideType)) {
        // 这个回调绑定到 void isIDEExtensionInstalled(ideType).then(async isAlreadyInstalled => {，负责共享工具在该局部场景下的响应。
        void isIDEExtensionInstalled(ideType).then(async isAlreadyInstalled => {
          // 显式忽略 `maybeInstallIDEExtension(ideType)` 的返回值，只保留它触发的副作用。
          void maybeInstallIDEExtension(ideType)
            // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
            .catch(error => {
              // ideInstallationStatus 集合 集中保存共享工具 ide要一起传递的字段。
              const ideInstallationStatus: IDEExtensionInstallationStatus = {
                installed: false,
                error: error.message || 'Installation failed',
                installedVersion: null,
                ideType: ideType,
              }
              // 返回 `ideInstallationStatus`，作为共享工具这次计算的结果。
              return ideInstallationStatus
            })
            // 链式调用 then，继续加工上一行在共享工具中产生的数据。
            .then(status => {
              // 调用 onInstallationComplete，触发共享工具此处需要的副作用。
              onInstallationComplete(status)

              // 满足 `status?.installed` 时，共享工具执行该分支。
              if (status?.installed) {
                // If we installed and don't yet have an IDE, search again.
                // 显式忽略 `findAvailableIDE().then(onIdeDetected)` 的返回值，只保留它触发的副作用。
                void findAvailableIDE().then(onIdeDetected)
              }

              // 共享工具在这里按实际状态进入对应分支。
              if (
                !isAlreadyInstalled &&
                status?.installed === true &&
                !ideOnboardingDialog().hasIdeOnboardingDialogBeenShown()
              ) {
                // 调用 onShowIdeOnboarding，触发共享工具此处需要的副作用。
                onShowIdeOnboarding()
              }
            })
        })
      // 共享工具 ide在这里处理 `} else if (isJetBrainsIde(ideType)) {`，完成这一小步状态转换。
      } else if (isJetBrainsIde(ideType)) {
        // Always check installation to populate the sync cache used by status notices
        // 这个回调绑定到 void isIDEExtensionInstalled(ideType).then(async installed => {，负责共享工具在该局部场景下的响应。
        void isIDEExtensionInstalled(ideType).then(async installed => {
          // 共享工具在这里按实际状态进入对应分支。
          if (
            installed &&
            !ideOnboardingDialog().hasIdeOnboardingDialogBeenShown()
          ) {
            // 调用 onShowIdeOnboarding，触发共享工具此处需要的副作用。
            onShowIdeOnboarding()
          }
        })
      }
    }
  }
}

/**
 * Detects the host IP to use to connect to the extension.
 */
// detectHostIP保存`memoize`，供共享工具后续处理使用。
const detectHostIP = memoize(
  async (isIdeRunningInWindows: boolean, port: number) => {
    // 满足 `process.env.CLAUDE_CODE_IDE_HOST_OVERRIDE` 时，共享工具执行该分支。
    if (process.env.CLAUDE_CODE_IDE_HOST_OVERRIDE) {
      // 返回 `process.env.CLAUDE_CODE_IDE_HOST_OVERRIDE`，作为共享工具这次计算的结果。
      return process.env.CLAUDE_CODE_IDE_HOST_OVERRIDE
    }

    // `getPlatform()` 与 `'wsl' || !isIdeRunningInWindows` 不一致时刷新派生状态，避免使用过期结果。
    if (getPlatform() !== 'wsl' || !isIdeRunningInWindows) {
      // 返回 `'127.0.0.1'`，作为共享工具这次计算的结果。
      return '127.0.0.1'
    }

    // If we are running under the WSL2 VM but the extension/plugin is running in
    // Windows, then we must use a different IP address to connect to the extension.
    // https://learn.microsoft.com/en-us/windows/wsl/networking
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // routeResult保存`execa`，供共享工具后续处理使用。
      const routeResult = await execa('ip route show | grep -i default', {
        shell: true,
        reject: false,
      })
      // 只有 `routeResult.exitCode === 0 && routeResult.stdout` 满足时，共享工具才执行该分支。
      if (routeResult.exitCode === 0 && routeResult.stdout) {
        // gatewayMatch匹配`stdout.match`，供共享工具后续处理使用。
        const gatewayMatch = routeResult.stdout.match(
          /default via (\d+\.\d+\.\d+\.\d+)/,
        )
        // 满足 `gatewayMatch` 时，共享工具执行该分支。
        if (gatewayMatch) {
          // gatewayIP读取 `gatewayMatch[1]!` 对应条目，后续围绕该成员继续处理。
          const gatewayIP = gatewayMatch[1]!
          // 满足 `await checkIdeConnection(gatewayIP, port)` 时，共享工具执行该分支。
          if (await checkIdeConnection(gatewayIP, port)) {
            // 返回 `gatewayIP`，作为共享工具这次计算的结果。
            return gatewayIP
          }
        }
      }
    } catch (_) {
      // Suppress any errors
    }

    // Fallback to the default if we cannot find anything
    // 返回 `'127.0.0.1'`，作为共享工具这次计算的结果。
    return '127.0.0.1'
  },
  // 这个回调绑定到 (isIdeRunningInWindows, port) => `${isIdeRunningInWindows}:${port}`,，负责共享工具在该局部场景下的响应。
  (isIdeRunningInWindows, port) => `${isIdeRunningInWindows}:${port}`,
)

// installFromArtifactory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function installFromArtifactory(command: string): Promise<string> {
  // Read auth token from ~/.npmrc
  // npmrcPath 路径数据格式化`join`，供共享工具后续处理使用。
  const npmrcPath = join(os.homedir(), '.npmrc')
  // 认证令牌保存`null`，作为后续空值处理的输入。
  let authToken: string | null = null
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // npmrcContent读取`fs.readFile`，供共享工具后续处理使用。
    const npmrcContent = await fs.readFile(npmrcPath, {
      encoding: 'utf8',
    })
    // 文本行格式化`npmrcContent.split`，供共享工具后续处理使用。
    const lines = npmrcContent.split('\n')
    // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
    for (const line of lines) {
      // Look for the artifactory auth token line
      // match匹配`line.match`，供共享工具后续处理使用。
      const match = line.match(
        /\/\/artifactory\.infra\.ant\.dev\/artifactory\/api\/npm\/npm-all\/:_authToken=(.+)/,
      )
      // 只有 `match && match[1]` 满足时，共享工具才执行该分支。
      if (match && match[1]) {
        // 认证令牌更新为 `match[1].trim()`，确保共享工具后续读取最新状态。
        authToken = match[1].trim()
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 抛出 new Error(`Failed to read npm authentication: ${error}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Failed to read npm authentication: ${error}`)
  }

  // 认证令牌缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!authToken) {
    // 抛出 new Error('No artifactory auth token found in ~/.npmrc')，阻止共享工具在无效状态下继续运行。
    throw new Error('No artifactory auth token found in ~/.npmrc')
  }

  // Fetch the version from artifactory
  // versionUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const versionUrl =
    'https://artifactory.infra.ant.dev/artifactory/armorcode-claude-code-internal/claude-vscode-releases/stable'

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // versionResponse 响应数据读取`axios.get`，供共享工具后续处理使用。
    const versionResponse = await axios.get(versionUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    // version格式化`data.trim`，供共享工具后续处理使用。
    const version = versionResponse.data.trim()
    // version缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!version) {
      // 抛出 new Error('No version found in artifactory response')，阻止共享工具在无效状态下继续运行。
      throw new Error('No version found in artifactory response')
    }

    // Download the .vsix file from artifactory
    // vsixUrl 命名 ``https://artifactory.infra.ant.dev/artifactory/armorcode-...`，让后续代码直接表达这个值的用途。
    const vsixUrl = `https://artifactory.infra.ant.dev/artifactory/armorcode-claude-code-internal/claude-vscode-releases/${version}/claude-code.vsix`
    // tempVsixPath 路径数据格式化`join`，供共享工具后续处理使用。
    const tempVsixPath = join(
      os.tmpdir(),
      `claude-code-${version}-${Date.now()}.vsix`,
    )

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // vsixResponse 响应数据读取`axios.get`，供共享工具后续处理使用。
      const vsixResponse = await axios.get(vsixUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        responseType: 'stream',
      })

      // Write the downloaded file to disk
      // writeStream读取`getFsImplementation`，供共享工具后续处理使用。
      const writeStream = getFsImplementation().createWriteStream(tempVsixPath)
      // 这个回调绑定到 await new Promise<void>((resolve, reject) => {，负责共享工具在该局部场景下的响应。
      await new Promise<void>((resolve, reject) => {
        // 调用 vsixResponse.data.pipe，触发共享工具此处需要的副作用。
        vsixResponse.data.pipe(writeStream)
        // 调用 writeStream.on，触发共享工具此处需要的副作用。
        writeStream.on('finish', resolve)
        // 调用 writeStream.on，触发共享工具此处需要的副作用。
        writeStream.on('error', reject)
      })

      // Install the .vsix file
      // Add delay to prevent code command crashes
      // 等待 `sleep(500)` 完成，再继续共享工具 ide的异步流程。
      await sleep(500)

      // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
      const result = await execFileNoThrowWithCwd(
        command,
        ['--force', '--install-extension', tempVsixPath],
        {
          env: getInstallationEnv(),
        },
      )

      // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (result.code !== 0) {
        // 抛出 new Error(`${result.code}: ${result.error} ${result.stderr}`)，阻止共享工具在无效状态下继续运行。
        throw new Error(`${result.code}: ${result.error} ${result.stderr}`)
      }

      // 返回 `version`，作为共享工具这次计算的结果。
      return version
    } finally {
      // Clean up the temporary file
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `fs.unlink(tempVsixPath)` 完成，再继续共享工具 ide的异步流程。
        await fs.unlink(tempVsixPath)
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    // 满足 `axios.isAxiosError(error)` 时，共享工具执行该分支。
    if (axios.isAxiosError(error)) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Failed to fetch extension version from artifactory: ${error.message}`,
      )
    }
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

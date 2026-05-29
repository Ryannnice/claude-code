// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, readFile } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 release as osRelease，将 os 中已经封装好的能力接到本文件流程里。
import { release as osRelease } from 'os'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'

// Platform 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Platform = 'macos' | 'windows' | 'wsl' | 'linux' | 'unknown'

// SUPPORTED_PLATFORMS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const SUPPORTED_PLATFORMS: Platform[] = ['macos', 'wsl']

// getPlatform保存`memoize`，供共享工具后续处理使用。
export const getPlatform = memoize((): Platform => {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 当 `process.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
    if (process.platform === 'darwin') {
      // 返回 `'macos'`，作为共享工具这次计算的结果。
      return 'macos'
    }

    // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
    if (process.platform === 'win32') {
      // 返回 `'windows'`，作为共享工具这次计算的结果。
      return 'windows'
    }

    // 当 `process.platform` 匹配 `'linux'` 时，共享工具执行对应分支。
    if (process.platform === 'linux') {
      // Check if running in WSL (Windows Subsystem for Linux)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // procVersion读取`getFsImplementation`，供共享工具后续处理使用。
        const procVersion = getFsImplementation().readFileSync(
          '/proc/version',
          { encoding: 'utf8' },
        )
        // 共享工具在这里按实际状态进入对应分支。
        if (
          procVersion.toLowerCase().includes('microsoft') ||
          procVersion.toLowerCase().includes('wsl')
        ) {
          // 返回 `'wsl'`，作为共享工具这次计算的结果。
          return 'wsl'
        }
      } catch (error) {
        // Error reading /proc/version, assume regular Linux
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logError(error)
      }

      // Regular Linux
      // 返回 `'linux'`，作为共享工具这次计算的结果。
      return 'linux'
    }

    // Unknown platform
    // 返回 `'unknown'`，作为共享工具这次计算的结果。
    return 'unknown'
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `'unknown'`，作为共享工具这次计算的结果。
    return 'unknown'
  }
})

// getWslVersion保存`memoize`，供共享工具后续处理使用。
export const getWslVersion = memoize((): string | undefined => {
  // Only check for WSL on Linux systems
  // `process.platform` 与 `'linux'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'linux') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // procVersion读取`getFsImplementation`，供共享工具后续处理使用。
    const procVersion = getFsImplementation().readFileSync('/proc/version', {
      encoding: 'utf8',
    })

    // First check for explicit WSL version markers (e.g., "WSL2", "WSL3", etc.)
    // wslVersionMatch匹配`procVersion.match`，供共享工具后续处理使用。
    const wslVersionMatch = procVersion.match(/WSL(\d+)/i)
    // 只有 `wslVersionMatch && wslVersionMatch[1]` 满足时，共享工具才执行该分支。
    if (wslVersionMatch && wslVersionMatch[1]) {
      // 返回 `wslVersionMatch[1]`，作为共享工具这次计算的结果。
      return wslVersionMatch[1]
    }

    // If no explicit WSL version but contains Microsoft, assume WSL1
    // This handles the original WSL1 format: "4.4.0-19041-Microsoft"
    // 满足 `procVersion.toLowerCase().includes('microsoft')` 时，共享工具执行该分支。
    if (procVersion.toLowerCase().includes('microsoft')) {
      // 返回 `'1'`，作为共享工具这次计算的结果。
      return '1'
    }

    // Not WSL or unable to determine version
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
})

// LinuxDistroInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type LinuxDistroInfo = {
  linuxDistroId?: string
  linuxDistroVersion?: string
  linuxKernel?: string
}

// getLinuxDistroInfo保存`memoize`，供共享工具后续处理使用。
export const getLinuxDistroInfo = memoize(
  async (): Promise<LinuxDistroInfo | undefined> => {
    // `process.platform` 与 `'linux'` 不一致时刷新派生状态，避免使用过期结果。
    if (process.platform !== 'linux') {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }

    // 结果 集中保存共享工具 platform要一起传递的字段。
    const result: LinuxDistroInfo = {
      linuxKernel: osRelease(),
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 文本内容读取`readFile`，供共享工具后续处理使用。
      const content = await readFile('/etc/os-release', 'utf8')
      // 逐项读取 `content.split('\n')` 中的line，按输入顺序推进共享工具。
      for (const line of content.split('\n')) {
        // match匹配`line.match`，供共享工具后续处理使用。
        const match = line.match(/^(ID|VERSION_ID)=(.*)$/)
        // 只有 `match && match[1] && match[2]` 满足时，共享工具才执行该分支。
        if (match && match[1] && match[2]) {
          // 取值格式化`replace`，供共享工具后续处理使用。
          const value = match[2].replace(/^"|"$/g, '')
          // 当 `match[1]` 匹配 `'ID'` 时，共享工具执行对应分支。
          if (match[1] === 'ID') {
            // linuxDistroId更新为 `value`，确保共享工具后续读取最新状态。
            result.linuxDistroId = value
          } else {
            // linuxDistroVersion更新为 `value`，确保共享工具后续读取最新状态。
            result.linuxDistroVersion = value
          }
        }
      }
    } catch {
      // /etc/os-release may not exist on all Linux systems
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  },
)

// VCS_MARKERS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const VCS_MARKERS: Array<[string, string]> = [
  ['.git', 'git'],
  ['.hg', 'mercurial'],
  ['.svn', 'svn'],
  ['.p4config', 'perforce'],
  ['$tf', 'tfs'],
  ['.tfvc', 'tfs'],
  ['.jj', 'jujutsu'],
  ['.sl', 'sapling'],
]

// detectVcs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectVcs(dir?: string): Promise<string[]> {
  // detected 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const detected = new Set<string>()

  // Check for Perforce via env var
  // 满足 `process.env.P4PORT` 时，共享工具执行该分支。
  if (process.env.P4PORT) {
    // 调用 detected.add，触发共享工具此处需要的副作用。
    detected.add('perforce')
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // targetDir读取`getFsImplementation`，供共享工具后续处理使用。
    const targetDir = dir ?? getFsImplementation().cwd()
    // entries 集合保存`Set`，供共享工具后续处理使用。
    const entries = new Set(await readdir(targetDir))
    // 循环处理 `const [marker, vcs] of VCS_MARKERS`，让共享工具逐项把同类条目按顺序走完。
    for (const [marker, vcs] of VCS_MARKERS) {
      // 满足 `entries.has(marker)` 时，共享工具执行该分支。
      if (entries.has(marker)) {
        // 调用 detected.add，触发共享工具此处需要的副作用。
        detected.add(vcs)
      }
    }
  } catch {
    // Directory may not be readable
  }

  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [...detected]
}

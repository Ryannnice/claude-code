// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getPlatform、Platform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform, type Platform } from './platform.js'

// SystemDirectories 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SystemDirectories = {
  HOME: string
  DESKTOP: string
  DOCUMENTS: string
  DOWNLOADS: string
  [key: string]: string // Index signature for compatibility with Record<string, string>
}

// EnvLike 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type EnvLike = Record<string, string | undefined>

// SystemDirectoriesOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SystemDirectoriesOptions = {
  env?: EnvLike
  homedir?: string
  platform?: Platform
}

/**
 * Get cross-platform system directories
 * Handles differences between Windows, macOS, Linux, and WSL
 * @param options Optional overrides for testing (env, homedir, platform)
 */
// getSystemDirectories 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSystemDirectories(
  options?: SystemDirectoriesOptions,
): SystemDirectories {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = options?.platform ?? getPlatform()
  // homeDir保存`homedir`，供共享工具后续处理使用。
  const homeDir = options?.homedir ?? homedir()
  // env保存`options?.env ?? process.env`，供后续判断或组装使用。
  const env = options?.env ?? process.env

  // Default paths used by most platforms
  // defaults 集合 集中保存共享工具 system Directories要一起传递的字段。
  const defaults: SystemDirectories = {
    HOME: homeDir,
    DESKTOP: join(homeDir, 'Desktop'),
    DOCUMENTS: join(homeDir, 'Documents'),
    DOWNLOADS: join(homeDir, 'Downloads'),
  }

  // 按照 platform 的取值选择共享工具的具体处理分支。
  switch (platform) {
    case 'windows': {
      // Windows: Use USERPROFILE if available (handles localized folder names)
      // userProfile 文件数据标记共享工具 system Directories是否启用对应路径。
      const userProfile = env.USERPROFILE || homeDir
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        HOME: homeDir,
        DESKTOP: join(userProfile, 'Desktop'),
        DOCUMENTS: join(userProfile, 'Documents'),
        DOWNLOADS: join(userProfile, 'Downloads'),
      }
    }

    case 'linux':
    case 'wsl': {
      // Linux/WSL: Check XDG Base Directory specification first
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        HOME: homeDir,
        DESKTOP: env.XDG_DESKTOP_DIR || defaults.DESKTOP,
        DOCUMENTS: env.XDG_DOCUMENTS_DIR || defaults.DOCUMENTS,
        DOWNLOADS: env.XDG_DOWNLOAD_DIR || defaults.DOWNLOADS,
      }
    }

    case 'macos':
    default: {
      // macOS and unknown platforms use standard paths
      // 当 `platform` 匹配 `'unknown'` 时，共享工具执行对应分支。
      if (platform === 'unknown') {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Unknown platform detected, using default paths`)
      }
      // 返回 `defaults`，作为共享工具这次计算的结果。
      return defaults
    }
  }
}

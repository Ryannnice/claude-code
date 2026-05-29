/**
 * Path conversion utilities for IDE communication
 * Handles conversions between Claude's environment and the IDE's environment
 */

// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { execFileSync } from 'child_process'

// IDEPathConverter 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface IDEPathConverter {
  /**
   * Convert path from IDE format to Claude's local format
   * Used when reading workspace folders from IDE lockfile
   */
  // toLocalPath 使用 idePath: string 完成共享工具里的对应操作。
  toLocalPath(idePath: string): string

  /**
   * Convert path from Claude's local format to IDE format
   * Used when sending paths to IDE (showDiffInIDE, etc.)
   */
  // toIDEPath 使用 localPath: string 完成共享工具里的对应操作。
  toIDEPath(localPath: string): string
}

/**
 * Converter for Windows IDE + WSL Claude scenario
 */
// WindowsToWSLConverter 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class WindowsToWSLConverter implements IDEPathConverter {
  // 构造函数接收 private wslDistroName: string | undefined，把外部输入整理成实例可复用的内部状态。
  constructor(private wslDistroName: string | undefined) {}

  // toLocalPath 使用 windowsPath: string 完成共享工具里的对应操作。
  toLocalPath(windowsPath: string): string {
    // windowsPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!windowsPath) return windowsPath

    // Check if this is a path from a different WSL distro
    // 满足 `this.wslDistroName` 时，共享工具执行该分支。
    if (this.wslDistroName) {
      // wslUncMatch匹配`windowsPath.match`，供共享工具后续处理使用。
      const wslUncMatch = windowsPath.match(
        /^\\\\wsl(?:\.localhost|\$)\\([^\\]+)(.*)$/,
      )
      // `wslUncMatch && wslUncMatch[1]` 与 `this.wslDistroN` 不一致时刷新派生状态，避免使用过期结果。
      if (wslUncMatch && wslUncMatch[1] !== this.wslDistroName) {
        // Different distro - wslpath will fail, so return original path
        // 返回 `windowsPath`，作为共享工具这次计算的结果。
        return windowsPath
      }
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Use wslpath to convert Windows paths to WSL paths
      // 结果保存`execFileSync`，供共享工具后续处理使用。
      const result = execFileSync('wslpath', ['-u', windowsPath], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'], // wslpath writes "wslpath: <errortext>" to stderr
      }).trim()

      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    } catch {
      // If wslpath fails, fall back to manual conversion
      // 返回 `windowsPath`，作为共享工具这次计算的结果。
      return windowsPath
        .replace(/\\/g, '/') // Convert backslashes to forward slashes
        // 链式调用 replace，继续加工上一行在共享工具中产生的数据。
        .replace(/^([A-Z]):/i, (_, letter) => `/mnt/${letter.toLowerCase()}`)
    }
  }

  // toIDEPath 使用 wslPath: string 完成共享工具里的对应操作。
  toIDEPath(wslPath: string): string {
    // wslPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!wslPath) return wslPath

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Use wslpath to convert WSL paths to Windows paths
      // 结果保存`execFileSync`，供共享工具后续处理使用。
      const result = execFileSync('wslpath', ['-w', wslPath], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'], // wslpath writes "wslpath: <errortext>" to stderr
      }).trim()

      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    } catch {
      // If wslpath fails, return the original path
      // 返回 `wslPath`，作为共享工具这次计算的结果。
      return wslPath
    }
  }
}

/**
 * Check if distro names match for WSL UNC paths
 */
// checkWSLDistroMatch 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkWSLDistroMatch(
  windowsPath: string,
  wslDistroName: string,
): boolean {
  // wslUncMatch匹配`windowsPath.match`，供共享工具后续处理使用。
  const wslUncMatch = windowsPath.match(
    /^\\\\wsl(?:\.localhost|\$)\\([^\\]+)(.*)$/,
  )
  // 满足 `wslUncMatch` 时，共享工具执行该分支。
  if (wslUncMatch) {
    // 返回 `wslUncMatch[1] === wslDistroName`，作为共享工具这次计算的结果。
    return wslUncMatch[1] === wslDistroName
  }
  // 返回 `true // Not a WSL UNC path, so no distro mismatch`，作为共享工具这次计算的结果。
  return true // Not a WSL UNC path, so no distro mismatch
}

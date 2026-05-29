// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getGlobalConfig、saveGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from './config.js'
// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// markTerminalSetupInProgress 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markTerminalSetupInProgress(backupPath: string): void {
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    appleTerminalSetupInProgress: true,
    appleTerminalBackupPath: backupPath,
  }))
}

// markTerminalSetupComplete 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markTerminalSetupComplete(): void {
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    appleTerminalSetupInProgress: false,
  }))
}

// getTerminalRecoveryInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTerminalRecoveryInfo(): {
  inProgress: boolean
  backupPath: string | null
} {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    inProgress: config.appleTerminalSetupInProgress ?? false,
    backupPath: config.appleTerminalBackupPath || null,
  }
}

// getTerminalPlistPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTerminalPlistPath(): string {
  // 返回 `join(homedir(), 'Library', 'Preferences', 'com.apple.Terminal.plist')`，作为共享工具这次计算的结果。
  return join(homedir(), 'Library', 'Preferences', 'com.apple.Terminal.plist')
}

// backupTerminalPreferences 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function backupTerminalPreferences(): Promise<string | null> {
  // terminalPlistPath 路径数据读取`getTerminalPlistPath`，供共享工具后续处理使用。
  const terminalPlistPath = getTerminalPlistPath()
  // backupPath 路径数据保存``${terminalPlistPath}.bak``，作为后续固定文本处理的输入。
  const backupPath = `${terminalPlistPath}.bak`

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await execFileNoThrow('defaults', [` 解构 code，减少共享工具 apple Terminal Backup对同一对象的重复访问。
    const { code } = await execFileNoThrow('defaults', [
      'export',
      'com.apple.Terminal',
      terminalPlistPath,
    ])

    // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 0) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `stat(terminalPlistPath)` 完成，再继续共享工具 apple Terminal Backup的异步流程。
      await stat(terminalPlistPath)
    } catch {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 等待 `execFileNoThrow('defaults', [` 完成，再继续共享工具 apple Terminal Backup的异步流程。
    await execFileNoThrow('defaults', [
      'export',
      'com.apple.Terminal',
      backupPath,
    ])

    // 调用 markTerminalSetupInProgress，触发共享工具此处需要的副作用。
    markTerminalSetupInProgress(backupPath)

    // 返回 `backupPath`，作为共享工具这次计算的结果。
    return backupPath
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// RestoreResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type RestoreResult =
  | {
      status: 'restored' | 'no_backup'
    }
  | {
      status: 'failed'
      backupPath: string
    }

// checkAndRestoreTerminalBackup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkAndRestoreTerminalBackup(): Promise<RestoreResult> {
  // 从 `getTerminalRecoveryInfo()` 解构 inProgress、backupPath，减少共享工具 apple Terminal Backup对同一对象的重复访问。
  const { inProgress, backupPath } = getTerminalRecoveryInfo()
  // inProgress 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!inProgress) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'no_backup' }
  }

  // backupPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!backupPath) {
    // 调用 markTerminalSetupComplete，触发共享工具此处需要的副作用。
    markTerminalSetupComplete()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'no_backup' }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `stat(backupPath)` 完成，再继续共享工具 apple Terminal Backup的异步流程。
    await stat(backupPath)
  } catch {
    // 调用 markTerminalSetupComplete，触发共享工具此处需要的副作用。
    markTerminalSetupComplete()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'no_backup' }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await execFileNoThrow('defaults', [` 解构 code，减少共享工具 apple Terminal Backup对同一对象的重复访问。
    const { code } = await execFileNoThrow('defaults', [
      'import',
      'com.apple.Terminal',
      backupPath,
    ])

    // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { status: 'failed', backupPath }
    }

    // 等待 `execFileNoThrow('killall', ['cfprefsd'])` 完成，再继续共享工具 apple Terminal Backup的异步流程。
    await execFileNoThrow('killall', ['cfprefsd'])

    // 调用 markTerminalSetupComplete，触发共享工具此处需要的副作用。
    markTerminalSetupComplete()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'restored' }
  } catch (restoreError) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `Failed to restore Terminal.app settings with: ${restoreError}`,
      ),
    )
    // 调用 markTerminalSetupComplete，触发共享工具此处需要的副作用。
    markTerminalSetupComplete()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'failed', backupPath }
  }
}

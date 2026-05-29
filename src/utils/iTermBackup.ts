// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { copyFile, stat } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getGlobalConfig、saveGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, saveGlobalConfig } from './config.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'

// markITerm2SetupComplete 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markITerm2SetupComplete(): void {
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    iterm2SetupInProgress: false,
  }))
}

// getIterm2RecoveryInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getIterm2RecoveryInfo(): {
  inProgress: boolean
  backupPath: string | null
} {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    inProgress: config.iterm2SetupInProgress ?? false,
    backupPath: config.iterm2BackupPath || null,
  }
}

// getITerm2PlistPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getITerm2PlistPath(): string {
  // 返回 `join(`，作为共享工具这次计算的结果。
  return join(
    homedir(),
    'Library',
    'Preferences',
    'com.googlecode.iterm2.plist',
  )
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

// checkAndRestoreITerm2Backup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkAndRestoreITerm2Backup(): Promise<RestoreResult> {
  // 从 `getIterm2RecoveryInfo()` 解构 inProgress、backupPath，减少共享工具 i Term Backup对同一对象的重复访问。
  const { inProgress, backupPath } = getIterm2RecoveryInfo()
  // inProgress 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!inProgress) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'no_backup' }
  }

  // backupPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!backupPath) {
    // 调用 markITerm2SetupComplete，触发共享工具此处需要的副作用。
    markITerm2SetupComplete()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'no_backup' }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `stat(backupPath)` 完成，再继续共享工具 i Term Backup的异步流程。
    await stat(backupPath)
  } catch {
    // 调用 markITerm2SetupComplete，触发共享工具此处需要的副作用。
    markITerm2SetupComplete()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'no_backup' }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `copyFile(backupPath, getITerm2PlistPath())` 完成，再继续共享工具 i Term Backup的异步流程。
    await copyFile(backupPath, getITerm2PlistPath())

    // 调用 markITerm2SetupComplete，触发共享工具此处需要的副作用。
    markITerm2SetupComplete()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'restored' }
  } catch (restoreError) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(`Failed to restore iTerm2 settings with: ${restoreError}`),
    )
    // 调用 markITerm2SetupComplete，触发共享工具此处需要的副作用。
    markITerm2SetupComplete()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { status: 'failed', backupPath }
  }
}

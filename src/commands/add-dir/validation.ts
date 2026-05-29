// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, resolve } from 'path'
// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// 复用 getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { getErrnoCode } from '../../utils/errors.js'
// 复用 expandPath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { expandPath } from '../../utils/path.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  allWorkingDirectories,
  pathInWorkingPath,
} from '../../utils/permissions/filesystem.js'

// AddDirectoryResult 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
export type AddDirectoryResult =
  | {
      resultType: 'success'
      absolutePath: string
    }
  | {
      resultType: 'emptyPath'
    }
  | {
      resultType: 'pathNotFound' | 'notADirectory'
      directoryPath: string
      absolutePath: string
    }
  | {
      resultType: 'alreadyInWorkingDirectory'
      directoryPath: string
      workingDir: string
    }

// validateDirectoryForWorkspace 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateDirectoryForWorkspace(
  directoryPath: string,
  permissionContext: ToolPermissionContext,
): Promise<AddDirectoryResult> {
  // directoryPath 路径数据缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!directoryPath) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      resultType: 'emptyPath',
    }
  }

  // resolve() strips the trailing slash expandPath can leave on absolute
  // inputs, so /foo and /foo/ map to the same storage key (CC-33).
  // absolutePath 路径数据读取`resolve`，供命令处理后续处理使用。
  const absolutePath = resolve(expandPath(directoryPath))

  // Check if path exists and is a directory (single syscall)
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`stat`，供命令处理后续处理使用。
    const stats = await stat(absolutePath)
    // 满足 `!stats.isDirectory()` 时，命令处理执行该分支。
    if (!stats.isDirectory()) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        resultType: 'notADirectory',
        directoryPath,
        absolutePath,
      }
    }
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供命令处理后续处理使用。
    const code = getErrnoCode(e)
    // Match prior existsSync() semantics: treat any of these as "not found"
    // rather than re-throwing. EACCES/EPERM in particular must not crash
    // startup when a settings-configured additional directory is inaccessible.
    // 命令处理在这里按实际状态进入对应分支。
    if (
      code === 'ENOENT' ||
      code === 'ENOTDIR' ||
      code === 'EACCES' ||
      code === 'EPERM'
    ) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        resultType: 'pathNotFound',
        directoryPath,
        absolutePath,
      }
    }
    // 抛出 e，阻止命令处理在无效状态下继续运行。
    throw e
  }

  // Get current permission context
  // currentWorkingDirs 集合保存`allWorkingDirectories`，供命令处理后续处理使用。
  const currentWorkingDirs = allWorkingDirectories(permissionContext)

  // Check if already within an existing working directory
  // 按顺序遍历 `currentWorkingDirs` 中的workingDir，逐个交给命令处理处理。
  for (const workingDir of currentWorkingDirs) {
    // 满足 `pathInWorkingPath(absolutePath, workingDir)` 时，命令处理执行该分支。
    if (pathInWorkingPath(absolutePath, workingDir)) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        resultType: 'alreadyInWorkingDirectory',
        directoryPath,
        workingDir,
      }
    }
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    resultType: 'success',
    absolutePath,
  }
}

// addDirHelpMessage 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addDirHelpMessage(result: AddDirectoryResult): string {
  // 按照 result.resultType 的取值选择命令处理的具体处理分支。
  switch (result.resultType) {
    case 'emptyPath':
      // 返回 `'Please provide a directory path.'`，作为命令处理这次计算的结果。
      return 'Please provide a directory path.'
    case 'pathNotFound':
      // 返回 ``Path ${chalk.bold(result.absolutePath)} was not found.``，作为命令处理这次计算的结果。
      return `Path ${chalk.bold(result.absolutePath)} was not found.`
    case 'notADirectory': {
      // parentDir保存`dirname`，供命令处理后续处理使用。
      const parentDir = dirname(result.absolutePath)
      // 返回 ``${chalk.bold(result.directoryPath)} is not a directory. Did you mean t...`，作为命令处理这次计算的结果。
      return `${chalk.bold(result.directoryPath)} is not a directory. Did you mean to add the parent directory ${chalk.bold(parentDir)}?`
    }
    case 'alreadyInWorkingDirectory':
      // 返回 ``${chalk.bold(result.directoryPath)} is already accessible within the e...`，作为命令处理这次计算的结果。
      return `${chalk.bold(result.directoryPath)} is already accessible within the existing working directory ${chalk.bold(result.workingDir)}.`
    case 'success':
      // 返回 ``Added ${chalk.bold(result.absolutePath)} as a working directory.``，作为命令处理这次计算的结果。
      return `Added ${chalk.bold(result.absolutePath)} as a working directory.`
  }
}

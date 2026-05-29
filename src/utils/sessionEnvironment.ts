// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readdir, readFile, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getClaudeConfigHomeDir，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from './envUtils.js'
// 引入 errorMessage、getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode } from './errors.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'

// Cache states:
// undefined = not yet loaded (need to check disk)
// null = checked disk, no files exist (don't check again)
// string = loaded and cached (use cached value)
// sessionEnvScript 会话数据 命名 `undefined`，让后续代码直接表达这个值的用途。
let sessionEnvScript: string | null | undefined = undefined

// getSessionEnvDirPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionEnvDirPath(): Promise<string> {
  // sessionEnvDir 会话数据格式化`join`，供共享工具后续处理使用。
  const sessionEnvDir = join(
    getClaudeConfigHomeDir(),
    'session-env',
    getSessionId(),
  )
  // 等待 `mkdir(sessionEnvDir, { recursive: true })` 完成，再继续共享工具 session Environment的异步流程。
  await mkdir(sessionEnvDir, { recursive: true })
  // 返回 `sessionEnvDir`，作为共享工具这次计算的结果。
  return sessionEnvDir
}

// getHookEnvFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getHookEnvFilePath(
  hookEvent: 'Setup' | 'SessionStart' | 'CwdChanged' | 'FileChanged',
  hookIndex: number,
): Promise<string> {
  // prefix保存`hookEvent.toLowerCase`，供共享工具后续处理使用。
  const prefix = hookEvent.toLowerCase()
  // 返回 `join(await getSessionEnvDirPath(), `${prefix}-hook-${hookIndex}.sh`)`，作为共享工具这次计算的结果。
  return join(await getSessionEnvDirPath(), `${prefix}-hook-${hookIndex}.sh`)
}

// clearCwdEnvFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearCwdEnvFiles(): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dir读取`getSessionEnvDirPath`，供共享工具后续处理使用。
    const dir = await getSessionEnvDirPath()
    // files 文件数据读取`readdir`，供共享工具后续处理使用。
    const files = await readdir(dir)
    // 等待 `Promise.all(` 完成，再继续共享工具 session Environment的异步流程。
    await Promise.all(
      files
        .filter(
          // f更新为 `>`，确保共享工具后续读取最新状态。
          f =>
            (f.startsWith('filechanged-hook-') ||
              f.startsWith('cwdchanged-hook-')) &&
            HOOK_ENV_REGEX.test(f),
        )
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(f => writeFile(join(dir, f), '')),
    )
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to clear cwd env files: ${errorMessage(e)}`)
    }
  }
}

// invalidateSessionEnvCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function invalidateSessionEnvCache(): void {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Invalidating session environment cache')
  // sessionEnvScript 会话数据更新为 `undefined`，确保共享工具后续读取最新状态。
  sessionEnvScript = undefined
}

// getSessionEnvironmentScript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionEnvironmentScript(): Promise<string | null> {
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Session environment not yet supported on Windows')
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // `sessionEnvScript` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (sessionEnvScript !== undefined) {
    // 返回 `sessionEnvScript`，作为共享工具这次计算的结果。
    return sessionEnvScript
  }

  // scripts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const scripts: string[] = []

  // Check for CLAUDE_ENV_FILE passed from parent process (e.g., HFI trajectory runner)
  // This allows venv/conda activation to persist across shell commands
  // envFile 文件数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envFile = process.env.CLAUDE_ENV_FILE
  // 满足 `envFile` 时，共享工具执行该分支。
  if (envFile) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // envScript读取`readFile`，供共享工具后续处理使用。
      const envScript = (await readFile(envFile, 'utf8')).trim()
      // 满足 `envScript` 时，共享工具执行该分支。
      if (envScript) {
        // scripts 集合追加新条目，保持收集顺序与输入顺序一致。
        scripts.push(envScript)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Session environment loaded from CLAUDE_ENV_FILE: ${envFile} (${envScript.length} chars)`,
        )
      }
    } catch (e: unknown) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(e)
      // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
      if (code !== 'ENOENT') {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to read CLAUDE_ENV_FILE: ${errorMessage(e)}`)
      }
    }
  }

  // Load hook environment files from session directory
  // sessionEnvDir 会话数据读取`getSessionEnvDirPath`，供共享工具后续处理使用。
  const sessionEnvDir = await getSessionEnvDirPath()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // files 文件数据读取`readdir`，供共享工具后续处理使用。
    const files = await readdir(sessionEnvDir)
    // We are sorting the hook env files by the order in which they are listed
    // in the settings.json file so that the resulting env is deterministic
    // hookFiles 文件数据保存`files`，供后续判断或组装使用。
    const hookFiles = files
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(f => HOOK_ENV_REGEX.test(f))
      .sort(sortHookEnvFiles)

    // 按顺序遍历 `hookFiles` 中的file 文件数据，逐个交给共享工具处理。
    for (const file of hookFiles) {
      // 文件路径格式化`join`，供共享工具后续处理使用。
      const filePath = join(sessionEnvDir, file)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容读取`readFile`，供共享工具后续处理使用。
        const content = (await readFile(filePath, 'utf8')).trim()
        // 满足 `content` 时，共享工具执行该分支。
        if (content) {
          // scripts 集合追加新条目，保持收集顺序与输入顺序一致。
          scripts.push(content)
        }
      } catch (e: unknown) {
        // code读取`getErrnoCode`，供共享工具后续处理使用。
        const code = getErrnoCode(e)
        // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
        if (code !== 'ENOENT') {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Failed to read hook file ${filePath}: ${errorMessage(e)}`,
          )
        }
      }
    }

    // 满足 `hookFiles.length > 0` 时，共享工具执行该分支。
    if (hookFiles.length > 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Session environment loaded from ${hookFiles.length} hook file(s)`,
      )
    }
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to load session environment from hooks: ${errorMessage(e)}`,
      )
    }
  }

  // scripts 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (scripts.length === 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('No session environment scripts found')
    // sessionEnvScript 会话数据更新为 `null`，确保共享工具后续读取最新状态。
    sessionEnvScript = null
    // 返回 `sessionEnvScript`，作为共享工具这次计算的结果。
    return sessionEnvScript
  }

  // sessionEnvScript 会话数据更新为 `scripts.join('\n')`，确保共享工具后续读取最新状态。
  sessionEnvScript = scripts.join('\n')
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Session environment script ready (${sessionEnvScript.length} chars total)`,
  )
  // 返回 `sessionEnvScript`，作为共享工具这次计算的结果。
  return sessionEnvScript
}

// HOOK_ENV_PRIORITY 集中保存共享工具 session Environment要一起传递的字段。
const HOOK_ENV_PRIORITY: Record<string, number> = {
  setup: 0,
  sessionstart: 1,
  cwdchanged: 2,
  filechanged: 3,
}
// HOOK_ENV_REGEX 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const HOOK_ENV_REGEX =
  /^(setup|sessionstart|cwdchanged|filechanged)-hook-(\d+)\.sh$/

// sortHookEnvFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sortHookEnvFiles(a: string, b: string): number {
  // aMatch匹配`a.match`，供共享工具后续处理使用。
  const aMatch = a.match(HOOK_ENV_REGEX)
  // bMatch匹配`b.match`，供共享工具后续处理使用。
  const bMatch = b.match(HOOK_ENV_REGEX)
  // aType标记共享工具 session Environment是否启用对应路径。
  const aType = aMatch?.[1] || ''
  // bType标记共享工具 session Environment是否启用对应路径。
  const bType = bMatch?.[1] || ''
  // `aType` 与 `bType` 不一致时刷新派生状态，避免使用过期结果。
  if (aType !== bType) {
    // 返回 `(HOOK_ENV_PRIORITY[aType] ?? 99) - (HOOK_ENV_PRIORITY[bType] ?? 99)`，作为共享工具这次计算的结果。
    return (HOOK_ENV_PRIORITY[aType] ?? 99) - (HOOK_ENV_PRIORITY[bType] ?? 99)
  }
  // aIndex 索引解析`parseInt`，供共享工具后续处理使用。
  const aIndex = parseInt(aMatch?.[2] || '0', 10)
  // bIndex 索引解析`parseInt`，供共享工具后续处理使用。
  const bIndex = parseInt(bMatch?.[2] || '0', 10)
  // 返回 `aIndex - bIndex`，作为共享工具这次计算的结果。
  return aIndex - bIndex
}

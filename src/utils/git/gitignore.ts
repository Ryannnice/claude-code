// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { appendFile, mkdir, readFile, writeFile } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from '../errors.js'
// 引入 execFileNoThrowWithCwd，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from '../execFileNoThrow.js'
// 引入 dirIsInGitRepo，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { dirIsInGitRepo } from '../git.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'

/**
 * Checks if a path is ignored by git (via `git check-ignore`).
 *
 * This consults all applicable gitignore sources: repo `.gitignore` files
 * (nested), `.git/info/exclude`, and the global gitignore — with correct
 * precedence, because git itself resolves it.
 *
 * Exit codes: 0 = ignored, 1 = not ignored, 128 = not in a git repo.
 * Returns `false` for 128, so callers outside a git repo fail open.
 *
 * @param filePath The path to check (absolute or relative to cwd)
 * @param cwd The working directory to run git from
 */
// isPathGitignored 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isPathGitignored(
  filePath: string,
  cwd: string,
): Promise<boolean> {
  // 从 `await execFileNoThrowWithCwd(` 解构 code，减少共享工具 gitignore对同一对象的重复访问。
  const { code } = await execFileNoThrowWithCwd(
    'git',
    ['check-ignore', filePath],
    {
      preserveOutputOnError: false,
      cwd,
    },
  )

  // 返回 `code === 0`，作为共享工具这次计算的结果。
  return code === 0
}

/**
 * Gets the path to the global gitignore file (.config/git/ignore)
 * @returns The path to the global gitignore file
 */
// getGlobalGitignorePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGlobalGitignorePath(): string {
  // 返回 `join(homedir(), '.config', 'git', 'ignore')`，作为共享工具这次计算的结果。
  return join(homedir(), '.config', 'git', 'ignore')
}

/**
 * Adds a file pattern to the global gitignore file (.config/git/ignore)
 * if it's not already ignored by existing patterns in any gitignore file
 * @param filename The filename to add to gitignore
 * @param cwd The current working directory (optional)
 */
// addFileGlobRuleToGitignore 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function addFileGlobRuleToGitignore(
  filename: string,
  cwd: string = getCwd(),
): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `!(await dirIsInGitRepo(cwd))` 时，共享工具执行该分支。
    if (!(await dirIsInGitRepo(cwd))) {
      // 共享工具 gitignore在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // First check if the pattern is already ignored by any gitignore file (including global)
    // gitignoreEntry固定为 ``**/${filename}``，作为共享工具 gitignore后续展示或比较的基准。
    const gitignoreEntry = `**/${filename}`
    // For directory patterns (ending with /), check with a sample file inside
    // testPath 路径数据保存`filename.endsWith`，供共享工具后续处理使用。
    const testPath = filename.endsWith('/')
      ? `${filename}sample-file.txt`
      : filename
    // 满足 `await isPathGitignored(testPath, cwd)` 时，共享工具执行该分支。
    if (await isPathGitignored(testPath, cwd)) {
      // File is already ignored by existing patterns (local or global)
      // 共享工具 gitignore在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Use the global gitignore file in .config/git/ignore
    // globalGitignorePath 路径数据读取`getGlobalGitignorePath`，供共享工具后续处理使用。
    const globalGitignorePath = getGlobalGitignorePath()

    // Create the directory if it doesn't exist
    // configGitDir 配置保存`dirname`，供共享工具后续处理使用。
    const configGitDir = dirname(globalGitignorePath)
    // 等待 `mkdir(configGitDir, { recursive: true })` 完成，再继续共享工具 gitignore的异步流程。
    await mkdir(configGitDir, { recursive: true })

    // Add the entry to the global gitignore
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 文本内容读取`readFile`，供共享工具后续处理使用。
      const content = await readFile(globalGitignorePath, { encoding: 'utf-8' })
      // 满足 `content.includes(gitignoreEntry)` 时，共享工具执行该分支。
      if (content.includes(gitignoreEntry)) {
        // 返回 `// Pattern already exists, don't add again`，作为共享工具这次计算的结果。
        return // Pattern already exists, don't add again
      }
      // 等待 `appendFile(globalGitignorePath, `\n${gitignoreEntry}\n`)` 完成，再继续共享工具 gitignore的异步流程。
      await appendFile(globalGitignorePath, `\n${gitignoreEntry}\n`)
    } catch (e: unknown) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(e)
      // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
      if (code === 'ENOENT') {
        // Create global gitignore with entry
        // 等待 `writeFile(globalGitignorePath, `${gitignoreEntry}\n`, 'utf-8')` 完成，再继续共享工具 gitignore的异步流程。
        await writeFile(globalGitignorePath, `${gitignoreEntry}\n`, 'utf-8')
      } else {
        // 抛出 e，阻止共享工具在无效状态下继续运行。
        throw e
      }
    }
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

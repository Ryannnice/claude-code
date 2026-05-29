// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 sample，将 lodash-es/sample.js 中已经封装好的能力接到本文件流程里。
import sample from 'lodash-es/sample.js'
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js'
// 引入 getCurrentProjectConfig、saveCurrentProjectConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getCurrentProjectConfig, saveCurrentProjectConfig } from './config.js'
// 引入 env，将 ./env.js 中已经封装好的能力接到本文件流程里。
import { env } from './env.js'
// 引入 execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 getIsGit、gitExe，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { getIsGit, gitExe } from './git.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getGitEmail，将 ./user.js 中已经封装好的能力接到本文件流程里。
import { getGitEmail } from './user.js'

// Patterns that mark a file as non-core (auto-generated, dependency, or config).
// Used to filter example-command filename suggestions deterministically
// instead of shelling out to Haiku.
// NON_CORE_PATTERNS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const NON_CORE_PATTERNS = [
  // lock / dependency manifests
  /(?:^|\/)(?:package-lock\.json|yarn\.lock|bun\.lock|bun\.lockb|pnpm-lock\.yaml|Pipfile\.lock|poetry\.lock|Cargo\.lock|Gemfile\.lock|go\.sum|composer\.lock|uv\.lock)$/,
  // generated / build artifacts
  /\.generated\./,
  /(?:^|\/)(?:dist|build|out|target|node_modules|\.next|__pycache__)\//,
  /\.(?:min\.js|min\.css|map|pyc|pyo)$/,
  // data / docs / config extensions (not "write a test for" material)
  /\.(?:json|ya?ml|toml|xml|ini|cfg|conf|env|lock|txt|md|mdx|rst|csv|log|svg)$/i,
  // configuration / metadata
  /(?:^|\/)\.?(?:eslintrc|prettierrc|babelrc|editorconfig|gitignore|gitattributes|dockerignore|npmrc)/,
  /(?:^|\/)(?:tsconfig|jsconfig|biome|vitest\.config|jest\.config|webpack\.config|vite\.config|rollup\.config)\.[a-z]+$/,
  /(?:^|\/)\.(?:github|vscode|idea|claude)\//,
  // docs / changelogs (not "how does X work" material)
  /(?:^|\/)(?:CHANGELOG|LICENSE|CONTRIBUTING|CODEOWNERS|README)(?:\.[a-z]+)?$/i,
]

// isCoreFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCoreFile(path: string): boolean {
  // 返回 `!NON_CORE_PATTERNS.some(p => p.test(path))`，作为共享工具这次计算的结果。
  return !NON_CORE_PATTERNS.some(p => p.test(path))
}

/**
 * Counts occurrences of items in an array and returns the top N items
 * sorted by count in descending order, formatted as a string.
 */
// countAndSortItems 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function countAndSortItems(items: string[], topN: number = 20): string {
  // counts 数量构建`new Map<string, number>()`，供后续判断或组装使用。
  const counts = new Map<string, number>()
  // 按顺序遍历 `items` 中的item，逐个交给共享工具处理。
  for (const item of items) {
    // counts.set 写入新的状态值，使共享工具后续读取保持一致。
    counts.set(item, (counts.get(item) || 0) + 1)
  }
  // 返回 `Array.from(counts.entries())`，作为共享工具这次计算的结果。
  return Array.from(counts.entries())
    // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(([item, count]) => `${count.toString().padStart(6)} ${item}`)
    .join('\n')
}

/**
 * Picks up to `want` basenames from a frequency-sorted list of paths,
 * skipping non-core files and spreading across different directories.
 * Returns empty array if fewer than `want` core files are available.
 */
// pickDiverseCoreFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function pickDiverseCoreFiles(
  sortedPaths: string[],
  want: number,
): string[] {
  // picked 从空数组开始收集，后续循环会按处理顺序追加条目。
  const picked: string[] = []
  // seenBasenames 集合构建`new Set<string>()`，供后续判断或组装使用。
  const seenBasenames = new Set<string>()
  // dirTally构建`new Map<string, number>()`，供后续判断或组装使用。
  const dirTally = new Map<string, number>()

  // Greedy: on each pass allow +1 file per directory. Keeps the
  // top-5 from collapsing into a single hot folder while still
  // letting a dominant folder contribute multiple files if the
  // repo is narrow.
  // 循环处理 `let cap = 1; picked.length < want && cap <= want`，让共享工具逐项把同类条目按顺序走完。
  for (let cap = 1; picked.length < want && cap <= want; cap++) {
    // 按顺序遍历 `sortedPaths` 中的p，逐个交给共享工具处理。
    for (const p of sortedPaths) {
      // 满足 `picked.length >= want` 时，共享工具执行该分支。
      if (picked.length >= want) break
      // 满足 `!isCoreFile(p)` 时，共享工具执行该分支。
      if (!isCoreFile(p)) continue
      // lastSep保存`Math.max`，供共享工具后续处理使用。
      const lastSep = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))
      // base格式化`p.slice`，供共享工具后续处理使用。
      const base = lastSep >= 0 ? p.slice(lastSep + 1) : p
      // 只有 `!base || seenBasenames.has(base)` 满足时，共享工具才执行该分支。
      if (!base || seenBasenames.has(base)) continue
      // dir格式化`p.slice`，供共享工具后续处理使用。
      const dir = lastSep >= 0 ? p.slice(0, lastSep) : '.'
      // 满足 `(dirTally.get(dir) ?? 0) >= cap` 时，共享工具执行该分支。
      if ((dirTally.get(dir) ?? 0) >= cap) continue
      // picked追加新条目，保持收集顺序与输入顺序一致。
      picked.push(base)
      // 调用 seenBasenames.add，触发共享工具此处需要的副作用。
      seenBasenames.add(base)
      // dirTally.set 写入新的状态值，使共享工具后续读取保持一致。
      dirTally.set(dir, (dirTally.get(dir) ?? 0) + 1)
    }
  }

  // 返回 `picked.length >= want ? picked : []`，作为共享工具这次计算的结果。
  return picked.length >= want ? picked : []
}

// getFrequentlyModifiedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getFrequentlyModifiedFiles(): Promise<string[]> {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') return []
  // 当 `env.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (env.platform === 'win32') return []
  // 满足 `!(await getIsGit())` 时，共享工具执行该分支。
  if (!(await getIsGit())) return []

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Collect frequently-modified files, preferring the user's own commits.
    // userEmail读取`getGitEmail`，供共享工具后续处理使用。
    const userEmail = await getGitEmail()

    // logArgs 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const logArgs = [
      'log',
      '-n',
      '1000',
      '--pretty=format:',
      '--name-only',
      '--diff-filter=M',
    ]

    // counts 数量构建`new Map<string, number>()`，供后续判断或组装使用。
    const counts = new Map<string, number>()
    // tallyInto封装成回调，供共享工具 example Commands在事件触发或异步步骤中调用。
    const tallyInto = (stdout: string) => {
      // 逐项读取 `stdout.split('\n')` 中的line，按输入顺序推进共享工具。
      for (const line of stdout.split('\n')) {
        // f格式化`line.trim`，供共享工具后续处理使用。
        const f = line.trim()
        // 满足 `f) counts.set(f, (counts.get(f) ?? 0) + 1` 时，共享工具执行该分支。
        if (f) counts.set(f, (counts.get(f) ?? 0) + 1)
      }
    }

    // 满足 `userEmail` 时，共享工具执行该分支。
    if (userEmail) {
      // 从 `await execFileNoThrowWithCwd(` 解构 stdout，减少共享工具 example Commands对同一对象的重复访问。
      const { stdout } = await execFileNoThrowWithCwd(
        'git',
        [...logArgs, `--author=${userEmail}`],
        { cwd: getCwd() },
      )
      // 调用 tallyInto，触发共享工具此处需要的副作用。
      tallyInto(stdout)
    }

    // Fall back to all authors if the user's own history is thin.
    // 满足 `counts.size < 10` 时，共享工具执行该分支。
    if (counts.size < 10) {
      // 从 `await execFileNoThrowWithCwd(gitExe(), logArgs, {` 解构 stdout，减少共享工具 example Commands对同一对象的重复访问。
      const { stdout } = await execFileNoThrowWithCwd(gitExe(), logArgs, {
        cwd: getCwd(),
      })
      // 调用 tallyInto，触发共享工具此处需要的副作用。
      tallyInto(stdout)
    }

    // sorted保存`Array.from`，供共享工具后续处理使用。
    const sorted = Array.from(counts.entries())
      // 链式调用 sort，继续加工上一行在共享工具中产生的数据。
      .sort((a, b) => b[1] - a[1])
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(([p]) => p)

    // 返回 `pickDiverseCoreFiles(sorted, 5)`，作为共享工具这次计算的结果。
    return pickDiverseCoreFiles(sorted, 5)
  } catch (err) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err as Error)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}

// ONE_WEEK_IN_MS 集合保存`7 * 24 * 60 * 60 * 1000`，供共享工具 example Commands后续判断或输出使用。
const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

// getExampleCommandFromCache 命令数据保存`memoize`，供共享工具后续处理使用。
export const getExampleCommandFromCache = memoize(() => {
  // projectConfig 配置读取`getCurrentProjectConfig`，供共享工具后续处理使用。
  const projectConfig = getCurrentProjectConfig()
  // frequentFile 文件数据保存 `projectConfig.exampleFiles?.length` 的判断结果，供共享工具 example Commands后续分支直接复用。
  const frequentFile = projectConfig.exampleFiles?.length
    ? sample(projectConfig.exampleFiles)
    : '<filepath>'

  // commands 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
  const commands = [
    'fix lint errors',
    'fix typecheck errors',
    `how does ${frequentFile} work?`,
    `refactor ${frequentFile}`,
    'how do I log an error?',
    `edit ${frequentFile} to...`,
    `write a test for ${frequentFile}`,
    'create a util logging.py that...',
  ]

  // 返回 ``Try "${sample(commands)}"``，作为共享工具这次计算的结果。
  return `Try "${sample(commands)}"`
})

// refreshExampleCommands 命令数据保存`memoize`，供共享工具后续处理使用。
export const refreshExampleCommands = memoize(async (): Promise<void> => {
  // projectConfig 配置读取`getCurrentProjectConfig`，供共享工具后续处理使用。
  const projectConfig = getCurrentProjectConfig()
  // now记录时间`Date.now`，供共享工具后续处理使用。
  const now = Date.now()
  // lastGenerated保存`projectConfig.exampleFilesGeneratedAt ?? 0`，供共享工具 example Commands后续判断或输出使用。
  const lastGenerated = projectConfig.exampleFilesGeneratedAt ?? 0

  // Regenerate examples if they're over a week old
  // 满足 `now - lastGenerated > ONE_WEEK_IN_MS` 时，共享工具执行该分支。
  if (now - lastGenerated > ONE_WEEK_IN_MS) {
    // exampleFiles 文件数据更新为 `[]`，确保共享工具后续读取最新状态。
    projectConfig.exampleFiles = []
  }

  // If no example files cached, kickstart fetch in background
  // 满足 `!projectConfig.exampleFiles?.length` 时，共享工具执行该分支。
  if (!projectConfig.exampleFiles?.length) {
    // 这个回调绑定到 void getFrequentlyModifiedFiles().then(files => {，负责共享工具在该局部场景下的响应。
    void getFrequentlyModifiedFiles().then(files => {
      // 满足 `files.length` 时，共享工具执行该分支。
      if (files.length) {
        // 调用 saveCurrentProjectConfig，触发共享工具此处需要的副作用。
        saveCurrentProjectConfig(current => ({
          ...current,
          exampleFiles: files,
          exampleFilesGeneratedAt: Date.now(),
        }))
      }
    })
  }
})

// 引入 homedir、platform，将 os 中已经封装好的能力接到本文件流程里。
import { homedir, platform } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../utils/fsOperations.js'
// 类型依赖 { IdeType } 来自 ./ide.js，用于校准共享工具的数据契约。
import type { IdeType } from './ide.js'

// PLUGIN_PREFIX 插件数据保存`'claude-code-jetbrains-plugin'`，作为后续固定文本处理的输入。
const PLUGIN_PREFIX = 'claude-code-jetbrains-plugin'

// Map of IDE names to their directory patterns
// ideNameToDirMap 集中保存共享工具 jetbrains要一起传递的字段。
const ideNameToDirMap: { [key: string]: string[] } = {
  pycharm: ['PyCharm'],
  intellij: ['IntelliJIdea', 'IdeaIC'],
  webstorm: ['WebStorm'],
  phpstorm: ['PhpStorm'],
  rubymine: ['RubyMine'],
  clion: ['CLion'],
  goland: ['GoLand'],
  rider: ['Rider'],
  datagrip: ['DataGrip'],
  appcode: ['AppCode'],
  dataspell: ['DataSpell'],
  aqua: ['Aqua'],
  gateway: ['Gateway'],
  fleet: ['Fleet'],
  androidstudio: ['AndroidStudio'],
}

// Build plugin directory paths
// https://www.jetbrains.com/help/pycharm/directories-used-by-the-ide-to-store-settings-caches-plugins-and-logs.html#plugins-directory
// buildCommonPluginDirectoryPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildCommonPluginDirectoryPaths(ideName: string): string[] {
  // homeDir保存`homedir`，供共享工具后续处理使用。
  const homeDir = homedir()
  // directories 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const directories: string[] = []
  // idePatterns 集合保存`ideName.toLowerCase`，供共享工具后续处理使用。
  const idePatterns = ideNameToDirMap[ideName.toLowerCase()]
  // idePatterns 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!idePatterns) {
    // 返回 `directories`，作为共享工具这次计算的结果。
    return directories
  }

  // appData格式化`join`，供共享工具后续处理使用。
  const appData = process.env.APPDATA || join(homeDir, 'AppData', 'Roaming')
  // localAppData 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const localAppData =
    process.env.LOCALAPPDATA || join(homeDir, 'AppData', 'Local')

  // 依据 platform() 的取值选择共享工具的具体处理分支。
  switch (platform()) {
    case 'darwin':
      // directories 集合追加新条目，保持收集顺序与输入顺序一致。
      directories.push(
        join(homeDir, 'Library', 'Application Support', 'JetBrains'),
        join(homeDir, 'Library', 'Application Support'),
      )
      // 当 `ideName.toLowerCase()` 匹配 `'androidstudio'` 时，共享工具执行对应分支。
      if (ideName.toLowerCase() === 'androidstudio') {
        // directories 集合追加新条目，保持收集顺序与输入顺序一致。
        directories.push(
          join(homeDir, 'Library', 'Application Support', 'Google'),
        )
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break

    case 'win32':
      // directories 集合追加新条目，保持收集顺序与输入顺序一致。
      directories.push(
        join(appData, 'JetBrains'),
        join(localAppData, 'JetBrains'),
        join(appData),
      )
      // 当 `ideName.toLowerCase()` 匹配 `'androidstudio'` 时，共享工具执行对应分支。
      if (ideName.toLowerCase() === 'androidstudio') {
        // directories 集合追加新条目，保持收集顺序与输入顺序一致。
        directories.push(join(localAppData, 'Google'))
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break

    case 'linux':
      // directories 集合追加新条目，保持收集顺序与输入顺序一致。
      directories.push(
        join(homeDir, '.config', 'JetBrains'),
        join(homeDir, '.local', 'share', 'JetBrains'),
      )
      // 按顺序遍历 `idePatterns` 中的pattern，逐个交给共享工具处理。
      for (const pattern of idePatterns) {
        // directories 集合追加新条目，保持收集顺序与输入顺序一致。
        directories.push(join(homeDir, '.' + pattern))
      }
      // 当 `ideName.toLowerCase()` 匹配 `'androidstudio'` 时，共享工具执行对应分支。
      if (ideName.toLowerCase() === 'androidstudio') {
        // directories 集合追加新条目，保持收集顺序与输入顺序一致。
        directories.push(join(homeDir, '.config', 'Google'))
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    default:
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
  }

  // 返回 `directories`，作为共享工具这次计算的结果。
  return directories
}

// Find all actual plugin directories that exist
// detectPluginDirectories 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectPluginDirectories(ideName: string): Promise<string[]> {
  // foundDirectories 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const foundDirectories: string[] = []
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()

  // pluginDirPaths 插件数据构建`buildCommonPluginDirectoryPaths`，供共享工具后续处理使用。
  const pluginDirPaths = buildCommonPluginDirectoryPaths(ideName)
  // idePatterns 集合保存`ideName.toLowerCase`，供共享工具后续处理使用。
  const idePatterns = ideNameToDirMap[ideName.toLowerCase()]
  // idePatterns 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!idePatterns) {
    // 返回 `foundDirectories`，作为共享工具这次计算的结果。
    return foundDirectories
  }

  // Precompile once — idePatterns is invariant across baseDirs
  // regexes 集合派生`idePatterns.map`，供共享工具后续处理使用。
  const regexes = idePatterns.map(p => new RegExp('^' + p))

  // 按顺序遍历 `pluginDirPaths` 中的baseDir，逐个交给共享工具处理。
  for (const baseDir of pluginDirPaths) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // entries 集合读取`fs.readdir`，供共享工具后续处理使用。
      const entries = await fs.readdir(baseDir)
      // 按顺序遍历 `regexes` 中的regex，逐个交给共享工具处理。
      for (const regex of regexes) {
        // 按顺序遍历 `entries` 中的entry，逐个交给共享工具处理。
        for (const entry of entries) {
          // 满足 `!regex.test(entry.name)` 时，共享工具执行该分支。
          if (!regex.test(entry.name)) continue
          // Accept symlinks too — dirent.isDirectory() is false for symlinks,
          // but GNU stow users symlink their JetBrains config dirs. Downstream
          // fs.stat() calls will filter out symlinks that don't point to dirs.
          // 只有 `!entry.isDirectory() && !entry.isSymbolicLink()` 满足时，共享工具才执行该分支。
          if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
          // dir格式化`join`，供共享工具后续处理使用。
          const dir = join(baseDir, entry.name)
          // Linux is the only OS to not have a plugins directory
          // 当 `platform()` 匹配 `'linux'` 时，共享工具执行对应分支。
          if (platform() === 'linux') {
            // foundDirectories 集合追加新条目，保持收集顺序与输入顺序一致。
            foundDirectories.push(dir)
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // pluginDir 插件数据格式化`join`，供共享工具后续处理使用。
          const pluginDir = join(dir, 'plugins')
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `fs.stat(pluginDir)` 完成，再继续共享工具 jetbrains的异步流程。
            await fs.stat(pluginDir)
            // foundDirectories 集合追加新条目，保持收集顺序与输入顺序一致。
            foundDirectories.push(pluginDir)
          } catch {
            // Plugin directory doesn't exist, skip
          }
        }
      }
    } catch {
      // Ignore errors from stale IDE directories (ENOENT, EACCES, etc.)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
  }

  // 返回 `foundDirectories.filter(`，作为共享工具这次计算的结果。
  return foundDirectories.filter(
    // 这个回调绑定到 (dir, index) => foundDirectories.indexOf(dir) === index,，负责共享工具在该局部场景下的响应。
    (dir, index) => foundDirectories.indexOf(dir) === index,
  )
}

// isJetBrainsPluginInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isJetBrainsPluginInstalled(
  ideType: IdeType,
): Promise<boolean> {
  // pluginDirs 插件数据读取`detectPluginDirectories`，供共享工具后续处理使用。
  const pluginDirs = await detectPluginDirectories(ideType)
  // 按顺序遍历 `pluginDirs` 中的dir，逐个交给共享工具处理。
  for (const dir of pluginDirs) {
    // pluginPath 插件数据格式化`join`，供共享工具后续处理使用。
    const pluginPath = join(dir, PLUGIN_PREFIX)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `getFsImplementation().stat(pluginPath)` 完成，再继续共享工具 jetbrains的异步流程。
      await getFsImplementation().stat(pluginPath)
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    } catch {
      // Plugin not found in this directory, continue
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// pluginInstalledCache 插件数据构建`new Map<IdeType, boolean>()` 整理出中间结果，供共享工具 jetbrains后续步骤使用。
const pluginInstalledCache = new Map<IdeType, boolean>()
// pluginInstalledPromiseCache 插件数据 命名 `new Map<IdeType, Promise<boolean>>()`，让后续代码直接表达这个值的用途。
const pluginInstalledPromiseCache = new Map<IdeType, Promise<boolean>>()

// isJetBrainsPluginInstalledMemoized 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isJetBrainsPluginInstalledMemoized(
  ideType: IdeType,
  forceRefresh = false,
): Promise<boolean> {
  // forceRefresh缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!forceRefresh) {
    // existing读取`pluginInstalledPromiseCache.get`，供共享工具后续处理使用。
    const existing = pluginInstalledPromiseCache.get(ideType)
    // 满足 `existing` 时，共享工具执行该分支。
    if (existing) {
      // 返回 `existing`，作为共享工具这次计算的结果。
      return existing
    }
  }
  // promise 异步任务保存`isJetBrainsPluginInstalled`，供共享工具后续处理使用。
  const promise = isJetBrainsPluginInstalled(ideType).then(result => {
    // pluginInstalledCache.set 写入新的状态值，使共享工具后续读取保持一致。
    pluginInstalledCache.set(ideType, result)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  })
  // pluginInstalledPromiseCache.set 写入新的状态值，使共享工具后续读取保持一致。
  pluginInstalledPromiseCache.set(ideType, promise)
  // 返回 `promise`，作为共享工具这次计算的结果。
  return promise
}

// isJetBrainsPluginInstalledCached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isJetBrainsPluginInstalledCached(
  ideType: IdeType,
  forceRefresh = false,
): Promise<boolean> {
  // 满足 `forceRefresh` 时，共享工具执行该分支。
  if (forceRefresh) {
    // 调用 pluginInstalledCache.delete，触发共享工具此处需要的副作用。
    pluginInstalledCache.delete(ideType)
    // 调用 pluginInstalledPromiseCache.delete，触发共享工具此处需要的副作用。
    pluginInstalledPromiseCache.delete(ideType)
  }
  // 返回 `isJetBrainsPluginInstalledMemoized(ideType, forceRefresh)`，作为共享工具这次计算的结果。
  return isJetBrainsPluginInstalledMemoized(ideType, forceRefresh)
}

/**
 * Returns the cached result of isJetBrainsPluginInstalled synchronously.
 * Returns false if the result hasn't been resolved yet.
 * Use this only in sync contexts (e.g., status notice isActive checks).
 */
// isJetBrainsPluginInstalledCachedSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isJetBrainsPluginInstalledCachedSync(
  ideType: IdeType,
): boolean {
  // 返回 `pluginInstalledCache.get(ideType) ?? false`，作为共享工具这次计算的结果。
  return pluginInstalledCache.get(ideType) ?? false
}

// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 类型依赖 { OutputStyleConfig } 来自 ../../constants/outputStyles.js，用于校准插件管理的数据契约。
import type { OutputStyleConfig } from '../../constants/outputStyles.js'
// 引入 getPluginErrorMessage，将 ../../types/plugin.js 中已经封装好的能力接到本文件流程里。
import { getPluginErrorMessage } from '../../types/plugin.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  coerceDescriptionToString,
  parseFrontmatter,
} from '../frontmatterParser.js'
// 引入 getFsImplementation、isDuplicatePath，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation, isDuplicatePath } from '../fsOperations.js'
// 引入 extractDescriptionFromMarkdown，将 ../markdownConfigLoader.js 中已经封装好的能力接到本文件流程里。
import { extractDescriptionFromMarkdown } from '../markdownConfigLoader.js'
// 引入 loadAllPluginsCacheOnly，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { loadAllPluginsCacheOnly } from './pluginLoader.js'
// 引入 walkPluginMarkdown，将 ./walkPluginMarkdown.js 中已经封装好的能力接到本文件流程里。
import { walkPluginMarkdown } from './walkPluginMarkdown.js'

// loadOutputStylesFromDirectory 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadOutputStylesFromDirectory(
  outputStylesPath: string,
  pluginName: string,
  loadedPaths: Set<string>,
): Promise<OutputStyleConfig[]> {
  // styles 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const styles: OutputStyleConfig[] = []
  // 等待 `walkPluginMarkdown(` 完成，再继续插件工具 load Plugin Output Styles的异步流程。
  await walkPluginMarkdown(
    outputStylesPath,
    // 这个回调绑定到 async fullPath => {，负责插件管理在该局部场景下的响应。
    async fullPath => {
      // style读取`loadOutputStyleFromFile`，供插件管理后续处理使用。
      const style = await loadOutputStyleFromFile(
        fullPath,
        pluginName,
        loadedPaths,
      )
      // 满足 `style) styles.push(style` 时，插件管理执行该分支。
      if (style) styles.push(style)
    },
    { logLabel: 'output-styles' },
  )
  // 返回 `styles`，作为插件管理这次计算的结果。
  return styles
}

// loadOutputStyleFromFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadOutputStyleFromFile(
  filePath: string,
  pluginName: string,
  loadedPaths: Set<string>,
): Promise<OutputStyleConfig | null> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // 满足 `isDuplicatePath(fs, filePath, loadedPaths)` 时，插件管理执行该分支。
  if (isDuplicatePath(fs, filePath, loadedPaths)) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
    const content = await fs.readFile(filePath, { encoding: 'utf-8' })
    // 从 `parseFrontmatter(` 解构 frontmatter、content，减少插件工具 load Plugin Output Styles对同一对象的重复访问。
    const { frontmatter, content: markdownContent } = parseFrontmatter(
      content,
      filePath,
    )

    // fileName 文件数据保存`basename`，供插件管理后续处理使用。
    const fileName = basename(filePath, '.md')
    // baseStyleName标记插件工具 load Plugin Output Styles是否启用对应路径。
    const baseStyleName = (frontmatter.name as string) || fileName
    // Namespace output styles with plugin name, consistent with commands and agents
    // 名称固定为 ``${pluginName}:${baseStyleName}``，作为插件工具 load Plugin Output Styles后续展示或比较的基准。
    const name = `${pluginName}:${baseStyleName}`
    // description 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const description =
      coerceDescriptionToString(frontmatter.description, name) ??
      extractDescriptionFromMarkdown(
        markdownContent,
        `Output style from ${pluginName} plugin`,
      )

    // Parse forceForPlugin flag (supports both boolean and string values)
    // forceRaw保存`frontmatter['force-for-plugin']`，供插件工具 load Plugin Output Styles后续判断或输出使用。
    const forceRaw = frontmatter['force-for-plugin']
    // forceForPlugin 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const forceForPlugin =
      forceRaw === true || forceRaw === 'true'
        ? true
        : forceRaw === false || forceRaw === 'false'
          ? false
          : undefined

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      name,
      description,
      prompt: markdownContent.trim(),
      source: 'plugin',
      forceForPlugin,
    }
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load output style from ${filePath}: ${error}`, {
      level: 'error',
    })
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

// loadPluginOutputStyles 插件数据保存`memoize`，供插件管理后续处理使用。
export const loadPluginOutputStyles = memoize(
  async (): Promise<OutputStyleConfig[]> => {
    // Only load output styles from enabled plugins
    // 从 `await loadAllPluginsCacheOnly()` 解构 enabled、errors，减少插件工具 load Plugin Output Styles对同一对象的重复访问。
    const { enabled, errors } = await loadAllPluginsCacheOnly()
    // allStyles 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const allStyles: OutputStyleConfig[] = []

    // 满足 `errors.length > 0` 时，插件管理执行该分支。
    if (errors.length > 0) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        // 这个回调绑定到 `Plugin loading errors: ${errors.map(e => getPluginErrorMessage(e)).join(', ')}`,，负责插件管理在该局部场景下的响应。
        `Plugin loading errors: ${errors.map(e => getPluginErrorMessage(e)).join(', ')}`,
      )
    }

    // 按顺序遍历 `enabled` 中的plugin 插件数据，逐个交给插件管理处理。
    for (const plugin of enabled) {
      // Track loaded file paths to prevent duplicates within this plugin
      // loadedPaths 路径数据构建`new Set<string>()`，供后续判断或组装使用。
      const loadedPaths = new Set<string>()

      // Load output styles from default output-styles directory
      // 满足 `plugin.outputStylesPath` 时，插件管理执行该分支。
      if (plugin.outputStylesPath) {
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // styles 集合读取`loadOutputStylesFromDirectory`，供插件管理后续处理使用。
          const styles = await loadOutputStylesFromDirectory(
            plugin.outputStylesPath,
            plugin.name,
            loadedPaths,
          )
          // allStyles 集合追加新条目，保持收集顺序与输入顺序一致。
          allStyles.push(...styles)

          // 满足 `styles.length > 0` 时，插件管理执行该分支。
          if (styles.length > 0) {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Loaded ${styles.length} output styles from plugin ${plugin.name} default directory`,
            )
          }
        } catch (error) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Failed to load output styles from plugin ${plugin.name} default directory: ${error}`,
            { level: 'error' },
          )
        }
      }

      // Load output styles from additional paths specified in manifest
      // 满足 `plugin.outputStylesPaths` 时，插件管理执行该分支。
      if (plugin.outputStylesPaths) {
        // 按顺序遍历 `plugin.outputStylesPaths` 中的stylePath 路径数据，逐个交给插件管理处理。
        for (const stylePath of plugin.outputStylesPaths) {
          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
            const fs = getFsImplementation()
            // stats 集合保存`fs.stat`，供插件管理后续处理使用。
            const stats = await fs.stat(stylePath)

            // 满足 `stats.isDirectory()` 时，插件管理执行该分支。
            if (stats.isDirectory()) {
              // Load all .md files from directory
              // styles 集合读取`loadOutputStylesFromDirectory`，供插件管理后续处理使用。
              const styles = await loadOutputStylesFromDirectory(
                stylePath,
                plugin.name,
                loadedPaths,
              )
              // allStyles 集合追加新条目，保持收集顺序与输入顺序一致。
              allStyles.push(...styles)

              // 满足 `styles.length > 0` 时，插件管理执行该分支。
              if (styles.length > 0) {
                // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `Loaded ${styles.length} output styles from plugin ${plugin.name} custom path: ${stylePath}`,
                )
              }
            // 插件工具 load Plugin Output Styles在这里处理 `} else if (stats.isFile() && stylePath.endsWith('.md')) {`，完成这一小步状态转换。
            } else if (stats.isFile() && stylePath.endsWith('.md')) {
              // Load single output style file
              // style读取`loadOutputStyleFromFile`，供插件管理后续处理使用。
              const style = await loadOutputStyleFromFile(
                stylePath,
                plugin.name,
                loadedPaths,
              )
              // 满足 `style` 时，插件管理执行该分支。
              if (style) {
                // allStyles 集合追加新条目，保持收集顺序与输入顺序一致。
                allStyles.push(style)
                // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `Loaded output style from plugin ${plugin.name} custom file: ${stylePath}`,
                )
              }
            }
          } catch (error) {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Failed to load output styles from plugin ${plugin.name} custom path ${stylePath}: ${error}`,
              { level: 'error' },
            )
          }
        }
      }
    }

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Total plugin output styles loaded: ${allStyles.length}`)
    // 返回 `allStyles`，作为插件管理这次计算的结果。
    return allStyles
  },
)

// clearPluginOutputStyleCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginOutputStyleCache(): void {
  // 调用 loadPluginOutputStyles.cache?.clear?.()，完成这一处局部操作。
  loadPluginOutputStyles.cache?.clear?.()
}

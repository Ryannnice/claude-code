// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 类型依赖 { OutputStyleConfig } 来自 ../constants/outputStyles.js，用于校准输出风格加载流程的数据契约。
import type { OutputStyleConfig } from '../constants/outputStyles.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 coerceDescriptionToString 工具函数，把通用处理留在 ../utils/frontmatterParser.js 中维护。
import { coerceDescriptionToString } from '../utils/frontmatterParser.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 整理这一组导入，让输出风格加载流程后续逻辑可以直接复用这些外部能力。
import {
  extractDescriptionFromMarkdown,
  loadMarkdownFilesForSubdir,
} from '../utils/markdownConfigLoader.js'
// 复用 clearPluginOutputStyleCache 工具函数，把通用处理留在 ../utils/plugins/loadPluginOutputStyles.js 中维护。
import { clearPluginOutputStyleCache } from '../utils/plugins/loadPluginOutputStyles.js'

/**
 * Loads markdown files from .claude/output-styles directories throughout the project
 * and from ~/.claude/output-styles directory and converts them to output styles.
 *
 * Each filename becomes a style name, and the file content becomes the style prompt.
 * The frontmatter provides name and description.
 *
 * Structure:
 * - Project .claude/output-styles/*.md -> project styles
 * - User ~/.claude/output-styles/*.md -> user styles (overridden by project styles)
 *
 * @param cwd Current working directory for project directory traversal
 */
// getOutputStyleDirStyles 集合保存`memoize`，供输出风格加载流程后续处理使用。
export const getOutputStyleDirStyles = memoize(
  async (cwd: string): Promise<OutputStyleConfig[]> => {
    // 保护这一段可能失败的输出风格加载流程操作，确保异常能进入相邻错误处理。
    try {
      // markdownFiles 文件数据读取`loadMarkdownFilesForSubdir`，供输出风格加载流程后续处理使用。
      const markdownFiles = await loadMarkdownFilesForSubdir(
        'output-styles',
        cwd,
      )

      // styles 集合保存`markdownFiles`，供后续判断或组装使用。
      const styles = markdownFiles
        // 链式调用 map，继续加工上一行在输出风格加载流程中产生的数据。
        .map(({ filePath, frontmatter, content, source }) => {
          // 保护这一段可能失败的输出风格加载流程操作，确保异常能进入相邻错误处理。
          try {
            // fileName 文件数据保存`basename`，供输出风格加载流程后续处理使用。
            const fileName = basename(filePath)
            // styleName格式化`fileName.replace`，供输出风格加载流程后续处理使用。
            const styleName = fileName.replace(/\.md$/, '')

            // Get style configuration from frontmatter
            // 名称标记输出风格加载流程是否启用对应路径。
            const name = (frontmatter['name'] || styleName) as string
            // description 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const description =
              coerceDescriptionToString(
                frontmatter['description'],
                styleName,
              ) ??
              extractDescriptionFromMarkdown(
                content,
                `Custom ${styleName} output style`,
              )

            // Parse keep-coding-instructions flag (supports both boolean and string values)
            // keepCodingInstructionsRaw 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const keepCodingInstructionsRaw =
              frontmatter['keep-coding-instructions']
            // keepCodingInstructions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const keepCodingInstructions =
              keepCodingInstructionsRaw === true ||
              keepCodingInstructionsRaw === 'true'
                ? true
                : keepCodingInstructionsRaw === false ||
                    keepCodingInstructionsRaw === 'false'
                  ? false
                  : undefined

            // Warn if force-for-plugin is set on non-plugin output style
            // `frontmatter['force-for-plugin']` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
            if (frontmatter['force-for-plugin'] !== undefined) {
              // 记录输出风格加载流程运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Output style "${name}" has force-for-plugin set, but this option only applies to plugin output styles. Ignoring.`,
                { level: 'warn' },
              )
            }

            // 返回结构化结果，集中表达输出风格加载流程已经整理出的状态。
            return {
              name,
              description,
              prompt: content.trim(),
              source,
              keepCodingInstructions,
            }
          } catch (error) {
            // 记录输出风格加载流程运行诊断，方便排查异常路径或性能问题。
            logError(error)
            // 返回 `null`，作为输出风格加载流程这次计算的结果。
            return null
          }
        })
        // 链式调用 filter，继续加工上一行在输出风格加载流程中产生的数据。
        .filter(style => style !== null)

      // 返回 `styles`，作为输出风格加载流程这次计算的结果。
      return styles
    } catch (error) {
      // 记录输出风格加载流程运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 返回列表结果，保留输出风格加载流程已经排好的条目顺序。
      return []
    }
  },
)

// clearOutputStyleCaches 封装loadOutputStylesDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearOutputStyleCaches(): void {
  // 调用 getOutputStyleDirStyles.cache?.clear?.()，完成这一处局部操作。
  getOutputStyleDirStyles.cache?.clear?.()
  // 调用 loadMarkdownFilesForSubdir.cache?.clear?.()，完成这一处局部操作。
  loadMarkdownFilesForSubdir.cache?.clear?.()
  // 清理相关缓存，确保输出风格加载流程下一次读取时重新加载最新数据。
  clearPluginOutputStyleCache()
}

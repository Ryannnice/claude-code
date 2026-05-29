// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'

// SKILL_MD_RE保存`/^skill\.md$/i`，供后续判断或组装使用。
const SKILL_MD_RE = /^skill\.md$/i

/**
 * Recursively walk a plugin directory, invoking onFile for each .md file.
 *
 * The namespace array tracks the subdirectory path relative to the root
 * (e.g., ['foo', 'bar'] for root/foo/bar/file.md). Callers that don't need
 * namespacing can ignore the second argument.
 *
 * When stopAtSkillDir is true and a directory contains SKILL.md, onFile is
 * called for all .md files in that directory but subdirectories are not
 * scanned — skill directories are leaf containers.
 *
 * Readdir errors are swallowed with a debug log so one bad directory doesn't
 * abort a plugin load.
 */
// walkPluginMarkdown 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function walkPluginMarkdown(
  rootDir: string,
  // 这个回调绑定到 onFile: (fullPath: string, namespace: string[]) => Promise<void>,，负责插件管理在该局部场景下的响应。
  onFile: (fullPath: string, namespace: string[]) => Promise<void>,
  opts: { stopAtSkillDir?: boolean; logLabel?: string } = {},
): Promise<void> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // label保存`opts.logLabel ?? 'plugin'`，供后续判断或组装使用。
  const label = opts.logLabel ?? 'plugin'

  // scan 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function scan(dirPath: string, namespace: string[]): Promise<void> {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // entries 集合读取`fs.readdir`，供插件管理后续处理使用。
      const entries = await fs.readdir(dirPath)

      // 插件管理在这里按实际状态进入对应分支。
      if (
        opts.stopAtSkillDir &&
        // 调用 entries.some，触发插件管理此处需要的副作用。
        entries.some(e => e.isFile() && SKILL_MD_RE.test(e.name))
      ) {
        // Skill directory: collect .md files here, don't recurse.
        // 等待 `Promise.all(` 完成，再继续插件工具 walk Plugin Markdown的异步流程。
        await Promise.all(
          // 调用 entries.map，触发插件管理此处需要的副作用。
          entries.map(entry =>
            entry.isFile() && entry.name.toLowerCase().endsWith('.md')
              ? onFile(join(dirPath, entry.name), namespace)
              : undefined,
          ),
        )
        // 插件工具 walk Plugin Markdown在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 等待 `Promise.all(` 完成，再继续插件工具 walk Plugin Markdown的异步流程。
      await Promise.all(
        // 调用 entries.map，触发插件管理此处需要的副作用。
        entries.map(entry => {
          // fullPath 路径数据格式化`join`，供插件管理后续处理使用。
          const fullPath = join(dirPath, entry.name)
          // 满足 `entry.isDirectory()` 时，插件管理执行该分支。
          if (entry.isDirectory()) {
            // 返回 `scan(fullPath, [...namespace, entry.name])`，作为插件管理这次计算的结果。
            return scan(fullPath, [...namespace, entry.name])
          }
          // 只有 `entry.isFile() && entry.name.toLowerCase().endsWith('.md')` 满足时，插件管理才执行该分支。
          if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
            // 返回 `onFile(fullPath, namespace)`，作为插件管理这次计算的结果。
            return onFile(fullPath, namespace)
          }
          // 返回 `undefined`，作为插件管理这次计算的结果。
          return undefined
        }),
      )
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to scan ${label} directory ${dirPath}: ${error}`,
        { level: 'error' },
      )
    }
  }

  // 等待 `scan(rootDir, [])` 完成，再继续插件工具 walk Plugin Markdown的异步流程。
  await scan(rootDir, [])
}

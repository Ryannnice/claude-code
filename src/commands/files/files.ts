// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 类型依赖 { LocalCommandResult } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandResult } from '../../types/command.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 cacheKeys 工具函数，把通用处理留在 ../../utils/fileStateCache.js 中维护。
import { cacheKeys } from '../../utils/fileStateCache.js'

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(
  _args: string,
  context: ToolUseContext,
): Promise<LocalCommandResult> {
  // files 文件数据保存`cacheKeys`，供命令处理后续处理使用。
  const files = context.readFileState ? cacheKeys(context.readFileState) : []

  // files 文件数据为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (files.length === 0) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { type: 'text' as const, value: 'No files in context' }
  }

  // fileList 文件数据派生`files.map`，供命令处理后续处理使用。
  const fileList = files.map(file => relative(getCwd(), file)).join('\n')
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return { type: 'text' as const, value: `Files in context:\n${fileList}` }
}

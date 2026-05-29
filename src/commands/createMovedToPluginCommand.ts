// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.js，用于校准命令处理的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.js'
// 类型依赖 { Command } 来自 ../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../commands.js'
// 类型依赖 { ToolUseContext } 来自 ../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../Tool.js'

// Options 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Options = {
  name: string
  description: string
  progressMessage: string
  pluginName: string
  pluginCommand: string
  /**
   * The prompt to use while the marketplace is private.
   * External users will get this prompt. Once the marketplace is public,
   * this parameter and the fallback logic can be removed.
   */
  // 斜杠命令 create Moved To Plugin Command在这里处理 `getPromptWhileMarketplaceIsPrivate: (`，完成这一小步状态转换。
  getPromptWhileMarketplaceIsPrivate: (
    args: string,
    context: ToolUseContext,
  ) => Promise<ContentBlockParam[]>
}

// createMovedToPluginCommand 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createMovedToPluginCommand({
  name,
  description,
  progressMessage,
  pluginName,
  pluginCommand,
  getPromptWhileMarketplaceIsPrivate,
}: Options): Command {
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'prompt',
    name,
    description,
    progressMessage,
    contentLength: 0, // Dynamic content
    // userFacingName 使用 无 完成命令处理里的对应操作。
    userFacingName() {
      // 返回 `name`，作为命令处理这次计算的结果。
      return name
    },
    source: 'builtin',
    async getPromptForCommand(
      args: string,
      context: ToolUseContext,
    ): Promise<ContentBlockParam[]> {
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，命令处理执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 返回列表结果，保留命令处理已经排好的条目顺序。
        return [
          {
            type: 'text',
            text: `This command has been moved to a plugin. Tell the user:

1. To install the plugin, run:
   claude plugin install ${pluginName}@claude-code-marketplace

2. After installation, use /${pluginName}:${pluginCommand} to run this command

3. For more information, see: https://github.com/anthropics/claude-code-marketplace/blob/main/${pluginName}/README.md

Do not attempt to run the command. Simply inform the user about the plugin installation.`,
          },
        ]
      }

      // 返回 `getPromptWhileMarketplaceIsPrivate(args, context)`，作为命令处理这次计算的结果。
      return getPromptWhileMarketplaceIsPrivate(args, context)
    },
  }
}

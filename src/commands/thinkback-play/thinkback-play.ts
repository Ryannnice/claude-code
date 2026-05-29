// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 类型依赖 { LocalCommandResult } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { LocalCommandResult } from '../../commands.js'
// 复用 loadInstalledPluginsV2 工具函数，把通用处理留在 ../../utils/plugins/installedPluginsManager.js 中维护。
import { loadInstalledPluginsV2 } from '../../utils/plugins/installedPluginsManager.js'
// 复用 OFFICIAL_MARKETPLACE_NAME 工具函数，把通用处理留在 ../../utils/plugins/officialMarketplace.js 中维护。
import { OFFICIAL_MARKETPLACE_NAME } from '../../utils/plugins/officialMarketplace.js'
// 引入 playAnimation，将 ../thinkback/thinkback.js 中已经封装好的能力接到本文件流程里。
import { playAnimation } from '../thinkback/thinkback.js'

// INTERNAL_MARKETPLACE_NAME 市场数据 命名 `'claude-code-marketplace'`，让后续代码直接表达这个值的用途。
const INTERNAL_MARKETPLACE_NAME = 'claude-code-marketplace'
// SKILL_NAME 命名 `'thinkback'`，让后续代码直接表达这个值的用途。
const SKILL_NAME = 'thinkback'

// getPluginId 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPluginId(): string {
  // marketplaceName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const marketplaceName =
    process.env.USER_TYPE === 'ant'
      ? INTERNAL_MARKETPLACE_NAME
      : OFFICIAL_MARKETPLACE_NAME
  // 返回 ``thinkback@${marketplaceName}``，作为命令处理这次计算的结果。
  return `thinkback@${marketplaceName}`
}

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(): Promise<LocalCommandResult> {
  // Get skill directory from installed plugins config
  // v2Data读取`loadInstalledPluginsV2`，供命令处理后续处理使用。
  const v2Data = loadInstalledPluginsV2()
  // pluginId 插件数据读取`getPluginId`，供命令处理后续处理使用。
  const pluginId = getPluginId()
  // installations 集合 命名 `v2Data.plugins[pluginId]`，让后续代码直接表达这个值的用途。
  const installations = v2Data.plugins[pluginId]

  // !installations || installations 集合为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (!installations || installations.length === 0) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value:
        'Thinkback plugin not installed. Run /think-back first to install it.',
    }
  }

  // firstInstall读取 `installations[0]` 对应条目，后续围绕该成员继续处理。
  const firstInstall = installations[0]
  // 满足 `!firstInstall?.installPath` 时，命令处理执行该分支。
  if (!firstInstall?.installPath) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value: 'Thinkback plugin installation path not found.',
    }
  }

  // skillDir格式化`join`，供命令处理后续处理使用。
  const skillDir = join(firstInstall.installPath, 'skills', SKILL_NAME)
  // 结果保存`playAnimation`，供命令处理后续处理使用。
  const result = await playAnimation(skillDir)
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return { type: 'text' as const, value: result.message }
}

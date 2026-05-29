// 类型依赖 { PluginError } 来自 ../../types/plugin.js，用于校准服务层 config的数据契约。
import type { PluginError } from '../../types/plugin.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage、toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage, toError } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getPluginLspServers 工具函数，把通用处理留在 ../../utils/plugins/lspPluginIntegration.js 中维护。
import { getPluginLspServers } from '../../utils/plugins/lspPluginIntegration.js'
// 复用 loadAllPluginsCacheOnly 工具函数，把通用处理留在 ../../utils/plugins/pluginLoader.js 中维护。
import { loadAllPluginsCacheOnly } from '../../utils/plugins/pluginLoader.js'
// 类型依赖 { ScopedLspServerConfig } 来自 ./types.js，用于校准服务层 config的数据契约。
import type { ScopedLspServerConfig } from './types.js'

/**
 * Get all configured LSP servers from plugins.
 * LSP servers are only supported via plugins, not user/project settings.
 *
 * @returns Object containing servers configuration keyed by scoped server name
 */
// getAllLspServers 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAllLspServers(): Promise<{
  servers: Record<string, ScopedLspServerConfig>
}> {
  // allServers 集合 从空对象开始收集键值，后续按名称补齐内容。
  const allServers: Record<string, ScopedLspServerConfig> = {}

  // 保护这一段可能失败的服务层 config操作，确保异常能进入相邻错误处理。
  try {
    // Get all enabled plugins
    // 从 `await loadAllPluginsCacheOnly()` 解构 enabled，减少服务层 config对同一对象的重复访问。
    const { enabled: plugins } = await loadAllPluginsCacheOnly()

    // Load LSP servers from each plugin in parallel.
    // Each plugin is independent — results are merged in original order so
    // Object.assign collision precedence (later plugins win) is preserved.
    // 结果列表保存`Promise.all`，供服务层 config后续处理使用。
    const results = await Promise.all(
      // 调用 plugins.map，触发服务层 config此处需要的副作用。
      plugins.map(async plugin => {
        // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
        const errors: PluginError[] = []
        // 保护这一段可能失败的服务层 config操作，确保异常能进入相邻错误处理。
        try {
          // scopedServers 集合读取`getPluginLspServers`，供服务层 config后续处理使用。
          const scopedServers = await getPluginLspServers(plugin, errors)
          // 返回结构化结果，集中表达服务层 config已经整理出的状态。
          return { plugin, scopedServers, errors }
        } catch (e) {
          // Defensive: if one plugin throws, don't lose results from the
          // others. The previous serial loop implicitly tolerated this.
          // 记录服务层 config运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Failed to load LSP servers for plugin ${plugin.name}: ${e}`,
            { level: 'error' },
          )
          // 返回结构化结果，集中表达服务层 config已经整理出的状态。
          return { plugin, scopedServers: undefined, errors }
        }
      }),
    )

    // 循环处理 `const { plugin, scopedServers, errors } of results`，让服务层 config逐项把同类条目按顺序走完。
    for (const { plugin, scopedServers, errors } of results) {
      // serverCount 数量派生`Object.keys`，供服务层 config后续处理使用。
      const serverCount = scopedServers ? Object.keys(scopedServers).length : 0
      // 满足 `serverCount > 0` 时，服务层 config执行该分支。
      if (serverCount > 0) {
        // Merge into all servers (already scoped by getPluginLspServers)
        // 调用 Object.assign，触发服务层 config此处需要的副作用。
        Object.assign(allServers, scopedServers)

        // 记录服务层 config运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Loaded ${serverCount} LSP server(s) from plugin: ${plugin.name}`,
        )
      }

      // Log any errors encountered
      // 满足 `errors.length > 0` 时，服务层 config执行该分支。
      if (errors.length > 0) {
        // 记录服务层 config运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `${errors.length} error(s) loading LSP servers from plugin: ${plugin.name}`,
        )
      }
    }

    // 记录服务层 config运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Total LSP servers loaded: ${Object.keys(allServers).length}`,
    )
  } catch (error) {
    // Log error for monitoring production issues.
    // LSP is optional, so we don't throw - but we need visibility
    // into why plugin loading fails to improve the feature.
    // 记录服务层 config运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))

    // 记录服务层 config运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error loading LSP servers: ${errorMessage(error)}`)
  }

  // 返回结构化结果，集中表达服务层 config已经整理出的状态。
  return {
    servers: allServers,
  }
}

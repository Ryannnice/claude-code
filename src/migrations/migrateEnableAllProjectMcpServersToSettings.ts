// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 整理这一组导入，让migrate Enable All Project Mcp Servers To Settings后续逻辑可以直接复用这些外部能力。
import {
  getCurrentProjectConfig,
  saveCurrentProjectConfig,
} from '../utils/config.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 整理这一组导入，让migrate Enable All Project Mcp Servers To Settings后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../utils/settings/settings.js'

/**
 * Migration: Move MCP server approval fields from project config to local settings
 * This migrates both enableAllProjectMcpServers and enabledMcpjsonServers to the
 * settings system for better management and consistency.
 */
// migrateEnableAllProjectMcpServersToSettings 封装migrateEnableAllProjectMcpServersToSettings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateEnableAllProjectMcpServersToSettings(): void {
  // projectConfig 配置读取`getCurrentProjectConfig`，供migrate Enable All Project Mcp Serv...后续处理使用。
  const projectConfig = getCurrentProjectConfig()

  // Check if any field exists in project config
  // hasEnableAll标记migrate Enable All Project Mcp Serv...是否启用对应路径。
  const hasEnableAll = projectConfig.enableAllProjectMcpServers !== undefined
  // hasEnabledServers 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasEnabledServers =
    projectConfig.enabledMcpjsonServers &&
    projectConfig.enabledMcpjsonServers.length > 0
  // hasDisabledServers 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasDisabledServers =
    projectConfig.disabledMcpjsonServers &&
    projectConfig.disabledMcpjsonServers.length > 0

  // 组合条件 `!hasEnableAll && !hasEnabledServers && !hasDisabl` 成立时，migrate Enable All Project Mcp Serv...才启用这条专门路径。
  if (!hasEnableAll && !hasEnabledServers && !hasDisabledServers) {
    // migrate Enable All Project Mcp Serv...在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的migrate Enable All Project Mcp Servers To Settings操作，确保异常能进入相邻错误处理。
  try {
    // existingSettings 集合读取`getSettingsForSource`，供migrate Enable All Project Mcp Serv...后续处理使用。
    const existingSettings = getSettingsForSource('localSettings') || {}
    // updates 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    const updates: Partial<{
      enableAllProjectMcpServers: boolean
      enabledMcpjsonServers: string[]
      disabledMcpjsonServers: string[]
    }> = {}
    // fieldsToRemove 先占位，稍后的条件分支会根据实际输入补齐它。
    const fieldsToRemove: Array<
      | 'enableAllProjectMcpServers'
      | 'enabledMcpjsonServers'
      | 'disabledMcpjsonServers'
    > = []

    // Migrate enableAllProjectMcpServers if it exists and hasn't been migrated
    // migrate Enable All Project Mcp Serv...在这里进入条件判断，后续代码按实际状态分流。
    if (
      hasEnableAll &&
      existingSettings.enableAllProjectMcpServers === undefined
    ) {
      // migrate Enable All Project Mcp Serv...在这里处理 `updates.enableAllProjectMcpServers =`，完成这一小步状态转换。
      updates.enableAllProjectMcpServers =
        projectConfig.enableAllProjectMcpServers
      // fieldsToRemove追加新条目，保持收集顺序与输入顺序一致。
      fieldsToRemove.push('enableAllProjectMcpServers')
    // migrate Enable All Project Mcp Serv...在这里处理 `} else if (hasEnableAll) {`，完成这一小步状态转换。
    } else if (hasEnableAll) {
      // Already migrated, just mark for removal
      // fieldsToRemove追加新条目，保持收集顺序与输入顺序一致。
      fieldsToRemove.push('enableAllProjectMcpServers')
    }

    // Migrate enabledMcpjsonServers if it exists
    // 组合条件 `hasEnabledServers && projectConfig.enabledMcpjson` 成立时，migrate Enable All Project Mcp Serv...才启用这条专门路径。
    if (hasEnabledServers && projectConfig.enabledMcpjsonServers) {
      // existingEnabledServers 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const existingEnabledServers =
        existingSettings.enabledMcpjsonServers || []
      // Merge the servers (avoiding duplicates)
      // enabledMcpjsonServers 集合更新为 `[`，确保migrateEnableAllProjectMcpServersToSettings后续读取最新状态。
      updates.enabledMcpjsonServers = [
        ...new Set([
          ...existingEnabledServers,
          ...projectConfig.enabledMcpjsonServers,
        ]),
      ]
      // fieldsToRemove追加新条目，保持收集顺序与输入顺序一致。
      fieldsToRemove.push('enabledMcpjsonServers')
    }

    // Migrate disabledMcpjsonServers if it exists
    // 组合条件 `hasDisabledServers && projectConfig.disabledMcpjs` 成立时，migrate Enable All Project Mcp Serv...才启用这条专门路径。
    if (hasDisabledServers && projectConfig.disabledMcpjsonServers) {
      // existingDisabledServers 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const existingDisabledServers =
        existingSettings.disabledMcpjsonServers || []
      // Merge the servers (avoiding duplicates)
      // disabledMcpjsonServers 集合更新为 `[`，确保migrateEnableAllProjectMcpServersToSettings后续读取最新状态。
      updates.disabledMcpjsonServers = [
        ...new Set([
          ...existingDisabledServers,
          ...projectConfig.disabledMcpjsonServers,
        ]),
      ]
      // fieldsToRemove追加新条目，保持收集顺序与输入顺序一致。
      fieldsToRemove.push('disabledMcpjsonServers')
    }

    // Update settings if there are any updates
    // 满足 `Object.keys(updates).length > 0` 时，migrate Enable All Project Mcp Serv...执行该分支。
    if (Object.keys(updates).length > 0) {
      // 调用 updateSettingsForSource，触发migrate Enable All Project Mcp Serv...此处需要的副作用。
      updateSettingsForSource('localSettings', updates)
    }

    // Remove migrated fields from project config
    // migrate Enable All Project Mcp Serv...在这里进入条件判断，后续代码按实际状态分流。
    if (
      fieldsToRemove.includes('enableAllProjectMcpServers') ||
      fieldsToRemove.includes('enabledMcpjsonServers') ||
      fieldsToRemove.includes('disabledMcpjsonServers')
    ) {
      // 调用 saveCurrentProjectConfig，触发migrate Enable All Project Mcp Serv...此处需要的副作用。
      saveCurrentProjectConfig(current => {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          enableAllProjectMcpServers: _enableAll,
          enabledMcpjsonServers: _enabledServers,
          disabledMcpjsonServers: _disabledServers,
          ...configWithoutFields
        } = current
        // 返回 `configWithoutFields`，作为migrate Enable All Project Mcp Serv...这次计算的结果。
        return configWithoutFields
      })
    }

    // Log the migration event
    // 记录migrate Enable All Project Mcp Serv...运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_migrate_mcp_approval_fields_success', {
      migratedCount: fieldsToRemove.length,
    })
  } catch (e: unknown) {
    // Log migration failure but don't throw to avoid breaking startup
    // 记录migrate Enable All Project Mcp Serv...运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 记录migrate Enable All Project Mcp Serv...运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_migrate_mcp_approval_fields_error', {})
  }
}

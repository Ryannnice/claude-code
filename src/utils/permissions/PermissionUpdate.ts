// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { posix } from 'path'
// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准权限判定的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// Types extracted to src/types/permissions.ts to break import cycles
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  AdditionalWorkingDirectory,
  WorkingDirectorySource,
} from '../../types/permissions.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 类型依赖 { EditableSettingSource } 来自 ../settings/constants.js，用于校准权限判定的数据契约。
import type { EditableSettingSource } from '../settings/constants.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../settings/settings.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 toPosixPath，将 ./filesystem.js 中已经封装好的能力接到本文件流程里。
import { toPosixPath } from './filesystem.js'
// 类型依赖 { PermissionRuleValue } 来自 ./PermissionRule.js，用于校准权限判定的数据契约。
import type { PermissionRuleValue } from './PermissionRule.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionUpdate,
  PermissionUpdateDestination,
} from './PermissionUpdateSchema.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  permissionRuleValueFromString,
  permissionRuleValueToString,
} from './permissionRuleParser.js'
// 引入 addPermissionRulesToSettings，将 ./permissionsLoader.js 中已经封装好的能力接到本文件流程里。
import { addPermissionRulesToSettings } from './permissionsLoader.js'

// Re-export for backwards compatibility
// 导出类型定义，让其他模块沿用权限工具 Permission Update的数据契约。
export type { AdditionalWorkingDirectory, WorkingDirectorySource }

// extractRules 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractRules(
  updates: PermissionUpdate[] | undefined,
): PermissionRuleValue[] {
  // updates 集合缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!updates) return []

  // 返回 `updates.flatMap(update => {`，作为权限判定这次计算的结果。
  return updates.flatMap(update => {
    // 按照 update.type 的取值选择权限判定的具体处理分支。
    switch (update.type) {
      case 'addRules':
        // 返回 `update.rules`，作为权限判定这次计算的结果。
        return update.rules
      default:
        // 返回列表结果，保留权限判定已经排好的条目顺序。
        return []
    }
  })
}

// hasRules 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasRules(updates: PermissionUpdate[] | undefined): boolean {
  // 返回 `extractRules(updates).length > 0`，作为权限判定这次计算的结果。
  return extractRules(updates).length > 0
}

/**
 * Applies a single permission update to the context and returns the updated context
 * @param context The current permission context
 * @param update The permission update to apply
 * @returns The updated permission context
 */
// applyPermissionUpdate 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyPermissionUpdate(
  context: ToolPermissionContext,
  update: PermissionUpdate,
): ToolPermissionContext {
  // 按照 update.type 的取值选择权限判定的具体处理分支。
  switch (update.type) {
    case 'setMode':
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Applying permission update: Setting mode to '${update.mode}'`,
      )
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...context,
        mode: update.mode,
      }

    case 'addRules': {
      // ruleStrings 集合派生`rules.map`，供权限判定后续处理使用。
      const ruleStrings = update.rules.map(rule =>
        permissionRuleValueToString(rule),
      )
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Applying permission update: Adding ${update.rules.length} ${update.behavior} rule(s) to destination '${update.destination}': ${jsonStringify(ruleStrings)}`,
      )

      // Determine which collection to update based on behavior
      // ruleKind 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const ruleKind =
        update.behavior === 'allow'
          ? 'alwaysAllowRules'
          : update.behavior === 'deny'
            ? 'alwaysDenyRules'
            : 'alwaysAskRules'

      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...context,
        [ruleKind]: {
          ...context[ruleKind],
          [update.destination]: [
            ...(context[ruleKind][update.destination] || []),
            ...ruleStrings,
          ],
        },
      }
    }

    case 'replaceRules': {
      // ruleStrings 集合派生`rules.map`，供权限判定后续处理使用。
      const ruleStrings = update.rules.map(rule =>
        permissionRuleValueToString(rule),
      )
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Replacing all ${update.behavior} rules for destination '${update.destination}' with ${update.rules.length} rule(s): ${jsonStringify(ruleStrings)}`,
      )

      // Determine which collection to update based on behavior
      // ruleKind 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const ruleKind =
        update.behavior === 'allow'
          ? 'alwaysAllowRules'
          : update.behavior === 'deny'
            ? 'alwaysDenyRules'
            : 'alwaysAskRules'

      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...context,
        [ruleKind]: {
          ...context[ruleKind],
          [update.destination]: ruleStrings, // Replace all rules for this source
        },
      }
    }

    case 'addDirectories': {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Applying permission update: Adding ${update.directories.length} director${update.directories.length === 1 ? 'y' : 'ies'} with destination '${update.destination}': ${jsonStringify(update.directories)}`,
      )
      // newAdditionalDirs 集合保存`Map`，供权限判定后续处理使用。
      const newAdditionalDirs = new Map(context.additionalWorkingDirectories)
      // 按顺序遍历 `update.directories` 中的directory，逐个交给权限判定处理。
      for (const directory of update.directories) {
        // newAdditionalDirs.set 写入新的状态值，使权限判定后续读取保持一致。
        newAdditionalDirs.set(directory, {
          path: directory,
          source: update.destination,
        })
      }
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...context,
        additionalWorkingDirectories: newAdditionalDirs,
      }
    }

    case 'removeRules': {
      // ruleStrings 集合派生`rules.map`，供权限判定后续处理使用。
      const ruleStrings = update.rules.map(rule =>
        permissionRuleValueToString(rule),
      )
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Applying permission update: Removing ${update.rules.length} ${update.behavior} rule(s) from source '${update.destination}': ${jsonStringify(ruleStrings)}`,
      )

      // Determine which collection to update based on behavior
      // ruleKind 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const ruleKind =
        update.behavior === 'allow'
          ? 'alwaysAllowRules'
          : update.behavior === 'deny'
            ? 'alwaysDenyRules'
            : 'alwaysAskRules'

      // Filter out the rules to be removed
      // existingRules 集合标记权限判定权限工具 Permission Update是否启用对应路径。
      const existingRules = context[ruleKind][update.destination] || []
      // rulesToRemove保存`Set`，供权限判定后续处理使用。
      const rulesToRemove = new Set(ruleStrings)
      // filteredRules 集合筛选`existingRules.filter`，供权限判定后续处理使用。
      const filteredRules = existingRules.filter(
        // rule更新为 `> !rulesToRemove.has(rule)`，确保权限工具后续读取最新状态。
        rule => !rulesToRemove.has(rule),
      )

      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...context,
        [ruleKind]: {
          ...context[ruleKind],
          [update.destination]: filteredRules,
        },
      }
    }

    case 'removeDirectories': {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Applying permission update: Removing ${update.directories.length} director${update.directories.length === 1 ? 'y' : 'ies'}: ${jsonStringify(update.directories)}`,
      )
      // newAdditionalDirs 集合保存`Map`，供权限判定后续处理使用。
      const newAdditionalDirs = new Map(context.additionalWorkingDirectories)
      // 按顺序遍历 `update.directories` 中的directory，逐个交给权限判定处理。
      for (const directory of update.directories) {
        // 调用 newAdditionalDirs.delete，触发权限判定此处需要的副作用。
        newAdditionalDirs.delete(directory)
      }
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...context,
        additionalWorkingDirectories: newAdditionalDirs,
      }
    }

    default:
      // 返回 `context`，作为权限判定这次计算的结果。
      return context
  }
}

/**
 * Applies multiple permission updates to the context and returns the updated context
 * @param context The current permission context
 * @param updates The permission updates to apply
 * @returns The updated permission context
 */
// applyPermissionUpdates 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyPermissionUpdates(
  context: ToolPermissionContext,
  updates: PermissionUpdate[],
): ToolPermissionContext {
  // updatedContext保存`context`，供后续判断或组装使用。
  let updatedContext = context
  // 按顺序遍历 `updates` 中的update，逐个交给权限判定处理。
  for (const update of updates) {
    // updatedContext更新为 `applyPermissionUpdate(updatedContext, update)`，确保权限工具后续读取最新状态。
    updatedContext = applyPermissionUpdate(updatedContext, update)
  }

  // 返回 `updatedContext`，作为权限判定这次计算的结果。
  return updatedContext
}

// supportsPersistence 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function supportsPersistence(
  destination: PermissionUpdateDestination,
): destination is EditableSettingSource {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    destination === 'localSettings' ||
    destination === 'userSettings' ||
    destination === 'projectSettings'
  )
}

/**
 * Persists a permission update to the appropriate settings source
 * @param update The permission update to persist
 */
// persistPermissionUpdate 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function persistPermissionUpdate(update: PermissionUpdate): void {
  // 满足 `!supportsPersistence(update.destination)` 时，权限判定执行该分支。
  if (!supportsPersistence(update.destination)) return

  // 记录权限判定运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Persisting permission update: ${update.type} to source '${update.destination}'`,
  )

  // 按照 update.type 的取值选择权限判定的具体处理分支。
  switch (update.type) {
    case 'addRules': {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Persisting ${update.rules.length} ${update.behavior} rule(s) to ${update.destination}`,
      )
      // 调用 addPermissionRulesToSettings，触发权限判定此处需要的副作用。
      addPermissionRulesToSettings(
        {
          ruleValues: update.rules,
          ruleBehavior: update.behavior,
        },
        update.destination,
      )
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    }

    case 'addDirectories': {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Persisting ${update.directories.length} director${update.directories.length === 1 ? 'y' : 'ies'} to ${update.destination}`,
      )
      // existingSettings 集合读取`getSettingsForSource`，供权限判定后续处理使用。
      const existingSettings = getSettingsForSource(update.destination)
      // existingDirs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const existingDirs =
        existingSettings?.permissions?.additionalDirectories || []

      // Add new directories, avoiding duplicates
      // dirsToAdd筛选`directories.filter`，供权限判定后续处理使用。
      const dirsToAdd = update.directories.filter(
        // dir更新为 `> !existingDirs.includes(dir)`，确保权限工具后续读取最新状态。
        dir => !existingDirs.includes(dir),
      )

      // 满足 `dirsToAdd.length > 0` 时，权限判定执行该分支。
      if (dirsToAdd.length > 0) {
        // updatedDirs 集合 聚合成有序列表，保持后续遍历顺序稳定。
        const updatedDirs = [...existingDirs, ...dirsToAdd]
        // 调用 updateSettingsForSource，触发权限判定此处需要的副作用。
        updateSettingsForSource(update.destination, {
          permissions: {
            additionalDirectories: updatedDirs,
          },
        })
      }
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    }

    case 'removeRules': {
      // Handle rule removal
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Removing ${update.rules.length} ${update.behavior} rule(s) from ${update.destination}`,
      )
      // existingSettings 集合读取`getSettingsForSource`，供权限判定后续处理使用。
      const existingSettings = getSettingsForSource(update.destination)
      // existingPermissions 权限数据标记权限判定权限工具 Permission Update是否启用对应路径。
      const existingPermissions = existingSettings?.permissions || {}
      // existingRules 集合标记权限判定权限工具 Permission Update是否启用对应路径。
      const existingRules = existingPermissions[update.behavior] || []

      // Convert rules to normalized strings for comparison
      // Normalize via parse→serialize roundtrip so "Bash(*)" and "Bash" match
      // rulesToRemove保存`Set`，供权限判定后续处理使用。
      const rulesToRemove = new Set(
        update.rules.map(permissionRuleValueToString),
      )
      // filteredRules 集合筛选`existingRules.filter`，供权限判定后续处理使用。
      const filteredRules = existingRules.filter(rule => {
        // normalized保存`permissionRuleValueToString`，供权限判定后续处理使用。
        const normalized = permissionRuleValueToString(
          permissionRuleValueFromString(rule),
        )
        // 返回 `!rulesToRemove.has(normalized)`，作为权限判定这次计算的结果。
        return !rulesToRemove.has(normalized)
      })

      // 调用 updateSettingsForSource，触发权限判定此处需要的副作用。
      updateSettingsForSource(update.destination, {
        permissions: {
          [update.behavior]: filteredRules,
        },
      })
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    }

    case 'removeDirectories': {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Removing ${update.directories.length} director${update.directories.length === 1 ? 'y' : 'ies'} from ${update.destination}`,
      )
      // existingSettings 集合读取`getSettingsForSource`，供权限判定后续处理使用。
      const existingSettings = getSettingsForSource(update.destination)
      // existingDirs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const existingDirs =
        existingSettings?.permissions?.additionalDirectories || []

      // Remove specified directories
      // dirsToRemove保存`Set`，供权限判定后续处理使用。
      const dirsToRemove = new Set(update.directories)
      // filteredDirs 集合筛选`existingDirs.filter`，供权限判定后续处理使用。
      const filteredDirs = existingDirs.filter(dir => !dirsToRemove.has(dir))

      // 调用 updateSettingsForSource，触发权限判定此处需要的副作用。
      updateSettingsForSource(update.destination, {
        permissions: {
          additionalDirectories: filteredDirs,
        },
      })
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    }

    case 'setMode': {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Persisting mode '${update.mode}' to ${update.destination}`,
      )
      // 调用 updateSettingsForSource，触发权限判定此处需要的副作用。
      updateSettingsForSource(update.destination, {
        permissions: {
          defaultMode: update.mode,
        },
      })
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    }

    case 'replaceRules': {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Replacing all ${update.behavior} rules in ${update.destination} with ${update.rules.length} rule(s)`,
      )
      // ruleStrings 集合派生`rules.map`，供权限判定后续处理使用。
      const ruleStrings = update.rules.map(permissionRuleValueToString)
      // 调用 updateSettingsForSource，触发权限判定此处需要的副作用。
      updateSettingsForSource(update.destination, {
        permissions: {
          [update.behavior]: ruleStrings,
        },
      })
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    }
  }
}

/**
 * Persists multiple permission updates to the appropriate settings sources
 * Only persists updates with persistable sources
 * @param updates The permission updates to persist
 */
// persistPermissionUpdates 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function persistPermissionUpdates(updates: PermissionUpdate[]): void {
  // 按顺序遍历 `updates` 中的update，逐个交给权限判定处理。
  for (const update of updates) {
    // 调用 persistPermissionUpdate，触发权限判定此处需要的副作用。
    persistPermissionUpdate(update)
  }
}

/**
 * Creates a Read rule suggestion for a directory.
 * @param dirPath The directory path to create a rule for
 * @param destination The destination for the permission rule (defaults to 'session')
 * @returns A PermissionUpdate for a Read rule, or undefined for the root directory
 */
// createReadRuleSuggestion 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createReadRuleSuggestion(
  dirPath: string,
  destination: PermissionUpdateDestination = 'session',
): PermissionUpdate | undefined {
  // Convert to POSIX format for pattern matching (handles Windows internally)
  // pathForPattern 路径数据保存`toPosixPath`，供权限判定后续处理使用。
  const pathForPattern = toPosixPath(dirPath)

  // Root directory is too broad to be a reasonable permission target
  // 当 `pathForPattern` 匹配 `'/'` 时，权限判定执行对应分支。
  if (pathForPattern === '/') {
    // 返回 `undefined`，作为权限判定这次计算的结果。
    return undefined
  }

  // For absolute paths, prepend an extra / to create //path/** pattern
  // ruleContent保存`posix.isAbsolute`，供权限判定后续处理使用。
  const ruleContent = posix.isAbsolute(pathForPattern)
    ? `/${pathForPattern}/**`
    : `${pathForPattern}/**`

  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    type: 'addRules',
    rules: [
      {
        toolName: 'Read',
        ruleContent,
      },
    ],
    behavior: 'allow',
    destination,
  }
}

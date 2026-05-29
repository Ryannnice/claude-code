// 引入 readFileSync，将 ../fileRead.js 中已经封装好的能力接到本文件流程里。
import { readFileSync } from '../fileRead.js'
// 引入 getFsImplementation、safeResolvePath，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation, safeResolvePath } from '../fsOperations.js'
// 引入 safeParseJSON，将 ../json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from '../json.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  type EditableSettingSource,
  getEnabledSettingSources,
  type SettingSource,
} from '../settings/constants.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getSettingsFilePathForSource,
  getSettingsForSource,
  updateSettingsForSource,
} from '../settings/settings.js'
// 类型依赖 { SettingsJson } 来自 ../settings/types.js，用于校准权限判定的数据契约。
import type { SettingsJson } from '../settings/types.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionBehavior,
  PermissionRule,
  PermissionRuleSource,
  PermissionRuleValue,
} from './PermissionRule.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  permissionRuleValueFromString,
  permissionRuleValueToString,
} from './permissionRuleParser.js'

/**
 * Returns true if allowManagedPermissionRulesOnly is enabled in managed settings (policySettings).
 * When enabled, only permission rules from managed settings are respected.
 */
// shouldAllowManagedPermissionRulesOnly 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldAllowManagedPermissionRulesOnly(): boolean {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    getSettingsForSource('policySettings')?.allowManagedPermissionRulesOnly ===
    true
  )
}

/**
 * Returns true if "always allow" options should be shown in permission prompts.
 * When allowManagedPermissionRulesOnly is enabled, these options are hidden.
 */
// shouldShowAlwaysAllowOptions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowAlwaysAllowOptions(): boolean {
  // 返回 `!shouldAllowManagedPermissionRulesOnly()`，作为权限判定这次计算的结果。
  return !shouldAllowManagedPermissionRulesOnly()
}

// SUPPORTED_RULE_BEHAVIORS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SUPPORTED_RULE_BEHAVIORS = [
  'allow',
  'deny',
  'ask',
] as const satisfies PermissionBehavior[]

/**
 * Lenient version of getSettingsForSource that doesn't fail on ANY validation errors.
 * Simply parses the JSON and returns it as-is without schema validation.
 *
 * Used when loading settings to append new rules (avoids losing existing rules
 * due to validation failures in unrelated fields like hooks).
 *
 * FOR EDITING ONLY - do not use this for reading settings for execution.
 */
// getSettingsForSourceLenient_FOR_EDITING_ONLY_NOT_FOR_READING 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSettingsForSourceLenient_FOR_EDITING_ONLY_NOT_FOR_READING(
  source: SettingSource,
): SettingsJson | null {
  // 文件路径读取`getSettingsFilePathForSource`，供权限判定后续处理使用。
  const filePath = getSettingsFilePathForSource(source)
  // 文件路径缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!filePath) {
    // 返回 `null`，作为权限判定这次计算的结果。
    return null
  }

  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // 从 `safeResolvePath(getFsImplementation(), filePath)` 解构 resolvedPath，减少权限工具 permissions Loader对同一对象的重复访问。
    const { resolvedPath } = safeResolvePath(getFsImplementation(), filePath)
    // 文本内容读取`readFileSync`，供权限判定后续处理使用。
    const content = readFileSync(resolvedPath)
    // 满足 `content.trim() === ''` 时，权限判定执行该分支。
    if (content.trim() === '') {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {}
    }

    // data保存`safeParseJSON`，供权限判定后续处理使用。
    const data = safeParseJSON(content, false)
    // Return raw parsed JSON without validation to preserve all existing settings
    // This is safe because we're only using this for reading/appending, not for execution
    // 返回 `data && typeof data === 'object' ? (data as SettingsJson) : null`，作为权限判定这次计算的结果。
    return data && typeof data === 'object' ? (data as SettingsJson) : null
  } catch {
    // 返回 `null`，作为权限判定这次计算的结果。
    return null
  }
}

/**
 * Converts permissions JSON to an array of PermissionRule objects
 * @param data The parsed permissions data
 * @param source The source of these rules
 * @returns Array of PermissionRule objects
 */
// settingsJsonToRules 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function settingsJsonToRules(
  data: SettingsJson | null,
  source: PermissionRuleSource,
): PermissionRule[] {
  // 只有 `!data || !data.permissions` 满足时，权限判定才执行该分支。
  if (!data || !data.permissions) {
    // 返回列表结果，保留权限判定已经排好的条目顺序。
    return []
  }

  // 从 `data` 解构 permissions，减少权限工具 permissions Loader对同一对象的重复访问。
  const { permissions } = data
  // rules 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const rules: PermissionRule[] = []
  // 按顺序遍历 `SUPPORTED_RULE_BEHAVIORS` 中的behavior，逐个交给权限判定处理。
  for (const behavior of SUPPORTED_RULE_BEHAVIORS) {
    // behaviorArray读取 `permissions[behavior]` 对应条目，后续围绕该成员继续处理。
    const behaviorArray = permissions[behavior]
    // 满足 `behaviorArray` 时，权限判定执行该分支。
    if (behaviorArray) {
      // 按顺序遍历 `behaviorArray` 中的ruleString，逐个交给权限判定处理。
      for (const ruleString of behaviorArray) {
        // rules 集合追加新条目，保持收集顺序与输入顺序一致。
        rules.push({
          source,
          ruleBehavior: behavior,
          ruleValue: permissionRuleValueFromString(ruleString),
        })
      }
    }
  }
  // 返回 `rules`，作为权限判定这次计算的结果。
  return rules
}

/**
 * Loads all permission rules from all relevant sources (managed and project settings)
 * @returns Array of all permission rules
 */
// loadAllPermissionRulesFromDisk 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadAllPermissionRulesFromDisk(): PermissionRule[] {
  // If allowManagedPermissionRulesOnly is set, only use managed permission rules
  // 满足 `shouldAllowManagedPermissionRulesOnly()` 时，权限判定执行该分支。
  if (shouldAllowManagedPermissionRulesOnly()) {
    // 返回 `getPermissionRulesForSource('policySettings')`，作为权限判定这次计算的结果。
    return getPermissionRulesForSource('policySettings')
  }

  // Otherwise, load from all enabled sources (backwards compatible)
  // rules 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const rules: PermissionRule[] = []

  // 逐项读取 `getEnabledSettingSources()` 中的source，按输入顺序推进权限判定。
  for (const source of getEnabledSettingSources()) {
    // rules 集合追加新条目，保持收集顺序与输入顺序一致。
    rules.push(...getPermissionRulesForSource(source))
  }
  // 返回 `rules`，作为权限判定这次计算的结果。
  return rules
}

/**
 * Loads permission rules from a specific source
 * @param source The source to load from
 * @returns Array of permission rules from that source
 */
// getPermissionRulesForSource 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPermissionRulesForSource(
  source: SettingSource,
): PermissionRule[] {
  // settingsData读取`getSettingsForSource`，供权限判定后续处理使用。
  const settingsData = getSettingsForSource(source)
  // 返回 `settingsJsonToRules(settingsData, source)`，作为权限判定这次计算的结果。
  return settingsJsonToRules(settingsData, source)
}

// PermissionRuleFromEditableSettings 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRuleFromEditableSettings = PermissionRule & {
  source: EditableSettingSource
}

// Editable sources that can be modified (excludes policySettings and flagSettings)
// EDITABLE_SOURCES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const EDITABLE_SOURCES: EditableSettingSource[] = [
  'userSettings',
  'projectSettings',
  'localSettings',
]

/**
 * Deletes a rule from the project permissions file
 * @param rule The rule to delete
 * @returns Promise resolving to a boolean indicating success
 */
// deletePermissionRuleFromSettings 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deletePermissionRuleFromSettings(
  rule: PermissionRuleFromEditableSettings,
): boolean {
  // Runtime check to ensure source is actually editable
  // 满足 `!EDITABLE_SOURCES.includes(rule.source as EditableSettingSource)` 时，权限判定执行该分支。
  if (!EDITABLE_SOURCES.includes(rule.source as EditableSettingSource)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // ruleString保存`permissionRuleValueToString`，供权限判定后续处理使用。
  const ruleString = permissionRuleValueToString(rule.ruleValue)
  // settingsData读取`getSettingsForSource`，供权限判定后续处理使用。
  const settingsData = getSettingsForSource(rule.source)

  // If there's no settings data or permissions, nothing to do
  // 只有 `!settingsData || !settingsData.permissions` 满足时，权限判定才执行该分支。
  if (!settingsData || !settingsData.permissions) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // behaviorArray保存`settingsData.permissions[rule.ruleBehavior]`，供权限判定权限工具 permissions Loader后续判断或输出使用。
  const behaviorArray = settingsData.permissions[rule.ruleBehavior]
  // behaviorArray缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!behaviorArray) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Normalize raw settings entries via roundtrip parse→serialize so legacy
  // names (e.g. "KillShell") match their canonical form ("TaskStop").
  // normalizeEntry封装成回调，供权限判定权限工具 permissions Loader在事件触发或异步步骤中调用。
  const normalizeEntry = (raw: string): string =>
    permissionRuleValueToString(permissionRuleValueFromString(raw))

  // 满足 `!behaviorArray.some(raw => normalizeEntry(raw) === ruleString)` 时，权限判定执行该分支。
  if (!behaviorArray.some(raw => normalizeEntry(raw) === ruleString)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // Keep a copy of the original permissions data to preserve unrecognized keys
    // updatedSettingsData 集中保存权限判定权限工具 permissions Loader要一起传递的字段。
    const updatedSettingsData = {
      ...settingsData,
      permissions: {
        ...settingsData.permissions,
        [rule.ruleBehavior]: behaviorArray.filter(
          // 原始文本更新为 `> normalizeEntry(raw) !== ruleString`，确保权限工具后续读取最新状态。
          raw => normalizeEntry(raw) !== ruleString,
        ),
      },
    }

    // 从 `updateSettingsForSource(rule.source, updatedSettingsDat...` 解构 error，减少权限工具 permissions Loader对同一对象的重复访问。
    const { error } = updateSettingsForSource(rule.source, updatedSettingsData)
    // 满足 `error` 时，权限判定执行该分支。
    if (error) {
      // Error already logged inside updateSettingsForSource
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// getEmptyPermissionSettingsJson 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEmptyPermissionSettingsJson(): SettingsJson {
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    permissions: {},
  }
}

/**
 * Adds rules to the project permissions file
 * @param ruleValues The rule values to add
 * @returns Promise resolving to a boolean indicating success
 */
// addPermissionRulesToSettings 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addPermissionRulesToSettings(
  {
    ruleValues,
    ruleBehavior,
  }: {
    ruleValues: PermissionRuleValue[]
    ruleBehavior: PermissionBehavior
  },
  source: EditableSettingSource,
): boolean {
  // When allowManagedPermissionRulesOnly is enabled, don't persist new permission rules
  // 满足 `shouldAllowManagedPermissionRulesOnly()` 时，权限判定执行该分支。
  if (shouldAllowManagedPermissionRulesOnly()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 满足 `ruleValues.length < 1` 时，权限判定执行该分支。
  if (ruleValues.length < 1) {
    // No rules to add
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // ruleStrings 集合派生`ruleValues.map`，供权限判定后续处理使用。
  const ruleStrings = ruleValues.map(permissionRuleValueToString)
  // First try the normal settings loader which validates the schema
  // If validation fails, fall back to lenient loading to preserve existing rules
  // even if some fields (like hooks) have validation errors
  // settingsData 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const settingsData =
    getSettingsForSource(source) ||
    getSettingsForSourceLenient_FOR_EDITING_ONLY_NOT_FOR_READING(source) ||
    getEmptyPermissionSettingsJson()

  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // Ensure permissions object exists
    // existingPermissions 权限数据标记权限判定权限工具 permissions Loader是否启用对应路径。
    const existingPermissions = settingsData.permissions || {}
    // existingRules 集合标记权限判定权限工具 permissions Loader是否启用对应路径。
    const existingRules = existingPermissions[ruleBehavior] || []

    // Filter out duplicates - normalize existing entries via roundtrip
    // parse→serialize so legacy names match their canonical form.
    // existingRulesSet保存`Set`，供权限判定后续处理使用。
    const existingRulesSet = new Set(
      // 调用 existingRules.map，触发权限判定此处需要的副作用。
      existingRules.map(raw =>
        permissionRuleValueToString(permissionRuleValueFromString(raw)),
      ),
    )
    // newRules 集合筛选`ruleStrings.filter`，供权限判定后续处理使用。
    const newRules = ruleStrings.filter(rule => !existingRulesSet.has(rule))

    // If no new rules to add, return success
    // newRules 集合为空时立即返回或跳过，避免权限判定把空集合当成可处理内容。
    if (newRules.length === 0) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Keep a copy of the original settings data to preserve unrecognized keys
    // updatedSettingsData 集中保存权限判定权限工具 permissions Loader要一起传递的字段。
    const updatedSettingsData = {
      ...settingsData,
      permissions: {
        ...existingPermissions,
        [ruleBehavior]: [...existingRules, ...newRules],
      },
    }
    // 结果保存`updateSettingsForSource`，供权限判定后续处理使用。
    const result = updateSettingsForSource(source, updatedSettingsData)

    // 满足 `result.error` 时，权限判定执行该分支。
    if (result.error) {
      // 抛出 result.error，阻止权限判定在无效状态下继续运行。
      throw result.error
    }

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

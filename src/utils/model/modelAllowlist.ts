// 引入 getSettings_DEPRECATED，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from '../settings/settings.js'
// 引入 isModelAlias、isModelFamilyAlias，将 ./aliases.js 中已经封装好的能力接到本文件流程里。
import { isModelAlias, isModelFamilyAlias } from './aliases.js'
// 引入 parseUserSpecifiedModel，将 ./model.js 中已经封装好的能力接到本文件流程里。
import { parseUserSpecifiedModel } from './model.js'
// 引入 resolveOverriddenModel，将 ./modelStrings.js 中已经封装好的能力接到本文件流程里。
import { resolveOverriddenModel } from './modelStrings.js'

/**
 * Check if a model belongs to a given family by checking if its name
 * (or resolved name) contains the family identifier.
 */
// modelBelongsToFamily 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function modelBelongsToFamily(model: string, family: string): boolean {
  // 满足 `model.includes(family)` 时，共享工具执行该分支。
  if (model.includes(family)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Resolve aliases like "best" → "claude-opus-4-6" to check family membership
  // 满足 `isModelAlias(model)` 时，共享工具执行该分支。
  if (isModelAlias(model)) {
    // resolved解析`parseUserSpecifiedModel`，供共享工具后续处理使用。
    const resolved = parseUserSpecifiedModel(model).toLowerCase()
    // 返回 `resolved.includes(family)`，作为共享工具这次计算的结果。
    return resolved.includes(family)
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a model name starts with a prefix at a segment boundary.
 * The prefix must match up to the end of the name or a "-" separator.
 * e.g. "claude-opus-4-5" matches "claude-opus-4-5-20251101" but not "claude-opus-4-50".
 */
// prefixMatchesModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function prefixMatchesModel(modelName: string, prefix: string): boolean {
  // 满足 `!modelName.startsWith(prefix)` 时，共享工具执行该分支。
  if (!modelName.startsWith(prefix)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `modelName.length === prefix.length || modelName[prefix.length] === '-'`，作为共享工具这次计算的结果。
  return modelName.length === prefix.length || modelName[prefix.length] === '-'
}

/**
 * Check if a model matches a version-prefix entry in the allowlist.
 * Supports shorthand like "opus-4-5" (mapped to "claude-opus-4-5") and
 * full prefixes like "claude-opus-4-5". Resolves input aliases before matching.
 */
// modelMatchesVersionPrefix 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function modelMatchesVersionPrefix(model: string, entry: string): boolean {
  // Resolve the input model to a full name if it's an alias
  // resolvedModel保存`isModelAlias`，供共享工具后续处理使用。
  const resolvedModel = isModelAlias(model)
    ? parseUserSpecifiedModel(model).toLowerCase()
    : model

  // Try the entry as-is (e.g. "claude-opus-4-5")
  // 满足 `prefixMatchesModel(resolvedModel, entry)` 时，共享工具执行该分支。
  if (prefixMatchesModel(resolvedModel, entry)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Try with "claude-" prefix (e.g. "opus-4-5" → "claude-opus-4-5")
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !entry.startsWith('claude-') &&
    prefixMatchesModel(resolvedModel, `claude-${entry}`)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a family alias is narrowed by more specific entries in the allowlist.
 * When the allowlist contains both "opus" and "opus-4-5", the specific entry
 * takes precedence — "opus" alone would be a wildcard, but "opus-4-5" narrows
 * it to only that version.
 */
// familyHasSpecificEntries 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function familyHasSpecificEntries(
  family: string,
  allowlist: string[],
): boolean {
  // 按顺序遍历 `allowlist` 中的entry，逐个交给共享工具处理。
  for (const entry of allowlist) {
    // 满足 `isModelFamilyAlias(entry)` 时，共享工具执行该分支。
    if (isModelFamilyAlias(entry)) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // Check if entry is a version-qualified variant of this family
    // e.g., "opus-4-5" or "claude-opus-4-5-20251101" for the "opus" family
    // Must match at a segment boundary (followed by '-' or end) to avoid
    // false positives like "opusplan" matching "opus"
    // idx保存`entry.indexOf`，供共享工具后续处理使用。
    const idx = entry.indexOf(family)
    // 满足 `idx === -1` 时，共享工具执行该分支。
    if (idx === -1) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // afterFamily记录 `idx + family.length` 是否成立，下一步按该结果分支。
    const afterFamily = idx + family.length
    // 只有 `afterFamily === entry.length || entry[afterFamily` 满足时，共享工具才执行该分支。
    if (afterFamily === entry.length || entry[afterFamily] === '-') {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if a model is allowed by the availableModels allowlist in settings.
 * If availableModels is not set, all models are allowed.
 *
 * Matching tiers:
 * 1. Family aliases ("opus", "sonnet", "haiku") — wildcard for the entire family,
 *    UNLESS more specific entries for that family also exist (e.g., "opus-4-5").
 *    In that case, the family wildcard is ignored and only the specific entries apply.
 * 2. Version prefixes ("opus-4-5", "claude-opus-4-5") — any build of that version
 * 3. Full model IDs ("claude-opus-4-5-20251101") — exact match only
 */
// isModelAllowed 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isModelAllowed(model: string): boolean {
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED() || {}
  // 从 `settings` 解构 availableModels，减少模型工具 model Allowlist对同一对象的重复访问。
  const { availableModels } = settings
  // availableModels 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!availableModels) {
    // 返回 `true // No restrictions`，作为共享工具这次计算的结果。
    return true // No restrictions
  }
  // availableModels 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (availableModels.length === 0) {
    // 返回 `false // Empty allowlist blocks all user-specified models`，作为共享工具这次计算的结果。
    return false // Empty allowlist blocks all user-specified models
  }

  // resolvedModel读取`resolveOverriddenModel`，供共享工具后续处理使用。
  const resolvedModel = resolveOverriddenModel(model)
  // normalizedModel格式化`resolvedModel.trim`，供共享工具后续处理使用。
  const normalizedModel = resolvedModel.trim().toLowerCase()
  // normalizedAllowlist 集合派生`availableModels.map`，供共享工具后续处理使用。
  const normalizedAllowlist = availableModels.map(m => m.trim().toLowerCase())

  // Direct match (alias-to-alias or full-name-to-full-name)
  // Skip family aliases that have been narrowed by specific entries —
  // e.g., "opus" in ["opus", "opus-4-5"] should NOT directly match,
  // because the admin intends to restrict to opus 4.5 only.
  // 满足 `normalizedAllowlist.includes(normalizedModel)` 时，共享工具执行该分支。
  if (normalizedAllowlist.includes(normalizedModel)) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !isModelFamilyAlias(normalizedModel) ||
      !familyHasSpecificEntries(normalizedModel, normalizedAllowlist)
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Family-level aliases in the allowlist match any model in that family,
  // but only if no more specific entries exist for that family.
  // e.g., ["opus"] allows all opus, but ["opus", "opus-4-5"] only allows opus 4.5.
  // 按顺序遍历 `normalizedAllowlist` 中的entry，逐个交给共享工具处理。
  for (const entry of normalizedAllowlist) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      isModelFamilyAlias(entry) &&
      !familyHasSpecificEntries(entry, normalizedAllowlist) &&
      modelBelongsToFamily(normalizedModel, entry)
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // For non-family entries, do bidirectional alias resolution
  // If model is an alias, resolve it and check if the resolved name is in the list
  // 满足 `isModelAlias(normalizedModel)` 时，共享工具执行该分支。
  if (isModelAlias(normalizedModel)) {
    // resolved解析`parseUserSpecifiedModel`，供共享工具后续处理使用。
    const resolved = parseUserSpecifiedModel(normalizedModel).toLowerCase()
    // 满足 `normalizedAllowlist.includes(resolved)` 时，共享工具执行该分支。
    if (normalizedAllowlist.includes(resolved)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // If any non-family alias in the allowlist resolves to the input model
  // 按顺序遍历 `normalizedAllowlist` 中的entry，逐个交给共享工具处理。
  for (const entry of normalizedAllowlist) {
    // 只有 `!isModelFamilyAlias(entry) && isModelAlias(entry)` 满足时，共享工具才执行该分支。
    if (!isModelFamilyAlias(entry) && isModelAlias(entry)) {
      // resolved解析`parseUserSpecifiedModel`，供共享工具后续处理使用。
      const resolved = parseUserSpecifiedModel(entry).toLowerCase()
      // 满足 `resolved === normalizedModel` 时，共享工具执行该分支。
      if (resolved === normalizedModel) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
    }
  }

  // Version-prefix matching: "opus-4-5" or "claude-opus-4-5" matches
  // "claude-opus-4-5-20251101" at a segment boundary
  // 按顺序遍历 `normalizedAllowlist` 中的entry，逐个交给共享工具处理。
  for (const entry of normalizedAllowlist) {
    // 只有 `!isModelFamilyAlias(entry) && !isModelAlias(entry)` 满足时，共享工具才执行该分支。
    if (!isModelFamilyAlias(entry) && !isModelAlias(entry)) {
      // 满足 `modelMatchesVersionPrefix(normalizedModel, entry)` 时，共享工具执行该分支。
      if (modelMatchesVersionPrefix(normalizedModel, entry)) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

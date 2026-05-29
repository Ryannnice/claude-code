// 类型依赖 { ConfigScope } 来自 src/services/mcp/types.js，用于校准共享工具的数据契约。
import type { ConfigScope } from 'src/services/mcp/types.js'
// 类型依赖 { ZodError, ZodIssue } 来自 zod/v4，用于校准共享工具的数据契约。
import type { ZodError, ZodIssue } from 'zod/v4'
// 引入 jsonParse，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from '../slowOperations.js'
// 引入 plural，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { plural } from '../stringUtils.js'
// 引入 validatePermissionRule，将 ./permissionValidation.js 中已经封装好的能力接到本文件流程里。
import { validatePermissionRule } from './permissionValidation.js'
// 引入 generateSettingsJSONSchema，将 ./schemaOutput.js 中已经封装好的能力接到本文件流程里。
import { generateSettingsJSONSchema } from './schemaOutput.js'
// 类型依赖 { SettingsJson } 来自 ./types.js，用于校准共享工具的数据契约。
import type { SettingsJson } from './types.js'
// 引入 SettingsSchema，将 ./types.js 中已经封装好的能力接到本文件流程里。
import { SettingsSchema } from './types.js'
// 引入 getValidationTip，将 ./validationTips.js 中已经封装好的能力接到本文件流程里。
import { getValidationTip } from './validationTips.js'

/**
 * Helper type guards for specific Zod v4 issue types
 * In v4, issue types have different structures than v3
 */
// isInvalidTypeIssue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isInvalidTypeIssue(issue: ZodIssue): issue is ZodIssue & {
  code: 'invalid_type'
  expected: string
  input: unknown
} {
  // 返回 `issue.code === 'invalid_type'`，作为共享工具这次计算的结果。
  return issue.code === 'invalid_type'
}

// isInvalidValueIssue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isInvalidValueIssue(issue: ZodIssue): issue is ZodIssue & {
  code: 'invalid_value'
  values: unknown[]
  input: unknown
} {
  // 返回 `issue.code === 'invalid_value'`，作为共享工具这次计算的结果。
  return issue.code === 'invalid_value'
}

// isUnrecognizedKeysIssue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isUnrecognizedKeysIssue(
  issue: ZodIssue,
): issue is ZodIssue & { code: 'unrecognized_keys'; keys: string[] } {
  // 返回 `issue.code === 'unrecognized_keys'`，作为共享工具这次计算的结果。
  return issue.code === 'unrecognized_keys'
}

// isTooSmallIssue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTooSmallIssue(issue: ZodIssue): issue is ZodIssue & {
  code: 'too_small'
  minimum: number | bigint
  origin: string
} {
  // 返回 `issue.code === 'too_small'`，作为共享工具这次计算的结果。
  return issue.code === 'too_small'
}

/** Field path in dot notation (e.g., "permissions.defaultMode", "env.DEBUG") */
// FieldPath 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FieldPath = string

// ValidationError 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ValidationError = {
  /** Relative file path */
  file?: string
  /** Field path in dot notation */
  path: FieldPath
  /** Human-readable error message */
  message: string
  /** Expected value or type */
  expected?: string
  /** The actual invalid value that was provided */
  invalidValue?: unknown
  /** Suggestion for fixing the error */
  suggestion?: string
  /** Link to relevant documentation */
  docLink?: string
  /** MCP-specific metadata - only present for MCP configuration errors */
  mcpErrorMetadata?: {
    /** Which configuration scope this error came from */
    scope: ConfigScope
    /** The server name if error is specific to a server */
    serverName?: string
    /** Severity of the error */
    severity?: 'fatal' | 'warning'
  }
}

// SettingsWithErrors 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SettingsWithErrors = {
  settings: SettingsJson
  errors: ValidationError[]
}

/**
 * Format a Zod validation error into human-readable validation errors
 */
/**
 * Get the type string for an unknown value (for error messages)
 */
// getReceivedType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getReceivedType(value: unknown): string {
  // 满足 `value === null` 时，共享工具执行该分支。
  if (value === null) return 'null'
  // 满足 `value === undefined` 时，共享工具执行该分支。
  if (value === undefined) return 'undefined'
  // 满足 `Array.isArray(value)` 时，共享工具执行该分支。
  if (Array.isArray(value)) return 'array'
  // 返回 `typeof value`，作为共享工具这次计算的结果。
  return typeof value
}

// extractReceivedFromMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractReceivedFromMessage(msg: string): string | undefined {
  // match匹配`msg.match`，供共享工具后续处理使用。
  const match = msg.match(/received (\w+)/)
  // 返回 `match ? match[1] : undefined`，作为共享工具这次计算的结果。
  return match ? match[1] : undefined
}

// formatZodError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatZodError(
  error: ZodError,
  filePath: string,
): ValidationError[] {
  // 返回 `error.issues.map((issue): ValidationError => {`，作为共享工具这次计算的结果。
  return error.issues.map((issue): ValidationError => {
    // 路径派生`path.map`，供共享工具后续处理使用。
    const path = issue.path.map(String).join('.')
    // 消息保存`issue.message`，供后续判断或组装使用。
    let message = issue.message
    // expected 先占位，稍后的条件分支会根据实际输入补齐它。
    let expected: string | undefined

    // enumValues 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let enumValues: string[] | undefined
    // expectedValue 先占位，稍后的条件分支会根据实际输入补齐它。
    let expectedValue: string | undefined
    // receivedValue 先占位，稍后的条件分支会根据实际输入补齐它。
    let receivedValue: unknown
    // invalidValue 先占位，稍后的条件分支会根据实际输入补齐它。
    let invalidValue: unknown

    // 满足 `isInvalidValueIssue(issue)` 时，共享工具执行该分支。
    if (isInvalidValueIssue(issue)) {
      // enumValues 集合更新为 `issue.values.map(v => String(v))`，确保共享工具后续读取最新状态。
      enumValues = issue.values.map(v => String(v))
      // expectedValue更新为 `enumValues.join(' | ')`，确保共享工具后续读取最新状态。
      expectedValue = enumValues.join(' | ')
      // receivedValue更新为 `undefined`，确保共享工具后续读取最新状态。
      receivedValue = undefined
      // invalidValue更新为 `undefined`，确保共享工具后续读取最新状态。
      invalidValue = undefined
    // 共享工具 validation在这里处理 `} else if (isInvalidTypeIssue(issue)) {`，完成这一小步状态转换。
    } else if (isInvalidTypeIssue(issue)) {
      // expectedValue更新为 `issue.expected`，确保共享工具后续读取最新状态。
      expectedValue = issue.expected
      // receivedType保存`extractReceivedFromMessage`，供共享工具后续处理使用。
      const receivedType = extractReceivedFromMessage(issue.message)
      // receivedValue更新为 `receivedType ?? getReceivedType(issue.input)`，确保共享工具后续读取最新状态。
      receivedValue = receivedType ?? getReceivedType(issue.input)
      // invalidValue更新为 `receivedType ?? getReceivedType(issue.input)`，确保共享工具后续读取最新状态。
      invalidValue = receivedType ?? getReceivedType(issue.input)
    // 共享工具 validation在这里处理 `} else if (isTooSmallIssue(issue)) {`，完成这一小步状态转换。
    } else if (isTooSmallIssue(issue)) {
      // expectedValue更新为 `String(issue.minimum)`，确保共享工具后续读取最新状态。
      expectedValue = String(issue.minimum)
    // 共享工具 validation在这里处理 `} else if (issue.code === 'custom' && 'params' in issue) {`，完成这一小步状态转换。
    } else if (issue.code === 'custom' && 'params' in issue) {
      // params 集合保存`issue.params as { received?: unknown }`，供共享工具 validation后续判断或输出使用。
      const params = issue.params as { received?: unknown }
      // receivedValue更新为 `params.received`，确保共享工具后续读取最新状态。
      receivedValue = params.received
      // invalidValue更新为 `receivedValue`，确保共享工具后续读取最新状态。
      invalidValue = receivedValue
    }

    // tip读取`getValidationTip`，供共享工具后续处理使用。
    const tip = getValidationTip({
      path,
      code: issue.code,
      expected: expectedValue,
      received: receivedValue,
      enumValues,
      message: issue.message,
      value: receivedValue,
    })

    // 满足 `isInvalidValueIssue(issue)` 时，共享工具执行该分支。
    if (isInvalidValueIssue(issue)) {
      // expected更新为 `enumValues?.map(v => `"${v}"`).join(', ')`，确保共享工具后续读取最新状态。
      expected = enumValues?.map(v => `"${v}"`).join(', ')
      // 消息更新为 ``Invalid value. Expected one of: ${expected}``，确保共享工具后续读取最新状态。
      message = `Invalid value. Expected one of: ${expected}`
    // 共享工具 validation在这里处理 `} else if (isInvalidTypeIssue(issue)) {`，完成这一小步状态转换。
    } else if (isInvalidTypeIssue(issue)) {
      // receivedType 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const receivedType =
        extractReceivedFromMessage(issue.message) ??
        getReceivedType(issue.input)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        issue.expected === 'object' &&
        receivedType === 'null' &&
        path === ''
      ) {
        // 消息更新为 `'Invalid or malformed JSON'`，确保共享工具后续读取最新状态。
        message = 'Invalid or malformed JSON'
      } else {
        // 消息更新为 ``Expected ${issue.expected}, but received ${receivedType}``，确保共享工具后续读取最新状态。
        message = `Expected ${issue.expected}, but received ${receivedType}`
      }
    // 共享工具 validation在这里处理 `} else if (isUnrecognizedKeysIssue(issue)) {`，完成这一小步状态转换。
    } else if (isUnrecognizedKeysIssue(issue)) {
      // keys 集合格式化`keys.join`，供共享工具后续处理使用。
      const keys = issue.keys.join(', ')
      // 消息更新为 ``Unrecognized ${plural(issue.keys.length, 'field')}: ${ke...`，确保共享工具后续读取最新状态。
      message = `Unrecognized ${plural(issue.keys.length, 'field')}: ${keys}`
    // 共享工具 validation在这里处理 `} else if (isTooSmallIssue(issue)) {`，完成这一小步状态转换。
    } else if (isTooSmallIssue(issue)) {
      // 消息更新为 ``Number must be greater than or equal to ${issue.minimum}``，确保共享工具后续读取最新状态。
      message = `Number must be greater than or equal to ${issue.minimum}`
      // expected更新为 `String(issue.minimum)`，确保共享工具后续读取最新状态。
      expected = String(issue.minimum)
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      file: filePath,
      path,
      message,
      expected,
      invalidValue,
      suggestion: tip?.suggestion,
      docLink: tip?.docLink,
    }
  })
}

/**
 * Validates that settings file content conforms to the SettingsSchema.
 * This is used during file edits to ensure the resulting file is valid.
 */
// validateSettingsFileContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateSettingsFileContent(content: string):
  | {
      isValid: true
    }
  | {
      isValid: false
      error: string
      fullSchema: string
    } {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Parse the JSON first
    // jsonData解析`jsonParse`，供共享工具后续处理使用。
    const jsonData = jsonParse(content)

    // Validate against SettingsSchema in strict mode
    // 结果保存`SettingsSchema`，供共享工具后续处理使用。
    const result = SettingsSchema().strict().safeParse(jsonData)

    // 满足 `result.success` 时，共享工具执行该分支。
    if (result.success) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { isValid: true }
    }

    // Format the validation error in a helpful way
    // 错误列表格式化`formatZodError`，供共享工具后续处理使用。
    const errors = formatZodError(result.error, 'settings')
    // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const errorMessage =
      'Settings validation failed:\n' +
      // 调用 errors.map，触发共享工具此处需要的副作用。
      errors.map(err => `- ${err.path}: ${err.message}`).join('\n')

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isValid: false,
      error: errorMessage,
      fullSchema: generateSettingsJSONSchema(),
    }
  } catch (parseError) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isValid: false,
      error: `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
      fullSchema: generateSettingsJSONSchema(),
    }
  }
}

/**
 * Filters invalid permission rules from raw parsed JSON data before schema validation.
 * This prevents one bad rule from poisoning the entire settings file.
 * Returns warnings for each filtered rule.
 */
// filterInvalidPermissionRules 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterInvalidPermissionRules(
  data: unknown,
  filePath: string,
): ValidationError[] {
  // `!data || typeof data` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!data || typeof data !== 'object') return []
  // obj保存`data as Record<string, unknown>`，供后续判断或组装使用。
  const obj = data as Record<string, unknown>
  // `!obj.permissions || typeof obj.permissions` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!obj.permissions || typeof obj.permissions !== 'object') return []
  // perms 集合 命名 `obj.permissions as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const perms = obj.permissions as Record<string, unknown>

  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: ValidationError[] = []
  // 按顺序遍历 `['allow', 'deny', 'ask']` 中的key，逐个交给共享工具处理。
  for (const key of ['allow', 'deny', 'ask']) {
    // rules 集合读取 `perms[key]` 对应条目，后续围绕该成员继续处理。
    const rules = perms[key]
    // 满足 `!Array.isArray(rules)` 时，共享工具执行该分支。
    if (!Array.isArray(rules)) continue

    // 这个回调绑定到 perms[key] = rules.filter(rule => {，负责共享工具在该局部场景下的响应。
    perms[key] = rules.filter(rule => {
      // `typeof rule` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof rule !== 'string') {
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          file: filePath,
          path: `permissions.${key}`,
          message: `Non-string value in ${key} array was removed`,
          invalidValue: rule,
        })
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 结果读取`validatePermissionRule`，供共享工具后续处理使用。
      const result = validatePermissionRule(rule)
      // result.valid缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!result.valid) {
        // 消息保存``Invalid permission rule "${rule}" was skipped``，作为后续固定文本处理的输入。
        let message = `Invalid permission rule "${rule}" was skipped`
        // 满足 `result.error` 时，共享工具执行该分支。
        if (result.error) message += `: ${result.error}`
        // 满足 `result.suggestion` 时，共享工具执行该分支。
        if (result.suggestion) message += `. ${result.suggestion}`
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          file: filePath,
          path: `permissions.${key}`,
          message,
          invalidValue: rule,
        })
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    })
  }
  // 返回 `warnings`，作为共享工具这次计算的结果。
  return warnings
}

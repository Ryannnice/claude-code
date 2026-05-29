// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  EnumSchema,
  MultiSelectEnumSchema,
  PrimitiveSchemaDefinition,
  StringSchema,
} from '@modelcontextprotocol/sdk/types.js'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 plural，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { plural } from '../stringUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  looksLikeISO8601,
  parseNaturalLanguageDateTime,
} from './dateTimeParser.js'

// ValidationResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ValidationResult = {
  value?: string | number | boolean
  isValid: boolean
  error?: string
}

// STRING_FORMATS 集合集中保存共享工具 elicitation Validation要一起传递的字段。
const STRING_FORMATS = {
  email: {
    description: 'email address',
    example: 'user@example.com',
  },
  uri: {
    description: 'URI',
    example: 'https://example.com',
  },
  date: {
    description: 'date',
    example: '2024-03-15',
  },
  'date-time': {
    description: 'date-time',
    example: '2024-03-15T14:30:00Z',
  },
}

/**
 * Check if schema is a single-select enum (either legacy `enum` format or new `oneOf` format)
 */
// isEnumSchema标记共享工具 elicitation Validation是否启用对应路径。
export const isEnumSchema = (
  schema: PrimitiveSchemaDefinition,
): schema is EnumSchema => {
  // 返回 `schema.type === 'string' && ('enum' in schema || 'oneOf' in schema)`，作为共享工具这次计算的结果。
  return schema.type === 'string' && ('enum' in schema || 'oneOf' in schema)
}

/**
 * Check if schema is a multi-select enum (`type: "array"` with `items.enum` or `items.anyOf`)
 */
// isMultiSelectEnumSchema 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMultiSelectEnumSchema(
  schema: PrimitiveSchemaDefinition,
): schema is MultiSelectEnumSchema {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    schema.type === 'array' &&
    'items' in schema &&
    typeof schema.items === 'object' &&
    schema.items !== null &&
    ('enum' in schema.items || 'anyOf' in schema.items)
  )
}

/**
 * Get values from a multi-select enum schema
 */
// getMultiSelectValues 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMultiSelectValues(schema: MultiSelectEnumSchema): string[] {
  // 满足 `'anyOf' in schema.items` 时，共享工具执行该分支。
  if ('anyOf' in schema.items) {
    // 返回 `schema.items.anyOf.map(item => item.const)`，作为共享工具这次计算的结果。
    return schema.items.anyOf.map(item => item.const)
  }
  // 满足 `'enum' in schema.items` 时，共享工具执行该分支。
  if ('enum' in schema.items) {
    // 返回 `schema.items.enum`，作为共享工具这次计算的结果。
    return schema.items.enum
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Get display labels from a multi-select enum schema
 */
// getMultiSelectLabels 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMultiSelectLabels(schema: MultiSelectEnumSchema): string[] {
  // 满足 `'anyOf' in schema.items` 时，共享工具执行该分支。
  if ('anyOf' in schema.items) {
    // 返回 `schema.items.anyOf.map(item => item.title)`，作为共享工具这次计算的结果。
    return schema.items.anyOf.map(item => item.title)
  }
  // 满足 `'enum' in schema.items` 时，共享工具执行该分支。
  if ('enum' in schema.items) {
    // 返回 `schema.items.enum`，作为共享工具这次计算的结果。
    return schema.items.enum
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Get label for a specific value in a multi-select enum
 */
// getMultiSelectLabel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMultiSelectLabel(
  schema: MultiSelectEnumSchema,
  value: string,
): string {
  // index 索引读取`getMultiSelectValues`，供共享工具后续处理使用。
  const index = getMultiSelectValues(schema).indexOf(value)
  // 返回 `index >= 0 ? (getMultiSelectLabels(schema)[index] ?? value) : value`，作为共享工具这次计算的结果。
  return index >= 0 ? (getMultiSelectLabels(schema)[index] ?? value) : value
}

/**
 * Get enum values from EnumSchema (handles both legacy `enum` and new `oneOf` formats)
 */
// getEnumValues 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEnumValues(schema: EnumSchema): string[] {
  // 满足 `'oneOf' in schema` 时，共享工具执行该分支。
  if ('oneOf' in schema) {
    // 返回 `schema.oneOf.map(item => item.const)`，作为共享工具这次计算的结果。
    return schema.oneOf.map(item => item.const)
  }
  // 满足 `'enum' in schema` 时，共享工具执行该分支。
  if ('enum' in schema) {
    // 返回 `schema.enum`，作为共享工具这次计算的结果。
    return schema.enum
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Get enum display labels from EnumSchema
 */
// getEnumLabels 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEnumLabels(schema: EnumSchema): string[] {
  // 满足 `'oneOf' in schema` 时，共享工具执行该分支。
  if ('oneOf' in schema) {
    // 返回 `schema.oneOf.map(item => item.title)`，作为共享工具这次计算的结果。
    return schema.oneOf.map(item => item.title)
  }
  // 满足 `'enum' in schema` 时，共享工具执行该分支。
  if ('enum' in schema) {
    // 返回 `('enumNames' in schema ? schema.enumNames : undefined) ?? schema.enum`，作为共享工具这次计算的结果。
    return ('enumNames' in schema ? schema.enumNames : undefined) ?? schema.enum
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Get label for a specific enum value
 */
// getEnumLabel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEnumLabel(schema: EnumSchema, value: string): string {
  // index 索引读取`getEnumValues`，供共享工具后续处理使用。
  const index = getEnumValues(schema).indexOf(value)
  // 返回 `index >= 0 ? (getEnumLabels(schema)[index] ?? value) : value`，作为共享工具这次计算的结果。
  return index >= 0 ? (getEnumLabels(schema)[index] ?? value) : value
}

// getZodSchema 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getZodSchema(schema: PrimitiveSchemaDefinition): z.ZodTypeAny {
  // 满足 `isEnumSchema(schema)` 时，共享工具执行该分支。
  if (isEnumSchema(schema)) {
    // 从 `getEnumValues(schema)` 按位置拆出 first、其余 rest，让共享工具 elicitation Validation分别处理这些返回值。
    const [first, ...rest] = getEnumValues(schema)
    // first缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!first) {
      // 返回 `z.never()`，作为共享工具这次计算的结果。
      return z.never()
    }
    // 返回 `z.enum([first, ...rest])`，作为共享工具这次计算的结果。
    return z.enum([first, ...rest])
  }
  // 当 `schema.type` 匹配 `'string'` 时，共享工具执行对应分支。
  if (schema.type === 'string') {
    // stringSchema保存`z.string`，供共享工具后续处理使用。
    let stringSchema = z.string()
    // `schema.minLength` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (schema.minLength !== undefined) {
      // stringSchema更新为 `stringSchema.min(schema.minLength, {`，确保共享工具后续读取最新状态。
      stringSchema = stringSchema.min(schema.minLength, {
        message: `Must be at least ${schema.minLength} ${plural(schema.minLength, 'character')}`,
      })
    }
    // `schema.maxLength` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (schema.maxLength !== undefined) {
      // stringSchema更新为 `stringSchema.max(schema.maxLength, {`，确保共享工具后续读取最新状态。
      stringSchema = stringSchema.max(schema.maxLength, {
        message: `Must be at most ${schema.maxLength} ${plural(schema.maxLength, 'character')}`,
      })
    }
    // 按照 schema.format 的取值选择共享工具的具体处理分支。
    switch (schema.format) {
      case 'email':
        // stringSchema更新为 `stringSchema.email({`，确保共享工具后续读取最新状态。
        stringSchema = stringSchema.email({
          message: 'Must be a valid email address, e.g. user@example.com',
        })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'uri':
        // stringSchema更新为 `stringSchema.url({`，确保共享工具后续读取最新状态。
        stringSchema = stringSchema.url({
          message: 'Must be a valid URI, e.g. https://example.com',
        })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'date':
        // stringSchema更新为 `stringSchema.date(`，确保共享工具后续读取最新状态。
        stringSchema = stringSchema.date(
          'Must be a valid date, e.g. 2024-03-15, today, next Monday',
        )
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'date-time':
        // stringSchema更新为 `stringSchema.datetime({`，确保共享工具后续读取最新状态。
        stringSchema = stringSchema.datetime({
          offset: true,
          message:
            'Must be a valid date-time, e.g. 2024-03-15T14:30:00Z, tomorrow at 3pm',
        })
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      default:
        // No specific format validation
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }
    // 返回 `stringSchema`，作为共享工具这次计算的结果。
    return stringSchema
  }
  // 只有 `schema.type === 'number' || schema.type === 'inte` 满足时，共享工具才执行该分支。
  if (schema.type === 'number' || schema.type === 'integer') {
    // typeLabel标记共享工具 elicitation Validation是否启用对应路径。
    const typeLabel = schema.type === 'integer' ? 'an integer' : 'a number'
    // isInteger标记共享工具 elicitation Validation是否启用对应路径。
    const isInteger = schema.type === 'integer'
    // formatNum封装成回调，供共享工具 elicitation Validation在事件触发或异步步骤中调用。
    const formatNum = (n: number) =>
      Number.isInteger(n) && !isInteger ? `${n}.0` : String(n)

    // Build a single descriptive error message for range violations
    // rangeMsg 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const rangeMsg =
      schema.minimum !== undefined && schema.maximum !== undefined
        ? `Must be ${typeLabel} between ${formatNum(schema.minimum)} and ${formatNum(schema.maximum)}`
        : schema.minimum !== undefined
          ? `Must be ${typeLabel} >= ${formatNum(schema.minimum)}`
          : schema.maximum !== undefined
            ? `Must be ${typeLabel} <= ${formatNum(schema.maximum)}`
            : `Must be ${typeLabel}`

    // numberSchema保存`coerce.number`，供共享工具后续处理使用。
    let numberSchema = z.coerce.number({
      error: rangeMsg,
    })
    // 当 `schema.type` 匹配 `'integer'` 时，共享工具执行对应分支。
    if (schema.type === 'integer') {
      // numberSchema更新为 `numberSchema.int({ message: rangeMsg })`，确保共享工具后续读取最新状态。
      numberSchema = numberSchema.int({ message: rangeMsg })
    }
    // `schema.minimum` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (schema.minimum !== undefined) {
      // numberSchema更新为 `numberSchema.min(schema.minimum, {`，确保共享工具后续读取最新状态。
      numberSchema = numberSchema.min(schema.minimum, {
        message: rangeMsg,
      })
    }
    // `schema.maximum` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (schema.maximum !== undefined) {
      // numberSchema更新为 `numberSchema.max(schema.maximum, {`，确保共享工具后续读取最新状态。
      numberSchema = numberSchema.max(schema.maximum, {
        message: rangeMsg,
      })
    }
    // 返回 `numberSchema`，作为共享工具这次计算的结果。
    return numberSchema
  }
  // 当 `schema.type` 匹配 `'boolean'` 时，共享工具执行对应分支。
  if (schema.type === 'boolean') {
    // 返回 `z.coerce.boolean()`，作为共享工具这次计算的结果。
    return z.coerce.boolean()
  }

  // 抛出 new Error(`Unsupported schema: ${jsonStringify(schema)}`)，阻止共享工具在无效状态下继续运行。
  throw new Error(`Unsupported schema: ${jsonStringify(schema)}`)
}

// validateElicitationInput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateElicitationInput(
  stringValue: string,
  schema: PrimitiveSchemaDefinition,
): ValidationResult {
  // zodSchema读取`getZodSchema`，供共享工具后续处理使用。
  const zodSchema = getZodSchema(schema)
  // parseResult保存`zodSchema.safeParse`，供共享工具后续处理使用。
  const parseResult = zodSchema.safeParse(stringValue)

  // 满足 `parseResult.success` 时，共享工具执行该分支。
  if (parseResult.success) {
    // zodSchema always produces primitive types for elicitation
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      value: parseResult.data as string | number | boolean,
      isValid: true,
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    isValid: false,
    // 这个回调绑定到 error: parseResult.error.issues.map(e => e.message).join('; '),，负责共享工具在该局部场景下的响应。
    error: parseResult.error.issues.map(e => e.message).join('; '),
  }
}

// hasStringFormat标记共享工具 elicitation Validation是否启用对应路径。
const hasStringFormat = (
  schema: PrimitiveSchemaDefinition,
): schema is StringSchema & { format: string } => {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    schema.type === 'string' &&
    'format' in schema &&
    typeof schema.format === 'string'
  )
}

/**
 * Returns a helpful placeholder/hint for a given format
 */
// getFormatHint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFormatHint(
  schema: PrimitiveSchemaDefinition,
): string | undefined {
  // 当 `schema.type` 匹配 `'string'` 时，共享工具执行对应分支。
  if (schema.type === 'string') {
    // 满足 `!hasStringFormat(schema)` 时，共享工具执行该分支。
    if (!hasStringFormat(schema)) {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }

    // 从 `STRING_FORMATS[schema.format] || {}` 解构 description、example，减少共享工具 elicitation Validation对同一对象的重复访问。
    const { description, example } = STRING_FORMATS[schema.format] || {}
    // 返回 ``${description}, e.g. ${example}``，作为共享工具这次计算的结果。
    return `${description}, e.g. ${example}`
  }

  // 只有 `schema.type === 'number' || schema.type === 'inte` 满足时，共享工具才执行该分支。
  if (schema.type === 'number' || schema.type === 'integer') {
    // isInteger标记共享工具 elicitation Validation是否启用对应路径。
    const isInteger = schema.type === 'integer'
    // formatNum封装成回调，供共享工具 elicitation Validation在事件触发或异步步骤中调用。
    const formatNum = (n: number) =>
      Number.isInteger(n) && !isInteger ? `${n}.0` : String(n)

    // `schema.minimum` 与 `undefined && schema.maximum !=` 不一致时刷新派生状态，避免使用过期结果。
    if (schema.minimum !== undefined && schema.maximum !== undefined) {
      // 返回 ``(${schema.type} between ${formatNum(schema.minimum!)} and ${formatNum(...`，作为共享工具这次计算的结果。
      return `(${schema.type} between ${formatNum(schema.minimum!)} and ${formatNum(schema.maximum!)})`
    // 共享工具 elicitation Validation在这里处理 `} else if (schema.minimum !== undefined) {`，完成这一小步状态转换。
    } else if (schema.minimum !== undefined) {
      // 返回 ``(${schema.type} >= ${formatNum(schema.minimum!)})``，作为共享工具这次计算的结果。
      return `(${schema.type} >= ${formatNum(schema.minimum!)})`
    // 共享工具 elicitation Validation在这里处理 `} else if (schema.maximum !== undefined) {`，完成这一小步状态转换。
    } else if (schema.maximum !== undefined) {
      // 返回 ``(${schema.type} <= ${formatNum(schema.maximum!)})``，作为共享工具这次计算的结果。
      return `(${schema.type} <= ${formatNum(schema.maximum!)})`
    } else {
      // example标记共享工具 elicitation Validation是否启用对应路径。
      const example = schema.type === 'integer' ? '42' : '3.14'
      // 返回 ``(${schema.type}, e.g. ${example})``，作为共享工具这次计算的结果。
      return `(${schema.type}, e.g. ${example})`
    }
  }

  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Check if a schema is a date or date-time format that supports NL parsing
 */
// isDateTimeSchema 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDateTimeSchema(
  schema: PrimitiveSchemaDefinition,
): schema is StringSchema & { format: 'date' | 'date-time' } {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    schema.type === 'string' &&
    'format' in schema &&
    (schema.format === 'date' || schema.format === 'date-time')
  )
}

/**
 * Async validation that attempts NL date/time parsing via Haiku
 * when the input doesn't look like ISO 8601.
 */
// validateElicitationInputAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateElicitationInputAsync(
  stringValue: string,
  schema: PrimitiveSchemaDefinition,
  signal: AbortSignal,
): Promise<ValidationResult> {
  // syncResult读取`validateElicitationInput`，供共享工具后续处理使用。
  const syncResult = validateElicitationInput(stringValue, schema)
  // 满足 `syncResult.isValid` 时，共享工具执行该分支。
  if (syncResult.isValid) {
    // 返回 `syncResult`，作为共享工具这次计算的结果。
    return syncResult
  }

  // 只有 `isDateTimeSchema(schema) && !looksLikeISO8601(stringValue)` 满足时，共享工具才执行该分支。
  if (isDateTimeSchema(schema) && !looksLikeISO8601(stringValue)) {
    // parseResult解析`parseNaturalLanguageDateTime`，供共享工具后续处理使用。
    const parseResult = await parseNaturalLanguageDateTime(
      stringValue,
      schema.format,
      signal,
    )

    // 满足 `parseResult.success` 时，共享工具执行该分支。
    if (parseResult.success) {
      // validatedParsed读取`validateElicitationInput`，供共享工具后续处理使用。
      const validatedParsed = validateElicitationInput(
        parseResult.value,
        schema,
      )
      // 满足 `validatedParsed.isValid` 时，共享工具执行该分支。
      if (validatedParsed.isValid) {
        // 返回 `validatedParsed`，作为共享工具这次计算的结果。
        return validatedParsed
      }
    }
  }

  // 返回 `syncResult`，作为共享工具这次计算的结果。
  return syncResult
}

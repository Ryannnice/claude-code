// 类型依赖 { ZodError } 来自 zod/v4，用于校准共享工具的数据契约。
import type { ZodError } from 'zod/v4'
// 引入 AbortError、ShellError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { AbortError, ShellError } from './errors.js'
// 引入 INTERRUPT_MESSAGE_FOR_TOOL_USE，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { INTERRUPT_MESSAGE_FOR_TOOL_USE } from './messages.js'

// formatError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatError(error: unknown): string {
  // 满足 `error instanceof AbortError` 时，共享工具执行该分支。
  if (error instanceof AbortError) {
    // 返回 `error.message || INTERRUPT_MESSAGE_FOR_TOOL_USE`，作为共享工具这次计算的结果。
    return error.message || INTERRUPT_MESSAGE_FOR_TOOL_USE
  }
  // 满足 `!(error instanceof Error)` 时，共享工具执行该分支。
  if (!(error instanceof Error)) {
    // 返回 `String(error)`，作为共享工具这次计算的结果。
    return String(error)
  }
  // 片段列表读取`getErrorParts`，供共享工具后续处理使用。
  const parts = getErrorParts(error)
  // fullMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const fullMessage =
    parts.filter(Boolean).join('\n').trim() || 'Command failed with no output'
  // 满足 `fullMessage.length <= 10000` 时，共享工具执行该分支。
  if (fullMessage.length <= 10000) {
    // 返回 `fullMessage`，作为共享工具这次计算的结果。
    return fullMessage
  }
  // halfLength 数量保存`5000`，供后续判断或组装使用。
  const halfLength = 5000
  // start格式化`fullMessage.slice`，供共享工具后续处理使用。
  const start = fullMessage.slice(0, halfLength)
  // end格式化`fullMessage.slice`，供共享工具后续处理使用。
  const end = fullMessage.slice(-halfLength)
  // 返回 ``${start}\n\n... [${fullMessage.length - 10000} characters truncated] ....`，作为共享工具这次计算的结果。
  return `${start}\n\n... [${fullMessage.length - 10000} characters truncated] ...\n\n${end}`
}

// getErrorParts 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getErrorParts(error: Error): string[] {
  // 满足 `error instanceof ShellError` 时，共享工具执行该分支。
  if (error instanceof ShellError) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [
      `Exit code ${error.code}`,
      error.interrupted ? INTERRUPT_MESSAGE_FOR_TOOL_USE : '',
      error.stderr,
      error.stdout,
    ]
  }
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts = [error.message]
  // 只有 `'stderr' in error && typeof error.stderr === 'str` 满足时，共享工具才执行该分支。
  if ('stderr' in error && typeof error.stderr === 'string') {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(error.stderr)
  }
  // 只有 `'stdout' in error && typeof error.stdout === 'str` 满足时，共享工具才执行该分支。
  if ('stdout' in error && typeof error.stdout === 'string') {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(error.stdout)
  }
  // 返回 `parts`，作为共享工具这次计算的结果。
  return parts
}

/**
 * Formats a Zod validation path into a readable string
 * e.g., ['todos', 0, 'activeForm'] => 'todos[0].activeForm'
 */
// formatValidationPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatValidationPath(path: PropertyKey[]): string {
  // 路径为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (path.length === 0) return ''

  // 返回 `path.reduce((acc, segment, index) => {`，作为共享工具这次计算的结果。
  return path.reduce((acc, segment, index) => {
    // segmentStr保存`String`，供共享工具后续处理使用。
    const segmentStr = String(segment)
    // 当 `typeof segment` 匹配 `'number'` 时，共享工具执行对应分支。
    if (typeof segment === 'number') {
      // 返回 ``${String(acc)}[${segmentStr}]``，作为共享工具这次计算的结果。
      return `${String(acc)}[${segmentStr}]`
    }
    // 返回 `index === 0 ? segmentStr : `${String(acc)}.${segmentStr}``，作为共享工具这次计算的结果。
    return index === 0 ? segmentStr : `${String(acc)}.${segmentStr}`
  }, '') as string
}

/**
 * Converts Zod validation errors into a human-readable and LLM friendly error message
 *
 * @param toolName The name of the tool that failed validation
 * @param error The Zod error object
 * @returns A formatted error message string
 */
// formatZodValidationError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatZodValidationError(
  toolName: string,
  error: ZodError,
): string {
  // missingParams 集合保存`error.issues`，供后续判断或组装使用。
  const missingParams = error.issues
    .filter(
      // err更新为 `>`，确保共享工具后续读取最新状态。
      err =>
        err.code === 'invalid_type' &&
        err.message.includes('received undefined'),
    )
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(err => formatValidationPath(err.path))

  // unexpectedParams 集合 命名 `error.issues`，让后续代码直接表达这个值的用途。
  const unexpectedParams = error.issues
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(err => err.code === 'unrecognized_keys')
    // 链式调用 flatMap，继续加工上一行在共享工具中产生的数据。
    .flatMap(err => err.keys)

  // typeMismatchParams 集合保存`error.issues`，供共享工具 tool Errors后续判断或输出使用。
  const typeMismatchParams = error.issues
    .filter(
      // err更新为 `>`，确保共享工具后续读取最新状态。
      err =>
        err.code === 'invalid_type' &&
        !err.message.includes('received undefined'),
    )
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(err => {
      // typeErr 命名 `err as { expected: string }`，让后续代码直接表达这个值的用途。
      const typeErr = err as { expected: string }
      // receivedMatch匹配`message.match`，供共享工具后续处理使用。
      const receivedMatch = err.message.match(/received (\w+)/)
      // received保存`receivedMatch ? receivedMatch[1] : 'unknown'`，供共享工具 tool Errors后续判断或输出使用。
      const received = receivedMatch ? receivedMatch[1] : 'unknown'
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        param: formatValidationPath(err.path),
        expected: typeErr.expected,
        received,
      }
    })

  // Default to original error message if we can't create a better one
  // errorContent 错误信息保存`error.message`，供共享工具 tool Errors后续判断或输出使用。
  let errorContent = error.message

  // Build a human-readable error message
  // errorParts 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errorParts = []

  // 满足 `missingParams.length > 0` 时，共享工具执行该分支。
  if (missingParams.length > 0) {
    // missingParamErrors 错误信息派生`missingParams.map`，供共享工具后续处理使用。
    const missingParamErrors = missingParams.map(
      // param更新为 `> `The required parameter \`${param}\` is missing``，确保共享工具后续读取最新状态。
      param => `The required parameter \`${param}\` is missing`,
    )
    // errorParts 错误信息追加新条目，保持收集顺序与输入顺序一致。
    errorParts.push(...missingParamErrors)
  }

  // 满足 `unexpectedParams.length > 0` 时，共享工具执行该分支。
  if (unexpectedParams.length > 0) {
    // unexpectedParamErrors 错误信息派生`unexpectedParams.map`，供共享工具后续处理使用。
    const unexpectedParamErrors = unexpectedParams.map(
      // param更新为 `> `An unexpected parameter \`${param}\` was provided``，确保共享工具后续读取最新状态。
      param => `An unexpected parameter \`${param}\` was provided`,
    )
    // errorParts 错误信息追加新条目，保持收集顺序与输入顺序一致。
    errorParts.push(...unexpectedParamErrors)
  }

  // 满足 `typeMismatchParams.length > 0` 时，共享工具执行该分支。
  if (typeMismatchParams.length > 0) {
    // typeErrors 错误信息派生`typeMismatchParams.map`，供共享工具后续处理使用。
    const typeErrors = typeMismatchParams.map(
      // 这个回调绑定到 ({ param, expected, received }) =>，负责共享工具在该局部场景下的响应。
      ({ param, expected, received }) =>
        `The parameter \`${param}\` type is expected as \`${expected}\` but provided as \`${received}\``,
    )
    // errorParts 错误信息追加新条目，保持收集顺序与输入顺序一致。
    errorParts.push(...typeErrors)
  }

  // 满足 `errorParts.length > 0` 时，共享工具执行该分支。
  if (errorParts.length > 0) {
    // errorContent 错误信息更新为 ``${toolName} failed due to the following ${errorParts.len...`，确保共享工具后续读取最新状态。
    errorContent = `${toolName} failed due to the following ${errorParts.length > 1 ? 'issues' : 'issue'}:\n${errorParts.join('\n')}`
  }

  // 返回 `errorContent`，作为共享工具这次计算的结果。
  return errorContent
}

// 引入 validateBoundedIntEnvVar，将 ../envValidation.js 中已经封装好的能力接到本文件流程里。
import { validateBoundedIntEnvVar } from '../envValidation.js'
// 引入 getTaskOutputPath，将 ./diskOutput.js 中已经封装好的能力接到本文件流程里。
import { getTaskOutputPath } from './diskOutput.js'

// TASK_MAX_OUTPUT_UPPER_LIMIT保存`160_000`，供后续判断或组装使用。
export const TASK_MAX_OUTPUT_UPPER_LIMIT = 160_000
// TASK_MAX_OUTPUT_DEFAULT保存`32_000`，供共享工具 output Formatting后续判断或输出使用。
export const TASK_MAX_OUTPUT_DEFAULT = 32_000

// getMaxTaskOutputLength 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxTaskOutputLength(): number {
  // 结果读取`validateBoundedIntEnvVar`，供共享工具后续处理使用。
  const result = validateBoundedIntEnvVar(
    'TASK_MAX_OUTPUT_LENGTH',
    process.env.TASK_MAX_OUTPUT_LENGTH,
    TASK_MAX_OUTPUT_DEFAULT,
    TASK_MAX_OUTPUT_UPPER_LIMIT,
  )
  // 返回 `result.effective`，作为共享工具这次计算的结果。
  return result.effective
}

/**
 * Format task output for API consumption, truncating if too large.
 * When truncated, includes a header with the file path and returns
 * the last N characters that fit within the limit.
 */
// formatTaskOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatTaskOutput(
  output: string,
  taskId: string,
): { content: string; wasTruncated: boolean } {
  // maxLen读取`getMaxTaskOutputLength`，供共享工具后续处理使用。
  const maxLen = getMaxTaskOutputLength()

  // 满足 `output.length <= maxLen` 时，共享工具执行该分支。
  if (output.length <= maxLen) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content: output, wasTruncated: false }
  }

  // 文件路径读取`getTaskOutputPath`，供共享工具后续处理使用。
  const filePath = getTaskOutputPath(taskId)
  // header读取 ``[Truncated. Full output: ${filePath}]\n\n`` 对应条目，后续围绕该成员继续处理。
  const header = `[Truncated. Full output: ${filePath}]\n\n`
  // availableSpace记录 `maxLen - header.length` 是否成立，下一步按该结果分支。
  const availableSpace = maxLen - header.length
  // truncated格式化`output.slice`，供共享工具后续处理使用。
  const truncated = output.slice(-availableSpace)

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { content: header + truncated, wasTruncated: true }
}

// 引入 validateBoundedIntEnvVar，将 ../envValidation.js 中已经封装好的能力接到本文件流程里。
import { validateBoundedIntEnvVar } from '../envValidation.js'

// BASH_MAX_OUTPUT_UPPER_LIMIT保存`150_000`，供共享工具 output Limits后续判断或输出使用。
export const BASH_MAX_OUTPUT_UPPER_LIMIT = 150_000
// BASH_MAX_OUTPUT_DEFAULT保存`30_000`，供后续判断或组装使用。
export const BASH_MAX_OUTPUT_DEFAULT = 30_000

// getMaxOutputLength 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxOutputLength(): number {
  // 结果读取`validateBoundedIntEnvVar`，供共享工具后续处理使用。
  const result = validateBoundedIntEnvVar(
    'BASH_MAX_OUTPUT_LENGTH',
    process.env.BASH_MAX_OUTPUT_LENGTH,
    BASH_MAX_OUTPUT_DEFAULT,
    BASH_MAX_OUTPUT_UPPER_LIMIT,
  )
  // 返回 `result.effective`，作为共享工具这次计算的结果。
  return result.effective
}

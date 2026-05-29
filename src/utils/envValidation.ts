// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'

// EnvVarValidationResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvVarValidationResult = {
  effective: number
  status: 'valid' | 'capped' | 'invalid'
  message?: string
}

// validateBoundedIntEnvVar 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateBoundedIntEnvVar(
  name: string,
  value: string | undefined,
  defaultValue: number,
  upperLimit: number,
): EnvVarValidationResult {
  // 取值缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!value) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { effective: defaultValue, status: 'valid' }
  }
  // 解析结果解析`parseInt`，供共享工具后续处理使用。
  const parsed = parseInt(value, 10)
  // 只有 `isNaN(parsed) || parsed <= 0` 满足时，共享工具才执行该分支。
  if (isNaN(parsed) || parsed <= 0) {
    // 结果 集中保存共享工具 env Validation要一起传递的字段。
    const result: EnvVarValidationResult = {
      effective: defaultValue,
      status: 'invalid',
      message: `Invalid value "${value}" (using default: ${defaultValue})`,
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`${name} ${result.message}`)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }
  // 满足 `parsed > upperLimit` 时，共享工具执行该分支。
  if (parsed > upperLimit) {
    // 结果 集中保存共享工具 env Validation要一起传递的字段。
    const result: EnvVarValidationResult = {
      effective: upperLimit,
      status: 'capped',
      message: `Capped from ${parsed} to ${upperLimit}`,
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`${name} ${result.message}`)
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { effective: parsed, status: 'valid' }
}

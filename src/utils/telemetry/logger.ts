// 类型依赖 { DiagLogger } 来自 @opentelemetry/api，用于校准共享工具的数据契约。
import type { DiagLogger } from '@opentelemetry/api'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// ClaudeCodeDiagLogger 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ClaudeCodeDiagLogger implements DiagLogger {
  // error 使用 message: string, ..._: unknown[] 完成共享工具里的对应操作。
  error(message: string, ..._: unknown[]) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(message))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[3P telemetry] OTEL diag error: ${message}`, {
      level: 'error',
    })
  }
  // warn 使用 message: string, ..._: unknown[] 完成共享工具里的对应操作。
  warn(message: string, ..._: unknown[]) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(new Error(message))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[3P telemetry] OTEL diag warn: ${message}`, {
      level: 'warn',
    })
  }
  // info 使用 _message: string, ..._args: unknown[] 完成共享工具里的对应操作。
  info(_message: string, ..._args: unknown[]) {
    // 共享工具 logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // debug 使用 _message: string, ..._args: unknown[] 完成共享工具里的对应操作。
  debug(_message: string, ..._args: unknown[]) {
    // 共享工具 logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // verbose 使用 _message: string, ..._args: unknown[] 完成共享工具里的对应操作。
  verbose(_message: string, ..._args: unknown[]) {
    // 共享工具 logger在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
}

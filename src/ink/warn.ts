// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'

// ifNotInteger 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ifNotInteger(value: number | undefined, name: string): void {
  // 满足 `value === undefined` 时，终端渲染执行该分支。
  if (value === undefined) return
  // 满足 `Number.isInteger(value)` 时，终端渲染执行该分支。
  if (Number.isInteger(value)) return
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`${name} should be an integer, got ${value}`, {
    level: 'warn',
  })
}

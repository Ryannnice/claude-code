// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { WriteFileOptions } 来自 fs，用于校准共享工具的数据契约。
import type { WriteFileOptions } from 'fs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  closeSync,
  writeFileSync as fsWriteFileSync,
  fsyncSync,
  openSync,
} from 'fs'
// biome-ignore lint: This file IS the cloneDeep wrapper - it must import the original
// 引入 lodashCloneDeep，将 lodash-es/cloneDeep.js 中已经封装好的能力接到本文件流程里。
import lodashCloneDeep from 'lodash-es/cloneDeep.js'
// 引入 addSlowOperation，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { addSlowOperation } from '../bootstrap/state.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'

// Extended WriteFileOptions to include 'flush' which is available in Node.js 20.1.0+
// but not yet in @types/node
// WriteFileOptionsWithFlush 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type WriteFileOptionsWithFlush =
  | WriteFileOptions
  | (WriteFileOptions & { flush?: boolean })

// --- Slow operation logging infrastructure ---

/**
 * Threshold in milliseconds for logging slow JSON/clone operations.
 * Operations taking longer than this will be logged for debugging.
 * - Override: set CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS to a number
 * - Dev builds: 20ms (lower threshold for development)
 * - Ants: 300ms (enabled for all internal users)
 */
// SLOW_OPERATION_THRESHOLD_MS 集合封装成回调，供共享工具 slow Operations在事件触发或异步步骤中调用。
const SLOW_OPERATION_THRESHOLD_MS = (() => {
  // envValue 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envValue = process.env.CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS
  // `envValue` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (envValue !== undefined) {
    // 解析结果保存`Number`，供共享工具后续处理使用。
    const parsed = Number(envValue)
    // 只有 `!Number.isNaN(parsed) && parsed >= 0` 满足时，共享工具才执行该分支。
    if (!Number.isNaN(parsed) && parsed >= 0) {
      // 返回 `parsed`，作为共享工具这次计算的结果。
      return parsed
    }
  }
  // 当 `process.env.NODE_ENV` 匹配 `'development'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'development') {
    // 返回 `20`，作为共享工具这次计算的结果。
    return 20
  }
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 返回 `300`，作为共享工具这次计算的结果。
    return 300
  }
  // 返回 `Infinity`，作为共享工具这次计算的结果。
  return Infinity
})()

// Re-export for callers that still need the threshold value directly
// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { SLOW_OPERATION_THRESHOLD_MS }

// Module-level re-entrancy guard. logForDebugging writes to a debug file via
// appendFileSync, which goes through slowLogging again. Without this guard,
// a slow appendFileSync → dispose → logForDebugging → appendFileSync → dispose → ...
// isLogging标记共享工具 slow Operations是否启用对应路径。
let isLogging = false

/**
 * Extract the first stack frame outside this file, so the DevBar warning
 * points at the actual caller instead of a useless `Object{N keys}`.
 * Only called when an operation was actually slow — never on the fast path.
 */
// callerFrame 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function callerFrame(stack: string | undefined): string {
  // stack缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!stack) return ''
  // 逐项读取 `stack.split('\n')` 中的line，按输入顺序推进共享工具。
  for (const line of stack.split('\n')) {
    // 满足 `line.includes('slowOperations')` 时，共享工具执行该分支。
    if (line.includes('slowOperations')) continue
    // m匹配`line.match`，供共享工具后续处理使用。
    const m = line.match(/([^/\\]+?):(\d+):\d+\)?$/)
    // 满足 `m` 时，共享工具执行该分支。
    if (m) return ` @ ${m[1]}:${m[2]}`
  }
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return ''
}

/**
 * Builds a human-readable description from tagged template arguments.
 * Only called when an operation was actually slow — never on the fast path.
 *
 * args[0] = TemplateStringsArray, args[1..n] = interpolated values
 */
// buildDescription 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildDescription(args: IArguments): string {
  // strings 集合 命名 `args[0] as TemplateStringsArray`，让后续代码直接表达这个值的用途。
  const strings = args[0] as TemplateStringsArray
  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = ''
  // 按索引扫描 `strings.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < strings.length; i++) {
    // 共享工具 slow Operations在这里处理 `result += strings[i]`，完成这一小步状态转换。
    result += strings[i]
    // 满足 `i + 1 < args.length` 时，共享工具执行该分支。
    if (i + 1 < args.length) {
      // v 命名 `args[i + 1]`，让后续代码直接表达这个值的用途。
      const v = args[i + 1]
      // 满足 `Array.isArray(v)` 时，共享工具执行该分支。
      if (Array.isArray(v)) {
        // 共享工具 slow Operations在这里处理 `result += `Array[${(v as unknown[]).length}]``，完成这一小步状态转换。
        result += `Array[${(v as unknown[]).length}]`
      // 共享工具 slow Operations在这里处理 `} else if (v !== null && typeof v === 'object') {`，完成这一小步状态转换。
      } else if (v !== null && typeof v === 'object') {
        // 共享工具 slow Operations在这里处理 `result += `Object{${Object.keys(v as Record<string, unknown>).length} k...`，完成这一小步状态转换。
        result += `Object{${Object.keys(v as Record<string, unknown>).length} keys}`
      // 共享工具 slow Operations在这里处理 `} else if (typeof v === 'string') {`，完成这一小步状态转换。
      } else if (typeof v === 'string') {
        // 共享工具 slow Operations在这里处理 `result += v.length > 80 ? `${v.slice(0, 80)}…` : v`，完成这一小步状态转换。
        result += v.length > 80 ? `${v.slice(0, 80)}…` : v
      } else {
        // 共享工具 slow Operations在这里处理 `result += String(v)`，完成这一小步状态转换。
        result += String(v)
      }
    }
  }
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// AntSlowLogger 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class AntSlowLogger {
  startTime: number
  args: IArguments
  err: Error

  // 构造函数接收 args: IArguments，把外部输入整理成实例可复用的内部状态。
  constructor(args: IArguments) {
    // 更新实例字段 startTime 为 performance.now()，同步共享工具的内部状态。
    this.startTime = performance.now()
    // 更新实例字段 args 为 args，同步共享工具的内部状态。
    this.args = args
    // V8/JSC capture the stack at construction but defer the expensive string
    // formatting until .stack is read — so this stays off the fast path.
    // 更新实例字段 err 为 new Error()，同步共享工具的内部状态。
    this.err = new Error()
  }

  // 共享工具 slow Operations在这里处理 `[Symbol.dispose](): void {`，完成这一小步状态转换。
  [Symbol.dispose](): void {
    // duration记录时间`performance.now`，供共享工具后续处理使用。
    const duration = performance.now() - this.startTime
    // 只有 `duration > SLOW_OPERATION_THRESHOLD_MS && !isLogg` 满足时，共享工具才执行该分支。
    if (duration > SLOW_OPERATION_THRESHOLD_MS && !isLogging) {
      // isLogging更新为 `true`，确保共享工具后续读取最新状态。
      isLogging = true
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // description 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const description =
          buildDescription(this.args) + callerFrame(this.err.stack)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SLOW OPERATION DETECTED] ${description} (${duration.toFixed(1)}ms)`,
        )
        // 调用 addSlowOperation，触发共享工具此处需要的副作用。
        addSlowOperation(description, duration)
      } finally {
        // isLogging更新为 `false`，确保共享工具后续读取最新状态。
        isLogging = false
      }
    }
  }
}

// NOOP_LOGGER 集中保存共享工具 slow Operations要一起传递的字段。
const NOOP_LOGGER: Disposable = { [Symbol.dispose]() {} }

// Must be regular functions (not arrows) to access `arguments`
// slowLoggingAnt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function slowLoggingAnt(
  _strings: TemplateStringsArray,
  ..._values: unknown[]
): AntSlowLogger {
  // eslint-disable-next-line prefer-rest-params
  // 返回 `new AntSlowLogger(arguments)`，作为共享工具这次计算的结果。
  return new AntSlowLogger(arguments)
}

// slowLoggingExternal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function slowLoggingExternal(): Disposable {
  // 返回 `NOOP_LOGGER`，作为共享工具这次计算的结果。
  return NOOP_LOGGER
}

/**
 * Tagged template for slow operation logging.
 *
 * In ANT builds: creates an AntSlowLogger that times the operation and logs
 * if it exceeds the threshold. Description is built lazily only when slow.
 *
 * In external builds: returns a singleton no-op disposable. Zero allocations,
 * zero timing. AntSlowLogger and buildDescription are dead-code-eliminated.
 *
 * @example
 * using _ = slowLogging`structuredClone(${value})`
 * const result = structuredClone(value)
 */
// slowLogging 先占位，稍后的条件分支会根据实际输入补齐它。
export const slowLogging: {
  // 共享工具 slow Operations在这里处理 `(strings: TemplateStringsArray, ...values: unknown[]): Disposable`，完成这一小步状态转换。
  (strings: TemplateStringsArray, ...values: unknown[]): Disposable
} = feature('SLOW_OPERATION_LOGGING') ? slowLoggingAnt : slowLoggingExternal

// --- Wrapped operations ---

/**
 * Wrapped JSON.stringify with slow operation logging.
 * Use this instead of JSON.stringify directly to detect performance issues.
 *
 * @example
 * import { jsonStringify } from './slowOperations.js'
 * const json = jsonStringify(data)
 * const prettyJson = jsonStringify(data, null, 2)
 */
// jsonStringify 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function jsonStringify(
  value: unknown,
  replacer?: (this: unknown, key: string, value: unknown) => unknown,
  space?: string | number,
): string
// jsonStringify 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function jsonStringify(
  value: unknown,
  replacer?: (number | string)[] | null,
  space?: string | number,
): string
// jsonStringify 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function jsonStringify(
  value: unknown,
  replacer?:
    | ((this: unknown, key: string, value: unknown) => unknown)
    | (number | string)[]
    | null,
  space?: string | number,
): string {
  // 共享工具 slow Operations在这里处理 `using _ = slowLogging`JSON.stringify(${value})``，完成这一小步状态转换。
  using _ = slowLogging`JSON.stringify(${value})`
  // 返回 `JSON.stringify(`，作为共享工具这次计算的结果。
  return JSON.stringify(
    value,
    replacer as Parameters<typeof JSON.stringify>[1],
    space,
  )
}

/**
 * Wrapped JSON.parse with slow operation logging.
 * Use this instead of JSON.parse directly to detect performance issues.
 *
 * @example
 * import { jsonParse } from './slowOperations.js'
 * const data = jsonParse(jsonString)
 */
// 这个回调绑定到 export const jsonParse: typeof JSON.parse = (text, reviver) => {，负责共享工具在该局部场景下的响应。
export const jsonParse: typeof JSON.parse = (text, reviver) => {
  // 共享工具 slow Operations在这里处理 `using _ = slowLogging`JSON.parse(${text})``，完成这一小步状态转换。
  using _ = slowLogging`JSON.parse(${text})`
  // V8 de-opts JSON.parse when a second argument is passed, even if undefined.
  // Branch explicitly so the common (no-reviver) path stays on the fast path.
  // 返回 `typeof reviver === 'undefined'`，作为共享工具这次计算的结果。
  return typeof reviver === 'undefined'
    ? JSON.parse(text)
    : JSON.parse(text, reviver)
}

/**
 * Wrapped structuredClone with slow operation logging.
 * Use this instead of structuredClone directly to detect performance issues.
 *
 * @example
 * import { clone } from './slowOperations.js'
 * const copy = clone(originalObject)
 */
// clone 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clone<T>(value: T, options?: StructuredSerializeOptions): T {
  // 共享工具 slow Operations在这里处理 `using _ = slowLogging`structuredClone(${value})``，完成这一小步状态转换。
  using _ = slowLogging`structuredClone(${value})`
  // 返回 `structuredClone(value, options)`，作为共享工具这次计算的结果。
  return structuredClone(value, options)
}

/**
 * Wrapped cloneDeep with slow operation logging.
 * Use this instead of lodash cloneDeep directly to detect performance issues.
 *
 * @example
 * import { cloneDeep } from './slowOperations.js'
 * const copy = cloneDeep(originalObject)
 */
// cloneDeep 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cloneDeep<T>(value: T): T {
  // 共享工具 slow Operations在这里处理 `using _ = slowLogging`cloneDeep(${value})``，完成这一小步状态转换。
  using _ = slowLogging`cloneDeep(${value})`
  // 返回 `lodashCloneDeep(value)`，作为共享工具这次计算的结果。
  return lodashCloneDeep(value)
}

/**
 * Wrapper around fs.writeFileSync with slow operation logging.
 * Supports flush option to ensure data is written to disk before returning.
 * @param filePath The path to the file to write to
 * @param data The data to write (string or Buffer)
 * @param options Optional write options (encoding, mode, flag, flush)
 * @deprecated Use `fs.promises.writeFile` instead for non-blocking writes.
 * Sync file writes block the event loop and cause performance issues.
 */
// writeFileSync_DEPRECATED 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function writeFileSync_DEPRECATED(
  filePath: string,
  data: string | NodeJS.ArrayBufferView,
  options?: WriteFileOptionsWithFlush,
): void {
  // 共享工具 slow Operations在这里处理 `using _ = slowLogging`fs.writeFileSync(${filePath}, ${data})``，完成这一小步状态转换。
  using _ = slowLogging`fs.writeFileSync(${filePath}, ${data})`

  // Check if flush is requested (for object-style options)
  // needsFlush 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const needsFlush =
    options !== null &&
    typeof options === 'object' &&
    'flush' in options &&
    options.flush === true

  // 满足 `needsFlush` 时，共享工具执行该分支。
  if (needsFlush) {
    // Manual flush: open file, write, fsync, close
    // encoding 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const encoding =
      typeof options === 'object' && 'encoding' in options
        ? options.encoding
        : undefined
    // mode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const mode =
      typeof options === 'object' && 'mode' in options
        ? options.mode
        : undefined
    // fd 先占位，稍后的条件分支会根据实际输入补齐它。
    let fd: number | undefined
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // fd更新为 `openSync(filePath, 'w', mode)`，确保共享工具后续读取最新状态。
      fd = openSync(filePath, 'w', mode)
      // 调用 fsWriteFileSync，触发共享工具此处需要的副作用。
      fsWriteFileSync(fd, data, { encoding: encoding ?? undefined })
      // 调用 fsyncSync，触发共享工具此处需要的副作用。
      fsyncSync(fd)
    } finally {
      // `fd` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (fd !== undefined) {
        // 调用 closeSync，触发共享工具此处需要的副作用。
        closeSync(fd)
      }
    }
  } else {
    // No flush needed, use standard writeFileSync
    // 调用 fsWriteFileSync，触发共享工具此处需要的副作用。
    fsWriteFileSync(filePath, data, options as WriteFileOptions)
  }
}

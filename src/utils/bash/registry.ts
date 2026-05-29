// 引入 memoizeWithLRU，将 ../memoize.js 中已经封装好的能力接到本文件流程里。
import { memoizeWithLRU } from '../memoize.js'
// 引入 specs，将 ./specs/index.js 中已经封装好的能力接到本文件流程里。
import specs from './specs/index.js'

// CommandSpec 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommandSpec = {
  name: string
  description?: string
  subcommands?: CommandSpec[]
  args?: Argument | Argument[]
  options?: Option[]
}

// Argument 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Argument = {
  name?: string
  description?: string
  isDangerous?: boolean
  isVariadic?: boolean // repeats infinitely e.g. echo hello world
  isOptional?: boolean
  isCommand?: boolean // wrapper commands e.g. timeout, sudo
  isModule?: string | boolean // for python -m and similar module args
  isScript?: boolean // script files e.g. node script.js
}

// Option 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Option = {
  name: string | string[]
  description?: string
  args?: Argument | Argument[]
  isRequired?: boolean
}

// loadFigSpec 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadFigSpec(
  command: string,
): Promise<CommandSpec | null> {
  // 只有 `!command || command.includes('/') || command.includes('\\')` 满足时，共享工具才执行该分支。
  if (!command || command.includes('/') || command.includes('\\')) return null
  // 满足 `command.includes('..')` 时，共享工具执行该分支。
  if (command.includes('..')) return null
  // `command.startsWith('-') && command` 与 `'-'` 不一致时刷新派生状态，避免使用过期结果。
  if (command.startsWith('-') && command !== '-') return null

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // module保存`import`，供共享工具后续处理使用。
    const module = await import(`@withfig/autocomplete/build/${command}.js`)
    // 返回 `module.default || module`，作为共享工具这次计算的结果。
    return module.default || module
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}
// getCommandSpec 命令数据保存`memoizeWithLRU`，供共享工具后续处理使用。
export const getCommandSpec = memoizeWithLRU(
  // 这个异步回调接收 command: string，串起共享工具的等待、调用和返回。
  async (command: string): Promise<CommandSpec | null> => {
    // spec 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const spec =
      // 调用 specs.find，触发共享工具此处需要的副作用。
      specs.find(s => s.name === command) ||
      (await loadFigSpec(command)) ||
      null
    // 返回 `spec`，作为共享工具这次计算的结果。
    return spec
  },
  // 这个回调绑定到 (command: string) => command,，负责共享工具在该局部场景下的响应。
  (command: string) => command,
)

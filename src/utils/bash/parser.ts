// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  ensureParserInitialized,
  getParserModule,
  type TsNode,
} from './bashParser.js'

// Node 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Node = TsNode

// ParsedCommandData 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface ParsedCommandData {
  rootNode: Node
  envVars: string[]
  commandNode: Node | null
  originalCommand: string
}

// MAX_COMMAND_LENGTH 命令数据 命名 `10000`，让后续代码直接表达这个值的用途。
const MAX_COMMAND_LENGTH = 10000
// DECLARATION_COMMANDS 命令数据保存`Set`，供共享工具后续处理使用。
const DECLARATION_COMMANDS = new Set([
  'export',
  'declare',
  'typeset',
  'readonly',
  'local',
  'unset',
  'unsetenv',
])
// ARGUMENT_TYPES 集合保存`Set`，供共享工具后续处理使用。
const ARGUMENT_TYPES = new Set(['word', 'string', 'raw_string', 'number'])
// SUBSTITUTION_TYPES 集合保存`Set`，供共享工具后续处理使用。
const SUBSTITUTION_TYPES = new Set([
  'command_substitution',
  'process_substitution',
])
// COMMAND_TYPES 命令数据保存`Set`，供共享工具后续处理使用。
const COMMAND_TYPES = new Set(['command', 'declaration_command'])

// logged标记共享工具 parser是否启用对应路径。
let logged = false
// logLoadOnce 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logLoadOnce(success: boolean): void {
  // 满足 `logged` 时，共享工具执行该分支。
  if (logged) return
  // logged更新为 `true`，确保Bash 解析工具后续读取最新状态。
  logged = true
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    success ? 'tree-sitter: native module loaded' : 'tree-sitter: unavailable',
  )
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_tree_sitter_load', { success })
}

/**
 * Awaits WASM init (Parser.init + Language.load). Must be called before
 * parseCommand/parseCommandRaw for the parser to be available. Idempotent.
 */
// ensureInitialized 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureInitialized(): Promise<void> {
  // 只有 `feature('TREE_SITTER_BASH') || feature('TREE_SITTER_BASH_SHADOW')` 满足时，共享工具才执行该分支。
  if (feature('TREE_SITTER_BASH') || feature('TREE_SITTER_BASH_SHADOW')) {
    // 等待 `ensureParserInitialized()` 完成，再继续共享工具 parser的异步流程。
    await ensureParserInitialized()
  }
}

// parseCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function parseCommand(
  command: string,
): Promise<ParsedCommandData | null> {
  // 只有 `!command || command.length > MAX_COMMAND_LENGTH` 满足时，共享工具才执行该分支。
  if (!command || command.length > MAX_COMMAND_LENGTH) return null

  // Gate: ant-only until pentest. External builds fall back to legacy
  // regex/shell-quote path. Guarding the whole body inside the positive
  // branch lets Bun DCE the NAPI import AND keeps telemetry honest — we
  // only fire tengu_tree_sitter_load when a load was genuinely attempted.
  // 满足 `feature('TREE_SITTER_BASH')` 时，共享工具执行该分支。
  if (feature('TREE_SITTER_BASH')) {
    // 等待 `ensureParserInitialized()` 完成，再继续共享工具 parser的异步流程。
    await ensureParserInitialized()
    // mod读取`getParserModule`，供共享工具后续处理使用。
    const mod = getParserModule()
    // 调用 logLoadOnce，触发共享工具此处需要的副作用。
    logLoadOnce(mod !== null)
    // mod缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!mod) return null

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // rootNode解析`mod.parse`，供共享工具后续处理使用。
      const rootNode = mod.parse(command)
      // rootNode缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!rootNode) return null

      // commandNode 命令数据筛选`findCommandNode`，供共享工具后续处理使用。
      const commandNode = findCommandNode(rootNode, null)
      // envVars 集合保存`extractEnvVars`，供共享工具后续处理使用。
      const envVars = extractEnvVars(commandNode)

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { rootNode, envVars, commandNode, originalCommand: command }
    } catch {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * SECURITY: Sentinel for "parser was loaded and attempted, but aborted"
 * (timeout / node budget / Rust panic). Distinct from `null` (module not
 * loaded). Adversarial input can trigger abort under MAX_COMMAND_LENGTH:
 * `(( a[0][0]... ))` with ~2800 subscripts hits PARSE_TIMEOUT_MICROS.
 * Callers MUST treat this as fail-closed (too-complex), NOT route to legacy.
 */
// PARSE_ABORTED保存`Symbol`，供共享工具后续处理使用。
export const PARSE_ABORTED = Symbol('parse-aborted')

/**
 * Raw parse — skips findCommandNode/extractEnvVars which the security
 * walker in ast.ts doesn't use. Saves one tree walk per bash command.
 *
 * Returns:
 *   - Node: parse succeeded
 *   - null: module not loaded / feature off / empty / over-length
 *   - PARSE_ABORTED: module loaded but parse failed (timeout/panic)
 */
// parseCommandRaw 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function parseCommandRaw(
  command: string,
): Promise<Node | null | typeof PARSE_ABORTED> {
  // 只有 `!command || command.length > MAX_COMMAND_LENGTH` 满足时，共享工具才执行该分支。
  if (!command || command.length > MAX_COMMAND_LENGTH) return null
  // 只有 `feature('TREE_SITTER_BASH') || feature('TREE_SITTER_BASH_SHADOW')` 满足时，共享工具才执行该分支。
  if (feature('TREE_SITTER_BASH') || feature('TREE_SITTER_BASH_SHADOW')) {
    // 等待 `ensureParserInitialized()` 完成，再继续共享工具 parser的异步流程。
    await ensureParserInitialized()
    // mod读取`getParserModule`，供共享工具后续处理使用。
    const mod = getParserModule()
    // 调用 logLoadOnce，触发共享工具此处需要的副作用。
    logLoadOnce(mod !== null)
    // mod缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!mod) return null
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果解析`mod.parse`，供共享工具后续处理使用。
      const result = mod.parse(command)
      // SECURITY: Module loaded; null here = timeout/node-budget abort in
      // bashParser.ts (PARSE_TIMEOUT_MS=50, MAX_NODES=50_000).
      // Previously collapsed into `return null` → parse-unavailable → legacy
      // path, which lacks EVAL_LIKE_BUILTINS — `trap`, `enable`, `hash` leaked.
      // 满足 `result === null` 时，共享工具执行该分支。
      if (result === null) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_tree_sitter_parse_abort', {
          cmdLength: command.length,
          panic: false,
        })
        // 返回 `PARSE_ABORTED`，作为共享工具这次计算的结果。
        return PARSE_ABORTED
      }
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    } catch {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tree_sitter_parse_abort', {
        cmdLength: command.length,
        panic: true,
      })
      // 返回 `PARSE_ABORTED`，作为共享工具这次计算的结果。
      return PARSE_ABORTED
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// findCommandNode 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findCommandNode(node: Node, parent: Node | null): Node | null {
  // 从 `node` 解构 type、children，减少共享工具 parser对同一对象的重复访问。
  const { type, children } = node

  // 满足 `COMMAND_TYPES.has(type)` 时，共享工具执行该分支。
  if (COMMAND_TYPES.has(type)) return node

  // Variable assignment followed by command
  // 只有 `type === 'variable_assignment' && parent` 满足时，共享工具才执行该分支。
  if (type === 'variable_assignment' && parent) {
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      parent.children.find(
        // c更新为 `> COMMAND_TYPES.has(c.type) && c.startIndex > node.startI...`，确保Bash 解析工具后续读取最新状态。
        c => COMMAND_TYPES.has(c.type) && c.startIndex > node.startIndex,
      ) ?? null
    )
  }

  // Pipeline: recurse into first child (which may be a redirected_statement)
  // 当 `type` 匹配 `'pipeline'` 时，共享工具执行对应分支。
  if (type === 'pipeline') {
    // 按顺序遍历 `children` 中的child，逐个交给共享工具处理。
    for (const child of children) {
      // 结果筛选`findCommandNode`，供共享工具后续处理使用。
      const result = findCommandNode(child, node)
      // 满足 `result` 时，共享工具执行该分支。
      if (result) return result
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Redirected statement: find the command inside
  // 当 `type` 匹配 `'redirected_statement'` 时，共享工具执行对应分支。
  if (type === 'redirected_statement') {
    // 返回 `children.find(c => COMMAND_TYPES.has(c.type)) ?? null`，作为共享工具这次计算的结果。
    return children.find(c => COMMAND_TYPES.has(c.type)) ?? null
  }

  // Recursive search
  // 按顺序遍历 `children` 中的child，逐个交给共享工具处理。
  for (const child of children) {
    // 结果筛选`findCommandNode`，供共享工具后续处理使用。
    const result = findCommandNode(child, node)
    // 满足 `result` 时，共享工具执行该分支。
    if (result) return result
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// extractEnvVars 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractEnvVars(commandNode: Node | null): string[] {
  // `!commandNode || commandNode.type` 与 `'command'` 不一致时刷新派生状态，避免使用过期结果。
  if (!commandNode || commandNode.type !== 'command') return []

  // envVars 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const envVars: string[] = []
  // 按顺序遍历 `commandNode.children` 中的child，逐个交给共享工具处理。
  for (const child of commandNode.children) {
    // 当 `child.type` 匹配 `'variable_assignment'` 时，共享工具执行对应分支。
    if (child.type === 'variable_assignment') {
      // envVars 集合追加新条目，保持收集顺序与输入顺序一致。
      envVars.push(child.text)
    // 共享工具 parser在这里处理 `} else if (child.type === 'command_name' || child.type === 'word') {`，完成这一小步状态转换。
    } else if (child.type === 'command_name' || child.type === 'word') {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 返回 `envVars`，作为共享工具这次计算的结果。
  return envVars
}

// extractCommandArguments 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractCommandArguments(commandNode: Node): string[] {
  // Declaration commands
  // 当 `commandNode.type` 匹配 `'declaration_command'` 时，共享工具执行对应分支。
  if (commandNode.type === 'declaration_command') {
    // firstChild 命名 `commandNode.children[0]`，让后续代码直接表达这个值的用途。
    const firstChild = commandNode.children[0]
    // 返回 `firstChild && DECLARATION_COMMANDS.has(firstChild.text)`，作为共享工具这次计算的结果。
    return firstChild && DECLARATION_COMMANDS.has(firstChild.text)
      ? [firstChild.text]
      : []
  }

  // 参数列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const args: string[] = []
  // foundCommandName 命令数据标记共享工具 parser是否启用对应路径。
  let foundCommandName = false

  // 按顺序遍历 `commandNode.children` 中的child，逐个交给共享工具处理。
  for (const child of commandNode.children) {
    // 当 `child.type` 匹配 `'variable_assignment'` 时，共享工具执行对应分支。
    if (child.type === 'variable_assignment') continue

    // Command name
    // 共享工具在这里按实际状态进入对应分支。
    if (
      child.type === 'command_name' ||
      (!foundCommandName && child.type === 'word')
    ) {
      // foundCommandName 命令数据更新为 `true`，确保Bash 解析工具后续读取最新状态。
      foundCommandName = true
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(child.text)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // Arguments
    // 满足 `ARGUMENT_TYPES.has(child.type)` 时，共享工具执行该分支。
    if (ARGUMENT_TYPES.has(child.type)) {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(stripQuotes(child.text))
    // 共享工具 parser在这里处理 `} else if (SUBSTITUTION_TYPES.has(child.type)) {`，完成这一小步状态转换。
    } else if (SUBSTITUTION_TYPES.has(child.type)) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
  }
  // 返回 `args`，作为共享工具这次计算的结果。
  return args
}

// stripQuotes 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stripQuotes(text: string): string {
  // 返回 `text.length >= 2 &&`，作为共享工具这次计算的结果。
  return text.length >= 2 &&
    ((text[0] === '"' && text.at(-1) === '"') ||
      (text[0] === "'" && text.at(-1) === "'"))
    ? text.slice(1, -1)
    : text
}

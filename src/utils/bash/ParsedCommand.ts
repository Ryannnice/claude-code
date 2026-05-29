// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  extractOutputRedirections,
  splitCommandWithOperators,
} from './commands.js'
// 类型依赖 { Node } 来自 ./parser.js，用于校准共享工具的数据契约。
import type { Node } from './parser.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  analyzeCommand,
  type TreeSitterAnalysis,
} from './treeSitterAnalysis.js'

// OutputRedirection 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type OutputRedirection = {
  target: string
  operator: '>' | '>>'
}

/**
 * Interface for parsed command implementations.
 * Both tree-sitter and regex fallback implementations conform to this.
 */
// IParsedCommand 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface IParsedCommand {
  readonly originalCommand: string
  toString(): string
  getPipeSegments(): string[]
  withoutOutputRedirections(): string
  // getOutputRedirections不依赖额外参数，直接计算共享工具需要的结果。
  getOutputRedirections(): OutputRedirection[]
  /**
   * Returns tree-sitter analysis data if available.
   * Returns null for the regex fallback implementation.
   */
  // getTreeSitterAnalysis不依赖额外参数，直接计算共享工具需要的结果。
  getTreeSitterAnalysis(): TreeSitterAnalysis | null
}

/**
 * @deprecated Legacy regex/shell-quote path. Only used when tree-sitter is
 * unavailable. The primary gate is parseForSecurity (ast.ts).
 *
 * Regex-based fallback implementation using shell-quote parser.
 * Used when tree-sitter is not available.
 * Exported for testing purposes.
 */
// RegexParsedCommand_DEPRECATED 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class RegexParsedCommand_DEPRECATED implements IParsedCommand {
  readonly originalCommand: string

  // 构造函数接收 command: string，把外部输入整理成实例可复用的内部状态。
  constructor(command: string) {
    // 更新实例字段 originalCommand 为 command，同步共享工具的内部状态。
    this.originalCommand = command
  }

  // toString 使用 无 完成共享工具里的对应操作。
  toString(): string {
    // 返回 `this.originalCommand`，作为共享工具这次计算的结果。
    return this.originalCommand
  }

  // getPipeSegments不依赖额外参数，直接计算共享工具需要的结果。
  getPipeSegments(): string[] {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 片段列表格式化`splitCommandWithOperators`，供共享工具后续处理使用。
      const parts = splitCommandWithOperators(this.originalCommand)
      // segments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const segments: string[] = []
      // currentSegment 从空数组开始收集，后续循环会按处理顺序追加条目。
      let currentSegment: string[] = []

      // 按顺序遍历 `parts` 中的part，逐个交给共享工具处理。
      for (const part of parts) {
        // 当 `part` 匹配 `'|'` 时，共享工具执行对应分支。
        if (part === '|') {
          // 满足 `currentSegment.length > 0` 时，共享工具执行该分支。
          if (currentSegment.length > 0) {
            // segments 集合追加新条目，保持收集顺序与输入顺序一致。
            segments.push(currentSegment.join(' '))
            // currentSegment更新为 `[]`，确保Bash 解析工具后续读取最新状态。
            currentSegment = []
          }
        } else {
          // currentSegment追加新条目，保持收集顺序与输入顺序一致。
          currentSegment.push(part)
        }
      }

      // 满足 `currentSegment.length > 0` 时，共享工具执行该分支。
      if (currentSegment.length > 0) {
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(currentSegment.join(' '))
      }

      // 返回 `segments.length > 0 ? segments : [this.originalCommand]`，作为共享工具这次计算的结果。
      return segments.length > 0 ? segments : [this.originalCommand]
    } catch {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [this.originalCommand]
    }
  }

  // withoutOutputRedirections 使用 无 完成共享工具里的对应操作。
  withoutOutputRedirections(): string {
    // 满足 `!this.originalCommand.includes('>')` 时，共享工具执行该分支。
    if (!this.originalCommand.includes('>')) {
      // 返回 `this.originalCommand`，作为共享工具这次计算的结果。
      return this.originalCommand
    }
    // 共享工具 Parsed Command先整理这一处局部数据，后续分支可以直接读取。
    const { commandWithoutRedirections, redirections } =
      extractOutputRedirections(this.originalCommand)
    // 返回 `redirections.length > 0`，作为共享工具这次计算的结果。
    return redirections.length > 0
      ? commandWithoutRedirections
      : this.originalCommand
  }

  // getOutputRedirections不依赖额外参数，直接计算共享工具需要的结果。
  getOutputRedirections(): OutputRedirection[] {
    // 从 `extractOutputRedirections(this.originalCommand)` 解构 redirections，减少共享工具 Parsed Command对同一对象的重复访问。
    const { redirections } = extractOutputRedirections(this.originalCommand)
    // 返回 `redirections`，作为共享工具这次计算的结果。
    return redirections
  }

  // getTreeSitterAnalysis不依赖额外参数，直接计算共享工具需要的结果。
  getTreeSitterAnalysis(): TreeSitterAnalysis | null {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// RedirectionNode 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type RedirectionNode = OutputRedirection & {
  startIndex: number
  endIndex: number
}

// visitNodes 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function visitNodes(node: Node, visitor: (node: Node) => void): void {
  // 调用 visitor，触发共享工具此处需要的副作用。
  visitor(node)
  // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
  for (const child of node.children) {
    // 调用 visitNodes，触发共享工具此处需要的副作用。
    visitNodes(child, visitor)
  }
}

// extractPipePositions 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractPipePositions(rootNode: Node): number[] {
  // pipePositions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const pipePositions: number[] = []
  // 调用 visitNodes，触发共享工具此处需要的副作用。
  visitNodes(rootNode, node => {
    // 当 `node.type` 匹配 `'pipeline'` 时，共享工具执行对应分支。
    if (node.type === 'pipeline') {
      // 按顺序遍历 `node.children` 中的child，逐个交给共享工具处理。
      for (const child of node.children) {
        // 当 `child.type` 匹配 `'|'` 时，共享工具执行对应分支。
        if (child.type === '|') {
          // pipePositions 集合追加新条目，保持收集顺序与输入顺序一致。
          pipePositions.push(child.startIndex)
        }
      }
    }
  })
  // visitNodes is depth-first. For `a | b && c | d`, the outer `list` nests
  // the second pipeline as a sibling of the first, so the outer `|` is
  // visited before the inner one — positions arrive out of order.
  // getPipeSegments iterates them to slice left-to-right, so sort here.
  // 返回 `pipePositions.sort((a, b) => a - b)`，作为共享工具这次计算的结果。
  return pipePositions.sort((a, b) => a - b)
}

// extractRedirectionNodes 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractRedirectionNodes(rootNode: Node): RedirectionNode[] {
  // redirections 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const redirections: RedirectionNode[] = []
  // 调用 visitNodes，触发共享工具此处需要的副作用。
  visitNodes(rootNode, node => {
    // 当 `node.type` 匹配 `'file_redirect'` 时，共享工具执行对应分支。
    if (node.type === 'file_redirect') {
      // 子节点保存`node.children`，供共享工具 Parsed Command后续判断或输出使用。
      const children = node.children
      // op筛选`children.find`，供共享工具后续处理使用。
      const op = children.find(c => c.type === '>' || c.type === '>>')
      // target筛选`children.find`，供共享工具后续处理使用。
      const target = children.find(c => c.type === 'word')
      // 只有 `op && target` 满足时，共享工具才执行该分支。
      if (op && target) {
        // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
        redirections.push({
          startIndex: node.startIndex,
          endIndex: node.endIndex,
          target: target.text,
          operator: op.type as '>' | '>>',
        })
      }
    }
  })
  // 返回 `redirections`，作为共享工具这次计算的结果。
  return redirections
}

// TreeSitterParsedCommand 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class TreeSitterParsedCommand implements IParsedCommand {
  readonly originalCommand: string
  // Tree-sitter's startIndex/endIndex are UTF-8 byte offsets, but JS
  // String.slice() uses UTF-16 code-unit indices. For ASCII they coincide;
  // for multi-byte code points (e.g. `—` U+2014: 3 UTF-8 bytes, 1 code unit)
  // they diverge and slicing the string directly lands mid-token. Slicing
  // the UTF-8 Buffer with tree-sitter's byte offsets and decoding back to
  // string is correct regardless of code-point width.
  private readonly commandBytes: Buffer
  private readonly pipePositions: number[]
  private readonly redirectionNodes: RedirectionNode[]
  private readonly treeSitterAnalysis: TreeSitterAnalysis

  // 构造函数初始化实例状态，确保共享工具后续方法读取到完整配置。
  constructor(
    command: string,
    pipePositions: number[],
    redirectionNodes: RedirectionNode[],
    treeSitterAnalysis: TreeSitterAnalysis,
  ) {
    // 更新实例字段 originalCommand 为 command，同步共享工具的内部状态。
    this.originalCommand = command
    // 更新实例字段 commandBytes 为 Buffer.from(command, 'utf8')，同步共享工具的内部状态。
    this.commandBytes = Buffer.from(command, 'utf8')
    // 更新实例字段 pipePositions 为 pipePositions，同步共享工具的内部状态。
    this.pipePositions = pipePositions
    // 更新实例字段 redirectionNodes 为 redirectionNodes，同步共享工具的内部状态。
    this.redirectionNodes = redirectionNodes
    // 更新实例字段 treeSitterAnalysis 为 treeSitterAnalysis，同步共享工具的内部状态。
    this.treeSitterAnalysis = treeSitterAnalysis
  }

  // toString 使用 无 完成共享工具里的对应操作。
  toString(): string {
    // 返回 `this.originalCommand`，作为共享工具这次计算的结果。
    return this.originalCommand
  }

  // getPipeSegments不依赖额外参数，直接计算共享工具需要的结果。
  getPipeSegments(): string[] {
    // this.pipePositions 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (this.pipePositions.length === 0) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [this.originalCommand]
    }

    // segments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const segments: string[] = []
    // currentStart保存`0`，供后续判断或组装使用。
    let currentStart = 0

    // 按顺序遍历 `this.pipePositions` 中的pipePos 集合，逐个交给共享工具处理。
    for (const pipePos of this.pipePositions) {
      // segment保存`this.commandBytes`，供共享工具 Parsed Command后续判断或输出使用。
      const segment = this.commandBytes
        .subarray(currentStart, pipePos)
        .toString('utf8')
        .trim()
      // 满足 `segment` 时，共享工具执行该分支。
      if (segment) {
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(segment)
      }
      // currentStart更新为 `pipePos + 1`，确保Bash 解析工具后续读取最新状态。
      currentStart = pipePos + 1
    }

    // lastSegment保存`this.commandBytes`，供共享工具 Parsed Command后续判断或输出使用。
    const lastSegment = this.commandBytes
      .subarray(currentStart)
      .toString('utf8')
      .trim()
    // 满足 `lastSegment` 时，共享工具执行该分支。
    if (lastSegment) {
      // segments 集合追加新条目，保持收集顺序与输入顺序一致。
      segments.push(lastSegment)
    }

    // 返回 `segments`，作为共享工具这次计算的结果。
    return segments
  }

  // withoutOutputRedirections 使用 无 完成共享工具里的对应操作。
  withoutOutputRedirections(): string {
    // this.redirectionNodes 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (this.redirectionNodes.length === 0) return this.originalCommand

    // sorted保存`sort`，供共享工具后续处理使用。
    const sorted = [...this.redirectionNodes].sort(
      (a, b) => b.startIndex - a.startIndex,
    )

    // 结果保存`this.commandBytes`，供后续判断或组装使用。
    let result = this.commandBytes
    // 按顺序遍历 `sorted` 中的redir，逐个交给共享工具处理。
    for (const redir of sorted) {
      // 结果更新为 `Buffer.concat([`，确保Bash 解析工具后续读取最新状态。
      result = Buffer.concat([
        result.subarray(0, redir.startIndex),
        result.subarray(redir.endIndex),
      ])
    }
    // 返回 `result.toString('utf8').trim().replace(/\s+/g, ' ')`，作为共享工具这次计算的结果。
    return result.toString('utf8').trim().replace(/\s+/g, ' ')
  }

  // getOutputRedirections不依赖额外参数，直接计算共享工具需要的结果。
  getOutputRedirections(): OutputRedirection[] {
    // 返回 `this.redirectionNodes.map(({ target, operator }) => ({`，作为共享工具这次计算的结果。
    return this.redirectionNodes.map(({ target, operator }) => ({
      target,
      operator,
    }))
  }

  // getTreeSitterAnalysis不依赖额外参数，直接计算共享工具需要的结果。
  getTreeSitterAnalysis(): TreeSitterAnalysis {
    // 返回 `this.treeSitterAnalysis`，作为共享工具这次计算的结果。
    return this.treeSitterAnalysis
  }
}

// getTreeSitterAvailable保存`memoize`，供共享工具后续处理使用。
const getTreeSitterAvailable = memoize(async (): Promise<boolean> => {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await import('./parser.js')` 解构 parseCommand，减少共享工具 Parsed Command对同一对象的重复访问。
    const { parseCommand } = await import('./parser.js')
    // testResult解析`parseCommand`，供共享工具后续处理使用。
    const testResult = await parseCommand('echo test')
    // 返回 `testResult !== null`，作为共享工具这次计算的结果。
    return testResult !== null
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
})

/**
 * Build a TreeSitterParsedCommand from a pre-parsed AST root. Lets callers
 * that already have the tree skip the redundant native.parse that
 * ParsedCommand.parse would do.
 */
// buildParsedCommandFromRoot 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildParsedCommandFromRoot(
  command: string,
  root: Node,
): IParsedCommand {
  // pipePositions 集合保存`extractPipePositions`，供共享工具后续处理使用。
  const pipePositions = extractPipePositions(root)
  // redirectionNodes 集合保存`extractRedirectionNodes`，供共享工具后续处理使用。
  const redirectionNodes = extractRedirectionNodes(root)
  // analysis 集合保存`analyzeCommand`，供共享工具后续处理使用。
  const analysis = analyzeCommand(root, command)
  // 返回 `new TreeSitterParsedCommand(`，作为共享工具这次计算的结果。
  return new TreeSitterParsedCommand(
    command,
    pipePositions,
    redirectionNodes,
    analysis,
  )
}

// doParse 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function doParse(command: string): Promise<IParsedCommand | null> {
  // 命令缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!command) return null

  // treeSitterAvailable读取`getTreeSitterAvailable`，供共享工具后续处理使用。
  const treeSitterAvailable = await getTreeSitterAvailable()
  // 满足 `treeSitterAvailable` 时，共享工具执行该分支。
  if (treeSitterAvailable) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 从 `await import('./parser.js')` 解构 parseCommand，减少共享工具 Parsed Command对同一对象的重复访问。
      const { parseCommand } = await import('./parser.js')
      // data解析`parseCommand`，供共享工具后续处理使用。
      const data = await parseCommand(command)
      // 满足 `data` 时，共享工具执行该分支。
      if (data) {
        // Native NAPI parser returns plain JS objects (no WASM handles);
        // nothing to free — extract directly.
        // 返回 `buildParsedCommandFromRoot(command, data.rootNode)`，作为共享工具这次计算的结果。
        return buildParsedCommandFromRoot(command, data.rootNode)
      }
    } catch {
      // Fall through to regex implementation
    }
  }

  // Fallback to regex implementation
  // 返回 `new RegexParsedCommand_DEPRECATED(command)`，作为共享工具这次计算的结果。
  return new RegexParsedCommand_DEPRECATED(command)
}

// Single-entry cache: legacy callers (bashCommandIsSafeAsync,
// buildSegmentWithoutRedirections) may call ParsedCommand.parse repeatedly
// with the same command string. Each parse() is ~1 native.parse + ~6 tree
// walks, so caching the most recent command skips the redundant work.
// Size-1 bound avoids leaking TreeSitterParsedCommand instances.
// lastCmd 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
let lastCmd: string | undefined
// lastResult 先占位，稍后的条件分支会根据实际输入补齐它。
let lastResult: Promise<IParsedCommand | null> | undefined

/**
 * ParsedCommand provides methods for working with shell commands.
 * Uses tree-sitter when available for quote-aware parsing,
 * falls back to regex-based parsing otherwise.
 */
// ParsedCommand 命令数据集中保存共享工具 Parsed Command要一起传递的字段。
export const ParsedCommand = {
  /**
   * Parse a command string and return a ParsedCommand instance.
   * Returns null if parsing fails completely.
   */
  // parse 使用 command: string 完成共享工具里的对应操作。
  parse(command: string): Promise<IParsedCommand | null> {
    // `command === lastCmd && lastResult` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (command === lastCmd && lastResult !== undefined) {
      // 返回 `lastResult`，作为共享工具这次计算的结果。
      return lastResult
    }
    // lastCmd 命令数据更新为 `command`，确保Bash 解析工具后续读取最新状态。
    lastCmd = command
    // lastResult更新为 `doParse(command)`，确保Bash 解析工具后续读取最新状态。
    lastResult = doParse(command)
    // 返回 `lastResult`，作为共享工具这次计算的结果。
    return lastResult
  },
}

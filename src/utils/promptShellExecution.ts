// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { Tool, ToolUseContext } 来自 ../Tool.js，用于校准共享工具的数据契约。
import type { Tool, ToolUseContext } from '../Tool.js'
// 接入 BashTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BashTool } from '../tools/BashTool/BashTool.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 errorMessage、MalformedCommandError、ShellError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, MalformedCommandError, ShellError } from './errors.js'
// 类型依赖 { FrontmatterShell } 来自 ./frontmatterParser.js，用于校准共享工具的数据契约。
import type { FrontmatterShell } from './frontmatterParser.js'
// 引入 createAssistantMessage，将 ./messages.js 中已经封装好的能力接到本文件流程里。
import { createAssistantMessage } from './messages.js'
// 引入 hasPermissionsToUseTool，将 ./permissions/permissions.js 中已经封装好的能力接到本文件流程里。
import { hasPermissionsToUseTool } from './permissions/permissions.js'
// 引入 processToolResultBlock，将 ./toolResultStorage.js 中已经封装好的能力接到本文件流程里。
import { processToolResultBlock } from './toolResultStorage.js'

// Narrow structural slice both BashTool and PowerShellTool satisfy. We can't
// use the base Tool type: it marks call()'s canUseTool/parentMessage as
// required, but both concrete tools have them optional and the original code
// called BashTool.call({ command }, ctx) with just 2 args. We can't use
// `typeof BashTool` either: BashTool's input schema has fields (e.g.
// _simulatedSedEdit) that PowerShellTool's does not.
// NOTE: call() is invoked directly here, bypassing validateInput — any
// load-bearing check must live in call() itself (see PR #23311).
// ShellOut 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ShellOut = { stdout: string; stderr: string; interrupted: boolean }
// PromptShellTool 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type PromptShellTool = Tool & {
  call(
    input: { command: string },
    context: ToolUseContext,
  ): Promise<{ data: ShellOut }>
}

// 引入 isPowerShellToolEnabled，将 ./shell/shellToolUtils.js 中已经封装好的能力接到本文件流程里。
import { isPowerShellToolEnabled } from './shell/shellToolUtils.js'

// Lazy: this file is on the startup import chain (main → commands →
// loadSkillsDir → here). A static import would load PowerShellTool.ts
// (and transitively parser.ts, validators, etc.) at startup on all
// platforms, defeating tools.ts's lazy require. Deferred until the
// first skill with `shell: powershell` actually runs.
/* eslint-disable @typescript-eslint/no-require-imports */
// getPowerShellTool封装成回调，供共享工具 prompt Shell Execution在事件触发或异步步骤中调用。
const getPowerShellTool = (() => {
  // cached 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
  let cached: PromptShellTool | undefined
  // return 使用 无 完成共享工具里的对应操作。
  return (): PromptShellTool => {
    // cached 缓存缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!cached) {
      // cached 缓存更新为 `(`，确保共享工具后续读取最新状态。
      cached = (
        require('../tools/PowerShellTool/PowerShellTool.js') as typeof import('../tools/PowerShellTool/PowerShellTool.js')
      ).PowerShellTool
    }
    // 返回 `cached`，作为共享工具这次计算的结果。
    return cached
  }
})()
/* eslint-enable @typescript-eslint/no-require-imports */

// Pattern for code blocks: ```! command ```
// BLOCK_PATTERN保存`/```!\s*\n?([\s\S]*?)\n?```/g`，供共享工具 prompt Shell Execution后续判断或输出使用。
const BLOCK_PATTERN = /```!\s*\n?([\s\S]*?)\n?```/g

// Pattern for inline: !`command`
// Uses a positive lookbehind to require whitespace or start-of-line before !
// This prevents false matches inside markdown inline code spans like `!!` or
// adjacent spans like `foo`!`bar`, and shell variables like $!
// eslint-disable-next-line custom-rules/no-lookbehind-regex -- gated by text.includes('!`') below (PR#22986)
// INLINE_PATTERN读取 `/(?<=^|\s)!`([^`]+)`/gm` 对应条目，后续围绕该成员继续处理。
const INLINE_PATTERN = /(?<=^|\s)!`([^`]+)`/gm

/**
 * Parses prompt text and executes any embedded shell commands.
 * Supports two syntaxes:
 * - Code blocks: ```! command ```
 * - Inline: !`command`
 *
 * @param shell - Shell to route commands through. Defaults to bash.
 *   This is *never* read from settings.defaultShell — it comes from .md
 *   frontmatter (author's choice) or is undefined for built-in commands.
 *   See docs/design/ps-shell-selection.md §5.3.
 */
export async function executeShellCommandsInPrompt(
  text: string,
  context: ToolUseContext,
  slashCommandName: string,
  shell?: FrontmatterShell,
): Promise<string> {
  let result = text

  // Resolve the tool once. `shell === undefined` and `shell === 'bash'` both
  // hit BashTool. PowerShell only when the runtime gate allows — a skill
  // author's frontmatter choice doesn't override the user's opt-in/out.
  const shellTool: PromptShellTool =
    shell === 'powershell' && isPowerShellToolEnabled()
      ? getPowerShellTool()
      : BashTool

  // INLINE_PATTERN's lookbehind is ~100x slower than BLOCK_PATTERN on large
  // skill content (265µs vs 2µs @ 17KB). 93% of skills have no !` at all,
  // so gate the expensive scan on a cheap substring check. BLOCK_PATTERN
  // (```!) doesn't require !` in the text, so it's always scanned.
  // blockMatches 集合保存`text.matchAll`，供共享工具后续处理使用。
  const blockMatches = text.matchAll(BLOCK_PATTERN)
  // inlineMatches 集合筛选`text.includes`，供共享工具后续处理使用。
  const inlineMatches = text.includes('!`') ? text.matchAll(INLINE_PATTERN) : []

  // 等待 `Promise.all(` 完成，再继续共享工具 prompt Shell Execution的异步流程。
  await Promise.all(
    // 这个回调绑定到 [...blockMatches, ...inlineMatches].map(async match => {，负责共享工具在该局部场景下的响应。
    [...blockMatches, ...inlineMatches].map(async match => {
      // 命令格式化`trim`，供共享工具后续处理使用。
      const command = match[1]?.trim()
      // 满足 `command` 时，共享工具执行该分支。
      if (command) {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // Check permissions before executing
          // 权限判断结果保存`hasPermissionsToUseTool`，供共享工具后续处理使用。
          const permissionResult = await hasPermissionsToUseTool(
            shellTool,
            { command },
            context,
            createAssistantMessage({ content: [] }),
            '',
          )

          // `permissionResult.behavior` 与 `'allow'` 不一致时刷新派生状态，避免使用过期结果。
          if (permissionResult.behavior !== 'allow') {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Shell command permission check failed for command in ${slashCommandName}: ${command}. Error: ${permissionResult.message}`,
            )
            // 抛出 new MalformedCommandError(，阻止共享工具在无效状态下继续运行。
            throw new MalformedCommandError(
              `Shell command permission check failed for pattern "${match[0]}": ${permissionResult.message || 'Permission denied'}`,
            )
          }

          // 从 `await shellTool.call({ command }, context)` 解构 data，减少共享工具 prompt Shell Execution对同一对象的重复访问。
          const { data } = await shellTool.call({ command }, context)
          // Reuse the same persistence flow as regular Bash tool calls
          // toolResultBlock保存`processToolResultBlock`，供共享工具后续处理使用。
          const toolResultBlock = await processToolResultBlock(
            shellTool,
            data,
            randomUUID(),
          )
          // Extract the string content from the block
          // output 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const output =
            typeof toolResultBlock.content === 'string'
              ? toolResultBlock.content
              : formatBashOutput(data.stdout, data.stderr)
          // Function replacer — String.replace interprets $$, $&, $`, $' in
          // the replacement string even with a string search pattern. Shell
          // output (especially PowerShell: $env:PATH, $$, $PSVersionTable)
          // is arbitrary user data; a bare string arg would corrupt it.
          // 结果更新为 `result.replace(match[0], () => output)`，确保共享工具后续读取最新状态。
          result = result.replace(match[0], () => output)
        } catch (e) {
          // 满足 `e instanceof MalformedCommandError` 时，共享工具执行该分支。
          if (e instanceof MalformedCommandError) {
            // 抛出 e，阻止共享工具在无效状态下继续运行。
            throw e
          }
          // 调用 formatBashError，触发共享工具此处需要的副作用。
          formatBashError(e, match[0])
        }
      }
    }),
  )

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// formatBashOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatBashOutput(
  stdout: string,
  stderr: string,
  inline = false,
): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []

  // 满足 `stdout.trim()` 时，共享工具执行该分支。
  if (stdout.trim()) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(stdout.trim())
  }

  // 满足 `stderr.trim()` 时，共享工具执行该分支。
  if (stderr.trim()) {
    // 满足 `inline` 时，共享工具执行该分支。
    if (inline) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`[stderr: ${stderr.trim()}]`)
    } else {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`[stderr]\n${stderr.trim()}`)
    }
  }

  // 返回 `parts.join(inline ? ' ' : '\n')`，作为共享工具这次计算的结果。
  return parts.join(inline ? ' ' : '\n')
}

// formatBashError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatBashError(e: unknown, pattern: string, inline = false): never {
  // 满足 `e instanceof ShellError` 时，共享工具执行该分支。
  if (e instanceof ShellError) {
    // 满足 `e.interrupted` 时，共享工具执行该分支。
    if (e.interrupted) {
      // 抛出 new MalformedCommandError(，阻止共享工具在无效状态下继续运行。
      throw new MalformedCommandError(
        `Shell command interrupted for pattern "${pattern}": [Command interrupted]`,
      )
    }
    // output格式化`formatBashOutput`，供共享工具后续处理使用。
    const output = formatBashOutput(e.stdout, e.stderr, inline)
    // 抛出 new MalformedCommandError(，阻止共享工具在无效状态下继续运行。
    throw new MalformedCommandError(
      `Shell command failed for pattern "${pattern}": ${output}`,
    )
  }

  // 消息保存`errorMessage`，供共享工具后续处理使用。
  const message = errorMessage(e)
  // formatted读取 `inline ? `[Error: ${message}]` : `[Error]\n${message}`` 对应条目，后续围绕该成员继续处理。
  const formatted = inline ? `[Error: ${message}]` : `[Error]\n${message}`
  // 抛出 new MalformedCommandError(formatted)，阻止共享工具在无效状态下继续运行。
  throw new MalformedCommandError(formatted)
}

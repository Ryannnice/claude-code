// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type SpawnOptions,
  type SpawnSyncOptions,
  spawn,
  spawnSync,
} from 'child_process'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 复用 instances 终端界面组件，避免在这里重复拼装显示逻辑。
import instances from '../ink/instances.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 whichSync，将 ./which.js 中已经封装好的能力接到本文件流程里。
import { whichSync } from './which.js'

// isCommandAvailable 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCommandAvailable(command: string): boolean {
  // 返回 `!!whichSync(command)`，作为共享工具这次计算的结果。
  return !!whichSync(command)
}

// GUI editors that open in a separate window and can be spawned detached
// without fighting the TUI for stdin. VS Code forks (cursor, windsurf, codium)
// are listed explicitly since none contain 'code' as a substring.
// GUI_EDITORS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const GUI_EDITORS = [
  'code',
  'cursor',
  'windsurf',
  'codium',
  'subl',
  'atom',
  'gedit',
  'notepad++',
  'notepad',
]

// Editors that accept +N as a goto-line argument. The Windows default
// ('start /wait notepad') does not — notepad treats +42 as a filename.
// PLUS_N_EDITORS 集合保存`b`，供共享工具后续处理使用。
const PLUS_N_EDITORS = /\b(vi|vim|nvim|nano|emacs|pico|micro|helix|hx)\b/

// VS Code and forks use -g file:line. subl uses bare file:line (no -g).
// VSCODE_FAMILY保存`Set`，供共享工具后续处理使用。
const VSCODE_FAMILY = new Set(['code', 'cursor', 'windsurf', 'codium'])

/**
 * Classify the editor as GUI or not. Returns the matched GUI family name
 * for goto-line argv selection, or undefined for terminal editors.
 * Note: this is classification only — spawn the user's actual binary, not
 * this return value, so `code-insiders` / absolute paths are preserved.
 *
 * Uses basename so /home/alice/code/bin/nvim doesn't match 'code' via the
 * directory component. code-insiders → still matches 'code', /usr/bin/code →
 * 'code' → matches.
 */
// classifyGuiEditor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function classifyGuiEditor(editor: string): string | undefined {
  // base保存`basename`，供共享工具后续处理使用。
  const base = basename(editor.split(' ')[0] ?? '')
  // 返回 `GUI_EDITORS.find(g => base.includes(g))`，作为共享工具这次计算的结果。
  return GUI_EDITORS.find(g => base.includes(g))
}

/**
 * Build goto-line argv for a GUI editor. VS Code family uses -g file:line;
 * subl uses bare file:line; others don't support goto-line.
 */
// guiGotoArgv 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function guiGotoArgv(
  guiFamily: string,
  filePath: string,
  line: number | undefined,
): string[] {
  // line缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!line) return [filePath]
  // 满足 `VSCODE_FAMILY.has(guiFamily)` 时，共享工具执行该分支。
  if (VSCODE_FAMILY.has(guiFamily)) return ['-g', `${filePath}:${line}`]
  // 当 `guiFamily` 匹配 `'subl'` 时，共享工具执行对应分支。
  if (guiFamily === 'subl') return [`${filePath}:${line}`]
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return [filePath]
}

/**
 * Launch a file in the user's external editor.
 *
 * For GUI editors (code, subl, etc.): spawns detached — the editor opens
 * in a separate window and Claude Code stays interactive.
 *
 * For terminal editors (vim, nvim, nano, etc.): blocks via Ink's alt-screen
 * handoff until the editor exits. This is the same dance as editFileInEditor()
 * in promptEditor.ts, minus the read-back.
 *
 * Returns true if the editor was launched, false if no editor is available.
 */
// openFileInExternalEditor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function openFileInExternalEditor(
  filePath: string,
  line?: number,
): boolean {
  // editor读取`getExternalEditor`，供共享工具后续处理使用。
  const editor = getExternalEditor()
  // editor缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!editor) return false

  // Spawn the user's actual binary (preserves code-insiders, abs paths, etc.).
  // Split into binary + extra args so multi-word values like 'start /wait
  // notepad' or 'code --wait' propagate all tokens to spawn.
  // 片段列表格式化`editor.split`，供共享工具后续处理使用。
  const parts = editor.split(' ')
  // base读取 `parts[0] ?? editor` 对应条目，后续围绕该成员继续处理。
  const base = parts[0] ?? editor
  // editorArgs 集合格式化`parts.slice`，供共享工具后续处理使用。
  const editorArgs = parts.slice(1)
  // guiFamily保存`classifyGuiEditor`，供共享工具后续处理使用。
  const guiFamily = classifyGuiEditor(editor)

  // 满足 `guiFamily` 时，共享工具执行该分支。
  if (guiFamily) {
    // gotoArgv保存`guiGotoArgv`，供共享工具后续处理使用。
    const gotoArgv = guiGotoArgv(guiFamily, filePath, line)
    // detachedOpts 集合 集中保存共享工具 editor要一起传递的字段。
    const detachedOpts: SpawnOptions = { detached: true, stdio: 'ignore' }
    // child 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let child
    // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
    if (process.platform === 'win32') {
      // shell: true on win32 so code.cmd / cursor.cmd / windsurf.cmd resolve —
      // CreateProcess can't execute .cmd/.bat directly. Assemble quoted command
      // string; cmd.exe doesn't expand $() or backticks inside double quotes.
      // Quote each arg so paths with spaces survive the shell join.
      // gotoStr派生`gotoArgv.map`，供共享工具后续处理使用。
      const gotoStr = gotoArgv.map(a => `"${a}"`).join(' ')
      // child更新为 `spawn(`${editor} ${gotoStr}`, { ...detachedOpts, shell: t...`，确保共享工具后续读取最新状态。
      child = spawn(`${editor} ${gotoStr}`, { ...detachedOpts, shell: true })
    } else {
      // POSIX: argv array with no shell — injection-safe. shell: true would
      // expand $() / backticks inside double quotes, and filePath is
      // filesystem-sourced (possible RCE from a malicious repo filename).
      // child更新为 `spawn(base, [...editorArgs, ...gotoArgv], detachedOpts)`，确保共享工具后续读取最新状态。
      child = spawn(base, [...editorArgs, ...gotoArgv], detachedOpts)
    }
    // spawn() emits ENOENT asynchronously. ENOENT on $VISUAL/$EDITOR is a
    // user-config error, not an internal bug — don't pollute error telemetry.
    // 调用 child.on，触发共享工具此处需要的副作用。
    child.on('error', e =>
      logForDebugging(`editor spawn failed: ${e}`, { level: 'error' }),
    )
    // 调用 child.unref，触发共享工具此处需要的副作用。
    child.unref()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Terminal editor — needs alt-screen handoff since it takes over the
  // terminal. Blocks until the editor exits.
  // inkInstance读取`instances.get`，供共享工具后续处理使用。
  const inkInstance = instances.get(process.stdout)
  // inkInstance缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!inkInstance) return false
  // Only prepend +N for editors known to support it — notepad treats +42 as a
  // filename to open. Test basename so /home/vim/bin/kak doesn't match 'vim'
  // via the directory segment.
  // useGotoLine保存`PLUS_N_EDITORS.test`，供共享工具后续处理使用。
  const useGotoLine = line && PLUS_N_EDITORS.test(basename(base))
  // 调用 inkInstance.enterAlternateScreen，触发共享工具此处需要的副作用。
  inkInstance.enterAlternateScreen()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // syncOpts 集合 集中保存共享工具 editor要一起传递的字段。
    const syncOpts: SpawnSyncOptions = { stdio: 'inherit' }
    // result 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let result
    // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
    if (process.platform === 'win32') {
      // On Windows use shell: true so cmd.exe builtins like `start` resolve.
      // shell: true joins args unquoted, so assemble the command string with
      // explicit quoting ourselves (matching promptEditor.ts:74). spawnSync
      // returns errors in .error rather than throwing.
      // lineArg读取 hook 状态，供共享工具 editor本轮渲染使用。
      const lineArg = useGotoLine ? `+${line} ` : ''
      // 结果更新为 `spawnSync(`${editor} ${lineArg}"${filePath}"`, {`，确保共享工具后续读取最新状态。
      result = spawnSync(`${editor} ${lineArg}"${filePath}"`, {
        ...syncOpts,
        shell: true,
      })
    } else {
      // POSIX: spawn directly (no shell), argv array is quote-safe.
      // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
      const args = [
        ...editorArgs,
        ...(useGotoLine ? [`+${line}`, filePath] : [filePath]),
      ]
      // 结果更新为 `spawnSync(base, args, syncOpts)`，确保共享工具后续读取最新状态。
      result = spawnSync(base, args, syncOpts)
    }
    // 满足 `result.error` 时，共享工具执行该分支。
    if (result.error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`editor spawn failed: ${result.error}`, {
        level: 'error',
      })
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } finally {
    // 调用 inkInstance.exitAlternateScreen，触发共享工具此处需要的副作用。
    inkInstance.exitAlternateScreen()
  }
}

// getExternalEditor保存`memoize`，供共享工具后续处理使用。
export const getExternalEditor = memoize((): string | undefined => {
  // Prioritize environment variables
  // 满足 `process.env.VISUAL?.trim()` 时，共享工具执行该分支。
  if (process.env.VISUAL?.trim()) {
    // 返回 `process.env.VISUAL.trim()`，作为共享工具这次计算的结果。
    return process.env.VISUAL.trim()
  }

  // 满足 `process.env.EDITOR?.trim()` 时，共享工具执行该分支。
  if (process.env.EDITOR?.trim()) {
    // 返回 `process.env.EDITOR.trim()`，作为共享工具这次计算的结果。
    return process.env.EDITOR.trim()
  }

  // `isCommandAvailable` breaks the claude process' stdin on Windows
  // as a bandaid, we skip it
  // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (process.platform === 'win32') {
    // 返回 `'start /wait notepad'`，作为共享工具这次计算的结果。
    return 'start /wait notepad'
  }

  // Search for available editors in order of preference
  // editors 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const editors = ['code', 'vi', 'nano']
  // 返回 `editors.find(command => isCommandAvailable(command))`，作为共享工具这次计算的结果。
  return editors.find(command => isCommandAvailable(command))
})

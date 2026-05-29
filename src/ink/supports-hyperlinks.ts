// 引入 supportsHyperlinksLib，将 supports-hyperlinks 中已经封装好的能力接到本文件流程里。
import supportsHyperlinksLib from 'supports-hyperlinks'

// Additional terminals that support OSC 8 hyperlinks but aren't detected by supports-hyperlinks.
// Checked against both TERM_PROGRAM and LC_TERMINAL (the latter is preserved inside tmux).
// ADDITIONAL_HYPERLINK_TERMINALS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const ADDITIONAL_HYPERLINK_TERMINALS = [
  'ghostty',
  'Hyper',
  'kitty',
  'alacritty',
  'iTerm.app',
  'iTerm2',
]

// EnvLike 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type EnvLike = Record<string, string | undefined>

// SupportsHyperlinksOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type SupportsHyperlinksOptions = {
  env?: EnvLike
  stdoutSupported?: boolean
}

/**
 * Returns whether stdout supports OSC 8 hyperlinks.
 * Extends the supports-hyperlinks library with additional terminal detection.
 * @param options Optional overrides for testing (env, stdoutSupported)
 */
// supportsHyperlinks 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function supportsHyperlinks(
  options?: SupportsHyperlinksOptions,
): boolean {
  // stdoutSupported 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const stdoutSupported =
    options?.stdoutSupported ?? supportsHyperlinksLib.stdout
  // 满足 `stdoutSupported` 时，终端渲染执行该分支。
  if (stdoutSupported) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // env保存`options?.env ?? process.env`，供后续判断或组装使用。
  const env = options?.env ?? process.env

  // Check for additional terminals not detected by supports-hyperlinks
  // termProgram 命名 `env['TERM_PROGRAM']`，让后续代码直接表达这个值的用途。
  const termProgram = env['TERM_PROGRAM']
  // 只有 `termProgram && ADDITIONAL_HYPERLINK_TERMINALS.includes(termProgram)` 满足时，终端渲染才执行该分支。
  if (termProgram && ADDITIONAL_HYPERLINK_TERMINALS.includes(termProgram)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // LC_TERMINAL is set by some terminals (e.g. iTerm2) and preserved inside tmux,
  // where TERM_PROGRAM is overwritten to 'tmux'.
  // lcTerminal读取 `env['LC_TERMINAL']` 对应条目，后续围绕该成员继续处理。
  const lcTerminal = env['LC_TERMINAL']
  // 只有 `lcTerminal && ADDITIONAL_HYPERLINK_TERMINALS.includes(lcTerminal)` 满足时，终端渲染才执行该分支。
  if (lcTerminal && ADDITIONAL_HYPERLINK_TERMINALS.includes(lcTerminal)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Kitty sets TERM=xterm-kitty
  // term 命名 `env['TERM']`，让后续代码直接表达这个值的用途。
  const term = env['TERM']
  // 满足 `term?.includes('kitty')` 时，终端渲染执行该分支。
  if (term?.includes('kitty')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

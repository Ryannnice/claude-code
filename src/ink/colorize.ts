// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 类型依赖 { Color, TextStyles } 来自 ./styles.js，用于校准终端渲染的数据契约。
import type { Color, TextStyles } from './styles.js'

/**
 * xterm.js (VS Code, Cursor, code-server, Coder) has supported truecolor
 * since 2017, but code-server/Coder containers often don't set
 * COLORTERM=truecolor. chalk's supports-color doesn't recognize
 * TERM_PROGRAM=vscode (it only knows iTerm.app/Apple_Terminal), so it falls
 * through to the -256color regex → level 2. At level 2, chalk.rgb()
 * downgrades to the nearest 6×6×6 cube color: rgb(215,119,87) (Claude
 * orange) → idx 174 rgb(215,135,135) — washed-out salmon.
 *
 * Gated on level === 2 (not < 3) to respect NO_COLOR / FORCE_COLOR=0 —
 * those yield level 0 and are an explicit "no colors" request. Desktop VS
 * Code sets COLORTERM=truecolor itself, so this is a no-op there (already 3).
 *
 * Must run BEFORE the tmux clamp — if tmux is running inside a VS Code
 * terminal, tmux's passthrough limitation wins and we want level 2.
 */
// boostChalkLevelForXtermJs 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function boostChalkLevelForXtermJs(): boolean {
  // 只有 `process.env.TERM_PROGRAM === 'vscode' && chalk.le` 满足时，终端渲染才执行该分支。
  if (process.env.TERM_PROGRAM === 'vscode' && chalk.level === 2) {
    // level更新为 `3`，确保Ink 渲染层后续读取最新状态。
    chalk.level = 3
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * tmux parses truecolor SGR (\e[48;2;r;g;bm) into its cell buffer correctly,
 * but its client-side emitter only re-emits truecolor to the outer terminal if
 * the outer terminal advertises Tc/RGB capability (via terminal-overrides).
 * Default tmux config doesn't set this, so tmux emits the cell to iTerm2/etc
 * WITHOUT the bg sequence — outer terminal's buffer has bg=default → black on
 * dark profiles. Clamping to level 2 makes chalk emit 256-color (\e[48;5;Nm),
 * which tmux passes through cleanly. grey93 (255) is visually identical to
 * rgb(240,240,240).
 *
 * Users who HAVE set `terminal-overrides ,*:Tc` get a technically-unnecessary
 * downgrade, but the visual difference is imperceptible. Querying
 * `tmux show -gv terminal-overrides` to detect this would add a subprocess on
 * startup — not worth it.
 *
 * $TMUX is a pty-lifecycle env var set by tmux itself; it never comes from
 * globalSettings.env, so reading it here is correct. chalk is a singleton, so
 * this clamps ALL truecolor output (fg+bg+hex) across the entire app.
 */
// clampChalkLevelForTmux 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function clampChalkLevelForTmux(): boolean {
  // bg.ts sets terminal-overrides :Tc before attach, so truecolor passes
  // through — skip the clamp. General escape hatch for anyone who's
  // configured their tmux correctly.
  // 满足 `process.env.CLAUDE_CODE_TMUX_TRUECOLOR` 时，终端渲染执行该分支。
  if (process.env.CLAUDE_CODE_TMUX_TRUECOLOR) return false
  // 只有 `process.env.TMUX && chalk.level > 2` 满足时，终端渲染才执行该分支。
  if (process.env.TMUX && chalk.level > 2) {
    // level更新为 `2`，确保Ink 渲染层后续读取最新状态。
    chalk.level = 2
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
// Computed once at module load — terminal/tmux environment doesn't change mid-session.
// Order matters: boost first so the tmux clamp can re-clamp if tmux is running
// inside a VS Code terminal. Exported for debugging — tree-shaken if unused.
// CHALK_BOOSTED_FOR_XTERMJS 集合保存`boostChalkLevelForXtermJs`，供终端渲染后续处理使用。
export const CHALK_BOOSTED_FOR_XTERMJS = boostChalkLevelForXtermJs()
// CHALK_CLAMPED_FOR_TMUX保存`clampChalkLevelForTmux`，供终端渲染后续处理使用。
export const CHALK_CLAMPED_FOR_TMUX = clampChalkLevelForTmux()

// ColorType 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ColorType = 'foreground' | 'background'

// RGB_REGEX保存`/^rgb\(\s?(\d+),\s?(\d+),\s?(\d+)\s?\)$/`，供Ink 渲染层 colorize后续判断或输出使用。
const RGB_REGEX = /^rgb\(\s?(\d+),\s?(\d+),\s?(\d+)\s?\)$/
// ANSI_REGEX保存`/^ansi256\(\s?(\d+)\s?\)$/`，供后续判断或组装使用。
const ANSI_REGEX = /^ansi256\(\s?(\d+)\s?\)$/

// colorize保存`(`，供Ink 渲染层 colorize后续判断或输出使用。
export const colorize = (
  str: string,
  color: string | undefined,
  type: ColorType,
): string => {
  // color缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!color) {
    // 返回 `str`，作为终端渲染这次计算的结果。
    return str
  }

  // 满足 `color.startsWith('ansi:')` 时，终端渲染执行该分支。
  if (color.startsWith('ansi:')) {
    // 取值格式化`color.substring`，供终端渲染后续处理使用。
    const value = color.substring('ansi:'.length)
    // 按照 value 的取值选择终端渲染的具体处理分支。
    switch (value) {
      case 'black':
        // 返回 `type === 'foreground' ? chalk.black(str) : chalk.bgBlack(str)`，作为终端渲染这次计算的结果。
        return type === 'foreground' ? chalk.black(str) : chalk.bgBlack(str)
      case 'red':
        // 返回 `type === 'foreground' ? chalk.red(str) : chalk.bgRed(str)`，作为终端渲染这次计算的结果。
        return type === 'foreground' ? chalk.red(str) : chalk.bgRed(str)
      case 'green':
        // 返回 `type === 'foreground' ? chalk.green(str) : chalk.bgGreen(str)`，作为终端渲染这次计算的结果。
        return type === 'foreground' ? chalk.green(str) : chalk.bgGreen(str)
      case 'yellow':
        // 返回 `type === 'foreground' ? chalk.yellow(str) : chalk.bgYellow(str)`，作为终端渲染这次计算的结果。
        return type === 'foreground' ? chalk.yellow(str) : chalk.bgYellow(str)
      case 'blue':
        // 返回 `type === 'foreground' ? chalk.blue(str) : chalk.bgBlue(str)`，作为终端渲染这次计算的结果。
        return type === 'foreground' ? chalk.blue(str) : chalk.bgBlue(str)
      case 'magenta':
        // 返回 `type === 'foreground' ? chalk.magenta(str) : chalk.bgMagenta(str)`，作为终端渲染这次计算的结果。
        return type === 'foreground' ? chalk.magenta(str) : chalk.bgMagenta(str)
      case 'cyan':
        // 返回 `type === 'foreground' ? chalk.cyan(str) : chalk.bgCyan(str)`，作为终端渲染这次计算的结果。
        return type === 'foreground' ? chalk.cyan(str) : chalk.bgCyan(str)
      case 'white':
        // 返回 `type === 'foreground' ? chalk.white(str) : chalk.bgWhite(str)`，作为终端渲染这次计算的结果。
        return type === 'foreground' ? chalk.white(str) : chalk.bgWhite(str)
      case 'blackBright':
        // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
        return type === 'foreground'
          ? chalk.blackBright(str)
          : chalk.bgBlackBright(str)
      case 'redBright':
        // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
        return type === 'foreground'
          ? chalk.redBright(str)
          : chalk.bgRedBright(str)
      case 'greenBright':
        // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
        return type === 'foreground'
          ? chalk.greenBright(str)
          : chalk.bgGreenBright(str)
      case 'yellowBright':
        // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
        return type === 'foreground'
          ? chalk.yellowBright(str)
          : chalk.bgYellowBright(str)
      case 'blueBright':
        // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
        return type === 'foreground'
          ? chalk.blueBright(str)
          : chalk.bgBlueBright(str)
      case 'magentaBright':
        // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
        return type === 'foreground'
          ? chalk.magentaBright(str)
          : chalk.bgMagentaBright(str)
      case 'cyanBright':
        // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
        return type === 'foreground'
          ? chalk.cyanBright(str)
          : chalk.bgCyanBright(str)
      case 'whiteBright':
        // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
        return type === 'foreground'
          ? chalk.whiteBright(str)
          : chalk.bgWhiteBright(str)
    }
  }

  // 满足 `color.startsWith('#')` 时，终端渲染执行该分支。
  if (color.startsWith('#')) {
    // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
    return type === 'foreground'
      ? chalk.hex(color)(str)
      : chalk.bgHex(color)(str)
  }

  // 满足 `color.startsWith('ansi256')` 时，终端渲染执行该分支。
  if (color.startsWith('ansi256')) {
    // matches 集合保存`ANSI_REGEX.exec`，供终端渲染后续处理使用。
    const matches = ANSI_REGEX.exec(color)

    // matches 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!matches) {
      // 返回 `str`，作为终端渲染这次计算的结果。
      return str
    }

    // 取值保存`Number`，供终端渲染后续处理使用。
    const value = Number(matches[1])

    // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
    return type === 'foreground'
      ? chalk.ansi256(value)(str)
      : chalk.bgAnsi256(value)(str)
  }

  // 满足 `color.startsWith('rgb')` 时，终端渲染执行该分支。
  if (color.startsWith('rgb')) {
    // matches 集合保存`RGB_REGEX.exec`，供终端渲染后续处理使用。
    const matches = RGB_REGEX.exec(color)

    // matches 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!matches) {
      // 返回 `str`，作为终端渲染这次计算的结果。
      return str
    }

    // firstValue保存`Number`，供终端渲染后续处理使用。
    const firstValue = Number(matches[1])
    // secondValue保存`Number`，供终端渲染后续处理使用。
    const secondValue = Number(matches[2])
    // thirdValue保存`Number`，供终端渲染后续处理使用。
    const thirdValue = Number(matches[3])

    // 返回 `type === 'foreground'`，作为终端渲染这次计算的结果。
    return type === 'foreground'
      ? chalk.rgb(firstValue, secondValue, thirdValue)(str)
      : chalk.bgRgb(firstValue, secondValue, thirdValue)(str)
  }

  // 返回 `str`，作为终端渲染这次计算的结果。
  return str
}

/**
 * Apply TextStyles to a string using chalk.
 * This is the inverse of parsing ANSI codes - we generate them from structured styles.
 * Theme resolution happens at component layer, not here.
 */
// applyTextStyles 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyTextStyles(text: string, styles: TextStyles): string {
  // 结果保存`text`，供Ink 渲染层 colorize后续判断或输出使用。
  let result = text

  // Apply styles in reverse order of desired nesting.
  // chalk wraps text so later calls become outer wrappers.
  // Desired order (outermost to innermost):
  //   background > foreground > text modifiers
  // So we apply: text modifiers first, then foreground, then background last.

  // 满足 `styles.inverse` 时，终端渲染执行该分支。
  if (styles.inverse) {
    // 结果更新为 `chalk.inverse(result)`，确保Ink 渲染层后续读取最新状态。
    result = chalk.inverse(result)
  }

  // 满足 `styles.strikethrough` 时，终端渲染执行该分支。
  if (styles.strikethrough) {
    // 结果更新为 `chalk.strikethrough(result)`，确保Ink 渲染层后续读取最新状态。
    result = chalk.strikethrough(result)
  }

  // 满足 `styles.underline` 时，终端渲染执行该分支。
  if (styles.underline) {
    // 结果更新为 `chalk.underline(result)`，确保Ink 渲染层后续读取最新状态。
    result = chalk.underline(result)
  }

  // 满足 `styles.italic` 时，终端渲染执行该分支。
  if (styles.italic) {
    // 结果更新为 `chalk.italic(result)`，确保Ink 渲染层后续读取最新状态。
    result = chalk.italic(result)
  }

  // 满足 `styles.bold` 时，终端渲染执行该分支。
  if (styles.bold) {
    // 结果更新为 `chalk.bold(result)`，确保Ink 渲染层后续读取最新状态。
    result = chalk.bold(result)
  }

  // 满足 `styles.dim` 时，终端渲染执行该分支。
  if (styles.dim) {
    // 结果更新为 `chalk.dim(result)`，确保Ink 渲染层后续读取最新状态。
    result = chalk.dim(result)
  }

  // 满足 `styles.color` 时，终端渲染执行该分支。
  if (styles.color) {
    // Color is now always a raw color value (theme resolution happens at component layer)
    // 结果更新为 `colorize(result, styles.color, 'foreground')`，确保Ink 渲染层后续读取最新状态。
    result = colorize(result, styles.color, 'foreground')
  }

  // 满足 `styles.backgroundColor` 时，终端渲染执行该分支。
  if (styles.backgroundColor) {
    // backgroundColor is now always a raw color value
    // 结果更新为 `colorize(result, styles.backgroundColor, 'background')`，确保Ink 渲染层后续读取最新状态。
    result = colorize(result, styles.backgroundColor, 'background')
  }

  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}

/**
 * Apply a raw color value to text.
 * Theme resolution should happen at component layer, not here.
 */
// applyColor 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyColor(text: string, color: Color | undefined): string {
  // color缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!color) {
    // 返回 `text`，作为终端渲染这次计算的结果。
    return text
  }
  // 返回 `colorize(text, color, 'foreground')`，作为终端渲染这次计算的结果。
  return colorize(text, color, 'foreground')
}

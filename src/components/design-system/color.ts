// 复用 ColorType、colorize 终端界面组件，避免在这里重复拼装显示逻辑。
import { type ColorType, colorize } from '../../ink/colorize.js'
// 类型依赖 { Color } 来自 ../../ink/styles.js，用于校准终端渲染的数据契约。
import type { Color } from '../../ink/styles.js'
// 复用 getTheme、Theme、ThemeName 工具函数，把通用处理留在 ../../utils/theme.js 中维护。
import { getTheme, type Theme, type ThemeName } from '../../utils/theme.js'

/**
 * Curried theme-aware color function. Resolves theme keys to raw color
 * values before delegating to the ink renderer's colorize.
 */
// color 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function color(
  c: keyof Theme | Color | undefined,
  theme: ThemeName,
  type: ColorType = 'foreground',
): (text: string) => string {
  // 返回 `text => {`，作为终端渲染这次计算的结果。
  return text => {
    // c缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!c) {
      // 返回 `text`，作为终端渲染这次计算的结果。
      return text
    }
    // Raw color values bypass theme lookup
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      c.startsWith('rgb(') ||
      c.startsWith('#') ||
      c.startsWith('ansi256(') ||
      c.startsWith('ansi:')
    ) {
      // 返回 `colorize(text, c, type)`，作为终端渲染这次计算的结果。
      return colorize(text, c, type)
    }
    // Theme key lookup
    // 返回 `colorize(text, getTheme(theme)[c as keyof Theme], type)`，作为终端渲染这次计算的结果。
    return colorize(text, getTheme(theme)[c as keyof Theme], type)
  }
}

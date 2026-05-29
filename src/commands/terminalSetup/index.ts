// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js'

// Terminals that natively support CSI u / Kitty keyboard protocol
// NATIVE_CSIU_TERMINALS 集合 集中保存斜杠命令 index要一起传递的字段。
const NATIVE_CSIU_TERMINALS: Record<string, string> = {
  ghostty: 'Ghostty',
  kitty: 'Kitty',
  'iTerm.app': 'iTerm2',
  WezTerm: 'WezTerm',
}

// terminalSetup 集中保存命令处理斜杠命令 index要一起传递的字段。
const terminalSetup = {
  type: 'local-jsx',
  name: 'terminal-setup',
  description:
    env.terminal === 'Apple_Terminal'
      ? 'Enable Option+Enter key binding for newlines and visual bell'
      : 'Install Shift+Enter key binding for newlines',
  isHidden: env.terminal !== null && env.terminal in NATIVE_CSIU_TERMINALS,
  // 这个回调绑定到 load: () => import('./terminalSetup.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./terminalSetup.js'),
} satisfies Command

export default terminalSetup

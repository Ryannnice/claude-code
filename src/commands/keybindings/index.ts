// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 引入 isKeybindingCustomizationEnabled，将 ../../keybindings/loadUserBindings.js 中已经封装好的能力接到本文件流程里。
import { isKeybindingCustomizationEnabled } from '../../keybindings/loadUserBindings.js'

// keybindings 集合 集中保存命令处理斜杠命令 index要一起传递的字段。
const keybindings = {
  name: 'keybindings',
  description: 'Open or create your keybindings configuration file',
  // 这个回调绑定到 isEnabled: () => isKeybindingCustomizationEnabled(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => isKeybindingCustomizationEnabled(),
  supportsNonInteractive: false,
  type: 'local',
  // 这个回调绑定到 load: () => import('./keybindings.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./keybindings.js'),
} satisfies Command

export default keybindings

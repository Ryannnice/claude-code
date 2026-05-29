// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  isVoiceGrowthBookEnabled,
  isVoiceModeEnabled,
} from '../../voice/voiceModeEnabled.js'

// voice 集中保存命令处理斜杠命令 index要一起传递的字段。
const voice = {
  type: 'local',
  name: 'voice',
  description: 'Toggle voice mode',
  availability: ['claude-ai'],
  // 这个回调绑定到 isEnabled: () => isVoiceGrowthBookEnabled(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => isVoiceGrowthBookEnabled(),
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!isVoiceModeEnabled()`，作为命令处理这次计算的结果。
    return !isVoiceModeEnabled()
  },
  supportsNonInteractive: false,
  // 这个回调绑定到 load: () => import('./voice.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./voice.js'),
} satisfies Command

export default voice

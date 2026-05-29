// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  FAST_MODE_MODEL_DISPLAY,
  isFastModeEnabled,
} from '../../utils/fastMode.js'
// 复用 shouldInferenceConfigCommandBeImmediate 工具函数，把通用处理留在 ../../utils/immediateCommand.js 中维护。
import { shouldInferenceConfigCommandBeImmediate } from '../../utils/immediateCommand.js'

// fast 集中保存命令处理斜杠命令 index要一起传递的字段。
const fast = {
  type: 'local-jsx',
  name: 'fast',
  // 斜杠命令 index在这里处理 `get description() {`，完成这一小步状态转换。
  get description() {
    // 返回 ``Toggle fast mode (${FAST_MODE_MODEL_DISPLAY} only)``，作为命令处理这次计算的结果。
    return `Toggle fast mode (${FAST_MODE_MODEL_DISPLAY} only)`
  },
  availability: ['claude-ai', 'console'],
  // 这个回调绑定到 isEnabled: () => isFastModeEnabled(),，负责命令处理在该局部场景下的响应。
  isEnabled: () => isFastModeEnabled(),
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!isFastModeEnabled()`，作为命令处理这次计算的结果。
    return !isFastModeEnabled()
  },
  argumentHint: '[on|off]',
  // 斜杠命令 index在这里处理 `get immediate() {`，完成这一小步状态转换。
  get immediate() {
    // 返回 `shouldInferenceConfigCommandBeImmediate()`，作为命令处理这次计算的结果。
    return shouldInferenceConfigCommandBeImmediate()
  },
  // 这个回调绑定到 load: () => import('./fast.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./fast.js'),
} satisfies Command

export default fast

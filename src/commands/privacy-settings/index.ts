// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 isConsumerSubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isConsumerSubscriber } from '../../utils/auth.js'

// privacySettings 集合 集中保存命令处理斜杠命令 index要一起传递的字段。
const privacySettings = {
  type: 'local-jsx',
  name: 'privacy-settings',
  description: 'View and update your privacy settings',
  // 这个回调绑定到 isEnabled: () => {，负责命令处理在该局部场景下的响应。
  isEnabled: () => {
    // 返回 `isConsumerSubscriber()`，作为命令处理这次计算的结果。
    return isConsumerSubscriber()
  },
  // 这个回调绑定到 load: () => import('./privacy-settings.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./privacy-settings.js'),
} satisfies Command

export default privacySettings

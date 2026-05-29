// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'

// doctor 集中保存斜杠命令 index要一起传递的字段。
const doctor: Command = {
  name: 'doctor',
  description: 'Diagnose and verify your Claude Code installation and settings',
  // 这个回调绑定到 isEnabled: () => !isEnvTruthy(process.env.DISABLE_DOCTOR_COMMAND),，负责命令处理在该局部场景下的响应。
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_DOCTOR_COMMAND),
  type: 'local-jsx',
  // 这个回调绑定到 load: () => import('./doctor.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./doctor.js'),
}

export default doctor

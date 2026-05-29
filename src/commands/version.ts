// 类型依赖 { Command, LocalCommandCall } 来自 ../types/command.js，用于校准命令处理的数据契约。
import type { Command, LocalCommandCall } from '../types/command.js'

// 这个回调绑定到 const call: LocalCommandCall = async () => {，负责命令处理在该局部场景下的响应。
const call: LocalCommandCall = async () => {
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text',
    value: MACRO.BUILD_TIME
      ? `${MACRO.VERSION} (built ${MACRO.BUILD_TIME})`
      : MACRO.VERSION,
  }
}

// version 集中保存命令处理斜杠命令 version要一起传递的字段。
const version = {
  type: 'local',
  name: 'version',
  description:
    'Print the version this session is running (not what autoupdate downloaded)',
  // 这个回调绑定到 isEnabled: () => process.env.USER_TYPE === 'ant',，负责命令处理在该局部场景下的响应。
  isEnabled: () => process.env.USER_TYPE === 'ant',
  supportsNonInteractive: true,
  // 这个回调绑定到 load: () => Promise.resolve({ call }),，负责命令处理在该局部场景下的响应。
  load: () => Promise.resolve({ call }),
} satisfies Command

export default version

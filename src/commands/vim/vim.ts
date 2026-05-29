// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 类型依赖 { LocalCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandCall } from '../../types/command.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

// 这个回调绑定到 export const call: LocalCommandCall = async () => {，负责命令处理在该局部场景下的响应。
export const call: LocalCommandCall = async () => {
  // 配置读取`getGlobalConfig`，供命令处理后续处理使用。
  const config = getGlobalConfig()
  // currentMode标记命令处理斜杠命令 vim是否启用对应路径。
  let currentMode = config.editorMode || 'normal'

  // Handle backward compatibility - treat 'emacs' as 'normal'
  // 当 `currentMode` 匹配 `'emacs'` 时，命令处理执行对应分支。
  if (currentMode === 'emacs') {
    // currentMode更新为 `'normal'`，确保斜杠命令后续读取最新状态。
    currentMode = 'normal'
  }

  // newMode标记命令处理斜杠命令 vim是否启用对应路径。
  const newMode = currentMode === 'normal' ? 'vim' : 'normal'

  // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    editorMode: newMode,
  }))

  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_editor_mode_changed', {
    mode: newMode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    source:
      'command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text',
    value: `Editor mode set to ${newMode}. ${
      newMode === 'vim'
        ? 'Use Escape key to toggle between INSERT and NORMAL modes.'
        : 'Using standard (readline) keyboard bindings.'
    }`,
  }
}

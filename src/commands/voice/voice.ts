// 引入 normalizeLanguageForSTT，将 ../../hooks/useVoice.js 中已经封装好的能力接到本文件流程里。
import { normalizeLanguageForSTT } from '../../hooks/useVoice.js'
// 引入 getShortcutDisplay，将 ../../keybindings/shortcutFormat.js 中已经封装好的能力接到本文件流程里。
import { getShortcutDisplay } from '../../keybindings/shortcutFormat.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 类型依赖 { LocalCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandCall } from '../../types/command.js'
// 复用 isAnthropicAuthEnabled 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isAnthropicAuthEnabled } from '../../utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 复用 settingsChangeDetector 工具函数，把通用处理留在 ../../utils/settings/changeDetector.js 中维护。
import { settingsChangeDetector } from '../../utils/settings/changeDetector.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  updateSettingsForSource,
} from '../../utils/settings/settings.js'
// 引入 isVoiceModeEnabled，将 ../../voice/voiceModeEnabled.js 中已经封装好的能力接到本文件流程里。
import { isVoiceModeEnabled } from '../../voice/voiceModeEnabled.js'

// LANG_HINT_MAX_SHOWS 集合保存`2`，供命令处理斜杠命令 voice后续判断或输出使用。
const LANG_HINT_MAX_SHOWS = 2

// 这个回调绑定到 export const call: LocalCommandCall = async () => {，负责命令处理在该局部场景下的响应。
export const call: LocalCommandCall = async () => {
  // Check auth and kill-switch before allowing voice mode
  // 满足 `!isVoiceModeEnabled()` 时，命令处理执行该分支。
  if (!isVoiceModeEnabled()) {
    // Differentiate: OAuth-less users get an auth hint, everyone else
    // gets nothing (command shouldn't be reachable when the kill-switch is on).
    // 满足 `!isAnthropicAuthEnabled()` 时，命令处理执行该分支。
    if (!isAnthropicAuthEnabled()) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text' as const,
        value:
          'Voice mode requires a Claude.ai account. Please run /login to sign in.',
      }
    }
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value: 'Voice mode is not available.',
    }
  }

  // currentSettings 集合读取`getInitialSettings`，供命令处理后续处理使用。
  const currentSettings = getInitialSettings()
  // isCurrentlyEnabled标记命令处理斜杠命令 voice是否启用对应路径。
  const isCurrentlyEnabled = currentSettings.voiceEnabled === true

  // Toggle OFF — no checks needed
  // 满足 `isCurrentlyEnabled` 时，命令处理执行该分支。
  if (isCurrentlyEnabled) {
    // 结果保存`updateSettingsForSource`，供命令处理后续处理使用。
    const result = updateSettingsForSource('userSettings', {
      voiceEnabled: false,
    })
    // 满足 `result.error` 时，命令处理执行该分支。
    if (result.error) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text' as const,
        value:
          'Failed to update settings. Check your settings file for syntax errors.',
      }
    }
    // 调用 settingsChangeDetector.notifyChange，触发命令处理此处需要的副作用。
    settingsChangeDetector.notifyChange('userSettings')
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_voice_toggled', { enabled: false })
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value: 'Voice mode disabled.',
    }
  }

  // Toggle ON — run pre-flight checks first
  // 从 `await import(` 解构 isVoiceStreamAvailable，减少斜杠命令 voice对同一对象的重复访问。
  const { isVoiceStreamAvailable } = await import(
    '../../services/voiceStreamSTT.js'
  )
  // 从 `await import('../../services/voice.js')` 解构 checkRecordingAvailability，减少斜杠命令 voice对同一对象的重复访问。
  const { checkRecordingAvailability } = await import('../../services/voice.js')

  // Check recording availability (microphone access)
  // recording读取`checkRecordingAvailability`，供命令处理后续处理使用。
  const recording = await checkRecordingAvailability()
  // recording.available缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!recording.available) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value:
        recording.reason ?? 'Voice mode is not available in this environment.',
    }
  }

  // Check for API key
  // 满足 `!isVoiceStreamAvailable()` 时，命令处理执行该分支。
  if (!isVoiceStreamAvailable()) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value:
        'Voice mode requires a Claude.ai account. Please run /login to sign in.',
    }
  }

  // Check for recording tools
  // 从 `await import(` 解构 checkVoiceDependencies、requestMicrophonePermission，减少斜杠命令 voice对同一对象的重复访问。
  const { checkVoiceDependencies, requestMicrophonePermission } = await import(
    '../../services/voice.js'
  )
  // deps 集合读取`checkVoiceDependencies`，供命令处理后续处理使用。
  const deps = await checkVoiceDependencies()
  // deps.available缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!deps.available) {
    // hint保存`deps.installCommand`，供命令处理斜杠命令 voice后续判断或输出使用。
    const hint = deps.installCommand
      ? `\nInstall audio recording tools? Run: ${deps.installCommand}`
      : '\nInstall SoX manually for audio recording.'
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value: `No audio recording tool found.${hint}`,
    }
  }

  // Probe mic access so the OS permission dialog fires now rather than
  // on the user's first hold-to-talk activation.
  // 满足 `!(await requestMicrophonePermission())` 时，命令处理执行该分支。
  if (!(await requestMicrophonePermission())) {
    // guidance 先占位，稍后的条件分支会根据实际输入补齐它。
    let guidance: string
    // 当 `process.platform` 匹配 `'win32'` 时，命令处理执行对应分支。
    if (process.platform === 'win32') {
      // guidance更新为 `'Settings \u2192 Privacy \u2192 Microphone'`，确保斜杠命令后续读取最新状态。
      guidance = 'Settings \u2192 Privacy \u2192 Microphone'
    // 斜杠命令 voice在这里处理 `} else if (process.platform === 'linux') {`，完成这一小步状态转换。
    } else if (process.platform === 'linux') {
      // guidance更新为 `"your system's audio settings"`，确保斜杠命令后续读取最新状态。
      guidance = "your system's audio settings"
    } else {
      // guidance更新为 `'System Settings \u2192 Privacy & Security \u2192 Microph...`，确保斜杠命令后续读取最新状态。
      guidance = 'System Settings \u2192 Privacy & Security \u2192 Microphone'
    }
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value: `Microphone access is denied. To enable it, go to ${guidance}, then run /voice again.`,
    }
  }

  // All checks passed — enable voice
  // 结果保存`updateSettingsForSource`，供命令处理后续处理使用。
  const result = updateSettingsForSource('userSettings', { voiceEnabled: true })
  // 满足 `result.error` 时，命令处理执行该分支。
  if (result.error) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text' as const,
      value:
        'Failed to update settings. Check your settings file for syntax errors.',
    }
  }
  // 调用 settingsChangeDetector.notifyChange，触发命令处理此处需要的副作用。
  settingsChangeDetector.notifyChange('userSettings')
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_voice_toggled', { enabled: true })
  // 按键读取`getShortcutDisplay`，供命令处理后续处理使用。
  const key = getShortcutDisplay('voice:pushToTalk', 'Chat', 'Space')
  // stt保存`normalizeLanguageForSTT`，供命令处理后续处理使用。
  const stt = normalizeLanguageForSTT(currentSettings.language)
  // cfg读取`getGlobalConfig`，供命令处理后续处理使用。
  const cfg = getGlobalConfig()
  // Reset the hint counter whenever the resolved STT language changes
  // (including first-ever enable, where lastLanguage is undefined).
  // langChanged标记命令处理斜杠命令 voice是否启用对应路径。
  const langChanged = cfg.voiceLangHintLastLanguage !== stt.code
  // priorCount 数量 命名 `langChanged ? 0 : (cfg.voiceLangHintShownCount ?? 0)`，让后续代码直接表达这个值的用途。
  const priorCount = langChanged ? 0 : (cfg.voiceLangHintShownCount ?? 0)
  // showHint标记命令处理斜杠命令 voice是否启用对应路径。
  const showHint = !stt.fellBackFrom && priorCount < LANG_HINT_MAX_SHOWS
  // langNote保存`''`，作为后续固定文本处理的输入。
  let langNote = ''
  // 满足 `stt.fellBackFrom` 时，命令处理执行该分支。
  if (stt.fellBackFrom) {
    // langNote更新为 `` Note: "${stt.fellBackFrom}" is not a supported dictatio...`，确保斜杠命令后续读取最新状态。
    langNote = ` Note: "${stt.fellBackFrom}" is not a supported dictation language; using English. Change it via /config.`
  // 斜杠命令 voice在这里处理 `} else if (showHint) {`，完成这一小步状态转换。
  } else if (showHint) {
    // langNote更新为 `` Dictation language: ${stt.code} (/config to change).``，确保斜杠命令后续读取最新状态。
    langNote = ` Dictation language: ${stt.code} (/config to change).`
  }
  // 只有 `langChanged || showHint` 满足时，命令处理才执行该分支。
  if (langChanged || showHint) {
    // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
    saveGlobalConfig(prev => ({
      ...prev,
      voiceLangHintShownCount: priorCount + (showHint ? 1 : 0),
      voiceLangHintLastLanguage: stt.code,
    }))
  }
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text' as const,
    value: `Voice mode enabled. Hold ${key} to record.${langNote}`,
  }
}

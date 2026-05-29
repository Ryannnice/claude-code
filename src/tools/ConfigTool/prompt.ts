// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 复用 getModelOptions 工具函数，把通用处理留在 ../../utils/model/modelOptions.js 中维护。
import { getModelOptions } from '../../utils/model/modelOptions.js'
// 引入 isVoiceGrowthBookEnabled，将 ../../voice/voiceModeEnabled.js 中已经封装好的能力接到本文件流程里。
import { isVoiceGrowthBookEnabled } from '../../voice/voiceModeEnabled.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getOptionsForSetting,
  SUPPORTED_SETTINGS,
} from './supportedSettings.js'

// DESCRIPTION 命名 `'Get or set Claude Code configuration settings.'`，让后续代码直接表达这个值的用途。
export const DESCRIPTION = 'Get or set Claude Code configuration settings.'

/**
 * Generate the prompt documentation from the registry
 */
// generatePrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generatePrompt(): string {
  // globalSettings 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const globalSettings: string[] = []
  // projectSettings 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const projectSettings: string[] = []

  // 循环处理 `const [key, config] of Object.entries(SUPPORTED_SETTINGS)`，让工具调用把同类条目按顺序走完。
  for (const [key, config] of Object.entries(SUPPORTED_SETTINGS)) {
    // Skip model - it gets its own section with dynamic options
    // 当 `key` 匹配 `'model'` 时，工具调用执行对应分支。
    if (key === 'model') continue
    // Voice settings are registered at build-time but gated by GrowthBook
    // at runtime. Hide from model prompt when the kill-switch is on.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      feature('VOICE_MODE') &&
      key === 'voiceEnabled' &&
      !isVoiceGrowthBookEnabled()
    )
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue

    // 选项读取`getOptionsForSetting`，供工具调用后续处理使用。
    const options = getOptionsForSetting(key)
    // line固定为 ``- ${key}``，作为工具实现 prompt后续展示或比较的基准。
    let line = `- ${key}`

    // 满足 `options` 时，工具调用执行该分支。
    if (options) {
      // 这个回调绑定到 line += `: ${options.map(o => `"${o}"`).join(', ')}`，负责工具调用在该局部场景下的响应。
      line += `: ${options.map(o => `"${o}"`).join(', ')}`
    // 工具实现 prompt在这里处理 `} else if (config.type === 'boolean') {`，完成这一小步状态转换。
    } else if (config.type === 'boolean') {
      // 工具实现 prompt在这里处理 `line += `: true/false``，完成这一小步状态转换。
      line += `: true/false`
    }

    // 工具实现 prompt在这里处理 `line += ` - ${config.description}``，完成这一小步状态转换。
    line += ` - ${config.description}`

    // 当 `config.source` 匹配 `'global'` 时，工具调用执行对应分支。
    if (config.source === 'global') {
      // globalSettings 集合追加新条目，保持收集顺序与输入顺序一致。
      globalSettings.push(line)
    } else {
      // projectSettings 集合追加新条目，保持收集顺序与输入顺序一致。
      projectSettings.push(line)
    }
  }

  // modelSection保存`generateModelSection`，供工具调用后续处理使用。
  const modelSection = generateModelSection()

  // 返回 ``Get or set Claude Code configuration settings.`，作为工具调用这次计算的结果。
  return `Get or set Claude Code configuration settings.

  View or change Claude Code settings. Use when the user requests configuration changes, asks about current settings, or when adjusting a setting would benefit them.


## Usage
- **Get current value:** Omit the "value" parameter
- **Set new value:** Include the "value" parameter

## Configurable settings list
The following settings are available for you to change:

### Global Settings (stored in ~/.claude.json)
${globalSettings.join('\n')}

### Project Settings (stored in settings.json)
${projectSettings.join('\n')}

${modelSection}
## Examples
- Get theme: { "setting": "theme" }
- Set dark theme: { "setting": "theme", "value": "dark" }
- Enable vim mode: { "setting": "editorMode", "value": "vim" }
- Enable verbose: { "setting": "verbose", "value": true }
- Change model: { "setting": "model", "value": "opus" }
- Change permission mode: { "setting": "permissions.defaultMode", "value": "plan" }
`
}

// generateModelSection 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateModelSection(): string {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 选项读取`getModelOptions`，供工具调用后续处理使用。
    const options = getModelOptions()
    // 文本行派生`options.map`，供工具调用后续处理使用。
    const lines = options.map(o => {
      // 取值标记工具实现 prompt是否启用对应路径。
      const value = o.value === null ? 'null/"default"' : `"${o.value}"`
      // 返回 `` - ${value}: ${o.descriptionForModel ?? o.description}``，作为工具调用这次计算的结果。
      return `  - ${value}: ${o.descriptionForModel ?? o.description}`
    })
    // 返回 ``## Model`，作为工具调用这次计算的结果。
    return `## Model
- model - Override the default model. Available options:
${lines.join('\n')}`
  } catch {
    // 返回 ``## Model`，作为工具调用这次计算的结果。
    return `## Model
- model - Override the default model (sonnet, opus, haiku, best, or full model ID)`
  }
}

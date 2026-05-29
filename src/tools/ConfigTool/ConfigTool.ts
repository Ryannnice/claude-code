// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type GlobalConfig,
  getGlobalConfig,
  getRemoteControlAtStartup,
  saveGlobalConfig,
} from '../../utils/config.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  updateSettingsForSource,
} from '../../utils/settings/settings.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 CONFIG_TOOL_NAME，将 ./constants.js 中已经封装好的能力接到本文件流程里。
import { CONFIG_TOOL_NAME } from './constants.js'
// 引入 DESCRIPTION、generatePrompt，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, generatePrompt } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getConfig,
  getOptionsForSetting,
  getPath,
  isSupported,
} from './supportedSettings.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  renderToolResultMessage,
  renderToolUseMessage,
  renderToolUseRejectedMessage,
} from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    setting: z
      .string()
      .describe(
        'The setting key (e.g., "theme", "model", "permissions.defaultMode")',
      ),
    value: z
      .union([z.string(), z.boolean(), z.number()])
      .optional()
      .describe('The new value. Omit to get current value.'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean(),
    operation: z.enum(['get', 'set']).optional(),
    setting: z.string().optional(),
    value: z.unknown().optional(),
    previousValue: z.unknown().optional(),
    newValue: z.unknown().optional(),
    error: z.string().optional(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Input 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<InputSchema>
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// ConfigTool 配置构建`buildTool`，供工具调用后续处理使用。
export const ConfigTool = buildTool({
  name: CONFIG_TOOL_NAME,
  searchHint: 'get or set Claude Code settings (theme, model)',
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `generatePrompt()`，作为工具调用这次计算的结果。
    return generatePrompt()
  },
  // 工具实现 Config Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Config Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'Config'`，作为工具调用这次计算的结果。
    return 'Config'
  },
  shouldDefer: true,
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 input: Input 判断工具调用是否满足条件。
  isReadOnly(input: Input) {
    // 返回 `input.value === undefined`，作为工具调用这次计算的结果。
    return input.value === undefined
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.value === undefined`，作为工具调用这次计算的结果。
    return input.value === undefined
      ? input.setting
      : `${input.setting} = ${input.value}`
  },
  // checkPermissions 使用 input: Input 完成工具调用里的对应操作。
  async checkPermissions(input: Input) {
    // Auto-allow reading configs
    // 满足 `input.value === undefined` 时，工具调用执行该分支。
    if (input.value === undefined) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { behavior: 'allow' as const, updatedInput: input }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask' as const,
      message: `Set ${input.setting} to ${jsonStringify(input.value)}`,
    }
  },
  renderToolUseMessage,
  renderToolResultMessage,
  renderToolUseRejectedMessage,
  // call 使用 { setting, value }: Input, context 完成工具调用里的对应操作。
  async call({ setting, value }: Input, context): Promise<{ data: Output }> {
    // 1. Check if setting is supported
    // Voice settings are registered at build-time (feature('VOICE_MODE')), but
    // must also be gated at runtime. When the kill-switch is on, treat
    // voiceEnabled as an unknown setting so no voice-specific strings leak.
    // 当 `feature('VOICE_MODE') && setting` 匹配 `'voiceEnabled'` 时，工具调用执行对应分支。
    if (feature('VOICE_MODE') && setting === 'voiceEnabled') {
      // 从 `await import(` 解构 isVoiceGrowthBookEnabled，减少工具实现 Config Tool对同一对象的重复访问。
      const { isVoiceGrowthBookEnabled } = await import(
        '../../voice/voiceModeEnabled.js'
      )
      // 满足 `!isVoiceGrowthBookEnabled()` 时，工具调用执行该分支。
      if (!isVoiceGrowthBookEnabled()) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: { success: false, error: `Unknown setting: "${setting}"` },
        }
      }
    }
    // 满足 `!isSupported(setting)` 时，工具调用执行该分支。
    if (!isSupported(setting)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: { success: false, error: `Unknown setting: "${setting}"` },
      }
    }

    // 配置读取`getConfig`，供工具调用后续处理使用。
    const config = getConfig(setting)!
    // 路径读取`getPath`，供工具调用后续处理使用。
    const path = getPath(setting)

    // 2. GET operation
    // 满足 `value === undefined` 时，工具调用执行该分支。
    if (value === undefined) {
      // currentValue读取`getValue`，供工具调用后续处理使用。
      const currentValue = getValue(config.source, path)
      // displayValue格式化`config.formatOnRead` 整理出中间结果，供工具实现 Config Tool后续步骤使用。
      const displayValue = config.formatOnRead
        ? config.formatOnRead(currentValue)
        : currentValue
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: { success: true, operation: 'get', setting, value: displayValue },
      }
    }

    // 3. SET operation

    // Handle "default" — unset the config key so it falls back to the
    // platform-aware default (determined by the bridge feature gate).
    // 工具调用在这里按实际状态进入对应分支。
    if (
      setting === 'remoteControlAtStartup' &&
      typeof value === 'string' &&
      value.toLowerCase().trim() === 'default'
    ) {
      // 调用 saveGlobalConfig，触发工具调用此处需要的副作用。
      saveGlobalConfig(prev => {
        // 满足 `prev.remoteControlAtStartup === undefined` 时，工具调用执行该分支。
        if (prev.remoteControlAtStartup === undefined) return prev
        // next集中保存工具实现 Config Tool要一起传递的字段。
        const next = { ...prev }
        // 工具实现 Config Tool在这里处理 `delete next.remoteControlAtStartup`，完成这一小步状态转换。
        delete next.remoteControlAtStartup
        // 返回 `next`，作为工具调用这次计算的结果。
        return next
      })
      // resolved读取`getRemoteControlAtStartup`，供工具调用后续处理使用。
      const resolved = getRemoteControlAtStartup()
      // Sync to AppState so useReplBridge reacts immediately
      // context.setAppState 写入新的状态值，使工具调用后续读取保持一致。
      context.setAppState(prev => {
        // 只有 `prev.replBridgeEnabled === resolved && !prev.replBridgeOutboundOnly` 满足时，工具调用才执行该分支。
        if (prev.replBridgeEnabled === resolved && !prev.replBridgeOutboundOnly)
          // 返回 `prev`，作为工具调用这次计算的结果。
          return prev
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          ...prev,
          replBridgeEnabled: resolved,
          replBridgeOutboundOnly: false,
        }
      })
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          success: true,
          operation: 'set',
          setting,
          value: resolved,
        },
      }
    }

    // finalValue 命名 `value`，让后续代码直接表达这个值的用途。
    let finalValue: unknown = value

    // Coerce and validate boolean values
    // 当 `config.type` 匹配 `'boolean'` 时，工具调用执行对应分支。
    if (config.type === 'boolean') {
      // 当 `typeof value` 匹配 `'string'` 时，工具调用执行对应分支。
      if (typeof value === 'string') {
        // lower保存`value.toLowerCase`，供工具调用后续处理使用。
        const lower = value.toLowerCase().trim()
        // 当 `lower` 匹配 `'true'` 时，工具调用执行对应分支。
        if (lower === 'true') finalValue = true
        else if (lower === 'false') finalValue = false
      }
      // `typeof finalValue` 与 `'boolean'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof finalValue !== 'boolean') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: false,
            operation: 'set',
            setting,
            error: `${setting} requires true or false.`,
          },
        }
      }
    }

    // Check options
    // 选项读取`getOptionsForSetting`，供工具调用后续处理使用。
    const options = getOptionsForSetting(setting)
    // 只有 `options && !options.includes(String(finalValue))` 满足时，工具调用才执行该分支。
    if (options && !options.includes(String(finalValue))) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          success: false,
          operation: 'set',
          setting,
          error: `Invalid value "${value}". Options: ${options.join(', ')}`,
        },
      }
    }

    // Async validation (e.g., model API check)
    // 满足 `config.validateOnWrite` 时，工具调用执行该分支。
    if (config.validateOnWrite) {
      // 结果读取`config.validateOnWrite`，供工具调用后续处理使用。
      const result = await config.validateOnWrite(finalValue)
      // result.valid缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!result.valid) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: false,
            operation: 'set',
            setting,
            error: result.error,
          },
        }
      }
    }

    // Pre-flight checks for voice mode
    // 工具调用在这里按实际状态进入对应分支。
    if (
      feature('VOICE_MODE') &&
      setting === 'voiceEnabled' &&
      finalValue === true
    ) {
      // 从 `await import(` 解构 isVoiceModeEnabled，减少工具实现 Config Tool对同一对象的重复访问。
      const { isVoiceModeEnabled } = await import(
        '../../voice/voiceModeEnabled.js'
      )
      // 满足 `!isVoiceModeEnabled()` 时，工具调用执行该分支。
      if (!isVoiceModeEnabled()) {
        // 从 `await import('../../utils/auth.js')` 解构 isAnthropicAuthEnabled，减少工具实现 Config Tool对同一对象的重复访问。
        const { isAnthropicAuthEnabled } = await import('../../utils/auth.js')
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: false,
            error: !isAnthropicAuthEnabled()
              ? 'Voice mode requires a Claude.ai account. Please run /login to sign in.'
              : 'Voice mode is not available.',
          },
        }
      }
      // 从 `await import(` 解构 isVoiceStreamAvailable，减少工具实现 Config Tool对同一对象的重复访问。
      const { isVoiceStreamAvailable } = await import(
        '../../services/voiceStreamSTT.js'
      )
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        checkRecordingAvailability,
        checkVoiceDependencies,
        requestMicrophonePermission,
      } = await import('../../services/voice.js')

      // recording读取`checkRecordingAvailability`，供工具调用后续处理使用。
      const recording = await checkRecordingAvailability()
      // recording.available缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!recording.available) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: false,
            error:
              recording.reason ??
              'Voice mode is not available in this environment.',
          },
        }
      }
      // 满足 `!isVoiceStreamAvailable()` 时，工具调用执行该分支。
      if (!isVoiceStreamAvailable()) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: false,
            error:
              'Voice mode requires a Claude.ai account. Please run /login to sign in.',
          },
        }
      }
      // deps 集合读取`checkVoiceDependencies`，供工具调用后续处理使用。
      const deps = await checkVoiceDependencies()
      // deps.available缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!deps.available) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: false,
            error:
              'No audio recording tool found.' +
              (deps.installCommand ? ` Run: ${deps.installCommand}` : ''),
          },
        }
      }
      // 满足 `!(await requestMicrophonePermission())` 时，工具调用执行该分支。
      if (!(await requestMicrophonePermission())) {
        // guidance 先占位，稍后的条件分支会根据实际输入补齐它。
        let guidance: string
        // 当 `process.platform` 匹配 `'win32'` 时，工具调用执行对应分支。
        if (process.platform === 'win32') {
          // guidance更新为 `'Settings \u2192 Privacy \u2192 Microphone'`，确保工具调用后续读取最新状态。
          guidance = 'Settings \u2192 Privacy \u2192 Microphone'
        // 工具实现 Config Tool在这里处理 `} else if (process.platform === 'linux') {`，完成这一小步状态转换。
        } else if (process.platform === 'linux') {
          // guidance更新为 `"your system's audio settings"`，确保工具调用后续读取最新状态。
          guidance = "your system's audio settings"
        } else {
          // 工具实现 Config Tool在这里处理 `guidance =`，完成这一小步状态转换。
          guidance =
            'System Settings \u2192 Privacy & Security \u2192 Microphone'
        }
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          data: {
            success: false,
            error: `Microphone access is denied. To enable it, go to ${guidance}, then try again.`,
          },
        }
      }
    }

    // previousValue读取`getValue`，供工具调用后续处理使用。
    const previousValue = getValue(config.source, path)

    // 4. Write to storage
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 当 `config.source` 匹配 `'global'` 时，工具调用执行对应分支。
      if (config.source === 'global') {
        // key保存`path[0]`，供工具实现 Config Tool后续判断或输出使用。
        const key = path[0]
        // key缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!key) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            data: {
              success: false,
              operation: 'set',
              setting,
              error: 'Invalid setting path',
            },
          }
        }
        // 调用 saveGlobalConfig，触发工具调用此处需要的副作用。
        saveGlobalConfig(prev => {
          // 满足 `prev[key as keyof GlobalConfig] === finalValue` 时，工具调用执行该分支。
          if (prev[key as keyof GlobalConfig] === finalValue) return prev
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return { ...prev, [key]: finalValue }
        })
      } else {
        // update构建`buildNestedObject`，供工具调用后续处理使用。
        const update = buildNestedObject(path, finalValue)
        // 结果保存`updateSettingsForSource`，供工具调用后续处理使用。
        const result = updateSettingsForSource('userSettings', update)
        // 满足 `result.error` 时，工具调用执行该分支。
        if (result.error) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            data: {
              success: false,
              operation: 'set',
              setting,
              error: result.error.message,
            },
          }
        }
      }

      // 5a. Voice needs notifyChange so applySettingsChange resyncs
      // AppState.settings (useVoiceEnabled reads settings.voiceEnabled)
      // and the settings cache resets for the next /voice read.
      // 当 `feature('VOICE_MODE') && setting` 匹配 `'voiceEnabled'` 时，工具调用执行对应分支。
      if (feature('VOICE_MODE') && setting === 'voiceEnabled') {
        // 从 `await import(` 解构 settingsChangeDetector，减少工具实现 Config Tool对同一对象的重复访问。
        const { settingsChangeDetector } = await import(
          '../../utils/settings/changeDetector.js'
        )
        // 调用 settingsChangeDetector.notifyChange，触发工具调用此处需要的副作用。
        settingsChangeDetector.notifyChange('userSettings')
      }

      // 5b. Sync to AppState if needed for immediate UI effect
      // 满足 `config.appStateKey` 时，工具调用执行该分支。
      if (config.appStateKey) {
        // appKey保存`config.appStateKey`，供工具实现 Config Tool后续判断或输出使用。
        const appKey = config.appStateKey
        // context.setAppState 写入新的状态值，使工具调用后续读取保持一致。
        context.setAppState(prev => {
          // 满足 `prev[appKey] === finalValue` 时，工具调用执行该分支。
          if (prev[appKey] === finalValue) return prev
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return { ...prev, [appKey]: finalValue }
        })
      }

      // Sync remoteControlAtStartup to AppState so the bridge reacts
      // immediately (the config key differs from the AppState field name,
      // so the generic appStateKey mechanism can't handle this).
      // 当 `setting` 匹配 `'remoteControlAtStartup'` 时，工具调用执行对应分支。
      if (setting === 'remoteControlAtStartup') {
        // resolved读取`getRemoteControlAtStartup`，供工具调用后续处理使用。
        const resolved = getRemoteControlAtStartup()
        // context.setAppState 写入新的状态值，使工具调用后续读取保持一致。
        context.setAppState(prev => {
          // 工具调用在这里按实际状态进入对应分支。
          if (
            prev.replBridgeEnabled === resolved &&
            !prev.replBridgeOutboundOnly
          )
            // 返回 `prev`，作为工具调用这次计算的结果。
            return prev
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            ...prev,
            replBridgeEnabled: resolved,
            replBridgeOutboundOnly: false,
          }
        })
      }

      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_config_tool_changed', {
        setting:
          setting as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        value: String(
          finalValue,
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          success: true,
          operation: 'set',
          setting,
          previousValue,
          newValue: finalValue,
        },
      }
    } catch (error) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: {
          success: false,
          operation: 'set',
          setting,
          error: errorMessage(error),
        },
      }
    }
  },
  // mapToolResultToToolResultBlockParam 使用 content: Output, toolUseID: string 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(content: Output, toolUseID: string) {
    // 满足 `content.success` 时，工具调用执行该分支。
    if (content.success) {
      // 当 `content.operation` 匹配 `'get'` 时，工具调用执行对应分支。
      if (content.operation === 'get') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          tool_use_id: toolUseID,
          type: 'tool_result' as const,
          content: `${content.setting} = ${jsonStringify(content.value)}`,
        }
      }
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        tool_use_id: toolUseID,
        type: 'tool_result' as const,
        content: `Set ${content.setting} to ${jsonStringify(content.newValue)}`,
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: `Error: ${content.error}`,
      is_error: true,
    }
  },
} satisfies ToolDef<InputSchema, Output>)

// getValue 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getValue(source: 'global' | 'settings', path: string[]): unknown {
  // 当 `source` 匹配 `'global'` 时，工具调用执行对应分支。
  if (source === 'global') {
    // 配置读取`getGlobalConfig`，供工具调用后续处理使用。
    const config = getGlobalConfig()
    // key保存`path[0]`，供工具实现 Config Tool后续判断或输出使用。
    const key = path[0]
    // key缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!key) return undefined
    // 返回 `config[key as keyof GlobalConfig]`，作为工具调用这次计算的结果。
    return config[key as keyof GlobalConfig]
  }
  // settings 集合读取`getInitialSettings`，供工具调用后续处理使用。
  const settings = getInitialSettings()
  // current 命名 `settings`，让后续代码直接表达这个值的用途。
  let current: unknown = settings
  // 按顺序遍历 `path` 中的key，逐个交给工具调用处理。
  for (const key of path) {
    // 只有 `current && typeof current === 'object' && key in` 满足时，工具调用才执行该分支。
    if (current && typeof current === 'object' && key in current) {
      // current更新为 `(current as Record<string, unknown>)[key]`，确保工具调用后续读取最新状态。
      current = (current as Record<string, unknown>)[key]
    } else {
      // 返回 `undefined`，作为工具调用这次计算的结果。
      return undefined
    }
  }
  // 返回 `current`，作为工具调用这次计算的结果。
  return current
}

// buildNestedObject 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildNestedObject(
  path: string[],
  value: unknown,
): Record<string, unknown> {
  // 路径为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (path.length === 0) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {}
  }
  // key 命名 `path[0]!`，让后续代码直接表达这个值的用途。
  const key = path[0]!
  // 满足 `path.length === 1` 时，工具调用执行该分支。
  if (path.length === 1) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { [key]: value }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { [key]: buildNestedObject(path.slice(1), value) }
}

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 复用 getRemoteControlAtStartup 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getRemoteControlAtStartup } from '../../utils/config.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  EDITOR_MODES,
  NOTIFICATION_CHANNELS,
  TEAMMATE_MODES,
} from '../../utils/configConstants.js'
// 复用 getModelOptions 工具函数，把通用处理留在 ../../utils/model/modelOptions.js 中维护。
import { getModelOptions } from '../../utils/model/modelOptions.js'
// 复用 validateModel 工具函数，把通用处理留在 ../../utils/model/validateModel.js 中维护。
import { validateModel } from '../../utils/model/validateModel.js'
// 复用 THEME_NAMES、THEME_SETTINGS 工具函数，把通用处理留在 ../../utils/theme.js 中维护。
import { THEME_NAMES, THEME_SETTINGS } from '../../utils/theme.js'

/** AppState keys that can be synced for immediate UI effect */
// SyncableAppStateKey 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type SyncableAppStateKey = 'verbose' | 'mainLoopModel' | 'thinkingEnabled'

// SettingConfig 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type SettingConfig = {
  source: 'global' | 'settings'
  type: 'boolean' | 'string'
  description: string
  path?: string[]
  options?: readonly string[]
  // 这个回调绑定到 getOptions?: () => string[]，负责工具调用在该局部场景下的响应。
  getOptions?: () => string[]
  appStateKey?: SyncableAppStateKey
  /** Async validation called when writing/setting a value */
  // 这个回调绑定到 validateOnWrite?: (v: unknown) => Promise<{ valid: boolean; error?: string }>，负责工具调用在该局部场景下的响应。
  validateOnWrite?: (v: unknown) => Promise<{ valid: boolean; error?: string }>
  /** Format value when reading/getting for display */
  // 这个回调绑定到 formatOnRead?: (v: unknown) => unknown，负责工具调用在该局部场景下的响应。
  formatOnRead?: (v: unknown) => unknown
}

// SUPPORTED_SETTINGS 集合 集中保存工具实现 supported Settings要一起传递的字段。
export const SUPPORTED_SETTINGS: Record<string, SettingConfig> = {
  theme: {
    source: 'global',
    type: 'string',
    description: 'Color theme for the UI',
    options: feature('AUTO_THEME') ? THEME_SETTINGS : THEME_NAMES,
  },
  editorMode: {
    source: 'global',
    type: 'string',
    description: 'Key binding mode',
    options: EDITOR_MODES,
  },
  verbose: {
    source: 'global',
    type: 'boolean',
    description: 'Show detailed debug output',
    appStateKey: 'verbose',
  },
  preferredNotifChannel: {
    source: 'global',
    type: 'string',
    description: 'Preferred notification channel',
    options: NOTIFICATION_CHANNELS,
  },
  autoCompactEnabled: {
    source: 'global',
    type: 'boolean',
    description: 'Auto-compact when context is full',
  },
  autoMemoryEnabled: {
    source: 'settings',
    type: 'boolean',
    description: 'Enable auto-memory',
  },
  autoDreamEnabled: {
    source: 'settings',
    type: 'boolean',
    description: 'Enable background memory consolidation',
  },
  fileCheckpointingEnabled: {
    source: 'global',
    type: 'boolean',
    description: 'Enable file checkpointing for code rewind',
  },
  showTurnDuration: {
    source: 'global',
    type: 'boolean',
    description:
      'Show turn duration message after responses (e.g., "Cooked for 1m 6s")',
  },
  terminalProgressBarEnabled: {
    source: 'global',
    type: 'boolean',
    description: 'Show OSC 9;4 progress indicator in supported terminals',
  },
  todoFeatureEnabled: {
    source: 'global',
    type: 'boolean',
    description: 'Enable todo/task tracking',
  },
  model: {
    source: 'settings',
    type: 'string',
    description: 'Override the default model',
    appStateKey: 'mainLoopModel',
    // 这个回调绑定到 getOptions: () => {，负责工具调用在该局部场景下的响应。
    getOptions: () => {
      // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
      try {
        // 返回 `getModelOptions()`，作为工具调用这次计算的结果。
        return getModelOptions()
          .filter(o => o.value !== null)
          .map(o => o.value as string)
      } catch {
        // 返回列表结果，保留工具调用已经排好的条目顺序。
        return ['sonnet', 'opus', 'haiku']
      }
    },
    // 这个回调绑定到 validateOnWrite: v => validateModel(String(v)),，负责工具调用在该局部场景下的响应。
    validateOnWrite: v => validateModel(String(v)),
    // 这个回调绑定到 formatOnRead: v => (v === null ? 'default' : v),，负责工具调用在该局部场景下的响应。
    formatOnRead: v => (v === null ? 'default' : v),
  },
  alwaysThinkingEnabled: {
    source: 'settings',
    type: 'boolean',
    description: 'Enable extended thinking (false to disable)',
    appStateKey: 'thinkingEnabled',
  },
  'permissions.defaultMode': {
    source: 'settings',
    type: 'string',
    description: 'Default permission mode for tool usage',
    options: feature('TRANSCRIPT_CLASSIFIER')
      ? ['default', 'plan', 'acceptEdits', 'dontAsk', 'auto']
      : ['default', 'plan', 'acceptEdits', 'dontAsk'],
  },
  language: {
    source: 'settings',
    type: 'string',
    description:
      'Preferred language for Claude responses and voice dictation (e.g., "japanese", "spanish")',
  },
  teammateMode: {
    source: 'global',
    type: 'string',
    description:
      'How to spawn teammates: "tmux" for traditional tmux, "in-process" for same process, "auto" to choose automatically',
    options: TEAMMATE_MODES,
  },
  ...(process.env.USER_TYPE === 'ant'
    ? {
        classifierPermissionsEnabled: {
          source: 'settings' as const,
          type: 'boolean' as const,
          description:
            'Enable AI-based classification for Bash(prompt:...) permission rules',
        },
      }
    : {}),
  ...(feature('VOICE_MODE')
    ? {
        voiceEnabled: {
          source: 'settings' as const,
          type: 'boolean' as const,
          description: 'Enable voice dictation (hold-to-talk)',
        },
      }
    : {}),
  ...(feature('BRIDGE_MODE')
    ? {
        remoteControlAtStartup: {
          source: 'global' as const,
          type: 'boolean' as const,
          description:
            'Enable Remote Control for all sessions (true | false | default)',
          // 这个回调绑定到 formatOnRead: () => getRemoteControlAtStartup(),，负责工具调用在该局部场景下的响应。
          formatOnRead: () => getRemoteControlAtStartup(),
        },
      }
    : {}),
  ...(feature('KAIROS') || feature('KAIROS_PUSH_NOTIFICATION')
    ? {
        taskCompleteNotifEnabled: {
          source: 'global' as const,
          type: 'boolean' as const,
          description:
            'Push to your mobile device when idle after Claude finishes (requires Remote Control)',
        },
        inputNeededNotifEnabled: {
          source: 'global' as const,
          type: 'boolean' as const,
          description:
            'Push to your mobile device when a permission prompt or question is waiting (requires Remote Control)',
        },
        agentPushNotifEnabled: {
          source: 'global' as const,
          type: 'boolean' as const,
          description:
            'Allow Claude to push to your mobile device when it deems it appropriate (requires Remote Control)',
        },
      }
    : {}),
}

// isSupported 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSupported(key: string): boolean {
  // 返回 `key in SUPPORTED_SETTINGS`，作为工具调用这次计算的结果。
  return key in SUPPORTED_SETTINGS
}

// getConfig 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getConfig(key: string): SettingConfig | undefined {
  // 返回 `SUPPORTED_SETTINGS[key]`，作为工具调用这次计算的结果。
  return SUPPORTED_SETTINGS[key]
}

// getAllKeys 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllKeys(): string[] {
  // 返回 `Object.keys(SUPPORTED_SETTINGS)`，作为工具调用这次计算的结果。
  return Object.keys(SUPPORTED_SETTINGS)
}

// getOptionsForSetting 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOptionsForSetting(key: string): string[] | undefined {
  // 配置保存`SUPPORTED_SETTINGS[key]`，供工具实现 supported Settings后续判断或输出使用。
  const config = SUPPORTED_SETTINGS[key]
  // 配置缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!config) return undefined
  // 满足 `config.options` 时，工具调用执行该分支。
  if (config.options) return [...config.options]
  // 满足 `config.getOptions) return config.getOptions(` 时，工具调用执行该分支。
  if (config.getOptions) return config.getOptions()
  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

// getPath 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPath(key: string): string[] {
  // 配置保存`SUPPORTED_SETTINGS[key]`，供工具实现 supported Settings后续判断或输出使用。
  const config = SUPPORTED_SETTINGS[key]
  // 返回 `config?.path ?? key.split('.')`，作为工具调用这次计算的结果。
  return config?.path ?? key.split('.')
}

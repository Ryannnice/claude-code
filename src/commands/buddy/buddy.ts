// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 引入 getCompanion，将 ../../buddy/companion.js 中已经封装好的能力接到本文件流程里。
import { getCompanion } from '../../buddy/companion.js'
// 引入 RARITY_STARS、StoredCompanion，将 ../../buddy/types.js 中已经封装好的能力接到本文件流程里。
import { RARITY_STARS, type StoredCompanion } from '../../buddy/types.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

// DEFAULT_NAMES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const DEFAULT_NAMES = [
  'Nib',
  'Mochi',
  'Pico',
  'Orbit',
  'Biscuit',
  'Nova',
  'Pebble',
  'Pixel',
]

// DEFAULT_PERSONALITIES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const DEFAULT_PERSONALITIES = [
  'Curious and quietly supportive.',
  'Tiny, brave, and slightly chaotic.',
  'Patient, observant, and fond of good ideas.',
  'Cheerful, loyal, and always ready to help.',
]

// pickFrom 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pickFrom<T>(items: readonly T[], seed: number): T {
  // 返回 `items[Math.abs(seed) % items.length]!`，作为命令处理这次计算的结果。
  return items[Math.abs(seed) % items.length]!
}

// getSeed 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSeed(): number {
  // 配置读取`getGlobalConfig`，供命令处理后续处理使用。
  const config = getGlobalConfig()
  // source 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const source =
    config.oauthAccount?.accountUuid ?? config.userID ?? process.env.USER ?? 'anon'
  // hash 命名 `0`，让后续代码直接表达这个值的用途。
  let hash = 0
  // 按顺序遍历 `source` 中的ch，逐个交给命令处理处理。
  for (const ch of source) {
    // hash更新为 `(hash * 31 + ch.charCodeAt(0)) | 0`，确保斜杠命令后续读取最新状态。
    hash = (hash * 31 + ch.charCodeAt(0)) | 0
  }
  // 返回 `hash`，作为命令处理这次计算的结果。
  return hash
}

// createStoredCompanion 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createStoredCompanion(): StoredCompanion {
  // seed读取`getSeed`，供命令处理后续处理使用。
  const seed = getSeed()
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    name: pickFrom(DEFAULT_NAMES, seed),
    personality: pickFrom(DEFAULT_PERSONALITIES, seed >> 3),
    hatchedAt: Date.now(),
  }
}

// formatProfile 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatProfile() {
  // companion读取`getCompanion`，供命令处理后续处理使用。
  const companion = getCompanion()
  // companion缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!companion) return 'No companion found.'

  // topStats 集合派生`Object.entries`，供命令处理后续处理使用。
  const topStats = Object.entries(companion.stats)
    // 链式调用 sort，继续加工上一行在命令处理中产生的数据。
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    // 链式调用 map，继续加工上一行在命令处理中产生的数据。
    .map(([name, value]) => `${name} ${value}`)
    .join(', ')

  // 返回列表结果，保留命令处理已经排好的条目顺序。
  return [
    `${companion.name} · ${companion.species}`,
    `${RARITY_STARS[companion.rarity]} ${companion.rarity}`,
    `Eyes: ${companion.eye}  Hat: ${companion.hat}`,
    `Top stats: ${topStats}`,
    `Personality: ${companion.personality}`,
  ].join('\n')
}

// setReaction 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function setReaction(
  context: ToolUseContext & LocalJSXCommandContext,
  reaction: string,
  pet = false,
): void {
  // context.setAppState 写入新的状态值，使命令处理后续读取保持一致。
  context.setAppState(prev => ({
    ...prev,
    companionReaction: reaction,
    companionPetAt: pet ? Date.now() : prev.companionPetAt,
    footerSelection: 'companion',
  }))
}

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(
  onDone: LocalJSXCommandOnDone,
  context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<null> {
  // trimmed格式化`args.trim`，供命令处理后续处理使用。
  const trimmed = args.trim()
  // 从 `trimmed ? trimmed.split(/\s+/) : []` 按位置拆出 subcommand、其余 rest，让斜杠命令 buddy分别处理这些返回值。
  const [subcommand, ...rest] = trimmed ? trimmed.split(/\s+/) : []
  // action保存`toLowerCase`，供命令处理后续处理使用。
  const action = (subcommand ?? 'show').toLowerCase()

  // 当 `action` 匹配 `'show'` 时，命令处理执行对应分支。
  if (action === 'show') {
    // 满足 `!getGlobalConfig().companion` 时，命令处理执行该分支。
    if (!getGlobalConfig().companion) {
      // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        companion: createStoredCompanion(),
        companionMuted: false,
      }))
      // setReaction 写入新的状态值，使命令处理后续读取保持一致。
      setReaction(context, 'Just hatched!')
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Your buddy has arrived.\n\n${formatProfile()}`, {
        display: 'system',
      })
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }

    // setReaction 写入新的状态值，使命令处理后续读取保持一致。
    setReaction(context, 'Ready to hang out.')
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(formatProfile(), { display: 'system' })
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // 当 `action` 匹配 `'pet'` 时，命令处理执行对应分支。
  if (action === 'pet') {
    // 满足 `!getGlobalConfig().companion` 时，命令处理执行该分支。
    if (!getGlobalConfig().companion) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('No buddy yet. Run /buddy first to hatch one.', {
        display: 'system',
      })
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }
    // setReaction 写入新的状态值，使命令处理后续读取保持一致。
    setReaction(context, 'Happy chirps!', true)
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('You pet your buddy.', { display: 'system' })
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // 当 `action` 匹配 `'mute'` 时，命令处理执行对应分支。
  if (action === 'mute') {
    // 满足 `!getGlobalConfig().companion` 时，命令处理执行该分支。
    if (!getGlobalConfig().companion) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('No buddy yet. Run /buddy first to hatch one.', {
        display: 'system',
      })
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }
    // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
    saveGlobalConfig(current => ({ ...current, companionMuted: true }))
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Buddy hidden. Use /buddy unmute to bring it back.', {
      display: 'system',
    })
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // 当 `action` 匹配 `'unmute'` 时，命令处理执行对应分支。
  if (action === 'unmute') {
    // 满足 `!getGlobalConfig().companion` 时，命令处理执行该分支。
    if (!getGlobalConfig().companion) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('No buddy yet. Run /buddy first to hatch one.', {
        display: 'system',
      })
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }
    // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
    saveGlobalConfig(current => ({ ...current, companionMuted: false }))
    // setReaction 写入新的状态值，使命令处理后续读取保持一致。
    setReaction(context, 'I am back!')
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Buddy visible again.', { display: 'system' })
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // 当 `action` 匹配 `'rename'` 时，命令处理执行对应分支。
  if (action === 'rename') {
    // newName格式化`rest.join`，供命令处理后续处理使用。
    const newName = rest.join(' ').trim()
    // newName缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!newName) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('Usage: /buddy rename <name>', { display: 'system' })
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }
    // current读取`getGlobalConfig`，供命令处理后续处理使用。
    const current = getGlobalConfig().companion
    // current缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!current) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('No buddy yet. Run /buddy first to hatch one.', {
        display: 'system',
      })
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }
    // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
    saveGlobalConfig(config => ({
      ...config,
      companion: {
        ...current,
        name: newName,
      },
    }))
    // setReaction 写入新的状态值，使命令处理后续读取保持一致。
    setReaction(context, `Now I am ${newName}!`)
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(`Buddy renamed to ${newName}.`, { display: 'system' })
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }

  // 调用 onDone，触发命令处理此处需要的副作用。
  onDone(
    'Unknown buddy command. Use /buddy, /buddy pet, /buddy mute, /buddy unmute, or /buddy rename <name>.',
    { display: 'system' },
  )
  // 返回 `null`，作为命令处理这次计算的结果。
  return null
}

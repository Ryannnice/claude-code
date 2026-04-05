import type { ToolUseContext } from '../../Tool.js'
import { getCompanion } from '../../buddy/companion.js'
import { RARITY_STARS, type StoredCompanion } from '../../buddy/types.js'
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

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

const DEFAULT_PERSONALITIES = [
  'Curious and quietly supportive.',
  'Tiny, brave, and slightly chaotic.',
  'Patient, observant, and fond of good ideas.',
  'Cheerful, loyal, and always ready to help.',
]

function pickFrom<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!
}

function getSeed(): number {
  const config = getGlobalConfig()
  const source =
    config.oauthAccount?.accountUuid ?? config.userID ?? process.env.USER ?? 'anon'
  let hash = 0
  for (const ch of source) {
    hash = (hash * 31 + ch.charCodeAt(0)) | 0
  }
  return hash
}

function createStoredCompanion(): StoredCompanion {
  const seed = getSeed()
  return {
    name: pickFrom(DEFAULT_NAMES, seed),
    personality: pickFrom(DEFAULT_PERSONALITIES, seed >> 3),
    hatchedAt: Date.now(),
  }
}

function formatProfile() {
  const companion = getCompanion()
  if (!companion) return 'No companion found.'

  const topStats = Object.entries(companion.stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name, value]) => `${name} ${value}`)
    .join(', ')

  return [
    `${companion.name} · ${companion.species}`,
    `${RARITY_STARS[companion.rarity]} ${companion.rarity}`,
    `Eyes: ${companion.eye}  Hat: ${companion.hat}`,
    `Top stats: ${topStats}`,
    `Personality: ${companion.personality}`,
  ].join('\n')
}

function setReaction(
  context: ToolUseContext & LocalJSXCommandContext,
  reaction: string,
  pet = false,
): void {
  context.setAppState(prev => ({
    ...prev,
    companionReaction: reaction,
    companionPetAt: pet ? Date.now() : prev.companionPetAt,
    footerSelection: 'companion',
  }))
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<null> {
  const trimmed = args.trim()
  const [subcommand, ...rest] = trimmed ? trimmed.split(/\s+/) : []
  const action = (subcommand ?? 'show').toLowerCase()

  if (action === 'show') {
    if (!getGlobalConfig().companion) {
      saveGlobalConfig(current => ({
        ...current,
        companion: createStoredCompanion(),
        companionMuted: false,
      }))
      setReaction(context, 'Just hatched!')
      onDone(`Your buddy has arrived.\n\n${formatProfile()}`, {
        display: 'system',
      })
      return null
    }

    setReaction(context, 'Ready to hang out.')
    onDone(formatProfile(), { display: 'system' })
    return null
  }

  if (action === 'pet') {
    if (!getGlobalConfig().companion) {
      onDone('No buddy yet. Run /buddy first to hatch one.', {
        display: 'system',
      })
      return null
    }
    setReaction(context, 'Happy chirps!', true)
    onDone('You pet your buddy.', { display: 'system' })
    return null
  }

  if (action === 'mute') {
    if (!getGlobalConfig().companion) {
      onDone('No buddy yet. Run /buddy first to hatch one.', {
        display: 'system',
      })
      return null
    }
    saveGlobalConfig(current => ({ ...current, companionMuted: true }))
    onDone('Buddy hidden. Use /buddy unmute to bring it back.', {
      display: 'system',
    })
    return null
  }

  if (action === 'unmute') {
    if (!getGlobalConfig().companion) {
      onDone('No buddy yet. Run /buddy first to hatch one.', {
        display: 'system',
      })
      return null
    }
    saveGlobalConfig(current => ({ ...current, companionMuted: false }))
    setReaction(context, 'I am back!')
    onDone('Buddy visible again.', { display: 'system' })
    return null
  }

  if (action === 'rename') {
    const newName = rest.join(' ').trim()
    if (!newName) {
      onDone('Usage: /buddy rename <name>', { display: 'system' })
      return null
    }
    const current = getGlobalConfig().companion
    if (!current) {
      onDone('No buddy yet. Run /buddy first to hatch one.', {
        display: 'system',
      })
      return null
    }
    saveGlobalConfig(config => ({
      ...config,
      companion: {
        ...current,
        name: newName,
      },
    }))
    setReaction(context, `Now I am ${newName}!`)
    onDone(`Buddy renamed to ${newName}.`, { display: 'system' })
    return null
  }

  onDone(
    'Unknown buddy command. Use /buddy, /buddy pet, /buddy mute, /buddy unmute, or /buddy rename <name>.',
    { display: 'system' },
  )
  return null
}

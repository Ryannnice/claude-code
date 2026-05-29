// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js'
// 整理这一组导入，让companion后续逻辑可以直接复用这些外部能力。
import {
  type Companion,
  type CompanionBones,
  EYES,
  HATS,
  RARITIES,
  RARITY_WEIGHTS,
  type Rarity,
  SPECIES,
  STAT_NAMES,
  type StatName,
} from './types.js'

// Mulberry32 — tiny seeded PRNG, good enough for picking ducks
// mulberry32 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mulberry32(seed: number): () => number {
  // a保存`seed >>> 0`，供后续判断或组装使用。
  let a = seed >>> 0
  // 返回 `function () {`，作为companion这次计算的结果。
  return function () {
    // companion在这里处理 `a |= 0`，完成这一小步状态转换。
    a |= 0
    // a更新为 `(a + 0x6d2b79f5) | 0`，确保companion后续读取最新状态。
    a = (a + 0x6d2b79f5) | 0
    // t保存`Math.imul`，供companion后续处理使用。
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    // t更新为 `(t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t`，确保companion后续读取最新状态。
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    // 返回 `((t ^ (t >>> 14)) >>> 0) / 4294967296`，作为companion这次计算的结果。
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// hashString 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hashString(s: string): number {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Number(BigInt(Bun.hash(s)) & 0xffffffffn)`，作为companion这次计算的结果。
    return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
  }
  // h保存`2166136261`，供companion后续判断或输出使用。
  let h = 2166136261
  // 按索引扫描 `s.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < s.length; i++) {
    // companion在这里处理 `h ^= s.charCodeAt(i)`，完成这一小步状态转换。
    h ^= s.charCodeAt(i)
    // h更新为 `Math.imul(h, 16777619)`，确保companion后续读取最新状态。
    h = Math.imul(h, 16777619)
  }
  // 返回 `h >>> 0`，作为companion这次计算的结果。
  return h >>> 0
}

// pick 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function pick<T>(rng: () => number, arr: readonly T[]): T {
  // 返回 `arr[Math.floor(rng() * arr.length)]!`，作为companion这次计算的结果。
  return arr[Math.floor(rng() * arr.length)]!
}

// rollRarity 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function rollRarity(rng: () => number): Rarity {
  // total派生`Object.values`，供companion后续处理使用。
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)
  // roll保存`rng`，供companion后续处理使用。
  let roll = rng() * total
  // 按顺序遍历 `RARITIES` 中的rarity，逐个交给companion处理。
  for (const rarity of RARITIES) {
    // companion在这里处理 `roll -= RARITY_WEIGHTS[rarity]`，完成这一小步状态转换。
    roll -= RARITY_WEIGHTS[rarity]
    // 满足 `roll < 0` 时，companion执行该分支。
    if (roll < 0) return rarity
  }
  // 返回 `'common'`，作为companion这次计算的结果。
  return 'common'
}

// RARITY_FLOOR 集中保存companion要一起传递的字段。
const RARITY_FLOOR: Record<Rarity, number> = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50,
}

// One peak stat, one dump stat, rest scattered. Rarity bumps the floor.
// rollStats 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function rollStats(
  // 这个回调绑定到 rng: () => number,，负责companion在该局部场景下的响应。
  rng: () => number,
  rarity: Rarity,
): Record<StatName, number> {
  // floor保存`RARITY_FLOOR[rarity]`，供companion后续判断或输出使用。
  const floor = RARITY_FLOOR[rarity]
  // peak保存`pick`，供companion后续处理使用。
  const peak = pick(rng, STAT_NAMES)
  // dump保存`pick`，供companion后续处理使用。
  let dump = pick(rng, STAT_NAMES)
  // 只要 dump === peak) dump = pick(rng, STAT_NAMES 成立，就持续推进companion中的循环处理。
  while (dump === peak) dump = pick(rng, STAT_NAMES)

  // stats 集合 集中保存companion要一起传递的字段。
  const stats = {} as Record<StatName, number>
  // 按顺序遍历 `STAT_NAMES` 中的名称，逐个交给companion处理。
  for (const name of STAT_NAMES) {
    // 满足 `name === peak` 时，companion执行该分支。
    if (name === peak) {
      // stats[name更新为 `Math.min(100, floor + 50 + Math.floor(rng() * 30))`，确保companion后续读取最新状态。
      stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))
    // companion在这里处理 `} else if (name === dump) {`，完成这一小步状态转换。
    } else if (name === dump) {
      // stats[name更新为 `Math.max(1, floor - 10 + Math.floor(rng() * 15))`，确保companion后续读取最新状态。
      stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))
    } else {
      // stats[name更新为 `floor + Math.floor(rng() * 40)`，确保companion后续读取最新状态。
      stats[name] = floor + Math.floor(rng() * 40)
    }
  }
  // 返回 `stats`，作为companion这次计算的结果。
  return stats
}

// SALT 命名 `'friend-2026-401'`，让后续代码直接表达这个值的用途。
const SALT = 'friend-2026-401'

// Roll 固化companion里传递的数据形状，帮助调用方按同一结构读写字段。
export type Roll = {
  bones: CompanionBones
  inspirationSeed: number
}

// rollFrom 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function rollFrom(rng: () => number): Roll {
  // rarity保存`rollRarity`，供companion后续处理使用。
  const rarity = rollRarity(rng)
  // bones 集合 集中保存companion要一起传递的字段。
  const bones: CompanionBones = {
    rarity,
    species: pick(rng, SPECIES),
    eye: pick(rng, EYES),
    hat: rarity === 'common' ? 'none' : pick(rng, HATS),
    shiny: rng() < 0.01,
    stats: rollStats(rng, rarity),
  }
  // 返回结构化结果，集中表达companion已经整理出的状态。
  return { bones, inspirationSeed: Math.floor(rng() * 1e9) }
}

// Called from three hot paths (500ms sprite tick, per-keystroke PromptInput,
// per-turn observer) with the same userId → cache the deterministic result.
// rollCache 缓存 先占位，稍后的条件分支会根据实际输入补齐它。
let rollCache: { key: string; value: Roll } | undefined
// roll 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function roll(userId: string): Roll {
  // key保存`userId + SALT`，供companion后续判断或输出使用。
  const key = userId + SALT
  // 满足 `rollCache?.key === key` 时，companion执行该分支。
  if (rollCache?.key === key) return rollCache.value
  // 取值保存`rollFrom`，供companion后续处理使用。
  const value = rollFrom(mulberry32(hashString(key)))
  // rollCache 缓存更新为 `{ key, value }`，确保companion后续读取最新状态。
  rollCache = { key, value }
  // 返回 `value`，作为companion这次计算的结果。
  return value
}

// rollWithSeed 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function rollWithSeed(seed: string): Roll {
  // 返回 `rollFrom(mulberry32(hashString(seed)))`，作为companion这次计算的结果。
  return rollFrom(mulberry32(hashString(seed)))
}

// companionUserId 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function companionUserId(): string {
  // 配置读取`getGlobalConfig`，供companion后续处理使用。
  const config = getGlobalConfig()
  // 返回 `config.oauthAccount?.accountUuid ?? config.userID ?? 'anon'`，作为companion这次计算的结果。
  return config.oauthAccount?.accountUuid ?? config.userID ?? 'anon'
}

// Regenerate bones from userId, merge with stored soul. Bones never persist
// so species renames and SPECIES-array edits can't break stored companions,
// and editing config.companion can't fake a rarity.
// getCompanion 封装companion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCompanion(): Companion | undefined {
  // stored读取`getGlobalConfig`，供companion后续处理使用。
  const stored = getGlobalConfig().companion
  // stored缺失时提前走兜底路径，避免companion继续依赖无效输入。
  if (!stored) return undefined
  // 从 `roll(companionUserId())` 解构 bones，减少companion对同一对象的重复访问。
  const { bones } = roll(companionUserId())
  // bones last so stale bones fields in old-format configs get overridden
  // 返回结构化结果，集中表达companion已经整理出的状态。
  return { ...stored, ...bones }
}

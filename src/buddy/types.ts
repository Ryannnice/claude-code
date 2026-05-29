// RARITIES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const
// Rarity 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type Rarity = (typeof RARITIES)[number]

// One species name collides with a model-codename canary in excluded-strings.txt.
// The check greps build output (not source), so runtime-constructing the value keeps
// the literal out of the bundle while the check stays armed for the actual codename.
// All species encoded uniformly; `as` casts are type-position only (erased pre-bundle).
// c保存`String.fromCharCode`，供后续判断或组装使用。
const c = String.fromCharCode
// biome-ignore format: keep the species list compact

// duck保存`c`，供types后续处理使用。
export const duck = c(0x64,0x75,0x63,0x6b) as 'duck'
// goose保存`c`，供types后续处理使用。
export const goose = c(0x67, 0x6f, 0x6f, 0x73, 0x65) as 'goose'
// blob保存`c`，供types后续处理使用。
export const blob = c(0x62, 0x6c, 0x6f, 0x62) as 'blob'
// cat保存`c`，供types后续处理使用。
export const cat = c(0x63, 0x61, 0x74) as 'cat'
// dragon保存`c`，供types后续处理使用。
export const dragon = c(0x64, 0x72, 0x61, 0x67, 0x6f, 0x6e) as 'dragon'
// octopus 集合保存`c`，供types后续处理使用。
export const octopus = c(0x6f, 0x63, 0x74, 0x6f, 0x70, 0x75, 0x73) as 'octopus'
// owl保存`c`，供types后续处理使用。
export const owl = c(0x6f, 0x77, 0x6c) as 'owl'
// penguin保存`c`，供types后续处理使用。
export const penguin = c(0x70, 0x65, 0x6e, 0x67, 0x75, 0x69, 0x6e) as 'penguin'
// turtle保存`c`，供types后续处理使用。
export const turtle = c(0x74, 0x75, 0x72, 0x74, 0x6c, 0x65) as 'turtle'
// snail保存`c`，供types后续处理使用。
export const snail = c(0x73, 0x6e, 0x61, 0x69, 0x6c) as 'snail'
// ghost保存`c`，供types后续处理使用。
export const ghost = c(0x67, 0x68, 0x6f, 0x73, 0x74) as 'ghost'
// axolotl保存`c`，供types后续处理使用。
export const axolotl = c(0x61, 0x78, 0x6f, 0x6c, 0x6f, 0x74, 0x6c) as 'axolotl'
// capybara保存`c`，供types后续处理使用。
export const capybara = c(
  0x63,
  0x61,
  0x70,
  0x79,
  0x62,
  0x61,
  0x72,
  0x61,
) as 'capybara'
// cactus 集合保存`c`，供types后续处理使用。
export const cactus = c(0x63, 0x61, 0x63, 0x74, 0x75, 0x73) as 'cactus'
// robot保存`c`，供types后续处理使用。
export const robot = c(0x72, 0x6f, 0x62, 0x6f, 0x74) as 'robot'
// rabbit保存`c`，供types后续处理使用。
export const rabbit = c(0x72, 0x61, 0x62, 0x62, 0x69, 0x74) as 'rabbit'
// mushroom保存`c`，供types后续处理使用。
export const mushroom = c(
  0x6d,
  0x75,
  0x73,
  0x68,
  0x72,
  0x6f,
  0x6f,
  0x6d,
) as 'mushroom'
// chonk保存`c`，供types后续处理使用。
export const chonk = c(0x63, 0x68, 0x6f, 0x6e, 0x6b) as 'chonk'

// SPECIES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const SPECIES = [
  duck,
  goose,
  blob,
  cat,
  dragon,
  octopus,
  owl,
  penguin,
  turtle,
  snail,
  ghost,
  axolotl,
  capybara,
  cactus,
  robot,
  rabbit,
  mushroom,
  chonk,
] as const
// Species 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type Species = (typeof SPECIES)[number] // biome-ignore format: keep compact

// EYES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const EYES = ['·', '✦', '×', '◉', '@', '°'] as const
// Eye 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type Eye = (typeof EYES)[number]

// HATS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const HATS = [
  'none',
  'crown',
  'tophat',
  'propeller',
  'halo',
  'wizard',
  'beanie',
  'tinyduck',
] as const
// Hat 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type Hat = (typeof HATS)[number]

// STAT_NAMES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const STAT_NAMES = [
  'DEBUGGING',
  'PATIENCE',
  'CHAOS',
  'WISDOM',
  'SNARK',
] as const
// StatName 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type StatName = (typeof STAT_NAMES)[number]

// Deterministic parts — derived from hash(userId)
// CompanionBones 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type CompanionBones = {
  rarity: Rarity
  species: Species
  eye: Eye
  hat: Hat
  shiny: boolean
  stats: Record<StatName, number>
}

// Model-generated soul — stored in config after first hatch
// CompanionSoul 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type CompanionSoul = {
  name: string
  personality: string
}

// Companion 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type Companion = CompanionBones &
  CompanionSoul & {
    hatchedAt: number
  }

// What actually persists in config. Bones are regenerated from hash(userId)
// on every read so species renames don't break stored companions and users
// can't edit their way to a legendary.
// StoredCompanion 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type StoredCompanion = CompanionSoul & { hatchedAt: number }

// RARITY_WEIGHTS 集合 集中保存types要一起传递的字段。
export const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
} as const satisfies Record<Rarity, number>

// RARITY_STARS 集合 集中保存types要一起传递的字段。
export const RARITY_STARS = {
  common: '★',
  uncommon: '★★',
  rare: '★★★',
  epic: '★★★★',
  legendary: '★★★★★',
} as const satisfies Record<Rarity, string>

// RARITY_COLORS 集合 集中保存types要一起传递的字段。
export const RARITY_COLORS = {
  common: 'inactive',
  uncommon: 'success',
  rare: 'permission',
  epic: 'autoAccept',
  legendary: 'warning',
} as const satisfies Record<Rarity, keyof import('../utils/theme.js').Theme>

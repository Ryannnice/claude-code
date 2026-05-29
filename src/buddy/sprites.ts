// 类型依赖 { CompanionBones, Eye, Hat, Species } 来自 ./types.js，用于校准sprites的数据契约。
import type { CompanionBones, Eye, Hat, Species } from './types.js'
// 整理这一组导入，让sprites后续逻辑可以直接复用这些外部能力。
import {
  axolotl,
  blob,
  cactus,
  capybara,
  cat,
  chonk,
  dragon,
  duck,
  ghost,
  goose,
  mushroom,
  octopus,
  owl,
  penguin,
  rabbit,
  robot,
  snail,
  turtle,
} from './types.js'

// Each sprite is 5 lines tall, 12 wide (after {E}→1char substitution).
// Multiple frames per species for idle fidget animation.
// Line 0 is the hat slot — must be blank in frames 0-1; frame 2 may use it.
// BODIES 集合 集中保存sprites要一起传递的字段。
const BODIES: Record<Species, string[][]> = {
  [duck]: [
    [
      '            ',
      '    __      ',
      '  <({E} )___  ',
      '   (  ._>   ',
      '    `--´    ',
    ],
    [
      '            ',
      '    __      ',
      '  <({E} )___  ',
      '   (  ._>   ',
      '    `--´~   ',
    ],
    [
      '            ',
      '    __      ',
      '  <({E} )___  ',
      '   (  .__>  ',
      '    `--´    ',
    ],
  ],
  [goose]: [
    [
      '            ',
      '     ({E}>    ',
      '     ||     ',
      '   _(__)_   ',
      '    ^^^^    ',
    ],
    [
      '            ',
      '    ({E}>     ',
      '     ||     ',
      '   _(__)_   ',
      '    ^^^^    ',
    ],
    [
      '            ',
      '     ({E}>>   ',
      '     ||     ',
      '   _(__)_   ',
      '    ^^^^    ',
    ],
  ],
  [blob]: [
    [
      '            ',
      '   .----.   ',
      '  ( {E}  {E} )  ',
      '  (      )  ',
      '   `----´   ',
    ],
    [
      '            ',
      '  .------.  ',
      ' (  {E}  {E}  ) ',
      ' (        ) ',
      '  `------´  ',
    ],
    [
      '            ',
      '    .--.    ',
      '   ({E}  {E})   ',
      '   (    )   ',
      '    `--´    ',
    ],
  ],
  [cat]: [
    [
      '            ',
      '   /\\_/\\    ',
      '  ( {E}   {E})  ',
      '  (  ω  )   ',
      '  (")_(")   ',
    ],
    [
      '            ',
      '   /\\_/\\    ',
      '  ( {E}   {E})  ',
      '  (  ω  )   ',
      '  (")_(")~  ',
    ],
    [
      '            ',
      '   /\\-/\\    ',
      '  ( {E}   {E})  ',
      '  (  ω  )   ',
      '  (")_(")   ',
    ],
  ],
  [dragon]: [
    [
      '            ',
      '  /^\\  /^\\  ',
      ' <  {E}  {E}  > ',
      ' (   ~~   ) ',
      '  `-vvvv-´  ',
    ],
    [
      '            ',
      '  /^\\  /^\\  ',
      ' <  {E}  {E}  > ',
      ' (        ) ',
      '  `-vvvv-´  ',
    ],
    [
      '   ~    ~   ',
      '  /^\\  /^\\  ',
      ' <  {E}  {E}  > ',
      ' (   ~~   ) ',
      '  `-vvvv-´  ',
    ],
  ],
  [octopus]: [
    [
      '            ',
      '   .----.   ',
      '  ( {E}  {E} )  ',
      '  (______)  ',
      '  /\\/\\/\\/\\  ',
    ],
    [
      '            ',
      '   .----.   ',
      '  ( {E}  {E} )  ',
      '  (______)  ',
      '  \\/\\/\\/\\/  ',
    ],
    [
      '     o      ',
      '   .----.   ',
      '  ( {E}  {E} )  ',
      '  (______)  ',
      '  /\\/\\/\\/\\  ',
    ],
  ],
  [owl]: [
    [
      '            ',
      '   /\\  /\\   ',
      '  (({E})({E}))  ',
      '  (  ><  )  ',
      '   `----´   ',
    ],
    [
      '            ',
      '   /\\  /\\   ',
      '  (({E})({E}))  ',
      '  (  ><  )  ',
      '   .----.   ',
    ],
    [
      '            ',
      '   /\\  /\\   ',
      '  (({E})(-))  ',
      '  (  ><  )  ',
      '   `----´   ',
    ],
  ],
  [penguin]: [
    [
      '            ',
      '  .---.     ',
      '  ({E}>{E})     ',
      ' /(   )\\    ',
      '  `---´     ',
    ],
    [
      '            ',
      '  .---.     ',
      '  ({E}>{E})     ',
      ' |(   )|    ',
      '  `---´     ',
    ],
    [
      '  .---.     ',
      '  ({E}>{E})     ',
      ' /(   )\\    ',
      '  `---´     ',
      '   ~ ~      ',
    ],
  ],
  [turtle]: [
    [
      '            ',
      '   _,--._   ',
      '  ( {E}  {E} )  ',
      ' /[______]\\ ',
      '  ``    ``  ',
    ],
    [
      '            ',
      '   _,--._   ',
      '  ( {E}  {E} )  ',
      ' /[______]\\ ',
      '   ``  ``   ',
    ],
    [
      '            ',
      '   _,--._   ',
      '  ( {E}  {E} )  ',
      ' /[======]\\ ',
      '  ``    ``  ',
    ],
  ],
  [snail]: [
    [
      '            ',
      ' {E}    .--.  ',
      '  \\  ( @ )  ',
      '   \\_`--´   ',
      '  ~~~~~~~   ',
    ],
    [
      '            ',
      '  {E}   .--.  ',
      '  |  ( @ )  ',
      '   \\_`--´   ',
      '  ~~~~~~~   ',
    ],
    [
      '            ',
      ' {E}    .--.  ',
      '  \\  ( @  ) ',
      '   \\_`--´   ',
      '   ~~~~~~   ',
    ],
  ],
  [ghost]: [
    [
      '            ',
      '   .----.   ',
      '  / {E}  {E} \\  ',
      '  |      |  ',
      '  ~`~``~`~  ',
    ],
    [
      '            ',
      '   .----.   ',
      '  / {E}  {E} \\  ',
      '  |      |  ',
      '  `~`~~`~`  ',
    ],
    [
      '    ~  ~    ',
      '   .----.   ',
      '  / {E}  {E} \\  ',
      '  |      |  ',
      '  ~~`~~`~~  ',
    ],
  ],
  [axolotl]: [
    [
      '            ',
      '}~(______)~{',
      '}~({E} .. {E})~{',
      '  ( .--. )  ',
      '  (_/  \\_)  ',
    ],
    [
      '            ',
      '~}(______){~',
      '~}({E} .. {E}){~',
      '  ( .--. )  ',
      '  (_/  \\_)  ',
    ],
    [
      '            ',
      '}~(______)~{',
      '}~({E} .. {E})~{',
      '  (  --  )  ',
      '  ~_/  \\_~  ',
    ],
  ],
  [capybara]: [
    [
      '            ',
      '  n______n  ',
      ' ( {E}    {E} ) ',
      ' (   oo   ) ',
      '  `------´  ',
    ],
    [
      '            ',
      '  n______n  ',
      ' ( {E}    {E} ) ',
      ' (   Oo   ) ',
      '  `------´  ',
    ],
    [
      '    ~  ~    ',
      '  u______n  ',
      ' ( {E}    {E} ) ',
      ' (   oo   ) ',
      '  `------´  ',
    ],
  ],
  [cactus]: [
    [
      '            ',
      ' n  ____  n ',
      ' | |{E}  {E}| | ',
      ' |_|    |_| ',
      '   |    |   ',
    ],
    [
      '            ',
      '    ____    ',
      ' n |{E}  {E}| n ',
      ' |_|    |_| ',
      '   |    |   ',
    ],
    [
      ' n        n ',
      ' |  ____  | ',
      ' | |{E}  {E}| | ',
      ' |_|    |_| ',
      '   |    |   ',
    ],
  ],
  [robot]: [
    [
      '            ',
      '   .[||].   ',
      '  [ {E}  {E} ]  ',
      '  [ ==== ]  ',
      '  `------´  ',
    ],
    [
      '            ',
      '   .[||].   ',
      '  [ {E}  {E} ]  ',
      '  [ -==- ]  ',
      '  `------´  ',
    ],
    [
      '     *      ',
      '   .[||].   ',
      '  [ {E}  {E} ]  ',
      '  [ ==== ]  ',
      '  `------´  ',
    ],
  ],
  [rabbit]: [
    [
      '            ',
      '   (\\__/)   ',
      '  ( {E}  {E} )  ',
      ' =(  ..  )= ',
      '  (")__(")  ',
    ],
    [
      '            ',
      '   (|__/)   ',
      '  ( {E}  {E} )  ',
      ' =(  ..  )= ',
      '  (")__(")  ',
    ],
    [
      '            ',
      '   (\\__/)   ',
      '  ( {E}  {E} )  ',
      ' =( .  . )= ',
      '  (")__(")  ',
    ],
  ],
  [mushroom]: [
    [
      '            ',
      ' .-o-OO-o-. ',
      '(__________)',
      '   |{E}  {E}|   ',
      '   |____|   ',
    ],
    [
      '            ',
      ' .-O-oo-O-. ',
      '(__________)',
      '   |{E}  {E}|   ',
      '   |____|   ',
    ],
    [
      '   . o  .   ',
      ' .-o-OO-o-. ',
      '(__________)',
      '   |{E}  {E}|   ',
      '   |____|   ',
    ],
  ],
  [chonk]: [
    [
      '            ',
      '  /\\    /\\  ',
      ' ( {E}    {E} ) ',
      ' (   ..   ) ',
      '  `------´  ',
    ],
    [
      '            ',
      '  /\\    /|  ',
      ' ( {E}    {E} ) ',
      ' (   ..   ) ',
      '  `------´  ',
    ],
    [
      '            ',
      '  /\\    /\\  ',
      ' ( {E}    {E} ) ',
      ' (   ..   ) ',
      '  `------´~ ',
    ],
  ],
}

// HAT_LINES 集合 集中保存sprites要一起传递的字段。
const HAT_LINES: Record<Hat, string> = {
  none: '',
  crown: '   \\^^^/    ',
  tophat: '   [___]    ',
  propeller: '    -+-     ',
  halo: '   (   )    ',
  wizard: '    /^\\     ',
  beanie: '   (___)    ',
  tinyduck: '    ,>      ',
}

// renderSprite 封装sprites的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderSprite(bones: CompanionBones, frame = 0): string[] {
  // frames 集合读取 `BODIES[bones.species]` 对应条目，后续围绕该成员继续处理。
  const frames = BODIES[bones.species]
  // 请求体派生`map`，供sprites后续处理使用。
  const body = frames[frame % frames.length]!.map(line =>
    line.replaceAll('{E}', bones.eye),
  )
  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines = [...body]
  // Only replace with hat if line 0 is empty (some fidget frames use it for smoke etc)
  // `bones.hat` 与 `'none' && !lines[0]!.trim()` 不一致时刷新派生状态，避免使用过期结果。
  if (bones.hat !== 'none' && !lines[0]!.trim()) {
    // lines[0更新为 `HAT_LINES[bones.hat]`，确保sprites后续读取最新状态。
    lines[0] = HAT_LINES[bones.hat]
  }
  // Drop blank hat slot — wastes a row in the Card and ambient sprite when
  // there's no hat and the frame isn't using it for smoke/antenna/etc.
  // Only safe when ALL frames have blank line 0; otherwise heights oscillate.
  // 组合条件 `!lines[0]!.trim() && frames.every(f => !f[0]!.trim())) lines.shift(` 成立时，sprites才启用这条专门路径。
  if (!lines[0]!.trim() && frames.every(f => !f[0]!.trim())) lines.shift()
  // 返回 `lines`，作为sprites这次计算的结果。
  return lines
}

// spriteFrameCount 封装sprites的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function spriteFrameCount(species: Species): number {
  // 返回 `BODIES[species].length`，作为sprites这次计算的结果。
  return BODIES[species].length
}

// renderFace 封装sprites的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderFace(bones: CompanionBones): string {
  // eye保存`bones.eye`，供sprites后续判断或输出使用。
  const eye: Eye = bones.eye
  // 按照 bones.species 的取值选择sprites的具体处理分支。
  switch (bones.species) {
    case duck:
    case goose:
      // 返回 ``(${eye}>``，作为sprites这次计算的结果。
      return `(${eye}>`
    case blob:
      // 返回 ``(${eye}${eye})``，作为sprites这次计算的结果。
      return `(${eye}${eye})`
    case cat:
      // 返回 ``=${eye}ω${eye}=``，作为sprites这次计算的结果。
      return `=${eye}ω${eye}=`
    case dragon:
      // 返回 ``<${eye}~${eye}>``，作为sprites这次计算的结果。
      return `<${eye}~${eye}>`
    case octopus:
      // 返回 ``~(${eye}${eye})~``，作为sprites这次计算的结果。
      return `~(${eye}${eye})~`
    case owl:
      // 返回 ``(${eye})(${eye})``，作为sprites这次计算的结果。
      return `(${eye})(${eye})`
    case penguin:
      // 返回 ``(${eye}>)``，作为sprites这次计算的结果。
      return `(${eye}>)`
    case turtle:
      // 返回 ``[${eye}_${eye}]``，作为sprites这次计算的结果。
      return `[${eye}_${eye}]`
    case snail:
      // 返回 ``${eye}(@)``，作为sprites这次计算的结果。
      return `${eye}(@)`
    case ghost:
      // 返回 ``/${eye}${eye}\\``，作为sprites这次计算的结果。
      return `/${eye}${eye}\\`
    case axolotl:
      // 返回 ``}${eye}.${eye}{``，作为sprites这次计算的结果。
      return `}${eye}.${eye}{`
    case capybara:
      // 返回 ``(${eye}oo${eye})``，作为sprites这次计算的结果。
      return `(${eye}oo${eye})`
    case cactus:
      // 返回 ``|${eye} ${eye}|``，作为sprites这次计算的结果。
      return `|${eye}  ${eye}|`
    case robot:
      // 返回 ``[${eye}${eye}]``，作为sprites这次计算的结果。
      return `[${eye}${eye}]`
    case rabbit:
      // 返回 ``(${eye}..${eye})``，作为sprites这次计算的结果。
      return `(${eye}..${eye})`
    case mushroom:
      // 返回 ``|${eye} ${eye}|``，作为sprites这次计算的结果。
      return `|${eye}  ${eye}|`
    case chonk:
      // 返回 ``(${eye}.${eye})``，作为sprites这次计算的结果。
      return `(${eye}.${eye})`
  }
}

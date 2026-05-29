// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export { FlashingChar } from './FlashingChar.js'
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { GlimmerMessage } from './GlimmerMessage.js'
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { ShimmerChar } from './ShimmerChar.js'
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { SpinnerGlyph } from './SpinnerGlyph.js'
// 导出类型定义，让其他模块沿用终端 UI 组件 index的数据契约。
export type { SpinnerMode } from './types.js'
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { useShimmerAnimation } from './useShimmerAnimation.js'
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { useStalledAnimation } from './useStalledAnimation.js'
// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { getDefaultCharacters, interpolateColor } from './utils.js'
// Teammate components are NOT exported here - use dynamic require() to enable dead code elimination
// See REPL.tsx and Spinner.tsx for the correct import pattern

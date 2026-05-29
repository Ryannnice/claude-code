// 类型依赖 { RGBColor as RGBColorString } 来自 ../../ink/styles.js，用于校准终端渲染的数据契约。
import type { RGBColor as RGBColorString } from '../../ink/styles.js'
// 类型依赖 { RGBColor as RGBColorType } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { RGBColor as RGBColorType } from './types.js'

// getDefaultCharacters 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultCharacters(): string[] {
  // 当 `process.env.TERM` 匹配 `'xterm-ghostty'` 时，终端渲染执行对应分支。
  if (process.env.TERM === 'xterm-ghostty') {
    // 返回列表结果，保留终端渲染已经排好的条目顺序。
    return ['·', '✢', '✳', '✶', '✻', '*'] // Use * instead of ✽ for Ghostty because the latter renders in a way that's slightly offset
  }
  // 返回 `process.platform === 'darwin'`，作为终端渲染这次计算的结果。
  return process.platform === 'darwin'
    ? ['·', '✢', '✳', '✶', '✻', '✽']
    : ['·', '✢', '*', '✶', '✻', '✽']
}

// Interpolate between two RGB colors
// interpolateColor 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function interpolateColor(
  color1: RGBColorType,
  color2: RGBColorType,
  t: number, // 0 to 1
): RGBColorType {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * t),
    g: Math.round(color1.g + (color2.g - color1.g) * t),
    b: Math.round(color1.b + (color2.b - color1.b) * t),
  }
}

// Convert RGB object to rgb() color string for Text component
// toRGBColor 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toRGBColor(color: RGBColorType): RGBColorString {
  // 返回 ``rgb(${color.r},${color.g},${color.b})``，作为终端渲染这次计算的结果。
  return `rgb(${color.r},${color.g},${color.b})`
}

// HSL hue (0-360) to RGB, using voice-mode waveform parameters (s=0.7, l=0.6).
// hueToRgb 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hueToRgb(hue: number): RGBColorType {
  // h 命名 `((hue % 360) + 360) % 360`，让后续代码直接表达这个值的用途。
  const h = ((hue % 360) + 360) % 360
  // s 集合保存`0.7`，供终端 UI utils后续判断或输出使用。
  const s = 0.7
  // l保存`0.6`，供终端 UI utils后续判断或输出使用。
  const l = 0.6
  // c保存`Math.abs`，供终端渲染后续处理使用。
  const c = (1 - Math.abs(2 * l - 1)) * s
  // x保存`Math.abs`，供终端渲染后续处理使用。
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  // m保存`l - c / 2`，供后续判断或组装使用。
  const m = l - c / 2
  // r保存`0`，供后续判断或组装使用。
  let r = 0
  // g保存`0`，供后续判断或组装使用。
  let g = 0
  // b保存`0`，供后续判断或组装使用。
  let b = 0
  // 满足 `h < 60` 时，终端渲染执行该分支。
  if (h < 60) {
    // r更新为 `c`，确保终端 UI后续读取最新状态。
    r = c
    // g更新为 `x`，确保终端 UI后续读取最新状态。
    g = x
  // 终端 UI 组件 utils在这里处理 `} else if (h < 120) {`，完成这一小步状态转换。
  } else if (h < 120) {
    // r更新为 `x`，确保终端 UI后续读取最新状态。
    r = x
    // g更新为 `c`，确保终端 UI后续读取最新状态。
    g = c
  // 终端 UI 组件 utils在这里处理 `} else if (h < 180) {`，完成这一小步状态转换。
  } else if (h < 180) {
    // g更新为 `c`，确保终端 UI后续读取最新状态。
    g = c
    // b更新为 `x`，确保终端 UI后续读取最新状态。
    b = x
  // 终端 UI 组件 utils在这里处理 `} else if (h < 240) {`，完成这一小步状态转换。
  } else if (h < 240) {
    // g更新为 `x`，确保终端 UI后续读取最新状态。
    g = x
    // b更新为 `c`，确保终端 UI后续读取最新状态。
    b = c
  // 终端 UI 组件 utils在这里处理 `} else if (h < 300) {`，完成这一小步状态转换。
  } else if (h < 300) {
    // r更新为 `x`，确保终端 UI后续读取最新状态。
    r = x
    // b更新为 `c`，确保终端 UI后续读取最新状态。
    b = c
  } else {
    // r更新为 `c`，确保终端 UI后续读取最新状态。
    r = c
    // b更新为 `x`，确保终端 UI后续读取最新状态。
    b = x
  }
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

// RGB_CACHE 缓存构建`new Map<string, RGBColorType | null>()`，供后续判断或组装使用。
const RGB_CACHE = new Map<string, RGBColorType | null>()

// parseRGB 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseRGB(colorStr: string): RGBColorType | null {
  // cached 缓存读取`RGB_CACHE.get`，供终端渲染后续处理使用。
  const cached = RGB_CACHE.get(colorStr)
  // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== undefined) return cached

  // match匹配`colorStr.match`，供终端渲染后续处理使用。
  const match = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  // 结果保存`match`，供后续判断或组装使用。
  const result = match
    ? {
        r: parseInt(match[1]!, 10),
        g: parseInt(match[2]!, 10),
        b: parseInt(match[3]!, 10),
      }
    : null
  // RGB_CACHE.set 写入新的状态值，使终端渲染后续读取保持一致。
  RGB_CACHE.set(colorStr, result)
  // 返回 `result`，作为终端渲染这次计算的结果。
  return result
}

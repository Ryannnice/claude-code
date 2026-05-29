// 引入 stringWidth，将 ./stringWidth.js 中已经封装好的能力接到本文件流程里。
import { stringWidth } from './stringWidth.js'

// During streaming, text grows but completed lines are immutable.
// Caching stringWidth per-line avoids re-measuring hundreds of
// unchanged lines on every token (~50x reduction in stringWidth calls).
// cache 缓存构建`new Map<string, number>()` 整理出中间结果，供Ink 渲染层 line width cache后续步骤使用。
const cache = new Map<string, number>()

// MAX_CACHE_SIZE 缓存保存`4096`，供Ink 渲染层 line width cache后续判断或输出使用。
const MAX_CACHE_SIZE = 4096

// lineWidth 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function lineWidth(line: string): number {
  // cached 缓存读取`cache.get`，供终端渲染后续处理使用。
  const cached = cache.get(line)
  // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== undefined) return cached

  // width保存`stringWidth`，供终端渲染后续处理使用。
  const width = stringWidth(line)

  // Evict when cache grows too large (e.g. after many different responses).
  // Simple full-clear is fine — the cache repopulates in one frame.
  // 满足 `cache.size >= MAX_CACHE_SIZE` 时，终端渲染执行该分支。
  if (cache.size >= MAX_CACHE_SIZE) {
    // 调用 cache.clear，触发终端渲染此处需要的副作用。
    cache.clear()
  }

  // cache.set 写入新的状态值，使终端渲染后续读取保持一致。
  cache.set(line, width)
  // 返回 `width`，作为终端渲染这次计算的结果。
  return width
}

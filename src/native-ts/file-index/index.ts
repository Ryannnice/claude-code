/**
 * Pure-TypeScript port of vendor/file-index-src (Rust NAPI module).
 *
 * The native module wraps nucleo (https://github.com/helix-editor/nucleo) for
 * high-performance fuzzy file searching. This port reimplements the same API
 * and scoring behavior without native dependencies.
 *
 * Key API:
 *   new FileIndex()
 *   .loadFromFileList(fileList: string[]): void   — dedupe + index paths
 *   .search(query: string, limit: number): SearchResult[]
 *
 * Score semantics: lower = better. Score is position-in-results / result-count,
 * so the best match is 0.0. Paths containing "test" get a 1.05× penalty (capped
 * at 1.0) so non-test files rank slightly higher.
 */

// SearchResult 固化index里传递的数据形状，帮助调用方按同一结构读写字段。
export type SearchResult = {
  path: string
  score: number
}

// nucleo-style scoring constants (approximating fzf-v2 / nucleo bonuses)
// SCORE_MATCH保存`16`，供index后续判断或输出使用。
const SCORE_MATCH = 16
// BONUS_BOUNDARY 命名 `8`，让后续代码直接表达这个值的用途。
const BONUS_BOUNDARY = 8
// BONUS_CAMEL保存`6`，供index后续判断或输出使用。
const BONUS_CAMEL = 6
// BONUS_CONSECUTIVE保存`4`，供后续判断或组装使用。
const BONUS_CONSECUTIVE = 4
// BONUS_FIRST_CHAR保存`8`，供index后续判断或输出使用。
const BONUS_FIRST_CHAR = 8
// PENALTY_GAP_START保存`3`，供后续判断或组装使用。
const PENALTY_GAP_START = 3
// PENALTY_GAP_EXTENSION保存`1`，供后续判断或组装使用。
const PENALTY_GAP_EXTENSION = 1

// TOP_LEVEL_CACHE_LIMIT 缓存保存`100`，供index后续判断或输出使用。
const TOP_LEVEL_CACHE_LIMIT = 100
// MAX_QUERY_LEN 命名 `64`，让后续代码直接表达这个值的用途。
const MAX_QUERY_LEN = 64
// Yield to event loop after this many ms of sync work. Chunk sizes are
// time-based (not count-based) so slow machines get smaller chunks and
// stay responsive — 5k paths is ~2ms on M-series but could be 15ms+ on
// older Windows hardware.
// CHUNK_MS 集合 命名 `4`，让后续代码直接表达这个值的用途。
const CHUNK_MS = 4

// Reusable buffer: records where each needle char matched during the indexOf scan
// posBuf保存`Int32Array`，供index后续处理使用。
const posBuf = new Int32Array(MAX_QUERY_LEN)

// FileIndex 聚合index相关状态与操作，把同一职责的行为收束到类实例中。
export class FileIndex {
  private paths: string[] = []
  private lowerPaths: string[] = []
  private charBits: Int32Array = new Int32Array(0)
  private pathLens: Uint16Array = new Uint16Array(0)
  private topLevelCache: SearchResult[] | null = null
  // During async build, tracks how many paths have bitmap/lowerPath filled.
  // search() uses this to search the ready prefix while build continues.
  private readyCount = 0

  /**
   * Load paths from an array of strings.
   * This is the main way to populate the index — ripgrep collects files, we just search them.
   * Automatically deduplicates paths.
   */
  // loadFromFileList 使用 fileList: string[] 完成index里的对应操作。
  loadFromFileList(fileList: string[]): void {
    // Deduplicate and filter empty strings (matches Rust HashSet behavior)
    // seen 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
    const seen = new Set<string>()
    // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
    const paths: string[] = []
    // 按顺序遍历 `fileList` 中的line，逐个交给index处理。
    for (const line of fileList) {
      // 组合条件 `line.length > 0 && !seen.has(line)` 成立时，index才启用这条专门路径。
      if (line.length > 0 && !seen.has(line)) {
        // 调用 seen.add，触发index此处需要的副作用。
        seen.add(line)
        // 路径列表追加新条目，保持收集顺序与输入顺序一致。
        paths.push(line)
      }
    }

    // 调用 this.buildIndex，触发index此处需要的副作用。
    this.buildIndex(paths)
  }

  /**
   * Async variant: yields to the event loop every ~8–12k paths so large
   * indexes (270k+ files) don't block the main thread for >10ms at a time.
   * Identical result to loadFromFileList.
   *
   * Returns { queryable, done }:
   *   - queryable: resolves as soon as the first chunk is indexed (search
   *     returns partial results). For a 270k-path list this is ~5–10ms of
   *     sync work after the paths array is available.
   *   - done: resolves when the entire index is built.
   */
  // loadFromFileListAsync 使用 fileList: string[] 完成index里的对应操作。
  loadFromFileListAsync(fileList: string[]): {
    queryable: Promise<void>
    done: Promise<void>
  } {
    // 这个回调绑定到 let markQueryable: () => void = () => {}，负责index在该局部场景下的响应。
    let markQueryable: () => void = () => {}
    // queryable封装成回调，供index在事件触发或异步步骤中调用。
    const queryable = new Promise<void>(resolve => {
      // markQueryable更新为 `resolve`，确保index后续读取最新状态。
      markQueryable = resolve
    })
    // done构建`this.buildAsync`，供index后续处理使用。
    const done = this.buildAsync(fileList, markQueryable)
    // 返回结构化结果，集中表达index已经整理出的状态。
    return { queryable, done }
  }

  // index在这里处理 `private async buildAsync(`，完成这一小步状态转换。
  private async buildAsync(
    fileList: string[],
    // 这个回调绑定到 markQueryable: () => void,，负责index在该局部场景下的响应。
    markQueryable: () => void,
  ): Promise<void> {
    // seen 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
    const seen = new Set<string>()
    // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
    const paths: string[] = []
    // chunkStart记录时间`performance.now`，供index后续处理使用。
    let chunkStart = performance.now()
    // 按索引扫描 `fileList.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < fileList.length; i++) {
      // line 命名 `fileList[i]!`，让后续代码直接表达这个值的用途。
      const line = fileList[i]!
      // 组合条件 `line.length > 0 && !seen.has(line)` 成立时，index才启用这条专门路径。
      if (line.length > 0 && !seen.has(line)) {
        // 调用 seen.add，触发index此处需要的副作用。
        seen.add(line)
        // 路径列表追加新条目，保持收集顺序与输入顺序一致。
        paths.push(line)
      }
      // Check every 256 iterations to amortize performance.now() overhead
      // 组合条件 `(i & 0xff) === 0xff && performance.now() - chunkStart > CHUNK_MS` 成立时，index才启用这条专门路径。
      if ((i & 0xff) === 0xff && performance.now() - chunkStart > CHUNK_MS) {
        // 等待 `yieldToEventLoop()` 完成，再继续index的异步流程。
        await yieldToEventLoop()
        // chunkStart更新为 `performance.now()`，确保index后续读取最新状态。
        chunkStart = performance.now()
      }
    }

    // 调用 this.resetArrays，触发index此处需要的副作用。
    this.resetArrays(paths)

    // chunkStart更新为 `performance.now()`，确保index后续读取最新状态。
    chunkStart = performance.now()
    // firstChunk标记index是否启用对应路径。
    let firstChunk = true
    // 按索引扫描 `paths.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < paths.length; i++) {
      // 调用 this.indexPath，触发index此处需要的副作用。
      this.indexPath(i)
      // 组合条件 `(i & 0xff) === 0xff && performance.now() - chunkStart > CHUNK_MS` 成立时，index才启用这条专门路径。
      if ((i & 0xff) === 0xff && performance.now() - chunkStart > CHUNK_MS) {
        // 更新实例字段 readyCount 为 i + 1，同步index的内部状态。
        this.readyCount = i + 1
        // 满足 `firstChunk` 时，index执行该分支。
        if (firstChunk) {
          // 调用 markQueryable，触发index此处需要的副作用。
          markQueryable()
          // firstChunk更新为 `false`，确保index后续读取最新状态。
          firstChunk = false
        }
        // 等待 `yieldToEventLoop()` 完成，再继续index的异步流程。
        await yieldToEventLoop()
        // chunkStart更新为 `performance.now()`，确保index后续读取最新状态。
        chunkStart = performance.now()
      }
    }
    // 更新实例字段 readyCount 为 paths.length，同步index的内部状态。
    this.readyCount = paths.length
    // 调用 markQueryable，触发index此处需要的副作用。
    markQueryable()
  }

  // index在这里处理 `private buildIndex(paths: string[]): void {`，完成这一小步状态转换。
  private buildIndex(paths: string[]): void {
    // 调用 this.resetArrays，触发index此处需要的副作用。
    this.resetArrays(paths)
    // 按索引扫描 `paths.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < paths.length; i++) {
      // 调用 this.indexPath，触发index此处需要的副作用。
      this.indexPath(i)
    }
    // 更新实例字段 readyCount 为 paths.length，同步index的内部状态。
    this.readyCount = paths.length
  }

  // index在这里处理 `private resetArrays(paths: string[]): void {`，完成这一小步状态转换。
  private resetArrays(paths: string[]): void {
    // n记录 `paths.length` 是否成立，下一步按该结果分支。
    const n = paths.length
    // 更新实例字段 paths 为 paths，同步index的内部状态。
    this.paths = paths
    // 更新实例字段 lowerPaths 为 new Array(n)，同步index的内部状态。
    this.lowerPaths = new Array(n)
    // 更新实例字段 charBits 为 new Int32Array(n)，同步index的内部状态。
    this.charBits = new Int32Array(n)
    // 更新实例字段 pathLens 为 new Uint16Array(n)，同步index的内部状态。
    this.pathLens = new Uint16Array(n)
    // 更新实例字段 readyCount 为 0，同步index的内部状态。
    this.readyCount = 0
    // 更新实例字段 topLevelCache 为 computeTopLevelEntries(paths, TOP_LEVEL_CACHE_LIMIT)，同步index的内部状态。
    this.topLevelCache = computeTopLevelEntries(paths, TOP_LEVEL_CACHE_LIMIT)
  }

  // Precompute: lowercase, a–z bitmap, length. Bitmap gives O(1) rejection
  // of paths missing any needle letter (89% survival for broad queries like
  // "test" → still a 10%+ free win; 90%+ rejection for rare chars).
  // index在这里处理 `private indexPath(i: number): void {`，完成这一小步状态转换。
  private indexPath(i: number): void {
    // lp保存`toLowerCase`，供index后续处理使用。
    const lp = this.paths[i]!.toLowerCase()
    // lowerPaths[i 路径数据更新为 `lp`，确保index后续读取最新状态。
    this.lowerPaths[i] = lp
    // len保存 `lp.length` 的判断结果，供index后续分支直接复用。
    const len = lp.length
    // pathLens[i 路径数据更新为 `len`，确保index后续读取最新状态。
    this.pathLens[i] = len
    // bits 集合保存`0`，供后续判断或组装使用。
    let bits = 0
    // 按索引扫描 `len`，需要消费相邻参数时可以精确移动游标。
    for (let j = 0; j < len; j++) {
      // c保存`lp.charCodeAt`，供index后续处理使用。
      const c = lp.charCodeAt(j)
      // 组合条件 `c >= 97 && c <= 122) bits |= 1 << (c - 97` 成立时，index才启用这条专门路径。
      if (c >= 97 && c <= 122) bits |= 1 << (c - 97)
    }
    // charBits[i更新为 `bits`，确保index后续读取最新状态。
    this.charBits[i] = bits
  }

  /**
   * Search for files matching the query using fuzzy matching.
   * Returns top N results sorted by match score.
   */
  // search 使用 query: string, limit: number 完成index里的对应操作。
  search(query: string, limit: number): SearchResult[] {
    // 满足 `limit <= 0` 时，index执行该分支。
    if (limit <= 0) return []
    // query为空时立即返回或跳过，避免index把空集合当成可处理内容。
    if (query.length === 0) {
      // 满足 `this.topLevelCache` 时，index执行该分支。
      if (this.topLevelCache) {
        // 返回 `this.topLevelCache.slice(0, limit)`，作为index这次计算的结果。
        return this.topLevelCache.slice(0, limit)
      }
      // 返回列表结果，保留index已经排好的条目顺序。
      return []
    }

    // Smart case: lowercase query → case-insensitive; any uppercase → case-sensitive
    // caseSensitive保存`query.toLowerCase`，供index后续处理使用。
    const caseSensitive = query !== query.toLowerCase()
    // needle保存`query.toLowerCase`，供index后续处理使用。
    const needle = caseSensitive ? query : query.toLowerCase()
    // nLen保存`Math.min`，供index后续处理使用。
    const nLen = Math.min(needle.length, MAX_QUERY_LEN)
    // needleChars 集合构建`new Array(nLen)`，供后续判断或组装使用。
    const needleChars: string[] = new Array(nLen)
    // needleBitmap保存`0`，供后续判断或组装使用。
    let needleBitmap = 0
    // 按索引扫描 `nLen`，需要消费相邻参数时可以精确移动游标。
    for (let j = 0; j < nLen; j++) {
      // ch保存`needle.charAt`，供index后续处理使用。
      const ch = needle.charAt(j)
      // needleChars[j更新为 `ch`，确保index后续读取最新状态。
      needleChars[j] = ch
      // cc保存`ch.charCodeAt`，供index后续处理使用。
      const cc = ch.charCodeAt(0)
      // 组合条件 `cc >= 97 && cc <= 122) needleBitmap |= 1 << (cc - 97` 成立时，index才启用这条专门路径。
      if (cc >= 97 && cc <= 122) needleBitmap |= 1 << (cc - 97)
    }

    // Upper bound on score assuming every match gets the max boundary bonus.
    // Used to reject paths whose gap penalties alone make them unable to beat
    // the current top-k threshold, before the charCodeAt-heavy boundary pass.
    // scoreCeiling 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const scoreCeiling =
      nLen * (SCORE_MATCH + BONUS_BOUNDARY) + BONUS_FIRST_CHAR + 32

    // Top-k: maintain a sorted-ascending array of the best `limit` matches.
    // Avoids O(n log n) sort of all matches when we only need `limit` of them.
    // topK 从空数组开始收集，后续循环会按处理顺序追加条目。
    const topK: { path: string; fuzzScore: number }[] = []
    // threshold 命名 `-Infinity`，让后续代码直接表达这个值的用途。
    let threshold = -Infinity

    // 从 `this` 解构 paths、lowerPaths、charBits、pathLens，减少index对同一对象的重复访问。
    const { paths, lowerPaths, charBits, pathLens, readyCount } = this

    // index在这里处理 `outer: for (let i = 0; i < readyCount; i++) {`，完成这一小步状态转换。
    outer: for (let i = 0; i < readyCount; i++) {
      // O(1) bitmap reject: path must contain every letter in the needle
      // `(charBits[i]! & needleBitmap)` 与 `needleBitmap` 不一致时刷新派生状态，避免使用过期结果。
      if ((charBits[i]! & needleBitmap) !== needleBitmap) continue

      // haystack保存`caseSensitive ? paths[i]! : lowerPaths[i]!`，供index后续判断或输出使用。
      const haystack = caseSensitive ? paths[i]! : lowerPaths[i]!

      // Fused indexOf scan: find positions (SIMD-accelerated in JSC/V8) AND
      // accumulate gap/consecutive terms inline. The greedy-earliest positions
      // found here are identical to what the charCodeAt scorer would find, so
      // we score directly from them — no second scan.
      // pos 集合保存`haystack.indexOf`，供index后续处理使用。
      let pos = haystack.indexOf(needleChars[0]!)
      // 满足 `pos === -1` 时，index执行该分支。
      if (pos === -1) continue
      // posBuf[0更新为 `pos`，确保index后续读取最新状态。
      posBuf[0] = pos
      // gapPenalty保存`0`，供index后续判断或输出使用。
      let gapPenalty = 0
      // consecBonus 集合保存`0`，供后续判断或组装使用。
      let consecBonus = 0
      // prev保存`pos`，供index后续判断或输出使用。
      let prev = pos
      // 循环处理 `let j = 1; j < nLen; j++`，让index逐项把同类条目按顺序走完。
      for (let j = 1; j < nLen; j++) {
        // pos 集合更新为 `haystack.indexOf(needleChars[j]!, prev + 1)`，确保index后续读取最新状态。
        pos = haystack.indexOf(needleChars[j]!, prev + 1)
        // 满足 `pos === -1` 时，index执行该分支。
        if (pos === -1) continue outer
        // posBuf[j更新为 `pos`，确保index后续读取最新状态。
        posBuf[j] = pos
        // gap保存`pos - prev - 1`，供index后续判断或输出使用。
        const gap = pos - prev - 1
        // 满足 `gap === 0` 时，index执行该分支。
        if (gap === 0) consecBonus += BONUS_CONSECUTIVE
        else gapPenalty += PENALTY_GAP_START + gap * PENALTY_GAP_EXTENSION
        // prev更新为 `pos`，确保index后续读取最新状态。
        prev = pos
      }

      // Gap-bound reject: if the best-case score (all boundary bonuses) minus
      // known gap penalties can't beat threshold, skip the boundary pass.
      // index在这里进入条件判断，后续代码按实际状态分流。
      if (
        topK.length === limit &&
        scoreCeiling + consecBonus - gapPenalty <= threshold
      ) {
        // 跳过当前项，继续处理index中的下一轮循环。
        continue
      }

      // Boundary/camelCase scoring: check the char before each match position.
      // 路径读取 `paths[i]!` 对应条目，后续围绕该成员继续处理。
      const path = paths[i]!
      // hLen读取 `pathLens[i]!` 对应条目，后续围绕该成员继续处理。
      const hLen = pathLens[i]!
      // score保存`nLen * SCORE_MATCH + consecBonus - gapPenalty`，供后续判断或组装使用。
      let score = nLen * SCORE_MATCH + consecBonus - gapPenalty
      // index在这里处理 `score += scoreBonusAt(path, posBuf[0]!, true)`，完成这一小步状态转换。
      score += scoreBonusAt(path, posBuf[0]!, true)
      // 循环处理 `let j = 1; j < nLen; j++`，让index逐项把同类条目按顺序走完。
      for (let j = 1; j < nLen; j++) {
        // index在这里处理 `score += scoreBonusAt(path, posBuf[j]!, false)`，完成这一小步状态转换。
        score += scoreBonusAt(path, posBuf[j]!, false)
      }
      // index在这里处理 `score += Math.max(0, 32 - (hLen >> 2))`，完成这一小步状态转换。
      score += Math.max(0, 32 - (hLen >> 2))

      // 满足 `topK.length < limit` 时，index执行该分支。
      if (topK.length < limit) {
        // topK追加新条目，保持收集顺序与输入顺序一致。
        topK.push({ path, fuzzScore: score })
        // 满足 `topK.length === limit` 时，index执行该分支。
        if (topK.length === limit) {
          // 调用 topK.sort，触发index此处需要的副作用。
          topK.sort((a, b) => a.fuzzScore - b.fuzzScore)
          // threshold更新为 `topK[0]!.fuzzScore`，确保index后续读取最新状态。
          threshold = topK[0]!.fuzzScore
        }
      // index在这里处理 `} else if (score > threshold) {`，完成这一小步状态转换。
      } else if (score > threshold) {
        // lo保存`0`，供index后续判断或输出使用。
        let lo = 0
        // hi记录 `topK.length` 是否成立，下一步按该结果分支。
        let hi = topK.length
        // while 使用 lo < hi 完成index里的对应操作。
        while (lo < hi) {
          // mid 命名 `(lo + hi) >> 1`，让后续代码直接表达这个值的用途。
          const mid = (lo + hi) >> 1
          // 满足 `topK[mid]!.fuzzScore < score` 时，index执行该分支。
          if (topK[mid]!.fuzzScore < score) lo = mid + 1
          else hi = mid
        }
        // 调用 topK.splice，触发index此处需要的副作用。
        topK.splice(lo, 0, { path, fuzzScore: score })
        // 调用 topK.shift，触发index此处需要的副作用。
        topK.shift()
        // threshold更新为 `topK[0]!.fuzzScore`，确保index后续读取最新状态。
        threshold = topK[0]!.fuzzScore
      }
    }

    // topK is ascending; reverse to descending (best first)
    // 调用 topK.sort，触发index此处需要的副作用。
    topK.sort((a, b) => b.fuzzScore - a.fuzzScore)

    // matchCount 数量 命名 `topK.length`，让后续代码直接表达这个值的用途。
    const matchCount = topK.length
    // denom保存`Math.max`，供index后续处理使用。
    const denom = Math.max(matchCount, 1)
    // 结果列表构建`new Array(matchCount)`，供后续判断或组装使用。
    const results: SearchResult[] = new Array(matchCount)

    // 按索引扫描 `matchCount`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < matchCount; i++) {
      // 路径 命名 `topK[i]!.path`，让后续代码直接表达这个值的用途。
      const path = topK[i]!.path
      // positionScore保存`i / denom`，供后续判断或组装使用。
      const positionScore = i / denom
      // finalScore筛选`path.includes`，供index后续处理使用。
      const finalScore = path.includes('test')
        ? Math.min(positionScore * 1.05, 1.0)
        : positionScore
      // results[i更新为 `{ path, score: finalScore }`，确保index后续读取最新状态。
      results[i] = { path, score: finalScore }
    }

    // 返回 `results`，作为index这次计算的结果。
    return results
  }
}

/**
 * Boundary/camelCase bonus for a match at position `pos` in the original-case
 * path. `first` enables the start-of-string bonus (only for needle[0]).
 */
// scoreBonusAt 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function scoreBonusAt(path: string, pos: number, first: boolean): number {
  // 满足 `pos === 0` 时，index执行该分支。
  if (pos === 0) return first ? BONUS_FIRST_CHAR : 0
  // prevCh保存`path.charCodeAt`，供index后续处理使用。
  const prevCh = path.charCodeAt(pos - 1)
  // 满足 `isBoundary(prevCh)` 时，index执行该分支。
  if (isBoundary(prevCh)) return BONUS_BOUNDARY
  // 组合条件 `isLower(prevCh) && isUpper(path.charCodeAt(pos))` 成立时，index才启用这条专门路径。
  if (isLower(prevCh) && isUpper(path.charCodeAt(pos))) return BONUS_CAMEL
  // 返回 `0`，作为index这次计算的结果。
  return 0
}

// isBoundary 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBoundary(code: number): boolean {
  // / \ - _ . space
  // 返回 `(`，作为index这次计算的结果。
  return (
    code === 47 || // /
    code === 92 || // \
    code === 45 || // -
    code === 95 || // _
    code === 46 || // .
    code === 32 // space
  )
}

// isLower 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLower(code: number): boolean {
  // 返回 `code >= 97 && code <= 122`，作为index这次计算的结果。
  return code >= 97 && code <= 122
}

// isUpper 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isUpper(code: number): boolean {
  // 返回 `code >= 65 && code <= 90`，作为index这次计算的结果。
  return code >= 65 && code <= 90
}

// yieldToEventLoop 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function yieldToEventLoop(): Promise<void> {
  // 返回 `new Promise(resolve => setImmediate(resolve))`，作为index这次计算的结果。
  return new Promise(resolve => setImmediate(resolve))
}

// 重新导出这一组成员，让index的公共 API 保持集中入口。
export { CHUNK_MS }

/**
 * Extract unique top-level path segments, sorted by (length asc, then alpha asc).
 * Handles both Unix (/) and Windows (\) path separators.
 * Mirrors FileIndex::compute_top_level_entries in lib.rs.
 */
// computeTopLevelEntries 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeTopLevelEntries(
  paths: string[],
  limit: number,
): SearchResult[] {
  // topLevel构建`new Set<string>()`，供后续判断或组装使用。
  const topLevel = new Set<string>()

  // 按顺序遍历 `paths` 中的p，逐个交给index处理。
  for (const p of paths) {
    // Split on first / or \ separator
    // end保存 `p.length` 的判断结果，供index后续分支直接复用。
    let end = p.length
    // 按索引扫描 `p.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < p.length; i++) {
      // c保存`p.charCodeAt`，供index后续处理使用。
      const c = p.charCodeAt(i)
      // 组合条件 `c === 47 || c === 92` 成立时，index才启用这条专门路径。
      if (c === 47 || c === 92) {
        // end更新为 `i`，确保index后续读取最新状态。
        end = i
        // 结束这个分支或循环，避免index继续落入后续路径。
        break
      }
    }
    // segment格式化`p.slice`，供index后续处理使用。
    const segment = p.slice(0, end)
    // 满足 `segment.length > 0` 时，index执行该分支。
    if (segment.length > 0) {
      // 调用 topLevel.add，触发index此处需要的副作用。
      topLevel.add(segment)
      // 满足 `topLevel.size >= limit` 时，index执行该分支。
      if (topLevel.size >= limit) break
    }
  }

  // sorted保存`Array.from`，供index后续处理使用。
  const sorted = Array.from(topLevel)
  // 调用 sorted.sort，触发index此处需要的副作用。
  sorted.sort((a, b) => {
    // lenDiff保存 `a.length - b.length` 的判断结果，供index后续分支直接复用。
    const lenDiff = a.length - b.length
    // `lenDiff` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (lenDiff !== 0) return lenDiff
    // 返回 `a < b ? -1 : a > b ? 1 : 0`，作为index这次计算的结果。
    return a < b ? -1 : a > b ? 1 : 0
  })

  // 返回 `sorted.slice(0, limit).map(path => ({ path, score: 0.0 }))`，作为index这次计算的结果。
  return sorted.slice(0, limit).map(path => ({ path, score: 0.0 }))
}

export default FileIndex
// 导出类型定义，让其他模块沿用index的数据契约。
export type { FileIndex as FileIndexType }

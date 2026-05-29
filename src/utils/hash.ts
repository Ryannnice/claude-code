/**
 * djb2 string hash — fast non-cryptographic hash returning a signed 32-bit int.
 * Deterministic across runtimes (unlike Bun.hash which uses wyhash). Use as a
 * fallback when Bun.hash isn't available, or when you need on-disk-stable
 * output (e.g. cache directory names that must survive runtime upgrades).
 */
// djb2Hash 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function djb2Hash(str: string): number {
  // hash 命名 `0`，让后续代码直接表达这个值的用途。
  let hash = 0
  // 按索引扫描 `str.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < str.length; i++) {
    // hash更新为 `((hash << 5) - hash + str.charCodeAt(i)) | 0`，确保共享工具后续读取最新状态。
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  // 返回 `hash`，作为共享工具这次计算的结果。
  return hash
}

/**
 * Hash arbitrary content for change detection. Bun.hash is ~100x faster than
 * sha256 and collision-resistant enough for diff detection (not crypto-safe).
 */
// hashContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hashContent(content: string): string {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.hash(content).toString()`，作为共享工具这次计算的结果。
    return Bun.hash(content).toString()
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // crypto保存`require`，供共享工具后续处理使用。
  const crypto = require('crypto') as typeof import('crypto')
  // 返回 `crypto.createHash('sha256').update(content).digest('hex')`，作为共享工具这次计算的结果。
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Hash two strings without allocating a concatenated temp string. Bun path
 * seed-chains wyhash (hash(a) feeds as seed to hash(b)); Node path uses
 * incremental SHA-256 update. Seed-chaining naturally disambiguates
 * ("ts","code") vs ("tsc","ode") so no separator is needed under Bun.
 */
// hashPair 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hashPair(a: string, b: string): string {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.hash(b, Bun.hash(a)).toString()`，作为共享工具这次计算的结果。
    return Bun.hash(b, Bun.hash(a)).toString()
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // crypto保存`require`，供共享工具后续处理使用。
  const crypto = require('crypto') as typeof import('crypto')
  // 返回 `crypto`，作为共享工具这次计算的结果。
  return crypto
    .createHash('sha256')
    .update(a)
    .update('\0')
    .update(b)
    .digest('hex')
}

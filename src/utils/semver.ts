/**
 * Semver comparison utilities that use Bun.semver when available
 * and fall back to the npm `semver` package in Node.js environments.
 *
 * Bun.semver.order() is ~20x faster than npm semver comparisons.
 * The npm semver fallback always uses { loose: true }.
 */

// _npmSemver 先占位，稍后的条件分支会根据实际输入补齐它。
let _npmSemver: typeof import('semver') | undefined

// getNpmSemver 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getNpmSemver(): typeof import('semver') {
  // _npmSemver缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!_npmSemver) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // _npmSemver更新为 `require('semver') as typeof import('semver')`，确保共享工具后续读取最新状态。
    _npmSemver = require('semver') as typeof import('semver')
  }
  // 返回 `_npmSemver`，作为共享工具这次计算的结果。
  return _npmSemver
}

// gt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function gt(a: string, b: string): boolean {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.semver.order(a, b) === 1`，作为共享工具这次计算的结果。
    return Bun.semver.order(a, b) === 1
  }
  // 返回 `getNpmSemver().gt(a, b, { loose: true })`，作为共享工具这次计算的结果。
  return getNpmSemver().gt(a, b, { loose: true })
}

// gte 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function gte(a: string, b: string): boolean {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.semver.order(a, b) >= 0`，作为共享工具这次计算的结果。
    return Bun.semver.order(a, b) >= 0
  }
  // 返回 `getNpmSemver().gte(a, b, { loose: true })`，作为共享工具这次计算的结果。
  return getNpmSemver().gte(a, b, { loose: true })
}

// lt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function lt(a: string, b: string): boolean {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.semver.order(a, b) === -1`，作为共享工具这次计算的结果。
    return Bun.semver.order(a, b) === -1
  }
  // 返回 `getNpmSemver().lt(a, b, { loose: true })`，作为共享工具这次计算的结果。
  return getNpmSemver().lt(a, b, { loose: true })
}

// lte 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function lte(a: string, b: string): boolean {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.semver.order(a, b) <= 0`，作为共享工具这次计算的结果。
    return Bun.semver.order(a, b) <= 0
  }
  // 返回 `getNpmSemver().lte(a, b, { loose: true })`，作为共享工具这次计算的结果。
  return getNpmSemver().lte(a, b, { loose: true })
}

// satisfies 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function satisfies(version: string, range: string): boolean {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.semver.satisfies(version, range)`，作为共享工具这次计算的结果。
    return Bun.semver.satisfies(version, range)
  }
  // 返回 `getNpmSemver().satisfies(version, range, { loose: true })`，作为共享工具这次计算的结果。
  return getNpmSemver().satisfies(version, range, { loose: true })
}

// order 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function order(a: string, b: string): -1 | 0 | 1 {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.semver.order(a, b)`，作为共享工具这次计算的结果。
    return Bun.semver.order(a, b)
  }
  // 返回 `getNpmSemver().compare(a, b, { loose: true })`，作为共享工具这次计算的结果。
  return getNpmSemver().compare(a, b, { loose: true })
}

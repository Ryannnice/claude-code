/**
 * YAML parsing wrapper.
 *
 * Uses Bun.YAML (built-in, zero-cost) when running under Bun, otherwise falls
 * back to the `yaml` npm package. The package is lazy-required inside the
 * non-Bun branch so native Bun builds never load the ~270KB yaml parser.
 */

// parseYaml 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseYaml(input: string): unknown {
  // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Bun !== 'undefined') {
    // 返回 `Bun.YAML.parse(input)`，作为共享工具这次计算的结果。
    return Bun.YAML.parse(input)
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // 返回 `(require('yaml') as typeof import('yaml')).parse(input)`，作为共享工具这次计算的结果。
  return (require('yaml') as typeof import('yaml')).parse(input)
}

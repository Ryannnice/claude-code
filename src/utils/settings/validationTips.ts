// 类型依赖 { ZodIssueCode } 来自 zod/v4，用于校准共享工具的数据契约。
import type { ZodIssueCode } from 'zod/v4'

// v4 ZodIssueCode is a value, not a type - use typeof to get the type
// ZodIssueCodeType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ZodIssueCodeType = (typeof ZodIssueCode)[keyof typeof ZodIssueCode]

// ValidationTip 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ValidationTip = {
  suggestion?: string
  docLink?: string
}

// TipContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TipContext = {
  path: string
  code: ZodIssueCodeType | string
  expected?: string
  received?: unknown
  enumValues?: string[]
  message?: string
  value?: unknown
}

// TipMatcher 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TipMatcher = {
  // 这个回调绑定到 matches: (context: TipContext) => boolean，负责共享工具在该局部场景下的响应。
  matches: (context: TipContext) => boolean
  tip: ValidationTip
}

// DOCUMENTATION_BASE 命名 `'https://code.claude.com/docs/en'`，让后续代码直接表达这个值的用途。
const DOCUMENTATION_BASE = 'https://code.claude.com/docs/en'

// TIP_MATCHERS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const TIP_MATCHERS: TipMatcher[] = [
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.path === 'permissions.defaultMode' && ctx.code === 'invalid_value',
    tip: {
      suggestion:
        'Valid modes: "acceptEdits" (ask before file changes), "plan" (analysis only), "bypassPermissions" (auto-accept all), or "default" (standard behavior)',
      docLink: `${DOCUMENTATION_BASE}/iam#permission-modes`,
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.path === 'apiKeyHelper' && ctx.code === 'invalid_type',
    tip: {
      suggestion:
        'Provide a shell command that outputs your API key to stdout. The script should output only the API key. Example: "/bin/generate_temp_api_key.sh"',
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.path === 'cleanupPeriodDays' &&
      ctx.code === 'too_small' &&
      ctx.expected === '0',
    tip: {
      suggestion:
        'Must be 0 or greater. Set a positive number for days to retain transcripts (default is 30). Setting 0 disables session persistence entirely: no transcripts are written and existing transcripts are deleted at startup.',
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.path.startsWith('env.') && ctx.code === 'invalid_type',
    tip: {
      suggestion:
        'Environment variables must be strings. Wrap numbers and booleans in quotes. Example: "DEBUG": "true", "PORT": "3000"',
      docLink: `${DOCUMENTATION_BASE}/settings#environment-variables`,
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      (ctx.path === 'permissions.allow' || ctx.path === 'permissions.deny') &&
      ctx.code === 'invalid_type' &&
      ctx.expected === 'array',
    tip: {
      suggestion:
        'Permission rules must be in an array. Format: ["Tool(specifier)"]. Examples: ["Bash(npm run build)", "Edit(docs/**)", "Read(~/.zshrc)"]. Use * for wildcards.',
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.path.includes('hooks') && ctx.code === 'invalid_type',
    tip: {
      suggestion:
        // gh-31187 / CC-282: prior example showed {"matcher": {"tools": ["BashTool"]}}
        // — an object format that never existed in the schema (matcher is z.string(),
        // always has been). Users copied the tip's example and got the same validation
        // error again. See matchesPattern() in hooks.ts: matcher is exact-match,
        // pipe-separated ("Edit|Write"), or regex. Empty/"*" matches all.
        'Hooks use a matcher + hooks array. The matcher is a string: a tool name ("Bash"), pipe-separated list ("Edit|Write"), or empty to match all. Example: {"PostToolUse": [{"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "echo Done"}]}]}',
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.code === 'invalid_type' && ctx.expected === 'boolean',
    tip: {
      suggestion:
        'Use true or false without quotes. Example: "includeCoAuthoredBy": true',
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean => ctx.code === 'unrecognized_keys',，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean => ctx.code === 'unrecognized_keys',
    tip: {
      suggestion:
        'Check for typos or refer to the documentation for valid fields',
      docLink: `${DOCUMENTATION_BASE}/settings`,
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.code === 'invalid_value' && ctx.enumValues !== undefined,
    tip: {
      suggestion: undefined,
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.code === 'invalid_type' &&
      ctx.expected === 'object' &&
      ctx.received === null &&
      ctx.path === '',
    tip: {
      suggestion:
        'Check for missing commas, unmatched brackets, or trailing commas. Use a JSON validator to identify the exact syntax error.',
    },
  },
  {
    // 这个回调绑定到 matches: (ctx): boolean =>，负责共享工具在该局部场景下的响应。
    matches: (ctx): boolean =>
      ctx.path === 'permissions.additionalDirectories' &&
      ctx.code === 'invalid_type',
    tip: {
      suggestion:
        'Must be an array of directory paths. Example: ["~/projects", "/tmp/workspace"]. You can also use --add-dir flag or /add-dir command',
      docLink: `${DOCUMENTATION_BASE}/iam#working-directories`,
    },
  },
]

// PATH_DOC_LINKS 路径数据 集中保存共享工具 validation Tips要一起传递的字段。
const PATH_DOC_LINKS: Record<string, string> = {
  permissions: `${DOCUMENTATION_BASE}/iam#configuring-permissions`,
  env: `${DOCUMENTATION_BASE}/settings#environment-variables`,
  hooks: `${DOCUMENTATION_BASE}/hooks`,
}

// getValidationTip 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getValidationTip(context: TipContext): ValidationTip | null {
  // matcher筛选`TIP_MATCHERS.find`，供共享工具后续处理使用。
  const matcher = TIP_MATCHERS.find(m => m.matches(context))

  // matcher缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!matcher) return null

  // tip 集中保存共享工具 validation Tips要一起传递的字段。
  const tip: ValidationTip = { ...matcher.tip }

  // 共享工具在这里按实际状态进入对应分支。
  if (
    context.code === 'invalid_value' &&
    context.enumValues &&
    !tip.suggestion
  ) {
    // suggestion更新为 ``Valid values: ${context.enumValues.map(v => `"${v}"`).jo...`，确保共享工具后续读取最新状态。
    tip.suggestion = `Valid values: ${context.enumValues.map(v => `"${v}"`).join(', ')}`
  }

  // Add documentation link based on path prefix
  // 只有 `!tip.docLink && context.path` 满足时，共享工具才执行该分支。
  if (!tip.docLink && context.path) {
    // pathPrefix 路径数据格式化`path.split`，供共享工具后续处理使用。
    const pathPrefix = context.path.split('.')[0]
    // 满足 `pathPrefix` 时，共享工具执行该分支。
    if (pathPrefix) {
      // docLink更新为 `PATH_DOC_LINKS[pathPrefix]`，确保共享工具后续读取最新状态。
      tip.docLink = PATH_DOC_LINKS[pathPrefix]
    }
  }

  // 返回 `tip`，作为共享工具这次计算的结果。
  return tip
}

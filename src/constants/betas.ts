// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import { feature } from 'bun:bundle'

// CLAUDE_CODE_20250219_BETA_HEADER固定为 `'claude-code-20250219'`，作为betas后续展示或比较的基准。
export const CLAUDE_CODE_20250219_BETA_HEADER = 'claude-code-20250219'
// INTERLEAVED_THINKING_BETA_HEADER 先占位，稍后的条件分支会根据实际输入补齐它。
export const INTERLEAVED_THINKING_BETA_HEADER =
  'interleaved-thinking-2025-05-14'
// CONTEXT_1M_BETA_HEADER保存`'context-1m-2025-08-07'`，作为后续固定文本处理的输入。
export const CONTEXT_1M_BETA_HEADER = 'context-1m-2025-08-07'
// CONTEXT_MANAGEMENT_BETA_HEADER固定为 `'context-management-2025-06-27'`，作为betas后续展示或比较的基准。
export const CONTEXT_MANAGEMENT_BETA_HEADER = 'context-management-2025-06-27'
// STRUCTURED_OUTPUTS_BETA_HEADER固定为 `'structured-outputs-2025-12-15'`，作为betas后续展示或比较的基准。
export const STRUCTURED_OUTPUTS_BETA_HEADER = 'structured-outputs-2025-12-15'
// WEB_SEARCH_BETA_HEADER 命名 `'web-search-2025-03-05'`，让后续代码直接表达这个值的用途。
export const WEB_SEARCH_BETA_HEADER = 'web-search-2025-03-05'
// Tool search beta headers differ by provider:
// - Claude API / Foundry: advanced-tool-use-2025-11-20
// - Vertex AI / Bedrock: tool-search-tool-2025-10-19
// TOOL_SEARCH_BETA_HEADER_1P保存`'advanced-tool-use-2025-11-20'`，作为后续固定文本处理的输入。
export const TOOL_SEARCH_BETA_HEADER_1P = 'advanced-tool-use-2025-11-20'
// TOOL_SEARCH_BETA_HEADER_3P固定为 `'tool-search-tool-2025-10-19'`，作为betas后续展示或比较的基准。
export const TOOL_SEARCH_BETA_HEADER_3P = 'tool-search-tool-2025-10-19'
// EFFORT_BETA_HEADER保存`'effort-2025-11-24'`，作为后续固定文本处理的输入。
export const EFFORT_BETA_HEADER = 'effort-2025-11-24'
// TASK_BUDGETS_BETA_HEADER 命名 `'task-budgets-2026-03-13'`，让后续代码直接表达这个值的用途。
export const TASK_BUDGETS_BETA_HEADER = 'task-budgets-2026-03-13'
// PROMPT_CACHING_SCOPE_BETA_HEADER 先占位，稍后的条件分支会根据实际输入补齐它。
export const PROMPT_CACHING_SCOPE_BETA_HEADER =
  'prompt-caching-scope-2026-01-05'
// FAST_MODE_BETA_HEADER固定为 `'fast-mode-2026-02-01'`，作为betas后续展示或比较的基准。
export const FAST_MODE_BETA_HEADER = 'fast-mode-2026-02-01'
// REDACT_THINKING_BETA_HEADER固定为 `'redact-thinking-2026-02-12'`，作为betas后续展示或比较的基准。
export const REDACT_THINKING_BETA_HEADER = 'redact-thinking-2026-02-12'
// TOKEN_EFFICIENT_TOOLS_BETA_HEADER 先占位，稍后的条件分支会根据实际输入补齐它。
export const TOKEN_EFFICIENT_TOOLS_BETA_HEADER =
  'token-efficient-tools-2026-03-28'
// SUMMARIZE_CONNECTOR_TEXT_BETA_HEADER保存`feature`，供betas后续处理使用。
export const SUMMARIZE_CONNECTOR_TEXT_BETA_HEADER = feature('CONNECTOR_TEXT')
  ? 'summarize-connector-text-2026-03-13'
  : ''
// AFK_MODE_BETA_HEADER保存`feature`，供betas后续处理使用。
export const AFK_MODE_BETA_HEADER = feature('TRANSCRIPT_CLASSIFIER')
  ? 'afk-mode-2026-01-31'
  : ''
// CLI_INTERNAL_BETA_HEADER 先占位，稍后的条件分支会根据实际输入补齐它。
export const CLI_INTERNAL_BETA_HEADER =
  process.env.USER_TYPE === 'ant' ? 'cli-internal-2026-02-09' : ''
// ADVISOR_BETA_HEADER保存`'advisor-tool-2026-03-01'`，作为后续固定文本处理的输入。
export const ADVISOR_BETA_HEADER = 'advisor-tool-2026-03-01'

/**
 * Bedrock only supports a limited number of beta headers and only through
 * extraBodyParams. This set maintains the beta strings that should be in
 * Bedrock extraBodyParams *and not* in Bedrock headers.
 */
// BEDROCK_EXTRA_PARAMS_HEADERS 集合保存`Set`，供betas后续处理使用。
export const BEDROCK_EXTRA_PARAMS_HEADERS = new Set([
  INTERLEAVED_THINKING_BETA_HEADER,
  CONTEXT_1M_BETA_HEADER,
  TOOL_SEARCH_BETA_HEADER_3P,
])

/**
 * Betas allowed on Vertex countTokens API.
 * Other betas will cause 400 errors.
 */
// VERTEX_COUNT_TOKENS_ALLOWED_BETAS 数量保存`Set`，供betas后续处理使用。
export const VERTEX_COUNT_TOKENS_ALLOWED_BETAS = new Set([
  CLAUDE_CODE_20250219_BETA_HEADER,
  INTERLEAVED_THINKING_BETA_HEADER,
  CONTEXT_MANAGEMENT_BETA_HEADER,
])

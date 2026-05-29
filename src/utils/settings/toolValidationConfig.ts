/**
 * Tool validation configuration
 *
 * Most tools need NO configuration - basic validation works automatically.
 * Only add your tool here if it has special pattern requirements.
 */

// ToolValidationConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolValidationConfig = {
  /** Tools that accept file glob patterns (e.g., *.ts, src/**) */
  filePatternTools: string[]

  /** Tools that accept bash wildcard patterns (* anywhere) and legacy :* prefix syntax */
  bashPrefixTools: string[]

  /** Custom validation rules for specific tools */
  customValidation: {
    // 这个回调绑定到 [toolName: string]: (content: string) => {，负责共享工具在该局部场景下的响应。
    [toolName: string]: (content: string) => {
      valid: boolean
      error?: string
      suggestion?: string
      examples?: string[]
    }
  }
}

// TOOL_VALIDATION_CONFIG 配置 集中保存共享工具 tool Validation Config要一起传递的字段。
export const TOOL_VALIDATION_CONFIG: ToolValidationConfig = {
  // File pattern tools (accept *.ts, src/**, etc.)
  filePatternTools: [
    'Read',
    'Write',
    'Edit',
    'Glob',
    'NotebookRead',
    'NotebookEdit',
  ],

  // Bash wildcard tools (accept * anywhere, and legacy command:* syntax)
  bashPrefixTools: ['Bash'],

  // Custom validation (only if needed)
  customValidation: {
    // WebSearch doesn't support wildcards or complex patterns
    // 这个回调绑定到 WebSearch: content => {，负责共享工具在该局部场景下的响应。
    WebSearch: content => {
      // 只有 `content.includes('*') || content.includes('?')` 满足时，共享工具才执行该分支。
      if (content.includes('*') || content.includes('?')) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          valid: false,
          error: 'WebSearch does not support wildcards',
          suggestion: 'Use exact search terms without * or ?',
          examples: ['WebSearch(claude ai)', 'WebSearch(typescript tutorial)'],
        }
      }
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { valid: true }
    },

    // WebFetch uses domain: prefix for hostname-based permissions
    // 这个回调绑定到 WebFetch: content => {，负责共享工具在该局部场景下的响应。
    WebFetch: content => {
      // Check if it's trying to use a URL format
      // 只有 `content.includes('://') || content.startsWith('http')` 满足时，共享工具才执行该分支。
      if (content.includes('://') || content.startsWith('http')) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          valid: false,
          error: 'WebFetch permissions use domain format, not URLs',
          suggestion: 'Use "domain:hostname" format',
          examples: [
            'WebFetch(domain:example.com)',
            'WebFetch(domain:github.com)',
          ],
        }
      }

      // Must start with domain: prefix
      // 满足 `!content.startsWith('domain:')` 时，共享工具执行该分支。
      if (!content.startsWith('domain:')) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          valid: false,
          error: 'WebFetch permissions must use "domain:" prefix',
          suggestion: 'Use "domain:hostname" format',
          examples: [
            'WebFetch(domain:example.com)',
            'WebFetch(domain:*.google.com)',
          ],
        }
      }

      // Allow wildcards in domain patterns
      // Valid: domain:*.example.com, domain:example.*, etc.
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { valid: true }
    },
  },
}

// Helper to check if a tool uses file patterns
// isFilePatternTool 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFilePatternTool(toolName: string): boolean {
  // 返回 `TOOL_VALIDATION_CONFIG.filePatternTools.includes(toolName)`，作为共享工具这次计算的结果。
  return TOOL_VALIDATION_CONFIG.filePatternTools.includes(toolName)
}

// Helper to check if a tool uses bash prefix patterns
// isBashPrefixTool 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBashPrefixTool(toolName: string): boolean {
  // 返回 `TOOL_VALIDATION_CONFIG.bashPrefixTools.includes(toolName)`，作为共享工具这次计算的结果。
  return TOOL_VALIDATION_CONFIG.bashPrefixTools.includes(toolName)
}

// Helper to get custom validation for a tool
// getCustomValidation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCustomValidation(toolName: string) {
  // 返回 `TOOL_VALIDATION_CONFIG.customValidation[toolName]`，作为共享工具这次计算的结果。
  return TOOL_VALIDATION_CONFIG.customValidation[toolName]
}

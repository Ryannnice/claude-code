// 类型依赖 { ValidationResult } 来自 src/Tool.js，用于校准共享工具的数据契约。
import type { ValidationResult } from 'src/Tool.js'
// 引入 isClaudeSettingsPath，将 ../permissions/filesystem.js 中已经封装好的能力接到本文件流程里。
import { isClaudeSettingsPath } from '../permissions/filesystem.js'
// 引入 validateSettingsFileContent，将 ./validation.js 中已经封装好的能力接到本文件流程里。
import { validateSettingsFileContent } from './validation.js'

/**
 * Validates settings file edits to ensure the result conforms to SettingsSchema.
 * This is used by FileEditTool to avoid code duplication.
 *
 * @param filePath - The file path being edited
 * @param originalContent - The original file content before edits
 * @param getUpdatedContent - A closure that returns the content after applying edits
 * @returns Validation result with error details if validation fails
 */
// validateInputForSettingsFileEdit 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateInputForSettingsFileEdit(
  filePath: string,
  originalContent: string,
  // 这个回调绑定到 getUpdatedContent: () => string,，负责共享工具在该局部场景下的响应。
  getUpdatedContent: () => string,
): Extract<ValidationResult, { result: false }> | null {
  // Only validate Claude settings files
  // 满足 `!isClaudeSettingsPath(filePath)` 时，共享工具执行该分支。
  if (!isClaudeSettingsPath(filePath)) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Check if the current file (before edit) conforms to the schema
  // beforeValidation读取`validateSettingsFileContent`，供共享工具后续处理使用。
  const beforeValidation = validateSettingsFileContent(originalContent)

  // beforeValidation.isValid缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!beforeValidation.isValid) {
    // If the before version is invalid, allow the edit (don't block it)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // If the before version is valid, ensure the after version is also valid
  // updatedContent读取`getUpdatedContent`，供共享工具后续处理使用。
  const updatedContent = getUpdatedContent()
  // afterValidation读取`validateSettingsFileContent`，供共享工具后续处理使用。
  const afterValidation = validateSettingsFileContent(updatedContent)

  // afterValidation.isValid缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!afterValidation.isValid) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      result: false,
      message: `Claude Code settings.json validation failed after edit:\n${afterValidation.error}\n\nFull schema:\n${afterValidation.fullSchema}\nIMPORTANT: Do not update the env unless explicitly instructed to do so.`,
      errorCode: 10,
    }
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

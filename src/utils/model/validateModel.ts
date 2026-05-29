// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 MODEL_ALIASES，将 ./aliases.js 中已经封装好的能力接到本文件流程里。
import { MODEL_ALIASES } from './aliases.js'
// 引入 isModelAllowed，将 ./modelAllowlist.js 中已经封装好的能力接到本文件流程里。
import { isModelAllowed } from './modelAllowlist.js'
// 引入 getAPIProvider，将 ./providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from './providers.js'
// 引入 sideQuery，将 ../sideQuery.js 中已经封装好的能力接到本文件流程里。
import { sideQuery } from '../sideQuery.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  NotFoundError,
  APIError,
  APIConnectionError,
  AuthenticationError,
} from '@anthropic-ai/sdk'
// 引入 getModelStrings，将 ./modelStrings.js 中已经封装好的能力接到本文件流程里。
import { getModelStrings } from './modelStrings.js'

// Cache valid models to avoid repeated API calls
// validModelCache 缓存构建`new Map<string, boolean>()` 整理出中间结果，供共享工具模型工具 validate Model后续步骤使用。
const validModelCache = new Map<string, boolean>()

/**
 * Validates a model by attempting an actual API call.
 */
// validateModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateModel(
  model: string,
): Promise<{ valid: boolean; error?: string }> {
  // normalizedModel格式化`model.trim`，供共享工具后续处理使用。
  const normalizedModel = model.trim()

  // Empty model is invalid
  // normalizedModel缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!normalizedModel) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: false, error: 'Model name cannot be empty' }
  }

  // Check against availableModels allowlist before any API call
  // 满足 `!isModelAllowed(normalizedModel)` 时，共享工具执行该分支。
  if (!isModelAllowed(normalizedModel)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      valid: false,
      error: `Model '${normalizedModel}' is not in the list of available models`,
    }
  }

  // Check if it's a known alias (these are always valid)
  // lowerModel保存`normalizedModel.toLowerCase`，供共享工具后续处理使用。
  const lowerModel = normalizedModel.toLowerCase()
  // 满足 `(MODEL_ALIASES as readonly string[]).includes(lowerModel)` 时，共享工具执行该分支。
  if ((MODEL_ALIASES as readonly string[]).includes(lowerModel)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  }

  // Check if it matches ANTHROPIC_CUSTOM_MODEL_OPTION (pre-validated by the user)
  // 满足 `normalizedModel === process.env.ANTHROPIC_CUSTOM_` 时，共享工具执行该分支。
  if (normalizedModel === process.env.ANTHROPIC_CUSTOM_MODEL_OPTION) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  }

  // Check cache first
  // 满足 `validModelCache.has(normalizedModel)` 时，共享工具执行该分支。
  if (validModelCache.has(normalizedModel)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  }


  // Try to make an actual API call with minimal parameters
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `sideQuery({` 完成，再继续模型工具 validate Model的异步流程。
    await sideQuery({
      model: normalizedModel,
      max_tokens: 1,
      maxRetries: 0,
      querySource: 'model_validation',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Hi',
              cache_control: { type: 'ephemeral' },
            },
          ],
        },
      ],
    })

    // If we got here, the model is valid
    // validModelCache.set 写入新的状态值，使共享工具后续读取保持一致。
    validModelCache.set(normalizedModel, true)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  } catch (error) {
    // 返回 `handleValidationError(error, normalizedModel)`，作为共享工具这次计算的结果。
    return handleValidationError(error, normalizedModel)
  }
}

// handleValidationError 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleValidationError(
  error: unknown,
  modelName: string,
): { valid: boolean; error: string } {
  // NotFoundError (404) means the model doesn't exist
  // 满足 `error instanceof NotFoundError` 时，共享工具执行该分支。
  if (error instanceof NotFoundError) {
    // fallback读取`get3PFallbackSuggestion`，供共享工具后续处理使用。
    const fallback = get3PFallbackSuggestion(modelName)
    // suggestion保存`fallback ? `. Try '${fallback}' instead` : ''`，供共享工具模型工具 validate Model后续判断或输出使用。
    const suggestion = fallback ? `. Try '${fallback}' instead` : ''
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      valid: false,
      error: `Model '${modelName}' not found${suggestion}`,
    }
  }

  // For other API errors, provide context-specific messages
  // 满足 `error instanceof APIError` 时，共享工具执行该分支。
  if (error instanceof APIError) {
    // 满足 `error instanceof AuthenticationError` 时，共享工具执行该分支。
    if (error instanceof AuthenticationError) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        valid: false,
        error: 'Authentication failed. Please check your API credentials.',
      }
    }

    // 满足 `error instanceof APIConnectionError` 时，共享工具执行该分支。
    if (error instanceof APIConnectionError) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        valid: false,
        error: 'Network error. Please check your internet connection.',
      }
    }

    // Check error body for model-specific errors
    // errorBody 错误信息保存`error.error as unknown`，供共享工具模型工具 validate Model后续判断或输出使用。
    const errorBody = error.error as unknown
    // 共享工具在这里按实际状态进入对应分支。
    if (
      errorBody &&
      typeof errorBody === 'object' &&
      'type' in errorBody &&
      errorBody.type === 'not_found_error' &&
      'message' in errorBody &&
      typeof errorBody.message === 'string' &&
      errorBody.message.includes('model:')
    ) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { valid: false, error: `Model '${modelName}' not found` }
    }

    // Generic API error
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: false, error: `API error: ${error.message}` }
  }

  // For unknown errors, be safe and reject
  // errorMessage 消息数据保存`String`，供共享工具后续处理使用。
  const errorMessage = error instanceof Error ? error.message : String(error)
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    valid: false,
    error: `Unable to validate model: ${errorMessage}`,
  }
}

// @[MODEL LAUNCH]: Add a fallback suggestion chain for the new model → previous version
/**
 * Suggest a fallback model for 3P users when the selected model is unavailable.
 */
// get3PFallbackSuggestion 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function get3PFallbackSuggestion(model: string): string | undefined {
  // 当 `getAPIProvider()` 匹配 `'firstParty'` 时，共享工具执行对应分支。
  if (getAPIProvider() === 'firstParty') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // lowerModel保存`model.toLowerCase`，供共享工具后续处理使用。
  const lowerModel = model.toLowerCase()
  // 只有 `lowerModel.includes('opus-4-6') || lowerModel.includes('opus_4_6')` 满足时，共享工具才执行该分支。
  if (lowerModel.includes('opus-4-6') || lowerModel.includes('opus_4_6')) {
    // 返回 `getModelStrings().opus41`，作为共享工具这次计算的结果。
    return getModelStrings().opus41
  }
  // 只有 `lowerModel.includes('sonnet-4-6') || lowerModel.includes('sonnet_4_6')` 满足时，共享工具才执行该分支。
  if (lowerModel.includes('sonnet-4-6') || lowerModel.includes('sonnet_4_6')) {
    // 返回 `getModelStrings().sonnet45`，作为共享工具这次计算的结果。
    return getModelStrings().sonnet45
  }
  // 只有 `lowerModel.includes('sonnet-4-5') || lowerModel.includes('sonnet_4_5')` 满足时，共享工具才执行该分支。
  if (lowerModel.includes('sonnet-4-5') || lowerModel.includes('sonnet_4_5')) {
    // 返回 `getModelStrings().sonnet40`，作为共享工具这次计算的结果。
    return getModelStrings().sonnet40
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

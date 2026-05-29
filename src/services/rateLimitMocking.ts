/**
 * Facade for rate limit header processing
 * This isolates mock logic from production code
 */

// 引入 APIError，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import { APIError } from '@anthropic-ai/sdk'
// 整理这一组导入，让服务层 rate Limit Mocking后续逻辑可以直接复用这些外部能力。
import {
  applyMockHeaders,
  checkMockFastModeRateLimit,
  getMockHeaderless429Message,
  getMockHeaders,
  isMockFastModeRateLimitScenario,
  shouldProcessMockLimits,
} from './mockRateLimits.js'

/**
 * Process headers, applying mocks if /mock-limits command is active
 */
// processRateLimitHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function processRateLimitHeaders(
  headers: globalThis.Headers,
): globalThis.Headers {
  // Only apply mocks for Ant employees using /mock-limits command
  // 满足 `shouldProcessMockLimits()` 时，服务层 rate Limit Mocking执行该分支。
  if (shouldProcessMockLimits()) {
    // 返回 `applyMockHeaders(headers)`，作为服务层 rate Limit Mocking这次计算的结果。
    return applyMockHeaders(headers)
  }
  // 返回 `headers`，作为服务层 rate Limit Mocking这次计算的结果。
  return headers
}

/**
 * Check if we should process rate limits (either real subscriber or /mock-limits command)
 */
// shouldProcessRateLimits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldProcessRateLimits(isSubscriber: boolean): boolean {
  // 返回 `isSubscriber || shouldProcessMockLimits()`，作为服务层 rate Limit Mocking这次计算的结果。
  return isSubscriber || shouldProcessMockLimits()
}

/**
 * Check if mock rate limits should throw a 429 error
 * Returns the error to throw, or null if no error should be thrown
 * @param currentModel The model being used for the current request
 * @param isFastModeActive Whether fast mode is currently active (for fast-mode-only mocks)
 */
// checkMockRateLimitError 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkMockRateLimitError(
  currentModel: string,
  isFastModeActive?: boolean,
): APIError | null {
  // 满足 `!shouldProcessMockLimits()` 时，服务层 rate Limit Mocking执行该分支。
  if (!shouldProcessMockLimits()) {
    // 返回 `null`，作为服务层 rate Limit Mocking这次计算的结果。
    return null
  }

  // headerlessMessage 消息数据读取`getMockHeaderless429Message`，供服务层 rate Limit Mocking后续处理使用。
  const headerlessMessage = getMockHeaderless429Message()
  // 满足 `headerlessMessage` 时，服务层 rate Limit Mocking执行该分支。
  if (headerlessMessage) {
    // 返回 `new APIError(`，作为服务层 rate Limit Mocking这次计算的结果。
    return new APIError(
      429,
      { error: { type: 'rate_limit_error', message: headerlessMessage } },
      headerlessMessage,
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      new globalThis.Headers(),
    )
  }

  // mockHeaders 集合读取`getMockHeaders`，供服务层 rate Limit Mocking后续处理使用。
  const mockHeaders = getMockHeaders()
  // mockHeaders 集合缺失时提前走兜底路径，避免服务层 rate Limit Mocking继续依赖无效输入。
  if (!mockHeaders) {
    // 返回 `null`，作为服务层 rate Limit Mocking这次计算的结果。
    return null
  }

  // Check if we should throw a 429 error
  // Only throw if:
  // 1. Status is rejected AND
  // 2. Either no overage headers OR overage is also rejected
  // 3. For Opus-specific limits, only throw if actually using an Opus model
  // status 集合读取 `mockHeaders['anthropic-ratelimit-unified-status']` 对应条目，后续围绕该成员继续处理。
  const status = mockHeaders['anthropic-ratelimit-unified-status']
  // overageStatus 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const overageStatus =
    mockHeaders['anthropic-ratelimit-unified-overage-status']
  // rateLimitType 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const rateLimitType =
    mockHeaders['anthropic-ratelimit-unified-representative-claim']

  // Check if this is an Opus-specific rate limit
  // isOpusLimit标记服务层 rate Limit Mocking是否启用对应路径。
  const isOpusLimit = rateLimitType === 'seven_day_opus'

  // Check if current model is an Opus model (handles all variants including aliases)
  // isUsingOpus 集合记录 `currentModel.includes` 是否成立，服务层 rate Limit Mocking随后按该结果分支。
  const isUsingOpus = currentModel.includes('opus')

  // For Opus limits, only throw 429 if actually using Opus
  // This simulates the real API behavior where fallback to Sonnet succeeds
  // 组合条件 `isOpusLimit && !isUsingOpus` 成立时，服务层 rate Limit Mocking才启用这条专门路径。
  if (isOpusLimit && !isUsingOpus) {
    // 返回 `null`，作为服务层 rate Limit Mocking这次计算的结果。
    return null
  }

  // Check for mock fast mode rate limits (handles expiry, countdown, etc.)
  // 满足 `isMockFastModeRateLimitScenario()` 时，服务层 rate Limit Mocking执行该分支。
  if (isMockFastModeRateLimitScenario()) {
    // fastModeHeaders 集合读取`checkMockFastModeRateLimit`，供服务层 rate Limit Mocking后续处理使用。
    const fastModeHeaders = checkMockFastModeRateLimit(isFastModeActive)
    // 满足 `fastModeHeaders === null` 时，服务层 rate Limit Mocking执行该分支。
    if (fastModeHeaders === null) {
      // 返回 `null`，作为服务层 rate Limit Mocking这次计算的结果。
      return null
    }
    // Create a mock 429 error with the fast mode headers
    // 错误保存`APIError`，供服务层 rate Limit Mocking后续处理使用。
    const error = new APIError(
      429,
      { error: { type: 'rate_limit_error', message: 'Rate limit exceeded' } },
      'Rate limit exceeded',
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      new globalThis.Headers(
        // 调用 Object.entries，触发服务层 rate Limit Mocking此处需要的副作用。
        Object.entries(fastModeHeaders).filter(([_, v]) => v !== undefined) as [
          string,
          string,
        ][],
      ),
    )
    // 返回 `error`，作为服务层 rate Limit Mocking这次计算的结果。
    return error
  }

  // shouldThrow429 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldThrow429 =
    status === 'rejected' && (!overageStatus || overageStatus === 'rejected')

  // 满足 `shouldThrow429` 时，服务层 rate Limit Mocking执行该分支。
  if (shouldThrow429) {
    // Create a mock 429 error with the appropriate headers
    // 错误保存`APIError`，供服务层 rate Limit Mocking后续处理使用。
    const error = new APIError(
      429,
      { error: { type: 'rate_limit_error', message: 'Rate limit exceeded' } },
      'Rate limit exceeded',
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      new globalThis.Headers(
        // 调用 Object.entries，触发服务层 rate Limit Mocking此处需要的副作用。
        Object.entries(mockHeaders).filter(([_, v]) => v !== undefined) as [
          string,
          string,
        ][],
      ),
    )
    // 返回 `error`，作为服务层 rate Limit Mocking这次计算的结果。
    return error
  }

  // 返回 `null`，作为服务层 rate Limit Mocking这次计算的结果。
  return null
}

/**
 * Check if this is a mock 429 error that shouldn't be retried
 */
// isMockRateLimitError 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMockRateLimitError(error: APIError): boolean {
  // 返回 `shouldProcessMockLimits() && error.status === 429`，作为服务层 rate Limit Mocking这次计算的结果。
  return shouldProcessMockLimits() && error.status === 429
}

/**
 * Check if /mock-limits command is currently active (for UI purposes)
 */
// 重新导出这一组成员，让服务层 rate Limit Mocking的公共 API 保持集中入口。
export { shouldProcessMockLimits }

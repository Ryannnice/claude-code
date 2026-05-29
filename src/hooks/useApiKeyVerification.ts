// 引入 useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useState } from 'react'
// 引入 getIsNonInteractiveSession，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../bootstrap/state.js'
// 接入 verifyApiKey 服务层能力，把外部通信或共享状态交给 ../services/api/claude.js 处理。
import { verifyApiKey } from '../services/api/claude.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getAnthropicApiKeyWithSource,
  getApiKeyFromApiKeyHelper,
  isAnthropicAuthEnabled,
  isClaudeAISubscriber,
} from '../utils/auth.js'

// VerificationStatus 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type VerificationStatus =
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'missing'
  | 'error'

// ApiKeyVerificationResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type ApiKeyVerificationResult = {
  status: VerificationStatus
  // 这个回调绑定到 reverify: () => Promise<void>，负责React hook 状态流在该局部场景下的响应。
  reverify: () => Promise<void>
  error: Error | null
}

// useApiKeyVerification 封装useApiKeyVerification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useApiKeyVerification(): ApiKeyVerificationResult {
  // 这个回调绑定到 const [status, setStatus] = useState<VerificationStatus>(() => {，负责React hook 状态流在该局部场景下的响应。
  const [status, setStatus] = useState<VerificationStatus>(() => {
    // 组合条件 `!isAnthropicAuthEnabled() || isClaudeAISubscriber()` 成立时，React hook 状态流才启用这条专门路径。
    if (!isAnthropicAuthEnabled() || isClaudeAISubscriber()) {
      // 返回 `'valid'`，作为React hook 状态流这次计算的结果。
      return 'valid'
    }
    // Use skipRetrievingKeyFromApiKeyHelper to avoid executing apiKeyHelper
    // before trust dialog is shown (security: prevents RCE via settings.json)
    // 从 `getAnthropicApiKeyWithSource({` 解构 key、source，减少React hook use Api Key Verification对同一对象的重复访问。
    const { key, source } = getAnthropicApiKeyWithSource({
      skipRetrievingKeyFromApiKeyHelper: true,
    })
    // If apiKeyHelper is configured, we have a key source even though we
    // haven't executed it yet - return 'loading' to indicate we'll verify later
    // 当 `key || source` 匹配 `'apiKeyHelper'` 时，React hook执行对应分支。
    if (key || source === 'apiKeyHelper') {
      // 返回 `'loading'`，作为React hook 状态流这次计算的结果。
      return 'loading'
    }
    // 返回 `'missing'`，作为React hook 状态流这次计算的结果。
    return 'missing'
  })
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState<Error | null>(null)

  // verify保存`useCallback`，供React hook后续处理使用。
  const verify = useCallback(async (): Promise<void> => {
    // 组合条件 `!isAnthropicAuthEnabled() || isClaudeAISubscriber()` 成立时，React hook 状态流才启用这条专门路径。
    if (!isAnthropicAuthEnabled() || isClaudeAISubscriber()) {
      // setStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
      setStatus('valid')
      // React hook use Api Key Verification在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Warm the apiKeyHelper cache (no-op if not configured), then read from
    // all sources. getAnthropicApiKeyWithSource() reads the now-warm cache.
    // 等待 `getApiKeyFromApiKeyHelper(getIsNonInteractiveSession())` 完成，再继续React hook use Api Key Verification的异步流程。
    await getApiKeyFromApiKeyHelper(getIsNonInteractiveSession())
    // 从 `getAnthropicApiKeyWithSource()` 解构 key、source，减少React hook use Api Key Verification对同一对象的重复访问。
    const { key: apiKey, source } = getAnthropicApiKeyWithSource()
    // API key缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!apiKey) {
      // 当 `source` 匹配 `'apiKeyHelper'` 时，React hook执行对应分支。
      if (source === 'apiKeyHelper') {
        // setStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
        setStatus('error')
        // setError 写入新的状态值，使React hook 状态流后续读取保持一致。
        setError(new Error('API key helper did not return a valid key'))
        // React hook use Api Key Verification在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // newStatus 集合 命名 `'missing'`，让后续代码直接表达这个值的用途。
      const newStatus = 'missing'
      // setStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
      setStatus(newStatus)
      // React hook use Api Key Verification在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // isValid记录 `verifyApiKey` 是否成立，React hook随后按该结果分支。
      const isValid = await verifyApiKey(apiKey, false)
      // newStatus 集合 命名 `isValid ? 'valid' : 'invalid'`，让后续代码直接表达这个值的用途。
      const newStatus = isValid ? 'valid' : 'invalid'
      // setStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
      setStatus(newStatus)
      // React hook use Api Key Verification在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    } catch (error) {
      // This happens when there an error response from the API but it's not an invalid API key error
      // In this case, we still mark the API key as invalid - but we also log the error so we can
      // display it to the user to be more helpful
      // setError 写入新的状态值，使React hook 状态流后续读取保持一致。
      setError(error as Error)
      // newStatus 集合保存`'error'`，作为后续固定文本处理的输入。
      const newStatus = 'error'
      // setStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
      setStatus(newStatus)
      // React hook use Api Key Verification在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }, [])

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    status,
    reverify: verify,
    error,
  }
}

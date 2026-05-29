// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 refreshAndGetAwsCredentials，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { refreshAndGetAwsCredentials } from '../auth.js'
// 引入 getAWSRegion、isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getAWSRegion, isEnvTruthy } from '../envUtils.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getAWSClientProxyConfig，将 ../proxy.js 中已经封装好的能力接到本文件流程里。
import { getAWSClientProxyConfig } from '../proxy.js'

// getBedrockInferenceProfiles 文件数据保存`memoize`，供共享工具后续处理使用。
export const getBedrockInferenceProfiles = memoize(async function (): Promise<
  string[]
> {
  // 并行获取 client、{ ListInferenceProfilesCommand }，缩短模型工具 bedrock等待多个独立异步任务的时间。
  const [client, { ListInferenceProfilesCommand }] = await Promise.all([
    createBedrockClient(),
    import('@aws-sdk/client-bedrock'),
  ])
  // allProfiles 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allProfiles = []
  // nextToken 先占位，稍后的条件分支会根据实际输入补齐它。
  let nextToken: string | undefined

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 先执行一次循环体，再按尾部条件决定是否继续共享工具处理。
    do {
      // 命令保存`ListInferenceProfilesCommand`，供共享工具后续处理使用。
      const command = new ListInferenceProfilesCommand({
        ...(nextToken && { nextToken }),
        typeEquals: 'SYSTEM_DEFINED',
      })
      // 接口响应保存`client.send`，供共享工具后续处理使用。
      const response = await client.send(command)

      // 满足 `response.inferenceProfileSummaries` 时，共享工具执行该分支。
      if (response.inferenceProfileSummaries) {
        // allProfiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
        allProfiles.push(...response.inferenceProfileSummaries)
      }

      // nextToken更新为 `response.nextToken`，确保模型工具后续读取最新状态。
      nextToken = response.nextToken
    } while (nextToken)

    // Filter for Anthropic models (SYSTEM_DEFINED filtering handled in query)
    // 返回 `allProfiles`，作为共享工具这次计算的结果。
    return allProfiles
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(profile => profile.inferenceProfileId?.includes('anthropic'))
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(profile => profile.inferenceProfileId)
      .filter(Boolean) as string[]
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
})

// findFirstMatch 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findFirstMatch(
  profiles: string[],
  substring: string,
): string | null {
  // 返回 `profiles.find(p => p.includes(substring)) ?? null`，作为共享工具这次计算的结果。
  return profiles.find(p => p.includes(substring)) ?? null
}

// createBedrockClient 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function createBedrockClient() {
  // 从 `await import('@aws-sdk/client-bedrock')` 解构 BedrockClient，减少模型工具 bedrock对同一对象的重复访问。
  const { BedrockClient } = await import('@aws-sdk/client-bedrock')
  // Match the Anthropic Bedrock SDK's region behavior exactly:
  // - Reads AWS_REGION or AWS_DEFAULT_REGION env vars (not AWS config files)
  // - Falls back to 'us-east-1' if neither is set
  // This ensures we query profiles from the same region the client will use
  // region读取`getAWSRegion`，供共享工具后续处理使用。
  const region = getAWSRegion()

  // skipAuth保存`isEnvTruthy`，供共享工具后续处理使用。
  const skipAuth = isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)

  // clientConfig 配置 集中保存模型工具 bedrock要一起传递的字段。
  const clientConfig: ConstructorParameters<typeof BedrockClient>[0] = {
    region,
    ...(process.env.ANTHROPIC_BEDROCK_BASE_URL && {
      endpoint: process.env.ANTHROPIC_BEDROCK_BASE_URL,
    }),
    ...(await getAWSClientProxyConfig()),
    ...(skipAuth && {
      requestHandler: new (
        await import('@smithy/node-http-handler')
      ).NodeHttpHandler(),
      httpAuthSchemes: [
        {
          schemeId: 'smithy.api#noAuth',
          // 这个回调绑定到 identityProvider: () => async () => ({}),，负责共享工具在该局部场景下的响应。
          identityProvider: () => async () => ({}),
          signer: new (await import('@smithy/core')).NoAuthSigner(),
        },
      ],
      // 这个回调绑定到 httpAuthSchemeProvider: () => [{ schemeId: 'smithy.api#noAuth' }],，负责共享工具在该局部场景下的响应。
      httpAuthSchemeProvider: () => [{ schemeId: 'smithy.api#noAuth' }],
    }),
  }

  // 只有 `!skipAuth && !process.env.AWS_BEARER_TOKEN_BEDROCK` 满足时，共享工具才执行该分支。
  if (!skipAuth && !process.env.AWS_BEARER_TOKEN_BEDROCK) {
    // Only refresh credentials if not using API key authentication
    // cachedCredentials 缓存保存`refreshAndGetAwsCredentials`，供共享工具后续处理使用。
    const cachedCredentials = await refreshAndGetAwsCredentials()
    // 满足 `cachedCredentials` 时，共享工具执行该分支。
    if (cachedCredentials) {
      // credentials 集合更新为 `{`，确保模型工具后续读取最新状态。
      clientConfig.credentials = {
        accessKeyId: cachedCredentials.accessKeyId,
        secretAccessKey: cachedCredentials.secretAccessKey,
        sessionToken: cachedCredentials.sessionToken,
      }
    }
  }

  // 返回 `new BedrockClient(clientConfig)`，作为共享工具这次计算的结果。
  return new BedrockClient(clientConfig)
}

// createBedrockRuntimeClient 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createBedrockRuntimeClient() {
  // 从 `await import(` 解构 BedrockRuntimeClient，减少模型工具 bedrock对同一对象的重复访问。
  const { BedrockRuntimeClient } = await import(
    '@aws-sdk/client-bedrock-runtime'
  )
  // region读取`getAWSRegion`，供共享工具后续处理使用。
  const region = getAWSRegion()
  // skipAuth保存`isEnvTruthy`，供共享工具后续处理使用。
  const skipAuth = isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)

  // clientConfig 配置 集中保存模型工具 bedrock要一起传递的字段。
  const clientConfig: ConstructorParameters<typeof BedrockRuntimeClient>[0] = {
    region,
    ...(process.env.ANTHROPIC_BEDROCK_BASE_URL && {
      endpoint: process.env.ANTHROPIC_BEDROCK_BASE_URL,
    }),
    ...(await getAWSClientProxyConfig()),
    ...(skipAuth && {
      // BedrockRuntimeClient defaults to HTTP/2 without fallback
      // proxy servers may not support this, so we explicitly force HTTP/1.1
      requestHandler: new (
        await import('@smithy/node-http-handler')
      ).NodeHttpHandler(),
      httpAuthSchemes: [
        {
          schemeId: 'smithy.api#noAuth',
          // 这个回调绑定到 identityProvider: () => async () => ({}),，负责共享工具在该局部场景下的响应。
          identityProvider: () => async () => ({}),
          signer: new (await import('@smithy/core')).NoAuthSigner(),
        },
      ],
      // 这个回调绑定到 httpAuthSchemeProvider: () => [{ schemeId: 'smithy.api#noAuth' }],，负责共享工具在该局部场景下的响应。
      httpAuthSchemeProvider: () => [{ schemeId: 'smithy.api#noAuth' }],
    }),
  }

  // 只有 `!skipAuth && !process.env.AWS_BEARER_TOKEN_BEDROCK` 满足时，共享工具才执行该分支。
  if (!skipAuth && !process.env.AWS_BEARER_TOKEN_BEDROCK) {
    // Only refresh credentials if not using API key authentication
    // cachedCredentials 缓存保存`refreshAndGetAwsCredentials`，供共享工具后续处理使用。
    const cachedCredentials = await refreshAndGetAwsCredentials()
    // 满足 `cachedCredentials` 时，共享工具执行该分支。
    if (cachedCredentials) {
      // credentials 集合更新为 `{`，确保模型工具后续读取最新状态。
      clientConfig.credentials = {
        accessKeyId: cachedCredentials.accessKeyId,
        secretAccessKey: cachedCredentials.secretAccessKey,
        sessionToken: cachedCredentials.sessionToken,
      }
    }
  }

  // 返回 `new BedrockRuntimeClient(clientConfig)`，作为共享工具这次计算的结果。
  return new BedrockRuntimeClient(clientConfig)
}

// getInferenceProfileBackingModel 文件数据保存`memoize`，供共享工具后续处理使用。
export const getInferenceProfileBackingModel = memoize(async function (
  profileId: string,
): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 并行获取 client、{ GetInferenceProfileCommand }，缩短模型工具 bedrock等待多个独立异步任务的时间。
    const [client, { GetInferenceProfileCommand }] = await Promise.all([
      createBedrockClient(),
      import('@aws-sdk/client-bedrock'),
    ])
    // 命令保存`GetInferenceProfileCommand`，供共享工具后续处理使用。
    const command = new GetInferenceProfileCommand({
      inferenceProfileIdentifier: profileId,
    })
    // 接口响应保存`client.send`，供共享工具后续处理使用。
    const response = await client.send(command)

    // !response.models || response.mo... 响应数据为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (!response.models || response.models.length === 0) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Use the first model as the primary backing model for cost calculation
    // In practice, application inference profiles typically load balance between
    // similar models with the same cost structure
    // primaryModel 命名 `response.models[0]`，让后续代码直接表达这个值的用途。
    const primaryModel = response.models[0]
    // 满足 `!primaryModel?.modelArn` 时，共享工具执行该分支。
    if (!primaryModel?.modelArn) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Extract model name from ARN
    // ARN format: arn:aws:bedrock:region:account:foundation-model/model-name
    // lastSlashIndex 索引保存`modelArn.lastIndexOf`，供共享工具后续处理使用。
    const lastSlashIndex = primaryModel.modelArn.lastIndexOf('/')
    // 返回 `lastSlashIndex >= 0`，作为共享工具这次计算的结果。
    return lastSlashIndex >= 0
      ? primaryModel.modelArn.substring(lastSlashIndex + 1)
      : primaryModel.modelArn
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
})

/**
 * Check if a model ID is a foundation model (e.g., "anthropic.claude-sonnet-4-5-20250929-v1:0")
 */
// isFoundationModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFoundationModel(modelId: string): boolean {
  // 返回 `modelId.startsWith('anthropic.')`，作为共享工具这次计算的结果。
  return modelId.startsWith('anthropic.')
}

/**
 * Cross-region inference profile prefixes for Bedrock.
 * These prefixes allow routing requests to models in specific regions.
 */
// BEDROCK_REGION_PREFIXES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const BEDROCK_REGION_PREFIXES = ['us', 'eu', 'apac', 'global'] as const

/**
 * Extract the model/inference profile ID from a Bedrock ARN.
 * If the input is not an ARN, returns it unchanged.
 *
 * ARN format: arn:aws:bedrock:<region>:<account>:inference-profile/<profile-id>
 * Also handles: arn:aws:bedrock:<region>:<account>:application-inference-profile/<profile-id>
 * And foundation model ARNs: arn:aws:bedrock:<region>::foundation-model/<model-id>
 */
// extractModelIdFromArn 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractModelIdFromArn(modelId: string): string {
  // 满足 `!modelId.startsWith('arn:')` 时，共享工具执行该分支。
  if (!modelId.startsWith('arn:')) {
    // 返回 `modelId`，作为共享工具这次计算的结果。
    return modelId
  }
  // lastSlashIndex 索引保存`modelId.lastIndexOf`，供共享工具后续处理使用。
  const lastSlashIndex = modelId.lastIndexOf('/')
  // 满足 `lastSlashIndex === -1` 时，共享工具执行该分支。
  if (lastSlashIndex === -1) {
    // 返回 `modelId`，作为共享工具这次计算的结果。
    return modelId
  }
  // 返回 `modelId.substring(lastSlashIndex + 1)`，作为共享工具这次计算的结果。
  return modelId.substring(lastSlashIndex + 1)
}

// BedrockRegionPrefix 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type BedrockRegionPrefix = (typeof BEDROCK_REGION_PREFIXES)[number]

/**
 * Extract the region prefix from a Bedrock cross-region inference model ID.
 * Handles both plain model IDs and full ARN format.
 * For example:
 * - "eu.anthropic.claude-sonnet-4-5-20250929-v1:0" → "eu"
 * - "us.anthropic.claude-3-7-sonnet-20250219-v1:0" → "us"
 * - "arn:aws:bedrock:ap-northeast-2:123:inference-profile/global.anthropic.claude-opus-4-6-v1" → "global"
 * - "anthropic.claude-3-5-sonnet-20241022-v2:0" → undefined (foundation model)
 * - "claude-sonnet-4-5-20250929" → undefined (first-party format)
 */
// getBedrockRegionPrefix 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBedrockRegionPrefix(
  modelId: string,
): BedrockRegionPrefix | undefined {
  // Extract the inference profile ID from ARN format if present
  // ARN format: arn:aws:bedrock:<region>:<account>:inference-profile/<profile-id>
  // effectiveModelId保存`extractModelIdFromArn`，供共享工具后续处理使用。
  const effectiveModelId = extractModelIdFromArn(modelId)

  // 按顺序遍历 `BEDROCK_REGION_PREFIXES` 中的prefix，逐个交给共享工具处理。
  for (const prefix of BEDROCK_REGION_PREFIXES) {
    // 满足 `effectiveModelId.startsWith(`${prefix}.anthropic.`)` 时，共享工具执行该分支。
    if (effectiveModelId.startsWith(`${prefix}.anthropic.`)) {
      // 返回 `prefix`，作为共享工具这次计算的结果。
      return prefix
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Apply a region prefix to a Bedrock model ID.
 * If the model already has a different region prefix, it will be replaced.
 * If the model is a foundation model (anthropic.*), the prefix will be added.
 * If the model is not a Bedrock model, it will be returned as-is.
 *
 * For example:
 * - applyBedrockRegionPrefix("us.anthropic.claude-sonnet-4-5-v1:0", "eu") → "eu.anthropic.claude-sonnet-4-5-v1:0"
 * - applyBedrockRegionPrefix("anthropic.claude-sonnet-4-5-v1:0", "eu") → "eu.anthropic.claude-sonnet-4-5-v1:0"
 * - applyBedrockRegionPrefix("claude-sonnet-4-5-20250929", "eu") → "claude-sonnet-4-5-20250929" (not a Bedrock model)
 */
// applyBedrockRegionPrefix 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyBedrockRegionPrefix(
  modelId: string,
  prefix: BedrockRegionPrefix,
): string {
  // Check if it already has a region prefix and replace it
  // existingPrefix读取`getBedrockRegionPrefix`，供共享工具后续处理使用。
  const existingPrefix = getBedrockRegionPrefix(modelId)
  // 满足 `existingPrefix` 时，共享工具执行该分支。
  if (existingPrefix) {
    // 返回 `modelId.replace(`${existingPrefix}.`, `${prefix}.`)`，作为共享工具这次计算的结果。
    return modelId.replace(`${existingPrefix}.`, `${prefix}.`)
  }

  // Check if it's a foundation model (anthropic.*) and add the prefix
  // 满足 `isFoundationModel(modelId)` 时，共享工具执行该分支。
  if (isFoundationModel(modelId)) {
    // 返回 ``${prefix}.${modelId}``，作为共享工具这次计算的结果。
    return `${prefix}.${modelId}`
  }

  // Not a Bedrock model format, return as-is
  // 返回 `modelId`，作为共享工具这次计算的结果。
  return modelId
}

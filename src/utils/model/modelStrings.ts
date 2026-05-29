// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getModelStrings as getModelStringsState,
  setModelStrings as setModelStringsState,
} from 'src/bootstrap/state.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 sequential，将 ../sequential.js 中已经封装好的能力接到本文件流程里。
import { sequential } from '../sequential.js'
// 引入 getInitialSettings，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from '../settings/settings.js'
// 引入 findFirstMatch、getBedrockInferenceProfiles，将 ./bedrock.js 中已经封装好的能力接到本文件流程里。
import { findFirstMatch, getBedrockInferenceProfiles } from './bedrock.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  ALL_MODEL_CONFIGS,
  CANONICAL_ID_TO_KEY,
  type CanonicalModelId,
  type ModelKey,
} from './configs.js'
// 引入 APIProvider、getAPIProvider，将 ./providers.js 中已经封装好的能力接到本文件流程里。
import { type APIProvider, getAPIProvider } from './providers.js'

/**
 * Maps each model version to its provider-specific model ID string.
 * Derived from ALL_MODEL_CONFIGS — adding a model there extends this type.
 */
// ModelStrings 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ModelStrings = Record<ModelKey, string>

// MODEL_KEYS 集合派生`Object.keys`，供共享工具后续处理使用。
const MODEL_KEYS = Object.keys(ALL_MODEL_CONFIGS) as ModelKey[]

// getBuiltinModelStrings 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBuiltinModelStrings(provider: APIProvider): ModelStrings {
  // out 集中保存共享工具模型工具 model Strings要一起传递的字段。
  const out = {} as ModelStrings
  // 按顺序遍历 `MODEL_KEYS` 中的key，逐个交给共享工具处理。
  for (const key of MODEL_KEYS) {
    // out[key更新为 `ALL_MODEL_CONFIGS[key][provider]`，确保模型工具 model Strings后续读取最新状态。
    out[key] = ALL_MODEL_CONFIGS[key][provider]
  }
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

// getBedrockModelStrings 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getBedrockModelStrings(): Promise<ModelStrings> {
  // fallback读取`getBuiltinModelStrings`，供共享工具后续处理使用。
  const fallback = getBuiltinModelStrings('bedrock')
  // profiles 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let profiles: string[] | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // profiles 文件数据更新为 `await getBedrockInferenceProfiles()`，确保模型工具后续读取最新状态。
    profiles = await getBedrockInferenceProfiles()
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 返回 `fallback`，作为共享工具这次计算的结果。
    return fallback
  }
  // 满足 `!profiles?.length` 时，共享工具执行该分支。
  if (!profiles?.length) {
    // 返回 `fallback`，作为共享工具这次计算的结果。
    return fallback
  }
  // Each config's firstParty ID is the canonical substring we search for in the
  // user's inference profile list (e.g. "claude-opus-4-6" matches
  // "eu.anthropic.claude-opus-4-6-v1"). Fall back to the hardcoded bedrock ID
  // when no matching profile is found.
  // out 集中保存共享工具模型工具 model Strings要一起传递的字段。
  const out = {} as ModelStrings
  // 按顺序遍历 `MODEL_KEYS` 中的key，逐个交给共享工具处理。
  for (const key of MODEL_KEYS) {
    // needle 命名 `ALL_MODEL_CONFIGS[key].firstParty`，让后续代码直接表达这个值的用途。
    const needle = ALL_MODEL_CONFIGS[key].firstParty
    // out[key更新为 `findFirstMatch(profiles, needle) || fallback[key]`，确保模型工具 model Strings后续读取最新状态。
    out[key] = findFirstMatch(profiles, needle) || fallback[key]
  }
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

/**
 * Layer user-configured modelOverrides (from settings.json) on top of the
 * provider-derived model strings. Overrides are keyed by canonical first-party
 * model ID (e.g. "claude-opus-4-6") and map to arbitrary provider-specific
 * strings — typically Bedrock inference profile ARNs.
 */
// applyModelOverrides 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyModelOverrides(ms: ModelStrings): ModelStrings {
  // overrides 集合读取`getInitialSettings`，供共享工具后续处理使用。
  const overrides = getInitialSettings().modelOverrides
  // overrides 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!overrides) {
    // 返回 `ms`，作为共享工具这次计算的结果。
    return ms
  }
  // out 集中保存共享工具模型工具 model Strings要一起传递的字段。
  const out = { ...ms }
  // 循环处理 `const [canonicalId, override] of Object.entries(overrides)`，让共享工具把同类条目按顺序走完。
  for (const [canonicalId, override] of Object.entries(overrides)) {
    // key读取 `CANONICAL_ID_TO_KEY[canonicalId as CanonicalModelId]` 对应条目，后续围绕该成员继续处理。
    const key = CANONICAL_ID_TO_KEY[canonicalId as CanonicalModelId]
    // 只有 `key && override` 满足时，共享工具才执行该分支。
    if (key && override) {
      // out[key更新为 `override`，确保模型工具 model Strings后续读取最新状态。
      out[key] = override
    }
  }
  // 返回 `out`，作为共享工具这次计算的结果。
  return out
}

/**
 * Resolve an overridden model ID (e.g. a Bedrock ARN) back to its canonical
 * first-party model ID. If the input doesn't match any current override value,
 * it is returned unchanged. Safe to call during module init (no-ops if settings
 * aren't loaded yet).
 */
// resolveOverriddenModel 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveOverriddenModel(modelId: string): string {
  // overrides 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let overrides: Record<string, string> | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // overrides 集合更新为 `getInitialSettings().modelOverrides`，确保模型工具后续读取最新状态。
    overrides = getInitialSettings().modelOverrides
  } catch {
    // 返回 `modelId`，作为共享工具这次计算的结果。
    return modelId
  }
  // overrides 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!overrides) {
    // 返回 `modelId`，作为共享工具这次计算的结果。
    return modelId
  }
  // 循环处理 `const [canonicalId, override] of Object.entries(overrides)`，让共享工具把同类条目按顺序走完。
  for (const [canonicalId, override] of Object.entries(overrides)) {
    // 满足 `override === modelId` 时，共享工具执行该分支。
    if (override === modelId) {
      // 返回 `canonicalId`，作为共享工具这次计算的结果。
      return canonicalId
    }
  }
  // 返回 `modelId`，作为共享工具这次计算的结果。
  return modelId
}

// updateBedrockModelStrings 集合保存`sequential`，供共享工具后续处理使用。
const updateBedrockModelStrings = sequential(async () => {
  // `getModelStringsState()` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (getModelStringsState() !== null) {
    // Already initialized. Doing the check here, combined with
    // `sequential`, allows the test suite to reset the state
    // between tests while still preventing multiple API calls
    // in production.
    // 模型工具 model Strings在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // ms 集合读取`getBedrockModelStrings`，供共享工具后续处理使用。
    const ms = await getBedrockModelStrings()
    // setModelStringsState 写入新的状态值，使共享工具后续读取保持一致。
    setModelStringsState(ms)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }
})

// initModelStrings 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function initModelStrings(): void {
  // ms 集合读取`getModelStringsState`，供共享工具后续处理使用。
  const ms = getModelStringsState()
  // `ms` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (ms !== null) {
    // Already initialized
    // 模型工具 model Strings在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // Initial with default values for non-Bedrock providers
  // `getAPIProvider()` 与 `'bedrock'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'bedrock') {
    // setModelStringsState 写入新的状态值，使共享工具后续读取保持一致。
    setModelStringsState(getBuiltinModelStrings(getAPIProvider()))
    // 模型工具 model Strings在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // On Bedrock, update model strings in the background without blocking.
  // Don't set the state in this case so that we can use `sequential` on
  // `updateBedrockModelStrings` and check for existing state on multiple
  // calls.
  // 显式忽略 `updateBedrockModelStrings()` 的返回值，只保留它触发的副作用。
  void updateBedrockModelStrings()
}

// getModelStrings 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelStrings(): ModelStrings {
  // ms 集合读取`getModelStringsState`，供共享工具后续处理使用。
  const ms = getModelStringsState()
  // 满足 `ms === null` 时，共享工具执行该分支。
  if (ms === null) {
    // 调用 initModelStrings，触发共享工具此处需要的副作用。
    initModelStrings()
    // Bedrock path falls through here while the profile fetch runs in the
    // background — still honor overrides on the interim defaults.
    // 返回 `applyModelOverrides(getBuiltinModelStrings(getAPIProvider()))`，作为共享工具这次计算的结果。
    return applyModelOverrides(getBuiltinModelStrings(getAPIProvider()))
  }
  // 返回 `applyModelOverrides(ms)`，作为共享工具这次计算的结果。
  return applyModelOverrides(ms)
}

/**
 * Ensure model strings are fully initialized.
 * For Bedrock users, this waits for the profile fetch to complete.
 * Call this before generating model options to ensure correct region strings.
 */
// ensureModelStringsInitialized 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureModelStringsInitialized(): Promise<void> {
  // ms 集合读取`getModelStringsState`，供共享工具后续处理使用。
  const ms = getModelStringsState()
  // `ms` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (ms !== null) {
    // 模型工具 model Strings在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // For non-Bedrock, initialize synchronously
  // `getAPIProvider()` 与 `'bedrock'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'bedrock') {
    // setModelStringsState 写入新的状态值，使共享工具后续读取保持一致。
    setModelStringsState(getBuiltinModelStrings(getAPIProvider()))
    // 模型工具 model Strings在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // For Bedrock, wait for the profile fetch
  // 等待 `updateBedrockModelStrings()` 完成，再继续模型工具 model Strings的异步流程。
  await updateBedrockModelStrings()
}

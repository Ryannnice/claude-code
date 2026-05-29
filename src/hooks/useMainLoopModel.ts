// 引入 useEffect、useReducer，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useReducer } from 'react'
// 接入 onGrowthBookRefresh 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { onGrowthBookRefresh } from '../services/analytics/growthbook.js'
// 引入 useAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../state/AppState.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getDefaultMainLoopModelSetting,
  type ModelName,
  parseUserSpecifiedModel,
} from '../utils/model/model.js'

// The value of the selector is a full model name that can be used directly in
// API calls. Use this over getMainLoopModel() when the component needs to
// update upon a model config change.
// useMainLoopModel 封装useMainLoopModel的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMainLoopModel(): ModelName {
  // mainLoopModel保存`useAppState`，供React hook后续处理使用。
  const mainLoopModel = useAppState(s => s.mainLoopModel)
  // mainLoopModelForSession 会话数据保存`useAppState`，供React hook后续处理使用。
  const mainLoopModelForSession = useAppState(s => s.mainLoopModelForSession)

  // parseUserSpecifiedModel reads tengu_ant_model_override via
  // _CACHED_MAY_BE_STALE (in resolveAntModel). Until GB init completes,
  // that's the stale disk cache; after, it's the in-memory remoteEval map.
  // AppState doesn't change when GB init finishes, so we subscribe to the
  // refresh signal and force a re-render to re-resolve with fresh values.
  // Without this, the alias resolution is frozen until something else
  // happens to re-render the component — the API would sample one model
  // while /model (which also re-resolves) displays another.
  // 这个回调绑定到 const [, forceRerender] = useReducer(x => x + 1, 0)，负责React hook 状态流在该局部场景下的响应。
  const [, forceRerender] = useReducer(x => x + 1, 0)
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => onGrowthBookRefresh(forceRerender), [])

  // 模型名称解析`parseUserSpecifiedModel`，供React hook后续处理使用。
  const model = parseUserSpecifiedModel(
    mainLoopModelForSession ??
      mainLoopModel ??
      getDefaultMainLoopModelSetting(),
  )
  // 返回 `model`，作为React hook 状态流这次计算的结果。
  return model
}

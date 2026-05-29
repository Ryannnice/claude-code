// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

// recordTipShown 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordTipShown(tipId: string): void {
  // numStartups 集合读取`getGlobalConfig`，供服务层 tip History后续处理使用。
  const numStartups = getGlobalConfig().numStartups
  // 调用 saveGlobalConfig，触发服务层 tip History此处需要的副作用。
  saveGlobalConfig(c => {
    // history保存`c.tipsHistory ?? {}`，供后续判断或组装使用。
    const history = c.tipsHistory ?? {}
    // 满足 `history[tipId] === numStartups` 时，服务层 tip History执行该分支。
    if (history[tipId] === numStartups) return c
    // 返回结构化结果，集中表达服务层 tip History已经整理出的状态。
    return { ...c, tipsHistory: { ...history, [tipId]: numStartups } }
  })
}

// getSessionsSinceLastShown 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionsSinceLastShown(tipId: string): number {
  // 配置读取`getGlobalConfig`，供服务层 tip History后续处理使用。
  const config = getGlobalConfig()
  // lastShown读取 `config.tipsHistory?.[tipId]` 对应条目，后续围绕该成员继续处理。
  const lastShown = config.tipsHistory?.[tipId]
  // lastShown缺失时提前走兜底路径，避免服务层 tip History继续依赖无效输入。
  if (!lastShown) return Infinity
  // 返回 `config.numStartups - lastShown`，作为服务层 tip History这次计算的结果。
  return config.numStartups - lastShown
}

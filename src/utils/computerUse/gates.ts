// 类型依赖 { CoordinateMode, CuSubGates } 来自 @ant/computer-use-mcp/types，用于校准共享工具的数据契约。
import type { CoordinateMode, CuSubGates } from '@ant/computer-use-mcp/types'

// 接入 getDynamicConfig_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getDynamicConfig_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 引入 getSubscriptionType，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { getSubscriptionType } from '../auth.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'

// ChicagoConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ChicagoConfig = CuSubGates & {
  enabled: boolean
  coordinateMode: CoordinateMode
}

// DEFAULTS 集合 集中保存共享工具 gates要一起传递的字段。
const DEFAULTS: ChicagoConfig = {
  enabled: false,
  pixelValidation: false,
  clipboardPasteMultiline: true,
  mouseAnimation: true,
  hideBeforeAction: true,
  autoTargetDisplay: true,
  clipboardGuard: true,
  coordinateMode: 'pixels',
}

// Spread over defaults so a partial JSON ({"enabled": true} alone) inherits the
// rest. The generic on getDynamicConfig is a type assertion, not a validator —
// GB returning a partial object would otherwise surface undefined fields.
// readConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function readConfig(): ChicagoConfig {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...DEFAULTS,
    ...getDynamicConfig_CACHED_MAY_BE_STALE<Partial<ChicagoConfig>>(
      'tengu_malort_pedway',
      DEFAULTS,
    ),
  }
}

// Max/Pro only for external rollout. Ant bypass so dogfooding continues
// regardless of subscription tier — not all ants are max/pro, and per
// CLAUDE.md:281, USER_TYPE !== 'ant' branches get zero antfooding.
// hasRequiredSubscription 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasRequiredSubscription(): boolean {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') return true
  // tier读取`getSubscriptionType`，供共享工具后续处理使用。
  const tier = getSubscriptionType()
  // 返回 `tier === 'max' || tier === 'pro'`，作为共享工具这次计算的结果。
  return tier === 'max' || tier === 'pro'
}

// getChicagoEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getChicagoEnabled(): boolean {
  // Disable for ants whose shell inherited monorepo dev config.
  // MONOREPO_ROOT_DIR is exported by config/local/zsh/zshrc, which
  // laptop-setup.sh wires into ~/.zshrc — its presence is the cheap
  // proxy for "has monorepo access". Override: ALLOW_ANT_COMPUTER_USE_MCP=1.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.USER_TYPE === 'ant' &&
    process.env.MONOREPO_ROOT_DIR &&
    !isEnvTruthy(process.env.ALLOW_ANT_COMPUTER_USE_MCP)
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `hasRequiredSubscription() && readConfig().enabled`，作为共享工具这次计算的结果。
  return hasRequiredSubscription() && readConfig().enabled
}

// getChicagoSubGates 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getChicagoSubGates(): CuSubGates {
  // 从 `readConfig()` 解构 enabled、coordinateMode、其余 subGates，减少共享工具 gates对同一对象的重复访问。
  const { enabled: _e, coordinateMode: _c, ...subGates } = readConfig()
  // 返回 `subGates`，作为共享工具这次计算的结果。
  return subGates
}

// Frozen at first read — setup.ts builds tool descriptions and executor.ts
// scales coordinates off the same value. A live read here lets a mid-session
// GB flip tell the model "pixels" while transforming clicks as normalized.
// frozenCoordinateMode 先占位，稍后的条件分支会根据实际输入补齐它。
let frozenCoordinateMode: CoordinateMode | undefined
// getChicagoCoordinateMode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getChicagoCoordinateMode(): CoordinateMode {
  // 共享工具 gates在这里处理 `frozenCoordinateMode ??= readConfig().coordinateMode`，完成这一小步状态转换。
  frozenCoordinateMode ??= readConfig().coordinateMode
  // 返回 `frozenCoordinateMode`，作为共享工具这次计算的结果。
  return frozenCoordinateMode
}

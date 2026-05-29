// Leaf config module — intentionally minimal imports so UI components
// can read the auto-dream enabled state without dragging in the forked
// agent / task registry / message builder chain that autoDream.ts pulls in.

// 复用 getInitialSettings 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../../utils/settings/settings.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'

/**
 * Whether background memory consolidation should run. User setting
 * (autoDreamEnabled in settings.json) overrides the GrowthBook default
 * when explicitly set; otherwise falls through to tengu_onyx_plover.
 */
// isAutoDreamEnabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoDreamEnabled(): boolean {
  // setting读取`getInitialSettings`，供服务层 config后续处理使用。
  const setting = getInitialSettings().autoDreamEnabled
  // `setting` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (setting !== undefined) return setting
  // gb 命名 `getFeatureValue_CACHED_MAY_BE_STALE<{ enabled?: unknown }...`，让后续代码直接表达这个值的用途。
  const gb = getFeatureValue_CACHED_MAY_BE_STALE<{ enabled?: unknown } | null>(
    'tengu_onyx_plover',
    null,
  )
  // 返回 `gb?.enabled === true`，作为服务层 config这次计算的结果。
  return gb?.enabled === true
}

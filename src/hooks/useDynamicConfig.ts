// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import React from 'react'
// 接入 getDynamicConfig_BLOCKS_ON_INIT 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getDynamicConfig_BLOCKS_ON_INIT } from '../services/analytics/growthbook.js'

/**
 * React hook for dynamic config values.
 * Returns the default value initially, then updates when the config is fetched.
 */
// useDynamicConfig 封装useDynamicConfig的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDynamicConfig<T>(configName: string, defaultValue: T): T {
  // 从 `React.useState<T>(defaultValue)` 按位置拆出 configValue、setConfigValue，让React hook use Dynamic Config分别处理这些返回值。
  const [configValue, setConfigValue] = React.useState<T>(defaultValue)

  // 调用 React.useEffect，触发React hook此处需要的副作用。
  React.useEffect(() => {
    // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，React hook执行对应分支。
    if (process.env.NODE_ENV === 'test') {
      // Prevents a test hang when using this hook in tests
      // React hook use Dynamic Config在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 显式忽略 `getDynamicConfig_BLOCKS_ON_INIT<T>(configName, defaultValue).th...` 的返回值，只保留它触发的副作用。
    void getDynamicConfig_BLOCKS_ON_INIT<T>(configName, defaultValue).then(
      setConfigValue,
    )
  }, [configName, defaultValue])

  // 返回 `configValue`，作为React hook 状态流这次计算的结果。
  return configValue
}

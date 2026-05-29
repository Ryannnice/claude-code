// 引入 useCallback、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect } from 'react'
// 复用 settingsChangeDetector 工具函数，把通用处理留在 ../utils/settings/changeDetector.js 中维护。
import { settingsChangeDetector } from '../utils/settings/changeDetector.js'
// 类型依赖 { SettingSource } 来自 ../utils/settings/constants.js，用于校准React hook 状态流的数据契约。
import type { SettingSource } from '../utils/settings/constants.js'
// 复用 getSettings_DEPRECATED 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'
// 类型依赖 { SettingsJson } 来自 ../utils/settings/types.js，用于校准React hook 状态流的数据契约。
import type { SettingsJson } from '../utils/settings/types.js'

// useSettingsChange 封装useSettingsChange的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSettingsChange(
  // 这个回调绑定到 onChange: (source: SettingSource, settings: SettingsJson) => void,，负责React hook 状态流在该局部场景下的响应。
  onChange: (source: SettingSource, settings: SettingsJson) => void,
): void {
  // handleChange保存`useCallback`，供React hook后续处理使用。
  const handleChange = useCallback(
    (source: SettingSource) => {
      // Cache is already reset by the notifier (changeDetector.fanOut) —
      // resetting here caused N-way thrashing with N subscribers: each
      // cleared the cache, re-read from disk, then the next cleared again.
      // newSettings 集合读取`getSettings_DEPRECATED`，供React hook后续处理使用。
      const newSettings = getSettings_DEPRECATED()
      // 调用 onChange，触发React hook此处需要的副作用。
      onChange(source, newSettings)
    },
    [onChange],
  )

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(
    // 这个回调绑定到 () => settingsChangeDetector.subscribe(handleChange),，负责React hook 状态流在该局部场景下的响应。
    () => settingsChangeDetector.subscribe(handleChange),
    [handleChange],
  )
}

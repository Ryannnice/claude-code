// 引入 useCallback、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect } from 'react'
// 类型依赖 { Command } 来自 ../commands.js，用于校准React hook 状态流的数据契约。
import type { Command } from '../commands.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  clearCommandMemoizationCaches,
  clearCommandsCache,
  getCommands,
} from '../commands.js'
// 接入 onGrowthBookRefresh 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { onGrowthBookRefresh } from '../services/analytics/growthbook.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 skillChangeDetector 工具函数，把通用处理留在 ../utils/skills/skillChangeDetector.js 中维护。
import { skillChangeDetector } from '../utils/skills/skillChangeDetector.js'

/**
 * Keep the commands list fresh across two triggers:
 *
 * 1. Skill file changes (watcher) — full cache clear + disk re-scan, since
 *    skill content changed on disk.
 * 2. GrowthBook init/refresh — memo-only clear, since only `isEnabled()`
 *    predicates may have changed. Handles commands like /btw whose gate
 *    reads a flag that isn't in the disk cache yet on first session after
 *    a flag rename: getCommands() runs before GB init (main.tsx:2855 vs
 *    showSetupScreens at :3106), so the memoized list is baked with the
 *    default. Once init populates remoteEvalFeatureValues, re-filter.
 */
// useSkillsChange 封装useSkillsChange的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSkillsChange(
  cwd: string | undefined,
  // 这个回调绑定到 onCommandsChange: (commands: Command[]) => void,，负责React hook 状态流在该局部场景下的响应。
  onCommandsChange: (commands: Command[]) => void,
): void {
  // handleChange保存`useCallback`，供React hook后续处理使用。
  const handleChange = useCallback(async () => {
    // cwd缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!cwd) return
    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // Clear all command caches to ensure fresh load
      // 清理相关缓存，确保React hook 状态流下一次读取时重新加载最新数据。
      clearCommandsCache()
      // commands 命令数据读取`getCommands`，供React hook后续处理使用。
      const commands = await getCommands(cwd)
      // 调用 onCommandsChange，触发React hook此处需要的副作用。
      onCommandsChange(commands)
    } catch (error) {
      // Errors during reload are non-fatal - log and continue
      // 满足 `error instanceof Error` 时，React hook执行该分支。
      if (error instanceof Error) {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logError(error)
      }
    }
  }, [cwd, onCommandsChange])

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => skillChangeDetector.subscribe(handleChange), [handleChange])

  // handleGrowthBookRefresh保存`useCallback`，供React hook后续处理使用。
  const handleGrowthBookRefresh = useCallback(async () => {
    // cwd缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!cwd) return
    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // 清理相关缓存，确保React hook 状态流下一次读取时重新加载最新数据。
      clearCommandMemoizationCaches()
      // commands 命令数据读取`getCommands`，供React hook后续处理使用。
      const commands = await getCommands(cwd)
      // 调用 onCommandsChange，触发React hook此处需要的副作用。
      onCommandsChange(commands)
    } catch (error) {
      // 满足 `error instanceof Error` 时，React hook执行该分支。
      if (error instanceof Error) {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logError(error)
      }
    }
  }, [cwd, onCommandsChange])

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(
    // 这个回调绑定到 () => onGrowthBookRefresh(handleGrowthBookRefresh),，负责React hook 状态流在该局部场景下的响应。
    () => onGrowthBookRefresh(handleGrowthBookRefresh),
    [handleGrowthBookRefresh],
  )
}

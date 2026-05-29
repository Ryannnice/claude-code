// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react'
// 引入 major、minor、patch，将 semver 中已经封装好的能力接到本文件流程里。
import { major, minor, patch } from 'semver'

// getSemverPart 封装useUpdateNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSemverPart(version: string): string {
  // 返回 ``${major(version, { loose: true })}.${minor(version, { loose: true })}....`，作为React hook 状态流这次计算的结果。
  return `${major(version, { loose: true })}.${minor(version, { loose: true })}.${patch(version, { loose: true })}`
}

// shouldShowUpdateNotification 封装useUpdateNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowUpdateNotification(
  updatedVersion: string,
  lastNotifiedSemver: string | null,
): boolean {
  // updatedSemver读取`getSemverPart`，供React hook后续处理使用。
  const updatedSemver = getSemverPart(updatedVersion)
  // 返回 `updatedSemver !== lastNotifiedSemver`，作为React hook 状态流这次计算的结果。
  return updatedSemver !== lastNotifiedSemver
}

// useUpdateNotification 封装useUpdateNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useUpdateNotification(
  updatedVersion: string | null | undefined,
  initialVersion: string = MACRO.VERSION,
): string | null {
  // 从 `useState<string | null>(` 按位置拆出 lastNotifiedSemver、setLastNotifiedSemver，让React hook use Update Notification分别处理这些返回值。
  const [lastNotifiedSemver, setLastNotifiedSemver] = useState<string | null>(
    // 这个回调绑定到 () => getSemverPart(initialVersion),，负责React hook 状态流在该局部场景下的响应。
    () => getSemverPart(initialVersion),
  )

  // updatedVersion缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!updatedVersion) {
    // 返回 `null`，作为React hook 状态流这次计算的结果。
    return null
  }

  // updatedSemver读取`getSemverPart`，供React hook后续处理使用。
  const updatedSemver = getSemverPart(updatedVersion)
  // `updatedSemver` 与 `lastNotifiedSemver` 不一致时刷新派生状态，避免使用过期结果。
  if (updatedSemver !== lastNotifiedSemver) {
    // setLastNotifiedSemver 写入新的状态值，使React hook 状态流后续读取保持一致。
    setLastNotifiedSemver(updatedSemver)
    // 返回 `updatedSemver`，作为React hook 状态流这次计算的结果。
    return updatedSemver
  }
  // 返回 `null`，作为React hook 状态流这次计算的结果。
  return null
}

// 引入 createStore，将 ../../state/store.js 中已经封装好的能力接到本文件流程里。
import { createStore } from '../../state/store.js'

/**
 * Tracks whether the "context left until autocompact" warning should be suppressed.
 * We suppress immediately after successful compaction since we don't have accurate
 * token counts until the next API response.
 */
// compactWarningStore 警告信息构建`createStore<boolean>(false)`，供后续判断或组装使用。
export const compactWarningStore = createStore<boolean>(false)

/** Suppress the compact warning. Call after successful compaction. */
// suppressCompactWarning 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function suppressCompactWarning(): void {
  // compactWarningStore.setState 写入新的状态值，使服务层 compact Warning State后续读取保持一致。
  compactWarningStore.setState(() => true)
}

/** Clear the compact warning suppression. Called at start of new compact attempt. */
// clearCompactWarningSuppression 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearCompactWarningSuppression(): void {
  // compactWarningStore.setState 写入新的状态值，使服务层 compact Warning State后续读取保持一致。
  compactWarningStore.setState(() => false)
}

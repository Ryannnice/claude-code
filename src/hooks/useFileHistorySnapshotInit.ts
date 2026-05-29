// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type FileHistorySnapshot,
  type FileHistoryState,
  fileHistoryEnabled,
  fileHistoryRestoreStateFromLog,
} from '../utils/fileHistory.js'

// useFileHistorySnapshotInit 封装useFileHistorySnapshotInit的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useFileHistorySnapshotInit(
  initialFileHistorySnapshots: FileHistorySnapshot[] | undefined,
  fileHistoryState: FileHistoryState,
  // 这个回调绑定到 onUpdateState: (newState: FileHistoryState) => void,，负责React hook 状态流在该局部场景下的响应。
  onUpdateState: (newState: FileHistoryState) => void,
): void {
  // initialized保存`useRef`，供React hook后续处理使用。
  const initialized = useRef(false)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 组合条件 `!fileHistoryEnabled() || initialized.current` 成立时，React hook 状态流才启用这条专门路径。
    if (!fileHistoryEnabled() || initialized.current) {
      // React hook use File History Snapsho...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // current更新为 `true`，确保useFileHistorySnapshotInit后续读取最新状态。
    initialized.current = true
    // 满足 `initialFileHistorySnapshots` 时，React hook执行该分支。
    if (initialFileHistorySnapshots) {
      // 调用 fileHistoryRestoreStateFromLog，触发React hook此处需要的副作用。
      fileHistoryRestoreStateFromLog(initialFileHistorySnapshots, onUpdateState)
    }
  }, [fileHistoryState, initialFileHistorySnapshots, onUpdateState])
}

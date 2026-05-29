// 引入 useCallback、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useRef, useState } from 'react'
// 类型依赖 { PastedContent } 来自 ../utils/config.js，用于校准React hook 状态流的数据契约。
import type { PastedContent } from '../utils/config.js'

// BufferEntry 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type BufferEntry = {
  text: string
  cursorOffset: number
  pastedContents: Record<number, PastedContent>
  timestamp: number
}

// UseInputBufferProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type UseInputBufferProps = {
  maxBufferSize: number
  debounceMs: number
}

// UseInputBufferResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type UseInputBufferResult = {
  // React hook use Input Buffer在这里处理 `pushToBuffer: (`，完成这一小步状态转换。
  pushToBuffer: (
    text: string,
    cursorOffset: number,
    pastedContents?: Record<number, PastedContent>,
  ) => void
  // 这个回调绑定到 undo: () => BufferEntry | undefined，负责React hook 状态流在该局部场景下的响应。
  undo: () => BufferEntry | undefined
  canUndo: boolean
  // 这个回调绑定到 clearBuffer: () => void，负责React hook 状态流在该局部场景下的响应。
  clearBuffer: () => void
}

// useInputBuffer 封装useInputBuffer的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useInputBuffer({
  maxBufferSize,
  debounceMs,
}: UseInputBufferProps): UseInputBufferResult {
  // buffer 由 React state 持有，setBuffer 会在用户操作或异步结果返回时触发刷新。
  const [buffer, setBuffer] = useState<BufferEntry[]>([])
  // currentIndex 索引 由 React state 持有，setCurrentIndex 会在用户操作或异步结果返回时触发刷新。
  const [currentIndex, setCurrentIndex] = useState(-1)
  // lastPushTime读取 hook 状态，供React hook use Input ...本轮渲染使用。
  const lastPushTime = useRef<number>(0)
  // pendingPush读取 hook 状态，供React hook use Input ...本轮渲染使用。
  const pendingPush = useRef<ReturnType<typeof setTimeout> | null>(null)

  // pushToBuffer保存`useCallback`，供React hook后续处理使用。
  const pushToBuffer = useCallback(
    (
      text: string,
      cursorOffset: number,
      pastedContents: Record<number, PastedContent> = {},
    ) => {
      // now记录时间`Date.now`，供React hook后续处理使用。
      const now = Date.now()

      // Clear any pending push
      // 满足 `pendingPush.current` 时，React hook执行该分支。
      if (pendingPush.current) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(pendingPush.current)
        // current更新为 `null`，确保useInputBuffer后续读取最新状态。
        pendingPush.current = null
      }

      // Debounce rapid changes
      // 满足 `now - lastPushTime.current < debounceMs` 时，React hook执行该分支。
      if (now - lastPushTime.current < debounceMs) {
        // current更新为 `setTimeout(`，确保useInputBuffer后续读取最新状态。
        pendingPush.current = setTimeout(
          pushToBuffer,
          debounceMs,
          text,
          cursorOffset,
          pastedContents,
        )
        // React hook use Input Buffer在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // current更新为 `now`，确保useInputBuffer后续读取最新状态。
      lastPushTime.current = now

      // setBuffer 写入新的状态值，使React hook 状态流后续读取保持一致。
      setBuffer(prevBuffer => {
        // If we're not at the end of the buffer, truncate everything after current position
        // newBuffer 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const newBuffer =
          currentIndex >= 0 ? prevBuffer.slice(0, currentIndex + 1) : prevBuffer

        // Don't add if it's the same as the last entry
        // lastEntry 命名 `newBuffer[newBuffer.length - 1]`，让后续代码直接表达这个值的用途。
        const lastEntry = newBuffer[newBuffer.length - 1]
        // 组合条件 `lastEntry && lastEntry.text === text` 成立时，React hook 状态流才启用这条专门路径。
        if (lastEntry && lastEntry.text === text) {
          // 返回 `newBuffer`，作为React hook 状态流这次计算的结果。
          return newBuffer
        }

        // Add new entry
        // updatedBuffer 聚合成有序列表，保持后续遍历顺序稳定。
        const updatedBuffer = [
          ...newBuffer,
          { text, cursorOffset, pastedContents, timestamp: now },
        ]

        // Limit buffer size
        // 满足 `updatedBuffer.length > maxBufferSize` 时，React hook执行该分支。
        if (updatedBuffer.length > maxBufferSize) {
          // 返回 `updatedBuffer.slice(-maxBufferSize)`，作为React hook 状态流这次计算的结果。
          return updatedBuffer.slice(-maxBufferSize)
        }

        // 返回 `updatedBuffer`，作为React hook 状态流这次计算的结果。
        return updatedBuffer
      })

      // Update current index to point to the new entry
      // setCurrentIndex 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCurrentIndex(prev => {
        // newIndex 索引保存 `prev >= 0 ? prev + 1 : buffer.length` 的判断结果，供React hook use Input ...后续分支直接复用。
        const newIndex = prev >= 0 ? prev + 1 : buffer.length
        // 返回 `Math.min(newIndex, maxBufferSize - 1)`，作为React hook 状态流这次计算的结果。
        return Math.min(newIndex, maxBufferSize - 1)
      })
    },
    [debounceMs, maxBufferSize, currentIndex, buffer.length],
  )

  // undo保存`useCallback`，供React hook后续处理使用。
  const undo = useCallback((): BufferEntry | undefined => {
    // currentIndex < 0 || buffer 索引为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
    if (currentIndex < 0 || buffer.length === 0) {
      // 返回 `undefined`，作为React hook 状态流这次计算的结果。
      return undefined
    }

    // targetIndex 索引保存`Math.max`，供React hook后续处理使用。
    const targetIndex = Math.max(0, currentIndex - 1)
    // entry 命名 `buffer[targetIndex]`，让后续代码直接表达这个值的用途。
    const entry = buffer[targetIndex]

    // 满足 `entry` 时，React hook执行该分支。
    if (entry) {
      // setCurrentIndex 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCurrentIndex(targetIndex)
      // 返回 `entry`，作为React hook 状态流这次计算的结果。
      return entry
    }

    // 返回 `undefined`，作为React hook 状态流这次计算的结果。
    return undefined
  }, [buffer, currentIndex])

  // clearBuffer保存`useCallback`，供React hook后续处理使用。
  const clearBuffer = useCallback(() => {
    // setBuffer 写入新的状态值，使React hook 状态流后续读取保持一致。
    setBuffer([])
    // setCurrentIndex 写入新的状态值，使React hook 状态流后续读取保持一致。
    setCurrentIndex(-1)
    // current更新为 `0`，确保useInputBuffer后续读取最新状态。
    lastPushTime.current = 0
    // 满足 `pendingPush.current` 时，React hook执行该分支。
    if (pendingPush.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(pendingPush.current)
      // current更新为 `null`，确保useInputBuffer后续读取最新状态。
      pendingPush.current = null
    }
  }, [lastPushTime, pendingPush])

  // canUndo标记React hook use Input ...是否启用对应路径。
  const canUndo = currentIndex > 0 && buffer.length > 1

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    pushToBuffer,
    undo,
    canUndo,
    clearBuffer,
  }
}

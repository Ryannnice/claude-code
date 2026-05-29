// 引入 useCallback、useMemo、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useMemo, useRef } from 'react'

// DEFAULT_MAX_VISIBLE保存`5`，供后续判断或组装使用。
const DEFAULT_MAX_VISIBLE = 5

// UsePaginationOptions 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type UsePaginationOptions = {
  totalItems: number
  maxVisible?: number
  selectedIndex?: number
}

// UsePaginationResult 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type UsePaginationResult<T> = {
  // For backwards compatibility with page-based terminology
  currentPage: number
  totalPages: number
  startIndex: number
  endIndex: number
  needsPagination: boolean
  pageSize: number
  // Get visible slice of items
  // 这个回调绑定到 getVisibleItems: (items: T[]) => T[]，负责命令处理在该局部场景下的响应。
  getVisibleItems: (items: T[]) => T[]
  // Convert visible index to actual index
  // 这个回调绑定到 toActualIndex: (visibleIndex: number) => number，负责命令处理在该局部场景下的响应。
  toActualIndex: (visibleIndex: number) => number
  // Check if actual index is visible
  // 这个回调绑定到 isOnCurrentPage: (actualIndex: number) => boolean，负责命令处理在该局部场景下的响应。
  isOnCurrentPage: (actualIndex: number) => boolean
  // Navigation (kept for API compatibility)
  // 这个回调绑定到 goToPage: (page: number) => void，负责命令处理在该局部场景下的响应。
  goToPage: (page: number) => void
  // 这个回调绑定到 nextPage: () => void，负责命令处理在该局部场景下的响应。
  nextPage: () => void
  // 这个回调绑定到 prevPage: () => void，负责命令处理在该局部场景下的响应。
  prevPage: () => void
  // Handle selection - just updates the index, scrolling is automatic
  // 插件命令界面 use Pagination在这里处理 `handleSelectionChange: (`，完成这一小步状态转换。
  handleSelectionChange: (
    newIndex: number,
    // 这个回调绑定到 setSelectedIndex: (index: number) => void,，负责命令处理在该局部场景下的响应。
    setSelectedIndex: (index: number) => void,
  ) => void
  // Page navigation - returns false for continuous scrolling (not needed)
  // 插件命令界面 use Pagination在这里处理 `handlePageNavigation: (`，完成这一小步状态转换。
  handlePageNavigation: (
    direction: 'left' | 'right',
    // 这个回调绑定到 setSelectedIndex: (index: number) => void,，负责命令处理在该局部场景下的响应。
    setSelectedIndex: (index: number) => void,
  ) => boolean
  // Scroll position info for UI display
  scrollPosition: {
    current: number
    total: number
    canScrollUp: boolean
    canScrollDown: boolean
  }
}

// usePagination 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePagination<T>({
  totalItems,
  maxVisible = DEFAULT_MAX_VISIBLE,
  selectedIndex = 0,
}: UsePaginationOptions): UsePaginationResult<T> {
  // needsPagination标记插件命令界面 use Pagination是否启用对应路径。
  const needsPagination = totalItems > maxVisible

  // Use a ref to track the previous scroll offset for smooth scrolling
  // scrollOffsetRef 引用保存`useRef`，供命令处理后续处理使用。
  const scrollOffsetRef = useRef(0)

  // Compute the scroll offset based on selectedIndex
  // This ensures the selected item is always visible
  // scrollOffset保存`useMemo`，供命令处理后续处理使用。
  const scrollOffset = useMemo(() => {
    // needsPagination缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!needsPagination) return 0

    // prevOffset 命名 `scrollOffsetRef.current`，让后续代码直接表达这个值的用途。
    const prevOffset = scrollOffsetRef.current

    // If selected item is above the visible window, scroll up
    // 满足 `selectedIndex < prevOffset` 时，命令处理执行该分支。
    if (selectedIndex < prevOffset) {
      // current更新为 `selectedIndex`，确保插件命令界面后续读取最新状态。
      scrollOffsetRef.current = selectedIndex
      // 返回 `selectedIndex`，作为命令处理这次计算的结果。
      return selectedIndex
    }

    // If selected item is below the visible window, scroll down
    // 满足 `selectedIndex >= prevOffset + maxVisible` 时，命令处理执行该分支。
    if (selectedIndex >= prevOffset + maxVisible) {
      // newOffset保存`selectedIndex - maxVisible + 1`，供插件命令界面 use Pagination后续判断或输出使用。
      const newOffset = selectedIndex - maxVisible + 1
      // current更新为 `newOffset`，确保插件命令界面后续读取最新状态。
      scrollOffsetRef.current = newOffset
      // 返回 `newOffset`，作为命令处理这次计算的结果。
      return newOffset
    }

    // Selected item is within visible window, keep current offset
    // But ensure offset is still valid
    // maxOffset保存`Math.max`，供命令处理后续处理使用。
    const maxOffset = Math.max(0, totalItems - maxVisible)
    // clampedOffset保存`Math.min`，供命令处理后续处理使用。
    const clampedOffset = Math.min(prevOffset, maxOffset)
    // current更新为 `clampedOffset`，确保插件命令界面后续读取最新状态。
    scrollOffsetRef.current = clampedOffset
    // 返回 `clampedOffset`，作为命令处理这次计算的结果。
    return clampedOffset
  }, [selectedIndex, maxVisible, needsPagination, totalItems])

  // startIndex 索引保存`scrollOffset`，供后续判断或组装使用。
  const startIndex = scrollOffset
  // endIndex 索引保存`Math.min`，供命令处理后续处理使用。
  const endIndex = Math.min(scrollOffset + maxVisible, totalItems)

  // getVisibleItems 集合保存`useCallback`，供命令处理后续处理使用。
  const getVisibleItems = useCallback(
    (items: T[]): T[] => {
      // needsPagination缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!needsPagination) return items
      // 返回 `items.slice(startIndex, endIndex)`，作为命令处理这次计算的结果。
      return items.slice(startIndex, endIndex)
    },
    [needsPagination, startIndex, endIndex],
  )

  // toActualIndex 索引保存`useCallback`，供命令处理后续处理使用。
  const toActualIndex = useCallback(
    (visibleIndex: number): number => {
      // 返回 `startIndex + visibleIndex`，作为命令处理这次计算的结果。
      return startIndex + visibleIndex
    },
    [startIndex],
  )

  // isOnCurrentPage记录 `useCallback` 是否成立，命令处理随后按该结果分支。
  const isOnCurrentPage = useCallback(
    (actualIndex: number): boolean => {
      // 返回 `actualIndex >= startIndex && actualIndex < endIndex`，作为命令处理这次计算的结果。
      return actualIndex >= startIndex && actualIndex < endIndex
    },
    [startIndex, endIndex],
  )

  // These are mostly no-ops for continuous scrolling but kept for API compatibility
  // goToPage保存`useCallback`，供命令处理后续处理使用。
  const goToPage = useCallback((_page: number) => {
    // No-op - scrolling is controlled by selectedIndex
  }, [])

  // nextPage保存`useCallback`，供命令处理后续处理使用。
  const nextPage = useCallback(() => {
    // No-op - scrolling is controlled by selectedIndex
  }, [])

  // prevPage保存`useCallback`，供命令处理后续处理使用。
  const prevPage = useCallback(() => {
    // No-op - scrolling is controlled by selectedIndex
  }, [])

  // Simple selection handler - just updates the index
  // Scrolling happens automatically via the useMemo above
  // handleSelectionChange保存`useCallback`，供命令处理后续处理使用。
  const handleSelectionChange = useCallback(
    (newIndex: number, setSelectedIndex: (index: number) => void) => {
      // clampedIndex 索引保存`Math.max`，供命令处理后续处理使用。
      const clampedIndex = Math.max(0, Math.min(newIndex, totalItems - 1))
      // setSelectedIndex 写入新的状态值，使命令处理后续读取保持一致。
      setSelectedIndex(clampedIndex)
    },
    [totalItems],
  )

  // Page navigation - disabled for continuous scrolling
  // handlePageNavigation保存`useCallback`，供命令处理后续处理使用。
  const handlePageNavigation = useCallback(
    (
      _direction: 'left' | 'right',
      // 这个回调绑定到 _setSelectedIndex: (index: number) => void,，负责命令处理在该局部场景下的响应。
      _setSelectedIndex: (index: number) => void,
    ): boolean => {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    },
    [],
  )

  // Calculate page-like values for backwards compatibility
  // totalPages 集合保存`Math.max`，供命令处理后续处理使用。
  const totalPages = Math.max(1, Math.ceil(totalItems / maxVisible))
  // currentPage保存`Math.floor`，供命令处理后续处理使用。
  const currentPage = Math.floor(scrollOffset / maxVisible)

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    needsPagination,
    pageSize: maxVisible,
    getVisibleItems,
    toActualIndex,
    isOnCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    handleSelectionChange,
    handlePageNavigation,
    scrollPosition: {
      current: selectedIndex + 1,
      total: totalItems,
      canScrollUp: scrollOffset > 0,
      canScrollDown: scrollOffset + maxVisible < totalItems,
    },
  }
}

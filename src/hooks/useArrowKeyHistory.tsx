// 引入 React、useCallback、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useRef, useState } from 'react';
// 复用 getModeFromInput 终端界面组件，避免在这里重复拼装显示逻辑。
import { getModeFromInput } from 'src/components/PromptInput/inputModes.js';
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js';
// 复用 ConfigurableShortcutHint 终端界面组件，避免在这里重复拼装显示逻辑。
import { ConfigurableShortcutHint } from '../components/ConfigurableShortcutHint.js';
// 复用 FOOTER_TEMPORARY_STATUS_TIMEOUT 终端界面组件，避免在这里重复拼装显示逻辑。
import { FOOTER_TEMPORARY_STATUS_TIMEOUT } from '../components/PromptInput/Notifications.js';
// 引入 getHistory，将 ../history.js 中已经封装好的能力接到本文件流程里。
import { getHistory } from '../history.js';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 类型依赖 { PromptInputMode } 来自 ../types/textInputTypes.js，用于校准React hook 状态流的数据契约。
import type { PromptInputMode } from '../types/textInputTypes.js';
// 类型依赖 { HistoryEntry, PastedContent } 来自 ../utils/config.js，用于校准React hook 状态流的数据契约。
import type { HistoryEntry, PastedContent } from '../utils/config.js';
// HistoryMode 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type HistoryMode = PromptInputMode;

// Load history entries in chunks to reduce disk reads on rapid keypresses
// HISTORY_CHUNK_SIZE保存`10`，供React hook use Arrow ...后续判断或输出使用。
const HISTORY_CHUNK_SIZE = 10;

// Shared state for batching concurrent load requests into a single disk read
// Mode filter is included to ensure we don't mix filtered and unfiltered caches
// pendingLoad 命名 `null`，让后续代码直接表达这个值的用途。
let pendingLoad: Promise<HistoryEntry[]> | null = null;
// pendingLoadTarget保存`0`，供后续判断或组装使用。
let pendingLoadTarget = 0;
// pendingLoadModeFilter初始化为未定义值，后续分支会在有数据时补齐。
let pendingLoadModeFilter: HistoryMode | undefined = undefined;
// loadHistoryEntries 封装useArrowKeyHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadHistoryEntries(minCount: number, modeFilter?: HistoryMode): Promise<HistoryEntry[]> {
  // Round up to next chunk to avoid repeated small reads
  // target保存`Math.ceil`，供React hook后续处理使用。
  const target = Math.ceil(minCount / HISTORY_CHUNK_SIZE) * HISTORY_CHUNK_SIZE;

  // If a load is already pending with the same mode filter and will satisfy our needs, wait for it
  // 组合条件 `pendingLoad && pendingLoadTarget >= target && pen` 成立时，React hook 状态流才启用这条专门路径。
  if (pendingLoad && pendingLoadTarget >= target && pendingLoadModeFilter === modeFilter) {
    // 返回 `pendingLoad`，作为React hook 状态流这次计算的结果。
    return pendingLoad;
  }

  // If a load is pending but won't satisfy our needs or has different filter, we need to wait for it
  // to complete first, then start a new one (can't interrupt an ongoing read)
  // 满足 `pendingLoad` 时，React hook执行该分支。
  if (pendingLoad) {
    // 等待 `pendingLoad` 完成，再继续React hook use Arrow Key History的异步流程。
    await pendingLoad;
  }

  // Start a new load
  // pendingLoadTarget更新为 `target`，确保useArrowKeyHistory后续读取最新状态。
  pendingLoadTarget = target;
  // pendingLoadModeFilter更新为 `modeFilter`，确保useArrowKeyHistory后续读取最新状态。
  pendingLoadModeFilter = modeFilter;
  // pendingLoad更新为 `(async () => {`，确保useArrowKeyHistory后续读取最新状态。
  pendingLoad = (async () => {
    // entries 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const entries: HistoryEntry[] = [];
    // loaded保存`0`，供React hook use Arrow ...后续判断或输出使用。
    let loaded = 0;
    // 逐项读取 `getHistory()` 中的entry，按输入顺序推进React hook 状态流。
    for await (const entry of getHistory()) {
      // If mode filter is specified, only include entries that match the mode
      // 满足 `modeFilter` 时，React hook执行该分支。
      if (modeFilter) {
        // entryMode读取`getModeFromInput`，供React hook后续处理使用。
        const entryMode = getModeFromInput(entry.display);
        // `entryMode` 与 `modeFilter` 不一致时刷新派生状态，避免使用过期结果。
        if (entryMode !== modeFilter) {
          // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
          continue;
        }
      }
      // entries 集合追加新条目，保持收集顺序与输入顺序一致。
      entries.push(entry);
      // React hook use Arrow Key History在这里处理 `loaded++`，完成这一小步状态转换。
      loaded++;
      // 满足 `loaded >= pendingLoadTarget` 时，React hook执行该分支。
      if (loaded >= pendingLoadTarget) break;
    }
    // 返回 `entries`，作为React hook 状态流这次计算的结果。
    return entries;
  })();
  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `pendingLoad`，调用方直接接收异步结果。
    return await pendingLoad;
  } finally {
    // pendingLoad更新为 `null`，确保useArrowKeyHistory后续读取最新状态。
    pendingLoad = null;
    // pendingLoadTarget更新为 `0`，确保useArrowKeyHistory后续读取最新状态。
    pendingLoadTarget = 0;
    // pendingLoadModeFilter更新为 `undefined`，确保useArrowKeyHistory后续读取最新状态。
    pendingLoadModeFilter = undefined;
  }
}
// useArrowKeyHistory 封装useArrowKeyHistory的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useArrowKeyHistory(onSetInput: (value: string, mode: HistoryMode, pastedContents: Record<number, PastedContent>) => void, currentInput: string, pastedContents: Record<number, PastedContent>, setCursorOffset?: (offset: number) => void, currentMode?: HistoryMode): {
  historyIndex: number;
  // 这个回调绑定到 setHistoryIndex: (index: number) => void;，负责React hook 状态流在该局部场景下的响应。
  setHistoryIndex: (index: number) => void;
  // 这个回调绑定到 onHistoryUp: () => void;，负责React hook 状态流在该局部场景下的响应。
  onHistoryUp: () => void;
  // 这个回调绑定到 onHistoryDown: () => boolean;，负责React hook 状态流在该局部场景下的响应。
  onHistoryDown: () => boolean;
  // 这个回调绑定到 resetHistory: () => void;，负责React hook 状态流在该局部场景下的响应。
  resetHistory: () => void;
  // 这个回调绑定到 dismissSearchHint: () => void;，负责React hook 状态流在该局部场景下的响应。
  dismissSearchHint: () => void;
} {
  // historyIndex 索引 由 React state 持有，setHistoryIndex 会在用户操作或异步结果返回时触发刷新。
  const [historyIndex, setHistoryIndex] = useState(0);
  // 从 `useState<(HistoryEntry & {` 按位置拆出 lastShownHistoryEntry、setLastShownHistoryEntry，让React hook use Arrow Key History分别处理这些返回值。
  const [lastShownHistoryEntry, setLastShownHistoryEntry] = useState<(HistoryEntry & {
    mode?: HistoryMode;
  }) | undefined>(undefined);
  // hasShownSearchHintRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const hasShownSearchHintRef = useRef(false);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification,
    removeNotification
  } = useNotifications();

  // Cache loaded history entries
  // historyCache 缓存读取 hook 状态，供React hook use Arrow ...本轮渲染使用。
  const historyCache = useRef<HistoryEntry[]>([]);
  // Track which mode filter the cache was loaded with
  // historyCacheModeFilter 缓存读取 hook 状态，供React hook use Arrow ...本轮渲染使用。
  const historyCacheModeFilter = useRef<HistoryMode | undefined>(undefined);

  // Synchronous tracker for history index to avoid stale closure issues
  // React state updates are async, so rapid keypresses can see stale values
  // historyIndexRef 引用保存`useRef`，供React hook后续处理使用。
  const historyIndexRef = useRef(0);

  // Track the mode filter that was active when history navigation started
  // This is set on the first arrow press and stays fixed until reset
  // initialModeFilterRef 引用保存 hook 状态，让React hook use Arrow ...跨渲染复用同一个容器。
  const initialModeFilterRef = useRef<HistoryMode | undefined>(undefined);

  // Refs to track current input values for draft preservation
  // These ensure we capture the draft with the latest values, not stale closure values
  // currentInputRef 引用保存`useRef`，供React hook后续处理使用。
  const currentInputRef = useRef(currentInput);
  // pastedContentsRef 引用保存`useRef`，供React hook后续处理使用。
  const pastedContentsRef = useRef(pastedContents);
  // currentModeRef 引用保存`useRef`，供React hook后续处理使用。
  const currentModeRef = useRef(currentMode);

  // Keep refs in sync with props (synchronous update on each render)
  // current更新为 `currentInput`，确保useArrowKeyHistory后续读取最新状态。
  currentInputRef.current = currentInput;
  // current更新为 `pastedContents`，确保useArrowKeyHistory后续读取最新状态。
  pastedContentsRef.current = pastedContents;
  // current更新为 `currentMode`，确保useArrowKeyHistory后续读取最新状态。
  currentModeRef.current = currentMode;
  // setInputWithCursor保存`useCallback`，供React hook后续处理使用。
  const setInputWithCursor = useCallback((value: string, mode: HistoryMode, contents: Record<number, PastedContent>, cursorToStart = false): void => {
    // 调用 onSetInput，触发React hook此处需要的副作用。
    onSetInput(value, mode, contents);
    // 调用 setCursorOffset?.(cursorToStart ? 0 : value.length);，完成这一处局部操作。
    setCursorOffset?.(cursorToStart ? 0 : value.length);
  }, [onSetInput, setCursorOffset]);
  // updateInput保存`useCallback`，供React hook后续处理使用。
  const updateInput = useCallback((input: HistoryEntry | undefined, cursorToStart_0 = false): void => {
    // 组合条件 `!input || !input.display` 成立时，React hook 状态流才启用这条专门路径。
    if (!input || !input.display) return;
    // mode_0读取`getModeFromInput`，供React hook后续处理使用。
    const mode_0 = getModeFromInput(input.display);
    // value_0格式化`display.slice`，供React hook后续处理使用。
    const value_0 = mode_0 === 'bash' ? input.display.slice(1) : input.display;
    // setInputWithCursor 写入新的状态值，使React hook 状态流后续读取保持一致。
    setInputWithCursor(value_0, mode_0, input.pastedContents ?? {}, cursorToStart_0);
  }, [setInputWithCursor]);
  // showSearchHint保存`useCallback`，供React hook后续处理使用。
  const showSearchHint = useCallback((): void => {
    // 调用 addNotification，触发React hook此处需要的副作用。
    addNotification({
      key: 'search-history-hint',
      jsx: <Text dimColor>
          <ConfigurableShortcutHint action="history:search" context="Global" fallback="ctrl+r" description="search history" />
        </Text>,
      priority: 'immediate',
      timeoutMs: FOOTER_TEMPORARY_STATUS_TIMEOUT
    });
  }, [addNotification]);
  // onHistoryUp保存`useCallback`，供React hook后续处理使用。
  const onHistoryUp = useCallback((): void => {
    // Capture and increment synchronously to handle rapid keypresses
    // targetIndex 索引 命名 `historyIndexRef.current`，让后续代码直接表达这个值的用途。
    const targetIndex = historyIndexRef.current;
    // React hook use Arrow Key History在这里处理 `historyIndexRef.current++`，完成这一小步状态转换。
    historyIndexRef.current++;
    // inputAtPress 集合保存`currentInputRef.current`，供React hook use Arrow ...后续判断或输出使用。
    const inputAtPress = currentInputRef.current;
    // pastedContentsAtPress 集合 命名 `pastedContentsRef.current`，让后续代码直接表达这个值的用途。
    const pastedContentsAtPress = pastedContentsRef.current;
    // modeAtPress 集合保存`currentModeRef.current`，供React hook use Arrow ...后续判断或输出使用。
    const modeAtPress = currentModeRef.current;
    // 满足 `targetIndex === 0` 时，React hook执行该分支。
    if (targetIndex === 0) {
      // current更新为 `modeAtPress === 'bash' ? modeAtPress : undefined`，确保useArrowKeyHistory后续读取最新状态。
      initialModeFilterRef.current = modeAtPress === 'bash' ? modeAtPress : undefined;

      // Save draft synchronously using refs for the latest values
      // This ensures we capture the draft before any async operations or re-renders
      // hasInput记录 `inputAtPress.trim` 是否成立，React hook随后按该结果分支。
      const hasInput = inputAtPress.trim() !== '';
      // setLastShownHistoryEntry 写入新的状态值，使React hook 状态流后续读取保持一致。
      setLastShownHistoryEntry(hasInput ? {
        display: inputAtPress,
        pastedContents: pastedContentsAtPress,
        mode: modeAtPress
      } : undefined);
    }
    // modeFilter保存`initialModeFilterRef.current`，供后续判断或组装使用。
    const modeFilter = initialModeFilterRef.current;
    // 调用 void，触发React hook此处需要的副作用。
    void (async () => {
      // neededCount 数量 命名 `targetIndex + 1; // How many entries we need`，让后续代码直接表达这个值的用途。
      const neededCount = targetIndex + 1; // How many entries we need

      // If mode filter changed, invalidate cache
      // `historyCacheModeFilter.current` 与 `modeFilter` 不一致时刷新派生状态，避免使用过期结果。
      if (historyCacheModeFilter.current !== modeFilter) {
        // current更新为 `[]`，确保useArrowKeyHistory后续读取最新状态。
        historyCache.current = [];
        // current更新为 `modeFilter`，确保useArrowKeyHistory后续读取最新状态。
        historyCacheModeFilter.current = modeFilter;
        // current更新为 `0`，确保useArrowKeyHistory后续读取最新状态。
        historyIndexRef.current = 0;
      }

      // Load more entries if needed
      // 满足 `historyCache.current.length < neededCount` 时，React hook执行该分支。
      if (historyCache.current.length < neededCount) {
        // Batches concurrent requests - rapid keypresses share a single disk read
        // entries 集合读取`loadHistoryEntries`，供React hook后续处理使用。
        const entries = await loadHistoryEntries(neededCount, modeFilter);
        // Only update cache if we loaded more than currently cached
        // (handles race condition where multiple loads complete out of order)
        // 满足 `entries.length > historyCache.current.length` 时，React hook执行该分支。
        if (entries.length > historyCache.current.length) {
          // current更新为 `entries`，确保useArrowKeyHistory后续读取最新状态。
          historyCache.current = entries;
        }
      }

      // Check if we can navigate
      // 满足 `targetIndex >= historyCache.current.length` 时，React hook执行该分支。
      if (targetIndex >= historyCache.current.length) {
        // Rollback the ref since we can't navigate
        // React hook use Arrow Key History在这里处理 `historyIndexRef.current--`，完成这一小步状态转换。
        historyIndexRef.current--;
        // Keep the draft intact - user stays on their current input
        // React hook use Arrow Key History在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // newIndex 索引 命名 `targetIndex + 1`，让后续代码直接表达这个值的用途。
      const newIndex = targetIndex + 1;
      // setHistoryIndex 写入新的状态值，使React hook 状态流后续读取保持一致。
      setHistoryIndex(newIndex);
      // 调用 updateInput，触发React hook此处需要的副作用。
      updateInput(historyCache.current[targetIndex], true);

      // Show hint once per session after navigating through 2 history entries
      // 组合条件 `newIndex >= 2 && !hasShownSearchHintRef.current` 成立时，React hook 状态流才启用这条专门路径。
      if (newIndex >= 2 && !hasShownSearchHintRef.current) {
        // current更新为 `true`，确保useArrowKeyHistory后续读取最新状态。
        hasShownSearchHintRef.current = true;
        // 调用 showSearchHint，触发React hook此处需要的副作用。
        showSearchHint();
      }
    })();
  }, [updateInput, showSearchHint]);
  // onHistoryDown保存`useCallback`，供React hook后续处理使用。
  const onHistoryDown = useCallback((): boolean => {
    // Use the ref for consistent reads
    // currentIndex 索引保存`historyIndexRef.current`，供后续判断或组装使用。
    const currentIndex = historyIndexRef.current;
    // 满足 `currentIndex > 1` 时，React hook执行该分支。
    if (currentIndex > 1) {
      // React hook use Arrow Key History在这里处理 `historyIndexRef.current--`，完成这一小步状态转换。
      historyIndexRef.current--;
      // setHistoryIndex 写入新的状态值，使React hook 状态流后续读取保持一致。
      setHistoryIndex(currentIndex - 1);
      // 调用 updateInput，触发React hook此处需要的副作用。
      updateInput(historyCache.current[currentIndex - 2]);
    // React hook use Arrow Key History在这里处理 `} else if (currentIndex === 1) {`，完成这一小步状态转换。
    } else if (currentIndex === 1) {
      // current更新为 `0`，确保useArrowKeyHistory后续读取最新状态。
      historyIndexRef.current = 0;
      // setHistoryIndex 写入新的状态值，使React hook 状态流后续读取保持一致。
      setHistoryIndex(0);
      // 满足 `lastShownHistoryEntry` 时，React hook执行该分支。
      if (lastShownHistoryEntry) {
        // Restore the draft with its saved mode if available
        // savedMode保存`lastShownHistoryEntry.mode`，供React hook use Arrow ...后续判断或输出使用。
        const savedMode = lastShownHistoryEntry.mode;
        // 满足 `savedMode` 时，React hook执行该分支。
        if (savedMode) {
          // setInputWithCursor 写入新的状态值，使React hook 状态流后续读取保持一致。
          setInputWithCursor(lastShownHistoryEntry.display, savedMode, lastShownHistoryEntry.pastedContents ?? {});
        } else {
          // 调用 updateInput，触发React hook此处需要的副作用。
          updateInput(lastShownHistoryEntry);
        }
      } else {
        // When in filtered mode, stay in that mode when clearing input
        // setInputWithCursor 写入新的状态值，使React hook 状态流后续读取保持一致。
        setInputWithCursor('', initialModeFilterRef.current ?? 'prompt', {});
      }
    }
    // 返回 `currentIndex <= 0`，作为React hook 状态流这次计算的结果。
    return currentIndex <= 0;
  }, [lastShownHistoryEntry, updateInput, setInputWithCursor]);
  // resetHistory保存`useCallback`，供React hook后续处理使用。
  const resetHistory = useCallback((): void => {
    // setLastShownHistoryEntry 写入新的状态值，使React hook 状态流后续读取保持一致。
    setLastShownHistoryEntry(undefined);
    // setHistoryIndex 写入新的状态值，使React hook 状态流后续读取保持一致。
    setHistoryIndex(0);
    // current更新为 `0`，确保useArrowKeyHistory后续读取最新状态。
    historyIndexRef.current = 0;
    // current更新为 `undefined`，确保useArrowKeyHistory后续读取最新状态。
    initialModeFilterRef.current = undefined;
    // 调用 removeNotification，触发React hook此处需要的副作用。
    removeNotification('search-history-hint');
    // current更新为 `[]`，确保useArrowKeyHistory后续读取最新状态。
    historyCache.current = [];
    // current更新为 `undefined`，确保useArrowKeyHistory后续读取最新状态。
    historyCacheModeFilter.current = undefined;
  }, [removeNotification]);
  // dismissSearchHint保存`useCallback`，供React hook后续处理使用。
  const dismissSearchHint = useCallback((): void => {
    // 调用 removeNotification，触发React hook此处需要的副作用。
    removeNotification('search-history-hint');
  }, [removeNotification]);
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    historyIndex,
    setHistoryIndex,
    onHistoryUp,
    onHistoryDown,
    resetHistory,
    dismissSearchHint
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlUmVmIiwidXNlU3RhdGUiLCJnZXRNb2RlRnJvbUlucHV0IiwidXNlTm90aWZpY2F0aW9ucyIsIkNvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCIsIkZPT1RFUl9URU1QT1JBUllfU1RBVFVTX1RJTUVPVVQiLCJnZXRIaXN0b3J5IiwiVGV4dCIsIlByb21wdElucHV0TW9kZSIsIkhpc3RvcnlFbnRyeSIsIlBhc3RlZENvbnRlbnQiLCJIaXN0b3J5TW9kZSIsIkhJU1RPUllfQ0hVTktfU0laRSIsInBlbmRpbmdMb2FkIiwiUHJvbWlzZSIsInBlbmRpbmdMb2FkVGFyZ2V0IiwicGVuZGluZ0xvYWRNb2RlRmlsdGVyIiwidW5kZWZpbmVkIiwibG9hZEhpc3RvcnlFbnRyaWVzIiwibWluQ291bnQiLCJtb2RlRmlsdGVyIiwidGFyZ2V0IiwiTWF0aCIsImNlaWwiLCJlbnRyaWVzIiwibG9hZGVkIiwiZW50cnkiLCJlbnRyeU1vZGUiLCJkaXNwbGF5IiwicHVzaCIsInVzZUFycm93S2V5SGlzdG9yeSIsIm9uU2V0SW5wdXQiLCJ2YWx1ZSIsIm1vZGUiLCJwYXN0ZWRDb250ZW50cyIsIlJlY29yZCIsImN1cnJlbnRJbnB1dCIsInNldEN1cnNvck9mZnNldCIsIm9mZnNldCIsImN1cnJlbnRNb2RlIiwiaGlzdG9yeUluZGV4Iiwic2V0SGlzdG9yeUluZGV4IiwiaW5kZXgiLCJvbkhpc3RvcnlVcCIsIm9uSGlzdG9yeURvd24iLCJyZXNldEhpc3RvcnkiLCJkaXNtaXNzU2VhcmNoSGludCIsImxhc3RTaG93bkhpc3RvcnlFbnRyeSIsInNldExhc3RTaG93bkhpc3RvcnlFbnRyeSIsImhhc1Nob3duU2VhcmNoSGludFJlZiIsImFkZE5vdGlmaWNhdGlvbiIsInJlbW92ZU5vdGlmaWNhdGlvbiIsImhpc3RvcnlDYWNoZSIsImhpc3RvcnlDYWNoZU1vZGVGaWx0ZXIiLCJoaXN0b3J5SW5kZXhSZWYiLCJpbml0aWFsTW9kZUZpbHRlclJlZiIsImN1cnJlbnRJbnB1dFJlZiIsInBhc3RlZENvbnRlbnRzUmVmIiwiY3VycmVudE1vZGVSZWYiLCJjdXJyZW50Iiwic2V0SW5wdXRXaXRoQ3Vyc29yIiwiY29udGVudHMiLCJjdXJzb3JUb1N0YXJ0IiwibGVuZ3RoIiwidXBkYXRlSW5wdXQiLCJpbnB1dCIsInNsaWNlIiwic2hvd1NlYXJjaEhpbnQiLCJrZXkiLCJqc3giLCJwcmlvcml0eSIsInRpbWVvdXRNcyIsInRhcmdldEluZGV4IiwiaW5wdXRBdFByZXNzIiwicGFzdGVkQ29udGVudHNBdFByZXNzIiwibW9kZUF0UHJlc3MiLCJoYXNJbnB1dCIsInRyaW0iLCJuZWVkZWRDb3VudCIsIm5ld0luZGV4IiwiY3VycmVudEluZGV4Iiwic2F2ZWRNb2RlIl0sInNvdXJjZXMiOlsidXNlQXJyb3dLZXlIaXN0b3J5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGdldE1vZGVGcm9tSW5wdXQgfSBmcm9tICdzcmMvY29tcG9uZW50cy9Qcm9tcHRJbnB1dC9pbnB1dE1vZGVzLmpzJ1xuaW1wb3J0IHsgdXNlTm90aWZpY2F0aW9ucyB9IGZyb20gJ3NyYy9jb250ZXh0L25vdGlmaWNhdGlvbnMuanMnXG5pbXBvcnQgeyBDb25maWd1cmFibGVTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0NvbmZpZ3VyYWJsZVNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IEZPT1RFUl9URU1QT1JBUllfU1RBVFVTX1RJTUVPVVQgfSBmcm9tICcuLi9jb21wb25lbnRzL1Byb21wdElucHV0L05vdGlmaWNhdGlvbnMuanMnXG5pbXBvcnQgeyBnZXRIaXN0b3J5IH0gZnJvbSAnLi4vaGlzdG9yeS5qcydcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IFByb21wdElucHV0TW9kZSB9IGZyb20gJy4uL3R5cGVzL3RleHRJbnB1dFR5cGVzLmpzJ1xuaW1wb3J0IHR5cGUgeyBIaXN0b3J5RW50cnksIFBhc3RlZENvbnRlbnQgfSBmcm9tICcuLi91dGlscy9jb25maWcuanMnXG5cbmV4cG9ydCB0eXBlIEhpc3RvcnlNb2RlID0gUHJvbXB0SW5wdXRNb2RlXG5cbi8vIExvYWQgaGlzdG9yeSBlbnRyaWVzIGluIGNodW5rcyB0byByZWR1Y2UgZGlzayByZWFkcyBvbiByYXBpZCBrZXlwcmVzc2VzXG5jb25zdCBISVNUT1JZX0NIVU5LX1NJWkUgPSAxMFxuXG4vLyBTaGFyZWQgc3RhdGUgZm9yIGJhdGNoaW5nIGNvbmN1cnJlbnQgbG9hZCByZXF1ZXN0cyBpbnRvIGEgc2luZ2xlIGRpc2sgcmVhZFxuLy8gTW9kZSBmaWx0ZXIgaXMgaW5jbHVkZWQgdG8gZW5zdXJlIHdlIGRvbid0IG1peCBmaWx0ZXJlZCBhbmQgdW5maWx0ZXJlZCBjYWNoZXNcbmxldCBwZW5kaW5nTG9hZDogUHJvbWlzZTxIaXN0b3J5RW50cnlbXT4gfCBudWxsID0gbnVsbFxubGV0IHBlbmRpbmdMb2FkVGFyZ2V0ID0gMFxubGV0IHBlbmRpbmdMb2FkTW9kZUZpbHRlcjogSGlzdG9yeU1vZGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWRcblxuYXN5bmMgZnVuY3Rpb24gbG9hZEhpc3RvcnlFbnRyaWVzKFxuICBtaW5Db3VudDogbnVtYmVyLFxuICBtb2RlRmlsdGVyPzogSGlzdG9yeU1vZGUsXG4pOiBQcm9taXNlPEhpc3RvcnlFbnRyeVtdPiB7XG4gIC8vIFJvdW5kIHVwIHRvIG5leHQgY2h1bmsgdG8gYXZvaWQgcmVwZWF0ZWQgc21hbGwgcmVhZHNcbiAgY29uc3QgdGFyZ2V0ID0gTWF0aC5jZWlsKG1pbkNvdW50IC8gSElTVE9SWV9DSFVOS19TSVpFKSAqIEhJU1RPUllfQ0hVTktfU0laRVxuXG4gIC8vIElmIGEgbG9hZCBpcyBhbHJlYWR5IHBlbmRpbmcgd2l0aCB0aGUgc2FtZSBtb2RlIGZpbHRlciBhbmQgd2lsbCBzYXRpc2Z5IG91ciBuZWVkcywgd2FpdCBmb3IgaXRcbiAgaWYgKFxuICAgIHBlbmRpbmdMb2FkICYmXG4gICAgcGVuZGluZ0xvYWRUYXJnZXQgPj0gdGFyZ2V0ICYmXG4gICAgcGVuZGluZ0xvYWRNb2RlRmlsdGVyID09PSBtb2RlRmlsdGVyXG4gICkge1xuICAgIHJldHVybiBwZW5kaW5nTG9hZFxuICB9XG5cbiAgLy8gSWYgYSBsb2FkIGlzIHBlbmRpbmcgYnV0IHdvbid0IHNhdGlzZnkgb3VyIG5lZWRzIG9yIGhhcyBkaWZmZXJlbnQgZmlsdGVyLCB3ZSBuZWVkIHRvIHdhaXQgZm9yIGl0XG4gIC8vIHRvIGNvbXBsZXRlIGZpcnN0LCB0aGVuIHN0YXJ0IGEgbmV3IG9uZSAoY2FuJ3QgaW50ZXJydXB0IGFuIG9uZ29pbmcgcmVhZClcbiAgaWYgKHBlbmRpbmdMb2FkKSB7XG4gICAgYXdhaXQgcGVuZGluZ0xvYWRcbiAgfVxuXG4gIC8vIFN0YXJ0IGEgbmV3IGxvYWRcbiAgcGVuZGluZ0xvYWRUYXJnZXQgPSB0YXJnZXRcbiAgcGVuZGluZ0xvYWRNb2RlRmlsdGVyID0gbW9kZUZpbHRlclxuICBwZW5kaW5nTG9hZCA9IChhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgZW50cmllczogSGlzdG9yeUVudHJ5W10gPSBbXVxuICAgIGxldCBsb2FkZWQgPSAwXG4gICAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiBnZXRIaXN0b3J5KCkpIHtcbiAgICAgIC8vIElmIG1vZGUgZmlsdGVyIGlzIHNwZWNpZmllZCwgb25seSBpbmNsdWRlIGVudHJpZXMgdGhhdCBtYXRjaCB0aGUgbW9kZVxuICAgICAgaWYgKG1vZGVGaWx0ZXIpIHtcbiAgICAgICAgY29uc3QgZW50cnlNb2RlID0gZ2V0TW9kZUZyb21JbnB1dChlbnRyeS5kaXNwbGF5KVxuICAgICAgICBpZiAoZW50cnlNb2RlICE9PSBtb2RlRmlsdGVyKSB7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZW50cmllcy5wdXNoKGVudHJ5KVxuICAgICAgbG9hZGVkKytcbiAgICAgIGlmIChsb2FkZWQgPj0gcGVuZGluZ0xvYWRUYXJnZXQpIGJyZWFrXG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzXG4gIH0pKClcblxuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBwZW5kaW5nTG9hZFxuICB9IGZpbmFsbHkge1xuICAgIHBlbmRpbmdMb2FkID0gbnVsbFxuICAgIHBlbmRpbmdMb2FkVGFyZ2V0ID0gMFxuICAgIHBlbmRpbmdMb2FkTW9kZUZpbHRlciA9IHVuZGVmaW5lZFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VBcnJvd0tleUhpc3RvcnkoXG4gIG9uU2V0SW5wdXQ6IChcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIG1vZGU6IEhpc3RvcnlNb2RlLFxuICAgIHBhc3RlZENvbnRlbnRzOiBSZWNvcmQ8bnVtYmVyLCBQYXN0ZWRDb250ZW50PixcbiAgKSA9PiB2b2lkLFxuICBjdXJyZW50SW5wdXQ6IHN0cmluZyxcbiAgcGFzdGVkQ29udGVudHM6IFJlY29yZDxudW1iZXIsIFBhc3RlZENvbnRlbnQ+LFxuICBzZXRDdXJzb3JPZmZzZXQ/OiAob2Zmc2V0OiBudW1iZXIpID0+IHZvaWQsXG4gIGN1cnJlbnRNb2RlPzogSGlzdG9yeU1vZGUsXG4pOiB7XG4gIGhpc3RvcnlJbmRleDogbnVtYmVyXG4gIHNldEhpc3RvcnlJbmRleDogKGluZGV4OiBudW1iZXIpID0+IHZvaWRcbiAgb25IaXN0b3J5VXA6ICgpID0+IHZvaWRcbiAgb25IaXN0b3J5RG93bjogKCkgPT4gYm9vbGVhblxuICByZXNldEhpc3Rvcnk6ICgpID0+IHZvaWRcbiAgZGlzbWlzc1NlYXJjaEhpbnQ6ICgpID0+IHZvaWRcbn0ge1xuICBjb25zdCBbaGlzdG9yeUluZGV4LCBzZXRIaXN0b3J5SW5kZXhdID0gdXNlU3RhdGUoMClcbiAgY29uc3QgW2xhc3RTaG93bkhpc3RvcnlFbnRyeSwgc2V0TGFzdFNob3duSGlzdG9yeUVudHJ5XSA9IHVzZVN0YXRlPFxuICAgIChIaXN0b3J5RW50cnkgJiB7IG1vZGU/OiBIaXN0b3J5TW9kZSB9KSB8IHVuZGVmaW5lZFxuICA+KHVuZGVmaW5lZClcbiAgY29uc3QgaGFzU2hvd25TZWFyY2hIaW50UmVmID0gdXNlUmVmKGZhbHNlKVxuICBjb25zdCB7IGFkZE5vdGlmaWNhdGlvbiwgcmVtb3ZlTm90aWZpY2F0aW9uIH0gPSB1c2VOb3RpZmljYXRpb25zKClcblxuICAvLyBDYWNoZSBsb2FkZWQgaGlzdG9yeSBlbnRyaWVzXG4gIGNvbnN0IGhpc3RvcnlDYWNoZSA9IHVzZVJlZjxIaXN0b3J5RW50cnlbXT4oW10pXG4gIC8vIFRyYWNrIHdoaWNoIG1vZGUgZmlsdGVyIHRoZSBjYWNoZSB3YXMgbG9hZGVkIHdpdGhcbiAgY29uc3QgaGlzdG9yeUNhY2hlTW9kZUZpbHRlciA9IHVzZVJlZjxIaXN0b3J5TW9kZSB8IHVuZGVmaW5lZD4odW5kZWZpbmVkKVxuXG4gIC8vIFN5bmNocm9ub3VzIHRyYWNrZXIgZm9yIGhpc3RvcnkgaW5kZXggdG8gYXZvaWQgc3RhbGUgY2xvc3VyZSBpc3N1ZXNcbiAgLy8gUmVhY3Qgc3RhdGUgdXBkYXRlcyBhcmUgYXN5bmMsIHNvIHJhcGlkIGtleXByZXNzZXMgY2FuIHNlZSBzdGFsZSB2YWx1ZXNcbiAgY29uc3QgaGlzdG9yeUluZGV4UmVmID0gdXNlUmVmKDApXG5cbiAgLy8gVHJhY2sgdGhlIG1vZGUgZmlsdGVyIHRoYXQgd2FzIGFjdGl2ZSB3aGVuIGhpc3RvcnkgbmF2aWdhdGlvbiBzdGFydGVkXG4gIC8vIFRoaXMgaXMgc2V0IG9uIHRoZSBmaXJzdCBhcnJvdyBwcmVzcyBhbmQgc3RheXMgZml4ZWQgdW50aWwgcmVzZXRcbiAgY29uc3QgaW5pdGlhbE1vZGVGaWx0ZXJSZWYgPSB1c2VSZWY8SGlzdG9yeU1vZGUgfCB1bmRlZmluZWQ+KHVuZGVmaW5lZClcblxuICAvLyBSZWZzIHRvIHRyYWNrIGN1cnJlbnQgaW5wdXQgdmFsdWVzIGZvciBkcmFmdCBwcmVzZXJ2YXRpb25cbiAgLy8gVGhlc2UgZW5zdXJlIHdlIGNhcHR1cmUgdGhlIGRyYWZ0IHdpdGggdGhlIGxhdGVzdCB2YWx1ZXMsIG5vdCBzdGFsZSBjbG9zdXJlIHZhbHVlc1xuICBjb25zdCBjdXJyZW50SW5wdXRSZWYgPSB1c2VSZWYoY3VycmVudElucHV0KVxuICBjb25zdCBwYXN0ZWRDb250ZW50c1JlZiA9IHVzZVJlZihwYXN0ZWRDb250ZW50cylcbiAgY29uc3QgY3VycmVudE1vZGVSZWYgPSB1c2VSZWYoY3VycmVudE1vZGUpXG5cbiAgLy8gS2VlcCByZWZzIGluIHN5bmMgd2l0aCBwcm9wcyAoc3luY2hyb25vdXMgdXBkYXRlIG9uIGVhY2ggcmVuZGVyKVxuICBjdXJyZW50SW5wdXRSZWYuY3VycmVudCA9IGN1cnJlbnRJbnB1dFxuICBwYXN0ZWRDb250ZW50c1JlZi5jdXJyZW50ID0gcGFzdGVkQ29udGVudHNcbiAgY3VycmVudE1vZGVSZWYuY3VycmVudCA9IGN1cnJlbnRNb2RlXG5cbiAgY29uc3Qgc2V0SW5wdXRXaXRoQ3Vyc29yID0gdXNlQ2FsbGJhY2soXG4gICAgKFxuICAgICAgdmFsdWU6IHN0cmluZyxcbiAgICAgIG1vZGU6IEhpc3RvcnlNb2RlLFxuICAgICAgY29udGVudHM6IFJlY29yZDxudW1iZXIsIFBhc3RlZENvbnRlbnQ+LFxuICAgICAgY3Vyc29yVG9TdGFydCA9IGZhbHNlLFxuICAgICk6IHZvaWQgPT4ge1xuICAgICAgb25TZXRJbnB1dCh2YWx1ZSwgbW9kZSwgY29udGVudHMpXG4gICAgICBzZXRDdXJzb3JPZmZzZXQ/LihjdXJzb3JUb1N0YXJ0ID8gMCA6IHZhbHVlLmxlbmd0aClcbiAgICB9LFxuICAgIFtvblNldElucHV0LCBzZXRDdXJzb3JPZmZzZXRdLFxuICApXG5cbiAgY29uc3QgdXBkYXRlSW5wdXQgPSB1c2VDYWxsYmFjayhcbiAgICAoaW5wdXQ6IEhpc3RvcnlFbnRyeSB8IHVuZGVmaW5lZCwgY3Vyc29yVG9TdGFydCA9IGZhbHNlKTogdm9pZCA9PiB7XG4gICAgICBpZiAoIWlucHV0IHx8ICFpbnB1dC5kaXNwbGF5KSByZXR1cm5cblxuICAgICAgY29uc3QgbW9kZSA9IGdldE1vZGVGcm9tSW5wdXQoaW5wdXQuZGlzcGxheSlcbiAgICAgIGNvbnN0IHZhbHVlID0gbW9kZSA9PT0gJ2Jhc2gnID8gaW5wdXQuZGlzcGxheS5zbGljZSgxKSA6IGlucHV0LmRpc3BsYXlcblxuICAgICAgc2V0SW5wdXRXaXRoQ3Vyc29yKHZhbHVlLCBtb2RlLCBpbnB1dC5wYXN0ZWRDb250ZW50cyA/PyB7fSwgY3Vyc29yVG9TdGFydClcbiAgICB9LFxuICAgIFtzZXRJbnB1dFdpdGhDdXJzb3JdLFxuICApXG5cbiAgY29uc3Qgc2hvd1NlYXJjaEhpbnQgPSB1c2VDYWxsYmFjaygoKTogdm9pZCA9PiB7XG4gICAgYWRkTm90aWZpY2F0aW9uKHtcbiAgICAgIGtleTogJ3NlYXJjaC1oaXN0b3J5LWhpbnQnLFxuICAgICAganN4OiAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgIGFjdGlvbj1cImhpc3Rvcnk6c2VhcmNoXCJcbiAgICAgICAgICAgIGNvbnRleHQ9XCJHbG9iYWxcIlxuICAgICAgICAgICAgZmFsbGJhY2s9XCJjdHJsK3JcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb249XCJzZWFyY2ggaGlzdG9yeVwiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKSxcbiAgICAgIHByaW9yaXR5OiAnaW1tZWRpYXRlJyxcbiAgICAgIHRpbWVvdXRNczogRk9PVEVSX1RFTVBPUkFSWV9TVEFUVVNfVElNRU9VVCxcbiAgICB9KVxuICB9LCBbYWRkTm90aWZpY2F0aW9uXSlcblxuICBjb25zdCBvbkhpc3RvcnlVcCA9IHVzZUNhbGxiYWNrKCgpOiB2b2lkID0+IHtcbiAgICAvLyBDYXB0dXJlIGFuZCBpbmNyZW1lbnQgc3luY2hyb25vdXNseSB0byBoYW5kbGUgcmFwaWQga2V5cHJlc3Nlc1xuICAgIGNvbnN0IHRhcmdldEluZGV4ID0gaGlzdG9yeUluZGV4UmVmLmN1cnJlbnRcbiAgICBoaXN0b3J5SW5kZXhSZWYuY3VycmVudCsrXG5cbiAgICBjb25zdCBpbnB1dEF0UHJlc3MgPSBjdXJyZW50SW5wdXRSZWYuY3VycmVudFxuICAgIGNvbnN0IHBhc3RlZENvbnRlbnRzQXRQcmVzcyA9IHBhc3RlZENvbnRlbnRzUmVmLmN1cnJlbnRcbiAgICBjb25zdCBtb2RlQXRQcmVzcyA9IGN1cnJlbnRNb2RlUmVmLmN1cnJlbnRcblxuICAgIGlmICh0YXJnZXRJbmRleCA9PT0gMCkge1xuICAgICAgaW5pdGlhbE1vZGVGaWx0ZXJSZWYuY3VycmVudCA9XG4gICAgICAgIG1vZGVBdFByZXNzID09PSAnYmFzaCcgPyBtb2RlQXRQcmVzcyA6IHVuZGVmaW5lZFxuXG4gICAgICAvLyBTYXZlIGRyYWZ0IHN5bmNocm9ub3VzbHkgdXNpbmcgcmVmcyBmb3IgdGhlIGxhdGVzdCB2YWx1ZXNcbiAgICAgIC8vIFRoaXMgZW5zdXJlcyB3ZSBjYXB0dXJlIHRoZSBkcmFmdCBiZWZvcmUgYW55IGFzeW5jIG9wZXJhdGlvbnMgb3IgcmUtcmVuZGVyc1xuICAgICAgY29uc3QgaGFzSW5wdXQgPSBpbnB1dEF0UHJlc3MudHJpbSgpICE9PSAnJ1xuICAgICAgc2V0TGFzdFNob3duSGlzdG9yeUVudHJ5KFxuICAgICAgICBoYXNJbnB1dFxuICAgICAgICAgID8ge1xuICAgICAgICAgICAgICBkaXNwbGF5OiBpbnB1dEF0UHJlc3MsXG4gICAgICAgICAgICAgIHBhc3RlZENvbnRlbnRzOiBwYXN0ZWRDb250ZW50c0F0UHJlc3MsXG4gICAgICAgICAgICAgIG1vZGU6IG1vZGVBdFByZXNzLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IG1vZGVGaWx0ZXIgPSBpbml0aWFsTW9kZUZpbHRlclJlZi5jdXJyZW50XG5cbiAgICB2b2lkIChhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuZWVkZWRDb3VudCA9IHRhcmdldEluZGV4ICsgMSAvLyBIb3cgbWFueSBlbnRyaWVzIHdlIG5lZWRcblxuICAgICAgLy8gSWYgbW9kZSBmaWx0ZXIgY2hhbmdlZCwgaW52YWxpZGF0ZSBjYWNoZVxuICAgICAgaWYgKGhpc3RvcnlDYWNoZU1vZGVGaWx0ZXIuY3VycmVudCAhPT0gbW9kZUZpbHRlcikge1xuICAgICAgICBoaXN0b3J5Q2FjaGUuY3VycmVudCA9IFtdXG4gICAgICAgIGhpc3RvcnlDYWNoZU1vZGVGaWx0ZXIuY3VycmVudCA9IG1vZGVGaWx0ZXJcbiAgICAgICAgaGlzdG9yeUluZGV4UmVmLmN1cnJlbnQgPSAwXG4gICAgICB9XG5cbiAgICAgIC8vIExvYWQgbW9yZSBlbnRyaWVzIGlmIG5lZWRlZFxuICAgICAgaWYgKGhpc3RvcnlDYWNoZS5jdXJyZW50Lmxlbmd0aCA8IG5lZWRlZENvdW50KSB7XG4gICAgICAgIC8vIEJhdGNoZXMgY29uY3VycmVudCByZXF1ZXN0cyAtIHJhcGlkIGtleXByZXNzZXMgc2hhcmUgYSBzaW5nbGUgZGlzayByZWFkXG4gICAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBsb2FkSGlzdG9yeUVudHJpZXMobmVlZGVkQ291bnQsIG1vZGVGaWx0ZXIpXG4gICAgICAgIC8vIE9ubHkgdXBkYXRlIGNhY2hlIGlmIHdlIGxvYWRlZCBtb3JlIHRoYW4gY3VycmVudGx5IGNhY2hlZFxuICAgICAgICAvLyAoaGFuZGxlcyByYWNlIGNvbmRpdGlvbiB3aGVyZSBtdWx0aXBsZSBsb2FkcyBjb21wbGV0ZSBvdXQgb2Ygb3JkZXIpXG4gICAgICAgIGlmIChlbnRyaWVzLmxlbmd0aCA+IGhpc3RvcnlDYWNoZS5jdXJyZW50Lmxlbmd0aCkge1xuICAgICAgICAgIGhpc3RvcnlDYWNoZS5jdXJyZW50ID0gZW50cmllc1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIHdlIGNhbiBuYXZpZ2F0ZVxuICAgICAgaWYgKHRhcmdldEluZGV4ID49IGhpc3RvcnlDYWNoZS5jdXJyZW50Lmxlbmd0aCkge1xuICAgICAgICAvLyBSb2xsYmFjayB0aGUgcmVmIHNpbmNlIHdlIGNhbid0IG5hdmlnYXRlXG4gICAgICAgIGhpc3RvcnlJbmRleFJlZi5jdXJyZW50LS1cbiAgICAgICAgLy8gS2VlcCB0aGUgZHJhZnQgaW50YWN0IC0gdXNlciBzdGF5cyBvbiB0aGVpciBjdXJyZW50IGlucHV0XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdJbmRleCA9IHRhcmdldEluZGV4ICsgMVxuICAgICAgc2V0SGlzdG9yeUluZGV4KG5ld0luZGV4KVxuICAgICAgdXBkYXRlSW5wdXQoaGlzdG9yeUNhY2hlLmN1cnJlbnRbdGFyZ2V0SW5kZXhdLCB0cnVlKVxuXG4gICAgICAvLyBTaG93IGhpbnQgb25jZSBwZXIgc2Vzc2lvbiBhZnRlciBuYXZpZ2F0aW5nIHRocm91Z2ggMiBoaXN0b3J5IGVudHJpZXNcbiAgICAgIGlmIChuZXdJbmRleCA+PSAyICYmICFoYXNTaG93blNlYXJjaEhpbnRSZWYuY3VycmVudCkge1xuICAgICAgICBoYXNTaG93blNlYXJjaEhpbnRSZWYuY3VycmVudCA9IHRydWVcbiAgICAgICAgc2hvd1NlYXJjaEhpbnQoKVxuICAgICAgfVxuICAgIH0pKClcbiAgfSwgW3VwZGF0ZUlucHV0LCBzaG93U2VhcmNoSGludF0pXG5cbiAgY29uc3Qgb25IaXN0b3J5RG93biA9IHVzZUNhbGxiYWNrKCgpOiBib29sZWFuID0+IHtcbiAgICAvLyBVc2UgdGhlIHJlZiBmb3IgY29uc2lzdGVudCByZWFkc1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGhpc3RvcnlJbmRleFJlZi5jdXJyZW50XG4gICAgaWYgKGN1cnJlbnRJbmRleCA+IDEpIHtcbiAgICAgIGhpc3RvcnlJbmRleFJlZi5jdXJyZW50LS1cbiAgICAgIHNldEhpc3RvcnlJbmRleChjdXJyZW50SW5kZXggLSAxKVxuICAgICAgdXBkYXRlSW5wdXQoaGlzdG9yeUNhY2hlLmN1cnJlbnRbY3VycmVudEluZGV4IC0gMl0pXG4gICAgfSBlbHNlIGlmIChjdXJyZW50SW5kZXggPT09IDEpIHtcbiAgICAgIGhpc3RvcnlJbmRleFJlZi5jdXJyZW50ID0gMFxuICAgICAgc2V0SGlzdG9yeUluZGV4KDApXG4gICAgICBpZiAobGFzdFNob3duSGlzdG9yeUVudHJ5KSB7XG4gICAgICAgIC8vIFJlc3RvcmUgdGhlIGRyYWZ0IHdpdGggaXRzIHNhdmVkIG1vZGUgaWYgYXZhaWxhYmxlXG4gICAgICAgIGNvbnN0IHNhdmVkTW9kZSA9IGxhc3RTaG93bkhpc3RvcnlFbnRyeS5tb2RlXG4gICAgICAgIGlmIChzYXZlZE1vZGUpIHtcbiAgICAgICAgICBzZXRJbnB1dFdpdGhDdXJzb3IoXG4gICAgICAgICAgICBsYXN0U2hvd25IaXN0b3J5RW50cnkuZGlzcGxheSxcbiAgICAgICAgICAgIHNhdmVkTW9kZSxcbiAgICAgICAgICAgIGxhc3RTaG93bkhpc3RvcnlFbnRyeS5wYXN0ZWRDb250ZW50cyA/PyB7fSxcbiAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXBkYXRlSW5wdXQobGFzdFNob3duSGlzdG9yeUVudHJ5KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXaGVuIGluIGZpbHRlcmVkIG1vZGUsIHN0YXkgaW4gdGhhdCBtb2RlIHdoZW4gY2xlYXJpbmcgaW5wdXRcbiAgICAgICAgc2V0SW5wdXRXaXRoQ3Vyc29yKCcnLCBpbml0aWFsTW9kZUZpbHRlclJlZi5jdXJyZW50ID8/ICdwcm9tcHQnLCB7fSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGN1cnJlbnRJbmRleCA8PSAwXG4gIH0sIFtsYXN0U2hvd25IaXN0b3J5RW50cnksIHVwZGF0ZUlucHV0LCBzZXRJbnB1dFdpdGhDdXJzb3JdKVxuXG4gIGNvbnN0IHJlc2V0SGlzdG9yeSA9IHVzZUNhbGxiYWNrKCgpOiB2b2lkID0+IHtcbiAgICBzZXRMYXN0U2hvd25IaXN0b3J5RW50cnkodW5kZWZpbmVkKVxuICAgIHNldEhpc3RvcnlJbmRleCgwKVxuICAgIGhpc3RvcnlJbmRleFJlZi5jdXJyZW50ID0gMFxuICAgIGluaXRpYWxNb2RlRmlsdGVyUmVmLmN1cnJlbnQgPSB1bmRlZmluZWRcbiAgICByZW1vdmVOb3RpZmljYXRpb24oJ3NlYXJjaC1oaXN0b3J5LWhpbnQnKVxuICAgIGhpc3RvcnlDYWNoZS5jdXJyZW50ID0gW11cbiAgICBoaXN0b3J5Q2FjaGVNb2RlRmlsdGVyLmN1cnJlbnQgPSB1bmRlZmluZWRcbiAgfSwgW3JlbW92ZU5vdGlmaWNhdGlvbl0pXG5cbiAgY29uc3QgZGlzbWlzc1NlYXJjaEhpbnQgPSB1c2VDYWxsYmFjaygoKTogdm9pZCA9PiB7XG4gICAgcmVtb3ZlTm90aWZpY2F0aW9uKCdzZWFyY2gtaGlzdG9yeS1oaW50JylcbiAgfSwgW3JlbW92ZU5vdGlmaWNhdGlvbl0pXG5cbiAgcmV0dXJuIHtcbiAgICBoaXN0b3J5SW5kZXgsXG4gICAgc2V0SGlzdG9yeUluZGV4LFxuICAgIG9uSGlzdG9yeVVwLFxuICAgIG9uSGlzdG9yeURvd24sXG4gICAgcmVzZXRIaXN0b3J5LFxuICAgIGRpc21pc3NTZWFyY2hIaW50LFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU9BLEtBQUssSUFBSUMsV0FBVyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQzVELFNBQVNDLGdCQUFnQixRQUFRLDBDQUEwQztBQUMzRSxTQUFTQyxnQkFBZ0IsUUFBUSw4QkFBOEI7QUFDL0QsU0FBU0Msd0JBQXdCLFFBQVEsMkNBQTJDO0FBQ3BGLFNBQVNDLCtCQUErQixRQUFRLDRDQUE0QztBQUM1RixTQUFTQyxVQUFVLFFBQVEsZUFBZTtBQUMxQyxTQUFTQyxJQUFJLFFBQVEsV0FBVztBQUNoQyxjQUFjQyxlQUFlLFFBQVEsNEJBQTRCO0FBQ2pFLGNBQWNDLFlBQVksRUFBRUMsYUFBYSxRQUFRLG9CQUFvQjtBQUVyRSxPQUFPLEtB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
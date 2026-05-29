// 类型依赖 * as React 来自 react，用于校准notifications的数据契约。
import type * as React from 'react';
// 引入 useCallback、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect } from 'react';
// 引入 useAppStateStore、useSetAppState，将 src/state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppStateStore, useSetAppState } from 'src/state/AppState.js';
// 类型依赖 { Theme } 来自 ../utils/theme.js，用于校准notifications的数据契约。
import type { Theme } from '../utils/theme.js';
// Priority 固化notifications里传递的数据形状，帮助调用方按同一结构读写字段。
type Priority = 'low' | 'medium' | 'high' | 'immediate';
// BaseNotification 固化notifications里传递的数据形状，帮助调用方按同一结构读写字段。
type BaseNotification = {
  key: string;
  /**
   * Keys of notifications that this notification invalidates.
   * If a notification is invalidated, it will be removed from the queue
   * and, if currently displayed, cleared immediately.
   */
  invalidates?: string[];
  priority: Priority;
  timeoutMs?: number;
  /**
   * Combine notifications with the same key, like Array.reduce().
   * Called as fold(accumulator, incoming) when a notification with a matching
   * key already exists in the queue or is currently displayed.
   * Returns the merged notification (should carry fold forward for future merges).
   */
  // 这个回调绑定到 fold?: (accumulator: Notification, incoming: Notification) => Notification;，负责notifications在该局部场景下的响应。
  fold?: (accumulator: Notification, incoming: Notification) => Notification;
};
// TextNotification 固化notifications里传递的数据形状，帮助调用方按同一结构读写字段。
type TextNotification = BaseNotification & {
  text: string;
  color?: keyof Theme;
};
// JSXNotification 固化notifications里传递的数据形状，帮助调用方按同一结构读写字段。
type JSXNotification = BaseNotification & {
  jsx: React.ReactNode;
};
// AddNotificationFn 固化notifications里传递的数据形状，帮助调用方按同一结构读写字段。
type AddNotificationFn = (content: Notification) => void;
// RemoveNotificationFn 固化notifications里传递的数据形状，帮助调用方按同一结构读写字段。
type RemoveNotificationFn = (key: string) => void;
// Notification 固化notifications里传递的数据形状，帮助调用方按同一结构读写字段。
export type Notification = TextNotification | JSXNotification;
// DEFAULT_TIMEOUT_MS 集合保存`8000`，供notifications后续判断或输出使用。
const DEFAULT_TIMEOUT_MS = 8000;

// Track current timeout to clear it when immediate notifications arrive
// currentTimeoutId初始化为空值，后续分支会在有数据时补齐。
let currentTimeoutId: NodeJS.Timeout | null = null;
// useNotifications 封装notifications的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useNotifications(): {
  addNotification: AddNotificationFn;
  removeNotification: RemoveNotificationFn;
} {
  // store保存`useAppStateStore`，供notifications后续处理使用。
  const store = useAppStateStore();
  // setAppState 状态保存`useSetAppState`，供notifications后续处理使用。
  const setAppState = useSetAppState();

  // Process queue when current notification finishes or queue changes
  // processQueue保存`useCallback`，供notifications后续处理使用。
  const processQueue = useCallback(() => {
    // setAppState 写入新的状态值，使notifications后续读取保持一致。
    setAppState(prev => {
      // next读取`getNext`，供notifications后续处理使用。
      const next = getNext(prev.notifications.queue);
      // `prev.notifications.current` 与 `null || !next` 不一致时刷新派生状态，避免使用过期结果。
      if (prev.notifications.current !== null || !next) {
        // 返回 `prev`，作为notifications这次计算的结果。
        return prev;
      }
      // currentTimeoutId更新为 `setTimeout((setAppState, nextKey, processQueue) => {`，确保notifications后续读取最新状态。
      currentTimeoutId = setTimeout((setAppState, nextKey, processQueue) => {
        // currentTimeoutId更新为 `null`，确保notifications后续读取最新状态。
        currentTimeoutId = null;
        // setAppState 写入新的状态值，使notifications后续读取保持一致。
        setAppState(prev => {
          // Compare by key instead of reference to handle re-created notifications
          // `prev.notifications.current?.key` 与 `nextKey` 不一致时刷新派生状态，避免使用过期结果。
          if (prev.notifications.current?.key !== nextKey) {
            // 返回 `prev`，作为notifications这次计算的结果。
            return prev;
          }
          // 返回结构化结果，集中表达notifications已经整理出的状态。
          return {
            ...prev,
            notifications: {
              queue: prev.notifications.queue,
              current: null
            }
          };
        });
        // 调用 processQueue，触发notifications此处需要的副作用。
        processQueue();
      }, next.timeoutMs ?? DEFAULT_TIMEOUT_MS, setAppState, next.key, processQueue);
      // 返回结构化结果，集中表达notifications已经整理出的状态。
      return {
        ...prev,
        notifications: {
          // 这个回调绑定到 queue: prev.notifications.queue.filter(_ => _ !== next),，负责notifications在该局部场景下的响应。
          queue: prev.notifications.queue.filter(_ => _ !== next),
          current: next
        }
      };
    });
  }, [setAppState]);
  // addNotification读取 hook 状态，供notifications本轮渲染使用。
  const addNotification = useCallback<AddNotificationFn>((notif: Notification) => {
    // Handle immediate priority notifications
    // 当 `notif.priority` 匹配 `'immediate'` 时，notifications执行对应分支。
    if (notif.priority === 'immediate') {
      // Clear any existing timeout since we're showing a new immediate notification
      // 满足 `currentTimeoutId` 时，notifications执行该分支。
      if (currentTimeoutId) {
        // 调用 clearTimeout，触发notifications此处需要的副作用。
        clearTimeout(currentTimeoutId);
        // currentTimeoutId更新为 `null`，确保notifications后续读取最新状态。
        currentTimeoutId = null;
      }

      // Set up timeout for the immediate notification
      // currentTimeoutId更新为 `setTimeout((setAppState, notif, processQueue) => {`，确保notifications后续读取最新状态。
      currentTimeoutId = setTimeout((setAppState, notif, processQueue) => {
        // currentTimeoutId更新为 `null`，确保notifications后续读取最新状态。
        currentTimeoutId = null;
        // setAppState 写入新的状态值，使notifications后续读取保持一致。
        setAppState(prev => {
          // Compare by key instead of reference to handle re-created notifications
          // `prev.notifications.current?.key` 与 `notif.key` 不一致时刷新派生状态，避免使用过期结果。
          if (prev.notifications.current?.key !== notif.key) {
            // 返回 `prev`，作为notifications这次计算的结果。
            return prev;
          }
          // 返回结构化结果，集中表达notifications已经整理出的状态。
          return {
            ...prev,
            notifications: {
              // 这个回调绑定到 queue: prev.notifications.queue.filter(_ => !notif.invalidates?.includes(_.key)),，负责notifications在该局部场景下的响应。
              queue: prev.notifications.queue.filter(_ => !notif.invalidates?.includes(_.key)),
              current: null
            }
          };
        });
        // 调用 processQueue，触发notifications此处需要的副作用。
        processQueue();
      }, notif.timeoutMs ?? DEFAULT_TIMEOUT_MS, setAppState, notif, processQueue);

      // Show the immediate notification right away
      // setAppState 写入新的状态值，使notifications后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        notifications: {
          current: notif,
          queue:
          // Only re-queue the current notification if it's not immediate
          // 这个回调绑定到 [...(prev.notifications.current ? [prev.notifications.current] : []), ...prev.notifi…，负责notifications在该局部场景下的响应。
          [...(prev.notifications.current ? [prev.notifications.current] : []), ...prev.notifications.queue].filter(_ => _.priority !== 'immediate' && !notif.invalidates?.includes(_.key))
        }
      }));
      // 返回 `; // IMPORTANT: Exit addNotification for immediate notifications`，作为notifications这次计算的结果。
      return; // IMPORTANT: Exit addNotification for immediate notifications
    }

    // Handle non-immediate notifications
    // setAppState 写入新的状态值，使notifications后续读取保持一致。
    setAppState(prev => {
      // Check if we can fold into an existing notification with the same key
      // 满足 `notif.fold` 时，notifications执行该分支。
      if (notif.fold) {
        // Fold into current notification if keys match
        // 满足 `prev.notifications.current?.key === notif.key` 时，notifications执行该分支。
        if (prev.notifications.current?.key === notif.key) {
          // folded保存`notif.fold`，供notifications后续处理使用。
          const folded = notif.fold(prev.notifications.current, notif);
          // Reset timeout for the folded notification
          // 满足 `currentTimeoutId` 时，notifications执行该分支。
          if (currentTimeoutId) {
            // 调用 clearTimeout，触发notifications此处需要的副作用。
            clearTimeout(currentTimeoutId);
            // currentTimeoutId更新为 `null`，确保notifications后续读取最新状态。
            currentTimeoutId = null;
          }
          // currentTimeoutId更新为 `setTimeout((setAppState, foldedKey, processQueue) => {`，确保notifications后续读取最新状态。
          currentTimeoutId = setTimeout((setAppState, foldedKey, processQueue) => {
            // currentTimeoutId更新为 `null`，确保notifications后续读取最新状态。
            currentTimeoutId = null;
            // setAppState 写入新的状态值，使notifications后续读取保持一致。
            setAppState(p => {
              // `p.notifications.current?.key` 与 `foldedKey` 不一致时刷新派生状态，避免使用过期结果。
              if (p.notifications.current?.key !== foldedKey) {
                // 返回 `p`，作为notifications这次计算的结果。
                return p;
              }
              // 返回结构化结果，集中表达notifications已经整理出的状态。
              return {
                ...p,
                notifications: {
                  queue: p.notifications.queue,
                  current: null
                }
              };
            });
            // 调用 processQueue，触发notifications此处需要的副作用。
            processQueue();
          }, folded.timeoutMs ?? DEFAULT_TIMEOUT_MS, setAppState, folded.key, processQueue);
          // 返回结构化结果，集中表达notifications已经整理出的状态。
          return {
            ...prev,
            notifications: {
              current: folded,
              queue: prev.notifications.queue
            }
          };
        }

        // Fold into queued notification if keys match
        // queueIdx筛选`queue.findIndex`，供notifications后续处理使用。
        const queueIdx = prev.notifications.queue.findIndex(_ => _.key === notif.key);
        // `queueIdx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
        if (queueIdx !== -1) {
          // folded保存`notif.fold`，供notifications后续处理使用。
          const folded = notif.fold(prev.notifications.queue[queueIdx]!, notif);
          // newQueue 聚合成有序列表，保持后续遍历顺序稳定。
          const newQueue = [...prev.notifications.queue];
          // newQueue[queueIdx更新为 `folded`，确保notifications后续读取最新状态。
          newQueue[queueIdx] = folded;
          // 返回结构化结果，集中表达notifications已经整理出的状态。
          return {
            ...prev,
            notifications: {
              current: prev.notifications.current,
              queue: newQueue
            }
          };
        }
      }

      // Only add to queue if not already present (prevent duplicates)
      // queuedKeys 集合保存`Set`，供notifications后续处理使用。
      const queuedKeys = new Set(prev.notifications.queue.map(_ => _.key));
      // shouldAdd记录 `queuedKeys.has` 是否成立，notifications随后按该结果分支。
      const shouldAdd = !queuedKeys.has(notif.key) && prev.notifications.current?.key !== notif.key;
      // shouldAdd缺失时提前走兜底路径，避免notifications继续依赖无效输入。
      if (!shouldAdd) return prev;
      // invalidatesCurrent筛选`includes`，供notifications后续处理使用。
      const invalidatesCurrent = prev.notifications.current !== null && notif.invalidates?.includes(prev.notifications.current.key);
      // 组合条件 `invalidatesCurrent && currentTimeoutId` 成立时，notifications才启用这条专门路径。
      if (invalidatesCurrent && currentTimeoutId) {
        // 调用 clearTimeout，触发notifications此处需要的副作用。
        clearTimeout(currentTimeoutId);
        // currentTimeoutId更新为 `null`，确保notifications后续读取最新状态。
        currentTimeoutId = null;
      }
      // 返回结构化结果，集中表达notifications已经整理出的状态。
      return {
        ...prev,
        notifications: {
          current: invalidatesCurrent ? null : prev.notifications.current,
          // 这个回调绑定到 queue: [...prev.notifications.queue.filter(_ => _.priority !== 'immediate' && !notif…，负责notifications在该局部场景下的响应。
          queue: [...prev.notifications.queue.filter(_ => _.priority !== 'immediate' && !notif.invalidates?.includes(_.key)), notif]
        }
      };
    });

    // Process queue after adding the notification
    // 调用 processQueue，触发notifications此处需要的副作用。
    processQueue();
  }, [setAppState, processQueue]);
  // removeNotification读取 hook 状态，供notifications本轮渲染使用。
  const removeNotification = useCallback<RemoveNotificationFn>((key: string) => {
    // setAppState 写入新的状态值，使notifications后续读取保持一致。
    setAppState(prev => {
      // isCurrent标记notifications是否启用对应路径。
      const isCurrent = prev.notifications.current?.key === key;
      // inQueue筛选`queue.some`，供notifications后续处理使用。
      const inQueue = prev.notifications.queue.some(n => n.key === key);
      // 组合条件 `!isCurrent && !inQueue` 成立时，notifications才启用这条专门路径。
      if (!isCurrent && !inQueue) {
        // 返回 `prev`，作为notifications这次计算的结果。
        return prev;
      }
      // 组合条件 `isCurrent && currentTimeoutId` 成立时，notifications才启用这条专门路径。
      if (isCurrent && currentTimeoutId) {
        // 调用 clearTimeout，触发notifications此处需要的副作用。
        clearTimeout(currentTimeoutId);
        // currentTimeoutId更新为 `null`，确保notifications后续读取最新状态。
        currentTimeoutId = null;
      }
      // 返回结构化结果，集中表达notifications已经整理出的状态。
      return {
        ...prev,
        notifications: {
          current: isCurrent ? null : prev.notifications.current,
          // 这个回调绑定到 queue: prev.notifications.queue.filter(n => n.key !== key)，负责notifications在该局部场景下的响应。
          queue: prev.notifications.queue.filter(n => n.key !== key)
        }
      };
    });
    // 调用 processQueue，触发notifications此处需要的副作用。
    processQueue();
  }, [setAppState, processQueue]);

  // Process queue on mount if there are notifications in the initial state.
  // Imperative read (not useAppState) — a subscription in a mount-only
  // effect would be vestigial and make every caller re-render on queue changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only effect, store is a stable context ref
  // 调用 useEffect，触发notifications此处需要的副作用。
  useEffect(() => {
    // 满足 `store.getState().notifications.queue.length > 0` 时，notifications执行该分支。
    if (store.getState().notifications.queue.length > 0) {
      // 调用 processQueue，触发notifications此处需要的副作用。
      processQueue();
    }
  }, []);
  // 返回结构化结果，集中表达notifications已经整理出的状态。
  return {
    addNotification,
    removeNotification
  };
}
// PRIORITIES 集合 集中保存notifications要一起传递的字段。
const PRIORITIES: Record<Priority, number> = {
  immediate: 0,
  high: 1,
  medium: 2,
  low: 3
};
// getNext 封装notifications的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getNext(queue: Notification[]): Notification | undefined {
  // queue为空时立即返回或跳过，避免notifications把空集合当成可处理内容。
  if (queue.length === 0) return undefined;
  // 返回 `queue.reduce((min, n) => PRIORITIES[n.priority] < PRIORITIES[min.priori...`，作为notifications这次计算的结果。
  return queue.reduce((min, n) => PRIORITIES[n.priority] < PRIORITIES[min.priority] ? n : min);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlQXBwU3RhdGVTdG9yZSIsInVzZVNldEFwcFN0YXRlIiwiVGhlbWUiLCJQcmlvcml0eSIsIkJhc2VOb3RpZmljYXRpb24iLCJrZXkiLCJpbnZhbGlkYXRlcyIsInByaW9yaXR5IiwidGltZW91dE1zIiwiZm9sZCIsImFjY3VtdWxhdG9yIiwiTm90aWZpY2F0aW9uIiwiaW5jb21pbmciLCJUZXh0Tm90aWZpY2F0aW9uIiwidGV4dCIsImNvbG9yIiwiSlNYTm90aWZpY2F0aW9uIiwianN4IiwiUmVhY3ROb2RlIiwiQWRkTm90aWZpY2F0aW9uRm4iLCJjb250ZW50IiwiUmVtb3ZlTm90aWZpY2F0aW9uRm4iLCJERUZBVUxUX1RJTUVPVVRfTVMiLCJjdXJyZW50VGltZW91dElkIiwiTm9kZUpTIiwiVGltZW91dCIsInVzZU5vdGlmaWNhdGlvbnMiLCJhZGROb3RpZmljYXRpb24iLCJyZW1vdmVOb3RpZmljYXRpb24iLCJzdG9yZSIsInNldEFwcFN0YXRlIiwicHJvY2Vzc1F1ZXVlIiwicHJldiIsIm5leHQiLCJnZXROZXh0Iiwibm90aWZpY2F0aW9ucyIsInF1ZXVlIiwiY3VycmVudCIsInNldFRpbWVvdXQiLCJuZXh0S2V5IiwiZmlsdGVyIiwiXyIsIm5vdGlmIiwiY2xlYXJUaW1lb3V0IiwiaW5jbHVkZXMiLCJmb2xkZWQiLCJmb2xkZWRLZXkiLCJwIiwicXVldWVJZHgiLCJmaW5kSW5kZXgiLCJuZXdRdWV1ZSIsInF1ZXVlZEtleXMiLCJTZXQiLCJtYXAiLCJzaG91bGRBZGQiLCJoYXMiLCJpbnZhbGlkYXRlc0N1cnJlbnQiLCJpc0N1cnJlbnQiLCJpblF1ZXVlIiwic29tZSIsIm4iLCJnZXRTdGF0ZSIsImxlbmd0aCIsIlBSSU9SSVRJRVMiLCJSZWNvcmQiLCJpbW1lZGlhdGUiLCJoaWdoIiwibWVkaXVtIiwibG93IiwidW5kZWZpbmVkIiwicmVkdWNlIiwibWluIl0sInNvdXJjZXMiOlsibm90aWZpY2F0aW9ucy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUFwcFN0YXRlU3RvcmUsIHVzZVNldEFwcFN0YXRlIH0gZnJvbSAnc3JjL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBUaGVtZSB9IGZyb20gJy4uL3V0aWxzL3RoZW1lLmpzJ1xuXG50eXBlIFByaW9yaXR5ID0gJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJyB8ICdpbW1lZGlhdGUnXG5cbnR5cGUgQmFzZU5vdGlmaWNhdGlvbiA9IHtcbiAga2V5OiBzdHJpbmdcbiAgLyoqXG4gICAqIEtleXMgb2Ygbm90aWZpY2F0aW9ucyB0aGF0IHRoaXMgbm90aWZpY2F0aW9uIGludmFsaWRhdGVzLlxuICAgKiBJZiBhIG5vdGlmaWNhdGlvbiBpcyBpbnZhbGlkYXRlZCwgaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIHF1ZXVlXG4gICAqIGFuZCwgaWYgY3VycmVudGx5IGRpc3BsYXllZCwgY2xlYXJlZCBpbW1lZGlhdGVseS5cbiAgICovXG4gIGludmFsaWRhdGVzPzogc3RyaW5nW11cbiAgcHJpb3JpdHk6IFByaW9yaXR5XG4gIHRpbWVvdXRNcz86IG51bWJlclxuICAvKipcbiAgICogQ29tYmluZSBub3RpZmljYXRpb25zIHdpdGggdGhlIHNhbWUga2V5LCBsaWtlIEFycmF5LnJlZHVjZSgpLlxuICAgKiBDYWxsZWQgYXMgZm9sZChhY2N1bXVsYXRvciwgaW5jb21pbmcpIHdoZW4gYSBub3RpZmljYXRpb24gd2l0aCBhIG1hdGNoaW5nXG4gICAqIGtleSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgcXVldWUgb3IgaXMgY3VycmVudGx5IGRpc3BsYXllZC5cbiAgICogUmV0dXJucyB0aGUgbWVyZ2VkIG5vdGlmaWNhdGlvbiAoc2hvdWxkIGNhcnJ5IGZvbGQgZm9yd2FyZCBmb3IgZnV0dXJlIG1lcmdlcykuXG4gICAqL1xuICBmb2xkPzogKGFjY3VtdWxhdG9yOiBOb3RpZmljYXRpb24sIGluY29taW5nOiBOb3RpZmljYXRpb24pID0+IE5vdGlmaWNhdGlvblxufVxuXG50eXBlIFRleHROb3RpZmljYXRpb24gPSBCYXNlTm90aWZpY2F0aW9uICYge1xuICB0ZXh0OiBzdHJpbmdcbiAgY29sb3I/OiBrZXlvZiBUaGVtZVxufVxuXG50eXBlIEpTWE5vdGlmaWNhdGlvbiA9IEJhc2VOb3RpZmljYXRpb24gJiB7XG4gIGpzeDogUmVhY3QuUmVhY3ROb2RlXG59XG5cbnR5cGUgQWRkTm90aWZpY2F0aW9uRm4gPSAoY29udGVudDogTm90aWZpY2F0aW9uKSA9PiB2b2lkXG50eXBlIFJlbW92ZU5vdGlmaWNhdGlvbkZuID0gKGtleTogc3RyaW5nKSA9PiB2b2lkXG5cbmV4cG9ydCB0eXBlIE5vdGlmaWNhdGlvbiA9IFRleHROb3RpZmljYXRpb24gfCBKU1hOb3RpZmljYXRpb25cblxuY29uc3QgREVGQVVMVF9USU1FT1VUX01TID0gODAwMFxuXG4vLyBUcmFjayBjdXJyZW50IHRpbWVvdXQgdG8gY2xlYXIgaXQgd2hlbiBpbW1lZGlhdGUgbm90aWZpY2F0aW9ucyBhcnJpdmVcbmxldCBjdXJyZW50VGltZW91dElkOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsXG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VOb3RpZmljYXRpb25zKCk6IHtcbiAgYWRkTm90aWZpY2F0aW9uOiBBZGROb3RpZmljYXRpb25GblxuICByZW1vdmVOb3RpZmljYXRpb246IFJlbW92ZU5vdGlmaWNhdGlvbkZuXG59IHtcbiAgY29uc3Qgc3RvcmUgPSB1c2VBcHBTdGF0ZVN0b3JlKClcbiAgY29uc3Qgc2V0QXBwU3RhdGUgPSB1c2VTZXRBcHBTdGF0ZSgpXG5cbiAgLy8gUHJvY2VzcyBxdWV1ZSB3aGVuIGN1cnJlbnQgbm90aWZpY2F0aW9uIGZpbmlzaGVzIG9yIHF1ZXVlIGNoYW5nZXNcbiAgY29uc3QgcHJvY2Vzc1F1ZXVlID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHNldEFwcFN0YXRlKHByZXYgPT4ge1xuICAgICAgY29uc3QgbmV4dCA9IGdldE5leHQocHJldi5ub3RpZmljYXRpb25zLnF1ZXVlKVxuICAgICAgaWYgKHByZXYubm90aWZpY2F0aW9ucy5jdXJyZW50ICE9PSBudWxsIHx8ICFuZXh0KSB7XG4gICAgICAgIHJldHVybiBwcmV2XG4gICAgICB9XG5cbiAgICAgIGN1cnJlbnRUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KFxuICAgICAgICAoc2V0QXBwU3RhdGUsIG5leHRLZXksIHByb2Nlc3NRdWV1ZSkgPT4ge1xuICAgICAgICAgIGN1cnJlbnRUaW1lb3V0SWQgPSBudWxsXG4gICAgICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiB7XG4gICAgICAgICAgICAvLyBDb21wYXJlIGJ5IGtleSBpbnN0ZWFkIG9mIHJlZmVyZW5jZSB0byBoYW5kbGUgcmUtY3JlYXRlZCBub3RpZmljYXRpb25zXG4gICAgICAgICAgICBpZiAocHJldi5ub3RpZmljYXRpb25zLmN1cnJlbnQ/LmtleSAhPT0gbmV4dEtleSkge1xuICAgICAgICAgICAgICByZXR1cm4gcHJldlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgICAgbm90aWZpY2F0aW9uczoge1xuICAgICAgICAgICAgICAgIHF1ZXVlOiBwcmV2Lm5vdGlmaWNhdGlvbnMucXVldWUsXG4gICAgICAgICAgICAgICAgY3VycmVudDogbnVsbCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgIHByb2Nlc3NRdWV1ZSgpXG4gICAgICAgIH0sXG4gICAgICAgIG5leHQudGltZW91dE1zID8/IERFRkFVTFRfVElNRU9VVF9NUyxcbiAgICAgICAgc2V0QXBwU3RhdGUsXG4gICAgICAgIG5leHQua2V5LFxuICAgICAgICBwcm9jZXNzUXVldWUsXG4gICAgICApXG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnByZXYsXG4gICAgICAgIG5vdGlmaWNhdGlvbnM6IHtcbiAgICAgICAgICBxdWV1ZTogcHJldi5ub3RpZmljYXRpb25zLnF1ZXVlLmZpbHRlcihfID0+IF8gIT09IG5leHQpLFxuICAgICAgICAgIGN1cnJlbnQ6IG5leHQsXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfSlcbiAgfSwgW3NldEFwcFN0YXRlXSlcblxuICBjb25zdCBhZGROb3RpZmljYXRpb24gPSB1c2VDYWxsYmFjazxBZGROb3RpZmljYXRpb25Gbj4oXG4gICAgKG5vdGlmOiBOb3RpZmljYXRpb24pID0+IHtcbiAgICAgIC8vIEhhbmRsZSBpbW1lZGlhdGUgcHJpb3JpdHkgbm90aWZpY2F0aW9uc1xuICAgICAgaWYgKG5vdGlmLnByaW9yaXR5ID09PSAnaW1tZWRpYXRlJykge1xuICAgICAgICAvLyBDbGVhciBhbnkgZXhpc3RpbmcgdGltZW91dCBzaW5jZSB3ZSdyZSBzaG93aW5nIGEgbmV3IGltbWVkaWF0ZSBub3RpZmljYXRpb25cbiAgICAgICAgaWYgKGN1cnJlbnRUaW1lb3V0SWQpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoY3VycmVudFRpbWVvdXRJZClcbiAgICAgICAgICBjdXJyZW50VGltZW91dElkID0gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHVwIHRpbWVvdXQgZm9yIHRoZSBpbW1lZGlhdGUgbm90aWZpY2F0aW9uXG4gICAgICAgIGN1cnJlbnRUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KFxuICAgICAgICAgIChzZXRBcHBTdGF0ZSwgbm90aWYsIHByb2Nlc3NRdWV1ZSkgPT4ge1xuICAgICAgICAgICAgY3VycmVudFRpbWVvdXRJZCA9IG51bGxcbiAgICAgICAgICAgIHNldEFwcFN0YXRlKHByZXYgPT4ge1xuICAgICAgICAgICAgICAvLyBDb21wYXJlIGJ5IGtleSBpbnN0ZWFkIG9mIHJlZmVyZW5jZSB0byBoYW5kbGUgcmUtY3JlYXRlZCBub3RpZmljYXRpb25zXG4gICAgICAgICAgICAgIGlmIChwcmV2Lm5vdGlmaWNhdGlvbnMuY3VycmVudD8ua2V5ICE9PSBub3RpZi5rZXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJldlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiB7XG4gICAgICAgICAgICAgICAgICBxdWV1ZTogcHJldi5ub3RpZmljYXRpb25zLnF1ZXVlLmZpbHRlcihcbiAgICAgICAgICAgICAgICAgICAgXyA9PiAhbm90aWYuaW52YWxpZGF0ZXM/LmluY2x1ZGVzKF8ua2V5KSxcbiAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICBjdXJyZW50OiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBwcm9jZXNzUXVldWUoKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgbm90aWYudGltZW91dE1zID8/IERFRkFVTFRfVElNRU9VVF9NUyxcbiAgICAgICAgICBzZXRBcHBTdGF0ZSxcbiAgICAgICAgICBub3RpZixcbiAgICAgICAgICBwcm9jZXNzUXVldWUsXG4gICAgICAgIClcblxuICAgICAgICAvLyBTaG93IHRoZSBpbW1lZGlhdGUgbm90aWZpY2F0aW9uIHJpZ2h0IGF3YXlcbiAgICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiAoe1xuICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgbm90aWZpY2F0aW9uczoge1xuICAgICAgICAgICAgY3VycmVudDogbm90aWYsXG4gICAgICAgICAgICBxdWV1ZTpcbiAgICAgICAgICAgICAgLy8gT25seSByZS1xdWV1ZSB0aGUgY3VycmVudCBub3RpZmljYXRpb24gaWYgaXQncyBub3QgaW1tZWRpYXRlXG4gICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAuLi4ocHJldi5ub3RpZmljYXRpb25zLmN1cnJlbnRcbiAgICAgICAgICAgICAgICAgID8gW3ByZXYubm90aWZpY2F0aW9ucy5jdXJyZW50XVxuICAgICAgICAgICAgICAgICAgOiBbXSksXG4gICAgICAgICAgICAgICAgLi4ucHJldi5ub3RpZmljYXRpb25zLnF1ZXVlLFxuICAgICAgICAgICAgICBdLmZpbHRlcihcbiAgICAgICAgICAgICAgICBfID0+XG4gICAgICAgICAgICAgICAgICBfLnByaW9yaXR5ICE9PSAnaW1tZWRpYXRlJyAmJlxuICAgICAgICAgICAgICAgICAgIW5vdGlmLmludmFsaWRhdGVzPy5pbmNsdWRlcyhfLmtleSksXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgfSxcbiAgICAgICAgfSkpXG4gICAgICAgIHJldHVybiAvLyBJTVBPUlRBTlQ6IEV4aXQgYWRkTm90aWZpY2F0aW9uIGZvciBpbW1lZGlhdGUgbm90aWZpY2F0aW9uc1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgbm9uLWltbWVkaWF0ZSBub3RpZmljYXRpb25zXG4gICAgICBzZXRBcHBTdGF0ZShwcmV2ID0+IHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgd2UgY2FuIGZvbGQgaW50byBhbiBleGlzdGluZyBub3RpZmljYXRpb24gd2l0aCB0aGUgc2FtZSBrZXlcbiAgICAgICAgaWYgKG5vdGlmLmZvbGQpIHtcbiAgICAgICAgICAvLyBGb2xkIGludG8gY3VycmVudCBub3RpZmljYXRpb24gaWYga2V5cyBtYXRjaFxuICAgICAgICAgIGlmIChwcmV2Lm5vdGlmaWNhdGlvbnMuY3VycmVudD8ua2V5ID09PSBub3RpZi5rZXkpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvbGRlZCA9IG5vdGlmLmZvbGQocHJldi5ub3RpZmljYXRpb25zLmN1cnJlbnQsIG5vdGlmKVxuICAgICAgICAgICAgLy8gUmVzZXQgdGltZW91dCBmb3IgdGhlIGZvbGRlZCBub3RpZmljYXRpb25cbiAgICAgICAgICAgIGlmIChjdXJyZW50VGltZW91dElkKSB7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChjdXJyZW50VGltZW91dElkKVxuICAgICAgICAgICAgICBjdXJyZW50VGltZW91dElkID0gbnVsbFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoXG4gICAgICAgICAgICAgIChzZXRBcHBTdGF0ZSwgZm9sZGVkS2V5LCBwcm9jZXNzUXVldWUpID0+IHtcbiAgICAgICAgICAgICAgICBjdXJyZW50VGltZW91dElkID0gbnVsbFxuICAgICAgICAgICAgICAgIHNldEFwcFN0YXRlKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHAubm90aWZpY2F0aW9ucy5jdXJyZW50Py5rZXkgIT09IGZvbGRlZEtleSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgLi4ucCxcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlOiBwLm5vdGlmaWNhdGlvbnMucXVldWUsXG4gICAgICAgICAgICAgICAgICAgICAgY3VycmVudDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIHByb2Nlc3NRdWV1ZSgpXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZvbGRlZC50aW1lb3V0TXMgPz8gREVGQVVMVF9USU1FT1VUX01TLFxuICAgICAgICAgICAgICBzZXRBcHBTdGF0ZSxcbiAgICAgICAgICAgICAgZm9sZGVkLmtleSxcbiAgICAgICAgICAgICAgcHJvY2Vzc1F1ZXVlLFxuICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiB7XG4gICAgICAgICAgICAgICAgY3VycmVudDogZm9sZGVkLFxuICAgICAgICAgICAgICAgIHF1ZXVlOiBwcmV2Lm5vdGlmaWNhdGlvbnMucXVldWUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRm9sZCBpbnRvIHF1ZXVlZCBub3RpZmljYXRpb24gaWYga2V5cyBtYXRjaFxuICAgICAgICAgIGNvbnN0IHF1ZXVlSWR4ID0gcHJldi5ub3RpZmljYXRpb25zLnF1ZXVlLmZpbmRJbmRleChcbiAgICAgICAgICAgIF8gPT4gXy5rZXkgPT09IG5vdGlmLmtleSxcbiAgICAgICAgICApXG4gICAgICAgICAgaWYgKHF1ZXVlSWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3QgZm9sZGVkID0gbm90aWYuZm9sZChcbiAgICAgICAgICAgICAgcHJldi5ub3RpZmljYXRpb25zLnF1ZXVlW3F1ZXVlSWR4XSEsXG4gICAgICAgICAgICAgIG5vdGlmLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgY29uc3QgbmV3UXVldWUgPSBbLi4ucHJldi5ub3RpZmljYXRpb25zLnF1ZXVlXVxuICAgICAgICAgICAgbmV3UXVldWVbcXVldWVJZHhdID0gZm9sZGVkXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiB7XG4gICAgICAgICAgICAgICAgY3VycmVudDogcHJldi5ub3RpZmljYXRpb25zLmN1cnJlbnQsXG4gICAgICAgICAgICAgICAgcXVldWU6IG5ld1F1ZXVlLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE9ubHkgYWRkIHRvIHF1ZXVlIGlmIG5vdCBhbHJlYWR5IHByZXNlbnQgKHByZXZlbnQgZHVwbGljYXRlcylcbiAgICAgICAgY29uc3QgcXVldWVkS2V5cyA9IG5ldyBTZXQocHJldi5ub3RpZmljYXRpb25zLnF1ZXVlLm1hcChfID0+IF8ua2V5KSlcbiAgICAgICAgY29uc3Qgc2hvdWxkQWRkID1cbiAgICAgICAgICAhcXVldWVkS2V5cy5oYXMobm90aWYua2V5KSAmJlxuICAgICAgICAgIHByZXYubm90aWZpY2F0aW9ucy5jdXJyZW50Py5rZXkgIT09IG5vdGlmLmtleVxuXG4gICAgICAgIGlmICghc2hvdWxkQWRkKSByZXR1cm4gcHJldlxuXG4gICAgICAgIGNvbnN0IGludmFsaWRhdGVzQ3VycmVudCA9XG4gICAgICAgICAgcHJldi5ub3RpZmljYXRpb25zLmN1cnJlbnQgIT09IG51bGwgJiZcbiAgICAgICAgICBub3RpZi5pbnZhbGlkYXRlcz8uaW5jbHVkZXMocHJldi5ub3RpZmljYXRpb25zLmN1cnJlbnQua2V5KVxuXG4gICAgICAgIGlmIChpbnZhbGlkYXRlc0N1cnJlbnQgJiYgY3VycmVudFRpbWVvdXRJZCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjdXJyZW50VGltZW91dElkKVxuICAgICAgICAgIGN1cnJlbnRUaW1lb3V0SWQgPSBudWxsXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgbm90aWZpY2F0aW9uczoge1xuICAgICAgICAgICAgY3VycmVudDogaW52YWxpZGF0ZXNDdXJyZW50ID8gbnVsbCA6IHByZXYubm90aWZpY2F0aW9ucy5jdXJyZW50LFxuICAgICAgICAgICAgcXVldWU6IFtcbiAgICAgICAgICAgICAgLi4ucHJldi5ub3RpZmljYXRpb25zLnF1ZXVlLmZpbHRlcihcbiAgICAgICAgICAgICAgICBfID0+XG4gICAgICAgICAgICAgICAgICBfLnByaW9yaXR5ICE9PSAnaW1tZWRpYXRlJyAmJlxuICAgICAgICAgICAgICAgICAgIW5vdGlmLmludmFsaWRhdGVzPy5pbmNsdWRlcyhfLmtleSksXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIG5vdGlmLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBQcm9jZXNzIHF1ZXVlIGFmdGVyIGFkZGluZyB0aGUgbm90aWZpY2F0aW9uXG4gICAgICBwcm9jZXNzUXVldWUoKVxuICAgIH0sXG4gICAgW3NldEFwcFN0YXRlLCBwcm9jZXNzUXVldWVdLFxuICApXG5cbiAgY29uc3QgcmVtb3ZlTm90aWZpY2F0aW9uID0gdXNlQ2FsbGJhY2s8UmVtb3ZlTm90aWZpY2F0aW9uRm4+KFxuICAgIChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiB7XG4gICAgICAgIGNvbnN0IGlzQ3VycmVudCA9IHByZXYubm90aWZpY2F0aW9ucy5jdXJyZW50Py5rZXkgPT09IGtleVxuICAgICAgICBjb25zdCBpblF1ZXVlID0gcHJldi5ub3RpZmljYXRpb25zLnF1ZXVlLnNvbWUobiA9PiBuLmtleSA9PT0ga2V5KVxuXG4gICAgICAgIGlmICghaXNDdXJyZW50ICYmICFpblF1ZXVlKSB7XG4gICAgICAgICAgcmV0dXJuIHByZXZcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0N1cnJlbnQgJiYgY3VycmVudFRpbWVvdXRJZCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjdXJyZW50VGltZW91dElkKVxuICAgICAgICAgIGN1cnJlbnRUaW1lb3V0SWQgPSBudWxsXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgbm90aWZpY2F0aW9uczoge1xuICAgICAgICAgICAgY3VycmVudDogaXNDdXJyZW50ID8gbnVsbCA6IHByZXYubm90aWZpY2F0aW9ucy5jdXJyZW50LFxuICAgICAgICAgICAgcXVldWU6IHByZXYubm90aWZpY2F0aW9ucy5xdWV1ZS5maWx0ZXIobiA9PiBuLmtleSAhPT0ga2V5KSxcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBwcm9jZXNzUXVldWUoKVxuICAgIH0sXG4gICAgW3NldEFwcFN0YXRlLCBwcm9jZXNzUXVldWVdLFxuICApXG5cbiAgLy8gUHJvY2VzcyBxdWV1ZSBvbiBtb3VudCBpZiB0aGVyZSBhcmUgbm90aWZpY2F0aW9ucyBpbiB0aGUgaW5pdGlhbCBzdGF0ZS5cbiAgLy8gSW1wZXJhdGl2ZSByZWFkIChub3QgdXNlQXBwU3RhdGUpIOKAlCBhIHN1YnNjcmlwdGlvbiBpbiBhIG1vdW50LW9ubHlcbiAgLy8gZWZmZWN0IHdvdWxkIGJlIHZlc3RpZ2lhbCBhbmQgbWFrZSBldmVyeSBjYWxsZXIgcmUtcmVuZGVyIG9uIHF1ZXVlIGNoYW5nZXMuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgLy8gYmlvbWUtaWdub3JlIGxpbnQvY29ycmVjdG5lc3MvdXNlRXhoYXVzdGl2ZURlcGVuZGVuY2llczogbW91bnQtb25seSBlZmZlY3QsIHN0b3JlIGlzIGEgc3RhYmxlIGNvbnRleHQgcmVmXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHN0b3JlLmdldFN0YXRlKCkubm90aWZpY2F0aW9ucy5xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBwcm9jZXNzUXVldWUoKVxuICAgIH1cbiAgfSwgW10pXG5cbiAgcmV0dXJuIHsgYWRkTm90aWZpY2F0aW9uLCByZW1vdmVOb3RpZmljYXRpb24gfVxufVxuXG5jb25zdCBQUklPUklUSUVTOiBSZWNvcmQ8UHJpb3JpdHksIG51bWJlcj4gPSB7XG4gIGltbWVkaWF0ZTogMCxcbiAgaGlnaDogMSxcbiAgbWVkaXVtOiAyLFxuICBsb3c6IDMsXG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dChxdWV1ZTogTm90aWZpY2F0aW9uW10pOiBOb3RpZmljYXRpb24gfCB1bmRlZmluZWQge1xuICBpZiAocXVldWUubGVuZ3RoID09PSAwKSByZXR1cm4gdW5kZWZpbmVkXG4gIHJldHVybiBxdWV1ZS5yZWR1Y2UoKG1pbiwgbikgPT5cbiAgICBQUklPUklUSUVTW24ucHJpb3JpdHldIDwgUFJJT1JJVElFU1ttaW4ucHJpb3JpdHldID8gbiA6IG1pbixcbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQ25DLFNBQVNDLFdBQVcsRUFBRUMsU0FBUyxRQUFRLE9BQU87QUFDOUMsU0FBU0MsZ0JBQWdCLEVBQUVDLGNBQWMsUUFBUSx1QkFBdUI7QUFDeEUsY0FBY0MsS0FBSyxRQUFRLG1CQUFtQjtBQUU5QyxLQUFLQyxRQUFRLEdBQUcsS0FBSyxHQUFHLFFBQVEsR0FBRyxNQUFNLEdBQUcsV0FBVztBQUV2RCxLQUFLQyxnQkFBZ0IsR0FBRztFQUN0QkMsR0FBRyxFQUFFLE1BQU07RUFDWDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFdBQVcsQ0FBQyxFQUFFLE1BQU0sRUFBRTtFQUN0QkMsUUFBUSxFQUFFSixRQUFRO0VBQ2xCSyxTQUFTLENBQUMsRUFBRSxNQUFNO0VBQ2xCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxJQUFJLENBQUMsRUFBRSxDQUFDQyxXQUFXLEVBQUVDLFlBQVksRUFBRUMsUUFBUSxFQUFFRCxZQUFZLEVBQUUsR0FBR0EsWUFBWTtBQUM1RSxDQUFDO0FBRUQsS0FBS0UsZ0JBQWdCLEdBQUdULGdCQUFnQixHQUFHO0VBQ3pDVSxJQUFJLEVBQUUsTUFBTTtFQUNaQyxLQUFLLENBQUMsRUFBRSxNQUFNYixLQUFLO0FBQ3JCLENBQUM7QUFFRCxLQUFLYyxlQUFlLEdBQUdaLGdCQUFnQixHQUFHO0VBQ3hDYSxHQUFHLEVBQUVwQixLQUFLLENBQUNxQixTQUFTO0FBQ3RCLENBQUM7QUFFRCxLQUFLQyxpQkFBaUIsR0FBRyxDQUFDQyxPQUFPLEVBQUVULFlBQVksRUFBRSxHQUFHLElB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
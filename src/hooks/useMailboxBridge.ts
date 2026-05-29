// 引入 useCallback、useEffect、useMemo、useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
// 引入 useMailbox，将 ../context/mailbox.js 中已经封装好的能力接到本文件流程里。
import { useMailbox } from '../context/mailbox.js'

// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  isLoading: boolean
  // 这个回调绑定到 onSubmitMessage: (content: string) => boolean，负责React hook 状态流在该局部场景下的响应。
  onSubmitMessage: (content: string) => boolean
}

// useMailboxBridge 封装useMailboxBridge的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMailboxBridge({ isLoading, onSubmitMessage }: Props): void {
  // mailbox保存`useMailbox`，供React hook后续处理使用。
  const mailbox = useMailbox()

  // subscribe保存`useMemo`，供React hook后续处理使用。
  const subscribe = useMemo(() => mailbox.subscribe.bind(mailbox), [mailbox])
  // getSnapshot保存`useCallback`，供React hook后续处理使用。
  const getSnapshot = useCallback(() => mailbox.revision, [mailbox])
  // revision保存`useSyncExternalStore`，供React hook后续处理使用。
  const revision = useSyncExternalStore(subscribe, getSnapshot)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 满足 `isLoading` 时，React hook执行该分支。
    if (isLoading) return
    // 消息保存`mailbox.poll`，供React hook后续处理使用。
    const msg = mailbox.poll()
    // 满足 `msg) onSubmitMessage(msg.content` 时，React hook执行该分支。
    if (msg) onSubmitMessage(msg.content)
  }, [isLoading, revision, mailbox, onSubmitMessage])
}

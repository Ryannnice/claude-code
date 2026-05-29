// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react'
// 引入 useCommandQueue，将 src/hooks/useCommandQueue.js 中已经封装好的能力接到本文件流程里。
import { useCommandQueue } from 'src/hooks/useCommandQueue.js'
// 引入 useAppState，将 src/state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from 'src/state/AppState.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 src/utils/config.js 中维护。
import { getGlobalConfig } from 'src/utils/config.js'
// 复用 getExampleCommandFromCache 工具函数，把通用处理留在 src/utils/exampleCommands.js 中维护。
import { getExampleCommandFromCache } from 'src/utils/exampleCommands.js'
// 复用 isQueuedCommandEditable 工具函数，把通用处理留在 src/utils/messageQueueManager.js 中维护。
import { isQueuedCommandEditable } from 'src/utils/messageQueueManager.js'

// Dead code elimination: conditional import for proactive mode
/* eslint-disable @typescript-eslint/no-require-imports */
// proactiveModule 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const proactiveModule =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('../../proactive/index.js')
    : null

// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  input: string
  submitCount: number
  viewingAgentName?: string
}

// NUM_TIMES_QUEUE_HINT_SHOWN保存`3`，供终端渲染提示输入组件 use Prompt Input Place...后续判断或输出使用。
const NUM_TIMES_QUEUE_HINT_SHOWN = 3
// MAX_TEAMMATE_NAME_LENGTH 数量保存`20`，供终端渲染提示输入组件 use Prompt Input Place...后续判断或输出使用。
const MAX_TEAMMATE_NAME_LENGTH = 20

// usePromptInputPlaceholder 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePromptInputPlaceholder({
  input,
  submitCount,
  viewingAgentName,
}: Props): string | undefined {
  // queuedCommands 命令数据保存`useCommandQueue`，供终端渲染后续处理使用。
  const queuedCommands = useCommandQueue()
  // promptSuggestionEnabled保存`useAppState`，供终端渲染后续处理使用。
  const promptSuggestionEnabled = useAppState(s => s.promptSuggestionEnabled)
  // placeholder保存`useMemo`，供终端渲染后续处理使用。
  const placeholder = useMemo(() => {
    // `input` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
    if (input !== '') {
      // 提示输入组件 use Prompt Input Placeholder在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Show teammate hint when viewing teammate
    // 满足 `viewingAgentName` 时，终端渲染执行该分支。
    if (viewingAgentName) {
      // displayName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const displayName =
        viewingAgentName.length > MAX_TEAMMATE_NAME_LENGTH
          ? viewingAgentName.slice(0, MAX_TEAMMATE_NAME_LENGTH - 3) + '...'
          : viewingAgentName
      // 返回 ``Message @${displayName}…``，作为终端渲染这次计算的结果。
      return `Message @${displayName}…`
    }

    // Show queue hint if user has not seen it yet.
    // Only count user-editable commands — task-notification and isMeta
    // are hidden from the prompt area (see PromptInputQueuedCommands).
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      queuedCommands.some(isQueuedCommandEditable) &&
      (getGlobalConfig().queuedCommandUpHintCount || 0) <
        NUM_TIMES_QUEUE_HINT_SHOWN
    ) {
      // 返回 `'Press up to edit queued messages'`，作为终端渲染这次计算的结果。
      return 'Press up to edit queued messages'
    }

    // Show example command if user has not submitted yet and suggestions are enabled.
    // Skip in proactive mode — the model drives the conversation so onboarding
    // examples are irrelevant and block prompt suggestions from showing.
    // 终端渲染在这里按实际状态进入对应分支。
    if (
      submitCount < 1 &&
      promptSuggestionEnabled &&
      !proactiveModule?.isProactiveActive()
    ) {
      // 返回 `getExampleCommandFromCache()`，作为终端渲染这次计算的结果。
      return getExampleCommandFromCache()
    }
  }, [
    input,
    queuedCommands,
    submitCount,
    promptSuggestionEnabled,
    viewingAgentName,
  ])

  // 返回 `placeholder`，作为终端渲染这次计算的结果。
  return placeholder
}

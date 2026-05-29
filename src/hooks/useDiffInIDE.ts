// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 引入 useEffect、useMemo、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useMemo, useRef, useState } from 'react'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 复用 readFileSync 工具函数，把通用处理留在 src/utils/fileRead.js 中维护。
import { readFileSync } from 'src/utils/fileRead.js'
// 复用 expandPath 工具函数，把通用处理留在 src/utils/path.js 中维护。
import { expandPath } from 'src/utils/path.js'
// 类型依赖 { PermissionOption } 来自 ../components/permissions/FilePermissionDialog/permissionOptions.js，用于校准React hook 状态流的数据契约。
import type { PermissionOption } from '../components/permissions/FilePermissionDialog/permissionOptions.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import type {
  MCPServerConnection,
  McpSSEIDEServerConfig,
  McpWebSocketIDEServerConfig,
} from '../services/mcp/types.js'
// 类型依赖 { ToolUseContext } 来自 ../Tool.js，用于校准React hook 状态流的数据契约。
import type { ToolUseContext } from '../Tool.js'
// 类型依赖 { FileEdit } 来自 ../tools/FileEditTool/types.js，用于校准React hook 状态流的数据契约。
import type { FileEdit } from '../tools/FileEditTool/types.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getEditsForPatch,
  getPatchForEdits,
} from '../tools/FileEditTool/utils.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js'
// 复用 getPatchFromContents 工具函数，把通用处理留在 ../utils/diff.js 中维护。
import { getPatchFromContents } from '../utils/diff.js'
// 复用 isENOENT 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { isENOENT } from '../utils/errors.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  callIdeRpc,
  getConnectedIdeClient,
  getConnectedIdeName,
  hasAccessToIDEExtensionDiffFeature,
} from '../utils/ide.js'
// 复用 WindowsToWSLConverter 工具函数，把通用处理留在 ../utils/idePathConversion.js 中维护。
import { WindowsToWSLConverter } from '../utils/idePathConversion.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../utils/platform.js 中维护。
import { getPlatform } from '../utils/platform.js'

// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onChange(
    option: PermissionOption,
    input: {
      file_path: string
      edits: FileEdit[]
    },
  ): void
  toolUseContext: ToolUseContext
  filePath: string
  edits: FileEdit[]
  editMode: 'single' | 'multiple'
}

// useDiffInIDE 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDiffInIDE({
  onChange,
  toolUseContext,
  filePath,
  edits,
  editMode,
}: Props): {
  // 这个回调绑定到 closeTabInIDE: () => void，负责React hook 状态流在该局部场景下的响应。
  closeTabInIDE: () => void
  showingDiffInIDE: boolean
  ideName: string
  hasError: boolean
} {
  // isUnmounted记录 `useRef` 是否成立，React hook随后按该结果分支。
  const isUnmounted = useRef(false)
  // hasError 错误信息 由 React state 持有，setHasError 会在用户操作或异步结果返回时触发刷新。
  const [hasError, setHasError] = useState(false)

  // sha保存`useMemo`，供React hook后续处理使用。
  const sha = useMemo(() => randomUUID().slice(0, 6), [])
  // tabName保存`useMemo`，供React hook后续处理使用。
  const tabName = useMemo(
    () => `✻ [Claude Code] ${basename(filePath)} (${sha}) ⧉`,
    [filePath, sha],
  )

  // shouldShowDiffInIDE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldShowDiffInIDE =
    hasAccessToIDEExtensionDiffFeature(toolUseContext.options.mcpClients) &&
    getGlobalConfig().diffTool === 'auto' &&
    // Diffs should only be for file edits.
    // File writes may come through here but are not supported for diffs.
    !filePath.endsWith('.ipynb')

  // ideName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const ideName =
    getConnectedIdeName(toolUseContext.options.mcpClients) ?? 'IDE'

  // showDiff 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function showDiff(): Promise<void> {
    // shouldShowDiffInIDE缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!shouldShowDiffInIDE) {
      // React hook use Diff In IDE在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_ext_will_show_diff', {})

      // 从 `await showDiffInIDE(` 解构 oldContent、newContent，减少React hook use Diff In IDE对同一对象的重复访问。
      const { oldContent, newContent } = await showDiffInIDE(
        filePath,
        edits,
        toolUseContext,
        tabName,
      )
      // Skip if component has been unmounted
      // 满足 `isUnmounted.current` 时，React hook执行该分支。
      if (isUnmounted.current) {
        // React hook use Diff In IDE在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_ext_diff_accepted', {})

      // newEdits 集合保存`computeEditsFromContents`，供React hook后续处理使用。
      const newEdits = computeEditsFromContents(
        filePath,
        oldContent,
        newContent,
        editMode,
      )

      // newEdits 集合为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
      if (newEdits.length === 0) {
        // No changes -- edit was rejected (eg. reverted)
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_ext_diff_rejected', {})
        // We close the tab here because 'no' no longer auto-closes
        // ideClient读取`getConnectedIdeClient`，供React hook后续处理使用。
        const ideClient = getConnectedIdeClient(
          toolUseContext.options.mcpClients,
        )
        // 满足 `ideClient` 时，React hook执行该分支。
        if (ideClient) {
          // Close the tab in the IDE
          // 等待 `closeTabInIDE(tabName, ideClient)` 完成，再继续React hook use Diff In IDE的异步流程。
          await closeTabInIDE(tabName, ideClient)
        }
        // 调用 onChange，触发React hook此处需要的副作用。
        onChange(
          { type: 'reject' },
          {
            file_path: filePath,
            edits: edits,
          },
        )
        // React hook use Diff In IDE在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // File was modified - edit was accepted
      // 调用 onChange，触发React hook此处需要的副作用。
      onChange(
        { type: 'accept-once' },
        {
          file_path: filePath,
          edits: newEdits,
        },
      )
    } catch (error) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logError(error as Error)
      // setHasError 写入新的状态值，使React hook 状态流后续读取保持一致。
      setHasError(true)
    }
  }

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 显式忽略 `showDiff()` 的返回值，只保留它触发的副作用。
    void showDiff()

    // Set flag on unmount
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // current更新为 `true`，确保useDiffInIDE后续读取最新状态。
      isUnmounted.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    // closeTabInIDE 使用 无 完成React hook 状态流里的对应操作。
    closeTabInIDE() {
      // ideClient读取`getConnectedIdeClient`，供React hook后续处理使用。
      const ideClient = getConnectedIdeClient(toolUseContext.options.mcpClients)

      // ideClient缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!ideClient) {
        // 返回 `Promise.resolve()`，作为React hook 状态流这次计算的结果。
        return Promise.resolve()
      }

      // 返回 `closeTabInIDE(tabName, ideClient)`，作为React hook 状态流这次计算的结果。
      return closeTabInIDE(tabName, ideClient)
    },
    showingDiffInIDE: shouldShowDiffInIDE && !hasError,
    ideName: ideName,
    hasError,
  }
}

/**
 * Re-computes the edits from the old and new contents. This is necessary
 * to apply any edits the user may have made to the new contents.
 */
// computeEditsFromContents 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeEditsFromContents(
  filePath: string,
  oldContent: string,
  newContent: string,
  editMode: 'single' | 'multiple',
): FileEdit[] {
  // Use unformatted patches, otherwise the edits will be formatted.
  // singleHunk标记React hook use Diff I...是否启用对应路径。
  const singleHunk = editMode === 'single'
  // patch读取`getPatchFromContents`，供React hook后续处理使用。
  const patch = getPatchFromContents({
    filePath,
    oldContent,
    newContent,
    singleHunk,
  })

  // patch为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
  if (patch.length === 0) {
    // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
    return []
  }

  // For single edit mode, verify we only got one hunk
  // 组合条件 `singleHunk && patch.length > 1` 成立时，React hook 状态流才启用这条专门路径。
  if (singleHunk && patch.length > 1) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `Unexpected number of hunks: ${patch.length}. Expected 1 hunk.`,
      ),
    )
  }

  // Re-compute the edits to match the patch
  // 返回 `getEditsForPatch(patch)`，作为React hook 状态流这次计算的结果。
  return getEditsForPatch(patch)
}

/**
 * Done if:
 *
 * 1. Tab is closed in IDE
 * 2. Tab is saved in IDE (we then close the tab)
 * 3. User selected an option in IDE
 * 4. User selected an option in terminal (or hit esc)
 *
 * Resolves with the new file content.
 *
 * TODO: Time out after 5 mins of inactivity?
 * TODO: Update auto-approval UI when IDE exits
 * TODO: Close the IDE tab when the approval prompt is unmounted
 */
// showDiffInIDE 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function showDiffInIDE(
  file_path: string,
  edits: FileEdit[],
  toolUseContext: ToolUseContext,
  tabName: string,
): Promise<{ oldContent: string; newContent: string }> {
  // isCleanedUp标记React hook use Diff I...是否启用对应路径。
  let isCleanedUp = false

  // oldFilePath 路径数据保存`expandPath`，供React hook后续处理使用。
  const oldFilePath = expandPath(file_path)
  // 原始内容 命名 `''`，让后续代码直接表达这个值的用途。
  let oldContent = ''
  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // 原始内容更新为 `readFileSync(oldFilePath)`，确保useDiffInIDE后续读取最新状态。
    oldContent = readFileSync(oldFilePath)
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，React hook执行该分支。
    if (!isENOENT(e)) {
      // 抛出 e，阻止React hook 状态流在无效状态下继续运行。
      throw e
    }
  }

  // cleanup 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function cleanup() {
    // Careful to avoid race conditions, since this
    // function can be called from multiple places.
    // 满足 `isCleanedUp` 时，React hook执行该分支。
    if (isCleanedUp) {
      // React hook use Diff In IDE在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // isCleanedUp更新为 `true`，确保useDiffInIDE后续读取最新状态。
    isCleanedUp = true

    // Don't fail if this fails
    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `closeTabInIDE(tabName, ideClient)` 完成，再继续React hook use Diff In IDE的异步流程。
      await closeTabInIDE(tabName, ideClient)
    } catch (e) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logError(e as Error)
    }

    // 调用 process.off，触发React hook此处需要的副作用。
    process.off('beforeExit', cleanup)
    // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
    toolUseContext.abortController.signal.removeEventListener('abort', cleanup)
  }

  // Cleanup if the user hits esc to cancel the tool call - or on exit
  // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
  toolUseContext.abortController.signal.addEventListener('abort', cleanup)
  // 调用 process.on，触发React hook此处需要的副作用。
  process.on('beforeExit', cleanup)

  // Open the diff in the IDE
  // ideClient读取`getConnectedIdeClient`，供React hook后续处理使用。
  const ideClient = getConnectedIdeClient(toolUseContext.options.mcpClients)
  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // 从 `getPatchForEdits({` 解构 updatedFile，减少React hook use Diff In IDE对同一对象的重复访问。
    const { updatedFile } = getPatchForEdits({
      filePath: oldFilePath,
      fileContents: oldContent,
      edits,
    })

    // `!ideClient || ideClient.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (!ideClient || ideClient.type !== 'connected') {
      // 抛出 new Error('IDE client not available')，阻止React hook 状态流在无效状态下继续运行。
      throw new Error('IDE client not available')
    }
    // ideOldPath 路径数据 命名 `oldFilePath`，让后续代码直接表达这个值的用途。
    let ideOldPath = oldFilePath

    // Only convert paths if we're in WSL and IDE is on Windows
    // ideRunningInWindows 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const ideRunningInWindows =
      (ideClient.config as McpSSEIDEServerConfig | McpWebSocketIDEServerConfig)
        .ideRunningInWindows === true
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      getPlatform() === 'wsl' &&
      ideRunningInWindows &&
      process.env.WSL_DISTRO_NAME
    ) {
      // converter保存`WindowsToWSLConverter`，供React hook后续处理使用。
      const converter = new WindowsToWSLConverter(process.env.WSL_DISTRO_NAME)
      // ideOldPath 路径数据更新为 `converter.toIDEPath(oldFilePath)`，确保useDiffInIDE后续读取最新状态。
      ideOldPath = converter.toIDEPath(oldFilePath)
    }

    // rpcResult保存`callIdeRpc`，供React hook后续处理使用。
    const rpcResult = await callIdeRpc(
      'openDiff',
      {
        old_file_path: ideOldPath,
        new_file_path: ideOldPath,
        new_file_contents: updatedFile,
        tab_name: tabName,
      },
      ideClient,
    )

    // Convert the raw RPC result to a ToolCallResponse format
    // data保存`Array.isArray`，供React hook后续处理使用。
    const data = Array.isArray(rpcResult) ? rpcResult : [rpcResult]

    // If the user saved the file then take the new contents and resolve with that.
    // 满足 `isSaveMessage(data)` 时，React hook执行该分支。
    if (isSaveMessage(data)) {
      // 显式忽略 `cleanup()` 的返回值，只保留它触发的副作用。
      void cleanup()
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        oldContent: oldContent,
        newContent: data[1].text,
      }
    // React hook use Diff In IDE在这里处理 `} else if (isClosedMessage(data)) {`，完成这一小步状态转换。
    } else if (isClosedMessage(data)) {
      // 显式忽略 `cleanup()` 的返回值，只保留它触发的副作用。
      void cleanup()
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        oldContent: oldContent,
        newContent: updatedFile,
      }
    // React hook use Diff In IDE在这里处理 `} else if (isRejectedMessage(data)) {`，完成这一小步状态转换。
    } else if (isRejectedMessage(data)) {
      // 显式忽略 `cleanup()` 的返回值，只保留它触发的副作用。
      void cleanup()
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        oldContent: oldContent,
        newContent: oldContent,
      }
    }

    // Indicates that the tool call completed with none of the expected
    // results. Did the user close the IDE?
    // 抛出 new Error('Not accepted')，阻止React hook 状态流在无效状态下继续运行。
    throw new Error('Not accepted')
  } catch (error) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 显式忽略 `cleanup()` 的返回值，只保留它触发的副作用。
    void cleanup()
    // 抛出 error，阻止React hook 状态流在无效状态下继续运行。
    throw error
  }
}

// closeTabInIDE 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function closeTabInIDE(
  tabName: string,
  ideClient?: MCPServerConnection | undefined,
): Promise<void> {
  // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
  try {
    // `!ideClient || ideClient.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (!ideClient || ideClient.type !== 'connected') {
      // 抛出 new Error('IDE client not available')，阻止React hook 状态流在无效状态下继续运行。
      throw new Error('IDE client not available')
    }

    // Use direct RPC to close the tab
    // 等待 `callIdeRpc('close_tab', { tab_name: tabName }, ideClient)` 完成，再继续React hook use Diff In IDE的异步流程。
    await callIdeRpc('close_tab', { tab_name: tabName }, ideClient)
  } catch (error) {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // Don't throw - this is a cleanup operation
  }
}

// isClosedMessage 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isClosedMessage(data: unknown): data is { text: 'TAB_CLOSED' } {
  // 返回 `(`，作为React hook 状态流这次计算的结果。
  return (
    Array.isArray(data) &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'type' in data[0] &&
    data[0].type === 'text' &&
    'text' in data[0] &&
    data[0].text === 'TAB_CLOSED'
  )
}

// isRejectedMessage 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isRejectedMessage(data: unknown): data is { text: 'DIFF_REJECTED' } {
  // 返回 `(`，作为React hook 状态流这次计算的结果。
  return (
    Array.isArray(data) &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'type' in data[0] &&
    data[0].type === 'text' &&
    'text' in data[0] &&
    data[0].text === 'DIFF_REJECTED'
  )
}

// isSaveMessage 封装useDiffInIDE的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSaveMessage(
  data: unknown,
): data is [{ text: 'FILE_SAVED' }, { text: string }] {
  // 返回 `(`，作为React hook 状态流这次计算的结果。
  return (
    Array.isArray(data) &&
    data[0]?.type === 'text' &&
    data[0].text === 'FILE_SAVED' &&
    typeof data[1].text === 'string'
  )
}

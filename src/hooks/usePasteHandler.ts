// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 引入 useDebounceCallback，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useDebounceCallback } from 'usehooks-ts'
// 类型依赖 { InputEvent, Key } 来自 ../ink.js，用于校准React hook 状态流的数据契约。
import type { InputEvent, Key } from '../ink.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getImageFromClipboard,
  isImageFilePath,
  PASTE_THRESHOLD,
  tryReadImageFromPath,
} from '../utils/imagePaste.js'
// 类型依赖 { ImageDimensions } 来自 ../utils/imageResizer.js，用于校准React hook 状态流的数据契约。
import type { ImageDimensions } from '../utils/imageResizer.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../utils/platform.js 中维护。
import { getPlatform } from '../utils/platform.js'

// CLIPBOARD_CHECK_DEBOUNCE_MS 集合保存`50`，供后续判断或组装使用。
const CLIPBOARD_CHECK_DEBOUNCE_MS = 50
// PASTE_COMPLETION_TIMEOUT_MS 集合保存`100`，供后续判断或组装使用。
const PASTE_COMPLETION_TIMEOUT_MS = 100

// PasteHandlerProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type PasteHandlerProps = {
  onPaste?: (text: string) => void
  // 这个回调绑定到 onInput: (input: string, key: Key) => void，负责React hook 状态流在该局部场景下的响应。
  onInput: (input: string, key: Key) => void
  onImagePaste?: (
    base64Image: string,
    mediaType?: string,
    filename?: string,
    dimensions?: ImageDimensions,
    sourcePath?: string,
  ) => void
}

// usePasteHandler 封装usePasteHandler的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePasteHandler({
  onPaste,
  onInput,
  onImagePaste,
}: PasteHandlerProps): {
  // 这个回调绑定到 wrappedOnInput: (input: string, key: Key, event: InputEvent) => void，负责React hook 状态流在该局部场景下的响应。
  wrappedOnInput: (input: string, key: Key, event: InputEvent) => void
  pasteState: {
    chunks: string[]
    timeoutId: ReturnType<typeof setTimeout> | null
  }
  isPasting: boolean
} {
  // 从 `React.useState<{` 按位置拆出 pasteState、setPasteState，让React hook use Paste Handler分别处理这些返回值。
  const [pasteState, setPasteState] = React.useState<{
    chunks: string[]
    timeoutId: ReturnType<typeof setTimeout> | null
  }>({ chunks: [], timeoutId: null })
  // 从 `React.useState(false)` 按位置拆出 isPasting、setIsPasting，让React hook use Paste Handler分别处理这些返回值。
  const [isPasting, setIsPasting] = React.useState(false)
  // isMountedRef 引用记录 `React.useRef` 是否成立，React hook随后按该结果分支。
  const isMountedRef = React.useRef(true)
  // Mirrors pasteState.timeoutId but updated synchronously. When paste + a
  // keystroke arrive in the same stdin chunk, both wrappedOnInput calls run
  // in the same discreteUpdates batch before React commits — the second call
  // reads stale pasteState.timeoutId (null) and takes the onInput path. If
  // that key is Enter, it submits the old input and the paste is lost.
  // pastePendingRef 引用保存`React.useRef`，供React hook后续处理使用。
  const pastePendingRef = React.useRef(false)

  // isMacOS 集合记录 `React.useMemo` 是否成立，React hook随后按该结果分支。
  const isMacOS = React.useMemo(() => getPlatform() === 'macos', [])

  // 调用 React.useEffect，触发React hook此处需要的副作用。
  React.useEffect(() => {
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // current更新为 `false`，确保usePasteHandler后续读取最新状态。
      isMountedRef.current = false
    }
  }, [])

  // checkClipboardForImageImpl保存`React.useCallback`，供React hook后续处理使用。
  const checkClipboardForImageImpl = React.useCallback(() => {
    // 组合条件 `!onImagePaste || !isMountedRef.current` 成立时，React hook 状态流才启用这条专门路径。
    if (!onImagePaste || !isMountedRef.current) return

    // 显式忽略 `getImageFromClipboard()` 的返回值，只保留它触发的副作用。
    void getImageFromClipboard()
      // 链式调用 then，继续加工上一行在React hook 状态流中产生的数据。
      .then(imageData => {
        // 组合条件 `imageData && isMountedRef.current` 成立时，React hook 状态流才启用这条专门路径。
        if (imageData && isMountedRef.current) {
          // 调用 onImagePaste，触发React hook此处需要的副作用。
          onImagePaste(
            imageData.base64,
            imageData.mediaType,
            undefined, // no filename for clipboard images
            imageData.dimensions,
          )
        }
      })
      // 链式调用 catch，继续加工上一行在React hook 状态流中产生的数据。
      .catch(error => {
        // 满足 `isMountedRef.current` 时，React hook执行该分支。
        if (isMountedRef.current) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logError(error as Error)
        }
      })
      // 链式调用 finally，继续加工上一行在React hook 状态流中产生的数据。
      .finally(() => {
        // 满足 `isMountedRef.current` 时，React hook执行该分支。
        if (isMountedRef.current) {
          // setIsPasting 写入新的状态值，使React hook 状态流后续读取保持一致。
          setIsPasting(false)
        }
      })
  }, [onImagePaste])

  // checkClipboardForImage保存`useDebounceCallback`，供React hook后续处理使用。
  const checkClipboardForImage = useDebounceCallback(
    checkClipboardForImageImpl,
    CLIPBOARD_CHECK_DEBOUNCE_MS,
  )

  // resetPasteTimeout保存`React.useCallback`，供React hook后续处理使用。
  const resetPasteTimeout = React.useCallback(
    // 这个回调绑定到 (currentTimeoutId: ReturnType<typeof setTimeout> | null) => {，负责React hook 状态流在该局部场景下的响应。
    (currentTimeoutId: ReturnType<typeof setTimeout> | null) => {
      // 满足 `currentTimeoutId` 时，React hook执行该分支。
      if (currentTimeoutId) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(currentTimeoutId)
      }
      // 返回 `setTimeout(`，作为React hook 状态流这次计算的结果。
      return setTimeout(
        // React hook use Paste Handler在这里处理 `(`，完成这一小步状态转换。
        (
          setPasteState,
          onImagePaste,
          onPaste,
          setIsPasting,
          checkClipboardForImage,
          isMacOS,
          pastePendingRef,
        ) => {
          // current更新为 `false`，确保usePasteHandler后续读取最新状态。
          pastePendingRef.current = false
          // setPasteState 写入新的状态值，使React hook 状态流后续读取保持一致。
          setPasteState(({ chunks }) => {
            // Join chunks and filter out orphaned focus sequences
            // These can appear when focus events split during paste
            // pastedText保存`chunks`，供React hook use Paste ...后续判断或输出使用。
            const pastedText = chunks
              .join('')
              .replace(/\[I$/, '')
              .replace(/\[O$/, '')

            // Check if the pasted text contains image file paths
            // When dragging multiple images, they may come as:
            // 1. Newline-separated paths (common in some terminals)
            // 2. Space-separated paths (common when dragging from Finder)
            // For space-separated paths, we split on spaces that precede absolute paths:
            // - Unix: space followed by `/` (e.g., `/Users/...`)
            // - Windows: space followed by drive letter and `:\` (e.g., `C:\Users\...`)
            // This works because spaces within paths are escaped (e.g., `file\ name.png`)
            // 文本行 命名 `pastedText`，让后续代码直接表达这个值的用途。
            const lines = pastedText
              .split(/ (?=\/|[A-Za-z]:\\)/)
              // 链式调用 flatMap，继续加工上一行在React hook 状态流中产生的数据。
              .flatMap(part => part.split('\n'))
              // 链式调用 filter，继续加工上一行在React hook 状态流中产生的数据。
              .filter(line => line.trim())
            // imagePaths 路径数据筛选`lines.filter`，供React hook后续处理使用。
            const imagePaths = lines.filter(line => isImageFilePath(line))

            // 组合条件 `onImagePaste && imagePaths.length > 0` 成立时，React hook 状态流才启用这条专门路径。
            if (onImagePaste && imagePaths.length > 0) {
              // isTempScreenshot 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
              const isTempScreenshot =
                /\/TemporaryItems\/.*screencaptureui.*\/Screenshot/i.test(
                  pastedText,
                )

              // Process all image paths
              // 显式忽略 `Promise.all(` 的返回值，只保留它触发的副作用。
              void Promise.all(
                // 调用 imagePaths.map，触发React hook此处需要的副作用。
                imagePaths.map(imagePath => tryReadImageFromPath(imagePath)),
              // 这个回调绑定到 ).then(results => {，负责React hook 状态流在该局部场景下的响应。
              ).then(results => {
                // validImages 集合筛选`results.filter`，供React hook后续处理使用。
                const validImages = results.filter(
                  // 这个回调绑定到 (r): r is NonNullable<typeof r> => r !== null,，负责React hook 状态流在该局部场景下的响应。
                  (r): r is NonNullable<typeof r> => r !== null,
                )

                // 满足 `validImages.length > 0` 时，React hook执行该分支。
                if (validImages.length > 0) {
                  // Successfully read at least one image
                  // 按顺序遍历 `validImages` 中的imageData，逐个交给React hook处理。
                  for (const imageData of validImages) {
                    // 文件名保存`basename`，供React hook后续处理使用。
                    const filename = basename(imageData.path)
                    // 调用 onImagePaste，触发React hook此处需要的副作用。
                    onImagePaste(
                      imageData.base64,
                      imageData.mediaType,
                      filename,
                      imageData.dimensions,
                      imageData.path,
                    )
                  }
                  // If some paths weren't images, paste them as text
                  // nonImageLines 集合筛选`lines.filter`，供React hook后续处理使用。
                  const nonImageLines = lines.filter(
                    // line更新为 `> !isImageFilePath(line)`，确保usePasteHandler后续读取最新状态。
                    line => !isImageFilePath(line),
                  )
                  // 组合条件 `nonImageLines.length > 0 && onPaste` 成立时，React hook 状态流才启用这条专门路径。
                  if (nonImageLines.length > 0 && onPaste) {
                    // 调用 onPaste，触发React hook此处需要的副作用。
                    onPaste(nonImageLines.join('\n'))
                  }
                  // setIsPasting 写入新的状态值，使React hook 状态流后续读取保持一致。
                  setIsPasting(false)
                // React hook use Paste Handler在这里处理 `} else if (isTempScreenshot && isMacOS) {`，完成这一小步状态转换。
                } else if (isTempScreenshot && isMacOS) {
                  // For temporary screenshot files that no longer exist, try clipboard
                  // 调用 checkClipboardForImage，触发React hook此处需要的副作用。
                  checkClipboardForImage()
                } else {
                  // 满足 `onPaste` 时，React hook执行该分支。
                  if (onPaste) {
                    // 调用 onPaste，触发React hook此处需要的副作用。
                    onPaste(pastedText)
                  }
                  // setIsPasting 写入新的状态值，使React hook 状态流后续读取保持一致。
                  setIsPasting(false)
                }
              })
              // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
              return { chunks: [], timeoutId: null }
            }

            // If paste is empty (common when trying to paste images with Cmd+V),
            // check if clipboard has an image (macOS only)
            // isMacOS && onImagePaste && past...为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
            if (isMacOS && onImagePaste && pastedText.length === 0) {
              // 调用 checkClipboardForImage，触发React hook此处需要的副作用。
              checkClipboardForImage()
              // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
              return { chunks: [], timeoutId: null }
            }

            // Handle regular paste
            // 满足 `onPaste` 时，React hook执行该分支。
            if (onPaste) {
              // 调用 onPaste，触发React hook此处需要的副作用。
              onPaste(pastedText)
            }
            // Reset isPasting state after paste is complete
            // setIsPasting 写入新的状态值，使React hook 状态流后续读取保持一致。
            setIsPasting(false)
            // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
            return { chunks: [], timeoutId: null }
          })
        },
        PASTE_COMPLETION_TIMEOUT_MS,
        setPasteState,
        onImagePaste,
        onPaste,
        setIsPasting,
        checkClipboardForImage,
        isMacOS,
        pastePendingRef,
      )
    },
    [checkClipboardForImage, isMacOS, onImagePaste, onPaste],
  )

  // Paste detection is now done via the InputEvent's keypress.isPasted flag,
  // which is set by the keypress parser when it detects bracketed paste mode.
  // This avoids the race condition caused by having multiple listeners on stdin.
  // Previously, we had a stdin.on('data') listener here which competed with
  // the 'readable' listener in App.tsx, causing dropped characters.

  // wrappedOnInput封装成回调，供React hook use Paste ...在事件触发或异步步骤中调用。
  const wrappedOnInput = (input: string, key: Key, event: InputEvent): void => {
    // Detect paste from the parsed keypress event.
    // The keypress parser sets isPasted=true for content within bracketed paste.
    // isFromPaste标记React hook use Paste ...是否启用对应路径。
    const isFromPaste = event.keypress.isPasted

    // If this is pasted content, set isPasting state for UI feedback
    // 满足 `isFromPaste` 时，React hook执行该分支。
    if (isFromPaste) {
      // setIsPasting 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsPasting(true)
    }

    // Handle large pastes (>PASTE_THRESHOLD chars)
    // Usually we get one or two input characters at a time. If we
    // get more than the threshold, the user has probably pasted.
    // Unfortunately node batches long pastes, so it's possible
    // that we would see e.g. 1024 characters and then just a few
    // more in the next frame that belong with the original paste.
    // This batching number is not consistent.

    // Handle potential image filenames (even if they're shorter than paste threshold)
    // When dragging multiple images, they may come as newline-separated or
    // space-separated paths. Split on spaces preceding absolute paths:
    // - Unix: ` /` - Windows: ` C:\` etc.
    // hasImageFilePath 路径数据标记React hook use Paste ...是否启用对应路径。
    const hasImageFilePath = input
      .split(/ (?=\/|[A-Za-z]:\\)/)
      // 链式调用 flatMap，继续加工上一行在React hook 状态流中产生的数据。
      .flatMap(part => part.split('\n'))
      // 链式调用 some，继续加工上一行在React hook 状态流中产生的数据。
      .some(line => isImageFilePath(line.trim()))

    // Handle empty paste (clipboard image on macOS)
    // When the user pastes an image with Cmd+V, the terminal sends an empty
    // bracketed paste sequence. The keypress parser emits this as isPasted=true
    // with empty input.
    // 组合条件 `isFromPaste && input.length === 0 && isMacOS && o` 成立时，React hook 状态流才启用这条专门路径。
    if (isFromPaste && input.length === 0 && isMacOS && onImagePaste) {
      // 调用 checkClipboardForImage，触发React hook此处需要的副作用。
      checkClipboardForImage()
      // Reset isPasting since there's no text content to process
      // setIsPasting 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsPasting(false)
      // React hook use Paste Handler在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Check if we should handle as paste (from bracketed paste, large input, or continuation)
    // shouldHandleAsPaste 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const shouldHandleAsPaste =
      onPaste &&
      (input.length > PASTE_THRESHOLD ||
        pastePendingRef.current ||
        hasImageFilePath ||
        isFromPaste)

    // 满足 `shouldHandleAsPaste` 时，React hook执行该分支。
    if (shouldHandleAsPaste) {
      // current更新为 `true`，确保usePasteHandler后续读取最新状态。
      pastePendingRef.current = true
      // setPasteState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setPasteState(({ chunks, timeoutId }) => {
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          chunks: [...chunks, input],
          timeoutId: resetPasteTimeout(timeoutId),
        }
      })
      // React hook use Paste Handler在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 onInput，触发React hook此处需要的副作用。
    onInput(input, key)
    // 满足 `input.length > 10` 时，React hook执行该分支。
    if (input.length > 10) {
      // Ensure that setIsPasting is turned off on any other multicharacter
      // input, because the stdin buffer may chunk at arbitrary points and split
      // the closing escape sequence if the input length is too long for the
      // stdin buffer.
      // setIsPasting 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsPasting(false)
    }
  }

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    wrappedOnInput,
    pasteState,
    isPasting,
  }
}

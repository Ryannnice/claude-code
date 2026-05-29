// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  expandPastedTextRefs,
  formatPastedTextRef,
  getPastedTextRefNumLines,
} from '../history.js'
// 复用 instances 终端界面组件，避免在这里重复拼装显示逻辑。
import instances from '../ink/instances.js'
// 类型依赖 { PastedContent } 来自 ./config.js，用于校准共享工具的数据契约。
import type { PastedContent } from './config.js'
// 引入 classifyGuiEditor、getExternalEditor，将 ./editor.js 中已经封装好的能力接到本文件流程里。
import { classifyGuiEditor, getExternalEditor } from './editor.js'
// 引入 execSync_DEPRECATED，将 ./execSyncWrapper.js 中已经封装好的能力接到本文件流程里。
import { execSync_DEPRECATED } from './execSyncWrapper.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'
// 引入 toIDEDisplayName，将 ./ide.js 中已经封装好的能力接到本文件流程里。
import { toIDEDisplayName } from './ide.js'
// 引入 writeFileSync_DEPRECATED，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { writeFileSync_DEPRECATED } from './slowOperations.js'
// 引入 generateTempFilePath，将 ./tempfile.js 中已经封装好的能力接到本文件流程里。
import { generateTempFilePath } from './tempfile.js'

// Map of editor command overrides (e.g., to add wait flags)
// EDITOR_OVERRIDES 集合 集中保存共享工具 prompt Editor要一起传递的字段。
const EDITOR_OVERRIDES: Record<string, string> = {
  code: 'code -w', // VS Code: wait for file to be closed
  subl: 'subl --wait', // Sublime Text: wait for file to be closed
}

// isGuiEditor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isGuiEditor(editor: string): boolean {
  // 返回 `classifyGuiEditor(editor) !== undefined`，作为共享工具这次计算的结果。
  return classifyGuiEditor(editor) !== undefined
}

// EditorResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EditorResult = {
  content: string | null
  error?: string
}

// sync IO: called from sync context (React components, sync command handlers)
// editFileInEditor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function editFileInEditor(filePath: string): EditorResult {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // inkInstance读取`instances.get`，供共享工具后续处理使用。
  const inkInstance = instances.get(process.stdout)
  // inkInstance缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!inkInstance) {
    // 抛出 new Error('Ink instance not found - cannot pause rendering')，阻止共享工具在无效状态下继续运行。
    throw new Error('Ink instance not found - cannot pause rendering')
  }

  // editor读取`getExternalEditor`，供共享工具后续处理使用。
  const editor = getExternalEditor()
  // editor缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!editor) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content: null }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 fs.statSync，触发共享工具此处需要的副作用。
    fs.statSync(filePath)
  } catch {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content: null }
  }

  // useAlternateScreen保存`isGuiEditor`，供共享工具后续处理使用。
  const useAlternateScreen = !isGuiEditor(editor)

  // 满足 `useAlternateScreen` 时，共享工具执行该分支。
  if (useAlternateScreen) {
    // Terminal editors (vi, nano, etc.) take over the terminal. Delegate to
    // Ink's alt-screen-aware handoff so fullscreen mode (where <AlternateScreen>
    // already entered alt screen) doesn't get knocked back to the main buffer
    // by a hardcoded ?1049l. enterAlternateScreen() internally calls pause()
    // and suspendStdin(); exitAlternateScreen() undoes both and resets frame
    // state so the next render writes from scratch.
    // 调用 inkInstance.enterAlternateScreen，触发共享工具此处需要的副作用。
    inkInstance.enterAlternateScreen()
  } else {
    // GUI editors (code, subl, etc.) open in a separate window — just pause
    // Ink and release stdin while they're open.
    // 调用 inkInstance.pause，触发共享工具此处需要的副作用。
    inkInstance.pause()
    // 调用 inkInstance.suspendStdin，触发共享工具此处需要的副作用。
    inkInstance.suspendStdin()
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Use override command if available, otherwise use the editor as-is
    // editorCommand 命令数据保存`EDITOR_OVERRIDES[editor] ?? editor`，供共享工具 prompt Editor后续判断或输出使用。
    const editorCommand = EDITOR_OVERRIDES[editor] ?? editor
    // 调用 execSync_DEPRECATED，触发共享工具此处需要的副作用。
    execSync_DEPRECATED(`${editorCommand} "${filePath}"`, {
      stdio: 'inherit',
    })

    // Read the edited content
    // editedContent读取`fs.readFileSync`，供共享工具后续处理使用。
    const editedContent = fs.readFileSync(filePath, { encoding: 'utf-8' })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content: editedContent }
  } catch (err) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof (err as { status: unknown }).status === 'number'
    ) {
      // status 集合保存`(err as { status: number }).status`，供后续判断或组装使用。
      const status = (err as { status: number }).status
      // `status` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (status !== 0) {
        // editorName保存`toIDEDisplayName`，供共享工具后续处理使用。
        const editorName = toIDEDisplayName(editor)
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          content: null,
          error: `${editorName} exited with code ${status}`,
        }
      }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content: null }
  } finally {
    // 满足 `useAlternateScreen` 时，共享工具执行该分支。
    if (useAlternateScreen) {
      // 调用 inkInstance.exitAlternateScreen，触发共享工具此处需要的副作用。
      inkInstance.exitAlternateScreen()
    } else {
      // 调用 inkInstance.resumeStdin，触发共享工具此处需要的副作用。
      inkInstance.resumeStdin()
      // 调用 inkInstance.resume，触发共享工具此处需要的副作用。
      inkInstance.resume()
    }
  }
}

/**
 * Re-collapse expanded pasted text by finding content that matches
 * pastedContents and replacing it with references.
 */
// recollapsePastedContent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function recollapsePastedContent(
  editedPrompt: string,
  originalPrompt: string,
  pastedContents: Record<number, PastedContent>,
): string {
  // collapsed保存`editedPrompt`，供后续判断或组装使用。
  let collapsed = editedPrompt

  // Find pasted content in the edited text and re-collapse it
  // 循环处理 `const [id, content] of Object.entries(pastedContents)`，让共享工具把同类条目按顺序走完。
  for (const [id, content] of Object.entries(pastedContents)) {
    // 当 `content.type` 匹配 `'text'` 时，共享工具执行对应分支。
    if (content.type === 'text') {
      // pasteId解析`parseInt`，供共享工具后续处理使用。
      const pasteId = parseInt(id)
      // contentStr保存`content.content`，供共享工具 prompt Editor后续判断或输出使用。
      const contentStr = content.content

      // Check if this exact content exists in the edited prompt
      // contentIndex 索引保存`collapsed.indexOf`，供共享工具后续处理使用。
      const contentIndex = collapsed.indexOf(contentStr)
      // `contentIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
      if (contentIndex !== -1) {
        // Replace with reference
        // numLines 集合读取`getPastedTextRefNumLines`，供共享工具后续处理使用。
        const numLines = getPastedTextRefNumLines(contentStr)
        // ref 引用格式化`formatPastedTextRef`，供共享工具后续处理使用。
        const ref = formatPastedTextRef(pasteId, numLines)
        // 共享工具 prompt Editor在这里处理 `collapsed =`，完成这一小步状态转换。
        collapsed =
          collapsed.slice(0, contentIndex) +
          ref +
          collapsed.slice(contentIndex + contentStr.length)
      }
    }
  }

  // 返回 `collapsed`，作为共享工具这次计算的结果。
  return collapsed
}

// sync IO: called from sync context (React components, sync command handlers)
// editPromptInEditor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function editPromptInEditor(
  currentPrompt: string,
  pastedContents?: Record<number, PastedContent>,
): EditorResult {
  // fs 集合读取`getFsImplementation`，供共享工具后续处理使用。
  const fs = getFsImplementation()
  // tempFile 文件数据保存`generateTempFilePath`，供共享工具后续处理使用。
  const tempFile = generateTempFilePath()

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Expand any pasted text references before editing
    // expandedPrompt保存`pastedContents`，供后续判断或组装使用。
    const expandedPrompt = pastedContents
      ? expandPastedTextRefs(currentPrompt, pastedContents)
      : currentPrompt

    // Write expanded prompt to temp file
    // 调用 writeFileSync_DEPRECATED，触发共享工具此处需要的副作用。
    writeFileSync_DEPRECATED(tempFile, expandedPrompt, {
      encoding: 'utf-8',
      flush: true,
    })

    // Delegate to editFileInEditor
    // 结果保存`editFileInEditor`，供共享工具后续处理使用。
    const result = editFileInEditor(tempFile)

    // 满足 `result.content === null` 时，共享工具执行该分支。
    if (result.content === null) {
      // 返回 `result`，作为共享工具这次计算的结果。
      return result
    }

    // Trim a single trailing newline if present (common editor behavior)
    // finalContent保存`result.content`，供后续判断或组装使用。
    let finalContent = result.content
    // 只有 `finalContent.endsWith('\n') && !finalContent.endsWith('\n\n')` 满足时，共享工具才执行该分支。
    if (finalContent.endsWith('\n') && !finalContent.endsWith('\n\n')) {
      // finalContent更新为 `finalContent.slice(0, -1)`，确保共享工具后续读取最新状态。
      finalContent = finalContent.slice(0, -1)
    }

    // Re-collapse pasted content if it wasn't edited
    // 满足 `pastedContents` 时，共享工具执行该分支。
    if (pastedContents) {
      // finalContent更新为 `recollapsePastedContent(`，确保共享工具后续读取最新状态。
      finalContent = recollapsePastedContent(
        finalContent,
        currentPrompt,
        pastedContents,
      )
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content: finalContent }
  } finally {
    // Clean up temp file
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 调用 fs.unlinkSync，触发共享工具此处需要的副作用。
      fs.unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

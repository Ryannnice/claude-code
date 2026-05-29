// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname } from 'path'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getKeybindingsPath,
  isKeybindingCustomizationEnabled,
} from '../../keybindings/loadUserBindings.js'
// 引入 generateKeybindingsTemplate，将 ../../keybindings/template.js 中已经封装好的能力接到本文件流程里。
import { generateKeybindingsTemplate } from '../../keybindings/template.js'
// 复用 getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { getErrnoCode } from '../../utils/errors.js'
// 复用 editFileInEditor 工具函数，把通用处理留在 ../../utils/promptEditor.js 中维护。
import { editFileInEditor } from '../../utils/promptEditor.js'

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(): Promise<{ type: 'text'; value: string }> {
  // 满足 `!isKeybindingCustomizationEnabled()` 时，命令处理执行该分支。
  if (!isKeybindingCustomizationEnabled()) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value:
        'Keybinding customization is not enabled. This feature is currently in preview.',
    }
  }

  // keybindingsPath 路径数据读取`getKeybindingsPath`，供命令处理后续处理使用。
  const keybindingsPath = getKeybindingsPath()

  // Write template with 'wx' flag (exclusive create) — fails with EEXIST if
  // the file already exists. Avoids a stat pre-check (TOCTOU race + extra syscall).
  // 文件存在标记标记命令处理斜杠命令 keybindings是否启用对应路径。
  let fileExists = false
  // 等待 `mkdir(dirname(keybindingsPath), { recursive: true })` 完成，再继续斜杠命令 keybindings的异步流程。
  await mkdir(dirname(keybindingsPath), { recursive: true })
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFile(keybindingsPath, generateKeybindingsTemplate(), {` 完成，再继续斜杠命令 keybindings的异步流程。
    await writeFile(keybindingsPath, generateKeybindingsTemplate(), {
      encoding: 'utf-8',
      flag: 'wx',
    })
  } catch (e: unknown) {
    // 当 `getErrnoCode(e)` 匹配 `'EEXIST'` 时，命令处理执行对应分支。
    if (getErrnoCode(e) === 'EEXIST') {
      // 文件存在标记更新为 `true`，确保斜杠命令后续读取最新状态。
      fileExists = true
    } else {
      // 抛出 e，阻止命令处理在无效状态下继续运行。
      throw e
    }
  }

  // Open in editor
  // 结果保存`editFileInEditor`，供命令处理后续处理使用。
  const result = await editFileInEditor(keybindingsPath)
  // 满足 `result.error` 时，命令处理执行该分支。
  if (result.error) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value: `${fileExists ? 'Opened' : 'Created'} ${keybindingsPath}. Could not open in editor: ${result.error}`,
    }
  }
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text',
    value: fileExists
      ? `Opened ${keybindingsPath} in your editor.`
      : `Created ${keybindingsPath} with template. Opened in your editor.`,
  }
}

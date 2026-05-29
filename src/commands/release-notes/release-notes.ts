// 类型依赖 { LocalCommandResult } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandResult } from '../../types/command.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  CHANGELOG_URL,
  fetchAndStoreChangelog,
  getAllReleaseNotes,
  getStoredChangelog,
} from '../../utils/releaseNotes.js'

// formatReleaseNotes 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatReleaseNotes(notes: Array<[string, string[]]>): string {
  // 返回 `notes`，作为命令处理这次计算的结果。
  return notes
    .map(([version, notes]) => {
      // header 命名 ``Version ${version}:``，让后续代码直接表达这个值的用途。
      const header = `Version ${version}:`
      // bulletPoints 集合派生`notes.map`，供命令处理后续处理使用。
      const bulletPoints = notes.map(note => `· ${note}`).join('\n')
      // 返回 ``${header}\n${bulletPoints}``，作为命令处理这次计算的结果。
      return `${header}\n${bulletPoints}`
    })
    .join('\n\n')
}

// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(): Promise<LocalCommandResult> {
  // Try to fetch the latest changelog with a 500ms timeout
  // freshNotes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let freshNotes: Array<[string, string[]]> = []

  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // timeoutPromise 异步任务封装成回调，供命令处理斜杠命令 release notes在事件触发或异步步骤中调用。
    const timeoutPromise = new Promise<void>((_, reject) => {
      // setTimeout 写入新的状态值，使命令处理后续读取保持一致。
      setTimeout(rej => rej(new Error('Timeout')), 500, reject)
    })

    // 等待 `Promise.race([fetchAndStoreChangelog(), timeoutPromise])` 完成，再继续斜杠命令 release notes的异步流程。
    await Promise.race([fetchAndStoreChangelog(), timeoutPromise])
    // freshNotes 集合更新为 `getAllReleaseNotes(await getStoredChangelog())`，确保斜杠命令后续读取最新状态。
    freshNotes = getAllReleaseNotes(await getStoredChangelog())
  } catch {
    // Either fetch failed or timed out - just use cached notes
  }

  // If we have fresh notes from the quick fetch, use those
  // 满足 `freshNotes.length > 0` 时，命令处理执行该分支。
  if (freshNotes.length > 0) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { type: 'text', value: formatReleaseNotes(freshNotes) }
  }

  // Otherwise check cached notes
  // cachedNotes 缓存读取`getAllReleaseNotes`，供命令处理后续处理使用。
  const cachedNotes = getAllReleaseNotes(await getStoredChangelog())
  // 满足 `cachedNotes.length > 0` 时，命令处理执行该分支。
  if (cachedNotes.length > 0) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { type: 'text', value: formatReleaseNotes(cachedNotes) }
  }

  // Nothing available, show link
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    type: 'text',
    value: `See the full changelog at: ${CHANGELOG_URL}`,
  }
}

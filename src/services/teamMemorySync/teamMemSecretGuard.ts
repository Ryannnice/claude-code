// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'

/**
 * Check if a file write/edit to a team memory path contains secrets.
 * Returns an error message if secrets are detected, or null if safe.
 *
 * This is called from FileWriteTool and FileEditTool validateInput to
 * prevent the model from writing secrets into team memory files, which
 * would be synced to all repository collaborators.
 *
 * Callers can import and call this unconditionally — the internal
 * feature('TEAMMEM') guard keeps it inert when the build flag is off.
 * secretScanner assembles sensitive prefixes at runtime (ANT_KEY_PFX).
 */
// checkTeamMemSecrets 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkTeamMemSecrets(
  filePath: string,
  content: string,
): string | null {
  // 满足 `feature('TEAMMEM')` 时，服务层 team Mem Secret Guard执行该分支。
  if (feature('TEAMMEM')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 服务层 team Mem Secret Guard先整理这一处局部数据，后续分支可以直接读取。
    const { isTeamMemPath } =
      require('../../memdir/teamMemPaths.js') as typeof import('../../memdir/teamMemPaths.js')
    // 服务层 team Mem Secret Guard先整理这一处局部数据，后续分支可以直接读取。
    const { scanForSecrets } =
      require('./secretScanner.js') as typeof import('./secretScanner.js')
    /* eslint-enable @typescript-eslint/no-require-imports */

    // 满足 `!isTeamMemPath(filePath)` 时，服务层 team Mem Secret Guard执行该分支。
    if (!isTeamMemPath(filePath)) {
      // 返回 `null`，作为服务层 team Mem Secret Guard这次计算的结果。
      return null
    }

    // matches 集合保存`scanForSecrets`，供服务层 team Mem Secret Guard后续处理使用。
    const matches = scanForSecrets(content)
    // matches 集合为空时立即返回或跳过，避免服务层 team Mem Secret Guard把空集合当成可处理内容。
    if (matches.length === 0) {
      // 返回 `null`，作为服务层 team Mem Secret Guard这次计算的结果。
      return null
    }

    // labels 集合派生`matches.map`，供服务层 team Mem Secret Guard后续处理使用。
    const labels = matches.map(m => m.label).join(', ')
    // 返回 `(`，作为服务层 team Mem Secret Guard这次计算的结果。
    return (
      `Content contains potential secrets (${labels}) and cannot be written to team memory. ` +
      'Team memory is shared with all repository collaborators. ' +
      'Remove the sensitive content and try again.'
    )
  }
  // 返回 `null`，作为服务层 team Mem Secret Guard这次计算的结果。
  return null
}

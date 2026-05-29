// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open, stat } from 'fs/promises'
// 接入 CLAUDE_CODE_GUIDE_AGENT_TYPE 工具实现，后续工具池会按权限和开关决定是否暴露。
import { CLAUDE_CODE_GUIDE_AGENT_TYPE } from 'src/tools/AgentTool/built-in/claudeCodeGuideAgent.js'
// 复用 getSettingsFilePathForSource 工具函数，把通用处理留在 src/utils/settings/settings.js 中维护。
import { getSettingsFilePathForSource } from 'src/utils/settings/settings.js'
// 复用 enableDebugLogging、getDebugLogPath 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { enableDebugLogging, getDebugLogPath } from '../../utils/debug.js'
// 复用 errorMessage、isENOENT 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage, isENOENT } from '../../utils/errors.js'
// 复用 formatFileSize 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatFileSize } from '../../utils/format.js'
// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

// DEFAULT_DEBUG_LINES_READ保存`20`，供后续判断或组装使用。
const DEFAULT_DEBUG_LINES_READ = 20
// TAIL_READ_BYTES 集合 命名 `64 * 1024`，让后续代码直接表达这个值的用途。
const TAIL_READ_BYTES = 64 * 1024

// registerDebugSkill 封装debug的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerDebugSkill(): void {
  // 调用 registerBundledSkill，触发debug此处需要的副作用。
  registerBundledSkill({
    name: 'debug',
    description:
      process.env.USER_TYPE === 'ant'
        ? 'Debug your current Claude Code session by reading the session debug log. Includes all event logging'
        : 'Enable debug logging for this session and help diagnose issues',
    allowedTools: ['Read', 'Grep', 'Glob'],
    argumentHint: '[issue description]',
    // disableModelInvocation so that the user has to explicitly request it in
    // interactive mode and so the description does not take up context.
    disableModelInvocation: true,
    userInvocable: true,
    // getPromptForCommand 根据 args 读取或计算debug需要的结果。
    async getPromptForCommand(args) {
      // Non-ants don't write debug logs by default — turn logging on now so
      // subsequent activity in this session is captured.
      // wasAlreadyLogging保存`enableDebugLogging`，供debug后续处理使用。
      const wasAlreadyLogging = enableDebugLogging()
      // debugLogPath 路径数据读取`getDebugLogPath`，供debug后续处理使用。
      const debugLogPath = getDebugLogPath()

      // logInfo 先占位，稍后的条件分支会根据实际输入补齐它。
      let logInfo: string
      // 保护这一段可能失败的debug操作，确保异常能进入相邻错误处理。
      try {
        // Tail the log without reading the whole thing - debug logs grow
        // unbounded in long sessions and reading them in full spikes RSS.
        // stats 集合保存`stat`，供debug后续处理使用。
        const stats = await stat(debugLogPath)
        // readSize保存`Math.min`，供debug后续处理使用。
        const readSize = Math.min(stats.size, TAIL_READ_BYTES)
        // startOffset读取`stats.size - readSize`，供后续判断或组装使用。
        const startOffset = stats.size - readSize
        // fd保存`open`，供debug后续处理使用。
        const fd = await open(debugLogPath, 'r')
        // 保护这一段可能失败的debug操作，确保异常能进入相邻错误处理。
        try {
          // 从 `await fd.read({` 解构 buffer、bytesRead，减少debug对同一对象的重复访问。
          const { buffer, bytesRead } = await fd.read({
            buffer: Buffer.alloc(readSize),
            position: startOffset,
          })
          // tail 命名 `buffer`，让后续代码直接表达这个值的用途。
          const tail = buffer
            .toString('utf-8', 0, bytesRead)
            .split('\n')
            .slice(-DEFAULT_DEBUG_LINES_READ)
            .join('\n')
          // logInfo更新为 ``Log size: ${formatFileSize(stats.size)}\n\n### Last ${DE...`，确保debug后续读取最新状态。
          logInfo = `Log size: ${formatFileSize(stats.size)}\n\n### Last ${DEFAULT_DEBUG_LINES_READ} lines\n\n\`\`\`\n${tail}\n\`\`\``
        } finally {
          // 等待 `fd.close()` 完成，再继续debug的异步流程。
          await fd.close()
        }
      } catch (e) {
        // logInfo更新为 `isENOENT(e)`，确保debug后续读取最新状态。
        logInfo = isENOENT(e)
          ? 'No debug log exists yet — logging was just enabled.'
          : `Failed to read last ${DEFAULT_DEBUG_LINES_READ} lines of debug log: ${errorMessage(e)}`
      }

      // justEnabledSection 命名 `wasAlreadyLogging`，让后续代码直接表达这个值的用途。
      const justEnabledSection = wasAlreadyLogging
        ? ''
        : `
## Debug Logging Just Enabled

Debug logging was OFF for this session until now. Nothing prior to this /debug invocation was captured.

Tell the user that debug logging is now active at \`${debugLogPath}\`, ask them to reproduce the issue, then re-read the log. If they can't reproduce, they can also restart with \`claude --debug\` to capture logs from startup.
`

      // 提示词固定为 ``# Debug Skill`，作为debug后续展示或比较的基准。
      const prompt = `# Debug Skill

Help the user debug an issue they're encountering in this current Claude Code session.
${justEnabledSection}
## Session Debug Log

The debug log for the current session is at: \`${debugLogPath}\`

${logInfo}

For additional context, grep for [ERROR] and [WARN] lines across the full file.

## Issue Description

${args || 'The user did not describe a specific issue. Read the debug log and summarize any errors, warnings, or notable issues.'}

## Settings

Remember that settings are in:
* user - ${getSettingsFilePathForSource('userSettings')}
* project - ${getSettingsFilePathForSource('projectSettings')}
* local - ${getSettingsFilePathForSource('localSettings')}

## Instructions

1. Review the user's issue description
2. The last ${DEFAULT_DEBUG_LINES_READ} lines show the debug file format. Look for [ERROR] and [WARN] entries, stack traces, and failure patterns across the file
3. Consider launching the ${CLAUDE_CODE_GUIDE_AGENT_TYPE} subagent to understand the relevant Claude Code features
4. Explain what you found in plain language
5. Suggest concrete fixes or next steps
`
      // 返回列表结果，保留debug已经排好的条目顺序。
      return [{ type: 'text', text: prompt }]
    },
  })
}

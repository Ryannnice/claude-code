// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getKairosActive、setUserMsgOptIn，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getKairosActive, setUserMsgOptIn } from '../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 类型依赖 { ToolUseContext } 来自 ../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../Tool.js'
// 接入 isBriefEntitled 工具实现，后续工具池会按权限和开关决定是否暴露。
import { isBriefEntitled } from '../tools/BriefTool/BriefTool.js'
// 接入 BRIEF_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BRIEF_TOOL_NAME } from '../tools/BriefTool/prompt.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import type {
  Command,
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../types/command.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'

// Zod guards against fat-fingered GB pushes (same pattern as pollConfig.ts /
// cronScheduler.ts). A malformed config falls back to DEFAULT_BRIEF_CONFIG
// entirely rather than being partially trusted.
// briefConfigSchema 配置保存`lazySchema`，供命令处理后续处理使用。
const briefConfigSchema = lazySchema(() =>
  z.object({
    enable_slash_command: z.boolean(),
  }),
)
// BriefConfig 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type BriefConfig = z.infer<ReturnType<typeof briefConfigSchema>>

// DEFAULT_BRIEF_CONFIG 配置 集中保存斜杠命令 brief要一起传递的字段。
const DEFAULT_BRIEF_CONFIG: BriefConfig = {
  enable_slash_command: false,
}

// No TTL — this gate controls slash-command *visibility*, not a kill switch.
// CACHED_MAY_BE_STALE still has one background-update flip (first call kicks
// off fetch; second call sees fresh value), but no additional flips after that.
// The tool-availability gate (tengu_kairos_brief in isBriefEnabled) keeps its
// 5-min TTL because that one IS a kill switch.
// getBriefConfig 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBriefConfig(): BriefConfig {
  // 原始文本读取`getFeatureValue_CACHED_MAY_BE_STALE<unknown>(`，供后续判断或组装使用。
  const raw = getFeatureValue_CACHED_MAY_BE_STALE<unknown>(
    'tengu_kairos_brief_config',
    DEFAULT_BRIEF_CONFIG,
  )
  // 解析结果保存`briefConfigSchema`，供命令处理后续处理使用。
  const parsed = briefConfigSchema().safeParse(raw)
  // 返回 `parsed.success ? parsed.data : DEFAULT_BRIEF_CONFIG`，作为命令处理这次计算的结果。
  return parsed.success ? parsed.data : DEFAULT_BRIEF_CONFIG
}

// brief 集中保存命令处理斜杠命令 brief要一起传递的字段。
const brief = {
  type: 'local-jsx',
  name: 'brief',
  description: 'Toggle brief-only mode',
  // 这个回调绑定到 isEnabled: () => {，负责命令处理在该局部场景下的响应。
  isEnabled: () => {
    // 只有 `feature('KAIROS') || feature('KAIROS_BRIEF')` 满足时，命令处理才执行该分支。
    if (feature('KAIROS') || feature('KAIROS_BRIEF')) {
      // 返回 `getBriefConfig().enable_slash_command`，作为命令处理这次计算的结果。
      return getBriefConfig().enable_slash_command
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  },
  immediate: true,
  // 这个回调绑定到 load: () =>，负责命令处理在该局部场景下的响应。
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: ToolUseContext & LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
        // current读取`context.getAppState`，供命令处理后续处理使用。
        const current = context.getAppState().isBriefOnly
        // newState 状态标记命令处理斜杠命令 brief是否启用对应路径。
        const newState = !current

        // Entitlement check only gates the on-transition — off is always
        // allowed so a user whose GB gate flipped mid-session isn't stuck.
        // 只有 `newState && !isBriefEntitled()` 满足时，命令处理才执行该分支。
        if (newState && !isBriefEntitled()) {
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_brief_mode_toggled', {
            enabled: false,
            gated: true,
            source:
              'slash_command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          })
          // 调用 onDone，触发命令处理此处需要的副作用。
          onDone('Brief tool is not enabled for your account', {
            display: 'system',
          })
          // 返回 `null`，作为命令处理这次计算的结果。
          return null
        }

        // Two-way: userMsgOptIn tracks isBriefOnly so the tool is available
        // exactly when brief mode is on. This invalidates prompt cache on
        // each toggle (tool list changes), but a stale tool list is worse —
        // when /brief is enabled mid-session the model was previously left
        // without the tool, emitting plain text the filter hides.
        // setUserMsgOptIn 写入新的状态值，使命令处理后续读取保持一致。
        setUserMsgOptIn(newState)

        // context.setAppState 写入新的状态值，使命令处理后续读取保持一致。
        context.setAppState(prev => {
          // 满足 `prev.isBriefOnly === newState` 时，命令处理执行该分支。
          if (prev.isBriefOnly === newState) return prev
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return { ...prev, isBriefOnly: newState }
        })

        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_brief_mode_toggled', {
          enabled: newState,
          gated: false,
          source:
            'slash_command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })

        // The tool list change alone isn't a strong enough signal mid-session
        // (model may keep emitting plain text from inertia, or keep calling a
        // tool that just vanished). Inject an explicit reminder into the next
        // turn's context so the transition is unambiguous.
        // Skip when Kairos is active: isBriefEnabled() short-circuits on
        // getKairosActive() so the tool never actually leaves the list, and
        // the Kairos system prompt already mandates SendUserMessage.
        // Inline <system-reminder> wrap — importing wrapInSystemReminder from
        // utils/messages.ts pulls constants/xml.ts into the bridge SDK bundle
        // via this module's import chain, tripping the excluded-strings check.
        // metaMessages 消息数据读取`getKairosActive`，供命令处理后续处理使用。
        const metaMessages = getKairosActive()
          ? undefined
          : [
              `<system-reminder>\n${
                newState
                  ? `Brief mode is now enabled. Use the ${BRIEF_TOOL_NAME} tool for all user-facing output — plain text outside it is hidden from the user's view.`
                  : `Brief mode is now disabled. The ${BRIEF_TOOL_NAME} tool is no longer available — reply with plain text.`
              }\n</system-reminder>`,
            ]

        onDone(
          newState ? 'Brief-only mode enabled' : 'Brief-only mode disabled',
          { display: 'system', metaMessages },
        )
        return null
      },
    }),
} satisfies Command

export default brief

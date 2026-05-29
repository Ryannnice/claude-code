// 引入 CLAUDE_OPUS_4_6_CONFIG，将 ../model/configs.js 中已经封装好的能力接到本文件流程里。
import { CLAUDE_OPUS_4_6_CONFIG } from '../model/configs.js'
// 引入 getAPIProvider，将 ../model/providers.js 中已经封装好的能力接到本文件流程里。
import { getAPIProvider } from '../model/providers.js'

// @[MODEL LAUNCH]: Update the fallback model below.
// When the user has never set teammateDefaultModel in /config, new teammates
// use Opus 4.6. Must be provider-aware so Bedrock/Vertex/Foundry customers get
// the correct model ID.
// getHardcodedTeammateModelFallback 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHardcodedTeammateModelFallback(): string {
  // 返回 `CLAUDE_OPUS_4_6_CONFIG[getAPIProvider()]`，作为共享工具这次计算的结果。
  return CLAUDE_OPUS_4_6_CONFIG[getAPIProvider()]
}

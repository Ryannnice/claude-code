// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// Content for the claude-api bundled skill.
// Each .md file is inlined as a string at build time via Bun's text loader.

// 引入 csharpClaudeApi，将 ./claude-api/csharp/claude-api.md 中已经封装好的能力接到本文件流程里。
import csharpClaudeApi from './claude-api/csharp/claude-api.md'
// 引入 curlExamples，将 ./claude-api/curl/examples.md 中已经封装好的能力接到本文件流程里。
import curlExamples from './claude-api/curl/examples.md'
// 引入 goClaudeApi，将 ./claude-api/go/claude-api.md 中已经封装好的能力接到本文件流程里。
import goClaudeApi from './claude-api/go/claude-api.md'
// 引入 javaClaudeApi，将 ./claude-api/java/claude-api.md 中已经封装好的能力接到本文件流程里。
import javaClaudeApi from './claude-api/java/claude-api.md'
// 引入 phpClaudeApi，将 ./claude-api/php/claude-api.md 中已经封装好的能力接到本文件流程里。
import phpClaudeApi from './claude-api/php/claude-api.md'
// 引入 pythonAgentSdkPatterns，将 ./claude-api/python/agent-sdk/patterns.md 中已经封装好的能力接到本文件流程里。
import pythonAgentSdkPatterns from './claude-api/python/agent-sdk/patterns.md'
// 引入 pythonAgentSdkReadme，将 ./claude-api/python/agent-sdk/README.md 中已经封装好的能力接到本文件流程里。
import pythonAgentSdkReadme from './claude-api/python/agent-sdk/README.md'
// 引入 pythonClaudeApiBatches，将 ./claude-api/python/claude-api/batches.md 中已经封装好的能力接到本文件流程里。
import pythonClaudeApiBatches from './claude-api/python/claude-api/batches.md'
// 引入 pythonClaudeApiFilesApi，将 ./claude-api/python/claude-api/files-api.md 中已经封装好的能力接到本文件流程里。
import pythonClaudeApiFilesApi from './claude-api/python/claude-api/files-api.md'
// 引入 pythonClaudeApiReadme，将 ./claude-api/python/claude-api/README.md 中已经封装好的能力接到本文件流程里。
import pythonClaudeApiReadme from './claude-api/python/claude-api/README.md'
// 引入 pythonClaudeApiStreaming，将 ./claude-api/python/claude-api/streaming.md 中已经封装好的能力接到本文件流程里。
import pythonClaudeApiStreaming from './claude-api/python/claude-api/streaming.md'
// 引入 pythonClaudeApiToolUse，将 ./claude-api/python/claude-api/tool-use.md 中已经封装好的能力接到本文件流程里。
import pythonClaudeApiToolUse from './claude-api/python/claude-api/tool-use.md'
// 引入 rubyClaudeApi，将 ./claude-api/ruby/claude-api.md 中已经封装好的能力接到本文件流程里。
import rubyClaudeApi from './claude-api/ruby/claude-api.md'
// 引入 skillPrompt，将 ./claude-api/SKILL.md 中已经封装好的能力接到本文件流程里。
import skillPrompt from './claude-api/SKILL.md'
// 引入 sharedErrorCodes，将 ./claude-api/shared/error-codes.md 中已经封装好的能力接到本文件流程里。
import sharedErrorCodes from './claude-api/shared/error-codes.md'
// 引入 sharedLiveSources，将 ./claude-api/shared/live-sources.md 中已经封装好的能力接到本文件流程里。
import sharedLiveSources from './claude-api/shared/live-sources.md'
// 引入 sharedModels，将 ./claude-api/shared/models.md 中已经封装好的能力接到本文件流程里。
import sharedModels from './claude-api/shared/models.md'
// 引入 sharedPromptCaching，将 ./claude-api/shared/prompt-caching.md 中已经封装好的能力接到本文件流程里。
import sharedPromptCaching from './claude-api/shared/prompt-caching.md'
// 引入 sharedToolUseConcepts，将 ./claude-api/shared/tool-use-concepts.md 中已经封装好的能力接到本文件流程里。
import sharedToolUseConcepts from './claude-api/shared/tool-use-concepts.md'
// 引入 typescriptAgentSdkPatterns，将 ./claude-api/typescript/agent-sdk/patterns.md 中已经封装好的能力接到本文件流程里。
import typescriptAgentSdkPatterns from './claude-api/typescript/agent-sdk/patterns.md'
// 引入 typescriptAgentSdkReadme，将 ./claude-api/typescript/agent-sdk/README.md 中已经封装好的能力接到本文件流程里。
import typescriptAgentSdkReadme from './claude-api/typescript/agent-sdk/README.md'
// 引入 typescriptClaudeApiBatches，将 ./claude-api/typescript/claude-api/batches.md 中已经封装好的能力接到本文件流程里。
import typescriptClaudeApiBatches from './claude-api/typescript/claude-api/batches.md'
// 引入 typescriptClaudeApiFilesApi，将 ./claude-api/typescript/claude-api/files-api.md 中已经封装好的能力接到本文件流程里。
import typescriptClaudeApiFilesApi from './claude-api/typescript/claude-api/files-api.md'
// 引入 typescriptClaudeApiReadme，将 ./claude-api/typescript/claude-api/README.md 中已经封装好的能力接到本文件流程里。
import typescriptClaudeApiReadme from './claude-api/typescript/claude-api/README.md'
// 引入 typescriptClaudeApiStreaming，将 ./claude-api/typescript/claude-api/streaming.md 中已经封装好的能力接到本文件流程里。
import typescriptClaudeApiStreaming from './claude-api/typescript/claude-api/streaming.md'
// 引入 typescriptClaudeApiToolUse，将 ./claude-api/typescript/claude-api/tool-use.md 中已经封装好的能力接到本文件流程里。
import typescriptClaudeApiToolUse from './claude-api/typescript/claude-api/tool-use.md'

// @[MODEL LAUNCH]: Update the model IDs/names below. These are substituted into {{VAR}}
// placeholders in the .md files at runtime before the skill prompt is sent.
// After updating these constants, manually update the two files that still hardcode models:
//   - claude-api/SKILL.md (Current Models pricing table)
//   - claude-api/shared/models.md (full model catalog with legacy versions and alias mappings)
// SKILL_MODEL_VARS 集合 集中保存claude Api Content要一起传递的字段。
export const SKILL_MODEL_VARS = {
  OPUS_ID: 'claude-opus-4-6',
  OPUS_NAME: 'Claude Opus 4.6',
  SONNET_ID: 'claude-sonnet-4-6',
  SONNET_NAME: 'Claude Sonnet 4.6',
  HAIKU_ID: 'claude-haiku-4-5',
  HAIKU_NAME: 'Claude Haiku 4.5',
  // Previous Sonnet ID — used in "do not append date suffixes" example in SKILL.md.
  PREV_SONNET_ID: 'claude-sonnet-4-5',
} satisfies Record<string, string>

// SKILL_PROMPT保存`skillPrompt`，供后续判断或组装使用。
export const SKILL_PROMPT: string = skillPrompt

// SKILL_FILES 文件数据 集中保存claude Api Content要一起传递的字段。
export const SKILL_FILES: Record<string, string> = {
  'csharp/claude-api.md': csharpClaudeApi,
  'curl/examples.md': curlExamples,
  'go/claude-api.md': goClaudeApi,
  'java/claude-api.md': javaClaudeApi,
  'php/claude-api.md': phpClaudeApi,
  'python/agent-sdk/README.md': pythonAgentSdkReadme,
  'python/agent-sdk/patterns.md': pythonAgentSdkPatterns,
  'python/claude-api/README.md': pythonClaudeApiReadme,
  'python/claude-api/batches.md': pythonClaudeApiBatches,
  'python/claude-api/files-api.md': pythonClaudeApiFilesApi,
  'python/claude-api/streaming.md': pythonClaudeApiStreaming,
  'python/claude-api/tool-use.md': pythonClaudeApiToolUse,
  'ruby/claude-api.md': rubyClaudeApi,
  'shared/error-codes.md': sharedErrorCodes,
  'shared/live-sources.md': sharedLiveSources,
  'shared/models.md': sharedModels,
  'shared/prompt-caching.md': sharedPromptCaching,
  'shared/tool-use-concepts.md': sharedToolUseConcepts,
  'typescript/agent-sdk/README.md': typescriptAgentSdkReadme,
  'typescript/agent-sdk/patterns.md': typescriptAgentSdkPatterns,
  'typescript/claude-api/README.md': typescriptClaudeApiReadme,
  'typescript/claude-api/batches.md': typescriptClaudeApiBatches,
  'typescript/claude-api/files-api.md': typescriptClaudeApiFilesApi,
  'typescript/claude-api/streaming.md': typescriptClaudeApiStreaming,
  'typescript/claude-api/tool-use.md': typescriptClaudeApiToolUse,
}

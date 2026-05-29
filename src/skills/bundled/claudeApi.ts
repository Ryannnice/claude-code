// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir } from 'fs/promises'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

// claudeApiContent.js bundles 247KB of .md strings. Lazy-load inside
// getPromptForCommand so they only enter memory when /claude-api is invoked.
// SkillContent 固化claude Api里传递的数据形状，帮助调用方按同一结构读写字段。
type SkillContent = typeof import('./claudeApiContent.js')

// DetectedLanguage 固化claude Api里传递的数据形状，帮助调用方按同一结构读写字段。
type DetectedLanguage =
  | 'python'
  | 'typescript'
  | 'java'
  | 'go'
  | 'ruby'
  | 'csharp'
  | 'php'
  | 'curl'

// LANGUAGE_INDICATORS 集合 集中保存claude Api要一起传递的字段。
const LANGUAGE_INDICATORS: Record<DetectedLanguage, string[]> = {
  python: ['.py', 'requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
  typescript: ['.ts', '.tsx', 'tsconfig.json', 'package.json'],
  java: ['.java', 'pom.xml', 'build.gradle'],
  go: ['.go', 'go.mod'],
  ruby: ['.rb', 'Gemfile'],
  csharp: ['.cs', '.csproj'],
  php: ['.php', 'composer.json'],
  curl: [],
}

// detectLanguage 封装claudeApi的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function detectLanguage(): Promise<DetectedLanguage | null> {
  // cwd读取`getCwd`，供claude Api后续处理使用。
  const cwd = getCwd()
  // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let entries: string[]
  // 保护这一段可能失败的claude Api操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await readdir(cwd)`，确保claudeApi后续读取最新状态。
    entries = await readdir(cwd)
  } catch {
    // 返回 `null`，作为claude Api这次计算的结果。
    return null
  }

  // 循环处理 `const [lang, indicators] of Object.entries(LANGUAGE_INDICATORS`，让claude Api把同类条目按顺序走完。
  for (const [lang, indicators] of Object.entries(LANGUAGE_INDICATORS) as [
    DetectedLanguage,
    string[],
  ][]) {
    // indicators 集合为空时立即返回或跳过，避免claude Api把空集合当成可处理内容。
    if (indicators.length === 0) continue
    // 按顺序遍历 `indicators` 中的indicator，逐个交给claude Api处理。
    for (const indicator of indicators) {
      // 满足 `indicator.startsWith('.')` 时，claude Api执行该分支。
      if (indicator.startsWith('.')) {
        // 满足 `entries.some(e => e.endsWith(indicator))` 时，claude Api执行该分支。
        if (entries.some(e => e.endsWith(indicator))) return lang
      } else {
        // 满足 `entries.includes(indicator)` 时，claude Api执行该分支。
        if (entries.includes(indicator)) return lang
      }
    }
  }
  // 返回 `null`，作为claude Api这次计算的结果。
  return null
}

// getFilesForLanguage 封装claudeApi的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFilesForLanguage(
  lang: DetectedLanguage,
  content: SkillContent,
): string[] {
  // 返回 `Object.keys(content.SKILL_FILES).filter(`，作为claude Api这次计算的结果。
  return Object.keys(content.SKILL_FILES).filter(
    // 路径更新为 `> path.startsWith(`${lang}/`) || path.startsWith('shared/...`，确保claudeApi后续读取最新状态。
    path => path.startsWith(`${lang}/`) || path.startsWith('shared/'),
  )
}

// processContent 封装claudeApi的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function processContent(md: string, content: SkillContent): string {
  // Strip HTML comments. Loop to handle nested comments.
  // out保存`md`，供后续判断或组装使用。
  let out = md
  // prev 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let prev
  // 先执行一次循环体，再按尾部条件决定是否继续claude Api处理。
  do {
    // prev更新为 `out`，确保claudeApi后续读取最新状态。
    prev = out
    // out更新为 `out.replace(/<!--[\s\S]*?-->\n?/g, '')`，确保claudeApi后续读取最新状态。
    out = out.replace(/<!--[\s\S]*?-->\n?/g, '')
  } while (out !== prev)

  // out更新为 `out.replace(`，确保claudeApi后续读取最新状态。
  out = out.replace(
    /\{\{(\w+)\}\}/g,
    // 这个回调绑定到 (match, key: string) =>，负责claude Api在该局部场景下的响应。
    (match, key: string) =>
      (content.SKILL_MODEL_VARS as Record<string, string>)[key] ?? match,
  )
  // 返回 `out`，作为claude Api这次计算的结果。
  return out
}

// buildInlineReference 封装claudeApi的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildInlineReference(
  filePaths: string[],
  content: SkillContent,
): string {
  // sections 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sections: string[] = []
  // 逐项读取 `filePaths.sort()` 中的文件路径，按输入顺序推进claude Api。
  for (const filePath of filePaths.sort()) {
    // md保存`content.SKILL_FILES[filePath]`，供claude Api后续判断或输出使用。
    const md = content.SKILL_FILES[filePath]
    // md缺失时提前走兜底路径，避免claude Api继续依赖无效输入。
    if (!md) continue
    // sections 集合追加新条目，保持收集顺序与输入顺序一致。
    sections.push(
      `<doc path="${filePath}">\n${processContent(md, content).trim()}\n</doc>`,
    )
  }
  // 返回 `sections.join('\n\n')`，作为claude Api这次计算的结果。
  return sections.join('\n\n')
}

// INLINE_READING_GUIDE保存``## Reference Documentation`，作为后续固定文本处理的输入。
const INLINE_READING_GUIDE = `## Reference Documentation

The relevant documentation for your detected language is included below in \`<doc>\` tags. Each tag has a \`path\` attribute showing its original file path. Use this to find the right section:

### Quick Task Reference

**Single text classification/summarization/extraction/Q&A:**
→ Refer to \`{lang}/claude-api/README.md\`

**Chat UI or real-time response display:**
→ Refer to \`{lang}/claude-api/README.md\` + \`{lang}/claude-api/streaming.md\`

**Long-running conversations (may exceed context window):**
→ Refer to \`{lang}/claude-api/README.md\` — see Compaction section

**Prompt caching / optimize caching / "why is my cache hit rate low":**
→ Refer to \`shared/prompt-caching.md\` + \`{lang}/claude-api/README.md\` (Prompt Caching section)

**Function calling / tool use / agents:**
→ Refer to \`{lang}/claude-api/README.md\` + \`shared/tool-use-concepts.md\` + \`{lang}/claude-api/tool-use.md\`

**Batch processing (non-latency-sensitive):**
→ Refer to \`{lang}/claude-api/README.md\` + \`{lang}/claude-api/batches.md\`

**File uploads across multiple requests:**
→ Refer to \`{lang}/claude-api/README.md\` + \`{lang}/claude-api/files-api.md\`

**Agent with built-in tools (file/web/terminal) (Python & TypeScript only):**
→ Refer to \`{lang}/agent-sdk/README.md\` + \`{lang}/agent-sdk/patterns.md\`

**Error handling:**
→ Refer to \`shared/error-codes.md\`

**Latest docs via WebFetch:**
→ Refer to \`shared/live-sources.md\` for URLs`

// buildPrompt 封装claudeApi的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildPrompt(
  lang: DetectedLanguage | null,
  args: string,
  content: SkillContent,
): string {
  // Take the SKILL.md content up to the "Reading Guide" section
  // cleanPrompt保存`processContent`，供claude Api后续处理使用。
  const cleanPrompt = processContent(content.SKILL_PROMPT, content)
  // readingGuideIdx保存`cleanPrompt.indexOf`，供claude Api后续处理使用。
  const readingGuideIdx = cleanPrompt.indexOf('## Reading Guide')
  // basePrompt 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const basePrompt =
    readingGuideIdx !== -1
      ? cleanPrompt.slice(0, readingGuideIdx).trimEnd()
      : cleanPrompt

  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts: string[] = [basePrompt]

  // 满足 `lang` 时，claude Api执行该分支。
  if (lang) {
    // filePaths 路径数据读取`getFilesForLanguage`，供claude Api后续处理使用。
    const filePaths = getFilesForLanguage(lang, content)
    // readingGuide格式化`INLINE_READING_GUIDE.replace`，供claude Api后续处理使用。
    const readingGuide = INLINE_READING_GUIDE.replace(/\{lang\}/g, lang)
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(readingGuide)
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      '---\n\n## Included Documentation\n\n' +
        buildInlineReference(filePaths, content),
    )
  } else {
    // No language detected — include all docs and let the model ask
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(INLINE_READING_GUIDE.replace(/\{lang\}/g, 'unknown'))
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      'No project language was auto-detected. Ask the user which language they are using, then refer to the matching docs below.',
    )
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      '---\n\n## Included Documentation\n\n' +
        buildInlineReference(Object.keys(content.SKILL_FILES), content),
    )
  }

  // Preserve the "When to Use WebFetch" and "Common Pitfalls" sections
  // webFetchIdx保存`cleanPrompt.indexOf`，供claude Api后续处理使用。
  const webFetchIdx = cleanPrompt.indexOf('## When to Use WebFetch')
  // `webFetchIdx` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (webFetchIdx !== -1) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(cleanPrompt.slice(webFetchIdx).trimEnd())
  }

  // 满足 `args` 时，claude Api执行该分支。
  if (args) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`## User Request\n\n${args}`)
  }

  // 返回 `parts.join('\n\n')`，作为claude Api这次计算的结果。
  return parts.join('\n\n')
}

// registerClaudeApiSkill 封装claudeApi的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerClaudeApiSkill(): void {
  // 调用 registerBundledSkill，触发claude Api此处需要的副作用。
  registerBundledSkill({
    name: 'claude-api',
    description:
      'Build apps with the Claude API or Anthropic SDK.\n' +
      'TRIGGER when: code imports `anthropic`/`@anthropic-ai/sdk`/`claude_agent_sdk`, or user asks to use Claude API, Anthropic SDKs, or Agent SDK.\n' +
      'DO NOT TRIGGER when: code imports `openai`/other AI SDK, general programming, or ML/data-science tasks.',
    allowedTools: ['Read', 'Grep', 'Glob', 'WebFetch'],
    userInvocable: true,
    // getPromptForCommand 根据 args 读取或计算claude Api需要的结果。
    async getPromptForCommand(args) {
      // 文本内容保存`import`，供claude Api后续处理使用。
      const content = await import('./claudeApiContent.js')
      // lang读取`detectLanguage`，供claude Api后续处理使用。
      const lang = await detectLanguage()
      // 提示词构建`buildPrompt`，供claude Api后续处理使用。
      const prompt = buildPrompt(lang, args, content)
      // 返回列表结果，保留claude Api已经排好的条目顺序。
      return [{ type: 'text', text: prompt }]
    },
  })
}

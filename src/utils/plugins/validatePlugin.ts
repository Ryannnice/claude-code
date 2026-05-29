// 类型依赖 { Dirent, Stats } 来自 fs，用于校准插件管理的数据契约。
import type { Dirent, Stats } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, readFile, stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 errorMessage、getErrnoCode、isENOENT，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, getErrnoCode, isENOENT } from '../errors.js'
// 引入 FRONTMATTER_REGEX，将 ../frontmatterParser.js 中已经封装好的能力接到本文件流程里。
import { FRONTMATTER_REGEX } from '../frontmatterParser.js'
// 引入 jsonParse，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from '../slowOperations.js'
// 引入 parseYaml，将 ../yaml.js 中已经封装好的能力接到本文件流程里。
import { parseYaml } from '../yaml.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  PluginHooksSchema,
  PluginManifestSchema,
  PluginMarketplaceEntrySchema,
  PluginMarketplaceSchema,
} from './schemas.js'

/**
 * Fields that belong in marketplace.json entries (PluginMarketplaceEntrySchema)
 * but not plugin.json (PluginManifestSchema). Plugin authors reasonably copy
 * one into the other. Surfaced as warnings by `claude plugin validate` since
 * they're a known confusion point — the load path silently strips all unknown
 * keys via zod's default behavior, so they're harmless at runtime but worth
 * flagging to authors.
 */
// MARKETPLACE_ONLY_MANIFEST_FIELDS 市场数据保存`Set`，供插件管理后续处理使用。
const MARKETPLACE_ONLY_MANIFEST_FIELDS = new Set([
  'category',
  'source',
  'tags',
  'strict',
  'id',
])

// ValidationResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ValidationResult = {
  success: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  filePath: string
  fileType: 'plugin' | 'marketplace' | 'skill' | 'agent' | 'command' | 'hooks'
}

// ValidationError 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ValidationError = {
  path: string
  message: string
  code?: string
}

// ValidationWarning 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ValidationWarning = {
  path: string
  message: string
}

/**
 * Detect whether a file is a plugin manifest or marketplace manifest
 */
// detectManifestType 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectManifestType(
  filePath: string,
): 'plugin' | 'marketplace' | 'unknown' {
  // fileName 文件数据保存`path.basename`，供插件管理后续处理使用。
  const fileName = path.basename(filePath)
  // dirName保存`path.basename`，供插件管理后续处理使用。
  const dirName = path.basename(path.dirname(filePath))

  // Check filename patterns
  // 当 `fileName` 匹配 `'plugin.json'` 时，插件管理执行对应分支。
  if (fileName === 'plugin.json') return 'plugin'
  // 当 `fileName` 匹配 `'marketplace.json'` 时，插件管理执行对应分支。
  if (fileName === 'marketplace.json') return 'marketplace'

  // Check if it's in .claude-plugin directory
  // 当 `dirName` 匹配 `'.claude-plugin'` 时，插件管理执行对应分支。
  if (dirName === '.claude-plugin') {
    // 返回 `'plugin' // Most likely plugin.json`，作为插件管理这次计算的结果。
    return 'plugin' // Most likely plugin.json
  }

  // 返回 `'unknown'`，作为插件管理这次计算的结果。
  return 'unknown'
}

/**
 * Format Zod validation errors into a readable format
 */
// formatZodErrors 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatZodErrors(zodError: z.ZodError): ValidationError[] {
  // 返回 `zodError.issues.map(error => ({`，作为插件管理这次计算的结果。
  return zodError.issues.map(error => ({
    path: error.path.join('.') || 'root',
    message: error.message,
    code: error.code,
  }))
}

/**
 * Check for parent-directory segments ('..') in a path string.
 *
 * For plugin.json component paths this is a security concern (escaping the plugin dir).
 * For marketplace.json source paths it's almost always a resolution-base misunderstanding:
 * paths resolve from the marketplace repo root, not from marketplace.json itself, so the
 * '..' a user added to "climb out of .claude-plugin/" is unnecessary. Callers pass `hint`
 * to attach the right explanation.
 */
// checkPathTraversal 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkPathTraversal(
  p: string,
  field: string,
  errors: ValidationError[],
  hint?: string,
): void {
  // 满足 `p.includes('..')` 时，插件管理执行该分支。
  if (p.includes('..')) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({
      path: field,
      message: hint
        ? `Path contains "..": ${p}. ${hint}`
        : `Path contains ".." which could be a path traversal attempt: ${p}`,
    })
  }
}

// Shown when a marketplace plugin source contains '..'. Most users hit this because
// they expect paths to resolve relative to marketplace.json (inside .claude-plugin/),
// but resolution actually starts at the marketplace repo root — see gh-29485.
// Computes a tailored "use X instead of Y" suggestion from the user's actual path
// rather than a hardcoded example (review feedback on #20895).
// marketplaceSourceHint 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function marketplaceSourceHint(p: string): string {
  // Strip leading ../ segments: the '..' a user added to "climb out of
  // .claude-plugin/" is unnecessary since paths already start at the repo root.
  // If '..' appears mid-path (rare), fall back to a generic example.
  // stripped格式化`p.replace`，供插件管理后续处理使用。
  const stripped = p.replace(/^(\.\.\/)+/, '')
  // corrected标记插件工具 validate Plugin是否启用对应路径。
  const corrected = stripped !== p ? `./${stripped}` : './plugins/my-plugin'
  // 返回 `(`，作为插件管理这次计算的结果。
  return (
    'Plugin source paths are resolved relative to the marketplace root (the directory ' +
    'containing .claude-plugin/), not relative to marketplace.json. ' +
    `Use "${corrected}" instead of "${p}".`
  )
}

/**
 * Validate a plugin manifest file (plugin.json)
 */
// validatePluginManifest 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validatePluginManifest(
  filePath: string,
): Promise<ValidationResult> {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: ValidationError[] = []
  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: ValidationWarning[] = []
  // absolutePath 路径数据读取`path.resolve`，供插件管理后续处理使用。
  const absolutePath = path.resolve(filePath)

  // Read file content — handle ENOENT / EISDIR / permission errors directly
  // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
  let content: string
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容更新为 `await readFile(absolutePath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
    content = await readFile(absolutePath, { encoding: 'utf-8' })
  } catch (error: unknown) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(error)
    // 消息 先占位，稍后的条件分支会根据实际输入补齐它。
    let message: string
    // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
    if (code === 'ENOENT') {
      // 消息更新为 ``File not found: ${absolutePath}``，确保插件工具后续读取最新状态。
      message = `File not found: ${absolutePath}`
    // 插件工具 validate Plugin在这里处理 `} else if (code === 'EISDIR') {`，完成这一小步状态转换。
    } else if (code === 'EISDIR') {
      // 消息更新为 ``Path is not a file: ${absolutePath}``，确保插件工具后续读取最新状态。
      message = `Path is not a file: ${absolutePath}`
    } else {
      // 消息更新为 ``Failed to read file: ${errorMessage(error)}``，确保插件工具后续读取最新状态。
      message = `Failed to read file: ${errorMessage(error)}`
    }
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: false,
      errors: [{ path: 'file', message, code }],
      warnings: [],
      filePath: absolutePath,
      fileType: 'plugin',
    }
  }

  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed: unknown
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `jsonParse(content)`，确保插件工具后续读取最新状态。
    parsed = jsonParse(content)
  } catch (error) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: false,
      errors: [
        {
          path: 'json',
          message: `Invalid JSON syntax: ${errorMessage(error)}`,
        },
      ],
      warnings: [],
      filePath: absolutePath,
      fileType: 'plugin',
    }
  }

  // Check for path traversal in the parsed JSON before schema validation
  // This ensures we catch security issues even if schema validation fails
  // 当 `parsed && typeof parsed` 匹配 `'object'` 时，插件管理执行对应分支。
  if (parsed && typeof parsed === 'object') {
    // obj 命名 `parsed as Record<string, unknown>`，让后续代码直接表达这个值的用途。
    const obj = parsed as Record<string, unknown>

    // Check commands
    // 满足 `obj.commands` 时，插件管理执行该分支。
    if (obj.commands) {
      // commands 命令数据保存`Array.isArray`，供插件管理后续处理使用。
      const commands = Array.isArray(obj.commands)
        ? obj.commands
        : [obj.commands]
      // 调用 commands.forEach，触发插件管理此处需要的副作用。
      commands.forEach((cmd, i) => {
        // 当 `typeof cmd` 匹配 `'string'` 时，插件管理执行对应分支。
        if (typeof cmd === 'string') {
          // 调用 checkPathTraversal，触发插件管理此处需要的副作用。
          checkPathTraversal(cmd, `commands[${i}]`, errors)
        }
      })
    }

    // Check agents
    // 满足 `obj.agents` 时，插件管理执行该分支。
    if (obj.agents) {
      // agents 集合保存`Array.isArray`，供插件管理后续处理使用。
      const agents = Array.isArray(obj.agents) ? obj.agents : [obj.agents]
      // 调用 agents.forEach，触发插件管理此处需要的副作用。
      agents.forEach((agent, i) => {
        // 当 `typeof agent` 匹配 `'string'` 时，插件管理执行对应分支。
        if (typeof agent === 'string') {
          // 调用 checkPathTraversal，触发插件管理此处需要的副作用。
          checkPathTraversal(agent, `agents[${i}]`, errors)
        }
      })
    }

    // Check skills
    // 满足 `obj.skills` 时，插件管理执行该分支。
    if (obj.skills) {
      // skills 集合保存`Array.isArray`，供插件管理后续处理使用。
      const skills = Array.isArray(obj.skills) ? obj.skills : [obj.skills]
      // 调用 skills.forEach，触发插件管理此处需要的副作用。
      skills.forEach((skill, i) => {
        // 当 `typeof skill` 匹配 `'string'` 时，插件管理执行对应分支。
        if (typeof skill === 'string') {
          // 调用 checkPathTraversal，触发插件管理此处需要的副作用。
          checkPathTraversal(skill, `skills[${i}]`, errors)
        }
      })
    }
  }

  // Surface marketplace-only fields as a warning BEFORE validation flags
  // them. `claude plugin validate` is a developer tool — authors running it
  // want to know these fields don't belong here. But it's a warning, not an
  // error: the plugin loads fine at runtime (the base schema strips unknown
  // keys). We strip them here so the .strict() call below doesn't double-
  // report them as unrecognized-key errors on top of the targeted warnings.
  // toValidate解析`parsed`，供后续判断或组装使用。
  let toValidate = parsed
  // `typeof parsed === 'object' && parsed` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof parsed === 'object' && parsed !== null) {
    // obj 命名 `parsed as Record<string, unknown>`，让后续代码直接表达这个值的用途。
    const obj = parsed as Record<string, unknown>
    // strayKeys 集合派生`Object.keys`，供插件管理后续处理使用。
    const strayKeys = Object.keys(obj).filter(k =>
      MARKETPLACE_ONLY_MANIFEST_FIELDS.has(k),
    )
    // 满足 `strayKeys.length > 0` 时，插件管理执行该分支。
    if (strayKeys.length > 0) {
      // stripped 集中保存插件工具 validate Plugin要一起传递的字段。
      const stripped = { ...obj }
      // 按顺序遍历 `strayKeys` 中的key，逐个交给插件管理处理。
      for (const key of strayKeys) {
        // 插件工具 validate Plugin在这里处理 `delete stripped[key]`，完成这一小步状态转换。
        delete stripped[key]
        // 警告列表追加新条目，保持收集顺序与输入顺序一致。
        warnings.push({
          path: key,
          message:
            `Field '${key}' belongs in the marketplace entry (marketplace.json), ` +
            `not plugin.json. It's harmless here but unused — Claude Code ` +
            `ignores it at load time.`,
        })
      }
      // toValidate更新为 `stripped`，确保插件工具后续读取最新状态。
      toValidate = stripped
    }
  }

  // Validate against schema (post-strip, so marketplace fields don't fail it).
  // We call .strict() locally here even though the base schema is lenient —
  // the runtime load path silently strips unknown keys for resilience, but
  // this is a developer tool and authors running it want typo feedback.
  // 结果保存`PluginManifestSchema`，供插件管理后续处理使用。
  const result = PluginManifestSchema().strict().safeParse(toValidate)

  // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!result.success) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push(...formatZodErrors(result.error))
  }

  // Check for common issues and add warnings
  // 满足 `result.success` 时，插件管理执行该分支。
  if (result.success) {
    // manifest保存`result.data`，供插件工具 validate Plugin后续判断或输出使用。
    const manifest = result.data

    // Warn if name isn't strict kebab-case. CC's schema only rejects spaces,
    // but the Claude.ai marketplace sync rejects non-kebab names. Surfacing
    // this here lets authors catch it in CI before the sync fails on them.
    // 满足 `!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name)` 时，插件管理执行该分支。
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name)) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        path: 'name',
        message:
          `Plugin name "${manifest.name}" is not kebab-case. Claude Code accepts ` +
          `it, but the Claude.ai marketplace sync requires kebab-case ` +
          `(lowercase letters, digits, and hyphens only, e.g., "my-plugin").`,
      })
    }

    // Warn if no version specified
    // manifest.version缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!manifest.version) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        path: 'version',
        message:
          'No version specified. Consider adding a version following semver (e.g., "1.0.0")',
      })
    }

    // Warn if no description
    // manifest.description缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!manifest.description) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        path: 'description',
        message:
          'No description provided. Adding a description helps users understand what your plugin does',
      })
    }

    // Warn if no author
    // manifest.author缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!manifest.author) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        path: 'author',
        message:
          'No author information provided. Consider adding author details for plugin attribution',
      })
    }
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    success: errors.length === 0,
    errors,
    warnings,
    filePath: absolutePath,
    fileType: 'plugin',
  }
}

/**
 * Validate a marketplace manifest file (marketplace.json)
 */
// validateMarketplaceManifest 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateMarketplaceManifest(
  filePath: string,
): Promise<ValidationResult> {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: ValidationError[] = []
  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: ValidationWarning[] = []
  // absolutePath 路径数据读取`path.resolve`，供插件管理后续处理使用。
  const absolutePath = path.resolve(filePath)

  // Read file content — handle ENOENT / EISDIR / permission errors directly
  // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
  let content: string
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容更新为 `await readFile(absolutePath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
    content = await readFile(absolutePath, { encoding: 'utf-8' })
  } catch (error: unknown) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(error)
    // 消息 先占位，稍后的条件分支会根据实际输入补齐它。
    let message: string
    // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
    if (code === 'ENOENT') {
      // 消息更新为 ``File not found: ${absolutePath}``，确保插件工具后续读取最新状态。
      message = `File not found: ${absolutePath}`
    // 插件工具 validate Plugin在这里处理 `} else if (code === 'EISDIR') {`，完成这一小步状态转换。
    } else if (code === 'EISDIR') {
      // 消息更新为 ``Path is not a file: ${absolutePath}``，确保插件工具后续读取最新状态。
      message = `Path is not a file: ${absolutePath}`
    } else {
      // 消息更新为 ``Failed to read file: ${errorMessage(error)}``，确保插件工具后续读取最新状态。
      message = `Failed to read file: ${errorMessage(error)}`
    }
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: false,
      errors: [{ path: 'file', message, code }],
      warnings: [],
      filePath: absolutePath,
      fileType: 'marketplace',
    }
  }

  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed: unknown
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `jsonParse(content)`，确保插件工具后续读取最新状态。
    parsed = jsonParse(content)
  } catch (error) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: false,
      errors: [
        {
          path: 'json',
          message: `Invalid JSON syntax: ${errorMessage(error)}`,
        },
      ],
      warnings: [],
      filePath: absolutePath,
      fileType: 'marketplace',
    }
  }

  // Check for path traversal in plugin sources before schema validation
  // This ensures we catch security issues even if schema validation fails
  // 当 `parsed && typeof parsed` 匹配 `'object'` 时，插件管理执行对应分支。
  if (parsed && typeof parsed === 'object') {
    // obj 命名 `parsed as Record<string, unknown>`，让后续代码直接表达这个值的用途。
    const obj = parsed as Record<string, unknown>

    // 满足 `Array.isArray(obj.plugins)` 时，插件管理执行该分支。
    if (Array.isArray(obj.plugins)) {
      // 调用 obj.plugins.forEach，触发插件管理此处需要的副作用。
      obj.plugins.forEach((plugin: unknown, i: number) => {
        // 当 `plugin && typeof plugin` 匹配 `'object' && 'source'` 时，插件管理执行对应分支。
        if (plugin && typeof plugin === 'object' && 'source' in plugin) {
          // source保存`(plugin as { source: unknown }).source`，供后续判断或组装使用。
          const source = (plugin as { source: unknown }).source
          // Check string sources (relative paths)
          // 当 `typeof source` 匹配 `'string'` 时，插件管理执行对应分支。
          if (typeof source === 'string') {
            // 调用 checkPathTraversal，触发插件管理此处需要的副作用。
            checkPathTraversal(
              source,
              `plugins[${i}].source`,
              errors,
              marketplaceSourceHint(source),
            )
          }
          // Check object-source .path (git-subdir: subdirectory within the
          // remote repo, sparse-cloned). '..' here is a genuine traversal attempt
          // within the remote repo tree, not a marketplace-root misunderstanding —
          // keep the security framing (no marketplaceSourceHint). See #20895 review.
          // 插件管理在这里按实际状态进入对应分支。
          if (
            source &&
            typeof source === 'object' &&
            'path' in source &&
            typeof (source as { path: unknown }).path === 'string'
          ) {
            // 调用 checkPathTraversal，触发插件管理此处需要的副作用。
            checkPathTraversal(
              (source as { path: string }).path,
              `plugins[${i}].source.path`,
              errors,
            )
          }
        }
      })
    }
  }

  // Validate against schema.
  // The base schemas are lenient (strip unknown keys) for runtime resilience,
  // but this is a developer tool — authors want typo feedback. We rebuild the
  // schema with .strict() here. Note .strict() on the outer object does NOT
  // propagate into z.array() elements, so we also override the plugins array
  // with strict entries to catch typos inside individual plugin entries too.
  // strictMarketplaceSchema 市场数据保存`PluginMarketplaceSchema`，供插件管理后续处理使用。
  const strictMarketplaceSchema = PluginMarketplaceSchema()
    .extend({
      plugins: z.array(PluginMarketplaceEntrySchema().strict()),
    })
    .strict()
  // 结果保存`strictMarketplaceSchema.safeParse`，供插件管理后续处理使用。
  const result = strictMarketplaceSchema.safeParse(parsed)

  // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!result.success) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push(...formatZodErrors(result.error))
  }

  // Check for common issues and add warnings
  // 满足 `result.success` 时，插件管理执行该分支。
  if (result.success) {
    // marketplace 市场数据 命名 `result.data`，让后续代码直接表达这个值的用途。
    const marketplace = result.data

    // Warn if no plugins
    // 只有 `!marketplace.plugins || marketplace.plugins.lengt` 满足时，插件管理才执行该分支。
    if (!marketplace.plugins || marketplace.plugins.length === 0) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        path: 'plugins',
        message: 'Marketplace has no plugins defined',
      })
    }

    // Check each plugin entry
    // 满足 `marketplace.plugins` 时，插件管理执行该分支。
    if (marketplace.plugins) {
      // 调用 marketplace.plugins.forEach，触发插件管理此处需要的副作用。
      marketplace.plugins.forEach((plugin, i) => {
        // Check for duplicate plugin names
        // duplicates 集合筛选`plugins.filter`，供插件管理后续处理使用。
        const duplicates = marketplace.plugins.filter(
          // p更新为 `> p.name === plugin.name`，确保插件工具后续读取最新状态。
          p => p.name === plugin.name,
        )
        // 满足 `duplicates.length > 1` 时，插件管理执行该分支。
        if (duplicates.length > 1) {
          // 错误列表追加新条目，保持收集顺序与输入顺序一致。
          errors.push({
            path: `plugins[${i}].name`,
            message: `Duplicate plugin name "${plugin.name}" found in marketplace`,
          })
        }
      })

      // Version-mismatch check: for local-source entries that declare a
      // version, compare against the plugin's own plugin.json. At install
      // time, calculatePluginVersion (pluginVersioning.ts) prefers the
      // manifest version and silently ignores the entry version — so a
      // stale entry.version is invisible user confusion (marketplace UI
      // shows one version, /status shows another after install).
      // Only local sources: remote sources would need cloning to check.
      // manifestDir保存`path.dirname`，供插件管理后续处理使用。
      const manifestDir = path.dirname(absolutePath)
      // marketplaceRoot 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const marketplaceRoot =
        path.basename(manifestDir) === '.claude-plugin'
          ? path.dirname(manifestDir)
          : manifestDir
      // 循环处理 `const [i, entry] of marketplace.plugins.entries()`，让插件管理把同类条目按顺序走完。
      for (const [i, entry] of marketplace.plugins.entries()) {
        // 插件管理在这里按实际状态进入对应分支。
        if (
          !entry.version ||
          typeof entry.source !== 'string' ||
          !entry.source.startsWith('./')
        ) {
          // 跳过当前项，继续处理插件管理中的下一轮循环。
          continue
        }
        // pluginJsonPath 插件数据格式化`path.join`，供插件管理后续处理使用。
        const pluginJsonPath = path.join(
          marketplaceRoot,
          entry.source,
          '.claude-plugin',
          'plugin.json',
        )
        // manifestVersion 先占位，稍后的条件分支会根据实际输入补齐它。
        let manifestVersion: string | undefined
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // 原始文本读取`readFile`，供插件管理后续处理使用。
          const raw = await readFile(pluginJsonPath, { encoding: 'utf-8' })
          // 解析结果解析`jsonParse`，供插件管理后续处理使用。
          const parsed = jsonParse(raw) as { version?: unknown }
          // 当 `typeof parsed.version` 匹配 `'string'` 时，插件管理执行对应分支。
          if (typeof parsed.version === 'string') {
            // manifestVersion更新为 `parsed.version`，确保插件工具后续读取最新状态。
            manifestVersion = parsed.version
          }
        } catch {
          // Missing/unreadable plugin.json is someone else's error to report
          // 跳过当前项，继续处理插件管理中的下一轮循环。
          continue
        }
        // `manifestVersion && manifestVersion` 与 `entry.vers` 不一致时刷新派生状态，避免使用过期结果。
        if (manifestVersion && manifestVersion !== entry.version) {
          // 警告列表追加新条目，保持收集顺序与输入顺序一致。
          warnings.push({
            path: `plugins[${i}].version`,
            message:
              `Entry declares version "${entry.version}" but ${entry.source}/.claude-plugin/plugin.json says "${manifestVersion}". ` +
              `At install time, plugin.json wins (calculatePluginVersion precedence) — the entry version is silently ignored. ` +
              `Update this entry to "${manifestVersion}" to match.`,
          })
        }
      }
    }

    // Warn if no description in metadata
    // 满足 `!marketplace.metadata?.description` 时，插件管理执行该分支。
    if (!marketplace.metadata?.description) {
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push({
        path: 'metadata.description',
        message:
          'No marketplace description provided. Adding a description helps users understand what this marketplace offers',
      })
    }
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    success: errors.length === 0,
    errors,
    warnings,
    filePath: absolutePath,
    fileType: 'marketplace',
  }
}
/**
 * Validate the YAML frontmatter in a plugin component markdown file.
 *
 * The runtime loader (parseFrontmatter) silently drops unparseable YAML to a
 * debug log and returns an empty object. That's the right resilience choice
 * for the load path, but authors running `claude plugin validate` want a hard
 * signal. This re-parses the frontmatter block and surfaces what the loader
 * would silently swallow.
 */
// validateComponentFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateComponentFile(
  filePath: string,
  content: string,
  fileType: 'skill' | 'agent' | 'command',
): ValidationResult {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: ValidationError[] = []
  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: ValidationWarning[] = []

  // match匹配`content.match`，供插件管理后续处理使用。
  const match = content.match(FRONTMATTER_REGEX)
  // match缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!match) {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      path: 'frontmatter',
      message:
        'No frontmatter block found. Add YAML frontmatter between --- delimiters ' +
        'at the top of the file to set description and other metadata.',
    })
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { success: true, errors, warnings, filePath, fileType }
  }

  // frontmatterText标记插件工具 validate Plugin是否启用对应路径。
  const frontmatterText = match[1] || ''
  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed: unknown
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `parseYaml(frontmatterText)`，确保插件工具后续读取最新状态。
    parsed = parseYaml(frontmatterText)
  } catch (e) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({
      path: 'frontmatter',
      message:
        `YAML frontmatter failed to parse: ${errorMessage(e)}. ` +
        `At runtime this ${fileType} loads with empty metadata (all frontmatter ` +
        `fields silently dropped).`,
    })
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { success: false, errors, warnings, filePath, fileType }
  }

  // `parsed === null || typeof parsed` 与 `'object' || Array.isArray(parse...` 不一致时刷新派生状态，避免使用过期结果。
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({
      path: 'frontmatter',
      message:
        'Frontmatter must be a YAML mapping (key: value pairs), got ' +
        `${Array.isArray(parsed) ? 'an array' : parsed === null ? 'null' : typeof parsed}.`,
    })
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { success: false, errors, warnings, filePath, fileType }
  }

  // fm解析`parsed as Record<string, unknown>`，供后续判断或组装使用。
  const fm = parsed as Record<string, unknown>

  // description: must be scalar. coerceDescriptionToString logs+drops arrays/objects at runtime.
  // `fm.description` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (fm.description !== undefined) {
    // d保存`fm.description`，供后续判断或组装使用。
    const d = fm.description
    // 插件管理在这里按实际状态进入对应分支。
    if (
      typeof d !== 'string' &&
      typeof d !== 'number' &&
      typeof d !== 'boolean' &&
      d !== null
    ) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        path: 'description',
        message:
          `description must be a string, got ${Array.isArray(d) ? 'array' : typeof d}. ` +
          `At runtime this value is dropped.`,
      })
    }
  } else {
    // 警告列表追加新条目，保持收集顺序与输入顺序一致。
    warnings.push({
      path: 'description',
      message:
        `No description in frontmatter. A description helps users and Claude ` +
        `understand when to use this ${fileType}.`,
    })
  }

  // name: if present, must be a string (skills/commands use it as displayName;
  // plugin agents use it as the agentType stem — non-strings would stringify to garbage)
  // 插件管理在这里按实际状态进入对应分支。
  if (
    fm.name !== undefined &&
    fm.name !== null &&
    typeof fm.name !== 'string'
  ) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({
      path: 'name',
      message: `name must be a string, got ${typeof fm.name}.`,
    })
  }

  // allowed-tools: string or array of strings
  // at 命名 `fm['allowed-tools']`，让后续代码直接表达这个值的用途。
  const at = fm['allowed-tools']
  // `at` 与 `undefined && at !== null` 不一致时刷新派生状态，避免使用过期结果。
  if (at !== undefined && at !== null) {
    // `typeof at` 与 `'string' && !Array.isArray(at)` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof at !== 'string' && !Array.isArray(at)) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        path: 'allowed-tools',
        message: `allowed-tools must be a string or array of strings, got ${typeof at}.`,
      })
    // 这个回调绑定到 } else if (Array.isArray(at) && at.some(t => typeof t !== 'string')) {，负责插件管理在该局部场景下的响应。
    } else if (Array.isArray(at) && at.some(t => typeof t !== 'string')) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        path: 'allowed-tools',
        message: 'allowed-tools array must contain only strings.',
      })
    }
  }

  // shell: 'bash' | 'powershell' (controls !`cmd` block routing)
  // sh保存`fm.shell`，供插件工具 validate Plugin后续判断或输出使用。
  const sh = fm.shell
  // `sh` 与 `undefined && sh !== null` 不一致时刷新派生状态，避免使用过期结果。
  if (sh !== undefined && sh !== null) {
    // `typeof sh` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof sh !== 'string') {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({
        path: 'shell',
        message: `shell must be a string, got ${typeof sh}.`,
      })
    } else {
      // Normalize to match parseShellFrontmatter() runtime behavior —
      // `shell: PowerShell` should not fail validation but work at runtime.
      // normalized格式化`sh.trim`，供插件管理后续处理使用。
      const normalized = sh.trim().toLowerCase()
      // `normalized` 与 `'bash' && normalized !== 'power...` 不一致时刷新派生状态，避免使用过期结果。
      if (normalized !== 'bash' && normalized !== 'powershell') {
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          path: 'shell',
          message: `shell must be 'bash' or 'powershell', got '${sh}'.`,
        })
      }
    }
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { success: errors.length === 0, errors, warnings, filePath, fileType }
}

/**
 * Validate a plugin's hooks.json file. Unlike frontmatter, this one HARD-ERRORS
 * at runtime (pluginLoader uses .parse() not .safeParse()) — a bad hooks.json
 * breaks the whole plugin. Surfacing it here is essential.
 */
// validateHooksJson 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function validateHooksJson(filePath: string): Promise<ValidationResult> {
  // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
  let content: string
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容更新为 `await readFile(filePath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
    content = await readFile(filePath, { encoding: 'utf-8' })
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(e)
    // ENOENT is fine — hooks are optional
    // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
    if (code === 'ENOENT') {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        success: true,
        errors: [],
        warnings: [],
        filePath,
        fileType: 'hooks',
      }
    }
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: false,
      errors: [
        { path: 'file', message: `Failed to read file: ${errorMessage(e)}` },
      ],
      warnings: [],
      filePath,
      fileType: 'hooks',
    }
  }

  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed: unknown
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `jsonParse(content)`，确保插件工具后续读取最新状态。
    parsed = jsonParse(content)
  } catch (e) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: false,
      errors: [
        {
          path: 'json',
          message:
            `Invalid JSON syntax: ${errorMessage(e)}. ` +
            `At runtime this breaks the entire plugin load.`,
        },
      ],
      warnings: [],
      filePath,
      fileType: 'hooks',
    }
  }

  // 结果保存`PluginHooksSchema`，供插件管理后续处理使用。
  const result = PluginHooksSchema().safeParse(parsed)
  // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!result.success) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: false,
      errors: formatZodErrors(result.error),
      warnings: [],
      filePath,
      fileType: 'hooks',
    }
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    success: true,
    errors: [],
    warnings: [],
    filePath,
    fileType: 'hooks',
  }
}

/**
 * Recursively collect .md files under a directory. Uses withFileTypes to
 * avoid a stat per entry. Returns absolute paths so error messages stay
 * readable.
 */
// collectMarkdown 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function collectMarkdown(
  dir: string,
  isSkillsDir: boolean,
): Promise<string[]> {
  // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let entries: Dirent[]
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await readdir(dir, { withFileTypes: true })`，确保插件工具后续读取最新状态。
    entries = await readdir(dir, { withFileTypes: true })
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(e)
    // 当 `code` 匹配 `'ENOENT' || code === 'ENOTD...` 时，插件管理执行对应分支。
    if (code === 'ENOENT' || code === 'ENOTDIR') return []
    // 抛出 e，阻止插件管理在无效状态下继续运行。
    throw e
  }

  // Skills use <name>/SKILL.md — only descend one level, only collect SKILL.md.
  // Matches the runtime loader: single .md files in skills/ are NOT loaded,
  // and subdirectories of a skill dir aren't scanned. Paths are speculative
  // (the subdir may lack SKILL.md); the caller handles ENOENT.
  // 满足 `isSkillsDir` 时，插件管理执行该分支。
  if (isSkillsDir) {
    // 返回 `entries`，作为插件管理这次计算的结果。
    return entries
      // 链式调用 filter，继续加工上一行在插件管理中产生的数据。
      .filter(e => e.isDirectory())
      // 链式调用 map，继续加工上一行在插件管理中产生的数据。
      .map(e => path.join(dir, e.name, 'SKILL.md'))
  }

  // Commands/agents: recurse and collect all .md files.
  // out 从空数组开始收集，后续循环会按处理顺序追加条目。
  const out: string[] = []
  // 按顺序遍历 `entries` 中的entry，逐个交给插件管理处理。
  for (const entry of entries) {
    // full格式化`path.join`，供插件管理后续处理使用。
    const full = path.join(dir, entry.name)
    // 满足 `entry.isDirectory()` 时，插件管理执行该分支。
    if (entry.isDirectory()) {
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(...(await collectMarkdown(full, false)))
    // 插件工具 validate Plugin在这里处理 `} else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {`，完成这一小步状态转换。
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      // out追加新条目，保持收集顺序与输入顺序一致。
      out.push(full)
    }
  }
  // 返回 `out`，作为插件管理这次计算的结果。
  return out
}

/**
 * Validate the content files inside a plugin directory — skills, agents,
 * commands, and hooks.json. Scans the default component directories (the
 * manifest can declare custom paths but the default layout covers the vast
 * majority of plugins; this is a linter, not a loader).
 *
 * Returns one ValidationResult per file that has errors or warnings. A clean
 * plugin returns an empty array.
 */
// validatePluginContents 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validatePluginContents(
  pluginDir: string,
): Promise<ValidationResult[]> {
  // 结果列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const results: ValidationResult[] = []

  // dirs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const dirs: Array<['skill' | 'agent' | 'command', string]> = [
    ['skill', path.join(pluginDir, 'skills')],
    ['agent', path.join(pluginDir, 'agents')],
    ['command', path.join(pluginDir, 'commands')],
  ]

  // 循环处理 `const [fileType, dir] of dirs`，让插件管理逐项把同类条目按顺序走完。
  for (const [fileType, dir] of dirs) {
    // files 文件数据保存`collectMarkdown`，供插件管理后续处理使用。
    const files = await collectMarkdown(dir, fileType === 'skill')
    // 按顺序遍历 `files` 中的文件路径，逐个交给插件管理处理。
    for (const filePath of files) {
      // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
      let content: string
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容更新为 `await readFile(filePath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
        content = await readFile(filePath, { encoding: 'utf-8' })
      } catch (e: unknown) {
        // ENOENT is expected for speculative skill paths (subdirs without SKILL.md)
        // 满足 `isENOENT(e)` 时，插件管理执行该分支。
        if (isENOENT(e)) continue
        // 结果列表追加新条目，保持收集顺序与输入顺序一致。
        results.push({
          success: false,
          errors: [
            { path: 'file', message: `Failed to read: ${errorMessage(e)}` },
          ],
          warnings: [],
          filePath,
          fileType,
        })
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }
      // r读取`validateComponentFile`，供插件管理后续处理使用。
      const r = validateComponentFile(filePath, content, fileType)
      // 只有 `r.errors.length > 0 || r.warnings.length > 0` 满足时，插件管理才执行该分支。
      if (r.errors.length > 0 || r.warnings.length > 0) {
        // 结果列表追加新条目，保持收集顺序与输入顺序一致。
        results.push(r)
      }
    }
  }

  // hooksResult读取`validateHooksJson`，供插件管理后续处理使用。
  const hooksResult = await validateHooksJson(
    path.join(pluginDir, 'hooks', 'hooks.json'),
  )
  // 只有 `hooksResult.errors.length > 0 || hooksResult.warn` 满足时，插件管理才执行该分支。
  if (hooksResult.errors.length > 0 || hooksResult.warnings.length > 0) {
    // 结果列表追加新条目，保持收集顺序与输入顺序一致。
    results.push(hooksResult)
  }

  // 返回 `results`，作为插件管理这次计算的结果。
  return results
}

/**
 * Validate a manifest file or directory (auto-detects type)
 */
// validateManifest 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateManifest(
  filePath: string,
): Promise<ValidationResult> {
  // absolutePath 路径数据读取`path.resolve`，供插件管理后续处理使用。
  const absolutePath = path.resolve(filePath)

  // Stat path to check if it's a directory — handle ENOENT inline
  // stats 集合 命名 `null`，让后续代码直接表达这个值的用途。
  let stats: Stats | null = null
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合更新为 `await stat(absolutePath)`，确保插件工具后续读取最新状态。
    stats = await stat(absolutePath)
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，插件管理执行该分支。
    if (!isENOENT(e)) {
      // 抛出 e，阻止插件管理在无效状态下继续运行。
      throw e
    }
  }

  // 满足 `stats?.isDirectory()` 时，插件管理执行该分支。
  if (stats?.isDirectory()) {
    // Look for manifest files in .claude-plugin directory
    // Prefer marketplace.json over plugin.json
    // marketplacePath 市场数据格式化`path.join`，供插件管理后续处理使用。
    const marketplacePath = path.join(
      absolutePath,
      '.claude-plugin',
      'marketplace.json',
    )
    // marketplaceResult 市场数据读取`validateMarketplaceManifest`，供插件管理后续处理使用。
    const marketplaceResult = await validateMarketplaceManifest(marketplacePath)
    // Only fall through if the marketplace file was not found (ENOENT)
    // `marketplaceResult.errors[0]?.code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (marketplaceResult.errors[0]?.code !== 'ENOENT') {
      // 返回 `marketplaceResult`，作为插件管理这次计算的结果。
      return marketplaceResult
    }

    // pluginPath 插件数据格式化`path.join`，供插件管理后续处理使用。
    const pluginPath = path.join(absolutePath, '.claude-plugin', 'plugin.json')
    // pluginResult 插件数据读取`validatePluginManifest`，供插件管理后续处理使用。
    const pluginResult = await validatePluginManifest(pluginPath)
    // `pluginResult.errors[0]?.code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (pluginResult.errors[0]?.code !== 'ENOENT') {
      // 返回 `pluginResult`，作为插件管理这次计算的结果。
      return pluginResult
    }

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      success: false,
      errors: [
        {
          path: 'directory',
          message: `No manifest found in directory. Expected .claude-plugin/marketplace.json or .claude-plugin/plugin.json`,
        },
      ],
      warnings: [],
      filePath: absolutePath,
      fileType: 'plugin',
    }
  }

  // manifestType读取`detectManifestType`，供插件管理后续处理使用。
  const manifestType = detectManifestType(filePath)

  // 按照 manifestType 的取值选择插件管理的具体处理分支。
  switch (manifestType) {
    case 'plugin':
      // 返回 `validatePluginManifest(filePath)`，作为插件管理这次计算的结果。
      return validatePluginManifest(filePath)
    case 'marketplace':
      // 返回 `validateMarketplaceManifest(filePath)`，作为插件管理这次计算的结果。
      return validateMarketplaceManifest(filePath)
    case 'unknown': {
      // Try to parse and guess based on content
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容读取`readFile`，供插件管理后续处理使用。
        const content = await readFile(absolutePath, { encoding: 'utf-8' })
        // 解析结果解析`jsonParse`，供插件管理后续处理使用。
        const parsed = jsonParse(content) as Record<string, unknown>

        // Heuristic: if it has a "plugins" array, it's probably a marketplace
        // 满足 `Array.isArray(parsed.plugins)` 时，插件管理执行该分支。
        if (Array.isArray(parsed.plugins)) {
          // 返回 `validateMarketplaceManifest(filePath)`，作为插件管理这次计算的结果。
          return validateMarketplaceManifest(filePath)
        }
      } catch (e: unknown) {
        // code读取`getErrnoCode`，供插件管理后续处理使用。
        const code = getErrnoCode(e)
        // 当 `code` 匹配 `'ENOENT'` 时，插件管理执行对应分支。
        if (code === 'ENOENT') {
          // 返回结构化结果，集中表达插件管理已经整理出的状态。
          return {
            success: false,
            errors: [
              {
                path: 'file',
                message: `File not found: ${absolutePath}`,
              },
            ],
            warnings: [],
            filePath: absolutePath,
            fileType: 'plugin', // Default to plugin for error reporting
          }
        }
        // Fall through to default validation for other errors (e.g., JSON parse)
      }

      // Default: validate as plugin manifest
      // 返回 `validatePluginManifest(filePath)`，作为插件管理这次计算的结果。
      return validatePluginManifest(filePath)
    }
  }
}

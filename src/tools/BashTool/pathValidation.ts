// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { isAbsolute, resolve } from 'path'
// 类型依赖 { z } 来自 zod/v4，用于校准工具调用的数据契约。
import type { z } from 'zod/v4'
// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// 类型依赖 { Redirect, SimpleCommand } 来自 ../../utils/bash/ast.js，用于校准工具调用的数据契约。
import type { Redirect, SimpleCommand } from '../../utils/bash/ast.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  extractOutputRedirections,
  splitCommand_DEPRECATED,
} from '../../utils/bash/commands.js'
// 复用 tryParseShellCommand 工具函数，把通用处理留在 ../../utils/bash/shellQuote.js 中维护。
import { tryParseShellCommand } from '../../utils/bash/shellQuote.js'
// 复用 getDirectoryForPath 工具函数，把通用处理留在 ../../utils/path.js 中维护。
import { getDirectoryForPath } from '../../utils/path.js'
// 复用 allWorkingDirectories 工具函数，把通用处理留在 ../../utils/permissions/filesystem.js 中维护。
import { allWorkingDirectories } from '../../utils/permissions/filesystem.js'
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'
// 复用 createReadRuleSuggestion 工具函数，把通用处理留在 ../../utils/permissions/PermissionUpdate.js 中维护。
import { createReadRuleSuggestion } from '../../utils/permissions/PermissionUpdate.js'
// 类型依赖 { PermissionUpdate } 来自 ../../utils/permissions/PermissionUpdateSchema.js，用于校准工具调用的数据契约。
import type { PermissionUpdate } from '../../utils/permissions/PermissionUpdateSchema.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  expandTilde,
  type FileOperationType,
  formatDirectoryList,
  isDangerousRemovalPath,
  validatePath,
} from '../../utils/permissions/pathValidation.js'
// 类型依赖 { BashTool } 来自 ./BashTool.js，用于校准工具调用的数据契约。
import type { BashTool } from './BashTool.js'
// 引入 stripSafeWrappers，将 ./bashPermissions.js 中已经封装好的能力接到本文件流程里。
import { stripSafeWrappers } from './bashPermissions.js'
// 引入 sedCommandIsAllowedByAllowlist，将 ./sedValidation.js 中已经封装好的能力接到本文件流程里。
import { sedCommandIsAllowedByAllowlist } from './sedValidation.js'

// PathCommand 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type PathCommand =
  | 'cd'
  | 'ls'
  | 'find'
  | 'mkdir'
  | 'touch'
  | 'rm'
  | 'rmdir'
  | 'mv'
  | 'cp'
  | 'cat'
  | 'head'
  | 'tail'
  | 'sort'
  | 'uniq'
  | 'wc'
  | 'cut'
  | 'paste'
  | 'column'
  | 'tr'
  | 'file'
  | 'stat'
  | 'diff'
  | 'awk'
  | 'strings'
  | 'hexdump'
  | 'od'
  | 'base64'
  | 'nl'
  | 'grep'
  | 'rg'
  | 'sed'
  | 'git'
  | 'jq'
  | 'sha256sum'
  | 'sha1sum'
  | 'md5sum'

/**
 * Checks if an rm/rmdir command targets dangerous paths that should always
 * require explicit user approval, even if allowlist rules exist.
 * This prevents catastrophic data loss from commands like `rm -rf /`.
 */
// checkDangerousRemovalPaths 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkDangerousRemovalPaths(
  command: 'rm' | 'rmdir',
  args: string[],
  cwd: string,
): PermissionResult {
  // Extract paths using the existing path extractor
  // extractor保存`PATH_EXTRACTORS[command]`，供Bash 工具 path Validation后续判断或输出使用。
  const extractor = PATH_EXTRACTORS[command]
  // 路径列表保存`extractor`，供工具调用后续处理使用。
  const paths = extractor(args)

  // 按顺序遍历 `paths` 中的路径，逐个交给工具调用处理。
  for (const path of paths) {
    // Expand tilde and resolve to absolute path
    // NOTE: We check the path WITHOUT resolving symlinks, because dangerous paths
    // like /tmp should be caught even though /tmp is a symlink to /private/tmp on macOS
    // cleanPath 路径数据保存`expandTilde`，供工具调用后续处理使用。
    const cleanPath = expandTilde(path.replace(/^['"]|['"]$/g, ''))
    // absolutePath 文件数据保存`isAbsolute`，供工具调用后续处理使用。
    const absolutePath = isAbsolute(cleanPath)
      ? cleanPath
      : resolve(cwd, cleanPath)

    // Check if this is a dangerous path (using the non-symlink-resolved path)
    // 判断 isDangerousRemovalPath(absolutePath)，将工具调用分流到只适用于该条件的处理路径。
    if (isDangerousRemovalPath(absolutePath)) {
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        message: `Dangerous ${command} operation detected: '${absolutePath}'\n\nThis command would remove a critical system directory. This requires explicit approval and cannot be auto-allowed by permission rules.`,
        decisionReason: {
          type: 'other',
          reason: `Dangerous ${command} operation on critical path: ${absolutePath}`,
        },
        // Don't provide suggestions - we don't want to encourage saving dangerous commands
        suggestions: [],
      }
    }
  }

  // No dangerous paths found
  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: `No dangerous removals detected for ${command} command`,
  }
}

/**
 * SECURITY: Extract positional (non-flag) arguments, correctly handling the
 * POSIX `--` end-of-options delimiter.
 *
 * Most commands (rm, cat, touch, etc.) stop parsing options at `--` and treat
 * ALL subsequent arguments as positional, even if they start with `-`. Naive
 * `!arg.startsWith('-')` filtering drops these, causing path validation to be
 * silently skipped for attack payloads like:
 *
 *   rm -- -/../.claude/settings.local.json
 *
 * Here `-/../.claude/settings.local.json` starts with `-` so the naive filter
 * drops it, validation sees zero paths, returns passthrough, and the file is
 * deleted without a prompt. With `--` handling, the path IS extracted and
 * validated (blocked by isClaudeConfigFilePath / pathInAllowedWorkingPath).
 */
// filterOutFlags 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function filterOutFlags(args: string[]): string[] {
  // 结果从空数组开始收集，后续按处理顺序追加条目。
  const result: string[] = []
  // afterDoubleDash记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
  let afterDoubleDash = false
  // 遍历 const arg of args，让工具调用逐项完成同一类处理。
  for (const arg of args) {
    // 满足 `afterDoubleDash` 时，工具调用执行该分支。
    if (afterDoubleDash) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(arg)
    // `arg === '--'` 成立时，Bash 工具 path Validation切换到这个 else-if 分支。
    } else if (arg === '--') {
      // afterDoubleDash更新为 `true`，确保Bash 工具后续读取最新状态。
      afterDoubleDash = true
    // `!arg?.startsWith('-')` 成立时，Bash 工具 path Validation切换到这个 else-if 分支。
    } else if (!arg?.startsWith('-')) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(arg)
    }
  }
  // 返回 result，把工具调用这个分支的结果交还调用方。
  return result
}

// Helper: Parse grep/rg style commands (pattern then paths)
// parsePatternCommand 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function parsePatternCommand(
  args: string[],
  flagsWithArgs: Set<string>,
  defaults: string[] = [],
): string[] {
  // paths 文件数据从空数组开始收集，后续按处理顺序追加条目。
  const paths: string[] = []
  // patternFound记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
  let patternFound = false
  // SECURITY: Track `--` end-of-options delimiter. After `--`, all args are
  // positional regardless of leading `-`. See filterOutFlags() doc comment.
  // afterDoubleDash记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
  let afterDoubleDash = false

  // 遍历 let i = 0; i < args.length; i++，让工具调用逐项完成同一类处理。
  for (let i = 0; i < args.length; i++) {
    // arg保存`args[i]`，供Bash 工具 path Validation后续步骤使用。
    const arg = args[i]
    // 判断 arg === undefined || arg === null，将工具调用分流到只适用于该条件的处理路径。
    if (arg === undefined || arg === null) continue

    // `!afterDoubleDash && arg` 命中特定值 `'--'` 时，进入工具调用对应处理。
    if (!afterDoubleDash && arg === '--') {
      // afterDoubleDash更新为 `true`，确保Bash 工具后续读取最新状态。
      afterDoubleDash = true
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 判断 !afterDoubleDash && arg.startsWith('-')，将工具调用分流到只适用于该条件的处理路径。
    if (!afterDoubleDash && arg.startsWith('-')) {
      // flag格式化`arg.split`，供工具调用后续处理使用。
      const flag = arg.split('=')[0]
      // Pattern flags mark that we've found the pattern
      // 判断 flag && ['-e', '--regexp', '-f', '--file'].includes(flag)，将工具调用分流到只适用于该条件的处理路径。
      if (flag && ['-e', '--regexp', '-f', '--file'].includes(flag)) {
        // patternFound更新为 `true`，确保Bash 工具后续读取最新状态。
        patternFound = true
      }
      // Skip next arg if flag needs it
      // 判断 flag && flagsWithArgs.has(flag) && !arg.includes('=')，将工具调用分流到只适用于该条件的处理路径。
      if (flag && flagsWithArgs.has(flag) && !arg.includes('=')) {
        // Bash 工具 path Validation处理 `i++`，完成这一小步状态转换。
        i++
      }
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // First non-flag is pattern, rest are paths
    // patternFound缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!patternFound) {
      // patternFound更新为 `true`，确保Bash 工具后续读取最新状态。
      patternFound = true
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // paths 文件数据追加新条目，保持收集顺序与输入顺序一致。
    paths.push(arg)
  }

  // 返回 paths.length > 0 ? paths : defaults，把工具调用这个分支的结果交还调用方。
  return paths.length > 0 ? paths : defaults
}

/**
 * Extracts paths from command arguments for different path commands.
 * Each command has specific logic for how it handles paths and flags.
 */
// PATH_EXTRACTORS 文件数据先声明占位，稍后的分支会根据实际输入补齐。
export const PATH_EXTRACTORS: Record<
  PathCommand,
  // 这个回调绑定到 (args: string[]) => string[]，负责工具调用在该局部场景下的响应。
  (args: string[]) => string[]
> = {
  // cd: special case - all args form one path
  // 这个回调绑定到 cd: args => (args.length === 0 ? [homedir()] : [args.join(' ')]),，负责工具调用在该局部场景下的响应。
  cd: args => (args.length === 0 ? [homedir()] : [args.join(' ')]),

  // ls: filter flags, default to current dir
  // 这个回调绑定到 ls: args => {，负责工具调用在该局部场景下的响应。
  ls: args => {
    // paths 文件数据筛选`filterOutFlags`，供工具调用后续处理使用。
    const paths = filterOutFlags(args)
    // 返回 paths.length > 0 ? paths : ['.']，把工具调用这个分支的结果交还调用方。
    return paths.length > 0 ? paths : ['.']
  },

  // find: collect paths until hitting a real flag, also check path-taking flags
  // SECURITY: `find -- -path` makes `-path` a starting point (not a predicate).
  // GNU find supports `--` to allow search roots starting with `-`. After `--`,
  // we conservatively collect all remaining args as paths to validate. This
  // over-includes predicates like `-name foo`, but find is a read-only op and
  // predicates resolve to paths within cwd (allowed), so no false blocks for
  // legitimate use. The over-inclusion ensures attack paths like
  // `find -- -/../../etc` are caught.
  // 这个回调绑定到 find: args => {，负责工具调用在该局部场景下的响应。
  find: args => {
    // paths 文件数据从空数组开始收集，后续按处理顺序追加条目。
    const paths: string[] = []
    // pathFlags 文件数据保存`Set`，供工具调用后续处理使用。
    const pathFlags = new Set([
      '-newer',
      '-anewer',
      '-cnewer',
      '-mnewer',
      '-samefile',
      '-path',
      '-wholename',
      '-ilname',
      '-lname',
      '-ipath',
      '-iwholename',
    ])
    // newerPattern保存`/^-newer[acmBt][acmtB]$/`，供Bash 工具 path Validation后续步骤使用。
    const newerPattern = /^-newer[acmBt][acmtB]$/
    // foundNonGlobalFlag记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
    let foundNonGlobalFlag = false
    // afterDoubleDash记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
    let afterDoubleDash = false

    // 遍历 let i = 0; i < args.length; i++，让工具调用逐项完成同一类处理。
    for (let i = 0; i < args.length; i++) {
      // arg保存`args[i]`，供Bash 工具 path Validation后续步骤使用。
      const arg = args[i]
      // 判断 !arg，将工具调用分流到只适用于该条件的处理路径。
      if (!arg) continue

      // 满足 `afterDoubleDash` 时，工具调用执行该分支。
      if (afterDoubleDash) {
        // paths 文件数据追加新条目，保持收集顺序与输入顺序一致。
        paths.push(arg)
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // `arg` 命中特定值 `'--'` 时，进入工具调用对应处理。
      if (arg === '--') {
        // afterDoubleDash更新为 `true`，确保Bash 工具后续读取最新状态。
        afterDoubleDash = true
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Handle flags
      // 判断 arg.startsWith('-')，将工具调用分流到只适用于该条件的处理路径。
      if (arg.startsWith('-')) {
        // Global options don't stop collection
        // 判断 ['-H', '-L', '-P'].includes(arg)，将工具调用分流到只适用于该条件的处理路径。
        if (['-H', '-L', '-P'].includes(arg)) continue

        // Mark that we've seen a non-global flag
        // foundNonGlobalFlag更新为 `true`，确保Bash 工具后续读取最新状态。
        foundNonGlobalFlag = true

        // Check if this flag takes a path argument
        // 判断 pathFlags.has(arg) || newerPattern.test(arg)，将工具调用分流到只适用于该条件的处理路径。
        if (pathFlags.has(arg) || newerPattern.test(arg)) {
          // nextArg保存`args[i + 1]`，供Bash 工具 path Validation后续步骤使用。
          const nextArg = args[i + 1]
          // 满足 `nextArg` 时，工具调用执行该分支。
          if (nextArg) {
            // paths 文件数据追加新条目，保持收集顺序与输入顺序一致。
            paths.push(nextArg)
            // Bash 工具 path Validation处理 `i++ // Skip the path we just processed`，完成这一小步状态转换。
            i++ // Skip the path we just processed
          }
        }
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Only collect non-flag arguments before first non-global flag
      // foundNonGlobalFlag缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!foundNonGlobalFlag) {
        // paths 文件数据追加新条目，保持收集顺序与输入顺序一致。
        paths.push(arg)
      }
    }
    // 返回 paths.length > 0 ? paths : ['.']，把工具调用这个分支的结果交还调用方。
    return paths.length > 0 ? paths : ['.']
  },

  // All simple commands: just filter out flags
  mkdir: filterOutFlags,
  touch: filterOutFlags,
  rm: filterOutFlags,
  rmdir: filterOutFlags,
  mv: filterOutFlags,
  cp: filterOutFlags,
  cat: filterOutFlags,
  head: filterOutFlags,
  tail: filterOutFlags,
  sort: filterOutFlags,
  uniq: filterOutFlags,
  wc: filterOutFlags,
  cut: filterOutFlags,
  paste: filterOutFlags,
  column: filterOutFlags,
  file: filterOutFlags,
  stat: filterOutFlags,
  diff: filterOutFlags,
  awk: filterOutFlags,
  strings: filterOutFlags,
  hexdump: filterOutFlags,
  od: filterOutFlags,
  base64: filterOutFlags,
  nl: filterOutFlags,
  sha256sum: filterOutFlags,
  sha1sum: filterOutFlags,
  md5sum: filterOutFlags,

  // tr: special case - skip character sets
  // 这个回调绑定到 tr: args => {，负责工具调用在该局部场景下的响应。
  tr: args => {
    // hasDelete筛选`args.some`，供工具调用后续处理使用。
    const hasDelete = args.some(
      // a更新为 `>`，确保Bash 工具后续读取最新状态。
      a =>
        a === '-d' ||
        a === '--delete' ||
        (a.startsWith('-') && a.includes('d')),
    )
    // nonFlags 集合筛选`filterOutFlags`，供工具调用后续处理使用。
    const nonFlags = filterOutFlags(args)
    // 返回 nonFlags.slice(hasDelete ? 1 : 2) // Skip SET1 or SET1+SET2，把工具调用这个分支的结果交还调用方。
    return nonFlags.slice(hasDelete ? 1 : 2) // Skip SET1 or SET1+SET2
  },

  // grep: pattern then paths, defaults to stdin
  // 这个回调绑定到 grep: args => {，负责工具调用在该局部场景下的响应。
  grep: args => {
    // flags 集合保存`Set`，供工具调用后续处理使用。
    const flags = new Set([
      '-e',
      '--regexp',
      '-f',
      '--file',
      '--exclude',
      '--include',
      '--exclude-dir',
      '--include-dir',
      '-m',
      '--max-count',
      '-A',
      '--after-context',
      '-B',
      '--before-context',
      '-C',
      '--context',
    ])
    // paths 文件数据解析`parsePatternCommand`，供工具调用后续处理使用。
    const paths = parsePatternCommand(args, flags)
    // Special: if -r/-R flag present and no paths, use current dir
    // 工具调用在这里按实际状态进入对应分支。
    if (
      paths.length === 0 &&
      // args.some执行工具调用在此处需要的副作用或外部交互。
      args.some(a => ['-r', '-R', '--recursive'].includes(a))
    ) {
      // 返回 ['.']，把工具调用这个分支的结果交还调用方。
      return ['.']
    }
    // 返回 paths，把工具调用这个分支的结果交还调用方。
    return paths
  },

  // rg: pattern then paths, defaults to current dir
  // 这个回调绑定到 rg: args => {，负责工具调用在该局部场景下的响应。
  rg: args => {
    // flags 集合保存`Set`，供工具调用后续处理使用。
    const flags = new Set([
      '-e',
      '--regexp',
      '-f',
      '--file',
      '-t',
      '--type',
      '-T',
      '--type-not',
      '-g',
      '--glob',
      '-m',
      '--max-count',
      '--max-depth',
      '-r',
      '--replace',
      '-A',
      '--after-context',
      '-B',
      '--before-context',
      '-C',
      '--context',
    ])
    // 返回 parsePatternCommand(args, flags, ['.'])，把工具调用这个分支的结果交还调用方。
    return parsePatternCommand(args, flags, ['.'])
  },

  // sed: processes files in-place or reads from stdin
  // 这个回调绑定到 sed: args => {，负责工具调用在该局部场景下的响应。
  sed: args => {
    // paths 文件数据从空数组开始收集，后续按处理顺序追加条目。
    const paths: string[] = []
    // skipNext记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
    let skipNext = false
    // scriptFound记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
    let scriptFound = false
    // SECURITY: Track `--` end-of-options delimiter. After `--`, all args are
    // positional regardless of leading `-`. See filterOutFlags() doc comment.
    // afterDoubleDash记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
    let afterDoubleDash = false

    // 遍历 let i = 0; i < args.length; i++，让工具调用逐项完成同一类处理。
    for (let i = 0; i < args.length; i++) {
      // 满足 `skipNext` 时，工具调用执行该分支。
      if (skipNext) {
        // skipNext更新为 `false`，确保Bash 工具后续读取最新状态。
        skipNext = false
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // arg保存`args[i]`，供Bash 工具 path Validation后续步骤使用。
      const arg = args[i]
      // 判断 !arg，将工具调用分流到只适用于该条件的处理路径。
      if (!arg) continue

      // `!afterDoubleDash && arg` 命中特定值 `'--'` 时，进入工具调用对应处理。
      if (!afterDoubleDash && arg === '--') {
        // afterDoubleDash更新为 `true`，确保Bash 工具后续读取最新状态。
        afterDoubleDash = true
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Handle flags (only before `--`)
      // 判断 !afterDoubleDash && arg.startsWith('-')，将工具调用分流到只适用于该条件的处理路径。
      if (!afterDoubleDash && arg.startsWith('-')) {
        // -f flag: next arg is a script file that needs validation
        // 判断 ['-f', '--file'].includes(arg)，将工具调用分流到只适用于该条件的处理路径。
        if (['-f', '--file'].includes(arg)) {
          // scriptFile 文件数据保存`args[i + 1]`，供Bash 工具 path Validation后续步骤使用。
          const scriptFile = args[i + 1]
          // 满足 `scriptFile` 时，工具调用执行该分支。
          if (scriptFile) {
            // paths 文件数据追加新条目，保持收集顺序与输入顺序一致。
            paths.push(scriptFile) // Add script file to paths for validation
            // skipNext更新为 `true`，确保Bash 工具后续读取最新状态。
            skipNext = true
          }
          // scriptFound更新为 `true`，确保Bash 工具后续读取最新状态。
          scriptFound = true
        }
        // -e flag: next arg is expression, not a file
        else if (['-e', '--expression'].includes(arg)) {
          // skipNext更新为 `true`，确保Bash 工具后续读取最新状态。
          skipNext = true
          // scriptFound更新为 `true`，确保Bash 工具后续读取最新状态。
          scriptFound = true
        }
        // Combined flags like -ie or -nf
        else if (arg.includes('e') || arg.includes('f')) {
          // scriptFound更新为 `true`，确保Bash 工具后续读取最新状态。
          scriptFound = true
        }
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // First non-flag is the script (if not already found via -e/-f)
      // scriptFound缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!scriptFound) {
        // scriptFound更新为 `true`，确保Bash 工具后续读取最新状态。
        scriptFound = true
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Rest are file paths
      // paths 文件数据追加新条目，保持收集顺序与输入顺序一致。
      paths.push(arg)
    }

    // 返回 paths，把工具调用这个分支的结果交还调用方。
    return paths
  },

  // jq: filter then file paths (similar to grep)
  // The jq command structure is: jq [flags] filter [files...]
  // If no files are provided, jq reads from stdin
  // 这个回调绑定到 jq: args => {，负责工具调用在该局部场景下的响应。
  jq: args => {
    // paths 文件数据从空数组开始收集，后续按处理顺序追加条目。
    const paths: string[] = []
    // flagsWithArgs 集合保存`Set`，供工具调用后续处理使用。
    const flagsWithArgs = new Set([
      '-e',
      '--expression',
      '-f',
      '--from-file',
      '--arg',
      '--argjson',
      '--slurpfile',
      '--rawfile',
      '--args',
      '--jsonargs',
      '-L',
      '--library-path',
      '--indent',
      '--tab',
    ])
    // filterFound记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
    let filterFound = false
    // SECURITY: Track `--` end-of-options delimiter. After `--`, all args are
    // positional regardless of leading `-`. See filterOutFlags() doc comment.
    // afterDoubleDash记录当前扫描状态，Bash 工具 path Validation随后按该状态分支。
    let afterDoubleDash = false

    // 遍历 let i = 0; i < args.length; i++，让工具调用逐项完成同一类处理。
    for (let i = 0; i < args.length; i++) {
      // arg保存`args[i]`，供Bash 工具 path Validation后续步骤使用。
      const arg = args[i]
      // 判断 arg === undefined || arg === null，将工具调用分流到只适用于该条件的处理路径。
      if (arg === undefined || arg === null) continue

      // `!afterDoubleDash && arg` 命中特定值 `'--'` 时，进入工具调用对应处理。
      if (!afterDoubleDash && arg === '--') {
        // afterDoubleDash更新为 `true`，确保Bash 工具后续读取最新状态。
        afterDoubleDash = true
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // 判断 !afterDoubleDash && arg.startsWith('-')，将工具调用分流到只适用于该条件的处理路径。
      if (!afterDoubleDash && arg.startsWith('-')) {
        // flag格式化`arg.split`，供工具调用后续处理使用。
        const flag = arg.split('=')[0]
        // Pattern flags mark that we've found the filter
        // 判断 flag && ['-e', '--expression'].includes(flag)，将工具调用分流到只适用于该条件的处理路径。
        if (flag && ['-e', '--expression'].includes(flag)) {
          // filterFound更新为 `true`，确保Bash 工具后续读取最新状态。
          filterFound = true
        }
        // Skip next arg if flag needs it
        // 判断 flag && flagsWithArgs.has(flag) && !arg.includes('=')，将工具调用分流到只适用于该条件的处理路径。
        if (flag && flagsWithArgs.has(flag) && !arg.includes('=')) {
          // Bash 工具 path Validation处理 `i++`，完成这一小步状态转换。
          i++
        }
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // First non-flag is filter, rest are file paths
      // filterFound缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!filterFound) {
        // filterFound更新为 `true`，确保Bash 工具后续读取最新状态。
        filterFound = true
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // paths 文件数据追加新条目，保持收集顺序与输入顺序一致。
      paths.push(arg)
    }

    // If no file paths, jq reads from stdin (no paths to validate)
    // 返回 paths，把工具调用这个分支的结果交还调用方。
    return paths
  },

  // git: handle subcommands that access arbitrary files outside the repository
  // 这个回调绑定到 git: args => {，负责工具调用在该局部场景下的响应。
  git: args => {
    // git diff --no-index is special - it explicitly compares files outside git's control
    // This flag allows git diff to compare any two files on the filesystem, not just
    // files within the repository, which is why it needs path validation
    // `args.length >= 1 && args[0]` 命中特定值 `'diff'` 时，进入工具调用对应处理。
    if (args.length >= 1 && args[0] === 'diff') {
      // 判断 args.includes('--no-index')，将工具调用分流到只适用于该条件的处理路径。
      if (args.includes('--no-index')) {
        // SECURITY: git diff --no-index accepts `--` before file paths.
        // Use filterOutFlags which handles `--` correctly instead of naive
        // startsWith('-') filtering, to catch paths like `-/../etc/passwd`.
        // filePaths 文件数据筛选`filterOutFlags`，供工具调用后续处理使用。
        const filePaths = filterOutFlags(args.slice(1))
        // 返回 filePaths.slice(0, 2) // git diff --no-index expects exactly 2 paths，把工具调用这个分支的结果交还调用方。
        return filePaths.slice(0, 2) // git diff --no-index expects exactly 2 paths
      }
    }
    // Other git commands (add, rm, mv, show, etc.) operate within the repository context
    // and are already constrained by git's own security model, so they don't need
    // additional path validation
    // 返回 []，把工具调用这个分支的结果交还调用方。
    return []
  },
}

// SUPPORTED_PATH_COMMANDS 命令数据派生`Object.keys`，供工具调用后续处理使用。
const SUPPORTED_PATH_COMMANDS = Object.keys(PATH_EXTRACTORS) as PathCommand[]

// ACTION_VERBS 集合集中保存Bash 工具 path Validation要一起传递的字段。
const ACTION_VERBS: Record<PathCommand, string> = {
  cd: 'change directories to',
  ls: 'list files in',
  find: 'search files in',
  mkdir: 'create directories in',
  touch: 'create or modify files in',
  rm: 'remove files from',
  rmdir: 'remove directories from',
  mv: 'move files to/from',
  cp: 'copy files to/from',
  cat: 'concatenate files from',
  head: 'read the beginning of files from',
  tail: 'read the end of files from',
  sort: 'sort contents of files from',
  uniq: 'filter duplicate lines from files in',
  wc: 'count lines/words/bytes in files from',
  cut: 'extract columns from files in',
  paste: 'merge files from',
  column: 'format files from',
  tr: 'transform text from files in',
  file: 'examine file types in',
  stat: 'read file stats from',
  diff: 'compare files from',
  awk: 'process text from files in',
  strings: 'extract strings from files in',
  hexdump: 'display hex dump of files from',
  od: 'display octal dump of files from',
  base64: 'encode/decode files from',
  nl: 'number lines in files from',
  grep: 'search for patterns in files from',
  rg: 'search for patterns in files from',
  sed: 'edit files in',
  git: 'access files with git from',
  jq: 'process JSON from files in',
  sha256sum: 'compute SHA-256 checksums for files in',
  sha1sum: 'compute SHA-1 checksums for files in',
  md5sum: 'compute MD5 checksums for files in',
}

// COMMAND_OPERATION_TYPE 命令数据集中保存Bash 工具 path Validation要一起传递的字段。
export const COMMAND_OPERATION_TYPE: Record<PathCommand, FileOperationType> = {
  cd: 'read',
  ls: 'read',
  find: 'read',
  mkdir: 'create',
  touch: 'create',
  rm: 'write',
  rmdir: 'write',
  mv: 'write',
  cp: 'write',
  cat: 'read',
  head: 'read',
  tail: 'read',
  sort: 'read',
  uniq: 'read',
  wc: 'read',
  cut: 'read',
  paste: 'read',
  column: 'read',
  tr: 'read',
  file: 'read',
  stat: 'read',
  diff: 'read',
  awk: 'read',
  strings: 'read',
  hexdump: 'read',
  od: 'read',
  base64: 'read',
  nl: 'read',
  grep: 'read',
  rg: 'read',
  sed: 'write',
  git: 'read',
  jq: 'read',
  sha256sum: 'read',
  sha1sum: 'read',
  md5sum: 'read',
}

/**
 * Command-specific validators that run before path validation.
 * Returns true if the command is valid, false if it should be rejected.
 * Used to block commands with flags that could bypass path validation.
 */
// COMMAND_VALIDATOR 命令数据先声明占位，稍后的分支会根据实际输入补齐。
const COMMAND_VALIDATOR: Partial<
  // 这个回调绑定到 Record<PathCommand, (args: string[]) => boolean>，负责工具调用在该局部场景下的响应。
  Record<PathCommand, (args: string[]) => boolean>
> = {
  // 这个回调绑定到 mv: (args: string[]) => !args.some(arg => arg?.startsWith('-')),，负责工具调用在该局部场景下的响应。
  mv: (args: string[]) => !args.some(arg => arg?.startsWith('-')),
  // 这个回调绑定到 cp: (args: string[]) => !args.some(arg => arg?.startsWith('-')),，负责工具调用在该局部场景下的响应。
  cp: (args: string[]) => !args.some(arg => arg?.startsWith('-')),
}

// validateCommandPaths 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function validateCommandPaths(
  command: PathCommand,
  args: string[],
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  compoundCommandHasCd?: boolean,
  operationTypeOverride?: FileOperationType,
): PermissionResult {
  // extractor保存`PATH_EXTRACTORS[command]`，供Bash 工具 path Validation后续步骤使用。
  const extractor = PATH_EXTRACTORS[command]
  // paths 文件数据保存`extractor`，供工具调用后续处理使用。
  const paths = extractor(args)
  // operationType保存`operationTypeOverride ?? COMMAND_OPERATION_TYPE[command]`，供Bash 工具 path Validation后续步骤使用。
  const operationType = operationTypeOverride ?? COMMAND_OPERATION_TYPE[command]

  // SECURITY: Check command-specific validators (e.g., to block flags that could bypass path validation)
  // Some commands like mv/cp have flags (--target-directory=PATH) that can bypass path extraction,
  // so we block ALL flags for these commands to ensure security.
  // validator保存`COMMAND_VALIDATOR[command]`，供Bash 工具 path Validation后续步骤使用。
  const validator = COMMAND_VALIDATOR[command]
  // 判断 validator && !validator(args)，将工具调用分流到只适用于该条件的处理路径。
  if (validator && !validator(args)) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: `${command} with flags requires manual approval to ensure path safety. For security, Claude Code cannot automatically validate ${command} commands that use flags, as some flags like --target-directory=PATH can bypass path validation.`,
      decisionReason: {
        type: 'other',
        reason: `${command} command with flags requires manual approval`,
      },
    }
  }

  // SECURITY: Block write operations in compound commands containing 'cd'
  // This prevents bypassing path safety checks via directory changes before operations.
  // Example attack: cd .claude/ && mv test.txt settings.json
  // This would bypass the check for .claude/settings.json because paths are resolved
  // relative to the original CWD, not accounting for the cd's effect.
  //
  // ALTERNATIVE APPROACH: Instead of blocking all writes with cd, we could track the
  // effective CWD through the command chain (e.g., after "cd .claude/", subsequent
  // commands would be validated with CWD=".claude/"). This would be more permissive
  // but requires careful handling of:
  // - Relative paths (cd ../foo)
  // - Special cd targets (cd ~, cd -, cd with no args)
  // - Multiple cd commands in sequence
  // - Error cases where cd target cannot be determined
  // For now, we take the conservative approach of requiring manual approval.
  // `compoundCommandHasCd && operationType` 与 `'read'` 不一致时刷新派生状态。
  if (compoundCommandHasCd && operationType !== 'read') {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: `Commands that change directories and perform write operations require explicit approval to ensure paths are evaluated correctly. For security, Claude Code cannot automatically determine the final working directory when 'cd' is used in compound commands.`,
      decisionReason: {
        type: 'other',
        reason:
          'Compound command contains cd with write operation - manual approval required to prevent path resolution bypass',
      },
    }
  }

  // 遍历 const path of paths，让工具调用逐项完成同一类处理。
  for (const path of paths) {
    // 从 `validatePath(` 解构 allowed、resolvedPath、decisionReason，减少Bash 工具 path Validation对同一对象的重复访问。
    const { allowed, resolvedPath, decisionReason } = validatePath(
      path,
      cwd,
      toolPermissionContext,
      operationType,
    )

    // allowed缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!allowed) {
      // workingDirs 集合保存`Array.from`，供工具调用后续处理使用。
      const workingDirs = Array.from(
        allWorkingDirectories(toolPermissionContext),
      )
      // dirListStr格式化`formatDirectoryList`，供工具调用后续处理使用。
      const dirListStr = formatDirectoryList(workingDirs)

      // Use security check's custom reason if available (type: 'other' or 'safetyCheck')
      // Otherwise use the standard "was blocked" message
      // message 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const message =
        decisionReason?.type === 'other' ||
        decisionReason?.type === 'safetyCheck'
          ? decisionReason.reason
          : `${command} in '${resolvedPath}' was blocked. For security, Claude Code may only ${ACTION_VERBS[command]} the allowed working directories for this session: ${dirListStr}.`

      // `decisionReason?.type` 命中特定值 `'rule'` 时，进入工具调用对应处理。
      if (decisionReason?.type === 'rule') {
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'deny',
          message,
          decisionReason,
        }
      }

      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        message,
        blockedPath: resolvedPath,
        decisionReason,
      }
    }
  }

  // All paths are valid - return passthrough
  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: `Path validation passed for ${command} command`,
  }
}

// createPathChecker 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
export function createPathChecker(
  command: PathCommand,
  operationTypeOverride?: FileOperationType,
) {
  // 返回 (，把工具调用这个分支的结果交还调用方。
  return (
    args: string[],
    cwd: string,
    context: ToolPermissionContext,
    compoundCommandHasCd?: boolean,
  ): PermissionResult => {
    // First check normal path validation (which includes explicit deny rules)
    // 结果读取`validateCommandPaths`，供工具调用后续处理使用。
    const result = validateCommandPaths(
      command,
      args,
      cwd,
      context,
      compoundCommandHasCd,
      operationTypeOverride,
    )

    // If explicitly denied, respect that (don't override with dangerous path message)
    // `result.behavior` 命中特定值 `'deny'` 时，进入工具调用对应处理。
    if (result.behavior === 'deny') {
      // 返回 result，把工具调用这个分支的结果交还调用方。
      return result
    }

    // Check for dangerous removal paths AFTER explicit deny rules but BEFORE other results
    // This ensures the check runs even if the user has allowlist rules or if glob patterns
    // were rejected, but respects explicit deny rules. Dangerous patterns get a specific
    // error message that overrides generic glob pattern rejection messages.
    // `command` 命中特定值 `'rm' || command === 'rmdir'` 时，进入工具调用对应处理。
    if (command === 'rm' || command === 'rmdir') {
      // dangerousPathResult 文件数据读取`checkDangerousRemovalPaths`，供工具调用后续处理使用。
      const dangerousPathResult = checkDangerousRemovalPaths(command, args, cwd)
      // `dangerousPathResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
      if (dangerousPathResult.behavior !== 'passthrough') {
        // 返回 dangerousPathResult，把工具调用这个分支的结果交还调用方。
        return dangerousPathResult
      }
    }

    // If it's a passthrough, return it directly
    // `result.behavior` 命中特定值 `'passthrough'` 时，进入工具调用对应处理。
    if (result.behavior === 'passthrough') {
      // 返回 result，把工具调用这个分支的结果交还调用方。
      return result
    }

    // If it's an ask decision, add suggestions based on the operation type
    // `result.behavior` 命中特定值 `'ask'` 时，进入工具调用对应处理。
    if (result.behavior === 'ask') {
      // operationType 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const operationType =
        operationTypeOverride ?? COMMAND_OPERATION_TYPE[command]
      // suggestions 集合从空数组开始收集，后续按处理顺序追加条目。
      const suggestions: PermissionUpdate[] = []

      // Only suggest adding directory/rules if we have a blocked path
      // 满足 `result.blockedPath` 时，工具调用执行该分支。
      if (result.blockedPath) {
        // `operationType` 命中特定值 `'read'` 时，进入工具调用对应处理。
        if (operationType === 'read') {
          // For read operations, suggest a Read rule for the directory (only if it exists)
          // dirPath 文件数据读取`getDirectoryForPath`，供工具调用后续处理使用。
          const dirPath = getDirectoryForPath(result.blockedPath)
          // suggestion构建`createReadRuleSuggestion`，供工具调用后续处理使用。
          const suggestion = createReadRuleSuggestion(dirPath, 'session')
          // 满足 `suggestion` 时，工具调用执行该分支。
          if (suggestion) {
            // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
            suggestions.push(suggestion)
          }
        } else {
          // For write/create operations, suggest adding the directory
          // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
          suggestions.push({
            type: 'addDirectories',
            directories: [getDirectoryForPath(result.blockedPath)],
            destination: 'session',
          })
        }
      }

      // For write operations, also suggest enabling accept-edits mode
      // 只有 `operationType === 'write' || operationType === 'c` 满足时，工具调用才执行该分支。
      if (operationType === 'write' || operationType === 'create') {
        // suggestions 集合追加新条目，保持收集顺序与输入顺序一致。
        suggestions.push({
          type: 'setMode',
          mode: 'acceptEdits',
          destination: 'session',
        })
      }

      // suggestions 集合更新为 `suggestions`，确保Bash 工具后续读取最新状态。
      result.suggestions = suggestions
    }

    // Return the decision directly
    // 返回 result，把工具调用这个分支的结果交还调用方。
    return result
  }
}

/**
 * Parses command arguments using shell-quote, converting glob objects to strings.
 * This is necessary because shell-quote parses patterns like *.txt as glob objects,
 * but we need them as strings for path validation.
 */
// parseCommandArguments 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function parseCommandArguments(cmd: string): string[] {
  // parseResult保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parseResult = tryParseShellCommand(cmd, env => `$${env}`)
  // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parseResult.success) {
    // Malformed shell syntax, return empty array
    // 返回 []，把工具调用这个分支的结果交还调用方。
    return []
  }
  // parsed解析`parseResult.tokens`，供Bash 工具 path Validation后续步骤使用。
  const parsed = parseResult.tokens
  // extractedArgs 集合从空数组开始收集，后续按处理顺序追加条目。
  const extractedArgs: string[] = []

  // 遍历 const arg of parsed，让工具调用逐项完成同一类处理。
  for (const arg of parsed) {
    // `typeof arg` 命中特定值 `'string'` 时，进入工具调用对应处理。
    if (typeof arg === 'string') {
      // Include empty strings - they're valid arguments (e.g., grep "" /tmp/t)
      // extractedArgs 集合追加新条目，保持收集顺序与输入顺序一致。
      extractedArgs.push(arg)
    // Bash 工具 path Validation处理 `} else if (`，完成这一小步状态转换。
    } else if (
      typeof arg === 'object' &&
      arg !== null &&
      'op' in arg &&
      arg.op === 'glob' &&
      'pattern' in arg
    ) {
      // shell-quote parses glob patterns as objects, but we need them as strings for validation
      // extractedArgs 集合追加新条目，保持收集顺序与输入顺序一致。
      extractedArgs.push(String(arg.pattern))
    }
  }

  // 返回 extractedArgs，把工具调用这个分支的结果交还调用方。
  return extractedArgs
}

/**
 * Validates a single command for path constraints and shell safety.
 *
 * This function:
 * 1. Parses the command arguments
 * 2. Checks if it's a path command (cd, ls, find)
 * 3. Validates for shell injection patterns
 * 4. Validates all paths are within allowed directories
 *
 * @param cmd - The command string to validate
 * @param cwd - Current working directory
 * @param toolPermissionContext - Context containing allowed directories
 * @param compoundCommandHasCd - Whether the full compound command contains a cd
 * @returns PermissionResult - 'passthrough' if not a path command, otherwise validation result
 */
// validateSinglePathCommand 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function validateSinglePathCommand(
  cmd: string,
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  compoundCommandHasCd?: boolean,
): PermissionResult {
  // SECURITY: Strip wrapper commands (timeout, nice, nohup, time) before extracting
  // the base command. Without this, dangerous commands wrapped with these utilities
  // would bypass path validation since the wrapper command (e.g., 'timeout') would
  // be checked instead of the actual command (e.g., 'rm').
  // Example: 'timeout 10 rm -rf /' would otherwise see 'timeout' as the base command.
  // strippedCmd 命令数据保存`stripSafeWrappers`，供工具调用后续处理使用。
  const strippedCmd = stripSafeWrappers(cmd)

  // Parse command into arguments, handling quotes and globs
  // extractedArgs 集合解析`parseCommandArguments`，供工具调用后续处理使用。
  const extractedArgs = parseCommandArguments(strippedCmd)
  // extractedArgs 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (extractedArgs.length === 0) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'passthrough',
      message: 'Empty command - no paths to validate',
    }
  }

  // Check if this is a path command we need to validate
  // 从 `extractedArgs` 按位置拆出 baseCmd、其余 args，让Bash 工具 path Validation分别处理这些返回值。
  const [baseCmd, ...args] = extractedArgs
  // 判断 !baseCmd || !SUPPORTED_PATH_COMMANDS.includes(baseCmd as PathCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (!baseCmd || !SUPPORTED_PATH_COMMANDS.includes(baseCmd as PathCommand)) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'passthrough',
      message: `Command '${baseCmd}' is not a path-restricted command`,
    }
  }

  // For read-only sed commands (e.g., sed -n '1,10p' file.txt),
  // validate file paths as read operations instead of write operations.
  // sed is normally classified as 'write' for path validation, but when the
  // command is purely reading (line printing with -n), file args are read-only.
  // operationTypeOverride 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const operationTypeOverride =
    baseCmd === 'sed' && sedCommandIsAllowedByAllowlist(strippedCmd)
      ? ('read' as FileOperationType)
      : undefined

  // Validate all paths are within allowed directories
  // pathChecker 文件数据构建`createPathChecker`，供工具调用后续处理使用。
  const pathChecker = createPathChecker(
    baseCmd as PathCommand,
    operationTypeOverride,
  )
  // 返回 pathChecker(args, cwd, toolPermissionContext, compoundCommandHasCd)，把工具调用这个分支的结果交还调用方。
  return pathChecker(args, cwd, toolPermissionContext, compoundCommandHasCd)
}

/**
 * Like validateSinglePathCommand but operates on AST-derived argv directly
 * instead of re-parsing the command string with shell-quote. Avoids the
 * shell-quote single-quote backslash bug that causes parseCommandArguments
 * to silently return [] and skip path validation.
 */
// validateSinglePathCommandArgv 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function validateSinglePathCommandArgv(
  cmd: SimpleCommand,
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  compoundCommandHasCd?: boolean,
): PermissionResult {
  // argv保存`stripWrappersFromArgv`，供工具调用后续处理使用。
  const argv = stripWrappersFromArgv(cmd.argv)
  // argv为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (argv.length === 0) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'passthrough',
      message: 'Empty command - no paths to validate',
    }
  }
  // 从 `argv` 按位置拆出 baseCmd、其余 args，让Bash 工具 path Validation分别处理这些返回值。
  const [baseCmd, ...args] = argv
  // 判断 !baseCmd || !SUPPORTED_PATH_COMMANDS.includes(baseCmd as PathCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (!baseCmd || !SUPPORTED_PATH_COMMANDS.includes(baseCmd as PathCommand)) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'passthrough',
      message: `Command '${baseCmd}' is not a path-restricted command`,
    }
  }
  // sed read-only override: use .text for the allowlist check since
  // sedCommandIsAllowedByAllowlist takes a string. argv is already
  // wrapper-stripped but .text is raw tree-sitter span (includes
  // `timeout 5 ` prefix), so strip here too.
  // operationTypeOverride 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const operationTypeOverride =
    baseCmd === 'sed' &&
    sedCommandIsAllowedByAllowlist(stripSafeWrappers(cmd.text))
      ? ('read' as FileOperationType)
      : undefined
  // pathChecker 文件数据构建`createPathChecker`，供工具调用后续处理使用。
  const pathChecker = createPathChecker(
    baseCmd as PathCommand,
    operationTypeOverride,
  )
  // 返回 pathChecker(args, cwd, toolPermissionContext, compoundCommandHasCd)，把工具调用这个分支的结果交还调用方。
  return pathChecker(args, cwd, toolPermissionContext, compoundCommandHasCd)
}

// validateOutputRedirections 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function validateOutputRedirections(
  redirections: Array<{ target: string; operator: '>' | '>>' }>,
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  compoundCommandHasCd?: boolean,
): PermissionResult {
  // SECURITY: Block output redirections in compound commands containing 'cd'
  // This prevents bypassing path safety checks via directory changes before redirections.
  // Example attack: cd .claude/ && echo "malicious" > settings.json
  // The redirection target would be validated relative to the original CWD, but the
  // actual write happens in the changed directory after 'cd' executes.
  // 只有 `compoundCommandHasCd && redirections.length > 0` 满足时，工具调用才执行该分支。
  if (compoundCommandHasCd && redirections.length > 0) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: `Commands that change directories and write via output redirection require explicit approval to ensure paths are evaluated correctly. For security, Claude Code cannot automatically determine the final working directory when 'cd' is used in compound commands.`,
      decisionReason: {
        type: 'other',
        reason:
          'Compound command contains cd with output redirection - manual approval required to prevent path resolution bypass',
      },
    }
  }
  // 遍历 const { target } of redirections，让工具调用逐项完成同一类处理。
  for (const { target } of redirections) {
    // /dev/null is always safe - it discards output
    // `target` 命中特定值 `'/dev/null'` 时，进入工具调用对应处理。
    if (target === '/dev/null') {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 从 `validatePath(` 解构 allowed、resolvedPath、decisionReason，减少Bash 工具 path Validation对同一对象的重复访问。
    const { allowed, resolvedPath, decisionReason } = validatePath(
      target,
      cwd,
      toolPermissionContext,
      'create', // Treat > and >> as create operations
    )

    // allowed缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!allowed) {
      // workingDirs 集合保存`Array.from`，供工具调用后续处理使用。
      const workingDirs = Array.from(
        allWorkingDirectories(toolPermissionContext),
      )
      // dirListStr格式化`formatDirectoryList`，供工具调用后续处理使用。
      const dirListStr = formatDirectoryList(workingDirs)

      // Use security check's custom reason if available (type: 'other' or 'safetyCheck')
      // Otherwise use the standard message for deny rules or working directory restrictions
      // message 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const message =
        decisionReason?.type === 'other' ||
        decisionReason?.type === 'safetyCheck'
          ? decisionReason.reason
          : decisionReason?.type === 'rule'
            ? `Output redirection to '${resolvedPath}' was blocked by a deny rule.`
            : `Output redirection to '${resolvedPath}' was blocked. For security, Claude Code may only write to files in the allowed working directories for this session: ${dirListStr}.`

      // If denied by a deny rule, return 'deny' behavior
      // `decisionReason?.type` 命中特定值 `'rule'` 时，进入工具调用对应处理。
      if (decisionReason?.type === 'rule') {
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'deny',
          message,
          decisionReason,
        }
      }

      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        message,
        blockedPath: resolvedPath,
        decisionReason,
        suggestions: [
          {
            type: 'addDirectories',
            directories: [getDirectoryForPath(resolvedPath)],
            destination: 'session',
          },
        ],
      }
    }
  }

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: 'No unsafe redirections found',
  }
}

/**
 * Checks path constraints for commands that access the filesystem (cd, ls, find).
 * Also validates output redirections to ensure they're within allowed directories.
 *
 * @returns
 * - 'ask' if any path command or redirection tries to access outside allowed directories
 * - 'passthrough' if no path commands were found or if all are within allowed directories
 */
// checkPathConstraints 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
export function checkPathConstraints(
  input: z.infer<typeof BashTool.inputSchema>,
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  compoundCommandHasCd?: boolean,
  astRedirects?: Redirect[],
  astCommands?: SimpleCommand[],
): PermissionResult {
  // SECURITY: Process substitution >(cmd) can execute commands that write to files
  // without those files appearing as redirect targets. For example:
  //   echo secret > >(tee .git/config)
  // The tee command writes to .git/config but it's not detected as a redirect.
  // Require explicit approval for any command containing process substitution.
  // Skip on AST path — process_substitution is in DANGEROUS_TYPES and
  // already returned too-complex before reaching here.
  // 判断 !astCommands && />>\s*>\s*\(|>\s*>\s*\(|<\s*\(/.test(input.command)，将工具调用分流到只适用于该条件的处理路径。
  if (!astCommands && />>\s*>\s*\(|>\s*>\s*\(|<\s*\(/.test(input.command)) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Process substitution (>(...) or <(...)) can execute arbitrary commands and requires manual approval',
      decisionReason: {
        type: 'other',
        reason: 'Process substitution requires manual approval',
      },
    }
  }

  // SECURITY: When AST-derived redirects are available, use them directly
  // instead of re-parsing with shell-quote. shell-quote has a known
  // single-quote backslash bug that silently merges redirect operators into
  // garbled tokens on a successful parse (not a parse failure, so the
  // fail-closed guard doesn't help). The AST already resolved targets
  // correctly and checkSemantics validated them.
  // 从 `astRedirects` 解构 redirections、hasDangerousRedirection，减少Bash 工具 path Validation对同一对象的重复访问。
  const { redirections, hasDangerousRedirection } = astRedirects
    ? astRedirectsToOutputRedirections(astRedirects)
    : extractOutputRedirections(input.command)

  // SECURITY: If we found a redirection operator with a target containing shell expansion
  // syntax ($VAR or %VAR%), require manual approval since the target can't be safely validated.
  // 满足 `hasDangerousRedirection` 时，工具调用执行该分支。
  if (hasDangerousRedirection) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: 'Shell expansion syntax in paths requires manual approval',
      decisionReason: {
        type: 'other',
        reason: 'Shell expansion syntax in paths requires manual approval',
      },
    }
  }
  // redirectionResult读取`validateOutputRedirections`，供工具调用后续处理使用。
  const redirectionResult = validateOutputRedirections(
    redirections,
    cwd,
    toolPermissionContext,
    compoundCommandHasCd,
  )
  // `redirectionResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
  if (redirectionResult.behavior !== 'passthrough') {
    // 返回 redirectionResult，把工具调用这个分支的结果交还调用方。
    return redirectionResult
  }

  // SECURITY: When AST-derived commands are available, iterate them with
  // pre-parsed argv instead of re-parsing via splitCommand_DEPRECATED + shell-quote.
  // shell-quote has a single-quote backslash bug that causes
  // parseCommandArguments to silently return [] and skip path validation
  // (isDangerousRemovalPath etc). The AST already resolved argv correctly.
  // 满足 `astCommands` 时，工具调用执行该分支。
  if (astCommands) {
    // 遍历 const cmd of astCommands，让工具调用逐项完成同一类处理。
    for (const cmd of astCommands) {
      // 结果读取`validateSinglePathCommandArgv`，供工具调用后续处理使用。
      const result = validateSinglePathCommandArgv(
        cmd,
        cwd,
        toolPermissionContext,
        compoundCommandHasCd,
      )
      // 只有 `result.behavior === 'ask' || result.behavior ===` 满足时，工具调用才执行该分支。
      if (result.behavior === 'ask' || result.behavior === 'deny') {
        // 返回 result，把工具调用这个分支的结果交还调用方。
        return result
      }
    }
  } else {
    // commands 命令数据格式化`splitCommand_DEPRECATED`，供工具调用后续处理使用。
    const commands = splitCommand_DEPRECATED(input.command)
    // 遍历 const cmd of commands，让工具调用逐项完成同一类处理。
    for (const cmd of commands) {
      // 结果读取`validateSinglePathCommand`，供工具调用后续处理使用。
      const result = validateSinglePathCommand(
        cmd,
        cwd,
        toolPermissionContext,
        compoundCommandHasCd,
      )
      // 只有 `result.behavior === 'ask' || result.behavior ===` 满足时，工具调用才执行该分支。
      if (result.behavior === 'ask' || result.behavior === 'deny') {
        // 返回 result，把工具调用这个分支的结果交还调用方。
        return result
      }
    }
  }

  // Always return passthrough to let other permission checks handle the command
  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: 'All path commands validated successfully',
  }
}

/**
 * Convert AST-derived Redirect[] to the format expected by
 * validateOutputRedirections. Filters to output-only redirects (excluding
 * fd duplications like 2>&1) and maps operators to '>' | '>>'.
 */
// astRedirectsToOutputRedirections 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function astRedirectsToOutputRedirections(redirects: Redirect[]): {
  redirections: Array<{ target: string; operator: '>' | '>>' }>
  hasDangerousRedirection: boolean
} {
  // redirections 集合从空数组开始收集，后续按处理顺序追加条目。
  const redirections: Array<{ target: string; operator: '>' | '>>' }> = []
  // 遍历 const r of redirects，让工具调用逐项完成同一类处理。
  for (const r of redirects) {
    // 按照 r.op 的取值选择工具调用的具体处理分支。
    switch (r.op) {
      case '>':
      case '>|':
      case '&>':
        // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
        redirections.push({ target: r.target, operator: '>' })
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case '>>':
      case '&>>':
        // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
        redirections.push({ target: r.target, operator: '>>' })
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case '>&':
        // >&N (digits only) is fd duplication (e.g. 2>&1, >&10), not a file
        // write. >&file is the deprecated form of &>file (redirect to file).
        // 判断 !/^\d+$/.test(r.target)，将工具调用分流到只适用于该条件的处理路径。
        if (!/^\d+$/.test(r.target)) {
          // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
          redirections.push({ target: r.target, operator: '>' })
        }
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case '<':
      case '<<':
      case '<&':
      case '<<<':
        // input redirects — skip
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
    }
  }
  // AST targets are fully resolved (no shell expansion) — checkSemantics
  // already validated them. No dangerous redirections are possible.
  // 返回 { redirections, hasDangerousRedirection: false }，把工具调用这个分支的结果交还调用方。
  return { redirections, hasDangerousRedirection: false }
}

// ───────────────────────────────────────────────────────────────────────────
// Argv-level safe-wrapper stripping (timeout, nice, stdbuf, env, time, nohup)
//
// This is the CANONICAL stripWrappersFromArgv. bashPermissions.ts still
// exports an older narrower copy (timeout/nice-n-N only) that is DEAD CODE
// — no prod consumer — but CANNOT be removed: bashPermissions.ts is right
// at Bun's feature() DCE complexity threshold, and deleting ~80 lines from
// that module silently breaks feature('BASH_CLASSIFIER') evaluation (drops
// every pendingClassifierCheck spread). Verified in PR #21503 round 3:
// baseline classifier tests 30/30 pass, after deletion 22/30 fail. See
// team memory: bun-feature-dce-cliff.md. Hit 3× in PR #21075 + twice in
// #21503. The expanded version lives here (the only prod consumer) instead.
//
// KEEP IN SYNC with:
//   - SAFE_WRAPPER_PATTERNS in bashPermissions.ts (text-based stripSafeWrappers)
//   - the wrapper-stripping loop in checkSemantics (src/utils/bash/ast.ts ~1860)
// If you add a wrapper in either, add it here too. Asymmetry means
// checkSemantics exposes the wrapped command to semantic checks but path
// validation sees the wrapper name → passthrough → wrapped paths never
// validated (PR #21503 review comment 2907319120).
// ───────────────────────────────────────────────────────────────────────────

// SECURITY: allowlist for timeout flag VALUES (signals are TERM/KILL/9,
// durations are 5/5s/10.5). Rejects $ ( ) ` | ; & and newlines that
// previously matched via [^ \t]+ — `timeout -k$(id) 10 ls` must NOT strip.
// TIMEOUT_FLAG_VALUE_RE保存`/^[A-Za-z0-9_.+-]+$/`，供Bash 工具 path Validation后续步骤使用。
const TIMEOUT_FLAG_VALUE_RE = /^[A-Za-z0-9_.+-]+$/

/**
 * Parse timeout's GNU flags (long + short, fused + space-separated) and
 * return the argv index of the DURATION token, or -1 if flags are unparseable.
 */
// skipTimeoutFlags 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function skipTimeoutFlags(a: readonly string[]): number {
  // i保存`1`，供Bash 工具 path Validation后续步骤使用。
  let i = 1
  // while 使用 i < a.length 完成工具调用里的对应操作。
  while (i < a.length) {
    // arg保存`a[i]!`，供Bash 工具 path Validation后续步骤使用。
    const arg = a[i]!
    // next保存`a[i + 1]`，供Bash 工具 path Validation后续步骤使用。
    const next = a[i + 1]
    // 工具调用在这里按实际状态进入对应分支。
    if (
      arg === '--foreground' ||
      arg === '--preserve-status' ||
      arg === '--verbose'
    )
      // Bash 工具 path Validation处理 `i++`，完成这一小步状态转换。
      i++
    else if (/^--(?:kill-after|signal)=[A-Za-z0-9_.+-]+$/.test(arg)) i++
    else if (
      (arg === '--kill-after' || arg === '--signal') &&
      next &&
      TIMEOUT_FLAG_VALUE_RE.test(next)
    )
      // Bash 工具 path Validation处理 `i += 2`，完成这一小步状态转换。
      i += 2
    else if (arg === '--') {
      // Bash 工具 path Validation处理 `i++`，完成这一小步状态转换。
      i++
      // 结束这个分支或循环，避免工具调用继续落入后续路径。
      break
    } // end-of-options marker
    else if (arg.startsWith('--')) return -1
    else if (arg === '-v') i++
    else if (
      (arg === '-k' || arg === '-s') &&
      next &&
      TIMEOUT_FLAG_VALUE_RE.test(next)
    )
      // Bash 工具 path Validation处理 `i += 2`，完成这一小步状态转换。
      i += 2
    else if (/^-[ks][A-Za-z0-9_.+-]+$/.test(arg)) i++
    else if (arg.startsWith('-')) return -1
    else break
  }
  // 返回 i，把工具调用这个分支的结果交还调用方。
  return i
}

/**
 * Parse stdbuf's flags (-i/-o/-e in fused/space-separated/long-= forms).
 * Returns argv index of wrapped COMMAND, or -1 if unparseable or no flags
 * consumed (stdbuf without flags is inert). Mirrors checkSemantics (ast.ts).
 */
// skipStdbufFlags 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function skipStdbufFlags(a: readonly string[]): number {
  // i保存`1`，供Bash 工具 path Validation后续步骤使用。
  let i = 1
  // while 使用 i < a.length 完成工具调用里的对应操作。
  while (i < a.length) {
    // arg保存`a[i]!`，供Bash 工具 path Validation后续步骤使用。
    const arg = a[i]!
    // 判断 /^-[ioe]$/.test(arg) && a[i + 1]，将工具调用分流到只适用于该条件的处理路径。
    if (/^-[ioe]$/.test(arg) && a[i + 1]) i += 2
    else if (/^-[ioe]./.test(arg)) i++
    else if (/^--(input|output|error)=/.test(arg)) i++
    else if (arg.startsWith('-'))
      // 返回 -1 // unknown flag: fail closed，把工具调用这个分支的结果交还调用方。
      return -1 // unknown flag: fail closed
    else break
  }
  // 返回 i > 1 && i < a.length ? i : -1，把工具调用这个分支的结果交还调用方。
  return i > 1 && i < a.length ? i : -1
}

/**
 * Parse env's VAR=val and safe flags (-i/-0/-v/-u NAME). Returns argv index
 * of wrapped COMMAND, or -1 if unparseable/no wrapped cmd. Rejects -S (argv
 * splitter), -C/-P (altwd/altpath). Mirrors checkSemantics (ast.ts).
 */
// skipEnvFlags 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
function skipEnvFlags(a: readonly string[]): number {
  // i保存`1`，供Bash 工具 path Validation后续步骤使用。
  let i = 1
  // while 使用 i < a.length 完成工具调用里的对应操作。
  while (i < a.length) {
    // arg保存`a[i]!`，供Bash 工具 path Validation后续步骤使用。
    const arg = a[i]!
    // 判断 arg.includes('=') && !arg.startsWith('-')，将工具调用分流到只适用于该条件的处理路径。
    if (arg.includes('=') && !arg.startsWith('-')) i++
    else if (arg === '-i' || arg === '-0' || arg === '-v') i++
    else if (arg === '-u' && a[i + 1]) i += 2
    else if (arg.startsWith('-'))
      // 返回 -1 // -S/-C/-P/unknown: fail closed，把工具调用这个分支的结果交还调用方。
      return -1 // -S/-C/-P/unknown: fail closed
    else break
  }
  // 返回 i < a.length ? i : -1，把工具调用这个分支的结果交还调用方。
  return i < a.length ? i : -1
}

/**
 * Argv-level counterpart to stripSafeWrappers (bashPermissions.ts). Strips
 * wrapper commands from AST-derived argv. Env vars are already separated
 * into SimpleCommand.envVars so no env-var stripping here.
 */
// stripWrappersFromArgv 承担工具调用中的独立步骤，串起Bash 工具 path Validation需要的输入整理、状态更新和结果输出。
export function stripWrappersFromArgv(argv: string[]): string[] {
  // a保存`argv`，供Bash 工具 path Validation后续步骤使用。
  let a = argv
  // 遍历 ;;，让工具调用逐项完成同一类处理。
  for (;;) {
    // `a[0]` 命中特定值 `'time' || a[0] === 'nohup'` 时，进入工具调用对应处理。
    if (a[0] === 'time' || a[0] === 'nohup') {
      // a更新为 `a.slice(a[1] === '--' ? 2 : 1)`，确保Bash 工具后续读取最新状态。
      a = a.slice(a[1] === '--' ? 2 : 1)
    // `a[0] === 'timeout'` 成立时，Bash 工具 path Validation切换到这个 else-if 分支。
    } else if (a[0] === 'timeout') {
      // i保存`skipTimeoutFlags`，供工具调用后续处理使用。
      const i = skipTimeoutFlags(a)
      // SECURITY (PR #21503 round 3): unrecognized duration (`.5`, `+5`,
      // `inf` — strtod formats GNU timeout accepts) → return a unchanged.
      // Safe because checkSemantics (ast.ts) fails CLOSED on the same input
      // and runs first in bashToolHasPermission, so we never reach here.
      // 判断 i < 0 || !a[i] || !/^\d+(?:\.\d+)?[smhd]?$/.test(a[i]!)，将工具调用分流到只适用于该条件的处理路径。
      if (i < 0 || !a[i] || !/^\d+(?:\.\d+)?[smhd]?$/.test(a[i]!)) return a
      // a更新为 `a.slice(i + 1)`，确保Bash 工具后续读取最新状态。
      a = a.slice(i + 1)
    // `a[0] === 'nice'` 成立时，Bash 工具 path Validation切换到这个 else-if 分支。
    } else if (a[0] === 'nice') {
      // SECURITY (PR #21503 round 3): mirror checkSemantics — handle bare
      // `nice cmd` and legacy `nice -N cmd`, not just `nice -n N cmd`.
      // Previously only `-n N` was stripped: `nice rm /outside` →
      // baseCmd='nice' → passthrough → /outside never path-validated.
      // 判断 a[1] === '-n' && a[2] && /^-?\d+$/.test(a[2])，将工具调用分流到只适用于该条件的处理路径。
      if (a[1] === '-n' && a[2] && /^-?\d+$/.test(a[2]))
        // a更新为 `a.slice(a[3] === '--' ? 4 : 3)`，确保Bash 工具后续读取最新状态。
        a = a.slice(a[3] === '--' ? 4 : 3)
      else if (a[1] && /^-\d+$/.test(a[1])) a = a.slice(a[2] === '--' ? 3 : 2)
      else a = a.slice(a[1] === '--' ? 2 : 1)
    // `a[0] === 'stdbuf'` 成立时，Bash 工具 path Validation切换到这个 else-if 分支。
    } else if (a[0] === 'stdbuf') {
      // SECURITY (PR #21503 round 3): PR-WIDENED. Pre-PR, `stdbuf -o0 -eL rm`
      // was rejected by fragment check (old checkSemantics slice(2) left
      // name='-eL'). Post-PR, checkSemantics strips both flags → name='rm'
      // → passes. But stripWrappersFromArgv returned unchanged →
      // baseCmd='stdbuf' → not in SUPPORTED_PATH_COMMANDS → passthrough.
      // i保存`skipStdbufFlags`，供工具调用后续处理使用。
      const i = skipStdbufFlags(a)
      // 判断 i < 0，将工具调用分流到只适用于该条件的处理路径。
      if (i < 0) return a
      // a更新为 `a.slice(i)`，确保Bash 工具后续读取最新状态。
      a = a.slice(i)
    // `a[0] === 'env'` 成立时，Bash 工具 path Validation切换到这个 else-if 分支。
    } else if (a[0] === 'env') {
      // Same asymmetry: checkSemantics strips env, we didn't.
      // i保存`skipEnvFlags`，供工具调用后续处理使用。
      const i = skipEnvFlags(a)
      // 判断 i < 0，将工具调用分流到只适用于该条件的处理路径。
      if (i < 0) return a
      // a更新为 `a.slice(i)`，确保Bash 工具后续读取最新状态。
      a = a.slice(i)
    } else {
      // 返回 a，把工具调用这个分支的结果交还调用方。
      return a
    }
  }
}

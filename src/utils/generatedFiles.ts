// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, extname, posix, sep } from 'path'

/**
 * File patterns that should be excluded from attribution.
 * Based on GitHub Linguist vendored patterns and common generated file patterns.
 */

// Exact file name matches (case-insensitive)
// EXCLUDED_FILENAMES 文件数据保存`Set`，供共享工具后续处理使用。
const EXCLUDED_FILENAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'bun.lock',
  'composer.lock',
  'gemfile.lock',
  'cargo.lock',
  'poetry.lock',
  'pipfile.lock',
  'shrinkwrap.json',
  'npm-shrinkwrap.json',
])

// File extension patterns (case-insensitive)
// EXCLUDED_EXTENSIONS 集合保存`Set`，供共享工具后续处理使用。
const EXCLUDED_EXTENSIONS = new Set([
  '.lock',
  '.min.js',
  '.min.css',
  '.min.html',
  '.bundle.js',
  '.bundle.css',
  '.generated.ts',
  '.generated.js',
  '.d.ts', // TypeScript declaration files
])

// Directory patterns that indicate generated/vendored content
// EXCLUDED_DIRECTORIES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const EXCLUDED_DIRECTORIES = [
  '/dist/',
  '/build/',
  '/out/',
  '/output/',
  '/node_modules/',
  '/vendor/',
  '/vendored/',
  '/third_party/',
  '/third-party/',
  '/external/',
  '/.next/',
  '/.nuxt/',
  '/.svelte-kit/',
  '/coverage/',
  '/__pycache__/',
  '/.tox/',
  '/venv/',
  '/.venv/',
  '/target/release/',
  '/target/debug/',
]

// Filename patterns using regex for more complex matching
// EXCLUDED_FILENAME_PATTERNS 文件数据 聚合成有序列表，保持后续遍历顺序稳定。
const EXCLUDED_FILENAME_PATTERNS = [
  /^.*\.min\.[a-z]+$/i, // *.min.*
  /^.*-min\.[a-z]+$/i, // *-min.*
  /^.*\.bundle\.[a-z]+$/i, // *.bundle.*
  /^.*\.generated\.[a-z]+$/i, // *.generated.*
  /^.*\.gen\.[a-z]+$/i, // *.gen.*
  /^.*\.auto\.[a-z]+$/i, // *.auto.*
  /^.*_generated\.[a-z]+$/i, // *_generated.*
  /^.*_gen\.[a-z]+$/i, // *_gen.*
  /^.*\.pb\.(go|js|ts|py|rb)$/i, // Protocol buffer generated files
  /^.*_pb2?\.py$/i, // Python protobuf files
  /^.*\.pb\.h$/i, // C++ protobuf headers
  /^.*\.grpc\.[a-z]+$/i, // gRPC generated files
  /^.*\.swagger\.[a-z]+$/i, // Swagger generated files
  /^.*\.openapi\.[a-z]+$/i, // OpenAPI generated files
]

/**
 * Check if a file should be excluded from attribution based on Linguist-style rules.
 *
 * @param filePath - Relative file path from repository root
 * @returns true if the file should be excluded from attribution
 */
// isGeneratedFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isGeneratedFile(filePath: string): boolean {
  // Normalize path separators for consistent pattern matching (patterns use posix-style /)
  // normalizedPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const normalizedPath =
    posix.sep + filePath.split(sep).join(posix.sep).replace(/^\/+/, '')
  // fileName 文件数据保存`basename`，供共享工具后续处理使用。
  const fileName = basename(filePath).toLowerCase()
  // ext保存`extname`，供共享工具后续处理使用。
  const ext = extname(filePath).toLowerCase()

  // Check exact filename matches
  // 满足 `EXCLUDED_FILENAMES.has(fileName)` 时，共享工具执行该分支。
  if (EXCLUDED_FILENAMES.has(fileName)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check extension matches
  // 满足 `EXCLUDED_EXTENSIONS.has(ext)` 时，共享工具执行该分支。
  if (EXCLUDED_EXTENSIONS.has(ext)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for compound extensions like .min.js
  // 片段列表格式化`fileName.split`，供共享工具后续处理使用。
  const parts = fileName.split('.')
  // 满足 `parts.length > 2` 时，共享工具执行该分支。
  if (parts.length > 2) {
    // compoundExt格式化`parts.slice`，供共享工具后续处理使用。
    const compoundExt = '.' + parts.slice(-2).join('.')
    // 满足 `EXCLUDED_EXTENSIONS.has(compoundExt)` 时，共享工具执行该分支。
    if (EXCLUDED_EXTENSIONS.has(compoundExt)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Check directory patterns
  // 按顺序遍历 `EXCLUDED_DIRECTORIES` 中的dir，逐个交给共享工具处理。
  for (const dir of EXCLUDED_DIRECTORIES) {
    // 满足 `normalizedPath.includes(dir)` 时，共享工具执行该分支。
    if (normalizedPath.includes(dir)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Check filename patterns
  // 按顺序遍历 `EXCLUDED_FILENAME_PATTERNS` 中的pattern，逐个交给共享工具处理。
  for (const pattern of EXCLUDED_FILENAME_PATTERNS) {
    // 满足 `pattern.test(fileName)` 时，共享工具执行该分支。
    if (pattern.test(fileName)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Filter a list of files to exclude generated files.
 *
 * @param files - Array of file paths
 * @returns Array of files that are not generated
 */
// filterGeneratedFiles 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterGeneratedFiles(files: string[]): string[] {
  // 返回 `files.filter(file => !isGeneratedFile(file))`，作为共享工具这次计算的结果。
  return files.filter(file => !isGeneratedFile(file))
}

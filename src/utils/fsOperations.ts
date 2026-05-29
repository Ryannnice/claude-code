// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import * as fs from 'fs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  mkdir as mkdirPromise,
  open,
  readdir as readdirPromise,
  readFile as readFilePromise,
  rename as renamePromise,
  rmdir as rmdirPromise,
  rm as rmPromise,
  stat as statPromise,
  unlink as unlinkPromise,
} from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as nodePath from 'path'
// 引入 getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from './errors.js'
// 引入 slowLogging，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { slowLogging } from './slowOperations.js'

/**
 * Simplified filesystem operations interface based on Node.js fs module.
 * Provides a subset of commonly used sync operations with type safety.
 * Allows abstraction for alternative implementations (e.g., mock, virtual).
 */
// FsOperations 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FsOperations = {
  // File access and information operations
  /** Gets the current working directory */
  cwd(): string
  /** Checks if a file or directory exists */
  // existsSync 使用 path: string 完成共享工具里的对应操作。
  existsSync(path: string): boolean
  /** Gets file stats asynchronously */
  // stat 使用 path: string 完成共享工具里的对应操作。
  stat(path: string): Promise<fs.Stats>
  /** Lists directory contents with file type information asynchronously */
  // readdir 使用 path: string 完成共享工具里的对应操作。
  readdir(path: string): Promise<fs.Dirent[]>
  /** Deletes file asynchronously */
  // unlink 使用 path: string 完成共享工具里的对应操作。
  unlink(path: string): Promise<void>
  /** Removes an empty directory asynchronously */
  // rmdir 使用 path: string 完成共享工具里的对应操作。
  rmdir(path: string): Promise<void>
  /** Removes files and directories asynchronously (with recursive option) */
  // 调用 rm，触发共享工具此处需要的副作用。
  rm(
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void>
  /** Creates directory recursively asynchronously. */
  // mkdir 使用 path: string, options?: { mode?: number } 完成共享工具里的对应操作。
  mkdir(path: string, options?: { mode?: number }): Promise<void>
  /** Reads file content as string asynchronously */
  // readFile 使用 path: string, options: { encoding: BufferEncoding… 完成共享工具里的对应操作。
  readFile(path: string, options: { encoding: BufferEncoding }): Promise<string>
  /** Renames/moves file asynchronously */
  // rename 使用 oldPath: string, newPath: string 完成共享工具里的对应操作。
  rename(oldPath: string, newPath: string): Promise<void>
  /** Gets file stats */
  // statSync 使用 path: string 完成共享工具里的对应操作。
  statSync(path: string): fs.Stats
  /** Gets file stats without following symlinks */
  // lstatSync 使用 path: string 完成共享工具里的对应操作。
  lstatSync(path: string): fs.Stats

  // File content operations
  /** Reads file content as string with specified encoding */
  // 调用 readFileSync，触发共享工具此处需要的副作用。
  readFileSync(
    path: string,
    options: {
      encoding: BufferEncoding
    },
  ): string
  /** Reads raw file bytes as Buffer */
  // readFileBytesSync 使用 path: string 完成共享工具里的对应操作。
  readFileBytesSync(path: string): Buffer
  /** Reads specified number of bytes from file start */
  // 调用 readSync，触发共享工具此处需要的副作用。
  readSync(
    path: string,
    options: {
      length: number
    },
  ): {
    buffer: Buffer
    bytesRead: number
  }
  /** Appends string to file */
  // appendFileSync 使用 path: string, data: string, options?: { mode?: nu… 完成共享工具里的对应操作。
  appendFileSync(path: string, data: string, options?: { mode?: number }): void
  /** Copies file from source to destination */
  // copyFileSync 使用 src: string, dest: string 完成共享工具里的对应操作。
  copyFileSync(src: string, dest: string): void
  /** Deletes file */
  // unlinkSync 使用 path: string 完成共享工具里的对应操作。
  unlinkSync(path: string): void
  /** Renames/moves file */
  // renameSync 使用 oldPath: string, newPath: string 完成共享工具里的对应操作。
  renameSync(oldPath: string, newPath: string): void
  /** Creates hard link */
  // linkSync 使用 target: string, path: string 完成共享工具里的对应操作。
  linkSync(target: string, path: string): void
  /** Creates symbolic link */
  // 调用 symlinkSync，触发共享工具此处需要的副作用。
  symlinkSync(
    target: string,
    path: string,
    type?: 'dir' | 'file' | 'junction',
  ): void
  /** Reads symbolic link */
  // readlinkSync 使用 path: string 完成共享工具里的对应操作。
  readlinkSync(path: string): string
  /** Resolves symbolic links and returns the canonical pathname */
  // realpathSync 使用 path: string 完成共享工具里的对应操作。
  realpathSync(path: string): string

  // Directory operations
  /** Creates directory recursively. Mode defaults to 0o777 & ~umask if not specified. */
  // 调用 mkdirSync，触发共享工具此处需要的副作用。
  mkdirSync(
    path: string,
    options?: {
      mode?: number
    },
  ): void
  /** Lists directory contents with file type information */
  // readdirSync 使用 path: string 完成共享工具里的对应操作。
  readdirSync(path: string): fs.Dirent[]
  /** Lists directory contents as strings */
  // readdirStringSync 使用 path: string 完成共享工具里的对应操作。
  readdirStringSync(path: string): string[]
  /** Checks if the directory is empty */
  // isDirEmptySync 用 path: string 判断共享工具是否满足条件。
  isDirEmptySync(path: string): boolean
  /** Removes an empty directory */
  // rmdirSync 使用 path: string 完成共享工具里的对应操作。
  rmdirSync(path: string): void
  /** Removes files and directories (with recursive option) */
  // 调用 rmSync，触发共享工具此处需要的副作用。
  rmSync(
    path: string,
    options?: {
      recursive?: boolean
      force?: boolean
    },
  ): void
  /** Create a writable stream for writing data to a file. */
  // createWriteStream 使用 path: string 完成共享工具里的对应操作。
  createWriteStream(path: string): fs.WriteStream
  /** Reads raw file bytes as Buffer asynchronously.
   *  When maxBytes is set, only reads up to that many bytes. */
  // readFileBytes 使用 path: string, maxBytes?: number 完成共享工具里的对应操作。
  readFileBytes(path: string, maxBytes?: number): Promise<Buffer>
}

/**
 * Safely resolves a file path, handling symlinks and errors gracefully.
 *
 * Error handling strategy:
 * - If the file doesn't exist, returns the original path (allows for file creation)
 * - If symlink resolution fails (broken symlink, permission denied, circular links),
 *   returns the original path and marks it as not a symlink
 * - This ensures operations can continue with the original path rather than failing
 *
 * @param fs The filesystem implementation to use
 * @param filePath The path to resolve
 * @returns Object containing the resolved path and whether it was a symlink
 */
// safeResolvePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function safeResolvePath(
  fs: FsOperations,
  filePath: string,
): { resolvedPath: string; isSymlink: boolean; isCanonical: boolean } {
  // Block UNC paths before any filesystem access to prevent network
  // requests (DNS/SMB) during validation on Windows
  // 只有 `filePath.startsWith('//') || filePath.startsWith('\\\\')` 满足时，共享工具才执行该分支。
  if (filePath.startsWith('//') || filePath.startsWith('\\\\')) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { resolvedPath: filePath, isSymlink: false, isCanonical: false }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Check for special file types (FIFOs, sockets, devices) before calling realpathSync.
    // realpathSync can block on FIFOs waiting for a writer, causing hangs.
    // If the file doesn't exist, lstatSync throws ENOENT which the catch
    // below handles by returning the original path (allows file creation).
    // stats 集合保存`fs.lstatSync`，供共享工具后续处理使用。
    const stats = fs.lstatSync(filePath)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      stats.isFIFO() ||
      stats.isSocket() ||
      stats.isCharacterDevice() ||
      stats.isBlockDevice()
    ) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { resolvedPath: filePath, isSymlink: false, isCanonical: false }
    }

    // resolvedPath 路径数据保存`fs.realpathSync`，供共享工具后续处理使用。
    const resolvedPath = fs.realpathSync(filePath)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      resolvedPath,
      isSymlink: resolvedPath !== filePath,
      // realpathSync returned: resolvedPath is canonical (all symlinks in
      // all path components resolved). Callers can skip further symlink
      // resolution on this path.
      isCanonical: true,
    }
  } catch (_error) {
    // If lstat/realpath fails for any reason (ENOENT, broken symlink,
    // EACCES, ELOOP, etc.), return the original path to allow operations
    // to proceed
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { resolvedPath: filePath, isSymlink: false, isCanonical: false }
  }
}

/**
 * Check if a file path is a duplicate and should be skipped.
 * Resolves symlinks to detect duplicates pointing to the same file.
 * If not a duplicate, adds the resolved path to loadedPaths.
 *
 * @returns true if the file should be skipped (is duplicate)
 */
// isDuplicatePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDuplicatePath(
  fs: FsOperations,
  filePath: string,
  loadedPaths: Set<string>,
): boolean {
  // 从 `safeResolvePath(fs, filePath)` 解构 resolvedPath，减少共享工具 fs Operations对同一对象的重复访问。
  const { resolvedPath } = safeResolvePath(fs, filePath)
  // 满足 `loadedPaths.has(resolvedPath)` 时，共享工具执行该分支。
  if (loadedPaths.has(resolvedPath)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 调用 loadedPaths.add，触发共享工具此处需要的副作用。
  loadedPaths.add(resolvedPath)
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Resolve the deepest existing ancestor of a path via realpathSync, walking
 * up until it succeeds. Detects dangling symlinks (link entry exists, target
 * doesn't) via lstat and resolves them via readlink.
 *
 * Use when the input path may not exist (new file writes) and you need to
 * know where the write would ACTUALLY land after the OS follows symlinks.
 *
 * Returns the resolved absolute path with non-existent tail segments
 * rejoined, or undefined if no symlink was found in any existing ancestor
 * (the path's existing ancestors all resolve to themselves).
 *
 * Handles: live parent symlinks, dangling file symlinks, dangling parent
 * symlinks. Same core algorithm as teamMemPaths.ts:realpathDeepestExisting.
 */
// resolveDeepestExistingAncestorSync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resolveDeepestExistingAncestorSync(
  fs: FsOperations,
  absolutePath: string,
): string | undefined {
  // dir保存`absolutePath`，供后续判断或组装使用。
  let dir = absolutePath
  // segments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const segments: string[] = []
  // Walk up using lstat (cheap, O(1)) to find the first existing component.
  // lstat does not follow symlinks, so dangling symlinks are detected here.
  // Only call realpathSync (expensive, O(depth)) once at the end.
  // 只要 dir !== nodePath.dirname(dir) 成立，就持续推进共享工具中的循环处理。
  while (dir !== nodePath.dirname(dir)) {
    // st 先占位，稍后的条件分支会根据实际输入补齐它。
    let st: fs.Stats
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // st更新为 `fs.lstatSync(dir)`，确保共享工具后续读取最新状态。
      st = fs.lstatSync(dir)
    } catch {
      // lstat failed: truly non-existent. Walk up.
      // 调用 segments.unshift，触发共享工具此处需要的副作用。
      segments.unshift(nodePath.basename(dir))
      // dir更新为 `nodePath.dirname(dir)`，确保共享工具后续读取最新状态。
      dir = nodePath.dirname(dir)
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 满足 `st.isSymbolicLink()` 时，共享工具执行该分支。
    if (st.isSymbolicLink()) {
      // Found a symlink (live or dangling). Try realpath first (resolves
      // chained symlinks); fall back to readlink for dangling symlinks.
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // resolved保存`fs.realpathSync`，供共享工具后续处理使用。
        const resolved = fs.realpathSync(dir)
        // 返回 `segments.length === 0`，作为共享工具这次计算的结果。
        return segments.length === 0
          ? resolved
          : nodePath.join(resolved, ...segments)
      } catch {
        // Dangling: realpath failed but lstat saw the link entry.
        // target读取`fs.readlinkSync`，供共享工具后续处理使用。
        const target = fs.readlinkSync(dir)
        // absTarget保存`nodePath.isAbsolute`，供共享工具后续处理使用。
        const absTarget = nodePath.isAbsolute(target)
          ? target
          : nodePath.resolve(nodePath.dirname(dir), target)
        // 返回 `segments.length === 0`，作为共享工具这次计算的结果。
        return segments.length === 0
          ? absTarget
          : nodePath.join(absTarget, ...segments)
      }
    }
    // Existing non-symlink component. One realpath call resolves any
    // symlinks in its ancestors. If none, return undefined (no symlink).
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // resolved保存`fs.realpathSync`，供共享工具后续处理使用。
      const resolved = fs.realpathSync(dir)
      // `resolved` 与 `dir` 不一致时刷新派生状态，避免使用过期结果。
      if (resolved !== dir) {
        // 返回 `segments.length === 0`，作为共享工具这次计算的结果。
        return segments.length === 0
          ? resolved
          : nodePath.join(resolved, ...segments)
      }
    } catch {
      // realpath can still fail (e.g. EACCES in ancestors). Return
      // undefined — we can't resolve, and the logical path is already
      // in pathSet for the caller.
    }
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Gets all paths that should be checked for permissions.
 * This includes the original path, all intermediate symlink targets in the chain,
 * and the final resolved path.
 *
 * For example, if test.txt -> /etc/passwd -> /private/etc/passwd:
 * - test.txt (original path)
 * - /etc/passwd (intermediate symlink target)
 * - /private/etc/passwd (final resolved path)
 *
 * This is important for security: a deny rule for /etc/passwd should block
 * access even if the file is actually at /private/etc/passwd (as on macOS).
 *
 * @param path - The path to check (will be converted to absolute)
 * @returns An array of absolute paths to check permissions for
 */
// getPathsForPermissionCheck 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPathsForPermissionCheck(inputPath: string): string[] {
  // Expand tilde notation defensively - tools should do this in getPath(),
  // but we normalize here as defense in depth for permission checking
  // 路径保存`inputPath`，供共享工具 fs Operations后续判断或输出使用。
  let path = inputPath
  // 当 `path` 匹配 `'~'` 时，共享工具执行对应分支。
  if (path === '~') {
    // 路径更新为 `homedir().normalize('NFC')`，确保共享工具后续读取最新状态。
    path = homedir().normalize('NFC')
  // 共享工具 fs Operations在这里处理 `} else if (path.startsWith('~/')) {`，完成这一小步状态转换。
  } else if (path.startsWith('~/')) {
    // 路径更新为 `nodePath.join(homedir().normalize('NFC'), path.slice(2))`，确保共享工具后续读取最新状态。
    path = nodePath.join(homedir().normalize('NFC'), path.slice(2))
  }

  // pathSet 路径数据构建`new Set<string>()`，供后续判断或组装使用。
  const pathSet = new Set<string>()
  // fsImpl读取`getFsImplementation`，供共享工具后续处理使用。
  const fsImpl = getFsImplementation()

  // Always check the original path
  // 调用 pathSet.add，触发共享工具此处需要的副作用。
  pathSet.add(path)

  // Block UNC paths before any filesystem access to prevent network
  // requests (DNS/SMB) during validation on Windows
  // 只有 `path.startsWith('//') || path.startsWith('\\\\')` 满足时，共享工具才执行该分支。
  if (path.startsWith('//') || path.startsWith('\\\\')) {
    // 返回 `Array.from(pathSet)`，作为共享工具这次计算的结果。
    return Array.from(pathSet)
  }

  // Follow the symlink chain, collecting ALL intermediate targets
  // This handles cases like: test.txt -> /etc/passwd -> /private/etc/passwd
  // We want to check all three paths, not just test.txt and /private/etc/passwd
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // currentPath 路径数据 命名 `path`，让后续代码直接表达这个值的用途。
    let currentPath = path
    // visited 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
    const visited = new Set<string>()
    // maxDepth保存`40 // Prevent runaway loops, matches typical SYMLOOP_MAX`，供后续判断或组装使用。
    const maxDepth = 40 // Prevent runaway loops, matches typical SYMLOOP_MAX

    // 按索引扫描 `maxDepth`，需要消费相邻参数时可以精确移动游标。
    for (let depth = 0; depth < maxDepth; depth++) {
      // Prevent infinite loops from circular symlinks
      // 满足 `visited.has(currentPath)` 时，共享工具执行该分支。
      if (visited.has(currentPath)) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }
      // 调用 visited.add，触发共享工具此处需要的副作用。
      visited.add(currentPath)

      // 满足 `!fsImpl.existsSync(currentPath)` 时，共享工具执行该分支。
      if (!fsImpl.existsSync(currentPath)) {
        // Path doesn't exist (new file case). existsSync follows symlinks,
        // so this is also reached for DANGLING symlinks (link entry exists,
        // target doesn't). Resolve symlinks in the path and its ancestors
        // so permission checks see the real destination. Without this,
        // `./data -> /etc/cron.d/` (live parent symlink) or
        // `./evil.txt -> ~/.ssh/authorized_keys2` (dangling file symlink)
        // would allow writes that escape the working directory.
        // 满足 `currentPath === path` 时，共享工具执行该分支。
        if (currentPath === path) {
          // resolved读取`resolveDeepestExistingAncestorSync`，供共享工具后续处理使用。
          const resolved = resolveDeepestExistingAncestorSync(fsImpl, path)
          // `resolved` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
          if (resolved !== undefined) {
            // 调用 pathSet.add，触发共享工具此处需要的副作用。
            pathSet.add(resolved)
          }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }

      // stats 集合保存`fsImpl.lstatSync`，供共享工具后续处理使用。
      const stats = fsImpl.lstatSync(currentPath)

      // Skip special file types that can cause issues
      // 共享工具在这里按实际状态进入对应分支。
      if (
        stats.isFIFO() ||
        stats.isSocket() ||
        stats.isCharacterDevice() ||
        stats.isBlockDevice()
      ) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }

      // 满足 `!stats.isSymbolicLink()` 时，共享工具执行该分支。
      if (!stats.isSymbolicLink()) {
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }

      // Get the immediate symlink target
      // target读取`fsImpl.readlinkSync`，供共享工具后续处理使用。
      const target = fsImpl.readlinkSync(currentPath)

      // If target is relative, resolve it relative to the symlink's directory
      // absoluteTarget保存`nodePath.isAbsolute`，供共享工具后续处理使用。
      const absoluteTarget = nodePath.isAbsolute(target)
        ? target
        : nodePath.resolve(nodePath.dirname(currentPath), target)

      // Add this intermediate target to the set
      // 调用 pathSet.add，触发共享工具此处需要的副作用。
      pathSet.add(absoluteTarget)
      // currentPath 路径数据更新为 `absoluteTarget`，确保共享工具后续读取最新状态。
      currentPath = absoluteTarget
    }
  } catch {
    // If anything fails during chain traversal, continue with what we have
  }

  // Also add the final resolved path using realpathSync for completeness
  // This handles any remaining symlinks in directory components
  // 从 `safeResolvePath(fsImpl, path)` 解构 resolvedPath、isSymlink，减少共享工具 fs Operations对同一对象的重复访问。
  const { resolvedPath, isSymlink } = safeResolvePath(fsImpl, path)
  // `isSymlink && resolvedPath` 与 `path` 不一致时刷新派生状态，避免使用过期结果。
  if (isSymlink && resolvedPath !== path) {
    // 调用 pathSet.add，触发共享工具此处需要的副作用。
    pathSet.add(resolvedPath)
  }

  // 返回 `Array.from(pathSet)`，作为共享工具这次计算的结果。
  return Array.from(pathSet)
}

// NodeFsOperations 集合 集中保存共享工具 fs Operations要一起传递的字段。
export const NodeFsOperations: FsOperations = {
  // cwd 使用 无 完成共享工具里的对应操作。
  cwd() {
    // 返回 `process.cwd()`，作为共享工具这次计算的结果。
    return process.cwd()
  },

  // existsSync 使用 fsPath 完成共享工具里的对应操作。
  existsSync(fsPath) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.existsSync(${fsPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.existsSync(${fsPath})`
    // 返回 `fs.existsSync(fsPath)`，作为共享工具这次计算的结果。
    return fs.existsSync(fsPath)
  },

  // stat 使用 fsPath 完成共享工具里的对应操作。
  async stat(fsPath) {
    // 返回 `statPromise(fsPath)`，作为共享工具这次计算的结果。
    return statPromise(fsPath)
  },

  // readdir 使用 fsPath 完成共享工具里的对应操作。
  async readdir(fsPath) {
    // 返回 `readdirPromise(fsPath, { withFileTypes: true })`，作为共享工具这次计算的结果。
    return readdirPromise(fsPath, { withFileTypes: true })
  },

  // unlink 使用 fsPath 完成共享工具里的对应操作。
  async unlink(fsPath) {
    // 返回 `unlinkPromise(fsPath)`，作为共享工具这次计算的结果。
    return unlinkPromise(fsPath)
  },

  // rmdir 使用 fsPath 完成共享工具里的对应操作。
  async rmdir(fsPath) {
    // 返回 `rmdirPromise(fsPath)`，作为共享工具这次计算的结果。
    return rmdirPromise(fsPath)
  },

  // rm 使用 fsPath, options 完成共享工具里的对应操作。
  async rm(fsPath, options) {
    // 返回 `rmPromise(fsPath, options)`，作为共享工具这次计算的结果。
    return rmPromise(fsPath, options)
  },

  // mkdir 使用 dirPath, options 完成共享工具里的对应操作。
  async mkdir(dirPath, options) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `mkdirPromise(dirPath, { recursive: true, ...options })` 完成，再继续共享工具 fs Operations的异步流程。
      await mkdirPromise(dirPath, { recursive: true, ...options })
    } catch (e) {
      // Bun/Windows: recursive:true throws EEXIST on directories with the
      // FILE_ATTRIBUTE_READONLY bit set (Group Policy, OneDrive, desktop.ini).
      // Bun's directoryExistsAt misclassifies DIRECTORY+READONLY as not-a-dir
      // (bun-internal src/sys.zig existsAtType). The dir exists; ignore.
      // https://github.com/anthropics/claude-code/issues/30924
      // `getErrnoCode(e)` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
      if (getErrnoCode(e) !== 'EEXIST') throw e
    }
  },

  // readFile 使用 fsPath, options 完成共享工具里的对应操作。
  async readFile(fsPath, options) {
    // 返回 `readFilePromise(fsPath, { encoding: options.encoding })`，作为共享工具这次计算的结果。
    return readFilePromise(fsPath, { encoding: options.encoding })
  },

  // rename 使用 oldPath, newPath 完成共享工具里的对应操作。
  async rename(oldPath, newPath) {
    // 返回 `renamePromise(oldPath, newPath)`，作为共享工具这次计算的结果。
    return renamePromise(oldPath, newPath)
  },

  // statSync 使用 fsPath 完成共享工具里的对应操作。
  statSync(fsPath) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.statSync(${fsPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.statSync(${fsPath})`
    // 返回 `fs.statSync(fsPath)`，作为共享工具这次计算的结果。
    return fs.statSync(fsPath)
  },

  // lstatSync 使用 fsPath 完成共享工具里的对应操作。
  lstatSync(fsPath) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.lstatSync(${fsPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.lstatSync(${fsPath})`
    // 返回 `fs.lstatSync(fsPath)`，作为共享工具这次计算的结果。
    return fs.lstatSync(fsPath)
  },

  // readFileSync 使用 fsPath, options 完成共享工具里的对应操作。
  readFileSync(fsPath, options) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.readFileSync(${fsPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.readFileSync(${fsPath})`
    // 返回 `fs.readFileSync(fsPath, { encoding: options.encoding })`，作为共享工具这次计算的结果。
    return fs.readFileSync(fsPath, { encoding: options.encoding })
  },

  // readFileBytesSync 使用 fsPath 完成共享工具里的对应操作。
  readFileBytesSync(fsPath) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.readFileBytesSync(${fsPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.readFileBytesSync(${fsPath})`
    // 返回 `fs.readFileSync(fsPath)`，作为共享工具这次计算的结果。
    return fs.readFileSync(fsPath)
  },

  // readSync 使用 fsPath, options 完成共享工具里的对应操作。
  readSync(fsPath, options) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.readSync(${fsPath}, ${options.length} bytes)``，完成这一小步状态转换。
    using _ = slowLogging`fs.readSync(${fsPath}, ${options.length} bytes)`
    // fd保存`undefined`，作为后续未定义值处理的输入。
    let fd: number | undefined = undefined
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // fd更新为 `fs.openSync(fsPath, 'r')`，确保共享工具后续读取最新状态。
      fd = fs.openSync(fsPath, 'r')
      // buffer保存`Buffer.alloc`，供共享工具后续处理使用。
      const buffer = Buffer.alloc(options.length)
      // bytesRead读取`fs.readSync`，供共享工具后续处理使用。
      const bytesRead = fs.readSync(fd, buffer, 0, options.length, 0)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { buffer, bytesRead }
    } finally {
      // 满足 `fd) fs.closeSync(fd` 时，共享工具执行该分支。
      if (fd) fs.closeSync(fd)
    }
  },

  // appendFileSync 使用 path, data, options 完成共享工具里的对应操作。
  appendFileSync(path, data, options) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.appendFileSync(${path}, ${data.length} chars)``，完成这一小步状态转换。
    using _ = slowLogging`fs.appendFileSync(${path}, ${data.length} chars)`
    // For new files with explicit mode, use 'ax' (atomic create-with-mode) to avoid
    // TOCTOU race between existence check and open. Fall back to normal append if exists.
    // `options?.mode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (options?.mode !== undefined) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // fd保存`fs.openSync`，供共享工具后续处理使用。
        const fd = fs.openSync(path, 'ax', options.mode)
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 调用 fs.appendFileSync，触发共享工具此处需要的副作用。
          fs.appendFileSync(fd, data)
        } finally {
          // 调用 fs.closeSync，触发共享工具此处需要的副作用。
          fs.closeSync(fd)
        }
        // 共享工具 fs Operations在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      } catch (e) {
        // `getErrnoCode(e)` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
        if (getErrnoCode(e) !== 'EEXIST') throw e
        // File exists — fall through to normal append
      }
    }
    // 调用 fs.appendFileSync，触发共享工具此处需要的副作用。
    fs.appendFileSync(path, data)
  },

  // copyFileSync 使用 src, dest 完成共享工具里的对应操作。
  copyFileSync(src, dest) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.copyFileSync(${src} → ${dest})``，完成这一小步状态转换。
    using _ = slowLogging`fs.copyFileSync(${src} → ${dest})`
    // 调用 fs.copyFileSync，触发共享工具此处需要的副作用。
    fs.copyFileSync(src, dest)
  },

  // unlinkSync 使用 path: string 完成共享工具里的对应操作。
  unlinkSync(path: string) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.unlinkSync(${path})``，完成这一小步状态转换。
    using _ = slowLogging`fs.unlinkSync(${path})`
    // 调用 fs.unlinkSync，触发共享工具此处需要的副作用。
    fs.unlinkSync(path)
  },

  // renameSync 使用 oldPath: string, newPath: string 完成共享工具里的对应操作。
  renameSync(oldPath: string, newPath: string) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.renameSync(${oldPath} → ${newPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.renameSync(${oldPath} → ${newPath})`
    // 调用 fs.renameSync，触发共享工具此处需要的副作用。
    fs.renameSync(oldPath, newPath)
  },

  // linkSync 使用 target: string, path: string 完成共享工具里的对应操作。
  linkSync(target: string, path: string) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.linkSync(${target} → ${path})``，完成这一小步状态转换。
    using _ = slowLogging`fs.linkSync(${target} → ${path})`
    // 调用 fs.linkSync，触发共享工具此处需要的副作用。
    fs.linkSync(target, path)
  },

  // 调用 symlinkSync，触发共享工具此处需要的副作用。
  symlinkSync(
    target: string,
    path: string,
    type?: 'dir' | 'file' | 'junction',
  ) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.symlinkSync(${target} → ${path})``，完成这一小步状态转换。
    using _ = slowLogging`fs.symlinkSync(${target} → ${path})`
    // 调用 fs.symlinkSync，触发共享工具此处需要的副作用。
    fs.symlinkSync(target, path, type)
  },

  // readlinkSync 使用 path: string 完成共享工具里的对应操作。
  readlinkSync(path: string) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.readlinkSync(${path})``，完成这一小步状态转换。
    using _ = slowLogging`fs.readlinkSync(${path})`
    // 返回 `fs.readlinkSync(path)`，作为共享工具这次计算的结果。
    return fs.readlinkSync(path)
  },

  // realpathSync 使用 path: string 完成共享工具里的对应操作。
  realpathSync(path: string) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.realpathSync(${path})``，完成这一小步状态转换。
    using _ = slowLogging`fs.realpathSync(${path})`
    // 返回 `fs.realpathSync(path).normalize('NFC')`，作为共享工具这次计算的结果。
    return fs.realpathSync(path).normalize('NFC')
  },

  // mkdirSync 使用 dirPath, options 完成共享工具里的对应操作。
  mkdirSync(dirPath, options) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.mkdirSync(${dirPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.mkdirSync(${dirPath})`
    // mkdirOptions 集合 集中保存共享工具 fs Operations要一起传递的字段。
    const mkdirOptions: { recursive: boolean; mode?: number } = {
      recursive: true,
    }
    // `options?.mode` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (options?.mode !== undefined) {
      // mode更新为 `options.mode`，确保共享工具后续读取最新状态。
      mkdirOptions.mode = options.mode
    }
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 调用 fs.mkdirSync，触发共享工具此处需要的副作用。
      fs.mkdirSync(dirPath, mkdirOptions)
    } catch (e) {
      // Bun/Windows: recursive:true throws EEXIST on directories with the
      // FILE_ATTRIBUTE_READONLY bit set (Group Policy, OneDrive, desktop.ini).
      // Bun's directoryExistsAt misclassifies DIRECTORY+READONLY as not-a-dir
      // (bun-internal src/sys.zig existsAtType). The dir exists; ignore.
      // https://github.com/anthropics/claude-code/issues/30924
      // `getErrnoCode(e)` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
      if (getErrnoCode(e) !== 'EEXIST') throw e
    }
  },

  // readdirSync 使用 dirPath 完成共享工具里的对应操作。
  readdirSync(dirPath) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.readdirSync(${dirPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.readdirSync(${dirPath})`
    // 返回 `fs.readdirSync(dirPath, { withFileTypes: true })`，作为共享工具这次计算的结果。
    return fs.readdirSync(dirPath, { withFileTypes: true })
  },

  // readdirStringSync 使用 dirPath 完成共享工具里的对应操作。
  readdirStringSync(dirPath) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.readdirStringSync(${dirPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.readdirStringSync(${dirPath})`
    // 返回 `fs.readdirSync(dirPath)`，作为共享工具这次计算的结果。
    return fs.readdirSync(dirPath)
  },

  // isDirEmptySync 用 dirPath 判断共享工具是否满足条件。
  isDirEmptySync(dirPath) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.isDirEmptySync(${dirPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.isDirEmptySync(${dirPath})`
    // files 文件数据读取`this.readdirSync`，供共享工具后续处理使用。
    const files = this.readdirSync(dirPath)
    // 返回 `files.length === 0`，作为共享工具这次计算的结果。
    return files.length === 0
  },

  // rmdirSync 使用 dirPath 完成共享工具里的对应操作。
  rmdirSync(dirPath) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.rmdirSync(${dirPath})``，完成这一小步状态转换。
    using _ = slowLogging`fs.rmdirSync(${dirPath})`
    // 调用 fs.rmdirSync，触发共享工具此处需要的副作用。
    fs.rmdirSync(dirPath)
  },

  // rmSync 使用 path, options 完成共享工具里的对应操作。
  rmSync(path, options) {
    // 共享工具 fs Operations在这里处理 `using _ = slowLogging`fs.rmSync(${path})``，完成这一小步状态转换。
    using _ = slowLogging`fs.rmSync(${path})`
    // 调用 fs.rmSync，触发共享工具此处需要的副作用。
    fs.rmSync(path, options)
  },

  // createWriteStream 使用 path: string 完成共享工具里的对应操作。
  createWriteStream(path: string) {
    // 返回 `fs.createWriteStream(path)`，作为共享工具这次计算的结果。
    return fs.createWriteStream(path)
  },

  // readFileBytes 使用 fsPath: string, maxBytes?: number 完成共享工具里的对应操作。
  async readFileBytes(fsPath: string, maxBytes?: number) {
    // 满足 `maxBytes === undefined` 时，共享工具执行该分支。
    if (maxBytes === undefined) {
      // 返回 `readFilePromise(fsPath)`，作为共享工具这次计算的结果。
      return readFilePromise(fsPath)
    }
    // handle保存`open`，供共享工具后续处理使用。
    const handle = await open(fsPath, 'r')
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 从 `await handle.stat()` 解构 size，减少共享工具 fs Operations对同一对象的重复访问。
      const { size } = await handle.stat()
      // readSize保存`Math.min`，供共享工具后续处理使用。
      const readSize = Math.min(size, maxBytes)
      // buffer保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
      const buffer = Buffer.allocUnsafe(readSize)
      // offset保存`0`，供后续判断或组装使用。
      let offset = 0
      // while 使用 offset < readSize 完成共享工具里的对应操作。
      while (offset < readSize) {
        // 从 `await handle.read(` 解构 bytesRead，减少共享工具 fs Operations对同一对象的重复访问。
        const { bytesRead } = await handle.read(
          buffer,
          offset,
          readSize - offset,
          offset,
        )
        // 满足 `bytesRead === 0` 时，共享工具执行该分支。
        if (bytesRead === 0) break
        // 共享工具 fs Operations在这里处理 `offset += bytesRead`，完成这一小步状态转换。
        offset += bytesRead
      }
      // 返回 `offset < readSize ? buffer.subarray(0, offset) : buffer`，作为共享工具这次计算的结果。
      return offset < readSize ? buffer.subarray(0, offset) : buffer
    } finally {
      // 等待 `handle.close()` 完成，再继续共享工具 fs Operations的异步流程。
      await handle.close()
    }
  },
}

// The currently active filesystem implementation
// activeFs 集合保存`NodeFsOperations`，供后续判断或组装使用。
let activeFs: FsOperations = NodeFsOperations

/**
 * Overrides the filesystem implementation. Note: This function does not
 * automatically update cwd.
 * @param implementation The filesystem implementation to use
 */
// setFsImplementation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setFsImplementation(implementation: FsOperations): void {
  // activeFs 集合更新为 `implementation`，确保共享工具后续读取最新状态。
  activeFs = implementation
}

/**
 * Gets the currently active filesystem implementation
 * @returns The currently active filesystem implementation
 */
// getFsImplementation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFsImplementation(): FsOperations {
  // 返回 `activeFs`，作为共享工具这次计算的结果。
  return activeFs
}

/**
 * Resets the filesystem implementation to the default Node.js implementation.
 * Note: This function does not automatically update cwd.
 */
// setOriginalFsImplementation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setOriginalFsImplementation(): void {
  // activeFs 集合更新为 `NodeFsOperations`，确保共享工具后续读取最新状态。
  activeFs = NodeFsOperations
}

// ReadFileRangeResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReadFileRangeResult = {
  content: string
  bytesRead: number
  bytesTotal: number
}

/**
 * Read up to `maxBytes` from a file starting at `offset`.
 * Returns a flat string from Buffer — no sliced string references to a
 * larger parent. Returns null if the file is smaller than the offset.
 */
// readFileRange 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readFileRange(
  path: string,
  offset: number,
  maxBytes: number,
): Promise<ReadFileRangeResult | null> {
  // 等待 `using fh = await open(path, 'r')` 完成，再继续共享工具 fs Operations的异步流程。
  await using fh = await open(path, 'r')
  // size保存`fh.stat`，供共享工具后续处理使用。
  const size = (await fh.stat()).size
  // 满足 `size <= offset` 时，共享工具执行该分支。
  if (size <= offset) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // bytesToRead保存`Math.min`，供共享工具后续处理使用。
  const bytesToRead = Math.min(size - offset, maxBytes)
  // buffer保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
  const buffer = Buffer.allocUnsafe(bytesToRead)

  // totalRead保存`0`，供后续判断或组装使用。
  let totalRead = 0
  // while 使用 totalRead < bytesToRead 完成共享工具里的对应操作。
  while (totalRead < bytesToRead) {
    // 从 `await fh.read(` 解构 bytesRead，减少共享工具 fs Operations对同一对象的重复访问。
    const { bytesRead } = await fh.read(
      buffer,
      totalRead,
      bytesToRead - totalRead,
      offset + totalRead,
    )
    // 满足 `bytesRead === 0` 时，共享工具执行该分支。
    if (bytesRead === 0) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 共享工具 fs Operations在这里处理 `totalRead += bytesRead`，完成这一小步状态转换。
    totalRead += bytesRead
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    content: buffer.toString('utf8', 0, totalRead),
    bytesRead: totalRead,
    bytesTotal: size,
  }
}

/**
 * Read the last `maxBytes` of a file.
 * Returns the whole file if it's smaller than maxBytes.
 */
// tailFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tailFile(
  path: string,
  maxBytes: number,
): Promise<ReadFileRangeResult> {
  // 等待 `using fh = await open(path, 'r')` 完成，再继续共享工具 fs Operations的异步流程。
  await using fh = await open(path, 'r')
  // size保存`fh.stat`，供共享工具后续处理使用。
  const size = (await fh.stat()).size
  // 满足 `size === 0` 时，共享工具执行该分支。
  if (size === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { content: '', bytesRead: 0, bytesTotal: 0 }
  }
  // offset保存`Math.max`，供共享工具后续处理使用。
  const offset = Math.max(0, size - maxBytes)
  // bytesToRead 命名 `size - offset`，让后续代码直接表达这个值的用途。
  const bytesToRead = size - offset
  // buffer保存`Buffer.allocUnsafe`，供共享工具后续处理使用。
  const buffer = Buffer.allocUnsafe(bytesToRead)

  // totalRead保存`0`，供后续判断或组装使用。
  let totalRead = 0
  // while 使用 totalRead < bytesToRead 完成共享工具里的对应操作。
  while (totalRead < bytesToRead) {
    // 从 `await fh.read(` 解构 bytesRead，减少共享工具 fs Operations对同一对象的重复访问。
    const { bytesRead } = await fh.read(
      buffer,
      totalRead,
      bytesToRead - totalRead,
      offset + totalRead,
    )
    // 满足 `bytesRead === 0` 时，共享工具执行该分支。
    if (bytesRead === 0) {
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    // 共享工具 fs Operations在这里处理 `totalRead += bytesRead`，完成这一小步状态转换。
    totalRead += bytesRead
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    content: buffer.toString('utf8', 0, totalRead),
    bytesRead: totalRead,
    bytesTotal: size,
  }
}

/**
 * Async generator that yields lines from a file in reverse order.
 * Reads the file backwards in chunks to avoid loading the entire file into memory.
 * @param path - The path to the file to read
 * @returns An async generator that yields lines in reverse order
 */
// 共享工具 fs Operations在这里处理 `export async function* readLinesReverse(`，完成这一小步状态转换。
export async function* readLinesReverse(
  path: string,
): AsyncGenerator<string, void, undefined> {
  // CHUNK_SIZE 命名 `1024 * 4`，让后续代码直接表达这个值的用途。
  const CHUNK_SIZE = 1024 * 4
  // fileHandle 文件数据保存`open`，供共享工具后续处理使用。
  const fileHandle = await open(path, 'r')
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`fileHandle.stat`，供共享工具后续处理使用。
    const stats = await fileHandle.stat()
    // position 命名 `stats.size`，让后续代码直接表达这个值的用途。
    let position = stats.size
    // Carry raw bytes (not a decoded string) across chunk boundaries so that
    // multi-byte UTF-8 sequences split by the 4KB boundary are not corrupted.
    // Decoding per-chunk would turn a split sequence into U+FFFD on both sides,
    // which for history.jsonl means JSON.parse throws and the entry is dropped.
    // remainder保存`Buffer.alloc`，供共享工具后续处理使用。
    let remainder = Buffer.alloc(0)
    // buffer保存`Buffer.alloc`，供共享工具后续处理使用。
    const buffer = Buffer.alloc(CHUNK_SIZE)

    // while 使用 position > 0 完成共享工具里的对应操作。
    while (position > 0) {
      // currentChunkSize保存`Math.min`，供共享工具后续处理使用。
      const currentChunkSize = Math.min(CHUNK_SIZE, position)
      // 共享工具 fs Operations在这里处理 `position -= currentChunkSize`，完成这一小步状态转换。
      position -= currentChunkSize

      // 等待 `fileHandle.read(buffer, 0, currentChunkSize, position)` 完成，再继续共享工具 fs Operations的异步流程。
      await fileHandle.read(buffer, 0, currentChunkSize, position)
      // combined保存`Buffer.concat`，供共享工具后续处理使用。
      const combined = Buffer.concat([
        buffer.subarray(0, currentChunkSize),
        remainder,
      ])

      // firstNewline保存`combined.indexOf`，供共享工具后续处理使用。
      const firstNewline = combined.indexOf(0x0a)
      // 满足 `firstNewline === -1` 时，共享工具执行该分支。
      if (firstNewline === -1) {
        // remainder更新为 `combined`，确保共享工具后续读取最新状态。
        remainder = combined
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // remainder更新为 `Buffer.from(combined.subarray(0, firstNewline))`，确保共享工具后续读取最新状态。
      remainder = Buffer.from(combined.subarray(0, firstNewline))
      // 文本行格式化`combined.toString`，供共享工具后续处理使用。
      const lines = combined.toString('utf8', firstNewline + 1).split('\n')

      // 循环处理 `let i = lines.length - 1; i >= 0; i--`，让共享工具逐项把同类条目按顺序走完。
      for (let i = lines.length - 1; i >= 0; i--) {
        // line读取 `lines[i]!` 对应条目，后续围绕该成员继续处理。
        const line = lines[i]!
        // 满足 `line` 时，共享工具执行该分支。
        if (line) {
          // 生成器产出 `line`，把阶段性结果交给上层消费。
          yield line
        }
      }
    }

    // 满足 `remainder.length > 0` 时，共享工具执行该分支。
    if (remainder.length > 0) {
      // 生成器产出 `remainder.toString('utf8')`，把阶段性结果交给上层消费。
      yield remainder.toString('utf8')
    }
  } finally {
    // 等待 `fileHandle.close()` 完成，再继续共享工具 fs Operations的异步流程。
    await fileHandle.close()
  }
}

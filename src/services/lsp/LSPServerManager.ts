// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 引入 pathToFileURL，将 url 中已经封装好的能力接到本文件流程里。
import { pathToFileURL } from 'url'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 引入 getAllLspServers，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getAllLspServers } from './config.js'
// 整理这一组导入，让服务层 LSPServer Manager后续逻辑可以直接复用这些外部能力。
import {
  createLSPServerInstance,
  type LSPServerInstance,
} from './LSPServerInstance.js'
// 类型依赖 { ScopedLspServerConfig } 来自 ./types.js，用于校准服务层 LSPServer Manager的数据契约。
import type { ScopedLspServerConfig } from './types.js'
/**
 * LSP Server Manager interface returned by createLSPServerManager.
 * Manages multiple LSP server instances and routes requests based on file extensions.
 */
// LSPServerManager 固化服务层 LSPServer Manager里传递的数据形状，帮助调用方按同一结构读写字段。
export type LSPServerManager = {
  /** Initialize the manager by loading all configured LSP servers */
  initialize(): Promise<void>
  /** Shutdown all running servers and clear state */
  shutdown(): Promise<void>
  /** Get the LSP server instance for a given file path */
  // getServerForFile 根据 filePath: string 读取或计算服务层 LSPServer Manager需要的结果。
  getServerForFile(filePath: string): LSPServerInstance | undefined
  /** Ensure the appropriate LSP server is started for the given file */
  // ensureServerStarted 使用 filePath: string 完成服务层 LSPServer Manager里的对应操作。
  ensureServerStarted(filePath: string): Promise<LSPServerInstance | undefined>
  /** Send a request to the appropriate LSP server for the given file */
  // 服务层 LSPServer Manager在这里处理 `sendRequest<T>(`，完成这一小步状态转换。
  sendRequest<T>(
    filePath: string,
    method: string,
    params: unknown,
  ): Promise<T | undefined>
  /** Get all running server instances */
  // getAllServers不依赖额外参数，直接计算服务层 LSPServer Manager需要的结果。
  getAllServers(): Map<string, LSPServerInstance>
  /** Synchronize file open to LSP server (sends didOpen notification) */
  // openFile 使用 filePath: string, content: string 完成服务层 LSPServer Manager里的对应操作。
  openFile(filePath: string, content: string): Promise<void>
  /** Synchronize file change to LSP server (sends didChange notification) */
  // changeFile 使用 filePath: string, content: string 完成服务层 LSPServer Manager里的对应操作。
  changeFile(filePath: string, content: string): Promise<void>
  /** Synchronize file save to LSP server (sends didSave notification) */
  // saveFile 使用 filePath: string 完成服务层 LSPServer Manager里的对应操作。
  saveFile(filePath: string): Promise<void>
  /** Synchronize file close to LSP server (sends didClose notification) */
  // closeFile 使用 filePath: string 完成服务层 LSPServer Manager里的对应操作。
  closeFile(filePath: string): Promise<void>
  /** Check if a file is already open on a compatible LSP server */
  // isFileOpen 用 filePath: string 判断服务层 LSPServer Manager是否满足条件。
  isFileOpen(filePath: string): boolean
}

/**
 * Creates an LSP server manager instance.
 *
 * Manages multiple LSP server instances and routes requests based on file extensions.
 * Uses factory function pattern with closures for state encapsulation (avoiding classes).
 *
 * @returns LSP server manager instance
 *
 * @example
 * const manager = createLSPServerManager()
 * await manager.initialize()
 * const result = await manager.sendRequest('/path/to/file.ts', 'textDocument/definition', params)
 * await manager.shutdown()
 */
// createLSPServerManager 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createLSPServerManager(): LSPServerManager {
  // Private state managed via closures
  // servers 集合 用 Map 保存键值关系，方便服务层 LSPServer Manager按 key 查找和复用。
  const servers: Map<string, LSPServerInstance> = new Map()
  // extensionMap 用 Map 保存键值关系，方便服务层 LSPServer Manager按 key 查找和复用。
  const extensionMap: Map<string, string[]> = new Map()
  // Track which files have been opened on which servers (URI -> server name)
  // openedFiles 文件数据 用 Map 保存键值关系，方便服务层 LSPServer Manager按 key 查找和复用。
  const openedFiles: Map<string, string> = new Map()

  /**
   * Initialize the manager by loading all configured LSP servers.
   *
   * @throws {Error} If configuration loading fails
   */
  // initialize 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function initialize(): Promise<void> {
    // serverConfigs 配置 先占位，稍后的条件分支会根据实际输入补齐它。
    let serverConfigs: Record<string, ScopedLspServerConfig>

    // 保护这一段可能失败的服务层 LSPServer Manager操作，确保异常能进入相邻错误处理。
    try {
      // 结果读取`getAllLspServers`，供服务层 LSPServer Manager后续处理使用。
      const result = await getAllLspServers()
      // serverConfigs 配置更新为 `result.servers`，确保服务层后续读取最新状态。
      serverConfigs = result.servers
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[LSP SERVER MANAGER] getAllLspServers returned ${Object.keys(serverConfigs).length} server(s)`,
      )
    } catch (error) {
      // err保存`error as Error`，供服务层 LSPServer Manager后续判断或输出使用。
      const err = error as Error
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(`Failed to load LSP server configuration: ${err.message}`),
      )
      // 抛出 error，阻止服务层 LSPServer Manager在无效状态下继续运行。
      throw error
    }

    // Build extension → server mapping
    // 循环处理 `const [serverName, config] of Object.entries(serverConfigs)`，让服务层 LSPServer Manager把同类条目按顺序走完。
    for (const [serverName, config] of Object.entries(serverConfigs)) {
      // 保护这一段可能失败的服务层 LSPServer Manager操作，确保异常能进入相邻错误处理。
      try {
        // Validate config before using it
        // config.command 命令数据缺失时提前走兜底路径，避免服务层 LSPServer Manager继续依赖无效输入。
        if (!config.command) {
          // 抛出 new Error(，阻止服务层 LSPServer Manager在无效状态下继续运行。
          throw new Error(
            `Server ${serverName} missing required 'command' field`,
          )
        }
        // 服务层 LSPServer Manager在这里进入条件判断，后续代码按实际状态分流。
        if (
          !config.extensionToLanguage ||
          Object.keys(config.extensionToLanguage).length === 0
        ) {
          // 抛出 new Error(，阻止服务层 LSPServer Manager在无效状态下继续运行。
          throw new Error(
            `Server ${serverName} missing required 'extensionToLanguage' field`,
          )
        }

        // Map file extensions to this server (derive from extensionToLanguage)
        // fileExtensions 文件数据派生`Object.keys`，供服务层 LSPServer Manager后续处理使用。
        const fileExtensions = Object.keys(config.extensionToLanguage)
        // 按顺序遍历 `fileExtensions` 中的ext，逐个交给服务层 LSPServer Manager处理。
        for (const ext of fileExtensions) {
          // normalized保存`ext.toLowerCase`，供服务层 LSPServer Manager后续处理使用。
          const normalized = ext.toLowerCase()
          // 满足 `!extensionMap.has(normalized)` 时，服务层 LSPServer Manager执行该分支。
          if (!extensionMap.has(normalized)) {
            // extensionMap.set 写入新的状态值，使服务层 LSPServer Manager后续读取保持一致。
            extensionMap.set(normalized, [])
          }
          // serverList 集合读取`extensionMap.get`，供服务层 LSPServer Manager后续处理使用。
          const serverList = extensionMap.get(normalized)
          // 满足 `serverList` 时，服务层 LSPServer Manager执行该分支。
          if (serverList) {
            // serverList 集合追加新条目，保持收集顺序与输入顺序一致。
            serverList.push(serverName)
          }
        }

        // Create server instance
        // instance构建`createLSPServerInstance`，供服务层 LSPServer Manager后续处理使用。
        const instance = createLSPServerInstance(serverName, config)
        // servers.set 写入新的状态值，使服务层 LSPServer Manager后续读取保持一致。
        servers.set(serverName, instance)

        // Register handler for workspace/configuration requests from the server
        // Some servers (like TypeScript) send these even when we say we don't support them
        // 调用 instance.onRequest，触发服务层 LSPServer Manager此处需要的副作用。
        instance.onRequest(
          'workspace/configuration',
          // 这个回调绑定到 (params: { items: Array<{ section?: string }> }) => {，负责服务层 LSPServer Manager在该局部场景下的响应。
          (params: { items: Array<{ section?: string }> }) => {
            // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `LSP: Received workspace/configuration request from ${serverName}`,
            )
            // Return empty/null config for each requested item
            // This satisfies the protocol without providing actual configuration
            // 返回 `params.items.map(() => null)`，作为服务层 LSPServer Manager这次计算的结果。
            return params.items.map(() => null)
          },
        )
      } catch (error) {
        // err保存`error as Error`，供服务层 LSPServer Manager后续判断或输出使用。
        const err = error as Error
        // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `Failed to initialize LSP server ${serverName}: ${err.message}`,
          ),
        )
        // Continue with other servers - don't fail entire initialization
      }
    }

    // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`LSP manager initialized with ${servers.size} servers`)
  }

  /**
   * Shutdown all running servers and clear state.
   * Only servers in 'running' state are explicitly stopped;
   * servers in other states are cleared without shutdown.
   *
   * @throws {Error} If one or more servers fail to stop
   */
  // shutdown 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function shutdown(): Promise<void> {
    // toStop保存`Array.from`，供服务层 LSPServer Manager后续处理使用。
    const toStop = Array.from(servers.entries()).filter(
      ([, s]) => s.state === 'running' || s.state === 'error',
    )

    // 结果列表保存`Promise.allSettled`，供服务层 LSPServer Manager后续处理使用。
    const results = await Promise.allSettled(
      // 调用 toStop.map，触发服务层 LSPServer Manager此处需要的副作用。
      toStop.map(([, server]) => server.stop()),
    )

    // 调用 servers.clear，触发服务层 LSPServer Manager此处需要的副作用。
    servers.clear()
    // 调用 extensionMap.clear，触发服务层 LSPServer Manager此处需要的副作用。
    extensionMap.clear()
    // 调用 openedFiles.clear，触发服务层 LSPServer Manager此处需要的副作用。
    openedFiles.clear()

    // 错误列表 命名 `results`，让后续代码直接表达这个值的用途。
    const errors = results
      // 链式调用 map，继续加工上一行在服务层 LSPServer Manager中产生的数据。
      .map((r, i) =>
        r.status === 'rejected'
          ? `${toStop[i]![0]}: ${errorMessage(r.reason)}`
          : null,
      )
      // 链式调用 filter，继续加工上一行在服务层 LSPServer Manager中产生的数据。
      .filter((e): e is string => e !== null)

    // 满足 `errors.length > 0` 时，服务层 LSPServer Manager执行该分支。
    if (errors.length > 0) {
      // err保存`Error`，供服务层 LSPServer Manager后续处理使用。
      const err = new Error(
        `Failed to stop ${errors.length} LSP server(s): ${errors.join('; ')}`,
      )
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // 抛出 err，阻止服务层 LSPServer Manager在无效状态下继续运行。
      throw err
    }
  }

  /**
   * Get the LSP server instance for a given file path.
   * If multiple servers handle the same extension, returns the first registered server.
   * Returns undefined if no server handles this file type.
   */
  // getServerForFile 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function getServerForFile(filePath: string): LSPServerInstance | undefined {
    // ext保存`path.extname`，供服务层 LSPServer Manager后续处理使用。
    const ext = path.extname(filePath).toLowerCase()
    // serverNames 集合读取`extensionMap.get`，供服务层 LSPServer Manager后续处理使用。
    const serverNames = extensionMap.get(ext)

    // !serverNames || serverNames 集合为空时立即返回或跳过，避免服务层 LSPServer Manager把空集合当成可处理内容。
    if (!serverNames || serverNames.length === 0) {
      // 返回 `undefined`，作为服务层 LSPServer Manager这次计算的结果。
      return undefined
    }

    // Use first server (can add priority later)
    // serverName保存`serverNames[0]`，供服务层 LSPServer Manager后续判断或输出使用。
    const serverName = serverNames[0]
    // serverName缺失时提前走兜底路径，避免服务层 LSPServer Manager继续依赖无效输入。
    if (!serverName) {
      // 返回 `undefined`，作为服务层 LSPServer Manager这次计算的结果。
      return undefined
    }

    // 返回 `servers.get(serverName)`，作为服务层 LSPServer Manager这次计算的结果。
    return servers.get(serverName)
  }

  /**
   * Ensure the appropriate LSP server is started for the given file.
   * Returns undefined if no server handles this file type.
   *
   * @throws {Error} If server fails to start
   */
  // ensureServerStarted 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function ensureServerStarted(
    filePath: string,
  ): Promise<LSPServerInstance | undefined> {
    // server读取`getServerForFile`，供服务层 LSPServer Manager后续处理使用。
    const server = getServerForFile(filePath)
    // server缺失时提前走兜底路径，避免服务层 LSPServer Manager继续依赖无效输入。
    if (!server) return undefined

    // 组合条件 `server.state === 'stopped' || server.state === 'e` 成立时，服务层 LSPServer Manager才启用这条专门路径。
    if (server.state === 'stopped' || server.state === 'error') {
      // 保护这一段可能失败的服务层 LSPServer Manager操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `server.start()` 完成，再继续服务层 LSPServer Manager的异步流程。
        await server.start()
      } catch (error) {
        // err保存`error as Error`，供服务层 LSPServer Manager后续判断或输出使用。
        const err = error as Error
        // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `Failed to start LSP server for file ${filePath}: ${err.message}`,
          ),
        )
        // 抛出 error，阻止服务层 LSPServer Manager在无效状态下继续运行。
        throw error
      }
    }

    // 返回 `server`，作为服务层 LSPServer Manager这次计算的结果。
    return server
  }

  /**
   * Send a request to the appropriate LSP server for the given file.
   * Returns undefined if no server handles this file type.
   *
   * @throws {Error} If server fails to start or request fails
   */
  // sendRequest 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function sendRequest<T>(
    filePath: string,
    method: string,
    params: unknown,
  ): Promise<T | undefined> {
    // server保存`ensureServerStarted`，供服务层 LSPServer Manager后续处理使用。
    const server = await ensureServerStarted(filePath)
    // server缺失时提前走兜底路径，避免服务层 LSPServer Manager继续依赖无效输入。
    if (!server) return undefined

    // 保护这一段可能失败的服务层 LSPServer Manager操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `server.sendRequest<T>(method, params)`，调用方直接接收异步结果。
      return await server.sendRequest<T>(method, params)
    } catch (error) {
      // err保存`error as Error`，供服务层 LSPServer Manager后续判断或输出使用。
      const err = error as Error
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `LSP request failed for file ${filePath}, method '${method}': ${err.message}`,
        ),
      )
      // 抛出 error，阻止服务层 LSPServer Manager在无效状态下继续运行。
      throw error
    }
  }

  // Return public interface
  // getAllServers 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function getAllServers(): Map<string, LSPServerInstance> {
    // 返回 `servers`，作为服务层 LSPServer Manager这次计算的结果。
    return servers
  }

  // openFile 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function openFile(filePath: string, content: string): Promise<void> {
    // server保存`ensureServerStarted`，供服务层 LSPServer Manager后续处理使用。
    const server = await ensureServerStarted(filePath)
    // server缺失时提前走兜底路径，避免服务层 LSPServer Manager继续依赖无效输入。
    if (!server) return

    // fileUri 文件数据保存`pathToFileURL`，供服务层 LSPServer Manager后续处理使用。
    const fileUri = pathToFileURL(path.resolve(filePath)).href

    // Skip if already opened on this server
    // 满足 `openedFiles.get(fileUri) === server.name` 时，服务层 LSPServer Manager执行该分支。
    if (openedFiles.get(fileUri) === server.name) {
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `LSP: File already open, skipping didOpen for ${filePath}`,
      )
      // 服务层 LSPServer Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Get language ID from server's extensionToLanguage mapping
    // ext保存`path.extname`，供服务层 LSPServer Manager后续处理使用。
    const ext = path.extname(filePath).toLowerCase()
    // languageId标记服务层 LSPServer Manager是否启用对应路径。
    const languageId = server.config.extensionToLanguage[ext] || 'plaintext'

    // 保护这一段可能失败的服务层 LSPServer Manager操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `server.sendNotification('textDocument/didOpen', {` 完成，再继续服务层 LSPServer Manager的异步流程。
      await server.sendNotification('textDocument/didOpen', {
        textDocument: {
          uri: fileUri,
          languageId,
          version: 1,
          text: content,
        },
      })
      // Track that this file is now open on this server
      // openedFiles.set 写入新的状态值，使服务层 LSPServer Manager后续读取保持一致。
      openedFiles.set(fileUri, server.name)
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `LSP: Sent didOpen for ${filePath} (languageId: ${languageId})`,
      )
    } catch (error) {
      // err保存`Error`，供服务层 LSPServer Manager后续处理使用。
      const err = new Error(
        `Failed to sync file open ${filePath}: ${errorMessage(error)}`,
      )
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // Re-throw to propagate error to caller
      // 抛出 err，阻止服务层 LSPServer Manager在无效状态下继续运行。
      throw err
    }
  }

  // changeFile 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function changeFile(filePath: string, content: string): Promise<void> {
    // server读取`getServerForFile`，供服务层 LSPServer Manager后续处理使用。
    const server = getServerForFile(filePath)
    // `!server || server.state` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
    if (!server || server.state !== 'running') {
      // 返回 `openFile(filePath, content)`，作为服务层 LSPServer Manager这次计算的结果。
      return openFile(filePath, content)
    }

    // fileUri 文件数据保存`pathToFileURL`，供服务层 LSPServer Manager后续处理使用。
    const fileUri = pathToFileURL(path.resolve(filePath)).href

    // If file hasn't been opened on this server yet, open it first
    // LSP servers require didOpen before didChange
    // `openedFiles.get(fileUri)` 与 `server.name` 不一致时刷新派生状态，避免使用过期结果。
    if (openedFiles.get(fileUri) !== server.name) {
      // 返回 `openFile(filePath, content)`，作为服务层 LSPServer Manager这次计算的结果。
      return openFile(filePath, content)
    }

    // 保护这一段可能失败的服务层 LSPServer Manager操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `server.sendNotification('textDocument/didChange', {` 完成，再继续服务层 LSPServer Manager的异步流程。
      await server.sendNotification('textDocument/didChange', {
        textDocument: {
          uri: fileUri,
          version: 1,
        },
        contentChanges: [{ text: content }],
      })
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`LSP: Sent didChange for ${filePath}`)
    } catch (error) {
      // err保存`Error`，供服务层 LSPServer Manager后续处理使用。
      const err = new Error(
        `Failed to sync file change ${filePath}: ${errorMessage(error)}`,
      )
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // Re-throw to propagate error to caller
      // 抛出 err，阻止服务层 LSPServer Manager在无效状态下继续运行。
      throw err
    }
  }

  /**
   * Save a file in LSP servers (sends didSave notification)
   * Called after file is written to disk to trigger diagnostics
   */
  // saveFile 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function saveFile(filePath: string): Promise<void> {
    // server读取`getServerForFile`，供服务层 LSPServer Manager后续处理使用。
    const server = getServerForFile(filePath)
    // `!server || server.state` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
    if (!server || server.state !== 'running') return

    // 保护这一段可能失败的服务层 LSPServer Manager操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `server.sendNotification('textDocument/didSave', {` 完成，再继续服务层 LSPServer Manager的异步流程。
      await server.sendNotification('textDocument/didSave', {
        textDocument: {
          uri: pathToFileURL(path.resolve(filePath)).href,
        },
      })
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`LSP: Sent didSave for ${filePath}`)
    } catch (error) {
      // err保存`Error`，供服务层 LSPServer Manager后续处理使用。
      const err = new Error(
        `Failed to sync file save ${filePath}: ${errorMessage(error)}`,
      )
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // Re-throw to propagate error to caller
      // 抛出 err，阻止服务层 LSPServer Manager在无效状态下继续运行。
      throw err
    }
  }

  /**
   * Close a file in LSP servers (sends didClose notification)
   *
   * NOTE: Currently available but not yet integrated with compact flow.
   * TODO: Integrate with compact - call closeFile() when compact removes files from context
   * This will notify LSP servers that files are no longer in active use.
   */
  // closeFile 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function closeFile(filePath: string): Promise<void> {
    // server读取`getServerForFile`，供服务层 LSPServer Manager后续处理使用。
    const server = getServerForFile(filePath)
    // `!server || server.state` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
    if (!server || server.state !== 'running') return

    // fileUri 文件数据保存`pathToFileURL`，供服务层 LSPServer Manager后续处理使用。
    const fileUri = pathToFileURL(path.resolve(filePath)).href

    // 保护这一段可能失败的服务层 LSPServer Manager操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `server.sendNotification('textDocument/didClose', {` 完成，再继续服务层 LSPServer Manager的异步流程。
      await server.sendNotification('textDocument/didClose', {
        textDocument: {
          uri: fileUri,
        },
      })
      // Remove from tracking so file can be reopened later
      // 调用 openedFiles.delete，触发服务层 LSPServer Manager此处需要的副作用。
      openedFiles.delete(fileUri)
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`LSP: Sent didClose for ${filePath}`)
    } catch (error) {
      // err保存`Error`，供服务层 LSPServer Manager后续处理使用。
      const err = new Error(
        `Failed to sync file close ${filePath}: ${errorMessage(error)}`,
      )
      // 记录服务层 LSPServer Manager运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // Re-throw to propagate error to caller
      // 抛出 err，阻止服务层 LSPServer Manager在无效状态下继续运行。
      throw err
    }
  }

  // isFileOpen 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function isFileOpen(filePath: string): boolean {
    // fileUri 文件数据保存`pathToFileURL`，供服务层 LSPServer Manager后续处理使用。
    const fileUri = pathToFileURL(path.resolve(filePath)).href
    // 返回 `openedFiles.has(fileUri)`，作为服务层 LSPServer Manager这次计算的结果。
    return openedFiles.has(fileUri)
  }

  // 返回结构化结果，集中表达服务层 LSPServer Manager已经整理出的状态。
  return {
    initialize,
    shutdown,
    getServerForFile,
    ensureServerStarted,
    sendRequest,
    getAllServers,
    openFile,
    changeFile,
    saveFile,
    closeFile,
    isFileOpen,
  }
}

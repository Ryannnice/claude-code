// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { chmodSync } from 'fs'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getClaudeConfigHomeDir，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from '../envUtils.js'
// 引入 getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  jsonParse,
  jsonStringify,
  writeFileSync_DEPRECATED,
} from '../slowOperations.js'
// 类型依赖 { SecureStorage, SecureStorageData } 来自 ./types.js，用于校准共享工具的数据契约。
import type { SecureStorage, SecureStorageData } from './types.js'

// getStoragePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getStoragePath(): { storageDir: string; storagePath: string } {
  // storageDir读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
  const storageDir = getClaudeConfigHomeDir()
  // storageFileName 文件数据保存`'.credentials.json'`，作为后续固定文本处理的输入。
  const storageFileName = '.credentials.json'
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { storageDir, storagePath: join(storageDir, storageFileName) }
}

// plainTextStorage集中保存共享工具 plain Text Storage要一起传递的字段。
export const plainTextStorage = {
  name: 'plaintext',
  // read 使用 无 完成共享工具里的对应操作。
  read(): SecureStorageData | null {
    // sync IO: called from sync context (SecureStorage interface)
    // 从 `getStoragePath()` 解构 storagePath，减少共享工具 plain Text Storage对同一对象的重复访问。
    const { storagePath } = getStoragePath()
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // data读取`getFsImplementation`，供共享工具后续处理使用。
      const data = getFsImplementation().readFileSync(storagePath, {
        encoding: 'utf8',
      })
      // 返回 `jsonParse(data)`，作为共享工具这次计算的结果。
      return jsonParse(data)
    } catch {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  },
  // readAsync 使用 无 完成共享工具里的对应操作。
  async readAsync(): Promise<SecureStorageData | null> {
    // 从 `getStoragePath()` 解构 storagePath，减少共享工具 plain Text Storage对同一对象的重复访问。
    const { storagePath } = getStoragePath()
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // data读取`getFsImplementation`，供共享工具后续处理使用。
      const data = await getFsImplementation().readFile(storagePath, {
        encoding: 'utf8',
      })
      // 返回 `jsonParse(data)`，作为共享工具这次计算的结果。
      return jsonParse(data)
    } catch {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  },
  // update 使用 data: SecureStorageData 完成共享工具里的对应操作。
  update(data: SecureStorageData): { success: boolean; warning?: string } {
    // sync IO: called from sync context (SecureStorage interface)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 从 `getStoragePath()` 解构 storageDir、storagePath，减少共享工具 plain Text Storage对同一对象的重复访问。
      const { storageDir, storagePath } = getStoragePath()
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 调用 getFsImplementation，触发共享工具此处需要的副作用。
        getFsImplementation().mkdirSync(storageDir)
      } catch (e: unknown) {
        // code读取`getErrnoCode`，供共享工具后续处理使用。
        const code = getErrnoCode(e)
        // `code` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
        if (code !== 'EEXIST') {
          // 抛出 e，阻止共享工具在无效状态下继续运行。
          throw e
        }
      }

      // 调用 writeFileSync_DEPRECATED，触发共享工具此处需要的副作用。
      writeFileSync_DEPRECATED(storagePath, jsonStringify(data), {
        encoding: 'utf8',
        flush: false,
      })
      // 调用 chmodSync，触发共享工具此处需要的副作用。
      chmodSync(storagePath, 0o600)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: true,
        warning: 'Warning: Storing credentials in plaintext.',
      }
    } catch {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false }
    }
  },
  // delete 使用 无 完成共享工具里的对应操作。
  delete(): boolean {
    // sync IO: called from sync context (SecureStorage interface)
    // 从 `getStoragePath()` 解构 storagePath，减少共享工具 plain Text Storage对同一对象的重复访问。
    const { storagePath } = getStoragePath()
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 调用 getFsImplementation，触发共享工具此处需要的副作用。
      getFsImplementation().unlinkSync(storagePath)
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    } catch (e: unknown) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(e)
      // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
      if (code === 'ENOENT') {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  },
} satisfies SecureStorage

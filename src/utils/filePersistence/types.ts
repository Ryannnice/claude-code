// Local recovery stub for missing filePersistence types

// DEFAULT_UPLOAD_CONCURRENCY保存`5`，供共享工具 types后续判断或输出使用。
export const DEFAULT_UPLOAD_CONCURRENCY = 5
// FILE_COUNT_LIMIT 文件数据保存`100`，供后续判断或组装使用。
export const FILE_COUNT_LIMIT = 100
// OUTPUTS_SUBDIR 命名 `'outputs'`，让后续代码直接表达这个值的用途。
export const OUTPUTS_SUBDIR = 'outputs'

// FailedPersistence 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface FailedPersistence {
  filePath: string
  error: string
}

// PersistedFile 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface PersistedFile {
  filePath: string
  fileId?: string
}

// FilesPersistedEventData 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface FilesPersistedEventData {
  persisted: PersistedFile[]
  failed: FailedPersistence[]
}

// TurnStartTime 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TurnStartTime = number

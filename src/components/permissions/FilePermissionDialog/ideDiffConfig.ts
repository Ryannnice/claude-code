// 类型依赖 { ToolInput } 来自 ./useFilePermissionDialog.js，用于校准终端渲染的数据契约。
import type { ToolInput } from './useFilePermissionDialog.js'

// FileEdit 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface FileEdit {
  old_string: string
  new_string: string
  replace_all?: boolean
}

// IDEDiffConfig 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface IDEDiffConfig {
  filePath: string
  edits?: FileEdit[]
  editMode?: 'single' | 'multiple'
}

// IDEDiffChangeInput 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface IDEDiffChangeInput {
  file_path: string
  edits: FileEdit[]
}

// IDEDiffSupport 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface IDEDiffSupport<TInput extends ToolInput> {
  getConfig(input: TInput): IDEDiffConfig
  applyChanges(input: TInput, modifiedEdits: FileEdit[]): TInput
}

// createSingleEditDiffConfig 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSingleEditDiffConfig(
  filePath: string,
  oldString: string,
  newString: string,
  replaceAll?: boolean,
): IDEDiffConfig {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    filePath,
    edits: [
      {
        old_string: oldString,
        new_string: newString,
        replace_all: replaceAll,
      },
    ],
    editMode: 'single',
  }
}

// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// In its own file to avoid circular dependencies
// FILE_EDIT_TOOL_NAME 文件数据 命名 `'Edit'`，让后续代码直接表达这个值的用途。
export const FILE_EDIT_TOOL_NAME = 'Edit'

// Permission pattern for granting session-level access to the project's .claude/ folder
// CLAUDE_FOLDER_PERMISSION_PATTERN 权限数据保存`'/.claude/**'`，作为后续固定文本处理的输入。
export const CLAUDE_FOLDER_PERMISSION_PATTERN = '/.claude/**'

// Permission pattern for granting session-level access to the global ~/.claude/ folder
// GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN 权限数据保存`'~/.claude/**'`，作为后续固定文本处理的输入。
export const GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN = '~/.claude/**'

// FILE_UNEXPECTEDLY_MODIFIED_ERROR 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const FILE_UNEXPECTEDLY_MODIFIED_ERROR =
  'File has been unexpectedly modified. Read it again before attempting to write it.'

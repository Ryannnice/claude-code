// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export const TASK_STOP_TOOL_NAME = 'TaskStop'

// DESCRIPTION 命名 ```，让后续代码直接表达这个值的用途。
export const DESCRIPTION = `
- Stops a running background task by its ID
- Takes a task_id parameter identifying the task to stop
- Returns a success or failure status
- Use this tool when you need to terminate a long-running task
`

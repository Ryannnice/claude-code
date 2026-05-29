// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js'

// DESCRIPTION 命名 `'List all tasks in the task list'`，让后续代码直接表达这个值的用途。
export const DESCRIPTION = 'List all tasks in the task list'

// getPrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPrompt(): string {
  // teammateUseCase保存`isAgentSwarmsEnabled`，供工具调用后续处理使用。
  const teammateUseCase = isAgentSwarmsEnabled()
    ? `- Before assigning tasks to teammates, to see what's available
`
    : ''

  // idDescription保存`isAgentSwarmsEnabled`，供工具调用后续处理使用。
  const idDescription = isAgentSwarmsEnabled()
    ? '- **id**: Task identifier (use with TaskGet, TaskUpdate)'
    : '- **id**: Task identifier (use with TaskGet, TaskUpdate)'

  // teammateWorkflow保存`isAgentSwarmsEnabled`，供工具调用后续处理使用。
  const teammateWorkflow = isAgentSwarmsEnabled()
    ? `
## Teammate Workflow

When working as a teammate:
1. After completing your current task, call TaskList to find available work
2. Look for tasks with status 'pending', no owner, and empty blockedBy
3. **Prefer tasks in ID order** (lowest ID first) when multiple tasks are available, as earlier tasks often set up context for later ones
4. Claim an available task using TaskUpdate (set \`owner\` to your name), or wait for leader assignment
5. If blocked, focus on unblocking tasks or notify the team lead
`
    : ''

  // 返回 ``Use this tool to list all tasks in the task list.`，作为工具调用这次计算的结果。
  return `Use this tool to list all tasks in the task list.

## When to Use This Tool

- To see what tasks are available to work on (status: 'pending', no owner, not blocked)
- To check overall progress on the project
- To find tasks that are blocked and need dependencies resolved
${teammateUseCase}- After completing a task, to check for newly unblocked work or claim the next available task
- **Prefer working on tasks in ID order** (lowest ID first) when multiple tasks are available, as earlier tasks often set up context for later ones

## Output

Returns a summary of each task:
${idDescription}
- **subject**: Brief description of the task
- **status**: 'pending', 'in_progress', or 'completed'
- **owner**: Agent ID if assigned, empty if available
- **blockedBy**: List of open task IDs that must be resolved first (tasks with blockedBy cannot be claimed until dependencies resolve)

Use TaskGet with a specific task ID to view full details including description and comments.
${teammateWorkflow}`
}

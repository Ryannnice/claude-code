// getPrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPrompt(): string {
  // 返回 ```，作为工具调用这次计算的结果。
  return `
# TeamDelete

Remove team and task directories when the swarm work is complete.

This operation:
- Removes the team directory (\`~/.claude/teams/{team-name}/\`)
- Removes the task directory (\`~/.claude/tasks/{team-name}/\`)
- Clears team context from the current session

**IMPORTANT**: TeamDelete will fail if the team still has active members. Gracefully terminate teammates first, then call TeamDelete after all teammates have shut down.

Use this when all teammates have finished their work and you want to clean up the team resources. The team name is automatically determined from the current session's team context.
`.trim()
}

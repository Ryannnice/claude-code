// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 AgentsMenu 终端界面组件，避免在这里重复拼装显示逻辑。
import { AgentsMenu } from '../../components/agents/AgentsMenu.js';
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js';
// 引入 getTools，将 ../../tools.js 中已经封装好的能力接到本文件流程里。
import { getTools } from '../../tools.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, context: ToolUseContext): Promise<React.ReactNode> {
  // appState 状态读取`context.getAppState`，供命令处理后续处理使用。
  const appState = context.getAppState();
  // permissionContext 权限数据 命名 `appState.toolPermissionContext`，让后续代码直接表达这个值的用途。
  const permissionContext = appState.toolPermissionContext;
  // tools 集合读取`getTools`，供命令处理后续处理使用。
  const tools = getTools(permissionContext);
  // 返回 `<AgentsMenu tools={tools} onExit={onDone} />`，作为命令处理这次计算的结果。
  return <AgentsMenu tools={tools} onExit={onDone} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkFnZW50c01lbnUiLCJUb29sVXNlQ29udGV4dCIsImdldFRvb2xzIiwiTG9jYWxKU1hDb21tYW5kT25Eb25lIiwiY2FsbCIsIm9uRG9uZSIsImNvbnRleHQiLCJQcm9taXNlIiwiUmVhY3ROb2RlIiwiYXBwU3RhdGUiLCJnZXRBcHBTdGF0ZSIsInBlcm1pc3Npb25Db250ZXh0IiwidG9vbFBlcm1pc3Npb25Db250ZXh0IiwidG9vbHMiXSwic291cmNlcyI6WyJhZ2VudHMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQWdlbnRzTWVudSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvYWdlbnRzL0FnZW50c01lbnUuanMnXG5pbXBvcnQgdHlwZSB7IFRvb2xVc2VDb250ZXh0IH0gZnJvbSAnLi4vLi4vVG9vbC5qcydcbmltcG9ydCB7IGdldFRvb2xzIH0gZnJvbSAnLi4vLi4vdG9vbHMuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsKFxuICBvbkRvbmU6IExvY2FsSlNYQ29tbWFuZE9uRG9uZSxcbiAgY29udGV4dDogVG9vbFVzZUNvbnRleHQsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICBjb25zdCBhcHBTdGF0ZSA9IGNvbnRleHQuZ2V0QXBwU3RhdGUoKVxuICBjb25zdCBwZXJtaXNzaW9uQ29udGV4dCA9IGFwcFN0YXRlLnRvb2xQZXJtaXNzaW9uQ29udGV4dFxuICBjb25zdCB0b29scyA9IGdldFRvb2xzKHBlcm1pc3Npb25Db250ZXh0KVxuXG4gIHJldHVybiA8QWdlbnRzTWVudSB0b29scz17dG9vbHN9IG9uRXhpdD17b25Eb25lfSAvPlxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFVBQVUsUUFBUSx1Q0FBdUM7QUFDbEUsY0FBY0MsY0FBYyxRQUFRLGVBQWU7QUFDbkQsU0FBU0MsUUFBUSxRQUFRLGdCQUFnQjtBQUN6QyxjQUFjQyxxQkFBcUIsUUFBUSx3QkFBd0I7QUFFbkUsT0FBTyxlQUFlQyxJQUFJQSxDQUN4QkMsTUFBTSxFQUFFRixxQkFBcUIsRUFDN0JHLE9BQU8sRUFBRUwsY0FBYyxDQUN4QixFQUFFTSxPQUFPLENBQUNSLEtBQUssQ0FBQ1MsU0FBUyxDQUFDLENBQUM7RUFDMUIsTUFBTUMsUUFBUSxHQUFHSCxPQUFPLENBQUNJLFdBQVcsQ0FBQyxDQUFDO0VBQ3RDLE1BQU1DLGlCQUFpQixHQUFHRixRQUFRLENBQUNHLHFCQUFxQjtFQUN4RCxNQUFNQyxLQUFLLEdBQUdYLFFBQVEsQ0FBQ1MsaUJBQWlCLENBQUM7RUFFekMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQ0UsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUNSLE1BQU0sQ0FBQyxHQUFHO0FBQ3JEIiwiaWdub3JlTGlzdCI6W119
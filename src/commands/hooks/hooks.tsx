// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 HooksConfigMenu 终端界面组件，避免在这里重复拼装显示逻辑。
import { HooksConfigMenu } from '../../components/hooks/HooksConfigMenu.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 引入 getTools，将 ../../tools.js 中已经封装好的能力接到本文件流程里。
import { getTools } from '../../tools.js';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// 这个回调绑定到 export const call: LocalJSXCommandCall = async (onDone, context) => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = async (onDone, context) => {
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_hooks_command', {});
  // appState 状态读取`context.getAppState`，供命令处理后续处理使用。
  const appState = context.getAppState();
  // permissionContext 权限数据 命名 `appState.toolPermissionContext`，让后续代码直接表达这个值的用途。
  const permissionContext = appState.toolPermissionContext;
  // toolNames 集合读取`getTools`，供命令处理后续处理使用。
  const toolNames = getTools(permissionContext).map(tool => tool.name);
  // 返回 `<HooksConfigMenu toolNames={toolNames} onExit={onDone} />`，作为命令处理这次计算的结果。
  return <HooksConfigMenu toolNames={toolNames} onExit={onDone} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkhvb2tzQ29uZmlnTWVudSIsImxvZ0V2ZW50IiwiZ2V0VG9vbHMiLCJMb2NhbEpTWENvbW1hbmRDYWxsIiwiY2FsbCIsIm9uRG9uZSIsImNvbnRleHQiLCJhcHBTdGF0ZSIsImdldEFwcFN0YXRlIiwicGVybWlzc2lvbkNvbnRleHQiLCJ0b29sUGVybWlzc2lvbkNvbnRleHQiLCJ0b29sTmFtZXMiLCJtYXAiLCJ0b29sIiwibmFtZSJdLCJzb3VyY2VzIjpbImhvb2tzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEhvb2tzQ29uZmlnTWVudSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvaG9va3MvSG9va3NDb25maWdNZW51LmpzJ1xuaW1wb3J0IHsgbG9nRXZlbnQgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQgeyBnZXRUb29scyB9IGZyb20gJy4uLy4uL3Rvb2xzLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRDYWxsIH0gZnJvbSAnLi4vLi4vdHlwZXMvY29tbWFuZC5qcydcblxuZXhwb3J0IGNvbnN0IGNhbGw6IExvY2FsSlNYQ29tbWFuZENhbGwgPSBhc3luYyAob25Eb25lLCBjb250ZXh0KSA9PiB7XG4gIGxvZ0V2ZW50KCd0ZW5ndV9ob29rc19jb21tYW5kJywge30pXG4gIGNvbnN0IGFwcFN0YXRlID0gY29udGV4dC5nZXRBcHBTdGF0ZSgpXG4gIGNvbnN0IHBlcm1pc3Npb25Db250ZXh0ID0gYXBwU3RhdGUudG9vbFBlcm1pc3Npb25Db250ZXh0XG4gIGNvbnN0IHRvb2xOYW1lcyA9IGdldFRvb2xzKHBlcm1pc3Npb25Db250ZXh0KS5tYXAodG9vbCA9PiB0b29sLm5hbWUpXG4gIHJldHVybiA8SG9va3NDb25maWdNZW51IHRvb2xOYW1lcz17dG9vbE5hbWVzfSBvbkV4aXQ9e29uRG9uZX0gLz5cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxlQUFlLFFBQVEsMkNBQTJDO0FBQzNFLFNBQVNDLFFBQVEsUUFBUSxtQ0FBbUM7QUFDNUQsU0FBU0MsUUFBUSxRQUFRLGdCQUFnQjtBQUN6QyxjQUFjQyxtQkFBbUIsUUFBUSx3QkFBd0I7QUFFakUsT0FBTyxNQUFNQyxJQUFJLEVBQUVELG1CQUFtQixHQUFHLE1BQUFDLENBQU9DLE1BQU0sRUFBRUMsT0FBTyxLQUFLO0VBQ2xFTCxRQUFRLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDbkMsTUFBTU0sUUFBUSxHQUFHRCxPQUFPLENBQUNFLFdBQVcsQ0FBQyxDQUFDO0VBQ3RDLE1BQU1DLGlCQUFpQixHQUFHRixRQUFRLENBQUNHLHFCQUFxQjtFQUN4RCxNQUFNQyxTQUFTLEdBQUdULFFBQVEsQ0FBQ08saUJBQWlCLENBQUMsQ0FBQ0csR0FBRyxDQUFDQyxJQUFJLElBQUlBLElBQUksQ0FBQ0MsSUFBSSxDQUFDO0VBQ3BFLE9BQU8sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUNILFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDTixNQUFNLENBQUMsR0FBRztBQUNsRSxDQUFDIiwiaWdub3JlTGlzdCI6W119
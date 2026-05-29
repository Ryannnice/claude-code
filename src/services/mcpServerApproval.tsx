// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 MCPServerApprovalDialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { MCPServerApprovalDialog } from '../components/MCPServerApprovalDialog.js';
// 复用 MCPServerMultiselectDialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { MCPServerMultiselectDialog } from '../components/MCPServerMultiselectDialog.js';
// 类型依赖 { Root } 来自 ../ink.js，用于校准服务层 mcp Server Approval的数据契约。
import type { Root } from '../ink.js';
// 引入 KeybindingSetup，将 ../keybindings/KeybindingProviderSetup.js 中已经封装好的能力接到本文件流程里。
import { KeybindingSetup } from '../keybindings/KeybindingProviderSetup.js';
// 引入 AppStateProvider，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { AppStateProvider } from '../state/AppState.js';
// 引入 getMcpConfigsByScope，将 ./mcp/config.js 中已经封装好的能力接到本文件流程里。
import { getMcpConfigsByScope } from './mcp/config.js';
// 引入 getProjectMcpServerStatus，将 ./mcp/utils.js 中已经封装好的能力接到本文件流程里。
import { getProjectMcpServerStatus } from './mcp/utils.js';

/**
 * Show MCP server approval dialogs for pending project servers.
 * Uses the provided Ink root to render (reusing the existing instance
 * from main.tsx instead of creating a separate one).
 */
// handleMcpjsonServerApprovals 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function handleMcpjsonServerApprovals(root: Root): Promise<void> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    servers: projectServers
  } = getMcpConfigsByScope('project');
  // pendingServers 集合派生`Object.keys`，供服务层 mcp Server Approval后续处理使用。
  const pendingServers = Object.keys(projectServers).filter(serverName => getProjectMcpServerStatus(serverName) === 'pending');
  // pendingServers 集合为空时立即返回或跳过，避免服务层 mcp Server Approval把空集合当成可处理内容。
  if (pendingServers.length === 0) {
    // 服务层 mcp Server Approval在这里结束当前路径，避免继续执行不适用的后续分支。
    return;
  }
  // 这个回调绑定到 await new Promise<void>(resolve => {，负责服务层 mcp Server Approval在该局部场景下的响应。
  await new Promise<void>(resolve => {
    // done读取`resolve`，供服务层 mcp Server Approval后续处理使用。
    const done = (): void => void resolve();
    // 组合条件 `pendingServers.length === 1 && pendingServers[0]` 成立时，服务层 mcp Server Approval才启用这条专门路径。
    if (pendingServers.length === 1 && pendingServers[0] !== undefined) {
      // serverName保存`pendingServers[0]`，供服务层 mcp Server Approval后续判断或输出使用。
      const serverName = pendingServers[0];
      // 调用 root.render，触发服务层 mcp Server Approval此处需要的副作用。
      root.render(<AppStateProvider>
          <KeybindingSetup>
            <MCPServerApprovalDialog serverName={serverName} onDone={done} />
          </KeybindingSetup>
        </AppStateProvider>);
    } else {
      // 调用 root.render，触发服务层 mcp Server Approval此处需要的副作用。
      root.render(<AppStateProvider>
          <KeybindingSetup>
            <MCPServerMultiselectDialog serverNames={pendingServers} onDone={done} />
          </KeybindingSetup>
        </AppStateProvider>);
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1DUFNlcnZlckFwcHJvdmFsRGlhbG9nIiwiTUNQU2VydmVyTXVsdGlzZWxlY3REaWFsb2ciLCJSb290IiwiS2V5YmluZGluZ1NldHVwIiwiQXBwU3RhdGVQcm92aWRlciIsImdldE1jcENvbmZpZ3NCeVNjb3BlIiwiZ2V0UHJvamVjdE1jcFNlcnZlclN0YXR1cyIsImhhbmRsZU1jcGpzb25TZXJ2ZXJBcHByb3ZhbHMiLCJyb290IiwiUHJvbWlzZSIsInNlcnZlcnMiLCJwcm9qZWN0U2VydmVycyIsInBlbmRpbmdTZXJ2ZXJzIiwiT2JqZWN0Iiwia2V5cyIsImZpbHRlciIsInNlcnZlck5hbWUiLCJsZW5ndGgiLCJyZXNvbHZlIiwiZG9uZSIsInVuZGVmaW5lZCIsInJlbmRlciJdLCJzb3VyY2VzIjpbIm1jcFNlcnZlckFwcHJvdmFsLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBNQ1BTZXJ2ZXJBcHByb3ZhbERpYWxvZyB9IGZyb20gJy4uL2NvbXBvbmVudHMvTUNQU2VydmVyQXBwcm92YWxEaWFsb2cuanMnXG5pbXBvcnQgeyBNQ1BTZXJ2ZXJNdWx0aXNlbGVjdERpYWxvZyB9IGZyb20gJy4uL2NvbXBvbmVudHMvTUNQU2VydmVyTXVsdGlzZWxlY3REaWFsb2cuanMnXG5pbXBvcnQgdHlwZSB7IFJvb3QgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBLZXliaW5kaW5nU2V0dXAgfSBmcm9tICcuLi9rZXliaW5kaW5ncy9LZXliaW5kaW5nUHJvdmlkZXJTZXR1cC5qcydcbmltcG9ydCB7IEFwcFN0YXRlUHJvdmlkZXIgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IGdldE1jcENvbmZpZ3NCeVNjb3BlIH0gZnJvbSAnLi9tY3AvY29uZmlnLmpzJ1xuaW1wb3J0IHsgZ2V0UHJvamVjdE1jcFNlcnZlclN0YXR1cyB9IGZyb20gJy4vbWNwL3V0aWxzLmpzJ1xuXG4vKipcbiAqIFNob3cgTUNQIHNlcnZlciBhcHByb3ZhbCBkaWFsb2dzIGZvciBwZW5kaW5nIHByb2plY3Qgc2VydmVycy5cbiAqIFVzZXMgdGhlIHByb3ZpZGVkIEluayByb290IHRvIHJlbmRlciAocmV1c2luZyB0aGUgZXhpc3RpbmcgaW5zdGFuY2VcbiAqIGZyb20gbWFpbi50c3ggaW5zdGVhZCBvZiBjcmVhdGluZyBhIHNlcGFyYXRlIG9uZSkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVNY3Bqc29uU2VydmVyQXBwcm92YWxzKHJvb3Q6IFJvb3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgeyBzZXJ2ZXJzOiBwcm9qZWN0U2VydmVycyB9ID0gZ2V0TWNwQ29uZmlnc0J5U2NvcGUoJ3Byb2plY3QnKVxuICBjb25zdCBwZW5kaW5nU2VydmVycyA9IE9iamVjdC5rZXlzKHByb2plY3RTZXJ2ZXJzKS5maWx0ZXIoXG4gICAgc2VydmVyTmFtZSA9PiBnZXRQcm9qZWN0TWNwU2VydmVyU3RhdHVzKHNlcnZlck5hbWUpID09PSAncGVuZGluZycsXG4gIClcblxuICBpZiAocGVuZGluZ1NlcnZlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHtcbiAgICBjb25zdCBkb25lID0gKCk6IHZvaWQgPT4gdm9pZCByZXNvbHZlKClcbiAgICBpZiAocGVuZGluZ1NlcnZlcnMubGVuZ3RoID09PSAxICYmIHBlbmRpbmdTZXJ2ZXJzWzBdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHNlcnZlck5hbWUgPSBwZW5kaW5nU2VydmVyc1swXVxuICAgICAgcm9vdC5yZW5kZXIoXG4gICAgICAgIDxBcHBTdGF0ZVByb3ZpZGVyPlxuICAgICAgICAgIDxLZXliaW5kaW5nU2V0dXA+XG4gICAgICAgICAgICA8TUNQU2VydmVyQXBwcm92YWxEaWFsb2cgc2VydmVyTmFtZT17c2VydmVyTmFtZX0gb25Eb25lPXtkb25lfSAvPlxuICAgICAgICAgIDwvS2V5YmluZGluZ1NldHVwPlxuICAgICAgICA8L0FwcFN0YXRlUHJvdmlkZXI+LFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICByb290LnJlbmRlcihcbiAgICAgICAgPEFwcFN0YXRlUHJvdmlkZXI+XG4gICAgICAgICAgPEtleWJpbmRpbmdTZXR1cD5cbiAgICAgICAgICAgIDxNQ1BTZXJ2ZXJNdWx0aXNlbGVjdERpYWxvZ1xuICAgICAgICAgICAgICBzZXJ2ZXJOYW1lcz17cGVuZGluZ1NlcnZlcnN9XG4gICAgICAgICAgICAgIG9uRG9uZT17ZG9uZX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9LZXliaW5kaW5nU2V0dXA+XG4gICAgICAgIDwvQXBwU3RhdGVQcm92aWRlcj4sXG4gICAgICApXG4gICAgfVxuICB9KVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyx1QkFBdUIsUUFBUSwwQ0FBMEM7QUFDbEYsU0FBU0MsMEJBQTBCLFFBQVEsNkNBQTZDO0FBQ3hGLGNBQWNDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLGVBQWUsUUFBUSwyQ0FBMkM7QUFDM0UsU0FBU0MsZ0JBQWdCLFFBQVEsc0JBQXNCO0FBQ3ZELFNBQVNDLG9CQUFvQixRQUFRLGlCQUFpQjtBQUN0RCxTQUFTQyx5QkFBeUIsUUFBUSxnQkFBZ0I7O0FBRTFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLGVBQWVDLDRCQUE0QkEsQ0FBQ0MsSUFBSSxFQUFFTixJQUFJLENBQUMsRUFBRU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQzVFLE1BQU07SUFBRUMsT0FBTyxFQUFFQztFQUFlLENBQUMsR0FBR04sb0JBQW9CLENBQUMsU0FBUyxDQUFDO0VBQ25FLE1BQU1PLGNBQWMsR0FBR0MsTUFBTSxDQUFDQyxJQUFJLENBQUNILGNBQWMsQ0FBQyxDQUFDSSxNQUFNLENBQ3ZEQyxVQUFVLElBQUlWLHlCQUF5QixDQUFDVSxVQUFVLENBQUMsS0FBSyxTQUMxRCxDQUFDO0VBRUQsSUFBSUosY0FBYyxDQUFDSyxNQUFNLEtBQUssQ0FBQyxFQUFFO0lBQy9CO0VBQ0Y7RUFFQSxNQUFNLElBQUlSLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQ1MsT0FBTyxJQUFJO0lBQ2pDLE1BQU1DLElBQUksR0FBR0EsQ0FBQSxDQUFFLEVBQUUsSUFBSSxJQUFJLEtBQUtELE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLElBQUlOLGNBQWMsQ0FBQ0ssTUFBTSxLQUFLLENBQUMsSUFBSUwsY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLUSxTQUFTLEVBQUU7TUFDbEUsTUFBTUosVUFBVSxHQUFHSixjQUFjLENBQUMsQ0FBQyxDQUFDO01BQ3BDSixJQUFJLENBQUNhLE1BQU0sQ0FDVCxDQUFDLGdCQUFnQjtBQUN6QixVQUFVLENBQUMsZUFBZTtBQUMxQixZQUFZLENBQUMsdUJBQXVCLENBQUMsVUFBVSxDQUFDLENBQUNMLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDRyxJQUFJLENBQUM7QUFDMUUsVUFBVSxFQUFFLGVBQWU7QUFDM0IsUUFBUSxFQUFFLGdCQUFnQixDQUNwQixDQUFDO0lBQ0gsQ0FBQyxNQUFNO01BQ0xYLElBQUksQ0FBQ2EsTUFBTSxDQUNULENBQUMsZ0JBQWdCO0FBQ3pCLFVBQVUsQ0FBQyxlQUFlO0FBQzFCLFlBQVksQ0FBQywwQkFBMEIsQ0FDekIsV0FBVyxDQUFDLENBQUNULGNBQWMsQ0FBQyxDQUM1QixNQUFNLENBQUMsQ0FBQ08sSUFBSSxDQUFDO0FBRTNCLFVBQVUsRUFBRSxlQUFlO0FBQzNCLFFBQVEsRUFBRSxnQkFBZ0IsQ0FDcEIsQ0FBQztJQUNIO0VBQ0YsQ0FBQyxDQUFDO0FBQ0oiLCJpZ25vcmVMaXN0IjpbXX0=
// 复用 checkInstall 工具函数，把通用处理留在 src/utils/nativeInstaller/index.js 中维护。
import { checkInstall } from 'src/utils/nativeInstaller/index.js';
// 引入 useStartupNotification，将 ./useStartupNotification.js 中已经封装好的能力接到本文件流程里。
import { useStartupNotification } from './useStartupNotification.js';
// useInstallMessages 封装useInstallMessages的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useInstallMessages() {
  // 调用 useStartupNotification，触发React hook此处需要的副作用。
  useStartupNotification(_temp2);
}
// _temp2 封装useInstallMessages的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function _temp2() {
  // 对话消息读取`checkInstall`，供React hook后续处理使用。
  const messages = await checkInstall();
  // 返回 `messages.map(_temp)`，作为React hook 状态流这次计算的结果。
  return messages.map(_temp);
}
// _temp 封装useInstallMessages的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(message, index) {
  // priority 命名 `"low"`，让后续代码直接表达这个值的用途。
  let priority = "low";
  // 组合条件 `message.type === "error" || message.userActionReq` 成立时，React hook 状态流才启用这条专门路径。
  if (message.type === "error" || message.userActionRequired) {
    // priority更新为 `"high"`，确保useInstallMessages后续读取最新状态。
    priority = "high";
  } else {
    // 组合条件 `message.type === "path" || message.type === "alia` 成立时，React hook 状态流才启用这条专门路径。
    if (message.type === "path" || message.type === "alias") {
      // priority更新为 `"medium"`，确保useInstallMessages后续读取最新状态。
      priority = "medium";
    }
  }
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    key: `install-message-${index}-${message.type}`,
    text: message.message,
    priority,
    color: message.type === "error" ? "error" : "warning"
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGVja0luc3RhbGwiLCJ1c2VTdGFydHVwTm90aWZpY2F0aW9uIiwidXNlSW5zdGFsbE1lc3NhZ2VzIiwiX3RlbXAyIiwibWVzc2FnZXMiLCJtYXAiLCJfdGVtcCIsIm1lc3NhZ2UiLCJpbmRleCIsInByaW9yaXR5IiwidHlwZSIsInVzZXJBY3Rpb25SZXF1aXJlZCIsImtleSIsInRleHQiLCJjb2xvciJdLCJzb3VyY2VzIjpbInVzZUluc3RhbGxNZXNzYWdlcy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2hlY2tJbnN0YWxsIH0gZnJvbSAnc3JjL3V0aWxzL25hdGl2ZUluc3RhbGxlci9pbmRleC5qcydcbmltcG9ydCB7IHVzZVN0YXJ0dXBOb3RpZmljYXRpb24gfSBmcm9tICcuL3VzZVN0YXJ0dXBOb3RpZmljYXRpb24uanMnXG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VJbnN0YWxsTWVzc2FnZXMoKTogdm9pZCB7XG4gIHVzZVN0YXJ0dXBOb3RpZmljYXRpb24oYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gYXdhaXQgY2hlY2tJbnN0YWxsKClcbiAgICByZXR1cm4gbWVzc2FnZXMubWFwKChtZXNzYWdlLCBpbmRleCkgPT4ge1xuICAgICAgbGV0IHByaW9yaXR5OiAnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnIHwgJ2ltbWVkaWF0ZScgPSAnbG93J1xuICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2Vycm9yJyB8fCBtZXNzYWdlLnVzZXJBY3Rpb25SZXF1aXJlZCkge1xuICAgICAgICBwcmlvcml0eSA9ICdoaWdoJ1xuICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdwYXRoJyB8fCBtZXNzYWdlLnR5cGUgPT09ICdhbGlhcycpIHtcbiAgICAgICAgcHJpb3JpdHkgPSAnbWVkaXVtJ1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAga2V5OiBgaW5zdGFsbC1tZXNzYWdlLSR7aW5kZXh9LSR7bWVzc2FnZS50eXBlfWAsXG4gICAgICAgIHRleHQ6IG1lc3NhZ2UubWVzc2FnZSxcbiAgICAgICAgcHJpb3JpdHksXG4gICAgICAgIGNvbG9yOiBtZXNzYWdlLnR5cGUgPT09ICdlcnJvcicgPyAnZXJyb3InIDogJ3dhcm5pbmcnLFxuICAgICAgfVxuICAgIH0pXG4gIH0pXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLFlBQVksUUFBUSxvQ0FBb0M7QUFDakUsU0FBU0Msc0JBQXNCLFFBQVEsNkJBQTZCO0FBRXBFLE9BQU8sU0FBQUMsbUJBQUE7RUFDTEQsc0JBQXNCLENBQUNFLE1BZ0J0QixDQUFDO0FBQUE7QUFqQkcsZUFBQUEsT0FBQTtFQUVILE1BQUFDLFFBQUEsR0FBaUIsTUFBTUosWUFBWSxDQUFDLENBQUM7RUFBQSxPQUM5QkksUUFBUSxDQUFBQyxHQUFJLENBQUNDLEtBYW5CLENBQUM7QUFBQTtBQWhCQyxTQUFBQSxNQUFBQyxPQUFBLEVBQUFDLEtBQUE7RUFJRCxJQUFBQyxRQUFBLEdBQXdELEtBQUs7RUFDN0QsSUFBSUYsT0FBTyxDQUFBRyxJQUFLLEtBQUssT0FBcUMsSUFBMUJILE9BQU8sQ0FBQUksa0JBQW1CO0lBQ3hERixRQUFBLENBQUFBLENBQUEsQ0FBV0EsTUFBTTtFQUFUO0lBQ0gsSUFBSUYsT0FBTyxDQUFBRyxJQUFLLEtBQUssTUFBa0MsSUFBeEJILE9BQU8sQ0FBQUcsSUFBSyxLQUFLLE9BQU87TUFDNURELFFBQUEsQ0FBQUEsQ0FBQSxDQUFXQSxRQUFRO0lBQVg7RUFDVDtFQUFBLE9BQ007SUFBQUcsR0FBQSxFQUNBLG1CQUFtQkosS0FBSyxJQUFJRCxPQUFPLENBQUFHLElBQUssRUFBRTtJQUFBRyxJQUFBLEVBQ3pDTixPQUFPLENBQUFBLE9BQVE7SUFBQUUsUUFBQTtJQUFBSyxLQUFBLEVBRWRQLE9BQU8sQ0FBQUcsSUFBSyxLQUFLLE9BQTZCLEdBQTlDLE9BQThDLEdBQTlDO0VBQ1QsQ0FBQztBQUFBIiwiaWdub3JlTGlzdCI6W119
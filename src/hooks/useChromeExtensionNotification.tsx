// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 ../utils/auth.js 中维护。
import { isClaudeAISubscriber } from '../utils/auth.js';
// 复用 isChromeExtensionInstalled、shouldEnableClaudeInChrome 工具函数，把通用处理留在 ../utils/claudeInChrome/setup.js 中维护。
import { isChromeExtensionInstalled, shouldEnableClaudeInChrome } from '../utils/claudeInChrome/setup.js';
// 复用 isRunningOnHomespace 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isRunningOnHomespace } from '../utils/envUtils.js';
// 引入 useStartupNotification，将 ./notifs/useStartupNotification.js 中已经封装好的能力接到本文件流程里。
import { useStartupNotification } from './notifs/useStartupNotification.js';
// getChromeFlag 封装useChromeExtensionNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getChromeFlag(): boolean | undefined {
  // 满足 `process.argv.includes('--chrome')` 时，React hook执行该分支。
  if (process.argv.includes('--chrome')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  }
  // 满足 `process.argv.includes('--no-chrome')` 时，React hook执行该分支。
  if (process.argv.includes('--no-chrome')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }
  // 返回 `undefined`，作为React hook 状态流这次计算的结果。
  return undefined;
}
// useChromeExtensionNotification 封装useChromeExtensionNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useChromeExtensionNotification() {
  // 调用 useStartupNotification，触发React hook此处需要的副作用。
  useStartupNotification(_temp);
}
// _temp 封装useChromeExtensionNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function _temp() {
  // chromeFlag读取`getChromeFlag`，供React hook后续处理使用。
  const chromeFlag = getChromeFlag();
  // 满足 `!shouldEnableClaudeInChrome(chromeFlag)` 时，React hook执行该分支。
  if (!shouldEnableClaudeInChrome(chromeFlag)) {
    // 返回 `null`，作为React hook 状态流这次计算的结果。
    return null;
  }
  // 组合条件 `true && !isClaudeAISubscriber()` 成立时，React hook 状态流才启用这条专门路径。
  if (true && !isClaudeAISubscriber()) {
    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return {
      key: "chrome-requires-subscription",
      jsx: <Text color="error">Claude in Chrome requires a claude.ai subscription</Text>,
      priority: "immediate",
      timeoutMs: 5000
    };
  }
  // installed保存`isChromeExtensionInstalled`，供React hook后续处理使用。
  const installed = await isChromeExtensionInstalled();
  // 组合条件 `!installed && !isRunningOnHomespace()` 成立时，React hook 状态流才启用这条专门路径。
  if (!installed && !isRunningOnHomespace()) {
    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return {
      key: "chrome-extension-not-detected",
      jsx: <Text color="warning">Chrome extension not detected · https://claude.ai/chrome to install</Text>,
      priority: "immediate",
      timeoutMs: 3000
    };
  }
  // 满足 `chromeFlag === undefined` 时，React hook执行该分支。
  if (chromeFlag === undefined) {
    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return {
      key: "claude-in-chrome-default-enabled",
      text: "Claude in Chrome enabled \xB7 /chrome",
      priority: "low"
    };
  }
  // 返回 `null`，作为React hook 状态流这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJpc0NsYXVkZUFJU3Vic2NyaWJlciIsImlzQ2hyb21lRXh0ZW5zaW9uSW5zdGFsbGVkIiwic2hvdWxkRW5hYmxlQ2xhdWRlSW5DaHJvbWUiLCJpc1J1bm5pbmdPbkhvbWVzcGFjZSIsInVzZVN0YXJ0dXBOb3RpZmljYXRpb24iLCJnZXRDaHJvbWVGbGFnIiwicHJvY2VzcyIsImFyZ3YiLCJpbmNsdWRlcyIsInVuZGVmaW5lZCIsInVzZUNocm9tZUV4dGVuc2lvbk5vdGlmaWNhdGlvbiIsIl90ZW1wIiwiY2hyb21lRmxhZyIsImtleSIsImpzeCIsInByaW9yaXR5IiwidGltZW91dE1zIiwiaW5zdGFsbGVkIiwidGV4dCJdLCJzb3VyY2VzIjpbInVzZUNocm9tZUV4dGVuc2lvbk5vdGlmaWNhdGlvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgaXNDbGF1ZGVBSVN1YnNjcmliZXIgfSBmcm9tICcuLi91dGlscy9hdXRoLmpzJ1xuaW1wb3J0IHtcbiAgaXNDaHJvbWVFeHRlbnNpb25JbnN0YWxsZWQsXG4gIHNob3VsZEVuYWJsZUNsYXVkZUluQ2hyb21lLFxufSBmcm9tICcuLi91dGlscy9jbGF1ZGVJbkNocm9tZS9zZXR1cC5qcydcbmltcG9ydCB7IGlzUnVubmluZ09uSG9tZXNwYWNlIH0gZnJvbSAnLi4vdXRpbHMvZW52VXRpbHMuanMnXG5pbXBvcnQgeyB1c2VTdGFydHVwTm90aWZpY2F0aW9uIH0gZnJvbSAnLi9ub3RpZnMvdXNlU3RhcnR1cE5vdGlmaWNhdGlvbi5qcydcblxuZnVuY3Rpb24gZ2V0Q2hyb21lRmxhZygpOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHByb2Nlc3MuYXJndi5pbmNsdWRlcygnLS1jaHJvbWUnKSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgaWYgKHByb2Nlc3MuYXJndi5pbmNsdWRlcygnLS1uby1jaHJvbWUnKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZUNocm9tZUV4dGVuc2lvbk5vdGlmaWNhdGlvbigpOiB2b2lkIHtcbiAgdXNlU3RhcnR1cE5vdGlmaWNhdGlvbihhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgY2hyb21lRmxhZyA9IGdldENocm9tZUZsYWcoKVxuICAgIGlmICghc2hvdWxkRW5hYmxlQ2xhdWRlSW5DaHJvbWUoY2hyb21lRmxhZykpIHJldHVybiBudWxsXG5cbiAgICAvLyBDbGF1ZGUgaW4gQ2hyb21lIGlzIG9ubHkgc3VwcG9ydGVkIGZvciBjbGF1ZGUuYWkgc3Vic2NyaWJlcnMgKHVubGVzcyB1c2VyIGlzIGFudClcbiAgICBpZiAoXCJleHRlcm5hbFwiICE9PSAnYW50JyAmJiAhaXNDbGF1ZGVBSVN1YnNjcmliZXIoKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAga2V5OiAnY2hyb21lLXJlcXVpcmVzLXN1YnNjcmlwdGlvbicsXG4gICAgICAgIGpzeDogKFxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICAgIENsYXVkZSBpbiBDaHJvbWUgcmVxdWlyZXMgYSBjbGF1ZGUuYWkgc3Vic2NyaXB0aW9uXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApLFxuICAgICAgICBwcmlvcml0eTogJ2ltbWVkaWF0ZScsXG4gICAgICAgIHRpbWVvdXRNczogNTAwMCxcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpbnN0YWxsZWQgPSBhd2FpdCBpc0Nocm9tZUV4dGVuc2lvbkluc3RhbGxlZCgpXG4gICAgaWYgKCFpbnN0YWxsZWQgJiYgIWlzUnVubmluZ09uSG9tZXNwYWNlKCkpIHtcbiAgICAgIC8vIFNraXAgbm90aWZpY2F0aW9uIG9uIEhvbWVzcGFjZSBzaW5jZSBDaHJvbWUgc2V0dXAgcmVxdWlyZXMgZGlmZmVyZW50IHN0ZXBzIChzZWUgZ28vaHNwcm94eSlcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleTogJ2Nocm9tZS1leHRlbnNpb24tbm90LWRldGVjdGVkJyxcbiAgICAgICAganN4OiAoXG4gICAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCI+XG4gICAgICAgICAgICBDaHJvbWUgZXh0ZW5zaW9uIG5vdCBkZXRlY3RlZCDCtyBodHRwczovL2NsYXVkZS5haS9jaHJvbWUgdG8gaW5zdGFsbFxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKSxcbiAgICAgICAgLy8gVE9ETyhoYWNreW9uKTogTG93ZXIgdGhlIHByaW9yaXR5IGlmIHRoZSBjbGF1ZGUtaW4tY2hyb21lIGludGVncmF0aW9uIGlzIG5vIGxvbmdlciBvcHQtaW5cbiAgICAgICAgcHJpb3JpdHk6ICdpbW1lZGlhdGUnLFxuICAgICAgICB0aW1lb3V0TXM6IDMwMDAsXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjaHJvbWVGbGFnID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFNob3cgbG93IHByaW9yaXR5IG5vdGlmaWNhdGlvbiBvbmx5IHdoZW4gQ2hyb21lIGlzIGVuYWJsZWQgYnkgZGVmYXVsdFxuICAgICAgLy8gKG5vdCBleHBsaWNpdGx5IGVuYWJsZWQgd2l0aCAtLWNocm9tZSBvciBkaXNhYmxlZCB3aXRoIC0tbm8tY2hyb21lKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAga2V5OiAnY2xhdWRlLWluLWNocm9tZS1kZWZhdWx0LWVuYWJsZWQnLFxuICAgICAgICB0ZXh0OiBgQ2xhdWRlIGluIENocm9tZSBlbmFibGVkIMK3IC9jaHJvbWVgLFxuICAgICAgICBwcmlvcml0eTogJ2xvdycsXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsXG4gIH0pXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsSUFBSSxRQUFRLFdBQVc7QUFDaEMsU0FBU0Msb0JBQW9CLFFBQVEsa0JBQWtCO0FBQ3ZELFNBQ0VDLDBCQUEwQixFQUMxQkMsMEJBQTBCLFFBQ3JCLGtDQUFrQztBQUN6QyxTQUFTQyxvQkFBb0IsUUFBUSxzQkFBc0I7QUFDM0QsU0FBU0Msc0JBQXNCLFFBQVEsb0NBQW9DO0FBRTNFLFNBQVNDLGFBQWFBLENBQUEsQ0FBRSxFQUFFLE9BQU8sR0FBRyxTQUFTLENBQUM7RUFDNUMsSUFBSUMsT0FBTyxDQUFDQyxJQUFJLENBQUNDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRTtJQUNyQyxPQUFPLElBQUk7RUFDYjtFQUNBLElBQUlGLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUU7SUFDeEMsT0FBTyxLQUFLO0VBQ2Q7RUFDQSxPQUFPQyxTQUFTO0FBQ2xCO0FBRUEsT0FBTyxTQUFBQywrQkFBQTtFQUNMTixzQkFBc0IsQ0FBQ08sS0EyQ3RCLENBQUM7QUFBQTtBQTVDRyxlQUFBQSxNQUFBO0VBRUgsTUFBQUMsVUFBQSxHQUFtQlAsYUFBYSxDQUFDLENBQUM7RUFDbEMsSUFBSSxDQUFDSCwwQkFBMEIsQ0FBQ1UsVUFBVSxDQUFDO0lBQUEsT0FBUyxJQUFJO0VBQUE7RUFHeEQsSUFBSSxJQUErQyxJQUEvQyxDQUF5Qlosb0JBQW9CLENBQUMsQ0FBQztJQUFBLE9BQzFDO01BQUFhLEdBQUEsRUFDQSw4QkFBOEI7TUFBQUMsR0FBQSxFQUVqQyxDQUFDLElBQUksQ0FBTyxLQUFPLENBQVAsT0FBTyxDQUFDLGtEQUVwQixFQUZDLElBQUksQ0FFRTtNQUFBQyxRQUFBLEVBRUMsV0FBVztNQUFBQyxTQUFBLEVBQ1Y7SUFDYixDQUFDO0VBQUE7RUFHSCxNQUFBQyxTQUFBLEdBQWtCLE1BQU1oQiwwQkFBMEIsQ0FBQyxDQUFDO0VBQ3BELElBQUksQ0FBQ2dCLFNBQW9DLElBQXJDLENBQWVkLG9CQUFvQixDQUFDLENBQUM7SUFBQSxPQUVoQztNQUFBVSxHQUFBLEVBQ0EsK0JBQStCO01BQUFDLEdBQUEsRUFFbEMsQ0FBQyxJQUFJLENBQU8sS0FBUyxDQUFULFNBQVMsQ0FBQyxtRUFFdEIsRUFGQyxJQUFJLENBRUU7TUFBQUMsUUFBQSxFQUdDLFdBQVc7TUFBQUMsU0FBQSxFQUNWO0lBQ2IsQ0FBQztFQUFBO0VBRUgsSUFBSUosVUFBVSxLQUFLSCxTQUFTO0lBQUEsT0FHbkI7TUFBQUksR0FBQSxFQUNBLGtDQUFrQztNQUFBSyxJQUFBLEVBQ2pDLHVDQUFvQztNQUFBSCxRQUFBLEVBQ2hDO0lBQ1osQ0FBQztFQUFBO0VBQ0YsT0FDTSxJQUFJO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=
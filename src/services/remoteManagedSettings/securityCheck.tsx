// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 getIsInteractive，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsInteractive } from '../../bootstrap/state.js';
// 复用 ManagedSettingsSecurityDialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { ManagedSettingsSecurityDialog } from '../../components/ManagedSettingsSecurityDialog/ManagedSettingsSecurityDialog.js';
// 复用 extractDangerousSettings、hasDangerousSettings、hasDangerousSettingsChanged 终端界面组件，避免在这里重复拼装显示逻辑。
import { extractDangerousSettings, hasDangerousSettings, hasDangerousSettingsChanged } from '../../components/ManagedSettingsSecurityDialog/utils.js';
// 引入 render，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { render } from '../../ink.js';
// 引入 KeybindingSetup，将 ../../keybindings/KeybindingProviderSetup.js 中已经封装好的能力接到本文件流程里。
import { KeybindingSetup } from '../../keybindings/KeybindingProviderSetup.js';
// 引入 AppStateProvider，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { AppStateProvider } from '../../state/AppState.js';
// 复用 gracefulShutdownSync 工具函数，把通用处理留在 ../../utils/gracefulShutdown.js 中维护。
import { gracefulShutdownSync } from '../../utils/gracefulShutdown.js';
// 复用 getBaseRenderOptions 工具函数，把通用处理留在 ../../utils/renderOptions.js 中维护。
import { getBaseRenderOptions } from '../../utils/renderOptions.js';
// 类型依赖 { SettingsJson } 来自 ../../utils/settings/types.js，用于校准服务层 security Check的数据契约。
import type { SettingsJson } from '../../utils/settings/types.js';
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js';
// SecurityCheckResult 固化服务层 security Check里传递的数据形状，帮助调用方按同一结构读写字段。
export type SecurityCheckResult = 'approved' | 'rejected' | 'no_check_needed';

/**
 * Check if new remote managed settings contain dangerous settings that require user approval.
 * Shows a blocking dialog if dangerous settings have changed or been added.
 *
 * @param cachedSettings The current cached settings (may be null for first run)
 * @param newSettings The new settings fetched from the API
 * @returns 'approved' if user accepts, 'rejected' if user declines, 'no_check_needed' if no dangerous changes
 */
// checkManagedSettingsSecurity 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkManagedSettingsSecurity(cachedSettings: SettingsJson | null, newSettings: SettingsJson | null): Promise<SecurityCheckResult> {
  // If new settings don't have dangerous settings, no check needed
  // 组合条件 `!newSettings || !hasDangerousSettings(extractDangerousSettings(newSettings))` 成立时，服务层 security Check才启用这条专门路径。
  if (!newSettings || !hasDangerousSettings(extractDangerousSettings(newSettings))) {
    // 返回 `'no_check_needed'`，作为服务层 security Check这次计算的结果。
    return 'no_check_needed';
  }

  // If dangerous settings haven't changed, no check needed
  // 满足 `!hasDangerousSettingsChanged(cachedSettings, newSettings)` 时，服务层 security Check执行该分支。
  if (!hasDangerousSettingsChanged(cachedSettings, newSettings)) {
    // 返回 `'no_check_needed'`，作为服务层 security Check这次计算的结果。
    return 'no_check_needed';
  }

  // Skip dialog in non-interactive mode (consistent with trust dialog behavior)
  // 满足 `!getIsInteractive()` 时，服务层 security Check执行该分支。
  if (!getIsInteractive()) {
    // 返回 `'no_check_needed'`，作为服务层 security Check这次计算的结果。
    return 'no_check_needed';
  }

  // Log that dialog is being shown
  // 记录服务层 security Check运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_managed_settings_security_dialog_shown', {});

  // Show blocking dialog
  // 返回 `new Promise<SecurityCheckResult>(resolve => {`，作为服务层 security Check这次计算的结果。
  return new Promise<SecurityCheckResult>(resolve => {
    // 调用 void，触发服务层 security Check此处需要的副作用。
    void (async () => {
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        unmount
      } = await render(<AppStateProvider>
          <KeybindingSetup>
            {/* 这个回调绑定到 <ManagedSettingsSecurityDialog settings={newSettings} onAccept={() => {，负责服务层 security Check在该局部场景下的响应。 */}
            <ManagedSettingsSecurityDialog settings={newSettings} onAccept={() => {
            // 记录服务层 security Check运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_managed_settings_security_dialog_accepted', {});
            // 调用 unmount，触发服务层 security Check此处需要的副作用。
            unmount();
            // 显式忽略 `resolve('approved')` 的返回值，只保留它触发的副作用。
            void resolve('approved');
          // 这个回调绑定到 }} onReject={() => {，负责服务层 security Check在该局部场景下的响应。
          }} onReject={() => {
            // 记录服务层 security Check运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_managed_settings_security_dialog_rejected', {});
            // 调用 unmount，触发服务层 security Check此处需要的副作用。
            unmount();
            // 显式忽略 `resolve('rejected')` 的返回值，只保留它触发的副作用。
            void resolve('rejected');
          }} />
          </KeybindingSetup>
        </AppStateProvider>, getBaseRenderOptions(false));
    })();
  });
}

/**
 * Handle the security check result by exiting if rejected
 * Returns true if we should continue, false if we should stop
 */
// handleSecurityCheckResult 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handleSecurityCheckResult(result: SecurityCheckResult): boolean {
  // 当 `result` 匹配 `'rejected'` 时，服务层 security Check执行对应分支。
  if (result === 'rejected') {
    // 调用 gracefulShutdownSync，触发服务层 security Check此处需要的副作用。
    gracefulShutdownSync(1);
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImdldElzSW50ZXJhY3RpdmUiLCJNYW5hZ2VkU2V0dGluZ3NTZWN1cml0eURpYWxvZyIsImV4dHJhY3REYW5nZXJvdXNTZXR0aW5ncyIsImhhc0Rhbmdlcm91c1NldHRpbmdzIiwiaGFzRGFuZ2Vyb3VzU2V0dGluZ3NDaGFuZ2VkIiwicmVuZGVyIiwiS2V5YmluZGluZ1NldHVwIiwiQXBwU3RhdGVQcm92aWRlciIsImdyYWNlZnVsU2h1dGRvd25TeW5jIiwiZ2V0QmFzZVJlbmRlck9wdGlvbnMiLCJTZXR0aW5nc0pzb24iLCJsb2dFdmVudCIsIlNlY3VyaXR5Q2hlY2tSZXN1bHQiLCJjaGVja01hbmFnZWRTZXR0aW5nc1NlY3VyaXR5IiwiY2FjaGVkU2V0dGluZ3MiLCJuZXdTZXR0aW5ncyIsIlByb21pc2UiLCJyZXNvbHZlIiwidW5tb3VudCIsImhhbmRsZVNlY3VyaXR5Q2hlY2tSZXN1bHQiLCJyZXN1bHQiXSwic291cmNlcyI6WyJzZWN1cml0eUNoZWNrLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBnZXRJc0ludGVyYWN0aXZlIH0gZnJvbSAnLi4vLi4vYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHsgTWFuYWdlZFNldHRpbmdzU2VjdXJpdHlEaWFsb2cgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01hbmFnZWRTZXR0aW5nc1NlY3VyaXR5RGlhbG9nL01hbmFnZWRTZXR0aW5nc1NlY3VyaXR5RGlhbG9nLmpzJ1xuaW1wb3J0IHtcbiAgZXh0cmFjdERhbmdlcm91c1NldHRpbmdzLFxuICBoYXNEYW5nZXJvdXNTZXR0aW5ncyxcbiAgaGFzRGFuZ2Vyb3VzU2V0dGluZ3NDaGFuZ2VkLFxufSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01hbmFnZWRTZXR0aW5nc1NlY3VyaXR5RGlhbG9nL3V0aWxzLmpzJ1xuaW1wb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgS2V5YmluZGluZ1NldHVwIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvS2V5YmluZGluZ1Byb3ZpZGVyU2V0dXAuanMnXG5pbXBvcnQgeyBBcHBTdGF0ZVByb3ZpZGVyIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgeyBncmFjZWZ1bFNodXRkb3duU3luYyB9IGZyb20gJy4uLy4uL3V0aWxzL2dyYWNlZnVsU2h1dGRvd24uanMnXG5pbXBvcnQgeyBnZXRCYXNlUmVuZGVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL3JlbmRlck9wdGlvbnMuanMnXG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzSnNvbiB9IGZyb20gJy4uLy4uL3V0aWxzL3NldHRpbmdzL3R5cGVzLmpzJ1xuaW1wb3J0IHsgbG9nRXZlbnQgfSBmcm9tICcuLi9hbmFseXRpY3MvaW5kZXguanMnXG5cbmV4cG9ydCB0eXBlIFNlY3VyaXR5Q2hlY2tSZXN1bHQgPSAnYXBwcm92ZWQnIHwgJ3JlamVjdGVkJyB8ICdub19jaGVja19uZWVkZWQnXG5cbi8qKlxuICogQ2hlY2sgaWYgbmV3IHJlbW90ZSBtYW5hZ2VkIHNldHRpbmdzIGNvbnRhaW4gZGFuZ2Vyb3VzIHNldHRpbmdzIHRoYXQgcmVxdWlyZSB1c2VyIGFwcHJvdmFsLlxuICogU2hvd3MgYSBibG9ja2luZyBkaWFsb2cgaWYgZGFuZ2Vyb3VzIHNldHRpbmdzIGhhdmUgY2hhbmdlZCBvciBiZWVuIGFkZGVkLlxuICpcbiAqIEBwYXJhbSBjYWNoZWRTZXR0aW5ncyBUaGUgY3VycmVudCBjYWNoZWQgc2V0dGluZ3MgKG1heSBiZSBudWxsIGZvciBmaXJzdCBydW4pXG4gKiBAcGFyYW0gbmV3U2V0dGluZ3MgVGhlIG5ldyBzZXR0aW5ncyBmZXRjaGVkIGZyb20gdGhlIEFQSVxuICogQHJldHVybnMgJ2FwcHJvdmVkJyBpZiB1c2VyIGFjY2VwdHMsICdyZWplY3RlZCcgaWYgdXNlciBkZWNsaW5lcywgJ25vX2NoZWNrX25lZWRlZCcgaWYgbm8gZGFuZ2Vyb3VzIGNoYW5nZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrTWFuYWdlZFNldHRpbmdzU2VjdXJpdHkoXG4gIGNhY2hlZFNldHRpbmdzOiBTZXR0aW5nc0pzb24gfCBudWxsLFxuICBuZXdTZXR0aW5nczogU2V0dGluZ3NKc29uIHwgbnVsbCxcbik6IFByb21pc2U8U2VjdXJpdHlDaGVja1Jlc3VsdD4ge1xuICAvLyBJZiBuZXcgc2V0dGluZ3MgZG9uJ3QgaGF2ZSBkYW5nZXJvdXMgc2V0dGluZ3MsIG5vIGNoZWNrIG5lZWRlZFxuICBpZiAoXG4gICAgIW5ld1NldHRpbmdzIHx8XG4gICAgIWhhc0Rhbmdlcm91c1NldHRpbmdzKGV4dHJhY3REYW5nZXJvdXNTZXR0aW5ncyhuZXdTZXR0aW5ncykpXG4gICkge1xuICAgIHJldHVybiAnbm9fY2hlY2tfbmVlZGVkJ1xuICB9XG5cbiAgLy8gSWYgZGFuZ2Vyb3VzIHNldHRpbmdzIGhhdmVuJ3QgY2hhbmdlZCwgbm8gY2hlY2sgbmVlZGVkXG4gIGlmICghaGFzRGFuZ2Vyb3VzU2V0dGluZ3NDaGFuZ2VkKGNhY2hlZFNldHRpbmdzLCBuZXdTZXR0aW5ncykpIHtcbiAgICByZXR1cm4gJ25vX2NoZWNrX25lZWRlZCdcbiAgfVxuXG4gIC8vIFNraXAgZGlhbG9nIGluIG5vbi1pbnRlcmFjdGl2ZSBtb2RlIChjb25zaXN0ZW50IHdpdGggdHJ1c3QgZGlhbG9nIGJlaGF2aW9yKVxuICBpZiAoIWdldElzSW50ZXJhY3RpdmUoKSkge1xuICAgIHJldHVybiAnbm9fY2hlY2tfbmVlZGVkJ1xuICB9XG5cbiAgLy8gTG9nIHRoYXQgZGlhbG9nIGlzIGJlaW5nIHNob3duXG4gIGxvZ0V2ZW50KCd0ZW5ndV9tYW5hZ2VkX3NldHRpbmdzX3NlY3VyaXR5X2RpYWxvZ19zaG93bicsIHt9KVxuXG4gIC8vIFNob3cgYmxvY2tpbmcgZGlhbG9nXG4gIHJldHVybiBuZXcgUHJvbWlzZTxTZWN1cml0eUNoZWNrUmVzdWx0PihyZXNvbHZlID0+IHtcbiAgICB2b2lkIChhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB7IHVubW91bnQgfSA9IGF3YWl0IHJlbmRlcihcbiAgICAgICAgPEFwcFN0YXRlUHJvdmlkZXI+XG4gICAgICAgICAgPEtleWJpbmRpbmdTZXR1cD5cbiAgICAgICAgICAgIDxNYW5hZ2VkU2V0dGluZ3NTZWN1cml0eURpYWxvZ1xuICAgICAgICAgICAgICBzZXR0aW5ncz17bmV3U2V0dGluZ3N9XG4gICAgICAgICAgICAgIG9uQWNjZXB0PXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nRXZlbnQoJ3Rlbmd1X21hbmFnZWRfc2V0dGluZ3Nfc2VjdXJpdHlfZGlhbG9nX2FjY2VwdGVkJywge30pXG4gICAgICAgICAgICAgICAgdW5tb3VudCgpXG4gICAgICAgICAgICAgICAgdm9pZCByZXNvbHZlKCdhcHByb3ZlZCcpXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG9uUmVqZWN0PXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nRXZlbnQoJ3Rlbmd1X21hbmFnZWRfc2V0dGluZ3Nfc2VjdXJpdHlfZGlhbG9nX3JlamVjdGVkJywge30pXG4gICAgICAgICAgICAgICAgdW5tb3VudCgpXG4gICAgICAgICAgICAgICAgdm9pZCByZXNvbHZlKCdyZWplY3RlZCcpXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvS2V5YmluZGluZ1NldHVwPlxuICAgICAgICA8L0FwcFN0YXRlUHJvdmlkZXI+LFxuICAgICAgICBnZXRCYXNlUmVuZGVyT3B0aW9ucyhmYWxzZSksXG4gICAgICApXG4gICAgfSkoKVxuICB9KVxufVxuXG4vKipcbiAqIEhhbmRsZSB0aGUgc2VjdXJpdHkgY2hlY2sgcmVzdWx0IGJ5IGV4aXRpbmcgaWYgcmVqZWN0ZWRcbiAqIFJldHVybnMgdHJ1ZSBpZiB3ZSBzaG91bGQgY29udGludWUsIGZhbHNlIGlmIHdlIHNob3VsZCBzdG9wXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVTZWN1cml0eUNoZWNrUmVzdWx0KFxuICByZXN1bHQ6IFNlY3VyaXR5Q2hlY2tSZXN1bHQsXG4pOiBib29sZWFuIHtcbiAgaWYgKHJlc3VsdCA9PT0gJ3JlamVjdGVkJykge1xuICAgIGdyYWNlZnVsU2h1dGRvd25TeW5jKDEpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsZ0JBQWdCLFFBQVEsMEJBQTBCO0FBQzNELFNBQVNDLDZCQUE2QixRQUFRLGlGQUFpRjtBQUMvSCxTQUNFQyx3QkFBd0IsRUFDeEJDLG9CQUFvQixFQUNwQkMsMkJBQTJCLFFBQ3RCLHlEQUF5RDtBQUNoRSxTQUFTQyxNQUFNLFFBQVEsY0FBYztBQUNyQyxTQUFTQyxlQUFlLFFBQVEsOENBQThDO0FBQzlFLFNBQVNDLGdCQUFnQixRQUFRLHlCQUF5QjtBQUMxRCxTQUFTQyxvQkFBb0IsUUFBUSxpQ0FBaUM7QUFDdEUsU0FBU0Msb0JBQW9CLFFBQVEsOEJBQThCO0FBQ25FLGNBQWNDLFlBQVksUUFBUSwrQkFBK0I7QUFDakUsU0FBU0MsUUFBUSxRQUFRLHVCQUF1QjtBQUVoRCxPQUFPLEtBQUtDLG1CQUFtQixHQUFHLFVBQVUsR0FBRyxVQUFVLEdBQUcsaUJBQWlCOztBQUU3RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxlQUFlQyw0QkFBNEJBLENBQ2hEQyxjQUFjLEVBQUVKLFlBQVksR0FBRyxJQUFJLEVBQ25DSyxXQUFXLEVBQUVMLFlBQVksR0FBRyxJQUFJLENBQ2pDLEVBQUVNLE9BQU8sQ0FBQ0osbUJBQW1CLENBQUMsQ0FBQztFQUM5QjtFQUNBLElBQ0UsQ0FBQ0csV0FBVyxJQUNaLENBQUNaLG9CQUFvQixDQUFDRCx3QkFBd0IsQ0FBQ2EsV0FBVyxDQUFDLENBQUMsRUFDNUQ7SUFDQSxPQUFPLGlCQUFpQjtFQUMxQjs7RUFFQTtFQUNBLElBQUksQ0FBQ1gsMkJBQTJCLENBQUNVLGNBQWMsRUFBRUMsV0FBVyxDQUFDLEVBQUU7SUFDN0QsT0FBTyxpQkFBaUI7RUFDMUI7O0VBRUE7RUFDQSxJQUFJLENBQUNmLGdCQUFnQixDQUFDLENBQUMsRUFBRTtJQUN2QixPQUFPLGlCQUFpQjtFQUMxQjs7RUFFQTtFQUNBVyxRQUFRLENBQUMsOENBQThDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0VBRTVEO0VBQ0EsT0FBTyxJQUFJSyxPQUFPLENBQUNKLG1CQUFtQixDQUFDLENBQUNLLE9BQU8sSUFBSTtJQUNqRCxLQUFLLENBQUMsWUFBWTtNQUNoQixNQUFNO1FBQUVDO01BQVEsQ0FBQyxHQUFHLE1BQU1iLE1BQU0sQ0FDOUIsQ0FBQyxnQkFBZ0I7QUFDekIsVUFBVSxDQUFDLGVBQWU7QUFDMUIsWUFBWSxDQUFDLDZCQUE2QixDQUM1QixRQUFRLENBQUMsQ0FBQ1UsV0FBVyxDQUFDLENBQ3RCLFFBQVEsQ0FBQyxDQUFDLE1BQU07WUFDZEosUUFBUSxDQUFDLGlEQUFpRCxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9ETyxPQUFPLENBQUMsQ0FBQztZQUNULEtBQUtELE9BQU8sQ0FBQyxVQUFVLENBQUM7VUFDMUIsQ0FBQyxDQUFDLENBQ0YsUUFBUSxDQUFDLENBQUMsTUFBTTtZQUNkTixRQUFRLENBQUMsaURBQWlELEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0RPLE9BQU8sQ0FBQyxDQUFDO1lBQ1QsS0FBS0QsT0FBTyxDQUFDLFVBQVUsQ0FBQztVQUMxQixDQUFDLENBQUM7QUFFaEIsVUFBVSxFQUFFLGVBQWU7QUFDM0IsUUFBUSxFQUFFLGdCQUFnQixDQUFDLEVBQ25CUixvQkFBb0IsQ0FBQyxLQUFLLENBQzVCLENBQUM7SUFDSCxDQUFDLEVBQUUsQ0FBQztFQUNOLENBQUMsQ0FBQztBQUNKOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFTVSx5QkFBeUJBLENBQ3ZDQyxNQUFNLEVBQUVSLG1CQUFtQixDQUM1QixFQUFFLE9BQU8sQ0FBQztFQUNULElBQUlRLE1BQU0sS0FBSyxVQUFVLEVBQUU7SUFDekJaLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUN2QixPQUFPLEtBQUs7RUFDZDtFQUNBLE9BQU8sSUFBSTtBQUNiIiwiaWdub3JlTGlzdCI6W119
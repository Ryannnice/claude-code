// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 GroveDecision、GroveDialog、PrivacySettingsDialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { type GroveDecision, GroveDialog, PrivacySettingsDialog } from '../../components/grove/Grove.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../services/analytics/index.js';
// 接入 getGroveNoticeConfig、getGroveSettings、isQualifiedForGrove 服务层能力，把外部通信或共享状态交给 ../../services/api/grove.js 处理。
import { getGroveNoticeConfig, getGroveSettings, isQualifiedForGrove } from '../../services/api/grove.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// FALLBACK_MESSAGE 消息数据 命名 `'Review and manage your privacy settings at https://claud...`，让后续代码直接表达这个值的用途。
const FALLBACK_MESSAGE = 'Review and manage your privacy settings at https://claude.ai/settings/data-privacy-controls';
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone): Promise<React.ReactNode | null> {
  // qualified保存`isQualifiedForGrove`，供命令处理后续处理使用。
  const qualified = await isQualifiedForGrove();
  // qualified缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!qualified) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(FALLBACK_MESSAGE);
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // 并行获取 settingsResult、configResult，缩短斜杠命令 privacy settings等待多个独立异步任务的时间。
  const [settingsResult, configResult] = await Promise.all([getGroveSettings(), getGroveNoticeConfig()]);
  // Hide dialog on API failure (after retry)
  // settingsResult.success 集合缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!settingsResult.success) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(FALLBACK_MESSAGE);
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // settings 集合 命名 `settingsResult.data`，让后续代码直接表达这个值的用途。
  const settings = settingsResult.data;
  // 配置 命名 `configResult.success ? configResult.data : null`，让后续代码直接表达这个值的用途。
  const config = configResult.success ? configResult.data : null;
  // onDoneWithDecision 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function onDoneWithDecision(decision: GroveDecision) {
    // 当 `decision` 匹配 `'escape' || decision === 'd...` 时，命令处理执行对应分支。
    if (decision === 'escape' || decision === 'defer') {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('Privacy settings dialog dismissed', {
        display: 'system'
      });
      // 斜杠命令 privacy settings在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 等待 `onDoneWithSettingsCheck()` 完成，再继续斜杠命令 privacy settings的异步流程。
    await onDoneWithSettingsCheck();
  }
  // onDoneWithSettingsCheck 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function onDoneWithSettingsCheck() {
    // updatedSettingsResult读取`getGroveSettings`，供命令处理后续处理使用。
    const updatedSettingsResult = await getGroveSettings();
    // updatedSettingsResult.success 集合缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!updatedSettingsResult.success) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('Unable to retrieve updated privacy settings', {
        display: 'system'
      });
      // 斜杠命令 privacy settings在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // updatedSettings 集合 命名 `updatedSettingsResult.data`，让后续代码直接表达这个值的用途。
    const updatedSettings = updatedSettingsResult.data;
    // groveStatus 集合保存`updatedSettings.grove_enabled ? 'true' : 'false'`，供后续判断或组装使用。
    const groveStatus = updatedSettings.grove_enabled ? 'true' : 'false';
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(`"Help improve Claude" set to ${groveStatus}.`);
    // `settings.grove_enabled` 与 `null && settings.grove` 不一致时刷新派生状态，避免使用过期结果。
    if (settings.grove_enabled !== null && settings.grove_enabled !== updatedSettings.grove_enabled) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_grove_policy_toggled', {
        state: updatedSettings.grove_enabled as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        location: 'settings' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
    }
  }

  // Show privacy settings directly if the user has already accepted the
  // terms.
  // `settings.grove_enabled` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (settings.grove_enabled !== null) {
    // 返回 `<PrivacySettingsDialog settings={settings} domainExcluded={config?.doma...`，作为命令处理这次计算的结果。
    return <PrivacySettingsDialog settings={settings} domainExcluded={config?.domain_excluded} onDone={onDoneWithSettingsCheck}></PrivacySettingsDialog>;
  }

  // Show the GroveDialog for users who haven't accepted terms yet
  // 返回 `<GroveDialog showIfAlreadyViewed={true} onDone={onDoneWithDecision} loc...`，作为命令处理这次计算的结果。
  return <GroveDialog showIfAlreadyViewed={true} onDone={onDoneWithDecision} location={'settings'} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkdyb3ZlRGVjaXNpb24iLCJHcm92ZURpYWxvZyIsIlByaXZhY3lTZXR0aW5nc0RpYWxvZyIsIkFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMiLCJsb2dFdmVudCIsImdldEdyb3ZlTm90aWNlQ29uZmlnIiwiZ2V0R3JvdmVTZXR0aW5ncyIsImlzUXVhbGlmaWVkRm9yR3JvdmUiLCJMb2NhbEpTWENvbW1hbmRPbkRvbmUiLCJGQUxMQkFDS19NRVNTQUdFIiwiY2FsbCIsIm9uRG9uZSIsIlByb21pc2UiLCJSZWFjdE5vZGUiLCJxdWFsaWZpZWQiLCJzZXR0aW5nc1Jlc3VsdCIsImNvbmZpZ1Jlc3VsdCIsImFsbCIsInN1Y2Nlc3MiLCJzZXR0aW5ncyIsImRhdGEiLCJjb25maWciLCJvbkRvbmVXaXRoRGVjaXNpb24iLCJkZWNpc2lvbiIsImRpc3BsYXkiLCJvbkRvbmVXaXRoU2V0dGluZ3NDaGVjayIsInVwZGF0ZWRTZXR0aW5nc1Jlc3VsdCIsInVwZGF0ZWRTZXR0aW5ncyIsImdyb3ZlU3RhdHVzIiwiZ3JvdmVfZW5hYmxlZCIsInN0YXRlIiwibG9jYXRpb24iLCJkb21haW5fZXhjbHVkZWQiXSwic291cmNlcyI6WyJwcml2YWN5LXNldHRpbmdzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7XG4gIHR5cGUgR3JvdmVEZWNpc2lvbixcbiAgR3JvdmVEaWFsb2csXG4gIFByaXZhY3lTZXR0aW5nc0RpYWxvZyxcbn0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9ncm92ZS9Hcm92ZS5qcydcbmltcG9ydCB7XG4gIHR5cGUgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgbG9nRXZlbnQsXG59IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7XG4gIGdldEdyb3ZlTm90aWNlQ29uZmlnLFxuICBnZXRHcm92ZVNldHRpbmdzLFxuICBpc1F1YWxpZmllZEZvckdyb3ZlLFxufSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hcGkvZ3JvdmUuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5cbmNvbnN0IEZBTExCQUNLX01FU1NBR0UgPVxuICAnUmV2aWV3IGFuZCBtYW5hZ2UgeW91ciBwcml2YWN5IHNldHRpbmdzIGF0IGh0dHBzOi8vY2xhdWRlLmFpL3NldHRpbmdzL2RhdGEtcHJpdmFjeS1jb250cm9scydcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGwoXG4gIG9uRG9uZTogTG9jYWxKU1hDb21tYW5kT25Eb25lLFxuKTogUHJvbWlzZTxSZWFjdC5SZWFjdE5vZGUgfCBudWxsPiB7XG4gIGNvbnN0IHF1YWxpZmllZCA9IGF3YWl0IGlzUXVhbGlmaWVkRm9yR3JvdmUoKVxuICBpZiAoIXF1YWxpZmllZCkge1xuICAgIG9uRG9uZShGQUxMQkFDS19NRVNTQUdFKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCBbc2V0dGluZ3NSZXN1bHQsIGNvbmZpZ1Jlc3VsdF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgZ2V0R3JvdmVTZXR0aW5ncygpLFxuICAgIGdldEdyb3ZlTm90aWNlQ29uZmlnKCksXG4gIF0pXG4gIC8vIEhpZGUgZGlhbG9nIG9uIEFQSSBmYWlsdXJlIChhZnRlciByZXRyeSlcbiAgaWYgKCFzZXR0aW5nc1Jlc3VsdC5zdWNjZXNzKSB7XG4gICAgb25Eb25lKEZBTExCQUNLX01FU1NBR0UpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBjb25zdCBzZXR0aW5ncyA9IHNldHRpbmdzUmVzdWx0LmRhdGFcbiAgY29uc3QgY29uZmlnID0gY29uZmlnUmVzdWx0LnN1Y2Nlc3MgPyBjb25maWdSZXN1bHQuZGF0YSA6IG51bGxcblxuICBhc3luYyBmdW5jdGlvbiBvbkRvbmVXaXRoRGVjaXNpb24oZGVjaXNpb246IEdyb3ZlRGVjaXNpb24pIHtcbiAgICBpZiAoZGVjaXNpb24gPT09ICdlc2NhcGUnIHx8IGRlY2lzaW9uID09PSAnZGVmZXInKSB7XG4gICAgICBvbkRvbmUoJ1ByaXZhY3kgc2V0dGluZ3MgZGlhbG9nIGRpc21pc3NlZCcsIHtcbiAgICAgICAgZGlzcGxheTogJ3N5c3RlbScsXG4gICAgICB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGF3YWl0IG9uRG9uZVdpdGhTZXR0aW5nc0NoZWNrKClcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIG9uRG9uZVdpdGhTZXR0aW5nc0NoZWNrKCkge1xuICAgIGNvbnN0IHVwZGF0ZWRTZXR0aW5nc1Jlc3VsdCA9IGF3YWl0IGdldEdyb3ZlU2V0dGluZ3MoKVxuICAgIGlmICghdXBkYXRlZFNldHRpbmdzUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgIG9uRG9uZSgnVW5hYmxlIHRvIHJldHJpZXZlIHVwZGF0ZWQgcHJpdmFjeSBzZXR0aW5ncycsIHtcbiAgICAgICAgZGlzcGxheTogJ3N5c3RlbScsXG4gICAgICB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZWRTZXR0aW5ncyA9IHVwZGF0ZWRTZXR0aW5nc1Jlc3VsdC5kYXRhXG4gICAgY29uc3QgZ3JvdmVTdGF0dXMgPSB1cGRhdGVkU2V0dGluZ3MuZ3JvdmVfZW5hYmxlZCA/ICd0cnVlJyA6ICdmYWxzZSdcbiAgICBvbkRvbmUoYFwiSGVscCBpbXByb3ZlIENsYXVkZVwiIHNldCB0byAke2dyb3ZlU3RhdHVzfS5gKVxuICAgIGlmIChcbiAgICAgIHNldHRpbmdzLmdyb3ZlX2VuYWJsZWQgIT09IG51bGwgJiZcbiAgICAgIHNldHRpbmdzLmdyb3ZlX2VuYWJsZWQgIT09IHVwZGF0ZWRTZXR0aW5ncy5ncm92ZV9lbmFibGVkXG4gICAgKSB7XG4gICAgICBsb2dFdmVudCgndGVuZ3VfZ3JvdmVfcG9saWN5X3RvZ2dsZWQnLCB7XG4gICAgICAgIHN0YXRlOlxuICAgICAgICAgIHVwZGF0ZWRTZXR0aW5ncy5ncm92ZV9lbmFibGVkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIGxvY2F0aW9uOlxuICAgICAgICAgICdzZXR0aW5ncycgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8gU2hvdyBwcml2YWN5IHNldHRpbmdzIGRpcmVjdGx5IGlmIHRoZSB1c2VyIGhhcyBhbHJlYWR5IGFjY2VwdGVkIHRoZVxuICAvLyB0ZXJtcy5cbiAgaWYgKHNldHRpbmdzLmdyb3ZlX2VuYWJsZWQgIT09IG51bGwpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFByaXZhY3lTZXR0aW5nc0RpYWxvZ1xuICAgICAgICBzZXR0aW5ncz17c2V0dGluZ3N9XG4gICAgICAgIGRvbWFpbkV4Y2x1ZGVkPXtjb25maWc/LmRvbWFpbl9leGNsdWRlZH1cbiAgICAgICAgb25Eb25lPXtvbkRvbmVXaXRoU2V0dGluZ3NDaGVja31cbiAgICAgID48L1ByaXZhY3lTZXR0aW5nc0RpYWxvZz5cbiAgICApXG4gIH1cblxuICAvLyBTaG93IHRoZSBHcm92ZURpYWxvZyBmb3IgdXNlcnMgd2hvIGhhdmVuJ3QgYWNjZXB0ZWQgdGVybXMgeWV0XG4gIHJldHVybiAoXG4gICAgPEdyb3ZlRGlhbG9nXG4gICAgICBzaG93SWZBbHJlYWR5Vmlld2VkPXt0cnVlfVxuICAgICAgb25Eb25lPXtvbkRvbmVXaXRoRGVjaXNpb259XG4gICAgICBsb2NhdGlvbj17J3NldHRpbmdzJ31cbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FDRSxLQUFLQyxhQUFhLEVBQ2xCQyxXQUFX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
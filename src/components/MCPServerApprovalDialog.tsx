// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 复用 getSettings_DEPRECATED、updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED, updateSettingsForSource } from '../utils/settings/settings.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// 引入 MCPServerDialogCopy，将 ./MCPServerDialogCopy.js 中已经封装好的能力接到本文件流程里。
import { MCPServerDialogCopy } from './MCPServerDialogCopy.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  serverName: string;
  onDone(): void;
};
// MCPServerApprovalDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MCPServerApprovalDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    serverName,
    onDone
  } = t0;
  // t1 暂存 `function onChange(value) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone || $[1] !== serverName) {
    // t1 暂存 `function onChange(value) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function onChange(value) {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_mcp_dialog_choice", {
        choice: value as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
      // 终端 UI 组件 MCPServer Approval Dialog在这里处理 `bb2: switch (value) {`，完成这一小步状态转换。
      bb2: switch (value) {
        case "yes":
        case "yes_all":
          {
            // currentSettings_0读取`getSettings_DEPRECATED`，供终端渲染后续处理使用。
            const currentSettings_0 = getSettings_DEPRECATED() || {};
            // enabledServers 集合标记终端 UI MCPServer Approval D...是否启用对应路径。
            const enabledServers = currentSettings_0.enabledMcpjsonServers || [];
            // 满足 `!enabledServers.includes(serverName)` 时，终端渲染执行该分支。
            if (!enabledServers.includes(serverName)) {
              // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
              updateSettingsForSource("localSettings", {
                enabledMcpjsonServers: [...enabledServers, serverName]
              });
            }
            // 当 `value` 匹配 `"yes_all"` 时，终端渲染执行对应分支。
            if (value === "yes_all") {
              // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
              updateSettingsForSource("localSettings", {
                enableAllProjectMcpServers: true
              });
            }
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb2;
          }
        case "no":
          {
            // currentSettings 集合读取`getSettings_DEPRECATED`，供终端渲染后续处理使用。
            const currentSettings = getSettings_DEPRECATED() || {};
            // disabledServers 集合标记终端 UI MCPServer Approval D...是否启用对应路径。
            const disabledServers = currentSettings.disabledMcpjsonServers || [];
            // 满足 `!disabledServers.includes(serverName)` 时，终端渲染执行该分支。
            if (!disabledServers.includes(serverName)) {
              // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
              updateSettingsForSource("localSettings", {
                disabledMcpjsonServers: [...disabledServers, serverName]
              });
            }
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
          }
      }
    };
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `serverName`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = serverName;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // onChange沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const onChange = t1;
  // t2保存``New MCP server found in .mcp.json: ${serverName}``，作为后续固定文本处理的输入。
  const t2 = `New MCP server found in .mcp.json: ${serverName}`;
  // t3 暂存 `() => onChange("no")` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onChange) {
    // t3 暂存 `() => onChange("no")` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => onChange("no");
    // $[3] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onChange;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<MCPServerDialogCopy />` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<MCPServerDialogCopy />` 生成的渲染片段，后续返回路径直接复用。
    t4 = <MCPServerDialogCopy />;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t5 = [{
      label: "Use this and all future MCP servers in this project",
      value: "yes_all"
    }, {
      label: "Use this MCP server",
      value: "yes"
    }, {
      label: "Continue without using this MCP server",
      value: "no"
    }];
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // t6 暂存 `<Select options={t5} onChange={value_0 => onChange(value_...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== onChange) {
    // t6 暂存 `<Select options={t5} onChange={value_0 => onChange(value_...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Select options={t5} onChange={value_0 => onChange(value_0 as 'yes_all' | 'yes' | 'no')} onCancel={() => onChange("no")} />;
    // $[7] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onChange;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // t7 暂存 `<Dialog title={t2} color="warning" onCancel={t3}>{t4}{t6}...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== t2 || $[10] !== t3 || $[11] !== t6) {
    // t7 暂存 `<Dialog title={t2} color="warning" onCancel={t3}>{t4}{t6}...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Dialog title={t2} color="warning" onCancel={t3}>{t4}{t6}</Dialog>;
    // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t2;
    // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t3;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMiLCJsb2dFdmVudCIsImdldFNldHRpbmdzX0RFUFJFQ0FURUQiLCJ1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSIsIlNlbGVjdCIsIkRpYWxvZyIsIk1DUFNlcnZlckRpYWxvZ0NvcHkiLCJQcm9wcyIsInNlcnZlck5hbWUiLCJvbkRvbmUiLCJNQ1BTZXJ2ZXJBcHByb3ZhbERpYWxvZyIsInQwIiwiJCIsIl9jIiwidDEiLCJvbkNoYW5nZSIsInZhbHVlIiwiY2hvaWNlIiwiYmIyIiwiY3VycmVudFNldHRpbmdzXzAiLCJlbmFibGVkU2VydmVycyIsImN1cnJlbnRTZXR0aW5ncyIsImVuYWJsZWRNY3Bqc29uU2VydmVycyIsImluY2x1ZGVzIiwiZW5hYmxlQWxsUHJvamVjdE1jcFNlcnZlcnMiLCJkaXNhYmxlZFNlcnZlcnMiLCJkaXNhYmxlZE1jcGpzb25TZXJ2ZXJzIiwidDIiLCJ0MyIsInQ0IiwiU3ltYm9sIiwiZm9yIiwidDUiLCJsYWJlbCIsInQ2IiwidmFsdWVfMCIsInQ3Il0sInNvdXJjZXMiOlsiTUNQU2VydmVyQXBwcm92YWxEaWFsb2cudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7XG4gIHR5cGUgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgbG9nRXZlbnQsXG59IGZyb20gJ3NyYy9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQge1xuICBnZXRTZXR0aW5nc19ERVBSRUNBVEVELFxuICB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSxcbn0gZnJvbSAnLi4vdXRpbHMvc2V0dGluZ3Mvc2V0dGluZ3MuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBNQ1BTZXJ2ZXJEaWFsb2dDb3B5IH0gZnJvbSAnLi9NQ1BTZXJ2ZXJEaWFsb2dDb3B5LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBzZXJ2ZXJOYW1lOiBzdHJpbmdcbiAgb25Eb25lKCk6IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE1DUFNlcnZlckFwcHJvdmFsRGlhbG9nKHtcbiAgc2VydmVyTmFtZSxcbiAgb25Eb25lLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBmdW5jdGlvbiBvbkNoYW5nZSh2YWx1ZTogJ3llcycgfCAneWVzX2FsbCcgfCAnbm8nKSB7XG4gICAgbG9nRXZlbnQoJ3Rlbmd1X21jcF9kaWFsb2dfY2hvaWNlJywge1xuICAgICAgY2hvaWNlOlxuICAgICAgICB2YWx1ZSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgIH0pXG5cbiAgICBzd2l0Y2ggKHZhbHVlKSB7XG4gICAgICBjYXNlICd5ZXMnOlxuICAgICAgY2FzZSAneWVzX2FsbCc6IHtcbiAgICAgICAgLy8gR2V0IGN1cnJlbnQgZW5hYmxlZCBzZXJ2ZXJzIGZyb20gc2V0dGluZ3NcbiAgICAgICAgY29uc3QgY3VycmVudFNldHRpbmdzID0gZ2V0U2V0dGluZ3NfREVQUkVDQVRFRCgpIHx8IHt9XG4gICAgICAgIGNvbnN0IGVuYWJsZWRTZXJ2ZXJzID0gY3VycmVudFNldHRpbmdzLmVuYWJsZWRNY3Bqc29uU2VydmVycyB8fCBbXVxuXG4gICAgICAgIC8vIEFkZCBzZXJ2ZXIgaWYgbm90IGFscmVhZHkgZW5hYmxlZFxuICAgICAgICBpZiAoIWVuYWJsZWRTZXJ2ZXJzLmluY2x1ZGVzKHNlcnZlck5hbWUpKSB7XG4gICAgICAgICAgdXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UoJ2xvY2FsU2V0dGluZ3MnLCB7XG4gICAgICAgICAgICBlbmFibGVkTWNwanNvblNlcnZlcnM6IFsuLi5lbmFibGVkU2VydmVycywgc2VydmVyTmFtZV0sXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gJ3llc19hbGwnKSB7XG4gICAgICAgICAgdXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UoJ2xvY2FsU2V0dGluZ3MnLCB7XG4gICAgICAgICAgICBlbmFibGVBbGxQcm9qZWN0TWNwU2VydmVyczogdHJ1ZSxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIG9uRG9uZSgpXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlICdubyc6IHtcbiAgICAgICAgLy8gR2V0IGN1cnJlbnQgZGlzYWJsZWQgc2VydmVycyBmcm9tIHNldHRpbmdzXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTZXR0aW5ncyA9IGdldFNldHRpbmdzX0RFUFJFQ0FURUQoKSB8fCB7fVxuICAgICAgICBjb25zdCBkaXNhYmxlZFNlcnZlcnMgPSBjdXJyZW50U2V0dGluZ3MuZGlzYWJsZWRNY3Bqc29uU2VydmVycyB8fCBbXVxuXG4gICAgICAgIC8vIEFkZCBzZXJ2ZXIgaWYgbm90IGFscmVhZHkgZGlzYWJsZWRcbiAgICAgICAgaWYgKCFkaXNhYmxlZFNlcnZlcnMuaW5jbHVkZXMoc2VydmVyTmFtZSkpIHtcbiAgICAgICAgICB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSgnbG9jYWxTZXR0aW5ncycsIHtcbiAgICAgICAgICAgIGRpc2FibGVkTWNwanNvblNlcnZlcnM6IFsuLi5kaXNhYmxlZFNlcnZlcnMsIHNlcnZlck5hbWVdLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgb25Eb25lKClcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2dcbiAgICAgIHRpdGxlPXtgTmV3IE1DUCBzZXJ2ZXIgZm91bmQgaW4gLm1jcC5qc29uOiAke3NlcnZlck5hbWV9YH1cbiAgICAgIGNvbG9yPVwid2FybmluZ1wiXG4gICAgICBvbkNhbmNlbD17KCkgPT4gb25DaGFuZ2UoJ25vJyl9XG4gICAgPlxuICAgICAgPE1DUFNlcnZlckRpYWxvZ0NvcHkgLz5cblxuICAgICAgPFNlbGVjdFxuICAgICAgICBvcHRpb25zPXtbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IGBVc2UgdGhpcyBhbmQgYWxsIGZ1dHVyZSBNQ1Agc2VydmVycyBpbiB0aGlzIHByb2plY3RgLFxuICAgICAgICAgICAgdmFsdWU6ICd5ZXNfYWxsJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgbGFiZWw6IGBVc2UgdGhpcyBNQ1Agc2VydmVyYCwgdmFsdWU6ICd5ZXMnIH0sXG4gICAgICAgICAgeyBsYWJlbDogYENvbnRpbnVlIHdpdGhvdXQgdXNpbmcgdGhpcyBNQ1Agc2VydmVyYCwgdmFsdWU6ICdubycgfSxcbiAgICAgICAgXX1cbiAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IG9uQ2hhbmdlKHZhbHVlIGFzICd5ZXNfYWxsJyB8ICd5ZXMnIHwgJ25vJyl9XG4gICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBvbkNoYW5nZSgnbm8nKX1cbiAgICAgIC8+XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQ0UsS0FBS0MsMERBQTBELEVBQy9EQyxRQUFRLFFBQ0gsaUNBQWlDO0FBQ3hDLFNBQ0VDLHNCQUFzQixFQUN0QkMsdUJBQXVCLFFBQ2xCLCtCQUErQjtBQUN0QyxTQUFTQyxNQUFNLFFBQVEseUJBQXlCO0FBQ2hELFNBQVNDLE1BQU0sUUFBUSwyQkFBMkI7QUFDbEQsU0FBU0MsbUJBQW1CLFFBQVEsMEJBQTBCO0FBRTlELEtBQUtDLEtBQUssR0FBRztFQUNYQyxVQUFVLEVBQUUsTUFBTTtFQUNsQkMsTUFBTSxFQUFFLEVBQUUsSUFBSTtBQUNoQixDQUFDO0FBRUQsT0FBTyxT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
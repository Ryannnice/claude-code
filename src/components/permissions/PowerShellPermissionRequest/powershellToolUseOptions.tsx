// 接入 POWERSHELL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { POWERSHELL_TOOL_NAME } from '../../../tools/PowerShellTool/toolName.js';
// 类型依赖 { PermissionUpdate } 来自 ../../../utils/permissions/PermissionUpdateSchema.js，用于校准终端渲染的数据契约。
import type { PermissionUpdate } from '../../../utils/permissions/PermissionUpdateSchema.js';
// 复用 shouldShowAlwaysAllowOptions 工具函数，把通用处理留在 ../../../utils/permissions/permissionsLoader.js 中维护。
import { shouldShowAlwaysAllowOptions } from '../../../utils/permissions/permissionsLoader.js';
// 类型依赖 { OptionWithDescription } 来自 ../../CustomSelect/select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from '../../CustomSelect/select.js';
// 引入 generateShellSuggestionsLabel，将 ../shellPermissionHelpers.js 中已经封装好的能力接到本文件流程里。
import { generateShellSuggestionsLabel } from '../shellPermissionHelpers.js';
// PowerShellToolUseOption 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type PowerShellToolUseOption = 'yes' | 'yes-apply-suggestions' | 'yes-prefix-edited' | 'no';
// powershellToolUseOptions 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function powershellToolUseOptions({
  suggestions = [],
  onRejectFeedbackChange,
  onAcceptFeedbackChange,
  yesInputMode = false,
  noInputMode = false,
  editablePrefix,
  onEditablePrefixChange
}: {
  suggestions?: PermissionUpdate[];
  // 这个回调绑定到 onRejectFeedbackChange: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  onRejectFeedbackChange: (value: string) => void;
  // 这个回调绑定到 onAcceptFeedbackChange: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  onAcceptFeedbackChange: (value: string) => void;
  yesInputMode?: boolean;
  noInputMode?: boolean;
  editablePrefix?: string;
  onEditablePrefixChange?: (value: string) => void;
}): OptionWithDescription<PowerShellToolUseOption>[] {
  // 选项 从空数组开始收集，后续循环会按处理顺序追加条目。
  const options: OptionWithDescription<PowerShellToolUseOption>[] = [];
  // 满足 `yesInputMode` 时，终端渲染执行该分支。
  if (yesInputMode) {
    // 选项追加新条目，保持收集顺序与输入顺序一致。
    options.push({
      type: 'input',
      label: 'Yes',
      value: 'yes',
      placeholder: 'and tell Claude what to do next',
      onChange: onAcceptFeedbackChange,
      allowEmptySubmitToCancel: true
    });
  } else {
    // 选项追加新条目，保持收集顺序与输入顺序一致。
    options.push({
      label: 'Yes',
      value: 'yes'
    });
  }

  // Note: No sandbox toggle for PowerShell - sandbox is not supported on Windows
  // Note: No classifier-reviewed option for PowerShell (ANT-ONLY feature for Bash)

  // Only show "always allow" options when not restricted by allowManagedPermissionRulesOnly.
  // Prefer the editable prefix input (static extractor + user edits) over the
  // non-editable suggestions label. The editable input can't represent
  // directory permissions or Read-tool rules, so fall back to the label when
  // those are present.
  // 只有 `shouldShowAlwaysAllowOptions() && suggestions.length > 0` 满足时，终端渲染才执行该分支。
  if (shouldShowAlwaysAllowOptions() && suggestions.length > 0) {
    // hasNonPowerShellSuggestions 集合记录 `suggestions.some` 是否成立，终端渲染随后按该结果分支。
    const hasNonPowerShellSuggestions = suggestions.some(s => s.type === 'addDirectories' || s.type === 'addRules' && s.rules?.some(r => r.toolName !== POWERSHELL_TOOL_NAME));
    // `editablePrefix` 与 `undefined && onEditablePrefixC` 不一致时刷新派生状态，避免使用过期结果。
    if (editablePrefix !== undefined && onEditablePrefixChange && !hasNonPowerShellSuggestions) {
      // 选项追加新条目，保持收集顺序与输入顺序一致。
      options.push({
        type: 'input',
        label: 'Yes, and don\u2019t ask again for',
        value: 'yes-prefix-edited',
        placeholder: 'command prefix (e.g., Get-Process:*)',
        initialValue: editablePrefix,
        onChange: onEditablePrefixChange,
        allowEmptySubmitToCancel: true,
        showLabelWithValue: true,
        labelValueSeparator: ': ',
        resetCursorOnUpdate: true
      });
    } else {
      // label保存`generateShellSuggestionsLabel`，供终端渲染后续处理使用。
      const label = generateShellSuggestionsLabel(suggestions, POWERSHELL_TOOL_NAME);
      // 满足 `label` 时，终端渲染执行该分支。
      if (label) {
        // 选项追加新条目，保持收集顺序与输入顺序一致。
        options.push({
          label,
          value: 'yes-apply-suggestions'
        });
      }
    }
  }
  // 满足 `noInputMode` 时，终端渲染执行该分支。
  if (noInputMode) {
    // 选项追加新条目，保持收集顺序与输入顺序一致。
    options.push({
      type: 'input',
      label: 'No',
      value: 'no',
      placeholder: 'and tell Claude what to do differently',
      onChange: onRejectFeedbackChange,
      allowEmptySubmitToCancel: true
    });
  } else {
    // 选项追加新条目，保持收集顺序与输入顺序一致。
    options.push({
      label: 'No',
      value: 'no'
    });
  }
  // 返回 `options`，作为终端渲染这次计算的结果。
  return options;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQT1dFUlNIRUxMX1RPT0xfTkFNRSIsIlBlcm1pc3Npb25VcGRhdGUiLCJzaG91bGRTaG93QWx3YXlzQWxsb3dPcHRpb25zIiwiT3B0aW9uV2l0aERlc2NyaXB0aW9uIiwiZ2VuZXJhdGVTaGVsbFN1Z2dlc3Rpb25zTGFiZWwiLCJQb3dlclNoZWxsVG9vbFVzZU9wdGlvbiIsInBvd2Vyc2hlbGxUb29sVXNlT3B0aW9ucyIsInN1Z2dlc3Rpb25zIiwib25SZWplY3RGZWVkYmFja0NoYW5nZSIsIm9uQWNjZXB0RmVlZGJhY2tDaGFuZ2UiLCJ5ZXNJbnB1dE1vZGUiLCJub0lucHV0TW9kZSIsImVkaXRhYmxlUHJlZml4Iiwib25FZGl0YWJsZVByZWZpeENoYW5nZSIsInZhbHVlIiwib3B0aW9ucyIsInB1c2giLCJ0eXBlIiwibGFiZWwiLCJwbGFjZWhvbGRlciIsIm9uQ2hhbmdlIiwiYWxsb3dFbXB0eVN1Ym1pdFRvQ2FuY2VsIiwibGVuZ3RoIiwiaGFzTm9uUG93ZXJTaGVsbFN1Z2dlc3Rpb25zIiwic29tZSIsInMiLCJydWxlcyIsInIiLCJ0b29sTmFtZSIsInVuZGVmaW5lZCIsImluaXRpYWxWYWx1ZSIsInNob3dMYWJlbFdpdGhWYWx1ZSIsImxhYmVsVmFsdWVTZXBhcmF0b3IiLCJyZXNldEN1cnNvck9uVXBkYXRlIl0sInNvdXJjZXMiOlsicG93ZXJzaGVsbFRvb2xVc2VPcHRpb25zLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQT1dFUlNIRUxMX1RPT0xfTkFNRSB9IGZyb20gJy4uLy4uLy4uL3Rvb2xzL1Bvd2VyU2hlbGxUb29sL3Rvb2xOYW1lLmpzJ1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uVXBkYXRlIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvUGVybWlzc2lvblVwZGF0ZVNjaGVtYS5qcydcbmltcG9ydCB7IHNob3VsZFNob3dBbHdheXNBbGxvd09wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi91dGlscy9wZXJtaXNzaW9ucy9wZXJtaXNzaW9uc0xvYWRlci5qcydcbmltcG9ydCB0eXBlIHsgT3B0aW9uV2l0aERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IGdlbmVyYXRlU2hlbGxTdWdnZXN0aW9uc0xhYmVsIH0gZnJvbSAnLi4vc2hlbGxQZXJtaXNzaW9uSGVscGVycy5qcydcblxuZXhwb3J0IHR5cGUgUG93ZXJTaGVsbFRvb2xVc2VPcHRpb24gPVxuICB8ICd5ZXMnXG4gIHwgJ3llcy1hcHBseS1zdWdnZXN0aW9ucydcbiAgfCAneWVzLXByZWZpeC1lZGl0ZWQnXG4gIHwgJ25vJ1xuXG5leHBvcnQgZnVuY3Rpb24gcG93ZXJzaGVsbFRvb2xVc2VPcHRpb25zKHtcbiAgc3VnZ2VzdGlvbnMgPSBbXSxcbiAgb25SZWplY3RGZWVkYmFja0NoYW5nZSxcbiAgb25BY2NlcHRGZWVkYmFja0NoYW5nZSxcbiAgeWVzSW5wdXRNb2RlID0gZmFsc2UsXG4gIG5vSW5wdXRNb2RlID0gZmFsc2UsXG4gIGVkaXRhYmxlUHJlZml4LFxuICBvbkVkaXRhYmxlUHJlZml4Q2hhbmdlLFxufToge1xuICBzdWdnZXN0aW9ucz86IFBlcm1pc3Npb25VcGRhdGVbXVxuICBvblJlamVjdEZlZWRiYWNrQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICBvbkFjY2VwdEZlZWRiYWNrQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICB5ZXNJbnB1dE1vZGU/OiBib29sZWFuXG4gIG5vSW5wdXRNb2RlPzogYm9vbGVhblxuICBlZGl0YWJsZVByZWZpeD86IHN0cmluZ1xuICBvbkVkaXRhYmxlUHJlZml4Q2hhbmdlPzogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbn0pOiBPcHRpb25XaXRoRGVzY3JpcHRpb248UG93ZXJTaGVsbFRvb2xVc2VPcHRpb24+W10ge1xuICBjb25zdCBvcHRpb25zOiBPcHRpb25XaXRoRGVzY3JpcHRpb248UG93ZXJTaGVsbFRvb2xVc2VPcHRpb24+W10gPSBbXVxuXG4gIGlmICh5ZXNJbnB1dE1vZGUpIHtcbiAgICBvcHRpb25zLnB1c2goe1xuICAgICAgdHlwZTogJ2lucHV0JyxcbiAgICAgIGxhYmVsOiAnWWVzJyxcbiAgICAgIHZhbHVlOiAneWVzJyxcbiAgICAgIHBsYWNlaG9sZGVyOiAnYW5kIHRlbGwgQ2xhdWRlIHdoYXQgdG8gZG8gbmV4dCcsXG4gICAgICBvbkNoYW5nZTogb25BY2NlcHRGZWVkYmFja0NoYW5nZSxcbiAgICAgIGFsbG93RW1wdHlTdWJtaXRUb0NhbmNlbDogdHJ1ZSxcbiAgICB9KVxuICB9IGVsc2Uge1xuICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICBsYWJlbDogJ1llcycsXG4gICAgICB2YWx1ZTogJ3llcycsXG4gICAgfSlcbiAgfVxuXG4gIC8vIE5vdGU6IE5vIHNhbmRib3ggdG9nZ2xlIGZvciBQb3dlclNoZWxsIC0gc2FuZGJveCBpcyBub3Qgc3VwcG9ydGVkIG9uIFdpbmRvd3NcbiAgLy8gTm90ZTogTm8gY2xhc3NpZmllci1yZXZpZXdlZCBvcHRpb24gZm9yIFBvd2VyU2hlbGwgKEFOVC1PTkxZIGZlYXR1cmUgZm9yIEJhc2gpXG5cbiAgLy8gT25seSBzaG93IFwiYWx3YXlzIGFsbG93XCIgb3B0aW9ucyB3aGVuIG5vdCByZXN0cmljdGVkIGJ5IGFsbG93TWFuYWdlZFBlcm1pc3Npb25SdWxlc09ubHkuXG4gIC8vIFByZWZlciB0aGUgZWRpdGFibGUgcHJlZml4IGlucHV0IChzdGF0aWMgZXh0cmFjdG9yICsgdXNlciBlZGl0cykgb3ZlciB0aGVcbiAgLy8gbm9uLWVkaXRhYmxlIHN1Z2dlc3Rpb25zIGxhYmVsLiBUaGUgZWRpdGFibGUgaW5wdXQgY2FuJ3QgcmVwcmVzZW50XG4gIC8vIGRpcmVjdG9yeSBwZXJtaXNzaW9ucyBvciBSZWFkLXRvb2wgcnVsZXMsIHNvIGZhbGwgYmFjayB0byB0aGUgbGFiZWwgd2hlblxuICAvLyB0aG9zZSBhcmUgcHJlc2VudC5cbiAgaWYgKHNob3VsZFNob3dBbHdheXNBbGxvd09wdGlvbnMoKSAmJiBzdWdnZXN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaGFzTm9uUG93ZXJTaGVsbFN1Z2dlc3Rpb25zID0gc3VnZ2VzdGlvbnMuc29tZShcbiAgICAgIHMgPT5cbiAgICAgICAgcy50eXBlID09PSAnYWRkRGlyZWN0b3JpZXMnIHx8XG4gICAgICAgIChzLnR5cGUgPT09ICdhZGRSdWxlcycgJiZcbiAgICAgICAgICBzLnJ1bGVzPy5zb21lKHIgPT4gci50b29sTmFtZSAhPT0gUE9XRVJTSEVMTF9UT09MX05BTUUpKSxcbiAgICApXG4gICAgaWYgKFxuICAgICAgZWRpdGFibGVQcmVmaXggIT09IHVuZGVmaW5lZCAmJlxuICAgICAgb25FZGl0YWJsZVByZWZpeENoYW5nZSAmJlxuICAgICAgIWhhc05vblBvd2VyU2hlbGxTdWdnZXN0aW9uc1xuICAgICkge1xuICAgICAgb3B0aW9ucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2lucHV0JyxcbiAgICAgICAgbGFiZWw6ICdZZXMsIGFuZCBkb25cXHUyMDE5dCBhc2sgYWdhaW4gZm9yJyxcbiAgICAgICAgdmFsdWU6ICd5ZXMtcHJlZml4LWVkaXRlZCcsXG4gICAgICAgIHBsYWNlaG9sZGVyOiAnY29tbWFuZCBwcmVmaXggKGUuZy4sIEdldC1Qcm9jZXNzOiopJyxcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBlZGl0YWJsZVByZWZpeCxcbiAgICAgICAgb25DaGFuZ2U6IG9uRWRpdGFibGVQcmVmaXhDaGFuZ2UsXG4gICAgICAgIGFsbG93RW1wdHlTdWJtaXRUb0NhbmNlbDogdHJ1ZSxcbiAgICAgICAgc2hvd0xhYmVsV2l0aFZhbHVlOiB0cnVlLFxuICAgICAgICBsYWJlbFZhbHVlU2VwYXJhdG9yOiAnOiAnLFxuICAgICAgICByZXNldEN1cnNvck9uVXBkYXRlOiB0cnVlLFxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbGFiZWwgPSBnZW5lcmF0ZVNoZWxsU3VnZ2VzdGlvbnNMYWJlbChcbiAgICAgICAgc3VnZ2VzdGlvbnMsXG4gICAgICAgIFBPV0VSU0hFTExfVE9PTF9OQU1FLFxuICAgICAgKVxuICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgdmFsdWU6ICd5ZXMtYXBwbHktc3VnZ2VzdGlvbnMnLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChub0lucHV0TW9kZSkge1xuICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICB0eXBlOiAnaW5wdXQnLFxuICAgICAgbGFiZWw6ICdObycsXG4gICAgICB2YWx1ZTogJ25vJyxcbiAgICAgIHBsYWNlaG9sZGVyOiAnYW5kIHRlbGwgQ2xhdWRlIHdoYXQgdG8gZG8gZGlmZmVyZW50bHknLFxuICAgICAgb25DaGFuZ2U6IG9uUmVqZWN0RmVlZGJhY2tDaGFuZ2UsXG4gICAgICBhbGxvd0VtcHR5U3VibWl0VG9DYW5jZWw6IHRydWUsXG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICBvcHRpb25zLnB1c2goe1xuICAgICAgbGFiZWw6ICdObycsXG4gICAgICB2YWx1ZTogJ25vJyxcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnNcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBU0Esb0JBQW9CLFFBQVEsMkNBQTJDO0FBQ2hGLGNBQWNDLGdCQUFnQixRQUFRLHNEQUFzRDtBQUM1RixTQUFTQyw0QkFBNEIsUUFBUSxpREFBaUQ7QUFDOUYsY0FBY0MscUJBQXFCLFFBQVEsOEJBQThCO0FBQ3pFLFNBQVNDLDZCQUE2QixRQUFRLDhCQUE4QjtBQUU1RSxPQUFPLEtBQUtDLHVCQUF1QixHQUMvQixLQUFLLEdBQ0wsdUJBQXVCLEdBQ3ZCLG1CQUFtQixHQUNuQixJQUFJO0FBRVIsT0FBTyxTQUFTQyx3QkFBd0JBLENBQUM7RUFDdkNDLFdBQVcsR0FBRyxFQUFFO0VBQ2hCQyxzQkFBc0I7RUFDdEJDLHNCQUFzQjtFQUN0QkMsWUFBWSxH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
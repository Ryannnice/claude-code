// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Ansi、Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Box, Text } from '../../ink.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 类型依赖 { PermissionDecision, PermissionDecisionReason } 来自 ../../utils/permissions/PermissionResult.js，用于校准终端渲染的数据契约。
import type { PermissionDecision, PermissionDecisionReason } from '../../utils/permissions/PermissionResult.js';
// 复用 permissionRuleValueToString 工具函数，把通用处理留在 ../../utils/permissions/permissionRuleParser.js 中维护。
import { permissionRuleValueToString } from '../../utils/permissions/permissionRuleParser.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// 引入 ThemedText，将 ../design-system/ThemedText.js 中已经封装好的能力接到本文件流程里。
import ThemedText from '../design-system/ThemedText.js';
// PermissionRuleExplanationProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRuleExplanationProps = {
  permissionResult: PermissionDecision;
  toolType: 'tool' | 'command' | 'edit' | 'read';
};
// DecisionReasonStrings 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DecisionReasonStrings = {
  reasonString: string;
  configString?: string;
  /** When set, reasonString is plain text rendered with this theme color instead of <Ansi>. */
  themeColor?: keyof Theme;
};
// stringsForDecisionReason 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stringsForDecisionReason(reason: PermissionDecisionReason | undefined, toolType: 'tool' | 'command' | 'edit' | 'read'): DecisionReasonStrings | null {
  // reason缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!reason) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 只有 `(feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) && reason....` 满足时，终端渲染才执行该分支。
  if ((feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) && reason.type === 'classifier') {
    // 当 `reason.classifier` 匹配 `'auto-mode'` 时，终端渲染执行对应分支。
    if (reason.classifier === 'auto-mode') {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        reasonString: `Auto mode classifier requires confirmation for this ${toolType}.\n${reason.reason}`,
        configString: undefined,
        themeColor: 'error'
      };
    }
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      reasonString: `Classifier ${chalk.bold(reason.classifier)} requires confirmation for this ${toolType}.\n${reason.reason}`,
      configString: undefined
    };
  }
  // 按照 reason.type 的取值选择终端渲染的具体处理分支。
  switch (reason.type) {
    case 'rule':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        reasonString: `Permission rule ${chalk.bold(permissionRuleValueToString(reason.rule.ruleValue))} requires confirmation for this ${toolType}.`,
        configString: reason.rule.source === 'policySettings' ? undefined : '/permissions to update rules'
      };
    case 'hook':
      {
        // hookReasonString保存`reason.reason ? `:\n${reason.reason}` : '.'`，供后续判断或组装使用。
        const hookReasonString = reason.reason ? `:\n${reason.reason}` : '.';
        // sourceLabel保存`chalk.dim`，供终端渲染后续处理使用。
        const sourceLabel = reason.hookSource ? ` ${chalk.dim(`[${reason.hookSource}]`)}` : '';
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          reasonString: `Hook ${chalk.bold(reason.hookName)} requires confirmation for this ${toolType}${hookReasonString}${sourceLabel}`,
          configString: '/hooks to update'
        };
      }
    case 'safetyCheck':
    case 'other':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        reasonString: reason.reason,
        configString: undefined
      };
    case 'workingDir':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        reasonString: reason.reason,
        configString: '/permissions to update rules'
      };
    default:
      // 返回 `null`，作为终端渲染这次计算的结果。
      return null;
  }
}
// PermissionRuleExplanation 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionRuleExplanation(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    permissionResult,
    toolType
  } = t0;
  // permissionMode 权限数据保存`useAppState`，供终端渲染后续处理使用。
  const permissionMode = useAppState(_temp);
  // t1保存`permissionResult?.decisionReason`，供终端渲染权限确认界面 Permission Rule Explan...后续判断或输出使用。
  const t1 = permissionResult?.decisionReason;
  // t2 暂存 `stringsForDecisionReason(t1, toolType)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t1 || $[1] !== toolType) {
    // t2 暂存 `stringsForDecisionReason(t1, toolType)` 生成的渲染片段，后续返回路径直接复用。
    t2 = stringsForDecisionReason(t1, toolType);
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
    // $[1] 缓存 `toolType`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = toolType;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // strings 集合沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const strings = t2;
  // strings 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!strings) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // themeColor标记终端渲染权限确认界面 Permission Rule Explan...是否启用对应路径。
  const themeColor = strings.themeColor ?? (permissionResult?.decisionReason?.type === "hook" && permissionMode === "auto" ? "warning" : undefined);
  // t3 暂存 `themeColor ? <ThemedText color={themeColor}>{strings.reas...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== strings.reasonString || $[4] !== themeColor) {
    // t3 暂存 `themeColor ? <ThemedText color={themeColor}>{strings.reas...` 生成的渲染片段，后续返回路径直接复用。
    t3 = themeColor ? <ThemedText color={themeColor}>{strings.reasonString}</ThemedText> : <Text><Ansi>{strings.reasonString}</Ansi></Text>;
    // $[3] 缓存 `strings.reasonString`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = strings.reasonString;
    // $[4] 缓存 `themeColor`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = themeColor;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `strings.configString && <Text dimColor={true}>{strings.co...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== strings.configString) {
    // t4 暂存 `strings.configString && <Text dimColor={true}>{strings.co...` 生成的渲染片段，后续返回路径直接复用。
    t4 = strings.configString && <Text dimColor={true}>{strings.configString}</Text>;
    // $[6] 缓存 `strings.configString`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = strings.configString;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<Box marginBottom={1} flexDirection="column">{t3}{t4}</Bo...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t3 || $[9] !== t4) {
    // t5 暂存 `<Box marginBottom={1} flexDirection="column">{t3}{t4}</Bo...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box marginBottom={1} flexDirection="column">{t3}{t4}</Box>;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.toolPermissionContext.mode`，作为终端渲染这次计算的结果。
  return s.toolPermissionContext.mode;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiY2hhbGsiLCJSZWFjdCIsIkFuc2kiLCJCb3giLCJUZXh0IiwidXNlQXBwU3RhdGUiLCJQZXJtaXNzaW9uRGVjaXNpb24iLCJQZXJtaXNzaW9uRGVjaXNpb25SZWFzb24iLCJwZXJtaXNzaW9uUnVsZVZhbHVlVG9TdHJpbmciLCJUaGVtZSIsIlRoZW1lZFRleHQiLCJQZXJtaXNzaW9uUnVsZUV4cGxhbmF0aW9uUHJvcHMiLCJwZXJtaXNzaW9uUmVzdWx0IiwidG9vbFR5cGUiLCJEZWNpc2lvblJlYXNvblN0cmluZ3MiLCJyZWFzb25TdHJpbmciLCJjb25maWdTdHJpbmciLCJ0aGVtZUNvbG9yIiwic3RyaW5nc0ZvckRlY2lzaW9uUmVhc29uIiwicmVhc29uIiwidHlwZSIsImNsYXNzaWZpZXIiLCJ1bmRlZmluZWQiLCJib2xkIiwicnVsZSIsInJ1bGVWYWx1ZSIsInNvdXJjZSIsImhvb2tSZWFzb25TdHJpbmciLCJzb3VyY2VMYWJlbCIsImhvb2tTb3VyY2UiLCJkaW0iLCJob29rTmFtZSIsIlBlcm1pc3Npb25SdWxlRXhwbGFuYXRpb24iLCJ0MCIsIiQiLCJfYyIsInBlcm1pc3Npb25Nb2RlIiwiX3RlbXAiLCJ0MSIsImRlY2lzaW9uUmVhc29uIiwidDIiLCJzdHJpbmdzIiwidDMiLCJ0NCIsInQ1IiwicyIsInRvb2xQZXJtaXNzaW9uQ29udGV4dCIsIm1vZGUiXSwic291cmNlcyI6WyJQZXJtaXNzaW9uUnVsZUV4cGxhbmF0aW9uLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmZWF0dXJlIH0gZnJvbSAnYnVuOmJ1bmRsZSdcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEFuc2ksIEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgdHlwZSB7XG4gIFBlcm1pc3Npb25EZWNpc2lvbixcbiAgUGVybWlzc2lvbkRlY2lzaW9uUmVhc29uLFxufSBmcm9tICcuLi8uLi91dGlscy9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uUmVzdWx0LmpzJ1xuaW1wb3J0IHsgcGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvcGVybWlzc2lvblJ1bGVQYXJzZXIuanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lIH0gZnJvbSAnLi4vLi4vdXRpbHMvdGhlbWUuanMnXG5pbXBvcnQgVGhlbWVkVGV4dCBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL1RoZW1lZFRleHQuanMnXG5cbmV4cG9ydCB0eXBlIFBlcm1pc3Npb25SdWxlRXhwbGFuYXRpb25Qcm9wcyA9IHtcbiAgcGVybWlzc2lvblJlc3VsdDogUGVybWlzc2lvbkRlY2lzaW9uXG4gIHRvb2xUeXBlOiAndG9vbCcgfCAnY29tbWFuZCcgfCAnZWRpdCcgfCAncmVhZCdcbn1cblxudHlwZSBEZWNpc2lvblJlYXNvblN0cmluZ3MgPSB7XG4gIHJlYXNvblN0cmluZzogc3RyaW5nXG4gIGNvbmZpZ1N0cmluZz86IHN0cmluZ1xuICAvKiogV2hlbiBzZXQsIHJlYXNvblN0cmluZyBpcyBwbGFpbiB0ZXh0IHJlbmRlcmVkIHdpdGggdGhpcyB0aGVtZSBjb2xvciBpbnN0ZWFkIG9mIDxBbnNpPi4gKi9cbiAgdGhlbWVDb2xvcj86IGtleW9mIFRoZW1lXG59XG5cbmZ1bmN0aW9uIHN0cmluZ3NGb3JEZWNpc2lvblJlYXNvbihcbiAgcmVhc29uOiBQZXJtaXNzaW9uRGVjaXNpb25SZWFzb24gfCB1bmRlZmluZWQsXG4gIHRvb2xUeXBlOiAndG9vbCcgfCAnY29tbWFuZCcgfCAnZWRpdCcgfCAncmVhZCcsXG4pOiBEZWNpc2lvblJlYXNvblN0cmluZ3MgfCBudWxsIHtcbiAgaWYgKCFyZWFzb24pIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmIChcbiAgICAoZmVhdHVyZSgnQkFTSF9DTEFTU0lGSUVSJykgfHwgZmVhdHVyZSgnVFJBTlNDUklQVF9DTEFTU0lGSUVSJykpICYmXG4gICAgcmVhc29uLnR5cGUgPT09ICdjbGFzc2lmaWVyJ1xuICApIHtcbiAgICBpZiAocmVhc29uLmNsYXNzaWZpZXIgPT09ICdhdXRvLW1vZGUnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFzb25TdHJpbmc6IGBBdXRvIG1vZGUgY2xhc3NpZmllciByZXF1aXJlcyBjb25maXJtYXRpb24gZm9yIHRoaXMgJHt0b29sVHlwZX0uXFxuJHtyZWFzb24ucmVhc29ufWAsXG4gICAgICAgIGNvbmZpZ1N0cmluZzogdW5kZWZpbmVkLFxuICAgICAgICB0aGVtZUNvbG9yOiAnZXJyb3InLFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgcmVhc29uU3RyaW5nOiBgQ2xhc3NpZmllciAke2NoYWxrLmJvbGQocmVhc29uLmNsYXNzaWZpZXIpfSByZXF1aXJlcyBjb25maXJtYXRpb24gZm9yIHRoaXMgJHt0b29sVHlwZX0uXFxuJHtyZWFzb24ucmVhc29ufWAsXG4gICAgICBjb25maWdTdHJpbmc6IHVuZGVmaW5lZCxcbiAgICB9XG4gIH1cbiAgc3dpdGNoIChyZWFzb24udHlwZSkge1xuICAgIGNhc2UgJ3J1bGUnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhc29uU3RyaW5nOiBgUGVybWlzc2lvbiBydWxlICR7Y2hhbGsuYm9sZChcbiAgICAgICAgICBwZXJtaXNzaW9uUnVsZVZhbHVlVG9TdHJpbmcocmVhc29uLnJ1bGUucnVsZVZhbHVlKSxcbiAgICAgICAgKX0gcmVxdWlyZXMgY29uZmlybWF0aW9uIGZvciB0aGlzICR7dG9vbFR5cGV9LmAsXG4gICAgICAgIGNvbmZpZ1N0cmluZzpcbiAgICAgICAgICByZWFzb24ucnVsZS5zb3VyY2UgPT09ICdwb2xpY3lTZXR0aW5ncydcbiAgICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgICA6ICcvcGVybWlzc2lvbnMgdG8gdXBkYXRlIHJ1bGVzJyxcbiAgICAgIH1cbiAgICBjYXNlICdob29rJzoge1xuICAgICAgY29uc3QgaG9va1JlYXNvblN0cmluZyA9IHJlYXNvbi5yZWFzb24gPyBgOlxcbiR7cmVhc29uLnJlYXNvbn1gIDogJy4nXG4gICAgICBjb25zdCBzb3VyY2VMYWJlbCA9IHJlYXNvbi5ob29rU291cmNlXG4gICAgICAgID8gYCAke2NoYWxrLmRpbShgWyR7cmVhc29uLmhvb2tTb3VyY2V9XWApfWBcbiAgICAgICAgOiAnJ1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhc29uU3RyaW5nOiBgSG9vayAke2NoYWxrLmJvbGQocmVhc29uLmhvb2tOYW1lKX0gcmVxdWlyZXMgY29uZmlybWF0aW9uIGZvciB0aGlzICR7dG9vbFR5cGV9JHtob29rUmVhc29uU3RyaW5nfSR7c291cmNlTGFiZWx9YCxcbiAgICAgICAgY29uZmlnU3RyaW5nOiAnL2hvb2tzIHRvIHVwZGF0ZScsXG4gICAgICB9XG4gICAgfVxuICAgIGNhc2UgJ3NhZmV0eUNoZWNrJzpcbiAgICBjYXNlICdvdGhlcic6XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWFzb25TdHJpbmc6IHJlYXNvbi5yZWFzb24sXG4gICAgICAgIGNvbmZpZ1N0cmluZzogdW5kZWZpbmVkLFxuICAgICAgfVxuICAgIGNhc2UgJ3dvcmtpbmdEaXInOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVhc29uU3RyaW5nOiByZWFzb24ucmVhc29uLFxuICAgICAgICBjb25maWdTdHJpbmc6ICcvcGVybWlzc2lvbnMgdG8gdXBkYXRlIHJ1bGVzJyxcbiAgICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gUGVybWlzc2lvblJ1bGVFeHBsYW5hdGlvbih7XG4gIHBlcm1pc3Npb25SZXN1bHQsXG4gIHRvb2xUeXBlLFxufTogUGVybWlzc2lvblJ1bGVFeHBsYW5hdGlvblByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcGVybWlzc2lvbk1vZGUgPSB1c2VBcHBTdGF0ZShzID0+IHMudG9vbFBlcm1pc3Npb25Db250ZXh0Lm1vZGUpXG4gIGNvbnN0IHN0cmluZ3MgPSBzdHJpbmdzRm9yRGVjaXNpb25SZWFzb24oXG4gICAgcGVybWlzc2lvblJlc3VsdD8uZGVjaXNpb25SZWFzb24sXG4gICAgdG9vbFR5cGUsXG4gIClcbiAgaWYgKCFzdHJpbmdzKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IHRoZW1lQ29sb3IgPVxuICAgIHN0cmluZ3MudGhlbWVDb2xvciA/P1xuICAgIChwZXJtaXNzaW9uUmVzdWx0Py5kZWNpc2lvblJlYXNvbj8udHlwZSA9PT0gJ2hvb2snICYmXG4gICAgcGVybWlzc2lvbk1vZGUgPT09ICdhdXRvJ1xuICAgICAgPyAnd2FybmluZydcbiAgICAgIDogdW5kZWZpbmVkKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBtYXJnaW5Cb3R0b209ezF9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIHt0aGVtZUNvbG9yID8gKFxuICAgICAgICA8VGhlbWVkVGV4dCBjb2xvcj17dGhlbWVDb2xvcn0+e3N0cmluZ3MucmVhc29uU3RyaW5nfTwvVGhlbWVkVGV4dD5cbiAgICAgICkgOiAoXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxBbnNpPntzdHJpbmdzLnJlYXNvblN0cmluZ308L0Fuc2k+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgICB7c3RyaW5ncy5jb25maWdTdHJpbmcgJiYgPFRleHQgZGltQ29sb3I+e3N0cmluZ3MuY29uZmlnU3RyaW5nfTwvVGV4dD59XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLE9BQU8sUUFBUSxZQUFZO0FBQ3BDLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLElBQUksRUFBRUMs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
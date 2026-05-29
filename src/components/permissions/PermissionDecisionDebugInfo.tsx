// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo } from 'react';
// 引入 Ansi、Box、color、Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Box, color, Text, useTheme } from '../../ink.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 类型依赖 { PermissionMode } 来自 ../../utils/permissions/PermissionMode.js，用于校准终端渲染的数据契约。
import type { PermissionMode } from '../../utils/permissions/PermissionMode.js';
// 复用 permissionModeTitle 工具函数，把通用处理留在 ../../utils/permissions/PermissionMode.js 中维护。
import { permissionModeTitle } from '../../utils/permissions/PermissionMode.js';
// 类型依赖 { PermissionDecision, PermissionDecisionReason } 来自 ../../utils/permissions/PermissionResult.js，用于校准终端渲染的数据契约。
import type { PermissionDecision, PermissionDecisionReason } from '../../utils/permissions/PermissionResult.js';
// 复用 extractRules 工具函数，把通用处理留在 ../../utils/permissions/PermissionUpdate.js 中维护。
import { extractRules } from '../../utils/permissions/PermissionUpdate.js';
// 类型依赖 { PermissionUpdate } 来自 ../../utils/permissions/PermissionUpdateSchema.js，用于校准终端渲染的数据契约。
import type { PermissionUpdate } from '../../utils/permissions/PermissionUpdateSchema.js';
// 复用 permissionRuleValueToString 工具函数，把通用处理留在 ../../utils/permissions/permissionRuleParser.js 中维护。
import { permissionRuleValueToString } from '../../utils/permissions/permissionRuleParser.js';
// 复用 detectUnreachableRules 工具函数，把通用处理留在 ../../utils/permissions/shadowedRuleDetection.js 中维护。
import { detectUnreachableRules } from '../../utils/permissions/shadowedRuleDetection.js';
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js';
// 复用 getSettingSourceDisplayNameLowercase 工具函数，把通用处理留在 ../../utils/settings/constants.js 中维护。
import { getSettingSourceDisplayNameLowercase } from '../../utils/settings/constants.js';
// PermissionDecisionInfoItemProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type PermissionDecisionInfoItemProps = {
  title?: string;
  decisionReason: PermissionDecisionReason;
};
// decisionReasonDisplayString 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function decisionReasonDisplayString(decisionReason: PermissionDecisionReason & {
  type: Exclude<PermissionDecisionReason['type'], 'subcommandResults'>;
}): string {
  // 只有 `(feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) && decisio...` 满足时，终端渲染才执行该分支。
  if ((feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) && decisionReason.type === 'classifier') {
    // 返回 ``${chalk.bold(decisionReason.classifier)} classifier: ${decisionReason....`，作为终端渲染这次计算的结果。
    return `${chalk.bold(decisionReason.classifier)} classifier: ${decisionReason.reason}`;
  }
  // 按照 decisionReason.type 的取值选择终端渲染的具体处理分支。
  switch (decisionReason.type) {
    case 'rule':
      // 返回 ``${chalk.bold(permissionRuleValueToString(decisionReason.rule.ruleValue...`，作为终端渲染这次计算的结果。
      return `${chalk.bold(permissionRuleValueToString(decisionReason.rule.ruleValue))} rule from ${getSettingSourceDisplayNameLowercase(decisionReason.rule.source)}`;
    case 'mode':
      // 返回 ``${permissionModeTitle(decisionReason.mode)} mode``，作为终端渲染这次计算的结果。
      return `${permissionModeTitle(decisionReason.mode)} mode`;
    case 'sandboxOverride':
      // 返回 `'Requires permission to bypass sandbox'`，作为终端渲染这次计算的结果。
      return 'Requires permission to bypass sandbox';
    case 'workingDir':
      // 返回 `decisionReason.reason`，作为终端渲染这次计算的结果。
      return decisionReason.reason;
    case 'safetyCheck':
    case 'other':
      // 返回 `decisionReason.reason`，作为终端渲染这次计算的结果。
      return decisionReason.reason;
    case 'permissionPromptTool':
      // 返回 ``${chalk.bold(decisionReason.permissionPromptToolName)} permission prom...`，作为终端渲染这次计算的结果。
      return `${chalk.bold(decisionReason.permissionPromptToolName)} permission prompt tool`;
    case 'hook':
      // 返回 `decisionReason.reason ? `${chalk.bold(decisionReason.hookName)} hook: $...`，作为终端渲染这次计算的结果。
      return decisionReason.reason ? `${chalk.bold(decisionReason.hookName)} hook: ${decisionReason.reason}` : `${chalk.bold(decisionReason.hookName)} hook`;
    case 'asyncAgent':
      // 返回 `decisionReason.reason`，作为终端渲染这次计算的结果。
      return decisionReason.reason;
    default:
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return '';
  }
}
// PermissionDecisionInfoItem 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function PermissionDecisionInfoItem(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title,
    decisionReason
  } = t0;
  // 从 `useTheme()` 按位置拆出 theme，让权限确认界面 Permission Decision Debug In...分别处理这些返回值。
  const [theme] = useTheme();
  // t1 暂存 `function formatDecisionReason() {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== decisionReason || $[1] !== theme) {
    // t1 暂存 `function formatDecisionReason() {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function formatDecisionReason() {
      // 按照 decisionReason.type 的取值选择终端渲染的具体处理分支。
      switch (decisionReason.type) {
        case "subcommandResults":
          {
            // 返回 `<Box flexDirection="column">{Array.from(decisionReason.reasons.entries(...`，作为终端渲染这次计算的结果。
            return <Box flexDirection="column">{Array.from(decisionReason.reasons.entries()).map(t2 => {
                // 从 `t2` 按位置拆出 subcommand、result，让权限确认界面 Permission Decision Debug In...分别处理这些返回值。
                const [subcommand, result] = t2;
                // icon保存`color`，供终端渲染后续处理使用。
                const icon = result.behavior === "allow" ? color("success", theme)(figures.tick) : color("error", theme)(figures.cross);
                // 返回 `<Box flexDirection="column" key={subcommand}><Text>{icon} {subcommand}<...`，作为终端渲染这次计算的结果。
                return <Box flexDirection="column" key={subcommand}><Text>{icon} {subcommand}</Text>{result.decisionReason !== undefined && result.decisionReason.type !== "subcommandResults" && <Text><Text dimColor={true}>{"  "}⎿{"  "}</Text><Ansi>{decisionReasonDisplayString(result.decisionReason)}</Ansi></Text>}{result.behavior === "ask" && <SuggestedRules suggestions={result.suggestions} />}</Box>;
              })}</Box>;
          }
        default:
          {
            // 返回 `<Text><Ansi>{decisionReasonDisplayString(decisionReason)}</Ansi></Text>`，作为终端渲染这次计算的结果。
            return <Text><Ansi>{decisionReasonDisplayString(decisionReason)}</Ansi></Text>;
          }
      }
    };
    // $[0] 缓存 `decisionReason`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = decisionReason;
    // $[1] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = theme;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // formatDecisionReason 命名 `t1`，让后续代码直接表达这个值的用途。
  const formatDecisionReason = t1;
  // t2 暂存 `title && <Text>{title}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== title) {
    // t2 暂存 `title && <Text>{title}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = title && <Text>{title}</Text>;
    // $[3] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = title;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `formatDecisionReason()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== formatDecisionReason) {
    // t3 暂存 `formatDecisionReason()` 生成的渲染片段，后续返回路径直接复用。
    t3 = formatDecisionReason();
    // $[5] 缓存 `formatDecisionReason`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = formatDecisionReason;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Box flexDirection="column">{t2}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t2 || $[8] !== t3) {
    // t4 暂存 `<Box flexDirection="column">{t2}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column">{t2}{t3}</Box>;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
// SuggestedRules 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SuggestedRules(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    suggestions
  } = t0;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // t5 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== suggestions) {
    // t5 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t5 = Symbol.for("react.early_return_sentinel");
    // 权限确认界面 Permission Decision Debug In...在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // rules 集合保存`extractRules`，供终端渲染后续处理使用。
      const rules = extractRules(suggestions);
      // rules 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
      if (rules.length === 0) {
        // t5 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t5 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // T1 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
      T1 = Text;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        // t2 暂存 `<Text dimColor={true}>{" "}⎿{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
        t2 = <Text dimColor={true}>{"  "}⎿{"  "}</Text>;
        // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[8] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[8];
      }
      // t3 暂存 `"Suggested rules:"` 生成的渲染片段，后续返回路径直接复用。
      t3 = "Suggested rules:";
      // t4 暂存 `" "` 生成的渲染片段，后续返回路径直接复用。
      t4 = " ";
      // T0 暂存 `Ansi` 生成的渲染片段，后续返回路径直接复用。
      T0 = Ansi;
      // t1 暂存 `rules.map(_temp).join(", ")` 生成的渲染片段，后续返回路径直接复用。
      t1 = rules.map(_temp).join(", ");
    }
    // $[0] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = suggestions;
    // $[1] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = T0;
    // $[2] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = T1;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // T0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[1];
    // T1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[2];
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // `t5` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t5 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // t6 暂存 `<T0>{t1}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== T0 || $[10] !== t1) {
    // t6 暂存 `<T0>{t1}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <T0>{t1}</T0>;
    // $[9] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = T0;
    // $[10] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t1;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // t7 暂存 `<T1>{t2}{t3}{t4}{t6}</T1>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== T1 || $[13] !== t2 || $[14] !== t3 || $[15] !== t4 || $[16] !== t6) {
    // t7 暂存 `<T1>{t2}{t3}{t4}{t6}</T1>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <T1>{t2}{t3}{t4}{t6}</T1>;
    // $[12] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = T1;
    // $[13] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t2;
    // $[14] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t3;
    // $[15] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t4;
    // $[16] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t6;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[17];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(rule) {
  // 返回 `chalk.bold(permissionRuleValueToString(rule))`，作为终端渲染这次计算的结果。
  return chalk.bold(permissionRuleValueToString(rule));
}
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  permissionResult: PermissionDecision;
  toolName?: string; // Filter unreachable rules to this tool
};

// Helper function to extract directories from permission updates
// extractDirectories 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractDirectories(updates: PermissionUpdate[] | undefined): string[] {
  // updates 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!updates) return [];
  // 返回 `updates.flatMap(update => {`，作为终端渲染这次计算的结果。
  return updates.flatMap(update => {
    // 按照 update.type 的取值选择终端渲染的具体处理分支。
    switch (update.type) {
      case 'addDirectories':
        // 返回 `update.directories`，作为终端渲染这次计算的结果。
        return update.directories;
      default:
        // 返回列表结果，保留终端渲染已经排好的条目顺序。
        return [];
    }
  });
}

// Helper function to extract mode from permission updates
// extractMode 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractMode(updates: PermissionUpdate[] | undefined): PermissionMode | undefined {
  // updates 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!updates) return undefined;
  // update筛选`updates.findLast`，供终端渲染后续处理使用。
  const update = updates.findLast(u => u.type === 'setMode');
  // 返回 `update?.type === 'setMode' ? update.mode : undefined`，作为终端渲染这次计算的结果。
  return update?.type === 'setMode' ? update.mode : undefined;
}
// SuggestionDisplay 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SuggestionDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(22);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    suggestions,
    width
  } = t0;
  // !suggestions || suggestions 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (!suggestions || suggestions.length === 0) {
    // t1 暂存 `<Text dimColor={true}>Suggestions </Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Text dimColor={true}>Suggestions </Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text dimColor={true}>Suggestions </Text>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // t2 暂存 `<Box justifyContent="flex-end" minWidth={width}>{t1}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== width) {
      // t2 暂存 `<Box justifyContent="flex-end" minWidth={width}>{t1}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Box justifyContent="flex-end" minWidth={width}>{t1}</Box>;
      // $[1] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = width;
      // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[2];
    }
    // t3 暂存 `<Text>None</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `<Text>None</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text>None</Text>;
      // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[3];
    }
    // t4 暂存 `<Box flexDirection="row">{t2}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== t2) {
      // t4 暂存 `<Box flexDirection="row">{t2}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Box flexDirection="row">{t2}{t3}</Box>;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
      // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[5];
    }
    // 返回 `t4`，作为终端渲染这次计算的结果。
    return t4;
  }
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // t2 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== suggestions || $[7] !== width) {
    // t2 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t2 = Symbol.for("react.early_return_sentinel");
    // 权限确认界面 Permission Decision Debug In...在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // rules 集合保存`extractRules`，供终端渲染后续处理使用。
      const rules = extractRules(suggestions);
      // directories 集合保存`extractDirectories`，供终端渲染后续处理使用。
      const directories = extractDirectories(suggestions);
      // mode保存`extractMode`，供终端渲染后续处理使用。
      const mode = extractMode(suggestions);
      // 只有 `rules.length === 0 && directories.length === 0 &&` 满足时，终端渲染才执行该分支。
      if (rules.length === 0 && directories.length === 0 && !mode) {
        // t3 暂存 `<Text dimColor={true}>Suggestion </Text>` 的派生结果，便于缓存命中时直接复用。
        let t3;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
          // t3 暂存 `<Text dimColor={true}>Suggestion </Text>` 生成的渲染片段，后续返回路径直接复用。
          t3 = <Text dimColor={true}>Suggestion </Text>;
          // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[10] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[10];
        }
        // t4 暂存 `<Box justifyContent="flex-end" minWidth={width}>{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[11] !== width) {
          // t4 暂存 `<Box justifyContent="flex-end" minWidth={width}>{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
          t4 = <Box justifyContent="flex-end" minWidth={width}>{t3}</Box>;
          // $[11] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
          $[11] = width;
          // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[12] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[12];
        }
        // t5 暂存 `<Text>None</Text>` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
          // t5 暂存 `<Text>None</Text>` 生成的渲染片段，后续返回路径直接复用。
          t5 = <Text>None</Text>;
          // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[13] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[13];
        }
        // t6 暂存 `<Box flexDirection="row">{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
        let t6;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[14] !== t4) {
          // t6 暂存 `<Box flexDirection="row">{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
          t6 = <Box flexDirection="row">{t4}{t5}</Box>;
          // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[14] = t4;
          // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[15] = t6;
        } else {
          // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
          t6 = $[15];
        }
        // t2 暂存 `t6` 生成的渲染片段，后续返回路径直接复用。
        t2 = t6;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // t3 暂存 `<Text dimColor={true}>Suggestions </Text>` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        // t3 暂存 `<Text dimColor={true}>Suggestions </Text>` 生成的渲染片段，后续返回路径直接复用。
        t3 = <Text dimColor={true}>Suggestions </Text>;
        // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[16] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[16];
      }
      // t4 暂存 `<Box justifyContent="flex-end" minWidth={width}>{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
      let t4;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[17] !== width) {
        // t4 暂存 `<Box justifyContent="flex-end" minWidth={width}>{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
        t4 = <Box justifyContent="flex-end" minWidth={width}>{t3}</Box>;
        // $[17] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
        $[17] = width;
        // $[18] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
        $[18] = t4;
      } else {
        // t4 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
        t4 = $[18];
      }
      // t5 暂存 `<Text> </Text>` 的派生结果，便于缓存命中时直接复用。
      let t5;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
        // t5 暂存 `<Text> </Text>` 生成的渲染片段，后续返回路径直接复用。
        t5 = <Text> </Text>;
        // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[19] = t5;
      } else {
        // t5 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
        t5 = $[19];
      }
      // t6 暂存 `<Box flexDirection="row">{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
      let t6;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[20] !== t4) {
        // t6 暂存 `<Box flexDirection="row">{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
        t6 = <Box flexDirection="row">{t4}{t5}</Box>;
        // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
        $[20] = t4;
        // $[21] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
        $[21] = t6;
      } else {
        // t6 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
        t6 = $[21];
      }
      // t1 暂存 `<Box flexDirection="column">{t6}{rules.length > 0 && <Box...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Box flexDirection="column">{t6}{rules.length > 0 && <Box flexDirection="row"><Box justifyContent="flex-end" minWidth={width}><Text dimColor={true}> Rules </Text></Box><Box flexDirection="column">{rules.map(_temp2)}</Box></Box>}{directories.length > 0 && <Box flexDirection="row"><Box justifyContent="flex-end" minWidth={width}><Text dimColor={true}> Directories </Text></Box><Box flexDirection="column">{directories.map(_temp3)}</Box></Box>}{mode && <Box flexDirection="row"><Box justifyContent="flex-end" minWidth={width}><Text dimColor={true}> Mode </Text></Box><Text>{permissionModeTitle(mode)}</Text></Box>}</Box>;
    }
    // $[6] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = suggestions;
    // $[7] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = width;
    // $[8] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t1;
    // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[8];
    // t2 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[9];
  }
  // `t2` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// _temp3 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(dir, index_0) {
  // 返回 `<Text key={index_0}>{figures.bullet} {dir}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={index_0}>{figures.bullet} {dir}</Text>;
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(rule, index) {
  // 返回 `<Text key={index}>{figures.bullet} {permissionRuleValueToString(rule)}<...`，作为终端渲染这次计算的结果。
  return <Text key={index}>{figures.bullet} {permissionRuleValueToString(rule)}</Text>;
}
// PermissionDecisionDebugInfo 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionDecisionDebugInfo(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    permissionResult,
    toolName
  } = t0;
  // toolPermissionContext 权限数据保存`useAppState`，供终端渲染后续处理使用。
  const toolPermissionContext = useAppState(_temp4);
  // 决策原因保存`permissionResult.decisionReason`，供后续判断或组装使用。
  const decisionReason = permissionResult.decisionReason;
  // suggestions 集合固定为 `"suggestions" in permissionResult ? permissionResult.sugg...`，作为终端渲染权限确认界面 Permission Decision De...后续展示或比较的基准。
  const suggestions = "suggestions" in permissionResult ? permissionResult.suggestions : undefined;
  // t1 暂存 `all.filter(u => suggestedRules.some(suggested => suggeste...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== suggestions || $[1] !== toolName || $[2] !== toolPermissionContext) {
    // 权限确认界面 Permission Decision Debug In...在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // sandboxAutoAllowEnabled保存`SandboxManager.isSandboxingEnabled`，供终端渲染后续处理使用。
      const sandboxAutoAllowEnabled = SandboxManager.isSandboxingEnabled() && SandboxManager.isAutoAllowBashIfSandboxedEnabled();
      // all读取`detectUnreachableRules`，供终端渲染后续处理使用。
      const all = detectUnreachableRules(toolPermissionContext, {
        sandboxAutoAllowEnabled
      });
      // suggestedRules 集合保存`extractRules`，供终端渲染后续处理使用。
      const suggestedRules = extractRules(suggestions);
      // 满足 `suggestedRules.length > 0` 时，终端渲染执行该分支。
      if (suggestedRules.length > 0) {
        // t1 暂存 `all.filter(u => suggestedRules.some(suggested => suggeste...` 生成的渲染片段，后续返回路径直接复用。
        t1 = all.filter(u => suggestedRules.some(suggested => suggested.toolName === u.rule.ruleValue.toolName && suggested.ruleContent === u.rule.ruleValue.ruleContent));
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 满足 `toolName` 时，终端渲染执行该分支。
      if (toolName) {
        // t2 暂存 `u_0 => u_0.rule.ruleValue.toolName === toolName` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[4] !== toolName) {
          // t2 暂存 `u_0 => u_0.rule.ruleValue.toolName === toolName` 生成的渲染片段，后续返回路径直接复用。
          t2 = u_0 => u_0.rule.ruleValue.toolName === toolName;
          // $[4] 缓存 `toolName`，下次依赖未变时 React 编译产物可直接复用。
          $[4] = toolName;
          // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[5] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[5];
        }
        // t1 暂存 `all.filter(t2)` 生成的渲染片段，后续返回路径直接复用。
        t1 = all.filter(t2);
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // t1 暂存 `all` 生成的渲染片段，后续返回路径直接复用。
      t1 = all;
    }
    // $[0] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = suggestions;
    // $[1] 缓存 `toolName`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = toolName;
    // $[2] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = toolPermissionContext;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // unreachableRules 集合保存`t1`，作为后续临时缓存值处理的输入。
  const unreachableRules = t1;
  // t2 暂存 `<Box justifyContent="flex-end" minWidth={10}><Text dimCol...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Box justifyContent="flex-end" minWidth={10}><Text dimCol...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box justifyContent="flex-end" minWidth={10}><Text dimColor={true}>Behavior </Text></Box>;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // t3 暂存 `<Box flexDirection="row">{t2}<Text>{permissionResult.beha...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== permissionResult.behavior) {
    // t3 暂存 `<Box flexDirection="row">{t2}<Text>{permissionResult.beha...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="row">{t2}<Text>{permissionResult.behavior}</Text></Box>;
    // $[7] 缓存 `permissionResult.behavior`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = permissionResult.behavior;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // t4 暂存 `permissionResult.behavior !== "allow" && <Box flexDirecti...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== permissionResult.behavior || $[10] !== permissionResult.message) {
    // t4 暂存 `permissionResult.behavior !== "allow" && <Box flexDirecti...` 生成的渲染片段，后续返回路径直接复用。
    t4 = permissionResult.behavior !== "allow" && <Box flexDirection="row"><Box justifyContent="flex-end" minWidth={10}><Text dimColor={true}>Message </Text></Box><Text>{permissionResult.message}</Text></Box>;
    // $[9] 缓存 `permissionResult.behavior`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = permissionResult.behavior;
    // $[10] 缓存 `permissionResult.message`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = permissionResult.message;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[11];
  }
  // t5 暂存 `<Box justifyContent="flex-end" minWidth={10}><Text dimCol...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Box justifyContent="flex-end" minWidth={10}><Text dimCol...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box justifyContent="flex-end" minWidth={10}><Text dimColor={true}>Reason </Text></Box>;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // t6 暂存 `<Box flexDirection="row">{t5}{decisionReason === undefine...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== decisionReason) {
    // t6 暂存 `<Box flexDirection="row">{t5}{decisionReason === undefine...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="row">{t5}{decisionReason === undefined ? <Text>undefined</Text> : <PermissionDecisionInfoItem decisionReason={decisionReason} />}</Box>;
    // $[13] 缓存 `decisionReason`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = decisionReason;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // t7 暂存 `<SuggestionDisplay suggestions={suggestions} width={10} />` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== suggestions) {
    // t7 暂存 `<SuggestionDisplay suggestions={suggestions} width={10} />` 生成的渲染片段，后续返回路径直接复用。
    t7 = <SuggestionDisplay suggestions={suggestions} width={10} />;
    // $[15] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = suggestions;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // t8 暂存 `unreachableRules.length > 0 && <Box flexDirection="column...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== unreachableRules) {
    // t8 暂存 `unreachableRules.length > 0 && <Box flexDirection="column...` 生成的渲染片段，后续返回路径直接复用。
    t8 = unreachableRules.length > 0 && <Box flexDirection="column" marginTop={1}><Text color="warning">{figures.warning} Unreachable Rules ({unreachableRules.length})</Text>{unreachableRules.map(_temp5)}</Box>;
    // $[17] 缓存 `unreachableRules`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = unreachableRules;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[18];
  }
  // t9 暂存 `<Box flexDirection="column">{t3}{t4}{t6}{t7}{t8}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t3 || $[20] !== t4 || $[21] !== t6 || $[22] !== t7 || $[23] !== t8) {
    // t9 暂存 `<Box flexDirection="column">{t3}{t4}{t6}{t7}{t8}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column">{t3}{t4}{t6}{t7}{t8}</Box>;
    // $[19] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t3;
    // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t4;
    // $[21] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t6;
    // $[22] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t7;
    // $[23] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t8;
    // $[24] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[24];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
// _temp5 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(u_1, i) {
  // 返回 `<Box key={i} flexDirection="column" marginLeft={2}><Text color="warning...`，作为终端渲染这次计算的结果。
  return <Box key={i} flexDirection="column" marginLeft={2}><Text color="warning">{permissionRuleValueToString(u_1.rule.ruleValue)}</Text><Text dimColor={true}>{"  "}{u_1.reason}</Text><Text dimColor={true}>{"  "}Fix: {u_1.fix}</Text></Box>;
}
// _temp4 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(s) {
  // 返回 `s.toolPermissionContext`，作为终端渲染这次计算的结果。
  return s.toolPermissionContext;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiY2hhbGsiLCJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VNZW1vIiwiQW5zaSIsIkJveCIsImNvbG9yIiwiVGV4dCIsInVzZVRoZW1lIiwidXNlQXBwU3RhdGUiLCJQZXJtaXNzaW9uTW9kZSIsInBlcm1pc3Npb25Nb2RlVGl0bGUiLCJQZXJtaXNzaW9uRGVjaXNpb24iLCJQZXJtaXNzaW9uRGVjaXNpb25SZWFzb24iLCJleHRyYWN0UnVsZXMiLCJQZXJtaXNzaW9uVXBkYXRlIiwicGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nIiwiZGV0ZWN0VW5yZWFjaGFibGVSdWxlcyIsIlNhbmRib3hNYW5hZ2VyIiwiZ2V0U2V0dGluZ1NvdXJjZURpc3BsYXlOYW1lTG93ZXJjYXNlIiwiUGVybWlzc2lvbkRlY2lzaW9uSW5mb0l0ZW1Qcm9wcyIsInRpdGxlIiwiZGVjaXNpb25SZWFzb24iLCJkZWNpc2lvblJlYXNvbkRpc3BsYXlTdHJpbmciLCJ0eXBlIiwiRXhjbHVkZSIsImJvbGQiLCJjbGFzc2lmaWVyIiwicmVhc29uIiwicnVsZSIsInJ1bGVWYWx1ZSIsInNvdXJjZSIsIm1vZGUiLCJwZXJtaXNzaW9uUHJvbXB0VG9vbE5hbWUiLCJob29rTmFtZSIsIlBlcm1pc3Npb25EZWNpc2lvbkluZm9JdGVtIiwidDAiLCIkIiwiX2MiLCJ0aGVtZSIsInQxIiwiZm9ybWF0RGVjaXNpb25SZWFzb24iLCJBcnJheSIsImZyb20iLCJyZWFzb25zIiwiZW50cmllcyIsIm1hcCIsInQyIiwic3ViY29tbWFuZCIsInJlc3VsdCIsImljb24iLCJiZWhhdmlvciIsInRpY2siLCJjcm9zcyIsInVuZGVmaW5lZCIsInN1Z2dlc3Rpb25zIiwidDMiLCJ0NCIsIlN1Z2dlc3RlZFJ1bGVzIiwiVDAiLCJUMSIsInQ1IiwiU3ltYm9sIiwiZm9yIiwiYmIwIiwicnVsZXMiLCJsZW5ndGgiLCJfdGVtcCIsImpvaW4iLCJ0NiIsInQ3IiwiUHJvcHMiLCJwZXJtaXNzaW9uUmVzdWx0IiwidG9vbE5hbWUiLCJleHRyYWN0RGlyZWN0b3JpZXMiLCJ1cGRhdGVzIiwiZmxhdE1hcCIsInVwZGF0ZSIsImRpcmVjdG9yaWVzIiwiZXh0cmFjdE1vZGUiLCJmaW5kTGFzdCIsInUiLCJTdWdnZXN0aW9uRGlzcGxheSIsIndpZHRoIiwiX3RlbXAyIiwiX3RlbXAzIiwiZGlyIiwiaW5kZXhfMCIsImluZGV4IiwiYnVsbGV0IiwiUGVybWlzc2lvbkRlY2lzaW9uRGVidWdJbmZvIiwidG9vbFBlcm1pc3Npb25Db250ZXh0IiwiX3RlbXA0Iiwic2FuZGJveEF1dG9BbGxvd0VuYWJsZWQiLCJpc1NhbmRib3hpbmdFbmFibGVkIiwiaXNBdXRvQWxsb3dCYXNoSWZTYW5kYm94ZWRFbmFibGVkIiwiYWxsIiwic3VnZ2VzdGVkUnVsZXMiLCJmaWx0ZXIiLCJzb21lIiwic3VnZ2VzdGVkIiwicnVsZUNvbnRlbnQiLCJ1XzAiLCJ1bnJlYWNoYWJsZVJ1bGVzIiwiV0lEVEgiLCJtZXNzYWdlIiwidDgiLCJ3YXJuaW5nIiwiX3RlbXA1IiwidDkiLCJ1XzEiLCJpIiwiZml4IiwicyJdLCJzb3VyY2VzIjpbIlBlcm1pc3Npb25EZWNpc2lvbkRlYnVnSW5mby50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmVhdHVyZSB9IGZyb20gJ2J1bjpidW5kbGUnXG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZU1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEFuc2ksIEJveCwgY29sb3IsIFRleHQsIHVzZVRoZW1lIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlQXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgUGVybWlzc2lvbk1vZGUgfSBmcm9tICcuLi8uLi91dGlscy9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uTW9kZS5qcydcbmltcG9ydCB7IHBlcm1pc3Npb25Nb2RlVGl0bGUgfSBmcm9tICcuLi8uLi91dGlscy9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uTW9kZS5qcydcbmltcG9ydCB0eXBlIHtcbiAgUGVybWlzc2lvbkRlY2lzaW9uLFxuICBQZXJtaXNzaW9uRGVjaXNpb25SZWFzb24sXG59IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25SZXN1bHQuanMnXG5pbXBvcnQgeyBleHRyYWN0UnVsZXMgfSBmcm9tICcuLi8uLi91dGlscy9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uVXBkYXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uVXBkYXRlIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvUGVybWlzc2lvblVwZGF0ZVNjaGVtYS5qcydcbmltcG9ydCB7IHBlcm1pc3Npb25SdWxlVmFsdWVUb1N0cmluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL3Blcm1pc3Npb25SdWxlUGFyc2VyLmpzJ1xuaW1wb3J0IHsgZGV0ZWN0VW5yZWFjaGFibGVSdWxlcyB9IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL3NoYWRvd2VkUnVsZURldGVjdGlvbi5qcydcbmltcG9ydCB7IFNhbmRib3hNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2FuZGJveC9zYW5kYm94LWFkYXB0ZXIuanMnXG5pbXBvcnQgeyBnZXRTZXR0aW5nU291cmNlRGlzcGxheU5hbWVMb3dlcmNhc2UgfSBmcm9tICcuLi8uLi91dGlscy9zZXR0aW5ncy9jb25zdGFudHMuanMnXG5cbnR5cGUgUGVybWlzc2lvbkRlY2lzaW9uSW5mb0l0ZW1Qcm9wcyA9IHtcbiAgdGl0bGU/OiBzdHJpbmdcbiAgZGVjaXNpb25SZWFzb246IFBlcm1pc3Npb25EZWNpc2lvblJlYXNvblxufVxuXG5mdW5jdGlvbiBkZWNpc2lvblJlYXNvbkRpc3BsYXlTdHJpbmcoXG4gIGRlY2lzaW9uUmVhc29uOiBQZXJtaXNzaW9uRGVjaXNpb25SZWFzb24gJiB7XG4gICAgdHlwZTogRXhjbHVkZTxQZXJtaXNzaW9uRGVjaXNpb25SZWFzb25bJ3R5cGUnXSwgJ3N1YmNvbW1hbmRSZXN1bHRzJz5cbiAgfSxcbik6IHN0cmluZyB7XG4gIGlmIChcbiAgICAoZmVhdHVyZSgnQkFTSF9DTEFTU0lGSUVSJykgfHwgZmVhdHVyZSgnVFJBTlNDUklQVF9DTEFTU0lGSUVSJykpICYmXG4gICAgZGVjaXNpb25SZWFzb24udHlwZSA9PT0gJ2NsYXNzaWZpZXInXG4gICkge1xuICAgIHJldHVybiBgJHtjaGFsay5ib2xkKGRlY2lzaW9uUmVhc29uLmNsYXNzaWZpZXIpfSBjbGFzc2lmaWVyOiAke2RlY2lzaW9uUmVhc29uLnJlYXNvbn1gXG4gIH1cbiAgc3dpdGNoIChkZWNpc2lvblJlYXNvbi50eXBlKSB7XG4gICAgY2FzZSAncnVsZSc6XG4gICAgICByZXR1cm4gYCR7Y2hhbGsuYm9sZChwZXJtaXNzaW9uUnVsZVZhbHVlVG9TdHJpbmcoZGVjaXNpb25SZWFzb24ucnVsZS5ydWxlVmFsdWUpKX0gcnVsZSBmcm9tICR7Z2V0U2V0dGluZ1NvdXJjZURpc3BsYXlOYW1lTG93ZXJjYXNlKGRlY2lzaW9uUmVhc29uLnJ1bGUuc291cmNlKX1gXG4gICAgY2FzZSAnbW9kZSc6XG4gICAgICByZXR1cm4gYCR7cGVybWlzc2lvbk1vZGVUaXRsZShkZWNpc2lvblJlYXNvbi5tb2RlKX0gbW9kZWBcbiAgICBjYXNlICdzYW5kYm94T3ZlcnJpZGUnOlxuICAgICAgcmV0dXJuICdSZXF1aXJlcyBwZXJtaXNzaW9uIHRvIGJ5cGFzcyBzYW5kYm94J1xuICAgIGNhc2UgJ3dvcmtpbmdEaXInOlxuICAgICAgcmV0dXJuIGRlY2lzaW9uUmVhc29uLnJlYXNvblxuICAgIGNhc2UgJ3NhZmV0eUNoZWNrJzpcbiAgICBjYXNlICdvdGhlcic6XG4gICAgICByZXR1cm4gZGVjaXNpb25SZWFzb24ucmVhc29uXG4gICAgY2FzZSAncGVybWlzc2lvblByb21wdFRvb2wnOlxuICAgICAgcmV0dXJuIGAke2NoYWxrLmJvbGQoZGVjaXNpb25SZWFzb24ucGVybWlzc2lvblByb21wdFRvb2xOYW1lKX0gcGVybWlzc2lvbiBwcm9tcHQgdG9vbGBcbiAgICBjYXNlICdob29rJzpcbiAgICAgIHJldHVybiBkZWNpc2lvblJlYXNvbi5yZWFzb25cbiAgICAgICAgPyBgJHtjaGFsay5ib2xkKGRlY2lzaW9uUmVhc29uLmhvb2tOYW1lKX0gaG9vazogJHtkZWNpc2lvblJlYXNvbi5yZWFzb259YFxuICAgICAgICA6IGAke2NoYWxrLmJvbGQoZGVjaXNpb25SZWFzb24uaG9va05hbWUpfSBob29rYFxuICAgIGNhc2UgJ2FzeW5jQWdlbnQnOlxuICAgICAgcmV0dXJuIGRlY2lzaW9uUmVhc29uLnJlYXNvblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJydcbiAgfVxufVxuXG5mdW5jdGlvbiBQZXJtaXNzaW9uRGVjaXNpb25JbmZvSXRlbSh7XG4gIHRpdGxlLFxuICBkZWNpc2lvblJlYXNvbixcbn06IFBlcm1pc3Npb25EZWNpc2lvbkluZm9JdGVtUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbdGhlbWVdID0gdXNlVGhlbWUoKVxuXG4gIGZ1bmN0aW9uIGZvcm1hdERlY2lzaW9uUmVhc29uKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgc3dpdGNoIChkZWNpc2lvblJlYXNvbi50eXBlKSB7XG4gICAgICBjYXNlICdzdWJjb21tYW5kUmVzdWx0cyc6XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICB7QXJyYXkuZnJvbShkZWNpc2lvblJlYXNvbi5yZWFzb25zLmVudHJpZXMoKSkubWFwKFxuICAgICAgICAgICAgICAoW3N1YmNvbW1hbmQsIHJlc3VsdF0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpY29uID1cbiAgICAgICAgICAgICAgICAgIHJlc3VsdC5iZWhhdmlvciA9PT0gJ2FsbG93J1xuICAgICAgICAgICAgICAgICAgICA/IGNvbG9yKCdzdWNjZXNzJywgdGhlbWUpKGZpZ3VyZXMudGljaylcbiAgICAgICAgICAgICAgICAgICAgOiBjb2xvcignZXJyb3InLCB0aGVtZSkoZmlndXJlcy5jcm9zcylcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIga2V5PXtzdWJjb21tYW5kfT5cbiAgICAgICAgICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgICAgICAgICAge2ljb259IHtzdWJjb21tYW5kfVxuICAgICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgIHtyZXN1bHQuZGVjaXNpb25SZWFzb24gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5kZWNpc2lvblJlYXNvbi50eXBlICE9PSAnc3ViY29tbWFuZFJlc3VsdHMnICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7JyAgJ33ijr97JyAgJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8QW5zaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGVjaXNpb25SZWFzb25EaXNwbGF5U3RyaW5nKHJlc3VsdC5kZWNpc2lvblJlYXNvbil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvQW5zaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICB7cmVzdWx0LmJlaGF2aW9yID09PSAnYXNrJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPFN1Z2dlc3RlZFJ1bGVzIHN1Z2dlc3Rpb25zPXtyZXN1bHQuc3VnZ2VzdGlvbnN9IC8+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPEFuc2k+e2RlY2lzaW9uUmVhc29uRGlzcGxheVN0cmluZyhkZWNpc2lvblJlYXNvbil9PC9BbnNpPlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICB7dGl0bGUgJiYgPFRleHQ+e3RpdGxlfTwvVGV4dD59XG4gICAgICB7Zm9ybWF0RGVjaXNpb25SZWFzb24oKX1cbiAgICA8L0JveD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTdWdnZXN0ZWRSdWxlcyh7XG4gIHN1Z2dlc3Rpb25zLFxufToge1xuICBzdWdnZXN0aW9uczogUGVybWlzc2lvblVwZGF0ZVtdIHwgdW5kZWZpbmVkXG59KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcnVsZXMgPSBleHRyYWN0UnVsZXMoc3VnZ2VzdGlvbnMpXG4gIGlmIChydWxlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsXG4gIHJldHVybiAoXG4gICAgPFRleHQ+XG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgeycgICd94o6/eycgICd9XG4gICAgICA8L1RleHQ+XG4gICAgICBTdWdnZXN0ZWQgcnVsZXM6eycgJ31cbiAgICAgIDxBbnNpPlxuICAgICAgICB7cnVsZXNcbiAgICAgICAgICAubWFwKHJ1bGUgPT4gY2hhbGsuYm9sZChwZXJtaXNzaW9uUnVsZVZhbHVlVG9TdHJpbmcocnVsZSkpKVxuICAgICAgICAgIC5qb2luKCcsICcpfVxuICAgICAgPC9BbnNpPlxuICAgIDwvVGV4dD5cbiAgKVxufVxuXG50eXBlIFByb3BzID0ge1xuICBwZXJtaXNzaW9uUmVzdWx0OiBQZXJtaXNzaW9uRGVjaXNpb25cbiAgdG9vbE5hbWU/OiBzdHJpbmcgLy8gRmlsdGVyIHVucmVhY2hhYmxlIHJ1bGVzIHRvIHRoaXMgdG9vbFxufVxuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gZXh0cmFjdCBkaXJlY3RvcmllcyBmcm9tIHBlcm1pc3Npb24gdXBkYXRlc1xuZnVuY3Rpb24gZXh0cmFjdERpcmVjdG9yaWVzKHVwZGF0ZXM6IFBlcm1pc3Npb25VcGRhdGVbXSB8IHVuZGVmaW5lZCk6IHN0cmluZ1tdIHtcbiAgaWYgKCF1cGRhdGVzKSByZXR1cm4gW11cblxuICByZXR1cm4gdXBkYXRlcy5mbGF0TWFwKHVwZGF0ZSA9PiB7XG4gICAgc3dpdGNoICh1cGRhdGUudHlwZSkge1xuICAgICAgY2FzZSAnYWRkRGlyZWN0b3JpZXMnOlxuICAgICAgICByZXR1cm4gdXBkYXRlLmRpcmVjdG9yaWVzXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gW11cbiAgICB9XG4gIH0pXG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBleHRyYWN0IG1vZGUgZnJvbSBwZXJtaXNzaW9uIHVwZGF0ZXNcbmZ1bmN0aW9uIGV4dHJhY3RNb2RlKFxuICB1cGRhdGVzOiBQZXJtaXNzaW9uVXBkYXRlW10gfCB1bmRlZmluZWQsXG4pOiBQZXJtaXNzaW9uTW9kZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghdXBkYXRlcykgcmV0dXJuIHVuZGVmaW5lZFxuICBjb25zdCB1cGRhdGUgPSB1cGRhdGVzLmZpbmRMYXN0KHUgPT4gdS50eXBlID09PSAnc2V0TW9kZScpXG4gIHJldHVybiB1cGRhdGU/LnR5cGUgPT09ICdzZXRNb2RlJyA/IHVwZGF0ZS5tb2RlIDogdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIFN1Z2dlc3Rpb25EaXNwbGF5KHtcbiAgc3VnZ2VzdGlvbnMsXG4gIHdpZHRoLFxufToge1xuICBzdWdnZXN0aW9uczogUGVybWlzc2lvblVwZGF0ZVtdIHwgdW5kZWZpbmVkXG4gIHdpZHRoOiBudW1iZXJcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoIXN1Z2dlc3Rpb25zIHx8IHN1Z2dlc3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgPEJveCBqdXN0aWZ5Q29udGVudD1cImZsZXgtZW5kXCIgbWluV2lkdGg9e3dpZHRofT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5TdWdnZXN0aW9ucyA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8VGV4dD5Ob25lPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgY29uc3QgcnVsZXMgPSBleHRyYWN0UnVsZXMoc3VnZ2VzdGlvbnMpXG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gZXh0cmFjdERpcmVjdG9yaWVzKHN1Z2dlc3Rpb25zKVxuICBjb25zdCBtb2RlID0gZXh0cmFjdE1vZGUoc3VnZ2VzdGlvbnMpXG5cbiAgLy8gSWYgbm90aGluZyB0byBkaXNwbGF5LCBzaG93IE5vbmVcbiAgaWYgKHJ1bGVzLmxlbmd0aCA9PT0gMCAmJiBkaXJlY3Rvcmllcy5sZW5ndGggPT09IDAgJiYgIW1vZGUpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgIDxCb3gganVzdGlmeUNvbnRlbnQ9XCJmbGV4LWVuZFwiIG1pbldpZHRoPXt3aWR0aH0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+U3VnZ2VzdGlvbiA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8VGV4dD5Ob25lPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICA8Qm94IGp1c3RpZnlDb250ZW50PVwiZmxleC1lbmRcIiBtaW5XaWR0aD17d2lkdGh9PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlN1Z2dlc3Rpb25zIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxUZXh0PiA8L1RleHQ+XG4gICAgICA8L0JveD5cblxuICAgICAgey8qIERpc3BsYXkgcnVsZXMgKi99XG4gICAgICB7cnVsZXMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICAgIDxCb3gganVzdGlmeUNvbnRlbnQ9XCJmbGV4LWVuZFwiIG1pbldpZHRoPXt3aWR0aH0+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gUnVsZXMgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAge3J1bGVzLm1hcCgocnVsZSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgPFRleHQga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAge2ZpZ3VyZXMuYnVsbGV0fSB7cGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nKHJ1bGUpfVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuXG4gICAgICB7LyogRGlzcGxheSBkaXJlY3RvcmllcyAqL31cbiAgICAgIHtkaXJlY3Rvcmllcy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgICAgPEJveCBqdXN0aWZ5Q29udGVudD1cImZsZXgtZW5kXCIgbWluV2lkdGg9e3dpZHRofT5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiBEaXJlY3RvcmllcyA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICB7ZGlyZWN0b3JpZXMubWFwKChkaXIsIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgIDxUZXh0IGtleT17aW5kZXh9PlxuICAgICAgICAgICAgICAgIHtmaWd1cmVzLmJ1bGxldH0ge2Rpcn1cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cblxuICAgICAgey8qIERpc3BsYXkgbW9kZSBjaGFuZ2UgKi99XG4gICAgICB7bW9kZSAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICAgIDxCb3gganVzdGlmeUNvbnRlbnQ9XCJmbGV4LWVuZFwiIG1pbldpZHRoPXt3aWR0aH0+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gTW9kZSA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPFRleHQ+e3Blcm1pc3Npb25Nb2RlVGl0bGUobW9kZSl9PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFBlcm1pc3Npb25EZWNpc2lvbkRlYnVnSW5mbyh7XG4gIHBlcm1pc3Npb25SZXN1bHQsXG4gIHRvb2xOYW1lLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB0b29sUGVybWlzc2lvbkNvbnRleHQgPSB1c2VBcHBTdGF0ZShzID0+IHMudG9vbFBlcm1pc3Npb25Db250ZXh0KVxuICBjb25zdCBkZWNpc2lvblJlYXNvbiA9IHBlcm1pc3Npb25SZXN1bHQuZGVjaXNpb25SZWFzb25cbiAgY29uc3Qgc3VnZ2VzdGlvbnMgPVxuICAgICdzdWdnZXN0aW9ucycgaW4gcGVybWlzc2lvblJlc3VsdCA/IHBlcm1pc3Npb25SZXN1bHQuc3VnZ2VzdGlvbnMgOiB1bmRlZmluZWRcblxuICBjb25zdCB1bnJlYWNoYWJsZVJ1bGVzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3Qgc2FuZGJveEF1dG9BbGxvd0VuYWJsZWQgPVxuICAgICAgU2FuZGJveE1hbmFnZXIuaXNTYW5kYm94aW5nRW5hYmxlZCgpICYmXG4gICAgICBTYW5kYm94TWFuYWdlci5pc0F1dG9BbGxvd0Jhc2hJZlNhbmRib3hlZEVuYWJsZWQoKVxuICAgIGNvbnN0IGFsbCA9IGRldGVjdFVucmVhY2hhYmxlUnVsZXModG9vbFBlcm1pc3Npb25Db250ZXh0LCB7XG4gICAgICBzYW5kYm94QXV0b0FsbG93RW5hYmxlZCxcbiAgICB9KVxuXG4gICAgLy8gR2V0IHRoZSBzdWdnZXN0ZWQgcnVsZXMgZnJvbSB0aGUgcGVybWlzc2lvbiByZXN1bHRcbiAgICBjb25zdCBzdWdnZXN0ZWRSdWxlcyA9IGV4dHJhY3RSdWxlcyhzdWdnZXN0aW9ucylcblxuICAgIC8vIEZpbHRlciB0byBydWxlcyB0aGF0IG1hdGNoIGFueSBvZiB0aGUgc3VnZ2VzdGVkIHJ1bGVzXG4gICAgLy8gQSBydWxlIG1hdGNoZXMgaWYgaXQgaGFzIHRoZSBzYW1lIHRvb2xOYW1lIGFuZCBydWxlQ29udGVudFxuICAgIGlmIChzdWdnZXN0ZWRSdWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gYWxsLmZpbHRlcih1ID0+XG4gICAgICAgIHN1Z2dlc3RlZFJ1bGVzLnNvbWUoXG4gICAgICAgICAgc3VnZ2VzdGVkID0+XG4gICAgICAgICAgICBzdWdnZXN0ZWQudG9vbE5hbWUgPT09IHUucnVsZS5ydWxlVmFsdWUudG9vbE5hbWUgJiZcbiAgICAgICAgICAgIHN1Z2dlc3RlZC5ydWxlQ29udGVudCA9PT0gdS5ydWxlLnJ1bGVWYWx1ZS5ydWxlQ29udGVudCxcbiAgICAgICAgKSxcbiAgICAgIClcbiAgICB9XG5cbiAgICAvLyBGYWxsYmFjazogZmlsdGVyIGJ5IHRvb2wgbmFtZSBpZiBzcGVjaWZpZWRcbiAgICBpZiAodG9vbE5hbWUpIHtcbiAgICAgIHJldHVybiBhbGwuZmlsdGVyKHUgPT4gdS5ydWxlLnJ1bGVWYWx1ZS50b29sTmFtZSA9PT0gdG9vbE5hbWUpXG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbFxuICB9LCBbdG9vbFBlcm1pc3Npb25Db250ZXh0LCB0b29sTmFtZSwgc3VnZ2VzdGlvbnNdKVxuXG4gIGNvbnN0IFdJRFRIID0gMTBcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgIDxCb3gganVzdGlmeUNvbnRlbnQ9XCJmbGV4LWVuZFwiIG1pbldpZHRoPXtXSURUSH0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+QmVoYXZpb3IgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPFRleHQ+e3Blcm1pc3Npb25SZXN1bHQuYmVoYXZpb3J9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICB7cGVybWlzc2lvblJlc3VsdC5iZWhhdmlvciAhPT0gJ2FsbG93JyAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICAgIDxCb3gganVzdGlmeUNvbnRlbnQ9XCJmbGV4LWVuZFwiIG1pbldpZHRoPXtXSURUSH0+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5NZXNzYWdlIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgICA8VGV4dD57cGVybWlzc2lvblJlc3VsdC5tZXNzYWdlfTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgIDxCb3gganVzdGlmeUNvbnRlbnQ9XCJmbGV4LWVuZFwiIG1pbldpZHRoPXtXSURUSH0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+UmVhc29uIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHtkZWNpc2lvblJlYXNvbiA9PT0gdW5kZWZpbmVkID8gKFxuICAgICAgICAgIDxUZXh0PnVuZGVmaW5lZDwvVGV4dD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8UGVybWlzc2lvbkRlY2lzaW9uSW5mb0l0ZW0gZGVjaXNpb25SZWFzb249e2RlY2lzaW9uUmVhc29ufSAvPlxuICAgICAgICApfVxuICAgICAgPC9Cb3g+XG4gICAgICA8U3VnZ2VzdGlvbkRpc3BsYXkgc3VnZ2VzdGlvbnM9e3N1Z2dlc3Rpb25zfSB3aWR0aD17V0lEVEh9IC8+XG4gICAgICB7dW5yZWFjaGFibGVSdWxlcy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICAgIHtmaWd1cmVzLndhcm5pbmd9IFVucmVhY2hhYmxlIFJ1bGVzICh7dW5yZWFjaGFibGVSdWxlcy5sZW5ndGh9KVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICB7dW5yZWFjaGFibGVSdWxlcy5tYXAoKHUsIGkpID0+IChcbiAgICAgICAgICAgIDxCb3gga2V5PXtpfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luTGVmdD17Mn0+XG4gICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICAgIHtwZXJtaXNzaW9uUnVsZVZhbHVlVG9TdHJpbmcodS5ydWxlLnJ1bGVWYWx1ZSl9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgICAgeycgICd9XG4gICAgICAgICAgICAgICAge3UucmVhc29ufVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgIHsnICAnfUZpeDoge3UuZml4fVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxPQUFPLFFBQVEsWUFBWTtBQUNwQyxPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixPQUFPQyxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPQyxLQUFLLElBQUlDLE9BQU8sUUFBUSxPQUFPO0FBQ3RDLFNBQVNDLElBQUksRUFBRUMsR0FBRyxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLGNBQWM7QUFDL0QsU0FBU0MsV0FBVyxRQUFRLHlCQUF5QjtBQUNyRCxjQUFjQyxjQUFjLFFBQVEsMkNBQTJDO0FBQy9FLFNBQVNDLG1CQUFtQixRQUFRLDJDQUEyQztBQUMvRSxjQUNFQyxrQkFBa0IsRUFDbEJDLHdCQUF3QixRQUNuQiw2Q0FBNkM7QUFDcEQsU0FBU0MsWUFBWSxRQUFRLDZDQUE2QztBQUMxRSxjQUFjQyxnQkFBZ0IsUUFBUSxtREFBbUQ7QUFDekYsU0FBU0MsMkJBQTJCLFFBQVEsaURBQWlEO0FBQzdGLFNBQVNDLHNCQUFzQixRQUFRLGtEQUFrRDtBQUN6RixTQUFTQyxjQUFjLFFBQVEsd0NBQXdDO0FBQ3ZFLFNBQVNDLG9DQUFvQyxRQUFRLG1DQUFtQztBQUV4RixLQUFLQywrQkFBK0IsR0FBRztFQUNyQ0MsS0FBSyxDQUFDLEVBQUUsTUFBTTtFQUNkQyxjQUFjLEVBQUVULHdCQUF3QjtBQUMxQyxDQUFDO0FBRUQsU0FBU1UsMkJBQTJCQSxDQUNsQ0QsY0FBYyxFQUFFVCx3QkFBd0IsR0FBRztFQUN6Q1csSUFBSSxFQUFFQyxPQUFPLENBQUNaLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxFQUFFLG1CQUFtQixDQUFDO0FBQ3RFLENBQUMsQ0FDRixFQUFFLE1BQU0sQ0FBQztFQUNS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
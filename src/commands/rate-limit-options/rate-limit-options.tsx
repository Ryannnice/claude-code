// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo, useState } from 'react';
// 类型依赖 { CommandResultDisplay, LocalJSXCommandContext } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { CommandResultDisplay, LocalJSXCommandContext } from '../../commands.js';
// 复用 OptionWithDescription、Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { type OptionWithDescription, Select } from '../../components/CustomSelect/select.js';
// 复用 Dialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { Dialog } from '../../components/design-system/Dialog.js';
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 接入 useClaudeAiLimits 服务层能力，把外部通信或共享状态交给 ../../services/claudeAiLimitsHook.js 处理。
import { useClaudeAiLimits } from '../../services/claudeAiLimitsHook.js';
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 getOauthAccountInfo、getRateLimitTier、getSubscriptionType 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getOauthAccountInfo, getRateLimitTier, getSubscriptionType } from '../../utils/auth.js';
// 复用 hasClaudeAiBillingAccess 工具函数，把通用处理留在 ../../utils/billing.js 中维护。
import { hasClaudeAiBillingAccess } from '../../utils/billing.js';
// 引入 call as extraUsageCall，将 ../extra-usage/extra-usage.js 中已经封装好的能力接到本文件流程里。
import { call as extraUsageCall } from '../extra-usage/extra-usage.js';
// 引入 extraUsage，将 ../extra-usage/index.js 中已经封装好的能力接到本文件流程里。
import { extraUsage } from '../extra-usage/index.js';
// 引入 upgrade，将 ../upgrade/index.js 中已经封装好的能力接到本文件流程里。
import upgrade from '../upgrade/index.js';
// 引入 call as upgradeCall，将 ../upgrade/upgrade.js 中已经封装好的能力接到本文件流程里。
import { call as upgradeCall } from '../upgrade/upgrade.js';
// RateLimitOptionsMenuOptionType 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type RateLimitOptionsMenuOptionType = 'upgrade' | 'extra-usage' | 'cancel';
// RateLimitOptionsMenuProps 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type RateLimitOptionsMenuProps = {
  onDone: (result?: string, options?: {
    display?: CommandResultDisplay | undefined;
  } | undefined) => void;
  context: ToolUseContext & LocalJSXCommandContext;
};
// RateLimitOptionsMenu 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function RateLimitOptionsMenu(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    context
  } = t0;
  // subCommandJSX 命令数据 由 React state 持有，setSubCommandJSX 会在用户操作或异步结果返回时触发刷新。
  const [subCommandJSX, setSubCommandJSX] = useState(null);
  // claudeAiLimits 集合保存`useClaudeAiLimits`，供命令处理后续处理使用。
  const claudeAiLimits = useClaudeAiLimits();
  // t1 暂存 `getSubscriptionType()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getSubscriptionType()` 生成的渲染片段，后续返回路径直接复用。
    t1 = getSubscriptionType();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // subscriptionType保存`t1`，作为后续临时缓存值处理的输入。
  const subscriptionType = t1;
  // t2 暂存 `getRateLimitTier()` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `getRateLimitTier()` 生成的渲染片段，后续返回路径直接复用。
    t2 = getRateLimitTier();
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // rateLimitTier沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const rateLimitTier = t2;
  // hasExtraUsageEnabled记录 `getOauthAccountInfo` 是否成立，命令处理随后按该结果分支。
  const hasExtraUsageEnabled = getOauthAccountInfo()?.hasExtraUsageEnabled === true;
  // isMax标记命令处理斜杠命令 rate limit options是否启用对应路径。
  const isMax = subscriptionType === "max";
  // isMax20x标记命令处理斜杠命令 rate limit options是否启用对应路径。
  const isMax20x = isMax && rateLimitTier === "default_claude_max_20x";
  // isTeamOrEnterprise标记命令处理斜杠命令 rate limit options是否启用对应路径。
  const isTeamOrEnterprise = subscriptionType === "team" || subscriptionType === "enterprise";
  // buyFirst读取`getFeatureValue_CACHED_MAY_BE_STALE`，供命令处理后续处理使用。
  const buyFirst = getFeatureValue_CACHED_MAY_BE_STALE("tengu_jade_anvil_4", false);
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // 斜杠命令 rate limit options在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // actionOptions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let actionOptions;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[2] !== claudeAiLimits.overageDisabledReason || $[3] !== claudeAiLimits.overageStatus) {
      // actionOptions 集合更新为 `[]`，确保斜杠命令后续读取最新状态。
      actionOptions = [];
      // 满足 `extraUsage.isEnabled()` 时，命令处理执行该分支。
      if (extraUsage.isEnabled()) {
        // hasBillingAccess 集合记录 `hasClaudeAiBillingAccess` 是否成立，命令处理随后按该结果分支。
        const hasBillingAccess = hasClaudeAiBillingAccess();
        // needsToRequestFromAdmin 请求数据标记命令处理斜杠命令 rate limit options是否启用对应路径。
        const needsToRequestFromAdmin = isTeamOrEnterprise && !hasBillingAccess;
        // isOrgSpendCapDepleted标记命令处理斜杠命令 rate limit options是否启用对应路径。
        const isOrgSpendCapDepleted = claudeAiLimits.overageDisabledReason === "out_of_credits" || claudeAiLimits.overageDisabledReason === "org_level_disabled_until" || claudeAiLimits.overageDisabledReason === "org_service_zero_credit_limit";
        // 只有 `needsToRequestFromAdmin && isOrgSpendCapDepleted` 满足时，命令处理才执行该分支。
        if (needsToRequestFromAdmin && isOrgSpendCapDepleted) {} else {
          // isOverageState 状态标记命令处理斜杠命令 rate limit options是否启用对应路径。
          const isOverageState = claudeAiLimits.overageStatus === "rejected" || claudeAiLimits.overageStatus === "allowed_warning";
          // label 先占位，稍后的条件分支会根据实际输入补齐它。
          let label;
          // 满足 `needsToRequestFromAdmin` 时，命令处理执行该分支。
          if (needsToRequestFromAdmin) {
            // label更新为 `isOverageState ? "Request more" : "Request extra usage"`，确保斜杠命令后续读取最新状态。
            label = isOverageState ? "Request more" : "Request extra usage";
          } else {
            // label更新为 `hasExtraUsageEnabled ? "Add funds to continue with extra ...`，确保斜杠命令后续读取最新状态。
            label = hasExtraUsageEnabled ? "Add funds to continue with extra usage" : "Switch to extra usage";
          }
          // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
          let t4;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[5] !== label) {
            // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
            t4 = {
              label,
              value: "extra-usage"
            };
            // $[5] 缓存 `label`，下次依赖未变时 React 编译产物可直接复用。
            $[5] = label;
            // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
            $[6] = t4;
          } else {
            // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
            t4 = $[6];
          }
          // actionOptions 集合追加新条目，保持收集顺序与输入顺序一致。
          actionOptions.push(t4);
        }
      }
      // 只有 `!isMax20x && !isTeamOrEnterprise && upgrade.isEnabled()` 满足时，命令处理才执行该分支。
      if (!isMax20x && !isTeamOrEnterprise && upgrade.isEnabled()) {
        // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
          // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
          t4 = {
            label: "Upgrade your plan",
            value: "upgrade"
          };
          // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[7] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[7];
        }
        // actionOptions 集合追加新条目，保持收集顺序与输入顺序一致。
        actionOptions.push(t4);
      }
      // $[2] 缓存 `claudeAiLimits.overageDisabledReason`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = claudeAiLimits.overageDisabledReason;
      // $[3] 缓存 `claudeAiLimits.overageStatus`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = claudeAiLimits.overageStatus;
      // $[4] 缓存 `actionOptions`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = actionOptions;
    } else {
      // actionOptions 集合更新为 `$[4]`，确保斜杠命令后续读取最新状态。
      actionOptions = $[4];
    }
    // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t4 = {
        label: "Stop and wait for limit to reset",
        value: "cancel"
      };
      // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[8];
    }
    // cancelOption 命名 `t4`，让后续代码直接表达这个值的用途。
    const cancelOption = t4;
    // 满足 `buyFirst` 时，命令处理执行该分支。
    if (buyFirst) {
      // t5 暂存 `[...actionOptions, cancelOption]` 的派生结果，便于缓存命中时直接复用。
      let t5;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[9] !== actionOptions) {
        // t5 暂存 `[...actionOptions, cancelOption]` 生成的渲染片段，后续返回路径直接复用。
        t5 = [...actionOptions, cancelOption];
        // $[9] 缓存 `actionOptions`，下次依赖未变时 React 编译产物可直接复用。
        $[9] = actionOptions;
        // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[10] = t5;
      } else {
        // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
        t5 = $[10];
      }
      // t3 暂存 `t5` 生成的渲染片段，后续返回路径直接复用。
      t3 = t5;
      // 结束这个分支或循环，避免命令处理继续落入后续路径。
      break bb0;
    }
    // t5 暂存 `[cancelOption, ...actionOptions]` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[11] !== actionOptions) {
      // t5 暂存 `[cancelOption, ...actionOptions]` 生成的渲染片段，后续返回路径直接复用。
      t5 = [cancelOption, ...actionOptions];
      // $[11] 缓存 `actionOptions`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = actionOptions;
      // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[12];
    }
    // t3 暂存 `t5` 生成的渲染片段，后续返回路径直接复用。
    t3 = t5;
  }
  // 选项 命名 `t3`，让后续代码直接表达这个值的用途。
  const options = t3;
  // t4 暂存 `function handleCancel() {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== onDone) {
    // t4 暂存 `function handleCancel() {` 生成的渲染片段，后续返回路径直接复用。
    t4 = function handleCancel() {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_rate_limit_options_menu_cancel", {});
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(undefined, {
        display: "skip"
      });
    };
    // $[13] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = onDone;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[14];
  }
  // handleCancel沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleCancel = t4;
  // t5 暂存 `function handleSelect(value) {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== context || $[16] !== handleCancel || $[17] !== onDone) {
    // t5 暂存 `function handleSelect(value) {` 生成的渲染片段，后续返回路径直接复用。
    t5 = function handleSelect(value) {
      // 当 `value` 匹配 `"upgrade"` 时，命令处理执行对应分支。
      if (value === "upgrade") {
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_rate_limit_options_menu_select_upgrade", {});
        // 调用 upgradeCall，触发命令处理此处需要的副作用。
        upgradeCall(onDone, context).then(jsx => {
          // 满足 `jsx` 时，命令处理执行该分支。
          if (jsx) {
            // setSubCommandJSX 写入新的状态值，使命令处理后续读取保持一致。
            setSubCommandJSX(jsx);
          }
        });
      } else {
        // 当 `value` 匹配 `"extra-usage"` 时，命令处理执行对应分支。
        if (value === "extra-usage") {
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logEvent("tengu_rate_limit_options_menu_select_extra_usage", {});
          // 调用 extraUsageCall，触发命令处理此处需要的副作用。
          extraUsageCall(onDone, context).then(jsx_0 => {
            // 满足 `jsx_0` 时，命令处理执行该分支。
            if (jsx_0) {
              // setSubCommandJSX 写入新的状态值，使命令处理后续读取保持一致。
              setSubCommandJSX(jsx_0);
            }
          });
        } else {
          // 当 `value` 匹配 `"cancel"` 时，命令处理执行对应分支。
          if (value === "cancel") {
            // 调用 handleCancel，触发命令处理此处需要的副作用。
            handleCancel();
          }
        }
      }
    };
    // $[15] 缓存 `context`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = context;
    // $[16] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = handleCancel;
    // $[17] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = onDone;
    // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[18];
  }
  // handleSelect沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t5;
  // 满足 `subCommandJSX` 时，命令处理执行该分支。
  if (subCommandJSX) {
    // 返回 `subCommandJSX`，作为命令处理这次计算的结果。
    return subCommandJSX;
  }
  // t6 暂存 `<Select options={options} onChange={handleSelect} visible...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== handleSelect || $[20] !== options) {
    // t6 暂存 `<Select options={options} onChange={handleSelect} visible...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Select options={options} onChange={handleSelect} visibleOptionCount={options.length} />;
    // $[19] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = handleSelect;
    // $[20] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = options;
    // $[21] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[21];
  }
  // t7 暂存 `<Dialog title="What do you want to do?" onCancel={handleC...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== handleCancel || $[23] !== t6) {
    // t7 暂存 `<Dialog title="What do you want to do?" onCancel={handleC...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Dialog title="What do you want to do?" onCancel={handleCancel} color="suggestion">{t6}</Dialog>;
    // $[22] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = handleCancel;
    // $[23] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t6;
    // $[24] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[24];
  }
  // 返回 `t7`，作为命令处理这次计算的结果。
  return t7;
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, context: ToolUseContext & LocalJSXCommandContext): Promise<React.ReactNode> {
  // 返回 `<RateLimitOptionsMenu onDone={onDone} context={context} />`，作为命令处理这次计算的结果。
  return <RateLimitOptionsMenu onDone={onDone} context={context} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsIkNvbW1hbmRSZXN1bHREaXNwbGF5IiwiTG9jYWxKU1hDb21tYW5kQ29udGV4dCIsIk9wdGlvbldpdGhEZXNjcmlwdGlvbiIsIlNlbGVjdCIsIkRpYWxvZyIsImdldEZlYXR1cmVWYWx1ZV9DQUNIRURfTUFZX0JFX1NUQUxFIiwibG9nRXZlbnQiLCJ1c2VDbGF1ZGVBaUxpbWl0cyIsIlRvb2xVc2VDb250ZXh0IiwiTG9jYWxKU1hDb21tYW5kT25Eb25lIiwiZ2V0T2F1dGhBY2NvdW50SW5mbyIsImdldFJhdGVMaW1pdFRpZXIiLCJnZXRTdWJzY3JpcHRpb25UeXBlIiwiaGFzQ2xhdWRlQWlCaWxsaW5nQWNjZXNzIiwiY2FsbCIsImV4dHJhVXNhZ2VDYWxsIiwiZXh0cmFVc2FnZSIsInVwZ3JhZGUiLCJ1cGdyYWRlQ2FsbCIsIlJhdGVMaW1pdE9wdGlvbnNNZW51T3B0aW9uVHlwZSIsIlJhdGVMaW1pdE9wdGlvbnNNZW51UHJvcHMiLCJvbkRvbmUiLCJyZXN1bHQiLCJvcHRpb25zIiwiZGlzcGxheSIsImNvbnRleHQiLCJSYXRlTGltaXRPcHRpb25zTWVudSIsInQwIiwiJCIsIl9jIiwic3ViQ29tbWFuZEpTWCIsInNldFN1YkNvbW1hbmRKU1giLCJjbGF1ZGVBaUxpbWl0cyIsInQxIiwiU3ltYm9sIiwiZm9yIiwic3Vic2NyaXB0aW9uVHlwZSIsInQyIiwicmF0ZUxpbWl0VGllciIsImhhc0V4dHJhVXNhZ2VFbmFibGVkIiwiaXNNYXgiLCJpc01heDIweCIsImlzVGVhbU9yRW50ZXJwcmlzZSIsImJ1eUZpcnN0IiwidDMiLCJiYjAiLCJhY3Rpb25PcHRpb25zIiwib3ZlcmFnZURpc2FibGVkUmVhc29uIiwib3ZlcmFnZVN0YXR1cyIsImlzRW5hYmxlZCIsImhhc0JpbGxpbmdBY2Nlc3MiLCJuZWVkc1RvUmVxdWVzdEZyb21BZG1pbiIsImlzT3JnU3BlbmRDYXBEZXBsZXRlZCIsImlzT3ZlcmFnZVN0YXRlIiwibGFiZWwiLCJ0NCIsInZhbHVlIiwicHVzaCIsImNhbmNlbE9wdGlvbiIsInQ1IiwiaGFuZGxlQ2FuY2VsIiwidW5kZWZpbmVkIiwiaGFuZGxlU2VsZWN0IiwidGhlbiIsImpzeCIsImpzeF8wIiwidDYiLCJsZW5ndGgiLCJ0NyIsIlByb21pc2UiLCJSZWFjdE5vZGUiXSwic291cmNlcyI6WyJyYXRlLWxpbWl0LW9wdGlvbnMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUge1xuICBDb21tYW5kUmVzdWx0RGlzcGxheSxcbiAgTG9jYWxKU1hDb21tYW5kQ29udGV4dCxcbn0gZnJvbSAnLi4vLi4vY29tbWFuZHMuanMnXG5pbXBvcnQge1xuICB0eXBlIE9wdGlvbldpdGhEZXNjcmlwdGlvbixcbiAgU2VsZWN0LFxufSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgZ2V0RmVhdHVyZVZhbHVlX0NBQ0hFRF9NQVlfQkVfU1RBTEUgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hbmFseXRpY3MvZ3Jvd3RoYm9vay5qcydcbmltcG9ydCB7IGxvZ0V2ZW50IH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgdXNlQ2xhdWRlQWlMaW1pdHMgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9jbGF1ZGVBaUxpbWl0c0hvb2suanMnXG5pbXBvcnQgdHlwZSB7IFRvb2xVc2VDb250ZXh0IH0gZnJvbSAnLi4vLi4vVG9vbC5qcydcbmltcG9ydCB0eXBlIHsgTG9jYWxKU1hDb21tYW5kT25Eb25lIH0gZnJvbSAnLi4vLi4vdHlwZXMvY29tbWFuZC5qcydcbmltcG9ydCB7XG4gIGdldE9hdXRoQWNjb3VudEluZm8sXG4gIGdldFJhdGVMaW1pdFRpZXIsXG4gIGdldFN1YnNjcmlwdGlvblR5cGUsXG59IGZyb20gJy4uLy4uL3V0aWxzL2F1dGguanMnXG5pbXBvcnQgeyBoYXNDbGF1ZGVBaUJpbGxpbmdBY2Nlc3MgfSBmcm9tICcuLi8uLi91dGlscy9iaWxsaW5nLmpzJ1xuaW1wb3J0IHsgY2FsbCBhcyBleHRyYVVzYWdlQ2FsbCB9IGZyb20gJy4uL2V4dHJhLXVzYWdlL2V4dHJhLXVzYWdlLmpzJ1xuaW1wb3J0IHsgZXh0cmFVc2FnZSB9IGZyb20gJy4uL2V4dHJhLXVzYWdlL2luZGV4LmpzJ1xuaW1wb3J0IHVwZ3JhZGUgZnJvbSAnLi4vdXBncmFkZS9pbmRleC5qcydcbmltcG9ydCB7IGNhbGwgYXMgdXBncmFkZUNhbGwgfSBmcm9tICcuLi91cGdyYWRlL3VwZ3JhZGUuanMnXG5cbnR5cGUgUmF0ZUxpbWl0T3B0aW9uc01lbnVPcHRpb25UeXBlID0gJ3VwZ3JhZGUnIHwgJ2V4dHJhLXVzYWdlJyB8ICdjYW5jZWwnXG5cbnR5cGUgUmF0ZUxpbWl0T3B0aW9uc01lbnVQcm9wcyA9IHtcbiAgb25Eb25lOiAoXG4gICAgcmVzdWx0Pzogc3RyaW5nLFxuICAgIG9wdGlvbnM/OlxuICAgICAgfCB7XG4gICAgICAgICAgZGlzcGxheT86IENvbW1hbmRSZXN1bHREaXNwbGF5IHwgdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICAgIHwgdW5kZWZpbmVkLFxuICApID0+IHZvaWRcbiAgY29udGV4dDogVG9vbFVzZUNvbnRleHQgJiBMb2NhbEpTWENvbW1hbmRDb250ZXh0XG59XG5cbmZ1bmN0aW9uIFJhdGVMaW1pdE9wdGlvbnNNZW51KHtcbiAgb25Eb25lLFxuICBjb250ZXh0LFxufTogUmF0ZUxpbWl0T3B0aW9uc01lbnVQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtzdWJDb21tYW5kSlNYLCBzZXRTdWJDb21tYW5kSlNYXSA9IHVzZVN0YXRlPFJlYWN0LlJlYWN0Tm9kZT4obnVsbClcbiAgY29uc3QgY2xhdWRlQWlMaW1pdHMgPSB1c2VDbGF1ZGVBaUxpbWl0cygpXG4gIGNvbnN0IHN1YnNjcmlwdGlvblR5cGUgPSBnZXRTdWJzY3JpcHRpb25UeXBlKClcbiAgY29uc3QgcmF0ZUxpbWl0VGllciA9IGdldFJhdGVMaW1pdFRpZXIoKVxuICBjb25zdCBoYXNFeHRyYVVzYWdlRW5hYmxlZCA9XG4gICAgZ2V0T2F1dGhBY2NvdW50SW5mbygpPy5oYXNFeHRyYVVzYWdlRW5hYmxlZCA9PT0gdHJ1ZVxuICBjb25zdCBpc01heCA9IHN1YnNjcmlwdGlvblR5cGUgPT09ICdtYXgnXG4gIGNvbnN0IGlzTWF4MjB4ID0gaXNNYXggJiYgcmF0ZUxpbWl0VGllciA9PT0gJ2RlZmF1bHRfY2xhdWRlX21heF8yMHgnXG4gIGNvbnN0IGlzVGVhbU9yRW50ZXJwcmlzZSA9XG4gICAgc3Vic2NyaXB0aW9uVHlwZSA9PT0gJ3RlYW0nIHx8IHN1YnNjcmlwdGlvblR5cGUgPT09ICdlbnRlcnByaXNlJ1xuICBjb25zdCBidXlGaXJzdCA9IGdldEZlYXR1cmVWYWx1ZV9DQUNIRURfTUFZX0JFX1NUQUxFKFxuICAgICd0ZW5ndV9qYWRlX2FudmlsXzQnLFxuICAgIGZhbHNlLFxuICApXG5cbiAgY29uc3Qgb3B0aW9ucyA9IHVzZU1lbW88XG4gICAgT3B0aW9uV2l0aERlc2NyaXB0aW9uPFJhdGVMaW1pdE9wdGlvbnNNZW51T3B0aW9uVHlwZT5bXVxuICA+KCgpID0+IHtcbiAgICBjb25zdCBhY3Rpb25PcHRpb25zOiBPcHRpb25XaXRoRGVzY3JpcHRpb248UmF0ZUxpbWl0T3B0aW9uc01lbnVPcHRpb25UeXBlPltdID1cbiAgICAgIFtdXG5cbiAgICBpZiAoZXh0cmFVc2FnZS5pc0VuYWJsZWQoKSkge1xuICAgICAgY29uc3QgaGFzQmlsbGluZ0FjY2VzcyA9IGhhc0NsYXVkZUFpQmlsbGluZ0FjY2VzcygpXG4gICAgICBjb25zdCBuZWVkc1RvUmVxdWVzdEZyb21BZG1pbiA9IGlzVGVhbU9yRW50ZXJwcmlzZSAmJiAhaGFzQmlsbGluZ0FjY2Vzc1xuICAgICAgLy8gT3JnIHNwZW5kIGNhcCBkZXBsZXRlZCAtIG5vbi1hZG1pbnMgY2FuJ3QgcmVxdWVzdCBtb3JlIHNpbmNlIHRoZXJlJ3Mgbm90aGluZyB0byBhbGxvY2F0ZVxuICAgICAgLy8gLSBvdXRfb2ZfY3JlZGl0czogd2FsbGV0IGVtcHR5XG4gICAgICAvLyAtIG9yZ19sZXZlbF9kaXNhYmxlZF91bnRpbDogb3JnIHNwZW5kIGNhcCBoaXQgZm9yIHRoZSBtb250aFxuICAgICAgLy8gLSBvcmdfc2VydmljZV96ZXJvX2NyZWRpdF9saW1pdDogb3JnIHNlcnZpY2UgaGFzIHplcm8gY3JlZGl0IGxpbWl0XG4gICAgICBjb25zdCBpc09yZ1NwZW5kQ2FwRGVwbGV0ZWQgPVxuICAgICAgICBjbGF1ZGVBaUxpbWl0cy5vdmVyYWdlRGlzYWJsZWRSZWFzb24gPT09ICdvdXRfb2ZfY3JlZGl0cycgfHxcbiAgICAgICAgY2xhdWRlQWlMaW1pdHMub3ZlcmFnZURpc2FibGVkUmVhc29uID09PSAnb3JnX2xldmVsX2Rpc2FibGVkX3VudGlsJyB8fFxuICAgICAgICBjbGF1ZGVBaUxpbWl0cy5vdmVyYWdlRGlzYWJsZWRSZWFzb24gPT09ICdvcmdfc2VydmljZV96ZXJvX2NyZWRpdF9saW1pdCdcblxuICAgICAgLy8gSGlkZSBmb3Igbm9uLWFkbWluIFRlYW0vRW50ZXJwcmlzZSB1c2VycyB3aGVuIG9yZyBzcGVuZCBjYXAgaXMgZGVwbGV0ZWRcbiAgICAgIGlmIChuZWVkc1RvUmVxdWVzdEZyb21BZG1pbiAmJiBpc09yZ1NwZW5kQ2FwRGVwbGV0ZWQpIHtcbiAgICAgICAgLy8gRG9uJ3Qgc2hvdyBleHRyYS11c2FnZSBvcHRpb25cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGlzT3ZlcmFnZVN0YXRlID1cbiAgICAgICAgICBjbGF1ZGVBaUxpbWl0cy5vdmVyYWdlU3RhdHVzID09PSAncmVqZWN0ZWQnIHx8XG4gICAgICAgICAgY2xhdWRlQWlMaW1pdHMub3ZlcmFnZVN0YXR1cyA9PT0gJ2FsbG93ZWRfd2FybmluZydcblxuICAgICAgICBsZXQgbGFiZWw6IHN0cmluZ1xuICAgICAgICBpZiAobmVlZHNUb1JlcXVlc3RGcm9tQWRtaW4pIHtcbiAgICAgICAgICBsYWJlbCA9IGlzT3ZlcmFnZVN0YXRlID8gJ1JlcXVlc3QgbW9yZScgOiAnUmVxdWVzdCBleHRyYSB1c2FnZSdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsYWJlbCA9IGhhc0V4dHJhVXNhZ2VFbmFibGVkXG4gICAgICAgICAgICA/ICdBZGQgZnVuZHMgdG8gY29udGludWUgd2l0aCBleHRyYSB1c2FnZSdcbiAgICAgICAgICAgIDogJ1N3aXRjaCB0byBleHRyYSB1c2FnZSdcbiAgICAgICAgfVxuXG4gICAgICAgIGFjdGlvbk9wdGlvbnMucHVzaCh7XG4gICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgdmFsdWU6ICdleHRyYS11c2FnZScsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpc01heDIweCAmJiAhaXNUZWFtT3JFbnRlcnByaXNlICYmIHVwZ3JhZGUuaXNFbmFibGVkKCkpIHtcbiAgICAgIGFjdGlvbk9wdGlvbnMucHVzaCh7XG4gICAgICAgIGxhYmVsOiAnVXBncmFkZSB5b3VyIHBsYW4nLFxuICAgICAgICB2YWx1ZTogJ3VwZ3JhZGUnLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBjYW5jZWxPcHRpb246IE9wdGlvbldpdGhEZXNjcmlwdGlvbjxSYXRlTGltaXRPcHRpb25zTWVudU9wdGlvblR5cGU+ID1cbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdTdG9wIGFuZCB3YWl0IGZvciBsaW1pdCB0byByZXNldCcsXG4gICAgICAgIHZhbHVlOiAnY2FuY2VsJyxcbiAgICAgIH1cblxuICAgIGlmIChidXlGaXJzdCkge1xuICAgICAgcmV0dXJuIFsuLi5hY3Rpb25PcHRpb25zLCBjYW5jZWxPcHRpb25dXG4gICAgfVxuICAgIHJldHVybiBbY2FuY2VsT3B0aW9uLCAuLi5hY3Rpb25PcHRpb25zXVxuICB9LCBbXG4gICAgYnV5Rmlyc3QsXG4gICAgaXNNYXgyMHgsXG4gICAgaXNUZWFtT3JFbnRlcnByaXNlLFxuICAgIGhhc0V4dHJhVXNhZ2VFbmFibGVkLFxuICAgIGNsYXVkZUFpTGltaXRzLm92ZXJhZ2VTdGF0dXMsXG4gICAgY2xhdWRlQWlMaW1pdHMub3ZlcmFnZURpc2FibGVkUmVhc29uLFxuICBdKVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUNhbmNlbCgpOiB2b2lkIHtcbiAgICBsb2dFdmVudCgndGVuZ3VfcmF0ZV9saW1pdF9vcHRpb25zX21lbnVfY2FuY2VsJywge30pXG4gICAgb25Eb25lKHVuZGVmaW5lZCwgeyBkaXNwbGF5OiAnc2tpcCcgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVNlbGVjdCh2YWx1ZTogUmF0ZUxpbWl0T3B0aW9uc01lbnVPcHRpb25UeXBlKTogdm9pZCB7XG4gICAgaWYgKHZhbHVlID09PSAndXBncmFkZScpIHtcbiAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9yYXRlX2xpbWl0X29wdGlvbnNfbWVudV9zZWxlY3RfdXBncmFkZScsIHt9KVxuICAgICAgdm9pZCB1cGdyYWRlQ2FsbChvbkRvbmUsIGNvbnRleHQpLnRoZW4oanN4ID0+IHtcbiAgICAgICAgaWYgKGpzeCkge1xuICAgICAgICAgIHNldFN1YkNvbW1hbmRKU1goanN4KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09ICdleHRyYS11c2FnZScpIHtcbiAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9yYXRlX2xpbWl0X29wdGlvbnNfbWVudV9zZWxlY3RfZXh0cmFfdXNhZ2UnLCB7fSlcbiAgICAgIHZvaWQgZXh0cmFVc2FnZUNhbGwob25Eb25lLCBjb250ZXh0KS50aGVuKGpzeCA9PiB7XG4gICAgICAgIGlmIChqc3gpIHtcbiAgICAgICAgICBzZXRTdWJDb21tYW5kSlNYKGpzeClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnY2FuY2VsJykge1xuICAgICAgaGFuZGxlQ2FuY2VsKClcbiAgICB9XG4gIH1cblxuICBpZiAoc3ViQ29tbWFuZEpTWCkge1xuICAgIHJldHVybiBzdWJDb21tYW5kSlNYXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2dcbiAgICAgIHRpdGxlPVwiV2hhdCBkbyB5b3Ugd2FudCB0byBkbz9cIlxuICAgICAgb25DYW5jZWw9e2hhbmRsZUNhbmNlbH1cbiAgICAgIGNvbG9yPVwic3VnZ2VzdGlvblwiXG4gICAgPlxuICAgICAgPFNlbGVjdDxSYXRlTGltaXRPcHRpb25zTWVudU9wdGlvblR5cGU+XG4gICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XG4gICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVTZWxlY3R9XG4gICAgICAgIHZpc2libGVPcHRpb25Db3VudD17b3B0aW9ucy5sZW5ndGh9XG4gICAgICAvPlxuICAgIDwvRGlhbG9nPlxuICApXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsKFxuICBvbkRvbmU6IExvY2FsSlNYQ29tbWFuZE9uRG9uZSxcbiAgY29udGV4dDogVG9vbFVzZUNvbnRleHQgJiBMb2NhbEpTWENvbW1hbmRDb250ZXh0LFxuKTogUHJvbWlzZTxSZWFjdC5SZWFjdE5vZGU+IHtcbiAgcmV0dXJuIDxSYXRlTGltaXRPcHRpb25zTWVudSBvbkRvbmU9e29uRG9uZX0gY29udGV4dD17Y29udGV4dH0gLz5cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsT0FBTyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNoRCxjQUNFQyxvQkFBb0IsRUFDcEJDLHNCQUFzQixRQUNqQixtQkFBbUI7QUFDMUIsU0FDRSxLQUFLQyxxQkFBcUIsRUFDMUJDLE1BQU0sUUFDRCx5Q0FBeUM7QUFDaEQsU0FBU0MsTUFBTSxRQUFRLDBDQUEwQztBQUNqRSxTQUFTQyxtQ0FBbUMsUUFBUSx3Q0FBd0M7QUFDNUYsU0FBU0MsUUFBUSxR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
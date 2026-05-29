// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useEffect、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useMemo, useState } from 'react';
// 注册 extraUsage 命令实现，后续会把它纳入斜杠命令集合。
import { extraUsage } from 'src/commands/extra-usage/index.js';
// 引入 Box、Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from 'src/ink.js';
// 接入 useClaudeAiLimits 服务层能力，把外部通信或共享状态交给 src/services/claudeAiLimitsHook.js 处理。
import { useClaudeAiLimits } from 'src/services/claudeAiLimitsHook.js';
// 接入 shouldProcessMockLimits 服务层能力，把外部通信或共享状态交给 src/services/rateLimitMocking.js 处理。
import { shouldProcessMockLimits } from 'src/services/rateLimitMocking.js'; // Used for /mock-limits command
// 复用 getRateLimitTier、getSubscriptionType、isClaudeAISubscriber 工具函数，把通用处理留在 src/utils/auth.js 中维护。
import { getRateLimitTier, getSubscriptionType, isClaudeAISubscriber } from 'src/utils/auth.js';
// 复用 hasClaudeAiBillingAccess 工具函数，把通用处理留在 src/utils/billing.js 中维护。
import { hasClaudeAiBillingAccess } from 'src/utils/billing.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// UpsellParams 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type UpsellParams = {
  shouldShowUpsell: boolean;
  isMax20x: boolean;
  isExtraUsageCommandEnabled: boolean;
  shouldAutoOpenRateLimitOptionsMenu: boolean;
  isTeamOrEnterprise: boolean;
  hasBillingAccess: boolean;
};
// getUpsellMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUpsellMessage({
  shouldShowUpsell,
  isMax20x,
  isExtraUsageCommandEnabled,
  shouldAutoOpenRateLimitOptionsMenu,
  isTeamOrEnterprise,
  hasBillingAccess
}: UpsellParams): string | null {
  // shouldShowUpsell缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!shouldShowUpsell) return null;
  // 满足 `isMax20x` 时，终端渲染执行该分支。
  if (isMax20x) {
    // 满足 `isExtraUsageCommandEnabled` 时，终端渲染执行该分支。
    if (isExtraUsageCommandEnabled) {
      // 返回 `'/extra-usage to finish what you\u2019re working on.'`，作为终端渲染这次计算的结果。
      return '/extra-usage to finish what you\u2019re working on.';
    }
    // 返回 `'/login to switch to an API usage-billed account.'`，作为终端渲染这次计算的结果。
    return '/login to switch to an API usage-billed account.';
  }
  // 满足 `shouldAutoOpenRateLimitOptionsMenu` 时，终端渲染执行该分支。
  if (shouldAutoOpenRateLimitOptionsMenu) {
    // 返回 `'Opening your options\u2026'`，作为终端渲染这次计算的结果。
    return 'Opening your options\u2026';
  }
  // 只有 `!isTeamOrEnterprise && !isExtraUsageCommandEnabled` 满足时，终端渲染才执行该分支。
  if (!isTeamOrEnterprise && !isExtraUsageCommandEnabled) {
    // 返回 `'/upgrade to increase your usage limit.'`，作为终端渲染这次计算的结果。
    return '/upgrade to increase your usage limit.';
  }
  // 满足 `isTeamOrEnterprise` 时，终端渲染执行该分支。
  if (isTeamOrEnterprise) {
    // isExtraUsageCommandEnabled 命令数据缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!isExtraUsageCommandEnabled) return null;
    // 满足 `hasBillingAccess` 时，终端渲染执行该分支。
    if (hasBillingAccess) {
      // 返回 `'/extra-usage to finish what you\u2019re working on.'`，作为终端渲染这次计算的结果。
      return '/extra-usage to finish what you\u2019re working on.';
    }
    // 返回 `'/extra-usage to request more usage from your admin.'`，作为终端渲染这次计算的结果。
    return '/extra-usage to request more usage from your admin.';
  }
  // 返回 `'/upgrade or /extra-usage to finish what you\u2019re working on.'`，作为终端渲染这次计算的结果。
  return '/upgrade or /extra-usage to finish what you\u2019re working on.';
}
// RateLimitMessageProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type RateLimitMessageProps = {
  text: string;
  onOpenRateLimitOptions?: () => void;
};
// RateLimitMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function RateLimitMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(16);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text,
    onOpenRateLimitOptions
  } = t0;
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
  // subscriptionType 命名 `t1`，让后续代码直接表达这个值的用途。
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
  // isTeamOrEnterprise标记终端 UI Rate Limit Message是否启用对应路径。
  const isTeamOrEnterprise = subscriptionType === "team" || subscriptionType === "enterprise";
  // isMax20x标记终端 UI Rate Limit Message是否启用对应路径。
  const isMax20x = rateLimitTier === "default_claude_max_20x";
  // t3 暂存 `shouldProcessMockLimits() || isClaudeAISubscriber()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `shouldProcessMockLimits() || isClaudeAISubscriber()` 生成的渲染片段，后续返回路径直接复用。
    t3 = shouldProcessMockLimits() || isClaudeAISubscriber();
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // shouldShowUpsell标记终端 UI Rate Limit Message是否启用对应路径。
  const shouldShowUpsell = t3;
  // canSeeRateLimitOptionsUpsell标记终端 UI Rate Limit Message是否启用对应路径。
  const canSeeRateLimitOptionsUpsell = shouldShowUpsell && !isMax20x;
  // hasOpenedInteractiveMenu 由 React state 持有，setHasOpenedInteractiveMenu 会在用户操作或异步结果返回时触发刷新。
  const [hasOpenedInteractiveMenu, setHasOpenedInteractiveMenu] = useState(false);
  // claudeAiLimits 集合保存`useClaudeAiLimits`，供终端渲染后续处理使用。
  const claudeAiLimits = useClaudeAiLimits();
  // isCurrentlyRateLimited标记终端 UI Rate Limit Message是否启用对应路径。
  const isCurrentlyRateLimited = claudeAiLimits.status === "rejected" && claudeAiLimits.resetsAt !== undefined && !claudeAiLimits.isUsingOverage;
  // shouldAutoOpenRateLimitOptionsMenu标记终端 UI Rate Limit Message是否启用对应路径。
  const shouldAutoOpenRateLimitOptionsMenu = canSeeRateLimitOptionsUpsell && !hasOpenedInteractiveMenu && isCurrentlyRateLimited && onOpenRateLimitOptions;
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 暂存 `[shouldAutoOpenRateLimitOptionsMenu, onOpenRateLimitOptio...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onOpenRateLimitOptions || $[4] !== shouldAutoOpenRateLimitOptionsMenu) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // 满足 `shouldAutoOpenRateLimitOptionsMenu` 时，终端渲染执行该分支。
      if (shouldAutoOpenRateLimitOptionsMenu) {
        // setHasOpenedInteractiveMenu 写入新的状态值，使终端渲染后续读取保持一致。
        setHasOpenedInteractiveMenu(true);
        // 调用 onOpenRateLimitOptions，触发终端渲染此处需要的副作用。
        onOpenRateLimitOptions();
      }
    };
    // t5 暂存 `[shouldAutoOpenRateLimitOptionsMenu, onOpenRateLimitOptio...` 生成的渲染片段，后续返回路径直接复用。
    t5 = [shouldAutoOpenRateLimitOptionsMenu, onOpenRateLimitOptions];
    // $[3] 缓存 `onOpenRateLimitOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onOpenRateLimitOptions;
    // $[4] 缓存 `shouldAutoOpenRateLimitOptionsMenu`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = shouldAutoOpenRateLimitOptionsMenu;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t4, t5);
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // 终端 UI 组件 Rate Limit Message在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // t7 暂存 `getUpsellMessage({` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== shouldAutoOpenRateLimitOptionsMenu) {
      // t7 暂存 `getUpsellMessage({` 生成的渲染片段，后续返回路径直接复用。
      t7 = getUpsellMessage({
        shouldShowUpsell,
        isMax20x,
        isExtraUsageCommandEnabled: extraUsage.isEnabled(),
        shouldAutoOpenRateLimitOptionsMenu: !!shouldAutoOpenRateLimitOptionsMenu,
        isTeamOrEnterprise,
        hasBillingAccess: hasClaudeAiBillingAccess()
      });
      // $[7] 缓存 `shouldAutoOpenRateLimitOptionsMenu`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = shouldAutoOpenRateLimitOptionsMenu;
      // $[8] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[8];
    }
    // 消息保存`t7`，作为后续临时缓存值处理的输入。
    const message = t7;
    // 消息缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!message) {
      // t6 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
      t6 = null;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb0;
    }
    // t8 暂存 `<Text dimColor={true}>{message}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[9] !== message) {
      // t8 暂存 `<Text dimColor={true}>{message}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text dimColor={true}>{message}</Text>;
      // $[9] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = message;
      // $[10] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[10];
    }
    // t6 暂存 `t8` 生成的渲染片段，后续返回路径直接复用。
    t6 = t8;
  }
  // upsell保存`t6`，作为后续临时缓存值处理的输入。
  const upsell = t6;
  // t7 暂存 `<Text color="error">{text}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== text) {
    // t7 暂存 `<Text color="error">{text}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text color="error">{text}</Text>;
    // $[11] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = text;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // 临时值 t8 命名 `hasOpenedInteractiveMenu ? null : upsell`，让后续代码直接表达这个值的用途。
  const t8 = hasOpenedInteractiveMenu ? null : upsell;
  // t9 暂存 `<MessageResponse><Box flexDirection="column">{t7}{t8}</Bo...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t7 || $[14] !== t8) {
    // t9 暂存 `<MessageResponse><Box flexDirection="column">{t7}{t8}</Bo...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <MessageResponse><Box flexDirection="column">{t7}{t8}</Box></MessageResponse>;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsImV4dHJhVXNhZ2UiLCJCb3giLCJUZXh0IiwidXNlQ2xhdWRlQWlMaW1pdHMiLCJzaG91bGRQcm9jZXNzTW9ja0xpbWl0cyIsImdldFJhdGVMaW1pdFRpZXIiLCJnZXRTdWJzY3JpcHRpb25UeXBlIiwiaXNDbGF1ZGVBSVN1YnNjcmliZXIiLCJoYXNDbGF1ZGVBaUJpbGxpbmdBY2Nlc3MiLCJNZXNzYWdlUmVzcG9uc2UiLCJVcHNlbGxQYXJhbXMiLCJzaG91bGRTaG93VXBzZWxsIiwiaXNNYXgyMHgiLCJpc0V4dHJhVXNhZ2VDb21tYW5kRW5hYmxlZCIsInNob3VsZEF1dG9PcGVuUmF0ZUxpbWl0T3B0aW9uc01lbnUiLCJpc1RlYW1PckVudGVycHJpc2UiLCJoYXNCaWxsaW5nQWNjZXNzIiwiZ2V0VXBzZWxsTWVzc2FnZSIsIlJhdGVMaW1pdE1lc3NhZ2VQcm9wcyIsInRleHQiLCJvbk9wZW5SYXRlTGltaXRPcHRpb25zIiwiUmF0ZUxpbWl0TWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJzdWJzY3JpcHRpb25UeXBlIiwidDIiLCJyYXRlTGltaXRUaWVyIiwidDMiLCJjYW5TZWVSYXRlTGltaXRPcHRpb25zVXBzZWxsIiwiaGFzT3BlbmVkSW50ZXJhY3RpdmVNZW51Iiwic2V0SGFzT3BlbmVkSW50ZXJhY3RpdmVNZW51IiwiY2xhdWRlQWlMaW1pdHMiLCJpc0N1cnJlbnRseVJhdGVMaW1pdGVkIiwic3RhdHVzIiwicmVzZXRzQXQiLCJ1bmRlZmluZWQiLCJpc1VzaW5nT3ZlcmFnZSIsInQ0IiwidDUiLCJ0NiIsImJiMCIsInQ3IiwiaXNFbmFibGVkIiwibWVzc2FnZSIsInQ4IiwidXBzZWxsIiwidDkiXSwic291cmNlcyI6WyJSYXRlTGltaXRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgZXh0cmFVc2FnZSB9IGZyb20gJ3NyYy9jb21tYW5kcy9leHRyYS11c2FnZS9pbmRleC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJ3NyYy9pbmsuanMnXG5pbXBvcnQgeyB1c2VDbGF1ZGVBaUxpbWl0cyB9IGZyb20gJ3NyYy9zZXJ2aWNlcy9jbGF1ZGVBaUxpbWl0c0hvb2suanMnXG5pbXBvcnQgeyBzaG91bGRQcm9jZXNzTW9ja0xpbWl0cyB9IGZyb20gJ3NyYy9zZXJ2aWNlcy9yYXRlTGltaXRNb2NraW5nLmpzJyAvLyBVc2VkIGZvciAvbW9jay1saW1pdHMgY29tbWFuZFxuaW1wb3J0IHtcbiAgZ2V0UmF0ZUxpbWl0VGllcixcbiAgZ2V0U3Vic2NyaXB0aW9uVHlwZSxcbiAgaXNDbGF1ZGVBSVN1YnNjcmliZXIsXG59IGZyb20gJ3NyYy91dGlscy9hdXRoLmpzJ1xuaW1wb3J0IHsgaGFzQ2xhdWRlQWlCaWxsaW5nQWNjZXNzIH0gZnJvbSAnc3JjL3V0aWxzL2JpbGxpbmcuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5cbnR5cGUgVXBzZWxsUGFyYW1zID0ge1xuICBzaG91bGRTaG93VXBzZWxsOiBib29sZWFuXG4gIGlzTWF4MjB4OiBib29sZWFuXG4gIGlzRXh0cmFVc2FnZUNvbW1hbmRFbmFibGVkOiBib29sZWFuXG4gIHNob3VsZEF1dG9PcGVuUmF0ZUxpbWl0T3B0aW9uc01lbnU6IGJvb2xlYW5cbiAgaXNUZWFtT3JFbnRlcnByaXNlOiBib29sZWFuXG4gIGhhc0JpbGxpbmdBY2Nlc3M6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVwc2VsbE1lc3NhZ2Uoe1xuICBzaG91bGRTaG93VXBzZWxsLFxuICBpc01heDIweCxcbiAgaXNFeHRyYVVzYWdlQ29tbWFuZEVuYWJsZWQsXG4gIHNob3VsZEF1dG9PcGVuUmF0ZUxpbWl0T3B0aW9uc01lbnUsXG4gIGlzVGVhbU9yRW50ZXJwcmlzZSxcbiAgaGFzQmlsbGluZ0FjY2Vzcyxcbn06IFVwc2VsbFBhcmFtcyk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIXNob3VsZFNob3dVcHNlbGwpIHJldHVybiBudWxsXG5cbiAgaWYgKGlzTWF4MjB4KSB7XG4gICAgaWYgKGlzRXh0cmFVc2FnZUNvbW1hbmRFbmFibGVkKSB7XG4gICAgICByZXR1cm4gJy9leHRyYS11c2FnZSB0byBmaW5pc2ggd2hhdCB5b3VcXHUyMDE5cmUgd29ya2luZyBvbi4nXG4gICAgfVxuICAgIHJldHVybiAnL2xvZ2luIHRvIHN3aXRjaCB0byBhbiBBUEkgdXNhZ2UtYmlsbGVkIGFjY291bnQuJ1xuICB9XG5cbiAgaWYgKHNob3VsZEF1dG9PcGVuUmF0ZUxpbWl0T3B0aW9uc01lbnUpIHtcbiAgICByZXR1cm4gJ09wZW5pbmcgeW91ciBvcHRpb25zXFx1MjAyNidcbiAgfVxuXG4gIGlmICghaXNUZWFtT3JFbnRlcnByaXNlICYmICFpc0V4dHJhVXNhZ2VDb21tYW5kRW5hYmxlZCkge1xuICAgIHJldHVybiAnL3VwZ3JhZGUgdG8gaW5jcmVhc2UgeW91ciB1c2FnZSBsaW1pdC4nXG4gIH1cblxuICBpZiAoaXNUZWFtT3JFbnRlcnByaXNlKSB7XG4gICAgaWYgKCFpc0V4dHJhVXNhZ2VDb21tYW5kRW5hYmxlZCkgcmV0dXJuIG51bGxcblxuICAgIGlmIChoYXNCaWxsaW5nQWNjZXNzKSB7XG4gICAgICByZXR1cm4gJy9leHRyYS11c2FnZSB0byBmaW5pc2ggd2hhdCB5b3VcXHUyMDE5cmUgd29ya2luZyBvbi4nXG4gICAgfVxuXG4gICAgcmV0dXJuICcvZXh0cmEtdXNhZ2UgdG8gcmVxdWVzdCBtb3JlIHVzYWdlIGZyb20geW91ciBhZG1pbi4nXG4gIH1cblxuICByZXR1cm4gJy91cGdyYWRlIG9yIC9leHRyYS11c2FnZSB0byBmaW5pc2ggd2hhdCB5b3VcXHUyMDE5cmUgd29ya2luZyBvbi4nXG59XG5cbnR5cGUgUmF0ZUxpbWl0TWVzc2FnZVByb3BzID0ge1xuICB0ZXh0OiBzdHJpbmdcbiAgb25PcGVuUmF0ZUxpbWl0T3B0aW9ucz86ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFJhdGVMaW1pdE1lc3NhZ2Uoe1xuICB0ZXh0LFxuICBvbk9wZW5SYXRlTGltaXRPcHRpb25zLFxufTogUmF0ZUxpbWl0TWVzc2FnZVByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc3Vic2NyaXB0aW9uVHlwZSA9IGdldFN1YnNjcmlwdGlvblR5cGUoKVxuICBjb25zdCByYXRlTGltaXRUaWVyID0gZ2V0UmF0ZUxpbWl0VGllcigpXG4gIGNvbnN0IGlzVGVhbU9yRW50ZXJwcmlzZSA9XG4gICAgc3Vic2NyaXB0aW9uVHlwZSA9PT0gJ3RlYW0nIHx8IHN1YnNjcmlwdGlvblR5cGUgPT09ICdlbnRlcnByaXNlJ1xuICBjb25zdCBpc01heDIweCA9IHJhdGVMaW1pdFRpZXIgPT09ICdkZWZhdWx0X2NsYXVkZV9tYXhfMjB4J1xuICAvLyBBbHdheXMgc2hvdyB1cHNlbGwgd2hlbiB1c2luZyAvbW9jay1saW1pdHMgY29tbWFuZCwgb3RoZXJ3aXNlIHNob3cgZm9yIHN1YnNjcmliZXJzXG4gIGNvbnN0IHNob3VsZFNob3dVcHNlbGwgPSBzaG91bGRQcm9jZXNzTW9ja0xpbWl0cygpIHx8IGlzQ2xhdWRlQUlTdWJzY3JpYmVyKClcblxuICBjb25zdCBjYW5TZWVSYXRlTGltaXRPcHRpb25zVXBzZWxsID0gc2hvdWxkU2hvd1Vwc2VsbCAmJiAhaXNNYXgyMHhcblxuICBjb25zdCBbaGFzT3BlbmVkSW50ZXJhY3RpdmVNZW51LCBzZXRIYXNPcGVuZWRJbnRlcmFjdGl2ZU1lbnVdID1cbiAgICB1c2VTdGF0ZShmYWxzZSlcblxuICAvLyBDaGVjayBhY3R1YWwgcmF0ZSBsaW1pdCBzdGF0dXMgLSBvbmx5IGF1dG8tb3BlbiBpZiB1c2VyIGlzIGN1cnJlbnRseSByYXRlIGxpbWl0ZWRcbiAgLy8gQU5EIHdlJ3ZlIHZlcmlmaWVkIHRoaXMgd2l0aCB0aGUgQVBJIChyZXNldHNBdCBpcyBvbmx5IHNldCBhZnRlciBBUEkgcmVzcG9uc2UpLlxuICAvLyBUaGlzIHByZXZlbnRzIGZhbHNlIGFsZXJ0cyB3aGVuIHJlc3VtaW5nIHNlc3Npb25zIHdpdGggb2xkIHJhdGUgbGltaXQgbWVzc2FnZXMuXG4gIGNvbnN0IGNsYXVkZUFpTGltaXRzID0gdXNlQ2xhdWRlQWlMaW1pdHMoKVxuICBjb25zdCBpc0N1cnJlbnRseVJhdGVMaW1pdGVkID1cbiAgICBjbGF1ZGVBaUxpbWl0cy5zdGF0dXMgPT09ICdyZWplY3RlZCcgJiZcbiAgICBjbGF1ZGVBaUxpbWl0cy5yZXNldHNBdCAhPT0gdW5kZWZpbmVkICYmXG4gICAgIWNsYXVkZUFpTGltaXRzLmlzVXNpbmdPdmVyYWdlXG5cbiAgY29uc3Qgc2hvdWxkQXV0b09wZW5SYXRlTGltaXRPcHRpb25zTWVudSA9XG4gICAgY2FuU2VlUmF0ZUxpbWl0T3B0aW9uc1Vwc2VsbCAmJlxuICAgICFoYXNPcGVuZWRJbnRlcmFjdGl2ZU1lbnUgJiZcbiAgICBpc0N1cnJlbnRseVJhdGVMaW1pdGVkICYmXG4gICAgb25PcGVuUmF0ZUxpbWl0T3B0aW9uc1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHNob3VsZEF1dG9PcGVuUmF0ZUxpbWl0T3B0aW9uc01lbnUpIHtcbiAgICAgIHNldEhhc09wZW5lZEludGVyYWN0aXZlTWVudSh0cnVlKVxuICAgICAgb25PcGVuUmF0ZUxpbWl0T3B0aW9ucygpXG4gICAgfVxuICB9LCBbc2hvdWxkQXV0b09wZW5SYXRlTGltaXRPcHRpb25zTWVudSwgb25PcGVuUmF0ZUxpbWl0T3B0aW9uc10pXG5cbiAgY29uc3QgdXBzZWxsID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGdldFVwc2VsbE1lc3NhZ2Uoe1xuICAgICAgc2hvdWxkU2hvd1Vwc2VsbCxcbiAgICAgIGlzTWF4MjB4LFxuICAgICAgaXNFeHRyYVVzYWdlQ29tbWFuZEVuYWJsZWQ6IGV4dHJhVXNhZ2UuaXNFbmFibGVkKCksXG4gICAgICBzaG91bGRBdXRvT3BlblJhdGVMaW1pdE9wdGlvbnNNZW51OiAhIXNob3VsZEF1dG9PcGVuUmF0ZUxpbWl0T3B0aW9uc01lbnUsXG4gICAgICBpc1RlYW1PckVudGVycHJpc2UsXG4gICAgICBoYXNCaWxsaW5nQWNjZXNzOiBoYXNDbGF1ZGVBaUJpbGxpbmdBY2Nlc3MoKSxcbiAgICB9KVxuICAgIGlmICghbWVzc2FnZSkgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gPFRleHQgZGltQ29sb3I+e21lc3NhZ2V9PC9UZXh0PlxuICB9LCBbXG4gICAgc2hvdWxkU2hvd1Vwc2VsbCxcbiAgICBpc01heDIweCxcbiAgICBpc1RlYW1PckVudGVycHJpc2UsXG4gICAgc2hvdWxkQXV0b09wZW5SYXRlTGltaXRPcHRpb25zTWVudSxcbiAgXSlcblxuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPnt0ZXh0fTwvVGV4dD5cbiAgICAgICAge2hhc09wZW5lZEludGVyYWN0aXZlTWVudSA/IG51bGwgOiB1cHNlbGx9XG4gICAgICA8L0JveD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxTQUFTLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDM0QsU0FBU0MsVUFBVSxRQUFRLG1DQUFtQztBQUM5RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxZQUFZO0FBQ3RDLFNBQVNDLGlCQUFpQixRQUFRLG9DQUFvQztBQUN0RSxTQUFTQyx1QkFBdUIsUUFBUSxrQ0FBa0MsRUFBQztBQUMzRSxTQUNFQyxnQkFBZ0IsRUFDaEJDLG1CQUFtQixFQUNuQkMsb0JBQW9CLFFBQ2YsbUJBQW1CO0FBQzFCLFNBQVNDLHdCQUF3QixR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
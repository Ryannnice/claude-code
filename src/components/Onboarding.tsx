// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useEffect、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useEffect, useMemo, useState } from 'react';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 注册 setupTerminal、shouldOfferTerminalSetup 命令实现，后续会把它纳入斜杠命令集合。
import { setupTerminal, shouldOfferTerminalSetup } from '../commands/terminalSetup/terminalSetup.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Link、Newline、Text、useTheme，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Newline, Text, useTheme } from '../ink.js';
// 引入 useKeybindings，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../keybindings/useKeybinding.js';
// 复用 isAnthropicAuthEnabled 工具函数，把通用处理留在 ../utils/auth.js 中维护。
import { isAnthropicAuthEnabled } from '../utils/auth.js';
// 复用 normalizeApiKeyForConfig 工具函数，把通用处理留在 ../utils/authPortable.js 中维护。
import { normalizeApiKeyForConfig } from '../utils/authPortable.js';
// 复用 getCustomApiKeyStatus 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getCustomApiKeyStatus } from '../utils/config.js';
// 复用 env 工具函数，把通用处理留在 ../utils/env.js 中维护。
import { env } from '../utils/env.js';
// 复用 isRunningOnHomespace 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isRunningOnHomespace } from '../utils/envUtils.js';
// 复用 PreflightStep 工具函数，把通用处理留在 ../utils/preflightChecks.js 中维护。
import { PreflightStep } from '../utils/preflightChecks.js';
// 类型依赖 { ThemeSetting } 来自 ../utils/theme.js，用于校准终端渲染的数据契约。
import type { ThemeSetting } from '../utils/theme.js';
// 引入 ApproveApiKey，将 ./ApproveApiKey.js 中已经封装好的能力接到本文件流程里。
import { ApproveApiKey } from './ApproveApiKey.js';
// 引入 ConsoleOAuthFlow，将 ./ConsoleOAuthFlow.js 中已经封装好的能力接到本文件流程里。
import { ConsoleOAuthFlow } from './ConsoleOAuthFlow.js';
// 引入 Select，将 ./CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/select.js';
// 引入 WelcomeV2，将 ./LogoV2/WelcomeV2.js 中已经封装好的能力接到本文件流程里。
import { WelcomeV2 } from './LogoV2/WelcomeV2.js';
// 引入 PressEnterToContinue，将 ./PressEnterToContinue.js 中已经封装好的能力接到本文件流程里。
import { PressEnterToContinue } from './PressEnterToContinue.js';
// 引入 ThemePicker，将 ./ThemePicker.js 中已经封装好的能力接到本文件流程里。
import { ThemePicker } from './ThemePicker.js';
// 引入 OrderedList，将 ./ui/OrderedList.js 中已经封装好的能力接到本文件流程里。
import { OrderedList } from './ui/OrderedList.js';
// StepId 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type StepId = 'preflight' | 'theme' | 'oauth' | 'api-key' | 'security' | 'terminal-setup';
// OnboardingStep 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface OnboardingStep {
  id: StepId;
  component: React.ReactNode;
}
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onDone(): void;
};
// Onboarding 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Onboarding({
  onDone
}: Props): React.ReactNode {
  // currentStepIndex 索引 由 React state 持有，setCurrentStepIndex 会在用户操作或异步结果返回时触发刷新。
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // skipOAuth 由 React state 持有，setSkipOAuth 会在用户操作或异步结果返回时触发刷新。
  const [skipOAuth, setSkipOAuth] = useState(false);
  // 这个回调绑定到 const [oauthEnabled] = useState(() => isAnthropicAuthEnabled());，负责终端渲染在该局部场景下的响应。
  const [oauthEnabled] = useState(() => isAnthropicAuthEnabled());
  // 从 `useTheme()` 按位置拆出 theme、setTheme，让终端 UI 组件 Onboarding分别处理这些返回值。
  const [theme, setTheme] = useTheme();
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_began_setup', {
      oauthEnabled
    });
  }, [oauthEnabled]);
  // goToNextStep 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function goToNextStep() {
    // 满足 `currentStepIndex < steps.length - 1` 时，终端渲染执行该分支。
    if (currentStepIndex < steps.length - 1) {
      // nextIndex 索引保存`currentStepIndex + 1`，供终端 UI Onboarding后续判断或输出使用。
      const nextIndex = currentStepIndex + 1;
      // setCurrentStepIndex 写入新的状态值，使终端渲染后续读取保持一致。
      setCurrentStepIndex(nextIndex);
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_onboarding_step', {
        oauthEnabled,
        stepId: steps[nextIndex]?.id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
    } else {
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    }
  }
  // handleThemeSelection 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleThemeSelection(newTheme: ThemeSetting) {
    // setTheme 写入新的状态值，使终端渲染后续读取保持一致。
    setTheme(newTheme);
    // 调用 goToNextStep，触发终端渲染此处需要的副作用。
    goToNextStep();
  }
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings();

  // Define all onboarding steps
  // themeStep 命名 `<Box marginX={1}>`，让后续代码直接表达这个值的用途。
  const themeStep = <Box marginX={1}>
      <ThemePicker onThemeSelect={handleThemeSelection} showIntroText={true} helpText="To change this later, run /theme" hideEscToCancel={true} skipExitHandling={true} // Skip exit handling as Onboarding already handles it
    />
    </Box>;
  // securityStep保存`<Box flexDirection="column" gap={1} paddingLeft={1}>`，供后续判断或组装使用。
  const securityStep = <Box flexDirection="column" gap={1} paddingLeft={1}>
      <Text bold>Security notes:</Text>
      <Box flexDirection="column" width={70}>
        {/**
         * OrderedList misnumbers items when rendering conditionally,
         * so put all items in the if/else
         */}
        <OrderedList>
          <OrderedList.Item>
            <Text>Claude can make mistakes</Text>
            <Text dimColor wrap="wrap">
              You should always review Claude&apos;s responses, especially when
              <Newline />
              running code.
              <Newline />
            </Text>
          </OrderedList.Item>
          <OrderedList.Item>
            <Text>
              Due to prompt injection risks, only use it with code you trust
            </Text>
            <Text dimColor wrap="wrap">
              For more details see:
              <Newline />
              <Link url="https://code.claude.com/docs/en/security" />
            </Text>
          </OrderedList.Item>
        </OrderedList>
      </Box>
      <PressEnterToContinue />
    </Box>;
  // preflightStep保存`<PreflightStep onSuccess={goToNextStep} />`，供后续判断或组装使用。
  const preflightStep = <PreflightStep onSuccess={goToNextStep} />;
  // Create the steps array - determine which steps to include based on reAuth and oauthEnabled
  // apiKeyNeedingApproval保存`useMemo`，供终端渲染后续处理使用。
  const apiKeyNeedingApproval = useMemo(() => {
    // Add API key step if needed
    // On homespace, ANTHROPIC_API_KEY is preserved in process.env for child
    // processes but ignored by Claude Code itself (see auth.ts).
    // 只有 `!process.env.ANTHROPIC_API_KEY || isRunningOnHomespace()` 满足时，终端渲染才执行该分支。
    if (!process.env.ANTHROPIC_API_KEY || isRunningOnHomespace()) {
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return '';
    }
    // customApiKeyTruncated保存`normalizeApiKeyForConfig`，供终端渲染后续处理使用。
    const customApiKeyTruncated = normalizeApiKeyForConfig(process.env.ANTHROPIC_API_KEY);
    // 当 `getCustomApiKeyStatus(customApiKeyTruncated)` 匹配 `'new'` 时，终端渲染执行对应分支。
    if (getCustomApiKeyStatus(customApiKeyTruncated) === 'new') {
      // 返回 `customApiKeyTruncated`，作为终端渲染这次计算的结果。
      return customApiKeyTruncated;
    }
  }, []);
  // handleApiKeyDone 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleApiKeyDone(approved: boolean) {
    // 满足 `approved` 时，终端渲染执行该分支。
    if (approved) {
      // setSkipOAuth 写入新的状态值，使终端渲染后续读取保持一致。
      setSkipOAuth(true);
    }
    // 调用 goToNextStep，触发终端渲染此处需要的副作用。
    goToNextStep();
  }
  // steps 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const steps: OnboardingStep[] = [];
  // 满足 `oauthEnabled` 时，终端渲染执行该分支。
  if (oauthEnabled) {
    // steps 集合追加新条目，保持收集顺序与输入顺序一致。
    steps.push({
      id: 'preflight',
      component: preflightStep
    });
  }
  // steps 集合追加新条目，保持收集顺序与输入顺序一致。
  steps.push({
    id: 'theme',
    component: themeStep
  });
  // 满足 `apiKeyNeedingApproval` 时，终端渲染执行该分支。
  if (apiKeyNeedingApproval) {
    // steps 集合追加新条目，保持收集顺序与输入顺序一致。
    steps.push({
      id: 'api-key',
      component: <ApproveApiKey customApiKeyTruncated={apiKeyNeedingApproval} onDone={handleApiKeyDone} />
    });
  }
  // 满足 `oauthEnabled` 时，终端渲染执行该分支。
  if (oauthEnabled) {
    // steps 集合追加新条目，保持收集顺序与输入顺序一致。
    steps.push({
      id: 'oauth',
      component: <SkippableStep skip={skipOAuth} onSkip={goToNextStep}>
          <ConsoleOAuthFlow onDone={goToNextStep} />
        </SkippableStep>
    });
  }
  // steps 集合追加新条目，保持收集顺序与输入顺序一致。
  steps.push({
    id: 'security',
    component: securityStep
  });
  // 满足 `shouldOfferTerminalSetup()` 时，终端渲染执行该分支。
  if (shouldOfferTerminalSetup()) {
    // steps 集合追加新条目，保持收集顺序与输入顺序一致。
    steps.push({
      id: 'terminal-setup',
      // 终端 UI 组件 Onboarding在这里处理 `component: <Box flexDirection="column" gap={1} paddingLeft={1}>`，完成这一小步状态转换。
      component: <Box flexDirection="column" gap={1} paddingLeft={1}>
          <Text bold>Use Claude Code&apos;s terminal setup?</Text>
          <Box flexDirection="column" width={70} gap={1}>
            <Text>
              For the optimal coding experience, enable the recommended settings
              <Newline />
              for your terminal:{' '}
              {env.terminal === 'Apple_Terminal' ? 'Option+Enter for newlines and visual bell' : 'Shift+Enter for newlines'}
            </Text>
            <Select options={[{
            label: 'Yes, use recommended settings',
            value: 'install'
          }, {
            label: 'No, maybe later with /terminal-setup',
            value: 'no'
          // 这个回调绑定到 }]} onChange={value => {，负责终端渲染在该局部场景下的响应。
          }]} onChange={value => {
            // 当 `value` 匹配 `'install'` 时，终端渲染执行对应分支。
            if (value === 'install') {
              // Errors already logged in setupTerminal, just swallow and proceed
              // 这个回调绑定到 void setupTerminal(theme).catch(() => {}).finally(goToNextStep);，负责终端渲染在该局部场景下的响应。
              void setupTerminal(theme).catch(() => {}).finally(goToNextStep);
            } else {
              // 调用 goToNextStep，触发终端渲染此处需要的副作用。
              goToNextStep();
            }
          // 这个回调绑定到 }} onCancel={() => goToNextStep()} />，负责终端渲染在该局部场景下的响应。
          }} onCancel={() => goToNextStep()} />
            <Text dimColor>
              {exitState.pending ? <>Press {exitState.keyName} again to exit</> : <>Enter to confirm · Esc to skip</>}
            </Text>
          </Box>
        </Box>
    });
  }
  // currentStep保存`steps[currentStepIndex]`，供终端 UI Onboarding后续判断或输出使用。
  const currentStep = steps[currentStepIndex];

  // Handle Enter on security step and Escape on terminal-setup step
  // Dependencies match what goToNextStep uses internally
  // handleSecurityContinue保存`useCallback`，供终端渲染后续处理使用。
  const handleSecurityContinue = useCallback(() => {
    // 满足 `currentStepIndex === steps.length - 1` 时，终端渲染执行该分支。
    if (currentStepIndex === steps.length - 1) {
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    } else {
      // 调用 goToNextStep，触发终端渲染此处需要的副作用。
      goToNextStep();
    }
  }, [currentStepIndex, steps.length, oauthEnabled, onDone]);
  // handleTerminalSetupSkip保存`useCallback`，供终端渲染后续处理使用。
  const handleTerminalSetupSkip = useCallback(() => {
    // 调用 goToNextStep，触发终端渲染此处需要的副作用。
    goToNextStep();
  }, [currentStepIndex, steps.length, oauthEnabled, onDone]);
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings({
    'confirm:yes': handleSecurityContinue
  }, {
    context: 'Confirmation',
    isActive: currentStep?.id === 'security'
  });
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings({
    'confirm:no': handleTerminalSetupSkip
  }, {
    context: 'Confirmation',
    isActive: currentStep?.id === 'terminal-setup'
  });
  // 返回 `<Box flexDirection="column">`，作为终端渲染这次计算的结果。
  return <Box flexDirection="column">
      <WelcomeV2 />
      <Box flexDirection="column" marginTop={1}>
        {currentStep?.component}
        {exitState.pending && <Box padding={1}>
            <Text dimColor>Press {exitState.keyName} again to exit</Text>
          </Box>}
      </Box>
    </Box>;
}
// SkippableStep 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SkippableStep(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    skip,
    onSkip,
    children
  } = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[skip, onSkip]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onSkip || $[1] !== skip) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 满足 `skip` 时，终端渲染执行该分支。
      if (skip) {
        // 调用 onSkip，触发终端渲染此处需要的副作用。
        onSkip();
      }
    };
    // t2 暂存 `[skip, onSkip]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [skip, onSkip];
    // $[0] 缓存 `onSkip`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onSkip;
    // $[1] 缓存 `skip`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = skip;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t1, t2);
  // 满足 `skip` 时，终端渲染执行该分支。
  if (skip) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 返回 `children`，作为终端渲染这次计算的结果。
  return children;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlTWVtbyIsInVzZVN0YXRlIiwiQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyIsImxvZ0V2ZW50Iiwic2V0dXBUZXJtaW5hbCIsInNob3VsZE9mZmVyVGVybWluYWxTZXR1cCIsInVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyIsIkJveCIsIkxpbmsiLCJOZXdsaW5lIiwiVGV4dCIsInVzZVRoZW1lIiwidXNlS2V5YmluZGluZ3MiLCJpc0FudGhyb3BpY0F1dGhFbmFibGVkIiwibm9ybWFsaXplQXBpS2V5Rm9yQ29uZmlnIiwiZ2V0Q3VzdG9tQXBpS2V5U3RhdHVzIiwiZW52IiwiaXNSdW5uaW5nT25Ib21lc3BhY2UiLCJQcmVmbGlnaHRTdGVwIiwiVGhlbWVTZXR0aW5nIiwiQXBwcm92ZUFwaUtleSIsIkNvbnNvbGVPQXV0aEZsb3ciLCJTZWxlY3QiLCJXZWxjb21lVjIiLCJQcmVzc0VudGVyVG9Db250aW51ZSIsIlRoZW1lUGlja2VyIiwiT3JkZXJlZExpc3QiLCJTdGVwSWQiLCJPbmJvYXJkaW5nU3RlcCIsImlkIiwiY29tcG9uZW50IiwiUmVhY3ROb2RlIiwiUHJvcHMiLCJvbkRvbmUiLCJPbmJvYXJkaW5nIiwiY3VycmVudFN0ZXBJbmRleCIsInNldEN1cnJlbnRTdGVwSW5kZXgiLCJza2lwT0F1dGgiLCJzZXRTa2lwT0F1dGgiLCJvYXV0aEVuYWJsZWQiLCJ0aGVtZSIsInNldFRoZW1lIiwiZ29Ub05leHRTdGVwIiwic3RlcHMiLCJsZW5ndGgiLCJuZXh0SW5kZXgiLCJzdGVwSWQiLCJoYW5kbGVUaGVtZVNlbGVjdGlvbiIsIm5ld1RoZW1lIiwiZXhpdFN0YXRlIiwidGhlbWVTdGVwIiwic2VjdXJpdHlTdGVwIiwicHJlZmxpZ2h0U3RlcCIsImFwaUtleU5lZWRpbmdBcHByb3ZhbCIsInByb2Nlc3MiLCJBTlRIUk9QSUNfQVBJX0tFWSIsImN1c3RvbUFwaUtleVRydW5jYXRlZCIsImhhbmRsZUFwaUtleURvbmUiLCJhcHByb3ZlZCIsInB1c2giLCJ0ZXJtaW5hbCIsImxhYmVsIiwidmFsdWUiLCJjYXRjaCIsImZpbmFsbHkiLCJwZW5kaW5nIiwia2V5TmFtZSIsImN1cnJlbnRTdGVwIiwiaGFuZGxlU2VjdXJpdHlDb250aW51ZSIsImhhbmRsZVRlcm1pbmFsU2V0dXBTa2lwIiwiY29udGV4dCIsImlzQWN0aXZlIiwiU2tpcHBhYmxlU3RlcCIsInQwIiwiJCIsIl9jIiwic2tpcCIsIm9uU2tpcCIsImNoaWxkcmVuIiwidDEiLCJ0MiJdLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7XG4gIHNldHVwVGVybWluYWwsXG4gIHNob3VsZE9mZmVyVGVybWluYWxTZXR1cCxcbn0gZnJvbSAnLi4vY29tbWFuZHMvdGVybWluYWxTZXR1cC90ZXJtaW5hbFNldHVwLmpzJ1xuaW1wb3J0IHsgdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzIH0gZnJvbSAnLi4vaG9va3MvdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzLmpzJ1xuaW1wb3J0IHsgQm94LCBMaW5rLCBOZXdsaW5lLCBUZXh0LCB1c2VUaGVtZSB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmdzIH0gZnJvbSAnLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IGlzQW50aHJvcGljQXV0aEVuYWJsZWQgfSBmcm9tICcuLi91dGlscy9hdXRoLmpzJ1xuaW1wb3J0IHsgbm9ybWFsaXplQXBpS2V5Rm9yQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMvYXV0aFBvcnRhYmxlLmpzJ1xuaW1wb3J0IHsgZ2V0Q3VzdG9tQXBpS2V5U3RhdHVzIH0gZnJvbSAnLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHsgZW52IH0gZnJvbSAnLi4vdXRpbHMvZW52LmpzJ1xuaW1wb3J0IHsgaXNSdW5uaW5nT25Ib21lc3BhY2UgfSBmcm9tICcuLi91dGlscy9lbnZVdGlscy5qcydcbmltcG9ydCB7IFByZWZsaWdodFN0ZXAgfSBmcm9tICcuLi91dGlscy9wcmVmbGlnaHRDaGVja3MuanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lU2V0dGluZyB9IGZyb20gJy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHsgQXBwcm92ZUFwaUtleSB9IGZyb20gJy4vQXBwcm92ZUFwaUtleS5qcydcbmltcG9ydCB7IENvbnNvbGVPQXV0aEZsb3cgfSBmcm9tICcuL0NvbnNvbGVPQXV0aEZsb3cuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBXZWxjb21lVjIgfSBmcm9tICcuL0xvZ29WMi9XZWxjb21lVjIuanMnXG5pbXBvcnQgeyBQcmVzc0VudGVyVG9Db250aW51ZSB9IGZyb20gJy4vUHJlc3NFbnRlclRvQ29udGludWUuanMnXG5pbXBvcnQgeyBUaGVtZVBpY2tlciB9IGZyb20gJy4vVGhlbWVQaWNrZXIuanMnXG5pbXBvcnQgeyBPcmRlcmVkTGlzdCB9IGZyb20gJy4vdWkvT3JkZXJlZExpc3QuanMnXG5cbnR5cGUgU3RlcElkID1cbiAgfCAncHJlZmxpZ2h0J1xuICB8ICd0aGVtZSdcbiAgfCAnb2F1dGgnXG4gIHwgJ2FwaS1rZXknXG4gIHwgJ3NlY3VyaXR5J1xuICB8ICd0ZXJtaW5hbC1zZXR1cCdcblxuaW50ZXJmYWNlIE9uYm9hcmRpbmdTdGVwIHtcbiAgaWQ6IFN0ZXBJZFxuICBjb21wb25lbnQ6IFJlYWN0LlJlYWN0Tm9kZVxufVxuXG50eXBlIFByb3BzID0ge1xuICBvbkRvbmUoKTogdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gT25ib2FyZGluZyh7IG9uRG9uZSB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtjdXJyZW50U3RlcEluZGV4LCBzZXRDdXJyZW50U3RlcEluZGV4XSA9IHVzZVN0YXRlKDApXG4gIGNvbnN0IFtza2lwT0F1dGgsIHNldFNraXBPQXV0aF0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW29hdXRoRW5hYmxlZF0gPSB1c2VTdGF0ZSgoKSA9PiBpc0FudGhyb3BpY0F1dGhFbmFibGVkKCkpXG4gIGNvbnN0IFt0aGVtZSwgc2V0VGhlbWVdID0gdXNlVGhlbWUoKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbG9nRXZlbnQoJ3Rlbmd1X2JlZ2FuX3NldHVwJywge1xuICAgICAgb2F1dGhFbmFibGVkLFxuICAgIH0pXG4gIH0sIFtvYXV0aEVuYWJsZWRdKVxuXG4gIGZ1bmN0aW9uIGdvVG9OZXh0U3RlcCgpIHtcbiAgICBpZiAoY3VycmVudFN0ZXBJbmRleCA8IHN0ZXBzLmxlbmd0aCAtIDEpIHtcbiAgICAgIGNvbnN0IG5leHRJbmRleCA9IGN1cnJlbnRTdGVwSW5kZXggKyAxXG4gICAgICBzZXRDdXJyZW50U3RlcEluZGV4KG5leHRJbmRleClcblxuICAgICAgbG9nRXZlbnQoJ3Rlbmd1X29uYm9hcmRpbmdfc3RlcCcsIHtcbiAgICAgICAgb2F1dGhFbmFibGVkLFxuICAgICAgICBzdGVwSWQ6IHN0ZXBzW25leHRJbmRleF1cbiAgICAgICAgICA/LmlkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBvbkRvbmUoKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVRoZW1lU2VsZWN0aW9uKG5ld1RoZW1lOiBUaGVtZVNldHRpbmcpIHtcbiAgICBzZXRUaGVtZShuZXdUaGVtZSlcbiAgICBnb1RvTmV4dFN0ZXAoKVxuICB9XG5cbiAgY29uc3QgZXhpdFN0YXRlID0gdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzKClcblxuICAvLyBEZWZpbmUgYWxsIG9uYm9hcmRpbmcgc3RlcHNcbiAgY29uc3QgdGhlbWVTdGVwID0gKFxuICAgIDxCb3ggbWFyZ2luWD17MX0+XG4gICAgICA8VGhlbWVQaWNrZXJcbiAgICAgICAgb25UaGVtZVNlbGVjdD17aGFuZGxlVGhlbWVTZWxlY3Rpb259XG4gICAgICAgIHNob3dJbnRyb1RleHQ9e3RydWV9XG4gICAgICAgIGhlbHBUZXh0PVwiVG8gY2hhbmdlIHRoaXMgbGF0ZXIsIHJ1biAvdGhlbWVcIlxuICAgICAgICBoaWRlRXNjVG9DYW5jZWw9e3RydWV9XG4gICAgICAgIHNraXBFeGl0SGFuZGxpbmc9e3RydWV9IC8vIFNraXAgZXhpdCBoYW5kbGluZyBhcyBPbmJvYXJkaW5nIGFscmVhZHkgaGFuZGxlcyBpdFxuICAgICAgLz5cbiAgICA8L0JveD5cbiAgKVxuXG4gIGNvbnN0IHNlY3VyaXR5U3RlcCA9IChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9IHBhZGRpbmdMZWZ0PXsxfT5cbiAgICAgIDxUZXh0IGJvbGQ+U2VjdXJpdHkgbm90ZXM6PC9UZXh0PlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgd2lkdGg9ezcwfT5cbiAgICAgICAgey8qKlxuICAgICAgICAgKiBPcmRlcmVkTGlzdCBtaXNudW1iZXJzIGl0ZW1zIHdoZW4gcmVuZGVyaW5nIGNvbmRpdGlvbmFsbHksXG4gICAgICAgICAqIHNvIHB1dCBhbGwgaXRlbXMgaW4gdGhlIGlmL2Vsc2VcbiAgICAgICAgICovfVxuICAgICAgICA8T3JkZXJlZExpc3Q+XG4gICAgICAgICAgPE9yZGVyZWRMaXN0Lkl0ZW0+XG4gICAgICAgICAgICA8VGV4dD5DbGF1ZGUgY2FuIG1ha2UgbWlzdGFrZXM8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvciB3cmFwPVwid3JhcFwiPlxuICAgICAgICAgICAgICBZb3Ugc2hvdWxkIGFsd2F5cyByZXZpZXcgQ2xhdWRlJmFwb3M7cyByZXNwb25zZXMsIGVzcGVjaWFsbHkgd2hlblxuICAgICAgICAgICAgICA8TmV3bGluZSAvPlxuICAgICAgICAgICAgICBydW5uaW5nIGNvZGUuXG4gICAgICAgICAgICAgIDxOZXdsaW5lIC8+XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9PcmRlcmVkTGlzdC5JdGVtPlxuICAgICAgICAgIDxPcmRlcmVkTGlzdC5JdGVtPlxuICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgIER1ZSB0byBwcm9tcHQgaW5qZWN0aW9uIHJpc2tzLCBvbmx5IHVzZSBpdCB3aXRoIGNvZGUgeW91IHRydXN0XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvciB3cmFwPVwid3JhcFwiPlxuICAgICAgICAgICAgICBGb3IgbW9yZSBkZXRhaWxzIHNlZTpcbiAgICAgICAgICAgICAgPE5ld2xpbmUgLz5cbiAgICAgICAgICAgICAgPExpbmsgdXJsPVwiaHR0cHM6Ly9jb2RlLmNsYXVkZS5jb20vZG9jcy9lbi9zZWN1cml0eVwiIC8+XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9PcmRlcmVkTGlzdC5JdGVtPlxuICAgICAgICA8L09yZGVyZWRMaXN0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8UHJlc3NFbnRlclRvQ29udGludWUgLz5cbiAgICA8L0JveD5cbiAgKVxuXG4gIGNvbnN0IHByZWZsaWdodFN0ZXAgPSA8UHJlZmxpZ2h0U3RlcCBvblN1Y2Nlc3M9e2dvVG9OZXh0U3RlcH0gLz5cbiAgLy8gQ3JlYXRlIHRoZSBzdGVwcyBhcnJheSAtIGRldGVybWluZSB3aGljaCBzdGVwcyB0byBpbmNsdWRlIGJhc2VkIG9uIHJlQXV0aCBhbmQgb2F1dGhFbmFibGVkXG4gIGNvbnN0IGFwaUtleU5lZWRpbmdBcHByb3ZhbCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIEFkZCBBUEkga2V5IHN0ZXAgaWYgbmVlZGVkXG4gICAgLy8gT24gaG9tZXNwYWNlLCBBTlRIUk9QSUNfQVBJX0tFWSBpcyBwcmVzZXJ2ZWQgaW4gcHJvY2Vzcy5lbnYgZm9yIGNoaWxkXG4gICAgLy8gcHJvY2Vzc2VzIGJ1dCBpZ25vcmVkIGJ5IENsYXVkZSBDb2RlIGl0c2VsZiAoc2VlIGF1dGgudHMpLlxuICAgIGlmICghcHJvY2Vzcy5lbnYuQU5USFJPUElDX0FQSV9LRVkgfHwgaXNSdW5uaW5nT25Ib21lc3BhY2UoKSkge1xuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICAgIGNvbnN0IGN1c3RvbUFwaUtleVRydW5jYXRlZCA9IG5vcm1hbGl6ZUFwaUtleUZvckNvbmZpZyhcbiAgICAgIHByb2Nlc3MuZW52LkFOVEhST1BJQ19BUElfS0VZLFxuICAgIClcbiAgICBpZiAoZ2V0Q3VzdG9tQXBpS2V5U3RhdHVzKGN1c3RvbUFwaUtleVRydW5jYXRlZCkgPT09ICduZXcnKSB7XG4gICAgICByZXR1cm4gY3VzdG9tQXBpS2V5VHJ1bmNhdGVkXG4gICAgfVxuICB9LCBbXSlcblxuICBmdW5jdGlvbiBoYW5kbGVBcGlLZXlEb25lKGFwcHJvdmVkOiBib29sZWFuKSB7XG4gICAgaWYgKGFwcHJvdmVkKSB7XG4gICAgICBzZXRTa2lwT0F1dGgodHJ1ZSlcbiAgICB9XG4gICAgZ29Ub05leHRTdGVwKClcbiAgfVxuXG4gIGNvbnN0IHN0ZXBzOiBPbmJvYXJkaW5nU3RlcFtdID0gW11cbiAgaWYgKG9hdXRoRW5hYmxlZCkge1xuICAgIHN0ZXBzLnB1c2goeyBpZDogJ3ByZWZsaWdodCcsIGNvbXBvbmVudDogcHJlZmxpZ2h0U3RlcCB9KVxuICB9XG4gIHN0ZXBzLnB1c2goeyBpZDogJ3RoZW1lJywgY29tcG9uZW50OiB0aGVtZVN0ZXAgfSlcblxuICBpZiAoYXBpS2V5TmVlZGluZ0FwcHJvdmFsKSB7XG4gICAgc3RlcHMucHVzaCh7XG4gICAgICBpZDogJ2FwaS1rZXknLFxuICAgICAgY29tcG9uZW50OiAoXG4gICAgICAgIDxBcHByb3ZlQXBpS2V5XG4gICAgICAgICAgY3VzdG9tQXBpS2V5VHJ1bmNhdGVkPXthcGlLZXlOZWVkaW5nQXBwcm92YWx9XG4gICAgICAgICAgb25Eb25lPXtoYW5kbGVBcGlLZXlEb25lfVxuICAgICAgICAvPlxuICAgICAgKSxcbiAgICB9KVxuICB9XG5cbiAgaWYgKG9hdXRoRW5hYmxlZCkge1xuICAgIHN0ZXBzLnB1c2goe1xuICAgICAgaWQ6ICdvYXV0aCcsXG4gICAgICBjb21wb25lbnQ6IChcbiAgICAgICAgPFNraXBwYWJsZVN0ZXAgc2tpcD17c2tpcE9BdXRofSBvblNraXA9e2dvVG9OZXh0U3RlcH0+XG4gICAgICAgICAgPENvbnNvbGVPQXV0aEZsb3cgb25Eb25lPXtnb1RvTmV4dFN0ZXB9IC8+XG4gICAgICAgIDwvU2tpcHBhYmxlU3RlcD5cbiAgICAgICksXG4gICAgfSlcbiAgfVxuXG4gIHN0ZXBzLnB1c2goeyBpZDogJ3NlY3VyaXR5JywgY29tcG9uZW50OiBzZWN1cml0eVN0ZXAgfSlcblxuICBpZiAoc2hvdWxkT2ZmZXJUZXJtaW5hbFNldHVwKCkpIHtcbiAgICBzdGVwcy5wdXNoKHtcbiAgICAgIGlkOiAndGVybWluYWwtc2V0dXAnLFxuICAgICAgY29tcG9uZW50OiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0gcGFkZGluZ0xlZnQ9ezF9PlxuICAgICAgICAgIDxUZXh0IGJvbGQ+VXNlIENsYXVkZSBDb2RlJmFwb3M7cyB0ZXJtaW5hbCBzZXR1cD88L1RleHQ+XG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgd2lkdGg9ezcwfSBnYXA9ezF9PlxuICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgIEZvciB0aGUgb3B0aW1hbCBjb2RpbmcgZXhwZXJpZW5jZSwgZW5hYmxlIHRoZSByZWNvbW1lbmRlZCBzZXR0aW5nc1xuICAgICAgICAgICAgICA8TmV3bGluZSAvPlxuICAgICAgICAgICAgICBmb3IgeW91ciB0ZXJtaW5hbDp7JyAnfVxuICAgICAgICAgICAgICB7ZW52LnRlcm1pbmFsID09PSAnQXBwbGVfVGVybWluYWwnXG4gICAgICAgICAgICAgICAgPyAnT3B0aW9uK0VudGVyIGZvciBuZXdsaW5lcyBhbmQgdmlzdWFsIGJlbGwnXG4gICAgICAgICAgICAgICAgOiAnU2hpZnQrRW50ZXIgZm9yIG5ld2xpbmVzJ31cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDxTZWxlY3RcbiAgICAgICAgICAgICAgb3B0aW9ucz17W1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnWWVzLCB1c2UgcmVjb21tZW5kZWQgc2V0dGluZ3MnLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6ICdpbnN0YWxsJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTm8sIG1heWJlIGxhdGVyIHdpdGggL3Rlcm1pbmFsLXNldHVwJyxcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiAnbm8nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXt2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnaW5zdGFsbCcpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEVycm9ycyBhbHJlYWR5IGxvZ2dlZCBpbiBzZXR1cFRlcm1pbmFsLCBqdXN0IHN3YWxsb3cgYW5kIHByb2NlZWRcbiAgICAgICAgICAgICAgICAgIHZvaWQgc2V0dXBUZXJtaW5hbCh0aGVtZSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KVxuICAgICAgICAgICAgICAgICAgICAuZmluYWxseShnb1RvTmV4dFN0ZXApXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGdvVG9OZXh0U3RlcCgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gZ29Ub05leHRTdGVwKCl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIHtleGl0U3RhdGUucGVuZGluZyA/IChcbiAgICAgICAgICAgICAgICA8PlByZXNzIHtleGl0U3RhdGUua2V5TmFtZX0gYWdhaW4gdG8gZXhpdDwvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+RW50ZXIgdG8gY29uZmlybSDCtyBFc2MgdG8gc2tpcDwvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L0JveD5cbiAgICAgICksXG4gICAgfSlcbiAgfVxuXG4gIGNvbnN0IGN1cnJlbnRTdGVwID0gc3RlcHNbY3VycmVudFN0ZXBJbmRleF1cblxuICAvLyBIYW5kbGUgRW50ZXIgb24gc2VjdXJpdHkgc3RlcCBhbmQgRXNjYXBlIG9uIHRlcm1pbmFsLXNldHVwIHN0ZXBcbiAgLy8gRGVwZW5kZW5jaWVzIG1hdGNoIHdoYXQgZ29Ub05leHRTdGVwIHVzZXMgaW50ZXJuYWxseVxuICBjb25zdCBoYW5kbGVTZWN1cml0eUNvbnRpbnVlID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChjdXJyZW50U3RlcEluZGV4ID09PSBzdGVwcy5sZW5ndGggLSAxKSB7XG4gICAgICBvbkRvbmUoKVxuICAgIH0gZWxzZSB7XG4gICAgICBnb1RvTmV4dFN0ZXAoKVxuICAgIH1cbiAgfSwgW2N1cnJlbnRTdGVwSW5kZXgsIHN0ZXBzLmxlbmd0aCwgb2F1dGhFbmFibGVkLCBvbkRvbmVdKVxuXG4gIGNvbnN0IGhhbmRsZVRlcm1pbmFsU2V0dXBTa2lwID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGdvVG9OZXh0U3RlcCgpXG4gIH0sIFtjdXJyZW50U3RlcEluZGV4LCBzdGVwcy5sZW5ndGgsIG9hdXRoRW5hYmxlZCwgb25Eb25lXSlcblxuICB1c2VLZXliaW5kaW5ncyhcbiAgICB7XG4gICAgICAnY29uZmlybTp5ZXMnOiBoYW5kbGVTZWN1cml0eUNvbnRpbnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgY29udGV4dDogJ0NvbmZpcm1hdGlvbicsXG4gICAgICBpc0FjdGl2ZTogY3VycmVudFN0ZXA/LmlkID09PSAnc2VjdXJpdHknLFxuICAgIH0sXG4gIClcblxuICB1c2VLZXliaW5kaW5ncyhcbiAgICB7XG4gICAgICAnY29uZmlybTpubyc6IGhhbmRsZVRlcm1pbmFsU2V0dXBTa2lwLFxuICAgIH0sXG4gICAge1xuICAgICAgY29udGV4dDogJ0NvbmZpcm1hdGlvbicsXG4gICAgICBpc0FjdGl2ZTogY3VycmVudFN0ZXA/LmlkID09PSAndGVybWluYWwtc2V0dXAnLFxuICAgIH0sXG4gIClcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPFdlbGNvbWVWMiAvPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgICAge2N1cnJlbnRTdGVwPy5jb21wb25lbnR9XG4gICAgICAgIHtleGl0U3RhdGUucGVuZGluZyAmJiAoXG4gICAgICAgICAgPEJveCBwYWRkaW5nPXsxfT5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlByZXNzIHtleGl0U3RhdGUua2V5TmFtZX0gYWdhaW4gdG8gZXhpdDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTa2lwcGFibGVTdGVwKHtcbiAgc2tpcCxcbiAgb25Ta2lwLFxuICBjaGlsZHJlbixcbn06IHtcbiAgc2tpcDogYm9vbGVhblxuICBvblNraXAoKTogdm9pZFxuICBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlXG59KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoc2tpcCkge1xuICAgICAgb25Ta2lwKClcbiAgICB9XG4gIH0sIFtza2lwLCBvblNraXBdKVxuICBpZiAoc2tpcCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgcmV0dXJuIGNoaWxkcmVuXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUlDLFdBQVcsRUFBRUMsU0FBUyxFQUFFQyxPQUFPLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3hFLFNBQ0UsS0FBS0MsMERBQTBELEVBQy9EQyxRQUFRLFFBQ0gsaUNBQWlDO0FBQ3hDLFNBQ0VDLGFBQWEsRUFDYkMsd0JBQXdCLFFBQ25CLDRDQUE0QztBQUNuRCxTQUFTQyw4QkFBOEIsUUFBUSw0Q0FBNEM7QUFDM0YsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLEVBQUVDLE9BQU8sRUFBRUMsSUFBSSxFQUFFQyxRQUFRLFFBQVEsV0FBVztBQUM5RCxTQUFTQyxjQUFjLFFBQVEsaUNBQWlDO0FBQ2hFLFNBQVNDLHNCQUFzQixRQUFRLGtCQUFrQjtBQUN6RCxTQUFTQyx3QkFBd0IsUUFBUSwwQkFBMEI7QUFDbkUsU0FBU0MscUJBQXFCLFFBQVEsb0JBQW9CO0FBQzFELFNBQVNDLEdBQUcsUUFBUSxpQkFBaUI7QUFDckMsU0FBU0Msb0JBQW9CLFFBQVEsc0JBQXNCO0FBQzNELFNBQVNDLGFBQWEsUUFBUSw2QkFBNkI7QUFDM0QsY0FBY0MsWUFBWSxRQUFRLG1CQUFtQjtBQUNyRCxTQUFTQyxhQUFhLFFBQVEsb0JBQW9CO0FBQ2xELFNBQVNDLGdCQUFnQixRQUFRLHVCQUF1QjtBQUN4RCxTQUFTQyxNQUFNLFFBQVEsMEJBQTBCO0FBQ2pE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QyxRQUFRLEVBQUVKLFdBQVcsRUFBRXRDLEVBQUUsS0FBSztFQUNoQyxDQUNGLENBQUM7RUFFRGpCLGNBQWMsQ0FDWjtJQUNFLFlBQVksRUFBRXlEO0VBQ2hCLENBQUMsRUFDRDtJQUNFQyxPQUFPLEVBQUUsY0FBYztJQUN2QkMsUUFBUSxFQUFFSixXQUFXLEVBQUV0QyxFQUFFLEtBQUs7RUFDaEMsQ0FDRixDQUFDO0VBRUQsT0FDRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUTtBQUMvQixNQUFNLENBQUMsU0FBUztBQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9DLFFBQVEsQ0FBQ3NDLFdBQVcsRUFBRXJDLFNBQVM7QUFDL0IsUUFBUSxDQUFDbUIsU0FBUyxDQUFDZ0IsT0FBTyxJQUNoQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDaEIsU0FBUyxDQUFDaUIsT0FBTyxDQUFDLGNBQWMsRUFBRSxJQUFJO0FBQ3hFLFVBQVUsRUFBRSxHQUFHLENBQ047QUFDVCxNQUFNLEVBQUUsR0FBRztBQUNYLElBQUksRUFBRSxHQUFHLENBQUM7QUFFVjtBQUVBLE9BQU8sU0FBQU0sY0FBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUF1QjtJQUFBQyxJQUFBO0lBQUFDLE1BQUE7SUFBQUM7RUFBQSxJQUFBTCxFQVE3QjtFQUFBLElBQUFNLEVBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxRQUFBRyxNQUFBLElBQUFILENBQUEsUUFBQUUsSUFBQTtJQUNXRyxFQUFBLEdBQUFBLENBQUE7TUFDUixJQUFJSCxJQUFJO1FBQ05DLE1BQU0sQ0FBQyxDQUFDO01BQUE7SUFDVCxDQUNGO0lBQUVHLEVBQUEsSUFBQ0osSUFBSSxFQUFFQyxNQUFNLENBQUM7SUFBQUgsQ0FBQSxNQUFBRyxNQUFBO0lBQUFILENBQUEsTUFBQUUsSUFBQTtJQUFBRixDQUFBLE1BQUFLLEVBQUE7SUFBQUwsQ0FBQSxNQUFBTSxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBTCxDQUFBO0lBQUFNLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBSmpCM0UsU0FBUyxDQUFDZ0YsRUFJVCxFQUFFQyxFQUFjLENBQUM7RUFDbEIsSUFBSUosSUFBSTtJQUFBLE9BQ0MsSUFBSTtFQUFBO0VBQ1osT0FDTUUsUUFBUTtBQUFBIiwiaWdub3JlTGlzdCI6W119
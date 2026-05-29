// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios';
// 引入 React、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useState } from 'react';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js';
// 复用 Spinner 终端界面组件，避免在这里重复拼装显示逻辑。
import { Spinner } from '../components/Spinner.js';
// 引入 getOauthConfig，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../constants/oauth.js';
// 引入 useTimeout，将 ../hooks/useTimeout.js 中已经封装好的能力接到本文件流程里。
import { useTimeout } from '../hooks/useTimeout.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 接入 getSSLErrorHint 服务层能力，把外部通信或共享状态交给 ../services/api/errorUtils.js 处理。
import { getSSLErrorHint } from '../services/api/errorUtils.js';
// 引入 getUserAgent，将 ./http.js 中已经封装好的能力接到本文件流程里。
import { getUserAgent } from './http.js';
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js';
// PreflightCheckResult 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface PreflightCheckResult {
  success: boolean;
  error?: string;
  sslHint?: string;
}
// checkEndpoints 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkEndpoints(): Promise<PreflightCheckResult> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // oauthConfig 配置读取`getOauthConfig`，供共享工具后续处理使用。
    const oauthConfig = getOauthConfig();
    // tokenUrl保存`URL`，供共享工具后续处理使用。
    const tokenUrl = new URL(oauthConfig.TOKEN_URL);
    // endpoints 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const endpoints = [`${oauthConfig.BASE_API_URL}/api/hello`, `${tokenUrl.origin}/v1/oauth/hello`];
    // checkEndpoint保存`async`，供共享工具后续处理使用。
    const checkEndpoint = async (url: string): Promise<PreflightCheckResult> => {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 接口响应读取`axios.get`，供共享工具后续处理使用。
        const response = await axios.get(url, {
          headers: {
            'User-Agent': getUserAgent()
          }
        });
        // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
        if (response.status !== 200) {
          // hostname保存`URL`，供共享工具后续处理使用。
          const hostname = new URL(url).hostname;
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            success: false,
            error: `Failed to connect to ${hostname}: Status ${response.status}`
          };
        }
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          success: true
        };
      } catch (error) {
        // hostname保存`URL`，供共享工具后续处理使用。
        const hostname = new URL(url).hostname;
        // sslHint读取`getSSLErrorHint`，供共享工具后续处理使用。
        const sslHint = getSSLErrorHint(error);
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          success: false,
          error: `Failed to connect to ${hostname}: ${error instanceof Error ? (error as ErrnoException).code || error.message : String(error)}`,
          sslHint: sslHint ?? undefined
        };
      }
    };
    // 结果列表保存`Promise.all`，供共享工具后续处理使用。
    const results = await Promise.all(endpoints.map(checkEndpoint));
    // failedResult筛选`results.find`，供共享工具后续处理使用。
    const failedResult = results.find(result => !result.success);
    // 满足 `failedResult` 时，共享工具执行该分支。
    if (failedResult) {
      // Log failure to Statsig
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_preflight_check_failed', {
        isConnectivityError: false,
        hasErrorMessage: !!failedResult.error,
        isSSLError: !!failedResult.sslHint
      });
    }
    // 返回 `failedResult || {`，作为共享工具这次计算的结果。
    return failedResult || {
      success: true
    };
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error as Error);

    // Log to Statsig
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_preflight_check_failed', {
      isConnectivityError: true
    });
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: `Connectivity check error: ${error instanceof Error ? (error as ErrnoException).code || error.message : String(error)}`
    };
  }
}
// PreflightStepProps 描述共享工具需要实现的字段和回调，避免跨模块交互时契约漂移。
interface PreflightStepProps {
  // 这个回调绑定到 onSuccess: () => void;，负责共享工具在该局部场景下的响应。
  onSuccess: () => void;
}
// PreflightStep 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PreflightStep(t0) {
  // $保存`_c`，供共享工具后续处理使用。
  const $ = _c(12);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onSuccess
  } = t0;
  // 结果 由 React state 持有，setResult 会在用户操作或异步结果返回时触发刷新。
  const [result, setResult] = useState(null);
  // isChecking 由 React state 持有，setIsChecking 会在用户操作或异步结果返回时触发刷新。
  const [isChecking, setIsChecking] = useState(true);
  // showSpinner保存`useTimeout`，供共享工具后续处理使用。
  const showSpinner = useTimeout(1000) && isChecking;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // run保存`run`，供共享工具后续处理使用。
      const run = async function run() {
        // checkResult读取`checkEndpoints`，供共享工具后续处理使用。
        const checkResult = await checkEndpoints();
        // setResult 写入新的状态值，使共享工具后续读取保持一致。
        setResult(checkResult);
        // setIsChecking 写入新的状态值，使共享工具后续读取保持一致。
        setIsChecking(false);
      };
      // 调用 run，触发共享工具此处需要的副作用。
      run();
    };
    // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // 调用 useEffect，触发共享工具此处需要的副作用。
  useEffect(t1, t2);
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onSuccess || $[3] !== result) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 满足 `result?.success` 时，共享工具执行该分支。
      if (result?.success) {
        // 调用 onSuccess，触发共享工具此处需要的副作用。
        onSuccess();
      } else {
        // 只有 `result && !result.success` 满足时，共享工具才执行该分支。
        if (result && !result.success) {
          // timer保存`setTimeout`，供共享工具后续处理使用。
          const timer = setTimeout(_temp, 100);
          // 返回 `() => clearTimeout(timer)`，作为共享工具这次计算的结果。
          return () => clearTimeout(timer);
        }
      }
    };
    // t4 暂存 `[result, onSuccess]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [result, onSuccess];
    // $[2] 缓存 `onSuccess`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onSuccess;
    // $[3] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = result;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // 调用 useEffect，触发共享工具此处需要的副作用。
  useEffect(t3, t4);
  // t5 暂存 `isChecking && showSpinner ? <Box paddingLeft={1}><Spinner...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== isChecking || $[7] !== result || $[8] !== showSpinner) {
    // t5 暂存 `isChecking && showSpinner ? <Box paddingLeft={1}><Spinner...` 生成的渲染片段，后续返回路径直接复用。
    t5 = isChecking && showSpinner ? <Box paddingLeft={1}><Spinner /><Text>Checking connectivity...</Text></Box> : !result?.success && !isChecking && <Box flexDirection="column" gap={1}><Text color="error">Unable to connect to Anthropic services</Text><Text color="error">{result?.error}</Text>{result?.sslHint ? <Box flexDirection="column" gap={1}><Text>{result.sslHint}</Text><Text color="suggestion">See https://code.claude.com/docs/en/network-config</Text></Box> : <Box flexDirection="column" gap={1}><Text>Please check your internet connection and network settings.</Text><Text>Note: Claude Code might not be available in your country. Check supported countries at{" "}<Text color="suggestion">https://anthropic.com/supported-countries</Text></Text></Box>}</Box>;
    // $[6] 缓存 `isChecking`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = isChecking;
    // $[7] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = result;
    // $[8] 缓存 `showSpinner`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = showSpinner;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // t6 暂存 `<Box flexDirection="column" gap={1} paddingLeft={1}>{t5}<...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t5) {
    // t6 暂存 `<Box flexDirection="column" gap={1} paddingLeft={1}>{t5}<...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" gap={1} paddingLeft={1}>{t5}</Box>;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // 返回 `t6`，作为共享工具这次计算的结果。
  return t6;
}
// _temp 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 返回 `process.exit(1)`，作为共享工具这次计算的结果。
  return process.exit(1);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJheGlvcyIsIlJlYWN0IiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJsb2dFdmVudCIsIlNwaW5uZXIiLCJnZXRPYXV0aENvbmZpZyIsInVzZVRpbWVvdXQiLCJCb3giLCJUZXh0IiwiZ2V0U1NMRXJyb3JIaW50IiwiZ2V0VXNlckFnZW50IiwibG9nRXJyb3IiLCJQcmVmbGlnaHRDaGVja1Jlc3VsdCIsInN1Y2Nlc3MiLCJlcnJvciIsInNzbEhpbnQiLCJjaGVja0VuZHBvaW50cyIsIlByb21pc2UiLCJvYXV0aENvbmZpZyIsInRva2VuVXJsIiwiVVJMIiwiVE9LRU5fVVJMIiwiZW5kcG9pbnRzIiwiQkFTRV9BUElfVVJMIiwib3JpZ2luIiwiY2hlY2tFbmRwb2ludCIsInVybCIsInJlc3BvbnNlIiwiZ2V0IiwiaGVhZGVycyIsInN0YXR1cyIsImhvc3RuYW1lIiwiRXJyb3IiLCJFcnJub0V4Y2VwdGlvbiIsImNvZGUiLCJtZXNzYWdlIiwiU3RyaW5nIiwidW5kZWZpbmVkIiwicmVzdWx0cyIsImFsbCIsIm1hcCIsImZhaWxlZFJlc3VsdCIsImZpbmQiLCJyZXN1bHQiLCJpc0Nvbm5lY3Rpdml0eUVycm9yIiwiaGFzRXJyb3JNZXNzYWdlIiwiaXNTU0xFcnJvciIsIlByZWZsaWdodFN0ZXBQcm9wcyIsIm9uU3VjY2VzcyIsIlByZWZsaWdodFN0ZXAiLCJ0MCIsIiQiLCJfYyIsInNldFJlc3VsdCIsImlzQ2hlY2tpbmciLCJzZXRJc0NoZWNraW5nIiwic2hvd1NwaW5uZXIiLCJ0MSIsInQyIiwiU3ltYm9sIiwiZm9yIiwicnVuIiwiY2hlY2tSZXN1bHQiLCJ0MyIsInQ0IiwidGltZXIiLCJzZXRUaW1lb3V0IiwiX3RlbXAiLCJjbGVhclRpbWVvdXQiLCJ0NSIsInQ2IiwicHJvY2VzcyIsImV4aXQiXSwic291cmNlcyI6WyJwcmVmbGlnaHRDaGVja3MudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBheGlvcyBmcm9tICdheGlvcydcbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBsb2dFdmVudCB9IGZyb20gJ3NyYy9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQgeyBTcGlubmVyIH0gZnJvbSAnLi4vY29tcG9uZW50cy9TcGlubmVyLmpzJ1xuaW1wb3J0IHsgZ2V0T2F1dGhDb25maWcgfSBmcm9tICcuLi9jb25zdGFudHMvb2F1dGguanMnXG5pbXBvcnQgeyB1c2VUaW1lb3V0IH0gZnJvbSAnLi4vaG9va3MvdXNlVGltZW91dC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGdldFNTTEVycm9ySGludCB9IGZyb20gJy4uL3NlcnZpY2VzL2FwaS9lcnJvclV0aWxzLmpzJ1xuaW1wb3J0IHsgZ2V0VXNlckFnZW50IH0gZnJvbSAnLi9odHRwLmpzJ1xuaW1wb3J0IHsgbG9nRXJyb3IgfSBmcm9tICcuL2xvZy5qcydcblxuZXhwb3J0IGludGVyZmFjZSBQcmVmbGlnaHRDaGVja1Jlc3VsdCB7XG4gIHN1Y2Nlc3M6IGJvb2xlYW5cbiAgZXJyb3I/OiBzdHJpbmdcbiAgc3NsSGludD86IHN0cmluZ1xufVxuXG5hc3luYyBmdW5jdGlvbiBjaGVja0VuZHBvaW50cygpOiBQcm9taXNlPFByZWZsaWdodENoZWNrUmVzdWx0PiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb2F1dGhDb25maWcgPSBnZXRPYXV0aENvbmZpZygpXG4gICAgY29uc3QgdG9rZW5VcmwgPSBuZXcgVVJMKG9hdXRoQ29uZmlnLlRPS0VOX1VSTClcbiAgICBjb25zdCBlbmRwb2ludHMgPSBbXG4gICAgICBgJHtvYXV0aENvbmZpZy5CQVNFX0FQSV9VUkx9L2FwaS9oZWxsb2AsXG4gICAgICBgJHt0b2tlblVybC5vcmlnaW59L3YxL29hdXRoL2hlbGxvYCxcbiAgICBdXG5cbiAgICBjb25zdCBjaGVja0VuZHBvaW50ID0gYXN5bmMgKFxuICAgICAgdXJsOiBzdHJpbmcsXG4gICAgKTogUHJvbWlzZTxQcmVmbGlnaHRDaGVja1Jlc3VsdD4gPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQodXJsLCB7XG4gICAgICAgICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6IGdldFVzZXJBZ2VudCgpIH0sXG4gICAgICAgIH0pXG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgIGNvbnN0IGhvc3RuYW1lID0gbmV3IFVSTCh1cmwpLmhvc3RuYW1lXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gY29ubmVjdCB0byAke2hvc3RuYW1lfTogU3RhdHVzICR7cmVzcG9uc2Uuc3RhdHVzfWAsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgaG9zdG5hbWUgPSBuZXcgVVJMKHVybCkuaG9zdG5hbWVcbiAgICAgICAgY29uc3Qgc3NsSGludCA9IGdldFNTTEVycm9ySGludChlcnJvcilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBjb25uZWN0IHRvICR7aG9zdG5hbWV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyAoZXJyb3IgYXMgRXJybm9FeGNlcHRpb24pLmNvZGUgfHwgZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCxcbiAgICAgICAgICBzc2xIaW50OiBzc2xIaW50ID8/IHVuZGVmaW5lZCxcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChlbmRwb2ludHMubWFwKGNoZWNrRW5kcG9pbnQpKVxuICAgIGNvbnN0IGZhaWxlZFJlc3VsdCA9IHJlc3VsdHMuZmluZChyZXN1bHQgPT4gIXJlc3VsdC5zdWNjZXNzKVxuXG4gICAgaWYgKGZhaWxlZFJlc3VsdCkge1xuICAgICAgLy8gTG9nIGZhaWx1cmUgdG8gU3RhdHNpZ1xuICAgICAgbG9nRXZlbnQoJ3Rlbmd1X3ByZWZsaWdodF9jaGVja19mYWlsZWQnLCB7XG4gICAgICAgIGlzQ29ubmVjdGl2aXR5RXJyb3I6IGZhbHNlLFxuICAgICAgICBoYXNFcnJvck1lc3NhZ2U6ICEhZmFpbGVkUmVzdWx0LmVycm9yLFxuICAgICAgICBpc1NTTEVycm9yOiAhIWZhaWxlZFJlc3VsdC5zc2xIaW50LFxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gZmFpbGVkUmVzdWx0IHx8IHsgc3VjY2VzczogdHJ1ZSB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nRXJyb3IoZXJyb3IgYXMgRXJyb3IpXG5cbiAgICAvLyBMb2cgdG8gU3RhdHNpZ1xuICAgIGxvZ0V2ZW50KCd0ZW5ndV9wcmVmbGlnaHRfY2hlY2tfZmFpbGVkJywge1xuICAgICAgaXNDb25uZWN0aXZpdHlFcnJvcjogdHJ1ZSxcbiAgICB9KVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IGBDb25uZWN0aXZpdHkgY2hlY2sgZXJyb3I6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IChlcnJvciBhcyBFcnJub0V4Y2VwdGlvbikuY29kZSB8fCBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgIH1cbiAgfVxufVxuXG5pbnRlcmZhY2UgUHJlZmxpZ2h0U3RlcFByb3BzIHtcbiAgb25TdWNjZXNzOiAoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmVmbGlnaHRTdGVwKHtcbiAgb25TdWNjZXNzLFxufTogUHJlZmxpZ2h0U3RlcFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3Jlc3VsdCwgc2V0UmVzdWx0XSA9IHVzZVN0YXRlPFByZWZsaWdodENoZWNrUmVzdWx0IHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2lzQ2hlY2tpbmcsIHNldElzQ2hlY2tpbmddID0gdXNlU3RhdGUodHJ1ZSlcblxuICAvLyBkZWxheSBzaG93aW5nIHRoZSBjaGVjayBzaW5jZSBpdCdzIHNvIGZhc3QgdGhhdCB3ZSBub3JtYWxseVxuICAvLyB3YW50IHRvIGp1c3QgaW1tZWRpYXRlbHkgc2hvdyB0aGUgbmV4dCBzdGVwIHdpdGhvdXQgYSBmbGFzaFxuICBjb25zdCBzaG93U3Bpbm5lciA9IHVzZVRpbWVvdXQoMTAwMCkgJiYgaXNDaGVja2luZ1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYXN5bmMgZnVuY3Rpb24gcnVuKCkge1xuICAgICAgY29uc3QgY2hlY2tSZXN1bHQgPSBhd2FpdCBjaGVja0VuZHBvaW50cygpXG4gICAgICBzZXRSZXN1bHQoY2hlY2tSZXN1bHQpXG4gICAgICBzZXRJc0NoZWNraW5nKGZhbHNlKVxuICAgIH1cbiAgICB2b2lkIHJ1bigpXG4gIH0sIFtdKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHJlc3VsdD8uc3VjY2Vzcykge1xuICAgICAgb25TdWNjZXNzKClcbiAgICB9IGVsc2UgaWYgKHJlc3VsdCAmJiAhcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBwcm9jZXNzLmV4aXQoMSksIDEwMClcbiAgICAgIHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpXG4gICAgfVxuICB9LCBbcmVzdWx0LCBvblN1Y2Nlc3NdKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfSBwYWRkaW5nTGVmdD17MX0+XG4gICAgICB7aXNDaGVja2luZyAmJiBzaG93U3Bpbm5lciA/IChcbiAgICAgICAgPEJveCBwYWRkaW5nTGVmdD17MX0+XG4gICAgICAgICAgPFNwaW5uZXIgLz5cbiAgICAgICAgICA8VGV4dD5DaGVja2luZyBjb25uZWN0aXZpdHkuLi48L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKSA6IChcbiAgICAgICAgIXJlc3VsdD8uc3VjY2VzcyAmJlxuICAgICAgICAhaXNDaGVja2luZyAmJiAoXG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5VbmFibGUgdG8gY29ubmVjdCB0byBBbnRocm9waWMgc2VydmljZXM8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+e3Jlc3VsdD8uZXJyb3J9PC9UZXh0PlxuICAgICAgICAgICAge3Jlc3VsdD8uc3NsSGludCA/IChcbiAgICAgICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgICAgICAgICA8VGV4dD57cmVzdWx0LnNzbEhpbnR9PC9UZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VnZ2VzdGlvblwiPlxuICAgICAgICAgICAgICAgICAgU2VlIGh0dHBzOi8vY29kZS5jbGF1ZGUuY29tL2RvY3MvZW4vbmV0d29yay1jb25maWdcbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgICAgIFBsZWFzZSBjaGVjayB5b3VyIGludGVybmV0IGNvbm5lY3Rpb24gYW5kIG5ldHdvcmsgc2V0dGluZ3MuXG4gICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAgTm90ZTogQ2xhdWRlIENvZGUgbWlnaHQgbm90IGJlIGF2YWlsYWJsZSBpbiB5b3VyIGNvdW50cnkuXG4gICAgICAgICAgICAgICAgICBDaGVjayBzdXBwb3J0ZWQgY291bnRyaWVzIGF0eycgJ31cbiAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VnZ2VzdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICBodHRwczovL2FudGhyb3BpYy5jb20vc3VwcG9ydGVkLWNvdW50cmllc1xuICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApXG4gICAgICApfVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixPQUFPQyxLQUFLLElBQUlDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDbEQsU0FBU0MsUUFBUSxRQUFRLGlDQUFpQztBQUMxRCxTQUFTQyxPQUFPLFFBQVEsMEJBQTBCO0FBQ2xELFNBQVNDLGNBQWMsUUFBUSx1QkFBdUI7QUFDdEQsU0FBU0MsVUFBVSxRQUFRLHdCQUF3QjtBQUNuRCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLGVBQWUsUUFBUSwrQkFBK0I7QUFDL0QsU0FBU0MsWUFBWSxRQUFRLFdBQVc7QUFDeEMsU0FBU0MsUUFBUSxRQUFRLFVBQVU7QUFFbkMsT0FBTyxVQUFVQyxvQkFBb0IsQ0FBQztFQUNwQ0MsT0FBTyxFQUFFLE9BQU87RUFDaEJDLEtBQUssQ0FBQyxFQUFFLE1BQU07RUFDZEMsT0FBTyxDQUFDLEVBQUUsTUFBTTtBQUNsQjtBQUVBLGVBQWVDLGNBQWNBLENBQUEsQ0FBRSxFQUFFQyxPQUFPLENBQUNMLG9CQUFvQixDQUFDLENBQUM7RUFDN0QsSUFBSTtJQUNGLE1BQU1NLFdBQVcsR0FBR2IsY0FBYyxDQUFDLENBQUM7SUFDcEMsTUFB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
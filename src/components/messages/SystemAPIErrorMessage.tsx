// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 引入 Box、Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from 'src/ink.js';
// 接入 formatAPIError 服务层能力，把外部通信或共享状态交给 src/services/api/errorUtils.js 处理。
import { formatAPIError } from 'src/services/api/errorUtils.js';
// 类型依赖 { SystemAPIErrorMessage } 来自 src/types/message.js，用于校准终端渲染的数据契约。
import type { SystemAPIErrorMessage } from 'src/types/message.js';
// 引入 useInterval，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useInterval } from 'usehooks-ts';
// 引入 CtrlOToExpand，将 ../CtrlOToExpand.js 中已经封装好的能力接到本文件流程里。
import { CtrlOToExpand } from '../CtrlOToExpand.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// MAX_API_ERROR_CHARS 错误信息保存`1000`，供终端 UI System APIError Mess...后续判断或输出使用。
const MAX_API_ERROR_CHARS = 1000;
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  message: SystemAPIErrorMessage;
  verbose: boolean;
};
// SystemAPIErrorMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SystemAPIErrorMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(33);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    message: t1,
    verbose
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    retryAttempt,
    error,
    retryInMs,
    maxRetries
  } = t1;
  // hidden标记终端 UI System APIError Mess...是否启用对应路径。
  const hidden = true && retryAttempt < 4;
  // countdownMs 数量 由 React state 持有，setCountdownMs 会在用户操作或异步结果返回时触发刷新。
  const [countdownMs, setCountdownMs] = useState(0);
  // done统计`countdownMs >= retryInMs` 整理出中间结果，供终端 UI System APIError Mess...后续步骤使用。
  const done = countdownMs >= retryInMs;
  // t2 暂存 `() => setCountdownMs(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => setCountdownMs(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => setCountdownMs(_temp);
    // $[0] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[0];
  }
  // 调用 useInterval，触发终端渲染此处需要的副作用。
  useInterval(t2, hidden || done ? null : 1000);
  // 满足 `hidden` 时，终端渲染执行该分支。
  if (hidden) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t3 暂存 `Math.round((retryInMs - countdownMs) / 1000)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== countdownMs || $[2] !== retryInMs) {
    // t3 暂存 `Math.round((retryInMs - countdownMs) / 1000)` 生成的渲染片段，后续返回路径直接复用。
    t3 = Math.round((retryInMs - countdownMs) / 1000);
    // $[1] 缓存 `countdownMs`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = countdownMs;
    // $[2] 缓存 `retryInMs`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = retryInMs;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // retryInSecondsLive保存`Math.max`，供终端渲染后续处理使用。
  const retryInSecondsLive = Math.max(0, t3);
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 暂存 `Box` 的派生结果，便于缓存命中时直接复用。
  let T1;
  // T2 暂存 `MessageResponse` 的派生结果，便于缓存命中时直接复用。
  let T2;
  // t4 暂存 `"error"` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 暂存 `truncated ? formatted.slice(0, MAX_API_ERROR_CHARS) + "\u...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `"column"` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // truncated 先占位，稍后的条件分支会根据实际输入补齐它。
  let truncated;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== error || $[5] !== verbose) {
    // formatted格式化`formatAPIError`，供终端渲染后续处理使用。
    const formatted = formatAPIError(error);
    // truncated更新为 `!verbose && formatted.length > MAX_API_ERROR_CHARS`，确保终端 UI后续读取最新状态。
    truncated = !verbose && formatted.length > MAX_API_ERROR_CHARS;
    // T2 暂存 `MessageResponse` 生成的渲染片段，后续返回路径直接复用。
    T2 = MessageResponse;
    // T1 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T1 = Box;
    // t6 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t6 = "column";
    // T0 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
    T0 = Text;
    // t4 暂存 `"error"` 生成的渲染片段，后续返回路径直接复用。
    t4 = "error";
    // t5 暂存 `truncated ? formatted.slice(0, MAX_API_ERROR_CHARS) + "\u...` 生成的渲染片段，后续返回路径直接复用。
    t5 = truncated ? formatted.slice(0, MAX_API_ERROR_CHARS) + "\u2026" : formatted;
    // $[4] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = error;
    // $[5] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = verbose;
    // $[6] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = T0;
    // $[7] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = T1;
    // $[8] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = T2;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
    // $[12] 缓存 `truncated`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = truncated;
  } else {
    // T0 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[6];
    // T1 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[7];
    // T2 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    T2 = $[8];
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
    // truncated更新为 `$[12]`，确保终端 UI后续读取最新状态。
    truncated = $[12];
  }
  // t7 暂存 `<T0 color={t4}>{t5}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== T0 || $[14] !== t4 || $[15] !== t5) {
    // t7 暂存 `<T0 color={t4}>{t5}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <T0 color={t4}>{t5}</T0>;
    // $[13] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = T0;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
    // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t5;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // t8 暂存 `truncated && <CtrlOToExpand />` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== truncated) {
    // t8 暂存 `truncated && <CtrlOToExpand />` 生成的渲染片段，后续返回路径直接复用。
    t8 = truncated && <CtrlOToExpand />;
    // $[17] 缓存 `truncated`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = truncated;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[18];
  }
  // t9标记终端 UI System APIError Mess...是否启用对应路径。
  const t9 = retryInSecondsLive === 1 ? "second" : "seconds";
  // t10 暂存 `<Text dimColor={true}>Retrying in {retryInSecondsLive}{" ...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== maxRetries || $[20] !== retryAttempt || $[21] !== retryInSecondsLive || $[22] !== t9) {
    // t10 暂存 `<Text dimColor={true}>Retrying in {retryInSecondsLive}{" ...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text dimColor={true}>Retrying in {retryInSecondsLive}{" "}{t9}… (attempt{" "}{retryAttempt}/{maxRetries}){process.env.API_TIMEOUT_MS ? ` · API_TIMEOUT_MS=${process.env.API_TIMEOUT_MS}ms, try increasing it` : ""}</Text>;
    // $[19] 缓存 `maxRetries`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = maxRetries;
    // $[20] 缓存 `retryAttempt`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = retryAttempt;
    // $[21] 缓存 `retryInSecondsLive`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = retryInSecondsLive;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
    // $[23] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[23];
  }
  // t11 暂存 `<T1 flexDirection={t6}>{t7}{t8}{t10}</T1>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== T1 || $[25] !== t10 || $[26] !== t6 || $[27] !== t7 || $[28] !== t8) {
    // t11 暂存 `<T1 flexDirection={t6}>{t7}{t8}{t10}</T1>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <T1 flexDirection={t6}>{t7}{t8}{t10}</T1>;
    // $[24] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = T1;
    // $[25] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t10;
    // $[26] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t6;
    // $[27] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t7;
    // $[28] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t8;
    // $[29] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[29];
  }
  // t12 暂存 `<T2>{t11}</T2>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== T2 || $[31] !== t11) {
    // t12 暂存 `<T2>{t11}</T2>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <T2>{t11}</T2>;
    // $[30] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = T2;
    // $[31] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t11;
    // $[32] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[32];
  }
  // 返回 `t12`，作为终端渲染这次计算的结果。
  return t12;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(ms) {
  // 返回 `ms + 1000`，作为终端渲染这次计算的结果。
  return ms + 1000;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwiQm94IiwiVGV4dCIsImZvcm1hdEFQSUVycm9yIiwiU3lzdGVtQVBJRXJyb3JNZXNzYWdlIiwidXNlSW50ZXJ2YWwiLCJDdHJsT1RvRXhwYW5kIiwiTWVzc2FnZVJlc3BvbnNlIiwiTUFYX0FQSV9FUlJPUl9DSEFSUyIsIlByb3BzIiwibWVzc2FnZSIsInZlcmJvc2UiLCJ0MCIsIiQiLCJfYyIsInQxIiwicmV0cnlBdHRlbXB0IiwiZXJyb3IiLCJyZXRyeUluTXMiLCJtYXhSZXRyaWVzIiwiaGlkZGVuIiwiY291bnRkb3duTXMiLCJzZXRDb3VudGRvd25NcyIsImRvbmUiLCJ0MiIsIlN5bWJvbCIsImZvciIsIl90ZW1wIiwidDMiLCJNYXRoIiwicm91bmQiLCJyZXRyeUluU2Vjb25kc0xpdmUiLCJtYXgiLCJUMCIsIlQxIiwiVDIiLCJ0NCIsInQ1IiwidDYiLCJ0cnVuY2F0ZWQiLCJmb3JtYXR0ZWQiLCJsZW5ndGgiLCJzbGljZSIsInQ3IiwidDgiLCJ0OSIsInQxMCIsInByb2Nlc3MiLCJlbnYiLCJBUElfVElNRU9VVF9NUyIsInQxMSIsInQxMiIsIm1zIl0sInNvdXJjZXMiOlsiU3lzdGVtQVBJRXJyb3JNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICdzcmMvaW5rLmpzJ1xuaW1wb3J0IHsgZm9ybWF0QVBJRXJyb3IgfSBmcm9tICdzcmMvc2VydmljZXMvYXBpL2Vycm9yVXRpbHMuanMnXG5pbXBvcnQgdHlwZSB7IFN5c3RlbUFQSUVycm9yTWVzc2FnZSB9IGZyb20gJ3NyYy90eXBlcy9tZXNzYWdlLmpzJ1xuaW1wb3J0IHsgdXNlSW50ZXJ2YWwgfSBmcm9tICd1c2Vob29rcy10cydcbmltcG9ydCB7IEN0cmxPVG9FeHBhbmQgfSBmcm9tICcuLi9DdHJsT1RvRXhwYW5kLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vTWVzc2FnZVJlc3BvbnNlLmpzJ1xuXG5jb25zdCBNQVhfQVBJX0VSUk9SX0NIQVJTID0gMTAwMFxuXG50eXBlIFByb3BzID0ge1xuICBtZXNzYWdlOiBTeXN0ZW1BUElFcnJvck1lc3NhZ2VcbiAgdmVyYm9zZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gU3lzdGVtQVBJRXJyb3JNZXNzYWdlKHtcbiAgbWVzc2FnZTogeyByZXRyeUF0dGVtcHQsIGVycm9yLCByZXRyeUluTXMsIG1heFJldHJpZXMgfSxcbiAgdmVyYm9zZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gSGlkZGVuIGZvciBlYXJseSByZXRyaWVzIG9uIGV4dGVybmFsIGJ1aWxkcyB0byBhdm9pZCBub2lzZS4gQ29tcHV0ZSBiZWZvcmVcbiAgLy8gdXNlSW50ZXJ2YWwgc28gd2UgbmV2ZXIgcmVnaXN0ZXIgYSB0aW1lciB0aGF0IGp1c3QgZHJpdmVzIGEgbnVsbCByZW5kZXIuXG4gIGNvbnN0IGhpZGRlbiA9IFwiZXh0ZXJuYWxcIiA9PT0gJ2V4dGVybmFsJyAmJiByZXRyeUF0dGVtcHQgPCA0XG5cbiAgY29uc3QgW2NvdW50ZG93bk1zLCBzZXRDb3VudGRvd25Nc10gPSB1c2VTdGF0ZSgwKVxuICBjb25zdCBkb25lID0gY291bnRkb3duTXMgPj0gcmV0cnlJbk1zXG4gIHVzZUludGVydmFsKFxuICAgICgpID0+IHNldENvdW50ZG93bk1zKG1zID0+IG1zICsgMTAwMCksXG4gICAgaGlkZGVuIHx8IGRvbmUgPyBudWxsIDogMTAwMCxcbiAgKVxuXG4gIGlmIChoaWRkZW4pIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3QgcmV0cnlJblNlY29uZHNMaXZlID0gTWF0aC5tYXgoXG4gICAgMCxcbiAgICBNYXRoLnJvdW5kKChyZXRyeUluTXMgLSBjb3VudGRvd25NcykgLyAxMDAwKSxcbiAgKVxuXG4gIGNvbnN0IGZvcm1hdHRlZCA9IGZvcm1hdEFQSUVycm9yKGVycm9yKVxuICBjb25zdCB0cnVuY2F0ZWQgPSAhdmVyYm9zZSAmJiBmb3JtYXR0ZWQubGVuZ3RoID4gTUFYX0FQSV9FUlJPUl9DSEFSU1xuXG4gIHJldHVybiAoXG4gICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAge3RydW5jYXRlZFxuICAgICAgICAgICAgPyBmb3JtYXR0ZWQuc2xpY2UoMCwgTUFYX0FQSV9FUlJPUl9DSEFSUykgKyAn4oCmJ1xuICAgICAgICAgICAgOiBmb3JtYXR0ZWR9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAge3RydW5jYXRlZCAmJiA8Q3RybE9Ub0V4cGFuZCAvPn1cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgUmV0cnlpbmcgaW4ge3JldHJ5SW5TZWNvbmRzTGl2ZX17JyAnfVxuICAgICAgICAgIHtyZXRyeUluU2Vjb25kc0xpdmUgPT09IDEgPyAnc2Vjb25kJyA6ICdzZWNvbmRzJ33igKYgKGF0dGVtcHR7JyAnfVxuICAgICAgICAgIHtyZXRyeUF0dGVtcHR9L3ttYXhSZXRyaWVzfSlcbiAgICAgICAgICB7cHJvY2Vzcy5lbnYuQVBJX1RJTUVPVVRfTVNcbiAgICAgICAgICAgID8gYCDCtyBBUElfVElNRU9VVF9NUz0ke3Byb2Nlc3MuZW52LkFQSV9USU1FT1VUX01TfW1zLCB0cnkgaW5jcmVhc2luZyBpdGBcbiAgICAgICAgICAgIDogJyd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFFBQVEsUUFBUSxPQUFPO0FBQ2hDLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFR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
// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useEffect, useState } from 'react';
// 复用 checkIsGitClean、checkNeedsClaudeAiLogin 工具函数，把通用处理留在 src/utils/background/remote/preconditions.js 中维护。
import { checkIsGitClean, checkNeedsClaudeAiLogin } from 'src/utils/background/remote/preconditions.js';
// 复用 gracefulShutdownSync 工具函数，把通用处理留在 src/utils/gracefulShutdown.js 中维护。
import { gracefulShutdownSync } from 'src/utils/gracefulShutdown.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 ConsoleOAuthFlow，将 ./ConsoleOAuthFlow.js 中已经封装好的能力接到本文件流程里。
import { ConsoleOAuthFlow } from './ConsoleOAuthFlow.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// 引入 TeleportStash，将 ./TeleportStash.js 中已经封装好的能力接到本文件流程里。
import { TeleportStash } from './TeleportStash.js';
// TeleportLocalErrorType 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeleportLocalErrorType = 'needsLogin' | 'needsGitStash';
// TeleportErrorProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TeleportErrorProps = {
  // 这个回调绑定到 onComplete: () => void;，负责终端渲染在该局部场景下的响应。
  onComplete: () => void;
  errorsToIgnore?: ReadonlySet<TeleportLocalErrorType>;
};

// Module-level sentinel so the default parameter has stable identity.
// Previously `= new Set()` created a fresh Set every render, which put
// a new object in checkErrors' deps and caused the mount effect to
// re-fire on every render.
// EMPTY_ERRORS_TO_IGNORE 错误信息 用 Set 去重，后续只需判断成员是否存在。
const EMPTY_ERRORS_TO_IGNORE: ReadonlySet<TeleportLocalErrorType> = new Set();
// TeleportError 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TeleportError(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onComplete,
    errorsToIgnore: t1
  } = t0;
  // errorsToIgnore 错误信息标记终端 UI Teleport Error是否启用对应路径。
  const errorsToIgnore = t1 === undefined ? EMPTY_ERRORS_TO_IGNORE : t1;
  // currentError 错误信息 由 React state 持有，setCurrentError 会在用户操作或异步结果返回时触发刷新。
  const [currentError, setCurrentError] = useState(null);
  // isLoggingIn 由 React state 持有，setIsLoggingIn 会在用户操作或异步结果返回时触发刷新。
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // t2 暂存 `async () => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== errorsToIgnore || $[1] !== onComplete) {
    // t2 暂存 `async () => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = async () => {
      // currentErrors 错误信息读取`getTeleportErrors`，供终端渲染后续处理使用。
      const currentErrors = await getTeleportErrors();
      // filteredErrors 错误信息保存`Set`，供终端渲染后续处理使用。
      const filteredErrors = new Set(Array.from(currentErrors).filter(error => !errorsToIgnore.has(error)));
      // 满足 `filteredErrors.size === 0` 时，终端渲染执行该分支。
      if (filteredErrors.size === 0) {
        // 调用 onComplete，触发终端渲染此处需要的副作用。
        onComplete();
        // 终端 UI 组件 Teleport Error在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `filteredErrors.has("needsLogin")` 时，终端渲染执行该分支。
      if (filteredErrors.has("needsLogin")) {
        // setCurrentError 写入新的状态值，使终端渲染后续读取保持一致。
        setCurrentError("needsLogin");
      } else {
        // 满足 `filteredErrors.has("needsGitStash")` 时，终端渲染执行该分支。
        if (filteredErrors.has("needsGitStash")) {
          // setCurrentError 写入新的状态值，使终端渲染后续读取保持一致。
          setCurrentError("needsGitStash");
        }
      }
    };
    // $[0] 缓存 `errorsToIgnore`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = errorsToIgnore;
    // $[1] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onComplete;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // checkErrors 错误信息保存`t2`，作为后续临时缓存值处理的输入。
  const checkErrors = t2;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 暂存 `[checkErrors]` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== checkErrors) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 调用 checkErrors，触发终端渲染此处需要的副作用。
      checkErrors();
    };
    // t4 暂存 `[checkErrors]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [checkErrors];
    // $[3] 缓存 `checkErrors`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = checkErrors;
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
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t3, t4);
  // onCancel 命名 `_temp`，让后续代码直接表达这个值的用途。
  const onCancel = _temp;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== checkErrors) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // setIsLoggingIn 写入新的状态值，使终端渲染后续读取保持一致。
      setIsLoggingIn(false);
      // 调用 checkErrors，触发终端渲染此处需要的副作用。
      checkErrors();
    };
    // $[6] 缓存 `checkErrors`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = checkErrors;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // handleLoginComplete保存`t5`，作为后续临时缓存值处理的输入。
  const handleLoginComplete = t5;
  // t6 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = () => {
      // setIsLoggingIn 写入新的状态值，使终端渲染后续读取保持一致。
      setIsLoggingIn(true);
    };
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // handleLoginWithClaudeAI保存`t6`，作为后续临时缓存值处理的输入。
  const handleLoginWithClaudeAI = t6;
  // t7 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = value => {
      // 当 `value` 匹配 `"login"` 时，终端渲染执行对应分支。
      if (value === "login") {
        // 调用 handleLoginWithClaudeAI，触发终端渲染此处需要的副作用。
        handleLoginWithClaudeAI();
      } else {
        // 调用 onCancel，触发终端渲染此处需要的副作用。
        onCancel();
      }
    };
    // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[9];
  }
  // handleLoginDialogSelect沿用 `t7` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleLoginDialogSelect = t7;
  // t8 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== checkErrors) {
    // t8 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = () => {
      // 调用 checkErrors，触发终端渲染此处需要的副作用。
      checkErrors();
    };
    // $[10] 缓存 `checkErrors`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = checkErrors;
    // $[11] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[11];
  }
  // handleStashComplete 命名 `t8`，让后续代码直接表达这个值的用途。
  const handleStashComplete = t8;
  // currentError 错误信息缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!currentError) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 按照 currentError 的取值选择终端渲染的具体处理分支。
  switch (currentError) {
    case "needsGitStash":
      {
        // t9 暂存 `<TeleportStash onStashAndContinue={handleStashComplete} o...` 的派生结果，便于缓存命中时直接复用。
        let t9;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[12] !== handleStashComplete) {
          // t9 暂存 `<TeleportStash onStashAndContinue={handleStashComplete} o...` 生成的渲染片段，后续返回路径直接复用。
          t9 = <TeleportStash onStashAndContinue={handleStashComplete} onCancel={onCancel} />;
          // $[12] 缓存 `handleStashComplete`，下次依赖未变时 React 编译产物可直接复用。
          $[12] = handleStashComplete;
          // $[13] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[13] = t9;
        } else {
          // t9 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
          t9 = $[13];
        }
        // 返回 `t9`，作为终端渲染这次计算的结果。
        return t9;
      }
    case "needsLogin":
      {
        // 满足 `isLoggingIn` 时，终端渲染执行该分支。
        if (isLoggingIn) {
          // t9 暂存 `<ConsoleOAuthFlow onDone={handleLoginComplete} mode="logi...` 的派生结果，便于缓存命中时直接复用。
          let t9;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[14] !== handleLoginComplete) {
            // t9 暂存 `<ConsoleOAuthFlow onDone={handleLoginComplete} mode="logi...` 生成的渲染片段，后续返回路径直接复用。
            t9 = <ConsoleOAuthFlow onDone={handleLoginComplete} mode="login" forceLoginMethod="claudeai" />;
            // $[14] 缓存 `handleLoginComplete`，下次依赖未变时 React 编译产物可直接复用。
            $[14] = handleLoginComplete;
            // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
            $[15] = t9;
          } else {
            // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
            t9 = $[15];
          }
          // 返回 `t9`，作为终端渲染这次计算的结果。
          return t9;
        }
        // t9 暂存 `<Box flexDirection="column"><Text dimColor={true}>Telepor...` 的派生结果，便于缓存命中时直接复用。
        let t9;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
          // t9 暂存 `<Box flexDirection="column"><Text dimColor={true}>Telepor...` 生成的渲染片段，后续返回路径直接复用。
          t9 = <Box flexDirection="column"><Text dimColor={true}>Teleport requires a Claude.ai account.</Text><Text dimColor={true}>Your Claude Pro/Max subscription will be used by Claude Code.</Text></Box>;
          // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[16] = t9;
        } else {
          // t9 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
          t9 = $[16];
        }
        // t10 暂存 `<Dialog title="Log in to Claude" onCancel={onCancel}>{t9}...` 的派生结果，便于缓存命中时直接复用。
        let t10;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
          // t10 暂存 `<Dialog title="Log in to Claude" onCancel={onCancel}>{t9}...` 生成的渲染片段，后续返回路径直接复用。
          t10 = <Dialog title="Log in to Claude" onCancel={onCancel}>{t9}<Select options={[{
              label: "Login with Claude account",
              value: "login"
            }, {
              label: "Exit",
              value: "exit"
            }]} onChange={handleLoginDialogSelect} /></Dialog>;
          // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
          $[17] = t10;
        } else {
          // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
          t10 = $[17];
        }
        // 返回 `t10`，作为终端渲染这次计算的结果。
        return t10;
      }
  }
}

/**
 * Gets current teleport errors that need to be resolved
 * @returns Set of teleport error types that need to be handled
 */
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 调用 gracefulShutdownSync，触发终端渲染此处需要的副作用。
  gracefulShutdownSync(0);
}
// getTeleportErrors 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTeleportErrors(): Promise<Set<TeleportLocalErrorType>> {
  // 错误列表构建`new Set<TeleportLocalErrorType>()` 整理出中间结果，供终端 UI Teleport Error后续步骤使用。
  const errors = new Set<TeleportLocalErrorType>();
  // 并行获取 needsLogin、isGitClean，缩短终端 UI 组件 Teleport Error等待多个独立异步任务的时间。
  const [needsLogin, isGitClean] = await Promise.all([checkNeedsClaudeAiLogin(), checkIsGitClean()]);
  // 满足 `needsLogin` 时，终端渲染执行该分支。
  if (needsLogin) {
    // 调用 errors.add，触发终端渲染此处需要的副作用。
    errors.add('needsLogin');
  }
  // isGitClean缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!isGitClean) {
    // 调用 errors.add，触发终端渲染此处需要的副作用。
    errors.add('needsGitStash');
  }
  // 返回 `errors`，作为终端渲染这次计算的结果。
  return errors;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJjaGVja0lzR2l0Q2xlYW4iLCJjaGVja05lZWRzQ2xhdWRlQWlMb2dpbiIsImdyYWNlZnVsU2h1dGRvd25TeW5jIiwiQm94IiwiVGV4dCIsIkNvbnNvbGVPQXV0aEZsb3ciLCJTZWxlY3QiLCJEaWFsb2ciLCJUZWxlcG9ydFN0YXNoIiwiVGVsZXBvcnRMb2NhbEVycm9yVHlwZSIsIlRlbGVwb3J0RXJyb3JQcm9wcyIsIm9uQ29tcGxldGUiLCJlcnJvcnNUb0lnbm9yZSIsIlJlYWRvbmx5U2V0IiwiRU1QVFlfRVJST1JTX1RPX0lHTk9SRSIsIlNldCIsIlRlbGVwb3J0RXJyb3IiLCJ0MCIsIiQiLCJfYyIsInQxIiwidW5kZWZpbmVkIiwiY3VycmVudEVycm9yIiwic2V0Q3VycmVudEVycm9yIiwiaXNMb2dnaW5nSW4iLCJzZXRJc0xvZ2dpbmdJbiIsInQyIiwiY3VycmVudEVycm9ycyIsImdldFRlbGVwb3J0RXJyb3JzIiwiZmlsdGVyZWRFcnJvcnMiLCJBcnJheSIsImZyb20iLCJmaWx0ZXIiLCJlcnJvciIsImhhcyIsInNpemUiLCJjaGVja0Vycm9ycyIsInQzIiwidDQiLCJvbkNhbmNlbCIsIl90ZW1wIiwidDUiLCJoYW5kbGVMb2dpbkNvbXBsZXRlIiwidDYiLCJTeW1ib2wiLCJmb3IiLCJoYW5kbGVMb2dpbldpdGhDbGF1ZGVBSSIsInQ3IiwidmFsdWUiLCJoYW5kbGVMb2dpbkRpYWxvZ1NlbGVjdCIsInQ4IiwiaGFuZGxlU3Rhc2hDb21wbGV0ZSIsInQ5IiwidDEwIiwibGFiZWwiLCJQcm9taXNlIiwiZXJyb3JzIiwibmVlZHNMb2dpbiIsImlzR2l0Q2xlYW4iLCJhbGwiLCJhZGQiXSwic291cmNlcyI6WyJUZWxlcG9ydEVycm9yLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7XG4gIGNoZWNrSXNHaXRDbGVhbixcbiAgY2hlY2tOZWVkc0NsYXVkZUFpTG9naW4sXG59IGZyb20gJ3NyYy91dGlscy9iYWNrZ3JvdW5kL3JlbW90ZS9wcmVjb25kaXRpb25zLmpzJ1xuaW1wb3J0IHsgZ3JhY2VmdWxTaHV0ZG93blN5bmMgfSBmcm9tICdzcmMvdXRpbHMvZ3JhY2VmdWxTaHV0ZG93bi5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IENvbnNvbGVPQXV0aEZsb3cgfSBmcm9tICcuL0NvbnNvbGVPQXV0aEZsb3cuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBUZWxlcG9ydFN0YXNoIH0gZnJvbSAnLi9UZWxlcG9ydFN0YXNoLmpzJ1xuXG5leHBvcnQgdHlwZSBUZWxlcG9ydExvY2FsRXJyb3JUeXBlID0gJ25lZWRzTG9naW4nIHwgJ25lZWRzR2l0U3Rhc2gnXG5cbnR5cGUgVGVsZXBvcnRFcnJvclByb3BzID0ge1xuICBvbkNvbXBsZXRlOiAoKSA9PiB2b2lkXG4gIGVycm9yc1RvSWdub3JlPzogUmVhZG9ubHlTZXQ8VGVsZXBvcnRMb2NhbEVycm9yVHlwZT5cbn1cblxuLy8gTW9kdWxlLWxldmVsIHNlbnRpbmVsIHNvIHRoZSBkZWZhdWx0IHBhcmFtZXRlciBoYXMgc3RhYmxlIGlkZW50aXR5LlxuLy8gUHJldmlvdXNseSBgPSBuZXcgU2V0KClgIGNyZWF0ZWQgYSBmcmVzaCBTZXQgZXZlcnkgcmVuZGVyLCB3aGljaCBwdXRcbi8vIGEgbmV3IG9iamVjdCBpbiBjaGVja0Vycm9ycycgZGVwcyBhbmQgY2F1c2VkIHRoZSBtb3VudCBlZmZlY3QgdG9cbi8vIHJlLWZpcmUgb24gZXZlcnkgcmVuZGVyLlxuY29uc3QgRU1QVFlfRVJST1JTX1RPX0lHTk9SRTogUmVhZG9ubHlTZXQ8VGVsZXBvcnRMb2NhbEVycm9yVHlwZT4gPSBuZXcgU2V0KClcblxuZXhwb3J0IGZ1bmN0aW9uIFRlbGVwb3J0RXJyb3Ioe1xuICBvbkNvbXBsZXRlLFxuICBlcnJvcnNUb0lnbm9yZSA9IEVNUFRZX0VSUk9SU19UT19JR05PUkUsXG59OiBUZWxlcG9ydEVycm9yUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbY3VycmVudEVycm9yLCBzZXRDdXJyZW50RXJyb3JdID1cbiAgICB1c2VTdGF0ZTxUZWxlcG9ydExvY2FsRXJyb3JUeXBlIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2lzTG9nZ2luZ0luLCBzZXRJc0xvZ2dpbmdJbl0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSlcblxuICAvLyBDaGVjayBmb3IgZXJyb3JzIG9uIG1vdW50IGFuZCB3aGVuIGVycm9yIHJlc29sdXRpb24gb2NjdXJzXG4gIGNvbnN0IGNoZWNrRXJyb3JzID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGN1cnJlbnRFcnJvcnMgPSBhd2FpdCBnZXRUZWxlcG9ydEVycm9ycygpXG4gICAgY29uc3QgZmlsdGVyZWRFcnJvcnMgPSBuZXcgU2V0KFxuICAgICAgQXJyYXkuZnJvbShjdXJyZW50RXJyb3JzKS5maWx0ZXIoXG4gICAgICAgIChlcnJvcjogVGVsZXBvcnRMb2NhbEVycm9yVHlwZSkgPT4gIWVycm9yc1RvSWdub3JlLmhhcyhlcnJvciksXG4gICAgICApLFxuICAgIClcblxuICAgIC8vIElmIG5vIGVycm9ycyByZW1haW4sIGNhbGwgb25Db21wbGV0ZVxuICAgIGlmIChmaWx0ZXJlZEVycm9ycy5zaXplID09PSAwKSB7XG4gICAgICBvbkNvbXBsZXRlKClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIFNldCBjdXJyZW50IGVycm9yIHRvIGhhbmRsZSAocHJpb3JpdGl6ZSBsb2dpbiBvdmVyIGdpdClcbiAgICBpZiAoZmlsdGVyZWRFcnJvcnMuaGFzKCduZWVkc0xvZ2luJykpIHtcbiAgICAgIHNldEN1cnJlbnRFcnJvcignbmVlZHNMb2dpbicpXG4gICAgfSBlbHNlIGlmIChmaWx0ZXJlZEVycm9ycy5oYXMoJ25lZWRzR2l0U3Rhc2gnKSkge1xuICAgICAgc2V0Q3VycmVudEVycm9yKCduZWVkc0dpdFN0YXNoJylcbiAgICB9XG4gIH0sIFtvbkNvbXBsZXRlLCBlcnJvcnNUb0lnbm9yZV0pXG5cbiAgLy8gQ2hlY2sgZXJyb3JzIG9uIG1vdW50XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgdm9pZCBjaGVja0Vycm9ycygpXG4gIH0sIFtjaGVja0Vycm9yc10pXG5cbiAgY29uc3Qgb25DYW5jZWwgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgZ3JhY2VmdWxTaHV0ZG93blN5bmMoMClcbiAgfSwgW10pXG5cbiAgY29uc3QgaGFuZGxlTG9naW5Db21wbGV0ZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRJc0xvZ2dpbmdJbihmYWxzZSlcbiAgICB2b2lkIGNoZWNrRXJyb3JzKClcbiAgfSwgW2NoZWNrRXJyb3JzXSlcblxuICBjb25zdCBoYW5kbGVMb2dpbldpdGhDbGF1ZGVBSSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRJc0xvZ2dpbmdJbih0cnVlKVxuICB9LCBbc2V0SXNMb2dnaW5nSW5dKVxuXG4gIGNvbnN0IGhhbmRsZUxvZ2luRGlhbG9nU2VsZWN0ID0gdXNlQ2FsbGJhY2soXG4gICAgKHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gJ2xvZ2luJykge1xuICAgICAgICBoYW5kbGVMb2dpbldpdGhDbGF1ZGVBSSgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBVc2VyIHNlbGVjdGVkIGV4aXRcbiAgICAgICAgb25DYW5jZWwoKVxuICAgICAgfVxuICAgIH0sXG4gICAgW2hhbmRsZUxvZ2luV2l0aENsYXVkZUFJLCBvbkNhbmNlbF0sXG4gIClcblxuICBjb25zdCBoYW5kbGVTdGFzaENvbXBsZXRlID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHZvaWQgY2hlY2tFcnJvcnMoKVxuICB9LCBbY2hlY2tFcnJvcnNdKVxuXG4gIC8vIERvbid0IHJlbmRlciBhbnl0aGluZyBpZiBubyBjdXJyZW50IGVycm9yIChvbkNvbXBsZXRlIHdpbGwgYmUgY2FsbGVkKVxuICBpZiAoIWN1cnJlbnRFcnJvcikge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBzd2l0Y2ggKGN1cnJlbnRFcnJvcikge1xuICAgIGNhc2UgJ25lZWRzR2l0U3Rhc2gnOlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFRlbGVwb3J0U3Rhc2hcbiAgICAgICAgICBvblN0YXNoQW5kQ29udGludWU9e2hhbmRsZVN0YXNoQ29tcGxldGV9XG4gICAgICAgICAgb25DYW5jZWw9e29uQ2FuY2VsfVxuICAgICAgICAvPlxuICAgICAgKVxuXG4gICAgY2FzZSAnbmVlZHNMb2dpbic6IHtcbiAgICAgIGlmIChpc0xvZ2dpbmdJbikge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxDb25zb2xlT0F1dGhGbG93XG4gICAgICAgICAgICBvbkRvbmU9e2hhbmRsZUxvZ2luQ29tcGxldGV9XG4gICAgICAgICAgICBtb2RlPVwibG9naW5cIlxuICAgICAgICAgICAgZm9yY2VMb2dpbk1ldGhvZD1cImNsYXVkZWFpXCJcbiAgICAgICAgICAvPlxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxEaWFsb2cgdGl0bGU9XCJMb2cgaW4gdG8gQ2xhdWRlXCIgb25DYW5jZWw9e29uQ2FuY2VsfT5cbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlRlbGVwb3J0IHJlcXVpcmVzIGEgQ2xhdWRlLmFpIGFjY291bnQuPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIFlvdXIgQ2xhdWRlIFByby9NYXggc3Vic2NyaXB0aW9uIHdpbGwgYmUgdXNlZCBieSBDbGF1ZGUgQ29kZS5cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgICBvcHRpb25zPXtbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdMb2dpbiB3aXRoIENsYXVkZSBhY2NvdW50JywgdmFsdWU6ICdsb2dpbicgfSxcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0V4aXQnLCB2YWx1ZTogJ2V4aXQnIH0sXG4gICAgICAgICAgICBdfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZUxvZ2luRGlhbG9nU2VsZWN0fVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvRGlhbG9nPlxuICAgICAgKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgY3VycmVudCB0ZWxlcG9ydCBlcnJvcnMgdGhhdCBuZWVkIHRvIGJlIHJlc29sdmVkXG4gKiBAcmV0dXJucyBTZXQgb2YgdGVsZXBvcnQgZXJyb3IgdHlwZXMgdGhhdCBuZWVkIHRvIGJlIGhhbmRsZWRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFRlbGVwb3J0RXJyb3JzKCk6IFByb21pc2U8XG4gIFNldDxUZWxlcG9ydExvY2FsRXJyb3JUeXBlPlxuPiB7XG4gIGNvbnN0IGVycm9ycyA9IG5ldyBTZXQ8VGVsZXBvcnRMb2NhbEVycm9yVHlwZT4oKVxuXG4gIGNvbnN0IFtuZWVkc0xvZ2luLCBpc0dpdENsZWFuXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICBjaGVja05lZWRzQ2xhdWRlQWlMb2dpbigpLFxuICAgIGNoZWNrSXNHaXRDbGVhbigpLFxuICBdKVxuXG4gIGlmIChuZWVkc0xvZ2luKSB7XG4gICAgZXJyb3JzLmFkZCgnbmVlZHNMb2dpbicpXG4gIH1cbiAgaWYgKCFpc0dpdENsZWFuKSB7XG4gICAgZXJyb3JzLmFkZCgnbmVlZHNHaXRTdGFzaCcpXG4gIH1cblxuICBy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
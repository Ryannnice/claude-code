// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 React、useContext，将 react 中已经封装好的能力接到本文件流程里。
import React, { useContext } from 'react';
// 接入 ERROR_MESSAGE_USER_ABORT 服务层能力，把外部通信或共享状态交给 src/services/compact/compact.js 处理。
import { ERROR_MESSAGE_USER_ABORT } from 'src/services/compact/compact.js';
// 接入 isRateLimitErrorMessage 服务层能力，把外部通信或共享状态交给 src/services/rateLimitMessages.js 处理。
import { isRateLimitErrorMessage } from 'src/services/rateLimitMessages.js';
// 引入 BLACK_CIRCLE，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from '../../constants/figures.js';
// 引入 Box、NoSelect、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, NoSelect, Text } from '../../ink.js';
// 接入 API_ERROR_MESSAGE_PREFIX、API_TIMEOUT_ERROR_MESSAGE、CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE、CUSTOM_OFF_SWITCH_MESSAGE、INVALID_API_KEY_ERROR_MESSAGE、INVALID_API_KEY_ERROR_MESSAGE_EXTERNAL、ORG_DISABLED_ERROR_MESSAGE_ENV_KEY、ORG_DISABLED_ERROR_MESSAGE_ENV_KEY_WITH_OAUTH、PROMPT_TOO_LONG_ERROR_MESSAGE、startsWithApiErrorPrefix、TOKEN_REVOKED_ERROR_MESSAGE 服务层能力，把外部通信或共享状态交给 ../../services/api/errors.js 处理。
import { API_ERROR_MESSAGE_PREFIX, API_TIMEOUT_ERROR_MESSAGE, CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE, CUSTOM_OFF_SWITCH_MESSAGE, INVALID_API_KEY_ERROR_MESSAGE, INVALID_API_KEY_ERROR_MESSAGE_EXTERNAL, ORG_DISABLED_ERROR_MESSAGE_ENV_KEY, ORG_DISABLED_ERROR_MESSAGE_ENV_KEY_WITH_OAUTH, PROMPT_TOO_LONG_ERROR_MESSAGE, startsWithApiErrorPrefix, TOKEN_REVOKED_ERROR_MESSAGE } from '../../services/api/errors.js';
// 复用 isEmptyMessageText、NO_RESPONSE_REQUESTED 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { isEmptyMessageText, NO_RESPONSE_REQUESTED } from '../../utils/messages.js';
// 复用 getUpgradeMessage 工具函数，把通用处理留在 ../../utils/model/contextWindowUpgradeCheck.js 中维护。
import { getUpgradeMessage } from '../../utils/model/contextWindowUpgradeCheck.js';
// 复用 getDefaultSonnetModel、renderModelName 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getDefaultSonnetModel, renderModelName } from '../../utils/model/model.js';
// 复用 isMacOsKeychainLocked 工具函数，把通用处理留在 ../../utils/secureStorage/macOsKeychainStorage.js 中维护。
import { isMacOsKeychainLocked } from '../../utils/secureStorage/macOsKeychainStorage.js';
// 引入 CtrlOToExpand，将 ../CtrlOToExpand.js 中已经封装好的能力接到本文件流程里。
import { CtrlOToExpand } from '../CtrlOToExpand.js';
// 引入 InterruptedByUser，将 ../InterruptedByUser.js 中已经封装好的能力接到本文件流程里。
import { InterruptedByUser } from '../InterruptedByUser.js';
// 引入 Markdown，将 ../Markdown.js 中已经封装好的能力接到本文件流程里。
import { Markdown } from '../Markdown.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// 引入 MessageActionsSelectedContext，将 ../messageActions.js 中已经封装好的能力接到本文件流程里。
import { MessageActionsSelectedContext } from '../messageActions.js';
// 引入 RateLimitMessage，将 ./RateLimitMessage.js 中已经封装好的能力接到本文件流程里。
import { RateLimitMessage } from './RateLimitMessage.js';
// MAX_API_ERROR_CHARS 错误信息保存`1000`，供终端 UI Assistant Text Messa...后续判断或输出使用。
const MAX_API_ERROR_CHARS = 1000;
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  param: TextBlockParam;
  addMargin: boolean;
  shouldShowDot: boolean;
  verbose: boolean;
  width?: number | string;
  // 这个回调绑定到 onOpenRateLimitOptions?: () => void;，负责终端渲染在该局部场景下的响应。
  onOpenRateLimitOptions?: () => void;
};
// InvalidApiKeyMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function InvalidApiKeyMessage() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // t0 暂存 `isMacOsKeychainLocked()` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `isMacOsKeychainLocked()` 生成的渲染片段，后续返回路径直接复用。
    t0 = isMacOsKeychainLocked();
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // isKeychainLocked标记终端 UI Assistant Text Messa...是否启用对应路径。
  const isKeychainLocked = t0;
  // t1 暂存 `<MessageResponse><Box flexDirection="column"><Text color=...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<MessageResponse><Box flexDirection="column"><Text color=...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <MessageResponse><Box flexDirection="column"><Text color="error">{INVALID_API_KEY_ERROR_MESSAGE}</Text>{isKeychainLocked && <Text dimColor={true}>· Run in another terminal: security unlock-keychain</Text>}</Box></MessageResponse>;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// AssistantTextMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AssistantTextMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(34);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    param: t1,
    addMargin,
    shouldShowDot,
    verbose,
    onOpenRateLimitOptions
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text
  } = t1;
  // isSelected记录 `useContext` 是否成立，终端渲染随后按该结果分支。
  const isSelected = useContext(MessageActionsSelectedContext);
  // 满足 `isEmptyMessageText(text)` 时，终端渲染执行该分支。
  if (isEmptyMessageText(text)) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 满足 `isRateLimitErrorMessage(text)` 时，终端渲染执行该分支。
  if (isRateLimitErrorMessage(text)) {
    // t2 暂存 `<RateLimitMessage text={text} onOpenRateLimitOptions={onO...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== onOpenRateLimitOptions || $[1] !== text) {
      // t2 暂存 `<RateLimitMessage text={text} onOpenRateLimitOptions={onO...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <RateLimitMessage text={text} onOpenRateLimitOptions={onOpenRateLimitOptions} />;
      // $[0] 缓存 `onOpenRateLimitOptions`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = onOpenRateLimitOptions;
      // $[1] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = text;
      // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[2];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 按照 text 的取值选择终端渲染的具体处理分支。
  switch (text) {
    case NO_RESPONSE_REQUESTED:
      {
        // 返回 `null`，作为终端渲染这次计算的结果。
        return null;
      }
    case PROMPT_TOO_LONG_ERROR_MESSAGE:
      {
        // t2 暂存 `getUpgradeMessage("warning")` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `getUpgradeMessage("warning")` 生成的渲染片段，后续返回路径直接复用。
          t2 = getUpgradeMessage("warning");
          // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[3] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[3];
        }
        // upgradeHint 命名 `t2`，让后续代码直接表达这个值的用途。
        const upgradeHint = t2;
        // t3 暂存 `<MessageResponse height={1}><Text color="error">Context l...` 的派生结果，便于缓存命中时直接复用。
        let t3;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
          // t3 暂存 `<MessageResponse height={1}><Text color="error">Context l...` 生成的渲染片段，后续返回路径直接复用。
          t3 = <MessageResponse height={1}><Text color="error">Context limit reached · /compact or /clear to continue{upgradeHint ? ` · ${upgradeHint}` : ""}</Text></MessageResponse>;
          // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[4] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[4];
        }
        // 返回 `t3`，作为终端渲染这次计算的结果。
        return t3;
      }
    case CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE:
      {
        // t2 暂存 `<MessageResponse height={1}><Text color="error">Credit ba...` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `<MessageResponse height={1}><Text color="error">Credit ba...` 生成的渲染片段，后续返回路径直接复用。
          t2 = <MessageResponse height={1}><Text color="error">Credit balance too low · Add funds: https://platform.claude.com/settings/billing</Text></MessageResponse>;
          // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[5] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[5];
        }
        // 返回 `t2`，作为终端渲染这次计算的结果。
        return t2;
      }
    case INVALID_API_KEY_ERROR_MESSAGE:
      {
        // t2 暂存 `<InvalidApiKeyMessage />` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `<InvalidApiKeyMessage />` 生成的渲染片段，后续返回路径直接复用。
          t2 = <InvalidApiKeyMessage />;
          // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[6] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[6];
        }
        // 返回 `t2`，作为终端渲染这次计算的结果。
        return t2;
      }
    case INVALID_API_KEY_ERROR_MESSAGE_EXTERNAL:
      {
        // t2 暂存 `<MessageResponse height={1}><Text color="error">{INVALID_...` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `<MessageResponse height={1}><Text color="error">{INVALID_...` 生成的渲染片段，后续返回路径直接复用。
          t2 = <MessageResponse height={1}><Text color="error">{INVALID_API_KEY_ERROR_MESSAGE_EXTERNAL}</Text></MessageResponse>;
          // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[7] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[7];
        }
        // 返回 `t2`，作为终端渲染这次计算的结果。
        return t2;
      }
    case ORG_DISABLED_ERROR_MESSAGE_ENV_KEY:
    case ORG_DISABLED_ERROR_MESSAGE_ENV_KEY_WITH_OAUTH:
      {
        // t2 暂存 `<MessageResponse><Text color="error">{text}</Text></Messa...` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[8] !== text) {
          // t2 暂存 `<MessageResponse><Text color="error">{text}</Text></Messa...` 生成的渲染片段，后续返回路径直接复用。
          t2 = <MessageResponse><Text color="error">{text}</Text></MessageResponse>;
          // $[8] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
          $[8] = text;
          // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[9] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[9];
        }
        // 返回 `t2`，作为终端渲染这次计算的结果。
        return t2;
      }
    case TOKEN_REVOKED_ERROR_MESSAGE:
      {
        // t2 暂存 `<MessageResponse height={1}><Text color="error">{TOKEN_RE...` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `<MessageResponse height={1}><Text color="error">{TOKEN_RE...` 生成的渲染片段，后续返回路径直接复用。
          t2 = <MessageResponse height={1}><Text color="error">{TOKEN_REVOKED_ERROR_MESSAGE}</Text></MessageResponse>;
          // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[10] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[10];
        }
        // 返回 `t2`，作为终端渲染这次计算的结果。
        return t2;
      }
    case API_TIMEOUT_ERROR_MESSAGE:
      {
        // t2 暂存 `<MessageResponse height={1}><Text color="error">{API_TIME...` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `<MessageResponse height={1}><Text color="error">{API_TIME...` 生成的渲染片段，后续返回路径直接复用。
          t2 = <MessageResponse height={1}><Text color="error">{API_TIMEOUT_ERROR_MESSAGE}{process.env.API_TIMEOUT_MS && <>{" "}(API_TIMEOUT_MS={process.env.API_TIMEOUT_MS}ms, try increasing it)</>}</Text></MessageResponse>;
          // $[11] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[11] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[11];
        }
        // 返回 `t2`，作为终端渲染这次计算的结果。
        return t2;
      }
    case CUSTOM_OFF_SWITCH_MESSAGE:
      {
        // t2 暂存 `<Text color="error">We are experiencing high demand for O...` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `<Text color="error">We are experiencing high demand for O...` 生成的渲染片段，后续返回路径直接复用。
          t2 = <Text color="error">We are experiencing high demand for Opus 4.</Text>;
          // $[12] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[12] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[12];
        }
        // t3 暂存 `<MessageResponse><Box flexDirection="column" gap={1}>{t2}...` 的派生结果，便于缓存命中时直接复用。
        let t3;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
          // t3 暂存 `<MessageResponse><Box flexDirection="column" gap={1}>{t2}...` 生成的渲染片段，后续返回路径直接复用。
          t3 = <MessageResponse><Box flexDirection="column" gap={1}>{t2}<Text>To continue immediately, use /model to switch to{" "}{renderModelName(getDefaultSonnetModel())} and continue coding.</Text></Box></MessageResponse>;
          // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[13] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[13];
        }
        // 返回 `t3`，作为终端渲染这次计算的结果。
        return t3;
      }
    case ERROR_MESSAGE_USER_ABORT:
      {
        // t2 暂存 `<MessageResponse height={1}><InterruptedByUser /></Messag...` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
          // t2 暂存 `<MessageResponse height={1}><InterruptedByUser /></Messag...` 生成的渲染片段，后续返回路径直接复用。
          t2 = <MessageResponse height={1}><InterruptedByUser /></MessageResponse>;
          // $[14] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[14] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[14];
        }
        // 返回 `t2`，作为终端渲染这次计算的结果。
        return t2;
      }
    default:
      {
        // 满足 `startsWithApiErrorPrefix(text)` 时，终端渲染执行该分支。
        if (startsWithApiErrorPrefix(text)) {
          // truncated标记终端 UI Assistant Text Messa...是否启用对应路径。
          const truncated = !verbose && text.length > MAX_API_ERROR_CHARS;
          // 临时值 t2格式化`text.slice`，供终端渲染后续处理使用。
          const t2 = text === API_ERROR_MESSAGE_PREFIX ? `${API_ERROR_MESSAGE_PREFIX}: Please wait a moment and try again.` : truncated ? text.slice(0, MAX_API_ERROR_CHARS) + "\u2026" : text;
          // t3 暂存 `<Text color="error">{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
          let t3;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[15] !== t2) {
            // t3 暂存 `<Text color="error">{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
            t3 = <Text color="error">{t2}</Text>;
            // $[15] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
            $[15] = t2;
            // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
            $[16] = t3;
          } else {
            // t3 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
            t3 = $[16];
          }
          // t4 暂存 `truncated && <CtrlOToExpand />` 的派生结果，便于缓存命中时直接复用。
          let t4;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[17] !== truncated) {
            // t4 暂存 `truncated && <CtrlOToExpand />` 生成的渲染片段，后续返回路径直接复用。
            t4 = truncated && <CtrlOToExpand />;
            // $[17] 缓存 `truncated`，下次依赖未变时 React 编译产物可直接复用。
            $[17] = truncated;
            // $[18] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
            $[18] = t4;
          } else {
            // t4 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
            t4 = $[18];
          }
          // t5 暂存 `<MessageResponse><Box flexDirection="column">{t3}{t4}</Bo...` 的派生结果，便于缓存命中时直接复用。
          let t5;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[19] !== t3 || $[20] !== t4) {
            // t5 暂存 `<MessageResponse><Box flexDirection="column">{t3}{t4}</Bo...` 生成的渲染片段，后续返回路径直接复用。
            t5 = <MessageResponse><Box flexDirection="column">{t3}{t4}</Box></MessageResponse>;
            // $[19] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
            $[19] = t3;
            // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
            $[20] = t4;
            // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
            $[21] = t5;
          } else {
            // t5 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
            t5 = $[21];
          }
          // 返回 `t5`，作为终端渲染这次计算的结果。
          return t5;
        }
        // t2保存`addMargin ? 1 : 0`，供后续判断或组装使用。
        const t2 = addMargin ? 1 : 0;
        // t3保存`isSelected ? "messageActionsBackground" : undefined`，供终端 UI Assistant Text Messa...后续判断或输出使用。
        const t3 = isSelected ? "messageActionsBackground" : undefined;
        // t4 暂存 `shouldShowDot && <NoSelect fromLeftEdge={true} minWidth={...` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[22] !== isSelected || $[23] !== shouldShowDot) {
          // t4 暂存 `shouldShowDot && <NoSelect fromLeftEdge={true} minWidth={...` 生成的渲染片段，后续返回路径直接复用。
          t4 = shouldShowDot && <NoSelect fromLeftEdge={true} minWidth={2}><Text color={isSelected ? "suggestion" : "text"}>{BLACK_CIRCLE}</Text></NoSelect>;
          // $[22] 缓存 `isSelected`，下次依赖未变时 React 编译产物可直接复用。
          $[22] = isSelected;
          // $[23] 缓存 `shouldShowDot`，下次依赖未变时 React 编译产物可直接复用。
          $[23] = shouldShowDot;
          // $[24] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[24] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[24];
        }
        // t5 暂存 `<Box flexDirection="column"><Markdown>{text}</Markdown></...` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[25] !== text) {
          // t5 暂存 `<Box flexDirection="column"><Markdown>{text}</Markdown></...` 生成的渲染片段，后续返回路径直接复用。
          t5 = <Box flexDirection="column"><Markdown>{text}</Markdown></Box>;
          // $[25] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
          $[25] = text;
          // $[26] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[26] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[26];
        }
        // t6 暂存 `<Box flexDirection="row">{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
        let t6;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[27] !== t4 || $[28] !== t5) {
          // t6 暂存 `<Box flexDirection="row">{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
          t6 = <Box flexDirection="row">{t4}{t5}</Box>;
          // $[27] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[27] = t4;
          // $[28] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[28] = t5;
          // $[29] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[29] = t6;
        } else {
          // t6 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
          t6 = $[29];
        }
        // t7 暂存 `<Box alignItems="flex-start" flexDirection="row" justifyC...` 的派生结果，便于缓存命中时直接复用。
        let t7;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[30] !== t2 || $[31] !== t3 || $[32] !== t6) {
          // t7 暂存 `<Box alignItems="flex-start" flexDirection="row" justifyC...` 生成的渲染片段，后续返回路径直接复用。
          t7 = <Box alignItems="flex-start" flexDirection="row" justifyContent="space-between" marginTop={t2} width="100%" backgroundColor={t3}>{t6}</Box>;
          // $[30] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[30] = t2;
          // $[31] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[31] = t3;
          // $[32] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[32] = t6;
          // $[33] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
          $[33] = t7;
        } else {
          // t7 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
          t7 = $[33];
        }
        // 返回 `t7`，作为终端渲染这次计算的结果。
        return t7;
      }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUZXh0QmxvY2tQYXJhbSIsIlJlYWN0IiwidXNlQ29udGV4dCIsIkVSUk9SX01FU1NBR0VfVVNFUl9BQk9SVCIsImlzUmF0ZUxpbWl0RXJyb3JNZXNzYWdlIiwiQkxBQ0tfQ0lSQ0xFIiwiQm94IiwiTm9TZWxlY3QiLCJUZXh0IiwiQVBJX0VSUk9SX01FU1NBR0VfUFJFRklYIiwiQVBJX1RJTUVPVVRfRVJST1JfTUVTU0FHRSIsIkNSRURJVF9CQUxBTkNFX1RPT19MT1dfRVJST1JfTUVTU0FHRSIsIkNVU1RPTV9PRkZfU1dJVENIX01FU1NBR0UiLCJJTlZBTElEX0FQSV9LRVlfRVJST1JfTUVTU0FHRSIsIklOVkFMSURfQVBJX0tFWV9FUlJPUl9NRVNTQUdFX0VYVEVSTkFMIiwiT1JHX0RJU0FCTEVEX0VSUk9SX01FU1NBR0VfRU5WX0tFWSIsIk9SR19ESVNBQkxFRF9FUlJPUl9NRVNTQUdFX0VOVl9LRVlfV0lUSF9PQVVUSCIsIlBST01QVF9UT09fTE9OR19FUlJPUl9NRVNTQUdFIiwic3RhcnRzV2l0aEFwaUVycm9yUHJlZml4IiwiVE9LRU5fUkVWT0tFRF9FUlJPUl9NRVNTQUdFIiwiaXNFbXB0eU1lc3NhZ2VUZXh0IiwiTk9fUkVTUE9OU0VfUkVRVUVTVEVEIiwiZ2V0VXBncmFkZU1lc3NhZ2UiLCJnZXREZWZhdWx0U29ubmV0TW9kZWwiLCJyZW5kZXJNb2RlbE5hbWUiLCJpc01hY09zS2V5Y2hhaW5Mb2NrZWQiLCJDdHJsT1RvRXhwYW5kIiwiSW50ZXJydXB0ZWRCeVVzZXIiLCJNYXJrZG93biIsIk1lc3NhZ2VSZXNwb25zZSIsIk1lc3NhZ2VBY3Rpb25zU2VsZWN0ZWRDb250ZXh0IiwiUmF0ZUxpbWl0TWVzc2FnZSIsIk1BWF9BUElfRVJST1JfQ0hBUlMiLCJQcm9wcyIsInBhcmFtIiwiYWRkTWFyZ2luIiwic2hvdWxkU2hvd0RvdCIsInZlcmJvc2UiLCJ3aWR0aCIsIm9uT3BlblJhdGVMaW1pdE9wdGlvbnMiLCJJbnZhbGlkQXBpS2V5TWVzc2FnZSIsIiQiLCJfYyIsInQwIiwiU3ltYm9sIiwiZm9yIiwiaXNLZXljaGFpbkxvY2tlZCIsInQxIiwiQXNzaXN0YW50VGV4dE1lc3NhZ2UiLCJ0ZXh0IiwiaXNTZWxlY3RlZCIsInQyIiwidXBncmFkZUhpbnQiLCJ0MyIsInByb2Nlc3MiLCJlbnYiLCJBUElfVElNRU9VVF9NUyIsInRydW5jYXRlZCIsImxlbmd0aCIsInNsaWNlIiwidDQiLCJ0NSIsInVuZGVmaW5lZCIsInQ2IiwidDciXSwic291cmNlcyI6WyJBc3Npc3RhbnRUZXh0TWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUZXh0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgUmVhY3QsIHsgdXNlQ29udGV4dCB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgRVJST1JfTUVTU0FHRV9VU0VSX0FCT1JUIH0gZnJvbSAnc3JjL3NlcnZpY2VzL2NvbXBhY3QvY29tcGFjdC5qcydcbmltcG9ydCB7IGlzUmF0ZUxpbWl0RXJyb3JNZXNzYWdlIH0gZnJvbSAnc3JjL3NlcnZpY2VzL3JhdGVMaW1pdE1lc3NhZ2VzLmpzJ1xuaW1wb3J0IHsgQkxBQ0tfQ0lSQ0xFIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL2ZpZ3VyZXMuanMnXG5pbXBvcnQgeyBCb3gsIE5vU2VsZWN0LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgQVBJX0VSUk9SX01FU1NBR0VfUFJFRklYLFxuICBBUElfVElNRU9VVF9FUlJPUl9NRVNTQUdFLFxuICBDUkVESVRfQkFMQU5DRV9UT09fTE9XX0VSUk9SX01FU1NBR0UsXG4gIENVU1RPTV9PRkZfU1dJVENIX01FU1NBR0UsXG4gIElOVkFMSURfQVBJX0tFWV9FUlJPUl9NRVNTQUdFLFxuICBJTlZBTElEX0FQSV9LRVlfRVJST1JfTUVTU0FHRV9FWFRFUk5BTCxcbiAgT1JHX0RJU0FCTEVEX0VSUk9SX01FU1NBR0VfRU5WX0tFWSxcbiAgT1JHX0RJU0FCTEVEX0VSUk9SX01FU1NBR0VfRU5WX0tFWV9XSVRIX09BVVRILFxuICBQUk9NUFRfVE9PX0xPTkdfRVJST1JfTUVTU0FHRSxcbiAgc3RhcnRzV2l0aEFwaUVycm9yUHJlZml4LFxuICBUT0tFTl9SRVZPS0VEX0VSUk9SX01FU1NBR0UsXG59IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FwaS9lcnJvcnMuanMnXG5pbXBvcnQge1xuICBpc0VtcHR5TWVzc2FnZVRleHQsXG4gIE5PX1JFU1BPTlNFX1JFUVVFU1RFRCxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBnZXRVcGdyYWRlTWVzc2FnZSB9IGZyb20gJy4uLy4uL3V0aWxzL21vZGVsL2NvbnRleHRXaW5kb3dVcGdyYWRlQ2hlY2suanMnXG5pbXBvcnQge1xuICBnZXREZWZhdWx0U29ubmV0TW9kZWwsXG4gIHJlbmRlck1vZGVsTmFtZSxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvbW9kZWwvbW9kZWwuanMnXG5pbXBvcnQgeyBpc01hY09zS2V5Y2hhaW5Mb2NrZWQgfSBmcm9tICcuLi8uLi91dGlscy9zZWN1cmVTdG9yYWdlL21hY09zS2V5Y2hhaW5TdG9yYWdlLmpzJ1xuaW1wb3J0IHsgQ3RybE9Ub0V4cGFuZCB9IGZyb20gJy4uL0N0cmxPVG9FeHBhbmQuanMnXG5pbXBvcnQgeyBJbnRlcnJ1cHRlZEJ5VXNlciB9IGZyb20gJy4uL0ludGVycnVwdGVkQnlVc2VyLmpzJ1xuaW1wb3J0IHsgTWFya2Rvd24gfSBmcm9tICcuLi9NYXJrZG93bi5qcydcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4uL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IE1lc3NhZ2VBY3Rpb25zU2VsZWN0ZWRDb250ZXh0IH0gZnJvbSAnLi4vbWVzc2FnZUFjdGlvbnMuanMnXG5pbXBvcnQgeyBSYXRlTGltaXRNZXNzYWdlIH0gZnJvbSAnLi9SYXRlTGltaXRNZXNzYWdlLmpzJ1xuXG5jb25zdCBNQVhfQVBJX0VSUk9SX0NIQVJTID0gMTAwMFxuXG50eXBlIFByb3BzID0ge1xuICBwYXJhbTogVGV4dEJsb2NrUGFyYW1cbiAgYWRkTWFyZ2luOiBib29sZWFuXG4gIHNob3VsZFNob3dEb3Q6IGJvb2xlYW5cbiAgdmVyYm9zZTogYm9vbGVhblxuICB3aWR0aD86IG51bWJlciB8IHN0cmluZ1xuICBvbk9wZW5SYXRlTGltaXRPcHRpb25zPzogKCkgPT4gdm9pZFxufVxuXG5mdW5jdGlvbiBJbnZhbGlkQXBpS2V5TWVzc2FnZSgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBpc0tleWNoYWluTG9ja2VkID0gaXNNYWNPc0tleWNoYWluTG9ja2VkKClcblxuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPntJTlZBTElEX0FQSV9LRVlfRVJST1JfTUVTU0FHRX08L1RleHQ+XG4gICAgICAgIHtpc0tleWNoYWluTG9ja2VkICYmIChcbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIMK3IFJ1biBpbiBhbm90aGVyIHRlcm1pbmFsOiBzZWN1cml0eSB1bmxvY2sta2V5Y2hhaW5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gQXNzaXN0YW50VGV4dE1lc3NhZ2Uoe1xuICBwYXJhbTogeyB0ZXh0IH0sXG4gIGFkZE1hcmdpbixcbiAgc2hvdWxkU2hvd0RvdCxcbiAgdmVyYm9zZSxcbiAgb25PcGVuUmF0ZUxpbWl0T3B0aW9ucyxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgaXNTZWxlY3RlZCA9IHVzZUNvbnRleHQoTWVzc2FnZUFjdGlvbnNTZWxlY3RlZENvbnRleHQpXG4gIGlmIChpc0VtcHR5TWVzc2FnZVRleHQodGV4dCkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gSGFuZGxlIGFsbCByYXRlIGxpbWl0IGVycm9yIG1lc3NhZ2VzIGZyb20gZ2V0UmF0ZUxpbWl0RXJyb3JNZXNzYWdlXG4gIC8vIFVzZSB0aGUgZXhwb3J0ZWQgZnVuY3Rpb24gdG8gYXZvaWQgZnJhZ2lsZSBzdHJpbmcgY291cGxpbmdcbiAgaWYgKGlzUmF0ZUxpbWl0RXJyb3JNZXNzYWdlKHRleHQpKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxSYXRlTGltaXRNZXNzYWdlXG4gICAgICAgIHRleHQ9e3RleHR9XG4gICAgICAgIG9uT3BlblJhdGVMaW1pdE9wdGlvbnM9e29uT3BlblJhdGVMaW1pdE9wdGlvbnN9XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIHN3aXRjaCAodGV4dCkge1xuICAgIC8vIExvY2FsIEpTWCBjb21tYW5kcyBkb24ndCBuZWVkIGEgcmVzcG9uc2UsIGJ1dCB3ZSBzdGlsbCB3YW50IENsYXVkZSB0byBzZWUgdGhlbVxuICAgIC8vIFRvb2wgcmVzdWx0cyByZW5kZXIgdGhlaXIgb3duIGludGVycnVwdCBtZXNzYWdlc1xuICAgIGNhc2UgTk9fUkVTUE9OU0VfUkVRVUVTVEVEOlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgIGNhc2UgUFJPTVBUX1RPT19MT05HX0VSUk9SX01FU1NBR0U6IHtcbiAgICAgIGNvbnN0IHVwZ3JhZGVIaW50ID0gZ2V0VXBncmFkZU1lc3NhZ2UoJ3dhcm5pbmcnKVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZSBoZWlnaHQ9ezF9PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICAgIENvbnRleHQgbGltaXQgcmVhY2hlZCDCtyAvY29tcGFjdCBvciAvY2xlYXIgdG8gY29udGludWVcbiAgICAgICAgICAgIHt1cGdyYWRlSGludCA/IGAgwrcgJHt1cGdyYWRlSGludH1gIDogJyd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIClcbiAgICB9XG5cbiAgICBjYXNlIENSRURJVF9CQUxBTkNFX1RPT19MT1dfRVJST1JfTUVTU0FHRTpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxNZXNzYWdlUmVzcG9uc2UgaGVpZ2h0PXsxfT5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAgICBDcmVkaXQgYmFsYW5jZSB0b28gbG93ICZtaWRkb3Q7IEFkZCBmdW5kczpcbiAgICAgICAgICAgIGh0dHBzOi8vcGxhdGZvcm0uY2xhdWRlLmNvbS9zZXR0aW5ncy9iaWxsaW5nXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIClcblxuICAgIGNhc2UgSU5WQUxJRF9BUElfS0VZX0VSUk9SX01FU1NBR0U6XG4gICAgICByZXR1cm4gPEludmFsaWRBcGlLZXlNZXNzYWdlIC8+XG5cbiAgICBjYXNlIElOVkFMSURfQVBJX0tFWV9FUlJPUl9NRVNTQUdFX0VYVEVSTkFMOlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZSBoZWlnaHQ9ezF9PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj57SU5WQUxJRF9BUElfS0VZX0VSUk9SX01FU1NBR0VfRVhURVJOQUx9PC9UZXh0PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIClcblxuICAgIGNhc2UgT1JHX0RJU0FCTEVEX0VSUk9SX01FU1NBR0VfRU5WX0tFWTpcbiAgICBjYXNlIE9SR19ESVNBQkxFRF9FUlJPUl9NRVNTQUdFX0VOVl9LRVlfV0lUSF9PQVVUSDpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPnt0ZXh0fTwvVGV4dD5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApXG5cbiAgICBjYXNlIFRPS0VOX1JFVk9LRURfRVJST1JfTUVTU0FHRTpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxNZXNzYWdlUmVzcG9uc2UgaGVpZ2h0PXsxfT5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+e1RPS0VOX1JFVk9LRURfRVJST1JfTUVTU0FHRX08L1RleHQ+XG4gICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgKVxuXG4gICAgY2FzZSBBUElfVElNRU9VVF9FUlJPUl9NRVNTQUdFOlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZSBoZWlnaHQ9ezF9PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICAgIHtBUElfVElNRU9VVF9FUlJPUl9NRVNTQUdFfVxuICAgICAgICAgICAge3Byb2Nlc3MuZW52LkFQSV9USU1FT1VUX01TICYmIChcbiAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAgICAgIChBUElfVElNRU9VVF9NUz17cHJvY2Vzcy5lbnYuQVBJX1RJTUVPVVRfTVN9bXMsIHRyeSBpbmNyZWFzaW5nXG4gICAgICAgICAgICAgICAgaXQpXG4gICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgKVxuXG4gICAgY2FzZSBDVVNUT01fT0ZGX1NXSVRDSF9NRVNTQUdFOlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPlxuICAgICAgICAgICAgICBXZSBhcmUgZXhwZXJpZW5jaW5nIGhpZ2ggZGVtYW5kIGZvciBPcHVzIDQuXG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgVG8gY29udGludWUgaW1tZWRpYXRlbHksIHVzZSAvbW9kZWwgdG8gc3dpdGNoIHRveycgJ31cbiAgICAgICAgICAgICAge3JlbmRlck1vZGVsTmFtZShnZXREZWZhdWx0U29ubmV0TW9kZWwoKSl9IGFuZCBjb250aW51ZSBjb2RpbmcuXG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgKVxuXG4gICAgLy8gVE9ETzogTW92ZSB0aGlzIHRvIGEgdXNlciB0dXJuXG4gICAgY2FzZSBFUlJPUl9NRVNTQUdFX1VTRVJfQUJPUlQ6XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgICAgPEludGVycnVwdGVkQnlVc2VyIC8+XG4gICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgKVxuXG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChzdGFydHNXaXRoQXBpRXJyb3JQcmVmaXgodGV4dCkpIHtcbiAgICAgICAgY29uc3QgdHJ1bmNhdGVkID0gIXZlcmJvc2UgJiYgdGV4dC5sZW5ndGggPiBNQVhfQVBJX0VSUk9SX0NIQVJTXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAgICAgICAge3RleHQgPT09IEFQSV9FUlJPUl9NRVNTQUdFX1BSRUZJWFxuICAgICAgICAgICAgICAgICAgPyBgJHtBUElfRVJST1JfTUVTU0FHRV9QUkVGSVh9OiBQbGVhc2Ugd2FpdCBhIG1vbWVudCBhbmQgdHJ5IGFnYWluLmBcbiAgICAgICAgICAgICAgICAgIDogdHJ1bmNhdGVkXG4gICAgICAgICAgICAgICAgICAgID8gdGV4dC5zbGljZSgwLCBNQVhfQVBJX0VSUk9SX0NIQVJTKSArICfigKYnXG4gICAgICAgICAgICAgICAgICAgIDogdGV4dH1cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICB7dHJ1bmNhdGVkICYmIDxDdHJsT1RvRXhwYW5kIC8+fVxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxCb3hcbiAgICAgICAgICBhbGlnbkl0ZW1zPVwiZmxleC1zdGFydFwiXG4gICAgICAgICAgZmxleERpcmVjdGlvbj1cInJvd1wiXG4gICAgICAgICAganVzdGlmeUNvbnRlbnQ9XCJzcGFjZS1iZXR3ZWVuXCJcbiAgICAgICAgICBtYXJnaW5Ub3A9e2FkZE1hcmdpbiA/IDEgOiAwfVxuICAgICAgICAgIHdpZHRoPVwiMTAwJVwiXG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yPXtpc1NlbGVjdGVkID8gJ21lc3NhZ2VBY3Rpb25zQmFja2dyb3VuZCcgOiB1bmRlZmluZWR9XG4gICAgICAgID5cbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgICAgIHtzaG91bGRTaG93RG90ICYmIChcbiAgICAgICAgICAgICAgPE5vU2VsZWN0IGZyb21MZWZ0RWRnZSBtaW5XaWR0aD17Mn0+XG4gICAgICAgICAgICAgICAgPFRleHQgY29sb3I9e2lzU2VsZWN0ZWQgPyAnc3VnZ2VzdGlvbicgOiAndGV4dCd9PlxuICAgICAgICAgICAgICAgICAge0JMQUNLX0NJUkNMRX1cbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDwvTm9TZWxlY3Q+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICAgIDxNYXJrZG93bj57dGV4dH08L01hcmtkb3duPlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvQm94PlxuICAgICAgKVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxjQUFjLFFBQVEsdUNBQXVDO0FBQzNFLE9BQU9DLEtBQUssSUFBSUMsVUFBVSxRQUFRLE9BQU87QUFDekMsU0FBU0Msd0JBQXdCLFFBQVEsaUNBQWlDO0FBQzFFLFNBQVNDLHVCQUF1QixRQUFRLG1DQUFtQztBQUMzRSxTQUFTQyxZQUFZLFFBQVEsNEJBQTRCO0FBQ3pELFNBQVNDLEdBQUcsRUFBRUMsUUFBUSxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUNsRCxTQUNFQyx3QkFBd0IsRUFDeEJDLHlCQUF5QixFQUN6QkMsb0NBQW9DLEVBQ3BDQyx5QkFBeUIsRUFDekJDLDZCQUE2QixFQUM3QkMsc0NBQXNDLEVBQ3RDQyxrQ0FBa0MsRUFDbENDLDZDQUE2QyxFQUM3Q0MsNkJBQTZCLEVBQzdCQyx3QkFBd0IsRUFDeEJDLDJCQUEyQixRQUN0Qiw4QkFBOEI7QUFDckMsU0FDRUMsa0JBQWtCLEVBQ2xCQyxxQkFBcUIsUUFDaEIseUJBQXlCO0FBQ2hDLFNBQVNDLGlCQUFpQixRQUFRLGdEQUFnRDtBQUNsRixTQUNFQyxxQkFBcUIsRUFDckJDLGVBQWUsUUFDViw0QkFBNEI7QUFDbkMsU0FBU0MscUJBQXFCLFFBQVEsbURBQW1EO0FBQ3pGLFNBQVNDLGFBQWEsUUFBUSxxQkFBcUI7QUFDbkQsU0FBU0MsaUJBQWlCLFFBQVEseUJBQXlCO0FBQzNELFNBQVNDLFFBQVEsUUFBUSxnQkFBZ0I7QUFDekMsU0FBU0MsZUFBZSxRQUFRLHVCQUF1QjtBQUN2RCxTQUFTQyw2QkFBNkIsUUFBUSxzQkFBc0I7QUFDcEUsU0FBU0MsZ0JBQWdCLFFBQVEsdUJBQXVCO0FBRXhELE1BQU1DLG1CQUFtQixHQUFHLElBQUk7QUFFaEMsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLEtBQUssRUFBRWxDLGNBQWM7RUFDckJtQyxTQUFTLEVBQUUsT0FBTztF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
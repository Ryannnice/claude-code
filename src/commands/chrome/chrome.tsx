// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useState } from 'react';
// 复用 OptionWithDescription、Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { type OptionWithDescription, Select } from '../../components/CustomSelect/select.js';
// 复用 Dialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { Dialog } from '../../components/design-system/Dialog.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isClaudeAISubscriber } from '../../utils/auth.js';
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js';
// 复用 CLAUDE_IN_CHROME_MCP_SERVER_NAME、openInChrome 工具函数，把通用处理留在 ../../utils/claudeInChrome/common.js 中维护。
import { CLAUDE_IN_CHROME_MCP_SERVER_NAME, openInChrome } from '../../utils/claudeInChrome/common.js';
// 复用 isChromeExtensionInstalled 工具函数，把通用处理留在 ../../utils/claudeInChrome/setup.js 中维护。
import { isChromeExtensionInstalled } from '../../utils/claudeInChrome/setup.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js';
// 复用 isRunningOnHomespace 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isRunningOnHomespace } from '../../utils/envUtils.js';
// CHROME_EXTENSION_URL固定为 `'https://claude.ai/chrome'`，作为命令处理斜杠命令 chrome后续展示或比较的基准。
const CHROME_EXTENSION_URL = 'https://claude.ai/chrome';
// CHROME_PERMISSIONS_URL 权限数据 命名 `'https://clau.de/chrome/permissions'`，让后续代码直接表达这个值的用途。
const CHROME_PERMISSIONS_URL = 'https://clau.de/chrome/permissions';
// CHROME_RECONNECT_URL固定为 `'https://clau.de/chrome/reconnect'`，作为命令处理斜杠命令 chrome后续展示或比较的基准。
const CHROME_RECONNECT_URL = 'https://clau.de/chrome/reconnect';
// MenuAction 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type MenuAction = 'install-extension' | 'reconnect' | 'manage-permissions' | 'toggle-default';
// Props 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: (result?: string) => void;，负责命令处理在该局部场景下的响应。
  onDone: (result?: string) => void;
  isExtensionInstalled: boolean;
  configEnabled: boolean | undefined;
  isClaudeAISubscriber: boolean;
  isWSL: boolean;
};
// ClaudeInChromeMenu 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ClaudeInChromeMenu(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(41);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    isExtensionInstalled: installed,
    configEnabled,
    isClaudeAISubscriber,
    isWSL
  } = t0;
  // mcpClients 集合保存`useAppState`，供命令处理后续处理使用。
  const mcpClients = useAppState(_temp);
  // selectKey 由 React state 持有，setSelectKey 会在用户操作或异步结果返回时触发刷新。
  const [selectKey, setSelectKey] = useState(0);
  // enabledByDefault 由 React state 持有，setEnabledByDefault 会在用户操作或异步结果返回时触发刷新。
  const [enabledByDefault, setEnabledByDefault] = useState(configEnabled ?? false);
  // showInstallHint 由 React state 持有，setShowInstallHint 会在用户操作或异步结果返回时触发刷新。
  const [showInstallHint, setShowInstallHint] = useState(false);
  // isExtensionInstalled 由 React state 持有，setIsExtensionInstalled 会在用户操作或异步结果返回时触发刷新。
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(installed);
  // t1 暂存 `false && isRunningOnHomespace()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `false && isRunningOnHomespace()` 生成的渲染片段，后续返回路径直接复用。
    t1 = false && isRunningOnHomespace();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // isHomespace标记命令处理斜杠命令 chrome是否启用对应路径。
  const isHomespace = t1;
  // t2 暂存 `mcpClients.find(_temp2)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== mcpClients) {
    // t2 暂存 `mcpClients.find(_temp2)` 生成的渲染片段，后续返回路径直接复用。
    t2 = mcpClients.find(_temp2);
    // $[1] 缓存 `mcpClients`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = mcpClients;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // chromeClient保存`t2`，作为后续临时缓存值处理的输入。
  const chromeClient = t2;
  // isConnected标记命令处理斜杠命令 chrome是否启用对应路径。
  const isConnected = chromeClient?.type === "connected";
  // t3 暂存 `function openUrl(url) {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `function openUrl(url) {` 生成的渲染片段，后续返回路径直接复用。
    t3 = function openUrl(url) {
      // 满足 `isHomespace` 时，命令处理执行该分支。
      if (isHomespace) {
        // 调用 openBrowser，触发命令处理此处需要的副作用。
        openBrowser(url);
      } else {
        // 调用 openInChrome，触发命令处理此处需要的副作用。
        openInChrome(url);
      }
    };
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // openUrl保存`t3`，作为后续临时缓存值处理的输入。
  const openUrl = t3;
  // t4 暂存 `function handleAction(action) {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== enabledByDefault) {
    // t4 暂存 `function handleAction(action) {` 生成的渲染片段，后续返回路径直接复用。
    t4 = function handleAction(action) {
      // 斜杠命令 chrome在这里处理 `bb22: switch (action) {`，完成这一小步状态转换。
      bb22: switch (action) {
        case "install-extension":
          {
            // setSelectKey 写入新的状态值，使命令处理后续读取保持一致。
            setSelectKey(_temp3);
            // setShowInstallHint 写入新的状态值，使命令处理后续读取保持一致。
            setShowInstallHint(true);
            // 调用 openUrl，触发命令处理此处需要的副作用。
            openUrl(CHROME_EXTENSION_URL);
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break bb22;
          }
        case "reconnect":
          {
            // setSelectKey 写入新的状态值，使命令处理后续读取保持一致。
            setSelectKey(_temp4);
            // 调用 isChromeExtensionInstalled，触发命令处理此处需要的副作用。
            isChromeExtensionInstalled().then(installed_0 => {
              // setIsExtensionInstalled 写入新的状态值，使命令处理后续读取保持一致。
              setIsExtensionInstalled(installed_0);
              // 满足 `installed_0` 时，命令处理执行该分支。
              if (installed_0) {
                // setShowInstallHint 写入新的状态值，使命令处理后续读取保持一致。
                setShowInstallHint(false);
              }
            });
            // 调用 openUrl，触发命令处理此处需要的副作用。
            openUrl(CHROME_RECONNECT_URL);
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break bb22;
          }
        case "manage-permissions":
          {
            // setSelectKey 写入新的状态值，使命令处理后续读取保持一致。
            setSelectKey(_temp5);
            // 调用 openUrl，触发命令处理此处需要的副作用。
            openUrl(CHROME_PERMISSIONS_URL);
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break bb22;
          }
        case "toggle-default":
          {
            // newValue标记命令处理斜杠命令 chrome是否启用对应路径。
            const newValue = !enabledByDefault;
            // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
            saveGlobalConfig(current => ({
              ...current,
              claudeInChromeDefaultEnabled: newValue
            }));
            // setEnabledByDefault 写入新的状态值，使命令处理后续读取保持一致。
            setEnabledByDefault(newValue);
          }
      }
    };
    // $[4] 缓存 `enabledByDefault`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = enabledByDefault;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // handleAction沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleAction = t4;
  // 选项 先占位，稍后的条件分支会根据实际输入补齐它。
  let options;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== enabledByDefault || $[7] !== isExtensionInstalled) {
    // 选项更新为 `[]`，确保斜杠命令后续读取最新状态。
    options = [];
    // requiresExtensionSuffix保存`isExtensionInstalled ? "" : " (requires extension)"`，供后续判断或组装使用。
    const requiresExtensionSuffix = isExtensionInstalled ? "" : " (requires extension)";
    // 只有 `!isExtensionInstalled && !isHomespace` 满足时，命令处理才执行该分支。
    if (!isExtensionInstalled && !isHomespace) {
      // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t5;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t5 = {
          label: "Install Chrome extension",
          value: "install-extension"
        };
        // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[9] = t5;
      } else {
        // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
        t5 = $[9];
      }
      // 选项追加新条目，保持收集顺序与输入顺序一致。
      options.push(t5);
    }
    // t5 暂存 `<Text>Manage permissions</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<Text>Manage permissions</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text>Manage permissions</Text>;
      // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[10];
    }
    // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[11] !== requiresExtensionSuffix) {
      // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t6 = {
        label: <>{t5}<Text dimColor={true}>{requiresExtensionSuffix}</Text></>,
        value: "manage-permissions"
      };
      // $[11] 缓存 `requiresExtensionSuffix`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = requiresExtensionSuffix;
      // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[12];
    }
    // t7 暂存 `<Text>Reconnect extension</Text>` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      // t7 暂存 `<Text>Reconnect extension</Text>` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text>Reconnect extension</Text>;
      // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[13];
    }
    // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[14] !== requiresExtensionSuffix) {
      // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t8 = {
        label: <>{t7}<Text dimColor={true}>{requiresExtensionSuffix}</Text></>,
        value: "reconnect"
      };
      // $[14] 缓存 `requiresExtensionSuffix`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = requiresExtensionSuffix;
      // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[15];
    }
    // t9保存``Enabled by default: ${enabledByDefault ? "Yes" : "No"}``，作为后续固定文本处理的输入。
    const t9 = `Enabled by default: ${enabledByDefault ? "Yes" : "No"}`;
    // t10 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[16] !== t9) {
      // t10 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t10 = {
        label: t9,
        value: "toggle-default"
      };
      // $[16] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t9;
      // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[17];
    }
    // 选项追加新条目，保持收集顺序与输入顺序一致。
    options.push(t6, t8, t10);
    // $[6] 缓存 `enabledByDefault`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = enabledByDefault;
    // $[7] 缓存 `isExtensionInstalled`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = isExtensionInstalled;
    // $[8] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = options;
  } else {
    // 选项更新为 `$[8]`，确保斜杠命令后续读取最新状态。
    options = $[8];
  }
  // isDisabled标记命令处理斜杠命令 chrome是否启用对应路径。
  const isDisabled = isWSL || true && !isClaudeAISubscriber;
  // t5 暂存 `() => onDone()` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== onDone) {
    // t5 暂存 `() => onDone()` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => onDone();
    // $[18] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = onDone;
    // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[19];
  }
  // t6 暂存 `<Text>Claude in Chrome works with the Chrome extension to...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Text>Claude in Chrome works with the Chrome extension to...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text>Claude in Chrome works with the Chrome extension to let you control your browser directly from Claude Code. Navigate websites, fill forms, capture screenshots, record GIFs, and debug with console logs and network requests.</Text>;
    // $[20] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[20];
  }
  // t7 暂存 `isWSL && <Text color="error">Claude in Chrome is not supp...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== isWSL) {
    // t7 暂存 `isWSL && <Text color="error">Claude in Chrome is not supp...` 生成的渲染片段，后续返回路径直接复用。
    t7 = isWSL && <Text color="error">Claude in Chrome is not supported in WSL at this time.</Text>;
    // $[21] 缓存 `isWSL`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = isWSL;
    // $[22] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[22];
  }
  // t8 暂存 `true && !isClaudeAISubscriber && <Text color="error">Clau...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== isClaudeAISubscriber) {
    // t8 暂存 `true && !isClaudeAISubscriber && <Text color="error">Clau...` 生成的渲染片段，后续返回路径直接复用。
    t8 = true && !isClaudeAISubscriber && <Text color="error">Claude in Chrome requires a claude.ai subscription.</Text>;
    // $[23] 缓存 `isClaudeAISubscriber`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = isClaudeAISubscriber;
    // $[24] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[24];
  }
  // t9 暂存 `!isDisabled && <>{!isHomespace && <Box flexDirection="col...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== handleAction || $[26] !== isConnected || $[27] !== isDisabled || $[28] !== isExtensionInstalled || $[29] !== options || $[30] !== selectKey || $[31] !== showInstallHint) {
    // t9 暂存 `!isDisabled && <>{!isHomespace && <Box flexDirection="col...` 生成的渲染片段，后续返回路径直接复用。
    t9 = !isDisabled && <>{!isHomespace && <Box flexDirection="column"><Text>Status:{" "}{isConnected ? <Text color="success">Enabled</Text> : <Text color="inactive">Disabled</Text>}</Text><Text>Extension:{" "}{isExtensionInstalled ? <Text color="success">Installed</Text> : <Text color="warning">Not detected</Text>}</Text></Box>}<Select key={selectKey} options={options} onChange={handleAction} hideIndexes={true} />{showInstallHint && <Text color="warning">Once installed, select {"\"Reconnect extension\""} to connect.</Text>}<Text><Text dimColor={true}>Usage: </Text><Text>claude --chrome</Text><Text dimColor={true}> or </Text><Text>claude --no-chrome</Text></Text><Text dimColor={true}>Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on.</Text></>;
    // $[25] 缓存 `handleAction`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = handleAction;
    // $[26] 缓存 `isConnected`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = isConnected;
    // $[27] 缓存 `isDisabled`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = isDisabled;
    // $[28] 缓存 `isExtensionInstalled`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = isExtensionInstalled;
    // $[29] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = options;
    // $[30] 缓存 `selectKey`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = selectKey;
    // $[31] 缓存 `showInstallHint`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = showInstallHint;
    // $[32] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[32];
  }
  // t10 暂存 `<Text dimColor={true}>Learn more: https://code.claude.com...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `<Text dimColor={true}>Learn more: https://code.claude.com...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text dimColor={true}>Learn more: https://code.claude.com/docs/en/chrome</Text>;
    // $[33] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[33];
  }
  // t11 暂存 `<Box flexDirection="column" gap={1}>{t6}{t7}{t8}{t9}{t10}...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t7 || $[35] !== t8 || $[36] !== t9) {
    // t11 暂存 `<Box flexDirection="column" gap={1}>{t6}{t7}{t8}{t9}{t10}...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box flexDirection="column" gap={1}>{t6}{t7}{t8}{t9}{t10}</Box>;
    // $[34] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t7;
    // $[35] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t8;
    // $[36] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t9;
    // $[37] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[37];
  }
  // t12 暂存 `<Dialog title="Claude in Chrome (Beta)" onCancel={t5} col...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[38] !== t11 || $[39] !== t5) {
    // t12 暂存 `<Dialog title="Claude in Chrome (Beta)" onCancel={t5} col...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Dialog title="Claude in Chrome (Beta)" onCancel={t5} color="chromeYellow">{t11}</Dialog>;
    // $[38] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t11;
    // $[39] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t5;
    // $[40] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[40];
  }
  // 返回 `t12`，作为命令处理这次计算的结果。
  return t12;
}
// _temp5 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(k) {
  // 返回 `k + 1`，作为命令处理这次计算的结果。
  return k + 1;
}
// _temp4 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(k_0) {
  // 返回 `k_0 + 1`，作为命令处理这次计算的结果。
  return k_0 + 1;
}
// _temp3 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(k_1) {
  // 返回 `k_1 + 1`，作为命令处理这次计算的结果。
  return k_1 + 1;
}
// _temp2 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(c) {
  // 返回 `c.name === CLAUDE_IN_CHROME_MCP_SERVER_NAME`，作为命令处理这次计算的结果。
  return c.name === CLAUDE_IN_CHROME_MCP_SERVER_NAME;
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.mcp.clients`，作为命令处理这次计算的结果。
  return s.mcp.clients;
}
// call保存`function`，供命令处理后续处理使用。
export const call = async function (onDone: (result?: string) => void): Promise<React.ReactNode> {
  // isExtensionInstalled记录 `isChromeExtensionInstalled` 是否成立，命令处理随后按该结果分支。
  const isExtensionInstalled = await isChromeExtensionInstalled();
  // 配置读取`getGlobalConfig`，供命令处理后续处理使用。
  const config = getGlobalConfig();
  // isSubscriber记录 `isClaudeAISubscriber` 是否成立，命令处理随后按该结果分支。
  const isSubscriber = isClaudeAISubscriber();
  // isWSL记录 `env.isWslEnvironment` 是否成立，命令处理随后按该结果分支。
  const isWSL = env.isWslEnvironment();
  // 返回 `<ClaudeInChromeMenu onDone={onDone} isExtensionInstalled={isExtensionIn...`，作为命令处理这次计算的结果。
  return <ClaudeInChromeMenu onDone={onDone} isExtensionInstalled={isExtensionInstalled} configEnabled={config.claudeInChromeDefaultEnabled} isClaudeAISubscriber={isSubscriber} isWSL={isWSL} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwiT3B0aW9uV2l0aERlc2NyaXB0aW9uIiwiU2VsZWN0IiwiRGlhbG9nIiwiQm94IiwiVGV4dCIsInVzZUFwcFN0YXRlIiwiaXNDbGF1ZGVBSVN1YnNjcmliZXIiLCJvcGVuQnJvd3NlciIsIkNMQVVERV9JTl9DSFJPTUVfTUNQX1NFUlZFUl9OQU1FIiwib3BlbkluQ2hyb21lIiwiaXNDaHJvbWVFeHRlbnNpb25JbnN0YWxsZWQiLCJnZXRHbG9iYWxDb25maWciLCJzYXZlR2xvYmFsQ29uZmlnIiwiZW52IiwiaXNSdW5uaW5nT25Ib21lc3BhY2UiLCJDSFJPTUVfRVhURU5TSU9OX1VSTCIsIkNIUk9NRV9QRVJNSVNTSU9OU19VUkwiLCJDSFJPTUVfUkVDT05ORUNUX1VSTCIsIk1lbnVBY3Rpb24iLCJQcm9wcyIsIm9uRG9uZSIsInJlc3VsdCIsImlzRXh0ZW5zaW9uSW5zdGFsbGVkIiwiY29uZmlnRW5hYmxlZCIsImlzV1NMIiwiQ2xhdWRlSW5DaHJvbWVNZW51IiwidDAiLCIkIiwiX2MiLCJpbnN0YWxsZWQiLCJtY3BDbGllbnRzIiwiX3RlbXAiLCJzZWxlY3RLZXkiLCJzZXRTZWxlY3RLZXkiLCJlbmFibGVkQnlEZWZhdWx0Iiwic2V0RW5hYmxlZEJ5RGVmYXVsdCIsInNob3dJbnN0YWxsSGludCIsInNldFNob3dJbnN0YWxsSGludCIsInNldElzRXh0ZW5zaW9uSW5zdGFsbGVkIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJpc0hvbWVzcGFjZSIsInQyIiwiZmluZCIsIl90ZW1wMiIsImNocm9tZUNsaWVudCIsImlzQ29ubmVjdGVkIiwidHlwZSIsInQzIiwib3BlblVybCIsInVybCIsInQ0IiwiaGFuZGxlQWN0aW9uIiwiYWN0aW9uIiwiYmIyMiIsIl90ZW1wMyIsIl90ZW1wNCIsInRoZW4iLCJpbnN0YWxsZWRfMCIsIl90ZW1wNSIsIm5ld1ZhbHVlIiwiY3VycmVudCIsImNsYXVkZUluQ2hyb21lRGVmYXVsdEVuYWJsZWQiLCJvcHRpb25zIiwicmVxdWlyZXNFeHRlbnNpb25TdWZmaXgiLCJ0NSIsImxhYmVsIiwidmFsdWUiLCJwdXNoIiwidDYiLCJ0NyIsInQ4IiwidDkiLCJ0MTAiLCJpc0Rpc2FibGVkIiwidDExIiwidDEyIiwiayIsImtfMCIsImtfMSIsImMiLCJuYW1lIiwicyIsIm1jcCIsImNsaWVudHMiLCJjYWxsIiwiUHJvbWlzZSIsIlJlYWN0Tm9kZSIsImNvbmZpZyIsImlzU3Vic2NyaWJlciIsImlzV3NsRW52aXJvbm1lbnQiXSwic291cmNlcyI6WyJjaHJvbWUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtcbiAgdHlwZSBPcHRpb25XaXRoRGVzY3JpcHRpb24sXG4gIFNlbGVjdCxcbn0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgeyBpc0NsYXVkZUFJU3Vic2NyaWJlciB9IGZyb20gJy4uLy4uL3V0aWxzL2F1dGguanMnXG5pbXBvcnQgeyBvcGVuQnJvd3NlciB9IGZyb20gJy4uLy4uL3V0aWxzL2Jyb3dzZXIuanMnXG5pbXBvcnQge1xuICBDTEFVREVfSU5fQ0hST01FX01DUF9TRVJWRVJfTkFNRSxcbiAgb3BlbkluQ2hyb21lLFxufSBmcm9tICcuLi8uLi91dGlscy9jbGF1ZGVJbkNocm9tZS9jb21tb24uanMnXG5pbXBvcnQgeyBpc0Nocm9tZUV4dGVuc2lvbkluc3RhbGxlZCB9IGZyb20gJy4uLy4uL3V0aWxzL2NsYXVkZUluQ2hyb21lL3NldHVwLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHsgZW52IH0gZnJvbSAnLi4vLi4vdXRpbHMvZW52LmpzJ1xuaW1wb3J0IHsgaXNSdW5uaW5nT25Ib21lc3BhY2UgfSBmcm9tICcuLi8uLi91dGlscy9lbnZVdGlscy5qcydcblxuY29uc3QgQ0hST01FX0VYVEVOU0lPTl9VUkwgPSAnaHR0cHM6Ly9jbGF1ZGUuYWkvY2hyb21lJ1xuY29uc3QgQ0hST01FX1BFUk1JU1NJT05TX1VSTCA9ICdodHRwczovL2NsYXUuZGUvY2hyb21lL3Blcm1pc3Npb25zJ1xuY29uc3QgQ0hST01FX1JFQ09OTkVDVF9VUkwgPSAnaHR0cHM6Ly9jbGF1LmRlL2Nocm9tZS9yZWNvbm5lY3QnXG5cbnR5cGUgTWVudUFjdGlvbiA9XG4gIHwgJ2luc3RhbGwtZXh0ZW5zaW9uJ1xuICB8ICdyZWNvbm5lY3QnXG4gIHwgJ21hbmFnZS1wZXJtaXNzaW9ucydcbiAgfCAndG9nZ2xlLWRlZmF1bHQnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uRG9uZTogKHJlc3VsdD86IHN0cmluZykgPT4gdm9pZFxuICBpc0V4dGVuc2lvbkluc3RhbGxlZDogYm9vbGVhblxuICBjb25maWdFbmFibGVkOiBib29sZWFuIHwgdW5kZWZpbmVkXG4gIGlzQ2xhdWRlQUlTdWJzY3JpYmVyOiBib29sZWFuXG4gIGlzV1NMOiBib29sZWFuXG59XG5cbmZ1bmN0aW9uIENsYXVkZUluQ2hyb21lTWVudSh7XG4gIG9uRG9uZSxcbiAgaXNFeHRlbnNpb25JbnN0YWxsZWQ6IGluc3RhbGxlZCxcbiAgY29uZmlnRW5hYmxlZCxcbiAgaXNDbGF1ZGVBSVN1YnNjcmliZXIsXG4gIGlzV1NMLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBtY3BDbGllbnRzID0gdXNlQXBwU3RhdGUocyA9PiBzLm1jcC5jbGllbnRzKVxuICBjb25zdCBbc2VsZWN0S2V5LCBzZXRTZWxlY3RLZXldID0gdXNlU3RhdGUoMClcbiAgY29uc3QgW2VuYWJsZWRCeURlZmF1bHQsIHNldEVuYWJsZWRCeURlZmF1bHRdID0gdXNlU3RhdGUoXG4gICAgY29uZmlnRW5hYmxlZCA/PyBmYWxzZSxcbiAgKVxuICBjb25zdCBbc2hvd0luc3RhbGxIaW50LCBzZXRTaG93SW5zdGFsbEhpbnRdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtpc0V4dGVuc2lvbkluc3RhbGxlZCwgc2V0SXNFeHRlbnNpb25JbnN0YWxsZWRdID0gdXNlU3RhdGUoaW5zdGFsbGVkKVxuXG4gIGNvbnN0IGlzSG9tZXNwYWNlID0gXCJleHRlcm5hbFwiID09PSAnYW50JyAmJiBpc1J1bm5pbmdPbkhvbWVzcGFjZSgpXG5cbiAgY29uc3QgY2hyb21lQ2xpZW50ID0gbWNwQ2xpZW50cy5maW5kKFxuICAgIGMgPT4gYy5uYW1lID09PSBDTEFVREVfSU5fQ0hST01FX01DUF9TRVJWRVJfTkFNRSxcbiAgKVxuICBjb25zdCBpc0Nvbm5lY3RlZCA9IGNocm9tZUNsaWVudD8udHlwZSA9PT0gJ2Nvbm5lY3RlZCdcblxuICBmdW5jdGlvbiBvcGVuVXJsKHVybDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKGlzSG9tZXNwYWNlKSB7XG4gICAgICB2b2lkIG9wZW5Ccm93c2VyKHVybClcbiAgICB9IGVsc2Uge1xuICAgICAgdm9pZCBvcGVuSW5DaHJvbWUodXJsKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUFjdGlvbihhY3Rpb246IE1lbnVBY3Rpb24pOiB2b2lkIHtcbiAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgY2FzZSAnaW5zdGFsbC1leHRlbnNpb24nOlxuICAgICAgICBzZXRTZWxlY3RLZXkoayA9PiBrICsgMSlcbiAgICAgICAgc2V0U2hvd0luc3RhbGxIaW50KHRydWUpXG4gICAgICAgIG9wZW5VcmwoQ0hST01FX0VYVEVOU0lPTl9VUkwpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdyZWNvbm5lY3QnOlxuICAgICAgICBzZXRTZWxlY3RLZXkoayA9PiBrICsgMSlcbiAgICAgICAgdm9pZCBpc0Nocm9tZUV4dGVuc2lvbkluc3RhbGxlZCgpLnRoZW4oaW5zdGFsbGVkID0+IHtcbiAgICAgICAgICBzZXRJc0V4dGVuc2lvbkluc3RhbGxlZChpbnN0YWxsZWQpXG4gICAgICAgICAgaWYgKGluc3RhbGxlZCkge1xuICAgICAgICAgICAgc2V0U2hvd0luc3RhbGxIaW50KGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgb3BlblVybChDSFJPTUVfUkVDT05ORUNUX1VSTClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ21hbmFnZS1wZXJtaXNzaW9ucyc6XG4gICAgICAgIHNldFNlbGVjdEtleShrID0+IGsgKyAxKVxuICAgICAgICBvcGVuVXJsKENIUk9NRV9QRVJNSVNTSU9OU19VUkwpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICd0b2dnbGUtZGVmYXVsdCc6IHtcbiAgICAgICAgY29uc3QgbmV3VmFsdWUgPSAhZW5hYmxlZEJ5RGVmYXVsdFxuICAgICAgICBzYXZlR2xvYmFsQ29uZmlnKGN1cnJlbnQgPT4gKHtcbiAgICAgICAgICAuLi5jdXJyZW50LFxuICAgICAgICAgIGNsYXVkZUluQ2hyb21lRGVmYXVsdEVuYWJsZWQ6IG5ld1ZhbHVlLFxuICAgICAgICB9KSlcbiAgICAgICAgc2V0RW5hYmxlZEJ5RGVmYXVsdChuZXdWYWx1ZSlcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBvcHRpb25zOiBPcHRpb25XaXRoRGVzY3JpcHRpb248TWVudUFjdGlvbj5bXSA9IFtdXG4gIGNvbnN0IHJlcXVpcmVzRXh0ZW5zaW9uU3VmZml4ID0gaXNFeHRlbnNpb25JbnN0YWxsZWRcbiAgICA/ICcnXG4gICAgOiAnIChyZXF1aXJlcyBleHRlbnNpb24pJ1xuXG4gIGlmICghaXNFeHRlbnNpb25JbnN0YWxsZWQgJiYgIWlzSG9tZXNwYWNlKSB7XG4gICAgb3B0aW9ucy5wdXNoKHtcbiAgICAgIGxhYmVsOiAnSW5zdGFsbCBDaHJvbWUgZXh0ZW5zaW9uJyxcbiAgICAgIHZhbHVlOiAnaW5zdGFsbC1leHRlbnNpb24nLFxuICAgIH0pXG4gIH1cblxuICBvcHRpb25zLnB1c2goXG4gICAge1xuICAgICAgbGFiZWw6IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8VGV4dD5NYW5hZ2UgcGVybWlzc2lvbnM8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+e3JlcXVpcmVzRXh0ZW5zaW9uU3VmZml4fTwvVGV4dD5cbiAgICAgICAgPC8+XG4gICAgICApLFxuICAgICAgdmFsdWU6ICdtYW5hZ2UtcGVybWlzc2lvbnMnLFxuICAgIH0sXG4gICAge1xuICAgICAgbGFiZWw6IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8VGV4dD5SZWNvbm5lY3QgZXh0ZW5zaW9uPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPntyZXF1aXJlc0V4dGVuc2lvblN1ZmZpeH08L1RleHQ+XG4gICAgICAgIDwvPlxuICAgICAgKSxcbiAgICAgIHZhbHVlOiAncmVjb25uZWN0JyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGxhYmVsOiBgRW5hYmxlZCBieSBkZWZhdWx0OiAke2VuYWJsZWRCeURlZmF1bHQgPyAnWWVzJyA6ICdObyd9YCxcbiAgICAgIHZhbHVlOiAndG9nZ2xlLWRlZmF1bHQnLFxuICAgIH0sXG4gIClcblxuICBjb25zdCBpc0Rpc2FibGVkID1cbiAgICBpc1dTTCB8fCAoXCJleHRlcm5hbFwiICE9PSAnYW50JyAmJiAhaXNDbGF1ZGVBSVN1YnNjcmliZXIpXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT1cIkNsYXVkZSBpbiBDaHJvbWUgKEJldGEpXCJcbiAgICAgIG9uQ2FuY2VsPXsoKSA9PiBvbkRvbmUoKX1cbiAgICAgIGNvbG9yPVwiY2hyb21lWWVsbG93XCJcbiAgICA+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBDbGF1ZGUgaW4gQ2hyb21lIHdvcmtzIHdpdGggdGhlIENocm9tZSBleHRlbnNpb24gdG8gbGV0IHlvdSBjb250cm9sXG4gICAgICAgICAgeW91ciBicm93c2VyIGRpcmVjdGx5IGZyb20gQ2xhdWRlIENvZGUuIE5hdmlnYXRlIHdlYnNpdGVzLCBmaWxsIGZvcm1zLFxuICAgICAgICAgIGNhcHR1cmUgc2NyZWVuc2hvdHMsIHJlY29yZCBHSUZzLCBhbmQgZGVidWcgd2l0aCBjb25zb2xlIGxvZ3MgYW5kXG4gICAgICAgICAgbmV0d29yayByZXF1ZXN0cy5cbiAgICAgICAgPC9UZXh0PlxuXG4gICAgICAgIHtpc1dTTCAmJiAoXG4gICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPlxuICAgICAgICAgICAgQ2xhdWRlIGluIENocm9tZSBpcyBub3Qgc3VwcG9ydGVkIGluIFdTTCBhdCB0aGlzIHRpbWUuXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApfVxuXG5cbiAgICAgICAge1wiZXh0ZXJuYWxcIiAhPT0gJ2FudCcgJiYgIWlzQ2xhdWRlQUlTdWJzY3JpYmVyICYmIChcbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAgICBDbGF1ZGUgaW4gQ2hyb21lIHJlcXVpcmVzIGEgY2xhdWRlLmFpIHN1YnNjcmlwdGlvbi5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG5cbiAgICAgICAgeyFpc0Rpc2FibGVkICYmIChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgeyFpc0hvbWVzcGFjZSAmJiAoXG4gICAgICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAgU3RhdHVzOnsnICd9XG4gICAgICAgICAgICAgICAgICB7aXNDb25uZWN0ZWQgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VjY2Vzc1wiPkVuYWJsZWQ8L1RleHQ+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cImluYWN0aXZlXCI+RGlzYWJsZWQ8L1RleHQ+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgICAgIEV4dGVuc2lvbjp7JyAnfVxuICAgICAgICAgICAgICAgICAge2lzRXh0ZW5zaW9uSW5zdGFsbGVkID8gKFxuICAgICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1Y2Nlc3NcIj5JbnN0YWxsZWQ8L1RleHQ+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5Ob3QgZGV0ZWN0ZWQ8L1RleHQ+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgICBrZXk9e3NlbGVjdEtleX1cbiAgICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZUFjdGlvbn1cbiAgICAgICAgICAgICAgaGlkZUluZGV4ZXNcbiAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgIHtzaG93SW5zdGFsbEhpbnQgJiYgKFxuICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICAgICAgICBPbmNlIGluc3RhbGxlZCwgc2VsZWN0IHsnXCJSZWNvbm5lY3QgZXh0ZW5zaW9uXCInfSB0byBjb25uZWN0LlxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+VXNhZ2U6IDwvVGV4dD5cbiAgICAgICAgICAgICAgPFRleHQ+Y2xhdWRlIC0tY2hyb21lPC9UZXh0PlxuICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gb3IgPC9UZXh0PlxuICAgICAgICAgICAgICA8VGV4dD5jbGF1ZGUgLS1uby1jaHJvbWU8L1RleHQ+XG4gICAgICAgICAgICA8L1RleHQ+XG5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICBTaXRlLWxldmVsIHBlcm1pc3Npb25zIGFyZSBpbmhlcml0ZWQgZnJvbSB0aGUgQ2hyb21lIGV4dGVuc2lvbi5cbiAgICAgICAgICAgICAgTWFuYWdlIHBlcm1pc3Npb25zIGluIHRoZSBDaHJvbWUgZXh0ZW5zaW9uIHNldHRpbmdzIHRvIGNvbnRyb2xcbiAgICAgICAgICAgICAgd2hpY2ggc2l0ZXMgQ2xhdWRlIGNhbiBicm93c2UsIGNsaWNrLCBhbmQgdHlwZSBvbi5cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKX1cbiAgICAgICAgPFRleHQgZGltQ29sb3I+TGVhcm4gbW9yZTogaHR0cHM6Ly9jb2RlLmNsYXVkZS5jb20vZG9jcy9lbi9jaHJvbWU8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuXG5leHBvcnQgY29uc3QgY2FsbCA9IGFzeW5jIGZ1bmN0aW9uIChcbiAgb25Eb25lOiAocmVzdWx0Pzogc3RyaW5nKSA9PiB2b2lkLFxuKTogUHJvbWlzZTxSZWFjdC5SZWFjdE5vZGU+IHtcbiAgY29uc3QgaXNFeHRlbnNpb25JbnN0YWxsZWQgPSBhd2FpdCBpc0Nocm9tZUV4dGVuc2lvbkluc3RhbGxlZCgpXG4gIGNvbnN0IGNvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG4gIGNvbnN0IGlzU3Vic2NyaWJlciA9IGlzQ2xhdWRlQUlTdWJzY3JpYmVyKClcbiAgY29uc3QgaXNXU0wgPSBlbnYuaXNXc2xFbnZpcm9ubWVudCgpXG5cbiAgcmV0dXJuIChcbiAgICA8Q2xhdWRlSW5DaHJvbWVNZW51XG4gICAgICBvbkRvbmU9e29uRG9uZX1cbiAgICAgIGlzRXh0ZW5zaW9uSW5zdGFsbGVkPXtpc0V4dGVuc2lvbkluc3RhbGxlZH1cbiAgICAgIGNvbmZpZ0VuYWJsZWQ9e2NvbmZpZy5jbGF1ZGVJbkNocm9tZURlZmF1bHRFbmFibGVkfVxuICAgICAgaXNDbGF1ZGVBSVN1YnNjcmliZXI9e2lzU3Vic2NyaWJlcn1cbiAgICAgIGlzV1NMPXtpc1dTTH1cbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUlDLFFBQVEsUUFBUSxPQUFPO0FBQ3ZDLFNBQ0UsS0FBS0MscUJBQXFCLEVBQzFCQyxNQUFNLFFBQ0QseUNBQXlDO0FBQ2hELFNBQVNDLE1BQU0sUUFBUSwwQ0FBMEM7QUFDakUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxXQUFXLFFBQVEseUJBQXlCO0FBQ3JELFNBQVNDLG9CQUFvQixRQUFRLHFCQUFxQjtBQUMxRCxTQUFTQyxXQUFXLFFBQVEsd0JBQXdCO0FBQ3BELFNBQ0VDLGdDQUFnQyxFQUNoQ0MsWUFBWSxRQUNQLHNDQUFzQztBQUM3QyxTQUFTQywwQkFBMEIsUUFBUSxxQ0FBcUM7QUFDaEYsU0FBU0MsZUFBZSxFQUFFQyxnQkFBZ0IsUUFBUSx1QkFBdUI7QUFDekUsU0FBU0MsR0FBRyxRQUFRLG9CQUFvQjtBQUN4QyxTQUFTQyxvQkFBb0IsUUFBUSx5QkFBeUI7QUFFOUQsTUFBTUMsb0JBQW9CLEdBQUcsMEJBQTBCO0FBQ3ZELE1BQU1DLHNCQUFzQixHQUFHLG9DQUFvQztBQUNuRSxNQUFNQyxvQkFBb0IsR0FBRyxrQ0FBa0M7QUFFL0QsS0FBS0MsVUFBVSxHQUNYLG1CQUFtQixHQUNuQixXQUFXLEdBQ1gsb0JBQW9CLEdBQ3BCLGdCQUFnQjtBQUVwQixLQUFLQyxLQUFLLEdBQUc7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
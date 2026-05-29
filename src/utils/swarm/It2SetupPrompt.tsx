// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useEffect, useState } from 'react';
// 复用 OptionWithDescription、Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { type OptionWithDescription, Select } from '../../components/CustomSelect/index.js';
// 复用 Pane 终端界面组件，避免在这里重复拼装显示逻辑。
import { Pane } from '../../components/design-system/Pane.js';
// 复用 Spinner 终端界面组件，避免在这里重复拼装显示逻辑。
import { Spinner } from '../../components/Spinner.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- enter to proceed through setup steps
// 引入 Box、Text、useInput，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useInput } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 引入 detectPythonPackageManager、getPythonApiInstructions、installIt2、markIt2SetupComplete、PythonPackageManager、setPreferTmuxOverIterm2、verifyIt2Setup，将 ./backends/it2Setup.js 中已经封装好的能力接到本文件流程里。
import { detectPythonPackageManager, getPythonApiInstructions, installIt2, markIt2SetupComplete, type PythonPackageManager, setPreferTmuxOverIterm2, verifyIt2Setup } from './backends/it2Setup.js';
// SetupStep 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SetupStep = 'initial' | 'installing' | 'install-failed' | 'verify-api' | 'api-instructions' | 'verifying' | 'success' | 'failed';
// Props 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: (result: 'installed' | 'use-tmux' | 'cancelled') => void;，负责共享工具在该局部场景下的响应。
  onDone: (result: 'installed' | 'use-tmux' | 'cancelled') => void;
  tmuxAvailable: boolean;
};
// It2SetupPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function It2SetupPrompt(t0) {
  // $保存`_c`，供共享工具后续处理使用。
  const $ = _c(44);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    tmuxAvailable
  } = t0;
  // step 由 React state 持有，setStep 会在用户操作或异步结果返回时触发刷新。
  const [step, setStep] = useState("initial");
  // packageManager 由 React state 持有，setPackageManager 会在用户操作或异步结果返回时触发刷新。
  const [packageManager, setPackageManager] = useState(null);
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供共享工具后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings();
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 调用 detectPythonPackageManager，触发共享工具此处需要的副作用。
      detectPythonPackageManager().then(pm => {
        // setPackageManager 写入新的状态值，使共享工具后续读取保持一致。
        setPackageManager(pm);
      });
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
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onDone) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 调用 onDone，触发共享工具此处需要的副作用。
      onDone("cancelled");
    };
    // $[2] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onDone;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // handleCancel保存`t3`，作为后续临时缓存值处理的输入。
  const handleCancel = t3;
  // t4标记共享工具 It2 Setup Prompt是否启用对应路径。
  const t4 = step !== "installing" && step !== "verifying";
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== t4) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      context: "Confirmation",
      isActive: t4
    };
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // 调用 useKeybinding，触发共享工具此处需要的副作用。
  useKeybinding("confirm:no", handleCancel, t5);
  // t6 暂存 `(_input, key) => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== onDone || $[7] !== step) {
    // t6 暂存 `(_input, key) => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = (_input, key) => {
      // 只有 `step === "api-instructions" && key.return` 满足时，共享工具才执行该分支。
      if (step === "api-instructions" && key.return) {
        // setStep 写入新的状态值，使共享工具后续读取保持一致。
        setStep("verifying");
        // 调用 verifyIt2Setup，触发共享工具此处需要的副作用。
        verifyIt2Setup().then(result => {
          // 满足 `result.success` 时，共享工具执行该分支。
          if (result.success) {
            // 调用 markIt2SetupComplete，触发共享工具此处需要的副作用。
            markIt2SetupComplete();
            // setStep 写入新的状态值，使共享工具后续读取保持一致。
            setStep("success");
            // setTimeout 写入新的状态值，使共享工具后续读取保持一致。
            setTimeout(onDone, 1500, "installed" as const);
          } else {
            // setError 写入新的状态值，使共享工具后续读取保持一致。
            setError(result.error || "Verification failed");
            // setStep 写入新的状态值，使共享工具后续读取保持一致。
            setStep("failed");
          }
        });
      }
    };
    // $[6] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onDone;
    // $[7] 缓存 `step`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = step;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // 调用 useInput，触发共享工具此处需要的副作用。
  useInput(t6);
  // t7 暂存 `async function handleInstall() {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== packageManager) {
    // t7 暂存 `async function handleInstall() {` 生成的渲染片段，后续返回路径直接复用。
    t7 = async function handleInstall() {
      // packageManager缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!packageManager) {
        // setError 写入新的状态值，使共享工具后续读取保持一致。
        setError("No Python package manager found (uvx, pipx, or pip)");
        // setStep 写入新的状态值，使共享工具后续读取保持一致。
        setStep("failed");
        // 共享工具 It2 Setup Prompt在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setStep 写入新的状态值，使共享工具后续读取保持一致。
      setStep("installing");
      // result_0保存`installIt2`，供共享工具后续处理使用。
      const result_0 = await installIt2(packageManager);
      // 满足 `result_0.success` 时，共享工具执行该分支。
      if (result_0.success) {
        // setStep 写入新的状态值，使共享工具后续读取保持一致。
        setStep("api-instructions");
      } else {
        // setError 写入新的状态值，使共享工具后续读取保持一致。
        setError(result_0.error || "Installation failed");
        // setStep 写入新的状态值，使共享工具后续读取保持一致。
        setStep("install-failed");
      }
    };
    // $[9] 缓存 `packageManager`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = packageManager;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // handleInstall保存`t7`，作为后续临时缓存值处理的输入。
  const handleInstall = t7;
  // t8 暂存 `function handleUseTmux() {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onDone) {
    // t8 暂存 `function handleUseTmux() {` 生成的渲染片段，后续返回路径直接复用。
    t8 = function handleUseTmux() {
      // setPreferTmuxOverIterm2 写入新的状态值，使共享工具后续读取保持一致。
      setPreferTmuxOverIterm2(true);
      // 调用 onDone，触发共享工具此处需要的副作用。
      onDone("use-tmux");
    };
    // $[11] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onDone;
    // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[12];
  }
  // handleUseTmux 命名 `t8`，让后续代码直接表达这个值的用途。
  const handleUseTmux = t8;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // t10 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t10;
  // t11 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t11;
  // t12 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t12;
  // t13 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t13;
  // t14 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t14;
  // t9 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== error || $[14] !== handleInstall || $[15] !== handleUseTmux || $[16] !== onDone || $[17] !== packageManager || $[18] !== step || $[19] !== tmuxAvailable) {
    // renderContent封装成回调，供共享工具 It2 Setup Prompt在事件触发或异步步骤中调用。
    const renderContent = () => {
      // 按照 step 的取值选择共享工具的具体处理分支。
      switch (step) {
        case "initial":
          {
            // 返回 `renderInitialPrompt()`，作为共享工具这次计算的结果。
            return renderInitialPrompt();
          }
        case "installing":
          {
            // 返回 `renderInstalling()`，作为共享工具这次计算的结果。
            return renderInstalling();
          }
        case "install-failed":
          {
            // 返回 `renderInstallFailed()`，作为共享工具这次计算的结果。
            return renderInstallFailed();
          }
        case "api-instructions":
          {
            // 返回 `renderApiInstructions()`，作为共享工具这次计算的结果。
            return renderApiInstructions();
          }
        case "verifying":
          {
            // 返回 `renderVerifying()`，作为共享工具这次计算的结果。
            return renderVerifying();
          }
        case "success":
          {
            // 返回 `renderSuccess()`，作为共享工具这次计算的结果。
            return renderSuccess();
          }
        case "failed":
          {
            // 返回 `renderFailed()`，作为共享工具这次计算的结果。
            return renderFailed();
          }
        default:
          {
            // 返回 `null`，作为共享工具这次计算的结果。
            return null;
          }
      }
    };
    // renderInitialPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function renderInitialPrompt() {
      // 选项 聚合成有序列表，保持后续遍历顺序稳定。
      const options = [{
        label: "Install it2 now",
        value: "install",
        description: packageManager ? `Uses ${packageManager} to install the it2 CLI tool` : "Requires Python (uvx, pipx, or pip)"
      }];
      // 满足 `tmuxAvailable` 时，共享工具执行该分支。
      if (tmuxAvailable) {
        // 选项追加新条目，保持收集顺序与输入顺序一致。
        options.push({
          label: "Use tmux instead",
          value: "tmux",
          description: "Opens teammates in a separate tmux session"
        });
      }
      // 选项追加新条目，保持收集顺序与输入顺序一致。
      options.push({
        label: "Cancel",
        value: "cancel",
        description: "Skip teammate spawning for now"
      });
      // 返回 `<Box flexDirection="column" gap={1}><Text>To use native iTerm2 split pa...`，作为共享工具这次计算的结果。
      return <Box flexDirection="column" gap={1}><Text>To use native iTerm2 split panes for teammates, you need the{" "}<Text bold={true}>it2</Text> CLI tool.</Text><Text dimColor={true}>This enables teammates to appear as split panes within your current window.</Text><Box marginTop={1}><Select options={options} onChange={value => {
            // 共享工具 It2 Setup Prompt在这里处理 `bb61: switch (value) {`，完成这一小步状态转换。
            bb61: switch (value) {
              case "install":
                {
                  // 调用 handleInstall，触发共享工具此处需要的副作用。
                  handleInstall();
                  // 结束这个分支或循环，避免共享工具继续落入后续路径。
                  break bb61;
                }
              case "tmux":
                {
                  // 调用 handleUseTmux，触发共享工具此处需要的副作用。
                  handleUseTmux();
                  // 结束这个分支或循环，避免共享工具继续落入后续路径。
                  break bb61;
                }
              case "cancel":
                {
                  // 调用 onDone，触发共享工具此处需要的副作用。
                  onDone("cancelled");
                }
            }
          // 这个回调绑定到 }} onCancel={() => onDone("cancelled")} /></Box></Box>;，负责共享工具在该局部场景下的响应。
          }} onCancel={() => onDone("cancelled")} /></Box></Box>;
    }
    // renderInstalling 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function renderInstalling() {
      // 返回 `<Box flexDirection="column" gap={1}><Box><Spinner /><Text> Installing i...`，作为共享工具这次计算的结果。
      return <Box flexDirection="column" gap={1}><Box><Spinner /><Text> Installing it2 using {packageManager}…</Text></Box><Text dimColor={true}>This may take a moment.</Text></Box>;
    }
    // renderInstallFailed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function renderInstallFailed() {
      // options_0 聚合成有序列表，保持后续遍历顺序稳定。
      const options_0 = [{
        label: "Try again",
        value: "retry",
        description: "Retry the installation"
      }];
      // 满足 `tmuxAvailable` 时，共享工具执行该分支。
      if (tmuxAvailable) {
        // options_0追加新条目，保持收集顺序与输入顺序一致。
        options_0.push({
          label: "Use tmux instead",
          value: "tmux",
          description: "Falls back to tmux for teammate panes"
        });
      }
      // options_0追加新条目，保持收集顺序与输入顺序一致。
      options_0.push({
        label: "Cancel",
        value: "cancel",
        description: "Skip teammate spawning for now"
      });
      // 返回 `<Box flexDirection="column" gap={1}><Text color="error">Installation fa...`，作为共享工具这次计算的结果。
      return <Box flexDirection="column" gap={1}><Text color="error">Installation failed</Text>{error && <Text dimColor={true}>{error}</Text>}<Text dimColor={true}>You can try installing manually:{" "}{packageManager === "uvx" ? "uv tool install it2" : packageManager === "pipx" ? "pipx install it2" : "pip install --user it2"}</Text><Box marginTop={1}><Select options={options_0} onChange={value_0 => {
            // 共享工具 It2 Setup Prompt在这里处理 `bb89: switch (value_0) {`，完成这一小步状态转换。
            bb89: switch (value_0) {
              case "retry":
                {
                  // 调用 handleInstall，触发共享工具此处需要的副作用。
                  handleInstall();
                  // 结束这个分支或循环，避免共享工具继续落入后续路径。
                  break bb89;
                }
              case "tmux":
                {
                  // 调用 handleUseTmux，触发共享工具此处需要的副作用。
                  handleUseTmux();
                  // 结束这个分支或循环，避免共享工具继续落入后续路径。
                  break bb89;
                }
              case "cancel":
                {
                  // 调用 onDone，触发共享工具此处需要的副作用。
                  onDone("cancelled");
                }
            }
          // 这个回调绑定到 }} onCancel={() => onDone("cancelled")} /></Box></Box>;，负责共享工具在该局部场景下的响应。
          }} onCancel={() => onDone("cancelled")} /></Box></Box>;
    }
    // renderApiInstructions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function renderApiInstructions() {
      // instructions 集合读取`getPythonApiInstructions`，供共享工具后续处理使用。
      const instructions = getPythonApiInstructions();
      // 返回 `<Box flexDirection="column" gap={1}><Text color="success">✓ it2 install...`，作为共享工具这次计算的结果。
      return <Box flexDirection="column" gap={1}><Text color="success">✓ it2 installed successfully</Text><Box flexDirection="column" marginTop={1}>{instructions.map(_temp)}</Box><Box marginTop={1}><Text dimColor={true}>Press Enter when ready to verify…</Text></Box></Box>;
    }
    // renderVerifying 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function renderVerifying() {
      // 返回 `<Box><Spinner /><Text> Verifying it2 can communicate with iTerm2…</Text...`，作为共享工具这次计算的结果。
      return <Box><Spinner /><Text> Verifying it2 can communicate with iTerm2…</Text></Box>;
    }
    // renderSuccess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function renderSuccess() {
      // 返回 `<Box flexDirection="column"><Text color="success">✓ iTerm2 split pane s...`，作为共享工具这次计算的结果。
      return <Box flexDirection="column"><Text color="success">✓ iTerm2 split pane support is ready</Text><Text dimColor={true}>Teammates will now appear as split panes.</Text></Box>;
    }
    // renderFailed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function renderFailed() {
      // options_1 聚合成有序列表，保持后续遍历顺序稳定。
      const options_1 = [{
        label: "Try again",
        value: "retry",
        description: "Verify the connection again"
      }];
      // 满足 `tmuxAvailable` 时，共享工具执行该分支。
      if (tmuxAvailable) {
        // options_1追加新条目，保持收集顺序与输入顺序一致。
        options_1.push({
          label: "Use tmux instead",
          value: "tmux",
          description: "Falls back to tmux for teammate panes"
        });
      }
      // options_1追加新条目，保持收集顺序与输入顺序一致。
      options_1.push({
        label: "Cancel",
        value: "cancel",
        description: "Skip teammate spawning for now"
      });
      // 返回 `<Box flexDirection="column" gap={1}><Text color="error">Verification fa...`，作为共享工具这次计算的结果。
      return <Box flexDirection="column" gap={1}><Text color="error">Verification failed</Text>{error && <Text dimColor={true}>{error}</Text>}<Text>Make sure:</Text><Box flexDirection="column" paddingLeft={2}><Text>· Python API is enabled in iTerm2 preferences</Text><Text>· You may need to restart iTerm2 after enabling</Text></Box><Box marginTop={1}><Select options={options_1} onChange={value_1 => {
            // 共享工具 It2 Setup Prompt在这里处理 `bb115: switch (value_1) {`，完成这一小步状态转换。
            bb115: switch (value_1) {
              case "retry":
                {
                  // setStep 写入新的状态值，使共享工具后续读取保持一致。
                  setStep("verifying");
                  // 调用 verifyIt2Setup，触发共享工具此处需要的副作用。
                  verifyIt2Setup().then(result_1 => {
                    // 满足 `result_1.success` 时，共享工具执行该分支。
                    if (result_1.success) {
                      // 调用 markIt2SetupComplete，触发共享工具此处需要的副作用。
                      markIt2SetupComplete();
                      // setStep 写入新的状态值，使共享工具后续读取保持一致。
                      setStep("success");
                      // setTimeout 写入新的状态值，使共享工具后续读取保持一致。
                      setTimeout(onDone, 1500, "installed" as const);
                    } else {
                      // setError 写入新的状态值，使共享工具后续读取保持一致。
                      setError(result_1.error || "Verification failed");
                      // setStep 写入新的状态值，使共享工具后续读取保持一致。
                      setStep("failed");
                    }
                  });
                  // 结束这个分支或循环，避免共享工具继续落入后续路径。
                  break bb115;
                }
              case "tmux":
                {
                  // 调用 handleUseTmux，触发共享工具此处需要的副作用。
                  handleUseTmux();
                  // 结束这个分支或循环，避免共享工具继续落入后续路径。
                  break bb115;
                }
              case "cancel":
                {
                  // 调用 onDone，触发共享工具此处需要的副作用。
                  onDone("cancelled");
                }
            }
          // 这个回调绑定到 }} onCancel={() => onDone("cancelled")} /></Box></Box>;，负责共享工具在该局部场景下的响应。
          }} onCancel={() => onDone("cancelled")} /></Box></Box>;
    }
    // T1 暂存 `Pane` 生成的渲染片段，后续返回路径直接复用。
    T1 = Pane;
    // t14 暂存 `"permission"` 生成的渲染片段，后续返回路径直接复用。
    t14 = "permission";
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t9 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t9 = "column";
    // t10 暂存 `1` 生成的渲染片段，后续返回路径直接复用。
    t10 = 1;
    // t11 暂存 `1` 生成的渲染片段，后续返回路径直接复用。
    t11 = 1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
      // t12 暂存 `<Text bold={true} color="permission">iTerm2 Split Pane Se...` 生成的渲染片段，后续返回路径直接复用。
      t12 = <Text bold={true} color="permission">iTerm2 Split Pane Setup</Text>;
      // $[28] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[28];
    }
    // t13 暂存 `renderContent()` 生成的渲染片段，后续返回路径直接复用。
    t13 = renderContent();
    // $[13] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = error;
    // $[14] 缓存 `handleInstall`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = handleInstall;
    // $[15] 缓存 `handleUseTmux`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = handleUseTmux;
    // $[16] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onDone;
    // $[17] 缓存 `packageManager`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = packageManager;
    // $[18] 缓存 `step`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = step;
    // $[19] 缓存 `tmuxAvailable`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = tmuxAvailable;
    // $[20] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = T0;
    // $[21] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = T1;
    // $[22] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t10;
    // $[23] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t11;
    // $[24] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t12;
    // $[25] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t13;
    // $[26] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t14;
    // $[27] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t9;
  } else {
    // T0 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[20];
    // T1 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[21];
    // t10 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[22];
    // t11 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[23];
    // t12 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[24];
    // t13 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[25];
    // t14 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[26];
    // t9 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[27];
  }
  // t15 暂存 `step !== "installing" && step !== "verifying" && step !==...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== exitState || $[30] !== step) {
    // t15 暂存 `step !== "installing" && step !== "verifying" && step !==...` 生成的渲染片段，后续返回路径直接复用。
    t15 = step !== "installing" && step !== "verifying" && step !== "success" && <Text dimColor={true} italic={true}>{exitState.pending ? <>Press {exitState.keyName} again to exit</> : <>Esc to cancel</>}</Text>;
    // $[29] 缓存 `exitState`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = exitState;
    // $[30] 缓存 `step`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = step;
    // $[31] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[31];
  }
  // t16 暂存 `<T0 flexDirection={t9} gap={t10} paddingBottom={t11}>{t12...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== T0 || $[33] !== t10 || $[34] !== t11 || $[35] !== t12 || $[36] !== t13 || $[37] !== t15 || $[38] !== t9) {
    // t16 暂存 `<T0 flexDirection={t9} gap={t10} paddingBottom={t11}>{t12...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <T0 flexDirection={t9} gap={t10} paddingBottom={t11}>{t12}{t13}{t15}</T0>;
    // $[32] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = T0;
    // $[33] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t10;
    // $[34] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t11;
    // $[35] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t12;
    // $[36] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t13;
    // $[37] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t15;
    // $[38] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t9;
    // $[39] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[39];
  }
  // t17 暂存 `<T1 color={t14}>{t16}</T1>` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[40] !== T1 || $[41] !== t14 || $[42] !== t16) {
    // t17 暂存 `<T1 color={t14}>{t16}</T1>` 生成的渲染片段，后续返回路径直接复用。
    t17 = <T1 color={t14}>{t16}</T1>;
    // $[40] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = T1;
    // $[41] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t14;
    // $[42] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t16;
    // $[43] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[43];
  }
  // 返回 `t17`，作为共享工具这次计算的结果。
  return t17;
}
// _temp 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(line, i) {
  // 返回 `<Text key={i}>{line}</Text>`，作为共享工具这次计算的结果。
  return <Text key={i}>{line}</Text>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJPcHRpb25XaXRoRGVzY3JpcHRpb24iLCJTZWxlY3QiLCJQYW5lIiwiU3Bpbm5lciIsInVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyIsIkJveCIsIlRleHQiLCJ1c2VJbnB1dCIsInVzZUtleWJpbmRpbmciLCJkZXRlY3RQeXRob25QYWNrYWdlTWFuYWdlciIsImdldFB5dGhvbkFwaUluc3RydWN0aW9ucyIsImluc3RhbGxJdDIiLCJtYXJrSXQyU2V0dXBDb21wbGV0ZSIsIlB5dGhvblBhY2thZ2VNYW5hZ2VyIiwic2V0UHJlZmVyVG11eE92ZXJJdGVybTIiLCJ2ZXJpZnlJdDJTZXR1cCIsIlNldHVwU3RlcCIsIlByb3BzIiwib25Eb25lIiwicmVzdWx0IiwidG11eEF2YWlsYWJsZSIsIkl0MlNldHVwUHJvbXB0IiwidDAiLCIkIiwiX2MiLCJzdGVwIiwic2V0U3RlcCIsInBhY2thZ2VNYW5hZ2VyIiwic2V0UGFja2FnZU1hbmFnZXIiLCJlcnJvciIsInNldEVycm9yIiwiZXhpdFN0YXRlIiwidDEiLCJ0MiIsIlN5bWJvbCIsImZvciIsInRoZW4iLCJwbSIsInQzIiwiaGFuZGxlQ2FuY2VsIiwidDQiLCJ0NSIsImNvbnRleHQiLCJpc0FjdGl2ZSIsInQ2IiwiX2lucHV0Iiwia2V5IiwicmV0dXJuIiwic3VjY2VzcyIsInNldFRpbWVvdXQiLCJjb25zdCIsInQ3IiwiaGFuZGxlSW5zdGFsbCIsInJlc3VsdF8wIiwidDgiLCJoYW5kbGVVc2VUbXV4IiwiVDAiLCJUMSIsInQxMCIsInQxMSIsInQxMiIsInQxMyIsInQxNCIsInQ5IiwicmVuZGVyQ29udGVudCIsInJlbmRlckluaXRpYWxQcm9tcHQiLCJyZW5kZXJJbnN0YWxsaW5nIiwicmVuZGVySW5zdGFsbEZhaWxlZCIsInJlbmRlckFwaUluc3RydWN0aW9ucyIsInJlbmRlclZlcmlmeWluZyIsInJlbmRlclN1Y2Nlc3MiLCJyZW5kZXJGYWlsZWQiLCJvcHRpb25zIiwibGFiZWwiLCJ2YWx1ZSIsImRlc2NyaXB0aW9uIiwicHVzaCIsImJiNjEiLCJvcHRpb25zXzAiLCJ2YWx1ZV8wIiwiYmI4OSIsImluc3RydWN0aW9ucyIsIm1hcCIsIl90ZW1wIiwib3B0aW9uc18xIiwidmFsdWVfMSIsImJiMTE1IiwicmVzdWx0XzEiLCJ0MTUiLCJwZW5kaW5nIiwia2V5TmFtZSIsInQxNiIsInQxNyIsImxpbmUiLCJpIl0sInNvdXJjZXMiOlsiSXQyU2V0dXBQcm9tcHQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtcbiAgdHlwZSBPcHRpb25XaXRoRGVzY3JpcHRpb24sXG4gIFNlbGVjdCxcbn0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBQYW5lIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9kZXNpZ24tc3lzdGVtL1BhbmUuanMnXG5pbXBvcnQgeyBTcGlubmVyIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9TcGlubmVyLmpzJ1xuaW1wb3J0IHsgdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzLmpzJ1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGN1c3RvbS1ydWxlcy9wcmVmZXItdXNlLWtleWJpbmRpbmdzIC0tIGVudGVyIHRvIHByb2NlZWQgdGhyb3VnaCBzZXR1cCBzdGVwc1xuaW1wb3J0IHsgQm94LCBUZXh0LCB1c2VJbnB1dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHtcbiAgZGV0ZWN0UHl0aG9uUGFja2FnZU1hbmFnZXIsXG4gIGdldFB5dGhvbkFwaUluc3RydWN0aW9ucyxcbiAgaW5zdGFsbEl0MixcbiAgbWFya0l0MlNldHVwQ29tcGxldGUsXG4gIHR5cGUgUHl0aG9uUGFja2FnZU1hbmFnZXIsXG4gIHNldFByZWZlclRtdXhPdmVySXRlcm0yLFxuICB2ZXJpZnlJdDJTZXR1cCxcbn0gZnJvbSAnLi9iYWNrZW5kcy9pdDJTZXR1cC5qcydcblxudHlwZSBTZXR1cFN0ZXAgPVxuICB8ICdpbml0aWFsJ1xuICB8ICdpbnN0YWxsaW5nJ1xuICB8ICdpbnN0YWxsLWZhaWxlZCdcbiAgfCAndmVyaWZ5LWFwaSdcbiAgfCAnYXBpLWluc3RydWN0aW9ucydcbiAgfCAndmVyaWZ5aW5nJ1xuICB8ICdzdWNjZXNzJ1xuICB8ICdmYWlsZWQnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uRG9uZTogKHJlc3VsdDogJ2luc3RhbGxlZCcgfCAndXNlLXRtdXgnIHwgJ2NhbmNlbGxlZCcpID0+IHZvaWRcbiAgdG11eEF2YWlsYWJsZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gSXQyU2V0dXBQcm9tcHQoe1xuICBvbkRvbmUsXG4gIHRtdXhBdmFpbGFibGUsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtzdGVwLCBzZXRTdGVwXSA9IHVzZVN0YXRlPFNldHVwU3RlcD4oJ2luaXRpYWwnKVxuICBjb25zdCBbcGFja2FnZU1hbmFnZXIsIHNldFBhY2thZ2VNYW5hZ2VyXSA9XG4gICAgdXNlU3RhdGU8UHl0aG9uUGFja2FnZU1hbmFnZXIgfCBudWxsPihudWxsKVxuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IGV4aXRTdGF0ZSA9IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncygpXG5cbiAgLy8gRGV0ZWN0IHBhY2thZ2UgbWFuYWdlciBvbiBtb3VudFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZvaWQgZGV0ZWN0UHl0aG9uUGFja2FnZU1hbmFnZXIoKS50aGVuKHBtID0+IHtcbiAgICAgIHNldFBhY2thZ2VNYW5hZ2VyKHBtKVxuICAgIH0pXG4gIH0sIFtdKVxuXG4gIGNvbnN0IGhhbmRsZUNhbmNlbCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBvbkRvbmUoJ2NhbmNlbGxlZCcpXG4gIH0sIFtvbkRvbmVdKVxuXG4gIHVzZUtleWJpbmRpbmcoJ2NvbmZpcm06bm8nLCBoYW5kbGVDYW5jZWwsIHtcbiAgICBjb250ZXh0OiAnQ29uZmlybWF0aW9uJyxcbiAgICBpc0FjdGl2ZTogc3RlcCAhPT0gJ2luc3RhbGxpbmcnICYmIHN0ZXAgIT09ICd2ZXJpZnlpbmcnLFxuICB9KVxuXG4gIC8vIEhhbmRsZSBrZXlib2FyZCBpbnB1dCBmb3IgdmVyaWZpY2F0aW9uIHN0ZXBcbiAgdXNlSW5wdXQoKF9pbnB1dCwga2V5KSA9PiB7XG4gICAgaWYgKHN0ZXAgPT09ICdhcGktaW5zdHJ1Y3Rpb25zJyAmJiBrZXkucmV0dXJuKSB7XG4gICAgICBzZXRTdGVwKCd2ZXJpZnlpbmcnKVxuICAgICAgdm9pZCB2ZXJpZnlJdDJTZXR1cCgpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgbWFya0l0MlNldHVwQ29tcGxldGUoKVxuICAgICAgICAgIHNldFN0ZXAoJ3N1Y2Nlc3MnKVxuICAgICAgICAgIHNldFRpbWVvdXQob25Eb25lLCAxNTAwLCAnaW5zdGFsbGVkJyBhcyBjb25zdClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRFcnJvcihyZXN1bHQuZXJyb3IgfHwgJ1ZlcmlmaWNhdGlvbiBmYWlsZWQnKVxuICAgICAgICAgIHNldFN0ZXAoJ2ZhaWxlZCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIC8vIEhhbmRsZSBpbnN0YWxsYXRpb25cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlSW5zdGFsbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICBzZXRFcnJvcignTm8gUHl0aG9uIHBhY2thZ2UgbWFuYWdlciBmb3VuZCAodXZ4LCBwaXB4LCBvciBwaXApJylcbiAgICAgIHNldFN0ZXAoJ2ZhaWxlZCcpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBzZXRTdGVwKCdpbnN0YWxsaW5nJylcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBpbnN0YWxsSXQyKHBhY2thZ2VNYW5hZ2VyKVxuXG4gICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAvLyBTaG93IFB5dGhvbiBBUEkgaW5zdHJ1Y3Rpb25zXG4gICAgICBzZXRTdGVwKCdhcGktaW5zdHJ1Y3Rpb25zJylcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0RXJyb3IocmVzdWx0LmVycm9yIHx8ICdJbnN0YWxsYXRpb24gZmFpbGVkJylcbiAgICAgIHNldFN0ZXAoJ2luc3RhbGwtZmFpbGVkJylcbiAgICB9XG4gIH1cblxuICAvLyBIYW5kbGUgdXNpbmcgdG11eCBpbnN0ZWFkXG4gIGZ1bmN0aW9uIGhhbmRsZVVzZVRtdXgoKTogdm9pZCB7XG4gICAgc2V0UHJlZmVyVG11eE92ZXJJdGVybTIodHJ1ZSlcbiAgICBvbkRvbmUoJ3VzZS10bXV4JylcbiAgfVxuXG4gIC8vIFJlbmRlciBiYXNlZCBvbiBjdXJyZW50IHN0ZXBcbiAgY29uc3QgcmVuZGVyQ29udGVudCA9ICgpOiBSZWFjdC5SZWFjdE5vZGUgPT4ge1xuICAgIHN3aXRjaCAoc3RlcCkge1xuICAgICAgY2FzZSAnaW5pdGlhbCc6XG4gICAgICAgIHJldHVybiByZW5kZXJJbml0aWFsUHJvbXB0KClcbiAgICAgIGNhc2UgJ2luc3RhbGxpbmcnOlxuICAgICAgICByZXR1cm4gcmVuZGVySW5zdGFsbGluZygpXG4gICAgICBjYXNlICdpbnN0YWxsLWZhaWxlZCc6XG4gICAgICAgIHJldHVybiByZW5kZXJJbnN0YWxsRmFpbGVkKClcbiAgICAgIGNhc2UgJ2FwaS1pbnN0cnVjdGlvbnMnOlxuICAgICAgICByZXR1cm4gcmVuZGVyQXBpSW5zdHJ1Y3Rpb25zKClcbiAgICAgIGNhc2UgJ3ZlcmlmeWluZyc6XG4gICAgICAgIHJldHVybiByZW5kZXJWZXJpZnlpbmcoKVxuICAgICAgY2FzZSAnc3VjY2Vzcyc6XG4gICAgICAgIHJldHVybiByZW5kZXJTdWNjZXNzKClcbiAgICAgIGNhc2UgJ2ZhaWxlZCc6XG4gICAgICAgIHJldHVybiByZW5kZXJGYWlsZWQoKVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJJbml0aWFsUHJvbXB0KCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgY29uc3Qgb3B0aW9uczogT3B0aW9uV2l0aERlc2NyaXB0aW9uPHN0cmluZz5bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdJbnN0YWxsIGl0MiBub3cnLFxuICAgICAgICB2YWx1ZTogJ2luc3RhbGwnLFxuICAgICAgICBkZXNjcmlwdGlvbjogcGFja2FnZU1hbmFnZXJcbiAgICAgICAgICA/IGBVc2VzICR7cGFja2FnZU1hbmFnZXJ9IHRvIGluc3RhbGwgdGhlIGl0MiBDTEkgdG9vbGBcbiAgICAgICAgICA6ICdSZXF1aXJlcyBQeXRob24gKHV2eCwgcGlweCwgb3IgcGlwKScsXG4gICAgICB9LFxuICAgIF1cblxuICAgIGlmICh0bXV4QXZhaWxhYmxlKSB7XG4gICAgICBvcHRpb25zLnB1c2goe1xuICAgICAgICBsYWJlbDogJ1VzZSB0bXV4IGluc3RlYWQnLFxuICAgICAgICB2YWx1ZTogJ3RtdXgnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ09wZW5zIHRlYW1tYXRlcyBpbiBhIHNlcGFyYXRlIHRtdXggc2Vzc2lvbicsXG4gICAgICB9KVxuICAgIH1cblxuICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICBsYWJlbDogJ0NhbmNlbCcsXG4gICAgICB2YWx1ZTogJ2NhbmNlbCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NraXAgdGVhbW1hdGUgc3Bhd25pbmcgZm9yIG5vdycsXG4gICAgfSlcblxuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBUbyB1c2UgbmF0aXZlIGlUZXJtMiBzcGxpdCBwYW5lcyBmb3IgdGVhbW1hdGVzLCB5b3UgbmVlZCB0aGV7JyAnfVxuICAgICAgICAgIDxUZXh0IGJvbGQ+aXQyPC9UZXh0PiBDTEkgdG9vbC5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBUaGlzIGVuYWJsZXMgdGVhbW1hdGVzIHRvIGFwcGVhciBhcyBzcGxpdCBwYW5lcyB3aXRoaW4geW91ciBjdXJyZW50XG4gICAgICAgICAgd2luZG93LlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IHtcbiAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2luc3RhbGwnOlxuICAgICAgICAgICAgICAgICAgdm9pZCBoYW5kbGVJbnN0YWxsKClcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgY2FzZSAndG11eCc6XG4gICAgICAgICAgICAgICAgICBoYW5kbGVVc2VUbXV4KClcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgY2FzZSAnY2FuY2VsJzpcbiAgICAgICAgICAgICAgICAgIG9uRG9uZSgnY2FuY2VsbGVkJylcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gb25Eb25lKCdjYW5jZWxsZWQnKX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlckluc3RhbGxpbmcoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8U3Bpbm5lciAvPlxuICAgICAgICAgIDxUZXh0PiBJbnN0YWxsaW5nIGl0MiB1c2luZyB7cGFja2FnZU1hbmFnZXJ94oCmPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+VGhpcyBtYXkgdGFrZSBhIG1vbWVudC48L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJJbnN0YWxsRmFpbGVkKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgY29uc3Qgb3B0aW9uczogT3B0aW9uV2l0aERlc2NyaXB0aW9uPHN0cmluZz5bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdUcnkgYWdhaW4nLFxuICAgICAgICB2YWx1ZTogJ3JldHJ5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdSZXRyeSB0aGUgaW5zdGFsbGF0aW9uJyxcbiAgICAgIH0sXG4gICAgXVxuXG4gICAgaWYgKHRtdXhBdmFpbGFibGUpIHtcbiAgICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICAgIGxhYmVsOiAnVXNlIHRtdXggaW5zdGVhZCcsXG4gICAgICAgIHZhbHVlOiAndG11eCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRmFsbHMgYmFjayB0byB0bXV4IGZvciB0ZWFtbWF0ZSBwYW5lcycsXG4gICAgICB9KVxuICAgIH1cblxuICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICBsYWJlbDogJ0NhbmNlbCcsXG4gICAgICB2YWx1ZTogJ2NhbmNlbCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NraXAgdGVhbW1hdGUgc3Bhd25pbmcgZm9yIG5vdycsXG4gICAgfSlcblxuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+SW5zdGFsbGF0aW9uIGZhaWxlZDwvVGV4dD5cbiAgICAgICAge2Vycm9yICYmIDxUZXh0IGRpbUNvbG9yPntlcnJvcn08L1RleHQ+fVxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBZb3UgY2FuIHRyeSBpbnN0YWxsaW5nIG1hbnVhbGx5OnsnICd9XG4gICAgICAgICAge3BhY2thZ2VNYW5hZ2VyID09PSAndXZ4J1xuICAgICAgICAgICAgPyAndXYgdG9vbCBpbnN0YWxsIGl0MidcbiAgICAgICAgICAgIDogcGFja2FnZU1hbmFnZXIgPT09ICdwaXB4J1xuICAgICAgICAgICAgICA/ICdwaXB4IGluc3RhbGwgaXQyJ1xuICAgICAgICAgICAgICA6ICdwaXAgaW5zdGFsbCAtLXVzZXIgaXQyJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgIHN3aXRjaCAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdyZXRyeSc6XG4gICAgICAgICAgICAgICAgICB2b2lkIGhhbmRsZUluc3RhbGwoKVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjYXNlICd0bXV4JzpcbiAgICAgICAgICAgICAgICAgIGhhbmRsZVVzZVRtdXgoKVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjYXNlICdjYW5jZWwnOlxuICAgICAgICAgICAgICAgICAgb25Eb25lKCdjYW5jZWxsZWQnKVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBvbkRvbmUoJ2NhbmNlbGxlZCcpfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyQXBpSW5zdHJ1Y3Rpb25zKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZ2V0UHl0aG9uQXBpSW5zdHJ1Y3Rpb25zKClcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgPFRleHQgY29sb3I9XCJzdWNjZXNzXCI+4pyTIGl0MiBpbnN0YWxsZWQgc3VjY2Vzc2Z1bGx5PC9UZXh0PlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgIHtpbnN0cnVjdGlvbnMubWFwKChsaW5lLCBpKSA9PiAoXG4gICAgICAgICAgICA8VGV4dCBrZXk9e2l9PntsaW5lfTwvVGV4dD5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5QcmVzcyBFbnRlciB3aGVuIHJlYWR5IHRvIHZlcmlmeeKApjwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJWZXJpZnlpbmcoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveD5cbiAgICAgICAgPFNwaW5uZXIgLz5cbiAgICAgICAgPFRleHQ+IFZlcmlmeWluZyBpdDIgY2FuIGNvbW11bmljYXRlIHdpdGggaVRlcm0y4oCmPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyU3VjY2VzcygpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgY29sb3I9XCJzdWNjZXNzXCI+4pyTIGlUZXJtMiBzcGxpdCBwYW5lIHN1cHBvcnQgaXMgcmVhZHk8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlRlYW1tYXRlcyB3aWxsIG5vdyBhcHBlYXIgYXMgc3BsaXQgcGFuZXMuPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyRmFpbGVkKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgY29uc3Qgb3B0aW9uczogT3B0aW9uV2l0aERlc2NyaXB0aW9uPHN0cmluZz5bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdUcnkgYWdhaW4nLFxuICAgICAgICB2YWx1ZTogJ3JldHJ5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdWZXJpZnkgdGhlIGNvbm5lY3Rpb24gYWdhaW4nLFxuICAgICAgfSxcbiAgICBdXG5cbiAgICBpZiAodG11eEF2YWlsYWJsZSkge1xuICAgICAgb3B0aW9ucy5wdXNoKHtcbiAgICAgICAgbGFiZWw6ICdVc2UgdG11eCBpbnN0ZWFkJyxcbiAgICAgICAgdmFsdWU6ICd0bXV4JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdGYWxscyBiYWNrIHRvIHRtdXggZm9yIHRlYW1tYXRlIHBhbmVzJyxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgb3B0aW9ucy5wdXNoKHtcbiAgICAgIGxhYmVsOiAnQ2FuY2VsJyxcbiAgICAgIHZhbHVlOiAnY2FuY2VsJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2tpcCB0ZWFtbWF0ZSBzcGF3bmluZyBmb3Igbm93JyxcbiAgICB9KVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5WZXJpZmljYXRpb24gZmFpbGVkPC9UZXh0PlxuICAgICAgICB7ZXJyb3IgJiYgPFRleHQgZGltQ29sb3I+e2Vycm9yfTwvVGV4dD59XG4gICAgICAgIDxUZXh0Pk1ha2Ugc3VyZTo8L1RleHQ+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdMZWZ0PXsyfT5cbiAgICAgICAgICA8VGV4dD7CtyBQeXRob24gQVBJIGlzIGVuYWJsZWQgaW4gaVRlcm0yIHByZWZlcmVuY2VzPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PsK3IFlvdSBtYXkgbmVlZCB0byByZXN0YXJ0IGlUZXJtMiBhZnRlciBlbmFibGluZzwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IHtcbiAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3JldHJ5JzpcbiAgICAgICAgICAgICAgICAgIHNldFN0ZXAoJ3ZlcmlmeWluZycpXG4gICAgICAgICAgICAgICAgICB2b2lkIHZlcmlmeUl0MlNldHVwKCkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICBtYXJrSXQyU2V0dXBDb21wbGV0ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgc2V0U3RlcCgnc3VjY2VzcycpXG4gICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChvbkRvbmUsIDE1MDAsICdpbnN0YWxsZWQnIGFzIGNvbnN0KVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHNldEVycm9yKHJlc3VsdC5lcnJvciB8fCAnVmVyaWZpY2F0aW9uIGZhaWxlZCcpXG4gICAgICAgICAgICAgICAgICAgICAgc2V0U3RlcCgnZmFpbGVkJylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgY2FzZSAndG11eCc6XG4gICAgICAgICAgICAgICAgICBoYW5kbGVVc2VUbXV4KClcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgY2FzZSAnY2FuY2VsJzpcbiAgICAgICAgICAgICAgICAgIG9uRG9uZSgnY2FuY2VsbGVkJylcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gb25Eb25lKCdjYW5jZWxsZWQnKX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFBhbmUgY29sb3I9XCJwZXJtaXNzaW9uXCI+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9IHBhZGRpbmdCb3R0b209ezF9PlxuICAgICAgICA8VGV4dCBib2xkIGNvbG9yPVwicGVybWlzc2lvblwiPlxuICAgICAgICAgIGlUZXJtMiBTcGxpdCBQYW5lIFNldHVwXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAge3JlbmRlckNvbnRlbnQoKX1cbiAgICAgICAge3N0ZXAgIT09ICdpbnN0YWxsaW5nJyAmJlxuICAgICAgICAgIHN0ZXAgIT09ICd2ZXJpZnlpbmcnICYmXG4gICAgICAgICAgc3RlcCAhPT0gJ3N1Y2Nlc3MnICYmIChcbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yIGl0YWxpYz5cbiAgICAgICAgICAgICAge2V4aXRTdGF0ZS5wZW5kaW5nID8gKFxuICAgICAgICAgICAgICAgIDw+UHJlc3Mge2V4aXRTdGF0ZS5rZXlOYW1lfSBhZ2FpbiB0byBleGl0PC8+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPD5Fc2MgdG8gY2FuY2VsPC8+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvUGFuZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxXQUFXLEVBQUVDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDL0QsU0FDRSxLQUFLQyxxQkFBcUIsRUFDMUJDLE1BQU0sUUFDRCx3Q0FBd0M7QUFDL0MsU0FBU0MsSUFBSSxRQUFRLHdDQUF3QztBQUM3RCxTQUFTQyxPQUFPLFFBQVEsNkJBQTZCO0FBQ3JELFNBQVNDLDhCQUE4QixRQUFRLCtDQUErQztBQUM5RjtBQUNBLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxRQUFRLFFBQVEsY0FBYztBQUNsRCxTQUFTQyxhQUFhLFFBQVEsb0NBQW9DO0FBQ2xFLFNBQ0VDLDBCQUEwQixFQUMxQkMsd0JBQXdCLEVBQ3hCQyxVQUFVLEVBQ1ZDLG9CQUFvQixFQUNwQixLQUFLQyxvQkFBb0IsRUFDekJDLHVCQUF1QixFQUN2QkMsY0FBYyxRQUNULHdCQUF3QjtBQUUvQixLQUFLQyxTQUFTLEdBQ1YsU0FBUyxHQUNULFlBQVksR0FDWixnQkFBZ0IsR0FDaEIsWUFBWSxHQUNaLGtCQUFrQixHQUNsQixXQUFXLEdBQ1gsU0FBUyxHQUNULFFBQVE7QUFFWixLQUFLQyxLQUFLLEdBQUc7RUFDWEMsTUFBTSxFQUFFLENBQUNDLE1BQU0sRUFBRSxXQUFXLEdBQUcsVUFBVSxHQUFHLFdBQVcsRUFBRSxHQUFHLElBQUk7RUFDaEVDLGFBQWEsRUFBRSxPQUFPO0FBQ3hCLENBQUM7QUFFRCxPQUFPLFNBQUFDLGVBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7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
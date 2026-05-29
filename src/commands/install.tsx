// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 homedir，将 node:os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'node:os';
// 引入 join，将 node:path 中已经封装好的能力接到本文件流程里。
import { join } from 'node:path';
// 引入 React、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useState } from 'react';
// 类型依赖 { CommandResultDisplay } 来自 src/commands.js，用于校准命令处理的数据契约。
import type { CommandResultDisplay } from 'src/commands.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js';
// 复用 StatusIcon 终端界面组件，避免在这里重复拼装显示逻辑。
import { StatusIcon } from '../components/design-system/StatusIcon.js';
// 引入 Box、render、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, render, Text } from '../ink.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js';
// 复用 env 工具函数，把通用处理留在 ../utils/env.js 中维护。
import { env } from '../utils/env.js';
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js';
// 复用 checkInstall、cleanupNpmInstallations、cleanupShellAliases、installLatest 工具函数，把通用处理留在 ../utils/nativeInstaller/index.js 中维护。
import { checkInstall, cleanupNpmInstallations, cleanupShellAliases, installLatest } from '../utils/nativeInstaller/index.js';
// 复用 getInitialSettings、updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getInitialSettings, updateSettingsForSource } from '../utils/settings/settings.js';
// InstallProps 描述命令处理需要实现的字段和回调，避免跨模块交互时契约漂移。
interface InstallProps {
  onDone: (result: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
  force?: boolean;
  target?: string; // 'latest', 'stable', or version like '1.0.34'
}
// InstallState 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type InstallState = {
  type: 'checking';
} | {
  type: 'cleaning-npm';
} | {
  type: 'installing';
  version: string;
} | {
  type: 'setting-up';
} | {
  type: 'set-up';
  messages: string[];
} | {
  type: 'success';
  version: string;
  setupMessages?: string[];
} | {
  type: 'error';
  message: string;
  warnings?: string[];
};
// getInstallationPath 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInstallationPath(): string {
  // isWindows 集合标记命令处理斜杠命令 install是否启用对应路径。
  const isWindows = env.platform === 'win32';
  // homeDir保存`homedir`，供命令处理后续处理使用。
  const homeDir = homedir();
  // 满足 `isWindows` 时，命令处理执行该分支。
  if (isWindows) {
    // Convert to Windows-style path
    // windowsPath 路径数据格式化`join`，供命令处理后续处理使用。
    const windowsPath = join(homeDir, '.local', 'bin', 'claude.exe');
    // Replace forward slashes with backslashes for Windows display
    // 返回 `windowsPath.replace(/\//g, '\\')`，作为命令处理这次计算的结果。
    return windowsPath.replace(/\//g, '\\');
  }
  // 返回 `'~/.local/bin/claude'`，作为命令处理这次计算的结果。
  return '~/.local/bin/claude';
}
// SetupNotes 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SetupNotes(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    messages
  } = t0;
  // 对话消息为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (messages.length === 0) {
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // t1 暂存 `<Box><Text color="warning"><StatusIcon status="warning" w...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Box><Text color="warning"><StatusIcon status="warning" w...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box><Text color="warning"><StatusIcon status="warning" withSpace={true} />Setup notes:</Text></Box>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `messages.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== messages) {
    // t2 暂存 `messages.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t2 = messages.map(_temp);
    // $[1] 缓存 `messages`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = messages;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `<Box flexDirection="column" gap={0} marginBottom={1}>{t1}...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== t2) {
    // t3 暂存 `<Box flexDirection="column" gap={0} marginBottom={1}>{t1}...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column" gap={0} marginBottom={1}>{t1}{t2}</Box>;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 返回 `t3`，作为命令处理这次计算的结果。
  return t3;
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(message, index) {
  // 返回 `<Box key={index} marginLeft={2}><Text dimColor={true}>• {message}</Text...`，作为命令处理这次计算的结果。
  return <Box key={index} marginLeft={2}><Text dimColor={true}>• {message}</Text></Box>;
}
// Install 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function Install({
  onDone,
  force,
  target
}: InstallProps): React.ReactNode {
  // 从 `useState<InstallState>({` 按位置拆出 state、setState，让斜杠命令 install分别处理这些返回值。
  const [state, setState] = useState<InstallState>({
    type: 'checking'
  });
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(() => {
    // run 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    async function run() {
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Install: Starting installation process (force=${force}, target=${target})`);

        // Install native build first
        // channelOrVersion读取`getInitialSettings`，供命令处理后续处理使用。
        const channelOrVersion = target || getInitialSettings()?.autoUpdatesChannel || 'latest';
        // setState 写入新的状态值，使命令处理后续读取保持一致。
        setState({
          type: 'installing',
          version: channelOrVersion
        });

        // Pass force flag to trigger reinstall even if up to date
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Install: Calling installLatest(channelOrVersion=${channelOrVersion}, forceReinstall=${force})`);
        // 结果保存`installLatest`，供命令处理后续处理使用。
        const result = await installLatest(channelOrVersion, force);
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Install: installLatest returned version=${result.latestVersion}, wasUpdated=${result.wasUpdated}, lockFailed=${result.lockFailed}`);

        // Check specifically for lock failure
        // 满足 `result.lockFailed` 时，命令处理执行该分支。
        if (result.lockFailed) {
          // 抛出 new Error('Could not install - another process is currently installing Claude. Please try…，阻止命令处理在无效状态下继续运行。
          throw new Error('Could not install - another process is currently installing Claude. Please try again in a moment.');
        }

        // If we couldn't get the version, there might be an issue
        // result.latestVersion缺失时直接走兜底路径，避免命令处理使用无效输入。
        if (!result.latestVersion) {
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logForDebugging('Install: Failed to retrieve version information during install', {
            level: 'error'
          });
        }
        // result.wasUpdated缺失时直接走兜底路径，避免命令处理使用无效输入。
        if (!result.wasUpdated) {
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logForDebugging('Install: Already up to date');
        }

        // Set up launcher and shell integration
        // setState 写入新的状态值，使命令处理后续读取保持一致。
        setState({
          type: 'setting-up'
        });
        // setupMessages 消息数据读取`checkInstall`，供命令处理后续处理使用。
        const setupMessages = await checkInstall(true);
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Install: Setup launcher completed with ${setupMessages.length} messages`);
        // 满足 `setupMessages.length > 0` 时，命令处理执行该分支。
        if (setupMessages.length > 0) {
          // 调用 setupMessages.forEach，触发命令处理此处需要的副作用。
          setupMessages.forEach(msg => logForDebugging(`Install: Setup message: ${msg.message}`));
        }

        // Now that native installation succeeded, clean up old npm installations
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logForDebugging('Install: Cleaning up npm installations after successful install');
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          removed,
          errors,
          warnings
        } = await cleanupNpmInstallations();
        // 满足 `removed > 0` 时，命令处理执行该分支。
        if (removed > 0) {
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Cleaned up ${removed} npm installation(s)`);
        }
        // 满足 `errors.length > 0` 时，命令处理执行该分支。
        if (errors.length > 0) {
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Cleanup errors: ${errors.join(', ')}`);
          // Continue despite cleanup errors - native install already succeeded
        }

        // Clean up old shell aliases
        // aliasMessages 消息数据保存`cleanupShellAliases`，供命令处理后续处理使用。
        const aliasMessages = await cleanupShellAliases();
        // 满足 `aliasMessages.length > 0` 时，命令处理执行该分支。
        if (aliasMessages.length > 0) {
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Shell alias cleanup: ${aliasMessages.map(m => m.message).join('; ')}`);
        }

        // Log success event
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_claude_install_command', {
          has_version: result.latestVersion ? 1 : 0,
          forced: force ? 1 : 0
        });

        // If user explicitly specified a channel, save it to settings
        // 当 `target` 匹配 `'latest' || target === 'sta...` 时，命令处理执行对应分支。
        if (target === 'latest' || target === 'stable') {
          // 调用 updateSettingsForSource，触发命令处理此处需要的副作用。
          updateSettingsForSource('userSettings', {
            autoUpdatesChannel: target
          });
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Install: Saved autoUpdatesChannel=${target} to user settings`);
        }

        // Combine all warning/info messages (convert SetupMessage to string)
        // allWarnings 警告信息派生`aliasMessages.map`，供命令处理后续处理使用。
        const allWarnings = [...warnings, ...aliasMessages.map(m_0 => m_0.message)];

        // Check if there were any setup errors or notes
        // 满足 `setupMessages.length > 0` 时，命令处理执行该分支。
        if (setupMessages.length > 0) {
          // setState 写入新的状态值，使命令处理后续读取保持一致。
          setState({
            type: 'set-up',
            // 这个回调绑定到 messages: setupMessages.map(m_1 => m_1.message)，负责命令处理在该局部场景下的响应。
            messages: setupMessages.map(m_1 => m_1.message)
          });
          // Still mark as success but show both setup messages and cleanup warnings
          // setTimeout 写入新的状态值，使命令处理后续读取保持一致。
          setTimeout(setState, 2000, {
            type: 'success' as const,
            version: result.latestVersion || 'current',
            // 这个回调绑定到 setupMessages: [...setupMessages.map(m_2 => m_2.message), ...allWarnings]，负责命令处理在该局部场景下的响应。
            setupMessages: [...setupMessages.map(m_2 => m_2.message), ...allWarnings]
          });
        } else {
          // No setup messages, go straight to success (but still show cleanup warnings if any)
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logForDebugging('Install: Shell PATH already configured');
          // setState 写入新的状态值，使命令处理后续读取保持一致。
          setState({
            type: 'success',
            version: result.latestVersion || 'current',
            setupMessages: allWarnings.length > 0 ? allWarnings : undefined
          });
        }
      } catch (error) {
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Install command failed: ${error}`, {
          level: 'error'
        });
        // setState 写入新的状态值，使命令处理后续读取保持一致。
        setState({
          type: 'error',
          message: errorMessage(error)
        });
      }
    }
    // 显式忽略 `run()` 的返回值，只保留它触发的副作用。
    void run();
  }, [force, target]);
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(() => {
    // 当 `state.type` 匹配 `'success'` 时，命令处理执行对应分支。
    if (state.type === 'success') {
      // Give success message time to render before exiting
      // setTimeout 写入新的状态值，使命令处理后续读取保持一致。
      setTimeout(onDone, 2000, 'Claude Code installation completed successfully', {
        display: 'system' as const
      });
    // 斜杠命令 install在这里处理 `} else if (state.type === 'error') {`，完成这一小步状态转换。
    } else if (state.type === 'error') {
      // Give error message time to render before exiting
      // setTimeout 写入新的状态值，使命令处理后续读取保持一致。
      setTimeout(onDone, 3000, 'Claude Code installation failed', {
        display: 'system' as const
      });
    }
  }, [state, onDone]);
  // 返回 `<Box flexDirection="column" marginTop={1}>`，作为命令处理这次计算的结果。
  return <Box flexDirection="column" marginTop={1}>
      {state.type === 'checking' && <Text color="claude">Checking installation status...</Text>}

      {state.type === 'cleaning-npm' && <Text color="warning">Cleaning up old npm installations...</Text>}

      {state.type === 'installing' && <Text color="claude">
          Installing Claude Code native build {state.version}...
        </Text>}

      {state.type === 'setting-up' && <Text color="claude">Setting up launcher and shell integration...</Text>}

      {state.type === 'set-up' && <SetupNotes messages={state.messages} />}

      {state.type === 'success' && <Box flexDirection="column" gap={1}>
          <Box>
            <StatusIcon status="success" withSpace />
            <Text color="success" bold>
              Claude Code successfully installed!
            </Text>
          </Box>
          <Box marginLeft={2} flexDirection="column" gap={1}>
            {state.version !== 'current' && <Box>
                <Text dimColor>Version: </Text>
                <Text color="claude">{state.version}</Text>
              </Box>}
            <Box>
              <Text dimColor>Location: </Text>
              <Text color="text">{getInstallationPath()}</Text>
            </Box>
          </Box>
          <Box marginLeft={2} flexDirection="column" gap={1}>
            <Box marginTop={1}>
              <Text dimColor>Next: Run </Text>
              <Text color="claude" bold>
                claude --help
              </Text>
              <Text dimColor> to get started</Text>
            </Box>
          </Box>
          {state.setupMessages && <SetupNotes messages={state.setupMessages} />}
        </Box>}

      {state.type === 'error' && <Box flexDirection="column" gap={1}>
          <Box>
            <StatusIcon status="error" withSpace />
            <Text color="error">Installation failed</Text>
          </Box>
          <Text color="error">{state.message}</Text>
          <Box marginTop={1}>
            <Text dimColor>Try running with --force to override checks</Text>
          </Box>
        </Box>}
    </Box>;
}

// This is only used from cli.tsx, not as a slash command
// install 集中保存命令处理斜杠命令 install要一起传递的字段。
export const install = {
  type: 'local-jsx' as const,
  name: 'install',
  description: 'Install Claude Code native build',
  argumentHint: '[options]',
  // 斜杠命令 install在这里处理 `async call(onDone: (result: string, options?: {`，完成这一小步状态转换。
  async call(onDone: (result: string, options?: {
    display?: CommandResultDisplay;
  }) => void, _context: unknown, args: string[]) {
    // Parse arguments
    // force筛选`args.includes`，供命令处理后续处理使用。
    const force = args.includes('--force');
    // nonFlagArgs 集合筛选`args.filter`，供命令处理后续处理使用。
    const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
    // target 命名 `nonFlagArgs[0]; // 'latest', 'stable', or version like '1...`，让后续代码直接表达这个值的用途。
    const target = nonFlagArgs[0]; // 'latest', 'stable', or version like '1.0.34'

    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      unmount
    // 这个回调绑定到 } = await render(<Install onDone={(result, options) => {，负责命令处理在该局部场景下的响应。
    } = await render(<Install onDone={(result, options) => {
      // 调用 unmount，触发命令处理此处需要的副作用。
      unmount();
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(result, options);
    }} force={force} target={target} />);
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJob21lZGlyIiwiam9pbiIsIlJlYWN0IiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJDb21tYW5kUmVzdWx0RGlzcGxheSIsImxvZ0V2ZW50IiwiU3RhdHVzSWNvbiIsIkJveCIsInJlbmRlciIsIlRleHQiLCJsb2dGb3JEZWJ1Z2dpbmciLCJlbnYiLCJlcnJvck1lc3NhZ2UiLCJjaGVja0luc3RhbGwiLCJjbGVhbnVwTnBtSW5zdGFsbGF0aW9ucyIsImNsZWFudXBTaGVsbEFsaWFzZXMiLCJpbnN0YWxsTGF0ZXN0IiwiZ2V0SW5pdGlhbFNldHRpbmdzIiwidXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UiLCJJbnN0YWxsUHJvcHMiLCJvbkRvbmUiLCJyZXN1bHQiLCJvcHRpb25zIiwiZGlzcGxheSIsImZvcmNlIiwidGFyZ2V0IiwiSW5zdGFsbFN0YXRlIiwidHlwZSIsInZlcnNpb24iLCJtZXNzYWdlcyIsInNldHVwTWVzc2FnZXMiLCJtZXNzYWdlIiwid2FybmluZ3MiLCJnZXRJbnN0YWxsYXRpb25QYXRoIiwiaXNXaW5kb3dzIiwicGxhdGZvcm0iLCJob21lRGlyIiwid2luZG93c1BhdGgiLCJyZXBsYWNlIiwiU2V0dXBOb3RlcyIsInQwIiwiJCIsIl9jIiwibGVuZ3RoIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJ0MiIsIm1hcCIsIl90ZW1wIiwidDMiLCJpbmRleCIsIkluc3RhbGwiLCJSZWFjdE5vZGUiLCJzdGF0ZSIsInNldFN0YXRlIiwicnVuIiwiY2hhbm5lbE9yVmVyc2lvbiIsImF1dG9VcGRhdGVzQ2hhbm5lbCIsImxhdGVzdFZlcnNpb24iLCJ3YXNVcGRhdGVkIiwibG9ja0ZhaWxlZCIsIkVycm9yIiwibGV2ZWwiLCJmb3JFYWNoIiwibXNnIiwicmVtb3ZlZCIsImVycm9ycyIsImFsaWFzTWVzc2FnZXMiLCJtIiwiaGFzX3ZlcnNpb24iLCJmb3JjZWQiLCJhbGxXYXJuaW5ncyIsInNldFRpbWVvdXQiLCJjb25zdCIsInVuZGVmaW5lZCIsImVycm9yIiwiaW5zdGFsbCIsIm5hbWUiLCJkZXNjcmlwdGlvbiIsImFyZ3VtZW50SGludCIsImNhbGwiLCJfY29udGV4dCIsImFyZ3MiLCJpbmNsdWRlcyIsIm5vbkZsYWdBcmdzIiwiZmlsdGVyIiwiYXJnIiwic3RhcnRzV2l0aCIsInVubW91bnQiXSwic291cmNlcyI6WyJpbnN0YWxsLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBob21lZGlyIH0gZnJvbSAnbm9kZTpvcydcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdub2RlOnBhdGgnXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBDb21tYW5kUmVzdWx0RGlzcGxheSB9IGZyb20gJ3NyYy9jb21tYW5kcy5qcydcbmltcG9ydCB7IGxvZ0V2ZW50IH0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IFN0YXR1c0ljb24gfSBmcm9tICcuLi9jb21wb25lbnRzL2Rlc2lnbi1zeXN0ZW0vU3RhdHVzSWNvbi5qcydcbmltcG9ydCB7IEJveCwgcmVuZGVyLCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgbG9nRm9yRGVidWdnaW5nIH0gZnJvbSAnLi4vdXRpbHMvZGVidWcuanMnXG5pbXBvcnQgeyBlbnYgfSBmcm9tICcuLi91dGlscy9lbnYuanMnXG5pbXBvcnQgeyBlcnJvck1lc3NhZ2UgfSBmcm9tICcuLi91dGlscy9lcnJvcnMuanMnXG5pbXBvcnQge1xuICBjaGVja0luc3RhbGwsXG4gIGNsZWFudXBOcG1JbnN0YWxsYXRpb25zLFxuICBjbGVhbnVwU2hlbGxBbGlhc2VzLFxuICBpbnN0YWxsTGF0ZXN0LFxufSBmcm9tICcuLi91dGlscy9uYXRpdmVJbnN0YWxsZXIvaW5kZXguanMnXG5pbXBvcnQge1xuICBnZXRJbml0aWFsU2V0dGluZ3MsXG4gIHVwZGF0ZVNldHRpbmdzRm9yU291cmNlLFxufSBmcm9tICcuLi91dGlscy9zZXR0aW5ncy9zZXR0aW5ncy5qcydcblxuaW50ZXJmYWNlIEluc3RhbGxQcm9wcyB7XG4gIG9uRG9uZTogKHJlc3VsdDogc3RyaW5nLCBvcHRpb25zPzogeyBkaXNwbGF5PzogQ29tbWFuZFJlc3VsdERpc3BsYXkgfSkgPT4gdm9pZFxuICBmb3JjZT86IGJvb2xlYW5cbiAgdGFyZ2V0Pzogc3RyaW5nIC8vICdsYXRlc3QnLCAnc3RhYmxlJywgb3IgdmVyc2lvbiBsaWtlICcxLjAuMzQnXG59XG5cbnR5cGUgSW5zdGFsbFN0YXRlID1cbiAgfCB7IHR5cGU6ICdjaGVja2luZycgfVxuICB8IHsgdHlwZTogJ2NsZWFuaW5nLW5wbScgfVxuICB8IHsgdHlwZTogJ2luc3RhbGxpbmcnOyB2ZXJzaW9uOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ3NldHRpbmctdXAnIH1cbiAgfCB7IHR5cGU6ICdzZXQtdXAnOyBtZXNzYWdlczogc3RyaW5nW10gfVxuICB8IHsgdHlwZTogJ3N1Y2Nlc3MnOyB2ZXJzaW9uOiBzdHJpbmc7IHNldHVwTWVzc2FnZXM/OiBzdHJpbmdbXSB9XG4gIHwgeyB0eXBlOiAnZXJyb3InOyBtZXNzYWdlOiBzdHJpbmc7IHdhcm5pbmdzPzogc3RyaW5nW10gfVxuXG5mdW5jdGlvbiBnZXRJbnN0YWxsYXRpb25QYXRoKCk6IHN0cmluZyB7XG4gIGNvbnN0IGlzV2luZG93cyA9IGVudi5wbGF0Zm9ybSA9PT0gJ3dpbjMyJ1xuICBjb25zdCBob21lRGlyID0gaG9tZWRpcigpXG5cbiAgaWYgKGlzV2luZG93cykge1xuICAgIC8vIENvbnZlcnQgdG8gV2luZG93cy1zdHlsZSBwYXRoXG4gICAgY29uc3Qgd2luZG93c1BhdGggPSBqb2luKGhvbWVEaXIsICcubG9jYWwnLCAnYmluJywgJ2NsYXVkZS5leGUnKVxuICAgIC8vIFJlcGxhY2UgZm9yd2FyZCBzbGFzaGVzIHdpdGggYmFja3NsYXNoZXMgZm9yIFdpbmRvd3MgZGlzcGxheVxuICAgIHJldHVybiB3aW5kb3dzUGF0aC5yZXBsYWNlKC9cXC8vZywgJ1xcXFwnKVxuICB9XG5cbiAgcmV0dXJuICd+Ly5sb2NhbC9iaW4vY2xhdWRlJ1xufVxuXG5mdW5jdGlvbiBTZXR1cE5vdGVzKHsgbWVzc2FnZXMgfTogeyBtZXNzYWdlczogc3RyaW5nW10gfSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmIChtZXNzYWdlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezB9IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICA8Qm94PlxuICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICA8U3RhdHVzSWNvbiBzdGF0dXM9XCJ3YXJuaW5nXCIgd2l0aFNwYWNlIC8+XG4gICAgICAgICAgU2V0dXAgbm90ZXM6XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAge21lc3NhZ2VzLm1hcCgobWVzc2FnZSwgaW5kZXgpID0+IChcbiAgICAgICAgPEJveCBrZXk9e2luZGV4fSBtYXJnaW5MZWZ0PXsyfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj7igKIge21lc3NhZ2V9PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICkpfVxuICAgIDwvQm94PlxuICApXG59XG5cbmZ1bmN0aW9uIEluc3RhbGwoeyBvbkRvbmUsIGZvcmNlLCB0YXJnZXQgfTogSW5zdGFsbFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZTxJbnN0YWxsU3RhdGU+KHsgdHlwZTogJ2NoZWNraW5nJyB9KVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYXN5bmMgZnVuY3Rpb24gcnVuKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICAgIGBJbnN0YWxsOiBTdGFydGluZyBpbnN0YWxsYXRpb24gcHJvY2VzcyAoZm9yY2U9JHtmb3JjZX0sIHRhcmdldD0ke3RhcmdldH0pYCxcbiAgICAgICAgKVxuXG4gICAgICAgIC8vIEluc3RhbGwgbmF0aXZlIGJ1aWxkIGZpcnN0XG4gICAgICAgIGNvbnN0IGNoYW5uZWxPclZlcnNpb24gPVxuICAgICAgICAgIHRhcmdldCB8fCBnZXRJbml0aWFsU2V0dGluZ3MoKT8uYXV0b1VwZGF0ZXNDaGFubmVsIHx8ICdsYXRlc3QnXG4gICAgICAgIHNldFN0YXRlKHsgdHlwZTogJ2luc3RhbGxpbmcnLCB2ZXJzaW9uOiBjaGFubmVsT3JWZXJzaW9uIH0pXG5cbiAgICAgICAgLy8gUGFzcyBmb3JjZSBmbGFnIHRvIHRyaWdnZXIgcmVpbnN0YWxsIGV2ZW4gaWYgdXAgdG8gZGF0ZVxuICAgICAgICBsb2dGb3JEZWJ1Z2dpbmcoXG4gICAgICAgICAgYEluc3RhbGw6IENhbGxpbmcgaW5zdGFsbExhdGVzdChjaGFubmVsT3JWZXJzaW9uPSR7Y2hhbm5lbE9yVmVyc2lvbn0sIGZvcmNlUmVpbnN0YWxsPSR7Zm9yY2V9KWAsXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaW5zdGFsbExhdGVzdChjaGFubmVsT3JWZXJzaW9uLCBmb3JjZSlcbiAgICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICAgIGBJbnN0YWxsOiBpbnN0YWxsTGF0ZXN0IHJldHVybmVkIHZlcnNpb249JHtyZXN1bHQubGF0ZXN0VmVyc2lvbn0sIHdhc1VwZGF0ZWQ9JHtyZXN1bHQud2FzVXBkYXRlZH0sIGxvY2tGYWlsZWQ9JHtyZXN1bHQubG9ja0ZhaWxlZH1gLFxuICAgICAgICApXG5cbiAgICAgICAgLy8gQ2hlY2sgc3BlY2lmaWNhbGx5IGZvciBsb2NrIGZhaWx1cmVcbiAgICAgICAgaWYgKHJlc3VsdC5sb2NrRmFpbGVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgJ0NvdWxkIG5vdCBpbnN0YWxsIC0gYW5vdGhlciBwcm9jZXNzIGlzIGN1cnJlbnRseSBpbnN0YWxsaW5nIENsYXVkZS4gUGxlYXNlIHRyeSBhZ2FpbiBpbiBhIG1vbWVudC4nLFxuICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGNvdWxkbid0IGdldCB0aGUgdmVyc2lvbiwgdGhlcmUgbWlnaHQgYmUgYW4gaXNzdWVcbiAgICAgICAgaWYgKCFyZXN1bHQubGF0ZXN0VmVyc2lvbikge1xuICAgICAgICAgIGxvZ0ZvckRlYnVnZ2luZyhcbiAgICAgICAgICAgICdJbnN0YWxsOiBGYWlsZWQgdG8gcmV0cmlldmUgdmVyc2lvbiBpbmZvcm1hdGlvbiBkdXJpbmcgaW5zdGFsbCcsXG4gICAgICAgICAgICB7IGxldmVsOiAnZXJyb3InIH0sXG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyZXN1bHQud2FzVXBkYXRlZCkge1xuICAgICAgICAgIGxvZ0ZvckRlYnVnZ2luZygnSW5zdGFsbDogQWxyZWFkeSB1cCB0byBkYXRlJylcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB1cCBsYXVuY2hlciBhbmQgc2hlbGwgaW50ZWdyYXRpb25cbiAgICAgICAgc2V0U3RhdGUoeyB0eXBlOiAnc2V0dGluZy11cCcgfSlcbiAgICAgICAgY29uc3Qgc2V0dXBNZXNzYWdlcyA9IGF3YWl0IGNoZWNrSW5zdGFsbCh0cnVlKVxuXG4gICAgICAgIGxvZ0ZvckRlYnVnZ2luZyhcbiAgICAgICAgICBgSW5zdGFsbDogU2V0dXAgbGF1bmNoZXIgY29tcGxldGVkIHdpdGggJHtzZXR1cE1lc3NhZ2VzLmxlbmd0aH0gbWVzc2FnZXNgLFxuICAgICAgICApXG4gICAgICAgIGlmIChzZXR1cE1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzZXR1cE1lc3NhZ2VzLmZvckVhY2gobXNnID0+XG4gICAgICAgICAgICBsb2dGb3JEZWJ1Z2dpbmcoYEluc3RhbGw6IFNldHVwIG1lc3NhZ2U6ICR7bXNnLm1lc3NhZ2V9YCksXG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm93IHRoYXQgbmF0aXZlIGluc3RhbGxhdGlvbiBzdWNjZWVkZWQsIGNsZWFuIHVwIG9sZCBucG0gaW5zdGFsbGF0aW9uc1xuICAgICAgICBsb2dGb3JEZWJ1Z2dpbmcoXG4gICAgICAgICAgJ0luc3RhbGw6IENsZWFuaW5nIHVwIG5wbSBpbnN0YWxsYXRpb25zIGFmdGVyIHN1Y2Nlc3NmdWwgaW5zdGFsbCcsXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgeyByZW1vdmVkLCBlcnJvcnMsIHdhcm5pbmdzIH0gPSBhd2FpdCBjbGVhbnVwTnBtSW5zdGFsbGF0aW9ucygpXG5cbiAgICAgICAgaWYgKHJlbW92ZWQgPiAwKSB7XG4gICAgICAgICAgbG9nRm9yRGVidWdnaW5nKGBDbGVhbmVkIHVwICR7cmVtb3ZlZH0gbnBtIGluc3RhbGxhdGlvbihzKWApXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBsb2dGb3JEZWJ1Z2dpbmcoYENsZWFudXAgZXJyb3JzOiAke2Vycm9ycy5qb2luKCcsICcpfWApXG4gICAgICAgICAgLy8gQ29udGludWUgZGVzcGl0ZSBjbGVhbnVwIGVycm9ycyAtIG5hdGl2ZSBpbnN0YWxsIGFscmVhZHkgc3VjY2VlZGVkXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhbiB1cCBvbGQgc2hlbGwgYWxpYXNlc1xuICAgICAgICBjb25zdCBhbGlhc01lc3NhZ2VzID0gYXdhaXQgY2xlYW51cFNoZWxsQWxpYXNlcygpXG4gICAgICAgIGlmIChhbGlhc01lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBsb2dGb3JEZWJ1Z2dpbmcoXG4gICAgICAgICAgICBgU2hlbGwgYWxpYXMgY2xlYW51cDogJHthbGlhc01lc3NhZ2VzLm1hcChtID0+IG0ubWVzc2FnZSkuam9pbignOyAnKX1gLFxuICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExvZyBzdWNjZXNzIGV2ZW50XG4gICAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9jbGF1ZGVfaW5zdGFsbF9jb21tYW5kJywge1xuICAgICAgICAgIGhhc192ZXJzaW9uOiByZXN1bHQubGF0ZXN0VmVyc2lvbiA/IDEgOiAwLFxuICAgICAgICAgIGZvcmNlZDogZm9yY2UgPyAxIDogMCxcbiAgICAgICAgfSlcblxuICAgICAgICAvLyBJZiB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIGEgY2hhbm5lbCwgc2F2ZSBpdCB0byBzZXR0aW5nc1xuICAgICAgICBpZiAodGFyZ2V0ID09PSAnbGF0ZXN0JyB8fCB0YXJnZXQgPT09ICdzdGFibGUnKSB7XG4gICAgICAgICAgdXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UoJ3VzZXJTZXR0aW5ncycsIHtcbiAgICAgICAgICAgIGF1dG9VcGRhdGVzQ2hhbm5lbDogdGFyZ2V0LFxuICAgICAgICAgIH0pXG4gICAgICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICAgICAgYEluc3RhbGw6IFNhdmVkIGF1dG9VcGRhdGVzQ2hhbm5lbD0ke3RhcmdldH0gdG8gdXNlciBzZXR0aW5nc2AsXG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29tYmluZSBhbGwgd2FybmluZy9pbmZvIG1lc3NhZ2VzIChjb252ZXJ0IFNldHVwTWVzc2FnZSB0byBzdHJpbmcpXG4gICAgICAgIGNvbnN0IGFsbFdhcm5pbmdzID0gWy4uLndhcm5pbmdzLCAuLi5hbGlhc01lc3NhZ2VzLm1hcChtID0+IG0ubWVzc2FnZSldXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgd2VyZSBhbnkgc2V0dXAgZXJyb3JzIG9yIG5vdGVzXG4gICAgICAgIGlmIChzZXR1cE1lc3NhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzZXRTdGF0ZSh7XG4gICAgICAgICAgICB0eXBlOiAnc2V0LXVwJyxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBzZXR1cE1lc3NhZ2VzLm1hcChtID0+IG0ubWVzc2FnZSksXG4gICAgICAgICAgfSlcbiAgICAgICAgICAvLyBTdGlsbCBtYXJrIGFzIHN1Y2Nlc3MgYnV0IHNob3cgYm90aCBzZXR1cCBtZXNzYWdlcyBhbmQgY2xlYW51cCB3YXJuaW5nc1xuICAgICAgICAgIHNldFRpbWVvdXQoc2V0U3RhdGUsIDIwMDAsIHtcbiAgICAgICAgICAgIHR5cGU6ICdzdWNjZXNzJyBhcyBjb25zdCxcbiAgICAgICAgICAgIHZlcnNpb246IHJlc3VsdC5sYXRlc3RWZXJzaW9uIHx8ICdjdXJyZW50JyxcbiAgICAgICAgICAgIHNldHVwTWVzc2FnZXM6IFtcbiAgICAgICAgICAgICAgLi4uc2V0dXBNZXNzYWdlcy5tYXAobSA9PiBtLm1lc3NhZ2UpLFxuICAgICAgICAgICAgICAuLi5hbGxXYXJuaW5ncyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBObyBzZXR1cCBtZXNzYWdlcywgZ28gc3RyYWlnaHQgdG8gc3VjY2VzcyAoYnV0IHN0aWxsIHNob3cgY2xlYW51cCB3YXJuaW5ncyBpZiBhbnkpXG4gICAgICAgICAgbG9nRm9yRGVidWdnaW5nKCdJbnN0YWxsOiBTaGVsbCBQQVRIIGFscmVhZHkgY29uZmlndXJlZCcpXG4gICAgICAgICAgc2V0U3RhdGUoe1xuICAgICAgICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgdmVyc2lvbjogcmVzdWx0LmxhdGVzdFZlcnNpb24gfHwgJ2N1cnJlbnQnLFxuICAgICAgICAgICAgc2V0dXBNZXNzYWdlczogYWxsV2FybmluZ3MubGVuZ3RoID4gMCA/IGFsbFdhcm5pbmdzIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ0ZvckRlYnVnZ2luZyhgSW5zdGFsbCBjb21tYW5kIGZhaWxlZDogJHtlcnJvcn1gLCB7XG4gICAgICAgICAgbGV2ZWw6ICdlcnJvcicsXG4gICAgICAgIH0pXG4gICAgICAgIHNldFN0YXRlKHtcbiAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6IGVycm9yTWVzc2FnZShlcnJvciksXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgdm9pZCBydW4oKVxuICB9LCBbZm9yY2UsIHRhcmdldF0pXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoc3RhdGUudHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAvLyBHaXZlIHN1Y2Nlc3MgbWVzc2FnZSB0aW1lIHRvIHJlbmRlciBiZWZvcmUgZXhpdGluZ1xuICAgICAgc2V0VGltZW91dChcbiAgICAgICAgb25Eb25lLFxuICAgICAgICAyMDAwLFxuICAgICAgICAnQ2xhdWRlIENvZGUgaW5zdGFsbGF0aW9uIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICB7XG4gICAgICAgICAgZGlzcGxheTogJ3N5c3RlbScgYXMgY29uc3QsXG4gICAgICAgIH0sXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChzdGF0ZS50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAvLyBHaXZlIGVycm9yIG1lc3NhZ2UgdGltZSB0byByZW5kZXIgYmVmb3JlIGV4aXRpbmdcbiAgICAgIHNldFRpbWVvdXQob25Eb25lLCAzMDAwLCAnQ2xhdWRlIENvZGUgaW5zdGFsbGF0aW9uIGZhaWxlZCcsIHtcbiAgICAgICAgZGlzcGxheTogJ3N5c3RlbScgYXMgY29uc3QsXG4gICAgICB9KVxuICAgIH1cbiAgfSwgW3N0YXRlLCBvbkRvbmVdKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgIHtzdGF0ZS50eXBlID09PSAnY2hlY2tpbmcnICYmIChcbiAgICAgICAgPFRleHQgY29sb3I9XCJjbGF1ZGVcIj5DaGVja2luZyBpbnN0YWxsYXRpb24gc3RhdHVzLi4uPC9UZXh0PlxuICAgICAgKX1cblxuICAgICAge3N0YXRlLnR5cGUgPT09ICdjbGVhbmluZy1ucG0nICYmIChcbiAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCI+Q2xlYW5pbmcgdXAgb2xkIG5wbSBpbnN0YWxsYXRpb25zLi4uPC9UZXh0PlxuICAgICAgKX1cblxuICAgICAge3N0YXRlLnR5cGUgPT09ICdpbnN0YWxsaW5nJyAmJiAoXG4gICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+XG4gICAgICAgICAgSW5zdGFsbGluZyBDbGF1ZGUgQ29kZSBuYXRpdmUgYnVpbGQge3N0YXRlLnZlcnNpb259Li4uXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0ZS50eXBlID09PSAnc2V0dGluZy11cCcgJiYgKFxuICAgICAgICA8VGV4dCBjb2xvcj1cImNsYXVkZVwiPlNldHRpbmcgdXAgbGF1bmNoZXIgYW5kIHNoZWxsIGludGVncmF0aW9uLi4uPC9UZXh0PlxuICAgICAgKX1cblxuICAgICAge3N0YXRlLnR5cGUgPT09ICdzZXQtdXAnICYmIDxTZXR1cE5vdGVzIG1lc3NhZ2VzPXtzdGF0ZS5tZXNzYWdlc30gLz59XG5cbiAgICAgIHtzdGF0ZS50eXBlID09PSAnc3VjY2VzcycgJiYgKFxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICAgIDxCb3g+XG4gICAgICAgICAgICA8U3RhdHVzSWNvbiBzdGF0dXM9XCJzdWNjZXNzXCIgd2l0aFNwYWNlIC8+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1Y2Nlc3NcIiBib2xkPlxuICAgICAgICAgICAgICBDbGF1ZGUgQ29kZSBzdWNjZXNzZnVsbHkgaW5zdGFsbGVkIVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICAgIDxCb3ggbWFyZ2luTGVmdD17Mn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgICAgICB7c3RhdGUudmVyc2lvbiAhPT0gJ2N1cnJlbnQnICYmIChcbiAgICAgICAgICAgICAgPEJveD5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5WZXJzaW9uOiA8L1RleHQ+XG4gICAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF1ZGVcIj57c3RhdGUudmVyc2lvbn08L1RleHQ+XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxCb3g+XG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPkxvY2F0aW9uOiA8L1RleHQ+XG4gICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwidGV4dFwiPntnZXRJbnN0YWxsYXRpb25QYXRoKCl9PC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPEJveCBtYXJnaW5MZWZ0PXsyfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+TmV4dDogUnVuIDwvVGV4dD5cbiAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJjbGF1ZGVcIiBib2xkPlxuICAgICAgICAgICAgICAgIGNsYXVkZSAtLWhlbHBcbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gdG8gZ2V0IHN0YXJ0ZWQ8L1RleHQ+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgICB7c3RhdGUuc2V0dXBNZXNzYWdlcyAmJiA8U2V0dXBOb3RlcyBtZXNzYWdlcz17c3RhdGUuc2V0dXBNZXNzYWdlc30gLz59XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cblxuICAgICAge3N0YXRlLnR5cGUgPT09ICdlcnJvcicgJiYgKFxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICAgIDxCb3g+XG4gICAgICAgICAgICA8U3RhdHVzSWNvbiBzdGF0dXM9XCJlcnJvclwiIHdpdGhTcGFjZSAvPlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPkluc3RhbGxhdGlvbiBmYWlsZWQ8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPntzdGF0ZS5tZXNzYWdlfTwvVGV4dD5cbiAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5UcnkgcnVubmluZyB3aXRoIC0tZm9yY2UgdG8gb3ZlcnJpZGUgY2hlY2tzPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuLy8gVGhpcyBpcyBvbmx5IHVzZWQgZnJvbSBjbGkudHN4LCBub3QgYXMgYSBzbGFzaCBjb21tYW5kXG5leHBvcnQgY29uc3QgaW5zdGFsbCA9IHtcbiAgdHlwZTogJ2xvY2FsLWpzeCcgYXMgY29uc3QsXG4gIG5hbWU6ICdpbnN0YWxsJyxcbiAgZGVzY3JpcHRpb246ICdJbnN0YWxsIENsYXVkZSBDb2RlIG5hdGl2ZSBidWlsZCcsXG4gIGFyZ3VtZW50SGludDogJ1tvcHRpb25zXScsXG4gIGFzeW5jIGNhbGwoXG4gICAgb25Eb25lOiAoXG4gICAgICByZXN1bHQ6IHN0cmluZyxcbiAgICAgIG9wdGlvbnM/OiB7IGRpc3BsYXk/OiBDb21tYW5kUmVzdWx0RGlzcGxheSB9LFxuICAgICkgPT4gdm9pZCxcbiAgICBfY29udGV4dDogdW5rbm93bixcbiAgICBhcmdzOiBzdHJpbmdbXSxcbiAgKSB7XG4gICAgLy8gUGFyc2UgYXJndW1lbnRzXG4gICAgY29uc3QgZm9yY2UgPSBhcmdzLmluY2x1ZGVzKCctLWZvcmNlJylcbiAgICBjb25zdCBub25GbGFnQXJncyA9IGFyZ3MuZmlsdGVyKGFyZyA9PiAhYXJnLnN0YXJ0c1dpdGgoJy0tJykpXG4gICAgY29uc3QgdGFyZ2V0ID0gbm9uRmxhZ0FyZ3NbMF0gLy8gJ2xhdGVzdCcsICdzdGFibGUnLCBvciB2ZXJzaW9uIGxpa2UgJzEuMC4zNCdcblxuICAgIGNvbnN0IHsgdW5tb3VudCB9ID0gYXdhaXQgcmVuZGVyKFxuICAgICAgPEluc3RhbGxcbiAgICAgICAgb25Eb25lPXsocmVzdWx0LCBvcHRpb25zKSA9PiB7XG4gICAgICAgICAgdW5tb3VudCgpXG4gICAgICAgICAgb25Eb25lKHJlc3VsdCwgb3B0aW9ucylcbiAgICAgICAgfX1cbiAgICAgICAgZm9yY2U9e2ZvcmNlfVxuICAgICAgICB0YXJnZXQ9e3RhcmdldH1cbiAgICAgIC8+LFxuICAgIClcbiAgfSxcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLE9BQU8sUUFBUSxTQUFTO0FBQ2pDLFNBQVNDLElBQUksUUFBUSxXQUFXO0FBQ2hDLE9BQU9DLEtBQUssSUFBSUMsU0FBUyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNsRCxjQUFjQyxvQkFBb0IsUUFBUSxpQkFBaUI7QUFDM0QsU0FBU0MsUUFBUSxRQUFRLGlDQUFpQztBQUMxRCxTQUFTQyxVQUFVLFFBQVEsMkNBQTJDO0FBQ3RFLFNBQVNDLEdBQUcsRUFBRUMsTUFBTSxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUM3QyxTQUFTQyxlQUFlLFFBQVEsbUJBQW1CO0FBQ25ELFNBQVNDLEdBQUcsUUFBUSxpQkFBaUI7QUFDckMsU0FBU0MsWUFBWSxRQUFRLG9CQUFvQjtBQUNqRCxTQUNFQyxZQUFZLEVBQ1pDLHVCQUF1QixFQUN2QkMsbUJBQW1CLEVBQ25CQyxhQUFhLFFBQ1IsbUNBQW1DO0FBQzFDLFNBQ0VDLGtCQUFrQixFQUNsQkMsdUJBQXVCLFFBQ2xCLCtCQUErQjtBQUV0QyxVQUFVQyxZQUFZLENBQUM7RUFDckJDLE1BQU0sRUFBRSxDQUFDQyxNQUFNLEVBQUUsTUFBTSxFQUFFQyxPQUE0QyxDQUFwQyxFQUFFO0lBQUVDLE9BQU8sQ0FBQyxFQUFFbkIsb0JBQW9CO0VBQUMsQ0FBQyxFQUFFLEdBQUcs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
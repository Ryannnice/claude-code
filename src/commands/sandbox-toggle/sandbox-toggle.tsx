// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 getCwdState，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getCwdState } from '../../bootstrap/state.js';
// 复用 SandboxSettings 终端界面组件，避免在这里重复拼装显示逻辑。
import { SandboxSettings } from '../../components/sandbox/SandboxSettings.js';
// 引入 color，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { color } from '../../ink.js';
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js';
// 复用 addToExcludedCommands、SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { addToExcludedCommands, SandboxManager } from '../../utils/sandbox/sandbox-adapter.js';
// 复用 getSettings_DEPRECATED、getSettingsFilePathForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED, getSettingsFilePathForSource } from '../../utils/settings/settings.js';
// 类型依赖 { ThemeName } 来自 ../../utils/theme.js，用于校准命令处理的数据契约。
import type { ThemeName } from '../../utils/theme.js';
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: (result?: string) => void, _context: unknown, args?: string): Promise<React.ReactNode | null> {
  // settings 集合读取`getSettings_DEPRECATED`，供命令处理后续处理使用。
  const settings = getSettings_DEPRECATED();
  // 主题名称标记斜杠命令 sandbox toggle是否启用对应路径。
  const themeName: ThemeName = settings.theme as ThemeName || 'light';
  // platform读取`getPlatform`，供命令处理后续处理使用。
  const platform = getPlatform();
  // 满足 `!SandboxManager.isSupportedPlatform()` 时，命令处理执行该分支。
  if (!SandboxManager.isSupportedPlatform()) {
    // WSL1 users will see this since isSupportedPlatform returns false for WSL1
    // errorMessage 消息数据标记命令处理斜杠命令 sandbox toggle是否启用对应路径。
    const errorMessage = platform === 'wsl' ? 'Error: Sandboxing requires WSL2. WSL1 is not supported.' : 'Error: Sandboxing is currently only supported on macOS, Linux, and WSL2.';
    // 消息保存`color`，供命令处理后续处理使用。
    const message = color('error', themeName)(errorMessage);
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(message);
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }

  // Check dependencies - get structured result with errors/warnings
  // depCheck读取`SandboxManager.checkDependencies`，供命令处理后续处理使用。
  const depCheck = SandboxManager.checkDependencies();

  // Check if platform is in enabledPlatforms list (undocumented enterprise setting)
  // 满足 `!SandboxManager.isPlatformInEnabledList()` 时，命令处理执行该分支。
  if (!SandboxManager.isPlatformInEnabledList()) {
    // 消息保存`color`，供命令处理后续处理使用。
    const message = color('error', themeName)(`Error: Sandboxing is disabled for this platform (${platform}) via the enabledPlatforms setting.`);
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(message);
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }

  // Check if sandbox settings are locked by higher-priority settings
  // 满足 `SandboxManager.areSandboxSettingsLockedByPolicy()` 时，命令处理执行该分支。
  if (SandboxManager.areSandboxSettingsLockedByPolicy()) {
    // 消息保存`color`，供命令处理后续处理使用。
    const message = color('error', themeName)('Error: Sandbox settings are overridden by a higher-priority configuration and cannot be changed locally.');
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(message);
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }

  // Parse the arguments
  // trimmedArgs 集合格式化`trim`，供命令处理后续处理使用。
  const trimmedArgs = args?.trim() || '';

  // If no args, show the interactive menu
  // trimmedArgs 集合缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!trimmedArgs) {
    // 返回 `<SandboxSettings onComplete={onDone} depCheck={depCheck} />`，作为命令处理这次计算的结果。
    return <SandboxSettings onComplete={onDone} depCheck={depCheck} />;
  }

  // Handle subcommands
  // 满足 `trimmedArgs` 时，命令处理执行该分支。
  if (trimmedArgs) {
    // 片段列表格式化`trimmedArgs.split`，供命令处理后续处理使用。
    const parts = trimmedArgs.split(' ');
    // subcommand 命令数据 命名 `parts[0]`，让后续代码直接表达这个值的用途。
    const subcommand = parts[0];
    // 当 `subcommand` 匹配 `'exclude'` 时，命令处理执行对应分支。
    if (subcommand === 'exclude') {
      // Handle exclude subcommand
      // commandPattern 命令数据格式化`trimmedArgs.slice`，供命令处理后续处理使用。
      const commandPattern = trimmedArgs.slice('exclude '.length).trim();
      // commandPattern 命令数据缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!commandPattern) {
        // 消息保存`color`，供命令处理后续处理使用。
        const message = color('error', themeName)('Error: Please provide a command pattern to exclude (e.g., /sandbox exclude "npm run test:*")');
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone(message);
        // 返回 `null`，作为命令处理这次计算的结果。
        return null;
      }

      // Remove quotes if present
      // cleanPattern格式化`commandPattern.replace`，供命令处理后续处理使用。
      const cleanPattern = commandPattern.replace(/^["']|["']$/g, '');

      // Add to excludedCommands
      // addToExcludedCommands执行命令处理在此处需要的副作用或外部交互。
      addToExcludedCommands(cleanPattern);

      // Get the local settings path and make it relative to cwd
      // localSettingsPath 文件数据读取`getSettingsFilePathForSource`，供命令处理后续处理使用。
      const localSettingsPath = getSettingsFilePathForSource('localSettings');
      // relativePath 文件数据保存`relative`，供命令处理后续处理使用。
      const relativePath = localSettingsPath ? relative(getCwdState(), localSettingsPath) : '.claude/settings.local.json';
      // 消息保存`color`，供命令处理后续处理使用。
      const message = color('success', themeName)(`Added "${cleanPattern}" to excluded commands in ${relativePath}`);
      // onDone执行命令处理在此处需要的副作用或外部交互。
      onDone(message);
      // 返回 null，把命令处理这个分支的结果交还调用方。
      return null;
    } else {
      // Unknown subcommand
      // 消息保存`color`，供命令处理后续处理使用。
      const message = color('error', themeName)(`Error: Unknown subcommand "${subcommand}". Available subcommand: exclude`);
      // onDone执行命令处理在此处需要的副作用或外部交互。
      onDone(message);
      // 返回 null，把命令处理这个分支的结果交还调用方。
      return null;
    }
  }

  // Should never reach here since we handle all cases above
  // 返回 null，把命令处理这个分支的结果交还调用方。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZWxhdGl2ZSIsIlJlYWN0IiwiZ2V0Q3dkU3RhdGUiLCJTYW5kYm94U2V0dGluZ3MiLCJjb2xvciIsImdldFBsYXRmb3JtIiwiYWRkVG9FeGNsdWRlZENvbW1hbmRzIiwiU2FuZGJveE1hbmFnZXIiLCJnZXRTZXR0aW5nc19ERVBSRUNBVEVEIiwiZ2V0U2V0dGluZ3NGaWxlUGF0aEZvclNvdXJjZSIsIlRoZW1lTmFtZSIsImNhbGwiLCJvbkRvbmUiLCJyZXN1bHQiLCJfY29udGV4dCIsImFyZ3MiLCJQcm9taXNlIiwiUmVhY3ROb2RlIiwic2V0dGluZ3MiLCJ0aGVtZU5hbWUiLCJ0aGVtZSIsInBsYXRmb3JtIiwiaXNTdXBwb3J0ZWRQbGF0Zm9ybSIsImVycm9yTWVzc2FnZSIsIm1lc3NhZ2UiLCJkZXBDaGVjayIsImNoZWNrRGVwZW5kZW5jaWVzIiwiaXNQbGF0Zm9ybUluRW5hYmxlZExpc3QiLCJhcmVTYW5kYm94U2V0dGluZ3NMb2NrZWRCeVBvbGljeSIsInRyaW1tZWRBcmdzIiwidHJpbSIsInBhcnRzIiwic3BsaXQiLCJzdWJjb21tYW5kIiwiY29tbWFuZFBhdHRlcm4iLCJzbGljZSIsImxlbmd0aCIsImNsZWFuUGF0dGVybiIsInJlcGxhY2UiLCJsb2NhbFNldHRpbmdzUGF0aCIsInJlbGF0aXZlUGF0aCJdLCJzb3VyY2VzIjpbInNhbmRib3gtdG9nZ2xlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWxhdGl2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBnZXRDd2RTdGF0ZSB9IGZyb20gJy4uLy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB7IFNhbmRib3hTZXR0aW5ncyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvc2FuZGJveC9TYW5kYm94U2V0dGluZ3MuanMnXG5pbXBvcnQgeyBjb2xvciB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGdldFBsYXRmb3JtIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGxhdGZvcm0uanMnXG5pbXBvcnQge1xuICBhZGRUb0V4Y2x1ZGVkQ29tbWFuZHMsXG4gIFNhbmRib3hNYW5hZ2VyLFxufSBmcm9tICcuLi8uLi91dGlscy9zYW5kYm94L3NhbmRib3gtYWRhcHRlci5qcydcbmltcG9ydCB7XG4gIGdldFNldHRpbmdzX0RFUFJFQ0FURUQsXG4gIGdldFNldHRpbmdzRmlsZVBhdGhGb3JTb3VyY2UsXG59IGZyb20gJy4uLy4uL3V0aWxzL3NldHRpbmdzL3NldHRpbmdzLmpzJ1xuaW1wb3J0IHR5cGUgeyBUaGVtZU5hbWUgfSBmcm9tICcuLi8uLi91dGlscy90aGVtZS5qcydcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGwoXG4gIG9uRG9uZTogKHJlc3VsdD86IHN0cmluZykgPT4gdm9pZCxcbiAgX2NvbnRleHQ6IHVua25vd24sXG4gIGFyZ3M/OiBzdHJpbmcsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZSB8IG51bGw+IHtcbiAgY29uc3Qgc2V0dGluZ3MgPSBnZXRTZXR0aW5nc19ERVBSRUNBVEVEKClcbiAgY29uc3QgdGhlbWVOYW1lOiBUaGVtZU5hbWUgPSAoc2V0dGluZ3MudGhlbWUgYXMgVGhlbWVOYW1lKSB8fCAnbGlnaHQnXG5cbiAgY29uc3QgcGxhdGZvcm0gPSBnZXRQbGF0Zm9ybSgpXG5cbiAgaWYgKCFTYW5kYm94TWFuYWdlci5pc1N1cHBvcnRlZFBsYXRmb3JtKCkpIHtcbiAgICAvLyBXU0wxIHVzZXJzIHdpbGwgc2VlIHRoaXMgc2luY2UgaXNTdXBwb3J0ZWRQbGF0Zm9ybSByZXR1cm5zIGZhbHNlIGZvciBXU0wxXG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID1cbiAgICAgIHBsYXRmb3JtID09PSAnd3NsJ1xuICAgICAgICA/ICdFcnJvcjogU2FuZGJveGluZyByZXF1aXJlcyBXU0wyLiBXU0wxIGlzIG5vdCBzdXBwb3J0ZWQuJ1xuICAgICAgICA6ICdFcnJvcjogU2FuZGJveGluZyBpcyBjdXJyZW50bHkgb25seSBzdXBwb3J0ZWQgb24gbWFjT1MsIExpbnV4LCBhbmQgV1NMMi4nXG4gICAgY29uc3QgbWVzc2FnZSA9IGNvbG9yKCdlcnJvcicsIHRoZW1lTmFtZSkoZXJyb3JNZXNzYWdlKVxuICAgIG9uRG9uZShtZXNzYWdlKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBDaGVjayBkZXBlbmRlbmNpZXMgLSBnZXQgc3RydWN0dXJlZCByZXN1bHQgd2l0aCBlcnJvcnMvd2FybmluZ3NcbiAgY29uc3QgZGVwQ2hlY2sgPSBTYW5kYm94TWFuYWdlci5jaGVja0RlcGVuZGVuY2llcygpXG5cbiAgLy8gQ2hlY2sgaWYgcGxhdGZvcm0gaXMgaW4gZW5hYmxlZFBsYXRmb3JtcyBsaXN0ICh1bmRvY3VtZW50ZWQgZW50ZXJwcmlzZSBzZXR0aW5nKVxuICBpZiAoIVNhbmRib3hNYW5hZ2VyLmlzUGxhdGZvcm1JbkVuYWJsZWRMaXN0KCkpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY29sb3IoXG4gICAgICAnZXJyb3InLFxuICAgICAgdGhlbWVOYW1lLFxuICAgICkoXG4gICAgICBgRXJyb3I6IFNhbmRib3hpbmcgaXMgZGlzYWJsZWQgZm9yIHRoaXMgcGxhdGZvcm0gKCR7cGxhdGZvcm19KSB2aWEgdGhlIGVuYWJsZWRQbGF0Zm9ybXMgc2V0dGluZy5gLFxuICAgIClcbiAgICBvbkRvbmUobWVzc2FnZSlcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gQ2hlY2sgaWYgc2FuZGJveCBzZXR0aW5ncyBhcmUgbG9ja2VkIGJ5IGhpZ2hlci1wcmlvcml0eSBzZXR0aW5nc1xuICBpZiAoU2FuZGJveE1hbmFnZXIuYXJlU2FuZGJveFNldHRpbmdzTG9ja2VkQnlQb2xpY3koKSkge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjb2xvcihcbiAgICAgICdlcnJvcicsXG4gICAgICB0aGVtZU5hbWUsXG4gICAgKShcbiAgICAgICdFcnJvcjogU2FuZGJveCBzZXR0aW5ncyBhcmUgb3ZlcnJpZGRlbiBieSBhIGhpZ2hlci1wcmlvcml0eSBjb25maWd1cmF0aW9uIGFuZCBjYW5ub3QgYmUgY2hhbmdlZCBsb2NhbGx5LicsXG4gICAgKVxuICAgIG9uRG9uZShtZXNzYWdlKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBQYXJzZSB0aGUgYXJndW1lbnRzXG4gIGNvbnN0IHRyaW1tZWRBcmdzID0gYXJncz8udHJpbSgpIHx8ICcnXG5cbiAgLy8gSWYgbm8gYXJncywgc2hvdyB0aGUgaW50ZXJhY3RpdmUgbWVudVxuICBpZiAoIXRyaW1tZWRBcmdzKSB7XG4gICAgcmV0dXJuIDxTYW5kYm94U2V0dGluZ3Mgb25Db21wbGV0ZT17b25Eb25lfSBkZXBDaGVjaz17ZGVwQ2hlY2t9IC8+XG4gIH1cblxuICAvLyBIYW5kbGUgc3ViY29tbWFuZHNcbiAgaWYgKHRyaW1tZWRBcmdzKSB7XG4gICAgY29uc3QgcGFydHMgPSB0cmltbWVkQXJncy5zcGxpdCgnICcpXG4gICAgY29uc3Qgc3ViY29tbWFuZCA9IHBhcnRzWzBdXG5cbiAgICBpZiAoc3ViY29tbWFuZCA9PT0gJ2V4Y2x1ZGUnKSB7XG4gICAgICAvLyBIYW5kbGUgZXhjbHVkZSBzdWJjb21tYW5kXG4gICAgICBjb25zdCBjb21tYW5kUGF0dGVybiA9IHRyaW1tZWRBcmdzLnNsaWNlKCdleGNsdWRlICcubGVuZ3RoKS50cmltKClcblxuICAgICAgaWYgKCFjb21tYW5kUGF0dGVybikge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gY29sb3IoXG4gICAgICAgICAgJ2Vycm9yJyxcbiAgICAgICAgICB0aGVtZU5hbWUsXG4gICAgICAgICkoXG4gICAgICAgICAgJ0Vycm9yOiBQbGVhc2UgcHJvdmlkZSBhIGNvbW1hbmQgcGF0dGVybiB0byBleGNsdWRlIChlLmcuLCAvc2FuZGJveCBleGNsdWRlIFwibnBtIHJ1biB0ZXN0OipcIiknLFxuICAgICAgICApXG4gICAgICAgIG9uRG9uZShtZXNzYWdlKVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgcXVvdGVzIGlmIHByZXNlbnRcbiAgICAgIGNvbnN0IGNsZWFuUGF0dGVybiA9IGNvbW1hbmRQYXR0ZXJuLnJlcGxhY2UoL15bXCInXXxbXCInXSQvZywgJycpXG5cbiAgICAgIC8vIEFkZCB0byBleGNsdWRlZENvbW1hbmRzXG4gICAgICBhZGRUb0V4Y2x1ZGVkQ29tbWFuZHMoY2xlYW5QYXR0ZXJuKVxuXG4gICAgICAvLyBHZXQgdGhlIGxvY2FsIHNldHRpbmdzIHBhdGggYW5kIG1ha2UgaXQgcmVsYXRpdmUgdG8gY3dkXG4gICAgICBjb25zdCBsb2NhbFNldHRpbmdzUGF0aCA9IGdldFNldHRpbmdzRmlsZVBhdGhGb3JTb3VyY2UoJ2xvY2FsU2V0dGluZ3MnKVxuICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gbG9jYWxTZXR0aW5nc1BhdGhcbiAgICAgICAgPyByZWxhdGl2ZShnZXRDd2RTdGF0ZSgpLCBsb2NhbFNldHRpbmdzUGF0aClcbiAgICAgICAgOiAnLmNsYXVkZS9zZXR0aW5ncy5sb2NhbC5qc29uJ1xuXG4gICAgICBjb25zdCBtZXNzYWdlID0gY29sb3IoXG4gICAgICAgICdzdWNjZXNzJyxcbiAgICAgICAgdGhlbWVOYW1lLFxuICAgICAgKShgQWRkZWQgXCIke2NsZWFuUGF0dGVybn1cIiB0byBleGNsdWRlZCBjb21tYW5kcyBpbiAke3JlbGF0aXZlUGF0aH1gKVxuXG4gICAgICBvbkRvbmUobWVzc2FnZSlcbiAgICAgIHJldHVybiBudWxsXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVua25vd24gc3ViY29tbWFuZFxuICAgICAgY29uc3QgbWVzc2FnZSA9IGNvbG9yKFxuICAgICAgICAnZXJyb3InLFxuICAgICAgICB0aGVtZU5hbWUsXG4gICAgICApKFxuICAgICAgICBgRXJyb3I6IFVua25vd24gc3ViY29tbWFuZCBcIiR7c3ViY29tbWFuZH1cIi4gQXZhaWxhYmxlIHN1YmNvbW1hbmQ6IGV4Y2x1ZGVgLFxuICAgICAgKVxuICAgICAgb25Eb25lKG1lc3NhZ2UpXG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxuXG4gIC8vIFNob3VsZCBuZXZlciByZWFjaCBoZXJlIHNpbmNlIHdlIGhhbmRsZSBhbGwgY2FzZXMgYWJvdmVcbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBU0EsUUFBUSxRQUFRLE1BQU07QUFDL0IsT0FBT0MsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsV0FBVyxRQUFRLDBCQUEwQjtBQUN0RCxTQUFTQyxlQUFlLFFBQVEsNkNBQTZDO0FBQzdFLFNBQVNDLEtBQUssUUFBUSxjQUFjO0FBQ3BDLFNBQVNDLFdBQVcsUUFBUSx5QkFBeUI7QUFDckQsU0FDRUMscUJBQXFCLEVBQ3JCQyxjQUFjLFFBQ1Qsd0NBQXdDO0FBQy9DLFNBQ0VDLHNCQUFzQixFQUN0QkMsNEJBQTRCLFFBQ3ZCLGtDQUFrQztBQUN6QyxjQUFjQyxTQUFTLFFBQVEsc0JBQXNCO0FBRXJELE9BQU8sZUFBZUMsSUFBSUEsQ0FDeEJDLE1BQU0sRUFBRSxDQUFDQyxNQUFlLENBQVIsRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLEVBQ2pDQyxRQUFRLEVBQUUsT0FBTyxFQUNqQkMsSUFBYSxDQUFSLEVBQUUsTUFBTSxDQUNkLEVBQUVDLE9BQU8sQ0FBQ2YsS0FBSyxDQUFDZ0IsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO0VBQ2pDLE1BQU1DLFFBQVEsR0FBR1Ysc0JBQXNCLENBQUMsQ0FBQztFQUN6QyxNQUFNVyxTQUFTLEVBQUVULFNBQVMsR0FBSVEsUUFBUSxDQUFDRSxLQUFLLElBQUlWLFNBQVMsSUFBSyxPQUFPO0VBRXJFLE1BQU1XLFFBQVEsR0FBR2hCLFdBQVcsQ0FBQyxDQUFDO0VBRTlCLElBQUksQ0FBQ0UsY0FBYyxDQUFDZSxtQkFBbUIsQ0FBQyxDQUFDLEVBQUU7SUFDekM7SUFDQSxNQUFNQyxZQUFZLEdBQ2hCRixRQUFRLEtBQUssS0FBSyxHQUNkLHlEQUF5RCxHQUN6RCwwRUFBMEU7SUFDaEYsTUFBTUcsT0FBTyxHQUFHcEIs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
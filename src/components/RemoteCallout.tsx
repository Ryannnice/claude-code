// 引入 React、useCallback、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useEffect, useRef } from 'react';
// 引入 isBridgeEnabled，将 ../bridge/bridgeEnabled.js 中已经封装好的能力接到本文件流程里。
import { isBridgeEnabled } from '../bridge/bridgeEnabled.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 getClaudeAIOAuthTokens 工具函数，把通用处理留在 ../utils/auth.js 中维护。
import { getClaudeAIOAuthTokens } from '../utils/auth.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js';
// 类型依赖 { OptionWithDescription } 来自 ./CustomSelect/select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './CustomSelect/select.js';
// 引入 Select，将 ./CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/select.js';
// 引入 PermissionDialog，将 ./permissions/PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from './permissions/PermissionDialog.js';
// RemoteCalloutSelection 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type RemoteCalloutSelection = 'enable' | 'dismiss';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: (selection: RemoteCalloutSelection) => void;，负责终端渲染在该局部场景下的响应。
  onDone: (selection: RemoteCalloutSelection) => void;
};
// RemoteCallout 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function RemoteCallout({
  onDone
}: Props): React.ReactNode {
  // onDoneRef 引用保存`useRef`，供终端渲染后续处理使用。
  const onDoneRef = useRef(onDone);
  // current更新为 `onDone`，确保终端 UI后续读取最新状态。
  onDoneRef.current = onDone;
  // handleCancel保存`useCallback`，供终端渲染后续处理使用。
  const handleCancel = useCallback((): void => {
    // 调用 onDoneRef.current，触发终端渲染此处需要的副作用。
    onDoneRef.current('dismiss');
  }, []);

  // Permanently mark as seen on mount so it only shows once
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
    saveGlobalConfig(current => {
      // 满足 `current.remoteDialogSeen` 时，终端渲染执行该分支。
      if (current.remoteDialogSeen) return current;
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...current,
        remoteDialogSeen: true
      };
    });
  }, []);
  // handleSelect保存`useCallback`，供终端渲染后续处理使用。
  const handleSelect = useCallback((value: RemoteCalloutSelection): void => {
    // 调用 onDoneRef.current，触发终端渲染此处需要的副作用。
    onDoneRef.current(value);
  }, []);
  // 选项 聚合成有序列表，保持后续遍历顺序稳定。
  const options: OptionWithDescription<RemoteCalloutSelection>[] = [{
    label: 'Enable Remote Control for this session',
    description: 'Opens a secure connection to claude.ai.',
    value: 'enable'
  }, {
    label: 'Never mind',
    description: 'You can always enable it later with /remote-control.',
    value: 'dismiss'
  }];
  // 返回 `<PermissionDialog title="Remote Control">`，作为终端渲染这次计算的结果。
  return <PermissionDialog title="Remote Control">
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1} flexDirection="column">
          <Text>
            Remote Control lets you access this CLI session from the web
            (claude.ai/code) or the Claude app, so you can pick up where you
            left off on any device.
          </Text>
          <Text> </Text>
          <Text>
            You can disconnect remote access anytime by running /remote-control
            again.
          </Text>
        </Box>
        <Box>
          <Select options={options} onChange={handleSelect} onCancel={handleCancel} />
        </Box>
      </Box>
    </PermissionDialog>;
}

/**
 * Check whether to show the remote callout (first-time dialog).
 */
// shouldShowRemoteCallout 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowRemoteCallout(): boolean {
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // 满足 `config.remoteDialogSeen` 时，终端渲染执行该分支。
  if (config.remoteDialogSeen) return false;
  // 满足 `!isBridgeEnabled()` 时，终端渲染执行该分支。
  if (!isBridgeEnabled()) return false;
  // token 列表读取`getClaudeAIOAuthTokens`，供终端渲染后续处理使用。
  const tokens = getClaudeAIOAuthTokens();
  // 满足 `!tokens?.accessToken` 时，终端渲染执行该分支。
  if (!tokens?.accessToken) return false;
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlUmVmIiwiaXNCcmlkZ2VFbmFibGVkIiwiQm94IiwiVGV4dCIsImdldENsYXVkZUFJT0F1dGhUb2tlbnMiLCJnZXRHbG9iYWxDb25maWciLCJzYXZlR2xvYmFsQ29uZmlnIiwiT3B0aW9uV2l0aERlc2NyaXB0aW9uIiwiU2VsZWN0IiwiUGVybWlzc2lvbkRpYWxvZyIsIlJlbW90ZUNhbGxvdXRTZWxlY3Rpb24iLCJQcm9wcyIsIm9uRG9uZSIsInNlbGVjdGlvbiIsIlJlbW90ZUNhbGxvdXQiLCJSZWFjdE5vZGUiLCJvbkRvbmVSZWYiLCJjdXJyZW50IiwiaGFuZGxlQ2FuY2VsIiwicmVtb3RlRGlhbG9nU2VlbiIsImhhbmRsZVNlbGVjdCIsInZhbHVlIiwib3B0aW9ucyIsImxhYmVsIiwiZGVzY3JpcHRpb24iLCJzaG91bGRTaG93UmVtb3RlQ2FsbG91dCIsImNvbmZpZyIsInRva2VucyIsImFjY2Vzc1Rva2VuIl0sInNvdXJjZXMiOlsiUmVtb3RlQ2FsbG91dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgaXNCcmlkZ2VFbmFibGVkIH0gZnJvbSAnLi4vYnJpZGdlL2JyaWRnZUVuYWJsZWQuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBnZXRDbGF1ZGVBSU9BdXRoVG9rZW5zIH0gZnJvbSAnLi4vdXRpbHMvYXV0aC5qcydcbmltcG9ydCB7IGdldEdsb2JhbENvbmZpZywgc2F2ZUdsb2JhbENvbmZpZyB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB0eXBlIHsgT3B0aW9uV2l0aERlc2NyaXB0aW9uIH0gZnJvbSAnLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgUGVybWlzc2lvbkRpYWxvZyB9IGZyb20gJy4vcGVybWlzc2lvbnMvUGVybWlzc2lvbkRpYWxvZy5qcydcblxudHlwZSBSZW1vdGVDYWxsb3V0U2VsZWN0aW9uID0gJ2VuYWJsZScgfCAnZGlzbWlzcydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25Eb25lOiAoc2VsZWN0aW9uOiBSZW1vdGVDYWxsb3V0U2VsZWN0aW9uKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBSZW1vdGVDYWxsb3V0KHsgb25Eb25lIH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgb25Eb25lUmVmID0gdXNlUmVmKG9uRG9uZSlcbiAgb25Eb25lUmVmLmN1cnJlbnQgPSBvbkRvbmVcblxuICBjb25zdCBoYW5kbGVDYW5jZWwgPSB1c2VDYWxsYmFjaygoKTogdm9pZCA9PiB7XG4gICAgb25Eb25lUmVmLmN1cnJlbnQoJ2Rpc21pc3MnKVxuICB9LCBbXSlcblxuICAvLyBQZXJtYW5lbnRseSBtYXJrIGFzIHNlZW4gb24gbW91bnQgc28gaXQgb25seSBzaG93cyBvbmNlXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgc2F2ZUdsb2JhbENvbmZpZyhjdXJyZW50ID0+IHtcbiAgICAgIGlmIChjdXJyZW50LnJlbW90ZURpYWxvZ1NlZW4pIHJldHVybiBjdXJyZW50XG4gICAgICByZXR1cm4geyAuLi5jdXJyZW50LCByZW1vdGVEaWFsb2dTZWVuOiB0cnVlIH1cbiAgICB9KVxuICB9LCBbXSlcblxuICBjb25zdCBoYW5kbGVTZWxlY3QgPSB1c2VDYWxsYmFjaygodmFsdWU6IFJlbW90ZUNhbGxvdXRTZWxlY3Rpb24pOiB2b2lkID0+IHtcbiAgICBvbkRvbmVSZWYuY3VycmVudCh2YWx1ZSlcbiAgfSwgW10pXG5cbiAgY29uc3Qgb3B0aW9uczogT3B0aW9uV2l0aERlc2NyaXB0aW9uPFJlbW90ZUNhbGxvdXRTZWxlY3Rpb24+W10gPSBbXG4gICAge1xuICAgICAgbGFiZWw6ICdFbmFibGUgUmVtb3RlIENvbnRyb2wgZm9yIHRoaXMgc2Vzc2lvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ09wZW5zIGEgc2VjdXJlIGNvbm5lY3Rpb24gdG8gY2xhdWRlLmFpLicsXG4gICAgICB2YWx1ZTogJ2VuYWJsZScsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ05ldmVyIG1pbmQnLFxuICAgICAgZGVzY3JpcHRpb246ICdZb3UgY2FuIGFsd2F5cyBlbmFibGUgaXQgbGF0ZXIgd2l0aCAvcmVtb3RlLWNvbnRyb2wuJyxcbiAgICAgIHZhbHVlOiAnZGlzbWlzcycsXG4gICAgfSxcbiAgXVxuXG4gIHJldHVybiAoXG4gICAgPFBlcm1pc3Npb25EaWFsb2cgdGl0bGU9XCJSZW1vdGUgQ29udHJvbFwiPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgcGFkZGluZ1g9ezJ9IHBhZGRpbmdZPXsxfT5cbiAgICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIFJlbW90ZSBDb250cm9sIGxldHMgeW91IGFjY2VzcyB0aGlzIENMSSBzZXNzaW9uIGZyb20gdGhlIHdlYlxuICAgICAgICAgICAgKGNsYXVkZS5haS9jb2RlKSBvciB0aGUgQ2xhdWRlIGFwcCwgc28geW91IGNhbiBwaWNrIHVwIHdoZXJlIHlvdVxuICAgICAgICAgICAgbGVmdCBvZmYgb24gYW55IGRldmljZS5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+IDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIFlvdSBjYW4gZGlzY29ubmVjdCByZW1vdGUgYWNjZXNzIGFueXRpbWUgYnkgcnVubmluZyAvcmVtb3RlLWNvbnRyb2xcbiAgICAgICAgICAgIGFnYWluLlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVTZWxlY3R9XG4gICAgICAgICAgICBvbkNhbmNlbD17aGFuZGxlQ2FuY2VsfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9QZXJtaXNzaW9uRGlhbG9nPlxuICApXG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0byBzaG93IHRoZSByZW1vdGUgY2FsbG91dCAoZmlyc3QtdGltZSBkaWFsb2cpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkU2hvd1JlbW90ZUNhbGxvdXQoKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG4gIGlmIChjb25maWcucmVtb3RlRGlhbG9nU2VlbikgcmV0dXJuIGZhbHNlXG4gIGlmICghaXNCcmlkZ2VFbmFibGVkKCkpIHJldHVybiBmYWxzZVxuICBjb25zdCB0b2tlbnMgPSBnZXRDbGF1ZGVBSU9BdXRoVG9rZW5zKClcbiAgaWYgKCF0b2tlbnM/LmFjY2Vzc1Rva2VuKSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHRydWVcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBT0EsS0FBSyxJQUFJQyxXQUFXLEVBQUVDLFNBQVMsRUFBRUMsTUFBTSxRQUFRLE9BQU87QUFDN0QsU0FBU0MsZUFBZSxRQUFRLDRCQUE0QjtBQUM1RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLHNCQUFzQixRQUFRLGtCQUFrQjtBQUN6RCxTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLG9CQUFvQjtBQUN0RSxjQUFjQyxxQkFBcUIsUUFBUSwwQkFBMEI7QUFDckUsU0FBU0MsTUFBTSxRQUFRLDBCQUEwQjtBQUNqRCxTQUFTQyxnQkFBZ0IsUUFBUSxtQ0FBbUM7QUFFcEUsS0FBS0Msc0JBQXNCLEdBQUcsUUFB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
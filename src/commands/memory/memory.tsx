// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 复用 Dialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { Dialog } from '../../components/design-system/Dialog.js';
// 复用 MemoryFileSelector 终端界面组件，避免在这里重复拼装显示逻辑。
import { MemoryFileSelector } from '../../components/memory/MemoryFileSelector.js';
// 复用 getRelativeMemoryPath 终端界面组件，避免在这里重复拼装显示逻辑。
import { getRelativeMemoryPath } from '../../components/memory/MemoryUpdateNotification.js';
// 引入 Box、Link、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../../ink.js';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// 复用 clearMemoryFileCaches、getMemoryFiles 工具函数，把通用处理留在 ../../utils/claudemd.js 中维护。
import { clearMemoryFileCaches, getMemoryFiles } from '../../utils/claudemd.js';
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js';
// 复用 getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { getErrnoCode } from '../../utils/errors.js';
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js';
// 复用 editFileInEditor 工具函数，把通用处理留在 ../../utils/promptEditor.js 中维护。
import { editFileInEditor } from '../../utils/promptEditor.js';
// MemoryCommand 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function MemoryCommand({
  onDone
}: {
  onDone: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
}): React.ReactNode {
  // handleSelectMemoryFile 文件数据保存`async`，供命令处理后续处理使用。
  const handleSelectMemoryFile = async (memoryPath: string) => {
    // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
    try {
      // Create claude directory if it doesn't exist (idempotent with recursive)
      // 满足 `memoryPath.includes(getClaudeConfigHomeDir())` 时，命令处理执行该分支。
      if (memoryPath.includes(getClaudeConfigHomeDir())) {
        // 等待 `mkdir(getClaudeConfigHomeDir(), {` 完成，再继续斜杠命令 memory的异步流程。
        await mkdir(getClaudeConfigHomeDir(), {
          recursive: true
        });
      }

      // Create file if it doesn't exist (wx flag fails if file exists,
      // which we catch to preserve existing content)
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `writeFile(memoryPath, '', {` 完成，再继续斜杠命令 memory的异步流程。
        await writeFile(memoryPath, '', {
          encoding: 'utf8',
          flag: 'wx'
        });
      } catch (e: unknown) {
        // `getErrnoCode(e)` 与 `'EEXIST'` 不一致时刷新派生状态，避免使用过期结果。
        if (getErrnoCode(e) !== 'EEXIST') {
          // 抛出 e;，阻止命令处理在无效状态下继续运行。
          throw e;
        }
      }
      // 等待 `editFileInEditor(memoryPath)` 完成，再继续斜杠命令 memory的异步流程。
      await editFileInEditor(memoryPath);

      // Determine which environment variable controls the editor
      // editorSource 命名 `'default'`，让后续代码直接表达这个值的用途。
      let editorSource = 'default';
      // editorValue保存`''`，作为后续固定文本处理的输入。
      let editorValue = '';
      // 满足 `process.env.VISUAL` 时，命令处理执行该分支。
      if (process.env.VISUAL) {
        // editorSource更新为 `'$VISUAL'`，确保斜杠命令后续读取最新状态。
        editorSource = '$VISUAL';
        // editorValue更新为 `process.env.VISUAL`，确保斜杠命令后续读取最新状态。
        editorValue = process.env.VISUAL;
      // 斜杠命令 memory在这里处理 `} else if (process.env.EDITOR) {`，完成这一小步状态转换。
      } else if (process.env.EDITOR) {
        // editorSource更新为 `'$EDITOR'`，确保斜杠命令后续读取最新状态。
        editorSource = '$EDITOR';
        // editorValue更新为 `process.env.EDITOR`，确保斜杠命令后续读取最新状态。
        editorValue = process.env.EDITOR;
      }
      // editorInfo标记命令处理斜杠命令 memory是否启用对应路径。
      const editorInfo = editorSource !== 'default' ? `Using ${editorSource}="${editorValue}".` : '';
      // editorHint保存`editorInfo ? `> ${editorInfo} To change editor, set $EDIT...`，供后续判断或组装使用。
      const editorHint = editorInfo ? `> ${editorInfo} To change editor, set $EDITOR or $VISUAL environment variable.` : `> To use a different editor, set the $EDITOR or $VISUAL environment variable.`;
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Opened memory file at ${getRelativeMemoryPath(memoryPath)}\n\n${editorHint}`, {
        display: 'system'
      });
    } catch (error) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logError(error);
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Error opening memory file: ${error}`);
    }
  };
  // handleCancel封装成回调，供命令处理斜杠命令 memory在事件触发或异步步骤中调用。
  const handleCancel = () => {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Cancelled memory editing', {
      display: 'system'
    });
  };
  // 返回 `<Dialog title="Memory" onCancel={handleCancel} color="remember">`，作为命令处理这次计算的结果。
  return <Dialog title="Memory" onCancel={handleCancel} color="remember">
      <Box flexDirection="column">
        <React.Suspense fallback={null}>
          <MemoryFileSelector onSelect={handleSelectMemoryFile} onCancel={handleCancel} />
        </React.Suspense>

        <Box marginTop={1}>
          <Text dimColor>
            Learn more: <Link url="https://code.claude.com/docs/en/memory" />
          </Text>
        </Box>
      </Box>
    </Dialog>;
}
// 这个回调绑定到 export const call: LocalJSXCommandCall = async onDone => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = async onDone => {
  // Clear + prime before rendering — Suspense handles the unprimed case,
  // but awaiting here avoids a fallback flash on initial open.
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearMemoryFileCaches();
  // 等待 `getMemoryFiles()` 完成，再继续斜杠命令 memory的异步流程。
  await getMemoryFiles();
  // 返回 `<MemoryCommand onDone={onDone} />`，作为命令处理这次计算的结果。
  return <MemoryCommand onDone={onDone} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJta2RpciIsIndyaXRlRmlsZSIsIlJlYWN0IiwiQ29tbWFuZFJlc3VsdERpc3BsYXkiLCJEaWFsb2ciLCJNZW1vcnlGaWxlU2VsZWN0b3IiLCJnZXRSZWxhdGl2ZU1lbW9yeVBhdGgiLCJCb3giLCJMaW5rIiwiVGV4dCIsIkxvY2FsSlNYQ29tbWFuZENhbGwiLCJjbGVhck1lbW9yeUZpbGVDYWNoZXMiLCJnZXRNZW1vcnlGaWxlcyIsImdldENsYXVkZUNvbmZpZ0hvbWVEaXIiLCJnZXRFcnJub0NvZGUiLCJsb2dFcnJvciIsImVkaXRGaWxlSW5FZGl0b3IiLCJNZW1vcnlDb21tYW5kIiwib25Eb25lIiwicmVzdWx0Iiwib3B0aW9ucyIsImRpc3BsYXkiLCJSZWFjdE5vZGUiLCJoYW5kbGVTZWxlY3RNZW1vcnlGaWxlIiwibWVtb3J5UGF0aCIsImluY2x1ZGVzIiwicmVjdXJzaXZlIiwiZW5jb2RpbmciLCJmbGFnIiwiZSIsImVkaXRvclNvdXJjZSIsImVkaXRvclZhbHVlIiwicHJvY2VzcyIsImVudiIsIlZJU1VBTCIsIkVESVRPUiIsImVkaXRvckluZm8iLCJlZGl0b3JIaW50IiwiZXJyb3IiLCJoYW5kbGVDYW5jZWwiLCJjYWxsIl0sInNvdXJjZXMiOlsibWVtb3J5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBta2Rpciwgd3JpdGVGaWxlIH0gZnJvbSAnZnMvcHJvbWlzZXMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgQ29tbWFuZFJlc3VsdERpc3BsYXkgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBNZW1vcnlGaWxlU2VsZWN0b3IgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL21lbW9yeS9NZW1vcnlGaWxlU2VsZWN0b3IuanMnXG5pbXBvcnQgeyBnZXRSZWxhdGl2ZU1lbW9yeVBhdGggfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL21lbW9yeS9NZW1vcnlVcGRhdGVOb3RpZmljYXRpb24uanMnXG5pbXBvcnQgeyBCb3gsIExpbmssIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZENhbGwgfSBmcm9tICcuLi8uLi90eXBlcy9jb21tYW5kLmpzJ1xuaW1wb3J0IHsgY2xlYXJNZW1vcnlGaWxlQ2FjaGVzLCBnZXRNZW1vcnlGaWxlcyB9IGZyb20gJy4uLy4uL3V0aWxzL2NsYXVkZW1kLmpzJ1xuaW1wb3J0IHsgZ2V0Q2xhdWRlQ29uZmlnSG9tZURpciB9IGZyb20gJy4uLy4uL3V0aWxzL2VudlV0aWxzLmpzJ1xuaW1wb3J0IHsgZ2V0RXJybm9Db2RlIH0gZnJvbSAnLi4vLi4vdXRpbHMvZXJyb3JzLmpzJ1xuaW1wb3J0IHsgbG9nRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9sb2cuanMnXG5pbXBvcnQgeyBlZGl0RmlsZUluRWRpdG9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvcHJvbXB0RWRpdG9yLmpzJ1xuXG5mdW5jdGlvbiBNZW1vcnlDb21tYW5kKHtcbiAgb25Eb25lLFxufToge1xuICBvbkRvbmU6IChcbiAgICByZXN1bHQ/OiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHsgZGlzcGxheT86IENvbW1hbmRSZXN1bHREaXNwbGF5IH0sXG4gICkgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGhhbmRsZVNlbGVjdE1lbW9yeUZpbGUgPSBhc3luYyAobWVtb3J5UGF0aDogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENyZWF0ZSBjbGF1ZGUgZGlyZWN0b3J5IGlmIGl0IGRvZXNuJ3QgZXhpc3QgKGlkZW1wb3RlbnQgd2l0aCByZWN1cnNpdmUpXG4gICAgICBpZiAobWVtb3J5UGF0aC5pbmNsdWRlcyhnZXRDbGF1ZGVDb25maWdIb21lRGlyKCkpKSB7XG4gICAgICAgIGF3YWl0IG1rZGlyKGdldENsYXVkZUNvbmZpZ0hvbWVEaXIoKSwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGZpbGUgaWYgaXQgZG9lc24ndCBleGlzdCAod3ggZmxhZyBmYWlscyBpZiBmaWxlIGV4aXN0cyxcbiAgICAgIC8vIHdoaWNoIHdlIGNhdGNoIHRvIHByZXNlcnZlIGV4aXN0aW5nIGNvbnRlbnQpXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUobWVtb3J5UGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JywgZmxhZzogJ3d4JyB9KVxuICAgICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgICBpZiAoZ2V0RXJybm9Db2RlKGUpICE9PSAnRUVYSVNUJykge1xuICAgICAgICAgIHRocm93IGVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhd2FpdCBlZGl0RmlsZUluRWRpdG9yKG1lbW9yeVBhdGgpXG5cbiAgICAgIC8vIERldGVybWluZSB3aGljaCBlbnZpcm9ubWVudCB2YXJpYWJsZSBjb250cm9scyB0aGUgZWRpdG9yXG4gICAgICBsZXQgZWRpdG9yU291cmNlID0gJ2RlZmF1bHQnXG4gICAgICBsZXQgZWRpdG9yVmFsdWUgPSAnJ1xuICAgICAgaWYgKHByb2Nlc3MuZW52LlZJU1VBTCkge1xuICAgICAgICBlZGl0b3JTb3VyY2UgPSAnJFZJU1VBTCdcbiAgICAgICAgZWRpdG9yVmFsdWUgPSBwcm9jZXNzLmVudi5WSVNVQUxcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuRURJVE9SKSB7XG4gICAgICAgIGVkaXRvclNvdXJjZSA9ICckRURJVE9SJ1xuICAgICAgICBlZGl0b3JWYWx1ZSA9IHByb2Nlc3MuZW52LkVESVRPUlxuICAgICAgfVxuXG4gICAgICBjb25zdCBlZGl0b3JJbmZvID1cbiAgICAgICAgZWRpdG9yU291cmNlICE9PSAnZGVmYXVsdCdcbiAgICAgICAgICA/IGBVc2luZyAke2VkaXRvclNvdXJjZX09XCIke2VkaXRvclZhbHVlfVwiLmBcbiAgICAgICAgICA6ICcnXG5cbiAgICAgIGNvbnN0IGVkaXRvckhpbnQgPSBlZGl0b3JJbmZvXG4gICAgICAgID8gYD4gJHtlZGl0b3JJbmZvfSBUbyBjaGFuZ2UgZWRpdG9yLCBzZXQgJEVESVRPUiBvciAkVklTVUFMIGVudmlyb25tZW50IHZhcmlhYmxlLmBcbiAgICAgICAgOiBgPiBUbyB1c2UgYSBkaWZmZXJlbnQgZWRpdG9yLCBzZXQgdGhlICRFRElUT1Igb3IgJFZJU1VBTCBlbnZpcm9ubWVudCB2YXJpYWJsZS5gXG5cbiAgICAgIG9uRG9uZShcbiAgICAgICAgYE9wZW5lZCBtZW1vcnkgZmlsZSBhdCAke2dldFJlbGF0aXZlTWVtb3J5UGF0aChtZW1vcnlQYXRoKX1cXG5cXG4ke2VkaXRvckhpbnR9YCxcbiAgICAgICAgeyBkaXNwbGF5OiAnc3lzdGVtJyB9LFxuICAgICAgKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2dFcnJvcihlcnJvcilcbiAgICAgIG9uRG9uZShgRXJyb3Igb3BlbmluZyBtZW1vcnkgZmlsZTogJHtlcnJvcn1gKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGhhbmRsZUNhbmNlbCA9ICgpID0+IHtcbiAgICBvbkRvbmUoJ0NhbmNlbGxlZCBtZW1vcnkgZWRpdGluZycsIHsgZGlzcGxheTogJ3N5c3RlbScgfSlcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZyB0aXRsZT1cIk1lbW9yeVwiIG9uQ2FuY2VsPXtoYW5kbGVDYW5jZWx9IGNvbG9yPVwicmVtZW1iZXJcIj5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8UmVhY3QuU3VzcGVuc2UgZmFsbGJhY2s9e251bGx9PlxuICAgICAgICAgIDxNZW1vcnlGaWxlU2VsZWN0b3JcbiAgICAgICAgICAgIG9uU2VsZWN0PXtoYW5kbGVTZWxlY3RNZW1vcnlGaWxlfVxuICAgICAgICAgICAgb25DYW5jZWw9e2hhbmRsZUNhbmNlbH1cbiAgICAgICAgICAvPlxuICAgICAgICA8L1JlYWN0LlN1c3BlbnNlPlxuXG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIExlYXJuIG1vcmU6IDxMaW5rIHVybD1cImh0dHBzOi8vY29kZS5jbGF1ZGUuY29tL2RvY3MvZW4vbWVtb3J5XCIgLz5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cblxuZXhwb3J0IGNvbnN0IGNhbGw6IExvY2FsSlNYQ29tbWFuZENhbGwgPSBhc3luYyBvbkRvbmUgPT4ge1xuICAvLyBDbGVhciArIHByaW1lIGJlZm9yZSByZW5kZXJpbmcg4oCUIFN1c3BlbnNlIGhhbmRsZXMgdGhlIHVucHJpbWVkIGNhc2UsXG4gIC8vIGJ1dCBhd2FpdGluZyBoZXJlIGF2b2lkcyBhIGZhbGxiYWNrIGZsYXNoIG9uIGluaXRpYWwgb3Blbi5cbiAgY2xlYXJNZW1vcnlGaWxlQ2FjaGVzKClcbiAgYXdhaXQgZ2V0TWVtb3J5RmlsZXMoKVxuICByZXR1cm4gPE1lbW9yeUNvbW1hbmQgb25Eb25lPXtvbkRvbmV9IC8+XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLEtBQUssRUFBRUMsU0FBUyxRQUFRLGFBQWE7QUFDOUMsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixjQUFjQyxvQkFBb0IsUUFBUSxtQkFBbUI7QUFDN0QsU0FBU0MsTUFBTSxRQUFRLDBDQUEwQztBQUNqRSxTQUFTQyxrQkFBa0IsUUFBUSwrQ0FBK0M7QUFDbEYsU0FBU0MscUJBQXFCLFFBQVEscURBQXFEO0FBQzNGLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUM5QyxjQUFjQyxtQkFBbUIsUUFBUSx3QkFBd0I7QUFDakUsU0FBU0MscUJBQXFCLEVBQUVDLGNBQWMsUUFBUSx5QkFBeUI7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
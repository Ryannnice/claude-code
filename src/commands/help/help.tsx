// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 HelpV2 终端界面组件，避免在这里重复拼装显示逻辑。
import { HelpV2 } from '../../components/HelpV2/HelpV2.js';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// call封装成回调，供斜杠命令 help在事件触发或异步步骤中调用。
export const call: LocalJSXCommandCall = async (onDone, {
  options: {
    commands
  }
}) => {
  // 返回 `<HelpV2 commands={commands} onClose={onDone} />`，作为命令处理这次计算的结果。
  return <HelpV2 commands={commands} onClose={onDone} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkhlbHBWMiIsIkxvY2FsSlNYQ29tbWFuZENhbGwiLCJjYWxsIiwib25Eb25lIiwib3B0aW9ucyIsImNvbW1hbmRzIl0sInNvdXJjZXMiOlsiaGVscC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBIZWxwVjIgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0hlbHBWMi9IZWxwVjIuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZENhbGwgfSBmcm9tICcuLi8uLi90eXBlcy9jb21tYW5kLmpzJ1xuXG5leHBvcnQgY29uc3QgY2FsbDogTG9jYWxKU1hDb21tYW5kQ2FsbCA9IGFzeW5jIChcbiAgb25Eb25lLFxuICB7IG9wdGlvbnM6IHsgY29tbWFuZHMgfSB9LFxuKSA9PiB7XG4gIHJldHVybiA8SGVscFYyIGNvbW1hbmRzPXtjb21tYW5kc30gb25DbG9zZT17b25Eb25lfSAvPlxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLE1BQU0sUUFBUSxtQ0FBbUM7QUFDMUQsY0FBY0MsbUJBQW1CLFFBQVEsd0JBQXdCO0FBRWpFLE9BQU8sTUFBTUMsSUFBSSxFQUFFRCxtQkFBbUIsR0FBRyxNQUFBQyxDQUN2Q0MsTUFBTSxFQUNOO0VBQUVDLE9BQU8sRUFBRTtJQUFFQztFQUFTO0FBQUUsQ0FBQyxLQUN0QjtFQUNILE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUNBLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDRixNQUFNLENBQUMsR0FBRztBQUN4RCxDQUFDIiwiaWdub3JlTGlzdCI6W119
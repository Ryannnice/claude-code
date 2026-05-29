// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 Doctor 终端界面组件，避免在这里重复拼装显示逻辑。
import { Doctor } from '../../screens/Doctor.js';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// 这个回调绑定到 export const call: LocalJSXCommandCall = (onDone, _context, _args) => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = (onDone, _context, _args) => {
  // 返回 `Promise.resolve(<Doctor onDone={onDone} />)`，作为命令处理这次计算的结果。
  return Promise.resolve(<Doctor onDone={onDone} />);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkRvY3RvciIsIkxvY2FsSlNYQ29tbWFuZENhbGwiLCJjYWxsIiwib25Eb25lIiwiX2NvbnRleHQiLCJfYXJncyIsIlByb21pc2UiLCJyZXNvbHZlIl0sInNvdXJjZXMiOlsiZG9jdG9yLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBEb2N0b3IgfSBmcm9tICcuLi8uLi9zY3JlZW5zL0RvY3Rvci5qcydcbmltcG9ydCB0eXBlIHsgTG9jYWxKU1hDb21tYW5kQ2FsbCB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5cbmV4cG9ydCBjb25zdCBjYWxsOiBMb2NhbEpTWENvbW1hbmRDYWxsID0gKG9uRG9uZSwgX2NvbnRleHQsIF9hcmdzKSA9PiB7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoPERvY3RvciBvbkRvbmU9e29uRG9uZX0gLz4pXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLE1BQU0sUUFBUSx5QkFBeUI7QUFDaEQsY0FBY0MsbUJBQW1CLFFBQVEsd0JBQXdCO0FBRWpFLE9BQU8sTUFBTUMsSUFBSSxFQUFFRCxtQkFBbUIsR0FBR0MsQ0FBQ0MsTUFBTSxFQUFFQyxRQUFRLEVBQUVDLEtBQUssS0FBSztFQUNwRSxPQUFPQyxPQUFPLENBQUNDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQ0osTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNwRCxDQUFDIiwiaWdub3JlTGlzdCI6W119
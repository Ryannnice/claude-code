// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// 这个回调绑定到 export const call: LocalJSXCommandCall = async (onDone, context) => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = async (onDone, context) => {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    DiffDialog
  } = await import('../../components/diff/DiffDialog.js');
  // 返回 `<DiffDialog messages={context.messages} onDone={onDone} />`，作为命令处理这次计算的结果。
  return <DiffDialog messages={context.messages} onDone={onDone} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkxvY2FsSlNYQ29tbWFuZENhbGwiLCJjYWxsIiwib25Eb25lIiwiY29udGV4dCIsIkRpZmZEaWFsb2ciLCJtZXNzYWdlcyJdLCJzb3VyY2VzIjpbImRpZmYudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRDYWxsIH0gZnJvbSAnLi4vLi4vdHlwZXMvY29tbWFuZC5qcydcblxuZXhwb3J0IGNvbnN0IGNhbGw6IExvY2FsSlNYQ29tbWFuZENhbGwgPSBhc3luYyAob25Eb25lLCBjb250ZXh0KSA9PiB7XG4gIGNvbnN0IHsgRGlmZkRpYWxvZyB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9jb21wb25lbnRzL2RpZmYvRGlmZkRpYWxvZy5qcycpXG4gIHJldHVybiA8RGlmZkRpYWxvZyBtZXNzYWdlcz17Y29udGV4dC5tZXNzYWdlc30gb25Eb25lPXtvbkRvbmV9IC8+XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsY0FBY0MsbUJBQW1CLFFBQVEsd0JBQXdCO0FBRWpFLE9BQU8sTUFBTUMsSUFBSSxFQUFFRCxtQkFBbUIsR0FBRyxNQUFBQyxDQUFPQyxNQUFNLEVBQUVDLE9BQU8sS0FBSztFQUNsRSxNQUFNO0lBQUVDO0VBQVcsQ0FBQyxHQUFHLE1BQU0sTUFBTSxDQUFDLHFDQUFxQyxDQUFDO0VBQzFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUNELE9BQU8sQ0FBQ0UsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUNILE1BQU0sQ0FBQyxHQUFHO0FBQ25FLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=
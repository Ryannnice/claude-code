// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 Stats 终端界面组件，避免在这里重复拼装显示逻辑。
import { Stats } from '../../components/Stats.js';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// 这个回调绑定到 export const call: LocalJSXCommandCall = async onDone => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = async onDone => {
  // 返回 `<Stats onClose={onDone} />`，作为命令处理这次计算的结果。
  return <Stats onClose={onDone} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlN0YXRzIiwiTG9jYWxKU1hDb21tYW5kQ2FsbCIsImNhbGwiLCJvbkRvbmUiXSwic291cmNlcyI6WyJzdGF0cy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBTdGF0cyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvU3RhdHMuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZENhbGwgfSBmcm9tICcuLi8uLi90eXBlcy9jb21tYW5kLmpzJ1xuXG5leHBvcnQgY29uc3QgY2FsbDogTG9jYWxKU1hDb21tYW5kQ2FsbCA9IGFzeW5jIG9uRG9uZSA9PiB7XG4gIHJldHVybiA8U3RhdHMgb25DbG9zZT17b25Eb25lfSAvPlxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEtBQUssUUFBUSwyQkFBMkI7QUFDakQsY0FBY0MsbUJBQW1CLFFBQVEsd0JBQXdCO0FBRWpFLE9BQU8sTUFBTUMsSUFBSSxFQUFFRCxtQkFBbUIsR0FBRyxNQUFNRSxNQUFNLElBQUk7RUFDdkQsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQ0EsTUFBTSxDQUFDLEdBQUc7QUFDbkMsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==
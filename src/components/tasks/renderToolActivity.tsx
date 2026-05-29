// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 类型依赖 { Tools } 来自 ../../Tool.js，用于校准终端渲染的数据契约。
import type { Tools } from '../../Tool.js';
// 引入 findToolByName，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName } from '../../Tool.js';
// 类型依赖 { ToolActivity } 来自 ../../tasks/LocalAgentTask/LocalAgentTask.js，用于校准终端渲染的数据契约。
import type { ToolActivity } from '../../tasks/LocalAgentTask/LocalAgentTask.js';
// 类型依赖 { ThemeName } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { ThemeName } from '../../utils/theme.js';
// renderToolActivity 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolActivity(activity: ToolActivity, tools: Tools, theme: ThemeName): React.ReactNode {
  // 工具筛选`findToolByName`，供终端渲染后续处理使用。
  const tool = findToolByName(tools, activity.toolName);
  // 工具缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!tool) {
    // 返回 `activity.toolName`，作为终端渲染这次计算的结果。
    return activity.toolName;
  }
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`inputSchema.safeParse`，供终端渲染后续处理使用。
    const parsed = tool.inputSchema.safeParse(activity.input);
    // parsedInput 命名 `parsed.success ? parsed.data : {}`，让后续代码直接表达这个值的用途。
    const parsedInput = parsed.success ? parsed.data : {};
    // userFacingName保存`tool.userFacingName`，供终端渲染后续处理使用。
    const userFacingName = tool.userFacingName(parsedInput);
    // userFacingName缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!userFacingName) {
      // 返回 `activity.toolName`，作为终端渲染这次计算的结果。
      return activity.toolName;
    }
    // toolArgs 集合保存`tool.renderToolUseMessage`，供终端渲染后续处理使用。
    const toolArgs = tool.renderToolUseMessage(parsedInput, {
      theme,
      verbose: false
    });
    // 满足 `toolArgs` 时，终端渲染执行该分支。
    if (toolArgs) {
      // 返回 `<Text>`，作为终端渲染这次计算的结果。
      return <Text>
          {userFacingName}({toolArgs})
        </Text>;
    }
    // 返回 `userFacingName`，作为终端渲染这次计算的结果。
    return userFacingName;
  } catch {
    // 返回 `activity.toolName`，作为终端渲染这次计算的结果。
    return activity.toolName;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJUb29scyIsImZpbmRUb29sQnlOYW1lIiwiVG9vbEFjdGl2aXR5IiwiVGhlbWVOYW1lIiwicmVuZGVyVG9vbEFjdGl2aXR5IiwiYWN0aXZpdHkiLCJ0b29scyIsInRoZW1lIiwiUmVhY3ROb2RlIiwidG9vbCIsInRvb2xOYW1lIiwicGFyc2VkIiwiaW5wdXRTY2hlbWEiLCJzYWZlUGFyc2UiLCJpbnB1dCIsInBhcnNlZElucHV0Iiwic3VjY2VzcyIsImRhdGEiLCJ1c2VyRmFjaW5nTmFtZSIsInRvb2xBcmdzIiwicmVuZGVyVG9vbFVzZU1lc3NhZ2UiLCJ2ZXJib3NlIl0sInNvdXJjZXMiOlsicmVuZGVyVG9vbEFjdGl2aXR5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBUb29scyB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgeyBmaW5kVG9vbEJ5TmFtZSB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgdHlwZSB7IFRvb2xBY3Rpdml0eSB9IGZyb20gJy4uLy4uL3Rhc2tzL0xvY2FsQWdlbnRUYXNrL0xvY2FsQWdlbnRUYXNrLmpzJ1xuaW1wb3J0IHR5cGUgeyBUaGVtZU5hbWUgfSBmcm9tICcuLi8uLi91dGlscy90aGVtZS5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xBY3Rpdml0eShcbiAgYWN0aXZpdHk6IFRvb2xBY3Rpdml0eSxcbiAgdG9vbHM6IFRvb2xzLFxuICB0aGVtZTogVGhlbWVOYW1lLFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgdG9vbCA9IGZpbmRUb29sQnlOYW1lKHRvb2xzLCBhY3Rpdml0eS50b29sTmFtZSlcbiAgaWYgKCF0b29sKSB7XG4gICAgcmV0dXJuIGFjdGl2aXR5LnRvb2xOYW1lXG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWQgPSB0b29sLmlucHV0U2NoZW1hLnNhZmVQYXJzZShhY3Rpdml0eS5pbnB1dClcbiAgICBjb25zdCBwYXJzZWRJbnB1dCA9IHBhcnNlZC5zdWNjZXNzID8gcGFyc2VkLmRhdGEgOiB7fVxuICAgIGNvbnN0IHVzZXJGYWNpbmdOYW1lID0gdG9vbC51c2VyRmFjaW5nTmFtZShwYXJzZWRJbnB1dClcbiAgICBpZiAoIXVzZXJGYWNpbmdOYW1lKSB7XG4gICAgICByZXR1cm4gYWN0aXZpdHkudG9vbE5hbWVcbiAgICB9XG4gICAgY29uc3QgdG9vbEFyZ3MgPSB0b29sLnJlbmRlclRvb2xVc2VNZXNzYWdlKHBhcnNlZElucHV0LCB7XG4gICAgICB0aGVtZSxcbiAgICAgIHZlcmJvc2U6IGZhbHNlLFxuICAgIH0pXG4gICAgaWYgKHRvb2xBcmdzKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7dXNlckZhY2luZ05hbWV9KHt0b29sQXJnc30pXG4gICAgICAgIDwvVGV4dD5cbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIHVzZXJGYWNpbmdOYW1lXG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBhY3Rpdml0eS50b29sTmFtZVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLElBQUksUUFBUSxjQUFjO0FBQ25DLGNBQWNDLEtBQUssUUFBUSxlQUFlO0FBQzFDLFNBQVNDLGNBQWMsUUFBUSxlQUFlO0FBQzlDLGNBQWNDLFlBQVksUUFBUSw4Q0FBOEM7QUFDaEYsY0FBY0MsU0FBUyxRQUFRLHNCQUFzQjtBQUVyRCxPQUFPLFNBQVNDLGtCQUFrQkEsQ0FDaENDLFFBQVEsRUFBRUgsWUFBWSxFQUN0QkksS0FBSyxFQUFFTixLQUFLLEVBQ1pPLEtBQUssRUFBRUosU0FBUyxDQUNqQixFQUFFTCxLQUFLLENBQUNVLFNBQVMsQ0FBQztFQUNqQixNQUFNQyxJQUFJLEdBQUdSLGNBQWMsQ0FBQ0ssS0FBSyxFQUFFRCxRQUFRLENBQUNLLFFBQVEsQ0FBQztFQUNyRCxJQUFJLENBQUNELElBQUksRUFBRTtJQUNULE9BQU9KLFFBQVEsQ0FBQ0ssUUFBUTtFQUMxQjtFQUNBLElBQUk7SUFDRixNQUFNQyxNQUFNLEdBQUdGLElBQUksQ0FBQ0csV0FBVyxDQUFDQyxTQUFTLENBQUNSLFFBQVEsQ0FBQ1MsS0FBSyxDQUFDO0lBQ3pELE1BQU1DLFdBQVcsR0FBR0osTUFBTSxDQUFDSyxPQUFPLEdBQUdMLE1BQU0sQ0FBQ00sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNyRCxNQUFNQyxjQUFjLEdBQUdULElBQUksQ0FBQ1MsY0FBYyxDQUFDSCxXQUFXLENBQUM7SUFDdkQsSUFBSSxDQUFDRyxjQUFjLEVBQUU7TUFDbkIsT0FBT2IsUUFBUSxDQUFDSyxRQUFRO0lBQzFCO0lBQ0EsTUFBTVMsUUFBUSxHQUFHVixJQUFJLENBQUNXLG9CQUFvQixDQUFDTCxXQUFXLEVBQUU7TUFDdERSLEtBQUs7TUFDTGMsT0FBTyxFQUFFO0lBQ1gsQ0FBQyxDQUFDO0lBQ0YsSUFBSUYsUUFBUSxFQUFFO01BQ1osT0FDRSxDQUFDLElBQUk7QUFDYixVQUFVLENBQUNELGNBQWMsQ0FBQyxDQUFDLENBQUNDLFFBQVEsQ0FBQztBQUNyQyxRQUFRLEVBQUUsSUFBSSxDQUFDO0lBRVg7SUFDQSxPQUFPRCxjQUFjO0VBQ3ZCLENBQUMsQ0FBQyxNQUFNO0lBQ04sT0FBT2IsUUFBUSxDQUFDSyxRQUFRO0VBQzFCO0FBQ0YiLCJpZ25vcmVMaXN0IjpbXX0=
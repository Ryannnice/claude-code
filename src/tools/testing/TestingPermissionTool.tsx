/**
 * This testing-only tool will always pop up a permission dialog when called by
 * the model.
 */
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4';
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js';
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js';
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js';
// NAME保存`'TestingPermission'`，作为后续固定文本处理的输入。
const NAME = 'TestingPermission';
// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => z.strictObject({}));
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>;
// TestingPermissionTool 权限数据构建`buildTool({`，供后续判断或组装使用。
export const TestingPermissionTool: Tool<InputSchema, string> = buildTool({
  name: NAME,
  maxResultSizeChars: 100_000,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `'Test tool that always asks for permission'`，作为工具调用这次计算的结果。
    return 'Test tool that always asks for permission';
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `'Test tool that always asks for permission before executing. Used for e...`，作为工具调用这次计算的结果。
    return 'Test tool that always asks for permission before executing. Used for end-to-end testing.';
  },
  // 工具实现 Testing Permission Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema();
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'TestingPermission'`，作为工具调用这次计算的结果。
    return 'TestingPermission';
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `"production" === 'test'`，作为工具调用这次计算的结果。
    return "production" === 'test';
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  },
  // checkPermissions 使用 无 完成工具调用里的对应操作。
  async checkPermissions() {
    // This tool always requires permission
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask' as const,
      message: `Run test?`
    };
  },
  // renderToolUseMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  // renderToolUseProgressMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseProgressMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  // renderToolUseQueuedMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseQueuedMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  // renderToolUseRejectedMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseRejectedMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  // renderToolResultMessage 使用 无 完成工具调用里的对应操作。
  renderToolResultMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  // renderToolUseErrorMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseErrorMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  // call 使用 无 完成工具调用里的对应操作。
  async call() {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: `${NAME} executed successfully`
    };
  },
  // mapToolResultToToolResultBlockParam 使用 result, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(result, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'tool_result',
      content: String(result),
      tool_use_id: toolUseID
    };
  }
} satisfies ToolDef<InputSchema, string>);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ6IiwiVG9vbCIsImJ1aWxkVG9vbCIsIlRvb2xEZWYiLCJsYXp5U2NoZW1hIiwiTkFNRSIsImlucHV0U2NoZW1hIiwic3RyaWN0T2JqZWN0IiwiSW5wdXRTY2hlbWEiLCJSZXR1cm5UeXBlIiwiVGVzdGluZ1Blcm1pc3Npb25Ub29sIiwibmFtZSIsIm1heFJlc3VsdFNpemVDaGFycyIsImRlc2NyaXB0aW9uIiwicHJvbXB0IiwidXNlckZhY2luZ05hbWUiLCJpc0VuYWJsZWQiLCJpc0NvbmN1cnJlbmN5U2FmZSIsImlzUmVhZE9ubHkiLCJjaGVja1Blcm1pc3Npb25zIiwiYmVoYXZpb3IiLCJjb25zdCIsIm1lc3NhZ2UiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsInJlbmRlclRvb2xVc2VQcm9ncmVzc01lc3NhZ2UiLCJyZW5kZXJUb29sVXNlUXVldWVkTWVzc2FnZSIsInJlbmRlclRvb2xVc2VSZWplY3RlZE1lc3NhZ2UiLCJyZW5kZXJUb29sUmVzdWx0TWVzc2FnZSIsInJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UiLCJjYWxsIiwiZGF0YSIsIm1hcFRvb2xSZXN1bHRUb1Rvb2xSZXN1bHRCbG9ja1BhcmFtIiwicmVzdWx0IiwidG9vbFVzZUlEIiwidHlwZSIsImNvbnRlbnQiLCJTdHJpbmciLCJ0b29sX3VzZV9pZCJdLCJzb3VyY2VzIjpbIlRlc3RpbmdQZXJtaXNzaW9uVG9vbC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGlzIHRlc3Rpbmctb25seSB0b29sIHdpbGwgYWx3YXlzIHBvcCB1cCBhIHBlcm1pc3Npb24gZGlhbG9nIHdoZW4gY2FsbGVkIGJ5XG4gKiB0aGUgbW9kZWwuXG4gKi9cbmltcG9ydCB7IHogfSBmcm9tICd6b2QvdjQnXG5pbXBvcnQgdHlwZSB7IFRvb2wgfSBmcm9tICcuLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHsgYnVpbGRUb29sLCB0eXBlIFRvb2xEZWYgfSBmcm9tICcuLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHsgbGF6eVNjaGVtYSB9IGZyb20gJy4uLy4uL3V0aWxzL2xhenlTY2hlbWEuanMnXG5cbmNvbnN0IE5BTUUgPSAnVGVzdGluZ1Blcm1pc3Npb24nXG5cbmNvbnN0IGlucHV0U2NoZW1hID0gbGF6eVNjaGVtYSgoKSA9PiB6LnN0cmljdE9iamVjdCh7fSkpXG50eXBlIElucHV0U2NoZW1hID0gUmV0dXJuVHlwZTx0eXBlb2YgaW5wdXRTY2hlbWE+XG5cbmV4cG9ydCBjb25zdCBUZXN0aW5nUGVybWlzc2lvblRvb2w6IFRvb2w8SW5wdXRTY2hlbWEsIHN0cmluZz4gPSBidWlsZFRvb2woe1xuICBuYW1lOiBOQU1FLFxuICBtYXhSZXN1bHRTaXplQ2hhcnM6IDEwMF8wMDAsXG4gIGFzeW5jIGRlc2NyaXB0aW9uKCkge1xuICAgIHJldHVybiAnVGVzdCB0b29sIHRoYXQgYWx3YXlzIGFza3MgZm9yIHBlcm1pc3Npb24nXG4gIH0sXG4gIGFzeW5jIHByb21wdCgpIHtcbiAgICByZXR1cm4gJ1Rlc3QgdG9vbCB0aGF0IGFsd2F5cyBhc2tzIGZvciBwZXJtaXNzaW9uIGJlZm9yZSBleGVjdXRpbmcuIFVzZWQgZm9yIGVuZC10by1lbmQgdGVzdGluZy4nXG4gIH0sXG4gIGdldCBpbnB1dFNjaGVtYSgpOiBJbnB1dFNjaGVtYSB7XG4gICAgcmV0dXJuIGlucHV0U2NoZW1hKClcbiAgfSxcbiAgdXNlckZhY2luZ05hbWUoKSB7XG4gICAgcmV0dXJuICdUZXN0aW5nUGVybWlzc2lvbidcbiAgfSxcbiAgaXNFbmFibGVkKCkge1xuICAgIHJldHVybiBcInByb2R1Y3Rpb25cIiA9PT0gJ3Rlc3QnXG4gIH0sXG4gIGlzQ29uY3VycmVuY3lTYWZlKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH0sXG4gIGlzUmVhZE9ubHkoKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfSxcbiAgYXN5bmMgY2hlY2tQZXJtaXNzaW9ucygpIHtcbiAgICAvLyBUaGlzIHRvb2wgYWx3YXlzIHJlcXVpcmVzIHBlcm1pc3Npb25cbiAgICByZXR1cm4ge1xuICAgICAgYmVoYXZpb3I6ICdhc2snIGFzIGNvbnN0LFxuICAgICAgbWVzc2FnZTogYFJ1biB0ZXN0P2AsXG4gICAgfVxuICB9LFxuICByZW5kZXJUb29sVXNlTWVzc2FnZSgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9LFxuICByZW5kZXJUb29sVXNlUHJvZ3Jlc3NNZXNzYWdlKCkge1xuICAgIHJldHVybiBudWxsXG4gIH0sXG4gIHJlbmRlclRvb2xVc2VRdWV1ZWRNZXNzYWdlKCkge1xuICAgIHJldHVybiBudWxsXG4gIH0sXG4gIHJlbmRlclRvb2xVc2VSZWplY3RlZE1lc3NhZ2UoKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfSxcbiAgcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UoKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfSxcbiAgcmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZSgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9LFxuICBhc3luYyBjYWxsKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkYXRhOiBgJHtOQU1FfSBleGVjdXRlZCBzdWNjZXNzZnVsbHlgLFxuICAgIH1cbiAgfSxcbiAgbWFwVG9vbFJlc3VsdFRvVG9vbFJlc3VsdEJsb2NrUGFyYW0ocmVzdWx0LCB0b29sVXNlSUQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ3Rvb2xfcmVzdWx0JyxcbiAgICAgIGNvbnRlbnQ6IFN0cmluZyhyZXN1bHQpLFxuICAgICAgdG9vbF91c2VfaWQ6IHRvb2xVc2VJRCxcbiAgICB9XG4gIH0sXG59IHNhdGlzZmllcyBUb29sRGVmPElucHV0U2NoZW1hLCBzdHJpbmc+KVxuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNBLENBQUMsUUFBUSxRQUFRO0FBQzFCLGNBQWNDLElBQUksUUFBUSxlQUFlO0FBQ3pDLFNBQVNDLFNBQVMsRUFBRSxLQUFLQyxPQUFPLFFBQVEsZUFBZTtBQUN2RCxTQUFTQyxVQUFVLFFBQVEsMkJBQTJCO0FBRXRELE1BQU1DLElBQUksR0FBRyxtQkFBbUI7QUFFaEMsTUFBTUMsV0FBVyxHQUFHRixVQUFVLENBQUMsTUFBTUosQ0FBQyxDQUFDTyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4RCxLQUFLQyxXQUFXLEdBQUdDLFVBQVUsQ0FBQyxPQUFPSCxXQUFXLENBQUM7QUFFakQsT0FBTyxNQUFNSSxxQkFBcUIsRUFBRVQsSUFBSSxDQUFDTyxXQUFXLEVBQUUsTUFBTSxDQUFDLEdBQUdOLFNBQVMsQ0FBQztFQUN4RVMsSUFBSSxFQUFFTixJQUFJO0VBQ1ZPLGtCQUFrQixFQUFFLE9BQU87RUFDM0IsTUFBTUMsV0FBV0EsQ0FBQSxFQUFHO0lBQ2xCLE9BQU8sMkNBQTJDO0VBQ3BELENBQUM7RUFDRCxNQUFNQyxNQUFNQSxDQUFBLEVBQUc7SUFDYixPQUFPLDBGQUEwRjtFQUNuRyxDQUFDO0VBQ0QsSUFBSVIsV0FBV0EsQ0FBQSxDQUFFLEVBQUVFLFdBQVcsQ0FBQztJQUM3QixPQUFPRixXQUFXLENBQUMsQ0FBQztFQUN0QixDQUFDO0VBQ0RTLGNBQWNBLENBQUEsRUFBRztJQUNmLE9BQU8sbUJBQW1CO0VBQzVCLENBQUM7RUFDREMsU0FBU0EsQ0FBQSxFQUFHO0lBQ1YsT0FBTyxZQUFZLEtBQUssTUFBTTtFQUNoQyxDQUFDO0VBQ0RDLGlCQUFpQkEsQ0FBQSxFQUFHO0lBQ2xCLE9BQU8sSUFBSTtFQUNiLENBQUM7RUFDREMsVUFBVUEsQ0FBQSxFQUFHO0lBQ1gsT0FBTyxJQUFJO0VBQ2IsQ0FBQztFQUNELE1BQU1DLGdCQUFnQkEsQ0FBQSxFQUFHO0lBQ3ZCO0lBQ0EsT0FBTztNQUNMQyxRQUFRLEVBQUUsS0FBSyxJQUFJQyxLQUFLO01BQ3hCQyxPQUFPLEVBQUU7SUFDWCxDQUFDO0VBQ0gsQ0FBQztFQUNEQyxvQkFBb0JBLENBQUEsRUFBRztJQUNyQixPQUFPLElBQUk7RUFDYixDQUFDO0VBQ0RDLDRCQUE0QkEsQ0FBQSxFQUFHO0lBQzdCLE9BQU8sSUFBSTtFQUNiLENBQUM7RUFDREMsMEJBQTBCQSxDQUFBLEVBQUc7SUFDM0IsT0FBTyxJQUFJO0VBQ2IsQ0FBQztFQUNEQyw0QkFBNEJBLENBQUEsRUFBRztJQUM3QixPQUFPLElBQUk7RUFDYixDQUFDO0VBQ0RDLHVCQUF1QkEsQ0FBQSxFQUFHO0lBQ3hCLE9BQU8sSUFBSTtFQUNiLENBQUM7RUFDREMseUJBQXlCQSxDQUFBLEVBQUc7SUFDMUIsT0FBTyxJQUFJO0VBQ2IsQ0FBQztFQUNELE1BQU1DLElBQUlBLENBQUEsRUFBRztJQUNYLE9BQU87TUFDTEMsSUFBSSxFQUFFLEdBQUd6QixJQUFJO0lBQ2YsQ0FBQztFQUNILENBQUM7RUFDRDBCLG1DQUFtQ0EsQ0FBQ0MsTUFBTSxFQUFFQyxTQUFTLEVBQUU7SUFDckQsT0FBTztNQUNMQyxJQUFJLEVBQUUsYUFBYTtNQUNuQkMsT0FBTyxFQUFFQyxNQUFNLENBQUNKLE1BQU0sQ0FBQztNQUN2QkssV0FBVyxFQUFFSjtJQUNmLENBQUM7RUFDSDtBQUNGLENBQUMsV0FBVzlCLE9BQU8sQ0FBQ0ssV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDIiwiaWdub3JlTGlzdCI6W119
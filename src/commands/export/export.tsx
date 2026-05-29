// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 ExportDialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { ExportDialog } from '../../components/ExportDialog.js';
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准命令处理的数据契约。
import type { Message } from '../../types/message.js';
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js';
// 复用 renderMessagesToPlainText 工具函数，把通用处理留在 ../../utils/exportRenderer.js 中维护。
import { renderMessagesToPlainText } from '../../utils/exportRenderer.js';
// 复用 writeFileSync_DEPRECATED 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { writeFileSync_DEPRECATED } from '../../utils/slowOperations.js';
// formatTimestamp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatTimestamp(date: Date): string {
  // year读取`date.getFullYear`，供命令处理后续处理使用。
  const year = date.getFullYear();
  // month保存`String`，供命令处理后续处理使用。
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // day保存`String`，供命令处理后续处理使用。
  const day = String(date.getDate()).padStart(2, '0');
  // hours 集合保存`String`，供命令处理后续处理使用。
  const hours = String(date.getHours()).padStart(2, '0');
  // minutes 集合保存`String`，供命令处理后续处理使用。
  const minutes = String(date.getMinutes()).padStart(2, '0');
  // seconds 集合保存`String`，供命令处理后续处理使用。
  const seconds = String(date.getSeconds()).padStart(2, '0');
  // 返回 ``${year}-${month}-${day}-${hours}${minutes}${seconds}``，作为命令处理这次计算的结果。
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}
// extractFirstPrompt 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractFirstPrompt(messages: Message[]): string {
  // firstUserMessage 消息数据筛选`messages.find`，供命令处理后续处理使用。
  const firstUserMessage = messages.find(msg => msg.type === 'user');
  // `!firstUserMessage || firstUserMessage.type` 与 `'u` 不一致时刷新派生状态，避免使用过期结果。
  if (!firstUserMessage || firstUserMessage.type !== 'user') {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return '';
  }
  // 文本内容保存`firstUserMessage.message?.content`，供后续判断或组装使用。
  const content = firstUserMessage.message?.content;
  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = '';
  // 当 `typeof content` 匹配 `'string'` 时，命令处理执行对应分支。
  if (typeof content === 'string') {
    // 结果更新为 `content.trim()`，确保斜杠命令后续读取最新状态。
    result = content.trim();
  // 斜杠命令 export在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
  } else if (Array.isArray(content)) {
    // textContent筛选`content.find`，供命令处理后续处理使用。
    const textContent = content.find(item => item.type === 'text');
    // 只有 `textContent && 'text' in textContent` 满足时，命令处理才执行该分支。
    if (textContent && 'text' in textContent) {
      // 结果更新为 `textContent.text.trim()`，确保斜杠命令后续读取最新状态。
      result = textContent.text.trim();
    }
  }

  // Take first line only and limit length
  // 结果更新为 `result.split('\n')[0] || ''`，确保斜杠命令后续读取最新状态。
  result = result.split('\n')[0] || '';
  // 满足 `result.length > 50` 时，命令处理执行该分支。
  if (result.length > 50) {
    // 结果更新为 `result.substring(0, 49) + '…'`，确保斜杠命令后续读取最新状态。
    result = result.substring(0, 49) + '…';
  }
  // 返回 `result`，作为命令处理这次计算的结果。
  return result;
}
// sanitizeFilename 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sanitizeFilename(text: string): string {
  // Replace special characters with hyphens
  // 返回 `text.toLowerCase().replace(/[^a-z0-9\s-]/g, '') // Remove special chars`，作为命令处理这次计算的结果。
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '') // Remove special chars
  .replace(/\s+/g, '-') // Replace spaces with hyphens
  .replace(/-+/g, '-') // Replace multiple hyphens with single
  .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
// exportWithReactRenderer 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function exportWithReactRenderer(context: ToolUseContext): Promise<string> {
  // tools 集合标记命令处理斜杠命令 export是否启用对应路径。
  const tools = context.options.tools || [];
  // 返回 `renderMessagesToPlainText(context.messages, tools)`，作为命令处理这次计算的结果。
  return renderMessagesToPlainText(context.messages, tools);
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, context: ToolUseContext, args: string): Promise<React.ReactNode> {
  // Render the conversation content
  // 文本内容保存`exportWithReactRenderer`，供命令处理后续处理使用。
  const content = await exportWithReactRenderer(context);

  // If args are provided, write directly to file and skip dialog
  // 文件名格式化`args.trim`，供命令处理后续处理使用。
  const filename = args.trim();
  // 满足 `filename` 时，命令处理执行该分支。
  if (filename) {
    // finalFilename 文件数据保存`filename.endsWith`，供命令处理后续处理使用。
    const finalFilename = filename.endsWith('.txt') ? filename : filename.replace(/\.[^.]+$/, '') + '.txt';
    // filepath 路径数据格式化`join`，供命令处理后续处理使用。
    const filepath = join(getCwd(), finalFilename);
    // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
    try {
      // 调用 writeFileSync_DEPRECATED，触发命令处理此处需要的副作用。
      writeFileSync_DEPRECATED(filepath, content, {
        encoding: 'utf-8',
        flush: true
      });
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Conversation exported to: ${filepath}`);
      // 返回 `null`，作为命令处理这次计算的结果。
      return null;
    } catch (error) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Failed to export conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // 返回 `null`，作为命令处理这次计算的结果。
      return null;
    }
  }

  // Generate default filename from first prompt or timestamp
  // firstPrompt保存`extractFirstPrompt`，供命令处理后续处理使用。
  const firstPrompt = extractFirstPrompt(context.messages);
  // timestamp格式化`formatTimestamp`，供命令处理后续处理使用。
  const timestamp = formatTimestamp(new Date());
  // defaultFilename 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let defaultFilename: string;
  // 满足 `firstPrompt` 时，命令处理执行该分支。
  if (firstPrompt) {
    // sanitized保存`sanitizeFilename`，供命令处理后续处理使用。
    const sanitized = sanitizeFilename(firstPrompt);
    // defaultFilename 文件数据更新为 `sanitized ? `${timestamp}-${sanitized}.txt` : `conversati...`，确保斜杠命令后续读取最新状态。
    defaultFilename = sanitized ? `${timestamp}-${sanitized}.txt` : `conversation-${timestamp}.txt`;
  } else {
    // defaultFilename 文件数据更新为 ``conversation-${timestamp}.txt``，确保斜杠命令后续读取最新状态。
    defaultFilename = `conversation-${timestamp}.txt`;
  }

  // Return the dialog component when no args provided
  // 返回 `<ExportDialog content={content} defaultFilename={defaultFilename} onDon...`，作为命令处理这次计算的结果。
  return <ExportDialog content={content} defaultFilename={defaultFilename} onDone={result => {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(result.message);
  }} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJqb2luIiwiUmVhY3QiLCJFeHBvcnREaWFsb2ciLCJUb29sVXNlQ29udGV4dCIsIkxvY2FsSlNYQ29tbWFuZE9uRG9uZSIsIk1lc3NhZ2UiLCJnZXRDd2QiLCJyZW5kZXJNZXNzYWdlc1RvUGxhaW5UZXh0Iiwid3JpdGVGaWxlU3luY19ERVBSRUNBVEVEIiwiZm9ybWF0VGltZXN0YW1wIiwiZGF0ZSIsIkRhdGUiLCJ5ZWFyIiwiZ2V0RnVsbFllYXIiLCJtb250aCIsIlN0cmluZyIsImdldE1vbnRoIiwicGFkU3RhcnQiLCJkYXkiLCJnZXREYXRlIiwiaG91cnMiLCJnZXRIb3VycyIsIm1pbnV0ZXMiLCJnZXRNaW51dGVzIiwic2Vjb25kcyIsImdldFNlY29uZHMiLCJleHRyYWN0Rmlyc3RQcm9tcHQiLCJtZXNzYWdlcyIsImZpcnN0VXNlck1lc3NhZ2UiLCJmaW5kIiwibXNnIiwidHlwZSIsImNvbnRlbnQiLCJtZXNzYWdlIiwicmVzdWx0IiwidHJpbSIsIkFycmF5IiwiaXNBcnJheSIsInRleHRDb250ZW50IiwiaXRlbSIsInRleHQiLCJzcGxpdCIsImxlbmd0aCIsInN1YnN0cmluZyIsInNhbml0aXplRmlsZW5hbWUiLCJ0b0xvd2VyQ2FzZSIsInJlcGxhY2UiLCJleHBvcnRXaXRoUmVhY3RSZW5kZXJlciIsImNvbnRleHQiLCJQcm9taXNlIiwidG9vbHMiLCJvcHRpb25zIiwiY2FsbCIsIm9uRG9uZSIsImFyZ3MiLCJSZWFjdE5vZGUiLCJmaWxlbmFtZSIsImZpbmFsRmlsZW5hbWUiLCJlbmRzV2l0aCIsImZpbGVwYXRoIiwiZW5jb2RpbmciLCJmbHVzaCIsImVycm9yIiwiRXJyb3IiLCJmaXJzdFByb21wdCIsInRpbWVzdGFtcCIsImRlZmF1bHRGaWxlbmFtZSIsInNhbml0aXplZCJdLCJzb3VyY2VzIjpbImV4cG9ydC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBFeHBvcnREaWFsb2cgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0V4cG9ydERpYWxvZy5qcydcbmltcG9ydCB0eXBlIHsgVG9vbFVzZUNvbnRleHQgfSBmcm9tICcuLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRPbkRvbmUgfSBmcm9tICcuLi8uLi90eXBlcy9jb21tYW5kLmpzJ1xuaW1wb3J0IHR5cGUgeyBNZXNzYWdlIH0gZnJvbSAnLi4vLi4vdHlwZXMvbWVzc2FnZS5qcydcbmltcG9ydCB7IGdldEN3ZCB9IGZyb20gJy4uLy4uL3V0aWxzL2N3ZC5qcydcbmltcG9ydCB7IHJlbmRlck1lc3NhZ2VzVG9QbGFpblRleHQgfSBmcm9tICcuLi8uLi91dGlscy9leHBvcnRSZW5kZXJlci5qcydcbmltcG9ydCB7IHdyaXRlRmlsZVN5bmNfREVQUkVDQVRFRCB9IGZyb20gJy4uLy4uL3V0aWxzL3Nsb3dPcGVyYXRpb25zLmpzJ1xuXG5mdW5jdGlvbiBmb3JtYXRUaW1lc3RhbXAoZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG4gIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKClcbiAgY29uc3QgbW9udGggPSBTdHJpbmcoZGF0ZS5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKVxuICBjb25zdCBkYXkgPSBTdHJpbmcoZGF0ZS5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJylcbiAgY29uc3QgaG91cnMgPSBTdHJpbmcoZGF0ZS5nZXRIb3VycygpKS5wYWRTdGFydCgyLCAnMCcpXG4gIGNvbnN0IG1pbnV0ZXMgPSBTdHJpbmcoZGF0ZS5nZXRNaW51dGVzKCkpLnBhZFN0YXJ0KDIsICcwJylcbiAgY29uc3Qgc2Vjb25kcyA9IFN0cmluZyhkYXRlLmdldFNlY29uZHMoKSkucGFkU3RhcnQoMiwgJzAnKVxuICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tJHtkYXl9LSR7aG91cnN9JHttaW51dGVzfSR7c2Vjb25kc31gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Rmlyc3RQcm9tcHQobWVzc2FnZXM6IE1lc3NhZ2VbXSk6IHN0cmluZyB7XG4gIGNvbnN0IGZpcnN0VXNlck1lc3NhZ2UgPSBtZXNzYWdlcy5maW5kKG1zZyA9PiBtc2cudHlwZSA9PT0gJ3VzZXInKVxuXG4gIGlmICghZmlyc3RVc2VyTWVzc2FnZSB8fCBmaXJzdFVzZXJNZXNzYWdlLnR5cGUgIT09ICd1c2VyJykge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGZpcnN0VXNlck1lc3NhZ2UubWVzc2FnZT8uY29udGVudFxuICBsZXQgcmVzdWx0ID0gJydcblxuICBpZiAodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgcmVzdWx0ID0gY29udGVudC50cmltKClcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGNvbnRlbnQpKSB7XG4gICAgY29uc3QgdGV4dENvbnRlbnQgPSBjb250ZW50LmZpbmQoaXRlbSA9PiBpdGVtLnR5cGUgPT09ICd0ZXh0JylcbiAgICBpZiAodGV4dENvbnRlbnQgJiYgJ3RleHQnIGluIHRleHRDb250ZW50KSB7XG4gICAgICByZXN1bHQgPSB0ZXh0Q29udGVudC50ZXh0LnRyaW0oKVxuICAgIH1cbiAgfVxuXG4gIC8vIFRha2UgZmlyc3QgbGluZSBvbmx5IGFuZCBsaW1pdCBsZW5ndGhcbiAgcmVzdWx0ID0gcmVzdWx0LnNwbGl0KCdcXG4nKVswXSB8fCAnJ1xuICBpZiAocmVzdWx0Lmxlbmd0aCA+IDUwKSB7XG4gICAgcmVzdWx0ID0gcmVzdWx0LnN1YnN0cmluZygwLCA0OSkgKyAn4oCmJ1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVGaWxlbmFtZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBSZXBsYWNlIHNwZWNpYWwgY2hhcmFjdGVycyB3aXRoIGh5cGhlbnNcbiAgcmV0dXJuIHRleHRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOVxccy1dL2csICcnKSAvLyBSZW1vdmUgc3BlY2lhbCBjaGFyc1xuICAgIC5yZXBsYWNlKC9cXHMrL2csICctJykgLy8gUmVwbGFjZSBzcGFjZXMgd2l0aCBoeXBoZW5zXG4gICAgLnJlcGxhY2UoLy0rL2csICctJykgLy8gUmVwbGFjZSBtdWx0aXBsZSBoeXBoZW5zIHdpdGggc2luZ2xlXG4gICAgLnJlcGxhY2UoL14tfC0kL2csICcnKSAvLyBSZW1vdmUgbGVhZGluZy90cmFpbGluZyBoeXBoZW5zXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4cG9ydFdpdGhSZWFjdFJlbmRlcmVyKFxuICBjb250ZXh0OiBUb29sVXNlQ29udGV4dCxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHRvb2xzID0gY29udGV4dC5vcHRpb25zLnRvb2xzIHx8IFtdXG4gIHJldHVybiByZW5kZXJNZXNzYWdlc1RvUGxhaW5UZXh0KGNvbnRleHQubWVzc2FnZXMsIHRvb2xzKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbChcbiAgb25Eb25lOiBMb2NhbEpTWENvbW1hbmRPbkRvbmUsXG4gIGNvbnRleHQ6IFRvb2xVc2VDb250ZXh0LFxuICBhcmdzOiBzdHJpbmcsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICAvLyBSZW5kZXIgdGhlIGNvbnZlcnNhdGlvbiBjb250ZW50XG4gIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBleHBvcnRXaXRoUmVhY3RSZW5kZXJlcihjb250ZXh0KVxuXG4gIC8vIElmIGFyZ3MgYXJlIHByb3ZpZGVkLCB3cml0ZSBkaXJlY3RseSB0byBmaWxlIGFuZCBza2lwIGRpYWxvZ1xuICBjb25zdCBmaWxlbmFtZSA9IGFyZ3MudHJpbSgpXG4gIGlmIChmaWxlbmFtZSkge1xuICAgIGNvbnN0IGZpbmFsRmlsZW5hbWUgPSBmaWxlbmFtZS5lbmRzV2l0aCgnLnR4dCcpXG4gICAgICA/IGZpbGVuYW1lXG4gICAgICA6IGZpbGVuYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sICcnKSArICcudHh0J1xuICAgIGNvbnN0IGZpbGVwYXRoID0gam9pbihnZXRDd2QoKSwgZmluYWxGaWxlbmFtZSlcblxuICAgIHRyeSB7XG4gICAgICB3cml0ZUZpbGVTeW5jX0RFUFJFQ0FURUQoZmlsZXBhdGgsIGNvbnRlbnQsIHtcbiAgICAgICAgZW5jb2Rpbmc6ICd1dGYtOCcsXG4gICAgICAgIGZsdXNoOiB0cnVlLFxuICAgICAgfSlcbiAgICAgIG9uRG9uZShgQ29udmVyc2F0aW9uIGV4cG9ydGVkIHRvOiAke2ZpbGVwYXRofWApXG4gICAgICByZXR1cm4gbnVsbFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBvbkRvbmUoXG4gICAgICAgIGBGYWlsZWQgdG8gZXhwb3J0IGNvbnZlcnNhdGlvbjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gLFxuICAgICAgKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cblxuICAvLyBHZW5lcmF0ZSBkZWZhdWx0IGZpbGVuYW1lIGZyb20gZmlyc3QgcHJvbXB0IG9yIHRpbWVzdGFtcFxuICBjb25zdCBmaXJzdFByb21wdCA9IGV4dHJhY3RGaXJzdFByb21wdChjb250ZXh0Lm1lc3NhZ2VzKVxuICBjb25zdCB0aW1lc3RhbXAgPSBmb3JtYXRUaW1lc3RhbXAobmV3IERhdGUoKSlcblxuICBsZXQgZGVmYXVsdEZpbGVuYW1lOiBzdHJpbmdcbiAgaWYgKGZpcnN0UHJvbXB0KSB7XG4gICAgY29uc3Qgc2FuaXRpemVkID0gc2FuaXRpemVGaWxlbmFtZShmaXJzdFByb21wdClcbiAgICBkZWZhdWx0RmlsZW5hbWUgPSBzYW5pdGl6ZWRcbiAgICAgID8gYCR7dGltZXN0YW1wfS0ke3Nhbml0aXplZH0udHh0YFxuICAgICAgOiBgY29udmVyc2F0aW9uLSR7dGltZXN0YW1wfS50eHRgXG4gIH0gZWxzZSB7XG4gICAgZGVmYXVsdEZpbGVuYW1lID0gYGNvbnZlcnNhdGlvbi0ke3RpbWVzdGFtcH0udHh0YFxuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBkaWFsb2cgY29tcG9uZW50IHdoZW4gbm8gYXJncyBwcm92aWRlZFxuICByZXR1cm4gKFxuICAgIDxFeHBvcnREaWFsb2dcbiAgICAgIGNvbnRlbnQ9e2NvbnRlbnR9XG4gICAgICBkZWZhdWx0RmlsZW5hbWU9e2RlZmF1bHRGaWxlbmFtZX1cbiAgICAgIG9uRG9uZT17cmVzdWx0ID0+IHtcbiAgICAgICAgb25Eb25lKHJlc3VsdC5tZXNzYWdlKVxuICAgICAgfX1cbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLElBQUksUUFBUSxNQUFNO0FBQzNCLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLFlBQVksUUFBUSxrQ0FBa0M7QUFDL0QsY0FBY0MsY0FBYyxRQUFRLGVBQWU7QUFDbkQsY0FBY0MscUJBQXFCLFFBQVEsd0JBQXdCO0FBQ25FLGNBQWNDLE9BQU8sUUFBUSx3QkFBd0I7QUFDckQsU0FBU0MsTUFBTSxRQUFRLG9CQUFvQjtBQUMzQyxTQUFTQyx5QkFBeUIsUUFBUSwrQkFBK0I7QUFDekUsU0FBU0Msd0JBQXdCLFFBQVEsK0JBQStCO0FBRXhFLFNBQVNDLGVBQWVBLENBQUNDLElBQUksRUFBRUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDO0VBQzNDLE1BQU1DLElBQUksR0FBR0YsSUFBSSxDQUFDRyxXQUFXLENBQUMsQ0FBQztFQUMvQixNQUFNQyxLQUFLLEdBQUdDLE1BQU0sQ0FBQ0wsSUFBSSxDQUFDTSxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztFQUMxRCxNQUFNQyxHQUFHLEdBQUdILE1BQU0sQ0FBQ0wsSUFBSSxDQUFDUyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUNGLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO0VBQ25ELE1BQU1HLEtBQUssR0FBR0wsTUFBTSxDQUFDTCxJQUFJLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQ0osUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUM7RUFDdEQsTUFBTUssT0FBTyxHQUFHUCxNQUFNLENBQUNMLElBQUksQ0FBQ2EsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDTixRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztFQUMxRCxNQUFNTyxPQUFPLEdBQUdULE1BQU0sQ0FBQ0wsSUFBSSxDQUFDZSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUNSLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO0VBQzFELE9BQU8sR0FBR0wsSUFBSSxJQUFJRSxLQUFLLElBQUlJLEdBQUcsSUFBSUUsS0FBSyxHQUFHRSxPQUFPLEdBQUdFLE9BQU8sRUFBRTtBQUMvRDtBQUVBLE9BQU8sU0FBU0Usa0JBQWtCQSxDQUFDQyxRQUFRLEVBQUV0QixPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQztFQUM5RCxNQUFNdUIsZ0JBQWdCLEdBQUdELFFBQVEsQ0FBQ0UsSUFBSSxDQUFDQyxHQUFHLElBQUlBLEdBQUcsQ0FBQ0MsSUFBSSxLQUFLLE1BQU0sQ0FBQztFQUVsRSxJQUFJLENBQUNILGdCQUFnQixJQUFJQSxnQkFBZ0IsQ0FBQ0csSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUN6RCxPQUFPLEVBQUU7RUFDWDtFQUVBLE1BQU1DLE9BQU8sR0FBR0osZ0JBQWdCLENBQUNLLE9BQU8sRUFBRUQsT0FBTztFQUNqRCxJQUFJRSxNQUFNLEdBQUcsRUFBRTtFQUVmLElBQUksT0FBT0YsT0FBTyxLQUFLLFFBQVEsRUFBRTtJQUMvQkUsTUFBTSxHQUFHRixPQUFPLENBQUNHLElBQUksQ0FBQyxDQUFDO0VBQ3pCLENBQUMsTUFBTSxJQUFJQyxLQUFLLENBQUNDLE9BQU8sQ0FBQ0wsT0FBTyxDQUFDLEVBQUU7SUFDakMsTUFBTU0sV0FBVyxHQUFHTixPQUFPLENBQUNILElBQUksQ0FBQ1UsSUFBSSxJQUFJQSxJQUFJLENBQUNSLElBQUksS0FBSyxNQUFNLENBQUM7SUFDOUQsSUFBSU8sV0FBVyxJQUFJLE1BQU0sSUFBSUEsV0FBVyxFQUFFO01BQ3hDSixNQUFNLEdBQUdJLFdBQVcsQ0FBQ0UsSUFBSSxDQUFDTCxJQUFJLENBQUMsQ0FBQztJQUNsQztFQUNGOztFQUVBO0VBQ0FELE1BQU0sR0FBR0EsTUFBTSxDQUFDTyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtFQUNwQyxJQUFJUCxNQUFNLENBQUNRLE1BQU0sR0FBRyxFQUFFLEVBQUU7SUFDdEJSLE1BQU0sR0FBR0EsTUFBTSxDQUFDUyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUc7RUFDeEM7RUFFQSxPQUFPVCxNQUFNO0FBQ2Y7QUFFQSxPQUFPLFNBQVNVLGdCQUFnQkEsQ0FBQ0osSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQztFQUNyRDtFQUNBLE9BQU9BLElBQUksQ0FDUkssV0FBVyxDQUFDLENBQUMsQ0FDYkMsT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQztFQUFBLENBQzdCQSxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQUEsQ0FDckJBLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7RUFBQSxDQUNwQkEsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBQztBQUMzQjtBQUVBLGVBQWVDLHVCQUF1QkEsQ0FDcENDLE9BQU8sRUFBRTdDLGNBQWMsQ0FDeEIsRUFBRThDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUNqQixNQUFNQyxLQUFLLEdBQUdGLE9BQU8sQ0FBQ0csT0FBTyxDQUFDRCxLQUFLLElBQUksRUFBRTtFQUN6QyxPQUFPM0MseUJBQXlCLENBQUN5QyxPQUFPLENBQUNyQixRQUFRLEVBQUV1QixLQUFLLENBQUM7QUFDM0Q7QUFFQSxPQUFPLGVBQWVFLElBQUlBLENBQ3hCQyxNQUFNLEVBQUVqRCxxQkFBcUIsRUFDN0I0QyxPQUFPLEVBQUU3QyxjQUFjLEVBQ3ZCbUQsSUFBSSxFQUFFLE1BQU0sQ0FDYixFQUFFTCxPQUFPLENBQUNoRCxLQUFLLENBQUNzRCxTQUFTLENBQUMsQ0FBQztFQUMxQjtFQUNBLE1BQU12QixPQUFPLEdBQUcsTUFBTWUsdUJBQXVCLENBQUNDLE9BQU8sQ0FBQzs7RUFFdEQ7RUFDQSxNQUFNUSxRQUFRLEdBQUdGLElBQUksQ0FBQ25CLElBQUksQ0FBQyxDQUFDO0VBQzVCLElBQUlxQixRQUFRLEVBQUU7SUFDWixNQUFNQyxhQUFhLEdBQUdELFFBQVEsQ0FBQ0UsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUMzQ0YsUUFBUSxHQUNSQSxRQUFRLENBQUNWLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLEdBQUcsTUFBTTtJQUM3QyxNQUFNYSxRQUFRLEdBQUczRCxJQUFJLENBQUNNLE1BQU0sQ0FBQyxDQUFDLEVBQUVtRCxhQUFhLENBQUM7SUFFOUMsSUFBSTtNQUNGakQsd0JBQXdCLENBQUNtRCxRQUFRLEVBQUUzQixPQUFPLEVBQUU7UUFDMUM0QixRQUFRLEVBQUUsT0FBTztRQUNqQkMsS0FBSyxFQUFFO01BQ1QsQ0FBQyxDQUFDO01BQ0ZSLE1BQU0sQ0FBQyw2QkFBNkJNLFFBQVEsRUFBRSxDQUFDO01BQy9DLE9BQU8sSUFBSTtJQUNiLENBQUMsQ0FBQyxPQUFPRyxLQUFLLEVBQUU7TUFDZFQsTUFBTSxDQUNKLGtDQUFrQ1MsS0FBSyxZQUFZQyxLQUFLLEdBQUdELEtBQUssQ0FBQzdCLE9BQU8sR0FBRyxlQUFlLEVBQzVGLENBQUM7TUFDRCxPQUFPLElBQUk7SUFDYjtFQUNGOztFQUVBO0VBQ0EsTUFBTStCLFdBQVcsR0FBR3RDLGtCQUFrQixDQUFDc0IsT0FBTyxDQUFDckIsUUFBUSxDQUFDO0VBQ3hELE1BQU1zQyxTQUFTLEdBQUd4RCxlQUFlLENBQUMsSUFBSUUsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUU3QyxJQUFJdUQsZUFBZSxFQUFFLE1BQU07RUFDM0IsSUFBSUYsV0FBVyxFQUFFO0lBQ2YsTUFBTUcsU0FBUyxHQUFHdkIsZ0JBQWdCLENBQUNvQixXQUFXLENBQUM7SUFDL0NFLGVBQWUsR0FBR0MsU0FBUyxHQUN2QixHQUFHRixTQUFTLElBQUlFLFNBQVMsTUFBTSxHQUMvQixnQkFBZ0JGLFNBQVMsTUFBTTtFQUNyQyxDQUFDLE1BQU07SUFDTEMsZUFBZSxHQUFHLGdCQUFnQkQsU0FBUyxNQUFNO0VBQ25EOztFQUVBO0VBQ0EsT0FDRSxDQUFDLFlBQVksQ0FDWCxPQUFPLENBQUMsQ0FBQ2pDLE9BQU8sQ0FBQyxDQUNqQixlQUFlLENBQUMsQ0FBQ2tDLGVBQWUsQ0FBQyxDQUNqQyxNQUFNLENBQUMsQ0FBQ2hDLE1BQU0sSUFBSTtJQUNoQm1CLE1BQU0sQ0FBQ25CLE1BQU0sQ0FBQ0QsT0FBTyxDQUFDO0VBQ3hCLENBQUMsQ0FBQyxHQUNGO0FBRU4iLCJpZ25vcmVMaXN0IjpbXX0=
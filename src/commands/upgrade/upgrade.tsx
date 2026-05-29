// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { LocalJSXCommandContext } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandContext } from '../../commands.js';
// 接入 getOauthProfileFromOauthToken 服务层能力，把外部通信或共享状态交给 ../../services/oauth/getOauthProfile.js 处理。
import { getOauthProfileFromOauthToken } from '../../services/oauth/getOauthProfile.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 getClaudeAIOAuthTokens、isClaudeAISubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getClaudeAIOAuthTokens, isClaudeAISubscriber } from '../../utils/auth.js';
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js';
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js';
// 引入 Login，将 ../login/login.js 中已经封装好的能力接到本文件流程里。
import { Login } from '../login/login.js';
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, context: LocalJSXCommandContext): Promise<React.ReactNode | null> {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // Check if user is already on the highest Max plan (20x)
    // 满足 `isClaudeAISubscriber()` 时，命令处理执行该分支。
    if (isClaudeAISubscriber()) {
      // token 列表读取`getClaudeAIOAuthTokens`，供命令处理后续处理使用。
      const tokens = getClaudeAIOAuthTokens();
      // isMax20x标记命令处理斜杠命令 upgrade是否启用对应路径。
      let isMax20x = false;
      // 只有 `tokens?.subscriptionType && tokens?.rateLimitTier` 满足时，命令处理才执行该分支。
      if (tokens?.subscriptionType && tokens?.rateLimitTier) {
        // isMax20x更新为 `tokens.subscriptionType === 'max' && tokens.rateLimitTier...`，确保斜杠命令后续读取最新状态。
        isMax20x = tokens.subscriptionType === 'max' && tokens.rateLimitTier === 'default_claude_max_20x';
      // 斜杠命令 upgrade在这里处理 `} else if (tokens?.accessToken) {`，完成这一小步状态转换。
      } else if (tokens?.accessToken) {
        // profile 文件数据读取`getOauthProfileFromOauthToken`，供命令处理后续处理使用。
        const profile = await getOauthProfileFromOauthToken(tokens.accessToken);
        // isMax20x更新为 `profile?.organization?.organization_type === 'claude_max'...`，确保斜杠命令后续读取最新状态。
        isMax20x = profile?.organization?.organization_type === 'claude_max' && profile?.organization?.rate_limit_tier === 'default_claude_max_20x';
      }
      // 满足 `isMax20x` 时，命令处理执行该分支。
      if (isMax20x) {
        // setTimeout 写入新的状态值，使命令处理后续读取保持一致。
        setTimeout(onDone, 0, 'You are already on the highest Max subscription plan. For additional usage, run /login to switch to an API usage-billed account.');
        // 返回 `null`，作为命令处理这次计算的结果。
        return null;
      }
    }
    // URL 命名 `'https://claude.ai/upgrade/max'`，让后续代码直接表达这个值的用途。
    const url = 'https://claude.ai/upgrade/max';
    // 等待 `openBrowser(url)` 完成，再继续斜杠命令 upgrade的异步流程。
    await openBrowser(url);
    // 返回 `<Login startingMessage={'Starting new login following /upgrade. Exit wi...`，作为命令处理这次计算的结果。
    return <Login startingMessage={'Starting new login following /upgrade. Exit with Ctrl-C to use existing account.'} onDone={success => {
      // 调用 context.onChangeAPIKey，触发命令处理此处需要的副作用。
      context.onChangeAPIKey();
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(success ? 'Login successful' : 'Login interrupted');
    }} />;
  } catch (error) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logError(error as Error);
    // setTimeout 写入新的状态值，使命令处理后续读取保持一致。
    setTimeout(onDone, 0, 'Failed to open browser. Please visit https://claude.ai/upgrade/max to upgrade.');
  }
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkxvY2FsSlNYQ29tbWFuZENvbnRleHQiLCJnZXRPYXV0aFByb2ZpbGVGcm9tT2F1dGhUb2tlbiIsIkxvY2FsSlNYQ29tbWFuZE9uRG9uZSIsImdldENsYXVkZUFJT0F1dGhUb2tlbnMiLCJpc0NsYXVkZUFJU3Vic2NyaWJlciIsIm9wZW5Ccm93c2VyIiwibG9nRXJyb3IiLCJMb2dpbiIsImNhbGwiLCJvbkRvbmUiLCJjb250ZXh0IiwiUHJvbWlzZSIsIlJlYWN0Tm9kZSIsInRva2VucyIsImlzTWF4MjB4Iiwic3Vic2NyaXB0aW9uVHlwZSIsInJhdGVMaW1pdFRpZXIiLCJhY2Nlc3NUb2tlbiIsInByb2ZpbGUiLCJvcmdhbml6YXRpb24iLCJvcmdhbml6YXRpb25fdHlwZSIsInJhdGVfbGltaXRfdGllciIsInNldFRpbWVvdXQiLCJ1cmwiLCJzdWNjZXNzIiwib25DaGFuZ2VBUElLZXkiLCJlcnJvciIsIkVycm9yIl0sInNvdXJjZXMiOlsidXBncmFkZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZENvbnRleHQgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IGdldE9hdXRoUHJvZmlsZUZyb21PYXV0aFRva2VuIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvb2F1dGgvZ2V0T2F1dGhQcm9maWxlLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRPbkRvbmUgfSBmcm9tICcuLi8uLi90eXBlcy9jb21tYW5kLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0Q2xhdWRlQUlPQXV0aFRva2VucyxcbiAgaXNDbGF1ZGVBSVN1YnNjcmliZXIsXG59IGZyb20gJy4uLy4uL3V0aWxzL2F1dGguanMnXG5pbXBvcnQgeyBvcGVuQnJvd3NlciB9IGZyb20gJy4uLy4uL3V0aWxzL2Jyb3dzZXIuanMnXG5pbXBvcnQgeyBsb2dFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2xvZy5qcydcbmltcG9ydCB7IExvZ2luIH0gZnJvbSAnLi4vbG9naW4vbG9naW4uanMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsKFxuICBvbkRvbmU6IExvY2FsSlNYQ29tbWFuZE9uRG9uZSxcbiAgY29udGV4dDogTG9jYWxKU1hDb21tYW5kQ29udGV4dCxcbik6IFByb21pc2U8UmVhY3QuUmVhY3ROb2RlIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIC8vIENoZWNrIGlmIHVzZXIgaXMgYWxyZWFkeSBvbiB0aGUgaGlnaGVzdCBNYXggcGxhbiAoMjB4KVxuICAgIGlmIChpc0NsYXVkZUFJU3Vic2NyaWJlcigpKSB7XG4gICAgICBjb25zdCB0b2tlbnMgPSBnZXRDbGF1ZGVBSU9BdXRoVG9rZW5zKClcbiAgICAgIGxldCBpc01heDIweCA9IGZhbHNlXG5cbiAgICAgIGlmICh0b2tlbnM/LnN1YnNjcmlwdGlvblR5cGUgJiYgdG9rZW5zPy5yYXRlTGltaXRUaWVyKSB7XG4gICAgICAgIGlzTWF4MjB4ID1cbiAgICAgICAgICB0b2tlbnMuc3Vic2NyaXB0aW9uVHlwZSA9PT0gJ21heCcgJiZcbiAgICAgICAgICB0b2tlbnMucmF0ZUxpbWl0VGllciA9PT0gJ2RlZmF1bHRfY2xhdWRlX21heF8yMHgnXG4gICAgICB9IGVsc2UgaWYgKHRva2Vucz8uYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgY29uc3QgcHJvZmlsZSA9IGF3YWl0IGdldE9hdXRoUHJvZmlsZUZyb21PYXV0aFRva2VuKHRva2Vucy5hY2Nlc3NUb2tlbilcbiAgICAgICAgaXNNYXgyMHggPVxuICAgICAgICAgIHByb2ZpbGU/Lm9yZ2FuaXphdGlvbj8ub3JnYW5pemF0aW9uX3R5cGUgPT09ICdjbGF1ZGVfbWF4JyAmJlxuICAgICAgICAgIHByb2ZpbGU/Lm9yZ2FuaXphdGlvbj8ucmF0ZV9saW1pdF90aWVyID09PSAnZGVmYXVsdF9jbGF1ZGVfbWF4XzIweCdcbiAgICAgIH1cblxuICAgICAgaWYgKGlzTWF4MjB4KSB7XG4gICAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgICAgb25Eb25lLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgJ1lvdSBhcmUgYWxyZWFkeSBvbiB0aGUgaGlnaGVzdCBNYXggc3Vic2NyaXB0aW9uIHBsYW4uIEZvciBhZGRpdGlvbmFsIHVzYWdlLCBydW4gL2xvZ2luIHRvIHN3aXRjaCB0byBhbiBBUEkgdXNhZ2UtYmlsbGVkIGFjY291bnQuJyxcbiAgICAgICAgKVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHVybCA9ICdodHRwczovL2NsYXVkZS5haS91cGdyYWRlL21heCdcbiAgICBhd2FpdCBvcGVuQnJvd3Nlcih1cmwpXG5cbiAgICByZXR1cm4gKFxuICAgICAgPExvZ2luXG4gICAgICAgIHN0YXJ0aW5nTWVzc2FnZT17XG4gICAgICAgICAgJ1N0YXJ0aW5nIG5ldyBsb2dpbiBmb2xsb3dpbmcgL3VwZ3JhZGUuIEV4aXQgd2l0aCBDdHJsLUMgdG8gdXNlIGV4aXN0aW5nIGFjY291bnQuJ1xuICAgICAgICB9XG4gICAgICAgIG9uRG9uZT17c3VjY2VzcyA9PiB7XG4gICAgICAgICAgY29udGV4dC5vbkNoYW5nZUFQSUtleSgpXG4gICAgICAgICAgb25Eb25lKHN1Y2Nlc3MgPyAnTG9naW4gc3VjY2Vzc2Z1bCcgOiAnTG9naW4gaW50ZXJydXB0ZWQnKVxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nRXJyb3IoZXJyb3IgYXMgRXJyb3IpXG4gICAgc2V0VGltZW91dChcbiAgICAgIG9uRG9uZSxcbiAgICAgIDAsXG4gICAgICAnRmFpbGVkIHRvIG9wZW4gYnJvd3Nlci4gUGxlYXNlIHZpc2l0IGh0dHBzOi8vY2xhdWRlLmFpL3VwZ3JhZGUvbWF4IHRvIHVwZ3JhZGUuJyxcbiAgICApXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixjQUFjQyxzQkFBc0IsUUFBUSxtQkFBbUI7QUFDL0QsU0FBU0MsNkJBQTZCLFFBQVEseUNBQXlDO0FBQ3ZGLGNBQWNDLHFCQUFxQixRQUFRLHdCQUF3QjtBQUNuRSxTQUNFQyxzQkFBc0IsRUFDdEJDLG9CQUFvQixRQUNmLHFCQUFxQjtBQUM1QixTQUFTQyxXQUFXLFFBQVEsd0JBQXdCO0FBQ3BELFNBQVNDLFFBQVEsUUFBUSxvQkFBb0I7QUFDN0MsU0FBU0MsS0FBSyxRQUFRLG1CQUFtQjtBQUV6QyxPQUFPLGVBQWVDLElBQUlBLENBQ3hCQyxNQUFNLEVBQUVQLHFCQUFxQixFQUM3QlEsT0FBTyxFQUFFVixzQkFBc0IsQ0FDaEMsRUFBRVcsT0FBTyxDQUFDWixLQUFLLENBQUNhLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQztFQUNqQyxJQUFJO0lBQ0Y7SUFDQSxJQUFJUixvQkFBb0IsQ0FBQyxDQUFDLEVBQUU7TUFDMUIsTUFBTVMsTUFBTSxHQUFHVixzQkFBc0IsQ0FBQyxDQUFDO01BQ3ZDLElBQUlXLFFBQVEsR0FBRyxLQUFLO01BRXBCLElBQUlELE1BQU0sRUFBRUUsZ0JBQWdCLElBQUlGLE1BQU0sRUFBRUcsYUFBYSxFQUFFO1FBQ3JERixRQUFRLEdBQ05ELE1BQU0sQ0FBQ0UsZ0JBQWdCLEtBQUssS0FBSyxJQUNqQ0YsTUFBTSxDQUFDRyxhQUFhLEtBQUssd0JBQXdCO01BQ3JELENBQUMsTUFBTSxJQUFJSCxNQUFNLEVBQUVJLFdBQVcsRUFBRTtRQUM5QixNQUFNQyxPQUFPLEdBQUcsTUFBTWpCLDZCQUE2QixDQUFDWSxNQUFNLENBQUNJLFdBQVcsQ0FBQztRQUN2RUgsUUFBUSxHQUNOSSxPQUFPLEVBQUVDLFlBQVksRUFBRUMsaUJBQWlCLEtBQUssWUFBWSxJQUN6REYsT0FBTyxFQUFFQyxZQUFZLEVBQUVFLGVBQWUsS0FBSyx3QkFBd0I7TUFDdkU7TUFFQSxJQUFJUCxRQUFRLEVBQUU7UUFDWlEsVUFBVSxDQUNSYixNQUFNLEVBQ04sQ0FBQyxFQUNELGtJQUNGLENBQUM7UUFDRCxPQUFPLElBQUk7TUFDYjtJQUNGO0lBRUEsTUFBTWMsR0FBRyxHQUFHLCtCQUErQjtJQUMzQyxNQUFNbEIsV0FBVyxDQUFDa0IsR0FBRyxDQUFDO0lBRXRCLE9BQ0UsQ0FBQyxLQUFLLENBQ0osZUFBZSxDQUFDLENBQ2Qsa0ZBQ0YsQ0FBQyxDQUNELE1BQU0sQ0FBQyxDQUFDQyxPQUFPLElBQUk7TUFDakJkLE9BQU8sQ0FBQ2UsY0FBYyxDQUFDLENBQUM7TUFDeEJoQixNQUFNLENBQUNlLE9BQU8sR0FBRyxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztJQUM1RCxDQUFDLENBQUMsR0FDRjtFQUVOLENBQUMsQ0FBQyxPQUFPRSxLQUFLLEVBQUU7SUFDZHBCLFFBQVEsQ0FBQ29CLEtBQUssSUFBSUMsS0FBSyxDQUFDO0lBQ3hCTCxVQUFVLENBQ1JiLE1BQU0sRUFDTixDQUFDLEVBQ0QsZ0ZBQ0YsQ0FBQztFQUNIO0VBQ0EsT0FBTyxJQUFJO0FBQ2IiLCJpZ25vcmVMaXN0IjpbXX0=
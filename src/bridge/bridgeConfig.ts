/**
 * Shared bridge auth/URL resolution. Consolidates the ant-only
 * CLAUDE_BRIDGE_* dev overrides that were previously copy-pasted across
 * a dozen files — inboundAttachments, BriefTool/upload, bridgeMain,
 * initReplBridge, remoteBridgeCore, daemon workers, /rename,
 * /remote-control.
 *
 * Two layers: *Override() returns the ant-only env var (or undefined);
 * the non-Override versions fall through to the real OAuth store/config.
 * Callers that compose with a different auth source (e.g. daemon workers
 * using IPC auth) use the Override getters directly.
 */

// 引入 getOauthConfig，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../constants/oauth.js'
// 复用 getClaudeAIOAuthTokens 工具函数，把通用处理留在 ../utils/auth.js 中维护。
import { getClaudeAIOAuthTokens } from '../utils/auth.js'

/** Ant-only dev override: CLAUDE_BRIDGE_OAUTH_TOKEN, else undefined. */
// getBridgeTokenOverride 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBridgeTokenOverride(): string | undefined {
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    (process.env.USER_TYPE === 'ant' &&
      process.env.CLAUDE_BRIDGE_OAUTH_TOKEN) ||
    undefined
  )
}

/** Ant-only dev override: CLAUDE_BRIDGE_BASE_URL, else undefined. */
// getBridgeBaseUrlOverride 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBridgeBaseUrlOverride(): string | undefined {
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    (process.env.USER_TYPE === 'ant' && process.env.CLAUDE_BRIDGE_BASE_URL) ||
    undefined
  )
}

/**
 * Access token for bridge API calls: dev override first, then the OAuth
 * keychain. Undefined means "not logged in".
 */
// getBridgeAccessToken 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBridgeAccessToken(): string | undefined {
  // 返回 `getBridgeTokenOverride() ?? getClaudeAIOAuthTokens()?.accessToken`，作为远程桥接会话这次计算的结果。
  return getBridgeTokenOverride() ?? getClaudeAIOAuthTokens()?.accessToken
}

/**
 * Base URL for bridge API calls: dev override first, then the production
 * OAuth config. Always returns a URL.
 */
// getBridgeBaseUrl 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBridgeBaseUrl(): string {
  // 返回 `getBridgeBaseUrlOverride() ?? getOauthConfig().BASE_API_URL`，作为远程桥接会话这次计算的结果。
  return getBridgeBaseUrlOverride() ?? getOauthConfig().BASE_API_URL
}

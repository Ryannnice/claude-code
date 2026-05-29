// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js'
// 引入 AuthCodeListener，将 ./auth-code-listener.js 中已经封装好的能力接到本文件流程里。
import { AuthCodeListener } from './auth-code-listener.js'
// 引入 * as client，将 ./client.js 中已经封装好的能力接到本文件流程里。
import * as client from './client.js'
// 引入 * as crypto，将 ./crypto.js 中已经封装好的能力接到本文件流程里。
import * as crypto from './crypto.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import type {
  OAuthProfileResponse,
  OAuthTokenExchangeResponse,
  OAuthTokens,
  RateLimitTier,
  SubscriptionType,
} from './types.js'

/**
 * OAuth service that handles the OAuth 2.0 authorization code flow with PKCE.
 *
 * Supports two ways to get authorization codes:
 * 1. Automatic: Opens browser, redirects to localhost where we capture the code
 * 2. Manual: User manually copies and pastes the code (used in non-browser environments)
 */
// OAuthService 聚合服务层 index相关状态与操作，把同一职责的行为收束到类实例中。
export class OAuthService {
  private codeVerifier: string
  private authCodeListener: AuthCodeListener | null = null
  private port: number | null = null
  private manualAuthCodeResolver: ((authorizationCode: string) => void) | null =
    null

  // 构造函数接收 无，把外部输入整理成实例可复用的内部状态。
  constructor() {
    // 更新实例字段 codeVerifier 为 crypto.generateCodeVerifier()，同步服务层 index的内部状态。
    this.codeVerifier = crypto.generateCodeVerifier()
  }

  async startOAuthFlow(
    // 这个回调绑定到 authURLHandler: (url: string, automaticUrl?: string) => Promise<void>,，负责服务层 index在该局部场景下的响应。
    authURLHandler: (url: string, automaticUrl?: string) => Promise<void>,
    options?: {
      loginWithClaudeAi?: boolean
      inferenceOnly?: boolean
      expiresIn?: number
      orgUUID?: string
      loginHint?: string
      loginMethod?: string
      /**
       * Don't call openBrowser(). Caller takes both URLs via authURLHandler
       * and decides how/where to open them. Used by the SDK control protocol
       * (claude_authenticate) where the SDK client owns the user's display,
       * not this process.
       */
      skipBrowserOpen?: boolean
    },
  ): Promise<OAuthTokens> {
    // Create OAuth callback listener and start it
    // 更新实例字段 authCodeListener 为 new AuthCodeListener()，同步服务层 index的内部状态。
    this.authCodeListener = new AuthCodeListener()
    // 更新实例字段 port 为 await this.authCodeListener.start()，同步服务层 index的内部状态。
    this.port = await this.authCodeListener.start()

    // Generate PKCE values and state
    // codeChallenge保存`crypto.generateCodeChallenge`，供服务层 index后续处理使用。
    const codeChallenge = crypto.generateCodeChallenge(this.codeVerifier)
    // 状态保存`crypto.generateState`，供服务层 index后续处理使用。
    const state = crypto.generateState()

    // Build auth URLs for both automatic and manual flows
    // opts 集合 集中保存服务层 index要一起传递的字段。
    const opts = {
      codeChallenge,
      state,
      port: this.port,
      loginWithClaudeAi: options?.loginWithClaudeAi,
      inferenceOnly: options?.inferenceOnly,
      orgUUID: options?.orgUUID,
      loginHint: options?.loginHint,
      loginMethod: options?.loginMethod,
    }
    // manualFlowUrl构建`client.buildAuthUrl`，供服务层 index后续处理使用。
    const manualFlowUrl = client.buildAuthUrl({ ...opts, isManual: true })
    // automaticFlowUrl构建`client.buildAuthUrl`，供服务层 index后续处理使用。
    const automaticFlowUrl = client.buildAuthUrl({ ...opts, isManual: false })

    // Wait for either automatic or manual auth code
    // authorizationCode保存`this.waitForAuthorizationCode`，供服务层 index后续处理使用。
    const authorizationCode = await this.waitForAuthorizationCode(
      state,
      // 调用 async，触发服务层 index此处需要的副作用。
      async () => {
        // 满足 `options?.skipBrowserOpen` 时，服务层 index执行该分支。
        if (options?.skipBrowserOpen) {
          // Hand both URLs to the caller. The automatic one still works
          // if the caller opens it on the same host (localhost listener
          // is running); the manual one works from anywhere.
          // 等待 `authURLHandler(manualFlowUrl, automaticFlowUrl)` 完成，再继续服务层 index的异步流程。
          await authURLHandler(manualFlowUrl, automaticFlowUrl)
        } else {
          // 等待 `authURLHandler(manualFlowUrl) // Show manual option to user` 完成，再继续服务层 index的异步流程。
          await authURLHandler(manualFlowUrl) // Show manual option to user
          // 等待 `openBrowser(automaticFlowUrl) // Try automatic flow` 完成，再继续服务层 index的异步流程。
          await openBrowser(automaticFlowUrl) // Try automatic flow
        }
      },
    )

    // Check if the automatic flow is still active (has a pending response)
    // isAutomaticFlow记录 `hasPendingResponse` 是否成立，服务层 index随后按该结果分支。
    const isAutomaticFlow = this.authCodeListener?.hasPendingResponse() ?? false
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_auth_code_received', { automatic: isAutomaticFlow })

    // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
    try {
      // Exchange authorization code for tokens
      // tokenResponse 响应数据保存`client.exchangeCodeForTokens`，供服务层 index后续处理使用。
      const tokenResponse = await client.exchangeCodeForTokens(
        authorizationCode,
        state,
        this.codeVerifier,
        this.port!,
        !isAutomaticFlow, // Pass isManual=true if it's NOT automatic flow
        options?.expiresIn,
      )

      // Fetch profile info (subscription type and rate limit tier) for the
      // returned OAuthTokens. Logout and account storage are handled by the
      // caller (installOAuthTokens in auth.ts).
      // profileInfo 文件数据读取`client.fetchProfileInfo`，供服务层 index后续处理使用。
      const profileInfo = await client.fetchProfileInfo(
        tokenResponse.access_token,
      )

      // Handle success redirect for automatic flow
      // 满足 `isAutomaticFlow` 时，服务层 index执行该分支。
      if (isAutomaticFlow) {
        // scopes 集合解析`client.parseScopes`，供服务层 index后续处理使用。
        const scopes = client.parseScopes(tokenResponse.scope)
        // 调用 this.authCodeListener?.handleSuccessRedirect(scopes)，完成这一处局部操作。
        this.authCodeListener?.handleSuccessRedirect(scopes)
      }

      // 返回 `this.formatTokens(`，作为服务层 index这次计算的结果。
      return this.formatTokens(
        tokenResponse,
        profileInfo.subscriptionType,
        profileInfo.rateLimitTier,
        profileInfo.rawProfile,
      )
    } catch (error) {
      // If we have a pending response, send an error redirect before closing
      // 满足 `isAutomaticFlow` 时，服务层 index执行该分支。
      if (isAutomaticFlow) {
        // 调用 this.authCodeListener?.handleErrorRedirect()，完成这一处局部操作。
        this.authCodeListener?.handleErrorRedirect()
      }
      // 抛出 error，阻止服务层 index在无效状态下继续运行。
      throw error
    } finally {
      // Always cleanup
      // 调用 this.authCodeListener?.close()，完成这一处局部操作。
      this.authCodeListener?.close()
    }
  }

  // 服务层 index在这里处理 `private async waitForAuthorizationCode(`，完成这一小步状态转换。
  private async waitForAuthorizationCode(
    state: string,
    // 这个回调绑定到 onReady: () => Promise<void>,，负责服务层 index在该局部场景下的响应。
    onReady: () => Promise<void>,
  ): Promise<string> {
    // 返回 `new Promise((resolve, reject) => {`，作为服务层 index这次计算的结果。
    return new Promise((resolve, reject) => {
      // Set up manual auth code resolver
      // 更新实例字段 manualAuthCodeResolver 为 resolve，同步服务层 index的内部状态。
      this.manualAuthCodeResolver = resolve

      // Start automatic flow
      // 服务层 index在这里处理 `this.authCodeListener`，完成这一小步状态转换。
      this.authCodeListener
        ?.waitForAuthorization(state, onReady)
        // 链式调用 then，继续加工上一行在服务层 index中产生的数据。
        .then(authorizationCode => {
          // 更新实例字段 manualAuthCodeResolver 为 null，同步服务层 index的内部状态。
          this.manualAuthCodeResolver = null
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve(authorizationCode)
        })
        // 链式调用 catch，继续加工上一行在服务层 index中产生的数据。
        .catch(error => {
          // 更新实例字段 manualAuthCodeResolver 为 null，同步服务层 index的内部状态。
          this.manualAuthCodeResolver = null
          // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
          reject(error)
        })
    })
  }

  // Handle manual flow callback when user pastes the auth code
  // 调用 handleManualAuthCodeInput，触发服务层 index此处需要的副作用。
  handleManualAuthCodeInput(params: {
    authorizationCode: string
    state: string
  }): void {
    // 满足 `this.manualAuthCodeResolver` 时，服务层 index执行该分支。
    if (this.manualAuthCodeResolver) {
      // 调用 this.manualAuthCodeResolver，触发服务层 index此处需要的副作用。
      this.manualAuthCodeResolver(params.authorizationCode)
      // 更新实例字段 manualAuthCodeResolver 为 null，同步服务层 index的内部状态。
      this.manualAuthCodeResolver = null
      // Close the auth code listener since manual input was used
      // 调用 this.authCodeListener?.close()，完成这一处局部操作。
      this.authCodeListener?.close()
    }
  }

  // 服务层 index在这里处理 `private formatTokens(`，完成这一小步状态转换。
  private formatTokens(
    response: OAuthTokenExchangeResponse,
    subscriptionType: SubscriptionType | null,
    rateLimitTier: RateLimitTier | null,
    profile?: OAuthProfileResponse,
  ): OAuthTokens {
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + response.expires_in * 1000,
      scopes: client.parseScopes(response.scope),
      subscriptionType,
      rateLimitTier,
      profile,
      tokenAccount: response.account
        ? {
            uuid: response.account.uuid,
            emailAddress: response.account.email_address,
            organizationUuid: response.organization?.uuid,
          }
        : undefined,
    }
  }

  // Clean up any resources (like the local server)
  // cleanup 使用 无 完成服务层 index里的对应操作。
  cleanup(): void {
    // 调用 this.authCodeListener?.close()，完成这一处局部操作。
    this.authCodeListener?.close()
    // 更新实例字段 manualAuthCodeResolver 为 null，同步服务层 index的内部状态。
    this.manualAuthCodeResolver = null
  }
}

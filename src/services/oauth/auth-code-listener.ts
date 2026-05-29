// 类型依赖 { IncomingMessage, ServerResponse } 来自 http，用于校准服务层 auth code listener的数据契约。
import type { IncomingMessage, ServerResponse } from 'http'
// 引入 createServer、Server，将 http 中已经封装好的能力接到本文件流程里。
import { createServer, type Server } from 'http'
// 类型依赖 { AddressInfo } 来自 net，用于校准服务层 auth code listener的数据契约。
import type { AddressInfo } from 'net'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 引入 shouldUseClaudeAIAuth，将 ./client.js 中已经封装好的能力接到本文件流程里。
import { shouldUseClaudeAIAuth } from './client.js'

/**
 * Temporary localhost HTTP server that listens for OAuth authorization code redirects.
 *
 * When the user authorizes in their browser, the OAuth provider redirects to:
 * http://localhost:[port]/callback?code=AUTH_CODE&state=STATE
 *
 * This server captures that redirect and extracts the auth code.
 * Note: This is NOT an OAuth server - it's just a redirect capture mechanism.
 */
// AuthCodeListener 聚合服务层 auth code listener相关状态与操作，把同一职责的行为收束到类实例中。
export class AuthCodeListener {
  private localServer: Server
  private port: number = 0
  private promiseResolver: ((authorizationCode: string) => void) | null = null
  private promiseRejecter: ((error: Error) => void) | null = null
  private expectedState: string | null = null // State parameter for CSRF protection
  private pendingResponse: ServerResponse | null = null // Response object for final redirect
  private callbackPath: string // Configurable callback path

  // 构造函数接收 callbackPath: string = '/callback'，把外部输入整理成实例可复用的内部状态。
  constructor(callbackPath: string = '/callback') {
    // 更新实例字段 localServer 为 createServer()，同步服务层 auth code listener的内部状态。
    this.localServer = createServer()
    // 更新实例字段 callbackPath 为 callbackPath，同步服务层 auth code listener的内部状态。
    this.callbackPath = callbackPath
  }

  /**
   * Starts listening on an OS-assigned port and returns the port number.
   * This avoids race conditions by keeping the server open until it's used.
   * @param port Optional specific port to use. If not provided, uses OS-assigned port.
   */
  // start 使用 port?: number 完成服务层 auth code listener里的对应操作。
  async start(port?: number): Promise<number> {
    // 返回 `new Promise((resolve, reject) => {`，作为服务层 auth code listener这次计算的结果。
    return new Promise((resolve, reject) => {
      // 调用 this.localServer.once，触发服务层 auth code listener此处需要的副作用。
      this.localServer.once('error', err => {
        // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        reject(
          new Error(`Failed to start OAuth callback server: ${err.message}`),
        )
      })

      // Listen on specified port or 0 to let the OS assign an available port
      // 调用 this.localServer.listen，触发服务层 auth code listener此处需要的副作用。
      this.localServer.listen(port ?? 0, 'localhost', () => {
        // address 集合保存`localServer.address`，供服务层 auth code listener后续处理使用。
        const address = this.localServer.address() as AddressInfo
        // 更新实例字段 port 为 address.port，同步服务层 auth code listener的内部状态。
        this.port = address.port
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve(this.port)
      })
    })
  }

  // getPort不依赖额外参数，直接计算服务层 auth code listener需要的结果。
  getPort(): number {
    // 返回 `this.port`，作为服务层 auth code listener这次计算的结果。
    return this.port
  }

  // hasPendingResponse 用 无 判断服务层 auth code listener是否满足条件。
  hasPendingResponse(): boolean {
    // 返回 `this.pendingResponse !== null`，作为服务层 auth code listener这次计算的结果。
    return this.pendingResponse !== null
  }

  async waitForAuthorization(
    state: string,
    // 这个回调绑定到 onReady: () => Promise<void>,，负责服务层 auth code listener在该局部场景下的响应。
    onReady: () => Promise<void>,
  ): Promise<string> {
    // 返回 `new Promise<string>((resolve, reject) => {`，作为服务层 auth code listener这次计算的结果。
    return new Promise<string>((resolve, reject) => {
      // 更新实例字段 promiseResolver 为 resolve，同步服务层 auth code listener的内部状态。
      this.promiseResolver = resolve
      // 更新实例字段 promiseRejecter 为 reject，同步服务层 auth code listener的内部状态。
      this.promiseRejecter = reject
      // 更新实例字段 expectedState 为 state，同步服务层 auth code listener的内部状态。
      this.expectedState = state
      // 调用 this.startLocalListener，触发服务层 auth code listener此处需要的副作用。
      this.startLocalListener(onReady)
    })
  }

  /**
   * Completes the OAuth flow by redirecting the user's browser to a success page.
   * Different success pages are shown based on the granted scopes.
   * @param scopes The OAuth scopes that were granted
   * @param customHandler Optional custom handler to serve response instead of redirecting
   */
  // 调用 handleSuccessRedirect，触发服务层 auth code listener此处需要的副作用。
  handleSuccessRedirect(
    scopes: string[],
    // 这个回调绑定到 customHandler?: (res: ServerResponse, scopes: string[]) => void,，负责服务层 auth code listener在该局部场景下的响应。
    customHandler?: (res: ServerResponse, scopes: string[]) => void,
  ): void {
    // this.pendingResponse 响应数据缺失时提前走兜底路径，避免服务层 auth code listener继续依赖无效输入。
    if (!this.pendingResponse) return

    // If custom handler provided, use it instead of default redirect
    // 满足 `customHandler` 时，服务层 auth code listener执行该分支。
    if (customHandler) {
      // 调用 customHandler，触发服务层 auth code listener此处需要的副作用。
      customHandler(this.pendingResponse, scopes)
      // 更新实例字段 pendingResponse 为 null，同步服务层 auth code listener的内部状态。
      this.pendingResponse = null
      // 记录服务层 auth code listener运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_oauth_automatic_redirect', { custom_handler: true })
      // 服务层 auth code listener在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Default behavior: Choose success page based on granted permissions
    // successUrl保存`shouldUseClaudeAIAuth`，供服务层 auth code listener后续处理使用。
    const successUrl = shouldUseClaudeAIAuth(scopes)
      ? getOauthConfig().CLAUDEAI_SUCCESS_URL
      : getOauthConfig().CONSOLE_SUCCESS_URL

    // Send browser to success page
    // 调用 this.pendingResponse.writeHead，触发服务层 auth code listener此处需要的副作用。
    this.pendingResponse.writeHead(302, { Location: successUrl })
    // 调用 this.pendingResponse.end，触发服务层 auth code listener此处需要的副作用。
    this.pendingResponse.end()
    // 更新实例字段 pendingResponse 为 null，同步服务层 auth code listener的内部状态。
    this.pendingResponse = null

    // 记录服务层 auth code listener运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_automatic_redirect', {})
  }

  /**
   * Handles error case by sending a redirect to the appropriate success page with an error indicator,
   * ensuring the browser flow is completed properly.
   */
  // handleErrorRedirect 使用 无 完成服务层 auth code listener里的对应操作。
  handleErrorRedirect(): void {
    // this.pendingResponse 响应数据缺失时提前走兜底路径，避免服务层 auth code listener继续依赖无效输入。
    if (!this.pendingResponse) return

    // TODO: swap to a different url once we have an error page
    // errorUrl 错误信息读取`getOauthConfig`，供服务层 auth code listener后续处理使用。
    const errorUrl = getOauthConfig().CLAUDEAI_SUCCESS_URL

    // Send browser to error page
    // 调用 this.pendingResponse.writeHead，触发服务层 auth code listener此处需要的副作用。
    this.pendingResponse.writeHead(302, { Location: errorUrl })
    // 调用 this.pendingResponse.end，触发服务层 auth code listener此处需要的副作用。
    this.pendingResponse.end()
    // 更新实例字段 pendingResponse 为 null，同步服务层 auth code listener的内部状态。
    this.pendingResponse = null

    // 记录服务层 auth code listener运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_automatic_redirect_error', {})
  }

  // 这个回调绑定到 private startLocalListener(onReady: () => Promise<void>): void {，负责服务层 auth code listener在该局部场景下的响应。
  private startLocalListener(onReady: () => Promise<void>): void {
    // Server is already created and listening, just set up handlers
    // 调用 this.localServer.on，触发服务层 auth code listener此处需要的副作用。
    this.localServer.on('request', this.handleRedirect.bind(this))
    // 调用 this.localServer.on，触发服务层 auth code listener此处需要的副作用。
    this.localServer.on('error', this.handleError.bind(this))

    // Server is already listening, so we can call onReady immediately
    // 显式忽略 `onReady()` 的返回值，只保留它触发的副作用。
    void onReady()
  }

  // 服务层 auth code listener在这里处理 `private handleRedirect(req: IncomingMessage, res: ServerResponse): void...`，完成这一小步状态转换。
  private handleRedirect(req: IncomingMessage, res: ServerResponse): void {
    // parsedUrl保存`URL`，供服务层 auth code listener后续处理使用。
    const parsedUrl = new URL(
      req.url || '',
      `http://${req.headers.host || 'localhost'}`,
    )

    // `parsedUrl.pathname` 与 `this.callbackPath` 不一致时刷新派生状态，避免使用过期结果。
    if (parsedUrl.pathname !== this.callbackPath) {
      // 调用 res.writeHead，触发服务层 auth code listener此处需要的副作用。
      res.writeHead(404)
      // 调用 res.end，触发服务层 auth code listener此处需要的副作用。
      res.end()
      // 服务层 auth code listener在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // authCode读取`searchParams.get`，供服务层 auth code listener后续处理使用。
    const authCode = parsedUrl.searchParams.get('code') ?? undefined
    // 状态读取`searchParams.get`，供服务层 auth code listener后续处理使用。
    const state = parsedUrl.searchParams.get('state') ?? undefined

    // 调用 this.validateAndRespond，触发服务层 auth code listener此处需要的副作用。
    this.validateAndRespond(authCode, state, res)
  }

  // 服务层 auth code listener在这里处理 `private validateAndRespond(`，完成这一小步状态转换。
  private validateAndRespond(
    authCode: string | undefined,
    state: string | undefined,
    res: ServerResponse,
  ): void {
    // authCode缺失时提前走兜底路径，避免服务层 auth code listener继续依赖无效输入。
    if (!authCode) {
      // 调用 res.writeHead，触发服务层 auth code listener此处需要的副作用。
      res.writeHead(400)
      // 调用 res.end，触发服务层 auth code listener此处需要的副作用。
      res.end('Authorization code not found')
      // this.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
      this.reject(new Error('No authorization code received'))
      // 服务层 auth code listener在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // `state` 与 `this.expectedState` 不一致时刷新派生状态，避免使用过期结果。
    if (state !== this.expectedState) {
      // 调用 res.writeHead，触发服务层 auth code listener此处需要的副作用。
      res.writeHead(400)
      // 调用 res.end，触发服务层 auth code listener此处需要的副作用。
      res.end('Invalid state parameter')
      // this.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
      this.reject(new Error('Invalid state parameter'))
      // 服务层 auth code listener在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Store the response for later redirect
    // 更新实例字段 pendingResponse 为 res，同步服务层 auth code listener的内部状态。
    this.pendingResponse = res

    // this.resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
    this.resolve(authCode)
  }

  // 服务层 auth code listener在这里处理 `private handleError(err: Error): void {`，完成这一小步状态转换。
  private handleError(err: Error): void {
    // 记录服务层 auth code listener运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 调用 this.close，触发服务层 auth code listener此处需要的副作用。
    this.close()
    // this.reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
    this.reject(err)
  }

  // 服务层 auth code listener在这里处理 `private resolve(authorizationCode: string): void {`，完成这一小步状态转换。
  private resolve(authorizationCode: string): void {
    // 满足 `this.promiseResolver` 时，服务层 auth code listener执行该分支。
    if (this.promiseResolver) {
      // 调用 this.promiseResolver，触发服务层 auth code listener此处需要的副作用。
      this.promiseResolver(authorizationCode)
      // 更新实例字段 promiseResolver 为 null，同步服务层 auth code listener的内部状态。
      this.promiseResolver = null
      // 更新实例字段 promiseRejecter 为 null，同步服务层 auth code listener的内部状态。
      this.promiseRejecter = null
    }
  }

  // 服务层 auth code listener在这里处理 `private reject(error: Error): void {`，完成这一小步状态转换。
  private reject(error: Error): void {
    // 满足 `this.promiseRejecter` 时，服务层 auth code listener执行该分支。
    if (this.promiseRejecter) {
      // 调用 this.promiseRejecter，触发服务层 auth code listener此处需要的副作用。
      this.promiseRejecter(error)
      // 更新实例字段 promiseResolver 为 null，同步服务层 auth code listener的内部状态。
      this.promiseResolver = null
      // 更新实例字段 promiseRejecter 为 null，同步服务层 auth code listener的内部状态。
      this.promiseRejecter = null
    }
  }

  // close 使用 无 完成服务层 auth code listener里的对应操作。
  close(): void {
    // If we have a pending response, send a redirect before closing
    // 满足 `this.pendingResponse` 时，服务层 auth code listener执行该分支。
    if (this.pendingResponse) {
      // 调用 this.handleErrorRedirect，触发服务层 auth code listener此处需要的副作用。
      this.handleErrorRedirect()
    }

    // 满足 `this.localServer` 时，服务层 auth code listener执行该分支。
    if (this.localServer) {
      // Remove all listeners to prevent memory leaks
      // 调用 this.localServer.removeAllListeners，触发服务层 auth code listener此处需要的副作用。
      this.localServer.removeAllListeners()
      // 调用 this.localServer.close，触发服务层 auth code listener此处需要的副作用。
      this.localServer.close()
    }
  }
}

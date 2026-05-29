/**
 * `claude mcp xaa` — manage the XAA (SEP-990) IdP connection.
 *
 * The IdP connection is user-level: configure once, all XAA-enabled MCP
 * servers reuse it. Lives in settings.xaaIdp (non-secret) + a keychain slot
 * keyed by issuer (secret). Separate trust domain from per-server AS secrets.
 */
// 类型依赖 { Command } 来自 @commander-js/extra-typings，用于校准命令处理的数据契约。
import type { Command } from '@commander-js/extra-typings'
// 引入 cliError、cliOk，将 ../../cli/exit.js 中已经封装好的能力接到本文件流程里。
import { cliError, cliOk } from '../../cli/exit.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  acquireIdpIdToken,
  clearIdpClientSecret,
  clearIdpIdToken,
  getCachedIdpIdToken,
  getIdpClientSecret,
  getXaaIdpSettings,
  issuerKey,
  saveIdpClientSecret,
  saveIdpIdTokenFromJwt,
} from '../../services/mcp/xaaIdpLogin.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../../utils/settings/settings.js'

// registerMcpXaaIdpCommand 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerMcpXaaIdpCommand(mcp: Command): void {
  // xaaIdp保存`mcp`，供命令处理斜杠命令 xaa Idp Command后续判断或输出使用。
  const xaaIdp = mcp
    .command('xaa')
    .description('Manage the XAA (SEP-990) IdP connection')

  // 斜杠命令 xaa Idp Command在这里处理 `xaaIdp`，完成这一小步状态转换。
  xaaIdp
    .command('setup')
    .description(
      'Configure the IdP connection (one-time setup for all XAA-enabled servers)',
    )
    .requiredOption('--issuer <url>', 'IdP issuer URL (OIDC discovery)')
    .requiredOption('--client-id <id>', "Claude Code's client_id at the IdP")
    .option(
      '--client-secret',
      'Read IdP client secret from MCP_XAA_IDP_CLIENT_SECRET env var',
    )
    .option(
      '--callback-port <port>',
      'Fixed loopback callback port (only if IdP does not honor RFC 8252 port-any matching)',
    )
    // 链式调用 action，继续加工上一行在命令处理中产生的数据。
    .action(options => {
      // Validate everything BEFORE any writes. An exit(1) mid-write leaves
      // settings configured but keychain missing — confusing state.
      // updateSettingsForSource doesn't schema-check on write; a non-URL
      // issuer lands on disk and then poisons the whole userSettings source
      // on next launch (SettingsSchema .url() fails → parseSettingsFile
      // returns { settings: null }, dropping everything, not just xaaIdp).
      // issuerUrl 先占位，稍后的条件分支会根据实际输入补齐它。
      let issuerUrl: URL
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // issuerUrl更新为 `new URL(options.issuer)`，确保斜杠命令后续读取最新状态。
        issuerUrl = new URL(options.issuer)
      } catch {
        // 返回 `cliError(`，作为命令处理这次计算的结果。
        return cliError(
          `Error: --issuer must be a valid URL (got "${options.issuer}")`,
        )
      }
      // OIDC discovery + token exchange run against this host. Allow http://
      // only for loopback (conformance harness mock IdP); anything else leaks
      // the client secret and authorization code over plaintext.
      // 命令处理在这里按实际状态进入对应分支。
      if (
        issuerUrl.protocol !== 'https:' &&
        !(
          issuerUrl.protocol === 'http:' &&
          (issuerUrl.hostname === 'localhost' ||
            issuerUrl.hostname === '127.0.0.1' ||
            issuerUrl.hostname === '[::1]')
        )
      ) {
        // 返回 `cliError(`，作为命令处理这次计算的结果。
        return cliError(
          `Error: --issuer must use https:// (got "${issuerUrl.protocol}//${issuerUrl.host}")`,
        )
      }
      // callbackPort保存`options.callbackPort`，供命令处理斜杠命令 xaa Idp Command后续判断或输出使用。
      const callbackPort = options.callbackPort
        ? parseInt(options.callbackPort, 10)
        : undefined
      // callbackPort <= 0 fails Zod's .positive() on next launch — same
      // settings-poisoning failure mode as the issuer check above.
      // 命令处理在这里按实际状态进入对应分支。
      if (
        callbackPort !== undefined &&
        (!Number.isInteger(callbackPort) || callbackPort <= 0)
      ) {
        // 返回 `cliError('Error: --callback-port must be a positive integer')`，作为命令处理这次计算的结果。
        return cliError('Error: --callback-port must be a positive integer')
      }
      // secret保存`options.clientSecret`，供后续判断或组装使用。
      const secret = options.clientSecret
        ? process.env.MCP_XAA_IDP_CLIENT_SECRET
        : undefined
      // 只有 `options.clientSecret && !secret` 满足时，命令处理才执行该分支。
      if (options.clientSecret && !secret) {
        // 返回 `cliError(`，作为命令处理这次计算的结果。
        return cliError(
          'Error: --client-secret requires MCP_XAA_IDP_CLIENT_SECRET env var',
        )
      }

      // Read old config now (before settings overwrite) so we can clear stale
      // keychain slots after a successful write. `clear` can't do this after
      // the fact — it reads the *current* settings.xaaIdp, which by then is
      // the new one.
      // old读取`getXaaIdpSettings`，供命令处理后续处理使用。
      const old = getXaaIdpSettings()
      // oldIssuer 命名 `old?.issuer`，让后续代码直接表达这个值的用途。
      const oldIssuer = old?.issuer
      // oldClientId 命名 `old?.clientId`，让后续代码直接表达这个值的用途。
      const oldClientId = old?.clientId

      // callbackPort MUST be present (even as undefined) — mergeWith deep-merges
      // and only deletes on explicit `undefined`, not on absent key. A conditional
      // spread would leak a prior fixed port into a new IdP's config.
      // 从 `updateSettingsForSource('userSettings', {` 解构 error，减少斜杠命令 xaa Idp Command对同一对象的重复访问。
      const { error } = updateSettingsForSource('userSettings', {
        xaaIdp: {
          issuer: options.issuer,
          clientId: options.clientId,
          callbackPort,
        },
      })
      // 满足 `error` 时，命令处理执行该分支。
      if (error) {
        // 返回 `cliError(`Error writing settings: ${error.message}`)`，作为命令处理这次计算的结果。
        return cliError(`Error writing settings: ${error.message}`)
      }

      // Clear stale keychain slots only after settings write succeeded —
      // otherwise a write failure leaves settings pointing at oldIssuer with
      // its secret already gone. Compare via issuerKey(): trailing-slash or
      // host-case differences normalize to the same keychain slot.
      // 满足 `oldIssuer` 时，命令处理执行该分支。
      if (oldIssuer) {
        // `issuerKey(oldIssuer)` 与 `issuerKey(options.issuer)` 不一致时刷新派生状态，避免使用过期结果。
        if (issuerKey(oldIssuer) !== issuerKey(options.issuer)) {
          // 调用 clearIdpIdToken，触发命令处理此处需要的副作用。
          clearIdpIdToken(oldIssuer)
          // 调用 clearIdpClientSecret，触发命令处理此处需要的副作用。
          clearIdpClientSecret(oldIssuer)
        // 斜杠命令 xaa Idp Command在这里处理 `} else if (oldClientId !== options.clientId) {`，完成这一小步状态转换。
        } else if (oldClientId !== options.clientId) {
          // Same issuer slot but different OAuth client registration — the
          // cached id_token's aud claim and the stored secret are both for the
          // old client. `xaa login` would send {new clientId, old secret} and
          // fail with opaque `invalid_client`; downstream SEP-990 exchange
          // would fail aud validation. Keep both when clientId is unchanged:
          // re-setup without --client-secret means "tweak port, keep secret".
          // 调用 clearIdpIdToken，触发命令处理此处需要的副作用。
          clearIdpIdToken(oldIssuer)
          // 调用 clearIdpClientSecret，触发命令处理此处需要的副作用。
          clearIdpClientSecret(oldIssuer)
        }
      }

      // 满足 `secret` 时，命令处理执行该分支。
      if (secret) {
        // 从 `saveIdpClientSecret(options.issuer, secret)` 解构 success、warning，减少斜杠命令 xaa Idp Command对同一对象的重复访问。
        const { success, warning } = saveIdpClientSecret(options.issuer, secret)
        // success 集合缺失时直接走兜底路径，避免命令处理使用无效输入。
        if (!success) {
          // 返回 `cliError(`，作为命令处理这次计算的结果。
          return cliError(
            `Error: settings written but keychain save failed${warning ? ` — ${warning}` : ''}. ` +
              `Re-run with --client-secret once keychain is available.`,
          )
        }
      }

      // 调用 cliOk，触发命令处理此处需要的副作用。
      cliOk(`XAA IdP connection configured for ${options.issuer}`)
    })

  // 斜杠命令 xaa Idp Command在这里处理 `xaaIdp`，完成这一小步状态转换。
  xaaIdp
    .command('login')
    .description(
      'Cache an IdP id_token so XAA-enabled MCP servers authenticate ' +
        'silently. Default: run the OIDC browser login. With --id-token: ' +
        'write a pre-obtained JWT directly (used by conformance/e2e tests ' +
        'where the mock IdP does not serve /authorize).',
    )
    .option(
      '--force',
      'Ignore any cached id_token and re-login (useful after IdP-side revocation)',
    )
    // TODO(paulc): read the JWT from stdin instead of argv to keep it out of
    // shell history. Fine for conformance (docker exec uses argv directly,
    // no shell parser), but a real user would want `echo $TOKEN | ... --stdin`.
    .option(
      '--id-token <jwt>',
      'Write this pre-obtained id_token directly to cache, skipping the OIDC browser login',
    )
    // 链式调用 action，继续加工上一行在命令处理中产生的数据。
    .action(async options => {
      // idp读取`getXaaIdpSettings`，供命令处理后续处理使用。
      const idp = getXaaIdpSettings()
      // idp缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!idp) {
        // 返回 `cliError(`，作为命令处理这次计算的结果。
        return cliError(
          "Error: no XAA IdP connection. Run 'claude mcp xaa setup' first.",
        )
      }

      // Direct-inject path: skip cache check, skip OIDC. Writing IS the
      // operation. Issuer comes from settings (single source of truth), not
      // a separate flag — one less thing to desync.
      // 满足 `options.idToken` 时，命令处理执行该分支。
      if (options.idToken) {
        // expiresAt保存`saveIdpIdTokenFromJwt`，供命令处理后续处理使用。
        const expiresAt = saveIdpIdTokenFromJwt(idp.issuer, options.idToken)
        // 返回 `cliOk(`，作为命令处理这次计算的结果。
        return cliOk(
          `id_token cached for ${idp.issuer} (expires ${new Date(expiresAt).toISOString()})`,
        )
      }

      // 满足 `options.force` 时，命令处理执行该分支。
      if (options.force) {
        // 调用 clearIdpIdToken，触发命令处理此处需要的副作用。
        clearIdpIdToken(idp.issuer)
      }

      // wasCached 缓存读取`getCachedIdpIdToken`，供命令处理后续处理使用。
      const wasCached = getCachedIdpIdToken(idp.issuer) !== undefined
      // 满足 `wasCached` 时，命令处理执行该分支。
      if (wasCached) {
        // 返回 `cliOk(`，作为命令处理这次计算的结果。
        return cliOk(
          `Already logged in to ${idp.issuer} (cached id_token still valid). Use --force to re-login.`,
        )
      }

      // 向标准输出写入命令处理要展示给用户的文本。
      process.stdout.write(`Opening browser for IdP login at ${idp.issuer}…\n`)
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `acquireIdpIdToken({` 完成，再继续斜杠命令 xaa Idp Command的异步流程。
        await acquireIdpIdToken({
          idpIssuer: idp.issuer,
          idpClientId: idp.clientId,
          idpClientSecret: getIdpClientSecret(idp.issuer),
          callbackPort: idp.callbackPort,
          // 这个回调绑定到 onAuthorizationUrl: url => {，负责命令处理在该局部场景下的响应。
          onAuthorizationUrl: url => {
            // 向标准输出写入命令处理要展示给用户的文本。
            process.stdout.write(
              `If the browser did not open, visit:\n  ${url}\n`,
            )
          },
        })
        // 调用 cliOk，触发命令处理此处需要的副作用。
        cliOk(
          `Logged in. MCP servers with --xaa will now authenticate silently.`,
        )
      } catch (e) {
        // 调用 cliError，触发命令处理此处需要的副作用。
        cliError(`IdP login failed: ${errorMessage(e)}`)
      }
    })

  // 斜杠命令 xaa Idp Command在这里处理 `xaaIdp`，完成这一小步状态转换。
  xaaIdp
    .command('show')
    .description('Show the current IdP connection config')
    // 链式调用 action，继续加工上一行在命令处理中产生的数据。
    .action(() => {
      // idp读取`getXaaIdpSettings`，供命令处理后续处理使用。
      const idp = getXaaIdpSettings()
      // idp缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!idp) {
        // 返回 `cliOk('No XAA IdP connection configured.')`，作为命令处理这次计算的结果。
        return cliOk('No XAA IdP connection configured.')
      }
      // hasSecret记录 `getIdpClientSecret` 是否成立，命令处理随后按该结果分支。
      const hasSecret = getIdpClientSecret(idp.issuer) !== undefined
      // hasIdToken记录 `getCachedIdpIdToken` 是否成立，命令处理随后按该结果分支。
      const hasIdToken = getCachedIdpIdToken(idp.issuer) !== undefined
      // 向标准输出写入命令处理要展示给用户的文本。
      process.stdout.write(`Issuer:        ${idp.issuer}\n`)
      // 向标准输出写入命令处理要展示给用户的文本。
      process.stdout.write(`Client ID:     ${idp.clientId}\n`)
      // `idp.callbackPort` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (idp.callbackPort !== undefined) {
        // 向标准输出写入命令处理要展示给用户的文本。
        process.stdout.write(`Callback port: ${idp.callbackPort}\n`)
      }
      // 向标准输出写入命令处理要展示给用户的文本。
      process.stdout.write(
        `Client secret: ${hasSecret ? '(stored in keychain)' : '(not set — PKCE-only)'}\n`,
      )
      // 向标准输出写入命令处理要展示给用户的文本。
      process.stdout.write(
        `Logged in:     ${hasIdToken ? 'yes (id_token cached)' : "no — run 'claude mcp xaa login'"}\n`,
      )
      // 调用 cliOk，触发命令处理此处需要的副作用。
      cliOk()
    })

  // 斜杠命令 xaa Idp Command在这里处理 `xaaIdp`，完成这一小步状态转换。
  xaaIdp
    .command('clear')
    .description('Clear the IdP connection config and cached id_token')
    // 链式调用 action，继续加工上一行在命令处理中产生的数据。
    .action(() => {
      // Read issuer first so we can clear the right keychain slots.
      // idp读取`getXaaIdpSettings`，供命令处理后续处理使用。
      const idp = getXaaIdpSettings()
      // updateSettingsForSource uses mergeWith: set to undefined (not delete)
      // to signal key removal.
      // 从 `updateSettingsForSource('userSettings', {` 解构 error，减少斜杠命令 xaa Idp Command对同一对象的重复访问。
      const { error } = updateSettingsForSource('userSettings', {
        xaaIdp: undefined,
      })
      // 满足 `error` 时，命令处理执行该分支。
      if (error) {
        // 返回 `cliError(`Error writing settings: ${error.message}`)`，作为命令处理这次计算的结果。
        return cliError(`Error writing settings: ${error.message}`)
      }
      // Clear keychain only after settings write succeeded — otherwise a
      // write failure leaves settings pointing at the IdP with its secrets
      // already gone (same pattern as `setup`'s old-issuer cleanup).
      // 满足 `idp` 时，命令处理执行该分支。
      if (idp) {
        // 调用 clearIdpIdToken，触发命令处理此处需要的副作用。
        clearIdpIdToken(idp.issuer)
        // 调用 clearIdpClientSecret，触发命令处理此处需要的副作用。
        clearIdpClientSecret(idp.issuer)
      }
      // 调用 cliOk，触发命令处理此处需要的副作用。
      cliOk('XAA IdP connection cleared')
    })
}

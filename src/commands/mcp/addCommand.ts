/**
 * MCP add CLI subcommand
 *
 * Extracted from main.tsx to enable direct testing.
 */
// 引入 Command、Option，将 @commander-js/extra-typings 中已经封装好的能力接到本文件流程里。
import { type Command, Option } from '@commander-js/extra-typings'
// 引入 cliError、cliOk，将 ../../cli/exit.js 中已经封装好的能力接到本文件流程里。
import { cliError, cliOk } from '../../cli/exit.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  readClientSecret,
  saveMcpClientSecret,
} from '../../services/mcp/auth.js'
// 接入 addMcpConfig 服务层能力，把外部通信或共享状态交给 ../../services/mcp/config.js 处理。
import { addMcpConfig } from '../../services/mcp/config.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  describeMcpConfigFilePath,
  ensureConfigScope,
  ensureTransport,
  parseHeaders,
} from '../../services/mcp/utils.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getXaaIdpSettings,
  isXaaEnabled,
} from '../../services/mcp/xaaIdpLogin.js'
// 复用 parseEnvVars 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { parseEnvVars } from '../../utils/envUtils.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'

/**
 * Registers the `mcp add` subcommand on the given Commander command.
 */
// registerMcpAddCommand 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerMcpAddCommand(mcp: Command): void {
  // 斜杠命令 add Command在这里处理 `mcp`，完成这一小步状态转换。
  mcp
    .command('add <name> <commandOrUrl> [args...]')
    .description(
      'Add an MCP server to Claude Code.\n\n' +
        'Examples:\n' +
        '  # Add HTTP server:\n' +
        '  claude mcp add --transport http sentry https://mcp.sentry.dev/mcp\n\n' +
        '  # Add HTTP server with headers:\n' +
        '  claude mcp add --transport http corridor https://app.corridor.dev/api/mcp --header "Authorization: Bearer ..."\n\n' +
        '  # Add stdio server with environment variables:\n' +
        '  claude mcp add -e API_KEY=xxx my-server -- npx my-mcp-server\n\n' +
        '  # Add stdio server with subprocess flags:\n' +
        '  claude mcp add my-server -- my-command --some-flag arg1',
    )
    .option(
      '-s, --scope <scope>',
      'Configuration scope (local, user, or project)',
      'local',
    )
    .option(
      '-t, --transport <transport>',
      'Transport type (stdio, sse, http). Defaults to stdio if not specified.',
    )
    .option(
      '-e, --env <env...>',
      'Set environment variables (e.g. -e KEY=value)',
    )
    .option(
      '-H, --header <header...>',
      'Set WebSocket headers (e.g. -H "X-Api-Key: abc123" -H "X-Custom: value")',
    )
    .option('--client-id <clientId>', 'OAuth client ID for HTTP/SSE servers')
    .option(
      '--client-secret',
      'Prompt for OAuth client secret (or set MCP_CLIENT_SECRET env var)',
    )
    .option(
      '--callback-port <port>',
      'Fixed port for OAuth callback (for servers requiring pre-registered redirect URIs)',
    )
    .helpOption('-h, --help', 'Display help for command')
    .addOption(
      new Option(
        '--xaa',
        "Enable XAA (SEP-990) for this server. Requires 'claude mcp xaa setup' first. Also requires --client-id and --client-secret (for the MCP server's AS).",
      ).hideHelp(!isXaaEnabled()),
    )
    // 链式调用 action，继续加工上一行在命令处理中产生的数据。
    .action(async (name, commandOrUrl, args, options) => {
      // Commander.js handles -- natively: it consumes -- and everything after becomes args
      // actualCommand 命令数据 命名 `commandOrUrl`，让后续代码直接表达这个值的用途。
      const actualCommand = commandOrUrl
      // actualArgs 集合保存`args`，供后续判断或组装使用。
      const actualArgs = args

      // If no name is provided, error
      // 名称缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!name) {
        // 调用 cliError，触发命令处理此处需要的副作用。
        cliError(
          'Error: Server name is required.\n' +
            'Usage: claude mcp add <name> <command> [args...]',
        )
      // 斜杠命令 add Command在这里处理 `} else if (!actualCommand) {`，完成这一小步状态转换。
      } else if (!actualCommand) {
        // 调用 cliError，触发命令处理此处需要的副作用。
        cliError(
          'Error: Command is required when server name is provided.\n' +
            'Usage: claude mcp add <name> <command> [args...]',
        )
      }

      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // scope保存`ensureConfigScope`，供命令处理后续处理使用。
        const scope = ensureConfigScope(options.scope)
        // transport保存`ensureTransport`，供命令处理后续处理使用。
        const transport = ensureTransport(options.transport)

        // XAA fail-fast: validate at add-time, not auth-time.
        // 只有 `options.xaa && !isXaaEnabled()` 满足时，命令处理才执行该分支。
        if (options.xaa && !isXaaEnabled()) {
          // 调用 cliError，触发命令处理此处需要的副作用。
          cliError(
            'Error: --xaa requires CLAUDE_CODE_ENABLE_XAA=1 in your environment',
          )
        }
        // xaa保存`Boolean`，供命令处理后续处理使用。
        const xaa = Boolean(options.xaa)
        // 满足 `xaa` 时，命令处理执行该分支。
        if (xaa) {
          // missing 从空数组开始收集，后续循环会按处理顺序追加条目。
          const missing: string[] = []
          // 满足 `!options.clientId) missing.push('--client-id'` 时，命令处理执行该分支。
          if (!options.clientId) missing.push('--client-id')
          // 满足 `!options.clientSecret) missing.push('--client-secret'` 时，命令处理执行该分支。
          if (!options.clientSecret) missing.push('--client-secret')
          // 满足 `!getXaaIdpSettings()` 时，命令处理执行该分支。
          if (!getXaaIdpSettings()) {
            // missing追加新条目，保持收集顺序与输入顺序一致。
            missing.push(
              "'claude mcp xaa setup' (settings.xaaIdp not configured)",
            )
          }
          // 满足 `missing.length` 时，命令处理执行该分支。
          if (missing.length) {
            // 调用 cliError，触发命令处理此处需要的副作用。
            cliError(`Error: --xaa requires: ${missing.join(', ')}`)
          }
        }

        // Check if transport was explicitly provided
        // transportExplicit标记命令处理斜杠命令 add Command是否启用对应路径。
        const transportExplicit = options.transport !== undefined

        // Check if the command looks like a URL (likely incorrect usage)
        // looksLikeUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const looksLikeUrl =
          actualCommand.startsWith('http://') ||
          actualCommand.startsWith('https://') ||
          actualCommand.startsWith('localhost') ||
          actualCommand.endsWith('/sse') ||
          actualCommand.endsWith('/mcp')

        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_mcp_add', {
          type: transport as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          scope:
            scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          source:
            'command' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          transport:
            transport as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          transportExplicit: transportExplicit,
          looksLikeUrl: looksLikeUrl,
        })

        // 当 `transport` 匹配 `'sse'` 时，命令处理执行对应分支。
        if (transport === 'sse') {
          // actualCommand 命令数据缺失时直接走兜底路径，避免命令处理使用无效输入。
          if (!actualCommand) {
            // 调用 cliError，触发命令处理此处需要的副作用。
            cliError('Error: URL is required for SSE transport.')
          }

          // 请求头保存`options.header`，供后续判断或组装使用。
          const headers = options.header
            ? parseHeaders(options.header)
            : undefined

          // callbackPort 命名 `options.callbackPort`，让后续代码直接表达这个值的用途。
          const callbackPort = options.callbackPort
            ? parseInt(options.callbackPort, 10)
            : undefined
          // oauth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const oauth =
            options.clientId || callbackPort || xaa
              ? {
                  ...(options.clientId ? { clientId: options.clientId } : {}),
                  ...(callbackPort ? { callbackPort } : {}),
                  ...(xaa ? { xaa: true } : {}),
                }
              : undefined

          // clientSecret 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const clientSecret =
            options.clientSecret && options.clientId
              ? await readClientSecret()
              : undefined

          // serverConfig 配置 集中保存命令处理斜杠命令 add Command要一起传递的字段。
          const serverConfig = {
            type: 'sse' as const,
            url: actualCommand,
            headers,
            oauth,
          }
          // 等待 `addMcpConfig(name, serverConfig, scope)` 完成，再继续斜杠命令 add Command的异步流程。
          await addMcpConfig(name, serverConfig, scope)

          // 满足 `clientSecret` 时，命令处理执行该分支。
          if (clientSecret) {
            // 调用 saveMcpClientSecret，触发命令处理此处需要的副作用。
            saveMcpClientSecret(name, serverConfig, clientSecret)
          }

          // 向标准输出写入命令处理要展示给用户的文本。
          process.stdout.write(
            `Added SSE MCP server ${name} with URL: ${actualCommand} to ${scope} config\n`,
          )
          // 满足 `headers` 时，命令处理执行该分支。
          if (headers) {
            // 向标准输出写入命令处理要展示给用户的文本。
            process.stdout.write(
              `Headers: ${jsonStringify(headers, null, 2)}\n`,
            )
          }
        // 斜杠命令 add Command在这里处理 `} else if (transport === 'http') {`，完成这一小步状态转换。
        } else if (transport === 'http') {
          // actualCommand 命令数据缺失时直接走兜底路径，避免命令处理使用无效输入。
          if (!actualCommand) {
            // 调用 cliError，触发命令处理此处需要的副作用。
            cliError('Error: URL is required for HTTP transport.')
          }

          // 请求头保存`options.header`，供后续判断或组装使用。
          const headers = options.header
            ? parseHeaders(options.header)
            : undefined

          // callbackPort 命名 `options.callbackPort`，让后续代码直接表达这个值的用途。
          const callbackPort = options.callbackPort
            ? parseInt(options.callbackPort, 10)
            : undefined
          // oauth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const oauth =
            options.clientId || callbackPort || xaa
              ? {
                  ...(options.clientId ? { clientId: options.clientId } : {}),
                  ...(callbackPort ? { callbackPort } : {}),
                  ...(xaa ? { xaa: true } : {}),
                }
              : undefined

          // clientSecret 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const clientSecret =
            options.clientSecret && options.clientId
              ? await readClientSecret()
              : undefined

          // serverConfig 配置 集中保存命令处理斜杠命令 add Command要一起传递的字段。
          const serverConfig = {
            type: 'http' as const,
            url: actualCommand,
            headers,
            oauth,
          }
          // 等待 `addMcpConfig(name, serverConfig, scope)` 完成，再继续斜杠命令 add Command的异步流程。
          await addMcpConfig(name, serverConfig, scope)

          // 满足 `clientSecret` 时，命令处理执行该分支。
          if (clientSecret) {
            // 调用 saveMcpClientSecret，触发命令处理此处需要的副作用。
            saveMcpClientSecret(name, serverConfig, clientSecret)
          }

          // 向标准输出写入命令处理要展示给用户的文本。
          process.stdout.write(
            `Added HTTP MCP server ${name} with URL: ${actualCommand} to ${scope} config\n`,
          )
          // 满足 `headers` 时，命令处理执行该分支。
          if (headers) {
            // 向标准输出写入命令处理要展示给用户的文本。
            process.stdout.write(
              `Headers: ${jsonStringify(headers, null, 2)}\n`,
            )
          }
        } else {
          // 命令处理在这里按实际状态进入对应分支。
          if (
            options.clientId ||
            options.clientSecret ||
            options.callbackPort ||
            options.xaa
          ) {
            // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
            process.stderr.write(
              `Warning: --client-id, --client-secret, --callback-port, and --xaa are only supported for HTTP/SSE transports and will be ignored for stdio.\n`,
            )
          }

          // Warn if this looks like a URL but transport wasn't explicitly specified
          // 只有 `!transportExplicit && looksLikeUrl` 满足时，命令处理才执行该分支。
          if (!transportExplicit && looksLikeUrl) {
            // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
            process.stderr.write(
              `\nWarning: The command "${actualCommand}" looks like a URL, but is being interpreted as a stdio server as --transport was not specified.\n`,
            )
            // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
            process.stderr.write(
              `If this is an HTTP server, use: claude mcp add --transport http ${name} ${actualCommand}\n`,
            )
            // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
            process.stderr.write(
              `If this is an SSE server, use: claude mcp add --transport sse ${name} ${actualCommand}\n`,
            )
          }

          // env解析`parseEnvVars`，供命令处理后续处理使用。
          const env = parseEnvVars(options.env)
          // 等待 `addMcpConfig(` 完成，再继续斜杠命令 add Command的异步流程。
          await addMcpConfig(
            name,
            { type: 'stdio', command: actualCommand, args: actualArgs, env },
            scope,
          )

          // 向标准输出写入命令处理要展示给用户的文本。
          process.stdout.write(
            `Added stdio MCP server ${name} with command: ${actualCommand} ${actualArgs.join(' ')} to ${scope} config\n`,
          )
        }
        // 调用 cliOk，触发命令处理此处需要的副作用。
        cliOk(`File modified: ${describeMcpConfigFilePath(scope)}`)
      } catch (error) {
        // 调用 cliError，触发命令处理此处需要的副作用。
        cliError((error as Error).message)
      }
    })
}

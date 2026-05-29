// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  buildComputerUseTools,
  createComputerUseMcpServer,
} from '@ant/computer-use-mcp'
// 引入 StdioServerTransport，将 @modelcontextprotocol/sdk/server/stdio.js 中已经封装好的能力接到本文件流程里。
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
// 引入 ListToolsRequestSchema，将 @modelcontextprotocol/sdk/types.js 中已经封装好的能力接到本文件流程里。
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'

// 接入 shutdownDatadog 服务层能力，把外部通信或共享状态交给 ../../services/analytics/datadog.js 处理。
import { shutdownDatadog } from '../../services/analytics/datadog.js'
// 接入 shutdown1PEventLogging 服务层能力，把外部通信或共享状态交给 ../../services/analytics/firstPartyEventLogger.js 处理。
import { shutdown1PEventLogging } from '../../services/analytics/firstPartyEventLogger.js'
// 接入 initializeAnalyticsSink 服务层能力，把外部通信或共享状态交给 ../../services/analytics/sink.js 处理。
import { initializeAnalyticsSink } from '../../services/analytics/sink.js'
// 引入 enableConfigs，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { enableConfigs } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 filterAppsForDescription，将 ./appNames.js 中已经封装好的能力接到本文件流程里。
import { filterAppsForDescription } from './appNames.js'
// 引入 getChicagoCoordinateMode，将 ./gates.js 中已经封装好的能力接到本文件流程里。
import { getChicagoCoordinateMode } from './gates.js'
// 引入 getComputerUseHostAdapter，将 ./hostAdapter.js 中已经封装好的能力接到本文件流程里。
import { getComputerUseHostAdapter } from './hostAdapter.js'

// APP_ENUM_TIMEOUT_MS 集合 命名 `1000`，让后续代码直接表达这个值的用途。
const APP_ENUM_TIMEOUT_MS = 1000

/**
 * Enumerate installed apps, timed. Fails soft — if Spotlight is slow or
 * claude-swift throws, the tool description just omits the list. Resolution
 * happens at call time regardless; the model just doesn't get hints.
 */
// tryGetInstalledAppNames 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryGetInstalledAppNames(): Promise<string[] | undefined> {
  // adapter读取`getComputerUseHostAdapter`，供共享工具后续处理使用。
  const adapter = getComputerUseHostAdapter()
  // enumP保存`executor.listInstalledApps`，供共享工具后续处理使用。
  const enumP = adapter.executor.listInstalledApps()
  // timer 先占位，稍后的条件分支会根据实际输入补齐它。
  let timer: ReturnType<typeof setTimeout> | undefined
  // timeoutP封装成回调，供共享工具 mcp Server在事件触发或异步步骤中调用。
  const timeoutP = new Promise<undefined>(resolve => {
    // timer更新为 `setTimeout(resolve, APP_ENUM_TIMEOUT_MS, undefined)`，确保共享工具后续读取最新状态。
    timer = setTimeout(resolve, APP_ENUM_TIMEOUT_MS, undefined)
  })
  // installed保存`Promise.race`，供共享工具后续处理使用。
  const installed = await Promise.race([enumP, timeoutP])
    // 链式调用 catch，继续加工上一行在共享工具中产生的数据。
    .catch(() => undefined)
    // 链式调用 finally，继续加工上一行在共享工具中产生的数据。
    .finally(() => clearTimeout(timer))
  // installed缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!installed) {
    // The enumeration continues in the background — swallow late rejections.
    // 这个回调绑定到 void enumP.catch(() => {})，负责共享工具在该局部场景下的响应。
    void enumP.catch(() => {})
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Computer Use MCP] app enumeration exceeded ${APP_ENUM_TIMEOUT_MS}ms or failed; tool description omits list`,
    )
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 返回 `filterAppsForDescription(installed, homedir())`，作为共享工具这次计算的结果。
  return filterAppsForDescription(installed, homedir())
}

/**
 * Construct the in-process server. Delegates to the package's
 * `createComputerUseMcpServer` for the Server object + stub CallTool handler,
 * then REPLACES the ListTools handler with one that includes installed-app
 * names in the `request_access` description (the package's factory doesn't
 * take `installedAppNames`, and Cowork builds its own tool array in
 * serverDef.ts for the same reason).
 *
 * Async so the 1s app-enumeration timeout doesn't block startup — called from
 * an `await import()` in `client.ts` on first CU connection, not `main.tsx`.
 *
 * Real dispatch still goes through `wrapper.tsx`'s `.call()` override; this
 * server exists only to answer ListTools.
 */
// createComputerUseMcpServerForCli 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createComputerUseMcpServerForCli(): Promise<
  ReturnType<typeof createComputerUseMcpServer>
> {
  // adapter读取`getComputerUseHostAdapter`，供共享工具后续处理使用。
  const adapter = getComputerUseHostAdapter()
  // coordinateMode读取`getChicagoCoordinateMode`，供共享工具后续处理使用。
  const coordinateMode = getChicagoCoordinateMode()
  // server构建`createComputerUseMcpServer`，供共享工具后续处理使用。
  const server = createComputerUseMcpServer(adapter, coordinateMode)

  // installedAppNames 集合保存`tryGetInstalledAppNames`，供共享工具后续处理使用。
  const installedAppNames = await tryGetInstalledAppNames()
  // tools 集合构建`buildComputerUseTools`，供共享工具后续处理使用。
  const tools = buildComputerUseTools(
    adapter.executor.capabilities,
    coordinateMode,
    installedAppNames,
  )
  // server.setRequestHandler 写入新的状态值，使共享工具后续读取保持一致。
  server.setRequestHandler(ListToolsRequestSchema, async () =>
    adapter.isDisabled() ? { tools: [] } : { tools },
  )

  // 返回 `server`，作为共享工具这次计算的结果。
  return server
}

/**
 * Subprocess entrypoint for `--computer-use-mcp`. Mirror of
 * `runClaudeInChromeMcpServer` — stdio transport, exit on stdin close,
 * flush analytics before exit.
 */
// runComputerUseMcpServer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runComputerUseMcpServer(): Promise<void> {
  // 调用 enableConfigs，触发共享工具此处需要的副作用。
  enableConfigs()
  // 调用 initializeAnalyticsSink，触发共享工具此处需要的副作用。
  initializeAnalyticsSink()

  // server构建`createComputerUseMcpServerForCli`，供共享工具后续处理使用。
  const server = await createComputerUseMcpServerForCli()
  // transport保存`StdioServerTransport`，供共享工具后续处理使用。
  const transport = new StdioServerTransport()

  // exiting标记共享工具 mcp Server是否启用对应路径。
  let exiting = false
  // shutdownAndExit保存`async`，供共享工具后续处理使用。
  const shutdownAndExit = async (): Promise<void> => {
    // 满足 `exiting` 时，共享工具执行该分支。
    if (exiting) return
    // exiting更新为 `true`，确保共享工具后续读取最新状态。
    exiting = true
    // 等待 `Promise.all([shutdown1PEventLogging(), shutdownDatadog()])` 完成，再继续共享工具 mcp Server的异步流程。
    await Promise.all([shutdown1PEventLogging(), shutdownDatadog()])
    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发共享工具此处需要的副作用。
    process.exit(0)
  }
  // 调用 process.stdin.on，触发共享工具此处需要的副作用。
  process.stdin.on('end', () => void shutdownAndExit())
  // 调用 process.stdin.on，触发共享工具此处需要的副作用。
  process.stdin.on('error', () => void shutdownAndExit())

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[Computer Use MCP] Starting MCP server')
  // 等待 `server.connect(transport)` 完成，再继续共享工具 mcp Server的异步流程。
  await server.connect(transport)
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[Computer Use MCP] MCP server started')
}

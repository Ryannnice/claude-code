// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 引入 toString as qrToString，将 qrcode 中已经封装好的能力接到本文件流程里。
import { toString as qrToString } from 'qrcode'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  BRIDGE_FAILED_INDICATOR,
  BRIDGE_READY_INDICATOR,
  BRIDGE_SPINNER_FRAMES,
} from '../constants/figures.js'
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  buildActiveFooterText,
  buildBridgeConnectUrl,
  buildBridgeSessionUrl,
  buildIdleFooterText,
  FAILED_FOOTER_TEXT,
  formatDuration,
  type StatusState,
  TOOL_DISPLAY_EXPIRY_MS,
  timestamp,
  truncatePrompt,
  wrapWithOsc8Link,
} from './bridgeStatusUtil.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import type {
  BridgeConfig,
  BridgeLogger,
  SessionActivity,
  SpawnMode,
} from './types.js'

// QR_OPTIONS 集合 集中保存远程桥接会话远程桥接 bridge UI要一起传递的字段。
const QR_OPTIONS = {
  type: 'utf8' as const,
  errorCorrectionLevel: 'L' as const,
  small: true,
}

/** Generate a QR code and return its lines. */
// generateQr 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function generateQr(url: string): Promise<string[]> {
  // qr保存`qrToString`，供远程桥接会话后续处理使用。
  const qr = await qrToString(url, QR_OPTIONS)
  // 返回 `qr.split('\n').filter((line: string) => line.length > 0)`，作为远程桥接会话这次计算的结果。
  return qr.split('\n').filter((line: string) => line.length > 0)
}

// createBridgeLogger 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createBridgeLogger(options: {
  verbose: boolean
  write?: (s: string) => void
}): BridgeLogger {
  // write保存`stdout.write`，供远程桥接会话后续处理使用。
  const write = options.write ?? ((s: string) => process.stdout.write(s))
  // verbose 命名 `options.verbose`，让后续代码直接表达这个值的用途。
  const verbose = options.verbose

  // Track how many status lines are currently displayed at the bottom
  // statusLineCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let statusLineCount = 0

  // Status state machine
  // currentState 状态固定为 `'idle'`，作为远程桥接 bridge UI后续展示或比较的基准。
  let currentState: StatusState = 'idle'
  // currentStateText 状态保存`'Ready'`，作为后续固定文本处理的输入。
  let currentStateText = 'Ready'
  // repoName固定为 `''`，作为远程桥接会话远程桥接 bridge UI后续展示或比较的基准。
  let repoName = ''
  // branch固定为 `''`，作为远程桥接会话远程桥接 bridge UI后续展示或比较的基准。
  let branch = ''
  // debugLogPath 路径数据 命名 `''`，让后续代码直接表达这个值的用途。
  let debugLogPath = ''

  // Connect URL (built in printBanner with correct base for staging/prod)
  // connectUrl固定为 `''`，作为远程桥接会话远程桥接 bridge UI后续展示或比较的基准。
  let connectUrl = ''
  // cachedIngressUrl 缓存 命名 `''`，让后续代码直接表达这个值的用途。
  let cachedIngressUrl = ''
  // cachedEnvironmentId 缓存保存`''`，作为后续固定文本处理的输入。
  let cachedEnvironmentId = ''
  // activeSessionUrl 会话数据 命名 `null`，让后续代码直接表达这个值的用途。
  let activeSessionUrl: string | null = null

  // QR code lines for the current URL
  // qrLines 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let qrLines: string[] = []
  // qrVisible标记远程桥接会话远程桥接 bridge UI是否启用对应路径。
  let qrVisible = false

  // Tool activity for the second status line
  // lastToolSummary初始化为空值，后续分支会在有数据时补齐。
  let lastToolSummary: string | null = null
  // lastToolTime保存`0`，供远程桥接会话远程桥接 bridge UI后续判断或输出使用。
  let lastToolTime = 0

  // Session count indicator (shown when multi-session mode is enabled)
  // sessionActive 会话数据 命名 `0`，让后续代码直接表达这个值的用途。
  let sessionActive = 0
  // sessionMax 会话数据 命名 `1`，让后续代码直接表达这个值的用途。
  let sessionMax = 1
  // Spawn mode shown in the session-count line + gates the `w` hint
  // spawnModeDisplay保存`null`，作为后续空值处理的输入。
  let spawnModeDisplay: 'same-dir' | 'worktree' | null = null
  // spawnMode保存`'single-session'`，作为后续固定文本处理的输入。
  let spawnMode: SpawnMode = 'single-session'

  // Per-session display info for the multi-session bullet list (keyed by compat sessionId)
  // sessionDisplayInfo 会话数据构建`new Map<` 整理出中间结果，供远程桥接会话远程桥接 bridge UI后续步骤使用。
  const sessionDisplayInfo = new Map<
    string,
    { title?: string; url: string; activity?: SessionActivity }
  >()

  // Connecting spinner state
  // connectingTimer初始化为空值，后续分支会在有数据时补齐。
  let connectingTimer: ReturnType<typeof setInterval> | null = null
  // connectingTick保存`0`，供后续判断或组装使用。
  let connectingTick = 0

  /**
   * Count how many visual terminal rows a string occupies, accounting for
   * line wrapping. Each `\n` is one row, and content wider than the terminal
   * wraps to additional rows.
   */
  // countVisualLines 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function countVisualLines(text: string): number {
    // eslint-disable-next-line custom-rules/prefer-use-terminal-size
    // cols 集合标记远程桥接会话远程桥接 bridge UI是否启用对应路径。
    const cols = process.stdout.columns || 80 // non-React CLI context
    // count 数量保存`0`，供后续判断或组装使用。
    let count = 0
    // Split on newlines to get logical lines
    // 逐项读取 `text.split('\n')` 中的logical，按输入顺序推进远程桥接会话。
    for (const logical of text.split('\n')) {
      // logical为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
      if (logical.length === 0) {
        // Empty segment between consecutive \n — counts as 1 row
        // 远程桥接 bridge UI在这里处理 `count++`，完成这一小步状态转换。
        count++
        // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
        continue
      }
      // width保存`stringWidth`，供远程桥接会话后续处理使用。
      const width = stringWidth(logical)
      // 远程桥接 bridge UI在这里处理 `count += Math.max(1, Math.ceil(width / cols))`，完成这一小步状态转换。
      count += Math.max(1, Math.ceil(width / cols))
    }
    // The trailing \n in "line\n" produces an empty last element — don't count it
    // because the cursor sits at the start of the next line, not a new visual row.
    // 满足 `text.endsWith('\n')` 时，远程桥接会话执行该分支。
    if (text.endsWith('\n')) {
      // 远程桥接 bridge UI在这里处理 `count--`，完成这一小步状态转换。
      count--
    }
    // 返回 `count`，作为远程桥接会话这次计算的结果。
    return count
  }

  /** Write a status line and track its visual line count. */
  // writeStatus 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function writeStatus(text: string): void {
    // 调用 write，触发远程桥接会话此处需要的副作用。
    write(text)
    // 远程桥接 bridge UI在这里处理 `statusLineCount += countVisualLines(text)`，完成这一小步状态转换。
    statusLineCount += countVisualLines(text)
  }

  /** Clear any currently displayed status lines. */
  // clearStatusLines 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function clearStatusLines(): void {
    // 满足 `statusLineCount <= 0` 时，远程桥接会话执行该分支。
    if (statusLineCount <= 0) return
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge:ui] clearStatusLines count=${statusLineCount}`)
    // Move cursor up to the start of the status block, then erase everything below
    // 调用 write，触发远程桥接会话此处需要的副作用。
    write(`\x1b[${statusLineCount}A`) // cursor up N lines
    // 调用 write，触发远程桥接会话此处需要的副作用。
    write('\x1b[J') // erase from cursor to end of screen
    // statusLineCount 数量更新为 `0`，确保Bridge 通信后续读取最新状态。
    statusLineCount = 0
  }

  /** Print a permanent log line, clearing status first and restoring after. */
  // printLog 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function printLog(line: string): void {
    // 调用 clearStatusLines，触发远程桥接会话此处需要的副作用。
    clearStatusLines()
    // 调用 write，触发远程桥接会话此处需要的副作用。
    write(line)
  }

  /** Regenerate the QR code with the given URL. */
  // regenerateQr 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function regenerateQr(url: string): void {
    // 调用 generateQr，触发远程桥接会话此处需要的副作用。
    generateQr(url)
      .then(lines => {
        // qrLines 集合更新为 `lines`，确保Bridge 通信后续读取最新状态。
        qrLines = lines
        // 调用 renderStatusLine，触发远程桥接会话此处需要的副作用。
        renderStatusLine()
      })
      // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
      .catch(e => {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`QR code generation failed: ${e}`, { level: 'error' })
      })
  }

  /** Render the connecting spinner line (shown before first updateIdleStatus). */
  // renderConnectingLine 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function renderConnectingLine(): void {
    // 调用 clearStatusLines，触发远程桥接会话此处需要的副作用。
    clearStatusLines()

    // frame 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const frame =
      BRIDGE_SPINNER_FRAMES[connectingTick % BRIDGE_SPINNER_FRAMES.length]!
    // suffix 命名 `''`，让后续代码直接表达这个值的用途。
    let suffix = ''
    // 满足 `repoName` 时，远程桥接会话执行该分支。
    if (repoName) {
      // 远程桥接 bridge UI在这里处理 `suffix += chalk.dim(' \u00b7 ') + chalk.dim(repoName)`，完成这一小步状态转换。
      suffix += chalk.dim(' \u00b7 ') + chalk.dim(repoName)
    }
    // 满足 `branch` 时，远程桥接会话执行该分支。
    if (branch) {
      // 远程桥接 bridge UI在这里处理 `suffix += chalk.dim(' \u00b7 ') + chalk.dim(branch)`，完成这一小步状态转换。
      suffix += chalk.dim(' \u00b7 ') + chalk.dim(branch)
    }
    // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
    writeStatus(
      `${chalk.yellow(frame)} ${chalk.yellow('Connecting')}${suffix}\n`,
    )
  }

  /** Start the connecting spinner. Stopped by first updateIdleStatus(). */
  // startConnecting 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function startConnecting(): void {
    // 调用 stopConnecting，触发远程桥接会话此处需要的副作用。
    stopConnecting()
    // 调用 renderConnectingLine，触发远程桥接会话此处需要的副作用。
    renderConnectingLine()
    // connectingTimer更新为 `setInterval(() => {`，确保Bridge 通信后续读取最新状态。
    connectingTimer = setInterval(() => {
      // 远程桥接 bridge UI在这里处理 `connectingTick++`，完成这一小步状态转换。
      connectingTick++
      // 调用 renderConnectingLine，触发远程桥接会话此处需要的副作用。
      renderConnectingLine()
    }, 150)
  }

  /** Stop the connecting spinner. */
  // stopConnecting 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function stopConnecting(): void {
    // 满足 `connectingTimer` 时，远程桥接会话执行该分支。
    if (connectingTimer) {
      // 调用 clearInterval，触发远程桥接会话此处需要的副作用。
      clearInterval(connectingTimer)
      // connectingTimer更新为 `null`，确保Bridge 通信后续读取最新状态。
      connectingTimer = null
    }
  }

  /** Render and write the current status lines based on state. */
  // renderStatusLine 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function renderStatusLine(): void {
    // 组合条件 `currentState === 'reconnecting' || currentState =` 成立时，远程桥接会话才启用这条专门路径。
    if (currentState === 'reconnecting' || currentState === 'failed') {
      // These states are handled separately (updateReconnectingStatus /
      // updateFailedStatus). Return before clearing so callers like toggleQr
      // and setSpawnModeDisplay don't blank the display during these states.
      // 远程桥接 bridge UI在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 调用 clearStatusLines，触发远程桥接会话此处需要的副作用。
    clearStatusLines()

    // isIdle标记远程桥接会话远程桥接 bridge UI是否启用对应路径。
    const isIdle = currentState === 'idle'

    // QR code above the status line
    // 满足 `qrVisible` 时，远程桥接会话执行该分支。
    if (qrVisible) {
      // 按顺序遍历 `qrLines` 中的line，逐个交给远程桥接会话处理。
      for (const line of qrLines) {
        // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
        writeStatus(`${chalk.dim(line)}\n`)
      }
    }

    // Determine indicator and colors based on state
    // indicator 命名 `BRIDGE_READY_INDICATOR`，让后续代码直接表达这个值的用途。
    const indicator = BRIDGE_READY_INDICATOR
    // indicatorColor 命名 `isIdle ? chalk.green : chalk.cyan`，让后续代码直接表达这个值的用途。
    const indicatorColor = isIdle ? chalk.green : chalk.cyan
    // baseColor保存`isIdle ? chalk.green : chalk.cyan`，供后续判断或组装使用。
    const baseColor = isIdle ? chalk.green : chalk.cyan
    // stateText 状态保存`baseColor`，供远程桥接会话后续处理使用。
    const stateText = baseColor(currentStateText)

    // Build the suffix with repo and branch
    // suffix 命名 `''`，让后续代码直接表达这个值的用途。
    let suffix = ''
    // 满足 `repoName` 时，远程桥接会话执行该分支。
    if (repoName) {
      // 远程桥接 bridge UI在这里处理 `suffix += chalk.dim(' \u00b7 ') + chalk.dim(repoName)`，完成这一小步状态转换。
      suffix += chalk.dim(' \u00b7 ') + chalk.dim(repoName)
    }
    // In worktree mode each session gets its own branch, so showing the
    // bridge's branch would be misleading.
    // `branch && spawnMode` 与 `'worktree'` 不一致时刷新派生状态，避免使用过期结果。
    if (branch && spawnMode !== 'worktree') {
      // 远程桥接 bridge UI在这里处理 `suffix += chalk.dim(' \u00b7 ') + chalk.dim(branch)`，完成这一小步状态转换。
      suffix += chalk.dim(' \u00b7 ') + chalk.dim(branch)
    }

    // 组合条件 `process.env.USER_TYPE === 'ant' && debugLogPath` 成立时，远程桥接会话才启用这条专门路径。
    if (process.env.USER_TYPE === 'ant' && debugLogPath) {
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(
        `${chalk.yellow('[ANT-ONLY] Logs:')} ${chalk.dim(debugLogPath)}\n`,
      )
    }
    // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
    writeStatus(`${indicatorColor(indicator)} ${stateText}${suffix}\n`)

    // Session count and per-session list (multi-session mode only)
    // 满足 `sessionMax > 1` 时，远程桥接会话执行该分支。
    if (sessionMax > 1) {
      // modeHint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const modeHint =
        spawnMode === 'worktree'
          ? 'New sessions will be created in an isolated worktree'
          : 'New sessions will be created in the current directory'
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(
        `    ${chalk.dim(`Capacity: ${sessionActive}/${sessionMax} \u00b7 ${modeHint}`)}\n`,
      )
      // 循环处理 `const [, info] of sessionDisplayInfo`，让远程桥接会话逐项把同类条目按顺序走完。
      for (const [, info] of sessionDisplayInfo) {
        // titleText 标题保存`info.title`，供远程桥接会话远程桥接 bridge UI后续判断或输出使用。
        const titleText = info.title
          ? truncatePrompt(info.title, 35)
          : chalk.dim('Attached')
        // titleLinked 标题保存`wrapWithOsc8Link`，供远程桥接会话后续处理使用。
        const titleLinked = wrapWithOsc8Link(titleText, info.url)
        // act保存`info.activity`，供远程桥接会话远程桥接 bridge UI后续判断或输出使用。
        const act = info.activity
        // showAct标记远程桥接会话远程桥接 bridge UI是否启用对应路径。
        const showAct = act && act.type !== 'result' && act.type !== 'error'
        // actText保存`showAct`，供远程桥接会话远程桥接 bridge UI后续判断或输出使用。
        const actText = showAct
          ? chalk.dim(` ${truncatePrompt(act.summary, 40)}`)
          : ''
        // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
        writeStatus(`    ${titleLinked}${actText}
`)
      }
    }

    // Mode line for spawn modes with a single slot (or true single-session mode)
    // 满足 `sessionMax === 1` 时，远程桥接会话执行该分支。
    if (sessionMax === 1) {
      // modeText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const modeText =
        spawnMode === 'single-session'
          ? 'Single session \u00b7 exits when complete'
          : spawnMode === 'worktree'
            ? `Capacity: ${sessionActive}/1 \u00b7 New sessions will be created in an isolated worktree`
            : `Capacity: ${sessionActive}/1 \u00b7 New sessions will be created in the current directory`
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(`    ${chalk.dim(modeText)}\n`)
    }

    // Tool activity line for single-session mode
    // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
    if (
      sessionMax === 1 &&
      !isIdle &&
      lastToolSummary &&
      Date.now() - lastToolTime < TOOL_DISPLAY_EXPIRY_MS
    ) {
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(`  ${chalk.dim(truncatePrompt(lastToolSummary, 60))}\n`)
    }

    // Blank line separator before footer
    // URL 命名 `activeSessionUrl ?? connectUrl`，让后续代码直接表达这个值的用途。
    const url = activeSessionUrl ?? connectUrl
    // 满足 `url` 时，远程桥接会话执行该分支。
    if (url) {
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus('\n')
      // footerText保存`isIdle`，供后续判断或组装使用。
      const footerText = isIdle
        ? buildIdleFooterText(url)
        : buildActiveFooterText(url)
      // qrHint 命名 `qrVisible`，让后续代码直接表达这个值的用途。
      const qrHint = qrVisible
        ? chalk.dim.italic('space to hide QR code')
        : chalk.dim.italic('space to show QR code')
      // toggleHint保存`spawnModeDisplay`，供后续判断或组装使用。
      const toggleHint = spawnModeDisplay
        ? chalk.dim.italic(' \u00b7 w to toggle spawn mode')
        : ''
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(`${chalk.dim(footerText)}\n`)
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(`${qrHint}${toggleHint}\n`)
    }
  }

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    // printBanner 使用 config: BridgeConfig, environmentId: string 完成远程桥接会话里的对应操作。
    printBanner(config: BridgeConfig, environmentId: string): void {
      // cachedIngressUrl 缓存更新为 `config.sessionIngressUrl`，确保Bridge 通信后续读取最新状态。
      cachedIngressUrl = config.sessionIngressUrl
      // cachedEnvironmentId 缓存更新为 `environmentId`，确保Bridge 通信后续读取最新状态。
      cachedEnvironmentId = environmentId
      // connectUrl更新为 `buildBridgeConnectUrl(environmentId, cachedIngressUrl)`，确保Bridge 通信后续读取最新状态。
      connectUrl = buildBridgeConnectUrl(environmentId, cachedIngressUrl)
      // 调用 regenerateQr，触发远程桥接会话此处需要的副作用。
      regenerateQr(connectUrl)

      // 满足 `verbose` 时，远程桥接会话执行该分支。
      if (verbose) {
        // 调用 write，触发远程桥接会话此处需要的副作用。
        write(chalk.dim(`Remote Control`) + ` v${MACRO.VERSION}\n`)
      }
      // 满足 `verbose` 时，远程桥接会话执行该分支。
      if (verbose) {
        // `config.spawnMode` 与 `'single-session'` 不一致时刷新派生状态，避免使用过期结果。
        if (config.spawnMode !== 'single-session') {
          // 调用 write，触发远程桥接会话此处需要的副作用。
          write(chalk.dim(`Spawn mode: `) + `${config.spawnMode}\n`)
          // 调用 write，触发远程桥接会话此处需要的副作用。
          write(
            chalk.dim(`Max concurrent sessions: `) + `${config.maxSessions}\n`,
          )
        }
        // 调用 write，触发远程桥接会话此处需要的副作用。
        write(chalk.dim(`Environment ID: `) + `${environmentId}\n`)
      }
      // 满足 `config.sandbox` 时，远程桥接会话执行该分支。
      if (config.sandbox) {
        // 调用 write，触发远程桥接会话此处需要的副作用。
        write(chalk.dim(`Sandbox: `) + `${chalk.green('Enabled')}\n`)
      }
      // 调用 write，触发远程桥接会话此处需要的副作用。
      write('\n')

      // Start connecting spinner — first updateIdleStatus() will stop it
      // 调用 startConnecting，触发远程桥接会话此处需要的副作用。
      startConnecting()
    },

    // logSessionStart 使用 sessionId: string, prompt: string 完成远程桥接会话里的对应操作。
    logSessionStart(sessionId: string, prompt: string): void {
      // 满足 `verbose` 时，远程桥接会话执行该分支。
      if (verbose) {
        // short保存`truncatePrompt`，供远程桥接会话后续处理使用。
        const short = truncatePrompt(prompt, 80)
        // 调用 printLog，触发远程桥接会话此处需要的副作用。
        printLog(
          chalk.dim(`[${timestamp()}]`) +
            ` Session started: ${chalk.white(`"${short}"`)} (${chalk.dim(sessionId)})\n`,
        )
      }
    },

    // logSessionComplete 使用 sessionId: string, durationMs: number 完成远程桥接会话里的对应操作。
    logSessionComplete(sessionId: string, durationMs: number): void {
      // 调用 printLog，触发远程桥接会话此处需要的副作用。
      printLog(
        chalk.dim(`[${timestamp()}]`) +
          ` Session ${chalk.green('completed')} (${formatDuration(durationMs)}) ${chalk.dim(sessionId)}\n`,
      )
    },

    // logSessionFailed 使用 sessionId: string, error: string 完成远程桥接会话里的对应操作。
    logSessionFailed(sessionId: string, error: string): void {
      // 调用 printLog，触发远程桥接会话此处需要的副作用。
      printLog(
        chalk.dim(`[${timestamp()}]`) +
          ` Session ${chalk.red('failed')}: ${error} ${chalk.dim(sessionId)}\n`,
      )
    },

    // logStatus 使用 message: string 完成远程桥接会话里的对应操作。
    logStatus(message: string): void {
      // 调用 printLog，触发远程桥接会话此处需要的副作用。
      printLog(chalk.dim(`[${timestamp()}]`) + ` ${message}\n`)
    },

    // logVerbose 使用 message: string 完成远程桥接会话里的对应操作。
    logVerbose(message: string): void {
      // 满足 `verbose` 时，远程桥接会话执行该分支。
      if (verbose) {
        // 调用 printLog，触发远程桥接会话此处需要的副作用。
        printLog(chalk.dim(`[${timestamp()}] ${message}`) + '\n')
      }
    },

    // logError 使用 message: string 完成远程桥接会话里的对应操作。
    logError(message: string): void {
      // 调用 printLog，触发远程桥接会话此处需要的副作用。
      printLog(chalk.red(`[${timestamp()}] Error: ${message}`) + '\n')
    },

    // logReconnected 使用 disconnectedMs: number 完成远程桥接会话里的对应操作。
    logReconnected(disconnectedMs: number): void {
      // 调用 printLog，触发远程桥接会话此处需要的副作用。
      printLog(
        chalk.dim(`[${timestamp()}]`) +
          ` ${chalk.green('Reconnected')} after ${formatDuration(disconnectedMs)}\n`,
      )
    },

    // setRepoInfo 根据 repo: string, branchName: string 更新远程桥接会话的状态。
    setRepoInfo(repo: string, branchName: string): void {
      // repoName更新为 `repo`，确保Bridge 通信后续读取最新状态。
      repoName = repo
      // branch更新为 `branchName`，确保Bridge 通信后续读取最新状态。
      branch = branchName
    },

    // setDebugLogPath 根据 path: string 更新远程桥接会话的状态。
    setDebugLogPath(path: string): void {
      // debugLogPath 路径数据更新为 `path`，确保Bridge 通信后续读取最新状态。
      debugLogPath = path
    },

    // updateIdleStatus 使用 无 完成远程桥接会话里的对应操作。
    updateIdleStatus(): void {
      // 调用 stopConnecting，触发远程桥接会话此处需要的副作用。
      stopConnecting()

      // currentState 状态更新为 `'idle'`，确保Bridge 通信后续读取最新状态。
      currentState = 'idle'
      // currentStateText 状态更新为 `'Ready'`，确保Bridge 通信后续读取最新状态。
      currentStateText = 'Ready'
      // lastToolSummary更新为 `null`，确保Bridge 通信后续读取最新状态。
      lastToolSummary = null
      // lastToolTime更新为 `0`，确保Bridge 通信后续读取最新状态。
      lastToolTime = 0
      // activeSessionUrl 会话数据更新为 `null`，确保Bridge 通信后续读取最新状态。
      activeSessionUrl = null
      // 调用 regenerateQr，触发远程桥接会话此处需要的副作用。
      regenerateQr(connectUrl)
      // 调用 renderStatusLine，触发远程桥接会话此处需要的副作用。
      renderStatusLine()
    },

    // setAttached 根据 sessionId: string 更新远程桥接会话的状态。
    setAttached(sessionId: string): void {
      // 调用 stopConnecting，触发远程桥接会话此处需要的副作用。
      stopConnecting()
      // currentState 状态更新为 `'attached'`，确保Bridge 通信后续读取最新状态。
      currentState = 'attached'
      // currentStateText 状态更新为 `'Connected'`，确保Bridge 通信后续读取最新状态。
      currentStateText = 'Connected'
      // lastToolSummary更新为 `null`，确保Bridge 通信后续读取最新状态。
      lastToolSummary = null
      // lastToolTime更新为 `0`，确保Bridge 通信后续读取最新状态。
      lastToolTime = 0
      // Multi-session: keep footer/QR on the environment connect URL so users
      // can spawn more sessions. Per-session links are in the bullet list.
      // 满足 `sessionMax <= 1` 时，远程桥接会话执行该分支。
      if (sessionMax <= 1) {
        // activeSessionUrl 会话数据更新为 `buildBridgeSessionUrl(`，确保Bridge 通信后续读取最新状态。
        activeSessionUrl = buildBridgeSessionUrl(
          sessionId,
          cachedEnvironmentId,
          cachedIngressUrl,
        )
        // 调用 regenerateQr，触发远程桥接会话此处需要的副作用。
        regenerateQr(activeSessionUrl)
      }
      // 调用 renderStatusLine，触发远程桥接会话此处需要的副作用。
      renderStatusLine()
    },

    // updateReconnectingStatus 使用 delayStr: string, elapsedStr: string 完成远程桥接会话里的对应操作。
    updateReconnectingStatus(delayStr: string, elapsedStr: string): void {
      // 调用 stopConnecting，触发远程桥接会话此处需要的副作用。
      stopConnecting()
      // 调用 clearStatusLines，触发远程桥接会话此处需要的副作用。
      clearStatusLines()
      // currentState 状态更新为 `'reconnecting'`，确保Bridge 通信后续读取最新状态。
      currentState = 'reconnecting'

      // QR code above the status line
      // 满足 `qrVisible` 时，远程桥接会话执行该分支。
      if (qrVisible) {
        // 按顺序遍历 `qrLines` 中的line，逐个交给远程桥接会话处理。
        for (const line of qrLines) {
          // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
          writeStatus(`${chalk.dim(line)}\n`)
        }
      }

      // frame 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const frame =
        BRIDGE_SPINNER_FRAMES[connectingTick % BRIDGE_SPINNER_FRAMES.length]!
      // 远程桥接 bridge UI在这里处理 `connectingTick++`，完成这一小步状态转换。
      connectingTick++
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(
        `${chalk.yellow(frame)} ${chalk.yellow('Reconnecting')} ${chalk.dim('\u00b7')} ${chalk.dim(`retrying in ${delayStr}`)} ${chalk.dim('\u00b7')} ${chalk.dim(`disconnected ${elapsedStr}`)}\n`,
      )
    },

    // updateFailedStatus 使用 error: string 完成远程桥接会话里的对应操作。
    updateFailedStatus(error: string): void {
      // 调用 stopConnecting，触发远程桥接会话此处需要的副作用。
      stopConnecting()
      // 调用 clearStatusLines，触发远程桥接会话此处需要的副作用。
      clearStatusLines()
      // currentState 状态更新为 `'failed'`，确保Bridge 通信后续读取最新状态。
      currentState = 'failed'

      // suffix 命名 `''`，让后续代码直接表达这个值的用途。
      let suffix = ''
      // 满足 `repoName` 时，远程桥接会话执行该分支。
      if (repoName) {
        // 远程桥接 bridge UI在这里处理 `suffix += chalk.dim(' \u00b7 ') + chalk.dim(repoName)`，完成这一小步状态转换。
        suffix += chalk.dim(' \u00b7 ') + chalk.dim(repoName)
      }
      // 满足 `branch` 时，远程桥接会话执行该分支。
      if (branch) {
        // 远程桥接 bridge UI在这里处理 `suffix += chalk.dim(' \u00b7 ') + chalk.dim(branch)`，完成这一小步状态转换。
        suffix += chalk.dim(' \u00b7 ') + chalk.dim(branch)
      }

      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(
        `${chalk.red(BRIDGE_FAILED_INDICATOR)} ${chalk.red('Remote Control Failed')}${suffix}\n`,
      )
      // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
      writeStatus(`${chalk.dim(FAILED_FOOTER_TEXT)}\n`)

      // 满足 `error` 时，远程桥接会话执行该分支。
      if (error) {
        // 调用 writeStatus，触发远程桥接会话此处需要的副作用。
        writeStatus(`${chalk.red(error)}\n`)
      }
    },

    // 调用 updateSessionStatus，触发远程桥接会话此处需要的副作用。
    updateSessionStatus(
      _sessionId: string,
      _elapsed: string,
      activity: SessionActivity,
      _trail: string[],
    ): void {
      // Cache tool activity for the second status line
      // 当 `activity.type` 匹配 `'tool_start'` 时，远程桥接会话执行对应分支。
      if (activity.type === 'tool_start') {
        // lastToolSummary更新为 `activity.summary`，确保Bridge 通信后续读取最新状态。
        lastToolSummary = activity.summary
        // lastToolTime更新为 `Date.now()`，确保Bridge 通信后续读取最新状态。
        lastToolTime = Date.now()
      }
      // 调用 renderStatusLine，触发远程桥接会话此处需要的副作用。
      renderStatusLine()
    },

    // clearStatus 使用 无 完成远程桥接会话里的对应操作。
    clearStatus(): void {
      // 调用 stopConnecting，触发远程桥接会话此处需要的副作用。
      stopConnecting()
      // 调用 clearStatusLines，触发远程桥接会话此处需要的副作用。
      clearStatusLines()
    },

    // toggleQr 使用 无 完成远程桥接会话里的对应操作。
    toggleQr(): void {
      // qrVisible更新为 `!qrVisible`，确保Bridge 通信后续读取最新状态。
      qrVisible = !qrVisible
      // 调用 renderStatusLine，触发远程桥接会话此处需要的副作用。
      renderStatusLine()
    },

    // updateSessionCount 使用 active: number, max: number, mode: SpawnMode 完成远程桥接会话里的对应操作。
    updateSessionCount(active: number, max: number, mode: SpawnMode): void {
      // 组合条件 `sessionActive === active && sessionMax === max && spawnMode === mode` 成立时，远程桥接会话才启用这条专门路径。
      if (sessionActive === active && sessionMax === max && spawnMode === mode)
        // 远程桥接 bridge UI在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      // sessionActive 会话数据更新为 `active`，确保Bridge 通信后续读取最新状态。
      sessionActive = active
      // sessionMax 会话数据更新为 `max`，确保Bridge 通信后续读取最新状态。
      sessionMax = max
      // spawnMode更新为 `mode`，确保Bridge 通信后续读取最新状态。
      spawnMode = mode
      // Don't re-render here — the status ticker calls renderStatusLine
      // on its own cadence, and the next tick will pick up the new values.
    },

    // setSpawnModeDisplay 根据 mode: 'same-dir' | 'worktree' | null 更新远程桥接会话的状态。
    setSpawnModeDisplay(mode: 'same-dir' | 'worktree' | null): void {
      // 满足 `spawnModeDisplay === mode` 时，远程桥接会话执行该分支。
      if (spawnModeDisplay === mode) return
      // spawnModeDisplay更新为 `mode`，确保Bridge 通信后续读取最新状态。
      spawnModeDisplay = mode
      // Also sync the #21118-added spawnMode so the next render shows correct
      // mode hint + branch visibility. Don't render here — matches
      // updateSessionCount: called before printBanner (initial setup) and
      // again from the `w` handler (which follows with refreshDisplay).
      // 满足 `mode` 时，远程桥接会话执行该分支。
      if (mode) spawnMode = mode
    },

    // addSession 使用 sessionId: string, url: string 完成远程桥接会话里的对应操作。
    addSession(sessionId: string, url: string): void {
      // sessionDisplayInfo.set 写入新的状态值，使远程桥接会话后续读取保持一致。
      sessionDisplayInfo.set(sessionId, { url })
    },

    // updateSessionActivity 使用 sessionId: string, activity: SessionActivity 完成远程桥接会话里的对应操作。
    updateSessionActivity(sessionId: string, activity: SessionActivity): void {
      // info读取`sessionDisplayInfo.get`，供远程桥接会话后续处理使用。
      const info = sessionDisplayInfo.get(sessionId)
      // info缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!info) return
      // activity更新为 `activity`，确保Bridge 通信后续读取最新状态。
      info.activity = activity
    },

    // setSessionTitle 根据 sessionId: string, title: string 更新远程桥接会话的状态。
    setSessionTitle(sessionId: string, title: string): void {
      // info读取`sessionDisplayInfo.get`，供远程桥接会话后续处理使用。
      const info = sessionDisplayInfo.get(sessionId)
      // info缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!info) return
      // title 标题更新为 `title`，确保Bridge 通信后续读取最新状态。
      info.title = title
      // Guard against reconnecting/failed — renderStatusLine clears then returns
      // early for those states, which would erase the spinner/error.
      // 当 `currentState` 匹配 `'reconnecting' || currentSt...` 时，远程桥接会话执行对应分支。
      if (currentState === 'reconnecting' || currentState === 'failed') return
      // 满足 `sessionMax === 1` 时，远程桥接会话执行该分支。
      if (sessionMax === 1) {
        // Single-session: show title in the main status line too.
        // currentState 状态更新为 `'titled'`，确保Bridge 通信后续读取最新状态。
        currentState = 'titled'
        // currentStateText 状态更新为 `truncatePrompt(title, 40)`，确保Bridge 通信后续读取最新状态。
        currentStateText = truncatePrompt(title, 40)
      }
      // 调用 renderStatusLine，触发远程桥接会话此处需要的副作用。
      renderStatusLine()
    },

    // removeSession 使用 sessionId: string 完成远程桥接会话里的对应操作。
    removeSession(sessionId: string): void {
      // 调用 sessionDisplayInfo.delete，触发远程桥接会话此处需要的副作用。
      sessionDisplayInfo.delete(sessionId)
    },

    // refreshDisplay 使用 无 完成远程桥接会话里的对应操作。
    refreshDisplay(): void {
      // Skip during reconnecting/failed — renderStatusLine clears then returns
      // early for those states, which would erase the spinner/error.
      // 当 `currentState` 匹配 `'reconnecting' || currentSt...` 时，远程桥接会话执行对应分支。
      if (currentState === 'reconnecting' || currentState === 'failed') return
      // 调用 renderStatusLine，触发远程桥接会话此处需要的副作用。
      renderStatusLine()
    },
  }
}

/**
 * CLI `ComputerExecutor` implementation. Wraps two native modules:
 *   - `@ant/computer-use-input` (Rust/enigo) — mouse, keyboard, frontmost app
 *   - `@ant/computer-use-swift` — SCContentFilter screenshots, NSWorkspace apps, TCC
 *
 * Contract: `packages/desktop/computer-use-mcp/src/executor.ts` in the apps
 * repo. The reference impl is Cowork's `apps/desktop/src/main/nest-only/
 * computer-use/executor.ts` — see notable deviations under "CLI deltas" below.
 *
 * ── CLI deltas from Cowork ─────────────────────────────────────────────────
 *
 * No `withClickThrough`. Cowork wraps every mouse op in
 *   `BrowserWindow.setIgnoreMouseEvents(true)` so clicks fall through the
 *   overlay. We're a terminal — no window — so the click-through bracket is
 *   a no-op. The sentinel `CLI_HOST_BUNDLE_ID` never matches frontmost.
 *
 * Terminal as surrogate host. `getTerminalBundleId()` detects the emulator
 *   we're running inside. It's passed as `hostBundleId` to `prepareDisplay`/
 *   `resolvePrepareCapture` so the Swift side exempts it from hide AND skips
 *   it in the activate z-order walk (so the terminal being frontmost doesn't
 *   eat clicks meant for the target app). Also stripped from `allowedBundleIds`
 *   via `withoutTerminal()` so screenshots don't capture it (Swift 0.2.1's
 *   captureExcluding takes an allow-list despite the name — apps#30355).
 *   `capabilities.hostBundleId` stays as the sentinel — the package's
 *   frontmost gate uses that, and the terminal being frontmost is fine.
 *
 * Clipboard via `pbcopy`/`pbpaste`. No Electron `clipboard` module.
 */

// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import type {
  ComputerExecutor,
  DisplayGeometry,
  FrontmostApp,
  InstalledApp,
  ResolvePrepareCaptureResult,
  RunningApp,
  ScreenshotResult,
} from '@ant/computer-use-mcp'

// 引入 API_RESIZE_PARAMS、targetImageSize，将 @ant/computer-use-mcp 中已经封装好的能力接到本文件流程里。
import { API_RESIZE_PARAMS, targetImageSize } from '@ant/computer-use-mcp'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 execFileNoThrow，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from '../execFileNoThrow.js'
// 引入 sleep，将 ../sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from '../sleep.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  CLI_CU_CAPABILITIES,
  CLI_HOST_BUNDLE_ID,
  getTerminalBundleId,
} from './common.js'
// 引入 drainRunLoop，将 ./drainRunLoop.js 中已经封装好的能力接到本文件流程里。
import { drainRunLoop } from './drainRunLoop.js'
// 引入 notifyExpectedEscape，将 ./escHotkey.js 中已经封装好的能力接到本文件流程里。
import { notifyExpectedEscape } from './escHotkey.js'
// 引入 requireComputerUseInput，将 ./inputLoader.js 中已经封装好的能力接到本文件流程里。
import { requireComputerUseInput } from './inputLoader.js'
// 引入 requireComputerUseSwift，将 ./swiftLoader.js 中已经封装好的能力接到本文件流程里。
import { requireComputerUseSwift } from './swiftLoader.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

// SCREENSHOT_JPEG_QUALITY保存`0.75`，供共享工具 executor后续判断或输出使用。
const SCREENSHOT_JPEG_QUALITY = 0.75

/** Logical → physical → API target dims. See `targetImageSize` + COORDINATES.md. */
// computeTargetDims 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeTargetDims(
  logicalW: number,
  logicalH: number,
  scaleFactor: number,
): [number, number] {
  // physW保存`Math.round`，供共享工具后续处理使用。
  const physW = Math.round(logicalW * scaleFactor)
  // physH保存`Math.round`，供共享工具后续处理使用。
  const physH = Math.round(logicalH * scaleFactor)
  // 返回 `targetImageSize(physW, physH, API_RESIZE_PARAMS)`，作为共享工具这次计算的结果。
  return targetImageSize(physW, physH, API_RESIZE_PARAMS)
}

// readClipboardViaPbpaste 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readClipboardViaPbpaste(): Promise<string> {
  // 从 `await execFileNoThrow('pbpaste', [], {` 解构 stdout、code，减少共享工具 executor对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrow('pbpaste', [], {
    useCwd: false,
  })
  // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0) {
    // 抛出 new Error(`pbpaste exited with code ${code}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`pbpaste exited with code ${code}`)
  }
  // 返回 `stdout`，作为共享工具这次计算的结果。
  return stdout
}

// writeClipboardViaPbcopy 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeClipboardViaPbcopy(text: string): Promise<void> {
  // 从 `await execFileNoThrow('pbcopy', [], {` 解构 code，减少共享工具 executor对同一对象的重复访问。
  const { code } = await execFileNoThrow('pbcopy', [], {
    input: text,
    useCwd: false,
  })
  // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0) {
    // 抛出 new Error(`pbcopy exited with code ${code}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`pbcopy exited with code ${code}`)
  }
}

// Input 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Input = ReturnType<typeof requireComputerUseInput>

/**
 * Single-element key sequence matching "escape" or "esc" (case-insensitive).
 * Used to hole-punch the CGEventTap abort for model-synthesized Escape — enigo
 * accepts both spellings, so the tap must too.
 */
// isBareEscape 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBareEscape(parts: readonly string[]): boolean {
  // `parts.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
  if (parts.length !== 1) return false
  // lower保存`toLowerCase`，供共享工具后续处理使用。
  const lower = parts[0]!.toLowerCase()
  // 返回 `lower === 'escape' || lower === 'esc'`，作为共享工具这次计算的结果。
  return lower === 'escape' || lower === 'esc'
}

/**
 * Instant move, then 50ms — an input→HID→AppKit→NSEvent round-trip before the
 * caller reads `NSEvent.mouseLocation` or dispatches a click. Used for click,
 * scroll, and drag-from; `animatedMove` is reserved for drag-to only. The
 * intermediate animation frames were triggering hover states and, on the
 * decomposed mouseDown/moveMouse path, emitting stray `.leftMouseDragged`
 * events (toolCalls.ts handleScroll's mouse_full workaround).
 */
// MOVE_SETTLE_MS 集合保存`50`，供共享工具 executor后续判断或输出使用。
const MOVE_SETTLE_MS = 50

// moveAndSettle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function moveAndSettle(
  input: Input,
  x: number,
  y: number,
): Promise<void> {
  // 等待 `input.moveMouse(x, y, false)` 完成，再继续共享工具 executor的异步流程。
  await input.moveMouse(x, y, false)
  // 等待 `sleep(MOVE_SETTLE_MS)` 完成，再继续共享工具 executor的异步流程。
  await sleep(MOVE_SETTLE_MS)
}

/**
 * Release `pressed` in reverse (last pressed = first released). Errors are
 * swallowed so a release failure never masks the real error.
 *
 * Drains via pop() rather than snapshotting length: if a drainRunLoop-
 * orphaned press lambda resolves an in-flight input.key() AFTER finally
 * calls us, that late push is still released on the next iteration. The
 * orphaned flag stops the lambda at its NEXT check, not the current await.
 */
// releasePressed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function releasePressed(input: Input, pressed: string[]): Promise<void> {
  // k 先占位，稍后的条件分支会根据实际输入补齐它。
  let k: string | undefined
  // 只要 (k = pressed.pop()) !== undefined 成立，就持续推进共享工具中的循环处理。
  while ((k = pressed.pop()) !== undefined) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `input.key(k, 'release')` 完成，再继续共享工具 executor的异步流程。
      await input.key(k, 'release')
    } catch {
      // Swallow — best-effort release.
    }
  }
}

/**
 * Bracket `fn()` with modifier press/release. `pressed` tracks which presses
 * actually landed, so a mid-press throw only releases what was pressed — no
 * stuck modifiers. The finally covers both press-phase and fn() throws.
 *
 * Caller must already be inside drainRunLoop() — key() dispatches to the
 * main queue and needs the pump to resolve.
 */
// withModifiers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function withModifiers<T>(
  input: Input,
  mods: string[],
  // 这个回调绑定到 fn: () => Promise<T>,，负责共享工具在该局部场景下的响应。
  fn: () => Promise<T>,
): Promise<T> {
  // pressed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const pressed: string[] = []
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 按顺序遍历 `mods` 中的m，逐个交给共享工具处理。
    for (const m of mods) {
      // 等待 `input.key(m, 'press')` 完成，再继续共享工具 executor的异步流程。
      await input.key(m, 'press')
      // pressed追加新条目，保持收集顺序与输入顺序一致。
      pressed.push(m)
    }
    // 等待并返回 `fn()`，调用方直接接收异步结果。
    return await fn()
  } finally {
    // 等待 `releasePressed(input, pressed)` 完成，再继续共享工具 executor的异步流程。
    await releasePressed(input, pressed)
  }
}

/**
 * Port of Cowork's `typeViaClipboard`. Sequence:
 *   1. Save the user's clipboard.
 *   2. Write our text.
 *   3. READ-BACK VERIFY — clipboard writes can silently fail. If the
 *      read-back doesn't match, never press Cmd+V (would paste junk).
 *   4. Cmd+V via keys().
 *   5. Sleep 100ms — battle-tested threshold for the paste-effect vs
 *      clipboard-restore race. Restoring too soon means the target app
 *      pastes the RESTORED content.
 *   6. Restore — in a `finally`, so a throw between 2-5 never leaves the
 *      user's clipboard clobbered. Restore failures are swallowed.
 */
// typeViaClipboard 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function typeViaClipboard(input: Input, text: string): Promise<void> {
  // saved 先占位，稍后的条件分支会根据实际输入补齐它。
  let saved: string | undefined
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // saved更新为 `await readClipboardViaPbpaste()`，确保共享工具后续读取最新状态。
    saved = await readClipboardViaPbpaste()
  } catch {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[computer-use] pbpaste before paste failed; proceeding without restore',
    )
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeClipboardViaPbcopy(text)` 完成，再继续共享工具 executor的异步流程。
    await writeClipboardViaPbcopy(text)
    // `(await readClipboardViaPbpaste())` 与 `text` 不一致时刷新派生状态，避免使用过期结果。
    if ((await readClipboardViaPbpaste()) !== text) {
      // 抛出 new Error('Clipboard write did not round-trip.')，阻止共享工具在无效状态下继续运行。
      throw new Error('Clipboard write did not round-trip.')
    }
    // 等待 `input.keys(['command', 'v'])` 完成，再继续共享工具 executor的异步流程。
    await input.keys(['command', 'v'])
    // 等待 `sleep(100)` 完成，再继续共享工具 executor的异步流程。
    await sleep(100)
  } finally {
    // 当 `typeof saved` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof saved === 'string') {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `writeClipboardViaPbcopy(saved)` 完成，再继续共享工具 executor的异步流程。
        await writeClipboardViaPbcopy(saved)
      } catch {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[computer-use] clipboard restore after paste failed')
      }
    }
  }
}

/**
 * Port of Cowork's `animateMouseMovement` + `animatedMove`. Ease-out-cubic at
 * 60fps; distance-proportional duration at 2000 px/sec, capped at 0.5s. When
 * the sub-gate is off (or distance < ~2 frames), falls through to
 * `moveAndSettle`. Called only from `drag` for the press→to motion — target
 * apps may watch for `.leftMouseDragged` specifically (not just "button down +
 * position changed") and the slow motion gives them time to process
 * intermediate positions (scrollbars, window resizes).
 */
// animatedMove 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function animatedMove(
  input: Input,
  targetX: number,
  targetY: number,
  mouseAnimationEnabled: boolean,
): Promise<void> {
  // mouseAnimationEnabled缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!mouseAnimationEnabled) {
    // 等待 `moveAndSettle(input, targetX, targetY)` 完成，再继续共享工具 executor的异步流程。
    await moveAndSettle(input, targetX, targetY)
    // 共享工具 executor在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // start保存`input.mouseLocation`，供共享工具后续处理使用。
  const start = await input.mouseLocation()
  // deltaX 命名 `targetX - start.x`，让后续代码直接表达这个值的用途。
  const deltaX = targetX - start.x
  // deltaY 命名 `targetY - start.y`，让后续代码直接表达这个值的用途。
  const deltaY = targetY - start.y
  // distance保存`Math.hypot`，供共享工具后续处理使用。
  const distance = Math.hypot(deltaX, deltaY)
  // 满足 `distance < 1` 时，共享工具执行该分支。
  if (distance < 1) return
  // durationSec保存`Math.min`，供共享工具后续处理使用。
  const durationSec = Math.min(distance / 2000, 0.5)
  // 满足 `durationSec < 0.03` 时，共享工具执行该分支。
  if (durationSec < 0.03) {
    // 等待 `moveAndSettle(input, targetX, targetY)` 完成，再继续共享工具 executor的异步流程。
    await moveAndSettle(input, targetX, targetY)
    // 共享工具 executor在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // frameRate保存`60`，供后续判断或组装使用。
  const frameRate = 60
  // frameIntervalMs 集合 命名 `1000 / frameRate`，让后续代码直接表达这个值的用途。
  const frameIntervalMs = 1000 / frameRate
  // totalFrames 集合保存`Math.floor`，供共享工具后续处理使用。
  const totalFrames = Math.floor(durationSec * frameRate)
  // 循环处理 `let frame = 1; frame <= totalFrames; frame++`，让共享工具逐项把同类条目按顺序走完。
  for (let frame = 1; frame <= totalFrames; frame++) {
    // t保存`frame / totalFrames`，供共享工具 executor后续判断或输出使用。
    const t = frame / totalFrames
    // eased保存`Math.pow`，供共享工具后续处理使用。
    const eased = 1 - Math.pow(1 - t, 3)
    // 等待 `input.moveMouse(` 完成，再继续共享工具 executor的异步流程。
    await input.moveMouse(
      Math.round(start.x + deltaX * eased),
      Math.round(start.y + deltaY * eased),
      false,
    )
    // 满足 `frame < totalFrames` 时，共享工具执行该分支。
    if (frame < totalFrames) {
      // 等待 `sleep(frameIntervalMs)` 完成，再继续共享工具 executor的异步流程。
      await sleep(frameIntervalMs)
    }
  }
  // Last frame has no trailing sleep — same HID round-trip before the
  // caller's mouseButton reads NSEvent.mouseLocation.
  // 等待 `sleep(MOVE_SETTLE_MS)` 完成，再继续共享工具 executor的异步流程。
  await sleep(MOVE_SETTLE_MS)
}

// ── Factory ───────────────────────────────────────────────────────────────

// createCliExecutor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createCliExecutor(opts: {
  // 这个回调绑定到 getMouseAnimationEnabled: () => boolean，负责共享工具在该局部场景下的响应。
  getMouseAnimationEnabled: () => boolean
  // 这个回调绑定到 getHideBeforeActionEnabled: () => boolean，负责共享工具在该局部场景下的响应。
  getHideBeforeActionEnabled: () => boolean
}): ComputerExecutor {
  // `process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin') {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `createCliExecutor called on ${process.platform}. Computer control is macOS-only.`,
    )
  }

  // Swift loaded once at factory time — every executor method needs it.
  // Input loaded lazily via requireComputerUseInput() on first mouse/keyboard
  // call — it caches internally, so screenshot-only flows never pull the
  // enigo .node.
  // cu保存`requireComputerUseSwift`，供共享工具后续处理使用。
  const cu = requireComputerUseSwift()

  // 从 `opts` 解构 getMouseAnimationEnabled、getHideBeforeActionEnabled，减少共享工具 executor对同一对象的重复访问。
  const { getMouseAnimationEnabled, getHideBeforeActionEnabled } = opts
  // terminalBundleId读取`getTerminalBundleId`，供共享工具后续处理使用。
  const terminalBundleId = getTerminalBundleId()
  // surrogateHost保存`terminalBundleId ?? CLI_HOST_BUNDLE_ID`，供后续判断或组装使用。
  const surrogateHost = terminalBundleId ?? CLI_HOST_BUNDLE_ID
  // Swift 0.2.1's captureExcluding/captureRegion take an ALLOW list despite the
  // name (apps#30355 — complement computed Swift-side against running apps).
  // The terminal isn't in the user's grants so it's naturally excluded, but if
  // the package ever passes it through we strip it here so the terminal never
  // photobombs a screenshot.
  // withoutTerminal封装成回调，供共享工具 executor在事件触发或异步步骤中调用。
  const withoutTerminal = (allowed: readonly string[]): string[] =>
    terminalBundleId === null
      ? [...allowed]
      // 这个回调绑定到 : allowed.filter(id => id !== terminalBundleId)，负责共享工具在该局部场景下的响应。
      : allowed.filter(id => id !== terminalBundleId)

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    terminalBundleId
      ? `[computer-use] terminal ${terminalBundleId} → surrogate host (hide-exempt, activate-skip, screenshot-excluded)`
      : '[computer-use] terminal not detected; falling back to sentinel host',
  )

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    capabilities: {
      ...CLI_CU_CAPABILITIES,
      hostBundleId: CLI_HOST_BUNDLE_ID,
    },

    // ── Pre-action sequence (hide + defocus) ────────────────────────────

    // 共享工具 executor在这里处理 `async prepareForAction(`，完成这一小步状态转换。
    async prepareForAction(
      allowlistBundleIds: string[],
      displayId?: number,
    ): Promise<string[]> {
      // 满足 `!getHideBeforeActionEnabled()` 时，共享工具执行该分支。
      if (!getHideBeforeActionEnabled()) {
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
      }
      // prepareDisplay isn't @MainActor (plain Task{}), but its .hide() calls
      // trigger window-manager events that queue on CFRunLoop. Without the
      // pump, those pile up during Swift's ~1s of usleeps and flush all at
      // once when the next pumped call runs — visible window flashing.
      // Electron drains CFRunLoop continuously so Cowork doesn't see this.
      // Worst-case 100ms + 5×200ms safety-net ≈ 1.1s, well under the 30s
      // drainRunLoop ceiling.
      //
      // "Continue with action execution even if switching fails" — the
      // frontmost gate in toolCalls.ts catches any actual unsafe state.
      // 返回 `drainRunLoop(async () => {`，作为共享工具这次计算的结果。
      return drainRunLoop(async () => {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 结果保存`apps.prepareDisplay`，供共享工具后续处理使用。
          const result = await cu.apps.prepareDisplay(
            allowlistBundleIds,
            surrogateHost,
            displayId,
          )
          // 满足 `result.activated` 时，共享工具执行该分支。
          if (result.activated) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[computer-use] prepareForAction: activated ${result.activated}`,
            )
          }
          // 返回 `result.hidden`，作为共享工具这次计算的结果。
          return result.hidden
        } catch (err) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[computer-use] prepareForAction failed; continuing to action: ${errorMessage(err)}`,
            { level: 'warn' },
          )
          // 返回列表结果，保留共享工具已经排好的条目顺序。
          return []
        }
      })
    },

    // 共享工具 executor在这里处理 `async previewHideSet(`，完成这一小步状态转换。
    async previewHideSet(
      allowlistBundleIds: string[],
      displayId?: number,
    ): Promise<Array<{ bundleId: string; displayName: string }>> {
      // 返回 `cu.apps.previewHideSet(`，作为共享工具这次计算的结果。
      return cu.apps.previewHideSet(
        [...allowlistBundleIds, surrogateHost],
        displayId,
      )
    },

    // ── Display ──────────────────────────────────────────────────────────

    // getDisplaySize 根据 displayId?: number 读取或计算共享工具需要的结果。
    async getDisplaySize(displayId?: number): Promise<DisplayGeometry> {
      // 返回 `cu.display.getSize(displayId)`，作为共享工具这次计算的结果。
      return cu.display.getSize(displayId)
    },

    // listDisplays 使用 无 完成共享工具里的对应操作。
    async listDisplays(): Promise<DisplayGeometry[]> {
      // 返回 `cu.display.listAll()`，作为共享工具这次计算的结果。
      return cu.display.listAll()
    },

    async findWindowDisplays(
      bundleIds: string[],
    ): Promise<Array<{ bundleId: string; displayIds: number[] }>> {
      // 返回 `cu.apps.findWindowDisplays(bundleIds)`，作为共享工具这次计算的结果。
      return cu.apps.findWindowDisplays(bundleIds)
    },

    // 共享工具 executor在这里处理 `async resolvePrepareCapture(opts: {`，完成这一小步状态转换。
    async resolvePrepareCapture(opts: {
      allowedBundleIds: string[]
      preferredDisplayId?: number
      autoResolve: boolean
      doHide?: boolean
    }): Promise<ResolvePrepareCaptureResult> {
      // d读取`display.getSize`，供共享工具后续处理使用。
      const d = cu.display.getSize(opts.preferredDisplayId)
      // 从 `computeTargetDims(` 按位置拆出 targetW、targetH，让共享工具 executor分别处理这些返回值。
      const [targetW, targetH] = computeTargetDims(
        d.width,
        d.height,
        d.scaleFactor,
      )
      // 返回 `drainRunLoop(() =>`，作为共享工具这次计算的结果。
      return drainRunLoop(() =>
        cu.resolvePrepareCapture(
          withoutTerminal(opts.allowedBundleIds),
          surrogateHost,
          SCREENSHOT_JPEG_QUALITY,
          targetW,
          targetH,
          opts.preferredDisplayId,
          opts.autoResolve,
          opts.doHide,
        ),
      )
    },

    /**
     * Pre-size to `targetImageSize` output so the API transcoder's early-return
     * fires — no server-side resize, `scaleCoord` stays coherent. See
     * packages/desktop/computer-use-mcp/COORDINATES.md.
     */
    // 共享工具 executor在这里处理 `async screenshot(opts: {`，完成这一小步状态转换。
    async screenshot(opts: {
      allowedBundleIds: string[]
      displayId?: number
    }): Promise<ScreenshotResult> {
      // d读取`display.getSize`，供共享工具后续处理使用。
      const d = cu.display.getSize(opts.displayId)
      // 从 `computeTargetDims(` 按位置拆出 targetW、targetH，让共享工具 executor分别处理这些返回值。
      const [targetW, targetH] = computeTargetDims(
        d.width,
        d.height,
        d.scaleFactor,
      )
      // 返回 `drainRunLoop(() =>`，作为共享工具这次计算的结果。
      return drainRunLoop(() =>
        cu.screenshot.captureExcluding(
          withoutTerminal(opts.allowedBundleIds),
          SCREENSHOT_JPEG_QUALITY,
          targetW,
          targetH,
          opts.displayId,
        ),
      )
    },

    // 共享工具 executor在这里处理 `async zoom(`，完成这一小步状态转换。
    async zoom(
      regionLogical: { x: number; y: number; w: number; h: number },
      allowedBundleIds: string[],
      displayId?: number,
    ): Promise<{ base64: string; width: number; height: number }> {
      // d读取`display.getSize`，供共享工具后续处理使用。
      const d = cu.display.getSize(displayId)
      // 从 `computeTargetDims(` 按位置拆出 outW、outH，让共享工具 executor分别处理这些返回值。
      const [outW, outH] = computeTargetDims(
        regionLogical.w,
        regionLogical.h,
        d.scaleFactor,
      )
      // 返回 `drainRunLoop(() =>`，作为共享工具这次计算的结果。
      return drainRunLoop(() =>
        cu.screenshot.captureRegion(
          withoutTerminal(allowedBundleIds),
          regionLogical.x,
          regionLogical.y,
          regionLogical.w,
          regionLogical.h,
          outW,
          outH,
          SCREENSHOT_JPEG_QUALITY,
          displayId,
        ),
      )
    },

    // ── Keyboard ─────────────────────────────────────────────────────────

    /**
     * xdotool-style sequence e.g. "ctrl+shift+a" → split on '+' and pass to
     * keys(). keys() dispatches to DispatchQueue.main — drainRunLoop pumps
     * CFRunLoop so it resolves. Rust's error-path cleanup (enigo_wrap.rs)
     * releases modifiers on each invocation, so a mid-loop throw leaves
     * nothing stuck. 8ms between iterations — 125Hz USB polling cadence.
     */
    // key 使用 keySequence: string, repeat?: number 完成共享工具里的对应操作。
    async key(keySequence: string, repeat?: number): Promise<void> {
      // 用户输入保存`requireComputerUseInput`，供共享工具后续处理使用。
      const input = requireComputerUseInput()
      // 片段列表格式化`keySequence.split`，供共享工具后续处理使用。
      const parts = keySequence.split('+').filter(p => p.length > 0)
      // Bare-only: the CGEventTap checks event.flags.isEmpty so ctrl+escape
      // etc. pass through without aborting.
      // isEsc记录 `isBareEscape` 是否成立，共享工具随后按该结果分支。
      const isEsc = isBareEscape(parts)
      // n 命名 `repeat ?? 1`，让后续代码直接表达这个值的用途。
      const n = repeat ?? 1
      // 这个回调绑定到 await drainRunLoop(async () => {，负责共享工具在该局部场景下的响应。
      await drainRunLoop(async () => {
        // 按索引扫描 `n`，需要消费相邻参数时可以精确移动游标。
        for (let i = 0; i < n; i++) {
          // 满足 `i > 0` 时，共享工具执行该分支。
          if (i > 0) {
            // 等待 `sleep(8)` 完成，再继续共享工具 executor的异步流程。
            await sleep(8)
          }
          // 满足 `isEsc` 时，共享工具执行该分支。
          if (isEsc) {
            // 调用 notifyExpectedEscape，触发共享工具此处需要的副作用。
            notifyExpectedEscape()
          }
          // 等待 `input.keys(parts)` 完成，再继续共享工具 executor的异步流程。
          await input.keys(parts)
        }
      })
    },

    // holdKey 使用 keyNames: string[], durationMs: number 完成共享工具里的对应操作。
    async holdKey(keyNames: string[], durationMs: number): Promise<void> {
      // 用户输入保存`requireComputerUseInput`，供共享工具后续处理使用。
      const input = requireComputerUseInput()
      // Press/release each wrapped in drainRunLoop; the sleep sits outside so
      // durationMs isn't bounded by drainRunLoop's 30s timeout. `pressed`
      // tracks which presses landed so a mid-press throw still releases
      // everything that was actually pressed.
      //
      // `orphaned` guards against a timeout-orphan race: if the press-phase
      // drainRunLoop times out while the esc-hotkey pump-retain keeps the
      // pump running, the orphaned lambda would continue pushing to `pressed`
      // after finally's releasePressed snapshotted the length — leaving keys
      // stuck. The flag stops the lambda at the next iteration.
      // pressed 从空数组开始收集，后续循环会按处理顺序追加条目。
      const pressed: string[] = []
      // orphaned标记共享工具 executor是否启用对应路径。
      let orphaned = false
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 这个回调绑定到 await drainRunLoop(async () => {，负责共享工具在该局部场景下的响应。
        await drainRunLoop(async () => {
          // 按顺序遍历 `keyNames` 中的k，逐个交给共享工具处理。
          for (const k of keyNames) {
            // 满足 `orphaned` 时，共享工具执行该分支。
            if (orphaned) return
            // Bare Escape: notify the CGEventTap so it doesn't fire the
            // abort callback for a model-synthesized press. Same as key().
            // 满足 `isBareEscape([k])` 时，共享工具执行该分支。
            if (isBareEscape([k])) {
              // 调用 notifyExpectedEscape，触发共享工具此处需要的副作用。
              notifyExpectedEscape()
            }
            // 等待 `input.key(k, 'press')` 完成，再继续共享工具 executor的异步流程。
            await input.key(k, 'press')
            // pressed追加新条目，保持收集顺序与输入顺序一致。
            pressed.push(k)
          }
        })
        // 等待 `sleep(durationMs)` 完成，再继续共享工具 executor的异步流程。
        await sleep(durationMs)
      } finally {
        // orphaned更新为 `true`，确保共享工具后续读取最新状态。
        orphaned = true
        // 这个回调绑定到 await drainRunLoop(() => releasePressed(input, pressed))，负责共享工具在该局部场景下的响应。
        await drainRunLoop(() => releasePressed(input, pressed))
      }
    },

    // type 使用 text: string, opts: { viaClipboard: boolean } 完成共享工具里的对应操作。
    async type(text: string, opts: { viaClipboard: boolean }): Promise<void> {
      // 用户输入保存`requireComputerUseInput`，供共享工具后续处理使用。
      const input = requireComputerUseInput()
      // 满足 `opts.viaClipboard` 时，共享工具执行该分支。
      if (opts.viaClipboard) {
        // keys(['command','v']) inside needs the pump.
        // 这个回调绑定到 await drainRunLoop(() => typeViaClipboard(input, text))，负责共享工具在该局部场景下的响应。
        await drainRunLoop(() => typeViaClipboard(input, text))
        // 共享工具 executor在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // `toolCalls.ts` handles the grapheme loop + 8ms sleeps and calls this
      // once per grapheme. typeText doesn't dispatch to the main queue.
      // 等待 `input.typeText(text)` 完成，再继续共享工具 executor的异步流程。
      await input.typeText(text)
    },

    readClipboard: readClipboardViaPbpaste,

    writeClipboard: writeClipboardViaPbcopy,

    // ── Mouse ────────────────────────────────────────────────────────────

    // moveMouse 使用 x: number, y: number 完成共享工具里的对应操作。
    async moveMouse(x: number, y: number): Promise<void> {
      // 等待 `moveAndSettle(requireComputerUseInput(), x, y)` 完成，再继续共享工具 executor的异步流程。
      await moveAndSettle(requireComputerUseInput(), x, y)
    },

    /**
     * Move, then click. Modifiers are press/release bracketed via withModifiers
     * — same pattern as Cowork. AppKit computes NSEvent.clickCount from timing
     * + position proximity, so double/triple click work without setting the
     * CGEvent clickState field. key() inside withModifiers needs the pump;
     * the modifier-less path doesn't.
     */
    // 共享工具 executor在这里处理 `async click(`，完成这一小步状态转换。
    async click(
      x: number,
      y: number,
      button: 'left' | 'right' | 'middle',
      count: 1 | 2 | 3,
      modifiers?: string[],
    ): Promise<void> {
      // 用户输入保存`requireComputerUseInput`，供共享工具后续处理使用。
      const input = requireComputerUseInput()
      // 等待 `moveAndSettle(input, x, y)` 完成，再继续共享工具 executor的异步流程。
      await moveAndSettle(input, x, y)
      // 只有 `modifiers && modifiers.length > 0` 满足时，共享工具才执行该分支。
      if (modifiers && modifiers.length > 0) {
        // 这个回调绑定到 await drainRunLoop(() =>，负责共享工具在该局部场景下的响应。
        await drainRunLoop(() =>
          // 调用 withModifiers，触发共享工具此处需要的副作用。
          withModifiers(input, modifiers, () =>
            input.mouseButton(button, 'click', count),
          ),
        )
      } else {
        // 等待 `input.mouseButton(button, 'click', count)` 完成，再继续共享工具 executor的异步流程。
        await input.mouseButton(button, 'click', count)
      }
    },

    // mouseDown 使用 无 完成共享工具里的对应操作。
    async mouseDown(): Promise<void> {
      // 等待 `requireComputerUseInput().mouseButton('left', 'press')` 完成，再继续共享工具 executor的异步流程。
      await requireComputerUseInput().mouseButton('left', 'press')
    },

    // mouseUp 使用 无 完成共享工具里的对应操作。
    async mouseUp(): Promise<void> {
      // 等待 `requireComputerUseInput().mouseButton('left', 'release')` 完成，再继续共享工具 executor的异步流程。
      await requireComputerUseInput().mouseButton('left', 'release')
    },

    // getCursorPosition不依赖额外参数，直接计算共享工具需要的结果。
    async getCursorPosition(): Promise<{ x: number; y: number }> {
      // 返回 `requireComputerUseInput().mouseLocation()`，作为共享工具这次计算的结果。
      return requireComputerUseInput().mouseLocation()
    },

    /**
     * `from === undefined` → drag from current cursor (training's
     * left_click_drag with start_coordinate omitted). Inner `finally`: the
     * button is ALWAYS released even if the move throws — otherwise the
     * user's left button is stuck-pressed until they physically click.
     * 50ms sleep after press: enigo's move_mouse reads NSEvent.pressedMouseButtons
     * to decide .leftMouseDragged vs .mouseMoved; the synthetic leftMouseDown
     * needs a HID-tap round-trip to show up there.
     */
    // 共享工具 executor在这里处理 `async drag(`，完成这一小步状态转换。
    async drag(
      from: { x: number; y: number } | undefined,
      to: { x: number; y: number },
    ): Promise<void> {
      // 用户输入保存`requireComputerUseInput`，供共享工具后续处理使用。
      const input = requireComputerUseInput()
      // `from` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (from !== undefined) {
        // 等待 `moveAndSettle(input, from.x, from.y)` 完成，再继续共享工具 executor的异步流程。
        await moveAndSettle(input, from.x, from.y)
      }
      // 等待 `input.mouseButton('left', 'press')` 完成，再继续共享工具 executor的异步流程。
      await input.mouseButton('left', 'press')
      // 等待 `sleep(MOVE_SETTLE_MS)` 完成，再继续共享工具 executor的异步流程。
      await sleep(MOVE_SETTLE_MS)
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `animatedMove(input, to.x, to.y, getMouseAnimationEnabled())` 完成，再继续共享工具 executor的异步流程。
        await animatedMove(input, to.x, to.y, getMouseAnimationEnabled())
      } finally {
        // 等待 `input.mouseButton('left', 'release')` 完成，再继续共享工具 executor的异步流程。
        await input.mouseButton('left', 'release')
      }
    },

    /**
     * Move first, then scroll each axis. Vertical-first — it's the common
     * axis; a horizontal failure shouldn't lose the vertical.
     */
    // scroll 使用 x: number, y: number, dx: number, dy: number 完成共享工具里的对应操作。
    async scroll(x: number, y: number, dx: number, dy: number): Promise<void> {
      // 用户输入保存`requireComputerUseInput`，供共享工具后续处理使用。
      const input = requireComputerUseInput()
      // 等待 `moveAndSettle(input, x, y)` 完成，再继续共享工具 executor的异步流程。
      await moveAndSettle(input, x, y)
      // `dy` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (dy !== 0) {
        // 等待 `input.mouseScroll(dy, 'vertical')` 完成，再继续共享工具 executor的异步流程。
        await input.mouseScroll(dy, 'vertical')
      }
      // `dx` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (dx !== 0) {
        // 等待 `input.mouseScroll(dx, 'horizontal')` 完成，再继续共享工具 executor的异步流程。
        await input.mouseScroll(dx, 'horizontal')
      }
    },

    // ── App management ───────────────────────────────────────────────────

    // getFrontmostApp不依赖额外参数，直接计算共享工具需要的结果。
    async getFrontmostApp(): Promise<FrontmostApp | null> {
      // info保存`requireComputerUseInput`，供共享工具后续处理使用。
      const info = requireComputerUseInput().getFrontmostAppInfo()
      // 只有 `!info || !info.bundleId` 满足时，共享工具才执行该分支。
      if (!info || !info.bundleId) return null
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { bundleId: info.bundleId, displayName: info.appName }
    },

    // 共享工具 executor在这里处理 `async appUnderPoint(`，完成这一小步状态转换。
    async appUnderPoint(
      x: number,
      y: number,
    ): Promise<{ bundleId: string; displayName: string } | null> {
      // 返回 `cu.apps.appUnderPoint(x, y)`，作为共享工具这次计算的结果。
      return cu.apps.appUnderPoint(x, y)
    },

    // listInstalledApps 使用 无 完成共享工具里的对应操作。
    async listInstalledApps(): Promise<InstalledApp[]> {
      // `ComputerUseInstalledApp` is `{bundleId, displayName, path}`.
      // `InstalledApp` adds optional `iconDataUrl` — left unpopulated;
      // the approval dialog fetches lazily via getAppIcon() below.
      // 返回 `drainRunLoop(() => cu.apps.listInstalled())`，作为共享工具这次计算的结果。
      return drainRunLoop(() => cu.apps.listInstalled())
    },

    // getAppIcon 根据 path: string 读取或计算共享工具需要的结果。
    async getAppIcon(path: string): Promise<string | undefined> {
      // 返回 `cu.apps.iconDataUrl(path) ?? undefined`，作为共享工具这次计算的结果。
      return cu.apps.iconDataUrl(path) ?? undefined
    },

    // listRunningApps 使用 无 完成共享工具里的对应操作。
    async listRunningApps(): Promise<RunningApp[]> {
      // 返回 `cu.apps.listRunning()`，作为共享工具这次计算的结果。
      return cu.apps.listRunning()
    },

    // openApp 使用 bundleId: string 完成共享工具里的对应操作。
    async openApp(bundleId: string): Promise<void> {
      // 等待 `cu.apps.open(bundleId)` 完成，再继续共享工具 executor的异步流程。
      await cu.apps.open(bundleId)
    },
  }
}

/**
 * Module-level export (not on the executor object) — called at turn-end from
 * `stopHooks.ts` / `query.ts`, outside the executor lifecycle. Fire-and-forget
 * at the call site; the caller `.catch()`es.
 */
// unhideComputerUseApps 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function unhideComputerUseApps(
  bundleIds: readonly string[],
): Promise<void> {
  // bundleIds 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (bundleIds.length === 0) return
  // cu保存`requireComputerUseSwift`，供共享工具后续处理使用。
  const cu = requireComputerUseSwift()
  // 等待 `cu.apps.unhide([...bundleIds])` 完成，再继续共享工具 executor的异步流程。
  await cu.apps.unhide([...bundleIds])
}

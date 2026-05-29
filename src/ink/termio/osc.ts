/**
 * OSC (Operating System Command) Types and Parser
 */

// 引入 Buffer，将 buffer 中已经封装好的能力接到本文件流程里。
import { Buffer } from 'buffer'
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
// 引入 BEL、ESC、ESC_TYPE、SEP，将 ./ansi.js 中已经封装好的能力接到本文件流程里。
import { BEL, ESC, ESC_TYPE, SEP } from './ansi.js'
// 类型依赖 { Action, Color, TabStatusAction } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { Action, Color, TabStatusAction } from './types.js'

// OSC_PREFIX保存`String.fromCharCode`，供终端渲染后续处理使用。
export const OSC_PREFIX = ESC + String.fromCharCode(ESC_TYPE.OSC)

/** String Terminator (ESC \) - alternative to BEL for terminating OSC */
// ST保存`ESC + '\\'`，供Ink 渲染层 osc后续判断或输出使用。
export const ST = ESC + '\\'

/** Generate an OSC sequence: ESC ] p1;p2;...;pN <terminator>
 * Uses ST terminator for Kitty (avoids beeps), BEL for others */
// osc 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function osc(...parts: (string | number)[]): string {
  // terminator标记Ink 渲染层 osc是否启用对应路径。
  const terminator = env.terminal === 'kitty' ? ST : BEL
  // 返回 ``${OSC_PREFIX}${parts.join(SEP)}${terminator}``，作为终端渲染这次计算的结果。
  return `${OSC_PREFIX}${parts.join(SEP)}${terminator}`
}

/**
 * Wrap an escape sequence for terminal multiplexer passthrough.
 * tmux and GNU screen intercept escape sequences; DCS passthrough
 * tunnels them to the outer terminal unmodified.
 *
 * tmux 3.3+ gates this behind `allow-passthrough` (default off). When off,
 * tmux silently drops the whole DCS — no junk, no worse than unwrapped OSC.
 * Users who want passthrough set it in their .tmux.conf; we don't mutate it.
 *
 * Do NOT wrap BEL: raw \x07 triggers tmux's bell-action (window flag);
 * wrapped \x07 is opaque DCS payload and tmux never sees the bell.
 */
// wrapForMultiplexer 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function wrapForMultiplexer(sequence: string): string {
  // 满足 `process.env['TMUX']` 时，终端渲染执行该分支。
  if (process.env['TMUX']) {
    // escaped格式化`sequence.replaceAll`，供终端渲染后续处理使用。
    const escaped = sequence.replaceAll('\x1b', '\x1b\x1b')
    // 返回 ``\x1bPtmux;${escaped}\x1b\\``，作为终端渲染这次计算的结果。
    return `\x1bPtmux;${escaped}\x1b\\`
  }
  // 满足 `process.env['STY']` 时，终端渲染执行该分支。
  if (process.env['STY']) {
    // 返回 ``\x1bP${sequence}\x1b\\``，作为终端渲染这次计算的结果。
    return `\x1bP${sequence}\x1b\\`
  }
  // 返回 `sequence`，作为终端渲染这次计算的结果。
  return sequence
}

/**
 * Which path setClipboard() will take, based on env state. Synchronous so
 * callers can show an honest toast without awaiting the copy itself.
 *
 * - 'native': pbcopy (or equivalent) will run — high-confidence system
 *   clipboard write. tmux buffer may also be loaded as a bonus.
 * - 'tmux-buffer': tmux load-buffer will run, but no native tool — paste
 *   with prefix+] works. System clipboard depends on tmux's set-clipboard
 *   option + outer terminal OSC 52 support; can't know from here.
 * - 'osc52': only the raw OSC 52 sequence will be written to stdout.
 *   Best-effort; iTerm2 disables OSC 52 by default.
 *
 * pbcopy gating uses SSH_CONNECTION specifically, not SSH_TTY — tmux panes
 * inherit SSH_TTY forever even after local reattach, but SSH_CONNECTION is
 * in tmux's default update-environment set and gets cleared.
 */
// ClipboardPath 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClipboardPath = 'native' | 'tmux-buffer' | 'osc52'

// getClipboardPath 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClipboardPath(): ClipboardPath {
  // nativeAvailable 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const nativeAvailable =
    process.platform === 'darwin' && !process.env['SSH_CONNECTION']
  // 满足 `nativeAvailable` 时，终端渲染执行该分支。
  if (nativeAvailable) return 'native'
  // 满足 `process.env['TMUX']` 时，终端渲染执行该分支。
  if (process.env['TMUX']) return 'tmux-buffer'
  // 返回 `'osc52'`，作为终端渲染这次计算的结果。
  return 'osc52'
}

/**
 * Wrap a payload in tmux's DCS passthrough: ESC P tmux ; <payload> ESC \
 * tmux forwards the payload to the outer terminal, bypassing its own parser.
 * Inner ESCs must be doubled. Requires `set -g allow-passthrough on` in
 * ~/.tmux.conf; without it, tmux silently drops the whole DCS (no regression).
 */
// tmuxPassthrough 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function tmuxPassthrough(payload: string): string {
  // 返回 ``${ESC}Ptmux;${payload.replaceAll(ESC, ESC + ESC)}${ST}``，作为终端渲染这次计算的结果。
  return `${ESC}Ptmux;${payload.replaceAll(ESC, ESC + ESC)}${ST}`
}

/**
 * Load text into tmux's paste buffer via `tmux load-buffer`.
 * -w (tmux 3.2+) propagates to the outer terminal's clipboard via tmux's
 * own OSC 52 emission. -w is dropped for iTerm2: tmux's OSC 52 emission
 * crashes the iTerm2 session over SSH.
 *
 * Returns true if the buffer was loaded successfully.
 */
// tmuxLoadBuffer 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function tmuxLoadBuffer(text: string): Promise<boolean> {
  // 满足 `!process.env['TMUX']` 时，终端渲染执行该分支。
  if (!process.env['TMUX']) return false
  // args 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const args =
    process.env['LC_TERMINAL'] === 'iTerm2'
      ? ['load-buffer', '-']
      : ['load-buffer', '-w', '-']
  // 从 `await execFileNoThrow('tmux', args, {` 解构 code，减少Ink 渲染层 osc对同一对象的重复访问。
  const { code } = await execFileNoThrow('tmux', args, {
    input: text,
    useCwd: false,
    timeout: 2000,
  })
  // 返回 `code === 0`，作为终端渲染这次计算的结果。
  return code === 0
}

/**
 * OSC 52 clipboard write: ESC ] 52 ; c ; <base64> BEL/ST
 * 'c' selects the clipboard (vs 'p' for primary selection on X11).
 *
 * When inside tmux ($TMUX set), `tmux load-buffer -w -` is the primary
 * path. tmux's buffer is always reachable — works over SSH, survives
 * detach/reattach, immune to stale env vars. The -w flag (tmux 3.2+) tells
 * tmux to also propagate to the outer terminal via its own OSC 52 path,
 * which tmux wraps correctly for the attached client. On older tmux, -w is
 * ignored and the buffer is still loaded. -w is dropped for iTerm2 (#22432)
 * because tmux's own OSC 52 emission (empty selection param: ESC]52;;b64)
 * crashes iTerm2 over SSH.
 *
 * After load-buffer succeeds, we ALSO return a DCS-passthrough-wrapped
 * OSC 52 for the caller to write to stdout. Our sequence uses explicit `c`
 * (not tmux's crashy empty-param variant), so it sidesteps the #22432 path.
 * With `allow-passthrough on` + an OSC-52-capable outer terminal, selection
 * reaches the system clipboard; with either off, tmux silently drops the
 * DCS and prefix+] still works. See Greg Smith's "free pony" in
 * https://anthropic.slack.com/archives/C07VBSHV7EV/p1773177228548119.
 *
 * If load-buffer fails entirely, fall through to raw OSC 52.
 *
 * Outside tmux, write raw OSC 52 to stdout (caller handles the write).
 *
 * Local (no SSH_CONNECTION): also shell out to a native clipboard utility.
 * OSC 52 and tmux -w both depend on terminal settings — iTerm2 disables
 * OSC 52 by default, VS Code shows a permission prompt on first use. Native
 * utilities (pbcopy/wl-copy/xclip/xsel/clip.exe) always work locally. Over
 * SSH these would write to the remote clipboard — OSC 52 is the right path there.
 *
 * Returns the sequence for the caller to write to stdout (raw OSC 52
 * outside tmux, DCS-wrapped inside).
 */
// setClipboard 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setClipboard(text: string): Promise<string> {
  // b64保存`Buffer.from`，供终端渲染后续处理使用。
  const b64 = Buffer.from(text, 'utf8').toString('base64')
  // 原始文本保存`osc`，供终端渲染后续处理使用。
  const raw = osc(OSC.CLIPBOARD, 'c', b64)

  // Native safety net — fire FIRST, before the tmux await, so a quick
  // focus-switch after selecting doesn't race pbcopy. Previously this ran
  // AFTER awaiting tmux load-buffer, adding ~50-100ms of subprocess latency
  // before pbcopy even started — fast cmd+tab → paste would beat it
  // (https://anthropic.slack.com/archives/C07VBSHV7EV/p1773943921788829).
  // Gated on SSH_CONNECTION (not SSH_TTY) since tmux panes inherit SSH_TTY
  // forever but SSH_CONNECTION is in tmux's default update-environment and
  // clears on local attach. Fire-and-forget.
  // 满足 `!process.env['SSH_CONNECTION']) copyNative(text` 时，终端渲染执行该分支。
  if (!process.env['SSH_CONNECTION']) copyNative(text)

  // tmuxBufferLoaded保存`tmuxLoadBuffer`，供终端渲染后续处理使用。
  const tmuxBufferLoaded = await tmuxLoadBuffer(text)

  // Inner OSC uses BEL directly (not osc()) — ST's ESC would need doubling
  // too, and BEL works everywhere for OSC 52.
  // 满足 `tmuxBufferLoaded) return tmuxPassthrough(`${ESC}]52;c;${b64}${BEL}`` 时，终端渲染执行该分支。
  if (tmuxBufferLoaded) return tmuxPassthrough(`${ESC}]52;c;${b64}${BEL}`)
  // 返回 `raw`，作为终端渲染这次计算的结果。
  return raw
}

// Linux clipboard tool: undefined = not yet probed, null = none available.
// Probe order: wl-copy (Wayland) → xclip (X11) → xsel (X11 fallback).
// Cached after first attempt so repeated mouse-ups skip the probe chain.
// linuxCopy 先占位，稍后的条件分支会根据实际输入补齐它。
let linuxCopy: 'wl-copy' | 'xclip' | 'xsel' | null | undefined

/**
 * Shell out to a native clipboard utility as a safety net for OSC 52.
 * Only called when not in an SSH session (over SSH, these would write to
 * the remote machine's clipboard — OSC 52 is the right path there).
 * Fire-and-forget: failures are silent since OSC 52 may have succeeded.
 */
// copyNative 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function copyNative(text: string): void {
  // opts 集合 集中保存Ink 渲染层 osc要一起传递的字段。
  const opts = { input: text, useCwd: false, timeout: 2000 }
  // 按照 process.platform 的取值选择终端渲染的具体处理分支。
  switch (process.platform) {
    case 'darwin':
      // 显式忽略 `execFileNoThrow('pbcopy', [], opts)` 的返回值，只保留它触发的副作用。
      void execFileNoThrow('pbcopy', [], opts)
      // Ink 渲染层 osc在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    case 'linux': {
      // 满足 `linuxCopy === null` 时，终端渲染执行该分支。
      if (linuxCopy === null) return
      // 当 `linuxCopy` 匹配 `'wl-copy'` 时，终端渲染执行对应分支。
      if (linuxCopy === 'wl-copy') {
        // 显式忽略 `execFileNoThrow('wl-copy', [], opts)` 的返回值，只保留它触发的副作用。
        void execFileNoThrow('wl-copy', [], opts)
        // Ink 渲染层 osc在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 当 `linuxCopy` 匹配 `'xclip'` 时，终端渲染执行对应分支。
      if (linuxCopy === 'xclip') {
        // 显式忽略 `execFileNoThrow('xclip', ['-selection', 'clipboard'], opts)` 的返回值，只保留它触发的副作用。
        void execFileNoThrow('xclip', ['-selection', 'clipboard'], opts)
        // Ink 渲染层 osc在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 当 `linuxCopy` 匹配 `'xsel'` 时，终端渲染执行对应分支。
      if (linuxCopy === 'xsel') {
        // 显式忽略 `execFileNoThrow('xsel', ['--clipboard', '--input'], opts)` 的返回值，只保留它触发的副作用。
        void execFileNoThrow('xsel', ['--clipboard', '--input'], opts)
        // Ink 渲染层 osc在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // First call: probe wl-copy (Wayland) then xclip/xsel (X11), cache winner.
      // 这个回调绑定到 void execFileNoThrow('wl-copy', [], opts).then(r => {，负责终端渲染在该局部场景下的响应。
      void execFileNoThrow('wl-copy', [], opts).then(r => {
        // 满足 `r.code === 0` 时，终端渲染执行该分支。
        if (r.code === 0) {
          // linuxCopy更新为 `'wl-copy'`，确保Ink 渲染层后续读取最新状态。
          linuxCopy = 'wl-copy'
          // Ink 渲染层 osc在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 显式忽略 `execFileNoThrow('xclip', ['-selection', 'clipboard'], opts).the...` 的返回值，只保留它触发的副作用。
        void execFileNoThrow('xclip', ['-selection', 'clipboard'], opts).then(
          // r2更新为 `> {`，确保Ink 渲染层后续读取最新状态。
          r2 => {
            // 满足 `r2.code === 0` 时，终端渲染执行该分支。
            if (r2.code === 0) {
              // linuxCopy更新为 `'xclip'`，确保Ink 渲染层后续读取最新状态。
              linuxCopy = 'xclip'
              // Ink 渲染层 osc在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // 显式忽略 `execFileNoThrow('xsel', ['--clipboard', '--input'], opts).then(` 的返回值，只保留它触发的副作用。
            void execFileNoThrow('xsel', ['--clipboard', '--input'], opts).then(
              // r3更新为 `> {`，确保Ink 渲染层后续读取最新状态。
              r3 => {
                // linuxCopy更新为 `r3.code === 0 ? 'xsel' : null`，确保Ink 渲染层后续读取最新状态。
                linuxCopy = r3.code === 0 ? 'xsel' : null
              },
            )
          },
        )
      })
      // Ink 渲染层 osc在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    case 'win32':
      // clip.exe is always available on Windows. Unicode handling is
      // imperfect (system locale encoding) but good enough for a fallback.
      // 显式忽略 `execFileNoThrow('clip', [], opts)` 的返回值，只保留它触发的副作用。
      void execFileNoThrow('clip', [], opts)
      // Ink 渲染层 osc在这里结束当前路径，避免继续执行不适用的后续分支。
      return
  }
}

/** @internal test-only */
// _resetLinuxCopyCache 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetLinuxCopyCache(): void {
  // linuxCopy更新为 `undefined`，确保Ink 渲染层后续读取最新状态。
  linuxCopy = undefined
}

/**
 * OSC command numbers
 */
// OSC 集中保存Ink 渲染层 osc要一起传递的字段。
export const OSC = {
  SET_TITLE_AND_ICON: 0,
  SET_ICON: 1,
  SET_TITLE: 2,
  SET_COLOR: 4,
  SET_CWD: 7,
  HYPERLINK: 8,
  ITERM2: 9, // iTerm2 proprietary sequences
  SET_FG_COLOR: 10,
  SET_BG_COLOR: 11,
  SET_CURSOR_COLOR: 12,
  CLIPBOARD: 52,
  KITTY: 99, // Kitty notification protocol
  RESET_COLOR: 104,
  RESET_FG_COLOR: 110,
  RESET_BG_COLOR: 111,
  RESET_CURSOR_COLOR: 112,
  SEMANTIC_PROMPT: 133,
  GHOSTTY: 777, // Ghostty notification protocol
  TAB_STATUS: 21337, // Tab status extension
} as const

/**
 * Parse an OSC sequence into an action
 *
 * @param content - The sequence content (without ESC ] and terminator)
 */
// parseOSC 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseOSC(content: string): Action | null {
  // semicolonIdx保存`content.indexOf`，供终端渲染后续处理使用。
  const semicolonIdx = content.indexOf(';')
  // 命令格式化`content.slice`，供终端渲染后续处理使用。
  const command = semicolonIdx >= 0 ? content.slice(0, semicolonIdx) : content
  // data格式化`content.slice`，供终端渲染后续处理使用。
  const data = semicolonIdx >= 0 ? content.slice(semicolonIdx + 1) : ''

  // commandNum 命令数据解析`parseInt`，供终端渲染后续处理使用。
  const commandNum = parseInt(command, 10)

  // Window/icon title
  // 满足 `commandNum === OSC.SET_TITLE_AND_ICON` 时，终端渲染执行该分支。
  if (commandNum === OSC.SET_TITLE_AND_ICON) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'title', action: { type: 'both', title: data } }
  }
  // 满足 `commandNum === OSC.SET_ICON` 时，终端渲染执行该分支。
  if (commandNum === OSC.SET_ICON) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'title', action: { type: 'iconName', name: data } }
  }
  // 满足 `commandNum === OSC.SET_TITLE` 时，终端渲染执行该分支。
  if (commandNum === OSC.SET_TITLE) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'title', action: { type: 'windowTitle', title: data } }
  }

  // Hyperlinks (OSC 8)
  // 满足 `commandNum === OSC.HYPERLINK` 时，终端渲染执行该分支。
  if (commandNum === OSC.HYPERLINK) {
    // 片段列表格式化`data.split`，供终端渲染后续处理使用。
    const parts = data.split(';')
    // paramsStr保存`parts[0] ?? ''`，供Ink 渲染层 osc后续判断或输出使用。
    const paramsStr = parts[0] ?? ''
    // URL格式化`parts.slice`，供终端渲染后续处理使用。
    const url = parts.slice(1).join(';')

    // 满足 `url === ''` 时，终端渲染执行该分支。
    if (url === '') {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { type: 'link', action: { type: 'end' } }
    }

    // params 集合 从空对象开始收集键值，后续按名称补齐内容。
    const params: Record<string, string> = {}
    // 满足 `paramsStr` 时，终端渲染执行该分支。
    if (paramsStr) {
      // 逐项读取 `paramsStr.split(':')` 中的pair，按输入顺序推进终端渲染。
      for (const pair of paramsStr.split(':')) {
        // eqIdx保存`pair.indexOf`，供终端渲染后续处理使用。
        const eqIdx = pair.indexOf('=')
        // 满足 `eqIdx >= 0` 时，终端渲染执行该分支。
        if (eqIdx >= 0) {
          // slice(0, eqIdx)更新为 `pair.slice(eqIdx + 1)`，确保Ink 渲染层 osc后续读取最新状态。
          params[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1)
        }
      }
    }

    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'link',
      action: {
        type: 'start',
        url,
        params: Object.keys(params).length > 0 ? params : undefined,
      },
    }
  }

  // Tab status (OSC 21337)
  // 满足 `commandNum === OSC.TAB_STATUS` 时，终端渲染执行该分支。
  if (commandNum === OSC.TAB_STATUS) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { type: 'tabStatus', action: parseTabStatus(data) }
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { type: 'unknown', sequence: `\x1b]${content}` }
}

/**
 * Parse an XParseColor-style color spec into an RGB Color.
 * Accepts `#RRGGBB` and `rgb:R/G/B` (1–4 hex digits per component, scaled
 * to 8-bit). Returns null on parse failure.
 */
// parseOscColor 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseOscColor(spec: string): Color | null {
  // hex匹配`spec.match`，供终端渲染后续处理使用。
  const hex = spec.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  // 满足 `hex` 时，终端渲染执行该分支。
  if (hex) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'rgb',
      r: parseInt(hex[1]!, 16),
      g: parseInt(hex[2]!, 16),
      b: parseInt(hex[3]!, 16),
    }
  }
  // rgb匹配`spec.match`，供终端渲染后续处理使用。
  const rgb = spec.match(
    /^rgb:([0-9a-f]{1,4})\/([0-9a-f]{1,4})\/([0-9a-f]{1,4})$/i,
  )
  // 满足 `rgb` 时，终端渲染执行该分支。
  if (rgb) {
    // XParseColor: N hex digits → value / (16^N - 1), scale to 0-255
    // scale封装成回调，供Ink 渲染层 osc在事件触发或异步步骤中调用。
    const scale = (s: string) =>
      Math.round((parseInt(s, 16) / (16 ** s.length - 1)) * 255)
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      type: 'rgb',
      r: scale(rgb[1]!),
      g: scale(rgb[2]!),
      b: scale(rgb[3]!),
    }
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null
}

/**
 * Parse OSC 21337 payload: `key=value;key=value;...` with `\;` and `\\`
 * escapes inside values. Bare key or `key=` clears that field; unknown
 * keys are ignored.
 */
// parseTabStatus 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseTabStatus(data: string): TabStatusAction {
  // action 从空对象开始收集键值，后续按名称补齐内容。
  const action: TabStatusAction = {}
  // 循环处理 `const [key, value] of splitTabStatusPairs(data)`，让终端渲染把同类条目按顺序走完。
  for (const [key, value] of splitTabStatusPairs(data)) {
    // 按照 key 的取值选择终端渲染的具体处理分支。
    switch (key) {
      case 'indicator':
        // indicator更新为 `value === '' ? null : parseOscColor(value)`，确保Ink 渲染层后续读取最新状态。
        action.indicator = value === '' ? null : parseOscColor(value)
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'status':
        // status 集合更新为 `value === '' ? null : value`，确保Ink 渲染层后续读取最新状态。
        action.status = value === '' ? null : value
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
      case 'status-color':
        // statusColor更新为 `value === '' ? null : parseOscColor(value)`，确保Ink 渲染层后续读取最新状态。
        action.statusColor = value === '' ? null : parseOscColor(value)
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break
    }
  }
  // 返回 `action`，作为终端渲染这次计算的结果。
  return action
}

/** Split `k=v;k=v` honoring `\;` and `\\` escapes. Yields [key, unescapedValue]. */
// Ink 渲染层 osc在这里处理 `function* splitTabStatusPairs(data: string): Generator<[string, string]...`，完成这一小步状态转换。
function* splitTabStatusPairs(data: string): Generator<[string, string]> {
  // key 命名 `''`，让后续代码直接表达这个值的用途。
  let key = ''
  // val 命名 `''`，让后续代码直接表达这个值的用途。
  let val = ''
  // inVal标记Ink 渲染层 osc是否启用对应路径。
  let inVal = false
  // esc标记Ink 渲染层 osc是否启用对应路径。
  let esc = false
  // 按顺序遍历 `data` 中的c，逐个交给终端渲染处理。
  for (const c of data) {
    // 满足 `esc` 时，终端渲染执行该分支。
    if (esc) {
      // 满足 `inVal` 时，终端渲染执行该分支。
      if (inVal) val += c
      else key += c
      // esc更新为 `false`，确保Ink 渲染层后续读取最新状态。
      esc = false
    // Ink 渲染层 osc在这里处理 `} else if (c === '\\') {`，完成这一小步状态转换。
    } else if (c === '\\') {
      // esc更新为 `true`，确保Ink 渲染层后续读取最新状态。
      esc = true
    // Ink 渲染层 osc在这里处理 `} else if (c === ';') {`，完成这一小步状态转换。
    } else if (c === ';') {
      // 生成器产出 `[key, val]`，把阶段性结果交给上层消费。
      yield [key, val]
      // key更新为 `''`，确保Ink 渲染层后续读取最新状态。
      key = ''
      // val更新为 `''`，确保Ink 渲染层后续读取最新状态。
      val = ''
      // inVal更新为 `false`，确保Ink 渲染层后续读取最新状态。
      inVal = false
    // Ink 渲染层 osc在这里处理 `} else if (c === '=' && !inVal) {`，完成这一小步状态转换。
    } else if (c === '=' && !inVal) {
      // inVal更新为 `true`，确保Ink 渲染层后续读取最新状态。
      inVal = true
    // Ink 渲染层 osc在这里处理 `} else if (inVal) {`，完成这一小步状态转换。
    } else if (inVal) {
      // Ink 渲染层 osc在这里处理 `val += c`，完成这一小步状态转换。
      val += c
    } else {
      // Ink 渲染层 osc在这里处理 `key += c`，完成这一小步状态转换。
      key += c
    }
  }
  // 只有 `key || inVal` 满足时，终端渲染才执行该分支。
  if (key || inVal) yield [key, val]
}

// Output generators

/** Start a hyperlink (OSC 8). Auto-assigns an id= param derived from the URL
 *  so terminals group wrapped lines of the same link together (the spec says
 *  cells with matching URI *and* nonempty id are joined; without an id each
 *  wrapped line is a separate link — inconsistent hover, partial tooltips).
 *  Empty url = close sequence (empty params per spec). */
// link 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function link(url: string, params?: Record<string, string>): string {
  // URL缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!url) return LINK_END
  // p保存`osc8Id`，供终端渲染后续处理使用。
  const p = { id: osc8Id(url), ...params }
  // paramStr派生`Object.entries`，供终端渲染后续处理使用。
  const paramStr = Object.entries(p)
    .map(([k, v]) => `${k}=${v}`)
    .join(':')
  // 返回 `osc(OSC.HYPERLINK, paramStr, url)`，作为终端渲染这次计算的结果。
  return osc(OSC.HYPERLINK, paramStr, url)
}

// osc8Id 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function osc8Id(url: string): string {
  // h 命名 `0`，让后续代码直接表达这个值的用途。
  let h = 0
  // 按索引扫描 `url.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < url.length; i++)
    // h更新为 `((h << 5) - h + url.charCodeAt(i)) | 0`，确保Ink 渲染层后续读取最新状态。
    h = ((h << 5) - h + url.charCodeAt(i)) | 0
  // 返回 `(h >>> 0).toString(36)`，作为终端渲染这次计算的结果。
  return (h >>> 0).toString(36)
}

/** End a hyperlink (OSC 8) */
// LINK_END保存`osc`，供终端渲染后续处理使用。
export const LINK_END = osc(OSC.HYPERLINK, '', '')

// iTerm2 OSC 9 subcommands

/** iTerm2 OSC 9 subcommand numbers */
// ITERM2 集中保存Ink 渲染层 osc要一起传递的字段。
export const ITERM2 = {
  NOTIFY: 0,
  BADGE: 2,
  PROGRESS: 4,
} as const

/** Progress operation codes (for use with ITERM2.PROGRESS) */
// PROGRESS 集合 集中保存Ink 渲染层 osc要一起传递的字段。
export const PROGRESS = {
  CLEAR: 0,
  SET: 1,
  ERROR: 2,
  INDETERMINATE: 3,
} as const

/**
 * Clear iTerm2 progress bar sequence (OSC 9;4;0;BEL)
 * Uses BEL terminator since this is for cleanup (not runtime notification)
 * and we want to ensure it's always sent regardless of terminal type.
 */
// CLEAR_ITERM2_PROGRESS 集合保存``${OSC_PREFIX}${OSC.ITERM2};${ITERM2.PROGRESS};${PROGRESS...`，作为后续固定文本处理的输入。
export const CLEAR_ITERM2_PROGRESS = `${OSC_PREFIX}${OSC.ITERM2};${ITERM2.PROGRESS};${PROGRESS.CLEAR};${BEL}`

/**
 * Clear terminal title sequence (OSC 0 with empty string + BEL).
 * Uses BEL terminator for cleanup — safe on all terminals.
 */
// CLEAR_TERMINAL_TITLE 标题固定为 ``${OSC_PREFIX}${OSC.SET_TITLE_AND_ICON};${BEL}``，作为Ink 渲染层 osc后续展示或比较的基准。
export const CLEAR_TERMINAL_TITLE = `${OSC_PREFIX}${OSC.SET_TITLE_AND_ICON};${BEL}`

/** Clear all three OSC 21337 tab-status fields. Used on exit. */
// CLEAR_TAB_STATUS 集合保存`osc`，供终端渲染后续处理使用。
export const CLEAR_TAB_STATUS = osc(
  OSC.TAB_STATUS,
  'indicator=;status=;status-color=',
)

/**
 * Gate for emitting OSC 21337 (tab-status indicator). Ant-only while the
 * spec is unstable. Terminals that don't recognize it discard silently, so
 * emission is safe unconditionally — we don't gate on terminal detection
 * since support is expected across several terminals.
 *
 * Callers must wrap output with wrapForMultiplexer() so tmux/screen
 * DCS-passthrough carries the sequence to the outer terminal.
 */
// supportsTabStatus 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function supportsTabStatus(): boolean {
  // 返回 `process.env.USER_TYPE === 'ant'`，作为终端渲染这次计算的结果。
  return process.env.USER_TYPE === 'ant'
}

/**
 * Emit an OSC 21337 tab-status sequence. Omitted fields are left unchanged
 * by the receiving terminal; `null` sends an empty value to clear.
 * `;` and `\` in status text are escaped per the spec.
 */
// tabStatus 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tabStatus(fields: TabStatusAction): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // rgb封装成回调，供Ink 渲染层 osc在事件触发或异步步骤中调用。
  const rgb = (c: Color) =>
    c.type === 'rgb'
      ? `#${[c.r, c.g, c.b].map(n => n.toString(16).padStart(2, '0')).join('')}`
      : ''
  // 满足 `'indicator' in fields` 时，终端渲染执行该分支。
  if ('indicator' in fields)
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`indicator=${fields.indicator ? rgb(fields.indicator) : ''}`)
  // 满足 `'status' in fields` 时，终端渲染执行该分支。
  if ('status' in fields)
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `status=${fields.status?.replaceAll('\\', '\\\\').replaceAll(';', '\\;') ?? ''}`,
    )
  // 满足 `'statusColor' in fields` 时，终端渲染执行该分支。
  if ('statusColor' in fields)
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(
      `status-color=${fields.statusColor ? rgb(fields.statusColor) : ''}`,
    )
  // 返回 `osc(OSC.TAB_STATUS, parts.join(';'))`，作为终端渲染这次计算的结果。
  return osc(OSC.TAB_STATUS, parts.join(';'))
}

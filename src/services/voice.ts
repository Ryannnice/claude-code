// Voice service: audio recording for push-to-talk voice input.
//
// Recording uses native audio capture (cpal) on macOS, Linux, and Windows
// for in-process mic access. Falls back to SoX `rec` or arecord (ALSA)
// on Linux if the native module is unavailable.

// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { type ChildProcess, spawn, spawnSync } from 'child_process'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 isEnvTruthy、isRunningOnHomespace 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy, isRunningOnHomespace } from '../utils/envUtils.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../utils/platform.js 中维护。
import { getPlatform } from '../utils/platform.js'

// Lazy-loaded native audio module. audio-capture.node links against
// CoreAudio.framework + AudioUnit.framework; dlopen is synchronous and
// blocks the event loop for ~1s warm, up to ~8s on cold coreaudiod
// (post-wake, post-boot). Load happens on first voice keypress — no
// preload, because there's no way to make dlopen non-blocking and a
// startup freeze is worse than a first-press delay.
// AudioNapi 固化服务层 voice里传递的数据形状，帮助调用方按同一结构读写字段。
type AudioNapi = typeof import('audio-capture-napi')
// audioNapi初始化为空值，后续分支会在有数据时补齐。
let audioNapi: AudioNapi | null = null
// audioNapiPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let audioNapiPromise: Promise<AudioNapi> | null = null

// loadAudioNapi 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function loadAudioNapi(): Promise<AudioNapi> {
  // 这个回调绑定到 audioNapiPromise ??= (async () => {，负责服务层 voice在该局部场景下的响应。
  audioNapiPromise ??= (async () => {
    // 临时值 t0记录时间`Date.now`，供服务层 voice后续处理使用。
    const t0 = Date.now()
    // mod保存`import`，供服务层 voice后续处理使用。
    const mod = await import('audio-capture-napi')
    // vendor/audio-capture-src/index.ts defers require(...node) until the
    // first function call — trigger it here so timing reflects real cost.
    // 调用 mod.isNativeAudioAvailable，触发服务层 voice此处需要的副作用。
    mod.isNativeAudioAvailable()
    // audioNapi更新为 `mod`，确保服务层后续读取最新状态。
    audioNapi = mod
    // 记录服务层 voice运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[voice] audio-capture-napi loaded in ${Date.now() - t0}ms`)
    // 返回 `mod`，作为服务层 voice这次计算的结果。
    return mod
  })()
  // 返回 `audioNapiPromise`，作为服务层 voice这次计算的结果。
  return audioNapiPromise
}

// ─── Constants ───────────────────────────────────────────────────────

// RECORDING_SAMPLE_RATE保存`16000`，供后续判断或组装使用。
const RECORDING_SAMPLE_RATE = 16000
// RECORDING_CHANNELS 集合保存`1`，供后续判断或组装使用。
const RECORDING_CHANNELS = 1

// SoX silence detection: stop after this duration of silence
// SILENCE_DURATION_SECS 集合 命名 `'2.0'`，让后续代码直接表达这个值的用途。
const SILENCE_DURATION_SECS = '2.0'
// SILENCE_THRESHOLD保存`'3%'`，作为后续固定文本处理的输入。
const SILENCE_THRESHOLD = '3%'

// ─── Dependency check ────────────────────────────────────────────────

// hasCommand 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasCommand(cmd: string): boolean {
  // Spawn the target directly instead of `which cmd`. On Termux/Android
  // `which` is a shell builtin — the external binary is absent or
  // kernel-blocked (EPERM) when spawned from Node. Only reached on
  // non-Windows (win32 returns early from all callers), no PATHEXT issue.
  // result.error is set iff the spawn itself fails (ENOENT/EACCES); exit
  // code is irrelevant — an unrecognized --version still means cmd exists.
  // 结果保存`spawnSync`，供服务层 voice后续处理使用。
  const result = spawnSync(cmd, ['--version'], {
    stdio: 'ignore',
    timeout: 3000,
  })
  // 返回 `result.error === undefined`，作为服务层 voice这次计算的结果。
  return result.error === undefined
}

// Probe whether arecord can actually open a capture device. hasCommand()
// only checks PATH; on WSL1/Win10-WSL2/headless Linux the binary exists
// but fails at open() because there is no ALSA card and no PulseAudio
// server. On WSL2+WSLg (Win11), PulseAudio works via RDP pipes and arecord
// succeeds. We spawn with the same args as startArecordRecording() and race
// a short timer: if the process is still alive after 150ms it opened the
// device; if it exits early the stderr tells us why. Memoized — audio
// device availability does not change mid-session, and this is called on
// every voice keypress via checkRecordingAvailability().
// ArecordProbeResult 固化服务层 voice里传递的数据形状，帮助调用方按同一结构读写字段。
type ArecordProbeResult = { ok: boolean; stderr: string }
// arecordProbe 命名 `null`，让后续代码直接表达这个值的用途。
let arecordProbe: Promise<ArecordProbeResult> | null = null

// probeArecord 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function probeArecord(): Promise<ArecordProbeResult> {
  // 这个回调绑定到 arecordProbe ??= new Promise(resolve => {，负责服务层 voice在该局部场景下的响应。
  arecordProbe ??= new Promise(resolve => {
    // child保存`spawn`，供服务层 voice后续处理使用。
    const child = spawn(
      'arecord',
      [
        '-f',
        'S16_LE',
        '-r',
        String(RECORDING_SAMPLE_RATE),
        '-c',
        String(RECORDING_CHANNELS),
        '-t',
        'raw',
        '/dev/null',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    )
    // stderr固定为 `''`，作为服务层 voice后续展示或比较的基准。
    let stderr = ''
    // 这个回调绑定到 child.stderr?.on('data', (chunk: Buffer) => {，负责服务层 voice在该局部场景下的响应。
    child.stderr?.on('data', (chunk: Buffer) => {
      // 服务层 voice在这里处理 `stderr += chunk.toString()`，完成这一小步状态转换。
      stderr += chunk.toString()
    })
    // timer保存`setTimeout`，供服务层 voice后续处理使用。
    const timer = setTimeout(
      // 这个回调绑定到 (c: ChildProcess, r: (v: ArecordProbeResult) => void) => {，负责服务层 voice在该局部场景下的响应。
      (c: ChildProcess, r: (v: ArecordProbeResult) => void) => {
        // 调用 c.kill，触发服务层 voice此处需要的副作用。
        c.kill('SIGTERM')
        // 调用 r，触发服务层 voice此处需要的副作用。
        r({ ok: true, stderr: '' })
      },
      150,
      child,
      resolve,
    )
    // 调用 child.once，触发服务层 voice此处需要的副作用。
    child.once('close', code => {
      // 调用 clearTimeout，触发服务层 voice此处需要的副作用。
      clearTimeout(timer)
      // SIGTERM close (code=null) after timer fired is already resolved.
      // Early close with code=0 is unusual (arecord shouldn't exit on its
      // own) but treat as ok.
      // 显式忽略 `resolve({ ok: code === 0, stderr: stderr.trim() })` 的返回值，只保留它触发的副作用。
      void resolve({ ok: code === 0, stderr: stderr.trim() })
    })
    // 调用 child.once，触发服务层 voice此处需要的副作用。
    child.once('error', () => {
      // 调用 clearTimeout，触发服务层 voice此处需要的副作用。
      clearTimeout(timer)
      // 显式忽略 `resolve({ ok: false, stderr: 'arecord: command not found' })` 的返回值，只保留它触发的副作用。
      void resolve({ ok: false, stderr: 'arecord: command not found' })
    })
  })
  // 返回 `arecordProbe`，作为服务层 voice这次计算的结果。
  return arecordProbe
}

// _resetArecordProbeForTesting 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetArecordProbeForTesting(): void {
  // arecordProbe更新为 `null`，确保服务层后续读取最新状态。
  arecordProbe = null
}

// cpal's ALSA backend writes to our process stderr when it can't find any
// sound cards (it runs in-process — no subprocess pipe to capture it). The
// spawn fallbacks below pipe stderr correctly, so skip native when ALSA has
// nothing to open. Memoized: card presence doesn't change mid-session.
// linuxAlsaCardsMemo 命名 `null`，让后续代码直接表达这个值的用途。
let linuxAlsaCardsMemo: Promise<boolean> | null = null

// linuxHasAlsaCards 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function linuxHasAlsaCards(): Promise<boolean> {
  // 服务层 voice在这里处理 `linuxAlsaCardsMemo ??= readFile('/proc/asound/cards', 'utf8').then(`，完成这一小步状态转换。
  linuxAlsaCardsMemo ??= readFile('/proc/asound/cards', 'utf8').then(
    cards => {
      // c格式化`cards.trim`，供服务层 voice后续处理使用。
      const c = cards.trim()
      // 返回 `c !== '' && !c.includes('no soundcards')`，作为服务层 voice这次计算的结果。
      return c !== '' && !c.includes('no soundcards')
    },
    // 这个回调绑定到 () => false,，负责服务层 voice在该局部场景下的响应。
    () => false,
  )
  // 返回 `linuxAlsaCardsMemo`，作为服务层 voice这次计算的结果。
  return linuxAlsaCardsMemo
}

// _resetAlsaCardsForTesting 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetAlsaCardsForTesting(): void {
  // linuxAlsaCardsMemo更新为 `null`，确保服务层后续读取最新状态。
  linuxAlsaCardsMemo = null
}

// PackageManagerInfo 固化服务层 voice里传递的数据形状，帮助调用方按同一结构读写字段。
type PackageManagerInfo = {
  cmd: string
  args: string[]
  displayCommand: string
}

// detectPackageManager 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectPackageManager(): PackageManagerInfo | null {
  // 当 `process.platform` 匹配 `'darwin'` 时，服务层 voice执行对应分支。
  if (process.platform === 'darwin') {
    // 满足 `hasCommand('brew')` 时，服务层 voice执行该分支。
    if (hasCommand('brew')) {
      // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
      return {
        cmd: 'brew',
        args: ['install', 'sox'],
        displayCommand: 'brew install sox',
      }
    }
    // 返回 `null`，作为服务层 voice这次计算的结果。
    return null
  }

  // 当 `process.platform` 匹配 `'linux'` 时，服务层 voice执行对应分支。
  if (process.platform === 'linux') {
    // 满足 `hasCommand('apt-get')` 时，服务层 voice执行该分支。
    if (hasCommand('apt-get')) {
      // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
      return {
        cmd: 'sudo',
        args: ['apt-get', 'install', '-y', 'sox'],
        displayCommand: 'sudo apt-get install sox',
      }
    }
    // 满足 `hasCommand('dnf')` 时，服务层 voice执行该分支。
    if (hasCommand('dnf')) {
      // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
      return {
        cmd: 'sudo',
        args: ['dnf', 'install', '-y', 'sox'],
        displayCommand: 'sudo dnf install sox',
      }
    }
    // 满足 `hasCommand('pacman')` 时，服务层 voice执行该分支。
    if (hasCommand('pacman')) {
      // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
      return {
        cmd: 'sudo',
        args: ['pacman', '-S', '--noconfirm', 'sox'],
        displayCommand: 'sudo pacman -S sox',
      }
    }
  }

  // 返回 `null`，作为服务层 voice这次计算的结果。
  return null
}

// checkVoiceDependencies 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkVoiceDependencies(): Promise<{
  available: boolean
  missing: string[]
  installCommand: string | null
}> {
  // Native audio module (cpal) handles everything on macOS, Linux, and Windows
  // napi读取`loadAudioNapi`，供服务层 voice后续处理使用。
  const napi = await loadAudioNapi()
  // 满足 `napi.isNativeAudioAvailable()` 时，服务层 voice执行该分支。
  if (napi.isNativeAudioAvailable()) {
    // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
    return { available: true, missing: [], installCommand: null }
  }

  // Windows has no supported fallback — native module is required
  // 当 `process.platform` 匹配 `'win32'` 时，服务层 voice执行对应分支。
  if (process.platform === 'win32') {
    // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
    return {
      available: false,
      missing: ['Voice mode requires the native audio module (not loaded)'],
      installCommand: null,
    }
  }

  // On Linux, arecord (ALSA utils) is a valid fallback recording backend
  // 组合条件 `process.platform === 'linux' && hasCommand('arecord')` 成立时，服务层 voice才启用这条专门路径。
  if (process.platform === 'linux' && hasCommand('arecord')) {
    // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
    return { available: true, missing: [], installCommand: null }
  }

  // missing 从空数组开始收集，后续循环会按处理顺序追加条目。
  const missing: string[] = []

  // 满足 `!hasCommand('rec')` 时，服务层 voice执行该分支。
  if (!hasCommand('rec')) {
    // missing追加新条目，保持收集顺序与输入顺序一致。
    missing.push('sox (rec command)')
  }

  // pm读取`detectPackageManager`，供服务层 voice后续处理使用。
  const pm = missing.length > 0 ? detectPackageManager() : null
  // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
  return {
    available: missing.length === 0,
    missing,
    installCommand: pm?.displayCommand ?? null,
  }
}

// ─── Recording availability ──────────────────────────────────────────

// RecordingAvailability 固化服务层 voice里传递的数据形状，帮助调用方按同一结构读写字段。
export type RecordingAvailability = {
  available: boolean
  reason: string | null
}

// Probe-record through the full fallback chain (native → arecord → SoX)
// to verify that at least one backend can record. On macOS this also
// triggers the TCC permission dialog on first use. We trust the probe
// result over the TCC status API, which can be unreliable for ad-hoc
// signed or cross-architecture binaries (e.g., x64-on-arm64).
// requestMicrophonePermission 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function requestMicrophonePermission(): Promise<boolean> {
  // napi读取`loadAudioNapi`，供服务层 voice后续处理使用。
  const napi = await loadAudioNapi()
  // 满足 `!napi.isNativeAudioAvailable()` 时，服务层 voice执行该分支。
  if (!napi.isNativeAudioAvailable()) {
    // 返回 `true // non-native platforms skip this check`，作为服务层 voice这次计算的结果。
    return true // non-native platforms skip this check
  }

  // started保存`startRecording`，供服务层 voice后续处理使用。
  const started = await startRecording(
    // _chunk更新为 `> {}, // discard audio data — this is a permission probe ...`，确保服务层后续读取最新状态。
    _chunk => {}, // discard audio data — this is a permission probe only
    // 这个回调绑定到 () => {}, // ignore silence-detection end signal，负责服务层 voice在该局部场景下的响应。
    () => {}, // ignore silence-detection end signal
    { silenceDetection: false },
  )
  // 满足 `started` 时，服务层 voice执行该分支。
  if (started) {
    // 调用 stopRecording，触发服务层 voice此处需要的副作用。
    stopRecording()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// checkRecordingAvailability 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkRecordingAvailability(): Promise<RecordingAvailability> {
  // Remote environments have no local microphone
  // 组合条件 `isRunningOnHomespace() || isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)` 成立时，服务层 voice才启用这条专门路径。
  if (isRunningOnHomespace() || isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
    // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
    return {
      available: false,
      reason:
        'Voice mode requires microphone access, but no audio device is available in this environment.\n\nTo use voice mode, run Claude Code locally instead.',
    }
  }

  // Native audio module (cpal) handles everything on macOS, Linux, and Windows
  // napi读取`loadAudioNapi`，供服务层 voice后续处理使用。
  const napi = await loadAudioNapi()
  // 满足 `napi.isNativeAudioAvailable()` 时，服务层 voice执行该分支。
  if (napi.isNativeAudioAvailable()) {
    // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
    return { available: true, reason: null }
  }

  // Windows has no supported fallback
  // 当 `process.platform` 匹配 `'win32'` 时，服务层 voice执行对应分支。
  if (process.platform === 'win32') {
    // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
    return {
      available: false,
      reason:
        'Voice recording requires the native audio module, which could not be loaded.',
    }
  }

  // wslNoAudioReason 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const wslNoAudioReason =
    'Voice mode could not access an audio device in WSL.\n\nWSL2 with WSLg (Windows 11) provides audio via PulseAudio — if you are on Windows 10 or WSL1, run Claude Code in native Windows instead.'

  // On Linux (including WSL), probe arecord. hasCommand() is insufficient:
  // the binary can exist while the device open() fails (WSL1, Win10-WSL2,
  // headless Linux). WSL2+WSLg (Win11 default) works via PulseAudio RDP
  // pipes — cpal fails (no /proc/asound/cards) but arecord succeeds.
  // 组合条件 `process.platform === 'linux' && hasCommand('arecord')` 成立时，服务层 voice才启用这条专门路径。
  if (process.platform === 'linux' && hasCommand('arecord')) {
    // probe保存`probeArecord`，供服务层 voice后续处理使用。
    const probe = await probeArecord()
    // 满足 `probe.ok` 时，服务层 voice执行该分支。
    if (probe.ok) {
      // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
      return { available: true, reason: null }
    }
    // 当 `getPlatform()` 匹配 `'wsl'` 时，服务层 voice执行对应分支。
    if (getPlatform() === 'wsl') {
      // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
      return { available: false, reason: wslNoAudioReason }
    }
    // 记录服务层 voice运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[voice] arecord probe failed: ${probe.stderr}`)
    // fall through to SoX
  }

  // Fallback: check for SoX
  // 满足 `!hasCommand('rec')` 时，服务层 voice执行该分支。
  if (!hasCommand('rec')) {
    // WSL without arecord AND without SoX: the generic "install SoX"
    // hint below is misleading on WSL1/Win10 (no audio devices at all),
    // but correct on WSL2+WSLg (SoX works via PulseAudio). Since we can't
    // distinguish WSLg-vs-not without a backend to probe, show the WSLg
    // guidance — it points WSL1 users at native Windows AND tells WSLg
    // users their setup should work (they can install sox or alsa-utils).
    // Known gap: WSL with SoX but NO arecord skips both this branch and
    // the probe above — hasCommand('rec') lies the same way. We optimistically
    // trust it (WSLg+SoX would work) rather than probeSox() for a near-zero
    // population (WSL1 × minimal distro × SoX-but-not-alsa-utils).
    // 当 `getPlatform()` 匹配 `'wsl'` 时，服务层 voice执行对应分支。
    if (getPlatform() === 'wsl') {
      // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
      return { available: false, reason: wslNoAudioReason }
    }
    // pm读取`detectPackageManager`，供服务层 voice后续处理使用。
    const pm = detectPackageManager()
    // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
    return {
      available: false,
      reason: pm
        ? `Voice mode requires SoX for audio recording. Install it with: ${pm.displayCommand}`
        : 'Voice mode requires SoX for audio recording. Install SoX manually:\n  macOS: brew install sox\n  Ubuntu/Debian: sudo apt-get install sox\n  Fedora: sudo dnf install sox',
    }
  }

  // 返回结构化结果，集中表达服务层 voice已经整理出的状态。
  return { available: true, reason: null }
}

// ─── Recording (native audio on macOS/Linux/Windows, SoX/arecord fallback on Linux) ─────────────

// activeRecorder初始化为空值，后续分支会在有数据时补齐。
let activeRecorder: ChildProcess | null = null
// nativeRecordingActive标记服务层 voice是否启用对应路径。
let nativeRecordingActive = false

// startRecording 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function startRecording(
  // 这个回调绑定到 onData: (chunk: Buffer) => void,，负责服务层 voice在该局部场景下的响应。
  onData: (chunk: Buffer) => void,
  // 这个回调绑定到 onEnd: () => void,，负责服务层 voice在该局部场景下的响应。
  onEnd: () => void,
  options?: { silenceDetection?: boolean },
): Promise<boolean> {
  // 记录服务层 voice运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[voice] startRecording called, platform=${process.platform}`)

  // Try native audio module first (macOS, Linux, Windows via cpal)
  // napi读取`loadAudioNapi`，供服务层 voice后续处理使用。
  const napi = await loadAudioNapi()
  // nativeAvailable 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const nativeAvailable =
    napi.isNativeAudioAvailable() &&
    (process.platform !== 'linux' || (await linuxHasAlsaCards()))
  // useSilenceDetection标记服务层 voice是否启用对应路径。
  const useSilenceDetection = options?.silenceDetection !== false
  // 满足 `nativeAvailable` 时，服务层 voice执行该分支。
  if (nativeAvailable) {
    // Ensure any previous recording is fully stopped
    // 组合条件 `nativeRecordingActive || napi.isNativeRecordingActive()` 成立时，服务层 voice才启用这条专门路径。
    if (nativeRecordingActive || napi.isNativeRecordingActive()) {
      // 调用 napi.stopNativeRecording，触发服务层 voice此处需要的副作用。
      napi.stopNativeRecording()
      // nativeRecordingActive更新为 `false`，确保服务层后续读取最新状态。
      nativeRecordingActive = false
    }
    // started保存`napi.startNativeRecording`，供服务层 voice后续处理使用。
    const started = napi.startNativeRecording(
      // 这个回调绑定到 (data: Buffer) => {，负责服务层 voice在该局部场景下的响应。
      (data: Buffer) => {
        // 调用 onData，触发服务层 voice此处需要的副作用。
        onData(data)
      },
      // 这个回调绑定到 () => {，负责服务层 voice在该局部场景下的响应。
      () => {
        // 满足 `useSilenceDetection` 时，服务层 voice执行该分支。
        if (useSilenceDetection) {
          // nativeRecordingActive更新为 `false`，确保服务层后续读取最新状态。
          nativeRecordingActive = false
          // 调用 onEnd，触发服务层 voice此处需要的副作用。
          onEnd()
        }
        // In push-to-talk mode, ignore the native module's silence-triggered
        // onEnd.  Recording continues until the caller explicitly calls
        // stopRecording() (e.g. when the user presses Ctrl+X).
      },
    )
    // 满足 `started` 时，服务层 voice执行该分支。
    if (started) {
      // nativeRecordingActive更新为 `true`，确保服务层后续读取最新状态。
      nativeRecordingActive = true
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Native recording failed — fall through to platform fallbacks
  }

  // Windows has no supported fallback
  // 当 `process.platform` 匹配 `'win32'` 时，服务层 voice执行对应分支。
  if (process.platform === 'win32') {
    // 记录服务层 voice运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[voice] Windows native recording unavailable, no fallback')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // On Linux, try arecord (ALSA utils) before SoX. Consult the probe so
  // backend selection matches checkRecordingAvailability() — otherwise
  // on headless Linux with both alsa-utils and SoX, the availability
  // check falls through to SoX (probe.ok=false, not WSL) but this path
  // would still pick broken arecord. Probe is memoized; zero latency.
  // 服务层 voice在这里进入条件判断，后续代码按实际状态分流。
  if (
    process.platform === 'linux' &&
    hasCommand('arecord') &&
    (await probeArecord()).ok
  ) {
    // 返回 `startArecordRecording(onData, onEnd)`，作为服务层 voice这次计算的结果。
    return startArecordRecording(onData, onEnd)
  }

  // Fallback: SoX rec (Linux, or macOS if native module unavailable)
  // 返回 `startSoxRecording(onData, onEnd, options)`，作为服务层 voice这次计算的结果。
  return startSoxRecording(onData, onEnd, options)
}

// startSoxRecording 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startSoxRecording(
  // 这个回调绑定到 onData: (chunk: Buffer) => void,，负责服务层 voice在该局部场景下的响应。
  onData: (chunk: Buffer) => void,
  // 这个回调绑定到 onEnd: () => void,，负责服务层 voice在该局部场景下的响应。
  onEnd: () => void,
  options?: { silenceDetection?: boolean },
): boolean {
  // useSilenceDetection标记服务层 voice是否启用对应路径。
  const useSilenceDetection = options?.silenceDetection !== false

  // Record raw PCM: 16 kHz, 16-bit signed, mono, to stdout.
  // --buffer 1024 forces SoX to flush audio in small chunks instead of
  // accumulating data in its internal buffer. Without this, SoX may buffer
  // several seconds of audio before writing anything to stdout when piped,
  // causing zero data flow until the process exits.
  // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
  const args = [
    '-q', // quiet
    '--buffer',
    '1024',
    '-t',
    'raw',
    '-r',
    String(RECORDING_SAMPLE_RATE),
    '-e',
    'signed',
    '-b',
    '16',
    '-c',
    String(RECORDING_CHANNELS),
    '-', // stdout
  ]

  // Add silence detection filter (auto-stop on silence).
  // Omit for push-to-talk where the user manually controls start/stop.
  // 满足 `useSilenceDetection` 时，服务层 voice执行该分支。
  if (useSilenceDetection) {
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push(
      'silence', // start/stop on silence
      '1',
      '0.1',
      SILENCE_THRESHOLD,
      '1',
      SILENCE_DURATION_SECS,
      SILENCE_THRESHOLD,
    )
  }

  // child保存`spawn`，供服务层 voice后续处理使用。
  const child = spawn('rec', args, {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  // activeRecorder更新为 `child`，确保服务层后续读取最新状态。
  activeRecorder = child

  // 这个回调绑定到 child.stdout?.on('data', (chunk: Buffer) => {，负责服务层 voice在该局部场景下的响应。
  child.stdout?.on('data', (chunk: Buffer) => {
    // 调用 onData，触发服务层 voice此处需要的副作用。
    onData(chunk)
  })

  // Consume stderr to prevent backpressure
  // 这个回调绑定到 child.stderr?.on('data', () => {})，负责服务层 voice在该局部场景下的响应。
  child.stderr?.on('data', () => {})

  // 调用 child.on，触发服务层 voice此处需要的副作用。
  child.on('close', () => {
    // activeRecorder更新为 `null`，确保服务层后续读取最新状态。
    activeRecorder = null
    // 调用 onEnd，触发服务层 voice此处需要的副作用。
    onEnd()
  })

  // 调用 child.on，触发服务层 voice此处需要的副作用。
  child.on('error', err => {
    // 记录服务层 voice运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // activeRecorder更新为 `null`，确保服务层后续读取最新状态。
    activeRecorder = null
    // 调用 onEnd，触发服务层 voice此处需要的副作用。
    onEnd()
  })

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// startArecordRecording 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startArecordRecording(
  // 这个回调绑定到 onData: (chunk: Buffer) => void,，负责服务层 voice在该局部场景下的响应。
  onData: (chunk: Buffer) => void,
  // 这个回调绑定到 onEnd: () => void,，负责服务层 voice在该局部场景下的响应。
  onEnd: () => void,
): boolean {
  // Record raw PCM: 16 kHz, 16-bit signed little-endian, mono, to stdout.
  // arecord does not support built-in silence detection, so this backend
  // is best suited for push-to-talk (silenceDetection: false).
  // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
  const args = [
    '-f',
    'S16_LE', // signed 16-bit little-endian
    '-r',
    String(RECORDING_SAMPLE_RATE),
    '-c',
    String(RECORDING_CHANNELS),
    '-t',
    'raw', // raw PCM, no WAV header
    '-q', // quiet — no progress output
    '-', // write to stdout
  ]

  // child保存`spawn`，供服务层 voice后续处理使用。
  const child = spawn('arecord', args, {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  // activeRecorder更新为 `child`，确保服务层后续读取最新状态。
  activeRecorder = child

  // 这个回调绑定到 child.stdout?.on('data', (chunk: Buffer) => {，负责服务层 voice在该局部场景下的响应。
  child.stdout?.on('data', (chunk: Buffer) => {
    // 调用 onData，触发服务层 voice此处需要的副作用。
    onData(chunk)
  })

  // Consume stderr to prevent backpressure
  // 这个回调绑定到 child.stderr?.on('data', () => {})，负责服务层 voice在该局部场景下的响应。
  child.stderr?.on('data', () => {})

  // 调用 child.on，触发服务层 voice此处需要的副作用。
  child.on('close', () => {
    // activeRecorder更新为 `null`，确保服务层后续读取最新状态。
    activeRecorder = null
    // 调用 onEnd，触发服务层 voice此处需要的副作用。
    onEnd()
  })

  // 调用 child.on，触发服务层 voice此处需要的副作用。
  child.on('error', err => {
    // 记录服务层 voice运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // activeRecorder更新为 `null`，确保服务层后续读取最新状态。
    activeRecorder = null
    // 调用 onEnd，触发服务层 voice此处需要的副作用。
    onEnd()
  })

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// stopRecording 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stopRecording(): void {
  // 组合条件 `nativeRecordingActive && audioNapi` 成立时，服务层 voice才启用这条专门路径。
  if (nativeRecordingActive && audioNapi) {
    // 调用 audioNapi.stopNativeRecording，触发服务层 voice此处需要的副作用。
    audioNapi.stopNativeRecording()
    // nativeRecordingActive更新为 `false`，确保服务层后续读取最新状态。
    nativeRecordingActive = false
    // 服务层 voice在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `activeRecorder` 时，服务层 voice执行该分支。
  if (activeRecorder) {
    // 调用 activeRecorder.kill，触发服务层 voice此处需要的副作用。
    activeRecorder.kill('SIGTERM')
    // activeRecorder更新为 `null`，确保服务层后续读取最新状态。
    activeRecorder = null
  }
}

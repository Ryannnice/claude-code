// React hook for hold-to-talk voice input using Anthropic voice_stream STT.
//
// Hold the keybinding to record; release to stop and submit.  Auto-repeat
// key events reset an internal timer — when no keypress arrives within
// RELEASE_TIMEOUT_MS the recording stops automatically.  Uses the native
// audio module (macOS) or SoX for recording, and Anthropic's voice_stream
// endpoint (conversation_engine) for STT.

// 引入 useCallback、useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useRef, useState } from 'react'
// 引入 useSetVoiceState，将 ../context/voice.js 中已经封装好的能力接到本文件流程里。
import { useSetVoiceState } from '../context/voice.js'
// 复用 useTerminalFocus 终端界面组件，避免在这里重复拼装显示逻辑。
import { useTerminalFocus } from '../ink/hooks/use-terminal-focus.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 接入 getVoiceKeyterms 服务层能力，把外部通信或共享状态交给 ../services/voiceKeyterms.js 处理。
import { getVoiceKeyterms } from '../services/voiceKeyterms.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  connectVoiceStream,
  type FinalizeSource,
  isVoiceStreamAvailable,
  type VoiceStreamConnection,
} from '../services/voiceStreamSTT.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 toError 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { toError } from '../utils/errors.js'
// 复用 getSystemLocaleLanguage 工具函数，把通用处理留在 ../utils/intl.js 中维护。
import { getSystemLocaleLanguage } from '../utils/intl.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 getInitialSettings 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../utils/settings/settings.js'
// 复用 sleep 工具函数，把通用处理留在 ../utils/sleep.js 中维护。
import { sleep } from '../utils/sleep.js'

// ─── Language normalization ─────────────────────────────────────────────

// DEFAULT_STT_LANGUAGE保存`'en'`，作为后续固定文本处理的输入。
const DEFAULT_STT_LANGUAGE = 'en'

// Maps language names (English and native) to BCP-47 codes supported by
// the voice_stream Deepgram backend.  Keys must be lowercase.
//
// This list must be a SUBSET of the server-side supported_language_codes
// allowlist (GrowthBook: speech_to_text_voice_stream_config).
// If the CLI sends a code the server rejects, the WebSocket closes with
// 1008 "Unsupported language" and voice breaks.  Unsupported languages
// fall back to DEFAULT_STT_LANGUAGE so recording still works.
// LANGUAGE_NAME_TO_CODE 集中保存React hook use Voice要一起传递的字段。
const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  español: 'es',
  espanol: 'es',
  french: 'fr',
  français: 'fr',
  francais: 'fr',
  japanese: 'ja',
  日本語: 'ja',
  german: 'de',
  deutsch: 'de',
  portuguese: 'pt',
  português: 'pt',
  portugues: 'pt',
  italian: 'it',
  italiano: 'it',
  korean: 'ko',
  한국어: 'ko',
  hindi: 'hi',
  हिन्दी: 'hi',
  हिंदी: 'hi',
  indonesian: 'id',
  'bahasa indonesia': 'id',
  bahasa: 'id',
  russian: 'ru',
  русский: 'ru',
  polish: 'pl',
  polski: 'pl',
  turkish: 'tr',
  türkçe: 'tr',
  turkce: 'tr',
  dutch: 'nl',
  nederlands: 'nl',
  ukrainian: 'uk',
  українська: 'uk',
  greek: 'el',
  ελληνικά: 'el',
  czech: 'cs',
  čeština: 'cs',
  cestina: 'cs',
  danish: 'da',
  dansk: 'da',
  swedish: 'sv',
  svenska: 'sv',
  norwegian: 'no',
  norsk: 'no',
}

// Subset of the GrowthBook speech_to_text_voice_stream_config allowlist.
// Sending a code not in the server allowlist closes the connection.
// SUPPORTED_LANGUAGE_CODES 集合保存`Set`，供React hook后续处理使用。
const SUPPORTED_LANGUAGE_CODES = new Set([
  'en',
  'es',
  'fr',
  'ja',
  'de',
  'pt',
  'it',
  'ko',
  'hi',
  'id',
  'ru',
  'pl',
  'tr',
  'nl',
  'uk',
  'el',
  'cs',
  'da',
  'sv',
  'no',
])

// Normalize a language preference string (from settings.language) to a
// BCP-47 code supported by the voice_stream endpoint.  Returns the
// default language if the input cannot be resolved.  When the input is
// non-empty but unsupported, fellBackFrom is set to the original input so
// callers can surface a warning.
// normalizeLanguageForSTT 封装useVoice的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeLanguageForSTT(language: string | undefined): {
  code: string
  fellBackFrom?: string
} {
  // language缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!language) return { code: DEFAULT_STT_LANGUAGE }
  // lower保存`language.toLowerCase`，供React hook后续处理使用。
  const lower = language.toLowerCase().trim()
  // lower缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!lower) return { code: DEFAULT_STT_LANGUAGE }
  // 满足 `SUPPORTED_LANGUAGE_CODES.has(lower)` 时，React hook执行该分支。
  if (SUPPORTED_LANGUAGE_CODES.has(lower)) return { code: lower }
  // fromName读取 `LANGUAGE_NAME_TO_CODE[lower]` 对应条目，后续围绕该成员继续处理。
  const fromName = LANGUAGE_NAME_TO_CODE[lower]
  // 满足 `fromName` 时，React hook执行该分支。
  if (fromName) return { code: fromName }
  // base格式化`lower.split`，供React hook后续处理使用。
  const base = lower.split('-')[0]
  // 组合条件 `base && SUPPORTED_LANGUAGE_CODES.has(base)` 成立时，React hook 状态流才启用这条专门路径。
  if (base && SUPPORTED_LANGUAGE_CODES.has(base)) return { code: base }
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return { code: DEFAULT_STT_LANGUAGE, fellBackFrom: language }
}

// Lazy-loaded voice module. We defer importing voice.ts (and its native
// audio-capture-napi dependency) until voice input is actually activated.
// On macOS, loading the native audio module can trigger a TCC microphone
// permission prompt — we must avoid that until voice input is actually enabled.
// VoiceModule 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type VoiceModule = typeof import('../services/voice.js')
// voiceModule初始化为空值，后续分支会在有数据时补齐。
let voiceModule: VoiceModule | null = null

// VoiceState 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type VoiceState = 'idle' | 'recording' | 'processing'

// UseVoiceOptions 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseVoiceOptions = {
  // 这个回调绑定到 onTranscript: (text: string) => void，负责React hook 状态流在该局部场景下的响应。
  onTranscript: (text: string) => void
  onError?: (message: string) => void
  enabled: boolean
  focusMode: boolean
}

// UseVoiceReturn 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseVoiceReturn = {
  state: VoiceState
  // 这个回调绑定到 handleKeyEvent: (fallbackMs?: number) => void，负责React hook 状态流在该局部场景下的响应。
  handleKeyEvent: (fallbackMs?: number) => void
}

// Gap (ms) between auto-repeat key events that signals key release.
// Terminal auto-repeat typically fires every 30-80ms; 200ms comfortably
// covers jitter while still feeling responsive.
// RELEASE_TIMEOUT_MS 集合保存`200`，供后续判断或组装使用。
const RELEASE_TIMEOUT_MS = 200

// Fallback (ms) to arm the release timer if no auto-repeat is seen.
// macOS default key repeat delay is ~500ms; 600ms gives headroom.
// If the user tapped and released before auto-repeat started, this
// ensures the release timer gets armed and recording stops.
//
// For modifier-combo first-press activation (handleKeyEvent called at
// t=0, before any auto-repeat), callers should pass FIRST_PRESS_FALLBACK_MS
// instead — the gap to the next keypress is the OS initial repeat *delay*
// (up to ~2s on macOS with slider at "Long"), not the repeat *rate*.
// REPEAT_FALLBACK_MS 集合保存`600`，供后续判断或组装使用。
const REPEAT_FALLBACK_MS = 600
// FIRST_PRESS_FALLBACK_MS 集合保存`2000`，供React hook use Voice后续判断或输出使用。
export const FIRST_PRESS_FALLBACK_MS = 2000

// How long (ms) to keep a focus-mode session alive without any speech
// before tearing it down to free the WebSocket connection. Re-arms on
// the next focus cycle (blur → refocus).
// FOCUS_SILENCE_TIMEOUT_MS 集合 命名 `5_000`，让后续代码直接表达这个值的用途。
const FOCUS_SILENCE_TIMEOUT_MS = 5_000

// Number of bars shown in the recording waveform visualizer.
// AUDIO_LEVEL_BARS 集合 命名 `16`，让后续代码直接表达这个值的用途。
const AUDIO_LEVEL_BARS = 16

// Compute RMS amplitude from a 16-bit signed PCM buffer and return a
// normalized 0-1 value. A sqrt curve spreads quieter levels across more
// of the visual range so the waveform uses the full set of block heights.
// computeLevel 封装useVoice的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeLevel(chunk: Buffer): number {
  // samples 集合 命名 `chunk.length >> 1 // 16-bit = 2 bytes per sample`，让后续代码直接表达这个值的用途。
  const samples = chunk.length >> 1 // 16-bit = 2 bytes per sample
  // 满足 `samples === 0` 时，React hook执行该分支。
  if (samples === 0) return 0
  // sumSq保存`0`，供React hook use Voice后续判断或输出使用。
  let sumSq = 0
  // 循环处理 `let i = 0; i < chunk.length - 1; i += 2`，让React hook 状态流逐项把同类条目按顺序走完。
  for (let i = 0; i < chunk.length - 1; i += 2) {
    // Read 16-bit signed little-endian
    // sample读取 `((chunk[i]! | (chunk[i + 1]! << 8)) << 16) >> 16` 对应条目，后续围绕该成员继续处理。
    const sample = ((chunk[i]! | (chunk[i + 1]! << 8)) << 16) >> 16
    // React hook use Voice在这里处理 `sumSq += sample * sample`，完成这一小步状态转换。
    sumSq += sample * sample
  }
  // rms 集合保存`Math.sqrt`，供React hook后续处理使用。
  const rms = Math.sqrt(sumSq / samples)
  // normalized保存`Math.min`，供React hook后续处理使用。
  const normalized = Math.min(rms / 2000, 1)
  // 返回 `Math.sqrt(normalized)`，作为React hook 状态流这次计算的结果。
  return Math.sqrt(normalized)
}

// useVoice 封装useVoice的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useVoice({
  onTranscript,
  onError,
  enabled,
  focusMode,
}: UseVoiceOptions): UseVoiceReturn {
  // 状态 由 React state 持有，setState 会在用户操作或异步结果返回时触发刷新。
  const [state, setState] = useState<VoiceState>('idle')
  // stateRef 引用保存 hook 状态，让React hook use Voice跨渲染复用同一个容器。
  const stateRef = useRef<VoiceState>('idle')
  // connectionRef 引用保存 hook 状态，让React hook use Voice跨渲染复用同一个容器。
  const connectionRef = useRef<VoiceStreamConnection | null>(null)
  // accumulatedRef 引用保存`useRef`，供React hook后续处理使用。
  const accumulatedRef = useRef('')
  // onTranscriptRef 引用保存`useRef`，供React hook后续处理使用。
  const onTranscriptRef = useRef(onTranscript)
  // onErrorRef 引用保存`useRef`，供React hook后续处理使用。
  const onErrorRef = useRef(onError)
  // cleanupTimerRef 引用保存 hook 状态，让React hook use Voice跨渲染复用同一个容器。
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // releaseTimerRef 引用保存 hook 状态，让React hook use Voice跨渲染复用同一个容器。
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // True once we've seen a second keypress (auto-repeat) while recording.
  // The OS key repeat delay (~500ms on macOS) means the first keypress is
  // solo — arming the release timer before auto-repeat starts would cause
  // a false release.
  // seenRepeatRef 引用保存`useRef`，供React hook后续处理使用。
  const seenRepeatRef = useRef(false)
  // repeatFallbackTimerRef 引用保存 hook 状态，让React hook use Voice跨渲染复用同一个容器。
  const repeatFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  // True when the current recording session was started by terminal focus
  // (not by a keypress). Focus-driven sessions end on blur, not key release.
  // focusTriggeredRef 引用保存`useRef`，供React hook后续处理使用。
  const focusTriggeredRef = useRef(false)
  // Timer that tears down the session after prolonged silence in focus mode.
  // focusSilenceTimerRef 引用保存 hook 状态，让React hook use Voice跨渲染复用同一个容器。
  const focusSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  // Set when a focus-mode session is torn down due to silence. Prevents
  // the focus effect from immediately restarting. Cleared on blur so the
  // next focus cycle re-arms recording.
  // silenceTimedOutRef 引用保存`useRef`，供React hook后续处理使用。
  const silenceTimedOutRef = useRef(false)
  // recordingStartRef 引用保存`useRef`，供React hook后续处理使用。
  const recordingStartRef = useRef(0)
  // Incremented on each startRecordingSession(). Callbacks capture their
  // generation and bail if a newer session has started — prevents a zombie
  // slow-connecting WS from an abandoned session from overwriting
  // connectionRef mid-way through the next session.
  // sessionGenRef 引用保存`useRef`，供React hook后续处理使用。
  const sessionGenRef = useRef(0)
  // True if the early-error retry fired during this session.
  // Tracked for the tengu_voice_recording_completed analytics event.
  // retryUsedRef 引用保存`useRef`，供React hook后续处理使用。
  const retryUsedRef = useRef(false)
  // Full audio captured this session, kept for silent-drop replay. ~1% of
  // sessions get a sticky-broken CE pod that accepts audio but returns zero
  // transcripts (anthropics/anthropic#287008 session-sticky variant); when
  // finalize() resolves via no_data_timeout with hadAudioSignal=true, we
  // replay the buffer on a fresh WS once. Bounded: 32KB/s × ~60s max ≈ 2MB.
  // fullAudioRef 引用保存 hook 状态，让React hook use Voice跨渲染复用同一个容器。
  const fullAudioRef = useRef<Buffer[]>([])
  // silentDropRetriedRef 引用保存`useRef`，供React hook后续处理使用。
  const silentDropRetriedRef = useRef(false)
  // Bumped when the early-error retry is scheduled. Captured per
  // attemptConnect — onError swallows stale-gen events (conn 1's
  // trailing close-error) but surfaces current-gen ones (conn 2's
  // genuine failure). Same shape as sessionGenRef, one level down.
  // attemptGenRef 引用保存`useRef`，供React hook后续处理使用。
  const attemptGenRef = useRef(0)
  // Running total of chars flushed in focus mode (each final transcript is
  // injected immediately and accumulatedRef reset). Added to transcriptChars
  // in the completed event so focus-mode sessions don't false-positive as
  // silent-drops (transcriptChars=0 despite successful transcription).
  // focusFlushedCharsRef 引用保存`useRef`，供React hook后续处理使用。
  const focusFlushedCharsRef = useRef(0)
  // True if at least one audio chunk with non-trivial signal was received.
  // Used to distinguish "microphone is silent/inaccessible" from "speech not detected".
  // hasAudioSignalRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const hasAudioSignalRef = useRef(false)
  // True once onReady fired for the current session. Unlike connectionRef
  // (which cleanup() nulls), this survives effect-order races where Effect 3
  // cleanup runs before Effect 2's finishRecording() — e.g. /voice toggled
  // off mid-recording in focus mode. Used for the wsConnected analytics
  // dimension and error-message branching. Reset in startRecordingSession.
  // everConnectedRef 引用保存`useRef`，供React hook后续处理使用。
  const everConnectedRef = useRef(false)
  // audioLevelsRef 引用保存 hook 状态，让React hook use Voice跨渲染复用同一个容器。
  const audioLevelsRef = useRef<number[]>([])
  // isFocused记录 `useTerminalFocus` 是否成立，React hook随后按该结果分支。
  const isFocused = useTerminalFocus()
  // setVoiceState 状态保存`useSetVoiceState`，供React hook后续处理使用。
  const setVoiceState = useSetVoiceState()

  // Keep callback refs current without triggering re-renders
  // current更新为 `onTranscript`，确保useVoice后续读取最新状态。
  onTranscriptRef.current = onTranscript
  // current更新为 `onError`，确保useVoice后续读取最新状态。
  onErrorRef.current = onError

  // updateState 封装useVoice的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function updateState(newState: VoiceState): void {
    // current更新为 `newState`，确保useVoice后续读取最新状态。
    stateRef.current = newState
    // setState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setState(newState)
    // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setVoiceState(prev => {
      // 满足 `prev.voiceState === newState` 时，React hook执行该分支。
      if (prev.voiceState === newState) return prev
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { ...prev, voiceState: newState }
    })
  }

  // cleanup保存`useCallback`，供React hook后续处理使用。
  const cleanup = useCallback((): void => {
    // Stale any in-flight session (main connection isStale(), replay
    // isStale(), finishRecording continuation). Without this, disabling
    // voice during the replay window lets the stale replay open a WS,
    // accumulate transcript, and inject it after voice was torn down.
    // React hook use Voice在这里处理 `sessionGenRef.current++`，完成这一小步状态转换。
    sessionGenRef.current++
    // 满足 `cleanupTimerRef.current` 时，React hook执行该分支。
    if (cleanupTimerRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(cleanupTimerRef.current)
      // current更新为 `null`，确保useVoice后续读取最新状态。
      cleanupTimerRef.current = null
    }
    // 满足 `releaseTimerRef.current` 时，React hook执行该分支。
    if (releaseTimerRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(releaseTimerRef.current)
      // current更新为 `null`，确保useVoice后续读取最新状态。
      releaseTimerRef.current = null
    }
    // 满足 `repeatFallbackTimerRef.current` 时，React hook执行该分支。
    if (repeatFallbackTimerRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(repeatFallbackTimerRef.current)
      // current更新为 `null`，确保useVoice后续读取最新状态。
      repeatFallbackTimerRef.current = null
    }
    // 满足 `focusSilenceTimerRef.current` 时，React hook执行该分支。
    if (focusSilenceTimerRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(focusSilenceTimerRef.current)
      // current更新为 `null`，确保useVoice后续读取最新状态。
      focusSilenceTimerRef.current = null
    }
    // current更新为 `false`，确保useVoice后续读取最新状态。
    silenceTimedOutRef.current = false
    // 调用 voiceModule?.stopRecording()，完成这一处局部操作。
    voiceModule?.stopRecording()
    // 满足 `connectionRef.current` 时，React hook执行该分支。
    if (connectionRef.current) {
      // 调用 connectionRef.current.close，触发React hook此处需要的副作用。
      connectionRef.current.close()
      // current更新为 `null`，确保useVoice后续读取最新状态。
      connectionRef.current = null
    }
    // current更新为 `''`，确保useVoice后续读取最新状态。
    accumulatedRef.current = ''
    // current更新为 `[]`，确保useVoice后续读取最新状态。
    audioLevelsRef.current = []
    // current更新为 `[]`，确保useVoice后续读取最新状态。
    fullAudioRef.current = []
    // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setVoiceState(prev => {
      // 组合条件 `prev.voiceInterimTranscript === '' && !prev.voiceAudioLevels.length` 成立时，React hook 状态流才启用这条专门路径。
      if (prev.voiceInterimTranscript === '' && !prev.voiceAudioLevels.length)
        // 返回 `prev`，作为React hook 状态流这次计算的结果。
        return prev
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { ...prev, voiceInterimTranscript: '', voiceAudioLevels: [] }
    })
  }, [setVoiceState])

  // finishRecording 封装useVoice的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function finishRecording(): void {
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[voice] finishRecording: stopping recording, transitioning to processing',
    )
    // Session ending — stale any in-flight attempt so its late onError
    // (conn 2 responding after user released key) doesn't double-fire on
    // top of the "check network" message below.
    // React hook use Voice在这里处理 `attemptGenRef.current++`，完成这一小步状态转换。
    attemptGenRef.current++
    // Capture focusTriggered BEFORE clearing it — needed as an event dimension
    // so BigQuery can filter out passive focus-mode auto-recordings (user focused
    // terminal without speaking → ambient noise sets hadAudioSignal=true → false
    // silent-drop signature). focusFlushedCharsRef fixes transcriptChars accuracy
    // for sessions WITH speech; focusTriggered enables filtering sessions WITHOUT.
    // focusTriggered保存`focusTriggeredRef.current`，供后续判断或组装使用。
    const focusTriggered = focusTriggeredRef.current
    // current更新为 `false`，确保useVoice后续读取最新状态。
    focusTriggeredRef.current = false
    // 调用 updateState，触发React hook此处需要的副作用。
    updateState('processing')
    // 调用 voiceModule?.stopRecording()，完成这一处局部操作。
    voiceModule?.stopRecording()
    // Capture duration BEFORE the finalize round-trip so that the WebSocket
    // wait time is not included (otherwise a quick tap looks like > 2s).
    // All ref-backed values are captured here, BEFORE the async boundary —
    // a keypress during the finalize wait can start a new session and reset
    // these refs (e.g. focusFlushedCharsRef = 0 in startRecordingSession),
    // reproducing the silent-drop false-positive this ref exists to prevent.
    // recordingDurationMs 集合记录时间`Date.now`，供React hook后续处理使用。
    const recordingDurationMs = Date.now() - recordingStartRef.current
    // hadAudioSignal 命名 `hasAudioSignalRef.current`，让后续代码直接表达这个值的用途。
    const hadAudioSignal = hasAudioSignalRef.current
    // retried保存`retryUsedRef.current`，供后续判断或组装使用。
    const retried = retryUsedRef.current
    // focusFlushedChars 集合保存`focusFlushedCharsRef.current`，供React hook use Voice后续判断或输出使用。
    const focusFlushedChars = focusFlushedCharsRef.current
    // wsConnected distinguishes "backend received audio but dropped it" (the
    // bug backend PR #287008 fixes) from "WS handshake never completed" —
    // in the latter case audio is still in audioBuffer, never reached the
    // server, but hasAudioSignalRef is already true from ambient noise.
    // wsConnected 命名 `everConnectedRef.current`，让后续代码直接表达这个值的用途。
    const wsConnected = everConnectedRef.current
    // Capture generation BEFORE the .then() — if a new session starts during
    // the finalize wait, sessionGenRef has already advanced by the time the
    // continuation runs, so capturing inside the .then() would yield the new
    // session's gen and every staleness check would be a no-op.
    // myGen 命名 `sessionGenRef.current`，让后续代码直接表达这个值的用途。
    const myGen = sessionGenRef.current
    // isStale封装成回调，供React hook use Voice在事件触发或异步步骤中调用。
    const isStale = () => sessionGenRef.current !== myGen
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[voice] Recording stopped')

    // Send finalize and wait for the WebSocket to close before reading the
    // accumulated transcript.  The close handler promotes any unreported
    // interim text to final, so we must wait for it to fire.
    // finalizePromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
    const finalizePromise: Promise<FinalizeSource | undefined> =
      connectionRef.current
        ? connectionRef.current.finalize()
        : Promise.resolve(undefined)

    // 显式忽略 `finalizePromise` 的返回值，只保留它触发的副作用。
    void finalizePromise
      // 链式调用 then，继续加工上一行在React hook 状态流中产生的数据。
      .then(async finalizeSource => {
        // 满足 `isStale()` 时，React hook执行该分支。
        if (isStale()) return
        // Silent-drop replay: when the server accepted audio (wsConnected),
        // the mic captured real signal (hadAudioSignal), but finalize timed
        // out with zero transcript — the ~1% session-sticky CE-pod bug.
        // Replay the buffered audio on a fresh connection once. A 250ms
        // backoff clears the same-pod rapid-reconnect race (same gap as the
        // early-error retry path below).
        // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
        if (
          finalizeSource === 'no_data_timeout' &&
          hadAudioSignal &&
          wsConnected &&
          !focusTriggered &&
          focusFlushedChars === 0 &&
          accumulatedRef.current.trim() === '' &&
          !silentDropRetriedRef.current &&
          fullAudioRef.current.length > 0
        ) {
          // current更新为 `true`，确保useVoice后续读取最新状态。
          silentDropRetriedRef.current = true
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[voice] Silent-drop detected (no_data_timeout, ${String(fullAudioRef.current.length)} chunks); replaying on fresh connection`,
          )
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_voice_silent_drop_replay', {
            recordingDurationMs,
            chunkCount: fullAudioRef.current.length,
          })
          // 满足 `connectionRef.current` 时，React hook执行该分支。
          if (connectionRef.current) {
            // 调用 connectionRef.current.close，触发React hook此处需要的副作用。
            connectionRef.current.close()
            // current更新为 `null`，确保useVoice后续读取最新状态。
            connectionRef.current = null
          }
          // replayBuffer 命名 `fullAudioRef.current`，让后续代码直接表达这个值的用途。
          const replayBuffer = fullAudioRef.current
          // 等待 `sleep(250)` 完成，再继续React hook use Voice的异步流程。
          await sleep(250)
          // 满足 `isStale()` 时，React hook执行该分支。
          if (isStale()) return
          // stt保存`normalizeLanguageForSTT`，供React hook后续处理使用。
          const stt = normalizeLanguageForSTT(getInitialSettings().language)
          // keyterms 集合读取`getVoiceKeyterms`，供React hook后续处理使用。
          const keyterms = await getVoiceKeyterms()
          // 满足 `isStale()` 时，React hook执行该分支。
          if (isStale()) return
          // 这个回调绑定到 await new Promise<void>(resolve => {，负责React hook 状态流在该局部场景下的响应。
          await new Promise<void>(resolve => {
            // 显式忽略 `connectVoiceStream(` 的返回值，只保留它触发的副作用。
            void connectVoiceStream(
              {
                // 这个回调绑定到 onTranscript: (t, isFinal) => {，负责React hook 状态流在该局部场景下的响应。
                onTranscript: (t, isFinal) => {
                  // 满足 `isStale()` 时，React hook执行该分支。
                  if (isStale()) return
                  // 组合条件 `isFinal && t.trim()` 成立时，React hook 状态流才启用这条专门路径。
                  if (isFinal && t.trim()) {
                    // 满足 `accumulatedRef.current` 时，React hook执行该分支。
                    if (accumulatedRef.current) accumulatedRef.current += ' '
                    // React hook use Voice在这里处理 `accumulatedRef.current += t.trim()`，完成这一小步状态转换。
                    accumulatedRef.current += t.trim()
                  }
                },
                // 这个回调绑定到 onError: () => resolve(),，负责React hook 状态流在该局部场景下的响应。
                onError: () => resolve(),
                // 这个回调绑定到 onClose: () => {},，负责React hook 状态流在该局部场景下的响应。
                onClose: () => {},
                // 这个回调绑定到 onReady: conn => {，负责React hook 状态流在该局部场景下的响应。
                onReady: conn => {
                  // 满足 `isStale()` 时，React hook执行该分支。
                  if (isStale()) {
                    // 调用 conn.close，触发React hook此处需要的副作用。
                    conn.close()
                    // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                    resolve()
                    // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
                    return
                  }
                  // current更新为 `conn`，确保useVoice后续读取最新状态。
                  connectionRef.current = conn
                  // SLICE 命名 `32_000`，让后续代码直接表达这个值的用途。
                  const SLICE = 32_000
                  // slice 从空数组开始收集，后续循环会按处理顺序追加条目。
                  let slice: Buffer[] = []
                  // bytes 集合保存`0`，供后续判断或组装使用。
                  let bytes = 0
                  // 按顺序遍历 `replayBuffer` 中的c，逐个交给React hook处理。
                  for (const c of replayBuffer) {
                    // 组合条件 `bytes > 0 && bytes + c.length > SLICE` 成立时，React hook 状态流才启用这条专门路径。
                    if (bytes > 0 && bytes + c.length > SLICE) {
                      // 调用 conn.send，触发React hook此处需要的副作用。
                      conn.send(Buffer.concat(slice))
                      // slice更新为 `[]`，确保useVoice后续读取最新状态。
                      slice = []
                      // bytes 集合更新为 `0`，确保useVoice后续读取最新状态。
                      bytes = 0
                    }
                    // slice追加新条目，保持收集顺序与输入顺序一致。
                    slice.push(c)
                    // React hook use Voice在这里处理 `bytes += c.length`，完成这一小步状态转换。
                    bytes += c.length
                  }
                  // 满足 `slice.length) conn.send(Buffer.concat(slice)` 时，React hook执行该分支。
                  if (slice.length) conn.send(Buffer.concat(slice))
                  // 这个回调绑定到 void conn.finalize().then(() => {，负责React hook 状态流在该局部场景下的响应。
                  void conn.finalize().then(() => {
                    // 调用 conn.close，触发React hook此处需要的副作用。
                    conn.close()
                    // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
                    resolve()
                  })
                },
              },
              { language: stt.code, keyterms },
            ).then(
              // c更新为 `> {`，确保useVoice后续读取最新状态。
              c => {
                // 满足 `!c) resolve(` 时，React hook执行该分支。
                if (!c) resolve()
              },
              // 这个回调绑定到 () => resolve(),，负责React hook 状态流在该局部场景下的响应。
              () => resolve(),
            )
          })
          // 满足 `isStale()` 时，React hook执行该分支。
          if (isStale()) return
        }
        // current更新为 `[]`，确保useVoice后续读取最新状态。
        fullAudioRef.current = []

        // 文本格式化`current.trim`，供React hook后续处理使用。
        const text = accumulatedRef.current.trim()
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[voice] Final transcript assembled (${String(text.length)} chars): "${text.slice(0, 200)}"`,
        )

        // Tracks silent-drop rate: transcriptChars=0 + hadAudioSignal=true
        // + recordingDurationMs>2000 = the bug backend PR #287008 fixes.
        // focusFlushedCharsRef makes transcriptChars accurate for focus mode
        // (where each final is injected immediately and accumulatedRef reset).
        //
        // NOTE: this fires only on the finishRecording() path. The onError
        // fallthrough and !conn (no-OAuth) paths bypass this → don't compute
        // COUNT(completed)/COUNT(started) as a success rate; the silent-drop
        // denominator (completed events only) is internally consistent.
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_voice_recording_completed', {
          transcriptChars: text.length + focusFlushedChars,
          recordingDurationMs,
          hadAudioSignal,
          retried,
          silentDropRetried: silentDropRetriedRef.current,
          wsConnected,
          focusTriggered,
        })

        // 满足 `connectionRef.current` 时，React hook执行该分支。
        if (connectionRef.current) {
          // 调用 connectionRef.current.close，触发React hook此处需要的副作用。
          connectionRef.current.close()
          // current更新为 `null`，确保useVoice后续读取最新状态。
          connectionRef.current = null
        }

        // 满足 `text` 时，React hook执行该分支。
        if (text) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[voice] Injecting transcript (${String(text.length)} chars)`,
          )
          // 调用 onTranscriptRef.current，触发React hook此处需要的副作用。
          onTranscriptRef.current(text)
        // React hook use Voice在这里处理 `} else if (focusFlushedChars === 0 && recordingDurationMs > 2000) {`，完成这一小步状态转换。
        } else if (focusFlushedChars === 0 && recordingDurationMs > 2000) {
          // Only warn about empty transcript if nothing was flushed in focus
          // mode either, and recording was > 2s (short recordings = accidental
          // taps → silently return to idle).
          // wsConnected缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
          if (!wsConnected) {
            // WS never connected → audio never reached backend. Not a silent
            // drop; a connection failure (slow OAuth refresh, network, etc).
            // React hook use Voice在这里处理 `onErrorRef.current?.(`，完成这一小步状态转换。
            onErrorRef.current?.(
              'Voice connection failed. Check your network and try again.',
            )
          // React hook use Voice在这里处理 `} else if (!hadAudioSignal) {`，完成这一小步状态转换。
          } else if (!hadAudioSignal) {
            // Distinguish silent mic (capture issue) from speech not recognized.
            // React hook use Voice在这里处理 `onErrorRef.current?.(`，完成这一小步状态转换。
            onErrorRef.current?.(
              'No audio detected from microphone. Check that the correct input device is selected and that Claude Code has microphone access.',
            )
          } else {
            // 调用 onErrorRef.current?.('No speech detected.')，完成这一处局部操作。
            onErrorRef.current?.('No speech detected.')
          }
        }

        // current更新为 `''`，确保useVoice后续读取最新状态。
        accumulatedRef.current = ''
        // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setVoiceState(prev => {
          // 满足 `prev.voiceInterimTranscript === ''` 时，React hook执行该分支。
          if (prev.voiceInterimTranscript === '') return prev
          // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
          return { ...prev, voiceInterimTranscript: '' }
        })
        // 调用 updateState，触发React hook此处需要的副作用。
        updateState('idle')
      })
      // 链式调用 catch，继续加工上一行在React hook 状态流中产生的数据。
      .catch(err => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logError(toError(err))
        // 满足 `!isStale()) updateState('idle'` 时，React hook执行该分支。
        if (!isStale()) updateState('idle')
      })
  }

  // When voice is enabled, lazy-import voice.ts so checkRecordingAvailability
  // et al. are ready when the user presses the voice key. Do NOT preload the
  // native module — require('audio-capture.node') is a synchronous dlopen of
  // CoreAudio/AudioUnit that blocks the event loop for ~1s (warm) to ~8s
  // (cold coreaudiod). setImmediate doesn't help: it yields one tick, then the
  // dlopen still blocks. The first voice keypress pays the dlopen cost instead.
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 组合条件 `enabled && !voiceModule` 成立时，React hook 状态流才启用这条专门路径。
    if (enabled && !voiceModule) {
      // 这个回调绑定到 void import('../services/voice.js').then(mod => {，负责React hook 状态流在该局部场景下的响应。
      void import('../services/voice.js').then(mod => {
        // voiceModule更新为 `mod`，确保useVoice后续读取最新状态。
        voiceModule = mod
      })
    }
  }, [enabled])

  // ── Focus silence timer ────────────────────────────────────────────
  // Arms (or resets) a timer that tears down the focus-mode session
  // after FOCUS_SILENCE_TIMEOUT_MS of no speech. Called when a session
  // starts and after each flushed transcript.
  // armFocusSilenceTimer 封装useVoice的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function armFocusSilenceTimer(): void {
    // 满足 `focusSilenceTimerRef.current` 时，React hook执行该分支。
    if (focusSilenceTimerRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(focusSilenceTimerRef.current)
    }
    // current更新为 `setTimeout(`，确保useVoice后续读取最新状态。
    focusSilenceTimerRef.current = setTimeout(
      // React hook use Voice在这里处理 `(`，完成这一小步状态转换。
      (
        focusSilenceTimerRef,
        stateRef,
        focusTriggeredRef,
        silenceTimedOutRef,
        finishRecording,
      ) => {
        // current更新为 `null`，确保useVoice后续读取最新状态。
        focusSilenceTimerRef.current = null
        // 组合条件 `stateRef.current === 'recording' && focusTriggere` 成立时，React hook 状态流才启用这条专门路径。
        if (stateRef.current === 'recording' && focusTriggeredRef.current) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            '[voice] Focus silence timeout — tearing down session',
          )
          // current更新为 `true`，确保useVoice后续读取最新状态。
          silenceTimedOutRef.current = true
          // 调用 finishRecording，触发React hook此处需要的副作用。
          finishRecording()
        }
      },
      FOCUS_SILENCE_TIMEOUT_MS,
      focusSilenceTimerRef,
      stateRef,
      focusTriggeredRef,
      silenceTimedOutRef,
      finishRecording,
    )
  }

  // ── Focus-driven recording ──────────────────────────────────────────
  // In focus mode, start recording when the terminal gains focus and
  // stop when it loses focus. This enables a "multi-clauding army"
  // workflow where voice input follows window focus.
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 组合条件 `!enabled || !focusMode` 成立时，React hook 状态流才启用这条专门路径。
    if (!enabled || !focusMode) {
      // Focus mode was disabled while a focus-driven recording was active —
      // stop the recording so it doesn't linger until the silence timer fires.
      // 组合条件 `focusTriggeredRef.current && stateRef.current ===` 成立时，React hook 状态流才启用这条专门路径。
      if (focusTriggeredRef.current && stateRef.current === 'recording') {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[voice] Focus mode disabled during recording, finishing',
        )
        // 调用 finishRecording，触发React hook此处需要的副作用。
        finishRecording()
      }
      // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // cancelled标记React hook use Voice是否启用对应路径。
    let cancelled = false
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      isFocused &&
      stateRef.current === 'idle' &&
      !silenceTimedOutRef.current
    ) {
      // beginFocusRecording封装成回调，供React hook use Voice在事件触发或异步步骤中调用。
      const beginFocusRecording = (): void => {
        // Re-check conditions — state or enabled/focusMode may have changed
        // during the await (effect cleanup sets cancelled).
        // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
        if (
          cancelled ||
          stateRef.current !== 'idle' ||
          silenceTimedOutRef.current
        )
          // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[voice] Focus gained, starting recording session')
        // current更新为 `true`，确保useVoice后续读取最新状态。
        focusTriggeredRef.current = true
        // 显式忽略 `startRecordingSession()` 的返回值，只保留它触发的副作用。
        void startRecordingSession()
        // 调用 armFocusSilenceTimer，触发React hook此处需要的副作用。
        armFocusSilenceTimer()
      }
      // 满足 `voiceModule` 时，React hook执行该分支。
      if (voiceModule) {
        // 调用 beginFocusRecording，触发React hook此处需要的副作用。
        beginFocusRecording()
      } else {
        // Voice module is loading (async import resolves from cache as a
        // microtask). Wait for it before starting the recording session.
        // 这个回调绑定到 void import('../services/voice.js').then(mod => {，负责React hook 状态流在该局部场景下的响应。
        void import('../services/voice.js').then(mod => {
          // voiceModule更新为 `mod`，确保useVoice后续读取最新状态。
          voiceModule = mod
          // 调用 beginFocusRecording，触发React hook此处需要的副作用。
          beginFocusRecording()
        })
      }
    // React hook use Voice在这里处理 `} else if (!isFocused) {`，完成这一小步状态转换。
    } else if (!isFocused) {
      // Clear the silence timeout flag on blur so the next focus
      // cycle re-arms recording.
      // current更新为 `false`，确保useVoice后续读取最新状态。
      silenceTimedOutRef.current = false
      // 当 `stateRef.current` 匹配 `'recording'` 时，React hook执行对应分支。
      if (stateRef.current === 'recording') {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[voice] Focus lost, finishing recording')
        // 调用 finishRecording，触发React hook此处需要的副作用。
        finishRecording()
      }
    }
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // cancelled更新为 `true`，确保useVoice后续读取最新状态。
      cancelled = true
    }
  }, [enabled, focusMode, isFocused])

  // ── Start a new recording session (voice_stream connect + audio) ──
  // startRecordingSession 封装useVoice的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function startRecordingSession(): Promise<void> {
    // voiceModule缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!voiceModule) {
      // React hook use Voice在这里处理 `onErrorRef.current?.(`，完成这一小步状态转换。
      onErrorRef.current?.(
        'Voice module not loaded yet. Try again in a moment.',
      )
      // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Transition to 'recording' synchronously, BEFORE any await. Callers
    // read state synchronously right after `void startRecordingSession()`:
    // - useVoiceIntegration.tsx space-hold guard reads voiceState from the
    //   store immediately — if it sees 'idle' it clears isSpaceHoldActiveRef
    //   and space auto-repeat leaks into the text input (100% repro)
    // - handleKeyEvent's `currentState === 'idle'` re-entry check below
    // If an await runs first, both see stale 'idle'. See PR #20873 review.
    // 调用 updateState，触发React hook此处需要的副作用。
    updateState('recording')
    // current更新为 `Date.now()`，确保useVoice后续读取最新状态。
    recordingStartRef.current = Date.now()
    // current更新为 `''`，确保useVoice后续读取最新状态。
    accumulatedRef.current = ''
    // current更新为 `false`，确保useVoice后续读取最新状态。
    seenRepeatRef.current = false
    // current更新为 `false`，确保useVoice后续读取最新状态。
    hasAudioSignalRef.current = false
    // current更新为 `false`，确保useVoice后续读取最新状态。
    retryUsedRef.current = false
    // current更新为 `false`，确保useVoice后续读取最新状态。
    silentDropRetriedRef.current = false
    // current更新为 `[]`，确保useVoice后续读取最新状态。
    fullAudioRef.current = []
    // current更新为 `0`，确保useVoice后续读取最新状态。
    focusFlushedCharsRef.current = 0
    // current更新为 `false`，确保useVoice后续读取最新状态。
    everConnectedRef.current = false
    // myGen保存`++sessionGenRef.current`，供React hook use Voice后续判断或输出使用。
    const myGen = ++sessionGenRef.current

    // ── Pre-check: can we actually record audio? ──────────────
    // availability读取`voiceModule.checkRecordingAvailability`，供React hook后续处理使用。
    const availability = await voiceModule.checkRecordingAvailability()
    // availability.available缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!availability.available) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[voice] Recording not available: ${availability.reason ?? 'unknown'}`,
      )
      // React hook use Voice在这里处理 `onErrorRef.current?.(`，完成这一小步状态转换。
      onErrorRef.current?.(
        availability.reason ?? 'Audio recording is not available.',
      )
      // 调用 cleanup，触发React hook此处需要的副作用。
      cleanup()
      // 调用 updateState，触发React hook此处需要的副作用。
      updateState('idle')
      // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[voice] Starting recording session, connecting voice stream',
    )
    // Clear any previous error
    // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setVoiceState(prev => {
      // prev.voiceError 错误信息缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!prev.voiceError) return prev
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { ...prev, voiceError: null }
    })

    // Buffer audio chunks while the WebSocket connects. Once the connection
    // is ready (onReady fires), buffered chunks are flushed and subsequent
    // chunks are sent directly.
    // audioBuffer 从空数组开始收集，后续循环会按处理顺序追加条目。
    const audioBuffer: Buffer[] = []

    // Start recording IMMEDIATELY — audio is buffered until the WebSocket
    // opens, eliminating the 1-2s latency from waiting for OAuth + WS connect.
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[voice] startRecording: buffering audio while WebSocket connects',
    )
    // current更新为 `[]`，确保useVoice后续读取最新状态。
    audioLevelsRef.current = []
    // started保存`voiceModule.startRecording`，供React hook后续处理使用。
    const started = await voiceModule.startRecording(
      // 这个回调绑定到 (chunk: Buffer) => {，负责React hook 状态流在该局部场景下的响应。
      (chunk: Buffer) => {
        // Copy for fullAudioRef replay buffer. send() in voiceStreamSTT
        // copies again defensively — acceptable overhead at audio rates.
        // Skip buffering in focus mode — replay is gated on !focusTriggered
        // so the buffer is dead weight (up to ~20MB for a 10min session).
        // owned保存`Buffer.from`，供React hook后续处理使用。
        const owned = Buffer.from(chunk)
        // focusTriggeredRef.current缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!focusTriggeredRef.current) {
          // current追加新条目，保持收集顺序与输入顺序一致。
          fullAudioRef.current.push(owned)
        }
        // 满足 `connectionRef.current` 时，React hook执行该分支。
        if (connectionRef.current) {
          // 调用 connectionRef.current.send，触发React hook此处需要的副作用。
          connectionRef.current.send(owned)
        } else {
          // audioBuffer追加新条目，保持收集顺序与输入顺序一致。
          audioBuffer.push(owned)
        }
        // Update audio level histogram for the recording visualizer
        // level保存`computeLevel`，供React hook后续处理使用。
        const level = computeLevel(chunk)
        // 组合条件 `!hasAudioSignalRef.current && level > 0.01` 成立时，React hook 状态流才启用这条专门路径。
        if (!hasAudioSignalRef.current && level > 0.01) {
          // current更新为 `true`，确保useVoice后续读取最新状态。
          hasAudioSignalRef.current = true
        }
        // levels 集合 命名 `audioLevelsRef.current`，让后续代码直接表达这个值的用途。
        const levels = audioLevelsRef.current
        // 满足 `levels.length >= AUDIO_LEVEL_BARS` 时，React hook执行该分支。
        if (levels.length >= AUDIO_LEVEL_BARS) {
          // 调用 levels.shift，触发React hook此处需要的副作用。
          levels.shift()
        }
        // levels 集合追加新条目，保持收集顺序与输入顺序一致。
        levels.push(level)
        // Copy the array so React sees a new reference
        // snapshot 聚合成有序列表，保持后续遍历顺序稳定。
        const snapshot = [...levels]
        // current更新为 `snapshot`，确保useVoice后续读取最新状态。
        audioLevelsRef.current = snapshot
        // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setVoiceState(prev => ({ ...prev, voiceAudioLevels: snapshot }))
      },
      // 这个回调绑定到 () => {，负责React hook 状态流在该局部场景下的响应。
      () => {
        // External end (e.g. device error) - treat as stop
        // 当 `stateRef.current` 匹配 `'recording'` 时，React hook执行对应分支。
        if (stateRef.current === 'recording') {
          // 调用 finishRecording，触发React hook此处需要的副作用。
          finishRecording()
        }
      },
      { silenceDetection: false },
    )

    // started缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!started) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logError(new Error('[voice] Recording failed — no audio tool found'))
      // React hook use Voice在这里处理 `onErrorRef.current?.(`，完成这一小步状态转换。
      onErrorRef.current?.(
        'Failed to start audio capture. Check that your microphone is accessible.',
      )
      // 调用 cleanup，触发React hook此处需要的副作用。
      cleanup()
      // 调用 updateState，触发React hook此处需要的副作用。
      updateState('idle')
      // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setVoiceState(prev => ({
        ...prev,
        voiceError: 'Recording failed — no audio tool found',
      }))
      // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // rawLanguage读取`getInitialSettings`，供React hook后续处理使用。
    const rawLanguage = getInitialSettings().language
    // stt保存`normalizeLanguageForSTT`，供React hook后续处理使用。
    const stt = normalizeLanguageForSTT(rawLanguage)
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_voice_recording_started', {
      focusTriggered: focusTriggeredRef.current,
      sttLanguage:
        stt.code as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      sttLanguageIsDefault: !rawLanguage?.trim(),
      sttLanguageFellBack: stt.fellBackFrom !== undefined,
      // ISO 639 subtag from Intl (bounded set, never user text). undefined if
      // Intl failed — omitted from the payload, no retry cost (cached).
      systemLocaleLanguage:
        getSystemLocaleLanguage() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // Retry once if the connection errors before delivering any transcript.
    // The conversation-engine proxy can reject rapid reconnects (~1/N_pods
    // same-pod collision) or CE's Deepgram upstream can fail during its own
    // teardown window (anthropics/anthropic#287008 surfaces this as
    // TranscriptError instead of silent-drop). A 250ms backoff clears both.
    // Audio captured during the retry window routes to audioBuffer (via the
    // connectionRef.current null check in the recording callback above) and
    // is flushed by the second onReady.
    // sawTranscript标记React hook use Voice是否启用对应路径。
    let sawTranscript = false

    // Connect WebSocket in parallel with audio recording.
    // Gather keyterms first (async but fast — no model calls), then connect.
    // Bail from callbacks if a newer session has started. Prevents a
    // slow-connecting zombie WS (e.g. user released, pressed again, first
    // WS still handshaking) from firing onReady/onError into the new
    // session and corrupting its connectionRef / triggering a bogus retry.
    // isStale封装成回调，供React hook use Voice在事件触发或异步步骤中调用。
    const isStale = () => sessionGenRef.current !== myGen

    // attemptConnect封装成回调，供React hook use Voice在事件触发或异步步骤中调用。
    const attemptConnect = (keyterms: string[]): void => {
      // myAttemptGen保存`attemptGenRef.current`，供React hook use Voice后续判断或输出使用。
      const myAttemptGen = attemptGenRef.current
      // 显式忽略 `connectVoiceStream(` 的返回值，只保留它触发的副作用。
      void connectVoiceStream(
        {
          // 这个回调绑定到 onTranscript: (text: string, isFinal: boolean) => {，负责React hook 状态流在该局部场景下的响应。
          onTranscript: (text: string, isFinal: boolean) => {
            // 满足 `isStale()` 时，React hook执行该分支。
            if (isStale()) return
            // sawTranscript更新为 `true`，确保useVoice后续读取最新状态。
            sawTranscript = true
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[voice] onTranscript: isFinal=${String(isFinal)} text="${text}"`,
            )
            // 组合条件 `isFinal && text.trim()` 成立时，React hook 状态流才启用这条专门路径。
            if (isFinal && text.trim()) {
              // 满足 `focusTriggeredRef.current` 时，React hook执行该分支。
              if (focusTriggeredRef.current) {
                // Focus mode: flush each final transcript immediately and
                // keep recording. This gives continuous transcription while
                // the terminal is focused.
                // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[voice] Focus mode: flushing final transcript immediately: "${text.trim()}"`,
                )
                // 调用 onTranscriptRef.current，触发React hook此处需要的副作用。
                onTranscriptRef.current(text.trim())
                // React hook use Voice在这里处理 `focusFlushedCharsRef.current += text.trim().length`，完成这一小步状态转换。
                focusFlushedCharsRef.current += text.trim().length
                // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
                setVoiceState(prev => {
                  // 满足 `prev.voiceInterimTranscript === ''` 时，React hook执行该分支。
                  if (prev.voiceInterimTranscript === '') return prev
                  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
                  return { ...prev, voiceInterimTranscript: '' }
                })
                // current更新为 `''`，确保useVoice后续读取最新状态。
                accumulatedRef.current = ''
                // User is actively speaking — reset the silence timer.
                // 调用 armFocusSilenceTimer，触发React hook此处需要的副作用。
                armFocusSilenceTimer()
              } else {
                // Hold-to-talk: accumulate final transcripts separated by spaces
                // 满足 `accumulatedRef.current` 时，React hook执行该分支。
                if (accumulatedRef.current) {
                  // React hook use Voice在这里处理 `accumulatedRef.current += ' '`，完成这一小步状态转换。
                  accumulatedRef.current += ' '
                }
                // React hook use Voice在这里处理 `accumulatedRef.current += text.trim()`，完成这一小步状态转换。
                accumulatedRef.current += text.trim()
                // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[voice] Accumulated final transcript: "${accumulatedRef.current}"`,
                )
                // Clear interim since final supersedes it
                // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
                setVoiceState(prev => {
                  // preview保存`accumulatedRef.current`，供后续判断或组装使用。
                  const preview = accumulatedRef.current
                  // 满足 `prev.voiceInterimTranscript === preview` 时，React hook执行该分支。
                  if (prev.voiceInterimTranscript === preview) return prev
                  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
                  return { ...prev, voiceInterimTranscript: preview }
                })
              }
            // React hook use Voice在这里处理 `} else if (!isFinal) {`，完成这一小步状态转换。
            } else if (!isFinal) {
              // Active interim speech resets the focus silence timer.
              // Nova 3 disables auto-finalize so isFinal is never true
              // mid-stream — without this, the 5s timer fires during
              // active speech and tears down the session.
              // 满足 `focusTriggeredRef.current` 时，React hook执行该分支。
              if (focusTriggeredRef.current) {
                // 调用 armFocusSilenceTimer，触发React hook此处需要的副作用。
                armFocusSilenceTimer()
              }
              // Show accumulated finals + current interim as live preview
              // interim格式化`text.trim`，供React hook后续处理使用。
              const interim = text.trim()
              // preview保存`accumulatedRef.current`，供后续判断或组装使用。
              const preview = accumulatedRef.current
                ? accumulatedRef.current + (interim ? ' ' + interim : '')
                : interim
              // setVoiceState 写入新的状态值，使React hook 状态流后续读取保持一致。
              setVoiceState(prev => {
                // 满足 `prev.voiceInterimTranscript === preview` 时，React hook执行该分支。
                if (prev.voiceInterimTranscript === preview) return prev
                // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
                return { ...prev, voiceInterimTranscript: preview }
              })
            }
          },
          // 这个回调绑定到 onError: (error: string, opts?: { fatal?: boolean }) => {，负责React hook 状态流在该局部场景下的响应。
          onError: (error: string, opts?: { fatal?: boolean }) => {
            // 满足 `isStale()` 时，React hook执行该分支。
            if (isStale()) {
              // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[voice] ignoring onError from stale session: ${error}`,
              )
              // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // Swallow errors from superseded attempts. Covers conn 1's
            // trailing close after retry is scheduled, AND the current
            // conn's ws close event after its ws error already surfaced
            // below (gen bumped at surface).
            // `attemptGenRef.current` 与 `myAttemptGen` 不一致时刷新派生状态，避免使用过期结果。
            if (attemptGenRef.current !== myAttemptGen) {
              // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[voice] ignoring stale onError from superseded attempt: ${error}`,
              )
              // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // Early-failure retry: server error before any transcript =
            // likely a transient upstream race (CE rejection, Deepgram
            // not ready). Clear connectionRef so audio re-buffers, back
            // off, reconnect. Skip if the user has already released the
            // key (state left 'recording') — no point retrying a session
            // they've ended. Fatal errors (Cloudflare bot challenge, auth
            // rejection) are the same failure on every retry attempt, so
            // fall through to surface the message.
            // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
            if (
              !opts?.fatal &&
              !sawTranscript &&
              stateRef.current === 'recording'
            ) {
              // retryUsedRef.current缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
              if (!retryUsedRef.current) {
                // current更新为 `true`，确保useVoice后续读取最新状态。
                retryUsedRef.current = true
                // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[voice] early voice_stream error (pre-transcript), retrying once: ${error}`,
                )
                // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
                logEvent('tengu_voice_stream_early_retry', {})
                // current更新为 `null`，确保useVoice后续读取最新状态。
                connectionRef.current = null
                // React hook use Voice在这里处理 `attemptGenRef.current++`，完成这一小步状态转换。
                attemptGenRef.current++
                // setTimeout 写入新的状态值，使React hook 状态流后续读取保持一致。
                setTimeout(
                  // 这个回调绑定到 (stateRef, attemptConnect, keyterms) => {，负责React hook 状态流在该局部场景下的响应。
                  (stateRef, attemptConnect, keyterms) => {
                    // 当 `stateRef.current` 匹配 `'recording'` 时，React hook执行对应分支。
                    if (stateRef.current === 'recording') {
                      // 调用 attemptConnect，触发React hook此处需要的副作用。
                      attemptConnect(keyterms)
                    }
                  },
                  250,
                  stateRef,
                  attemptConnect,
                  keyterms,
                )
                // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
                return
              }
            }
            // Surfacing — bump gen so this conn's trailing close-error
            // (ws fires error then close 1006) is swallowed above.
            // React hook use Voice在这里处理 `attemptGenRef.current++`，完成这一小步状态转换。
            attemptGenRef.current++
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logError(new Error(`[voice] voice_stream error: ${error}`))
            // 调用 onErrorRef.current?.(`Voice stream error: ${error}`)，完成这一处局部操作。
            onErrorRef.current?.(`Voice stream error: ${error}`)
            // Clear the audio buffer on error to avoid memory leaks
            // audioBuffer被清空，useVoice从干净状态继续。
            audioBuffer.length = 0
            // current更新为 `false`，确保useVoice后续读取最新状态。
            focusTriggeredRef.current = false
            // 调用 cleanup，触发React hook此处需要的副作用。
            cleanup()
            // 调用 updateState，触发React hook此处需要的副作用。
            updateState('idle')
          },
          // 这个回调绑定到 onClose: () => {，负责React hook 状态流在该局部场景下的响应。
          onClose: () => {
            // no-op; lifecycle handled by cleanup()
          },
          // 这个回调绑定到 onReady: conn => {，负责React hook 状态流在该局部场景下的响应。
          onReady: conn => {
            // Only proceed if we're still in recording state AND this is
            // still the current session. A zombie late-connecting WS from
            // an abandoned session can pass the 'recording' check if the
            // user has since started a new session.
            // `isStale() || stateRef.current` 与 `'recording'` 不一致时刷新派生状态，避免使用过期结果。
            if (isStale() || stateRef.current !== 'recording') {
              // 调用 conn.close，触发React hook此处需要的副作用。
              conn.close()
              // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }

            // The WebSocket is now truly open — assign connectionRef so
            // subsequent audio callbacks send directly instead of buffering.
            // current更新为 `conn`，确保useVoice后续读取最新状态。
            connectionRef.current = conn
            // current更新为 `true`，确保useVoice后续读取最新状态。
            everConnectedRef.current = true

            // Flush all audio chunks that were buffered while the WebSocket
            // was connecting.  This is safe because onReady fires from the
            // WebSocket 'open' event, guaranteeing send() will not be dropped.
            //
            // Coalesce into ~1s slices rather than one ws.send per chunk
            // — fewer WS frames means less overhead on both ends.
            // SLICE_TARGET_BYTES 集合保存`32_000 // ~1s at 16kHz/16-bit/mono`，供React hook use Voice后续判断或输出使用。
            const SLICE_TARGET_BYTES = 32_000 // ~1s at 16kHz/16-bit/mono
            // 满足 `audioBuffer.length > 0` 时，React hook执行该分支。
            if (audioBuffer.length > 0) {
              // totalBytes 集合 命名 `0`，让后续代码直接表达这个值的用途。
              let totalBytes = 0
              // 逐项读取 `audioBuffer` 中的c，按输入顺序推进React hook 状态流。
              for (const c of audioBuffer) totalBytes += c.length
              // slices 集合 聚合成有序列表，保持后续遍历顺序稳定。
              const slices: Buffer[][] = [[]]
              // sliceBytes 集合 命名 `0`，让后续代码直接表达这个值的用途。
              let sliceBytes = 0
              // 按顺序遍历 `audioBuffer` 中的chunk，逐个交给React hook处理。
              for (const chunk of audioBuffer) {
                // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
                if (
                  sliceBytes > 0 &&
                  sliceBytes + chunk.length > SLICE_TARGET_BYTES
                ) {
                  // slices 集合追加新条目，保持收集顺序与输入顺序一致。
                  slices.push([])
                  // sliceBytes 集合更新为 `0`，确保useVoice后续读取最新状态。
                  sliceBytes = 0
                }
                // React hook use Voice在这里处理 `slices[slices.length - 1]!.push(chunk)`，完成这一小步状态转换。
                slices[slices.length - 1]!.push(chunk)
                // React hook use Voice在这里处理 `sliceBytes += chunk.length`，完成这一小步状态转换。
                sliceBytes += chunk.length
              }
              // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[voice] onReady: flushing ${String(audioBuffer.length)} buffered chunks (${String(totalBytes)} bytes) as ${String(slices.length)} coalesced frame(s)`,
              )
              // 按顺序遍历 `slices` 中的slice，逐个交给React hook处理。
              for (const slice of slices) {
                // 调用 conn.send，触发React hook此处需要的副作用。
                conn.send(Buffer.concat(slice))
              }
            }
            // audioBuffer被清空，useVoice从干净状态继续。
            audioBuffer.length = 0

            // Reset the release timer now that the WebSocket is ready.
            // Only arm it if auto-repeat has been seen — otherwise the OS
            // key repeat delay (~500ms) hasn't elapsed yet and the timer
            // would fire prematurely.
            // 满足 `releaseTimerRef.current` 时，React hook执行该分支。
            if (releaseTimerRef.current) {
              // 调用 clearTimeout，触发React hook此处需要的副作用。
              clearTimeout(releaseTimerRef.current)
            }
            // 满足 `seenRepeatRef.current` 时，React hook执行该分支。
            if (seenRepeatRef.current) {
              // current更新为 `setTimeout(`，确保useVoice后续读取最新状态。
              releaseTimerRef.current = setTimeout(
                // 这个回调绑定到 (releaseTimerRef, stateRef, finishRecording) => {，负责React hook 状态流在该局部场景下的响应。
                (releaseTimerRef, stateRef, finishRecording) => {
                  // current更新为 `null`，确保useVoice后续读取最新状态。
                  releaseTimerRef.current = null
                  // 当 `stateRef.current` 匹配 `'recording'` 时，React hook执行对应分支。
                  if (stateRef.current === 'recording') {
                    // 调用 finishRecording，触发React hook此处需要的副作用。
                    finishRecording()
                  }
                },
                RELEASE_TIMEOUT_MS,
                releaseTimerRef,
                stateRef,
                finishRecording,
              )
            }
          },
        },
        {
          language: stt.code,
          keyterms,
        },
      // 这个回调绑定到 ).then(conn => {，负责React hook 状态流在该局部场景下的响应。
      ).then(conn => {
        // 满足 `isStale()` 时，React hook执行该分支。
        if (isStale()) {
          // 调用 conn?.close()，完成这一处局部操作。
          conn?.close()
          // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // conn缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!conn) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            '[voice] Failed to connect to voice_stream (no OAuth token?)',
          )
          // React hook use Voice在这里处理 `onErrorRef.current?.(`，完成这一小步状态转换。
          onErrorRef.current?.(
            'Voice mode requires a Claude.ai account. Please run /login to sign in.',
          )
          // Clear the audio buffer on failure
          // audioBuffer被清空，useVoice从干净状态继续。
          audioBuffer.length = 0
          // 调用 cleanup，触发React hook此处需要的副作用。
          cleanup()
          // 调用 updateState，触发React hook此处需要的副作用。
          updateState('idle')
          // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Safety check: if the user released the key before connectVoiceStream
        // resolved (but after onReady already ran), close the connection.
        // `stateRef.current` 与 `'recording'` 不一致时刷新派生状态，避免使用过期结果。
        if (stateRef.current !== 'recording') {
          // audioBuffer被清空，useVoice从干净状态继续。
          audioBuffer.length = 0
          // 调用 conn.close，触发React hook此处需要的副作用。
          conn.close()
          // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      })
    }

    // 显式忽略 `getVoiceKeyterms().then(attemptConnect)` 的返回值，只保留它触发的副作用。
    void getVoiceKeyterms().then(attemptConnect)
  }

  // ── Hold-to-talk handler ────────────────────────────────────────────
  // Called on every keypress (including terminal auto-repeats while
  // the key is held).  A gap longer than RELEASE_TIMEOUT_MS between
  // events is interpreted as key release.
  //
  // Recording starts immediately on the first keypress to eliminate
  // startup delay.  The release timer is only armed after auto-repeat
  // is detected (to avoid false releases during the OS key repeat
  // delay of ~500ms on macOS).
  // handleKeyEvent保存`useCallback`，供React hook后续处理使用。
  const handleKeyEvent = useCallback(
    (fallbackMs = REPEAT_FALLBACK_MS): void => {
      // 组合条件 `!enabled || !isVoiceStreamAvailable()` 成立时，React hook 状态流才启用这条专门路径。
      if (!enabled || !isVoiceStreamAvailable()) {
        // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // In focus mode, recording is driven by terminal focus, not keypresses.
      // 满足 `focusTriggeredRef.current` 时，React hook执行该分支。
      if (focusTriggeredRef.current) {
        // Active focus recording — ignore key events (session ends on blur).
        // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 组合条件 `focusMode && silenceTimedOutRef.current` 成立时，React hook 状态流才启用这条专门路径。
      if (focusMode && silenceTimedOutRef.current) {
        // Focus session timed out due to silence — keypress re-arms it.
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[voice] Re-arming focus recording after silence timeout',
        )
        // current更新为 `false`，确保useVoice后续读取最新状态。
        silenceTimedOutRef.current = false
        // current更新为 `true`，确保useVoice后续读取最新状态。
        focusTriggeredRef.current = true
        // 显式忽略 `startRecordingSession()` 的返回值，只保留它触发的副作用。
        void startRecordingSession()
        // 调用 armFocusSilenceTimer，触发React hook此处需要的副作用。
        armFocusSilenceTimer()
        // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // currentState 状态保存`stateRef.current`，供React hook use Voice后续判断或输出使用。
      const currentState = stateRef.current

      // Ignore keypresses while processing
      // 当 `currentState` 匹配 `'processing'` 时，React hook执行对应分支。
      if (currentState === 'processing') {
        // React hook use Voice在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 当 `currentState` 匹配 `'idle'` 时，React hook执行对应分支。
      if (currentState === 'idle') {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[voice] handleKeyEvent: idle, starting recording session immediately',
        )
        // 显式忽略 `startRecordingSession()` 的返回值，只保留它触发的副作用。
        void startRecordingSession()
        // Fallback: if no auto-repeat arrives within REPEAT_FALLBACK_MS,
        // arm the release timer anyway (the user likely tapped and released).
        // current更新为 `setTimeout(`，确保useVoice后续读取最新状态。
        repeatFallbackTimerRef.current = setTimeout(
          // React hook use Voice在这里处理 `(`，完成这一小步状态转换。
          (
            repeatFallbackTimerRef,
            stateRef,
            seenRepeatRef,
            releaseTimerRef,
            finishRecording,
          ) => {
            // current更新为 `null`，确保useVoice后续读取最新状态。
            repeatFallbackTimerRef.current = null
            // 组合条件 `stateRef.current === 'recording' && !seenRepeatRe` 成立时，React hook 状态流才启用这条专门路径。
            if (stateRef.current === 'recording' && !seenRepeatRef.current) {
              // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                '[voice] No auto-repeat seen, arming release timer via fallback',
              )
              // current更新为 `true`，确保useVoice后续读取最新状态。
              seenRepeatRef.current = true
              // current更新为 `setTimeout(`，确保useVoice后续读取最新状态。
              releaseTimerRef.current = setTimeout(
                // 这个回调绑定到 (releaseTimerRef, stateRef, finishRecording) => {，负责React hook 状态流在该局部场景下的响应。
                (releaseTimerRef, stateRef, finishRecording) => {
                  // current更新为 `null`，确保useVoice后续读取最新状态。
                  releaseTimerRef.current = null
                  // 当 `stateRef.current` 匹配 `'recording'` 时，React hook执行对应分支。
                  if (stateRef.current === 'recording') {
                    // 调用 finishRecording，触发React hook此处需要的副作用。
                    finishRecording()
                  }
                },
                RELEASE_TIMEOUT_MS,
                releaseTimerRef,
                stateRef,
                finishRecording,
              )
            }
          },
          fallbackMs,
          repeatFallbackTimerRef,
          stateRef,
          seenRepeatRef,
          releaseTimerRef,
          finishRecording,
        )
      // React hook use Voice在这里处理 `} else if (currentState === 'recording') {`，完成这一小步状态转换。
      } else if (currentState === 'recording') {
        // Second+ keypress while recording — auto-repeat has started.
        // current更新为 `true`，确保useVoice后续读取最新状态。
        seenRepeatRef.current = true
        // 满足 `repeatFallbackTimerRef.current` 时，React hook执行该分支。
        if (repeatFallbackTimerRef.current) {
          // 调用 clearTimeout，触发React hook此处需要的副作用。
          clearTimeout(repeatFallbackTimerRef.current)
          // current更新为 `null`，确保useVoice后续读取最新状态。
          repeatFallbackTimerRef.current = null
        }
      }

      // Reset the release timer on every keypress (including auto-repeats)
      // 满足 `releaseTimerRef.current` 时，React hook执行该分支。
      if (releaseTimerRef.current) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(releaseTimerRef.current)
      }

      // Only arm the release timer once auto-repeat has been seen.
      // The OS key repeat delay is ~500ms on macOS; without this gate
      // the 200ms timer fires before repeat starts, causing a false release.
      // 组合条件 `stateRef.current === 'recording' && seenRepeatRef` 成立时，React hook 状态流才启用这条专门路径。
      if (stateRef.current === 'recording' && seenRepeatRef.current) {
        // current更新为 `setTimeout(`，确保useVoice后续读取最新状态。
        releaseTimerRef.current = setTimeout(
          // 这个回调绑定到 (releaseTimerRef, stateRef, finishRecording) => {，负责React hook 状态流在该局部场景下的响应。
          (releaseTimerRef, stateRef, finishRecording) => {
            // current更新为 `null`，确保useVoice后续读取最新状态。
            releaseTimerRef.current = null
            // 当 `stateRef.current` 匹配 `'recording'` 时，React hook执行对应分支。
            if (stateRef.current === 'recording') {
              // 调用 finishRecording，触发React hook此处需要的副作用。
              finishRecording()
            }
          },
          RELEASE_TIMEOUT_MS,
          releaseTimerRef,
          stateRef,
          finishRecording,
        )
      }
    },
    [enabled, focusMode, cleanup],
  )

  // Cleanup only when disabled or unmounted - NOT on state changes
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // `!enabled && stateRef.current` 与 `'idle'` 不一致时刷新派生状态，避免使用过期结果。
    if (!enabled && stateRef.current !== 'idle') {
      // 调用 cleanup，触发React hook此处需要的副作用。
      cleanup()
      // 调用 updateState，触发React hook此处需要的副作用。
      updateState('idle')
    }
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 调用 cleanup，触发React hook此处需要的副作用。
      cleanup()
    }
  }, [enabled, cleanup])

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    state,
    handleKeyEvent,
  }
}

// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 ../../services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from '../../services/analytics/metadata.js'
// 引入 useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useSetAppState } from '../../state/AppState.js'
// 类型依赖 { ToolUseConfirm } 来自 ./PermissionRequest.js，用于校准终端渲染的数据契约。
import type { ToolUseConfirm } from './PermissionRequest.js'
// 引入 logUnaryPermissionEvent，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { logUnaryPermissionEvent } from './utils.js'

/**
 * Shared feedback-mode state + handlers for shell permission dialogs (Bash,
 * PowerShell). Encapsulates the yes/no input-mode toggle, feedback text state,
 * focus tracking, and reject handling.
 */
// useShellPermissionFeedback 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useShellPermissionFeedback({
  toolUseConfirm,
  onDone,
  onReject,
  explainerVisible,
}: {
  toolUseConfirm: ToolUseConfirm
  // 这个回调绑定到 onDone: () => void，负责终端渲染在该局部场景下的响应。
  onDone: () => void
  // 这个回调绑定到 onReject: () => void，负责终端渲染在该局部场景下的响应。
  onReject: () => void
  explainerVisible: boolean
}): {
  yesInputMode: boolean
  noInputMode: boolean
  yesFeedbackModeEntered: boolean
  noFeedbackModeEntered: boolean
  acceptFeedback: string
  rejectFeedback: string
  // 这个回调绑定到 setAcceptFeedback: (v: string) => void，负责终端渲染在该局部场景下的响应。
  setAcceptFeedback: (v: string) => void
  // 这个回调绑定到 setRejectFeedback: (v: string) => void，负责终端渲染在该局部场景下的响应。
  setRejectFeedback: (v: string) => void
  focusedOption: string
  // 这个回调绑定到 handleInputModeToggle: (option: string) => void，负责终端渲染在该局部场景下的响应。
  handleInputModeToggle: (option: string) => void
  // 这个回调绑定到 handleReject: (feedback?: string) => void，负责终端渲染在该局部场景下的响应。
  handleReject: (feedback?: string) => void
  // 这个回调绑定到 handleFocus: (value: string) => void，负责终端渲染在该局部场景下的响应。
  handleFocus: (value: string) => void
} {
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState()
  // rejectFeedback 由 React state 持有，setRejectFeedback 会在用户操作或异步结果返回时触发刷新。
  const [rejectFeedback, setRejectFeedback] = useState('')
  // acceptFeedback 由 React state 持有，setAcceptFeedback 会在用户操作或异步结果返回时触发刷新。
  const [acceptFeedback, setAcceptFeedback] = useState('')
  // yesInputMode 由 React state 持有，setYesInputMode 会在用户操作或异步结果返回时触发刷新。
  const [yesInputMode, setYesInputMode] = useState(false)
  // noInputMode 由 React state 持有，setNoInputMode 会在用户操作或异步结果返回时触发刷新。
  const [noInputMode, setNoInputMode] = useState(false)
  // focusedOption 由 React state 持有，setFocusedOption 会在用户操作或异步结果返回时触发刷新。
  const [focusedOption, setFocusedOption] = useState('yes')
  // Track whether user ever entered feedback mode (persists after collapse)
  // yesFeedbackModeEntered 由 React state 持有，setYesFeedbackModeEntered 会在用户操作或异步结果返回时触发刷新。
  const [yesFeedbackModeEntered, setYesFeedbackModeEntered] = useState(false)
  // noFeedbackModeEntered 由 React state 持有，setNoFeedbackModeEntered 会在用户操作或异步结果返回时触发刷新。
  const [noFeedbackModeEntered, setNoFeedbackModeEntered] = useState(false)

  // Handle Tab key toggling input mode for Yes/No options
  // handleInputModeToggle 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleInputModeToggle(option: string) {
    // Notify that user is interacting with the dialog
    // 调用 toolUseConfirm.onUserInteraction，触发终端渲染此处需要的副作用。
    toolUseConfirm.onUserInteraction()
    // analyticsProps 集合 集中保存终端渲染权限确认界面 use Shell Permission F...要一起传递的字段。
    const analyticsProps = {
      toolName: sanitizeToolNameForAnalytics(
        toolUseConfirm.tool.name,
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      isMcp: toolUseConfirm.tool.isMcp ?? false,
    }

    // 当 `option` 匹配 `'yes'` 时，终端渲染执行对应分支。
    if (option === 'yes') {
      // 满足 `yesInputMode` 时，终端渲染执行该分支。
      if (yesInputMode) {
        // setYesInputMode 写入新的状态值，使终端渲染后续读取保持一致。
        setYesInputMode(false)
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_accept_feedback_mode_collapsed', analyticsProps)
      } else {
        // setYesInputMode 写入新的状态值，使终端渲染后续读取保持一致。
        setYesInputMode(true)
        // setYesFeedbackModeEntered 写入新的状态值，使终端渲染后续读取保持一致。
        setYesFeedbackModeEntered(true)
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_accept_feedback_mode_entered', analyticsProps)
      }
    // 权限确认界面 use Shell Permission Feedback在这里处理 `} else if (option === 'no') {`，完成这一小步状态转换。
    } else if (option === 'no') {
      // 满足 `noInputMode` 时，终端渲染执行该分支。
      if (noInputMode) {
        // setNoInputMode 写入新的状态值，使终端渲染后续读取保持一致。
        setNoInputMode(false)
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_reject_feedback_mode_collapsed', analyticsProps)
      } else {
        // setNoInputMode 写入新的状态值，使终端渲染后续读取保持一致。
        setNoInputMode(true)
        // setNoFeedbackModeEntered 写入新的状态值，使终端渲染后续读取保持一致。
        setNoFeedbackModeEntered(true)
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_reject_feedback_mode_entered', analyticsProps)
      }
    }
  }

  // handleReject 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleReject(feedback?: string) {
    // trimmedFeedback格式化`trim`，供终端渲染后续处理使用。
    const trimmedFeedback = feedback?.trim()
    // hasFeedback标记终端渲染权限确认界面 use Shell Permission F...是否启用对应路径。
    const hasFeedback = !!trimmedFeedback

    // Log escape if no feedback was provided (user pressed ESC)
    // hasFeedback缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!hasFeedback) {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_permission_request_escape', {
        explainer_visible: explainerVisible,
      })
      // Increment escape count for attribution tracking
      // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        attribution: {
          ...prev.attribution,
          escapeCount: prev.attribution.escapeCount + 1,
        },
      }))
    }

    // 调用 logUnaryPermissionEvent，触发终端渲染此处需要的副作用。
    logUnaryPermissionEvent(
      'tool_use_single',
      toolUseConfirm,
      'reject',
      hasFeedback,
    )

    // 满足 `trimmedFeedback` 时，终端渲染执行该分支。
    if (trimmedFeedback) {
      // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
      toolUseConfirm.onReject(trimmedFeedback)
    } else {
      // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
      toolUseConfirm.onReject()
    }

    // 调用 onReject，触发终端渲染此处需要的副作用。
    onReject()
    // 调用 onDone，触发终端渲染此处需要的副作用。
    onDone()
  }

  // handleFocus 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleFocus(value: string) {
    // Notify that user is interacting with the dialog (only if focus changed)
    // This prevents triggering on the initial mount/render
    // `value` 与 `focusedOption` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== focusedOption) {
      // 调用 toolUseConfirm.onUserInteraction，触发终端渲染此处需要的副作用。
      toolUseConfirm.onUserInteraction()
    }
    // Reset input mode when navigating away, but only if no text typed
    // `value` 与 `'yes' && yesInputMode && !accep...` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== 'yes' && yesInputMode && !acceptFeedback.trim()) {
      // setYesInputMode 写入新的状态值，使终端渲染后续读取保持一致。
      setYesInputMode(false)
    }
    // `value` 与 `'no' && noInputMode && !rejectF...` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== 'no' && noInputMode && !rejectFeedback.trim()) {
      // setNoInputMode 写入新的状态值，使终端渲染后续读取保持一致。
      setNoInputMode(false)
    }
    // setFocusedOption 写入新的状态值，使终端渲染后续读取保持一致。
    setFocusedOption(value)
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    yesInputMode,
    noInputMode,
    yesFeedbackModeEntered,
    noFeedbackModeEntered,
    acceptFeedback,
    rejectFeedback,
    setAcceptFeedback,
    setRejectFeedback,
    focusedOption,
    handleInputModeToggle,
    handleReject,
    handleFocus,
  }
}

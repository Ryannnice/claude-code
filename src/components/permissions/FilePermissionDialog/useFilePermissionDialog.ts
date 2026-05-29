// 引入 useCallback、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useMemo, useState } from 'react'
// 引入 useAppState，将 src/state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from 'src/state/AppState.js'
// 引入 useKeybindings，将 ../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../../keybindings/useKeybinding.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../../services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 ../../../services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from '../../../services/analytics/metadata.js'
// 类型依赖 { PermissionUpdate } 来自 ../../../utils/permissions/PermissionUpdateSchema.js，用于校准终端渲染的数据契约。
import type { PermissionUpdate } from '../../../utils/permissions/PermissionUpdateSchema.js'
// 类型依赖 { CompletionType } 来自 ../../../utils/unaryLogging.js，用于校准终端渲染的数据契约。
import type { CompletionType } from '../../../utils/unaryLogging.js'
// 类型依赖 { ToolUseConfirm } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { ToolUseConfirm } from '../PermissionRequest.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type FileOperationType,
  getFilePermissionOptions,
  type PermissionOption,
  type PermissionOptionWithLabel,
} from './permissionOptions.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  PERMISSION_HANDLERS,
  type PermissionHandlerParams,
} from './usePermissionHandler.js'

// ToolInput 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface ToolInput {
  [key: string]: unknown
}

export type UseFilePermissionDialogProps<T extends ToolInput> = {
  filePath: string
  completionType: CompletionType
  languageName: string | Promise<string>
  toolUseConfirm: ToolUseConfirm
  // 这个回调绑定到 onDone: () => void，负责终端渲染在该局部场景下的响应。
  onDone: () => void
  // 这个回调绑定到 onReject: () => void，负责终端渲染在该局部场景下的响应。
  onReject: () => void
  // 这个回调绑定到 parseInput: (input: unknown) => T，负责终端渲染在该局部场景下的响应。
  parseInput: (input: unknown) => T
  operationType?: FileOperationType
}

export type UseFilePermissionDialogResult<T> = {
  options: PermissionOptionWithLabel[]
  // 这个回调绑定到 onChange: (option: PermissionOption, input: T, feedback?: string) => void，负责终端渲染在该局部场景下的响应。
  onChange: (option: PermissionOption, input: T, feedback?: string) => void
  acceptFeedback: string
  rejectFeedback: string
  focusedOption: string
  // 这个回调绑定到 setFocusedOption: (option: string) => void，负责终端渲染在该局部场景下的响应。
  setFocusedOption: (option: string) => void
  // 这个回调绑定到 handleInputModeToggle: (value: string) => void，负责终端渲染在该局部场景下的响应。
  handleInputModeToggle: (value: string) => void
  yesInputMode: boolean
  noInputMode: boolean
}

/**
 * Hook for handling file permission dialogs with common logic
 */
// useFilePermissionDialog 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useFilePermissionDialog<T extends ToolInput>({
  filePath,
  completionType,
  languageName,
  toolUseConfirm,
  onDone,
  onReject,
  parseInput,
  operationType = 'write',
}: UseFilePermissionDialogProps<T>): UseFilePermissionDialogResult<T> {
  // toolPermissionContext 权限数据保存`useAppState`，供终端渲染后续处理使用。
  const toolPermissionContext = useAppState(s => s.toolPermissionContext)
  // acceptFeedback 由 React state 持有，setAcceptFeedback 会在用户操作或异步结果返回时触发刷新。
  const [acceptFeedback, setAcceptFeedback] = useState('')
  // rejectFeedback 由 React state 持有，setRejectFeedback 会在用户操作或异步结果返回时触发刷新。
  const [rejectFeedback, setRejectFeedback] = useState('')
  // focusedOption 由 React state 持有，setFocusedOption 会在用户操作或异步结果返回时触发刷新。
  const [focusedOption, setFocusedOption] = useState('yes')
  // yesInputMode 由 React state 持有，setYesInputMode 会在用户操作或异步结果返回时触发刷新。
  const [yesInputMode, setYesInputMode] = useState(false)
  // noInputMode 由 React state 持有，setNoInputMode 会在用户操作或异步结果返回时触发刷新。
  const [noInputMode, setNoInputMode] = useState(false)
  // Track whether user ever entered feedback mode (persists after collapse)
  // yesFeedbackModeEntered 由 React state 持有，setYesFeedbackModeEntered 会在用户操作或异步结果返回时触发刷新。
  const [yesFeedbackModeEntered, setYesFeedbackModeEntered] = useState(false)
  // noFeedbackModeEntered 由 React state 持有，setNoFeedbackModeEntered 会在用户操作或异步结果返回时触发刷新。
  const [noFeedbackModeEntered, setNoFeedbackModeEntered] = useState(false)

  // Generate options based on context
  // 选项保存`useMemo`，供终端渲染后续处理使用。
  const options = useMemo(
    () =>
      getFilePermissionOptions({
        filePath,
        toolPermissionContext,
        operationType,
        onRejectFeedbackChange: setRejectFeedback,
        onAcceptFeedbackChange: setAcceptFeedback,
        yesInputMode,
        noInputMode,
      }),
    [filePath, toolPermissionContext, operationType, yesInputMode, noInputMode],
  )

  // Handle option selection using shared handlers
  // onChange保存`useCallback`，供终端渲染后续处理使用。
  const onChange = useCallback(
    (option: PermissionOption, input: T, feedback?: string) => {
      // params 集合 集中保存权限确认界面 use File Permission Dialog要一起传递的字段。
      const params: PermissionHandlerParams = {
        messageId: toolUseConfirm.assistantMessage.message.id,
        path: filePath,
        toolUseConfirm,
        toolPermissionContext,
        onDone,
        onReject,
        completionType,
        languageName,
        operationType,
      }

      // Override the input in toolUseConfirm to pass the parsed input
      // originalOnAllow 命名 `toolUseConfirm.onAllow`，让后续代码直接表达这个值的用途。
      const originalOnAllow = toolUseConfirm.onAllow
      // onAllow更新为 `(`，确保权限确认界面后续读取最新状态。
      toolUseConfirm.onAllow = (
        _input: unknown,
        permissionUpdates: PermissionUpdate[],
        feedback?: string,
      ) => {
        // 调用 originalOnAllow，触发终端渲染此处需要的副作用。
        originalOnAllow(input, permissionUpdates, feedback)
      }

      // handler读取 `PERMISSION_HANDLERS[option.type]` 对应条目，后续围绕该成员继续处理。
      const handler = PERMISSION_HANDLERS[option.type]
      // 调用 handler，触发终端渲染此处需要的副作用。
      handler(params, {
        feedback,
        hasFeedback: !!feedback,
        enteredFeedbackMode:
          option.type === 'accept-once'
            ? yesFeedbackModeEntered
            : noFeedbackModeEntered,
        scope: option.type === 'accept-session' ? option.scope : undefined,
      })
    },
    [
      filePath,
      completionType,
      languageName,
      toolUseConfirm,
      toolPermissionContext,
      onDone,
      onReject,
      operationType,
      yesFeedbackModeEntered,
      noFeedbackModeEntered,
    ],
  )

  // Handler for confirm:cycleMode - select accept-session option
  // handleCycleMode保存`useCallback`，供终端渲染后续处理使用。
  const handleCycleMode = useCallback(() => {
    // sessionOption 会话数据筛选`options.find`，供终端渲染后续处理使用。
    const sessionOption = options.find(o => o.option.type === 'accept-session')
    // 满足 `sessionOption` 时，终端渲染执行该分支。
    if (sessionOption) {
      // parsedInput解析`parseInput`，供终端渲染后续处理使用。
      const parsedInput = parseInput(toolUseConfirm.input)
      // 调用 onChange，触发终端渲染此处需要的副作用。
      onChange(sessionOption.option, parsedInput)
    }
  }, [options, parseInput, toolUseConfirm.input, onChange])

  // Register keyboard shortcut handler via keybindings system
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(
    { 'confirm:cycleMode': handleCycleMode },
    { context: 'Confirmation' },
  )

  // Wrap setFocusedOption and reset input mode when navigating away
  // handleFocusedOptionChange保存`useCallback`，供终端渲染后续处理使用。
  const handleFocusedOptionChange = useCallback(
    (value: string) => {
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
    },
    [yesInputMode, noInputMode, acceptFeedback, rejectFeedback],
  )

  // Handle Tab key toggling input mode for Yes/No options
  // handleInputModeToggle保存`useCallback`，供终端渲染后续处理使用。
  const handleInputModeToggle = useCallback(
    (value: string) => {
      // analyticsProps 集合 集中保存终端渲染权限确认界面 use File Permission Di...要一起传递的字段。
      const analyticsProps = {
        toolName: sanitizeToolNameForAnalytics(
          toolUseConfirm.tool.name,
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        isMcp: toolUseConfirm.tool.isMcp ?? false,
      }

      // 当 `value` 匹配 `'yes'` 时，终端渲染执行对应分支。
      if (value === 'yes') {
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
      // 权限确认界面 use File Permission Dialog在这里处理 `} else if (value === 'no') {`，完成这一小步状态转换。
      } else if (value === 'no') {
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
    },
    [yesInputMode, noInputMode, toolUseConfirm],
  )

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    options,
    onChange,
    acceptFeedback,
    rejectFeedback,
    focusedOption,
    setFocusedOption: handleFocusedOptionChange,
    handleInputModeToggle,
    yesInputMode,
    noInputMode,
  }
}

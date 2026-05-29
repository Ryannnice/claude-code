// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react'
// 类型依赖 { PastedContent } 来自 src/utils/config.js，用于校准终端渲染的数据契约。
import type { PastedContent } from 'src/utils/config.js'
// 引入 maybeTruncateInput，将 ./inputPaste.js 中已经封装好的能力接到本文件流程里。
import { maybeTruncateInput } from './inputPaste.js'

// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  input: string
  pastedContents: Record<number, PastedContent>
  // 这个回调绑定到 onInputChange: (input: string) => void，负责终端渲染在该局部场景下的响应。
  onInputChange: (input: string) => void
  // 这个回调绑定到 setCursorOffset: (offset: number) => void，负责终端渲染在该局部场景下的响应。
  setCursorOffset: (offset: number) => void
  // 这个回调绑定到 setPastedContents: (contents: Record<number, PastedContent>) => void，负责终端渲染在该局部场景下的响应。
  setPastedContents: (contents: Record<number, PastedContent>) => void
}

// useMaybeTruncateInput 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMaybeTruncateInput({
  input,
  pastedContents,
  onInputChange,
  setCursorOffset,
  setPastedContents,
}: Props) {
  // Track if we've initialized this specific input value
  // 提示输入组件 use Maybe Truncate Input先整理这一处局部数据，后续分支可以直接读取。
  const [hasAppliedTruncationToInput, setHasAppliedTruncationToInput] =
    useState(false)

  // Process input for truncation and pasted images from MessageSelector.
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 满足 `hasAppliedTruncationToInput` 时，终端渲染执行该分支。
    if (hasAppliedTruncationToInput) {
      // 提示输入组件 use Maybe Truncate Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 满足 `input.length <= 10_000` 时，终端渲染执行该分支。
    if (input.length <= 10_000) {
      // 提示输入组件 use Maybe Truncate Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 从 `maybeTruncateInput(` 解构 newInput、newPastedContents，减少提示输入组件 use Maybe Truncate Input对同一对象的重复访问。
    const { newInput, newPastedContents } = maybeTruncateInput(
      input,
      pastedContents,
    )

    // 调用 onInputChange，触发终端渲染此处需要的副作用。
    onInputChange(newInput)
    // setCursorOffset 写入新的状态值，使终端渲染后续读取保持一致。
    setCursorOffset(newInput.length)
    // setPastedContents 写入新的状态值，使终端渲染后续读取保持一致。
    setPastedContents(newPastedContents)
    // setHasAppliedTruncationToInput 写入新的状态值，使终端渲染后续读取保持一致。
    setHasAppliedTruncationToInput(true)
  }, [
    input,
    hasAppliedTruncationToInput,
    pastedContents,
    onInputChange,
    setPastedContents,
    setCursorOffset,
  ])

  // Reset hasInitializedInput when input is cleared (e.g., after submission)
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 满足 `input === ''` 时，终端渲染执行该分支。
    if (input === '') {
      // setHasAppliedTruncationToInput 写入新的状态值，使终端渲染后续读取保持一致。
      setHasAppliedTruncationToInput(false)
    }
  }, [input])
}

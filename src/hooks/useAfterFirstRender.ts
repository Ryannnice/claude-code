// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../utils/envUtils.js'

// useAfterFirstRender 封装useAfterFirstRender的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAfterFirstRender(): void {
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      process.env.USER_TYPE === 'ant' &&
      isEnvTruthy(process.env.CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER)
    ) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        `\nStartup time: ${Math.round(process.uptime() * 1000)}ms\n`,
      )
      // eslint-disable-next-line custom-rules/no-process-exit
      // 调用 process.exit，触发React hook此处需要的副作用。
      process.exit(0)
    }
  }, [])
}

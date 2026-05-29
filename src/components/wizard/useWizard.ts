// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import { useContext } from 'react'
// 类型依赖 { WizardContextValue } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { WizardContextValue } from './types.js'
// 引入 WizardContext，将 ./WizardProvider.js 中已经封装好的能力接到本文件流程里。
import { WizardContext } from './WizardProvider.js'

export function useWizard<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): WizardContextValue<T> {
  // 上下文保存`useContext`，供终端渲染后续处理使用。
  const context = useContext(WizardContext) as WizardContextValue<T> | null
  // context缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!context) {
    // 抛出 new Error('useWizard must be used within a WizardProvider')，阻止终端渲染在无效状态下继续运行。
    throw new Error('useWizard must be used within a WizardProvider')
  }
  // 返回 `context`，作为终端渲染这次计算的结果。
  return context
}

// 引入 createContext，将 react 中已经封装好的能力接到本文件流程里。
import { createContext } from 'react'

// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = {
  /**
   * Exit (unmount) the whole Ink app.
   */
  readonly exit: (error?: Error) => void
}

/**
 * `AppContext` is a React context, which exposes a method to manually exit the app (unmount).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
// AppContext构建`createContext<Props>({` 整理出中间结果，供终端 UI App Context后续步骤使用。
const AppContext = createContext<Props>({
  // exit 使用 无 完成终端渲染里的对应操作。
  exit() {},
})

// eslint-disable-next-line custom-rules/no-top-level-side-effects
// displayName更新为 `'InternalAppContext'`，确保终端 UI后续读取最新状态。
AppContext.displayName = 'InternalAppContext'

export default AppContext

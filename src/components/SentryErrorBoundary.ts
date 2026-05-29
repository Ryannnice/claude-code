// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react'

// Props 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface Props {
  children: React.ReactNode
}

// State 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface State {
  hasError: boolean
}

// SentryErrorBoundary 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class SentryErrorBoundary extends React.Component<Props, State> {
  // 构造函数接收 props: Props，把外部输入整理成实例可复用的内部状态。
  constructor(props: Props) {
    // 调用 super，触发终端渲染此处需要的副作用。
    super(props)
    // 更新实例字段 state 为 { hasError: false }，同步终端渲染的内部状态。
    this.state = { hasError: false }
  }

  // 终端 UI 组件 Sentry Error Boundary在这里处理 `static getDerivedStateFromError(): State {`，完成这一小步状态转换。
  static getDerivedStateFromError(): State {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { hasError: true }
  }

  // render 根据 无 生成这一段界面或文本输出。
  render(): React.ReactNode {
    // 满足 `this.state.hasError` 时，终端渲染执行该分支。
    if (this.state.hasError) {
      // 返回 `null`，作为终端渲染这次计算的结果。
      return null
    }

    // 返回 `this.props.children`，作为终端渲染这次计算的结果。
    return this.props.children
  }
}

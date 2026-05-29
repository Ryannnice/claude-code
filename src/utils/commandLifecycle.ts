// CommandLifecycleState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CommandLifecycleState = 'started' | 'completed'

// CommandLifecycleListener 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CommandLifecycleListener = (
  uuid: string,
  state: CommandLifecycleState,
) => void

// listener 集合 命名 `null`，让后续代码直接表达这个值的用途。
let listener: CommandLifecycleListener | null = null

// setCommandLifecycleListener 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCommandLifecycleListener(
  cb: CommandLifecycleListener | null,
): void {
  // listener 集合更新为 `cb`，确保共享工具后续读取最新状态。
  listener = cb
}

// notifyCommandLifecycle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function notifyCommandLifecycle(
  uuid: string,
  state: CommandLifecycleState,
): void {
  // 调用 listener?.(uuid, state)，完成这一处局部操作。
  listener?.(uuid, state)
}

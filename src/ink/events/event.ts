// Event 聚合终端渲染相关状态与操作，把同一职责的行为收束到类实例中。
export class Event {
  private _didStopImmediatePropagation = false

  // didStopImmediatePropagation 使用 无 完成终端渲染里的对应操作。
  didStopImmediatePropagation(): boolean {
    // 返回 `this._didStopImmediatePropagation`，作为终端渲染这次计算的结果。
    return this._didStopImmediatePropagation
  }

  // stopImmediatePropagation 使用 无 完成终端渲染里的对应操作。
  stopImmediatePropagation(): void {
    // 更新实例字段 _didStopImmediatePropagation 为 true，同步终端渲染的内部状态。
    this._didStopImmediatePropagation = true
  }
}

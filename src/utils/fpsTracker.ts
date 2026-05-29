// FpsMetrics 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type FpsMetrics = {
  averageFps: number
  low1PctFps: number
}

// FpsTracker 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class FpsTracker {
  private frameDurations: number[] = []
  private firstRenderTime: number | undefined
  private lastRenderTime: number | undefined

  // record 使用 durationMs: number 完成共享工具里的对应操作。
  record(durationMs: number): void {
    // now记录时间`performance.now`，供共享工具后续处理使用。
    const now = performance.now()
    // 满足 `this.firstRenderTime === undefined` 时，共享工具执行该分支。
    if (this.firstRenderTime === undefined) {
      // 更新实例字段 firstRenderTime 为 now，同步共享工具的内部状态。
      this.firstRenderTime = now
    }
    // 更新实例字段 lastRenderTime 为 now，同步共享工具的内部状态。
    this.lastRenderTime = now
    // frameDurations 集合追加新条目，保持收集顺序与输入顺序一致。
    this.frameDurations.push(durationMs)
  }

  // getMetrics不依赖额外参数，直接计算共享工具需要的结果。
  getMetrics(): FpsMetrics | undefined {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      this.frameDurations.length === 0 ||
      this.firstRenderTime === undefined ||
      this.lastRenderTime === undefined
    ) {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }

    // totalTimeMs 集合保存`this.lastRenderTime - this.firstRenderTime`，供共享工具 fps Tracker后续判断或输出使用。
    const totalTimeMs = this.lastRenderTime - this.firstRenderTime
    // 满足 `totalTimeMs <= 0` 时，共享工具执行该分支。
    if (totalTimeMs <= 0) {
      // 返回 `undefined`，作为共享工具这次计算的结果。
      return undefined
    }

    // totalFrames 集合 命名 `this.frameDurations.length`，让后续代码直接表达这个值的用途。
    const totalFrames = this.frameDurations.length
    // averageFps 集合保存`totalFrames / (totalTimeMs / 1000)`，供共享工具 fps Tracker后续判断或输出使用。
    const averageFps = totalFrames / (totalTimeMs / 1000)

    // sorted格式化`frameDurations.slice`，供共享工具后续处理使用。
    const sorted = this.frameDurations.slice().sort((a, b) => b - a)
    // p99Index 索引保存`Math.max`，供共享工具后续处理使用。
    const p99Index = Math.max(0, Math.ceil(sorted.length * 0.01) - 1)
    // p99FrameTimeMs 集合读取 `sorted[p99Index]!` 对应条目，后续围绕该成员继续处理。
    const p99FrameTimeMs = sorted[p99Index]!
    // low1PctFps 集合保存`p99FrameTimeMs > 0 ? 1000 / p99FrameTimeMs : 0`，供共享工具 fps Tracker后续判断或输出使用。
    const low1PctFps = p99FrameTimeMs > 0 ? 1000 / p99FrameTimeMs : 0

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      averageFps: Math.round(averageFps * 100) / 100,
      low1PctFps: Math.round(low1PctFps * 100) / 100,
    }
  }
}

// 引入 getActiveTimeCounter as getActiveTimeCounterImpl，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getActiveTimeCounter as getActiveTimeCounterImpl } from '../bootstrap/state.js'

// ActivityManagerOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ActivityManagerOptions = {
  getNow?: () => number
  getActiveTimeCounter?: typeof getActiveTimeCounterImpl
}

/**
 * ActivityManager handles generic activity tracking for both user and CLI operations.
 * It automatically deduplicates overlapping activities and provides separate metrics
 * for user vs CLI active time.
 */
// ActivityManager 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class ActivityManager {
  private activeOperations = new Set<string>()

  private lastUserActivityTime: number = 0 // Start with 0 to indicate no activity yet
  private lastCLIRecordedTime: number

  private isCLIActive: boolean = false

  private readonly USER_ACTIVITY_TIMEOUT_MS = 5000 // 5 seconds

  // 这个回调绑定到 private readonly getNow: () => number，负责共享工具在该局部场景下的响应。
  private readonly getNow: () => number
  private readonly getActiveTimeCounter: typeof getActiveTimeCounterImpl

  private static instance: ActivityManager | null = null

  // 构造函数接收 options?: ActivityManagerOptions，把外部输入整理成实例可复用的内部状态。
  constructor(options?: ActivityManagerOptions) {
    // 更新实例字段 getNow 为 options?.getNow ?? (() => Date.now())，同步共享工具的内部状态。
    this.getNow = options?.getNow ?? (() => Date.now())
    // 共享工具 activity Manager在这里处理 `this.getActiveTimeCounter =`，完成这一小步状态转换。
    this.getActiveTimeCounter =
      options?.getActiveTimeCounter ?? getActiveTimeCounterImpl
    // 更新实例字段 lastCLIRecordedTime 为 this.getNow()，同步共享工具的内部状态。
    this.lastCLIRecordedTime = this.getNow()
  }

  // 共享工具 activity Manager在这里处理 `static getInstance(): ActivityManager {`，完成这一小步状态转换。
  static getInstance(): ActivityManager {
    // ActivityManager.instance缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!ActivityManager.instance) {
      // instance更新为 `new ActivityManager()`，确保共享工具后续读取最新状态。
      ActivityManager.instance = new ActivityManager()
    }
    // 返回 `ActivityManager.instance`，作为共享工具这次计算的结果。
    return ActivityManager.instance
  }

  /**
   * Reset the singleton instance (for testing purposes)
   */
  // 共享工具 activity Manager在这里处理 `static resetInstance(): void {`，完成这一小步状态转换。
  static resetInstance(): void {
    // instance更新为 `null`，确保共享工具后续读取最新状态。
    ActivityManager.instance = null
  }

  /**
   * Create a new instance with custom options (for testing purposes)
   */
  // 共享工具 activity Manager在这里处理 `static createInstance(options?: ActivityManagerOptions): ActivityManage...`，完成这一小步状态转换。
  static createInstance(options?: ActivityManagerOptions): ActivityManager {
    // instance更新为 `new ActivityManager(options)`，确保共享工具后续读取最新状态。
    ActivityManager.instance = new ActivityManager(options)
    // 返回 `ActivityManager.instance`，作为共享工具这次计算的结果。
    return ActivityManager.instance
  }

  /**
   * Called when user interacts with the CLI (typing, commands, etc.)
   */
  // recordUserActivity 使用 无 完成共享工具里的对应操作。
  recordUserActivity(): void {
    // Don't record user time if CLI is active (CLI takes precedence)
    // 只有 `!this.isCLIActive && this.lastUserActivityTime !=` 满足时，共享工具才执行该分支。
    if (!this.isCLIActive && this.lastUserActivityTime !== 0) {
      // now读取`this.getNow`，供共享工具后续处理使用。
      const now = this.getNow()
      // timeSinceLastActivity保存`(now - this.lastUserActivityTime) / 1000`，供后续判断或组装使用。
      const timeSinceLastActivity = (now - this.lastUserActivityTime) / 1000

      // 满足 `timeSinceLastActivity > 0` 时，共享工具执行该分支。
      if (timeSinceLastActivity > 0) {
        // activeTimeCounter 数量读取`this.getActiveTimeCounter`，供共享工具后续处理使用。
        const activeTimeCounter = this.getActiveTimeCounter()
        // 满足 `activeTimeCounter` 时，共享工具执行该分支。
        if (activeTimeCounter) {
          // timeoutSeconds 集合保存`this.USER_ACTIVITY_TIMEOUT_MS / 1000`，供共享工具 activity Manager后续判断或输出使用。
          const timeoutSeconds = this.USER_ACTIVITY_TIMEOUT_MS / 1000

          // Only record time if within the timeout window
          // 满足 `timeSinceLastActivity < timeoutSeconds` 时，共享工具执行该分支。
          if (timeSinceLastActivity < timeoutSeconds) {
            // 调用 activeTimeCounter.add，触发共享工具此处需要的副作用。
            activeTimeCounter.add(timeSinceLastActivity, { type: 'user' })
          }
        }
      }
    }

    // Update the last user activity timestamp
    // 更新实例字段 lastUserActivityTime 为 this.getNow()，同步共享工具的内部状态。
    this.lastUserActivityTime = this.getNow()
  }

  /**
   * Starts tracking CLI activity (tool execution, AI response, etc.)
   */
  // startCLIActivity 使用 operationId: string 完成共享工具里的对应操作。
  startCLIActivity(operationId: string): void {
    // If operation already exists, it likely means the previous one didn't clean up
    // properly (e.g., component crashed/unmounted without calling end). Force cleanup
    // to avoid overestimating time - better to underestimate than overestimate.
    // 满足 `this.activeOperations.has(operationId)` 时，共享工具执行该分支。
    if (this.activeOperations.has(operationId)) {
      // 调用 this.endCLIActivity，触发共享工具此处需要的副作用。
      this.endCLIActivity(operationId)
    }

    // wasEmpty标记共享工具 activity Manager是否启用对应路径。
    const wasEmpty = this.activeOperations.size === 0
    // 调用 this.activeOperations.add，触发共享工具此处需要的副作用。
    this.activeOperations.add(operationId)

    // 满足 `wasEmpty` 时，共享工具执行该分支。
    if (wasEmpty) {
      // 更新实例字段 isCLIActive 为 true，同步共享工具的内部状态。
      this.isCLIActive = true
      // 更新实例字段 lastCLIRecordedTime 为 this.getNow()，同步共享工具的内部状态。
      this.lastCLIRecordedTime = this.getNow()
    }
  }

  /**
   * Stops tracking CLI activity
   */
  // endCLIActivity 使用 operationId: string 完成共享工具里的对应操作。
  endCLIActivity(operationId: string): void {
    // 调用 this.activeOperations.delete，触发共享工具此处需要的副作用。
    this.activeOperations.delete(operationId)

    // 满足 `this.activeOperations.size === 0` 时，共享工具执行该分支。
    if (this.activeOperations.size === 0) {
      // Last operation ended - CLI becoming inactive
      // Record the CLI time before switching to inactive
      // now读取`this.getNow`，供共享工具后续处理使用。
      const now = this.getNow()
      // timeSinceLastRecord 命名 `(now - this.lastCLIRecordedTime) / 1000`，让后续代码直接表达这个值的用途。
      const timeSinceLastRecord = (now - this.lastCLIRecordedTime) / 1000

      // 满足 `timeSinceLastRecord > 0` 时，共享工具执行该分支。
      if (timeSinceLastRecord > 0) {
        // activeTimeCounter 数量读取`this.getActiveTimeCounter`，供共享工具后续处理使用。
        const activeTimeCounter = this.getActiveTimeCounter()
        // 满足 `activeTimeCounter` 时，共享工具执行该分支。
        if (activeTimeCounter) {
          // 调用 activeTimeCounter.add，触发共享工具此处需要的副作用。
          activeTimeCounter.add(timeSinceLastRecord, { type: 'cli' })
        }
      }

      // 更新实例字段 lastCLIRecordedTime 为 now，同步共享工具的内部状态。
      this.lastCLIRecordedTime = now
      // 更新实例字段 isCLIActive 为 false，同步共享工具的内部状态。
      this.isCLIActive = false
    }
  }

  /**
   * Convenience method to track an async operation automatically (mainly for testing/debugging)
   */
  // 共享工具 activity Manager在这里处理 `async trackOperation<T>(`，完成这一小步状态转换。
  async trackOperation<T>(
    operationId: string,
    // 这个回调绑定到 fn: () => Promise<T>,，负责共享工具在该局部场景下的响应。
    fn: () => Promise<T>,
  ): Promise<T> {
    // 调用 this.startCLIActivity，触发共享工具此处需要的副作用。
    this.startCLIActivity(operationId)
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `fn()`，调用方直接接收异步结果。
      return await fn()
    } finally {
      // 调用 this.endCLIActivity，触发共享工具此处需要的副作用。
      this.endCLIActivity(operationId)
    }
  }

  /**
   * Gets current activity states (mainly for testing/debugging)
   */
  // getActivityStates不依赖额外参数，直接计算共享工具需要的结果。
  getActivityStates(): {
    isUserActive: boolean
    isCLIActive: boolean
    activeOperationCount: number
  } {
    // now读取`this.getNow`，供共享工具后续处理使用。
    const now = this.getNow()
    // timeSinceUserActivity保存`(now - this.lastUserActivityTime) / 1000`，供共享工具 activity Manager后续判断或输出使用。
    const timeSinceUserActivity = (now - this.lastUserActivityTime) / 1000
    // isUserActive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isUserActive =
      timeSinceUserActivity < this.USER_ACTIVITY_TIMEOUT_MS / 1000

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      isUserActive,
      isCLIActive: this.isCLIActive,
      activeOperationCount: this.activeOperations.size,
    }
  }
}

// Export singleton instance
// activityManager读取`ActivityManager.getInstance`，供共享工具后续处理使用。
export const activityManager = ActivityManager.getInstance()

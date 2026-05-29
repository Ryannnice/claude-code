/**
 * Singleton manager for cloud-provider authentication status (AWS Bedrock,
 * GCP Vertex). Communicates auth refresh state between auth utilities and
 * React components / SDK output. The SDK 'auth_status' message shape is
 * provider-agnostic, so a single manager serves all providers.
 *
 * Legacy name: originally AWS-only; now used by all cloud auth refresh flows.
 */

// 引入 createSignal，将 ./signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from './signal.js'

// AwsAuthStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AwsAuthStatus = {
  isAuthenticating: boolean
  output: string[]
  error?: string
}

// AwsAuthStatusManager 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class AwsAuthStatusManager {
  private static instance: AwsAuthStatusManager | null = null
  private status: AwsAuthStatus = {
    isAuthenticating: false,
    output: [],
  }
  private changed = createSignal<[status: AwsAuthStatus]>()

  // 共享工具 aws Auth Status Manager在这里处理 `static getInstance(): AwsAuthStatusManager {`，完成这一小步状态转换。
  static getInstance(): AwsAuthStatusManager {
    // AwsAuthStatusManager.instance缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!AwsAuthStatusManager.instance) {
      // instance更新为 `new AwsAuthStatusManager()`，确保共享工具后续读取最新状态。
      AwsAuthStatusManager.instance = new AwsAuthStatusManager()
    }
    // 返回 `AwsAuthStatusManager.instance`，作为共享工具这次计算的结果。
    return AwsAuthStatusManager.instance
  }

  // getStatus不依赖额外参数，直接计算共享工具需要的结果。
  getStatus(): AwsAuthStatus {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...this.status,
      output: [...this.status.output],
    }
  }

  // startAuthentication 使用 无 完成共享工具里的对应操作。
  startAuthentication(): void {
    // 更新实例字段 status 为 {，同步共享工具的内部状态。
    this.status = {
      isAuthenticating: true,
      output: [],
    }
    // 调用 this.changed.emit，触发共享工具此处需要的副作用。
    this.changed.emit(this.getStatus())
  }

  // addOutput 使用 line: string 完成共享工具里的对应操作。
  addOutput(line: string): void {
    // output追加新条目，保持收集顺序与输入顺序一致。
    this.status.output.push(line)
    // 调用 this.changed.emit，触发共享工具此处需要的副作用。
    this.changed.emit(this.getStatus())
  }

  // setError 根据 error: string 更新共享工具的状态。
  setError(error: string): void {
    // 错误更新为 `error`，确保共享工具后续读取最新状态。
    this.status.error = error
    // 调用 this.changed.emit，触发共享工具此处需要的副作用。
    this.changed.emit(this.getStatus())
  }

  // endAuthentication 使用 success: boolean 完成共享工具里的对应操作。
  endAuthentication(success: boolean): void {
    // 满足 `success` 时，共享工具执行该分支。
    if (success) {
      // Clear the status completely on success
      // 更新实例字段 status 为 {，同步共享工具的内部状态。
      this.status = {
        isAuthenticating: false,
        output: [],
      }
    } else {
      // Keep the output visible on failure
      // isAuthenticating更新为 `false`，确保共享工具后续读取最新状态。
      this.status.isAuthenticating = false
    }
    // 调用 this.changed.emit，触发共享工具此处需要的副作用。
    this.changed.emit(this.getStatus())
  }

  subscribe = this.changed.subscribe

  // Clean up for testing
  // 共享工具 aws Auth Status Manager在这里处理 `static reset(): void {`，完成这一小步状态转换。
  static reset(): void {
    // 满足 `AwsAuthStatusManager.instance` 时，共享工具执行该分支。
    if (AwsAuthStatusManager.instance) {
      // 调用 AwsAuthStatusManager.instance.changed.clear，触发共享工具此处需要的副作用。
      AwsAuthStatusManager.instance.changed.clear()
      // instance更新为 `null`，确保共享工具后续读取最新状态。
      AwsAuthStatusManager.instance = null
    }
  }
}

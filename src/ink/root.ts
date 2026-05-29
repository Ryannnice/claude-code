// 类型依赖 { ReactNode } 来自 react，用于校准终端渲染的数据契约。
import type { ReactNode } from 'react'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 引入 Stream，将 stream 中已经封装好的能力接到本文件流程里。
import { Stream } from 'stream'
// 类型依赖 { FrameEvent } 来自 ./frame.js，用于校准终端渲染的数据契约。
import type { FrameEvent } from './frame.js'
// 引入 Ink、Options as InkOptions，将 ./ink.js 中已经封装好的能力接到本文件流程里。
import Ink, { type Options as InkOptions } from './ink.js'
// 引入 instances，将 ./instances.js 中已经封装好的能力接到本文件流程里。
import instances from './instances.js'

// RenderOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type RenderOptions = {
  /**
   * Output stream where app will be rendered.
   *
   * @default process.stdout
   */
  stdout?: NodeJS.WriteStream
  /**
   * Input stream where app will listen for input.
   *
   * @default process.stdin
   */
  stdin?: NodeJS.ReadStream
  /**
   * Error stream.
   * @default process.stderr
   */
  stderr?: NodeJS.WriteStream
  /**
   * Configure whether Ink should listen to Ctrl+C keyboard input and exit the app. This is needed in case `process.stdin` is in raw mode, because then Ctrl+C is ignored by default and process is expected to handle it manually.
   *
   * @default true
   */
  exitOnCtrlC?: boolean

  /**
   * Patch console methods to ensure console output doesn't mix with Ink output.
   *
   * @default true
   */
  patchConsole?: boolean

  /**
   * Called after each frame render with timing and flicker information.
   */
  // 这个回调绑定到 onFrame?: (event: FrameEvent) => void，负责终端渲染在该局部场景下的响应。
  onFrame?: (event: FrameEvent) => void
}

// Instance 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Instance = {
  /**
   * Replace previous root node with a new one or update props of the current root node.
   */
  rerender: Ink['render']
  /**
   * Manually unmount the whole Ink app.
   */
  unmount: Ink['unmount']
  /**
   * Returns a promise, which resolves when app is unmounted.
   */
  waitUntilExit: Ink['waitUntilExit']
  // 这个回调绑定到 cleanup: () => void，负责终端渲染在该局部场景下的响应。
  cleanup: () => void
}

/**
 * A managed Ink root, similar to react-dom's createRoot API.
 * Separates instance creation from rendering so the same root
 * can be reused for multiple sequential screens.
 */
// Root 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Root = {
  // 这个回调绑定到 render: (node: ReactNode) => void，负责终端渲染在该局部场景下的响应。
  render: (node: ReactNode) => void
  // 这个回调绑定到 unmount: () => void，负责终端渲染在该局部场景下的响应。
  unmount: () => void
  // 这个回调绑定到 waitUntilExit: () => Promise<void>，负责终端渲染在该局部场景下的响应。
  waitUntilExit: () => Promise<void>
}

/**
 * Mount a component and render the output.
 */
// renderSync保存`(`，供后续判断或组装使用。
export const renderSync = (
  node: ReactNode,
  options?: NodeJS.WriteStream | RenderOptions,
): Instance => {
  // opts 集合读取`getOptions`，供终端渲染后续处理使用。
  const opts = getOptions(options)
  // inkOptions 集合 集中保存Ink 渲染层 root要一起传递的字段。
  const inkOptions: InkOptions = {
    stdout: process.stdout,
    stdin: process.stdin,
    stderr: process.stderr,
    exitOnCtrlC: true,
    patchConsole: true,
    ...opts,
  }

  // instance读取`getInstance(`，供后续判断或组装使用。
  const instance: Ink = getInstance(
    inkOptions.stdout,
    // 这个回调绑定到 () => new Ink(inkOptions),，负责终端渲染在该局部场景下的响应。
    () => new Ink(inkOptions),
  )

  // 调用 instance.render，触发终端渲染此处需要的副作用。
  instance.render(node)

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    rerender: instance.render,
    // unmount 使用 无 完成终端渲染里的对应操作。
    unmount() {
      // 调用 instance.unmount，触发终端渲染此处需要的副作用。
      instance.unmount()
    },
    waitUntilExit: instance.waitUntilExit,
    // 这个回调绑定到 cleanup: () => instances.delete(inkOptions.stdout),，负责终端渲染在该局部场景下的响应。
    cleanup: () => instances.delete(inkOptions.stdout),
  }
}

// wrappedRender保存`async`，供终端渲染后续处理使用。
const wrappedRender = async (
  node: ReactNode,
  options?: NodeJS.WriteStream | RenderOptions,
): Promise<Instance> => {
  // Preserve the microtask boundary that `await loadYoga()` used to provide.
  // Without it, the first render fires synchronously before async startup work
  // (e.g. useReplBridge notification state) settles, and the subsequent Static
  // write overwrites scrollback instead of appending below the logo.
  // 等待 `Promise.resolve()` 完成，再继续Ink 渲染层 root的异步流程。
  await Promise.resolve()
  // instance保存`renderSync`，供终端渲染后续处理使用。
  const instance = renderSync(node, options)
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[render] first ink render: ${Math.round(process.uptime() * 1000)}ms since process start`,
  )
  // 返回 `instance`，作为终端渲染这次计算的结果。
  return instance
}

export default wrappedRender

/**
 * Create an Ink root without rendering anything yet.
 * Like react-dom's createRoot — call root.render() to mount a tree.
 */
// createRoot 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createRoot({
  stdout = process.stdout,
  stdin = process.stdin,
  stderr = process.stderr,
  exitOnCtrlC = true,
  patchConsole = true,
  onFrame,
}: RenderOptions = {}): Promise<Root> {
  // See wrappedRender — preserve microtask boundary from the old WASM await.
  // 等待 `Promise.resolve()` 完成，再继续Ink 渲染层 root的异步流程。
  await Promise.resolve()
  // instance保存`Ink`，供终端渲染后续处理使用。
  const instance = new Ink({
    stdout,
    stdin,
    stderr,
    exitOnCtrlC,
    patchConsole,
    onFrame,
  })

  // Register in the instances map so that code that looks up the Ink
  // instance by stdout (e.g. external editor pause/resume) can find it.
  // instances.set 写入新的状态值，使终端渲染后续读取保持一致。
  instances.set(stdout, instance)

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    // 这个回调绑定到 render: node => instance.render(node),，负责终端渲染在该局部场景下的响应。
    render: node => instance.render(node),
    // 这个回调绑定到 unmount: () => instance.unmount(),，负责终端渲染在该局部场景下的响应。
    unmount: () => instance.unmount(),
    // 这个回调绑定到 waitUntilExit: () => instance.waitUntilExit(),，负责终端渲染在该局部场景下的响应。
    waitUntilExit: () => instance.waitUntilExit(),
  }
}

// getOptions 集合保存`(`，供后续判断或组装使用。
const getOptions = (
  stdout: NodeJS.WriteStream | RenderOptions | undefined = {},
): RenderOptions => {
  // 满足 `stdout instanceof Stream` 时，终端渲染执行该分支。
  if (stdout instanceof Stream) {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      stdout,
      stdin: process.stdin,
    }
  }

  // 返回 `stdout`，作为终端渲染这次计算的结果。
  return stdout
}

// getInstance保存`(`，供后续判断或组装使用。
const getInstance = (
  stdout: NodeJS.WriteStream,
  // 这个回调绑定到 createInstance: () => Ink,，负责终端渲染在该局部场景下的响应。
  createInstance: () => Ink,
): Ink => {
  // instance读取`instances.get`，供终端渲染后续处理使用。
  let instance = instances.get(stdout)

  // instance缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!instance) {
    // instance更新为 `createInstance()`，确保Ink 渲染层后续读取最新状态。
    instance = createInstance()
    // instances.set 写入新的状态值，使终端渲染后续读取保持一致。
    instances.set(stdout, instance)
  }

  // 返回 `instance`，作为终端渲染这次计算的结果。
  return instance
}

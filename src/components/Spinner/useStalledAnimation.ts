// 引入 useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useRef } from 'react'

// Hook to handle the transition to red when tokens stop flowing.
// Driven by the parent's animation clock time instead of independent intervals,
// so it slows down when the terminal is blurred.
// useStalledAnimation 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useStalledAnimation(
  time: number,
  currentResponseLength: number,
  hasActiveTools = false,
  reducedMotion = false,
): {
  isStalled: boolean
  stalledIntensity: number
} {
  // lastTokenTime保存`useRef`，供终端渲染后续处理使用。
  const lastTokenTime = useRef(time)
  // lastResponseLength 响应数据保存`useRef`，供终端渲染后续处理使用。
  const lastResponseLength = useRef(currentResponseLength)
  // mountTime保存`useRef`，供终端渲染后续处理使用。
  const mountTime = useRef(time)
  // stalledIntensityRef 引用保存`useRef`，供终端渲染后续处理使用。
  const stalledIntensityRef = useRef(0)
  // lastSmoothTime保存`useRef`，供终端渲染后续处理使用。
  const lastSmoothTime = useRef(time)

  // Reset timer when new tokens arrive (check actual length change)
  // 满足 `currentResponseLength > lastResponseLength.current` 时，终端渲染执行该分支。
  if (currentResponseLength > lastResponseLength.current) {
    // current更新为 `time`，确保终端 UI后续读取最新状态。
    lastTokenTime.current = time
    // current更新为 `currentResponseLength`，确保终端 UI后续读取最新状态。
    lastResponseLength.current = currentResponseLength
    // current更新为 `0`，确保终端 UI后续读取最新状态。
    stalledIntensityRef.current = 0
    // current更新为 `time`，确保终端 UI后续读取最新状态。
    lastSmoothTime.current = time
  }

  // Derive time since last token from animation clock
  // timeSinceLastToken 先占位，稍后的条件分支会根据实际输入补齐它。
  let timeSinceLastToken: number
  // 满足 `hasActiveTools` 时，终端渲染执行该分支。
  if (hasActiveTools) {
    // timeSinceLastToken更新为 `0`，确保终端 UI后续读取最新状态。
    timeSinceLastToken = 0
    // current更新为 `time`，确保终端 UI后续读取最新状态。
    lastTokenTime.current = time
  // 终端 UI 组件 use Stalled Animation在这里处理 `} else if (currentResponseLength > 0) {`，完成这一小步状态转换。
  } else if (currentResponseLength > 0) {
    // timeSinceLastToken更新为 `time - lastTokenTime.current`，确保终端 UI后续读取最新状态。
    timeSinceLastToken = time - lastTokenTime.current
  } else {
    // timeSinceLastToken更新为 `time - mountTime.current`，确保终端 UI后续读取最新状态。
    timeSinceLastToken = time - mountTime.current
  }

  // Calculate stalled intensity based on time since last token
  // Start showing red after 3 seconds of no new tokens (only when no tools are active)
  // isStalled标记终端 UI use Stalled Animation是否启用对应路径。
  const isStalled = timeSinceLastToken > 3000 && !hasActiveTools
  // intensity保存`isStalled`，供终端 UI use Stalled Animation后续判断或输出使用。
  const intensity = isStalled
    ? Math.min((timeSinceLastToken - 3000) / 2000, 1) // Fade over 2 seconds
    : 0

  // Smooth intensity transition driven by animation frame ticks
  // 只有 `!reducedMotion && (intensity > 0 || stalledIntensityRef.current > 0)` 满足时，终端渲染才执行该分支。
  if (!reducedMotion && (intensity > 0 || stalledIntensityRef.current > 0)) {
    // dt 命名 `time - lastSmoothTime.current`，让后续代码直接表达这个值的用途。
    const dt = time - lastSmoothTime.current
    // 满足 `dt >= 50` 时，终端渲染执行该分支。
    if (dt >= 50) {
      // steps 集合保存`Math.floor`，供终端渲染后续处理使用。
      const steps = Math.floor(dt / 50)
      // current保存`stalledIntensityRef.current`，供后续判断或组装使用。
      let current = stalledIntensityRef.current
      // 按索引扫描 `steps`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < steps; i++) {
        // diff保存`intensity - current`，供终端 UI use Stalled Animation后续判断或输出使用。
        const diff = intensity - current
        // 满足 `Math.abs(diff) < 0.01` 时，终端渲染执行该分支。
        if (Math.abs(diff) < 0.01) {
          // current更新为 `intensity`，确保终端 UI后续读取最新状态。
          current = intensity
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        }
        // 终端 UI 组件 use Stalled Animation在这里处理 `current += diff * 0.1`，完成这一小步状态转换。
        current += diff * 0.1
      }
      // current更新为 `current`，确保终端 UI后续读取最新状态。
      stalledIntensityRef.current = current
      // current更新为 `time`，确保终端 UI后续读取最新状态。
      lastSmoothTime.current = time
    }
  } else {
    // current更新为 `intensity`，确保终端 UI后续读取最新状态。
    stalledIntensityRef.current = intensity
    // current更新为 `time`，确保终端 UI后续读取最新状态。
    lastSmoothTime.current = time
  }

  // When reducedMotion is enabled, use instant intensity change
  // effectiveIntensity 命名 `reducedMotion`，让后续代码直接表达这个值的用途。
  const effectiveIntensity = reducedMotion
    ? intensity
    : stalledIntensityRef.current

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return { isStalled, stalledIntensity: effectiveIntensity }
}

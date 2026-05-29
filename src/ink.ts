// 引入 createElement、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import { createElement, type ReactNode } from 'react'
// 复用 ThemeProvider 终端界面组件，避免在这里重复拼装显示逻辑。
import { ThemeProvider } from './components/design-system/ThemeProvider.js'
// 整理这一组导入，让ink后续逻辑可以直接复用这些外部能力。
import inkRender, {
  // Instance 固化ink里传递的数据形状，帮助调用方按同一结构读写字段。
  type Instance,
  createRoot as inkCreateRoot,
  // RenderOptions 固化ink里传递的数据形状，帮助调用方按同一结构读写字段。
  type RenderOptions,
  // Root 固化ink里传递的数据形状，帮助调用方按同一结构读写字段。
  type Root,
} from './ink/root.js'

// 导出类型定义，让其他模块沿用ink的数据契约。
export type { RenderOptions, Instance, Root }

// Wrap all CC render calls with ThemeProvider so ThemedBox/ThemedText work
// without every call site having to mount it. Ink itself is theme-agnostic.
// withTheme 封装ink的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function withTheme(node: ReactNode): ReactNode {
  // 返回 `createElement(ThemeProvider, null, node)`，作为ink这次计算的结果。
  return createElement(ThemeProvider, null, node)
}

// render 封装ink的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function render(
  node: ReactNode,
  options?: NodeJS.WriteStream | RenderOptions,
): Promise<Instance> {
  // 返回 `inkRender(withTheme(node), options)`，作为ink这次计算的结果。
  return inkRender(withTheme(node), options)
}

// createRoot 封装ink的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createRoot(options?: RenderOptions): Promise<Root> {
  // root保存`inkCreateRoot`，供ink后续处理使用。
  const root = await inkCreateRoot(options)
  // 返回结构化结果，集中表达ink已经整理出的状态。
  return {
    ...root,
    // 这个回调绑定到 render: node => root.render(withTheme(node)),，负责ink在该局部场景下的响应。
    render: node => root.render(withTheme(node)),
  }
}

// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { color } from './components/design-system/color.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Props as BoxProps } from './components/design-system/ThemedBox.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as Box } from './components/design-system/ThemedBox.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Props as TextProps } from './components/design-system/ThemedText.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as Text } from './components/design-system/ThemedText.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export {
  ThemeProvider,
  usePreviewTheme,
  useTheme,
  useThemeSetting,
} from './components/design-system/ThemeProvider.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { Ansi } from './ink/Ansi.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Props as AppProps } from './ink/components/AppContext.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Props as BaseBoxProps } from './ink/components/Box.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as BaseBox } from './ink/components/Box.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type {
  ButtonState,
  Props as ButtonProps,
} from './ink/components/Button.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as Button } from './ink/components/Button.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Props as LinkProps } from './ink/components/Link.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as Link } from './ink/components/Link.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Props as NewlineProps } from './ink/components/Newline.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as Newline } from './ink/components/Newline.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { NoSelect } from './ink/components/NoSelect.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { RawAnsi } from './ink/components/RawAnsi.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as Spacer } from './ink/components/Spacer.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Props as StdinProps } from './ink/components/StdinContext.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Props as BaseTextProps } from './ink/components/Text.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as BaseText } from './ink/components/Text.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { DOMElement } from './ink/dom.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { ClickEvent } from './ink/events/click-event.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { EventEmitter } from './ink/events/emitter.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { Event } from './ink/events/event.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { Key } from './ink/events/input-event.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { InputEvent } from './ink/events/input-event.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { TerminalFocusEventType } from './ink/events/terminal-focus-event.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { TerminalFocusEvent } from './ink/events/terminal-focus-event.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { FocusManager } from './ink/focus.js'
// 导出类型定义，让其他模块沿用ink的数据契约。
export type { FlickerReason } from './ink/frame.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { useAnimationFrame } from './ink/hooks/use-animation-frame.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as useApp } from './ink/hooks/use-app.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as useInput } from './ink/hooks/use-input.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { useAnimationTimer, useInterval } from './ink/hooks/use-interval.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { useSelection } from './ink/hooks/use-selection.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as useStdin } from './ink/hooks/use-stdin.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { useTabStatus } from './ink/hooks/use-tab-status.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { useTerminalFocus } from './ink/hooks/use-terminal-focus.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { useTerminalTitle } from './ink/hooks/use-terminal-title.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { useTerminalViewport } from './ink/hooks/use-terminal-viewport.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as measureElement } from './ink/measure-element.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { supportsTabStatus } from './ink/termio/osc.js'
// 重新导出这一组成员，让ink的公共 API 保持集中入口。
export { default as wrapText } from './ink/wrap-text.js'

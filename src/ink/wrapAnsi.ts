// 引入 wrapAnsiNpm，将 wrap-ansi 中已经封装好的能力接到本文件流程里。
import wrapAnsiNpm from 'wrap-ansi'

// WrapAnsiOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type WrapAnsiOptions = {
  hard?: boolean
  wordWrap?: boolean
  trim?: boolean
}

// wrapAnsiBun 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const wrapAnsiBun =
  typeof Bun !== 'undefined' && typeof Bun.wrapAnsi === 'function'
    ? Bun.wrapAnsi
    : null

// wrapAnsi 先占位，稍后的条件分支会根据实际输入补齐它。
const wrapAnsi: (
  input: string,
  columns: number,
  options?: WrapAnsiOptions,
) => string = wrapAnsiBun ?? wrapAnsiNpm

// 重新导出这一组成员，让终端渲染的公共 API 保持集中入口。
export { wrapAnsi }

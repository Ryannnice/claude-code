// 引入 useContext，将 react 中已经封装好的能力接到本文件流程里。
import { useContext } from 'react'
// 复用 StdinContext 终端界面组件，避免在这里重复拼装显示逻辑。
import StdinContext from '../components/StdinContext.js'

/**
 * `useStdin` is a React hook, which exposes stdin stream.
 */
// useStdin保存`useContext`，供终端渲染后续处理使用。
const useStdin = () => useContext(StdinContext)
export default useStdin

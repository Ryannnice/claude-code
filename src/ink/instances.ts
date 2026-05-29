// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// Store all instances of Ink (instance.js) to ensure that consecutive render() calls
// use the same instance of Ink and don't create a new one
//
// This map has to be stored in a separate file, because render.js creates instances,
// but instance.js should delete itself from the map on unmount

// 类型依赖 Ink 来自 ./ink.js，用于校准终端渲染的数据契约。
import type Ink from './ink.js'

// instances 集合 命名 `new Map<NodeJS.WriteStream, Ink>()`，让后续代码直接表达这个值的用途。
const instances = new Map<NodeJS.WriteStream, Ink>()
export default instances

// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import type { CommandSpec } from '../registry.js'
// 引入 alias，将 ./alias.js 中已经封装好的能力接到本文件流程里。
import alias from './alias.js'
// 引入 nohup，将 ./nohup.js 中已经封装好的能力接到本文件流程里。
import nohup from './nohup.js'
// 引入 pyright，将 ./pyright.js 中已经封装好的能力接到本文件流程里。
import pyright from './pyright.js'
// 引入 sleep，将 ./sleep.js 中已经封装好的能力接到本文件流程里。
import sleep from './sleep.js'
// 引入 srun，将 ./srun.js 中已经封装好的能力接到本文件流程里。
import srun from './srun.js'
// 引入 time，将 ./time.js 中已经封装好的能力接到本文件流程里。
import time from './time.js'
// 引入 timeout，将 ./timeout.js 中已经封装好的能力接到本文件流程里。
import timeout from './timeout.js'

export default [
  pyright,
  timeout,
  sleep,
  alias,
  nohup,
  time,
  srun,
] satisfies CommandSpec[]

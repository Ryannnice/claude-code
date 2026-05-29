// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// Content for the verify bundled skill.
// Each .md file is inlined as a string at build time via Bun's text loader.

// 引入 cliMd，将 ./verify/examples/cli.md 中已经封装好的能力接到本文件流程里。
import cliMd from './verify/examples/cli.md'
// 引入 serverMd，将 ./verify/examples/server.md 中已经封装好的能力接到本文件流程里。
import serverMd from './verify/examples/server.md'
// 引入 skillMd，将 ./verify/SKILL.md 中已经封装好的能力接到本文件流程里。
import skillMd from './verify/SKILL.md'

// SKILL_MD保存`skillMd`，供后续判断或组装使用。
export const SKILL_MD: string = skillMd

// SKILL_FILES 文件数据 集中保存verify Content要一起传递的字段。
export const SKILL_FILES: Record<string, string> = {
  'examples/cli.md': cliMd,
  'examples/server.md': serverMd,
}

// 复用 parseFrontmatter 工具函数，把通用处理留在 ../../utils/frontmatterParser.js 中维护。
import { parseFrontmatter } from '../../utils/frontmatterParser.js'
// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'
// 引入 SKILL_FILES、SKILL_MD，将 ./verifyContent.js 中已经封装好的能力接到本文件流程里。
import { SKILL_FILES, SKILL_MD } from './verifyContent.js'

// 从 `parseFrontmatter(SKILL_MD)` 解构 frontmatter、content，减少verify对同一对象的重复访问。
const { frontmatter, content: SKILL_BODY } = parseFrontmatter(SKILL_MD)

// DESCRIPTION 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const DESCRIPTION =
  typeof frontmatter.description === 'string'
    ? frontmatter.description
    : 'Verify a code change does what it should by running the app.'

// registerVerifySkill 封装verify的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerVerifySkill(): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // verify在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 registerBundledSkill，触发verify此处需要的副作用。
  registerBundledSkill({
    name: 'verify',
    description: DESCRIPTION,
    userInvocable: true,
    files: SKILL_FILES,
    // getPromptForCommand 根据 args 读取或计算verify需要的结果。
    async getPromptForCommand(args) {
      // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
      const parts: string[] = [SKILL_BODY.trimStart()]
      // 满足 `args` 时，verify执行该分支。
      if (args) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`## User Request\n\n${args}`)
      }
      // 返回列表结果，保留verify已经排好的条目顺序。
      return [{ type: 'text', text: parts.join('\n\n') }]
    },
  })
}

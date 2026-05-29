// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 复用 shouldAutoEnableClaudeInChrome 工具函数，把通用处理留在 src/utils/claudeInChrome/setup.js 中维护。
import { shouldAutoEnableClaudeInChrome } from 'src/utils/claudeInChrome/setup.js'

/**
 * Initialize all bundled skills.
 * Called at startup to register skills that ship with the CLI.
 *
 * To add a new bundled skill:
 * 1. Create a new file in src/skills/bundled/ (e.g., myskill.ts)
 * 2. Export a register function that calls registerBundledSkill()
 * 3. Import and call that function here
 */
// initBundledSkills 封装index的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initBundledSkills(): void {
  /* eslint-disable @typescript-eslint/no-require-imports */
  // 调用 require，触发index此处需要的副作用。
  require('./updateConfig.js').registerUpdateConfigSkill()
  // 调用 require，触发index此处需要的副作用。
  require('./keybindings.js').registerKeybindingsSkill()
  // 调用 require，触发index此处需要的副作用。
  require('./verify.js').registerVerifySkill()
  // 调用 require，触发index此处需要的副作用。
  require('./debug.js').registerDebugSkill()
  // 调用 require，触发index此处需要的副作用。
  require('./loremIpsum.js').registerLoremIpsumSkill()
  // 调用 require，触发index此处需要的副作用。
  require('./skillify.js').registerSkillifySkill()
  // 调用 require，触发index此处需要的副作用。
  require('./remember.js').registerRememberSkill()
  // 调用 require，触发index此处需要的副作用。
  require('./simplify.js').registerSimplifySkill()
  // 调用 require，触发index此处需要的副作用。
  require('./batch.js').registerBatchSkill()
  // 调用 require，触发index此处需要的副作用。
  require('./stuck.js').registerStuckSkill()
  // 组合条件 `feature('KAIROS') || feature('KAIROS_DREAM')` 成立时，index才启用这条专门路径。
  if (feature('KAIROS') || feature('KAIROS_DREAM')) {
    // 从 `require('./dream.js')` 解构 registerDreamSkill，减少index对同一对象的重复访问。
    const { registerDreamSkill } = require('./dream.js')
    // 调用 registerDreamSkill，触发index此处需要的副作用。
    registerDreamSkill()
  }
  // 满足 `feature('REVIEW_ARTIFACT')` 时，index执行该分支。
  if (feature('REVIEW_ARTIFACT')) {
    // 从 `require('./hunter.js')` 解构 registerHunterSkill，减少index对同一对象的重复访问。
    const { registerHunterSkill } = require('./hunter.js')
    // 调用 registerHunterSkill，触发index此处需要的副作用。
    registerHunterSkill()
  }
  // 满足 `feature('AGENT_TRIGGERS')` 时，index执行该分支。
  if (feature('AGENT_TRIGGERS')) {
    // 从 `require('./loop.js')` 解构 registerLoopSkill，减少index对同一对象的重复访问。
    const { registerLoopSkill } = require('./loop.js')
    // /loop's isEnabled delegates to isKairosCronEnabled() — same lazy
    // per-invocation pattern as the cron tools. Registered unconditionally;
    // the skill's own isEnabled callback decides visibility.
    // 调用 registerLoopSkill，触发index此处需要的副作用。
    registerLoopSkill()
  }
  // 满足 `feature('AGENT_TRIGGERS_REMOTE')` 时，index执行该分支。
  if (feature('AGENT_TRIGGERS_REMOTE')) {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      registerScheduleRemoteAgentsSkill,
    } = require('./scheduleRemoteAgents.js')
    // 调用 registerScheduleRemoteAgentsSkill，触发index此处需要的副作用。
    registerScheduleRemoteAgentsSkill()
  }
  // 满足 `feature('BUILDING_CLAUDE_APPS')` 时，index执行该分支。
  if (feature('BUILDING_CLAUDE_APPS')) {
    // 从 `require('./claudeApi.js')` 解构 registerClaudeApiSkill，减少index对同一对象的重复访问。
    const { registerClaudeApiSkill } = require('./claudeApi.js')
    // 调用 registerClaudeApiSkill，触发index此处需要的副作用。
    registerClaudeApiSkill()
  }
  // 满足 `shouldAutoEnableClaudeInChrome()` 时，index执行该分支。
  if (shouldAutoEnableClaudeInChrome()) {
    // 调用 require，触发index此处需要的副作用。
    require('./claudeInChrome.js').registerClaudeInChromeSkill()
  }
  // 满足 `feature('RUN_SKILL_GENERATOR')` 时，index执行该分支。
  if (feature('RUN_SKILL_GENERATOR')) {
    // 从 `require('./runSkillGenerator.js')` 解构 registerRunSkillGeneratorSkill，减少index对同一对象的重复访问。
    const { registerRunSkillGeneratorSkill } = require('./runSkillGenerator.js')
    // 调用 registerRunSkillGeneratorSkill，触发index此处需要的副作用。
    registerRunSkillGeneratorSkill()
  }
  /* eslint-enable @typescript-eslint/no-require-imports */
}

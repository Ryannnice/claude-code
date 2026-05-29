// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 整理这一组导入，让project Onboarding State后续逻辑可以直接复用这些外部能力。
import {
  getCurrentProjectConfig,
  saveCurrentProjectConfig,
} from './utils/config.js'
// 复用 getCwd 工具函数，把通用处理留在 ./utils/cwd.js 中维护。
import { getCwd } from './utils/cwd.js'
// 复用 isDirEmpty 工具函数，把通用处理留在 ./utils/file.js 中维护。
import { isDirEmpty } from './utils/file.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ./utils/fsOperations.js 中维护。
import { getFsImplementation } from './utils/fsOperations.js'

// Step 固化project Onboarding State里传递的数据形状，帮助调用方按同一结构读写字段。
export type Step = {
  key: string
  text: string
  isComplete: boolean
  isCompletable: boolean
  isEnabled: boolean
}

// getSteps 封装projectOnboardingState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSteps(): Step[] {
  // hasClaudeMd记录 `getFsImplementation` 是否成立，project Onboarding State随后按该结果分支。
  const hasClaudeMd = getFsImplementation().existsSync(
    join(getCwd(), 'CLAUDE.md'),
  )
  // isWorkspaceDirEmpty记录 `isDirEmpty` 是否成立，project Onboarding State随后按该结果分支。
  const isWorkspaceDirEmpty = isDirEmpty(getCwd())

  // 返回列表结果，保留project Onboarding State已经排好的条目顺序。
  return [
    {
      key: 'workspace',
      text: 'Ask Claude to create a new app or clone a repository',
      isComplete: false,
      isCompletable: true,
      isEnabled: isWorkspaceDirEmpty,
    },
    {
      key: 'claudemd',
      text: 'Run /init to create a CLAUDE.md file with instructions for Claude',
      isComplete: hasClaudeMd,
      isCompletable: true,
      isEnabled: !isWorkspaceDirEmpty,
    },
  ]
}

// isProjectOnboardingComplete 封装projectOnboardingState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isProjectOnboardingComplete(): boolean {
  // 返回 `getSteps()`，作为project Onboarding State这次计算的结果。
  return getSteps()
    .filter(({ isCompletable, isEnabled }) => isCompletable && isEnabled)
    .every(({ isComplete }) => isComplete)
}

// maybeMarkProjectOnboardingComplete 封装projectOnboardingState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function maybeMarkProjectOnboardingComplete(): void {
  // Short-circuit on cached config — isProjectOnboardingComplete() hits
  // the filesystem, and REPL.tsx calls this on every prompt submit.
  // 满足 `getCurrentProjectConfig().hasCompletedProjectOnboarding` 时，project Onboarding State执行该分支。
  if (getCurrentProjectConfig().hasCompletedProjectOnboarding) {
    // project Onboarding State在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `isProjectOnboardingComplete()` 时，project Onboarding State执行该分支。
  if (isProjectOnboardingComplete()) {
    // 调用 saveCurrentProjectConfig，触发project Onboarding State此处需要的副作用。
    saveCurrentProjectConfig(current => ({
      ...current,
      hasCompletedProjectOnboarding: true,
    }))
  }
}

// shouldShowProjectOnboarding记录 `memoize` 是否成立，project Onboarding State随后按该结果分支。
export const shouldShowProjectOnboarding = memoize((): boolean => {
  // projectConfig 配置读取`getCurrentProjectConfig`，供project Onboarding State后续处理使用。
  const projectConfig = getCurrentProjectConfig()
  // Short-circuit on cached config before isProjectOnboardingComplete()
  // hits the filesystem — this runs during first render.
  // project Onboarding State在这里进入条件判断，后续代码按实际状态分流。
  if (
    projectConfig.hasCompletedProjectOnboarding ||
    projectConfig.projectOnboardingSeenCount >= 4 ||
    process.env.IS_DEMO
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `!isProjectOnboardingComplete()`，作为project Onboarding State这次计算的结果。
  return !isProjectOnboardingComplete()
})

// incrementProjectOnboardingSeenCount 封装projectOnboardingState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function incrementProjectOnboardingSeenCount(): void {
  // 调用 saveCurrentProjectConfig，触发project Onboarding State此处需要的副作用。
  saveCurrentProjectConfig(current => ({
    ...current,
    projectOnboardingSeenCount: current.projectOnboardingSeenCount + 1,
  }))
}

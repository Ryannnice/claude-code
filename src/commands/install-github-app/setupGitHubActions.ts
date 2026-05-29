// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 复用 saveGlobalConfig 工具函数，把通用处理留在 src/utils/config.js 中维护。
import { saveGlobalConfig } from 'src/utils/config.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  CODE_REVIEW_PLUGIN_WORKFLOW_CONTENT,
  PR_BODY,
  PR_TITLE,
  WORKFLOW_CONTENT,
} from '../../constants/github-app.js'
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 类型依赖 { Workflow } 来自 ./types.js，用于校准命令处理的数据契约。
import type { Workflow } from './types.js'

// createWorkflowFile 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function createWorkflowFile(
  repoName: string,
  branchName: string,
  workflowPath: string,
  workflowContent: string,
  secretName: string,
  message: string,
  context?: {
    useCurrentRepo?: boolean
    workflowExists?: boolean
    secretExists?: boolean
  },
): Promise<void> {
  // Check if workflow file already exists
  // checkFileResult 文件数据保存`execFileNoThrow`，供命令处理后续处理使用。
  const checkFileResult = await execFileNoThrow('gh', [
    'api',
    `repos/${repoName}/contents/${workflowPath}`,
    '--jq',
    '.sha',
  ])

  // fileSha 文件数据保存`null`，作为后续空值处理的输入。
  let fileSha: string | null = null
  // 满足 `checkFileResult.code === 0` 时，命令处理执行该分支。
  if (checkFileResult.code === 0) {
    // fileSha 文件数据更新为 `checkFileResult.stdout.trim()`，确保斜杠命令后续读取最新状态。
    fileSha = checkFileResult.stdout.trim()
  }

  // 文本内容保存`workflowContent`，供后续判断或组装使用。
  let content = workflowContent
  // 当 `secretName` 匹配 `'CLAUDE_CODE_OAUTH_TOKEN'` 时，命令处理执行对应分支。
  if (secretName === 'CLAUDE_CODE_OAUTH_TOKEN') {
    // For OAuth tokens, use the claude_code_oauth_token parameter
    // 文本内容更新为 `workflowContent.replace(`，确保斜杠命令后续读取最新状态。
    content = workflowContent.replace(
      /anthropic_api_key: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}/g,
      `claude_code_oauth_token: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`,
    )
  // 斜杠命令 setup Git Hub Actions在这里处理 `} else if (secretName !== 'ANTHROPIC_API_KEY') {`，完成这一小步状态转换。
  } else if (secretName !== 'ANTHROPIC_API_KEY') {
    // For other custom secret names, keep using anthropic_api_key parameter
    // 文本内容更新为 `workflowContent.replace(`，确保斜杠命令后续读取最新状态。
    content = workflowContent.replace(
      /anthropic_api_key: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}/g,
      `anthropic_api_key: \${{ secrets.${secretName} }}`,
    )
  }
  // base64Content保存`Buffer.from`，供命令处理后续处理使用。
  const base64Content = Buffer.from(content).toString('base64')

  // apiParams 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const apiParams = [
    'api',
    '--method',
    'PUT',
    `repos/${repoName}/contents/${workflowPath}`,
    '-f',
    `message=${fileSha ? `"Update ${message}"` : `"${message}"`}`,
    '-f',
    `content=${base64Content}`,
    '-f',
    `branch=${branchName}`,
  ]

  // 满足 `fileSha` 时，命令处理执行该分支。
  if (fileSha) {
    // apiParams 集合追加新条目，保持收集顺序与输入顺序一致。
    apiParams.push('-f', `sha=${fileSha}`)
  }

  // createFileResult 文件数据保存`execFileNoThrow`，供命令处理后续处理使用。
  const createFileResult = await execFileNoThrow('gh', apiParams)
  // `createFileResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (createFileResult.code !== 0) {
    // 命令处理在这里按实际状态进入对应分支。
    if (
      createFileResult.stderr.includes('422') &&
      createFileResult.stderr.includes('sha')
    ) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_setup_github_actions_failed', {
        reason:
          'failed_to_create_workflow_file' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        exit_code: createFileResult.code,
        ...context,
      })
      // 抛出 new Error(，阻止命令处理在无效状态下继续运行。
      throw new Error(
        `Failed to create workflow file ${workflowPath}: A Claude workflow file already exists in this repository. Please remove it first or update it manually.`,
      )
    }

    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_setup_github_actions_failed', {
      reason:
        'failed_to_create_workflow_file' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      exit_code: createFileResult.code,
      ...context,
    })

    // helpText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const helpText =
      '\n\nNeed help? Common issues:\n' +
      '· Permission denied → Run: gh auth refresh -h github.com -s repo,workflow\n' +
      '· Not authorized → Ensure you have admin access to the repository\n' +
      '· For manual setup → Visit: https://github.com/anthropics/claude-code-action'

    // 抛出 new Error(，阻止命令处理在无效状态下继续运行。
    throw new Error(
      `Failed to create workflow file ${workflowPath}: ${createFileResult.stderr}${helpText}`,
    )
  }
}

// setupGitHubActions 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setupGitHubActions(
  repoName: string,
  apiKeyOrOAuthToken: string | null,
  secretName: string,
  // 这个回调绑定到 updateProgress: () => void,，负责命令处理在该局部场景下的响应。
  updateProgress: () => void,
  skipWorkflow = false,
  selectedWorkflows: Workflow[],
  authType: 'api_key' | 'oauth_token',
  context?: {
    useCurrentRepo?: boolean
    workflowExists?: boolean
    secretExists?: boolean
  },
) {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_setup_github_actions_started', {
      skip_workflow: skipWorkflow,
      has_api_key: !!apiKeyOrOAuthToken,
      using_default_secret_name: secretName === 'ANTHROPIC_API_KEY',
      selected_claude_workflow: selectedWorkflows.includes('claude'),
      selected_claude_review_workflow:
        selectedWorkflows.includes('claude-review'),
      ...context,
    })

    // Check if repository exists
    // repoCheckResult保存`execFileNoThrow`，供命令处理后续处理使用。
    const repoCheckResult = await execFileNoThrow('gh', [
      'api',
      `repos/${repoName}`,
      '--jq',
      '.id',
    ])
    // `repoCheckResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (repoCheckResult.code !== 0) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_setup_github_actions_failed', {
        reason:
          'repo_not_found' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        exit_code: repoCheckResult.code,
        ...context,
      })
      // 抛出 new Error(，阻止命令处理在无效状态下继续运行。
      throw new Error(
        `Failed to access repository ${repoName}: ${repoCheckResult.stderr}`,
      )
    }

    // Get default branch
    // defaultBranchResult保存`execFileNoThrow`，供命令处理后续处理使用。
    const defaultBranchResult = await execFileNoThrow('gh', [
      'api',
      `repos/${repoName}`,
      '--jq',
      '.default_branch',
    ])
    // `defaultBranchResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (defaultBranchResult.code !== 0) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_setup_github_actions_failed', {
        reason:
          'failed_to_get_default_branch' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        exit_code: defaultBranchResult.code,
        ...context,
      })
      // 抛出 new Error(，阻止命令处理在无效状态下继续运行。
      throw new Error(
        `Failed to get default branch: ${defaultBranchResult.stderr}`,
      )
    }
    // defaultBranch格式化`stdout.trim`，供命令处理后续处理使用。
    const defaultBranch = defaultBranchResult.stdout.trim()

    // Get SHA of default branch
    // shaResult保存`execFileNoThrow`，供命令处理后续处理使用。
    const shaResult = await execFileNoThrow('gh', [
      'api',
      `repos/${repoName}/git/ref/heads/${defaultBranch}`,
      '--jq',
      '.object.sha',
    ])
    // `shaResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (shaResult.code !== 0) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_setup_github_actions_failed', {
        reason:
          'failed_to_get_branch_sha' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        exit_code: shaResult.code,
        ...context,
      })
      // 抛出 new Error(`Failed to get branch SHA: ${shaResult.stderr}`)，阻止命令处理在无效状态下继续运行。
      throw new Error(`Failed to get branch SHA: ${shaResult.stderr}`)
    }
    // sha格式化`stdout.trim`，供命令处理后续处理使用。
    const sha = shaResult.stdout.trim()

    // branchName保存`null`，作为后续空值处理的输入。
    let branchName: string | null = null

    // skipWorkflow缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!skipWorkflow) {
      // 调用 updateProgress，触发命令处理此处需要的副作用。
      updateProgress()
      // Create new branch
      // branchName更新为 ``add-claude-github-actions-${Date.now()}``，确保斜杠命令后续读取最新状态。
      branchName = `add-claude-github-actions-${Date.now()}`
      // createBranchResult保存`execFileNoThrow`，供命令处理后续处理使用。
      const createBranchResult = await execFileNoThrow('gh', [
        'api',
        '--method',
        'POST',
        `repos/${repoName}/git/refs`,
        '-f',
        `ref=refs/heads/${branchName}`,
        '-f',
        `sha=${sha}`,
      ])
      // `createBranchResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (createBranchResult.code !== 0) {
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_setup_github_actions_failed', {
          reason:
            'failed_to_create_branch' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          exit_code: createBranchResult.code,
          ...context,
        })
        // 抛出 new Error(`Failed to create branch: ${createBranchResult.stderr}`)，阻止命令处理在无效状态下继续运行。
        throw new Error(`Failed to create branch: ${createBranchResult.stderr}`)
      }

      // 调用 updateProgress，触发命令处理此处需要的副作用。
      updateProgress()
      // Create selected workflow files
      // workflows 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const workflows = []

      // 满足 `selectedWorkflows.includes('claude')` 时，命令处理执行该分支。
      if (selectedWorkflows.includes('claude')) {
        // workflows 集合追加新条目，保持收集顺序与输入顺序一致。
        workflows.push({
          path: '.github/workflows/claude.yml',
          content: WORKFLOW_CONTENT,
          message: 'Claude PR Assistant workflow',
        })
      }

      // 满足 `selectedWorkflows.includes('claude-review')` 时，命令处理执行该分支。
      if (selectedWorkflows.includes('claude-review')) {
        // workflows 集合追加新条目，保持收集顺序与输入顺序一致。
        workflows.push({
          path: '.github/workflows/claude-code-review.yml',
          content: CODE_REVIEW_PLUGIN_WORKFLOW_CONTENT,
          message: 'Claude Code Review workflow',
        })
      }

      // 按顺序遍历 `workflows` 中的workflow，逐个交给命令处理处理。
      for (const workflow of workflows) {
        // 等待 `createWorkflowFile(` 完成，再继续斜杠命令 setup Git Hub Actions的异步流程。
        await createWorkflowFile(
          repoName,
          branchName,
          workflow.path,
          workflow.content,
          secretName,
          workflow.message,
          context,
        )
      }
    }

    // 调用 updateProgress，触发命令处理此处需要的副作用。
    updateProgress()
    // Set the API key as a secret if provided
    // 满足 `apiKeyOrOAuthToken` 时，命令处理执行该分支。
    if (apiKeyOrOAuthToken) {
      // setSecretResult保存`execFileNoThrow`，供命令处理后续处理使用。
      const setSecretResult = await execFileNoThrow('gh', [
        'secret',
        'set',
        secretName,
        '--body',
        apiKeyOrOAuthToken,
        '--repo',
        repoName,
      ])
      // `setSecretResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (setSecretResult.code !== 0) {
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_setup_github_actions_failed', {
          reason:
            'failed_to_set_api_key_secret' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          exit_code: setSecretResult.code,
          ...context,
        })

        // helpText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const helpText =
          '\n\nNeed help? Common issues:\n' +
          '· Permission denied → Run: gh auth refresh -h github.com -s repo\n' +
          '· Not authorized → Ensure you have admin access to the repository\n' +
          '· For manual setup → Visit: https://github.com/anthropics/claude-code-action'

        // 抛出 new Error(，阻止命令处理在无效状态下继续运行。
        throw new Error(
          `Failed to set API key secret: ${setSecretResult.stderr || 'Unknown error'}${helpText}`,
        )
      }
    }

    // 只有 `!skipWorkflow && branchName` 满足时，命令处理才执行该分支。
    if (!skipWorkflow && branchName) {
      // 调用 updateProgress，触发命令处理此处需要的副作用。
      updateProgress()
      // Create PR template URL instead of creating PR directly
      // compareUrl保存`encodeURIComponent`，供命令处理后续处理使用。
      const compareUrl = `https://github.com/${repoName}/compare/${defaultBranch}...${branchName}?quick_pull=1&title=${encodeURIComponent(PR_TITLE)}&body=${encodeURIComponent(PR_BODY)}`

      // 等待 `openBrowser(compareUrl)` 完成，再继续斜杠命令 setup Git Hub Actions的异步流程。
      await openBrowser(compareUrl)
    }

    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_setup_github_actions_completed', {
      skip_workflow: skipWorkflow,
      has_api_key: !!apiKeyOrOAuthToken,
      auth_type:
        authType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      using_default_secret_name: secretName === 'ANTHROPIC_API_KEY',
      selected_claude_workflow: selectedWorkflows.includes('claude'),
      selected_claude_review_workflow:
        selectedWorkflows.includes('claude-review'),
      ...context,
    })
    // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      githubActionSetupCount: (current.githubActionSetupCount ?? 0) + 1,
    }))
  } catch (error) {
    // 命令处理在这里按实际状态进入对应分支。
    if (
      !error ||
      !(error instanceof Error) ||
      !error.message.includes('Failed to')
    ) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_setup_github_actions_failed', {
        reason:
          'unexpected_error' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...context,
      })
    }
    // 满足 `error instanceof Error` 时，命令处理执行该分支。
    if (error instanceof Error) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
    // 抛出 error，阻止命令处理在无效状态下继续运行。
    throw error
  }
}

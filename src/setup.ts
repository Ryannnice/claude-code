/* eslint-disable custom-rules/no-process-exit */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 整理这一组导入，让setup后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js'
// 复用 checkForReleaseNotes 工具函数，把通用处理留在 src/utils/releaseNotes.js 中维护。
import { checkForReleaseNotes } from 'src/utils/releaseNotes.js'
// 复用 setCwd 工具函数，把通用处理留在 src/utils/Shell.js 中维护。
import { setCwd } from 'src/utils/Shell.js'
// 复用 initSinks 工具函数，把通用处理留在 src/utils/sinks.js 中维护。
import { initSinks } from 'src/utils/sinks.js'
// 整理这一组导入，让setup后续逻辑可以直接复用这些外部能力。
import {
  getIsNonInteractiveSession,
  getProjectRoot,
  getSessionId,
  setOriginalCwd,
  setProjectRoot,
  switchSession,
} from './bootstrap/state.js'
// 引入 getCommands，将 ./commands.js 中已经封装好的能力接到本文件流程里。
import { getCommands } from './commands.js'
// 接入 initSessionMemory 服务层能力，把外部通信或共享状态交给 ./services/SessionMemory/sessionMemory.js 处理。
import { initSessionMemory } from './services/SessionMemory/sessionMemory.js'
// 引入 asSessionId，将 ./types/ids.js 中已经封装好的能力接到本文件流程里。
import { asSessionId } from './types/ids.js'
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ./utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from './utils/agentSwarmsEnabled.js'
// 复用 checkAndRestoreTerminalBackup 工具函数，把通用处理留在 ./utils/appleTerminalBackup.js 中维护。
import { checkAndRestoreTerminalBackup } from './utils/appleTerminalBackup.js'
// 复用 prefetchApiKeyFromApiKeyHelperIfSafe 工具函数，把通用处理留在 ./utils/auth.js 中维护。
import { prefetchApiKeyFromApiKeyHelperIfSafe } from './utils/auth.js'
// 复用 clearMemoryFileCaches 工具函数，把通用处理留在 ./utils/claudemd.js 中维护。
import { clearMemoryFileCaches } from './utils/claudemd.js'
// 复用 getCurrentProjectConfig、getGlobalConfig 工具函数，把通用处理留在 ./utils/config.js 中维护。
import { getCurrentProjectConfig, getGlobalConfig } from './utils/config.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ./utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from './utils/diagLogs.js'
// 复用 env 工具函数，把通用处理留在 ./utils/env.js 中维护。
import { env } from './utils/env.js'
// 复用 envDynamic 工具函数，把通用处理留在 ./utils/envDynamic.js 中维护。
import { envDynamic } from './utils/envDynamic.js'
// 复用 isBareMode、isEnvTruthy 工具函数，把通用处理留在 ./utils/envUtils.js 中维护。
import { isBareMode, isEnvTruthy } from './utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ./utils/errors.js 中维护。
import { errorMessage } from './utils/errors.js'
// 复用 findCanonicalGitRoot、findGitRoot、getIsGit 工具函数，把通用处理留在 ./utils/git.js 中维护。
import { findCanonicalGitRoot, findGitRoot, getIsGit } from './utils/git.js'
// 复用 initializeFileChangedWatcher 工具函数，把通用处理留在 ./utils/hooks/fileChangedWatcher.js 中维护。
import { initializeFileChangedWatcher } from './utils/hooks/fileChangedWatcher.js'
// 整理这一组导入，让setup后续逻辑可以直接复用这些外部能力。
import {
  captureHooksConfigSnapshot,
  updateHooksConfigSnapshot,
} from './utils/hooks/hooksConfigSnapshot.js'
// 复用 hasWorktreeCreateHook 工具函数，把通用处理留在 ./utils/hooks.js 中维护。
import { hasWorktreeCreateHook } from './utils/hooks.js'
// 复用 checkAndRestoreITerm2Backup 工具函数，把通用处理留在 ./utils/iTermBackup.js 中维护。
import { checkAndRestoreITerm2Backup } from './utils/iTermBackup.js'
// 复用 logError 工具函数，把通用处理留在 ./utils/log.js 中维护。
import { logError } from './utils/log.js'
// 复用 getRecentActivity 工具函数，把通用处理留在 ./utils/logoV2Utils.js 中维护。
import { getRecentActivity } from './utils/logoV2Utils.js'
// 复用 lockCurrentVersion 工具函数，把通用处理留在 ./utils/nativeInstaller/index.js 中维护。
import { lockCurrentVersion } from './utils/nativeInstaller/index.js'
// 类型依赖 { PermissionMode } 来自 ./utils/permissions/PermissionMode.js，用于校准setup的数据契约。
import type { PermissionMode } from './utils/permissions/PermissionMode.js'
// 复用 getPlanSlug 工具函数，把通用处理留在 ./utils/plans.js 中维护。
import { getPlanSlug } from './utils/plans.js'
// 复用 saveWorktreeState 工具函数，把通用处理留在 ./utils/sessionStorage.js 中维护。
import { saveWorktreeState } from './utils/sessionStorage.js'
// 复用 profileCheckpoint 工具函数，把通用处理留在 ./utils/startupProfiler.js 中维护。
import { profileCheckpoint } from './utils/startupProfiler.js'
// 整理这一组导入，让setup后续逻辑可以直接复用这些外部能力。
import {
  createTmuxSessionForWorktree,
  createWorktreeForSession,
  generateTmuxSessionName,
  worktreeBranchName,
} from './utils/worktree.js'

// setup 封装setup的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setup(
  cwd: string,
  permissionMode: PermissionMode,
  allowDangerouslySkipPermissions: boolean,
  worktreeEnabled: boolean,
  worktreeName: string | undefined,
  tmuxEnabled: boolean,
  customSessionId?: string | null,
  worktreePRNumber?: number,
  messagingSocketPath?: string,
): Promise<void> {
  // 调用 logForDiagnosticsNoPII，触发setup此处需要的副作用。
  logForDiagnosticsNoPII('info', 'setup_started')

  // Check for Node.js version < 18
  // nodeVersion匹配`version.match`，供setup后续处理使用。
  const nodeVersion = process.version.match(/^v(\d+)\./)?.[1]
  // 组合条件 `!nodeVersion || parseInt(nodeVersion) < 18` 成立时，setup才启用这条专门路径。
  if (!nodeVersion || parseInt(nodeVersion) < 18) {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.error，触发setup此处需要的副作用。
    console.error(
      chalk.bold.red(
        'Error: Claude Code requires Node.js version 18 or higher.',
      ),
    )
    // 调用 process.exit，触发setup此处需要的副作用。
    process.exit(1)
  }

  // Set custom session ID if provided
  // 满足 `customSessionId` 时，setup执行该分支。
  if (customSessionId) {
    // 调用 switchSession，触发setup此处需要的副作用。
    switchSession(asSessionId(customSessionId))
  }

  // --bare / SIMPLE: skip UDS messaging server and teammate snapshot.
  // Scripted calls don't receive injected messages and don't use swarm teammates.
  // Explicit --messaging-socket-path is the escape hatch (per #23222 gate pattern).
  // `!isBareMode() || messagingSocketPath` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (!isBareMode() || messagingSocketPath !== undefined) {
    // Start UDS messaging server (Mac/Linux only).
    // Enabled by default for ants — creates a socket in tmpdir if no
    // --messaging-socket-path is passed. Awaited so the server is bound
    // and $CLAUDE_CODE_MESSAGING_SOCKET is exported before any hook
    // (SessionStart in particular) can spawn and snapshot process.env.
    // 满足 `feature('UDS_INBOX')` 时，setup执行该分支。
    if (feature('UDS_INBOX')) {
      // m保存`import`，供setup后续处理使用。
      const m = await import('./utils/udsMessaging.js')
      // 等待 `m.startUdsMessaging(` 完成，再继续setup的异步流程。
      await m.startUdsMessaging(
        messagingSocketPath ?? m.getDefaultUdsSocketPath(),
        { isExplicit: messagingSocketPath !== undefined },
      )
    }
  }

  // Teammate snapshot — SIMPLE-only gate (no escape hatch, swarm not used in bare)
  // 组合条件 `!isBareMode() && isAgentSwarmsEnabled()` 成立时，setup才启用这条专门路径。
  if (!isBareMode() && isAgentSwarmsEnabled()) {
    // 从 `await import(` 解构 captureTeammateModeSnapshot，减少setup对同一对象的重复访问。
    const { captureTeammateModeSnapshot } = await import(
      './utils/swarm/backends/teammateModeSnapshot.js'
    )
    // 调用 captureTeammateModeSnapshot，触发setup此处需要的副作用。
    captureTeammateModeSnapshot()
  }

  // Terminal backup restoration — interactive only. Print mode doesn't
  // interact with terminal settings; the next interactive session will
  // detect and restore any interrupted setup.
  // 满足 `!getIsNonInteractiveSession()` 时，setup执行该分支。
  if (!getIsNonInteractiveSession()) {
    // iTerm2 backup check only when swarms enabled
    // 满足 `isAgentSwarmsEnabled()` 时，setup执行该分支。
    if (isAgentSwarmsEnabled()) {
      // restoredIterm2Backup读取`checkAndRestoreITerm2Backup`，供setup后续处理使用。
      const restoredIterm2Backup = await checkAndRestoreITerm2Backup()
      // 当 `restoredIterm2Backup.status` 匹配 `'restored'` 时，setup执行对应分支。
      if (restoredIterm2Backup.status === 'restored') {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.log，触发setup此处需要的副作用。
        console.log(
          chalk.yellow(
            'Detected an interrupted iTerm2 setup. Your original settings have been restored. You may need to restart iTerm2 for the changes to take effect.',
          ),
        )
      // setup在这里处理 `} else if (restoredIterm2Backup.status === 'failed') {`，完成这一小步状态转换。
      } else if (restoredIterm2Backup.status === 'failed') {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.error，触发setup此处需要的副作用。
        console.error(
          chalk.red(
            `Failed to restore iTerm2 settings. Please manually restore your original settings with: defaults import com.googlecode.iterm2 ${restoredIterm2Backup.backupPath}.`,
          ),
        )
      }
    }

    // Check and restore Terminal.app backup if setup was interrupted
    // 保护这一段可能失败的setup操作，确保异常能进入相邻错误处理。
    try {
      // restoredTerminalBackup读取`checkAndRestoreTerminalBackup`，供setup后续处理使用。
      const restoredTerminalBackup = await checkAndRestoreTerminalBackup()
      // 当 `restoredTerminalBackup.status` 匹配 `'restored'` 时，setup执行对应分支。
      if (restoredTerminalBackup.status === 'restored') {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.log，触发setup此处需要的副作用。
        console.log(
          chalk.yellow(
            'Detected an interrupted Terminal.app setup. Your original settings have been restored. You may need to restart Terminal.app for the changes to take effect.',
          ),
        )
      // setup在这里处理 `} else if (restoredTerminalBackup.status === 'failed') {`，完成这一小步状态转换。
      } else if (restoredTerminalBackup.status === 'failed') {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.error，触发setup此处需要的副作用。
        console.error(
          chalk.red(
            `Failed to restore Terminal.app settings. Please manually restore your original settings with: defaults import com.apple.Terminal ${restoredTerminalBackup.backupPath}.`,
          ),
        )
      }
    } catch (error) {
      // Log but don't crash if Terminal.app backup restoration fails
      // 记录setup运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  }

  // IMPORTANT: setCwd() must be called before any other code that depends on the cwd
  // setCwd 写入新的状态值，使setup后续读取保持一致。
  setCwd(cwd)
  // setOriginalCwd 写入新的状态值，使setup后续读取保持一致。
  setOriginalCwd(cwd)
  // setProjectRoot 写入新的状态值，使setup后续读取保持一致。
  setProjectRoot(cwd)

  // Local recovery mode: when CLAUDE_CODE_LOCAL_RECOVERY=1 is explicitly set,
  // trim startup to minimum. Otherwise run full setup for the Ink TUI.
  // 当 `process.env.CLAUDE_CODE_LOCAL_RECOVERY` 匹配 `'1'` 时，setup执行对应分支。
  if (process.env.CLAUDE_CODE_LOCAL_RECOVERY === '1') {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('[local-recovery] setup early return\n')
    // 调用 profileCheckpoint，触发setup此处需要的副作用。
    profileCheckpoint('setup_local_recovery_early_return')
    // setup在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Capture hooks configuration snapshot to avoid hidden hook modifications.
  // IMPORTANT: Must be called AFTER setCwd() so hooks are loaded from the correct directory
  // hooksStart记录时间`Date.now`，供setup后续处理使用。
  const hooksStart = Date.now()
  // 调用 captureHooksConfigSnapshot，触发setup此处需要的副作用。
  captureHooksConfigSnapshot()
  // 调用 logForDiagnosticsNoPII，触发setup此处需要的副作用。
  logForDiagnosticsNoPII('info', 'setup_hooks_captured', {
    duration_ms: Date.now() - hooksStart,
  })

  // Initialize FileChanged hook watcher — sync, reads hook config snapshot
  // 调用 initializeFileChangedWatcher，触发setup此处需要的副作用。
  initializeFileChangedWatcher(cwd)

  // Handle worktree creation if requested
  // IMPORTANT: this must be called befiore getCommands(), otherwise /eject won't be available.
  // 满足 `worktreeEnabled` 时，setup执行该分支。
  if (worktreeEnabled) {
    // Mirrors bridgeMain.ts: hook-configured sessions can proceed without git
    // so createWorktreeForSession() can delegate to the hook (non-git VCS).
    // hasHook记录 `hasWorktreeCreateHook` 是否成立，setup随后按该结果分支。
    const hasHook = hasWorktreeCreateHook()
    // inGit读取`getIsGit`，供setup后续处理使用。
    const inGit = await getIsGit()
    // 组合条件 `!hasHook && !inGit` 成立时，setup才启用这条专门路径。
    if (!hasHook && !inGit) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        chalk.red(
          `Error: Can only use --worktree in a git repository, but ${chalk.bold(cwd)} is not a git repository. ` +
            `Configure a WorktreeCreate hook in settings.json to use --worktree with other VCS systems.\n`,
        ),
      )
      // 调用 process.exit，触发setup此处需要的副作用。
      process.exit(1)
    }

    // slug保存`worktreePRNumber`，供setup后续判断或输出使用。
    const slug = worktreePRNumber
      ? `pr-${worktreePRNumber}`
      : (worktreeName ?? getPlanSlug())

    // Git preamble runs whenever we're in a git repo — even if a hook is
    // configured — so --tmux keeps working for git users who also have a
    // WorktreeCreate hook. Only hook-only (non-git) mode skips it.
    // tmuxSessionName 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let tmuxSessionName: string | undefined
    // 满足 `inGit` 时，setup执行该分支。
    if (inGit) {
      // Resolve to main repo root (handles being invoked from within a worktree).
      // findCanonicalGitRoot is sync/filesystem-only/memoized; the underlying
      // findGitRoot cache was already warmed by getIsGit() above, so this is ~free.
      // mainRepoRoot筛选`findCanonicalGitRoot`，供setup后续处理使用。
      const mainRepoRoot = findCanonicalGitRoot(getCwd())
      // mainRepoRoot缺失时提前走兜底路径，避免setup继续依赖无效输入。
      if (!mainRepoRoot) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          chalk.red(
            `Error: Could not determine the main git repository root.\n`,
          ),
        )
        // 调用 process.exit，触发setup此处需要的副作用。
        process.exit(1)
      }

      // If we're inside a worktree, switch to the main repo for worktree creation
      // `mainRepoRoot` 与 `(findGitRoot(getCwd()) ?? getCw...` 不一致时刷新派生状态，避免使用过期结果。
      if (mainRepoRoot !== (findGitRoot(getCwd()) ?? getCwd())) {
        // 调用 logForDiagnosticsNoPII，触发setup此处需要的副作用。
        logForDiagnosticsNoPII('info', 'worktree_resolved_to_main_repo')
        // 调用 process.chdir，触发setup此处需要的副作用。
        process.chdir(mainRepoRoot)
        // setCwd 写入新的状态值，使setup后续读取保持一致。
        setCwd(mainRepoRoot)
      }

      // tmuxSessionName 会话数据更新为 `tmuxEnabled`，确保setup后续读取最新状态。
      tmuxSessionName = tmuxEnabled
        ? generateTmuxSessionName(mainRepoRoot, worktreeBranchName(slug))
        : undefined
    } else {
      // Non-git hook mode: no canonical root to resolve, so name the tmux
      // session from cwd — generateTmuxSessionName only basenames the path.
      // tmuxSessionName 会话数据更新为 `tmuxEnabled`，确保setup后续读取最新状态。
      tmuxSessionName = tmuxEnabled
        ? generateTmuxSessionName(getCwd(), worktreeBranchName(slug))
        : undefined
    }

    // worktreeSession 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let worktreeSession: Awaited<ReturnType<typeof createWorktreeForSession>>
    // 保护这一段可能失败的setup操作，确保异常能进入相邻错误处理。
    try {
      // worktreeSession 会话数据更新为 `await createWorktreeForSession(`，确保setup后续读取最新状态。
      worktreeSession = await createWorktreeForSession(
        getSessionId(),
        slug,
        tmuxSessionName,
        worktreePRNumber ? { prNumber: worktreePRNumber } : undefined,
      )
    } catch (error) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        chalk.red(`Error creating worktree: ${errorMessage(error)}\n`),
      )
      // 调用 process.exit，触发setup此处需要的副作用。
      process.exit(1)
    }

    // 记录setup运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_worktree_created', { tmux_enabled: tmuxEnabled })

    // Create tmux session for the worktree if enabled
    // 组合条件 `tmuxEnabled && tmuxSessionName` 成立时，setup才启用这条专门路径。
    if (tmuxEnabled && tmuxSessionName) {
      // tmuxResult构建`createTmuxSessionForWorktree`，供setup后续处理使用。
      const tmuxResult = await createTmuxSessionForWorktree(
        tmuxSessionName,
        worktreeSession.worktreePath,
      )
      // 满足 `tmuxResult.created` 时，setup执行该分支。
      if (tmuxResult.created) {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.log，触发setup此处需要的副作用。
        console.log(
          chalk.green(
            `Created tmux session: ${chalk.bold(tmuxSessionName)}\nTo attach: ${chalk.bold(`tmux attach -t ${tmuxSessionName}`)}`,
          ),
        )
      } else {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.error，触发setup此处需要的副作用。
        console.error(
          chalk.yellow(
            `Warning: Failed to create tmux session: ${tmuxResult.error}`,
          ),
        )
      }
    }

    // 调用 process.chdir，触发setup此处需要的副作用。
    process.chdir(worktreeSession.worktreePath)
    // setCwd 写入新的状态值，使setup后续读取保持一致。
    setCwd(worktreeSession.worktreePath)
    // setOriginalCwd 写入新的状态值，使setup后续读取保持一致。
    setOriginalCwd(getCwd())
    // --worktree means the worktree IS the session's project, so skills/hooks/
    // cron/etc. should resolve here. (EnterWorktreeTool mid-session does NOT
    // touch projectRoot — that's a throwaway worktree, project stays stable.)
    // setProjectRoot 写入新的状态值，使setup后续读取保持一致。
    setProjectRoot(getCwd())
    // 调用 saveWorktreeState，触发setup此处需要的副作用。
    saveWorktreeState(worktreeSession)
    // Clear memory files cache since originalCwd has changed
    // 清理相关缓存，确保setup下一次读取时重新加载最新数据。
    clearMemoryFileCaches()
    // Settings cache was populated in init() (via applySafeConfigEnvironmentVariables)
    // and again at captureHooksConfigSnapshot() above, both from the original dir's
    // .claude/settings.json. Re-read from the worktree and re-capture hooks.
    // 调用 updateHooksConfigSnapshot，触发setup此处需要的副作用。
    updateHooksConfigSnapshot()
  }

  // Background jobs - only critical registrations that must happen before first query
  // 调用 logForDiagnosticsNoPII，触发setup此处需要的副作用。
  logForDiagnosticsNoPII('info', 'setup_background_jobs_starting')
  // Bundled skills/plugins are registered in main.tsx before the parallel
  // getCommands() kick — see comment there. Moved out of setup() because
  // the await points above (startUdsMessaging, ~20ms) meant getCommands()
  // raced ahead and memoized an empty bundledSkills list.
  // 满足 `!isBareMode()` 时，setup执行该分支。
  if (!isBareMode()) {
    // 调用 initSessionMemory，触发setup此处需要的副作用。
    initSessionMemory() // Synchronous - registers hook, gate check happens lazily
    // 满足 `feature('CONTEXT_COLLAPSE')` 时，setup执行该分支。
    if (feature('CONTEXT_COLLAPSE')) {
      /* eslint-disable @typescript-eslint/no-require-imports */
      // setup在这里处理 `;(`，完成这一小步状态转换。
      ;(
        require('./services/contextCollapse/index.js') as typeof import('./services/contextCollapse/index.js')
      ).initContextCollapse()
      /* eslint-enable @typescript-eslint/no-require-imports */
    }
  }
  // 显式忽略 `lockCurrentVersion() // Lock current version to prevent deletio...` 的返回值，只保留它触发的副作用。
  void lockCurrentVersion() // Lock current version to prevent deletion by other processes
  // 调用 logForDiagnosticsNoPII，触发setup此处需要的副作用。
  logForDiagnosticsNoPII('info', 'setup_background_jobs_launched')

  // 调用 profileCheckpoint，触发setup此处需要的副作用。
  profileCheckpoint('setup_before_prefetch')
  // Pre-fetch promises - only items needed before render
  // 调用 logForDiagnosticsNoPII，触发setup此处需要的副作用。
  logForDiagnosticsNoPII('info', 'setup_prefetch_starting')
  // When CLAUDE_CODE_SYNC_PLUGIN_INSTALL is set, skip all plugin prefetch.
  // The sync install path in print.ts calls refreshPluginState() after
  // installing, which reloads commands, hooks, and agents. Prefetching here
  // races with the install (concurrent copyPluginToVersionedCache / cachePlugin
  // on the same directories), and the hot-reload handler fires clearPluginCache()
  // mid-install when policySettings arrives.
  // skipPluginPrefetch 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const skipPluginPrefetch =
    (getIsNonInteractiveSession() &&
      isEnvTruthy(process.env.CLAUDE_CODE_SYNC_PLUGIN_INSTALL)) ||
    // --bare: loadPluginHooks → loadAllPlugins is filesystem work that's
    // wasted when executeHooks early-returns under --bare anyway.
    isBareMode()
  // skipPluginPrefetch 插件数据缺失时提前走兜底路径，避免setup继续依赖无效输入。
  if (!skipPluginPrefetch) {
    // 显式忽略 `getCommands(getProjectRoot())` 的返回值，只保留它触发的副作用。
    void getCommands(getProjectRoot())
  }
  // 这个回调绑定到 void import('./utils/plugins/loadPluginHooks.js').then(m => {，负责setup在该局部场景下的响应。
  void import('./utils/plugins/loadPluginHooks.js').then(m => {
    // skipPluginPrefetch 插件数据缺失时提前走兜底路径，避免setup继续依赖无效输入。
    if (!skipPluginPrefetch) {
      // 显式忽略 `m.loadPluginHooks() // Pre-load plugin hooks (consumed by proce...` 的返回值，只保留它触发的副作用。
      void m.loadPluginHooks() // Pre-load plugin hooks (consumed by processSessionStartHooks before render)
      // m.setupPluginHookHotReload 写入新的状态值，使setup后续读取保持一致。
      m.setupPluginHookHotReload() // Set up hot reload for plugin hooks when settings change
    }
  })
  // --bare: skip attribution hook install + repo classification +
  // session-file-access analytics + team memory watcher. These are background
  // bookkeeping for commit attribution + usage metrics — scripted calls don't
  // commit code, and the 49ms attribution hook stat check (measured) is pure
  // overhead. NOT an early-return: the --dangerously-skip-permissions safety
  // gate, tengu_started beacon, and apiKeyHelper prefetch below must still run.
  // 满足 `!isBareMode()` 时，setup执行该分支。
  if (!isBareMode()) {
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，setup执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // Prime repo classification cache for auto-undercover mode. Default is
      // undercover ON until proven internal; if this resolves to internal, clear
      // the prompt cache so the next turn picks up the OFF state.
      // 这个回调绑定到 void import('./utils/commitAttribution.js').then(async m => {，负责setup在该局部场景下的响应。
      void import('./utils/commitAttribution.js').then(async m => {
        // 满足 `await m.isInternalModelRepo()` 时，setup执行该分支。
        if (await m.isInternalModelRepo()) {
          // 从 `await import(` 解构 clearSystemPromptSections，减少setup对同一对象的重复访问。
          const { clearSystemPromptSections } = await import(
            './constants/systemPromptSections.js'
          )
          // 调用 clearSystemPromptSections，触发setup此处需要的副作用。
          clearSystemPromptSections()
        }
      })
    }
    // 满足 `feature('COMMIT_ATTRIBUTION')` 时，setup执行该分支。
    if (feature('COMMIT_ATTRIBUTION')) {
      // Dynamic import to enable dead code elimination (module contains excluded strings).
      // Defer to next tick so the git subprocess spawn runs after first render
      // rather than during the setup() microtask window.
      // setImmediate 写入新的状态值，使setup后续读取保持一致。
      setImmediate(() => {
        // 显式忽略 `import('./utils/attributionHooks.js').then(` 的返回值，只保留它触发的副作用。
        void import('./utils/attributionHooks.js').then(
          // 这个回调绑定到 ({ registerAttributionHooks }) => {，负责setup在该局部场景下的响应。
          ({ registerAttributionHooks }) => {
            // 调用 registerAttributionHooks，触发setup此处需要的副作用。
            registerAttributionHooks() // Register attribution tracking hooks (ant-only feature)
          },
        )
      })
    }
    // 这个回调绑定到 void import('./utils/sessionFileAccessHooks.js').then(m =>，负责setup在该局部场景下的响应。
    void import('./utils/sessionFileAccessHooks.js').then(m =>
      m.registerSessionFileAccessHooks(),
    ) // Register session file access analytics hooks
    // 满足 `feature('TEAMMEM')` 时，setup执行该分支。
    if (feature('TEAMMEM')) {
      // 这个回调绑定到 void import('./services/teamMemorySync/watcher.js').then(m =>，负责setup在该局部场景下的响应。
      void import('./services/teamMemorySync/watcher.js').then(m =>
        m.startTeamMemoryWatcher(),
      ) // Start team memory sync watcher
    }
  }
  // 调用 initSinks，触发setup此处需要的副作用。
  initSinks() // Attach error log + analytics sinks and drain queued events

  // Session-success-rate denominator. Emit immediately after the analytics
  // sink is attached — before any parsing, fetching, or I/O that could throw.
  // inc-3694 (P0 CHANGELOG crash) threw at checkForReleaseNotes below; every
  // event after this point was dead. This beacon is the earliest reliable
  // "process started" signal for release health monitoring.
  // 记录setup运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_started', {})

  // 显式忽略 `prefetchApiKeyFromApiKeyHelperIfSafe(getIsNonInteractiveSession...` 的返回值，只保留它触发的副作用。
  void prefetchApiKeyFromApiKeyHelperIfSafe(getIsNonInteractiveSession()) // Prefetch safely - only executes if trust already confirmed
  // 调用 profileCheckpoint，触发setup此处需要的副作用。
  profileCheckpoint('setup_after_prefetch')

  // Pre-fetch data for Logo v2 - await to ensure it's ready before logo renders.
  // --bare / SIMPLE: skip — release notes are interactive-UI display data,
  // and getRecentActivity() reads up to 10 session JSONL files.
  // 满足 `!isBareMode()` 时，setup执行该分支。
  if (!isBareMode()) {
    // 从 `await checkForReleaseNotes(` 解构 hasReleaseNotes，减少setup对同一对象的重复访问。
    const { hasReleaseNotes } = await checkForReleaseNotes(
      getGlobalConfig().lastReleaseNotesSeen,
    )
    // 满足 `hasReleaseNotes` 时，setup执行该分支。
    if (hasReleaseNotes) {
      // 等待 `getRecentActivity()` 完成，再继续setup的异步流程。
      await getRecentActivity()
    }
  }

  // If permission mode is set to bypass, verify we're in a safe environment
  // setup在这里进入条件判断，后续代码按实际状态分流。
  if (
    permissionMode === 'bypassPermissions' ||
    allowDangerouslySkipPermissions
  ) {
    // Check if running as root/sudo on Unix-like systems
    // Allow root if in a sandbox (e.g., TPU devspaces that require root)
    // setup在这里进入条件判断，后续代码按实际状态分流。
    if (
      process.platform !== 'win32' &&
      typeof process.getuid === 'function' &&
      process.getuid() === 0 &&
      process.env.IS_SANDBOX !== '1' &&
      !isEnvTruthy(process.env.CLAUDE_CODE_BUBBLEWRAP)
    ) {
      // biome-ignore lint/suspicious/noConsole:: intentional console output
      // 调用 console.error，触发setup此处需要的副作用。
      console.error(
        `--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons`,
      )
      // 调用 process.exit，触发setup此处需要的副作用。
      process.exit(1)
    }

    // setup在这里进入条件判断，后续代码按实际状态分流。
    if (
      process.env.USER_TYPE === 'ant' &&
      // Skip for Desktop's local agent mode — same trust model as CCR/BYOC
      // (trusted Anthropic-managed launcher intentionally pre-approving everything).
      // Precedent: permissionSetup.ts:861, applySettingsChange.ts:55 (PR #19116)
      process.env.CLAUDE_CODE_ENTRYPOINT !== 'local-agent' &&
      // Same for CCD (Claude Code in Desktop) — apps#29127 passes the flag
      // unconditionally to unlock mid-session bypass switching
      process.env.CLAUDE_CODE_ENTRYPOINT !== 'claude-desktop'
    ) {
      // Only await if permission mode is set to bypass
      // 并行获取 isDocker、hasInternet，缩短setup等待多个独立异步任务的时间。
      const [isDocker, hasInternet] = await Promise.all([
        envDynamic.getIsDocker(),
        env.hasInternetAccess(),
      ])
      // isBubblewrap记录 `envDynamic.getIsBubblewrapSandbox` 是否成立，setup随后按该结果分支。
      const isBubblewrap = envDynamic.getIsBubblewrapSandbox()
      // isSandbox 来自环境变量默认值，运行参数仍可在入口处覆盖。
      const isSandbox = process.env.IS_SANDBOX === '1'
      // isSandboxed标记setup是否启用对应路径。
      const isSandboxed = isDocker || isBubblewrap || isSandbox
      // 组合条件 `!isSandboxed || hasInternet` 成立时，setup才启用这条专门路径。
      if (!isSandboxed || hasInternet) {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.error，触发setup此处需要的副作用。
        console.error(
          `--dangerously-skip-permissions can only be used in Docker/sandbox containers with no internet access but got Docker: ${isDocker}, Bubblewrap: ${isBubblewrap}, IS_SANDBOX: ${isSandbox}, hasInternet: ${hasInternet}`,
        )
        // 调用 process.exit，触发setup此处需要的副作用。
        process.exit(1)
      }
    }
  }

  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，setup执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // setup在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Log tengu_exit event from the last session?
  // projectConfig 配置读取`getCurrentProjectConfig`，供setup后续处理使用。
  const projectConfig = getCurrentProjectConfig()
  // setup在这里进入条件判断，后续代码按实际状态分流。
  if (
    projectConfig.lastCost !== undefined &&
    projectConfig.lastDuration !== undefined
  ) {
    // 记录setup运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_exit', {
      last_session_cost: projectConfig.lastCost,
      last_session_api_duration: projectConfig.lastAPIDuration,
      last_session_tool_duration: projectConfig.lastToolDuration,
      last_session_duration: projectConfig.lastDuration,
      last_session_lines_added: projectConfig.lastLinesAdded,
      last_session_lines_removed: projectConfig.lastLinesRemoved,
      last_session_total_input_tokens: projectConfig.lastTotalInputTokens,
      last_session_total_output_tokens: projectConfig.lastTotalOutputTokens,
      last_session_total_cache_creation_input_tokens:
        projectConfig.lastTotalCacheCreationInputTokens,
      last_session_total_cache_read_input_tokens:
        projectConfig.lastTotalCacheReadInputTokens,
      last_session_fps_average: projectConfig.lastFpsAverage,
      last_session_fps_low_1_pct: projectConfig.lastFpsLow1Pct,
      last_session_id:
        projectConfig.lastSessionId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...projectConfig.lastSessionMetrics,
    })
    // Note: We intentionally don't clear these values after logging.
    // They're needed for cost restoration when resuming sessions.
    // The values will be overwritten when the next session exits.
  }
}

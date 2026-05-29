// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 整理这一组导入，让update后续逻辑可以直接复用这些外部能力。
import {
  getLatestVersion,
  type InstallStatus,
  installGlobalPackage,
} from 'src/utils/autoUpdater.js'
// 复用 regenerateCompletionCache 工具函数，把通用处理留在 src/utils/completionCache.js 中维护。
import { regenerateCompletionCache } from 'src/utils/completionCache.js'
// 整理这一组导入，让update后续逻辑可以直接复用这些外部能力。
import {
  getGlobalConfig,
  type InstallMethod,
  saveGlobalConfig,
} from 'src/utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 复用 getDoctorDiagnostic 工具函数，把通用处理留在 src/utils/doctorDiagnostic.js 中维护。
import { getDoctorDiagnostic } from 'src/utils/doctorDiagnostic.js'
// 复用 gracefulShutdown 工具函数，把通用处理留在 src/utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from 'src/utils/gracefulShutdown.js'
// 整理这一组导入，让update后续逻辑可以直接复用这些外部能力。
import {
  installOrUpdateClaudePackage,
  localInstallationExists,
} from 'src/utils/localInstaller.js'
// 整理这一组导入，让update后续逻辑可以直接复用这些外部能力。
import {
  installLatest as installLatestNative,
  removeInstalledSymlink,
} from 'src/utils/nativeInstaller/index.js'
// 复用 getPackageManager 工具函数，把通用处理留在 src/utils/nativeInstaller/packageManagers.js 中维护。
import { getPackageManager } from 'src/utils/nativeInstaller/packageManagers.js'
// 复用 writeToStdout 工具函数，把通用处理留在 src/utils/process.js 中维护。
import { writeToStdout } from 'src/utils/process.js'
// 复用 gte 工具函数，把通用处理留在 src/utils/semver.js 中维护。
import { gte } from 'src/utils/semver.js'
// 复用 getInitialSettings 工具函数，把通用处理留在 src/utils/settings/settings.js 中维护。
import { getInitialSettings } from 'src/utils/settings/settings.js'

// update 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function update() {
  // 记录update运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_update_check', {})
  // 调用 writeToStdout，触发update此处需要的副作用。
  writeToStdout(`Current version: ${MACRO.VERSION}\n`)

  // channel读取`getInitialSettings`，供update后续处理使用。
  const channel = getInitialSettings()?.autoUpdatesChannel ?? 'latest'
  // 调用 writeToStdout，触发update此处需要的副作用。
  writeToStdout(`Checking for updates to ${channel} version...\n`)

  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging('update: Starting update check')

  // Run diagnostic to detect potential issues
  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging('update: Running diagnostic')
  // diagnostic读取`getDoctorDiagnostic`，供update后续处理使用。
  const diagnostic = await getDoctorDiagnostic()
  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`update: Installation type: ${diagnostic.installationType}`)
  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `update: Config install method: ${diagnostic.configInstallMethod}`,
  )

  // Check for multiple installations
  // 满足 `diagnostic.multipleInstallations.length > 1` 时，update执行该分支。
  if (diagnostic.multipleInstallations.length > 1) {
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout('\n')
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout(chalk.yellow('Warning: Multiple installations found') + '\n')
    // 按顺序遍历 `diagnostic.multipleInstallations` 中的install，逐个交给update处理。
    for (const install of diagnostic.multipleInstallations) {
      // current 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const current =
        diagnostic.installationType === install.type
          ? ' (currently running)'
          : ''
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(`- ${install.type} at ${install.path}${current}\n`)
    }
  }

  // Display warnings if any exist
  // 满足 `diagnostic.warnings.length > 0` 时，update执行该分支。
  if (diagnostic.warnings.length > 0) {
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout('\n')
    // 按顺序遍历 `diagnostic.warnings` 中的warning 警告信息，逐个交给update处理。
    for (const warning of diagnostic.warnings) {
      // 记录update运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`update: Warning detected: ${warning.issue}`)

      // Don't skip PATH warnings - they're always relevant
      // The user needs to know that 'which claude' points elsewhere
      // 记录update运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`update: Showing warning: ${warning.issue}`)

      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(chalk.yellow(`Warning: ${warning.issue}\n`))

      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(chalk.bold(`Fix: ${warning.fix}\n`))
    }
  }

  // Update config if installMethod is not set (but skip for package managers)
  // 配置读取`getGlobalConfig`，供update后续处理使用。
  const config = getGlobalConfig()
  // update在这里进入条件判断，后续代码按实际状态分流。
  if (
    !config.installMethod &&
    diagnostic.installationType !== 'package-manager'
  ) {
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout('\n')
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout('Updating configuration to track installation method...\n')
    // detectedMethod 命名 `'unknown'`，让后续代码直接表达这个值的用途。
    let detectedMethod: 'local' | 'native' | 'global' | 'unknown' = 'unknown'

    // Map diagnostic installation type to config install method
    // 按照 diagnostic.installationType 的取值选择update的具体处理分支。
    switch (diagnostic.installationType) {
      case 'npm-local':
        // detectedMethod更新为 `'local'`，确保CLI后续读取最新状态。
        detectedMethod = 'local'
        // 结束这个分支或循环，避免update继续落入后续路径。
        break
      case 'native':
        // detectedMethod更新为 `'native'`，确保CLI后续读取最新状态。
        detectedMethod = 'native'
        // 结束这个分支或循环，避免update继续落入后续路径。
        break
      case 'npm-global':
        // detectedMethod更新为 `'global'`，确保CLI后续读取最新状态。
        detectedMethod = 'global'
        // 结束这个分支或循环，避免update继续落入后续路径。
        break
      default:
        // detectedMethod更新为 `'unknown'`，确保CLI后续读取最新状态。
        detectedMethod = 'unknown'
    }

    // 调用 saveGlobalConfig，触发update此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      installMethod: detectedMethod,
    }))
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout(`Installation method set to: ${detectedMethod}\n`)
  }

  // Check if running from development build
  // 当 `diagnostic.installationType` 匹配 `'development'` 时，update执行对应分支。
  if (diagnostic.installationType === 'development') {
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout('\n')
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout(
      chalk.yellow('Warning: Cannot update development build') + '\n',
    )
    // 等待 `gracefulShutdown(1)` 完成，再继续update的异步流程。
    await gracefulShutdown(1)
  }

  // Check if running from a package manager
  // 当 `diagnostic.installationType` 匹配 `'package-manager'` 时，update执行对应分支。
  if (diagnostic.installationType === 'package-manager') {
    // packageManager读取`getPackageManager`，供update后续处理使用。
    const packageManager = await getPackageManager()
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout('\n')

    // 当 `packageManager` 匹配 `'homebrew'` 时，update执行对应分支。
    if (packageManager === 'homebrew') {
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout('Claude is managed by Homebrew.\n')
      // latest读取`getLatestVersion`，供update后续处理使用。
      const latest = await getLatestVersion(channel)
      // 组合条件 `latest && !gte(MACRO.VERSION, latest)` 成立时，update才启用这条专门路径。
      if (latest && !gte(MACRO.VERSION, latest)) {
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(`Update available: ${MACRO.VERSION} → ${latest}\n`)
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('\n')
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('To update, run:\n')
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(chalk.bold('  brew upgrade claude-code') + '\n')
      } else {
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('Claude is up to date!\n')
      }
    // update在这里处理 `} else if (packageManager === 'winget') {`，完成这一小步状态转换。
    } else if (packageManager === 'winget') {
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout('Claude is managed by winget.\n')
      // latest读取`getLatestVersion`，供update后续处理使用。
      const latest = await getLatestVersion(channel)
      // 组合条件 `latest && !gte(MACRO.VERSION, latest)` 成立时，update才启用这条专门路径。
      if (latest && !gte(MACRO.VERSION, latest)) {
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(`Update available: ${MACRO.VERSION} → ${latest}\n`)
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('\n')
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('To update, run:\n')
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(
          chalk.bold('  winget upgrade Anthropic.ClaudeCode') + '\n',
        )
      } else {
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('Claude is up to date!\n')
      }
    // update在这里处理 `} else if (packageManager === 'apk') {`，完成这一小步状态转换。
    } else if (packageManager === 'apk') {
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout('Claude is managed by apk.\n')
      // latest读取`getLatestVersion`，供update后续处理使用。
      const latest = await getLatestVersion(channel)
      // 组合条件 `latest && !gte(MACRO.VERSION, latest)` 成立时，update才启用这条专门路径。
      if (latest && !gte(MACRO.VERSION, latest)) {
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(`Update available: ${MACRO.VERSION} → ${latest}\n`)
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('\n')
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('To update, run:\n')
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(chalk.bold('  apk upgrade claude-code') + '\n')
      } else {
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout('Claude is up to date!\n')
      }
    } else {
      // pacman, deb, and rpm don't get specific commands because they each have
      // multiple frontends (pacman: yay/paru/makepkg, deb: apt/apt-get/aptitude/nala,
      // rpm: dnf/yum/zypper)
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout('Claude is managed by a package manager.\n')
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout('Please use your package manager to update.\n')
    }

    // 等待 `gracefulShutdown(0)` 完成，再继续update的异步流程。
    await gracefulShutdown(0)
  }

  // Check for config/reality mismatch (skip for package-manager installs)
  // update在这里进入条件判断，后续代码按实际状态分流。
  if (
    config.installMethod &&
    diagnostic.configInstallMethod !== 'not set' &&
    diagnostic.installationType !== 'package-manager'
  ) {
    // runningType保存`diagnostic.installationType`，供后续判断或组装使用。
    const runningType = diagnostic.installationType
    // configExpects 配置保存`diagnostic.configInstallMethod`，供后续判断或组装使用。
    const configExpects = diagnostic.configInstallMethod

    // Map installation types for comparison
    // typeMapping 集中保存update要一起传递的字段。
    const typeMapping: Record<string, string> = {
      'npm-local': 'local',
      'npm-global': 'global',
      native: 'native',
      development: 'development',
      unknown: 'unknown',
    }

    // normalizedRunningType标记update是否启用对应路径。
    const normalizedRunningType = typeMapping[runningType] || runningType

    // update在这里进入条件判断，后续代码按实际状态分流。
    if (
      normalizedRunningType !== configExpects &&
      configExpects !== 'unknown'
    ) {
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout('\n')
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(chalk.yellow('Warning: Configuration mismatch') + '\n')
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(`Config expects: ${configExpects} installation\n`)
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(`Currently running: ${runningType}\n`)
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(
        chalk.yellow(
          `Updating the ${runningType} installation you are currently using`,
        ) + '\n',
      )

      // Update config to match reality
      // 调用 saveGlobalConfig，触发update此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        installMethod: normalizedRunningType as InstallMethod,
      }))
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(
        `Config updated to reflect current installation method: ${normalizedRunningType}\n`,
      )
    }
  }

  // Handle native installation updates first
  // 当 `diagnostic.installationType` 匹配 `'native'` 时，update执行对应分支。
  if (diagnostic.installationType === 'native') {
    // 记录update运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'update: Detected native installation, using native updater',
    )
    // 保护这一段可能失败的update操作，确保异常能进入相邻错误处理。
    try {
      // 结果保存`installLatestNative`，供update后续处理使用。
      const result = await installLatestNative(channel, true)

      // Handle lock contention gracefully
      // 满足 `result.lockFailed` 时，update执行该分支。
      if (result.lockFailed) {
        // pidInfo保存`result.lockHolderPid`，供update后续判断或输出使用。
        const pidInfo = result.lockHolderPid
          ? ` (PID ${result.lockHolderPid})`
          : ''
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(
          chalk.yellow(
            `Another Claude process${pidInfo} is currently running. Please try again in a moment.`,
          ) + '\n',
        )
        // 等待 `gracefulShutdown(0)` 完成，再继续update的异步流程。
        await gracefulShutdown(0)
      }

      // result.latestVersion缺失时提前走兜底路径，避免update继续依赖无效输入。
      if (!result.latestVersion) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write('Failed to check for updates\n')
        // 等待 `gracefulShutdown(1)` 完成，再继续update的异步流程。
        await gracefulShutdown(1)
      }

      // 满足 `result.latestVersion === MACRO.VERSION` 时，update执行该分支。
      if (result.latestVersion === MACRO.VERSION) {
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(
          chalk.green(`Claude Code is up to date (${MACRO.VERSION})`) + '\n',
        )
      } else {
        // 调用 writeToStdout，触发update此处需要的副作用。
        writeToStdout(
          chalk.green(
            `Successfully updated from ${MACRO.VERSION} to version ${result.latestVersion}`,
          ) + '\n',
        )
        // 等待 `regenerateCompletionCache()` 完成，再继续update的异步流程。
        await regenerateCompletionCache()
      }
      // 等待 `gracefulShutdown(0)` 完成，再继续update的异步流程。
      await gracefulShutdown(0)
    } catch (error) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write('Error: Failed to install native update\n')
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(String(error) + '\n')
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write('Try running "claude doctor" for diagnostics\n')
      // 等待 `gracefulShutdown(1)` 完成，再继续update的异步流程。
      await gracefulShutdown(1)
    }
  }

  // Fallback to existing JS/npm-based update logic
  // Remove native installer symlink since we're not using native installation
  // But only if user hasn't migrated to native installation
  // `config.installMethod` 与 `'native'` 不一致时刷新派生状态，避免使用过期结果。
  if (config.installMethod !== 'native') {
    // 等待 `removeInstalledSymlink()` 完成，再继续update的异步流程。
    await removeInstalledSymlink()
  }

  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging('update: Checking npm registry for latest version')
  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`update: Package URL: ${MACRO.PACKAGE_URL}`)
  // npmTag标记update是否启用对应路径。
  const npmTag = channel === 'stable' ? 'stable' : 'latest'
  // npmCommand 命令数据保存``npm view ${MACRO.PACKAGE_URL}@${npmTag} version``，作为后续固定文本处理的输入。
  const npmCommand = `npm view ${MACRO.PACKAGE_URL}@${npmTag} version`
  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`update: Running: ${npmCommand}`)
  // latestVersion读取`getLatestVersion`，供update后续处理使用。
  const latestVersion = await getLatestVersion(channel)
  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `update: Latest version from npm: ${latestVersion || 'FAILED'}`,
  )

  // latestVersion缺失时提前走兜底路径，避免update继续依赖无效输入。
  if (!latestVersion) {
    // 记录update运行诊断，方便排查异常路径或性能问题。
    logForDebugging('update: Failed to get latest version from npm registry')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(chalk.red('Failed to check for updates') + '\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('Unable to fetch latest version from npm registry\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('Possible causes:\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('  • Network connectivity issues\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('  • npm registry is unreachable\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('  • Corporate proxy/firewall blocking npm\n')
    // 组合条件 `MACRO.PACKAGE_URL && !MACRO.PACKAGE_URL.startsWith('@anthropic')` 成立时，update才启用这条专门路径。
    if (MACRO.PACKAGE_URL && !MACRO.PACKAGE_URL.startsWith('@anthropic')) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        '  • Internal/development build not published to npm\n',
      )
    }
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('Try:\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('  • Check your internet connection\n')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('  • Run with --debug flag for more details\n')
    // packageName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const packageName =
      MACRO.PACKAGE_URL ||
      (process.env.USER_TYPE === 'ant'
        ? '@anthropic-ai/claude-cli'
        : '@anthropic-ai/claude-code')
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      `  • Manually check: npm view ${packageName} version\n`,
    )

    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('  • Check if you need to login: npm whoami\n')
    // 等待 `gracefulShutdown(1)` 完成，再继续update的异步流程。
    await gracefulShutdown(1)
  }

  // Check if versions match exactly, including any build metadata (like SHA)
  // 满足 `latestVersion === MACRO.VERSION` 时，update执行该分支。
  if (latestVersion === MACRO.VERSION) {
    // 调用 writeToStdout，触发update此处需要的副作用。
    writeToStdout(
      chalk.green(`Claude Code is up to date (${MACRO.VERSION})`) + '\n',
    )
    // 等待 `gracefulShutdown(0)` 完成，再继续update的异步流程。
    await gracefulShutdown(0)
  }

  // 调用 writeToStdout，触发update此处需要的副作用。
  writeToStdout(
    `New version available: ${latestVersion} (current: ${MACRO.VERSION})\n`,
  )
  // 调用 writeToStdout，触发update此处需要的副作用。
  writeToStdout('Installing update...\n')

  // Determine update method based on what's actually running
  // useLocalUpdate标记update是否启用对应路径。
  let useLocalUpdate = false
  // updateMethodName保存`''`，作为后续固定文本处理的输入。
  let updateMethodName = ''

  // 按照 diagnostic.installationType 的取值选择update的具体处理分支。
  switch (diagnostic.installationType) {
    case 'npm-local':
      // useLocalUpdate更新为 `true`，确保CLI后续读取最新状态。
      useLocalUpdate = true
      // updateMethodName更新为 `'local'`，确保CLI后续读取最新状态。
      updateMethodName = 'local'
      // 结束这个分支或循环，避免update继续落入后续路径。
      break
    case 'npm-global':
      // useLocalUpdate更新为 `false`，确保CLI后续读取最新状态。
      useLocalUpdate = false
      // updateMethodName更新为 `'global'`，确保CLI后续读取最新状态。
      updateMethodName = 'global'
      // 结束这个分支或循环，避免update继续落入后续路径。
      break
    case 'unknown': {
      // Fallback to detection if we can't determine installation type
      // isLocal记录 `localInstallationExists` 是否成立，update随后按该结果分支。
      const isLocal = await localInstallationExists()
      // useLocalUpdate更新为 `isLocal`，确保CLI后续读取最新状态。
      useLocalUpdate = isLocal
      // updateMethodName更新为 `isLocal ? 'local' : 'global'`，确保CLI后续读取最新状态。
      updateMethodName = isLocal ? 'local' : 'global'
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(
        chalk.yellow('Warning: Could not determine installation type') + '\n',
      )
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(
        `Attempting ${updateMethodName} update based on file detection...\n`,
      )
      // 结束这个分支或循环，避免update继续落入后续路径。
      break
    }
    default:
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        `Error: Cannot update ${diagnostic.installationType} installation\n`,
      )
      // 等待 `gracefulShutdown(1)` 完成，再继续update的异步流程。
      await gracefulShutdown(1)
  }

  // 调用 writeToStdout，触发update此处需要的副作用。
  writeToStdout(`Using ${updateMethodName} installation update method...\n`)

  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`update: Update method determined: ${updateMethodName}`)
  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`update: useLocalUpdate: ${useLocalUpdate}`)

  // status 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let status: InstallStatus

  // 满足 `useLocalUpdate` 时，update执行该分支。
  if (useLocalUpdate) {
    // 记录update运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'update: Calling installOrUpdateClaudePackage() for local update',
    )
    // status 集合更新为 `await installOrUpdateClaudePackage(channel)`，确保CLI后续读取最新状态。
    status = await installOrUpdateClaudePackage(channel)
  } else {
    // 记录update运行诊断，方便排查异常路径或性能问题。
    logForDebugging('update: Calling installGlobalPackage() for global update')
    // status 集合更新为 `await installGlobalPackage()`，确保CLI后续读取最新状态。
    status = await installGlobalPackage()
  }

  // 记录update运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`update: Installation status: ${status}`)

  // 按照 status 的取值选择update的具体处理分支。
  switch (status) {
    case 'success':
      // 调用 writeToStdout，触发update此处需要的副作用。
      writeToStdout(
        chalk.green(
          `Successfully updated from ${MACRO.VERSION} to version ${latestVersion}`,
        ) + '\n',
      )
      // 等待 `regenerateCompletionCache()` 完成，再继续update的异步流程。
      await regenerateCompletionCache()
      // 结束这个分支或循环，避免update继续落入后续路径。
      break
    case 'no_permissions':
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        'Error: Insufficient permissions to install update\n',
      )
      // 满足 `useLocalUpdate` 时，update执行该分支。
      if (useLocalUpdate) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write('Try manually updating with:\n')
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          `  cd ~/.claude/local && npm update ${MACRO.PACKAGE_URL}\n`,
        )
      } else {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write('Try running with sudo or fix npm permissions\n')
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          'Or consider using native installation with: claude install\n',
        )
      }
      // 等待 `gracefulShutdown(1)` 完成，再继续update的异步流程。
      await gracefulShutdown(1)
      // 结束这个分支或循环，避免update继续落入后续路径。
      break
    case 'install_failed':
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write('Error: Failed to install update\n')
      // 满足 `useLocalUpdate` 时，update执行该分支。
      if (useLocalUpdate) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write('Try manually updating with:\n')
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          `  cd ~/.claude/local && npm update ${MACRO.PACKAGE_URL}\n`,
        )
      } else {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          'Or consider using native installation with: claude install\n',
        )
      }
      // 等待 `gracefulShutdown(1)` 完成，再继续update的异步流程。
      await gracefulShutdown(1)
      // 结束这个分支或循环，避免update继续落入后续路径。
      break
    case 'in_progress':
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        'Error: Another instance is currently performing an update\n',
      )
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write('Please wait and try again later\n')
      // 等待 `gracefulShutdown(1)` 完成，再继续update的异步流程。
      await gracefulShutdown(1)
      // 结束这个分支或循环，避免update继续落入后续路径。
      break
  }
  // 等待 `gracefulShutdown(0)` 完成，再继续update的异步流程。
  await gracefulShutdown(0)
}

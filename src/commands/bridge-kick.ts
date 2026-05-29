// 引入 getBridgeDebugHandle，将 ../bridge/bridgeDebug.js 中已经封装好的能力接到本文件流程里。
import { getBridgeDebugHandle } from '../bridge/bridgeDebug.js'
// 类型依赖 { Command } 来自 ../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../commands.js'
// 类型依赖 { LocalCommandCall } 来自 ../types/command.js，用于校准命令处理的数据契约。
import type { LocalCommandCall } from '../types/command.js'

/**
 * Ant-only: inject bridge failure states to manually test recovery paths.
 *
 *   /bridge-kick close 1002            — fire ws_closed with code 1002
 *   /bridge-kick close 1006            — fire ws_closed with code 1006
 *   /bridge-kick poll 404              — next poll throws 404/not_found_error
 *   /bridge-kick poll 404 <type>       — next poll throws 404 with error_type
 *   /bridge-kick poll 401              — next poll throws 401 (auth)
 *   /bridge-kick poll transient        — next poll throws axios-style rejection
 *   /bridge-kick register fail         — next register (inside doReconnect) transient-fails
 *   /bridge-kick register fail 3       — next 3 registers transient-fail
 *   /bridge-kick register fatal        — next register 403s (terminal)
 *   /bridge-kick reconnect-session fail — POST /bridge/reconnect fails (→ Strategy 2)
 *   /bridge-kick heartbeat 401         — next heartbeat 401s (JWT expired)
 *   /bridge-kick reconnect             — call doReconnect directly (= SIGUSR2)
 *   /bridge-kick status                — print current bridge state
 *
 * Workflow: connect Remote Control, run a subcommand, `tail -f debug.log`
 * and watch [bridge:repl] / [bridge:debug] lines for the recovery reaction.
 *
 * Composite sequences — the failure modes in the BQ data are chains, not
 * single events. Queue faults then fire the trigger:
 *
 *   # #22148 residual: ws_closed → register transient-blips → teardown?
 *   /bridge-kick register fail 2
 *   /bridge-kick close 1002
 *   → expect: doReconnect tries register, fails, returns false → teardown
 *     (demonstrates the retry gap that needs fixing)
 *
 *   # Dead gate: poll 404/not_found_error → does onEnvironmentLost fire?
 *   /bridge-kick poll 404
 *   → expect: tengu_bridge_repl_fatal_error (gate is dead — 147K/wk)
 *     after fix: tengu_bridge_repl_env_lost → doReconnect
 */

// USAGE 命名 ``/bridge-kick <subcommand>`，让后续代码直接表达这个值的用途。
const USAGE = `/bridge-kick <subcommand>
  close <code>              fire ws_closed with the given code (e.g. 1002)
  poll <status> [type]      next poll throws BridgeFatalError(status, type)
  poll transient            next poll throws axios-style rejection (5xx/net)
  register fail [N]         next N registers transient-fail (default 1)
  register fatal            next register 403s (terminal)
  reconnect-session fail    next POST /bridge/reconnect fails
  heartbeat <status>        next heartbeat throws BridgeFatalError(status)
  reconnect                 call reconnectEnvironmentWithSession directly
  status                    print bridge state`

// 这个回调绑定到 const call: LocalCommandCall = async args => {，负责命令处理在该局部场景下的响应。
const call: LocalCommandCall = async args => {
  // h读取`getBridgeDebugHandle`，供命令处理后续处理使用。
  const h = getBridgeDebugHandle()
  // h缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!h) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      type: 'text',
      value:
        'No bridge debug handle registered. Remote Control must be connected (USER_TYPE=ant).',
    }
  }

  // 从 `args.trim().split(/\s+/)` 按位置拆出 sub、a、b，让斜杠命令 bridge kick分别处理这些返回值。
  const [sub, a, b] = args.trim().split(/\s+/)

  // 按照 sub 的取值选择命令处理的具体处理分支。
  switch (sub) {
    case 'close': {
      // code保存`Number`，供命令处理后续处理使用。
      const code = Number(a)
      // 满足 `!Number.isFinite(code)` 时，命令处理执行该分支。
      if (!Number.isFinite(code)) {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return { type: 'text', value: `close: need a numeric code\n${USAGE}` }
      }
      // 调用 h.fireClose，触发命令处理此处需要的副作用。
      h.fireClose(code)
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text',
        value: `Fired transport close(${code}). Watch debug.log for [bridge:repl] recovery.`,
      }
    }

    case 'poll': {
      // 当 `a` 匹配 `'transient'` 时，命令处理执行对应分支。
      if (a === 'transient') {
        // 调用 h.injectFault，触发命令处理此处需要的副作用。
        h.injectFault({
          method: 'pollForWork',
          kind: 'transient',
          status: 503,
          count: 1,
        })
        // 调用 h.wakePollLoop，触发命令处理此处需要的副作用。
        h.wakePollLoop()
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'text',
          value:
            'Next poll will throw a transient (axios rejection). Poll loop woken.',
        }
      }
      // status 集合保存`Number`，供命令处理后续处理使用。
      const status = Number(a)
      // 满足 `!Number.isFinite(status)` 时，命令处理执行该分支。
      if (!Number.isFinite(status)) {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'text',
          value: `poll: need 'transient' or a status code\n${USAGE}`,
        }
      }
      // Default to what the server ACTUALLY sends for 404 (BQ-verified),
      // so `/bridge-kick poll 404` reproduces the real 147K/week state.
      // errorType 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const errorType =
        b ?? (status === 404 ? 'not_found_error' : 'authentication_error')
      // 调用 h.injectFault，触发命令处理此处需要的副作用。
      h.injectFault({
        method: 'pollForWork',
        kind: 'fatal',
        status,
        errorType,
        count: 1,
      })
      // 调用 h.wakePollLoop，触发命令处理此处需要的副作用。
      h.wakePollLoop()
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text',
        value: `Next poll will throw BridgeFatalError(${status}, ${errorType}). Poll loop woken.`,
      }
    }

    case 'register': {
      // 当 `a` 匹配 `'fatal'` 时，命令处理执行对应分支。
      if (a === 'fatal') {
        // 调用 h.injectFault，触发命令处理此处需要的副作用。
        h.injectFault({
          method: 'registerBridgeEnvironment',
          kind: 'fatal',
          status: 403,
          errorType: 'permission_error',
          count: 1,
        })
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          type: 'text',
          value:
            'Next registerBridgeEnvironment will 403. Trigger with close/reconnect.',
        }
      }
      // n保存`Number`，供命令处理后续处理使用。
      const n = Number(b) || 1
      // 调用 h.injectFault，触发命令处理此处需要的副作用。
      h.injectFault({
        method: 'registerBridgeEnvironment',
        kind: 'transient',
        status: 503,
        count: n,
      })
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text',
        value: `Next ${n} registerBridgeEnvironment call(s) will transient-fail. Trigger with close/reconnect.`,
      }
    }

    case 'reconnect-session': {
      // 调用 h.injectFault，触发命令处理此处需要的副作用。
      h.injectFault({
        method: 'reconnectSession',
        kind: 'fatal',
        status: 404,
        errorType: 'not_found_error',
        count: 2,
      })
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text',
        value:
          'Next 2 POST /bridge/reconnect calls will 404. doReconnect Strategy 1 falls through to Strategy 2.',
      }
    }

    case 'heartbeat': {
      // status 集合保存`Number`，供命令处理后续处理使用。
      const status = Number(a) || 401
      // 调用 h.injectFault，触发命令处理此处需要的副作用。
      h.injectFault({
        method: 'heartbeatWork',
        kind: 'fatal',
        status,
        errorType: status === 401 ? 'authentication_error' : 'not_found_error',
        count: 1,
      })
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text',
        value: `Next heartbeat will ${status}. Watch for onHeartbeatFatal → work-state teardown.`,
      }
    }

    case 'reconnect': {
      // 调用 h.forceReconnect，触发命令处理此处需要的副作用。
      h.forceReconnect()
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        type: 'text',
        value: 'Called reconnectEnvironmentWithSession(). Watch debug.log.',
      }
    }

    case 'status': {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'text', value: h.describe() }
    }

    default:
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'text', value: USAGE }
  }
}

// bridgeKick 集中保存命令处理斜杠命令 bridge kick要一起传递的字段。
const bridgeKick = {
  type: 'local',
  name: 'bridge-kick',
  description: 'Inject bridge failure states for manual recovery testing',
  // 这个回调绑定到 isEnabled: () => process.env.USER_TYPE === 'ant',，负责命令处理在该局部场景下的响应。
  isEnabled: () => process.env.USER_TYPE === 'ant',
  supportsNonInteractive: false,
  // 这个回调绑定到 load: () => Promise.resolve({ call }),，负责命令处理在该局部场景下的响应。
  load: () => Promise.resolve({ call }),
} satisfies Command

export default bridgeKick

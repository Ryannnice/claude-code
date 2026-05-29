// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// XML tag names used to mark skill/command metadata in messages
// COMMAND_NAME_TAG 命令数据 命名 `'command-name'`，让后续代码直接表达这个值的用途。
export const COMMAND_NAME_TAG = 'command-name'
// COMMAND_MESSAGE_TAG 命令数据固定为 `'command-message'`，作为xml后续展示或比较的基准。
export const COMMAND_MESSAGE_TAG = 'command-message'
// COMMAND_ARGS_TAG 命令数据保存`'command-args'`，作为后续固定文本处理的输入。
export const COMMAND_ARGS_TAG = 'command-args'

// XML tag names for terminal/bash command input and output in user messages
// These wrap content that represents terminal activity, not actual user prompts
// BASH_INPUT_TAG固定为 `'bash-input'`，作为xml后续展示或比较的基准。
export const BASH_INPUT_TAG = 'bash-input'
// BASH_STDOUT_TAG保存`'bash-stdout'`，作为后续固定文本处理的输入。
export const BASH_STDOUT_TAG = 'bash-stdout'
// BASH_STDERR_TAG固定为 `'bash-stderr'`，作为xml后续展示或比较的基准。
export const BASH_STDERR_TAG = 'bash-stderr'
// LOCAL_COMMAND_STDOUT_TAG 命令数据 命名 `'local-command-stdout'`，让后续代码直接表达这个值的用途。
export const LOCAL_COMMAND_STDOUT_TAG = 'local-command-stdout'
// LOCAL_COMMAND_STDERR_TAG 命令数据固定为 `'local-command-stderr'`，作为xml后续展示或比较的基准。
export const LOCAL_COMMAND_STDERR_TAG = 'local-command-stderr'
// LOCAL_COMMAND_CAVEAT_TAG 命令数据 命名 `'local-command-caveat'`，让后续代码直接表达这个值的用途。
export const LOCAL_COMMAND_CAVEAT_TAG = 'local-command-caveat'

// All terminal-related tags that indicate a message is terminal output, not a user prompt
// TERMINAL_OUTPUT_TAGS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const TERMINAL_OUTPUT_TAGS = [
  BASH_INPUT_TAG,
  BASH_STDOUT_TAG,
  BASH_STDERR_TAG,
  LOCAL_COMMAND_STDOUT_TAG,
  LOCAL_COMMAND_STDERR_TAG,
  LOCAL_COMMAND_CAVEAT_TAG,
] as const

// TICK_TAG 命名 `'tick'`，让后续代码直接表达这个值的用途。
export const TICK_TAG = 'tick'

// XML tag names for task notifications (background task completions)
// TASK_NOTIFICATION_TAG固定为 `'task-notification'`，作为xml后续展示或比较的基准。
export const TASK_NOTIFICATION_TAG = 'task-notification'
// TASK_ID_TAG固定为 `'task-id'`，作为xml后续展示或比较的基准。
export const TASK_ID_TAG = 'task-id'
// TOOL_USE_ID_TAG保存`'tool-use-id'`，作为后续固定文本处理的输入。
export const TOOL_USE_ID_TAG = 'tool-use-id'
// TASK_TYPE_TAG 命名 `'task-type'`，让后续代码直接表达这个值的用途。
export const TASK_TYPE_TAG = 'task-type'
// OUTPUT_FILE_TAG 文件数据固定为 `'output-file'`，作为xml后续展示或比较的基准。
export const OUTPUT_FILE_TAG = 'output-file'
// STATUS_TAG 命名 `'status'`，让后续代码直接表达这个值的用途。
export const STATUS_TAG = 'status'
// SUMMARY_TAG固定为 `'summary'`，作为xml后续展示或比较的基准。
export const SUMMARY_TAG = 'summary'
// REASON_TAG固定为 `'reason'`，作为xml后续展示或比较的基准。
export const REASON_TAG = 'reason'
// WORKTREE_TAG保存`'worktree'`，作为后续固定文本处理的输入。
export const WORKTREE_TAG = 'worktree'
// WORKTREE_PATH_TAG 路径数据固定为 `'worktreePath'`，作为xml后续展示或比较的基准。
export const WORKTREE_PATH_TAG = 'worktreePath'
// WORKTREE_BRANCH_TAG 命名 `'worktreeBranch'`，让后续代码直接表达这个值的用途。
export const WORKTREE_BRANCH_TAG = 'worktreeBranch'

// XML tag names for ultraplan mode (remote parallel planning sessions)
// ULTRAPLAN_TAG保存`'ultraplan'`，作为后续固定文本处理的输入。
export const ULTRAPLAN_TAG = 'ultraplan'

// XML tag name for remote /review results (teleported review session output).
// Remote session wraps its final review in this tag; local poller extracts it.
// REMOTE_REVIEW_TAG固定为 `'remote-review'`，作为xml后续展示或比较的基准。
export const REMOTE_REVIEW_TAG = 'remote-review'

// run_hunt.sh's heartbeat echoes the orchestrator's progress.json inside this
// tag every ~10s. Local poller parses the latest for the task-status line.
// REMOTE_REVIEW_PROGRESS_TAG 命名 `'remote-review-progress'`，让后续代码直接表达这个值的用途。
export const REMOTE_REVIEW_PROGRESS_TAG = 'remote-review-progress'

// XML tag name for teammate messages (swarm inter-agent communication)
// TEAMMATE_MESSAGE_TAG 消息数据固定为 `'teammate-message'`，作为xml后续展示或比较的基准。
export const TEAMMATE_MESSAGE_TAG = 'teammate-message'

// XML tag name for external channel messages
// CHANNEL_MESSAGE_TAG 消息数据 命名 `'channel-message'`，让后续代码直接表达这个值的用途。
export const CHANNEL_MESSAGE_TAG = 'channel-message'
// CHANNEL_TAG固定为 `'channel'`，作为xml后续展示或比较的基准。
export const CHANNEL_TAG = 'channel'

// XML tag name for cross-session UDS messages (another Claude session's inbox)
// CROSS_SESSION_MESSAGE_TAG 会话数据保存`'cross-session-message'`，作为后续固定文本处理的输入。
export const CROSS_SESSION_MESSAGE_TAG = 'cross-session-message'

// XML tag wrapping the rules/format boilerplate in a fork child's first message.
// Lets the transcript renderer collapse the boilerplate and show only the directive.
// FORK_BOILERPLATE_TAG固定为 `'fork-boilerplate'`，作为xml后续展示或比较的基准。
export const FORK_BOILERPLATE_TAG = 'fork-boilerplate'
// Prefix before the directive text, stripped by the renderer. Keep in sync
// across buildChildMessage (generates) and UserForkBoilerplateMessage (parses).
// FORK_DIRECTIVE_PREFIX 命名 `'Your directive: '`，让后续代码直接表达这个值的用途。
export const FORK_DIRECTIVE_PREFIX = 'Your directive: '

// Common argument patterns for slash commands that request help
// COMMON_HELP_ARGS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const COMMON_HELP_ARGS = ['help', '-h', '--help']

// Common argument patterns for slash commands that request current state/info
// COMMON_INFO_ARGS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const COMMON_INFO_ARGS = [
  'list',
  'show',
  'display',
  'current',
  'view',
  'get',
  'check',
  'describe',
  'print',
  'version',
  'about',
  'status',
  '?',
]

// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export const REMOTE_TRIGGER_TOOL_NAME = 'RemoteTrigger'

// DESCRIPTION 先占位，稍后的条件分支会根据实际输入补齐它。
export const DESCRIPTION =
  'Manage scheduled remote Claude Code agents (triggers) via the claude.ai CCR API. Auth is handled in-process — the token never reaches the shell.'

// PROMPT固定为 ``Call the claude.ai remote-trigger API. Use this instead ...`，作为工具实现 prompt后续展示或比较的基准。
export const PROMPT = `Call the claude.ai remote-trigger API. Use this instead of curl — the OAuth token is added automatically in-process and never exposed.

Actions:
- list: GET /v1/code/triggers
- get: GET /v1/code/triggers/{trigger_id}
- create: POST /v1/code/triggers (requires body)
- update: POST /v1/code/triggers/{trigger_id} (requires body, partial update)
- run: POST /v1/code/triggers/{trigger_id}/run

The response is the raw JSON from the API.`

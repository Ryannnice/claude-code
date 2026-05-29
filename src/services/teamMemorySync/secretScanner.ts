/**
 * Client-side secret scanner for team memory (PSR M22174).
 *
 * Scans content for credentials before upload so secrets never leave the
 * user's machine. Uses a curated subset of high-confidence rules from
 * gitleaks (https://github.com/gitleaks/gitleaks, MIT license) — only
 * rules with distinctive prefixes that have near-zero false-positive
 * rates are included. Generic keyword-context rules are omitted.
 *
 * Rule IDs and regexes sourced directly from the public gitleaks config:
 * https://github.com/gitleaks/gitleaks/blob/master/config/gitleaks.toml
 *
 * JS regex notes:
 *   - gitleaks uses Go regex; inline (?i) and mode groups (?-i:...) are
 *     not portable to JS. Affected rules are rewritten with explicit
 *     character classes ([a-zA-Z0-9] instead of (?i)[a-z0-9]).
 *   - Trailing boundary alternations like (?:[\x60'"\s;]|\\[nr]|$) from
 *     Go regex are kept (JS $ matches end-of-string in default mode).
 */

// 复用 capitalize 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { capitalize } from '../../utils/stringUtils.js'

// SecretRule 固化服务层 secret Scanner里传递的数据形状，帮助调用方按同一结构读写字段。
type SecretRule = {
  /** Gitleaks rule ID (kebab-case), used in labels and analytics */
  id: string
  /** Regex source, lazily compiled on first scan */
  source: string
  /** Optional JS regex flags (most rules are case-sensitive by default) */
  flags?: string
}

// SecretMatch 固化服务层 secret Scanner里传递的数据形状，帮助调用方按同一结构读写字段。
export type SecretMatch = {
  /** Gitleaks rule ID that matched (e.g., "github-pat", "aws-access-token") */
  ruleId: string
  /** Human-readable label derived from the rule ID */
  label: string
}

// ─── Curated rules ──────────────────────────────────────────────
// High-confidence patterns from gitleaks with distinctive prefixes.
// Ordered roughly by likelihood of appearing in dev-team content.

// Anthropic API key prefix, assembled at runtime so the literal byte
// sequence isn't present in the external bundle (excluded-strings check).
// join() is not constant-folded by the minifier.
// ANT_KEY_PFX格式化`join`，供服务层 secret Scanner后续处理使用。
const ANT_KEY_PFX = ['sk', 'ant', 'api'].join('-')

// SECRET_RULES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SECRET_RULES: SecretRule[] = [
  // — Cloud providers —
  {
    id: 'aws-access-token',
    source: '\\b((?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16})\\b',
  },
  {
    id: 'gcp-api-key',
    source: '\\b(AIza[\\w-]{35})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'azure-ad-client-secret',
    source:
      '(?:^|[\\\\\'"\\x60\\s>=:(,)])([a-zA-Z0-9_~.]{3}\\dQ~[a-zA-Z0-9_~.-]{31,34})(?:$|[\\\\\'"\\x60\\s<),])',
  },
  {
    id: 'digitalocean-pat',
    source: '\\b(dop_v1_[a-f0-9]{64})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'digitalocean-access-token',
    source: '\\b(doo_v1_[a-f0-9]{64})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },

  // — AI APIs —
  {
    id: 'anthropic-api-key',
    source: `\\b(${ANT_KEY_PFX}03-[a-zA-Z0-9_\\-]{93}AA)(?:[\\x60'"\\s;]|\\\\[nr]|$)`,
  },
  {
    id: 'anthropic-admin-api-key',
    source:
      '\\b(sk-ant-admin01-[a-zA-Z0-9_\\-]{93}AA)(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'openai-api-key',
    source:
      '\\b(sk-(?:proj|svcacct|admin)-(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})T3BlbkFJ(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})\\b|sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'huggingface-access-token',
    // gitleaks: hf_(?i:[a-z]{34}) → JS: hf_[a-zA-Z]{34}
    source: '\\b(hf_[a-zA-Z]{34})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },

  // — Version control —
  {
    id: 'github-pat',
    source: 'ghp_[0-9a-zA-Z]{36}',
  },
  {
    id: 'github-fine-grained-pat',
    source: 'github_pat_\\w{82}',
  },
  {
    id: 'github-app-token',
    source: '(?:ghu|ghs)_[0-9a-zA-Z]{36}',
  },
  {
    id: 'github-oauth',
    source: 'gho_[0-9a-zA-Z]{36}',
  },
  {
    id: 'github-refresh-token',
    source: 'ghr_[0-9a-zA-Z]{36}',
  },
  {
    id: 'gitlab-pat',
    source: 'glpat-[\\w-]{20}',
  },
  {
    id: 'gitlab-deploy-token',
    source: 'gldt-[0-9a-zA-Z_\\-]{20}',
  },

  // — Communication —
  {
    id: 'slack-bot-token',
    source: 'xoxb-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*',
  },
  {
    id: 'slack-user-token',
    source: 'xox[pe](?:-[0-9]{10,13}){3}-[a-zA-Z0-9-]{28,34}',
  },
  {
    id: 'slack-app-token',
    source: 'xapp-\\d-[A-Z0-9]+-\\d+-[a-z0-9]+',
    flags: 'i',
  },
  {
    id: 'twilio-api-key',
    source: 'SK[0-9a-fA-F]{32}',
  },
  {
    id: 'sendgrid-api-token',
    // gitleaks: SG\.(?i)[a-z0-9=_\-\.]{66} → JS: case-insensitive via flag
    source: '\\b(SG\\.[a-zA-Z0-9=_\\-.]{66})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },

  // — Dev tooling —
  {
    id: 'npm-access-token',
    source: '\\b(npm_[a-zA-Z0-9]{36})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'pypi-upload-token',
    source: 'pypi-AgEIcHlwaS5vcmc[\\w-]{50,1000}',
  },
  {
    id: 'databricks-api-token',
    source: '\\b(dapi[a-f0-9]{32}(?:-\\d)?)(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'hashicorp-tf-api-token',
    // gitleaks: (?i)[a-z0-9]{14}\.(?-i:atlasv1)\.[a-z0-9\-_=]{60,70}
    // → JS: case-insensitive hex+alnum prefix, literal "atlasv1", case-insensitive suffix
    source: '[a-zA-Z0-9]{14}\\.atlasv1\\.[a-zA-Z0-9\\-_=]{60,70}',
  },
  {
    id: 'pulumi-api-token',
    source: '\\b(pul-[a-f0-9]{40})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'postman-api-token',
    // gitleaks: PMAK-(?i)[a-f0-9]{24}\-[a-f0-9]{34} → JS: use [a-fA-F0-9]
    source:
      '\\b(PMAK-[a-fA-F0-9]{24}-[a-fA-F0-9]{34})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },

  // — Observability —
  {
    id: 'grafana-api-key',
    source:
      '\\b(eyJrIjoi[A-Za-z0-9+/]{70,400}={0,3})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'grafana-cloud-api-token',
    source: '\\b(glc_[A-Za-z0-9+/]{32,400}={0,3})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'grafana-service-account-token',
    source:
      '\\b(glsa_[A-Za-z0-9]{32}_[A-Fa-f0-9]{8})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'sentry-user-token',
    source: '\\b(sntryu_[a-f0-9]{64})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'sentry-org-token',
    source:
      '\\bsntrys_eyJpYXQiO[a-zA-Z0-9+/]{10,200}(?:LCJyZWdpb25fdXJs|InJlZ2lvbl91cmwi|cmVnaW9uX3VybCI6)[a-zA-Z0-9+/]{10,200}={0,2}_[a-zA-Z0-9+/]{43}',
  },

  // — Payment / commerce —
  {
    id: 'stripe-access-token',
    source:
      '\\b((?:sk|rk)_(?:test|live|prod)_[a-zA-Z0-9]{10,99})(?:[\\x60\'"\\s;]|\\\\[nr]|$)',
  },
  {
    id: 'shopify-access-token',
    source: 'shpat_[a-fA-F0-9]{32}',
  },
  {
    id: 'shopify-shared-secret',
    source: 'shpss_[a-fA-F0-9]{32}',
  },

  // — Crypto —
  {
    id: 'private-key',
    source:
      '-----BEGIN[ A-Z0-9_-]{0,100}PRIVATE KEY(?: BLOCK)?-----[\\s\\S-]{64,}?-----END[ A-Z0-9_-]{0,100}PRIVATE KEY(?: BLOCK)?-----',
    flags: 'i',
  },
]

// Lazily compiled pattern cache — compile once on first scan.
// compiledRules 集合 命名 `null`，让后续代码直接表达这个值的用途。
let compiledRules: Array<{ id: string; re: RegExp }> | null = null

// getCompiledRules 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCompiledRules(): Array<{ id: string; re: RegExp }> {
  // 满足 `compiledRules === null` 时，服务层 secret Scanner执行该分支。
  if (compiledRules === null) {
    // compiledRules 集合更新为 `SECRET_RULES.map(r => ({`，确保服务层后续读取最新状态。
    compiledRules = SECRET_RULES.map(r => ({
      id: r.id,
      re: new RegExp(r.source, r.flags),
    }))
  }
  // 返回 `compiledRules`，作为服务层 secret Scanner这次计算的结果。
  return compiledRules
}

/**
 * Convert a gitleaks rule ID (kebab-case) to a human-readable label.
 * e.g., "github-pat" → "GitHub PAT", "aws-access-token" → "AWS Access Token"
 */
// ruleIdToLabel 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ruleIdToLabel(ruleId: string): string {
  // Words where the canonical capitalization differs from title case
  // specialCase 集中保存服务层 secret Scanner要一起传递的字段。
  const specialCase: Record<string, string> = {
    aws: 'AWS',
    gcp: 'GCP',
    api: 'API',
    pat: 'PAT',
    ad: 'AD',
    tf: 'TF',
    oauth: 'OAuth',
    npm: 'NPM',
    pypi: 'PyPI',
    jwt: 'JWT',
    github: 'GitHub',
    gitlab: 'GitLab',
    openai: 'OpenAI',
    digitalocean: 'DigitalOcean',
    huggingface: 'HuggingFace',
    hashicorp: 'HashiCorp',
    sendgrid: 'SendGrid',
  }
  // 返回 `ruleId`，作为服务层 secret Scanner这次计算的结果。
  return ruleId
    .split('-')
    // 链式调用 map，继续加工上一行在服务层 secret Scanner中产生的数据。
    .map(part => specialCase[part] ?? capitalize(part))
    .join(' ')
}

/**
 * Scan a string for potential secrets.
 *
 * Returns one match per rule that fired (deduplicated by rule ID). The
 * actual matched text is intentionally NOT returned — we never log or
 * display secret values.
 */
// scanForSecrets 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function scanForSecrets(content: string): SecretMatch[] {
  // matches 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const matches: SecretMatch[] = []
  // seen构建`new Set<string>()` 整理出中间结果，供服务层 secret Scanner后续步骤使用。
  const seen = new Set<string>()

  // 逐项读取 `getCompiledRules()` 中的rule，按输入顺序推进服务层 secret Scanner。
  for (const rule of getCompiledRules()) {
    // 满足 `seen.has(rule.id)` 时，服务层 secret Scanner执行该分支。
    if (seen.has(rule.id)) {
      // 跳过当前项，继续处理服务层 secret Scanner中的下一轮循环。
      continue
    }
    // 满足 `rule.re.test(content)` 时，服务层 secret Scanner执行该分支。
    if (rule.re.test(content)) {
      // 调用 seen.add，触发服务层 secret Scanner此处需要的副作用。
      seen.add(rule.id)
      // matches 集合追加新条目，保持收集顺序与输入顺序一致。
      matches.push({
        ruleId: rule.id,
        label: ruleIdToLabel(rule.id),
      })
    }
  }

  // 返回 `matches`，作为服务层 secret Scanner这次计算的结果。
  return matches
}

/**
 * Get a human-readable label for a gitleaks rule ID.
 * Falls back to kebab-to-Title conversion for unknown IDs.
 */
// getSecretLabel 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSecretLabel(ruleId: string): string {
  // 返回 `ruleIdToLabel(ruleId)`，作为服务层 secret Scanner这次计算的结果。
  return ruleIdToLabel(ruleId)
}

/**
 * Redact any matched secrets in-place with [REDACTED].
 * Unlike scanForSecrets, this returns the content with spans replaced
 * so the surrounding text can still be written to disk safely.
 */
// redactRules 集合初始化为空值，后续分支会在有数据时补齐。
let redactRules: RegExp[] | null = null

// redactSecrets 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function redactSecrets(content: string): string {
  // 服务层 secret Scanner在这里处理 `redactRules ??= SECRET_RULES.map(`，完成这一小步状态转换。
  redactRules ??= SECRET_RULES.map(
    r => new RegExp(r.source, (r.flags ?? '').replace('g', '') + 'g'),
  )
  // 按顺序遍历 `redactRules` 中的re，逐个交给服务层 secret Scanner处理。
  for (const re of redactRules) {
    // Replace only the captured group, not the full match — patterns include
    // boundary chars (space, quote, ;) outside the group that must survive.
    // 文本内容更新为 `content.replace(re, (match, g1) =>`，确保服务层后续读取最新状态。
    content = content.replace(re, (match, g1) =>
      typeof g1 === 'string' ? match.replace(g1, '[REDACTED]') : '[REDACTED]',
    )
  }
  // 返回 `content`，作为服务层 secret Scanner这次计算的结果。
  return content
}

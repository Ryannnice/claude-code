// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

// Verified 1-token words (tested via API token counting)
// All common English words confirmed to tokenize as single tokens
// ONE_TOKEN_WORDS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ONE_TOKEN_WORDS = [
  // Articles & pronouns
  'the',
  'a',
  'an',
  'I',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'its',
  'our',
  'this',
  'that',
  'what',
  'who',
  // Common verbs
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'can',
  'could',
  'may',
  'might',
  'must',
  'shall',
  'should',
  'make',
  'made',
  'get',
  'got',
  'go',
  'went',
  'come',
  'came',
  'see',
  'saw',
  'know',
  'take',
  'think',
  'look',
  'want',
  'use',
  'find',
  'give',
  'tell',
  'work',
  'call',
  'try',
  'ask',
  'need',
  'feel',
  'seem',
  'leave',
  'put',
  // Common nouns & adjectives
  'time',
  'year',
  'day',
  'way',
  'man',
  'thing',
  'life',
  'hand',
  'part',
  'place',
  'case',
  'point',
  'fact',
  'good',
  'new',
  'first',
  'last',
  'long',
  'great',
  'little',
  'own',
  'other',
  'old',
  'right',
  'big',
  'high',
  'small',
  'large',
  'next',
  'early',
  'young',
  'few',
  'public',
  'bad',
  'same',
  'able',
  // Prepositions & conjunctions
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'from',
  'by',
  'about',
  'like',
  'through',
  'over',
  'before',
  'between',
  'under',
  'since',
  'without',
  'and',
  'or',
  'but',
  'if',
  'than',
  'because',
  'as',
  'until',
  'while',
  'so',
  'though',
  'both',
  'each',
  'when',
  'where',
  'why',
  'how',
  // Common adverbs
  'not',
  'now',
  'just',
  'more',
  'also',
  'here',
  'there',
  'then',
  'only',
  'very',
  'well',
  'back',
  'still',
  'even',
  'much',
  'too',
  'such',
  'never',
  'again',
  'most',
  'once',
  'off',
  'away',
  'down',
  'out',
  'up',
  // Tech/common words
  'test',
  'code',
  'data',
  'file',
  'line',
  'text',
  'word',
  'number',
  'system',
  'program',
  'set',
  'run',
  'value',
  'name',
  'type',
  'state',
  'end',
  'start',
]

// generateLoremIpsum 封装loremIpsum的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateLoremIpsum(targetTokens: number): string {
  // token 列表保存`0`，供后续判断或组装使用。
  let tokens = 0
  // 结果 命名 `''`，让后续代码直接表达这个值的用途。
  let result = ''

  // while 使用 tokens < targetTokens 完成lorem Ipsum里的对应操作。
  while (tokens < targetTokens) {
    // Sentence: 10-20 words
    // sentenceLength 数量保存`Math.floor`，供lorem Ipsum后续处理使用。
    const sentenceLength = 10 + Math.floor(Math.random() * 11)
    // wordsInSentence保存`0`，供lorem Ipsum后续判断或输出使用。
    let wordsInSentence = 0

    // 循环处理 `let i = 0; i < sentenceLength && tokens < targetT`，让lorem Ipsum逐项把同类条目按顺序走完。
    for (let i = 0; i < sentenceLength && tokens < targetTokens; i++) {
      // word 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const word =
        ONE_TOKEN_WORDS[Math.floor(Math.random() * ONE_TOKEN_WORDS.length)]
      // lorem Ipsum在这里处理 `result += word`，完成这一小步状态转换。
      result += word
      // lorem Ipsum在这里处理 `tokens++`，完成这一小步状态转换。
      tokens++
      // lorem Ipsum在这里处理 `wordsInSentence++`，完成这一小步状态转换。
      wordsInSentence++

      // 组合条件 `i === sentenceLength - 1 || tokens >= targetTokens` 成立时，lorem Ipsum才启用这条专门路径。
      if (i === sentenceLength - 1 || tokens >= targetTokens) {
        // lorem Ipsum在这里处理 `result += '. '`，完成这一小步状态转换。
        result += '. '
      } else {
        // lorem Ipsum在这里处理 `result += ' '`，完成这一小步状态转换。
        result += ' '
      }
    }

    // Paragraph break every 5-8 sentences (roughly 20% chance per sentence)
    // 组合条件 `wordsInSentence > 0 && Math.random() < 0.2 && tokens < targetTokens` 成立时，lorem Ipsum才启用这条专门路径。
    if (wordsInSentence > 0 && Math.random() < 0.2 && tokens < targetTokens) {
      // lorem Ipsum在这里处理 `result += '\n\n'`，完成这一小步状态转换。
      result += '\n\n'
    }
  }

  // 返回 `result.trim()`，作为lorem Ipsum这次计算的结果。
  return result.trim()
}

// registerLoremIpsumSkill 封装loremIpsum的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerLoremIpsumSkill(): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // lorem Ipsum在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 registerBundledSkill，触发lorem Ipsum此处需要的副作用。
  registerBundledSkill({
    name: 'lorem-ipsum',
    description:
      'Generate filler text for long context testing. Specify token count as argument (e.g., /lorem-ipsum 50000). Outputs approximately the requested number of tokens. Ant-only.',
    argumentHint: '[token_count]',
    userInvocable: true,
    // getPromptForCommand 根据 args 读取或计算lorem Ipsum需要的结果。
    async getPromptForCommand(args) {
      // 解析结果解析`parseInt`，供lorem Ipsum后续处理使用。
      const parsed = parseInt(args)

      // 组合条件 `args && (isNaN(parsed) || parsed <= 0)` 成立时，lorem Ipsum才启用这条专门路径。
      if (args && (isNaN(parsed) || parsed <= 0)) {
        // 返回列表结果，保留lorem Ipsum已经排好的条目顺序。
        return [
          {
            type: 'text',
            text: 'Invalid token count. Please provide a positive number (e.g., /lorem-ipsum 10000).',
          },
        ]
      }

      // targetTokens 集合标记lorem Ipsum是否启用对应路径。
      const targetTokens = parsed || 10000

      // Cap at 500k tokens for safety
      // cappedTokens 集合保存`Math.min`，供lorem Ipsum后续处理使用。
      const cappedTokens = Math.min(targetTokens, 500_000)

      // 满足 `cappedTokens < targetTokens` 时，lorem Ipsum执行该分支。
      if (cappedTokens < targetTokens) {
        // 返回列表结果，保留lorem Ipsum已经排好的条目顺序。
        return [
          {
            type: 'text',
            text: `Requested ${targetTokens} tokens, but capped at 500,000 for safety.\n\n${generateLoremIpsum(cappedTokens)}`,
          },
        ]
      }

      // loremText保存`generateLoremIpsum`，供lorem Ipsum后续处理使用。
      const loremText = generateLoremIpsum(cappedTokens)

      // Just dump the lorem ipsum text into the conversation
      // 返回列表结果，保留lorem Ipsum已经排好的条目顺序。
      return [
        {
          type: 'text',
          text: loremText,
        },
      ]
    },
  })
}

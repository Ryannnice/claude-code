import type { Command } from '../../commands.js'

const buddy = {
  type: 'local-jsx',
  name: 'buddy',
  description: 'Manage your companion pet',
  argumentHint: '[show|pet|mute|unmute|rename <name>]',
  load: () => import('./buddy.js'),
} satisfies Command

export default buddy

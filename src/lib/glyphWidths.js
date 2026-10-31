import { GLYPH_METRICS } from './glyphMetrics.js'

export function advanceOf(character) {
  if (character === ' ') return 4
  const metric = GLYPH_METRICS[character]
  return metric ? Math.ceil(metric[1] - 1e-6) + 1 : 6
}

export function shiftOf(character) {
  return GLYPH_METRICS[character]?.[0] ?? 0
}

export function textWidth(chars) {
  let widest = 0
  let line = 0
  for (const item of chars) {
    if (item.ch === '\n') {
      widest = Math.max(widest, line)
      line = 0
    } else line += advanceOf(item.ch) + (item.bold ? 1 : 0)
  }
  return Math.max(widest, line)
}

export function lookAlikes(character) {
  const advance = advanceOf(character)
  return POOL.filter(option => advanceOf(option) === advance)
}

const POOL = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?#$%&+=-_/:;.,|[]()*<>@~"\'')

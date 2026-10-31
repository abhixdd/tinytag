export const NAMED_COLORS = {
  black: '#000000',
  dark_blue: '#0000aa',
  dark_green: '#00aa00',
  dark_aqua: '#00aaaa',
  dark_red: '#aa0000',
  dark_purple: '#aa00aa',
  gold: '#ffaa00',
  gray: '#aaaaaa',
  dark_gray: '#555555',
  blue: '#5555ff',
  green: '#55ff55',
  aqua: '#55ffff',
  red: '#ff5555',
  light_purple: '#ff55ff',
  yellow: '#ffff55',
  white: '#ffffff',
}

const COLOR_ALIASES = { grey: 'gray', dark_grey: 'dark_gray' }

const DECORATIONS = {
  bold: 'bold',
  b: 'bold',
  italic: 'italic',
  em: 'italic',
  i: 'italic',
  underlined: 'underlined',
  u: 'underlined',
  strikethrough: 'strikethrough',
  st: 'strikethrough',
  obfuscated: 'obfuscated',
  obf: 'obfuscated',
}

const CLICK_ACTIONS = ['open_url', 'open_file', 'run_command', 'suggest_command', 'change_page', 'copy_to_clipboard']
const HOVER_ACTIONS = ['show_text', 'show_item', 'show_entity']
const PLACEHOLDER_TAGS = ['lang', 'tr', 'translate', 'key', 'selector', 'sel', 'score', 'nbt', 'data']
const IGNORED_TAGS = ['font', 'shadow']

const NUMBER = /^-?(?:\d+\.?\d*|\.\d+)$/

export function resolveColor(value) {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  if (NAMED_COLORS[key]) return NAMED_COLORS[key]
  if (COLOR_ALIASES[key]) return NAMED_COLORS[COLOR_ALIASES[key]]
  if (/^#[0-9a-f]{6}$/.test(key)) return key
  if (/^#[0-9a-f]{3}$/.test(key)) return `#${key[1]}${key[1]}${key[2]}${key[2]}${key[3]}${key[3]}`
  return null
}

export function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

export function rgbToHex(rgb) {
  return `#${rgb.map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`
}

function hsvToRgb(h, s, v) {
  const channel = n => {
    const k = (n + h * 6) % 6
    return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255
  }
  return [channel(5), channel(3), channel(1)]
}

export function gradientAt(stops, t, phase = 0) {
  if (stops.length === 1) return stops[0]
  let list = stops
  let shift = phase
  if (shift < 0) {
    list = [...stops].reverse()
    shift = 1 + shift
  }
  const segments = list.length - 1
  let position = t * segments
  if (shift !== 0) {
    position += shift * segments
    position = ((position % segments) + segments) % segments
  }
  const index = Math.min(segments - 1, Math.floor(position))
  const fraction = position - index
  const from = hexToRgb(list[index])
  const to = hexToRgb(list[index + 1])
  return rgbToHex(from.map((value, channel) => value + (to[channel] - value) * fraction))
}

function rainbowAt(index, total, phase, reversed) {
  let hue = index / Math.max(1, total)
  if (reversed) hue = -hue
  hue = (((hue + phase) % 1) + 1) % 1
  return rgbToHex(hsvToRgb(hue, 1, 1))
}

function splitArguments(content) {
  const parts = []
  let current = ''
  let quote = null
  for (let i = 0; i < content.length; i++) {
    const character = content[i]
    if (quote) {
      if (character === '\\' && i + 1 < content.length) { current += content[++i]; continue }
      if (character === quote) { quote = null; continue }
      current += character
    } else if ((character === "'" || character === '"') && (current === '' || content[i - 1] === ':')) {
      quote = character
    } else if (character === ':') {
      parts.push(current)
      current = ''
    } else current += character
  }
  parts.push(current)
  return parts
}

function findTagEnd(input, start) {
  let quote = null
  for (let i = start + 1; i < input.length; i++) {
    const character = input[i]
    if (quote) {
      if (character === '\\') i++
      else if (character === quote) quote = null
    } else if ((character === "'" || character === '"') && (input[i - 1] === ':')) quote = character
    else if (character === '>') return i
    else if (character === '<') return -1
  }
  return -1
}

function colorName(name) {
  return ['color', 'colour', 'c'].includes(name) || resolveColor(name) !== null
}

export function parseMiniMessage(input, options = {}) {
  const diagnostics = []
  const chars = []
  const stack = []
  const base = options.base || {}
  const depth = options.depth || 0
  const note = (level, message, index) => diagnostics.push({ level, message, index })

  function emit(character) {
    const style = { bold: Boolean(base.bold), italic: Boolean(base.italic), underlined: false, strikethrough: false, obfuscated: false }
    let provider = null
    let hover = null
    let click = null
    let insertion = null
    for (const entry of stack) {
      if (entry.kind === 'decoration') style[entry.key] = entry.value
      else if (entry.kind === 'color') provider = entry.provider
      else if (entry.kind === 'hover') hover = entry.value
      else if (entry.kind === 'click') click = entry.value
      else if (entry.kind === 'insertion') insertion = entry.value
    }
    let index = 0
    if (provider) index = provider.count++
    chars.push({ ch: character, ...style, color: null, hover, click, insertion, provider, index })
  }

  function colorArguments(args, name, position) {
    const colors = []
    let phase = null
    for (const [argumentIndex, argument] of args.entries()) {
      const color = resolveColor(argument)
      if (color) colors.push(color)
      else if (NUMBER.test(argument.trim()) && argumentIndex === args.length - 1) phase = Number(argument)
      else {
        note('warning', `<${name}> has an invalid color or phase: "${argument}"`, position)
        return null
      }
    }
    return { colors, phase }
  }

  function handleTag(start, end) {
    const content = input.slice(start + 1, end)
    let body = content
    let closing = false
    let negated = false
    if (body.startsWith('/')) { closing = true; body = body.slice(1) } else if (body.startsWith('!')) { negated = true; body = body.slice(1) }
    const parts = splitArguments(body)
    const name = parts[0].trim().toLowerCase()
    const args = parts.slice(1)
    if (!/^[a-z#][a-z0-9_#-]*$/.test(name)) return -1

    if (closing) {
      let key = null
      if (colorName(name)) key = 'color'
      else if (DECORATIONS[name]) key = DECORATIONS[name]
      else if (['gradient', 'rainbow', 'transition', 'hover', 'click', 'insertion', 'font', 'shadow'].includes(name)) key = name
      else if (name === 'pre') key = 'pre'
      if (!key) { note('warning', `Unknown tag </${name}>`, start); return -1 }
      let found = -1
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].name === key) { found = i; break }
      if (found < 0) { note('warning', `</${name}> has no matching opening tag`, start); return end + 1 }
      stack.length = found
      return end + 1
    }

    if (name === 'reset') { stack.length = 0; return end + 1 }
    if (name === 'newline' || name === 'br') { emit('\n'); return end + 1 }

    if (name === 'pre') {
      const close = input.toLowerCase().indexOf('</pre>', end + 1)
      const literal = input.slice(end + 1, close < 0 ? input.length : close)
      for (const character of literal) emit(character)
      return close < 0 ? input.length : close + '</pre>'.length
    }

    if (colorName(name)) {
      if (negated) { note('warning', `<!${name}> is not a valid tag`, start); return -1 }
      const value = ['color', 'colour', 'c'].includes(name) ? args[0] : name
      const color = resolveColor(value)
      if (!color) { note('warning', `Unknown color: "${value ?? ''}"`, start); return -1 }
      stack.push({ kind: 'color', name: 'color', provider: { type: 'color', color, count: 0 } })
      return end + 1
    }

    if (DECORATIONS[name]) {
      const key = DECORATIONS[name]
      stack.push({ kind: 'decoration', name: key, key, value: negated ? false : args[0]?.trim().toLowerCase() !== 'false' })
      return end + 1
    }

    if (name === 'gradient' || name === 'transition') {
      const parsed = colorArguments(args, name, start)
      if (!parsed) return -1
      let { colors, phase } = parsed
      if (colors.length === 0) {
        if (name === 'transition') { note('warning', '<transition> needs at least one color', start); return -1 }
        colors = ['#000000', '#ffffff']
      }
      stack.push({ kind: 'color', name, provider: { type: name, colors, phase: phase ?? 0, count: 0 } })
      return end + 1
    }

    if (name === 'rainbow') {
      let reversed = false
      let phase = 0
      for (const argument of args) {
        let value = argument.trim()
        if (value.startsWith('!')) { reversed = true; value = value.slice(1) }
        if (value === '') continue
        if (NUMBER.test(value)) phase = Number(value)
        else { note('warning', `<rainbow> has an invalid argument: "${argument}"`, start); return -1 }
      }
      stack.push({ kind: 'color', name: 'rainbow', provider: { type: 'rainbow', reversed, phase, count: 0 } })
      return end + 1
    }

    if (name === 'hover') {
      const action = (args[0] || '').trim().toLowerCase()
      if (!HOVER_ACTIONS.includes(action)) { note('warning', `<hover> needs an action: ${HOVER_ACTIONS.join(', ')}`, start); return -1 }
      const value = args.slice(1).join(':')
      if (action === 'show_text') {
        const parsed = depth < 3 ? parseMiniMessage(value, { base: { color: '#ffffff' }, depth: depth + 1 }) : { chars: [], diagnostics: [] }
        for (const item of parsed.diagnostics) diagnostics.push({ ...item, message: `In hover text: ${item.message}`, index: start })
        stack.push({ kind: 'hover', name: 'hover', value: { action, chars: parsed.chars } })
      } else stack.push({ kind: 'hover', name: 'hover', value: { action, text: value } })
      return end + 1
    }

    if (name === 'click') {
      const action = (args[0] || '').trim().toLowerCase()
      if (!CLICK_ACTIONS.includes(action)) { note('warning', `<click> needs an action: ${CLICK_ACTIONS.join(', ')}`, start); return -1 }
      stack.push({ kind: 'click', name: 'click', value: { action, value: args.slice(1).join(':') } })
      return end + 1
    }

    if (name === 'insertion') {
      stack.push({ kind: 'insertion', name: 'insertion', value: args.join(':') })
      return end + 1
    }

    if (IGNORED_TAGS.includes(name)) {
      stack.push({ kind: 'ignored', name })
      note('info', `<${name}> is accepted but not shown in the preview`, start)
      return end + 1
    }

    if (PLACEHOLDER_TAGS.includes(name)) {
      const text = `[${args.join(':') || name}]`
      for (const character of text) emit(character)
      note('info', `<${name}> is shown as a placeholder because its value is only known in game`, start)
      return end + 1
    }

    note('warning', `Unknown tag <${name}>, shown as plain text`, start)
    return -1
  }

  let i = 0
  while (i < input.length) {
    const character = input[i]
    if (character === '\\' && (input[i + 1] === '<' || input[i + 1] === '\\')) {
      emit(input[i + 1])
      i += 2
      continue
    }
    if (character === '<') {
      const end = findTagEnd(input, i)
      if (end > i) {
        const next = handleTag(i, end)
        if (next >= 0) { i = next; continue }
      }
    }
    emit(character)
    i++
  }

  const baseColor = base.color || null
  for (const item of chars) {
    const provider = item.provider
    if (!provider) item.color = baseColor
    else if (provider.type === 'color') item.color = provider.color
    else if (provider.type === 'gradient') item.color = gradientAt(provider.colors, provider.count > 1 ? item.index / (provider.count - 1) : 0, provider.phase)
    else if (provider.type === 'rainbow') item.color = rainbowAt(item.index, provider.count, provider.phase, provider.reversed)
    else if (provider.type === 'transition') item.color = gradientAt(provider.colors, Math.max(0, Math.min(1, provider.phase)), 0)
    delete item.provider
    delete item.index
  }
  return { chars, diagnostics }
}

export function plainChars(text, color = null) {
  return Array.from(text, ch => ({ ch, color, bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false, hover: null, click: null, insertion: null }))
}

const COLOR_TAG_NAMES = [...Object.keys(NAMED_COLORS), ...Object.keys(COLOR_ALIASES), 'color', 'colour', 'c', 'gradient', 'rainbow', 'transition']
const COLOR_TAG = new RegExp(`^(?:</?(?:${COLOR_TAG_NAMES.join('|')})(?::[^<>]*)?>|</?#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?>)$`, 'i')

export function stripColorTags(text) {
  let output = ''
  let i = 0
  while (i < text.length) {
    if (text[i] === '\\' && (text[i + 1] === '<' || text[i + 1] === '\\')) {
      output += text[i] + text[i + 1]
      i += 2
      continue
    }
    if (text[i] === '<') {
      const end = findTagEnd(text, i)
      if (end > i) {
        const tag = text.slice(i, end + 1)
        if (!COLOR_TAG.test(tag)) output += tag
        i = end + 1
        continue
      }
    }
    output += text[i]
    i++
  }
  return output
}

export const LEGACY_COLORS = [
  ['0', 'black'], ['1', 'dark_blue'], ['2', 'dark_green'], ['3', 'dark_aqua'],
  ['4', 'dark_red'], ['5', 'dark_purple'], ['6', 'gold'], ['7', 'gray'],
  ['8', 'dark_gray'], ['9', 'blue'], ['a', 'green'], ['b', 'aqua'],
  ['c', 'red'], ['d', 'light_purple'], ['e', 'yellow'], ['f', 'white'],
].map(([code, name]) => ({ code, name, hex: NAMED_COLORS[name] }))

export const LEGACY_FORMATS = [
  { code: 'l', name: 'bold', label: 'Bold' },
  { code: 'o', name: 'italic', label: 'Italic' },
  { code: 'n', name: 'underlined', label: 'Underline' },
  { code: 'm', name: 'strikethrough', label: 'Strikethrough' },
  { code: 'k', name: 'obfuscated', label: 'Obfuscated' },
  { code: 'r', name: 'reset', label: 'Reset' },
]

const LEGACY_BY_CODE = Object.fromEntries([...LEGACY_COLORS, ...LEGACY_FORMATS].map(item => [item.code, item.name]))
const LEGACY_CODE = /[&§](?:#([0-9a-fA-F]{6})|x((?:[&§][0-9a-fA-F]){6})|([0-9a-fk-orA-FK-OR]))/y

export function legacyToMiniMessage(text) {
  let output = ''
  let i = 0
  while (i < text.length) {
    const character = text[i]
    if (character === '\\' && (text[i + 1] === '<' || text[i + 1] === '\\')) {
      output += character + text[i + 1]
      i += 2
      continue
    }
    if (character === '<') {
      const end = findTagEnd(text, i)
      if (end > i) {
        output += text.slice(i, end + 1)
        i = end + 1
        continue
      }
    }
    if (character === '&' || character === '§') {
      LEGACY_CODE.lastIndex = i
      const match = LEGACY_CODE.exec(text)
      if (match) {
        const [whole, hex, bungee, code] = match
        if (hex) output += `<reset><#${hex}>`
        else if (bungee) output += `<reset><#${bungee.replace(/[&§]/g, '')}>`
        else {
          const name = LEGACY_BY_CODE[code.toLowerCase()]
          output += LEGACY_COLORS.some(item => item.name === name) ? `<reset><${name}>` : `<${name}>`
        }
        i += whole.length
        continue
      }
    }
    output += character
    i++
  }
  return output
}

export function stripLegacyColors(text) {
  return text.replace(/[&§](?:#[0-9a-fA-F]{6}|x(?:[&§][0-9a-fA-F]){6}|[0-9a-fA-F])/g, '')
}

export function plainText(chars) {
  return chars.map(item => item.ch).join('')
}

export function toLines(chars) {
  const lines = [[]]
  for (const item of chars) {
    if (item.ch === '\n') lines.push([])
    else lines.at(-1).push(item)
  }
  return lines
}

function sameStyle(a, b) {
  return a.color === b.color && a.bold === b.bold && a.italic === b.italic && a.underlined === b.underlined
    && a.strikethrough === b.strikethrough && a.obfuscated === b.obfuscated && a.hover === b.hover && a.click === b.click
    && a.insertion === b.insertion
}

export function groupRuns(chars) {
  const runs = []
  for (const item of chars) {
    const last = runs.at(-1)
    if (last && sameStyle(last.style, item)) last.text += item.ch
    else runs.push({ text: item.ch, style: item })
  }
  return runs
}

export function toJsonComponent(chars) {
  const extra = groupRuns(chars).map(({ text, style }) => {
    const part = { text }
    if (style.color) part.color = style.color
    for (const key of ['bold', 'italic', 'underlined', 'strikethrough', 'obfuscated']) if (style[key]) part[key] = true
    if (style.click) part.clickEvent = { action: style.click.action, value: style.click.value }
    if (style.hover?.action === 'show_text') part.hoverEvent = { action: 'show_text', contents: toJsonComponent(style.hover.chars) }
    if (style.insertion) part.insertion = style.insertion
    return part
  })
  return extra.length === 1 ? extra[0] : { text: '', extra }
}

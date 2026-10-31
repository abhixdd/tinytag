import { NAMED_COLORS, legacyToMiniMessage, resolveColor } from './minimessage.js'

const DECORATIONS = ['bold', 'italic', 'underlined', 'strikethrough', 'obfuscated']
const LEGACY_HINT = /[&§](?:#[0-9a-fA-F]{6}|x(?:[&§][0-9a-fA-F]){6}|[0-9a-fk-orA-FK-OR])/

function escapeText(text) {
  return text.replace(/\\/g, '\\\\').replace(/</g, '\\<')
}

function quote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function colorTag(value) {
  if (typeof value !== 'string') return null
  const key = value.toLowerCase()
  if (NAMED_COLORS[key]) return key
  const hex = resolveColor(value)
  return hex ? hex : null
}

function eventOf(component, camel, snake) {
  return component[camel] || component[snake] || null
}

function clickTag(event) {
  if (!event || typeof event.action !== 'string') return null
  const value = event.value ?? event.url ?? event.command ?? event.path ?? event.page ?? event.contents
  if (value === undefined || value === null) return null
  return `<click:${event.action}:${quote(value)}>`
}

function hoverTag(event) {
  if (!event || event.action !== 'show_text') return null
  const inner = event.contents ?? event.value ?? event.text
  if (inner === undefined) return null
  return `<hover:show_text:${quote(componentToMiniMessage(inner))}>`
}

function componentToMiniMessage(component) {
  if (component === null || component === undefined) return ''
  if (typeof component === 'string') return escapeText(component)
  if (typeof component === 'number' || typeof component === 'boolean') return escapeText(String(component))
  if (Array.isArray(component)) {
    if (!component.length) return ''
    const [first, ...rest] = component
    const head = typeof first === 'object' && first !== null && !Array.isArray(first) ? { ...first, extra: [...(first.extra || []), ...rest] } : { text: typeof first === 'string' ? first : '', extra: rest }
    return componentToMiniMessage(head)
  }
  if (typeof component !== 'object') return ''

  const opens = []
  const closes = []
  const color = colorTag(component.color)
  if (color) {
    opens.push(`<${color}>`)
    closes.unshift(`</${color}>`)
  }
  for (const name of DECORATIONS) {
    if (component[name] === true) {
      opens.push(`<${name}>`)
      closes.unshift(`</${name}>`)
    } else if (component[name] === false) opens.push(`<!${name}>`)
  }
  const click = clickTag(eventOf(component, 'clickEvent', 'click_event'))
  if (click) {
    opens.push(click)
    closes.unshift('</click>')
  }
  const hover = hoverTag(eventOf(component, 'hoverEvent', 'hover_event'))
  if (hover) {
    opens.push(hover)
    closes.unshift('</hover>')
  }
  if (typeof component.insertion === 'string' && component.insertion) {
    opens.push(`<insertion:${quote(component.insertion)}>`)
    closes.unshift('</insertion>')
  }

  let body = ''
  if (typeof component.text === 'string') body += escapeText(component.text)
  else if (typeof component.translate === 'string') body += `<lang:${component.translate}>`
  else if (typeof component.keybind === 'string') body += `<key:${component.keybind}>`
  else if (typeof component.selector === 'string') body += `<selector:${quote(component.selector)}>`
  if (Array.isArray(component.extra)) body += component.extra.map(componentToMiniMessage).join('')
  return opens.join('') + body + closes.join('')
}

export function detectFormat(input) {
  const text = input.trim()
  if (!text) return 'empty'
  if (/^[{["]/.test(text)) {
    try {
      JSON.parse(text)
      return 'json'
    } catch { }
  }
  if (LEGACY_HINT.test(text)) return 'legacy'
  return 'minimessage'
}

export function jsonToMiniMessage(input) {
  return componentToMiniMessage(JSON.parse(input))
}

function tidy(text) {
  return text.replace(/(<reset>)+/g, '<reset>').replace(/^<reset>/, '')
}

export function importText(input) {
  const format = detectFormat(input)
  if (format === 'empty') return { format, text: '' }
  if (format === 'json') {
    try {
      return { format, text: jsonToMiniMessage(input.trim()) }
    } catch {
      return { format: 'minimessage', text: input.trim() }
    }
  }
  if (format === 'legacy') return { format, text: tidy(legacyToMiniMessage(input.replace(/\r\n/g, '\n').trim())) }
  return { format, text: input.replace(/\r\n/g, '\n').trim() }
}

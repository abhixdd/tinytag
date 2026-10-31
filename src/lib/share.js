const PARAM = 's'
const MAX_TEXT = 4000

function toBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

export function encodeShare(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(state))
  return toBase64Url(bytes)
}

export function decodeShare(token) {
  try {
    const value = JSON.parse(new TextDecoder().decode(fromBase64Url(token)))
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

export function pickShared(value, { scenes, backgrounds, defaults }) {
  if (!value) return null
  const result = {}
  if (scenes.includes(value.scene)) result.scene = value.scene
  if (backgrounds.includes(value.background)) result.background = value.background
  if (typeof value.customBackground === 'string' && /^#[0-9a-f]{6}$/i.test(value.customBackground)) result.customBackground = value.customBackground
  if (typeof value.legacy === 'boolean') result.legacy = value.legacy
  if (typeof value.player === 'string') result.player = value.player.slice(0, 16)
  if (value.texts && typeof value.texts === 'object') {
    result.texts = {}
    for (const key of Object.keys(defaults)) {
      if (typeof value.texts[key] === 'string') result.texts[key] = value.texts[key].slice(0, MAX_TEXT)
    }
  }
  return Object.keys(result).length ? result : null
}

export function buildShareUrl(state, location) {
  return `${location.origin}${location.pathname}#${PARAM}=${encodeShare(state)}`
}

export function readShareHash(hash) {
  const match = new RegExp(`^#${PARAM}=([A-Za-z0-9_-]+)$`).exec(hash || '')
  return match ? decodeShare(match[1]) : null
}

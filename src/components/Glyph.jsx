import { advanceOf, shiftOf } from '../lib/glyphWidths'

export default function Glyph({ character, bold = false, underline = false, strike = false }) {
  const advance = advanceOf(character) + (bold ? 1 : 0)
  return (
    <span className="mc-glyph" style={{ width: `calc(var(--s) * ${advance})` }}>
      <span style={{ marginLeft: `calc(var(--s) * ${-shiftOf(character)})` }}>{character}</span>
      {underline && <i className="mc-line" style={{ top: 'calc(var(--s) * 8)' }} />}
      {strike && <i className="mc-line" style={{ top: 'calc(var(--s) * 4)' }} />}
    </span>
  )
}

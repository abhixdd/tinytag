import { groupRuns } from '../lib/minimessage'
import Glyph from './Glyph'
import Obfuscated from './Obfuscated'

function shadowColor(hex) {
  const value = parseInt(hex.slice(1), 16)
  return `rgb(${(value >> 16) >> 2} ${((value >> 8) & 255) >> 2} ${(value & 255) >> 2})`
}

function tokenize(chars) {
  const tokens = []
  for (const item of chars) {
    if (item.ch === '\n') tokens.push({ type: 'break', chars: [item] })
    else if (item.ch === ' ') tokens.push({ type: 'space', chars: [item] })
    else if (tokens.at(-1)?.type === 'word') tokens.at(-1).chars.push(item)
    else tokens.push({ type: 'word', chars: [item] })
  }
  return tokens
}

function Runs({ chars, color, shadow, onHover, onAction }) {
  return groupRuns(chars).map((run, index) => {
    const { style } = run
    const paint = style.color || color
    const css = {
      color: paint,
      fontWeight: style.bold ? 700 : 400,
      fontStyle: style.italic ? 'italic' : 'normal',
      '--shade': shadowColor(paint),
    }
    if (shadow) css.textShadow = 'var(--s) var(--s) 0 var(--shade)'
    if (style.click) css.cursor = 'pointer'
    const hoverable = Boolean(style.hover)
    return (
      <span
        key={index}
        style={css}
        onMouseEnter={hoverable ? event => onHover?.(style.hover, event) : undefined}
        onMouseMove={hoverable ? event => onHover?.(style.hover, event) : undefined}
        onMouseLeave={hoverable ? () => onHover?.(null) : undefined}
        onClick={style.click ? () => onAction?.(style.click) : undefined}
      >
        {style.obfuscated
          ? <Obfuscated text={run.text} bold={style.bold} underline={style.underlined} strike={style.strikethrough} />
          : Array.from(run.text).map((character, position) => (
            <Glyph key={position} character={character} bold={style.bold} underline={style.underlined} strike={style.strikethrough} />
          ))}
      </span>
    )
  })
}

export default function MCText({ chars, color = '#ffffff', shadow = true, onHover, onAction }) {
  return tokenize(chars).map((token, index) => {
    if (token.type === 'break') return <br key={index} />
    const runs = <Runs chars={token.chars} color={color} shadow={shadow} onHover={onHover} onAction={onAction} />
    return token.type === 'word' ? <span key={index} className="whitespace-nowrap">{runs}</span> : <span key={index}>{runs}</span>
  })
}

import MCText from './MCText'
import { LEGACY_COLORS, LEGACY_FORMATS, parseMiniMessage, plainChars } from '../lib/minimessage'

const COLOR_SAMPLES = Object.fromEntries(LEGACY_COLORS.map(item => [item.code, plainChars('Sample', item.hex)]))
const FORMAT_SAMPLES = Object.fromEntries(
  LEGACY_FORMATS.filter(item => item.name !== 'reset').map(item => [item.code, parseMiniMessage(`<${item.name}>Text</${item.name}>`, { base: { color: '#ffffff' } }).chars]),
)

function Sample({ chars }) {
  return (
    <span className="mc-text flex h-8 shrink-0 items-center justify-center px-2" style={{ '--s': '2px', background: '#7a7a7a', minWidth: '5.5rem' }}>
      <span><MCText chars={chars} /></span>
    </span>
  )
}

export default function CodeChart({ legacy, onInsert }) {
  const insertColor = item => (legacy ? onInsert(`&${item.code}`, '') : onInsert(`<${item.name}>`, `</${item.name}>`))
  const insertFormat = item => {
    if (item.name === 'reset') return onInsert(legacy ? '&r' : '<reset>', '')
    return legacy ? onInsert(`&${item.code}`, '') : onInsert(`<${item.name}>`, `</${item.name}>`)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-(--muted)">
        The vanilla color and format codes. Click one to add it at the cursor or around the selected text.
        {legacy ? ' Codes are added in the & form.' : ' Turn on "Read & codes" above to add the & form instead of MiniMessage tags.'}
      </p>

      <div>
        <span className="section-label mb-2 block">Colors</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LEGACY_COLORS.map(item => (
            <button key={item.code} type="button" onClick={() => insertColor(item)} className="inset flex items-center gap-3 px-2 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-(--accent-text)" title={`Insert ${item.name}`}>
              <Sample chars={COLOR_SAMPLES[item.code]} />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="font-mono text-[13px] font-bold">&amp;{item.code} <span className="font-normal text-(--muted)">§{item.code}</span></span>
                <span className="truncate text-xs text-(--label)">{item.name}</span>
                <span className="font-mono text-[11px] text-(--muted)">{item.hex}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="section-label mb-2 block">Formats</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LEGACY_FORMATS.map(item => (
            <button key={item.code} type="button" onClick={() => insertFormat(item)} className="inset flex items-center gap-3 px-2 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-(--accent-text)" title={`Insert ${item.name}`}>
              {item.name === 'reset'
                ? <span className="flex h-8 shrink-0 items-center justify-center bg-(--btn-deep) px-2 text-xs font-semibold text-white" style={{ minWidth: '5.5rem' }}>Reset</span>
                : <Sample chars={FORMAT_SAMPLES[item.code]} />}
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="font-mono text-[13px] font-bold">&amp;{item.code} <span className="font-normal text-(--muted)">§{item.code}</span></span>
                <span className="truncate text-xs text-(--label)">{item.label}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-(--muted)">
          In game, a color code clears any bold, italic or other formats before it, but a format code keeps the color. Hex colors can be written as <span className="font-mono text-white">&amp;#ff8800</span>.
        </p>
      </div>
    </div>
  )
}

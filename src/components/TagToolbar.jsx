import { NAMED_COLORS } from '../lib/minimessage'

const DECORATIONS = [
  { tag: 'bold', label: 'B', className: 'font-bold', title: 'Bold' },
  { tag: 'italic', label: 'I', className: 'italic font-bold', title: 'Italic' },
  { tag: 'underlined', label: 'U', className: 'underline font-bold', title: 'Underlined' },
  { tag: 'strikethrough', label: 'S', className: 'line-through font-bold', title: 'Strikethrough' },
  { tag: 'obfuscated', label: '?', className: 'font-bold', title: 'Obfuscated' },
]

const EXTRAS = [
  { label: 'Rainbow', open: '<rainbow>', close: '</rainbow>' },
  { label: 'Hover', open: "<hover:show_text:'Tooltip text'>", close: '</hover>' },
  { label: 'Click', open: '<click:open_url:https://example.com>', close: '</click>' },
  { label: 'New line', open: '<newline>', close: '' },
  { label: 'Reset', open: '<reset>', close: '' },
]

export default function TagToolbar({ onInsert }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <span className="section-label mb-2 block">Style</span>
        <div className="flex flex-wrap gap-2">
          {DECORATIONS.map(item => (
            <button key={item.tag} type="button" title={item.title} aria-label={item.title} onClick={() => onInsert(`<${item.tag}>`, `</${item.tag}>`)} className={`btn h-9 w-10 text-[15px] ${item.className}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="section-label mb-2 block">Colors</span>
        <div className="grid grid-cols-8 gap-1.5">
          {Object.entries(NAMED_COLORS).map(([name, hex]) => (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={`Color ${name}`}
              onClick={() => onInsert(`<${name}>`, `</${name}>`)}
              className="aspect-square rounded-[5px] border-2 border-(--edge) shadow-[0_0_0_1px_var(--border)] transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-(--accent-text)"
              style={{ background: hex }}
            />
          ))}
        </div>
      </div>
      <div>
        <span className="section-label mb-2 block">More tags</span>
        <div className="flex flex-wrap gap-2">
          {EXTRAS.map(item => (
            <button key={item.label} type="button" onClick={() => onInsert(item.open, item.close)} className="btn px-3 py-2 text-xs">
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

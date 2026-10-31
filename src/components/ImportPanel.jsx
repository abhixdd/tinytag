import { useMemo, useState } from 'react'
import { importText } from '../lib/importer'

const FORMAT_LABELS = {
  json: 'JSON component',
  legacy: 'Legacy & / § codes',
  minimessage: 'MiniMessage / plain text',
}

export default function ImportPanel({ targetLabel, onApply }) {
  const [input, setInput] = useState('')
  const result = useMemo(() => importText(input), [input])
  const ready = result.format !== 'empty' && result.text.length > 0

  function apply() {
    if (!ready) return
    onApply(result.text)
    setInput('')
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-(--muted)">
        Paste a JSON component or legacy text with <code className="text-white">&amp;</code> or <code className="text-white">§</code> codes. It is converted to MiniMessage and placed in the field you are editing.
      </p>
      <textarea
        aria-label="Text to import"
        value={input}
        onChange={event => setInput(event.target.value)}
        rows={4}
        spellCheck={false}
        placeholder={'&6&lWelcome &7to the server\n{"text":"Hi","color":"red","bold":true}'}
        className="inset block w-full resize-y px-3 py-2.5 font-mono text-sm leading-relaxed text-(--text) outline-none placeholder:text-(--muted)"
      />
      {ready && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="section-label">Detected</span>
            <span className="text-xs text-(--label)">{FORMAT_LABELS[result.format]}</span>
          </div>
          <pre aria-label="Converted MiniMessage" className="inset max-h-40 overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-(--text)">{result.text}</pre>
        </div>
      )}
      <button type="button" disabled={!ready} onClick={apply} className="btn btn-primary px-4 py-2 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-50">
        Import into {targetLabel}
      </button>
    </div>
  )
}

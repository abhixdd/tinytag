import { useEffect, useMemo, useState } from 'react'
import MCText from './MCText'
import Slider from './Slider'
import { parseMiniMessage } from '../lib/minimessage'
import { GRADIENT_PRESETS } from '../lib/presets'

const MAX_STOPS = 6

export default function GradientBuilder({ onInsert }) {
  const [stops, setStops] = useState(GRADIENT_PRESETS[0].stops)
  const [phase, setPhase] = useState(0)
  const [needsSelection, setNeedsSelection] = useState(false)

  const open = `<gradient:${stops.join(':')}${phase !== 0 ? `:${Number(phase.toFixed(2))}` : ''}>`
  const sample = useMemo(() => parseMiniMessage(`${open}Gradient preview text</gradient>`).chars, [open])
  const bar = `linear-gradient(90deg, ${stops.join(', ')})`

  useEffect(() => {
    if (!needsSelection) return
    const timer = setTimeout(() => setNeedsSelection(false), 2400)
    return () => clearTimeout(timer)
  }, [needsSelection])

  function apply() {
    setNeedsSelection(!onInsert(open, '</gradient>', { stripColors: true, requireSelection: true }))
  }

  function setStop(index, value) {
    setStops(list => list.map((item, position) => (position === index ? value : item)))
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="inset flex items-center justify-center bg-black/60 px-3 py-4 text-center">
        <span className="mc-text" style={{ '--s': '2px' }}><MCText chars={sample} /></span>
      </div>
      <div className="h-3 rounded-[3px] border-2 border-(--edge) shadow-[0_0_0_1px_var(--border)]" style={{ background: bar }} aria-hidden="true" />

      <div>
        <span className="section-label mb-2 block">Colors</span>
        <div className="flex flex-wrap items-center gap-2">
          {stops.map((color, index) => (
            <div key={index} className="relative">
              <label className="block size-9 cursor-pointer overflow-hidden rounded-[5px] border-2 border-(--edge) shadow-[0_0_0_1px_var(--border)] focus-within:outline-2 focus-within:outline-(--accent-text)" style={{ background: color }} title={color}>
                <span className="sr-only">Gradient color {index + 1}</span>
                <input type="color" value={color} onChange={event => setStop(index, event.target.value)} className="size-full cursor-pointer opacity-0" />
              </label>
              {stops.length > 2 && (
                <button
                  type="button"
                  aria-label={`Remove color ${index + 1}`}
                  onClick={() => setStops(list => list.filter((_, position) => position !== index))}
                  className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-(--btn-deep) text-[10px] leading-none text-white hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {stops.length < MAX_STOPS && (
            <button type="button" aria-label="Add a color" onClick={() => setStops(list => [...list, list.at(-1)])} className="btn size-9 text-lg">+</button>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-(--label)">Phase</span>
          <span className="font-mono text-xs">{phase.toFixed(2)}</span>
        </div>
        <Slider value={phase} min={-1} max={1} step={0.05} onChange={setPhase} label="Gradient phase" />
      </div>

      <div>
        <span className="section-label mb-2 block">Presets</span>
        <div className="flex flex-wrap gap-2">
          {GRADIENT_PRESETS.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => { setStops(preset.stops); setPhase(0) }}
              className="btn flex items-center gap-2 px-2.5 py-1.5 text-xs"
            >
              <span className="h-3 w-5 rounded-xs" style={{ background: `linear-gradient(90deg, ${preset.stops.join(', ')})` }} aria-hidden="true" />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <button
        key={needsSelection ? 'warn' : 'ready'}
        type="button"
        onClick={apply}
        aria-live="polite"
        className={`btn w-full px-4 py-2.5 text-sm font-bold ${needsSelection ? 'btn-warn animate-shake' : 'btn-primary'}`}
      >
        {needsSelection ? 'Select some text in the editor first' : 'Apply to selection'}
      </button>
      <p className="-mt-1 text-xs leading-relaxed text-(--muted)">Select text in the editor, then apply. Colors and gradients already in the selection are removed first.</p>
    </div>
  )
}

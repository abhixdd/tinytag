import { useEffect, useMemo, useRef, useState } from 'react'
import Tile from './components/Tile'
import Select from './components/Select'
import Slider from './components/Slider'
import Toggle from './components/Toggle'
import GameScreen from './components/GameScreen'
import Clouds from './components/Clouds'
import Logo from './components/Logo'
import TagToolbar from './components/TagToolbar'
import GradientBuilder from './components/GradientBuilder'
import CodeChart from './components/CodeChart'
import ImportPanel from './components/ImportPanel'
import { GithubIcon, HeartIcon } from './components/icons'
import { legacyToMiniMessage, parseMiniMessage, plainChars, plainText, stripColorTags, stripLegacyColors, toJsonComponent } from './lib/minimessage'
import { buildShareUrl, pickShared, readShareHash } from './lib/share'
import { BACKGROUND_OPTIONS, BOSS_COLOR_OPTIONS, BOSS_STYLE_OPTIONS, DEFAULT_TEXTS, MESSAGE_PRESETS, SCENES } from './lib/presets'

const STORAGE_KEY = 'tinytag:v1'
const REPO = 'https://github.com/abhixdd/tinytag'
const YEAR = new Date().getFullYear()

const BASES = { itemName: { italic: true }, itemLore: { italic: true, color: '#aa00aa' } }
const MULTILINE = new Set(['itemLore', 'sidebarLines'])
const FIELD_LABELS = Object.fromEntries(SCENES.flatMap(scene => scene.fields.map(field => [field.key, field.label])))

function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const texts = {}
    for (const key of Object.keys(DEFAULT_TEXTS)) if (typeof raw.texts?.[key] === 'string') texts[key] = raw.texts[key]
    return { scene: SCENES.some(scene => scene.id === raw.scene) ? raw.scene : 'chat', texts, legacy: raw.legacy === true }
  } catch {
    return { scene: 'chat', texts: {}, legacy: false }
  }
}

function loadShared() {
  try {
    return pickShared(readShareHash(window.location.hash), { scenes: SCENES.map(item => item.id), backgrounds: [...BACKGROUND_OPTIONS.map(item => item.id), 'custom'], defaults: DEFAULT_TEXTS })
  } catch {
    return null
  }
}

function fieldClass(extra = '') {
  return `inset block w-full px-3 py-2.5 text-sm text-(--text) outline-none placeholder:text-(--muted) ${extra}`
}

export default function App() {
  const [shared] = useState(loadShared)
  const [saved] = useState(() => {
    const base = loadSaved()
    if (!shared) return base
    return { scene: shared.scene ?? base.scene, texts: shared.texts ?? base.texts, legacy: shared.legacy ?? base.legacy }
  })
  const [scene, setScene] = useState(saved.scene)
  const [texts, setTexts] = useState({ ...DEFAULT_TEXTS, ...saved.texts })
  const [background, setBackground] = useState(shared?.background ?? 'day')
  const [customBackground, setCustomBackground] = useState(shared?.customBackground ?? '#2a2f6b')
  const [player, setPlayer] = useState(shared?.player ?? 'ABHI')
  const [showPrefix, setShowPrefix] = useState(true)
  const [showOthers, setShowOthers] = useState(true)
  const [timings, setTimings] = useState({ fadeIn: 10, stay: 70, fadeOut: 20 })
  const [replayKey, setReplayKey] = useState(0)
  const [bossColor, setBossColor] = useState('pink')
  const [bossStyle, setBossStyle] = useState('solid')
  const [bossProgress, setBossProgress] = useState(0.7)
  const [focused, setFocused] = useState(SCENES.find(item => item.id === saved.scene).fields[0].key)
  const [copied, setCopied] = useState('')
  const [panel, setPanel] = useState('tags')
  const [legacy, setLegacy] = useState(saved.legacy)
  const fieldRefs = useRef({})
  const pendingCaret = useRef(null)

  const sceneInfo = SCENES.find(item => item.id === scene)
  const panels = [
    { id: 'tags', label: 'Tags' },
    { id: 'examples', label: 'Examples' },
    { id: 'codes', label: 'Codes' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'import', label: 'Import' },
    ...(['chat', 'title', 'bossbar'].includes(scene) ? [{ id: 'options', label: 'Options' }] : []),
  ]
  const activePanel = panels.some(item => item.id === panel) ? panel : 'tags'

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ scene, texts, legacy })) } catch { }
  }, [scene, texts, legacy])

  useEffect(() => {
    if (!shared) return
    try { window.history.replaceState(null, '', window.location.pathname + window.location.search) } catch { }
  }, [shared])

  useEffect(() => {
    const caret = pendingCaret.current
    if (!caret) return
    pendingCaret.current = null
    const element = fieldRefs.current[caret.key]
    if (!element) return
    element.focus()
    element.setSelectionRange(caret.position, caret.position)
  }, [texts])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(''), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const parsed = useMemo(() => {
    const result = {}
    for (const [key, text] of Object.entries(texts)) {
      const read = line => parseMiniMessage(legacy ? legacyToMiniMessage(line) : line, { base: BASES[key] })
      result[key] = MULTILINE.has(key) ? text.split('\n').map(read) : read(text)
    }
    return result
  }, [texts, legacy])

  const prefixChars = useMemo(() => plainChars(`<${player || 'Steve'}> `), [player])

  const diagnostics = useMemo(() => {
    const found = sceneInfo.fields.flatMap(field => {
      if (!MULTILINE.has(field.key)) return parsed[field.key].diagnostics.map(item => ({ ...item, field: field.label }))
      return parsed[field.key].flatMap((line, row) => line.diagnostics.map(item => ({ ...item, field: `${field.label}, line ${row + 1}` })))
    })
    return found
  }, [parsed, sceneInfo])

  const output = useMemo(() => {
    const parts = MULTILINE.has(focused) ? parsed[focused] : [parsed[focused]]
    const plain = parts.map(part => plainText(part.chars)).join('\n')
    const components = parts.map(part => toJsonComponent(part.chars))
    return { plain, json: JSON.stringify(MULTILINE.has(focused) ? components : components[0], null, 2) }
  }, [parsed, focused])

  function setField(key, value) {
    setTexts(current => ({ ...current, [key]: value }))
  }

  function chooseScene(id) {
    setScene(id)
    setFocused(SCENES.find(item => item.id === id).fields[0].key)
  }

  function insertTag(open, close = '', { stripColors = false } = {}) {
    const element = fieldRefs.current[focused]
    if (!element) return
    const start = element.selectionStart
    const end = element.selectionEnd
    const value = texts[focused]
    const cleaned = text => (legacy ? stripLegacyColors(stripColorTags(text)) : stripColorTags(text))
    const selected = stripColors ? cleaned(value.slice(start, end)) : value.slice(start, end)
    const inserted = selected ? `${open}${selected}${close}` : `${open}${close}`
    setField(focused, `${value.slice(0, start)}${inserted}${value.slice(end)}`)
    pendingCaret.current = { key: focused, position: selected ? start + inserted.length : start + open.length }
  }

  function applyPreset(preset) {
    const key = sceneInfo.fields[0].key
    setField(key, preset.text)
    if (preset.legacy) setLegacy(true)
    setFocused(key)
  }

  function importInto(text) {
    setField(focused, MULTILINE.has(focused) ? text : text.replace(/\n/g, ' '))
    setLegacy(false)
  }

  function shareLink() {
    const changed = Object.fromEntries(Object.entries(texts).filter(([key, value]) => value !== DEFAULT_TEXTS[key]))
    copy(buildShareUrl({ scene, texts: changed, background, customBackground, legacy, player }, window.location), 'share')
  }

  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); setCopied(label) } catch { setCopied('Copy failed') }
  }

  const gameProps = {
    scene,
    background,
    customColor: customBackground,
    chat: { chars: parsed.chat.chars, prefix: showPrefix, prefixChars, others: showOthers },
    title: { title: parsed.title.chars, subtitle: parsed.subtitle.chars, timings, replayKey },
    actionbar: { chars: parsed.actionbar.chars },
    item: { name: parsed.itemName.chars, lore: parsed.itemLore.map(line => line.chars) },
    bossbar: { chars: parsed.bossbar.chars, color: bossColor, style: bossStyle, progress: bossProgress },
    sidebar: { title: parsed.sidebarTitle.chars, lines: parsed.sidebarLines.slice(0, 15).map(line => line.chars) },
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="hero-band" aria-hidden="true" />
      <div className="hero-sky" aria-hidden="true" />
      <Clouds />

      <div className="relative mx-auto max-w-310 px-4 pb-14 sm:px-6">
        <header className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-lg border-2 border-(--edge) bg-[#10131a] px-4.5 py-3 shadow-[0_0_0_1px_var(--border)]">
          <Logo size={36} />
          <span className="font-pixel text-[22px] leading-none font-bold tracking-[0.03em] [text-shadow:0_2px_0_#1a2a6b]">
            <span className="text-white">Tiny</span><span className="text-[#a8b6ff]">Tag</span>
          </span>
          <div className="flex-1" />
          <a
            href="https://ko-fi.com/abhixd"
            target="_blank"
            rel="noreferrer"
            title="Support TinyTag on Ko-fi"
            aria-label="Support TinyTag on Ko-fi"
            className="btn inline-flex h-9.5 items-center gap-2 px-3.5 text-[13px] font-bold no-underline"
          >
            <HeartIcon className="size-4 text-[#db61a2]" />
            <span className="hidden sm:inline">Support on Ko-fi</span>
          </a>
          <a href={REPO} target="_blank" rel="noreferrer" title="TinyTag on GitHub" aria-label="TinyTag on GitHub" className="btn btn-primary inline-flex h-9.5 w-10 items-center justify-center no-underline">
            <GithubIcon className="size-5" />
          </a>
        </header>

        <div className="pt-9 pb-6 sm:pt-11">
          <div className="mb-3.5 flex gap-2.5 text-[13px] text-[#dbe4ff]">
            <span>Minecraft Tools</span><span aria-hidden="true">›</span><span>MiniMessage preview</span>
          </div>
          <h1 className="m-0 font-pixel text-[34px] leading-[1.1] font-bold tracking-[0.01em] text-white [text-shadow:0_3px_0_#1a2a6b] sm:text-[46px]">TinyTag</h1>
          <p className="mt-1.5 max-w-160 text-sm text-[#e3eaff]">
            Type MiniMessage and see it the way it looks in game: chat, titles, the action bar, item lore, boss bars and scoreboards, with gradients, rainbow, hover and click.
          </p>
        </div>

        <main className="flex flex-col items-start gap-6 lg:flex-row">
          <div className="flex w-full min-w-0 flex-col gap-6 max-lg:contents lg:flex-[1_1_620px]">
            <Tile title="Game view" className="max-lg:order-1 max-lg:w-full">
              <div role="tablist" aria-label="Scene" className="mb-4 flex flex-wrap gap-1 rounded-md border-2 border-(--edge) bg-(--field) p-1 shadow-[0_0_0_1px_var(--border)]">
                {SCENES.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={scene === item.id}
                    onClick={() => chooseScene(item.id)}
                    className={`flex-1 rounded-sm px-2.5 py-1.75 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-(--accent-text) ${scene === item.id ? 'bg-(--accent) text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_0_var(--accent-deep)]' : 'text-(--label) hover:text-white'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <GameScreen {...gameProps} />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  <span className="text-xs text-(--muted)">Background</span>
                  <div className="flex max-w-full flex-wrap gap-1 rounded-md border-2 border-(--edge) bg-(--field) p-1 shadow-[0_0_0_1px_var(--border)]" role="radiogroup" aria-label="Background">
                    {BACKGROUND_OPTIONS.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={background === item.id}
                        onClick={() => setBackground(item.id)}
                        className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-(--accent-text) ${background === item.id ? 'bg-(--accent) text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_0_var(--accent-deep)]' : 'text-(--label) hover:text-white'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                    <label
                      className={`relative flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors focus-within:outline-2 focus-within:outline-(--accent-text) ${background === 'custom' ? 'bg-(--accent) text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_0_var(--accent-deep)]' : 'text-(--label) hover:text-white'}`}
                    >
                      <span className="size-3.5 rounded-[3px] border border-white/40" style={{ background: customBackground }} aria-hidden="true" />
                      Custom
                      <input
                        type="color"
                        aria-label="Custom background color"
                        value={customBackground}
                        onClick={() => setBackground('custom')}
                        onChange={event => { setCustomBackground(event.target.value); setBackground('custom') }}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={shareLink} className="btn px-4 py-2 text-[13px] font-bold" aria-live="polite">{copied === 'share' ? 'Link copied' : copied === 'Copy failed' ? 'Copy failed' : 'Copy share link'}</button>
                  {scene === 'title' && (
                    <button type="button" onClick={() => setReplayKey(value => value + 1)} className="btn btn-primary px-4 py-2 text-[13px] font-bold">Replay animation</button>
                  )}
                </div>
              </div>
              {scene === 'title' && (
                <p className="mt-3 text-xs leading-relaxed text-(--muted)">Titles are drawn four times as large as normal text and subtitles twice as large. Long ones are shrunk here to fit the screen; in game they would be cut off, so keep them short.</p>
              )}
              {scene === 'item' && (
                <p className="mt-3 text-xs leading-relaxed text-(--muted)">Custom item names and lore are <em>italic</em> in game unless you add <code className="text-white">&lt;!italic&gt;</code>. Lore is dark purple by default.</p>
              )}
              {(scene === 'chat' || scene === 'bossbar' || scene === 'sidebar') && (
                <p className="mt-3 text-xs leading-relaxed text-(--muted)">Hover text and click events work: move over hover text to see its tooltip, and click to see the action.</p>
              )}
            </Tile>

            <Tile
              className="max-lg:order-3 max-lg:w-full"
              title="Output"
              trailing={<span className="text-xs text-(--muted)">{FIELD_LABELS[focused]}</span>}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="section-label">Plain text</span>
                    <button type="button" onClick={() => copy(output.plain, 'plain')} className="btn px-3 py-1.5 text-xs">{copied === 'plain' ? 'Copied' : 'Copy'}</button>
                  </div>
                  <pre className="inset h-36 overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-(--text)">{output.plain || ' '}</pre>
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="section-label">JSON component</span>
                    <button type="button" onClick={() => copy(output.json, 'json')} className="btn px-3 py-1.5 text-xs">{copied === 'json' ? 'Copied' : 'Copy'}</button>
                  </div>
                  <pre className="inset h-36 overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed whitespace-pre text-(--text)">{output.json}</pre>
                </div>
              </div>
              <div className="mt-4">
                <span className="section-label mb-2 block">Warnings</span>
                {diagnostics.length === 0 ? (
                  <p className="text-xs text-(--muted)">No problems found.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {diagnostics.map((item, index) => (
                      <li key={index} className="inset flex items-start gap-2 px-3 py-2 text-xs leading-relaxed">
                        <span><span className="text-(--muted)">{item.field}:</span> {item.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Tile>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-6 max-lg:contents lg:max-w-115 lg:flex-[1_1_380px]">
            <Tile
              title="Editor"
              className="max-lg:order-2 max-lg:w-full"
              trailing={
                <label className="flex items-center gap-2 text-xs text-(--label)">
                  Read &amp; codes
                  <Toggle checked={legacy} onChange={setLegacy} label="Also read legacy & and § color codes" />
                </label>
              }
            >
              <div className="flex flex-col gap-4">
                {sceneInfo.fields.map(field => (
                  <div key={field.key}>
                    <label htmlFor={`field-${field.key}`} className="section-label mb-2 block">{field.label}</label>
                    <textarea
                      id={`field-${field.key}`}
                      ref={element => { fieldRefs.current[field.key] = element }}
                      value={texts[field.key]}
                      onChange={event => setField(field.key, event.target.value)}
                      onFocus={() => setFocused(field.key)}
                      rows={field.rows}
                      spellCheck={false}
                      className={fieldClass(`resize-y font-mono leading-relaxed ${focused === field.key ? 'shadow-[0_0_0_1px_var(--accent-text)]' : ''}`)}
                    />
                  </div>
                ))}
              </div>

              <div role="tablist" aria-label="Editor tools" className="mt-5 mb-4 flex flex-wrap gap-1 rounded-md border-2 border-(--edge) bg-(--field) p-1 shadow-[0_0_0_1px_var(--border)]">
                {panels.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`tool-${item.id}`}
                    aria-selected={activePanel === item.id}
                    aria-controls={`tool-panel-${item.id}`}
                    onClick={() => setPanel(item.id)}
                    className={`flex-1 rounded-sm px-1.5 py-1.75 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-(--accent-text) sm:px-2 ${activePanel === item.id ? 'bg-(--accent) text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_2px_0_var(--accent-deep)]' : 'text-(--label) hover:text-white'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div role="tabpanel" id={`tool-panel-${activePanel}`} aria-labelledby={`tool-${activePanel}`} className="animate-fade-in">
                {activePanel === 'tags' && <TagToolbar onInsert={insertTag} />}
                {activePanel === 'codes' && <CodeChart legacy={legacy} onInsert={insertTag} />}
                {activePanel === 'gradient' && <GradientBuilder onInsert={insertTag} />}
                {activePanel === 'import' && <ImportPanel targetLabel={FIELD_LABELS[focused]} onApply={importInto} />}
                {activePanel === 'examples' && (
                  <div className="flex flex-wrap gap-2">
                    {MESSAGE_PRESETS.map(preset => (
                      <button key={preset.name} type="button" onClick={() => applyPreset(preset)} className="btn px-3 py-2 text-xs">{preset.name}</button>
                    ))}
                  </div>
                )}
                {activePanel === 'options' && (
                  <div className="flex flex-col gap-4">
                {scene === 'chat' && (
                  <div className="flex flex-col gap-3">
                    <div className="inset flex items-center justify-between px-3 py-2">
                      <span className="text-sm">Show player name</span>
                      <Toggle checked={showPrefix} onChange={setShowPrefix} label="Show the player name before the message" />
                    </div>
                    {showPrefix && (
                      <input type="text" aria-label="Player name" value={player} maxLength={16} onChange={event => setPlayer(event.target.value)} className={fieldClass('font-mono')} placeholder="Steve" />
                    )}
                    <div className="inset flex items-center justify-between px-3 py-2">
                      <span className="text-sm">Show other chat lines</span>
                      <Toggle checked={showOthers} onChange={setShowOthers} label="Show other chat lines" />
                    </div>
                  </div>
                )}

                {scene === 'title' && (
                  <div>
                    <span className="section-label mb-2 block">Timings (ticks)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[['fadeIn', 'Fade in'], ['stay', 'Stay'], ['fadeOut', 'Fade out']].map(([key, label]) => (
                        <label key={key} className="flex flex-col gap-1 text-xs text-(--label)">
                          {label}
                          <input
                            type="number"
                            min={0}
                            max={1200}
                            value={timings[key]}
                            onChange={event => setTimings(current => ({ ...current, [key]: Math.max(0, Math.min(1200, Number(event.target.value) || 0)) }))}
                            className={fieldClass('font-mono')}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {scene === 'bossbar' && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Select label="Boss bar color" value={bossColor} onChange={setBossColor} options={BOSS_COLOR_OPTIONS} />
                      <Select label="Boss bar style" value={bossStyle} onChange={setBossStyle} options={BOSS_STYLE_OPTIONS} />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-(--label)">Progress</span>
                        <span className="font-mono text-xs">{Math.round(bossProgress * 100)}%</span>
                      </div>
                      <Slider value={bossProgress} min={0} max={1} step={0.01} onChange={setBossProgress} label="Boss bar progress" />
                    </div>
                  </div>
                )}
                  </div>
                )}
              </div>
            </Tile>
          </div>
        </main>

        <footer className="mt-12">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border-2 border-(--edge) bg-[#10131a] px-4.5 py-3 shadow-[0_0_0_1px_var(--border)]">
            <Logo size={30} />
            <div className="flex flex-col leading-tight">
              <span className="font-pixel text-base font-bold tracking-[0.03em]">TinyTag</span>
              <span className="text-xs text-(--muted)">MiniMessage preview for Minecraft</span>
            </div>
            <div className="flex-1" />
            <span className="text-[13px] text-(--muted)">Made by <a href="https://github.com/abhixdd" target="_blank" rel="noreferrer" className="font-semibold text-(--text) underline-offset-2 hover:text-(--accent-text) hover:underline">ABHI</a></span>
            <a href="https://ko-fi.com/abhixd" target="_blank" rel="noreferrer" className="btn inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-bold no-underline">
              <HeartIcon className="size-4 text-[#db61a2]" />
              Support on Ko-fi
            </a>
            <a href={REPO} target="_blank" rel="noreferrer" className="btn btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-bold no-underline">
              <GithubIcon className="size-4" />
              Source on GitHub
            </a>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-(--muted)">
            © {YEAR} ABHI · Unofficial fan tool, not affiliated with Mojang, Microsoft or the Adventure project · Open source under{' '}
            <a href={REPO} target="_blank" rel="noreferrer" className="text-(--accent-text) underline-offset-2 hover:text-white hover:underline">AGPL-3.0</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

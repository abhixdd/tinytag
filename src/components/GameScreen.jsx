import { useEffect, useMemo, useRef, useState } from 'react'
import MCText from './MCText'
import Hud from './Hud'
import { parseMiniMessage, plainChars, toLines } from '../lib/minimessage'
import { textWidth } from '../lib/glyphWidths'
import { drawWorld, fillWorld } from '../lib/world'

const SCREEN_W = 320
const SCREEN_H = 180
const g = n => `calc(var(--g) * ${n})`
const size = factor => (factor === 1 ? 'var(--g)' : `calc(var(--g) * ${factor})`)

const BOSS_COLORS = {
  pink: '#f26bd6',
  blue: '#4aa8ff',
  red: '#e8403f',
  green: '#4fd45a',
  yellow: '#f2d64a',
  purple: '#a456f0',
  white: '#ececec',
}
const BOSS_SEGMENTS = { solid: 0, notched_6: 6, notched_10: 10, notched_12: 12, notched_20: 20 }

const FILLER_CHAT = [
  parseMiniMessage('<yellow>Steve joined the game').chars,
  parseMiniMessage('\\<Steve> anyone seen my pickaxe?').chars,
  parseMiniMessage('\\<ABHI> check the chest by spawn').chars,
]

const TOOLTIP_BACKGROUND = {
  border: `${g(1)} solid transparent`,
  background: 'linear-gradient(#100010f0, #100010f0) padding-box, linear-gradient(#5000ff80, #28007f80) border-box',
  boxShadow: `0 0 0 ${g(1)} #100010f0`,
}

function fitScale(chars, wanted) {
  const width = textWidth(chars)
  if (!width) return wanted
  return Math.max(0.5, Math.min(wanted, Math.floor(((SCREEN_W - 8) / width) * 2) / 2))
}

function Text({ chars, scale = 1, color, ...handlers }) {
  return (
    <span className="mc-text" style={{ '--s': size(scale) }}>
      <MCText chars={chars} color={color} {...handlers} />
    </span>
  )
}

function Tooltip({ hover, x, y, width }) {
  const lines = hover.action === 'show_text' ? toLines(hover.chars) : [plainChars(`${hover.action.replaceAll('_', ' ')}: ${hover.text}`)]
  const flip = x > width * 0.6
  return (
    <div
      className="pointer-events-none absolute z-30 whitespace-nowrap"
      style={{ left: x, top: y, transform: `translate(${flip ? `calc(-100% - ${g(8)})` : g(8)}, ${g(-12)})`, padding: g(3), ...TOOLTIP_BACKGROUND }}
    >
      {lines.map((line, index) => (
        <div key={index} style={{ minHeight: g(10) }}><Text chars={line} /></div>
      ))}
    </div>
  )
}

function ChatScene({ data, handlers }) {
  const lineStyle = { width: g(324), padding: `0 ${g(2)}`, background: 'rgb(0 0 0 / 0.5)' }
  return (
    <>
      <div className="absolute left-0 flex flex-col" style={{ bottom: g(40) }}>
        {data.others && FILLER_CHAT.map((chars, index) => (
          <div key={index} style={lineStyle}><Text chars={chars} /></div>
        ))}
        <div style={lineStyle}>
          {data.prefix && <Text chars={data.prefixChars} />}
          <Text chars={data.chars} {...handlers} />
        </div>
      </div>
      <div className="absolute" style={{ left: g(2), right: g(2), bottom: g(2), height: g(12), padding: `${g(2)} ${g(2)}`, background: 'rgb(0 0 0 / 0.5)' }}>
        <span className="animate-pulse"><Text chars={plainChars('_')} /></span>
      </div>
    </>
  )
}

function TitleScene({ data }) {
  const box = useRef(null)
  const { fadeIn, stay, fadeOut } = data.timings
  useEffect(() => {
    if (!data.replayKey || !box.current) return
    const total = Math.max(1, fadeIn + stay + fadeOut)
    box.current.animate(
      [{ opacity: 0 }, { opacity: 1, offset: fadeIn / total }, { opacity: 1, offset: (fadeIn + stay) / total }, { opacity: 0 }],
      { duration: total * 50, easing: 'linear' },
    )
  }, [data.replayKey, fadeIn, stay, fadeOut])
  return (
    <div ref={box} className="pointer-events-none absolute inset-0 text-center">
      <div className="absolute inset-x-0 flex justify-center" style={{ top: g(SCREEN_H / 2 - 40) }}>
        <div className="shrink-0 whitespace-nowrap"><Text chars={data.title} scale={fitScale(data.title, 4)} /></div>
      </div>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: g(SCREEN_H / 2 + 10) }}>
        <div className="shrink-0 whitespace-nowrap"><Text chars={data.subtitle} scale={fitScale(data.subtitle, 2)} /></div>
      </div>
    </div>
  )
}

function ActionbarScene({ data, handlers }) {
  return (
    <div className="absolute inset-x-0 text-center" style={{ top: g(106), padding: `0 ${g(6)}` }}>
      <Text chars={data.chars} {...handlers} />
    </div>
  )
}

function ItemScene({ data, handlers }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(#c0101010, #d0101010)' }} />
      <div className="absolute top-1/2 left-1/2 whitespace-nowrap" style={{ transform: 'translate(-50%, -50%)', padding: g(3), ...TOOLTIP_BACKGROUND }}>
        <div style={{ minHeight: g(12) }}><Text chars={data.name} {...handlers} /></div>
        {data.lore.map((line, index) => (
          <div key={index} style={{ minHeight: g(10) }}><Text chars={line} {...handlers} /></div>
        ))}
      </div>
    </>
  )
}

function BossbarScene({ data, handlers }) {
  const segments = BOSS_SEGMENTS[data.style] || 0
  const color = BOSS_COLORS[data.color] || BOSS_COLORS.pink
  return (
    <div className="absolute left-1/2 text-center" style={{ top: g(2), width: g(182), transform: 'translateX(-50%)' }}>
      <div style={{ minHeight: g(10) }}><Text chars={data.chars} {...handlers} /></div>
      <div className="relative" style={{ height: g(5), background: `color-mix(in srgb, ${color} 28%, #000)`, boxShadow: `0 0 0 ${g(1)} #000` }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${Math.round(data.progress * 100)}%`, background: color }}>
          <div className="absolute inset-x-0 top-0 bg-white/40" style={{ height: g(1) }} />
        </div>
        {segments > 0 && Array.from({ length: segments - 1 }, (_, index) => (
          <div key={index} className="absolute inset-y-0 bg-black/80" style={{ left: `${((index + 1) / segments) * 100}%`, width: g(1) }} />
        ))}
      </div>
    </div>
  )
}

function SidebarScene({ data, handlers }) {
  return (
    <div className="absolute top-1/2 flex flex-col" style={{ right: g(3), transform: 'translateY(-50%)', minWidth: g(60), maxWidth: g(190) }}>
      <div className="text-center" style={{ padding: `0 ${g(2)}`, background: 'rgb(0 0 0 / 0.4)' }}>
        <Text chars={data.title} {...handlers} />
      </div>
      {data.lines.map((line, index) => (
        <div key={index} className="flex items-start justify-between" style={{ padding: `0 ${g(2)}`, gap: g(8), background: 'rgb(0 0 0 / 0.3)', minHeight: g(9) }}>
          <span><Text chars={line} {...handlers} /></span>
          <Text chars={plainChars(String(data.lines.length - index), '#ff5555')} />
        </div>
      ))}
    </div>
  )
}

export default function GameScreen({ scene, background, customColor, chat, title, actionbar, item, bossbar, sidebar }) {
  const holder = useRef(null)
  const screen = useRef(null)
  const canvas = useRef(null)
  const [scale, setScale] = useState(2)
  const [tip, setTip] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width
      setScale(width >= SCREEN_W * 2 ? Math.min(3, Math.floor(width / SCREEN_W)) : Math.max(1, Math.round((width / SCREEN_W) * 100) / 100))
    })
    observer.observe(holder.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (background === 'custom') fillWorld(canvas.current, customColor)
    else drawWorld(canvas.current, background)
  }, [background, customColor])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const handlers = useMemo(() => ({
    onHover(hover, event) {
      if (!hover) { setTip(null); return }
      const box = screen.current.getBoundingClientRect()
      setTip({ hover, x: event.clientX - box.left, y: event.clientY - box.top, width: box.width })
    },
    onAction(click) {
      setToast(`Click: ${click.action.replaceAll('_', ' ')}${click.value ? ` "${click.value}"` : ''}`)
    },
  }), [])

  const plain = background === 'black' || background === 'custom'

  return (
    <div ref={holder} className="flex w-full justify-center">
      <div
        ref={screen}
        data-game-screen=""
        className="relative overflow-hidden rounded-md border-2 border-(--edge) shadow-[0_0_0_1px_var(--border)] select-none"
        style={{ '--g': `${scale}px`, width: `${SCREEN_W * scale}px`, height: `${SCREEN_H * scale}px`, boxSizing: 'content-box', lineHeight: 0 }}
      >
        <canvas ref={canvas} className="absolute inset-0 size-full [image-rendering:pixelated]" aria-hidden="true" />
        {scene !== 'item' && !plain && <Hud crosshair={background !== 'dark'} />}
        {scene === 'chat' && <ChatScene data={chat} handlers={handlers} />}
        {scene === 'title' && <TitleScene data={title} />}
        {scene === 'actionbar' && <ActionbarScene data={actionbar} handlers={handlers} />}
        {scene === 'item' && <ItemScene data={item} handlers={handlers} />}
        {scene === 'bossbar' && <BossbarScene data={bossbar} handlers={handlers} />}
        {scene === 'sidebar' && <SidebarScene data={sidebar} handlers={handlers} />}
        {tip && <Tooltip {...tip} />}
        {toast && (
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2" style={{ top: g(4), padding: `${g(2)} ${g(5)}`, background: 'rgb(0 0 0 / 0.7)', border: `${g(1)} solid rgb(255 255 255 / 0.3)` }}>
            <Text chars={plainChars(toast)} />
          </div>
        )}
      </div>
    </div>
  )
}

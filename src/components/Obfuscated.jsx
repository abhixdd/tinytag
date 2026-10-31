import { useEffect, useState } from 'react'
import Glyph from './Glyph'
import { advanceOf, lookAlikes } from '../lib/glyphWidths'

export default function Obfuscated({ text, bold = false, underline = false, strike = false }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(value => (value + 1) % 100000), 70)
    return () => clearInterval(timer)
  }, [])

  return Array.from(text).map((character, index) => {
    if (advanceOf(character) === 4 && character === ' ') return <Glyph key={index} character=" " bold={bold} />
    const options = lookAlikes(character)
    const hash = (Math.imul(tick + 1, 2654435761) ^ Math.imul(index + 7, 40503)) >>> 0
    return <Glyph key={index} character={options[hash % options.length]} bold={bold} underline={underline} strike={strike} />
  })
}

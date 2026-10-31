const HEART = [
  '.kkk.kkk.',
  'kRRRkRRRk',
  'kRHRRRRRk',
  'kRRRRRRRk',
  'kRRRRRRRk',
  '.kRRRRRk.',
  '..kRRRk..',
  '...kRk...',
  '....k....',
]
const HEART_COLORS = { k: '#000000', R: '#e8171a', H: '#ffb4b4' }

const FOOD = [
  '.....kkk.',
  '....kBBBk',
  '...kBLBBk',
  '..kBBBBBk',
  '.kBBBBBk.',
  'kWkBBBk..',
  'kWWkkk...',
  '.kWWk....',
  '..kk.....',
]
const FOOD_COLORS = { k: '#2a1405', B: '#c46a1e', L: '#f0a85a', W: '#f3f3f3' }

function Pixels({ art, colors, x, y }) {
  const rows = []
  art.forEach((row, rowIndex) => {
    let column = 0
    while (column < row.length) {
      const key = row[column]
      if (key === '.') { column++; continue }
      let end = column
      while (end < row.length && row[end] === key) end++
      rows.push(<rect key={`${rowIndex}-${column}`} x={x + column} y={y + rowIndex} width={end - column} height={1} fill={colors[key]} />)
      column = end
    }
  })
  return <>{rows}</>
}

const LEFT = 69

export default function Hud({ crosshair = true }) {
  return (
    <svg viewBox="0 0 320 180" className="pointer-events-none absolute inset-0 size-full" shapeRendering="crispEdges" aria-hidden="true">
      {crosshair && (
        <g fill="#ffffff" style={{ mixBlendMode: 'difference' }}>
          <rect x="155" y="90" width="11" height="1" />
          <rect x="160" y="85" width="1" height="11" />
        </g>
      )}

      {Array.from({ length: 10 }, (_, index) => <Pixels key={`h${index}`} art={HEART} colors={HEART_COLORS} x={LEFT + index * 8} y={141} />)}
      {Array.from({ length: 10 }, (_, index) => <Pixels key={`f${index}`} art={FOOD} colors={FOOD_COLORS} x={LEFT + 182 - 9 - index * 8} y={141} />)}

      <rect x={LEFT} y="151" width="182" height="5" fill="#000000" />
      <rect x={LEFT + 1} y="152" width="180" height="3" fill="#3d3d3d" />
      <rect x={LEFT + 1} y="152" width="76" height="3" fill="#7efc20" />
      <rect x={LEFT + 1} y="152" width="76" height="1" fill="#b9ff72" />

      <rect x={LEFT} y="158" width="182" height="22" fill="#000000" opacity="0.55" />
      {Array.from({ length: 9 }, (_, index) => {
        const x = LEFT + 1 + index * 20
        return (
          <g key={index}>
            <rect x={x} y="159" width="20" height="20" fill="#8b8b8b" opacity="0.4" />
            <rect x={x} y="159" width="20" height="1" fill="#373737" opacity="0.9" />
            <rect x={x} y="159" width="1" height="20" fill="#373737" opacity="0.9" />
            <rect x={x} y="178" width="20" height="1" fill="#ffffff" opacity="0.4" />
            <rect x={x + 19} y="159" width="1" height="20" fill="#ffffff" opacity="0.4" />
          </g>
        )
      })}
      <rect x={LEFT - 1} y="157" width="24" height="24" fill="none" stroke="#000000" strokeWidth="1" />
      <rect x={LEFT} y="158" width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="2" />
    </svg>
  )
}

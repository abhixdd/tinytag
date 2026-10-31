import { segmentText } from '../lib/issues'

const STYLES = {
  warning: { textDecoration: 'underline wavy #ffb86b', textDecorationThickness: '1.5px', textDecorationSkipInk: 'none', textUnderlineOffset: '3px' },
  info: { textDecoration: 'underline dotted #8fa2ff', textDecorationThickness: '1.5px', textDecorationSkipInk: 'none', textUnderlineOffset: '3px' },
}

export default function IssueMarks({ text, ranges, scrollTop }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden border-2 border-transparent px-3 py-2.5 font-mono text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-transparent scrollbar-gutter-stable"
    >
      <div style={{ transform: `translateY(${-scrollTop}px)` }}>
        {segmentText(text, ranges).map((segment, index) => (
          <span key={index} style={segment.level ? STYLES[segment.level] : undefined}>{segment.text}</span>
        ))}
        {text.endsWith('\n') ? ' ' : ''}
      </div>
    </div>
  )
}

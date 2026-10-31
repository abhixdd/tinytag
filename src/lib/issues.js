const RANK = { info: 0, warning: 1 }

function tagEnd(text, start) {
  if (text[start] !== '<') return Math.min(text.length, start + 1)
  let quote = null
  for (let i = start + 1; i < text.length; i++) {
    const character = text[i]
    if (quote) {
      if (character === '\\') i++
      else if (character === quote) quote = null
    } else if ((character === "'" || character === '"') && text[i - 1] === ':') quote = character
    else if (character === '>') return i + 1
    else if (character === '<') return i
  }
  return text.length
}

export function issueRanges(text, issues, offset = 0) {
  const ranges = []
  for (const issue of issues) {
    const start = offset + issue.index
    if (!Number.isInteger(issue.index) || start < 0 || start >= offset + text.length) continue
    ranges.push({ start, end: offset + tagEnd(text, issue.index), level: issue.level })
  }
  return ranges.sort((a, b) => a.start - b.start || b.end - a.end)
}

export function mergeRanges(ranges) {
  const merged = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (last && range.start < last.end) {
      last.end = Math.max(last.end, range.end)
      if (RANK[range.level] > RANK[last.level]) last.level = range.level
    } else merged.push({ ...range })
  }
  return merged
}

export function segmentText(text, ranges) {
  const segments = []
  let cursor = 0
  for (const range of mergeRanges(ranges)) {
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start), level: null })
    segments.push({ text: text.slice(range.start, range.end), level: range.level })
    cursor = range.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), level: null })
  return segments
}

export function collectIssues(text, parsed, { multiline, legacy }) {
  if (!multiline) {
    const items = parsed.diagnostics.map(item => ({ level: item.level, message: item.message, line: null }))
    const ranges = legacy ? [] : issueRanges(text, parsed.diagnostics)
    return { items, ranges }
  }
  const lines = text.split('\n')
  const items = []
  const ranges = []
  let offset = 0
  parsed.forEach((line, row) => {
    for (const item of line.diagnostics) items.push({ level: item.level, message: item.message, line: row + 1 })
    if (!legacy) ranges.push(...issueRanges(lines[row] ?? '', line.diagnostics, offset))
    offset += (lines[row] ?? '').length + 1
  })
  return { items, ranges }
}

// Analyze the corrupt session log: walk zstd frames, decompress each, then
// detect seq discontinuities. Frame scanner mirrors the DSH bundled runtime.
import { readFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

const ZSTD_MAGIC = 4247762216 // 0xFD2FB528

function scanZstdFrames(buffer) {
  const frames = []
  let offset = 0
  while (offset < buffer.length) {
    const start = offset
    if (buffer.length - offset < 4) return { frames, tornStart: start }
    if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error(`invalid frame magic at byte ${offset}`)
    offset += 4
    if (offset === buffer.length) return { frames, tornStart: start }
    const descriptor = buffer.readUInt8(offset)
    offset += 1
    if ((descriptor & 24) !== 0) throw new Error(`reserved frame-header bit at byte ${offset - 1}`)
    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 32) !== 0
    const checksum = (descriptor & 4) !== 0
    const dictionaryFlag = descriptor & 3
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag
    const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    if (buffer.length - offset < remainingHeaderBytes) return { frames, tornStart: start }
    offset += remainingHeaderBytes
    for (;;) {
      if (buffer.length - offset < 3) return { frames, tornStart: start }
      const blockHeader = buffer.readUIntLE(offset, 3)
      offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 3
      const blockSize = blockHeader >>> 3
      if (blockType === 3) throw new Error(`reserved block type at byte ${offset - 3}`)
      const payloadBytes = blockType === 1 ? 1 : blockSize
      if (buffer.length - offset < payloadBytes) return { frames, tornStart: start }
      offset += payloadBytes
      if (lastBlock) break
    }
    if (checksum) {
      if (buffer.length - offset < 4) return { frames, tornStart: start }
      offset += 4
    }
    frames.push({ start, end: offset })
  }
  return { frames }
}

const path = process.argv[2]
const raw = readFileSync(path)
const { frames, tornStart } = scanZstdFrames(raw)
console.log(`frames: ${frames.length}${tornStart !== undefined ? `, torn frame starts at byte ${tornStart}` : ''}`)

const parts = []
for (let i = 0; i < frames.length; i++) {
  const f = frames[i]
  try {
    parts.push(zstdDecompressSync(raw.subarray(f.start, f.end)).toString('utf8'))
  } catch (e) {
    console.error(`frame ${i} (${f.start}..${f.end}) decompress failed: ${e.message}`)
    process.exit(1)
  }
}
const text = parts.join('')
const lines = text.split('\n').filter((l) => l.trim().length > 0)
console.log(`total logical lines: ${lines.length}`)

function seqOf(line) {
  try {
    const obj = JSON.parse(line)
    return typeof obj.seq === 'number' ? obj.seq : null
  } catch {
    return null
  }
}

let prev = -1
const gaps = []
let regionStart = 1
let regionLastSeq = -1
const regions = []
for (let i = 0; i < lines.length; i++) {
  const s = seqOf(lines[i])
  if (s === null) continue
  if (prev >= 0 && s !== prev + 1) {
    gaps.push({ line: i + 1, expected: prev + 1, got: s })
    regions.push([regionStart, i, prev])
    regionStart = i + 1
  }
  prev = s
}
regions.push([regionStart, lines.length, prev])

console.log(`\nseq discontinuities: ${gaps.length}`)
for (const g of gaps.slice(0, 10)) {
  console.log(`  line ${g.line}: expected ${g.expected}, got ${g.got}`)
}
console.log('\nregions (lineStart..lineEnd, lastSeq):')
for (const [a, b, last] of regions) {
  console.log(`  lines ${a}..${b} (${b - a + 1} lines), last seq ${last}`)
}

// Sample lines around the first gap
if (gaps.length > 0) {
  const g = gaps[0]
  console.log(`\naround first gap (line ${g.line}):`)
  for (let i = g.line - 3; i <= g.line + 2; i++) {
    if (i < 1 || i > lines.length) continue
    const s = seqOf(lines[i - 1])
    console.log(`  line ${i}: seq=${s} ${lines[i - 1].slice(0, 150)}`)
  }
}

// Last 3 lines
console.log('\nlast 3 lines:')
for (const l of lines.slice(-3)) {
  try {
    const o = JSON.parse(l)
    console.log(`  seq=${o.seq} type=${o.type} ${l.slice(0, 140)}`)
  } catch {
    console.log(`  (unparsable) ${l.slice(0, 140)}`)
  }
}

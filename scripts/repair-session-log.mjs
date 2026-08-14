// Repair a corrupt DSH session log using the exact storage-row semantics of
// the bundled runtime (decodeStorageRecord mirror): plain events carry `seq`,
// packed chunk rows (text-chunks / reasoning-chunks / tool-call-chunks) carry
// `seq0` and expand to members = payload.length (= dt.length + 1) events.
//
// The file currently holds two divergent seq regions (A: 0..X, then B: Y..Z
// with Y <= X). The live harness writes region B's tail, so the repaired file
// = A-prefix (through Y-1) + B (Y..Z), contiguous 0..Z, staying in sync with
// the live writer's counter.
//
// Usage: node repair-session-log.mjs <path-to-session.jsonl.zstd>
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { zstdCompressSync, zstdDecompressSync, constants } from 'node:zlib'

const ZSTD_MAGIC = 4247762216
const CHECKSUM = { params: { [constants.ZSTD_c_checksumFlag]: 1 } }

function scanZstdFrames(buffer) {
  const frames = []
  let offset = 0
  while (offset < buffer.length) {
    const start = offset
    if (buffer.length - offset < 4) return { frames, tornStart: start }
    if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error('invalid frame magic')
    offset += 4
    if (offset === buffer.length) return { frames, tornStart: start }
    const descriptor = buffer.readUInt8(offset); offset += 1
    if ((descriptor & 24) !== 0) throw new Error('reserved frame-header bit')
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
      const blockHeader = buffer.readUIntLE(offset, 3); offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 3
      const blockSize = blockHeader >>> 3
      if (blockType === 3) throw new Error('reserved block type')
      const payloadBytes = blockType === 1 ? 1 : blockSize
      if (buffer.length - offset < payloadBytes) return { frames, tornStart: start }
      offset += payloadBytes
      if (lastBlock) break
    }
    if (checksum) { if (buffer.length - offset < 4) return { frames, tornStart: start }; offset += 4 }
    frames.push({ start, end: offset })
  }
  return { frames }
}

function decode(path) {
  const raw = readFileSync(path)
  const { frames } = scanZstdFrames(raw)
  const parts = frames.map((f) => zstdDecompressSync(raw.subarray(f.start, f.end)).toString('utf8'))
  return parts.join('').split('\n').filter((l) => l.trim().length > 0)
}

// Expand one storage line into its events (mirror of decodeStorageRecord).
function decodeLine(line) {
  const value = JSON.parse(line)
  const tag = value.type
  if (tag !== 'text-chunks' && tag !== 'reasoning-chunks' && tag !== 'tool-call-chunks') {
    return [value]
  }
  const members = tag === 'tool-call-chunks' ? value.data.args : value.data.texts
  const events = []
  for (let k = 0; k < members.length; k++) {
    events.push({ ...value, seq: value.seq0 + k })
  }
  return events
}

// Exact scanner semantics of the bundled reader: per decoded event,
// event.seq must equal the running event count. Line 0 is the session header.
function checkContiguous(lines) {
  let count = 0
  for (let i = 1; i < lines.length; i++) {
    let decoded
    try { decoded = decodeLine(lines[i]) } catch { return { ok: false, reason: `unparsable line ${i + 1}` } }
    for (const event of decoded) {
      if (event.seq !== count) return { ok: false, badLine: i + 1, expected: count, got: event.seq }
      count += 1
    }
  }
  return { ok: true, count }
}

function encode(lines) {
  const headerFrame = zstdCompressSync(Buffer.from(lines[0] + '\n', 'utf8'), CHECKSUM)
  const bodyFrame = zstdCompressSync(Buffer.from(lines.slice(1).join('\n') + '\n', 'utf8'), CHECKSUM)
  return Buffer.concat([headerFrame, bodyFrame])
}

const path = process.argv[2]
const tmp = path + '.repairing'

for (let attempt = 1; attempt <= 6; attempt++) {
  console.log(`attempt ${attempt}: reading ${path}`)
  const lines = decode(path)

  // Find the first seq discontinuity (skip the session header at line 0).
  let gapIndex = -1
  let count = 0
  for (let i = 1; i < lines.length; i++) {
    const decoded = decodeLine(lines[i])
    for (const event of decoded) {
      if (event.seq !== count) { gapIndex = i; break }
      count += 1
    }
    if (gapIndex !== -1) break
  }
  if (gapIndex === -1) {
    console.log(`log is already contiguous (0..${count - 1}) — nothing to repair`)
    process.exit(0)
  }

  // Verify the boundary: B starts at bFirst; A must contain seq bFirst-1.
  const bFirst = decodeLine(lines[gapIndex])[0].seq
  console.log(`gap found: line ${gapIndex + 1} expected ${count}, got ${bFirst}`)

  // Cut A at the first line whose events reach seq bFirst (drop A's tail).
  let cut = -1
  let aCount = 0
  for (let i = 1; i < gapIndex; i++) {
    const decoded = decodeLine(lines[i])
    const next = aCount + decoded.length
    if (next > bFirst) { cut = i; break }
    aCount = next
  }
  if (cut === -1) {
    console.error(`cannot merge: A never reaches seq ${bFirst}`)
    process.exit(1)
  }
  const aLast = bFirst - 1
  console.log(`A-prefix keeps seqs 0..${aLast} (cut at line ${cut}), B spans ${bFirst}..`)

  const merged = [...lines.slice(0, cut), ...lines.slice(gapIndex)]
  const check = checkContiguous(merged)
  if (!check.ok) {
    console.error(`merged log still broken at line ${check.badLine}: expected ${check.expected}, got ${check.got}`)
    process.exit(1)
  }
  const lastSeq = check.count - 1
  console.log(`merged: A 0..${aLast} + B ${bFirst}..${lastSeq} (${merged.length} lines)`)

  writeFileSync(tmp, encode(merged))
  renameSync(tmp, path)
  console.log('replaced')

  // Verify the replaced file and detect appends that landed mid-repair.
  const after = decode(path)
  const afterCheck = checkContiguous(after)
  if (afterCheck.ok && afterCheck.count - 1 === lastSeq) {
    console.log(`verified: contiguous 0..${lastSeq}`)
    process.exit(0)
  }
  if (afterCheck.ok && afterCheck.count - 1 > lastSeq) {
    console.log(`live writer appended ${lastSeq + 1}..${afterCheck.count - 1} during repair — retrying`)
    continue
  }
  console.log(`verification failed (${JSON.stringify(afterCheck)}) — retrying`)
}
console.error('repair did not stabilize after 6 attempts')
process.exit(1)

// Compute the exact bounding box of an SVG path (hull of all M/C points,
// including cubic control points, which contain the curve), then rebuild the
// icon SVG with the glyph truly centered. Shared by the app icon and splash.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export function pathBBox(d) {
  const nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi).map(Number)
  const xs = []
  const ys = []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i])
    ys.push(nums[i + 1])
  }
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
    cx: (Math.min(...xs) + Math.max(...xs)) / 2,
    cy: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
}

const here = dirname(fileURLToPath(import.meta.url))
const glyph = readFileSync(join(here, 'glyph-path.txt'), 'utf8').trim()
const bbox = pathBBox(glyph)
console.log(`whale bbox: x ${bbox.minX.toFixed(2)}..${bbox.maxX.toFixed(2)} (w ${bbox.w.toFixed(2)}), y ${bbox.minY.toFixed(2)}..${bbox.maxY.toFixed(2)} (h ${bbox.h.toFixed(2)})`)

// Icon: 1024 canvas, glyph spans ~58% of the larger dimension... use width
// for this wide mark so it fills nicely; cap by height too.
const iconSize = 1024
const scale = Math.min((iconSize * 0.58) / bbox.w, (iconSize * 0.5) / bbox.h)
const tx = iconSize / 2 - bbox.cx * scale
const ty = iconSize / 2 - bbox.cy * scale

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="dsh-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a7bfe"/>
      <stop offset="1" stop-color="#3d59e0"/>
    </linearGradient>
  </defs>
  <rect x="48" y="48" width="928" height="928" rx="208" fill="#4d6bfe"/>
  <rect x="48" y="48" width="928" height="928" rx="208" fill="url(#dsh-bg)"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    <path d="${glyph}" fill="#ffffff"/>
  </g>
</svg>
`
writeFileSync(join(here, '..', 'src-tauri', 'icons', 'app-icon.svg'), svg)
console.log(`icon: scale ${scale.toFixed(3)}, translate (${tx.toFixed(1)}, ${ty.toFixed(1)})`)

// Splash: same math in a 64x64 viewBox.
const splashSize = 64
const sScale = Math.min((splashSize * 0.58) / bbox.w, (splashSize * 0.5) / bbox.h)
const sTx = splashSize / 2 - bbox.cx * sScale
const sTy = splashSize / 2 - bbox.cy * sScale

const htmlPath = join(here, '..', 'dist', 'index.html')
let html = readFileSync(htmlPath, 'utf8')
const newLogo = `<div class="logo">
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#5a7bfe" />
              <stop offset="1" stop-color="#3d59e0" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="58" height="58" rx="13" fill="#4d6bfe" />
          <rect x="3" y="3" width="58" height="58" rx="13" fill="url(#g)" />
          <g transform="translate(${sTx.toFixed(2)} ${sTy.toFixed(2)}) scale(${sScale.toFixed(4)})">
            <path d="${glyph}" fill="#ffffff" />
          </g>
        </svg>
      </div>`
const start = html.indexOf('<div class="logo">')
const end = html.indexOf('</div>', start) + '</div>'.length
if (start === -1 || end === -1) {
  console.error('logo block not found in index.html')
  process.exit(1)
}
html = html.slice(0, start) + newLogo + html.slice(end)
writeFileSync(htmlPath, html)
console.log(`splash: scale ${sScale.toFixed(3)}, translate (${sTx.toFixed(1)}, ${sTy.toFixed(1)})`)

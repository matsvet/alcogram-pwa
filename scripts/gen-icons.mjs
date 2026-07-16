/**
 * Generate simple PNG PWA icons without external deps (pure PNG via minimal encoder).
 * Run: node scripts/gen-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, '../public/icons')
mkdirSync(outDir, { recursive: true })

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type)
  const crcBuf = Buffer.concat([typeB, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcBuf))
  return Buffer.concat([len, typeB, data, crc])
}

function createPng(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a = 255] = paint(x, y, size)
      const i = row + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function paintIcon(x, y, size) {
  const n = (v) => (v / size) * 64
  const nx = n(x)
  const ny = n(y)
  // rounded rect bg
  const r = 14
  const inRound =
    nx >= r &&
    nx < 64 - r &&
    ny >= 0 &&
    ny < 64
      ? true
      : nx >= 0 &&
          nx < 64 &&
          ny >= r &&
          ny < 64 - r
        ? true
        : (nx - r) ** 2 + (ny - r) ** 2 <= r * r ||
          (nx - (64 - r)) ** 2 + (ny - r) ** 2 <= r * r ||
          (nx - r) ** 2 + (ny - (64 - r)) ** 2 <= r * r ||
          (nx - (64 - r)) ** 2 + (ny - (64 - r)) ** 2 <= r * r

  if (!inRound || nx < 0 || nx >= 64 || ny < 0 || ny >= 64) return [0, 0, 0, 0]

  // blue bg
  let r0 = 107,
    g0 = 127,
    b0 = 232

  // beer glass body
  const inGlass =
    nx >= 22 &&
    nx <= 42 &&
    ny >= 14 &&
    ny <= 52 &&
    Math.abs(nx - 32) < 10 + (ny - 14) * 0.02

  if (inGlass) {
    // amber fill lower part
    if (ny > 20) {
      r0 = 245
      g0 = 200
      b0 = 66
    } else {
      r0 = 255
      g0 = 248
      b0 = 224
    }
  }

  // handle
  if (nx >= 42 && nx <= 50 && ny >= 24 && ny <= 42) {
    const dist = Math.abs(nx - 46)
    if (dist > 2 && dist < 5) {
      r0 = 255
      g0 = 255
      b0 = 255
    }
  }

  return [r0, g0, b0, 255]
}

for (const size of [192, 512]) {
  const png = createPng(size, paintIcon)
  writeFileSync(join(outDir, `icon-${size}.png`), png)
  console.log(`wrote icon-${size}.png`)
}

export const WORLD_W = 320
export const WORLD_H = 180

const SIZE = 256
const WATER = 7
const SEED = 7

const LAYERS = { grass: 0, sand: 1, stone: 2, water: 3, log: 4 }

function hash(x, y, z = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177) ^ Math.imul(SEED, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function noise(x, z, seed) {
  const xi = Math.floor(x)
  const zi = Math.floor(z)
  const xf = x - xi
  const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = zf * zf * (3 - 2 * zf)
  const a = hash(xi, zi, seed)
  const b = hash(xi + 1, zi, seed)
  const c = hash(xi, zi + 1, seed)
  const d = hash(xi + 1, zi + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function rgb(hex) {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function pick(palette, n) {
  return palette[Math.min(palette.length - 1, Math.floor(n * palette.length))]
}

const PALETTES = {
  grassTop: ['#4f8a2b', '#5d9a35', '#5d9a35', '#68a83d', '#7bb94a'].map(rgb),
  dirt: ['#6b4a31', '#7a5538', '#866043', '#866043', '#96704f'].map(rgb),
  stone: ['#6c6c6c', '#7b7b7b', '#7b7b7b', '#878787', '#939393'].map(rgb),
  sand: ['#cfc68c', '#d9d09a', '#d9d09a', '#e3dbab'].map(rgb),
  bark: ['#4e3a22', '#6b5130', '#6b5130', '#7a5d37'].map(rgb),
  ringLight: rgb('#b08d57'),
  ringDark: rgb('#9c7a46'),
  leaves: ['#1f5a14', '#2b6e1c', '#2b6e1c', '#368326', '#43953a'].map(rgb),
  water: ['#2a5ccc', '#2d63d6', '#2d63d6', '#3068e0'].map(rgb),
}

let columns = null

function buildColumns() {
  const ground = new Int16Array(SIZE * SIZE)
  const surface = new Uint8Array(SIZE * SIZE)
  const canopyBottom = new Int16Array(SIZE * SIZE)
  const canopyTop = new Int16Array(SIZE * SIZE)

  for (let z = 0; z < SIZE; z++) {
    for (let x = 0; x < SIZE; x++) {
      const n = 0.55 * noise(x / 30, z / 30, 1) + 0.3 * noise(x / 12, z / 12, 2) + 0.15 * noise(x / 5, z / 5, 3)
      const dist = Math.hypot(x - 128, z - 112)
      const bowl = Math.max(0, 1 - dist / 26) * 6
      const height = Math.floor(5 + n * 17 - bowl)
      const index = z * SIZE + x
      if (height < WATER) { ground[index] = WATER; surface[index] = LAYERS.water }
      else if (height <= WATER + 1) { ground[index] = height; surface[index] = LAYERS.sand }
      else if (height >= 20) { ground[index] = height; surface[index] = LAYERS.stone }
      else { ground[index] = height; surface[index] = LAYERS.grass }
    }
  }

  for (let z = 3; z < SIZE - 3; z++) {
    for (let x = 3; x < SIZE - 3; x++) {
      const index = z * SIZE + x
      const base = ground[index]
      if (surface[index] !== LAYERS.grass || base < WATER + 2 || base > 17) continue
      const patch = noise(x / 20, z / 20, 77) > 0.58
      if (hash(x, z, 91) > (patch ? 0.03 : 0.002)) continue
      const trunk = 4 + (hash(x, z, 92) > 0.5 ? 1 : 0)
      ground[index] = base + trunk
      surface[index] = LAYERS.log
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue
          const cell = (z + dz) * SIZE + (x + dx)
          canopyBottom[cell] = base + trunk - 1
          canopyTop[cell] = base + trunk + 2 + (dx === 0 && dz === 0 ? 1 : 0)
        }
      }
    }
  }
  return { ground, surface, canopyBottom, canopyTop }
}

function trace(ox, oy, oz, dx, dy, dz) {
  const { ground, surface, canopyBottom, canopyTop } = columns
  let cx = Math.floor(ox)
  let cz = Math.floor(oz)
  const sx = dx > 0 ? 1 : -1
  const sz = dz > 0 ? 1 : -1
  const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity
  const tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity
  let tmx = dx !== 0 ? (dx > 0 ? cx + 1 - ox : ox - cx) * tdx : Infinity
  let tmz = dz !== 0 ? (dz > 0 ? cz + 1 - oz : oz - cz) * tdz : Infinity
  let t = 0
  let axis = 0
  for (let step = 0; step < 260; step++) {
    if (cx < 0 || cz < 0 || cx >= SIZE || cz >= SIZE) return null
    const index = cz * SIZE + cx
    const top = ground[index]
    const exit = Math.min(tmx, tmz)
    const yIn = oy + dy * t
    const yOut = oy + dy * exit

    let hit = null
    if (step > 0 && yIn < top) hit = { t, face: axis, kind: surface[index], drop: top - yIn, index }
    else if (dy < 0 && yOut < top) {
      const at = Math.max(t, (top - oy) / dy)
      hit = { t: at, face: 0, kind: surface[index], drop: 0, index }
    }

    const bottom = canopyBottom[index]
    if (bottom) {
      const ceiling = canopyTop[index]
      const low = Math.min(yIn, yOut)
      const high = Math.max(yIn, yOut)
      if (high >= bottom && low <= ceiling) {
        let at = t
        let face = axis
        if (yIn > ceiling) { at = (ceiling - oy) / dy; face = 0 } else if (yIn < bottom) { at = (bottom - oy) / dy; face = 3 }
        if (!hit || at < hit.t) hit = { t: at, face, kind: 5, drop: 0, index }
      }
    }
    if (hit) {
      hit.x = ox + dx * hit.t
      hit.y = oy + dy * hit.t
      hit.z = oz + dz * hit.t
      return hit
    }

    if (tmx < tmz) { cx += sx; t = tmx; tmx += tdx; axis = 1 } else { cz += sz; t = tmz; tmz += tdz; axis = 2 }
  }
  return null
}

const frac = value => value - Math.floor(value)

function surfaceColor(hit) {
  const { face, kind } = hit
  let u
  let v
  if (face === 0 || face === 3) { u = frac(hit.x); v = frac(hit.z) } else if (face === 1) { u = frac(hit.z); v = 1 - frac(hit.y) } else { u = frac(hit.x); v = 1 - frac(hit.y) }
  const tx = Math.min(15, Math.floor(u * 16))
  const ty = Math.min(15, Math.floor(v * 16))
  const top = face === 0 || face === 3

  if (kind === 5) return pick(PALETTES.leaves, hash(tx, ty, 31))
  if (kind === LAYERS.water) return pick(PALETTES.water, hash(tx, ty, 32))
  if (kind === LAYERS.log) {
    if (top) {
      const ring = Math.max(Math.abs(tx - 7.5), Math.abs(ty - 7.5))
      if (ring > 6) return PALETTES.bark[1]
      return Math.floor(ring) % 2 === 0 ? PALETTES.ringLight : PALETTES.ringDark
    }
    return PALETTES.bark[(tx + Math.floor(hash(tx, 0, 33) * 3)) % 4 === 0 ? 0 : 1 + Math.floor(hash(tx, ty, 34) * 3) % 3]
  }
  if (top) {
    if (kind === LAYERS.sand) return pick(PALETTES.sand, hash(tx, ty, 35))
    if (kind === LAYERS.stone) return pick(PALETTES.stone, hash(tx, ty, 36))
    return pick(PALETTES.grassTop, hash(tx, ty, 37))
  }
  const layer = Math.floor(hit.drop)
  if (kind === LAYERS.stone || layer >= 4) return pick(PALETTES.stone, hash(tx, ty, 38))
  if (kind === LAYERS.sand) return layer < 3 ? pick(PALETTES.sand, hash(tx, ty, 39)) : pick(PALETTES.stone, hash(tx, ty, 38))
  if (layer === 0) {
    const fringe = ty < 3 || (ty < 5 && hash(tx, 0, 40) > 0.5)
    return fringe ? pick(PALETTES.grassTop, hash(tx, ty, 37)) : pick(PALETTES.dirt, hash(tx, ty, 41))
  }
  return pick(PALETTES.dirt, hash(tx, ty, 41))
}

const FACE_LIGHT = [1, 0.62, 0.8, 0.5]

const SKY = {
  day: { top: rgb('#6f9eff'), horizon: rgb('#c4dbff'), tint: [1, 1, 1], fog: rgb('#c4dbff') },
  night: { top: rgb('#070b24'), horizon: rgb('#1a2252'), tint: [0.3, 0.36, 0.62], fog: rgb('#141b45') },
}

const mix = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
const clamp01 = value => Math.max(0, Math.min(1, value))

function findSpot() {
  const { ground, surface, canopyBottom } = columns
  for (let dz = 0; dz < 60; dz++) {
    for (let dx = -14; dx <= 14; dx++) {
      const x = 128 + dx
      const z = 84 + dz
      const index = z * SIZE + x
      if (surface[index] !== LAYERS.grass || ground[index] < WATER + 3) continue
      let clear = true
      for (let oz = -1; oz <= 7 && clear; oz++) for (let ox = -4; ox <= 4; ox++) {
        const cell = (z + oz) * SIZE + (x + ox)
        if (canopyBottom[cell] || surface[cell] === LAYERS.log) { clear = false; break }
      }
      if (clear) return [x + 0.5, z + 0.5]
    }
  }
  return [128.5, 96.5]
}

function makeCamera() {
  const { ground } = columns
  const [px, pz] = findSpot()
  const eye = ground[Math.floor(pz) * SIZE + Math.floor(px)] + 1.62
  const yaw = 0.06
  const pitch = -0.12
  const forward = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]
  const right = [Math.cos(yaw), 0, -Math.sin(yaw)]
  const up = [-Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch), -Math.cos(yaw) * Math.sin(pitch)]
  const focal = (WORLD_W / 2) / Math.tan((72 * Math.PI) / 360)
  return { px, pz, eye, forward, right, up, focal }
}

function skyColor(kind, camera, dx, dy, dz, px, py) {
  const sky = SKY[kind]
  let color = mix(sky.horizon, sky.top, clamp01(dy * 2.6))
  if (kind === 'night' && dy > 0.05 && hash(px, py, 51) > 0.992) color = [235, 240, 255]
  if (dy > 0.03) {
    const at = (190 - camera.eye) / dy
    const x = camera.px + dx * at
    const z = camera.pz + dz * at
    const cell = noise(Math.floor(x / 14) * 0.55 + 4.1, Math.floor(z / 14) * 0.55 + 9.7, 61)
    if (cell > 0.56) {
      const near = 1 - clamp01((at - 90) / 520)
      const cloud = kind === 'night' ? [58, 66, 112] : [250, 252, 255]
      color = mix(color, cloud, 0.88 * near)
    }
  }
  return color
}

const cache = new Map()

export function renderWorld(kind) {
  if (cache.has(kind)) return cache.get(kind)
  const pixels = new Uint8ClampedArray(WORLD_W * WORLD_H * 4)

  if (kind === 'black') {
    for (let index = 3; index < pixels.length; index += 4) pixels[index] = 255
    cache.set(kind, pixels)
    return pixels
  }

  if (kind === 'dark') {
    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        const color = pick(PALETTES.dirt, hash((x >> 1) & 15, (y >> 1) & 15, 41))
        const o = (y * WORLD_W + x) * 4
        pixels[o] = color[0] * 0.38; pixels[o + 1] = color[1] * 0.38; pixels[o + 2] = color[2] * 0.38; pixels[o + 3] = 255
      }
    }
    cache.set(kind, pixels)
    return pixels
  }

  columns ??= buildColumns()
  const camera = makeCamera()
  const sky = SKY[kind]
  const { forward, right, up, focal } = camera
  for (let py = 0; py < WORLD_H; py++) {
    for (let px = 0; px < WORLD_W; px++) {
      const sxr = (px - WORLD_W / 2 + 0.5) / focal
      const syr = (WORLD_H / 2 - py - 0.5) / focal
      let dx = forward[0] + right[0] * sxr + up[0] * syr
      let dy = forward[1] + right[1] * sxr + up[1] * syr
      let dz = forward[2] + right[2] * sxr + up[2] * syr
      const length = Math.hypot(dx, dy, dz)
      dx /= length; dy /= length; dz /= length

      const hit = trace(camera.px, camera.eye, camera.pz, dx, dy, dz)
      let color
      if (hit) {
        const base = surfaceColor(hit)
        const light = FACE_LIGHT[hit.face] * (0.97 + (hash(hit.index, hit.face, 70) - 0.5) * 0.06)
        const tinted = [base[0] * light * sky.tint[0], base[1] * light * sky.tint[1], base[2] * light * sky.tint[2]]
        const fog = clamp01((hit.t - 22) / 80)
        color = mix(tinted, sky.fog, fog * fog * (3 - 2 * fog))
      } else color = skyColor(kind, camera, dx, dy, dz, px, py)
      const o = (py * WORLD_W + px) * 4
      pixels[o] = color[0]; pixels[o + 1] = color[1]; pixels[o + 2] = color[2]; pixels[o + 3] = 255
    }
  }

  cache.set(kind, pixels)
  return pixels
}

export function fillWorld(canvas, color) {
  canvas.width = WORLD_W
  canvas.height = WORLD_H
  const context = canvas.getContext('2d')
  context.fillStyle = color
  context.fillRect(0, 0, WORLD_W, WORLD_H)
}

export function drawWorld(canvas, kind) {
  canvas.width = WORLD_W
  canvas.height = WORLD_H
  const context = canvas.getContext('2d')
  const image = context.createImageData(WORLD_W, WORLD_H)
  image.data.set(renderWorld(kind))
  context.putImageData(image, 0, 0)
}

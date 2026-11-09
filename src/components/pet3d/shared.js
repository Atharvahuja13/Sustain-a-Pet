import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const MOODS = {
  // eye: openness 0..1, mouth: curve (+smile / -frown), droop: leaf/body slump, sparkle: eye glint, cheek: blush
  Thriving: { eye: 1, mouth: 1, droop: 0, sparkle: 1, cheek: 0.9, grey: 0 },
  Okay: { eye: 0.82, mouth: 0.4, droop: 0.18, sparkle: 0, cheek: 0.55, grey: 0.18 },
  Wilting: { eye: 0.42, mouth: 0.06, droop: 0.65, sparkle: 0, cheek: 0.25, grey: 0.55 },
  Sick: { eye: 0.05, mouth: -0.45, droop: 1, sparkle: 0, cheek: 0.05, grey: 0.9 },
}

// Body/head scale by stage: 80, 100, 120, 140 px wide in the spec, as ratios of the 100px size.
export const STAGE_SCALE = [0.8, 1, 1.2, 1.4]

export const SPRITES = {
  leafling: { label: 'Leafling', blurb: 'A leaf-sprite that sprouts more leaves as it grows.' },
  mossy: { label: 'Mossy', blurb: 'A squishy moss blob with mushrooms on its back.' },
  sunbud: { label: 'Sunbud', blurb: 'A sunny flower face whose petals multiply.' },
}

export const damp = (cur, target, rate, dt) => THREE.MathUtils.damp(cur, target, rate, dt)

// Leaf surface bend: tip curls back, edges cup forward. Shared by the leaf body and its veins.
const bend = (x, y) => -0.2 * y * y + 0.55 * x * x

/** Leaf outline extruded with a soft bevel and a gentle curl. Pointing along +Y, base at the origin. */
export function makeLeafGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.34, 0.12, 0.3, 0.7, 0, 1)
  s.bezierCurveTo(-0.3, 0.7, -0.34, 0.12, 0, 0)
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.04, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 6, curveSegments: 32,
  })
  g.translate(0, 0, -0.02)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + bend(p.getX(i), p.getY(i)))
  g.computeVertexNormals()
  return g
}

/** Midrib plus three pairs of side veins, as thin tubes sitting on the leaf surface. */
export function makeVeinGeometry() {
  const onLeaf = (x, y) => new THREE.Vector3(x, y, bend(x, y) + 0.062)
  const tube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, r, 6, false)
  const parts = [tube([onLeaf(0, 0.03), onLeaf(0, 0.35), onLeaf(0, 0.7), onLeaf(0, 0.93)], 0.014)]
  for (const y of [0.2, 0.42, 0.62]) {
    for (const side of [-1, 1]) {
      parts.push(tube([onLeaf(0, y), onLeaf(side * 0.09, y + 0.07), onLeaf(side * 0.17 * (1 - y * 0.5), y + 0.17)], 0.008))
    }
  }
  return mergeGeometries(parts)
}

export const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t)

/** Glossy "gummy" material: clear coat plus soft sheen so bodies look like squishy candy. */
export const gummy = (color, o = {}) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.36, clearcoat: 0.6, clearcoatRoughness: 0.26, sheen: 0.7, sheenRoughness: 0.45, sheenColor: new THREE.Color('#eaffd2'), ...o,
})

/** Small seeded RNG so scattered scenery never jumps between renders. */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Canvas-drawn texture helper (no image files). */
export function canvasTexture(size, draw) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export const radialTexture = (stops, size = 128) => canvasTexture(size, (ctx, n) => {
  const g = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2)
  stops.forEach(([at, col]) => g.addColorStop(at, col))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, n, n)
})

export function usePrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

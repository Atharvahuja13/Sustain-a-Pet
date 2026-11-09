import * as THREE from 'three'

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

/** Leaf outline extruded with a soft bevel. Pointing along +Y, base at the origin. */
export function makeLeafGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.34, 0.12, 0.3, 0.7, 0, 1)
  s.bezierCurveTo(-0.3, 0.7, -0.34, 0.12, 0, 0)
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.04, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 5, curveSegments: 24,
  })
  g.translate(0, 0, -0.02)
  g.computeVertexNormals()
  return g
}

export const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t)

export function usePrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

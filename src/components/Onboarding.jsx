import { lazy, Suspense, useEffect, useState } from 'react'
import { SPRITES } from './pet3d/shared.js'

const PetCanvas = lazy(() => import('./pet3d/PetCanvas.jsx'))
const PetModel = lazy(() => import('./pet3d/PetModel.jsx'))
const KEYS = Object.keys(SPRITES)

export default function Onboarding({ reduced, onHatch }) {
  const [name, setName] = useState('')
  const [sprite, setSprite] = useState('leafling')
  const [bounce, setBounce] = useState(0)
  const [touched, setTouched] = useState(false)
  const empty = name.trim().length === 0
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return
      const k = KEYS[Number(e.key) - 1]
      if (k) { setSprite(k); setBounce((b) => b + 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const pick = (k) => { setSprite(k); setBounce((b) => b + 1) }

  return (
    <main className="onboard">
      <span className="onboard-badge">A LITTLE FRIEND FOR A GREENER WORLD</span>
      <h1>Grow greener, together.</h1>
      <p className="onboard-lede">Choose your companion. Every earth-kind habit helps them thrive.</p>
      <p className="onboard-keys">Choose with 1–3 · press Enter to hatch</p>
      <p className="onboard-step">01 · Choose your companion</p>
      <div className="stage-pick" aria-label="Preview your three companions">
        <Suspense fallback={<div className="loading">Loading…</div>}>
          <PetCanvas camera={{ position: [0, 1.6, 9.4], fov: 34 }} target={[0, 1.1, 0]}>
            {KEYS.map((k, i) => (
              <group key={k} onClick={() => pick(k)} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
                <PetModel sprite={k} stage={1} mood="Thriving" reduced={reduced} position={[(i - 1) * 2.35, 0, 0]} scale={k === sprite ? 1.05 : 0.82}
                  fx={{ bounce: k === sprite ? bounce : 0 }} />
              </group>
            ))}
          </PetCanvas>
        </Suspense>
      </div>
      <div className="radios" role="radiogroup" aria-label="Choose your pet">
        {KEYS.map((k, i) => (
          <label key={k} className={sprite === k ? 'on' : ''}>
            <input type="radio" name="sprite" value={k} checked={sprite === k} onChange={() => pick(k)} />
            <strong>{SPRITES[k].label} <kbd className="key" aria-hidden="true">{i + 1}</kbd></strong>
            <small>{SPRITES[k].blurb}</small>
          </label>
        ))}
      </div>
      <p className="onboard-step">02 · Give your friend a name</p>
      <form onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!empty) onHatch(name, sprite) }}>
        <label htmlFor="pet-name">Name your pet</label>
        <input id="pet-name" value={name} maxLength={20} autoComplete="off" placeholder="Pip" aria-invalid={touched && empty}
          aria-describedby="name-help" onChange={(e) => setName(e.target.value)} />
        <p id="name-help" className={touched && empty ? 'err' : 'muted'}>{touched && empty ? 'Give your pet a name first.' : `${name.length} / 20`}</p>
        <button className="primary" type="submit">Hatch {SPRITES[sprite].label}</button>
      </form>
    </main>
  )
}

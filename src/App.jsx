import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { activeOf, todayOf, useApp } from './store.js'
import { habitsDone, moodFor, stageIndex } from './engine.js'
import habitList from './data/habits.json'
import { questionFor } from './components/QuizCard.jsx'
import HealthBar from './components/HealthBar.jsx'
import XpBar from './components/XpBar.jsx'
import HabitList from './components/HabitList.jsx'
import QuizCard from './components/QuizCard.jsx'
import DemoDrawer from './components/DemoDrawer.jsx'
import Onboarding from './components/Onboarding.jsx'
import Rewards, { unlockText } from './components/Rewards.jsx'
import { usePrefersReducedMotion } from './components/pet3d/shared.js'

const PetCanvas = lazy(() => import('./components/pet3d/PetCanvas.jsx'))
const PetModel = lazy(() => import('./components/pet3d/PetModel.jsx'))

let uid = 0

export default function App() {
  const [app, dispatch] = useApp()
  const reduced = usePrefersReducedMotion()
  const pet = activeOf(app)
  const today = todayOf(app)

  const [fx, setFx] = useState({ bounce: 0, evolve: 0, dance: 0, leaves: 0, confetti: 0, sparkle: 0 })
  const [floats, setFloats] = useState([])
  const [toasts, setToasts] = useState([])
  const [evolve, setEvolve] = useState(null)
  const [live, setLive] = useState('')
  const taps = useRef([])

  const bump = useCallback((...keys) => setFx((f) => { const n = { ...f }; keys.forEach((k) => (n[k] += 1)); return n }), [])
  const pushToast = useCallback((text) => {
    const id = ++uid
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // Play reward events each time the app state produces new ones.
  useEffect(() => {
    if (!app.events.length) return
    const name = pet?.pet.name
    for (const e of app.events) {
      if (e.type === 'tick') {
        bump('bounce', 'leaves')
        const id = ++uid
        setFloats((f) => [...f, { id, xp: e.xp, x: 40 + Math.random() * 20 }])
        setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400)
      }
      if (e.type === 'quizCorrect') bump('bounce', 'confetti')
      if (e.type === 'stageUp') { bump('evolve', 'sparkle'); setTimeout(() => setEvolve({ stage: e.stage }), 900) }
      if (e.type === 'unlock') { bump('confetti'); pushToast(unlockText(e.id)) }
      if (e.type === 'allDone') { bump('dance', 'confetti'); pushToast('All habits done today! 🌍') }
      if (e.type === 'mood') setLive(`${name} feels ${e.mood.toLowerCase()}`)
    }
  }, [app.nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: 1-7 tick habits, A/B/C answer the quiz, P pats the pet, Shift+D toggles demo, Esc closes the cutscene.
  const kb = useRef()
  kb.current = { pet, today, app }
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input:not([type=checkbox]), textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      const { pet: p, today: t, app: a } = kb.current
      if (e.key === 'Escape') { setEvolve(null); return }
      if (!p) return
      if (e.key === 'D' && e.shiftKey) { dispatch({ type: a.inDemo ? 'exitDemo' : 'enterDemo' }); return }
      if (e.key === 'p' || e.key === 'P') { bump('bounce'); return }
      const n = Number(e.key)
      if (n >= 1 && n <= 7) { dispatch({ type: 'tick', id: habitList[n - 1].id }); return }
      const q = 'abc'.indexOf(e.key.toLowerCase())
      if (q >= 0 && e.key.length === 1) {
        const ques = questionFor(t)
        if (q < ques.options.length) dispatch({ type: 'quiz', choice: q, correct: ques.answer })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, bump])

  const petTap = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < 2500), now]
    bump('bounce')
    if (taps.current.length >= 5 && !app.inDemo) { taps.current = []; dispatch({ type: 'enterDemo' }) }
  }

  if (!app.real && !app.inDemo) return <Onboarding reduced={reduced} onHatch={(name, sprite) => dispatch({ type: 'hatch', name, sprite })} />
  if (!pet) return null

  const mood = moodFor(pet.health)
  const stage = stageIndex(pet.xp)
  const done = habitsDone(pet, today)

  return (
    <main className="home">
      <header className="glass top">
        <div>
          <p className="eyebrow">Sustain-a-Pet</p>
          <h1>{pet.pet.name}</h1>
        </div>
        <div className="pills">
          {app.inDemo && <span className="pill demo">Demo</span>}
          <span className="pill">{['Seed', 'Sprout', 'Sapling', 'Guardian'][stage]}</span>
          <span className={`pill mood-${mood.toLowerCase()}`}>{mood}</span>
        </div>
      </header>

      {app.awayDays >= 2 && !app.inDemo && (
        <div className="banner" role="status">
          Welcome back! {pet.pet.name} missed you. Tick a habit and it will perk right up.
          <button onClick={() => dispatch({ type: 'dismissAway' })} aria-label="Dismiss">×</button>
        </div>
      )}
      {app.awayDays >= 2 && app.inDemo && (
        <div className="banner" role="status">Welcome back! {pet.pet.name} missed you.<button onClick={() => dispatch({ type: 'dismissAway' })} aria-label="Dismiss">×</button></div>
      )}

      <div className={`pet-stage mood-${mood.toLowerCase()}`} onClick={petTap} role="button" tabIndex={0}
        aria-label={`Pat ${pet.pet.name}. Press Enter or P.`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); petTap() } }}>
        <Suspense fallback={<div className="loading">Waking up {pet.pet.name}…</div>}>
          <PetCanvas fit={{ dist: [5, 5.6, 6.4, 7.4][stage], y: [1.2, 1.4, 1.6, 1.8][stage], look: [0.9, 1.05, 1.2, 1.4][stage] }} camera={{ position: [0, 1.4, 6.2], fov: 34 }}>
            <PetModel sprite={pet.pet.sprite} stage={stage} mood={mood} fx={fx} reduced={reduced} />
          </PetCanvas>
        </Suspense>
        <Rewards floats={floats} toasts={toasts} evolve={evolve} onCloseEvolve={() => setEvolve(null)} petName={pet.pet.name} />
      </div>
      <div className="sr-only" aria-live="polite">{live}</div>

      <div className="glass stats"><HealthBar health={pet.health} /><XpBar xp={pet.xp} /></div>
      <HabitList done={done} onTick={(id) => dispatch({ type: 'tick', id })} />
      <QuizCard today={today} result={pet.days[today]?.quiz} onAnswer={(choice, correct) => dispatch({ type: 'quiz', choice, correct })} />

      <p className="hint kbd-hint">Keys: 1–7 habits · A/B/C quiz · P pat · Shift+D demo</p>
      {app.inDemo && (
        <DemoDrawer date={today} offset={app.offset} onSkip={(days) => dispatch({ type: 'skipDay', days })}
          onXp={(amount) => dispatch({ type: 'addXp', amount })} onReset={() => dispatch({ type: 'resetDemo' })} onExit={() => dispatch({ type: 'exitDemo' })} />
      )}
    </main>
  )
}

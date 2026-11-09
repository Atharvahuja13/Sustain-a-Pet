import { useEffect } from 'react'
import { STAGES } from '../engine.js'
import accessories from '../data/accessories.json'

/** Floating "+XP" chips over the pet, toasts for unlocks/streaks, and the stage-up cutscene. */
export default function Rewards({ floats, toasts, evolve, onCloseEvolve, petName }) {
  return (
    <>
      <div className="floats" aria-hidden="true">
        {floats.map((f) => <span key={f.id} className="float" style={{ left: `${f.x}%` }}>+{f.xp} XP</span>)}
      </div>
      <div className="toasts" role="status">
        {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
      </div>
      {evolve && <EvolveCutscene stage={evolve.stage} name={petName} onClose={onCloseEvolve} />}
    </>
  )
}

function EvolveCutscene({ stage, name, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4200)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="evolve" role="dialog" aria-label="Your pet evolved" onClick={onClose}>
      <div className="rays" aria-hidden="true" />
      <div className="evolve-text">
        <small>{name} evolved!</small>
        <strong>{STAGES[stage]}</strong>
        <em>Tap to continue</em>
      </div>
    </div>
  )
}

export const unlockText = (id) => `Unlocked: ${accessories.find((a) => a.id === id)?.name ?? id}!`

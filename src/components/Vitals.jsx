import Icon from './Icons.jsx'
import { nextStage } from '../engine.js'

const Vital = ({ icon, label, value, title }) => (
  <div className="vital" title={title}>
    <div className="vital-label"><Icon name={icon} size={18} />{label}</div>
    <div className="vbar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div className="vfill" style={{ width: `${value}%` }} />
    </div>
    <div className="vital-num">{value} / 100</div>
  </div>
)

/**
 * Health, Mood and Growth. Mood is a display score mixing health with how many of today's habits are
 * done; the pet's mood band (face, colour) still comes from health alone, as in the engine rules.
 */
export default function Vitals({ health, xp, doneToday, totalHabits }) {
  const next = nextStage(xp)
  const growth = next ? Math.round(((xp - next.from) / (next.at - next.from)) * 100) : 100
  const mood = Math.min(100, Math.round(health * 0.75 + (doneToday / totalHabits) * 25))
  return (
    <section className="glass vitals" aria-label="Pet vitals">
      <Vital icon="heart" label="Health" value={health} />
      <Vital icon="smile" label="Mood" value={mood} />
      <Vital icon="sprout" label="Growth" value={growth} title={next ? `${xp} XP · ${next.at - xp} XP to ${next.name}` : `${xp} XP · fully grown`} />
    </section>
  )
}

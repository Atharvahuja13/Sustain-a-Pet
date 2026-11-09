import { nextStage, stageFor } from '../engine.js'

export default function XpBar({ xp }) {
  const next = nextStage(xp)
  const pct = next ? Math.min(100, ((xp - next.from) / (next.at - next.from)) * 100) : 100
  return (
    <div className="bar-wrap">
      <div className="bar-head">
        <span>{stageFor(xp)}</span>
        <span>{next ? `${xp} / ${next.at} XP to ${next.name}` : `${xp} XP · fully grown`}</span>
      </div>
      <div className="bar xp" role="progressbar" aria-label="XP to next stage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

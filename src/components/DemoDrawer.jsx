export default function DemoDrawer({ date, offset, onSkip, onXp, onReset, onExit }) {
  return (
    <aside className="drawer" aria-label="Demo mode">
      <div className="drawer-head"><strong>Demo mode</strong><span>{date}{offset ? ` (+${offset}d)` : ''}</span></div>
      <p className="muted">Your real pet is never touched.</p>
      <div className="drawer-btns">
        <button onClick={() => onSkip(1)}>Skip 1 day</button>
        <button onClick={() => onSkip(3)}>Skip 3 days</button>
        <button onClick={() => onXp(50)}>+50 XP</button>
        <button onClick={onReset}>Reset</button>
        <button className="ghost" onClick={onExit}>Exit demo</button>
      </div>
    </aside>
  )
}

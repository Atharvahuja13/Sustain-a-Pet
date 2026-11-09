import { useState } from 'react'
import Icon from './Icons.jsx'

export default function DemoDrawer({ date, offset, onSkip, onXp, onReset, onExit }) {
  const [open, setOpen] = useState(false)
  return (
    <aside className="drawer" aria-label="Demo mode">
      <button className="drawer-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="d-title"><Icon name="layers" size={30} /><span><strong>Demo mode</strong><small>Your real pet is never touched.</small></span></span>
        <span className="d-date"><Icon name="cal" size={20} />{date}{offset ? ` (+${offset}d)` : ''}</span>
        <Icon name="chev" size={18} className={`chev ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="drawer-btns">
          <button className="big" onClick={() => onSkip(1)}><Icon name="cal" size={22} />Skip 1 day</button>
          <button className="big" onClick={() => onSkip(3)}><Icon name="calr" size={22} />Skip 3 days</button>
          <button className="small gold" onClick={() => onXp(50)}><Icon name="spark" size={20} />+50 XP</button>
          <button className="small" onClick={onReset}><Icon name="refresh" size={20} />Reset</button>
          <button className="small" onClick={onExit}><Icon name="exit" size={20} />Exit demo</button>
        </div>
      )}
    </aside>
  )
}

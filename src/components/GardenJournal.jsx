import { useEffect, useRef, useState } from 'react'
import habits from '../data/habits.json'
import { taskCount } from '../engine.js'
import { AREAS, DECOR, PETS, QUESTS, RESTORATIONS, ownsPet } from '../progression.js'
import QuizCard from './QuizCard.jsx'

export default function GardenJournal({ state: s, today, dispatch, onClose }) {
  const dialog = useRef()
  const [tab, setTab] = useState('Today')
  const [message, setMessage] = useState('')
  useEffect(() => { const d = dialog.current; if (!d.open) d.showModal() }, [])
  const act = (type, id, text, extra = {}) => { dispatch({ type, id, ...extra }); setMessage(text) }
  const tasks = taskCount(s, today)
  const gift = s.gifts.includes(today)
  return <dialog ref={dialog} className="journal" aria-labelledby="journal-title" onCancel={onClose} onClose={onClose}>
    <div className="journal-head"><div><small>YOUR GARDEN JOURNAL</small><h2 id="journal-title">Make room for good</h2></div><button onClick={onClose} aria-label="Close journal">×</button></div>
    <div className="journal-wallet"><span>✦ <strong>{s.coins}</strong> leaves</span><span>{today} {s.streak > 0 && `· ${s.streak} day streak`}</span></div>
    <nav className="journal-tabs" aria-label="Journal pages">{['Today', 'Garden', 'Shop', 'Pets'].map((t) => <button key={t} aria-pressed={tab === t} onClick={() => { setTab(t); setMessage('') }}>{t}</button>)}</nav>
    <p className="journal-status" role="status">{message}</p>
    {tab === 'Today' && <>
      <section className="journal-card"><h3>A little gift for showing up</h3><p>20 leaves today, plus 5 for each consecutive day, up to 50.</p><button disabled={gift} onClick={() => act('gift', null, 'Daily gift collected. Come back tomorrow!')}>{gift ? 'Collected today ✓' : 'Collect daily gift'}</button></section>
      <h3>Daily quests · {tasks}/8</h3>
      {QUESTS.map((q) => { const claimed = s.questClaims.includes(`${today}:${q.id}`); return <section className="journal-row" key={q.id}><div><strong>{q.name}</strong><small>Complete {q.target} tasks · +{q.reward} leaves</small></div><button disabled={claimed || tasks < q.target} onClick={() => act('quest', q.id, `${q.name} reward collected.`)}>{claimed ? 'Claimed ✓' : `${Math.min(tasks, q.target)}/${q.target} · Claim`}</button></section> })}
      <p className="journal-note">Complete habits you did in real life. Each earns XP for your active pet and leaves for the whole garden. A quiz attempt counts toward quests, even if incorrect.</p>
      <ul className="habits">{habits.filter((h) => h.id !== 'quiz').map((h) => { const done = s.days[today]?.habits.includes(h.id) ?? false; return <li key={h.id} className={done ? 'done' : ''}><label><input type="checkbox" checked={done} disabled={done} onChange={() => dispatch({ type: 'tick', id: h.id })} /><span className="box" aria-hidden="true" /><span className="txt">{h.label}</span><span className="xp-tag">+{h.xp}</span></label></li> })}</ul>
      <QuizCard today={today} result={s.days[today]?.quiz} onAnswer={(choice, correct) => dispatch({ type: 'quiz', choice, correct })} />
    </>}
    {tab === 'Garden' && <>
      <p className="journal-note">Restore one corner at a time. New areas and restored landmarks currently appear in your journal. The 3D view stays in the original garden.</p>
      {AREAS.map((a) => { const open = s.areas.includes(a.id), blocked = a.requires && !s.restored.includes(a.requires); return <section className={`journal-card ${s.area === a.id ? 'selected' : ''}`} key={a.id}><small>{s.area === a.id ? 'CURRENT GARDEN' : open ? 'UNLOCKED' : 'A NEW CHAPTER'}</small><h3>{a.name}</h3><p>{a.description}</p>{blocked && <p>First: {RESTORATIONS.find((r) => r.id === a.requires)?.name}</p>}<button disabled={s.area === a.id || (!open && (blocked || s.coins < a.cost))} onClick={() => act('area', a.id, `Visiting ${a.name}.`)}>{s.area === a.id ? 'You are here' : open ? 'Visit' : `Unlock · ${a.cost} leaves`}</button></section> })}
      <h3>Restoration projects</h3>{RESTORATIONS.map((r) => { const done = s.restored.includes(r.id), blocked = !s.areas.includes(r.area) || (r.requires && !s.restored.includes(r.requires)); return <section className="journal-row" key={r.id}><div><strong>{r.name}</strong><small>{AREAS.find((a) => a.id === r.area).name}{blocked ? ' · Complete earlier chapter first' : ''}</small></div><button disabled={done || blocked || s.coins < r.cost} onClick={() => act('restore', r.id, `${r.name}: complete!`)}>{done ? 'Restored ✓' : `${r.cost} leaves`}</button></section> })}
      <h3>{AREAS.find((a) => a.id === s.area).name} · decoration layout</h3><div className="decor-layout">{['left', 'center', 'right'].map((slot) => { const item = DECOR.find((d) => d.id === s.placements[`${s.area}:${slot}`]); return <div key={slot}><span aria-hidden="true">{item?.icon ?? '·'}</span><strong>{item?.name ?? 'Empty spot'}</strong><small>{slot}</small></div> })}</div><p className="journal-note">Layout preview. Placement is saved; Decorations currently appear in this preview only.</p>
    </>}
    {tab === 'Shop' && <><p className="journal-note">Buy once, move freely between gardens. Choose a spot below; placing an item replaces the decoration in that spot.</p>{DECOR.map((d) => { const owned = s.owned.includes(d.id); return <section className="journal-card" key={d.id}><h3>{d.icon} {d.name}</h3><button disabled={owned || s.coins < d.cost} onClick={() => act('buy', d.id, `${d.name} added to your collection.`)}>{owned ? 'Owned ✓' : `Buy · ${d.cost} leaves`}</button>{owned && <div className="placement-actions">{['left', 'center', 'right'].map((slot) => <button key={slot} aria-pressed={s.placements[`${s.area}:${slot}`] === d.id} onClick={() => act('place', d.id, `${d.name} placed ${slot}.`, { slot })}>{slot}</button>)}<button onClick={() => act('place', d.id, `${d.name} put away.`, { slot: null })}>Put away</button></div>}</section> })}</>}
    {tab === 'Pets' && <><p className="journal-note">Every pet grows with its own XP and health. Daily habits, leaves, quests and gardens are shared, so switching never repeats a daily reward.</p>{PETS.map((p) => { const owned = ownsPet(s, p.id), active = s.activePet === p.id; return <section className={`journal-card ${active ? 'selected' : ''}`} key={p.id}><h3>{active ? s.pet.name : s.pets[p.id]?.pet.name ?? p.name}</h3><p>{p.name} · {active ? s.xp : s.pets[p.id]?.xp ?? 0} XP</p><button disabled={active || (!owned && s.coins < p.cost)} onClick={() => act('pet', p.id, `${p.name} is exploring with you.`)}>{active ? 'Active companion' : owned ? 'Switch companion' : `Adopt · ${p.cost} leaves`}</button></section> })}</>}
  </dialog>
}

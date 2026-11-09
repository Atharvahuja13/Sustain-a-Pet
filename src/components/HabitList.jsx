
import habits from '../data/habits.json'

export default function HabitList({ done, onTick }) {
  
  return (
    <section className="card" aria-labelledby="habits-h">
      <h2 id="habits-h">Today's habits</h2>
      <ul className="habits">
        {habits.map((h, idx) => {
          const isDone = done.includes(h.id)
          const isQuiz = h.id === 'quiz'
          return (
            <li key={h.id} className={isDone ? 'done' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={isDone || isQuiz}
                  onChange={() => onTick(h.id)}
                />
                <span className="box" aria-hidden="true" />
                <span className="txt">{h.label}</span>
                {!isQuiz && <kbd className="key" aria-hidden="true">{idx + 1}</kbd>}
                <span className="xp-tag">+{h.xp}</span>
              </label>
              {isDone && <p className="why">{h.why}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

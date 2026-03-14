import { useState, useRef, useEffect } from 'react'

const MONTHS = ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor']
const DAYS = ['Hë','Ma','Më','En','Pr','Sh','Di']

function formatDisplay(date) {
  if (!date) return ''
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}.${m}.${y}`
}

export default function DatePicker({ value, onChange, placeholder = 'DD.MM.YYYY' }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => value ? new Date(value) : new Date())
  const ref = useRef(null)

  const selected = value ? new Date(value) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const prevMonth = () => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))
  const nextMonth = () => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))

  const getDays = () => {
    const year = view.getFullYear()
    const month = view.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const offset = (firstDay + 6) % 7 // Monday start
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }

  const select = (date) => {
    onChange(date ? date.toISOString().slice(0, 10) : '')
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center">
        <input
          readOnly
          value={selected ? formatDisplay(selected) : ''}
          placeholder={placeholder}
          onClick={() => { setView(selected || new Date()); setOpen(o => !o) }}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3] w-[130px] cursor-pointer"
        />
        {selected && (
          <button
            type="button"
            onClick={() => select('')}
            className="ml-[-26px] text-slate-300 hover:text-slate-500 text-base leading-none z-10"
          >×</button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-[260px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-sm font-bold text-slate-700">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {getDays().map((date, i) => {
              if (!date) return <div key={i} />
              const isToday = date.getTime() === today.getTime()
              const isSelected = selected && date.toDateString() === selected.toDateString()
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(date)}
                  className={`w-8 h-8 mx-auto rounded-lg text-xs font-medium transition-all
                    ${isSelected ? 'bg-[#00a0e3] text-white font-bold' :
                      isToday ? 'bg-blue-50 text-[#00a0e3] font-bold' :
                      'text-slate-600 hover:bg-slate-100'}`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

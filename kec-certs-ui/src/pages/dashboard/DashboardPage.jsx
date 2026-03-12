import { useEffect, useState } from 'react'
import { getStatistics } from '../../api/reports.api'
import { useNavigate } from 'react-router-dom'

const CertIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)
const ProgramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)
const BatchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
)
const MonthIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const YearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

const CARDS = [
  { key: 'totalCertificates',    label: 'Certifikata Gjithsej', icon: <CertIcon />,    bg: 'bg-blue-50',   text: 'text-[#00a0e3]' },
  { key: 'totalPrograms',        label: 'Programe',             icon: <ProgramIcon />, bg: 'bg-violet-50', text: 'text-violet-500' },
  { key: 'totalBatches',         label: 'Grupe (Batch)',        icon: <BatchIcon />,   bg: 'bg-cyan-50',   text: 'text-cyan-500'   },
  { key: 'certificatesThisMonth',label: 'Këtë Muaj',            icon: <MonthIcon />,   bg: 'bg-emerald-50',text: 'text-emerald-500' },
  { key: 'certificatesThisYear', label: 'Këtë Vit',             icon: <YearIcon />,    bg: 'bg-amber-50',  text: 'text-amber-500'  },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getStatistics()
      .then(({ data }) => setStats(data))
      .catch(() => setError('Ngarkimi i statistikave dështoi.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-400">Duke ngarkuar...</div>
  )
  if (error) return (
    <div className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{error}</div>
  )

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CARDS.map(({ key, label, icon, bg, text }) => (
          <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
            <div className={`w-10 h-10 ${bg} ${text} rounded-xl flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <p className={`text-3xl font-black ${text}`}>{stats[key] ?? 0}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Certificates by program table */}
      {stats.certificatesByProgram?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Certifikata sipas Programit</h2>
            <button
              onClick={() => navigate('/certificates')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#00a0e3] hover:underline"
            >
              Shiko të gjitha <ArrowIcon />
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Programi</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Certifikata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.certificatesByProgram.map((row) => (
                <tr key={row.programId} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.programName}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-[#00a0e3] text-sm">{row.count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

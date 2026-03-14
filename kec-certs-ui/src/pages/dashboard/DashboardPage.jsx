import { useEffect, useState } from 'react'
import { getStatistics } from '../../api/reports.api'
import { getCertificates } from '../../api/certificates.api'
import { useNavigate } from 'react-router-dom'

const CertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)
const ProgramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)
const MonthIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
)
const WarningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentCerts, setRecentCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshTime, setRefreshTime] = useState('')

  const loadData = () => {
    setLoading(true)
    setRefreshTime(new Date().toLocaleTimeString('sq-AL'))
    Promise.all([
      getStatistics().then(({ data }) => setStats(data)).catch(() => setStats(null)),
      getCertificates({ pageSize: 5, pageNumber: 1 }).then(({ data }) => setRecentCerts(data.items || [])).catch(() => {})
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-400">Duke ngarkuar...</div>
  )

  const expiredAlerts = stats?.accreditationAlerts?.filter(a => a.alertType === 'expired') || []
  const expiringAlerts = stats?.accreditationAlerts?.filter(a => a.alertType === 'expiring_soon') || []
  const allAlerts = [...expiredAlerts, ...expiringAlerts]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Përmbledhja e Sistemit</h1>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50">
          <ClockIcon /> Përditësuar: {refreshTime}
        </button>
      </div>

      {/* Accreditation Alerts */}
      {allAlerts.length > 0 && (
        <div className={`rounded-2xl p-5 border ${expiredAlerts.length > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={expiredAlerts.length > 0 ? 'text-red-500' : 'text-amber-500'}><WarningIcon /></span>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${expiredAlerts.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>
              Njoftimet e Akreditimit
            </h3>
          </div>
          <div className="space-y-2">
            {expiredAlerts.map(a => (
              <div key={a.programId} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-red-100">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded-full uppercase">Skaduar</span>
                  <span className="font-mono text-xs font-bold text-slate-500">{a.programCode}</span>
                  <span className="text-sm font-semibold text-slate-800">{a.programName}</span>
                </div>
                <span className="text-xs font-bold text-red-600">Skaduar më {a.accreditationTo}</span>
              </div>
            ))}
            {expiringAlerts.map(a => (
              <div key={a.programId} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[9px] font-bold rounded-full uppercase">Skadon</span>
                  <span className="font-mono text-xs font-bold text-slate-500">{a.programCode}</span>
                  <span className="text-sm font-semibold text-slate-800">{a.programName}</span>
                </div>
                <span className="text-xs font-bold text-amber-600">Skadon më {a.accreditationTo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CertIcon />} iconColor="text-blue-600" iconBg="bg-blue-50"
          value={stats?.totalCertificates ?? 0} label="Totali i Certifikatave" />
        <StatCard icon={<ProgramIcon />} iconColor="text-green-600" iconBg="bg-green-50"
          value={stats?.totalPrograms ?? 0} label="Programe Trajnimi" />
        <StatCard icon={<MonthIcon />} iconColor="text-violet-600" iconBg="bg-violet-50"
          value={stats?.certificatesThisMonth ?? 0} label="Gjenerime Këtë Muaj" />
        <StatCard icon={<CertIcon />} iconColor="text-amber-600" iconBg="bg-amber-50"
          value={stats?.certificatesThisYear ?? 0} label="Gjenerime Këtë Vit" />
      </div>

      {/* Bottom row: Recent + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent certificates */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Gjenerimet e fundit</h2>
            <button onClick={() => navigate('/certificates')}
              className="text-xs font-bold text-[#00a0e3] hover:underline">
              Shiko të gjitha &gt;
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                {['Pjesëmarrësi', 'Programi', 'Data', 'Veprime'].map(h => (
                  <th key={h} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentCerts.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">Nuk ka certifikata ende.</td></tr>
              ) : recentCerts.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{c.participantFullName}</p>
                    <p className="text-[10px] text-slate-400">#{c.serialNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.trainingName}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{c.issueDate}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => navigate(`/certificates/${c.id}`)}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#00a0e3] transition-all flex items-center justify-center">
                      <EyeIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick generate */}
          <div className="bg-[#00a0e3] rounded-2xl p-6 text-white">
            <h3 className="text-lg font-bold mb-2">Gjenerim i Shpejtë</h3>
            <p className="text-sm text-white/80 mb-5">
              Keni një listë të re pjesëmarrësish? Ngarkoni skedarin Excel për gjenerim masiv.
            </p>
            <button onClick={() => navigate('/certificates/generate')}
              className="w-full flex items-center justify-center gap-2 bg-white text-[#00a0e3] py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all">
              <UploadIcon /> Ngarko Excel
            </button>
          </div>

          {/* System status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">Statusi i Sistemit</h3>
            <div className="space-y-3">
              <StatusRow label="Baza e të dhënave" status="Online" color="text-green-500" />
              <StatusRow label="Shërbimi PDF" status="Aktiv" color="text-green-500" />
              <StatusRow label="Backup-i i fundit" status={new Date().toLocaleDateString('sq-AL') + ', 04:00 AM'} color="text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, iconColor, iconBg, value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function StatusRow({ label, status, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{status}</span>
    </div>
  )
}

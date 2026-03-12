import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCertificates, downloadCertificate } from '../../api/certificates.api'
import { getPrograms } from '../../api/programs.api'
import { useAuth } from '../../context/AuthContext'

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const DownloadSmIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

export default function CertificatesPage() {
  const { isAtLeast } = useAuth()
  const navigate = useNavigate()

  const [certs, setCerts] = useState([])
  const [programs, setPrograms] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const [filters, setFilters] = useState({
    search: '', programId: '', from: '', to: '',
    pageNumber: 1, pageSize: 10,
  })

  useEffect(() => {
    getPrograms({ pageSize: 100 })
      .then(({ data }) => setPrograms(data.items || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )
    getCertificates(params)
      .then(({ data }) => {
        setCerts(data.items || [])
        setTotalCount(data.totalCount || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters])

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, pageNumber: 1 }))

  const handleDownload = async (cert) => {
    setDownloadingId(cert.id)
    try {
      const { data } = await downloadCertificate(cert.id)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${cert.serialNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Shkarkimi dështoi.')
    } finally {
      setDownloadingId(null)
    }
  }

  const totalPages = Math.ceil(totalCount / filters.pageSize)

  return (
    <div>
      {/* Search + Actions bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center gap-3 p-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Kërko me Emër, Program, Numër Serial ose ID Personale..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm border border-transparent focus:border-[#00a0e3]"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 border rounded-xl font-semibold text-sm transition-all
              ${showFilters ? 'bg-blue-50 border-[#00a0e3] text-[#00a0e3]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <FilterIcon /> Filtra
          </button>

          {isAtLeast('User') && (
            <button
              onClick={() => navigate('/certificates/generate')}
              className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-all"
            >
              <DownloadIcon /> + Gjenero
            </button>
          )}
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="px-4 pb-4 flex gap-3 flex-wrap border-t border-slate-100 pt-4">
            <select
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3] min-w-[200px]"
              value={filters.programId}
              onChange={(e) => setFilter('programId', e.target.value)}
            >
              <option value="">Të gjitha programet</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Nga:</span>
              <input type="date"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3]"
                value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Deri:</span>
              <input type="date"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3]"
                value={filters.to} onChange={(e) => setFilter('to', e.target.value)} />
            </div>
            <button
              onClick={() => setFilters({ search: '', programId: '', from: '', to: '', pageNumber: 1, pageSize: 10 })}
              className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              Pastro filtrat
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {['Serial ID', 'Pjesëmarrësi', 'Programi', 'Data', 'Statusi', 'Veprime'].map((h) => (
                <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Duke ngarkuar...</td></tr>
            ) : certs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Nuk u gjetën certifikata.</td></tr>
            ) : certs.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                <td className="px-6 py-4 font-mono text-xs font-bold text-[#00a0e3]">{c.serialNumber}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800 text-sm">{c.participantFirstName} {c.participantLastName}</p>
                  {c.participantPersonalNumber && (
                    <p className="text-[10px] text-slate-400 italic font-medium">ID: {c.participantPersonalNumber}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{c.trainingProgramName}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{c.issueDate}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                    Gjeneruar
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/certificates/${c.id}`)}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#00a0e3] transition-all flex items-center justify-center"
                      title="Shiko"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      onClick={() => handleDownload(c)}
                      disabled={downloadingId === c.id}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#00a0e3] transition-all flex items-center justify-center disabled:opacity-50"
                      title="Shkarko PDF"
                    >
                      <DownloadSmIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-400">{totalCount} certifikata gjithsej</span>
            <div className="flex items-center gap-2">
              <button
                disabled={filters.pageNumber === 1}
                onClick={() => setFilters(p => ({ ...p, pageNumber: p.pageNumber - 1 }))}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Para
              </button>
              <span className="text-sm text-slate-500 px-2">{filters.pageNumber} / {totalPages}</span>
              <button
                disabled={filters.pageNumber === totalPages}
                onClick={() => setFilters(p => ({ ...p, pageNumber: p.pageNumber + 1 }))}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Pas →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

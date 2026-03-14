import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCertificates } from '../../api/certificates.api'
import { getPrograms } from '../../api/programs.api'
import { exportCertificates, printCertificates } from '../../api/reports.api'
import { useAuth } from '../../context/AuthContext'

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const ExcelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
)
const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)

const columns = [
  { key: 'serialNumber', label: 'Nr. Rendor' },
  { key: 'issueDate', label: 'Data e Lëshimit' },
  { key: 'trainingCode', label: 'Kodi' },
  { key: 'trainingName', label: 'Emri i Trajnimit' },
  { key: 'participantFullName', label: 'Emri dhe Mbiemri' },
  { key: 'personalNumber', label: 'Nr. Personal' },
  { key: 'trainingGroup', label: 'Grupi' },
  { key: 'gender', label: 'Gjinia' },
  { key: 'position', label: 'Pozita' },
  { key: 'subject', label: 'Lënda' },
  { key: 'institutionName', label: 'Institucioni' },
  { key: 'institutionLocation', label: 'Vendi' },
  { key: 'municipality', label: 'Komuna' },
  { key: 'institutionType', label: 'Tipi' },
  { key: 'trainingDates', label: 'Datat e Trajnimit' },
]

export default function CertificatesPage() {
  useAuth()
  const navigate = useNavigate()

  const [certs, setCerts] = useState([])
  const [programs, setPrograms] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [filters, setFilters] = useState({
    search: '', programId: '', from: '', to: '',
    fromSerial: '', toSerial: '',
    pageNumber: 1, pageSize: 20,
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

  const getExportParams = () => {
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.programId) params.programId = filters.programId
    if (filters.from) params.fromDate = filters.from
    if (filters.to) params.toDate = filters.to
    if (filters.fromSerial) params.fromSerial = filters.fromSerial
    if (filters.toSerial) params.toSerial = filters.toSerial
    return params
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const { data } = await exportCertificates({ ...getExportParams(), format: 'xlsx' })
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `certifikata_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Eksportimi dështoi.')
    } finally {
      setExporting(false)
    }
  }

  const handlePrintPdf = async () => {
    setExporting(true)
    try {
      const { data } = await printCertificates(getExportParams())
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch {
      alert('Printimi dështoi.')
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => setFilters({
    search: '', programId: '', from: '', to: '',
    fromSerial: '', toSerial: '',
    pageNumber: 1, pageSize: 20,
  })

  const totalPages = Math.ceil(totalCount / filters.pageSize)
  const hasActiveFilters = filters.search || filters.programId || filters.from || filters.to || filters.fromSerial || filters.toSerial

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
              placeholder="Kërko me Emër, Kod Trajnimi, Numër Serial ose ID Personale..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm border border-transparent focus:border-[#00a0e3]"
            />
          </div>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
            title="Eksporto në Excel"
          >
            <ExcelIcon /> Excel
          </button>

          {/* Print PDF */}
          <button
            onClick={handlePrintPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
            title="Printo certifikatat (PDF)"
          >
            <PrintIcon /> Print
          </button>

        </div>

        {/* Filters */}
        <div className="px-4 pb-4 border-t border-slate-100 pt-4">
            <div className="flex gap-3 flex-wrap items-end">
              {/* Program filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Programi</label>
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
              </div>

              {/* Serial number range */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nr. Serial Nga</label>
                <input
                  type="number"
                  placeholder="p.sh. 35001"
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3] w-[130px]"
                  value={filters.fromSerial}
                  onChange={(e) => setFilter('fromSerial', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nr. Serial Deri</label>
                <input
                  type="number"
                  placeholder="p.sh. 36000"
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3] w-[130px]"
                  value={filters.toSerial}
                  onChange={(e) => setFilter('toSerial', e.target.value)}
                />
              </div>

              {/* Date range */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Nga</label>
                <input type="date"
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3]"
                  value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Deri</label>
                <input type="date"
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3]"
                  value={filters.to} onChange={(e) => setFilter('to', e.target.value)} />
              </div>

              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Pastro filtrat
              </button>
            </div>
          </div>
      </div>

      {/* Active filter info */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {totalCount} certifikata të filtruara — Eksporti/Printimi do të përfshijë vetëm këto rezultate
          </span>
          <button onClick={clearFilters} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
            Largo filtrat
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1400px]">
            <thead>
              <tr className="border-b border-slate-100">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="px-6 py-12 text-center text-sm text-slate-400">Duke ngarkuar...</td></tr>
              ) : certs.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="px-6 py-12 text-center text-sm text-slate-400">Nuk u gjetën certifikata.</td></tr>
              ) : certs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#00a0e3] whitespace-nowrap">{c.serialNumber}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.issueDate}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{c.trainingCode}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px] truncate">{c.trainingName}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">{c.participantFullName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.personalNumber || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.trainingGroup || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.gender || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.position || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{c.subject || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{c.institutionName || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.institutionLocation || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.municipality || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.institutionType || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.trainingDates || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/certificates/${c.id}`)}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#00a0e3] transition-all flex items-center justify-center"
                      title="Shiko detajet"
                    >
                      <EyeIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

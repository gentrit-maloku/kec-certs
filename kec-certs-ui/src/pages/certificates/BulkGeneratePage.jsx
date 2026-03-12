import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bulkGenerateCertificates } from '../../api/certificates.api'
import { getPrograms } from '../../api/programs.api'

const UploadIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const SpreadsheetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)

export default function BulkGeneratePage() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [programId, setProgramId] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    getPrograms({ pageSize: 100, isActive: true })
      .then(({ data }) => setPrograms(data.items || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Ju lutemi zgjidhni një skedar Excel.')
    if (!programId) return setError('Ju lutemi zgjidhni një program trajnimi.')
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const { data } = await bulkGenerateCertificates(file, programId)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Gjenerimi masiv dështoi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 w-fit mx-auto mb-8 shadow-sm">
        <button
          onClick={() => navigate('/certificates/generate')}
          className="px-8 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all"
        >
          Regjistrim Manual
        </button>
        <button className="px-8 py-3 rounded-xl font-bold text-sm bg-[#00a0e3] text-white shadow-lg shadow-blue-100 transition-all">
          Gjenerim Masiv (Excel)
        </button>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto p-10">

          {/* Card header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <SpreadsheetIcon />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Gjenerim Masiv</h3>
              <p className="text-sm text-slate-400">Ngarkoni skedarin Excel me listën e pjesëmarrësve</p>
            </div>
          </div>

          {/* Program selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Programi i Trajnimit *
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
            >
              <option value="">Zgjidh një program...</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Dropzone */}
          <div
            className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group mb-8
              ${file ? 'border-[#00a0e3] bg-blue-50/30' : 'border-slate-200 hover:border-[#00a0e3] hover:bg-blue-50/20'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
          >
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-blue-100 text-[#00a0e3] rounded-2xl flex items-center justify-center">
                  <SpreadsheetIcon />
                </div>
                <p className="font-bold text-slate-800">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                >
                  Largo skedarin
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-[#00a0e3] transition-all">
                  <UploadIcon />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Zgjidhni skedarin Excel</h4>
                <p className="text-sm text-slate-400 max-w-xs mb-8">
                  Tërhiqni skedarin këtu ose klikoni për të kërkuar në kompjuter
                </p>
                <div className="flex items-center gap-4">
                  <label className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-700 transition-all">
                    Zgjidh Skedarin
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                  </label>
                  <button
                    type="button"
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                  >
                    Shkarko Shablonin
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Udhëzime për Formatin</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Skedari duhet të jetë në formatin .xlsx ose .csv',
                'Kolonat e detyrueshme: Emri, Mbiemri, Programi, Data',
                'Sistemi do të gjenerojë automatikisht numrat serialë',
                'Pas ngarkimit, do të keni mundësi të rishikoni të dhënat',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="w-5 h-5 bg-blue-100 text-[#00a0e3] rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                    {i + 1}
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-[#00a0e3] hover:bg-[#008cc7] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Duke ngarkuar...' : 'Ngarko & Gjenero'}
          </button>
        </form>
      ) : (
        /* Result panel */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-2xl mx-auto p-10">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Gjenerimi u Krye</h2>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Gjithsej', value: result.totalCount, color: 'text-slate-800' },
              { label: 'Sukses', value: result.successCount, color: 'text-green-600' },
              { label: 'Gabime', value: result.errorCount, color: result.errorCount > 0 ? 'text-red-500' : 'text-slate-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-2xl p-5 flex flex-col items-center gap-1">
                <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>

          {result.errors?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-bold text-slate-600 mb-3">Rreshtat me gabime:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-red-50 rounded-lg">
                    <span className="font-bold text-slate-500 min-w-[60px]">Rreshti {e.row}</span>
                    <span className="text-red-600">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-all"
            onClick={() => navigate('/certificates')}
          >
            Shiko Certifikatat
          </button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { importCertificates } from '../../api/certificates.api'
import { toast } from 'sonner'

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

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

export default function GenerateCertificatePage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Ju lutemi zgjidhni një skedar Excel.')
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const { data } = await importCertificates(file, true)
      if (data.successCount > 0) {
        toast.success('Importimi u realizua me sukses!')
      } else if (data.errorCount > 0) {
        toast.error('Importimi dështoi. Kontrolloni kolonat e detyrueshme (A, B, C, D, E).')
      } else if (data.warningCount > 0) {
        toast.warning('Ky person është certifikuar më herët për këtë program.')
      }

    } catch (err) {
      toast.error(err.response?.data?.detail || 'Importimi dështoi.')
      setError(err.response?.data?.detail || err.response?.data?.error || 'Importimi dështoi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {!result ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto p-10">

          {/* Card header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <SpreadsheetIcon />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Gjenero Certifikata</h3>
              <p className="text-sm text-slate-400">Ngarkoni skedarin Excel me të dhënat e trajnimit</p>
            </div>
          </div>

          {/* Required fields note */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Fushat e detyrueshme në Excel:</p>
            <div className="flex flex-wrap gap-2">
              {['Numri rendor (A)', 'Data e lëshimit (B) - DD.MM.YYYY', 'Kodi i trajnimit (C)', 'Emri i trajnimit (D)', 'Emri dhe mbiemri (E)'].map((f, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">
                  {f}
                </span>
              ))}
            </div>
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
                <h4 className="text-lg font-bold text-slate-800 mb-6">Zgjidhni skedarin Excel</h4>
                <label className="px-6 py-2 bg-[#00a0e3] hover:bg-[#008cc7] text-white rounded-xl text-sm font-bold cursor-pointer transition-all">
                  Zgjidh Skedarin
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </>
            )}
          </div>

          {error && (
            <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-[#1e293b] hover:bg-[#263548] text-white py-4 rounded-2xl font-bold transition-all disabled:cursor-not-allowed"
          >
            {loading ? 'Duke importuar...' : 'Importo & Gjenero Certifikata'}
          </button>
        </form>
      ) : (
        /* Result panel */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-3xl mx-auto p-10">
          {result.successCount === 0 && result.errorCount > 0 ? (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p className="font-bold text-red-700 text-sm">Importimi Dështoi</p>
                <p className="text-red-600 text-sm mt-0.5">
                  Asnjë certifikatë nuk u importua. Sigurohuni që kolonat e detyrueshme janë të mbushura në Excel:
                  <span className="font-bold"> Numri rendor (A), Data e lëshimit (B) - DD.MM.YYYY, Kodi i trajnimit (C), Emri i trajnimit (D), Emri dhe mbiemri (E)</span>.
                </p>
              </div>
            </div>
          ) : (
            <h2 className="text-xl font-bold text-slate-800 mb-6">Importimi u Krye</h2>
          )}

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

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                <WarningIcon /> Paralajmërime ({result.warningCount}):
              </p>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-amber-50 rounded-lg">
                    <span className="font-bold text-slate-500 min-w-[80px] shrink-0">Rreshti {w.row}</span>
                    <span className="font-medium text-slate-400 min-w-[120px] shrink-0">{w.field}</span>
                    <span className="text-amber-700">{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-bold text-red-600 mb-3">Gabime ({result.errorCount}):</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 bg-red-50 rounded-lg">
                    <span className="font-bold text-slate-500 min-w-[80px] shrink-0">Rreshti {e.row}</span>
                    <span className="font-medium text-slate-400 min-w-[120px] shrink-0">{e.field}</span>
                    <span className="text-red-600">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-all"
              onClick={() => navigate('/certificates')}
            >
              Shiko Certifikatat
            </button>
            <button
              className="px-8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold transition-all"
              onClick={() => { setResult(null); setFile(null) }}
            >
              Importo Sërish
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

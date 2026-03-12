import { useEffect, useState } from 'react'
import { getTemplates, createTemplate, activateTemplate } from '../../api/templates.api'
import { getPrograms } from '../../api/programs.api'

const DEFAULT_PLACEHOLDERS = ['Emri', 'Mbiemri', 'Programi', 'Data', 'Nota', 'NumriSerial']

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [programs, setPrograms] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', trainingProgramId: '',
    placeholders: [...DEFAULT_PLACEHOLDERS], file: null,
  })
  const [newPlaceholder, setNewPlaceholder] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [activateModal, setActivateModal] = useState(null)
  const [activateProgramId, setActivateProgramId] = useState('')
  const [activating, setActivating] = useState(false)

  const load = () => {
    setLoading(true)
    getTemplates({ pageNumber, pageSize })
      .then(({ data }) => {
        setTemplates(data.items || [])
        setTotalCount(data.totalCount || 0)
      })
      .catch(() => setError('Ngarkimi i shablloneve dështoi.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [pageNumber])

  useEffect(() => {
    getPrograms({ pageSize: 100 })
      .then(({ data }) => setPrograms(data.items || []))
      .catch(() => {})
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!form.file) return setFormError('Ju lutem zgjidhni një skedar.')
    setFormError('')
    setSaving(true)
    try {
      await createTemplate(form)
      setShowUpload(false)
      setForm({ name: '', description: '', trainingProgramId: '', placeholders: [...DEFAULT_PLACEHOLDERS], file: null })
      load()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.detail || 'Ngarkimi dështoi.'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (e) => {
    e.preventDefault()
    if (!activateProgramId) return
    setActivating(true)
    try {
      await activateTemplate(activateModal.id, activateProgramId)
      setActivateModal(null)
      load()
    } catch {
      alert('Aktivizimi dështoi.')
    } finally {
      setActivating(false)
    }
  }

  const addPlaceholder = () => {
    const val = newPlaceholder.trim()
    if (!val || form.placeholders.includes(val)) return
    setForm(f => ({ ...f, placeholders: [...f.placeholders, val] }))
    setNewPlaceholder('')
  }

  const removePlaceholder = (p) =>
    setForm(f => ({ ...f, placeholders: f.placeholders.filter(x => x !== p) }))

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Shablllonet e Certifikatave</h1>
          <p className="text-sm text-slate-400 mt-1">Menaxhoni formatet dhe fushat dinamike</p>
        </div>
        <button
          onClick={() => { setShowUpload(true); setFormError('') }}
          className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          + Shto Shabllon
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-slate-400">Duke ngarkuar...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-16 text-center text-sm text-slate-400">
          Nuk u gjetën shabllone.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">

              {/* Preview image area */}
              <div className="relative h-40 bg-slate-100 overflow-hidden">
                {t.previewUrl ? (
                  <img src={t.previewUrl} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                )}
                {/* Active badge */}
                {t.isActive && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    Aktiv
                  </span>
                )}
              </div>

              {/* Card content */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{t.name}</p>
                    {t.placeholders?.length > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Placeholders: {t.placeholders.length} fusha aktive
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setActivateModal(t); setActivateProgramId('') }}
                    className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#00a0e3] transition-all flex items-center justify-center shrink-0"
                    title="Aktivizo për program"
                  >
                    <EditIcon />
                  </button>
                </div>

                {/* Placeholder tags */}
                {t.placeholders?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {t.placeholders.slice(0, 4).map((p) => (
                      <span key={p} className="px-2 py-0.5 bg-blue-50 text-[#00a0e3] text-[10px] font-bold rounded-lg font-mono">
                        {'{{'}{p}{'}}'}
                      </span>
                    ))}
                    {t.placeholders.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-lg">
                        +{t.placeholders.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Program */}
                {t.trainingProgramName && (
                  <p className="text-[11px] text-slate-400 font-medium mt-auto">
                    Program: <span className="text-slate-600">{t.trainingProgramName}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-sm text-slate-400">{totalCount} shabllone gjithsej</span>
          <div className="flex items-center gap-2">
            <button
              disabled={pageNumber === 1}
              onClick={() => setPageNumber(p => p - 1)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Para
            </button>
            <span className="text-sm text-slate-500 px-2">{pageNumber} / {totalPages}</span>
            <button
              disabled={pageNumber === totalPages}
              onClick={() => setPageNumber(p => p + 1)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pas →
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">Shto Shabllon të Ri</h2>
              <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all">
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Emërtimi *</label>
                <input required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Emri i shabllonit"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Programi</label>
                <select value={form.trainingProgramId}
                  onChange={e => setForm(f => ({ ...f, trainingProgramId: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
                >
                  <option value="">Asnjë</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Placeholders</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.placeholders.map(p => (
                    <button key={p} type="button" onClick={() => removePlaceholder(p)}
                      className="px-2 py-0.5 bg-blue-50 text-[#00a0e3] text-[10px] font-bold rounded-lg font-mono hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      {'{{'}{p}{'}}'} ×
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newPlaceholder}
                    onChange={e => setNewPlaceholder(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPlaceholder())}
                    placeholder="Shto placeholder..."
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
                  />
                  <button type="button" onClick={addPlaceholder}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                  >
                    Shto
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skedari * (.docx, .pdf)</label>
                <input type="file" accept=".docx,.pdf" required
                  onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))}
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all"
                />
              </div>

              {formError && (
                <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUpload(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Anulo
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-70"
                >
                  <UploadIcon />
                  {saving ? 'Duke ngarkuar...' : 'Ngarko'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activate Modal */}
      {activateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setActivateModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800">Aktivizo Shabllonin</h2>
              <button onClick={() => setActivateModal(null)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all">
                <XIcon />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Aktivizo <span className="font-bold text-slate-700">{activateModal.name}</span> për programin:
            </p>
            <form onSubmit={handleActivate} className="space-y-4">
              <select required value={activateProgramId}
                onChange={e => setActivateProgramId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
              >
                <option value="">Zgjidh programin...</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setActivateModal(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Anulo
                </button>
                <button type="submit" disabled={activating}
                  className="px-5 py-2.5 bg-[#00a0e3] hover:bg-[#008cc7] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-70 shadow-[0_4px_12px_rgba(0,160,227,0.25)]"
                >
                  {activating ? 'Duke aktivizuar...' : 'Aktivizo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

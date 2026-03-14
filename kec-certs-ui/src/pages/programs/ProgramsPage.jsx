import { useEffect, useState } from 'react'
import { getPrograms, createProgram, updateProgram, deleteProgram, importPrograms } from '../../api/programs.api'
import { notify as toast } from '../../lib/notify'

const EMPTY_FORM = {
  code: '', name: '', description: '', numberOfHours: '',
  registrationDate: '', status: '', accreditationFrom: '', accreditationTo: ''
}

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const WarningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

function getAccreditationStatus(from, to) {
  if (!to) return null
  const today = new Date().toISOString().slice(0, 10)
  const toDate = to
  if (toDate < today) return 'expired'
  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  if (toDate <= soon) return 'expiring'
  return 'valid'
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteModal, setDeleteModal] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)

  const load = () => {
    setLoading(true)
    getPrograms({ pageNumber, pageSize })
      .then(({ data }) => {
        setPrograms(data.items || [])
        setTotalCount(data.totalCount || 0)
      })
      .catch(() => setError('Ngarkimi i programeve dështoi.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [pageNumber])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setModal('create')
  }

  const openEdit = (p) => {
    setForm({
      code: p.code, name: p.name, description: p.description || '',
      numberOfHours: p.numberOfHours ?? '', registrationDate: p.registrationDate || '',
      status: p.status || '', accreditationFrom: p.accreditationFrom || '',
      accreditationTo: p.accreditationTo || ''
    })
    setFormError('')
    setModal(p)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        numberOfHours: form.numberOfHours ? parseInt(form.numberOfHours) : null,
        registrationDate: form.registrationDate || null,
        accreditationFrom: form.accreditationFrom || null,
        accreditationTo: form.accreditationTo || null,
        status: form.status || null,
      }
      if (modal === 'create') {
        await createProgram(payload)
      } else {
        await updateProgram(modal.id, { ...payload, isActive: modal.isActive })
      }
      setModal(null)
      load()
      toast.success(modal === 'create' ? 'Programi u krijua!' : 'Programi u përditësua!')
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.detail || err.response?.data?.message || 'Ruajtja dështoi.'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProgram(deleteModal.id)
      setDeleteModal(null)
      load()
      toast.success('Programi u fshi me sukses!')
    } catch { toast.error('Fshirja dështoi.') }
    finally { setDeleting(false) }
  }

  const toggleActive = async (p) => {
    try {
      await updateProgram(p.id, {
        name: p.name, description: p.description, isActive: !p.isActive,
        numberOfHours: p.numberOfHours, registrationDate: p.registrationDate,
        status: p.status, accreditationFrom: p.accreditationFrom, accreditationTo: p.accreditationTo
      })
      load()
    } catch { toast.error('Ndryshimi i statusit dështoi.') }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importFile) return
    setImporting(true)
    try {
      const { data } = await importPrograms(importFile)
      setShowImport(false)
      setImportFile(null)
      load()
      const { created, updated, errors } = data
      if (errors?.length > 0) {
        toast.error(errors[0])
      } else {
        toast.success(`Importimi u krye! ${created} të reja, ${updated} të përditësuara.`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Importimi dështoi.')
    } finally {
      setImporting(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4">
      {showImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">Importo Programe nga Excel</h2>
              <button onClick={() => setShowImport(false)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"><XIcon /></button>
            </div>
            <form onSubmit={handleImport} className="space-y-4">
              {importFile ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-sm font-medium text-slate-700">{importFile.name}</span>
                  <button type="button" onClick={() => setImportFile(null)} className="text-red-400 hover:text-red-600 text-xs ml-auto">Largo</button>
                </div>
              ) : (
                <label className="flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#00a0e3] hover:bg-blue-50/20 transition-all">
                  <span className="text-sm text-slate-400">Klikoni për të zgjedhur skedarin Excel</span>
                  <input type="file" className="hidden" accept=".xlsx,.xls" onChange={e => setImportFile(e.target.files[0])} />
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={importing || !importFile}
                  className="px-6 py-3 bg-[#1e293b] hover:bg-[#263548] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60">
                  {importing ? 'Duke importuar...' : 'Importo'}
                </button>
                <button type="button" onClick={() => setShowImport(false)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50">
                  Anulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Programet e Trajnimit</h1>
          <p className="text-sm text-slate-400 mt-1">Menaxhoni listën e programeve të trajnimit</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#1e293b]/10 border border-[#1e293b]/20 hover:bg-[#1e293b]/20 text-[#1e293b] rounded-xl font-bold text-sm transition-all">
            <UploadIcon /> Importo Excel
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-3 bg-[#1e293b] hover:bg-[#263548] text-white rounded-xl font-bold text-sm transition-all shadow-sm">
            + Shto Program
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {error && <div className="px-6 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100">
                {['Kodi', 'Emërtimi', 'Orët', 'Data Regj.', 'Statusi', 'Akreditimi (nga-deri)', 'Aktiv', 'Veprime'].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">Duke ngarkuar...</td></tr>
              ) : programs.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">Nuk u gjetën programe.</td></tr>
              ) : programs.map(p => {
                const accStatus = getAccreditationStatus(p.accreditationFrom, p.accreditationTo)
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-[#00a0e3] bg-blue-50 px-2.5 py-1 rounded-lg">{p.code}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      {p.description && <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{p.numberOfHours ?? '—'}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{p.registrationDate || '—'}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{p.status || '—'}</td>
                    <td className="px-5 py-4">
                      {p.accreditationFrom || p.accreditationTo ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">{p.accreditationFrom || '?'} — {p.accreditationTo || '?'}</span>
                          {accStatus === 'expired' && (
                            <span className="ml-1 px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-bold rounded-full uppercase flex items-center gap-1">
                              <WarningIcon /> Skaduar
                            </span>
                          )}
                          {accStatus === 'expiring' && (
                            <span className="ml-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded-full uppercase flex items-center gap-1">
                              <WarningIcon /> Skadon së shpejti
                            </span>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(p)} title="Kliko për të ndryshuar"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                          ${p.isActive ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                        {p.isActive ? 'Aktiv' : 'Joaktiv'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)}
                          className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#00a0e3] transition-all flex items-center justify-center" title="Ndrysho">
                          <EditIcon />
                        </button>
                        <button onClick={() => setDeleteModal(p)}
                          className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center" title="Fshi">
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-400">{totalCount} programe gjithsej</span>
            <div className="flex items-center gap-2">
              <button disabled={pageNumber === 1} onClick={() => setPageNumber(p => p - 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Para</button>
              <span className="text-sm text-slate-500 px-2">{pageNumber} / {totalPages}</span>
              <button disabled={pageNumber === totalPages} onClick={() => setPageNumber(p => p + 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Pas →</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">Fshi Programin</h2>
              <button onClick={() => setDeleteModal(null)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"><XIcon /></button>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Jeni të sigurt që dëshironi të fshini programin <strong>{deleteModal.name}</strong> ({deleteModal.code})? Ky veprim nuk mund të kthehet.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Anulo</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-70">
                {deleting ? 'Duke fshirë...' : 'Fshi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">
                {modal === 'create' ? 'Shto Program të Ri' : `Ndrysho — ${modal.name}`}
              </h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"><XIcon /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kodi *</label>
                  <input required value={form.code} disabled={modal !== 'create'}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="p.sh. IT-101"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Emërtimi *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Numri i Orëve</label>
                  <input type="number" value={form.numberOfHours} onChange={e => setForm(f => ({ ...f, numberOfHours: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data e Regjistrimit</label>
                  <input type="date" value={form.registrationDate} onChange={e => setForm(f => ({ ...f, registrationDate: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Statusi</label>
                <input value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} placeholder="p.sh. Aktiv, I pezulluar"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Akreditimi Nga</label>
                  <input type="date" value={form.accreditationFrom} onChange={e => setForm(f => ({ ...f, accreditationFrom: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Akreditimi Deri</label>
                  <input type="date" value={form.accreditationTo} onChange={e => setForm(f => ({ ...f, accreditationTo: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Përshkrimi</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Opsionale"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm resize-none" />
              </div>

              {formError && <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Anulo</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-[#1e293b] hover:bg-[#263548] text-white rounded-xl text-sm font-bold disabled:opacity-70">
                  {saving ? 'Duke ruajtur...' : 'Ruaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

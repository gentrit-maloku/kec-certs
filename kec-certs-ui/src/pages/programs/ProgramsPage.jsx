import { useEffect, useState } from 'react'
import { getPrograms, createProgram, updateProgram } from '../../api/programs.api'

const EMPTY_FORM = { code: '', name: '', description: '' }

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
    setForm({ code: p.code, name: p.name, description: p.description || '' })
    setFormError('')
    setModal(p)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      if (modal === 'create') {
        await createProgram(form)
      } else {
        await updateProgram(modal.id, {
          name: form.name,
          description: form.description,
          isActive: modal.isActive,
        })
      }
      setModal(null)
      load()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.detail || 'Ruajtja dështoi.'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (p) => {
    try {
      await updateProgram(p.id, { name: p.name, description: p.description, isActive: !p.isActive })
      load()
    } catch {
      alert('Ndryshimi i statusit dështoi.')
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Programet e Trajnimit</h1>
          <p className="text-sm text-slate-400 mt-1">Menaxhoni listën e programeve dhe shablllonet përkatëse</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          + Shto Program
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {error && (
          <div className="px-6 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100">{error}</div>
        )}

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {['Kodi', 'Emërtimi i Programit', 'Shabllon Aktiv', 'Certifikata të Lëshuara', 'Statusi', 'Veprime'].map((h) => (
                <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Duke ngarkuar...</td></tr>
            ) : programs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Nuk u gjetën programe.</td></tr>
            ) : programs.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-[#00a0e3] bg-blue-50 px-2.5 py-1 rounded-lg">
                    {p.code}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                  {p.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {p.activeTemplateName
                    ? <span className="font-medium text-slate-700">{p.activeTemplateName}</span>
                    : <span className="italic text-slate-300">—</span>
                  }
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-slate-800 text-sm">{p.certificateCount}</span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(p)}
                    title="Kliko për të ndryshuar statusin"
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                      ${p.isActive
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                  >
                    {p.isActive ? 'Aktiv' : 'Joaktiv'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openEdit(p)}
                    className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#00a0e3] transition-all flex items-center justify-center"
                    title="Ndrysho"
                  >
                    <EditIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-400">{totalCount} programe gjithsej</span>
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
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">
                {modal === 'create' ? 'Shto Program të Ri' : `Ndrysho — ${modal.name}`}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all"
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {modal === 'create' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kodi *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="p.sh. IT-101"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Emërtimi *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Emri i programit"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Përshkrimi</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Opsionale"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm resize-none"
                />
              </div>

              {formError && (
                <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
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

import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users.api'
import { useAuth } from '../../context/AuthContext'
import { notify as toast } from '../../lib/notify'

const ROLES = ['Viewer', 'User', 'Admin', 'SuperAdmin']
const ROLE_TO_INT = { Viewer: 0, User: 1, Admin: 2, SuperAdmin: 3 }
const EMPTY_CREATE = { email: '', firstName: '', lastName: '', password: '', role: 'User' }
const EMPTY_EDIT   = { email: '', firstName: '', lastName: '', role: 'User', isActive: true }

const ROLE_NAMES = { 0: 'Viewer', 1: 'User', 2: 'Admin', 3: 'SuperAdmin' }
function roleName(role) {
  return ROLE_NAMES[role] ?? ROLE_NAMES[String(role)] ?? role
}

const ROLE_COLORS = {
  SuperAdmin: 'bg-amber-50 text-amber-600',
  Admin:      'bg-violet-50 text-violet-600',
  User:       'bg-blue-50 text-blue-600',
  Viewer:     'bg-slate-100 text-slate-500',
}

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal]     = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)

  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [editForm, setEditForm]     = useState(EMPTY_EDIT)
  const [formError, setFormError]   = useState('')
  const [saving, setSaving]         = useState(false)

  const load = () => {
    setLoading(true)
    getUsers({ pageNumber, pageSize })
      .then(({ data }) => {
        setUsers(data.items || [])
        setTotalCount(data.totalCount || 0)
      })
      .catch(() => toast.error('Ngarkimi i përdoruesve dështoi.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [pageNumber])

  const openEdit = (u) => {
    setEditForm({ email: u.email, firstName: u.firstName, lastName: u.lastName, role: roleName(u.role), isActive: u.isActive })
    setFormError('')
    setEditModal(u)
  }

  const extractError = (err) =>
    err.response?.data?.error ||
    (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : null) ||
    err.response?.data?.detail || 'Ruajtja dështoi.'

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await createUser({ ...createForm, role: ROLE_TO_INT[createForm.role] ?? createForm.role })
      setCreateModal(false)
      setCreateForm(EMPTY_CREATE)
      load()
      toast.success('Përdoruesi u krijua!')
    } catch (err) { setFormError(extractError(err)) }
    finally { setSaving(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await updateUser(editModal.id, { ...editForm, role: ROLE_TO_INT[editForm.role] ?? editForm.role })
      setEditModal(null)
      load()
      toast.success('Përdoruesi u përditësua!')
    } catch (err) { setFormError(extractError(err)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteUser(deleteModal.id)
      setDeleteModal(null)
      load()
      toast.success('Përdoruesi u fshi!')
    } catch { toast.error('Fshirja dështoi.') }
    finally { setSaving(false) }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Përdoruesit</h1>
          <p className="text-sm text-slate-400 mt-1">Menaxhoni përdoruesit e sistemit</p>
        </div>
        <button onClick={() => { setCreateModal(true); setFormError('') }}
          className="flex items-center gap-2 px-5 py-3 bg-[#1e293b] hover:bg-[#263548] text-white rounded-xl font-bold text-sm transition-all shadow-sm">
          + Përdorues i Ri
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {['Emri', 'Email', 'Roli', 'Statusi', 'Krijuar', 'Veprime'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Duke ngarkuar...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Nuk u gjetën përdorues.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-4">
                  <span className="font-bold text-slate-800 text-sm">{u.firstName} {u.lastName}</span>
                  {u.id === currentUser?.id && (
                    <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">ju</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{u.email}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[roleName(u.role)] || ROLE_COLORS.Viewer}`}>
                    {roleName(u.role)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    {u.isActive ? 'Aktiv' : 'Joaktiv'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString('sq-AL')}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(u)}
                      className="text-xs font-bold text-[#00a0e3] hover:underline">Ndrysho</button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => setDeleteModal(u)}
                        className="text-xs font-bold text-red-500 hover:underline">Fshi</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-400">{totalCount} përdorues gjithsej</span>
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

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">Shto Përdorues të Ri</h2>
              <button onClick={() => setCreateModal(false)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"><XIcon /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Emri *</label>
                  <input required value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mbiemri *</label>
                  <input required value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email *</label>
                <input type="email" required value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fjalëkalimi *</label>
                <input type="password" required value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                <p className="text-xs text-slate-400 mt-1">Min 8 karaktere · 1 shkronjë e madhe (A-Z) · 1 e vogël (a-z)</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Roli *</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {formError && <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCreateModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Anulo</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-[#1e293b] hover:bg-[#263548] text-white rounded-xl text-sm font-bold disabled:opacity-70">
                  {saving ? 'Duke ruajtur...' : 'Krijo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">Ndrysho — {editModal.firstName} {editModal.lastName}</h2>
              <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"><XIcon /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Emri *</label>
                  <input required value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mbiemri *</label>
                  <input required value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email *</label>
                <input type="email" required value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Roli *</label>
                  <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Statusi</label>
                  <select value={editForm.isActive ? 'true' : 'false'} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm">
                    <option value="true">Aktiv</option>
                    <option value="false">Joaktiv</option>
                  </select>
                </div>
              </div>
              {formError && <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(null)}
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

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800">Fshi Përdoruesin</h2>
              <button onClick={() => setDeleteModal(null)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"><XIcon /></button>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Jeni të sigurt që dëshironi të fshini <strong>{deleteModal.firstName} {deleteModal.lastName}</strong>? Ky veprim nuk mund të kthehet.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Anulo</button>
              <button onClick={handleDelete} disabled={saving}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-70">
                {saving ? 'Duke fshirë...' : 'Fshi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

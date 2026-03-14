import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users.api'
import { useAuth } from '../../context/AuthContext'

const ROLES = ['Viewer', 'User', 'Admin', 'SuperAdmin']

const EMPTY_CREATE = { email: '', firstName: '', lastName: '', password: '', role: 'User' }
const EMPTY_EDIT   = { email: '', firstName: '', lastName: '', role: 'User', isActive: true }

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState(null)   // user object
  const [deleteModal, setDeleteModal] = useState(null) // user object

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
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [pageNumber])

  const openEdit = (u) => {
    setEditForm({ email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, isActive: u.isActive })
    setFormError('')
    setEditModal(u)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await createUser(createForm)
      setCreateModal(false)
      setCreateForm(EMPTY_CREATE)
      load()
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await updateUser(editModal.id, editForm)
      setEditModal(null)
      load()
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteUser(deleteModal.id)
      setDeleteModal(null)
      load()
    } catch {
      alert('Failed to delete user.')
    } finally {
      setSaving(false)
    }
  }

  const extractError = (err) =>
    err.response?.data?.errors
      ? Object.values(err.response.data.errors).flat().join(' ')
      : err.response?.data?.detail || 'Failed to save.'

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.heading}>Users</h1>
        <button style={styles.btnPrimary} onClick={() => { setCreateModal(true); setFormError('') }}>
          + New User
        </button>
      </div>

      <div style={styles.tableCard}>
        {error && <p style={styles.errorBanner}>{error}</p>}
        {loading ? (
          <p style={styles.message}>Loading...</p>
        ) : users.length === 0 ? (
          <p style={styles.message}>No users found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Created', ''].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.name}>{u.firstName} {u.lastName}</span>
                    {u.id === currentUser?.id && <span style={styles.you}>you</span>}
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.roleBadge, ...roleColor(u.role) }}>{u.role}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: u.isActive ? '#dcfce7' : '#f3f4f6',
                      color: u.isActive ? '#16a34a' : '#6b7280',
                    }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <div style={styles.rowActions}>
                      <button style={styles.linkBtn} onClick={() => openEdit(u)}>Edit</button>
                      {u.id !== currentUser?.id && (
                        <button style={{ ...styles.linkBtn, color: '#dc2626' }} onClick={() => setDeleteModal(u)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button style={styles.pageBtn} disabled={pageNumber === 1} onClick={() => setPageNumber(p => p - 1)}>← Prev</button>
            <span style={styles.pageInfo}>Page {pageNumber} of {totalPages} ({totalCount} total)</span>
            <button style={styles.pageBtn} disabled={pageNumber === totalPages} onClick={() => setPageNumber(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createModal && (
        <Modal title="New User" onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate} style={styles.form}>
            <Row>
              <Field label="First Name *">
                <input style={styles.input} required value={createForm.firstName}
                  onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} />
              </Field>
              <Field label="Last Name *">
                <input style={styles.input} required value={createForm.lastName}
                  onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} />
              </Field>
            </Row>
            <Field label="Email *">
              <input type="email" style={styles.input} required value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Password *">
              <input type="password" style={styles.input} required value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 characters" />
            </Field>
            <Field label="Role *">
              <select style={styles.input} value={createForm.role}
                onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            {formError && <p style={styles.formError}>{formError}</p>}
            <ModalFooter onCancel={() => setCreateModal(false)} saving={saving} label="Create User" />
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title={`Edit — ${editModal.firstName} ${editModal.lastName}`} onClose={() => setEditModal(null)}>
          <form onSubmit={handleEdit} style={styles.form}>
            <Row>
              <Field label="First Name *">
                <input style={styles.input} required value={editForm.firstName}
                  onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              </Field>
              <Field label="Last Name *">
                <input style={styles.input} required value={editForm.lastName}
                  onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              </Field>
            </Row>
            <Field label="Email *">
              <input type="email" style={styles.input} required value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Row>
              <Field label="Role *">
                <select style={styles.input} value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select style={styles.input} value={editForm.isActive ? 'true' : 'false'}
                  onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
            </Row>
            {formError && <p style={styles.formError}>{formError}</p>}
            <ModalFooter onCancel={() => setEditModal(null)} saving={saving} label="Save Changes" />
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <Modal title="Delete User" onClose={() => setDeleteModal(null)}>
          <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
            Are you sure you want to delete <strong>{deleteModal.firstName} {deleteModal.lastName}</strong>?
            This action cannot be undone.
          </p>
          <div style={styles.modalFooter}>
            <button style={styles.cancelBtn} onClick={() => setDeleteModal(null)}>Cancel</button>
            <button style={{ ...styles.btnPrimary, backgroundColor: '#dc2626' }} onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Small helper components
function Modal({ title, onClose, children }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: '1rem' }}>{children}</div>
}

function ModalFooter({ onCancel, saving, label }) {
  return (
    <div style={styles.modalFooter}>
      <button type="button" style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
      <button type="submit" style={styles.btnPrimary} disabled={saving}>
        {saving ? 'Saving...' : label}
      </button>
    </div>
  )
}

function roleColor(role) {
  const map = {
    SuperAdmin: { backgroundColor: '#fef3c7', color: '#d97706' },
    Admin:      { backgroundColor: '#ede9fe', color: '#7c3aed' },
    User:       { backgroundColor: '#dbeafe', color: '#2563eb' },
    Viewer:     { backgroundColor: '#f3f4f6', color: '#6b7280' },
  }
  return map[role] || map.Viewer
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: 0 },
  btnPrimary: { padding: '0.55rem 1.1rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
  tableCard: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#374151' },
  name: { fontWeight: 600 },
  you: { marginLeft: '6px', fontSize: '0.7rem', backgroundColor: '#dbeafe', color: '#2563eb', padding: '1px 7px', borderRadius: '999px', fontWeight: 600 },
  roleBadge: { padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
  badge: { padding: '3px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
  rowActions: { display: 'flex', gap: '0.75rem' },
  linkBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, padding: 0 },
  message: { padding: '1.5rem', color: '#6b7280', textAlign: 'center' },
  errorBanner: { padding: '1rem', color: '#dc2626', backgroundColor: '#fef2f2', margin: 0 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid #e5e7eb' },
  pageBtn: { padding: '0.4rem 0.9rem', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.875rem' },
  pageInfo: { fontSize: '0.875rem', color: '#6b7280' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { backgroundColor: '#fff', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#111', margin: '0 0 1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: '#374151' },
  input: { padding: '0.6rem 0.85rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  formError: { color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.875rem', margin: 0 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' },
  cancelBtn: { padding: '0.6rem 1.25rem', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
}

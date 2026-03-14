import { useEffect, useState } from 'react'
import { getDocuments, uploadDocument, downloadDocument, deleteDocument } from '../../api/documents.api'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const CATEGORIES = [
  { value: 'certificate', label: 'Certifikata të skanuara', color: 'bg-blue-50 text-blue-600' },
  { value: 'decision', label: 'Vendime të skanuara', color: 'bg-violet-50 text-violet-600' },
  { value: 'other', label: 'Dokumente të tjera', color: 'bg-slate-100 text-slate-600' },
]

export default function DocumentsPage() {
  const { isAtLeast } = useAuth()
  const [docs, setDocs] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [showUpload, setShowUpload] = useState(false)

  // Upload form
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadCategory, setUploadCategory] = useState('certificate')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const fetchDocs = () => {
    setLoading(true)
    const params = { pageNumber, pageSize: 20 }
    if (activeCategory) params.category = activeCategory
    if (search) params.search = search
    getDocuments(params)
      .then(({ data }) => {
        setDocs(data.items || [])
        setTotalCount(data.totalCount || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDocs() }, [activeCategory, search, pageNumber])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) return setUploadError('Zgjidhni një skedar.')
    if (!uploadName.trim()) return setUploadError('Emri është i detyrueshëm.')
    setUploadError('')
    setUploading(true)
    try {
      await uploadDocument(uploadFile, uploadName, uploadCategory, uploadDescription)
      setShowUpload(false)
      setUploadFile(null)
      setUploadName('')
      setUploadDescription('')
      fetchDocs()
      toast.success('Dokumenti u ngarkua me sukses!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ngarkimi dështoi.')
      setUploadError(err.response?.data?.error || 'Ngarkimi dështoi.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc) => {
    try {
      const { data } = await downloadDocument(doc.id)
      const url = URL.createObjectURL(new Blob([data], { type: doc.contentType }))
      window.open(url, '_blank')
    } catch {
      alert('Hapja dështoi.')
    }
  }

  const handleDelete = async (doc) => {
    if (!confirm(`Jeni të sigurt që dëshironi të fshini "${doc.name}"?`)) return
    try {
      await deleteDocument(doc.id)
      fetchDocs()
      toast.success('Dokumenti u fshi!')
    } catch {
      toast.error('Fshirja dështoi.')
    }
  }

  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat
  const getCategoryColor = (cat) => CATEGORIES.find(c => c.value === cat)?.color || 'bg-slate-100 text-slate-600'

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const totalPages = Math.ceil(totalCount / 20)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dokumentet</h1>
        {isAtLeast('User') && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-5 py-3 bg-[#00a0e3] hover:bg-[#008cc7] text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-100"
          >
            <UploadIcon /> Ngarko Dokument
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-6">Ngarko Dokument të Ri</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Emri *</label>
                  <input
                    type="text"
                    required
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Emri i dokumentit"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kategoria *</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Përshkrimi</label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Opsionale"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Skedari *</label>
                {uploadFile ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">{uploadFile.name}</span>
                    <span className="text-xs text-slate-400">({formatSize(uploadFile.size)})</span>
                    <button type="button" onClick={() => setUploadFile(null)} className="text-red-400 hover:text-red-600 text-xs ml-auto">Largo</button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#00a0e3] hover:bg-blue-50/20 transition-all">
                    <span className="text-sm text-slate-400">Klikoni për të zgjedhur skedarin</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx" onChange={(e) => setUploadFile(e.target.files[0])} />
                  </label>
                )}
              </div>
              {uploadError && <p className="text-red-600 bg-red-50 px-4 py-2 rounded-xl text-sm">{uploadError}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 bg-[#00a0e3] hover:bg-[#008cc7] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                >
                  {uploading ? 'Duke ngarkuar...' : 'Ngarko'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50"
                >
                  Anulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setActiveCategory(''); setPageNumber(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!activeCategory ? 'bg-[#00a0e3] text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Të gjitha
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => { setActiveCategory(c.value); setPageNumber(1) }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === c.value ? 'bg-[#00a0e3] text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              {c.label}
            </button>
          ))}
          <div className="flex-1" />
          <input
            type="text"
            placeholder="Kërko dokumente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPageNumber(1) }}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#00a0e3] w-[250px]"
          />
        </div>
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {['Emri', 'Skedari', 'Kategoria', 'Madhësia', 'Data', 'Veprime'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Duke ngarkuar...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Nuk u gjetën dokumente.</td></tr>
            ) : docs.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-800 text-sm">{doc.name}</p>
                  {doc.description && <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>}
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 max-w-[200px] truncate">{doc.fileName}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(doc.category)}`}>
                    {getCategoryLabel(doc.category)}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">{formatSize(doc.fileSize)}</td>
                <td className="px-5 py-4 text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString('sq-AL')}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-[#00a0e3] transition-all flex items-center justify-center"
                      title="Shiko / Shkarko"
                    >
                      <EyeIcon />
                    </button>
                    {isAtLeast('Admin') && (
                      <button
                        onClick={() => handleDelete(doc)}
                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                        title="Fshi"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-400">{totalCount} dokumente gjithsej</span>
            <div className="flex items-center gap-2">
              <button disabled={pageNumber === 1} onClick={() => setPageNumber(p => p - 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Para
              </button>
              <span className="text-sm text-slate-500 px-2">{pageNumber} / {totalPages}</span>
              <button disabled={pageNumber === totalPages} onClick={() => setPageNumber(p => p + 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Pas →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

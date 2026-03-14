import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCertificate, downloadCertificate, updateCertificate, generatePdf } from '../../api/certificates.api'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

export default function CertificateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAtLeast } = useAuth()

  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    getCertificate(id)
      .then(({ data }) => setCert(data))
      .catch((err) => {
        if (err.response?.status === 404) setError('Certifikata nuk u gjet.')
        else setError('Ngarkimi i certifikatës dështoi.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const startEdit = () => {
    setEditForm({
      issueDate: cert.issueDate,
      trainingCode: cert.trainingCode || '',
      trainingName: cert.trainingName || '',
      participantFullName: cert.participantFullName || '',
      personalNumber: cert.personalNumber || '',
      trainingGroup: cert.trainingGroup || '',
      gender: cert.gender || '',
      position: cert.position || '',
      subject: cert.subject || '',
      institutionName: cert.institutionName || '',
      institutionLocation: cert.institutionLocation || '',
      municipality: cert.municipality || '',
      institutionType: cert.institutionType || '',
      trainingDates: cert.trainingDates || '',
    })
    setEditing(true)
    setSaveError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await updateCertificate(id, editForm)
      const { data } = await getCertificate(id)
      setCert(data)
      setEditing(false)
      toast.success('Ndryshimet u ruajtën me sukses!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ruajtja dështoi.')
      setSaveError(err.response?.data?.detail || 'Ruajtja dështoi.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      let response
      if (cert.fileKey) {
        response = await downloadCertificate(id)
      } else {
        // Generate PDF on-the-fly
        response = await generatePdf(id)
        // Refresh cert data to get the new fileKey
        const { data: updatedCert } = await getCertificate(id)
        setCert(updatedCert)
      }
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${cert.serialNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Gjenerimi/Shkarkimi i PDF dështoi: ' + (err.response?.data?.error || err.message))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-400">Duke ngarkuar...</div>
  )
  if (error) return (
    <div className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{error}</div>
  )

  const certFields = [
    { label: 'Emri dhe Mbiemri', key: 'participantFullName', required: true },
    { label: 'Data e Lëshimit', key: 'issueDate', required: true },
    { label: 'Kodi i Trajnimit', key: 'trainingCode', required: true },
    { label: 'Emri i Trajnimit', key: 'trainingName', required: true },
    { label: 'Numri Personal', key: 'personalNumber' },
    { label: 'Grupi i Trajnimit', key: 'trainingGroup' },
    { label: 'Gjinia', key: 'gender' },
    { label: 'Pozita', key: 'position' },
    { label: 'Lënda', key: 'subject' },
    { label: 'Emri i Institucionit', key: 'institutionName' },
    { label: 'Vendi i Institucionit', key: 'institutionLocation' },
    { label: 'Komuna', key: 'municipality' },
    { label: 'Tipi i Institucionit', key: 'institutionType' },
    { label: 'Datat e Trajnimit', key: 'trainingDates' },
  ]

  return (
    <div className="space-y-4">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/certificates')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <BackIcon /> Kthehu
        </button>
        <div className="flex items-center gap-2">
          {isAtLeast('User') && !editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-sm transition-all"
            >
              <EditIcon /> Ndrysho
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00a0e3] hover:bg-[#008cc7] text-white rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(0,160,227,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <DownloadIcon />
            {downloading ? 'Duke gjeneruar...' : cert.fileKey ? 'Shkarko PDF' : 'Gjenero PDF'}
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Certifikatë</p>
            <h1 className="text-2xl font-black text-slate-800">#{cert.serialNumber}</h1>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-[#00a0e3] rounded-full text-[10px] font-black uppercase tracking-widest">
            {cert.generationMethod === 'Bulk' ? 'Import' : 'Manual'}
          </span>
        </div>

        {editing ? (
          /* Edit mode */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certFields.map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {f.label} {f.required && '*'}
                  </label>
                  <input
                    type={f.key === 'issueDate' ? 'date' : 'text'}
                    value={editForm[f.key] || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    required={f.required}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
                  />
                </div>
              ))}
            </div>

            {saveError && (
              <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{saveError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-[#00a0e3] hover:bg-[#008cc7] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-70"
              >
                {saving ? 'Duke ruajtur...' : 'Ruaj Ndryshimet'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Anulo
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <>
            {/* Certificate fields (A-E) - highlighted */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3">Të dhënat në certifikatë</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Emri dhe Mbiemri" value={cert.participantFullName} highlight />
                <Field label="Data e Lëshimit" value={cert.issueDate} highlight />
                <Field label="Kodi i Trajnimit" value={cert.trainingCode} highlight />
                <Field label="Emri i Trajnimit" value={cert.trainingName} highlight />
              </div>
            </div>

            {/* Additional fields (F-O) */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Të dhëna shtesë</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Numri Personal" value={cert.personalNumber} />
                <Field label="Grupi i Trajnimit" value={cert.trainingGroup} />
                <Field label="Gjinia" value={cert.gender} />
                <Field label="Pozita" value={cert.position} />
                <Field label="Lënda" value={cert.subject} />
                <Field label="Emri i Institucionit" value={cert.institutionName} />
                <Field label="Vendi i Institucionit" value={cert.institutionLocation} />
                <Field label="Komuna" value={cert.municipality} />
                <Field label="Tipi i Institucionit" value={cert.institutionType} />
                <Field label="Datat e Trajnimit" value={cert.trainingDates} />
              </div>
            </div>

            {/* Meta */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Informata të sistemit</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cert.batchId && <Field label="ID Grupit (Batch)" value={cert.batchId} />}
                <Field label="Krijuar më" value={new Date(cert.createdAt).toLocaleString('sq-AL')} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, highlight }) {
  return (
    <div className={`flex flex-col gap-1 p-4 rounded-xl ${highlight ? 'bg-green-50 border border-green-100' : 'bg-slate-50'}`}>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value || '—'}</span>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCertificate, downloadCertificate } from '../../api/certificates.api'

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

export default function CertificateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    getCertificate(id)
      .then(({ data }) => setCert(data))
      .catch((err) => {
        if (err.response?.status === 404) setError('Certifikata nuk u gjet.')
        else setError('Ngarkimi i certifikatës dështoi.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { data } = await downloadCertificate(id)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${cert.serialNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Shkarkimi dështoi.')
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

  const isBulk = cert.generationMethod === 'Bulk'

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
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00a0e3] hover:bg-[#008cc7] text-white rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(0,160,227,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <DownloadIcon />
          {downloading ? 'Duke shkarkuar...' : 'Shkarko PDF'}
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Certifikatë</p>
            <h1 className="text-2xl font-black text-slate-800">#{cert.serialNumber}</h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
            ${isBulk ? 'bg-violet-50 text-violet-500' : 'bg-blue-50 text-[#00a0e3]'}`}>
            {isBulk ? 'Masiv' : 'Manual'}
          </span>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Emri" value={cert.participantFirstName} />
          <Field label="Mbiemri" value={cert.participantLastName} />
          <Field label="ID Personale" value={cert.participantPersonalNumber || '—'} />
          <Field label="Data e Lëshimit" value={cert.issueDate} />
          <Field label="Nota" value={cert.grade || '—'} />
          <Field label="Programi" value={`${cert.trainingProgramName} (${cert.trainingProgramCode})`} />
          {cert.batchId && <Field label="ID Grupit (Batch)" value={cert.batchId} />}
          <Field label="Krijuar më" value={new Date(cert.createdAt).toLocaleString('sq-AL')} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-1 p-4 bg-slate-50 rounded-xl">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  )
}

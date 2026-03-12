import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateCertificate } from '../../api/certificates.api'
import { getPrograms } from '../../api/programs.api'

const EMPTY = {
  serialNumber: '',
  firstName: '',
  lastName: '',
  personalNumber: '',
  issueDate: '',
  grade: '',
  trainingProgramId: '',
}

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
)

const WandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>
  </svg>
)

export default function GenerateCertificatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPrograms({ pageSize: 100, isActive: true })
      .then(({ data }) => setPrograms(data.items || []))
      .catch(() => {})
  }, [])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        serialNumber: form.serialNumber,
        firstName: form.firstName,
        lastName: form.lastName,
        issueDate: form.issueDate,
        trainingProgramId: form.trainingProgramId,
        ...(form.personalNumber && { personalNumber: form.personalNumber }),
        ...(form.grade && { grade: form.grade }),
      }
      const { data } = await generateCertificate(payload)
      navigate(`/certificates/${data.certificateId}`)
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.detail || err.response?.data?.message || 'Gjenerimi dështoi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 w-fit mx-auto mb-8 shadow-sm">
        <button className="px-8 py-3 rounded-xl font-bold text-sm bg-[#00a0e3] text-white shadow-lg shadow-blue-100 transition-all">
          Regjistrim Manual
        </button>
        <button
          onClick={() => navigate('/certificates/bulk')}
          className="px-8 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all"
        >
          Gjenerim Masiv (Excel)
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto p-10">

        {/* Card header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 text-[#00a0e3] rounded-2xl flex items-center justify-center">
            <PlusIcon />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Krijo Certifikatë të Re</h3>
            <p className="text-sm text-slate-400">Plotësoni të dhënat për gjenerim të menjëhershëm</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Program — full width */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Përzgjedh Programin *
            </label>
            <select
              required
              value={form.trainingProgramId}
              onChange={(e) => set('trainingProgramId', e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
            >
              <option value="">Zgjidh një program...</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Serial number — full width */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Numri Serial *
            </label>
            <input
              required
              value={form.serialNumber}
              onChange={(e) => set('serialNumber', e.target.value)}
              placeholder="p.sh. SN-2024-001"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
            />
          </div>

          {/* First + Last name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Emri *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mbiemri *</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
              />
            </div>
          </div>

          {/* Personal number + Issue date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ID Personale</label>
              <input
                value={form.personalNumber}
                onChange={(e) => set('personalNumber', e.target.value)}
                placeholder="Opsionale"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data e Lëshimit *</label>
              <input
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => set('issueDate', e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
              />
            </div>
          </div>

          {/* Grade */}
          <div className="md:w-1/2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nota</label>
            <input
              value={form.grade}
              onChange={(e) => set('grade', e.target.value)}
              placeholder="Opsionale"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#00a0e3] transition-all text-sm"
            />
          </div>

          {error && (
            <p className="text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">{error}</p>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <WandIcon />
              {loading ? 'Duke gjeneruar...' : 'Gjenero Certifikatën'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

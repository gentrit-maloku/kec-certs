import { useEffect, useState } from 'react'
import { getStatistics, exportCertificates } from '../../api/reports.api'
import { getPrograms } from '../../api/programs.api'

export default function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [programs, setPrograms] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)

  const [filters, setFilters] = useState({ programId: '', fromDate: '', toDate: '' })
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    getStatistics()
      .then(({ data }) => setStats(data))
      .finally(() => setLoadingStats(false))

    getPrograms({ pageSize: 100 })
      .then(({ data }) => setPrograms(data.items || []))
      .catch(() => {})
  }, [])

  const set = (key, value) => setFilters(f => ({ ...f, [key]: value }))

  const handleExport = async () => {
    setExportError('')
    setExporting(true)
    try {
      const params = {
        format: 'xlsx',
        ...(filters.programId && { programId: filters.programId }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate   && { toDate: filters.toDate }),
      }
      const { data, headers } = await exportCertificates(params)
      const contentDisposition = headers['content-disposition'] || ''
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      const filename = match ? match[1].replace(/['"]/g, '') : 'certificates.xlsx'

      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <h1 style={styles.heading}>Reports</h1>

      {/* Stats summary */}
      {!loadingStats && stats && (
        <div style={styles.statsGrid}>
          <StatCard label="Total Certificates"  value={stats.totalCertificates}      color="#2563eb" />
          <StatCard label="This Month"          value={stats.certificatesThisMonth}  color="#059669" />
          <StatCard label="This Year"           value={stats.certificatesThisYear}   color="#d97706" />
          <StatCard label="Total Programs"      value={stats.totalPrograms}          color="#7c3aed" />
          <StatCard label="Total Batches"       value={stats.totalBatches}           color="#0891b2" />
        </div>
      )}

      {/* Export card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Export Certificates</h2>
        <p style={styles.cardSub}>Download a filtered list of certificates as an Excel file.</p>

        <div style={styles.filters}>
          <div style={styles.filterField}>
            <label style={styles.label}>Program</label>
            <select style={styles.input} value={filters.programId} onChange={e => set('programId', e.target.value)}>
              <option value="">All programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.filterField}>
            <label style={styles.label}>From Date</label>
            <input type="date" style={styles.input} value={filters.fromDate} onChange={e => set('fromDate', e.target.value)} />
          </div>
          <div style={styles.filterField}>
            <label style={styles.label}>To Date</label>
            <input type="date" style={styles.input} value={filters.toDate} onChange={e => set('toDate', e.target.value)} />
          </div>
        </div>

        {exportError && <p style={styles.error}>{exportError}</p>}

        <button style={styles.exportBtn} onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting...' : '⬇ Export to Excel'}
        </button>
      </div>

      {/* Breakdown table */}
      {!loadingStats && stats?.certificatesByProgram?.length > 0 && (
        <div style={styles.tableCard}>
          <h2 style={styles.cardTitle}>Certificates by Program</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Program</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Certificates</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {stats.certificatesByProgram.map(row => {
                const pct = stats.totalCertificates > 0
                  ? ((row.count / stats.totalCertificates) * 100).toFixed(1)
                  : 0
                return (
                  <tr key={row.programId} style={styles.tr}>
                    <td style={styles.td}>{row.programName}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{row.count}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={styles.barWrapper}>
                        <div style={{ ...styles.bar, width: `${pct}%` }} />
                        <span style={styles.barLabel}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

const styles = {
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: '1.5rem' },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1rem', marginBottom: '1.5rem',
  },
  statCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  statValue: { fontSize: '2rem', fontWeight: 700 },
  statLabel: { fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' },
  card: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '1.75rem',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '1.5rem',
  },
  cardTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#111', margin: '0 0 4px' },
  cardSub: { fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1.25rem' },
  filters: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' },
  filterField: { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' },
  label: { fontSize: '0.8rem', fontWeight: 500, color: '#374151' },
  input: { padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem' },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  exportBtn: {
    padding: '0.65rem 1.5rem', backgroundColor: '#059669', color: '#fff',
    border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
  },
  tableCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '1.75rem',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: {
    textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb',
  },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '0.65rem 0', fontSize: '0.9rem', color: '#374151' },
  barWrapper: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' },
  bar: { height: '6px', backgroundColor: '#2563eb', borderRadius: '999px', minWidth: '2px', maxWidth: '120px' },
  barLabel: { fontSize: '0.8rem', color: '#6b7280', minWidth: '40px', textAlign: 'right' },
}

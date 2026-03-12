import api from './axios'

export const getStatistics = () =>
  api.get('/reports/statistics')

export const exportCertificates = (params) =>
  api.get('/reports/export', { params, responseType: 'blob' })

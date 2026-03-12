import api from './axios'

export const getCertificates = (params) =>
  api.get('/certificates', { params })

export const getCertificate = (id) =>
  api.get(`/certificates/${id}`)

export const generateCertificate = (data) =>
  api.post('/certificates/generate', data)

export const bulkGenerateCertificates = (file, trainingProgramId) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('trainingProgramId', trainingProgramId)
  return api.post('/certificates/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadCertificate = (id) =>
  api.get(`/certificates/${id}/download`, { responseType: 'blob' })

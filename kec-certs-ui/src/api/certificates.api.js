import api from './axios'

export const getCertificates = (params) =>
  api.get('/certificates', { params })

export const getCertificate = (id) =>
  api.get(`/certificates/${id}`)

export const importCertificates = (file, continueOnErrors = true) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('continueOnErrors', continueOnErrors)
  return api.post('/certificates/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const updateCertificate = (id, data) =>
  api.put(`/certificates/${id}`, data)

export const downloadCertificate = (id) =>
  api.get(`/certificates/${id}/download`, { responseType: 'blob' })

export const generatePdf = (id) =>
  api.post(`/certificates/${id}/generate-pdf`, null, { responseType: 'blob' })

import api from './axios'

export const getDocuments = (params) =>
  api.get('/documents', { params })

export const uploadDocument = (file, name, category, description) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)
  formData.append('category', category)
  if (description) formData.append('description', description)
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadDocument = (id) =>
  api.get(`/documents/${id}/download`, { responseType: 'blob' })

export const deleteDocument = (id) =>
  api.delete(`/documents/${id}`)

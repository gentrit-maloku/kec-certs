import api from './axios'

export const getTemplates = (params) =>
  api.get('/templates', { params })

export const createTemplate = (data) => {
  const formData = new FormData()
  formData.append('file', data.file)
  formData.append('name', data.name)
  if (data.description) formData.append('description', data.description)
  if (data.certificationType) formData.append('certificationType', data.certificationType)
  if (data.location) formData.append('location', data.location)
  if (data.trainingProgramId) formData.append('trainingProgramId', data.trainingProgramId)
  data.placeholders.forEach((p) => formData.append('placeholders', p))
  // Logos
  if (data.logo1) formData.append('logo1', data.logo1)
  if (data.logo2) formData.append('logo2', data.logo2)
  if (data.logo3) formData.append('logo3', data.logo3)
  // Signatures
  if (data.signature1) formData.append('signature1', data.signature1)
  if (data.signature1Name) formData.append('signature1Name', data.signature1Name)
  if (data.signature2) formData.append('signature2', data.signature2)
  if (data.signature2Name) formData.append('signature2Name', data.signature2Name)
  if (data.signature3) formData.append('signature3', data.signature3)
  if (data.signature3Name) formData.append('signature3Name', data.signature3Name)
  return api.post('/templates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const activateTemplate = (templateId, programId) =>
  api.post(`/templates/${templateId}/activate/${programId}`)

export const deleteTemplate = (id) =>
  api.delete(`/templates/${id}`)

import api from './axios'

export const getTemplates = (params) =>
  api.get('/templates', { params })

export const createTemplate = (data) => {
  const formData = new FormData()
  formData.append('file', data.file)
  formData.append('name', data.name)
  if (data.description) formData.append('description', data.description)
  if (data.trainingProgramId) formData.append('trainingProgramId', data.trainingProgramId)
  data.placeholders.forEach((p) => formData.append('placeholders', p))
  return api.post('/templates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const activateTemplate = (templateId, programId) =>
  api.post(`/templates/${templateId}/activate/${programId}`)

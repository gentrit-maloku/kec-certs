import api from './axios'

export const getPrograms = (params) =>
  api.get('/programs', { params })

export const createProgram = (data) =>
  api.post('/programs', data)

export const updateProgram = (id, data) =>
  api.put(`/programs/${id}`, data)

export const activateProgramTemplate = (programId, templateId) =>
  api.post(`/programs/${programId}/templates/${templateId}/activate`)

export const deleteProgram = (id) =>
  api.delete(`/programs/${id}`)

export const importPrograms = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/programs/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

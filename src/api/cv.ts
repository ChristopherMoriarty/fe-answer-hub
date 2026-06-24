import { API_BASE, apiFetch, apiUpload } from './client'
import type { CvItem, CvListResponse, UpdateCvPayload, UploadCvPayload } from '../types/cv'

const BASE = '/api/v1/cv'

export const cvApi = {
  list: () => apiFetch<CvListResponse>(BASE),

  getById: (id: string) => apiFetch<CvItem>(`${BASE}/${id}`),

  upload: ({ title, file, notes, is_current }: UploadCvPayload) => {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)
    if (notes) formData.append('notes', notes)
    if (is_current) formData.append('is_current', 'true')
    return apiUpload<CvItem>(BASE, formData)
  },

  update: (id: string, payload: UpdateCvPayload) =>
    apiFetch<CvItem>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`${BASE}/${id}`, {
      method: 'DELETE',
    }),

  downloadUrl: (id: string) => `${API_BASE}${BASE}/${id}/download`,

  previewUrl: (id: string) => `${API_BASE}${BASE}/${id}/file`,
}

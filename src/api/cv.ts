import { apiBlob, apiFetch, apiUpload } from './client'
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

  fetchFile: (id: string) => apiBlob(`${BASE}/${id}/file`),

  download: async (id: string, filename: string) => {
    const blob = await apiBlob(`${BASE}/${id}/download`)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  },

  open: async (id: string) => {
    const blob = await apiBlob(`${BASE}/${id}/file`)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
  },
}

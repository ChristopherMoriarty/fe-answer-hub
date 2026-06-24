export interface CvItem {
  id: string
  title: string
  original_filename: string
  file_size: number
  mime_type: string
  is_current: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CvListResponse {
  items: CvItem[]
}

export interface UpdateCvPayload {
  title?: string
  notes?: string | null
  is_current?: boolean
}

export interface UploadCvPayload {
  title: string
  file: File
  notes?: string
  is_current?: boolean
}

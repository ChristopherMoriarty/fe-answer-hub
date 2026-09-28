export interface NodeTreeItem {
  id: string
  parent_id: string | null
  title: string
  sort_order: number
  has_content: boolean
  languages: string[]
  children: NodeTreeItem[]
}

export interface NodeTreeResponse {
  items: NodeTreeItem[]
  content_languages: Record<string, string>
}

export interface NodeTranslation {
  language: string
  content_md: string
  created_at: string
  updated_at: string
}

export interface NodeDetail {
  id: string
  parent_id: string | null
  title: string
  sort_order: number
  translations: NodeTranslation[]
  languages: string[]
  created_at: string
  updated_at: string
}

export interface CreateNodePayload {
  title: string
  parent_id?: string | null
  content_md?: string | null
  language?: string | null
  sort_order?: number | null
}

export interface UpdateNodePayload {
  title?: string | null
  sort_order?: number | null
}

export interface UpsertNodeTranslationPayload {
  content_md: string
}

export interface ReorderNodesPayload {
  parent_id: string | null
  ordered_ids: string[]
}

export const DEFAULT_CONTENT_LANGUAGE = 'ua'

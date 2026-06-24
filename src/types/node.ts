export interface NodeTreeItem {
  id: string
  parent_id: string | null
  title: string
  sort_order: number
  has_content: boolean
  children: NodeTreeItem[]
}

export interface NodeTreeResponse {
  items: NodeTreeItem[]
}

export interface NodeDetail {
  id: string
  parent_id: string | null
  title: string
  content_md: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateNodePayload {
  title: string
  parent_id?: string | null
  content_md?: string | null
  sort_order?: number | null
}

export interface UpdateNodePayload {
  title?: string | null
  content_md?: string | null
  sort_order?: number | null
}

export interface ReorderNodesPayload {
  parent_id: string | null
  ordered_ids: string[]
}

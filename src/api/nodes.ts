import { apiFetch } from './client'
import type {
  CreateNodePayload,
  NodeDetail,
  NodeTreeResponse,
  ReorderNodesPayload,
  UpdateNodePayload,
} from '../types/node'

const BASE = '/api/v1/nodes'

export const nodesApi = {
  getTree: () => apiFetch<NodeTreeResponse>(`${BASE}/tree`),

  getById: (id: string) => apiFetch<NodeDetail>(`${BASE}/${id}`),

  create: (payload: CreateNodePayload) =>
    apiFetch<NodeDetail>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateNodePayload) =>
    apiFetch<NodeDetail>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiFetch<void>(`${BASE}/${id}`, {
      method: 'DELETE',
    }),

  reorder: (payload: ReorderNodesPayload) =>
    apiFetch<void>(`${BASE}/reorder`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
}

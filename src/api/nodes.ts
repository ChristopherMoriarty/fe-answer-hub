import { apiFetch } from './client'
import type {
  CreateNodePayload,
  NodeDetail,
  NodeTreeResponse,
  ReorderNodesPayload,
  UpdateNodePayload,
  UpsertNodeTranslationPayload,
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

  upsertTranslation: (
    id: string,
    language: string,
    payload: UpsertNodeTranslationPayload,
  ) =>
    apiFetch<NodeDetail>(`${BASE}/${id}/translations/${language}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteTranslation: (id: string, language: string) =>
    apiFetch<NodeDetail>(`${BASE}/${id}/translations/${language}`, {
      method: 'DELETE',
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

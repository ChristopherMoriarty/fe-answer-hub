import { apiFetch } from './client'
import type {
  AddColumnPayload,
  CreateBoardPayload,
  CreateProcessPayload,
  HiringBoardDetail,
  HiringBoardListResponse,
  HiringProcess,
  UpdateProcessPayload,
  UpsertCellPayload,
} from '../types/hiring'

const BASE = '/api/v1/hiring'

export const hiringApi = {
  listBoards: () => apiFetch<HiringBoardListResponse>(`${BASE}/boards`),

  getBoard: (boardId: string) => apiFetch<HiringBoardDetail>(`${BASE}/boards/${boardId}`),

  createBoard: (payload: CreateBoardPayload) =>
    apiFetch<HiringBoardDetail>(`${BASE}/boards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateBoard: (boardId: string, payload: CreateBoardPayload) =>
    apiFetch<HiringBoardDetail>(`${BASE}/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteBoard: (boardId: string) =>
    apiFetch<void>(`${BASE}/boards/${boardId}`, {
      method: 'DELETE',
    }),

  addColumn: (boardId: string, payload: AddColumnPayload) =>
    apiFetch<HiringBoardDetail>(`${BASE}/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteColumn: (boardId: string, columnId: string) =>
    apiFetch<HiringBoardDetail>(`${BASE}/boards/${boardId}/columns/${columnId}`, {
      method: 'DELETE',
    }),

  reorderColumns: (boardId: string, orderedIds: string[]) =>
    apiFetch<HiringBoardDetail>(`${BASE}/boards/${boardId}/columns/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ ordered_ids: orderedIds }),
    }),

  createProcess: (boardId: string, payload: CreateProcessPayload) =>
    apiFetch<HiringBoardDetail>(`${BASE}/boards/${boardId}/processes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProcess: (processId: string, payload: UpdateProcessPayload) =>
    apiFetch<HiringProcess>(`${BASE}/processes/${processId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteProcess: (processId: string) =>
    apiFetch<void>(`${BASE}/processes/${processId}`, {
      method: 'DELETE',
    }),

  upsertCell: (processId: string, columnId: string, payload: UpsertCellPayload) =>
    apiFetch<{ column_id: string; status: string; event_date: string | null }>(
      `${BASE}/processes/${processId}/cells/${columnId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    ),
}

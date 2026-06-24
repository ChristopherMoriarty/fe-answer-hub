import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { hiringApi } from '../api/hiring'
import type {
  AddColumnPayload,
  CreateBoardPayload,
  CreateProcessPayload,
  HiringBoardDetail,
  UpdateProcessPayload,
  UpsertCellPayload,
} from '../types/hiring'

export const hiringBoardsKey = ['hiring', 'boards'] as const
export const hiringBoardKey = (id: string) => ['hiring', 'board', id] as const

export function useHiringBoards() {
  return useQuery({
    queryKey: hiringBoardsKey,
    queryFn: hiringApi.listBoards,
  })
}

export function useHiringBoard(boardId: string | null) {
  return useQuery({
    queryKey: hiringBoardKey(boardId ?? ''),
    queryFn: () => hiringApi.getBoard(boardId!),
    enabled: Boolean(boardId),
  })
}

function syncBoard(queryClient: ReturnType<typeof useQueryClient>, board: HiringBoardDetail) {
  queryClient.setQueryData(hiringBoardKey(board.id), board)
  void queryClient.invalidateQueries({ queryKey: hiringBoardsKey })
}

export function useCreateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBoardPayload) => hiringApi.createBoard(payload),
    onSuccess: (board) => syncBoard(queryClient, board),
  })
}

export function useUpdateBoard(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBoardPayload) => hiringApi.updateBoard(boardId, payload),
    onSuccess: (board) => syncBoard(queryClient, board),
  })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hiringApi.deleteBoard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hiringBoardsKey })
    },
  })
}

export function useAddColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AddColumnPayload) => hiringApi.addColumn(boardId, payload),
    onSuccess: (board) => syncBoard(queryClient, board),
  })
}

export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (columnId: string) => hiringApi.deleteColumn(boardId, columnId),
    onSuccess: (board) => syncBoard(queryClient, board),
  })
}

export function useReorderColumns(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) => hiringApi.reorderColumns(boardId, orderedIds),
    onSuccess: (board) => syncBoard(queryClient, board),
  })
}

export function useCreateProcess(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProcessPayload) => hiringApi.createProcess(boardId, payload),
    onSuccess: (board) => syncBoard(queryClient, board),
  })
}

export function useUpdateProcess(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      processId,
      payload,
    }: {
      processId: string
      payload: UpdateProcessPayload
    }) => hiringApi.updateProcess(processId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hiringBoardKey(boardId) })
    },
  })
}

export function useDeleteProcess(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (processId: string) => hiringApi.deleteProcess(processId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hiringBoardKey(boardId) })
    },
  })
}

export function useUpsertCell(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      processId,
      columnId,
      payload,
    }: {
      processId: string
      columnId: string
      payload: UpsertCellPayload
    }) => hiringApi.upsertCell(processId, columnId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hiringBoardKey(boardId) })
    },
  })
}

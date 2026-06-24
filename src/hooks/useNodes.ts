import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { nodesApi } from '../api/nodes'
import type {
  CreateNodePayload,
  ReorderNodesPayload,
  UpdateNodePayload,
} from '../types/node'

export const treeKey = ['nodes', 'tree'] as const
export const nodeKey = (id: string) => ['nodes', id] as const

export function useNodeTree() {
  return useQuery({
    queryKey: treeKey,
    queryFn: nodesApi.getTree,
  })
}

export function useNode(id: string | null) {
  return useQuery({
    queryKey: nodeKey(id ?? ''),
    queryFn: () => nodesApi.getById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nodesApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: treeKey })
    },
  })
}

export function useUpdateNode(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateNodePayload) => nodesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(nodeKey(id), data)
      void queryClient.invalidateQueries({ queryKey: treeKey })
    },
  })
}

export function useDeleteNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nodesApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: treeKey })
    },
  })
}

export function useReorderNodes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: nodesApi.reorder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: treeKey })
    },
  })
}

export type { CreateNodePayload, ReorderNodesPayload, UpdateNodePayload }

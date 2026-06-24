import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { cvApi } from '../api/cv'
import type { UpdateCvPayload, UploadCvPayload } from '../types/cv'

export const cvListKey = ['cv', 'list'] as const
export const cvKey = (id: string) => ['cv', id] as const

export function useCvList() {
  return useQuery({
    queryKey: cvListKey,
    queryFn: cvApi.list,
  })
}

export function useCv(id: string | null) {
  return useQuery({
    queryKey: cvKey(id ?? ''),
    queryFn: () => cvApi.getById(id!),
    enabled: Boolean(id),
  })
}

export function useUploadCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UploadCvPayload) => cvApi.upload(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(cvKey(data.id), data)
      void queryClient.invalidateQueries({ queryKey: cvListKey })
    },
  })
}

export function useUpdateCv(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateCvPayload) => cvApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(cvKey(id), data)
      void queryClient.invalidateQueries({ queryKey: cvListKey })
    },
  })
}

export function useDeleteCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cvApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cvListKey })
    },
  })
}

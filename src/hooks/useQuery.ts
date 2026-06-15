import {
  useQuery,
  useMutation,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'

export const useFetchData = <TData, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: Partial<UseQueryOptions<TData, TError>>
) => {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}

export const useMutateData = <TData, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) => {
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  })
}

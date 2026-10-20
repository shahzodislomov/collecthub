import { apiHelpers } from "@/lib/api"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"

export const useCollections = () => {
    return useQuery({
        queryKey: ["collections"],
        queryFn: () => apiHelpers.collections.list(),
        select: (data) => data?.collections
    })
}

export const useCollection = (collectionId: string | number) => {
    return useQuery({
        queryKey: ["collection", collectionId],
        queryFn: () => apiHelpers.collections.get(collectionId),
        select: (data) => data?.collection,
        enabled: Boolean(collectionId)
    })
}

export const useCreateCollection = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: any) => apiHelpers.collections.create(data),
        onSuccess: (res) => {
            const newCollection = res?.collection || res
            queryClient.invalidateQueries({
                queryKey: ["collections"]
            })
            if (newCollection?.id) {
                queryClient.setQueryData(["collection", newCollection.id], newCollection)
            }
        }
    })
}

export const useUpdateCollection = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => apiHelpers.collections.update(id, data),
        onSuccess: (res, { id }) => {
            const updatedCollection = res?.collection || res
            if (id) {
                queryClient.setQueryData(["collection", id], updatedCollection)
            }
            queryClient.invalidateQueries({
                queryKey: ["collections"]
            })
        }
    })
}

export const useDeleteCollection = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string | number) => apiHelpers.collections.delete(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: ["collection", id] })
            queryClient.invalidateQueries({
                queryKey: ["collections"]
            })
        }
    })
}
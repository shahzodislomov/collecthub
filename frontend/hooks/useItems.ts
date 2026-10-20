import { apiHelpers } from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useItems = (collectionId: string | number) => {
    return useQuery({
        queryKey: ['items', collectionId],
        queryFn: () => apiHelpers.items.getByCollection(collectionId),
        select: (data) => data?.items,
        enabled: Boolean(collectionId),
    })
} 

export const useItem = (itemId: string | number) => {
    return useQuery({
        queryKey: ['item', itemId],
        queryFn: () => apiHelpers.items.get(itemId),
        select: (data) => data?.item,
        enabled: Boolean(itemId),
    })
}

export const useCreateItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: any) => apiHelpers.items.create(data),
        onSuccess: (res) => {
            const newItem = res?.item || res
            if (newItem?.collectionId) {
                queryClient.invalidateQueries({
                    queryKey: ['items', newItem.collectionId],
                })
            }
            queryClient.invalidateQueries({
                queryKey: ['collections'],
            })
            if (newItem?.id) {
                queryClient.setQueryData(['item', newItem.id], newItem)
            }
        },
    })
}

export const useUpdateItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => apiHelpers.items.update(id, data),
        onSuccess: (res, { id }) => {
            const updatedItem = res?.item || res
            if (id) {
                queryClient.setQueryData(['item', id], updatedItem)
            }
            if (updatedItem?.collectionId) {
                queryClient.invalidateQueries({
                    queryKey: ['items', updatedItem.collectionId]
                })
            }
            queryClient.invalidateQueries({
                queryKey: ['collections']
            })
        }
    })
}

export const useDeleteItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string | number) => apiHelpers.items.delete(id),
        onSuccess: (_, itemId) => {
            queryClient.removeQueries({ queryKey: ['item', itemId] })
            queryClient.invalidateQueries({
                queryKey: ['items']
            })
            queryClient.invalidateQueries({
                queryKey: ['collections']
            })
        }
    })
}
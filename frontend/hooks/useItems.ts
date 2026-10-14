import { apiHelpers } from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useItems = (collectionId: string | number) => {
    return useQuery({
        queryKey: ['items', collectionId],
        queryFn: () => apiHelpers.items.getByCollection(collectionId)
    })
} 
export const useItem = (itemId: string | number) => {
    return useQuery({
        queryKey: ['item', itemId],
        queryFn: () => apiHelpers.items.get(itemId)
    })
}
export const useCreateItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: any) => apiHelpers.items.create(data),
        onSuccess: (newItem) => {
            queryClient.invalidateQueries({
                queryKey: ['items', newItem.collectionId],
            })
            queryClient.setQueryData(['items',newItem.id], newItem)
        },
    })
}
export const useUpdateItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => apiHelpers.items.update(id, data),
        onSuccess: (updatedItem) => {
            queryClient.setQueryData(['items', updatedItem.id], updatedItem)
            queryClient.invalidateQueries({
                queryKey: ['items', updatedItem.collectionId]
            })
        }
    })
}
export const useDeleteItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string | number) => apiHelpers.items.delete(id),
        onSuccess: (_,itemId) => {
            queryClient.setQueryData(['items',itemId], undefined)
            queryClient.invalidateQueries({
                queryKey: ['items']
            })
        }
    })
}
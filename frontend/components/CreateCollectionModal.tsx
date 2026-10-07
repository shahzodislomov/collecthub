import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, Loader2, X } from "lucide-react";
import React, { useState } from "react";

export default function CreateCollectionModal() {
    const [isOpen,setIsOpen] = useState(false);
    const [title,setTitle] = useState("")
    const [description,setDescription] = useState("")
    const [isPublic,setIsPublic] = useState(false)

    const collectionMutationFunction = async () => {
        const res = await api.post("/collections", { 
        title, 
        description: description || undefined, 
        isPublic 
      });
      return res.data;
    }
    const queryClient = useQueryClient()
    const createCollectionMutation = useMutation({
        mutationFn: collectionMutationFunction,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["collections"] });
            setIsOpen(false);
            setTitle("");
            setDescription("");
            setIsPublic(false);
        }
    })
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createCollectionMutation.mutate()
    }
    const handleClose = () => {
        setIsOpen(false)
        setTitle("")
        setDescription("")
        setIsPublic(false)
    }
    return (
         <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2"
      >
        <FolderPlus className="w-4 h-4" />
        New Collection
      </button>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create Collection</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Summer Reading List"
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this collection about?"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-sm">Make Public</p>
                    <p className="text-xs text-zinc-500">Anyone with the link can view this collection.</p>
                  </div>
                </label>
                {createCollectionMutation.isError && (
                  <p className="text-sm text-red-500">
                    {(createCollectionMutation.error as any)?.response?.data?.message || "Failed to create collection"}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={createCollectionMutation.isPending || !title}
                  className="w-full py-2.5 mt-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createCollectionMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
    )
}
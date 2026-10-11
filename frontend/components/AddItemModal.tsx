"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Link as LinkIcon, Film, CheckSquare, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AddItemModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"link" | "movie" | "habit">("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [collectionId, setCollectionId] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch collections for the dropdown
  const { data: collections, isLoading: isLoadingCollections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await api.get("/collections");
      return res.data.collections;
    },
    enabled: isOpen, // Only fetch when modal opens
  });

  // Create Item Mutation
  const createItemMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { type, collectionId };
      if (type === "link") payload.url = url;
      else payload.title = title;
      
      const res = await api.post("/create", payload);
      return res.data;
    },
    onSuccess: () => {
      // Refresh kanban board data
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setIsOpen(false);
      setTitle("");
      setUrl("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId) return;
    createItemMutation.mutate();
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center text-white hover:scale-105 hover:shadow-blue-500/40 transition-all active:scale-95 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
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
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add New Item</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                {[
                  { id: "link", icon: LinkIcon, label: "Link" },
                  { id: "movie", icon: Film, label: "Movie" },
                  { id: "habit", icon: CheckSquare, label: "Habit" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                      type === t.id 
                        ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" 
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Collection</label>
                  <select
                    required
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select a collection...</option>
                    {collections?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  {!isLoadingCollections && collections?.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">You need to create a collection first!</p>
                  )}
                </div>

                {type === "link" ? (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">URL</label>
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">We will automatically fetch the title and image!</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={type === "movie" ? "e.g., Dune: Part Two" : "e.g., Read 10 Pages"}
                      className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createItemMutation.isPending || (!url && type === "link") || (!title && type !== "link") || !collectionId}
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createItemMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Item"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Link as LinkIcon,
  Film,
  Gamepad2,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCollections } from "@/hooks/useCollections";
import { useCreateItem } from "@/hooks/useItems";

export default function NewItemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [type, setType] = useState<"link" | "movie" | "game">("link");
  const [collectionId, setCollectionId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch collections
  // const { data: collections, isLoading: isLoadingCollections } = useQuery({
  //   queryKey: ["collections"],
  //   queryFn: async () => {
  //     const res = await api.get("/collections");
  //     const list = res.data.collections || []; 
  //     if (list.length > 0 && !collectionId) {
  //       setCollectionId(list[0].id);
  //     }
  //     return list;
  //   },
  // });

  const {data: collections, isLoading: isLoadingCollections} = useCollections()
  useEffect(() => {
    if (collections && collections.length > 0 && !collectionId) {
      setCollectionId(collections[0].id)
    }
  }, [collections,collectionId]);
  // Create mutation
  const createItemMutation = useCreateItem()
  // const createItemMutation = useMutation({
  //   mutationFn: async () => {
  //     setErrorMsg("");
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: any = {
        type,
        collectionId,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        tags: tags?.length > 0 ? tags : undefined,
      };

  //     const res = await api.post("/create", payload);
  //     return res.data;
  //   },
  //   onSuccess: (data) => {
  //     queryClient.invalidateQueries({ queryKey: ["collections"] });
  //     queryClient.invalidateQueries({ queryKey: ["items"] });
  //     if (data?.item?.id) {
  //       router.push(`/items/${data.item.id}`);
  //     } else {
  //       router.push("/");
  //     }
  //   },
  //   onError: (err: any) => {
  //     setErrorMsg(
  //       err?.response?.data?.message || err?.message || "Failed to create item. Please check the inputs."
  //     );
  //   },
  // });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId) {
      setErrorMsg("Please select a collection.");
      return;
    }
    if (type !== "link" && !title.trim()) {
      setErrorMsg("Title is required for this item type.");
      return;
    }
    if (type === "link" && !url.trim() && !title.trim()) {
      setErrorMsg("Please enter either a URL or a title.");
      return;
    }
    createItemMutation.mutate(payload, {
      onSuccess: (newItem) => router.push(`/item/${newItem.id}`),
      onError: (err: any) => setErrorMsg(err?.response?.data?.message || err?.message || "Failed to create item. Please check the inputs."),
    });
  };

  const types = [
    { id: "link", icon: LinkIcon, label: "Link" },
    { id: "movie", icon: Film, label: "Movie" },
    { id: "game", icon: Gamepad2, label: "Game" },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Create New Item</h1>
          <p className="text-xs text-zinc-500">Save a link or log movies & games into your collections.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Form Container */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Item Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    type === t.id
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collection Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Target Collection
            </label>
            {isLoadingCollections ? (
              <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ) : collections && collections.length > 0 ? (
              <select
                required
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {collections.map((col: any) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
                <p className="text-sm text-zinc-500 mb-2">You don&apos;t have any collections yet.</p>
                <Link
                  href="/collections"
                  className="text-xs font-semibold text-blue-500 hover:underline"
                >
                  Create your first collection &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* URL Input (if link or optional for others) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              {type === "link" ? "Link URL" : "URL (Optional)"}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {type === "link" && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                CollectHub will automatically scrape the page title, preview image, and description!
              </p>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Title {type === "link" && <span className="text-zinc-400 normal-case">(optional if URL is given)</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "movie"
                  ? "e.g., Dune: Part Two"
                  : type === "game"
                  ? "e.g., Elden Ring"
                  : "e.g., Awesome Article"
              }
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Image URL Input (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Image URL <span className="text-zinc-400 normal-case">(optional)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Description / Notes <span className="text-zinc-400 normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key notes, thoughts, or summary..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Tags <span className="text-zinc-400 normal-case">(comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="reading, tech, favorite"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createItemMutation.isPending || (!collectionId && (!collections || collections.length === 0))}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-medium text-sm hover:from-blue-600 hover:to-violet-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createItemMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Create Item"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

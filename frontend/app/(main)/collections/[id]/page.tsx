"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCollection, useDeleteCollection, useUpdateCollection } from "@/hooks/useCollections";
import { useItems } from "@/hooks/useItems";
import {
  ArrowLeft,
  Loader2,
  Edit3,
  Trash2,
  Check,
  X,
  Globe,
  Lock,
  Plus,
  Link as LinkIcon,
  Film,
  Gamepad2,
  ExternalLink,
  Layers,
} from "lucide-react";

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const {
    data: collection,
    isLoading: isLoadingCollection,
    error: collectionError,
  } = useCollection(id);

  const {
    data: items,
    isLoading: isLoadingItems,
  } = useItems(id);

  const updateCollectionMutation = useUpdateCollection();
  const deleteCollectionMutation = useDeleteCollection();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (collection) {
      setTitle(collection.title || "");
      setDescription(collection.description || "");
      setIsPublic(Boolean(collection.isPublic));
    }
  }, [collection]);

  if (isLoadingCollection) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (collectionError || !collection) {
    return (
      <div className="mx-auto max-w-xl text-center py-20">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Collection Not Found</h2>
        <p className="mt-2 text-sm text-zinc-500">
          The collection you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/collections"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Collections
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    if (!title.trim()) return;
    setErrorMessage("");

    updateCollectionMutation.mutate(
      {
        id,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          isPublic,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: (err: any) => {
          setErrorMessage(err?.message || "Failed to update collection");
        },
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(collection.title || "");
    setDescription(collection.description || "");
    setIsPublic(Boolean(collection.isPublic));
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this collection and all its items?")) {
      deleteCollectionMutation.mutate(id, {
        onSuccess: () => router.push("/collections"),
      });
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="h-4 w-4 text-violet-500" />;
      case "game":
        return <Gamepad2 className="h-4 w-4 text-amber-500" />;
      default:
        return <LinkIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Collections
        </Link>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateCollectionMutation.isPending || !title.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {updateCollectionMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteCollectionMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Collection Header Card */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xl">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Collection Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-base font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isPublicEdit"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublicEdit" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                Make this collection public
              </label>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {collection.title}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  collection.isPublic
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {collection.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {collection.isPublic ? "Public" : "Private"}
              </span>
            </div>

            {collection.description ? (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                {collection.description}
              </p>
            ) : (
              <p className="text-sm italic text-zinc-400">No description provided.</p>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
              <span>{items?.length ?? 0} {items?.length === 1 ? "item" : "items"} in this collection</span>
              <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Saved Items</h2>
          </div>
          <Link
            href="/items/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Link>
        </div>

        {isLoadingItems ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : !items || items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              No items in this collection yet
            </p>
            <p className="text-xs text-zinc-400 mb-4">
              Add links, movies, or games to start organizing your thoughts.
            </p>
            <Link
              href="/items/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="group relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {item.imageUrl && (
                    <div className="h-36 w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 mb-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    {getItemIcon(item.type)}
                    <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                      {item.type}
                    </span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 text-sm group-hover:text-blue-500 transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  {item.url && (
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(item.url, "_blank");
                      }}
                      className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

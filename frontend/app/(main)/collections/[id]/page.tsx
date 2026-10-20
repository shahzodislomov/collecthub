"use client"

import { useCollection, useDeleteCollection, useUpdateCollection } from "@/hooks/useCollections";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

interface CollectionDetailPageProps {
  params: Promise<{
    id: string
  }>
}
export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const deleteCollection = useDeleteCollection()
  const updateCollectionMutation = useUpdateCollection()
  const [isEditing, setIsEditing] = useState(false)
  const [newCollectionName,setNewCollectionName] = useState("")
  const [newCollectionDescription,setNewCollectionDescription] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const {
    data: collection,
    isLoading: isLoadingCollection,
    error: collectionError,
  } = useCollection(id);



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
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleCollectionUpdate = () => {
    setIsEditing(true);
  };

  const handleCollectionDelete = () => {
    if (confirm("Are you sure you want to delete this collection and all its items?")) {
      deleteCollection.mutate(id, {
        onSuccess: () => router.push("/"),
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewCollectionName(collection.name);
    setNewCollectionDescription(collection.description || "");
  };

  const handleSaveCollection = () => {
    const queryClient = useQueryClient()
    updateCollectionMutation.mutate(
      {
        id,
        data: {
          name: newCollectionName.trim() || undefined,
          description: newCollectionDescription.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["collections"] });
          queryClient.invalidateQueries({ queryKey: ["items"] });
          setIsEditing(false);
        },
        onError: (err: any) => setErrorMessage(err?.message || "Failed to update collection")
      }
    );
  };
  return (
    <div>
      {collection}
      {collection?.name}
      {collection?.description}
      {collection?.id}
    </div>
  );
}

import { useCreateCollection } from "@/hooks/useCollections";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCollectionPage() {
  const router = useRouter()
  const createCollectionMutation = useCreateCollection()
  const [collectionName, setCollectionName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if(!collectionName.trim()) return 

    createCollectionMutation.mutate(
      {
        title: collectionName.trim(),
        description: description.trim() || undefined,
        isPublic: isPublic,
      },
      {
        onSuccess: (res) => {
          const id = res?.collection?.id
          router.push(id ? `/collection?${id}` : "/collections")
        },
        onError: (err: Error) => {
          setErrorMessage(err?.message || "Failed to create a collection!")
        }
      }
    )
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">New Collection</h1>
    </div>
  );
}

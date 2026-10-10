"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MoreHorizontal, Link as LinkIcon, Film, CheckSquare, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Item = { id: string; title: string; url?: string; imageUrl?: string; type: "link" | "movie" | "habit" };
type Collection = { id: string; title: string; items: Item[] };

const getIcon = (type: string) => {
  switch (type) {
    case "movie": return <Film className="w-4 h-4 text-violet-500" />;
    case "link": return <LinkIcon className="w-4 h-4 text-blue-500" />;
    case "habit": return <CheckSquare className="w-4 h-4 text-emerald-500" />;
    default: return null;
  }
};

export default function KanbanBoard() {
  const [isMounted, setIsMounted] = useState(false);
  const [localCollections, setLocalCollections] = useState<Collection[]>([]);
  const queryClient = useQueryClient();

  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await api.get("/collections");
      return res.data.collections as Collection[];
    }
  });

  // Sync local state when collections load
  useEffect(() => {
    if (collections) {
      setLocalCollections(collections);
    }
  }, [collections]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, collectionId }: { itemId: string; collectionId: string }) => {
      const res = await api.patch(`/item/${itemId}`, { collectionId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    }
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering in same column (optimistic UI)
      const sourceColIndex = localCollections.findIndex(c => c.id === source.droppableId);
      const newCollections = [...localCollections];
      const column = { ...newCollections[sourceColIndex] };
      const newItems = [...column.items];
      
      const [removed] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, removed);
      
      column.items = newItems;
      newCollections[sourceColIndex] = column;
      setLocalCollections(newCollections);
    } else {
      // Moving to a new column
      const sourceColIndex = localCollections.findIndex(c => c.id === source.droppableId);
      const destColIndex = localCollections.findIndex(c => c.id === destination.droppableId);
      
      const newCollections = [...localCollections];
      const sourceCol = { ...newCollections[sourceColIndex] };
      const destCol = { ...newCollections[destColIndex] };
      
      const sourceItems = [...sourceCol.items];
      const destItems = [...destCol.items];
      
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      
      sourceCol.items = sourceItems;
      destCol.items = destItems;
      
      newCollections[sourceColIndex] = sourceCol;
      newCollections[destColIndex] = destCol;
      
      setLocalCollections(newCollections);

      // Persist to backend
      updateItemMutation.mutate({ itemId: draggableId, collectionId: destination.droppableId });
    }
  };

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (localCollections.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No Collections Found</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create a collection above to start organizing items.</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
        {localCollections.map((column) => (
          <div key={column.id} className="min-w-[320px] w-[320px] shrink-0 snap-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                {column.title}
              </h3>
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full text-xs font-medium">
                {column.items.length}
              </span>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`min-h-[500px] p-3 rounded-2xl transition-colors ${
                    snapshot.isDraggingOver 
                      ? "bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-500/20" 
                      : "bg-zinc-100/50 dark:bg-zinc-900/50 border-2 border-transparent"
                  }`}
                >
                  {column.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging 
                              ? `${provided.draggableProps.style?.transform} rotate(2deg) scale(1.02)` 
                              : provided.draggableProps.style?.transform
                          }}
                          className={`mb-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm cursor-grab active:cursor-grabbing transition-shadow ${
                            snapshot.isDragging ? "shadow-2xl ring-2 ring-blue-500/20 z-50 relative" : "hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          {item.imageUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden h-32 relative shrink-0">
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm leading-snug break-words">
                                {item.title}
                              </p>
                              {item.url && (
                                <p className="text-xs text-blue-500 mt-1 truncate max-w-[200px]">
                                  {new URL(item.url).hostname}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-zinc-400">
                              {getIcon(item.type)}
                              <button className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

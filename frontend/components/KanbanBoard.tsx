"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MoreHorizontal, Link as LinkIcon, Film, CheckSquare } from "lucide-react";

// Types
type Item = { id: string; content: string; type: "link" | "movie" | "habit" };
type Column = { id: string; title: string; items: Item[] };
type BoardData = { [key: string]: Column };

const initialData: BoardData = {
  todo: {
    id: "todo",
    title: "To Consume",
    items: [
      { id: "item-1", content: "Dune: Part Two", type: "movie" },
      { id: "item-2", content: "Learn Next.js 15 Server Actions", type: "link" },
      { id: "item-3", content: "Read 'Atomic Habits'", type: "habit" },
    ],
  },
  in_progress: {
    id: "in_progress",
    title: "In Progress",
    items: [
      { id: "item-4", content: "React Query documentation", type: "link" },
    ],
  },
  done: {
    id: "done",
    title: "Finished",
    items: [
      { id: "item-5", content: "Drink 2L Water", type: "habit" },
      { id: "item-6", content: "Oppenheimer", type: "movie" },
    ],
  },
};

const getIcon = (type: string) => {
  switch (type) {
    case "movie": return <Film className="w-4 h-4 text-violet-500" />;
    case "link": return <LinkIcon className="w-4 h-4 text-blue-500" />;
    case "habit": return <CheckSquare className="w-4 h-4 text-emerald-500" />;
    default: return null;
  }
};

export default function KanbanBoard() {
  // Fix hydration issues by only rendering after mount
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<BoardData>(initialData);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      // Moving in the same column
      const column = data[source.droppableId];
      const newItems = Array.from(column.items);
      const [removed] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, removed);

      setData({
        ...data,
        [source.droppableId]: {
          ...column,
          items: newItems,
        },
      });
    } else {
      // Moving from one column to another
      const sourceCol = data[source.droppableId];
      const destCol = data[destination.droppableId];
      const sourceItems = Array.from(sourceCol.items);
      const destItems = Array.from(destCol.items);

      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      setData({
        ...data,
        [source.droppableId]: {
          ...sourceCol,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destCol,
          items: destItems,
        },
      });
    }
  };

  if (!isMounted) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col lg:flex-row gap-6 w-full mt-8">
        {Object.values(data).map((column) => (
          <div key={column.id} className="flex-1 min-w-[280px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {column.title}
                <span className="text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 py-1 px-2 rounded-full">
                  {column.items.length}
                </span>
              </h3>
              <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`min-h-[200px] p-3 rounded-2xl transition-all border ${
                    snapshot.isDraggingOver 
                      ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-inner" 
                      : "bg-zinc-50/50 dark:bg-zinc-950/50 border-dashed border-zinc-200 dark:border-zinc-800"
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
                          }}
                          className={`group p-4 mb-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-3 select-none ${
                            snapshot.isDragging ? "shadow-2xl ring-2 ring-blue-500/20 rotate-2 scale-[1.02] z-50" : "shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <div className="mt-0.5 p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 transition-colors group-hover:bg-white dark:group-hover:bg-zinc-900 border border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-700">
                            {getIcon(item.type)}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-800 dark:text-zinc-200 text-sm leading-tight">
                              {item.content}
                            </p>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mt-2 block">
                              {item.type}
                            </span>
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

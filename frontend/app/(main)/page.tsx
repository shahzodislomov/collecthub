"use client";

import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import KanbanBoard from "@/components/KanbanBoard";
import CreateCollectionModal from "@/components/CreateCollectionModal";
import CircularGallery from "@/components/CircularGallery";

type Item = { id: string; title: string; url?: string; imageUrl?: string; type: string };
type Collection = { id: string; title: string; items: Item[] };

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await api.get("/collections");
      return res.data.collections as Collection[];
    }
  });

  const galleryItems = collections
    ?.flatMap((col) => col.items)
    .filter((item) => item.imageUrl)
    .map((item) => ({ image: item.imageUrl!, text: item.title }));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.username}!
        </h1>
        <div className="flex items-center gap-3">
          <CreateCollectionModal />

          <button
            onClick={() => {
              useAuthStore.getState().logout();
              router.push("/login");
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/60 dark:border-zinc-800/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-transform duration-300">
          <h3 className="font-semibold text-xl mb-2 text-zinc-900 dark:text-white">My Collections</h3>
          <p className="text-zinc-500 dark:text-zinc-400">3 Active Collections</p>
        </div>
        <div className="p-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/60 dark:border-zinc-800/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-transform duration-300">
          <h3 className="font-semibold text-xl mb-2 text-zinc-900 dark:text-white">Daily Habits</h3>
          <p className="text-zinc-500 dark:text-zinc-400">2 Habits left today.</p>
        </div>
        <div className="p-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/60 dark:border-zinc-800/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:scale-[1.02] transition-transform duration-300">
          <h3 className="font-semibold text-xl mb-2 text-zinc-900 dark:text-white">Recent Items</h3>
          <p className="text-zinc-500 dark:text-zinc-400">12 Items tracked total.</p>
        </div>
      </div>

      {/* Circular Gallery Showcase */}
      <div className="pt-8 mt-12">
        <h2 className="text-3xl font-black tracking-tighter mb-3">Recent Highlights</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-8">Scroll or drag to explore your latest saved media.</p>
        <div style={{ height: '500px', position: 'relative' }} className="rounded-[2rem] overflow-hidden bg-zinc-900 shadow-2xl">
          <CircularGallery
            items={galleryItems?.length ? galleryItems : undefined}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.05}
            scrollEase={0.02}
          />
        </div>
      </div>

      {/* Fully Animated Draggable Kanban Board */}
      <div className="pt-8 mt-12">
        <h2 className="text-3xl font-black tracking-tighter mb-3">Your Workspace</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-8">Drag and drop items to organize your workflow.</p>
        <KanbanBoard />
      </div>
    </div>
  );
}

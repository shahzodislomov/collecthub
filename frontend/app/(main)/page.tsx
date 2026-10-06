"use client";

import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import KanbanBoard from "@/components/KanbanBoard";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-2">My Collections</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">3 Active Collections</p>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Daily Habits</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">2 Habits left today.</p>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Recent Items</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">12 Items tracked total.</p>
        </div>
      </div>

      {/* Fully Animated Draggable Kanban Board */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Your Workspace</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Drag and drop items to organize your workflow.</p>
        <KanbanBoard />
      </div>
    </div>
  );
}

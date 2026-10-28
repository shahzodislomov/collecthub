"use client";

import Link from "next/link";
import { useCollections } from "@/hooks/useCollections";
import { useAuthStore } from "@/lib/store";
import {
  Settings,
  Folder,
  Layers,
  ArrowRight,
  Plus,
  Loader2,
  Globe,
  Lock,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: collections, isLoading } = useCollections();

  const totalItems =
    collections?.reduce(
      (acc: number, c: any) => acc + (c.items?.length || 0),
      0
    ) || 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* User Header Card */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar or Fallback Initials */}
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-zinc-200 dark:border-zinc-800"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-blue-500/20">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
            )}

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {user?.username || "Curator"}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                CollectHub Member &bull; Personal Library
              </p>
            </div>
          </div>

          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors shrink-0"
          >
            <Settings className="h-4 w-4" /> Edit Profile
          </Link>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Folder className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Total Collections
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
              {collections?.length || 0}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Total Items Saved
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
              {totalItems}
            </p>
          </div>
        </div>
      </div>

      {/* Collections Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            My Collections
          </h2>
          <Link
            href="/collections/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> New Collection
          </Link>
        </div>

        {isLoading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : !collections || collections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              No collections yet
            </p>
            <p className="text-xs text-zinc-400 mb-4">
              Create your first collection to start curating content.
            </p>
            <Link
              href="/collections/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Create Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((c: any) => {
              const itemCount = c.items?.length || 0;
              return (
                <Link
                  key={c.id}
                  href={`/collections/${c.id}`}
                  className="group rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          c.isPublic
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {c.isPublic ? (
                          <Globe className="h-2.5 w-2.5" />
                        ) : (
                          <Lock className="h-2.5 w-2.5" />
                        )}
                        {c.isPublic ? "Public" : "Private"}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors line-clamp-1">
                      {c.title}
                    </h3>
                    {c.description ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                        {c.description}
                      </p>
                    ) : (
                      <p className="text-xs italic text-zinc-400 mt-1">
                        No description
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-500 font-medium group-hover:translate-x-0.5 transition-transform">
                      View <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
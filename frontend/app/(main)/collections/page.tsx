"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "@/hooks/useCollections";
import {
  Folder,
  Plus,
  Loader2,
  Globe,
  Lock,
  Search,
  ArrowRight,
  Layers,
} from "lucide-react";

export default function CollectionsPage() {
  const { data: collections, isLoading, error } = useCollections();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCollections = (collections || []).filter((c: any) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            My Collections
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Organize and browse your curated folders and resources.
          </p>
        </div>

        <Link
          href="/collections/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium hover:opacity-95 shadow-md shadow-blue-500/10 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" /> New Collection
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search collections..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm text-center">
          Failed to load collections. Please try refreshing.
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 mx-auto flex items-center justify-center mb-3">
            <Folder className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base mb-1">
            {searchQuery ? "No matching collections found" : "No collections yet"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
            {searchQuery
              ? "Try searching with a different term."
              : "Create your first collection to start saving links, media, and items."}
          </p>
          {!searchQuery && (
            <Link
              href="/collections/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> Create Collection
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((c: any) => {
            const itemCount = c.items?.length ?? 0;
            return (
              <Link
                key={c.id}
                href={`/collections/${c.id}`}
                className="group relative rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-6 shadow-sm hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Folder className="h-5 w-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.isPublic
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {c.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {c.isPublic ? "Public" : "Private"}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors line-clamp-1 mb-1.5">
                    {c.title}
                  </h3>

                  {c.description ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  ) : (
                    <p className="text-xs italic text-zinc-400">No description.</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Layers className="h-3.5 w-3.5 text-zinc-400" />
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-500 font-medium group-hover:translate-x-0.5 transition-transform">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

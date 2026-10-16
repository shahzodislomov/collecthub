"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Edit3,
  Check,
  X,
  Link as LinkIcon,
  Film,
  CheckSquare,
  Gamepad2,
  Calendar,
  Folder,
  Loader2,
  Flame,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ItemDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Fetch Item
  const { data, isLoading, error } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const res = await api.get(`/item/${id}`);
      const item = res.data.item;
      setTitle(item.title || "");
      setDescription(item.description || "");
      setUrl(item.url || "");
      setImageUrl(item.imageUrl || "");
      return item;
    },
  });

  // Fetch Habit Logs if type === 'habit'
  const { data: habitLogsData, refetch: refetchHabitLogs } = useQuery({
    queryKey: ["habit-logs", id],
    queryFn: async () => {
      const res = await api.get(`/items/${id}/habit-logs`);
      return res.data.logs as Array<{ id: string; date: string; completed: boolean }>;
    },
    enabled: data?.type === "habit",
  });

  // Update Item Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/item/${id}`, {
        title,
        description,
        url: url || undefined,
        imageUrl: imageUrl || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setIsEditing(false);
    },
  });

  // Delete Item Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/item/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      router.push("/");
    },
  });

  // Habit Check-in Mutation
  const habitLogMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      const res = await api.post(`/items/${id}/habit-logs`, {
        date: new Date().toISOString(),
        completed,
      });
      return res.data;
    },
    onSuccess: () => {
      refetchHabitLogs();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl text-center py-20">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Item Not Found</h2>
        <p className="mt-2 text-sm text-zinc-500">The item you are looking for does not exist or has been removed.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="h-4 w-4 text-violet-500" />;
      case "habit":
        return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case "game":
        return <Gamepad2 className="h-4 w-4 text-amber-500" />;
      default:
        return <LinkIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const isHabitCompletedToday = habitLogsData?.some(
    (log) => log.date.startsWith(todayStr) && log.completed
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this item?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xl">
        {/* Cover Image */}
        {(data.imageUrl || (isEditing && imageUrl)) && (
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
            <img
              src={isEditing ? imageUrl : data.imageUrl}
              alt={data.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">
              {getTypeIcon(data.type)}
              {data.type}
            </span>

            {data.collection && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Folder className="h-3.5 w-3.5" />
                {data.collection.title}
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(data.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Title & Description (View vs Edit Mode) */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 text-lg font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://image-url..."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description or notes..."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {data.title}
              </h1>

              {data.url && (
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  {data.url}
                </a>
              )}

              {data.description ? (
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {data.description}
                </p>
              ) : (
                <p className="text-sm italic text-zinc-400">No description provided.</p>
              )}
            </div>
          )}

          {/* Habit Tracker Section */}
          {data.type === "habit" && (
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Today&apos;s Habit Status</h4>
                    <p className="text-xs text-zinc-500">
                      {isHabitCompletedToday ? "Completed for today! Keep up the momentum." : "Not completed yet today."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => habitLogMutation.mutate(!isHabitCompletedToday)}
                  disabled={habitLogMutation.isPending}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    isHabitCompletedToday
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
                  }`}
                >
                  {habitLogMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isHabitCompletedToday ? (
                    <>
                      <Check className="h-4 w-4" /> Completed
                    </>
                  ) : (
                    "Mark Completed"
                  )}
                </button>
              </div>

              {/* Log History */}
              {habitLogsData && habitLogsData.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Recent Logs</h5>
                  <div className="flex flex-wrap gap-2">
                    {habitLogsData.slice(-14).map((log) => (
                      <div
                        key={log.id}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          log.completed
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                            : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        {new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

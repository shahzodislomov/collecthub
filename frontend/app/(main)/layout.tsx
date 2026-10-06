import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar will go here eventually */}
      <aside className="hidden w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:block">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
            CollectHub
          </h1>
        </div>
        {/* Navigation links will go here */}
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top Navbar for Mobile/Search will go here */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex items-center px-6">
          <span className="md:hidden font-bold">CollectHub</span>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

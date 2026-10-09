import { ReactNode } from "react";
import AddItemModal from "@/components/AddItemModal";
import LineSidebar from "@/components/LineSidebar";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Floating Sidebar Container */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 py-8 pl-4 z-10 shrink-0">
        <div className="px-8 mb-10">
          <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 to-zinc-400 dark:from-white dark:to-zinc-500">
            CollectHub.
          </h1>
        </div>
        <div className="flex-1 flex justify-center items-center pb-20">

          <LineSidebar /> 
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden h-16 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex items-center px-6">
          <span className="font-black tracking-tighter text-xl">CollectHub.</span>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-x-hidden">
          {children}
        </main>
        
        {/* Global Floating Action Button & Modal */}
        <AddItemModal />
      </div>
    </div>
  );
}

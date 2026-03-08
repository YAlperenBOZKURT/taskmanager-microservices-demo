// TaskManager Frontend - Main layout wrapper with sidebar and topbar
// Author: Yusuf Alperen Bozkurt

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useSidebarStore } from '../../stores/sidebarStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const close = useSidebarStore((s) => s.close);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      {/* dark overlay when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={close}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-[280px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

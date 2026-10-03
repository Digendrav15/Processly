import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import { BottomNav } from './BottomNav';
import { MobileSubNavBar } from './MobileSubNavBar';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { GlobalChatAgent } from '../chatAgent/GlobalChatAgent';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Drawer Navigation */}
        <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
          <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 px-3 py-3 md:px-6 md:py-3.5 w-full max-w-[1700px] mx-auto">
            {/* Mobile Sub-Navigation Pills for Active Module */}
            <MobileSubNavBar />
            <Outlet />
          </main>
        </div>

        {/* Global ERP AI Chat Agent */}
        <GlobalChatAgent />

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </ErrorBoundary>
  );
}

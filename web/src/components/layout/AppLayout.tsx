import React, { useState } from 'react';
import { Sidebar, PageId } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  onStartNewScan: () => void;
  onOpenCommandPalette: () => void;
  openFindingsCount?: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activePage,
  onSelectPage,
  onStartNewScan,
  onOpenCommandPalette,
  openFindingsCount,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-primary flex">
      {/* Collapsible Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={onSelectPage}
        openFindingsCount={openFindingsCount}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Container */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'pl-20' : 'pl-64'}`}>
        <Topbar
          activePage={activePage}
          onStartNewScan={onStartNewScan}
          onOpenCommandPalette={onOpenCommandPalette}
          collapsed={collapsed}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 mt-16 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

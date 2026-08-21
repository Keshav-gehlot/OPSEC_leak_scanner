import React from 'react';
import { Sidebar, PageId } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  onStartNewScan: () => void;
  openFindingsCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activePage,
  onSelectPage,
  onStartNewScan,
  openFindingsCount,
  searchQuery,
  onSearchChange,
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      {/* Fixed Sidebar */}
      <Sidebar 
        activePage={activePage} 
        onSelectPage={onSelectPage} 
        openFindingsCount={openFindingsCount} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          onStartNewScan={onStartNewScan} 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        <main className="flex-1 p-8 overflow-y-auto bg-grid-pattern min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

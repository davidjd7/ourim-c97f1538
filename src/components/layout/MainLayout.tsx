import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { ColumnFiltersProvider } from '@/contexts/ColumnFiltersContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="overflow-x-hidden">
          <Header />
          <main className="flex-1 p-4 pt-2 overflow-x-hidden">
            <ColumnFiltersProvider>{children}</ColumnFiltersProvider>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 pt-2">
            <ColumnFiltersProvider>{children}</ColumnFiltersProvider>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
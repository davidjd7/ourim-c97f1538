import React from 'react';
import { cn } from '@/lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Settings,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  /*
  {
    name: 'Pipeline Immobilier',
    href: '/pipeline-immo',
    icon: Building,
  },
  {
    name: 'Pipeline PE',
    href: '/pipeline-pe',
    icon: TrendingUp,
  },
  */
  {
    name: 'Investissements',
    href: '/investissements',
    icon: Wallet,
  },
  {
    name: 'Dettes',
    href: '/dettes',
    icon: CreditCard,
  },
  {
    name: 'Paramètres',
    href: '/parametres',
    icon: Settings,
  },
];

export function Sidebar({ open, onClose, className }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 border-r bg-card flex-shrink-0 transition-transform duration-200 ease-in-out h-screen",
          "fixed md:static z-50 md:z-auto",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Family Office</h2>
                <p className="text-xs text-muted-foreground">Gestion d'investissements</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => onClose && onClose()}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="rounded-lg bg-primary-lighter p-3">
              <p className="text-xs font-medium text-primary">
                Version 1.0
              </p>
              <p className="text-xs text-primary/80">
                Family Office - Suivi d'investissements
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
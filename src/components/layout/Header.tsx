import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Building2, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompanyFilter } from '@/components/filters/CompanyFilter';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAddInvestment = (type: 'IMMO' | 'PE') => {
    navigate('/investissement/nouveau', { state: { type } });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Left section - Sidebar Toggle + CTA Actions */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover-scale" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="btn-financial gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Nouvel investissement</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddInvestment('IMMO')}>
                <Building2 className="mr-2 h-4 w-4" />
                Actif Immobilier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddInvestment('PE')}>
                <Building2 className="mr-2 h-4 w-4" />
                Actif Private Equity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Dette
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center section - Search and Filters */}
        <div className="flex-1 flex items-center justify-center px-6 gap-4">
          <div className="w-full max-w-lg relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un investissement..."
              className="pl-10 w-full"
            />
          </div>
          <CompanyFilter />
        </div>

        {/* Right section - Profile */}
        <div className="flex items-center gap-4">
          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {user?.email || 'Utilisateur'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
import React from 'react';
import { Search, Plus, Building2, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Left section - CTA Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
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
              <DropdownMenuItem>
                <Building2 className="mr-2 h-4 w-4" />
                Actif Immobilier
              </DropdownMenuItem>
              <DropdownMenuItem>
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
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un investissement..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Right section - View switches and Profile */}
        <div className="flex items-center gap-4">
          {/* Société Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Building2 className="h-4 w-4" />
                Sociétés
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtrer par Société</SheetTitle>
                <SheetDescription>
                  Sélectionnez les sociétés à afficher dans les données
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité à implémenter
                </p>
              </div>
            </SheetContent>
          </Sheet>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Utilisateur
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Se déconnecter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard } from 'lucide-react';

export default function Dettes() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financements</h1>
          <p className="text-lg text-muted-foreground">
            Gestion des emprunts immobiliers
          </p>
        </div>
        
        <Button className="btn-financial gap-2">
          <Plus className="h-4 w-4" />
          Ajouter Financement
        </Button>
      </div>

      {/* Placeholder Content */}
      <Card className="card-financial">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Financements Immobiliers
          </CardTitle>
          <CardDescription>
            Suivi des emprunts immobiliers et de leurs échéanciers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun financement immobilier enregistré</p>
            <p className="text-sm mt-2">Commencez par ajouter un emprunt immobilier</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
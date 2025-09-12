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
          <h1 className="text-3xl font-bold text-foreground">Dettes</h1>
          <p className="text-lg text-muted-foreground">
            Gestion des emprunts et financements
          </p>
        </div>
        
        <Button className="btn-financial gap-2">
          <Plus className="h-4 w-4" />
          Ajouter Dette
        </Button>
      </div>

      {/* Placeholder Content */}
      <Card className="card-financial">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Liste des Dettes
          </CardTitle>
          <CardDescription>
            Suivi des emprunts et de leurs échéanciers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune dette enregistrée</p>
            <p className="text-sm mt-2">Commencez par ajouter un emprunt</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
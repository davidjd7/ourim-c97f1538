import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type InvestmentStatus = 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';

interface StatusProgressProps {
  currentStatus: InvestmentStatus;
  className?: string;
}

const statusConfig = {
  RECU: { label: 'Reçu', step: 1, className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', step: 2, className: 'status-due-dil' },
  INVESTI: { label: 'Investi', step: 3, className: 'status-investi' },
  VENDU: { label: 'Vendu', step: 4, className: 'status-vendu' },
  DROP: { label: 'Drop', step: 0, className: 'status-drop' }
};

const statusOrder: InvestmentStatus[] = ['RECU', 'DUE_DIL', 'INVESTI', 'VENDU'];

export function StatusProgress({ currentStatus, className }: StatusProgressProps) {
  const currentStep = statusConfig[currentStatus].step;
  const { toast } = useToast();
  
  // États pour les dialogs
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [dropMotif, setDropMotif] = useState('');
  
  // États pour le dialog d'investissement
  const [investmentDate, setInvestmentDate] = useState<Date>();
  const [investedAmount, setInvestedAmount] = useState('');
  const [investmentCost, setInvestmentCost] = useState('');

  const handleStatusChange = (newStatus: InvestmentStatus) => {
    // Ici on pourrait appeler une fonction pour mettre à jour le statut
    console.log('Changement de statut vers:', newStatus);
    toast({
      title: "Statut mis à jour",
      description: `Le statut a été changé vers ${statusConfig[newStatus].label}`,
    });
  };

  const handleDrop = () => {
    if (!dropMotif.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un motif pour l'abandon",
        variant: "destructive"
      });
      return;
    }
    
    // Sauvegarder le motif dans l'historique
    console.log('Drop avec motif:', dropMotif);
    handleStatusChange('DROP');
    setDropDialogOpen(false);
    setDropMotif('');
  };

  const handleInvest = () => {
    if (!investmentDate || !investedAmount || !investmentCost) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }
    
    // Sauvegarder les données d'investissement
    console.log('Investissement:', {
      date: investmentDate,
      amount: investedAmount,
      cost: investmentCost
    });
    
    handleStatusChange('INVESTI');
    setInvestDialogOpen(false);
    setInvestmentDate(undefined);
    setInvestedAmount('');
    setInvestmentCost('');
  };

  const getAvailableActions = () => {
    switch (currentStatus) {
      case 'RECU':
        return (
          <Button 
            size="sm" 
            onClick={() => handleStatusChange('DUE_DIL')}
            className="btn-financial"
          >
            Due Dil
          </Button>
        );
      case 'DUE_DIL':
        return (
          <div className="flex gap-2">
            <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-financial">
                  Investir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer l'investissement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="investment-date">Date d'investissement</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !investmentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {investmentDate ? (
                            format(investmentDate, "PPP", { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={investmentDate}
                          onSelect={setInvestmentDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label htmlFor="invested-amount">Montant investi (€)</Label>
                    <Input
                      id="invested-amount"
                      type="number"
                      value={investedAmount}
                      onChange={(e) => setInvestedAmount(e.target.value)}
                      placeholder="Ex: 2000000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="investment-cost">Coût d'investissement (€)</Label>
                    <Input
                      id="investment-cost"
                      type="number"
                      value={investmentCost}
                      onChange={(e) => setInvestmentCost(e.target.value)}
                      placeholder="Ex: 50000"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setInvestDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleInvest} className="btn-financial">
                      Confirmer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  Drop
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abandonner l'investissement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="drop-motif">Motif de l'abandon</Label>
                    <Textarea
                      id="drop-motif"
                      value={dropMotif}
                      onChange={(e) => setDropMotif(e.target.value)}
                      placeholder="Veuillez expliquer les raisons de l'abandon..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDropDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleDrop} variant="destructive">
                      Confirmer l'abandon
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      case 'INVESTI':
        return (
          <Button 
            size="sm" 
            onClick={() => handleStatusChange('VENDU')}
            className="btn-financial"
          >
            Marquer comme vendu
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Progression du statut</h3>
         <div className="flex items-center gap-3">
           {getAvailableActions()}
         </div>
      </div>
      
      {currentStatus !== 'DROP' && (
        <div className="relative">
          {/* Barre de progression de fond */}
          <div className="w-full h-2 bg-muted rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          
          {/* Points d'étapes */}
          <div className="flex justify-between relative -mt-1">
            {statusOrder.map((status, index) => (
              <div key={status} className="flex flex-col items-center group">
                <div className="relative">
                  <div 
                    className={`w-6 h-6 rounded-full border-3 transition-all duration-500 ${
                      statusConfig[status].step <= currentStep
                        ? 'bg-gradient-to-br from-primary to-primary-glow border-primary shadow-lg shadow-primary/30 scale-110' 
                        : 'bg-background border-muted-foreground/40 hover:border-muted-foreground/60'
                    }`}
                  >
                    {statusConfig[status].step <= currentStep && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full animate-scale-in" />
                      </div>
                    )}
                    {statusConfig[status].step === currentStep && (
                      <div className="absolute -inset-1 bg-primary/20 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  {/* Connecteur vers l'étape suivante */}
                  {index < statusOrder.length - 1 && (
                    <div className="absolute top-3 left-6 w-full h-0.5">
                      <div 
                        className={`h-full transition-all duration-700 ${
                          statusConfig[status].step < currentStep
                            ? 'bg-gradient-to-r from-primary to-primary-glow'
                            : 'bg-muted-foreground/20'
                        }`}
                        style={{ width: 'calc(100% + 1rem)' }}
                      />
                    </div>
                  )}
                </div>
                
                <span 
                  className={`text-xs mt-3 transition-all duration-500 font-medium ${
                    statusConfig[status].step <= currentStep
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  {statusConfig[status].label}
                </span>
                
                {statusConfig[status].step === currentStep && (
                  <div className="mt-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {currentStatus === 'DROP' && (
        <div className="text-center py-4">
          <div className="w-full h-2 bg-destructive/20 rounded-full mb-4">
            <div className="h-2 bg-destructive rounded-full w-full" />
          </div>
          <span className="text-destructive text-sm font-medium">Investissement abandonné</span>
        </div>
      )}
    </div>
  );
}
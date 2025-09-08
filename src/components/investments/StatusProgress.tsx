import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCompanies } from '@/contexts/CompanyContext';

type InvestmentStatus = 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';

interface StatusProgressProps {
  currentStatus: InvestmentStatus;
  className?: string;
  onStatusChange?: (newStatus: InvestmentStatus, data?: any) => void;
  netVendeur?: number;
  agent?: number;
  honoNotaire?: number;
}

const statusConfig = {
  RECU: { label: 'Reçu', step: 1, className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', step: 2, className: 'status-due-dil' },
  INVESTI: { label: 'Investi', step: 3, className: 'status-investi' },
  VENDU: { label: 'Vendu', step: 4, className: 'status-vendu' },
  DROP: { label: 'Drop', step: 0, className: 'status-drop' }
};

const statusOrder: InvestmentStatus[] = ['RECU', 'DUE_DIL', 'INVESTI', 'VENDU'];

export function StatusProgress({ currentStatus, className, onStatusChange, netVendeur = 0, agent = 0, honoNotaire = 0 }: StatusProgressProps) {
  const currentStep = statusConfig[currentStatus].step;
  const { toast } = useToast();
  const { companies } = useCompanies();
  
  // Calcul des valeurs par défaut
  const defaultInvestedAmount = netVendeur;
  const defaultInvestmentCost = netVendeur * (agent + honoNotaire);
  
  // États pour les dialogs
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [dropMotif, setDropMotif] = useState('');
  
  // États pour le dialog d'investissement
  const [investmentDate, setInvestmentDate] = useState<Date>();
  const [investedAmount, setInvestedAmount] = useState('');
  const [investmentCost, setInvestmentCost] = useState('');
  const [company, setCompany] = useState('');

  // Mettre à jour les valeurs par défaut quand le dialog d'investissement s'ouvre
  useEffect(() => {
    if (investDialogOpen) {
      setInvestedAmount(defaultInvestedAmount ? defaultInvestedAmount.toString() : '');
      setInvestmentCost(defaultInvestmentCost ? defaultInvestmentCost.toString() : '');
    }
  }, [investDialogOpen, defaultInvestedAmount, defaultInvestmentCost]);

  const handleStatusChange = (newStatus: InvestmentStatus, data?: any) => {
    // Appeler le callback si fourni
    if (onStatusChange) {
      onStatusChange(newStatus, data);
    }
    
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
    if (!investmentDate || !investedAmount || !investmentCost || !company) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }
    
    // Préparer les données d'investissement
    const investmentData = {
      date: investmentDate,
      amount: Number(investedAmount),
      cost: Number(investmentCost),
      company: company
    };
    
    console.log('Investissement:', investmentData);
    
    handleStatusChange('INVESTI', investmentData);
    setInvestDialogOpen(false);
    setInvestmentDate(undefined);
    setInvestedAmount('');
    setInvestmentCost('');
    setCompany('');
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
                  
                  <div>
                    <Label htmlFor="company">Société</Label>
                    <Select value={company} onValueChange={setCompany}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez une société" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        {companies.map((comp) => (
                          <SelectItem key={comp.id} value={comp.id}>
                            {comp.name}
                          </SelectItem>
                        ))}
                        {companies.length === 0 && (
                          <SelectItem value="no-company" disabled>
                            Aucune société disponible
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleStatusChange('DUE_DIL')}
            >
              Retour Due Dil
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleStatusChange('VENDU')}
              className="btn-financial"
            >
              Marquer comme vendu
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${className} card-financial p-6 border border-border/50 shadow-lg rounded-xl bg-gradient-to-br from-background to-background/95`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Progression du statut</h3>
         <div className="flex items-center gap-3">
           {getAvailableActions()}
         </div>
      </div>
      
      {currentStatus !== 'DROP' && (
        <div className="space-y-4">
          {/* Progression avec flèches */}
          <div className="flex items-center justify-between">
            {statusOrder.map((status, index) => (
              <div key={status} className="flex items-center flex-1">
                {/* Étape */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                      statusConfig[status].step <= currentStep
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {statusConfig[status].step <= currentStep ? '✓' : statusConfig[status].step}
                  </div>
                  <span 
                    className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                      statusConfig[status].step <= currentStep
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    {statusConfig[status].label}
                  </span>
                  {statusConfig[status].step === currentStep && (
                    <div className="mt-1 text-xs text-success font-medium">
                      En cours
                    </div>
                  )}
                </div>
                
                {/* Flèche vers l'étape suivante */}
                {index < statusOrder.length - 1 && (
                  <div className="flex-1 flex items-center justify-center mx-4">
                    <div 
                      className={`w-0 h-0 transition-all duration-500 ${
                        statusConfig[status].step < currentStep
                          ? 'border-l-[12px] border-l-primary border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent'
                          : 'border-l-[12px] border-l-muted-foreground/30 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent'
                      }`}
                    />
                  </div>
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
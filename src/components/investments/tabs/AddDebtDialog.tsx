import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddDebtDialogProps {
  investmentId: string;
  onDebtAdded: () => void;
}

export function AddDebtDialog({ investmentId, onDebtAdded }: AddDebtDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    montant_initial: '',
    duree_mois: '',
    taux: '',
    type: 'Amortissement constant',
    amortissement_annuel: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      
      const debtData = {
        asset_id: investmentId,
        asset_type: 'immobilier',
        user_id: user.id,
        montant_initial: formData.montant_initial ? parseFloat(formData.montant_initial) : 0,
        duree_mois: formData.duree_mois ? parseInt(formData.duree_mois) : 0,
        taux: formData.taux ? parseFloat(formData.taux) : 0,
        type: formData.type,
        amortissement_annuel: formData.amortissement_annuel ? parseFloat(formData.amortissement_annuel) : null
      };

      const { error } = await supabase
        .from('debt_characteristics')
        .insert([debtData]);

      if (error) throw error;

      toast.success('Dette ajoutée avec succès');
      setOpen(false);
      setFormData({
        montant_initial: '',
        duree_mois: '',
        taux: '',
        type: 'Amortissement constant',
        amortissement_annuel: ''
      });
      onDebtAdded();
    } catch (error) {
      console.error('Error adding debt:', error);
      toast.error('Erreur lors de l\'ajout de la dette');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-financial gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une dette
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter une dette</DialogTitle>
          <DialogDescription>
            Ajoutez les caractéristiques de votre emprunt (tous les champs sont optionnels)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="montant_initial">Montant initial (€)</Label>
              <Input
                id="montant_initial"
                type="number"
                step="0.01"
                value={formData.montant_initial}
                onChange={(e) => handleInputChange('montant_initial', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="duree_mois">Durée (mois)</Label>
              <Input
                id="duree_mois"
                type="number"
                value={formData.duree_mois}
                onChange={(e) => handleInputChange('duree_mois', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taux">Taux (%)</Label>
              <Input
                id="taux"
                type="number"
                step="0.01"
                value={formData.taux}
                onChange={(e) => handleInputChange('taux', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="type">Type d'amortissement</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Amortissement constant">Amortissement constant</SelectItem>
                  <SelectItem value="Échéance constante">Échéance constante</SelectItem>
                  <SelectItem value="In fine">In fine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.type === 'Amortissement constant' && (
            <div>
              <Label htmlFor="amortissement_annuel">Amortissement annuel (€)</Label>
              <Input
                id="amortissement_annuel"
                type="number"
                step="0.01"
                value={formData.amortissement_annuel}
                onChange={(e) => handleInputChange('amortissement_annuel', e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInvestments } from '@/contexts/InvestmentContext';

export default function AjouterInvestissement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { addInvestment } = useInvestments();
  const [loading, setLoading] = useState(false);
  
  // Get the type from navigation state if available
  const initialType = location.state?.type || '';
  
  const [formData, setFormData] = useState({
    name: '',
    type: initialType as 'IMMO' | 'PE' | '',
    address: '',
    surface: '',
    price: '',
    description: '',
    locataire: '',
    dateEntree: '',
    typeBail: '',
    dureeBail: '',
    bailLoyerHT: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom et le type d'investissement.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const newInvestment = {
        name: formData.name,
        type: formData.type as 'IMMO' | 'PE',
        status: 'RECU' as const,
        lastValue: Number(formData.price) || 0,
        lastTRI: 0,
        lastCashflow: 0,
        lastVariation: { value: 0, percentage: 0 },
        address: formData.address,
        surface: Number(formData.surface) || undefined,
        price: Number(formData.price) || undefined,
        description: formData.description,
        locataire: formData.locataire,
        dateEntree: formData.dateEntree,
        typeBail: formData.typeBail,
        dureeBail: Number(formData.dureeBail) || undefined,
        bailLoyerHT: Number(formData.bailLoyerHT) || undefined,
        dateAcquisition: new Date().toISOString().split('T')[0],
        rentAmount: (Number(formData.bailLoyerHT) || 0) * 12,
        priceNV: Number(formData.price) || 0,
        tri: 0
      };

      const createdInvestment = await addInvestment(newInvestment);
      
      toast({
        title: "Investissement créé",
        description: `L'investissement "${formData.name}" a été créé avec succès.`,
      });
      
      // Rediriger vers la page de détail du nouvel investissement
      navigate(`/investissement/${createdInvestment.id}`);
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'investissement.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nouvel Investissement</h1>
          <p className="text-muted-foreground">
            Ajouter un nouveau projet d'investissement au portefeuille
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Renseignez les informations de base de votre investissement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'investissement *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Appartement Paris 16ème"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type d'investissement *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMMO">Immobilier</SelectItem>
                    <SelectItem value="PE">Private Equity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  placeholder="Ex: 12 rue de la Paix, 75001 Paris"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="surface">Surface (m²)</Label>
                <Input
                  id="surface"
                  type="number"
                  placeholder="Ex: 85"
                  value={formData.surface}
                  onChange={(e) => handleInputChange('surface', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prix d'acquisition (€)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Ex: 2100000"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de l'investissement..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {formData.type === 'IMMO' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Informations du bail
              </CardTitle>
              <CardDescription>
                Renseignez les informations sur le bail et la location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locataire">Locataire</Label>
                  <Input
                    id="locataire"
                    placeholder="Ex: SCI Parisienne"
                    value={formData.locataire}
                    onChange={(e) => handleInputChange('locataire', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateEntree">Date d'entrée</Label>
                  <Input
                    id="dateEntree"
                    type="date"
                    value={formData.dateEntree}
                    onChange={(e) => handleInputChange('dateEntree', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeBail">Type de bail</Label>
                  <Select value={formData.typeBail} onValueChange={(value) => handleInputChange('typeBail', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type de bail" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Habitation">Habitation</SelectItem>
                      <SelectItem value="Professionnel">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dureeBail">Durée du bail (années)</Label>
                  <Input
                    id="dureeBail"
                    type="number"
                    placeholder="Ex: 9"
                    value={formData.dureeBail}
                    onChange={(e) => handleInputChange('dureeBail', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bailLoyerHT">Loyer mensuel HT (€)</Label>
                  <Input
                    id="bailLoyerHT"
                    type="number"
                    placeholder="Ex: 12500"
                    value={formData.bailLoyerHT}
                    onChange={(e) => handleInputChange('bailLoyerHT', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="btn-financial"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer l\'investissement'}
          </Button>
        </div>
      </form>
    </div>
  );
}
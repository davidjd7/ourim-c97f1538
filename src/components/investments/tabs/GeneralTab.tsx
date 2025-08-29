import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Calendar, FileText, Link } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface GeneralData {
  name: string;
  type: 'IMMO' | 'PE';
  status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
  dateInvestment: string;
  address: string;
  surface: number;
  description: string;
  investmentAmount: number;
  acquisitionDate: string;
  notaryFees: number;
  renovationBudget: number;
  // Bail fields
  bailPriseEffet: string;
  bailActivite: string;
  bailAnciennete: number;
  bailNextBreak: string;
  bailGmapLink: string;
  bailGmapNote: string;
  bailLoyerHT: number;
}

interface GeneralTabProps {
  investmentId: string;
  isEditMode?: boolean;
  investmentData?: {
    id: string | undefined;
    name: string;
    type: 'IMMO' | 'PE';
    status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
    dateInvestment: string;
    address: string;
    surface: number;
    description?: string;
    investmentAmount: number;
    acquisitionDate: string;
    notaryFees: number;
    renovationBudget: number;
    // Bail fields
    bailPriseEffet?: string;
    bailActivite?: string;
    bailAnciennete?: number;
    bailNextBreak?: string;
    bailGmapLink?: string;
    bailGmapNote?: string;
    bailLoyerHT?: number;
  };
}

const mockGeneralData: GeneralData = {
  name: 'Faisanderie Paris',
  type: 'IMMO',
  status: 'DUE_DIL', // Changé de INVESTI à DUE_DIL pour refléter l'état actuel
  dateInvestment: '2023-03-15',
  address: '12 rue de la Faisanderie, 75016 Paris',
  surface: 250,
  description: 'Appartement haussmannien de standing dans le 16ème arrondissement de Paris. Situé au 3ème étage avec ascenseur, vue dégagée sur jardins privatifs.',
  investmentAmount: 0, // Sera mis à jour quand le statut passe à INVESTI
  acquisitionDate: '2023-03-15',
  notaryFees: 168000,
  renovationBudget: 50000,
  // Bail mock data
  bailPriseEffet: '2023-01-01',
  bailActivite: 'Bureau',
  bailAnciennete: 5,
  bailNextBreak: '2028-01-01',
  bailGmapLink: 'https://maps.google.com/?q=12+rue+de+la+Faisanderie+75016+Paris',
  bailGmapNote: 'Proche métro Trocadéro',
  bailLoyerHT: 12500
};

const statusConfig = {
  RECU: { label: 'Reçu', className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', className: 'status-due-dil' },
  INVESTI: { label: 'Investi', className: 'status-investi' },
  VENDU: { label: 'Vendu', className: 'status-vendu' },
  DROP: { label: 'Drop', className: 'status-drop' }
};

export function GeneralTab({ investmentId, isEditMode = false, investmentData }: GeneralTabProps) {
  const { canEdit } = useUserRole();
  
  // Utiliser les données passées en prop ou les données mock par défaut
  const initialData = investmentData ? {
    name: investmentData.name,
    type: investmentData.type,
    status: investmentData.status,
    dateInvestment: investmentData.dateInvestment,
    address: investmentData.address,
    surface: investmentData.surface,
    description: investmentData.description || 'Appartement haussmannien de standing dans le 16ème arrondissement de Paris. Situé au 3ème étage avec ascenseur, vue dégagée sur jardins privatifs.',
    investmentAmount: investmentData.investmentAmount,
    acquisitionDate: investmentData.acquisitionDate,
    notaryFees: investmentData.notaryFees,
    renovationBudget: investmentData.renovationBudget,
    // Bail fields avec valeurs par défaut
    bailPriseEffet: investmentData.bailPriseEffet || '',
    bailActivite: investmentData.bailActivite || '',
    bailAnciennete: investmentData.bailAnciennete || 0,
    bailNextBreak: investmentData.bailNextBreak || '',
    bailGmapLink: investmentData.bailGmapLink || '',
    bailGmapNote: investmentData.bailGmapNote || '',
    bailLoyerHT: investmentData.bailLoyerHT || 0
  } : mockGeneralData;
  
  const [data, setData] = useState<GeneralData>(initialData);
  const [editData, setEditData] = useState<GeneralData>(data);

  // Synchroniser avec les données externes quand elles changent
  React.useEffect(() => {
    if (investmentData) {
      const newData = {
        name: investmentData.name,
        type: investmentData.type,
        status: investmentData.status,
        dateInvestment: investmentData.dateInvestment,
        address: investmentData.address,
        surface: investmentData.surface,
        description: investmentData.description || 'Appartement haussmannien de standing dans le 16ème arrondissement de Paris. Situé au 3ème étage avec ascenseur, vue dégagée sur jardins privatifs.',
        investmentAmount: investmentData.investmentAmount,
        acquisitionDate: investmentData.acquisitionDate,
        notaryFees: investmentData.notaryFees,
        renovationBudget: investmentData.renovationBudget,
        // Bail fields avec valeurs par défaut
        bailPriseEffet: investmentData.bailPriseEffet || '',
        bailActivite: investmentData.bailActivite || '',
        bailAnciennete: investmentData.bailAnciennete || 0,
        bailNextBreak: investmentData.bailNextBreak || '',
        bailGmapLink: investmentData.bailGmapLink || '',
        bailGmapNote: investmentData.bailGmapNote || '',
        bailLoyerHT: investmentData.bailLoyerHT || 0
      };
      setData(newData);
      setEditData(newData);
    }
  }, [investmentData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Adresse</Label>
                {isEditMode ? (
                  <Input
                    id="address"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                ) : (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {data.address}
                  </p>
                )}
              </div>
            </div>

            {/* Financial Data */}
            <div className="space-y-4">
              {data.status === 'INVESTI' && (
                <div>
                  <Label htmlFor="investmentAmount">Montant d'investissement</Label>
                  {isEditMode ? (
                    <Input
                      id="investmentAmount"
                      type="number"
                      value={editData.investmentAmount}
                      onChange={(e) => setEditData({ ...editData, investmentAmount: Number(e.target.value) })}
                    />
                  ) : (
                    <p className="text-lg font-medium financial-value">
                      {formatCurrency(data.investmentAmount)}
                    </p>
                  )}
                </div>
              )}

              {data.status === 'INVESTI' && (
                <div>
                  <Label htmlFor="acquisitionDate">Date d'acquisition</Label>
                  {isEditMode ? (
                    <Input
                      id="acquisitionDate"
                      type="date"
                      value={editData.dateInvestment}
                      onChange={(e) => setEditData({ ...editData, dateInvestment: e.target.value, acquisitionDate: e.target.value })}
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(data.dateInvestment).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="surface">Surface Utile Pondérée (m2.UP)</Label>
                {isEditMode ? (
                  <Input
                    id="surface"
                    type="number"
                    value={editData.surface}
                    onChange={(e) => setEditData({ ...editData, surface: Number(e.target.value) })}
                  />
                ) : (
                  <p className="font-medium">{data.surface} m²</p>
                )}
              </div>

              {data.status === 'INVESTI' && (
                <div>
                  <Label htmlFor="notaryFees">Coût d'investissement</Label>
                  {isEditMode ? (
                    <Input
                      id="notaryFees"
                      type="number"
                      value={editData.notaryFees}
                      onChange={(e) => setEditData({ ...editData, notaryFees: Number(e.target.value) })}
                    />
                  ) : (
                    <p className="font-medium financial-value">
                      {formatCurrency(data.notaryFees)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="description">Description</Label>
            {isEditMode ? (
              <Textarea
                id="description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={4}
              />
            ) : (
              <p className="text-muted-foreground mt-2">{data.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Bail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations du Bail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="bailPriseEffet">Date de prise d'Effet</Label>
              {isEditMode ? (
                <Input
                  id="bailPriseEffet"
                  type="date"
                  value={editData.bailPriseEffet}
                  onChange={(e) => setEditData({ ...editData, bailPriseEffet: e.target.value })}
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {data.bailPriseEffet ? new Date(data.bailPriseEffet).toLocaleDateString('fr-FR') : 'Non défini'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bailActivite">Activité</Label>
              {isEditMode ? (
                <Input
                  id="bailActivite"
                  value={editData.bailActivite}
                  onChange={(e) => setEditData({ ...editData, bailActivite: e.target.value })}
                />
              ) : (
                <p className="font-medium">{data.bailActivite || 'Non défini'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bailAnciennete">Ancienneté (années)</Label>
              {isEditMode ? (
                <Input
                  id="bailAnciennete"
                  type="number"
                  value={editData.bailAnciennete}
                  onChange={(e) => setEditData({ ...editData, bailAnciennete: Number(e.target.value) })}
                />
              ) : (
                <p className="font-medium">{data.bailAnciennete} années</p>
              )}
            </div>

            <div>
              <Label htmlFor="bailNextBreak">Next Break</Label>
              {isEditMode ? (
                <Input
                  id="bailNextBreak"
                  type="date"
                  value={editData.bailNextBreak}
                  onChange={(e) => setEditData({ ...editData, bailNextBreak: e.target.value })}
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {data.bailNextBreak ? new Date(data.bailNextBreak).toLocaleDateString('fr-FR') : 'Non défini'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bailGmapLink">Lien Gmap</Label>
              {isEditMode ? (
                <Input
                  id="bailGmapLink"
                  type="url"
                  value={editData.bailGmapLink}
                  onChange={(e) => setEditData({ ...editData, bailGmapLink: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  {data.bailGmapLink ? (
                    <a 
                      href={data.bailGmapLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Link className="h-4 w-4" />
                      Voir sur Google Maps
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Non défini</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="bailLoyerHT">Loyer HT.HC</Label>
              {isEditMode ? (
                <Input
                  id="bailLoyerHT"
                  type="number"
                  step="0.01"
                  value={editData.bailLoyerHT}
                  onChange={(e) => setEditData({ ...editData, bailLoyerHT: Number(e.target.value) })}
                />
              ) : (
                <p className="font-medium financial-value">
                  {formatCurrency(data.bailLoyerHT)}
                </p>
              )}
            </div>

            {/* Champ calculé */}
            <div>
              <Label>Loyer HT.HC/ m2</Label>
              <p className="font-medium financial-value">
                {data.surface > 0 ? formatCurrency(data.bailLoyerHT / data.surface) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="bailGmapNote">Note Gmap</Label>
            {isEditMode ? (
              <Textarea
                id="bailGmapNote"
                value={editData.bailGmapNote}
                onChange={(e) => setEditData({ ...editData, bailGmapNote: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground mt-2">{data.bailGmapNote || 'Aucune note'}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
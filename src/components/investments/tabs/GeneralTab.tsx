import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Calendar, FileText, Link, Calculator, Settings } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useSettings } from '@/hooks/useSettings';
import { useCompanies } from '@/contexts/CompanyContext';

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
  companyId?: string;
  company?: string;
  // Bail fields
  bailPriseEffet: string;
  bailActivite: string;
  bailAnciennete: number;
  bailNextBreak: string;
  bailFinBail: string;
  bailGmapLink: string;
  bailGmapNote: string;
  bailLoyerHT: number;
  bailCNR: number;
  // Présentation Vente fields
  netVendeur: number;
  agent: number;
  honoNotaire: number; // Ce sera géré via les paramètres plus tard
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
    companyId?: string;  // Added this field
    company?: string;
    // Bail fields
    bailPriseEffet?: string;
    bailActivite?: string;
    bailAnciennete?: number;
    bailNextBreak?: string;
    bailFinBail?: string;
    bailGmapLink?: string;
    bailGmapNote?: string;
    bailLoyerHT?: number;
    bailCNR?: number;
    // Présentation Vente fields
    netVendeur?: number;
    agent?: number;
    honoNotaire?: number;
  };
  tempEditData?: any;
  onDataChange?: (data: any) => void;
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
  bailFinBail: '2032-01-01',
  bailGmapLink: 'https://maps.google.com/?q=12+rue+de+la+Faisanderie+75016+Paris',
  bailGmapNote: 'Proche métro Trocadéro',
  bailLoyerHT: 12500,
  bailCNR: 500,
  // Présentation Vente mock data
  netVendeur: 2100000,
  agent: 0.03, // 3%
  honoNotaire: 0.08 // 8% - sera géré par les paramètres plus tard
};

const statusConfig = {
  RECU: { label: 'Reçu', className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', className: 'status-due-dil' },
  INVESTI: { label: 'Investi', className: 'status-investi' },
  VENDU: { label: 'Vendu', className: 'status-vendu' },
  DROP: { label: 'Drop', className: 'status-drop' }
};

export function GeneralTab({ investmentId, isEditMode = false, investmentData, tempEditData, onDataChange }: GeneralTabProps) {
  const { canEdit } = useUserRole();
  const settings = useSettings();
  const { companies } = useCompanies();
  
  // Utiliser les données passées en prop ou les données mock par défaut
  const initialData = investmentData ? {
    name: investmentData.name,
    type: investmentData.type,
    status: investmentData.status,
    dateInvestment: investmentData.dateInvestment,
    address: investmentData.address,
    surface: investmentData.surface,
    description: investmentData.description || '',
    investmentAmount: investmentData.investmentAmount,
    acquisitionDate: investmentData.acquisitionDate,
    notaryFees: investmentData.notaryFees,
    renovationBudget: investmentData.renovationBudget,
    companyId: investmentData.companyId, // ← AJOUT CRUCIAL
    company: investmentData.company,
    // Bail fields avec valeurs par défaut
    bailPriseEffet: investmentData.bailPriseEffet || '',
    bailActivite: investmentData.bailActivite || '',
    bailAnciennete: investmentData.bailAnciennete || 0,
    bailNextBreak: investmentData.bailNextBreak || '',
    bailFinBail: investmentData.bailFinBail || '',
    bailGmapLink: investmentData.bailGmapLink || '',
    bailGmapNote: investmentData.bailGmapNote || '',
    bailLoyerHT: investmentData.bailLoyerHT || 0,
    bailCNR: investmentData.bailCNR || 0,
    // Présentation Vente fields avec valeurs par défaut - utiliser les paramètres pour honoNotaire
    netVendeur: investmentData.netVendeur || 0,
    agent: investmentData.agent || 0,
    honoNotaire: settings.notaryFees / 100 // Convertir en décimal depuis les paramètres
  } : {
    ...mockGeneralData,
    honoNotaire: settings.notaryFees / 100 // Utiliser la valeur des paramètres
  };
  
  const [data, setData] = useState<GeneralData>(initialData);
  
  // En mode édition, utiliser tempEditData du parent, sinon utiliser l'état local
  const editData = isEditMode && tempEditData ? tempEditData : data;
  
  const handleDataChange = (newData: any) => {
    if (isEditMode && onDataChange) {
      onDataChange(newData);
    }
  };

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
        description: investmentData.description || '',
        investmentAmount: investmentData.investmentAmount,
        acquisitionDate: investmentData.acquisitionDate,
        notaryFees: investmentData.notaryFees,
        renovationBudget: investmentData.renovationBudget,
        company: investmentData.company,
        // Bail fields avec valeurs par défaut
        bailPriseEffet: investmentData.bailPriseEffet || '',
        bailActivite: investmentData.bailActivite || '',
        bailAnciennete: investmentData.bailAnciennete || 0,
        bailNextBreak: investmentData.bailNextBreak || '',
        bailFinBail: investmentData.bailFinBail || '',
        bailGmapLink: investmentData.bailGmapLink || '',
        bailGmapNote: investmentData.bailGmapNote || '',
        bailLoyerHT: investmentData.bailLoyerHT || 0,
        bailCNR: investmentData.bailCNR || 0,
        // Présentation Vente fields avec valeurs par défaut - utiliser les paramètres pour honoNotaire
        netVendeur: investmentData.netVendeur || 0,
        agent: investmentData.agent || 0,
        honoNotaire: settings.notaryFees / 100 // Utiliser la valeur des paramètres
      };
      setData(newData);
    }
  }, [investmentData, settings.notaryFees]); // Ajouter settings.notaryFees comme dépendance

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Section Informations d'Investissement */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informations d'Investissement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="dateInvestment">Date investissement</Label>
                {isEditMode ? (
                  <Input
                    id="dateInvestment"
                    type="date"
                    value={editData.dateInvestment}
                    onChange={(e) => handleDataChange({ ...editData, dateInvestment: e.target.value })}
                  />
                ) : (
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {data.dateInvestment ? new Date(data.dateInvestment).toLocaleDateString('fr-FR') : 'Non défini'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="investmentAmount">Montant Investi</Label>
                {isEditMode ? (
                  <Input
                    id="investmentAmount"
                    type="number"
                    value={editData.investmentAmount}
                    onChange={(e) => handleDataChange({ ...editData, investmentAmount: Number(e.target.value) })}
                  />
                ) : (
                  <p className="font-medium financial-value">
                    {data.investmentAmount ? formatCurrency(data.investmentAmount) : 'Non défini'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="notaryFees">Coût Investissement</Label>
                {isEditMode ? (
                  <Input
                    id="notaryFees"
                    type="number"
                    value={editData.notaryFees}
                    onChange={(e) => handleDataChange({ ...editData, notaryFees: Number(e.target.value) })}
                  />
                ) : (
                  <p className="font-medium financial-value">
                    {data.notaryFees ? formatCurrency(data.notaryFees) : 'Non défini'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="investAllIn">Invest All in</Label>
                <p className="font-medium financial-value text-primary">
                  {formatCurrency((isEditMode ? editData.investmentAmount : data.investmentAmount) + (isEditMode ? editData.notaryFees : data.notaryFees))}
                </p>
              </div>

              <div>
                <Label htmlFor="company">Société</Label>
                {isEditMode ? (
                  <Select 
                    value={editData.companyId || undefined} 
                    onValueChange={(value) => handleDataChange({ ...editData, companyId: value === 'clear' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une société" />
                    </SelectTrigger>
                    <SelectContent>
                      {editData.companyId && (
                        <SelectItem value="clear">
                          <span className="text-muted-foreground">Aucune société</span>
                        </SelectItem>
                      )}
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                      {companies.length === 0 && (
                        <SelectItem value="no-company" disabled>
                          Aucune société disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">
                    {(() => {
                      // Utiliser tempEditData.companyId comme source de vérité
                      const companyId = tempEditData?.companyId;
                      const foundCompany = companies.find(c => c.id === companyId);
                      return foundCompany?.name || (companyId ? 'Société inconnue' : 'Non défini');
                    })()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


      {/* Section Bail - Supprimée */}

      {/* Section Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="description">Notes et commentaires</Label>
            {isEditMode ? (
              <Textarea
                id="description"
                value={editData.description}
                onChange={(e) => handleDataChange({ ...editData, description: e.target.value })}
                placeholder="Ajoutez vos notes sur cet investissement"
                rows={6}
              />
            ) : (
              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                {data.description ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{data.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">Aucune note ajoutée</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Présentation Vente - Supprimée */}
    </div>
  );
}
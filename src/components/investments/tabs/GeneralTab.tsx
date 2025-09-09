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
      {/* Section Informations d'Investissement - uniquement si status = INVESTI */}
      {(isEditMode ? editData.status : data.status) === 'INVESTI' && (
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
                  <div className="space-y-2">
                    <p className="font-medium">
                      {(() => {
                        // Utiliser investmentData.companyId directement au lieu de data.companyId
                        const companyId = investmentData?.companyId;
                        return companies.find(c => c.id === companyId)?.name || (companyId ? 'Société inconnue' : 'Non défini');
                      })()}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1 bg-gray-100 p-2 rounded">
                      <p><strong>Debug Info:</strong></p>
                      <p>data.companyId: {String(data.companyId)}</p>
                      <p>investmentData?.companyId: {String(investmentData?.companyId)}</p>
                      <p>tempEditData?.companyId: {String(tempEditData?.companyId)}</p>
                      <p>Sociétés: [{companies.map(c => `${c.name}(${c.id})`).join(', ')}]</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  onChange={(e) => handleDataChange({ ...editData, address: e.target.value })}
                />
              ) : (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {data.address}
                  </p>
                )}
              </div>
            </div>

            {/* Surface next to address */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="surface">Surface Utile Pondérée (m2.UP)</Label>
                {isEditMode ? (
                  <Input
                    id="surface"
                    type="number"
                    value={editData.surface}
                    onChange={(e) => handleDataChange({ ...editData, surface: Number(e.target.value) })}
                  />
                ) : (
                  <p className="font-medium">{data.surface} m²</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="description">Description</Label>
            {isEditMode ? (
              <Textarea
                id="description"
                value={editData.description}
                onChange={(e) => handleDataChange({ ...editData, description: e.target.value })}
                placeholder="Décrivez l'investissement"
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
          {/* Première ligne: Activité - Ancienneté - Loyer HT.HC/m² */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <div>
              <Label htmlFor="bailActivite">Activité</Label>
              {isEditMode ? (
                <Input
                  id="bailActivite"
                  value={editData.bailActivite}
                  onChange={(e) => handleDataChange({ ...editData, bailActivite: e.target.value })}
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
                  onChange={(e) => handleDataChange({ ...editData, bailAnciennete: Number(e.target.value) })}
                />
              ) : (
                <p className="font-medium">{data.bailAnciennete} années</p>
              )}
            </div>

            <div>
              <Label>Loyer HT.HC/m²</Label>
              <p className="font-medium financial-value">
                {data.surface > 0 ? formatCurrency(data.bailLoyerHT / data.surface) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Deuxième ligne: Date de prise d'effet - Next Break - Fin Bail */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <div>
              <Label htmlFor="bailPriseEffet">Date de prise d'effet</Label>
              {isEditMode ? (
                <Input
                  id="bailPriseEffet"
                  type="date"
                  value={editData.bailPriseEffet}
                  onChange={(e) => handleDataChange({ ...editData, bailPriseEffet: e.target.value })}
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {data.bailPriseEffet ? new Date(data.bailPriseEffet).toLocaleDateString('fr-FR') : 'Non défini'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bailNextBreak">Next Break</Label>
              {isEditMode ? (
                <Input
                  id="bailNextBreak"
                  type="date"
                  value={editData.bailNextBreak}
                  onChange={(e) => handleDataChange({ ...editData, bailNextBreak: e.target.value })}
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {data.bailNextBreak ? new Date(data.bailNextBreak).toLocaleDateString('fr-FR') : 'Non défini'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bailFinBail">Fin Bail</Label>
              {isEditMode ? (
                <Input
                  id="bailFinBail"
                  type="date"
                  value={editData.bailFinBail}
                  onChange={(e) => handleDataChange({ ...editData, bailFinBail: e.target.value })}
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {data.bailFinBail ? new Date(data.bailFinBail).toLocaleDateString('fr-FR') : 'Non défini'}
                </p>
              )}
            </div>
          </div>

          {/* Troisième ligne: Loyer HT.HC (annuel) - Charge Non récupérable - Loyer net */}
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <Label htmlFor="bailLoyerHT">Loyer HT.HC (annuel)</Label>
              {isEditMode ? (
                <Input
                  id="bailLoyerHT"
                  type="number"
                  step="0.01"
                  value={editData.bailLoyerHT}
                  onChange={(e) => handleDataChange({ ...editData, bailLoyerHT: Number(e.target.value) })}
                />
              ) : (
                <p className="font-medium financial-value">
                  {formatCurrency(data.bailLoyerHT)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bailCNR">Charge Non Récupérable (CNR)</Label>
              {isEditMode ? (
                <Input
                  id="bailCNR"
                  type="number"
                  step="0.01"
                  value={editData.bailCNR}
                  onChange={(e) => handleDataChange({ ...editData, bailCNR: Number(e.target.value) })}
                />
              ) : (
                <p className="font-medium financial-value">
                  {formatCurrency(data.bailCNR)}
                </p>
              )}
            </div>

            <div>
              <Label>Loyer net HT.HC (annuel)</Label>
              <p className="font-medium financial-value text-primary">
                {formatCurrency(data.bailLoyerHT - data.bailCNR)}
              </p>
            </div>
          </div>

          {/* Section additionnelle pour les liens Google Maps */}
          <div className="grid gap-6 md:grid-cols-2 mt-6 pt-6 border-t">
            <div>
              <Label htmlFor="bailGmapLink">Lien Google Maps</Label>
              {isEditMode ? (
                <Input
                  id="bailGmapLink"
                  type="url"
                  value={editData.bailGmapLink}
                  onChange={(e) => handleDataChange({ ...editData, bailGmapLink: e.target.value })}
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
              <Label htmlFor="bailGmapNote">Note Google Maps</Label>
              {isEditMode ? (
                <Input
                  id="bailGmapNote"
                  value={editData.bailGmapNote}
                  onChange={(e) => handleDataChange({ ...editData, bailGmapNote: e.target.value })}
                />
              ) : (
                <p className="font-medium">{data.bailGmapNote || 'Aucune note'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Présentation Vente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Présentation Vente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="netVendeur">Net Vendeur</Label>
              {isEditMode ? (
                <Input
                  id="netVendeur"
                  type="number"
                  value={editData.netVendeur}
                  onChange={(e) => handleDataChange({ ...editData, netVendeur: Number(e.target.value) })}
                />
              ) : (
                <p className="font-medium financial-value">
                  {formatCurrency(data.netVendeur)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="agent">Agent (%)</Label>
              {isEditMode ? (
                <Input
                  id="agent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={editData.agent}
                  onChange={(e) => handleDataChange({ ...editData, agent: Number(e.target.value) })}
                />
              ) : (
                <p className="font-medium">
                  {(data.agent * 100).toFixed(2)}%
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="honoNotaire" className="flex items-center gap-2">
                Hono Notaire (%)
                <div title="Géré dans les paramètres">
                  <Settings className="h-3 w-3 text-muted-foreground" />
                </div>
              </Label>
              <p className="font-medium text-muted-foreground">
                {(data.honoNotaire * 100).toFixed(2)}%
              </p>
            </div>

            {/* Champs calculés */}
            <div>
              <Label>All In</Label>
              <p className="font-medium financial-value">
                {formatCurrency(data.netVendeur * (1 + data.agent + data.honoNotaire))}
              </p>
            </div>

            <div>
              <Label>All In/ m2</Label>
              <p className="font-medium financial-value">
                {data.surface > 0 ? formatCurrency((data.netVendeur * (1 + data.agent + data.honoNotaire)) / data.surface) : 'N/A'}
              </p>
            </div>

            <div>
              <Label>Rendement All In</Label>
              <p className="font-medium">
                {data.netVendeur > 0 ? 
                  `${((data.bailLoyerHT - data.bailCNR) / (data.netVendeur * (1 + data.agent + data.honoNotaire)) * 100).toFixed(2)}%` 
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
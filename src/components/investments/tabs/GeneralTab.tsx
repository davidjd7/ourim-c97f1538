import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Calendar, Edit2, Save, X } from 'lucide-react';
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
}

interface GeneralTabProps {
  investmentId: string;
}

const mockGeneralData: GeneralData = {
  name: 'Faisanderie Paris',
  type: 'IMMO',
  status: 'INVESTI',
  dateInvestment: '2023-03-15',
  address: '12 rue de la Faisanderie, 75016 Paris',
  surface: 250,
  description: 'Appartement haussmannien de standing dans le 16ème arrondissement de Paris. Situé au 3ème étage avec ascenseur, vue dégagée sur jardins privatifs.',
  investmentAmount: 2100000,
  acquisitionDate: '2023-03-15',
  notaryFees: 168000,
  renovationBudget: 50000
};

const statusConfig = {
  RECU: { label: 'Reçu', className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', className: 'status-due-dil' },
  INVESTI: { label: 'Investi', className: 'status-investi' },
  VENDU: { label: 'Vendu', className: 'status-vendu' },
  DROP: { label: 'Drop', className: 'status-drop' }
};

export function GeneralTab({ investmentId }: GeneralTabProps) {
  const { canEdit } = useUserRole();
  const [data, setData] = useState<GeneralData>(mockGeneralData);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<GeneralData>(data);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSave = () => {
    setData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations générales
          </CardTitle>
          {canEdit && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Annuler
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4" />
                  Modifier
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de l'investissement</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-medium">{data.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                {isEditing ? (
                  <Select
                    value={editData.type}
                    onValueChange={(value: 'IMMO' | 'PE') => setEditData({ ...editData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMO">Immobilier</SelectItem>
                      <SelectItem value="PE">Private Equity</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="flex items-center gap-2">
                    {data.type === 'IMMO' ? (
                      <>
                        <Building className="h-4 w-4" />
                        Immobilier
                      </>
                    ) : (
                      'Private Equity'
                    )}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                {isEditing ? (
                  <Select
                    value={editData.status}
                    onValueChange={(value: any) => setEditData({ ...editData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECU">Reçu</SelectItem>
                      <SelectItem value="DUE_DIL">Due Dil</SelectItem>
                      <SelectItem value="INVESTI">Investi</SelectItem>
                      <SelectItem value="VENDU">Vendu</SelectItem>
                      <SelectItem value="DROP">Drop</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={statusConfig[data.status].className}>
                    {statusConfig[data.status].label}
                  </Badge>
                )}
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                {isEditing ? (
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
              <div>
                <Label htmlFor="investmentAmount">Montant d'investissement</Label>
                {isEditing ? (
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

              <div>
                <Label htmlFor="acquisitionDate">Date d'acquisition</Label>
                {isEditing ? (
                  <Input
                    id="acquisitionDate"
                    type="date"
                    value={editData.acquisitionDate}
                    onChange={(e) => setEditData({ ...editData, acquisitionDate: e.target.value })}
                  />
                ) : (
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(data.acquisitionDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="surface">Surface (m²)</Label>
                {isEditing ? (
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

              <div>
                <Label htmlFor="notaryFees">Frais de notaire</Label>
                {isEditing ? (
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
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
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
    </div>
  );
}
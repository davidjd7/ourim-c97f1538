export interface FieldConfig {
  key: keyof DebtCharacteristics;
  label: string;
  type: 'text' | 'number' | 'select' | 'percentage';
  options?: { value: string; label: string }[];
  condition?: (data: DebtCharacteristics) => boolean;
  format?: (value: any) => string;
  step?: string;
  placeholder?: string;
}

export interface DebtCharacteristics {
  id?: string;
  montantInitial: number;
  dureeMois: number;
  taux: number;
  type: 'Amortissement constant' | 'Annuité constante';
  amortissementAnnuel?: number;
  typeCredit?: 'Hypothécaire' | 'Lombard';
  typeTaux?: 'Fixe' | 'Variable';
  marge?: number;
  indiceBase?: 'OAT 10 ANS' | 'EURIBOR 3M' | 'EURIBOR 6M' | 'Fixe (0%)';
  banque?: string;
  echeance?: 'Fixe' | 'Découvert';
  base?: 'OAT 10 ANS' | 'EURIBOR 3M' | 'EURIBOR 6M' | 'Fixe (0%)';
  couvertureLtv?: number;
  clauseArrosage?: 'Oui' | 'Non';
}

export const FIELD_CONFIG: FieldConfig[] = [
  // Column 1
  {
    key: 'typeCredit',
    label: 'Type de crédit',
    type: 'select',
    options: [
      { value: 'Hypothécaire', label: 'Hypothécaire' },
      { value: 'Lombard', label: 'Lombard' },
    ],
  },
  {
    key: 'banque',
    label: 'Banque',
    type: 'text',
    placeholder: 'Nom de la banque',
  },
  {
    key: 'montantInitial',
    label: 'Montant Tiré (€)',
    type: 'number',
    format: (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value),
  },

  // Column 2 - Dynamic based on credit type
  {
    key: 'typeTaux',
    label: 'Type de taux',
    type: 'select',
    condition: (data) => data.typeCredit === 'Hypothécaire',
    options: [
      { value: 'Fixe', label: 'Fixe' },
      { value: 'Variable', label: 'Variable' },
    ],
  },
  {
    key: 'indiceBase',
    label: 'Indice de base',
    type: 'select',
    condition: (data) => data.typeCredit === 'Hypothécaire' && data.typeTaux === 'Variable',
    options: [
      { value: 'EURIBOR 3M', label: 'EURIBOR 3M' },
      { value: 'EURIBOR 6M', label: 'EURIBOR 6M' },
      { value: 'OAT 10 ANS', label: 'OAT 10 ANS' },
      { value: 'Fixe (0%)', label: 'Fixe (0%)' },
    ],
  },
  {
    key: 'marge',
    label: 'Marge (%)',
    type: 'percentage',
    condition: (data) => (data.typeCredit === 'Hypothécaire' && data.typeTaux === 'Variable') || data.typeCredit === 'Lombard',
    step: '0.01',
    format: (value) => value ? `${value.toFixed(2)}%` : '-',
  },
  {
    key: 'taux',
    label: 'Taux (%)',
    type: 'percentage',
    condition: (data) => data.typeCredit === 'Hypothécaire' && data.typeTaux === 'Fixe',
    step: '0.01',
    format: (value) => `${value.toFixed(1)}%`,
  },
  {
    key: 'echeance',
    label: 'Échéance',
    type: 'select',
    condition: (data) => data.typeCredit === 'Lombard',
    options: [
      { value: 'Fixe', label: 'Fixe' },
      { value: 'Découvert', label: 'Découvert' },
    ],
  },
  {
    key: 'base',
    label: 'Base',
    type: 'select',
    condition: (data) => data.typeCredit === 'Lombard',
    options: [
      { value: 'EURIBOR 3M', label: 'EURIBOR 3M' },
      { value: 'EURIBOR 6M', label: 'EURIBOR 6M' },
      { value: 'OAT 10 ANS', label: 'OAT 10 ANS' },
      { value: 'Fixe (0%)', label: 'Fixe (0%)' },
    ],
  },

  // Column 3
  {
    key: 'dureeMois',
    label: 'Durée (mois)',
    type: 'number',
    condition: (data) => data.typeCredit === 'Hypothécaire' || (data.typeCredit === 'Lombard' && data.echeance === 'Fixe'),
    format: (value) => value ? `${value} mois` : '-',
  },
  {
    key: 'type',
    label: 'Type d\'amortissement',
    type: 'select',
    options: [
      { value: 'Amortissement constant', label: 'Amortissement constant' },
      { value: 'Annuité constante', label: 'Annuité constante' },
    ],
  },
  {
    key: 'amortissementAnnuel',
    label: 'Amortissement annuel (%)',
    type: 'percentage',
    condition: (data) => data.type === 'Amortissement constant',
    step: '0.01',
    format: (value) => value ? `${value.toFixed(2)}%` : '-',
  },

  // Column 4 - Lombard specific
  {
    key: 'couvertureLtv',
    label: 'Couverture LTV (%)',
    type: 'percentage',
    condition: (data) => data.typeCredit === 'Lombard',
    step: '0.01',
    format: (value) => value ? `${value.toFixed(2)}%` : '-',
  },
  {
    key: 'clauseArrosage',
    label: 'Clause d\'arrosage',
    type: 'select',
    condition: (data) => data.typeCredit === 'Lombard',
    options: [
      { value: 'Oui', label: 'Oui' },
      { value: 'Non', label: 'Non' },
    ],
  },
];
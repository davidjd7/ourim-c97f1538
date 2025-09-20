// Shared types for KPI calculations
export interface CashflowRow {
  id?: string;
  date: string;
  rex: number;
  retraitAmort: number;
  retraitAutres: number;
  loyer: number;
  note?: string;
}

export interface ValorisationRow {
  id?: string;
  date: string;
  valeur: number;
  note: string;
}

export interface DebtFlowRow {
  id?: string;
  date: string;
  capitalDebut: number;
  rmbtCapital: number;
  rmbtInteret: number;
}

export interface ImmobilisationRow {
  id?: string;
  date: string;
  montant: number;
  note: string;
}

export interface SyntheseRow {
  date: string;
  flux: number;
  valeur: number;
  crd: number;
  fp: number;
}

export interface InvestmentKPIs {
  fondPropre: number;
  fondPropreDetails: { valeur: number; crd: number; ltv: number; year: number };
  rendementNet: number;
  rendementNetDetails: { noi: number; loyer: number; noiSurLoyer: number; year: number; yieldBanque: number };
  totalReturn: number;
  totalReturnDetails: { cfni: number; deltaValeur: number; cocNet: number; cfniPlusDeltaValeur: number; year: number; gain: number };
  xirr: number;
  xirrDetails: { totalCfni: number; cfniDerniereAnnee: number; deltaValeur: number; variationValeurDerniereAnnee: number; total: number; years: number; gain1: number; lastCfniYear: number; lastVarValeurYear: number; gain1Year: number; latestCf: number; latestCfYear: number };
  chartData: ConsolidatedRow[];
}

export interface InvestmentRawData {
  cashflows: CashflowRow[];
  valorisations: ValorisationRow[];
  debtFlows: DebtFlowRow[];
  immobilisations: ImmobilisationRow[];
}

export interface BatchKPIData {
  [investmentId: string]: InvestmentKPIs;
}

// Additional interfaces for consolidated KPI view
export interface ConsolidatedRow {
  annee: number;
  fondPropre: number;
  valeur: number;
  crd: number;
  noi: number;
  cfni: number;
}
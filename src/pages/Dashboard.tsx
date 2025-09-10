import React from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { InvestmentTable } from '@/components/dashboard/InvestmentTable';
import { InvestmentChart, CashflowChart } from '@/components/dashboard/InvestmentChart';
import { 
  Wallet, 
  TrendingUp, 
  Euro, 
  Building,
  BarChart3,
  Target
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Vue d'ensemble de votre portefeuille d'investissements
        </p>
      </div>

      {/* KPI Cards - Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ces KPI seront connectés aux vraies données de performance */}
        
        {/* Fond Propre */}
        <div className="card-financial p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Fond Propre (2024)</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold financial-value">€1,367,000</p>
                <div className="text-xs text-muted-foreground text-left">
                  <div>Valeur: €2,390,000</div>
                  <div>CRD: €1,023,000</div>
                  <div>LTV: 42.8%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dernier Earning */}
        <div className="card-financial p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Dernier Earning (2024)</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold financial-value text-success">+€113,275</p>
                <div className="text-xs text-muted-foreground text-left">
                  <div>Flux: +€163,329</div>
                  <div>Var Valeur: -€50,000 (-2.0%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dernier Flux */}
        <div className="card-financial p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Dernier Flux (2024)</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold financial-value text-success">+€163,329</p>
                  <p className="text-xs text-muted-foreground">142% du loyer</p>
                </div>
                <div className="text-xs text-muted-foreground text-left">
                  <div>Cap Rate: +6.8%</div>
                  <div>COC: +11.9%</div>
                  <div>Yield Banque: +16.0%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* XIRR */}
        <div className="card-financial p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">XIRR (3Y)</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold financial-value text-primary">12.5%</p>
                <div className="text-xs text-muted-foreground text-left">
                  <div>Total: +€170,000</div>
                  <div>Flux: +€220,000</div>
                  <div>Valeur: -€50,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - By Asset Type */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Par Type d'Actif</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Immobilier */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Immobilier
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <KPICard
                title="Actifs"
                value="8"
                subtitle="Investis"
                icon={Building}
                className="text-sm"
              />
              <KPICard
                title="Valeur"
                value="€18.2M"
                subtitle="Portefeuille immo"
                icon={Euro}
                className="text-sm"
              />
            </div>
          </div>

          {/* Private Equity */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Private Equity  
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <KPICard
                title="Fonds"
                value="4"
                subtitle="Investis"
                icon={BarChart3}
                className="text-sm"
              />
              <KPICard
                title="Valeur"
                value="€6.3M"
                subtitle="Portefeuille PE"
                icon={Euro}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Pipelines</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Immobilier */}
          <div className="card-financial p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Pipeline Immobilier
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-xs text-blue-600">Reçu</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50">
                <div className="text-2xl font-bold text-orange-600">2</div>
                <div className="text-xs text-orange-600">Due Dil</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-success-lighter">
                <div className="text-2xl font-bold text-success">8</div>
                <div className="text-xs text-success">Investi</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-600">1</div>
                <div className="text-xs text-purple-600">Vendu</div>
              </div>
            </div>
          </div>

          {/* Pipeline PE */}
          <div className="card-financial p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pipeline Private Equity
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">2</div>
                <div className="text-xs text-blue-600">Reçu</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50">
                <div className="text-2xl font-bold text-orange-600">1</div>
                <div className="text-xs text-orange-600">Due Dil</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-success-lighter">
                <div className="text-2xl font-bold text-success">4</div>
                <div className="text-xs text-success">Investi</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-xs text-purple-600">Vendu</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InvestmentChart />
        <CashflowChart />
      </div>

      {/* Recent Investments Table */}
      <InvestmentTable />
    </div>
  );
}
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Vue d'ensemble de votre portefeuille d'investissements
        </p>
      </div>

      {/* KPI Cards - General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Nombre d'Investissements"
          value="12"
          subtitle="Actifs en portefeuille"
          icon={Wallet}
          variant="primary"
        />
        <KPICard
          title="Montant Investi"
          value="€24.5M"
          subtitle="Capital déployé"
          icon={Euro}
          trend={{ value: 8.2, direction: 'up' }}
        />
        <KPICard
          title="TRI Moyen Pondéré"
          value="7.8%"
          subtitle="Performance portfolio"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 1.2, direction: 'up' }}
        />
        <KPICard
          title="Cash Attendu"
          value="€31.2M"
          subtitle="Valeur cible"
          icon={Target}
          trend={{ value: 3.5, direction: 'up' }}
        />
      </div>

      {/* KPI Cards - By Asset Type */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Par Type d'Actif</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Immobilier */}
          <div className="space-y-4">
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
          <div className="space-y-4">
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Pipelines</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
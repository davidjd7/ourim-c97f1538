import React from 'react';
import { InvestmentTable } from '@/components/dashboard/InvestmentTable';
import { Button } from '@/components/ui/button';
import { BarChart3, Table } from 'lucide-react';

export default function Investissements() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investissements</h1>
          <p className="text-lg text-muted-foreground">
            Gestion de vos actifs investis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm">
            <Table className="h-4 w-4 mr-2" />
            Vue Table
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Vue KPI
          </Button>
        </div>
      </div>

      {/* Investments Table */}
      <InvestmentTable />
    </div>
  );
}
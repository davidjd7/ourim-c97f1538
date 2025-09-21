import React, { useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { getSyntheseData, calculateXIRR, calculateNOI } from '@/lib/kpiCalculations';
import type { BatchKPIData, InvestmentRawData } from '@/types/kpi';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface ConsolidatedChartsProps {
  selectedInvestments: Set<string>;
  batchKPIs: BatchKPIData;
  rawByInvestment: Record<string, InvestmentRawData>;
  syntheticTableData: Array<{
    date: string;
    valeur: number;
    fp: number;
    noi: number;
    rendementNet: number;
    cfni: number;
    cocNet: number;
    cf: number;
    deltaValeur: number;
    gain1: number;
    gain2: number;
    totalReturn: number;
    xirrGlissant: number;
  }>;
}

// Chart configuration for consistent theming
const chartConfig: ChartConfig = {
  ltv: { label: "LTV (%)", color: "hsl(var(--primary))" },
  xirr: { label: "TRI (%)", color: "hsl(var(--success))" },
  rendementNet: { label: "Rendement Net (%)", color: "hsl(var(--primary))" },
  rendementNet3Y: { label: "Moyenne 3Y (%)", color: "hsl(var(--success))" },
  valeur: { label: "Valeur", color: "hsl(var(--primary))" },
  gain: { label: "Gain", color: "hsl(var(--success))" },
  consolidated: { label: "Consolidé", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export function ConsolidatedCharts({ 
  selectedInvestments, 
  batchKPIs, 
  rawByInvestment,
  syntheticTableData 
}: ConsolidatedChartsProps) {
  const { investments } = useInvestments();

  // Utility function to calculate time series gains for each investment
  const calculateTimeSeriesGains = (investmentData: InvestmentRawData, investmentId: string) => {
    const synthesis = getSyntheseData(
      investmentData.cashflows,
      investmentData.immobilisations,
      investmentData.debtFlows,
      investmentData.valorisations
    );
    
    return synthesis.map((row, index) => {
      const previousRow = index > 0 ? synthesis[index - 1] : null;
      const deltaValeur = previousRow ? row.valeur - previousRow.valeur : 0;
      const gain = deltaValeur + row.flux;
      return {
        year: new Date(row.date).getFullYear(),
        gain,
        investmentId,
        investmentName: investments.find(inv => inv.id === investmentId)?.name || `Investment ${investmentId.slice(0, 8)}`
      };
    });
  };

  // Utility function to calculate historical yields
  const calculateHistoricalYields = (investmentData: InvestmentRawData) => {
    const synthesis = getSyntheseData(
      investmentData.cashflows,
      investmentData.immobilisations,
      investmentData.debtFlows,
      investmentData.valorisations
    );
    
    const currentYear = new Date().getFullYear();
    const currentYearData = synthesis.filter(row => 
      new Date(row.date).getFullYear() === currentYear
    );
    
    const last3Years = synthesis.filter(row => {
      const year = new Date(row.date).getFullYear();
      return year >= currentYear - 2 && year <= currentYear;
    });
    
    // Calculate current year rendement
    const currentYearNOI = currentYearData.reduce((sum, row) => sum + calculateNOI({ 
      date: row.date, 
      rex: 0, 
      retraitAmort: 0, 
      retraitAutres: 0, 
      loyer: 0 
    }), 0);
    const currentYearValeur = currentYearData.length > 0 ? currentYearData[currentYearData.length - 1].valeur : 0;
    const currentRendement = currentYearValeur > 0 ? (currentYearNOI / currentYearValeur) * 100 : 0;
    
    // Calculate 3-year average rendement
    const totalNOI3Y = last3Years.reduce((sum, row) => sum + calculateNOI({ 
      date: row.date, 
      rex: 0, 
      retraitAmort: 0, 
      retraitAutres: 0, 
      loyer: 0 
    }), 0);
    const avgValeur3Y = last3Years.length > 0 ? 
      last3Years.reduce((sum, row) => sum + row.valeur, 0) / last3Years.length : 0;
    const avgRendement3Y = avgValeur3Y > 0 ? (totalNOI3Y / avgValeur3Y) * 100 : 0;
    
    return {
      currentYear: currentRendement,
      average3Y: avgRendement3Y / 3 // Average per year
    };
  };

  // Calculate yearly XIRR for heatmap
  const calculateYearlyXIRR = (investmentData: InvestmentRawData, targetYear: number) => {
    const synthesis = getSyntheseData(
      investmentData.cashflows,
      investmentData.immobilisations,
      investmentData.debtFlows,
      investmentData.valorisations
    );
    
    const yearData = synthesis.filter(row => 
      new Date(row.date).getFullYear() <= targetYear
    );
    
    return yearData.length >= 2 ? calculateXIRR(yearData) : 0;
  };

  // 1. Scatter Plot Data (LTV vs TRI)
  const scatterData = useMemo(() => {
    return Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      if (!kpis) return null;
      
      const investment = investments.find(inv => inv.id === investmentId);
      return {
        ltv: kpis.fondPropreDetails.ltv,
        xirr: kpis.xirr,
        valeur: kpis.fondPropreDetails.valeur,
        name: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        size: Math.max(10, Math.min(100, kpis.fondPropreDetails.valeur / 10000)) // Scale size
      };
    }).filter(Boolean);
  }, [selectedInvestments, batchKPIs, investments]);

  // 2. Time Evolution Data
  const timeEvolutionData = useMemo(() => {
    const consolidatedGains = syntheticTableData.map(row => ({
      year: new Date(row.date).getFullYear(),
      consolidated: row.gain2,
    }));

    const individualGains = Object.entries(rawByInvestment).map(([investmentId, data]) => 
      calculateTimeSeriesGains(data, investmentId)
    ).flat();

    // Group by year
    const yearMap = new Map();
    consolidatedGains.forEach(item => {
      if (!yearMap.has(item.year)) {
        yearMap.set(item.year, { year: item.year, consolidated: item.consolidated });
      }
    });

    individualGains.forEach(item => {
      if (!yearMap.has(item.year)) {
        yearMap.set(item.year, { year: item.year, consolidated: 0 });
      }
      yearMap.get(item.year)[item.investmentId] = item.gain;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [syntheticTableData, rawByInvestment]);

  // 3. Histogram Data (Rendement Net Comparison)
  const histogramData = useMemo(() => {
    return Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      const rawData = rawByInvestment[investmentId];
      if (!kpis || !rawData) return null;

      const investment = investments.find(inv => inv.id === investmentId);
      const yields = calculateHistoricalYields(rawData);
      
      return {
        name: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        rendement2024: kpis.rendementNet,
        rendementMoy3Y: yields.average3Y,
      };
    }).filter(Boolean).sort((a, b) => (b?.rendement2024 || 0) - (a?.rendement2024 || 0));
  }, [selectedInvestments, batchKPIs, rawByInvestment, investments]);

  // 4. Donut Data (Value Distribution)
  const donutData = useMemo(() => {
    return Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      if (!kpis) return null;
      
      const investment = investments.find(inv => inv.id === investmentId);
      return {
        name: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        value: kpis.fondPropreDetails.valeur,
      };
    }).filter(Boolean);
  }, [selectedInvestments, batchKPIs, investments]);

  // 5. Boxplot Data (Distribution of Rendement Net)
  const boxplotData = useMemo(() => {
    const rendements = Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      return kpis?.rendementNet || 0;
    }).sort((a, b) => a - b);

    if (rendements.length === 0) return [];

    const q1Index = Math.floor(rendements.length * 0.25);
    const q2Index = Math.floor(rendements.length * 0.5);
    const q3Index = Math.floor(rendements.length * 0.75);

    return [{
      min: rendements[0],
      q1: rendements[q1Index],
      median: rendements[q2Index],
      q3: rendements[q3Index],
      max: rendements[rendements.length - 1],
    }];
  }, [selectedInvestments, batchKPIs]);

  // 6. Heatmap Data (TRI by Asset/Year)
  const heatmapData = useMemo(() => {
    const years = [2022, 2023, 2024];
    const data: Array<{ asset: string; year: number; xirr: number }> = [];
    
    Array.from(selectedInvestments).forEach(investmentId => {
      const rawData = rawByInvestment[investmentId];
      if (!rawData) return;
      
      const investment = investments.find(inv => inv.id === investmentId);
      const assetName = investment?.name || `Investment ${investmentId.slice(0, 8)}`;
      
      years.forEach(year => {
        const xirr = calculateYearlyXIRR(rawData, year);
        data.push({ asset: assetName, year, xirr });
      });
    });
    
    return data;
  }, [selectedInvestments, rawByInvestment, investments]);

  // Colors for charts
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--success))', 
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(var(--secondary))',
    'hsl(180 50% 60%)',
    'hsl(260 50% 60%)',
    'hsl(30 50% 60%)'
  ];

  if (selectedInvestments.size === 0) {
    return (
      <div className="card-financial">
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Aucun investissement sélectionné
          </h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez des investissements pour voir les graphiques.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Graphiques Consolidés</h2>
      
      {/* First Row: Scatter + Time Evolution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 1. Scatter Plot (LTV vs TRI) */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>LTV vs TRI</CardTitle>
            <CardDescription>
              Relation entre le levier et la rentabilité (taille = valeur)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="ltv" 
                    name="LTV"
                    unit="%" 
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="xirr" 
                    name="TRI"
                    unit="%" 
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'xirr' ? formatPercentage(value as number) : 
                      name === 'ltv' ? formatPercentage(value as number) :
                      formatCurrency(value as number), 
                      name === 'xirr' ? 'TRI' : 
                      name === 'ltv' ? 'LTV' : 'Valeur'
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Scatter
                    data={scatterData}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 2. Time Evolution Curve */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Évolution des Gains</CardTitle>
            <CardDescription>
              Evolution temporelle des gains par année
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Gain']}
                    labelFormatter={(label) => `Année ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="consolidated" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Consolidé"
                  />
                  {Array.from(selectedInvestments).map((investmentId, index) => (
                    <Line
                      key={investmentId}
                      type="monotone"
                      dataKey={investmentId}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name={investments.find(inv => inv.id === investmentId)?.name || `Inv. ${investmentId.slice(0, 8)}`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Histogram + Donut */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 3. Comparative Histogram */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Rendement Net Comparatif</CardTitle>
            <CardDescription>
              Comparaison 2024 vs moyenne 3 ans (classement décroissant)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value) => [formatPercentage(value as number), '']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="rendement2024" 
                    fill="hsl(var(--primary))" 
                    name="2024"
                  />
                  <Bar 
                    dataKey="rendementMoy3Y" 
                    fill="hsl(var(--success))" 
                    name="Moyenne 3Y"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 4. Donut Chart (Value Distribution) */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Répartition des Valeurs</CardTitle>
            <CardDescription>
              Distribution de la valeur totale par actif
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Valeur']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Boxplot + Heatmap */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 5. Boxplot */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Distribution des Rendements</CardTitle>
            <CardDescription>
              Analyse statistique des rendements nets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {boxplotData.length > 0 ? (
                <div className="w-full space-y-4">
                  <div className="text-center space-y-2">
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="font-semibold">Min</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData[0].min)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Q1</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData[0].q1)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Médiane</div>
                        <div className="text-success font-semibold">{formatPercentage(boxplotData[0].median)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Q3</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData[0].q3)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Max</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData[0].max)}</div>
                      </div>
                    </div>
                    <div className="w-full h-8 bg-gradient-to-r from-destructive via-warning to-success rounded-lg relative">
                      <div 
                        className="absolute w-1 h-full bg-foreground rounded"
                        style={{ 
                          left: `${((boxplotData[0].median - boxplotData[0].min) / (boxplotData[0].max - boxplotData[0].min)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Pas assez de données pour l'analyse statistique
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 6. Heatmap (TRI by Asset/Year) */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Heatmap TRI</CardTitle>
            <CardDescription>
              TRI par actif et par année
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] overflow-auto">
              <div className="grid gap-2" style={{ gridTemplateColumns: `150px repeat(3, 1fr)` }}>
                <div className="font-semibold text-sm p-2">Actif / Année</div>
                <div className="font-semibold text-sm p-2 text-center">2022</div>
                <div className="font-semibold text-sm p-2 text-center">2023</div>
                <div className="font-semibold text-sm p-2 text-center">2024</div>
                
                {Array.from(new Set(heatmapData.map(d => d.asset))).map(asset => (
                  <React.Fragment key={asset}>
                    <div className="text-xs p-2 border-r border-border font-medium truncate" title={asset}>
                      {asset}
                    </div>
                    {[2022, 2023, 2024].map(year => {
                      const xirr = heatmapData.find(d => d.asset === asset && d.year === year)?.xirr || 0;
                      const intensity = Math.min(100, Math.max(0, (xirr + 10) * 5)); // Scale from -10% to +10%
                      return (
                        <div 
                          key={year}
                          className="text-xs p-2 text-center rounded"
                          style={{
                            backgroundColor: xirr > 0 ? 
                              `hsl(var(--success) / ${intensity}%)` : 
                              `hsl(var(--destructive) / ${Math.abs(intensity)}%)`,
                            color: Math.abs(xirr) > 5 ? 'white' : 'inherit'
                          }}
                        >
                          {formatPercentage(xirr)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useMemo, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
  const [evolutionType, setEvolutionType] = useState<'gains' | 'valeur' | 'cfni'>('gains');

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
        r: Math.max(5, Math.min(25, Math.sqrt(kpis.fondPropreDetails.valeur / 50000))) // Scale radius based on valeur
      };
    }).filter(Boolean);
  }, [selectedInvestments, batchKPIs, investments]);

  // 2. Time Evolution Data
  const timeEvolutionData = useMemo(() => {
    const consolidatedData = syntheticTableData.map(row => ({
      year: new Date(row.date).getFullYear(),
      consolidated: evolutionType === 'gains' ? row.gain2 : 
                   evolutionType === 'valeur' ? row.valeur :
                   row.cfni,
    }));

    const individualData = Object.entries(rawByInvestment).map(([investmentId, data]) => {
      const synthesis = getSyntheseData(
        data.cashflows,
        data.immobilisations,
        data.debtFlows,
        data.valorisations
      );
      
      return synthesis.map((row, index) => {
        const previousRow = index > 0 ? synthesis[index - 1] : null;
        let value;
        
        if (evolutionType === 'gains') {
          const deltaValeur = previousRow ? row.valeur - previousRow.valeur : 0;
          value = deltaValeur + row.flux;
        } else if (evolutionType === 'valeur') {
          value = row.valeur;
        } else { // cfni
          value = row.flux; // Assuming flux represents CFNI
        }
        
        return {
          year: new Date(row.date).getFullYear(),
          [investmentId]: value,
          investmentName: investments.find(inv => inv.id === investmentId)?.name || `Investment ${investmentId.slice(0, 8)}`
        };
      });
    }).flat();

    // Group by year
    const yearMap = new Map();
    consolidatedData.forEach(item => {
      if (!yearMap.has(item.year)) {
        yearMap.set(item.year, { year: item.year, consolidated: item.consolidated });
      }
    });

    individualData.forEach(item => {
      if (!yearMap.has(item.year)) {
        yearMap.set(item.year, { year: item.year, consolidated: 0 });
      }
      Object.keys(item).forEach(key => {
        if (key !== 'year' && key !== 'investmentName') {
          yearMap.get(item.year)[key] = item[key];
        }
      });
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [syntheticTableData, rawByInvestment, evolutionType, investments]);

  // 3. Histogram Data (Rendement Net 2024)
  const histogramData = useMemo(() => {
    return Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      if (!kpis) return null;

      const investment = investments.find(inv => inv.id === investmentId);
      
      return {
        name: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        rendement2024: kpis.rendementNet,
      };
    }).filter(Boolean).sort((a, b) => (b?.rendement2024 || 0) - (a?.rendement2024 || 0));
  }, [selectedInvestments, batchKPIs, investments]);

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

  // 5. Boxplot Data (Distribution of Rendement Net and XIRR)
  const boxplotData = useMemo(() => {
    const rendements = Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      return kpis?.rendementNet || 0;
    }).sort((a, b) => a - b);

    const xirrs = Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      return kpis?.xirr || 0;
    }).sort((a, b) => a - b);

    const createBoxplotStats = (values: number[]) => {
      if (values.length === 0) return null;
      
      const q1Index = Math.floor(values.length * 0.25);
      const q2Index = Math.floor(values.length * 0.5);
      const q3Index = Math.floor(values.length * 0.75);

      return {
        min: values[0],
        q1: values[q1Index],
        median: values[q2Index],
        q3: values[q3Index],
        max: values[values.length - 1],
      };
    };

    return {
      rendement: createBoxplotStats(rendements),
      xirr: createBoxplotStats(xirrs)
    };
  }, [selectedInvestments, batchKPIs]);

  // 6. Heatmap Data (Removed as requested)

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
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">TRI: {formatPercentage(data.xirr)}</p>
                            <p className="text-sm">LTV: {formatPercentage(data.ltv)}</p>
                            <p className="text-sm">Valeur: {formatCurrency(data.valeur)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
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
            <CardTitle>Évolution Temporelle</CardTitle>
            <CardDescription>
              Evolution par année avec courbe consolidée sur axe droit
            </CardDescription>
            <div className="flex space-x-6 mt-4">
              <RadioGroup 
                value={evolutionType} 
                onValueChange={(value) => setEvolutionType(value as 'gains' | 'valeur' | 'cfni')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gains" id="gains" />
                  <Label htmlFor="gains" className="text-sm">Gains</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="valeur" id="valeur" />
                  <Label htmlFor="valeur" className="text-sm">Valeur</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cfni" id="cfni" />
                  <Label htmlFor="cfni" className="text-sm">CFNI</Label>
                </div>
              </RadioGroup>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value as number), name === 'consolidated' ? 'Consolidé' : investments.find(inv => inv.id === name)?.name || name]}
                    labelFormatter={(label) => `Année ${label}`}
                  />
                  <Legend />
                  {Array.from(selectedInvestments).map((investmentId, index) => (
                    <Line
                      key={investmentId}
                      yAxisId="left"
                      type="monotone"
                      dataKey={investmentId}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name={investments.find(inv => inv.id === investmentId)?.name || `Inv. ${investmentId.slice(0, 8)}`}
                    />
                  ))}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="consolidated" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Consolidé"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Histogram + Donut */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 3. Histogram 2024 Only */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Rendement Net 2024</CardTitle>
            <CardDescription>
              Classement par rendement décroissant
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
                    formatter={(value) => [formatPercentage(value as number), 'Rendement 2024']}
                  />
                  <Bar 
                    dataKey="rendement2024" 
                    fill="hsl(var(--primary))" 
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
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Valeur: {formatCurrency(data.value)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Boxplot Only */}
      <div className="grid gap-4 md:grid-cols-1">
        {/* 5. Boxplot */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Distribution des Rendements et TRI</CardTitle>
            <CardDescription>
              Analyse statistique comparative
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {boxplotData.rendement && boxplotData.xirr ? (
                <div className="w-full space-y-8">
                  {/* Rendement Net */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 text-center">Rendement Net (%)</h4>
                    <div className="grid grid-cols-5 gap-4 text-xs mb-2">
                      <div>
                        <div className="font-semibold">Min</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData.rendement.min)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Q1</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData.rendement.q1)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Médiane</div>
                        <div className="text-success font-semibold">{formatPercentage(boxplotData.rendement.median)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Q3</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData.rendement.q3)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Max</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData.rendement.max)}</div>
                      </div>
                    </div>
                    <div className="w-full h-6 bg-gradient-to-r from-destructive via-warning to-success rounded-lg relative">
                      <div 
                        className="absolute w-1 h-full bg-foreground rounded"
                        style={{ 
                          left: `${((boxplotData.rendement.median - boxplotData.rendement.min) / (boxplotData.rendement.max - boxplotData.rendement.min)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* TRI */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 text-center">TRI (%)</h4>
                    <div className="grid grid-cols-5 gap-4 text-xs mb-2">
                      <div>
                        <div className="font-semibold">Min</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData.xirr.min)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Q1</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData.xirr.q1)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Médiane</div>
                        <div className="text-success font-semibold">{formatPercentage(boxplotData.xirr.median)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Q3</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData.xirr.q3)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Max</div>
                        <div className="text-muted-foreground">{formatPercentage(boxplotData.xirr.max)}</div>
                      </div>
                    </div>
                    <div className="w-full h-6 bg-gradient-to-r from-destructive via-warning to-success rounded-lg relative">
                      <div 
                        className="absolute w-1 h-full bg-foreground rounded"
                        style={{ 
                          left: `${((boxplotData.xirr.median - boxplotData.xirr.min) / (boxplotData.xirr.max - boxplotData.xirr.min)) * 100}%` 
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
      </div>
    </div>
  );
}
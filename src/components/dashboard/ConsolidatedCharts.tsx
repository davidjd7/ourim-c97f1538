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
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedYear, setSelectedYear] = useState<string>('total');

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

  // 1. Scatter Plot Data (LTV vs TRI)
  const scatterData = useMemo(() => {
    const individualPoints = Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      if (!kpis) return null;
      
      const investment = investments.find(inv => inv.id === investmentId);
      return {
        ltv: kpis.fondPropreDetails.ltv,
        xirr: kpis.xirr,
        valeur: kpis.fondPropreDetails.valeur,
        name: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        size: Math.max(20, Math.min(200, kpis.fondPropreDetails.valeur / 5000)), // Scale size based on valeur
        isConsolidated: false
      };
    }).filter(Boolean);

    // Add consolidated portfolio point
    if (syntheticTableData.length > 0) {
      const latestData = syntheticTableData[syntheticTableData.length - 1];
      const consolidatedLTV = latestData.valeur > 0 ? (latestData.valeur - latestData.fp) / latestData.valeur * 100 : 0;
      
      individualPoints.push({
        ltv: consolidatedLTV,
        xirr: latestData.xirrGlissant,
        valeur: latestData.valeur,
        name: 'Portefeuille Consolidé',
        size: Math.max(30, Math.min(250, latestData.valeur / 5000)),
        isConsolidated: true
      });
    }

    return individualPoints;
  }, [selectedInvestments, batchKPIs, investments, syntheticTableData]);

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

    const sortedData = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
    // Omit the first year as requested
    return sortedData.slice(1);
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

  // 6. CFNI vs Variation de Valeur scatter plot data
  const cfniVsValeurData = useMemo(() => {
    const availableYears = new Set<number>();
    
    // Collect all available years
    Object.values(rawByInvestment).forEach(data => {
      const synthesis = getSyntheseData(
        data.cashflows,
        data.immobilisations,
        data.debtFlows,
        data.valorisations
      );
      synthesis.forEach(row => {
        availableYears.add(new Date(row.date).getFullYear());
      });
    });

    const sortedYears = Array.from(availableYears).sort();
    
    const individualPoints = Array.from(selectedInvestments).map(investmentId => {
      const data = rawByInvestment[investmentId];
      if (!data) return null;

      const synthesis = getSyntheseData(
        data.cashflows,
        data.immobilisations,
        data.debtFlows,
        data.valorisations
      );

      let cfni = 0;
      let deltaValeur = 0;

      if (selectedYear === 'total') {
        // Calculate total for all years
        synthesis.forEach((row, index) => {
          cfni += row.flux;
          if (index > 0) {
            deltaValeur += row.valeur - synthesis[index - 1].valeur;
          }
        });
      } else {
        // Calculate for specific year
        const yearNum = parseInt(selectedYear);
        const yearRows = synthesis.filter(row => new Date(row.date).getFullYear() === yearNum);
        
        yearRows.forEach((row, index) => {
          cfni += row.flux;
          if (index > 0) {
            deltaValeur += row.valeur - yearRows[index - 1].valeur;
          } else if (yearRows.length > 0) {
            // For first row of the year, calculate delta from previous year's last row
            const prevYearRows = synthesis.filter(r => new Date(r.date).getFullYear() === yearNum - 1);
            if (prevYearRows.length > 0) {
              deltaValeur += row.valeur - prevYearRows[prevYearRows.length - 1].valeur;
            }
          }
        });
      }

      const investment = investments.find(inv => inv.id === investmentId);
      const kpis = batchKPIs[investmentId];
      
      return {
        cfni,
        deltaValeur,
        name: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        size: kpis ? Math.max(20, Math.min(200, kpis.fondPropreDetails.valeur / 5000)) : 30,
        isConsolidated: false
      };
    }).filter(Boolean);

    // Do not add consolidated point as requested

    return {
      data: individualPoints,
      years: sortedYears
    };
  }, [selectedInvestments, rawByInvestment, syntheticTableData, investments, batchKPIs, selectedYear]);

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
      
      {/* First Row: Time Evolution only (full width) */}
      <div className="w-full">
        {/* Time Evolution Curve */}
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
            <ChartContainer config={chartConfig} className="h-[400px]">
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

      {/* Second Row: LTV vs TRI + Value Distribution */}
      <div className="grid gap-4 md:grid-cols-2 charts-grid">
        {/* Scatter Plot (LTV vs TRI) */}
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
                  >
                    {scatterData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isConsolidated ? "hsl(0 84.2% 60.2%)" : "hsl(var(--primary))"}
                        r={Math.sqrt(entry.size)} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Donut Chart (Value Distribution) */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Répartition des Valeurs</CardTitle>
            <CardDescription>
              Distribution par investissement
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
                    outerRadius={120}
                    dataKey="value"
                    nameKey="name"
                  >
                    {donutData.map((_, index) => (
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

      {/* Third Row: CFNI vs Variation Valeur + Net Rendement */}
      <div className="grid gap-4 md:grid-cols-2 charts-grid">
        {/* CFNI vs Variation de Valeur Scatter Plot */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>CFNI vs Variation de Valeur</CardTitle>
            <CardDescription>
              Relation entre flux et variation de valeur
            </CardDescription>
            <div className="mt-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sélectionner l'année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total (toutes années)</SelectItem>
                  {cfniVsValeurData.years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="cfni" 
                    name="CFNI"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="deltaValeur" 
                    name="Variation Valeur"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">CFNI: {formatCurrency(data.cfni)}</p>
                            <p className="text-sm">Δ Valeur: {formatCurrency(data.deltaValeur)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    data={cfniVsValeurData.data}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  >
                    {cfniVsValeurData.data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isConsolidated ? "hsl(0 84.2% 60.2%)" : "hsl(var(--primary))"}
                        r={Math.sqrt(entry.size)} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Histogram Net Rendement 2024 */}
        {/* Histogram Net Rendement 2024 (moved from above) */}
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
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Boxplot Distribution */}
        <Card className="card-financial">
          <CardHeader>
            <CardTitle>Distribution des Rendements</CardTitle>
            <CardDescription>
              Analyse statistique - Rendement Net et TRI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Rendement Net Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-2">Rendement Net (%)</h4>
                <div className="relative">
                  <div 
                    className="h-6 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded"
                    style={{
                      background: `linear-gradient(to right, 
                        hsl(0 70% 70%) 0%, 
                        hsl(45 70% 70%) 50%, 
                        hsl(120 70% 70%) 100%)`
                    }}
                  />
                  {boxplotData.rendement && (
                    <>
                      <div 
                        className="absolute top-0 h-6 w-1 bg-black"
                        style={{
                          left: `${((boxplotData.rendement.median - boxplotData.rendement.min) / (boxplotData.rendement.max - boxplotData.rendement.min)) * 100}%`
                        }}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>{boxplotData.rendement.min.toFixed(1)}%</span>
                        <span>{boxplotData.rendement.max.toFixed(1)}%</span>
                      </div>
                      <div className="text-center text-xs mt-1">
                        Médiane: {boxplotData.rendement.median.toFixed(1)}%
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* TRI Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-2">TRI (%)</h4>
                <div className="relative">
                  <div 
                    className="h-6 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded"
                    style={{
                      background: `linear-gradient(to right, 
                        hsl(0 70% 70%) 0%, 
                        hsl(45 70% 70%) 50%, 
                        hsl(120 70% 70%) 100%)`
                    }}
                  />
                  {boxplotData.xirr && (
                    <>
                      <div 
                        className="absolute top-0 h-6 w-1 bg-black"
                        style={{
                          left: `${((boxplotData.xirr.median - boxplotData.xirr.min) / (boxplotData.xirr.max - boxplotData.xirr.min)) * 100}%`
                        }}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>{boxplotData.xirr.min.toFixed(1)}%</span>
                        <span>{boxplotData.xirr.max.toFixed(1)}%</span>
                      </div>
                      <div className="text-center text-xs mt-1">
                        Médiane: {boxplotData.xirr.median.toFixed(1)}%
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
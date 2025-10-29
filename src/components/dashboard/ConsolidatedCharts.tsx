import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Customized } from 'recharts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { getSyntheseData, calculateXIRR, calculateNOI } from '@/lib/kpiCalculations';
import type { BatchKPIData, InvestmentRawData } from '@/types/kpi';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
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
  cutoffYear: number;
}

// Chart configuration for consistent theming
const chartConfig: ChartConfig = {
  ltv: {
    label: "LTV (%)",
    color: "hsl(var(--primary))"
  },
  xirr: {
    label: "TRI (%)",
    color: "hsl(var(--success))"
  },
  rendementNet: {
    label: "Rendement Net (%)",
    color: "hsl(var(--primary))"
  },
  valeur: {
    label: "Valeur",
    color: "hsl(var(--primary))"
  },
  gain: {
    label: "Gain",
    color: "hsl(var(--success))"
  },
  consolidated: {
    label: "Consolidé",
    color: "hsl(var(--primary))"
  }
} satisfies ChartConfig;
export function ConsolidatedCharts({
  selectedInvestments,
  batchKPIs,
  rawByInvestment,
  syntheticTableData,
  cutoffYear
}: ConsolidatedChartsProps) {
  const {
    investments
  } = useInvestments();
  const isMobile = useIsMobile();
  const [evolutionType, setEvolutionType] = useState<'gains' | 'valeur' | 'cfni'>('gains');
  const [evolutionDisplay, setEvolutionDisplay] = useState<'cumule' | 'variation'>('variation');
  const [selectedYear, setSelectedYear] = useState<string>('total');

  // Utility function to filter data by cutoff year
  const filterByCutoffYear = (dateString: string) => {
    return new Date(dateString).getFullYear() <= cutoffYear;
  };

  // Utility function to calculate time series gains for each investment
  const calculateTimeSeriesGains = (investmentData: InvestmentRawData, investmentId: string) => {
    const synthesis = getSyntheseData(investmentData.cashflows, investmentData.immobilisations, investmentData.debtFlows, investmentData.valorisations).filter(row => filterByCutoffYear(row.date));
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
        size: Math.max(20, Math.min(200, kpis.fondPropreDetails.valeur / 5000)),
        // Scale size based on valeur
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
    const consolidatedData = syntheticTableData.filter(row => filterByCutoffYear(row.date)).map(row => ({
      year: new Date(row.date).getFullYear(),
      consolidated: evolutionType === 'gains' ? row.gain2 : evolutionType === 'valeur' ? row.valeur : row.cfni
    }));
    const individualData = Object.entries(rawByInvestment).map(([investmentId, data]) => {
      const synthesis = getSyntheseData(data.cashflows, data.immobilisations, data.debtFlows, data.valorisations).filter(row => filterByCutoffYear(row.date));
      return synthesis.map((row, index) => {
        const previousRow = index > 0 ? synthesis[index - 1] : null;
        let value;
        if (evolutionType === 'gains') {
          const deltaValeur = previousRow ? row.valeur - previousRow.valeur : 0;
          value = deltaValeur + row.flux;
        } else if (evolutionType === 'valeur') {
          value = row.valeur;
        } else {
          // cfni
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
        yearMap.set(item.year, {
          year: item.year,
          consolidated: item.consolidated
        });
      }
    });
    individualData.forEach(item => {
      if (!yearMap.has(item.year)) {
        yearMap.set(item.year, {
          year: item.year,
          consolidated: 0
        });
      }
      Object.keys(item).forEach(key => {
        if (key !== 'year' && key !== 'investmentName') {
          yearMap.get(item.year)[key] = item[key];
        }
      });
    });
    let sortedData = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
    // Omit the first year as requested
    sortedData = sortedData.slice(1);

    // Apply cumulative calculation if needed
    if (evolutionDisplay === 'cumule') {
      const cumulativeData = [];
      const cumulatives = {};
      
      sortedData.forEach(yearData => {
        const newYearData = { year: yearData.year };
        
        // Accumulate consolidated
        if (cumulatives['consolidated'] === undefined) {
          cumulatives['consolidated'] = yearData.consolidated;
        } else {
          cumulatives['consolidated'] += yearData.consolidated;
        }
        newYearData['consolidated'] = cumulatives['consolidated'];
        
        // Accumulate individual investments
        Object.keys(yearData).forEach(key => {
          if (key !== 'year' && key !== 'consolidated') {
            if (cumulatives[key] === undefined) {
              cumulatives[key] = yearData[key];
            } else {
              cumulatives[key] += yearData[key];
            }
            newYearData[key] = cumulatives[key];
          }
        });
        
        cumulativeData.push(newYearData);
      });
      
      return cumulativeData;
    }
    
    return sortedData;
  }, [syntheticTableData, rawByInvestment, evolutionType, evolutionDisplay, investments, cutoffYear]);

  // 3. Histogram Data (Rendement Net 2024) - Distribution
  const histogramData = useMemo(() => {
    // Collect all rendement values with investment details
    const rendementDetails = Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      const investment = investments.find(inv => inv.id === investmentId);
      return {
        investmentId,
        investmentName: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        rendementNet: kpis?.rendementNet || 0
      };
    }).filter(r => r.rendementNet !== 0);

    if (rendementDetails.length === 0) return { bins: [], normalCurve: [], median: 0, mean: 0, stdDev: 0 };

    const rendements = rendementDetails.map(r => r.rendementNet);

    // Calculate statistics
    const mean = rendements.reduce((sum, r) => sum + r, 0) / rendements.length;
    const variance = rendements.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rendements.length;
    const stdDev = Math.sqrt(variance);
    const sortedRendements = [...rendements].sort((a, b) => a - b);
    const median = sortedRendements[Math.floor(sortedRendements.length / 2)];

    // Fixed bin ranges
    const fixedBins = [
      { start: 5.5, end: 6.5, label: '5,5 – 6,5 %' },
      { start: 6.5, end: 7.5, label: '6,5 – 7,5 %' },
      { start: 7.5, end: 8.5, label: '7,5 – 8,5 %' },
      { start: 8.5, end: 9.5, label: '8,5 – 9,5 %' },
      { start: 9.5, end: 10.5, label: '9,5 – 10,5 %' },
      { start: 10.5, end: 11.5, label: '10,5 – 11,5 %' },
      { start: 11.5, end: 12.5, label: '11,5 – 12,5 %' }
    ];

    // Create bins with fixed ranges and investment details
    const allBins = fixedBins.map(bin => {
      const binCenter = (bin.start + bin.end) / 2;
      const investmentsInBin = rendementDetails.filter(r => r.rendementNet >= bin.start && r.rendementNet < bin.end);
      
      return {
        range: bin.label,
        binCenter,
        occurrences: investmentsInBin.length,
        investments: investmentsInBin
      };
    });

    // Filter to keep only bins with occurrences
    const bins = allBins.filter(bin => bin.occurrences > 0);

    // Generate normal distribution curve only for bins with data
    const binSize = 1; // Fixed bin size of 1%
    const normalCurve = bins.map(bin => {
      const x = bin.binCenter;
      const normalValue = (rendements.length * binSize) * 
        Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2))) / 
        (stdDev * Math.sqrt(2 * Math.PI));
      
      return {
        binCenter: bin.binCenter,
        normalValue
      };
    });

    return { bins, normalCurve, median, mean, stdDev };
  }, [selectedInvestments, batchKPIs]);

  // 4. Donut Data (Value Distribution)
  const donutData = useMemo(() => {
    return Array.from(selectedInvestments).map(investmentId => {
      const kpis = batchKPIs[investmentId];
      if (!kpis) return null;
      const investment = investments.find(inv => inv.id === investmentId);
      return {
        name: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        value: kpis.fondPropreDetails.valeur
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
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      return {
        min: values[0],
        q1: values[q1Index],
        median: values[q2Index],
        q3: values[q3Index],
        max: values[values.length - 1],
        mean
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

    // Collect all available years (filtered by cutoff)
    Object.values(rawByInvestment).forEach(data => {
      const synthesis = getSyntheseData(data.cashflows, data.immobilisations, data.debtFlows, data.valorisations).filter(row => filterByCutoffYear(row.date));
      synthesis.forEach(row => {
        availableYears.add(new Date(row.date).getFullYear());
      });
    });
    const sortedYears = Array.from(availableYears).sort();
    const individualPoints = Array.from(selectedInvestments).map(investmentId => {
      const data = rawByInvestment[investmentId];
      if (!data) return null;
      const synthesis = getSyntheseData(data.cashflows, data.immobilisations, data.debtFlows, data.valorisations).filter(row => filterByCutoffYear(row.date));
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
        gain: cfni + deltaValeur,
        name: investment?.name || `Investment ${investmentId.slice(0, 8)}`,
        size: kpis ? Math.max(20, Math.min(200, kpis.fondPropreDetails.valeur / 5000)) : 30,
        isConsolidated: false
      };
    }).filter(Boolean);

    // Calculate consolidated portfolio point
    const consolidatedPoint = {
      cfni: individualPoints.reduce((sum, point) => sum + point.cfni, 0),
      deltaValeur: individualPoints.reduce((sum, point) => sum + point.deltaValeur, 0),
      gain: 0,
      name: 'Portefeuille Consolidé',
      size: 100,
      isConsolidated: true
    };
    consolidatedPoint.gain = consolidatedPoint.cfni + consolidatedPoint.deltaValeur;

    return {
      data: [...individualPoints, consolidatedPoint],
      years: sortedYears
    };
  }, [selectedInvestments, rawByInvestment, syntheticTableData, investments, batchKPIs, selectedYear, cutoffYear]);

  // Calculate global axis domains for CFNI vs Variation scatter (stable across all years)
  const cfniAxisConfig = useMemo(() => {
    let globalXMin = 0,
      globalXMax = 0,
      globalYMin = 0,
      globalYMax = 0;

    // Calculate for ALL years including "Total" (filtered by cutoff)
    Array.from(selectedInvestments).forEach(investmentId => {
      const data = rawByInvestment[investmentId];
      if (!data) return;
      const synthesis = getSyntheseData(data.cashflows, data.immobilisations, data.debtFlows, data.valorisations).filter(row => filterByCutoffYear(row.date));

      // Calculate for each year AND total
      const yearsToCheck = ['total', ...cfniVsValeurData.years.map(y => y.toString())];
      yearsToCheck.forEach(year => {
        let cfni = 0;
        let deltaValeur = 0;
        if (year === 'total') {
          synthesis.forEach((row, index) => {
            cfni += row.flux;
            if (index > 0) {
              deltaValeur += row.valeur - synthesis[index - 1].valeur;
            }
          });
        } else {
          const yearNum = parseInt(year);
          const yearRows = synthesis.filter(row => new Date(row.date).getFullYear() === yearNum);
          yearRows.forEach((row, index) => {
            cfni += row.flux;
            if (index > 0) {
              deltaValeur += row.valeur - yearRows[index - 1].valeur;
            } else if (yearRows.length > 0) {
              const prevYearRows = synthesis.filter(r => new Date(r.date).getFullYear() === yearNum - 1);
              if (prevYearRows.length > 0) {
                deltaValeur += row.valeur - prevYearRows[prevYearRows.length - 1].valeur;
              }
            }
          });
        }
        globalXMin = Math.min(globalXMin, cfni);
        globalXMax = Math.max(globalXMax, cfni);
        globalYMin = Math.min(globalYMin, deltaValeur);
        globalYMax = Math.max(globalYMax, deltaValeur);
      });
    });

    // Add padding (10%)
    const xPadding = (globalXMax - globalXMin) * 0.1;
    const yPadding = (globalYMax - globalYMin) * 0.1;

    // Round to nearest 50000
    const roundTo50k = (value: number) => Math.round(value / 50000) * 50000;
    const xDomain = [roundTo50k(globalXMin - xPadding), roundTo50k(globalXMax + xPadding)];
    const yDomain = [roundTo50k(globalYMin - yPadding), roundTo50k(globalYMax + yPadding)];

    // Generate nice ticks
    const generateTicks = (min: number, max: number, count = 5) => {
      const step = (max - min) / (count - 1);
      return Array.from({
        length: count
      }, (_, i) => min + step * i);
    };

    // Generate ticks every 50000
    const generateTicksBy50k = (min: number, max: number) => {
      const ticks = [];
      const start = Math.floor(min / 50000) * 50000;
      const end = Math.ceil(max / 50000) * 50000;
      for (let i = start; i <= end; i += 50000) {
        ticks.push(i);
      }
      return ticks;
    };

    // Generate grid lines (every 25000 for secondary, every 50000 for primary)
    const generateGridLines = (min: number, max: number) => {
      const lines = [];
      const start = Math.floor(min / 25000) * 25000;
      const end = Math.ceil(max / 25000) * 25000;
      for (let i = start; i <= end; i += 25000) {
        lines.push({
          value: i,
          isPrimary: i % 50000 === 0
        });
      }
      return lines;
    };
    return {
      xDomain,
      yDomain,
      xTicks: generateTicks(xDomain[0], xDomain[1], 5),
      yTicks: generateTicksBy50k(yDomain[0], yDomain[1]),
      xGridLines: generateGridLines(xDomain[0], xDomain[1]),
      yGridLines: generateGridLines(yDomain[0], yDomain[1])
    };
  }, [selectedInvestments, rawByInvestment, cfniVsValeurData.years, cutoffYear]);

  // Colors for charts
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--secondary))', 'hsl(180 50% 60%)', 'hsl(260 50% 60%)', 'hsl(30 50% 60%)'];
  if (selectedInvestments.size === 0) {
    return <div className="card-financial">
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Aucun investissement sélectionné
          </h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez des investissements pour voir les graphiques.
          </p>
        </div>
      </div>;
  }
  return <TooltipProvider delayDuration={200}>
    <div className="space-y-6 overflow-x-hidden">
      
      {/* First Row: Evolution Temporelle + Répartition des Valeurs */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 charts-grid">
        {/* Time Evolution Curve */}
        <Card className="card-financial overflow-hidden">
          <CardHeader>
            <CardTitle>Évolution Temporelle</CardTitle>
            <CardDescription>
              Evolution par année avec courbe consolidée sur axe droit
            </CardDescription>
            <div className="space-y-3 mt-4">
              <div className="flex items-center space-x-6">
                <Label className="text-sm font-medium">Type de donnée:</Label>
                <RadioGroup value={evolutionType} onValueChange={value => setEvolutionType(value as 'gains' | 'valeur' | 'cfni')} className="flex space-x-4">
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
              <div className="flex items-center space-x-6">
                <Label className="text-sm font-medium">Affichage:</Label>
                <RadioGroup value={evolutionDisplay} onValueChange={value => setEvolutionDisplay(value as 'cumule' | 'variation')} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="variation" id="variation" />
                    <Label htmlFor="variation" className="text-sm">Variation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cumule" id="cumule" />
                    <Label htmlFor="cumule" className="text-sm">Cumulé</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={chartConfig} className="w-full h-full min-h-[300px] md:min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" tickFormatter={value => formatCurrency(value)} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={value => formatCurrency(value)} />
                  <Tooltip formatter={(value, name) => [formatCurrency(value as number), name === 'consolidated' ? 'Consolidé' : investments.find(inv => inv.id === name)?.name || name]} labelFormatter={label => `Année ${label}`} />
                  <Legend />
                  {Array.from(selectedInvestments).map((investmentId, index) => <Line key={investmentId} yAxisId="left" type="monotone" dataKey={investmentId} stroke={COLORS[index % COLORS.length]} strokeWidth={2} strokeDasharray="5 5" name={investments.find(inv => inv.id === investmentId)?.name || `Inv. ${investmentId.slice(0, 8)}`} />)}
                  <Line yAxisId="right" type="monotone" dataKey="consolidated" stroke="hsl(var(--primary))" strokeWidth={3} name="Consolidé" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Donut Chart (Value Distribution) */}
        <Card className="card-financial overflow-hidden">
          <CardHeader>
            <CardTitle>Répartition des Valeurs</CardTitle>
            <CardDescription>
              Distribution par investissement
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={chartConfig} className="w-full h-full min-h-[300px] md:min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={isMobile ? 40 : 80} outerRadius={isMobile ? 80 : 140} dataKey="value" nameKey="name" label={({
                    percent
                  }) => `${(percent * 100).toFixed(1)}%`} labelLine={true}>
                    {donutData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({
                    active,
                    payload
                  }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Valeur: {formatCurrency(data.value)}</p>
                          </div>;
                    }
                    return null;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: LTV vs TRI + CFNI vs Variation de Valeur */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 charts-grid">
        {/* Scatter Plot (LTV vs TRI) */}
        <Card className="card-financial overflow-hidden">
          <CardHeader>
            <CardTitle>TRI fonction de LTV</CardTitle>
            <CardDescription>
              Relation entre le levier et la rentabilité (taille = valeur)
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {(() => {
              // Calculate linear regression
              const n = scatterData.length;
              const sumX = scatterData.reduce((sum, d) => sum + d.ltv, 0);
              const sumY = scatterData.reduce((sum, d) => sum + d.xirr, 0);
              const sumXY = scatterData.reduce((sum, d) => sum + d.ltv * d.xirr, 0);
              const sumX2 = scatterData.reduce((sum, d) => sum + d.ltv * d.ltv, 0);
              const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
              const intercept = (sumY - slope * sumX) / n;

              // Create line data points
              const minX = Math.min(...scatterData.map(d => d.ltv));
              const maxX = Math.max(...scatterData.map(d => d.ltv));
              const lineData = [{
                ltv: minX,
                xirr: slope * minX + intercept
              }, {
                ltv: maxX,
                xirr: slope * maxX + intercept
              }];
              return <ChartContainer config={chartConfig} className="w-full h-full min-h-[250px] md:min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="ltv" name="LTV" tickFormatter={value => `${value.toFixed(0)}%`} />
                      <YAxis type="number" dataKey="xirr" name="TRI" tickFormatter={value => `${value.toFixed(1)}%`} />
                      <Tooltip content={({
                      active,
                      payload
                    }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        const triAttendu = slope * data.ltv + intercept;
                        const triResi = data.xirr - triAttendu;
                        return <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-semibold">{data.name}</p>
                                <p className="text-sm">TRI: {formatPercentage(data.xirr)}</p>
                                <p className="text-sm">TRI Attendu: {formatPercentage(triAttendu)}</p>
                                <p className="text-sm">TRI Resi: <span className={triResi >= 0 ? "text-success" : "text-destructive"}>{formatPercentage(triResi)}</span></p>
                                <p className="text-sm">LTV: {formatPercentage(data.ltv)}</p>
                                <p className="text-sm">Valeur: {formatCurrency(data.valeur)}</p>
                              </div>;
                      }
                      return null;
                    }} />
                      <Scatter data={scatterData} fill="hsl(var(--primary))" fillOpacity={0.6}>
                        {scatterData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isConsolidated ? "hsl(0 84.2% 60.2%)" : "hsl(var(--primary))"} r={isMobile ? 3 : Math.sqrt(entry.size)} />)}
                      </Scatter>
                      {/* Linear Regression Line */}
                      {scatterData.length >= 2 && <Scatter data={lineData} fill="none" line={{
                      stroke: "hsl(var(--destructive))",
                      strokeWidth: 2
                    }} shape={() => null} />}
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartContainer>;
            })()}
          </CardContent>
        </Card>

        {/* CFNI vs Variation de Valeur Scatter Plot */}
        <Card className="card-financial overflow-hidden">
          <CardHeader>
            <CardTitle>Valeur fonction de CFNI</CardTitle>
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
                  {cfniVsValeurData.years.map(year => <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={chartConfig} className="w-full h-full min-h-[250px] md:min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  {/* Grid lines Y-axis */}
                  {cfniAxisConfig.yGridLines.map((line, index) => <ReferenceLine key={`y-${index}`} y={line.value} stroke={line.isPrimary ? "hsl(var(--border))" : "hsl(var(--muted))"} strokeWidth={line.isPrimary ? 1 : 0.5} strokeOpacity={line.isPrimary ? 0.6 : 0.3} />)}
                  {/* Grid lines X-axis */}
                  {cfniAxisConfig.xGridLines.map((line, index) => <ReferenceLine key={`x-${index}`} x={line.value} stroke={line.isPrimary ? "hsl(var(--border))" : "hsl(var(--muted))"} strokeWidth={line.isPrimary ? 1 : 0.5} strokeOpacity={line.isPrimary ? 0.6 : 0.3} />)}
                  {/* Reference lines for axes */}
                  <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={2} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                  <XAxis type="number" dataKey="cfni" name="CFNI" domain={cfniAxisConfig.xDomain} ticks={cfniAxisConfig.xTicks} hide={true} label={{
                    value: 'CFNI',
                    position: 'insideRight',
                    offset: -10,
                    style: {
                      fill: 'hsl(var(--foreground))'
                    }
                  }} />
                  <YAxis type="number" dataKey="deltaValeur" name="Variation Valeur" domain={cfniAxisConfig.yDomain} ticks={cfniAxisConfig.yTicks} tickFormatter={value => formatCurrency(value)} label={{
                    value: 'Variation de Valeur',
                    angle: -90,
                    position: 'insideTop',
                    offset: 10,
                    style: {
                      fill: 'hsl(var(--foreground))'
                    }
                  }} />
                  <Tooltip content={({
                    active,
                    payload
                  }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">CFNI: {formatCurrency(data.cfni)}</p>
                            <p className="text-sm">Δ Valeur: {formatCurrency(data.deltaValeur)}</p>
                            <p className="text-sm font-semibold">Gain: {formatCurrency(data.gain)}</p>
                          </div>;
                    }
                    return null;
                  }} />
                  <Scatter data={cfniVsValeurData.data} fill="hsl(var(--primary))" fillOpacity={0.6}>
                    {cfniVsValeurData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isConsolidated ? "hsl(0 84.2% 60.2%)" : "hsl(var(--primary))"} r={isMobile ? 3 : Math.sqrt(entry.size)} />)}
                  </Scatter>
                  <Customized component={({
                    xAxisMap,
                    yAxisMap
                  }: any) => {
                    if (!xAxisMap || !yAxisMap) return null;
                    const xAxis = xAxisMap[0];
                    const yAxis = yAxisMap[0];
                    if (!xAxis || !yAxis) return null;
                    const yZeroPixel = yAxis.scale(0);
                    return <g>
                          {cfniAxisConfig.xTicks.map((tick, index) => {
                        const xPixel = xAxis.scale(tick);
                        return <text key={index} x={xPixel} y={yZeroPixel + 20} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={12}>
                                {formatCurrency(tick)}
                              </text>;
                      })}
                        </g>;
                  }} />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Rendement Net 2024 + Distribution des Rendements */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 charts-grid">
        {/* Histogram Net Rendement 2024 */}
        <Card className="card-financial overflow-hidden">
          <CardHeader>
            <CardTitle>Distribution des Rendements Net 2024</CardTitle>
            <CardDescription>
              Histogramme avec courbe normale et médiane
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer config={chartConfig} className="w-full h-full min-h-[250px] md:min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData.bins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="range" 
                    angle={isMobile ? -45 : 0} 
                    textAnchor={isMobile ? 'end' : 'middle'} 
                    height={isMobile ? 60 : 40}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    label={{ value: 'Occurrences', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
                            <p className="text-sm font-semibold mb-2">{data.range}</p>
                            <p className="text-sm mb-2">Occurrences: {data.occurrences}</p>
                            <div className="border-t border-border pt-2">
                              <p className="text-xs font-semibold mb-1">Actifs:</p>
                              {data.investments.map((inv: any, idx: number) => (
                                <div key={idx} className="text-xs mb-1">
                                  <span className="font-medium">{inv.investmentName}</span>
                                  <span className="text-muted-foreground ml-1">
                                    ({formatPercentage(inv.rendementNet)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="occurrences" 
                    fill="hsl(200 70% 60%)" 
                    fillOpacity={0.8}
                    stroke="hsl(200 70% 50%)"
                    strokeWidth={1}
                  />
                  {/* Normal distribution curve */}
                  <Line 
                    type="monotone" 
                    dataKey={(data) => {
                      const curvePoint = histogramData.normalCurve.find(
                        c => c.binCenter === data.binCenter
                      );
                      return curvePoint?.normalValue || 0;
                    }}
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={2}
                    dot={false}
                    name="Distribution normale"
                  />
                  {/* Median line */}
                  <ReferenceLine 
                    x={`${histogramData.median.toFixed(1)}%`}
                    stroke="hsl(0 84.2% 60.2%)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ 
                      value: 'Médiane', 
                      position: 'top',
                      fill: 'hsl(0 84.2% 60.2%)',
                      fontSize: 12
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Boxplot Distribution */}
        <Card className="card-financial overflow-hidden">
          <CardHeader>
            <CardTitle>Distribution des Rendements</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              Analyse statistique - Rendement Net et TRI
              <UITooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 cursor-help text-muted-foreground hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <div className="space-y-1 text-sm">
                    <p><strong>Médiane à gauche</strong> = majorité des actifs plutôt faibles, quelques pépites.</p>
                    <p><strong>Médiane à droite</strong> = majorité plutôt solides, quelques boulets.</p>
                    <p><strong>Médiane centrée</strong> = homogénéité.</p>
                  </div>
                </TooltipContent>
              </UITooltip>
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="space-y-6">
              {/* Rendement Net Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-2">Rendement Net (%)</h4>
                <div className="relative">
                  <div className="h-6 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded" style={{
                    background: `linear-gradient(to right, 
                        hsl(0 70% 70%) 0%, 
                        hsl(45 70% 70%) 50%, 
                        hsl(120 70% 70%) 100%)`
                  }} />
                  {boxplotData.rendement && <>
                      {/* Médiane (noir) */}
                      <div className="absolute top-0 h-6 w-1 bg-black" style={{
                      left: `${(boxplotData.rendement.median - boxplotData.rendement.min) / (boxplotData.rendement.max - boxplotData.rendement.min) * 100}%`
                    }} />
                      {/* Moyenne (rouge) */}
                      <div className="absolute top-0 h-6 w-1 bg-red-600" style={{
                      left: `${(boxplotData.rendement.mean - boxplotData.rendement.min) / (boxplotData.rendement.max - boxplotData.rendement.min) * 100}%`
                    }} />
                  <div className="flex justify-between text-xs mt-1">
                    <span>{boxplotData.rendement.min.toFixed(1)}%</span>
                    <span>{boxplotData.rendement.max.toFixed(1)}%</span>
                  </div>
                  <div className="absolute text-xs mt-1" style={{
                      left: `${(boxplotData.rendement.median - boxplotData.rendement.min) / (boxplotData.rendement.max - boxplotData.rendement.min) * 100}%`,
                      transform: 'translateX(-50%)',
                      top: '32px'
                    }}>
                    Médiane: {boxplotData.rendement.median.toFixed(1)}%
                  </div>
                  <div className="absolute text-xs mt-1 text-red-600" style={{
                      left: `${(boxplotData.rendement.mean - boxplotData.rendement.min) / (boxplotData.rendement.max - boxplotData.rendement.min) * 100}%`,
                      transform: 'translateX(-50%)',
                      top: '50px'
                    }}>
                    Moyenne: {boxplotData.rendement.mean.toFixed(1)}%
                  </div>
                    </>}
                </div>
              </div>

              {/* TRI Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-2">TRI (%)</h4>
                <div className="relative">
                  <div className="h-6 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded" style={{
                    background: `linear-gradient(to right, 
                        hsl(0 70% 70%) 0%, 
                        hsl(45 70% 70%) 50%, 
                        hsl(120 70% 70%) 100%)`
                  }} />
                  {boxplotData.xirr && <>
                      {/* Médiane (noir) */}
                      <div className="absolute top-0 h-6 w-1 bg-black" style={{
                      left: `${(boxplotData.xirr.median - boxplotData.xirr.min) / (boxplotData.xirr.max - boxplotData.xirr.min) * 100}%`
                    }} />
                      {/* Moyenne (rouge) */}
                      <div className="absolute top-0 h-6 w-1 bg-red-600" style={{
                      left: `${(boxplotData.xirr.mean - boxplotData.xirr.min) / (boxplotData.xirr.max - boxplotData.xirr.min) * 100}%`
                    }} />
                  <div className="flex justify-between text-xs mt-1">
                    <span>{boxplotData.xirr.min.toFixed(1)}%</span>
                    <span>{boxplotData.xirr.max.toFixed(1)}%</span>
                  </div>
                  <div className="absolute text-xs mt-1" style={{
                      left: `${(boxplotData.xirr.median - boxplotData.xirr.min) / (boxplotData.xirr.max - boxplotData.xirr.min) * 100}%`,
                      transform: 'translateX(-50%)',
                      top: '32px'
                    }}>
                    Médiane: {boxplotData.xirr.median.toFixed(1)}%
                  </div>
                  <div className="absolute text-xs mt-1 text-red-600" style={{
                      left: `${(boxplotData.xirr.mean - boxplotData.xirr.min) / (boxplotData.xirr.max - boxplotData.xirr.min) * 100}%`,
                      transform: 'translateX(-50%)',
                      top: '50px'
                    }}>
                    Moyenne: {boxplotData.xirr.mean.toFixed(1)}%
                  </div>
                    </>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </TooltipProvider>;
}
import { describe, it, expect, vi } from 'vitest';
import { calculateKPIs, calculateXIRR, getSyntheseData, getDefaultKPIs } from '../kpiCalculations';
import { createMockInvestmentData, createMockCashflow, createMockValorisation, createMockDebtFlow, createMockImmobilisation } from '@/test/utils';
import type { InvestmentRawData } from '@/types/kpi';

describe('KPI Calculations', () => {
  describe('calculateKPIs', () => {
    it('should calculate KPIs with valid complete data', () => {
      const mockData = createMockInvestmentData();
      const result = calculateKPIs(mockData);
      
      expect(result).toBeDefined();
      expect(typeof result.fondPropre).toBe('number');
      expect(typeof result.rendementNet).toBe('number');
      expect(typeof result.totalReturn).toBe('number');
      expect(typeof result.xirr).toBe('number');
    });

    it('should handle empty data gracefully', () => {
      const emptyData: InvestmentRawData = {
        cashflows: [],
        valorisations: [],
        debtFlows: [],
        immobilisations: [],
      };
      
      const result = calculateKPIs(emptyData);
      const defaultKPIs = getDefaultKPIs();
      
      expect(result).toEqual(defaultKPIs);
    });

    it('should handle partial data (missing cashflows)', () => {
      const partialData = createMockInvestmentData({
        cashflows: [],
      });
      
      const result = calculateKPIs(partialData);
      
      expect(result).toBeDefined();
      expect(result.rendementNet).toBe(0);
    });

    it('should handle negative values correctly', () => {
      const negativeData = createMockInvestmentData({
        cashflows: [createMockCashflow({ rex: -500, loyer: 1000 })],
      });
      
      const result = calculateKPIs(negativeData);
      
      expect(result).toBeDefined();
      expect(result.rendementNet).toBeLessThan(0.1); // Should be lower due to negative REX
    });

    it('should maintain KPI consistency', () => {
      const mockData = createMockInvestmentData();
      const result = calculateKPIs(mockData);
      
      // Fond propre should equal valeur - crd
      expect(result.fondPropreDetails.valeur - result.fondPropreDetails.crd).toBeCloseTo(result.fondPropre, 2);
    });
  });

  describe('calculateXIRR', () => {
    it('should calculate XIRR with alternating cash flows', () => {
      const syntheseData = [
        { date: '2023-01-01', flux: -100000, valeur: 100000, crd: 80000, fp: 20000 },
        { date: '2023-06-01', flux: 1000, valeur: 105000, crd: 78000, fp: 27000 },
        { date: '2023-12-01', flux: 1000, valeur: 110000, crd: 76000, fp: 34000 },
      ];
      
      const xirr = calculateXIRR(syntheseData);
      
      expect(typeof xirr).toBe('number');
      expect(xirr).toBeGreaterThan(-1);
      expect(xirr).toBeLessThan(10); // Reasonable bounds
    });

    it('should return 0 for all positive flows', () => {
      const positiveFlows = [
        { date: '2023-01-01', flux: 1000, valeur: 100000, crd: 80000, fp: 20000 },
        { date: '2023-06-01', flux: 1000, valeur: 105000, crd: 78000, fp: 27000 },
      ];
      
      const xirr = calculateXIRR(positiveFlows);
      
      expect(xirr).toBe(0);
    });

    it('should return 0 for all negative flows', () => {
      const negativeFlows = [
        { date: '2023-01-01', flux: -1000, valeur: 100000, crd: 80000, fp: 20000 },
        { date: '2023-06-01', flux: -1000, valeur: 105000, crd: 78000, fp: 27000 },
      ];
      
      const xirr = calculateXIRR(negativeFlows);
      
      expect(xirr).toBe(0);
    });

    it('should handle identical dates', () => {
      const sameDateFlows = [
        { date: '2023-01-01', flux: -100000, valeur: 100000, crd: 80000, fp: 20000 },
        { date: '2023-01-01', flux: 1000, valeur: 100000, crd: 80000, fp: 20000 },
      ];
      
      const xirr = calculateXIRR(sameDateFlows);
      
      expect(typeof xirr).toBe('number');
      expect(xirr).toBe(0); // Should handle edge case gracefully
    });
  });

  describe('getSyntheseData', () => {
    it('should aggregate data by date correctly', () => {
      const cashflows = [createMockCashflow({ date: '2023-01-01' })];
      const valorisations = [createMockValorisation({ date: '2023-01-01' })];
      const debtFlows = [createMockDebtFlow({ date: '2023-01-01' })];
      const immobilisations = [createMockImmobilisation({ date: '2023-01-01' })];
      
      const result = getSyntheseData(cashflows, immobilisations, debtFlows, valorisations);
      
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2023-01-01');
      expect(typeof result[0].flux).toBe('number');
      expect(typeof result[0].valeur).toBe('number');
      expect(typeof result[0].crd).toBe('number');
      expect(typeof result[0].fp).toBe('number');
    });

    it('should handle missing data for certain dates', () => {
      const cashflows = [createMockCashflow({ date: '2023-01-01' })];
      const valorisations = [createMockValorisation({ date: '2023-02-01' })];
      const debtFlows = [createMockDebtFlow({ date: '2023-03-01' })];
      const immobilisations = [];
      
      const result = getSyntheseData(cashflows, immobilisations, debtFlows, valorisations);
      
      expect(result.length).toBeGreaterThan(0);
      // Should create entries for all dates
      const dates = result.map(r => r.date);
      expect(dates).toContain('2023-01-01');
      expect(dates).toContain('2023-02-01');
      expect(dates).toContain('2023-03-01');
    });

    it('should sort results chronologically', () => {
      const cashflows = [
        createMockCashflow({ date: '2023-03-01' }),
        createMockCashflow({ date: '2023-01-01' }),
        createMockCashflow({ date: '2023-02-01' }),
      ];
      
      const result = getSyntheseData(cashflows, [], [], []);
      
      expect(result[0].date).toBe('2023-01-01');
      expect(result[1].date).toBe('2023-02-01');
      expect(result[2].date).toBe('2023-03-01');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now();
      
      // Create large dataset
      const largeData = createMockInvestmentData({
        cashflows: Array.from({ length: 1000 }, (_, i) => 
          createMockCashflow({ 
            id: i.toString(),
            date: `2023-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-01`,
          })
        ),
      });
      
      const result = calculateKPIs(largeData);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should be consistent with repeated calculations', () => {
      const mockData = createMockInvestmentData();
      
      const result1 = calculateKPIs(mockData);
      const result2 = calculateKPIs(mockData);
      const result3 = calculateKPIs(mockData);
      
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});
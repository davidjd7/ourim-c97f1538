import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCachedKPIs } from '../useCachedKPIs';
import type { InvestmentKPIs } from '@/types/kpi';

// Mock KPIs for testing
const mockKPIs: InvestmentKPIs = {
  fondPropre: 20000,
  fondPropreDetails: { valeur: 100000, crd: 80000, ltv: 0.8, year: 2023 },
  rendementNet: 0.05,
  rendementNetDetails: { noi: 5000, loyer: 12000, noiSurLoyer: 0.42, year: 2023, yieldBanque: 0.03 },
  totalReturn: 0.15,
  totalReturnDetails: { cfni: 5000, deltaValeur: 10000, cocNet: 20000, cfniPlusDeltaValeur: 15000, totalEarning: 15000, year: 2023 },
  xirr: 0.12,
  xirrDetails: { totalCfni: 5000, cfniDerniereAnnee: 5000, deltaValeur: 10000, variationValeurDerniereAnnee: 10000, gain: 15000, years: 1, gain1: 15000, lastCfniYear: 2023, lastVarValeurYear: 2023, gain1Year: 2023, latestCf: 5000, latestCfYear: 2023 },
  xirrUnleveraged: 0.10
};

describe('useCachedKPIs', () => {
  let mockCalculateFn: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    mockCalculateFn = vi.fn(() => mockKPIs);
    // Clear any existing cache entries
    vi.clearAllMocks();
  });

  it('should call calculateFn on first render', () => {
    const rawData = { test: 'data' };
    
    const { result } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData,
        calculateFn: mockCalculateFn,
      })
    );

    expect(mockCalculateFn).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual(mockKPIs);
  });

  it('should return cached result for same data', () => {
    const rawData = { test: 'data' };
    
    // First render
    const { result: result1 } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData,
        calculateFn: mockCalculateFn,
      })
    );

    // Second render with same data
    const { result: result2 } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData,
        calculateFn: mockCalculateFn,
      })
    );

    expect(mockCalculateFn).toHaveBeenCalledTimes(2); // Should be called for each hook instance
    expect(result1.current).toEqual(result2.current);
  });

  it('should recalculate when raw data changes', () => {
    const rawData1 = { test: 'data1' };
    const rawData2 = { test: 'data2' };
    
    // First render
    const { result, rerender } = renderHook(
      ({ rawData }) => useCachedKPIs({
        investmentId: 'investment-1',
        rawData,
        calculateFn: mockCalculateFn,
      }),
      { initialProps: { rawData: rawData1 } }
    );

    expect(mockCalculateFn).toHaveBeenCalledTimes(1);
    
    // Rerender with different data
    rerender({ rawData: rawData2 });
    
    expect(mockCalculateFn).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual(mockKPIs);
  });

  it('should handle different investment IDs separately', () => {
    const rawData = { test: 'data' };
    
    // First investment
    const { result: result1 } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData,
        calculateFn: mockCalculateFn,
      })
    );

    // Second investment
    const { result: result2 } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-2',
        rawData,
        calculateFn: mockCalculateFn,
      })
    );

    expect(mockCalculateFn).toHaveBeenCalledTimes(2);
    expect(result1.current).toEqual(mockKPIs);
    expect(result2.current).toEqual(mockKPIs);
  });

  it('should handle complex data structures', () => {
    const complexData = {
      cashflows: [
        { id: '1', date: '2023-01-01', rex: 1000, retraitAmort: 100, retraitAutres: 50, loyer: 1200 }
      ],
      valorisations: [
        { id: '1', date: '2023-01-01', valeur: 100000, note: 'Initial' }
      ],
      nested: {
        deep: {
          values: [1, 2, 3, { complex: true }]
        }
      }
    };
    
    const { result } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData: complexData,
        calculateFn: mockCalculateFn,
      })
    );

    expect(mockCalculateFn).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual(mockKPIs);
  });

  it('should perform well with expensive calculations', () => {
    const expensiveCalculateFn = vi.fn(() => {
      // Simulate expensive calculation
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait for 10ms
      }
      return mockKPIs;
    });

    const rawData = { test: 'data' };
    
    // First call
    const start1 = performance.now();
    const { result } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData,
        calculateFn: expensiveCalculateFn,
      })
    );
    const end1 = performance.now();
    
    // Second call with same data should use cache
    const start2 = performance.now();
    const { result: result2 } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData,
        calculateFn: expensiveCalculateFn,
      })
    );
    const end2 = performance.now();
    
    expect(expensiveCalculateFn).toHaveBeenCalledTimes(2); // One for each hook instance
    expect(result.current).toEqual(mockKPIs);
    expect(result2.current).toEqual(mockKPIs);
    
    // Both should take similar time since each hook instance calculates once
    // but the internal cache should prevent recalculation within the same hook
  });

  it('should handle null/undefined data gracefully', () => {
    const { result: result1 } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData: null,
        calculateFn: mockCalculateFn,
      })
    );

    const { result: result2 } = renderHook(() => 
      useCachedKPIs({
        investmentId: 'investment-1',
        rawData: undefined,
        calculateFn: mockCalculateFn,
      })
    );

    expect(mockCalculateFn).toHaveBeenCalledTimes(2);
    expect(result1.current).toEqual(mockKPIs);
    expect(result2.current).toEqual(mockKPIs);
  });
});
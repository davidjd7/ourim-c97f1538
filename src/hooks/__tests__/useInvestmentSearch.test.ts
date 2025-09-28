import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvestmentSearch } from '../useInvestmentSearch';

const mockInvestments = [
  { id: '1', name: 'Appartement Paris 15e', type: 'IMMO', investmentAmount: 250000 },
  { id: '2', name: 'Bureau Lyon', type: 'IMMO', investmentAmount: 180000 },
  { id: '3', name: 'Fond Private Equity Tech', type: 'PE', investmentAmount: 500000 },
  { id: '4', name: 'Villa Marseille', type: 'IMMO', investmentAmount: 320000 },
  { id: '5', name: 'Startup Fund A', type: 'PE', investmentAmount: 100000 },
];

describe('useInvestmentSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with empty search state', () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    expect(result.current.searchQuery).toBe('');
    expect(result.current.debouncedQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.showResults).toBe(false);
    expect(result.current.filteredInvestments).toEqual(mockInvestments);
  });

  it('should update search query and show results', () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('Paris');
    });

    expect(result.current.searchQuery).toBe('Paris');
    expect(result.current.showResults).toBe(true);
  });

  it('should debounce search query', async () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('Pa');
    });

    expect(result.current.debouncedQuery).toBe('');

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.debouncedQuery).toBe('Pa');
  });

  it('should search by name', async () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('Paris');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].name).toBe('Appartement Paris 15e');
  });

  it('should search by type', async () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('PE');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults).toHaveLength(2);
    expect(result.current.searchResults.every(inv => inv.type === 'PE')).toBe(true);
  });

  it('should search by expanded type names', async () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    // Test immobilier search
    act(() => {
      result.current.setSearchQuery('immobilier');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults.length).toBeGreaterThan(0);
    expect(result.current.searchResults.every(inv => inv.type === 'IMMO')).toBe(true);

    // Test private equity search
    act(() => {
      result.current.setSearchQuery('private equity');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults.length).toBeGreaterThan(0);
    expect(result.current.searchResults.every(inv => inv.type === 'PE')).toBe(true);
  });

  it('should limit search results to 8 items', async () => {
    const manyInvestments = Array.from({ length: 15 }, (_, i) => ({
      id: i.toString(),
      name: `Investment ${i}`,
      type: 'IMMO',
      investmentAmount: 100000,
    }));

    const { result } = renderHook(() => useInvestmentSearch(manyInvestments));

    act(() => {
      result.current.setSearchQuery('Investment');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults).toHaveLength(8);
  });

  it('should return empty results for queries less than 2 characters', async () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('P');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.showResults).toBe(false);
  });

  it('should filter all investments for table display', () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('IMMO');
    });

    const immoInvestments = result.current.filteredInvestments;
    expect(immoInvestments).toHaveLength(3);
    expect(immoInvestments.every(inv => inv.type === 'IMMO')).toBe(true);
  });

  it('should be case insensitive', async () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('PARIS');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].name).toBe('Appartement Paris 15e');
  });

  it('should handle empty investment list', () => {
    const { result } = renderHook(() => useInvestmentSearch([]));

    act(() => {
      result.current.setSearchQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.filteredInvestments).toEqual([]);
  });

  it('should reset results when search is cleared', () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('Paris');
    });

    expect(result.current.showResults).toBe(true);

    act(() => {
      result.current.setSearchQuery('');
    });

    expect(result.current.showResults).toBe(false);
    expect(result.current.filteredInvestments).toEqual(mockInvestments);
  });

  it('should handle special characters in search', async () => {
    const specialInvestments = [
      { id: '1', name: 'Café du Commerce', type: 'IMMO', investmentAmount: 150000 },
      { id: '2', name: 'Société & Associés', type: 'PE', investmentAmount: 200000 },
    ];

    const { result } = renderHook(() => useInvestmentSearch(specialInvestments));

    act(() => {
      result.current.setSearchQuery('Café');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].name).toBe('Café du Commerce');
  });

  it('should handle multiple search terms', async () => {
    const { result } = renderHook(() => useInvestmentSearch(mockInvestments));

    act(() => {
      result.current.setSearchQuery('Fund Tech');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Should find partial matches
    const results = result.current.searchResults;
    expect(results.length).toBeGreaterThan(0);
  });
});
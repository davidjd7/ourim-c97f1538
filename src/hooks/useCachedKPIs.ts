import { useMemo } from 'react';
import type { InvestmentKPIs } from '@/types/kpi';

// Simple memory cache with data hash for invalidation
const kpiCache = new Map<string, InvestmentKPIs>();

// Generate hash for cache key
const generateCacheKey = (investmentId: string, dataHash: string): string => {
  return `${investmentId}_${dataHash}`;
};

// Generate hash from raw data for cache invalidation
const generateDataHash = (data: any): string => {
  return JSON.stringify(data).split('').reduce((hash, char) => {
    const chr = char.charCodeAt(0);
    hash = ((hash << 5) - hash) + chr;
    return hash & hash; // Convert to 32bit integer
  }, 0).toString();
};

interface UseCachedKPIsOptions {
  investmentId: string;
  rawData: any;
  calculateFn: () => InvestmentKPIs;
}

export function useCachedKPIs({ investmentId, rawData, calculateFn }: UseCachedKPIsOptions): InvestmentKPIs {
  return useMemo(() => {
    // Generate data hash for cache invalidation
    const dataHash = generateDataHash(rawData);
    const cacheKey = generateCacheKey(investmentId, dataHash);
    
    // Check if we have cached result
    const cached = kpiCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Calculate new KPIs
    const kpis = calculateFn();
    
    // Cache the result
    kpiCache.set(cacheKey, kpis);
    
    // Clean old cache entries for this investment (keep only latest)
    const keysToDelete: string[] = [];
    kpiCache.forEach((_, key) => {
      if (key.startsWith(`${investmentId}_`) && key !== cacheKey) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => kpiCache.delete(key));
    
    return kpis;
  }, [investmentId, rawData, calculateFn]);
}

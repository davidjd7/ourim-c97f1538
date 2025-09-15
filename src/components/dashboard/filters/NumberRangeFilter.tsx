import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { ColumnConfig } from '@/contexts/ColumnVisibilityContext';

interface NumberRangeFilterProps {
  column: ColumnConfig;
  onFilterApplied: () => void;
  onClose: () => void;
}

export function NumberRangeFilter({ column, onFilterApplied, onClose }: NumberRangeFilterProps) {
  const { getFilterValue, setColumnFilter, clearColumnFilter } = useColumnFilters();
  const currentFilter = getFilterValue(column.key).numberRange || {};
  
  const [min, setMin] = useState<string>(currentFilter.min?.toString() || '');
  const [max, setMax] = useState<string>(currentFilter.max?.toString() || '');

  useEffect(() => {
    const currentFilter = getFilterValue(column.key).numberRange || {};
    setMin(currentFilter.min?.toString() || '');
    setMax(currentFilter.max?.toString() || '');
  }, [column.key, getFilterValue]);

  const handleApply = () => {
    const minValue = min ? parseFloat(min) : undefined;
    const maxValue = max ? parseFloat(max) : undefined;

    if (minValue !== undefined || maxValue !== undefined) {
      setColumnFilter(column.key, { 
        numberRange: { min: minValue, max: maxValue } 
      });
    } else {
      clearColumnFilter(column.key);
    }
    onFilterApplied();
  };

  const handleClear = () => {
    setMin('');
    setMax('');
    clearColumnFilter(column.key);
    onFilterApplied();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatLabel = (type: string) => {
    switch (type) {
      case 'currency':
        return '€';
      case 'percentage':
        return '%';
      default:
        return '';
    }
  };

  const suffix = formatLabel(column.type || '');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="min-value" className="text-xs">
            Min {suffix && `(${suffix})`}
          </Label>
          <Input
            id="min-value"
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-value" className="text-xs">
            Max {suffix && `(${suffix})`}
          </Label>
          <Input
            id="max-value"
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!min && !max}
        >
          Effacer
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
        >
          Appliquer
        </Button>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { ColumnConfig } from '@/contexts/ColumnVisibilityContext';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  column: ColumnConfig;
  options: SelectOption[];
  onFilterApplied: () => void;
  onClose: () => void;
}

export function SelectFilter({ column, options, onFilterApplied, onClose }: SelectFilterProps) {
  const { getFilterValue, setColumnFilter, clearColumnFilter } = useColumnFilters();
  const [selectedValues, setSelectedValues] = useState<string[]>(
    getFilterValue(column.key).select || []
  );

  useEffect(() => {
    setSelectedValues(getFilterValue(column.key).select || []);
  }, [column.key, getFilterValue]);

  const handleToggle = (value: string) => {
    setSelectedValues(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleApply = () => {
    if (selectedValues.length > 0) {
      setColumnFilter(column.key, { select: selectedValues });
    } else {
      clearColumnFilter(column.key);
    }
    onFilterApplied();
  };

  const handleClear = () => {
    setSelectedValues([]);
    clearColumnFilter(column.key);
    onFilterApplied();
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      setSelectedValues([]);
    } else {
      setSelectedValues(options.map(option => option.value));
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedValues.length} sélectionné(s)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs p-1 h-auto"
          >
            {selectedValues.length === options.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
        </div>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${column.key}-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
              />
              <label
                htmlFor={`${column.key}-${option.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={selectedValues.length === 0}
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
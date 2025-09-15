import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { ColumnConfig } from '@/contexts/ColumnVisibilityContext';

interface TextFilterProps {
  column: ColumnConfig;
  onFilterApplied: () => void;
  onClose: () => void;
}

export function TextFilter({ column, onFilterApplied, onClose }: TextFilterProps) {
  const { getFilterValue, setColumnFilter, clearColumnFilter } = useColumnFilters();
  const [value, setValue] = useState(getFilterValue(column.key).text || '');

  useEffect(() => {
    setValue(getFilterValue(column.key).text || '');
  }, [column.key, getFilterValue]);

  const handleApply = () => {
    if (value.trim()) {
      setColumnFilter(column.key, { text: value.trim() });
    } else {
      clearColumnFilter(column.key);
    }
    onFilterApplied();
  };

  const handleClear = () => {
    setValue('');
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

  return (
    <div className="space-y-3">
      <Input
        placeholder={`Rechercher dans ${column.label.toLowerCase()}...`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!value}
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
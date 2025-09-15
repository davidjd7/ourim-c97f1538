import React from 'react';
import { ColumnConfig } from '@/contexts/ColumnVisibilityContext';
import { TextFilter } from './TextFilter';
import { NumberRangeFilter } from './NumberRangeFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { SelectFilter } from './SelectFilter';
import { TagsFilter } from './TagsFilter';

interface FilterPopoverProps {
  column: ColumnConfig;
  onFilterApplied: () => void;
  onClose: () => void;
}

export function FilterPopover({ column, onFilterApplied, onClose }: FilterPopoverProps) {
  const getFilterComponent = () => {
    switch (column.type) {
      case 'currency':
      case 'percentage':
        return (
          <NumberRangeFilter
            column={column}
            onFilterApplied={onFilterApplied}
            onClose={onClose}
          />
        );
      case 'date':
        return (
          <DateRangeFilter
            column={column}
            onFilterApplied={onFilterApplied}
            onClose={onClose}
          />
        );
      case 'text':
        if (column.key === 'type') {
          return (
            <SelectFilter
              column={column}
              options={[
                { value: 'IMMO', label: 'Immobilier' },
                { value: 'PE', label: 'Private Equity' }
              ]}
              onFilterApplied={onFilterApplied}
              onClose={onClose}
            />
          );
        }
        if (column.key === 'tags') {
          return (
            <TagsFilter
              column={column}
              onFilterApplied={onFilterApplied}
              onClose={onClose}
            />
          );
        }
        return (
          <TextFilter
            column={column}
            onFilterApplied={onFilterApplied}
            onClose={onClose}
          />
        );
      default:
        return (
          <TextFilter
            column={column}
            onFilterApplied={onFilterApplied}
            onClose={onClose}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="font-medium text-sm">
        Filtrer par {column.label}
      </div>
      {getFilterComponent()}
    </div>
  );
}
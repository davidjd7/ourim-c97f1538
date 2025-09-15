import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FilterPopover } from './FilterPopover';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { ColumnConfig } from '@/contexts/ColumnVisibilityContext';
import { cn } from '@/lib/utils';

interface FilterIconProps {
  column: ColumnConfig;
  onFilterApplied?: () => void;
}

export function FilterIcon({ column, onFilterApplied }: FilterIconProps) {
  const { isFilterActive } = useColumnFilters();
  const [open, setOpen] = React.useState(false);

  const isActive = isFilterActive(column.key);

  const handleFilterApplied = () => {
    onFilterApplied?.();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0 hover:bg-muted/50",
            isActive && "text-primary bg-primary/10"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 bg-popover border shadow-md z-50"
        align="start"
        side="bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <FilterPopover
          column={column}
          onFilterApplied={handleFilterApplied}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
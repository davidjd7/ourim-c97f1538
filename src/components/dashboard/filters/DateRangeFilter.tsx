import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { ColumnConfig } from '@/contexts/ColumnVisibilityContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  column: ColumnConfig;
  onFilterApplied: () => void;
  onClose: () => void;
}

export function DateRangeFilter({ column, onFilterApplied, onClose }: DateRangeFilterProps) {
  const { getFilterValue, setColumnFilter, clearColumnFilter } = useColumnFilters();
  const currentFilter = getFilterValue(column.key).dateRange || {};
  
  const [fromDate, setFromDate] = useState<Date | undefined>(currentFilter.from);
  const [toDate, setToDate] = useState<Date | undefined>(currentFilter.to);

  useEffect(() => {
    const currentFilter = getFilterValue(column.key).dateRange || {};
    setFromDate(currentFilter.from);
    setToDate(currentFilter.to);
  }, [column.key, getFilterValue]);

  const handleApply = () => {
    if (fromDate || toDate) {
      setColumnFilter(column.key, { 
        dateRange: { from: fromDate, to: toDate } 
      });
    } else {
      clearColumnFilter(column.key);
    }
    onFilterApplied();
  };

  const handleClear = () => {
    setFromDate(undefined);
    setToDate(undefined);
    clearColumnFilter(column.key);
    onFilterApplied();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Date de début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fromDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, "d MMM yyyy", { locale: fr }) : "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border shadow-md z-[60]" align="start">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={setFromDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Date de fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !toDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {toDate ? format(toDate, "d MMM yyyy", { locale: fr }) : "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border shadow-md z-[60]" align="start">
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!fromDate && !toDate}
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
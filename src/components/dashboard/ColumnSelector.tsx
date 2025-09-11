import React, { useState } from 'react';
import { Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';

export function ColumnSelector() {
  const { visibleColumns, hiddenColumns, updateColumnVisibility } = useColumnVisibility();
  const [isOpen, setIsOpen] = useState(false);

  const handleColumnToggle = (key: string, visible: boolean) => {
    updateColumnVisibility(key, visible);
    // Keep the popover open for multiple selections
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end" side="bottom">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Configuration des colonnes</h4>
          
          {visibleColumns.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Colonnes visibles</p>
              <div className="space-y-1">
                {visibleColumns.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleColumnToggle(column.key, false)}
                  >
                    <span className="text-sm">{column.label}</span>
                    <Check className="h-4 w-4 text-success" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {hiddenColumns.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Colonnes masquées</p>
                <div className="space-y-1">
                  {hiddenColumns.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleColumnToggle(column.key, true)}
                    >
                      <span className="text-sm text-muted-foreground">{column.label}</span>
                      <div className="h-4 w-4" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
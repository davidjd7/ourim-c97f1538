import React, { useState } from 'react';
import { Settings, Check, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableColumnItemProps {
  column: {
    key: string;
    label: string;
    visible: boolean;
    required?: boolean;
  };
  onToggle: (key: string, visible: boolean) => void;
  isDragDisabled?: boolean;
}

function SortableColumnItem({ column, onToggle, isDragDisabled = false }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isInteractive = !column.required;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between py-2 px-2 rounded group ${
        isDragging ? 'bg-muted/50 shadow-md' : ''
      } ${isInteractive ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-75'}`}
      onClick={isInteractive ? () => onToggle(column.key, !column.visible) : undefined}
    >
      <div className="flex items-center gap-2 flex-1">
        {!isDragDisabled && isInteractive && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        <span className={`text-sm flex items-center gap-2 ${
          column.visible ? '' : 'text-muted-foreground'
        }`}>
          {column.label}
          {column.required && (
            <span className="text-xs text-primary font-medium px-1.5 py-0.5 bg-primary/10 rounded">
              Obligatoire
            </span>
          )}
        </span>
      </div>
      {column.visible ? (
        <Check className={`h-4 w-4 text-success ${!isInteractive ? 'opacity-50' : ''}`} />
      ) : (
        <div className="h-4 w-4" />
      )}
    </div>
  );
}

export function ColumnSelector() {
  const { visibleColumns, hiddenColumns, updateColumnVisibility, reorderColumns } = useColumnVisibility();
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Only start dragging after moving 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleColumnToggle = (key: string, visible: boolean) => {
    updateColumnVisibility(key, visible);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const allColumns = [...visibleColumns];
      const oldIndex = allColumns.findIndex((col) => col.key === active.id);
      const newIndex = allColumns.findIndex((col) => col.key === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Calculate global indices for reordering
        const allColumnsGlobal = [...visibleColumns, ...hiddenColumns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const globalOldIndex = allColumnsGlobal.findIndex((col) => col.key === active.id);
        const globalNewIndex = allColumnsGlobal.findIndex((col) => col.key === over.id);
        
        reorderColumns(globalOldIndex, globalNewIndex);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover-scale">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-4 bg-card border shadow-lg z-50" align="end" side="bottom">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Configuration des colonnes</h4>
          <p className="text-xs text-muted-foreground">
            Glissez pour réorganiser • Cliquez pour masquer/afficher
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Colonnes visibles - Colonne de gauche */}
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium">Colonnes visibles</p>
              {visibleColumns.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={visibleColumns.map(col => col.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {visibleColumns.map((column) => (
                        <SortableColumnItem
                          key={column.key}
                          column={column}
                          onToggle={handleColumnToggle}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-xs text-muted-foreground italic py-4">
                  Aucune colonne visible
                </div>
              )}
            </div>

            {/* Colonnes masquées - Colonne de droite */}
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium">Colonnes masquées</p>
              {hiddenColumns.length > 0 ? (
                <div className="space-y-1">
                  {hiddenColumns.map((column) => (
                    <SortableColumnItem
                      key={column.key}
                      column={column}
                      onToggle={handleColumnToggle}
                      isDragDisabled={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic py-4">
                  Aucune colonne masquée
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { ColumnConfig } from '@/contexts/ColumnVisibilityContext';
import { useTags } from '@/hooks/useTags';

interface TagsFilterProps {
  column: ColumnConfig;
  onFilterApplied: () => void;
  onClose: () => void;
}

export function TagsFilter({ column, onFilterApplied, onClose }: TagsFilterProps) {
  const { getFilterValue, setColumnFilter, clearColumnFilter } = useColumnFilters();
  const { tags, loading } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    getFilterValue(column.key).tags || []
  );

  useEffect(() => {
    setSelectedTags(getFilterValue(column.key).tags || []);
  }, [column.key, getFilterValue]);

  const handleToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleApply = () => {
    if (selectedTags.length > 0) {
      setColumnFilter(column.key, { tags: selectedTags });
    } else {
      clearColumnFilter(column.key);
    }
    onFilterApplied();
  };

  const handleClear = () => {
    setSelectedTags([]);
    clearColumnFilter(column.key);
    onFilterApplied();
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des tags...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          {selectedTags.length} tag(s) sélectionné(s)
        </div>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={selectedTags.includes(tag.id)}
                onCheckedChange={() => handleToggle(tag.id)}
              />
              <label
                htmlFor={`tag-${tag.id}`}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Badge
                  variant="outline"
                  style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
                >
                  {tag.name}
                </Badge>
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
          disabled={selectedTags.length === 0}
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
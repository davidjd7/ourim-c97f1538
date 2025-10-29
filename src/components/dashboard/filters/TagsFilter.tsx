import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { ColumnConfig } from '@/contexts/ColumnVisibilityContext';
import { useTags } from '@/hooks/useTags';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TagsFilterProps {
  column: ColumnConfig;
  onFilterApplied: () => void;
  onClose: () => void;
}

export function TagsFilter({ column, onFilterApplied, onClose }: TagsFilterProps) {
  const { getFilterValue, setColumnFilter, clearColumnFilter } = useColumnFilters();
  const { tags, loading } = useTags();
  const filterValue = getFilterValue(column.key);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    filterValue.tags || []
  );
  const [matchMode, setMatchMode] = useState<'OR' | 'AND'>(
    filterValue.tagsMatchMode || 'OR'
  );

  useEffect(() => {
    const currentFilter = getFilterValue(column.key);
    setSelectedTags(currentFilter.tags || []);
    setMatchMode(currentFilter.tagsMatchMode || 'OR');
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
      setColumnFilter(column.key, { tags: selectedTags, tagsMatchMode: matchMode });
    } else {
      clearColumnFilter(column.key);
    }
    onFilterApplied();
  };

  const handleClear = () => {
    setSelectedTags([]);
    setMatchMode('OR');
    clearColumnFilter(column.key);
    onFilterApplied();
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des tags...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTags.length} tag(s) sélectionné(s)
          </div>
          {selectedTags.length > 1 && (
            <ToggleGroup 
              type="single" 
              value={matchMode} 
              onValueChange={(value) => value && setMatchMode(value as 'OR' | 'AND')}
              size="sm"
            >
              <ToggleGroupItem value="OR" className="text-xs px-2 py-1">
                OU
              </ToggleGroupItem>
              <ToggleGroupItem value="AND" className="text-xs px-2 py-1">
                ET
              </ToggleGroupItem>
            </ToggleGroup>
          )}
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
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInvestmentTags, useTags } from '@/hooks/useTags';
import { useUserRole } from '@/hooks/useUserRole';

interface InvestmentTagsProps {
  investmentId: string;
}

export function InvestmentTags({ investmentId }: InvestmentTagsProps) {
  const [open, setOpen] = useState(false);
  const { canEdit } = useUserRole();
  const { investmentTags, addTagToInvestment, removeTagFromInvestment, loading: tagsLoading } = useInvestmentTags(investmentId);
  const { tags } = useTags();

  // Get available tags (not already assigned to this investment)
  const availableTags = tags.filter(tag => 
    !investmentTags.some(it => it.tag_id === tag.id)
  );

  const handleAddTag = async (tagId: string) => {
    await addTagToInvestment(tagId);
    setOpen(false);
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromInvestment(tagId);
  };

  if (tagsLoading) {
    return <div className="flex items-center gap-2">
      <div className="w-12 h-6 bg-muted animate-pulse rounded-full" />
      <div className="w-16 h-6 bg-muted animate-pulse rounded-full" />
    </div>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Display current tags */}
      {investmentTags.map((investmentTag) => (
        <Badge 
          key={investmentTag.id}
          variant="secondary"
          style={{ 
            backgroundColor: investmentTag.tag.color + '20',
            color: investmentTag.tag.color,
            borderColor: investmentTag.tag.color + '40'
          }}
          className="flex items-center gap-1 border"
        >
          {investmentTag.tag.name}
          {canEdit && (
            <button
              onClick={() => handleRemoveTag(investmentTag.tag_id)}
              className="ml-1 hover:bg-black/20 rounded-full p-0.5"
              title="Retirer le tag"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}

      {/* Add tag button */}
      {canEdit && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" side="bottom" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un tag..." />
              <CommandEmpty>Aucun tag trouvé.</CommandEmpty>
              <CommandGroup>
                {availableTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => handleAddTag(tag.id)}
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
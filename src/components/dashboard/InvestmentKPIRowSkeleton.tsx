import { Skeleton } from '@/components/ui/skeleton';
import { TableRow, TableCell } from '@/components/ui/table';

interface InvestmentKPIRowSkeletonProps {
  visibleColumns: Array<{ key: string; label: string; align?: 'left' | 'right'; type?: string }>;
}

export function InvestmentKPIRowSkeleton({ visibleColumns }: InvestmentKPIRowSkeletonProps) {
  return (
    <TableRow>
      {/* Checkbox column */}
      <TableCell>
        <Skeleton className="h-4 w-4 rounded" />
      </TableCell>
      
      {/* Data columns */}
      {visibleColumns.map((column) => (
        <TableCell key={column.key} className={column.align === 'right' ? 'text-right' : ''}>
          {column.key === 'name' ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : column.key === 'type' ? (
            <Skeleton className="h-5 w-16 rounded-full" />
          ) : column.key === 'tags' ? (
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ) : column.type === 'currency' || column.type === 'percentage' ? (
            <div className={`flex flex-col ${column.align === 'right' ? 'items-end' : 'items-start'}`}>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-10 mt-1" />
            </div>
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
        </TableCell>
      ))}
      
      {/* Action column */}
      <TableCell>
        <Skeleton className="h-8 w-8 rounded" />
      </TableCell>
    </TableRow>
  );
}
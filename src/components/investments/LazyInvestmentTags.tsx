import React, { lazy, Suspense } from 'react';

// Lazy load the InvestmentTags component
const InvestmentTagsComponent = lazy(() => 
  import('./InvestmentTags').then(module => ({
    default: module.InvestmentTags
  }))
);

interface LazyInvestmentTagsProps {
  investmentId: string;
}

const TagsSkeleton = () => (
  <div className="flex items-center gap-2">
    <div className="w-12 h-6 bg-muted animate-pulse rounded-full" />
    <div className="w-16 h-6 bg-muted animate-pulse rounded-full" />
  </div>
);

export function LazyInvestmentTags({ investmentId }: LazyInvestmentTagsProps) {
  return (
    <Suspense fallback={<TagsSkeleton />}>
      <InvestmentTagsComponent investmentId={investmentId} />
    </Suspense>
  );
}
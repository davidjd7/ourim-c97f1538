import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success';
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  variant = 'default'
}: KPICardProps) {
  return (
    <div className={cn(
      "card-financial p-6",
      variant === 'primary' && "card-financial-primary",
      variant === 'success' && "bg-gradient-to-br from-success to-success-light text-success-foreground border-0",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            variant === 'default' && "bg-primary-lighter text-primary",
            variant === 'primary' && "bg-white/20 text-primary-foreground",
            variant === 'success' && "bg-white/20 text-success-foreground"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={cn(
              "text-sm font-medium",
              variant === 'default' && "text-muted-foreground",
              (variant === 'primary' || variant === 'success') && "text-current opacity-90"
            )}>
              {title}
            </p>
            <p className={cn(
              "text-2xl font-bold financial-value",
              variant === 'default' && "text-foreground",
              (variant === 'primary' || variant === 'success') && "text-current"
            )}>
              {value}
            </p>
            {subtitle && (
              <p className={cn(
                "text-sm",
                variant === 'default' && "text-muted-foreground",
                (variant === 'primary' || variant === 'success') && "text-current opacity-80"
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {trend && (
          <div className={cn(
            "text-right",
            trend.direction === 'up' ? "text-success" : "text-destructive",
            (variant === 'primary' || variant === 'success') && "text-current opacity-90"
          )}>
            <span className="text-sm font-medium">
              {trend.direction === 'up' ? '+' : ''}
              {trend.value}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
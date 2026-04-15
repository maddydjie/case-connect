import * as React from 'react';
import { cn } from '../lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'critical' | 'warning' | 'normal';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const statusColors: Record<StatusIndicatorProps['status'], string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
  critical: 'bg-red-600',
  warning: 'bg-amber-500',
  normal: 'bg-green-500',
};

const sizes = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function StatusIndicator({ status, label, size = 'md', pulse }: StatusIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              statusColors[status],
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', sizes[size], statusColors[status])} />
      </span>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}

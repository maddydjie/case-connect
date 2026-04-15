import { type ReactNode } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%]',
        className,
      )}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200/80 dark:border-gray-700/60 bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-900/40 dark:to-gray-950/40 py-20 px-8 text-center backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="mt-5 text-lg font-bold text-gray-900 dark:text-gray-100">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-200/80 dark:border-red-900/40 bg-gradient-to-b from-red-50/80 to-white dark:from-red-950/20 dark:to-gray-950/40 py-16 px-8 text-center backdrop-blur-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-950/40 shadow-sm glow-red">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <p className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-100">{title}</p>
      {message && <p className="mt-2 max-w-sm text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary mt-6 inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';

/** Reusable skeleton primitives */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/** Card skeleton for dashboard cards */
export function SkeletonCard({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {children ?? (
        <>
          <Skeleton className="mb-3 h-4 w-1/3" />
          <Skeleton className="mb-2 h-8 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </>
      )}
    </div>
  );
}

/** Ticket row skeleton */
export function SkeletonTicketRow() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="mb-2 h-5 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-3 flex gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/** Map skeleton */
export function SkeletonMap({ height = '450px' }: { height?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
      style={{ height }}
    >
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading map…</p>
      </div>
    </div>
  );
}

/** Dashboard page skeleton — full layout */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SkeletonMap height="320px" />
        <SkeletonCard>
          <Skeleton className="mb-3 h-4 w-1/2" />
          <Skeleton className="mb-2 h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </SkeletonCard>
      </div>
      <SkeletonCard>
        <Skeleton className="mb-4 h-5 w-1/3" />
        <SkeletonTicketRow />
        <SkeletonTicketRow />
      </SkeletonCard>
    </div>
  );
}

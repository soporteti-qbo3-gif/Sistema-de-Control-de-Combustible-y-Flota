import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-5 space-y-4 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1 max-w-xs">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>

      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <Skeleton
            key={idx}
            className={`h-3 ${idx === rows - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
};

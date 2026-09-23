import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 mb-5 border-b border-slate-200/80 dark:border-slate-800/80 ${className}`}
    >
      <div className="space-y-1 min-w-0">
        {breadcrumbs && <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">{breadcrumbs}</div>}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            {title}
          </h1>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 pt-1 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
};

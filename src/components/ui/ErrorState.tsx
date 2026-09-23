import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocurrió un error',
  message,
  onRetry,
  retryLabel = 'Reintentar',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200 tracking-tight">
        {title}
      </h4>
      <p className="text-xs text-rose-700/90 dark:text-rose-300/80 mt-1 max-w-sm leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="border-rose-200 text-rose-900 hover:bg-rose-100/50 dark:border-rose-800 dark:text-rose-200"
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

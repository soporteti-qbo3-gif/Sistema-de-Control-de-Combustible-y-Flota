import React from 'react';

export type BadgeVariant =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'APROBADO'
  | 'VALIDADO'
  | 'RECHAZADO'
  | 'REQUIERE_REVISION'
  | 'ANOMALIA'
  | 'neutral'
  | 'brand';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  dot = false,
  className = '',
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    PENDIENTE: {
      container:
        'bg-amber-50 text-amber-800 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      dot: 'bg-amber-500',
    },
    APROBADA: {
      container:
        'bg-emerald-50 text-emerald-800 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
    },
    APROBADO: {
      container:
        'bg-emerald-50 text-emerald-800 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
    },
    VALIDADO: {
      container:
        'bg-indigo-50 text-indigo-800 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
      dot: 'bg-indigo-500',
    },
    RECHAZADO: {
      container:
        'bg-rose-50 text-rose-800 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      dot: 'bg-rose-500',
    },
    REQUIERE_REVISION: {
      container:
        'bg-orange-50 text-orange-800 border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
      dot: 'bg-orange-500',
    },
    ANOMALIA: {
      container:
        'bg-rose-100/70 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700/70',
      dot: 'bg-rose-600 animate-pulse',
    },
    brand: {
      container:
        'bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
      dot: 'bg-indigo-500',
    },
    neutral: {
      container:
        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const current = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border font-mono tracking-tight select-none ${current.container} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${current.dot}`} />}
      {children}
    </span>
  );
};

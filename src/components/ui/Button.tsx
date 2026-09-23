import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs border border-indigo-500/30 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:border-indigo-400/20 focus-visible:outline-indigo-600',
      secondary:
        'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-800 focus-visible:outline-slate-500',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100 focus-visible:outline-slate-500',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-rose-500/30 dark:bg-rose-700 dark:hover:bg-rose-600 focus-visible:outline-rose-600',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-2.5 py-1.5 text-xs min-h-[38px] sm:min-h-[32px] gap-1.5',
      md: 'px-3.5 py-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[38px] gap-2',
      lg: 'px-4 py-2.5 text-sm min-h-[48px] sm:min-h-[44px] gap-2.5',
      icon: 'p-2 min-w-[44px] min-h-[44px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && <span className="flex-shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

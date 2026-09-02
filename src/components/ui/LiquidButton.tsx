import React, { useState, useRef } from 'react';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'rose' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  glow = true,
  onClick,
  disabled = false,
  ...rest
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const rippleSize = Math.max(rect.width, rect.height) * 2;
      const newRipple = {
        id: Date.now() + Math.random(),
        x: clickX,
        y: clickY,
        size: rippleSize,
      };

      setRipples((prev) => [...prev.slice(-3), newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 700);
    }

    if (onClick) {
      onClick(e);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600/50 shadow-emerald-900/20';
      case 'amber':
        return 'bg-amber-600 hover:bg-amber-500 text-white border-amber-600/50 shadow-amber-900/20';
      case 'rose':
        return 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600/50 shadow-rose-900/20';
      case 'secondary':
        return 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-slate-200/50';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100 text-slate-700 border-transparent shadow-none';
      case 'primary':
      default:
        return 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800 shadow-slate-900/30';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1.5 text-xs rounded-md min-h-[32px]';
      case 'lg':
        return 'px-5 py-3 text-sm rounded-xl min-h-[48px]';
      case 'md':
      default:
        return 'px-3.5 py-2 text-xs font-semibold rounded-lg min-h-[38px]';
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      className={`relative overflow-hidden inline-flex items-center justify-center space-x-2 font-semibold transition-all duration-200 active:scale-[0.98] select-none border shadow-sm ${getVariantStyles()} ${getSizeStyles()} ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      {...rest}
    >
      {/* Liquid fluid reflection highlight */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none transition-transform duration-700 ${
          isHovered ? 'translate-x-full' : '-translate-x-full'
        }`}
      />

      {/* Dynamic Fluid Circular Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none bg-white/25 animate-ping opacity-75"
          style={{
            top: ripple.y - ripple.size / 2,
            left: ripple.x - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            animationDuration: '650ms',
          }}
        />
      ))}

      {/* Button Content */}
      <span className="relative z-10 flex items-center space-x-1.5">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
};

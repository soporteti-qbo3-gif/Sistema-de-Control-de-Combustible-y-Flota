import React, { useEffect, useRef } from 'react';

interface LiquidWaveGaugeProps {
  percentage: number; // 0 to 100
  title?: string;
  subtitle?: string;
  valueFormatted?: string;
  size?: 'sm' | 'md' | 'lg';
  showBubbles?: boolean;
  className?: string;
  color?: string;
}

export const LiquidWaveGauge: React.FC<LiquidWaveGaugeProps> = ({
  percentage = 75,
  title,
  subtitle,
  valueFormatted,
  size = 'md',
  showBubbles = true,
  className = '',
  color = '#10b981',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrame = useRef<number | null>(null);

  const clampedPct = Math.max(0, Math.min(100, percentage));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;
    const bubbles: Array<{ x: number; y: number; r: number; vy: number; alpha: number }> = [];

    if (showBubbles) {
      for (let i = 0; i < 8; i++) {
        bubbles.push({
          x: Math.random() * canvas.width,
          y: canvas.height * (1 - clampedPct / 100) + Math.random() * (canvas.height * (clampedPct / 100)),
          r: 1 + Math.random() * 2.5,
          vy: 0.4 + Math.random() * 0.8,
          alpha: 0.3 + Math.random() * 0.4,
        });
      }
    }

    const render = () => {
      step += 0.035;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const waveHeight = 5;
      const fillY = height * (1 - clampedPct / 100);

      // Back wave
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 3) {
        const y = fillY + Math.sin(x * 0.04 + step * 0.8) * waveHeight;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = `${color}40`;
      ctx.fill();
      ctx.restore();

      // Front wave
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 3) {
        const y = fillY + Math.sin(x * 0.05 + step + Math.PI) * (waveHeight * 0.85);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, fillY, 0, height);
      waveGrad.addColorStop(0, `${color}80`);
      waveGrad.addColorStop(1, `${color}ee`);

      ctx.fillStyle = waveGrad;
      ctx.fill();
      ctx.restore();

      // Bubbles
      if (showBubbles) {
        ctx.save();
        bubbles.forEach((b) => {
          b.y -= b.vy;
          if (b.y < fillY) {
            b.y = height - 2;
            b.x = Math.random() * width;
          }
          ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha})`;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      animFrame.current = requestAnimationFrame(render);
    };

    animFrame.current = requestAnimationFrame(render);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [clampedPct, color, showBubbles]);

  const sizeStyles = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-24 h-24 text-sm',
    lg: 'w-32 h-32 text-base',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`relative ${sizeStyles} rounded-full overflow-hidden border-2 border-slate-300 bg-slate-50 shadow-inner flex items-center justify-center`}
      >
        <canvas ref={canvasRef} width={128} height={128} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-x-2 top-1 h-2 rounded-full bg-white/40 filter blur-[0.5px] pointer-events-none" />
        <div className="relative z-10 text-center font-bold text-slate-900 drop-shadow-sm px-1">
          <span className="text-sm sm:text-base font-black tracking-tight">{Math.round(clampedPct)}%</span>
          {valueFormatted && <p className="text-[9px] text-slate-700 font-medium leading-none">{valueFormatted}</p>}
        </div>
      </div>
      {(title || subtitle) && (
        <div className="mt-1 text-center">
          {title && <p className="text-[11px] font-bold text-slate-800 tracking-tight">{title}</p>}
          {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Código de Barras Digital con Acentos de Color
 * Genera una representación SVG nítida de código de barras (estilo Code 128)
 * con colores vibrantes según el estado (Aprobado, Activo, Verificado)
 */

import React from 'react';

interface DigitalBarcodeProps {
  code: string;
  colorTheme?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'violet';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  subtext?: string;
}

export const DigitalBarcode: React.FC<DigitalBarcodeProps> = ({
  code,
  colorTheme = 'blue',
  size = 'md',
  showText = true,
  className = '',
  subtext,
}) => {
  // Generar un patrón determinista de líneas basado en el texto del código
  const generateBars = (str: string) => {
    const bars: { width: number; gap: number }[] = [];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    const patternBase = Math.abs(hash).toString(2).padStart(32, '1');
    const fullPattern = patternBase + patternBase.split('').reverse().join('') + '101011';

    for (let i = 0; i < Math.min(fullPattern.length, 48); i += 2) {
      const bit1 = fullPattern[i] === '1';
      const bit2 = fullPattern[i + 1] === '1';
      const width = bit1 && bit2 ? 3 : bit1 || bit2 ? 2 : 1.2;
      const gap = bit1 ? 2 : 1.5;
      bars.push({ width, gap });
    }
    return bars;
  };

  const bars = generateBars(code || 'AUT-0000');

  const themeStyles = {
    blue: {
      barFill: '#2563EB',
      accentBg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      badge: 'bg-blue-600 text-white',
    },
    emerald: {
      barFill: '#059669',
      accentBg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-600 text-white',
    },
    indigo: {
      barFill: '#4F46E5',
      accentBg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      badge: 'bg-indigo-600 text-white',
    },
    amber: {
      barFill: '#D97706',
      accentBg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-600 text-white',
    },
    violet: {
      barFill: '#7C3AED',
      accentBg: 'bg-violet-50',
      border: 'border-violet-200',
      text: 'text-violet-900',
      badge: 'bg-violet-600 text-white',
    },
  };

  const currentTheme = themeStyles[colorTheme] || themeStyles.blue;

  const heights = {
    xs: 18,
    sm: 26,
    md: 38,
    lg: 52,
  };

  const height = heights[size];

  // Calcular ancho total del SVG
  let currentX = 4;
  const barElements = bars.map((b, i) => {
    const x = currentX;
    currentX += b.width + b.gap;
    return (
      <rect
        key={i}
        x={x}
        y={0}
        width={b.width}
        height={height}
        rx={0.5}
        fill={currentTheme.barFill}
      />
    );
  });
  const totalSvgWidth = currentX + 4;

  return (
    <div
      className={`inline-flex flex-col items-center bg-white ${currentTheme.border} border rounded-md p-2 shadow-xs select-none ${className}`}
    >
      {/* Visual Barcode SVG */}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${totalSvgWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-w-[220px]"
      >
        {barElements}
      </svg>

      {/* Código alfanumérico */}
      {showText && (
        <div className="mt-1 flex items-center justify-between w-full px-1">
          <span className={`font-mono text-xs font-bold tracking-widest ${currentTheme.text}`}>
            {code}
          </span>
          {subtext && (
            <span className="text-[10px] font-mono text-slate-500 uppercase font-medium">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

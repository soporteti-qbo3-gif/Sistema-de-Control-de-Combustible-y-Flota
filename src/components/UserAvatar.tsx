/**
 * Componente de Identidad Visual para Usuarios y Conductores
 * Muestra iniciales tipográficas nítidas en monospace con alto contraste y sin decoraciones infantiles
 */

import React from 'react';
import { User } from 'lucide-react';
import { UserRole } from '../types';

interface UserAvatarProps {
  nombre?: string;
  rol?: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRoleBadge?: boolean;
}

export const getIniciales = (nombre?: string): string => {
  if (!nombre) return 'FC';
  const partes = nombre.trim().replace(/^Lic\.\s+/i, '').split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  nombre = '',
  rol,
  size = 'md',
  className = '',
  showRoleBadge = false,
}) => {
  const iniciales = getIniciales(nombre);
  const isAdmin = rol === 'ADMIN';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-bold',
    xl: 'w-12 h-12 text-base font-bold',
  };

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-md flex items-center justify-center font-mono font-medium tracking-tight select-none border transition-colors ${
          isAdmin
            ? 'bg-slate-900 text-white border-slate-800'
            : 'bg-slate-100 text-slate-800 border-slate-300'
        }`}
        title={`${nombre} ${rol ? `(${rol})` : ''}`}
      >
        {iniciales || <User className="w-1/2 h-1/2" />}
      </div>

      {showRoleBadge && rol && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
            isAdmin ? 'bg-blue-600' : 'bg-emerald-600'
          }`}
          title={isAdmin ? 'Administrador' : 'Conductor'}
        />
      )}
    </div>
  );
};

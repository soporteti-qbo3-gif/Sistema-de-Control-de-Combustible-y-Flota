/**
 * Componente de Identidad Visual para Usuarios y Choferes (Sin fotografías externas)
 * Muestra Iniciales tipográficas estilizadas o icono de perfil
 */

import React from 'react';
import { User, ShieldCheck } from 'lucide-react';
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
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-lg font-bold',
  };

  const badgeSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-semibold tracking-tight select-none border transition-all ${
          isAdmin
            ? 'bg-slate-900 text-white border-slate-800'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
        title={`${nombre} ${rol ? `(${rol})` : ''}`}
      >
        {iniciales || <User className="w-1/2 h-1/2" />}
      </div>

      {showRoleBadge && rol && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses[size]} rounded-full border-2 border-white ${
            isAdmin ? 'bg-slate-700' : 'bg-emerald-600'
          }`}
          title={isAdmin ? 'Administrador' : 'Conductor'}
        />
      )}
    </div>
  );
};

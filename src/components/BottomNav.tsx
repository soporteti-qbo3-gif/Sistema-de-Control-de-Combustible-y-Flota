/**
 * Barra de Navegación Inferior (Mobile PWA) - Estética SaaS Moderno
 * Diseño táctil con objetivos accesibles >=44px y estados activos claros
 */

import React from 'react';
import {
  Home,
  FilePlus,
  History,
  Truck,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  vistaActiva: string;
  setVistaActiva: (v: string) => void;
  solicitudesPendientesCount?: number;
  cargasPendientesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  vistaActiva,
  setVistaActiva,
  solicitudesPendientesCount = 0,
  cargasPendientesCount = 0,
}) => {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'ADMIN';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }

  const itemsConductor: NavItem[] = [
    { id: 'conductor-home', label: 'Inicio', icon: Home },
    { id: 'conductor-registrar', label: 'Registrar', icon: FilePlus },
    { id: 'conductor-cargas', label: 'Historial', icon: History },
    { id: 'conductor-vehiculo', label: 'Vehículo', icon: Truck },
  ];

  const itemsAdmin: NavItem[] = [
    { id: 'admin-dashboard', label: 'Inicio', icon: LayoutDashboard },
    {
      id: 'admin-validacion',
      label: 'Auditoría',
      icon: CheckCircle2,
      badge: cargasPendientesCount,
    },
    {
      id: 'admin-solicitudes',
      label: 'Tokens',
      icon: KeyRound,
      badge: solicitudesPendientesCount,
    },
    { id: 'admin-vehiculos', label: 'Flota', icon: Truck },
  ];

  const items = isAdmin ? itemsAdmin : itemsConductor;

  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1 pb-2 safe-area-pb transition-colors duration-150"
      aria-label="Navegación Móvil Principal"
    >
      <div className="flex items-center justify-around h-13 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = vistaActiva === item.id;

          return (
            <button
              key={item.id}
              id={`btn-bottom-nav-${item.id}`}
              onClick={() => setVistaActiva(item.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] relative rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.2px] text-indigo-600 dark:text-indigo-400' : 'stroke-[1.8px]'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-3.5 px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
                <span
                  className={`text-[11px] mt-1 tracking-tight ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 font-medium'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

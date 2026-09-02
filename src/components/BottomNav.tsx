/**
 * Barra de Navegación Inferior (Bottom Navigation) Mobile-First PWA
 * Diseñada para pulgar, con objetivos táctiles de 44px+ e insignias de estado
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
  Settings,
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
    { id: 'conductor-registrar', label: 'Subir Docs', icon: FilePlus },
    { id: 'conductor-cargas', label: 'Historial', icon: History },
    { id: 'conductor-vehiculo', label: 'Mi Unidad', icon: Truck },
  ];

  const itemsAdmin: NavItem[] = [
    { id: 'admin-dashboard', label: 'Inicio', icon: LayoutDashboard },
    {
      id: 'admin-validacion',
      label: 'Validar',
      icon: CheckCircle2,
      badge: cargasPendientesCount,
    },
    {
      id: 'admin-solicitudes',
      label: 'Solicitudes',
      icon: KeyRound,
      badge: solicitudesPendientesCount,
    },
    { id: 'admin-vehiculos', label: 'Flota', icon: Truck },
  ];

  const items = isAdmin ? itemsAdmin : itemsConductor;

  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-2 py-0.5 safe-area-pb"
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
              className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] relative rounded-md transition-colors ${
                isActive
                  ? 'text-slate-900'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2px] text-slate-900' : 'stroke-[1.7px] text-slate-400'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <span
                  className={`text-[10px] mt-1 font-medium tracking-tight ${
                    isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

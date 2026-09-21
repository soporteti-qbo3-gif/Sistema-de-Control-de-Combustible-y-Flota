/**
 * Barra Lateral de Navegación del Sistema (Desktop y Mobile Drawer)
 */

import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Users,
  KeyRound,
  FileCheck2,
  Wrench,
  BarChart3,
  Bell,
  Wallet,
  FlaskConical,
  X,
  Gauge,
  PlusCircle,
  History,
  Car,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  vistaActiva: string;
  setVistaActiva: (v: string) => void;
  solicitudesPendientesCount?: number;
  cargasPendientesCount?: number;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge: React.ReactNode;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  vistaActiva,
  setVistaActiva,
  solicitudesPendientesCount = 0,
  cargasPendientesCount = 0,
  mobileMenuOpen = false,
  onCloseMobileMenu,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'ADMIN';

  const menuAdmin: MenuItem[] = [
    {
      id: 'admin-dashboard',
      label: 'Panel General',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'admin-solicitudes',
      label: 'Autorizaciones y Tokens',
      icon: KeyRound,
      badge: solicitudesPendientesCount > 0 ? solicitudesPendientesCount : null,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      id: 'admin-validacion',
      label: 'Auditoría y Validación IA',
      icon: FileCheck2,
      badge: cargasPendientesCount > 0 ? cargasPendientesCount : null,
      badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    {
      id: 'admin-vehiculos',
      label: 'Catálogo de Vehículos',
      icon: Truck,
      badge: null,
    },
    {
      id: 'admin-conductores',
      label: 'Gestión de Conductores',
      icon: Users,
      badge: null,
    },
    {
      id: 'admin-administradores',
      label: 'Administradores y Accesos',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'admin-mantenimientos',
      label: 'Mantenimientos',
      icon: Wrench,
      badge: null,
    },
    {
      id: 'admin-saldos',
      label: 'Caja Chica y Saldos Prepago',
      icon: Wallet,
      badge: null,
    },
    {
      id: 'admin-reportes',
      label: 'Reportes y Métricas',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'centro-notificaciones',
      label: 'Centro de Avisos',
      icon: Bell,
      badge: null,
    },
    {
      id: 'admin-configuracion',
      label: 'Configuración y Feriados',
      icon: Settings,
      badge: null,
    },
    {
      id: 'pruebas-unitarias',
      label: 'Pruebas Unitarias',
      icon: FlaskConical,
      badge: null,
    },
  ];

  const menuConductor: MenuItem[] = [
    {
      id: 'conductor-home',
      label: 'Mi Cabina',
      icon: Gauge,
      badge: null,
    },
    {
      id: 'conductor-registrar',
      label: 'Registrar Carga',
      icon: PlusCircle,
      badge: null,
    },
    {
      id: 'conductor-cargas',
      label: 'Mis Cargas Realizadas',
      icon: History,
      badge: null,
    },
    {
      id: 'conductor-vehiculo',
      label: 'Mi Vehículo Asignado',
      icon: Car,
      badge: null,
    },
    {
      id: 'centro-notificaciones',
      label: 'Mis Notificaciones',
      icon: Bell,
      badge: null,
    },
  ];

  const menuItems = isAdmin ? menuAdmin : menuConductor;

  const handleSelect = (id: string) => {
    setVistaActiva(id);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#F6F6F8]/95 backdrop-blur-md text-slate-700 border-r border-black/[0.08] w-56 sm:w-60 select-none">
      {/* Header móvil */}
      <div className="lg:hidden p-3.5 border-b border-black/[0.06] flex items-center justify-between">
        <span className="font-bold text-xs text-[#1C1C1E]">Navegación</span>
        <button
          onClick={onCloseMobileMenu}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-black/[0.05]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Indicador de Rol */}
      <div className="px-3.5 py-2.5 border-b border-black/[0.06] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isAdmin ? 'bg-[#007AFF]' : 'bg-[#34C759]'
            }`}
          />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isAdmin ? 'Administración' : 'Conductor'}
          </span>
        </div>

        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/[0.05] transition-colors"
            title="Ocultar barra lateral"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lista de Enlaces */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = vistaActiva === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all ${
                isActive
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'hover:bg-black/[0.04] text-slate-700 hover:text-black'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1.5 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#FF3B30] text-white shadow-xs'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Pie de barra */}
      <div className="p-3 border-t border-black/[0.06] text-[11px] text-slate-500 bg-white/40">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">FlotaControl</span>
          <span className="text-slate-600 font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-black/[0.08] shadow-2xs">
            v2.4 HIG
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fijo a la izquierda con animación suave de colapso) */}
      <aside
        className={`hidden lg:block h-[calc(100vh-3.25rem)] sticky top-13 flex-shrink-0 transition-all duration-200 ease-out ${
          sidebarCollapsed ? 'w-0 overflow-hidden opacity-0 pointer-events-none' : 'w-52 sm:w-56 opacity-100'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer (Modal) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileMenu}
          />
          <div className="relative flex-1 flex flex-col max-w-[260px] w-full bg-[#f8fafc] z-50 shadow-lg border-r border-slate-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

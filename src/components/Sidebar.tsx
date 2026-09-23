/**
 * Barra Lateral de Navegación Empresarial
 * Estructura departamental por áreas operativas con tipografía sobria y sin elementos infantiles
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
  PanelLeftClose,
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
  badge?: number | null;
  seccion?: string;
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

  const seccionesAdmin = [
    {
      titulo: 'OPERACIONES',
      items: [
        {
          id: 'admin-dashboard',
          label: 'Panel General',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'admin-solicitudes',
          label: 'Autorizaciones & Tokens',
          icon: KeyRound,
          badge: solicitudesPendientesCount > 0 ? solicitudesPendientesCount : null,
        },
        {
          id: 'admin-validacion',
          label: 'Auditoría IA de Cargas',
          icon: FileCheck2,
          badge: cargasPendientesCount > 0 ? cargasPendientesCount : null,
        },
        {
          id: 'admin-saldos',
          label: 'Saldos & Caja Chica',
          icon: Wallet,
          badge: null,
        },
      ],
    },
    {
      titulo: 'FLOTA & EQUIPO',
      items: [
        {
          id: 'admin-vehiculos',
          label: 'Parque Vehicular',
          icon: Truck,
          badge: null,
        },
        {
          id: 'admin-conductores',
          label: 'Conductores',
          icon: Users,
          badge: null,
        },
        {
          id: 'admin-mantenimientos',
          label: 'Mantenimientos',
          icon: Wrench,
          badge: null,
        },
        {
          id: 'admin-administradores',
          label: 'Accesos y Roles',
          icon: ShieldCheck,
          badge: null,
        },
      ],
    },
    {
      titulo: 'ANÁLISIS & SISTEMA',
      items: [
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
          label: 'Configuración',
          icon: Settings,
          badge: null,
        },
        {
          id: 'pruebas-unitarias',
          label: 'Pruebas Unitarias',
          icon: FlaskConical,
          badge: null,
        },
      ],
    },
  ];

  const menuConductor: MenuItem[] = [
    {
      id: 'conductor-home',
      label: 'Cabina Operativa',
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
      label: 'Vehículo Asignado',
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

  const handleSelect = (id: string) => {
    setVistaActiva(id);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-slate-200 w-56 sm:w-60 select-none">
      {/* Header móvil */}
      <div className="lg:hidden p-3 border-b border-slate-200 flex items-center justify-between">
        <span className="font-semibold text-xs text-slate-900">Navegación</span>
        <button
          onClick={onCloseMobileMenu}
          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Indicador de Rol */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-slate-900" />
          <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-wider">
            {isAdmin ? 'Mando Central' : 'Conductor'}
          </span>
        </div>

        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Ocultar barra lateral"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lista de Enlaces */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {isAdmin ? (
          seccionesAdmin.map((sec) => (
            <div key={sec.titulo} className="space-y-1">
              <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-wider px-2 block mb-1">
                {sec.titulo}
              </span>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = vistaActiva === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ml-1.5 ${
                          isActive
                            ? 'bg-slate-800 text-white'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-wider px-2 block mb-1">
              OPERACIÓN CONDUCTOR
            </span>
            {menuConductor.map((item) => {
              const Icon = item.icon;
              const isActive = vistaActiva === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-link-${item.id}`}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Pie de barra */}
      <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-700">FlotaControl</span>
          <span className="text-slate-600 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">
            v2.4
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block h-[calc(100vh-3.25rem)] sticky top-13 flex-shrink-0 transition-all duration-150 ease-out ${
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
          <div className="relative flex-1 flex flex-col max-w-[260px] w-full bg-white z-50 shadow-xl border-r border-slate-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

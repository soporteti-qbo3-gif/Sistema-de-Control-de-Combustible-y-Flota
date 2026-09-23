/**
 * Barra Lateral de Navegación Empresarial - Estética SaaS Linear/Notion
 * Fondo sutil e indicador visual lateral refinado para items activos
 */

import React, { useEffect } from 'react';
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
  X,
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

  // Soporte de accesibilidad: tecla Escape cierra menú en móvil
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen && onCloseMobileMenu) {
        onCloseMobileMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, onCloseMobileMenu]);

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
          id: 'admin-administradores',
          label: 'Administradores',
          icon: ShieldCheck,
          badge: null,
        },
        {
          id: 'admin-mantenimientos',
          label: 'Mantenimiento Preventivo',
          icon: Wrench,
          badge: null,
        },
      ],
    },
    {
      titulo: 'ANÁLISIS & SISTEMA',
      items: [
        {
          id: 'admin-reportes',
          label: 'Reportes & Métricas',
          icon: BarChart3,
          badge: null,
        },
        {
          id: 'centro-notificaciones',
          label: 'Notificaciones',
          icon: Bell,
          badge: null,
        },
        {
          id: 'admin-configuracion',
          label: 'Configuración Sistema',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  const menuConductor = [
    {
      id: 'conductor-home',
      label: 'Panel Conductor',
      icon: LayoutDashboard,
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
      label: 'Mis Despachos',
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800/80 w-60 select-none transition-colors duration-150">
      {/* Header móvil */}
      <div className="lg:hidden p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">Menú de Navegación</span>
        <button
          onClick={onCloseMobileMenu}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Indicador de Rol */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {isAdmin ? 'Mando Central' : 'Conductor'}
          </span>
        </div>

        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Ocultar barra lateral"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lista de Enlaces */}
      <nav className="flex-1 px-3 py-3.5 space-y-4 overflow-y-auto">
        {isAdmin ? (
          seccionesAdmin.map((sec) => (
            <div key={sec.titulo} className="space-y-1">
              <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 block mb-1">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-400 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-md ml-1.5 bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
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
            <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 block mb-1">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Pie de barra */}
      <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 dark:text-slate-200">FlotaControl</span>
          <span className="font-mono text-[10px] text-slate-400">v2.6.2</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Menú Desktop (con colapso suave) */}
      <aside
        id="app-desktop-sidebar"
        className={`hidden lg:block h-[calc(100vh-3.5rem)] sticky top-14 transition-all duration-200 z-20 flex-shrink-0 ${
          sidebarCollapsed ? 'w-0 overflow-hidden opacity-0 pointer-events-none' : 'w-60 opacity-100'
        }`}
      >
        {navContent}
      </aside>

      {/* Menú Móvil Modal / Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileMenu}
          />
          <div className="relative z-10 w-64 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

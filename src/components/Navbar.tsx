/**
 * Barra Superior de Navegación Ejecutiva - Estilo SaaS Moderno (Linear/Notion)
 * Top Bar Contract: Brand mark sólido + Contexto Operativo + Toggle Tema + Menú de Cuenta
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  ChevronDown,
  Bell,
  FlaskConical,
  Menu,
  X,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { NotificacionSistema } from '../types';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  vistaActiva: string;
  setVistaActiva: (v: string) => void;
  solicitudesPendientesCount?: number;
  cargasPendientesCount?: number;
  onOpenMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  vistaActiva,
  setVistaActiva,
  onOpenMobileMenu,
  mobileMenuOpen,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { usuario, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [dropdownUserOpen, setDropdownUserOpen] = useState(false);
  const [dropdownNotifOpen, setDropdownNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionSistema[]>([]);

  const cargarNotifs = async () => {
    try {
      const data = await api.getNotificaciones();
      setNotificaciones(data.slice(0, 6));
    } catch (e) {
      console.warn('Error al cargar notificaciones en navbar:', e);
    }
  };

  useEffect(() => {
    cargarNotifs();
    const interval = setInterval(cargarNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Accesibilidad: Tecla Escape cierra menús abiertos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownUserOpen(false);
        setDropdownNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const noLeidasCount = notificaciones.filter((n) => !n.leido).length;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 w-full transition-colors duration-150"
    >
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Zona 1: Marca e Identidad Operativa */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-mobile-menu-toggle"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Toggle Menú Lateral en Desktop */}
            {onToggleSidebar && (
              <button
                id="btn-desktop-sidebar-toggle"
                onClick={onToggleSidebar}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium transition-colors cursor-pointer"
                title={sidebarCollapsed ? 'Desplegar menú lateral' : 'Colapsar menú lateral'}
              >
                {sidebarCollapsed ? (
                  <>
                    <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[11px]">Menú</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="text-[11px]">Ocultar</span>
                  </>
                )}
              </button>
            )}

            <div
              className="flex items-center space-x-2.5 cursor-pointer select-none group"
              onClick={() => setVistaActiva(usuario?.rol === 'ADMIN' ? 'admin-dashboard' : 'conductor-home')}
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs group-hover:bg-indigo-700 transition-colors">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                    FlotaControl
                  </span>
                  <span className="hidden md:inline-block font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40 uppercase tracking-wider font-semibold">
                    Linear OS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-none hidden sm:block">
                  Control y Telemetría de Combustible
                </p>
              </div>
            </div>
          </div>

          {/* Zona 2: Acciones Rápidas & Cuenta */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Toggle de Modo Oscuro / Claro */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema de interfaz"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Botón Pruebas Unitarias */}
            <button
              id="btn-nav-unit-tests"
              onClick={() => setVistaActiva('pruebas-unitarias')}
              className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                vistaActiva === 'pruebas-unitarias'
                  ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-600 dark:border-indigo-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
              title="Suite de pruebas automatizadas"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pruebas</span>
            </button>

            {/* Campana de Notificaciones con Dropdown */}
            <div className="relative">
              <button
                id="btn-nav-notificaciones"
                onClick={() => {
                  setDropdownNotifOpen(!dropdownNotifOpen);
                  setDropdownUserOpen(false);
                }}
                className={`relative p-2 rounded-lg transition-colors border cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  dropdownNotifOpen || vistaActiva === 'centro-notificaciones'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-800'
                }`}
                title="Avisos y Notificaciones"
                aria-label="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {noLeidasCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white font-mono font-medium text-[10px] flex items-center justify-center shadow-xs">
                    {noLeidasCount}
                  </span>
                )}
              </button>

              {/* Menú flotante de Notificaciones */}
              {dropdownNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownNotifOpen(false)} />
                  <div
                    id="dropdown-notificaciones-panel"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 p-3 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 px-1 mb-2">
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Notificaciones del Sistema
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setVistaActiva('centro-notificaciones');
                          setDropdownNotifOpen(false);
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center cursor-pointer"
                      >
                        Ver todas <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                          No hay avisos pendientes.
                        </p>
                      ) : (
                        notificaciones.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              api.marcarNotificacionLeida(n.id);
                              if (n.accionUrl) setVistaActiva(n.accionUrl);
                              setDropdownNotifOpen(false);
                            }}
                            className={`p-2.5 rounded-lg text-left cursor-pointer transition-colors border ${
                              n.leido
                                ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
                                : 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/50 text-slate-900 dark:text-slate-100 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold truncate pr-2 text-slate-900 dark:text-slate-100">
                                {n.titulo}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                                {n.prioridad}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {n.contenido}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block font-mono">
                              {new Date(n.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Selector de Usuario y Rol */}
            <div className="relative">
              <button
                id="btn-user-demo-dropdown"
                onClick={() => {
                  setDropdownUserOpen(!dropdownUserOpen);
                  setDropdownNotifOpen(false);
                }}
                className="flex items-center space-x-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer"
              >
                <UserAvatar
                  nombre={usuario?.nombre}
                  rol={usuario?.rol}
                  size="xs"
                  showRoleBadge={true}
                />

                <div className="hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {usuario?.nombre}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                      {usuario?.rol === 'ADMIN' ? 'Admin' : 'Conductor'}
                    </span>
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Menú Dropdown de Usuario / Sesión Activa */}
              {dropdownUserOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownUserOpen(false)} />
                  <div
                    id="dropdown-user-menu"
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 p-3.5 transition-all"
                  >
                    <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <UserAvatar
                        nombre={usuario?.nombre || 'Usuario'}
                        rol={usuario?.rol || 'CONDUCTOR'}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {usuario?.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {usuario?.email}
                        </p>
                        <span
                          className={`inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium ${
                            usuario?.rol === 'ADMIN'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                              : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50'
                          }`}
                        >
                          {usuario?.rol === 'ADMIN' ? 'Administrador' : 'Conductor'}
                        </span>
                      </div>
                    </div>

                    {usuario?.telefonoContacto && (
                      <div className="py-2.5 text-[11px] text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 dark:text-slate-500">Teléfono:</span> {usuario.telefonoContacto}
                      </div>
                    )}

                    <div className="pt-2.5">
                      <button
                        id="btn-logout"
                        onClick={() => {
                          setDropdownUserOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-medium transition-colors border border-rose-200/80 dark:border-rose-900/50 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
